# AI Dnevnik (`aidnevnik.si`)

Slovenski novičarski portal za umetno inteligenco z ločeno podatkovno vsebino, samostojnimi SEO-stranmi člankov, GDPR prijavo na e-novice ter pravnimi/uredniškimi podstranmi.

## Struktura projekta

- `index.html` — glavna naslovna stran portala
- `styles.css` — enotna oblika (svetli in temni način) za naslovnico, članke in podstrani
- `config.js` — nastavitve portala (kontaktni e-naslov, e-novice, brezpiškotna analitika)
- `content/articles.json` — glavni vir člankov in traku *V živo*
- `data/articles-bundle.js` — samodejno ustvarjena različica za delovanje tudi brez strežnika (`file://`)
- `clanek/<id>.html` — samostojne SEO HTML strani za vsak članek (Open Graph, JSON-LD `NewsArticle`)
- `uredniska-nacela.html`, `metodologija.html`, `zasebnost.html`, `kontakt.html` — uredniške in pravne podstrani
- `sitemap.xml`, `robots.txt`, `favicon.svg`

## Kako dodate ali uredite članek

1. Odprite `content/articles.json` in dodajte ali uredite članek v polju `articles`.
2. V mapi projekta zaženite:
   ```powershell
   node scripts/build-content.mjs
   ```
   Skripta samodejno posodobi `data/articles-bundle.js`, ustvari nove strani v `clanek/*.html` in osveži `sitemap.xml`.
3. Za hiter zajem svežih naslovov iz javnih RSS-virov v `content/drafts.json` lahko zaženete:
   ```powershell
   node scripts/fetch-rss-drafts.mjs
   ```

## Kaj urediti pred objavo

- V `config.js` (ter po potrebi v `zasebnost.html` in `uredniska-nacela.html`) zamenjajte fiktivni e-naslov `urednistvo@aidnevnik.si` in podatke o izdajatelju s svojimi.
- V `config.js` pod `newsletter` spremenite `mode: "demo"` v `"endpoint"` in dodajte URL vašega ponudnika e-novic (npr. MailerLite, Brevo ali Formspree).
- Opcijsko pod `analytics` vnesite svojo domeno za brezpiškotno analitiko (Plausible ali Umami).
