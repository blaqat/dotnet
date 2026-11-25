/* ============================================================
   blaqat.net · round 3 · iteration 2 · <yarn-player>  (owner: music)
   One global player. Light DOM (so kit parts — Yarn.meta, .ylinkicon,
   .ysel — render exactly like on the pages); injects its own
   .yp-* styles once; reads window.BLAQAT.music; owns the one <audio>;
   remembers track / position / volume / view in localStorage.
   Works without the kit too (plain fallbacks), see music/player-test.html.

   Include on any page (after kit/yarn.js):
     <script src="../kit/player.js" defer></script>
     <yarn-player></yarn-player>          (optional: one is created on first play)

   THREE VIEWS, ONE SHELL
     disc   a spinning felt record (FAB) — still when paused; red progress thread around it
     bar    grows out of the disc: title · scrub · ⏮ ▶ ⏭ · volume · ⌃ · disc
     panel  grows up out of the bar (same cloth, one dotted seam): details, links, queue
   Desktop: disc bottom-right; the bar unrolls left out of it. Click the disc to tuck it away.
   Mobile (i4 round 2 = iteration 3's player again, + the i4 requirements): the disc rests at the right end of the
     row (the slot's centre line, just clear of the nav; ?discat=nav = i3's spot over the nav's top-right corner);
     tap → the bar unrolls out of it into the slot, 8px ABOVE the nav and above it in z (kit/yarn.css "BOTTOM
     CHROME" + "Z-INDEX SCALE"); the search FAB opening takes the slot and the disc waits above it, smaller (Yarn.slot).
     Every bottom number comes from the nav's top edge (--nav-bottom → --yslot-b), read live through a probe.
     On the bar: swipe up → full page, swipe right / down → back into the disc, tap the title → full page.
     On the page: drag down → bar, drag diagonally down → all the way into the disc.
     Swipe up / diagonally from the disc → full page at once. Springs + velocity handoff + rubber band.

   API  window.YarnPlayer   (iteration-1 API kept; additions marked +)
     play(track, queue?)  track = library id ("vgm-class_combat"), audio url, track name,
                          or { name, url, ... }; queue = array of the same
     toggle() pause() next() prev() seek(sec) enqueue(track, {next}) setShuffle(on?)
   + playNext(track) remove(track|index) has(track) queue (upcoming)      (i4: Music's "add to queue")
     expand()             → panel            collapse()  → bar (from the panel)
   + minimize()           → disc             show()      → bar
   + view / setView("disc"|"bar"|"panel")    setVolume(0..1)  setMuted(bool)
     state                { track, queue, index, playing, time, duration, volume, muted,
                            shuffle, repeat, expanded, + view, demo }
     on(fn) -> off        fn(state, kind); kind: track|state|queue|volume|expand|+view|time
                          (also window "yarnplayer" CustomEvent, without "time")
     library  resolve  swatch(track)  durationOf(track)  icon(name)  meta{…}
   + discHTML(track?, { size })   the record, for pages that want the same disc
   + linksHTML(track)             icon-only link buttons (SoundCloud · YouTube · BeepBox)

   URL  ?demo            believable "playing" state, no audio ("combat", 1:12)
        ?demo=live       same, clock runs        ?demo=<id|name>  pick the demo track
        ?player=disc|bar|panel     start in that view (also expanded|mini, i1 names)
        ?disc=swatch|cat label: the track's yarn swatch (default) or the thoughts red cat label
        ?burst=subtle|off          notes burst on play (default subtle)
        ?pb=0..1 ?pe=0..1          freeze disc↔bar / bar↔panel morph progress (review)
        ?pdrag=bar-up|bar-right|bar-down|disc-up|disc-left|panel-down|panel-diag &pp=0..1   frozen swipe + finger
        ?phover=scrub:0.7|vol:0.35 frozen hover preview (review)
        ?c=<id>,<sec>    load a shared track at a time (paused)
        ?ios=1           mute-only volume        ?reduced  reduced motion
        ?discat=line|nav phones: where the disc rests: on the slot's centre line, clear of the nav (default) or
                         i3's spot, overlapping the nav's top-right corner
   Sets --bottom-ui on <html> (space the disc / bar take; pages pad fixed bottoms with it).
   ============================================================ */
(() => {
  "use strict";
  if (window.YarnPlayer) return;

  /* ---------------- environment ---------------- */
  const SCRIPT = document.currentScript;
  const BASE = (SCRIPT && SCRIPT.src) || new URL("kit/player.js", location.href).href;
  const kitURL = (p) => new URL(p, BASE).href;
  const params = new URLSearchParams(location.search);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const num = (k) => (params.has(k) && params.get(k) !== "" && isFinite(+params.get(k)) ? clamp(+params.get(k), 0, 1) : null);
  const DEMO = params.has("demo") && params.get("demo") !== "0";
  const DEMO_LIVE = params.get("demo") === "live";
  const DEMO_ID = DEMO && !["", "1", "live", "on"].includes(params.get("demo") || "") ? params.get("demo") : null;
  const FV = params.get("player");
  const FORCE_VIEW = ["disc", "bar", "panel"].includes(FV) ? FV : FV === "expanded" ? "panel" : FV === "mini" ? "bar" : null;
  const FREEZE = { b: num("pb"), e: num("pe") };
  const DRAG = ["bar-up", "bar-right", "bar-down", "disc-up", "disc-left", "panel-down", "panel-diag"].includes(params.get("pdrag")) ? { mode: params.get("pdrag"), p: num("pp") ?? 0.4 } : null;
  const HOVER = (() => { const m = /^(scrub|vol):([\d.]+)$/.exec(params.get("phover") || ""); return m ? { what: m[1], at: clamp(+m[2], 0, 1) } : null; })();
  const DISC_LABEL = params.get("disc") === "cat" ? "cat" : "swatch";
  const BURST = params.get("burst") === "off" ? "off" : "subtle";
  const DISC_AT = params.get("discat") === "nav" ? "nav" : "line";
  // i5 · MP1: a long press on the disc (touch or mouse, 450ms; right-click / the menu key too) floats ▶ · mute · ⏭ beside it
  const DISC_LONG = params.get("disclong") === "off" ? "off" : "actions";
  // i5 · MP3: the expanded panel's song notes vs collection notes: divider (one column, a labelled seam) | tabs
  const PNOTES = params.get("pnotes") === "tabs" ? "tabs" : "divider";
  // i6 · M7 (owner: "in the player thats the most important place to show something is wip"): an ongoing song.
  //   tag  the site's ongoing tape (cards' condensed badge) after the bar's title · a sewn "Ongoing" label on the
  //        panel's art · a red pin on the disc's rim
  //   seam the player's own stitching is unfinished: the outline runs red and stops at a needle, its thread
  //        trailing (bar + panel) · the needle through the disc's rim · the bar's line says "ongoing"
  //   off  i5: only the panel's facts say "Ongoing"
  // i7 · M3 (decided: redesigned): wip = a plain "WIP" mark (hammer, gold, not red) is the default; tag / seam → Earlier
  const PWIP = ["wip", "tag", "seam", "off"].includes(params.get("pwip")) ? params.get("pwip") : "wip";
  // i7 follow-up (owner: "maybe add an option to change all the player control colors from red to yellow when playing a
  // wip song"): ?pwipc=gold → while an ongoing song is loaded, the player's red is WIP gold (Open) · red (default)
  const PWIPC = params.get("pwipc") === "red" ? "red" : "gold"; // i8: decided gold
  const LS = "yarn-player:v2";
  const LS_DUR = "yarn-player:durations";
  const LS_VIEW = "yarn-player:view";
  const reduced = () => (params.has("reduced") && params.get("reduced") !== "0") || matchMedia("(prefers-reduced-motion: reduce)").matches;
  const compactMQ = matchMedia("(max-width: 959px)");
  const IOS = params.get("ios") === "1" || (params.get("ios") !== "0" && (/iP(hone|od|ad)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)));
  const sound = (name, opts) => { try { window.YarnSound?.play(name, opts); } catch { /* optional */ } };

  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } },
  };

  /* ---------------- small utils ---------------- */
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const fmt = (s) => { s = Math.max(0, Math.floor(s || 0)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
  const slug = (s) => String(s).toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-") || "x";
  const kslug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); // same as Yarn.slug (page keys)
  function hash(str) { let h = 2166136261; for (const ch of String(str)) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) {
    let a = seed >>> 0;
    return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  // Apple's momentum projection (px travelled after release) + rubber band
  const project = (v, d = 0.998) => ((v / 1000) * d) / (1 - d);
  const rubber = (o, dim, c = 0.55) => (o * dim * c) / (dim + c * Math.abs(o));

  /* critically damped spring with velocity hand-off; damping < 1 only after a flick */
  class Spr {
    constructor(v = 0) { this.x = v; this.v = 0; this.t = v; this.k = 0; this.c = 0; this.live = false; }
    to(t, { velocity = null, damping = 1, response = 0.38 } = {}) {
      const w = (2 * Math.PI) / response;
      this.k = w * w; this.c = 2 * damping * w; this.t = t;
      if (velocity != null) this.v = velocity;
      this.live = true;
    }
    jump(v) { this.x = this.t = v; this.v = 0; this.live = false; }
    step(dt) {
      if (!this.live) return false;
      const n = Math.max(1, Math.ceil(dt / 0.004)), h = dt / n;
      for (let i = 0; i < n; i++) { this.v += (-this.k * (this.x - this.t) - this.c * this.v) * h; this.x += this.v * h; }
      if (Math.abs(this.x - this.t) < 0.0006 && Math.abs(this.v) < 0.02) { this.x = this.t; this.v = 0; this.live = false; }
      return true;
    }
  }

  /* ---------------- icons (inline: the player works without Phosphor) ---------------- */
  const SPEAKER = '<path d="M4 9.4h3.1L12 5.6v12.8l-4.9-3.8H4a1 1 0 0 1-1-1V10.4a1 1 0 0 1 1-1z" fill="currentColor" stroke="none"/>';
  // play: drawn optically centred (bbox centre +1px right of the box centre, centroid −0.9px) so it sits right in a round button
  const ICONS = {
    play: '<path d="M7.6 5.2v13.6a1.05 1.05 0 0 0 1.6.9l10.5-6.8a1.05 1.05 0 0 0 0-1.8L9.2 4.3a1.05 1.05 0 0 0-1.6.9z" fill="currentColor" stroke="none"/>',
    pause: '<rect x="6.3" y="5" width="4.1" height="14" rx="1.4" fill="currentColor" stroke="none"/><rect x="13.6" y="5" width="4.1" height="14" rx="1.4" fill="currentColor" stroke="none"/>',
    prev: '<path d="M5.5 5.5v13"/><path d="M19 6.1v11.8a.9.9 0 0 1-1.4.74l-8.4-5.9a.9.9 0 0 1 0-1.48l8.4-5.9a.9.9 0 0 1 1.4.74z" fill="currentColor" stroke="none"/>',
    next: '<path d="M18.5 5.5v13"/><path d="M5 6.1v11.8a.9.9 0 0 0 1.4.74l8.4-5.9a.9.9 0 0 0 0-1.48l-8.4-5.9A.9.9 0 0 0 5 6.1z" fill="currentColor" stroke="none"/>',
    shuffle: '<path d="M3 7h3.2c4.6 0 6.6 10 11.3 10H21"/><path d="M3 17h3.2c1.9 0 3.2-1.7 4.3-3.7"/><path d="M13.5 9.7C14.6 8 15.9 7 17.5 7H21"/><path d="M18.5 4.5 21 7l-2.5 2.5M18.5 14.5 21 17l-2.5 2.5"/>',
    repeat: '<path d="M4 12V9.6A3.6 3.6 0 0 1 7.6 6H20"/><path d="M17 3l3 3-3 3"/><path d="M20 12v2.4a3.6 3.6 0 0 1-3.6 3.6H4"/><path d="M7 21l-3-3 3-3"/>',
    repeat1: '<path d="M4 12V9.6A3.6 3.6 0 0 1 7.6 6H20"/><path d="M17 3l3 3-3 3"/><path d="M20 12v2.4a3.6 3.6 0 0 1-3.6 3.6H4"/><path d="M7 21l-3-3 3-3"/><path d="M11.1 10.6 12.6 9.6v5" stroke-width="1.8"/>',
    volHi: SPEAKER + '<path d="M15.6 9.2a4 4 0 0 1 0 5.6"/><path d="M18.3 6.6a7.6 7.6 0 0 1 0 10.8"/>',
    volLo: SPEAKER + '<path d="M15.6 9.2a4 4 0 0 1 0 5.6"/>',
    mute: SPEAKER + '<path d="M16 9.6l4.8 4.8M20.8 9.6 16 14.4"/>',
    up: '<path d="M6 15l6-6 6 6"/>',
    down: '<path d="M6 9l6 6 6-6"/>',
    grip: '<g fill="currentColor" stroke="none"><circle cx="9" cy="6.5" r="1.5"/><circle cx="15" cy="6.5" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="17.5" r="1.5"/><circle cx="15" cy="17.5" r="1.5"/></g>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
  };
  const icon = (name, cls = "") =>
    `<svg class="yp-ic ${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ""}</svg>`;
  // the owner's original link icons (Phosphor: SoundCloud logo, YouTube logo, a circle for BeepBox) — bold weight, like Yarn.linkIcon
  const PH = {
    soundcloud: "M32,120v48a12,12,0,0,1-24,0V120a12,12,0,0,1,24,0ZM60,84A12,12,0,0,0,48,96v96a12,12,0,0,0,24,0V96A12,12,0,0,0,60,84Zm40-40A12,12,0,0,0,88,56V192a12,12,0,0,0,24,0V56A12,12,0,0,0,100,44Zm122.34,59.33A84,84,0,0,0,140,36a12,12,0,0,0,0,24,59.78,59.78,0,0,1,59.7,53.93,12,12,0,0,0,9.66,10.58A28,28,0,0,1,204,180H140a12,12,0,0,0,0,24h64a52,52,0,0,0,18.34-100.67Z",
    youtube: "M170.49,117.91l-56-36A12,12,0,0,0,96,92v72a12,12,0,0,0,18.49,10.09l56-36a12,12,0,0,0,0-20.18ZM120,142V114l21.81,14Zm118.21-73.5a28.05,28.05,0,0,0-16.93-19.14C186.4,35.91,131.29,36,128,36s-58.4-.09-93.28,13.38A28.05,28.05,0,0,0,17.79,68.52C15.15,78.72,12,97.32,12,128s3.15,49.28,5.79,59.48a28.05,28.05,0,0,0,16.93,19.14C68.21,219.55,120.36,220,127.37,220h1.26c7,0,59.16-.45,92.65-13.38a28.05,28.05,0,0,0,16.93-19.14c2.64-10.2,5.79-28.8,5.79-59.48S240.85,78.72,238.21,68.52ZM215,181.46a4,4,0,0,1-2.34,2.77C182.78,195.76,132.27,196,128.32,196h-.39c-.53,0-53.64.17-84.56-11.77A4,4,0,0,1,41,181.46c-1.88-7.24-5-23.82-5-53.46s3.15-46.22,5-53.46a4,4,0,0,1,2.34-2.77C74.29,59.83,127.39,60,127.92,60h.15c.54,0,53.64-.17,84.56,11.77A4,4,0,0,1,215,74.54c1.88,7.24,5,23.820,5,53.46S216.85,174.22,215,181.46Z",
    beepbox: "M128,20A108,108,0,1,0,236,128,108.12,108.12,0,0,0,128,20Zm0,192a84,84,0,1,1,84-84A84.09,84.09,0,0,1,128,212Z",
    spotify: "M128,20A108,108,0,1,0,236,128,108.12,108.12,0,0,0,128,20Zm0,192a84,84,0,1,1,84-84A84.09,84.09,0,0,1,128,212Zm66.59-84.36a12,12,0,0,1-16.24,4.93,106.7,106.7,0,0,0-100.7,0A11.83,11.83,0,0,1,72,134a12,12,0,0,1-5.66-22.58,130.61,130.61,0,0,1,123.3,0A12,12,0,0,1,194.59,127.64Zm-16,36a12,12,0,0,1-16.23,5,73,73,0,0,0-68.72,0,12,12,0,0,1-11.28-21.18,97,97,0,0,1,91.28,0A12,12,0,0,1,178.59,163.64Z",
    link: "M117.18,188.74a12,12,0,0,1,0,17l-5.12,5.12A58.26,58.26,0,0,1,70.6,228h0A58.62,58.62,0,0,1,29.14,127.92L63.89,93.17a58.64,58.64,0,0,1,98.56,28.11,12,12,0,1,1-23.37,5.44,34.650,34.650,0,0,0-58.22-16.58L46.11,144.89A34.62,34.62,0,0,0,70.57,204h0a34.41,34.41,0,0,0,24.49-10.14l5.11-5.12A12,12,0,0,1,117.18,188.74ZM226.83,45.17a58.65,58.65,0,0,0-82.93,0l-5.11,5.11a12,12,0,0,0,17,17l5.12-5.12a34.63,34.63,0,1,1,49,49L175.1,145.86A34.39,34.39,0,0,1,150.61,156h0a34.63,34.63,0,0,1-33.69-26.72,12,12,0,0,0-23.38,5.44A58.64,58.64,0,0,0,150.56,180h.05a58.28,58.28,0,0,0,41.47-17.17l34.75-34.75a58.62,58.62,0,0,0,0-82.910Z",
    check: "M232.49,80.49l-128,128a12,12,0,0,1-17,0l-56-56a12,12,0,1,1,17-17L96,183,215.51,63.51a12,12,0,0,1,17,17Z",
  };
  const PH_NAME = { soundcloud: "soundcloud-logo", youtube: "youtube-logo", beepbox: "circle", spotify: "spotify-logo", link: "link", check: "check" };
  const hasPhosphor = () => !!document.querySelector("link[data-ph]");
  // BeepBox = the original site's duotone circle (ring + a faint fill): .yduo in yarn.css
  const phIcon = (k) => hasPhosphor() ? `<i class="ph-bold ph-${PH_NAME[k]}${k === "beepbox" ? " yduo" : ""}" aria-hidden="true"></i>` : `<svg class="yp-ph" viewBox="0 0 256 256" aria-hidden="true"><path fill="currentColor" d="${PH[k]}"/></svg>`;
  const LINKS = { soundcloud: "SoundCloud", youtube: "YouTube", beepbox: "BeepBox song", spotify: "Spotify" };
  const CAT = '<svg viewBox="30 0 320 380" aria-hidden="true"><path fill="#fff" d="M178.1,100.5C174.9,91.6 175.4,83 178.4,74.7C181.1,67.3 181.8,59.9 181.3,52.1C180.5,39.1 180.3,26.1 183.9,13.4C186.6,3.7 190.6,1.9 198.4,8.1C205.5,13.6 211.8,20.1 217.9,26.6C220.8,29.7 223.1,30.7 227.6,30.4C237.3,29.7 247.2,30.1 256.9,30.7C260.1,30.8 261.9,30.3 264.1,28C271.2,20.8 278.4,13.5 286.3,7.3C292.9,2.1 296.5,3.9 298.9,12C302.6,24.7 302.8,37.7 302,50.7C301.5,58.3 302.1,65.7 304.9,72.8C311.9,91.2 306.7,106.9 293.5,120.3C289.5,124.3 288.8,128 291.1,132.6C297.8,145.8 304.1,159.2 311.4,172.1C323,193 333.6,214.2 338,238C344.8,274.8 339.9,308.9 314.6,338.6C318.1,339.6 321.4,340.2 324.4,341.4C330.5,343.8 334,349.4 333.5,355.4C333,361.8 329,366.6 322.5,367.9C317.8,368.9 312.9,369.3 308.1,369.3C289.6,369.4 271,370 252.6,368.9C233.7,367.9 215.5,371.8 196.9,373.4C155.6,376.9 114.3,376.8 74.1,364.8C65.8,362.3 57.6,358.2 50.5,353.3C35.8,343.1 35.2,325.7 48.2,313.4C59.3,302.9 73.4,298.1 87.8,294.3C94.5,292.5 101.5,291.8 108.4,290.7C110.2,290.4 112.1,290.6 113.9,290.8C118.4,291.3 121.3,293.9 121.8,298.4C122.3,303.1 120.2,306.8 115.6,308C109.3,309.6 102.8,310.3 96.5,312C89,314 81.5,316.4 74.2,319C71.1,320.1 68.2,321.9 65.5,323.8C58.1,329.1 58.2,333.8 66.4,337.8C72.7,340.8 79.5,343.1 86.2,344.2C120.3,349.9 154.2,349.8 187.9,341.9C193.8,340.5 199.3,337.8 205,335.7C204.9,335.2 204.8,334.7 204.7,334.2C203.1,334.2 201.4,334.1 199.8,334.2C190.3,334.9 180.9,335.7 171.5,336.5C167.7,336.8 165.3,335.2 163.1,332.2C138.2,298.6 135.8,262.1 149.5,223.7C156.6,203.8 169.1,186.7 180.3,169C186.8,158.7 192.9,148.3 196.2,136.4C197.8,130.5 196.9,126.4 192.5,121.6C186.9,115.5 182.9,107.8 178.1,100.5z"/></svg>';

  /* ---------------- meta ---------------- */
  // the bar's second line: where the track comes from (collection), or who made it (a playlist's other artist); else
  // nothing. i5 · MP2 (owner, from the original design): "from <Collection>", not "x of y"; a single has no line
  const whereOf = (t) => (t.collection ? `from ${t.collection}` : t.external && t.artist ? [].concat(t.artist).join(", ") : "");
  const INST = { daw: "DAW", piano: "Piano", beepbox: "BeepBox", other: "Other" };
  const STATUS = { complete: ["complete", "Complete"], wip: ["wip", "WIP"], dropped: ["dropped", "Dropped"] };
  function dates(t) {
    if (window.Yarn?.dateRange) return window.Yarn.dateRange(t);
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
          const raw = u.replace(/&amp;/g, "&");
          const href = raw.startsWith("/music") ? kitURL("../music/index.html") + raw.replace(/^\/music\/?/, "") : raw;
          const ext = /^https?:/.test(href) && !href.startsWith(location.origin);
          return `<a href="${esc(href)}"${ext ? ' target="_blank" rel="noopener"' : ""}>${txt}</a>`;
        });
    return String(src)
      .trim()
      .split(/\n\s*\n/)
      .map((b) => `<p>${b.split("\n").map((l) => { const h = l.match(/^\s*#{1,6}\s+(.*)$/); return h ? `<strong class="yp-md-h">${inline(h[1])}</strong>` : inline(l); }).join("<br>")}</p>`)
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
      start: s.start || coll?.start, end: s.end || coll?.end,
      description: s.description || "",
      links: Object.fromEntries(Object.entries(s.links || {}).filter(([, v]) => v)),
      artist: s.artist || null,
      collection: coll ? coll.name : null,
      collectionId: coll ? coll.id : null,
      index: i + 1,
      count: n,
      src: s,
    };
  }
  function library() {
    if (LIB) return LIB;
    LIB = { entries: [], tracks: [], byId: new Map(), collections: new Map() };
    const add = (t) => { let id = t.id, k = 2; while (LIB.byId.has(id)) id = `${t.id}-${k++}`; t.id = id; LIB.byId.set(id, t); LIB.tracks.push(t); return t; };
    for (const e of window.BLAQAT?.music || []) {
      if (Array.isArray(e.songs)) {
        const coll = {
          kind: "collection", id: kslug(e.name), key: kslug(e.name), name: e.name, instrument: e.instrument || "other", status: e.status || "complete",
          start: e.start, end: e.end, description: e.description || "", links: e.links || {}, tracks: [], src: e,
        };
        e.songs.forEach((s, i) => coll.tracks.push(add(mkTrack(s, coll, i, e.songs.length))));
        LIB.entries.push(coll);
        LIB.collections.set(coll.id, coll);
      } else {
        const t = add(mkTrack(e, null, 0, 1));
        t.key = kslug(e.name);
        LIB.entries.push(t);
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
    if (window.Yarn?.wave) return window.Yarn.wave.values(t?.id || "x", n);
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

  /* ---------------- yarn swatch: the kit's (kit/swatch.js), seeded like the pages (url, else name) ---------------- */
  let swLoading = false;
  function swatch(t) {
    if (typeof t === "string") t = resolve(t) || { name: t };
    if (!t) return "";
    if (!window.YarnSwatch) { loadSwatch(); return ""; }
    return window.YarnSwatch.uri({ instrument: t.instrument, url: t.url || undefined, name: t.name });
  }
  function loadSwatch() {
    if (swLoading || window.YarnSwatch) return;
    swLoading = true;
    const s = document.createElement("script");
    s.src = kitURL("swatch.js");
    s.onload = () => EL && EL.update("all");
    document.head.appendChild(s);
  }
  function swatchPNG(t, size = 512) {
    return new Promise((res, rej) => {
      const src = swatch(t);
      if (!src) return rej(new Error("no swatch"));
      const img = new Image();
      img.onload = () => { try { const c = document.createElement("canvas"); c.width = c.height = size; c.getContext("2d").drawImage(img, 0, 0, size, size); res(c.toDataURL("image/png")); } catch (e) { rej(e); } };
      img.onerror = rej;
      img.src = src;
    });
  }

  /* ============================================================
     ENGINE (state + one <audio>; src is set only when you press play)
     ============================================================ */
  const audio = document.createElement("audio");
  audio.preload = "none";
  const S = { track: null, queue: [], base: [], index: -1, playing: false, time: 0, duration: 0, volume: 0.8, muted: false, shuffle: false, repeat: "off", view: "bar", expanded: false, demo: false };
  let pendingSeek = null, EL = null, booted = false, lastSave = 0;
  const subs = new Set();

  function snapshot() {
    return { track: S.track, queue: S.queue.slice(), index: S.index, playing: S.playing, time: S.time, duration: S.duration, volume: S.volume, muted: S.muted, shuffle: S.shuffle, repeat: S.repeat, expanded: S.view === "panel", view: S.view, demo: S.demo };
  }
  // i5 · for chrome (G8 "UI sounds go quiet while music plays"): YarnPlayer.playing, html.y-playing, and the
  // window "yarnplayer" event (kind "state") all say whether audio is playing right now
  let playingFlag = false;
  function emit(kind) {
    if (playingFlag !== S.playing) { playingFlag = S.playing; document.documentElement.classList.toggle("y-playing", S.playing); }
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
    if (!S.track) {
      const prev = store.get(LS, null) || {};
      return store.set(LS, { ...prev, volume: S.volume, muted: S.muted, shuffle: S.shuffle, repeat: S.repeat });
    }
    store.set(LS, { id: S.track?.id || null, url: S.track?.url || null, q: S.queue.map((t) => t.id), i: S.index, time: Math.floor(S.time), volume: S.volume, muted: S.muted, shuffle: S.shuffle, repeat: S.repeat });
  }
  function exitDemo() { if (!S.demo) return; S.demo = false; clearInterval(demoTimer); demoTimer = 0; }
  function ensureEl() { if (!EL && document.body) document.body.appendChild(document.createElement("yarn-player")); }
  const srcIs = (t) => !!t?.url && audio.getAttribute("src") === t.url;
  function ensureSrc() {
    if (!S.track?.url || srcIs(S.track)) return;
    audio.src = S.track.url;
    pendingSeek = S.time > 0.5 ? S.time : null;
  }

  function load(t, { autoplay = true, at = 0 } = {}) {
    S.track = t; S.time = at || 0; S.duration = durationOf(t);
    if (S.demo) S.playing = autoplay;
    else if (autoplay && t.url) { audio.src = t.url; pendingSeek = at > 0 ? at : null; playAudio(); }
    else { S.playing = false; if (!audio.paused) audio.pause(); }
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
    return t.collectionId ? L.tracks.filter((x) => x.collectionId === t.collectionId) : L.tracks.filter((x) => !x.collectionId && !x.external);
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
    const first = !EL?.shown;
    load(t, { autoplay: true });
    emit("queue");
    if (first) EL?.arrive();
    return true;
  }
  function toggle() {
    if (!S.track) { const first = library().tracks.find((x) => x.url); return first ? play(first) : undefined; }
    if (S.demo) { S.playing = !S.playing; if (S.playing) startDemoClock(); emit("state"); return; }
    if (audio.paused) { ensureSrc(); playAudio(); } else audio.pause();
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
    if (!S.demo) {
      if (srcIs(S.track) && audio.readyState >= 1) { try { audio.currentTime = sec; } catch { pendingSeek = sec; } }
      else pendingSeek = sec;
    }
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
  // i4 · queue API for "add to queue" (Music): enqueue(track) adds to the end, playNext(track) right after the
  // current one; a track already waiting moves instead of doubling. Nothing playing yet → it starts playing.
  function enqueue(track, { next: asNext = false } = {}) {
    const t = resolve(track);
    if (!t || !t.url) return false;
    if (!S.track) return play(t, [t]);
    if (t === S.track && !asNext) return true;
    const was = S.queue.indexOf(t, S.index + 1);
    if (was > -1) { S.queue.splice(was, 1); const bi = S.base.indexOf(t); if (bi > -1) S.base.splice(bi, 1); }
    const at = asNext ? S.index + 1 : S.queue.length;
    S.queue.splice(at, 0, t);
    if (!S.shuffle) S.base = S.queue.slice(); else S.base.push(t);
    save(true); emit("queue");
    EL?.announce(asNext ? `${t.name} plays next` : `${t.name} added to the queue`);
    return true;
  }
  const playNext = (track) => enqueue(track, { next: true });
  // upcoming only: the track playing now isn't "in the queue" for add-to-queue buttons
  const has = (track) => { const t = resolve(track); return !!t && S.queue.indexOf(t, S.index + 1) > -1; };
  function remove(track) {
    const t = typeof track === "number" ? S.queue[track] : resolve(track);
    const i = t ? S.queue.indexOf(t, S.index + 1) : -1;
    if (i < 0) return false;
    S.queue.splice(i, 1);
    const bi = S.base.indexOf(t); if (bi > -1) S.base.splice(bi, 1);
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
  function setVolume(v) { S.volume = clamp(v, 0, 1); S.muted = S.volume === 0 ? S.muted : false; applyVolume(); save(true); emit("volume"); }
  function setMuted(m) { S.muted = !!m; if (!S.muted && S.volume === 0) S.volume = 0.5; applyVolume(); save(true); emit("volume"); }

  audio.addEventListener("play", () => { if (S.demo) return; S.playing = true; emit("state"); });
  audio.addEventListener("pause", () => { if (S.demo) return; S.playing = false; save(true); emit("state"); });
  audio.addEventListener("loadedmetadata", () => {
    if (isFinite(audio.duration) && audio.duration > 0 && S.track && srcIs(S.track)) {
      S.duration = audio.duration;
      realDur[S.track.id] = Math.round(audio.duration);
      store.set(LS_DUR, realDur);
    }
    if (pendingSeek != null) { try { audio.currentTime = pendingSeek; } catch { /* ignore */ } pendingSeek = null; }
    emit("time");
  });
  audio.addEventListener("timeupdate", () => { if (S.demo || !srcIs(S.track)) return; S.time = audio.currentTime; save(); emit("time"); });
  audio.addEventListener("ended", () => next(true));
  audio.addEventListener("error", () => { if (S.demo || !audio.getAttribute("src")) return; S.playing = false; emit("state"); });

  /* ---- Media Session ---- */
  let lastPos = 0;
  function mediaMeta() {
    if (!("mediaSession" in navigator) || !S.track || typeof MediaMetadata === "undefined") return;
    const t = S.track;
    const meta = (artwork) => new MediaMetadata({ title: t.name, artist: "blaqat", album: t.collection || "", artwork });
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
    const t = (DEMO_ID && resolve(DEMO_ID)) || resolve("vgm-class_combat") || L.tracks.find((x) => x.url);
    if (!t) return;
    const coll = t.collectionId ? L.tracks.filter((x) => x.collectionId === t.collectionId && x.url) : [t];
    const extra = ["cast adrift", "marmalade cafe", "gleaming shadows", "farewell my star"].map(resolve).filter((x) => x && !coll.includes(x));
    S.queue = [...coll, ...extra]; S.base = S.queue.slice(); S.index = S.queue.indexOf(t);
    S.track = t; S.duration = t.id === "vgm-class_combat" ? 185 : durationOf(t); S.time = Math.min(72, S.duration * 0.39); S.playing = params.get("paused") !== "1";
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

  /* ---- keyboard: space toggles unless typing / on a control; esc steps the view down ---- */
  const CONTROL = "input,textarea,select,button,a[href],summary,audio,video,[contenteditable],[role=slider],[role=button],[role=textbox],[role=combobox],[role=checkbox],[role=switch],[role=tab],[role=menuitem],[role=option],[role=spinbutton]";
  document.addEventListener("keydown", (e) => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || !S.track) return;
    if (e.key === "Escape" && EL && EL.view === "panel" && !window.Yarn?.lightbox?.isOpen) { EL.setView("bar"); return; }
    if (e.key !== " " && e.code !== "Space") return;
    const el = e.target;
    if (el instanceof Element && (el.closest(CONTROL) || el.isContentEditable)) return;
    e.preventDefault();
    toggle();
  });
  addEventListener("pagehide", () => save(true));
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") save(true); });

  /* ============================================================
     STYLES (light DOM, .yp-* only; kit tokens with fallbacks so it works standalone)
     ============================================================ */
  const CSS = `
/* no stacking context of its own: its layers take their places in the kit's Z-INDEX SCALE (kit/yarn.css):
   bar + disc = chrome (60, over the nav's 50 and under the search FAB's 62); while the phone page is open (or
   opening: .is-sheet) the scrim = 79 and the sheet + its disc = 80, over everything but toasts and modals */
yarn-player{display:block;position:relative;height:0}
.yp{--p-ink:var(--ink,#1f1e1e);--p-ink2:var(--ink-2,#4a4646);--p-ink3:var(--ink-3,#6e6868);--p-cotton:var(--cotton,#fbf8f3);--p-cotton2:var(--cotton-2,#f3eee6);
  --p-red:var(--red,#d62f38);--p-red-deep:var(--red-deep,#b4202b);--p-red-soft:var(--red-soft,#f7d9d6);
  --p-knit:var(--tex-knit,none);--p-felt:var(--tex-felt,none);--p-twill:var(--tex-twill,linear-gradient(transparent,transparent));
  --p-disp:var(--font-display,ui-rounded,system-ui,sans-serif);--p-mono:var(--font-mono,ui-monospace,monospace);--p-body:var(--font-body,system-ui,sans-serif);
  --p-line:rgba(31,30,30,.22);--p-rule:rgba(31,30,30,.13);--p-wave:rgba(31,30,30,.2);--p-ease:cubic-bezier(.2,.8,.2,1);
  --p-crit:var(--ease-crit,cubic-bezier(.2,.8,.2,1));
  font:400 15px/1.45 var(--p-body);color:var(--p-ink);-webkit-font-smoothing:antialiased;letter-spacing:0}
.yp[data-empty]{display:none}
:where(.yp) *,:where(.yp) *::before,:where(.yp) *::after{box-sizing:border-box}
:where(.yp) :where(button){font:inherit;color:inherit;background:none;border:0;padding:0;margin:0;cursor:pointer;-webkit-tap-highlight-color:transparent}
:where(.yp) svg.yp-ic{width:20px;height:20px;display:block;flex:none}
.yp svg.yp-ph{width:1.15em;height:1.15em;display:block}
.yp .yp-sr{position:absolute!important;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.yp :focus-visible{outline:3px solid var(--focus,var(--p-ink));outline-offset:2px;border-radius:12px}
.yp-safe,.yp-safet{position:fixed;left:0;width:0;visibility:hidden;pointer-events:none}
.yp-safe{bottom:0;height:env(safe-area-inset-bottom,0px)}.yp-safet{top:0;height:env(safe-area-inset-top,0px)}
/* phones: the bottom chrome's numbers, read live (a ResizeObserver re-reads them whenever the nav changes them):
   height = the slot's lower edge (kit --yslot-b), width = the nav's top edge (kit --ynav-top), both up from the bottom */
.yp-navp{position:fixed;left:0;bottom:0;visibility:hidden;pointer-events:none;
  height:var(--yslot-b,calc(var(--nav-bottom,0px) + env(safe-area-inset-bottom,0px) + 8px));
  width:var(--ynav-top,calc(var(--nav-bottom,0px) + env(safe-area-inset-bottom,0px)))}

/* ---------- one shell: panel on top, bar below, a dotted seam between; clipped by the morph ---------- */
/* i3: the shadow is a box-shadow on .yp-shade (same rect as the clip, set per frame), not a drop-shadow filter on the
   whole float: the filter re-rasterised + re-blurred the full layer on every frame of the morph (~20 dropped frames per open) */
.yp-float{position:fixed;left:0;top:0;z-index:var(--z-chrome,60);pointer-events:none;will-change:transform}
.yp.is-sheet .yp-float,.yp.is-sheet .yp-disc{z-index:var(--z-sheet,80)}
.yp-shade{position:absolute;pointer-events:none;box-shadow:0 1px 1px rgba(31,30,30,.08),0 10px 22px rgba(31,30,30,.2)}
.yp-shell{position:absolute;inset:0;pointer-events:auto;background:var(--p-knit),#fff;clip-path:inset(0 round 22px)}
.yp-stitch{position:absolute;border:2px dashed var(--p-line);border-radius:16px;pointer-events:none;z-index:3}
.yp-seam{position:absolute;left:22px;right:22px;height:0;border-top:2px dashed var(--p-line);pointer-events:none;z-index:3}
.yp-panel{position:absolute;left:0;right:0;top:0}
.yp-bar{position:absolute;left:0;right:0;background:var(--p-knit),#fff}
.yp-row{position:absolute;left:0;right:0;top:0;bottom:0;display:grid;align-items:center;min-width:0}
.yp-slot{width:100%;height:100%}

/* ---------- the disc (Thoughts' felt record; label = the track's yarn swatch or the red cat) ---------- */
.yp-disc{position:fixed;left:0;top:0;z-index:var(--z-chrome,60);width:60px;height:60px;border-radius:50%;transform-origin:0 0;pointer-events:auto;touch-action:none;will-change:transform}
/* the record itself is the kit's .ydisc (yarn.css): grooves, felt, label, spin. The player only places it and adds the ring + tip. */
.yp-disc__rec{transition:box-shadow 240ms var(--p-ease)}
/* i7 follow-up (owner: "the disk fab gets cut at the bottom with some elements … like the bottom part is a different
   element that doesnt have the same zindex"): it was. The disc's white rim came from the shell (the panel-sized float
   clipped to a circle) while the record is the disc's own layer, so in the owner's Chromium a card's play button could
   paint over the rim but not the record. In the disc view the disc now wears its own rim (the shell's: r × 38/30, the
   same cotton), inside its own layer, so the rim and the record always paint together. It scales with the disc. */
.yp[data-view=disc] .yp-disc::before{content:"";position:absolute;inset:-8px;z-index:-1;border-radius:50%;background:var(--p-knit),#fff;pointer-events:none}
.yp-disc__ring{position:absolute;left:-7px;top:-7px;width:calc(100% + 14px);height:calc(100% + 14px);max-width:none;rotate:-90deg;pointer-events:none;overflow:visible}
.yp-disc__ring circle{fill:none;stroke-width:3}
.yp-disc__ring .r0{stroke:rgba(31,30,30,.16);stroke-dasharray:2 3}
.yp-disc__ring .r1{stroke:var(--p-red);stroke-linecap:round}
.yp-disc:focus-visible{outline:none}
.yp-disc:focus-visible .yp-disc__rec{box-shadow:0 0 0 3px #fff,0 0 0 6px var(--focus,var(--p-ink))}
@media (hover:hover){.yp-disc:hover .yp-disc__rec{box-shadow:0 1px 0 rgba(31,30,30,.12),0 10px 20px -4px rgba(31,30,30,.42)}}
.yp-disc:active .yp-disc__rec{scale:.96;transition:scale 100ms}
.yp-disc__tip{position:absolute;right:calc(100% + 14px);top:50%;translate:0 -50%;display:grid;gap:2px;padding:7px 11px;border-radius:12px;white-space:nowrap;pointer-events:none;
  background:var(--p-ink);color:#fff;font:800 13px/1.15 var(--p-disp);opacity:0;transform:translateX(6px);transition:opacity 160ms,transform 220ms var(--p-ease)}
.yp-disc__tip small{font:500 11px/1.2 var(--p-mono);color:rgba(255,255,255,.78)}
@media (hover:hover){.yp[data-view=disc] .yp-disc:hover .yp-disc__tip{opacity:1;transform:none}}
.yp[data-view=disc] .yp-disc.is-tip .yp-disc__tip{opacity:1;transform:none}
/* i7 · W1 (walkthrough, a phone-width window with a mouse): to the disc's left the tip covered the floating row's
   search knob and sections pill. Below 960px it opens upward instead, over the page, right edges lined up */
@media (max-width:959px){.yp-disc__tip{right:0;top:auto;bottom:calc(100% + 12px);translate:none;transform:translateY(6px)}}
/* i5 · MP1 (?disclong=actions): a long press on the disc floats ▶ · mute · ⏭ around it (left → up). They spring out
   of the disc and back into it on CSS transitions, so a quick open → close retargets from where they are. */
.yp-disc{-webkit-touch-callout:none;-webkit-user-select:none;user-select:none}
.yp-acts{position:fixed;left:0;top:0;width:0;height:0;z-index:var(--z-pop,70);visibility:hidden;transition:visibility 0s 260ms}
.yp-acts.is-open{visibility:visible;transition:none}
.yp-act{position:absolute;left:-23px;top:-23px;display:grid;place-items:center;width:46px;height:46px;border-radius:50%;color:var(--p-ink);
  background:var(--p-knit),#fff;box-shadow:0 0 0 1px rgba(31,30,30,.1),0 2px 0 rgba(31,30,30,.08),0 8px 18px -4px rgba(31,30,30,.32);
  translate:0 0;scale:.35;opacity:0;pointer-events:none;
  transition:translate 300ms var(--p-crit),scale 300ms var(--p-crit),opacity 160ms var(--p-ease),transform 140ms var(--p-ease),color 160ms}
.yp-act::after{content:"";position:absolute;inset:4px;border-radius:50%;border:1.5px dashed rgba(31,30,30,.18);pointer-events:none}
.yp-acts.is-open .yp-act{translate:var(--x,0) var(--y,0);scale:1;opacity:1;pointer-events:auto}
/* i6 · MP1 (owner: "missing click animation on the 3 buttons"): the press. i5's .yp-act:active{scale} lost to
   .is-open's scale:1 (specificity), so it never showed. The press rides on transform (the open / close spring owns
   translate + scale, so a press never fights it); a click also pulses (music: a quick tap is shorter than :active) */
.yp-acts.is-open .yp-act:is(:active,.is-press):not([aria-disabled="true"]){transform:scale(.86);transition-duration:300ms,300ms,160ms,80ms,160ms}
@media (hover:hover){.yp-acts.is-open .yp-act:not([aria-disabled="true"]):hover{background:var(--p-cotton2)}}
/* i6 · MP1 (owner: "next should become disabled if on the last song"): every ⏭ (actions · bar · panel) when nothing
   follows (repeat all wraps around, so it stays on then). aria-disabled: it keeps focus and its place in the
   toolbar's arrow keys; a press does nothing */
.yp [data-act="next"][aria-disabled="true"]{opacity:.36;cursor:default}
@media (hover:hover){.yp .yp-ib[data-act="next"][aria-disabled="true"]:hover{background:none;color:var(--p-ink2)}}
.yp .yp-ib[data-act="next"][aria-disabled="true"]:active{transform:none}
/* i6 · MP1 (owner: "should move the search out of the way … or just gone until the interation is done (prolly for
   the best)"): while the actions are out, the search knob (kit fab, phones) steps away like .yfab.is-away and comes
   back when they close. html.yp-acts-on is set by openActs / closeActs. */
html.yp-acts-on .yfab:not(.is-open) .yfab__btn{--yfab-s:.6;opacity:0;pointer-events:none;visibility:hidden;transition:opacity 160ms,scale 280ms var(--ease-crit,ease),visibility 0s 280ms}
.yp-act--play{color:#fff;background:var(--p-twill),var(--p-red);box-shadow:inset 0 1px 0 rgba(255,255,255,.25),0 2px 0 rgba(150,22,30,.35),0 8px 18px -4px rgba(224,53,63,.4)}
.yp-act--play::after{border-color:rgba(255,255,255,.6)}
/* i7 · B3 (owner screenshot: a washed-out Play): the white hover above (.yp-act:not([aria-disabled]):hover, 0-5-0)
   outranked Play's own red hover (0-4-0), so a hovered Play went cotton with a white icon and looked disabled. Play's
   hover now outranks it: a deeper red, the white icon, the same lift shadow. */
@media (hover:hover){.yp-acts.is-open .yp-act.yp-act--play:not([aria-disabled="true"]):hover{color:#fff;background:var(--p-twill),var(--p-red-deep)}}
.yp-act svg.yp-ic{width:20px;height:20px}
.yp.is-playing .yp-act--play svg.i-play{display:none}.yp.is-playing .yp-act--play svg.i-pause{display:block}
.yp-act[aria-pressed="true"]{color:var(--p-red-deep)}
.yp.is-acts .yp-disc__tip{opacity:0!important}
.yp.is-acts .yp-disc__rec{scale:.94;transition:scale 200ms var(--p-crit)}
.yp--rm .yp-act{transition:opacity 120ms}.yp--rm .yp-acts.is-open .yp-act{transition:opacity 120ms}
.yp .yp-act:focus-visible{border-radius:50%;outline-offset:3px}

/* ---------- buttons ---------- */
.yp-ib{position:relative;display:inline-grid;place-items:center;width:40px;height:40px;border-radius:999px;color:var(--p-ink2);transition:transform 100ms var(--p-ease),background-color 160ms,color 160ms}
@media (hover:hover){.yp-ib:hover{background:var(--p-cotton2);color:var(--p-ink)}}
.yp-ib:active{transform:scale(.92)}
.yp-tg[aria-pressed="true"]{color:var(--p-red-deep);background:var(--p-red-soft)}
.yp-tg[aria-pressed="true"]::after{content:"";position:absolute;bottom:3px;left:50%;width:4px;height:4px;margin-left:-2px;border-radius:50%;background:currentColor}
.yp svg.i-rep1,.yp svg.i-pause{display:none}
.yp .rep-one svg.i-rep{display:none}.yp .rep-one svg.i-rep1{display:block}
.yp-play{position:relative;display:grid;place-items:center;width:48px;height:48px;border-radius:999px;color:#fff;flex:none;
  background:var(--p-twill),var(--p-red);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.25),0 2px 0 rgba(150,22,30,.35),0 6px 14px rgba(224,53,63,.26);transition:transform 100ms var(--p-ease)}
.yp-play::after{content:"";position:absolute;inset:5px;border-radius:50%;border:2px dashed rgba(255,255,255,.62);pointer-events:none}
.yp-play:focus-visible{outline:3px solid var(--p-ink);outline-offset:3px;border-radius:50%}
.yp-play:active{transform:scale(.93)}
.yp-play svg.yp-ic{width:22px;height:22px}
.yp.is-playing .yp-play svg.i-play{display:none}.yp.is-playing .yp-play svg.i-pause{display:block}
.yp-tx{display:flex;align-items:center;gap:4px}

/* ---------- scrub: stitched waveform; the pin only shows on hover / drag / focus / touch ---------- */
.yp-scrub{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:10px;min-width:0}
.yp-t{font:600 11.5px/1 var(--p-mono);color:var(--p-ink3);font-variant-numeric:tabular-nums;min-width:4.4ch;letter-spacing:0}
.yp-t-rem{text-align:right}
.yp-wave{position:relative;height:38px;cursor:pointer;touch-action:none;--f:0;--lo:0;--hi:0;--bw:2.6px;-webkit-tap-highlight-color:transparent}
.yp-w{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}
.yp-w path{fill:none;stroke-width:var(--bw);stroke-linecap:round}
.yp-w .pt{stroke:rgba(255,255,255,.4);stroke-dasharray:1.2 2.3;stroke-linecap:butt}
.yp-w-u .pb{stroke:var(--p-wave)}
.yp-w-o{clip-path:inset(-4px calc((1 - var(--f)) * 100%) -4px 0)}
.yp-w-o .pb{stroke:var(--p-red)}
.yp-w-p{clip-path:inset(-4px calc((1 - var(--hi)) * 100%) -4px calc(var(--lo) * 100%));opacity:0;transition:opacity 120ms}
.yp-wave.is-ahead .yp-w-p .pb{stroke:rgba(214,47,56,.42)}
.yp-wave.is-back .yp-w-p .pb{stroke:#741219}
.yp-wave.is-hov .yp-w-p{opacity:1}
.yp-pin{position:absolute;top:-6px;bottom:-4px;left:0;width:0;transform:translateX(calc(var(--f) * var(--ww,0px)));pointer-events:none;opacity:0;transition:opacity 140ms}
.yp-pin::before{content:"";position:absolute;left:-1px;top:6px;bottom:0;width:2px;border-radius:1px;background:linear-gradient(90deg,#8d8888,#d9d5cf 60%,#a29d97)}
.yp-pin i{position:absolute;left:-7.5px;top:-1px;width:15px;height:15px;border-radius:50%;scale:.4;transition:scale 200ms var(--p-ease);
  background:radial-gradient(circle at 34% 30%,#ff9aa0 0,var(--p-red) 42%,var(--p-red-deep) 100%);box-shadow:0 1px 2px rgba(31,30,30,.35)}
.yp-wave:is(.is-hov,.is-drag,:focus-visible) .yp-pin{opacity:1}
.yp-wave:is(.is-hov,.is-drag,:focus-visible) .yp-pin i{scale:1}
.yp-wave.is-drag .yp-pin i{scale:1.18}
@media (hover:none){.yp-pin{opacity:1}.yp-pin i{scale:1}}
.yp-wave:focus-visible{outline:none}
.yp-wave:focus-visible .yp-pin i{box-shadow:0 0 0 3px #fff,0 0 0 5.5px var(--focus,var(--p-ink))}
.yp-tip{position:absolute;bottom:calc(100% + 10px);left:0;transform:translateX(-50%);padding:5px 7px;border-radius:7px;background:var(--p-ink);color:#fff;font:600 11.5px/1 var(--p-mono);pointer-events:none;white-space:nowrap;z-index:2}
.yp-tip[hidden]{display:none}
/* in the bar the tip would poke out of the shell's clip: it sits over the waveform instead */
.yp-bar .yp-tip{bottom:auto;top:-2px;transform:translate(-50%,-100%)}
.yp-bar .yp-wave{z-index:4}

/* ---------- volume: YouTube-style. The icon never moves; the slider unrolls to its right ---------- */
.yp-vol{position:relative;width:40px;height:40px;--v:.8;--lo:0;--hi:0}
.yp-vol::before{content:"";position:absolute;left:-2px;top:-1px;bottom:-1px;width:44px;border-radius:21px;background:var(--p-cotton2);opacity:0;transition:width 260ms var(--p-crit),opacity 160ms;pointer-events:none}
.yp-vol__btn{position:relative;z-index:1}
.yp-vol__btn svg.yp-ic{display:none}
.yp.vol-hi .yp-vol__btn svg.i-hi,.yp.vol-lo .yp-vol__btn svg.i-lo,.yp.vol-0 .yp-vol__btn svg.i-mute{display:block}
.yp-vol__pop{position:absolute;left:40px;top:0;bottom:0;width:104px;display:flex;align-items:center;padding:0 12px 0 4px;z-index:1;
  clip-path:inset(0 100% 0 0);transition:clip-path 260ms var(--p-crit);pointer-events:none}
.yp-vol:is(:hover,:focus-within,.is-open) .yp-vol__pop{clip-path:inset(-8px -4px -8px 0);pointer-events:auto}
.yp-vol:is(:hover,:focus-within,.is-open)::before{width:150px;opacity:1}
.yp-vol__track{position:relative;flex:1;height:30px;cursor:pointer;touch-action:none}
.yp-vol__track:focus-visible{outline:none}
.yp-vol__rail,.yp-vol__fill,.yp-vol__prev{position:absolute;left:0;top:50%;height:4px;margin-top:-2px;border-radius:3px;pointer-events:none}
.yp-vol__rail{right:0;background:rgba(31,30,30,.18)}
.yp-vol__fill{width:calc(var(--v) * 100%);background:var(--p-red)}
.yp-vol__prev{left:calc(var(--lo) * 100%);width:calc((var(--hi) - var(--lo)) * 100%);opacity:0;transition:opacity 120ms}
.yp-vol.is-ahead .yp-vol__prev{background:rgba(214,47,56,.42)}
.yp-vol.is-back .yp-vol__prev{background:#741219}
.yp-vol.is-hov .yp-vol__prev{opacity:1}
.yp-vol__pin{position:absolute;top:50%;left:calc(var(--v) * 100%);width:15px;height:15px;margin:-7.5px 0 0 -7.5px;border-radius:50%;pointer-events:none;opacity:0;scale:.4;transition:opacity 140ms,scale 200ms var(--p-ease);
  background:radial-gradient(circle at 34% 30%,#ff9aa0 0,var(--p-red) 42%,var(--p-red-deep) 100%);box-shadow:0 1px 2px rgba(31,30,30,.35)}
.yp-vol:is(.is-hov,.is-drag) .yp-vol__pin,.yp-vol__track:focus-visible .yp-vol__pin{opacity:1;scale:1}
.yp-vol__track:focus-visible .yp-vol__pin{box-shadow:0 0 0 3px #fff,0 0 0 5.5px var(--focus,var(--p-ink))}
.yp.vol-0 .yp-vol__fill{opacity:.3}
@media (hover:none){.yp-vol__pin{opacity:1;scale:1}}
.yp--ios .yp-vol__pop,.yp--ios .yp-vol::before{display:none}
.yp-vol--row{width:auto;display:flex;align-items:center;gap:6px}
.yp-vol--row::before{display:none}
.yp-vol--row .yp-vol__pop{position:static;width:auto;flex:1;max-width:260px;clip-path:none;pointer-events:auto;padding:0 6px}
.yp-vol--row .yp-vol__pin{opacity:1;scale:1}
/* i4 (owner: "the volume bar can always be shown"): the desktop bar keeps its slider out; the pin still shows on hover */
.yp-vol--bar{width:auto;display:flex;align-items:center;gap:2px}
.yp-vol--bar::before{display:none}
.yp-vol--bar .yp-vol__pop{position:static;width:92px;clip-path:none;pointer-events:auto;padding:0 6px 0 2px}
/* i7 · M4 (owner: "the ball that shows on hover gets cut off on the left side"): on hover the pop-out's clip
   (inset …0 on the left) outranked the bar's clip-path:none and cut the ball at 0% in half; the bar's slider is never
   clipped now, and it starts 9px in, so the 15px ball at 0% clears the mute button (the track keeps its length) */
.yp-vol--bar:is(:hover,:focus-within,.is-open) .yp-vol__pop,.yp-vol--bar .yp-vol__pop{clip-path:none;width:99px;padding-left:9px}
.yp--ios .yp-vol--bar .yp-vol__pop{display:none}
.yp-mute-l{display:none;font:800 13px/1 var(--p-disp)}
.yp--ios .yp-vol--row .yp-vol__btn{width:auto;padding:0 14px 0 10px;gap:8px;display:inline-flex;align-items:center;background:var(--p-cotton2)}
.yp--ios .yp-vol--row .yp-mute-l{display:inline}

/* ---------- touch: every control reaches 44px ---------- */
@media (pointer:coarse){
  .yp .yp-ib,.yp .yp-vol,.yp .yp-vol__btn{width:44px;height:44px}
  .yp .yp-vol--row{width:auto}
  .yp .yp-vol--row .yp-vol__btn{min-width:44px;width:auto}
  .yp .yp-vol__pop{left:44px}
  .yp .yp-vol__track{height:44px}
  .yp .yp-qg{width:44px}
  .yp .yp-qr{grid-template-columns:30px minmax(0,1fr) 44px} /* i7 · W1: the ✕ is a 44px target on touch */
}

/* ---------- who (title + where) ---------- */
.yp-who{display:flex;align-items:center;gap:12px;min-width:0;height:56px;padding:4px 12px 4px 10px;border-radius:16px;text-align:left;transition:background-color 160ms,transform 100ms var(--p-ease)}
@media (hover:hover){.yp-who:hover{background:var(--p-cotton2)}}
.yp-who:active{transform:scale(.98)}
.yp-who-t{display:grid;min-width:0;gap:4px}
.yp-who-name{font:800 15.5px/1.15 var(--p-disp);letter-spacing:-.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.yp-who-sub{font:600 12px/1.2 var(--p-disp);color:var(--p-ink3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis} /* i5 · MP2: the display face (narrower than mono): more of "from <Collection>" fits before the ellipsis */
.yp-who-sub:empty,.yp-qt small:empty,.yp-tip-sub:empty{display:none} /* i4: no filler ("Single"): a line shows only when it says something */
.yp-eq{display:inline-flex;align-items:flex-end;gap:2px;width:14px;height:13px;flex:none}
.yp-eq i{flex:1;height:100%;border-radius:1.5px;background:var(--p-red);transform-origin:50% 100%;transform:scaleY(.35)}
.yp.is-playing .yp-eq i{animation:yp-eq 820ms ease-in-out infinite alternate}
.yp.is-playing .yp-eq i:nth-child(2){animation-duration:640ms;animation-delay:-320ms}
.yp.is-playing .yp-eq i:nth-child(3){animation-duration:1040ms;animation-delay:-560ms}
@keyframes yp-eq{0%{transform:scaleY(.25)}55%{transform:scaleY(1)}100%{transform:scaleY(.5)}}

/* ---------- desktop bar ---------- */
/* i4: who · scrub · ⏮ ▶ ⏭ · volume (always out) · ⌃ · disc. The title starts 24px in, the panel's left column too. */
/* i5 · MP2: "from <Collection>" shows here too; the title column takes a bit more (up to 300px or 28% of the bar),
   the scrubber a bit less, and neither drops under its floor before the text ellipsises */
.yp-row--main{grid-template-columns:minmax(170px,min(300px,28%)) minmax(200px,1fr) auto auto 40px 66px;gap:10px;padding:0 0 0 14px}
.yp-row--main .yp-tx{gap:6px}
.yp-row--mini,.yp-row--tx,.yp-thread{display:none}
.yp-exp svg{transition:rotate 280ms var(--p-crit)}
.yp[data-view=panel] .yp-exp svg{rotate:180deg}

/* ---------- panel (desktop, i4): one grid, two columns, one top line ----------
   [ art | title · sub · meta · links ]   │ Up next ……… ⤨ ↻
   [ notes (rule above) …………………… ]   │ queue (scrolls)
   ─ ─ seam ─ ─  the bar (controls) below. The art is fixed (168px, top-left, never moves); the title starts on the
   art's top line, wraps to 2 lines (3 smaller ones when long) and clamps, so it can never climb above the art.
   The bar's title, the art and the notes share the left edge (24px); the queue's header sits on the art's top line. */
.yp-in{position:absolute;inset:0;min-height:0}
.yp--wide .yp-in{display:grid;grid-template-columns:minmax(0,1fr) minmax(300px,.8fr);grid-template-areas:"about queue";padding:24px 24px 18px 24px}
.yp-ph{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:40px}
.yp--wide .yp-ph{display:none} /* desktop: the bar's ⌃ (turned ⌄) and Esc close it; no "Now playing" eyebrow */
.yp-collapse{flex:none}
.yp-grab{display:none}
.yp-about{grid-area:about;display:flex;flex-direction:column;min-height:0;gap:18px;padding-right:28px}
.yp-hero{--art:168px;display:grid;grid-template-columns:var(--art) minmax(0,1fr);column-gap:22px;align-items:start}
.yp-art{display:block;width:var(--art);aspect-ratio:1;border-radius:18px;background:center/cover no-repeat var(--p-cotton2);
  outline:2px dashed rgba(255,255,255,.6);outline-offset:-7px;box-shadow:inset 0 0 0 1px rgba(0,0,0,.14),0 2px 0 rgba(31,30,30,.08),0 8px 18px rgba(31,30,30,.16)}
.yp-id{display:flex;flex-direction:column;align-items:flex-start;gap:8px;min-width:0}
.yp-title{margin:-4px 0 0;font:900 28px/1.1 var(--p-disp);letter-spacing:-.03em;overflow-wrap:anywhere;text-wrap:balance;
  display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;line-clamp:2;overflow:hidden;max-width:100%}
.yp-title.is-long{font-size:22px;line-height:1.14;letter-spacing:-.02em;-webkit-line-clamp:3;line-clamp:3;margin-top:-2px}
.yp-title:focus{outline:none}
.yp-title:focus-visible{outline:3px solid var(--focus,var(--p-ink))}
.yp-sub{margin:0;font:500 12.5px/1.35 var(--p-mono);color:var(--p-ink3)}
.yp-sub a{color:var(--p-ink2);text-decoration:underline;text-decoration-color:rgba(31,30,30,.3);text-underline-offset:3px;text-decoration-thickness:1.5px}
.yp-sub a:hover{color:var(--p-red-deep);text-decoration-color:currentColor}
.yp-meta:empty{display:none}
.yp-meta-fb{display:inline-flex;gap:8px;font:500 12px/1.2 var(--p-mono);color:var(--p-ink3)}
.yp-links{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.yp-lk{display:inline-grid;place-items:center;width:40px;height:40px;border-radius:50%;background:#fff;color:var(--p-ink);box-shadow:0 0 0 1px rgba(31,30,30,.12),0 1px 2px rgba(31,30,30,.1);text-decoration:none}
.yp-copy.is-done{color:var(--p-red-deep)}
.yp-copy-t{position:relative}
.yp-copied{position:absolute;left:50%;bottom:calc(100% + 8px);translate:-50% 0;padding:4px 8px;border-radius:7px;background:var(--p-ink);color:#fff;font:600 11px/1 var(--p-mono);white-space:nowrap;pointer-events:none}
.yp-copied[hidden]{display:none}
.yp-notes{min-height:0;overflow:auto;font-size:14.5px;line-height:1.55;color:var(--p-ink2);padding:14px 8px 6px 0;border-top:2px dashed var(--p-rule);mask-image:linear-gradient(#000 calc(100% - 14px),transparent)}
.yp-notes:empty{display:none}
.yp-notes p{margin:0 0 .65em}
.yp-notes .yp-from{font:800 11.5px/1.2 var(--p-disp);letter-spacing:.1em;text-transform:uppercase;color:var(--p-ink3);margin:0 0 .45em}
.yp-notes a{color:var(--p-red-deep);text-underline-offset:2px}
.yp-notes .yp-md-h{color:var(--p-ink)}
.yp-notes .yp-none{color:var(--p-ink3);font-style:italic}
/* ---------- i5 · MP3: the head in the opened item's grammar (LAYOUT-i5.md) + song vs collection notes ---------- */
.yp-id{position:relative}
.yp--v5 .yp-id{gap:10px}
.yp--v5.yp--wide .yp-title{padding-right:52px} /* room for the utility, always: the title never moves for it */
.yp-util:empty{display:none}
.yp--wide .yp-util{position:absolute;top:-6px;right:0;z-index:1}
.yp-util .yp-copied{bottom:auto;top:calc(100% + 8px)} /* below the button: above it would leave the shell's clip */
.yp--compact .yp-util{margin-left:auto;margin-right:4px;display:inline-grid;place-items:center}
.yp--compact .yp-util .ylinkicon{width:44px;height:44px;background:none;box-shadow:none;outline-color:transparent;color:var(--p-ink2)} /* the header's own icon buttons are plain */
.yp--v5 .yp-sub{font:600 13px/1.3 var(--p-disp);color:var(--p-ink2);margin-top:-2px}
.yp--v5 .yp-sub a{font-weight:800}
.yp-facts{display:flex;flex-wrap:wrap;align-items:center;gap:4px 16px;min-width:0}
.yp--compact .yp-facts{justify-content:center}
.yp--v5 .yp-links{gap:8px;margin-top:4px}
.yp--v5 .yp-links:empty{display:none}
/* divider (default): the collection's notes start on a labelled dashed seam; the song's own come first */
.yp-notes .yp-ncoll.is-after{margin-top:16px;padding-top:14px;border-top:2px dashed var(--p-rule)}
.yp-notes .yp-from b{font-weight:850;color:var(--p-ink2);letter-spacing:.06em}
/* tabs: two small segments, This song · The collection (one at a time) */
.yp-ntabs{display:inline-flex;gap:2px;padding:3px;margin:0 0 12px;border-radius:999px;background:var(--p-cotton2);box-shadow:inset 0 0 0 1px rgba(31,30,30,.08)}
.yp-ntabs [role=tab]{min-height:32px;padding:0 14px;border-radius:999px;font:800 12.5px/1 var(--p-disp);color:var(--p-ink3);transition:background-color 140ms,color 140ms}
.yp-ntabs [role=tab][aria-selected=true]{background:var(--p-knit),#fff;color:var(--p-ink);box-shadow:0 1px 0 rgba(31,30,30,.08),0 1px 4px rgba(31,30,30,.12)}
@media (hover:hover){.yp-ntabs [role=tab][aria-selected=false]:hover{color:var(--p-ink)}}
@media (pointer:coarse){.yp-ntabs [role=tab]{min-height:40px}}
.yp--compact .yp-notes.is-tabs{text-align:left}
.yp-np[hidden]{display:none}
.yp-big{display:none}
.yp-queue{grid-area:queue;min-height:0;display:flex;flex-direction:column;padding-left:28px;border-left:2px dashed var(--p-rule)}
.yp-qh{display:flex;align-items:center;gap:10px;padding:0 0 8px;min-height:40px}
.yp--wide .yp-qh{margin-top:-8px} /* "Up next" sits on the art's top line */
.yp-qh h3{margin:0;font:850 16px/1.1 var(--p-disp);letter-spacing:-.01em}
.yp-qc{font:500 11.5px/1 var(--p-mono);color:var(--p-ink3);margin-right:auto}
.yp-qtools{display:flex;gap:2px;margin-right:-4px}
.yp-qtools .yp-ib{width:36px;height:36px}.yp-qtools svg.yp-ic{width:18px;height:18px}
.yp-qwrap{min-height:0;overflow:auto;padding:4px 4px 8px;margin:0 -4px}
.yp-q{list-style:none;margin:0;padding:0;display:grid;gap:4px}
.yp-qr{--ysel-r:13px;--rope-w-in:3px;--rope-inset:2.5px;position:relative;display:grid;grid-template-columns:30px minmax(0,1fr);align-items:center;border-radius:13px}
.yp-qr{grid-template-columns:30px minmax(0,1fr) 34px} /* every row keeps the ✕'s column, so the durations line up with the playing row's */
/* i7 · W1: the row's ✕ (remove from the queue): quiet; with a mouse it shows on the row's hover / focus, on touch always */
.yp-qx{width:34px;height:34px;color:var(--p-ink3)}.yp-qx svg.yp-ic{width:15px;height:15px}
.yp-qx:hover{color:var(--p-ink);background:var(--p-cotton2)}
@media (hover:hover){.yp-qr .yp-qx{opacity:0;transition:opacity 140ms}.yp-qr:is(:hover,:focus-within) .yp-qx{opacity:1}}
.yp-qr.is-lift .yp-qx{opacity:0}
.yp-qr.is-now{background:var(--p-red-soft)}
.yp-qr.is-now.ysel{background:var(--p-knit),#fff;box-shadow:0 1px 0 rgba(31,30,30,.06),0 2px 6px rgba(31,30,30,.08)}
.yp-qr.is-lift{z-index:2;background:#fff;box-shadow:0 8px 20px rgba(31,30,30,.17);outline:1.5px dashed var(--p-line);outline-offset:-4px}
.yp-q.is-sorting .yp-qr:not(.is-lift){transition:transform 180ms var(--p-ease)}
.yp-qg{display:grid;place-items:center;width:30px;height:46px;border-radius:9px;color:var(--p-ink3);cursor:grab;touch-action:none}
.yp-qg:hover{color:var(--p-ink2)}
.yp-qg svg.yp-ic{width:16px;height:16px}
.yp-qnow{display:grid;place-items:center;width:30px;height:46px}
.yp-qm{display:grid;grid-template-columns:36px minmax(0,1fr) auto;gap:11px;align-items:center;min-height:50px;padding:5px 10px 5px 2px;text-align:left;border-radius:11px;transition:background-color 140ms,transform 100ms var(--p-ease)}
@media (hover:hover){.yp-qr:not(.is-now) .yp-qm:hover{background:var(--p-cotton2)}}
.yp-qm:active{transform:scale(.985)}
.yp-sw{display:block;flex:none;width:36px;height:36px;border-radius:9px;background:center/cover no-repeat var(--p-cotton2);box-shadow:inset 0 0 0 1px rgba(0,0,0,.12),0 1px 2px rgba(31,30,30,.18)}
/* i5: the playing row's bars, white on a dimmed swatch (Thoughts' playlist rows); still while paused */
.yp-sw--now{position:relative;display:grid;place-items:center}
.yp-sw--now::before{content:"";position:absolute;inset:0;border-radius:inherit;background:rgba(31,30,30,.42)}
.yp-sw--now .yp-eq{position:relative;width:14px;height:14px}
.yp-sw--now .yp-eq i{background:#fff}
.yp-qt{display:grid;min-width:0;gap:2px}
.yp-qt b{font:800 14px/1.2 var(--p-disp);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.yp-qt small{font:500 11.5px/1.25 var(--p-mono);color:var(--p-ink3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.yp-qr.is-now .yp-qt small{color:var(--p-red-deep)}
.yp-qd{font:500 11.5px/1 var(--p-mono);color:var(--p-ink3);font-variant-numeric:tabular-nums}
.yp-qe{padding:12px 4px;font:500 12px/1.4 var(--p-mono);color:var(--p-ink3)}

/* ---------- compact (mobile) ---------- */
.yp-scrim{position:fixed;inset:0;z-index:var(--z-scrim,79);background:rgba(31,30,30,.42);opacity:0;pointer-events:none;display:none}
.yp--compact .yp-scrim{display:block}
.yp--compact[data-view=panel] .yp-scrim{pointer-events:auto}
.yp--compact .yp-row--main{display:none}
/* i4 mini bar: who · ⏮ · ▶ · ⏭ · mute · disc, adding controls while they fit (the bar is its own container):
   < 300px who ▶ ⏭ · ≥ 300px + ⏮ · ≥ 356px + mute (phones: the volume is the hardware's, so a mute toggle) */
.yp--compact .yp-bar{container:ypbar/inline-size}
.yp--compact .yp-row--mini{display:grid;grid-template-columns:minmax(0,1fr) 46px 44px 60px;gap:0;padding:0 0 0 6px}
.yp-row--mini .yp-mprev,.yp-row--mini .yp-mmute{display:none}
@container ypbar (min-width:300px){.yp--compact .yp-row--mini{grid-template-columns:minmax(0,1fr) 44px 46px 44px 60px}.yp-row--mini .yp-mprev{display:grid}}
@container ypbar (min-width:356px){.yp--compact .yp-row--mini{grid-template-columns:minmax(0,1fr) 44px 46px 44px 44px 60px}.yp-row--mini .yp-mmute{display:grid}}
/* open: the controls row spans the whole sheet, ▶ on the centre line, every button inside the stitched outline
   (the disc steps out of the row while the page is open) */
.yp--compact .yp-row--tx{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));justify-items:center;padding:0 16px}
.yp--compact .yp-row--tx .yp-slot{display:none}
.yp--compact .yp-row--tx .yp-ib{width:44px;height:44px}
/* between the seam and the bottom stitch (6px in) there are 58px: the row sits there, ▶ 46px with 6px clear of both
   (i3's page reaches the screen's bottom edge; on a phone with a home bar the safe area adds its height below) */
.yp--compact .yp-row--tx{bottom:6px}
.yp--compact .yp-row--tx .yp-play{width:46px;height:46px}
.yp--compact .yp-row--tx .yp-play svg.yp-ic{width:24px;height:24px}
.yp--compact .yp-row--mini .yp-play{width:44px;height:44px}
.yp--compact .yp-row--mini .yp-play svg.yp-ic{width:20px;height:20px}
.yp--compact .yp-row--mini .yp-ib{width:44px;height:44px}
.yp--compact .yp-who{height:52px;padding:4px 8px}
.yp--compact .yp-who-name{font-size:14.5px}
.yp--compact .yp-thread{display:block;position:absolute;left:18px;right:74px;bottom:5px;height:3px;border-radius:2px;background:rgba(31,30,30,.1);pointer-events:none}
.yp-thread i{display:block;height:100%;border-radius:2px;transform-origin:0 50%;transform:scaleX(var(--f,0));
  background:linear-gradient(180deg,rgba(255,255,255,.35),transparent 60%),repeating-linear-gradient(62deg,var(--p-red) 0 3px,var(--p-red-deep) 3px 4.5px,var(--p-red) 4.5px 6px)}
.yp--compact .yp-in{display:flex;flex-direction:column;overflow:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;padding:0 20px 28px}
.yp--compact .yp-in>*,.yp--compact .yp-about>*{flex:none}
.yp--compact .yp-grab{display:flex;justify-content:center;padding:9px 0 2px;touch-action:none;cursor:grab;position:sticky;top:0;z-index:4;margin:0 -20px;background:var(--p-knit),#fff}
.yp-grab span{width:42px;height:5px;border-radius:3px;background:var(--p-line)}
/* header: ⌄ (left) · mute (right); no eyebrow text */
.yp--compact .yp-ph{touch-action:none;display:flex;justify-content:space-between;margin:0 -20px;padding:0 12px 4px;position:sticky;top:16px;z-index:4;background:var(--p-knit),#fff}
.yp-hmute{display:none}
.yp--compact .yp-hmute{display:inline-grid}
.yp--compact .yp-about{display:contents}
/* i4 order: art + song data + notes · rule · controls (scrub; the transport row is pinned below) · queue */
.yp--compact .yp-hero{grid-template-columns:1fr;justify-items:center;text-align:center;row-gap:16px;margin-top:4px}
.yp--compact .yp-art{width:min(54vw,220px,30vh);border-radius:22px;outline-offset:-8px}
.yp--compact .yp-id{align-items:center}
.yp--compact .yp-title{font-size:26px;margin:0;-webkit-line-clamp:3;line-clamp:3}
.yp--compact .yp-title.is-long{font-size:22px}
.yp--compact .yp-links{justify-content:center}
.yp--compact .yp-notes{overflow:visible;mask-image:none;margin-top:18px;padding:0;border-top:0}
.yp--compact .yp-big{display:grid;gap:12px;margin-top:22px;padding-top:20px;border-top:2px dashed var(--p-rule)}
.yp-scrub--big{grid-template-columns:1fr 1fr;grid-template-areas:"w w" "a b";row-gap:8px}
.yp-scrub--big .yp-wave{grid-area:w;height:52px;--bw:3px}
.yp-scrub--big .yp-t-el{grid-area:a}.yp-scrub--big .yp-t-rem{grid-area:b}
.yp--compact .yp-queue{margin-top:24px;padding:18px 0 0;border-left:0;border-top:2px dashed var(--p-rule)}
.yp--compact .yp-qwrap{overflow:visible}
.yp--compact .yp-qtools{display:none}

/* ---------- frozen swipe (review only: ?pdrag=…) ---------- */
.yp-ghost{position:fixed;inset:0;z-index:var(--z-toast,90);pointer-events:none}
.yp-ghost svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.yp-ghost .f{position:absolute;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;background:rgba(255,255,255,.55);box-shadow:0 0 0 2px rgba(31,30,30,.55),0 6px 14px rgba(31,30,30,.25)}
.yp-ghost .l{position:absolute;padding:5px 9px;border-radius:999px;background:var(--p-ink);color:#fff;font:700 12px/1 var(--p-mono);white-space:nowrap;translate:-50% 0}

/* == i6 · music · M7 · an ongoing song (?pwip=tag|seam|off; .yp.is-wip) ============================================
   tag   the bar: the cards' condensed ongoing badge (red twill tape, notched end, white running stitch, the needle)
         after the title · the panel: a woven "Ongoing" label sewn across the art's lower-left edge · the disc: a red
         felt pin on its rim (disc view only)
   seam  the shell's own stitching runs red and stops short at a needle on the top edge, its thread trailing back into
         the last stitch (bar + panel; a strip of the shell's cloth covers the unsewn stretch) · the needle through the
         disc's rim · the bar's line ends in "ongoing" */
.yp-who-l{display:flex;align-items:center;gap:7px;min-width:0}
.yp-who-l>.yp-who-name{min-width:0}
.yp-wipt,.yp-wipl,.yp-wipd{display:none}
.yp-ndl{display:block;width:100%;height:100%}
.yp-wipt{position:relative;flex:none;place-items:center;width:27px;height:17px;padding-right:4px;color:#fff;
  background:var(--p-twill),var(--p-red);clip-path:polygon(0 0,100% 0,calc(100% - 5px) 50%,100% 100%,0 100%)}
.yp-wipt::after{content:"";position:absolute;left:2px;right:4px;top:2px;bottom:2px;border-top:1px dashed rgba(255,255,255,.62);border-bottom:1px dashed rgba(255,255,255,.62);pointer-events:none}
.yp-wipt .yp-ndl{width:11px;height:11px}
.yp.is-wip[data-pwip=tag] .yp-wipt{display:inline-grid}
.yp-art{position:relative}
.yp.is-wip[data-pwip=tag] .yp-wipl{position:absolute;left:-7px;bottom:16px;display:inline-flex;align-items:center;gap:6px;height:24px;padding:0 14px 0 9px;
  color:#fff;font:800 12px/1 var(--p-disp);letter-spacing:.01em;background:var(--p-twill),var(--p-red);
  clip-path:polygon(0 0,100% 0,calc(100% - 7px) 50%,100% 100%,0 100%)}
.yp-wipl::after{content:"";position:absolute;left:3px;right:6px;top:3px;bottom:3px;border-top:1px dashed rgba(255,255,255,.62);border-bottom:1px dashed rgba(255,255,255,.62);pointer-events:none}
.yp-wipl .yp-ndl{width:13px;height:13px}
.yp--compact .yp-wipl{bottom:18px}
.yp.is-wip .yp-wipd{position:absolute;display:grid;place-items:center;pointer-events:none;opacity:0;scale:.6;transition:opacity 160ms,scale 260ms var(--p-crit)}
.yp.is-wip[data-view=disc] .yp-wipd{opacity:1;scale:1}
.yp-wipd:not(.yp-wipd--n){left:-6px;top:-6px;width:22px;height:22px;border-radius:50%;color:#fff;
  background:radial-gradient(circle at 34% 28%,rgba(255,255,255,.34),transparent 56%),var(--p-twill),var(--p-red);
  box-shadow:0 0 0 2px #fff,0 2px 5px rgba(31,30,30,.3)}
.yp-wipd:not(.yp-wipd--n) .yp-ndl{width:12px;height:12px}
.yp-wipd--n{z-index:2;left:-26px;top:-8px;width:64px;height:16px;rotate:-34deg}
.yp-wipd--n .yp-wipn{width:100%;height:100%;overflow:visible}
.yp.is-wip[data-pwip=seam] .yp-stitch{border-color:rgba(214,47,56,.6)}
.yp-stitch>.yp-wipn{display:none}
/* the needle sits left of the disc's slot (the bar's right end) and of the panel's queue tools */
.yp.is-wip[data-pwip=seam] .yp-stitch>.yp-wipn{display:block;position:absolute;right:104px;top:-7px;width:64px;height:16px;overflow:visible}
.yp.is-wip[data-pwip=seam] .yp-stitch::before{content:"";position:absolute;right:58px;top:-5px;width:78px;height:8px;background:var(--p-knit),#fff}
.yp-wips{font-style:normal;font-weight:800;color:var(--p-red-deep)}
.yp--rm .yp-wipd{transition:opacity 120ms}
/* == i7 · music · M3 · pwip=wip (the default; owner: "really i just want to say WIP … maybe a hammer … instead of red
   should be something else"): one plain mark, a gold label with a hammer and "WIP" in ink (7.2:1), no stitching.
   bar: after the title · disc: a gold pin with the hammer on its rim · (i7 follow-up: none on the art, owner: "remove the
   wip from the music icon"; the panel's facts say WIP) ============================================================ */
.yp{--p-gold:var(--gold,#d9a21b)}
.yp-wipw{display:none}
.yp-ham{display:block;width:12px;height:12px;flex:none}
.yp-wipw{align-items:center;gap:4px;flex:none;height:18px;padding:0 7px 0 5px;border-radius:6px;color:var(--p-ink);background:var(--p-gold);font:900 10.5px/1 var(--p-disp);letter-spacing:.06em;white-space:nowrap}
.yp.is-wip[data-pwip=wip] .yp-wipw{display:inline-flex}
/* phones (the compact bar): the title keeps its room, the mark leads the second line instead ("WIP from Revealed") */
.yp-who-sl{display:flex;align-items:center;gap:6px;min-width:0}
.yp-who-sl>.yp-who-sub{min-width:0}
.yp-who-sl:has(>.yp-who-sub:empty){display:none}
.yp--compact.is-wip[data-pwip=wip] .yp-who-sl{display:flex}
.yp.is-wip[data-pwip=wip] .yp-wipw--s,.yp--compact.is-wip[data-pwip=wip] .yp-who-l>.yp-wipw{display:none}
.yp--compact.is-wip[data-pwip=wip] .yp-wipw--s{display:inline-flex;height:15px;padding:0 5px 0 4px;gap:3px;border-radius:5px;font-size:9.5px}
.yp-wipw--s .yp-ham{width:10px;height:10px}
i.yp-ham{display:grid;place-items:center;font-size:12px;line-height:1}.yp-wipw--s i.yp-ham{font-size:10px}
/* ?pwipc=gold: an ongoing song turns the player's red WIP gold (play, the long-press play, the progress ring, the
   scrub, volume, the eq bars, toggles, the queue's now-row). Gold is light, so what sits on it turns ink (white on
   gold < 3:1); the deep shade (#8a5f0c) carries text and the pressed hover, like --red-deep does. */
.yp.is-wip[data-pwipc=gold]{--p-red:var(--p-gold);--p-red-deep:var(--gold-deep,#8a5f0c);--p-red-soft:var(--gold-soft,#f8ecc8)}
/* the queue's now-row rope too (the kit's --tex-rope resolves its colours on :root, so it's re-declared here in gold) */
.yp.is-wip[data-pwipc=gold]{--tex-rope:linear-gradient(180deg,rgba(255,255,255,.35),transparent 45%,rgba(0,0,0,.22)),repeating-linear-gradient(62deg,var(--p-gold) 0 4px,#b07c10 4px 6.5px,var(--p-gold) 6.5px 9px)}
.yp.is-wip[data-pwipc=gold] :is(.yp-play,.yp-act--play){color:var(--p-ink);background:var(--p-gold);box-shadow:inset 0 1px 0 rgba(255,255,255,.3),0 2px 0 rgba(120,80,0,.35),0 6px 14px rgba(217,162,27,.32)}
.yp.is-wip[data-pwipc=gold] .yp-play::after{border-color:rgba(31,30,30,.38)}
.yp.is-wip[data-pwipc=gold] .yp-wave.is-ahead .yp-w-p .pb{stroke:rgba(217,162,27,.45)}
.yp.is-wip[data-pwipc=gold] .yp-vol.is-ahead .yp-vol__prev{background:rgba(217,162,27,.45)}
.yp .yp-wipd.yp-wipd--w{left:-6px;top:-6px;width:22px;height:22px;border-radius:50%;color:var(--p-ink);background:var(--p-gold);box-shadow:0 0 0 2px #fff,0 2px 5px rgba(31,30,30,.3)}

/* ---------- reduced motion ---------- */
.yp--rm .ydisc__rec{animation:none}
.yp--rm .yp-eq i,.yp--rm.is-playing .yp-eq i{animation:none;transform:scaleY(.7)}
@media (prefers-reduced-motion:reduce){.ydisc__rec{animation:none}.yp.is-playing .yp-eq i{animation:none;transform:scaleY(.7)}}
@media (prefers-contrast:more){.yp{--p-line:rgba(31,30,30,.6);--p-ink3:#3d3939}}
/* i8 · DK · dark theme (kit/dark.css): the WIP mark is ink on gold, as everywhere */
html[data-theme="dark"] .yp-wipw{color:var(--yd-thread,#1f1e1e)}
`;

  /* ============================================================
     MARKUP
     ============================================================ */
  const TX = (big) => `
      ${big ? `<button class="yp-ib yp-tg" type="button" data-act="shuffle" aria-pressed="false" aria-label="Shuffle">${icon("shuffle")}</button>` : ""}
      <button class="yp-ib" type="button" data-act="prev" aria-label="Previous track">${icon("prev")}</button>
      <button class="yp-play" type="button" data-act="play" aria-label="Play">${icon("play", "i-play")}${icon("pause", "i-pause")}</button>
      <button class="yp-ib" type="button" data-act="next" aria-label="Next track">${icon("next")}</button>
      ${big ? `<button class="yp-ib yp-tg" type="button" data-act="repeat" aria-pressed="false" aria-label="Repeat: off">${icon("repeat", "i-rep")}${icon("repeat1", "i-rep1")}</button>` : ""}`;
  const MUTE_IC = () => `${icon("volHi", "i-hi")}${icon("volLo", "i-lo")}${icon("mute", "i-mute")}`;
  const VOL = (mod) => `<div class="yp-vol${mod ? " yp-vol--" + mod : ""}" data-vol>
      <button class="yp-ib yp-vol__btn" type="button" data-act="mute" aria-pressed="false" aria-label="Mute">${icon("volHi", "i-hi")}${icon("volLo", "i-lo")}${icon("mute", "i-mute")}<span class="yp-mute-l">Mute</span></button>
      <div class="yp-vol__pop"><div class="yp-vol__track" role="slider" tabindex="0" aria-label="Volume" aria-valuemin="0" aria-valuemax="100" aria-valuenow="80" aria-valuetext="80%">
        <span class="yp-vol__rail"></span><span class="yp-vol__fill"></span><span class="yp-vol__prev"></span><span class="yp-vol__pin"></span></div></div>
    </div>`;
  // i6 · M7: a sewing needle (the ongoing glyph, drawn here: the player works without Phosphor) · the long one the
  // seam variant lays along its stitching, its red thread trailing back into the last stitch
  const NEEDLE = '<svg class="yp-ndl" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 13 11.1 4.9" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><path d="M10.4 3.4a2.1 2.1 0 0 1 3 3l-1.1 1.1-3-3Z" fill="currentColor"/><path d="M11.2 4.6l.9.9" stroke="var(--p-red,#d62f38)" stroke-width="1" stroke-linecap="round"/></svg>';
  const NEEDLE_L = '<svg class="yp-wipn" viewBox="0 0 64 16" aria-hidden="true">' +
    '<path d="M34 8.2c-6 0-9.6-5.6-16.4-4.2C11.8 5.2 9.8 11 2.6 9.2" fill="none" stroke="#d62f38" stroke-width="1.7" stroke-linecap="round"/>' +
    '<path d="M62.6 8 40 6.6H33.4a1.4 1.4 0 0 0 0 2.8H40Z" fill="#aaa39b" stroke="rgba(31,30,30,.5)" stroke-width=".6" stroke-linejoin="round"/>' +
    '<path d="M33.6 7.3H40l18 1" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width=".7" stroke-linecap="round"/>' +
    '<rect x="34.4" y="7.4" width="4.4" height="1.2" rx=".6" fill="#fff" stroke="rgba(31,30,30,.4)" stroke-width=".4"/></svg>';
  // i7 · M3: a hammer (handle lower-left → head upper-right), drawn for the WIP mark
  const HAMMER = '<svg class="yp-ham" viewBox="0 0 16 16" aria-hidden="true"><path d="M2.8 13.2 9.4 6.6" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"/><path d="M8.7 1.2 14.8 7.3 12.5 9.6 6.4 3.5Z" fill="currentColor" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>';
  // (i7: with Phosphor on the page it's the kit's own ph-hammer, the same glyph as the WIP fact disc on every card)
  const HAM = () => (hasPhosphor() ? '<i class="ph-bold ph-hammer yp-ham" aria-hidden="true"></i>' : HAMMER);
  const WIPM = (cls) => `<span class="${cls}" aria-hidden="true">${HAM()}<b>WIP</b></span>`;
  const WHO = (act, label) => `<button class="yp-who" type="button" data-act="${act}" aria-expanded="false" aria-controls="yp-panel" aria-label="${label}"><span class="yp-who-t"><span class="yp-who-l"><b class="yp-who-name"></b><span class="yp-wipt" aria-hidden="true">${NEEDLE}</span>${PWIP === "wip" ? WIPM("yp-wipw") : ""}</span>${PWIP === "wip" ? `<span class="yp-who-sl">${WIPM("yp-wipw yp-wipw--s")}<span class="yp-who-sub"></span></span>` : '<span class="yp-who-sub"></span>'}</span></button>`;
  const TPL = `
  <div class="yp" data-empty data-view="bar" data-pwip="${PWIP}" data-pwipc="${PWIPC}" role="region" aria-label="Music player">
    <div class="yp-scrim" aria-hidden="true"></div>
    <div class="yp-float">
      <div class="yp-shade" aria-hidden="true"></div>
      <div class="yp-shell">
        <div class="yp-panel" id="yp-panel" role="group" aria-label="Now playing and queue" inert>
          <div class="yp-in">
            <div class="yp-grab" aria-hidden="true"><span></span></div>
            <header class="yp-ph">
              <button class="yp-ib yp-collapse" type="button" data-act="collapse" aria-label="Collapse to the bar">${icon("down")}</button>
              <button class="yp-ib yp-vol__btn yp-hmute" type="button" data-act="mute" aria-pressed="false" aria-label="Mute">${MUTE_IC()}</button>
            </header>
            <section class="yp-about" aria-label="About this track">
              <div class="yp-hero">
                <span class="yp-art" aria-hidden="true"></span>
                <div class="yp-id">
                  <div class="yp-util"></div>
                  <h2 class="yp-title" tabindex="-1"></h2>
                  <p class="yp-sub"></p>
                  <div class="yp-meta"></div>
                  <div class="yp-links"></div>
                </div>
              </div>
              <div class="yp-notes"></div>
              <div class="yp-big">
                <div class="yp-scrub yp-scrub--big"></div>
              </div>
            </section>
            <section class="yp-queue" aria-labelledby="yp-qh">
              <div class="yp-qh"><h3 id="yp-qh">Up next</h3><span class="yp-qc"></span>
                <span class="yp-qtools"><button class="yp-ib yp-tg" type="button" data-act="shuffle" aria-pressed="false" aria-label="Shuffle">${icon("shuffle")}</button><button class="yp-ib yp-tg" type="button" data-act="repeat" aria-pressed="false" aria-label="Repeat: off">${icon("repeat", "i-rep")}${icon("repeat1", "i-rep1")}</button></span></div>
              <div class="yp-qwrap"><ol class="yp-q"></ol></div>
            </section>
          </div>
        </div>
        <div class="yp-seam" aria-hidden="true"></div>
        <div class="yp-bar">
          <div class="yp-row yp-row--main">
            ${WHO("expand", "Show details and queue")}
            <div class="yp-scrub yp-scrub--bar"></div>
            <div class="yp-tx">${TX(false)}</div>
            ${VOL("bar")}
            <button class="yp-ib yp-exp" type="button" data-act="expand" aria-expanded="false" aria-controls="yp-panel" aria-label="Show details and queue">${icon("up")}</button>
            <span class="yp-slot" aria-hidden="true"></span>
          </div>
          <div class="yp-row yp-row--mini">
            ${WHO("expand", "Open the full player")}
            <button class="yp-ib yp-mprev" type="button" data-act="prev" aria-label="Previous track">${icon("prev")}</button>
            <button class="yp-play" type="button" data-act="play" aria-label="Play">${icon("play", "i-play")}${icon("pause", "i-pause")}</button>
            <button class="yp-ib" type="button" data-act="next" aria-label="Next track">${icon("next")}</button>
            <button class="yp-ib yp-vol__btn yp-mmute" type="button" data-act="mute" aria-pressed="false" aria-label="Mute">${MUTE_IC()}</button>
            <span class="yp-slot" aria-hidden="true"></span>
            <span class="yp-thread" aria-hidden="true"><i></i></span>
          </div>
          <div class="yp-row yp-row--tx">${TX(true)}<span class="yp-slot" aria-hidden="true"></span></div>
        </div>
        <div class="yp-stitch" aria-hidden="true">${PWIP === "seam" ? NEEDLE_L : ""}</div>
      </div>
    </div>
    <button class="yp-disc" type="button" data-act="disc" aria-expanded="true" aria-controls="yp-panel" aria-label="Minimize the player">
      <svg class="yp-disc__ring" viewBox="0 0 74 74" aria-hidden="true"><circle class="r0" cx="37" cy="37" r="35"/><circle class="r1" cx="37" cy="37" r="35" pathLength="100" stroke-dasharray="0 100"/></svg>
      <span class="ydisc__rec yp-disc__rec" aria-hidden="true"><span class="ydisc__label"></span></span>
      <span class="yp-disc__tip" aria-hidden="true"><b class="yp-tip-name"></b><small class="yp-tip-sub"></small></span>
      ${PWIP === "wip" ? `<span class="yp-wipd yp-wipd--w" aria-hidden="true">${HAM()}</span>` : PWIP === "tag" ? `<span class="yp-wipd" aria-hidden="true">${NEEDLE}</span>` : PWIP === "seam" ? `<span class="yp-wipd yp-wipd--n" aria-hidden="true">${NEEDLE_L}</span>` : ""}
    </button>
    ${DISC_LONG === "actions" ? `<div class="yp-acts" role="toolbar" aria-label="Quick controls">
      <button class="yp-act yp-act--play" type="button" data-act="play" aria-label="Play">${icon("play", "i-play")}${icon("pause", "i-pause")}</button>
      <button class="yp-act yp-vol__btn" type="button" data-act="mute" aria-pressed="false" aria-label="Mute">${MUTE_IC()}</button>
      <button class="yp-act" type="button" data-act="next" aria-label="Next track">${icon("next")}</button>
    </div>` : ""}
    <span class="yp-safe"></span><span class="yp-safet"></span><span class="yp-navp"></span>
    <div class="yp-sr" aria-live="polite"></div>
  </div>`;

  /* ---------- seek bar ---------- */
  class Scrub {
    constructor(el, big) {
      this.el = el; this.big = big; this.drag = false; this.w = 0; this.h = null;
      el.innerHTML =
        `<span class="yp-t yp-t-el">0:00</span>` +
        `<div class="yp-wave" role="slider" tabindex="0" aria-label="Seek" aria-valuemin="0" aria-valuemax="0" aria-valuenow="0" aria-valuetext="0:00 of 0:00">` +
        `<svg class="yp-w yp-w-u" aria-hidden="true"><path class="pb"/><path class="pt"/></svg>` +
        `<svg class="yp-w yp-w-o" aria-hidden="true"><path class="pb"/><path class="pt"/></svg>` +
        `<svg class="yp-w yp-w-p" aria-hidden="true"><path class="pb"/></svg>` +
        `<span class="yp-pin" aria-hidden="true"><i></i></span><span class="yp-tip" hidden></span></div>` +
        `<span class="yp-t yp-t-rem">-0:00</span>`;
      this.wave = el.querySelector(".yp-wave");
      this.tEl = el.querySelector(".yp-t-el"); this.tRem = el.querySelector(".yp-t-rem"); this.tip = el.querySelector(".yp-tip");
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
    paint(time, dur) { if (!this.drag) this.show(time, dur); }
    show(time, dur) {
      this.f = dur ? clamp(time / dur, 0, 1) : 0;
      this.wave.style.setProperty("--f", this.f.toFixed(4));
      this.tEl.textContent = fmt(time);
      this.tRem.textContent = "-" + fmt(Math.max(0, dur - time));
      if (this.h != null) this.preview(this.h);
    }
    // hover preview: lighter thread ahead of the pin, darker over what you'd skip back
    preview(h) {
      this.h = h;
      const w = this.wave;
      if (h == null) { w.classList.remove("is-hov", "is-ahead", "is-back"); return; }
      const f = this.f || 0;
      w.style.setProperty("--lo", Math.min(f, h).toFixed(4));
      w.style.setProperty("--hi", Math.max(f, h).toFixed(4));
      w.classList.add("is-hov");
      w.classList.toggle("is-ahead", h >= f);
      w.classList.toggle("is-back", h < f);
    }
    showTip(frac) {
      this.tip.hidden = false;
      this.tip.style.left = (frac * (this.w || this.wave.clientWidth)) + "px";
      this.tip.textContent = fmt(frac * (S.duration || 0));
    }
    aria(time, dur) {
      const w = this.wave;
      w.setAttribute("aria-valuemax", String(Math.round(dur)));
      w.setAttribute("aria-valuenow", String(Math.floor(time)));
      w.setAttribute("aria-valuetext", `${fmt(time)} of ${fmt(dur)}`);
    }
    frac(x) { const r = this.wave.getBoundingClientRect(); return clamp((x - r.left) / (r.width || 1), 0, 1); }
    bind() {
      const w = this.wave;
      w.addEventListener("pointerdown", (e) => {
        if (!S.track || e.button > 0) return;
        e.preventDefault(); e.stopPropagation();
        w.setPointerCapture(e.pointerId);
        this.drag = true; w.classList.add("is-drag");
        this.dt = this.frac(e.clientX) * (S.duration || 0); this.show(this.dt, S.duration);
        if (e.pointerType !== "mouse") this.showTip(this.frac(e.clientX));
        w.focus({ preventScroll: true });
      });
      w.addEventListener("pointermove", (e) => {
        const fr = this.frac(e.clientX);
        if (this.drag) { this.dt = fr * (S.duration || 0); this.show(this.dt, S.duration); if (e.pointerType !== "mouse") this.showTip(fr); }
        if (e.pointerType === "mouse" && S.track) { this.showTip(fr); if (!this.drag) this.preview(fr); }
      });
      const end = () => {
        if (!this.drag) return;
        this.drag = false; w.classList.remove("is-drag");
        if (!w.matches(":hover")) this.tip.hidden = true;
        seek(this.dt);
      };
      w.addEventListener("pointerup", end);
      w.addEventListener("pointercancel", end);
      w.addEventListener("pointerleave", () => { if (this.drag) return; this.tip.hidden = true; this.preview(null); });
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

  /* ---------- volume (custom slider so it gets the same pin + preview as the scrub) ---------- */
  class Vol {
    constructor(el) {
      this.el = el; this.track = el.querySelector(".yp-vol__track"); this.drag = false; this.h = null;
      const t = this.track;
      const fr = (x) => { const r = t.getBoundingClientRect(); return clamp((x - r.left) / (r.width || 1), 0, 1); };
      t.addEventListener("pointerdown", (e) => {
        if (e.button > 0) return;
        e.preventDefault(); e.stopPropagation();
        t.setPointerCapture(e.pointerId);
        this.drag = true; el.classList.add("is-drag", "is-open");
        setVolume(fr(e.clientX));
        t.focus({ preventScroll: true });
      });
      t.addEventListener("pointermove", (e) => {
        if (this.drag) { setVolume(fr(e.clientX)); return; }
        if (e.pointerType === "mouse") this.preview(fr(e.clientX));
      });
      const end = () => { if (!this.drag) return; this.drag = false; el.classList.remove("is-drag"); if (!el.matches(":hover")) el.classList.remove("is-open"); };
      t.addEventListener("pointerup", end);
      t.addEventListener("pointercancel", end);
      t.addEventListener("pointerleave", () => this.preview(null));
      el.addEventListener("pointerleave", () => { if (!this.drag) el.classList.remove("is-open"); });
      t.addEventListener("keydown", (e) => {
        const map = { ArrowRight: 0.05, ArrowUp: 0.05, ArrowLeft: -0.05, ArrowDown: -0.05, PageUp: 0.2, PageDown: -0.2 };
        let to = null;
        const cur = S.muted ? 0 : S.volume;
        if (e.key in map) to = cur + map[e.key];
        else if (e.key === "Home") to = 0;
        else if (e.key === "End") to = 1;
        if (to == null) return;
        e.preventDefault(); setVolume(clamp(to, 0, 1));
      });
    }
    preview(h) {
      this.h = h;
      const el = this.el;
      if (h == null) { el.classList.remove("is-hov", "is-ahead", "is-back"); return; }
      const v = S.muted ? 0 : S.volume;
      el.style.setProperty("--lo", Math.min(v, h).toFixed(3));
      el.style.setProperty("--hi", Math.max(v, h).toFixed(3));
      el.classList.add("is-hov");
      el.classList.toggle("is-ahead", h >= v);
      el.classList.toggle("is-back", h < v);
    }
    paint() {
      const v = S.muted ? 0 : S.volume, pct = Math.round(S.volume * 100);
      this.el.style.setProperty("--v", v.toFixed(3));
      this.track.setAttribute("aria-valuenow", String(S.muted ? 0 : pct));
      this.track.setAttribute("aria-valuetext", S.muted ? `Muted (${pct}%)` : `${pct}%`);
      if (this.h != null) this.preview(this.h);
    }
  }

  /* ============================================================
     ELEMENT
     ============================================================ */
  const VIEW_RANK = { disc: 0, bar: 1, panel: 2 };
  // phones: the slot's height and gaps = kit/yarn.css "BOTTOM CHROME" (--yslot-h, --yslot-gap). Where the slot sits
  // is never hard-coded: it comes from the nav (--nav-bottom → --yslot-b), read live through .yp-navp.
  const SLOT_H = 64, SLOT_GAP = 8;
  // the slot protocol (Yarn.slot in the kit; spoken here too so the player works without the kit)
  const slotOwner = () => document.documentElement.dataset.yslot || "";
  function slotSet(owner, on) {
    if (window.Yarn?.slot) return on ? window.Yarn.slot.claim(owner) : window.Yarn.slot.release(owner);
    const de = document.documentElement;
    if (on ? de.dataset.yslot === owner : de.dataset.yslot !== owner) return;
    if (on) de.dataset.yslot = owner; else delete de.dataset.yslot;
    dispatchEvent(new CustomEvent("yarn:slot", { detail: { owner: on ? owner : "" } }));
  }
  class YarnPlayerEl extends HTMLElement {
    connectedCallback() {
      // i6 · mobile (B2): the player lives on the kit's floating layer (Yarn.layer(): its own stacking context above the
      // page, so nothing in the page paints over the disc / bar / panel); without the kit, straight under <body> as before
      const home = window.Yarn?.layer?.() || document.body;
      if (home && this.parentNode !== home) { queueMicrotask(() => home.appendChild(this)); return; }
      if (EL && EL !== this) { this.remove(); return; }
      if (this.$) { this.relayout(); return; }
      EL = this;
      if (!document.getElementById("yp-css")) { const st = document.createElement("style"); st.id = "yp-css"; st.textContent = CSS; document.head.appendChild(st); window.YarnTheme?.after(st, "player"); } // i8 · DK: its dark copy right after it
      this.innerHTML = TPL;
      const q = (s) => this.querySelector(s), qa = (s) => [...this.querySelectorAll(s)];
      this.$ = {
        root: q(".yp"), float: q(".yp-float"), shade: q(".yp-shade"), shell: q(".yp-shell"), panel: q(".yp-panel"), pin: q(".yp-in"), bar: q(".yp-bar"), seam: q(".yp-seam"), stitch: q(".yp-stitch"),
        main: q(".yp-row--main"), mini: q(".yp-row--mini"), tx: q(".yp-row--tx"), scrim: q(".yp-scrim"), disc: q(".yp-disc"), discLabel: q(".yp-disc .ydisc__label"), ring: q(".yp-disc__ring .r1"),
        tipName: q(".yp-tip-name"), tipSub: q(".yp-tip-sub"), grab: q(".yp-grab"), ph: q(".yp-ph"),
        title: q(".yp-title"), sub: q(".yp-sub"), meta: q(".yp-meta"), links: q(".yp-links"), notes: q(".yp-notes"), art: q(".yp-art"),
        q: q(".yp-q"), qc: q(".yp-qc"), live: q("[aria-live]"), safe: q(".yp-safe"), safeT: q(".yp-safet"), navp: q(".yp-navp"), thread: q(".yp-thread"),
        whos: qa(".yp-who"), exps: qa("[data-act=expand]"), collapseBtn: q(".yp-collapse"), expBtn: q(".yp-exp"),
        acts: q(".yp-acts"), util: q(".yp-util"), id: q(".yp-id"), hmute: q(".yp-hmute"),
      };
      this.appendChild(audio);
      this.scrubs = [new Scrub(q(".yp-scrub--bar"), false), new Scrub(q(".yp-scrub--big"), true)];
      this.vols = qa("[data-vol]").map((el) => new Vol(el));
      if (IOS) this.$.root.classList.add("yp--ios");
      if (reduced()) this.$.root.classList.add("yp--rm");
      this.sb = new Spr(1); this.se = new Spr(0);
      this.sf = new Spr(slotOwner() && slotOwner() !== "player" ? 1 : 0); // phones: 0 = disc on the row, 1 = above the slot
      this.b = 1; this.e = 0;
      this.view = "bar"; this.shown = false;
      this.bind();
      this.setMode();
      compactMQ.addEventListener("change", () => { this.setMode(); this.setView(this.defaultView(), { instant: true, focus: false, persist: false }); });
      addEventListener("resize", () => this.relayout());
      // a detail page's links bar took the nav's place (or gave it back): sit above whichever is there
      addEventListener("yarn:bottomchrome", () => this.relayout());
      // the nav changed how much of the bottom it takes (?mnav, a nav that hides…): the probe resizes → re-measure
      this.navRO = new ResizeObserver(() => this.relayout());
      this.navRO.observe(this.$.navp);
      // phones: someone else (the search FAB) took the slot → the bar tucks into the disc, which waits above, smaller
      addEventListener("yarn:slot", (e) => this.onSlot(e.detail?.owner || ""));
      boot();
      this.update("all");
      if (S.track) this.arrive({ initial: true });
      requestAnimationFrame(() => this.relayout());
      document.fonts?.ready?.then(() => this.relayout());
      // the kit nav may render after us
      setTimeout(() => this.relayout(), 300);
    }

    /* ---------- mode + view ---------- */
    setMode() {
      this.compact = compactMQ.matches;
      const r = this.$.root;
      r.classList.toggle("yp--compact", this.compact);
      r.classList.toggle("yp--wide", !this.compact);
      // i5 · MP3: the utilities (copy link) sit top right: over the head's first row (desktop), in the sheet's header (phones)
      if (this.compact) this.$.ph.insertBefore(this.$.util, this.$.hmute); else this.$.id.prepend(this.$.util);
      if (!this.compact) { this.dOut = 0; this.$.disc.style.opacity = this.$.disc.style.pointerEvents = ""; slotSet("player", false); this.sheet = false; this.$.root.classList.remove("is-sheet"); }
      this.$.float.style.top = this.$.float.style.bottom = this.$.disc.style.top = this.$.disc.style.bottom = "";
      this.sf.jump(this.compact && slotOwner() && slotOwner() !== "player" ? 1 : 0);
      this.$.pin.style.transform = this.$.pin.style.opacity = "";
      this.measure();
      this.apply();
    }
    defaultView() {
      if (FORCE_VIEW) return FORCE_VIEW;
      const saved = store.get(LS_VIEW, {})?.[this.compact ? "m" : "d"];
      if (saved === "disc" || saved === "bar") return saved;
      return this.compact ? "disc" : "bar";
    }
    // first time a track exists on this page: the disc pops in (mobile) / the bar grows out of it (desktop)
    arrive({ initial = false } = {}) {
      if (this.shown) return;
      this.shown = true;
      const v = this.defaultView();
      this.relayout();
      if (initial || reduced() || DRAG || FREEZE.b != null || FREEZE.e != null) { this.setView(v, { instant: true, focus: false, persist: false }); this.freeze(); return; }
      // from nothing: start as a small disc, spring to the target view
      this.sb.jump(0); this.se.jump(0); this.apply();
      const d = this.$.disc;
      d.animate([{ opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1 }], { duration: 320, easing: "cubic-bezier(.2,.8,.2,1)" });
      this.setView(v, { focus: false, persist: false, quiet: true });
    }
    setView(v, { vb = null, ve = null, bounce = false, instant = false, focus = true, persist = true, quiet = false } = {}) {
      if (!S.track || !this.$) return;
      this.closeActs();
      const prev = this.view;
      this.view = v; S.view = v; S.expanded = v === "panel";
      const $ = this.$, open = v === "panel";
      $.root.dataset.view = v;
      $.exps.forEach((b) => b.setAttribute("aria-expanded", String(open)));
      $.expBtn.setAttribute("aria-label", open ? "Hide details and queue" : "Show details and queue");
      $.disc.setAttribute("aria-expanded", String(v !== "disc"));
      this.labelDisc();
      if (persist && !FORCE_VIEW && v !== "panel") { const s = store.get(LS_VIEW, {}) || {}; s[this.compact ? "m" : "d"] = v; store.set(LS_VIEW, s); }
      slotSet("player", this.compact && v !== "disc"); // phones: the bar (or the page) holds the slot; the disc gives it back
      this.setModal(open && this.compact);
      this.reveal();
      const tb = v === "disc" ? 0 : 1, te = open ? 1 : 0;
      if (instant || reduced()) {
        this.sb.jump(tb); this.se.jump(te);
        if (!instant && reduced()) { const f = [$.float, $.disc]; f.forEach((el) => el.animate([{ opacity: 0.2 }, { opacity: 1 }], { duration: 180, easing: "ease-out" })); }
        this.apply(); this.settle();
      } else {
        const damping = bounce ? 0.82 : 1;
        this.sb.to(tb, { velocity: vb, damping, response: this.compact ? 0.36 : 0.4 });
        this.se.to(te, { velocity: ve, damping, response: this.compact ? 0.38 : 0.36 });
        this.run();
      }
      if (prev !== v && !quiet) sound(VIEW_RANK[v] > VIEW_RANK[prev] ? "player-open" : "player-close", { el: $.disc });
      if (prev !== v && focus) {
        if (open) { this.returnTo = document.activeElement && this.contains(document.activeElement) ? document.activeElement : $.expBtn; requestAnimationFrame(() => $.title.focus({ preventScroll: true })); }
        else if (this.contains(document.activeElement)) {
          const back = v === "disc" ? $.disc : this.compact ? $.mini.querySelector(".yp-who") : (this.returnTo?.isConnected && !$.panel.contains(this.returnTo) ? this.returnTo : $.expBtn);
          back.focus({ preventScroll: true });
        }
      }
      if (prev !== v) { emit("view"); if (prev === "panel" || open) emit("expand"); }
      this.layoutVars();
    }
    // every animated frame: step both springs, apply once
    run() {
      if (this.raf) return;
      let last = performance.now();
      const tick = (now) => {
        const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000)); last = now;
        const a = this.sb.step(dt), b = this.se.step(dt), c = this.sf.step(dt);
        this.apply();
        if (a || b || c) this.raf = requestAnimationFrame(tick);
        else { this.raf = 0; this.settle(); }
      };
      this.raf = requestAnimationFrame(tick);
    }
    stopAnim() { cancelAnimationFrame(this.raf); this.raf = 0; this.sb.live = this.se.live = this.sf.live = false; }
    // phones: where the disc rests (the row above the nav, or above the slot while a FAB holds it)
    fabAt() {
      const G = this.G, f = clamp(this.sf.x, 0, 1);
      if (G.wide || !G.fabUp || !f) return G.fab;
      return { x: lerp(G.fab.x, G.fabUp.x, f), y: lerp(G.fab.y, G.fabUp.y, f), r: lerp(G.fab.r, G.fabUp.r, f) };
    }
    onSlot(owner) {
      if (!this.$) return;
      const other = this.compact && !!owner && owner !== "player";
      if (S.track && other && this.view !== "disc") this.setView("disc", { focus: false, persist: false });
      const up = other ? 1 : 0;
      if (this.sf.t === up && !this.sf.live && this.sf.x === up) return;
      if (reduced() || !S.track) { this.sf.jump(up); this.apply(); } else { this.sf.to(up, { response: 0.42 }); this.run(); }
      this.layoutVars();
    }
    reveal() { // make the parts that are about to show visible / interactive
      const $ = this.$;
      $.panel.inert = false; $.panel.style.visibility = "";
      $.root.classList.add("is-moving");
    }
    settle() { // at rest: hide + inert what isn't shown
      const $ = this.$, v = this.view;
      $.root.classList.remove("is-moving");
      const panelOn = v === "panel";
      $.panel.inert = !panelOn; $.panel.style.visibility = panelOn ? "" : "hidden";
      $.bar.inert = v === "disc";
      $.main.inert = this.compact || v === "disc";
      $.mini.inert = !this.compact || v !== "bar";
      $.tx.inert = !this.compact || v !== "panel";
      if (this.compact && panelOn) $.pin.scrollTop = $.pin.scrollTop; // keep
    }

    /* ---------- geometry ---------- */
    relayout() { if (!this.$) return; this.closeActs(); this.measure(); this.apply(); this.layoutVars(); if (this.view === "panel" || this.view === "bar") this.scrubs.forEach((s) => s.draw()); }
    measure() {
      const de = document.documentElement, vw = de.clientWidth || innerWidth, vh = innerHeight;
      const frame = parseFloat(getComputedStyle(de).getPropertyValue("--frame")) || (this.compact ? 7 : 14);
      const safeB = this.$.safe.offsetHeight || 0, safeT = this.$.safeT.offsetHeight || 0;
      const $ = this.$;
      if (!this.compact) {
        const barH = 76, M = 16;
        const W = Math.round(Math.min(1180, vw - 2 * (frame + M)));
        const left = Math.round((vw - W) / 2);
        const panelH = Math.round(clamp(vh - 2 * frame - barH - 120, 250, 470));
        const H = barH + panelH, top = vh - frame - M - H;
        const slotR = 28, fabR = 30;
        this.G = { wide: true, vw, vh, left, top, W, H, barH, panelH, safeB: 0, R: 22, rim: 5,
          travelE: panelH, travelB: W - 120, travelD: 150, travelUp: panelH + barH, // (review ghosts: ?pdrag)
          slot: { x: W - 10 - slotR, y: panelH + barH / 2, r: slotR }, // local to the shell
          fab: { x: vw - frame - 22 - fabR, y: vh - frame - 22 - fabR, r: fabR } };
        Object.assign($.float.style, { left: left + "px", top: top + "px", bottom: "", width: W + "px", height: H + "px" });
        $.panel.style.height = panelH + "px"; $.bar.style.top = panelH + "px"; $.bar.style.height = barH + "px"; $.bar.style.bottom = "";
        $.bar.style.left = $.bar.style.right = ""; $.seam.style.left = $.seam.style.right = "";
        $.seam.style.top = (panelH - 1) + "px";
        this.discY0 = 0; $.disc.style.top = $.disc.style.bottom = "";
      } else {
        // i4 round 2 = iteration 3's phone geometry: the bar floats in the slot, SLOT_GAP above the nav (never under
        // it; above it in z), the frame + 8px in from each side; the disc rests at the right end of the slot's centre
        // line (?discat=nav: i3's spot, over the nav's top-right corner); while search holds the slot the disc waits
        // above it, smaller (fabUp, Yarn.slot). The nav's top edge comes from --nav-bottom via the probe: no nav
        // height lives here. Both the shell and the disc hang from the screen's bottom edge (like the nav), so a
        // browser toolbar coming or going can't leave the bar half under the nav before the resize lands (i4 · 3).
        const barH = SLOT_H, side = frame + 8;
        // html.y-navaway (kit): the nav stepped away and a detail page's links bar floats at the bottom instead.
        // Anchor above that bar (its settled spot, not mid-transition): frame + 8 below it, 12px foot padding.
        const footBar = de.classList.contains("y-navaway") ? document.querySelector(".ydetail--page > .ydetail__foot .ydetail__bar") : null;
        const slotB = $.navp.offsetHeight, navB = $.navp.offsetWidth; // up from the screen bottom (kit tokens)
        const hasNav = navB - safeB > 1 && !footBar;
        const barBottomY = footBar ? vh - safeB - frame - 20 - footBar.offsetHeight - 20 - SLOT_GAP : vh - Math.max(slotB, frame + 10 + safeB);
        const Ftop = safeT + 10, H = vh - Ftop;
        const slotR = 26, fabR = 31, upR = 22, rim = (r) => r * 38 / 30;
        const lift = (vh - safeB) - barBottomY;
        const fx = vw - frame - 12 - fabR; // i3's x
        this.G = { wide: false, vw, vh, left: 0, top: Ftop, W: vw, H, barH, safeB, side, lift, R: 20, rim: 4,
          panelH: H - barH - safeB,
          slotX: (s) => vw - s - 8 - slotR, slotY: H - safeB - barH / 2, slotR,
          fab: DISC_AT === "nav" && hasNav ? { x: fx, y: vh - navB + 14 - fabR, r: fabR } // i3: over the nav's corner
            : { x: fx, y: barBottomY - barH / 2, r: fabR },                                    // the slot's centre line
          fabUp: { x: vw - side - rim(upR), y: barBottomY - barH - SLOT_GAP - rim(upR), r: upR }, // above the slot
          travelE: Math.max(200, barBottomY - barH - Ftop), travelB: vw - 2 * side - 64, travelD: 150, travelUp: Math.max(240, barBottomY - Ftop - 40) };
        // hung from the bottom: layout top = (the real viewport's height) − H, = Ftop while innerHeight is current
        Object.assign($.float.style, { left: "0px", top: "auto", bottom: "0px", width: vw + "px", height: H + "px" });
        this.discY0 = vh - 60; $.disc.style.top = "auto"; $.disc.style.bottom = "0px";
        $.panel.style.height = this.G.panelH + "px"; $.bar.style.top = ""; $.bar.style.bottom = safeB + "px"; $.bar.style.height = barH + "px";
        $.seam.style.top = (this.G.panelH - 1) + "px";
      }
    }
    apply() {
      const G = this.G; if (!G || !this.$) return;
      const $ = this.$;
      const b = this.b = this.sb.x, e = this.e = this.se.x;
      const bc = clamp(b, 0, 1), ec = clamp(e, 0, 1);
      const fab = this.fabAt(); // the disc's resting spot (phones: on the row, or above the slot, smaller, while a FAB holds it)
      let L, T, Rr, B, radT, radB, tx, ty, scx, scy, sr;
      if (G.wide) {
        scx = G.slot.x; scy = G.slot.y; sr = G.slot.r;
        const r0 = G.fab.r * 38 / 30; // a cotton rim the progress thread sits on
        const topFull = (1 - e) * G.panelH; // e may overshoot: rubber
        L = lerp(scx - r0, 0, b); Rr = lerp(G.W - (scx + r0), 0, b);
        T = lerp(scy - r0, topFull, b); B = lerp(G.H - (scy + r0), 0, b);
        radT = radB = lerp(r0, G.R, bc);
        tx = (G.fab.x - (G.left + scx)) * (1 - b); ty = (G.fab.y - (G.top + scy)) * (1 - b);
      } else {
        const side = lerp(G.side, 0, ec);
        scx = G.slotX(side); scy = G.slotY; sr = G.slotR;
        const r0 = fab.r * 38 / 30;
        // the page (or the way to it) covers everything: sheet z (kit Z-INDEX SCALE); otherwise chrome z
        const sheet = this.view === "panel" || e > 0.001;
        if (sheet !== this.sheet) { this.sheet = sheet; $.root.classList.toggle("is-sheet", sheet); }
        const topFull = lerp(G.panelH, 0, e), botFull = lerp(G.safeB, 0, ec); // i3
        L = lerp(scx - r0, side, b); Rr = lerp(G.W - (scx + r0), side, b);
        T = lerp(scy - r0, topFull, b); B = lerp(G.H - (scy + r0), botFull, b);
        radT = lerp(r0, lerp(G.R, 26, ec), bc); radB = lerp(r0, lerp(G.R, 0, ec), bc);
        const lift = -G.lift * (1 - ec);
        tx = (fab.x - scx) * (1 - b); ty = lift + (fab.y - (G.top + scy + lift)) * (1 - b);
        $.bar.style.left = $.bar.style.right = side.toFixed(2) + "px";
        $.seam.style.left = $.seam.style.right = (side + 22).toFixed(2) + "px";
      }
      const f = (n) => n.toFixed(2);
      $.float.style.transform = `translate3d(${f(tx)}px,${f(ty)}px,0)`;
      $.shell.style.clipPath = `inset(${f(T)}px ${f(Rr)}px ${f(B)}px ${f(L)}px round ${f(radT)}px ${f(radT)}px ${f(radB)}px ${f(radB)}px)`;
      const sh = $.shade.style; // the shadow follows the clip as a plain box (cheap to repaint)
      sh.top = f(T) + "px"; sh.left = f(L) + "px"; sh.right = f(Rr) + "px"; sh.bottom = f(B) + "px";
      sh.borderRadius = `${f(radT)}px ${f(radT)}px ${f(radB)}px ${f(radB)}px`;
      const si = 6, st = $.stitch.style;
      st.top = (T + si) + "px"; st.left = (L + si) + "px"; st.right = (Rr + si) + "px"; st.bottom = (B + si) + "px";
      st.borderRadius = `${f(Math.max(2, radT - si))}px ${f(Math.max(2, radT - si))}px ${f(Math.max(2, radB - si))}px ${f(Math.max(2, radB - si))}px`;
      st.opacity = String(smooth((b - 0.15) / 0.5));
      // the disc: from the FAB to the bar's slot (it never leaves the bar after that)
      const dcx = (G.wide ? G.left : 0) + scx + tx, dcy = G.top + scy + ty;
      const dr = lerp(fab.r, sr, bc);
      $.disc.style.transform = `translate3d(${f(dcx - dr)}px,${f(dcy - dr - (this.discY0 || 0))}px,0) scale(${(dr / 30).toFixed(4)})`;
      $.disc.querySelector(".yp-disc__ring").style.opacity = String(1 - smooth(b / 0.45));
      // phones, open: the disc steps out of the controls row (▶ sits on the centre line, nothing on the stitch)
      // (…and comes back as a diagonal drag folds the page into it)
      const dOut = G.wide ? 0 : smooth((e - 0.15) / 0.45) * smooth((b - 0.45) / 0.4);
      if (dOut !== this.dOut) { this.dOut = dOut; $.disc.style.opacity = dOut ? String(1 - dOut) : ""; $.disc.style.pointerEvents = dOut > 0.5 ? "none" : ""; }
      // contents
      const barIn = smooth((b - 0.28) / 0.5);
      if (G.wide) {
        $.main.style.opacity = String(barIn);
        $.main.style.transform = `translateX(${f((1 - bc) * 26)}px)`;
        $.pin.style.opacity = String(smooth((e - 0.1) / 0.5));
        $.pin.style.transform = `translate3d(0,${f((1 - ec) * G.panelH)}px,0)`; // rides the rising edge, slides up out of the bar
      } else {
        $.mini.style.opacity = String(barIn * (1 - smooth(e / 0.3)));
        $.tx.style.opacity = String(barIn * smooth((e - 0.18) / 0.35));
        $.mini.style.transform = `translateX(${f((1 - bc) * 26)}px)`;
        $.pin.style.opacity = String(smooth((e - 0.06) / 0.45));
        $.pin.style.transform = `translate3d(0,${f((1 - ec) * G.panelH)}px,0)`;
        $.scrim.style.opacity = String(0.95 * ec);
      }
      $.seam.style.opacity = String(clamp(e * 6, 0, 1) * smooth(b));
    }

    /* the page reserves this much at the bottom (var(--bottom-ui)) */
    layoutVars() {
      if (!this.$) return;
      const de = document.documentElement, G = this.G;
      // phones: the disc rests on the row above the nav; a FAB (kit) waits to its left (html.y-disc)
      de.classList.toggle("y-disc", !!(S.track && G && !G.wide));
      if (!S.track || !G) { de.style.removeProperty("--bottom-ui"); return; }
      let ui;
      if (G.wide) ui = this.view === "disc" ? G.vh - (G.fab.y - G.fab.r) + 10 : G.vh - (G.top + G.panelH) + 14;
      else { // phones: the top of the chrome stack (the disc where it rests now: on the row, or up while search is open)
        const d = this.fabAt();
        ui = G.vh - (this.view === "disc" ? d.y - d.r * 38 / 30 : G.top + G.panelH - G.lift) + 8;
      }
      de.style.setProperty("--bottom-ui", Math.max(0, Math.round(ui - (G.safeB || 0))) + "px");
    }

    /* ---------- review aids: frozen morph / swipe / hover ---------- */
    freeze() {
      const $ = this.$;
      if (DRAG) {
        const p = DRAG.p, m = DRAG.mode;
        const base = m.startsWith("disc") ? "disc" : m.startsWith("panel") ? "panel" : "bar";
        this.setView(base, { instant: true, focus: false, persist: false });
        if (m === "bar-up") this.se.jump(p);
        if (m === "bar-right" || m === "bar-down") this.sb.jump(1 - p);
        if (m === "panel-diag") { this.se.jump(1 - p * 0.8); this.sb.jump(1 - p * 0.9); }
        if (m === "disc-up") { this.sb.jump(smooth(p * 3.2)); this.se.jump(p); }
        if (m === "disc-left") this.sb.jump(p);
        if (m === "panel-down") this.se.jump(1 - p);
        this.reveal(); this.$.bar.inert = false; this.apply();
        this.drawGhost(m, p);
      } else if (FREEZE.b != null || FREEZE.e != null) {
        if (FREEZE.b != null) this.sb.jump(FREEZE.b);
        if (FREEZE.e != null) this.se.jump(FREEZE.e);
        this.reveal(); this.apply();
      }
      if (HOVER) requestAnimationFrame(() => {
        if (HOVER.what === "scrub") {
          const s = this.compact && this.view === "panel" ? this.scrubs[1] : this.scrubs[0];
          s.draw(); s.preview(HOVER.at); s.showTip(HOVER.at); s.wave.classList.add("is-hov");
        } else {
          const row = this.compact && this.view === "panel";
          const v = this.vols.find((x) => x.el.classList.contains("yp-vol--row") === row) || this.vols[0];
          v.el.classList.add("is-open"); v.preview(HOVER.at);
        }
      });
    }
    drawGhost(mode, p) {
      const G = this.G, $ = this.$;
      const g = document.createElement("div");
      g.className = "yp-ghost"; g.setAttribute("aria-hidden", "true");
      let x0, y0, x1, y1, label;
      const barTopY = G.wide ? G.top + G.panelH : G.top + G.panelH - G.lift;
      if (mode === "bar-up") { x0 = G.vw * 0.42; y0 = barTopY + 30; y1 = y0 - p * G.travelE; x1 = x0 + 6; label = `swipe up · ${Math.round(p * 100)}%`; }
      else if (mode === "bar-right") { x0 = G.vw * 0.3; y0 = barTopY + 32; x1 = x0 + p * G.travelB; y1 = y0 + 4; label = `swipe right · ${Math.round(p * 100)}%`; }
      else if (mode === "bar-down") { x0 = G.vw * 0.4; y0 = barTopY + 26; x1 = x0 + p * 50; y1 = y0 + p * G.travelD; label = `drag down · ${Math.round(p * 100)}%`; }
      else if (mode === "panel-diag") { x0 = G.vw * 0.3; y0 = G.top + 70; x1 = x0 + p * G.travelB * 0.75; y1 = y0 + p * G.travelE * 0.8; label = `drag ↘ diagonally · ${Math.round(p * 100)}%`; }
      else if (mode === "disc-up") { x0 = G.fab.x; y0 = G.fab.y; x1 = x0 - p * 120; y1 = y0 - p * G.travelUp; label = `swipe ↖ from the disc · ${Math.round(p * 100)}%`; }
      else if (mode === "disc-left") { x0 = G.fab.x; y0 = G.fab.y; x1 = x0 - p * G.travelB; y1 = y0 - 6; label = `drag left · ${Math.round(p * 100)}%`; }
      else { x0 = G.vw / 2; y0 = G.top + 24; y1 = y0 + p * G.travelE; x1 = x0; label = `drag down · ${Math.round(p * 100)}%`; }
      g.innerHTML = `<svg><defs><marker id="yp-arr" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 10 5 0 10z" fill="#1f1e1e"/></marker></defs>
        <path d="M${x0} ${y0} L${x1} ${y1}" stroke="#1f1e1e" stroke-width="2.5" stroke-dasharray="5 5" fill="none" marker-end="url(#yp-arr)" opacity=".7"/>
        <circle cx="${x0}" cy="${y0}" r="7" fill="none" stroke="#1f1e1e" stroke-width="2" stroke-dasharray="3 3" opacity=".6"/></svg>
        <span class="f" style="left:${x1}px;top:${y1}px"></span><span class="l" style="left:${clamp(x1, 120, G.vw - 130)}px;top:${y1 - 52}px">${label}</span>`;
      $.root.appendChild(g);
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
      if (wasEmpty) requestAnimationFrame(() => { this.relayout(); });
    }
    renderTrack() {
      const t = S.track, $ = this.$;
      const sw = swatch(t), bg = sw ? `url("${sw}")` : "";
      this.querySelectorAll(".yp-art").forEach((el) => { el.style.backgroundImage = bg; });
      if (DISC_LABEL === "cat" || !bg) { $.discLabel.className = "ydisc__label ydisc__label--cat"; $.discLabel.innerHTML = CAT; $.discLabel.style.backgroundImage = ""; }
      else { $.discLabel.className = "ydisc__label"; $.discLabel.innerHTML = ""; $.discLabel.style.backgroundImage = bg; }
      // i4 (owner: "no need to say single … just have subtext when it's needed"): a single has no sub line
      const where = whereOf(t);
      // i6 · M7 (?pwip=tag|seam|off): an ongoing song shows it in the bar, the panel and on the disc
      const wip = t.status === "wip" && !t.external && PWIP !== "off";
      $.root.classList.toggle("is-wip", wip);
      $.art.innerHTML = wip && PWIP === "tag" ? `<span class="yp-wipl">${NEEDLE}<span>Ongoing</span></span>` : "";
      this.querySelectorAll(".yp-who-name").forEach((el) => { el.textContent = t.name; });
      this.querySelectorAll(".yp-who-sub").forEach((el) => {
        if (wip && PWIP === "seam") el.innerHTML = `<em class="yp-wips">Ongoing</em>${where ? ` · ${esc(where)}` : ""}`; // (first: a narrow bar cuts the end)
        else el.textContent = where;
      });
      $.tipName.textContent = t.name; $.tipSub.textContent = where;
      const said = (where ? `${t.name}, ${where}` : t.name) + (wip ? (PWIP === "wip" ? ", work in progress" : ", ongoing") : "");
      $.whos[0].setAttribute("aria-label", `${said}. Show details and queue`);
      $.whos[1].setAttribute("aria-label", `${said}. Open the full player`);
      $.title.textContent = t.name;
      $.title.classList.toggle("is-long", [...t.name].length > 26);
      $.title.title = t.name; // clamped titles keep the whole name on hover
      // (i7 follow-up: the credit says "made with …" (a collaboration) / "made by …" (someone else's song) and lives on the
      // line under the title, not in the facts)
      const withA = t.artist ? `made ${t.external ? "by" : "with"} ${[].concat(t.artist).join(", ")}` : "";
      const coll = t.collectionId ? library().collections.get(t.collectionId) : null;
      /* i5 · MP3: the head follows the opened item's grammar (LAYOUT-i5.md): title → "from <Collection>" (the bar's
         line, the collection is the one text link) → facts (Yarn.fact: status · instrument · date · with …, one face,
         colour in the disc only) → links (one row of .btn: icon + label) · copy link = a utility, round, top right.
         The art is its own fixed column: nothing in this column can move it. */
      const Yk = window.Yarn, v5 = !!Yk?.fact;
      $.sub.innerHTML = coll
        ? `from <a href="${esc(kitURL("../music/index.html") + "?item=" + encodeURIComponent(coll.key))}" data-coll="${esc(coll.key)}">${esc(coll.name)}</a>${withA ? " · " + esc(withA) : ""}`
        : t.collection ? `from ${esc(t.collection)}${withA ? " · " + esc(withA) : ""}` : esc(withA);
      $.sub.hidden = !$.sub.innerHTML;
      const mItem = t.external ? null : { status: t.status, start: t.start, end: t.end, type: "track" };
      $.meta.innerHTML = !mItem ? ""
        // (i7: instrument · status · date, the release head's order; ?statusdate=joined → status + date as one fact)
        : v5 ? [Yk.fact.instrument(t.instrument), ...(Yk.opts?.statusdate === "joined" && Yk.fact.statusDate?.(mItem) ? [Yk.fact.statusDate(mItem, { dur: true })] : [Yk.fact.status(t.status), Yk.fact.date(mItem)])].join("")
        : Yk?.meta ? Yk.meta(mItem, { parts: ["status", "date"] }) : `<span class="yp-meta-fb">${esc((STATUS[t.status] || [, t.status])[1])} · ${esc(dates(t))}</span>`;
      $.meta.classList.toggle("yp-facts", v5);
      const copy = `<span class="yp-copy-t"><button class="${Yk ? "ylinkicon" : "yp-lk"} yp-copy" type="button" data-act="share" aria-label="Copy a link to ${esc(t.name)} at ${fmt(S.time)}" title="Copy link">${phIcon("link")}</button><span class="yp-copied" hidden>Copied</span></span>`;
      if (v5 && Yk.dlink) {
        $.links.innerHTML = Object.entries(t.links || {}).filter(([k, u]) => LINKS[k] && u).map(([k, u]) => Yk.dlink({ href: u, label: LINKS[k].replace(/ song$/, ""), kind: k })).join("");
        $.util.innerHTML = copy;
      } else { $.links.innerHTML = this.linksHTML(t) + copy; $.util.innerHTML = ""; }
      $.root.classList.toggle("yp--v5", v5);
      // notes (MP3): the song's, then the collection's, told apart. divider (default): a labelled dashed seam between
      // them · tabs: "This song · The collection", one at a time. Only one kind → no tabs; no notes → no section.
      const sN = t.description ? md(t.description) : "", cN = coll?.description ? md(coll.description) : "";
      // i6 · MP2 (owner: "label should just be "About [collection name]" also add "About this song""): the two
      // divider labels are "About this song" and "About <Collection>"
      const cLabel = coll ? `About <b>${esc(coll.name)}</b>` : "About the collection";
      let d = "";
      if (sN && cN && PNOTES === "tabs") {
        d = `<div class="yp-ntabs" role="tablist" aria-label="Notes"><button type="button" role="tab" id="yp-nt-s" aria-controls="yp-np-s" aria-selected="true" data-nt="s">This song</button><button type="button" role="tab" id="yp-nt-c" aria-controls="yp-np-c" aria-selected="false" tabindex="-1" data-nt="c">The collection</button></div>` +
          `<div class="yp-np" role="tabpanel" id="yp-np-s" aria-labelledby="yp-nt-s">${sN}</div><div class="yp-np" role="tabpanel" id="yp-np-c" aria-labelledby="yp-nt-c" hidden>${cN}</div>`;
      } else {
        if (sN) d = `<div class="yp-nsong">${cN ? `<p class="yp-from">About this song</p>` : ""}${sN}</div>`;
        if (cN) d += `<div class="yp-ncoll${sN ? " is-after" : ""}"><p class="yp-from">${cLabel}</p>${cN}</div>`;
      }
      $.notes.innerHTML = d;
      $.notes.classList.toggle("is-tabs", d.startsWith('<div class="yp-ntabs"'));
      $.notes.scrollTop = 0;
      this.scrubs.forEach((s) => s.draw());
      this.labelDisc();
    }
    linksHTML(t) { return linksHTML(t); }
    labelDisc() {
      const t = S.track; if (!t || !this.$) return;
      const st = S.playing ? "playing" : "paused";
      this.$.disc.setAttribute("aria-label", this.view === "disc" ? `Open the player: ${t.name}, ${st}` : "Minimize the player to the disc");
    }
    renderState() {
      const r = this.$.root;
      r.classList.toggle("is-playing", S.playing);
      this.querySelectorAll("[data-act=play]").forEach((b) => b.setAttribute("aria-label", S.playing ? "Pause" : "Play"));
      this.querySelectorAll("[data-act=shuffle]").forEach((b) => b.setAttribute("aria-pressed", String(S.shuffle)));
      this.querySelectorAll("[data-act=repeat]").forEach((b) => {
        b.setAttribute("aria-pressed", String(S.repeat !== "off"));
        b.setAttribute("aria-label", `Repeat: ${S.repeat === "off" ? "off" : S.repeat === "all" ? "all" : "this track"}`);
        b.classList.toggle("rep-one", S.repeat === "one");
      });
      this.labelDisc();
      if (S.playing) this.loop();
    }
    renderVolume() {
      const r = this.$.root, v = S.muted ? 0 : S.volume;
      r.classList.toggle("vol-0", v === 0);
      r.classList.toggle("vol-lo", v > 0 && v < 0.5);
      r.classList.toggle("vol-hi", v >= 0.5);
      this.vols.forEach((x) => x.paint());
      this.querySelectorAll("[data-act=mute]").forEach((b) => {
        b.setAttribute("aria-pressed", String(S.muted));
        b.setAttribute("aria-label", S.muted ? "Unmute" : "Mute");
        const l = b.querySelector(".yp-mute-l"); if (l) l.textContent = S.muted ? "Unmute" : "Mute";
      });
    }
    renderQueue() {
      const $ = this.$, up = S.queue.slice(S.index + 1), t = S.track;
      const sel = window.Yarn ? " ysel" : "";
      const subOf = (x) => x.collection ? `${x.collection} · ${x.index}/${x.count}` : x.external && x.artist ? [].concat(x.artist).join(", ") : "";
      const row = (x, i) => {
        const sub = subOf(x);
        return `<li class="yp-qr" data-i="${i}"><button class="yp-qg" type="button" data-grip="${i}" aria-label="Reorder ${esc(x.name)}, position ${i - S.index}. Arrow keys move it.">${icon("grip")}</button>` +
          `<button class="yp-qm" type="button" data-act="jump" data-i="${i}" aria-label="Play ${esc(x.name)} now"><span class="yp-sw" data-sw="${esc(x.id)}"></span>` +
          `<span class="yp-qt"><b>${esc(x.name)}</b><small>${esc(sub)}</small></span><span class="yp-qd">${fmt(durationOf(x))}</span></button>` +
          // i7 · W1 (walkthrough: "Queue: reorder and remove", there was no remove): ✕ takes it out, the toast's Undo puts it back
          `<button class="yp-ib yp-qx" type="button" data-act="qrm" data-i="${i}" aria-label="Remove ${esc(x.name)} from the queue">${icon("close")}</button></li>`;
      };
      // i4: no "Playing now / Paused" text: the bars move or they don't. i5 · MP3 / M3: the bars sit inside the row's
      // swatch (the queue row is the one place the panel shows them; the big art has none)
      let html = `<li class="yp-qr is-now${sel}" aria-current="true"><span class="yp-qnow" aria-hidden="true"></span>` +
        `<div class="yp-qm"><span class="yp-sw yp-sw--now" data-sw="${esc(t.id)}"><span class="yp-eq" aria-hidden="true"><i></i><i></i><i></i></span></span><span class="yp-qt"><b>${esc(t.name)}</b><small>${esc(subOf(t))}</small></span><span class="yp-qd">${fmt(S.duration)}</span></div></li>`;
      html += up.map((x, k) => row(x, S.index + 1 + k)).join("");
      // only what changes what plays next gets a line (repeat); an empty queue just ends
      if (S.repeat === "all" && S.queue.length > 1) html += `<li class="yp-qe">${up.length ? "Then the queue repeats from the top." : "Repeat is on: the queue starts over from the top."}</li>`;
      $.q.innerHTML = html;
      $.q.querySelectorAll("[data-sw]").forEach((el) => { const x = resolve(el.dataset.sw); const u = x && swatch(x); if (u) el.style.backgroundImage = `url("${u}")`; });
      const total = up.reduce((a, x) => a + durationOf(x), 0);
      $.qc.textContent = up.length ? `${up.length} track${up.length === 1 ? "" : "s"} · ${fmt(total)}${S.shuffle ? " · shuffled" : ""}` : "";
      // i6 · MP1: ⏭ is off on the last song (repeat all wraps to the top, so it stays on then)
      const last = !up.length && S.repeat !== "all";
      this.querySelectorAll("[data-act=next]").forEach((b) => {
        if ((b.getAttribute("aria-disabled") === "true") === last) return;
        last ? b.setAttribute("aria-disabled", "true") : b.removeAttribute("aria-disabled");
        b.setAttribute("aria-label", last ? "Next track (this is the last one)" : "Next track");
      });
    }
    paintTime(force) {
      if (!S.track) return;
      const time = S.time, dur = S.duration || durationOf(S.track);
      const fr = dur ? clamp(time / dur, 0, 1) : 0;
      this.scrubs.forEach((s) => s.paint(time, dur));
      this.$.thread.style.setProperty("--f", fr.toFixed(4));
      this.$.ring.setAttribute("stroke-dasharray", `${(fr * 100).toFixed(2)} 100`);
      const sec = Math.floor(time);
      if (force || sec !== this.lastSec) {
        this.lastSec = sec;
        this.scrubs.forEach((s) => s.aria(time, dur));
        this.$.tipSub.textContent = `${fmt(time)} / ${fmt(dur)}${S.track.collection ? " · from " + S.track.collection : ""}${this.$.root.classList.contains("is-wip") ? (PWIP === "wip" ? " · WIP" : " · ongoing") : ""}`;
        const c = this.querySelector(".yp-copy");
        if (c && !this.sharing) c.setAttribute("aria-label", `Copy a link to ${S.track.name} at ${fmt(time)}`);
        mediaPosition();
      }
    }
    loop() {
      if (this.tl) return;
      const tick = () => {
        if (!S.playing || (S.demo && !demoTimer)) { this.tl = 0; return; }
        if (!S.demo && !audio.paused && srcIs(S.track)) S.time = audio.currentTime;
        this.paintTime();
        this.tl = requestAnimationFrame(tick);
      };
      this.tl = requestAnimationFrame(tick);
    }
    announce(msg) { this.$.live.textContent = ""; setTimeout(() => { this.$.live.textContent = msg; }, 30); }

    /* mobile full page is modal: dialog semantics, page behind inert, scroll locked */
    setModal(on) {
      if (on === !!this.modalOn) return;
      this.modalOn = on;
      const { panel } = this.$, de = document.documentElement, body = document.body;
      if (on) {
        panel.setAttribute("role", "dialog"); panel.setAttribute("aria-modal", "true"); panel.setAttribute("aria-label", "Now playing");
        // i7 · W1 (walkthrough, broken since i6 · B2): the player now lives in the kit's layer (Yarn.layer()), not
        // straight in <body>, so inerting body's children made the layer, and the open page with it, inert: on a phone
        // nothing in it could be tapped and it couldn't be dragged down. Inert everything *beside* the player's path
        // to <body> instead (the page, and the layer's other parts: the pill, search, toasts).
        // (the kit toast is one reused element: it stays live, so an Undo for something done in the page still works)
        const skip = (el) => el.inert || /^(SCRIPT|STYLE|LINK)$/.test(el.tagName) || el.classList.contains("mockpanel") || el.classList.contains("ytoast");
        this.inerted = [];
        for (let n = this; n && n !== body && n.parentElement; n = n.parentElement)
          for (const sib of n.parentElement.children) if (sib !== n && !skip(sib)) this.inerted.push(sib);
        this.inerted.forEach((el) => { el.inert = true; });
        this.lock = { h: de.style.overflow, b: body.style.overflow };
        de.style.overflow = "hidden"; body.style.overflow = "hidden";
      } else {
        panel.setAttribute("role", "group"); panel.removeAttribute("aria-modal"); panel.setAttribute("aria-label", "Now playing and queue");
        (this.inerted || []).forEach((el) => { el.inert = false; });
        this.inerted = null;
        if (this.lock) { de.style.overflow = this.lock.h; body.style.overflow = this.lock.b; this.lock = null; }
      }
    }

    /* ---------- gestures (compact): finger-tracked, velocity hand-off, rubber band ---------- */
    gDown(e, src) {
      if (!this.compact || e.button > 0 || !S.track) return;
      if (e.target.closest(".yp-wave,.yp-vol__track,.yp-qg")) return;
      if (src === "bar" && this.view === "disc") return;
      if (src === "pin" && (this.view !== "panel" || this.$.pin.scrollTop > 0)) return;
      this.g = { id: e.pointerId, src, x: e.clientX, y: e.clientY, mode: null, b0: this.sb.x, e0: this.se.x, hist: [[e.timeStamp, e.clientX, e.clientY]], el: e.currentTarget };
    }
    gMove(e) {
      const g = this.g; if (!g || e.pointerId !== g.id) return;
      let dx = e.clientX - g.x, dy = e.clientY - g.y;
      if (!g.mode) {
        if (Math.hypot(dx, dy) < 8) return;
        const ax = Math.abs(dx), ay = Math.abs(dy);
        // i4: on the open page a drag down closes it to the bar, a diagonal one folds it all the way into the disc;
        // on the bar: up → the page, down (or diagonal) / sideways → the disc
        if (g.src === "disc") g.mode = dy < 0 && -dy > ax * 0.45 ? "disc-up" : ax > ay ? "h" : null;
        else if (g.src === "bar") g.mode = this.view === "panel" ? (dy > 0 && ay > ax * 0.4 ? "pd" : null) : ay > ax ? (dy < 0 ? "v" : "down") : (this.view === "bar" ? "h" : null);
        else g.mode = dy > 0 && ay > ax * 0.4 ? "pd" : null;
        if (!g.mode) { this.g = null; return; }
        try { g.el.setPointerCapture(e.pointerId); } catch { /* ignore */ }
        this.stopAnim(); this.reveal();
        g.x = e.clientX; g.y = e.clientY; g.b0 = this.sb.x; g.e0 = this.se.x; dx = dy = 0; // track 1:1 from here: no jump
        this.dragging = true;
      }
      e.preventDefault();
      g.hist.push([e.timeStamp, e.clientX, e.clientY]);
      while (g.hist.length > 2 && e.timeStamp - g.hist[0][0] > 100) g.hist.shift();
      const G = this.G, band = (v, dim) => (v > 1 ? 1 + rubber((v - 1) * dim, dim) / dim : v < 0 ? -rubber(-v * dim, dim * 0.6) / dim : v);
      if (g.mode === "v") this.se.jump(band(g.e0 - dy / G.travelE, G.travelE));
      else if (g.mode === "h") this.sb.jump(band(g.b0 - dx / G.travelB, G.travelB));
      else if (g.mode === "disc-up") { const p = band(-dy / G.travelUp, G.travelUp); this.sb.jump(smooth(p * 3.2)); this.se.jump(p); }
      else if (g.mode === "down") this.sb.jump(band(g.b0 - (Math.max(0, dy) + Math.max(0, Math.abs(dx) - 16)) / G.travelD, G.travelD));
      else if (g.mode === "pd") { // the sideways part of the drag folds the sheet toward the disc as it comes down
        this.se.jump(band(g.e0 - dy / G.travelE, G.travelE));
        this.sb.jump(band(g.b0 - (Math.max(0, Math.abs(dx) - 16) * 1.3) / G.travelB, G.travelB));
      }
      this.apply();
    }
    gUp(e) {
      const g = this.g; if (!g || e.pointerId !== g.id) return;
      this.g = null;
      if (!g.mode) return;
      this.dragging = false;
      this.swallow = true; setTimeout(() => { this.swallow = false; }, 0);
      const h = g.hist, [t0, x0, y0] = h[0], [t1, x1, y1] = h[h.length - 1];
      const dt = Math.max(1, t1 - t0), vx = ((x1 - x0) / dt) * 1000, vy = ((y1 - y0) / dt) * 1000; // px/s
      const G = this.G, fast = Math.hypot(vx, vy) > 700;
      if (g.mode === "v") {
        const to = this.se.x + project(-vy) / G.travelE > 0.5 ? "panel" : "bar";
        this.setView(to, { ve: -vy / G.travelE, bounce: fast });
      } else if (g.mode === "h") {
        const to = this.sb.x + project(-vx) / G.travelB < 0.5 ? "disc" : "bar";
        this.setView(to, { vb: -vx / G.travelB, bounce: fast });
      } else if (g.mode === "down") {
        const v = Math.max(0, vy) + Math.abs(vx);
        this.setView(this.sb.x - project(v) / G.travelD < 0.5 ? "disc" : "bar", { vb: -v / G.travelD, bounce: fast });
      } else if (g.mode === "pd") {
        const side = Math.abs(vx) > Math.abs(vy) * 0.35 ? Math.abs(vx) * 1.3 : 0; // only a real diagonal counts
        const bEnd = this.sb.x - project(side) / G.travelB, eEnd = this.se.x + project(-vy) / G.travelE;
        this.setView(bEnd < 0.6 ? "disc" : eEnd > 0.5 ? "panel" : "bar", { ve: -vy / G.travelE, vb: -side / G.travelB, bounce: fast });
      } else {
        const p = this.se.x + project(-vy) / G.travelUp;
        if (p > 0.3) this.setView("panel", { ve: -vy / G.travelUp, vb: 0, bounce: fast });
        else this.setView("disc", { ve: -vy / G.travelUp });
      }
    }

    /* ---------- events ---------- */
    bind() {
      const $ = this.$;
      this.addEventListener("click", (e) => {
        if (this.swallow) { e.preventDefault(); e.stopPropagation(); return; }
        const nt = e.target.closest("[data-nt]"); // ?pnotes=tabs
        if (nt) { this.noteTab(nt.dataset.nt); return; }
        const b = e.target.closest("[data-act]");
        if (!b || !this.contains(b)) return;
        const a = b.dataset.act;
        // MP1: the click that ends a long press (or the press that closes the actions) doesn't also open the bar
        if (a === "disc" && this.lpFired) { this.lpFired = false; e.preventDefault(); return; }
        // i6 · MP1: ⏭ with nothing after it does nothing (aria-disabled: it stays focusable); an action button pulses
        if (b.getAttribute("aria-disabled") === "true") return;
        // i7 · B3: a held press already shrank it (.is-press, below); the pulse is for keys and taps too quick to see
        const quick = !b._pd || performance.now() - b._pd < 140; b._pd = 0;
        if (b.classList.contains("yp-act") && quick && !reduced()) { b._press?.cancel(); b._press = b.animate([{ transform: "scale(.86)" }, { transform: "none" }], { duration: 260, easing: "cubic-bezier(.3,1.4,.5,1)" }); b._press.onfinish = () => { b._press = null; }; }
        if (a === "play") {
          const was = S.playing;
          toggle();
          sound(was ? "pause" : "play", { el: b });
          if (!was && BURST !== "off" && !reduced()) window.Notes?.burst?.(b, "music", { intensity: "subtle" });
        } else if (a === "prev") prev();
        else if (a === "next") next();
        else if (a === "shuffle") { setShuffle(!S.shuffle); this.announce(S.shuffle ? "Shuffle on" : "Shuffle off"); }
        else if (a === "repeat") { cycleRepeat(); this.announce(`Repeat ${S.repeat === "one" ? "this track" : S.repeat}`); }
        else if (a === "mute") setMuted(!S.muted);
        else if (a === "expand") this.setView(this.view === "panel" ? "bar" : "panel");
        else if (a === "collapse") this.setView("bar");
        else if (a === "disc") this.setView(this.view === "disc" ? "bar" : "disc");
        else if (a === "jump") jump(+b.dataset.i);
        else if (a === "qrm") {
          const i = +b.dataset.i, x = S.queue[i], at = i - S.index; // its place among the upcoming songs
          if (!x || !remove(i)) return;
          const back = () => { if (!enqueue(x)) return; const from = S.queue.lastIndexOf(x), to = Math.min(S.index + at, S.queue.length - 1); moveQueue(from, to); };
          this.announce(`${x.name} removed from the queue`);
          if (window.Yarn?.toast) window.Yarn.toast({ icon: "list-dashes", html: `<b>${esc(x.name)}</b> is out of the queue`, undo: back }); // Music's words
          // focus stays in the queue: the next row's ✕, or the list's tools when it was the last one
          requestAnimationFrame(() => (this.$.q.querySelector(`.yp-qx[data-i="${i}"]`) || this.$.q.querySelector(`.yp-qx[data-i="${i - 1}"]`) || this.$.panel.querySelector(".yp-qtools .yp-ib"))?.focus({ preventScroll: true }));
        }
        else if (a === "share") this.share(b);
      });
      $.scrim.addEventListener("click", () => this.setView("bar"));
      $.notes.addEventListener("keydown", (e) => {
        const tb = e.target.closest?.("[data-nt]");
        if (!tb || (e.key !== "ArrowLeft" && e.key !== "ArrowRight")) return;
        e.preventDefault();
        this.noteTab(tb.dataset.nt === "s" ? "c" : "s", { focus: true });
      });
      $.sub.addEventListener("click", (e) => {
        const a = e.target.closest("a[data-coll]");
        if (!a) return;
        const ev = new CustomEvent("yarnplayer:collection", { detail: { id: a.dataset.coll, key: a.dataset.coll }, cancelable: true });
        if (!window.dispatchEvent(ev)) { e.preventDefault(); if (this.compact) this.setView("bar", { focus: false }); }
      });
      // gestures
      const on = (el, src) => {
        el.addEventListener("pointerdown", (e) => this.gDown(e, src));
        el.addEventListener("pointermove", (e) => this.gMove(e));
        el.addEventListener("pointerup", (e) => this.gUp(e));
        el.addEventListener("pointercancel", (e) => this.gUp(e));
      };
      on($.disc, "disc"); on($.bar, "bar"); on($.grab, "pin"); on($.ph, "pin");
      // drag down from the top of the scrolled sheet (touch)
      on($.pin, "pin");
      $.pin.addEventListener("touchmove", (e) => { // decide before the browser claims the pan: at the top, a downward drag is ours
        const g = this.g; if (!g || !e.cancelable) return;
        if (g.mode === "v" || g.mode === "pd" || (g.src === "pin" && $.pin.scrollTop <= 0 && e.touches[0].clientY > g.y)) e.preventDefault();
      }, { passive: false });
      [$.bar, $.disc].forEach((el) => el.addEventListener("touchmove", (e) => { if (this.g?.mode && e.cancelable) e.preventDefault(); }, { passive: false }));
      $.bar.style.touchAction = "none";
      this.bindQueue();
      if ($.acts) this.bindDiscLong();
    }

    /* ---------- i5 · MP1: long press on the disc → ▶ · mute · ⏭ float around it ----------
       Touch and mouse: 450ms without moving more than 8px. Never from a scroll: a press that lands while the page is
       still moving (a finger stopping a fling) doesn't arm, and any scroll or drag during the press cancels it.
       Right-click / the menu key / Shift+F10 open them too. A tap outside, Esc or a view change closes them. */
    bindDiscLong() {
      const $ = this.$, d = $.disc;
      let lastScroll = 0;
      this.cancelLP = () => { if (this.lp) { clearTimeout(this.lp.t); this.lp = null; } };
      // one window listener for the element's life (the player never leaves the page)
      addEventListener("scroll", () => { lastScroll = performance.now(); this.cancelLP(); if (this.actsOpen) this.closeActs(); }, { passive: true, capture: true });
      d.addEventListener("pointerdown", (e) => {
        if (this.lpEat) { this.lpEat = false; return; } // this press closed the actions (actsOut ran first, in capture)
        this.lpFired = false;
        if (this.view !== "disc" || e.button > 0 || this.actsOpen || performance.now() - lastScroll < 250) return;
        this.cancelLP();
        this.lp = { x: e.clientX, y: e.clientY, id: e.pointerId, t: setTimeout(() => { this.lp = null; this.lpFired = true; try { navigator.vibrate?.(8); } catch { /* ignore */ } this.openActs(); }, 450) };
      });
      d.addEventListener("pointermove", (e) => { const p = this.lp; if (p && e.pointerId === p.id && Math.hypot(e.clientX - p.x, e.clientY - p.y) > 8) this.cancelLP(); });
      for (const t of ["pointerup", "pointercancel", "pointerleave"]) d.addEventListener(t, this.cancelLP);
      d.addEventListener("contextmenu", (e) => {
        if (this.view !== "disc" || !S.track) return;
        e.preventDefault();
        if (!this.actsOpen) this.openActs({ focus: e.button !== 2 && !e.clientX && !e.clientY });
      });
      // i7 · B3: the press, for touch as for a mouse: CSS :active doesn't hold under a finger (iOS needs a touch
      // listener; Chrome waits to rule out a scroll), so a pointerdown holds .is-press until the pointer lets go
      $.acts?.addEventListener("pointerdown", (e) => {
        const b = e.target.closest(".yp-act");
        if (!b || b.getAttribute("aria-disabled") === "true") return;
        b._pd = performance.now(); b.classList.add("is-press");
        const up = () => { b.classList.remove("is-press"); for (const t of ["pointerup", "pointercancel"]) removeEventListener(t, up, true); };
        for (const t of ["pointerup", "pointercancel"]) addEventListener(t, up, true);
      });
      this.actsOut = (e) => {
        if ($.acts.contains(e.target)) return;
        if (d.contains(e.target)) { this.lpFired = true; this.lpEat = true; } // a press on the disc just closes them
        this.closeActs();
      };
      this.actsKey = (e) => {
        if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); this.closeActs({ focus: true }); return; }
        if (!$.acts.contains(document.activeElement) || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
        const bs = [...$.acts.children], i = bs.indexOf(document.activeElement);
        e.preventDefault();
        bs[(i + (e.key === "ArrowUp" || e.key === "ArrowRight" ? 1 : -1) + bs.length) % bs.length].focus();
      };
    }
    // ?pnotes=tabs: This song · The collection (arrow keys move between the two, like any tablist)
    noteTab(k, { focus = false } = {}) {
      const n = this.$.notes;
      for (const tb of n.querySelectorAll("[data-nt]")) { const on = tb.dataset.nt === k; tb.setAttribute("aria-selected", String(on)); tb.tabIndex = on ? 0 : -1; if (on && focus) tb.focus(); }
      for (const p of n.querySelectorAll(".yp-np")) p.hidden = p.id !== `yp-np-${k}`;
      n.scrollTop = 0;
    }
    openActs({ focus = false } = {}) {
      const $ = this.$;
      if (!$.acts || !S.track || this.view !== "disc" || this.actsOpen) return;
      const r = $.disc.getBoundingClientRect(), R = r.width / 2 + 50;
      $.acts.style.left = (r.left + r.width / 2).toFixed(1) + "px";
      $.acts.style.top = (r.top + r.height / 2).toFixed(1) + "px";
      // left · up-left · up: they stay clear of the screen's right and bottom edges (the disc lives in that corner)
      [180, 135, 90].forEach((deg, i) => {
        const b = $.acts.children[i], a = (deg * Math.PI) / 180;
        b.style.setProperty("--x", (Math.cos(a) * R).toFixed(1) + "px");
        b.style.setProperty("--y", (-Math.sin(a) * R).toFixed(1) + "px");
        b.style.transitionDelay = `${i * 28}ms`;
        // i7 · B3 (owner screenshot: Play's hint lay over mute): the kit hint opens outward, away from the cluster
        // (left of ▶ and of mute, above ⏭), never over a neighbour
        b.dataset.hintAt = deg > 100 ? "left" : deg < 80 ? "right" : "top";
      });
      this.actsOpen = true;
      $.acts.classList.add("is-open"); $.root.classList.add("is-acts");
      document.documentElement.classList.add("yp-acts-on"); // i6 · MP1: the search knob steps away until they close
      sound("open", { el: $.disc });
      document.addEventListener("pointerdown", this.actsOut, true);
      document.addEventListener("keydown", this.actsKey, true);
      if (focus) $.acts.querySelector("button")?.focus({ preventScroll: true });
      this.announce("Quick controls: play, mute, next");
    }
    closeActs({ focus = false } = {}) {
      const $ = this.$;
      if (!this.actsOpen || !$?.acts) return;
      this.actsOpen = false;
      [...$.acts.children].forEach((b, i) => { b.style.transitionDelay = `${(2 - i) * 18}ms`; });
      $.acts.classList.remove("is-open"); $.root.classList.remove("is-acts");
      document.documentElement.classList.remove("yp-acts-on");
      document.removeEventListener("pointerdown", this.actsOut, true);
      document.removeEventListener("keydown", this.actsKey, true);
      if (focus || $.acts.contains(document.activeElement)) $.disc.focus({ preventScroll: true });
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
        e.preventDefault(); e.stopPropagation();
        const row = g.closest(".yp-qr"), rows = [...list.querySelectorAll(".yp-qr[data-i]")];
        const from = rows.indexOf(row), mids = rows.map((r) => { const b = r.getBoundingClientRect(); return b.top + b.height / 2; });
        const hgt = row.getBoundingClientRect().height + 4;
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
      const ok = await copyText(url);
      this.sharing = true;
      const tip = btn.parentElement.querySelector(".yp-copied");
      btn.classList.add("is-done");
      btn.innerHTML = phIcon(ok ? "check" : "link");
      if (tip) { tip.hidden = false; tip.textContent = ok ? `Copied · ${fmt(S.time)}` : "Couldn't copy"; }
      if (ok) sound("copy", { el: btn });
      this.announce(ok ? `Link copied, starts at ${fmt(S.time)}` : `Couldn't copy. The link is ${url}`);
      clearTimeout(this.shareT);
      this.shareT = setTimeout(() => {
        this.sharing = false; btn.classList.remove("is-done"); btn.innerHTML = phIcon("link");
        if (tip) tip.hidden = true;
        this.paintTime(true);
      }, 1800);
    }
  }

  // icon-only link buttons (the owner's original icons): Yarn.linkIcon when the kit is here
  function linksHTML(t) {
    return Object.entries(t?.links || {}).filter(([k, u]) => LINKS[k] && u)
      .map(([k, u]) => window.Yarn?.linkIcon ? window.Yarn.linkIcon(k, u) : `<a class="yp-lk" href="${esc(u)}" target="_blank" rel="noopener" aria-label="${LINKS[k]} (opens in a new tab)" title="${LINKS[k]}">${phIcon(k)}</a>`).join("");
  }
  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; }
    catch {
      const ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", ""); ta.style.cssText = "position:fixed;opacity:0;top:0";
      document.body.appendChild(ta); ta.select();
      let ok = false;
      try { ok = document.execCommand("copy"); } catch { ok = false; }
      ta.remove();
      return ok;
    }
  }

  customElements.define("yarn-player", YarnPlayerEl);

  // the record, for pages that want the same disc → the kit's Yarn.disc (one component)
  function discHTML(t, { size = 60, spinning = false } = {}) {
    t = t ? resolve(t) || t : null;
    if (window.Yarn?.disc) return window.Yarn.disc(t, { size, spinning, label: DISC_LABEL === "cat" ? "cat" : null });
    return "";
  }

  window.YarnPlayer = {
    play, toggle, pause, next, prev, seek, enqueue,
    playNext, remove, has, // i4
    get queue() { return S.queue.slice(S.index + 1); }, // i4: what's up next (resolved tracks)
    setShuffle: (on) => setShuffle(on == null ? !S.shuffle : !!on),
    setVolume, setMuted,
    expand: () => EL?.setView("panel"),
    collapse: () => EL?.setView("bar"),
    minimize: () => EL?.setView("disc"),
    show: () => EL?.setView("bar"),
    setView: (v) => EL?.setView(v),
    get view() { return EL?.view || S.view; },
    get state() { return snapshot(); },
    get playing() { return S.playing; }, // i5 (chrome · G8): also html.y-playing
    on(fn) { subs.add(fn); return () => subs.delete(fn); },
    get library() { return library(); },
    resolve, swatch, durationOf, icon, discHTML, linksHTML: (t) => linksHTML(resolve(t) || t), copyText,
    meta: { INST, STATUS, LINKS, dates, md, fmt, esc },
  };
})();
