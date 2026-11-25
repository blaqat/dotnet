/* ============================================================
   blaqat.net · round 3 · <yarn-player>  (owner: music)
   One global player. Self-contained: injects its own CSS into a
   shadow root, reads window.BLAQAT.music when present, owns the one
   <audio> element, persists track/position/volume in localStorage.

   Include on any page:
     <yarn-player></yarn-player>
     <script src="../kit/player.js" defer></script>
   (an optional desktop="dock" attribute or ?pmode=dock docks the
   expanded view as a right column instead of a panel over the bar)

   API  window.YarnPlayer
     play(track, queue?)  track = library id ("vgm-class_combat"), audio url,
                          track name, or { name, url, ... }; queue = array of same
     toggle() pause() next() prev() seek(sec) enqueue(track, {next}) setShuffle(on?)
     expand() collapse()
     state                live snapshot { track, queue, index, playing, time,
                          duration, volume, muted, shuffle, repeat, expanded, demo }
     on(fn) -> off        fn(state, kind); kind: track|state|queue|volume|expand|time
                          (also window "yarnplayer" CustomEvent, without "time")
     library  swatch(track, opts)  durationOf(track)  icon(name)  meta{…}

   URL  ?demo            believable "playing" state, no audio ("combat", 1:12)
        ?demo=live       same, but the clock runs
        ?player=expanded open on load      ?player=mini   force collapsed
        ?player=0.5      freeze the open/close morph at that progress (review)
        ?pmode=float|dock desktop expanded mode    ?ios=1  mute-only volume
        ?c=<id>,<sec>    load a shared track at a time (paused)
        ?reduced         reduced motion
   Sets  --bottom-ui on <html>: space the mini player + mobile nav take
   (desktop: the floating bar). html.yp-docked while the dock is open.
   ============================================================ */
(() => {
  "use strict";
  if (window.YarnPlayer) return;

  /* ---------------- environment ---------------- */
  const params = new URLSearchParams(location.search);
  const DEMO = params.has("demo") && params.get("demo") !== "0";
  const DEMO_LIVE = params.get("demo") === "live";
  const FORCE = params.get("player");
  const LS = "yarn-player:v1";
  const LS_DUR = "yarn-player:durations";
  const reduced = () => params.has("reduced") || matchMedia("(prefers-reduced-motion: reduce)").matches;
  const compactMQ = matchMedia("(max-width: 959px)");
  const IOS =
    params.get("ios") === "1" ||
    (params.get("ios") !== "0" &&
      (/iP(hone|od|ad)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)));

  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } },
  };

  /* ---------------- small utils ---------------- */
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const fmt = (s) => { s = Math.max(0, Math.floor(s || 0)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
  const slug = (s) => String(s).toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-") || "x";
  function hash(str) { let h = 2166136261; for (const ch of String(str)) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) {
    let a = seed >>> 0;
    return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function mix(hex, to, t) {
    const a = parseInt(hex.slice(1), 16), b = parseInt(to.slice(1), 16);
    const ch = (s) => Math.round(((a >> s) & 255) + (((b >> s) & 255) - ((a >> s) & 255)) * t);
    return "#" + ((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1);
  }
  // Apple's momentum projection + rubber band
  const project = (v, d = 0.998) => ((v / 1000) * d) / (1 - d);
  const rubber = (o, dim, c = 0.55) => (o * dim * c) / (dim + c * Math.abs(o));

  /* critically damped by default; damping < 1 only after a flick */
  function spring(from, to, v0, { damping = 1, response = 0.36 } = {}, onUpdate, onDone) {
    const k = Math.pow((2 * Math.PI) / response, 2), c = (4 * Math.PI * damping) / response;
    let x = from, v = v0, last = performance.now(), id = 0, live = true;
    const tick = (now) => {
      if (!live) return;
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
      const n = Math.max(1, Math.ceil(dt / 0.004)), h = dt / n;
      for (let i = 0; i < n; i++) { const a = -k * (x - to) - c * v; v += a * h; x += v * h; }
      if (Math.abs(x - to) < 0.0008 && Math.abs(v) < 0.03) { x = to; v = 0; live = false; onUpdate(x); onDone && onDone(); return; }
      onUpdate(x);
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return { stop() { live = false; cancelAnimationFrame(id); }, get value() { return x; } };
  }

  /* ---------------- icons (inline, so the player works without Phosphor) ---------------- */
  const SPEAKER = '<path d="M4 9.4h3.1L12 5.6v12.8l-4.9-3.8H4a1 1 0 0 1-1-1V10.4a1 1 0 0 1 1-1z" fill="currentColor" stroke="none"/>';
  const ICONS = {
    play: '<path d="M8.5 5.3v13.4a1 1 0 0 0 1.53.85l10.6-6.7a1 1 0 0 0 0-1.7L10.03 4.45a1 1 0 0 0-1.53.85z" fill="currentColor" stroke="none"/>',
    pause: '<rect x="6.3" y="5" width="4.1" height="14" rx="1.4" fill="currentColor" stroke="none"/><rect x="13.6" y="5" width="4.1" height="14" rx="1.4" fill="currentColor" stroke="none"/>',
    prev: '<path d="M5.5 5.5v13"/><path d="M19 6.1v11.8a.9.9 0 0 1-1.4.74l-8.4-5.9a.9.9 0 0 1 0-1.48l8.4-5.9a.9.9 0 0 1 1.4.74z" fill="currentColor" stroke="none"/>',
    next: '<path d="M18.5 5.5v13"/><path d="M5 6.1v11.8a.9.9 0 0 0 1.4.74l8.4-5.9a.9.9 0 0 0 0-1.48l-8.4-5.9A.9.9 0 0 0 5 6.1z" fill="currentColor" stroke="none"/>',
    shuffle: '<path d="M3 7h3.2c4.6 0 6.6 10 11.3 10H21"/><path d="M3 17h3.2c1.9 0 3.2-1.7 4.3-3.7"/><path d="M13.5 9.7C14.6 8 15.9 7 17.5 7H21"/><path d="M18.5 4.5 21 7l-2.5 2.5M18.5 14.5 21 17l-2.5 2.5"/>',
    repeat: '<path d="M4 12V9.6A3.6 3.6 0 0 1 7.6 6H20"/><path d="M17 3l3 3-3 3"/><path d="M20 12v2.4a3.6 3.6 0 0 1-3.6 3.6H4"/><path d="M7 21l-3-3 3-3"/>',
    repeat1: '<path d="M4 12V9.6A3.6 3.6 0 0 1 7.6 6H20"/><path d="M17 3l3 3-3 3"/><path d="M20 12v2.4a3.6 3.6 0 0 1-3.6 3.6H4"/><path d="M7 21l-3-3 3-3"/><path d="M11.1 10.6 12.6 9.6v5" stroke-width="1.8"/>',
    vol: SPEAKER + '<path d="M15.6 9.2a4 4 0 0 1 0 5.6"/><path d="M18.3 6.6a7.6 7.6 0 0 1 0 10.8"/>',
    mute: SPEAKER + '<path d="M16 9.6l4.8 4.8M20.8 9.6 16 14.4"/>',
    up: '<path d="M6 15l6-6 6 6"/>',
    down: '<path d="M6 9l6 6 6-6"/>',
    grip: '<g fill="currentColor" stroke="none"><circle cx="9" cy="6.5" r="1.5"/><circle cx="15" cy="6.5" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="17.5" r="1.5"/><circle cx="15" cy="17.5" r="1.5"/></g>',
    link: '<path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1"/><path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    ext: '<path d="M14 5h5v5"/><path d="M19 5l-8 8"/><path d="M18 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h4"/>',
    cloud: '<path d="M7 18.5h10.6a3.8 3.8 0 0 0 .55-7.56A5.8 5.8 0 0 0 7.1 9.55 4.5 4.5 0 0 0 7 18.5z"/>',
    youtube: '<rect x="3" y="6" width="18" height="12" rx="3.6"/><path d="M10.4 9.4v5.2l4.4-2.6z" fill="currentColor"/>',
    beepbox: '<path d="M3 16h3.6V8H11v8h3.6V9.6H18V16h3"/>',
    piano: '<rect x="3.5" y="5" width="17" height="14" rx="2.2"/><path d="M9.2 19v-5.6M14.8 19v-5.6"/><path d="M7.7 5v8.4h3V5M13.3 5v8.4h3V5" fill="currentColor" stroke-width="1.4"/>',
    daw: '<path d="M2.5 12h2.4l1.9-4.6 2.7 10.2 3-13.2 2.8 11.2 1.9-6.1 1.6 2.5h2.7"/>',
    complete: '<circle cx="12" cy="12" r="8.2"/><path d="M8.2 12.3l2.6 2.6 5-5.1"/>',
    wip: '<path d="M5 19 17.4 6.6"/><ellipse cx="18.6" cy="5.4" rx="2.2" ry="1.2" transform="rotate(-45 18.6 5.4)"/><path d="M17.6 6.9c1.6 2.2.1 4.1-2 5.3s-3.3 3.3-1.6 5.8" stroke-dasharray="1.6 2.2"/>',
    dropped: '<circle cx="6.5" cy="17.2" r="2.6"/><circle cx="6.5" cy="6.8" r="2.6"/><path d="M8.6 8.4 20 17M8.6 15.6 20 7"/>',
    note: '<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5" fill="currentColor"/><circle cx="16.5" cy="16" r="2.5" fill="currentColor"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
  };
  const icon = (name, cls = "") =>
    `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ""}</svg>`;

  /* ---------------- meta ---------------- */
  const INST = { daw: "DAW", piano: "Piano", beepbox: "BeepBox", other: "Other" };
  const STATUS = { complete: ["complete", "Complete"], wip: ["wip", "In progress"], dropped: ["dropped", "Dropped"] };
  // yarn colors per instrument (art only; red stays the interactive accent)
  const YARN = {
    daw: { base: "#3f6fbf", motif: "#fbf8f3" },
    piano: { base: "#2b2828", motif: "#f4efe6" },
    beepbox: { base: "#d39a19", motif: "#fffaf0" },
    other: { base: "#7a4e2d", motif: "#fbf8f3" },
  };
  const LINKS = { soundcloud: ["cloud", "SoundCloud"], youtube: ["youtube", "YouTube"], beepbox: ["beepbox", "BeepBox song"] };
  function dates(t) {
    const s = t?.start, e = t?.end;
    if (!s) return "";
    if (!e) return t.status === "wip" ? `${s} – now` : s;
    return s === e ? s : `${s} – ${e}`;
  }
  // tiny markdown: paragraphs, line breaks, **bold**, [links](url), #### headings
  function md(src = "") {
    const inline = (s) =>
      esc(s)
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, txt, u) => {
          const href = u.replace(/&amp;/g, "&").startsWith("/music") ? u.replace(/^\/music\/?/, "../music/index.html") : u;
          const ext = /^https?:/.test(href);
          return `<a href="${href}"${ext ? ' target="_blank" rel="noopener"' : ""}>${txt}</a>`;
        });
    return String(src)
      .trim()
      .split(/\n\s*\n/)
      .map((b) => `<p>${b.split("\n").map((l) => { const h = l.match(/^\s*#{1,6}\s+(.*)$/); return h ? `<strong class="md-h">${inline(h[1])}</strong>` : inline(l); }).join("<br>")}</p>`)
      .join("");
  }

  /* ---------------- library ---------------- */
  let LIB = null;
  function idFromUrl(url) {
    const parts = url.split("/");
    const f = parts[parts.length - 1].replace(/\.[^.]+$/, "");
    return parts.length >= 2 ? `${parts[parts.length - 2]}_${f}` : f;
  }
  function mkTrack(s, coll, i, n) {
    return {
      kind: "track",
      id: s.url ? idFromUrl(s.url) : `${coll ? coll.id + "_" : ""}${slug(s.name)}`,
      name: s.name,
      url: s.url || null,
      instrument: s.instrument || coll?.instrument || "other",
      status: s.status || coll?.status || "complete",
      start: s.start, end: s.end,
      description: s.description || "",
      links: Object.fromEntries(Object.entries(s.links || {}).filter(([, v]) => v)),
      artist: s.artist || null,
      collection: coll ? coll.name : null,
      collectionId: coll ? coll.id : null,
      index: i + 1,
      count: n,
    };
  }
  function library() {
    if (LIB) return LIB;
    LIB = { entries: [], tracks: [], byId: new Map(), collections: new Map() };
    const add = (t) => { let id = t.id, k = 2; while (LIB.byId.has(id)) id = `${t.id}-${k++}`; t.id = id; LIB.byId.set(id, t); LIB.tracks.push(t); return t; };
    for (const e of window.BLAQAT?.music || []) {
      if (Array.isArray(e.songs)) {
        const coll = {
          kind: "collection", id: slug(e.name), name: e.name, instrument: e.instrument || "other", status: e.status || "complete",
          start: e.start, end: e.end, description: e.description || "", tracks: [],
        };
        e.songs.forEach((s, i) => coll.tracks.push(add(mkTrack(s, coll, i, e.songs.length))));
        LIB.entries.push(coll);
        LIB.collections.set(coll.id, coll);
      } else {
        LIB.entries.push(add(mkTrack(e, null, 0, 1)));
      }
    }
    return LIB;
  }
  function resolve(t) {
    if (!t) return null;
    const L = library();
    if (typeof t === "string") {
      const s = t.trim(), low = s.toLowerCase();
      return L.byId.get(s) || L.tracks.find((x) => x.url === s) || L.tracks.find((x) => x.name.toLowerCase() === low) || null;
    }
    if (t.kind === "track" && L.byId.get(t.id) === t) return t;
    const hit = (t.id && L.byId.get(t.id)) || (t.url && L.tracks.find((x) => x.url === t.url));
    if (hit) return hit;
    if (t.url) { // a track that isn't in BLAQAT (e.g. a thoughts playlist): register it
      const nt = mkTrack(t, null, 0, 1);
      nt.external = true;
      if (!t.instrument) nt.instrument = "other";
      if (t.collection) nt.collection = t.collection;
      if (L.byId.has(nt.id)) nt.id += "-x";
      L.byId.set(nt.id, nt); L.tracks.push(nt);
      return nt;
    }
    return null;
  }

  /* ---------------- durations (real once heard; seeded estimate otherwise) ---------------- */
  const realDur = store.get(LS_DUR, {}) || {};
  const RANGE = { beepbox: [64, 172], piano: [96, 258], daw: [88, 236] };
  function durationOf(t) {
    t = resolve(t);
    if (!t) return 0;
    if (realDur[t.id]) return realDur[t.id];
    if (t.id === "vgm-class_combat") return 185;
    const [a, b] = RANGE[t.instrument] || [90, 220];
    return Math.round(a + rng(hash(t.id + "#len"))() * (b - a));
  }

  /* ---------------- seeded pseudo-waveform ---------------- */
  function waveVals(t, n) {
    const id = t?.id || "x";
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

  /* ---------------- knit swatch: a seeded intarsia square per track ----------------
     instrument picks the yarn color + motif family, the track id picks the motif.
     beepbox → pixel sprites, piano → keys / stripes / argyle, daw → waveforms / fair isle */
  const MOTIFS = { beepbox: ["sprite", "sprite", "sprite", "fairisle"], piano: ["keys", "stripes", "argyle", "keys"], daw: ["wave", "wave", "argyle", "fairisle"] };
  function motifGrid(kind, R, cols, rows) {
    const g = Array.from({ length: rows }, () => new Array(cols).fill(0));
    const set = (r, c, v = 1) => { if (r >= 0 && r < rows && c >= 0 && c < cols) g[r][c] = v; };
    const cx = (cols - 1) / 2, cy = (rows - 1) / 2;
    if (kind === "sprite") {
      const half = Math.ceil(cols / 2) - 1, top = 2, h = rows - 4;
      for (let r = 0; r < h; r++) for (let c = 0; c < half; c++) {
        const p = c === 0 ? 0.3 : c === half - 1 ? 0.62 : 0.5;
        if (R() < p) { set(top + r, 1 + c); set(top + r, cols - 2 - c); }
      }
      // eyes
      const er = top + 1 + Math.floor(R() * 2), ec = Math.floor(cx) - 1;
      for (let c = 1; c < cols - 1; c++) if (g[er][c] === 0 && Math.abs(c - cx) < 3) set(er, c, 1);
      set(er, ec, 0); set(er, cols - 1 - ec, 0);
    } else if (kind === "wave") {
      const A = 1.6 + R() * 1.7, f = 0.5 + R() * 0.55, ph = R() * 6.283, thick = R() < 0.5 ? 1 : 2;
      for (let c = 0; c < cols; c++) { const r = Math.round(cy + A * Math.sin(c * f + ph)); for (let k = 0; k < thick; k++) set(r + k, c); }
      if (R() < 0.75) for (let c = 0; c < cols; c += 2) { set(1, c); set(rows - 2, c + 1); }
    } else if (kind === "argyle") {
      const k = 3 + Math.floor(R() * 2), fill = R() < 0.5;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const d = Math.abs(c - cx) + Math.abs(r - cy) * 0.92;
        if (Math.abs(d - k) < 0.55 || (fill && d < 1.1)) set(r, c);
      }
      if (R() < 0.7) { set(0, 0); set(0, cols - 1); set(rows - 1, 0); set(rows - 1, cols - 1); set(1, 1); set(1, cols - 2); set(rows - 2, 1); set(rows - 2, cols - 2); }
    } else if (kind === "keys") {
      const top = 1 + Math.floor(R() * 3), bot = rows - 1 - Math.floor(R() * 2);
      const off = Math.floor(R() * 4);
      for (let r = top; r < bot; r++) for (let c = 0; c < cols; c++) if ((c + off) % 4 !== 3) set(r, c);
      const bk = [1, 1, 0, 1, 1, 1, 0];
      let j = Math.floor(R() * 7);
      const bh = Math.ceil((bot - top) * 0.58);
      for (let c = 0; c < cols; c++) if ((c + off) % 4 === 3) { if (bk[j++ % 7]) for (let r = top; r < top + bh; r++) { set(r, c - 1, 0); set(r, c + 1, 0); } }
    } else if (kind === "stripes") {
      let r = 1 + Math.floor(R() * 2);
      while (r < rows - 1) { const h = 1 + Math.floor(R() * 2); for (let k = 0; k < h; k++) for (let c = 0; c < cols; c++) set(r + k, c); r += h + 1 + Math.floor(R() * 3); }
      const dr = Math.floor(R() * rows);
      if (g[dr].every((v) => !v)) for (let c = R() < 0.5 ? 0 : 1; c < cols; c += 2) set(dr, c);
    } else { // fair isle band
      const w = 3, h = 5;
      const half = Array.from({ length: h }, () => Array.from({ length: w }, () => (R() < 0.5 ? 1 : 0)));
      half[2][w - 1] = 1; half[0][w - 1] = R() < 0.5 ? 1 : 0;
      const period = w * 2, r0 = Math.round(cy - 2), shift = Math.floor(R() * period);
      for (let c = 0; c < cols; c++) {
        const m = (c + shift) % period, mc = m < w ? m : m < 2 * w - 1 ? 2 * w - 2 - m : -1;
        if (mc < 0) continue;
        for (let r = 0; r < h; r++) if (half[r][mc]) set(r0 + r, c);
      }
      for (let c = 0; c < cols; c += 2) { set(r0 - 2, c); set(r0 + h + 1, c + 1); }
    }
    return g;
  }
  const swCache = new Map();
  function swatch(t, { cols = 11, rows = 13, kind, seed } = {}) {
    let inst = "other", key;
    if (typeof t === "string") { const r = resolve(t); if (r) t = r; }
    if (t && typeof t === "object") { inst = t.instrument || "other"; key = seed || t.id || t.name; }
    else key = seed || String(t);
    const ck = `${key}|${inst}|${cols}x${rows}|${kind || ""}`;
    if (swCache.has(ck)) return swCache.get(ck);
    const pal = YARN[inst] || YARN.other;
    const R = rng(hash(key));
    const fam = MOTIFS[inst] || ["stripes", "argyle"];
    const g = motifGrid(kind || fam[Math.floor(R() * fam.length)], R, cols, rows);
    const CW = 10, CH = 8.4, W = cols * CW, H = rows * CH;
    const leg = (f) =>
      `<ellipse cx="2.75" cy="4.4" rx="2.5" ry="4.8" transform="rotate(-23 2.75 4.4)" fill="${f}"/><ellipse cx="7.25" cy="4.4" rx="2.5" ry="4.8" transform="rotate(23 7.25 4.4)" fill="${f}"/>`;
    const hl = `<path d="M1.5 1.6Q2.2 4.6 4 7.5M8.5 1.6Q7.8 4.6 6 7.5" fill="none" stroke="#fff" stroke-opacity=".24" stroke-width=".7" stroke-linecap="round"/>`;
    let body = "";
    for (let r = -1; r <= rows; r++) for (let c = 0; c < cols; c++) {
      const m = r >= 0 && r < rows && g[r][c];
      body += `<use href="#${m ? "m" : "b"}" x="${c * CW}" y="${(r * CH).toFixed(1)}"/>`;
    }
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H.toFixed(1)}" preserveAspectRatio="xMidYMid slice"><defs>` +
      `<linearGradient id="gb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix(pal.base, "#ffffff", 0.16)}"/><stop offset="1" stop-color="${mix(pal.base, "#000000", 0.2)}"/></linearGradient>` +
      `<linearGradient id="gm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${pal.motif}"/><stop offset="1" stop-color="${mix(pal.motif, pal.base, 0.22)}"/></linearGradient>` +
      `<radialGradient id="v" cx=".5" cy=".42" r=".78"><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".26"/></radialGradient>` +
      `<g id="b">${leg("url(#gb)")}${hl}</g><g id="m">${leg("url(#gm)")}${hl}</g></defs>` +
      `<rect width="${W}" height="${H.toFixed(1)}" fill="${mix(pal.base, "#000000", 0.45)}"/>${body}<rect width="${W}" height="${H.toFixed(1)}" fill="url(#v)"/></svg>`;
    const uri = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    swCache.set(ck, uri);
    return uri;
  }
  function swatchPNG(t, size = 512) {
    return new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => { try { const c = document.createElement("canvas"); c.width = c.height = size; c.getContext("2d").drawImage(img, 0, 0, size, size); res(c.toDataURL("image/png")); } catch (e) { rej(e); } };
      img.onerror = rej;
      img.src = swatch(t);
    });
  }

  /* ============================================================
     ENGINE (state + one <audio>)
     ============================================================ */
  const audio = document.createElement("audio");
  audio.preload = "metadata";
  const S = { track: null, queue: [], base: [], index: -1, playing: false, time: 0, duration: 0, volume: 0.8, muted: false, shuffle: false, repeat: "off", expanded: false, demo: false };
  let pendingSeek = null, EL = null, booted = false, lastSave = 0;
  const subs = new Set();

  function snapshot() {
    return { track: S.track, queue: S.queue.slice(), index: S.index, playing: S.playing, time: S.time, duration: S.duration, volume: S.volume, muted: S.muted, shuffle: S.shuffle, repeat: S.repeat, expanded: S.expanded, demo: S.demo };
  }
  function emit(kind) {
    EL && EL.update(kind);
    if (!subs.size && kind === "time") return;
    const snap = snapshot();
    subs.forEach((f) => { try { f(snap, kind); } catch (e) { console.error(e); } });
    if (kind !== "time") window.dispatchEvent(new CustomEvent("yarnplayer", { detail: { ...snap, kind } }));
  }
  function save(force) {
    if (S.demo) return;
    const now = Date.now();
    if (!force && now - lastSave < 1500) return;
    lastSave = now;
    if (!S.track) { // nothing loaded here: keep whatever track another page/tab saved, only update prefs
      const prev = store.get(LS, null) || {};
      return store.set(LS, { ...prev, volume: S.volume, muted: S.muted, shuffle: S.shuffle, repeat: S.repeat });
    }
    store.set(LS, { id: S.track?.id || null, url: S.track?.url || null, q: S.queue.map((t) => t.id), i: S.index, time: Math.floor(S.time), volume: S.volume, muted: S.muted, shuffle: S.shuffle, repeat: S.repeat });
  }
  function exitDemo() {
    if (!S.demo) return;
    S.demo = false;
    clearInterval(demoTimer); demoTimer = 0;
  }
  function ensureEl() {
    if (!EL && document.body) document.body.appendChild(document.createElement("yarn-player"));
  }

  function load(t, { autoplay = true, at = 0 } = {}) {
    S.track = t; S.time = at || 0; S.duration = durationOf(t);
    if (S.demo) {
      S.playing = autoplay;
    } else if (t.url) {
      pendingSeek = at > 0 ? at : null;
      audio.src = t.url;
      if (autoplay) playAudio(); else { S.playing = false; }
    }
    mediaMeta();
    save(true);
    emit("track");
    emit("state");
  }
  function playAudio() {
    const p = audio.play();
    if (p && p.catch) p.catch(() => { S.playing = false; emit("state"); });
  }
  function defaultQueue(t) {
    const L = library();
    return t.collectionId ? L.tracks.filter((x) => x.collectionId === t.collectionId) : L.tracks.filter((x) => !x.collectionId);
  }
  function shuffleUpcoming() {
    const head = S.queue.slice(0, S.index + 1), rest = S.queue.slice(S.index + 1);
    for (let i = rest.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [rest[i], rest[j]] = [rest[j], rest[i]]; }
    S.queue = head.concat(rest);
  }

  function play(track, queue) {
    ensureEl(); boot();
    const t = resolve(track);
    if (!t || !t.url) return false;
    exitDemo();
    let q = (queue && queue.length ? queue.map(resolve) : defaultQueue(t)).filter((x) => x && (x.url || x === t));
    if (!q.includes(t)) q.unshift(t);
    q = q.filter((x, i) => q.indexOf(x) === i);
    if (t.external) { const ext = q.filter((x) => x.external); ext.forEach((x, i) => { x.index = i + 1; x.count = ext.length; }); }
    S.queue = q; S.base = q.slice(); S.index = q.indexOf(t);
    if (S.shuffle) shuffleUpcoming();
    load(t, { autoplay: true });
    emit("queue");
    return true;
  }
  function toggle() {
    if (!S.track) { const first = library().tracks.find((x) => x.url); return first ? play(first) : undefined; }
    if (S.demo) { S.playing = !S.playing; if (S.playing) startDemoClock(); emit("state"); return; }
    if (audio.paused) { if (!audio.src && S.track.url) audio.src = S.track.url; playAudio(); } else audio.pause();
  }
  function pause() { if (S.demo) { S.playing = false; emit("state"); } else audio.pause(); }
  function next(auto = false) {
    if (!S.track) return;
    if (auto && S.repeat === "one") { seek(0); if (!S.demo) playAudio(); return; }
    let i = S.index + 1;
    if (i >= S.queue.length) {
      if (S.repeat === "all" && S.queue.length) i = 0;
      else { if (auto) { S.playing = false; if (!S.demo) audio.pause(); seek(0); emit("state"); } return; }
    }
    S.index = i;
    load(S.queue[i], { autoplay: auto || S.playing });
    emit("queue");
  }
  function prev() {
    if (!S.track) return;
    if (S.time > 3) return seek(0);
    let i = S.index - 1;
    if (i < 0) { if (S.repeat === "all") i = S.queue.length - 1; else return seek(0); }
    S.index = i;
    load(S.queue[i], { autoplay: S.playing });
    emit("queue");
  }
  function jump(i) {
    if (i < 0 || i >= S.queue.length) return;
    S.index = i;
    load(S.queue[i], { autoplay: true });
    emit("queue");
  }
  function seek(sec) {
    if (!S.track) return;
    sec = clamp(sec, 0, Math.max(0, (S.duration || 0) - 0.25));
    S.time = sec;
    if (!S.demo) { if (audio.readyState >= 1) { try { audio.currentTime = sec; } catch { pendingSeek = sec; } } else pendingSeek = sec; }
    save(true);
    emit("time");
  }
  function moveQueue(from, to) {
    if (from === to || from <= S.index || to <= S.index || from >= S.queue.length || to >= S.queue.length) return;
    const [x] = S.queue.splice(from, 1);
    S.queue.splice(to, 0, x);
    if (!S.shuffle) S.base = S.queue.slice();
    save(true); emit("queue");
  }
  function enqueue(track, { next: asNext = false } = {}) {
    const t = resolve(track);
    if (!t || !t.url) return false;
    if (!S.track) return play(t, [t]);
    const at = asNext ? S.index + 1 : S.queue.length;
    S.queue.splice(at, 0, t);
    if (!S.shuffle) S.base = S.queue.slice(); else S.base.push(t);
    save(true); emit("queue");
    return true;
  }
  function setShuffle(on) {
    S.shuffle = on;
    if (on) { S.base = S.queue.slice(); shuffleUpcoming(); }
    else if (S.base.length) { S.queue = S.base.filter((t) => S.queue.includes(t)); S.index = S.queue.indexOf(S.track); }
    save(true); emit("state"); emit("queue");
  }
  function cycleRepeat() { S.repeat = S.repeat === "off" ? "all" : S.repeat === "all" ? "one" : "off"; save(true); emit("state"); emit("queue"); }
  function applyVolume() { try { audio.volume = S.volume; } catch { /* iOS */ } audio.muted = S.muted; }
  function setVolume(v) { S.volume = clamp(v, 0, 1); if (S.volume > 0) S.muted = false; applyVolume(); save(true); emit("volume"); }
  function setMuted(m) { S.muted = !!m; applyVolume(); save(true); emit("volume"); }

  audio.addEventListener("play", () => { if (S.demo) return; S.playing = true; emit("state"); });
  audio.addEventListener("pause", () => { if (S.demo) return; S.playing = false; save(true); emit("state"); });
  audio.addEventListener("loadedmetadata", () => {
    if (isFinite(audio.duration) && audio.duration > 0 && S.track) {
      S.duration = audio.duration;
      realDur[S.track.id] = Math.round(audio.duration);
      store.set(LS_DUR, realDur);
    }
    if (pendingSeek != null) { try { audio.currentTime = pendingSeek; } catch { /* ignore */ } pendingSeek = null; }
    emit("time");
  });
  audio.addEventListener("timeupdate", () => { if (S.demo) return; S.time = audio.currentTime; save(); emit("time"); });
  audio.addEventListener("ended", () => next(true));
  audio.addEventListener("error", () => { if (S.demo || !audio.src) return; S.playing = false; emit("state"); });

  /* ---- Media Session ---- */
  let lastPos = 0;
  function mediaMeta() {
    if (!("mediaSession" in navigator) || !S.track || typeof MediaMetadata === "undefined") return;
    const t = S.track;
    const meta = (artwork) => new MediaMetadata({ title: t.name, artist: "blaqat", album: t.collection || "Singles", artwork });
    try { navigator.mediaSession.metadata = meta([]); } catch { return; }
    swatchPNG(t).then((src) => { if (S.track === t) navigator.mediaSession.metadata = meta([{ src, sizes: "512x512", type: "image/png" }]); }).catch(() => {});
  }
  function mediaPosition() {
    if (!("mediaSession" in navigator) || !S.duration || S.demo) return;
    const now = Date.now();
    if (now - lastPos < 1000) return;
    lastPos = now;
    try { navigator.mediaSession.setPositionState({ duration: S.duration, playbackRate: 1, position: clamp(S.time, 0, S.duration) }); } catch { /* ignore */ }
  }
  if ("mediaSession" in navigator) {
    const h = (a, f) => { try { navigator.mediaSession.setActionHandler(a, f); } catch { /* unsupported */ } };
    h("play", () => { if (!S.playing) toggle(); });
    h("pause", () => pause());
    h("previoustrack", () => prev());
    h("nexttrack", () => next());
    h("seekto", (d) => seek(d.seekTime));
    h("seekbackward", (d) => seek(S.time - (d.seekOffset || 10)));
    h("seekforward", (d) => seek(S.time + (d.seekOffset || 10)));
  }

  /* ---- demo ---- */
  let demoTimer = 0, demoLast = 0;
  function startDemoClock() {
    if (demoTimer || !S.demo) return;
    demoLast = performance.now();
    demoTimer = setInterval(() => {
      const now = performance.now();
      if (S.demo && S.playing) {
        S.time += (now - demoLast) / 1000;
        if (S.time >= S.duration) { S.time = 0; next(true); }
        emit("time");
      }
      demoLast = now;
    }, 250);
  }
  function startDemo() {
    S.demo = true;
    const L = library();
    const t = resolve("vgm-class_combat") || L.tracks.find((x) => x.url);
    if (!t) return;
    const coll = t.collectionId ? L.tracks.filter((x) => x.collectionId === t.collectionId && x.url) : [t];
    const extra = ["cast adrift", "marmalade cafe", "gleaming shadows", "farewell my star"].map(resolve).filter(Boolean);
    S.queue = [...coll, ...extra]; S.base = S.queue.slice(); S.index = S.queue.indexOf(t);
    S.track = t; S.time = 72; S.duration = 185; S.playing = true;
    emit("track"); emit("queue"); emit("state");
    if (DEMO_LIVE) startDemoClock();
    else {
      const kick = () => { removeEventListener("pointerdown", kick, true); removeEventListener("keydown", kick, true); startDemoClock(); };
      addEventListener("pointerdown", kick, true);
      addEventListener("keydown", kick, true);
    }
  }

  function boot() {
    if (booted) return;
    booted = true;
    const saved = store.get(LS, null);
    if (saved) {
      S.volume = clamp(+saved.volume || 0.8, 0, 1);
      if (saved.volume === 0) S.volume = 0;
      S.muted = !!saved.muted; S.shuffle = !!saved.shuffle; S.repeat = saved.repeat || "off";
    }
    applyVolume();
    emit("volume");
    if (DEMO) return startDemo();
    const c = params.get("c");
    if (c) {
      const cut = c.lastIndexOf(","), id = cut > 0 ? c.slice(0, cut) : c, sec = cut > 0 ? +c.slice(cut + 1) || 0 : 0;
      const t = resolve(id);
      if (t && t.url) { S.queue = defaultQueue(t).filter((x) => x.url); S.base = S.queue.slice(); S.index = S.queue.indexOf(t); load(t, { autoplay: false, at: sec }); emit("queue"); return; }
    }
    if (saved && saved.id) {
      const t = resolve(saved.id) || (saved.url && resolve(saved.url));
      if (t && t.url) {
        S.queue = (saved.q || []).map(resolve).filter((x) => x && x.url);
        if (!S.queue.includes(t)) S.queue = [t];
        S.base = S.queue.slice(); S.index = S.queue.indexOf(t);
        load(t, { autoplay: false, at: saved.time || 0 });
        emit("queue");
      }
    }
  }

  /* ---- keyboard: space toggles unless typing / on a control; esc collapses ---- */
  const CONTROL = "input,textarea,select,button,a[href],summary,audio,video,[contenteditable],[role=slider],[role=button],[role=textbox],[role=combobox],[role=checkbox],[role=switch],[role=tab],[role=menuitem],[role=option],[role=spinbutton]";
  document.addEventListener("keydown", (e) => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || !S.track) return;
    if (e.key === "Escape" && EL && EL.open) { EL.setOpen(false); return; }
    if (e.key !== " " && e.code !== "Space") return;
    const el = e.composedPath()[0];
    if (el instanceof Element && (el.closest(CONTROL) || el.isContentEditable)) return;
    e.preventDefault();
    toggle();
  });
  addEventListener("pagehide", () => save(true));
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") save(true); });

  /* ============================================================
     STYLES (shadow root; palette mirrors kit/yarn.css so it works standalone)
     ============================================================ */
  const KNIT = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='16' viewBox='0 0 14 16'%3E%3Cg fill='%23000' fill-opacity='.026'%3E%3Cellipse cx='4' cy='8' rx='2.6' ry='6' transform='rotate(-28 4 8)'/%3E%3Cellipse cx='10' cy='8' rx='2.6' ry='6' transform='rotate(28 10 8)'/%3E%3C/g%3E%3Cg fill='none' stroke='%23fff' stroke-opacity='.55' stroke-width='.8'%3E%3Cpath d='M2.6 3.6 Q3.4 7 5.2 11'/%3E%3Cpath d='M8.8 11 Q10.6 7 11.4 3.6'/%3E%3C/g%3E%3C/svg%3E")`;
  const KNIT_NIGHT = KNIT.replace("fill-opacity='.026'", "fill-opacity='.22'").replace("stroke-opacity='.55'", "stroke-opacity='.05'");
  const CSS = `
:host{all:initial;display:block;position:relative;z-index:60;height:0;
  --y-ink:#1f1e1e;--y-ink2:#4a4646;--y-ink3:#6e6868;--y-cotton:#fbf8f3;--y-cotton2:#f3eee6;--y-line:rgba(31,30,30,.2);
  --y-red:#d62f38;--y-red-deep:#b4202b;--y-red-soft:#f7d9d6;
  --y-disp:"Nunito",ui-rounded,system-ui,sans-serif;--y-body:system-ui,-apple-system,"Segoe UI",sans-serif;--y-mono:"JetBrains Mono",ui-monospace,monospace;
  --y-ease:cubic-bezier(.2,.8,.2,1);--y-frame:var(--frame,14px);
  --y-knit:${KNIT};
  --y-twill:repeating-linear-gradient(45deg,rgba(255,255,255,.10) 0 1px,transparent 1px 4px),repeating-linear-gradient(-45deg,rgba(0,0,0,.07) 0 1px,transparent 1px 5px);
  --bar-h:78px;--pw:min(1000px,calc(100vw - var(--y-frame) * 2 - 48px));
  --y-surface:#fff;--y-hover:rgba(243,238,230,.85);--y-hover2:#ebe3d8;--y-rule:rgba(31,30,30,.12);--y-wave:rgba(31,30,30,.19);
  --y-track:rgba(31,30,30,.16);--y-underline:rgba(31,30,30,.3);--y-focus:var(--y-red);--y-focus-on-red:var(--y-ink);
  --y-scrim:rgba(31,30,30,.42);--y-tip-fg:#fff;--y-shadow:rgba(31,30,30,.17);
}
/* night: for /thoughts/ethereal (deep navy cloth, warm off-white thread, red accent, a gold stitch) */
:host([theme="night"]){
  --y-ink:#f3ead8;--y-ink2:#d9cfbd;--y-ink3:#aaa08f;--y-cotton2:rgba(243,234,216,.08);--y-line:rgba(232,187,85,.42);
  --y-red:#e0353f;--y-red-deep:#ff8f92;--y-red-soft:rgba(224,53,63,.2);
  --y-knit:${KNIT_NIGHT};--y-surface:#151a2e;--y-hover:rgba(243,234,216,.08);--y-hover2:rgba(243,234,216,.14);
  --y-rule:rgba(243,234,216,.12);--y-wave:rgba(243,234,216,.22);--y-track:rgba(243,234,216,.2);--y-underline:rgba(243,234,216,.35);
  --y-focus:#f3ead8;--y-focus-on-red:#f3ead8;--y-scrim:rgba(4,6,16,.6);--y-tip-fg:#151a2e;--y-shadow:rgba(0,0,0,.5);
}
*,*::before,*::after{box-sizing:border-box}
.yp{font:400 15px/1.45 var(--y-body);color:var(--y-ink);-webkit-font-smoothing:antialiased;letter-spacing:0}
.yp[data-empty] .bar,.yp[data-empty] .wrap,.yp[data-empty] .scrim{display:none}
button{font:inherit;color:inherit;background:none;border:0;padding:0;margin:0;cursor:pointer;-webkit-tap-highlight-color:transparent}
a{color:inherit}
svg.ic{width:20px;height:20px;display:block;flex:none}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.safe{position:fixed;bottom:0;left:0;width:0;height:env(safe-area-inset-bottom,0px);visibility:hidden;pointer-events:none}
:focus-visible{outline:3px solid var(--y-focus);outline-offset:2px;border-radius:12px}

/* --- swatches (knit art) --- */
.sw{display:block;flex:none;background:#3a3636 center/cover no-repeat;border-radius:10px;box-shadow:inset 0 0 0 1px rgba(0,0,0,.12),0 1px 2px rgba(31,30,30,.18)}
.sw--bar{width:50px;height:50px;border-radius:12px;outline:1.5px dashed rgba(255,255,255,.55);outline-offset:-4px}

/* --- buttons --- */
.ib{position:relative;display:inline-grid;place-items:center;width:40px;height:40px;border-radius:999px;color:var(--y-ink2);transition:transform 100ms var(--y-ease),background-color 160ms,color 160ms}
.ib:hover{background:var(--y-cotton2);color:var(--y-ink)}
.ib:active{transform:scale(.92)}
.tg[aria-pressed="true"]{color:var(--y-red-deep);background:var(--y-red-soft)}
.tg[aria-pressed="true"]::after{content:"";position:absolute;bottom:3px;left:50%;width:4px;height:4px;margin-left:-2px;border-radius:50%;background:currentColor}
svg.ic.i-rep1,svg.ic.i-mute,svg.ic.i-pause{display:none}
.rep-one svg.ic.i-rep{display:none}.rep-one svg.ic.i-rep1{display:block}
.is-muted svg.ic.i-vol{display:none}.is-muted svg.ic.i-mute{display:block}
.play{position:relative;display:grid;place-items:center;width:50px;height:50px;border-radius:999px;color:#fff;flex:none;
  background:var(--y-twill),var(--y-red);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.25),0 2px 0 rgba(150,22,30,.35),0 6px 14px rgba(224,53,63,.26);transition:transform 100ms var(--y-ease)}
.play::after{content:"";position:absolute;inset:5px;border-radius:50%;border:2px dashed rgba(255,255,255,.62);pointer-events:none}
.play:focus-visible{outline:3px solid var(--y-focus-on-red);outline-offset:3px;border-radius:50%}
.play:active{transform:scale(.93)}
.play svg{width:22px;height:22px}
.play .i-play{transform:translateX(1px)}
.is-playing .play svg.ic.i-play{display:none}.is-playing .play svg.ic.i-pause{display:block}

/* --- transport --- */
.tx{display:flex;align-items:center;gap:4px}

/* --- scrubber: stitched waveform + a sewing pin --- */
.scrub{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:10px;min-width:0}
.t{font:600 11.5px/1 var(--y-mono);color:var(--y-ink3);font-variant-numeric:tabular-nums;min-width:4.4ch;letter-spacing:0}
.t-rem{text-align:right}
.wave{position:relative;height:38px;cursor:pointer;touch-action:none;--f:0;--bw:2.6px;-webkit-tap-highlight-color:transparent}
.w{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}
.w path{fill:none;stroke-width:var(--bw);stroke-linecap:round}
.w .pt{stroke:rgba(255,255,255,.34);stroke-dasharray:1.2 2.3;stroke-linecap:butt}
.w-u .pb{stroke:var(--y-wave)}
.w-u .pt{stroke:rgba(255,255,255,.5)}
.w-o{clip-path:inset(-4px calc((1 - var(--f)) * 100%) -4px 0)}
.w-o .pb{stroke:var(--y-red)}
.pin{position:absolute;top:-7px;bottom:-4px;left:0;width:0;transform:translateX(calc(var(--f) * var(--ww,0px)));pointer-events:none}
.pin::before{content:"";position:absolute;left:-1px;top:6px;bottom:0;width:2px;border-radius:1px;background:linear-gradient(90deg,#8d8888,#d9d5cf 60%,#a29d97)}
.pin i{position:absolute;left:-7.5px;top:-1px;width:15px;height:15px;border-radius:50%;
  background:radial-gradient(circle at 34% 30%,#ff9aa0 0,var(--y-red) 42%,var(--y-red-deep) 100%);box-shadow:0 1px 2px rgba(31,30,30,.35);transition:transform 140ms var(--y-ease)}
.wave:hover .pin i,.wave.is-drag .pin i{transform:scale(1.2)}
.wave:focus-visible{outline:none}
.wave:focus-visible .pin i{box-shadow:0 0 0 3px var(--y-surface),0 0 0 5.5px var(--y-focus)}
.tip{position:absolute;bottom:calc(100% + 12px);left:0;transform:translateX(-50%);padding:5px 7px;border-radius:7px;background:var(--y-ink);color:var(--y-tip-fg);font:600 11.5px/1 var(--y-mono);pointer-events:none;white-space:nowrap}
.tip[hidden]{display:none}

/* --- volume --- */
.vol{display:flex;align-items:center;gap:2px}
.mute-l{display:none}
.range{-webkit-appearance:none;appearance:none;width:96px;height:30px;background:transparent;margin:0 4px 0 0;cursor:pointer;--v:80%}
.range::-webkit-slider-runnable-track{height:4px;border-radius:3px;background:linear-gradient(90deg,var(--y-red) 0 var(--v),var(--y-track) var(--v) 100%)}
.range::-moz-range-track{height:4px;border-radius:3px;background:linear-gradient(90deg,var(--y-red) 0 var(--v),var(--y-track) var(--v) 100%)}
.range::-webkit-slider-thumb{-webkit-appearance:none;width:15px;height:15px;margin-top:-5.5px;border-radius:50%;border:0;background:radial-gradient(circle at 34% 30%,#ff9aa0 0,var(--y-red) 42%,var(--y-red-deep) 100%);box-shadow:0 1px 2px rgba(31,30,30,.35)}
.range::-moz-range-thumb{width:15px;height:15px;border-radius:50%;border:0;background:radial-gradient(circle at 34% 30%,#ff9aa0 0,var(--y-red) 42%,var(--y-red-deep) 100%)}
.range:focus-visible{outline:none}
.range:focus-visible::-webkit-slider-thumb{box-shadow:0 0 0 3px var(--y-surface),0 0 0 5.5px var(--y-focus)}
.is-muted .range{--v:0% !important}
.ios .range{display:none}
.ios .vol--big .mute-l{display:inline}
.ios .vol--big [data-act=mute]{width:auto;padding:0 14px 0 10px;gap:8px;display:inline-flex;align-items:center;background:var(--y-cotton2);font:800 13px/1 var(--y-disp)}

/* --- bar (mini) --- */
.bar{position:fixed;z-index:2;display:grid;align-items:center;
  background:var(--y-knit),var(--y-surface);border-radius:22px;outline:2px dashed var(--y-line);outline-offset:-6px;
  box-shadow:0 1px 0 rgba(31,30,30,.05),0 3px 8px rgba(31,30,30,.08),0 14px 34px var(--y-shadow);
  transition:border-radius 200ms var(--y-ease);animation:bar-in 380ms var(--y-ease) both}
@keyframes bar-in{from{opacity:0;translate:0 18px}to{opacity:1;translate:0 0}}
.who{display:flex;align-items:center;gap:12px;min-width:0;height:60px;padding:5px 10px 5px 5px;border-radius:15px;text-align:left;transition:background-color 160ms,transform 100ms var(--y-ease)}
.who:hover{background:var(--y-hover)}
.who:active{transform:scale(.98)}
.who-t{display:grid;min-width:0;gap:4px}
.who-name{font:800 15.5px/1.15 var(--y-disp);letter-spacing:-.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.who-sub{font:500 11.5px/1.2 var(--y-mono);color:var(--y-ink3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.expand svg{transition:none}
.seam{display:none}

.is-wide .bar{left:0;right:0;margin-inline:auto;bottom:calc(var(--y-frame) + 14px);width:var(--pw);height:var(--bar-h);
  padding:0 14px 0 12px;grid-template-columns:minmax(160px,250px) auto minmax(200px,1fr) auto auto;gap:16px}
.is-wide .tx--bar [data-act=shuffle],.is-wide .tx--bar [data-act=repeat]{display:none}
.is-wide .tx--bar{gap:6px}
.is-dock .bar{width:auto;left:calc(var(--y-frame) + 14px);right:calc(var(--y-frame) + 14px);margin:0}
.is-wide.is-open:not(.is-dock) .bar{border-top-left-radius:0;border-top-right-radius:0}
.is-dock.is-open .bar{border-top-right-radius:0}

.is-compact .bar{left:calc(var(--y-frame) + 8px);right:calc(var(--y-frame) + 8px);bottom:var(--yp-mini-bottom,calc(var(--y-frame) + 86px));
  height:64px;padding:0 8px 0 7px;grid-template-columns:minmax(0,1fr) auto;gap:2px;border-radius:20px;touch-action:pan-y}
.is-compact .bar .scrub,.is-compact .bar .vol,.is-compact .bar .expand,.is-compact .tx--bar [data-act=shuffle],.is-compact .tx--bar [data-act=repeat],.is-compact .tx--bar [data-act=prev]{display:none}
.is-compact .sw--bar{width:46px;height:46px;border-radius:11px}
.is-compact .who{height:56px;gap:11px}
.is-compact .play--bar{width:46px;height:46px}
.is-compact .tx--bar .ib{width:44px;height:44px}
.is-compact .seam{display:block;position:absolute;left:22px;right:22px;bottom:3.5px;height:3px;border-radius:2px;pointer-events:none}
.seam i{display:block;height:100%;border-radius:2px;transform-origin:0 50%;transform:scaleX(var(--f,0));
  background:linear-gradient(180deg,rgba(255,255,255,.35),transparent 60%),repeating-linear-gradient(62deg,var(--y-red) 0 3px,var(--y-red-deep) 3px 4.5px,var(--y-red) 4.5px 6px)}

/* --- nav dock: on mobile the mini row is sewn onto the top of the kit's .ybar.
   one material, one stitched outline; progress is a red thread along the seam --- */
.yp.navdock .bar,.yp.navdock .echo{background-color:var(--ypd-color,#7a4e2d);background-image:var(--ypd-img,none);background-size:var(--ypd-size,auto);background-position:0 0;
  color:var(--ypd-fg,#fff7ee);-webkit-backdrop-filter:var(--ypd-blur,none);backdrop-filter:var(--ypd-blur,none)}
.yp.navdock .bar{height:var(--ypd-h1,48px);padding:5px 6px 0 7px;border-radius:22px 22px 0 0;outline:none;animation:none;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.16),0 -6px 18px rgba(31,30,30,.12)}
.yp.navdock .bar::after,.yp.navdock .echo::after{content:"";position:absolute;left:4px;right:4px;top:4px;bottom:0;border:2px dashed var(--ypd-stitch,rgba(255,248,238,.55));border-bottom:0;border-radius:18px 18px 0 0;pointer-events:none}
.yp.navdock .echo{height:var(--ypd-h1,48px);padding:5px 6px 0 7px;border-radius:22px 22px 0 0}
.yp.navdock .who{height:42px;gap:10px;padding:4px 8px 4px 4px;border-radius:12px}
.yp.navdock .who:hover{background:rgba(255,255,255,.08)}
.yp.navdock .sw--bar{width:34px;height:34px;border-radius:9px;outline-offset:-3px}
.yp.navdock .who-name{font-size:14.5px}
.yp.navdock .who-sub{color:inherit;opacity:.8}
.yp.navdock .play--bar,.yp.navdock .echo-b .play{width:38px;height:38px}
.yp.navdock .play--bar::after,.yp.navdock .echo-b .play::after{inset:4px}
.yp.navdock .play--bar svg{width:18px;height:18px}
.yp.navdock .play--bar::before{content:"";position:absolute;inset:-3px}
.yp.navdock .tx--bar .ib,.yp.navdock .echo-b .ib{width:42px;height:44px;color:inherit}
.yp.navdock .tx--bar .ib:hover{background:rgba(255,255,255,.1);color:inherit}
.yp.navdock .seam{left:16px;right:16px;bottom:-1.5px;height:3px;z-index:1;
  background:repeating-linear-gradient(90deg,var(--ypd-stitch,rgba(255,248,238,.55)) 0 5px,transparent 5px 9px)}
.yp.navdock .seam i{box-shadow:0 0 0 .5px rgba(0,0,0,.25)}
.yp.navdock .bar :focus-visible{outline-color:var(--ypd-fg,#fff7ee)}

/* --- expanded panel --- */
.wrap{position:fixed;z-index:3;pointer-events:none;visibility:hidden;filter:drop-shadow(0 -2px 10px rgba(31,30,30,.08)) drop-shadow(0 10px 26px rgba(31,30,30,.16))}
.panel{position:absolute;inset:0;pointer-events:auto;overflow:hidden;background:var(--y-knit),var(--y-surface);color:var(--y-ink);outline:2px dashed var(--y-line);outline-offset:-6px;will-change:clip-path}
.inner{position:absolute;inset:0;min-height:0}
.grab,.echo,.ctl{display:none}
.eb{margin:0;font:800 11.5px/1.2 var(--y-disp);letter-spacing:.12em;text-transform:uppercase;color:var(--y-ink3);min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.eb b{color:var(--y-ink2);font-weight:900}
.ph{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:40px}
.collapse{flex:none;margin-right:-6px}
.hero{display:grid;align-items:end;min-width:0}
.title{margin:0;font:850 30px/1.04 var(--y-disp);letter-spacing:-.028em;outline-offset:4px;overflow-wrap:anywhere}
.title:focus{outline:none}
.title:focus-visible{outline:3px solid var(--y-focus)}
.sub{margin:6px 0 0;font:500 12.5px/1.35 var(--y-mono);color:var(--y-ink3)}
.sub .coll{color:var(--y-ink2);text-decoration:underline;text-decoration-color:var(--y-underline);text-underline-offset:3px;text-decoration-thickness:1.5px}
.sub .coll:hover{color:var(--y-red-deep);text-decoration-color:currentColor}
.facts{list-style:none;margin:12px 0 0;padding:0;display:flex;flex-wrap:wrap;gap:6px}
.facts li{display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 10px 0 8px;border-radius:999px;background:var(--y-cotton2);font:750 12.5px/1 var(--y-disp);color:var(--y-ink2)}
.facts li.d{font:500 11.5px/1 var(--y-mono);padding:0 10px}
.facts svg{width:16px;height:16px}
.dot{width:12px;height:12px;border-radius:50%;background:radial-gradient(circle at 35% 30%,rgba(255,255,255,.45),transparent 55%),var(--c);box-shadow:inset 0 0 0 1px rgba(0,0,0,.15)}
.facts .st-dropped{background:var(--y-cotton2)}
.desc{min-height:0;font-size:14.5px;line-height:1.55;color:var(--y-ink2)}
.desc p{margin:0 0 .65em}
.desc .from{font:800 11.5px/1.2 var(--y-disp);letter-spacing:.1em;text-transform:uppercase;color:var(--y-ink3);margin:0 0 .5em}
.desc a{color:var(--y-red-deep);text-underline-offset:2px}
.desc .md-h{color:var(--y-ink)}
.desc .none{color:var(--y-ink3);font-style:italic}
.acts{display:flex;flex-wrap:wrap;gap:8px}
.lk{display:inline-flex;align-items:center;gap:7px;height:38px;padding:0 14px 0 11px;border-radius:999px;background:var(--y-cotton2);font:800 13px/1 var(--y-disp);color:var(--y-ink);text-decoration:none;white-space:nowrap;transition:background-color 160ms,transform 100ms var(--y-ease)}
.lk:hover{background:var(--y-hover2)}
.lk:active{transform:scale(.96)}
.lk svg{width:17px;height:17px}
.lk .ex{width:13px;height:13px;opacity:.55;margin-left:-2px}
.lk.is-done{background:var(--y-red-soft);color:var(--y-red-deep)}
.queue{min-height:0;display:flex;flex-direction:column}
.qh{display:flex;align-items:center;gap:10px;padding:0 0 8px;min-height:40px}
.qh .qc{margin-right:auto}
.qtools{display:flex;gap:2px;margin-right:-4px}
.qtools .ib{width:36px;height:36px}.qtools svg{width:18px;height:18px}
.is-compact .qtools{display:none}
.qh h3{margin:0;font:850 16px/1.1 var(--y-disp);letter-spacing:-.01em}
.qc{font:500 11.5px/1 var(--y-mono);color:var(--y-ink3)}
.q{list-style:none;margin:0;padding:0;display:grid;gap:2px}
.qr{position:relative;display:grid;grid-template-columns:30px minmax(0,1fr);align-items:center;border-radius:13px;background:transparent}
.qr.is-now{background:var(--y-red-soft)}
.qr.is-lift{z-index:2;background:var(--y-surface);box-shadow:0 8px 20px var(--y-shadow);outline:1.5px dashed var(--y-line);outline-offset:-4px}
.q.is-sorting .qr:not(.is-lift){transition:transform 180ms var(--y-ease)}
.qg{display:grid;place-items:center;width:30px;height:46px;border-radius:9px;color:var(--y-ink3);cursor:grab;touch-action:none}
.qg:hover{color:var(--y-ink2)}
.qg svg{width:16px;height:16px}
.qnow{display:grid;place-items:center;width:30px;height:46px}
.qm{display:grid;grid-template-columns:36px minmax(0,1fr) auto;gap:11px;align-items:center;min-height:50px;padding:5px 10px 5px 2px;text-align:left;border-radius:11px;transition:background-color 140ms,transform 100ms var(--y-ease)}
.qr:not(.is-now) .qm:hover{background:var(--y-cotton2)}
.qm:active{transform:scale(.985)}
.qm .sw{width:36px;height:36px;border-radius:9px}
.qt{display:grid;min-width:0;gap:2px}
.qt b{font:800 14px/1.2 var(--y-disp);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.qt small{font:500 11.5px/1.25 var(--y-mono);color:var(--y-ink3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.is-now .qt small{color:var(--y-red-deep)}
.qd{font:500 11.5px/1 var(--y-mono);color:var(--y-ink3);font-variant-numeric:tabular-nums}
.qe{padding:12px 4px;font:500 12px/1.4 var(--y-mono);color:var(--y-ink3)}
.eq{display:inline-flex;align-items:flex-end;gap:2px;width:15px;height:14px}
.eq i{flex:1;height:100%;border-radius:1.5px;background:var(--y-red);transform-origin:50% 100%;transform:scaleY(.35)}
.is-playing .eq i{animation:eq 820ms ease-in-out infinite alternate}
.is-playing .eq i:nth-child(2){animation-duration:640ms;animation-delay:-320ms}
.is-playing .eq i:nth-child(3){animation-duration:1040ms;animation-delay:-560ms}
@keyframes eq{0%{transform:scaleY(.25)}55%{transform:scaleY(1)}100%{transform:scaleY(.5)}}

/* wide (desktop float): a panel that grows up out of the bar, same width, sewn on with a seam */
.is-wide .wrap{left:0;right:0;margin-inline:auto;width:var(--pw);bottom:calc(var(--y-frame) + 14px + var(--bar-h) - 1px);height:min(470px,calc(100vh - var(--y-frame) * 2 - var(--bar-h) - 96px))}
.is-wide .panel{border-radius:24px 24px 0 0}
.is-wide:not(.is-dock) .inner{display:grid;grid-template-columns:minmax(0,1.12fr) minmax(0,1fr);grid-template-rows:auto auto minmax(0,1fr) auto;
  grid-template-areas:"ph ph" "hero queue" "acts queue" "desc queue";grid-template-rows:auto auto auto minmax(0,1fr);column-gap:34px;padding:16px 22px 18px 28px}
.is-wide:not(.is-dock) .ph{grid-area:ph;margin-bottom:8px}
.is-wide:not(.is-dock) .hero{grid-area:hero;grid-template-columns:148px minmax(0,1fr);gap:22px}
.is-wide .sw--hero{width:148px;height:148px;border-radius:18px;outline:2px dashed rgba(255,255,255,.6);outline-offset:-7px;box-shadow:inset 0 0 0 1px rgba(0,0,0,.14),0 2px 0 rgba(31,30,30,.08),0 8px 18px rgba(31,30,30,.16)}
.is-wide:not(.is-dock) .desc{grid-area:desc;overflow:auto;margin-top:16px;padding:14px 8px 10px 0;border-top:2px dashed var(--y-rule);mask-image:linear-gradient(#000 calc(100% - 16px),transparent)}
.is-wide:not(.is-dock) .acts{grid-area:acts;padding-top:18px}
.is-wide:not(.is-dock) .queue{grid-area:queue;overflow:auto;padding-left:24px;border-left:2px dashed var(--y-rule);margin-top:-2px}

/* dock (desktop, music page): a right column standing on the bar; the page reflows beside it */
.is-dock .wrap{left:auto;right:calc(var(--y-frame) + 14px);width:400px;top:calc(var(--y-frame) + 76px);bottom:calc(var(--y-frame) + 14px + var(--bar-h) - 1px);height:auto;margin:0}
.is-dock .inner{display:flex;flex-direction:column;gap:18px;overflow:auto;padding:14px 20px 22px 24px}
.is-dock .inner>*{flex:none}
.is-dock .desc{padding-top:14px;border-top:2px dashed var(--y-rule)}
.is-dock .hero{grid-template-columns:112px minmax(0,1fr);gap:16px}
.is-dock .sw--hero{width:112px;height:112px;border-radius:16px;outline:2px dashed rgba(255,255,255,.6);outline-offset:-6px}
.is-dock .title{font-size:24px}
.is-dock .ph{order:0}.is-dock .hero{order:1}.is-dock .acts{order:2}.is-dock .queue{order:3}.is-dock .desc{order:4}

/* compact (mobile): a bottom sheet that grows out of the mini bar */
.scrim{position:fixed;inset:0;z-index:1;background:var(--y-scrim);opacity:0;pointer-events:none;display:none}
.is-compact .scrim{display:block}
.is-compact.is-open .scrim{pointer-events:auto}
.is-compact .wrap{left:0;right:0;top:calc(env(safe-area-inset-top,0px) + 10px);bottom:-80px;filter:drop-shadow(0 -4px 18px rgba(31,30,30,.2))}
.is-compact .panel{border-radius:26px 26px 0 0}
.is-compact .echo{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:2px;position:absolute;top:0;height:64px;
  left:calc(var(--y-frame) + 8px);right:calc(var(--y-frame) + 8px);padding:0 8px 0 7px;pointer-events:none}
.echo .who{height:56px;gap:11px}
.echo .sw--bar{width:46px;height:46px;border-radius:11px}
.echo-b{display:flex;align-items:center;gap:4px}
.echo-b .play{width:46px;height:46px}
.echo-b .ib{width:44px;height:44px}
.is-compact .inner{display:flex;flex-direction:column;overflow:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;
  padding:0 20px calc(110px + env(safe-area-inset-bottom,0px))}
.is-compact .inner>*{flex:none}
.is-compact .grab{display:flex;justify-content:center;padding:9px 0 3px;touch-action:none;cursor:grab}
.grab span{width:42px;height:5px;border-radius:3px;background:var(--y-line)}
.is-compact .ph{touch-action:none;padding-bottom:4px;display:grid;grid-template-columns:44px minmax(0,1fr) 44px;gap:4px}
.is-compact .ph .collapse{order:-1;margin:0 0 0 -8px}
.is-compact .eb{text-align:center}
.is-compact .hero{justify-items:center;text-align:center;gap:0;margin-top:6px}
.is-compact .sw--hero{width:min(58vw,236px,34vh);height:min(58vw,236px,34vh);border-radius:22px;outline:2px dashed rgba(255,255,255,.62);outline-offset:-8px;
  box-shadow:inset 0 0 0 1px rgba(0,0,0,.14),0 2px 0 rgba(31,30,30,.08),0 12px 26px rgba(31,30,30,.2);margin-bottom:20px}
.is-compact .title{font-size:27px}
.is-compact .facts{justify-content:center}
.is-compact .ctl{display:grid;gap:14px;margin-top:20px}
.scrub--big{grid-template-columns:1fr 1fr;grid-template-areas:"w w" "a b";row-gap:9px}
.scrub--big .wave{grid-area:w;height:54px;--bw:3px}
.scrub--big .t-el{grid-area:a}.scrub--big .t-rem{grid-area:b}
.tx--big{display:flex;justify-content:space-between;width:100%;max-width:350px;margin:0 auto}
.tx--big .ib{width:50px;height:50px}.tx--big .ib svg{width:24px;height:24px}
.tx--big .play{width:70px;height:70px}.tx--big .play::after{inset:6px}.tx--big .play svg{width:30px;height:30px}
.vol--big{display:flex;gap:8px;justify-content:center}
.vol--big .range{flex:1;width:auto;max-width:260px}
.is-compact .acts{margin-top:20px;justify-content:center}
.is-compact .queue{margin-top:26px;padding-top:18px;border-top:2px dashed var(--y-rule)}
.is-compact .desc{margin-top:22px;padding-top:18px;border-top:2px dashed var(--y-rule)}
.is-compact.is-dragging .inner{overflow:hidden}

/* reduced motion: no springs, no dancing */
.rm .bar{animation:none}
.rm .eq i,.rm.is-playing .eq i{animation:none;transform:scaleY(.7)}
@media (prefers-reduced-motion:reduce){.bar{animation:none}.is-playing .eq i{animation:none;transform:scaleY(.7)}}
@media (prefers-contrast:more){:host{--y-line:rgba(31,30,30,.6);--y-ink3:#3d3939}}
`;

  /* ============================================================
     ELEMENT
     ============================================================ */
  const TX = (v) => `<div class="tx tx--${v}">
      <button class="ib tg" type="button" data-act="shuffle" aria-pressed="false" aria-label="Shuffle">${icon("shuffle")}</button>
      <button class="ib" type="button" data-act="prev" aria-label="Previous track">${icon("prev")}</button>
      <button class="play play--${v}" type="button" data-act="play" aria-label="Play">${icon("play", "i-play")}${icon("pause", "i-pause")}</button>
      <button class="ib" type="button" data-act="next" aria-label="Next track">${icon("next")}</button>
      <button class="ib tg" type="button" data-act="repeat" aria-pressed="false" aria-label="Repeat: off">${icon("repeat", "i-rep")}${icon("repeat1", "i-rep1")}</button>
    </div>`;
  const VOL = (v) => `<div class="vol vol--${v}">
      <button class="ib" type="button" data-act="mute" aria-pressed="false" aria-label="Mute">${icon("vol", "i-vol")}${icon("mute", "i-mute")}<span class="mute-l">Mute</span></button>
      <input class="range" type="range" min="0" max="100" step="1" value="80" aria-label="Volume" aria-valuetext="80%">
    </div>`;
  const WHO = `<span class="sw sw--bar sw--t"></span><span class="who-t"><b class="who-name"></b><span class="who-sub"></span></span>`;
  const TPL = `
  <div class="yp" data-empty role="region" aria-label="Music player">
    <div class="scrim" aria-hidden="true"></div>
    <div class="bar">
      <button class="who" type="button" data-act="expand" aria-expanded="false" aria-controls="yp-panel">${WHO}</button>
      ${TX("bar")}
      <div class="scrub scrub--bar"></div>
      ${VOL("bar")}
      <button class="ib expand" type="button" data-act="expand" aria-expanded="false" aria-controls="yp-panel" aria-label="Show details and queue">${icon("up")}</button>
      <span class="seam" aria-hidden="true"><i></i></span>
    </div>
    <div class="wrap">
      <div class="panel" id="yp-panel" role="group" aria-label="Now playing and queue" inert>
        <div class="echo" aria-hidden="true"><span class="who">${WHO}</span><span class="echo-b"><span class="play">${icon("play", "i-play")}${icon("pause", "i-pause")}</span><span class="ib">${icon("next")}</span></span></div>
        <div class="inner">
          <div class="grab" aria-hidden="true"><span></span></div>
          <header class="ph">
            <p class="eb"></p>
            <button class="ib collapse" type="button" data-act="collapse" aria-expanded="true" aria-controls="yp-panel" aria-label="Collapse player">${icon("down")}</button>
          </header>
          <div class="hero">
            <span class="sw sw--hero sw--t" aria-hidden="true"></span>
            <div class="id">
              <h2 class="title" tabindex="-1"></h2>
              <p class="sub"></p>
              <ul class="facts" role="list"></ul>
            </div>
          </div>
          <div class="ctl">
            <div class="scrub scrub--big"></div>
            ${TX("big")}
            ${VOL("big")}
          </div>
          <div class="acts"></div>
          <section class="queue" aria-labelledby="yp-qh">
            <div class="qh"><h3 id="yp-qh">Up next</h3><span class="qc"></span>
              <span class="qtools"><button class="ib tg" type="button" data-act="shuffle" aria-pressed="false" aria-label="Shuffle">${icon("shuffle")}</button><button class="ib tg" type="button" data-act="repeat" aria-pressed="false" aria-label="Repeat: off">${icon("repeat", "i-rep")}${icon("repeat1", "i-rep1")}</button></span></div>
            <ol class="q"></ol>
          </section>
          <section class="desc" aria-label="About this track"></section>
        </div>
      </div>
    </div>
    <div class="safe"></div>
    <div class="sr" aria-live="polite"></div>
  </div>`;

  class Scrub {
    constructor(el, big) {
      this.el = el; this.big = big; this.drag = false; this.w = 0;
      el.innerHTML =
        `<span class="t t-el">0:00</span>` +
        `<div class="wave" role="slider" tabindex="0" aria-label="Seek" aria-valuemin="0" aria-valuemax="0" aria-valuenow="0" aria-valuetext="0:00 of 0:00">` +
        `<svg class="w w-u" aria-hidden="true"><path class="pb"/><path class="pt"/></svg>` +
        `<svg class="w w-o" aria-hidden="true"><path class="pb"/><path class="pt"/></svg>` +
        `<span class="pin" aria-hidden="true"><i></i></span><span class="tip" hidden></span></div>` +
        `<span class="t t-rem">-0:00</span>`;
      this.wave = el.querySelector(".wave");
      this.tEl = el.querySelector(".t-el"); this.tRem = el.querySelector(".t-rem"); this.tip = el.querySelector(".tip");
      this.paths = [...el.querySelectorAll("path")]; this.svgs = [...el.querySelectorAll("svg")];
      new ResizeObserver(() => this.draw()).observe(this.wave);
      this.bind();
    }
    draw() {
      const w = this.wave.clientWidth, h = this.wave.clientHeight;
      if (!w || !h) return;
      this.w = w;
      const n = Math.max(12, Math.floor(w / (this.big ? 5.4 : 4.6))), step = w / n, mid = h / 2, max = h - 4;
      let d = "";
      waveVals(S.track, n).forEach((v, i) => { const x = (i + 0.5) * step, bh = Math.max(3, v * max); d += `M${x.toFixed(1)} ${(mid - bh / 2).toFixed(1)}V${(mid + bh / 2).toFixed(1)}`; });
      this.svgs.forEach((s) => s.setAttribute("viewBox", `0 0 ${w} ${h}`));
      this.paths.forEach((p) => p.setAttribute("d", d));
      this.wave.style.setProperty("--ww", w + "px");
    }
    paint(time, dur) {
      if (this.drag) return;
      this.show(time, dur);
    }
    show(time, dur) {
      this.wave.style.setProperty("--f", (dur ? clamp(time / dur, 0, 1) : 0).toFixed(4));
      this.tEl.textContent = fmt(time);
      this.tRem.textContent = "-" + fmt(Math.max(0, dur - time));
    }
    aria(time, dur) {
      const w = this.wave;
      w.setAttribute("aria-valuemax", String(Math.round(dur)));
      w.setAttribute("aria-valuenow", String(Math.floor(time)));
      w.setAttribute("aria-valuetext", `${fmt(time)} of ${fmt(dur)}`);
    }
    at(x) { const r = this.wave.getBoundingClientRect(); return clamp((x - r.left) / (r.width || 1), 0, 1) * (S.duration || 0); }
    bind() {
      const w = this.wave;
      w.addEventListener("pointerdown", (e) => {
        if (!S.track || e.button > 0) return;
        e.preventDefault(); e.stopPropagation();
        w.setPointerCapture(e.pointerId);
        this.drag = true; w.classList.add("is-drag");
        this.dt = this.at(e.clientX); this.show(this.dt, S.duration);
        w.focus({ preventScroll: true });
      });
      w.addEventListener("pointermove", (e) => {
        if (this.drag) { this.dt = this.at(e.clientX); this.show(this.dt, S.duration); }
        if (e.pointerType === "mouse" && S.track) {
          const r = w.getBoundingClientRect();
          this.tip.hidden = false;
          this.tip.style.left = clamp(e.clientX - r.left, 0, r.width) + "px";
          this.tip.textContent = fmt(this.at(e.clientX));
        }
      });
      const end = () => { if (!this.drag) return; this.drag = false; w.classList.remove("is-drag"); seek(this.dt); };
      w.addEventListener("pointerup", end);
      w.addEventListener("pointercancel", end);
      w.addEventListener("pointerleave", () => { this.tip.hidden = true; });
      w.addEventListener("keydown", (e) => {
        const d = S.duration || 0;
        const map = { ArrowRight: 5, ArrowUp: 5, ArrowLeft: -5, ArrowDown: -5, PageUp: 30, PageDown: -30 };
        let to = null;
        if (e.key in map) to = S.time + map[e.key];
        else if (e.key === "Home") to = 0;
        else if (e.key === "End") to = d - 1;
        if (to == null) return;
        e.preventDefault(); seek(to);
      });
    }
  }

  class YarnPlayerEl extends HTMLElement {
    static get observedAttributes() { return ["theme", "desktop"]; }
    attributeChangedCallback(name) { if (this.$ && name === "desktop") this.setMode(); }
    connectedCallback() {
      if (document.body && this.parentNode !== document.body) { queueMicrotask(() => document.body.appendChild(this)); return; }
      if (EL && EL !== this) { this.remove(); return; }
      if (this.$) { this.layoutVars(); return; }
      EL = this;
      const sr = this.attachShadow({ mode: "open" });
      sr.innerHTML = `<style>${CSS}</style>${TPL}`;
      const q = (s) => sr.querySelector(s), qa = (s) => [...sr.querySelectorAll(s)];
      this.$ = {
        root: q(".yp"), bar: q(".bar"), wrap: q(".wrap"), panel: q(".panel"), inner: q(".inner"), echo: q(".echo"), scrim: q(".scrim"),
        grab: q(".grab"), ph: q(".ph"), eb: q(".eb"), title: q(".title"), sub: q(".sub"), facts: q(".facts"), acts: q(".acts"), desc: q(".desc"),
        q: q(".q"), qc: q(".qc"), live: q("[aria-live]"), safe: q(".safe"), seam: q(".seam"),
        expanders: qa("[aria-controls=yp-panel]"), whoBtn: q(".bar .who"), expandBtn: q(".bar .expand"), collapseBtn: q(".collapse"),
        chev: q(".bar .expand svg"), ranges: qa(".range"),
      };
      sr.appendChild(audio);
      this.p = 0; this.open = false;
      this.scrubs = [new Scrub(q(".scrub--bar"), false), new Scrub(q(".scrub--big"), true)];
      if (IOS) this.$.root.classList.add("ios");
      if (reduced()) this.$.root.classList.add("rm");
      this.bind(sr);
      this.setMode();
      compactMQ.addEventListener("change", () => this.setMode());
      addEventListener("resize", () => { this.layoutVars(); if (this.open) { this.measure(); this.applyP(1); } });
      ensureFonts();
      boot();
      this.update("all");
      if (FORCE === "expanded" && S.track) this.setOpen(true, { instant: true, focus: false });
      else if (S.track && FORCE && !isNaN(+FORCE)) requestAnimationFrame(() => { // ?player=0.5 freezes the morph mid-way (review only)
        this.measure(); this.$.wrap.style.visibility = "visible"; this.$.panel.inert = false; this.applyP(clamp(+FORCE, 0, 1));
      });
      // nav may render after us; fonts change the bar's metrics
      requestAnimationFrame(() => this.layoutVars());
      document.fonts?.ready?.then(() => this.layoutVars());
    }

    get mode() { return this._mode; }
    setMode() {
      const dock = (params.get("pmode") || this.getAttribute("desktop")) === "dock";
      const m = compactMQ.matches ? "compact" : dock ? "dock" : "float";
      this._mode = m;
      const r = this.$.root;
      r.classList.toggle("is-compact", m === "compact");
      r.classList.toggle("is-wide", m !== "compact");
      r.classList.toggle("is-dock", m === "dock");
      const { panel, inner, echo, scrim } = this.$;
      panel.style.transform = panel.style.clipPath = inner.style.transform = inner.style.opacity = echo.style.opacity = scrim.style.opacity = "";
      this.layoutVars();
      this.measure();
      this.applyP(this.open ? 1 : 0);
      document.documentElement.classList.toggle("yp-docked", this.open && m === "dock");
      this.setModal(this.open && m === "compact");
    }

    /* ---------- rendering ---------- */
    update(kind) {
      if (!this.$) return;
      const t = S.track;
      const wasEmpty = this.$.root.hasAttribute("data-empty");
      this.$.root.toggleAttribute("data-empty", !t);
      if (kind === "time") return this.paintTime();
      if (!t) return;
      if (kind === "all" || kind === "track") this.renderTrack();
      if (kind === "all" || kind === "track" || kind === "queue") this.renderQueue();
      if (kind === "all" || kind === "state" || kind === "track") this.renderState();
      if (kind === "all" || kind === "volume") this.renderVolume();
      this.paintTime(true);
      if (wasEmpty) { this.layoutVars(); requestAnimationFrame(() => { this.layoutVars(); this.measure(); this.applyP(this.open ? 1 : 0); }); }
    }
    renderTrack() {
      const t = S.track, $ = this.$, sr = this.shadowRoot;
      const sw = `url("${swatch(t)}")`;
      sr.querySelectorAll(".sw--t").forEach((el) => { el.style.backgroundImage = sw; });
      const where = t.collection ? `${t.index} of ${t.count} · ${t.collection}` : t.external ? (t.artist ? [].concat(t.artist).join(", ") : "From this page") : `Single · ${INST[t.instrument] || t.instrument}`;
      sr.querySelectorAll(".who-name").forEach((el) => { el.textContent = t.name; });
      sr.querySelectorAll(".who-sub").forEach((el) => { el.textContent = where; });
      $.whoBtn.setAttribute("aria-label", `${t.name}, ${where}. ${this.open ? "Hide" : "Show"} player details`);
      $.eb.textContent = "Now playing";
      $.title.textContent = t.name;
      const withA = t.artist ? ` · ${t.external ? "by" : "with"} ${[].concat(t.artist).join(", ")}` : "";
      $.sub.innerHTML = t.collection && !t.collectionId
        ? `${esc(t.collection)} · ${t.index} of ${t.count}${esc(withA)}`
        : t.collection
        ? `<a class="coll" href="../music/index.html?open=${encodeURIComponent(t.collectionId)}" data-coll="${esc(t.collectionId)}">${esc(t.collection)}</a> · Track ${t.index} of ${t.count}${esc(withA)}`
        : `Single${esc(withA)}`;
      const [sIcon, sLabel] = STATUS[t.status] || ["complete", t.status];
      $.facts.innerHTML =
        (YARN[t.instrument] && t.instrument !== "other" ? `<li><span class="dot" style="--c:${YARN[t.instrument].base}"></span>${esc(INST[t.instrument])}</li>` : "") +
        (t.external ? "" : `<li class="st-${esc(t.status)}">${icon(sIcon)}${esc(sLabel)}</li>`) +
        (dates(t) ? `<li class="d">${esc(dates(t))}</li>` : "");
      const coll = t.collectionId ? library().collections.get(t.collectionId) : null;
      let d = "";
      if (t.description) d = md(t.description);
      if (coll?.description) d += `<p class="from">${t.description ? "About the collection" : "Collection notes"}</p>` + md(coll.description);
      $.desc.innerHTML = d || `<p class="none">No liner notes for this one.</p>`;
      $.desc.scrollTop = 0;
      const links = Object.entries(t.links || {}).filter(([k]) => LINKS[k])
        .map(([k, u]) => `<a class="lk" href="${esc(u)}" target="_blank" rel="noopener">${icon(LINKS[k][0])}${LINKS[k][1]}${icon("ext", "ex")}</a>`).join("");
      $.acts.innerHTML = links + `<button class="lk share" type="button" data-act="share">${icon("link", "i-link")}<span class="share-l">Copy link at ${fmt(S.time)}</span></button>`;
      this.shareL = $.acts.querySelector(".share-l");
      this.scrubs.forEach((s) => s.draw());
    }
    renderState() {
      const r = this.$.root, sr = this.shadowRoot;
      r.classList.toggle("is-playing", S.playing);
      sr.querySelectorAll("[data-act=play]").forEach((b) => b.setAttribute("aria-label", S.playing ? "Pause" : "Play"));
      sr.querySelectorAll("[data-act=shuffle]").forEach((b) => b.setAttribute("aria-pressed", String(S.shuffle)));
      sr.querySelectorAll("[data-act=repeat]").forEach((b) => {
        b.setAttribute("aria-pressed", String(S.repeat !== "off"));
        b.setAttribute("aria-label", `Repeat: ${S.repeat === "off" ? "off" : S.repeat === "all" ? "all" : "this track"}`);
        b.classList.toggle("rep-one", S.repeat === "one");
      });
      if (S.playing) this.loop();
    }
    renderVolume() {
      const sr = this.shadowRoot, pct = Math.round(S.volume * 100);
      this.$.root.classList.toggle("is-muted", S.muted || S.volume === 0);
      this.$.ranges.forEach((r) => { if (document.activeElement !== this || sr.activeElement !== r) r.value = String(pct); r.style.setProperty("--v", pct + "%"); r.setAttribute("aria-valuetext", S.muted ? `Muted (${pct}%)` : `${pct}%`); });
      sr.querySelectorAll("[data-act=mute]").forEach((b) => {
        b.setAttribute("aria-pressed", String(S.muted));
        b.setAttribute("aria-label", S.muted ? "Unmute" : "Mute");
        const l = b.querySelector(".mute-l"); if (l) l.textContent = S.muted ? "Unmute" : "Mute";
      });
    }
    renderQueue() {
      const $ = this.$, up = S.queue.slice(S.index + 1), t = S.track;
      const row = (x, i) => {
        const sub = x.collection ? `${x.collection} · ${x.index}/${x.count}` : x.external ? (x.artist ? [].concat(x.artist).join(", ") : "") : `Single · ${INST[x.instrument] || x.instrument}`;
        return `<li class="qr" data-i="${i}"><button class="qg" type="button" data-grip="${i}" aria-label="Reorder ${esc(x.name)}, position ${i - S.index}. Arrow keys move it.">${icon("grip")}</button>` +
          `<button class="qm" type="button" data-act="jump" data-i="${i}" aria-label="Play ${esc(x.name)} now"><span class="sw" data-sw="${esc(x.id)}"></span>` +
          `<span class="qt"><b>${esc(x.name)}</b><small>${esc(sub)}</small></span><span class="qd">${fmt(durationOf(x))}</span></button></li>`;
      };
      let html = `<li class="qr is-now"><span class="qnow"><span class="eq" aria-hidden="true"><i></i><i></i><i></i></span></span>` +
        `<div class="qm"><span class="sw" data-sw="${esc(t.id)}"></span><span class="qt"><b>${esc(t.name)}</b><small>${S.playing ? "Playing now" : "Paused"}</small></span><span class="qd">${fmt(S.duration)}</span></div></li>`;
      html += up.map((x, k) => row(x, S.index + 1 + k)).join("");
      if (!up.length) html += `<li class="qe">${S.repeat === "all" && S.queue.length > 1 ? "Repeat is on: the queue starts over from the top." : "That's the end of the queue."}</li>`;
      else if (S.repeat === "all") html += `<li class="qe">Then the queue repeats from the top.</li>`;
      $.q.innerHTML = html;
      $.q.querySelectorAll("[data-sw]").forEach((el) => { const x = resolve(el.dataset.sw); if (x) el.style.backgroundImage = `url("${swatch(x)}")`; });
      const total = up.reduce((a, x) => a + durationOf(x), 0);
      $.qc.textContent = up.length ? `${up.length} track${up.length === 1 ? "" : "s"} · ${fmt(total)}${S.shuffle ? " · shuffled" : ""}` : "";
    }
    paintTime(force) {
      if (!S.track) return;
      const time = S.time, dur = S.duration || durationOf(S.track);
      this.scrubs.forEach((s) => s.paint(time, dur));
      this.$.seam.style.setProperty("--f", dur ? clamp(time / dur, 0, 1).toFixed(4) : "0");
      const sec = Math.floor(time);
      if (force || sec !== this.lastSec) {
        this.lastSec = sec;
        this.scrubs.forEach((s) => s.aria(time, dur));
        if (this.shareL && !this.sharing) this.shareL.textContent = `Copy link at ${fmt(time)}`;
        mediaPosition();
      }
    }
    loop() {
      if (this.raf) return;
      const tick = () => {
        if (!S.playing || (S.demo && !demoTimer)) { this.raf = 0; return; }
        if (!S.demo && !audio.paused) S.time = audio.currentTime;
        this.paintTime();
        this.raf = requestAnimationFrame(tick);
      };
      this.raf = requestAnimationFrame(tick);
    }
    announce(msg) { this.$.live.textContent = ""; setTimeout(() => { this.$.live.textContent = msg; }, 30); }

    /* ---------- layout vars for the host page ---------- */
    layoutVars() {
      if (!this.$) return;
      const de = document.documentElement, ih = innerHeight;
      const safe = this.$.safe.offsetHeight || 0;
      const frame = parseFloat(getComputedStyle(de).getPropertyValue("--frame")) || 0;
      const nav = document.querySelector(".ybar");
      const navShown = !!nav && getComputedStyle(nav).display !== "none" && nav.getBoundingClientRect().height > 0;
      this.dockNav(this._mode === "compact" && navShown && !!S.track ? nav : null);
      let navTop = ih;
      if (navShown) navTop = nav.getBoundingClientRect().top;
      let ui;
      if (this._mode === "compact") {
        if (this.docked) { // the mini row sits flush on the nav: one dock
          this.style.setProperty("--yp-mini-bottom", (ih - navTop) + "px");
          ui = ih - navTop + ROW_H + 2;
        } else {
          const miniBottom = navTop < ih ? ih - navTop + 8 : frame + 10 + safe;
          this.style.setProperty("--yp-mini-bottom", miniBottom + "px");
          ui = S.track ? miniBottom + 64 + 12 : navTop < ih ? ih - navTop + 12 : 0;
        }
      } else {
        ui = S.track ? frame + 14 + (this.$.bar.offsetHeight || 78) + 18 : 0;
      }
      de.style.setProperty("--bottom-ui", Math.max(0, Math.round(ui - safe)) + "px");
    }
    dockNav(nav) {
      const de = document.documentElement, root = this.$.root;
      if (!nav) {
        if (this.docked) { de.classList.remove("yp-navdock", "yp-navdock--cont"); root.classList.remove("navdock"); this.docked = null; }
        return;
      }
      if (!document.getElementById("yp-navdock-css")) {
        const st = document.createElement("style"); st.id = "yp-navdock-css"; st.textContent = NAV_CSS; document.head.appendChild(st);
      }
      const mat = ([...nav.classList].find((c) => c.startsWith("m-")) || "").slice(2);
      const key = mat + "|" + nav.className;
      if (this.docked !== key) {
        de.classList.remove("yp-navdock", "yp-navdock--cont");
        const H = NAV_H + ROW_H, m = NAVMAT[mat];
        const set = (k, v) => de.style.setProperty(k, v);
        set("--ypd-h1", ROW_H + "px"); set("--ypd-navh", NAV_H + "px");
        if (m) {
          set("--ypd-img", [...m.tex, m.grad].join(","));
          set("--ypd-size", [...m.ts, `100% ${H}px`].join(","));
          set("--ypd-color", m.color); set("--ypd-fg", m.fg); set("--ypd-stitch", m.stitch); set("--ypd-blur", "none");
        } else { // a page-specific material (e.g. the night velvet): mirror the nav's own cloth
          const cs = getComputedStyle(nav);
          set("--ypd-img", cs.backgroundImage); set("--ypd-size", cs.backgroundSize); set("--ypd-color", cs.backgroundColor);
          set("--ypd-fg", cs.color); set("--ypd-stitch", cs.outlineColor); set("--ypd-blur", cs.backdropFilter && cs.backdropFilter !== "none" ? cs.backdropFilter : "none");
        }
        de.classList.add("yp-navdock");
        if (m) de.classList.add("yp-navdock--cont");
        root.classList.add("navdock");
        this.docked = key;
      }
    }

    /* ---------- open / close ---------- */
    measure() {
      const wr = this.$.wrap.getBoundingClientRect();
      if (this._mode === "compact") {
        const br = this.$.bar.getBoundingClientRect();
        this.geo = { top: wr.top, H: wr.height, T: Math.max(1, br.top - wr.top), miniBottom: br.bottom, l: br.left - wr.left, r: wr.right - br.right, rt: this.docked ? 22 : 20, rb: this.docked ? 0 : 20 };
      } else this.geo = { H: wr.height || 1 };
    }
    applyP(p) {
      this.p = p;
      const { panel, inner, echo, scrim, chev } = this.$;
      const c = clamp(p, 0, 1);
      if (this._mode === "compact") {
        const g = this.geo; if (!g || !g.H) return;
        const y = (1 - p) * g.T;
        const visBottom = lerp(g.miniBottom, g.top + g.H, c);
        const b = Math.max(0, g.H - (visBottom - (g.top + y)));
        const l = lerp(g.l, 0, c), r = lerp(g.r, 0, c), rt = lerp(g.rt, 26, c), rb = lerp(g.rb, 0, c);
        panel.style.transform = `translate3d(0,${y.toFixed(2)}px,0)`;
        panel.style.clipPath = `inset(0px ${r.toFixed(2)}px ${b.toFixed(2)}px ${l.toFixed(2)}px round ${rt.toFixed(1)}px ${rt.toFixed(1)}px ${rb.toFixed(1)}px ${rb.toFixed(1)}px)`;
        echo.style.opacity = String(1 - smooth(c / 0.26));
        inner.style.opacity = String(smooth((c - 0.05) / 0.3));
        scrim.style.opacity = String(c);
      } else {
        const H = this.geo?.H || 1;
        panel.style.clipPath = `inset(${((1 - c) * H).toFixed(2)}px 0px 0px 0px round 24px 24px 0px 0px)`;
        inner.style.opacity = String(smooth((c - 0.12) / 0.55));
        inner.style.transform = `translate3d(0,${((1 - c) * 18).toFixed(2)}px,0)`;
      }
      chev.style.transform = `rotate(${(180 * c).toFixed(1)}deg)`;
    }
    toggleOpen() { this.setOpen(!this.open); }
    setOpen(open, { velocity = 0, bounce = false, instant = false, focus = true } = {}) {
      if (!S.track) return;
      const changed = open !== this.open, $ = this.$;
      this.open = open; S.expanded = open;
      $.root.classList.toggle("is-open", open);
      $.expanders.forEach((b) => { if (b !== $.collapseBtn) b.setAttribute("aria-expanded", String(open)); });
      $.expandBtn.setAttribute("aria-label", open ? "Hide details and queue" : "Show details and queue");
      if (S.track) $.whoBtn.setAttribute("aria-label", `${S.track.name}. ${open ? "Hide" : "Show"} player details`);
      document.documentElement.classList.toggle("yp-docked", open && this._mode === "dock");
      this.setModal(open && this._mode === "compact");
      this.anim?.stop();
      clearTimeout(this.rmT);
      $.wrap.style.opacity = ""; $.wrap.style.transition = "";
      if (open) { $.wrap.style.visibility = "visible"; $.panel.inert = false; }
      if (!this.dragging) this.measure();
      const done = () => { if (!this.open) { $.wrap.style.visibility = "hidden"; $.panel.inert = true; } };
      if (instant) { this.applyP(open ? 1 : 0); done(); }
      else if (reduced()) { // cross-fade, no spring
        const w = $.wrap;
        if (open) { this.applyP(1); w.style.opacity = "0"; void w.offsetWidth; w.style.transition = "opacity 180ms ease"; w.style.opacity = "1"; }
        else { w.style.transition = "opacity 180ms ease"; w.style.opacity = "0"; this.rmT = setTimeout(() => { this.applyP(0); w.style.opacity = ""; w.style.transition = ""; done(); }, 190); }
      } else {
        this.anim = spring(this.p, open ? 1 : 0, velocity, { damping: bounce ? 0.8 : 1, response: this._mode === "compact" ? 0.34 : 0.32 }, (p) => this.applyP(p), done);
      }
      if (changed && focus) {
        const sr = this.shadowRoot;
        if (open) { this.returnTo = sr.activeElement && sr.activeElement !== $.title ? sr.activeElement : $.expandBtn; requestAnimationFrame(() => $.title.focus({ preventScroll: true })); }
        else if ($.panel.contains(sr.activeElement) || !sr.activeElement) {
          const back = this._mode === "compact" ? $.whoBtn : this.returnTo && this.returnTo.isConnected && !$.panel.contains(this.returnTo) ? this.returnTo : $.expandBtn;
          back.focus({ preventScroll: true });
        }
      }
      if (changed) emit("expand");
    }

    /* mobile sheet is modal while open: dialog semantics, page behind inert, scroll locked */
    setModal(on) {
      if (on === !!this.modalOn) return;
      this.modalOn = on;
      const { panel, bar } = this.$, de = document.documentElement, body = document.body;
      if (on) {
        panel.setAttribute("role", "dialog"); panel.setAttribute("aria-modal", "true"); panel.setAttribute("aria-label", "Now playing");
        this.inerted = [...body.children].filter((el) => el !== this && !el.inert && !/^(SCRIPT|STYLE|LINK)$/.test(el.tagName));
        this.inerted.forEach((el) => { el.inert = true; });
        bar.inert = true;
        this.lock = { h: de.style.overflow, b: body.style.overflow };
        de.style.overflow = "hidden"; body.style.overflow = "hidden";
      } else {
        panel.setAttribute("role", "group"); panel.removeAttribute("aria-modal"); panel.setAttribute("aria-label", "Now playing and queue");
        (this.inerted || []).forEach((el) => { el.inert = false; });
        this.inerted = null;
        bar.inert = false;
        if (this.lock) { de.style.overflow = this.lock.h; body.style.overflow = this.lock.b; this.lock = null; }
      }
    }

    /* ---------- sheet drag (compact) ---------- */
    dragStart(y0, t) {
      this.anim?.stop();
      this.measure();
      this.dragging = true;
      this.$.root.classList.add("is-dragging");
      this.$.wrap.style.visibility = "visible";
      this.$.panel.inert = false;
      this.d = { y0, p0: this.p, hist: [[t, y0]] };
    }
    dragMove(y, t) {
      const d = this.d, g = this.geo; if (!d) return;
      let p = d.p0 - (y - d.y0) / g.T;
      if (p > 1) p = 1 + rubber((p - 1) * g.T, g.H) / g.T;
      else if (p < 0) p = -rubber(-p * g.T, g.T * 0.5) / g.T;
      this.applyP(p);
      d.hist.push([t, y]);
      while (d.hist.length > 2 && t - d.hist[0][0] > 90) d.hist.shift();
    }
    dragEnd() {
      const d = this.d; if (!d) return;
      this.d = null; this.dragging = false;
      this.$.root.classList.remove("is-dragging");
      const h = d.hist, [t0, y0] = h[0], [t1, y1] = h[h.length - 1];
      const v = t1 > t0 ? ((y1 - y0) / (t1 - t0)) * 1000 : 0; // px/s, + = down
      const T = this.geo.T, yNow = (1 - this.p) * T;
      const open = yNow + project(v) < T / 2; // project momentum, then pick the nearer snap
      this.setOpen(open, { velocity: -v / T, bounce: Math.abs(v) > 600 });
    }

    /* ---------- events ---------- */
    bind(sr) {
      const $ = this.$;
      sr.addEventListener("click", (e) => {
        if (this.swallow) { e.preventDefault(); e.stopPropagation(); return; }
        const b = e.target.closest("[data-act]");
        if (!b) return;
        const a = b.dataset.act;
        if (a === "play") {
          const was = S.playing;
          toggle();
          if (!was && !reduced()) window.Notes?.burst?.(b, "music");
        } else if (a === "prev") prev();
        else if (a === "next") next();
        else if (a === "shuffle") { setShuffle(!S.shuffle); this.announce(S.shuffle ? "Shuffle on" : "Shuffle off"); }
        else if (a === "repeat") { cycleRepeat(); this.announce(`Repeat ${S.repeat === "one" ? "this track" : S.repeat}`); }
        else if (a === "mute") setMuted(!S.muted);
        else if (a === "expand") this.toggleOpen();
        else if (a === "collapse") this.setOpen(false);
        else if (a === "jump") jump(+b.dataset.i);
        else if (a === "share") this.share(b);
      });
      $.scrim.addEventListener("click", () => this.setOpen(false));
      $.sub.addEventListener("click", (e) => {
        const a = e.target.closest("a[data-coll]");
        if (!a) return;
        const ev = new CustomEvent("yarnplayer:collection", { detail: { id: a.dataset.coll }, cancelable: true });
        if (!window.dispatchEvent(ev)) { e.preventDefault(); if (this._mode === "compact") this.setOpen(false, { focus: false }); }
      });
      $.ranges.forEach((r) => r.addEventListener("input", () => setVolume(+r.value / 100)));

      /* pointer drag on the mini bar (up to open) and the sheet's grabber/header (down to close) */
      const down = (e) => {
        if (this._mode !== "compact" || e.button > 0 || e.target.closest(".wave,input,.qg")) return;
        if (e.pointerType === "touch" && e.currentTarget === $.bar) return; // touch on the row: see touch handlers below
        this.g = { id: e.pointerId, x: e.clientX, y: e.clientY, el: e.currentTarget, claimed: false };
      };
      const move = (e) => {
        const g = this.g; if (!g || e.pointerId !== g.id) return;
        const dx = e.clientX - g.x, dy = e.clientY - g.y;
        if (!g.claimed) {
          if (Math.abs(dx) > 14 && Math.abs(dx) > Math.abs(dy)) { this.g = null; return; }
          if (Math.abs(dy) < 8) return; // hysteresis, then track 1:1 from the grab point
          g.claimed = true;
          try { g.el.setPointerCapture(e.pointerId); } catch { /* ignore */ }
          this.dragStart(g.y, e.timeStamp);
        }
        e.preventDefault();
        this.dragMove(e.clientY, e.timeStamp);
      };
      const up = (e) => {
        const g = this.g; if (!g || e.pointerId !== g.id) return;
        this.g = null;
        if (g.claimed) { this.swallow = true; setTimeout(() => { this.swallow = false; }, 0); this.dragEnd(); }
      };
      for (const el of [$.bar, $.grab, $.ph]) {
        el.addEventListener("pointerdown", down);
        el.addEventListener("pointermove", move);
        el.addEventListener("pointerup", up);
        el.addEventListener("pointercancel", up);
      }
      /* touch on the mini row: touch-action is pan-y, so we claim only an upward swipe and let scrolls through */
      $.bar.addEventListener("touchstart", (e) => {
        if (this._mode !== "compact" || this.open || e.touches.length > 1) { this.bg = null; return; }
        const t = e.touches[0];
        this.bg = { x: t.clientX, y: t.clientY, claimed: false };
      }, { passive: true });
      $.bar.addEventListener("touchmove", (e) => {
        const g = this.bg; if (!g) return;
        const t = e.touches[0], dx = t.clientX - g.x, dy = t.clientY - g.y;
        if (!g.claimed) {
          if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
          if (dy > -6 || Math.abs(dy) < Math.abs(dx)) { this.bg = null; return; } // down or sideways: the page's
          g.claimed = true;
          this.dragStart(g.y, e.timeStamp);
        }
        if (e.cancelable) e.preventDefault();
        this.dragMove(t.clientY, e.timeStamp);
      }, { passive: false });
      const bend = () => { const g = this.bg; this.bg = null; if (g && g.claimed) { this.swallow = true; setTimeout(() => { this.swallow = false; }, 0); this.dragEnd(); } };
      $.bar.addEventListener("touchend", bend);
      $.bar.addEventListener("touchcancel", bend);

      /* drag down from the top of the sheet's scrolled content (touch: needs preventDefault) */
      const inner = $.inner;
      inner.addEventListener("touchstart", (e) => {
        if (this._mode !== "compact" || !this.open || e.touches.length > 1 || e.target.closest(".wave,input,.qg,.ph,.grab")) { this.tg = null; return; }
        const t = e.touches[0];
        this.tg = inner.scrollTop <= 0 ? { x: t.clientX, y: t.clientY, claimed: false } : null;
      }, { passive: true });
      inner.addEventListener("touchmove", (e) => {
        const g = this.tg; if (!g) return;
        const t = e.touches[0], dx = t.clientX - g.x, dy = t.clientY - g.y;
        if (!g.claimed) {
          if (dy < -4 || Math.abs(dx) > Math.abs(dy) + 4) { this.tg = null; return; }
          if (dy < 8 || inner.scrollTop > 0) return;
          g.claimed = true;
          this.dragStart(g.y, e.timeStamp);
        }
        e.preventDefault();
        this.dragMove(t.clientY, e.timeStamp);
      }, { passive: false });
      const tend = () => { const g = this.tg; this.tg = null; if (g && g.claimed) this.dragEnd(); };
      inner.addEventListener("touchend", tend);
      inner.addEventListener("touchcancel", tend);

      this.bindQueue();
    }
    bindQueue() {
      const list = this.$.q;
      list.addEventListener("keydown", (e) => {
        const g = e.target.closest("[data-grip]");
        if (!g || (e.key !== "ArrowUp" && e.key !== "ArrowDown")) return;
        e.preventDefault();
        const i = +g.dataset.grip, j = i + (e.key === "ArrowUp" ? -1 : 1);
        if (j <= S.index || j >= S.queue.length) return;
        moveQueue(i, j);
        this.announce(`${S.queue[j].name} moved to position ${j - S.index} of ${S.queue.length - S.index - 1}`);
        list.querySelector(`[data-grip="${j}"]`)?.focus();
      });
      list.addEventListener("pointerdown", (e) => {
        const g = e.target.closest("[data-grip]");
        if (!g || e.button > 0) return;
        e.preventDefault();
        const row = g.closest(".qr"), rows = [...list.querySelectorAll(".qr[data-i]")];
        const from = rows.indexOf(row), mids = rows.map((r) => { const b = r.getBoundingClientRect(); return b.top + b.height / 2; });
        const hgt = row.getBoundingClientRect().height + 2;
        g.setPointerCapture(e.pointerId);
        row.classList.add("is-lift"); list.classList.add("is-sorting");
        let to = from;
        const mv = (ev) => {
          const dy = ev.clientY - e.clientY;
          row.style.transform = `translate3d(0,${dy}px,0) scale(1.01)`;
          const c = mids[from] + dy;
          to = from;
          for (let k = 0; k < mids.length; k++) { if (k > from && c > mids[k]) to = k; if (k < from && c < mids[k] && to === from) to = k; }
          rows.forEach((r, k) => { if (r === row) return; const s = from < to && k > from && k <= to ? -hgt : from > to && k < from && k >= to ? hgt : 0; r.style.transform = s ? `translate3d(0,${s}px,0)` : ""; });
        };
        const fin = () => {
          g.removeEventListener("pointermove", mv); g.removeEventListener("pointerup", fin); g.removeEventListener("pointercancel", fin);
          rows.forEach((r) => { r.style.transform = ""; });
          row.classList.remove("is-lift"); list.classList.remove("is-sorting");
          if (to !== from) { const a = S.index + 1 + from, b = S.index + 1 + to; moveQueue(a, b); this.announce(`${S.queue[b].name} moved to position ${to + 1}`); }
        };
        g.addEventListener("pointermove", mv); g.addEventListener("pointerup", fin); g.addEventListener("pointercancel", fin);
      });
    }
    async share(btn) {
      const url = `https://blaqat.net/music?c=${S.track.id},${Math.floor(S.time)}`;
      let ok = false;
      try { await navigator.clipboard.writeText(url); ok = true; }
      catch {
        const ta = document.createElement("textarea");
        ta.value = url; ta.setAttribute("readonly", ""); ta.style.cssText = "position:fixed;opacity:0;top:0";
        document.body.appendChild(ta); ta.select();
        try { ok = document.execCommand("copy"); } catch { ok = false; }
        ta.remove();
      }
      this.sharing = true;
      btn.classList.add("is-done");
      btn.querySelector(".i-link").outerHTML = icon(ok ? "check" : "close", "i-link");
      btn.querySelector(".share-l").textContent = ok ? `Copied · ${fmt(S.time)}` : "Couldn't copy";
      this.announce(ok ? `Link copied, starts at ${fmt(S.time)}` : `Couldn't copy. The link is ${url}`);
      clearTimeout(this.shareT);
      this.shareT = setTimeout(() => {
        this.sharing = false; btn.classList.remove("is-done");
        const i = btn.querySelector(".i-link"); if (i) i.outerHTML = icon("link", "i-link");
        this.paintTime(true);
      }, 1800);
    }
  }

  /* the kit's mobile nav, while the mini row is sewn on top of it */
  const NAV_CSS = `@media (max-width:959px){
html.yp-navdock .ybar{height:var(--ypd-navh,56px) !important;border-top-left-radius:0 !important;border-top-right-radius:0 !important;outline-color:transparent !important;box-shadow:0 10px 26px rgba(31,30,30,.3) !important}
html.yp-navdock .ybar::after{content:"";position:absolute;left:4px;right:4px;top:0;bottom:4px;border:2px dashed var(--ypd-stitch);border-top:0;border-radius:0 0 18px 18px;pointer-events:none}
html.yp-navdock.yp-navdock--cont .ybar{background-image:var(--ypd-img) !important;background-size:var(--ypd-size) !important;background-position:0 calc(var(--ypd-h1) * -1) !important;background-color:var(--ypd-color) !important}
}`;
  // kit materials, with the gradient stretched over the whole dock so row + tabs read as one cloth
  const NAVMAT = {
    corduroy: { tex: ["var(--tex-corduroy)"], ts: ["auto"], grad: "linear-gradient(180deg,#8a5a35,#7a4e2d)", color: "#7a4e2d", fg: "#fff7ee", stitch: "rgba(255,248,238,.55)" },
    suede: { tex: ["var(--tex-felt)"], ts: ["160px"], grad: "linear-gradient(180deg,#8c5d3a,#6f4628)", color: "#6f4628", fg: "#fff7ee", stitch: "rgba(255,248,238,.55)" },
    cork: { tex: ["var(--tex-cork)"], ts: ["120px"], grad: "linear-gradient(#b98a5a,#b98a5a)", color: "#b98a5a", fg: "#1f1e1e", stitch: "rgba(31,30,30,.35)" },
    burlap: { tex: ["var(--tex-burlap)"], ts: ["auto", "auto"], grad: "linear-gradient(#a27b52,#a27b52)", color: "#a27b52", fg: "#fffaf2", stitch: "rgba(255,248,238,.55)" },
  };
  const ROW_H = 48, NAV_H = 56;

  function ensureFonts() {
    const has = document.querySelector('link[href*="fonts.googleapis"],link[href*="yarn.css"]');
    if (has) return;
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Nunito:wght@500..900&family=JetBrains+Mono:wght@400;600&display=swap";
    document.head.appendChild(l);
  }

  customElements.define("yarn-player", YarnPlayerEl);

  window.YarnPlayer = {
    play, toggle, pause, next, prev, seek, enqueue,
    setShuffle: (on) => setShuffle(on == null ? !S.shuffle : !!on),
    expand: () => EL?.setOpen(true),
    collapse: () => EL?.setOpen(false),
    get state() { return snapshot(); },
    on(fn) { subs.add(fn); return () => subs.delete(fn); },
    get library() { return library(); },
    resolve, swatch, durationOf, icon,
    meta: { INST, STATUS, YARN, LINKS, dates, md, fmt, esc },
  };
})();
