/* ============================================================
   Thoughts · Ethereal · lightbox
   - zooms out of the thumbnail's rect (crop and all) and back into it
   - dims behind; caption; prev/next via buttons, ←/→, and swipe with
     momentum projection; drag down to dismiss with velocity handoff
   - Esc closes; focus trapped while open and returned to the thumbnail
   - springs (Apple-style response/damping), interruptible: every
     animation starts from the on-screen value
   - reduced motion: cross-fades only
   window.EthLightbox.open({ id, title, items:[{src,alt}], index, thumbs:[el] })
   ============================================================ */
(() => {
  const P = new URLSearchParams(location.search);
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches || P.has("reduced");
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const lerpRect = (A, B, t) => ({ x: lerp(A.x, B.x, t), y: lerp(A.y, B.y, t), w: lerp(A.w, B.w, t), h: lerp(A.h, B.h, t) });
  const scaleRect = (R, k) => ({ x: R.x + (R.w * (1 - k)) / 2, y: R.y + (R.h * (1 - k)) / 2, w: R.w * k, h: R.h * k });
  // Apple's projection (Designing Fluid Interfaces): where a flick would come to rest
  const project = (v, d = 0.995) => ((v / 1000) * d) / (1 - d);
  const rubber = (o, dim, c = 0.55) => (o * dim * c) / (dim + c * o);

  // ---------- springs ----------
  let raf = 0, last = 0;
  class Spring {
    constructor(x, eps) { this.x = x; this.v = 0; this.target = x; this.eps = eps; this.running = false; this.tune(0.4, 1); }
    tune(response, damping) { const w = (2 * Math.PI) / response; this.k = w * w; this.c = 2 * damping * w; return this; }
    to(target, v) { this.target = target; if (v !== undefined) this.v = v; this.running = true; kick(); return this; }
    set(x) { this.x = x; this.target = x; this.v = 0; this.running = false; }
    step(dt) {
      const n = Math.max(1, Math.ceil(dt * 240)), h = dt / n;
      for (let i = 0; i < n; i++) { const a = -this.k * (this.x - this.target) - this.c * this.v; this.v += a * h; this.x += this.v * h; }
      if (Math.abs(this.x - this.target) < this.eps && Math.abs(this.v) < this.eps * 12) { this.x = this.target; this.v = 0; this.running = false; }
    }
  }
  const sp = { p: new Spring(0, 0.0008), pos: new Spring(0, 0.3), ty: new Spring(0, 0.3) };
  function kick() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } }
  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    let alive = false;
    for (const s of Object.values(sp)) if (s.running) { s.step(dt); alive = alive || s.running; }
    render();
    if (alive) raf = requestAnimationFrame(tick);
    else { raf = 0; settled(); }
  }

  // ---------- DOM ----------
  let root, scrim, stage, track, chrome, countEl, titleEl, subEl, dotsEl, btnPrev, btnNext, btnClose;
  let S = null, drag = null, W = innerWidth, H = innerHeight;

  function ensure() {
    if (root) return;
    root = document.createElement("div");
    root.className = "lb";
    root.hidden = true;
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-labelledby", "lb-title");
    root.setAttribute("aria-describedby", "lb-sub");
    root.innerHTML = `
      <div class="lb__scrim"></div>
      <div class="lb__stage"><div class="lb__track"></div></div>
      <div class="lb__chrome">
        <p class="lb__count" aria-hidden="true"></p>
        <button type="button" class="lb__btn lb__close" aria-label="Close image viewer"><i class="ph ph-x" aria-hidden="true"></i></button>
        <button type="button" class="lb__btn lb__prev" aria-label="Previous image"><i class="ph ph-caret-left" aria-hidden="true"></i></button>
        <button type="button" class="lb__btn lb__next" aria-label="Next image"><i class="ph ph-caret-right" aria-hidden="true"></i></button>
        <div class="lb__cap" aria-live="polite"><h2 class="lb__title" id="lb-title"></h2><p class="lb__sub" id="lb-sub"></p><div class="lb__dots" aria-hidden="true"></div></div>
        <p class="lb__keys" aria-hidden="true"><kbd>←</kbd> <kbd>→</kbd> browse · <kbd>esc</kbd> close · drag down to dismiss</p>
      </div>`;
    document.body.appendChild(root);
    const q = (s) => root.querySelector(s);
    scrim = q(".lb__scrim"); stage = q(".lb__stage"); track = q(".lb__track"); chrome = q(".lb__chrome");
    countEl = q(".lb__count"); titleEl = q(".lb__title"); subEl = q(".lb__sub"); dotsEl = q(".lb__dots");
    btnPrev = q(".lb__prev"); btnNext = q(".lb__next"); btnClose = q(".lb__close");
    btnClose.addEventListener("click", () => close());
    btnPrev.addEventListener("click", () => go(S.cur - 1));
    btnNext.addEventListener("click", () => go(S.cur + 1));
    stage.addEventListener("pointerdown", onDown);
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerup", onUp);
    stage.addEventListener("pointercancel", onUp);
    root.addEventListener("wheel", (e) => e.preventDefault(), { passive: false });
    document.addEventListener("keydown", onKey);
    addEventListener("resize", onResize);
  }

  // ---------- geometry ----------
  function pads() {
    return innerWidth < 960 ? { t: 72, b: 132, s: 12 } : { t: 76, b: 124, s: 104 };
  }
  function fit(nat) {
    const { t, b, s } = pads();
    const aw = W - s * 2, ah = H - t - b;
    const k = Math.min(aw / nat.w, ah / nat.h, innerWidth < 960 ? 2 : 1.15); // don't blow small images up
    const w = nat.w * k, h = nat.h * k;
    return { x: (W - w) / 2, y: t + (ah - h) / 2, w, h };
  }
  function layout() {
    S.slides.forEach((sl, i) => {
      sl.el.style.left = i * W + "px";
      sl.el.style.width = W + "px";
      if (!sl.nat) return;
      sl.F = fit(sl.nat);
      Object.assign(sl.img.style, { left: sl.F.x + "px", top: sl.F.y + "px", width: sl.F.w + "px", height: sl.F.h + "px" });
    });
  }
  // where the zoom starts (p = 0): the thumbnail, as an uncropped image + crop insets
  function setZoom(toRect) {
    const sl = S.slides[S.cur], th = S.thumbs[S.cur];
    S.zoomTo = toRect || null;
    const T = th?.getBoundingClientRect();
    const visible = T && T.width > 0 && T.bottom > 0 && T.top < H && T.right > 0 && T.left < W;
    if (visible && sl.F) {
      const k = Math.max(T.width / sl.nat.w, T.height / sl.nat.h);
      const C = { w: sl.nat.w * k, h: sl.nat.h * k };
      C.x = T.left + (T.width - C.w) / 2;
      C.y = T.top + (T.height - C.h) / 2;
      const k0 = C.w / sl.F.w;
      S.zoomFrom = C;
      S.crop = { t: (T.top - C.y) / k0, l: (T.left - C.x) / k0, r: (C.x + C.w - T.right) / k0, b: (C.y + C.h - T.bottom) / k0 };
      S.thumbR = parseFloat(getComputedStyle(th).borderTopLeftRadius) || 12;
      S.fadeImg = false;
    } else {
      S.zoomFrom = scaleRect(toRect || sl.F, 0.92);
      S.crop = null;
      S.fadeImg = true;
    }
  }
  function currentRect() {
    const sl = S.slides[S.cur];
    const A = S.zoomFrom || sl.F, B = S.zoomTo || sl.F;
    let R = lerpRect(A, B, sp.p.x);
    const down = Math.max(0, sp.ty.x);
    const ds = 1 - Math.min(0.28, (down / H) * 0.5);
    return { x: R.x + (R.w * (1 - ds)) / 2, y: R.y + (R.h * (1 - ds)) / 2 + sp.ty.x, w: R.w * ds, h: R.h * ds };
  }

  // ---------- render ----------
  function render() {
    if (!S) return;
    track.style.transform = `translate3d(${sp.pos.x}px,0,0)`;
    const sl = S.slides[S.cur];
    const p = sp.p.x, down = Math.max(0, sp.ty.x);
    if (sl.F) {
      const R = currentRect(), F = sl.F, k = R.w / F.w;
      sl.img.style.transform = `translate3d(${R.x - F.x}px, ${R.y - F.y}px, 0) scale(${k})`;
      if (S.crop) {
        const q = clamp(1 - p, 0, 1), c = S.crop;
        const r = (S.thumbR * q + 10 * (1 - q)) / k;
        sl.img.style.clipPath = `inset(${c.t * q}px ${c.r * q}px ${c.b * q}px ${c.l * q}px round ${r}px)`;
      } else sl.img.style.clipPath = "";
      sl.img.style.opacity = S.fadeImg ? clamp(p * 1.3, 0, 1) : 1;
    }
    scrim.style.opacity = clamp(p, 0, 1) * (1 - clamp(down / (H * 0.55), 0, 1) * 0.9);
    chrome.style.opacity = clamp((p - 0.55) / 0.45, 0, 1) * (1 - clamp(down / 140, 0, 1));
  }

  function updateChrome() {
    const it = S.items[S.cur], n = S.items.length;
    countEl.textContent = n > 1 ? `${S.cur + 1} / ${n}` : "";
    titleEl.textContent = it.alt || S.title;
    subEl.textContent = S.title;
    btnPrev.setAttribute("aria-label", S.cur > 0 ? `Previous image (${S.cur} of ${n})` : "Previous image");
    btnNext.setAttribute("aria-label", S.cur < n - 1 ? `Next image (${S.cur + 2} of ${n})` : "Next image");
    dotsEl.innerHTML = n > 1 ? S.items.map((_, i) => `<span class="${i === S.cur ? "on" : ""}"></span>`).join("") : "";
    btnPrev.setAttribute("aria-disabled", String(S.cur === 0));
    btnNext.setAttribute("aria-disabled", String(S.cur === n - 1));
    S.slides.forEach((s, i) => {
      s.el.classList.toggle("is-cur", i === S.cur);
      s.el.setAttribute("aria-hidden", String(i !== S.cur));
      if (i !== S.cur) { s.img.style.transform = ""; s.img.style.clipPath = ""; s.img.style.opacity = ""; }
    });
  }
  function liftThumb() {
    S.thumbs.forEach((t) => t?.classList.remove("is-lifted"));
    S.thumbs[S.cur]?.classList.add("is-lifted");
  }
  function setInert(on) {
    for (const el of [document.getElementById("shell"), document.querySelector("yarn-player")]) if (el) el.inert = on;
    document.documentElement.style.overflow = on ? "hidden" : "";
    document.documentElement.classList.toggle("lb-open", on);
  }
  function syncURL() {
    const u = new URL(location.href);
    if (S) u.searchParams.set("lightbox", `${S.id}:${S.cur}`);
    else u.searchParams.delete("lightbox");
    history.replaceState(history.state, "", u);
  }

  // ---------- open / close / go ----------
  async function open({ id, title = "", items, index = 0, thumbs = [], instant = false }) {
    ensure();
    if (S || !items?.length) return;
    W = innerWidth; H = innerHeight;
    S = { id, title, items, thumbs, cur: clamp(index, 0, items.length - 1), slides: [], state: "opening", lastFocus: document.activeElement };
    track.innerHTML = "";
    S.slides = items.map((it, i) => {
      const el = document.createElement("div");
      el.className = "lb__slide";
      const img = new Image();
      img.className = "lb__img";
      img.alt = it.alt || "";
      img.draggable = false;
      el.appendChild(img);
      track.appendChild(el);
      const sl = { el, img, nat: null, F: null };
      const t = thumbs[i]?.querySelector("img");
      if (t && t.naturalWidth) sl.nat = { w: t.naturalWidth, h: t.naturalHeight };
      img.addEventListener("load", () => {
        if (!S || sl.nat) return;
        sl.nat = { w: img.naturalWidth, h: img.naturalHeight };
        layout(); render();
      });
      img.src = it.src;
      return sl;
    });
    root.classList.toggle("single", items.length < 2);
    const cur = S.slides[S.cur];
    if (!cur.nat) {
      try { await cur.img.decode(); } catch {}
      if (!S) return;
      cur.nat = { w: cur.img.naturalWidth || 1200, h: cur.img.naturalHeight || 800 };
    }
    layout();
    sp.pos.set(-S.cur * W); sp.ty.set(0);
    setZoom(null);
    root.classList.remove("is-settled", "fade-out", "fade-in");
    root.hidden = false;
    setInert(true); updateChrome(); syncURL(); liftThumb();
    window.EthField?.pause();
    if (instant || reduced()) {
      sp.p.set(1); render();
      if (!instant) root.classList.add("fade-in");
      finishOpen();
    } else {
      sp.p.set(0); render();
      sp.p.tune(0.46, 0.92).to(1);
    }
    btnClose.focus({ preventScroll: true });
  }
  function finishOpen() {
    S.state = "open";
    S.zoomTo = null;
    root.classList.add("is-settled");
  }
  function settled() {
    if (!S) return;
    if (S.state === "opening" && !sp.p.running) finishOpen();
    else if (S.state === "closing" && !sp.p.running) finishClose();
  }

  function close(vy = 0) {
    if (!S || S.state === "closing") return;
    // the image's current on-screen rect (drag + swipe included) is where the trip home starts
    const R = currentRect();
    const V = { ...R, x: R.x + (sp.pos.x + S.cur * W) };
    sp.ty.set(0); sp.pos.set(-S.cur * W);
    root.classList.remove("is-settled");
    S.state = "closing";
    if (reduced()) {
      root.classList.remove("fade-in");
      root.classList.add("fade-out");
      setTimeout(finishClose, 190);
      return;
    }
    setZoom(V);
    // hand the finger's velocity to the spring: px/s -> progress/s
    const d = V.y + V.h / 2 - (S.zoomFrom.y + S.zoomFrom.h / 2);
    const pv = Math.abs(d) > 24 ? clamp(vy / d, -7, 7) : 0;
    sp.p.set(1);
    sp.p.tune(0.42, 1).to(0, pv);
    render();
  }
  function finishClose() {
    if (!S) return;
    const back = S.thumbs[S.cur] || S.lastFocus;
    S.thumbs.forEach((t) => t?.classList.remove("is-lifted"));
    root.hidden = true;
    root.classList.remove("fade-out", "fade-in", "is-settled");
    setInert(false);
    S = null;
    syncURL();
    window.EthField?.resume();
    back?.focus?.({ preventScroll: true });
  }

  function go(i, v = 0) {
    if (!S || S.state === "closing") return;
    i = clamp(i, 0, S.items.length - 1);
    const changed = i !== S.cur;
    if (changed) { S.cur = i; updateChrome(); syncURL(); liftThumb(); }
    if (reduced()) {
      sp.pos.set(-i * W); render();
      if (changed) { const el = S.slides[i].el; el.classList.remove("fade-in"); void el.offsetWidth; el.classList.add("fade-in"); }
      return;
    }
    sp.pos.tune(0.36, 1).to(-i * W, v);
    if (sp.ty.x !== 0) sp.ty.tune(0.34, 1).to(0);
  }

  // ---------- gestures ----------
  function onDown(e) {
    if (!S || S.state === "closing" || e.button > 0) return;
    drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, pos0: sp.pos.x, ty0: sp.ty.x, axis: null,
      hist: [[e.timeStamp, e.clientX, e.clientY]], onImg: !!e.target.closest(".lb__img") };
    // grab: stop exactly where things are on screen (interruptible)
    sp.pos.running = false; sp.ty.running = false;
    stage.setPointerCapture(e.pointerId);
  }
  function onMove(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
    drag.hist.push([e.timeStamp, e.clientX, e.clientY]);
    while (drag.hist.length > 2 && e.timeStamp - drag.hist[0][0] > 90) drag.hist.shift();
    if (!drag.axis) {
      if (Math.hypot(dx, dy) < 8) return;
      drag.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    }
    if (drag.axis === "x") {
      const max = 0, min = -(S.items.length - 1) * W;
      let x = drag.pos0 + dx;
      if (x > max) x = max + rubber(x - max, W);
      else if (x < min) x = min - rubber(min - x, W);
      sp.pos.set(x);
    } else {
      let y = drag.ty0 + dy;
      if (y < 0) y = -rubber(-y, H);
      sp.ty.set(y);
    }
    render();
  }
  function onUp(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag; drag = null;
    d.hist.push([e.timeStamp, e.clientX, e.clientY]);
    const a = d.hist[0], b = d.hist[d.hist.length - 1], dt = (b[0] - a[0]) / 1000;
    const vx = dt > 0.008 ? (b[1] - a[1]) / dt : 0, vy = dt > 0.008 ? (b[2] - a[2]) / dt : 0;
    if (!d.axis) {
      if (!d.onImg && e.type === "pointerup") return close();
      go(S.cur); if (sp.ty.x) sp.ty.to(0);
      return;
    }
    // commit or cancel: the direction of the release velocity decides first, then
    // where the momentum would carry it (projection), so a flick always turns the page
    if (d.axis === "x") {
      const off = sp.pos.x + S.cur * W; // < 0: pulled toward the next image
      const proj = off + project(vx);
      let t = S.cur;
      if (Math.abs(vx) > 320) t += vx < 0 ? 1 : -1;
      else if (Math.abs(proj) > Math.min(W * 0.3, 240)) t += proj < 0 ? 1 : -1;
      go(clamp(t, S.cur - 1, S.cur + 1), vx);
    } else {
      const proj = sp.ty.x + project(vy);
      const dismiss = sp.ty.x > 24 && (vy > 450 || (vy > -150 && proj > Math.min(H * 0.2, 180)));
      if (dismiss) close(vy);
      else if (reduced()) { sp.ty.set(0); render(); }
      else sp.ty.tune(0.34, Math.abs(vy) > 300 ? 0.8 : 1).to(0, vy);
    }
  }
  function onKey(e) {
    if (!S) return;
    if (e.key === "Escape") { e.preventDefault(); close(); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); go(S.cur - 1); }
    else if (e.key === "ArrowRight") { e.preventDefault(); go(S.cur + 1); }
    else if (e.key === "Tab") {
      const f = [...root.querySelectorAll("button")].filter((b) => b.offsetParent !== null && b.getAttribute("aria-disabled") !== "true");
      if (!f.length) return;
      e.preventDefault();
      const i = f.indexOf(document.activeElement);
      f[e.shiftKey ? (i <= 0 ? f.length - 1 : i - 1) : (i + 1) % f.length].focus();
    }
  }
  function onResize() {
    if (!S) return;
    W = innerWidth; H = innerHeight;
    layout();
    sp.pos.set(-S.cur * W);
    if (S.state === "open") S.zoomTo = null;
    render();
  }

  window.EthLightbox = { open, close, get isOpen() { return !!S; } };
})();
