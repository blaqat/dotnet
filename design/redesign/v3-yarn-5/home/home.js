/* ============================================================
   home/home.js · iteration 5 wiring: intro schedule + playback (behind the
   "Press unmute for sound" callout), the bio entrance, keyword hover (letter
   ripple on every word incl. "composing", which also drops purple felt notes + its
   sound; stack tags don't ripple, their icon shakes), section buttons,
   the section transition (kit Yarn.transition.go), contact, mock options, demos.
   URL params (all optional; every one is in the ⚙ panel or listed here):
     intro=drop|simple|cursor   force an intro (default: the schedule)
     visit=first|recent|later   simulate the schedule (not saved)   roll=1..500 (1 = cursor)
     ball=toon|soft             toon = exaggerated squash/stretch, 3 bounces + roll (default); soft = iteration 1
     enter=cascade|fade         bio entrance: one section after another with keyword pops + scribbles (default) | all at once (i1)
     callout=auto|always|off    "Press unmute for sound" before the intro (auto: not after a saved "off", not when back within the hour)
     kwline=section|blue        keyword wave underline: colour of where it leads (default) | all blue like "software engineer"
     stk=white|cotton           Home's stack tags: white knit (default) | cotton
     secrope=hover|press        section buttons: rope sews in on hover, flush on the button edge (default) | rope only when pressed
     contact=icons|button       desktop contact: icon + username links on screen (default) | behind a button (i1)
     sheetin=rise|slide|grow    (kit) how the next page's white sheet arrives: its top edge rises from the bottom (default) | the whole sheet slides up | grows from the button (i3)
     skip                       end state, no intro          t=<ms>   freeze the intro + entrance at t
     pointer=fine|coarse        override pointer detection (cursor mode)
     demo=kw-engineer|kw-rit|kw-composing|kw-python [&nt=ms]   keyword hover frozen (ripple / composing's ripple + notes / python's icon shake)
     demo=hover-projects|hover-music|hover-thoughts            section button hover (old demo=notes-* still works)
     demo=press-music           section button selected (rope inside)
     demo=open-projects|open-music|open-thoughts [&p=0..1]     the kit transition, frozen
     demo=callout [&nt=ms]      the sound callout, frozen (countdown at nt, default 900)
     demo=contact               the contact links being "called" (as from the nav's Contact)
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
    callout: pick("callout", ["auto", "always", "off"], "auto"),
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
  // i5 (G1): intro / visit / roll are demo-state helpers ("Jump to"); everything else here is decided (Earlier options)
  const panel = Y.mockPanel([
    { label: "Intro", param: "intro", options: [["", "Schedule"], ["drop", "Yarn drop"], ["simple", "Simple"], ["cursor", "Cursor cat"]], default: "", state: true },
    { label: "Simulate visit", param: "visit", options: [["", "Real"], ["first", "First ever"], ["recent", "< 1 h ago"], ["later", "> 1 h ago"]], default: "", state: true },
    { label: "1-in-500 roll", param: "roll", options: [["", "Random"], ["1", "1 (cursor)"], ["250", "250"]], default: "", state: true },
    { label: "Sound callout", param: "callout", options: [["auto", "Before the intro (auto)"], ["always", "Every intro"], ["off", "Off (i3)"]], default: "auto" },
    { label: "Ball", param: "ball", options: [["toon", "Toon squash"], ["soft", "Soft (i1)"]], default: "toon" },
    { label: "Bio entrance", param: "enter", options: [["cascade", "Cascade"], ["fade", "All at once (i1)"]], default: "cascade" },
    { label: "Keyword underline", param: "kwline", options: [["section", "Wave · where it leads"], ["blue", "Wave · all blue"]], default: "section" },
    { label: "Stack tags", param: "stk", options: [["white", "White knit"], ["cotton", "Cotton"]], default: "white" },
    { label: "Section rope", param: "secrope", options: [["hover", "Sews in on hover"], ["press", "On press only"]], default: "hover" },
    { label: "Contact (desktop)", param: "contact", options: [["icons", "On screen"], ["button", "Button (i1)"]], default: "icons" },
    { label: "Next page's sheet", param: "sheetin", options: [["rise", "Rises from the bottom"], ["slide", "Slides up (heavier)"], ["grow", "Grows from button (i3)"]], default: "rise" },
  ], { title: "Home options" });
  const fs = document.createElement("fieldset");
  fs.dataset.ykeep = ""; // kept when the panel re-renders on open
  const MODE_LABEL = { drop: "Yarn drop", simple: "Simple", cursor: "Cursor cat" };
  fs.innerHTML = `<legend>This visit</legend><p style="margin:0 0 6px;font-weight:600;color:var(--ink-2)">${MODE_LABEL[mode] || mode} · ${Y.esc(SCHED.why || "")}${SCHED.roll ? ` · roll ${SCHED.roll}` : ""}</p><button type="button" id="replay">↻ Replay intro</button>`;
  // a demo helper: it heads the panel's "Jump to" section (G1), or the first section if there's none
  const h4s = [...panel.querySelectorAll("h4")];
  (h4s.find((h) => /jump to/i.test(h.textContent)) || h4s[0])?.after(fs);

  // ---------- keyword letters (for the ripple) ----------
  // Each keyword's own text becomes a row of letters (aria-hidden) + one screen-reader copy, before the scribble
  // measures the word. Spaces stay plain text, so the word keeps its width.
  const kws = [...document.querySelectorAll(".bio .kw")];
  function splitLetters(host) {
    const list = [];
    [...host.childNodes].forEach((n) => {
      if (n.nodeType !== 3 || !n.textContent.trim()) return;
      const text = n.textContent.trim();
      const word = document.createElement("span");
      word.className = "kw__w"; word.setAttribute("aria-hidden", "true");
      for (const ch of text) {
        if (ch === " ") { word.append(" "); continue; }
        const l = document.createElement("span");
        l.className = "kw__l"; l.textContent = ch;
        word.append(l); list.push(l);
      }
      const sr = document.createElement("span");
      sr.className = "sr-only"; sr.textContent = text;
      n.replaceWith(word, sr);
    });
    return list;
  }
  // i5 (owner H3): the stack tags don't ripple; their icon shakes on hover like every other icon (kit .ystk:hover)
  kws.forEach((el) => { if (!el.classList.contains("ystk")) el._letters = splitLetters(el); });

  // ---------- lockup + intro ----------
  const svg = document.getElementById("lockup");
  const lk = new HomeLockup(svg, { withCat: !cursorMode });
  const skipBtn = document.getElementById("skip");
  const ents = [...document.querySelectorAll(".ent")];
  const scribbles = kws.filter((k) => k.classList.contains("yscribble"));
  scribbles.forEach((el) => Y.scribble(el));
  let P = null, raf = 0, t0 = 0, E = null, sounds = null, soundsDeaf = false, runId = 0;

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
  // items that are still (nearly) invisible can't be clicked by accident: they take pointer events once they show
  const touchable = (el, on) => { el.style.pointerEvents = on ? "auto" : "none"; };
  function revealAt(t) {
    ents.forEach((el) => {
      const u = U.sat((t - (E.start + (E.order.get(el) ?? 0) * E.step)) / E.dur);
      const e = U.outCubic(u);
      el.style.opacity = u >= 1 ? "1" : e.toFixed(3);
      el.style.transform = u >= 1 ? "none" : `translateY(${((1 - e) * 10).toFixed(1)}px)`;
      touchable(el, u > 0.6);
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
    ents.forEach((el) => { el.style.opacity = ""; el.style.transform = ""; el.style.pointerEvents = ""; });
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
    runId++;
    closeCallout("skip");
    cancelAnimationFrame(raf);
    raf = 0;
    if (P) lk.render(P.end);
    sounds?.stop(); sounds = null; soundsDeaf = false;
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
    soundsDeaf = !!window.YarnSound?.enabled && !window.YarnSound.ready; // "on", but no gesture yet: the first one catches up
    t0 = performance.now();
    raf = requestAnimationFrame(frame);
  }
  // sound became audible mid-intro (switched on, or a first tap unlocked a saved "on"): schedule whatever is still ahead
  function resync() {
    if (!raf || !window.YarnSound?.enabled) return;
    sounds?.stop();
    const el = performance.now() - t0;
    sounds = YarnSound.schedule(lk.soundEvents().filter((x) => x.at > el + 40).map((x) => ({ ...x, at: x.at - el })));
  }
  addEventListener("yarnsound", () => setTimeout(resync, 40));

  // skip: the Skip button or Esc. A click/tap on the page no longer skips (the owner's first click did, by accident);
  // during the intro a first gesture only catches the sound up.
  const onKey = (e) => { if (e.key === "Escape" && playing && raf) finish(); };
  const onDown = () => { if (soundsDeaf) { soundsDeaf = false; setTimeout(resync, 60); } };
  function addSkipListeners() { addEventListener("keydown", onKey); addEventListener("pointerdown", onDown, true); }
  function removeSkipListeners() { removeEventListener("keydown", onKey); removeEventListener("pointerdown", onDown, true); }
  skipBtn.addEventListener("click", finish);
  panel.querySelector("#replay")?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (reduced) return;
    runId++;
    closeCallout("skip");
    window.HomeCursor?.stop?.();
    setup();
    play();
  });

  // tap the lockup: the dot hops (also the touch fallback for cursor mode)
  svg.addEventListener("click", () => { if (!playing) { lk.hop(); snd("ball-bounce", { intensity: 0.5, el: svg }); } });

  /* ---------- Overall 8: "Press unmute for sound", before the intro's items come in ----------
     The intro waits (blank sheet) while a small callout points at the sound toggle, wherever the kit put it
     (Yarn.soundToggle(): ?soundui tag / brand / nav, desktop or phone bar). Unmute → the intro plays with sound;
     no answer for a couple of seconds (or a tap elsewhere, or Esc) → it plays muted. Nothing here skips the intro.
     auto: asked on first / later visits; not after a saved "off", not when back within the hour (Simple intro). */
  const CALL_MS = 2600;
  let call = null;
  const toggleEl = () => {
    const vis = (b) => {
      if (!b || b.hidden || !b.getClientRects().length) return false;
      const r = b.getBoundingClientRect();
      return r.width > 2 && r.height > 2 && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth && getComputedStyle(b).visibility !== "hidden";
    };
    const k = Y.soundToggle?.();
    return vis(k) ? k : [...document.querySelectorAll("[data-sound-toggle]")].find(vis) || null;
  };
  function wantCallout() {
    if (OPT.callout === "off" || reduced || tFreeze != null || (demo && demo !== "callout")) return false;
    const S = window.YarnSound;
    if (!S?.supported) return false;
    if (OPT.callout === "always" || demo === "callout") return true;
    if (S.source !== "default" && !S.enabled) return false; // they said "off" before (or ?sound=off)
    return SCHED.visit !== "recent";
  }
  // sound.js loads async: give it a moment to unhide the toggles
  const soundReady = () => new Promise((res) => {
    const t0w = performance.now();
    const tick = () => (window.YarnSound && toggleEl()) || performance.now() - t0w > 600 ? res() : requestAnimationFrame(tick);
    tick();
  });
  function askSound({ freezeAt = null } = {}) {
    return new Promise((resolve) => {
      const target = toggleEl();
      if (!target) return resolve("none");
      const on = !!window.YarnSound.enabled;
      const el = document.createElement("div");
      el.className = "hcall";
      el.innerHTML = `<div class="hcall__in" role="status"><button type="button" class="hcall__btn"><i class="ph-bold ph-speaker-simple-high" aria-hidden="true"></i><span>${on ? "Tap for sound" : "Press unmute for sound"}</span></button><span class="hcall__time" aria-hidden="true"></span></div>`;
      const ring = document.createElement("span");
      ring.className = "hcall-ring"; ring.setAttribute("aria-hidden", "true");
      document.querySelector(".hero")?.before(el); // early in the tab order, right after the nav
      document.body.append(ring);
      const btn = el.querySelector(".hcall__btn"), bar = el.querySelector(".hcall__time");
      let last = "", raf2 = 0;
      const edge = Math.max(10, Y.px("--frame") + 8); // stay on the sheet, clear of the cord frame
      const place = () => {
        const t = toggleEl() || target;
        const r = t.getBoundingClientRect();
        const cw = el.offsetWidth, ch = el.offsetHeight, W = innerWidth, H = innerHeight;
        const below = r.top + r.height / 2 < H / 2;
        const x = Math.round(Y.clamp(r.left + r.width / 2 - cw / 2, edge, W - cw - edge));
        const y = Math.round(below ? r.bottom + 12 : r.top - 12 - ch);
        const tail = Math.round(Y.clamp(r.left + r.width / 2 - x, 20, cw - 20));
        const key = `${x}|${y}|${tail}|${below}|${r.left}|${r.top}|${r.width}|${r.height}`;
        if (key !== last) {
          last = key;
          el.style.transform = `translate(${x}px, ${y}px)`;
          el.dataset.side = below ? "below" : "above";
          el.style.setProperty("--tail", `${tail}px`);
          Object.assign(ring.style, { transform: `translate(${r.left}px, ${r.top}px)`, width: `${r.width}px`, height: `${r.height}px`, borderRadius: getComputedStyle(t).borderRadius || "999px" });
        }
        raf2 = requestAnimationFrame(place);
      };
      place();
      const clock = bar.animate([{ transform: "scaleX(1)" }, { transform: "scaleX(0)" }], { duration: CALL_MS, easing: "linear", fill: "forwards" });
      if (freezeAt != null) { clock.pause(); clock.currentTime = freezeAt; }
      const pause = () => clock.pause(), resume = () => { if (freezeAt == null && clock.playState === "paused") clock.play(); };
      el.addEventListener("pointerenter", pause);
      el.addEventListener("pointerleave", resume);
      el.addEventListener("focusin", pause);
      el.addEventListener("focusout", resume);
      const answer = (how) => call?.close(how);
      const onSound = (e) => answer(e.detail?.enabled ? "sound" : "muted");
      btn.addEventListener("click", () => {
        if (!YarnSound.enabled) YarnSound.setEnabled(true); // inside the click: unlocks audio; "yarnsound" answers
        else answer("sound"); // already on: this tap was the gesture audio needed
      });
      const onDownAny = (e) => {
        if (e.target.closest?.(".hcall, [data-sound-toggle], .mockpanel")) return;
        answer(YarnSound.enabled ? "sound" : "muted"); // a tap elsewhere = "no thanks" (or, when on, the gesture)
      };
      const onEsc = (e) => { if (e.key === "Escape") { e.stopImmediatePropagation(); answer(YarnSound.enabled ? "sound" : "muted"); } };
      addEventListener("yarnsound", onSound);
      addEventListener("pointerdown", onDownAny, true);
      addEventListener("keydown", onEsc, true);
      if (freezeAt == null) clock.finished.then(() => answer("timeout")).catch(() => {});
      call = {
        close(how) {
          if (!call) return;
          call = null;
          cancelAnimationFrame(raf2);
          removeEventListener("yarnsound", onSound);
          removeEventListener("pointerdown", onDownAny, true);
          removeEventListener("keydown", onEsc, true);
          clock.cancel();
          ring.remove();
          const out = el.animate([{ opacity: 1 }, { opacity: 0, transform: el.style.transform + " translateY(-4px)" }], { duration: 160, easing: "ease-out", fill: "forwards" });
          const gone = () => { if (el.contains(document.activeElement)) document.activeElement.blur(); el.remove(); };
          out.finished.then(gone, gone);
          resolve(how);
        },
      };
    });
  }
  function closeCallout(how) { call?.close(how); }

  // boot: wait for fonts (they move the lockup), but never long
  const ready = Promise.race([document.fonts?.ready || Promise.resolve(), new Promise((r) => setTimeout(r, 700))]);
  setup();
  if (playing) { lk.render(0); revealAt(0); } else { lk.render(P.end); }
  ready.then(() => requestAnimationFrame(async () => {
    setup();
    const staticDemo = demo && demo !== "chase";
    if (demo === "callout") {
      html.classList.replace("intro-off", "intro-on");
      playing = true;
      lk.render(0); revealAt(0); skipBtn.hidden = true;
      await soundReady();
      askSound({ freezeAt: q.has("nt") ? parseFloat(q.get("nt")) || 0 : 900 });
      return;
    }
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
      const my = ++runId;
      if (wantCallout()) {
        await soundReady();
        if (my !== runId) return;
        if (wantCallout() && playing) {
          skipBtn.hidden = true;
          await askSound();
          if (my !== runId || !playing) return; // Replay / Skip took over meanwhile
          setup();
        }
      }
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
    if (playing) { setup(); if (!raf) { lk.render(0); revealAt(0); } return; }
    if (!raf && P && tFreeze == null) { lk.measure(); lk.render(P.end); }
  });

  // ---------- keyword hover ----------
  // Every keyword: a ripple runs through its letters. i5 (owner H2): "composing" ripples too (its ♫ caption is gone)
  // and still drops a few felt notes + the music sound, now purple (its wave's colour) instead of black.
  // Stack tags: no ripple (H3), the kit shakes their icon. No paper bits anywhere else (owner: "excessive").
  const NOTE_PURPLE = getComputedStyle(html).getPropertyValue("--purple").trim() || "#8a4fc6";
  if (window.Notes) {
    Notes.config({ zIndex: 2 }); // behind the text and buttons (z 3), in front of the sheet
    const idle = window.requestIdleCallback || ((f) => setTimeout(f, 400));
    idle(() => Notes.preload(Notes.texture, [["music", NOTE_PURPLE]]));
  }
  const COMPOSE = { preset: "music", vy: [-230, -150], vx: 250, from: "center", intensity: 0.4, throttle: 900, count: 4, size: [21, 28], spin: 4, sound: true, color: NOTE_PURPLE };
  const RIP = { dur: 520, step: 30 };
  function ripple(el, { freezeAt = null } = {}) {
    const ls = el._letters;
    if (!ls?.length || reduced || (el._rip && freezeAt == null)) return;
    el._rip = true;
    let lastA = null;
    ls.forEach((l, i) => {
      lastA = l.animate([
        { transform: "translateY(0) rotate(0deg)" },
        { transform: `translateY(-.24em) rotate(${i % 2 ? 5 : -5}deg)`, offset: 0.32 },
        { transform: "translateY(.03em) rotate(0deg)", offset: 0.7 },
        { transform: "translateY(0) rotate(0deg)" },
      ], { duration: RIP.dur, delay: i * RIP.step, easing: "cubic-bezier(.3,.6,.35,1)" });
      if (freezeAt != null) { lastA.pause(); lastA.currentTime = freezeAt; }
    });
    if (freezeAt == null) lastA.finished.then(() => (el._rip = false), () => (el._rip = false));
  }
  const kwHover = (el) => {
    if (playing) return;
    ripple(el); // no-op for the stack tags (no letters)
    if (el.dataset.kw === "composing") window.Notes?.burst(el, COMPOSE);
  };
  kws.forEach((el) => {
    el.addEventListener("pointerenter", (e) => { if (e.pointerType !== "touch") kwHover(el); });
    el.addEventListener("focus", () => { if (el.matches(":focus-visible")) kwHover(el); });
  });

  // ---------- section buttons: hover = lift + icon shake (kit) + the rope sews in (?secrope=hover) ----------
  const secBtns = [...document.querySelectorAll(".hnav .ysecbtn")];
  secBtns.forEach((b) => {
    b.addEventListener("pointerenter", (e) => {
      if (e.pointerType === "touch" || playing) return;
      if (OPT.secrope === "hover") snd("sew", { el: b });
    });
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
  // arriving at home/index.html?skip#contact: the links wave hello
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
    if (demo.startsWith("kw-")) {
      const k = demo.slice(3);
      const el = k === "python" ? document.querySelector('.kw[data-stack="Python"]') : document.querySelector(`.kw[data-kw="${k}"]`);
      if (el) {
        el.classList.add("is-hover");
        ripple(el, { freezeAt: nt });
        if (el.dataset.kw === "composing" && window.Notes) {
          Notes.seed(7);
          Notes.burst(el, { ...COMPOSE, throttle: 0, sound: false });
          Notes.whenReady().then(() => Notes.freeze(nt));
        }
        // stack tag: the kit's icon shake, frozen at nt (home.css mirrors the kit hover on .is-hover)
        if (el.classList.contains("ystk")) requestAnimationFrame(() => el.querySelector(":scope > :is(img, i)")?.getAnimations().forEach((a) => { a.pause(); a.currentTime = Math.min(nt, 459); }));
      }
    }
    const hov = demo.match(/^(?:notes|hover)-(projects|music|thoughts)$/);
    if (hov || demo === "hover") {
      const b = document.querySelector(`.hnav .ysecbtn[data-go="${hov ? hov[1] : "music"}"]`);
      b?.classList.add("is-hover");
      if (demo === "hover") document.querySelector('.kw[data-kw="composing"]')?.classList.add("is-hover");
    }
    if (demo.startsWith("press-")) document.querySelector(`.hnav .ysecbtn[data-go="${demo.slice(6)}"]`)?.setAttribute("aria-current", "true");
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

  window.HomePage = { finish, play, lockup: lk, schedule: SCHED, options: OPT, askSound };
})();
