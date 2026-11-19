/* Pasica za privolitev v piškotke + Google Consent Mode v2.
   Privzeto so vsi oglasni piškotki zavrnjeni, dokler bralec ne izbere drugače.
   Izbira se shrani v localStorage ("aidnevnik_consent") za 6 mesecev. */
(function () {
  const CONFIG = (window.AI_DNEVNIK_CONFIG || {}).consent || { provider: "builtin" };
  const KEY = "aidnevnik_consent";
  const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 182;
  const base = document.currentScript && document.currentScript.src.includes("/clanek/") ? "../" : "";
  const policyUrl = base + (CONFIG.policyUrl || "zasebnost.html");

  // Google Consent Mode v2: privzeto zavrnjeno, dokler ni izbire
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    wait_for_update: 500
  });

  function read() {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) || "null");
      if (v && Date.now() - v.ts < MAX_AGE_MS) return v;
    } catch (e) { /* shramba ni na voljo */ }
    return null;
  }

  function apply(choice) {
    const g = choice && choice.ads ? "granted" : "denied";
    window.gtag("consent", "update", { ad_storage: g, ad_user_data: g, ad_personalization: g });
  }

  function save(ads) {
    const choice = { ads: !!ads, ts: Date.now(), v: 1 };
    try { localStorage.setItem(KEY, JSON.stringify(choice)); } catch (e) { /* ignoriraj */ }
    apply(choice);
    current = choice;
    close();
    document.dispatchEvent(new CustomEvent("aidnevnik:consent", { detail: choice }));
  }

  let current = read();
  if (current) apply(current);
  let banner = null;

  function close() {
    if (!banner) return;
    banner.classList.add("consent-leaving");
    const el = banner;
    banner = null;
    setTimeout(() => el.remove(), 250);
  }

  function open(showSettings) {
    if (CONFIG.provider === "google") return; // Googlova pasica se prikaže sama
    if (banner) banner.remove();
    banner = document.createElement("div");
    banner.className = "consent-banner";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-live", "polite");
    banner.setAttribute("aria-label", "Nastavitve piškotkov");
    const adsOn = current ? current.ads : false;
    banner.innerHTML = `
      <div class="consent-inner">
        <div class="consent-text">
          <span class="consent-kicker">Piškotki in oglasi</span>
          <p>AI Dnevnik je brezplačen zaradi oglasov. Z vašo privolitvijo Google uporablja piškotke za prikaz oglasov, prilagojenih vašim interesom. Če zavrnete, boste videli manj prilagojene oglase. Izbiro lahko kadarkoli spremenite v nogi strani. <a href="${policyUrl}">Politika zasebnosti</a></p>
          <div class="consent-settings" ${showSettings ? "" : "hidden"}>
            <label class="consent-row">
              <input type="checkbox" checked disabled />
              <span><strong>Nujni</strong> — tema, shranjeni članki in ta izbira. Vedno vklopljeni.</span>
            </label>
            <label class="consent-row">
              <input type="checkbox" id="consent-ads" ${adsOn ? "checked" : ""} />
              <span><strong>Oglasni piškotki</strong> — personalizirani oglasi in merjenje oglasov (Google).</span>
            </label>
          </div>
        </div>
        <div class="consent-actions">
          <button type="button" class="consent-btn consent-primary" data-consent="all">Sprejmi vse</button>
          <button type="button" class="consent-btn" data-consent="none">Samo nujni</button>
          <button type="button" class="consent-btn consent-link" data-consent="${showSettings ? "save" : "settings"}">${showSettings ? "Shrani izbiro" : "Nastavitve"}</button>
        </div>
      </div>`;
    banner.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-consent]");
      if (!btn) return;
      const act = btn.dataset.consent;
      if (act === "all") save(true);
      else if (act === "none") save(false);
      else if (act === "settings") open(true);
      else if (act === "save") save(banner.querySelector("#consent-ads").checked);
    });
    document.body.appendChild(banner);
  }

  window.AI_DNEVNIK_CONSENT = {
    get: () => current,
    open: () => open(true),
    hasDecided: () => !!current || CONFIG.provider === "google"
  };

  function init() {
    document.addEventListener("click", (e) => {
      const link = e.target.closest("[data-consent-open]");
      if (link) {
        e.preventDefault();
        open(true);
      }
    });
    if (!current) open(false);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
