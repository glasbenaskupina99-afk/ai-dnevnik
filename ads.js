/* Oglasna mesta AI Dnevnik.
   V HTML postavite <div class="ad-slot" data-slot="IME" data-show="desktop|mobile|all"></div>.
   Način (config.js → ads.mode):
     "off"     — mesta se odstranijo
     "demo"    — sivi okvirji z velikostjo (predogled postavitve)
     "adsense" — Google AdSense; enota se naloži šele, ko je blizu vidnega dela strani,
                 neizpolnjeno mesto se samodejno zapre. */
(function () {
  const CFG = Object.assign({ mode: "off", adsenseClient: "", slots: {}, infeedEvery: 6 }, (window.AI_DNEVNIK_CONFIG || {}).ads);
  const MOBILE_MAX = 767;

  // Velikost glede na širino zaslona: [širina, višina, opis]
  const SIZES = {
    billboard: (w) => (w >= 1000 ? [970, 250, "Billboard"] : [728, 90, "Leaderboard"]),
    "mobile-top": () => [320, 100, "Mobilna pasica"],
    infeed: (w) => (w > MOBILE_MAX ? [728, 90, "Med novicami"] : [300, 250, "Med novicami"]),
    "pre-models": () => [728, 90, "Leaderboard"],
    "article-inline": () => [300, 250, "V članku"]
  };

  let scriptLoaded = false;
  let observer = null;

  function isVisibleForViewport(el) {
    const show = el.dataset.show || "all";
    const mobile = window.innerWidth <= MOBILE_MAX;
    return show === "all" || (show === "mobile" && mobile) || (show === "desktop" && !mobile);
  }

  function loadAdsense() {
    if (scriptLoaded || !CFG.adsenseClient) return;
    scriptLoaded = true;
    const consent = window.AI_DNEVNIK_CONSENT && window.AI_DNEVNIK_CONSENT.get();
    window.adsbygoogle = window.adsbygoogle || [];
    // Brez privolitve: nepersonalizirani oglasi
    if (!consent || !consent.ads) window.adsbygoogle.requestNonPersonalizedAds = 1;
    const s = document.createElement("script");
    s.async = true;
    s.crossOrigin = "anonymous";
    s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(CFG.adsenseClient)}`;
    document.head.appendChild(s);
  }

  function fillAdsense(slot) {
    const ins = slot.querySelector("ins.adsbygoogle");
    if (!ins || ins.dataset.pushed) return;
    ins.dataset.pushed = "1";
    loadAdsense();
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) { slot.classList.add("ad-empty"); }
  }

  function mountOne(slot) {
    if (slot.dataset.mounted) return;
    if (CFG.mode === "off") { slot.remove(); return; }
    if (!isVisibleForViewport(slot)) return;
    const name = slot.dataset.slot;
    const sizeFn = SIZES[name] || (() => [300, 250, "Oglas"]);
    const [w, h, desc] = sizeFn(window.innerWidth);
    slot.dataset.mounted = "1";
    slot.style.setProperty("--ad-w", `${w}px`);
    slot.style.setProperty("--ad-h", `${h}px`);

    if (CFG.mode === "adsense" && CFG.adsenseClient) {
      const unit = (CFG.slots || {})[name] || "";
      slot.innerHTML = `<span class="ad-label">Oglas</span>
        <div class="ad-box"><ins class="adsbygoogle" style="display:block;width:100%;height:100%"
          data-ad-client="${CFG.adsenseClient}"${unit ? ` data-ad-slot="${unit}"` : ""}
          data-ad-format="${name === "infeed" || name === "article-inline" ? "auto" : "horizontal"}"
          data-full-width-responsive="true"></ins></div>`;
      const go = () => fillAdsense(slot);
      const consentReady = () => window.AI_DNEVNIK_CONSENT ? window.AI_DNEVNIK_CONSENT.hasDecided() : true;
      const whenVisible = () => {
        if (!("IntersectionObserver" in window)) return go();
        observer = observer || new IntersectionObserver((entries) => {
          entries.forEach((en) => {
            if (en.isIntersecting) { observer.unobserve(en.target); en.target._adGo && en.target._adGo(); }
          });
        }, { rootMargin: "300px 0px" });
        slot._adGo = go;
        observer.observe(slot);
      };
      // Oglasi se zahtevajo šele po izbiri v pasici za piškotke
      if (consentReady()) whenVisible();
      else document.addEventListener("aidnevnik:consent", whenVisible, { once: true });
    } else {
      slot.innerHTML = `<span class="ad-label">Oglas</span>
        <div class="ad-box ad-demo" aria-hidden="true">
          <span class="ad-demo-size">${w} × ${h}</span>
          <span class="ad-demo-name">Demo oglasno mesto · ${desc}</span>
        </div>`;
    }
  }

  function mount(root) {
    (root || document).querySelectorAll(".ad-slot[data-slot]").forEach(mountOne);
  }

  // HTML za oglasno mesto, ki ga JS vstavi med dinamično vsebino (npr. seznam člankov)
  function slotHtml(name, show = "all", tag = "div", extraClass = "") {
    if (CFG.mode === "off") return "";
    return `<${tag} class="ad-slot ${extraClass}" data-slot="${name}" data-show="${show}"></${tag}>`;
  }

  // Ob spremembi širine (npr. obrat telefona) vgradi mesta, ki so zdaj vidna
  let rt;
  window.addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => mount(document), 250);
  });

  window.AI_DNEVNIK_ADS = { mount, slotHtml, mode: CFG.mode, infeedEvery: CFG.infeedEvery || 6 };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => mount(document));
  else mount(document);
})();
