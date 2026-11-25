/* ============================================================
   blaqat.net · round 3 · yarn kit · iteration 2 (mock-only)
   window.Yarn — every shared part. Docs: kit/COMPONENTS.md

   INCLUDE IT WITHOUT defer, in <head>, after yarn.css + data.js:
     <script src="../kit/yarn.js"></script>
   It sets the kit options on <html> before first paint (no flash),
   holds the page behind the cord when arriving from home, and pulls
   in kit/swatch.js + kit/lightbox.js (sync) and kit/sound.js (async).

   Kit URL params (all optional; also in the ⚙ mock panel):
     ?sel=rope|ink      selected style            (default rope)
     ?rope=in|out       rope inside / around      (default in)
     ?body=nunito-sans|figtree|atkinson|system   (default nunito-sans)
     ?bg=<name>         loads kit/bg/<name>.css, sets <html data-bg>
     ?nav=corduroy|cork mobile bar material       (default corduroy)
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
  const params = new URLSearchParams(location.search);
  const html = document.documentElement;
  const SYNC = !!SCRIPT && !SCRIPT.defer && !SCRIPT.async && document.readyState === "loading";

  /* ============================================================
     OPTIONS → <html data-*> (before first paint when loaded sync)
     ============================================================ */
  const DEFAULTS = { sel: "rope", rope: "in", body: "nunito-sans", nav: "corduroy" };
  const BODY_FONTS = {
    "nunito-sans": { label: "Nunito Sans", css: null }, // already imported by yarn.css
    figtree: { label: "Figtree", css: "https://fonts.googleapis.com/css2?family=Figtree:ital,wght@0,400..800;1,400..700&display=swap" },
    atkinson: { label: "Atkinson Next", css: "https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:ital,wght@0,400..800;1,400..700&display=swap" },
    system: { label: "System", css: null },
  };
  // Background options for the ⚙ panel. The bg agent's files live in kit/bg/<name>.css.
  // Default is intarsia (bg agent's recommendation, kit/bg/NOTES.md): diamonds knitted on the same grid as the stitches.
  const BG_DEFAULT = "intarsia";
  const BG_OPTIONS = [["intarsia", "Intarsia"], ["jersey", "Jersey"], ["quilt", "Quilt"], ["speckle", "Speckle"], ["current", "Current (i1)"]];
  const pick = (v, ok, d) => (ok.includes(v) ? v : d);
  const OPT = {
    sel: pick(params.get("sel"), ["rope", "ink"], DEFAULTS.sel),
    rope: pick(params.get("rope"), ["in", "out"], DEFAULTS.rope),
    body: pick(params.get("body"), Object.keys(BODY_FONTS), DEFAULTS.body),
    nav: pick(params.get("nav"), ["corduroy", "cork", "suede", "burlap"], DEFAULTS.nav),
    bg: /^[a-z0-9-]{1,40}$/.test(params.get("bg") || "") ? params.get("bg") : BG_DEFAULT,
    // mobile search + filters on list pages (< 960px): "bar" = top search + sticky filter row; "fab" = a search FAB
    // above the nav that grows into a bottom panel. Old Projects links used ?search=fab|fab-row|bar.
    msearch: pick(params.get("msearch"), ["bar", "fab"], null) || ({ fab: "fab", "fab-row": "fab", bar: "bar" })[params.get("search")] || "bar",
  };
  html.dataset.sel = OPT.sel;
  html.dataset.rope = OPT.rope;
  html.dataset.body = OPT.body;
  if (OPT.bg) html.dataset.bg = OPT.bg;
  html.dataset.msearch = OPT.msearch;
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

  /* ============================================================
     VOCABULARY + FORMATTING
     ============================================================ */
  const SVG = {
    check: `<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7.4" fill="currentColor"/><circle cx="8" cy="8" r="5.6" fill="none" class="k" stroke-opacity=".42" stroke-width=".8" stroke-dasharray="1.5 1.3"/><path class="k" d="M5 8.3 7.1 10.4 11.2 5.9" fill="none" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    pause: `<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.9" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="5.1" y="4.7" width="2.1" height="6.6" rx="1.05" fill="currentColor"/><rect x="8.8" y="4.7" width="2.1" height="6.6" rx="1.05" fill="currentColor"/></svg>`,
    bag: `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.7 6.4C2.7 7.8 2.1 10.4 2.6 12.3c.5 1.8 2.6 2.6 5.4 2.6s4.9-.8 5.4-2.6c.5-1.9-.1-4.5-2.1-5.9Z" fill="currentColor"/><path d="M6.6 5.9C5.2 5 4.1 3.3 4.7 2.3c.7-1 2.4.7 3.1 3.1ZM9.4 5.9c1.4-.9 2.5-2.6 1.9-3.6-.7-1-2.4.7-3.1 3.1Z" fill="currentColor"/><rect x="5.6" y="5.1" width="4.8" height="1.7" rx=".85" fill="#d62f38"/><path d="M4.6 10c1.7 1.2 5.1 1.2 6.8 0" fill="none" stroke="#fff" stroke-opacity=".38" stroke-width=".8" stroke-linecap="round"/></svg>`,
  };
  const STATUS = {
    ongoing: { key: "ongoing", label: "Ongoing", icon: `<i class="ph-bold ph-needle" aria-hidden="true"></i>`, phIcon: "ph-needle" },
    complete: { key: "complete", label: "Complete", icon: SVG.check, phIcon: "ph-check-circle" },
    paused: { key: "paused", label: "Paused", icon: SVG.pause, phIcon: "ph-pause-circle" },
    dropped: { key: "dropped", label: "Dropped", icon: SVG.bag, phIcon: "ph-trash" },
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
  // icon markup for a stack name: devicon <img> or a phosphor fallback (like the old site's {} )
  function stackIcon(name, { alt = "" } = {}) {
    const u = devicon(name);
    if (u) return `<img src="${u}" alt="${esc(alt)}" width="16" height="16" loading="lazy" decoding="async" data-ydev>`;
    const ph = STACK_PH[norm(name)] || "ph-brackets-curly";
    return alt ? `<i class="ph-bold ${ph}" role="img" aria-label="${esc(alt)}"></i>` : `<i class="ph-bold ${ph}" aria-hidden="true"></i>`;
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
    // publication state (Studio): a second axis next to status. live = sewn on (ink) · draft = basted · changed = pinned edits · hidden
    pub(state, { compact = false, text = "" } = {}) {
      const p = PUB[state] || PUB.draft, k = PUB[state] ? state : "draft";
      const lb = text || p.label;
      return `<span class="ybadge ybadge--pub ybadge--pub-${k}${compact ? " ybadge--icon" : ""}" data-pub="${k}" title="${esc(p.title)}"><i class="ph-bold ${p.icon}" aria-hidden="true"></i><span${compact ? ' class="sr-only"' : ""}>${esc(lb)}</span></span>`;
    },
    instrument(i, { compact = false } = {}) {
      const it = instrument(i);
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
      else if (k === "instrument" && item.instrument) out.push(badge.instrument(item.instrument, { compact }));
      else if (k === "date") out.push(badge.date(item, { dur }));
    }
    const row = `<div class="ymeta ${cls}">${out.filter(Boolean).join("")}</div>`;
    return stack && item.stack?.length ? row + stackList(item.stack, { variant: stack === true ? "chips" : stack }) : row;
  }
  // stack chips: variant "chips" (icon + name) | "icons" (icon-only, accessible names). as: "li" | "button" (data-yf toggles the page filter)
  function stackList(list, { variant = "chips", max = Infinity, as = "li", pressed = null, label = "Built with", size = "" } = {}) {
    const items = asArr(list);
    const shown = items.slice(0, max), rest = items.slice(max);
    const icons = variant === "icons";
    const one = (n) => {
      const ico = stackIcon(n, { alt: icons ? n : "" });
      const name = icons ? "" : `<span>${esc(n)}</span>`;
      const hit = pressed && pressed.has?.(n) ? " is-hit" : "";
      if (as === "button") return `<li><button type="button" class="ystk${hit}" data-yf="stack:${esc(n)}" title="Filter by ${esc(n)}"${icons ? ` aria-label="${esc(n)}"` : ""}>${ico}${name}</button></li>`;
      return `<li class="ystk${hit}"${icons ? ` title="${esc(n)}"` : ""}>${ico}${name}</li>`;
    };
    const more = rest.length ? `<li class="ystk ystk--more" title="${esc(rest.join(", "))}"><span aria-hidden="true">+${rest.length}</span><span class="sr-only">and ${esc(rest.join(", "))}</span></li>` : "";
    return `<ul class="ystack${icons ? " ystack--icons" : ""}${size === "sm" ? " ystack--sm" : ""}" aria-label="${esc(label)}">${shown.map(one).join("")}${more}</ul>`;
  }
  // topic tags → thoughts page filtered by the tag (from any page)
  const tagHref = (t) => kitURL(`../thoughts/stitched.html?tag=${encodeURIComponent(t)}`);
  function tag(t, { as = "a", pressed = false, href } = {}) {
    const inner = `<span class="ychip__l"><span class="ytag__h" aria-hidden="true">#</span>${esc(t)}</span>`;
    if (as === "button") return `<button type="button" class="ytag" data-tag="${esc(t)}" aria-pressed="${!!pressed}">${inner}</button>`;
    return `<a class="ytag" href="${href || tagHref(t)}" data-tag="${esc(t)}">${inner}</a>`;
  }
  const tags = (list, o = {}) => (asArr(list).length ? `<ul class="ytags" aria-label="Tags">${asArr(list).map((t) => `<li>${tag(t, { ...o, pressed: o.pressed?.has?.(t) })}</li>`).join("")}</ul>` : "");

  /* ============================================================
     PAGE HEADER + SEGMENTED CONTROL
     ============================================================ */
  function header({ title, meta: m = "", actions = "", level = 1, id = "" } = {}) {
    return `<header class="yhead"><div class="yhead__text"><h${level} class="yhead__title"${id ? ` id="${id}"` : ""}>${esc(title)}<span class="yhead__dot" aria-hidden="true">.</span></h${level}>${m ? `<p class="yhead__meta meta">${m}</p>` : ""}</div>${actions ? `<div class="yhead__actions">${actions}</div>` : ""}</header>`;
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
    instrument: (it) => it.instrument,
    tag: (it) => it.tags,
  };
  function valueInfo(kind, v) {
    if (v && typeof v === "object") return { value: String(v.value), label: v.label ?? String(v.value), icon: v.icon || "", img: v.img || "" };
    const s = String(v);
    if (kind === "status") { const st = status(s); return { value: st?.key || slug(s), label: st?.label || s, iconHTML: st ? (st.key === "ongoing" ? `<i class="ph-bold ph-needle" aria-hidden="true"></i>` : `<span class="ychip__ic" aria-hidden="true">${st.icon}</span>`) : "" }; }
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

  /* ---------- chip markup (filter row, Browse, tokens) ---------- */
  function chip(g, vi, { pressed = false, count = null, cls = "", attrs = "" } = {}) {
    return `<button type="button" class="ychip ysel ${cls}" data-g="${esc(g.key)}" data-v="${esc(vi.value)}" aria-pressed="${pressed}" ${attrs}>${iconOf(vi)}<span class="ychip__l">${esc(vi.label)}</span>${count != null ? `<span class="ychip__c" aria-hidden="true">${count}</span>` : ""}</button>`;
  }

  /* ============================================================
     FILTER ROW + BROWSE SHEET
     ============================================================ */
  // wrap: chips wrap onto a second line instead of scrolling (phones with ≤ ~7 chips)
  // extra: [{ label, html }] link groups shown in the Browse sheet after the filters (Thoughts: Collections, write-ups)
  function filterRow(host, F, { all = "Show all", browse = true, sticky = false, wrap = false, extra = [], label = "Filters", counts = false, browseLabel = "Browse" } = {}) {
    host.classList.add("yfilter");
    if (sticky) host.classList.add("yfilter--sticky");
    host.classList.toggle("yfilter--wrap", !!wrap);
    const rowGroups = F.groups.filter((g) => g.row);
    const sheetId = uid("browse");
    F._row = { host, groups: rowGroups.map((g) => g.key) };
    host.innerHTML = `
      <div class="yfilter__scroll" role="group" aria-label="${esc(label)}">
        <button type="button" class="ychip ysel" data-all aria-pressed="true">${esc(all)}</button>
        ${rowGroups.map((g) => `<span class="yfilter__div" aria-hidden="true"></span><div class="yfilter__grp" role="group" aria-label="${esc(g.label)}">${g.values.map((vi) => chip(g, vi)).join("")}</div>`).join("")}
      </div>
      ${browse ? `<button type="button" class="ychip yfilter__browse" aria-expanded="false" aria-controls="${sheetId}"><i class="ph-bold ph-faders-horizontal" aria-hidden="true"></i><span>${esc(browseLabel)}</span><span class="ychip__n" aria-hidden="true"></span></button>
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
        if (!reduced()) { const sp = springEasing({ response: 0.36 }); anim = sheet.animate([{ opacity: 0, transform: "translateY(-8px) scale(.94)" }, { opacity: 1, transform: "none" }], { duration: sp.duration, easing: sp.easing }); }
        ($(".ychip[aria-pressed='true']", sheet) || $(".ychip", sheet))?.focus({ preventScroll: true });
        document.addEventListener("pointerdown", outside, true);
      } else {
        document.removeEventListener("pointerdown", outside, true);
        sound("close", { el: bBtn });
        const done = () => { sheet.hidden = true; };
        if (reduced()) done();
        else { anim = sheet.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(-6px) scale(.96)" }], { duration: 150, easing: "cubic-bezier(.4,0,1,1)" }); anim.onfinish = done; }
        if (focusBack || sheet.contains(document.activeElement)) bBtn.focus({ preventScroll: true });
      }
    }
    function outside(e) { if (!host.contains(e.target)) setOpen(false); }
    host.addEventListener("keydown", (e) => { if (e.key === "Escape" && sheet && !sheet.hidden) { e.stopPropagation(); setOpen(false, true); } });
    if (sticky) watchStuck(host);
    if (params.get("browse") === "open" && sheet) requestAnimationFrame(() => { setOpen(true); });
    return { el: host, open: () => setOpen(true), close: () => setOpen(false), paint, sheet };
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
    return () => { io.disconnect(); s.remove(); };
  }

  /* ============================================================
     SEARCH — full-width line; known terms turn into removable tokens
     ============================================================ */
  function search(host, F, { placeholder = "Search", label = "Search", hint = true } = {}) {
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
    const tokenGroups = () => F.groups.filter((g) => !(g.row && F._row));
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
      if (t.g.row && F._row) { // the row chip is the removable chip for this group: pulse it into view
        const c = F._row.host.querySelector(`.yfilter__grp .ychip[data-g="${CSS.escape(t.g.key)}"][data-v="${CSS.escape(t.vi.value)}"]`);
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
    if (hint) document.addEventListener("keydown", (e) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target; if (t.closest?.("input, textarea, select, [contenteditable='true']")) return;
      e.preventDefault(); input.focus(); input.select();
    });
    F.on((_, src) => { if (src !== "search" && input.value !== F.q) input.value = F.q; renderTokens(); });
    renderTokens();
    return { el: host, input, focus: () => input.focus(), typeDemo: (s) => { input.value = s; input.dispatchEvent(new Event("input")); } };
  }

  /* ============================================================
     FLIP — items glide to new slots, new ones grow in, leaving ones fade out
     Yarn.flip(root, "[data-key]", () => { …hide/show or re-render… }, opts)
     ============================================================ */
  const keyOf = (el) => el.dataset.key || el.dataset.id || el.dataset.slug || el.id || null;
  function flip(root, selector, mutate, { key = keyOf, response = 0.44, enter = true, exit = true, stagger = 16 } = {}) {
    if (typeof selector === "function") { mutate = selector; selector = ":scope > *"; }
    const before = new Map();
    for (const el of root.querySelectorAll(selector)) {
      if (!isShown(el)) continue;
      el._yfx?.stop(); el._yfy?.stop(); el.style.transform = "";
      const k = key(el); if (k != null) before.set(k, { r: el.getBoundingClientRect(), el });
    }
    mutate();
    if (reduced()) return;
    const rr = root.getBoundingClientRect();
    // rects are on-screen px; transforms and offsets inside a zoomed list are in its own (unzoomed) px
    const zr = zoomOf(root);
    const seen = new Set();
    let ei = 0;
    for (const el of root.querySelectorAll(selector)) {
      if (!isShown(el)) continue;
      const k = key(el); if (k == null) continue;
      seen.add(k);
      const b = before.get(k);
      if (!b) {
        if (enter) el.animate([{ opacity: 0, transform: "scale(.94)" }, { opacity: 1, transform: "none" }], { duration: 300, delay: Math.min(ei++ * stagger, 140), easing: "cubic-bezier(.2,.8,.2,1)", fill: "backwards" });
        continue;
      }
      const l = el.getBoundingClientRect();
      const z = zoomOf(el);
      const dx = (b.r.left - l.left) / z, dy = (b.r.top - l.top) / z;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue;
      const paint = () => { const x = el._yfx.value, y = el._yfy.value; el.style.transform = Math.abs(x) + Math.abs(y) < 0.01 ? "" : `translate3d(${x}px, ${y}px, 0)`; };
      el._yfx ||= new Spring(0, { rest: 0.3, onUpdate: paint });
      el._yfy ||= new Spring(0, { rest: 0.3, onUpdate: paint });
      el._yfx.set(dx); el._yfy.set(dy);
      el._yfx.to(0, { response }); el._yfy.to(0, { response });
    }
    if (!exit) return;
    let restore = null;
    for (const [k, b] of before) {
      if (seen.has(k)) continue;
      if (getComputedStyle(root).position === "static") { restore ??= root.style.position; root.style.position = "relative"; }
      const g = b.el.cloneNode(true);
      g.removeAttribute("id"); g.hidden = false; g.inert = true; g.setAttribute("aria-hidden", "true");
      g.querySelectorAll("[id]").forEach((n) => n.removeAttribute("id"));
      Object.assign(g.style, { position: "absolute", left: `${(b.r.left - rr.left) / zr - root.clientLeft + root.scrollLeft}px`, top: `${(b.r.top - rr.top) / zr - root.clientTop + root.scrollTop}px`, width: `${b.r.width / zr}px`, height: `${b.r.height / zr}px`, margin: "0", pointerEvents: "none", zIndex: "0", transform: "", gridRowEnd: "auto" });
      root.appendChild(g);
      g.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "scale(.92)" }], { duration: 220, easing: "cubic-bezier(.4,0,.6,1)", fill: "forwards" }).onfinish = () => {
        g.remove();
        if (restore != null && !root.querySelector(":scope > [aria-hidden='true'][inert]")) { root.style.position = restore; restore = null; }
      };
    }
  }

  /* ============================================================
     YEAR PILL + TIMELINE (+ travelling yarn ball)
     ============================================================ */
  // attrs: extra raw attributes (e.g. `data-key="m:2026-11"` so the pill takes part in Yarn.flip)
  const yearPill = (year, { count = null, unit = "item", id = "", level = 2, attrs = "", cls = "" } = {}) =>
    `<h${level} class="yyear${cls ? ` ${cls}` : ""}"${id ? ` id="${id}"` : ""}${attrs ? ` ${attrs}` : ""}>${esc(year)}${count != null ? `<span class="yyear__n">${count} ${unit}${count === 1 ? "" : "s"}</span>` : ""}</h${level}>`;
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
  function timelineHTML(groups, render, { key = (it) => slug(it.name || it.title || it.id), unit = "item", id = uid("tl"), cls = "" } = {}) {
    return `<div class="ytl${cls ? ` ${cls}` : ""}" data-ytl>${groups.map((g) => `<section class="ytl__group" aria-labelledby="${id}-${g.year}">${yearPill(g.year, { count: g.items.length, unit, id: `${id}-${g.year}` })}<ol class="ytl__list">${g.items.map((it) =>
      `<li class="ytl__item" data-key="${esc(key(it))}"><span class="ytl__knot" aria-hidden="true"></span>${render(it)}</li>`).join("")}</ol></section>`).join("")}</div>`;
  }
  const BALL = `<svg viewBox="0 0 26 26" aria-hidden="true"><circle cx="13" cy="13" r="11.6" fill="#d62f38" stroke="#9e1822" stroke-width="1.2"/>
    <g fill="none" stroke-linecap="round"><g stroke="#9e1822" stroke-width="1.15"><path d="M3.4 9.2C8.2 6.3 15.6 6.2 22.4 9.6"/><path d="M2.3 14.1C8.1 10.6 17 10.6 23.6 14.6"/><path d="M3.7 18.9C9.2 15.4 16.8 15.6 21.9 19.6"/><path d="M9.3 2.6C6.4 8.6 6.8 17.2 10.4 23.7"/></g>
    <g stroke="#fff" stroke-opacity=".42" stroke-width=".9"><path d="M4.6 11.3C9.2 8.4 15.4 8.3 21.6 11.7"/><path d="M15.6 2.6C19.2 8 19.4 16 16.4 23.5"/></g></g>
    <circle cx="9" cy="8" r="2.6" fill="#fff" fill-opacity=".22"/></svg>`;
  function timeline(root, { ball = true, trail = true, response = 0.5, damping = 1 } = {}) {
    root.classList.add("ytl");
    let ballEl = $(":scope > .ytl__ball", root), trailEl = $(":scope > .ytl__trail", root);
    if (ball && !ballEl) { ballEl = document.createElement("span"); ballEl.className = "ytl__ball"; ballEl.setAttribute("aria-hidden", "true"); ballEl.innerHTML = BALL; ballEl.hidden = true; root.appendChild(ballEl); }
    if (ball && trail && !trailEl) { trailEl = document.createElement("span"); trailEl.className = "ytl__trail"; trailEl.setAttribute("aria-hidden", "true"); trailEl.hidden = true; root.prepend(trailEl); }
    let cur = null, placed = false;
    const paint = (y) => {
      if (ballEl) ballEl.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0) rotate(${((y / 12) * 57.3).toFixed(1)}deg)`;
      if (trailEl) trailEl.style.transform = `scaleY(${Math.max(0, y - 18).toFixed(2)})`;
    };
    const sy = new Spring(0, { response, damping, rest: 0.2, onUpdate: paint });
    const itemOf = (k) => (k instanceof Element ? k.closest(".ytl__item") : root.querySelector(`.ytl__item[data-key="${CSS.escape(k)}"]`));
    function knotY(item) {
      const k = $(".ytl__knot", item) || item, r = k.getBoundingClientRect(), rr = root.getBoundingClientRect();
      return r.top - rr.top + r.height / 2;
    }
    function select(k, { instant = false } = {}) {
      const item = k == null ? null : itemOf(k);
      cur = item && isShown(item) ? item : null;
      $$(".ytl__item", root).forEach((i) => i.classList.toggle("is-current", i === cur));
      if (!cur) { if (ballEl) ballEl.hidden = true; if (trailEl) trailEl.hidden = true; placed = false; return null; }
      if (ballEl) ballEl.hidden = false;
      if (trailEl) trailEl.hidden = false;
      const y = knotY(cur);
      if (!placed || instant) { sy.jump(y); placed = true; } else sy.to(y);
      return cur;
    }
    const refresh = ({ instant = true } = {}) => { if (cur) select(cur, { instant }); else if (placed) select(null); };
    // layout moved under the ball (fonts landing, images, filtering): settle on the knot's new spot.
    // Mid-roll it retargets the same spring (keeps its velocity) instead of finishing at the stale y.
    const follow = () => {
      if (!cur || !placed) return;
      const y = knotY(cur);
      if (sy.moving) { if (Math.abs(sy.target - y) > 0.5) sy.to(y); }
      else if (Math.abs(sy.value - y) > 0.5) sy.jump(y);
    };
    const ro = new ResizeObserver(follow);
    ro.observe(root);
    const onFonts = () => requestAnimationFrame(follow);
    document.fonts?.addEventListener?.("loadingdone", onFonts);
    return { el: root, select, refresh, get current() { return cur?.dataset.key ?? null; }, destroy: () => { ro.disconnect(); document.fonts?.removeEventListener?.("loadingdone", onFonts); } };
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
  function detail({ back = null, actions = "", title = "", meta: m = "", media: md = "", body = "", links = "", level = 1, wide = false, id = uid("detail") } = {}) {
    const backHTML = back ? (back.href
      ? `<a class="ydetail__back" href="${esc(back.href)}"><i class="ph-bold ph-arrow-left" aria-hidden="true"></i>${esc(back.label || "Back")}</a>`
      : `<button type="button" class="ydetail__back" data-back><i class="ph-bold ph-arrow-left" aria-hidden="true"></i>${esc(back.label || "Back")}</button>`) : "";
    return `<article class="ydetail${wide ? " ydetail--wide" : ""}${level === 1 ? " ydetail--page" : ""}" aria-labelledby="${id}-t">
      <div class="ydetail__top">${backHTML}<p class="ydetail__mini" aria-hidden="true">${esc(title)}</p><div class="ydetail__actions">${actions}</div></div>
      <header class="ydetail__head">
        <h${level} class="ydetail__title" id="${id}-t">${esc(title)}</h${level}>
        ${m ? `<div class="ydetail__meta">${m}</div>` : ""}</header>
      <div class="ydetail__body">${md}${body ? `<div class="ydetail__text">${body}</div>` : ""}</div>
      ${links ? `<footer class="ydetail__foot"><div class="ydetail__bar">${links}</div></footer>` : ""}
    </article>`;
  }
  function wireDetail(el) {
    if (el._yw) return; el._yw = true; el.dataset.yinit = "";
    const top = $(":scope > .ydetail__top", el), t = $(".ydetail__title", el), f = $(":scope > .ydetail__foot", el);
    if (top && t) { // the compact title shows once the big title has slid under the bar
      let root = el.parentElement;
      while (root && root !== document.body && !/(auto|scroll)/.test(getComputedStyle(root).overflowY)) root = root.parentElement;
      if (root === document.body || root === html) root = null;
      const io = new IntersectionObserver(([en]) => {
        const rb = en.rootBounds || { top: 0 };
        top.classList.toggle("is-stuck", !en.isIntersecting && en.boundingClientRect.top < rb.top + top.offsetHeight);
      }, { root, rootMargin: `-${top.offsetHeight + (parseFloat(getComputedStyle(top).top) || 0)}px 0px 0px 0px` });
      io.observe(t);
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
  // phones: a stuck year pill gets a cotton band the width of the sheet (.yyear.is-stuck), so cards slide under the
  // band instead of colliding with the pill. Stuck = pushed down from its natural spot (first in its group).
  let pillRaf = 0;
  function paintPills() {
    pillRaf = 0;
    const on = compactMQ.matches;
    const sheet = document.querySelector(".sheet"), sr = sheet?.getBoundingClientRect();
    for (const p of $$(".yyear")) {
      let stuck = false;
      if (on && sr && !p.closest(".yrail")) {
        const r = p.getBoundingClientRect();
        if (r.width && r.bottom > -40 && r.top < innerHeight && getComputedStyle(p).position === "sticky") {
          const pr = p.parentElement.getBoundingClientRect();
          stuck = r.top - pr.top > 1 && pr.bottom - r.bottom > 4;
          if (stuck) { p.style.setProperty("--yyear-l", `${Math.max(0, r.left - sr.left - 3)}px`); p.style.setProperty("--yyear-r", `${Math.max(0, sr.right - r.right - 3)}px`); }
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
  function detailPage(detailHTML, { rail = "", wide = false, railLabel = "" } = {}) {
    return `<div class="ydpage ydpage--rail${wide ? " ydpage--wide" : ""}"><div class="ydpage__main">${detailHTML}</div>${rail ? `<aside class="ydpage__rail"${railLabel ? ` aria-label="${esc(railLabel)}"` : ""}>${rail}</aside>` : ""}</div>`;
  }
  // link buttons used by detail footers and cards
  const LINK_ICONS = { github: ["ph-github-logo", "GitHub"], soundcloud: ["ph-soundcloud-logo", "SoundCloud"], youtube: ["ph-youtube-logo", "YouTube"], beepbox: ["ph-circle yduo", "BeepBox song"], spotify: ["ph-spotify-logo", "Spotify"],
    instagram: ["ph-instagram-logo", "Instagram"], x: ["ph-x-logo", "X"], discord: ["ph-discord-logo", "Discord"], email: ["ph-envelope-simple", "Email"], view: ["ph-arrow-up-right", "Visit site"], link: ["ph-link", "Link"] };
  // { sm: true } → 32px (dense rows; the hit area stays 44px on touch)
  const linkIcon = (kind, href, label, { sm = false } = {}) => { const [ic, l] = LINK_ICONS[kind] || LINK_ICONS.link; const ext = /^https?:/i.test(String(href)); return `<a class="ylinkicon${sm ? " ylinkicon--sm" : ""}" href="${esc(href)}"${ext ? ' target="_blank" rel="noopener"' : ""} aria-label="${esc(label || l)}${ext ? " (opens in a new tab)" : ""}" title="${esc(label || l)}"><i class="ph-bold ${ic}" aria-hidden="true"></i></a>`; };

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
  function folder(it, { tracks = null, current = null, links = "", action = "", open = null, meta: m = null, desc = true, count = true, swatchSize = 54, key = "" } = {}) {
    const list = tracks || it.songs || it.tracks || [];
    const coll = it.type === "collection" || it.kind === "collection" || (Array.isArray(it.songs) && it.type !== "single");
    const n = list.length, name = it.name || (coll ? "Untitled collection" : "Untitled track");
    const sw = window.Yarn?.swatchHTML ? window.Yarn.swatchHTML({ instrument: it.instrument, url: it.url || undefined, name: it.name }, { size: swatchSize, radius: 12 }) : "";
    const tab = (t, i) => {
      const now = current != null && (t.id ?? String(i)) === current;
      const tname = String(t.name || `Track ${i + 1}`);
      return `<button type="button" class="yfolder__tab${t.url ? "" : " is-off"}${now ? " is-now" : ""}${i >= n / 2 ? " is-r" : ""}" data-tid="${esc(t.id ?? i)}" style="--i:${i}" tabindex="${i === 0 ? 0 : -1}" data-name="${esc(tname)}${t.url ? "" : " · no audio"}"
        aria-label="${t.url ? "Play" : "Open"} ${esc(tname)}, track ${i + 1} of ${n}${t.url ? "" : " (no audio)"}"${now ? ' aria-current="true"' : ""}><span class="yfolder__tn">${String(i + 1).padStart(2, "0")}</span>${EQ}<span class="yfolder__tt">${esc(tname.replace(/^\d+\s*-\s*/, ""))}</span></button>`;
    };
    const d = desc ? plainText(it.description) : "";
    return `<div class="yfolder ylift${coll ? " yfolder--coll" : ""}"${key ? ` data-folder="${esc(key)}"` : ""}>
      ${coll && n ? `<div class="yfolder__tabs" role="toolbar" aria-label="Tracks in ${esc(name)}" style="--n:${n}">${list.map(tab).join("")}</div>` : ""}
      <div class="ycard ysel yfolder__card">
        ${open ? `<button type="button" class="yfolder__open" ${open.attrs || ""} aria-label="${esc(open.label || `Open ${name}${coll ? `, a collection of ${n} tracks` : ""}`)}"></button>` : ""}
        <div class="yfolder__head">${sw}<div class="yfolder__tt"><h3 class="yfolder__name">${esc(name)}${coll && count ? ` <span class="yfolder__n">(${n} track${n === 1 ? "" : "s"})</span>` : ""}</h3>${m ?? meta(it)}</div></div>
        ${d ? `<p class="yfolder__desc">${esc(d)}</p>` : ""}
        <div class="yfolder__foot"><div class="yfolder__links">${links}</div><span class="yfolder__playing">${EQ}</span>${action}</div>
      </div>
    </div>`;
  }
  // touch: tabs that overlap to under 44px can't be tapped one by one → the strip opens the folder instead
  const coarse = matchMedia("(pointer: coarse)");
  const tabsRO = new ResizeObserver((es) => es.forEach((e) => fitTabs(e.target)));
  function fitTabs(strip) {
    const t = strip.querySelectorAll(".yfolder__tab");
    const step = t.length > 1 ? t[1].offsetLeft - t[0].offsetLeft : Infinity;
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
     FAB → BOTTOM PANEL — a round button above the mobile nav (overlapping it
     a little) that grows into a full-width panel (circle reveal from the
     button) and shrinks back into it. Put a search line / filter row in .body.
     const f = Yarn.fab({ icon, label, title }) → { el, btn, panel, body, open(), close(), badge(n, label), count(text), away(bool) }
     ============================================================ */
  function fab({ icon = "ph-magnifying-glass", label = "Search", title = "", done = "Done", host = null, lift = 0 } = {}) {
    const id = uid("fab");
    const el = document.createElement("div");
    el.className = "yfab";
    if (lift) el.style.setProperty("--yfab-lift", lift + "px"); // stack above another FAB (Studio's "New")
    el.hidden = true;
    el.innerHTML = `<section class="yfab__panel" id="${id}" aria-label="${esc(label)}" tabindex="-1" hidden>
        <div class="yfab__head"><span class="eyebrow">${esc(title || label)}</span><span class="meta yfab__count"></span><button type="button" class="btn btn--ink btn--sm" data-fab-done>${esc(done)}</button></div>
        <div class="yfab__body"></div></section>
      <button type="button" class="btn btn--red btn--icon yfab__btn" aria-expanded="false" aria-controls="${id}" aria-label="${esc(label)}"><i class="ph-bold ${icon}" aria-hidden="true"></i><span class="ychip__n" aria-hidden="true"></span></button>`;
    (host || document.body).appendChild(el);
    const btn = $(".yfab__btn", el), panel = $(".yfab__panel", el), body = $(".yfab__body", el), countEl = $(".yfab__count", el);
    let anim = null;
    const geo = () => {
      const pr = panel.getBoundingClientRect(), br = btn.getBoundingClientRect();
      const cx = br.left + br.width / 2 - pr.left, cy = br.top + br.height / 2 - pr.top;
      return { r0: br.width / 2, cx, cy, R: Math.hypot(Math.max(cx, pr.width - cx), Math.max(cy, pr.height - cy)) + 4 };
    };
    function fitKeyboard() {
      const vv = window.visualViewport;
      if (!vv || panel.hidden) return;
      const ui = px("--bottom-ui");
      const kb = innerHeight - vv.height - vv.offsetTop;
      panel.style.translate = kb > ui ? `0 ${-(kb - ui + 8)}px` : "";
    }
    function outside(e) { if (!el.contains(e.target)) close(); }
    function open({ instant = false } = {}) {
      if (!panel.hidden && !panel.classList.contains("is-closing")) return;
      panel.classList.remove("is-closing");
      panel.hidden = false;
      el.classList.add("is-open");
      btn.setAttribute("aria-expanded", "true");
      const g = geo();
      anim?.cancel();
      if (!instant && !reduced()) {
        const sp = springEasing({ response: 0.42 });
        anim = panel.animate([{ clipPath: `circle(${g.r0}px at ${g.cx}px ${g.cy}px)` }, { clipPath: `circle(${g.R}px at ${g.cx}px ${g.cy}px)` }], { duration: sp.duration, easing: sp.easing });
        $(".yfab__head", panel)?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, delay: 60, easing: "ease-out", fill: "backwards" });
        sound("open", { el: btn });
      }
      document.addEventListener("pointerdown", outside, true);
      const input = $(".ysearch__input", panel);
      if (input && matchMedia("(pointer: fine)").matches) input.focus({ preventScroll: true });
      else panel.focus({ preventScroll: true });
      fitKeyboard();
    }
    function close({ instant = false, focus = false } = {}) {
      if (panel.hidden) return;
      document.removeEventListener("pointerdown", outside, true);
      btn.setAttribute("aria-expanded", "false");
      const done = () => { panel.hidden = true; panel.classList.remove("is-closing"); el.classList.remove("is-open"); panel.style.translate = ""; };
      anim?.cancel();
      if (instant || reduced()) done();
      else {
        const g = geo();
        panel.classList.add("is-closing");
        el.classList.remove("is-open");
        anim = panel.animate([{ clipPath: `circle(${g.R}px at ${g.cx}px ${g.cy}px)` }, { clipPath: `circle(${g.r0}px at ${g.cx}px ${g.cy}px)` }], { duration: 260, easing: "cubic-bezier(.4,0,.2,1)" });
        anim.onfinish = done;
        sound("close", { el: btn });
      }
      if (focus || panel.contains(document.activeElement)) btn.focus({ preventScroll: true });
    }
    btn.addEventListener("click", () => (panel.hidden || panel.classList.contains("is-closing") ? open() : close({ focus: true })));
    panel.addEventListener("click", (e) => { if (e.target.closest("[data-fab-done]")) close({ focus: true }); });
    panel.addEventListener("keydown", (e) => { if (e.key === "Escape" && !e.defaultPrevented) { e.stopPropagation(); close({ focus: true }); } });
    window.visualViewport?.addEventListener("resize", fitKeyboard);
    return {
      el, btn, panel, body, countEl, open, close,
      get isOpen() { return !panel.hidden && !panel.classList.contains("is-closing"); },
      badge(n, aria) { $(".ychip__n", btn).textContent = n || ""; if (aria) btn.setAttribute("aria-label", aria); },
      count(text) { countEl.textContent = text; },
      away(on) { el.classList.toggle("is-away", !!on); },
    };
  }

  /* ============================================================
     LIST TOOLS — one mobile search/filter pattern for every list page (?msearch=bar|fab)
     Yarn.listTools(F, { tools, search, row, sticky, label, title, count, stickyDesk, lift })
       tools  = the .ytools element under the header (search line + filter row live here by default)
       search, row = the hosts Yarn.search / Yarn.filterRow were built on
       sticky = element(s) that get --sticky-top (the list: year pills + detail bars stack under the row)
     bar (default): desktop and phones keep the search line on top; on phones the filter row is sticky.
     fab: on phones both move into a search FAB above the nav (Yarn.fab → bottom panel); a strip of the
          active filters (.yactive, removable chips) stays at the top of the list and the FAB shows a count.
     → { fab, place(), mode, isFab }
     ============================================================ */
  function listTools(F, { tools, search: sHost, row: rHost, sticky = [], label = "Search and filter", title = "Find", count = null, stickyDesk = false, lift = 0 } = {}) {
    const desk = matchMedia("(min-width: 960px)");
    const targets = asArr(sticky).filter(Boolean);
    const strip = document.createElement("div");
    strip.className = "yactive";
    strip.setAttribute("role", "group");
    strip.setAttribute("aria-label", "Active filters");
    strip.hidden = true;
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
    if (rHost) new ResizeObserver(syncTop).observe(rHost);
    function paint() {
      const chips = [];
      for (const g of F.groups) for (const v of F.state[g.key]) chips.push(chip(g, F.info(g.key, v), { pressed: true, cls: "ychip--sm", attrs: `aria-label="Remove ${esc(F.label(g.key, v))}"` }));
      if (F.q.trim()) chips.push(`<button type="button" class="ychip ychip--sm ysel" data-yq aria-pressed="true" aria-label="Clear the search “${esc(F.q.trim())}”"><i class="ph-bold ph-magnifying-glass" aria-hidden="true"></i><span class="ychip__l">“${esc(F.q.trim())}”</span></button>`);
      strip.innerHTML = chips.length ? `${chips.join("")}<button type="button" class="ylinkbtn" data-yclear>Clear all</button>` : "";
      strip.hidden = !(isFab() && chips.length);
      if (fabApi) {
        const n = chips.length, shown = count ? count() : "";
        fabApi.badge(n, `${label}${n ? `, ${n} active${shown ? `, ${shown}` : ""}` : ""}`);
        fabApi.count(shown);
      }
    }
    const clearInput = () => { const i = sHost && $(".ysearch__input", sHost); if (i) i.value = ""; };
    strip.addEventListener("click", (e) => {
      const c = e.target.closest(".ychip[data-g]");
      if (c) { F.toggle(c.dataset.g, c.dataset.v, false, "active"); sound("chip-off", { el: c }); return; }
      if (e.target.closest("[data-yq]")) { clearInput(); F.setQuery("", "active"); sound("tag-remove"); return; }
      if (e.target.closest("[data-yclear]")) { clearInput(); F.clear(null, "active"); sound("chip-off"); }
    });
    function place() {
      const fabNow = isFab();
      if (fabNow) {
        const f = ensureFab();
        f.body.append(...[rHost, sHost].filter(Boolean)); // row on top, search at the bottom (near the thumb)
        tools.append(strip);
        f.el.hidden = false;
      } else {
        tools.append(...[sHost, rHost].filter(Boolean));
        if (strip.parentNode) strip.parentNode.removeChild(strip);
        if (fabApi) { fabApi.close({ instant: true }); fabApi.el.hidden = true; }
      }
      tools.classList.toggle("ytools--fab", fabNow);
      const stick = !!rHost && !fabNow && (stickyDesk || !desk.matches);
      rHost?.classList.toggle("yfilter--sticky", stick);
      unStick?.(); unStick = null;
      if (stick) unStick = watchStuck(rHost); else rHost?.classList.remove("is-stuck");
      syncTop(); paint();
    }
    const offF = F.on(paint);
    desk.addEventListener("change", place);
    place();
    if (params.get("fab") === "open" && isFab()) requestAnimationFrame(() => fabApi?.open({ instant: true }));
    // views that re-render in place (Studio): when the tools leave the page, so do the FAB and the listeners
    const entry = { tools, destroy() { LISTTOOLS.delete(entry); offF(); desk.removeEventListener("change", place); unStick?.(); fabApi?.close({ instant: true }); fabApi?.el.parentNode?.removeChild(fabApi.el); fabApi = null; } };
    LISTTOOLS.add(entry);
    return { get fab() { return fabApi; }, place, paint, strip, get mode() { return OPT.msearch; }, isFab, destroy: entry.destroy };
  }
  const LISTTOOLS = new Set();
  const sweepListTools = () => { for (const e of [...LISTTOOLS]) if (!e.tools.isConnected) e.destroy(); };

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
    { key: "contact", label: "Contact", href: "home/index.html?skip#contact", icon: "ph-envelope-simple" },
  ];
  const SOUND_SLOT = (cls) => `<button type="button" class="${cls}" data-sound-toggle hidden aria-label="Sound effects"><i class="ph-bold ph-speaker-simple-slash" aria-hidden="true"></i></button>`;
  // Both bars from one page list. A page: { key, label, href, icon, section?, tab?: bool (desktop), bar?: bool (mobile) }.
  // Defaults: the site's pages (home is the brand on desktop, contact is desktop-only).
  // Other apps (Studio) pass their own list + brand/label/extra; `section` dyes the felt dot.
  function navHTML({ active = "", base = "../", pages = null, brand = null, label = "Main", badge = "", extra = "", material = OPT.nav } = {}) {
    const list = pages || PAGES.map((p) => ({ ...p, href: base + p.href, tab: p.key !== "home", bar: p.key !== "contact" }));
    const cur = (p) => (p.key === active ? ' aria-current="page"' : "");
    const sec = (p) => esc(p.section || (p.key === "contact" ? "contact" : p.key));
    const ico = (p) => `<span class="ydot" aria-hidden="true"><i class="${p.key === active ? "ph-fill" : "ph-bold"} ${p.icon}"></i></span>`;
    const tab = (p) => `<li><a class="ynav__tab ysel ylift${p.key === "contact" ? " ynav__tab--contact" : ""}" data-section="${sec(p)}" href="${esc(p.href)}"${cur(p)}>${ico(p)}<span>${esc(p.label)}</span></a></li>`;
    const item = (p) => `<a class="ybar__item ysel" data-section="${sec(p)}" href="${esc(p.href)}"${cur(p)}>${ico(p)}<span>${esc(p.label)}</span></a>`;
    const b = brand || { href: `${base}home/index.html`, label: "" };
    return `
      <a class="yskip btn btn--ink" href="#y-main">Skip to content</a>
      <nav class="ynav" aria-label="${esc(label)}">
        <a class="ynav__brand" href="${esc(b.href)}"${b.label ? ` aria-label="${esc(b.label)}"` : ""}>${catSVG("", "var(--ink)")}<b>blaqat<i>.</i>net</b></a>
        ${badge}
        <ul class="ynav__tabs">${list.filter((p) => p.tab !== false).map(tab).join("")}</ul>
        ${extra}
        ${SOUND_SLOT("ynav__sound")}
      </nav>
      <nav class="ybar m-${esc(material)}" aria-label="${esc(label)} (mobile)">
        ${list.filter((p) => p.bar !== false).map(item).join("")}
        ${SOUND_SLOT("ybar__sound")}
      </nav>`;
  }
  // <yarn-nav active base> renders the site nav; set el.config = { pages, brand, label, badge, extra } for another page list (Studio)
  class YarnNav extends HTMLElement {
    static get observedAttributes() { return ["active"]; }
    attributeChangedCallback() { if (this._done) this.render(); }
    connectedCallback() { if (!this._done) { this._done = true; this.render(); } }
    get config() { return this._config || null; }
    set config(c) { this._config = c; if (this._done) this.render(); }
    render() {
      const material = params.get("nav") ? OPT.nav : this.getAttribute("material") || OPT.nav;
      this.innerHTML = navHTML({ active: this.getAttribute("active") || "", base: this.getAttribute("base") ?? "../", material, ...(this._config || {}) });
    }
  }
  if (!customElements.get("yarn-nav")) customElements.define("yarn-nav", YarnNav);

  /* ============================================================
     SECTION TRANSITION
     go(trigger, href, section): cord cloth grows out of the trigger
     (one spring, no stalls), then navigates once the screen is covered.
     The next page is held behind its cord until the white sheet grows
     open from the same spot; content fades in under the white.
     ============================================================ */
  const transition = {
    busy: null,
    go(trigger, href, section, { freeze = null, dim = true } = {}) {
      if (transition.busy) return;
      const rb = (trigger?.getBoundingClientRect?.()) || { left: innerWidth / 2 - 60, top: innerHeight / 2 - 24, width: 120, height: 48 };
      const W = innerWidth, H = innerHeight;
      const ov = document.createElement("div");
      ov.className = "ytr"; ov.dataset.section = section || ""; ov.setAttribute("aria-hidden", "true");
      ov.innerHTML = `<div class="ytr__cloth"></div>`;
      document.body.appendChild(ov);
      const cloth = ov.firstChild;
      const rect = { x: rb.left, y: rb.top, w: rb.width, h: rb.height };
      try { sessionStorage.setItem(TR_KEY, JSON.stringify({ t: Date.now(), section, rect: { x: rect.x / W, y: rect.y / H, w: rect.w / W, h: rect.h / H, r: Math.min(rect.h / 2, 30) } })); } catch (_) {}
      const nav = () => { if (transition.busy && !transition.busy.cancelled) location.href = href; };
      sound("cloth", { el: trigger });
      let anims;
      const RM = reduced();
      if (RM) {
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
      const sp = springEasing({ response: 0.5 });
      // progress at which every edge has passed the viewport edge
      const need = Math.max(rect.y, W - rect.x - rect.w, H - rect.y - rect.h, rect.x);
      const covered = sp.at(need / (need + over) + 0.004);
      anims = [cloth.animate([{ clipPath: from }, { clipPath: to }], { duration: sp.duration, easing: sp.easing, fill: "forwards" })];
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
      const extras = $$("yarn-player, .mockpanel, .ybar");
      if (reduced()) {
        done();
        sheet.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240, easing: "ease-out" });
        return;
      }
      const sr = sheet.getBoundingClientRect(), W = innerWidth, H = innerHeight;
      const R = trIn?.rect ? { x: trIn.rect.x * W, y: trIn.rect.y * H, w: trIn.rect.w * W, h: trIn.rect.h * H, r: trIn.rect.r } : { x: W / 2 - 70, y: Math.min(H, sr.bottom) / 2 - 26, w: 140, h: 52, r: 26 };
      const rad = parseFloat(getComputedStyle(sheet).borderTopLeftRadius) || 22;
      const visBottom = Math.max(0, sr.bottom - H);
      const ins = (t, r, b, l, k) => `inset(${t.toFixed(1)}px ${r.toFixed(1)}px ${b.toFixed(1)}px ${l.toFixed(1)}px round ${k.toFixed(1)}px)`;
      const from = ins(R.y - sr.top, sr.right - R.x - R.w, sr.bottom - R.y - R.h, R.x - sr.left, R.r || R.h / 2);
      const to = ins(Math.max(0, -sr.top), 0, visBottom, 0, rad);
      const sp = springEasing({ response: 0.56 });
      const a = sheet.animate([{ clipPath: from }, { clipPath: to }], { duration: sp.duration, easing: sp.easing, fill: "both" });
      const kids = [...sheet.children].map((c) => c.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 380, delay: 120, easing: "ease-out", fill: "backwards" }));
      const ex = extras.map((c) => c.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, delay: sp.duration * 0.55, easing: "ease-out", fill: "backwards" }));
      html.classList.remove("yt-enter");
      if (freeze != null) { [a, ...kids, ...ex].forEach((x) => { x.pause(); x.currentTime = freeze * sp.duration; }); return; }
      a.finished.then(() => a.cancel()).catch(() => {});
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
  const scrRO = new ResizeObserver((es) => es.forEach((e) => drawScribble(e.target)));
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
    if (!el._yscr) { el._yscr = true; el.dataset.yinit = ""; el.classList.add("yscribble"); scrRO.observe(el); }
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
  const KIT_GROUPS = () => [
    { label: "Selected style", param: "sel", options: [["rope", "Rope ring"], ["ink", "Ink fill"]], default: DEFAULTS.sel },
    { label: "Rope", param: "rope", options: [["in", "On the edge"], ["out", "Around"]], default: DEFAULTS.rope },
    { label: "Body font", param: "body", options: Object.entries(BODY_FONTS).map(([k, v]) => [k, v.label]), default: DEFAULTS.body },
    { label: "Background", param: "bg", options: [...BG_OPTIONS, ...(OPT.bg && !BG_OPTIONS.some(([v]) => v === OPT.bg) ? [[OPT.bg, OPT.bg]] : [])], default: BG_DEFAULT },
    { label: "Mobile search (list pages)", param: "msearch", options: [["bar", "Top bar + sticky filters"], ["fab", "Search FAB → panel"]], default: "bar" },
    { label: "Mobile nav", param: "nav", options: [["corduroy", "Corduroy"], ["cork", "Cork"]], default: DEFAULTS.nav },
    { label: "Motion", param: "reduced", options: [["", "Full"], ["1", "Reduced"]], default: "" },
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
      document.body.appendChild(panel);
    }
    const fs = (g) => {
      const cur = params.get(g.param) ?? g.default ?? "";
      return `<fieldset><legend>${esc(g.label)}</legend>${g.options.map(([v, l]) => `<button type="button" data-p="${esc(g.param)}" data-v="${esc(v)}" aria-pressed="${String(cur === v)}">${esc(l)}</button>`).join("")}</fieldset>`;
    };
    const open = panel.open;
    panel.innerHTML = `<summary>${esc(pageTitle)}</summary>${pageGroups.length ? `<h4>This page</h4>${pageGroups.map(fs).join("")}` : ""}<h4>Kit (every page)</h4>${KIT_GROUPS().map(fs).join("")}`;
    panel.open = open;
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
    const b = e.target.closest?.(".btn, .ynav__tab, .ybar__item, .yseg__btn, .ylinkicon, .ydetail__back, .ynav__brand");
    if (b) sound("tap", { el: b });
  });
  // folder tabs: arrows move along the strip (roving tabindex); a dense strip on touch opens its folder
  document.addEventListener("keydown", (e) => {
    const tab = e.target.closest?.(".yfolder__tab");
    if (!tab || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const tabs = $$(".yfolder__tab", tab.parentElement), i = tabs.indexOf(tab);
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
    $$(".yfolder__tabs:not([data-yinit])", root).forEach((s) => { s.dataset.yinit = ""; tabsRO.observe(s); fitTabs(s); });
  }
  let upPending = false;
  const mo = new MutationObserver(() => {
    if (upPending) return;
    upPending = true;
    queueMicrotask(() => { upPending = false; if (LISTTOOLS.size) sweepListTools(); if (document.querySelector(".yscribble:not([data-yinit]), .ydetail:not([data-yinit]), .yfolder__tabs:not([data-yinit])")) upgrade(); });
  });

  /* ============================================================
     MODULES (swatch.js, lightbox.js sync; sound.js async)
     ============================================================ */
  include("js", kitURL("swatch.js"));
  include("js", kitURL("lightbox.js"));
  include("js", kitURL("posts.js"));
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
      Promise.race([document.fonts?.ready || Promise.resolve(), new Promise((r) => setTimeout(r, 350))]).then(go);
    }
  });

  window.Yarn = Object.assign(window.Yarn || {}, {
    version: "i2",
    params, reduced, opts: OPT, kitURL, ready,
    // utils
    esc, slug, hash, rng, clamp, Spring, springEasing, sound, uid, px,
    // vocab + format
    STATUS, TYPE, INSTRUMENT, PUB, DEVICONS, status, type, instrument, devicon, stackIcon,
    parseDate, fmt, dateRange, duration, yearOf, media, isVideo, fmtTime,
    // renderers
    badge, meta, stack: stackList, tag, tags, tagHref, header, seg, chip, yearPill, byYear, timelineHTML, carousel, detail, linkIcon,
    disc, wave, folder, navHTML, EQ,
    // behaviour
    filters, filterRow, search, flip, timeline, watchStuck, wireDetail, transition, scribble, mockPanel, upgrade, yearRail, fab, listTools, detailPage,
    // brand
    CAT_PATH, catSVG,
  });
})();
