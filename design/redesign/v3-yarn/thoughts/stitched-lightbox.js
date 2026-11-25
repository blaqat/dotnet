/* ============================================================
   Thoughts · "Stitched" lightbox (mock-only)
   - shared element: media zooms out of its thumbnail's exact rect
     (incl. object-fit crop + corner radius) and back into it
   - one spring loop drives everything, so any motion can be grabbed
     mid-flight and continues from what is on screen
   - drag down/up to dismiss (velocity handed to the close spring),
     swipe / arrows / keys to page with rubber-banding at the ends
   - dialog semantics: aria-modal, page made inert, focus trapped,
     focus returned to the (current) thumbnail, live announcements
   - reduced motion: cross-fades only
   API: StitchLB.init({ getGroup(id) -> {id,title,items:[{src,alt,video}]}, getThumb(id,i) -> Element })
        StitchLB.open(id, index, openerEl)
   ============================================================ */
(() => {
  const RM = () => (window.Yarn?.reduced ? window.Yarn.reduced() : matchMedia("(prefers-reduced-motion: reduce)").matches);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const GAP = 28; // space between slides while paging

  let cfg = { getGroup: () => null, getThumb: () => null };
  let el, dim, track, chrome, btnClose, btnPrev, btnNext, btnPlay, titleEl, altEl, countEl, dotsEl, live;
  let G = null, idx = 0, slides = [], isOpen = false, closing = false, opener = null, thumbCache = new Map();
  let chromeOn = true;

  /* ---------- springs (semi-implicit Euler, sub-stepped) ---------- */
  const mk = (eps) => ({ v: 0, vel: 0, target: 0, k: 300, z: 1, on: false, eps, done: null });
  const S = { p: mk(0.0008), dx: mk(0.25), dy: mk(0.25), px: mk(0.25) };
  let raf = 0, last = 0;
  function animate(s, target, { k = 300, z = 1, vel, done = null } = {}) {
    s.target = target; s.k = k; s.z = z; s.done = done;
    if (vel !== undefined) s.vel = vel;
    s.on = true;
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
  }
  function tick(now) {
    let dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    let active = false;
    const finished = [];
    for (const s of Object.values(S)) {
      if (!s.on) continue;
      let t = dt;
      while (t > 1e-6) {
        const h = Math.min(t, 1 / 240);
        const c = 2 * s.z * Math.sqrt(s.k);
        s.vel += (-s.k * (s.v - s.target) - c * s.vel) * h;
        s.v += s.vel * h;
        t -= h;
      }
      if (Math.abs(s.v - s.target) < s.eps && Math.abs(s.vel) < s.eps * 20) {
        s.v = s.target; s.vel = 0; s.on = false;
        if (s.done) finished.push(s.done), (s.done = null);
      } else active = true;
    }
    render();
    raf = active ? requestAnimationFrame(tick) : 0;
    finished.forEach((f) => f());
  }
  const stop = (s) => { s.on = false; s.done = null; };

  /* ---------- geometry ---------- */
  const W = () => innerWidth, H = () => innerHeight;
  const pitch = () => W() + GAP;
  function insets() {
    return innerWidth < 960 ? { t: 72, b: 150, l: 10, r: 10 } : { t: 84, b: 132, l: 108, r: 108 };
  }
  function fit(item) {
    const m = insets();
    const aw = Math.max(80, W() - m.l - m.r), ah = Math.max(80, H() - m.t - m.b);
    const nw = item.w || 1600, nh = item.h || 1000;
    const s = Math.min(aw / nw, ah / nh, item.video ? 2 : 1.25); // don't blow small images up into mush
    const w = nw * s, h = nh * s;
    return { x: m.l + (aw - w) / 2, y: m.t + (ah - h) / 2, w, h };
  }
  function thumbRect(i) {
    if (thumbCache.has(i)) return thumbCache.get(i);
    const t = cfg.getThumb(G.id, i);
    let r = null;
    if (t && t.isConnected) {
      const b = t.getBoundingClientRect();
      const visible = b.width > 4 && b.height > 4 && b.bottom > 0 && b.top < H() && b.right > 0 && b.left < W();
      if (visible) r = { x: b.left, y: b.top, w: b.width, h: b.height, r: parseFloat(getComputedStyle(t).borderTopLeftRadius) || 0 };
    }
    thumbCache.set(i, r);
    return r;
  }
  function measure(item, i) {
    if (item.w) return Promise.resolve();
    return new Promise((res) => {
      const thumb = cfg.getThumb(G.id, i);
      const tm = thumb?.querySelector("img,video");
      if (tm && !item.video && tm.naturalWidth) { item.w = tm.naturalWidth; item.h = tm.naturalHeight; return res(); }
      if (tm && item.video && tm.videoWidth) { item.w = tm.videoWidth; item.h = tm.videoHeight; return res(); }
      const probe = item.video ? document.createElement("video") : new Image();
      const ok = () => { item.w = probe.naturalWidth || probe.videoWidth || 1600; item.h = probe.naturalHeight || probe.videoHeight || 1000; res(); };
      const bad = () => { item.w = 1600; item.h = 1000; item.missing = true; res(); };
      if (item.video) { probe.preload = "metadata"; probe.muted = true; probe.onloadedmetadata = ok; probe.onerror = bad; }
      else { probe.onload = ok; probe.onerror = bad; }
      probe.src = item.src;
      setTimeout(() => { if (!item.w) bad(); }, 2500);
    });
  }

  /* ---------- DOM ---------- */
  function build() {
    el = document.createElement("div");
    el.className = "lb";
    el.hidden = true;
    el.tabIndex = -1;
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("aria-labelledby", "lb-title");
    el.setAttribute("aria-describedby", "lb-alt lb-count");
    el.innerHTML = `
      <div class="lb__dim" aria-hidden="true"></div>
      <div class="lb__track" aria-hidden="false"></div>
      <div class="lb__chrome">
        <div class="lb__top">
          <p class="lb__count" id="lb-count"></p>
          <button type="button" class="lb__btn lb__play" hidden aria-label="Pause video"><i class="ph-fill ph-pause" aria-hidden="true"></i></button>
          <button type="button" class="lb__btn lb__close" aria-label="Close viewer"><i class="ph-bold ph-x" aria-hidden="true"></i></button>
        </div>
        <button type="button" class="lb__btn lb__nav lb__prev" aria-label="Previous"><i class="ph-bold ph-caret-left" aria-hidden="true"></i></button>
        <button type="button" class="lb__btn lb__nav lb__next" aria-label="Next"><i class="ph-bold ph-caret-right" aria-hidden="true"></i></button>
        <div class="lb__cap">
          <p class="lb__title" id="lb-title"></p>
          <p class="lb__alt" id="lb-alt"></p>
          <div class="lb__dots" aria-hidden="true"></div>
        </div>
      </div>
      <p class="sr-only" aria-live="polite" id="lb-live"></p>`;
    document.body.appendChild(el);
    dim = el.querySelector(".lb__dim");
    track = el.querySelector(".lb__track");
    chrome = el.querySelector(".lb__chrome");
    btnClose = el.querySelector(".lb__close");
    btnPrev = el.querySelector(".lb__prev");
    btnNext = el.querySelector(".lb__next");
    btnPlay = el.querySelector(".lb__play");
    titleEl = el.querySelector(".lb__title");
    altEl = el.querySelector(".lb__alt");
    countEl = el.querySelector(".lb__count");
    dotsEl = el.querySelector(".lb__dots");
    live = el.querySelector("#lb-live");

    btnClose.addEventListener("click", () => close());
    btnPrev.addEventListener("click", () => go(idx - 1));
    btnNext.addEventListener("click", () => go(idx + 1));
    btnPlay.addEventListener("click", () => toggleVideo());
    el.addEventListener("keydown", onKey);
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("wheel", (e) => e.preventDefault(), { passive: false });
    addEventListener("resize", () => { if (!isOpen) return; thumbCache.clear(); layoutSlides(); S.px.v = S.px.target = -idx * pitch(); render(); });
  }

  function buildSlides() {
    track.innerHTML = "";
    slides = G.items.map((it, i) => {
      const s = document.createElement("div");
      s.className = "lb__slide";
      s.setAttribute("aria-hidden", "true");
      let m;
      if (it.missing) {
        m = document.createElement("div");
        m.className = "lb__media t-missing";
        m.innerHTML = `<i class="ph ph-image-broken" aria-hidden="true"></i><span>media coming soon</span>`;
      } else if (it.video) {
        m = document.createElement("video");
        m.className = "lb__media";
        Object.assign(m, { src: it.src, muted: true, loop: true, playsInline: true, preload: "metadata" });
        m.setAttribute("aria-label", it.alt || "video");
        m.addEventListener("play", syncPlayBtn);
        m.addEventListener("pause", syncPlayBtn);
      } else {
        m = document.createElement("img");
        m.className = "lb__media";
        m.src = it.src;
        m.alt = it.alt || "";
        m.draggable = false;
        m.decoding = "async";
      }
      s.appendChild(m);
      track.appendChild(s);
      return { el: s, media: m, rect: null };
    });
    layoutSlides();
  }
  function layoutSlides() {
    slides.forEach((s, i) => {
      const it = G.items[i];
      s.rect = fit(it);
      Object.assign(s.el.style, { left: `${i * pitch()}px`, width: `${W()}px` });
      Object.assign(s.media.style, { left: `${s.rect.x}px`, top: `${s.rect.y}px`, width: `${s.rect.w}px`, height: `${s.rect.h}px` });
      if (i !== idx) { s.media.style.transform = ""; s.media.style.clipPath = ""; s.media.style.opacity = ""; }
    });
  }

  /* ---------- render one frame from spring state ---------- */
  function render() {
    if (!G || !slides[idx]) return;
    track.style.transform = `translate3d(${S.px.v}px,0,0)`;
    const sl = slides[idx], R = sl.rect;
    const p = S.p.v, pc = clamp(p, 0, 1);
    const off = idx * pitch() + S.px.v; // slide's on-screen x offset
    const Rc = { x: R.x + R.w / 2 + off, y: R.y + R.h / 2 };
    const drag = Math.min(1, Math.hypot(S.dx.v, S.dy.v) / (H() * 0.5));
    const sDrag = 1 - 0.3 * Math.min(1, Math.abs(S.dy.v) / (H() * 0.55));
    let T = thumbRect(idx), fade = 1;
    if (!T) { // source not on screen: shrink a little in place and fade
      T = { w: R.w * 0.86, h: R.h * 0.86, r: 8 };
      T.x = Rc.x + S.dx.v - T.w / 2; T.y = Rc.y + S.dy.v - T.h / 2;
      fade = pc;
    }
    const s0 = Math.max(T.w / R.w, T.h / R.h);
    const cx = lerp(T.x + T.w / 2, Rc.x + S.dx.v, p);
    const cy = lerp(T.y + T.h / 2, Rc.y + S.dy.v, p);
    const s = lerp(s0, sDrag, p);
    const ix = ((R.w - T.w / s0) / 2) * (1 - pc), iy = ((R.h - T.h / s0) / 2) * (1 - pc);
    const rad = lerp(T.r / s0, 6 / Math.max(0.3, s), pc);
    const m = sl.media.style;
    m.transform = `translate3d(${(cx - Rc.x).toFixed(2)}px,${(cy - Rc.y).toFixed(2)}px,0) scale(${s.toFixed(4)})`;
    m.clipPath = `inset(${iy.toFixed(2)}px ${ix.toFixed(2)}px round ${rad.toFixed(2)}px)`;
    if (!el.classList.contains("is-fade")) m.opacity = fade;
    dim.style.opacity = (pc * (1 - drag * 0.8)).toFixed(3);
    chrome.style.opacity = chromeOn ? (clamp((p - 0.55) / 0.45, 0, 1) * (1 - Math.min(1, drag * 3))).toFixed(3) : 0;
  }

  /* ---------- open / close ---------- */
  // opts.instant: land directly in the open state (deep links / screenshots)
  async function open(id, i = 0, src = null, opts = {}) {
    if (isOpen) return;
    const g = cfg.getGroup(id);
    if (!g || !g.items.length) return;
    G = g; idx = clamp(i, 0, g.items.length - 1); opener = src || cfg.getThumb(id, idx); thumbCache = new Map();
    await measure(G.items[idx], idx);
    G.items.forEach((it, j) => j !== idx && measure(it, j).then(() => { if (isOpen && G === g) { layoutSlides(); render(); } }));
    isOpen = true; closing = false; chromeOn = true;
    buildSlides();
    // page behind: inert + scroll lock
    for (const n of document.body.children) if (n !== el && n.tagName !== "SCRIPT") { n.dataset.lbInert = n.inert ? "1" : ""; n.inert = true; }
    document.documentElement.classList.add("lb-lock");
    el.hidden = false;
    S.px.v = S.px.target = -idx * pitch(); stop(S.px);
    S.dx.v = S.dy.v = 0; stop(S.dx); stop(S.dy);
    setSource(idx, true);
    updateChrome();
    announce(true);
    btnClose.focus({ preventScroll: true });
    setURL();
    if (opts.freeze != null) { // screenshot aid: hold the shared-element zoom at progress p
      el.classList.remove("is-fade", "is-in");
      S.p.v = clamp(+opts.freeze || 0, 0, 1); S.p.vel = 0; stop(S.p); render();
    } else if (opts.instant) {
      el.classList.remove("is-fade", "is-in");
      S.p.v = 1; S.p.vel = 0; stop(S.p); render();
    } else if (RM()) {
      el.classList.add("is-fade");
      S.p.v = 1; stop(S.p); render();
      requestAnimationFrame(() => el.classList.add("is-in"));
    } else {
      el.classList.remove("is-fade", "is-in");
      S.p.v = 0; S.p.vel = 0; render();
      animate(S.p, 1, { k: 240, z: 1 });
    }
    playCurrent();
  }

  function close({ vx = 0, vy = 0 } = {}) {
    if (!isOpen || closing) return;
    closing = true;
    pauseAll();
    if (RM()) {
      el.classList.remove("is-in");
      setTimeout(finish, 230);
      return;
    }
    stop(S.dx); stop(S.dy); // freeze the drag offset; p carries the image home
    // opened by deep link (or paged to an image whose thumb is off-screen): bring the
    // thumb into view behind the dim so the image can land back in it
    if (!thumbRect(idx)) {
      const t = cfg.getThumb(G.id, idx);
      if (t?.isConnected && t.getClientRects().length) { t.scrollIntoView({ block: "center", behavior: "instant" }); thumbCache.delete(idx); }
    }
    let vp = 0;
    const T = thumbRect(idx), R = slides[idx].rect;
    if (T && (vx || vy)) {
      const off = idx * pitch() + S.px.v;
      const Dx = R.x + R.w / 2 + off + S.dx.v - (T.x + T.w / 2);
      const Dy = R.y + R.h / 2 + S.dy.v - (T.y + T.h / 2);
      const D2 = Dx * Dx + Dy * Dy;
      if (D2 > 1) vp = clamp((vx * Dx + vy * Dy) / D2, -9, 2.5);
    }
    animate(S.p, 0, { k: 280, z: vx || vy ? 0.88 : 1, vel: vp, done: finish });
  }

  function finish() {
    isOpen = false; closing = false;
    el.hidden = true;
    el.classList.remove("is-fade", "is-in", "is-dragging");
    for (const n of document.body.children) if ("lbInert" in n.dataset) { n.inert = n.dataset.lbInert === "1"; delete n.dataset.lbInert; }
    document.documentElement.classList.remove("lb-lock");
    setSource(idx, false);
    const back = cfg.getThumb(G.id, idx) || opener;
    const onScreen = !!thumbRect(idx);
    back?.focus({ preventScroll: onScreen });
    if (!onScreen) back?.scrollIntoView({ block: "center", behavior: RM() ? "auto" : "smooth" });
    track.innerHTML = ""; slides = [];
    const u = new URL(location.href); u.searchParams.delete("lightbox"); history.replaceState(null, "", u);
  }

  /* ---------- paging ---------- */
  function go(n, vel = 0) {
    if (!isOpen || closing) return;
    const max = G.items.length - 1;
    if (n < 0 || n > max) { // nudge against the edge
      if (!RM()) { S.px.vel = (n < 0 ? 1 : -1) * 900; animate(S.px, -idx * pitch(), { k: 320, z: 0.75 }); }
      return;
    }
    if (n !== idx) {
      pauseAll();
      setSource(idx, false);
      slides[idx].media.style.transform = ""; slides[idx].media.style.clipPath = ""; slides[idx].media.style.opacity = "";
      idx = n;
      setSource(idx, true);
      stop(S.dx); stop(S.dy); S.dx.v = S.dy.v = 0;
      updateChrome(); announce(); setURL(); playCurrent();
    }
    if (RM()) {
      stop(S.px); S.px.v = -idx * pitch(); render();
      slides[idx].media.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
      return;
    }
    animate(S.px, -idx * pitch(), { k: 260, z: Math.abs(vel) > 900 ? 0.8 : 1, vel });
  }

  function setSource(i, hide) {
    const t = cfg.getThumb(G.id, i);
    t?.classList.toggle("is-lb-source", hide);
  }

  /* ---------- chrome + announcements ---------- */
  function updateChrome() {
    const n = G.items.length, it = G.items[idx];
    titleEl.textContent = G.title || "";
    altEl.textContent = it.alt || "";
    countEl.textContent = `${idx + 1} / ${n}`;
    countEl.setAttribute("aria-label", `${it.video ? "Video" : "Image"} ${idx + 1} of ${n}`);
    btnPrev.hidden = btnNext.hidden = n < 2;
    btnPrev.disabled = idx === 0;
    btnNext.disabled = idx === n - 1;
    btnPrev.setAttribute("aria-label", "Previous");
    btnNext.setAttribute("aria-label", "Next");
    dotsEl.innerHTML = n > 1 ? G.items.map((_, j) => `<b class="${j === idx ? "on" : ""}"></b>`).join("") : "";
    btnPlay.hidden = !it.video;
    slides.forEach((s, j) => s.el.setAttribute("aria-hidden", String(j !== idx)));
    // keep focus inside if it was on a button that just got disabled
    if (document.activeElement?.disabled) btnClose.focus({ preventScroll: true });
  }
  function announce(first) {
    const it = G.items[idx];
    live.textContent = `${first ? (G.title ? G.title + ". " : "") : ""}${it.video ? "Video" : "Image"} ${idx + 1} of ${G.items.length}${it.alt ? ": " + it.alt : ""}`;
  }
  function setURL() {
    const u = new URL(location.href); u.searchParams.set("lightbox", `${G.id}:${idx}`); history.replaceState(null, "", u);
  }

  /* ---------- video ---------- */
  const curVideo = () => (slides[idx]?.media instanceof HTMLVideoElement ? slides[idx].media : null);
  function playCurrent() { const v = curVideo(); if (v && !RM()) v.play().catch(() => {}); syncPlayBtn(); }
  function pauseAll() { slides.forEach((s) => s.media instanceof HTMLVideoElement && s.media.pause()); }
  function toggleVideo() { const v = curVideo(); if (!v) return; v.paused ? v.play().catch(() => {}) : v.pause(); }
  function syncPlayBtn() {
    const v = curVideo();
    if (!v) return;
    btnPlay.setAttribute("aria-label", v.paused ? "Play video" : "Pause video");
    btnPlay.querySelector("i").className = `ph-fill ${v.paused ? "ph-play" : "ph-pause"}`;
  }

  /* ---------- keyboard + focus trap ---------- */
  function onKey(e) {
    if (!isOpen) return;
    // the global player listens on document (space / esc); the open dialog owns the keyboard
    if (["Escape", " ", "ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) e.stopPropagation();
    if (e.key === "Escape") { e.preventDefault(); close(); }
    else if (e.key === "ArrowRight") { e.preventDefault(); go(idx + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); go(idx - 1); }
    else if (e.key === "Home") { e.preventDefault(); go(0); }
    else if (e.key === "End") { e.preventDefault(); go(G.items.length - 1); }
    else if (e.key === " " && curVideo() && !e.target.closest("button")) { e.preventDefault(); toggleVideo(); }
    else if (e.key === "Tab") {
      const f = [...el.querySelectorAll("button")].filter((b) => !b.hidden && !b.disabled);
      if (!f.length) return;
      const i = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  }

  /* ---------- gestures ---------- */
  let gst = null;
  const rubber = (d, dim) => (1 - 1 / ((d * 0.55) / dim + 1)) * dim;
  function onDown(e) {
    if (!isOpen || closing || e.button > 0 || e.target.closest(".lb__btn")) return;
    gst = {
      id: e.pointerId, x0: e.clientX, y0: e.clientY, axis: null,
      dx0: S.dx.v, dy0: S.dy.v, px0: S.px.v,
      onMedia: !!e.target.closest(".lb__media"), samples: [[performance.now(), e.clientX, e.clientY]],
    };
    // grab: whatever is moving stops where it is (interruptible)
    stop(S.dx); stop(S.dy); stop(S.px);
    try { el.setPointerCapture(e.pointerId); } catch {}
  }
  function onMove(e) {
    if (!gst || e.pointerId !== gst.id) return;
    const dx = e.clientX - gst.x0, dy = e.clientY - gst.y0;
    gst.samples.push([performance.now(), e.clientX, e.clientY]);
    while (gst.samples.length > 2 && performance.now() - gst.samples[0][0] > 100) gst.samples.shift();
    if (!gst.axis) {
      if (Math.hypot(dx, dy) < 7) return;
      gst.axis = Math.abs(dx) > Math.abs(dy) * 1.15 ? "x" : "y";
      el.classList.add("is-dragging");
    }
    if (gst.axis === "x") {
      let v = gst.px0 + dx;
      const max = 0, min = -(G.items.length - 1) * pitch();
      if (v > max) v = max + rubber(v - max, W());
      if (v < min) v = min - rubber(min - v, W());
      S.px.v = v;
    } else {
      S.dy.v = gst.dy0 + dy;
      S.dx.v = gst.dx0 + dx * 0.85;
    }
    if (!raf) render();
  }
  function velocity(g) {
    const s = g.samples;
    if (s.length < 2) return { vx: 0, vy: 0 };
    const a = s[0], b = s[s.length - 1], dt = Math.max(1, b[0] - a[0]) / 1000;
    if (performance.now() - b[0] > 80) return { vx: 0, vy: 0 }; // finger rested before release
    return { vx: (b[1] - a[1]) / dt, vy: (b[2] - a[2]) / dt };
  }
  function onUp(e) {
    if (!gst || e.pointerId !== gst.id) return;
    const g = gst; gst = null;
    el.classList.remove("is-dragging");
    if (!g.axis) {
      // tap: outside the media closes; on a video toggles playback
      if (!g.onMedia) close();
      else if (curVideo()) toggleVideo();
      return;
    }
    const { vx, vy } = velocity(g);
    if (g.axis === "x") {
      // a flick pages in its direction; a slow drag pages once it is past ~35%
      const moved = -S.px.v / pitch() - idx; // + = toward next
      let n = idx;
      if (Math.abs(vx) > 300) n = idx + (vx < 0 ? 1 : -1);
      else if (Math.abs(moved) > 0.35) n = idx + Math.sign(moved);
      n = clamp(n, 0, G.items.length - 1);
      if (RM()) return go(n);
      if (n !== idx) go(n, vx);
      else animate(S.px, -idx * pitch(), { k: 300, z: Math.abs(vx) > 900 ? 0.8 : 1, vel: vx });
      return;
    }
    const d = S.dy.v;
    const flick = Math.abs(vy) > 600 && Math.sign(vy) === Math.sign(d);
    if (Math.abs(d) > H() * 0.16 || flick) {
      if (RM()) return close();
      close({ vx, vy });
    } else {
      animate(S.dx, 0, { k: 380, z: 0.9, vel: vx });
      animate(S.dy, 0, { k: 380, z: 0.9, vel: vy });
    }
  }

  window.StitchLB = {
    init(c) { cfg = { ...cfg, ...c }; if (!el) build(); },
    open, close,
    get isOpen() { return isOpen; },
  };
})();
