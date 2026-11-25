/* ============================================================
   home/cursor.js · ?intro=cursor (fine pointers only)
   The yarn ball TRAILS the real cursor on a critically damped spring,
   parked just below-right of the hotspot like a cursor badge, with a
   short loose end of yarn. The system cursor is never hidden: it stays
   exact for text, inputs and links, and the ball fades over text.
   The cat lives on the sheet's bottom stitch line, tracks the ball's x
   with a speed-limited spring, sits when the pointer rests, turns into
   the logo (back view) if it rests longer, and on a button press it
   crouches, leaps and swats: the ball pops away and springs back.
   Fixed 120 Hz steps => deterministic for ?t= screenshots (?demo=chase).
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
  const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const f1 = (n) => Math.round(n * 10) / 10;
  const DT = 1 / 120;
  const K = 0.235; // px per cat unit (~78 px tall standing)
  let inst = null;

  function start({ lockup, demo = false, freezeAt = null } = {}) {
    stop();
    const lane = document.createElement("div");
    lane.className = "lane";
    lane.setAttribute("aria-hidden", "true");
    const svg = mk("svg", {}, lane);
    const defs = mk("defs", {}, svg);
    const gCat = mk("g", {}, svg);
    const gThread = mk("g", {}, svg);
    const gBall = mk("g", { class: "lane-ball" }, svg);
    document.body.appendChild(lane);
    const cat = new window.YarnCat(gCat);
    const ball = window.HomeLockup.util.buildBall(gBall, defs);
    gBall.style.filter = "drop-shadow(0 2px 2px rgba(31,30,30,.22))";
    const thB = mk("path", { class: "ply-base", style: "--ply:#d62f38", "stroke-width": 2.6 }, gThread);
    const thT = mk("path", { class: "ply-twist", "stroke-width": 2.6, style: "stroke:rgba(255,255,255,.4);stroke-dasharray:1.2 1.6" }, gThread);

    const sheet = document.querySelector(".sheet");
    const W = () => innerWidth;
    let bounds;
    const measure = () => {
      const r = sheet.getBoundingClientRect();
      bounds = { left: r.left + 34, right: r.right - 34, floor: Math.min(innerHeight, r.bottom) - 12 };
    };
    measure();

    // ---- state ----
    const S = {
      time: 0,
      ptr: { x: W() * 0.5, y: innerHeight * 0.4, present: false, last: -9, overText: false },
      ball: { x: -40, y: -40, vx: 0, vy: 0, rot: 0, R: 9, a: 0, popUntil: -1 },
      thread: Array.from({ length: 10 }, () => ({ x: -40, y: -40, px: -40, py: -40 })),
      cat: { x: bounds.left - 70, v: 0, facing: 1, flip: 1, phase: 0, sit: 0, turn: 0, swatT: -1, swatDir: 1, idleSince: 0, enterTo: lerp(bounds.left, bounds.right, 0.18) },
    };

    // ---- demo pointer script (deterministic) ----
    const btn = document.querySelector('.hbtn[data-burst="music"]');
    const script = (t) => {
      const b = btn.getBoundingClientRect();
      const p0 = { x: W() * 0.78, y: innerHeight * 0.3 }, p1 = { x: b.left + b.width * 0.55, y: b.top + b.height * 0.5 };
      if (t < 0.9) return { present: false };
      if (t < 2.4) {
        const u = smooth((t - 0.9) / 1.5);
        return { present: true, moving: true, x: lerp(p0.x, p1.x, u) + Math.sin(u * Math.PI) * 120, y: lerp(p0.y, p1.y, u) - Math.sin(u * Math.PI) * 60 };
      }
      return { present: true, moving: false, x: p1.x, y: p1.y, down: t >= 3.0 && t < 3.0 + DT * 1.5 };
    };

    function swat() {
      const c = S.cat;
      if (c.swatT >= 0 && c.swatT < 0.5) return;
      c.swatT = 0;
      c.swatDir = c.facing;
      S.cat.idleSince = S.time;
    }

    // ---- simulation step ----
    function step() {
      S.time += DT;
      const t = S.time, P = S.ptr, B = S.ball, C = S.cat;
      if (demo) {
        const d = script(t);
        if (d.present) {
          if (d.moving || !P.present) P.last = t;
          P.x = d.x; P.y = d.y; P.present = true;
          if (d.down) swat();
        } else P.present = false;
      }
      // ball: spring to the badge spot under the pointer (looser right after a pop)
      const tx = P.x + 16, ty = P.y + 20;
      const w = t < B.popUntil ? 7 : 24;
      if (P.present || t < B.popUntil) {
        B.vx += (w * w * (tx - B.x) - 2 * w * B.vx) * DT;
        B.vy += (w * w * (ty - B.y) - 2 * w * B.vy) * DT;
      }
      if (B.a === 0 && P.present) { B.x = tx; B.y = ty; } // appear in place
      const ox = B.x;
      B.x += B.vx * DT; B.y += B.vy * DT;
      B.rot += (B.x - ox) / B.R;
      const wantA = P.present && !P.overText ? 1 : 0;
      B.a += clamp(wantA - B.a, -DT * 6, DT * 6);
      // loose end: verlet, pinned to the ball
      const th = S.thread;
      th[0].x = B.x; th[0].y = B.y;
      for (let i = 1; i < th.length; i++) {
        const p = th[i], vx = (p.x - p.px) * 0.96, vy = (p.y - p.py) * 0.96;
        p.px = p.x; p.py = p.y;
        p.x += vx; p.y += vy + 900 * DT * DT;
      }
      for (let it = 0; it < 4; it++) for (let i = 1; i < th.length; i++) {
        const a = th[i - 1], b = th[i], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, k = (d - 5.5) / d;
        if (i === 1) { b.x -= dx * k; b.y -= dy * k; } else { a.x += dx * k * 0.5; a.y += dy * k * 0.5; b.x -= dx * k * 0.5; b.y -= dy * k * 0.5; }
      }

      // cat: track the ball's x (or walk in to its waiting spot)
      let target = C.x;
      if (P.present && B.a > 0.05) target = B.x - C.facing * 30;
      else if (t < 3 && !P.present) target = C.enterTo;
      target = clamp(target, bounds.left, bounds.right);
      const dx = target - C.x;
      const resting = C.swatT < 0 && Math.abs(C.v) < 8 && Math.abs(dx) < 26;
      const wantMove = Math.abs(dx) > 26 && C.swatT < 0;
      // stand up (un-turn, un-sit) before walking
      if (wantMove && C.turn > 0) C.turn = Math.max(0, C.turn - DT / 0.18);
      else if (wantMove && C.sit > 0) C.sit = Math.max(0, C.sit - DT / 0.16);
      let desired = 0;
      if (wantMove && C.turn === 0 && C.sit === 0) {
        const dir = Math.sign(dx);
        if (dir !== C.facing && Math.abs(dx) > 40) C.facing = dir;
        desired = clamp(dx * 5, -430, 430);
      }
      C.v += clamp(desired - C.v, -1900 * DT, 1900 * DT);
      if (Math.abs(desired) < 1 && Math.abs(C.v) < 40) C.v *= 0.8;
      const step = C.v * DT;
      C.x += step;
      C.phase += Math.abs(step) / K / window.YarnCat.gaitCycle;
      // facing flips through edge-on, quickly
      C.flip += clamp(C.facing - C.flip, -DT / 0.07, DT / 0.07);
      // rest: sit after a beat, then turn into the logo (back view)
      if (resting) {
        if (Math.abs(P.present ? t - P.last : 9) > 0.6 || !P.present) C.sit = Math.min(1, C.sit + DT / 0.3);
        if (C.sit >= 1 && (!P.present || t - P.last > 2.0)) C.turn = Math.min(1, C.turn + DT / 0.19);
      }
      // swat: crouch (anticipation) -> leap + swipe -> land
      if (C.swatT >= 0) {
        C.turn = Math.max(0, C.turn - DT / 0.08);
        C.sit = Math.max(0, C.sit - DT / 0.08);
        const before = C.swatT;
        C.swatT += DT;
        if (before < 0.2 && C.swatT >= 0.2) {
          // contact: the ball pops away from the paw, then springs back to the pointer
          B.vx += C.swatDir * 420; B.vy -= 560; B.popUntil = t + 0.38;
        }
        if (C.swatT > 0.62) C.swatT = -1;
      }
    }

    // ---- render ----
    function render() {
      const B = S.ball, C = S.cat, t = S.time;
      ball.set(B.x, B.y, B.R, B.rot);
      gBall.style.opacity = B.a.toFixed(3);
      const pts = S.thread;
      let d = `M${f1(pts[0].x)},${f1(pts[0].y)}`;
      for (let i = 1; i < pts.length - 1; i++) d += `Q${f1(pts[i].x)},${f1(pts[i].y)} ${f1((pts[i].x + pts[i + 1].x) / 2)},${f1((pts[i].y + pts[i + 1].y) / 2)}`;
      thB.setAttribute("d", d); thT.setAttribute("d", d);
      gThread.style.opacity = B.a.toFixed(3);

      const s = { gait: clamp(Math.abs(C.v) / 160, 0, 1), phase: C.phase, tailT: t, sit: smooth(C.sit), turn: C.turn };
      // head tracks the ball
      const hx = C.x + C.facing * 30, hy = bounds.floor - 58;
      const ang = Math.atan2(B.y - hy, Math.abs(B.x - hx) + 1) * (180 / Math.PI);
      s.look = clamp(ang * 0.45, -32, 14) * B.a;
      let lift = 0;
      if (C.swatT >= 0) {
        const u = C.swatT;
        const crouch = u < 0.1 ? smooth(u / 0.1) : 1 - smooth((u - 0.1) / 0.08);
        const airU = clamp((u - 0.12) / 0.4, 0, 1);
        const air = Math.sin(Math.PI * airU);
        const peak = clamp(bounds.floor - B.y - 140, 30, 120);
        lift = peak * 4 * airU * (1 - airU);
        s.crouch = crouch + (u > 0.52 ? Math.sin(Math.PI * clamp((u - 0.52) / 0.1, 0, 1)) * 0.6 : 0);
        s.air = air; s.rear = air * 0.9;
        s.gait = 0;
        // paw: wind up beside the chest, then swipe up and forward through the ball
        const sw = u < 0.12 ? smooth(u / 0.12) : u < 0.42 ? 1 : 1 - smooth((u - 0.42) / 0.14);
        const su = smooth((u - 0.14) / 0.08);
        s.swat = sw;
        s.swatTarget = [lerp(150, 236, su), lerp(-120, -300, su)];
        s.look = -26;
      }
      cat.root.setAttribute("transform", `translate(${f1(C.x)} ${f1(bounds.floor - lift)}) scale(${(K * (Math.abs(C.flip) < 0.05 ? 0.05 * Math.sign(C.flip || 1) : C.flip)).toFixed(4)} ${K})`);
      cat.pose(s);
    }

    // ---- live input ----
    const onMove = (e) => {
      if (demo || e.pointerType === "touch") return;
      const P = S.ptr;
      P.x = e.clientX; P.y = e.clientY; P.present = true; P.last = S.time;
      P.overText = !!e.target.closest?.("p, h1, h2, h3, li, input, textarea, select, [contenteditable], .mockpanel");
    };
    const onLeave = () => { if (!demo) S.ptr.present = false; };
    const onDown = (e) => {
      if (demo || e.pointerType === "touch") return;
      if (e.target.closest?.("a, button, [role=button]") && !e.target.closest(".mockpanel")) swat();
    };
    addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    addEventListener("pointerdown", onDown, true);
    addEventListener("resize", measure);

    let raf = 0, acc = 0, last = performance.now();
    if (freezeAt != null) {
      const n = Math.round(freezeAt / 1000 / DT);
      for (let i = 0; i < n; i++) step();
      render();
    } else {
      const loop = (now) => {
        acc += Math.min(0.1, (now - last) / 1000);
        last = now;
        while (acc >= DT) { step(); acc -= DT; }
        render();
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }
    inst = {
      stop() {
        cancelAnimationFrame(raf);
        removeEventListener("pointermove", onMove);
        document.documentElement.removeEventListener("pointerleave", onLeave);
        removeEventListener("pointerdown", onDown, true);
        removeEventListener("resize", measure);
        lane.remove();
      },
    };
  }
  function stop() { inst?.stop(); inst = null; }
  window.HomeCursor = { start, stop };
})();
