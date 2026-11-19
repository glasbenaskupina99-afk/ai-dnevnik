const SITE_DATA = window.AI_DNEVNIK_DATA || {
  categoryLabels: {
    modeli: "Modeli in raziskave",
    slovenija: "Slovenija in EU",
    posel: "Posel in infrastruktura",
    robotika: "Robotika in znanost",
    zanimivo: "Zanimivo z X"
  },
  tickerItems: [],
  articles: []
};

const SITE_CONFIG = window.AI_DNEVNIK_CONFIG || {
  siteName: "AI Dnevnik",
  siteUrl: "https://aidnevnik.si",
  contactEmail: "urednistvo@aidnevnik.si",
  newsletter: {
    mode: "demo",
    endpoint: "",
    doubleOptInNote: "Na vaš e-naslov smo poslali potrditveno povezavo (dvojna privolitev)."
  },
  analytics: {}
};

const CATEGORY_LABELS = SITE_DATA.categoryLabels;
const TICKER_ITEMS = SITE_DATA.tickerItems;
const ARTICLES = SITE_DATA.articles;
const MODELS_DATA = window.AI_DNEVNIK_MODELS || {
  updatedAt: "2026-11-14",
  sources: [],
  models: []
};
const WEEKLY_SUMMARY = window.AI_DNEVNIK_WEEKLY || null;

const store = {
  get(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  set(key, value) {
    try { localStorage.setItem(key, value); } catch { /* shramba ni na voljo */ }
  }
};

function readJson(key, fallback) {
  try { return JSON.parse(store.get(key) || "") ?? fallback; } catch { return fallback; }
}

const MONTHS_SHORT = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "avg", "sep", "okt", "nov", "dec"];
const ARCHIVE_PAGE = 12;
const GRID_COUNT = 7;

function articleUrl(id) {
  return `clanek/${id}.html`;
}

function shortDate(item) {
  const d = new Date(item.timestamp);
  if (Number.isNaN(d.getTime())) return item.dateLabel;
  return `${d.getDate()}. ${MONTHS_SHORT[d.getMonth()]}`;
}

function sourcesLabel(n) {
  const mod100 = n % 100;
  if (mod100 === 1) return `${n} vir`;
  if (mod100 === 2) return `${n} vira`;
  if (mod100 === 3 || mod100 === 4) return `${n} viri`;
  return `${n} virov`;
}

function metaLine(item, { long = false } = {}) {
  const parts = [
    `<span>${long ? item.dateLabel : shortDate(item)}</span>`,
    `<span>${item.readMinutes} min${long ? " branja" : ""}</span>`
  ];
  const n = (item.sources || []).length;
  if (n) parts.push(`<span class="meta-sources" title="${(item.sources || []).map((s) => s.label.split(" — ")[0]).join(", ")}">${sourcesLabel(n)}</span>`);
  return `<div class="card-meta">${parts.join("")}</div>`;
}

function badgeHtml(item, { withFlag = true } = {}) {
  const flag = withFlag && item.breaking ? `<span class="badge-flag">Udarno</span>` : "";
  return `<span class="badge cat-${item.category}">${flag}${CATEGORY_LABELS[item.category]}</span>`;
}

function photoHtml(item, { lazy = true, credit = true } = {}) {
  if (!item.imageUrl) {
    const art = window.createCategoryArt ? window.createCategoryArt(item.category, item.id) : "";
    return `<span class="art-fallback">${art}</span>${credit && item.imageCredit ? `<span class="photo-credit">${item.imageCredit}</span>` : ""}`;
  }
  return `<img src="${item.imageUrl}" alt="${item.imageAlt}"${lazy ? ' loading="lazy"' : ""} decoding="async" data-art-category="${item.category}" data-art-seed="${item.id}" referrerpolicy="no-referrer" />${credit ? `<span class="photo-credit">${item.imageCredit}</span>` : ""}`;
}

function bookmarkBtn(id, size = 14) {
  return `<button type="button" class="bookmark-mini ${isBookmarked(id) ? "saved" : ""}" data-bookmark-id="${id}" aria-label="${isBookmarked(id) ? "Odstrani iz shranjenih" : "Shrani članek"}">
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
  </button>`;
}

const state = {
  category: "vse",
  search: "",
  sort: "newest",
  modelProvider: "vsi",
  modelSort: "intelligence",
  chartMetric: "intelligence",
  bookmarks: readJson("aidnevnik_bookmarks", []),
  theme: store.get("aidnevnik_theme") || "light",
  archiveVisible: ARCHIVE_PAGE
};

const els = {
  html: document.documentElement,
  themeToggle: document.getElementById("theme-toggle"),
  themeLabel: document.getElementById("theme-label"),
  bookmarksToggle: document.getElementById("bookmarks-toggle"),
  bookmarkCount: document.getElementById("bookmark-count"),
  searchInput: document.getElementById("search-input"),
  clearSearch: document.getElementById("clear-search"),
  categoryTabs: document.getElementById("category-tabs"),
  tickerTrack: document.getElementById("ticker-track"),
  filterBanner: document.getElementById("filter-banner"),
  filterStatusText: document.getElementById("filter-status-text"),
  resetFiltersBtn: document.getElementById("reset-filters-btn"),
  emptyResetBtn: document.getElementById("empty-reset-btn"),
  resetHome: document.getElementById("reset-home"),
  heroSection: document.getElementById("hero-section"),
  heroLead: document.getElementById("hero-lead"),
  heroSide: document.getElementById("hero-side"),
  pulseSection: document.getElementById("pulse-section"),
  feedHeading: document.getElementById("feed-heading"),
  sortSelect: document.getElementById("sort-select"),
  articlesGrid: document.getElementById("articles-grid"),
  feedColumn: document.querySelector(".feed-column"),
  emptyState: document.getElementById("empty-state"),
  trendingList: document.getElementById("trending-list"),
  newsletterForm: document.getElementById("newsletter-form"),
  newsletterEmail: document.getElementById("newsletter-email"),
  newsletterConsent: document.getElementById("newsletter-consent"),
  newsletterFeedback: document.getElementById("newsletter-feedback"),
  archiveBlock: document.getElementById("archive-block"),
  archiveList: document.getElementById("archive-list"),
  loadMoreBtn: document.getElementById("load-more-btn"),
  categoryNav: document.querySelector(".category-nav"),
  drawer: document.getElementById("bookmarks-drawer"),
  drawerCloseBtn: document.getElementById("drawer-close-btn"),
  bookmarksList: document.getElementById("bookmarks-list"),
  modelsUpdatedLabel: document.getElementById("models-updated-label"),
  modelProviderFilters: document.getElementById("model-provider-filters"),
  modelSortSelect: document.getElementById("model-sort-select"),
  chartMetricToggle: document.getElementById("chart-metric-toggle"),
  modelsChartWrap: document.getElementById("models-chart-wrap"),
  chartTooltip: document.getElementById("chart-tooltip"),
  chatLeaderboardList: document.getElementById("chat-leaderboard-list"),
  modelsTableBody: document.getElementById("models-table-body"),
  modelsSources: document.getElementById("models-sources"),
  weeklySection: document.getElementById("weekly-summary-section")
};

function attachImageFallbacks(root = document) {
  if (window.attachArtFallbacks) window.attachArtFallbacks(root);
}

function applyTheme(theme) {
  state.theme = theme;
  els.html.setAttribute("data-theme", theme);
  els.themeLabel.textContent = theme === "dark" ? "Svetli način" : "Temni način";
  store.set("aidnevnik_theme", theme);
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) themeMeta.setAttribute("content", theme === "dark" ? "#14130f" : "#f7f4ee");
}

function saveBookmarks() {
  store.set("aidnevnik_bookmarks", JSON.stringify(state.bookmarks));
  els.bookmarkCount.textContent = String(state.bookmarks.length);
}

function isBookmarked(id) {
  return state.bookmarks.includes(id);
}

function toggleBookmark(id, event) {
  if (event) event.stopPropagation();
  if (isBookmarked(id)) {
    state.bookmarks = state.bookmarks.filter((item) => item !== id);
  } else {
    state.bookmarks.push(id);
  }
  saveBookmarks();
  renderAll();
  if (!els.drawer.classList.contains("hidden")) {
    renderBookmarksDrawer();
  }
}

function renderTicker() {
  const itemsHtml = TICKER_ITEMS.map(
    (item) => `
      <a class="ticker-item" href="${articleUrl(item.articleId)}">
        <span class="ticker-time">${item.time}</span>
        <span>${item.text}</span>
      </a>
    `
  ).join("");
  // Vsebina je podvojena, da trak teče brez preskoka (animacija premakne za -50 %).
  els.tickerTrack.innerHTML = itemsHtml + itemsHtml.replace(/<a /g, '<a tabindex="-1" aria-hidden="true" ');
  const chars = TICKER_ITEMS.reduce((n, i) => n + i.text.length, 0);
  els.tickerTrack.style.setProperty("--ticker-duration", `${Math.max(40, Math.round(chars / 7))}s`);
}

function renderHero() {
  const isDefaultView = state.category === "vse" && state.search.trim() === "" && state.sort === "newest";
  els.heroSection.classList.toggle("hidden", !isDefaultView);
  els.pulseSection.classList.toggle("hidden", !isDefaultView);
  // Povzetek tedna sodi le na privzeto naslovnico; pri rubriki ali iskanju bi zakril zadetke.
  if (els.weeklySection) els.weeklySection.classList.toggle("hidden", !isDefaultView);

  if (!isDefaultView || !ARTICLES.length) return;

  const lead = ARTICLES.find((a) => a.isHeroLead) || ARTICLES[0];
  const side = ARTICLES.filter((a) => a.isHeroSide).slice(0, 3);

  els.heroLead.dataset.articleId = lead.id;
  els.heroLead.innerHTML = `
    <div class="hero-art">${photoHtml(lead, { lazy: false })}</div>
    <div class="hero-lead-body">
      <div class="card-top-row">
        ${badgeHtml(lead)}
        ${bookmarkBtn(lead.id, 15)}
      </div>
      <h1 class="hero-lead-title"><a class="card-link" href="${articleUrl(lead.id)}">${lead.title}</a></h1>
      <p class="hero-lead-excerpt">${lead.excerpt}</p>
      ${metaLine(lead, { long: true })}
    </div>
  `;
  attachImageFallbacks(els.heroLead);

  els.heroSide.innerHTML = side
    .map(
      (item) => `
      <article class="hero-side-card cat-${item.category}" data-article-id="${item.id}">
        <div class="card-top-row">
          ${badgeHtml(item)}
          ${bookmarkBtn(item.id)}
        </div>
        <div class="hero-side-thumb card-art">${photoHtml(item, { credit: false })}</div>
        <h3><a class="card-link" href="${articleUrl(item.id)}">${item.title}</a></h3>
        <p>${item.excerpt}</p>
        ${metaLine(item)}
      </article>
    `
    )
    .join("");
  attachImageFallbacks(els.heroSide);
  if (window.annotateGlossary) {
    window.annotateGlossary(els.heroLead);
    window.annotateGlossary(els.heroSide);
  }
}

function getFilteredArticles() {
  const query = state.search.trim().toLowerCase();
  const isDefaultView = state.category === "vse" && query === "" && state.sort === "newest";

  let list = ARTICLES.filter((a) => {
    if (isDefaultView && (a.isHeroLead || a.isHeroSide)) {
      return false;
    }
    const matchesCat = state.category === "vse" || a.category === state.category;
    if (!matchesCat) return false;
    if (!query) return true;
    const haystack = [a.title, a.excerpt, ...a.tags, ...a.body].join(" ").toLowerCase();
    return haystack.includes(query);
  });

  if (state.sort === "popular") {
    list = [...list].sort((a, b) => b.views - a.views);
  } else if (state.sort === "shortest") {
    list = [...list].sort((a, b) => a.readMinutes - b.readMinutes);
  } else {
    list = [...list].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  return list;
}

function articleCardHtml(item, { feature = false } = {}) {
  return `
      <article class="article-card cat-${item.category}${feature ? " is-feature" : ""}" data-article-id="${item.id}">
        <div class="card-art">${photoHtml(item)}</div>
        <div class="card-content">
          <div class="card-top-row">
            ${badgeHtml(item)}
            ${bookmarkBtn(item.id)}
          </div>
          <h3 class="card-title"><a class="card-link" href="${articleUrl(item.id)}">${item.title}</a></h3>
          <p class="card-excerpt">${item.excerpt}</p>
          ${metaLine(item)}
        </div>
      </article>
    `;
}

function archiveItemHtml(item) {
  const d = new Date(item.timestamp);
  const dateHtml = Number.isNaN(d.getTime())
    ? item.dateLabel
    : `<b>${d.getDate()}.</b>${MONTHS_SHORT[d.getMonth()]}`;
  return `
      <li class="archive-item cat-${item.category}" data-article-id="${item.id}">
        <span class="archive-date">${dateHtml}</span>
        <span>
          ${badgeHtml(item)}
          <a class="archive-item-title card-link" href="${articleUrl(item.id)}">${item.title}</a>
          <span class="archive-item-meta">${item.readMinutes} min branja</span>
        </span>
        <span class="archive-thumb">${photoHtml(item, { credit: false })}</span>
      </li>
    `;
}

function renderFeed() {
  const query = state.search.trim();
  const hasActiveFilter = state.category !== "vse" || query !== "";

  els.filterBanner.classList.toggle("hidden", !hasActiveFilter);
  if (hasActiveFilter) {
    const parts = [];
    if (state.category !== "vse") parts.push(`Rubrika: ${CATEGORY_LABELS[state.category]}`);
    if (query) parts.push(`Iskalni niz: »${query}«`);
    els.filterStatusText.textContent = parts.join(" · ");
    els.feedHeading.textContent = state.category !== "vse" ? CATEGORY_LABELS[state.category] : "Rezultati iskanja";
  } else {
    els.feedHeading.textContent = "Najnovejši članki in analize";
  }

  const items = getFilteredArticles();

  if (items.length === 0) {
    els.articlesGrid.innerHTML = "";
    els.archiveBlock.classList.add("hidden");
    els.emptyState.classList.remove("hidden");
    return;
  }

  els.emptyState.classList.add("hidden");

  // Prvih nekaj člankov je kartic s fotografijo (prvi širši), ostali gredo v kompakten arhivski seznam.
  const gridItems = items.slice(0, GRID_COUNT);
  const archiveItems = items.slice(GRID_COUNT);
  const ADS = window.AI_DNEVNIK_ADS;
  els.articlesGrid.innerHTML = gridItems
    .map((item, i) => {
      const card = articleCardHtml(item, { feature: i === 0 && gridItems.length > 2 });
      // Mobilno: dodaten oglas med karticami po 3. članku
      return i === 2 && ADS && gridItems.length > 4 ? card + ADS.slotHtml("infeed", "mobile", "div", "ad-infeed ad-grid-span") : card;
    })
    .join("");
  attachImageFallbacks(els.articlesGrid);

  els.archiveBlock.classList.toggle("hidden", archiveItems.length === 0);
  const visible = archiveItems.slice(0, state.archiveVisible);
  const every = ADS ? ADS.infeedEvery : 0;
  els.archiveList.innerHTML = visible
    .map((item, i) => {
      const row = archiveItemHtml(item);
      // Oglas po vsakih N vrsticah seznama (ne za zadnjo vrstico)
      return every && (i + 1) % every === 0 && i < visible.length - 1 ? row + ADS.slotHtml("infeed", "all", "li", "ad-infeed ad-archive") : row;
    })
    .join("");
  attachImageFallbacks(els.archiveList);
  const remaining = archiveItems.length - visible.length;
  els.loadMoreBtn.classList.toggle("hidden", remaining <= 0);
  els.loadMoreBtn.textContent = `Naloži več člankov (še ${remaining})`;

  if (ADS) ADS.mount(els.feedColumn);
  if (window.annotateGlossary) {
    window.annotateGlossary(els.articlesGrid);
  }
}

function renderTrending() {
  const top = [...ARTICLES].sort((a, b) => b.views - a.views).slice(0, 5);
  els.trendingList.innerHTML = top
    .map(
      (item) => `
      <li class="trending-item cat-${item.category}" data-article-id="${item.id}">
        <div>
          <a class="trending-title card-link" href="${articleUrl(item.id)}">${item.title}</a>
          <span class="trending-meta">${CATEGORY_LABELS[item.category]} · ${item.readMinutes} min branja</span>
        </div>
      </li>
    `
    )
    .join("");
}

// Stare povezave oblike index.html#id preusmeri na samostojno stran članka
function handleHashRoute() {
  const hashId = window.location.hash.replace(/^#/, "").trim();
  if (hashId && ARTICLES.some((a) => a.id === hashId)) {
    window.location.replace(articleUrl(hashId));
  }
}

function renderBookmarksDrawer() {
  if (state.bookmarks.length === 0) {
    els.bookmarksList.innerHTML = `
      <div class="empty-state" style="padding: 28px 16px;">
        <h3>Bralni seznam je prazen</h3>
        <p>Kliknite ikono zaznamka na kateremkoli članku, da ga shranite za poznejše branje.</p>
      </div>
    `;
    return;
  }

  const savedArticles = state.bookmarks
    .map((id) => ARTICLES.find((a) => a.id === id))
    .filter(Boolean);

  els.bookmarksList.innerHTML = savedArticles
    .map(
      (item) => `
      <div class="bookmark-item">
        <span style="align-self: flex-start;">${badgeHtml(item, { withFlag: false })}</span>
        <h4><a href="${articleUrl(item.id)}">${item.title}</a></h4>
        <div class="bookmark-item-foot">
          <span>${item.dateLabel} · ${item.readMinutes} min</span>
          <button type="button" class="text-link" data-remove-bookmark="${item.id}">Odstrani</button>
        </div>
      </div>
    `
    )
    .join("");
}

function setCategory(category) {
  state.category = category;
  state.archiveVisible = ARCHIVE_PAGE;
  document.querySelectorAll(".nav-tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.category === category);
  });
  renderAll();
}

function resetAllFilters() {
  state.category = "vse";
  state.search = "";
  state.sort = "newest";
  els.searchInput.value = "";
  els.clearSearch.classList.add("hidden");
  els.sortSelect.value = "newest";
  setCategory("vse");
}

function getFilteredModels() {
  const models = MODELS_DATA.models || [];
  if (state.modelProvider === "vsi") return [...models];
  return models.filter((m) => m.provider === state.modelProvider);
}

function showChartTooltip(model, cx, cy, svgRect) {
  if (!els.chartTooltip || !els.modelsChartWrap) return;
  const wrapRect = els.modelsChartWrap.getBoundingClientRect();
  const relX = ((cx / 620) * svgRect.width) + (svgRect.left - wrapRect.left);
  const relY = ((cy / 270) * svgRect.height) + (svgRect.top - wrapRect.top);
  els.chartTooltip.innerHTML = `
    <strong>${model.name}</strong> (${model.provider})<br>
    Inteligenca: <b>${model.intelligenceNote || "—"}</b><br>
    Pogovor (Elo): <b>${model.chatElo !== null ? `${model.chatElo} ${model.chatEloErr}`.trim() : "—"}</b><br>
    Cena API: <b>${model.priceDisplay}</b>
  `;
  els.chartTooltip.classList.remove("hidden");
  const left = Math.min(Math.max(12, relX + 12), Math.max(12, wrapRect.width - 235));
  const top = Math.max(8, relY - 72);
  els.chartTooltip.style.left = `${left}px`;
  els.chartTooltip.style.top = `${top}px`;
}

function hideChartTooltip() {
  if (els.chartTooltip) els.chartTooltip.classList.add("hidden");
}

function renderModelsChart() {
  if (!els.modelsChartWrap) return;
  const tooltipEl = els.chartTooltip;
  const metric = state.chartMetric;
  const filtered = getFilteredModels();
  const plottable = filtered.filter((m) => {
    const yVal = metric === "intelligence" ? m.intelligenceIndex : m.chatElo;
    return m.inputPrice !== null && yVal !== null;
  });

  els.modelsChartWrap.querySelectorAll("svg, .chart-empty-msg").forEach((node) => node.remove());
  hideChartTooltip();

  if (plottable.length === 0) {
    const msg = document.createElement("p");
    msg.className = "chart-empty-msg chart-card-note";
    msg.style.padding = "48px 16px";
    msg.textContent = "Za izbranega ponudnika in izbrano merilo ni objavljene kombinacije cene in rezultata za prikaz na grafu (modeli brez cene so v tabeli in na lestvici pogovora).";
    els.modelsChartWrap.appendChild(msg);
    return;
  }

  const W = 620;
  const H = 270;
  const pad = { top: 26, right: 34, bottom: 44, left: 56 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  const yVals = plottable.map((m) => (metric === "intelligence" ? m.intelligenceIndex : m.chatElo));
  const maxX = Math.max(11, Math.ceil(Math.max(...plottable.map((m) => m.inputPrice)) * 1.1));
  const minYRaw = Math.min(...yVals);
  const maxYRaw = Math.max(...yVals);
  const minY = metric === "intelligence" ? Math.floor(minYRaw - 4) : Math.floor(minYRaw - 6);
  const maxY = metric === "intelligence" ? Math.ceil(maxYRaw + 3) : Math.ceil(maxYRaw + 5);

  const scaleX = (x) => pad.left + (x / maxX) * plotW;
  const scaleY = (y) => pad.top + plotH - ((y - minY) / Math.max(1, maxY - minY)) * plotH;

  const yTicks = 4;
  const gridLines = [];
  for (let i = 0; i <= yTicks; i++) {
    const val = minY + ((maxY - minY) * i) / yTicks;
    const y = scaleY(val);
    gridLines.push(
      `<line class="scatter-grid-line" x1="${pad.left}" y1="${y.toFixed(1)}" x2="${W - pad.right}" y2="${y.toFixed(1)}" />`,
      `<text class="scatter-axis-label" x="${pad.left - 8}" y="${(y + 4).toFixed(1)}" text-anchor="end">${Math.round(val)}</text>`
    );
  }

  const xTicks = [0, 2, 4, 6, 8, 10].filter((t) => t <= maxX);
  xTicks.forEach((t) => {
    const x = scaleX(t);
    gridLines.push(
      `<line class="scatter-grid-line" x1="${x.toFixed(1)}" y1="${pad.top}" x2="${x.toFixed(1)}" y2="${H - pad.bottom}" />`,
      `<text class="scatter-axis-label" x="${x.toFixed(1)}" y="${H - pad.bottom + 18}" text-anchor="middle">$${t}</text>`
    );
  });

  const pointsMarkup = plottable
    .map((m, idx) => {
      const yVal = metric === "intelligence" ? m.intelligenceIndex : m.chatElo;
      const cx = scaleX(m.inputPrice);
      const cy = scaleY(yVal);
      const shortName = m.name.replace(/\s*\([^)]*\)/g, "");
      const anchor = m.inputPrice >= 9 ? "end" : "start";
      const dx = m.inputPrice >= 9 ? -10 : 10;
      const dy = idx % 2 === 0 ? -4 : 12;
      return `
        <g class="scatter-point-group" data-model-id="${m.id}" tabindex="0" role="button" aria-label="${m.name}: ${yVal}, cena $${m.inputPrice}">
          <circle class="scatter-dot" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="7" fill="${m.providerColor}" stroke="var(--surface)" stroke-width="2" />
          <text class="scatter-point-label" x="${(cx + dx).toFixed(1)}" y="${(cy + dy).toFixed(1)}" text-anchor="${anchor}">${shortName}</text>
        </g>
      `;
    })
    .join("");

  const yTitle = metric === "intelligence" ? "Artificial Analysis v5" : "LMArena Pogovor (Elo)";
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("class", "scatter-svg");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", `${yTitle} v primerjavi s ceno vhodnih tokenov`);
  svg.innerHTML = `
    ${gridLines.join("")}
    <text class="scatter-axis-label" x="${pad.left + plotW / 2}" y="${H - 6}" text-anchor="middle">Cena vhodnih tokenov API ($ / 1M)</text>
    <text class="scatter-axis-label" x="14" y="${pad.top + plotH / 2}" text-anchor="middle" transform="rotate(-90 14 ${pad.top + plotH / 2})">${yTitle}</text>
    <text class="scatter-quadrant-label" x="${pad.left + 8}" y="${pad.top + 12}">↖ BOLJŠE RAZMERJE</text>
    ${pointsMarkup}
  `;

  els.modelsChartWrap.insertBefore(svg, tooltipEl || null);

  svg.querySelectorAll(".scatter-point-group").forEach((group) => {
    const model = plottable.find((m) => m.id === group.dataset.modelId);
    if (!model) return;
    const dot = group.querySelector("circle");
    const cx = parseFloat(dot.getAttribute("cx"));
    const cy = parseFloat(dot.getAttribute("cy"));
    const handleShow = () => showChartTooltip(model, cx, cy, svg.getBoundingClientRect());
    group.addEventListener("mouseenter", handleShow);
    group.addEventListener("focus", handleShow);
    group.addEventListener("mouseleave", hideChartTooltip);
    group.addEventListener("blur", hideChartTooltip);
  });
}

function renderChatLeaderboard() {
  if (!els.chatLeaderboardList) return;
  const ranked = getFilteredModels()
    .filter((m) => m.chatElo !== null)
    .sort((a, b) => (a.chatRank || 99) - (b.chatRank || 99) || b.chatElo - a.chatElo);

  if (ranked.length === 0) {
    els.chatLeaderboardList.innerHTML = `<li class="chart-card-note">Za izbranega ponudnika trenutno ni objavljene uvrstitve na lestvici LMArena Pogovor.</li>`;
    return;
  }

  els.chatLeaderboardList.innerHTML = ranked
    .map((m) => {
      const pct = Math.min(100, Math.max(15, ((m.chatElo - 1495) / 35) * 100));
      return `
        <li class="chat-rank-item">
          <span class="chat-rank-num">#${m.chatRank || "—"}</span>
          <div class="chat-rank-main">
            <div class="chat-rank-name-row">
              <span class="chat-rank-name">${m.name}</span>
              <span class="chat-rank-provider">${m.provider}</span>
            </div>
            <div class="elo-bar-track" aria-hidden="true">
              <div class="elo-bar-fill" style="width: ${pct.toFixed(1)}%; background: ${m.providerColor};"></div>
            </div>
          </div>
          <div class="chat-rank-score">
            <span class="chat-elo-val">${m.chatElo}</span>
            <span class="chat-elo-err">${m.chatEloErr ? `Elo ${m.chatEloErr}` : "Elo"}</span>
          </div>
        </li>
      `;
    })
    .join("");
  if (window.annotateGlossary) {
    window.annotateGlossary(els.chatLeaderboardList);
  }
}

function renderModelsTable() {
  if (!els.modelsTableBody) return;
  const rows = getFilteredModels().sort((a, b) => {
    if (state.modelSort === "chat") {
      return (b.chatElo ?? -1) - (a.chatElo ?? -1) || (b.intelligenceIndex ?? -1) - (a.intelligenceIndex ?? -1);
    }
    if (state.modelSort === "price") {
      const pa = a.inputPrice ?? Number.POSITIVE_INFINITY;
      const pb = b.inputPrice ?? Number.POSITIVE_INFINITY;
      return pa - pb || (b.intelligenceIndex ?? -1) - (a.intelligenceIndex ?? -1);
    }
    return (b.intelligenceIndex ?? -1) - (a.intelligenceIndex ?? -1) || (b.chatElo ?? -1) - (a.chatElo ?? -1);
  });

  const textCell = (v) => `<span class="metric-text">${v}</span>`;

  els.modelsTableBody.innerHTML = rows
    .map((m) => {
      const eloStr = m.chatElo !== null
        ? `${m.chatElo}<span class="metric-subnote">${m.chatRank}. mesto${m.chatEloErr ? ` (${m.chatEloErr})` : ""}</span>`
        : "—";
      const intelStr = m.intelligenceIndex !== null
        ? `${m.intelligenceIndex}<span class="metric-subnote">${m.intelligenceNote}</span>`
        : textCell(m.intelligenceNote || "—");
      const priceStr = m.inputPrice !== null ? m.priceDisplay : textCell(m.priceDisplay);

      return `
        <tr>
          <td class="model-name-cell">
            <button type="button" class="model-name-btn" aria-expanded="false" title="Prikaži opis modela">
              <strong>${m.name}</strong><span class="chev" aria-hidden="true">▾</span>
            </button>
            <span class="model-highlight-note">${m.highlight}</span>
          </td>
          <td>
            <span class="provider-pill">
              <span class="provider-dot" style="background: ${m.providerColor};"></span>
              ${m.provider}
            </span>
          </td>
          <td class="metric-cell-mono num">${intelStr}</td>
          <td class="metric-cell-mono num">${eloStr}</td>
          <td class="metric-cell-mono num">${priceStr}</td>
          <td>${m.speedLabel}</td>
          <td>${m.contextLabel}</td>
          <td>${m.availability}</td>
        </tr>
      `;
    })
    .join("");
  if (window.annotateGlossary) {
    window.annotateGlossary(els.modelsTableBody);
  }
}

function renderModelsSources() {
  if (!els.modelsSources) return;
  const sources = MODELS_DATA.sources || [];
  els.modelsSources.innerHTML = sources
    .map((s) => `<a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.label}</a>`)
    .join(" · ");
  if (els.modelsUpdatedLabel && MODELS_DATA.updatedAt) {
    const [y, m, d] = MODELS_DATA.updatedAt.split("-");
    if (y && m && d) {
      els.modelsUpdatedLabel.textContent = `Posodobljeno ${Number(d)}. ${Number(m)}. ${y}`;
    }
  }
}

function renderModelsSection() {
  if (!MODELS_DATA.models || !MODELS_DATA.models.length) return;
  renderModelsSources();
  renderModelsChart();
  renderChatLeaderboard();
  renderModelsTable();
  if (window.annotateGlossary) {
    window.annotateGlossary(document.getElementById("models-section"));
  }
}

function renderAll() {
  renderHero();
  renderFeed();
  renderTrending();
}

async function handleNewsletterSubmit(e) {
  e.preventDefault();
  const email = els.newsletterEmail.value.trim();
  const consent = els.newsletterConsent.checked;
  if (!email || !consent) return;

  const nlConfig = SITE_CONFIG.newsletter || { mode: "demo", endpoint: "" };

  if (nlConfig.mode === "endpoint" && nlConfig.endpoint) {
    try {
      const res = await fetch(nlConfig.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email, consent: true, source: SITE_CONFIG.siteUrl })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      els.newsletterFeedback.textContent = `Hvala! ${nlConfig.doubleOptInNote}`;
    } catch {
      els.newsletterFeedback.textContent = `Prijava trenutno ni uspela. Pišite nam na ${SITE_CONFIG.contactEmail}.`;
    }
  } else {
    const subscribers = readJson("aidnevnik_newsletter_pending", []);
    if (!subscribers.includes(email)) subscribers.push(email);
    store.set("aidnevnik_newsletter_pending", JSON.stringify(subscribers));
    els.newsletterFeedback.textContent =
      `Hvala, naslov ${email} je zabeležen s privolitvijo GDPR (predogledni način — pred objavo v config.js vnesite pravi poštni API).`;
  }

  els.newsletterFeedback.classList.remove("hidden");
  els.newsletterEmail.value = "";
  els.newsletterConsent.checked = false;
}

function initCookielessAnalytics() {
  const analytics = SITE_CONFIG.analytics || {};
  if (analytics.plausibleDomain) {
    const s = document.createElement("script");
    s.defer = true;
    s.setAttribute("data-domain", analytics.plausibleDomain);
    s.src = "https://plausible.io/js/script.js";
    document.head.appendChild(s);
  } else if (analytics.umamiWebsiteId && analytics.umamiScriptUrl) {
    const s = document.createElement("script");
    s.defer = true;
    s.setAttribute("data-website-id", analytics.umamiWebsiteId);
    s.src = analytics.umamiScriptUrl;
    document.head.appendChild(s);
  }
}

function bindEvents() {
  els.themeToggle.addEventListener("click", () => {
    applyTheme(state.theme === "light" ? "dark" : "light");
  });

  els.categoryTabs.addEventListener("click", (e) => {
    const tab = e.target.closest(".nav-tab");
    if (!tab) return;
    if (!tab.dataset.category) {
      // »Povzetek tedna« je viden le na privzeti naslovnici — najprej ponastavi filtre.
      if (tab.getAttribute("href") === "#weekly-summary-section" && els.weeklySection.classList.contains("hidden")) {
        resetAllFilters();
      }
      return;
    }
    setCategory(tab.dataset.category);
    const mainTop = document.getElementById("main").getBoundingClientRect().top + window.scrollY;
    if (window.scrollY > mainTop) window.scrollTo({ top: mainTop - 8, behavior: "smooth" });
  });

  document.querySelectorAll(".footer-cat-link").forEach((btn) => {
    btn.addEventListener("click", () => {
      setCategory(btn.dataset.category);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  els.searchInput.addEventListener("input", (e) => {
    state.search = e.target.value;
    state.archiveVisible = ARCHIVE_PAGE;
    els.clearSearch.classList.toggle("hidden", state.search.trim() === "");
    renderAll();
  });

  els.clearSearch.addEventListener("click", () => {
    state.search = "";
    els.searchInput.value = "";
    els.clearSearch.classList.add("hidden");
    renderAll();
  });

  els.sortSelect.addEventListener("change", (e) => {
    state.sort = e.target.value;
    state.archiveVisible = ARCHIVE_PAGE;
    renderAll();
  });

  els.resetFiltersBtn.addEventListener("click", resetAllFilters);
  els.emptyResetBtn.addEventListener("click", resetAllFilters);
  els.resetHome.addEventListener("click", (e) => {
    e.preventDefault();
    resetAllFilters();
  });

  document.addEventListener("click", (e) => {
    const bookmarkBtn = e.target.closest("[data-bookmark-id]");
    if (bookmarkBtn) {
      toggleBookmark(bookmarkBtn.dataset.bookmarkId, e);
      return;
    }

  });

  els.bookmarksToggle.addEventListener("click", () => {
    renderBookmarksDrawer();
    els.drawer.classList.remove("hidden");
  });

  els.drawerCloseBtn.addEventListener("click", () => {
    els.drawer.classList.add("hidden");
  });

  els.drawer.addEventListener("click", (e) => {
    if (e.target === els.drawer) {
      els.drawer.classList.add("hidden");
      return;
    }
    const removeBtn = e.target.closest("[data-remove-bookmark]");
    if (removeBtn) {
      toggleBookmark(removeBtn.dataset.removeBookmark, e);
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (!els.drawer.classList.contains("hidden")) els.drawer.classList.add("hidden");
    }
  });

  window.addEventListener("hashchange", handleHashRoute);

  els.loadMoreBtn.addEventListener("click", () => {
    state.archiveVisible += ARCHIVE_PAGE;
    renderFeed();
  });


  const updateNavFade = () => {
    const sc = els.categoryTabs;
    els.categoryNav.classList.toggle("can-scroll", sc.scrollWidth - sc.clientWidth - sc.scrollLeft > 4);
  };
  els.categoryTabs.addEventListener("scroll", updateNavFade, { passive: true });
  window.addEventListener("resize", updateNavFade);
  updateNavFade();
  els.newsletterForm.addEventListener("submit", handleNewsletterSubmit);

  if (els.modelProviderFilters) {
    els.modelProviderFilters.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-provider]");
      if (!btn) return;
      state.modelProvider = btn.dataset.provider;
      els.modelProviderFilters.querySelectorAll("[data-provider]").forEach((el) => {
        el.classList.toggle("active", el.dataset.provider === state.modelProvider);
      });
      renderModelsChart();
      renderChatLeaderboard();
      renderModelsTable();
    });
  }

  if (els.modelsTableBody) {
    els.modelsTableBody.addEventListener("click", (e) => {
      const btn = e.target.closest(".model-name-btn");
      if (!btn) return;
      const cell = btn.closest(".model-name-cell");
      const open = cell.classList.toggle("open");
      btn.setAttribute("aria-expanded", String(open));
    });
  }

  if (els.modelSortSelect) {
    els.modelSortSelect.addEventListener("change", (e) => {
      state.modelSort = e.target.value;
      renderModelsTable();
    });
  }

  if (els.chartMetricToggle) {
    els.chartMetricToggle.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-metric]");
      if (!btn) return;
      state.chartMetric = btn.dataset.metric;
      els.chartMetricToggle.querySelectorAll("[data-metric]").forEach((el) => {
        el.classList.toggle("active", el.dataset.metric === state.chartMetric);
      });
      renderModelsChart();
    });
  }
}

function renderWeeklySummary() {
  if (!els.weeklySection || !WEEKLY_SUMMARY) return;
  const pillarsHtml = (WEEKLY_SUMMARY.pillars || [])
    .map((pillar) => {
      const linksHtml = (pillar.relatedArticles || [])
        .map(
          (ref) =>
            `<a class="weekly-link-pill" href="${articleUrl(ref.id)}">${ref.label} →</a>`
        )
        .join("");
      return `
        <article class="weekly-card">
          <span class="weekly-card-kicker">${pillar.kicker}</span>
          <h3>${pillar.headline}</h3>
          <p>${pillar.summary}</p>
          <div class="weekly-card-links">${linksHtml}</div>
        </article>
      `;
    })
    .join("");

  const takeawaysHtml = (WEEKLY_SUMMARY.takeawayBanner || [])
    .map((item) => `<li>${item}</li>`)
    .join("");

  els.weeklySection.innerHTML = `
    <div class="weekly-header">
      <div class="weekly-header-main">
        <div class="weekly-eyebrow">${WEEKLY_SUMMARY.weekNumberLabel} · ${WEEKLY_SUMMARY.periodLabel}</div>
        <h2>${WEEKLY_SUMMARY.title}</h2>
        <p class="weekly-lead">${WEEKLY_SUMMARY.lead}</p>
      </div>
      <div class="weekly-meta-pill">
        <span>${WEEKLY_SUMMARY.readTimeLabel}</span>
        <span>·</span>
        <span>Napisala UI</span>
      </div>
    </div>
    <div class="weekly-grid">${pillarsHtml}</div>
    <div class="weekly-takeaways">
      <div class="weekly-takeaways-head">
        <span class="weekly-takeaways-title">Kaj odnesti iz tega tedna</span>
      </div>
      <ul>${takeawaysHtml}</ul>
    </div>
  `;
  if (window.annotateGlossary) {
    window.annotateGlossary(els.weeklySection);
  }
}

function init() {
  applyTheme(state.theme);
  saveBookmarks();
  renderTicker();
  renderAll();
  renderWeeklySummary();
  renderModelsSection();
  if (window.annotateGlossary && els.pulseSection) {
    window.annotateGlossary(els.pulseSection);
  }
  bindEvents();
  // Ob vrnitvi z gumbom »nazaj« (predpomnilnik brskalnika) ali spremembi v drugem zavihku
  // ponovno preberi shranjene članke, da števec in oznake niso zastareli.
  const refreshBookmarks = () => {
    state.bookmarks = readJson("aidnevnik_bookmarks", []);
    saveBookmarks();
    renderAll();
  };
  window.addEventListener("pageshow", (e) => { if (e.persisted) refreshBookmarks(); });
  window.addEventListener("storage", (e) => { if (e.key === "aidnevnik_bookmarks") refreshBookmarks(); });
  handleHashRoute();
  initCookielessAnalytics();
}

init();
