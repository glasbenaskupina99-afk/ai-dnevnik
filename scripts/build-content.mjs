import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SITE_URL = "https://aidnevnik.si";

const contentPath = path.join(ROOT, "content", "articles.json");
const raw = JSON.parse(fs.readFileSync(contentPath, "utf8"));
const { categoryLabels, tickerItems, articles, updatedAt } = raw;

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// 1. Ustvari data/articles-bundle.js in data/models-bundle.js za takojšnje nalaganje tudi prek file://
const dataDir = path.join(ROOT, "data");
fs.mkdirSync(dataDir, { recursive: true });
const bundleCode = `// Samodejno ustvarjeno iz content/articles.json prek scripts/build-content.mjs
window.AI_DNEVNIK_DATA = ${JSON.stringify(raw, null, 2)};
`;
fs.writeFileSync(path.join(dataDir, "articles-bundle.js"), bundleCode, "utf8");

const modelsPath = path.join(ROOT, "content", "models.json");
if (fs.existsSync(modelsPath)) {
  const modelsRaw = JSON.parse(fs.readFileSync(modelsPath, "utf8"));
  const modelsBundle = `// Samodejno ustvarjeno iz content/models.json prek scripts/build-content.mjs
window.AI_DNEVNIK_MODELS = ${JSON.stringify(modelsRaw, null, 2)};
`;
  fs.writeFileSync(path.join(dataDir, "models-bundle.js"), modelsBundle, "utf8");
}

const weeklyPath = path.join(ROOT, "content", "weekly-summary.json");
if (fs.existsSync(weeklyPath)) {
  const weeklyRaw = JSON.parse(fs.readFileSync(weeklyPath, "utf8"));
  const weeklyBundle = `// Samodejno ustvarjeno iz content/weekly-summary.json prek scripts/build-content.mjs
window.AI_DNEVNIK_WEEKLY = ${JSON.stringify(weeklyRaw, null, 2)};
`;
  fs.writeFileSync(path.join(dataDir, "weekly-summary-bundle.js"), weeklyBundle, "utf8");
}

// 2. Ustvari samostojne SEO HTML strani za vsak članek v clanek/<id>.html
const articlesDir = path.join(ROOT, "clanek");
fs.mkdirSync(articlesDir, { recursive: true });

const isRemote = (url = "") => /^https?:\/\//.test(url);
const absImage = (url) => (!url ? `${SITE_URL}/favicon.svg` : isRemote(url) ? url : `${SITE_URL}/${url}`);
const imgOrArt = (item, extra = "") =>
  item.imageUrl
    ? `<img src="${escapeHtml(pageImage(item.imageUrl))}" alt="${escapeHtml(item.imageAlt)}"${extra} data-art-category="${item.category}" data-art-seed="${item.id}" referrerpolicy="no-referrer" />`
    : `<span class="art-fallback" data-art-category="${item.category}" data-art-seed="${item.id}"></span>`;
const pageImage = (url) => (isRemote(url) ? url : `../${url}`);

const LOGO_SVG = `<svg width="32" height="32" viewBox="0 0 64 64" fill="none">
            <rect x="2" y="2" width="60" height="60" rx="14" fill="#16140f" />
            <rect x="2.75" y="2.75" width="58.5" height="58.5" rx="13.25" stroke="#ffffff" stroke-opacity="0.14" stroke-width="1.5" />
            <rect x="21" y="45" width="22" height="5.5" rx="2.5" fill="#f7f4ee" />
            <path d="M22 43L18.5 31L32 16L45.5 31L42 43H22Z" fill="#f7f4ee" />
            <line x1="32" y1="31.5" x2="32" y2="16.5" stroke="#16140f" stroke-width="2.4" stroke-linecap="round" />
            <circle cx="32" cy="32" r="4.5" fill="#2a4f8f" />
            <circle cx="32" cy="32" r="1.9" fill="#c9d7f2" />
            <circle cx="32" cy="11.5" r="3.6" fill="#b3361f" />
          </svg>`;

function relatedFor(article) {
  const byDate = (x, y) => new Date(y.timestamp) - new Date(x.timestamp);
  const same = articles.filter((a) => a.id !== article.id && a.category === article.category).sort(byDate);
  const others = articles.filter((a) => a.id !== article.id && a.category !== article.category).sort(byDate);
  return [...same, ...others].slice(0, 3);
}

for (const article of articles) {
  const categoryName = categoryLabels[article.category] || article.category;
  const canonicalUrl = `${SITE_URL}/clanek/${article.id}.html`;
  const ogImage = absImage(article.imageUrl);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.excerpt,
    image: [ogImage],
    datePublished: article.timestamp,
    dateModified: article.timestamp,
    inLanguage: "sl",
    publisher: {
      "@type": "Organization",
      name: "AI Dnevnik",
      url: SITE_URL
    },
    mainEntityOfPage: canonicalUrl
  };

  const related = relatedFor(article)
    .map(
      (r) => `
          <a class="related-card cat-${r.category}" href="${r.id}.html">
            <div class="card-art">${imgOrArt(r, ' loading="lazy"')}</div>
            <span class="badge cat-${r.category}">${escapeHtml(categoryLabels[r.category] || r.category)}</span>
            <h3>${escapeHtml(r.title)}</h3>
            <div class="card-meta"><span>${escapeHtml(r.dateLabel)}</span><span>${r.readMinutes} min</span></div>
          </a>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="sl" data-theme="light">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(article.title)} — AI Dnevnik</title>
  <meta name="description" content="${escapeHtml(article.excerpt)}" />
  <link rel="canonical" href="${canonicalUrl}" />
  <link rel="icon" type="image/svg+xml" href="../favicon.svg" />
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="AI Dnevnik" />
  <meta property="og:title" content="${escapeHtml(article.title)}" />
  <meta property="og:description" content="${escapeHtml(article.excerpt)}" />
  <meta property="og:image" content="${escapeHtml(ogImage)}" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(article.title)}" />
  <meta name="twitter:description" content="${escapeHtml(article.excerpt)}" />
  <meta name="twitter:image" content="${escapeHtml(ogImage)}" />
  <script>
    try { document.documentElement.setAttribute("data-theme", localStorage.getItem("aidnevnik_theme") || "light"); } catch (e) {}
  </script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;0,6..72,700;1,6..72,400;1,6..72,500&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="../styles.css" />
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body class="article-page">
  <div class="read-progress" aria-hidden="true"><span id="read-progress-bar"></span></div>
  <header class="masthead">
    <div class="container masthead-inner">
      <a href="../index.html" class="brand-logo">
        <span class="brand-mark" aria-hidden="true">
          ${LOGO_SVG}
        </span>
        <span class="brand-text">
          <strong>AI Dnevnik</strong>
          <small>Umetna inteligenca · Slovenija &amp; svet</small>
        </span>
      </a>
      <div class="subpage-actions">
        <a href="../index.html" class="icon-action-btn">← Vse novice</a>
        <button type="button" class="utility-btn" id="theme-toggle" aria-label="Preklopi temo">
          <span id="theme-label">Temni način</span>
        </button>
      </div>
    </div>
  </header>

  <figure class="article-hero modal-figure">
    <div class="modal-art">
      ${imgOrArt(article)}
    </div>
    <figcaption class="modal-photo-credit">${escapeHtml(article.imageCredit)}${article.imageUrl ? " (Wikimedia Commons)" : ""}</figcaption>
  </figure>

  <main class="container subpage-shell">
    <article class="prose-card standalone-article">
      <span class="badge cat-${article.category}">${article.breaking ? '<span class="badge-flag">Udarno</span>' : ""}${escapeHtml(categoryName)}</span>
      <h1 class="standalone-title">${escapeHtml(article.title)}</h1>
      <p class="article-dek">${escapeHtml(article.excerpt)}</p>
      <div class="modal-meta">
        <span class="byline">Napisala UI</span>
        <span>·</span>
        <span>${escapeHtml(article.dateLabel)}</span>
        <span>·</span>
        <span>${article.readMinutes} min branja</span>
      </div>

      <div class="article-actions">
        <button type="button" class="icon-action-btn" id="bookmark-btn" data-id="${article.id}" aria-pressed="false">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
          <span id="bookmark-label">Shrani</span>
        </button>
        <button type="button" class="icon-action-btn" id="share-btn" data-url="${canonicalUrl}" data-title="${escapeHtml(article.title)}">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"></line><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"></line></svg>
          <span id="share-label">Deli</span>
        </button>
      </div>

      <div class="glossary-hint-bar">
        <span>Namig: dotakni se ali postavi miško na <span class="glossary-hint-sample">podčrtan izraz</span> za hitro razlago.</span>
      </div>

      <div class="modal-takeaways">
        <h4>Ključni poudarki</h4>
        <ol>${article.takeaways.map((t) => `<li>${escapeHtml(t)}</li>`).join("")}</ol>
      </div>

      <div class="modal-body">
        ${article.body
          .map((p, i) => `<p>${escapeHtml(p)}</p>${i === 1 && article.body.length >= 3 ? '\n        <div class="ad-slot ad-inline" data-slot="article-inline" data-show="mobile"></div>' : ""}`)
          .join("\n        ")}
      </div>

      <div class="modal-sources">
        <h4>Uporabljeni viri</h4>
        <ol>
          ${(article.sources || [])
            .map(
              (s) =>
                `<li><a href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(s.label)}</a></li>`
            )
            .join("\n          ")}
        </ol>
      </div>

      <p class="modal-ai-note">Članek je napisala UI na podlagi javno dostopnih virov.</p>

      <div class="modal-tags">
        ${article.tags.map((tag) => `<span class="tag-chip">#${escapeHtml(tag)}</span>`).join("")}
      </div>
    </article>

    <section class="related-block" aria-label="Preberite tudi">
      <h2>Preberite tudi</h2>
      <div class="related-grid">${related}
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <div class="container footer-bottom">
      <span>© 2026 AI Dnevnik — Portal za umetno inteligenco.</span>
      <div class="subpage-footer-links">
        <a href="../index.html">Naslovnica</a>
        <a href="../uredniska-nacela.html">Uredniška načela</a>
        <a href="../zasebnost.html">Zasebnost</a>
        <a href="../kontakt.html">Kontakt</a>
        <a href="../zasebnost.html#piskotki" data-consent-open>Piškotki</a>
      </div>
    </div>
  </footer>

  <script src="../config.js"></script>
  <script src="../consent.js"></script>
  <script src="../ads.js"></script>
  <script src="../art.js"></script>
  <script src="../glossary.js"></script>
  <script>
    window.attachArtFallbacks && window.attachArtFallbacks(document);
    const apply = (t) => {
      document.documentElement.setAttribute("data-theme", t);
      try { localStorage.setItem("aidnevnik_theme", t); } catch (e) {}
      const lbl = document.getElementById("theme-label");
      if (lbl) lbl.textContent = t === "dark" ? "Svetli način" : "Temni način";
    };
    apply(document.documentElement.getAttribute("data-theme") || "light");
    document.getElementById("theme-toggle")?.addEventListener("click", () => {
      apply(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
    });
    // Shrani članek v bralni seznam (isti seznam kot na naslovnici)
    const bBtn = document.getElementById("bookmark-btn");
    const readBm = () => { try { return JSON.parse(localStorage.getItem("aidnevnik_bookmarks") || "[]"); } catch (e) { return []; } };
    const paintBm = () => {
      const on = readBm().includes(bBtn.dataset.id);
      bBtn.setAttribute("aria-pressed", String(on));
      document.getElementById("bookmark-label").textContent = on ? "Shranjeno" : "Shrani";
    };
    bBtn.addEventListener("click", () => {
      let list = readBm();
      list = list.includes(bBtn.dataset.id) ? list.filter((x) => x !== bBtn.dataset.id) : [...list, bBtn.dataset.id];
      try { localStorage.setItem("aidnevnik_bookmarks", JSON.stringify(list)); } catch (e) {}
      paintBm();
    });
    paintBm();
    // Deli: sistemski meni za deljenje ali kopiranje povezave
    const sBtn = document.getElementById("share-btn");
    sBtn.addEventListener("click", async () => {
      const lbl = document.getElementById("share-label");
      const data = { title: sBtn.dataset.title, url: sBtn.dataset.url };
      try {
        if (navigator.share) { await navigator.share(data); return; }
        await navigator.clipboard.writeText(data.url);
        lbl.textContent = "Povezava kopirana";
      } catch (e) {
        if (e && e.name === "AbortError") return;
        lbl.textContent = "Kopiranje ni uspelo";
      }
      setTimeout(() => { lbl.textContent = "Deli"; }, 2000);
    });
    const bar = document.getElementById("read-progress-bar");
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.setProperty("--p", max > 0 ? Math.min(1, window.scrollY / max).toFixed(3) : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  </script>
</body>
</html>
`;
  fs.writeFileSync(path.join(articlesDir, `${article.id}.html`), html, "utf8");
}

// 3. Ustvari sitemap.xml
const staticPages = [
  { loc: `${SITE_URL}/`, lastmod: updatedAt.slice(0, 10), priority: "1.0" },
  { loc: `${SITE_URL}/uredniska-nacela.html`, lastmod: "2026-11-13", priority: "0.5" },
  { loc: `${SITE_URL}/metodologija.html`, lastmod: "2026-11-13", priority: "0.5" },
  { loc: `${SITE_URL}/zasebnost.html`, lastmod: "2026-11-13", priority: "0.4" },
  { loc: `${SITE_URL}/kontakt.html`, lastmod: "2026-11-13", priority: "0.4" }
];

const articleUrls = articles.map((a) => ({
  loc: `${SITE_URL}/clanek/${a.id}.html`,
  lastmod: a.timestamp.slice(0, 10),
  priority: "0.8"
}));

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticPages, ...articleUrls]
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;
fs.writeFileSync(path.join(ROOT, "sitemap.xml"), sitemap, "utf8");

// 4. Ustvari robots.txt
const robots = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;
fs.writeFileSync(path.join(ROOT, "robots.txt"), robots, "utf8");

console.log(
  `Zgrajenih ${articles.length} samostojnih strani člankov, data/articles-bundle.js, sitemap.xml in robots.txt.`
);
