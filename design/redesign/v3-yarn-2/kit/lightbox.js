/* ============================================================
   kit/lightbox.js · shared media lightbox (kit agent; mock-only)
   Generalized from thoughts/stitched-lightbox.js.
   - shared element: media zooms out of its thumbnail's rect (incl.
     object-fit crop + corner radius) and closes back into it
   - one spring loop drives everything → interruptible, grab mid-flight
   - drag down/up to dismiss (velocity handed to the close spring);
     swipe / arrows / keys to page, rubber-banding at the ends
   - dialog: aria-modal, page inert, focus trapped, focus returns to
     the (current) thumbnail, live announcements, caption + "n / m"
   - videos: muted by default, real controls under the video:
     play/pause · time · scrub · mute (M), Space toggles, Shift+←/→ seeks 5 s
   - reduced motion: cross-fades only
   API  Yarn.lightbox
     open({ items:[{ src, alt, kind:"image"|"video" }], index, title, thumbs: i => Element | Element[] }, { instant })
     openGroup(group, index, { instant })   all [data-ylb="<group>"] in DOM order
     close()   isOpen
   Markup that opens it with no JS: any element with data-ylb="<group>"
     data-src (else its <img>/<video> src), data-alt, data-kind; title from the
     closest [data-ylb-title]. Yarn.carousel() emits exactly this.
   URL  ?lb=<group>:<index> opens on load (screenshots).
   ============================================================ */
(() => {
  "use strict";
  const Y = window.Yarn || {};
  if (Y.lightbox) return;
  const RM = () => (Y.reduced ? Y.reduced() : matchMedia("(prefers-reduced-motion: reduce)").matches);
  const sound = (n, o) => { try { window.YarnSound?.play(n, o); } catch (_) {} };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const fmtT = (s) => { s = Math.max(0, Math.floor(s || 0)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
  const isVid = (it) => it.kind === "video" || it.video === true || /\.(mp4|webm|mov|m4v)(#.*)?$/i.test(it.src || "");
  const GAP = 28;

  let el, dim, track, chrome, btnClose, btnPrev, btnNext, titleEl, altEl, countEl, dotsEl, live;
  let vbar, vPlay, vTime, vScrub, vMute;
  let G = null, idx = 0, slides = [], isOpen = false, closing = false, opener = null, thumbCache = new Map();
  let wantMuted = true;

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
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    let active = false;
    const finished = [];
    for (const s of Object.values(S)) {
      if (!s.on) continue;
      let t = dt;
      while (t > 1e-6) { const h = Math.min(t, 1 / 240), c = 2 * s.z * Math.sqrt(s.k); s.vel += (-s.k * (s.v - s.target) - c * s.vel) * h; s.v += s.vel * h; t -= h; }
      if (Math.abs(s.v - s.target) < s.eps && Math.abs(s.vel) < s.eps * 20) { s.v = s.target; s.vel = 0; s.on = false; if (s.done) finished.push(s.done), (s.done = null); }
      else active = true;
    }
    render();
    raf = active ? requestAnimationFrame(tick) : 0;
    finished.forEach((f) => f());
  }
  const stop = (s) => { s.on = false; s.done = null; };

  /* ---------- geometry ---------- */
  const W = () => innerWidth, H = () => innerHeight;
  const pitch = () => W() + GAP;
  const insets = (it) => {
    const m = innerWidth < 960 ? { t: 72, b: 128, l: 10, r: 10 } : { t: 84, b: 118, l: 108, r: 108 };
    if (it && isVid(it)) m.b += 60; // room for the controls under the video
    return m;
  };
  function fit(item) {
    const m = insets(item);
    const aw = Math.max(80, W() - m.l - m.r), ah = Math.max(80, H() - m.t - m.b);
    const nw = item.w || 1600, nh = item.h || 1000;
    const s = Math.min(aw / nw, ah / nh, isVid(item) ? 2 : 1.25);
    const w = nw * s, h = nh * s;
    return { x: m.l + (aw - w) / 2, y: m.t + (ah - h) / 2, w, h };
  }
  const thumbOf = (i) => (typeof G.thumbs === "function" ? G.thumbs(i) : Array.isArray(G.thumbs) ? G.thumbs[i] : null);
  function thumbRect(i) {
    if (thumbCache.has(i)) return thumbCache.get(i);
    const t = thumbOf(i);
    let r = null;
    if (t && t.isConnected) {
      const b = t.getBoundingClientRect();
      if (b.width > 4 && b.height > 4 && b.bottom > 0 && b.top < H() && b.right > 0 && b.left < W())
        r = { x: b.left, y: b.top, w: b.width, h: b.height, r: parseFloat(getComputedStyle(t).borderTopLeftRadius) || 0 };
    }
    thumbCache.set(i, r);
    return r;
  }
  function measure(item, i) {
    if (item.w) return Promise.resolve();
    return new Promise((res) => {
      const tm = thumbOf(i)?.querySelector?.("img,video");
      const vid = isVid(item);
      if (tm && !vid && tm.naturalWidth) { item.w = tm.naturalWidth; item.h = tm.naturalHeight; return res(); }
      if (tm && vid && tm.videoWidth) { item.w = tm.videoWidth; item.h = tm.videoHeight; return res(); }
      const probe = vid ? document.createElement("video") : new Image();
      const ok = () => { item.w = probe.naturalWidth || probe.videoWidth || 1600; item.h = probe.naturalHeight || probe.videoHeight || 1000; res(); };
      const bad = () => { item.w = 1600; item.h = 1000; item.missing = true; res(); };
      if (vid) { probe.preload = "metadata"; probe.muted = true; probe.onloadedmetadata = ok; probe.onerror = bad; }
      else { probe.onload = ok; probe.onerror = bad; }
      probe.src = item.src;
      setTimeout(() => { if (!item.w) bad(); }, 2500);
    });
  }

  /* ---------- DOM ---------- */
  function build() {
    el = document.createElement("div");
    el.className = "ylb";
    el.hidden = true;
    el.tabIndex = -1;
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("aria-labelledby", "ylb-title");
    el.setAttribute("aria-describedby", "ylb-alt ylb-count");
    el.innerHTML = `
      <div class="ylb__dim" aria-hidden="true"></div>
      <div class="ylb__track"></div>
      <div class="ylb__chrome">
        <div class="ylb__top">
          <p class="ylb__count" id="ylb-count"></p>
          <button type="button" class="ylb__btn ylb__close" aria-label="Close viewer"><i class="ph-bold ph-x" aria-hidden="true"></i></button>
        </div>
        <button type="button" class="ylb__btn ylb__nav ylb__prev" aria-label="Previous"><i class="ph-bold ph-caret-left" aria-hidden="true"></i></button>
        <button type="button" class="ylb__btn ylb__nav ylb__next" aria-label="Next"><i class="ph-bold ph-caret-right" aria-hidden="true"></i></button>
        <div class="ylb__vbar" role="group" aria-label="Video controls" hidden>
          <button type="button" class="ylb__vbtn ylb__vbtn--play" aria-label="Play video"><i class="ph-fill ph-play" aria-hidden="true"></i></button>
          <span class="ylb__time" aria-hidden="true">0:00 / 0:00</span>
          <input class="ylb__scrub" type="range" min="0" max="1000" step="1" value="0" aria-label="Seek">
          <button type="button" class="ylb__vbtn ylb__vbtn--mute" aria-pressed="true" aria-label="Unmute"><i class="ph-fill ph-speaker-simple-slash" aria-hidden="true"></i></button>
        </div>
        <div class="ylb__cap">
          <p class="ylb__title" id="ylb-title"></p>
          <p class="ylb__alt" id="ylb-alt"></p>
          <div class="ylb__dots" aria-hidden="true"></div>
        </div>
      </div>
      <p class="sr-only" aria-live="polite"></p>`;
    document.body.appendChild(el);
    const q = (s) => el.querySelector(s);
    dim = q(".ylb__dim"); track = q(".ylb__track"); chrome = q(".ylb__chrome");
    btnClose = q(".ylb__close"); btnPrev = q(".ylb__prev"); btnNext = q(".ylb__next");
    titleEl = q(".ylb__title"); altEl = q(".ylb__alt"); countEl = q(".ylb__count"); dotsEl = q(".ylb__dots"); live = q("p[aria-live]");
    vbar = q(".ylb__vbar"); vPlay = q(".ylb__vbtn--play"); vTime = q(".ylb__time"); vScrub = q(".ylb__scrub"); vMute = q(".ylb__vbtn--mute");

    btnClose.addEventListener("click", () => close());
    btnPrev.addEventListener("click", () => go(idx - 1));
    btnNext.addEventListener("click", () => go(idx + 1));
    vPlay.addEventListener("click", () => { const v = curVideo(); if (v) { sound(v.paused ? "play" : "pause", { el: vPlay }); toggleVideo(); } });
    vMute.addEventListener("click", () => toggleMute());
    let wasPlaying = false;
    vScrub.addEventListener("pointerdown", () => { const v = curVideo(); wasPlaying = v && !v.paused; v?.pause(); });
    vScrub.addEventListener("input", () => { const v = curVideo(); if (v && isFinite(v.duration)) { v.currentTime = (vScrub.value / 1000) * v.duration; syncVideo(); } });
    vScrub.addEventListener("change", () => { const v = curVideo(); if (v && wasPlaying) v.play().catch(() => {}); wasPlaying = false; });
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
    slides = G.items.map((it) => {
      const s = document.createElement("div");
      s.className = "ylb__slide";
      s.setAttribute("aria-hidden", "true");
      let m;
      if (it.missing || !it.src) {
        m = document.createElement("div");
        m.className = "ylb__media ymissing";
        m.innerHTML = `<i class="ph ph-image-broken" aria-hidden="true"></i><span>media unavailable</span>`;
      } else if (isVid(it)) {
        m = document.createElement("video");
        m.className = "ylb__media";
        Object.assign(m, { src: it.src, muted: wantMuted, loop: true, playsInline: true, preload: "metadata" });
        m.setAttribute("aria-label", it.alt || "video");
        ["play", "pause", "timeupdate", "progress", "loadedmetadata", "volumechange"].forEach((ev) => m.addEventListener(ev, syncVideo));
      } else {
        m = document.createElement("img");
        m.className = "ylb__media";
        m.src = it.src; m.alt = it.alt || ""; m.draggable = false; m.decoding = "async";
      }
      s.appendChild(m);
      track.appendChild(s);
      return { el: s, media: m, rect: null };
    });
    layoutSlides();
  }
  function layoutSlides() {
    slides.forEach((s, i) => {
      s.rect = fit(G.items[i]);
      Object.assign(s.el.style, { left: `${i * pitch()}px`, width: `${W()}px` });
      Object.assign(s.media.style, { left: `${s.rect.x}px`, top: `${s.rect.y}px`, width: `${s.rect.w}px`, height: `${s.rect.h}px` });
      if (i !== idx) { s.media.style.transform = ""; s.media.style.clipPath = ""; s.media.style.opacity = ""; }
    });
    placeVbar();
  }
  function placeVbar() {
    const it = G?.items[idx], s = slides[idx];
    const on = !!(it && s && isVid(it) && s.media instanceof HTMLVideoElement);
    vbar.hidden = !on;
    if (!on) return;
    const w = clamp(s.rect.w, Math.min(320, W() - 20), Math.min(720, W() - 20));
    Object.assign(vbar.style, { left: `${(W() - w) / 2}px`, width: `${w}px`, top: `${Math.min(s.rect.y + s.rect.h + 12, H() - 52 - 96)}px` });
  }

  /* ---------- one frame from spring state ---------- */
  function render() {
    if (!G || !slides[idx]) return;
    track.style.transform = `translate3d(${S.px.v}px,0,0)`;
    const sl = slides[idx], R = sl.rect;
    const p = S.p.v, pc = clamp(p, 0, 1);
    const off = idx * pitch() + S.px.v;
    const Rc = { x: R.x + R.w / 2 + off, y: R.y + R.h / 2 };
    const drag = Math.min(1, Math.hypot(S.dx.v, S.dy.v) / (H() * 0.5));
    const sDrag = 1 - 0.3 * Math.min(1, Math.abs(S.dy.v) / (H() * 0.55));
    let T = thumbRect(idx), fade = 1;
    if (!T) { T = { w: R.w * 0.86, h: R.h * 0.86, r: 8 }; T.x = Rc.x + S.dx.v - T.w / 2; T.y = Rc.y + S.dy.v - T.h / 2; fade = pc; }
    const s0 = Math.max(T.w / R.w, T.h / R.h);
    const cx = lerp(T.x + T.w / 2, Rc.x + S.dx.v, p), cy = lerp(T.y + T.h / 2, Rc.y + S.dy.v, p);
    const s = lerp(s0, sDrag, p);
    const ix = ((R.w - T.w / s0) / 2) * (1 - pc), iy = ((R.h - T.h / s0) / 2) * (1 - pc);
    const rad = lerp(T.r / s0, 8 / Math.max(0.3, s), pc);
    const m = sl.media.style;
    m.transform = `translate3d(${(cx - Rc.x).toFixed(2)}px,${(cy - Rc.y).toFixed(2)}px,0) scale(${s.toFixed(4)})`;
    m.clipPath = `inset(${iy.toFixed(2)}px ${ix.toFixed(2)}px round ${rad.toFixed(2)}px)`;
    if (!el.classList.contains("is-fade")) m.opacity = fade;
    dim.style.opacity = (pc * (1 - drag * 0.8)).toFixed(3);
    chrome.style.opacity = (clamp((p - 0.55) / 0.45, 0, 1) * (1 - Math.min(1, drag * 3))).toFixed(3);
  }

  /* ---------- open / close ---------- */
  async function open(group, opts = {}) {
    if (isOpen || !group?.items?.length) return;
    if (!el) build();
    G = { title: "", ...group, items: group.items.map((it) => ({ ...it })) };
    idx = clamp(group.index || 0, 0, G.items.length - 1);
    opener = thumbOf(idx) || document.activeElement;
    thumbCache = new Map();
    await measure(G.items[idx], idx);
    const g = G;
    G.items.forEach((it, j) => j !== idx && measure(it, j).then(() => { if (isOpen && G === g) { layoutSlides(); render(); } }));
    isOpen = true; closing = false;
    buildSlides();
    for (const n of document.body.children) if (n !== el && n.tagName !== "SCRIPT") { n.dataset.ylbInert = n.inert ? "1" : ""; n.inert = true; }
    document.documentElement.classList.add("ylb-lock");
    el.hidden = false;
    S.px.v = S.px.target = -idx * pitch(); stop(S.px);
    S.dx.v = S.dy.v = 0; stop(S.dx); stop(S.dy);
    setSource(idx, true);
    updateChrome(); announce(true);
    btnClose.focus({ preventScroll: true });
    if (!opts.silent) sound("lightbox-open", { el: opener });
    if (opts.freeze != null) { el.classList.remove("is-fade", "is-in"); S.p.v = clamp(+opts.freeze || 0, 0, 1); S.p.vel = 0; stop(S.p); render(); }
    else if (opts.instant) { el.classList.remove("is-fade", "is-in"); S.p.v = 1; S.p.vel = 0; stop(S.p); render(); }
    else if (RM()) { el.classList.add("is-fade"); S.p.v = 1; stop(S.p); render(); requestAnimationFrame(() => el.classList.add("is-in")); }
    else { el.classList.remove("is-fade", "is-in"); S.p.v = 0; S.p.vel = 0; render(); animate(S.p, 1, { k: 240, z: 1 }); }
    playCurrent();
  }
  function close({ vx = 0, vy = 0 } = {}) {
    if (!isOpen || closing) return;
    closing = true;
    pauseAll();
    sound("lightbox-close", { el: thumbOf(idx) || opener });
    if (RM()) { el.classList.remove("is-in"); setTimeout(finish, 230); return; }
    stop(S.dx); stop(S.dy);
    if (!thumbRect(idx)) {
      const t = thumbOf(idx);
      if (t?.isConnected && t.getClientRects().length) { t.scrollIntoView({ block: "center", behavior: "instant" }); thumbCache.delete(idx); }
    }
    let vp = 0;
    const T = thumbRect(idx), R = slides[idx].rect;
    if (T && (vx || vy)) {
      const off = idx * pitch() + S.px.v;
      const Dx = R.x + R.w / 2 + off + S.dx.v - (T.x + T.w / 2), Dy = R.y + R.h / 2 + S.dy.v - (T.y + T.h / 2);
      const D2 = Dx * Dx + Dy * Dy;
      if (D2 > 1) vp = clamp((vx * Dx + vy * Dy) / D2, -9, 2.5);
    }
    animate(S.p, 0, { k: 280, z: vx || vy ? 0.88 : 1, vel: vp, done: finish });
  }
  function finish() {
    isOpen = false; closing = false;
    el.hidden = true;
    el.classList.remove("is-fade", "is-in", "is-dragging");
    for (const n of document.body.children) if ("ylbInert" in n.dataset) { n.inert = n.dataset.ylbInert === "1"; delete n.dataset.ylbInert; }
    document.documentElement.classList.remove("ylb-lock");
    setSource(idx, false);
    const back = thumbOf(idx) || opener;
    const onScreen = !!thumbRect(idx);
    back?.focus?.({ preventScroll: onScreen });
    if (!onScreen) back?.scrollIntoView?.({ block: "center", behavior: RM() ? "auto" : "smooth" });
    track.innerHTML = ""; slides = [];
    const u = new URL(location.href);
    if (u.searchParams.has("lb")) { u.searchParams.delete("lb"); history.replaceState(history.state, "", u); }
  }

  /* ---------- paging ---------- */
  function go(n, vel = 0) {
    if (!isOpen || closing) return;
    const max = G.items.length - 1;
    if (n < 0 || n > max) { if (!RM()) { S.px.vel = (n < 0 ? 1 : -1) * 900; animate(S.px, -idx * pitch(), { k: 320, z: 0.75 }); } return; }
    if (n !== idx) {
      pauseAll();
      setSource(idx, false);
      Object.assign(slides[idx].media.style, { transform: "", clipPath: "", opacity: "" });
      idx = n;
      setSource(idx, true);
      stop(S.dx); stop(S.dy); S.dx.v = S.dy.v = 0;
      updateChrome(); announce(); playCurrent();
    }
    if (RM()) { stop(S.px); S.px.v = -idx * pitch(); render(); slides[idx].media.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 }); return; }
    animate(S.px, -idx * pitch(), { k: 260, z: Math.abs(vel) > 900 ? 0.8 : 1, vel });
  }
  const setSource = (i, hide) => thumbOf(i)?.classList?.toggle("is-lb-source", hide);

  /* ---------- chrome ---------- */
  function updateChrome() {
    const n = G.items.length, it = G.items[idx];
    titleEl.textContent = G.title || "";
    altEl.textContent = it.alt || "";
    countEl.textContent = `${idx + 1} / ${n}`;
    countEl.setAttribute("aria-label", `${isVid(it) ? "Video" : "Image"} ${idx + 1} of ${n}`);
    btnPrev.hidden = btnNext.hidden = n < 2;
    btnPrev.disabled = idx === 0;
    btnNext.disabled = idx === n - 1;
    dotsEl.innerHTML = n > 1 ? G.items.map((_, j) => `<b class="${j === idx ? "on" : ""}"></b>`).join("") : "";
    slides.forEach((s, j) => s.el.setAttribute("aria-hidden", String(j !== idx)));
    placeVbar();
    syncVideo();
    if (document.activeElement?.disabled || (document.activeElement && vbar.contains(document.activeElement) && vbar.hidden)) btnClose.focus({ preventScroll: true });
  }
  function announce(first) {
    const it = G.items[idx];
    live.textContent = `${first && G.title ? G.title + ". " : ""}${isVid(it) ? "Video" : "Image"} ${idx + 1} of ${G.items.length}${it.alt ? ": " + it.alt : ""}${isVid(it) ? ". Muted; press M to unmute." : ""}`;
  }

  /* ---------- video ---------- */
  const curVideo = () => (slides[idx]?.media instanceof HTMLVideoElement ? slides[idx].media : null);
  function playCurrent() { const v = curVideo(); if (v) { v.muted = wantMuted; if (!RM()) v.play().catch(() => {}); } syncVideo(); }
  function pauseAll() { slides.forEach((s) => s.media instanceof HTMLVideoElement && s.media.pause()); }
  function toggleVideo() { const v = curVideo(); if (v) v.paused ? v.play().catch(() => {}) : v.pause(); }
  function toggleMute() {
    const v = curVideo(); if (!v) return;
    wantMuted = !v.muted; v.muted = wantMuted;
    if (!wantMuted && v.paused) v.play().catch(() => {});
    live.textContent = wantMuted ? "Muted" : "Sound on";
  }
  function seek(d) { const v = curVideo(); if (v && isFinite(v.duration)) { v.currentTime = clamp(v.currentTime + d, 0, v.duration); syncVideo(); } }
  function syncVideo() {
    const v = curVideo();
    if (!v || !vbar) return;
    const d = isFinite(v.duration) ? v.duration : 0, t = v.currentTime || 0;
    vPlay.setAttribute("aria-label", v.paused ? "Play video" : "Pause video");
    vPlay.querySelector("i").className = `ph-fill ${v.paused ? "ph-play" : "ph-pause"}`;
    vMute.setAttribute("aria-pressed", String(v.muted));
    vMute.setAttribute("aria-label", v.muted ? "Unmute" : "Mute");
    vMute.querySelector("i").className = `ph-fill ${v.muted ? "ph-speaker-simple-slash" : "ph-speaker-simple-high"}`;
    vTime.textContent = `${fmtT(t)} / ${fmtT(d)}`;
    if (document.activeElement !== vScrub || !vScrub.matches(":active")) vScrub.value = d ? Math.round((t / d) * 1000) : 0;
    vScrub.setAttribute("aria-valuetext", `${fmtT(t)} of ${fmtT(d)}`);
    let b = 0; try { if (v.buffered.length) b = v.buffered.end(v.buffered.length - 1) / (d || 1); } catch (_) {}
    vScrub.style.setProperty("--p", `${d ? (t / d) * 100 : 0}%`);
    vScrub.style.setProperty("--b", `${clamp(b, 0, 1) * 100}%`);
  }

  /* ---------- keyboard + focus trap ---------- */
  function onKey(e) {
    if (!isOpen) return;
    const onScrub = e.target === vScrub;
    if (["Escape", " ", "ArrowLeft", "ArrowRight", "Home", "End", "m", "M", "k", "K"].includes(e.key)) e.stopPropagation();
    if (e.key === "Escape") { e.preventDefault(); close(); }
    else if ((e.key === "ArrowRight" || e.key === "ArrowLeft") && e.shiftKey && curVideo()) { e.preventDefault(); seek(e.key === "ArrowRight" ? 5 : -5); }
    else if (e.key === "ArrowRight" && !onScrub) { e.preventDefault(); go(idx + 1); }
    else if (e.key === "ArrowLeft" && !onScrub) { e.preventDefault(); go(idx - 1); }
    else if (e.key === "Home" && !onScrub) { e.preventDefault(); go(0); }
    else if (e.key === "End" && !onScrub) { e.preventDefault(); go(G.items.length - 1); }
    else if ((e.key === "m" || e.key === "M") && curVideo()) { e.preventDefault(); toggleMute(); }
    else if ((e.key === " " || e.key === "k" || e.key === "K") && curVideo() && !e.target.closest("button")) { e.preventDefault(); toggleVideo(); }
    else if (e.key === "Tab") {
      const f = [...el.querySelectorAll("button, input")].filter((b) => !b.disabled && b.getClientRects().length && !b.closest("[hidden]"));
      if (!f.length) return;
      const i = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  }

  /* ---------- gestures ---------- */
  let gst = null;
  const rubber = (d, dm) => (1 - 1 / ((d * 0.55) / dm + 1)) * dm;
  function onDown(e) {
    if (!isOpen || closing || e.button > 0 || e.target.closest(".ylb__btn, .ylb__vbar")) return;
    gst = { id: e.pointerId, x0: e.clientX, y0: e.clientY, axis: null, dx0: S.dx.v, dy0: S.dy.v, px0: S.px.v, onMedia: !!e.target.closest(".ylb__media"), samples: [[performance.now(), e.clientX, e.clientY]] };
    stop(S.dx); stop(S.dy); stop(S.px);
    try { el.setPointerCapture(e.pointerId); } catch (_) {}
  }
  function onMove(e) {
    if (!gst || e.pointerId !== gst.id) return;
    const dx = e.clientX - gst.x0, dy = e.clientY - gst.y0;
    gst.samples.push([performance.now(), e.clientX, e.clientY]);
    while (gst.samples.length > 2 && performance.now() - gst.samples[0][0] > 100) gst.samples.shift();
    if (!gst.axis) { if (Math.hypot(dx, dy) < 7) return; gst.axis = Math.abs(dx) > Math.abs(dy) * 1.15 ? "x" : "y"; el.classList.add("is-dragging"); }
    if (gst.axis === "x") {
      let v = gst.px0 + dx;
      const max = 0, min = -(G.items.length - 1) * pitch();
      if (v > max) v = max + rubber(v - max, W());
      if (v < min) v = min - rubber(min - v, W());
      S.px.v = v;
    } else { S.dy.v = gst.dy0 + dy; S.dx.v = gst.dx0 + dx * 0.85; }
    if (!raf) render();
  }
  function velocity(g) {
    const s = g.samples;
    if (s.length < 2) return { vx: 0, vy: 0 };
    const a = s[0], b = s[s.length - 1], dt = Math.max(1, b[0] - a[0]) / 1000;
    if (performance.now() - b[0] > 80) return { vx: 0, vy: 0 };
    return { vx: (b[1] - a[1]) / dt, vy: (b[2] - a[2]) / dt };
  }
  function onUp(e) {
    if (!gst || e.pointerId !== gst.id) return;
    const g = gst; gst = null;
    el.classList.remove("is-dragging");
    if (!g.axis) { if (!g.onMedia) close(); else if (curVideo()) toggleVideo(); return; }
    const { vx, vy } = velocity(g);
    if (g.axis === "x") {
      const moved = -S.px.v / pitch() - idx;
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
    if (Math.abs(d) > H() * 0.16 || flick) { if (RM()) return close(); close({ vx, vy }); }
    else { animate(S.dx, 0, { k: 380, z: 0.9, vel: vx }); animate(S.dy, 0, { k: 380, z: 0.9, vel: vy }); }
  }

  /* ---------- declarative groups: [data-ylb="<group>"] ---------- */
  const groupEls = (name) => [...document.querySelectorAll(`[data-ylb="${CSS.escape(name)}"]`)];
  function itemFromEl(t) {
    const m = t.querySelector("img, video");
    const src = t.dataset.src || m?.currentSrc || m?.getAttribute("src") || "";
    return { src: src.replace(/#t=[\d.]+$/, ""), alt: t.dataset.alt || m?.getAttribute("alt") || "", kind: t.dataset.kind || (m?.tagName === "VIDEO" ? "video" : "image") };
  }
  function openGroup(name, index = 0, opts = {}) {
    const els = groupEls(name);
    if (!els.length) return;
    const title = els[0].closest("[data-ylb-title]")?.dataset.ylbTitle || "";
    open({ title, index, items: els.map(itemFromEl), thumbs: (i) => groupEls(name)[i] }, opts);
  }
  document.addEventListener("click", (e) => {
    const t = e.target.closest?.("[data-ylb]");
    if (!t || e.defaultPrevented || t.disabled) return;
    e.preventDefault();
    const name = t.dataset.ylb;
    openGroup(name, groupEls(name).indexOf(t));
  });
  // ?lb=<group>:<i> opens on load (no page scroll; instant)
  const lbp = new URLSearchParams(location.search).get("lb");
  if (lbp) addEventListener("load", () => requestAnimationFrame(() => requestAnimationFrame(() => {
    const k = lbp.lastIndexOf(":"), name = k > 0 ? lbp.slice(0, k) : lbp, i = k > 0 ? +lbp.slice(k + 1) || 0 : 0;
    openGroup(name, i, { instant: true, silent: true });
  })), { once: true });

  const api = { open, openGroup, close, get isOpen() { return isOpen; } };
  if (window.Yarn) window.Yarn.lightbox = api;
  else window.YarnLightbox = api;
})();
