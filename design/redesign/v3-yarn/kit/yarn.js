/* ============================================================
   blaqat.net · round 3 · yarn kit helpers (mock-only)
   - window.Yarn: cat logo, reduced-motion check, URL params
   - <yarn-nav active="projects" base="../">: desktop top bar + mobile bottom bar
     mobile material from ?nav=corduroy|suede|cork|burlap (default corduroy)
   - Yarn.mockPanel([...]): small floating "mock options" switcher (URL params)
   - ?from=home on a section page plays the sheet "unroll" entrance
   ============================================================ */
(() => {
  const CAT_PATH =
    "M178.1,100.5 C174.9,91.6 175.4,83.0 178.4,74.7 C181.1,67.3 181.8,59.9 181.3,52.1 C180.5,39.1 180.3,26.1 183.9,13.4 C186.6,3.7 190.6,1.9 198.4,8.1 C205.5,13.6 211.8,20.1 217.9,26.6 C220.8,29.7 223.1,30.7 227.6,30.4 C237.3,29.7 247.2,30.1 256.9,30.7 C260.1,30.8 261.9,30.3 264.1,28.0 C271.2,20.8 278.4,13.5 286.3,7.3 C292.9,2.1 296.5,3.9 298.9,12.0 C302.6,24.7 302.8,37.7 302.0,50.7 C301.5,58.3 302.1,65.7 304.9,72.8 C311.9,91.2 306.7,106.9 293.5,120.3 C289.5,124.3 288.8,128.0 291.1,132.6 C297.8,145.8 304.1,159.2 311.4,172.1 C323.0,193.0 333.6,214.2 338.0,238.0 C344.8,274.8 339.9,308.9 314.6,338.6 C318.1,339.6 321.4,340.2 324.4,341.4 C330.5,343.8 334.0,349.4 333.5,355.4 C333.0,361.8 329.0,366.6 322.5,367.9 C317.8,368.9 312.9,369.3 308.1,369.3 C289.6,369.4 271.0,370.0 252.6,368.9 C233.7,367.9 215.5,371.8 196.9,373.4 C155.6,376.9 114.3,376.8 74.1,364.8 C65.8,362.3 57.6,358.2 50.5,353.3 C35.8,343.1 35.2,325.7 48.2,313.4 C59.3,302.9 73.4,298.1 87.8,294.3 C94.5,292.5 101.5,291.8 108.4,290.7 C110.2,290.4 112.1,290.6 113.9,290.8 C118.4,291.3 121.3,293.9 121.8,298.4 C122.3,303.1 120.2,306.8 115.6,308.0 C109.3,309.6 102.8,310.3 96.5,312.0 C89.0,314.0 81.5,316.4 74.2,319.0 C71.1,320.1 68.2,321.9 65.5,323.8 C58.1,329.1 58.2,333.8 66.4,337.8 C72.7,340.8 79.5,343.1 86.2,344.2 C120.3,349.9 154.2,349.8 187.9,341.9 C193.8,340.5 199.3,337.8 205.0,335.7 C204.9,335.2 204.8,334.7 204.7,334.2 C203.1,334.2 201.4,334.1 199.8,334.2 C190.3,334.9 180.9,335.7 171.5,336.5 C167.7,336.8 165.3,335.2 163.1,332.2 C138.2,298.6 135.8,262.1 149.5,223.7 C156.6,203.8 169.1,186.7 180.3,169.0 C186.8,158.7 192.9,148.3 196.2,136.4 C197.8,130.5 196.9,126.4 192.5,121.6 C186.9,115.5 182.9,107.8 178.1,100.5 z";

  const params = new URLSearchParams(location.search);
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches || params.has("reduced");

  function catSVG(cls = "", fill = "currentColor", label = "") {
    const a11y = label ? `role="img" aria-label="${label}"` : `aria-hidden="true"`;
    return `<svg class="${cls}" viewBox="30 0 320 380" ${a11y}><path fill="${fill}" d="${CAT_PATH}"/></svg>`;
  }

  // Phosphor icons (regular + fill + bold), vendored next to the kit so they also load under strict CSPs
  const KIT_BASE = (document.currentScript && document.currentScript.src) || location.href;
  function ensureIcons() {
    if (document.querySelector("link[data-ph]")) return;
    for (const w of ["regular", "fill", "bold"]) {
      const l = document.createElement("link");
      l.rel = "stylesheet";
      l.href = new URL(`vendor/phosphor/${w}/style.css`, KIT_BASE).href; // @phosphor-icons/web@2.1.1
      l.dataset.ph = w;
      document.head.appendChild(l);
    }
  }
  ensureIcons();

  const PAGES = [
    { key: "projects", label: "Projects", href: "projects/index.html", icon: "ph-folder-simple" },
    { key: "music", label: "Music", href: "music/index.html", icon: "ph-music-notes" },
    { key: "thoughts", label: "Thoughts", href: "thoughts/stitched.html", icon: "ph-cloud" },
    { key: "contact", label: "Contact", href: "home/index.html?skip#contact", icon: "ph-envelope-simple" },
  ];

  class YarnNav extends HTMLElement {
    connectedCallback() {
      const active = this.getAttribute("active") || "";
      const base = this.getAttribute("base") ?? "../";
      const material = params.get("nav") || this.getAttribute("material") || "corduroy";
      const link = (p, cls) =>
        `<a class="${cls}" href="${p.href.startsWith("#") ? p.href : base + p.href}" ${p.key === active ? 'aria-current="page"' : ""}>` +
        `<i class="${p.key === active ? "ph-fill" : "ph"} ${p.icon}" aria-hidden="true"></i><span>${p.label}</span></a>`;
      this.innerHTML = `
        <nav class="ynav" aria-label="Main">
          <a class="ynav__brand" href="${base}home/index.html?skip">${catSVG("", "var(--ink)")}<b>blaqat<i>.</i>net</b></a>
          <div class="ynav__links">${PAGES.map((p) => link(p, "ynav__link rope")).join("")}</div>
        </nav>
        <nav class="ybar m-${material}" aria-label="Main (mobile)">
          <a href="${base}home/index.html?skip"><i class="ph ph-house" aria-hidden="true"></i><span>Home</span></a>
          ${PAGES.slice(0, 3).map((p) => link(p, "")).join("")}
        </nav>`;
    }
  }
  customElements.define("yarn-nav", YarnNav);

  // Small floating options panel for comparing mock variants via URL params.
  // groups: [{ label: "Intro", param: "intro", options: [["a","Yarn drop"],["b","Cursor cat"]], default: "a" }]
  function mockPanel(groups, { title = "Mock options" } = {}) {
    const wrap = document.createElement("details");
    wrap.className = "mockpanel";
    wrap.innerHTML =
      `<summary>${title}</summary>` +
      groups
        .map((g) => {
          const cur = params.get(g.param) ?? g.default;
          return `<fieldset><legend>${g.label}</legend>${g.options
            .map(([v, l]) => `<button type="button" data-p="${g.param}" data-v="${v}" aria-pressed="${String(cur === v)}">${l}</button>`)
            .join("")}</fieldset>`;
        })
        .join("");
    wrap.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-p]");
      if (!b) return;
      const u = new URL(location.href);
      u.searchParams.set(b.dataset.p, b.dataset.v);
      location.href = u.toString();
    });
    document.body.appendChild(wrap);
    if (!document.getElementById("mockpanel-css")) {
      const s = document.createElement("style");
      s.id = "mockpanel-css";
      s.textContent = `
        .mockpanel{position:fixed;top:calc(var(--frame,14px) + 10px);right:calc(var(--frame,14px) + 10px);z-index:9999;max-width:min(320px,calc(100vw - 40px));
          font:600 12px/1.3 var(--font-body,system-ui);color:#1f1e1e;background:#fffdf9f2;border-radius:14px;box-shadow:0 6px 24px rgba(0,0,0,.18);
          outline:1.5px dashed rgba(31,30,30,.3);outline-offset:-5px}
        .mockpanel summary{cursor:pointer;padding:10px 14px;list-style:none;font-weight:800}
        .mockpanel summary::before{content:"⚙︎ ";}
        .mockpanel fieldset{border:0;margin:0;padding:4px 12px 10px;display:flex;flex-wrap:wrap;gap:6px}
        .mockpanel legend{font-weight:800;padding:0 0 4px;color:#6e6868;text-transform:uppercase;letter-spacing:.08em;font-size:10px}
        .mockpanel button{border:0;border-radius:999px;padding:6px 10px;background:#f1ece4;font:inherit;cursor:pointer}
        .mockpanel button[aria-pressed=true]{background:#1f1e1e;color:#fff}`;
      document.head.appendChild(s);
    }
    return wrap;
  }

  // sheet "unroll" entrance when arriving from the home transition
  document.addEventListener("DOMContentLoaded", () => {
    if (params.get("from") === "home" && !reduced()) document.querySelector(".frame")?.classList.add("entering");
  });

  window.Yarn = { CAT_PATH, catSVG, reduced, params, mockPanel };
})();
