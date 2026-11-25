/* ============================================================
   kit/notes.js · felt/paper/crayon particle bursts (owner: home)
   window.Notes.burst(el, { preset, texture, glyphs, count })
     - a few cut-outs pop out of `el`, arc up/sideways, then fall with
       gravity + spin off the bottom of the viewport ("rise" presets
       float up and fade instead).
     - one shared fixed <canvas>, pointer-events:none, no layout shift.
     - sprites are pre-rendered once per glyph x texture (SVG filters
       baked into small bitmaps), then reused. rAF only while alive.
     - no-op under prefers-reduced-motion or ?reduced.
   Textures: "felt" (fuzzy black felt), "paper" (black construction
   paper, scissor edge), "crayon" (waxy crayon / chalk pastel).
   Default texture: ?notes=felt|paper|crayon, else "felt".
   Presets: "music" (the star), "projects", "thoughts" (quieter).
   Usage elsewhere:  window.Notes?.burst(btn, "music")
   Layering: the canvas defaults to z-index 60; Notes.config({ zIndex }) lets a
   page slot it between its background and its text (home uses 2, text at 3).
   ============================================================ */
(() => {
  const params = new URLSearchParams(location.search);
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches || params.has("reduced");
  const TEXTURES = ["felt", "paper", "crayon"];
  const INK = "#1f1e1e";

  // ---- glyph shapes, 64x64 box ----
  const HEAD = (cx, cy) => `<ellipse cx="${cx}" cy="${cy}" rx="10.5" ry="7.6" transform="rotate(-24 ${cx} ${cy})"/>`;
  const GLYPHS = {
    quarter: `${HEAD(25, 48)}<rect x="31.6" y="12" width="5" height="37" rx="2"/>`,
    eighth: `${HEAD(23, 48)}<rect x="29.6" y="10" width="5" height="39" rx="2"/><path d="M31 10 C34 20 46 21 47 33 C47.5 38 45 43 42 46 C44 40 44.5 35 41 30 C38 26 34 25 31 24 Z"/>`,
    sixteenth: `${HEAD(23, 50)}<rect x="29.6" y="9" width="5" height="42" rx="2"/><path d="M31 9 C34 17 45 18 46 27 C46.5 31 45 34 43 36 C44 31 43 28 40 26 C37 24 34 23 31 22 Z"/><path d="M31 19 C34 27 45 28 46 37 C46.5 41 45 44 43 46 C44 41 43 38 40 36 C37 34 34 33 31 32 Z"/>`,
    beamed: `${HEAD(15, 49)}${HEAD(44, 43)}<rect x="21.4" y="14" width="4.6" height="36" rx="2"/><rect x="50.4" y="8" width="4.6" height="36" rx="2"/><path d="M21.4 13 L55 6 L55 14.5 L21.4 21.5 Z"/>`,
    folder: `<path d="M8 18 Q8 13 13 13 L25 13 Q28 13 30 16 L32 19 L51 19 Q56 19 56 24 L56 47 Q56 52 51 52 L13 52 Q8 52 8 47 Z"/>`,
    code: `<path d="M24 18 L9 32 L24 46" fill="none" stroke="${INK}" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M40 18 L55 32 L40 46" fill="none" stroke="${INK}" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M35 13 L29 51" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`,
    cloud: `<path d="M15 46 Q5 46 6 37 Q7 29 16 29 Q16 17 29 16 Q40 16 43 25 Q52 22 56 30 Q61 38 55 44 Q53 46 48 46 Z" fill="#fffdf8" stroke="${INK}" stroke-width="2.4" stroke-dasharray="3.2 2.6" stroke-linecap="round"/>`,
    cloudLine: `<path d="M15 46 Q5 46 6 37 Q7 29 16 29 Q16 17 29 16 Q40 16 43 25 Q52 22 56 30 Q61 38 55 44 Q53 46 48 46 Z" fill="none" stroke="${INK}" stroke-width="4.2" stroke-linejoin="round"/><path d="M22 34 Q26 29 31 31" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
    cloudPaper: `<path d="M15 46 Q5 46 6 37 Q7 29 16 29 Q16 17 29 16 Q40 16 43 25 Q52 22 56 30 Q61 38 55 44 Q53 46 48 46 Z"/>`,
  };

  // ---- texture filters (applied to the glyph group) ----
  const FILTERS = {
    felt: (seed) => `
      <filter id="t" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="2" seed="${seed}" result="n"/>
        <feDisplacementMap in="SourceGraphic" in2="n" scale="2.6" xChannelSelector="R" yChannelSelector="G" result="shape"/>
        <feMorphology in="shape" operator="dilate" radius="1.1" result="halo"/>
        <feTurbulence type="fractalNoise" baseFrequency="2.6" numOctaves="1" seed="${seed + 7}" result="fib"/>
        <feComposite in="fib" in2="halo" operator="in" result="fz"/>
        <feColorMatrix in="fz" type="matrix" values="0 0 0 0 .14  0 0 0 0 .13  0 0 0 0 .13  0 0 0 2.2 -1.05" result="fuzz"/>
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  2.2 0 0 0 -1.25" result="sp"/>
        <feComposite in="sp" in2="shape" operator="in" result="speck"/>
        <feMerge><feMergeNode in="fuzz"/><feMergeNode in="shape"/><feMergeNode in="speck"/></feMerge>
      </filter>`,
    paper: (seed, light) => `
      <filter id="t" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB">
        <feTurbulence type="turbulence" baseFrequency=".032" numOctaves="1" seed="${seed}" result="low"/>
        <feDisplacementMap in="SourceGraphic" in2="low" scale="4.6" xChannelSelector="R" yChannelSelector="G" result="cut0"/>
        <feTurbulence type="fractalNoise" baseFrequency=".5" numOctaves="1" seed="${seed + 9}" result="nick"/>
        <feDisplacementMap in="cut0" in2="nick" scale="1.6" xChannelSelector="R" yChannelSelector="G" result="cut"/>
        <feComponentTransfer in="cut" result="crisp"><feFuncA type="discrete" tableValues="0 1 1 1"/></feComponentTransfer>
        <feFlood flood-color="${light ? "#fdfbf6" : "#2b2928"}" result="pc"/>
        <feComposite in="pc" in2="crisp" operator="in" result="body"/>
        <feTurbulence type="fractalNoise" baseFrequency=".28 2.4" numOctaves="2" seed="${seed + 3}" result="fibers"/>
        <feColorMatrix in="fibers" type="matrix" values="${light ? "0 0 0 0 .78  0 0 0 0 .75  0 0 0 0 .7  1.8 0 0 0 -1.05" : "0 0 0 0 .55  0 0 0 0 .53  0 0 0 0 .51  2.4 0 0 0 -1.3"}" result="fl"/>
        <feComposite in="fl" in2="crisp" operator="in" result="fibIn"/>
        <feMorphology in="crisp" operator="erode" radius=".8" result="inner"/>
        <feComposite in="crisp" in2="inner" operator="out" result="edge"/>
        <feColorMatrix in="edge" type="matrix" values="${light ? "0 0 0 0 .55  0 0 0 0 .52  0 0 0 0 .5  0 0 0 .55 0" : "0 0 0 0 .5  0 0 0 0 .48  0 0 0 0 .46  0 0 0 .7 0"}" result="edgeL"/>
        <feDropShadow in="body" dx=".3" dy="1.4" stdDeviation=".6" flood-color="#000" flood-opacity=".32" result="sh"/>
        <feMerge><feMergeNode in="sh"/><feMergeNode in="fibIn"/><feMergeNode in="edgeL"/></feMerge>
      </filter>`,
    crayon: (seed) => `
      <filter id="t" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" seed="${seed}" result="n"/>
        <feDisplacementMap in="SourceGraphic" in2="n" scale="3.2" xChannelSelector="R" yChannelSelector="G" result="rough"/>
        <feTurbulence type="fractalNoise" baseFrequency=".09 1.7" numOctaves="3" seed="${seed + 5}" result="wax"/>
        <feColorMatrix in="wax" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.3 1.95" result="waxA"/>
        <feComposite in="rough" in2="waxA" operator="in" result="body"/>
        <feMorphology in="rough" operator="erode" radius="1.6" result="inner"/>
        <feComposite in="rough" in2="inner" operator="out" result="rim"/>
        <feComposite in="rim" in2="n" operator="in" result="rimN"/>
        <feColorMatrix in="body" type="matrix" values="0 0 0 0 .12  0 0 0 0 .115  0 0 0 0 .115  0 0 0 1 0" result="bodyC"/>
        <feMerge><feMergeNode in="bodyC"/><feMergeNode in="rimN"/></feMerge>
      </filter>`,
  };

  // ---- presets ----
  const PRESETS = {
    // launch low and wide: a short pop (apex ~40-65 px above the button) that fans
    // sideways, so the arc mostly clears text above the trigger before it falls away
    music: { glyphs: ["eighth", "beamed", "quarter", "sixteenth"], count: 5, size: [30, 44], vy: [-460, -300], vx: 360, gravity: 1650, spin: 5.5, kind: "fall" },
    projects: { glyphs: ["folder", "code"], count: 3, size: [21, 29], vy: [-330, -220], vx: 190, gravity: 1500, spin: 2.6, kind: "fall" },
    thoughts: { glyphs: ["cloud"], count: 3, size: [27, 38], vy: [-62, -36], vx: 95, gravity: -20, spin: 0.4, kind: "rise", life: 1300 },
  };

  // ---- sprite cache ----
  const SPR = 128; // bitmap px per sprite (crisp at ~40 css px @2x)
  const sprites = new Map(); // key -> {img, ready}
  function spriteKey(g, tex, v) { return `${g}|${tex}|${v}`; }
  function makeSprite(glyph, tex, variant) {
    const key = spriteKey(glyph, tex, variant);
    if (sprites.has(key)) return sprites.get(key);
    const seed = 3 + variant * 11 + glyph.length;
    const cloud = glyph === "cloud";
    const shape = cloud ? (tex === "crayon" ? GLYPHS.cloudLine : tex === "paper" ? GLYPHS.cloudPaper : GLYPHS.cloud) : GLYPHS[glyph];
    const fill = cloud && tex === "felt" ? "" : `fill="${INK}"`;
    const tilt = tex === "crayon" ? 32 : 0;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SPR}" height="${SPR}" viewBox="0 0 64 64"><defs>${FILTERS[tex](seed, cloud)}</defs><g filter="url(#t)" transform="rotate(${tilt} 32 32)" ${fill}><g transform="rotate(${-tilt} 32 32)">${shape}</g></g></svg>`;
    const img = new Image();
    const rec = { img, ready: false };
    img.onload = () => (rec.ready = true);
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    sprites.set(key, rec);
    return rec;
  }
  function preload(texture = Notes.texture, presetNames = Object.keys(PRESETS)) {
    for (const p of presetNames) for (const g of PRESETS[p].glyphs) for (let v = 0; v < 2; v++) makeSprite(g, texture, v);
  }

  // ---- canvas + loop ----
  let cvs, ctx, dpr = 1, raf = 0, last = 0;
  const parts = [];
  const cfg = { zIndex: 60, max: 48 };
  function ensureCanvas() {
    if (cvs) return;
    cvs = document.createElement("canvas");
    cvs.className = "notes-canvas";
    cvs.setAttribute("aria-hidden", "true");
    Object.assign(cvs.style, { position: "fixed", inset: "0", width: "100vw", height: "100vh", pointerEvents: "none", zIndex: String(cfg.zIndex) });
    document.body.appendChild(cvs);
    ctx = cvs.getContext("2d");
    resize();
    addEventListener("resize", resize);
  }
  function resize() {
    if (!cvs) return;
    dpr = Math.min(2, devicePixelRatio || 1);
    cvs.width = Math.round(innerWidth * dpr);
    cvs.height = Math.round(innerHeight * dpr);
  }
  function step(dt) {
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.age += dt * 1000;
      if (p.age < 0) continue; // staggered launch
      p.vy += p.g * dt;
      p.vx *= p.kind === "rise" ? 0.99 : 0.996;
      p.x += p.vx * dt + (p.kind === "rise" ? Math.sin(p.age / 260 + p.seed) * 0.35 : 0);
      p.y += p.vy * dt;
      p.r += p.vr * dt;
      const dead = p.kind === "rise" ? p.age > p.life : p.y - p.size > innerHeight + 20;
      if (dead) parts.splice(i, 1);
    }
  }
  function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    for (const p of parts) {
      if (p.age < 0 || !p.spr.ready) continue;
      const pop = Math.min(1, p.age / 140);
      const s = p.size * (0.35 + 0.65 * (1 - Math.pow(1 - pop, 3)));
      let a = 1;
      if (p.kind === "rise") a = Math.min(1, p.age / 120) * (1 - Math.max(0, (p.age - p.life * 0.55) / (p.life * 0.45)));
      ctx.globalAlpha = Math.max(0, a);
      ctx.setTransform(dpr, 0, 0, dpr, p.x * dpr, p.y * dpr);
      ctx.rotate(p.r);
      ctx.drawImage(p.spr.img, -s / 2, -s / 2, s, s);
    }
    ctx.globalAlpha = 1;
  }
  let frozen = false;
  function tick(now) {
    if (frozen) { raf = 0; return; }
    step(Math.min(0.033, (now - last) / 1000 || 0.016));
    last = now;
    draw();
    if (parts.length) raf = requestAnimationFrame(tick);
    else { raf = 0; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cvs.width, cvs.height); }
  }

  const lastBurst = new WeakMap();
  let rand = Math.random;
  const rnd = (a, b) => a + rand() * (b - a);

  function burst(el, opts = {}) {
    if (!el || reduced()) return;
    if (typeof opts === "string") opts = { preset: opts };
    const base = PRESETS[opts.preset || "music"] || PRESETS.music;
    const o = { ...base, ...opts };
    const texture = TEXTURES.includes(o.texture) ? o.texture : Notes.texture;
    const now = performance.now();
    if (now - (lastBurst.get(el) || -1e9) < (o.throttle ?? 650)) return;
    lastBurst.set(el, now);
    ensureCanvas();
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const n = Math.min(o.count, cfg.max - parts.length);
    for (let i = 0; i < n; i++) {
      const glyph = o.glyphs[(i + Math.floor(rand() * o.glyphs.length)) % o.glyphs.length];
      const spr = makeSprite(glyph, texture, i % 2);
      // spread launch points along the top edge, fan outward from centre
      const fx = (i + 0.5) / n - 0.5 + rnd(-0.08, 0.08);
      const x = cx + fx * r.width * 0.7;
      const y = r.top + r.height * (o.kind === "rise" ? 0.25 : 0.45);
      parts.push({
        x, y, kind: o.kind, g: o.gravity, life: o.life || 0, seed: rand() * 6,
        vx: fx * 2 * o.vx + rnd(-0.25, 0.25) * o.vx,
        vy: rnd(o.vy[0], o.vy[1]),
        r: rnd(-0.35, 0.35), vr: rnd(-1, 1) * o.spin,
        size: rnd(o.size[0], o.size[1]),
        age: -i * 38, spr,
      });
    }
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
  }

  const Notes = {
    burst,
    preload,
    presets: PRESETS,
    glyphs: Object.keys(GLYPHS).filter((g) => !/^cloud./.test(g)),
    textures: TEXTURES,
    texture: TEXTURES.includes(params.get("notes")) ? params.get("notes") : "felt",
    config(c) { Object.assign(cfg, c); if (cvs && c.zIndex != null) cvs.style.zIndex = String(c.zIndex); },
    // data: URL of a baked sprite (e.g. for static decoration)
    spriteURL(glyph, texture = Notes.texture, variant = 0) { return makeSprite(glyph, texture, variant).img.src; },
    // mock/screenshot helpers: seeded randomness + advance-and-freeze
    seed(n) { let x = n >>> 0 || 1; rand = () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296); },
    whenReady() { return Promise.all([...sprites.values()].map((r) => r.ready ? 0 : new Promise((res) => r.img.addEventListener("load", res, { once: true })))); },
    freeze(ms) { frozen = true; for (let t = 0; t < ms; t += 1000 / 60) step(1 / 60); if (cvs) draw(); },
  };
  window.Notes = Notes;
})();
