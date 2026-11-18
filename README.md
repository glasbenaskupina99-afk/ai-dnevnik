# AI Dnevnik (`aidnevnik.si`)

Slovenski novičarski portal za umetno inteligenco z ločeno podatkovno vsebino, samostojnimi SEO-stranmi člankov, GDPR prijavo na e-novice ter pravnimi/uredniškimi podstranmi.

## Struktura projekta

- `index.html` — glavna naslovna stran portala
- `styles.css` — oblikovni sistem »Časopis« (svetli in temni način) za naslovnico, članke in podstrani
- `art.js` — generirane nadomestne ilustracije po rubrikah, ko fotografija manjka ali se ne naloži
- `images/` — lokalne kopije naslovnih fotografij (WebP, do 1200 px)
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

## Fotografije

Naslovne fotografije so shranjene lokalno v `images/`, saj zunanje povezave na Wikimedio niso zanesljive. Za nov članek v `content/articles.json` vpišite URL fotografije z Wikimedia Commons v `imageUrl` in zaženite:

```powershell
python scripts/fetch-images.py
node scripts/build-content.mjs
```

Skript prenese vse še zunanje fotografije (počasi, ker Wikimedia omejuje hitrost), jih pretvori v WebP in v `imageUrl` zapiše lokalno pot (izvorni URL ostane v `imageSource`). Dokler fotografije ni, stran samodejno pokaže ilustracijo rubrike.

## Oglasi in piškotki

Oglasna mesta in pasica za piškotke se nastavijo v `config.js` (`ads`, `consent`):

- `ads.mode: "demo"` pokaže sive okvirje z velikostmi; `"off"` oglase izklopi; `"adsense"` prikaže Google AdSense.
- Mesta: pasica pod trakom »V živo« (namizje), pod glavno novico (mobilno), med novicami in v seznamu starejših člankov, pred primerjavo modelov (namizje) ter v članku po 2. odstavku (mobilno).
- Ko vas Google odobri, vpišite `adsenseClient: "ca-pub-…"` in po želji ID-je oglasnih enot v `ads.slots`, nato `mode: "adsense"`.
- Za personalizirane oglase v EU Google zahteva certificirano pasico za privolitev: v AdSense vklopite *Zasebnost in sporočila → Evropski predpisi* in v `config.js` nastavite `consent.provider: "google"`. Vgrajena pasica (`"builtin"`) je namenjena predogledu.

## Kaj urediti pred objavo

- V `config.js` (ter po potrebi v `zasebnost.html` in `uredniska-nacela.html`) zamenjajte fiktivni e-naslov `urednistvo@aidnevnik.si` in podatke o izdajatelju s svojimi.
- V `config.js` pod `newsletter` spremenite `mode: "demo"` v `"endpoint"` in dodajte URL vašega ponudnika e-novic (npr. MailerLite, Brevo ali Formspree).
- Opcijsko pod `analytics` vnesite svojo domeno za brezpiškotno analitiko (Plausible ali Umami).
