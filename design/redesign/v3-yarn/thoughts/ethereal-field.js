/* ============================================================
   Thoughts · Ethereal · ambient night field (one canvas)
   - ~30–70 dust motes, drifting a few px/s, gentle twinkle
   - seeded + clock-based: the same sky continues across page loads
   - ~30 fps cap, paused when the tab is hidden or the lightbox is open
   - ?field=still or reduced motion: one static frame; ?field=off: none
   - the reading column is masked out in CSS (#field --cl/--cr/--ca)
   ============================================================ */
(() => {
  const P = new URLSearchParams(location.search);
  const mode = P.get("field") || "drift";
  const cv = document.getElementById("field");
  if (!cv) return;
  if (mode === "off") { cv.remove(); window.EthField = { pause() {}, resume() {} }; return; }

  const mq = matchMedia("(prefers-reduced-motion: reduce)");
  const isStatic = () => mode === "still" || mq.matches || P.has("reduced");
  const ctx = cv.getContext("2d", { alpha: true });

  let W = 0, H = 0, dpr = 1, motes = [], raf = 0, last = 0, paused = false;

  // tiny seeded RNG so every page shows the same sky
  const rng = (s) => () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);

  // pre-rendered glow sprites: starlight, gold, ember
  const sprite = (rgb) => {
    const c = document.createElement("canvas");
    c.width = c.height = 32;
    const g = c.getContext("2d");
    const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    gr.addColorStop(0, `rgba(${rgb},1)`);
    gr.addColorStop(0.18, `rgba(${rgb},.85)`);
    gr.addColorStop(0.42, `rgba(${rgb},.18)`);
    gr.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = gr;
    g.fillRect(0, 0, 32, 32);
    return c;
  };
  const SPRITES = [sprite("255,244,228"), sprite("246,206,130"), sprite("255,140,120"), sprite("196,184,255")];

  function build() {
    dpr = Math.min(1.5, window.devicePixelRatio || 1);
    W = innerWidth; H = innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const r = rng(20261108);
    const n = Math.round(Math.max(28, Math.min(70, (W * H) / 21000)));
    motes = Array.from({ length: n }, () => {
      const pick = r();
      return {
        x: r() * 4000, y: r() * 4000,
        z: 0.25 + r() * 0.75,                 // depth: speed, size, parallax
        s: 0.6 + r() * r() * 2.6,             // radius-ish
        a: 0.18 + r() * 0.5,                  // base alpha
        ph: r() * Math.PI * 2, tw: 0.15 + r() * 0.35,
        k: pick < 0.72 ? 0 : pick < 0.86 ? 1 : pick < 0.94 ? 3 : 2,
      };
    });
  }

  const WIND_X = 1.4, WIND_Y = -2.2; // px/s, rising like dust in a light beam

  function draw(tSec) {
    ctx.clearRect(0, 0, W, H);
    const sy = isStatic() ? 0 : window.scrollY;
    for (const m of motes) {
      const t = isStatic() ? 0 : tSec;
      const x = (((m.x + t * WIND_X * m.z) % W) + W) % W;
      const y = (((m.y + t * WIND_Y * m.z - sy * m.z * 0.08) % H) + H) % H;
      const tw = isStatic() ? 0.85 : 0.72 + 0.28 * Math.sin(m.ph + tSec * m.tw);
      const size = m.s * 7 * (0.6 + m.z * 0.6);
      ctx.globalAlpha = m.a * tw;
      ctx.drawImage(SPRITES[m.k], x - size / 2, y - size / 2, size, size);
    }
    ctx.globalAlpha = 1;
  }

  const clock = () => (performance.timeOrigin + performance.now()) / 1000 % 100000;

  function frame(now) {
    raf = 0;
    if (paused || document.hidden || isStatic()) return;
    if (now - last >= 32) { last = now; draw(clock()); }
    raf = requestAnimationFrame(frame);
  }
  function start() {
    if (isStatic()) { draw(0); return; }
    if (!raf && !paused && !document.hidden) raf = requestAnimationFrame(frame);
  }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; }

  build();
  draw(isStatic() ? 0 : clock());
  start();

  let rt = 0;
  addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { build(); draw(isStatic() ? 0 : clock()); }, 120); });
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  mq.addEventListener?.("change", () => { stop(); draw(0); start(); });
  // static mode still follows nothing; drift mode follows scroll via the loop

  window.EthField = {
    pause() { paused = true; stop(); },
    resume() { paused = false; start(); },
  };
})();
