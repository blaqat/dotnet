/* ============================================================
   blaqat.net · round 3 · yarn kit · iteration 3 (mock-only)
   window.Yarn — every shared part. Docs: kit/COMPONENTS.md

   INCLUDE IT WITHOUT defer, in <head>, after yarn.css + data.js:
     <script src="../kit/yarn.js"></script>
   It sets the kit options on <html> before first paint (no flash),
   holds the page behind the cord when arriving from home, and pulls
   in kit/swatch.js + kit/lightbox.js (sync) and kit/sound.js (async).

   Kit URL params (all optional; also in the ⚙ mock panel):
     ?sel=rope|ink      single-choice selected style (nav, segments, rows)  (default rope)
     ?toggle=red|ink|tint|rope   multi-select toggles (filter chips, tokens, type rows)  (red: decided in i4; the rest stay to compare)
     ?dfoot=inline|float  detail pages: links near the top + in-flow end, or i2's floating foot (default inline)
     ?motion=i3|i2      motion timings (i2 = iteration 2's, for comparison)
     ?rope=in|out       rope inside / around      (default in)
     ?body=nunito-sans|figtree|atkinson|system   (default nunito-sans)
     ?bg=<name>         loads kit/bg/<name>.css, sets <html data-bg>  (default jersey; intarsia in ⚙)
     ?mnav=spool|top|corduroy|cotton|ink|frame  phone nav (< 960px; default spool, the sections pill, since i5 round 2;
                        top = i5 round 1's strip; kit/mnav.html compares them)
     i5: ?browseicon=shake|caret ?uisnd=quiet|always ?mactive=start|end ?toast=bottom|top   (i6: all decided)
     i6: ?redbtn=twill|deep  red buttons: the brand twill (default) or one shade deeper (i7: decided, twill)
     (i7 · site, K3: ?mhide is gone, the phone's bottom items are always there; ?dlayout=stack and ?stackchip are cut)
     ?nav=corduroy|cork the corduroy bar's material (default corduroy)
     ?reduced           reduced motion (also prefers-reduced-motion)
     ?from=home         play the arriving sheet reveal  ?trp=0..1 freeze it
     ?disc=swatch|cat   the record's label (Yarn.disc + the player)
   ============================================================ */
(() => {
  "use strict";
  if (window.Yarn && window.Yarn.version) return;

  const SCRIPT = document.currentScript;
  const KIT_BASE = (SCRIPT && SCRIPT.src) || new URL("kit/yarn.js", location.href).href;
  const kitURL = (p) => new URL(p, KIT_BASE).href;
  // i9 is Studio only: the site pages stay in the frozen, final i8 folder, so every link to a site page goes there
  const SITE_DIR = "../../v3-yarn-8/";
  const siteURL = (p) => kitURL(SITE_DIR + p);
  // == i5 · review tools (R2 · kit/review.js): the owner's saved ⚙ choices join the URL before anything reads it.
  // Kit choices apply everywhere, page choices per section folder; a param already in the URL wins. A page that read
  // a param before the kit (home's kwline / stk) gets its <html data-*> re-synced. Never in kit/mnav.html's frames.
  try {
    let raw = null;
    for (const s of ["localStorage", "sessionStorage"]) { try { raw = window[s].getItem("yarn.review.i9"); break; } catch (_) {} }
    const C = (raw && JSON.parse(raw).choices) || {}, u = new URL(location.href), de = document.documentElement;
    const sec = (location.pathname.slice(new URL("../", KIT_BASE).pathname.length).match(/^([^/]+)\//) || [])[1] || "root";
    let n = 0;
    if (!u.searchParams.has("embed")) for (const [k, c] of Object.entries({ ...C[sec], ...C.kit })) {
      if (!c || !c.v || u.searchParams.has(k)) continue;
      u.searchParams.set(k, c.v); n++;
      if (k !== "section" && de.hasAttribute("data-" + k)) de.setAttribute("data-" + k, c.v);
    }
    if (n) history.replaceState(history.state, "", u);
  } catch (_) {}
  const params = new URLSearchParams(location.search);
  const html = document.documentElement;
  const SYNC = !!SCRIPT && !SCRIPT.defer && !SCRIPT.async && document.readyState === "loading";

  /* ============================================================
     OPTIONS → <html data-*> (before first paint when loaded sync)
     ============================================================ */
  const DEFAULTS = { sel: "rope", toggle: "red", dfoot: "inline", motion: "i3", rope: "in", body: "nunito-sans", nav: "corduroy" };
  const BODY_FONTS = {
    "nunito-sans": { label: "Nunito Sans", css: null }, // already imported by yarn.css
    figtree: { label: "Figtree", css: "https://fonts.googleapis.com/css2?family=Figtree:ital,wght@0,400..800;1,400..700&display=swap" },
    atkinson: { label: "Atkinson Next", css: "https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:ital,wght@0,400..800;1,400..700&display=swap" },
    system: { label: "System", css: null },
  };
  // Background options for the ⚙ panel. The bg agent's files live in kit/bg/<name>.css.
  // i4 (owner: "leaning on jersey … def between jersey and intarsia"): default jersey; intarsia stays one click away.
  const BG_DEFAULT = "jersey";
  const BG_OPTIONS = [["jersey", "Jersey"], ["intarsia", "Intarsia"], ["quilt", "Quilt"], ["speckle", "Speckle"], ["current", "Current (i1)"]];
  const pick = (v, ok, d) => (ok.includes(v) ? v : d);
  const MNAV_VALUES = ["corduroy", "cotton", "ink", "frame", "top", "spool"];
  const OPT = {
    sel: pick(params.get("sel"), ["rope", "ink"], DEFAULTS.sel),
    // multi-select toggles get a fill (owner, i3: "filled red for toggleables"); single choices keep the rope (sel)
    toggle: pick(params.get("toggle"), ["red", "ink", "tint", "rope"], DEFAULTS.toggle),
    // detail pages: links in the flow near the top + an in-flow end (pager); "float" = i2's floating links bar
    dfoot: pick(params.get("dfoot"), ["inline", "float"], DEFAULTS.dfoot),
    motion: pick(params.get("motion"), ["i3", "i2"], DEFAULTS.motion),
    rope: pick(params.get("rope"), ["in", "out"], DEFAULTS.rope),
    body: pick(params.get("body"), Object.keys(BODY_FONTS), DEFAULTS.body),
    nav: pick(params.get("nav"), ["corduroy", "cork", "suede", "burlap"], DEFAULTS.nav),
    bg: /^[a-z0-9-]{1,40}$/.test(params.get("bg") || "") ? params.get("bg") : BG_DEFAULT,
    // mobile search + filters on list pages (< 960px): "bar" = top search + sticky filter row; "fab" = a search FAB
    // above the nav that grows into a bottom panel. Old Projects links used ?search=fab|fab-row|bar.
    // i4 · chrome (owner: "the right direction for mobile"): fab is the default; bar stays one click away.
    msearch: pick(params.get("msearch"), ["bar", "fab"], null) || ({ fab: "fab", "fab-row": "fab", bar: "bar" })[params.get("search")] || "fab",
    // i4 · chrome: where the sound-effects toggle lives (owner: it fit neither the phone bar nor the desktop top right).
    // tag = a woven care label sewn into the sheet's top edge (default) · brand = beside the wordmark · nav = i3's slots
    soundui: pick(params.get("soundui"), ["tag", "brand", "nav"], "tag"),
    // i4 round 2 · mobile nav (owner: "not sold on the brown bar … idk what i want"): which nav phones get (< 960px).
    // corduroy = i3/i4's bar · cotton · ink · frame · top · spool. Desktop never changes.
    // i5 round 2 · mobile (owner: "i did not mean top strip i meant sections pill all my notes were about that"):
    // spool, the sections pill, is the default; top (round 1's default) and the others stay in Earlier.
    mnav: pick(params.get("mnav"), MNAV_VALUES, "spool"),
    // == i5 · chrome · open options (FEEDBACK-i5) ==
    // G4: the Browse button's icon. shake = it shakes on hover like every other icon, never rotates · caret = a caret that turns
    browseicon: pick(params.get("browseicon"), ["shake", "caret"], "shake"),
    // i9 · music · S10 (open): in the Music order's "Newest finished", a Complete release sorts by its finish (the old
    // site's code, as built) or by its start (the owner's pin note: "complete uses its start date")
    mcomplete: pick(params.get("mcomplete"), ["end", "start"], "end"),
    // G8: UI sounds while the music player plays. quiet = silent (kit/sound.js reads it too) · always = i4 (ducked 40%)
    uisnd: pick(params.get("uisnd"), ["quiet", "always"], "quiet"),
    // MO5: where a phone shows the active filters (they no longer sit in the search field or repeat at the top)
    //   start = right after the All/✕ circle (decided) · end = pressed chips at the end of the floating chip row
    //   (i6: count + top are cut → start; i7: their code too, incl. i4's strip of active filters above the list)
    mactive: pick(params.get("mactive"), ["start", "end"], "start"),
    // MO8: phone toasts ("added to the queue"): bottom (i6, decided: the floating player + search move up for it) · top (Earlier)
    toast: pick(params.get("toast"), ["bottom", "top"], "bottom"),
    // i6 · mobile (X6, contrast): red buttons (.btn--red). twill = the brand red twill (i5) · deep = one shade deeper
    //   (--tog-red, the pressed chips' red: white text passes 4.5 on every thread). i7: decided, twill (deep → Earlier).
    redbtn: pick(params.get("redbtn"), ["twill", "deep"], "twill"),
    // == i5 · layout · the opened item (LAYOUT-i5.md) ==
    // P3.3.1: how an opened item is arranged. rail = facts + links in a side rail · label = facts above the title, stack at the end
    // i6 · layout (L1, LAYOUT-i6.md): label is the default · side = a left rail like a Thoughts article's (labelled
    //   sections, yarn parts) · rail = the right rail, under the top bar's utilities · i4 cut
    // i7 (decided): label; side + rail → Earlier; stack (i5's one column) is cut
    dlayout: pick(params.get("dlayout"), ["label", "side", "rail"], "label"),
    // G6.1: previous / next on an item page, once, in the sticky top bar. labels = ‹ Previous · Next › ·
    //   arrows = an arrow pair, the neighbour's title on hover/focus · count = ‹ 3 / 14 ›
    // i6 (L2, decided): count, + the neighbour's title on hover / focus (labels, arrows → Earlier)
    dnav: pick(params.get("dnav"), ["labels", "arrows", "count"], "count"),
    // P3.3.5: where the timeline's stage sits in the window (a short item only; a tall one always starts at the top)
    // i6 (L4, decided): center (top → Earlier); the player never moves it
    stagealign: pick(params.get("stagealign"), ["top", "center"], "center"),
    // == i6 · projects · open options (FEEDBACK-i6) ==
    // O1: card meta (timeline rows, grid cards, phone rows; Projects + Music) in the opened item's fact grammar
    //   (facts: disc + label, display face) · badges = i5's pills + mono date. Order type · status · date in both.
    cardmeta: pick(params.get("cardmeta"), ["facts", "badges"], "facts"),
    // P4: a grid's year dividers while a search / filter is on (Yarn.gridYears). fold = runs of years with 1–2 results
    //   share one divider · flow = no dividers, one grid · label = no dividers, a small year label on each card ·
    //   rule = i5 (always a divider per year). A search that names a year keeps the dividers in every mode.
    gridyears: pick(params.get("gridyears"), ["fold", "flow", "label", "rule"], "fold"),
    // i7 · P2 (Open), kit-wide since the owner's follow-up ("the smart year text wasnt done on music"): joined = status +
    //   date as one fact (Yarn.fact.statusDate: "Completed Dec 2024", "WIP since Sep 2025") on Projects, Music and the player
    statusdate: pick(params.get("statusdate"), ["apart", "joined"], "joined"), // i8: decided joined
    // i7 follow-up (owner: "on mobile for music and projects lets try doing grid but slightly thinner cards so we can fit
    //   at least some the description … image should still be on the left"): the phone list (Projects + Music, < 960px)
    //   row = today's rows · card = a roomier row-card, the image (bigger) on the left, name, facts and 2 lines of text
    phrow: pick(params.get("phrow"), ["row", "card"], "card"), // i8: decided card
  };
  html.dataset.sel = OPT.sel;
  html.dataset.cardmeta = OPT.cardmeta; // i6 · projects · O1
  html.dataset.phrow = OPT.phrow; // i7 follow-up: the phone list's rows or cards
  html.dataset.toggle = OPT.toggle;
  html.dataset.dfoot = OPT.dfoot;
  html.dataset.rope = OPT.rope;
  html.dataset.body = OPT.body;
  if (OPT.bg) html.dataset.bg = OPT.bg;
  html.dataset.msearch = OPT.msearch;
  html.dataset.soundui = OPT.soundui;
  html.dataset.mnav = OPT.mnav;
  Object.assign(html.dataset, { browseicon: OPT.browseicon, uisnd: OPT.uisnd, mactive: OPT.mactive, toast: OPT.toast, redbtn: OPT.redbtn }); // i5 · chrome (+ i6 · mobile: redbtn)
  Object.assign(html.dataset, { dlayout: OPT.dlayout, dnav: OPT.dnav, stagealign: OPT.stagealign }); // i5/i6 · layout
  if (params.has("embed") && params.get("embed") !== "0") html.dataset.embed = ""; // kit/mnav.html's frames: no ⚙ panel
  const reducedMQ = matchMedia("(prefers-reduced-motion: reduce)");
  const reduced = () => reducedMQ.matches || (params.has("reduced") && params.get("reduced") !== "0");
  if (reduced()) html.classList.add("y-reduced");

  // include a stylesheet/script: parser-blocking when we run sync, async otherwise
  function include(kind, url, { blocking = true } = {}) {
    if (SYNC && blocking) {
      document.write(kind === "css" ? `<link rel="stylesheet" href="${url}">` : `<script src="${url}"><\/script>`);
      return;
    }
    const el = document.createElement(kind === "css" ? "link" : "script");
    if (kind === "css") { el.rel = "stylesheet"; el.href = url; }
    else { el.src = url; el.async = !blocking ? true : false; }
    document.head.appendChild(el);
  }
  // Phosphor icons (regular + fill + bold), vendored next to the kit (@phosphor-icons/web@2.1.1)
  if (!document.querySelector("link[data-ph]")) {
    for (const w of ["regular", "fill", "bold"]) {
      const l = document.createElement("link");
      l.rel = "stylesheet"; l.href = kitURL(`vendor/phosphor/${w}/style.css`); l.dataset.ph = w;
      document.head.appendChild(l);
    }
  }
  if (BODY_FONTS[OPT.body].css) include("css", BODY_FONTS[OPT.body].css);
  if (OPT.bg) include("css", kitURL(`bg/${OPT.bg}.css`));

  /* ============================================================
     TRANSITION GATE (arriving half; departing half is Yarn.transition.go)
     ============================================================ */
  const TR_KEY = "yarn.transition";
  let trIn = null;
  try {
    const s = JSON.parse(sessionStorage.getItem(TR_KEY) || "null");
    if (s && Date.now() - s.t < 8000) trIn = s;
    sessionStorage.removeItem(TR_KEY);
  } catch (_) {}
  if (!trIn && params.get("from") === "home") trIn = { rect: null };
  if (trIn) html.classList.add("yt-enter");

  /* ============================================================
     SMALL UTILITIES
     ============================================================ */
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const norm = (s) => String(s ?? "").trim().toLowerCase();
  const asArr = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
  const hash = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rng = (seed) => () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const sound = (name, opts) => { try { window.YarnSound?.play(name, opts); } catch (_) {} };
  let uidN = 0;
  const uid = (p = "y") => `${p}-${(++uidN).toString(36)}`;
  const isShown = (el) => !!(el && el.isConnected && el.getClientRects().length);
  // a length token (--bottom-ui, --sticky-top, --frame…) as a number of CSS px, resolved on `el` (default :root).
  // Tokens are often calc() strings, so measure instead of parseFloat()ing them.
  let probeEl = null;
  function px(name, el = null) {
    const host = el && el !== html ? el : document.body;
    if (!host) return 0;
    if (!probeEl) { probeEl = document.createElement("i"); probeEl.setAttribute("aria-hidden", "true"); }
    probeEl.style.cssText = `position:absolute;left:0;top:0;width:0;visibility:hidden;pointer-events:none;display:block;height:var(${name}, 0px)`;
    host.appendChild(probeEl);
    const v = parseFloat(getComputedStyle(probeEl).height) || 0;
    probeEl.remove();
    return v;
  }
  // CSS zoom in effect on an element (Music zooms its list while an item is docked)
  const zoomOf = (el) => (el && el.currentCSSZoom) || 1;

  /* ---------- springs (damping ratio + response, Apple-style; interruptible) ---------- */
  const live = new Set();
  let rafId = 0;
  function frame(now) { rafId = 0; for (const s of [...live]) s._step(now); if (live.size) rafId = requestAnimationFrame(frame); }
  class Spring {
    constructor(value = 0, o = {}) {
      this.value = value; this.target = value; this.velocity = 0;
      this.damping = o.damping ?? 1; this.response = o.response ?? 0.42; this.rest = o.rest ?? 0.1;
      this.onUpdate = o.onUpdate ?? null; this.onRest = null;
    }
    get moving() { return live.has(this); }
    to(target, o = {}) {
      if (o.damping != null) this.damping = o.damping;
      if (o.response != null) this.response = o.response;
      if (o.velocity != null) this.velocity = o.velocity;
      this.onRest = o.onRest ?? null;
      this.target = target;
      if (o.immediate || reduced()) { this.jump(target); return this; }
      this._t = performance.now();
      live.add(this);
      if (!rafId) rafId = requestAnimationFrame(frame);
      return this;
    }
    jump(v) { live.delete(this); this.value = this.target = v; this.velocity = 0; this.onUpdate?.(v); const r = this.onRest; this.onRest = null; r?.(v); }
    set(v) { live.delete(this); this.onRest = null; this.value = v; this.velocity = 0; this.onUpdate?.(v); }
    stop() { live.delete(this); }
    _step(now) {
      const dt = Math.min(0.05, Math.max(0.001, (now - this._t) / 1000));
      this._t = now;
      const w = (2 * Math.PI) / this.response, k = w * w, c = 2 * this.damping * w;
      const n = Math.ceil(dt / 0.004), h = dt / n;
      for (let i = 0; i < n; i++) { this.velocity += (-k * (this.value - this.target) - c * this.velocity) * h; this.value += this.velocity * h; }
      if (Math.abs(this.value - this.target) < this.rest && Math.abs(this.velocity) < this.rest * 20) return this.jump(this.target);
      this.onUpdate?.(this.value);
    }
  }
  // A spring as a CSS/WAAPI easing: { easing: "linear(…)", duration (ms), at(frac) → ms when progress first reaches frac }
  function springEasing({ response = 0.5, damping = 1, velocity = 0 } = {}) {
    const w = (2 * Math.PI) / response, k = w * w, c = 2 * damping * w, h = 1 / 600;
    let x = 0, v = velocity, t = 0;
    const xs = [0];
    while (t < 3) {
      v += (-k * (x - 1) - c * v) * h; x += v * h; t += h;
      xs.push(x);
      if (Math.abs(1 - x) < 0.0015 && Math.abs(v) < 0.02) break;
    }
    const dur = t * 1000, N = 40, pts = [];
    for (let i = 0; i <= N; i++) pts.push(i === N ? 1 : +xs[Math.round((i / N) * (xs.length - 1))].toFixed(4));
    return {
      easing: `linear(${pts.join(", ")})`,
      duration: Math.round(dur),
      at: (f) => { const i = xs.findIndex((q) => q >= f); return i < 0 ? dur : (i / (xs.length - 1)) * dur; },
    };
  }
  /* ---------- motion timings: one table for every "opening" (?motion=i2 = iteration 2's, to compare) ----------
     i3: motion starts at once and nothing waits on a fade. The reference feel is the Mine ⇄ Everyone switch
     (a .5 spring on transform, no delay); opening things now move the same way. Springs are response (s). */
  const MOTION = OPT.motion === "i2"
    ? { flip: 0.44, enter: null, enterMs: 300, exitMs: 220, stagger: 16, staggerMax: 140, sheet: 0.36, lbK: 240, lbChrome: 0.55,
        panel: 0.44, cover: 0.5, reveal: 0.56, contentMs: 380, contentDelay: 120, extrasAt: 0.55, extrasMs: 260, fontWait: 350, dock: 0.46 }
    : { flip: 0.42, enter: 0.34, enterMs: 0, exitMs: 170, stagger: 12, staggerMax: 84, sheet: 0.34, lbK: 300, lbChrome: 0.3,
        panel: 0.4, cover: 0.44, reveal: 0.46, contentMs: 220, contentDelay: 30, extrasAt: 0.32, extrasMs: 200, fontWait: 160, dock: 0.42 };

  /* ============================================================
     VOCABULARY + FORMATTING
     ============================================================ */
  const SVG = {
    check: `<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7.4" fill="currentColor"/><circle cx="8" cy="8" r="5.6" fill="none" class="k" stroke-opacity=".42" stroke-width=".8" stroke-dasharray="1.5 1.3"/><path class="k" d="M5 8.3 7.1 10.4 11.2 5.9" fill="none" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    pause: `<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.9" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="5.1" y="4.7" width="2.1" height="6.6" rx="1.05" fill="currentColor"/><rect x="8.8" y="4.7" width="2.1" height="6.6" rx="1.05" fill="currentColor"/></svg>`,
    bag: `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.7 6.4C2.7 7.8 2.1 10.4 2.6 12.3c.5 1.8 2.6 2.6 5.4 2.6s4.9-.8 5.4-2.6c.5-1.9-.1-4.5-2.1-5.9Z" fill="currentColor"/><path d="M6.6 5.9C5.2 5 4.1 3.3 4.7 2.3c.7-1 2.4.7 3.1 3.1ZM9.4 5.9c1.4-.9 2.5-2.6 1.9-3.6-.7-1-2.4.7-3.1 3.1Z" fill="currentColor"/><rect x="5.6" y="5.1" width="4.8" height="1.7" rx=".85" fill="#d62f38"/><path d="M4.6 10c1.7 1.2 5.1 1.2 6.8 0" fill="none" stroke="#fff" stroke-opacity=".38" stroke-width=".8" stroke-linecap="round"/></svg>`,
    // i6 · music · M5: Dropped = a trash can (lid + handle, a body with knocked-out ribs), drawn like the check
    trash: `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6.1 3.6V2.7c0-.5.4-.9.9-.9h2c.5 0 .9.4.9.9v.9" fill="none" stroke="currentColor" stroke-width="1.3"/><rect x="2.3" y="3.4" width="11.4" height="2" rx="1" fill="currentColor"/><path d="M3.5 6.3h9l-.8 7.3a1.5 1.5 0 0 1-1.5 1.3H5.8a1.5 1.5 0 0 1-1.5-1.3Z" fill="currentColor"/><path class="k" d="M6.3 8.3v4.4M8 8.3v4.4M9.7 8.3v4.4" fill="none" stroke-opacity=".7" stroke-width="1.05" stroke-linecap="round"/></svg>`,
  };
  const STATUS = {
    // i7 (owner, on every ongoing mark: "really i just want to say WIP … maybe a hammer … instead of red should be something
    // else"): the ongoing status is WIP, a hammer, gold (the key stays "ongoing", so ?status=ongoing and the data still work)
    ongoing: { key: "ongoing", label: "WIP", icon: `<i class="ph-bold ph-hammer" aria-hidden="true"></i>`, phIcon: "ph-hammer" },
    complete: { key: "complete", label: "Complete", icon: SVG.check, phIcon: "ph-check-circle" },
    paused: { key: "paused", label: "Paused", icon: SVG.pause, phIcon: "ph-pause-circle" },
    // i6 · music · M5 (owner: the bag "looks like a rock medal"): a trash can, the same glyph as the fact (ph-trash-simple)
    dropped: { key: "dropped", label: "Dropped", icon: SVG.trash, phIcon: "ph-trash-simple" },
  };
  const STATUS_ALIAS = { ongoing: "ongoing", wip: "ongoing", "in progress": "ongoing", "in-progress": "ongoing", building: "ongoing", active: "ongoing",
    complete: "complete", completed: "complete", done: "complete", finished: "complete", paused: "paused", "on hold": "paused", hiatus: "paused",
    dropped: "dropped", abandoned: "dropped", cancelled: "dropped", scrapped: "dropped" };
  const status = (s) => STATUS[STATUS_ALIAS[norm(s)]] || null;
  const TYPE = {
    personal: { key: "personal", label: "Personal", icon: "ph-user" },
    work: { key: "work", label: "Work", icon: "ph-briefcase" },
    school: { key: "school", label: "School", icon: "ph-graduation-cap" },
  };
  const type = (t) => TYPE[norm(t)] || (t ? { key: slug(t), label: String(t), icon: "ph-tag" } : null);
  const INSTRUMENT = {
    piano: { key: "piano", label: "Piano", icon: "ph-piano-keys" },
    beepbox: { key: "beepbox", label: "BeepBox", icon: "ph-circle" },
    daw: { key: "daw", label: "DAW", icon: "ph-wave-sine" },
  };
  const instrument = (i) => INSTRUMENT[norm(i)] || null;
  const PUB = {
    live: { label: "Live", icon: "ph-broadcast", title: "Published: this is what visitors see" },
    draft: { label: "Draft", icon: "ph-pencil-simple-line", title: "Draft: only you can see it" },
    changed: { label: "Edits", icon: "ph-push-pin", title: "Live, with edits that aren't published yet" },
    hidden: { label: "Hidden", icon: "ph-eye-slash", title: "Hidden from the site" },
  };

  // devicons: same mapping as src/lib/devicons.ts (+ JSON), pinned version
  const DEVICON_V = "v2.16.0";
  const DEVICONS = {
    Astro: "astro", Svelte: "svelte", Tailwind: "tailwindcss", Cloudflare: "cloudflare", Python: "python", PostgreSQL: "postgresql",
    Rust: "rust", MongoDB: "mongodb", Flask: "flask", React: "react", Azure: "azure", Sqlite3: "sqlite", Java: "java",
    JavaScript: "javascript", Typescript: "typescript", Deno: "denojs", Node: "nodejs", "Node.js": "nodejs", "Discord.py": "discordjs",
    "Discord.js": "discordjs", "Google Sheets API": "google", C: "c", "Next.js": "nextjs", Supabase: "supabase", JSON: "json",
  };
  const STACK_PH = { beepbox: "ph-circle", "openai api": "ph-open-ai-logo", "cloudbased llm provider apis": "ph-cloud", stm32: "ph-cpu", freertos: "ph-cpu", dac: "ph-waveform" };
  const DEV_LC = Object.fromEntries(Object.entries(DEVICONS).map(([k, v]) => [k.toLowerCase(), v]));
  function devicon(name) {
    const s = DEV_LC[norm(name)];
    return s ? `https://cdn.jsdelivr.net/gh/devicons/devicon@${DEVICON_V}/icons/${s}/${s}-original.svg` : null;
  }
  /* == i5 · home · H3.1: mono stack glyphs (?stkicon=color|mono · research/STACK-ICONS.md) ==
     color (default) = the devicon -original <img> (today). mono = one single-colour glyph per name, drawn as a CSS mask
     (<i class="ystk-ic">, so every `> i` size / wiggle / dim rule applies) and filled with its brand tint at rest
     (contrast-checked to 3:1 on --cotton-2; "" = ink/currentColor). A filled toggle (red / ink / tint) sets --ystk-on,
     so the same glyph is white on a red chip (yarn.css § i5 · home). Sources: Simple Icons (CC0 package, pinned) first;
     devicon -plain where Simple Icons has no logo (Azure, Java); anything else stays Phosphor (STACK_PH). */
  /* == i6 · projects · S2: one rule, no option (owner: "on a white background colour logos are good but otherwise we
     should switch to one-colour tinted"). ?stkicon is gone. stackIcon() returns one <i class="ystk-ic"> carrying both
     looks: --ystk-col (the devicon colour logo) and --ystk-src + --ystk-tint (the one-colour glyph). yarn.css picks by
     surface: white / light neutral (cards, chips, the sheet) → the colour logo; any other surface (a filled toggle, ink,
     .on-ink, .on-tint) → the glyph in one colour (white on red/ink, the brand tint on a tinted card). The five stacks
     with no devicon logo (Semantic UI, Spark, TOML, Zola, STM32) show their new glyph in its brand tint on white too. */
  const SIMPLE_ICONS_V = "16.36.0";
  const STACK_MONO = { // lower-case name → [glyph, tint]. glyph: Simple Icons slug, or "dv:<devicon slug>-<variant>"
    astro: ["astro", "#bc52ee"], azure: ["dv:azure-plain", "#0078d4"], c: ["c", "#03599c"], cloudflare: ["cloudflare", "#d17020"],
    deno: ["deno", ""], "discord.js": ["discorddotjs", "#5865f2"], "discord.py": ["discorddotjs", "#5865f2"], flask: ["flask", ""],
    "google sheets api": ["google", "#4285f4"], java: ["dv:java-plain", "#ea2d2e"], // Freemarker: Simple Icons' mark is unreadable at 16px
    javascript: ["javascript", "#988a1e"], json: ["json", ""], mongodb: ["mongodb", "#459a45"], "next.js": ["nextdotjs", ""],
    node: ["nodedotjs", "#5b984b"], "node.js": ["nodedotjs", "#5b984b"], postgresql: ["postgresql", "#4169e1"], python: ["python", "#3776ab"],
    react: ["react", "#4893a7"], rust: ["rust", ""], "semantic ui": ["semanticui", "#069a93"], spark: ["apachespark", "#e25a1c"],
    sqlite3: ["sqlite", "#003b57"], stm32: ["stmicroelectronics", ""], supabase: ["supabase", "#359a6c"], svelte: ["svelte", "#ff3e00"],
    tailwind: ["tailwindcss", "#0c95ac"], toml: ["toml", "#9c4121"], typescript: ["typescript", "#3178c6"], zola: ["zola", ""],
  };
  function stackGlyph(name) {
    const m = STACK_MONO[norm(name)];
    if (!m) return null;
    const [g, tint] = m;
    const url = g.startsWith("dv:")
      ? `https://cdn.jsdelivr.net/gh/devicons/devicon@${DEVICON_V}/icons/${g.slice(3).replace(/-(plain|line)$/, "")}/${g.slice(3)}.svg`
      : `https://cdn.jsdelivr.net/npm/simple-icons@${SIMPLE_ICONS_V}/icons/${g}.svg`;
    return { url, tint };
  }
  // icon markup for a stack name: one <i class="ystk-ic"> (colour logo or one-colour glyph, picked by the surface in CSS),
  // or a phosphor fallback (like the old site's {} ). mode: "" (the rule) · "color" / "mono" force one look (research page)
  function stackIcon(name, { alt = "", mode = "" } = {}) {
    const mg = stackGlyph(name), uc = devicon(name);
    if (mg) {
      const st = `--ystk-src: url(${mg.url})${mg.tint ? `; --ystk-tint: ${mg.tint}` : ""}${uc ? `; --ystk-col: url(${uc})` : ""}`;
      const cls = `ystk-ic${uc ? " has-col" : ""}${mode === "mono" ? " is-mono" : mode === "color" ? " is-col" : ""}`;
      return `<i class="${cls}" style="${st}"${alt ? ` role="img" aria-label="${esc(alt)}"` : ` aria-hidden="true"`}></i>`;
    }
    const u = devicon(name);
    if (u) return `<img src="${u}" alt="${esc(alt)}" width="16" height="16" loading="lazy" decoding="async" data-ydev>`;
    const own = STACK_OWN.get(norm(name)); // i9 · polish (S11): a logo found / set for a name the kit doesn't know
    if (own) {
      const a11y = alt ? ` role="img" aria-label="${esc(alt)}"` : ` aria-hidden="true"`;
      if (own.src || own.col) {
        const st = [own.src && `--ystk-src: url('${cssURL(own.src)}')`, /^#[0-9a-f]{6}$/i.test(own.tint || "") && `--ystk-tint: ${own.tint}`, own.col && `--ystk-col: url('${cssURL(own.col)}')`].filter(Boolean).join("; ");
        return `<i class="ystk-ic${own.col ? " has-col" : ""}" style="${st}" data-ystk="${own.by || "own"}"${a11y}></i>`;
      }
      return `<i class="ystk-ic ystk-mono" data-ystk="mono"${a11y}>${esc(stackInitials(name))}</i>`;
    }
    const ph = STACK_PH[norm(name)] || "ph-brackets-curly";
    return alt ? `<i class="ph-bold ${ph}" role="img" aria-label="${esc(alt)}"></i>` : `<i class="ph-bold ${ph}" aria-hidden="true"></i>`;
  }
  /* == i9 · polish · S11 (pin 13: "if i add an item that we dont have yet it should automatically find the logo") ==
     A stack name the kit has no logo for gets one at run time, the same <i class="ystk-ic"> as every other:
       Yarn.stackKnown(name)        true when the kit's own maps (Simple Icons / devicon / Phosphor) cover it
       Yarn.stackSlugs(name)        the Simple Icons slugs to try: "Three.js" → threedotjs, threejs, three · "C++" →
                                    cplusplus · "C#" → csharp · "Vue" → vue, vuedotjs, vuejs …
       Yarn.stackLookup(name)       → Promise<{ found: { slug, title, src, tint } } | { none: true } | { offline: true }>:
                                    one cached read of the pinned Simple Icons index (data/simple-icons.json): a title or
                                    alias match, else the first slug that exists, else a sole "<name> …" title. src = the
                                    one-colour glyph (CC0), tint = its brand colour darkened to 3:1 on cotton
       Yarn.stackLogo(name, info)   registers what a page knows: { src, tint } a one-colour glyph (masked: its tint at rest,
                                    white on a filled chip, like Svelte's) · { col } a colour image (an upload or a URL; also used as
                                    the glyph's mask on filled chips) · { mono: true } the monogram (nothing found, or
                                    offline) · null forgets it. Yarn.stackLogo(name) reads it back.
     Projects carry theirs as p.stackIcons = { [name]: info } (Studio persists it; a site page registers them on load). */
  const STACK_OWN = new Map();
  const cssURL = (u) => String(u).replace(/['"()\\\s]/g, (c) => encodeURIComponent(c));
  const stackKnown = (name) => { const n = norm(name); return !!(STACK_MONO[n] || DEV_LC[n] || STACK_PH[n]); };
  function stackInitials(name) {
    const w = String(name).replace(/[^\p{L}\p{N}+#. ]/gu, " ").split(/[\s.]+/).filter((x) => x && !/^(on|of|the|and|for|a|an|to|in|js)$/i.test(x));
    if (w.length > 1) return (w[0][0] + w[1][0]).toUpperCase(); // "Ruby on Rails" → RR
    const s = (w[0] || "?").slice(0, 2); // "Bun" → Bu · "C#" → C#
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  }
  function stackSlugs(name) {
    const base = String(name).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
    const swap = (s) => s.replace(/\+/g, "plus").replace(/#/g, "sharp").replace(/&/g, "and").replace(/\./g, "dot");
    const clean = (s) => s.replace(/[^a-z0-9]/g, "");
    const stem = clean(base.replace(/\.?js$/, ""));
    // + # & carry meaning: "C#" may only be csharp (never plain c), "C++" only cplusplus
    const out = /[+#&]/.test(base) ? [clean(swap(base))] : [clean(swap(base)), clean(base), stem + "dotjs", stem + "js", stem, clean(swap(base.split(/\s+/)[0]))];
    return [...new Set(out)].filter((s) => s.length > 0);
  }
  function stackLogo(name, info) {
    const n = norm(name);
    if (arguments.length < 2) return STACK_OWN.get(n) || null;
    if (info) STACK_OWN.set(n, info); else STACK_OWN.delete(n);
    return info || null;
  }
  const SI_ICON = (slug) => `https://cdn.jsdelivr.net/npm/simple-icons@${SIMPLE_ICONS_V}/icons/${slug}.svg`;
  // the package's own index (title, slug, aliases, brand hex; ~120 KB gzipped, fetched once and cached): one request
  // answers every variant, never a string of 404s, and gives the brand colour for the tint
  const SI_DATA_URL = `https://cdn.jsdelivr.net/npm/simple-icons@${SIMPLE_ICONS_V}/data/simple-icons.json`;
  let siData = null;
  const siIndex = (timeout) => (siData ||= (async () => {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), timeout);
    try { const r = await fetch(SI_DATA_URL, { mode: "cors", cache: "force-cache", signal: ctl.signal }); if (!r.ok) throw new Error(r.status); return await r.json(); }
    finally { clearTimeout(t); }
  })().catch((e) => { siData = null; throw e; }));
  // the brand hex as a tint the way research/STACK-ICONS.md set them: darkened toward ink until it has 3:1 on
  // --cotton-2; near-black / near-white brands use the text colour ("")
  const L = (h) => { const v = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
  function siTint(hex) {
    if (!/^[0-9a-f]{6}$/i.test(hex || "")) return "";
    const rgb = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)), mx = Math.max(...rgb), mn = Math.min(...rgb);
    if (L(hex) < 0.03 || (mx - mn < 24 && L(hex) > 0.4)) return ""; // black, or a pale grey: ink
    const ink = [31, 30, 30], bg = L("f3eee6");
    for (let k = 0; k <= 1; k += 0.05) {
      const h = rgb.map((c, i) => Math.round(c + (ink[i] - c) * k).toString(16).padStart(2, "0")).join("");
      if ((bg + 0.05) / (L(h) + 0.05) >= 3) return `#${h}`;
    }
    return "";
  }
  const titleKey = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
  async function stackLookup(name, { timeout = 6000 } = {}) {
    let list;
    try { list = await siIndex(timeout); } catch (_) { return { offline: true }; }
    const k = titleKey(name), slugs = stackSlugs(name);
    const starts = list.filter((x) => titleKey(x.title).startsWith(k + " "));
    const hit = list.find((x) => titleKey(x.title) === k || (x.aliases?.aka || []).some((a) => titleKey(a) === k))
      || slugs.map((s) => list.find((x) => x.slug === s)).find(Boolean)
      || (starts.length === 1 ? starts[0] : null); // "Godot" → "Godot Engine", when it's the only one
    return hit ? { found: { slug: hit.slug, title: hit.title, src: SI_ICON(hit.slug), tint: siTint(hit.hex) } } : { none: true };
  }

  /* ---------- dates: one format everywhere ---------- */
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const MONTH = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  function parseDate(s) {
    if (!s) return null;
    if (s instanceof Date) return s;
    const str = String(s).trim();
    const my = str.match(/^([A-Za-z]{3})[a-z]*\.?\s+(\d{4})$/);
    if (my) return new Date(+my[2], MON.findIndex((m) => m.toLowerCase() === my[1].toLowerCase()), 1);
    const iso = str.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?(?:T(\d{2}):(\d{2}))?/);
    if (iso) return new Date(+iso[1], +iso[2] - 1, +(iso[3] || 1), +(iso[4] || 0), +(iso[5] || 0));
    if (/^\d{4}$/.test(str)) return new Date(+str, 0, 1);
    return null;
  }
  const fmt = {
    month: (d) => `${MON[d.getMonth()]} ${d.getFullYear()}`,          // Sep 2025
    monthLong: (d) => `${MONTH[d.getMonth()]} ${d.getFullYear()}`,    // September 2025
    day: (d) => `${MON[d.getMonth()]} ${d.getDate()}`,                // Nov 7
    full: (d) => `${MON[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`,
    time: (d) => { const h = d.getHours(); return `${h % 12 || 12}:${String(d.getMinutes()).padStart(2, "0")} ${h >= 12 ? "pm" : "am"}`; },
    iso: (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
  };
  // { start, end, status } → "Sep 2025 – now" | "Mar – Aug 2025" | "Jun 2024" | "Dec 2023 – Feb 2025"
  function dateRange(item) {
    const s = parseDate(item?.start), e0 = parseDate(item?.end);
    if (!s) return "";
    const on = status(item.status)?.key === "ongoing";
    const e = on ? null : e0;
    if (!e) return on ? `${fmt.month(s)} – now` : fmt.month(s);
    if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) return fmt.month(s);
    if (s.getFullYear() === e.getFullYear()) return `${MON[s.getMonth()]} – ${fmt.month(e)}`;
    return `${fmt.month(s)} – ${fmt.month(e)}`;
  }
  function duration(item) {
    const s = parseDate(item?.start);
    if (!s) return "";
    const on = status(item.status)?.key === "ongoing";
    const e = (!on && parseDate(item.end)) || (on ? new Date() : s);
    const n = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()) + 1;
    return n < 12 ? `${n} mo` : `${Math.floor(n / 12)} yr${n % 12 ? ` ${n % 12} mo` : ""}`;
  }
  const yearOf = (item) => (parseDate(item?.start || item?.date || item) || new Date()).getFullYear();

  /* ---------- i9 · music · a release's facts from its songs, mixed instruments, the Music order (S6 · S9 · S10) ----------
     Yarn.musicFacts(entry) → { status, start, end, instrument, instruments, mix, mixed, songs }
       a single: its own fields. A collection (its songs, or the player's tracks): from its songs (owner: "for collections
       the start and end date are automatic based on the songs"):
         status   WIP if any song is WIP · else Complete if any is · else Paused if any is · else Dropped
         start    its earliest song start · end: the latest finish among its songs that aren't WIP (none while it's WIP)
         mix      [[instrument, songs], …] most songs first (a tie keeps the first to appear) · instruments: those keys ·
                  instrument: the first · mixed: more than one (owner: "one song is piano another is daw")
     Yarn.musicOrder(items, mode = "finished", { now }) → a new array: the order the Music page shows. Ties go A–Z by name.
       finished  the old site's sortByDate + the owner's note, newest first: WIP = now (always on top) · Complete: its
                 finish (else its start) · Dropped: its finish if it has one, else its start · anything else: its start
       started   newest start first · az: by name · hand: Studio's drag order (_order)
       .key(item, mode, { now }) → { t, year } (year: null for az / hand)
       .groups(items, mode, { now }) → [{ year, items }] in order (the year pills), or null for az / hand
       .MODES → [{ key, label, short, rule }] */
  const MUSIC_ST = { ongoing: "wip", complete: "complete", paused: "paused", dropped: "dropped" };
  const songsOf = (e) => (e && e.type !== "single" && Array.isArray(e.songs) && e.songs.length ? e.songs
    : e?.kind === "collection" && Array.isArray(e.tracks) && e.tracks.length ? e.tracks : null);
  const instKey = (i) => instrument(i)?.key || (i ? "other" : "");
  function instMix(list, fallback) {
    const n = new Map();
    for (const s of list || []) { const k = instKey(s?.instrument || fallback); if (k) n.set(k, (n.get(k) || 0) + 1); }
    return [...n.entries()].sort((a, b) => b[1] - a[1]);
  }
  function musicFacts(e) {
    const songs = songsOf(e);
    if (!songs) { const k = instKey(e?.instrument); return { status: e?.status || "", start: e?.start || "", end: e?.end || "", instrument: k, instruments: k ? [k] : [], mix: k ? [[k, 1]] : [], mixed: false, songs: 0 }; }
    const keys = songs.map((s) => status(s.status)?.key);
    const st = ["ongoing", "complete", "paused", "dropped"].find((k) => keys.includes(k)) || status(e.status)?.key || "";
    const starts = songs.map((s) => parseDate(s.start)).filter(Boolean);
    const ends = songs.filter((s) => status(s.status)?.key !== "ongoing").map((s) => parseDate(s.end)).filter(Boolean);
    const first = starts.length ? new Date(Math.min(...starts)) : parseDate(e.start);
    const last = st !== "ongoing" && ends.length ? new Date(Math.max(...ends)) : null;
    const mix = instMix(songs, e.instrument);
    return { status: MUSIC_ST[st] || e.status || "", start: first ? fmt.month(first) : "", end: last ? fmt.month(last) : "", instrument: mix[0]?.[0] || instKey(e.instrument), instruments: mix.map(([k]) => k), mix, mixed: mix.length > 1, songs: songs.length };
  }
  // an item's instrument(s) for facts / filters: a collection's from its songs
  const instOfItem = (it) => (songsOf(it) ? musicFacts(it).instruments : it?.instrument);
  const MUSIC_ORDER = [
    { key: "finished", label: "Newest finished", short: "Finished", rule: OPT.mcomplete === "start" ? "WIP first. Complete goes by its start; Dropped by its finish, else its start." : "WIP first, then the newest finish. Dropped with no finish uses its start." },
    { key: "started", label: "Newest started", short: "Started", rule: "The newest start first." },
    { key: "az", label: "A–Z", short: "A–Z", rule: "By name, A to Z." },
    { key: "hand", label: "By hand", short: "By hand", rule: "Your own order: drag the handles." },
  ];
  const byName = (a, b) => String(a?.name ?? a?.title ?? "").localeCompare(String(b?.name ?? b?.title ?? ""), "en", { sensitivity: "base", numeric: true });
  function musicKey(it, mode = "finished", { now = Date.now(), complete = OPT.mcomplete } = {}) {
    if (mode === "az" || mode === "hand") return { t: 0, year: null };
    const f = musicFacts(it), s = parseDate(f.start), e = parseDate(f.end), st = status(f.status)?.key;
    let d = s;
    if (mode !== "started") {
      if (st === "ongoing") return { t: Infinity, year: new Date(now).getFullYear() };
      if (st === "dropped" || (st === "complete" && complete !== "start")) d = e || s;
    }
    return d ? { t: +d, year: d.getFullYear() } : { t: -Infinity, year: null };
  }
  function musicOrder(items, mode = "finished", o = {}) {
    const list = [...(items || [])];
    if (mode === "az") return list.sort(byName);
    if (mode === "hand") return list.sort((a, b) => (a._order ?? 1e9) - (b._order ?? 1e9) || byName(a, b));
    const k = new Map(list.map((it) => [it, musicKey(it, mode, o)]));
    return list.sort((a, b) => k.get(b).t - k.get(a).t || byName(a, b)); // ±Infinity ties are NaN → falsy → by name
  }
  musicOrder.key = musicKey;
  musicOrder.MODES = MUSIC_ORDER;
  musicOrder.groups = (items, mode = "finished", o = {}) => {
    if (mode === "az" || mode === "hand") return null;
    const out = [];
    for (const it of musicOrder(items, mode, o)) { const y = musicKey(it, mode, o).year, g = out[out.length - 1]; if (g && g.year === y) g.items.push(it); else out.push({ year: y, items: [it] }); }
    return out;
  };
  // a mixed instrument's disc: one slice per instrument (the page colours --inst-*)
  const instKeys = (i) => [...new Set((Array.isArray(i) ? i : [i]).map((x) => instKey(Array.isArray(x) ? x[0] : x)).filter(Boolean))];
  const mixGrad = (ks) => `conic-gradient(from -90deg, ${ks.map((k, j) => `var(--inst-${k}, var(--y-fg-3)) ${(j * 100 / ks.length).toFixed(1)}% ${((j + 1) * 100 / ks.length).toFixed(1)}%`).join(", ")})`;
  const instLabel = (i) => instKeys(i).map((k) => instrument(k)?.label || k).join(" + ");

  /* ---------- media paths: data uses /media/x → real files in the repo ---------- */
  const PUBLIC_MEDIA = new Set(["bankresult.png", "beepsearch.png", "fitr-recruiter.mp4", "fitr-redesign.gif", "harrypotter.mp4", "musicpagecomp.mp4", "portal-coach.gif", "portal-student.png", "rawsy.png", "site-plan.png", "sona-auri.png", "sona-different.png", "sona.png", "sub-overrides.mp4", "sub-terminal-sexy.mp4", "webcheckers.mp4", "wsg.mp4"]);
  const DESIGN_MEDIA = new Set(["blaqat.svg", "nina.jpg"]);
  const isVideo = (src, kind) => kind === "video" || /\.(mp4|webm|mov|m4v)(#.*)?$/i.test(String(src || ""));
  // → absolute URL, or null when the file isn't in the repo (remote URLs: no network calls in the mocks)
  function media(src) {
    if (!src) return null;
    const s = String(src);
    if (/^https?:/i.test(s)) return null;
    const m = s.match(/(?:^|\/)media\/([^/?#]+)$/);
    if (m && s.startsWith("/media/")) {
      if (PUBLIC_MEDIA.has(m[1])) return kitURL(`../../../../public/media/${m[1]}`);
      if (DESIGN_MEDIA.has(m[1])) return kitURL(`../media/${m[1]}`);
      return null;
    }
    return new URL(s, location.href).href;
  }

  /* ============================================================
     BADGES · META · STACK · TAGS (one renderer for every page)
     ============================================================ */
  const badge = {
    status(s, { compact = false } = {}) {
      const st = typeof s === "object" && s?.key ? s : status(s);
      if (!st) return "";
      const label = compact ? `<span class="sr-only">${st.label}</span>` : `<span>${st.label}</span>`;
      return `<span class="ybadge ybadge--${st.key}${compact ? " ybadge--icon" : ""}" data-status="${st.key}"${compact ? ` title="${st.label}"` : ""}>${st.icon}${label}</span>`;
    },
    // { icon, label } override the vocabulary (Thoughts post types: Scratch, Article, Pick…)
    type(t, { compact = false, icon = "", label = "" } = {}) {
      const ty = type(t);
      if (!ty) return "";
      const ic = icon || ty.icon, lb = label || ty.label;
      return `<span class="ybadge ybadge--type${compact ? " ybadge--icon" : ""}" data-type="${esc(ty.key)}"${compact ? ` title="${esc(lb)}"` : ""}><i class="ph-bold ${ic}" aria-hidden="true"></i><span${compact ? ' class="sr-only"' : ""}>${esc(lb)}</span></span>`;
    },
    // (i7 · C1: the publish-state badge is gone; Studio writes it as a fact, Yarn.fact.pub)
    instrument(i, { compact = false } = {}) {
      const ks = instKeys(i); // i9 · music · S6: a list of instruments (a mixed collection) → one badge, the split disc
      if (ks.length > 1) { const l = instLabel(ks); return `<span class="ybadge ybadge--inst${compact ? " ybadge--icon" : ""}" data-instrument="mixed" style="--inst-c:${mixGrad(ks)}"${compact ? ` title="${l}"` : ""}><i class="ph-bold ph-music-notes" aria-hidden="true"></i><span${compact ? ' class="sr-only"' : ""}>${l}</span></span>`; }
      const it = instrument(Array.isArray(i) ? ks[0] : i);
      if (!it) return "";
      return `<span class="ybadge ybadge--inst${compact ? " ybadge--icon" : ""}" data-instrument="${it.key}"${compact ? ` title="${it.label}"` : ""}><i class="ph-bold ${it.icon}" aria-hidden="true"></i><span${compact ? ' class="sr-only"' : ""}>${it.label}</span></span>`;
    },
    // item {start,end,status} → range; ISO string / Date → { style: "day" | "full" | "month" | "monthLong" }
    date(x, { style = "month", dur = false, time = false } = {}) {
      if (x && typeof x === "object" && !(x instanceof Date)) {
        const s = parseDate(x.start), txt = dateRange(x);
        if (!txt) return "";
        return `<time class="ydate" datetime="${s ? fmt.iso(s) : ""}">${txt}${dur ? `<span class="ydate__dur">· ${duration(x)}</span>` : ""}</time>`;
      }
      const d = parseDate(x);
      if (!d) return "";
      return `<time class="ydate" datetime="${typeof x === "string" ? esc(x) : d.toISOString()}" title="${fmt.full(d)}, ${fmt.time(d)}">${fmt[style](d)}${time ? ` · ${fmt.time(d)}` : ""}</time>`;
    },
  };
  // status, type (or instrument), then the date — optionally a stack row under it
  function meta(item, { parts, compact = false, dur = false, stack = false, cls = "" } = {}) {
    if (!item) return "";
    // projects: status · type · date. music: status · date (the yarn swatch already says the instrument; add "instrument" to parts to show it)
    const p = parts || (TYPE[norm(item.type)] ? ["status", "type", "date"] : ["status", "date"]);
    const out = [];
    for (const k of p) {
      if (k === "status" && item.status) out.push(badge.status(item.status, { compact }));
      else if (k === "type" && item.type) out.push(badge.type(item.type, { compact }));
      else if (k === "instrument" && item.instrument) out.push(badge.instrument(instOfItem(item), { compact }));
      else if (k === "date") out.push(badge.date(item, { dur }));
    }
    const row = `<div class="ymeta ${cls}">${out.filter(Boolean).join("")}</div>`;
    return stack && item.stack?.length ? row + stackList(item.stack, { variant: stack === true ? "chips" : stack }) : row;
  }
  /* == i6 · projects · O1 · card meta (timeline rows, grid cards, phone rows; Projects + Music) ==
     Yarn.cardMeta(item, { parts, compact, dur, match, mode, cls }) → <div class="ymeta ymeta--facts|badges">
     Order: type (or instrument) · status · date ("status and year really goes together").
     facts (?cardmeta=facts, default): the opened item's grammar, Yarn.fact.* (disc + label, one face). Ongoing is the
       condensed icon-only disc (label kept for screen readers + title), so it reads as the date's own disc:
       "(hammer) Sep 2025 – now". The date is a fact without a disc. compact (phones): every disc is icon-only.
     badges: i5's badges (Yarn.badge.*, mono date) in the same order.
     Each part carries data-mk="type|instrument|status" and .is-match when match[part] is true (the in-card match look;
     an icon-only part opens to show its label). parts: default type · status · date, or status · date without a type. */
  // i6 fix (P2-5): a range across years also carries its short form ("Dec ’22 – Jan ’23"), shown only when a
  // timeline's facts need it (.ytl.is-factfit2 since i7, fitFacts); the full range stays for screen readers
  const shortYears = (h) => h.replace(/(<time[^>]*>)([^<]*\b(?:19|20)\d\d\b[^<]*\b(?:19|20)\d\d\b[^<]*)(<\/time>)/, (_, a, t, z) => `${a}<span class="ydr-l">${t}</span><span class="ydr-s" aria-hidden="true">${t.replace(/\b(?:19|20)(\d\d)\b/g, "’$1")}</span>${z}`);
  const markPart = (h, mk, on) => (h ? h.replace(/^<(\w+) class="([^"]*)"/, (_, t, c) => `<${t} class="${c}${on ? " is-match" : ""}" data-mk="${mk}"`) : "");
  /* i7 · projects (opt-in, so existing calls are unchanged):
     icons: true      (P3, Projects' ?cardfacts=icons) every disc icon-only, the type / instrument too, named by the kit hint
     statusdate: "joined"  (P2, Projects' ?statusdate=joined) status + date as one fact (Yarn.fact.statusDate): "Completed
                      Dec 2024", "WIP since Sep 2025"; with icons / compact the word steps back: "(✓) Dec 2024"
     compact (phones; i7 Decided "small-card facts"): the type / instrument keeps its WORD, the status is its disc. */
  function cardMeta(item, { parts, compact = false, dur = false, match = null, mode = OPT.cardmeta, cls = "", icons = false, statusdate = OPT.statusdate } = {}) {
    if (!item) return "";
    const p = parts || (TYPE[norm(item.type)] ? ["type", "status", "date"] : ["status", "date"]);
    const st = status(item.status), m = (k) => !!(match && match[k]);
    const facts = mode !== "badges", out = [];
    const joined = facts && statusdate === "joined" && p.includes("status") && !!statusDateParts(item);
    // i6 fix (review P2-1): an icon-only fact names itself with the kit's quick hint (mouse hover; keyboard focus on
    // desktop, where it is a tab stop: on phones it can sit inside its row's link, and touch shows no hints)
    const tab = compact ? "" : 'tabindex="0"';
    const ico = (label) => ({ cls: "yfact--icon", hint: label, attrs: tab });
    for (const k of p) {
      // i7: a fact that shows its word still carries its hint (data-hint): the kit hint shows it only while the word is
      // hidden (a tight timeline's fitFacts, a page's own icon-only rule)
      if (k === "type" && item.type) out.push(markPart(facts ? fact.type(item.type, icons ? ico(type(item.type)?.label) : { hint: type(item.type)?.label }) : badge.type(item.type, { compact }), "type", m("type")));
      else if (k === "instrument" && item.instrument) { const ins = instOfItem(item); out.push(markPart(facts ? fact.instrument(ins, icons ? ico(instLabel(ins)) : { hint: instLabel(ins) }) : badge.instrument(ins, { compact }), "instrument", m("instrument"))); } // i9 · music · S6: a collection's from its songs
      else if (k === "status" && st && joined) out.push(markPart(fact.statusDate(item, compact || icons ? { word: false, attrs: tab } : {}), "status", m("status")));
      else if (k === "status" && st) {
        const icon = compact || icons || st.key === "ongoing";
        out.push(markPart(facts ? fact.status(st, icon ? ico(st.label) : { hint: st.label }) : badge.status(st, { compact }), "status", m("status")));
      } else if (k === "date") out.push(joined ? "" : facts ? shortYears(fact.date(item, { dur, cls: "yfact--bare" })) : badge.date(item, { dur }));
      else out.push("");
    }
    // facts: a status right before the date travels with it (.ymeta__pair: one unit that wraps together, tight gap)
    const si = p.indexOf("status");
    if (facts && si >= 0 && p[si + 1] === "date" && out[si] && out[si + 1]) out.splice(si, 2, `<span class="ymeta__pair">${out[si]}${out[si + 1]}</span>`);
    return `<div class="ymeta ymeta--${facts ? "facts" : "badges"}${compact ? " ymeta--compact" : ""}${cls ? ` ${cls}` : ""}">${out.filter(Boolean).join("")}</div>`;
  }
  // stack chips: variant "chips" (icon + name) | "icons" (icon-only, accessible names). as: "li" | "button" (data-yf toggles the page filter)
  function stackList(list, { variant = "chips", max = Infinity, as = "li", pressed = null, label = "Built with", size = "" } = {}) {
    const items = asArr(list);
    const shown = items.slice(0, max), rest = items.slice(max);
    const icons = variant === "icons";
    const one = (n) => {
      const ico = stackIcon(n, { alt: icons ? n : "" });
      const name = icons ? "" : `<span>${esc(n)}</span>`;
      const hit = pressed && pressed.has?.(n) ? " is-match" : ""; // the one in-card match look (i2's chip); i3's red-wash .is-hit is retired
      if (as === "button") return `<li><button type="button" class="ystk${hit}" data-yf="stack:${esc(n)}" title="Filter by ${esc(n)}"${icons ? ` aria-label="${esc(n)}"` : ""}>${ico}${name}</button></li>`;
      return `<li class="ystk${hit}"${icons ? ` title="${esc(n)}"` : ""}>${ico}${name}</li>`;
    };
    const more = rest.length ? `<li class="ystk ystk--more" title="${esc(rest.join(", "))}"><span aria-hidden="true">+${rest.length}</span><span class="sr-only">and ${esc(rest.join(", "))}</span></li>` : "";
    return `<ul class="ystack${icons ? " ystack--icons" : ""}${size === "sm" ? " ystack--sm" : ""}" aria-label="${esc(label)}">${shown.map(one).join("")}${more}</ul>`;
  }
  // topic tags → thoughts page filtered by the tag (from any page)
  const tagHref = (t) => siteURL(`thoughts/stitched.html?tag=${encodeURIComponent(t)}`);
  // as: "a" (a link to Thoughts filtered by it) · "button" (a filter toggle) · "span" (i7 · C1: display-only, .is-static,
  // for a tag inside a row / card that opens something else; promoted from Studio's list rows)
  function tag(t, { as = "a", pressed = false, href } = {}) {
    const inner = `<span class="ychip__l"><span class="ytag__h" aria-hidden="true">#</span>${esc(t)}</span>`;
    if (as === "button") return `<button type="button" class="ytag ytog" data-tag="${esc(t)}" aria-pressed="${!!pressed}">${inner}</button>`;
    if (as === "span") return `<span class="ytag is-static" data-tag="${esc(t)}">${inner}</span>`;
    return `<a class="ytag" href="${href || tagHref(t)}" data-tag="${esc(t)}">${inner}</a>`;
  }
  // tags(list, { as, pressed: Set, max, tag: "ul"|"span", cls }): max folds the rest into a quiet "+n" (like stackTags);
  // tag: "span" writes a <span> line with no list items (inside a link or a button)
  function tags(list, o = {}) {
    const all = asArr(list);
    if (!all.length) return "";
    const max = o.max ?? Infinity, shown = all.slice(0, max), rest = all.slice(max), w = o.tag === "span" ? "span" : "ul";
    const one = (t) => tag(t, { ...o, pressed: o.pressed?.has?.(t) });
    const more = rest.length ? `<${w === "ul" ? "li" : "span"} class="ytag ytag--more" title="${esc(rest.join(", "))}"><span aria-hidden="true">+${rest.length}</span><span class="sr-only">and ${esc(rest.join(", "))}</span></${w === "ul" ? "li" : "span"}>` : "";
    return `<${w} class="ytags${o.cls ? ` ${o.cls}` : ""}" aria-label="Tags">${shown.map((t) => (w === "ul" ? `<li>${one(t)}</li>` : one(t))).join("")}${more}</${w}>`;
  }
  /* == i6 · projects · P2 · stack tags: the stack written like Thoughts' hashtags (.ytag), the "#" swapped for its icon ==
     Yarn.stackTags(list, { as: "button"|"a"|"span", pressed: Set, match: Set, href: (name) => url, max, label, tag: "ul"|"span" })
     button → data-yf="stack:<name>" (the kit toggles the page filter: a tap filters, a tap on an active one clears it),
       aria-pressed = the in-card match look (--y-chip) with the strike on hover / focus, exactly like a pressed hashtag.
     match → .is-match (a typed-search hit: the same look, not pressed). max → the rest fold into a quiet "+n".
     tag: "span" writes spans instead of ul/li (inside a button or a link). Shared with the opened item's stack (Yarn.stackChips). */
  function stackTags(list, { as = "button", pressed = null, match = null, href = null, max = Infinity, label = "Built with", tag: wrap = "ul" } = {}) {
    const items = asArr(list);
    if (!items.length) return "";
    const shown = items.slice(0, max), rest = items.slice(max), li = wrap === "ul" ? "li" : "span";
    const one = (n) => {
      const on = !!pressed?.has?.(n), hit = !on && match?.has?.(n) ? " is-match" : "";
      const inner = `${stackIcon(n)}<span class="ychip__l">${esc(n)}</span>`;
      if (as === "button") return `<${li}><button type="button" class="ytag ytog ytag--stk${hit}" data-yf="stack:${esc(n)}" aria-pressed="${on}">${inner}</button></${li}>`;
      if (as === "a" && href) return `<${li}><a class="ytag ytag--stk${hit}" href="${esc(href(n))}" title="Projects built with ${esc(n)}">${inner}</a></${li}>`;
      return `<${li}><span class="ytag ytag--stk is-static${on ? " is-on" : ""}${hit}">${inner}</span></${li}>`;
    };
    const more = rest.length ? `<${li} class="ytag ytag--stk ytag--more" title="${esc(rest.join(", "))}"><span aria-hidden="true">+${rest.length}</span><span class="sr-only">and ${esc(rest.join(", "))}</span></${li}>` : "";
    return `<${wrap} class="ytags ytags--stk" aria-label="${esc(label)}">${shown.map(one).join("")}${more}</${wrap}>`;
  }

  /* ============================================================
     PAGE HEADER + SEGMENTED CONTROL
     ============================================================ */
  function header({ title, meta: m = "", actions = "", level = 1, id = "" } = {}) {
    return `<header class="yhead"><div class="yhead__text"><h${level} class="yhead__title"${id ? ` id="${id}"` : ""}>${esc(title)}<span class="yhead__dot" aria-hidden="true">.</span></h${level}>${m ? `<p class="yhead__meta meta">${m}</p>` : ""}</div>${actions ? `<div class="yhead__actions">${actions}</div>` : ""}</header>`;
  }
  /* i7 · C1 · the empty state (promoted: Projects' and Music's "No projects match / Clear filters", Thoughts' "Nothing
     matches that.", Studio's three): one line in the display face, an optional second line, an optional action.
     Yarn.empty({ title, text, action: { label, icon = "ph-arrow-counter-clockwise", attrs, href }, cls, attrs, hidden })
     action without href = a small button (the page listens, e.g. data-reset); with href = a link styled the same. */
  function empty({ title = "", text = "", action = null, cls = "", attrs = "", hidden = false } = {}) {
    const a = action && action.label ? (() => {
      const ic = action.icon === "" ? "" : `<i class="ph-bold ${action.icon || "ph-arrow-counter-clockwise"}" aria-hidden="true"></i>`;
      return action.href ? `<a class="btn btn--sm" href="${esc(action.href)}"${action.attrs ? ` ${action.attrs}` : ""}>${ic}${esc(action.label)}</a>`
        : `<button type="button" class="btn btn--sm"${action.attrs ? ` ${action.attrs}` : ""}>${ic}${esc(action.label)}</button>`;
    })() : "";
    return `<div class="yempty${cls ? ` ${cls}` : ""}"${attrs ? ` ${attrs}` : ""}${hidden ? " hidden" : ""}><p class="yempty__t">${title}</p>${text ? `<p class="yempty__s">${text}</p>` : ""}${a}</div>`;
  }
  // [{ value, label, icon }] → .yseg; listen for "ychange" (detail.value) on it
  function seg(options, { value, label = "View", name = "" } = {}) {
    return `<div class="yseg" role="group" aria-label="${esc(label)}"${name ? ` data-name="${esc(name)}"` : ""}>${options.map((o) =>
      `<button type="button" class="yseg__btn ysel" data-v="${esc(o.value)}" aria-pressed="${o.value === value}">${o.icon ? `<i class="ph-bold ${o.icon}" aria-hidden="true"></i>` : ""}<span>${esc(o.label)}</span></button>`).join("")}</div>`;
  }

  /* ============================================================
     FILTER MODEL — one state shared by the filter row, Browse sheet,
     search tokens and any [data-yf="group:value"] button.
     none selected = all · tap solos · more taps add · tap selected removes
     ============================================================ */
  const KIND_GET = {
    type: (it) => it.type,
    status: (it) => status(it.status)?.key,
    stack: (it) => it.stack,
    instrument: (it) => instOfItem(it), // i9 · music · S6: a collection matches if any of its songs does (the old site's rule)
    tag: (it) => it.tags,
  };
  function valueInfo(kind, v) {
    if (v && typeof v === "object") return { value: String(v.value), label: v.label ?? String(v.value), icon: v.icon || "", img: v.img || "", iconHTML: v.iconHTML || "" };
    const s = String(v);
    if (kind === "status") { const st = status(s); return { value: st?.key || slug(s), label: st?.label || s, iconHTML: st ? (st.key === "ongoing" ? `<i class="ph-bold ph-hammer" aria-hidden="true"></i>` : `<span class="ychip__ic" aria-hidden="true">${st.icon}</span>`) : "" }; }
    if (kind === "type") { const t = type(s); return { value: t.label, label: t.label, icon: t.icon }; }
    if (kind === "instrument") { const i = instrument(s); return { value: i?.key || s, label: i?.label || s, icon: i?.icon || "" }; }
    if (kind === "stack") return { value: s, label: s, iconHTML: stackIcon(s) };
    if (kind === "tag") return { value: s, label: `#${s}`, icon: "" };
    return { value: s, label: s, icon: "" };
  }
  const iconOf = (vi) => vi.iconHTML || (vi.img ? `<img src="${vi.img}" alt="" width="16" height="16">` : vi.icon ? `<i class="ph-bold ${vi.icon}" aria-hidden="true"></i>` : "");

  function filters({ groups = [], get = {}, text, items = null, url = true, onChange } = {}) {
    const G = groups.map((g) => {
      const kind = g.kind || g.key;
      return {
        key: g.key, kind, label: g.label || g.key, row: !!g.row, param: g.param || g.key, icon: g.icon || "",
        values: (g.values || []).map((v) => valueInfo(kind, v)),
        get: get[g.key] || g.get || KIND_GET[kind] || ((it) => it[g.key]),
      };
    });
    const byKey = Object.fromEntries(G.map((g) => [g.key, g]));
    const state = Object.fromEntries(G.map((g) => [g.key, new Set()]));
    let q = "";
    const textOf = text || ((it) => [it.name, it.title, it.description, it.type, it.status, it.instrument, ...(asArr(it.stack)), ...(asArr(it.tags))].filter(Boolean).join(" "));
    const canon = (g, v) => { const n = norm(v); const hit = g.values.find((x) => norm(x.value) === n || norm(x.label) === n); return hit ? hit.value : (g.kind === "status" ? status(v)?.key : null); };
    if (url) {
      for (const g of G) for (const raw of (params.get(g.param) || "").split(",")) { const c = raw && canon(g, raw); if (c) state[g.key].add(c); }
      q = params.get("q") || "";
    }
    const subs = new Set(onChange ? [onChange] : []);
    function syncURL() {
      if (!url) return;
      const u = new URL(location.href);
      for (const g of G) state[g.key].size ? u.searchParams.set(g.param, [...state[g.key]].join(",")) : u.searchParams.delete(g.param);
      q ? u.searchParams.set("q", q) : u.searchParams.delete("q");
      history.replaceState(history.state, "", u);
    }
    function emit(src) { syncURL(); for (const fn of subs) fn(api, src); }
    function itemVals(g, it) { return asArr(g.get(it)).map(norm); }
    function test(it, { except = null, query = true } = {}) {
      for (const g of G) {
        if (g.key === except || !state[g.key].size) continue;
        const vals = itemVals(g, it);
        if (![...state[g.key]].some((v) => vals.includes(norm(v)))) return false;
      }
      if (query && q.trim()) {
        const hay = norm(textOf(it));
        if (!q.trim().split(/\s+/).every((w) => hay.includes(norm(w)))) return false;
      }
      return true;
    }
    const api = {
      groups: G, state, items,
      get q() { return q; },
      group: (k) => byKey[k],
      has: (k, v) => state[k]?.has(v) || false,
      any: () => G.some((g) => state[g.key].size) || !!q.trim(),
      anyIn: (keys) => keys.some((k) => state[k]?.size),
      toggle(k, v, force, src = "toggle") {
        const g = byKey[k]; if (!g) return false;
        const c = canon(g, v) ?? String(v);
        const on = force ?? !state[k].has(c);
        on ? state[k].add(c) : state[k].delete(c);
        emit(src);
        return on;
      },
      set(k, vals, src = "set") { state[k] = new Set(asArr(vals)); api.state[k] = state[k]; emit(src); },
      clear(k, src = "clear") { (k ? [k] : G.map((g) => g.key)).forEach((key) => state[key].clear()); if (!k) q = ""; emit(src); },
      setQuery(s, src = "query") { if (s === q) return; q = s; emit(src); },
      test,
      count(k, v) { if (!items) return null; const g = byKey[k]; return items.filter((it) => test(it, { except: k }) && itemVals(g, it).includes(norm(v))).length; },
      label(k, v) { const g = byKey[k]; return g?.values.find((x) => x.value === v)?.label ?? v; },
      info(k, v) { const g = byKey[k]; return g?.values.find((x) => x.value === v) || valueInfo(g?.kind, v); },
      on(fn) { subs.add(fn); return () => subs.delete(fn); },
      emit,
      _row: null,
    };
    filters.current = api;
    return api;
  }

  /* ---------- chip markup (filter row, Browse, tokens) ----------
     Filter chips are multi-select toggles: .ytog (fill per ?toggle=), not the single-choice rope.
     cls "ychip--row" = a full-width list row (a rail's type list). */
  function chip(g, vi, { pressed = false, count = null, cls = "", attrs = "" } = {}) {
    return `<button type="button" class="ychip ysel ytog ${cls}" data-g="${esc(g.key)}" data-v="${esc(vi.value)}" aria-pressed="${pressed}" ${attrs}>${iconOf(vi)}<span class="ychip__l">${esc(vi.label)}</span>${count != null ? `<span class="ychip__c" aria-hidden="true">${count}</span>` : ""}</button>`;
  }

  /* ============================================================
     FILTER ROW + BROWSE SHEET
     ============================================================ */
  // wrap: chips wrap onto a second line instead of scrolling (phones with ≤ ~7 chips)
  // extra: [{ label, html }] link groups shown in the Browse sheet after the filters (Thoughts: Collections, write-ups)
  function filterRow(host, F, { all = "All", browse = true, sticky = false, wrap = false, extra = [], label = "Filters", counts = false, browseLabel = "Browse" } = {}) {
    host.classList.add("yfilter");
    if (sticky) host.classList.add("yfilter--sticky");
    host.classList.toggle("yfilter--wrap", !!wrap);
    const rowGroups = F.groups.filter((g) => g.row);
    const sheetId = uid("browse");
    F._row = { host, groups: rowGroups.map((g) => g.key) };
    host.innerHTML = `
      <div class="yfilter__scroll" role="group" aria-label="${esc(label)}">
        <button type="button" class="ychip ysel ytog" data-all aria-pressed="true">${esc(all)}</button>
        ${rowGroups.map((g) => `<span class="yfilter__div" aria-hidden="true"></span><div class="yfilter__grp" role="group" aria-label="${esc(g.label)}">${g.values.map((vi) => chip(g, vi)).join("")}</div>`).join("")}
      </div>
      ${browse ? `<button type="button" class="ychip yfilter__browse" aria-expanded="false" aria-controls="${sheetId}"><i class="ph-bold ph-faders-horizontal yfilter__bi" aria-hidden="true"></i><span>${esc(browseLabel)}</span><i class="ph-bold ph-caret-down yfilter__bc" aria-hidden="true"></i><span class="ychip__n" aria-hidden="true"></span></button>
      <section class="ybrowse" id="${sheetId}" aria-label="All filters" hidden>
        ${F.groups.map((g) => `<div class="ybrowse__group" role="group" aria-labelledby="${sheetId}-${g.key}"><h3 class="ybrowse__h eyebrow" id="${sheetId}-${g.key}">${esc(g.label)}</h3><div class="ybrowse__chips">${g.values.map((vi) => chip(g, vi, { count: F.items ? 0 : null })).join("")}</div></div>`).join("")}
        ${asArr(extra).filter((x) => x && x.html).map((x, i) => `<div class="ybrowse__group ybrowse__group--links" role="group" aria-labelledby="${sheetId}-x${i}"><h3 class="ybrowse__h eyebrow" id="${sheetId}-x${i}">${esc(x.label || "More")}</h3><div class="ybrowse__links">${x.html}</div></div>`).join("")}
        <div class="ybrowse__foot"><button type="button" class="ylinkbtn" data-clear>Clear all</button><p class="meta" data-summary aria-live="polite"></p><button type="button" class="btn btn--ink btn--sm" data-done>Done</button></div>
      </section>` : ""}`;
    const scroll = $(".yfilter__scroll", host);
    const bBtn = $(".yfilter__browse", host);
    const sheet = $(".ybrowse", host);

    function paint() {
      for (const b of $$(".ychip[data-g]", host)) {
        const on = F.has(b.dataset.g, b.dataset.v);
        b.setAttribute("aria-pressed", String(on));
        if (F.items) {
          const n = F.count(b.dataset.g, b.dataset.v);
          b.classList.toggle("is-zero", n === 0);
          b.title = `${n} match${n === 1 ? "" : "es"}`;
          const c = $(".ychip__c", b); if (c) c.textContent = n;
        }
      }
      const anyGroup = F.groups.some((g) => F.state[g.key].size);
      $("[data-all]", host).setAttribute("aria-pressed", String(!anyGroup));
      if (bBtn) {
        const hiddenN = F.groups.filter((g) => !g.row).reduce((n, g) => n + F.state[g.key].size, 0);
        $(".ychip__n", bBtn).textContent = hiddenN || "";
        bBtn.setAttribute("aria-label", `${browseLabel} all filters${hiddenN ? `, ${hiddenN} more active` : ""}`);
        const total = F.groups.reduce((n, g) => n + F.state[g.key].size, 0);
        const sum = $("[data-summary]", sheet);
        if (sum) sum.textContent = F.items ? `${F.items.filter((it) => F.test(it)).length} of ${F.items.length} shown` : total ? `${total} selected` : "Nothing selected: showing all";
      }
    }
    F.on(paint);
    paint();
    // a selected chip that starts off-screen is scrolled into view
    requestAnimationFrame(() => { const on = $(".yfilter__grp .ychip[aria-pressed='true']", scroll); if (on && on.offsetLeft + on.offsetWidth > scroll.clientWidth) scroll.scrollLeft = on.offsetLeft - 24; });

    host.addEventListener("click", (e) => {
      const c = e.target.closest(".ychip[data-g], .ychip[data-all]");
      if (c) {
        if (c.hasAttribute("data-all")) { const had = F.groups.some((g) => F.state[g.key].size); F.clear(null, "row"); if (had) sound("chip-off", { el: c }); return; }
        const on = F.toggle(c.dataset.g, c.dataset.v, undefined, "row");
        sound(on ? "chip-on" : "chip-off", { el: c });
        return;
      }
      if (e.target.closest("[data-clear]")) { F.clear(null, "row"); sound("chip-off"); return; }
      if (e.target.closest("[data-done]")) { setOpen(false, true); return; }
      if (bBtn && e.target.closest(".yfilter__browse")) setOpen(sheet.hidden);
    });
    let anim = null;
    function setOpen(open, focusBack = false) {
      if (!sheet || open === !sheet.hidden) return;
      bBtn.setAttribute("aria-expanded", String(open));
      const br = bBtn.getBoundingClientRect();
      anim?.cancel();
      if (open) {
        sheet.hidden = false;
        const sr = sheet.getBoundingClientRect();
        sheet.style.setProperty("--ox", `${br.left + br.width / 2 - sr.left}px`);
        sound("open", { el: bBtn });
        if (!reduced()) { const sp = springEasing({ response: MOTION.sheet }); anim = sheet.animate([{ opacity: 0, transform: "translateY(-8px) scale(.94)" }, { opacity: 1, transform: "none" }], { duration: sp.duration, easing: sp.easing }); }
        // i6 · mobile (B1): keys land on the first chip (its ring shows); a tap or click focuses the sheet itself (no ring:
        // WebKit drew one on the script-focused chip after a tap), so Tab still starts inside it
        if (viaKey()) ($(".ychip[aria-pressed='true']", sheet) || $(".ychip", sheet))?.focus({ preventScroll: true });
        else { sheet.tabIndex = -1; sheet.focus({ preventScroll: true }); }
        document.addEventListener("pointerdown", outside, true);
      } else {
        document.removeEventListener("pointerdown", outside, true);
        sound("close", { el: bBtn });
        const done = () => { sheet.hidden = true; };
        if (reduced()) done();
        else { anim = sheet.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(-6px) scale(.96)" }], { duration: 150, easing: "cubic-bezier(.4,0,1,1)" }); anim.onfinish = done; }
        if (focusBack || sheet.contains(document.activeElement)) {
          if (viaKey()) bBtn.focus({ preventScroll: true }); // (i6 · B1: back to Browse for keys; a tap leaves no ring behind)
          else if (sheet.contains(document.activeElement)) document.activeElement.blur();
        }
      }
    }
    function outside(e) { if (!host.contains(e.target)) setOpen(false); }
    host.addEventListener("keydown", (e) => { if (e.key === "Escape" && sheet && !sheet.hidden) { e.stopPropagation(); setOpen(false, true); } });
    if (sticky) watchStuck(host);
    if (params.get("browse") === "open" && sheet) requestAnimationFrame(() => { setOpen(true); });
    return { el: host, open: () => setOpen(true), close: () => setOpen(false), paint, sheet };
  }
  // Observers tied to a rendered element. Re-renders (open/switch/close a detail, a new filter row) replace the
  // element, and an IntersectionObserver keeps its target and callback alive until disconnected, so every
  // selection used to leak its detached detail DOM. Each new observer first disconnects the ones whose element
  // has left the document: at most one stale generation is ever kept.
  const liveIO = new Set();
  function trackIO(el, io) {
    for (const r of liveIO) if (!r.el.isConnected) { r.io.disconnect(); liveIO.delete(r); }
    const rec = { el, io };
    liveIO.add(rec);
    return () => { io.disconnect(); liveIO.delete(rec); };
  }
  // add .is-stuck while a sticky element is pinned
  function watchStuck(el, { side = "top" } = {}) {
    const s = document.createElement("div");
    s.setAttribute("aria-hidden", "true");
    s.style.cssText = "height:1px;pointer-events:none;" + (side === "top" ? "margin-bottom:-1px" : "margin-top:-1px");
    side === "top" ? el.before(s) : el.after(s);
    el._ysent = s;
    const top = Math.round(parseFloat(getComputedStyle(el)[side]) || 0);
    // observe against the nearest scrolling ancestor (an item opened in a scrolling panel) or the viewport
    let root = el.parentElement;
    while (root && root !== document.body && !/(auto|scroll)/.test(getComputedStyle(root).overflowY)) root = root.parentElement;
    if (root === document.body || root === html) root = null;
    const io = new IntersectionObserver(([en]) => {
      const rb = en.rootBounds || { top: 0, bottom: innerHeight };
      if (side === "top") el.classList.toggle("is-stuck", !en.isIntersecting && en.boundingClientRect.top < rb.top + top + 2);
      else el.classList.toggle("is-stuck", !en.isIntersecting && en.boundingClientRect.top > rb.bottom - top - 2);
    }, { root, rootMargin: side === "top" ? `-${top + 1}px 0px 0px 0px` : `0px 0px -${top + 1}px 0px` });
    io.observe(s);
    const stop = trackIO(el, io);
    return () => { stop(); s.remove(); };
  }

  /* ============================================================
     SEARCH — full-width line; known terms turn into removable tokens
     ============================================================ */
  // tokens: true (default: groups that have no chip row get tokens) · false (no tokens: a page whose rail already shows
  // every group, e.g. Thoughts' split layout; a typed term lights its chip there) · (group) => bool
  function search(host, F, { placeholder = "Search", label = "Search", hint = true, tokens = true } = {}) {
    host.classList.add("ysearch");
    host.setAttribute("role", "search");
    const id = uid("search");
    host.innerHTML = `
      <i class="ph-bold ph-magnifying-glass ysearch__icon" aria-hidden="true"></i>
      <ul class="ysearch__tokens" aria-label="Active filters"></ul>
      <input class="ysearch__input" id="${id}-in" type="search" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="${id}-pop"
        placeholder="${esc(placeholder)}" aria-label="${esc(label)}" autocomplete="off" spellcheck="false" enterkeyhint="search" value="${esc(F.q)}">
      ${hint ? `<kbd class="ysearch__kbd" aria-hidden="true">/</kbd>` : ""}
      <button type="button" class="ysearch__clear" aria-label="Clear search and filters" hidden><i class="ph-bold ph-x" aria-hidden="true"></i></button>
      <ul class="ysearch__pop" id="${id}-pop" role="listbox" aria-label="Suggestions" hidden></ul>
      <p class="sr-only" aria-live="polite"></p>`;
    const input = $(".ysearch__input", host), list = $(".ysearch__tokens", host), pop = $(".ysearch__pop", host), clearBtn = $(".ysearch__clear", host), live = $("p[aria-live]", host);
    // every vocabulary term this page knows
    const TERMS = F.groups.flatMap((g) => g.values.map((vi) => ({ g, vi, n: norm(vi.label.replace(/^#/, "")), nv: norm(vi.value) })));
    // i5 · chrome (MO4, owner: "for selected idk if being in the search bar makes sense [on phones]"): in the phone slot
    // (Yarn.fab) the field holds only text; the active filters live in the floating chip row (?mactive) instead
    const tokenGroups = () => (tokens === false || host.closest(".yfab") ? [] : F.groups.filter((g) => (typeof tokens === "function" ? tokens(g) : !(g.row && F._row))));
    let opts = [], active = -1, armed = false;

    const findExact = (s) => { const n = norm(s).replace(/^#/, ""); return n ? TERMS.find((t) => t.n === n || t.nv === n) : null; };
    function suggest(s) {
      const n = norm(s).replace(/^#/, "");
      if (!n) return [];
      const score = (t) => (t.n === n ? 0 : t.n.startsWith(n) ? 1 : t.n.split(/[\s.\-/]+/).some((w) => w.startsWith(n)) ? 2 : t.n.includes(n) && n.length > 2 ? 3 : 9);
      return TERMS.filter((t) => !F.has(t.g.key, t.vi.value)).map((t) => [score(t), t]).filter(([s]) => s < 9).sort((a, b) => a[0] - b[0] || a[1].n.length - b[1].n.length).slice(0, 6).map(([, t]) => t);
    }
    function renderTokens() {
      const toks = tokenGroups().flatMap((g) => [...F.state[g.key]].map((v) => ({ g, vi: F.info(g.key, v) })));
      list.innerHTML = toks.map(({ g, vi }) => `<li>${chip(g, vi, { pressed: true, cls: "ytoken rope-in", attrs: `aria-label="Remove filter: ${esc(vi.label)} (${esc(g.label)})"` })}</li>`).join("");
      if (armed) list.lastElementChild?.querySelector(".ychip")?.classList.add("is-armed");
      const has = !!(input.value || toks.length);
      clearBtn.hidden = !has;
      host.classList.toggle("has-value", has);
    }
    function renderPop() {
      opts = suggest(input.value);
      const exact = findExact(input.value);
      if (!opts.length) { closePop(); return; }
      if (active >= opts.length) active = opts.length - 1;
      if (active < 0) active = exact && opts.includes(exact) ? opts.indexOf(exact) : 0; // Enter adds the top suggestion
      pop.innerHTML = opts.map((t, i) => `<li class="ysearch__opt" role="option" id="${id}-o${i}" aria-selected="${i === active}" data-i="${i}">${chip(t.g, t.vi, { pressed: false, attrs: 'tabindex="-1" aria-hidden="true"' })}<span class="ysearch__grp">${esc(t.g.label)}</span><span class="yhint">${i === active ? "add" : ""} <kbd>↵</kbd></span></li>`).join("") +
        `<li class="ysearch__note" role="presentation">Enter, Tab or comma turns it into a filter · keep typing to search text</li>`;
      if (pop.hidden) {
        pop.hidden = false;
        if (!reduced()) pop.animate([{ opacity: 0, transform: "translateY(-4px) scale(.98)" }, { opacity: 1, transform: "none" }], { duration: 180, easing: "cubic-bezier(.2,.8,.2,1)" });
      }
      input.setAttribute("aria-expanded", "true");
      input.setAttribute("aria-activedescendant", active >= 0 ? `${id}-o${active}` : "");
    }
    function closePop() { pop.hidden = true; active = -1; input.setAttribute("aria-expanded", "false"); input.removeAttribute("aria-activedescendant"); }
    function addTerm(t) {
      input.value = "";
      F.setQuery("", "search");
      F.toggle(t.g.key, t.vi.value, true, "search");
      sound("token-add", { el: input });
      live.textContent = `Added filter ${t.vi.label}`;
      closePop();
      if (!tokenGroups().includes(t.g)) { // a visible chip (filter row, a page rail) is the removable chip for this term: pulse it into view
        const sel = `.ychip[data-g="${CSS.escape(t.g.key)}"][data-v="${CSS.escape(t.vi.value)}"]`;
        const c = (F._row && [...F._row.host.querySelectorAll(`.yfilter__grp ${sel}`)].find(isShown)) || [...document.querySelectorAll(sel)].find((x) => !host.contains(x) && !x.closest(".ybrowse") && isShown(x));
        if (c) { c.scrollIntoView({ block: "nearest", inline: "nearest", behavior: reduced() ? "auto" : "smooth" }); c.classList.remove("is-pulse"); void c.offsetWidth; c.classList.add("is-pulse"); }
      } else {
        const tok = list.querySelector(`.ychip[data-g="${CSS.escape(t.g.key)}"][data-v="${CSS.escape(t.vi.value)}"]`);
        if (tok && !reduced()) tok.animate([{ transform: "scale(.6)", opacity: 0 }, { transform: "scale(1.08)", opacity: 1, offset: .6 }, { transform: "none" }], { duration: 320, easing: "cubic-bezier(.2,.8,.2,1)" });
      }
    }
    function removeToken(btn) {
      F.toggle(btn.dataset.g, btn.dataset.v, false, "search");
      sound("tag-remove", { el: btn });
      live.textContent = `Removed filter ${F.label(btn.dataset.g, btn.dataset.v)}`;
      input.focus({ preventScroll: true });
    }
    let qt = 0;
    input.addEventListener("input", () => {
      armed = false;
      renderTokens();
      active = -1;
      renderPop();
      clearTimeout(qt);
      qt = setTimeout(() => F.setQuery(input.value, "search"), 110);
    });
    input.addEventListener("keydown", (e) => {
      const open = !pop.hidden && opts.length;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        if (!open) { renderPop(); if (pop.hidden) return; }
        e.preventDefault();
        active = (active + (e.key === "ArrowDown" ? 1 : -1) + opts.length) % opts.length;
        renderPop();
        return;
      }
      const pickT = () => (open && active >= 0 ? opts[active] : findExact(input.value));
      if (e.key === "Enter" || e.key === "," || (e.key === "Tab" && !e.shiftKey && input.value.trim())) {
        const t = pickT();
        if (t && !F.has(t.g.key, t.vi.value)) { e.preventDefault(); addTerm(t); return; }
        if (e.key === "Enter") { e.preventDefault(); closePop(); }
        return;
      }
      if (e.key === "Escape") {
        if (open) { e.preventDefault(); e.stopPropagation(); closePop(); }
        else if (input.value) { e.preventDefault(); input.value = ""; F.setQuery("", "search"); renderTokens(); }
        return;
      }
      if (e.key === "Backspace" && !input.value) {
        const last = list.lastElementChild?.querySelector(".ychip");
        if (!last) return;
        e.preventDefault();
        if (armed) { armed = false; removeToken(last); } // second press removes
        else { armed = true; last.classList.add("is-armed"); live.textContent = `Press Backspace again to remove ${F.label(last.dataset.g, last.dataset.v)}`; }
      }
    });
    input.addEventListener("blur", () => setTimeout(() => { if (!host.contains(document.activeElement)) { closePop(); if (armed) { armed = false; renderTokens(); } } }, 120));
    input.addEventListener("focus", () => { if (input.value) renderPop(); });
    pop.addEventListener("pointerdown", (e) => e.preventDefault()); // keep focus in the input
    pop.addEventListener("click", (e) => { const o = e.target.closest(".ysearch__opt"); if (o) addTerm(opts[+o.dataset.i]); });
    list.addEventListener("click", (e) => { const b = e.target.closest(".ychip"); if (b) removeToken(b); });
    clearBtn.addEventListener("click", () => { input.value = ""; F.clear(null, "search"); sound("chip-off"); renderTokens(); input.focus(); });
    host.addEventListener("pointerdown", (e) => { if (e.target === host || e.target.classList.contains("ysearch__icon")) { e.preventDefault(); input.focus(); } });
    if (hint) {
      const onSlash = (e) => {
        if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
        const t = e.target; if (t.closest?.("input, textarea, select, [contenteditable='true']")) return;
        e.preventDefault(); input.focus(); input.select();
      };
      document.addEventListener("keydown", onSlash);
      whenGone(host, () => document.removeEventListener("keydown", onSlash)); // i9 · polish (S1): a re-rendered view (Studio) drops it
    }
    F.on((_, src) => { if (src !== "search" && input.value !== F.q) input.value = F.q; renderTokens(); });
    renderTokens();
    const sApi = { el: host, input, focus: () => input.focus(), refresh: renderTokens, typeDemo: (s) => { input.value = s; input.dispatchEvent(new Event("input")); } };
    host._ysearch = sApi; // i5: listTools re-renders the tokens when it moves the field in or out of the phone slot
    return sApi;
  }

  /* ============================================================
     FLIP — items glide to new slots, new ones grow in, leaving ones fade out
     Yarn.flip(root, "[data-key]", () => { …hide/show or re-render… }, opts)
     ============================================================ */
  const keyOf = (el) => el.dataset.key || el.dataset.id || el.dataset.slug || el.id || null;
  // Interruptible: everything is measured where it IS on screen (mid-flight springs, a growing item, a fading ghost)
  // before the mutation, and each spring keeps its velocity, so a fast second click continues from there instead of
  // snapping to the old target first. An item that comes back while its ghost is still fading returns from the ghost
  // (no pop, no pile-up); one that leaves while still growing in fades from where its grow-in had got to.
  // Glides ride `transform` (spring); grow-in / fade-out ride `scale` + `opacity`, so the two compose.
  // own(el) → true: an element the caller animates itself this time (i4: Yarn.openInPlace's growing / shrinking item).
  // flip leaves it alone (no measure, no glide, no grow-in, no ghost) and drops any glide it still had.
  // i7 fix (owner: leaving timeline rows "shift to the left and have this black dot … they should just fade"): a ghost
  // keeps its context. It's a clone placed in root (the page has usually re-rendered, the original is gone), so outside
  // its own list it lost the list's list-style (a bullet), the timeline's custom properties (--ytl-x / --ytl-gutter:
  // shifted left) and every ancestor selector. Now the ancestors between root and the item come along as empty
  // display:contents shells: no boxes (the ghost still sits in root's coordinates), but inheritance and selectors are
  // the item's own. Shells drop ids, keys, hidden and aria; their ::before / ::after are off (yarn.css).
  // ancOf: the ancestors as they are BEFORE the mutation (a filter may re-class them, e.g. a grid's year fold)
  const SHELL_SKIP = /^(id|hidden|inert|aria-.*|data-(key|id|slug))$/;
  const ancOf = (el, root) => { const out = []; for (let a = el.parentElement; a && a !== root; a = a.parentElement) out.unshift([a.tagName, [...a.attributes].filter((at) => !SHELL_SKIP.test(at.name)).map((at) => [at.name, at.value])]); return out; };
  function ghostShell(anc) {
    let top = null, cur = null;
    for (const [tag, attrs] of anc) {
      const s = document.createElement(tag);
      for (const [n, v] of attrs) s.setAttribute(n, v);
      s.style.display = "contents"; s.dataset.yghostShell = ""; s.inert = true; s.setAttribute("aria-hidden", "true");
      if (cur) cur.appendChild(s); else top = s;
      cur = s;
    }
    return { top, inner: cur };
  }
  const dropGhost = (g) => (g._yshell || g).remove();
  function flip(root, selector, mutate, { key = keyOf, response = MOTION.flip, enter = true, exit = true, stagger = MOTION.stagger, own = null } = {}) {
    if (typeof selector === "function") { mutate = selector; selector = ":scope > *"; }
    const ghosts = root._yghosts || (root._yghosts = new Map()); // key → { g, anim }
    const mine = (el) => !!own && own(el);
    const real = (el) => !el._yghost && !("yioGhost" in el.dataset) && !el.closest("[data-yghost-shell]") && isShown(el) && !mine(el);
    const growing = (el) => el._yenter && el._yenter.playState === "running";
    const now = (el) => { const cs = getComputedStyle(el); return { op: +cs.opacity, sc: parseFloat(cs.scale) || 1 }; };
    // 1 · read: on-screen rects (transforms included), before anything is touched
    const before = new Map();
    for (const el of root.querySelectorAll(selector)) {
      if (!real(el)) continue;
      const k = key(el); if (k == null) continue;
      before.set(k, { r: el.getBoundingClientRect(), el, w: el.offsetWidth, h: el.offsetHeight, anc: exit ? ancOf(el, root) : null, ...(growing(el) ? now(el) : { op: 1, sc: 1 }) });
    }
    const ghostAt = new Map();
    for (const [k, gh] of ghosts) {
      if (!gh.g.isConnected) { ghosts.delete(k); continue; }
      ghostAt.set(k, { r: gh.g.getBoundingClientRect(), ...now(gh.g), ghost: gh });
    }
    mutate();
    // 2 · write: drop every in-flight offset so the new layout can be read in one pass (springs keep their velocity)
    const after = [];
    for (const el of root.querySelectorAll(selector)) {
      if (own && mine(el)) { el._yfx?.stop(); el._yfy?.stop(); el._yenter?.cancel(); el.style.transform = ""; continue; }
      if (!real(el)) continue;
      const k = key(el); if (k == null) continue;
      if (el.style.transform) el.style.transform = "";
      after.push([k, el]);
    }
    if (reduced()) {
      for (const [, el] of after) { el._yfx?.stop(); el._yfy?.stop(); el._yenter?.cancel(); }
      for (const [, gh] of ghostAt) { gh.ghost.anim.cancel(); dropGhost(gh.ghost.g); }
      ghosts.clear();
      return;
    }
    // 3 · read: the new layout
    const rr = root.getBoundingClientRect();
    // rects are on-screen px; transforms and offsets inside a zoomed list are in its own (unzoomed) px
    const zr = zoomOf(root);
    const seen = new Set(), moves = [];
    let ei = 0;
    for (const [k, el] of after) {
      seen.add(k);
      let b = before.get(k);
      const ga = !b && ghostAt.get(k);
      if (ga) { ga.ghost.anim.cancel(); dropGhost(ga.ghost.g); ghosts.delete(k); b = ga; } // back from its ghost
      if (!b) { moves.push([el, null]); continue; }
      moves.push([el, b, el.getBoundingClientRect(), zoomOf(el)]);
    }
    // 4 · write: start / retarget the springs, grow new items in
    for (const [el, b, l, z] of moves) {
      if (!b) {
        if (!enter) continue;
        el._yenter?.cancel();
        const sp = MOTION.enter ? springEasing({ response: MOTION.enter }) : { duration: MOTION.enterMs, easing: "cubic-bezier(.2,.8,.2,1)" };
        el._yenter = el.animate([{ opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1 }], { duration: sp.duration, delay: Math.min(ei++ * stagger, MOTION.staggerMax), easing: sp.easing, fill: "backwards" });
        continue;
      }
      if (b.op < 1 || b.sc !== 1) { // mid grow-in (or back from a ghost): carry on from that opacity / size
        const sp = springEasing({ response: MOTION.enter || 0.34 });
        el._yenter?.cancel();
        el._yenter = el.animate([{ opacity: b.op, scale: b.sc }, { opacity: 1, scale: 1 }], { duration: sp.duration, easing: sp.easing });
      }
      // centres, so a scaled (growing) item lines up too
      const dx = (b.r.left + b.r.width / 2 - (l.left + l.width / 2)) / z, dy = (b.r.top + b.r.height / 2 - (l.top + l.height / 2)) / z;
      const moving = el._yfx?.moving || el._yfy?.moving;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && !moving) { el._yfx?.stop(); el._yfy?.stop(); continue; }
      const paint = () => { const x = el._yfx.value, y = el._yfy.value; el.style.transform = Math.abs(x) + Math.abs(y) < 0.01 ? "" : `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`; };
      el._yfx ||= new Spring(0, { rest: 0.3, onUpdate: paint });
      el._yfy ||= new Spring(0, { rest: 0.3, onUpdate: paint });
      // retarget: the offset is where it is on screen now; velocity is kept (a glide continues, it doesn't restart)
      el._yfx.value = dx; el._yfy.value = dy;
      if (!moving) { el._yfx.velocity = 0; el._yfy.velocity = 0; }
      paint();
      el._yfx.to(0, { response }); el._yfy.to(0, { response });
    }
    if (!exit) return;
    // 5 · leaving items: a ghost fades out in place, from wherever (and however grown-in) the item was
    for (const [k, b] of before) {
      if (seen.has(k)) continue;
      if (root.style.position !== "relative" && getComputedStyle(root).position === "static") { root._yposWas ??= root.style.position; root.style.position = "relative"; }
      b.el._yfx?.stop(); b.el._yfy?.stop(); b.el._yenter?.cancel(); b.el.style.transform = "";
      const g = b.el.cloneNode(true);
      g._yghost = true; g.dataset.yghost = "";
      g.removeAttribute("id"); g.hidden = false; g.inert = true; g.setAttribute("aria-hidden", "true");
      g.querySelectorAll("[id]").forEach((n) => n.removeAttribute("id"));
      const cx = (b.r.left + b.r.width / 2 - rr.left) / zr, cy = (b.r.top + b.r.height / 2 - rr.top) / zr;
      Object.assign(g.style, { position: "absolute", left: `${cx - b.w / 2 - root.clientLeft + root.scrollLeft}px`, top: `${cy - b.h / 2 - root.clientTop + root.scrollTop}px`, width: `${b.w}px`, height: `${b.h}px`, margin: "0", pointerEvents: "none", zIndex: "0", transform: "", gridRowEnd: "auto" });
      const sh = ghostShell(b.anc || []);
      if (sh.inner) { sh.inner.appendChild(g); g._yshell = sh.top; root.appendChild(sh.top); } else root.appendChild(g);
      const anim = g.animate([{ opacity: b.op, scale: b.sc }, { opacity: 0, scale: b.sc }], { duration: MOTION.exitMs, easing: "cubic-bezier(.4,0,.6,1)", fill: "forwards" });
      ghosts.set(k, { g, anim });
      anim.onfinish = () => {
        dropGhost(g);
        if (ghosts.get(k)?.g === g) ghosts.delete(k);
        if (!ghosts.size && root._yposWas != null) { root.style.position = root._yposWas; delete root._yposWas; }
      };
    }
    if (!ghosts.size && root._yposWas != null) { root.style.position = root._yposWas; delete root._yposWas; }
  }

  /* ============================================================
     OPEN IN PLACE (i4 · projects) — an item opens where it sits in a flowing list (grid or list)
     and closes back into it. Projects' grid uses it; Music copies it.
     const io = Yarn.openInPlace(root, { cell, flipSel, closed(key) → html, opened(key) → html,
                                        settle(cell) → scrollY | null, top() → px, onOpen(cell, key, o), onClose(cell, key, o) })
       io.open(key, { instant }) · io.close({ instant }) · io.toggle(key) · io.current · io.collapse() · io.reset()
     The cell ([data-key]) swaps its closed content for the opened content and gets .is-open (a grid spans the row).
     Neighbours glide (Yarn.flip). The opened item grows out of the card's on-screen rect: clip-path inset + translate
     on ONE spring, so the visible shape morphs rect → rect. Closing: a ghost of the panel shrinks into the card's new
     slot and cross-fades with it. Interruptible: open / close / switch / filter start from the shape that is on screen
     (a half-grown panel, a half-shrunk ghost), never from a target. Scroll is one instant jump inside the flip (flip
     measures before and after it, so nothing on screen jumps), never a smooth scroll racing the morph.
     ============================================================ */
  function openInPlace(root, { cell: cellSel = "[data-key]", flipSel = "[data-key]", closed, opened, settle = null, top = () => 16, onOpen = null, onClose = null, response = MOTION.panel } = {}) {
    let cur = null;
    const morph = new Map();  // key → { el, sp, ins, rad } (a growing panel)
    const ghosts = new Map(); // key → { g, sp, ins, rad, cell } (a shrinking panel ghost)
    const L = (a, b, p) => a + (b - a) * p;
    const cellOf = (k) => [...root.querySelectorAll(cellSel)].find((c) => c.dataset.key === k && !("yioGhost" in c.dataset)) || null;
    const rectOf = (r) => ({ left: r.left, top: r.top, right: r.right, bottom: r.bottom });
    const visible = (el, ins) => { const r = el.getBoundingClientRect(); return ins ? { left: r.left + ins.l, top: r.top + ins.t, right: r.right - ins.r, bottom: r.bottom - ins.b } : rectOf(r); };
    const radiusOf = (el) => parseFloat(getComputedStyle(el.firstElementChild || el).borderTopLeftRadius) || 16;
    // the translate that brings rect a inside box b (per axis; 0 when it already fits)
    const shift = (a, b) => ({ x: a.left < b.left ? a.left - b.left : a.right > b.right ? a.right - b.right : 0, y: a.top < b.top ? a.top - b.top : a.bottom > b.bottom ? a.bottom - b.bottom : 0 });
    const strip = (el) => { el.style.translate = ""; el.style.clipPath = ""; el.style.zIndex = ""; };
    // one spring drives the visible rect (from → to), the translate (t0 → t1) and the corner radius
    function run(el, box, from, to, t0, t1, r0, r1, { shadow = 0, fade = null, done = null } = {}) {
      const st = { el, sp: new Spring(0, { response, rest: 0.002 }), ins: { t: 0, r: 0, b: 0, l: 0 }, rad: r0 };
      st.sp.onUpdate = (p) => {
        const tx = L(t0.x, t1.x, p), ty = L(t0.y, t1.y, p);
        const ins = { t: Math.max(0, L(from.top, to.top, p) - (box.top + ty)), r: Math.max(0, box.right + tx - L(from.right, to.right, p)),
          b: Math.max(0, box.bottom + ty - L(from.bottom, to.bottom, p)), l: Math.max(0, L(from.left, to.left, p) - (box.left + tx)) };
        const m = shadow * p; // the panel's shadow comes in with it
        st.ins = ins; st.rad = L(r0, r1, p);
        el.style.translate = Math.abs(tx) + Math.abs(ty) < 0.05 ? "" : `${tx.toFixed(2)}px ${ty.toFixed(2)}px`;
        el.style.clipPath = `inset(${(ins.t - m).toFixed(1)}px ${(ins.r - m).toFixed(1)}px ${(ins.b - m).toFixed(1)}px ${(ins.l - m).toFixed(1)}px round ${st.rad.toFixed(1)}px)`;
        fade?.(p);
      };
      st.sp.onUpdate(0);
      st.sp.to(1, { onRest: () => done?.() });
      return st;
    }
    function dropGhost(k) {
      const gh = ghosts.get(k); if (!gh) return;
      gh.sp.stop(); gh.g.remove(); gh.cell.style.opacity = ""; ghosts.delete(k);
    }
    function ensurePos() { if (getComputedStyle(root).position === "static") root.style.position = "relative"; }
    function place(g, r) { // an absolute clone at on-screen rect r (root-relative)
      const rr = root.getBoundingClientRect();
      g.dataset.yioGhost = ""; g.inert = true; g.setAttribute("aria-hidden", "true"); g.removeAttribute("id");
      g.querySelectorAll("[id]").forEach((n) => n.removeAttribute("id"));
      Object.assign(g.style, { position: "absolute", left: `${r.left - rr.left - root.clientLeft + root.scrollLeft}px`, top: `${r.top - rr.top - root.clientTop + root.scrollTop}px`,
        width: `${r.right - r.left}px`, height: `${r.bottom - r.top}px`, margin: "0", gridArea: "auto", pointerEvents: "none", transform: "", translate: "", clipPath: "", opacity: "", zIndex: "4" });
      root.appendChild(g);
      return g;
    }
    // the open item as it is on screen right now (mid-grow included), so a close can continue from it
    function capture(k) {
      const el = cellOf(k); if (!el) return null;
      const m = morph.get(k), moving = !!m?.sp.moving;
      const cap = { k, el, P: el.getBoundingClientRect(), ins: moving ? m.ins : { t: 0, r: 0, b: 0, l: 0 }, rad: moving ? m.rad : radiusOf(el), g: el.cloneNode(true) };
      m?.sp.stop(); morph.delete(k);
      return cap;
    }
    function swapClosed(k) {
      const el = cellOf(k); if (!el) return null;
      morph.get(k)?.sp.stop(); morph.delete(k);
      el.innerHTML = closed(k); el.classList.remove("is-open"); strip(el);
      if (cur === k) cur = null;
      return el;
    }
    function settleOwn(el) { el._yfx?.stop(); el._yfy?.stop(); el.style.transform = ""; strip(el); }
    // the opened content (faded on its own so the sheet can morph first): the detail shell, else the cell's child
    const contentOf = (el) => el.querySelector(".ydetail") || el.firstElementChild;
    function grow(el, from, r0, cardGhost) {
      const k = el.dataset.key;
      const B = rectOf(el.getBoundingClientRect());
      const inner = contentOf(el);
      el.style.zIndex = "3";
      const done = () => { strip(el); morph.delete(k); cardGhost?.remove(); if (inner) inner.style.opacity = ""; };
      // the sheet morphs card → panel; the closed card rides its top-left and fades out (first 30%), and the
      // opened content fades in once there's room for it (25–70%), so half-clipped text never shows
      const st = run(el, B, from, B, shift(from, B), { x: 0, y: 0 }, r0, radiusOf(el), { shadow: 44, done, fade: (p) => {
        if (inner) inner.style.opacity = String(clamp((p - 0.25) / 0.45, 0, 1));
        if (!cardGhost?.isConnected) return;
        cardGhost.style.translate = `${(L(from.left, B.left, p) - from.left).toFixed(1)}px ${(L(from.top, B.top, p) - from.top).toFixed(1)}px`;
        cardGhost.style.opacity = String(clamp(1 - p / 0.3, 0, 1));
        if (p > 0.3) cardGhost.remove();
      } });
      morph.set(k, st);
    }
    function shrink(cap) {
      const { k, el, P, ins, g } = cap;
      if (!isShown(el)) return;
      ensurePos();
      place(g, rectOf(P));
      g.classList.add("is-closing");
      const C = visible(el), from = { left: P.left + ins.l, top: P.top + ins.t, right: P.right - ins.r, bottom: P.bottom - ins.b };
      const gIn = contentOf(g), op0 = gIn ? +(gIn.style.opacity || 1) : 1;
      el.style.opacity = "0";
      // mirror of grow: the content leaves first (from wherever its fade had got to), the sheet shrinks into the
      // card's slot, and the card fades in under it as the shapes meet
      const st = run(g, rectOf(P), from, C, { x: 0, y: 0 }, shift(C, P), cap.rad, radiusOf(el), {
        fade: (q) => {
          if (gIn) gIn.style.opacity = String(clamp(op0 * (1 - q / 0.3), 0, 1));
          g.style.opacity = String(clamp(1 - (q - 0.55) / 0.4, 0, 1));
          el.style.opacity = String(clamp((q - 0.35) / 0.45, 0, 1));
        },
        done: () => dropGhost(k),
      });
      st.g = g; st.cell = el; // the live state (its .ins / .rad update every frame), so a re-open starts from it
      ghosts.set(k, st);
    }
    function open(k, { instant = false } = {}) {
      if (k === cur) return cellOf(k);
      const el = cellOf(k); if (!el || !isShown(el)) return null;
      const quick = instant || reduced();
      const gh = ghosts.get(k);
      // where the item is on screen now: its card, or (re-opened mid-close) the shrinking ghost
      const from = gh ? visible(gh.g, gh.ins) : visible(el);
      const r0 = gh ? gh.rad : radiusOf(el);
      const prev = cur != null && cur !== k ? cur : null;
      const cap = prev != null && !quick ? capture(prev) : null;
      let cardGhost = null;
      if (gh) dropGhost(k);
      else if (!quick) { cardGhost = el.cloneNode(true); }
      const mutate = () => {
        if (prev != null) swapClosed(prev);
        settleOwn(el);
        el.innerHTML = opened(k); el.classList.add("is-open");
        cur = k;
        const y = settle?.(el);
        if (y != null && Math.abs(y - scrollY) > 1) scrollTo({ top: y, behavior: "instant" });
      };
      if (quick) { mutate(); onOpen?.(el, k, { instant: true }); return el; }
      flip(root, flipSel, mutate, { own: (x) => x === el || (cap && x === cap.el) });
      if (cap) shrink(cap);
      if (cardGhost) { ensurePos(); place(cardGhost, from); cardGhost.style.zIndex = "5"; }
      grow(el, from, r0, cardGhost);
      onOpen?.(el, k, { instant: false });
      return el;
    }
    function close({ instant = false } = {}) {
      const k = cur; if (k == null) return null;
      const el = cellOf(k); if (!el) { cur = null; return null; }
      if (instant || reduced()) { swapClosed(k); onClose?.(el, k, { instant: true }); return el; }
      const cap = capture(k);
      flip(root, flipSel, () => {
        swapClosed(k);
        settleOwn(el);
        // the card lands where the panel's top was (kept on screen)
        const t = el.getBoundingClientRect().top, want = clamp(cap.P.top, top(), Math.max(top(), innerHeight - 180));
        if (Math.abs(t - want) > 1) scrollBy({ top: t - want, behavior: "instant" });
      }, { own: (x) => x === el });
      shrink(cap);
      onClose?.(el, k, { instant: false });
      return el;
    }
    // filtering hid the open item: swap it back quietly (it is already fading out as a flip ghost)
    function collapse() { const k = cur; if (k == null) return; swapClosed(k); }
    function reset() { for (const m of morph.values()) m.sp.stop(); morph.clear(); for (const k of [...ghosts.keys()]) dropGhost(k); cur = null; }
    return { open, close, collapse, reset, toggle: (k) => (k === cur ? close() : open(k)), get current() { return cur; } };
  }

  /* ============================================================
     YEAR PILL + TIMELINE (+ travelling yarn ball)
     ============================================================ */
  // attrs: extra raw attributes (e.g. `data-key="m:2026-11"` so the pill takes part in Yarn.flip)
  // rule: true → .yyear--rule, the pill + a dashed line running across its column (i1's month marks).
  // The line belongs to the pill (it glides with it in Yarn.flip) and steps away while the pill is stuck.
  const yearPill = (year, { count = null, unit = "item", id = "", level = 2, attrs = "", cls = "", rule = false } = {}) =>
    `<h${level} class="yyear${rule ? " yyear--rule" : ""}${cls ? ` ${cls}` : ""}"${id ? ` id="${id}"` : ""}${attrs ? ` ${attrs}` : ""}>${esc(year)}${count != null ? `<span class="yyear__n">${count} ${unit}${count === 1 ? "" : "s"}</span>` : ""}</h${level}>`;
  // the rule runs from the pill to the right edge of the pill's parent (its column): width in --yrule
  function sizeRule(p) {
    let host = p.parentElement;
    while (host && getComputedStyle(host).display === "contents") host = host.parentElement; // i6 · P4: a folded group has no box
    if (!host || !p.isConnected) return;
    const w = p.offsetParent === host ? host.clientWidth - p.offsetLeft - p.offsetWidth : host.getBoundingClientRect().right - p.getBoundingClientRect().right;
    p.style.setProperty("--yrule", `${Math.max(0, Math.round(w - 12))}px`);
  }
  const ruleRO = new ResizeObserver((es) => es.forEach((e) => {
    if (e.target.classList.contains("yyear--rule")) sizeRule(e.target);
    else e.target.querySelectorAll(":scope > .yyear--rule").forEach(sizeRule);
  }));
  // [{ year, items }] newest first
  function byYear(items, getDate = (it) => it.start || it.date) {
    const out = [];
    for (const it of items) {
      const y = (parseDate(getDate(it)) || new Date()).getFullYear();
      let g = out.find((x) => x.year === y);
      if (!g) out.push((g = { year: y, items: [] }));
      g.items.push(it);
    }
    return out.sort((a, b) => b.year - a.year);
  }
  // groups → markup; render(item) returns the item's content; key(item) its data-key
  // i4: rule → ruled year pills (.yyear--rule, same as Thoughts' month marks); pillKeys → data-key="y-<year>" on each
  // pill so it glides in Yarn.flip; data-year on each group so filterGroups / yearRail can find it.
  function timelineHTML(groups, render, { key = (it) => slug(it.name || it.title || it.id), unit = "item", id = uid("tl"), cls = "", rule = false, pillKeys = false } = {}) {
    return `<div class="ytl${cls ? ` ${cls}` : ""}" data-ytl>${groups.map((g) => `<section class="ytl__group" data-year="${esc(g.year)}" aria-labelledby="${id}-${g.year}">${yearPill(g.year, { count: g.items.length, unit, id: `${id}-${g.year}`, rule, attrs: pillKeys ? `data-key="y-${esc(g.year)}"` : "" })}<ol class="ytl__list">${g.items.map((it) =>
      `<li class="ytl__item" data-key="${esc(key(it))}"><span class="ytl__knot" aria-hidden="true"></span>${render(it)}</li>`).join("")}</ol></section>`).join("")}</div>`;
  }
  /* YEAR GROUPS (i4 · projects; Music copies it) — the plain sibling of the timeline: a ruled year pill over a list or a grid.
     Yarn.yearGroupsHTML(groups, render, { key, unit, id, cls, grid, rule, level })
       → .ygroups > section.ygroup[data-year] > (h2.yyear.yyear--rule[data-key="y-…"]) + ol.ygroup__list(.ygroup__list--grid) > li.ygroup__item[data-key]
     Yarn.filterGroups(root, test(key, el) → bool, { unit }) hides items + empty years, rewrites the pill counts → shown count.
     Run it inside Yarn.flip(root, "[data-key]", …) so items and pills glide. */
  function yearGroupsHTML(groups, render, { key = (it) => slug(it.name || it.title || it.id), unit = "item", id = uid("yg"), cls = "", grid = false, rule = true, level = 2 } = {}) {
    return `<div class="ygroups${grid ? " ygroups--grid" : ""}${cls ? ` ${cls}` : ""}">${groups.map((g) => `<section class="ygroup" data-year="${esc(g.year)}" aria-labelledby="${id}-${g.year}">${yearPill(g.year, { count: g.items.length, unit, id: `${id}-${g.year}`, level, rule, attrs: `data-key="y-${esc(g.year)}"` })}<ol class="ygroup__list${grid ? " ygroup__list--grid" : ""}">${g.items.map((it) =>
      `<li class="ygroup__item" data-key="${esc(key(it))}" data-y="${esc(g.year)}">${render(it)}</li>`).join("")}</ol></section>`).join("")}</div>`;
  }
  function filterGroups(root, test, { item = ".ygroup__item, .ytl__item", group = ".ygroup, .ytl__group", unit = "item" } = {}) {
    let n = 0;
    for (const el of root.querySelectorAll(item)) {
      if (el._yghost || "yioGhost" in el.dataset) continue;
      const on = !!test(el.dataset.key, el);
      el.hidden = !on;
      if (on) n++;
    }
    for (const g of root.querySelectorAll(group)) {
      const c = [...g.querySelectorAll(item)].filter((x) => !x.hidden && !x._yghost && !("yioGhost" in x.dataset)).length;
      g.hidden = !c;
      const t = $(".yyear__n", g);
      if (t) t.textContent = `${c} ${unit}${c === 1 ? "" : "s"}`;
    }
    return n;
  }
  /* == i6 · projects · P4 · a grid's year dividers while a search / filter is on (?gridyears=fold|flow|label|rule) ==
     Yarn.gridYears(root, { on, byYear, mode, unit, small }) — call it right after Yarn.filterGroups, inside the same
     Yarn.flip callback, so cards and pills glide. on = a search or filter is active · byYear = the search names a year
     (or a year filter is on): the dividers stay, in every mode. With one year left the divider stays too.
       fold  a year with ≤ small (2) results has no divider of its own: it shares the one before it (at the top, the
             one after it), one grid, the pill reads the range ("2024 – 2025 · 4 projects"). A divider stays only between
             two years that both have more. The shared pill doesn't stick (it would ride the rest of the list).
       flow  no dividers: every result in one grid, newest first (the card's date says the year)
       label flow + a small year label sewn on each card's top edge (.ygroup__item::before, from data-y)
       rule  i5: a divider per year, always
     The grid (.ygroups--grid) becomes one grid (--ygroup-cols) and a flattened group is display: contents, so the
     cells of several years share rows. An open item (.is-open) still spans the row. */
  function gridYears(root, { on = false, byYear = false, mode = OPT.gridyears, unit = "item", small = 2 } = {}) {
    const host = root.matches?.(".ygroups--grid") ? root : root.querySelector(".ygroups--grid");
    if (!host) return;
    const groups = [...host.children].filter((g) => g.classList.contains("ygroup"));
    const shown = groups.filter((g) => !g.hidden);
    const act = on && !byYear && mode !== "rule" && shown.length > 1;
    host.classList.toggle("is-yflat", act && (mode === "flow" || mode === "label"));
    host.classList.toggle("is-ylabel", act && mode === "label");
    host.classList.toggle("is-yfold", act && mode === "fold");
    const cnt = (g) => [...g.querySelectorAll(".ygroup__item")].filter((x) => !x.hidden && !x._yghost && !("yioGhost" in x.dataset)).length;
    for (const g of groups) {
      g.classList.remove("is-fold", "is-fold-head");
      const pill = g.querySelector(":scope > .yyear");
      if (pill?.firstChild?.nodeType === 3 && pill.firstChild.nodeValue !== g.dataset.year) pill.firstChild.nodeValue = g.dataset.year;
    }
    if (!(act && mode === "fold")) return;
    // a year with ≤ small results never opens a section: it joins the one before it (at the top, the one after it).
    // So a divider stays only between two years that both have more; "2025: 1 · 2024: 3" → one "2024 – 2025" section.
    const secs = [];
    let cur = [], big = false;
    for (const g of shown) {
      const isBig = cnt(g) > small;
      if (isBig && big) { secs.push(cur); cur = []; big = false; }
      cur.push(g);
      big = big || isBig;
    }
    if (cur.length) secs.push(cur);
    for (const run of secs) {
      if (run.length < 2) continue;
      run.forEach((g) => g.classList.add("is-fold"));
      const head = run[0], pill = head.querySelector(":scope > .yyear"), ys = run.map((g) => g.dataset.year).sort();
      head.classList.add("is-fold-head");
      if (pill?.firstChild?.nodeType === 3) pill.firstChild.nodeValue = `${ys[0]} – ${ys[ys.length - 1]}`;
      const n = run.reduce((a, g) => a + cnt(g), 0), t = pill && $(".yyear__n", pill);
      if (t) t.textContent = `${n} ${unit}${n === 1 ? "" : "s"}`;
    }
  }
  const BALL = `<svg viewBox="0 0 26 26" aria-hidden="true"><circle cx="13" cy="13" r="11.6" fill="#d62f38" stroke="#9e1822" stroke-width="1.2"/>
    <g fill="none" stroke-linecap="round"><g stroke="#9e1822" stroke-width="1.15"><path d="M3.4 9.2C8.2 6.3 15.6 6.2 22.4 9.6"/><path d="M2.3 14.1C8.1 10.6 17 10.6 23.6 14.6"/><path d="M3.7 18.9C9.2 15.4 16.8 15.6 21.9 19.6"/><path d="M9.3 2.6C6.4 8.6 6.8 17.2 10.4 23.7"/></g>
    <g stroke="#fff" stroke-opacity=".42" stroke-width=".9"><path d="M4.6 11.3C9.2 8.4 15.4 8.3 21.6 11.7"/><path d="M15.6 2.6C19.2 8 19.4 16 16.4 23.5"/></g></g>
    <circle cx="9" cy="8" r="2.6" fill="#fff" fill-opacity=".22"/></svg>`;
  // i5 · projects (P3.1) passed: true → knots the ball has rolled past get .is-passed (open red rings, .ytl--passed).
  // The knots' y's are read on select / refresh / resize only; while the ball rolls, paint() just compares numbers
  // and flips a class when the ball crosses a knot (no layout per frame).
  /* i6 fix (review P2-5: a row whose facts wrapped was taller than every other): a timeline's card facts stay on one
     line. When any row's facts would wrap, the whole timeline shows each status as its disc (its word in the kit hint
     and for screen readers: .is-factfit1); if one still wraps, a range across years in short (.is-factfit2, i7), then
     the type / instrument as its disc too (.is-factfit3, i7; was step 2). Per timeline,
     so its rows read alike. Three layouts per fit (reset · step 1 · step 2); refit when the timeline's width or its
     visible rows change (ResizeObserver) and once fonts are in. */
  // (lines beyond the first, over every visible row; a step that can't lower it isn't taken: words stay)
  const factExtra = (ms) => ms.reduce((n, m) => { const tops = []; for (const f of m.querySelectorAll(".yfact")) { const t = f.getBoundingClientRect().top; if (!tops.some((x) => Math.abs(x - t) < 4)) tops.push(t); } return n + Math.max(0, tops.length - 1); }, 0);
  // i7 · projects: step 2 is now the short range across years ("Dec ’22 – Jan ’23", cardMeta) and step 3 the type /
  // instrument word, so a list keeps its type words as long as it can (Decided: small cards keep the type word).
  // The same fit runs on any list of cards: Yarn.fitFacts(el) (Projects' grid + phone list), .yfactfit
  const FACTFIT = ["is-factfit1", "is-factfit2", "is-factfit3"];
  function fitFacts(tl) {
    if (!tl.isConnected) return;
    tl.classList.remove(...FACTFIT);
    const ms = $$(".ymeta--facts", tl).filter((m) => m.getClientRects().length);
    tl._yff = `${tl.clientWidth}:${ms.length}`;
    let best = 0, bestX = factExtra(ms);
    const max = tl._yffMax || FACTFIT.length; // i7: a touch list stops before step 3 (no hover to name a disc): it wraps
    for (let s = 1; s <= max && bestX > 0; s++) { tl.classList.add(FACTFIT[s - 1]); const x = factExtra(ms); if (x < bestX) { best = s; bestX = x; } }
    for (let s = FACTFIT.length; s > best; s--) tl.classList.remove(FACTFIT[s - 1]);
  }
  let ffRaf = 0;
  const ffQ = new Set();
  const factRO = typeof ResizeObserver === "function" ? new ResizeObserver((ents) => {
    for (const en of ents) { const tl = en.target; if (!tl.isConnected) { factRO.unobserve(tl); continue; } const n = $$(".ymeta--facts", tl).filter((m) => m.getClientRects().length).length; if (tl._yff !== `${tl.clientWidth}:${n}`) ffQ.add(tl); }
    if (ffQ.size && !ffRaf) ffRaf = requestAnimationFrame(() => { ffRaf = 0; for (const tl of ffQ) fitFacts(tl); ffQ.clear(); });
  }) : null;
  document.fonts?.ready?.then(() => { for (const tl of $$(".ytl, .yfactfit")) fitFacts(tl); });
  // i7 fix: fonts.ready can resolve before a page's fonts start loading (nothing had asked for them yet), so a list fitted
  // with fallback metrics kept its step; refit every list whenever fonts finish loading
  document.fonts?.addEventListener?.("loadingdone", () => {
    for (const tl of $$(".ytl, .yfactfit")) ffQ.add(tl);
    if (ffQ.size && !ffRaf) ffRaf = requestAnimationFrame(() => { ffRaf = 0; for (const tl of ffQ) fitFacts(tl); ffQ.clear(); });
  });
  // Yarn.fitFacts(el, { max }) · max: the last step a list may take (2 = never hide the type word; phones)
  function fitFactsOn(el, { max = 0 } = {}) { if (!el) return; el.classList.add("yfactfit"); el._yffMax = max; factRO?.observe(el); fitFacts(el); }
  function timeline(root, { ball = true, trail = true, response = 0.5, damping = 1, passed = false } = {}) {
    root.classList.add("ytl");
    root.classList.toggle("ytl--passed", !!passed);
    factRO?.observe(root); fitFacts(root); // i6 fix (P2-5)
    let ballEl = $(":scope > .ytl__ball", root), trailEl = $(":scope > .ytl__trail", root);
    if (ball && !ballEl) { ballEl = document.createElement("span"); ballEl.className = "ytl__ball"; ballEl.setAttribute("aria-hidden", "true"); ballEl.innerHTML = BALL; ballEl.hidden = true; root.appendChild(ballEl); }
    if (ball && trail && !trailEl) { trailEl = document.createElement("span"); trailEl.className = "ytl__trail"; trailEl.setAttribute("aria-hidden", "true"); trailEl.hidden = true; root.prepend(trailEl); }
    let cur = null, placed = false, knots = [];
    const passTo = (y) => { for (const k of knots) { const on = k.y < y - 4; if (on !== k.on) { k.on = on; k.el.classList.toggle("is-passed", on); } } };
    const measureKnots = () => {
      if (!passed) return;
      const shown = cur ? $$(".ytl__item", root).filter(isShown) : [];
      const keep = new Set(shown);
      for (const k of knots) if (!keep.has(k.el) && k.on) k.el.classList.remove("is-passed");
      knots = shown.map((el) => ({ el, y: knotY(el), on: el.classList.contains("is-passed") }));
    };
    const paint = (y) => {
      if (ballEl) ballEl.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0) rotate(${((y / 12) * 57.3).toFixed(1)}deg)`;
      if (trailEl) trailEl.style.transform = `scaleY(${Math.max(0, y - 18).toFixed(2)})`;
      if (passed) passTo(y);
    };
    const sy = new Spring(0, { response, damping, rest: 0.2, onUpdate: paint });
    const itemOf = (k) => (k instanceof Element ? k.closest(".ytl__item") : root.querySelector(`.ytl__item[data-key="${CSS.escape(k)}"]`));
    // the knot's LAYOUT position (offsetTop chain up to the timeline). getBoundingClientRect would include a FLIP
    // transform still in flight after a filter, so the ball used to settle beside the wrong row.
    function knotY(item) {
      const k = $(".ytl__knot", item) || item;
      let y = 0, n = k;
      while (n && n !== root && n instanceof HTMLElement) { y += n.offsetTop; n = n.offsetParent; }
      if (n === root) return y + root.clientTop + k.offsetHeight / 2;
      const r = k.getBoundingClientRect(), rr = root.getBoundingClientRect(); // fallback: a static/odd offsetParent chain
      return r.top - rr.top + r.height / 2;
    }
    function select(k, { instant = false } = {}) {
      const item = k == null ? null : itemOf(k);
      cur = item && isShown(item) ? item : null;
      $$(".ytl__item", root).forEach((i) => i.classList.toggle("is-current", i === cur));
      measureKnots();
      if (!cur) { if (ballEl) ballEl.hidden = true; if (trailEl) trailEl.hidden = true; placed = false; return null; }
      if (ballEl) ballEl.hidden = false;
      if (trailEl) trailEl.hidden = false;
      const y = knotY(cur);
      if (!placed || instant) { sy.jump(y); placed = true; } else sy.to(y);
      if (passed && sy.moving) passTo(sy.value); // re-measured knots, same ball: settle their state now, not at the next frame
      return cur;
    }
    const refresh = ({ instant = true } = {}) => { if (cur) select(cur, { instant }); else if (placed) select(null); };
    // layout moved under the ball (fonts landing, images, filtering): settle on the knot's new spot.
    // Mid-roll it retargets the same spring (keeps its velocity) instead of finishing at the stale y.
    const follow = () => {
      if (!cur || !placed) return;
      measureKnots(); // i5: knots above / below moved too (filtering, fonts)
      const y = knotY(cur);
      if (sy.moving) { if (Math.abs(sy.target - y) > 0.5) sy.to(y); }
      else if (Math.abs(sy.value - y) > 0.5) sy.jump(y);
      if (passed) passTo(sy.value);
    };
    const ro = new ResizeObserver(follow);
    ro.observe(root);
    const onFonts = () => requestAnimationFrame(follow);
    document.fonts?.addEventListener?.("loadingdone", onFonts);
    const destroy = () => { ro.disconnect(); factRO?.unobserve(root); document.fonts?.removeEventListener?.("loadingdone", onFonts); };
    whenGone(root, destroy); // i9 · polish (S1): a timeline whose view is thrown away (Studio re-renders) lets go by itself
    return { el: root, select, refresh, get current() { return cur?.dataset.key ?? null; }, destroy };
  }

  /* ============================================================
     STRAND — i1's "strung together" timeline, horizontal: points sit on a red
     yarn at their real date (distance = time between them, with a minimum gap);
     labels that would collide drop to a second lane on a leader. Month ticks
     above the yarn make the spacing readable.
     Yarn.strand(host, items, { date, label, key, href, caption, min, ball }) → { el, layout(), select(key, { instant }) }
     A click / Enter on a point dispatches "ystrand" on host (detail.key); the page scrolls + highlights.
     i5 (T2.1): ball (default true) = the timelines' rolling yarn ball: the same BALL art, spring and roll (distance /
     radius) as Yarn.timeline, along x. It sits on the newest point and rolls to the one you pick, unrolling the red
     yarn behind it; the strand ahead of it is the dashed thread and its knots wait grey (.is-ahead).
     ============================================================ */
  function strand(host, items, { date = (it) => it.date, label = (it) => it.name || it.title || "", key = (it) => it.id, href = (it) => `#${key(it)}`, caption = "Strung together from the feed", min = 34, ball = true } = {}) {
    const list = items.map((it) => ({ it, k: String(key(it)), d: parseDate(date(it)) })).filter((x) => x.d).sort((a, b) => a.d - b.d);
    host.classList.add("ystrand");
    host.innerHTML = `${caption ? `<p class="eyebrow ystrand__cap">${esc(caption)}</p>` : ""}
      <div class="ystrand__rail"><div class="ystrand__ticks" aria-hidden="true"></div>
        ${ball ? `<span class="ystrand__trail" aria-hidden="true"><span></span></span>` : ""}
        <ol class="ystrand__line" aria-label="${esc(caption || "Timeline")}, oldest first">${list.map((x) => `<li class="ystrand__pt" data-key="${esc(x.k)}"><a class="ystrand__a" href="${esc(href(x.it))}" aria-current="false"><span class="ystrand__knot" aria-hidden="true"></span><span class="ystrand__lab"><b>${esc(label(x.it))}</b><time class="meta" datetime="${esc(String(date(x.it)))}">${fmt.day(x.d)}</time></span></a></li>`).join("")}</ol>
        ${ball ? `<span class="ytl__ball ystrand__ball" aria-hidden="true">${BALL}</span>` : ""}
      </div>`;
    const line = $(".ystrand__line", host), ticks = $(".ystrand__ticks", host), pts = $$(".ystrand__pt", host);
    // the ball (i5): one spring on x; the red yarn is revealed (not stretched) up to the ball by two opposite
    // translates, so its twist stays put; knots past the ball wait grey. Transform-only per frame.
    const ballEl = $(".ystrand__ball", host), trailEl = $(".ystrand__trail", host), yarnEl = trailEl?.firstElementChild;
    let xs = [], tw = 0, cur = list.length - 1, placed = false;
    const ahead = pts.map(() => false);
    const paint = (x) => {
      if (!ballEl) return;
      ballEl.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0) rotate(${((x / 12) * 57.3).toFixed(1)}deg)`;
      const t = clamp(x + 6, 0, tw);
      trailEl.style.transform = `translate3d(${(t - tw).toFixed(2)}px, 0, 0)`;
      yarnEl.style.transform = `translate3d(${(tw - t).toFixed(2)}px, 0, 0)`;
      pts.forEach((li, i) => { const a = xs[i] > x + 4; if (a !== ahead[i]) { ahead[i] = a; li.classList.toggle("is-ahead", a); } });
    };
    const sx = new Spring(0, { response: 0.5, damping: 1, rest: 0.2, onUpdate: paint });
    const roll = (instant) => {
      if (!ballEl || !xs.length || cur < 0) return;
      if (!placed || instant) { sx.jump(xs[cur]); placed = true; } else sx.to(xs[cur]);
    };
    function layout() {
      const W = line.clientWidth;
      if (!W || !list.length) return;
      const pad = 10, lo = +list[0].d, hi = +list.at(-1).d, span = hi - lo, inner = W - 2 * pad;
      const X = (t) => (span ? pad + ((t - lo) / span) * inner : W / 2);
      xs = list.map((x) => X(+x.d));
      // a minimum gap so close dates stay apart (spread forward, then pull back inside the right edge)
      const g = Math.min(min, inner / Math.max(1, list.length - 1));
      for (let i = 1; i < xs.length; i++) xs[i] = Math.max(xs[i], xs[i - 1] + g);
      if (xs.at(-1) > W - pad) { xs[xs.length - 1] = W - pad; for (let i = xs.length - 2; i >= 0; i--) xs[i] = Math.min(xs[i], xs[i + 1] - g); }
      // labels: lane 0 under the yarn; a label that would overlap the one before it drops to lane 1 (on a leader)
      const ends = [-Infinity, -Infinity];
      pts.forEach((li, i) => {
        li.style.setProperty("--x", `${xs[i].toFixed(1)}px`);
        const lw = $(".ystrand__lab", li).offsetWidth;
        const left = clamp(xs[i] - lw / 2, 0, Math.max(0, W - lw));
        const lane = ends[0] + 10 <= left ? 0 : ends[1] + 10 <= left ? 1 : ends[0] <= ends[1] ? 0 : 1;
        ends[lane] = left + lw;
        li.dataset.lane = String(lane);
        li.style.setProperty("--lx", `${(left - (xs[i] - lw / 2)).toFixed(1)}px`);
      });
      host.classList.toggle("has-lane2", pts.some((li) => li.dataset.lane === "1"));
      // month ticks (the first of each month inside the span)
      const out = [];
      if (span) for (let d = new Date(list[0].d.getFullYear(), list[0].d.getMonth() + 1, 1); +d < hi; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
        out.push(`<span class="ystrand__tick" style="--x:${X(+d).toFixed(1)}px">${d.getMonth() === 0 ? fmt.month(d) : MON[d.getMonth()]}</span>`);
      }
      ticks.innerHTML = out.join("");
      // the ball keeps its point through a resize (mid-roll: retarget; at rest: jump)
      tw = trailEl ? trailEl.clientWidth : 0;
      if (sx.moving) sx.to(xs[cur]); else roll(true);
    }
    function select(k, { instant = false } = {}) {
      pts.forEach((li) => $("a", li).setAttribute("aria-current", String(li.dataset.key === String(k))));
      const i = list.findIndex((x) => x.k === String(k));
      if (i >= 0) { cur = i; roll(instant); }
    }
    host.addEventListener("click", (e) => {
      const a = e.target.closest(".ystrand__a"); if (!a) return;
      e.preventDefault();
      const k = a.parentElement.dataset.key;
      select(k);
      host.dispatchEvent(new CustomEvent("ystrand", { bubbles: true, detail: { key: k } }));
    });
    new ResizeObserver(() => layout()).observe(line);
    layout();
    document.fonts?.ready?.then(layout);
    return { el: host, layout, select };
  }

  /* ============================================================
     MEDIA CAROUSEL (compact strip → lightbox)
     items: [{ src, alt, kind? }]  (src may be "/media/x.png")
     ============================================================ */
  function carousel(items, { group = uid("media"), title = "", label = "Media", heading = true } = {}) {
    const list = asArr(items);
    if (!list.length) return "";
    const n = list.length;
    const thumbs = list.map((m, i) => {
      const src = media(m.src) || null, vid = isVideo(m.src, m.kind);
      const what = vid ? "video" : "image";
      if (!src) return `<div class="ycar__thumb" role="img" aria-label="${what} not included in this mock: ${esc(m.alt || "")}"><span class="ymissing"><i class="ph ${vid ? "ph-video-camera" : "ph-image"}" aria-hidden="true"></i>${what} not in this mock</span></div>`;
      const inner = vid
        ? `<video src="${src}#t=0.6" muted playsinline preload="metadata" aria-hidden="true" tabindex="-1" data-ydur></video><span class="ycar__dur" aria-hidden="true"><i class="ph-fill ph-play"></i><span>video</span></span>`
        : `<img src="${src}" alt="" loading="lazy" decoding="async" draggable="false">`;
      return `<button type="button" class="ycar__thumb" data-ylb="${esc(group)}" data-src="${src}" data-alt="${esc(m.alt || "")}" data-kind="${what}" aria-haspopup="dialog" aria-label="Open ${what} ${i + 1} of ${n}${m.alt ? `: ${esc(m.alt)}` : ""}">${inner}</button>`;
    }).join("");
    return `<section class="ycar" data-ylb-title="${esc(title)}" aria-label="${esc(label)}">${heading ? `<h3 class="ycar__h eyebrow">${esc(label)} <span class="meta">${n}</span></h3>` : ""}<div class="ycar__strip">${thumbs}</div></section>`;
  }
  const fmtTime = (s) => { s = Math.max(0, Math.round(s || 0)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
  // fill video durations; swap broken media for a designed placeholder (never a broken image)
  document.addEventListener("loadedmetadata", (e) => {
    const v = e.target;
    if (!(v instanceof HTMLVideoElement) || !v.hasAttribute("data-ydur")) return;
    const d = v.parentElement?.querySelector(".ycar__dur span");
    if (d && isFinite(v.duration)) { d.textContent = fmtTime(v.duration); const b = v.closest("[aria-label]"); if (b && !b.dataset.durSet) { b.dataset.durSet = "1"; b.setAttribute("aria-label", b.getAttribute("aria-label").replace(/^Open video/, `Open ${fmtTime(v.duration)} video`)); } }
  }, true);
  document.addEventListener("error", (e) => {
    const t = e.target;
    if (t instanceof HTMLImageElement && t.hasAttribute("data-ydev")) { const i = document.createElement("i"); i.className = "ph-bold ph-brackets-curly"; i.setAttribute("aria-hidden", "true"); if (t.alt) { i.setAttribute("role", "img"); i.setAttribute("aria-label", t.alt); i.removeAttribute("aria-hidden"); } t.replaceWith(i); return; }
    if ((t instanceof HTMLImageElement || t instanceof HTMLVideoElement) && t.parentElement?.classList.contains("ycar__thumb")) {
      const p = t.parentElement; const vid = t instanceof HTMLVideoElement;
      p.innerHTML = `<span class="ymissing"><i class="ph ${vid ? "ph-video-camera" : "ph-image-broken"}" aria-hidden="true"></i>${vid ? "video" : "image"} unavailable</span>`;
      p.removeAttribute("data-ylb"); p.disabled = true;
    }
  }, true);

  /* ============================================================
     DETAIL SHELL — title → metadata → media → text → links
     ============================================================ */
  // wide: the text column takes the full width (boards, previews) instead of the 68ch reading measure
  // links: ?dfoot=inline (default) → a row in the flow right under the metadata (reachable near the top);
  //        ?dfoot=float (i2) → the floating links bar at the bottom.
  // end: in-flow footer content after the text (Yarn.pager). kicker: a line above the title (caps type · date).
  // top: false = no sticky top bar (the page places Back itself, e.g. an article's meta rail). size: "lg" = reading-page title.
  const backLink = (back) => (back.href
    ? `<a class="ydetail__back" href="${esc(back.href)}"><i class="ph-bold ph-arrow-left" aria-hidden="true"></i><span class="ydetail__bl">${esc(back.label || "Back")}</span></a>`
    : `<button type="button" class="ydetail__back" data-back><i class="ph-bold ph-arrow-left" aria-hidden="true"></i><span class="ydetail__bl">${esc(back.label || "Back")}</span></button>`);
  /* ---- i5 · layout · the opened item's grammar (LAYOUT-i5.md): facts · chips · links · previous/next ----
     Yarn.fact.*      one fact = a disc (22px since i7, --fact-d) + a label, one face for all of them (status, type,
                      instrument, date, text; i7: statusDate = status + date as one fact)
     Yarn.stackChips  the opened item's stack = Yarn.stackTags (Thoughts' hashtags): as "button" (data-yf toggles the
                      page filter; aria-pressed = the in-card match look, strike on hover/focus) · "a" (href(name)) · "li" (static)
     Yarn.dlink       one link button: the first in a row is the primary (red), the rest are secondaries (icon + label)
     Yarn.detailOptions  the ⚙ groups for these options (pages spread them into Yarn.mockPanel) */
  const FACT_ST = { ongoing: "ph-hammer", complete: "ph-check", paused: "ph-pause", dropped: "ph-trash-simple" };
  // hint: the kit's quick hint text (data-hint; i6 fix P2-1: icon-only facts, instead of the slow native title)
  const factHTML = (kind, icon, label, { sub = "", attrs = "", cls = "", title = "", hint = "" } = {}) =>
    `<span class="yfact yfact--${kind}${cls ? ` ${cls}` : ""}"${attrs ? ` ${attrs}` : ""}${title ? ` title="${esc(title)}"` : ""}${hint ? ` data-hint="${esc(hint)}"` : ""}><span class="yfact__i" aria-hidden="true"><i class="${/^ph-(bold|fill) /.test(icon) ? icon : `ph-bold ${icon}`}"></i></span><span class="yfact__l">${label}${sub ? `<span class="yfact__s">${sub}</span>` : ""}</span></span>`;
  const fact = {
    status(s, o = {}) { const st = typeof s === "object" && s?.key ? s : status(s); return st ? factHTML("status", FACT_ST[st.key] || "ph-circle", st.label, { ...o, attrs: `data-status="${st.key}"${o.attrs ? ` ${o.attrs}` : ""}` }) : ""; },
    type(t, o = {}) { const ty = type(t); return ty ? factHTML("type", ty.icon, esc(ty.label), { ...o, attrs: `data-type="${esc(ty.key)}"${o.attrs ? ` ${o.attrs}` : ""}` }) : ""; },
    // i9 · music · S6: a list of instruments (a mixed collection, Yarn.musicFacts(x).instruments) → "Piano + DAW" on a split disc
    instrument(i, o = {}) {
      const ks = instKeys(i);
      if (ks.length > 1) return factHTML("inst", "ph-music-notes", instLabel(ks), { ...o, attrs: `data-instrument="mixed" style="--fact-mix:${mixGrad(ks)}"${o.attrs ? ` ${o.attrs}` : ""}` });
      const it = instrument(Array.isArray(i) ? ks[0] : i); return it ? factHTML("inst", it.icon, it.label, { ...o, attrs: `data-instrument="${it.key}"${o.attrs ? ` ${o.attrs}` : ""}` }) : "";
    },
    // item { start, end, status } → its range (dur: true adds "· 1 yr 3 mo" as the quiet second part)
    date(x, { dur = false, ...o } = {}) {
      const s = parseDate(x?.start), txt = dateRange(x);
      return txt ? factHTML("date", "ph-calendar-blank", `<time datetime="${s ? fmt.iso(s) : ""}">${txt}</time>`, { ...o, sub: dur ? `· ${duration(x)}` : "" }) : "";
    },
    text: (icon, label, o = {}) => (label ? factHTML("text", icon, esc(label), o) : ""),
    // i7 · C1 (promoted from Studio, S1): the publish state, a second axis next to status. Its own disc per state:
    //   live = ink (sewn on) · changed = red (edits pinned on) · draft = a basted (dashed) ring · hidden = quiet grey.
    //   compact = the disc alone (the label for screen readers + the kit hint). text replaces the label ("11 live").
    pub(state, { compact = false, text = "", ...o } = {}) {
      const k = PUB[state] ? state : "draft", p = PUB[k];
      return factHTML("text", p.icon, esc(text || p.label), { ...o, cls: `yfact--pub${compact ? " yfact--icon" : ""}${o.cls ? ` ${o.cls}` : ""}`, hint: o.hint || (compact ? p.label : ""), attrs: `data-pub="${k}"${o.attrs ? ` ${o.attrs}` : ""}` });
    },
    // i7 · projects · P2 (?statusdate=joined): status + date as ONE fact, the status's disc + a sentence.
    //   complete → "Completed Dec 2024" (the month it ended) · ongoing → "WIP since Sep 2025" ·
    //   paused → "Paused since Mar 2024" (its end), or "Paused, started Jun 2024" with no end · dropped → "Dropped Dec 2024".
    //   The word is .yfact__w, so a tight card can show the disc + "Dec 2024" / "since Sep 2025" (word: false → it's
    //   visually hidden, read by screen readers, and the whole sentence is the kit hint). dur: true adds "· 5 mo"
    //   (complete over more than a month, ongoing) as the quiet second part. data-mk / .is-match as the other facts.
    statusDate(x, { dur = false, word = true, ...o } = {}) {
      const sd = statusDateParts(x);
      if (!sd) return "";
      const w = `<span class="yfact__w">${sd.word}${sd.comma ? "," : ""} </span>`;
      const sub = dur && sd.dur ? `· ${sd.dur}` : "";
      return factHTML("status", FACT_ST[sd.key] || "ph-circle", `${w}<time datetime="${sd.iso}">${sd.rest}</time>`,
        { ...o, sub, cls: `yfact--sd${word ? "" : " yfact--sdi"}${o.cls ? ` ${o.cls}` : ""}`, hint: o.hint || sd.text, attrs: `data-status="${sd.key}"${o.attrs ? ` ${o.attrs}` : ""}` });
    },
  };
  // the parts of a joined status + date (fact.statusDate; also handy for a page's own text)
  const SD_WORD = { complete: "Completed", ongoing: "WIP", paused: "Paused", dropped: "Dropped" };
  function statusDateParts(x) {
    const st = status(x?.status), s = parseDate(x?.start), e0 = parseDate(x?.end);
    if (!st || !s) return null;
    const on = st.key === "ongoing", e = on ? null : e0;
    // ongoing: since it started · paused: since it stopped (no end: when it started) · complete / dropped: when it ended
    const d = on ? s : (e || s);
    const pre = on || (st.key === "paused" && e) ? "since " : !e && st.key !== "complete" ? "started " : "";
    const comma = !!pre && pre === "started ";
    const multi = !!e && (e.getFullYear() !== s.getFullYear() || e.getMonth() !== s.getMonth());
    const rest = `${pre}${fmt.month(d)}`, word = SD_WORD[st.key] || st.label;
    return { key: st.key, word, comma, rest, iso: fmt.iso(d), text: `${word}${comma ? "," : ""} ${rest}`, dur: on || (st.key === "complete" && multi) ? duration(x) : "" };
  }
  // i6 · L5: the stack as Thoughts-style tags (Yarn.stackTags, .ytag--stk: no felt, pressed = the in-card match look +
  // the strike on hover). i7 (K3): i5's felt chip (?stackchip=chip) is cut, so this is the one look.
  function stackChips(list, { as = "li", pressed = null, match = null, href = null, label = "Built with" } = {}) {
    return stackTags(list, { as: as === "li" ? "span" : as, pressed, match, href, label });
  }
  // one link button. kind: a LINK_ICONS name (brand links get the brand fade + .btn--brand: they may drop to icon-only)
  // i9 · links: url = href (a Yarn.links object spreads straight in) · no label → Yarn.linkInfo's ("Play on itch.io") ·
  // keepLabel: the owner's own text, so a crowded row never drops it to the icon (.btn--brand may go icon-only)
  function dlink({ href, url = "", label, icon = "", kind = "", primary = false, cls = "", attrs = "", keepLabel = false } = {}) {
    href ||= url;
    if (!href) return "";
    const ext = /^https?:/i.test(String(href)), brand = brandOf(href, kind);
    const known = LINK_ICONS[brand] || LINK_ICONS[kind] || LINK_ICONS.link;
    const ic = icon || known[0];
    if (!label) label = brand ? linkInfo(href, { kind }).label : known[1]; // a platform link is named after its site ("SoundCloud")
    return `<a class="btn btn--d${primary ? " btn--red" : ""}${brand && !primary && !keepLabel ? " btn--brand" : ""}${cls ? ` ${cls}` : ""}" href="${esc(href)}"${brand ? ` data-brand="${brand}"` : ""}${ext ? ' target="_blank" rel="noopener"' : ""}${attrs ? ` ${attrs}` : ""}><i class="ph-bold ${ic}" aria-hidden="true"></i><span class="btn__l">${esc(label)}</span>${ext ? '<span class="sr-only"> (opens in a new tab)</span>' : ""}</a>`;
  }
  // previous / next for an item page's top bar (?dnav=). nav: { prev, next: { href, title, meta? } | null, index (1-based),
  // total, unit: "project" }. A missing side keeps its place (disabled), so the other button never moves.
  function dnavHTML({ prev = null, next = null, index = 0, total = 0, unit = "item" } = {}) {
    const mode = OPT.dnav;
    const side = (dir, x) => {
      const word = dir === "prev" ? "Previous" : "Next", ic = `<i class="ph-bold ph-caret-${dir === "prev" ? "left" : "right"}" aria-hidden="true"></i>`;
      const inner = mode === "labels" ? (dir === "prev" ? `${ic}<span class="ydnav__w">${word}</span>` : `<span class="ydnav__w">${word}</span>${ic}`) : ic;
      const cls = `ydnav__a ydnav__a--${dir} ${mode === "labels" ? "btn btn--sm" : "ylinkicon"}`;
      if (!x) return `<a class="${cls} is-off" role="link" aria-disabled="true" aria-label="${word} ${esc(unit)}: none, this is the ${dir === "prev" ? "first" : "last"} one">${inner}</a>`;
      const tip = `<span class="ydnav__tip" aria-hidden="true"><span class="eyebrow">${word}</span><b>${esc(x.title)}</b>${x.meta ? `<span class="meta">${x.meta}</span>` : ""}</span>`;
      // i6 · L2: count gets the neighbour's title on hover / focus too (the quick tip, never the slow native title)
      const tipped = mode === "arrows" || mode === "count";
      return `<a class="${cls}" href="${esc(x.href)}" rel="${dir}" data-dnav="${dir}" aria-label="${word} ${esc(unit)}: ${esc(x.title)}"${tipped ? "" : ` title="${esc(x.title)}"`}>${inner}${tipped ? tip : ""}</a>`;
    };
    const count = mode === "count" && total ? `<span class="ydnav__n" aria-label="${esc(unit)} ${index} of ${total}"><b>${index}</b><span aria-hidden="true"> / ${total}</span></span>` : "";
    return `<nav class="ydnav ydnav--${mode}" aria-label="Previous and next ${esc(unit)}">${side("prev", prev)}${count}${side("next", next)}</nav>`;
  }
  // ←/→ (and k/j, like the timeline) follow the top bar's previous / next. One listener for the page.
  document.addEventListener("keydown", (e) => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
    const dir = e.key === "ArrowLeft" || e.key === "k" ? "prev" : e.key === "ArrowRight" || e.key === "j" ? "next" : "";
    if (!dir || window.Yarn?.lightbox?.isOpen) return;
    const t = e.target;
    if (t !== document.body && !t.closest?.(".ydetail--page")) return;
    if (t.closest?.("input, textarea, select, [contenteditable='true'], [role='slider'], .ycar, yarn-player, .ybrowse")) return;
    const a = document.querySelector(`.ydetail--page > .ydetail__top [data-dnav="${dir}"]`);
    if (!a) return;
    e.preventDefault();
    sound("open", { el: a });
    a.click();
  });
  // i7 (K3): every one is decided (Earlier): dlayout = label (stack cut), dnav (L2), stagealign (L4). The stack group is
  // gone (?stackchip: tag decided, chip cut); `stack` is still accepted (Music passes false) and does nothing now.
  const detailOptions = ({ nav = false, stage = false } = {}) => [
    { label: "Opened item: layout", param: "dlayout", options: [["label", "Label first"], ["side", "Left rail (like an article)"], ["rail", "Right rail"]], default: "label" },
    ...(nav ? [{ label: "Item page: previous / next", param: "dnav", options: [["count", "‹ 3 / 14 › + title on hover"], ["labels", "‹ Previous · Next ›"], ["arrows", "Arrows + title on hover"]], default: "count" }] : []),
    ...(stage ? [{ label: "Timeline stage sits", param: "stagealign", options: [["center", "Centred"], ["top", "At the top (i5)"]], default: "center" }] : []),
  ];
  // the i5 shell: the same parts in one DOM order (title → facts → stack → links → media → text); ?dlayout= arranges
  // them with CSS only (yarn.css "i5 · layout"), so every layout reads the same to a screen reader.
  // i6 · layout: stackLabel / linksLabel name the sections (the side rail shows them as eyebrows, like an article's
  // rail; label shows "Built with"). no-body = nothing for a rail to sit beside (a song without notes): rails fold.
  // i7 follow-up (owner: "the credits … easily missable with the line of metadata … maybe under the title with a "made
  // with" text or made by if its not by me"): a credit line under an item's title, part of its heading (screen readers
  // hear "Title, made with macaron"). by: "made with macaron" / "made by aiden" (a name may be wrapped in <b> by the page,
  // so it's escaped here except for <b>)
  const byHTML = (by) => (by ? `<span class="ydetail__by"><span class="sr-only">, </span>${esc(by).replace(/&lt;(\/?)b&gt;/g, "<$1b>")}</span>` : "");
  function detail5({ back, actions, title, by = "", facts, stack, links, media: md, body, end, kicker, level, wide, id, nav, ribbon, stackLabel = "Built with", linksLabel = "Links" }) {
    const float = OPT.dfoot === "float", page = level === 1;
    const bar = `${nav ? dnavHTML(nav) : ""}${actions}`;
    const nAct = (actions.match(/class="ylinkicon/g) || []).length; // the title's first line keeps clear of this many buttons
    // i6 · L1 (owner: "side rail looks awful when theres no content for the song while label first doesnt have this
    // issue"): with no media and at most a line of text there is nothing for a rail to sit beside, so it folds into label
    const thin = !md && String(body || "").replace(/<[^>]*>/g, "").trim().length < 160;
    const lay = thin && (OPT.dlayout === "rail" || OPT.dlayout === "side") ? "label ydetail--folded" : OPT.dlayout;
    return `<article class="ydetail ydetail--v5 ydetail--${lay}${wide ? " ydetail--wide" : ""}${page ? " ydetail--page" : ""}${back ? "" : " ydetail--over"}${kicker ? " has-kicker" : ""}${stack ? "" : " no-stack"}${links && !float ? "" : " no-links"}${md || body ? "" : " no-body"}" style="--yact-n:${nAct}" aria-labelledby="${id}-t">
      ${ribbon || ""}<div class="ydetail__top">${back ? backLink(back) : ""}<p class="ydetail__mini" aria-hidden="true">${esc(title)}</p><div class="ydetail__actions">${bar}</div></div>
      ${kicker ? `<div class="ydetail__kicker">${kicker}</div>` : ""}
      <h${level} class="ydetail__title" id="${id}-t">${esc(title)}${byHTML(by)}</h${level}>
      <div class="ydetail__info">
        ${facts ? `<div class="ydetail__facts">${facts}</div>` : ""}
        ${stack ? `<div class="ydetail__stack" data-label="${esc(stackLabel)}">${stack}</div>` : ""}
        ${links && !float ? `<div class="ydetail__links" role="group" aria-label="${esc(linksLabel)}" data-label="${esc(linksLabel)}">${links}</div>` : ""}
      </div>
      <div class="ydetail__body">${md}${body ? `<div class="ydetail__text">${body}</div>` : ""}</div>
      ${end ? `<footer class="ydetail__end">${end}</footer>` : ""}
      ${links && float ? `<footer class="ydetail__foot"><div class="ydetail__bar">${links}</div></footer>` : ""}
    </article>`;
  }
  function detail({ back = null, actions = "", title = "", meta: m = "", media: md = "", body = "", links = "", end = "", kicker = "", top = true, size = "", level = 1, wide = false, id = uid("detail"), facts = null, stack = "", nav = null, ribbon = "", stackLabel, linksLabel, by = "" } = {}) {
    // i5 · layout: a page that passes `facts` gets the i5 shell (i6: ?dlayout=i4 is cut)
    if (facts != null) return detail5({ back, actions, title, by, facts, stack, links, media: md, body, end, kicker, level, wide, id, nav, ribbon, stackLabel, linksLabel });
    if (nav) actions = dnavHTML(nav) + actions;
    const float = OPT.dfoot === "float";
    return `<article class="ydetail${wide ? " ydetail--wide" : ""}${level === 1 ? " ydetail--page" : ""}${size === "lg" ? " ydetail--lg" : ""}${top ? "" : " ydetail--notop"}" aria-labelledby="${id}-t">
      ${top ? `<div class="ydetail__top">${back ? backLink(back) : ""}<p class="ydetail__mini" aria-hidden="true">${esc(title)}</p><div class="ydetail__actions">${actions}</div></div>` : ""}
      <header class="ydetail__head">
        ${kicker ? `<div class="ydetail__kicker">${kicker}</div>` : ""}
        <h${level} class="ydetail__title" id="${id}-t">${esc(title)}</h${level}>
        ${m ? `<div class="ydetail__meta">${m}</div>` : ""}
        ${links && !float ? `<div class="ydetail__links">${links}</div>` : ""}</header>
      <div class="ydetail__body">${md}${body ? `<div class="ydetail__text">${body}</div>` : ""}</div>
      ${end ? `<footer class="ydetail__end">${end}</footer>` : ""}
      ${links && float ? `<footer class="ydetail__foot"><div class="ydetail__bar">${links}</div></footer>` : ""}
    </article>`;
  }
  // i1's in-flow pager at the end of a detail page: "← Older / title / date" · "Newer → / title".
  // A missing side becomes the way out (e.g. { label: "Oldest article", title: "Back to all thoughts", href }).
  // prev/next: { href, title, meta?, label? } · ends: { prev, next } fallbacks · labels: { prev: "Older", next: "Newer" }
  function pager({ prev = null, next = null, ends = {}, labels = { prev: "Older", next: "Newer" }, label = "More", icons = { prev: "ph-arrow-left", next: "ph-arrow-right" } } = {}) {
    const one = (side, it) => {
      const end = !it, x = it || ends[side];
      if (!x) return `<span class="ypager__gap" aria-hidden="true"></span>`;
      const lab = x.label || labels[side];
      const ic = `<i class="ph-bold ${icons[side]}" aria-hidden="true"></i>`;
      return `<a class="ypager__a ypager__a--${side} ylift${end ? " is-end" : " ycard"}" href="${esc(x.href)}"${end ? "" : ` rel="${side}"`}>
        <span class="eyebrow">${side === "prev" ? ic + esc(lab) : esc(lab) + ic}</span><b>${esc(x.title)}</b>${x.meta ? `<span class="meta">${x.meta}</span>` : ""}</a>`;
    };
    return `<nav class="ypager" aria-label="${esc(label)}">${one("prev", prev)}${one("next", next)}</nav>`;
  }
  function wireDetail(el) {
    if (el._yw) return; el._yw = true; el.dataset.yinit = "";
    const top = $(":scope > .ydetail__top", el), t = $(".ydetail__title", el), f = $(":scope > .ydetail__foot", el);
    if (top && t) { // the compact title shows once the big title has slid under the bar
      let root = el.parentElement;
      while (root && root !== document.body && !/(auto|scroll)/.test(getComputedStyle(root).overflowY)) root = root.parentElement;
      if (root === document.body || root === html) root = null;
      // i5 · layout: .ydetail--over = the bar lies over the head's first row (a panel has no Back row), so the title
      // starts at the panel's top-left. The bar is clear until the panel scrolls (.is-lifted: it gets its material);
      // the compact title comes in once the big one has left (.is-stuck), same as a page's bar.
      const over = el.classList.contains("ydetail--over");
      // i6 · L3: measured against the bar itself, not a root margin fixed at wiring time (a margin went stale when
      // --sticky-top moved, and an over bar's 66px covered the title before the 6px margin noticed: the title was hidden
      // with no compact title). Rects of the bar, the title and the sentinel live in the same subtree, so the stage's
      // fade-up transform can't fake a scroll any more (that made a fresh bar flash its material on every switch).
      // i7 · site · K2 (owner, Music pin 4: "there are times where theres barely a scroll and the top bar shows … it
      // shouldnt show until passin the height of it in scroll distance"): an over bar used to lift after 1px.
      //   covered    = the title's bottom edge is at or above the bar's bottom edge
      //   .is-lifted (over bars) = the panel has carried the bar at least the bar's own height (sentinel → bar top) AND
      //                the title is covered. Until then the bar is clear, so it hides nothing: the title stays readable
      //                through it, and the moment the bar takes its material the compact title replaces it.
      //                Also (crowd) as soon as other content reaches the bar's buttons: Earlier's side / right rails put
      //                facts and media in the buttons' column, and a clear bar would let them run under the buttons.
      //   .is-stuck  = the compact title shows once the title is covered: an over bar once lifted; a page's bar (opaque,
      //                always in place) at once, so it never hides a title without naming it. On every detail page that
      //                moment already comes after more than the bar's height of page scroll (checked: r3i7-site/sticky.mjs).
      const s = over ? document.createElement("i") : null;
      if (s) { s.className = "ydetail__sent"; s.setAttribute("aria-hidden", "true"); el.prepend(s); }
      const act = over ? $(":scope > .ydetail__actions", top) : null;
      const CROWD = ":scope > .ydetail__body > *, .ydetail__facts > *, .ydetail__stack .ytag, .ydetail__links > *, :scope > .ydetail__end, :scope > .ydetail__foot";
      let raf = 0;
      const paint = () => {
        raf = 0;
        if (!el.isConnected) return;
        const tb = top.getBoundingClientRect(), tr = t.getBoundingClientRect();
        const covered = tr.height > 0 && tr.bottom <= tb.bottom + 1;
        let lifted = false;
        if (s) {
          const travel = tb.top - s.getBoundingClientRect().top, ab = act?.getBoundingClientRect();
          // the buttons' zone: right of the title's text column (the title keeps clear of the buttons), down to their bottom
          const x0 = ab?.width ? Math.min(ab.left, tr.right - (parseFloat(getComputedStyle(t).paddingRight) || 0)) : 0;
          const crowd = travel > 0.5 && !!ab?.width && $$(CROWD, el).some((c) => {
            const r = c.getBoundingClientRect();
            return r.height > 0 && r.top < ab.bottom && r.bottom > tb.top && r.left < tb.right && r.right > x0;
          });
          lifted = crowd || (covered && travel >= tb.height - 0.5);
        }
        const stuck = covered && (!over || lifted);
        if (s && top.classList.contains("is-lifted") !== lifted) top.classList.toggle("is-lifted", lifted);
        if (top.classList.contains("is-stuck") !== stuck) top.classList.toggle("is-stuck", stuck);
      };
      const queue = () => { if (!raf) raf = requestAnimationFrame(paint); };
      const scroller = root || window;
      scroller.addEventListener("scroll", queue, { passive: true });
      addEventListener("resize", queue);
      if (root) addEventListener("scroll", queue, { passive: true }); // the window's sticky push can move a panel's bar
      queue();
      trackIO(el, { disconnect() { scroller.removeEventListener("scroll", queue); removeEventListener("resize", queue); removeEventListener("scroll", queue); cancelAnimationFrame(raf); } });
    }
    if (f) watchStuck(f, { side: "bottom" });
    // a page-level detail (its h1 is the page title) on a phone: while its links bar floats, the nav bar steps
    // away (Back lives in the sticky top bar) and the bar takes its place; the player's disc sits above the bar
    if (f && $(".ydetail__title", el)?.tagName === "H1") { el.classList.add("ydetail--page"); pageFoot = f; queueNavAway(); }
  }
  let pageFoot = null, navRaf = 0;
  const compactMQ = matchMedia("(max-width: 959px)");
  function navAway() {
    navRaf = 0;
    const s = pageFoot?.isConnected && compactMQ.matches ? pageFoot._ysent : null;
    // the bar's place in the flow (its sentinel) is still below the screen = the bar floats
    const on = !!s && s.getBoundingClientRect().top > innerHeight - 2;
    if (html.classList.contains("y-navaway") === on) return;
    html.classList.toggle("y-navaway", on);
    dispatchEvent(new CustomEvent("yarn:bottomchrome", { detail: { navAway: on } }));
  }
  const queueNavAway = () => { if (!navRaf) navRaf = requestAnimationFrame(navAway); };
  // .yyear.is-stuck = the pill is pushed down from its natural spot (first in its group). Only ruled pills need it:
  // their line steps away while stuck, so it never lies across cards. i4 (owner): no cotton band behind a stuck pill
  // on phones any more; it floats over the items like on desktop, so plain pills are no longer measured per scroll.
  let pillRaf = 0;
  function paintPills() {
    pillRaf = 0;
    for (const p of $$(".yyear--rule")) {
      let stuck = false;
      if (!p.closest(".yrail")) {
        const r = p.getBoundingClientRect();
        if (r.width && r.bottom > -40 && r.top < innerHeight && getComputedStyle(p).position === "sticky") {
          const pr = p.parentElement.getBoundingClientRect();
          stuck = r.top - pr.top > 1 && pr.bottom - r.bottom > 4;
        }
      }
      if (p.classList.contains("is-stuck") !== stuck) p.classList.toggle("is-stuck", stuck);
    }
  }
  const queuePills = () => { if (!pillRaf) pillRaf = requestAnimationFrame(paintPills); };
  addEventListener("scroll", queuePills, { passive: true });
  addEventListener("resize", queuePills);
  addEventListener("scroll", queueNavAway, { passive: true });
  addEventListener("resize", queueNavAway);
  compactMQ.addEventListener?.("change", queueNavAway);
  // one detail-page skeleton: the reading column (--ydetail-w) with a rail column beside it (TOC, side links; reserved
  // even when empty so the column sits at the same x on every detail page at every width);
  // wide = the detail spans the column and the rail (boards). Same column x and top-bar offset on every detail page.
  // side: a left meta rail (article: back · posted · reading time · tags · share) in the first column, so the article
  // reads as three columns that start on one top line; the reading column stays at the same x as every detail page.
  function detailPage(detailHTML, { rail = "", side = "", wide = false, railLabel = "", sideLabel = "" } = {}) {
    return `<div class="ydpage ydpage--rail${side ? " ydpage--side" : ""}${wide ? " ydpage--wide" : ""}">${side ? `<aside class="ydpage__side"${sideLabel ? ` aria-label="${esc(sideLabel)}"` : ""}>${side}</aside>` : ""}<div class="ydpage__main">${detailHTML}</div>${rail ? `<aside class="ydpage__rail"${railLabel ? ` aria-label="${esc(railLabel)}"` : ""}>${rail}</aside>` : ""}</div>`;
  }
  // i5 · layout · the timeline's stage (.ystagewrap > .ypanel): put a new item in without a snap.
  //   Yarn.stageSwap(stage, html, { dir, animate, ribbon })
  // The new content fades up from the travel direction (dir: 1 = moving down the list, -1 = up). With
  // ?stagealign=center the panel's top depends on its height, so the wrap glides from where it is on screen to its new
  // place (measured before the swap, transform only): a second pick retargets mid-flight. ribbon: HTML for a tab on
  // the wrap's edge (the wrap doesn't clip; the panel scrolls). --stage-h is written on a swap and on resize only.
  // i6 · L4: --stage-h is the content's natural height (the stage's child), not the clamped panel's: the panel's
  // max-height shrinks for the player, so its own height would move the centred top whenever the player opened.
  // i6 review (P1-2): the cap assumed the panel already sat at its sticky top, but at scroll 0 it rests lower (under the
  // page head), so its closing row (Play all · Add to queue) went under the player bar. --ystage-nat = where the wrap
  // rests unscrolled (its column's top); the CSS caps on the lower of the two tops. Written on load / resize only.
  const stageNat = () => { for (const w of $$(".ystagewrap")) { const col = w.parentElement; if (col) w.style.setProperty("--ystage-nat", `${Math.round(col.getBoundingClientRect().top + scrollY)}px`); } };
  addEventListener("load", stageNat, { once: true });
  addEventListener("resize", () => requestAnimationFrame(stageNat), { passive: true });
  const stageRO = typeof ResizeObserver === "function" ? new ResizeObserver((ents) => {
    for (const en of ents) { const inner = en.target, wrap = inner.parentElement?.parentElement; if (inner.isConnected && wrap) wrap.style.setProperty("--stage-h", `${inner.offsetHeight}px`); }
    stageNat();
  }) : null;
  // i6 · fix (review P1-1; owner: the outgoing item animates out *while* the incoming one comes in). The old content is
  // copied into a ghost (.ystage-ghost: the stage's own classes, so its rules lay the copy out the same; no material,
  // inert) over the stage, in the wrap. It fades and slides out (−dir) on the spring the new content fades and slides in
  // on (+dir), and is gone by 70% of it. The panel's height follows on that spring with paint/composite only: the stage
  // is held at the taller of the two heights and clipped (rounded inset) from the old one to the new one; its shadow is
  // drawn by a shade behind it that scales (a soft shadow hides the stretch). The ghost is clipped to the same moving
  // outline, so it never pokes out while it slides. A second pick keeps one ghost: the more visible of the old ghost and
  // the current content goes out from where it is on screen; when the current content was the fainter one, the new item
  // takes its place at its opacity and position. No blank frame. Reduced motion: a plain swap.
  function stageSettle(stage) {
    for (const a of [stage._ya, stage._ygA, stage._yhA, stage._yshA]) a?.cancel();
    stage._yg?.remove(); stage._ysh?.remove();
    stage._ya = stage._yg = stage._ygA = stage._yhA = stage._ysh = stage._yshA = null;
    for (const p of ["min-height", "clip-path", "box-shadow", "overflow"]) stage.style.removeProperty(p);
  }
  function stageGhost(stage, cur) {
    const g = document.createElement("div");
    g.className = `${stage.className} ystage-ghost`;
    g._yghost = true; g.dataset.yghost = ""; g.inert = true; g.setAttribute("aria-hidden", "true");
    const c = cur.cloneNode(true);
    // the kit's upgrade() must not wire the copy; ids stay unique; a copied radio must not uncheck the new item's
    for (const e of [c, ...c.querySelectorAll("[id]")]) e.removeAttribute("id");
    for (const e of c.querySelectorAll("input[name]")) e.removeAttribute("name");
    for (const e of [c, ...c.querySelectorAll(".ydetail, .yscribble")]) { e._yw = true; e._yscr = true; }
    g.append(c);
    return g;
  }
  function stageSwap(stage, html, { dir = 0, animate = true, ribbon = "" } = {}) {
    const wrap = stage.parentElement, center = OPT.stagealign === "center", go = animate && !reduced();
    const r0 = go && center ? wrap.getBoundingClientRect() : null; // includes an in-flight glide
    // what is on screen now: the current content, an earlier ghost still going out, the panel's height
    const look = (el) => { const cs = getComputedStyle(el); return { el, op: +cs.opacity, tf: cs.transform, y: cs.transform === "none" ? 0 : new DOMMatrixReadOnly(cs.transform).m42 }; };
    const strips = (el) => [...el.querySelectorAll(".ycar__strip")].map((s) => s.scrollLeft);
    let out = null, from = null, h0 = 0;
    if (go) {
      const g0 = stage._yg?.isConnected ? stage._yg : null, cur = stage.firstElementChild;
      h0 = stage._ysh?.isConnected ? stage._ysh.getBoundingClientRect().height : stage.offsetHeight;
      const c = cur ? look(cur) : null, gl = g0 ? look(g0) : null;
      if (gl && (!c || gl.op > c.op)) { out = gl; from = c; stage._yg = null; } // keep it in place (its scroll stays)
      else if (c && c.op > 0.01) out = { ...c, el: stageGhost(stage, cur), st: stage.scrollTop, sl: strips(cur) };
    }
    stageSettle(stage); wrap._ya?.cancel();
    stage.innerHTML = html;
    stage.scrollTop = 0;
    wrap.querySelector(":scope > .yribbon")?.remove();
    if (ribbon) wrap.insertAdjacentHTML("beforeend", ribbon);
    if (center) {
      const inner = stage.firstElementChild;
      wrap.style.setProperty("--stage-h", `${inner ? inner.offsetHeight : stage.offsetHeight}px`);
      if (stageRO) { if (stage._yin) stageRO.unobserve(stage._yin); stage._yin = inner; if (inner) stageRO.observe(inner); }
    }
    if (!go) { stage._ygen = (stage._ygen || 0) + 1; return; }
    const sp = springEasing({ response: 0.36 }), T = { duration: sp.duration, easing: sp.easing };
    const inner = stage.firstElementChild, rb = wrap.querySelector(":scope > .yribbon"), dy = dir * 14;
    if (inner && (dir || out)) {
      const a = from || { op: 0, tf: dy ? `translateY(${dy}px)` : "none" };
      stage._ya = inner.animate([{ opacity: a.op, transform: a.tf }, { opacity: 1, transform: "none" }], T);
    }
    if (rb) rb.animate([{ opacity: 0, transform: "translateX(-8px)" }, { opacity: 1, transform: "none" }], T);
    // the panel: held at the taller height, clipped from the old height to the new one; the shade carries its shadow
    const h1 = inner ? stage.offsetHeight : h0, cs = getComputedStyle(stage), rad = cs.borderTopLeftRadius;
    if (inner && inner.offsetHeight <= h1 + 1) stage.style.overflow = "hidden"; // the slide can't flash a scrollbar
    if (h0 > 0 && h1 > 0 && Math.abs(h1 - h0) > 1) {
      const m = Math.max(h0, h1), sh = document.createElement("i");
      if (h0 > h1) stage.style.minHeight = `${m}px`;
      sh.className = "ystage-shade"; sh.setAttribute("aria-hidden", "true");
      sh.style.cssText = `height:${h1}px;border-radius:${rad};box-shadow:${cs.boxShadow}`;
      stage.before(sh); stage._ysh = sh; stage.style.boxShadow = "none";
      stage._yhA = stage.animate([{ clipPath: `inset(0px 0px ${m - h0}px 0px round ${rad})` }, { clipPath: `inset(0px 0px ${m - h1}px 0px round ${rad})` }], T);
      stage._yshA = sh.animate([{ transform: `scaleY(${h0 / h1})` }, { transform: "none" }], T);
    }
    // the outgoing ghost: from where it is on screen, out the other way, clipped to the panel's moving outline
    if (out) {
      const g = out.el;
      if (!g.isConnected) {
        g.style.cssText = `height:${h0}px;max-height:none`;
        stage.after(g); g.scrollTop = out.st;
        $$(".ycar__strip", g).forEach((s, i) => { if (out.sl[i]) s.scrollLeft = out.sl[i]; });
      }
      const hg = g.offsetHeight, y1 = -dy, clip = (y, h) => `inset(${-y}px 0px ${hg - h + y}px 0px round ${rad})`;
      stage._yg = g;
      stage._ygA = g.animate([
        { offset: 0, opacity: out.op, transform: out.tf, clipPath: clip(out.y, h0) },
        { offset: 0.7, opacity: 0 },
        { offset: 1, opacity: 0, transform: y1 ? `translateY(${y1}px)` : "none", clipPath: clip(y1, h1) },
      ], T);
    }
    const gen = (stage._ygen = (stage._ygen || 0) + 1), all = [stage._ya, stage._ygA, stage._yhA, stage._yshA].filter(Boolean);
    if (all.length) Promise.all(all.map((a) => a.finished)).then(() => { if (stage._ygen === gen) stageSettle(stage); }, () => {});
    if (r0) {
      const dy = r0.top - wrap.getBoundingClientRect().top;
      if (Math.abs(dy) > 0.5) wrap._ya = wrap.animate([{ transform: `translateY(${dy}px)` }, { transform: "none" }], { duration: sp.duration, easing: sp.easing });
    }
  }
  // link buttons used by detail footers and cards
  const LINK_ICONS = { github: ["ph-github-logo", "GitHub"], soundcloud: ["ph-soundcloud-logo", "SoundCloud"], youtube: ["ph-youtube-logo", "YouTube"], beepbox: ["ph-circle yduo", "BeepBox song"], spotify: ["ph-spotify-logo", "Spotify"],
    instagram: ["ph-instagram-logo", "Instagram"], x: ["ph-x-logo", "X"], discord: ["ph-discord-logo", "Discord"], linkedin: ["ph-linkedin-logo", "LinkedIn"], twitch: ["ph-twitch-logo", "Twitch"], email: ["ph-envelope-simple", "Email"], view: ["ph-arrow-up-right", "Visit site"], link: ["ph-link", "Link"],
    // i9 · links (S5): the other music services + itch.io. Bandcamp and itch.io have no Phosphor logo: .yic draws their
    // mark (a CSS mask, yarn.css "LINK OPENERS"), so they sit in the same <i> slot as every other icon
    bandcamp: ["yic yic-bandcamp", "Bandcamp"], apple: ["ph-apple-logo", "Apple Music"], itch: ["yic yic-itch", "itch.io"] };
  // i4 (site): link openers fade to their site's colour on hover/focus, icon white (yarn.css "LINK OPENERS").
  // The brand comes from the kind, else from the host (a "view"/"link" to discord.com is Discord: its logo + blurple).
  // Unknown sites keep the default button. Yarn.brandOf(href, kind?) → "github" | … | "" (pages may set data-brand).
  const BRAND_HOSTS = {
    github: /(^|\.)github\.com$/, youtube: /(^|\.)(youtube\.com|youtu\.be|youtube-nocookie\.com)$/, soundcloud: /(^|\.)soundcloud\.com$/,
    beepbox: /(^|\.)(beepbox\.co|jummb\.us|jummbus\.bitbucket\.io|ultraabox\.github\.io|moddedbeepbox\.github\.io)$/,
    spotify: /(^|\.)(spotify\.com|spotify\.link)$/, discord: /(^|\.)(discord\.com|discord\.gg|discordapp\.com)$/, instagram: /(^|\.)instagram\.com$/,
    x: /(^|\.)(x\.com|twitter\.com)$/, linkedin: /(^|\.)linkedin\.com$/, twitch: /(^|\.)twitch\.tv$/,
    bandcamp: /(^|\.)bandcamp\.com$/, apple: /^(music|embed\.music|geo\.music|itunes)\.apple\.com$/, itch: /(^|\.)itch\.io$/, // i9 · links (S5)
  };
  function brandOf(href, kind = "") {
    if (BRAND_HOSTS[kind]) return kind;
    let h = "";
    try { h = new URL(String(href), location.href).hostname.toLowerCase(); } catch (_) {}
    return (h && Object.keys(BRAND_HOSTS).find((k) => BRAND_HOSTS[k].test(h))) || "";
  }
  // { sm: true } → 32px (dense rows; the hit area stays 44px on touch)
  // i9 · links: also Yarn.linkIcon(link, { sm }) with a Yarn.links / Yarn.linkInfo object (its brand, url and label)
  const linkIcon = (kind, href, label, { sm = false } = {}) => {
    if (kind && typeof kind === "object") {
      const l = kind, o = href && typeof href === "object" ? href : { sm };
      return linkIcon(l.brand || (l.kind === "email" ? "email" : "link"), l.url || l.href || "", l.label || l.text || "", o);
    }
    const brand = brandOf(href, kind);
    const swap = brand && LINK_ICONS[brand] && (kind === "view" || kind === "link" || !LINK_ICONS[kind]);
    const [ic, l] = swap ? LINK_ICONS[brand] : LINK_ICONS[kind] || LINK_ICONS.link;
    const ext = /^https?:/i.test(String(href));
    return `<a class="ylinkicon${sm ? " ylinkicon--sm" : ""}" href="${esc(href)}"${brand ? ` data-brand="${brand}"` : ""}${ext ? ' target="_blank" rel="noopener"' : ""} aria-label="${esc(label || l)}${ext ? " (opens in a new tab)" : ""}" title="${esc(label || l)}"><i class="ph-bold ${ic}" aria-hidden="true"></i></a>`;
  };
  /* ---- i9 · links (S5; owner: "a list any of arbitrary links and the ones we recognize we convert" · "choose the
     copy/text for a link") · one recogniser for every link the owner gives, Studio and the site alike ----
     Yarn.linkInfo(url, { kind? }) → { url, valid, brand, kind, name, label, icon, host, guess, embed, why }
       url    normalised: https for a known service, its own host (youtu.be · music.youtube · m.youtube → www.youtube.com/
              watch?v=…, m.soundcloud → soundcloud.com, open.spotify.com/intl-xx/… → open.spotify.com/…, twitter → x.com),
              tracking dropped everywhere (utm_*, si, fbclid, gclid …) and a service's share junk too (Spotify keeps
              nothing, Apple Music keeps ?i=, SoundCloud keeps ?in=, YouTube keeps v / t / list); a bare "zed.dev" gets https
       brand  a LINK_ICONS name, "" = a site we don't know (kind? = a hint for one: the old { beepbox: url } keys)
       kind   track · album · playlist · set · artist · video · channel · repo · gist · profile · game · song · post ·
              server · app · email · link
       name   the service ("SoundCloud", "JummBox"; an unknown site: its domain) · label: the default text ("SoundCloud",
              "Play on itch.io", "JummBox song", "Add to Discord", "zed.dev") · icon: its Phosphor / .yic class
       guess  { title, by } read off the slug (soundcloud.com/numaiden/feline-shores → "Feline Shores" by numaiden), or null
       embed  the service's own player { src, h } | { src, ratio } (SoundCloud, Spotify, YouTube, Apple Music), else null
       why    when !valid: one sentence for the field ("That isn't a link yet: it needs a site, like soundcloud.com/…")
     Yarn.links(x, { all }) → [{ ...linkInfo, text, label }] from any shape: [{ url, text }] (i9) · ["url"] · { soundcloud:
       url, … } (the site's music data) · a project's view + github (their old words kept as the text: "Visit site",
       "Source") · a pick's url · an images post's embed · [{ kind, label, href }] (Home's contacts). label = text || the
       default. Invalid and repeated links drop out unless all: true.
     Yarn.dlinks(x, { primary, sm, cls }) → that list as the detail footer's Yarn.dlink buttons (the first is red unless
       primary: false) */
  const LINK_DROP = /^(utm_[a-z_]+|si|fbclid|gclid|dclid|gbraid|wbraid|msclkid|yclid|igshid|igsh|mc_cid|mc_eid|_hsenc|_hsmi|mkt_tok)$/i;
  const LINK_DROP_KNOWN = /^(ref|ref_src|ref_url|feature|pp|ab_channel|nd|dlsi|context|from|search_[a-z_]+|referrer|source|share|trk)$/i;
  const LINK_NAMES = { github: "GitHub", soundcloud: "SoundCloud", youtube: "YouTube", beepbox: "BeepBox", spotify: "Spotify", bandcamp: "Bandcamp", apple: "Apple Music", itch: "itch.io", instagram: "Instagram", x: "X", discord: "Discord", linkedin: "LinkedIn", twitch: "Twitch" };
  const BEEP_FORKS = [[/(^|\.)(jummb\.us|jummbus\.bitbucket\.io)$/, "JummBox"], [/^ultraabox\.github\.io$/, "UltraBox"], [/^moddedbeepbox\.github\.io$/, "ModBox"]];
  const unslug = (s) => { let t = String(s || ""); try { t = decodeURIComponent(t); } catch (_) {} return t.replace(/\.html?$/i, "").replace(/[-_+]+/g, " ").replace(/\s+/g, " ").trim(); };
  const titleCase = (s) => s.replace(/(^|\s)(\p{Ll})/gu, (m, a, b) => a + b.toUpperCase());
  function linkInfo(raw, { kind: hint = "" } = {}) {
    let s = String(raw ?? "").trim();
    const bad = (why) => ({ url: s, valid: false, brand: "", kind: "", name: "", label: s, icon: LINK_ICONS.link[0], host: "", guess: null, embed: null, why });
    if (!s) return bad("Add a link.");
    const sp = s.match(/^spotify:(track|album|playlist|artist|episode|show):([A-Za-z0-9]+)$/i); // a Spotify URI
    if (sp) s = `https://open.spotify.com/${sp[1].toLowerCase()}/${sp[2]}`;
    if (/^mailto:/i.test(s) || /^[^\s@/:]+@[^\s@/]+\.[a-z]{2,}$/i.test(s)) {
      const addr = s.replace(/^mailto:/i, ""), at = addr.split("?")[0];
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(at)) return bad("That email address is missing something.");
      return { url: `mailto:${addr}`, valid: true, brand: "", kind: "email", name: "Email", label: "Email", icon: LINK_ICONS.email[0], host: at.split("@")[1], guess: null, embed: null, why: "" };
    }
    if (/\s/.test(s)) return bad(/\w\.[a-z]{2,}/i.test(s) ? "A link has no spaces: put each one on its own line." : "That isn't a link yet: it needs a site, like soundcloud.com/…");
    if (/^\/\//.test(s)) s = `https:${s}`;
    else if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) {
      if (/^[a-z0-9-]+(\.[a-z0-9-]+)+(:\d+)?([/?#]|$)/i.test(s)) s = `https://${s}`;
      else return bad("That isn't a link yet: it needs a site, like soundcloud.com/…");
    }
    let u;
    try { u = new URL(s); } catch (_) { return bad("That isn't a link yet: check it for a typo."); }
    if (!/^https?:$/.test(u.protocol)) return bad("Only web links (https://…) work here.");
    const host = u.hostname.toLowerCase().replace(/\.$/, "");
    if (!/^([a-z0-9-]+\.)+[a-z]{2,}$/i.test(host) && !/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return bad("That site address looks unfinished.");
    u.hostname = host;
    for (const k of [...u.searchParams.keys()]) if (LINK_DROP.test(k)) u.searchParams.delete(k);
    let brand = Object.keys(BRAND_HOSTS).find((k) => BRAND_HOSTS[k].test(host)) || "";
    if (!brand && BRAND_HOSTS[hint]) brand = hint;
    const rawParts = u.pathname.split("/").filter(Boolean);
    const parts = rawParts.map((p) => { try { return decodeURIComponent(p); } catch (_) { return p; } });
    const keepOnly = (...keep) => { for (const k of [...u.searchParams.keys()]) if (!keep.includes(k)) u.searchParams.delete(k); };
    const dropKnown = () => { for (const k of [...u.searchParams.keys()]) if (LINK_DROP_KNOWN.test(k)) u.searchParams.delete(k); };
    let kind = "link", label = "", guess = null, embed = null, name = "";
    if (brand) { u.protocol = "https:"; if (/^(m|mobile)\./.test(u.hostname)) u.hostname = u.hostname.replace(/^(m|mobile)\./, brand === "youtube" ? "www." : ""); }
    switch (brand) {
      case "youtube": {
        const music = /^music\./.test(host);
        let id = "";
        if (/youtu\.be$/.test(host)) id = rawParts[0] || "";
        else if (parts[0] === "watch") id = u.searchParams.get("v") || "";
        else if (["shorts", "embed", "live", "v", "e"].includes(parts[0])) id = rawParts[1] || "";
        const t0 = String(u.searchParams.get("t") || u.searchParams.get("start") || "").replace(/s$/, ""), t = /^\d+$/.test(t0) && +t0 > 0 ? t0 : "";
        const list = u.searchParams.get("list") || "";
        u.hostname = "www.youtube.com"; u.hash = "";
        if (/^[\w-]{6,}$/.test(id)) {
          u.pathname = "/watch"; u.search = ""; u.searchParams.set("v", id); if (t) u.searchParams.set("t", t);
          kind = music ? "track" : "video";
          embed = { src: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0${t ? `&start=${t}` : ""}`, ratio: 16 / 9 };
        } else if (parts[0] === "playlist" && list) {
          u.search = ""; u.searchParams.set("list", list);
          kind = /^OLAK5uy_/.test(list) ? "album" : "playlist";
          embed = { src: `https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(list)}&rel=0`, ratio: 16 / 9 };
        } else { u.search = ""; if (/^@/.test(parts[0] || "") || ["channel", "c", "user"].includes(parts[0])) kind = "channel"; }
        break;
      }
      case "soundcloud": {
        if (/^on\./.test(host)) { u.search = ""; break; } // a share short link: SoundCloud resolves it
        u.hostname = "soundcloud.com"; u.hash = "";
        const inSet = u.searchParams.get("in"); u.search = inSet ? `?in=${encodeURI(inSet)}` : ""; // (the set it's played in stays readable)
        const [a, b, c] = parts, PROF = ["likes", "reposts", "tracks", "albums", "sets", "popular-tracks", "followers", "following", "comments", "spotlight"];
        if (a === "discover" && b === "sets" && c) kind = "playlist";
        else if (a && b === "sets" && c) { kind = "set"; guess = { title: titleCase(unslug(c)), by: unslug(a) }; }
        else if (a && b && !PROF.includes(b)) { kind = "track"; guess = { title: titleCase(unslug(b)), by: unslug(a) }; }
        else if (a) kind = "profile";
        if (kind !== "profile" && kind !== "link") embed = { src: `https://w.soundcloud.com/player/?url=${encodeURIComponent(`https://soundcloud.com/${rawParts.slice(0, kind === "track" ? 2 : 3).join("/")}`)}&color=%23d62f38&auto_play=true&hide_related=true&show_comments=false&show_reposts=false&show_teaser=false&visual=false`, h: kind === "track" ? 166 : 300 };
        break;
      }
      case "spotify": {
        if (/spotify\.link$/.test(host)) { u.search = ""; break; } // a share short link
        u.hostname = "open.spotify.com"; u.search = ""; u.hash = "";
        let p = rawParts.slice();
        if (/^intl-/.test(p[0] || "")) p = p.slice(1);
        if (p[0] === "embed") p = p.slice(1);
        if (["track", "album", "playlist", "artist", "episode", "show"].includes(p[0]) && /^[A-Za-z0-9]+$/.test(p[1] || "")) {
          u.pathname = `/${p[0]}/${p[1]}`; kind = p[0];
          embed = { src: `https://open.spotify.com/embed/${p[0]}/${p[1]}`, h: kind === "track" || kind === "episode" ? 80 : 352 };
        } else if (p[0] === "user" && p[1]) { u.pathname = `/user/${p[1]}`; kind = "profile"; }
        break;
      }
      case "bandcamp": {
        u.search = ""; u.hash = "";
        const who = host.replace(/\.bandcamp\.com$/, "");
        if (host === "bandcamp.com" || who === "www") break; // bandcamp.com itself (discover, a fan page …)
        if ((parts[0] === "track" || parts[0] === "album") && parts[1]) { kind = parts[0]; u.pathname = `/${parts[0]}/${rawParts[1]}`; guess = { title: titleCase(unslug(parts[1])), by: unslug(who) }; }
        else if (!parts.length || parts[0] === "music") { kind = "artist"; u.pathname = "/"; }
        break; // (Bandcamp's player wants the numeric id from the page: the real build reads it when the link is saved)
      }
      case "apple": {
        u.hostname = "music.apple.com"; u.hash = ""; keepOnly("i");
        const p = /^[a-z]{2}$/.test(parts[0] || "") ? parts.slice(1) : parts, typ = p[0];
        kind = typ === "album" ? (u.searchParams.get("i") ? "track" : "album") : typ === "song" ? "track" : typ === "music-video" ? "video" : ["playlist", "artist"].includes(typ) ? typ : "link";
        if ((typ === "song" || typ === "album" && kind === "album" || typ === "playlist") && p[1] && p.length >= 3) guess = { title: titleCase(unslug(p[1])), by: "" };
        if (["album", "song", "playlist"].includes(typ)) embed = { src: `https://embed.music.apple.com${u.pathname}${u.search}`, h: kind === "track" ? 175 : 450 };
        break;
      }
      case "github": {
        if (u.hostname === "www.github.com") u.hostname = "github.com";
        dropKnown();
        if (/^gist\./.test(host)) kind = "gist";
        else if (parts.length >= 2 && !["orgs", "settings", "topics", "sponsors", "marketplace", "features", "explore", "search"].includes(parts[0])) { kind = "repo"; u.pathname = u.pathname.replace(/\.git(?=\/|$)/, ""); }
        else if (parts.length === 1) kind = "profile";
        break;
      }
      case "itch": {
        dropKnown();
        if (/^(www\.)?itch\.io$/.test(host)) break;
        const who = host.replace(/\.itch\.io$/, "");
        if (parts[0]) { kind = "game"; guess = { title: titleCase(unslug(parts[0])), by: unslug(who) }; } else kind = "profile";
        break;
      }
      case "beepbox": {
        const fork = BEEP_FORKS.find(([re]) => re.test(host));
        name = fork ? fork[1] : "BeepBox";
        kind = u.hash.length > 4 ? "song" : "link";
        if (kind === "song") label = `${name} song`;
        break;
      }
      case "x": u.hostname = "x.com"; u.search = ""; u.hash = ""; kind = parts[1] === "status" ? "post" : parts.length ? "profile" : "link"; break;
      case "instagram": u.search = ""; u.hash = ""; kind = ["p", "reel", "reels", "tv"].includes(parts[0]) ? "post" : parts.length ? "profile" : "link"; break;
      case "discord":
        if (/discordapp\.com$/.test(host)) u.hostname = host.replace(/discordapp\.com$/, "discord.com");
        dropKnown();
        kind = /discord\.gg$/.test(host) || parts[0] === "invite" ? "server" : parts[0] === "oauth2" || parts[0] === "application-directory" ? "app" : parts[0] === "users" ? "profile" : "link";
        if (kind === "app") label = "Add to Discord";
        break;
      case "linkedin": u.search = ""; u.hash = ""; kind = ["in", "company", "school"].includes(parts[0]) ? "profile" : parts[0] === "posts" || parts[0] === "feed" ? "post" : "link"; break;
      case "twitch": u.search = ""; u.hash = ""; kind = parts[0] === "videos" ? "video" : parts.length ? "channel" : "link"; break;
      default: break; // an unknown site keeps its address as given (minus the tracking above)
    }
    let url = u.href;
    if (u.pathname === "/" && !u.search && !u.hash) url = url.replace(/\/$/, "");
    const dom = u.hostname.replace(/^www\./, "");
    name ||= LINK_NAMES[brand] || dom;
    label ||= brand === "itch" && kind === "game" ? "Play on itch.io" : name;
    const icon = (LINK_ICONS[brand] || LINK_ICONS.view)[0];
    return { url, valid: true, brand, kind, name, label, icon, host: dom, guess, embed, why: "" };
  }
  // the old project "view" button's words (the site's projects/pj-core.js viewLabel), kept as the link's text
  const viewText = (href) => { const h = linkInfo(href).host; return /discord\.com$/.test(h) ? "Add to Discord" : /github\.com$/.test(h) ? "Open repo" : /exercism\.org$/.test(h) ? "View exercise" : "Visit site"; };
  function links(x, { all = false } = {}) {
    if (x == null) return [];
    const src = Array.isArray(x) || typeof x === "string" ? x : x.links;
    let raw = [];
    if (typeof src === "string") raw = src.split(/\s+/).filter(Boolean).map((url) => ({ url }));
    else if (Array.isArray(src)) raw = src.map((l) => (typeof l === "string" ? { url: l } : l && typeof l === "object" ? { url: l.url ?? l.href ?? "", text: l.text ?? l.label ?? "", kind: l.kind || "" } : null)).filter(Boolean);
    else if (src && typeof src === "object") raw = Object.entries(src).filter(([, v]) => v).map(([k, v]) => ({ url: v, kind: k }));
    if (typeof x === "object" && !Array.isArray(x) && !Array.isArray(x.links)) { // the older single fields
      if (x.type === "pick" && x.url) raw.unshift({ url: x.url });
      if (x.view) raw.push({ url: x.view, text: viewText(x.view) });
      if (x.github && x.github !== x.view) raw.push({ url: x.github, text: "Source" });
      if (typeof x.embed === "string" && x.embed) raw.push({ url: x.embed });
    }
    const seen = new Set();
    return raw.map((l) => {
      const i = linkInfo(l.url, { kind: l.kind }), t = String(l.text || "").trim();
      const text = t === i.label ? "" : t;
      return { ...i, text, label: text || i.label };
    }).filter((l) => (l.valid ? !seen.has(l.url) && !!seen.add(l.url) : all));
  }
  const dlinks = (x, { primary = true, sm = false, cls = "", attrs = "" } = {}) => links(x).map((l, i) =>
    dlink({ href: l.url, label: l.label, icon: l.icon, kind: l.brand || (l.kind === "email" ? "email" : ""), primary: primary && i === 0, keepLabel: !!l.text, cls: [sm ? "btn--sm" : "", cls].filter(Boolean).join(" "), attrs })).join("");
  /* i7 · C1 · copy link (promoted: Projects' [data-copy] listener, Music's copyLink and Thoughts' copy icon were three
     copies of one button). Yarn.copyBtn(text, { label, sm, cls, attrs }) → button.ylinkicon[data-copy] (text "" = the
     page's URL when it's pressed). One kit listener copies it (clipboard, else a selected textarea + execCommand); the
     icon turns ✓ (a broken link if it failed), the name says "Link copied" and the hint "Copied" for 1.6 s, sound copy.
     Yarn.copy(text, btn?) → Promise<boolean> for a page's own trigger (Music's menu). */
  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; }
    catch (_) {
      const ta = Object.assign(document.createElement("textarea"), { value: text });
      ta.setAttribute("readonly", ""); ta.style.cssText = "position:fixed;opacity:0;top:0";
      document.body.appendChild(ta); ta.select();
      let ok = false;
      try { ok = document.execCommand("copy"); } catch (_) {}
      ta.remove();
      return ok;
    }
  }
  async function copy(text, b = null) {
    const ok = await copyText(text || location.href);
    if (!b) return ok;
    const i = b.querySelector("i");
    if (!b._ylabel) b._ylabel = b.getAttribute("aria-label") || "";
    if (i) i.className = `ph-bold ${ok ? "ph-check" : "ph-link-break"}`;
    b.classList.toggle("is-copied", ok);
    b.dataset.hint = ok ? "Copied" : "Couldn't copy";
    if (ok) { b.setAttribute("aria-label", "Link copied"); sound("copy", { el: b }); }
    clearTimeout(b._ycopy);
    b._ycopy = setTimeout(() => { if (i) i.className = "ph-bold ph-link"; b.classList.remove("is-copied"); delete b.dataset.hint; if (b._ylabel) b.setAttribute("aria-label", b._ylabel); }, 1600);
    return ok;
  }
  const copyBtn = (text = "", { label = "Copy link", sm = false, cls = "", attrs = "" } = {}) =>
    `<button type="button" class="ylinkicon${sm ? " ylinkicon--sm" : ""}${cls ? ` ${cls}` : ""}" data-copy="${esc(text)}" aria-label="${esc(label)}" title="Copy link"${attrs ? ` ${attrs}` : ""}><i class="ph-bold ph-link" aria-hidden="true"></i></button>`;
  document.addEventListener("click", (e) => {
    const b = e.target.closest?.("button[data-copy]");
    if (b && !b.disabled) copy(b.dataset.copy, b);
  });
  // a page's own text link-out (.btn: "Visit site", "Add to Discord") picks up its brand on first hover / focus
  const brandUp =(e) => { const a = e.target.closest?.('a.btn[href^="http"]:not([data-brand])'); if (a) a.dataset.brand = brandOf(a.href); };
  document.addEventListener("pointerover", brandUp, { passive: true });
  document.addEventListener("focusin", brandUp);

  /* ============================================================
     DISC — the felt record: the player's collapsed FAB, Thoughts playlists, Studio
     Yarn.disc(track?, { size, label: "swatch"|"cat", spinning })
     spins while it (or any ancestor) has .is-playing / .is-spinning
     ============================================================ */
  function disc(track = null, { size = 60, label = null, spinning = false, cls = "" } = {}) {
    const want = label || (params.get("disc") === "cat" ? "cat" : "swatch");
    const sw = want === "swatch" && track ? window.YarnSwatch?.uri?.({ instrument: track.instrument, url: track.url || undefined, name: track.name }) || "" : "";
    return `<span class="ydisc${spinning ? " is-spinning" : ""}${cls ? ` ${cls}` : ""}" style="--disc:${size}px" aria-hidden="true"><span class="ydisc__rec">${discLabel(sw)}</span></span>`;
  }
  const discLabel = (sw) => (sw ? `<span class="ydisc__label" style="background-image:url('${sw}')"></span>` : `<span class="ydisc__label ydisc__label--cat">${catSVG("", "#fff")}</span>`);

  /* ============================================================
     WAVEFORM — stitched bars, seeded by the track: the same track draws the
     same waveform in the player's scrub, Studio's uploads and previews.
     Yarn.wave.values(track|id|url, n) · Yarn.wave.svg(track|values, { n }) · --f (0..1) = played
     ============================================================ */
  const trackKey = (t) => {
    if (!t) return "x";
    const fromUrl = (u) => { const parts = String(u).split("/"); const f = parts[parts.length - 1].replace(/\.[^.]+$/, ""); return parts.length >= 2 ? `${parts[parts.length - 2]}_${f}` : f; };
    if (typeof t === "string") return /[\/]|\.(mp3|wav|m4a|ogg|flac)$/i.test(t) ? fromUrl(t) : t;
    return t.id || (t.url ? fromUrl(t.url) : slug(t.name || "x"));
  };
  function waveValues(t, n = 64) {
    const id = trackKey(t);
    const R = rng(hash(id + "#wave"));
    const ph = [R() * 6.283, R() * 6.283, R() * 6.283];
    const fr = [0.6 + R() * 1.4, 2.5 + R() * 3.5, 7 + R() * 9];
    const secs = Array.from({ length: 7 }, () => 0.5 + R() * 0.5);
    const out = [];
    for (let i = 0; i < n; i++) {
      const x = n === 1 ? 0 : i / (n - 1);
      const env = Math.min(1, 0.22 + x * 6, 0.2 + (1 - x) * 4.5);
      const sec = secs[Math.min(6, Math.floor(x * 7))];
      let v = 0.62 + 0.22 * Math.sin(x * fr[0] * 6.283 + ph[0]) + 0.12 * Math.sin(x * fr[1] * 6.283 + ph[1]) + 0.08 * Math.sin(x * fr[2] * 6.283 + ph[2]);
      v *= sec * env * (0.68 + 0.6 * rng(hash(id + "#" + Math.round(x * 220)))());
      out.push(clamp(v, 0.1, 1));
    }
    return out;
  }
  // bar path for a w×h box (one vertical stroke per value)
  function wavePath(vals, w, h) {
    const n = vals.length, step = w / n, mid = h / 2, max = h - 4;
    let d = "";
    vals.forEach((v, i) => { const x = (i + 0.5) * step, bh = Math.max(3, v * max); d += `M${x.toFixed(1)} ${(mid - bh / 2).toFixed(1)}V${(mid + bh / 2).toFixed(1)}`; });
    return d;
  }
  function waveSVG(src, { n = 64, h = 40 } = {}) {
    const vals = Array.isArray(src) ? src : waveValues(src, n);
    const w = vals.length * 5, d = wavePath(vals, w, h);
    const one = (cls) => `<svg class="ywave__l ${cls}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path class="pb" d="${d}"/><path class="pt" d="${d}"/></svg>`;
    return one("ywave__u") + one("ywave__o");
  }
  const wave = { values: waveValues, path: wavePath, svg: waveSVG, key: trackKey,
    html: (src, { n = 64, played = 0, cls = "" } = {}) => `<span class="ywave${cls ? ` ${cls}` : ""}" style="--f:${played}" aria-hidden="true">${waveSVG(src, { n })}</span>` };

  /* ============================================================
     MUSIC FOLDER CARD — a music entry (single or collection) as the library card.
     Collections are folders: one tab per track peeks above the card (count at a
     glance), the playing track's tab stands up, hover/focus shows its name.
     Yarn.folder(entry, { tracks, current, links, action, open: { attrs, label }, meta, key })
     Pages handle clicks: .yfolder__tab[data-tid] (play that track), .yfolder__open (open the item).
     On touch, a strip whose tabs overlap under 44px becomes one target that opens the folder.
     ============================================================ */
  const EQ = `<span class="yeq" aria-hidden="true"><b></b><b></b><b></b></span>`;
  const plainText = (s) => String(s || "").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/\*\*|__|^#+\s*/gm, "").replace(/\s+/g, " ").trim();
  // i5 · music: a tab's number is the track's own (t.index) when the page passes only some tracks (M7: tabs only
  // for tracks with audio); total = the collection's real size (count + aria). No playing bars on tabs or beside
  // the play button any more (M3): the page puts them inside its play button; the playing tab just stands up.
  function folder(it, { tracks = null, current = null, links = "", action = "", open = null, meta: m = null, desc = true, count = true, swatchSize = 54, key = "", total = null } = {}) {
    const list = tracks || it.songs || it.tracks || [];
    const coll = it.type === "collection" || it.kind === "collection" || (Array.isArray(it.songs) && it.type !== "single");
    const n = list.length, all = total ?? n, name = it.name || (coll ? "Untitled collection" : "Untitled track");
    const sw = window.Yarn?.swatchHTML ? window.Yarn.swatchHTML({ instrument: it.instrument, url: it.url || undefined, name: it.name, mix: coll ? instMix(list, it.instrument) : undefined }, { size: swatchSize, radius: 12 }) : ""; // i9 · music · S6: a mixed collection's yarns
    const tab = (t, i) => {
      const now = current != null && (t.id ?? String(i)) === current;
      const no = t.index || i + 1;
      const tname = String(t.name || `Track ${no}`);
      return `<button type="button" class="yfolder__tab${t.url ? "" : " is-off"}${now ? " is-now" : ""}${i >= n / 2 ? " is-r" : ""}" data-tid="${esc(t.id ?? i)}" style="--i:${i}" tabindex="${i === 0 ? 0 : -1}" data-name="${esc(tname)}${t.url ? "" : " · no audio"}"
        aria-label="${t.url ? "Play" : "Open"} ${esc(tname)}, track ${no} of ${all}${t.url ? "" : " (no audio)"}"${now ? ' aria-current="true"' : ""}><span class="yfolder__tn">${String(no).padStart(2, "0")}</span><span class="yfolder__tt">${esc(tname.replace(/^\d+\s*-\s*/, ""))}</span></button>`;
    };
    const d = desc ? plainText(it.description) : "";
    return `<div class="yfolder ylift${coll ? " yfolder--coll" : ""}"${key ? ` data-folder="${esc(key)}"` : ""}>
      ${coll && n ? `<div class="yfolder__tabs" role="toolbar" aria-label="Tracks in ${esc(name)}" style="--n:${n}">${list.map(tab).join("")}</div>` : ""}
      <div class="ycard ysel yfolder__card">
        ${open ? `<button type="button" class="yfolder__open" ${open.attrs || ""} aria-label="${esc(open.label || `Open ${name}${coll ? `, a collection of ${all} tracks` : ""}`)}"></button>` : ""}
        <div class="yfolder__head">${sw}<div class="yfolder__tt"><h3 class="yfolder__name">${esc(name)}${coll && count ? ` <span class="yfolder__n">(${all} track${all === 1 ? "" : "s"})</span>` : ""}</h3>${m ?? cardMeta(it, { parts: ["status", "date"] })}</div></div>
        ${d ? `<p class="yfolder__desc">${esc(d)}</p>` : ""}
        <div class="yfolder__foot"><div class="yfolder__links">${links}</div>${action}</div>
      </div>
    </div>`;
  }
  // touch: tabs that overlap to under 44px can't be tapped one by one → the strip opens the folder instead
  const coarse = matchMedia("(pointer: coarse)");
  // i5 · music (memory): a strip that left the page (a re-render) is unobserved on its last (0×0) notification
  const tabsRO = new ResizeObserver((es) => es.forEach((e) => (e.target.isConnected ? fitTabs(e.target) : tabsRO.unobserve(e.target))));
  function fitTabs(strip) {
    // i5 · music: tabs sit by `translate` now (they re-pack as filters hide some), so the step comes from the strip
    const t = [...strip.querySelectorAll(".yfolder__tab:not(.is-out)")];
    const tw = t[0]?.offsetWidth || 0, n = t.length, W = strip.clientWidth;
    const step = n > 1 ? Math.min((W - tw) / (n - 1), tw * 0.74) : Infinity;
    strip.classList.toggle("is-dense", coarse.matches && step < 44);
  }
  coarse.addEventListener?.("change", () => $$(".yfolder__tabs").forEach(fitTabs));

  /* ============================================================
     YEAR RAIL — a sticky column of year pills beside one continuous flow
     (no row break per year, so years with one release don't leave holes).
     The year at the top of the view is selected (rope); a pill jumps there.
     Yarn.yearRail(host, listEl, { item: "[data-year]", top }) → { refresh(), spy() }
     ============================================================ */
  function yearRail(host, list, { item = "[data-year]", label = "Jump to a year", top = 24 } = {}) {
    host.classList.add("yrail");
    host.setAttribute("aria-label", label);
    if (host.tagName !== "NAV") host.setAttribute("role", "navigation");
    const items = () => $$(item, list).filter((el) => !el.hidden && !el.closest("[hidden]"));
    let cur = null, raf = 0, lock = 0;
    function build() {
      const counts = new Map();
      for (const el of items()) counts.set(el.dataset.year, (counts.get(el.dataset.year) || 0) + 1);
      host.innerHTML = `<ol class="yrail__list">${[...counts].map(([y, n]) => `<li><a class="yyear yrail__y ylift ysel" href="#y-${esc(y)}" data-year="${esc(y)}" aria-current="false">${esc(y)}<span class="yyear__n"><span class="sr-only">, </span>${n}<span class="sr-only"> item${n === 1 ? "" : "s"}</span></span></a></li>`).join("")}</ol>`;
      cur = null; spy();
    }
    function mark(y) {
      if (y === cur) return;
      cur = y;
      $$(".yrail__y", host).forEach((a) => a.setAttribute("aria-current", String(a.dataset.year === y)));
    }
    function spy() {
      raf = 0;
      if (lock > performance.now() || !isShown(host)) return;
      const edge = top + px("--sticky-top") + 24;
      const first = items().find((el) => el.getBoundingClientRect().bottom > edge);
      mark(first ? first.dataset.year : null);
    }
    addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(spy); }, { passive: true });
    addEventListener("resize", () => { if (!raf) raf = requestAnimationFrame(spy); });
    host.addEventListener("click", (e) => {
      const a = e.target.closest(".yrail__y"); if (!a) return;
      e.preventDefault();
      const el = items().find((x) => x.dataset.year === a.dataset.year); if (!el) return;
      mark(a.dataset.year);
      const y = el.getBoundingClientRect().top + scrollY - top - px("--sticky-top");
      lock = performance.now() + (reduced() ? 0 : 700);
      scrollTo({ top: Math.max(0, y), behavior: reduced() ? "auto" : "smooth" });
      sound("tap", { el: a });
    });
    build();
    return { el: host, refresh: build, spy, get current() { return cur; } };
  }

  /* ============================================================
     SLOT (i4 · chrome; round 2 · mobile chrome) — phones: the strip just above the bottom nav (kit/yarn.css
     "BOTTOM CHROME": --yslot-gap above it, never under it) holds ONE open thing at a time: the player's bar or the
     search bar. The other one waits on the up line above it, smaller.
     html[data-yslot] = the owner ("player" | "search" | none); window "yarn:slot" { owner } on change.
     kit/player.js speaks the same protocol (it also works without the kit); ?mnav=spool reads it too.
     ============================================================ */
  const slot = {
    get owner() { return html.dataset.yslot || ""; },
    claim(owner) { if (html.dataset.yslot === owner) return; html.dataset.yslot = owner; dispatchEvent(new CustomEvent("yarn:slot", { detail: { owner } })); },
    release(owner) { if (html.dataset.yslot !== owner) return; delete html.dataset.yslot; dispatchEvent(new CustomEvent("yarn:slot", { detail: { owner: "" } })); },
  };

  /* ============================================================
     FAB ⇄ SLOT (i4 round 2 · mobile chrome) — phones. Built on iteration 3's player: the knob (a quiet white
     button) rests on the row (the slot's centre line; left of the player's disc when one shows). Opening it unrolls
     the search bar into the slot out of the knob, the way the disc unrolls into the player's bar: one spring
     (interruptible: a second tap turns it around from where it is on screen), the cloth clipped from the knob's
     circle to the slot, the knob riding to the bar's right end, where a tap (⌄) folds the bar back into it. Drag the
     bar right or down to fold it, like the player's bar. `.body` = just the search line; `.float` = a row floating
     on the up line while it's open (the filter chips). It claims Yarn.slot: the player's bar folds into its disc,
     which waits above, smaller; opening the player closes this. The knob's spots are CSS (kit/yarn.css).
     const f = Yarn.fab({ icon, label, title, lift, owner }) →
       { el, btn, panel, body, float, open({ instant }), close({ instant, focus }), isOpen, badge(n, aria), count(text), away(on), destroy() }
     ============================================================ */
  function fab({ icon = "ph-magnifying-glass", label = "Search", title = "", host = null, lift = 0, owner = "search" } = {}) {
    const id = uid("fab");
    const el = document.createElement("div");
    el.className = "yfab";
    if (lift) el.style.setProperty("--yfab-lift", lift + "px"); // stack above another FAB (Studio's "New")
    el.hidden = true;
    el.innerHTML = `<div class="yfab__float" hidden></div>
      <section class="yfab__panel" id="${id}" aria-label="${esc(title || label)}" tabindex="-1" hidden>
        <span class="yfab__shade" aria-hidden="true"></span>
        <div class="yfab__cloth"><span class="yfab__stitch" aria-hidden="true"></span><div class="yfab__body"></div></div>
        <p class="sr-only yfab__count" aria-live="polite"></p></section>
      <button type="button" class="yfab__btn" aria-expanded="false" aria-controls="${id}" aria-label="${esc(label)}"><i class="ph-bold ${icon}" aria-hidden="true"></i><i class="ph-bold ph-caret-down yfab__ic-x" aria-hidden="true"></i><span class="ychip__n" aria-hidden="true"></span></button>`;
    (host || layer() || document.body).appendChild(el); // i6 · mobile (B2): on the floating layer
    const btn = $(".yfab__btn", el), panel = $(".yfab__panel", el), body = $(".yfab__body", el), float = $(".yfab__float", el), countEl = $(".yfab__count", el);
    const cloth = $(".yfab__cloth", el), shade = $(".yfab__shade", el), stitch = $(".yfab__stitch", el);
    const lerp = (a, b, t) => a + (b - a) * t, smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
    const project = (v) => ((v / 1000) * 0.998) / (1 - 0.998); // px a flick still travels (Apple's projection)
    let isOpen = false, g = null, swallow = false;
    // p: 0 = the knob at rest, 1 = the bar fills the slot. Each frame the clip starts from wherever the knob is
    // (its CSS transition carries it between its spots), so the bar always grows out of, and folds into, the knob.
    const sp = new Spring(0, { rest: 0.0015, onUpdate: paint });
    function paint(p) {
      if (panel.hidden) return;
      const pr = panel.getBoundingClientRect(), kr = btn.getBoundingClientRect();
      const W = pr.width, H = pr.height, r = kr.width / 2, kx = kr.left + r - pr.left, ky = kr.top + kr.height / 2 - pr.top;
      const q = clamp(p, 0, 1), f = (n) => n.toFixed(2);
      const T = lerp(ky - r, 0, p), Rr = lerp(W - kx - r, 0, p), B = lerp(H - ky - r, 0, p), L = lerp(kx - r, 0, p), rad = lerp(r, 20, q);
      const rest = !sp.moving && !g && p >= 1; // open and still: no clip, so suggestions / Browse can open out of it
      cloth.style.clipPath = rest ? "" : `inset(${f(T)}px ${f(Rr)}px ${f(B)}px ${f(L)}px round ${f(rad)}px)`;
      Object.assign(shade.style, rest ? { top: "", right: "", bottom: "", left: "", borderRadius: "", opacity: "" }
        : { top: f(T) + "px", right: f(Rr) + "px", bottom: f(B) + "px", left: f(L) + "px", borderRadius: f(rad) + "px", opacity: String(smooth(p / 0.25)) });
      Object.assign(stitch.style, rest ? { top: "", right: "", bottom: "", left: "", borderRadius: "", opacity: "" }
        : { top: f(T + 6) + "px", right: f(Rr + 6) + "px", bottom: f(B + 6) + "px", left: f(L + 6) + "px", borderRadius: f(Math.max(2, rad - 6)) + "px", opacity: String(smooth((p - 0.15) / 0.5)) });
      body.style.opacity = rest ? "" : String(smooth((p - 0.28) / 0.5));
      body.style.transform = rest ? "" : `translateX(${f((1 - q) * 26)}px)`;
      float.style.opacity = rest ? "" : String(smooth((p - 0.35) / 0.5));
      float.style.transform = rest ? "" : `translateY(${f((1 - q) * 10)}px)`;
      float.style.pointerEvents = isOpen ? "" : "none";
    }
    function settle(p) {
      if (p <= 0 && !isOpen) { panel.hidden = true; float.hidden = true; float.style.pointerEvents = ""; }
      else paint(p);
    }
    function fitKeyboard() {
      const vv = window.visualViewport;
      if (!vv) return;
      // the on-screen keyboard covers the nav: the bar (+ knob + chips) rides up to sit just above the keyboard
      const slotB = innerHeight - px("--yslot-b"), kbTop = vv.height + vv.offsetTop;
      const lift = isOpen && kbTop < slotB - 2 ? Math.round(slotB - kbTop + 8) : 0;
      if (lift) el.style.setProperty("--yfab-kb", lift + "px"); else el.style.removeProperty("--yfab-kb");
    }
    function outside(e) { if (!el.contains(e.target)) close(); }
    function onSlot(e) { if (e.detail.owner && e.detail.owner !== owner) close(); }
    function open({ instant = false, velocity = null } = {}) {
      if (isOpen) return;
      isOpen = true;
      const was = panel.hidden;
      panel.hidden = false; float.hidden = !float.childElementCount;
      el.classList.add("is-open");
      btn.setAttribute("aria-expanded", "true");
      slot.claim(owner);
      if (was) paint(sp.value); // first frame: the clip is already the knob's circle (no flash of the whole bar)
      sp.to(1, { response: 0.36, damping: 1, velocity, immediate: instant, onRest: settle });
      if (!instant && !reduced()) sound("open", { el: btn });
      document.addEventListener("pointerdown", outside, true);
      const input = $(".ysearch__input", panel);
      if (input && matchMedia("(pointer: fine)").matches) input.focus({ preventScroll: true });
      else panel.focus({ preventScroll: true });
      fitKeyboard();
    }
    function close({ instant = false, focus = false, velocity = null } = {}) {
      if (!isOpen) return;
      isOpen = false;
      document.removeEventListener("pointerdown", outside, true);
      btn.setAttribute("aria-expanded", "false");
      el.classList.remove("is-open");
      slot.release(owner);
      fitKeyboard();
      const back = focus || el.contains(document.activeElement);
      paint(sp.value);
      sp.to(0, { response: 0.34, damping: 1, velocity, immediate: instant, onRest: settle });
      if (!instant && !reduced()) sound("close", { el: btn });
      // i6 · mobile (B1): the knob takes focus back for keys; after a tap, focus just leaves the folded bar (no ring)
      if (back) { if (viaKey()) btn.focus({ preventScroll: true }); else if (el.contains(document.activeElement)) document.activeElement.blur(); }
    }
    // drag the bar (or the knob) right or down: it folds into the knob, finger-tracked; release hands the velocity
    // to the spring and projects it (≥ half-way, or a flick, folds). On the field only a downward drag counts.
    function gDown(e) {
      if (!isOpen || e.button > 0 || e.target.closest(".ysearch__pop, .ysearch__clear, .ytoken, .ybrowse")) return;
      g = { id: e.pointerId, x: e.clientX, y: e.clientY, mode: null, field: !!e.target.closest("input"), hist: [[e.timeStamp, e.clientX, e.clientY]], src: e.currentTarget };
    }
    function gMove(e) {
      if (!g || e.pointerId !== g.id) return;
      const dx = e.clientX - g.x, dy = e.clientY - g.y;
      if (!g.mode) {
        if (Math.hypot(dx, dy) < 8) return;
        const ax = Math.abs(dx), ay = Math.abs(dy);
        g.mode = dy > 0 && ay >= ax ? "v" : !g.field && dx > 0 && ax > ay ? "h" : null;
        if (!g.mode) { g = null; return; }
        try { g.src.setPointerCapture(e.pointerId); } catch (_) {}
        g.x = e.clientX; g.y = e.clientY; g.p0 = sp.value; // track 1:1 from here: no jump
        g.travel = g.mode === "h" ? Math.max(160, panel.getBoundingClientRect().width - 60) : 120;
        sp.stop();
        return;
      }
      if (e.cancelable) e.preventDefault();
      g.hist.push([e.timeStamp, e.clientX, e.clientY]);
      while (g.hist.length > 2 && e.timeStamp - g.hist[0][0] > 100) g.hist.shift();
      sp.set(clamp(g.p0 - Math.max(0, g.mode === "h" ? dx : dy) / g.travel, 0, 1));
    }
    function gUp(e) {
      if (!g || e.pointerId !== g.id) return;
      const d = g; g = null;
      if (!d.mode) return;
      swallow = true; setTimeout(() => { swallow = false; }, 0);
      const h = d.hist, [t0, x0, y0] = h[0], [t1, x1, y1] = h[h.length - 1], dt = Math.max(1, t1 - t0);
      const v = (d.mode === "h" ? x1 - x0 : y1 - y0) / dt * 1000; // px/s along the drag (+ = folding)
      if (sp.value - project(Math.max(0, v)) / d.travel < 0.5) close({ velocity: -v / d.travel });
      else sp.to(1, { response: 0.36, damping: v < -700 ? 0.82 : 1, velocity: -v / d.travel, onRest: settle });
    }
    for (const t of [cloth, btn]) {
      t.addEventListener("pointerdown", gDown);
      t.addEventListener("pointermove", gMove);
      t.addEventListener("pointerup", gUp);
      t.addEventListener("pointercancel", gUp);
    }
    btn.addEventListener("click", (e) => { if (swallow) { e.preventDefault(); return; } isOpen ? close({ focus: true }) : open(); });
    el.addEventListener("keydown", (e) => { if (e.key === "Escape" && !e.defaultPrevented && isOpen) { e.stopPropagation(); close({ focus: true }); } });
    window.visualViewport?.addEventListener("resize", fitKeyboard);
    addEventListener("yarn:slot", onSlot);
    return {
      el, btn, panel, body, float, countEl, open, close,
      get isOpen() { return isOpen; },
      badge(n, aria) { $(".ychip__n", btn).textContent = n || ""; if (aria) btn.setAttribute("aria-label", aria); },
      count(text) { if (countEl.textContent !== text) countEl.textContent = text; },
      away(on) { el.classList.toggle("is-away", !!on); },
      destroy() {
        close({ instant: true });
        sp.stop();
        document.removeEventListener("pointerdown", outside, true);
        window.visualViewport?.removeEventListener("resize", fitKeyboard);
        removeEventListener("yarn:slot", onSlot);
        el.remove();
      },
    };
  }

  /* ============================================================
     LIST TOOLS — one mobile search/filter pattern for every list page (?msearch=bar|fab)
     Yarn.listTools(F, { tools, search, row, sticky, label, title, count, stickyDesk, lift })
       tools  = the .ytools element under the header (search line + filter row live here by default)
       search, row = the hosts Yarn.search / Yarn.filterRow were built on
       sticky = element(s) that get --sticky-top (the list: year pills + detail bars stack under the row)
     fab (i4 default): on phones the search line moves into the FAB's slot (just the field, right on the nav) and the
          filter row floats above it while it's open, its "All" turning into a ✕ (clear every filter) once something is
          on; the FAB shows a count.
          i5 (MO4–MO6): the field in the slot holds text only (no tokens, no ✕ of its own: the All/✕ circle clears text +
          filters), and the active filters sit in the floating row (?mactive=start|end).
     bar: desktop and phones keep the search line on top; on phones the filter row is sticky.
     → { fab, place(), mode, isFab, destroy() }
     ============================================================ */
  function listTools(F, { tools, search: sHost, row: rHost, sticky = [], label = "Search and filter", title = "Find", count = null, stickyDesk = false, lift = 0 } = {}) {
    const desk = matchMedia("(min-width: 960px)");
    const targets = asArr(sticky).filter(Boolean);
    let fabApi = null, unStick = null;
    const isFab = () => OPT.msearch === "fab" && !desk.matches;
    function ensureFab() {
      if (!fabApi) fabApi = fab({ icon: "ph-magnifying-glass", label, title, lift });
      return fabApi;
    }
    function syncTop() {
      const on = !!rHost && rHost.classList.contains("yfilter--sticky") && rHost.isConnected && !rHost.closest(".yfab");
      for (const t of targets) on ? t.style.setProperty("--sticky-top", `${Math.round(rHost.offsetHeight)}px`) : t.style.removeProperty("--sticky-top");
    }
    const ro = rHost ? new ResizeObserver(syncTop) : null;
    ro?.observe(rHost);
    // floating over the slot, the row's "All" doubles as the ✕ that clears every filter (same click: F.clear)
    function paintAll() {
      const all = rHost && $(".ychip[data-all]", rHost);
      if (!all) return;
      const floating = rHost.classList.contains("yfilter--float");
      if (floating && !$(".yfilter__x", all)) all.insertAdjacentHTML("afterbegin", '<i class="ph-bold ph-x yfilter__x" aria-hidden="true"></i>');
      // i5 (MO5): the field in the slot has no ✕ of its own any more, so typed text also turns All into the ✕ (F.clear empties both)
      if (floating && F.q.trim()) all.setAttribute("aria-pressed", "false");
      const clears = floating && all.getAttribute("aria-pressed") === "false";
      if (clears) { all.setAttribute("aria-label", "Clear all filters"); all.title = "Clear all filters"; }
      else if (all.hasAttribute("aria-label")) { all.removeAttribute("aria-label"); all.removeAttribute("title"); }
    }
    function paint() {
      // the FAB's badge counts what's on: every pressed filter + a typed search (i5 MO6: the active filters themselves
      // sit in the floating chip row, paintOn; i4's strip above the list went with ?mactive=top in i7)
      let on = F.q.trim() ? 1 : 0;
      for (const g of F.groups) on += [...F.state[g.key]].length;
      paintOn();
      if (fabApi) {
        const n = on, shown = count ? count() : "";
        fabApi.badge(n, `${label}${n ? `, ${n} active${shown ? `, ${shown}` : ""}` : ""}`);
        fabApi.count(shown);
      }
      queueMicrotask(paintAll); // after the row's own paint (it sets the All chip's aria-pressed)
    }
    // i5 (MO5 · ?mactive): phones put the active filters of groups the row doesn't show (stack, tags, kind…) into the
    // floating chip row as pressed, removable chips: right after the All/✕ circle (start, default since the i5 review:
    // at the end they sat off-screen at 390) or at its end (the owner's first idea).
    // The row's own click handler removes them (they are ordinary .ychip[data-g] chips).
    function paintOn() {
      const scroll = rHost && $(".yfilter__scroll", rHost);
      if (!scroll) return;
      let box = $(".yfilter__on", scroll);
      const rowKeys = F._row?.host === rHost ? F._row.groups : F.groups.filter((g) => g.row).map((g) => g.key);
      const html = isFab()
        ? F.groups.filter((g) => !rowKeys.includes(g.key)).flatMap((g) => [...F.state[g.key]].map((v) => chip(g, F.info(g.key, v), { pressed: true, attrs: `aria-label="Remove filter: ${esc(F.label(g.key, v))} (${esc(g.label)})"` }))).join("")
        : "";
      if (!html) { box?.remove(); return; }
      if (!box) {
        box = document.createElement("span");
        box.className = "yfilter__on";
        box.innerHTML = '<span class="yfilter__div" aria-hidden="true"></span><div class="yfilter__grp" role="group" aria-label="Active filters"></div>';
      }
      const all = $(".ychip[data-all]", scroll);
      if (OPT.mactive === "start" && all) { if (all.nextSibling !== box) all.after(box); }
      else if (scroll.lastElementChild !== box) scroll.append(box);
      const grp = box.lastElementChild;
      if (grp.innerHTML !== html) grp.innerHTML = html;
    }
    function place() {
      const fabNow = isFab();
      if (fabNow) {
        const f = ensureFab();
        if (sHost) f.body.append(sHost);   // the slot: just the field, near the thumb
        if (rHost) f.float.append(rHost);  // the chips float above it while it's open
        f.el.hidden = false;
      } else {
        tools.append(...[sHost, rHost].filter(Boolean));
        if (fabApi) { fabApi.close({ instant: true }); fabApi.el.hidden = true; }
      }
      rHost?.classList.toggle("yfilter--float", fabNow);
      tools.classList.toggle("ytools--fab", fabNow);
      const stick = !!rHost && !fabNow && (stickyDesk || !desk.matches);
      rHost?.classList.toggle("yfilter--sticky", stick);
      unStick?.(); unStick = null;
      if (stick) unStick = watchStuck(rHost); else rHost?.classList.remove("is-stuck");
      sHost?._ysearch?.refresh(); // i5 (MO4): tokens leave the field in the phone slot, come back on desktop
      syncTop(); paint();
    }
    const offF = F.on(paint);
    desk.addEventListener("change", place);
    place();
    if (params.get("fab") === "open" && isFab()) requestAnimationFrame(() => fabApi?.open({ instant: true }));
    // views that re-render in place (Studio): when the tools leave the page, so do the FAB and the listeners
    const entry = { tools, destroy() { LISTTOOLS.delete(entry); offF(); desk.removeEventListener("change", place); unStick?.(); ro?.disconnect(); fabApi?.destroy(); fabApi = null; } };
    LISTTOOLS.add(entry);
    return { get fab() { return fabApi; }, place, paint, get mode() { return OPT.msearch; }, isFab, destroy: entry.destroy };
  }
  const LISTTOOLS = new Set();
  const sweepListTools = () => { for (const e of [...LISTTOOLS]) if (!e.tools.isConnected) e.destroy(); };
  /* i9 · polish (S1) · whenGone(el, fn): run fn once el has been in the page and then left it (swept with the list
     tools, on the next DOM change). For listeners a part puts on document / window for its own element: Studio throws
     its whole view away on every render, and those used to stay behind, one more per render. */
  const GONE = new Set();
  function whenGone(el, fn) { if (el && fn) GONE.add({ el, fn, seen: el.isConnected }); }
  const sweepGone = () => { for (const g of [...GONE]) { if (g.el.isConnected) g.seen = true; else if (g.seen) { GONE.delete(g); try { g.fn(); } catch (_) {} } } };

  /* ============================================================
     TOAST (i5 · chrome · MO8) — one at a time, Undo, readable over the open player (--z-toast)
     Yarn.toast({ icon: "list-plus", html: "<b>Song</b> is in the queue", undo: () => …, ms: 3400 }) → { el, hide() }
     Any element with .ytoast gets the kit placement (every page calls Yarn.toast since i7 · C1). Phones (?toast):
       top (default) = under the top edge of the screen (below the top strip while it's shown)
       bottom = in the slot above the nav; while it shows, the floating player (bar / disc) and the search knob, bar and
                chip row ride up by one slot (html:has(.ytoast:not([hidden])) → --ytoast-push, translate only)
     Desktop: bottom centre, above the player's bar.
     ============================================================ */
  const TOAST = { el: null, t: 0, anim: null, undo: null };
  const toastFromTop = () => OPT.toast === "top" && matchMedia("(max-width: 959px)").matches;
  function hideToast() {
    const el = TOAST.el;
    clearTimeout(TOAST.t);
    if (!el || el.hidden) return;
    TOAST.undo = null;
    if (reduced()) { el.hidden = true; return; }
    TOAST.anim?.cancel();
    TOAST.anim = el.animate([{ opacity: 1 }, { opacity: 0, transform: `translateY(${toastFromTop() ? -8 : 8}px)` }], { duration: 180, easing: "ease-in", fill: "forwards" });
    TOAST.anim.onfinish = () => { el.hidden = true; TOAST.anim?.cancel(); TOAST.anim = null; };
  }
  // i7 · studio (S1): `action` renames the one button (default "Undo"; Studio's "View", "Retry"), same slot + behaviour
  function toast({ icon = "info", html: body = "", undo = null, ms = 3400, action = "" } = {}) {
    let el = TOAST.el;
    if (!el || !el.isConnected) {
      el = TOAST.el = document.createElement("div");
      el.className = "ytoast";
      el.setAttribute("role", "status");
      el.hidden = true;
      (layer() || document.body).appendChild(el); // i6 · mobile (B2): on the floating layer
      el.addEventListener("pointerenter", () => clearTimeout(TOAST.t));
      el.addEventListener("pointerleave", () => { clearTimeout(TOAST.t); TOAST.t = setTimeout(hideToast, 1800); });
      el.addEventListener("click", (e) => {
        if (!e.target.closest(".ytoast__undo")) return;
        const u = TOAST.undo; TOAST.undo = null; u?.(); sound(e.target.closest(".ytoast__undo").dataset.act ? "tap" : "tag-remove"); hideToast();
      });
    }
    clearTimeout(TOAST.t);
    TOAST.undo = undo;
    el.innerHTML = `<i class="ph-bold ph-${esc(icon)}" aria-hidden="true"></i><span class="ytoast__t">${body}</span>${undo ? `<button type="button" class="btn btn--sm btn--ghost ytoast__undo"${action ? ` data-act="${esc(action)}"` : ""}>${esc(action || "Undo")}</button>` : ""}`;
    const fresh = el.hidden;
    el.hidden = false;
    TOAST.anim?.cancel();
    if (!reduced()) {
      const sp = springEasing({ response: 0.34 });
      TOAST.anim = el.animate(fresh ? [{ opacity: 0, transform: `translateY(${toastFromTop() ? -12 : 12}px) scale(.96)` }, { opacity: 1, transform: "none" }] : [{ transform: "scale(.97)" }, { transform: "none" }], { duration: sp.duration, easing: sp.easing });
    }
    TOAST.t = setTimeout(hideToast, ms);
    return { el, hide: hideToast };
  }
  toast.hide = hideToast;

  /* == i6 · mobile · THE FLOATING LAYER (B2) · keyboard-only focus rings (B1) · the kit hint (X3) · a steady hover (X5) ==
     B2 (owner: "these floating elements on their own plane of existance shouldnt be effected by the rest of the page and
     should be layered on top of everything else"). Yarn.layer() = one <div class="ylayer"> at the end of <body>: a fixed,
     zero-size box with its own stacking context (kit/yarn.css --z-layer). Every floater lives in it: the sections pill
     (moved out of <yarn-nav> on each render), the search knob + bar + chip row + Browse (fab), the player (kit/player.js
     mounts <yarn-player> here), toasts, the hint, and popovers / sheets pages append to <body> (adopted below by class:
     Music's tip, long-press menu and notes, Home's unmute callout). Nothing in the page can paint over it or move it. */
  let LAYER = null;
  function layer() {
    if (LAYER && LAYER.isConnected) return LAYER;
    if (!document.body) return null;
    LAYER = document.querySelector("body > .ylayer") || Object.assign(document.createElement("div"), { className: "ylayer" });
    if (!LAYER.isConnected) document.body.appendChild(LAYER);
    return LAYER;
  }
  // floaters a page appends straight to <body> join the layer (Music's .mu-* popovers, Home's callout, any .ytoast)
  const ADOPT = ".ytoast, .mu-tip, .mu-menu, .mu-notes, .mu-notes-scrim, .hcall, .hcall-ring, yarn-player";
  function adopt() {
    const L = layer(); if (!L) return;
    for (const el of [...document.body.children]) if (el !== L && el.matches(ADOPT)) L.appendChild(el);
  }
  const startLayer = () => { adopt(); new MutationObserver(adopt).observe(document.body, { childList: true }); };
  if (document.body) startLayer(); else document.addEventListener("DOMContentLoaded", startLayer, { once: true });

  /* B1 (the heavy black ring on a Browse chip): focus rings are for keyboard focus only. html[data-yinput] = "key" after
     a key press (no modifier), "pointer" after a mouse / touch / pen press (the start). kit/yarn.css hides the ring
     (--focus) while it's "pointer", whatever a browser's own :focus-visible guess (WebKit shows it on script focus after
     a tap). The kit's own script focus follows the same rule: a chip / menu item is focused for keys only. */
  html.dataset.yinput = "pointer";
  const viaKey = () => html.dataset.yinput === "key";
  addEventListener("keydown", (e) => { if (!e.metaKey && !e.ctrlKey && !e.altKey && e.key !== "Shift") html.dataset.yinput = "key"; }, true);
  addEventListener("pointerdown", () => { html.dataset.yinput = "pointer"; }, true);

  /* X3 (owner: "the links on a grid card should have our normal hint popup that shows sooner … the tabs on music have
     the hint im referrng to"). One kit hint (.ytip, Music's tab tip look) for every icon-only link / button: mouse
     hover (90ms; at once while one is already up) or keyboard focus; never on touch. Text: data-hint, else the title
     (taken off the element so the browser's slow native one never shows too), else aria-label. Skips: stretched
     openers and anything bigger than an icon button, folder tabs (Music's own tip), [data-nohint], the review tools. */
  // (i6 fix P2-1: a focusable icon-only fact) · i7 · projects: any card fact with a hint, shown only while its word is
  // hidden (icon-only, ?cardfacts=icons, a joined status + date's word, a tight timeline's fitFacts), whatever its width
  const HINT_SEL = "a, button, [role='button'], .yfact[data-hint]";
  const factWordHidden = (f) => { const w = f.querySelector(":scope > .yfact__l > .yfact__w") || f.querySelector(":scope > .yfact__l"); return !w || w.getBoundingClientRect().width <= 1; };
  const HINT_SKIP = ".yfolder__tab, .yfolder__open, .mu-trk__btn, .yp-disc, .yp-qg, [data-nohint], .mockpanel, .yrv-root, .ytr";
  const H = { el: null, for: null, t: 0, warm: 0 };
  function hintText(a) {
    if (a.title) { a.dataset.hintT = a.title; a.removeAttribute("title"); }
    return (a.dataset.hint || a.dataset.hintT || a.getAttribute("aria-label") || "").replace(/\s*\(opens in a new tab\)$/i, "").trim();
  }
  function hintFor(t) {
    const a = t?.closest?.(HINT_SEL);
    if (!a || a.closest(HINT_SKIP) || a.disabled || a.getAttribute("aria-disabled") === "true") return null;
    if (a.matches(".yfact")) return a.classList.contains("is-match") || !factWordHidden(a) ? null : a; // (its label is for screen readers until it matches)
    else if ((a.innerText || "").trim() || a.querySelector("[class*='__tip']")) return null; // its own words / its own tip (‹ › in the top bar)
    const r = a.getBoundingClientRect();
    return r.width && r.width <= 64 && r.height <= 64 ? a : null;
  }
  function showHint(a) {
    const text = hintText(a);
    if (!text) return;
    const L = layer(); if (!L) return;
    if (!H.el || !H.el.isConnected) {
      H.el = Object.assign(document.createElement("div"), { className: "ytip", hidden: true });
      H.el.setAttribute("role", "tooltip"); H.el.setAttribute("aria-hidden", "true"); // the control's own name says it
      L.appendChild(H.el);
    }
    const tip = H.el;
    H.for = a;
    if (tip.textContent !== text) tip.textContent = text;
    tip.hidden = false;
    const r = a.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
    // i7 · music (B3): data-hint-at="left|right" opens it beside the control (a cluster's hint points away from its
    // neighbours, e.g. the player's long-press actions); it falls back to above when that side has no room
    const at = a.dataset.hintAt, side = (at === "left" && r.left - w - 8 >= 8) || (at === "right" && r.right + w + 8 <= innerWidth - 8) ? at : "";
    if (side) {
      tip.style.translate = `${Math.round(side === "left" ? r.left - w - 8 : r.right + 8)}px ${Math.round(clamp(r.top + r.height / 2 - h / 2, 8, innerHeight - h - 8))}px`;
      tip.classList.remove("is-below");
      requestAnimationFrame(() => { if (H.for === a) tip.classList.add("is-on"); });
      return;
    }
    const below = r.top - h - 8 < 8;
    const x = clamp(r.left + r.width / 2 - w / 2, 8, innerWidth - w - 8), y = below ? r.bottom + 8 : r.top - h - 8;
    tip.style.translate = `${Math.round(x)}px ${Math.round(y)}px`;
    tip.classList.toggle("is-below", below);
    requestAnimationFrame(() => { if (H.for === a) tip.classList.add("is-on"); });
  }
  function hideHint(now = false) {
    clearTimeout(H.t);
    if (!H.el || H.el.hidden) { H.for = null; return; }
    H.warm = performance.now();
    const go = () => { if (H.el) { H.el.hidden = true; H.el.classList.remove("is-on"); } H.for = null; };
    if (now) go(); else { H.el.classList.remove("is-on"); H.t = setTimeout(go, 120); }
  }
  document.addEventListener("pointerover", (e) => {
    if (e.pointerType === "touch") return;
    const a = hintFor(e.target);
    if (!a) { if (H.for && !H.for.contains(e.target)) hideHint(); return; }
    if (a === H.for) { clearTimeout(H.t); H.el?.classList.add("is-on"); return; }
    clearTimeout(H.t);
    const warm = (H.el && !H.el.hidden) || performance.now() - H.warm < 400;
    H.t = setTimeout(() => showHint(a), warm ? 0 : 90);
  });
  document.addEventListener("pointerout", (e) => {
    if (e.pointerType === "touch" || !H.for) { if (!H.for) clearTimeout(H.t); return; }
    if (!H.for.contains(e.relatedTarget)) hideHint();
  });
  document.addEventListener("focusin", (e) => {
    const a = hintFor(e.target);
    if (a && viaKey() && a.matches(":focus-visible")) { clearTimeout(H.t); showHint(a); }
    else if (H.for) hideHint(true);
  });
  document.addEventListener("focusout", (e) => { if (H.for && e.target === H.for) hideHint(true); });
  for (const ev of ["pointerdown", "scroll"]) addEventListener(ev, () => { if (H.for || H.t) { clearTimeout(H.t); hideHint(true); } }, { capture: true, passive: true });
  addEventListener("keydown", (e) => { if (e.key === "Escape" && H.for) hideHint(true); }, true);
  /* i6 fix (review P2-1): a fact that shows only its disc (.yfact--icon, or a narrow card's condensed facts: Music)
     gets the same hint on mouse hover. A card's stretched opener lies over its facts, so the pointer is matched by
     position: while the pointer is in a card with facts, one rAF-throttled pointermove reads its few facts' boxes. */
  const FC = { card: null, x: 0, y: 0, raf: 0, t: 0, pend: null };
  const bareFact = (f) => !f.classList.contains("is-match") && factWordHidden(f); // i7: or a joined fact's word (.yfact__w)
  function factHint() {
    FC.raf = 0;
    const f = FC.card?.isConnected ? $$(".ymeta--facts .yfact", FC.card).find((el) => { const r = el.getBoundingClientRect(); return FC.x >= r.left && FC.x <= r.right && FC.y >= r.top && FC.y <= r.bottom; }) : null;
    const hit = f && bareFact(f) ? f : null;
    if (hit && (hit === H.for || hit === FC.pend)) return;
    clearTimeout(FC.t); FC.pend = null;
    if (!hit) { if (H.for?.matches?.(".yfact")) hideHint(); return; }
    if (!hit.dataset.hint) hit.dataset.hint = hit.querySelector(":scope > .yfact__l")?.textContent.trim() || "";
    const warm = (H.el && !H.el.hidden) || performance.now() - H.warm < 400;
    FC.pend = hit;
    FC.t = setTimeout(() => { FC.pend = null; if (FC.card?.contains(hit)) showHint(hit); }, warm ? 0 : 90);
  }
  document.addEventListener("pointerover", (e) => {
    if (e.pointerType !== "mouse") return;
    const c = e.target.closest?.(".ygroup__item, .ytl__item, li, .ycard"), card = c && c.querySelector(".ymeta--facts .yfact") ? c : null;
    if (card !== FC.card) { clearTimeout(FC.t); FC.pend = null; FC.card = card; }
  }, { passive: true });
  document.addEventListener("pointermove", (e) => {
    if (!FC.card || e.pointerType !== "mouse") return;
    FC.x = e.clientX; FC.y = e.clientY;
    if (!FC.raf) FC.raf = requestAnimationFrame(factHint);
  }, { passive: true });
  for (const ev of ["pointerdown", "scroll"]) addEventListener(ev, () => { clearTimeout(FC.t); FC.pend = null; }, { capture: true, passive: true });

  /* X5 (owner: "if u placed ur mouse on the edge of a card in grid it can start flickering hover and unhover state we
     need the hover boundary to be bigger so it covers both states"). A lifted .ylift rises 2px, so a pointer resting
     on its bottom edge is suddenly outside it: unhover, it drops, hover, it rises… When the pointer leaves a .ylift
     while still inside the union of its lifted and at-rest boxes, the kit holds the lift (.is-hover, the same look as
     :hover) until the pointer leaves that union. One pointermove listener, only while a card is held. */
  const hoverMQ = matchMedia("(hover: hover)");
  let held = null;
  function liftBand(el) {
    const r = el.getBoundingClientRect();
    let ty = 0;
    try { const t = getComputedStyle(el).transform; if (t && t !== "none") ty = new DOMMatrixReadOnly(t).m42; } catch (_) {}
    return { l: r.left, r: r.right, t: Math.min(r.top, r.top - ty), b: Math.max(r.bottom, r.bottom - ty) };
  }
  const inBand = (b, x, y) => x >= b.l && x <= b.r && y >= b.t - 0.5 && y <= b.b + 1;
  function letGo() {
    if (!held) return;
    held.classList.remove("is-hover");
    held = null;
    removeEventListener("pointermove", follow, true);
  }
  function follow(e) { if (held && (!held.isConnected || !inBand(liftBand(held), e.clientX, e.clientY))) letGo(); }
  document.addEventListener("pointerout", (e) => {
    if (e.pointerType !== "mouse" || !hoverMQ.matches) return;
    const el = e.target.closest?.(".ylift");
    if (!el || el === held || el.classList.contains("is-hover") || (e.relatedTarget && el.contains(e.relatedTarget))) return;
    if (!inBand(liftBand(el), e.clientX, e.clientY)) return;
    letGo();
    held = el;
    el.classList.add("is-hover");
    addEventListener("pointermove", follow, true);
  }, true);
  document.addEventListener("pointerover", (e) => { if (held && !held.contains(e.target) && e.target.closest?.(".ylift") && e.target.closest(".ylift") !== held) letGo(); }, true);
  addEventListener("scroll", letGo, { capture: true, passive: true });
  addEventListener("blur", letGo);
  document.documentElement.addEventListener("pointerleave", letGo);

  /* ============================================================
     NAV — <yarn-nav active="projects|music|thoughts|home" base="../">
     ============================================================ */
  const CAT_PATH =
    "M178.1,100.5 C174.9,91.6 175.4,83.0 178.4,74.7 C181.1,67.3 181.8,59.9 181.3,52.1 C180.5,39.1 180.3,26.1 183.9,13.4 C186.6,3.7 190.6,1.9 198.4,8.1 C205.5,13.6 211.8,20.1 217.9,26.6 C220.8,29.7 223.1,30.7 227.6,30.4 C237.3,29.7 247.2,30.1 256.9,30.7 C260.1,30.8 261.9,30.3 264.1,28.0 C271.2,20.8 278.4,13.5 286.3,7.3 C292.9,2.1 296.5,3.9 298.9,12.0 C302.6,24.7 302.8,37.7 302.0,50.7 C301.5,58.3 302.1,65.7 304.9,72.8 C311.9,91.2 306.7,106.9 293.5,120.3 C289.5,124.3 288.8,128.0 291.1,132.6 C297.8,145.8 304.1,159.2 311.4,172.1 C323.0,193.0 333.6,214.2 338.0,238.0 C344.8,274.8 339.9,308.9 314.6,338.6 C318.1,339.6 321.4,340.2 324.4,341.4 C330.5,343.8 334.0,349.4 333.5,355.4 C333.0,361.8 329.0,366.6 322.5,367.9 C317.8,368.9 312.9,369.3 308.1,369.3 C289.6,369.4 271.0,370.0 252.6,368.9 C233.7,367.9 215.5,371.8 196.9,373.4 C155.6,376.9 114.3,376.8 74.1,364.8 C65.8,362.3 57.6,358.2 50.5,353.3 C35.8,343.1 35.2,325.7 48.2,313.4 C59.3,302.9 73.4,298.1 87.8,294.3 C94.5,292.5 101.5,291.8 108.4,290.7 C110.2,290.4 112.1,290.6 113.9,290.8 C118.4,291.3 121.3,293.9 121.8,298.4 C122.3,303.1 120.2,306.8 115.6,308.0 C109.3,309.6 102.8,310.3 96.5,312.0 C89.0,314.0 81.5,316.4 74.2,319.0 C71.1,320.1 68.2,321.9 65.5,323.8 C58.1,329.1 58.2,333.8 66.4,337.8 C72.7,340.8 79.5,343.1 86.2,344.2 C120.3,349.9 154.2,349.8 187.9,341.9 C193.8,340.5 199.3,337.8 205.0,335.7 C204.9,335.2 204.8,334.7 204.7,334.2 C203.1,334.2 201.4,334.1 199.8,334.2 C190.3,334.9 180.9,335.7 171.5,336.5 C167.7,336.8 165.3,335.2 163.1,332.2 C138.2,298.6 135.8,262.1 149.5,223.7 C156.6,203.8 169.1,186.7 180.3,169.0 C186.8,158.7 192.9,148.3 196.2,136.4 C197.8,130.5 196.9,126.4 192.5,121.6 C186.9,115.5 182.9,107.8 178.1,100.5 z";
  function catSVG(cls = "", fill = "currentColor", label = "") {
    const a11y = label ? `role="img" aria-label="${esc(label)}"` : `aria-hidden="true"`;
    return `<svg class="${cls}" viewBox="30 0 320 380" ${a11y}><path fill="${fill}" d="${CAT_PATH}"/></svg>`;
  }
  const PAGES = [
    // no ?skip: Home's intro schedule decides (Simple when back within the hour, Drop later)
    { key: "home", label: "Home", href: "home/index.html", icon: "ph-house" },
    { key: "projects", label: "Projects", href: "projects/index.html", icon: "ph-folder-simple" },
    { key: "music", label: "Music", href: "music/index.html", icon: "ph-music-notes" },
    { key: "thoughts", label: "Thoughts", href: "thoughts/stitched.html", icon: "ph-cloud" },
    // i4 (owner): no Contact tab. Contact lives on Home (its icons + usernames).
  ];
  /* i4 · chrome: the sound-effects toggle (?soundui; sound.js wires every [data-sound-toggle]).
     tag (default) = a woven care label sewn into the sheet's top edge: centre on desktop, right on phones; the same
       spot on every page (Home too: it sits on the sheet, not in the nav Home hides), never in the way of navigation.
     brand = a small knit button beside the wordmark (Home has no wordmark in the nav: there it falls back to the tag).
     nav = i3: the desktop nav's top-right slot + the phone bar's last slot.
     Yarn.soundToggle() → the one that is showing (Home's "Press unmute" callout points at it). */
  const SOUND_IC = '<i class="ph-bold ph-speaker-simple-slash" aria-hidden="true"></i>';
  const SOUND_BTN = (cls, inner = SOUND_IC) => `<button type="button" class="${cls}" data-sound-toggle hidden aria-label="Sound effects">${inner}</button>`;
  const SOUND_SLOT = SOUND_BTN; // i3 name
  const SOUND_NAV = { desk: "ynav__sound", bar: "ybar__sound", top: "ytop__sound", spool: "yspool__sound" };
  function soundUI(where, active, custom = false) {
    // i7 · studio (S1, "studio also needs to match the design"): Studio's fuller nav keeps the tag too (it was the brand button)
    const ui = OPT.soundui === "brand" && active === "home" ? "tag" : OPT.soundui;
    // nav: the desktop corner + the phone nav's own spot for this ?mnav (bar's last slot · top strip's last cell · beside the spool)
    if (ui === "nav") return SOUND_NAV[where] ? SOUND_BTN(SOUND_NAV[where]) : "";
    if (ui === "brand") return where === "brand" ? SOUND_BTN("ysound ysound--brand") : "";
    // i5 (owner G2: "a mute icon would be just enough"): icon only, speaker / speaker-slash; the name stays
    // "Sound effects" (aria-label) and the state is aria-pressed + the title (kit/sound.js)
    // i6 · mobile (X2): the tag carries both icons (data-ysnd: sound.js leaves them alone); CSS shows the one for the
    // state, and while on, a hover previews off (kit/yarn.css "i6 · mobile")
    return where === "sheet" ? SOUND_BTN("ysound ysound--tag", '<i class="ph-bold ph-speaker-simple-high ysound__on" data-ysnd aria-hidden="true"></i><i class="ph-bold ph-speaker-simple-slash ysound__off" data-ysnd aria-hidden="true"></i>') : "";
  }
  // the toggle for this placement + width (for a callout or a coach mark): the one on screen, else the one that will
  // be once sound.js (async) unhides it. soundToggle.when() → Promise<el|null> once it shows (null: no WebAudio).
  const shown = (b) => !b.hidden && b.getClientRects().length && getComputedStyle(b).visibility !== "hidden";
  function soundToggle() {
    const all = $$("[data-sound-toggle]");
    const phoneNav = OPT.mnav === "top" ? ".ytop__sound" : OPT.mnav === "spool" ? ".yspool__sound" : ".ybar__sound";
    const want = OPT.soundui === "nav" ? (matchMedia("(max-width: 959px)").matches ? phoneNav : ".ynav__sound") : ".ysound";
    return all.find(shown) || all.find((b) => b.matches(want)) || null;
  }
  soundToggle.when = () => new Promise((res) => {
    const tick = (n) => {
      const b = soundToggle();
      if (b && shown(b)) return res(b);
      if (!b || (b.hidden && b.dataset.soundWired) || n > 180) return res(null);
      requestAnimationFrame(() => tick(n + 1));
    };
    tick(0);
  });
  // Both bars from one page list. A page: { key, label, href, icon, section?, tab?: bool (desktop), bar?: bool (mobile) }.
  // Defaults: the site's pages (home is the brand on desktop, not a tab).
  // Other apps (Studio) pass their own list + brand/label/extra; `section` dyes the felt dot.
  function navHTML({ active = "", base = "../", pages = null, brand = null, label = "Main", badge = "", extra = "", material = OPT.nav, mnav = OPT.mnav } = {}) {
    const list = pages || PAGES.map((p) => ({ ...p, href: siteURL(p.href), tab: p.key !== "home" })); // (i9: the site lives in i8)
    const cur = (p) => (p.key === active ? ' aria-current="page"' : "");
    const sec = (p) => esc(p.section || p.key);
    const ico = (p) => `<span class="ydot" aria-hidden="true"><i class="${p.key === active ? "ph-fill" : "ph-bold"} ${p.icon}"></i></span>`;
    const tab = (p) => `<li><a class="ynav__tab ysel ylift" data-section="${sec(p)}" href="${esc(p.href)}"${cur(p)}>${ico(p)}<span>${esc(p.label)}</span></a></li>`;
    const item = (p) => `<a class="ybar__item ysel" data-section="${sec(p)}" href="${esc(p.href)}"${cur(p)}>${ico(p)}<span>${esc(p.label)}</span></a>`;
    const b = brand || { href: siteURL("home/index.html"), label: "" }; // (i9: the site lives in i8)
    const phone = list.filter((p) => p.bar !== false);
    const custom = !!pages;
    // the phone nav (?mnav; CSS shows it below 960px only). Bars share .ybar (the player measures it); top + spool have none.
    let mobile;
    if (mnav === "top") {
      mobile = `<nav class="ytop" aria-label="${esc(label)} (mobile)">
        <ul class="ytop__list">${phone.map((p) => `<li><a class="ytop__item ysel" data-section="${sec(p)}" href="${esc(p.href)}"${cur(p)}>${ico(p)}<span>${esc(p.label)}</span></a></li>`).join("")}</ul>
        ${soundUI("top", active, custom)}</nav>`;
    } else if (mnav === "spool") {
      const now = phone.find((p) => p.key === active), id = uid("yspool");
      mobile = `<nav class="yspool" aria-label="${esc(label)} (mobile)">
        <div class="yspool__menu" id="${id}"><ul class="yspool__list">${phone.map((p) => `<li><a class="yspool__item ysel ylift" data-section="${sec(p)}" href="${esc(p.href)}"${cur(p)}>${ico(p)}<span>${esc(p.label)}</span></a></li>`).join("")}</ul></div>
        <button type="button" class="yspool__btn" aria-expanded="false" aria-controls="${id}"${now ? ` data-section="${sec(now)}"` : ""}>${now ? ico(now) : '<span class="ydot" aria-hidden="true"><i class="ph-bold ph-list"></i></span>'}<span class="yspool__l">${esc(now ? now.label : "Sections")}</span><span class="sr-only">, switch section</span><i class="ph-bold ph-caret-up yspool__caret" aria-hidden="true"></i></button>
        ${soundUI("spool", active, custom)}</nav>`;
    } else {
      mobile = `<nav class="ybar ybar--${esc(mnav)}${mnav === "corduroy" ? ` m-${esc(material)}` : ""}" aria-label="${esc(label)} (mobile)">
        ${phone.map(item).join("")}
        ${soundUI("bar", active, custom)}
      </nav>`;
    }
    return `
      <a class="yskip btn btn--ink" href="#y-main">Skip to content</a>
      <nav class="ynav" aria-label="${esc(label)}">
        <a class="ynav__brand" href="${esc(b.href)}"${b.label ? ` aria-label="${esc(b.label)}"` : ""}>${catSVG("", "var(--ink)")}<b>blaqat<i>.</i>net</b></a>
        ${badge}
        ${soundUI("brand", active, !!pages)}
        <ul class="ynav__tabs">${list.filter((p) => p.tab !== false).map(tab).join("")}</ul>
        ${extra}
        ${soundUI("desk", active, !!pages)}
      </nav>
      ${mobile}
      ${soundUI("sheet", active, !!pages)}`;
  }
  /* ?mnav=spool: the sections pill unspools into the menu (CSS transitions on clip-path, so a second tap reverses from
     where it is). One set of delegated listeners for every <yarn-nav> render: nothing to clean up on re-render. */
  function spoolSet(sp, open, { focus = false } = {}) {
    const btn = sp && $(".yspool__btn", sp);
    if (!btn || sp.classList.contains("is-open") === open) return;
    if (open) sp.style.setProperty("--yspool-bw", `${btn.offsetWidth}px`); // the menu grows out of the pill's own width
    sp.classList.toggle("is-open", open);
    btn.setAttribute("aria-expanded", String(open));
    sound(open ? "open" : "close", { el: btn });
    // i6 · mobile (B1): focus moves for keys only (after a tap WebKit would ring the script-focused item / pill)
    if (open) { if (viaKey()) ($(".yspool__item[aria-current]", sp) || $(".yspool__item", sp))?.focus({ preventScroll: true }); }
    else if (focus && viaKey()) btn.focus({ preventScroll: true });
  }
  if (OPT.mnav === "spool") {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest?.(".yspool__btn");
      if (btn) spoolSet(btn.closest(".yspool"), !btn.closest(".yspool").classList.contains("is-open"));
      else if (e.target.closest?.(".yspool__item")) spoolSet(e.target.closest(".yspool"), false);
    });
    document.addEventListener("pointerdown", (e) => { const sp = $(".yspool.is-open"); if (sp && !sp.contains(e.target)) spoolSet(sp, false); }, true);
    document.addEventListener("keydown", (e) => {
      const sp = e.key === "Escape" && !e.defaultPrevented && $(".yspool.is-open");
      if (sp) { e.preventDefault(); spoolSet(sp, false, { focus: sp.contains(document.activeElement) }); }
    });
    document.addEventListener("focusout", (e) => {
      const sp = e.target.closest?.(".yspool.is-open");
      if (sp && e.relatedTarget && !sp.contains(e.relatedTarget)) spoolSet(sp, false);
    });
  }
  // <yarn-nav active base> renders the site nav; set el.config = { pages, brand, label, badge, extra } for another page list (Studio)
  class YarnNav extends HTMLElement {
    static get observedAttributes() { return ["active"]; }
    attributeChangedCallback() { if (this._done) this.render(); }
    connectedCallback() {
      if (!this._done) { this._done = true; this.render(); }
      else if (this._float && !this._float.isConnected) layer()?.appendChild(this._float); // (i6 · B2: back on the layer)
    }
    disconnectedCallback() { queueMicrotask(() => { if (!this.isConnected) this._float?.remove(); }); }
    get config() { return this._config || null; }
    set config(c) { this._config = c; if (this._done) this.render(); }
    render() {
      const material = params.get("nav") ? OPT.nav : this.getAttribute("material") || OPT.nav;
      this.innerHTML = navHTML({ active: this.getAttribute("active") || "", base: this.getAttribute("base") ?? "../", material, ...(this._config || {}) });
      // i6 · mobile (B2): the phone's floating nav (the sections pill) leaves the sheet for the floating layer, so no
      // page stacking, transform or clip ever touches it. A re-render replaces the one this nav put there.
      this._float?.remove();
      this._float = $(".yspool", this);
      if (this._float) (layer() || this).appendChild(this._float);
    }
  }
  if (!customElements.get("yarn-nav")) customElements.define("yarn-nav", YarnNav);

  /* ============================================================
     SECTION TRANSITION
     go(trigger, href, section): cord cloth grows out of the trigger
     (one spring, no stalls), then navigates once the screen is covered.
     The next page is held behind its cord until the white sheet rises
     from the bottom (i4; ?sheetin=grow = i3's sheet growing open from
     the button); content only shows where the white has reached.
     i4 (home): the cloth's cord texture is pinned to the same fixed tile
     as the page frame (yarn.css), so it lands stitch for stitch on the
     next page's frame; its shadow is two flat clipped layers, not a filter.
     ============================================================ */
  // rise (default): the white's top edge comes up; slide: the whole sheet travels up (reads most like a sheet, but moving
  // a document-tall layer drops frames on desktop: ~8–12 long frames per arrival in headless vs ~1–3 for rise/grow);
  // grow: i3, from the button. The departing page passes its choice along with the transition record.
  const SHEET_IN = ["rise", "slide", "grow"];
  const sheetIn = () => pick(params.get("sheetin"), SHEET_IN, null) || pick(trIn?.sheet, SHEET_IN, "rise");
  const transition = {
    busy: null,
    go(trigger, href, section, { freeze = null, dim = true } = {}) {
      if (transition.busy) return;
      const rb = (trigger?.getBoundingClientRect?.()) || { left: innerWidth / 2 - 60, top: innerHeight / 2 - 24, width: 120, height: 48 };
      const W = innerWidth, H = innerHeight;
      const ov = document.createElement("div");
      ov.className = "ytr"; ov.dataset.section = section || ""; ov.setAttribute("aria-hidden", "true");
      ov.innerHTML = `<div class="ytr__shade"></div><div class="ytr__shade ytr__shade--far"></div><div class="ytr__cloth"></div>`;
      document.body.appendChild(ov);
      const shades = $$(".ytr__shade", ov), cloth = ov.lastChild;
      const rect = { x: rb.left, y: rb.top, w: rb.width, h: rb.height };
      try { sessionStorage.setItem(TR_KEY, JSON.stringify({ t: Date.now(), section, sheet: sheetIn(), rect: { x: rect.x / W, y: rect.y / H, w: rect.w / W, h: rect.h / H, r: Math.min(rect.h / 2, 30) } })); } catch (_) {}
      const nav = () => { if (transition.busy && !transition.busy.cancelled) location.href = href; };
      sound("cloth", { el: trigger });
      let anims;
      const RM = reduced();
      if (RM) {
        shades.forEach((s) => s.remove());
        anims = [cloth.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: "ease-out", fill: "forwards" })];
        transition.busy = { ov, anims, cancelled: false };
        if (freeze != null) { anims.forEach((a) => { a.pause(); a.currentTime = freeze * 200; }); return; }
        anims[0].finished.then(nav).catch(() => {});
        return;
      }
      // overshoot the viewport so the cover is complete well before the spring settles
      const over = Math.max(W, H) * 0.12;
      const ins = (t, r, b, l, rad) => `inset(${t.toFixed(1)}px ${r.toFixed(1)}px ${b.toFixed(1)}px ${l.toFixed(1)}px round ${rad.toFixed(1)}px)`;
      const from = ins(rect.y, W - rect.x - rect.w, H - rect.y - rect.h, rect.x, Math.min(rect.h / 2, 30));
      const to = ins(-over, -over, -over, -over, 0);
      const sp = springEasing({ response: MOTION.cover });
      // progress at which every edge has passed the viewport edge
      const need = Math.max(rect.y, W - rect.x - rect.w, H - rect.y - rect.h, rect.x);
      const covered = sp.at(need / (need + over) + 0.004);
      anims = [cloth.animate([{ clipPath: from }, { clipPath: to }], { duration: sp.duration, easing: sp.easing, fill: "forwards" })];
      // the shadow: two flat, translucent layers under the cloth on the same clip spring, a little larger and lower
      // (no blur, no scaling). i3's filter: drop-shadow re-filtered the whole screen every frame; a box-shadow box
      // scaled up from the button was worse (re-rastered at up to 20×).
      const R0 = Math.min(rect.h / 2, 30);
      [[2, 4], [7, 10]].forEach(([g, dy], i) => {
        const f = ins(rect.y - g + dy, W - rect.x - rect.w - g, H - rect.y - rect.h - g - dy, rect.x - g, R0 + g);
        anims.push(shades[i].animate([{ clipPath: f }, { clipPath: to }], { duration: sp.duration, easing: sp.easing, fill: "forwards" }));
      });
      const page = document.querySelector(".sheet");
      if (dim && page) anims.push(page.animate([{ transform: "scale(1)", opacity: 1 }, { transform: "scale(.975)", opacity: .7 }], { duration: sp.duration, easing: sp.easing, fill: "forwards" }));
      if (trigger) anims.push(trigger.animate([{ opacity: 1 }, { opacity: 0, offset: .25 }, { opacity: 0 }], { duration: sp.duration, fill: "forwards" }));
      transition.busy = { ov, anims, cancelled: false, timer: 0 };
      if (freeze != null) { anims.forEach((a) => { a.pause(); a.currentTime = freeze * covered; }); return; }
      transition.busy.timer = setTimeout(nav, covered + 16);
    },
    // interruptible: Esc plays it back into the button from wherever it is
    cancel() {
      const o = transition.busy;
      if (!o || o.cancelled) return;
      o.cancelled = true; clearTimeout(o.timer);
      o.anims.forEach((a) => a.reverse());
      o.anims[0].finished.then(() => { o.ov.remove(); o.anims.forEach((a) => a.cancel()); transition.busy = null; }).catch(() => {});
    },
    // arriving half (runs automatically)
    reveal({ freeze = null } = {}) {
      const sheet = document.querySelector(".sheet");
      const done = () => { html.classList.remove("yt-enter"); };
      if (!sheet) return done();
      sound("unroll");
      // everything outside the sheet (player, FABs, ⚙, a floating sound toggle…) + the phone bar waits for the white
      const extras = [...new Set([...$$("body > *"), ...$$(".ybar, .yspool")])].filter((el) => el !== sheet && !/^(SCRIPT|STYLE|LINK|TEMPLATE)$/.test(el.tagName));
      if (reduced()) {
        done();
        sheet.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240, easing: "ease-out" });
        return;
      }
      const sr = sheet.getBoundingClientRect(), W = innerWidth, H = innerHeight;
      const rad = parseFloat(getComputedStyle(sheet).borderTopLeftRadius) || 22;
      const visBottom = Math.max(0, sr.bottom - H);
      const sp = springEasing({ response: MOTION.reveal });
      const all = [];
      let lip = null, exAt = MOTION.extrasAt;
      const mode = sheetIn();
      if (mode === "slide") {
        // i4: the sheet itself comes up from below the screen, carrying its content (its own shadow leads). A transform
        // on .sheet would carry fixed UI inside it (the phone bar) along, so the extras fade in once it has landed.
        const dy = Math.min(H, sr.bottom) - Math.max(0, sr.top) + 32;
        all.push(sheet.animate([{ transform: `translateY(${dy.toFixed(1)}px)` }, { transform: "none" }], { duration: sp.duration, easing: sp.easing, fill: "both" }));
        html.classList.add("yt-slide"); // hides the off-screen skip link, which the transform would carry into view
        exAt = 0.82;
      } else if (mode === "grow") {
        // i3: the white grows open from where the button was
        const R = trIn?.rect ? { x: trIn.rect.x * W, y: trIn.rect.y * H, w: trIn.rect.w * W, h: trIn.rect.h * H, r: trIn.rect.r } : { x: W / 2 - 70, y: Math.min(H, sr.bottom) / 2 - 26, w: 140, h: 52, r: 26 };
        const ins = (t, r, b, l, k) => `inset(${t.toFixed(1)}px ${r.toFixed(1)}px ${b.toFixed(1)}px ${l.toFixed(1)}px round ${k.toFixed(1)}px)`;
        const from = ins(R.y - sr.top, sr.right - R.x - R.w, sr.bottom - R.y - R.h, R.x - sr.left, R.r || R.h / 2);
        const to = ins(Math.max(0, -sr.top), 0, visBottom, 0, rad);
        all.push(sheet.animate([{ clipPath: from }, { clipPath: to }], { duration: sp.duration, easing: sp.easing, fill: "both" }));
      } else {
        // i4: the white comes up from the bottom like a sheet. Only its top edge moves (rounded like the sheet's
        // own corners); the content stays put and shows only where the white has reached. A transparent "lip" box
        // rides the edge (transform only) and casts the sheet's shadow onto the cord above it.
        const bot = Math.min(H, sr.bottom);
        const top0 = Math.max(0, -sr.top);
        const ins = (t) => `inset(${t.toFixed(1)}px 0px ${visBottom.toFixed(1)}px 0px round ${rad}px ${rad}px 0px 0px)`;
        all.push(sheet.animate([{ clipPath: ins(bot - sr.top) }, { clipPath: ins(top0) }], { duration: sp.duration, easing: sp.easing, fill: "both" }));
        lip = document.createElement("div");
        lip.className = "ytr-lip"; lip.setAttribute("aria-hidden", "true");
        Object.assign(lip.style, { left: `${sr.left}px`, width: `${sr.width}px`, borderRadius: `${rad}px ${rad}px 0 0` });
        document.body.appendChild(lip);
        // --ytr-sync (a custom property can't run on the compositor) keeps this transform on the main thread with the
        // clip-path, so the lip never runs ahead of the white while the arriving page is still busy loading
        all.push(lip.animate([{ transform: `translateY(${bot.toFixed(1)}px)`, "--ytr-sync": "0" }, { transform: `translateY(${(sr.top + top0).toFixed(1)}px)`, "--ytr-sync": "1" }], { duration: sp.duration, easing: sp.easing, fill: "both" }));
      }
      const kids = [...sheet.children].map((c) => c.animate([{ opacity: 0 }, { opacity: 1 }], { duration: MOTION.contentMs, delay: MOTION.contentDelay, easing: "ease-out", fill: "backwards" }));
      const ex = extras.map((c) => c.animate([{ opacity: 0 }, { opacity: 1 }], { duration: MOTION.extrasMs, delay: sp.duration * exAt, easing: "ease-out", fill: "backwards" }));
      html.classList.remove("yt-enter");
      if (freeze != null) { [...all, ...kids, ...ex].forEach((x) => { x.pause(); x.currentTime = freeze * sp.duration; }); return; }
      const end = () => { lip?.remove(); html.classList.remove("yt-slide"); };
      all[0].finished.then(() => { all.forEach((x) => x.cancel()); end(); }).catch(end);
    },
  };
  addEventListener("keydown", (e) => { if (e.key === "Escape" && transition.busy) transition.cancel(); });
  addEventListener("pageshow", (e) => { if (e.persisted && transition.busy) { transition.busy.ov.remove(); transition.busy.anims.forEach((a) => a.cancel()); transition.busy = null; } });

  /* ============================================================
     SCRIBBLE UNDERLINE — hand-drawn SVG, any color, can draw itself in
     <span class="yscribble" style="--scribble:var(--blue)" data-draw>…</span>
     data-scribble="wave" (default) | "loop" | "double"; data-draw="auto" draws on view
     ============================================================ */
  function scribblePath(w, h, seed, kind = "wave") {
    const R = rng(seed);
    const mid = h * 0.5, A = h * 0.3;
    const pts = [];
    const wl = 9 + R() * 3, n = Math.max(3, Math.round(w / wl)), step = w / n;
    let d = `M0 ${(mid + (R() - .5) * A * .6).toFixed(2)}`;
    if (kind === "loop") {
      // a running cursive line with small loops
      let x = 0;
      d = `M0 ${(mid + A * .4).toFixed(2)}`;
      const loops = Math.max(2, Math.round(w / 22));
      const sx = w / loops;
      for (let i = 0; i < loops; i++) {
        const x0 = x, x1 = x0 + sx;
        const lw = sx * (.32 + R() * .12), top = mid - A * (1.1 + R() * .4), bot = mid + A * (.5 + R() * .3);
        d += ` C${(x0 + sx * .45).toFixed(1)} ${bot.toFixed(1)} ${(x0 + sx * .78).toFixed(1)} ${top.toFixed(1)} ${(x0 + sx * .6).toFixed(1)} ${top.toFixed(1)}`;
        d += ` C${(x0 + sx * .6 - lw * .9).toFixed(1)} ${top.toFixed(1)} ${(x0 + sx * .5).toFixed(1)} ${bot.toFixed(1)} ${x1.toFixed(1)} ${(mid + A * (.3 + R() * .2)).toFixed(1)}`;
        x = x1;
      }
      return d;
    }
    for (let i = 0; i < n; i++) {
      const x1 = (i + 0.5) * step, x2 = (i + 1) * step;
      const amp = A * (0.7 + R() * 0.55) * (i % 2 ? 1 : -1);
      const drift = (R() - 0.5) * A * 0.35;
      d += ` Q${x1.toFixed(1)} ${(mid + amp + drift).toFixed(2)} ${x2.toFixed(1)} ${(mid + drift * .4).toFixed(2)}`;
      pts.push(x2);
    }
    if (kind === "double") { // quick return stroke, a bit lower and flatter
      for (let i = n - 1; i >= 0; i--) {
        const x1 = (i + 0.5) * step, x2 = i * step;
        const amp = A * (0.45 + R() * 0.35) * (i % 2 ? -1 : 1);
        d += ` Q${x1.toFixed(1)} ${(mid + A * .55 + amp).toFixed(2)} ${x2.toFixed(1)} ${(mid + A * .5).toFixed(2)}`;
      }
    }
    return d;
  }
  const scrRO = new ResizeObserver((es) => es.forEach((e) => (e.target.isConnected ? drawScribble(e.target) : scrRO.unobserve(e.target)))); // i9 · polish (S1): a thrown-away view's scribbles leave the observer (like tabsRO)
  function drawScribble(el) {
    const w = Math.max(10, el.offsetWidth + 4);
    const h = Math.max(6, (parseFloat(getComputedStyle(el).fontSize) || 16) * 0.62);
    if (el._sw === w && el._sh === h) return;
    el._sw = w; el._sh = h;
    let svg = $(":scope > svg.yscribble__svg", el);
    if (!svg) { svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); svg.setAttribute("class", "yscribble__svg"); svg.setAttribute("aria-hidden", "true"); el.appendChild(svg); }
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    svg.setAttribute("preserveAspectRatio", "none");
    svg.innerHTML = `<path pathLength="1" d="${scribblePath(w, h, hash(el.textContent + (el.dataset.seed || "")), el.dataset.scribble || "wave")}"/>`;
  }
  let scrIO = null;
  function scribble(el, { draw = null, delay = 0 } = {}) {
    if (!el._yscr) { el._yscr = true; el.dataset.yinit = ""; el.classList.add("yscribble"); scrRO.observe(el); whenGone(el, () => scrRO.unobserve(el)); } // i9 · polish (S1): hidden ones never get a resize on the way out
    drawScribble(el);
    if (draw != null) el.setAttribute("data-draw", "");
    if (delay) el.style.setProperty("--scribble-delay", `${delay}ms`);
    if (el.dataset.draw === "auto") {
      scrIO ||= new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-drawn"); scrIO.unobserve(e.target); } }), { threshold: 0.6 });
      scrIO.observe(el);
    }
    return { draw: () => scribble.draw(el), reset: () => el.classList.remove("is-drawn") };
  }
  scribble.draw = (el) => { el.setAttribute("data-draw", ""); el.classList.remove("is-drawn"); void el.getBoundingClientRect(); requestAnimationFrame(() => el.classList.add("is-drawn")); };

  /* ============================================================
     MOCK PANEL — one ⚙ panel per page: page groups + kit groups
     ============================================================ */
  // i5 (G1): `open: true` = still an open decision (shown under Open) · `state: true` = a demo-state helper (Jump to) ·
  // no flag = decided, kept working under the collapsed "Earlier options (defaults kept)".
  const KIT_GROUPS = () => [
    // i5 review: `when` drops a kit group on pages where it does nothing (checked each time the panel opens)
    // i6 · mobile: browseicon, uisnd, mactive and toast are decided (Earlier); count + top cut from mactive
    { when: () => !!document.querySelector(".yfilter"), label: "Browse button icon", param: "browseicon", options: [["shake", "Shakes on hover"], ["caret", "Caret that turns"]], default: "shake" },
    { label: "UI sounds while music plays", param: "uisnd", options: [["quiet", "Silent"], ["always", "Keep playing (ducked, i4)"]], default: "quiet" },
    // i9 · links (S2): ▶ on a playlist track from SoundCloud / Spotify / YouTube … (kit/posts.js · Yarn.post.EXTTRACK)
    { when: () => !!document.querySelector(".ypost--playlist"), open: true, label: "Playlist: ▶ on another service's track", param: "exttrack", options: [["inline", "Plays in its row (the service's player)"], ["open", "Opens it on the service (new tab)"]], default: "inline" },
    { when: () => !!document.querySelector(".yfilter"), label: "Active filters on phones", param: "mactive", options: [["start", "Right after ✕ (always in view)"], ["end", "End of the chip row (scroll to see)"]], default: "start" },
    { label: "Toasts on phones", param: "toast", options: [["bottom", "Bottom, player + search move up"], ["top", "Top of the screen"]], default: "bottom" },
    // i6 · mobile (X6, contrast): the red buttons' red · i7 (K3): decided, twill (deep → Earlier)
    { when: () => !!document.querySelector(".btn--red"), label: "Red buttons (X6)", param: "redbtn", options: [["twill", "Brand red twill (i5)"], ["deep", "One shade deeper (passes 4.5 on every thread)"]], default: "twill" },
    // i6 · projects: stack icons are a rule now (S2, no option) · card meta (O1) · grid years while filtering (P4)
    // i7 (K3): both decided (Earlier): cardmeta = facts, gridyears = fold
    { when: () => !!document.querySelector(".ymeta--facts, .ymeta--badges"), label: "Card meta (O1)", param: "cardmeta", options: [["facts", "Facts: icon in a circle (like the opened item)"], ["badges", "Badges (i5)"]], default: "facts" },
    { when: () => !!document.querySelector(".ygroups--grid") || /[?&]view=grid/.test(location.search), label: "Grid years while filtering (P4)", param: "gridyears", options: [["fold", "Fold: years with 1–2 results share a divider"], ["flow", "Flow: no dividers"], ["label", "Labels: no dividers, a year on each card"], ["rule", "A divider per year (i5)"]], default: "fold" },
    // i9 · polish (S14, owner: "1 big 3 small or maybe turn the 2nd row into a carousel idk"): Open. Yarn.post.mediaGrid
    { open: true, when: () => !!document.querySelector("[data-siteorder], #kc-morder"), label: "Music order: a Complete release sorts by (S10)", param: "mcomplete", options: [["end", "Its finish (the old site, as built)"], ["start", "Its start (the pin's note)"]], default: "end" },
    { open: true, when: () => !!document.querySelector(".ypost--embed"), label: "Image sets with 5+ images (S14)", param: "imgset", options: [["grid", "2 rows: 1 big + 3 small, the last says +N"], ["strip", "2nd row is a carousel strip"]], default: "grid" },
    { label: "Toggles (multi-select: filter chips, tokens, type rows)", param: "toggle", options: [["red", "Red fill (decided)"], ["ink", "Ink fill (i1)"], ["tint", "Red wash"], ["rope", "Rope (i2)"]], default: DEFAULTS.toggle },
    { label: "Single choice (nav, segments, rows)", param: "sel", options: [["rope", "Rope ring"], ["ink", "Ink fill"]], default: DEFAULTS.sel },
    { label: "Detail pages: links + footer", param: "dfoot", options: [["inline", "In the flow"], ["float", "Floating bar (i2)"]], default: DEFAULTS.dfoot },
    { label: "Motion timing", param: "motion", options: [["i3", "i3 (tuned)"], ["i2", "i2 timings"]], default: DEFAULTS.motion },
    { label: "Rope", param: "rope", options: [["in", "On the edge"], ["out", "Around"]], default: DEFAULTS.rope },
    { label: "Body font", param: "body", options: Object.entries(BODY_FONTS).map(([k, v]) => [k, v.label]), default: DEFAULTS.body },
    { label: "Background", param: "bg", options: [...BG_OPTIONS, ...(OPT.bg && !BG_OPTIONS.some(([v]) => v === OPT.bg) ? [[OPT.bg, OPT.bg]] : [])], default: BG_DEFAULT },
    { label: "Mobile search (list pages)", param: "msearch", options: [["fab", "Search FAB → slot (i4)"], ["bar", "Top bar + sticky filters"]], default: "fab" },
    // i4 round 2 · mobile chrome (kit/player.js reads it): where the phone disc rests
    { label: "Phone disc rests", param: "discat", options: [["line", "On the slot's line, clear of the nav"], ["nav", "Over the nav's corner (i3)"]], default: "line" },
    { label: "Sound toggle", param: "soundui", options: [["tag", "Woven tag on the sheet edge"], ["brand", "Beside the brand"], ["nav", "Nav corner + bottom bar (i3)"]], default: "tag" },
    { label: "Mobile nav (phones · compare all: kit/mnav.html)", param: "mnav", options: [["spool", "Sections pill (decided)"], ["top", "Top strip (i5 round 1)"], ["corduroy", "Corduroy bar (i4)"], ["cotton", "Cotton pill"], ["ink", "Ink, icons only"], ["frame", "Frame band"]], default: "spool" },
    ...(OPT.mnav === "corduroy" ? [{ label: "Corduroy bar material", param: "nav", options: [["corduroy", "Corduroy"], ["cork", "Cork"]], default: DEFAULTS.nav }] : []),
    { state: true, label: "Motion", param: "reduced", options: [["", "Full"], ["1", "Reduced"]], default: "" },
  ];
  let panel = null, pageGroups = [], pageTitle = "Mock options";
  function renderPanel() {
    if (!document.body) return;
    if (!panel) {
      panel = document.createElement("details");
      panel.className = "mockpanel";
      panel.addEventListener("click", (e) => {
        const b = e.target.closest("button[data-p]");
        if (!b) return;
        const u = new URL(location.href);
        b.dataset.v === "" ? u.searchParams.delete(b.dataset.p) : u.searchParams.set(b.dataset.p, b.dataset.v);
        location.href = u.toString();
      });
      panel.addEventListener("toggle", rememberPanel, true); // toggle doesn't bubble: capture sees both <details>
      panel.addEventListener("toggle", () => { if (panel.open) renderPanel(); }); // re-check `when` against the built page
      addEventListener("load", () => setTimeout(() => panel.open && renderPanel(), 0), { once: true });
      // i7 · W1 (walkthrough): Esc closes the open panel first (it's the top layer), wherever focus is. Not while a
      // review note is being written or picked (kit/review.js owns Esc there); a second Esc reaches the page.
      addEventListener("keydown", (e) => {
        if (e.key !== "Escape" || !panel?.open || e.defaultPrevented) return;
        if (e.target.closest?.(".yrv-ta, .yrv-pop") || document.querySelector(".yrv-pop") || html.classList.contains("yrv-picking")) return;
        e.preventDefault(); e.stopImmediatePropagation();
        const back = panel.contains(document.activeElement);
        panel.open = false;
        if (back) $(":scope > summary", panel)?.focus();
      }, true);
      document.body.appendChild(panel);
    }
    // i5 (G1, owner: "remove all the options … that we decided … hone on the actual open design decisions"):
    // Open (expanded: page + kit groups flagged open) · Jump to (state helpers, compact) · Earlier (collapsed: the rest)
    const fs = (g, kit) => {
      const cur = params.get(g.param) ?? g.default ?? "";
      return `<fieldset${g.state && !g.open ? ' class="is-jump"' : ""}><legend>${esc(g.label)}${kit ? "<small>every page</small>" : ""}</legend>${g.options.map(([v, l]) => `<button type="button" data-p="${esc(g.param)}" data-v="${esc(v)}" aria-pressed="${String(cur === v)}">${esc(l)}</button>`).join("")}</fieldset>`;
    };
    const kitGroups = KIT_GROUPS().filter((g) => !g.when || g.when());
    const pick3 = (list) => ({ open: list.filter((g) => g.open), jump: list.filter((g) => g.state && !g.open), rest: list.filter((g) => !g.open && !g.state) });
    const P = pick3(pageGroups), K = pick3(kitGroups);
    let mem = {};
    try { mem = JSON.parse(sessionStorage.getItem("yarn.mockpanel") || "{}") || {}; } catch (_) {}
    const open = panel.dataset.ready ? panel.open : !!mem.open;
    const moreOpen = panel.dataset.ready ? !!$(".mockpanel__more", panel)?.open : !!mem.more;
    // a page's own block (data-ykeep, e.g. Home's "This visit") survives the re-render that opening the panel does
    const keep = $$("[data-ykeep]", panel);
    // i7 · site: opening the panel by keyboard re-renders it; the focused summary is rebuilt, so focus goes back to the
    // new one (it fell to the page before, and Space then scrolled the page instead of closing the panel)
    const fsum = panel.contains(document.activeElement) && document.activeElement.matches("summary") ? (document.activeElement.parentElement === panel ? ":scope > summary" : ".mockpanel__more > summary") : "";
    panel.innerHTML = `<summary>${esc(pageTitle)}</summary>
      <h4>Open</h4>${P.open.length ? P.open.map((g) => fs(g, false)).join("") : (K.open.length ? '<p class="mockpanel__none">Nothing open for this page itself; the site-wide ones:</p>' : '<p class="mockpanel__none">Nothing open on this page.</p>')}${K.open.map((g) => fs(g, true)).join("")}
      ${P.jump.length + K.jump.length ? `<h4>Jump to</h4>${P.jump.map((g) => fs(g, false)).join("")}${K.jump.map((g) => fs(g, true)).join("")}` : ""}
      <details class="mockpanel__more"${moreOpen ? " open" : ""}><summary>Earlier options (defaults kept)</summary>
        ${P.rest.length ? `<h5>This page</h5>${P.rest.map((g) => fs(g, false)).join("")}` : ""}<h5>Kit (every page)</h5>${K.rest.map((g) => fs(g, false)).join("")}</details>`;
    for (const n of keep) { const h4s = $$("h4", panel); (h4s.find((h) => /jump to/i.test(h.textContent)) || h4s[0])?.after(n); }
    panel.open = open;
    if (fsum) $(fsum, panel)?.focus({ preventScroll: true });
    panel.dataset.ready = "";
    // i5 · review tools: kit/review.js adds the notes, the saved-choice marks and the picker to each render
    panel._groups = { page: pageGroups, kit: kitGroups };
    panel.dispatchEvent(new Event("ypanel", { bubbles: true }));
  }
  // remember the panel (and its Earlier section) open across the reloads an option click causes (this tab only)
  function rememberPanel() {
    try { sessionStorage.setItem("yarn.mockpanel", JSON.stringify({ open: !!panel?.open, more: !!(panel && $(".mockpanel__more", panel)?.open) })); } catch (_) {}
  }
  function mockPanel(groups = [], { title = "Mock options" } = {}) {
    pageGroups = groups; pageTitle = title;
    renderPanel();
    return panel;
  }

  /* ============================================================
     DELEGATION + AUTO-UPGRADE
     ============================================================ */
  document.addEventListener("click", (e) => {
    const yf = e.target.closest?.("[data-yf]");
    if (yf && filters.current) {
      const i = yf.dataset.yf.indexOf(":");
      const on = filters.current.toggle(yf.dataset.yf.slice(0, i), yf.dataset.yf.slice(i + 1), undefined, "yf");
      sound(on ? "chip-on" : "chip-off", { el: yf });
      return;
    }
    const sb = e.target.closest?.(".yseg__btn");
    if (sb) {
      const g = sb.closest(".yseg");
      $$(".yseg__btn", g).forEach((b) => b.setAttribute("aria-pressed", String(b === sb)));
      g.dispatchEvent(new CustomEvent("ychange", { bubbles: true, detail: { value: sb.dataset.v, name: g.dataset.name || "" } }));
    }
    const tr = e.target.closest?.("[data-transition]");
    if (tr && !e.defaultPrevented && e.button === 0 && !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)) {
      e.preventDefault();
      transition.go(tr, tr.getAttribute("href"), tr.dataset.transition);
    }
  });
  // felt "tap" for plain buttons and nav presses (pages: don't play tap for these again)
  document.addEventListener("pointerdown", (e) => {
    const b = e.target.closest?.(".btn, .ynav__tab, .ybar__item, .ytop__item, .yspool__item, .yseg__btn, .ylinkicon, .ydetail__back, .ynav__brand");
    if (b) sound("tap", { el: b });
  });
  // folder tabs: arrows move along the strip (roving tabindex); a dense strip on touch opens its folder
  document.addEventListener("keydown", (e) => {
    const tab = e.target.closest?.(".yfolder__tab");
    if (!tab || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const tabs = $$(".yfolder__tab:not(.is-out)", tab.parentElement), i = tabs.indexOf(tab); // (i5: filtered-out tabs are skipped)
    const j = e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : (i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    tabs.forEach((x, k) => { x.tabIndex = k === j ? 0 : -1; });
    tabs[j].focus();
  });
  document.addEventListener("click", (e) => {
    const strip = e.target.closest?.(".yfolder__tabs.is-dense");
    if (strip && !e.target.closest(".yfolder__tab")) strip.closest(".yfolder")?.querySelector(".yfolder__open")?.click();
  });
  function upgrade(root = document) {
    $$(".yscribble", root).forEach((el) => scribble(el));
    $$(".ydetail", root).forEach(wireDetail);
    $$(".yfolder__tabs:not([data-yinit])", root).forEach((s) => { s.dataset.yinit = ""; tabsRO.observe(s); whenGone(s, () => tabsRO.unobserve(s)); fitTabs(s); }); // (i9 · polish · S1: whenGone, as scribbles)
    $$(".yyear--rule:not([data-yinit])", root).forEach((p) => { p.dataset.yinit = ""; ruleRO.observe(p); if (p.parentElement) ruleRO.observe(p.parentElement); queuePills(); });
  }
  let upPending = false;
  const mo = new MutationObserver(() => {
    if (upPending) return;
    upPending = true;
    queueMicrotask(() => { upPending = false; if (LISTTOOLS.size) sweepListTools(); if (GONE.size) sweepGone(); if (document.querySelector(".yscribble:not([data-yinit]), .ydetail:not([data-yinit]), .yfolder__tabs:not([data-yinit]), .yyear--rule:not([data-yinit])")) upgrade(); });
  });

  /* ============================================================
     MODULES (swatch.js, lightbox.js sync; sound.js async)
     ============================================================ */
  include("js", kitURL("swatch.js"));
  include("js", kitURL("lightbox.js"));
  include("js", kitURL("posts.js"));
  include("js", kitURL("blocks.js")); // i9 · blocks (S3): Yarn.md, markdown with yarn blocks (after posts.js: it draws post cards + about pills)
  include("js", kitURL("review.js")); // i5 · review tools (R1–R3): notes, saved ⚙ choices, the element picker
  if (!window.YarnSound) include("js", kitURL("sound.js"), { blocking: false });

  const ready = new Promise((res) => {
    const go = () => res(window.Yarn);
    document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", go, { once: true }) : setTimeout(go, 0);
  });
  document.addEventListener("DOMContentLoaded", () => {
    upgrade();
    mo.observe(document.body, { childList: true, subtree: true });
    if (!panel) renderPanel(); // pages that never call mockPanel still get the kit options
    // the nav's skip link lands on the page column
    const main = document.querySelector(".ypage") || document.querySelector("main");
    if (main) { main.id ||= "y-main"; if (!main.hasAttribute("tabindex")) main.tabIndex = -1; $$(".yskip").forEach((a) => a.setAttribute("href", "#" + main.id)); }
    if (html.classList.contains("yt-enter")) {
      const trp = params.has("trp") ? clamp(parseFloat(params.get("trp")) || 0, 0, 1) : null;
      const go = () => requestAnimationFrame(() => requestAnimationFrame(() => transition.reveal({ freeze: trp })));
      // wait (briefly) for fonts so the white uncovers settled content
      Promise.race([document.fonts?.ready || Promise.resolve(), new Promise((r) => setTimeout(r, MOTION.fontWait))]).then(go);
    }
  });

  window.Yarn = Object.assign(window.Yarn || {}, {
    siteURL, // i9: a site page (the frozen i8 folder)
    version: "i3",
    params, reduced, opts: OPT, kitURL, ready, motion: MOTION,
    // utils
    esc, slug, hash, rng, clamp, Spring, springEasing, sound, uid, px,
    // vocab + format
    STATUS, TYPE, INSTRUMENT, PUB, DEVICONS, status, type, instrument, devicon, stackIcon, stackKnown, stackSlugs, stackLookup, stackLogo, stackInitials, // (i9 · polish · S11)
    parseDate, fmt, dateRange, duration, yearOf, media, isVideo, fmtTime,
    musicFacts, musicOrder, // i9 · music (S6 · S9 · S10)
    // renderers
    badge, meta, stack: stackList, tag, tags, tagHref, header, empty, seg, chip, yearPill, byYear, timelineHTML, carousel, detail, pager, linkIcon, brandOf, copy, copyBtn,
    linkInfo, links, dlinks, LINK_ICONS, // i9 · links (S5): the recogniser, any old shape → one list, a footer row of them
    fact, stackChips, dlink, detailOptions, stageSwap, // i5 · layout (LAYOUT-i5.md)
    cardMeta, stackTags, gridYears, // i6 · projects (O1 · P2 · P4)
    fitFacts: fitFactsOn, // i7 · projects: one line of card facts in any list (a timeline does it itself)
    disc, wave, folder, fitTabs, navHTML, EQ,
    // i4 · chrome: the visible sound toggle + the phone slot above the nav
    soundToggle, slot, toast, // (toast: i5 · chrome)
    layer, // i6 · mobile (B2): the floating layer every floater lives in (kit/player.js mounts the player there)
    // behaviour
    filters, filterRow, search, flip, openInPlace, yearGroupsHTML, filterGroups, timeline, strand, watchStuck, wireDetail, transition, scribble, mockPanel, upgrade, yearRail, fab, listTools, detailPage,
    // brand
    CAT_PATH, catSVG,
  });
})();
