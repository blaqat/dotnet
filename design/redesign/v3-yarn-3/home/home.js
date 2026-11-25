/* ============================================================
   home/home.js · iteration 2 wiring: intro schedule + playback, the bio
   entrance, keyword + section-button hover, the section transition
   (kit Yarn.transition.go), contact, sounds, mock options, demos.
   URL params (all optional; every one is in the ⚙ panel or listed here):
     intro=drop|simple|cursor   force an intro (default: the schedule)
     visit=first|recent|later   simulate the schedule (not saved)   roll=1..500 (1 = cursor)
     ball=toon|soft             toon = exaggerated squash/stretch, 3 bounces + roll (default); soft = iteration 1
     enter=cascade|fade         bio entrance: one section after another with keyword pops + scribbles (default) | all at once (i1)
     capfont=gluten|fredoka|sniglet|nunito   keyword hover caption face (default gluten)
     secrope=hover|press        section buttons: rope sews in on hover, flush on the button edge (default; the owner liked the hover rope on Home) | rope only when pressed
     contact=icons|button       desktop contact: icons on screen (default) | behind a button (i1)
     notes=felt|paper|crayon    paper-bit texture (kit/notes.js)
     skip                       end state, no intro          t=<ms>   freeze the intro + entrance at t
     pointer=fine|coarse        override pointer detection (cursor mode)
     demo=kw-engineer|kw-rit|kw-composing|kw-python [&nt=ms]   keyword hover + its paper bits frozen
     demo=notes-projects|notes-music|notes-thoughts [&nt=ms]   section button hover + burst frozen
     demo=press-music           section button selected (rope inside)
     demo=open-projects|open-music|open-thoughts [&p=0..1]     the kit transition, frozen
     demo=contact               the contact icons being "called" (as from the nav's Contact)
     demo=chase                 cursor mode: scripted pointer (use with t=)
   ============================================================ */
(() => {
  const Y = window.Yarn;
  const q = new URLSearchParams(location.search);
  const html = document.documentElement;
  const SCHED = window.HOME_SCHEDULE || { mode: html.dataset.intro || "drop", why: "" };
  const mode = html.dataset.intro || "drop";
  const reduced = Y.reduced();
  const fine = q.get("pointer") === "coarse" ? false : q.get("pointer") === "fine" ? true : matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (fine) html.classList.add("fine");
  const cursorMode = mode === "cursor" && fine && !reduced;
  const pick = (k, list, d) => (list.includes(q.get(k)) ? q.get(k) : d);
  const OPT = {
    ball: pick("ball", ["toon", "soft"], "toon"),
    enter: pick("enter", ["cascade", "fade"], "cascade"),
    secrope: pick("secrope", ["hover", "press"], "hover"),
    contact: pick("contact", ["icons", "button"], "icons"),
  };
  html.dataset.secrope = OPT.secrope;
  html.dataset.contact = OPT.contact;
  const demo = q.get("demo") || "";
  const tFreeze = q.has("t") ? Math.max(0, parseFloat(q.get("t")) || 0) : null;
  let playing = html.classList.contains("intro-on");
  const snd = (name, opts) => { try { window.YarnSound?.play(name, opts); } catch (_) {} };
  const U = HomeLockup.util;

  // ---------- real counts + stack icons (kit devicons) ----------
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
  document.querySelectorAll(".bio .ystk[data-stack]").forEach((a) => a.insertAdjacentHTML("afterbegin", Y.stackIcon(a.dataset.stack)));

  // ---------- mock panel ----------
  const panel = Y.mockPanel([
    { label: "Intro", param: "intro", options: [["", "Schedule"], ["drop", "Yarn drop"], ["simple", "Simple"], ["cursor", "Cursor cat"]], default: "" },
    { label: "Simulate visit", param: "visit", options: [["", "Real"], ["first", "First ever"], ["recent", "< 1 h ago"], ["later", "> 1 h ago"]], default: "" },
    { label: "1-in-500 roll", param: "roll", options: [["", "Random"], ["1", "1 (cursor)"], ["250", "250"]], default: "" },
    { label: "Ball", param: "ball", options: [["toon", "Toon squash"], ["soft", "Soft (i1)"]], default: "toon" },
    { label: "Bio entrance", param: "enter", options: [["cascade", "Cascade"], ["fade", "All at once (i1)"]], default: "cascade" },
    { label: "Caption font", param: "capfont", options: [["gluten", "Gluten"], ["fredoka", "Fredoka"], ["sniglet", "Sniglet"], ["nunito", "Nunito"]], default: "gluten" },
    { label: "Section rope", param: "secrope", options: [["hover", "Sews in on hover"], ["press", "On press only"]], default: "hover" },
    { label: "Contact (desktop)", param: "contact", options: [["icons", "Icons on screen"], ["button", "Button (i1)"]], default: "icons" },
    { label: "Paper bits", param: "notes", options: [["felt", "Felt"], ["paper", "Paper"], ["crayon", "Crayon"]], default: "felt" },
  ], { title: "Home options" });
  const fs = document.createElement("fieldset");
  const MODE_LABEL = { drop: "Yarn drop", simple: "Simple", cursor: "Cursor cat" };
  fs.innerHTML = `<legend>This visit</legend><p style="margin:0 0 6px;font-weight:600;color:var(--ink-2)">${MODE_LABEL[mode] || mode} · ${Y.esc(SCHED.why || "")}${SCHED.roll ? ` · roll ${SCHED.roll}` : ""}</p><button type="button" id="replay">↻ Replay intro</button>`;
  panel.querySelector("h4")?.after(fs);

  // ---------- lockup + intro ----------
  const svg = document.getElementById("lockup");
  const lk = new HomeLockup(svg, { withCat: !cursorMode });
  const skipBtn = document.getElementById("skip");
  const ents = [...document.querySelectorAll(".ent")];
  const kws = [...document.querySelectorAll(".bio .kw")];
  const scribbles = kws.filter((k) => k.classList.contains("yscribble"));
  scribbles.forEach((el) => Y.scribble(el));
  let P = null, raf = 0, t0 = 0, E = null, sounds = null;

  // entrance plan: each text section fades in after the one before (briefly); keywords pop
  // in as their line arrives and their scribbles draw in. Driven by intro time t, so ?t= freezes it.
  function planEntrance() {
    const letters = lk.lettersEnd(P);
    const shown = ents.filter((el) => getComputedStyle(el).display !== "none");
    const order = new Map(shown.map((el, i) => [el, i]));
    if (OPT.enter === "fade") return { fade: true, start: P.content, step: 0, dur: 420, order, end: P.content + 420 };
    const drop = P.mode === "drop";
    const start = drop ? Math.max(P.tRoll - 60, letters - 420) : Math.max(P.tFall, letters - 220);
    const E2 = { fade: false, start, step: drop ? 130 : 105, dur: 360, order, kw: new Map() };
    let end = start + (shown.length - 1) * E2.step + E2.dur;
    kws.forEach((el) => {
      const line = el.closest(".ent");
      const j = [...line.querySelectorAll(".kw")].indexOf(el);
      const tk = start + (order.get(line) ?? 0) * E2.step + 110 + j * 85;
      E2.kw.set(el, tk);
      end = Math.max(end, tk + 150 + 520);
    });
    E2.end = end;
    return E2;
  }
  function revealAt(t) {
    ents.forEach((el) => {
      const u = U.sat((t - (E.start + (E.order.get(el) ?? 0) * E.step)) / E.dur);
      const e = U.outCubic(u);
      el.style.opacity = u >= 1 ? "1" : e.toFixed(3);
      el.style.transform = u >= 1 ? "none" : `translateY(${((1 - e) * 10).toFixed(1)}px)`;
    });
    kws.forEach((el) => {
      const path = el.querySelector(":scope > svg.yscribble__svg path");
      if (E.fade) {
        el.style.opacity = "1"; el.style.transform = "none";
        if (path) path.style.strokeDashoffset = "0";
        return;
      }
      const tk = E.kw.get(el);
      const u = U.sat((t - tk) / 380);
      const e = backOut(u);
      el.style.opacity = U.sat(u / 0.3).toFixed(3);
      el.style.transform = u >= 1 ? "none" : `translateY(${((1 - e) * 7).toFixed(1)}px) scale(${(0.55 + 0.45 * e).toFixed(3)}) rotate(${((1 - e) * -7).toFixed(1)}deg)`;
      if (path) path.style.strokeDashoffset = (1 - U.outCubic(U.sat((t - (tk + 150)) / 520))).toFixed(3);
    });
  }
  function backOut(u, s = 2.1) { const x = u - 1; return 1 + x * x * ((s + 1) * x + s); }
  function settleEntrance() {
    ents.forEach((el) => { el.style.opacity = ""; el.style.transform = ""; });
    kws.forEach((el) => { el.style.opacity = ""; el.style.transform = ""; });
    scribbles.forEach((el) => {
      el.setAttribute("data-draw", "");
      el.classList.add("is-drawn");
      const p = el.querySelector(":scope > svg.yscribble__svg path");
      if (p) p.style.strokeDashoffset = "";
    });
  }
  // static end state from the very first paint (no draw animation)
  if (!playing) settleEntrance();

  function setup() {
    lk.measure();
    P = lk.plan(cursorMode ? "simple" : mode === "drop" ? "drop" : "simple", { ball: OPT.ball });
    E = planEntrance();
  }
  const introEnd = () => Math.max(P.end, E.end);

  const SKIP_AT = 600;
  function frame(now) {
    const t = now - t0;
    lk.render(Math.min(t, P.end));
    revealAt(t);
    skipBtn.classList.toggle("shown", t >= SKIP_AT && t < P.end);
    if (t < introEnd()) raf = requestAnimationFrame(frame);
    else finish();
  }

  function finish() {
    cancelAnimationFrame(raf);
    raf = 0;
    if (P) lk.render(P.end);
    sounds?.stop(); sounds = null;
    settleEntrance();
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
    scribbles.forEach((el) => el.classList.remove("is-drawn"));
    lk.render(0);
    revealAt(0);
    addSkipListeners();
    // sounds from this plan's real timings (kit/sound.js drops them unless sound is on + a gesture happened)
    sounds = window.YarnSound?.schedule?.(lk.soundEvents()) || null;
    t0 = performance.now();
    raf = requestAnimationFrame(frame);
  }

  // skip: button, Esc, or any click/tap on the page (not on the mock panel)
  const onKey = (e) => { if (e.key === "Escape" && playing) finish(); };
  const onDown = (e) => { if (playing && !e.target.closest(".mockpanel, [data-sound-toggle]")) finish(); };
  // sound switched on mid-intro: schedule whatever is still ahead
  document.addEventListener("click", (e) => {
    if (!playing || !e.target.closest("[data-sound-toggle]")) return;
    setTimeout(() => {
      if (!playing || !window.YarnSound?.enabled) return;
      sounds?.stop();
      const el = performance.now() - t0;
      sounds = YarnSound.schedule(lk.soundEvents().filter((x) => x.at > el + 40).map((x) => ({ ...x, at: x.at - el })));
    }, 60);
  });
  function addSkipListeners() { addEventListener("keydown", onKey); addEventListener("pointerdown", onDown, true); }
  function removeSkipListeners() { removeEventListener("keydown", onKey); removeEventListener("pointerdown", onDown, true); }
  skipBtn.addEventListener("click", finish);
  panel.querySelector("#replay")?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (reduced) return;
    window.HomeCursor?.stop?.();
    setup();
    play();
  });

  // tap the lockup: the dot hops (also the touch fallback for cursor mode)
  svg.addEventListener("click", () => { if (!playing) { lk.hop(); snd("ball-bounce", { intensity: 0.5, el: svg }); } });

  // boot: wait for fonts (they move the lockup), but never long
  const ready = Promise.race([document.fonts?.ready || Promise.resolve(), new Promise((r) => setTimeout(r, 700))]);
  setup();
  if (playing) { lk.render(0); revealAt(0); } else { lk.render(P.end); }
  ready.then(() => requestAnimationFrame(() => {
    setup();
    const staticDemo = demo && demo !== "chase";
    if (tFreeze != null && !reduced && !staticDemo) {
      html.classList.remove("intro-off"); html.classList.add("intro-on");
      lk.render(Math.min(tFreeze, P.end));
      revealAt(tFreeze);
      skipBtn.hidden = tFreeze >= P.end;
      skipBtn.classList.toggle("shown", tFreeze >= SKIP_AT && tFreeze < P.end);
      if (tFreeze >= introEnd()) { settleEntrance(); html.classList.replace("intro-on", "intro-off"); }
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
    settleEntrance();
    html.classList.remove("intro-on");
    html.classList.add("intro-off");
    skipBtn.hidden = true;
  }
  // resize (incl. mobile URL-bar show/hide): re-measure and re-plan in place; never skip
  addEventListener("resize", () => {
    if (playing) { setup(); return; }
    if (!raf && P && tFreeze == null) { lk.measure(); lk.render(P.end); }
  });

  // ---------- paper bits ----------
  if (window.Notes) {
    Notes.config({ zIndex: 2 }); // behind the text and buttons (z 3), in front of the sheet
    const idle = window.requestIdleCallback || ((f) => setTimeout(f, 400));
    idle(() => Notes.preload(Notes.texture, ["music", "projects", "thoughts", "code", ["paws", "#e07a1f"]]));
  }
  // keywords get a smaller pop than the section buttons: small bits that hop out sideways
  // (clear of the caption drawn above the word) and fade before they reach the buttons
  const KW_ARC = { vy: [-230, -150], vx: 250, from: "center", intensity: 0.4, throttle: 900 };
  const KW_BURST = {
    engineer: { ...KW_ARC, preset: "projects", count: 4, size: [19, 25] },
    rit: { ...KW_ARC, preset: "paws", count: 4, size: [17, 22], color: "#e07a1f" },
    composing: { ...KW_ARC, preset: "music", count: 4, size: [21, 28], spin: 4, sound: true },
    stack: { ...KW_ARC, preset: "code", count: 3, size: [16, 21], vx: 200 },
  };
  const kwBurst = (el) => window.Notes?.burst(el, KW_BURST[el.dataset.kw]);
  kws.forEach((el) => {
    el.addEventListener("pointerenter", (e) => { if (e.pointerType !== "touch" && !playing) kwBurst(el); });
    el.addEventListener("focus", () => { if (el.matches(":focus-visible")) kwBurst(el); });
  });

  // ---------- section buttons: hover = lift + icon shake (kit) + paper bits; rope inside on hover or press ----------
  const secBtns = [...document.querySelectorAll(".hnav .ysecbtn")];
  const secBurst = (b) => window.Notes?.burst(b.querySelector(".ydot") || b, { preset: b.dataset.burst, sound: b.dataset.burst === "music" });
  secBtns.forEach((b) => {
    b.addEventListener("pointerenter", (e) => {
      if (e.pointerType === "touch" || playing) return;
      secBurst(b);
      if (OPT.secrope === "hover") snd("sew", { el: b });
    });
    b.addEventListener("focus", () => { if (b.matches(":focus-visible")) secBurst(b); });
  });

  // ---------- go to a section: the kit transition grows out of what you pressed ----------
  document.addEventListener("pointerdown", (e) => {
    const g = e.target.closest?.("[data-go]");
    if (g && e.button === 0) snd("tap", { el: g });
  });
  let pending = 0;
  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-go]");
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (Y.transition.busy || pending) return;
    const go = () => { pending = 0; Y.transition.go(a, a.href, a.dataset.go); };
    // press mode: the button becomes "selected" (rope sews in) a beat before the cloth grows
    if (a.classList.contains("ysecbtn") && OPT.secrope === "press" && !reduced) {
      a.setAttribute("aria-current", "true");
      pending = setTimeout(go, 170);
    } else go();
  });
  const unselect = () => secBtns.forEach((b) => b.removeAttribute("aria-current"));
  addEventListener("keydown", (e) => { if (e.key === "Escape") { clearTimeout(pending); pending = 0; setTimeout(unselect, 120); } });
  addEventListener("pageshow", (e) => { if (e.persisted) unselect(); });

  // ---------- contact ----------
  const cBox = document.getElementById("contact");
  const cBtn = document.getElementById("contact-btn");
  const desktop = matchMedia("(min-width: 960px)");
  const setContact = (open) => {
    cBtn.setAttribute("aria-expanded", String(open));
    cBox.classList.toggle("open", open);
    cBox.inert = OPT.contact === "button" && desktop.matches && !open;
  };
  setContact(false);
  desktop.addEventListener?.("change", () => setContact(cBtn.getAttribute("aria-expanded") === "true"));
  cBtn.addEventListener("click", () => { const o = cBtn.getAttribute("aria-expanded") !== "true"; setContact(o); snd(o ? "open" : "close", { el: cBtn }); });
  // arriving from the nav's Contact (home/index.html?skip#contact): the icons wave hello
  const callContact = () => {
    if (location.hash !== "#contact") return;
    if (OPT.contact === "button") setContact(true);
    cBox.classList.remove("is-called"); void cBox.offsetWidth; cBox.classList.add("is-called");
    cBox.scrollIntoView({ block: "nearest" });
  };
  callContact();
  addEventListener("hashchange", callContact);

  // ---------- screenshot / review demos (every state by URL) ----------
  function runDemos() {
    if (!demo) return;
    const nt = q.has("nt") ? parseFloat(q.get("nt")) : 300;
    const freezeBurst = (el, opts) => {
      if (!window.Notes) return;
      Notes.seed(7);
      Notes.burst(el, opts);
      Notes.whenReady().then(() => Notes.freeze(nt));
    };
    if (demo.startsWith("kw-")) {
      const k = demo.slice(3);
      const el = k === "python" ? document.querySelector('.kw[data-stack="Python"]') : document.querySelector(`.kw[data-kw="${k}"]`);
      if (el) { el.classList.add("is-hover"); freezeBurst(el, { ...KW_BURST[el.dataset.kw], throttle: 0 }); }
    }
    if (demo.startsWith("notes-") || demo === "hover") {
      const sec = demo === "hover" ? "music" : demo.slice(6);
      const b = document.querySelector(`.hnav .ysecbtn[data-burst="${sec}"]`);
      if (b) { b.classList.add("is-hover"); freezeBurst(b.querySelector(".ydot"), { preset: sec, throttle: 0 }); }
      if (demo === "hover") document.querySelector('.kw[data-kw="composing"]')?.classList.add("is-hover");
    }
    if (demo.startsWith("press-")) document.querySelector(`.hnav .ysecbtn[data-burst="${demo.slice(6)}"]`)?.setAttribute("aria-current", "true");
    if (demo.startsWith("open-")) {
      const sec = demo.slice(5);
      const b = document.querySelector(`.hnav .ysecbtn[data-go="${sec}"]`) || document.querySelector(`.bio .kw[data-go="${sec}"]`);
      const p = q.has("p") ? U.clamp(parseFloat(q.get("p")) || 0, 0, 1) : 0.5;
      // mobile hides the section buttons (the bar is the nav): grow from the keyword instead
      const from = b && b.offsetParent ? b : document.querySelector(`.bio .kw[data-go="${sec}"]`);
      if (from) Y.transition.go(from, "#", sec, { freeze: p });
    }
    if (demo === "contact") { location.hash = "contact"; }
  }

  window.HomePage = { finish, play, lockup: lk, schedule: SCHED, options: OPT };
})();
