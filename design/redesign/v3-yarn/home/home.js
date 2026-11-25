/* ============================================================
   home/home.js · wiring: intro playback, skip, mock options,
   note bursts, contact, and the "button opens into the page" move.
   URL params (all optional):
     intro=drop|cursor|simple   which intro (default drop)
     notes=felt|paper|crayon    burst texture (kit/notes.js)
     skip                       end state, no intro
     replay                     force the intro even if seen this session
     t=<ms>                     freeze the intro (and cursor demo) at t
     pointer=fine|coarse        override pointer detection (cursor mode)
     demo=open-projects|open-music|open-thoughts [&p=0..1]  freeze the open transition
     demo=notes-music|notes-projects|notes-thoughts [&nt=ms] freeze a hover burst
     demo=hover                 show hover states (rope, sewn thread, caption)
     demo=contact               contact links opened in place
     demo=chase                 cursor mode: scripted pointer (use with t=)
     reduced                    reduced-motion path
   ============================================================ */
(() => {
  const q = new URLSearchParams(location.search);
  const html = document.documentElement;
  const mode = html.dataset.intro || "drop";
  const reduced = window.Yarn ? Yarn.reduced() : matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = q.get("pointer") === "coarse" ? false : q.get("pointer") === "fine" ? true : matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (fine) html.classList.add("fine");
  if (reduced) html.classList.add("reduced");
  const cursorMode = mode === "cursor" && fine && !reduced;
  const demo = q.get("demo") || "";
  const tFreeze = q.has("t") ? Math.max(0, parseFloat(q.get("t")) || 0) : null;
  let playing = html.classList.contains("intro-on");

  // ---------- counts on the buttons (real data) ----------
  try {
    const P = window.BLAQAT?.projects?.length;
    const M = window.BLAQAT?.music;
    const tracks = Array.isArray(M) ? M.reduce((n, m) => n + (Array.isArray(m.tracks) ? m.tracks.length : Array.isArray(m.songs) ? m.songs.length : 1), 0) : 0;
    const T = window.THOUGHTS?.posts?.length;
    const set = (k, v) => { const el = document.querySelector(`[data-count="${k}"]`); if (el && v) el.textContent = v; };
    set("projects", P && `${P} builds`);
    set("music", tracks && `${tracks} pieces`);
    set("thoughts", T && `${T} posts`);
  } catch (e) {}

  // ---------- mock panel ----------
  const panel = Yarn.mockPanel([
    { label: "Intro", param: "intro", options: [["drop", "Yarn drop"], ["cursor", "Cursor cat"], ["simple", "Simple"]], default: "drop" },
    { label: "Notes texture", param: "notes", options: [["felt", "Felt"], ["paper", "Paper"], ["crayon", "Crayon"]], default: "felt" },
  ], { title: "Home options" });
  const fs = document.createElement("fieldset");
  fs.innerHTML = `<legend>Intro</legend><button type="button" id="replay">↻ Replay intro</button>`;
  panel.appendChild(fs);

  // ---------- lockup + intro ----------
  const svg = document.getElementById("lockup");
  const lk = new HomeLockup(svg, { withCat: !cursorMode });
  const skipBtn = document.getElementById("skip");
  const reveals = [...document.querySelectorAll(".reveal")];
  let P = null, raf = 0, t0 = 0;

  function revealAt(t) {
    for (const el of reveals) {
      const k = el.dataset.reveal;
      const start = k === "lockup" ? lk.lettersEnd(P) - 220 : P.content + (k === "2" ? 130 : 0);
      const u = HomeLockup.util.sat((t - start) / 420);
      if (u >= 1) { el.style.opacity = "1"; el.style.transform = ""; continue; }
      const e = HomeLockup.util.outCubic(u);
      el.style.opacity = e.toFixed(3);
      el.style.transform = `translateY(${((1 - e) * 10).toFixed(1)}px)`;
    }
  }

  function setup() {
    lk.measure();
    P = lk.plan(cursorMode ? "simple" : mode === "drop" ? "drop" : "simple");
  }

  const SKIP_AT = 600;
  function frame(now) {
    const t = now - t0;
    lk.render(t);
    revealAt(t);
    skipBtn.classList.toggle("shown", t >= SKIP_AT);
    if (t < P.end) raf = requestAnimationFrame(frame);
    else finish();
  }

  function finish() {
    cancelAnimationFrame(raf);
    raf = 0;
    if (P) { lk.render(P.end); revealAt(1e9); }
    reveals.forEach((el) => { el.style.opacity = ""; el.style.transform = ""; });
    playing = false;
    html.classList.remove("intro-on");
    html.classList.add("intro-off");
    skipBtn.hidden = true;
    removeSkipListeners();
    if (cursorMode && window.HomeCursor && tFreeze == null) HomeCursor.start({ lockup: lk, demo: demo === "chase" });
  }

  function play() {
    html.classList.remove("intro-off");
    html.classList.add("intro-on");
    skipBtn.hidden = false;
    skipBtn.classList.remove("shown");
    playing = true;
    try { sessionStorage.setItem("blaqat.intro." + mode, "1"); } catch (e) {}
    lk.render(0);
    revealAt(0);
    addSkipListeners();
    t0 = performance.now();
    raf = requestAnimationFrame(frame);
  }

  // skip: button, Esc, or any click/tap on the page (not on the mock panel)
  const onKey = (e) => { if (e.key === "Escape" && playing) finish(); };
  const onDown = (e) => { if (playing && !e.target.closest(".mockpanel")) finish(); };
  function addSkipListeners() { addEventListener("keydown", onKey); addEventListener("pointerdown", onDown, true); }
  function removeSkipListeners() { removeEventListener("keydown", onKey); removeEventListener("pointerdown", onDown, true); }
  skipBtn.addEventListener("click", finish);
  panel.querySelector("#replay").addEventListener("click", (e) => {
    e.stopPropagation();
    if (reduced) return;
    window.HomeCursor?.stop?.();
    setup();
    play();
  });

  // tap the lockup: the dot hops (also the touch fallback for cursor mode)
  svg.addEventListener("click", () => lk.hop());

  // boot: wait for fonts (they move the lockup), but never long
  const ready = Promise.race([document.fonts?.ready || Promise.resolve(), new Promise((r) => setTimeout(r, 700))]);
  // paint something right away
  setup();
  if (playing) { lk.render(0); revealAt(0); } else { lk.render(P.end); }
  ready.then(() => requestAnimationFrame(() => {
    setup();
    if (tFreeze != null && !reduced && !demo.startsWith("open") && !demo.startsWith("notes") && demo !== "hover") {
      const tt = Math.min(tFreeze, P.end);
      lk.render(tt);
      revealAt(tt);
      skipBtn.hidden = tt >= P.end;
      skipBtn.classList.toggle("shown", tt >= SKIP_AT);
      if (cursorMode && window.HomeCursor && tFreeze >= P.end) {
        finishStatic();
        HomeCursor.start({ lockup: lk, demo: true, freezeAt: tFreeze - P.end });
      }
    } else if (playing) {
      play();
    } else {
      finishStatic();
      if (cursorMode && window.HomeCursor) HomeCursor.start({ lockup: lk, demo: demo === "chase" });
    }
    runDemos();
  }));
  function finishStatic() {
    lk.render(P.end);
    reveals.forEach((el) => { el.style.opacity = ""; el.style.transform = ""; });
    html.classList.remove("intro-on");
    html.classList.add("intro-off");
    skipBtn.hidden = true;
  }
  // resize (incl. mobile URL-bar show/hide): re-measure and re-plan in place; never skip
  addEventListener("resize", () => {
    if (playing) { setup(); return; }
    if (!raf && P && tFreeze == null) { lk.measure(); lk.render(P.end); }
  });

  // ---------- note bursts on hover-enter / keyboard focus ----------
  if (window.Notes) {
    Notes.config({ zIndex: 2 }); // behind the buttons (z 3), in front of the sheet
    const idle = window.requestIdleCallback || ((f) => setTimeout(f, 400));
    idle(() => Notes.preload());
  }
  document.querySelectorAll("[data-burst]").forEach((b) => {
    b.addEventListener("pointerenter", (e) => { if (e.pointerType !== "touch") window.Notes?.burst(b, b.dataset.burst); });
    b.addEventListener("focus", () => { if (b.matches(":focus-visible")) window.Notes?.burst(b, b.dataset.burst); });
  });

  // ---------- contact opens in place ----------
  const cBtn = document.getElementById("contact-btn");
  const cBox = document.getElementById("contact");
  const setContact = (open) => {
    cBtn.setAttribute("aria-expanded", String(open));
    cBox.classList.toggle("open", open);
    cBox.inert = !open;
  };
  setContact(false);
  cBtn.addEventListener("click", () => setContact(cBtn.getAttribute("aria-expanded") !== "true"));
  // arriving by hash (e.g. the nav's home/index.html?skip#contact) opens it in place
  const contactFromHash = () => { if (location.hash === "#contact") { setContact(true); cBox.scrollIntoView({ block: "nearest" }); } };
  contactFromHash();
  addEventListener("hashchange", contactFromHash);

  // ---------- the button's cloth unrolls into the next page's frame ----------
  let opening = null;
  const DUR = 540;
  function openSection(trigger, section, href, { freezeAt = null } = {}) {
    if (opening) return;
    const hero = document.getElementById("hero");
    const sw = trigger.querySelector(".hbtn__swatch");
    const rb = trigger.getBoundingClientRect();
    const rs = (sw || trigger).getBoundingClientRect();
    const W = innerWidth, H = innerHeight;
    const ov = document.createElement("div");
    ov.className = "unroll";
    ov.dataset.section = section;
    ov.setAttribute("aria-hidden", "true");
    const cloth = document.createElement("div");
    cloth.className = "unroll__cloth";
    ov.appendChild(cloth);
    document.body.appendChild(ov);
    const ins = (t, r, b, l, rad) => `inset(${t.toFixed(1)}px ${r.toFixed(1)}px ${b.toFixed(1)}px ${l.toFixed(1)}px round ${rad.toFixed(1)}px)`;
    const R = (r, rad) => ins(r.top, W - r.right, H - r.bottom, r.left, rad);
    let anims;
    if (reduced) {
      cloth.style.clipPath = "none";
      anims = [cloth.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, fill: "forwards" })];
    } else {
      const band = { top: rb.top * 0.55, bottom: (H - rb.bottom) * 0.55 };
      const kf = [
        { clipPath: R(rs, rs.height / 2), easing: "cubic-bezier(.3,.1,.3,1)" },
        { clipPath: R(rb, rb.height / 2), offset: 0.26, easing: "cubic-bezier(.5,0,.3,1)" },
        { clipPath: ins(band.top, 0, band.bottom, 0, 30), offset: 0.64, easing: "cubic-bezier(.4,0,.2,1)" },
        { clipPath: ins(0, 0, 0, 0, 0) },
      ];
      anims = [
        cloth.animate(kf, { duration: DUR, fill: "forwards" }),
        hero.animate([{ transform: "scale(1)", opacity: 1 }, { transform: "scale(.965)", opacity: 0.55 }], { duration: DUR, easing: "cubic-bezier(.3,0,.2,1)", fill: "forwards" }),
        trigger.animate([{ opacity: 1 }, { opacity: 0, offset: 0.3 }, { opacity: 0 }], { duration: DUR, fill: "forwards" }),
      ];
    }
    opening = { ov, anims, cancelled: false, hero };
    if (freezeAt != null) {
      anims.forEach((a) => { a.pause(); a.currentTime = freezeAt * (reduced ? 220 : DUR); });
      return;
    }
    anims[0].finished.then(() => {
      if (opening && !opening.cancelled) location.href = href;
    }).catch(() => {});
  }
  function cancelOpen() {
    if (!opening || opening.cancelled) return;
    const o = opening;
    o.cancelled = true;
    // interruptible: play back from wherever it is, into the button
    o.anims.forEach((a) => a.reverse());
    o.anims[0].finished.then(() => { o.ov.remove(); o.anims.forEach((a) => a.cancel()); opening = null; });
  }
  addEventListener("keydown", (e) => { if (e.key === "Escape") cancelOpen(); });
  addEventListener("pageshow", (e) => {
    if (e.persisted && opening) { opening.ov.remove(); opening.anims.forEach((a) => a.cancel()); opening = null; }
  });
  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-open]");
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    openSection(a, a.dataset.open, a.href);
  });

  // ---------- screenshot demos ----------
  function runDemos() {
    if (demo === "contact") cBtn.click();
    if (demo.startsWith("open-")) {
      const sec = demo.slice(5);
      const btn = document.querySelector(`.hbtn[data-open="${sec}"]`);
      const p = q.has("p") ? parseFloat(q.get("p")) : 0.5;
      if (btn) openSection(btn, sec, btn.href, { freezeAt: HomeLockup.util.clamp(p, 0, 1) });
    }
    if (demo === "hover" || demo.startsWith("notes-")) {
      const sec = demo.startsWith("notes-") ? demo.slice(6) : "music";
      const btn = document.querySelector(`.hbtn[data-burst="${sec}"]`);
      btn?.classList.add("is-hover", "is-roped");
      if (demo === "hover") document.querySelectorAll(".thread")[2]?.classList.add("is-hover");
      if (demo.startsWith("notes-") && window.Notes && btn) {
        Notes.seed(7);
        Notes.burst(btn, sec);
        Notes.preload(Notes.texture, [sec]);
        Notes.whenReady().then(() => Notes.freeze(q.has("nt") ? parseFloat(q.get("nt")) : 360));
      }
    }
  }

  window.HomePage = { finish, play, openSection, lockup: lk };
})();
