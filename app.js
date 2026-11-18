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

const DEFAULT_TITLE = "AI Dnevnik — Najnovejše novice s področja umetne inteligence";
const DEFAULT_DESCRIPTION =
  "AI Dnevnik — slovenski portal za najnovejše novice, analize in preglede s področja umetne inteligence, jezikovnih modelov, robotike in evropske regulacije.";

function createEditorialSvg(variant) {
  const palettes = {
    nvidia: { bg1: "#0f172a", bg2: "#1e293b", accent: "#ef4444", accent2: "#38bdf8" },
    gemini: { bg1: "#172554", bg2: "#1e40af", accent: "#60a5fa", accent2: "#a5f3fc" },
    slovenija: { bg1: "#064e3b", bg2: "#047857", accent: "#34d399", accent2: "#fde047" },
    anthropic: { bg1: "#27272a", bg2: "#3f3f46", accent: "#f97316", accent2: "#fdba74" },
    robotika: { bg1: "#311042", bg2: "#581c87", accent: "#e879f9", accent2: "#38bdf8" },
    fuzija: { bg1: "#1e1b4b", bg2: "#312e81", accent: "#f43f5e", accent2: "#fbbf24" },
    svet: { bg1: "#0c4a6e", bg2: "#0369a1", accent: "#38bdf8", accent2: "#bae6fd" },
    dogodki: { bg1: "#14532d", bg2: "#166534", accent: "#4ade80", accent2: "#facc15" },
    varnost: { bg1: "#1f2937", bg2: "#111827", accent: "#10b981", accent2: "#60a5fa" },
    fable: { bg1: "#3b0764", bg2: "#6b21a8", accent: "#fb923c", accent2: "#f472b6" },
    zanimivo: { bg1: "#451a03", bg2: "#92400e", accent: "#f59e0b", accent2: "#38bdf8" }
  };

  const p = palettes[variant] || palettes.gemini;
  return `<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Ilustracija članka">
    <defs>
      <linearGradient id="g-${variant}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${p.bg1}" />
        <stop offset="100%" stop-color="${p.bg2}" />
      </linearGradient>
    </defs>
    <rect width="800" height="450" fill="url(#g-${variant})" />
    <circle cx="400" cy="225" r="140" fill="none" stroke="${p.accent}" stroke-width="2" opacity="0.4" />
    <circle cx="400" cy="225" r="70" fill="${p.accent2}" opacity="0.22" />
  </svg>`;
}

const state = {
  category: "vse",
  search: "",
  sort: "newest",
  modelProvider: "vsi",
  modelSort: "intelligence",
  chartMetric: "intelligence",
  bookmarks: JSON.parse(localStorage.getItem("aidnevnik_bookmarks") || "[]"),
  theme: localStorage.getItem("aidnevnik_theme") || "light",
  activeArticleId: null
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
  emptyState: document.getElementById("empty-state"),
  trendingList: document.getElementById("trending-list"),
  newsletterForm: document.getElementById("newsletter-form"),
  newsletterEmail: document.getElementById("newsletter-email"),
  newsletterConsent: document.getElementById("newsletter-consent"),
  newsletterFeedback: document.getElementById("newsletter-feedback"),
  modal: document.getElementById("article-modal"),
  modalCategory: document.getElementById("modal-category"),
  modalStandaloneLink: document.getElementById("modal-standalone-link"),
  modalBookmarkBtn: document.getElementById("modal-bookmark-btn"),
  modalBookmarkLabel: document.getElementById("modal-bookmark-label"),
  modalCopyBtn: document.getElementById("modal-copy-btn"),
  modalCopyLabel: document.getElementById("modal-copy-label"),
  modalCloseBtn: document.getElementById("modal-close-btn"),
  modalArt: document.getElementById("modal-art"),
  modalPhotoCredit: document.getElementById("modal-photo-credit"),
  modalTitle: document.getElementById("modal-title"),
  modalMeta: document.getElementById("modal-meta"),
  modalTakeaways: document.getElementById("modal-takeaways"),
  modalBody: document.getElementById("modal-body"),
  modalSources: document.getElementById("modal-sources"),
  modalAiNote: document.getElementById("modal-ai-note"),
  modalTags: document.getElementById("modal-tags"),
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

function renderCardSources(sources = []) {
  if (!sources.length) return "";
  const links = sources
    .map((s) => {
      const shortName = s.label.split(" — ")[0];
      return `<a href="${s.url}" target="_blank" rel="noopener noreferrer" data-source-link="true">${shortName}</a>`;
    })
    .join(", ");
  return `<div class="card-sources">Viri: ${links}</div>`;
}

function attachImageFallbacks(root = document) {
  root.querySelectorAll("img[data-fallback-variant]").forEach((img) => {
    img.addEventListener(
      "error",
      () => {
        const parent = img.parentElement;
        if (parent) {
          parent.innerHTML = createEditorialSvg(img.dataset.fallbackVariant);
        }
      },
      { once: true }
    );
  });
}

function applyTheme(theme) {
  state.theme = theme;
  els.html.setAttribute("data-theme", theme);
  els.themeLabel.textContent = theme === "dark" ? "Svetli način" : "Temni način";
  localStorage.setItem("aidnevnik_theme", theme);
}

function saveBookmarks() {
  localStorage.setItem("aidnevnik_bookmarks", JSON.stringify(state.bookmarks));
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
  if (state.activeArticleId === id) {
    updateModalBookmarkButton(id);
  }
  if (!els.drawer.classList.contains("hidden")) {
    renderBookmarksDrawer();
  }
}

function updateSeoMetadata(article) {
  const descMeta = document.querySelector('meta[name="description"]');
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const ogDesc = document.querySelector('meta[property="og:description"]');

  if (article) {
    document.title = `${article.title} — AI Dnevnik`;
    if (descMeta) descMeta.setAttribute("content", article.excerpt);
    if (ogTitle) ogTitle.setAttribute("content", article.title);
    if (ogDesc) ogDesc.setAttribute("content", article.excerpt);
  } else {
    document.title = DEFAULT_TITLE;
    if (descMeta) descMeta.setAttribute("content", DEFAULT_DESCRIPTION);
    if (ogTitle) ogTitle.setAttribute("content", DEFAULT_TITLE);
    if (ogDesc) ogDesc.setAttribute("content", DEFAULT_DESCRIPTION);
  }
}

function renderTicker() {
  els.tickerTrack.innerHTML = TICKER_ITEMS.map(
    (item) => `
      <button type="button" class="ticker-item" data-article-id="${item.articleId}">
        <span class="ticker-time">${item.time}</span>
        <span>${item.text}</span>
      </button>
    `
  ).join("");
}

function renderHero() {
  const isDefaultView = state.category === "vse" && state.search.trim() === "" && state.sort === "newest";
  els.heroSection.classList.toggle("hidden", !isDefaultView);
  els.pulseSection.classList.toggle("hidden", !isDefaultView);

  if (!isDefaultView || !ARTICLES.length) return;

  const lead = ARTICLES.find((a) => a.isHeroLead) || ARTICLES[0];
  const side = ARTICLES.filter((a) => a.isHeroSide).slice(0, 3);

  els.heroLead.dataset.articleId = lead.id;
  els.heroLead.innerHTML = `
    <div class="hero-art">
      <img src="${lead.imageUrl}" alt="${lead.imageAlt}" data-fallback-variant="${lead.variant}" referrerpolicy="no-referrer" />
      <span class="photo-credit">${lead.imageCredit}</span>
    </div>
    <div class="hero-lead-body">
      <div class="card-top-row">
        <span class="badge ${lead.breaking ? "breaking" : ""}">${lead.breaking ? "UDARNO · " : ""}${CATEGORY_LABELS[lead.category]}</span>
        <button type="button" class="bookmark-mini ${isBookmarked(lead.id) ? "saved" : ""}" data-bookmark-id="${lead.id}" aria-label="Shrani članek">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
        </button>
      </div>
      <h1 class="hero-lead-title">${lead.title}</h1>
      <p class="hero-lead-excerpt">${lead.excerpt}</p>
      <div class="card-meta">
        <span>${lead.dateLabel}</span>
        <span>${lead.readMinutes} min branja</span>
      </div>
      <div class="ai-byline">Napisala UI</div>
      ${renderCardSources(lead.sources)}
    </div>
  `;
  attachImageFallbacks(els.heroLead);

  els.heroSide.innerHTML = side
    .map(
      (item) => `
      <article class="hero-side-card" data-article-id="${item.id}">
        <div class="card-top-row">
          <span class="badge">${CATEGORY_LABELS[item.category]}</span>
          <button type="button" class="bookmark-mini ${isBookmarked(item.id) ? "saved" : ""}" data-bookmark-id="${item.id}" aria-label="Shrani članek">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
          </button>
        </div>
        <h3>${item.title}</h3>
        <p>${item.excerpt}</p>
        <div class="card-meta">
          <span>${item.dateLabel}</span>
          <span>${item.readMinutes} min</span>
        </div>
        <div class="ai-byline">Napisala UI</div>
        ${renderCardSources(item.sources)}
      </article>
    `
    )
    .join("");
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
    els.emptyState.classList.remove("hidden");
    return;
  }

  els.emptyState.classList.add("hidden");
  els.articlesGrid.innerHTML = items
    .map(
      (item) => `
      <article class="article-card" data-article-id="${item.id}">
        <div class="card-art">
          <img src="${item.imageUrl}" alt="${item.imageAlt}" loading="lazy" data-fallback-variant="${item.variant}" referrerpolicy="no-referrer" />
          <span class="photo-credit">${item.imageCredit}</span>
        </div>
        <div class="card-content">
          <div class="card-top-row">
            <span class="badge ${item.breaking ? "breaking" : ""}">${CATEGORY_LABELS[item.category]}</span>
            <button type="button" class="bookmark-mini ${isBookmarked(item.id) ? "saved" : ""}" data-bookmark-id="${item.id}" aria-label="Shrani članek">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
            </button>
          </div>
          <h3 class="card-title">${item.title}</h3>
          <p class="card-excerpt">${item.excerpt}</p>
          <div class="card-meta">
            <span>${item.dateLabel}</span>
            <span>${item.readMinutes} min</span>
          </div>
          <div class="ai-byline">Napisala UI</div>
          ${renderCardSources(item.sources)}
        </div>
      </article>
    `
    )
    .join("");
  attachImageFallbacks(els.articlesGrid);
  if (window.annotateGlossary) {
    window.annotateGlossary(els.articlesGrid);
  }
}

function renderTrending() {
  const top = [...ARTICLES].sort((a, b) => b.views - a.views).slice(0, 5);
  els.trendingList.innerHTML = top
    .map(
      (item) => `
      <li class="trending-item" data-article-id="${item.id}">
        <div>
          <span class="trending-title">${item.title}</span>
          <span class="trending-meta">${CATEGORY_LABELS[item.category]} · ${item.readMinutes} min branja</span>
        </div>
      </li>
    `
    )
    .join("");
}

function updateModalBookmarkButton(id) {
  const saved = isBookmarked(id);
  els.modalBookmarkLabel.textContent = saved ? "Shranjeno" : "Shrani";
  els.modalBookmarkBtn.style.borderColor = saved ? "var(--accent)" : "";
  els.modalBookmarkBtn.style.color = saved ? "var(--accent)" : "";
}

function openArticleModal(id, { updateUrl = true } = {}) {
  const article = ARTICLES.find((a) => a.id === id);
  if (!article) return;
  state.activeArticleId = id;

  els.modalCategory.textContent = CATEGORY_LABELS[article.category];
  els.modalCategory.className = `badge ${article.breaking ? "breaking" : ""}`;
  els.modalStandaloneLink.href = `clanek/${article.id}.html`;
  els.modalArt.innerHTML = `<img src="${article.imageUrl}" alt="${article.imageAlt}" data-fallback-variant="${article.variant}" referrerpolicy="no-referrer" />`;
  attachImageFallbacks(els.modalArt);
  els.modalPhotoCredit.textContent = `${article.imageCredit} (Wikimedia Commons)`;
  els.modalTitle.textContent = article.title;
  els.modalMeta.innerHTML = `
    <span>${article.dateLabel}</span>
    <span>·</span>
    <span>${article.readMinutes} min branja</span>
  `;
  els.modalTakeaways.innerHTML = `
    <h4>Ključni poudarki</h4>
    <ul>${article.takeaways.map((t) => `<li>${t}</li>`).join("")}</ul>
  `;
  els.modalBody.innerHTML = article.body.map((p) => `<p>${p}</p>`).join("");
  if (window.annotateGlossary) {
    window.annotateGlossary(els.modalTakeaways);
    window.annotateGlossary(els.modalBody);
  }

  const sources = article.sources || [];
  els.modalSources.innerHTML = sources.length
    ? `
      <h4>Uporabljeni viri</h4>
      <ul>
        ${sources
          .map(
            (s) =>
              `<li><a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.label}</a></li>`
          )
          .join("")}
      </ul>
    `
    : "";
  els.modalSources.classList.toggle("hidden", sources.length === 0);
  els.modalAiNote.textContent = "Članek je napisala UI na podlagi javno dostopnih virov.";
  els.modalTags.innerHTML = article.tags.map((tag) => `<span class="tag-chip">#${tag}</span>`).join("");

  updateModalBookmarkButton(id);
  updateSeoMetadata(article);
  if (updateUrl && window.location.hash !== `#${id}`) {
    history.replaceState(null, "", `#${id}`);
  }
  els.modalCopyLabel.textContent = "Kopiraj";
  els.modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeArticleModal({ updateUrl = true } = {}) {
  state.activeArticleId = null;
  els.modal.classList.add("hidden");
  document.body.style.overflow = "";
  updateSeoMetadata(null);
  if (updateUrl && window.location.hash) {
    history.replaceState(null, "", window.location.pathname + window.location.search);
  }
}

function handleHashRoute() {
  const hashId = window.location.hash.replace(/^#/, "").trim();
  if (!hashId) {
    if (state.activeArticleId) closeArticleModal({ updateUrl: false });
    return;
  }
  if (ARTICLES.some((a) => a.id === hashId)) {
    openArticleModal(hashId, { updateUrl: false });
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
        <span class="badge" style="align-self: flex-start;">${CATEGORY_LABELS[item.category]}</span>
        <h4 data-open-bookmark="${item.id}">${item.title}</h4>
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
  const relY = ((cy / 300) * svgRect.height) + (svgRect.top - wrapRect.top);
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
  const H = 300;
  const pad = { top: 24, right: 34, bottom: 44, left: 56 };
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

  els.modelsTableBody.innerHTML = rows
    .map((m) => {
      const eloStr = m.chatElo !== null
        ? `${m.chatElo}${m.chatEloErr ? ` <span class="metric-subnote">${m.chatRank}. mesto (${m.chatEloErr})</span>` : `<span class="metric-subnote">${m.chatRank}. mesto</span>`}`
        : "—";
      const intelStr = m.intelligenceIndex !== null
        ? `${m.intelligenceIndex}<span class="metric-subnote">${m.intelligenceNote}</span>`
        : m.intelligenceNote || "—";

      return `
        <tr>
          <td class="model-name-cell">
            <strong>${m.name}</strong>
            <span class="model-highlight-note">${m.highlight}</span>
          </td>
          <td>
            <span class="provider-pill">
              <span class="provider-dot" style="background: ${m.providerColor};"></span>
              ${m.provider}
            </span>
          </td>
          <td class="metric-cell-mono">${intelStr}</td>
          <td class="metric-cell-mono">${eloStr}</td>
          <td class="metric-cell-mono">${m.priceDisplay}</td>
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
    const subscribers = JSON.parse(localStorage.getItem("aidnevnik_newsletter_pending") || "[]");
    if (!subscribers.includes(email)) subscribers.push(email);
    localStorage.setItem("aidnevnik_newsletter_pending", JSON.stringify(subscribers));
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
    if (!tab || !tab.dataset.category) return;
    setCategory(tab.dataset.category);
  });

  document.querySelectorAll(".footer-cat-link").forEach((btn) => {
    btn.addEventListener("click", () => {
      setCategory(btn.dataset.category);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  els.searchInput.addEventListener("input", (e) => {
    state.search = e.target.value;
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

    const articleEl = e.target.closest("[data-article-id]");
    if (
      articleEl &&
      !e.target.closest("button[data-bookmark-id]") &&
      !e.target.closest("a[data-source-link]") &&
      !e.target.closest(".glossary-term")
    ) {
      openArticleModal(articleEl.dataset.articleId);
    }
  });

  els.modalCloseBtn.addEventListener("click", () => closeArticleModal());
  els.modal.addEventListener("click", (e) => {
    if (e.target === els.modal) closeArticleModal();
  });

  els.modalBookmarkBtn.addEventListener("click", () => {
    if (state.activeArticleId) toggleBookmark(state.activeArticleId);
  });

  els.modalCopyBtn.addEventListener("click", async () => {
    const article = ARTICLES.find((a) => a.id === state.activeArticleId);
    if (!article) return;
    const base = window.location.href.split("#")[0];
    const shareUrl = window.location.protocol === "file:"
      ? `${base}#${article.id}`
      : `${SITE_CONFIG.siteUrl}/clanek/${article.id}.html`;
    const text = `${article.title} — AI Dnevnik (${shareUrl})`;
    try {
      await navigator.clipboard.writeText(text);
      els.modalCopyLabel.textContent = "Kopirano!";
    } catch {
      els.modalCopyLabel.textContent = "Pripravljeno";
    }
    setTimeout(() => {
      els.modalCopyLabel.textContent = "Kopiraj";
    }, 2000);
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
    const openBtn = e.target.closest("[data-open-bookmark]");
    if (openBtn) {
      els.drawer.classList.add("hidden");
      openArticleModal(openBtn.dataset.openBookmark);
      return;
    }
    const removeBtn = e.target.closest("[data-remove-bookmark]");
    if (removeBtn) {
      toggleBookmark(removeBtn.dataset.removeBookmark, e);
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (!els.modal.classList.contains("hidden")) closeArticleModal();
      if (!els.drawer.classList.contains("hidden")) els.drawer.classList.add("hidden");
    }
  });

  window.addEventListener("hashchange", handleHashRoute);
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
            `<button type="button" class="weekly-link-pill" data-article-id="${ref.id}">${ref.label} →</button>`
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
  handleHashRoute();
  initCookielessAnalytics();
}

init();
