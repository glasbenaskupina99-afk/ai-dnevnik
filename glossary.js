(function () {
  const GLOSSARY_ENTRIES = [
    {
      key: "world-action-model",
      title: "World Action Model (WAM)",
      pattern: "world action model(?:a|u|om|i)?",
      explanation:
        "Napreden model za robotiko, ki na podlagi kamere in ukaza hkrati napove, kako se bo prizor vidno spremenil v prihodnjih trenutkih in katere gibe morajo izvesti motorji robota."
    },
    {
      key: "recursive-self-improvement",
      title: "Recursive Self-Improvement (samodejno samoizboljševanje)",
      pattern: "recursive self-improvement",
      explanation:
        "Proces, pri katerem sistemi UI sami pišejo izboljšave kode, učnih podatkov ali arhitekture za naslednje generacije modelov, kar lahko močno pospeši razvoj brez stalnega človeškega nadzora."
    },
    {
      key: "artificial-analysis",
      title: "Artificial Analysis (Indeks v5)",
      pattern: "Artificial Analysis(?:\\s+v5)?|AA\\s+v5",
      explanation:
        "Neodvisna primerjalna platforma, ki modele UI sistematično ocenjuje po splošni inteligenci in sklepanju (Intelligence Index v5), hitrosti ustvarjanja odgovorov (tok/s) in ceni API."
    },
    {
      key: "lmarena",
      title: "LMArena (Chatbot Arena) in točkovanje Elo",
      pattern: "LMAren[aei]|Chatbot Arena|(?:točkovanj[au]|lestvic[ai]|meril[au])\\s+Elo|\\bElo\\b",
      explanation:
        "Odprta platforma za ocenjevanje modelov UI, kjer uporabniki primerjajo dva anonimna odgovora in izberejo boljšega (blind test). Šahovskemu podoben sistem Elo iz teh dvobojev izračuna kakovost modela v resničnem pogovoru."
    },
    {
      key: "blind-test",
      title: "Blind test (anonimna primerjava)",
      pattern: "blind test(?:a|u|om)?",
      explanation:
        "Način ocenjevanja, pri katerem ocenjevalec ne vidi imena modela, ki je napisal posamezen odgovor. S tem se prepreči pristranskost do znanih blagovnih znamk."
    },
    {
      key: "context-window",
      title: "Kontekstno okno (Context Window)",
      pattern: "(?:kontekstn(?:o|ega|em)\\s+okn(?:o|a|u|om)|context window|Kontekst)",
      explanation:
        "Največja količina besedila, kode ali dokumentov, ki jo model UI lahko »drži v spominu« in obdela naenkrat v enem pogovoru. Večje okno (npr. 1M tokenov) omogoča pregled celih knjig ali večjih programskih projektov."
    },
    {
      key: "reasoning-model",
      title: "Reasoning model (model za globoko sklepanje)",
      pattern: "reasoning model(?:a|u|om|i)?|globok(?:o|ega|emu)\\s+sklepanj(?:e|a|u)",
      explanation:
        "Model UI, ki pred končnim odgovorom porabi dodaten čas za notranje preverjanje korakov in logično sklepanje. Odlično se obnese pri matematiki, programiranju in zapleteni analizi."
    },
    {
      key: "open-weights",
      title: "Odprte uteži (Open-Weights)",
      pattern: "open-weights|odprtih uteži",
      explanation:
        "Model UI, katerega naučene parametre (»uteži«) razvijalec javno objavi, tako da ga lahko podjetja in raziskovalci prenesejo, prilagodijo in poganjajo na lastnih strežnikih."
    },
    {
      key: "agentic",
      title: "UI-agenti in agentni delovni tokovi (Agentic Workflows)",
      pattern: "agentic workflows|UI-agent(?:i|ov|om|e)|avtonomn(?:i|ih|im)\\s+agent(?:i|ov|e)",
      explanation:
        "Sistemi UI, ki ne odgovarjajo le na posamezna vprašanja, temveč samostojno načrtujejo več korakov zapored, uporabljajo zunanja orodja ter opravljajo naloge v programih."
    },
    {
      key: "tool-calling",
      title: "Klicanje orodij (Tool Calling)",
      pattern: "tool calling|klicanj(?:e|u)\\s+(?:zunanjih\\s+)?orodij",
      explanation:
        "Zmožnost modela UI, da samodejno sproži zunanji program, bazo podatkov, brskalnik ali vmesnik API za pridobitev svežih podatkov ali izvedbo konkretnega dejanja."
    },
    {
      key: "in-memory",
      title: "Računanje v pomnilniku (In-Memory Computing)",
      pattern: "in-memory computing",
      explanation:
        "Strojna zasnova čipov, kjer se izračuni UI izvajajo neposredno v hitrem pomnilniku namesto nenehnega prenašanja podatkov med pomnilnikom in procesorjem, kar močno pospeši odzivnost."
    },
    {
      key: "off-grid",
      title: "Behind-the-meter / Off-grid napajanje",
      pattern: "behind-the-meter|off-grid",
      explanation:
        "Neposredno napajanje podatkovnih centrov iz elektrarne ali lastnega vira energije mimo javnega prenosnega omrežja, s čimer podjetja obidejo večletne čakalne vrste za priklop."
    },
    {
      key: "long-horizon",
      title: "Long-horizon (dolgoročne naloge)",
      pattern: "long-horizon",
      explanation:
        "Zapletena opravila, pri katerih mora model UI samostojno ohranjati cilj, načrtovati in odpravljati napake skozi desetine ali stotine zaporednih korakov (npr. dolge migracije kode)."
    },
    {
      key: "distillation",
      title: "Destilacija modelov (Distillation Attacks)",
      pattern: "distillation attacks|destilacijskih napadov",
      explanation:
        "Prenos znanja z večjega modela na manjšega z učenjem na njegovih odgovorih. Pri »destilacijskih napadih« konkurenti brez dovoljenja množično zbirajo odgovore tujega modela za urjenje svojega."
    },
    {
      key: "frontier",
      title: "Frontier modeli (najnaprednejši modeli)",
      pattern: "frontier",
      explanation:
        "Najzmogljivejši modeli umetne inteligence na samem robu trenutnega razvoja, ki pogosto prvi dosežejo nove zmožnosti in zahtevajo strožje varnostno preverjanje."
    },
    {
      key: "deepfake",
      title: "Deepfake (ponaredki UI)",
      pattern: "deepfake",
      explanation:
        "Z umetno inteligenco ustvarjene ali spremenjene slike, videoposnetki ali glasovni posnetki, ki zelo prepričljivo posnemajo resnične osebe in izjave, ki se niso zgodile."
    },
    {
      key: "tokens",
      title: "Tokeni (enote besedila) in tok/s",
      pattern: "token(?:i|ov|om|e|u|a)?|tok\\/s",
      explanation:
        "Osnovni gradniki besedila (delčki besed ali zlogi), ki jih obdeluje model UI. Približno 1.000 tokenov ustreza 700–750 besedam; »tok/s« pomeni število ustvarjenih tokenov na sekundo."
    },
    {
      key: "api",
      title: "API (programski vmesnik)",
      pattern: "API",
      explanation:
        "Vmesnik za programerje in podjetja, prek katerega se njihove aplikacije neposredno povežejo z modelom UI in ga uporabljajo v ozadju, z obračunom glede na porabljene tokene."
    },
    {
      key: "rag",
      title: "RAG (Retrieval-Augmented Generation)",
      pattern: "RAG",
      explanation:
        "Pristop, pri katerem model pred odgovorom poišče podatke v izbranih dokumentih ali bazi znanja podjetja in svoj odgovor opre nanje, kar zmanjša napačne navedbe."
    },
    {
      key: "smr",
      title: "SMR (mali modularni jedrski reaktorji)",
      pattern: "SMR",
      explanation:
        "Kompaktni jedrski reaktorji manjše moči (običajno do 300 MW), izdelani modularno za hitrejšo postavitev v bližini velikih energetskih porabnikov, kot so podatkovni centri UI."
    },
    {
      key: "ppa",
      title: "PPA (Power Purchase Agreement)",
      pattern: "PPA",
      explanation:
        "Dolgoročna pogodba za neposreden zakup električne energije med proizvajalcem (npr. sončne, vetrne ali jedrske elektrarne) in velikim porabnikom."
    },
    {
      key: "ipo",
      title: "IPO (Initial Public Offering — borzni prvenec)",
      pattern: "IPO",
      explanation:
        "Prva javna ponudba delnic zasebnega podjetja na borzi, s katero družba zbere kapital vlagateljev in omogoči javno trgovanje s svojimi delnicami."
    },
    {
      key: "tpu",
      title: "TPU (Tensor Processing Unit)",
      pattern: "TPU",
      explanation:
        "Googlovi namenski čipi, razviti posebej za pospeševanje učenja in delovanja nevronskih mrež ter velikih jezikovnih modelov (alternativa grafičnim čipom GPU)."
    },
    {
      key: "lidar",
      title: "LiDAR (lasersko zaznavanje prostora)",
      pattern: "LiDAR",
      explanation:
        "Senzor, ki s pomočjo laserskih žarkov v realnem času meri razdalje in ustvarja natančno trirazsežnostno (3D) sliko okolice za robote in avtonomna vozila."
    },
    {
      key: "cve",
      title: "CVE (register varnostnih ranljivosti)",
      pattern: "CVE",
      explanation:
        "Javni mednarodni seznam znanih varnostnih napak v programski opremi (Common Vulnerabilities and Exposures), ki služi tudi kot preizkus sposobnosti UI za kibernetsko obrambo."
    },
    {
      key: "llm",
      title: "LLM (veliki jezikovni modeli)",
      pattern: "LLM",
      explanation:
        "Large Language Model — veliki jezikovni model (npr. Gemini, Claude, GPT), naučen na ogromnih količinah besedil za razumevanje, povzemanje, prevajanje in pisanje kode."
    },
    {
      key: "vibe-coding",
      title: "Vibe coding (programiranje z opisi)",
      pattern: "vibe coding(?:a|u|om)?|vibe-coding(?:a|u|om)?",
      explanation:
        "Način ustvarjanja programov in iger, pri katerem uporabnik s sprotnimi pogovornimi navodili vodi model UI, ki samodejno napiše in sproti popravlja celotno kodo."
    },
    {
      key: "otec",
      title: "OTEC (pretvorba toplotne energije oceanov)",
      pattern: "OTEC",
      explanation:
        "Ocean Thermal Energy Conversion — tehnologija pridobivanja elektrike iz temperaturne razlike med toplo površinsko tropsko vodo in ledeno mrzlo vodo iz oceanskih globin."
    },
    {
      key: "tokenizacija",
      title: "Plačilni žetoni (tokenizacija kartic)",
      pattern: "plačiln(?:i|ih|im|e)\\s+žeton(?:i|ov|om|e)?|tokenizacij[aoe]",
      explanation:
        "Varnostni mehanizem, pri katerem se prava številka bančne kartice zamenja z začasno enkratno šifro (žetonom), tako da UI-agent ali trgovec nikoli ne vidi pravih podatkov."
    }
  ];

  const ENTRY_MAP = Object.fromEntries(GLOSSARY_ENTRIES.map((e) => [e.key, e]));
  const COMBINED_REGEX = new RegExp(
    "(?<![A-Za-z0-9čšžČŠŽ-])(" +
      GLOSSARY_ENTRIES.map((e) => `(?<k_${e.key.replace(/-/g, "_")}>${e.pattern})`).join("|") +
      ")(?![A-Za-z0-9čšžČŠŽ-])",
    "gi"
  );

  const SKIP_TAGS = new Set(["A", "BUTTON", "SCRIPT", "STYLE", "SVG", "CODE", "H1", "H2", "H3", "H4", "SELECT", "OPTION", "INPUT", "TEXTAREA"]);
  const SKIP_CLASSES = ["glossary-term", "glossary-popover", "badge", "photo-credit", "card-sources", "ai-byline", "card-meta"];

  let popoverEl = null;
  let activeTrigger = null;
  let hideTimer = null;

  function ensurePopover() {
    if (popoverEl) return popoverEl;
    popoverEl = document.createElement("div");
    popoverEl.id = "glossary-popover";
    popoverEl.className = "glossary-popover hidden";
    popoverEl.setAttribute("role", "dialog");
    popoverEl.setAttribute("aria-live", "polite");
    popoverEl.innerHTML = `
      <div class="glossary-pop-head">
        <span class="glossary-pop-kicker">Razlaga izraza</span>
        <button type="button" class="glossary-pop-close" aria-label="Zapri razlago">×</button>
      </div>
      <strong class="glossary-pop-title" id="glossary-pop-title"></strong>
      <p class="glossary-pop-desc" id="glossary-pop-desc"></p>
    `;
    document.body.appendChild(popoverEl);

    popoverEl.querySelector(".glossary-pop-close").addEventListener("click", (e) => {
      e.stopPropagation();
      hidePopover();
    });
    popoverEl.addEventListener("mouseenter", () => clearTimeout(hideTimer));
    popoverEl.addEventListener("mouseleave", () => scheduleHide());
    popoverEl.addEventListener("click", (e) => e.stopPropagation());
    return popoverEl;
  }

  function positionPopover(trigger) {
    const pop = ensurePopover();
    const rect = trigger.getBoundingClientRect();
    pop.classList.remove("hidden");
    const popRect = pop.getBoundingClientRect();
    const margin = 12;

    let top = rect.bottom + 8;
    if (top + popRect.height > window.innerHeight - margin && rect.top - popRect.height - 8 > margin) {
      top = rect.top - popRect.height - 8;
    }
    let left = rect.left + rect.width / 2 - popRect.width / 2;
    left = Math.max(margin, Math.min(left, window.innerWidth - popRect.width - margin));

    pop.style.top = `${Math.round(top)}px`;
    pop.style.left = `${Math.round(left)}px`;
  }

  function showPopover(trigger) {
    clearTimeout(hideTimer);
    const entry = ENTRY_MAP[trigger.dataset.term];
    if (!entry) return;
    if (activeTrigger && activeTrigger !== trigger) {
      activeTrigger.setAttribute("aria-expanded", "false");
    }
    activeTrigger = trigger;
    trigger.setAttribute("aria-expanded", "true");

    const pop = ensurePopover();
    pop.querySelector("#glossary-pop-title").textContent = entry.title;
    pop.querySelector("#glossary-pop-desc").textContent = entry.explanation;
    positionPopover(trigger);
  }

  function hidePopover() {
    clearTimeout(hideTimer);
    if (popoverEl) popoverEl.classList.add("hidden");
    if (activeTrigger) {
      activeTrigger.setAttribute("aria-expanded", "false");
      activeTrigger = null;
    }
  }

  function scheduleHide() {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      if (activeTrigger && activeTrigger.dataset.pinned === "true") return;
      hidePopover();
    }, 180);
  }

  function shouldSkipNode(node) {
    let cur = node.parentElement;
    while (cur) {
      if (SKIP_TAGS.has(cur.tagName)) return true;
      for (const cls of SKIP_CLASSES) {
        if (cur.classList && cur.classList.contains(cls)) return true;
      }
      cur = cur.parentElement;
    }
    return false;
  }

  function findMatchedEntryKey(groups) {
    if (!groups) return null;
    for (const entry of GLOSSARY_ENTRIES) {
      const gName = `k_${entry.key.replace(/-/g, "_")}`;
      if (groups[gName] !== undefined) return entry.key;
    }
    return null;
  }

  function annotateGlossary(root) {
    if (!root) return;
    const blockSeen = new WeakMap();
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        if (shouldSkipNode(node)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    const textNodes = [];
    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }

    for (const node of textNodes) {
      const text = node.nodeValue;
      COMBINED_REGEX.lastIndex = 0;
      const matches = [...text.matchAll(COMBINED_REGEX)];
      if (!matches.length) continue;

      const block = node.parentElement.closest("p, li, td, div, span") || node.parentElement;
      if (!blockSeen.has(block)) blockSeen.set(block, new Set());
      const seen = blockSeen.get(block);

      const frag = document.createDocumentFragment();
      let lastIdx = 0;
      let changed = false;

      for (const m of matches) {
        const key = findMatchedEntryKey(m.groups);
        if (!key || seen.has(key)) continue;

        seen.add(key);
        changed = true;
        if (m.index > lastIdx) {
          frag.appendChild(document.createTextNode(text.slice(lastIdx, m.index)));
        }

        const span = document.createElement("span");
        span.className = "glossary-term";
        span.tabIndex = 0;
        span.setAttribute("role", "button");
        span.setAttribute("aria-expanded", "false");
        span.dataset.term = key;
        span.textContent = m[0];
        frag.appendChild(span);

        lastIdx = m.index + m[0].length;
      }

      if (changed) {
        if (lastIdx < text.length) {
          frag.appendChild(document.createTextNode(text.slice(lastIdx)));
        }
        node.parentNode.replaceChild(frag, node);
      }
    }
  }

  function bindGlobalListeners() {
    if (document.body.dataset.glossaryBound === "true") return;
    document.body.dataset.glossaryBound = "true";

    document.addEventListener("click", (e) => {
      const term = e.target.closest(".glossary-term");
      if (term) {
        e.preventDefault();
        e.stopPropagation();
        if (activeTrigger === term && term.dataset.pinned === "true" && popoverEl && !popoverEl.classList.contains("hidden")) {
          delete term.dataset.pinned;
          hidePopover();
        } else {
          if (activeTrigger) delete activeTrigger.dataset.pinned;
          term.dataset.pinned = "true";
          showPopover(term);
        }
        return;
      }
      if (!e.target.closest("#glossary-popover")) {
        if (activeTrigger) delete activeTrigger.dataset.pinned;
        hidePopover();
      }
    });

    document.addEventListener("mouseover", (e) => {
      const term = e.target.closest(".glossary-term");
      if (!term) return;
      if (activeTrigger && activeTrigger.dataset.pinned === "true" && activeTrigger !== term) return;
      showPopover(term);
    });

    document.addEventListener("mouseout", (e) => {
      const term = e.target.closest(".glossary-term");
      if (!term) return;
      scheduleHide();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (activeTrigger) delete activeTrigger.dataset.pinned;
        hidePopover();
        return;
      }
      const term = e.target.closest && e.target.closest(".glossary-term");
      if (term && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        term.dataset.pinned = "true";
        showPopover(term);
      }
    });

    window.addEventListener("scroll", () => {
      if (activeTrigger && popoverEl && !popoverEl.classList.contains("hidden")) {
        positionPopover(activeTrigger);
      }
    }, { passive: true });

    window.addEventListener("resize", () => hidePopover(), { passive: true });
  }

  window.AI_DNEVNIK_GLOSSARY = GLOSSARY_ENTRIES;
  window.annotateGlossary = function (root) {
    bindGlobalListeners();
    annotateGlossary(root);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      bindGlobalListeners();
      const standalone = document.querySelector(".standalone-article, .prose-card");
      if (standalone) annotateGlossary(standalone);
    });
  } else {
    bindGlobalListeners();
    const standalone = document.querySelector(".standalone-article, .prose-card");
    if (standalone) annotateGlossary(standalone);
  }
})();
