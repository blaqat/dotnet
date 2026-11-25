/* ============================================================
   kit/sound.js · yarn UI sound effects (owner: sound agent)
   Every sound is synthesized live in WebAudio: no files, no licenses.
   OFF on every page load (i6 · mobile, owner: "always start muted": a choice is no longer remembered across pages
   or visits; i5 resumed a saved "on" after the first tap). ?sound=on|off overrides for testing.

   API  window.YarnSound
     play(name, opts?) -> handle {stop()} | null   (never throws)
        opts: volume 0..2 (x1), rate (pitch+speed, x1), pan -1..1,
              el (auto-pan from an element's x), variation 0..1
              (random detune/level, per-sound default), intensity 0..1
              (ball-bounce, swat, drop…), duration s (ball-roll, unspool),
              delay ms (schedule on the audio clock)
     schedule([{ name, at: ms, opts }]) -> {stop()}   e.g. the home intro
     enabled (get)  setEnabled(bool)  toggle()  ready (audio running)
     volume (get/set master 0..1)    on(fn) -> off   (fn(enabled))
     names  info(name)  INTRO (reference timeline)
     render(name, opts) / renderSequence(events, seconds) -> Promise<AudioBuffer>
        (OfflineAudioContext; used by kit/sound-test.html)
   Toggle  every [data-sound-toggle] is unhidden (stays hidden without WebAudio), wired, kept in sync:
     aria-pressed, aria-label "Sound effects", data-hint "Sound on/off" (i6 · X3: the kit hint, not a native title),
     data-sound-state="on|off"; ph-speaker-* icons are swapped (except [data-ysnd] ones: the tag shows both, by CSS).
     i5 (H1): it shows `live` = on AND audible (the browser let audio run after a gesture on this page), so it never
     says "on" while nothing can play; a saved "on" shows muted until the first tap/key. `enabled` = the visitor's
     choice; the "yarnsound" event carries both ({ enabled, live }) and fires again when the audio actually starts.
     i5 (G8): ?uisnd=quiet (default) silences UI sounds while the player plays (its own control sounds stay);
     ?uisnd=always = i4 (ducked 40%).
   Rules baked in: nothing plays before the first pointer/key gesture
   (no queued burst), nothing while the tab is hidden, hover sounds only
   with a fine pointer, per-name rate limits, max 8 voices, a soft
   limiter on the master, ducked 40% while the music player plays.
   ============================================================ */
(() => {
  "use strict";
  if (window.YarnSound) return;

  const KEY = "yarn.sound";
  const params = new URLSearchParams(location.search);
  const AC = window.AudioContext || window.webkitAudioContext;
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const MAX_VOICES = 8;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---------------- randomness (seedable for offline renders) ---------------- */
  const seeded = (seed) => () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  let rand = Math.random;
  const rr = (a, b) => a + (b - a) * rand();

  /* ---------------- noise buffers, built once per context ---------------- */
  const bufCache = new WeakMap();
  function bufs(ctx) {
    let B = bufCache.get(ctx);
    if (B) return B;
    const sr = ctx.sampleRate, n = Math.floor(sr * 2), r = seeded(7);
    const make = (fill) => {
      const b = ctx.createBuffer(1, n, sr), d = b.getChannelData(0);
      fill(d);
      let pk = 0;
      for (let i = 0; i < n; i++) pk = Math.max(pk, Math.abs(d[i]));
      for (let i = 0; i < n; i++) d[i] /= pk || 1;
      return b;
    };
    B = {
      white: make((d) => { for (let i = 0; i < n; i++) d[i] = r() * 2 - 1; }),
      // Paul Kellet's pink filter: soft, wool-like
      pink: make((d) => {
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < n; i++) {
          const w = r() * 2 - 1;
          b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759;
          b2 = 0.969 * b2 + w * 0.153852; b3 = 0.8665 * b3 + w * 0.3104856;
          b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
          d[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362; b6 = w * 0.115926;
        }
      }),
      // brown: low rumble (ball rolling on felt)
      brown: make((d) => {
        let b = 0;
        for (let i = 0; i < n; i++) { b = (b + 0.02 * (r() * 2 - 1)) / 1.02; d[i] = b; }
      }),
      // fabric: noise with sparse, smoothed crackle bursts = fibres catching
      fabric: make((d) => {
        const step = Math.max(1, Math.round(sr * 0.004));
        let env = 0, target = 0;
        for (let i = 0; i < n; i++) {
          if (i % step === 0) target = r() < 0.35 ? r() * r() : r() * 0.12;
          env += (target - env) * 0.02;
          d[i] = (r() * 2 - 1) * (0.1 + env);
        }
      }),
    };
    bufCache.set(ctx, B);
    return B;
  }

  /* ---------------- synthesis primitives ----------------
     V = { ctx, out, k (pitch scale), T (time scale), end } */
  function envGain(V, t, { a = 0.004, hold = 0, d = 0.1, gain = 1 } = {}) {
    const g = V.ctx.createGain();
    a *= V.T; hold *= V.T; d *= V.T;
    const peak = Math.max(gain, 1e-4), tEnd = t + a + hold + d;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    if (hold > 0) g.gain.setValueAtTime(peak, t + a + hold);
    g.gain.exponentialRampToValueAtTime(1e-4, tEnd);
    g.gain.linearRampToValueAtTime(0, tEnd + 0.01);
    V.end = Math.max(V.end, tEnd + 0.02);
    return { g, stop: tEnd + 0.03 };
  }
  function sweep(param, t, V, f, f2, glide, f3, glide2) {
    param.setValueAtTime(f * V.k, t);
    if (f2) param.exponentialRampToValueAtTime(f2 * V.k, t + glide * V.T);
    if (f3) param.exponentialRampToValueAtTime(f3 * V.k, t + (glide + glide2) * V.T);
  }
  function tone(V, t, { type = "sine", f, f2, glide, a, hold, d = 0.1, gain = 0.5, out } = {}) {
    const o = V.ctx.createOscillator();
    o.type = type;
    sweep(o.frequency, t, V, f, f2, glide ?? d);
    const e = envGain(V, t, { a, hold, d, gain });
    o.connect(e.g); e.g.connect(out || V.out);
    o.start(t); o.stop(e.stop);
    return e.g;
  }
  function noise(V, t, { kind = "pink", filters = [], a, hold, d = 0.1, gain = 0.5, out } = {}) {
    const ctx = V.ctx, s = ctx.createBufferSource();
    s.buffer = bufs(ctx)[kind];
    s.loop = true;
    let node = s;
    for (const fl of filters) {
      const b = ctx.createBiquadFilter();
      b.type = fl.type;
      b.Q.value = fl.q ?? 0.707;
      sweep(b.frequency, t, V, fl.f, fl.f2, fl.glide ?? d, fl.f3, fl.glide2 ?? 0.1);
      node.connect(b); node = b;
    }
    const e = envGain(V, t, { a, hold, d, gain });
    node.connect(e.g); e.g.connect(out || V.out);
    s.start(t, rand() * 1.5); s.stop(e.stop);
    return e.g;
  }
  // amplitude wobble (rolling lumps, flutter, purr trill)
  function wobble(V, t, dur, { f, f2, depth = 0.4, out } = {}) {
    const ctx = V.ctx, g = ctx.createGain(), l = ctx.createOscillator(), lg = ctx.createGain();
    g.gain.value = 1 - depth;
    l.frequency.setValueAtTime(f, t);
    if (f2) l.frequency.exponentialRampToValueAtTime(f2, t + dur * V.T);
    lg.gain.value = depth;
    l.connect(lg); lg.connect(g.gain);
    l.start(t); l.stop(t + dur * V.T + 0.1);
    g.connect(out || V.out);
    return g;
  }
  // soft felt thud: sine with a pitch drop + a puff of low noise
  // knock: a short mid "body" (~450-700 Hz) so the thud survives phone/laptop speakers,
  // which play almost nothing below ~250 Hz
  function thump(V, t, { f = 150, f2 = 60, d = 0.12, gain = 0.5, air = 0.3, lp = 700, knock = 0.35, out } = {}) {
    tone(V, t, { f, f2, glide: d * 0.55, a: 0.003, d, gain, out });
    if (knock) tone(V, t, { type: "triangle", f: Math.max(380, f * 3.1), f2: Math.max(300, f * 2.2), glide: d * 0.4, a: 0.002, d: Math.min(0.06, d * 0.5), gain: gain * knock, out });
    if (air) noise(V, t, { kind: "pink", filters: [{ type: "highpass", f: 120 }, { type: "lowpass", f: Math.max(lp, 900) }], a: 0.002, d: d * 0.4, gain: gain * air, out });
  }
  // wooden toy marimba: fundamental + tuned-bar partial (~3.93x) + mallet tick
  function marimba(V, t, f, { gain = 0.4, d = 0.45, out } = {}) {
    tone(V, t, { f, a: 0.002, d: d * 1.8, gain, out }); // fundamental rings on (-80 dB at 1.8 d)
    tone(V, t, { f: f * 3.93, a: 0.001, d: Math.min(0.07, d * 0.18), gain: gain * 0.28, out });
    noise(V, t, { kind: "white", filters: [{ type: "lowpass", f: 2400 }], a: 0.001, d: 0.012, gain: gain * 0.25, out });
  }
  // light felt press
  const tapP = (V, t, gain = 0.5) => {
    thump(V, t, { f: 240, f2: 130, d: 0.06, gain, air: 0 });
    noise(V, t, { kind: "white", filters: [{ type: "lowpass", f: 2200 }], a: 0.001, d: 0.012, gain: gain * 0.35 });
  };

  /* notes (Hz) */
  const N = { G4: 392, A4: 440, C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880, C6: 1046.5 };
  const PENTA = [N.C5, N.D5, N.E5, N.G5, N.A5, N.C6];

  /* ---------------- the sound set ----------------
     gain = calibrated level; gap = per-name rate limit (ms); dur = render length (s) */
  const G_INTRO = "Home intro", G_NAV = "Navigation & transitions", G_FILT = "Filters, tags & search",
    G_ITEM = "Items, sheets & lightbox", G_TIER = "Rankings", G_PLAY = "Music player", G_SYS = "Studio & system";

  const SOUNDS = {
    "ball-bounce": {
      group: G_INTRO, for: "Intro: the yarn ball hits the floor (pass intensity for each smaller bounce)",
      desc: "Soft felt thud with a tiny toy 'boing' on big squashes; lower, quieter and shorter as intensity drops.",
      gain: 0.55, gap: 70, dur: 0.4, variation: 0.2, intensity: true,
      fn(V, t, o) {
        const i = clamp(o.intensity ?? 1, 0, 1);
        thump(V, t, { f: 120 + 50 * (1 - i), f2: 52, d: 0.12 + 0.12 * i, gain: 0.25 + 0.6 * i, air: 0.6, lp: 450 + 650 * i });
        if (i > 0.35) tone(V, t + 0.012, { f: 200, f2: 290, glide: 0.08, a: 0.012, d: 0.13, gain: 0.09 * i });
      },
    },
    "ball-roll": {
      group: G_INTRO, for: "Intro: the ball rolls into the dot (opts.duration = roll time in s)",
      desc: "Low brown-noise rumble with a lumpy rotation wobble that slows down; a whisper of fibre on top.",
      gain: 0.73, gap: 300, dur: 0.75, variation: 0.15, intensity: true,
      fn(V, t, o) {
        const D = clamp(o.duration ?? 0.64, 0.15, 3), i = clamp(o.intensity ?? 1, 0, 1);
        const am = wobble(V, t, D, { f: 13, f2: 4, depth: 0.55 });
        noise(V, t, { kind: "brown", filters: [{ type: "highpass", f: 90 }, { type: "lowpass", f: 520, f2: 260, glide: D, q: 0.6 }], a: 0.05, hold: D * 0.45, d: D * 0.5, gain: 0.55 * (0.4 + 0.6 * i), out: am });
        noise(V, t, { kind: "fabric", filters: [{ type: "bandpass", f: 1400, f2: 800, glide: D, q: 1.1 }], a: 0.06, hold: D * 0.3, d: D * 0.6, gain: 0.12 * i, out: am });
      },
    },
    unspool: {
      group: G_INTRO, for: "Intro: the dot spins and the letters stitch out of it",
      desc: "A rising thread 'zip': crackly fabric noise through a narrow band sweeping up, with a flutter.",
      gain: 2.57, gap: 400, dur: 0.75, variation: 0.15,
      fn(V, t, o) {
        const D = clamp(o.duration ?? 0.5, 0.15, 2);
        const am = wobble(V, t, D, { f: 24, f2: 10, depth: 0.3 });
        noise(V, t, { kind: "fabric", filters: [{ type: "bandpass", f: 650, f2: 2100, glide: D, q: 2.6 }, { type: "lowpass", f: 4500 }], a: D * 0.2, hold: D * 0.3, d: D * 0.5, gain: 0.9, out: am });
      },
    },
    "strand-land": {
      group: G_INTRO, for: "Intro: the loose strand drops and settles on the floor",
      desc: "Short soft rustle with two or three tiny felt taps as the loops land.",
      gain: 1.33, gap: 300, dur: 0.35, variation: 0.25,
      fn(V, t) {
        noise(V, t, { kind: "fabric", filters: [{ type: "lowpass", f: 1100 }], a: 0.01, d: 0.18, gain: 0.7 });
        for (const dt of [0, rr(0.04, 0.06), rr(0.1, 0.13)]) thump(V, t + dt, { f: rr(240, 290), f2: 150, d: 0.04, gain: 0.16, air: 0.4 });
      },
    },
    pawstep: {
      group: G_INTRO, for: "Intro: the cat's paw lands (a few steps, never every frame)",
      desc: "Barely-there felt pad: a low muffled tap. Meant to be felt more than heard.",
      gain: 1.33, gap: 90, dur: 0.12, variation: 0.35,
      fn(V, t) {
        noise(V, t, { kind: "pink", filters: [{ type: "bandpass", f: 520, q: 0.9 }], a: 0.004, d: 0.045, gain: 0.9 });
        tone(V, t, { f: 140, f2: 90, a: 0.004, d: 0.05, gain: 0.3 });
      },
    },
    swat: {
      group: G_INTRO, for: "Intro: the cat bats the yarn (intensity for the 2nd, smaller swat)",
      desc: "Quick airy swipe into a soft 'bop' on the yarn.",
      gain: 0.45, gap: 120, dur: 0.3, variation: 0.25, intensity: true,
      fn(V, t, o) {
        const i = clamp(o.intensity ?? 1, 0, 1);
        noise(V, t, { kind: "pink", filters: [{ type: "bandpass", f: 500, f2: 1500, glide: 0.08, q: 1.3 }], a: 0.045, d: 0.05, gain: 0.45 * i + 0.1 });
        thump(V, t + 0.075, { f: 220, f2: 115, d: 0.09, gain: 0.35 + 0.35 * i, air: 0.5, lp: 1200 });
      },
    },
    "cat-sit": {
      group: G_INTRO, for: "Intro: the cat sits down into the logo pose",
      desc: "A soft 'flump': cushioned low thud with a small settle tap after it.",
      gain: 0.57, gap: 400, dur: 0.4, variation: 0.15,
      fn(V, t) {
        noise(V, t, { kind: "pink", filters: [{ type: "highpass", f: 150 }, { type: "lowpass", f: 900 }], a: 0.02, d: 0.2, gain: 0.6 });
        tone(V, t, { f: 120, f2: 68, glide: 0.12, a: 0.015, d: 0.18, gain: 0.35 });
        thump(V, t + 0.13, { f: 200, f2: 120, d: 0.05, gain: 0.15, air: 0.3 });
      },
    },
    "cat-chirp": {
      group: G_INTRO, for: "Optional: a tiny 'mrrp' when the cat is clicked (not in the default intro)",
      desc: "EXPERIMENTAL synthesized trill: a gliding buzzy tone through two vowel formants with a 'rr' flutter. Check by ear before using.",
      gain: 0.88, gap: 1200, dur: 0.45, variation: 0.3,
      fn(V, t) {
        const ctx = V.ctx, D = 0.26;
        const mix = ctx.createGain(); mix.gain.value = 1;
        const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 3200 * V.k;
        const trill = wobble(V, t, D, { f: 30, f2: 22, depth: 0.55, out: lp });
        lp.connect(V.out);
        for (const [f, f2, q, g] of [[700, 1050, 5, 1], [1900, 2400, 7, 0.45]]) {
          const b = ctx.createBiquadFilter(); b.type = "bandpass"; b.Q.value = q;
          sweep(b.frequency, t, V, f, f2, D);
          const bg = ctx.createGain(); bg.gain.value = g;
          mix.connect(b); b.connect(bg); bg.connect(trill);
        }
        const o = ctx.createOscillator(); o.type = "sawtooth";
        sweep(o.frequency, t, V, 430, 640, 0.08, 520, 0.16);
        const e = envGain(V, t, { a: 0.03, hold: 0.09, d: 0.14, gain: 0.5 });
        o.connect(e.g); e.g.connect(mix);
        o.start(t); o.stop(e.stop);
      },
    },

    tap: {
      group: G_NAV, for: "Any plain button/link press (nav tabs, back, 'show all')",
      desc: "Light felt press: a short low tick. The default 'something happened'.",
      gain: 0.92, gap: 50, dur: 0.12, variation: 0.3,
      fn(V, t) { tapP(V, t, 0.5); },
    },
    sew: {
      group: G_NAV, for: "Hover a home section button: the rope sews in (fine pointer only)",
      desc: "A short thread-pull 'zzip' through cloth, very quiet. Hover-only sounds never play on touch.",
      gain: 6.6, gap: 220, dur: 0.22, variation: 0.3, hover: true,
      fn(V, t) {
        noise(V, t, { kind: "fabric", filters: [{ type: "bandpass", f: 1200, f2: 2400, glide: 0.12, q: 3.5 }, { type: "lowpass", f: 4200 }], a: 0.03, d: 0.1, gain: 0.8 });
      },
    },
    notes: {
      group: G_NAV, for: "Music notes burst out of a section button (with Notes.burst)",
      desc: "Three quick wooden marimba notes rising on a pentatonic scale; a different little phrase each time.",
      gain: 0.28, gap: 300, dur: 1.1, variation: 0.1,
      fn(V, t) {
        let i = Math.floor(rr(0, 2.99));
        [0, 0.06, 0.12].forEach((dt, j) => {
          marimba(V, t + dt, PENTA[Math.min(i, PENTA.length - 1)], { gain: [0.4, 0.36, 0.44][j], d: j === 2 ? 0.5 : 0.3 });
          i += rand() < 0.6 ? 1 : 2;
        });
      },
    },
    cloth: {
      group: G_NAV, for: "Section transition part 1: the coloured cloth grows over the page",
      desc: "Warm swelling felt whoosh with a low 'whomp' under it.",
      gain: 0.39, gap: 500, dur: 0.75, variation: 0.1,
      fn(V, t, o) {
        const D = clamp(o.duration ?? 0.5, 0.2, 1.5);
        noise(V, t, { kind: "pink", filters: [{ type: "lowpass", f: 500, f2: 1400, glide: D * 0.8, q: 0.8 }], a: D * 0.55, d: D * 0.45, gain: 0.6 });
        tone(V, t, { f: 70, f2: 110, glide: D, a: D * 0.5, d: D * 0.5, gain: 0.22 });
      },
    },
    unroll: {
      group: G_NAV, for: "Section transition part 2: the white sheet unrolls",
      desc: "Longer fluttery fabric rustle that rises and settles, ending in a soft flap as the sheet lies flat.",
      gain: 0.43, gap: 500, dur: 0.95, variation: 0.1,
      fn(V, t, o) {
        const D = clamp(o.duration ?? 0.6, 0.25, 1.5);
        const am = wobble(V, t, D, { f: 18, f2: 9, depth: 0.25 });
        noise(V, t, { kind: "fabric", filters: [{ type: "bandpass", f: 600, f2: 1500, glide: D * 0.5, f3: 850, glide2: D * 0.5, q: 1.1 }], a: D * 0.18, hold: D * 0.4, d: D * 0.45, gain: 0.85, out: am });
        thump(V, t + D * 0.95, { f: 130, f2: 70, d: 0.12, gain: 0.3, air: 0.5 });
      },
    },

    "chip-on": {
      group: G_FILT, for: "Filter chip selected (solo or add)",
      desc: "Felt press + one bright wooden note (G5).",
      gain: 0.31, gap: 60, dur: 0.55, variation: 0.2,
      fn(V, t) { tapP(V, t, 0.32); marimba(V, t + 0.005, N.G5, { gain: 0.32, d: 0.25 }); },
    },
    "chip-off": {
      group: G_FILT, for: "Filter chip deselected / 'show all'",
      desc: "Softer press + a lower, shorter note (D5): the same chip, undone.",
      gain: 0.5, gap: 60, dur: 0.45, variation: 0.2,
      fn(V, t) { tapP(V, t, 0.28); marimba(V, t + 0.005, N.D5, { gain: 0.24, d: 0.16 }); },
    },
    "tag-remove": {
      group: G_FILT, for: "Remove a tag or search token (the red strike-through)",
      desc: "Soft scissor 'snip-snip' (band-limited, no hiss above 6 kHz) and the cut piece dropping.",
      gain: 1.28, gap: 90, dur: 0.25, variation: 0.25,
      fn(V, t) {
        for (const dt of [0, 0.045]) noise(V, t + dt, { kind: "white", filters: [{ type: "bandpass", f: 3000, q: 2.2 }, { type: "lowpass", f: 6000 }], a: 0.001, d: 0.025, gain: dt ? 0.38 : 0.3 });
        thump(V, t + 0.09, { f: 300, f2: 180, d: 0.05, gain: 0.16, air: 0.3 });
      },
    },
    "token-add": {
      group: G_FILT, for: "Search text turns into a tag token (e.g. 'python' -> stack tag)",
      desc: "A bubbly 'pop' like a button sewn on, then a light A5 note.",
      gain: 0.58, gap: 80, dur: 0.5, variation: 0.2,
      fn(V, t) {
        tone(V, t, { f: 320, f2: 720, glide: 0.035, a: 0.002, d: 0.07, gain: 0.42 });
        marimba(V, t + 0.03, N.A5, { gain: 0.22, d: 0.2 });
      },
    },

    open: {
      group: G_ITEM, for: "Open an item in place / expand a card / open a sheet or detail page",
      desc: "Rising cloth 'fwip' with a soft press under it.",
      gain: 1.63, gap: 120, dur: 0.35, variation: 0.2,
      fn(V, t) {
        noise(V, t, { kind: "pink", filters: [{ type: "bandpass", f: 500, f2: 1700, glide: 0.22, q: 1.2 }], a: 0.07, d: 0.16, gain: 0.55 });
        thump(V, t, { f: 160, f2: 90, d: 0.08, gain: 0.22, air: 0 });
      },
    },
    close: {
      group: G_ITEM, for: "Close an item / sheet / go back to browse",
      desc: "Falling cloth 'fwop' that tucks in with a little tap (closing back into its trigger).",
      gain: 0.61, gap: 120, dur: 0.35, variation: 0.2,
      fn(V, t) {
        noise(V, t, { kind: "pink", filters: [{ type: "bandpass", f: 1600, f2: 500, glide: 0.2, q: 1.2 }], a: 0.03, d: 0.17, gain: 0.5 });
        thump(V, t + 0.17, { f: 200, f2: 110, d: 0.07, gain: 0.28, air: 0.3 });
      },
    },
    "lightbox-open": {
      group: G_ITEM, for: "Lightbox opens from a thumbnail",
      desc: "A paper-photo flick, then an airy lift.",
      gain: 1.38, gap: 150, dur: 0.4, variation: 0.2,
      fn(V, t) {
        noise(V, t, { kind: "white", filters: [{ type: "bandpass", f: 2300, q: 0.9 }, { type: "lowpass", f: 5000 }], a: 0.002, d: 0.03, gain: 0.25 });
        noise(V, t + 0.01, { kind: "pink", filters: [{ type: "bandpass", f: 700, f2: 2000, glide: 0.3, q: 0.8 }], a: 0.1, d: 0.2, gain: 0.45 });
      },
    },
    "lightbox-close": {
      group: G_ITEM, for: "Lightbox closes back into the thumbnail",
      desc: "Airy fall that lands with a soft tap.",
      gain: 0.53, gap: 150, dur: 0.4, variation: 0.2,
      fn(V, t) {
        noise(V, t, { kind: "pink", filters: [{ type: "bandpass", f: 2000, f2: 700, glide: 0.25, q: 0.8 }], a: 0.02, d: 0.2, gain: 0.4 });
        tapP(V, t + 0.2, 0.35);
      },
    },
    copy: {
      group: G_ITEM, for: "Copy link / share copied",
      desc: "Two tiny paper ticks and a soft high C.",
      gain: 0.56, gap: 200, dur: 0.45, variation: 0.2,
      fn(V, t) {
        for (const dt of [0, 0.04]) noise(V, t + dt, { kind: "white", filters: [{ type: "bandpass", f: 2000, q: 1.5 }], a: 0.001, d: 0.012, gain: 0.3 });
        marimba(V, t + 0.05, N.C6, { gain: 0.2, d: 0.18 });
      },
    },

    pickup: {
      group: G_TIER, for: "Rankings: pick up an item (drag start)",
      desc: "A fibre tick and a small upward glide: lifted off the felt.",
      gain: 0.85, gap: 100, dur: 0.22, variation: 0.25,
      fn(V, t) {
        noise(V, t, { kind: "fabric", filters: [{ type: "bandpass", f: 1800, q: 1.5 }], a: 0.002, d: 0.025, gain: 0.35 });
        tone(V, t, { f: 330, f2: 495, glide: 0.08, a: 0.01, d: 0.11, gain: 0.25 });
      },
    },
    drop: {
      group: G_TIER, for: "Rankings: drop an item into a tier (opts.rate per tier: S 1.2 … F 0.8)",
      desc: "Felt thud pressed onto the board with a short woody C5 under it.",
      gain: 0.56, gap: 100, dur: 0.5, variation: 0.2, intensity: true,
      fn(V, t, o) {
        const i = clamp(o.intensity ?? 1, 0, 1);
        thump(V, t, { f: 170, f2: 70, d: 0.14, gain: 0.35 + 0.25 * i, air: 0.5, lp: 800 });
        marimba(V, t + 0.01, N.C5, { gain: 0.2, d: 0.2 });
      },
    },

    "player-open": {
      group: G_PLAY, for: "Music player: the spinning disc FAB expands into the bar/panel",
      desc: "Cloth whoosh up with two rising notes (G4 -> D5).",
      gain: 0.49, gap: 250, dur: 0.9, variation: 0.1, noDuck: true,
      fn(V, t) {
        noise(V, t, { kind: "pink", filters: [{ type: "bandpass", f: 400, f2: 1400, glide: 0.3, q: 1 }], a: 0.1, d: 0.22, gain: 0.4 });
        marimba(V, t + 0.04, N.G4, { gain: 0.26, d: 0.3 });
        marimba(V, t + 0.12, N.D5, { gain: 0.26, d: 0.4 });
      },
    },
    "player-close": {
      group: G_PLAY, for: "Music player collapses back into the disc button",
      desc: "Whoosh down, notes falling (D5 -> G4), and a tiny click as the disc docks.",
      gain: 0.64, gap: 250, dur: 0.9, variation: 0.1, noDuck: true,
      fn(V, t) {
        noise(V, t, { kind: "pink", filters: [{ type: "bandpass", f: 1400, f2: 400, glide: 0.28, q: 1 }], a: 0.04, d: 0.24, gain: 0.38 });
        marimba(V, t + 0.03, N.D5, { gain: 0.22, d: 0.2 });
        marimba(V, t + 0.11, N.G4, { gain: 0.22, d: 0.3 });
        thump(V, t + 0.3, { f: 300, f2: 160, d: 0.04, gain: 0.2, air: 0 });
      },
    },
    play: {
      group: G_PLAY, for: "Play pressed (the music itself is the main feedback, so this is tiny)",
      desc: "Felt press with a little upward blip.",
      gain: 1.11, gap: 150, dur: 0.2, variation: 0.15, noDuck: true,
      fn(V, t) { tapP(V, t, 0.35); tone(V, t, { f: 440, f2: 660, glide: 0.06, a: 0.005, d: 0.1, gain: 0.12 }); },
    },
    pause: {
      group: G_PLAY, for: "Pause pressed",
      desc: "Felt press with a little downward blip.",
      gain: 1.11, gap: 150, dur: 0.2, variation: 0.15, noDuck: true,
      fn(V, t) { tapP(V, t, 0.35); tone(V, t, { f: 520, f2: 350, glide: 0.06, a: 0.005, d: 0.1, gain: 0.12 }); },
    },

    post: {
      group: G_SYS, for: "Studio: Publish / Post succeeded",
      desc: "A pinned-note thud and a happy C-E-G-C arpeggio. The biggest sound on the site; it's earned.",
      gain: 0.31, gap: 800, dur: 1.9, variation: 0.05,
      fn(V, t) {
        thump(V, t, { f: 180, f2: 90, d: 0.1, gain: 0.35, air: 0.4 });
        [[N.C5, 0.3], [N.E5, 0.3], [N.G5, 0.32], [N.C6, 0.38]].forEach(([f, g], j) =>
          marimba(V, t + 0.03 + j * 0.07, f, { gain: g, d: j === 3 ? 0.9 : 0.3 }));
      },
    },
    nope: {
      group: G_SYS, for: "Can't do that (failed save, invalid drop, empty search)",
      desc: "Two muted low bumps, a gentle 'uh-uh'. Never a buzzer.",
      gain: 0.43, gap: 400, dur: 0.35, variation: 0.1,
      fn(V, t) {
        thump(V, t, { f: 170, f2: 120, d: 0.07, gain: 0.4, air: 0.3 });
        thump(V, t + 0.11, { f: 150, f2: 100, d: 0.09, gain: 0.35, air: 0.3 });
      },
    },
    "sound-on": {
      group: G_SYS, for: "The sound toggle is switched on (confirmation; switching off is silent)",
      desc: "Two friendly notes, G5 -> C6.",
      gain: 0.36, gap: 300, dur: 0.95, variation: 0,
      fn(V, t) { marimba(V, t, N.G5, { gain: 0.32, d: 0.25 }); marimba(V, t + 0.08, N.C6, { gain: 0.38, d: 0.45 }); },
    },
  };

  /* reference timeline for the home "drop" intro (ms from intro start, typical desktop
     values from home/intro.js: tFall≈700, tB=tFall+270, tRoll=tB+640, tRel=tRoll+380 …).
     The home agent should schedule from its own plan() numbers; this mirrors them. */
  const INTRO = [
    { name: "ball-bounce", at: 700, opts: { intensity: 1 }, label: "lands (tFall)" },
    { name: "ball-bounce", at: 970, opts: { intensity: 0.4 }, label: "bounce + roll (tB)" },
    { name: "ball-roll", at: 975, opts: { duration: 0.64, intensity: 0.8 } },
    { name: "unspool", at: 1350, opts: { duration: 0.6 }, label: "letters (tLet)" },
    { name: "pawstep", at: 1900, opts: { pan: -0.5 }, label: "" },
    { name: "pawstep", at: 2080, opts: { pan: -0.45, volume: 0.9 } },
    { name: "strand-land", at: 2300, label: "strand lands" },
    { name: "pawstep", at: 2260, opts: { pan: -0.4, volume: 0.8 } },
    { name: "pawstep", at: 2440, opts: { pan: -0.35, volume: 0.7 }, label: "" },
    { name: "swat", at: 3190, opts: { pan: -0.3 }, label: "swat 1 (tC1)" },
    { name: "swat", at: 3490, opts: { pan: -0.3, intensity: 0.55 }, label: "swat 2 (tC2)" },
    { name: "pawstep", at: 3640, opts: { pan: -0.3, volume: 0.7 } },
    { name: "cat-sit", at: 3800, opts: { pan: -0.3 }, label: "sits (tSit)" },
  ];

  /* ---------------- state ---------------- */
  const st = { enabled: false, source: "default", volume: 0.8, ctx: null, bus: null, master: null, resumeAt: -1e9, last: {}, voices: [], subs: new Set() };
  // i6 · mobile (round-up: "Always start muted"): no saved choice is read; every page starts muted. An i5 "1" is cleared.
  try { localStorage.removeItem(KEY); } catch (_) {}
  const UISND = params.get("uisnd") === "always" ? "always" : "quiet"; // i5 (G8): see play()
  const qp = params.get("sound");
  if (qp === "on" || qp === "off" || qp === "1" || qp === "0") { st.enabled = qp === "on" || qp === "1"; st.source = "url"; }

  const finePointer = () => { try { return matchMedia("(hover: hover) and (pointer: fine)").matches; } catch (_) { return true; } };

  function buildBus(ctx) {
    const master = ctx.createGain();
    master.gain.value = st.volume;
    const comp = ctx.createDynamicsCompressor(); // soft safety limiter, never "pumps" at these levels
    comp.threshold.value = -10; comp.knee.value = 8; comp.ratio.value = 6; comp.attack.value = 0.002; comp.release.value = 0.12;
    // DC / sub-rumble blocker: short low-noise bursts otherwise leave one-sided lumps that eat headroom
    const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 55; hp.Q.value = 0.6;
    master.connect(hp); hp.connect(comp); comp.connect(ctx.destination);
    return master;
  }
  function getCtx(create) {
    if (st.ctx || !create || !AC) return st.ctx;
    try {
      st.ctx = new AC({ latencyHint: "interactive" });
      st.master = buildBus(st.ctx);
    } catch (_) { st.ctx = null; }
    return st.ctx;
  }
  // i5 · chrome (H1, owner: "Sound needs to start off if its really not on"): what the toggle shows is whether sound can
  // actually be heard: switched on (now or on an earlier visit) AND the browser has let audio run (a gesture on this
  // page). (i6: nothing is saved any more; only ?sound=on starts "on", and it shows muted until the first tap/key.)
  const live = () => st.enabled && !!st.ctx && st.ctx.state === "running";
  // first gesture (and every later one, for iOS "interrupted"): create/resume inside the gesture
  function unlock(e) {
    if (!st.enabled) return;
    // a press on the toggle itself is handled by its click (toggle() reads live() there; resuming here first would
    // flip a muted-looking "on" to on and the click straight back off)
    if (e && e.target && e.target.closest && e.target.closest("[data-sound-toggle]")) return;
    const fresh = !st.ctx;
    const ctx = getCtx(true);
    if (ctx && fresh) ctx.addEventListener?.("statechange", emit); // running / suspended / interrupted → the toggle follows
    if (!ctx || ctx.state === "running") return;
    st.resumeAt = performance.now();
    try {
      const p = ctx.resume(); if (p && p.catch) p.catch(() => {});
      // old iOS: a silent 1-sample buffer started inside the gesture unlocks output
      const s = ctx.createBufferSource(); s.buffer = ctx.createBuffer(1, 1, ctx.sampleRate); s.connect(ctx.destination); s.start(0);
    } catch (_) {}
  }
  for (const ev of ["pointerdown", "touchend", "keydown", "click"]) addEventListener(ev, unlock, { capture: true, passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { st.voices.forEach((v) => kill(v, 0.01)); st.voices = []; }
  });

  function kill(v, tc = 0.015) {
    try {
      const now = v.ctx.currentTime;
      v.g.gain.cancelScheduledValues(now);
      v.g.gain.setTargetAtTime(0, now, tc);
      setTimeout(() => { try { v.g.disconnect(); } catch (_) {} }, 200);
    } catch (_) {}
  }

  /* build one sound into ctx -> dest at time t; returns end time */
  function build(ctx, dest, name, opts, t) {
    const def = SOUNDS[name];
    const vary = clamp(opts.variation ?? def.variation ?? 0.2, 0, 1);
    const rate = clamp(opts.rate ?? 1, 0.25, 4);
    const k = rate * Math.pow(2, (rr(-1, 1) * vary * 60) / 1200);
    const lvl = (def.gain ?? 1) * clamp(opts.volume ?? 1, 0, 2) * Math.pow(10, (rr(-1, 1) * vary * 1.5) / 20);
    const g = ctx.createGain();
    g.gain.value = lvl;
    let pan = opts.pan;
    if (pan == null && opts.el && opts.el.getBoundingClientRect) {
      const r = opts.el.getBoundingClientRect();
      pan = ((r.left + r.width / 2) / (innerWidth || 1)) * 2 - 1;
      pan *= 0.35;
    }
    if (pan && ctx.createStereoPanner) {
      const p = ctx.createStereoPanner();
      p.pan.value = clamp(pan, -1, 1);
      g.connect(p); p.connect(dest);
    } else g.connect(dest);
    const V = { ctx, out: g, k, T: 1 / rate, end: t };
    def.fn(V, t, opts);
    return { g, end: V.end };
  }

  function play(name, opts = {}) {
    try {
      const def = SOUNDS[name];
      if (!def) { if (!play.warned?.[name]) { (play.warned ||= {})[name] = 1; console.warn(`[YarnSound] unknown sound "${name}"`); } return null; }
      if (!st.enabled || document.hidden) return null;
      if (def.hover && !finePointer()) return null;
      const ctx = st.ctx;
      if (!ctx) return null; // nothing before the first gesture
      const now = performance.now();
      if (ctx.state !== "running" && now - st.resumeAt > 500) return null; // never queue a burst
      const delay = Math.max(0, opts.delay || 0);
      const when = now + delay, gap = opts.gap ?? def.gap ?? 60;
      if (Math.abs(when - (st.last[name] ?? -1e9)) < gap) return null;
      st.last[name] = when;

      const t = ctx.currentTime + 0.004 + delay / 1000;
      // voice cap: steal the oldest overlapping voice
      st.voices = st.voices.filter((v) => v.end > ctx.currentTime);
      const overlapping = st.voices.filter((v) => v.start <= t && v.end > t);
      if (overlapping.length >= MAX_VOICES) { const old = overlapping[0]; kill(old); st.voices.splice(st.voices.indexOf(old), 1); }

      let o = opts;
      // i5 · chrome (G8, owner: "app sounds should mute when music is playing"): ?uisnd=quiet (default) = UI sounds are
      // silent while the player plays; the player's own control sounds (noDuck) stay. ?uisnd=always = i4 (ducked 40%).
      if (!def.noDuck && UISND === "quiet" && window.YarnPlayer?.state?.playing) return null;
      const duck = !def.noDuck && window.YarnPlayer?.state?.playing;
      if (duck) o = { ...opts, volume: (opts.volume ?? 1) * 0.6 };
      const v = build(ctx, st.master, name, o, t);
      const voice = { ctx, g: v.g, start: t, end: v.end, name };
      st.voices.push(voice);
      setTimeout(() => { try { v.g.disconnect(); } catch (_) {} }, (v.end - ctx.currentTime) * 1000 + 300);
      return { stop: () => kill(voice) };
    } catch (_) {
      return null;
    }
  }

  function schedule(events = []) {
    const hs = events.map((e) => play(e.name, { ...(e.opts || {}), delay: e.at || 0 })).filter(Boolean);
    return { stop: () => hs.forEach((h) => h.stop()) };
  }

  /* ---------------- offline rendering (test page / visual checks) ---------------- */
  function renderSequence(events, seconds, { sampleRate = 44100, seed = 1, limiter = true } = {}) {
    if (!OAC) return Promise.reject(new Error("OfflineAudioContext unavailable"));
    const len = Math.ceil(sampleRate * seconds);
    const ctx = new OAC(2, len, sampleRate);
    const master = limiter ? buildBus(ctx) : ctx.createGain();
    if (!limiter) { master.gain.value = st.volume; master.connect(ctx.destination); }
    const prev = rand;
    rand = seeded(seed);
    try {
      for (const e of events) if (SOUNDS[e.name]) build(ctx, master, e.name, { variation: 0, ...(e.opts || {}) }, 0.002 + (e.at || 0) / 1000);
    } finally { rand = prev; }
    return ctx.startRendering ? new Promise((res, rej) => {
      const p = ctx.startRendering();
      if (p && p.then) p.then(res, rej); else ctx.oncomplete = (ev) => res(ev.renderedBuffer);
    }) : Promise.reject(new Error("no startRendering"));
  }
  const render = (name, opts = {}, o = {}) =>
    renderSequence([{ name, at: 0, opts }], o.seconds ?? Math.max(0.15, (SOUNDS[name]?.dur ?? 1) / clamp(opts.rate ?? 1, 0.25, 4) + 0.05 + Math.max(0, (opts.duration ?? 0) - 0.5)), o);

  /* ---------------- enable / toggle / buttons ---------------- */
  function emit() {
    syncButtons();
    st.subs.forEach((fn) => { try { fn(st.enabled); } catch (_) {} });
    try { dispatchEvent(new CustomEvent("yarnsound", { detail: { enabled: st.enabled, live: live() } })); } catch (_) {}
  }
  function setEnabled(on) {
    on = !!on;
    st.enabled = on; st.source = "user"; // (i6: not remembered: the next page starts muted)
    if (on) { unlock(); play("sound-on"); }
    else { st.voices.forEach((v) => kill(v)); st.voices = []; }
    emit();
    return on;
  }
  // i5 (H1): the toggle flips what it shows. A saved "on" that can't be heard yet shows muted, so a press turns it on.
  const toggle = () => setEnabled(!live());

  function syncButtons() {
    document.querySelectorAll("[data-sound-toggle]").forEach((b) => {
      if (!AC) { b.hidden = true; b.dataset.soundWired = "1"; return; } // no WebAudio: a dead switch would mislead
      if (b.hidden) b.hidden = false;
      const on = live(); // i5 (H1): never "on" while nothing can be heard
      b.setAttribute("aria-pressed", String(on));
      if (!b.hasAttribute("aria-label")) b.setAttribute("aria-label", "Sound effects");
      // i6 · mobile (X3): the kit hint (Yarn's .ytip) reads data-hint; a native title would pop up late, on top of it
      b.removeAttribute("title");
      b.dataset.hint = on ? "Turn sound off" : "Turn sound on"; // i6 review P2-6: the hint names the action, like the hover icon
      // i7 · site (K1): a press that flips the state gets one short tug (the flip itself can land a beat later: "on"
      // waits for the audio to really run). Only for a press in the last second, never on load or an iOS interruption.
      const next = on ? "on" : "off";
      if (b.dataset.soundState && b.dataset.soundState !== next && b._ysndPress && performance.now() - b._ysndPress < 1000) tug(b);
      b.dataset.soundState = next;
      if (!b.firstElementChild && !b.textContent.trim()) b.innerHTML = '<i class="ph ph-speaker-simple-slash" aria-hidden="true"></i>';
      b.querySelectorAll('i[class*="ph-speaker"]:not([data-ysnd])').forEach((i) => {
        i.classList.remove("ph-speaker-simple-slash", "ph-speaker-simple-high", "ph-speaker-slash", "ph-speaker-high");
        i.classList.add(on ? "ph-speaker-simple-high" : "ph-speaker-simple-slash");
      });
      b.querySelectorAll("[data-sound-label]").forEach((s) => { s.textContent = on ? "Sound on" : "Sound off"; });
      b.dataset.soundWired = "1";
    });
  }
  // i7 · site (K1): the tag's tug: down a few px from the sheet's edge and back. A second press restarts it from where
  // it is (the old one is cancelled). Transform only; none with reduced motion.
  function tug(b) {
    if (!b.animate || matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("y-reduced")) return;
    const from = b._ysndTug && b._ysndTug.playState === "running" ? getComputedStyle(b).transform : "none";
    b._ysndTug?.cancel();
    b._ysndTug = b.animate([{ transform: from === "none" ? "translateY(0)" : from }, { transform: "translateY(3px)", offset: 0.35 }, { transform: "translateY(0)" }],
      { duration: 300, easing: "cubic-bezier(.2, .7, .3, 1)" });
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest && e.target.closest("[data-sound-toggle]");
    if (!b) return;
    e.preventDefault();
    b._ysndPress = performance.now();
    toggle();
    // i6 · mobile (X2) → i7 (K1): hovering previews the other icon; right after a press the pointer is still on the tag,
    // so the preview waits until it has left once and the icon shows what just happened (kit/yarn.css [data-sound-fresh])
    if (b.matches(":hover") && !("soundFresh" in b.dataset)) {
      b.dataset.soundFresh = "";
      b.addEventListener("pointerleave", () => { delete b.dataset.soundFresh; }, { once: true });
    }
  });
  let pending = false;
  const mo = new MutationObserver(() => {
    if (pending) return;
    pending = true;
    queueMicrotask(() => { pending = false; if (document.querySelector("[data-sound-toggle]:not([data-sound-wired])")) syncButtons(); });
  });
  const start = () => { syncButtons(); mo.observe(document.documentElement, { childList: true, subtree: true }); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();

  window.YarnSound = {
    play, schedule, setEnabled, toggle, render, renderSequence, INTRO,
    get enabled() { return st.enabled; },
    get source() { return st.source; },
    get ready() { return !!st.ctx && st.ctx.state === "running"; },
    get live() { return live(); }, // i5: on AND audible (what the toggle shows); `enabled` stays the visitor's choice
    get state() { return st.ctx ? st.ctx.state : "none"; },
    get volume() { return st.volume; },
    set volume(v) { st.volume = clamp(+v || 0, 0, 1); if (st.master) st.master.gain.setTargetAtTime(st.volume, st.ctx.currentTime, 0.02); },
    get names() { return Object.keys(SOUNDS); },
    info: (name) => { const d = SOUNDS[name]; return d && { name, group: d.group, for: d.for, desc: d.desc, gap: d.gap, hover: !!d.hover, intensity: !!d.intensity, dur: d.dur }; },
    on(fn) { st.subs.add(fn); return () => st.subs.delete(fn); },
    supported: !!AC,
  };
})();
