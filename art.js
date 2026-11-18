/* Generirane nadomestne ilustracije po rubrikah (ko fotografija manjka ali se ne naloži).
   Vsaka rubrika ima svoj vizualni podpis; vzorec je determinističen glede na id članka. */
(function () {
  const PALETTES = {
    modeli: { bg: "#1f3a68", ink: "#c9d7f2", hi: "#f2c14e" },
    slovenija: { bg: "#285c45", ink: "#cde3d6", hi: "#f2c14e" },
    posel: { bg: "#7a4a12", ink: "#f1dcc0", hi: "#ffffff" },
    robotika: { bg: "#4f3a6e", ink: "#ddd2ee", hi: "#f2c14e" },
    zanimivo: { bg: "#3d434c", ink: "#d8dce2", hi: "#ef7a5a" }
  };

  function rng(seedStr) {
    let h = 2166136261;
    for (let i = 0; i < seedStr.length; i++) {
      h ^= seedStr.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return () => {
      h += 0x6d2b79f5;
      let t = h;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Modeli: mreža nevronov (vozlišča v plasteh, povezana s črtami)
  function neural(r, p) {
    const layers = [4, 6, 6, 5, 3];
    const pts = layers.map((n, li) =>
      Array.from({ length: n }, (_, i) => ({
        x: 120 + li * 140,
        y: 225 + (i - (n - 1) / 2) * (300 / Math.max(n, 2)) + (r() - 0.5) * 18
      }))
    );
    let s = "";
    for (let li = 0; li < pts.length - 1; li++) {
      pts[li].forEach((a) =>
        pts[li + 1].forEach((b) => {
          if (r() < 0.55) s += `<line x1="${a.x}" y1="${a.y.toFixed(1)}" x2="${b.x}" y2="${b.y.toFixed(1)}" stroke="${p.ink}" stroke-opacity="${(0.12 + r() * 0.25).toFixed(2)}" stroke-width="1.2"/>`;
        })
      );
    }
    pts.flat().forEach((pt) => {
      const hot = r() < 0.12;
      s += `<circle cx="${pt.x}" cy="${pt.y.toFixed(1)}" r="${hot ? 9 : 6}" fill="${hot ? p.hi : p.bg}" stroke="${p.ink}" stroke-width="2"/>`;
    });
    return s;
  }

  // Posel / infrastruktura: tloris vezja (pravokotne poti s spajkami)
  function circuit(r, p) {
    let s = "";
    for (let i = 0; i < 26; i++) {
      let x = Math.round((r() * 760 + 20) / 20) * 20;
      let y = Math.round((r() * 410 + 20) / 20) * 20;
      let d = `M${x} ${y}`;
      for (let k = 0; k < 3; k++) {
        if (r() < 0.5) x += (r() < 0.5 ? -1 : 1) * Math.round(r() * 8 + 2) * 20;
        else y += (r() < 0.5 ? -1 : 1) * Math.round(r() * 6 + 2) * 20;
        d += ` L${x} ${y}`;
      }
      s += `<path d="${d}" fill="none" stroke="${p.ink}" stroke-opacity="0.35" stroke-width="2"/>`;
      s += `<circle cx="${x}" cy="${y}" r="5" fill="${r() < 0.15 ? p.hi : p.ink}" fill-opacity="0.8"/>`;
    }
    s += `<rect x="330" y="160" width="140" height="130" rx="6" fill="${p.bg}" stroke="${p.ink}" stroke-width="2.5"/>`;
    for (let i = 0; i < 6; i++) {
      s += `<line x1="${345 + i * 22}" y1="148" x2="${345 + i * 22}" y2="160" stroke="${p.ink}" stroke-width="3"/>`;
      s += `<line x1="${345 + i * 22}" y1="290" x2="${345 + i * 22}" y2="302" stroke="${p.ink}" stroke-width="3"/>`;
    }
    return s;
  }

  // Slovenija in EU: plastnice (topografske črte) in mreža zemljevida
  function contour(r, p) {
    let s = "";
    for (let gx = 0; gx <= 800; gx += 50) s += `<line x1="${gx}" y1="0" x2="${gx}" y2="450" stroke="${p.ink}" stroke-opacity="0.08"/>`;
    for (let gy = 0; gy <= 450; gy += 50) s += `<line x1="0" y1="${gy}" x2="800" y2="${gy}" stroke="${p.ink}" stroke-opacity="0.08"/>`;
    const cx = 300 + r() * 200;
    const cy = 170 + r() * 110;
    for (let k = 1; k <= 9; k++) {
      const base = k * 34;
      let d = "";
      for (let a = 0; a <= 64; a++) {
        const t = (a / 64) * Math.PI * 2;
        const wob = 1 + 0.18 * Math.sin(t * 3 + k * 0.7) + 0.08 * Math.sin(t * 5 + k);
        const x = cx + Math.cos(t) * base * 1.5 * wob;
        const y = cy + Math.sin(t) * base * wob;
        d += `${a ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
      }
      s += `<path d="${d}Z" fill="none" stroke="${p.ink}" stroke-opacity="${(0.55 - k * 0.04).toFixed(2)}" stroke-width="1.6"/>`;
    }
    s += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="7" fill="${p.hi}"/>`;
    return s;
  }

  // Robotika in znanost: zglobi robotske roke in orbite
  function orbit(r, p) {
    let s = "";
    const cx = 400;
    const cy = 225;
    for (let k = 1; k <= 5; k++) {
      s += `<ellipse cx="${cx}" cy="${cy}" rx="${k * 70}" ry="${k * 34}" fill="none" stroke="${p.ink}" stroke-opacity="0.22" stroke-width="1.5" transform="rotate(${(r() * 40 - 20).toFixed(1)} ${cx} ${cy})"/>`;
    }
    let x = 180;
    let y = 380;
    let ang = -1.1;
    let pts = `M${x} ${y}`;
    let joints = "";
    for (let i = 0; i < 4; i++) {
      const len = 110 - i * 15;
      ang += (r() - 0.3) * 0.9;
      x += Math.cos(ang) * len;
      y += Math.sin(ang) * len;
      pts += ` L${x.toFixed(1)} ${y.toFixed(1)}`;
      joints += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${i === 3 ? 10 : 8}" fill="${i === 3 ? p.hi : p.bg}" stroke="${p.ink}" stroke-width="3"/>`;
    }
    s += `<path d="${pts}" fill="none" stroke="${p.ink}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="0.85"/>`;
    s += `<rect x="150" y="378" width="60" height="22" rx="4" fill="${p.ink}" fill-opacity="0.85"/>` + joints;
    return s;
  }

  // Zanimivo z X: rastrski polton (halftone)
  function halftone(r, p) {
    let s = "";
    const fx = 250 + r() * 300;
    const fy = 120 + r() * 200;
    for (let y = 15; y < 450; y += 22) {
      for (let x = 15; x < 800; x += 22) {
        const dist = Math.hypot(x - fx, y - fy);
        const rad = Math.max(0.6, 8.5 - dist / 45);
        s += `<circle cx="${x}" cy="${y}" r="${rad.toFixed(1)}" fill="${p.ink}" fill-opacity="0.55"/>`;
      }
    }
    s += `<circle cx="${fx.toFixed(1)}" cy="${fy.toFixed(1)}" r="12" fill="${p.hi}"/>`;
    return s;
  }

  const DRAW = { modeli: neural, posel: circuit, slovenija: contour, robotika: orbit, zanimivo: halftone };

  window.createCategoryArt = function (category, seed) {
    const cat = PALETTES[category] ? category : "modeli";
    const p = PALETTES[cat];
    const r = rng(String(seed || cat));
    return `<svg class="cat-art" viewBox="0 0 800 450" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Ilustracija rubrike">
      <rect width="800" height="450" fill="${p.bg}"/>${DRAW[cat](r, p)}</svg>`;
  };

  // Zamenja vsako sliko z data-art-category, ki se ne naloži, z ilustracijo rubrike.
  window.attachArtFallbacks = function (root) {
    (root || document).querySelectorAll("img[data-art-category]").forEach((img) => {
      const swap = () => {
        const holder = document.createElement("span");
        holder.className = "art-fallback";
        holder.innerHTML = window.createCategoryArt(img.dataset.artCategory, img.dataset.artSeed);
        img.replaceWith(holder);
      };
      if (img.complete && img.naturalWidth === 0 && img.getAttribute("src")) swap();
      else img.addEventListener("error", swap, { once: true });
    });
  };
})();
