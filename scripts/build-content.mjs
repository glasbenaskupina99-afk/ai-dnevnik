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

for (const article of articles) {
  const categoryName = categoryLabels[article.category] || article.category;
  const canonicalUrl = `${SITE_URL}/clanek/${article.id}.html`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.excerpt,
    image: [article.imageUrl],
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
  <meta property="og:image" content="${escapeHtml(article.imageUrl)}" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(article.title)}" />
  <meta name="twitter:description" content="${escapeHtml(article.excerpt)}" />
  <meta name="twitter:image" content="${escapeHtml(article.imageUrl)}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Newsreader:ital,opsz,wght@0,6..72,500;0,6..72,600;0,6..72,700;1,6..72,500&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="../styles.css" />
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body>
  <header class="masthead">
    <div class="container masthead-inner">
      <a href="../index.html" class="brand-logo">
        <span class="brand-mark" aria-hidden="true">
          <svg width="32" height="32" viewBox="0 0 64 64" fill="none">
            <rect x="2" y="2" width="60" height="60" rx="14" fill="#12151c" />
            <rect x="2.75" y="2.75" width="58.5" height="58.5" rx="13.25" stroke="#ffffff" stroke-opacity="0.14" stroke-width="1.5" />
            <rect x="21" y="45" width="22" height="5.5" rx="2.5" fill="#faf9f6" />
            <path d="M22 43L18.5 31L32 16L45.5 31L42 43H22Z" fill="#faf9f6" />
            <line x1="32" y1="31.5" x2="32" y2="16.5" stroke="#12151c" stroke-width="2.4" stroke-linecap="round" />
            <circle cx="32" cy="32" r="4.5" fill="#1d4ed8" />
            <circle cx="32" cy="32" r="1.9" fill="#93c5fd" />
            <circle cx="32" cy="11.5" r="3.6" fill="#dc2626" />
          </svg>
        </span>
        <span class="brand-text">
          <strong>AI DNEVNIK</strong>
          <small>UMETNA INTELIGENCA · SLOVENIJA &amp; SVET</small>
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

  <main class="container subpage-shell">
    <article class="prose-card standalone-article">
      <span class="badge ${article.breaking ? "breaking" : ""}">${escapeHtml(categoryName)}</span>
      <h1 class="standalone-title">${escapeHtml(article.title)}</h1>
      <div class="modal-meta">
        <span>${escapeHtml(article.dateLabel)}</span>
        <span>·</span>
        <span>${article.readMinutes} min branja</span>
      </div>

      <div class="glossary-hint-bar">
        <span>Namig: dotakni se ali postavi miško na <span class="glossary-hint-sample">podčrtan izraz</span> za hitro razlago.</span>
      </div>

      <figure class="modal-figure">
        <div class="modal-art">
          <img src="${escapeHtml(article.imageUrl)}" alt="${escapeHtml(article.imageAlt)}" referrerpolicy="no-referrer" />
        </div>
        <figcaption class="modal-photo-credit">${escapeHtml(article.imageCredit)} (Wikimedia Commons)</figcaption>
      </figure>

      <div class="modal-takeaways">
        <h4>Ključni poudarki</h4>
        <ul>${article.takeaways.map((t) => `<li>${escapeHtml(t)}</li>`).join("")}</ul>
      </div>

      <div class="modal-body">
        ${article.body.map((p) => `<p>${escapeHtml(p)}</p>`).join("\n        ")}
      </div>

      <div class="modal-sources">
        <h4>Uporabljeni viri</h4>
        <ul>
          ${(article.sources || [])
            .map(
              (s) =>
                `<li><a href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(s.label)}</a></li>`
            )
            .join("\n          ")}
        </ul>
      </div>

      <p class="modal-ai-note">Članek je napisala UI na podlagi javno dostopnih virov.</p>

      <div class="modal-tags">
        ${article.tags.map((tag) => `<span class="tag-chip">#${escapeHtml(tag)}</span>`).join("")}
      </div>
    </article>
  </main>

  <footer class="site-footer">
    <div class="container footer-bottom">
      <span>© 2026 AI Dnevnik — Portal za umetno inteligenco.</span>
      <div class="subpage-footer-links">
        <a href="../index.html">Naslovnica</a>
        <a href="../uredniska-nacela.html">Uredniška načela</a>
        <a href="../zasebnost.html">Zasebnost</a>
        <a href="../kontakt.html">Kontakt</a>
      </div>
    </div>
  </footer>

  <script src="../glossary.js"></script>
  <script>
    const savedTheme = localStorage.getItem("aidnevnik_theme") || "light";
    const apply = (t) => {
      document.documentElement.setAttribute("data-theme", t);
      localStorage.setItem("aidnevnik_theme", t);
      const lbl = document.getElementById("theme-label");
      if (lbl) lbl.textContent = t === "dark" ? "Svetli način" : "Temni način";
    };
    apply(savedTheme);
    document.getElementById("theme-toggle")?.addEventListener("click", () => {
      apply(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
    });
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
