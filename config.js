// Osrednja konfiguracija portala AI Dnevnik
// Pred objavo na spletu zamenjajte fiktivne podatke s svojimi.
window.AI_DNEVNIK_CONFIG = {
  siteName: "AI Dnevnik",
  siteUrl: "https://aidnevnik.si",
  // Fiktivni kontaktni e-naslov — zamenjajte pred objavo
  contactEmail: "urednistvo@aidnevnik.si",
  publisherPlaceholder: "Uredništvo AI Dnevnik (vnesite ime izdajatelja oz. podjetja)",
  newsletter: {
    // Možnosti: "demo" (lokalna simulacija) | "endpoint" (MailerLite / Brevo / Formspree / lastni API)
    mode: "demo",
    endpoint: "",
    doubleOptInNote: "Na vaš e-naslov smo poslali potrditveno povezavo (dvojna privolitev)."
  },
  ads: {
    // Možnosti: "off" (brez oglasov) | "demo" (sivi okvirji z velikostmi) | "adsense" (Google AdSense)
    mode: "demo",
    // Po odobritvi AdSense vpišite svojo kodo založnika, npr. "ca-pub-1234567890123456"
    adsenseClient: "",
    // ID-ji oglasnih enot iz AdSense (Oglasi → Po oglasni enoti). Prazno = samodejna enota.
    slots: {
      billboard: "",      // pasica pod trakom »V živo« (namizje)
      "mobile-top": "",   // pod glavno novico (mobilno)
      infeed: "",         // med novicami (vsi zasloni)
      "pre-models": "",   // pred primerjavo modelov (namizje)
      "article-inline": "" // v članku po 2. odstavku (mobilno)
    },
    // Oglas v seznamu starejših člankov po vsakih N vrsticah
    infeedEvery: 6
  },
  consent: {
    // "builtin" = vgrajena pasica (za predogled in nepersonalizirane oglase)
    // "google"  = Googlova certificirana pasica (AdSense → Zasebnost in sporočila); OBVEZNO za personalizirane oglase v EU
    provider: "builtin",
    policyUrl: "zasebnost.html"
  },
  analytics: {
    // Brezpiškotna analitika (opcijsko): vnesite npr. "aidnevnik.si" za Plausible ali pustite prazno
    plausibleDomain: "",
    umamiWebsiteId: "",
    umamiScriptUrl: ""
  }
};
