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
  analytics: {
    // Brezpiškotna analitika (opcijsko): vnesite npr. "aidnevnik.si" za Plausible ali pustite prazno
    plausibleDomain: "",
    umamiWebsiteId: "",
    umamiScriptUrl: ""
  }
};
