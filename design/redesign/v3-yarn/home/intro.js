/* ============================================================
   home/intro.js · the blaqat.net lockup and its intro timelines
   Everything is a pure function of time t (ms) so any moment can be
   frozen with ?t=<ms>. Geometry lives in one SVG user space
   ("units": x-height = 100, baseline y = 0, y down); the ball, strand
   and cat may draw outside the viewBox (overflow visible) and the
   sheet clips them.
   ============================================================ */
(() => {
  const NS = "http://www.w3.org/2000/svg";
  const mk = (tag, attrs = {}, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const sat = (t) => clamp(t, 0, 1);
  const smooth = (t) => { t = sat(t); return t * t * (3 - 2 * t); };
  const outQuad = (t) => { t = sat(t); return 1 - (1 - t) * (1 - t); };
  const outCubic = (t) => { t = sat(t); return 1 - Math.pow(1 - t, 3); };
  const outBack = (t, s = 1.4) => { t = sat(t) - 1; return 1 + t * t * ((s + 1) * t + s); };
  const f1 = (n) => Math.round(n * 10) / 10;

  // ------------------------------------------------------------
  // Wordmark: geometric monoline yarn letters (centre-line strokes)
  // ------------------------------------------------------------
  const SW = 20;        // letter stroke (yarn) weight
  const DOT_R = 18;     // the ball, at rest, is the "."
  const LETTERS = [
    { ch: "b", cx: 50, s: ["M10,-160V-10", "M10,-50A40,40 0 1 1 90,-50A40,40 0 1 1 10,-50"] },
    { ch: "l", cx: 124, s: ["M124,-160V-10"] },
    { ch: "a", cx: 200, s: ["M240,-50A40,40 0 1 0 160,-50A40,40 0 1 0 240,-50", "M240,-90V-10"] },
    { ch: "q", cx: 312, s: ["M352,-50A40,40 0 1 0 272,-50A40,40 0 1 0 352,-50", "M352,-90V62"] },
    { ch: "a", cx: 424, s: ["M464,-50A40,40 0 1 0 384,-50A40,40 0 1 0 464,-50", "M464,-90V-10"] },
    { ch: "t", cx: 518, s: ["M512,-142V-40A30,30 0 0 0 542,-10", "M494,-90H542"] },
    { ch: "n", cx: 660, s: ["M622,-90V-10", "M622,-50A39,39 0 0 1 700,-50V-10"] },
    { ch: "e", cx: 772, s: ["M733,-50H811A39,39 0 1 0 797,-20.5"] },
    { ch: "t", cx: 866, s: ["M860,-142V-40A30,30 0 0 0 890,-10", "M842,-90H890"] },
  ];
  const DOT_X = 578;

  // strand rest shapes (control points, from the ball outward)
  // F_POST: final lockup: runs under "blaqat", in front of the cat, under its tail
  const F_POST = [[566, -5], [548, 8], [512, 12], [452, 9], [392, 13], [328, 10], [262, 13], [196, 10], [130, 13], [66, 10], [6, 12], [-44, 10], [-94, 12], [-142, 10], [-190, 11], [-228, 8], [-250, 1], [-260, -8]];
  // F_PRE: where it slumps after the drop: a loose curl on the floor just left of the "b"
  // (so the stalking cat can reach it without its head ever crossing the wordmark)
  const F_PRE = [[566, -5], [548, 8], [512, 12], [452, 9], [392, 13], [328, 10], [262, 13], [200, 11], [140, 14], [84, 15], [34, 18], [-12, 22], [-50, 28], [-80, 37], [-90, 49], [-72, 57], [-46, 52], [-40, 40], [-56, 33]];

  // cat placement in lockup units (k = logo-units -> lockup-units)
  const CAT_K = 0.62;
  const CAT_FLOOR = 24;
  const CAT_SIT_X = -46 - (341 - 240) * CAT_K; // logo body centre (logo's right edge 46 units left of the "b")
  // measured rig extents (cat-local units): head+whiskers reach while stalking / striking, compact stalk tail
  const CAT_HEAD_REACH = 304, CAT_TAIL_REACH = 236, WORD_LEFT = 0;
  const TAIL_CLIP = "M30,282 L138,282 L146,334 L214,334 L216,382 L30,382 Z";

  // ------------------------------------------------------------
  // splines
  // ------------------------------------------------------------
  function dense(ctrl, per = 14) {
    const out = [];
    const P = (i) => ctrl[clamp(i, 0, ctrl.length - 1)];
    for (let i = 0; i < ctrl.length - 1; i++) {
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      for (let j = 0; j < per; j++) {
        const t = j / per, t2 = t * t, t3 = t2 * t;
        const c = (a, b, c2, d) => 0.5 * (2 * b + (-a + c2) * t + (2 * a - 5 * b + 4 * c2 - d) * t2 + (-a + 3 * b - 3 * c2 + d) * t3);
        out.push([c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])]);
      }
    }
    out.push(ctrl[ctrl.length - 1]);
    return out;
  }
  function resample(pts, N) {
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const L = cum[cum.length - 1], out = [];
    let j = 0;
    for (let i = 0; i < N; i++) {
      const s = (i / (N - 1)) * L;
      while (j < cum.length - 2 && cum[j + 1] < s) j++;
      const u = (s - cum[j]) / (cum[j + 1] - cum[j] || 1);
      out.push([lerp(pts[j][0], pts[j + 1][0], u), lerp(pts[j][1], pts[j + 1][1], u)]);
    }
    out.L = L;
    return out;
  }
  function pathD(p) {
    const n = p.length;
    let d = `M${f1(p[0][0])},${f1(p[0][1])}`;
    for (let i = 0; i < n - 1; i++) {
      const p0 = p[Math.max(0, i - 1)], p1 = p[i], p2 = p[i + 1], p3 = p[Math.min(n - 1, i + 2)];
      d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)},${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)},${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])},${f1(p2[1])}`;
    }
    return d;
  }

  const N = 72;
  const SHAPES = { post: resample(dense(F_POST), N), pre: resample(dense(F_PRE), N) };

  // ------------------------------------------------------------
  // yarn ball (unit radius; scaled by R)
  // ------------------------------------------------------------
  let ballSeq = 0;
  function buildBall(parent, defs) {
    const id = `yb${++ballSeq}`;
    const cp = mk("clipPath", { id: `${id}-c` }, defs);
    mk("circle", { r: 0.985 }, cp);
    const rg = mk("radialGradient", { id: `${id}-s`, cx: 0.34, cy: 0.3, r: 0.85 }, defs);
    [[0, "#fff", 0.42], [0.32, "#fff", 0], [0.7, "#3a0006", 0], [1, "#3a0006", 0.36]].forEach(([o, c, a]) =>
      mk("stop", { offset: o, "stop-color": c, "stop-opacity": a }, rg));
    const g = mk("g", { class: "yball" }, parent);
    const body = mk("g", {}, g);
    mk("circle", { r: 1, fill: "#d62f38" }, body);
    const spin = mk("g", { "clip-path": `url(#${id}-c)` }, body);
    const wrapA = mk("g", { transform: "rotate(-28)", fill: "none", stroke: "#a81b26", "stroke-width": 0.085, "stroke-linecap": "round" }, spin);
    [-0.66, -0.33, 0, 0.33, 0.66].forEach((c) => mk("path", { d: `M-1.1,${c + 0.16} Q0,${c - 0.26} 1.1,${c + 0.16}` }, wrapA));
    const hiA = mk("g", { transform: "rotate(-28)", fill: "none", stroke: "#ff8a90", "stroke-width": 0.05, "stroke-linecap": "round", opacity: 0.8 }, spin);
    [-0.56, -0.23, 0.1, 0.43].forEach((c) => mk("path", { d: `M-1.1,${c + 0.16} Q0,${c - 0.26} 1.1,${c + 0.16}` }, hiA));
    const wrapB = mk("g", { transform: "rotate(66)", fill: "none", stroke: "#a81b26", "stroke-width": 0.08, "stroke-linecap": "round" }, spin);
    [-0.2, 0.12, 0.44].forEach((c) => mk("path", { d: `M-0.2,${c - 0.1} Q0.45,${c + 0.2} 1.1,${c + 0.02}` }, wrapB));
    const hiB = mk("g", { transform: "rotate(66)", fill: "none", stroke: "#ff8a90", "stroke-width": 0.045, opacity: 0.75 }, spin);
    [-0.06, 0.27].forEach((c) => mk("path", { d: `M-0.2,${c - 0.1} Q0.45,${c + 0.2} 1.1,${c + 0.02}` }, hiB));
    mk("circle", { r: 1, fill: `url(#${id}-s)` }, body);
    mk("circle", { r: 0.965, fill: "none", stroke: "#7d0f18", "stroke-opacity": 0.35, "stroke-width": 0.06 }, body);
    return {
      g,
      set(x, y, R, rot, sx = 1, sy = 1) {
        // squash pivots on the contact point (bottom of the ball)
        g.setAttribute("transform", `translate(${f1(x)} ${f1(y + R)}) scale(${sx.toFixed(3)} ${sy.toFixed(3)}) translate(0 ${f1(-R)})`);
        body.setAttribute("transform", `scale(${R.toFixed(2)})`);
        spin.setAttribute("transform", `rotate(${((rot * 180) / Math.PI).toFixed(1)})`);
      },
    };
  }

  // ------------------------------------------------------------
  // Lockup
  // ------------------------------------------------------------
  class Lockup {
    constructor(svg, { withCat = true } = {}) {
      this.svg = svg;
      this.withCat = withCat;
      svg.setAttribute("viewBox", withCat ? "-266 -226 1180 310" : "-104 -184 1018 268");
      svg.innerHTML = "";
      const defs = (this.defs = mk("defs", {}, svg));

      // layers (back to front): letters, ball, cat, strand, tail-over
      this.gLetters = mk("g", { class: "lk-letters" }, svg);
      this.gShadow = mk("g", { class: "lk-shadow" }, svg);
      this.shadow = mk("ellipse", { cx: DOT_X, cy: 3, rx: 16, ry: 3.2, fill: "#1f1e1e", opacity: 0.16 }, this.gShadow);
      this.gBall = mk("g", { class: "lk-ball" }, svg);
      this.gCat = mk("g", { class: "lk-cat" }, svg);
      this.gStrand = mk("g", { class: "lk-strand" }, svg);
      this.gTail = mk("g", { class: "lk-tail" }, svg);

      // letters: each stroke = mask(draw-on) over ply-base + ply-hi + ply-twist
      this.strokes = [];
      const dist = (cx) => Math.abs(cx - DOT_X);
      LETTERS.forEach((L) => {
        L.s.forEach((d, j) => {
          const id = `lm${this.strokes.length}`;
          const m = mk("mask", { id, maskUnits: "userSpaceOnUse", x: -60, y: -240, width: 1060, height: 340 }, defs);
          const mp = mk("path", { d, fill: "none", stroke: "#fff", "stroke-width": SW + 5, "stroke-linecap": "round", "stroke-linejoin": "round" }, m);
          const g = mk("g", { mask: `url(#${id})` }, this.gLetters);
          mk("path", { d, class: "ply-base", "stroke-width": SW }, g);
          mk("path", { d, class: "ply-hi", "stroke-width": SW * 0.34 }, g);
          mk("path", { d, class: "ply-twist", "stroke-width": SW }, g);
          this.strokes.push({ id, g, mp, d, len: 0, dist: dist(L.cx), j, ch: L.ch });
        });
      });
      // the rendered "." spot (read back with getBBox, never assumed)
      this.dotSpot = mk("circle", { cx: DOT_X, cy: -DOT_R, r: DOT_R, fill: "none", stroke: "none" }, this.gLetters);

      this.ball = buildBall(this.gBall, defs);

      // cat (+ a copy of the logo's tail drawn over the strand)
      if (withCat && window.YarnCat) {
        this.cat = new window.YarnCat(this.gCat);
        const cp = mk("clipPath", { id: "tailclip" }, defs);
        mk("path", { d: TAIL_CLIP }, cp);
        this.tailOuter = mk("g", {}, this.gTail);
        this.tailMid = mk("g", {}, this.tailOuter);
        const inner = mk("g", { transform: "translate(-240 -373)" }, this.tailMid);
        mk("path", { d: window.Yarn.CAT_PATH, fill: "#1f1e1e", "clip-path": "url(#tailclip)" }, inner);
      }

      // strand: soft contact shadow + ply-base + ply-twist
      this.strandShadow = mk("path", { class: "strand-shadow", "stroke-width": 6.5 }, this.gStrand);
      this.strandBase = mk("path", { class: "ply-base", style: "--ply:#d62f38", "stroke-width": 6.5 }, this.gStrand);
      this.strandTwist = mk("path", { class: "ply-twist", "stroke-width": 6.5 }, this.gStrand);

      this.hopT0 = -1e9;
    }

    // ---- measure layout (units) ----
    measure() {
      const ctm = this.svg.getScreenCTM();
      if (!ctm) return false;
      const inv = ctm.inverse();
      const sheet = (this.svg.closest(".sheet") || document.body).getBoundingClientRect();
      const toU = (x, y) => new DOMPoint(x, y).matrixTransform(inv);
      const bb = this.dotSpot.getBBox();
      this.G = {
        px: ctm.a,
        top: toU(0, sheet.top).y,
        left: toU(sheet.left, 0).x,
        right: toU(sheet.right, 0).x,
        cx: toU((sheet.left + sheet.right) / 2, 0).x,
        dot: { x: bb.x + bb.width / 2, y: bb.y + bb.height / 2, r: bb.width / 2 },
      };
      this.strokes.forEach((s) => (s.len = s.len || s.mp.getTotalLength()));
      return true;
    }

    // ---- build a timeline for a mode ----
    plan(mode) {
      const G = this.G;
      const P = (this.P = { mode });
      const dot = G.dot;
      P.R1 = dot.r;
      P.final = this.withCat ? SHAPES.post : SHAPES.pre;
      P.rest = mode === "drop" ? SHAPES.pre : P.final; // where the strand first lands
      const L = P.rest.L;
      const ay = G.top - 46;
      const dy = dot.y - ay;
      const dx = Math.sqrt(Math.max(0, L * L - dy * dy));
      // drop: enter on a real diagonal arc from the upper left (extra length piles into the curl)
      P.A = [dot.x - Math.max(dx, mode === "drop" ? 1.1 * dy : 70), ay];
      const Hpx = (dot.y - G.top) * G.px; // fall height on screen
      P.Hu = dot.y - G.top;

      if (mode === "drop") {
        P.R0 = dot.r * 1.75;
        P.x0 = P.A[0] + 10;
        P.y0 = G.top - P.R0 - 8;
        P.xLand = clamp(G.cx, dot.x - 520, dot.x - 150);
        P.tFall = clamp(800 * Math.sqrt(Hpx / 420), 520, 820);
        P.tB = P.tFall + 270;
        P.tRoll = P.tB + 640;
        P.bounceH = clamp(P.Hu * 0.11, 26, 66);
        P.xB = P.xLand + 0.46 * (dot.x - P.xLand);
        P.tLet = P.tRoll - 260; P.letK = 0.85; P.letDur = 330; P.letGap = 120;
        P.tRel = P.tRoll + 380;
        P.fallDur = 600;
        P.tLand = P.tRel + P.fallDur;
        this.planCat(P);
        P.content = 120;
      } else {
        // simple (and cursor) : straight drop into the dot, quick lay-in
        P.R0 = dot.r * 1.35;
        P.x0 = P.A[0] + 6;
        P.y0 = G.top - P.R0 - 8;
        P.xLand = dot.x;
        P.tFall = clamp(560 * Math.sqrt(Hpx / 420), 380, 580);
        P.tB = P.tFall + 210;
        P.tRoll = P.tB + 60;
        P.bounceH = 18;
        P.xB = dot.x;
        P.tLet = P.tFall - 50; P.letK = 0.5; P.letDur = 250; P.letGap = 80;
        P.tRel = P.tB + 30;
        P.fallDur = 430;
        P.tLand = P.tRel + P.fallDur;
        P.catPop = this.withCat ? P.tLand - 260 : null;
        P.end = Math.max(P.tLand + 120, P.catPop ? P.catPop + 420 : 0, this.lettersEnd(P));
        P.content = 60;
      }
      P.end = Math.max(P.end, this.lettersEnd(P));
      this.precomputeSpin(P);
      return P;
    }

    lettersEnd(P) {
      return P.tLet + Math.max(...this.strokes.map((s) => s.dist * P.letK + s.j * P.letGap)) + P.letDur;
    }

    planCat(P) {
      if (!this.cat) { P.end = P.tLand + 200; return; }
      const G = this.G, k = CAT_K;
      P.cat = {};
      const C = P.cat;
      // stalk spot: the head never crosses the first letter; the whole cat + tail stays inside the sheet
      const headClear = WORD_LEFT - 8 - CAT_HEAD_REACH * k;
      const inSheet = G.left + 6 + CAT_TAIL_REACH * k;
      C.xStop = Math.max(headClear, inSheet);
      C.xStart = G.left - CAT_HEAD_REACH * k - 12; // fully hidden past the sheet edge
      const D = C.xStop - C.xStart;
      const dd = Math.min(D * 0.35, 120);
      let V = 540 / G.px; // ~540 px/s on screen
      C.tArrive = P.tRel + 760;
      let T = ((D - dd) / V + (2 * dd) / V) * 1000;
      C.tEnter = C.tArrive - T;
      const earliest = P.tRoll - 120;
      if (C.tEnter < earliest) { C.tEnter = earliest; T = C.tArrive - C.tEnter; V = (D + dd) / (T / 1000); }
      Object.assign(C, { D, dd, V, T1: ((D - dd) / V) * 1000, T2: ((2 * dd) / V) * 1000 });
      C.tCrouch = C.tArrive; C.tWig = C.tArrive + 120; C.tWind = C.tWig + 220;
      C.tC1 = C.tWind + 170; // contact 1
      C.tWind2 = C.tC1 + 190; C.tC2 = C.tWind2 + 110; // contact 2
      // then a few real steps forward onto the strand, and sit
      C.tStep = C.tC2 + 80; C.stepDur = 300; C.stepD = CAT_SIT_X - C.xStop;
      C.tSit = C.tStep + 110; C.tTurn = C.tStep + C.stepDur + 40; C.tDone = C.tTurn + 190;
      // strand points the paw aims for: the near side of the curl, then the strand under its nose
      const near = (F, x, from) => { let bi = from, bd = 1e9; for (let i = from; i < N; i++) { const d = Math.abs(F[i][0] - x); if (d < bd) { bd = d; bi = i; } } return bi; };
      let li = Math.round(N * 0.6);
      for (let i = li; i < N; i++) if (P.rest[i][0] < P.rest[li][0]) li = i;
      C.hitA = li;
      C.hitB = near(P.final, C.xStop + 200 * k, Math.round(N * 0.4));
      P.end = C.tDone + 40;
    }

    // ---- ball kinematics ----
    ballAt(t) {
      const P = this.P, G = this.G, dot = G.dot;
      const R = lerp(P.R0, P.R1, smooth(t / P.tRoll));
      let x, y, air = false;
      if (t < P.tFall) {
        const u = t / P.tFall;
        x = lerp(P.x0, P.xLand, u);
        const yc = dot.y + dot.r - R; // contact centre
        y = lerp(P.y0, yc, 0.16 * u + 0.84 * u * u);
        air = true;
      } else if (t < P.tB) {
        const u = (t - P.tFall) / (P.tB - P.tFall);
        x = lerp(P.xLand, P.xB, u);
        y = dot.y + dot.r - R - P.bounceH * 4 * u * (1 - u);
        air = true;
      } else {
        const u = (t - P.tB) / (P.tRoll - P.tB);
        x = lerp(P.xB, dot.x, outQuad(u));
        const tr = t - P.tRoll;
        if (tr > 0) x += 1.4 * Math.exp(-tr / 110) * Math.sin((tr / 70) * Math.PI);
        y = dot.y + dot.r - R;
      }
      return { x, y, R, air };
    }
    precomputeSpin(P) {
      // rotation = distance / radius while rolling; a slow spin in the air
      const step = 4, n = Math.ceil(P.end / step) + 2;
      const th = new Float32Array(n);
      let prev = this.ballAt(0), acc = 0;
      for (let i = 1; i < n; i++) {
        const t = i * step, b = this.ballAt(t);
        const dx = b.x - prev.x;
        acc += b.air ? (dx / b.R) * 0.55 + 0.0035 * step : dx / b.R;
        // the dot keeps unwinding while it spins letters out
        if (t > P.tLet) acc += 0.0036 * step * (1 - smooth((t - P.tLet) / 900));
        th[i] = acc; prev = b;
      }
      P.spin = th; P.spinStep = step;
      P.spinOffset = -0.35 - th[n - 1];
    }
    spinAt(t) {
      const P = this.P, i = clamp(Math.floor(t / P.spinStep), 0, P.spin.length - 2);
      const u = (t - i * P.spinStep) / P.spinStep;
      return lerp(P.spin[i], P.spin[i + 1], u) + P.spinOffset;
    }

    // ---- strand ----
    hangAt(t) {
      const P = this.P, b = this.ballAt(t);
      const A = P.A;
      const ex = A[0] - b.x, ey = A[1] - b.y, len = Math.hypot(ex, ey) || 1;
      const nx = ex / len, ny = ey / len;
      const B0 = [b.x + nx * b.R * 0.9, b.y + ny * b.R * 0.9];
      const sag = len * (t < P.tFall ? 0.05 : 0.032);
      const px = -ny, py = nx; // perpendicular
      const pts = [];
      for (let i = 0; i < N; i++) {
        const s = i / (N - 1);
        let x = lerp(B0[0], A[0], s), y = lerp(B0[1], A[1], s) + sag * 4 * s * (1 - s);
        // whip: damped transverse waves launched by each impact
        let w = 0;
        for (const [tk, amp] of [[P.tFall, 0.06], [P.tB, 0.025]]) {
          const tau = t - tk;
          if (tau > 0) w += amp * len * Math.exp(-tau / 200) * Math.sin(2 * Math.PI * (1.4 * s - tau / 240)) * Math.sin(Math.PI * s);
        }
        pts.push([x + px * w, y + py * w]);
      }
      return pts;
    }
    strandAt(t) {
      const P = this.P;
      if (t < P.tRel) return this.hangAt(t);
      const H = (P.hang ||= this.hangAt(P.tRel));
      const F = P.rest;
      let maxDy = 1;
      for (let i = 0; i < N; i++) maxDy = Math.max(maxDy, F[i][1] - H[i][1]);
      const g = (2 * maxDy) / Math.pow(P.fallDur / 1000, 2);
      const tt = (t - P.tRel) / 1000;
      let pts = F.map((f, i) => {
        const h = H[i], dy = Math.max(0, f[1] - h[1]);
        const tau = Math.sqrt((2 * dy) / g) || 0.08;
        if (tt < tau) return [lerp(h[0], f[0], smooth(tt / tau)), h[1] + 0.5 * g * tt * tt];
        const a = tt - tau;
        return [f[0], f[1] - 6 * (dy / maxDy) * Math.exp(-a / 0.05) * Math.abs(Math.sin((a / 0.05) * Math.PI))];
      });
      // the cat's bats: drag the curl out from in front of the "b" to under its tail
      if (P.cat && t > P.cat.tC1 - 40) {
        const C = P.cat, Fp = P.final;
        const e1 = outCubic((t - C.tC1) / 280), e2 = outCubic((t - C.tC2) / 220);
        const e = 0.74 * e1 + 0.26 * e2;
        const lift = 30 * Math.sin(Math.PI * sat((t - C.tC1) / 280)) + 12 * Math.sin(Math.PI * sat((t - C.tC2) / 220));
        // pre-contact: the paw presses the curl
        const press = 4 * Math.sin(Math.PI * sat((t - C.tC1 + 40) / 40));
        pts = pts.map((p, i) => {
          const s = i / (N - 1), w = smooth((s - 0.42) / 0.38);
          const q = Fp[i];
          return [lerp(p[0], q[0], e * w + e * 0.15 * (1 - w)), lerp(p[1], q[1], e * w + e * 0.15 * (1 - w)) - lift * Math.pow(w, 1.3) + press * w];
        });
      }
      return pts;
    }

    // ---- cat ----
    catAt(t) {
      const P = this.P, C = P.cat, k = CAT_K;
      const s = { gait: 0, phase: 0, tailT: t / 1000 };
      let x = C.xStart;
      if (t > C.tEnter) {
        const tau = t - C.tEnter;
        if (tau < C.T1) x = C.xStart + (C.V * tau) / 1000;
        else {
          const t2 = Math.min(tau - C.T1, C.T2) / 1000, T2 = C.T2 / 1000;
          x = C.xStart + (C.D - C.dd) + C.V * t2 - 0.5 * (C.V / T2) * t2 * t2;
        }
      }
      const su = sat((t - C.tStep) / C.stepDur);
      x = Math.min(x, C.xStop) + C.stepD * (su * su * (3 - 2 * su));
      const v = t > C.tEnter && t < C.tArrive ? (t - C.tEnter < C.T1 ? 1 : 1 - (t - C.tEnter - C.T1) / C.T2) : 0;
      s.gait = clamp(v * 1.5, 0, 1) + 0.75 * Math.sin(Math.PI * su);
      s.phase = (x - C.xStart) / k / window.YarnCat.gaitCycle;
      // stalk
      s.crouch = smooth((t - C.tCrouch) / 140) * (1 - smooth((t - C.tStep) / 160));
      const wt = t - C.tWig;
      s.wiggle = wt > 0 && wt < 240 ? 3.4 * Math.sin((wt / 120) * 2 * Math.PI) * Math.sin(Math.PI * (wt / 240)) : 0;
      // swats (paw IK target in cat-local units)
      const loc = (p) => [(p[0] - x) / k, (p[1] - CAT_FLOOR) / k];
      const hitA = loc(P.rest[C.hitA]);
      const hitB = loc(P.final[C.hitB]);
      // raised paw sits in the gap under the chin, in front of the chest, so it reads in silhouette
      const wind1 = [214, -62], wind2 = [206, -46], rec = [170, -30];
      let sw = 0, tgt = wind1;
      if (t > C.tWind && t < C.tStep + 200) {
        if (t < C.tC1 - 70) { sw = smooth((t - C.tWind) / 100); tgt = wind1; }
        else if (t < C.tC1) { sw = 1; const u = outQuad((t - (C.tC1 - 70)) / 70); tgt = [lerp(wind1[0], hitA[0], u), lerp(wind1[1], hitA[1], u)]; }
        else if (t < C.tWind2) { sw = 1; const u = smooth((t - C.tC1) / 150); tgt = [lerp(hitA[0], wind2[0], u), lerp(hitA[1], wind2[1], u)]; }
        else if (t < C.tC2) { sw = 1; const u = outQuad((t - C.tWind2) / (C.tC2 - C.tWind2)); tgt = [lerp(wind2[0], hitB[0], u), lerp(wind2[1], hitB[1], u)]; }
        else { const u = smooth((t - C.tC2) / 200); sw = 1 - u; tgt = [lerp(hitB[0], rec[0], u), lerp(hitB[1], rec[1], u)]; }
      }
      s.swat = sw; s.swatTarget = tgt;
      // anticipation: rock back on the wind-up, lunge into each strike
      const k1 = t - (C.tC1 - 70), k2 = t - (C.tC2 - 60);
      s.lunge = (k1 > 0 && k1 < 260 ? Math.sin(Math.PI * Math.min(1, k1 / 260)) : 0) + 0.5 * (k2 > 0 && k2 < 200 ? Math.sin(Math.PI * Math.min(1, k2 / 200)) : 0);
      // head follows the action
      s.look = t < C.tC1 ? 6 * s.crouch : t < C.tSit ? 10 - 14 * smooth((t - C.tC1) / 200) : -6 * smooth((t - C.tSit) / 160);
      s.sit = smooth((t - C.tSit) / 190);
      s.turn = sat((t - C.tTurn) / 190);
      return { x, s };
    }

    // ---- render a moment ----
    render(t) {
      const P = this.P, G = this.G, dot = G.dot;
      t = clamp(t, 0, P.end);
      this.t = t;

      // ball
      const b = this.ballAt(t);
      let sq = 0;
      for (const [tk, a] of [[P.tFall, P.mode === "drop" ? 0.26 : 0.2], [P.tB, 0.09]]) {
        const tau = t - tk;
        if (tau > 0 && tau < 420) sq += a * (tau < 45 ? Math.sin((tau / 45) * (Math.PI / 2)) : Math.exp(-(tau - 45) / 95) * Math.cos(((tau - 45) / 90) * Math.PI));
      }
      let sx = 1 + sq * 0.85, sy = 1 - sq;
      if (t < P.tFall) { const st = 0.07 * smooth((t / P.tFall - 0.55) / 0.45); sy *= 1 + st; sx *= 1 - st * 0.6; }
      // hop easter egg (after the intro)
      let hopY = 0, hopRot = 0;
      const ht = performance.now() - this.hopT0;
      if (t >= P.end && ht < 560) {
        const u = ht / 520;
        hopY = -4 * 58 * sat(u) * (1 - sat(u));
        hopRot = Math.PI * 2 * outCubic(u);
        const ld = ht - 520;
        if (ht < 70) { sy *= 1 - 0.18 * Math.sin((ht / 70) * Math.PI); sx *= 1 + 0.14 * Math.sin((ht / 70) * Math.PI); }
        if (ld > 0) { sy *= 1 - 0.16 * Math.exp(-ld / 40); sx *= 1 + 0.12 * Math.exp(-ld / 40); }
      }
      this.ball.set(b.x, b.y + hopY, b.R, this.spinAt(t) + hopRot, sx, sy);
      const hN = sat((dot.y + dot.r - (b.y + hopY) - b.R) / 260);
      this.shadow.setAttribute("cx", f1(b.x));
      this.shadow.setAttribute("rx", f1(b.R * (1.05 - 0.45 * hN)));
      this.shadow.setAttribute("opacity", ((1 - hN) * 0.16).toFixed(3));

      // letters
      this.strokes.forEach((s) => {
        const t0 = P.tLet + s.dist * P.letK + s.j * P.letGap;
        const p = outCubic((t - t0) / P.letDur);
        if (p <= 0.001) { s.g.style.display = "none"; return; }
        s.g.style.display = "";
        if (p >= 0.999) { s.g.removeAttribute("mask"); return; }
        s.g.setAttribute("mask", `url(#${s.id})`);
        s.mp.setAttribute("stroke-dasharray", `${(p * s.len).toFixed(1)} ${(s.len * 2).toFixed(0)}`);
      });

      // strand
      const pts = this.strandAt(t);
      this._strandCache = pts;
      const d = pathD(pts);
      this.strandBase.setAttribute("d", d);
      this.strandTwist.setAttribute("d", d);
      this.strandShadow.setAttribute("d", d);
      this.strandShadow.style.opacity = sat((t - P.tRel - P.fallDur * 0.6) / 200) * 1;

      // cat
      if (this.cat) {
        if (P.cat) {
          const { x, s } = this.catAt(t);
          this.cat.place(x, CAT_FLOOR, CAT_K, 1);
          this.cat.pose(s);
          this.syncTail(x, s.turn);
        } else if (P.catPop != null) {
          // simple: the logo cat sits up into place
          const u = (t - P.catPop) / 420;
          this.cat.pose({ sit: 1, turn: 1 });
          const vis = u > 0;
          const syy = vis ? lerp(0.55, 1, outBack(u, 2.2)) : 0.55;
          const sxx = vis ? lerp(0.9, 1, outCubic(u)) : 0.9;
          this.cat.place(CAT_SIT_X, CAT_FLOOR, CAT_K, 1);
          this.cat.root.setAttribute("opacity", vis ? sat(u / 0.18).toFixed(3) : 0);
          this.cat.logo.setAttribute("transform", `scale(${sxx.toFixed(3)} ${syy.toFixed(3)})`);
          this.syncTail(CAT_SIT_X, vis ? 1 : 0);
        }
      }
    }
    syncTail(x, turn) {
      if (!this.tailOuter) return;
      this.tailOuter.setAttribute("transform", `translate(${f1(x)} ${CAT_FLOOR}) scale(${CAT_K})`);
      this.tailMid.setAttribute("transform", this.cat.logo.getAttribute("transform") || "");
      const op = turn >= 0.5 ? (this.cat.root.getAttribute("opacity") ?? 1) : 0;
      this.tailOuter.setAttribute("opacity", op);
    }

    hop() {
      if (!this.P || this.t < this.P.end) return;
      if (performance.now() - this.hopT0 < 500) return;
      this.hopT0 = performance.now();
      const loop = () => {
        this.render(this.P.end);
        if (performance.now() - this.hopT0 < 600) requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }
  }

  window.HomeLockup = Lockup;
  window.HomeLockup.util = { buildBall, smooth, outCubic, clamp, lerp, sat };
})();
