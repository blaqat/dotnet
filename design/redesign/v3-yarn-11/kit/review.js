/* ============================================================
   blaqat.net · yarn mocks · i5 · REVIEW TOOLS (kit/review.js)
   Loaded by kit/yarn.js on every page (right after posts.js). Docs: kit/COMPONENTS.md "Review tools".

   R1 notes      a note on the page and on each ⚙ option (in the panel), and on any element (the picker),
                 shown as quiet numbered pins on the page (toggle in the panel).
   R2 choices    a click on a value in an Open or Earlier ⚙ group is saved. kit/yarn.js puts the saved choices into
                 the URL before anything reads it (the "review tools (R2)" block near its top); a param already in
                 the URL wins. Scope: kit groups (and params the kit reads: Yarn.opts, posts.js, player.js) apply on
                 every page; page groups per section folder (home, projects, music, thoughts, studio …), because
                 param names repeat across folders (view, layout, id). Jump to / demo-state groups never persist.
   R3 round-up   review.html reads the same store (window.YarnReview) + review/options-i9.js + review/questions-i9.js.

   Store: localStorage "yarn.review.i11" (sessionStorage, then memory, when storage is blocked)
     { v: 1,
       choices: { kit: { toast: { v, page, at } }, projects: { ptype: { v, page, at } }, … },
       notes: { page: { "projects/index.html": { text, url, at } },
                opt:  { "kit:toast": { text, label, scope, param, page, url, at } },
                el:   [{ id, page, url, text, kind, label, sel, choices: { param: value }, at }] },
       answers: { "<question id>": { v, note, at } },
       prefs: { pins: true } }

   Everything outside the ⚙ panel (pins, picker, note editor) lives in one <div class="yrv-root">. Screenshots:
   hide `.mockpanel, .yrv-root` (the root also hides itself whenever .mockpanel is display:none).
   With no notes on a page and the panel closed this file adds no listeners beyond one "ypanel" listener.
   ============================================================ */
(() => {
  "use strict";
  if (window.YarnReview) return;
  const KEY = "yarn.review.i11";
  const html = document.documentElement;
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const txt = (s) => String(s || "").replace(/\s+/g, " ").trim();
  const cut = (s, n) => (s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s);

  /* ---------- where we are ---------- */
  const ME = (document.currentScript && document.currentScript.src) || new URL("kit/review.js", location.href).href;
  const ROOT = new URL("../", ME).href;
  const ROOT_PATH = new URL(ROOT).pathname;
  const pathOf = (loc) => { let p = loc.pathname; p = p.startsWith(ROOT_PATH) ? p.slice(ROOT_PATH.length) : p; try { p = decodeURIComponent(p); } catch (_) {} return p || "index.html"; };
  const PAGE = pathOf(location);
  const SECTION = (PAGE.match(/^([^/]+)\//) || [])[1] || "root";
  const rel = (path) => new URL(path, ROOT).href;
  const here = () => PAGE + location.search;
  const embedded = () => html.hasAttribute("data-embed");

  /* ---------- storage (same backend order as kit/yarn.js's early block) ---------- */
  const MEM = new Map();
  const backend = (() => {
    for (const kind of ["localStorage", "sessionStorage"]) {
      try { const st = window[kind]; st.getItem(KEY); return { kind, get: (k) => st.getItem(k), set: (k, v) => st.setItem(k, v) }; } catch (_) {}
    }
    return { kind: "memory", get: (k) => (MEM.has(k) ? MEM.get(k) : null), set: (k, v) => MEM.set(k, v) };
  })();
  const blank = () => ({ v: 1, choices: {}, notes: { page: {}, opt: {}, el: [] }, answers: {}, prefs: {} });
  function load() {
    let d = null;
    try { d = JSON.parse(backend.get(KEY) || "null"); } catch (_) {}
    const b = blank();
    if (!d || typeof d !== "object") return b;
    const n = d.notes || {};
    return { ...b, ...d, choices: d.choices || {}, answers: d.answers || {}, prefs: d.prefs || {},
      notes: { page: n.page || {}, opt: n.opt || {}, el: Array.isArray(n.el) ? n.el : [] } };
  }
  let lastSaveOK = true;
  function save(d) {
    try { backend.set(KEY, JSON.stringify(d)); lastSaveOK = true; } catch (_) { lastSaveOK = false; }
    dispatchEvent(new CustomEvent("yreview", { detail: { local: true } }));
    return lastSaveOK;
  }
  // read → change → write in one step: another tab may have written since we last looked
  function update(fn) { const d = load(); fn(d); save(d); return d; }

  /* ---------- choices (R2) ---------- */
  // params the kit's own files read on every page (besides Yarn.opts): posts.js, player.js, Yarn.disc
  const KIT_READS = new Set(["kicker", "colors", "disclong", "pnotes", "disc", "discat", "pwip", "pwipc"]);
  const isKitParam = (param) => KIT_READS.has(param) || !!(window.Yarn && window.Yarn.opts && param in window.Yarn.opts);
  const scopeOf = (g, kitList = []) => (kitList.includes(g) || g.global || isKitParam(g.param) ? "kit" : SECTION);
  function setChoice(scope, param, v, page = PAGE) {
    update((d) => { (d.choices[scope] ||= {})[param] = { v: String(v ?? ""), page, at: Date.now() }; });
  }
  function forgetChoice(scope, param) {
    update((d) => { const s = d.choices[scope]; if (!s) return; delete s[param]; if (!Object.keys(s).length) delete d.choices[scope]; });
  }
  const countChoices = (d, scopes) => Object.entries(d.choices).filter(([s]) => !scopes || scopes.includes(s)).reduce((n, [, o]) => n + Object.keys(o || {}).length, 0);
  // the URL without the given saved params (only where the URL still shows the saved value)
  function urlWithout(pairs) {
    const u = new URL(location.href);
    for (const [k, v] of pairs) if (u.searchParams.get(k) === v) u.searchParams.delete(k);
    return u.href;
  }

  /* ---------- notes (R1) ---------- */
  const optKey = (scope, param) => scope + ":" + param;
  function setPageNote(text) {
    update((d) => { if (txt(text)) d.notes.page[PAGE] = { text, url: here(), at: Date.now() }; else delete d.notes.page[PAGE]; });
  }
  function setOptNote(scope, g, text) {
    const k = optKey(scope, g.param);
    update((d) => { if (txt(text)) d.notes.opt[k] = { text, label: g.label, scope, param: g.param, page: PAGE, url: here(), at: Date.now() }; else delete d.notes.opt[k]; });
  }
  const uid = () => "n" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  function putElNote(rec) {
    update((d) => {
      const i = d.notes.el.findIndex((n) => n.id === rec.id);
      if (!txt(rec.text)) { if (i >= 0) d.notes.el.splice(i, 1); return; }
      rec.at = Date.now();
      if (i >= 0) d.notes.el[i] = { ...d.notes.el[i], ...rec }; else d.notes.el.push(rec);
    });
  }
  const pageEls = (d = load()) => d.notes.el.filter((n) => n.page === PAGE);

  /* ---------- the ⚙ panel: notes box, ✎ per option, saved marks ---------- */
  let groupsNow = { page: [], kit: [] };
  let panelEl = null;
  // the current value of every non-state ⚙ group that differs from its default
  function currentChoices() {
    const p = new URLSearchParams(location.search), out = {};
    for (const g of [...groupsNow.page, ...groupsNow.kit]) {
      if (!g || g.state) continue;
      const def = g.default ?? "", v = p.get(g.param) ?? def;
      if (v !== def) out[g.param] = v;
    }
    return out;
  }
  function groupInfo(panel) {
    const G = panel._groups || { page: [], kit: [] };
    const m = new Map();
    for (const g of G.page) m.set(g.param, { g, scope: scopeOf(g, G.kit) });
    for (const g of G.kit) m.set(g.param, { g, scope: "kit" });
    return m;
  }
  const PEN = '<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M11.2 1.8a1.6 1.6 0 0 1 2.3 0l.7.7a1.6 1.6 0 0 1 0 2.3l-8 8L2.5 14l1.2-3.7 7.5-8.5Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  const fieldsFit = typeof CSS !== "undefined" && CSS.supports && CSS.supports("field-sizing", "content");
  function grow(ta) { if (fieldsFit || !ta.isConnected) return; ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight + 2, 240) + "px"; }

  function decorate(panel) {
    if (embedded() || !panel) return;
    panelEl = panel;
    groupsNow = panel._groups || groupsNow;
    if (!panel._yrv) wirePanel(panel);
    panel.querySelectorAll(".yrv-box, .yrv-tag, .yrv-pen, .yrv-onote, .yrv-count").forEach((n) => n.remove());
    const d = load();
    const info = groupInfo(panel);
    const els = pageEls(d);
    const here2 = countChoices(d, ["kit", SECTION]), all = countChoices(d);
    const nNotes = els.length + (d.notes.page[PAGE] ? 1 : 0);

    // the closed ⚙ says when this page has notes
    const sum = panel.querySelector(":scope > summary");
    if (sum && nNotes) sum.insertAdjacentHTML("beforeend", `<span class="yrv-count" title="${nNotes} note${nNotes > 1 ? "s" : ""} on this page">${PEN}${nNotes}</span>`);

    const box = document.createElement("div");
    box.className = "yrv-box";
    box.innerHTML = `
      <div class="yrv-lab"><label for="yrv-page-note">Notes on this page</label><span class="yrv-ok" aria-live="polite"></span></div>
      <textarea id="yrv-page-note" class="yrv-ta" data-note="page" rows="2" placeholder="What you think of this page… (saves as you type)">${esc(d.notes.page[PAGE]?.text || "")}</textarea>
      <div class="yrv-acts">
        <button type="button" class="yrv-btn" data-act="pick">${PEN}Note on something</button>
        ${els.length ? `<button type="button" class="yrv-btn" data-act="pins" aria-pressed="${d.prefs.pins !== false}" title="Show the note pins on the page">Pins · ${els.length}</button>` : ""}
        <a class="yrv-btn yrv-btn--go" href="${esc(rel("review.html"))}">Round-up →</a>
      </div>
      ${els.length ? `<ol class="yrv-els">${els.map((n, i) => `<li><button type="button" data-act="goto" data-id="${esc(n.id)}"><b>${i + 1}</b><span><em>${esc(n.label || n.kind)}</em> ${esc(cut(txt(n.text), 70))}</span></button></li>`).join("")}</ol>` : ""}
      <p class="yrv-saved">${all
        ? `<span><b>${here2}</b> saved choice${here2 === 1 ? "" : "s"} on this page${all > here2 ? ` · ${all} in all` : ""}</span><button type="button" class="yrv-link" data-act="reset">Reset my choices</button>`
        : `<span>Your picks below are saved and follow you to every page.</span>`}</p>
      ${backend.kind !== "localStorage" || !lastSaveOK ? `<p class="yrv-warn">${backend.kind === "memory" || !lastSaveOK ? "This browser blocks storage here: notes and choices last only until you leave the page." : "Storage is limited to this tab here: notes and choices last until it closes."}</p>` : ""}`;
    (sum || panel.firstChild)?.after(box);

    for (const fs of panel.querySelectorAll("fieldset")) {
      const b0 = fs.querySelector("button[data-p]");
      if (!b0 || fs.classList.contains("is-jump")) continue;
      const it = info.get(b0.dataset.p);
      if (!it || it.g.state) continue;
      const { g, scope } = it;
      fs.dataset.yrvScope = scope;
      const c = d.choices[scope]?.[g.param];
      fs.classList.toggle("yrv-has-pick", !!c);
      fs.querySelectorAll("button[data-p]").forEach((b) => b.classList.toggle("yrv-picked", !!c && b.dataset.v === c.v));
      const note = d.notes.opt[optKey(scope, g.param)]?.text || "";
      const legend = fs.querySelector("legend");
      (legend || fs).insertAdjacentHTML("beforeend",
        `${c ? `<button type="button" class="yrv-tag" data-act="forget" aria-label="Saved choice for ${esc(g.label)}: forget it" title="Your saved pick (● on the value). Click to forget it.">saved ×</button>` : ""}` +
        `<button type="button" class="yrv-pen${note ? " has-note" : ""}" data-act="onote" aria-expanded="${!!note}" aria-label="Note on ${esc(g.label)}" title="Note on this option">${PEN}</button>`);
      if (note) optNoteField(fs, note);
    }
    if (panel.open) panel.querySelectorAll(".yrv-ta").forEach(grow);
  }
  function optNoteField(fs, text = "") {
    const w = document.createElement("div");
    w.className = "yrv-onote";
    const label = fs.querySelector("legend")?.firstChild?.textContent || "this option";
    w.innerHTML = `<textarea class="yrv-ta" data-note="opt" rows="1" aria-label="Note on ${esc(label)}" placeholder="Note on this option…">${esc(text)}</textarea>`;
    fs.appendChild(w);
    return w.querySelector("textarea");
  }
  function flashSaved(scopeEl) {
    const ok = scopeEl?.querySelector?.(".yrv-ok");
    if (!ok) return;
    ok.textContent = lastSaveOK ? "saved" : "not saved";
    ok.classList.remove("is-on"); void ok.offsetWidth; ok.classList.add("is-on");
  }

  function wirePanel(panel) {
    panel._yrv = true;
    // a value click in an Open / Earlier group saves it (before kit/yarn.js's own handler reloads the page)
    panel.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-p]");
      const fs = b && b.closest("fieldset[data-yrv-scope]");
      if (fs) setChoice(fs.dataset.yrvScope, b.dataset.p, b.dataset.v);
    }, true);
    panel.addEventListener("click", (e) => {
      const a = e.target.closest("[data-act]");
      if (!a || !panel.contains(a)) return;
      const act = a.dataset.act, fs = a.closest("fieldset");
      if (act === "pick") { e.preventDefault(); startPicker(); }
      else if (act === "pins") { const on = a.getAttribute("aria-pressed") !== "true"; update((d) => { d.prefs.pins = on; }); a.setAttribute("aria-pressed", String(on)); renderPins(); }
      else if (act === "reset") resetChoices();
      else if (act === "forget") {
        e.preventDefault();
        const p = fs.querySelector("button[data-p]").dataset.p, scope = fs.dataset.yrvScope;
        const v = load().choices[scope]?.[p]?.v;
        forgetChoice(scope, p);
        location.href = urlWithout([[p, v]]);
      } else if (act === "onote") {
        e.preventDefault();
        let w = fs.querySelector(".yrv-onote");
        if (w && !txt(w.querySelector("textarea").value)) { w.remove(); a.setAttribute("aria-expanded", "false"); return; }
        const ta = w ? w.querySelector("textarea") : optNoteField(fs);
        a.setAttribute("aria-expanded", "true");
        grow(ta); ta.focus();
      } else if (act === "goto") {
        const n = load().notes.el.find((x) => x.id === a.dataset.id);
        if (!n) return;
        const el = find(n.sel);
        if (matchMedia("(max-width: 959px)").matches) panel.open = false;
        if (el) { el.scrollIntoView({ block: "center", behavior: "auto" }); flash(el); }
        openEditor({ rec: n, el, anchor: el || a });
      }
    });
    panel.addEventListener("input", (e) => {
      const ta = e.target.closest(".yrv-ta");
      if (!ta) return;
      grow(ta);
      if (ta.dataset.note === "page") { setPageNote(ta.value); flashSaved(panel.querySelector(".yrv-box")); return; }
      const fs = ta.closest("fieldset[data-yrv-scope]");
      const p = fs?.querySelector("button[data-p]")?.dataset.p;
      const it = p && groupInfo(panel).get(p);
      if (!it) return;
      setOptNote(fs.dataset.yrvScope, it.g, ta.value);
      fs.querySelector(".yrv-pen")?.classList.toggle("has-note", !!txt(ta.value));
    });
    // typing in a note never reaches the page's own shortcuts (/, j/k, ←/→, Esc …)
    panel.addEventListener("keydown", (e) => {
      const ta = e.target.closest?.(".yrv-ta");
      if (!ta) return;
      e.stopPropagation();
      if (e.key === "Escape" || (e.key === "Enter" && !e.shiftKey && ta.dataset.note === "opt")) { e.preventDefault(); ta.blur(); }
    });
    panel.addEventListener("toggle", () => { if (panel.open) requestAnimationFrame(() => panel.querySelectorAll(".yrv-ta").forEach(grow)); });
  }
  function resetChoices() {
    const d = load(), n = countChoices(d);
    if (!n) return;
    if (!confirm(`Forget all ${n} saved ⚙ choice${n === 1 ? "" : "s"}, on every page?\nYour notes and answers stay.`)) return;
    const pairs = Object.values(d.choices).flatMap((o) => Object.entries(o || {}).map(([k, c]) => [k, c && c.v]));
    update((x) => { x.choices = {}; });
    location.href = urlWithout(pairs);
  }

  /* ---------- the out-of-panel layer (.yrv-root) ---------- */
  let root = null, rootRO = null;
  function rootEl() {
    if (root) return root;
    root = document.createElement("div");
    root.className = "yrv-root";
    // clicks on our own UI never reach the page's document listeners ("click outside closes …")
    for (const t of ["click", "pointerdown", "mousedown"]) root.addEventListener(t, (e) => e.stopPropagation());
    root.addEventListener("keydown", (e) => e.stopPropagation());
    document.body.appendChild(root);
    // hidden whenever the ⚙ panel is (screenshot scripts hide .mockpanel)
    const p = document.querySelector(".mockpanel");
    if (p && "ResizeObserver" in window) {
      rootRO = new ResizeObserver(() => { root.classList.toggle("is-off", !p.getClientRects().length); });
      rootRO.observe(p);
    }
    return root;
  }

  /* ---------- element description + selector ---------- */
  const KIND = { A: "link", BUTTON: "button", IMG: "image", PICTURE: "image", VIDEO: "video", AUDIO: "audio", P: "text", LI: "item", UL: "list", OL: "list",
    NAV: "nav", HEADER: "header", FOOTER: "footer", SECTION: "section", ARTICLE: "article", ASIDE: "aside", MAIN: "main", FIGURE: "figure", FIGCAPTION: "caption",
    INPUT: "field", TEXTAREA: "field", SELECT: "field", LABEL: "label", SUMMARY: "toggle", DETAILS: "disclosure", SVG: "graphic", TIME: "date", TABLE: "table",
    H1: "heading", H2: "heading", H3: "heading", H4: "heading", H5: "heading", H6: "heading", SPAN: "text", B: "text", SMALL: "text", EM: "text", STRONG: "text", I: "icon" };
  function kindOf(el) {
    const tag = el.tagName.toUpperCase();
    const role = el.getAttribute("role");
    const base = role && !["presentation", "none", "group"].includes(role) ? role : KIND[tag] || el.tagName.toLowerCase();
    const cls = [...el.classList].find((c) => /^y[a-z]+(?:__[a-z0-9-]+)?$/.test(c) && !c.startsWith("yrv")) || [...el.classList].find((c) => /^[a-z][\w-]*$/.test(c) && !/^(is-|has-|yrv)/.test(c));
    return cls ? `${base} .${cls}` : base;
  }
  // fast (while hovering): textContent, no layout; saved notes use innerText (what's actually on screen)
  function labelOf(el, fast = false) {
    let l = txt(el.getAttribute("aria-label") || el.getAttribute("alt") || el.getAttribute("title") || el.getAttribute("placeholder"));
    if (!l) {
      const h = /^H[1-6]$/.test(el.tagName) ? el : el.querySelector?.("h1, h2, h3, h4, h5, h6, [class*='title']");
      const n = h || el;
      l = txt(fast ? n.textContent.slice(0, 400) : n.innerText ?? n.textContent);
    }
    if (!l && el.querySelector) { const i = el.querySelector("[aria-label], img[alt], [title]"); if (i) l = txt(i.getAttribute("aria-label") || i.getAttribute("alt") || i.getAttribute("title")); }
    return cut(l, 72);
  }
  const ATTRS = ["data-slug", "data-key", "data-id", "data-yf", "data-section", "data-name", "data-item", "data-tab", "data-v", "data-k", "name", "aria-label", "href", "alt"];
  const qsa = (s) => { try { return document.querySelectorAll(s); } catch (_) { return []; } };
  const find = (s) => { try { return s ? document.querySelector(s) : null; } catch (_) { return null; } };
  function selectorFor(el) {
    const part = (n) => {
      if (n.id && /^[A-Za-z][\w-]*$/.test(n.id) && !/\d{4,}/.test(n.id) && qsa("#" + n.id).length === 1) return "#" + n.id;
      let s = n.tagName.toLowerCase();
      if (!/^[a-z][a-z0-9-]*$/.test(s)) s = "*";
      s += [...n.classList].filter((c) => /^[A-Za-z][\w-]*$/.test(c) && !/^(is-|has-|yrv)/.test(c)).slice(0, 2).map((c) => "." + c).join("");
      const a = ATTRS.find((x) => n.hasAttribute(x) && n.getAttribute(x).length < 140);
      if (a) s += `[${a}="${n.getAttribute(a).replace(/["\\]/g, "\\$&")}"]`;
      return s;
    };
    const parts = [];
    for (let n = el; n && n.nodeType === 1 && n !== html; n = n.parentElement) {
      let p = part(n);
      const par = n.parentElement;
      if (!p.startsWith("#") && par) {
        let dup = false;
        try { dup = [...par.children].some((c) => c !== n && c.matches(p)); } catch (_) {}
        if (dup) p += `:nth-child(${[...par.children].indexOf(n) + 1})`;
      }
      parts.unshift(p);
      const s = parts.join(" > ");
      const hit = qsa(s);
      if (hit.length === 1 && hit[0] === el) return s;
      if (p.startsWith("#")) break;
    }
    return parts.join(" > ");
  }
  // the part you most likely mean: icons and bits of text inside a control → the control
  function promote(t) {
    if (t && t.nodeType !== 1) t = t.parentElement;
    if (!t || t === html || t === document.body) return null;
    const svg = t.closest("svg");
    if (svg) t = svg;
    const ctl = t.parentElement?.closest("a[href], button, [role='button'], [role='tab'], [role='link'], [role='option'], label, summary");
    if (ctl && /^(I|SPAN|B|SMALL|EM|STRONG|SVG|svg|TIME)$/.test(t.tagName)) return ctl;
    return t;
  }
  const pickable = (el) => !!el && el.nodeType === 1 && el !== html && el !== document.body && !el.closest(".yrv-root, .mockpanel");

  /* ---------- highlight + flash ---------- */
  function flash(el) {
    const r = el.getBoundingClientRect();
    if (!r.width && !r.height) return;
    const f = document.createElement("div");
    f.className = "yrv-flash";
    Object.assign(f.style, { left: r.left - 4 + "px", top: r.top - 4 + "px", width: r.width + 8 + "px", height: r.height + 8 + "px" });
    rootEl().appendChild(f);
    setTimeout(() => f.remove(), 1700);
  }

  /* ---------- the picker (R1: "Note on something") ---------- */
  let picking = null;
  function startPicker() {
    if (picking || embedded()) return;
    closeEditor();
    const panel = document.querySelector(".mockpanel");
    const wasOpen = !!panel?.open;
    if (panel) panel.open = false;
    const r = rootEl();
    const hl = document.createElement("div");
    hl.className = "yrv-hl"; hl.hidden = true;
    hl.innerHTML = '<span class="yrv-hl__tag"></span>';
    const bar = document.createElement("div");
    bar.className = "yrv-bar";
    bar.setAttribute("role", "status");
    bar.innerHTML = `<span class="yrv-bar__t"><b>Note on something</b> <span class="yrv-bar__how">Click the part you mean · <kbd>↑</kbd> <kbd>↓</kbd> bigger / smaller · <kbd>Esc</kbd> cancels</span><span class="yrv-bar__touch">Tap the part you mean</span></span><button type="button" class="yrv-btn" data-act="cancel">Cancel</button>`;
    r.append(hl, bar);
    html.classList.add("yrv-picking");
    let base = null, cur = null, raf = 0;
    const show = (el) => {
      cur = el;
      if (!el) { hl.hidden = true; return; }
      const b = el.getBoundingClientRect();
      hl.hidden = false;
      Object.assign(hl.style, { left: b.left + "px", top: b.top + "px", width: b.width + "px", height: b.height + "px" });
      const l = labelOf(el, true);
      hl.firstChild.textContent = kindOf(el) + (l ? " · " + cut(l, 40) : "");
      hl.classList.toggle("is-low", b.top < 30);
    };
    const reshow = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; if (cur) show(cur); }); };
    const own = (e) => !!e.target?.closest?.(".yrv-root");
    const stopper = (e) => { if (own(e)) return; e.stopImmediatePropagation(); };
    const swallow = (e) => { if (own(e)) return; e.preventDefault(); e.stopImmediatePropagation(); };
    const onMove = (e) => {
      if (own(e)) return;
      e.stopImmediatePropagation();
      if (e.pointerType === "touch") return;
      const t = promote(e.target);
      if (!pickable(t)) { base = null; show(null); return; }
      if (t !== base) { base = t; show(t); }
    };
    const onClick = (e) => {
      if (own(e)) return;
      swallow(e);
      let el = cur && (cur === e.target || cur.contains(e.target)) ? cur : promote(e.target);
      if (!pickable(el)) return;
      stop();
      openEditor({ el, fresh: true, restorePanel: wasOpen });
    };
    const onKey = (e) => {
      if (own(e) && e.key !== "Escape") return;
      if (e.key === "Escape") { swallow(e); stop(); if (panel && wasOpen) panel.open = true; return; }
      if (e.key === "ArrowUp" && cur) { swallow(e); const p = cur.parentElement; if (pickable(p)) show(p); return; }
      if (e.key === "ArrowDown" && cur && base && cur !== base) { swallow(e); let n = base; while (n.parentElement && n.parentElement !== cur) n = n.parentElement; show(n); return; }
      if (e.key === "Enter" && cur) { swallow(e); const el = cur; stop(); openEditor({ el, fresh: true, restorePanel: wasOpen }); }
    };
    const SWALLOW = ["pointerdown", "mousedown", "pointerup", "mouseup", "dblclick", "auxclick"];
    const STOP = ["pointerover", "pointerout", "pointerenter", "pointerleave", "mouseover", "mouseout", "mouseenter", "mouseleave", "mousemove", "touchstart", "touchend", "touchmove"];
    const opts = { capture: true, passive: false }, popts = { capture: true, passive: true };
    addEventListener("pointermove", onMove, popts);
    SWALLOW.forEach((t) => addEventListener(t, swallow, opts));
    STOP.forEach((t) => addEventListener(t, stopper, popts));
    addEventListener("click", onClick, opts);
    addEventListener("keydown", onKey, opts);
    addEventListener("scroll", reshow, popts);
    addEventListener("resize", reshow, popts);
    bar.querySelector("[data-act='cancel']").addEventListener("click", () => { stop(); if (panel && wasOpen) panel.open = true; });
    function stop() {
      if (!picking) return;
      picking = null;
      cancelAnimationFrame(raf);
      removeEventListener("pointermove", onMove, popts);
      SWALLOW.forEach((t) => removeEventListener(t, swallow, opts));
      STOP.forEach((t) => removeEventListener(t, stopper, popts));
      removeEventListener("click", onClick, opts);
      removeEventListener("keydown", onKey, opts);
      removeEventListener("scroll", reshow, popts);
      removeEventListener("resize", reshow, popts);
      html.classList.remove("yrv-picking");
      hl.remove(); bar.remove();
    }
    picking = { stop };
  }

  /* ---------- the note editor (new element note, or a pin's note) ---------- */
  let editor = null;
  function openEditor({ el = null, rec = null, fresh = false, anchor = null, restorePanel = false }) {
    closeEditor();
    if (fresh && el) {
      rec = { id: uid(), page: PAGE, url: here(), text: "", kind: kindOf(el), label: labelOf(el), sel: selectorFor(el), choices: currentChoices() };
    }
    if (!rec) return;
    let target = el || find(rec.sel);
    const r = rootEl();
    const pop = document.createElement("div");
    pop.className = "yrv-pop";
    pop.setAttribute("role", "dialog");
    pop.setAttribute("aria-label", "Note");
    const head = () => `Note on <b>${esc(rec.kind)}</b>${rec.label ? ` “${esc(cut(rec.label, 48))}”` : ""}`;
    pop.innerHTML = `
      <p class="yrv-pop__on">${head()}</p>
      ${fresh ? '<div class="yrv-pop__size"><button type="button" class="yrv-btn" data-act="up" title="Note on the part around it (↑)">Bigger part</button><button type="button" class="yrv-btn" data-act="down" title="Back to a smaller part (↓)">Smaller</button></div>' : ""}
      ${!target ? '<p class="yrv-pop__miss">Not on screen right now (another state or view).</p>' : ""}
      <textarea class="yrv-ta" rows="3" aria-label="Your note" placeholder="Your note… (saves as you type)">${esc(rec.text || "")}</textarea>
      <div class="yrv-pop__foot"><button type="button" class="yrv-link" data-act="del">Delete</button><span class="yrv-ok" aria-live="polite"></span><button type="button" class="yrv-btn yrv-btn--ink" data-act="done">Done</button></div>`;
    r.appendChild(pop);
    const ta = pop.querySelector("textarea");
    const base = target;
    let raf = 0;
    const place = () => {
      raf = 0;
      if (matchMedia("(max-width: 599px)").matches) { pop.classList.add("is-sheet"); pop.style.left = pop.style.top = ""; return; }
      pop.classList.remove("is-sheet");
      const a = (target && target.isConnected ? target : anchor)?.getBoundingClientRect?.();
      const w = pop.offsetWidth, h = pop.offsetHeight;
      let x = a ? a.left : innerWidth - w - 24, y = a ? a.bottom + 10 : 80;
      if (a && y + h > innerHeight - 12) y = a.top - h - 10;
      if (y < 12) y = clamp(a ? a.bottom + 10 : 80, 12, innerHeight - h - 12);
      pop.style.left = clamp(x, 12, innerWidth - w - 12) + "px";
      pop.style.top = clamp(y, 12, Math.max(12, innerHeight - h - 12)) + "px";
    };
    const replace = () => { if (!raf) raf = requestAnimationFrame(place); };
    const mark = document.createElement("div");
    mark.className = "yrv-mark";
    const markIt = () => {
      if (!target || !target.isConnected) { mark.hidden = true; return; }
      const b = target.getBoundingClientRect();
      mark.hidden = !(b.width || b.height);
      Object.assign(mark.style, { left: b.left + "px", top: b.top + "px", width: b.width + "px", height: b.height + "px" });
    };
    r.insertBefore(mark, pop);
    const retarget = (n) => {
      target = n;
      Object.assign(rec, { kind: kindOf(n), label: labelOf(n), sel: selectorFor(n) });
      pop.querySelector(".yrv-pop__on").innerHTML = head();
      markIt(); place();
      if (txt(rec.text)) putElNote({ ...rec });
    };
    pop.addEventListener("click", (e) => {
      const a = e.target.closest("[data-act]");
      if (!a) return;
      const act = a.dataset.act;
      if (act === "done") close();
      else if (act === "del") { rec.text = ""; putElNote({ ...rec }); close(); }
      else if (act === "up" && target?.parentElement && pickable(target.parentElement)) retarget(target.parentElement);
      else if (act === "down" && target && base && target !== base) { let n = base; while (n.parentElement && n.parentElement !== target) n = n.parentElement; retarget(n); }
    });
    ta.addEventListener("input", () => {
      grow(ta);
      rec.text = ta.value;
      putElNote({ ...rec });
      flashSaved(pop);
    });
    const onKey = (e) => {
      if (e.key !== "Escape" && !(e.key === "Enter" && (e.metaKey || e.ctrlKey))) return;
      e.preventDefault(); e.stopImmediatePropagation();
      close();
    };
    const onDown = (e) => { if (!pop.contains(e.target)) close(); };
    const onScroll = () => { markIt(); replace(); };
    addEventListener("keydown", onKey, true);
    addEventListener("scroll", onScroll, { capture: true, passive: true });
    addEventListener("resize", onScroll, { passive: true });
    const downT = setTimeout(() => document.addEventListener("pointerdown", onDown, true), 0);
    function close() {
      if (editor !== api) return;
      editor = null;
      clearTimeout(downT);
      cancelAnimationFrame(raf);
      removeEventListener("keydown", onKey, true);
      removeEventListener("scroll", onScroll, { capture: true });
      removeEventListener("resize", onScroll);
      document.removeEventListener("pointerdown", onDown, true);
      if (!txt(ta.value)) putElNote({ ...rec, text: "" });
      pop.remove(); mark.remove();
      renderPins();
      // desktop: back to the open ⚙; phones: stay on the page, so the new pin shows (the ⚙ would cover it)
      const panel = document.querySelector(".mockpanel");
      if (panel) { if (restorePanel && !panel.open && !matchMedia("(max-width: 959px)").matches) panel.open = true; else decorate(panel); }
    }
    const api = { close };
    editor = api;
    markIt(); place(); grow(ta);
    // phones: the editor is a sheet at the top; keep the part you're noting in view below it
    if (pop.classList.contains("is-sheet") && target) {
      const b = target.getBoundingClientRect(), under = pop.getBoundingClientRect().bottom + 12;
      if (b.top < under || b.top > innerHeight - 80) { scrollBy({ top: b.top - under, behavior: "auto" }); markIt(); }
    }
    ta.focus({ preventScroll: true });
    ta.setSelectionRange(ta.value.length, ta.value.length);
  }
  function closeEditor() { editor?.close(); }

  /* ---------- pins (existing element notes on this page) ---------- */
  let pins = null;
  function teardownPins() {
    if (!pins) return;
    const p = pins; pins = null;
    cancelAnimationFrame(p.raf); clearInterval(p.iv); p.ro?.disconnect();
    removeEventListener("scroll", p.queue, { capture: true });
    removeEventListener("resize", p.queue);
    p.layer.remove();
  }
  function renderPins() {
    teardownPins();
    if (embedded()) return;
    const d = load();
    const notes = pageEls(d);
    if (d.prefs.pins === false || !notes.length) return;
    const layer = document.createElement("div");
    layer.className = "yrv-pins";
    const items = notes.map((n, i) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "yrv-pin"; b.textContent = String(i + 1); b.hidden = true;
      b.title = `${n.label || n.kind}: ${n.text}`;
      b.setAttribute("aria-label", `Note ${i + 1} on ${n.label || n.kind}: ${n.text}`);
      layer.appendChild(b);
      return { n, b, el: null };
    });
    rootEl().appendChild(layer);
    const p = { layer, raf: 0, iv: 0, ro: null, queue: null };
    const place = () => {
      p.raf = 0;
      const W = innerWidth, H = innerHeight;
      for (const it of items) {
        if (!it.el || !it.el.isConnected) it.el = find(it.n.sel);
        const r = it.el?.getBoundingClientRect();
        if (!r || (!r.width && !r.height) || r.bottom < 0 || r.top > H || r.right < 0 || r.left > W) { it.b.hidden = true; continue; }
        it.b.hidden = false;
        it.b.style.transform = `translate(${clamp(r.right - 13, 2, W - 24)}px, ${clamp(r.top - 9, 2, H - 24)}px)`;
      }
    };
    p.queue = () => { if (!p.raf) p.raf = requestAnimationFrame(place); };
    addEventListener("scroll", p.queue, { capture: true, passive: true });
    addEventListener("resize", p.queue, { passive: true });
    if ("ResizeObserver" in window) { p.ro = new ResizeObserver(p.queue); p.ro.observe(document.body); }
    p.iv = setInterval(() => { if (document.visibilityState === "visible") p.queue(); }, 1500); // page re-renders (filters, opened items)
    layer.addEventListener("click", (e) => {
      const b = e.target.closest(".yrv-pin");
      const it = b && items.find((x) => x.b === b);
      if (it) openEditor({ rec: it.n, el: it.el, anchor: b });
    });
    pins = p;
    place();
  }

  /* ---------- ?rvnote=<id>: the round-up's "show me" link ---------- */
  function showLinked() {
    const u = new URL(location.href), id = u.searchParams.get("rvnote");
    if (!id) return;
    u.searchParams.delete("rvnote");
    try { history.replaceState(history.state, "", u); } catch (_) {}
    const n = load().notes.el.find((x) => x.id === id);
    if (!n) return;
    setTimeout(() => {
      const el = find(n.sel);
      if (el) { el.scrollIntoView({ block: "center", behavior: "auto" }); setTimeout(() => flash(el), 60); }
      openEditor({ rec: n, el, anchor: el || document.querySelector(".mockpanel") });
    }, 700);
  }

  /* ---------- boot ---------- */
  document.addEventListener("ypanel", (e) => decorate(e.target));
  const boot = () => {
    if (embedded()) return;
    const p = document.querySelector(".mockpanel");
    if (p && p._groups && !p._yrv) decorate(p);
    const go = () => { renderPins(); showLinked(); };
    document.readyState === "complete" ? setTimeout(go, 300) : addEventListener("load", () => setTimeout(go, 300), { once: true });
  };
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", boot, { once: true }) : boot();

  window.YarnReview = {
    KEY, ROOT, PAGE, SECTION, rel, pathOf,
    get storage() { return backend.kind; },
    get saved() { return lastSaveOK; },
    load, save, update, setChoice, forgetChoice, countChoices, scopeOf, isKitParam,
    startPicker, renderPins, describe: (el) => ({ kind: kindOf(el), label: labelOf(el), sel: selectorFor(el) }),
  };
})();
