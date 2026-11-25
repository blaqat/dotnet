/* ============================================================
   home/cat.js · the blaqat cat, as a procedural vector rig
   - profile rig: body + head + 4 two-bone IK legs + tail
     (trot cycle driven by distance travelled, so feet never slide)
   - poses: walk/trot, crouch + butt wiggle, swat (paw IK target),
     sit (profile), turn (squash through edge-on), logo (back view)
   - the logo pose is the exact logo path (Yarn.CAT_PATH)
   Units are "logo units" (the sitting logo is ~375 tall).
   Origin = the floor point under the body centre; +x = facing.
   ============================================================ */
(() => {
  const NS = "http://www.w3.org/2000/svg";
  const D2R = Math.PI / 180;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const smooth = (t) => t * t * (3 - 2 * t);
  const mk = (tag, attrs = {}, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };
  const f1 = (n) => Math.round(n * 10) / 10;

  const INK = "#1f1e1e";
  const FAR = "#3d3837"; // far-side legs: a hair lighter so the gait reads

  // ---- proportions (logo units) ----
  const D = {
    bodyY: -160, // body-frame origin height when standing
    hip: [-78, 22],
    shoulder: [76, 18],
    hind: [80, 82],
    fore: [78, 78],
    legW: 31,
    head: [136, -62], // head centre in body frame
    tailBase: [-112, -26],
    stride: 156,
    duty: 0.56,
    footX: { hind: -70, fore: 90 },
  };

  // body silhouette, body frame, facing +x (back, rump, belly, chest)
  const BODY =
    "M101,-46 C70,-66 -31,-68 -86,-54 C-126,-44 -140,18 -110,44 C-81,66 56,60 94,46 C128,32 135,-24 101,-46 Z";
  // head, head frame (skull centre 0,0), facing +x
  const HEAD =
    "M-52,4 C-56,-30 -38,-48 -16,-53 L0,-100 C3,-107 10,-107 14,-101 L42,-40 C56,-28 60,-14 64,-2 C80,4 86,16 80,26 C72,40 50,46 24,48 C-12,52 -50,38 -52,4 Z";
  const FAR_EAR = "M-40,-28 L-44,-90 C-44,-97 -37,-99 -33,-94 L-4,-50 Z";

  // trot: diagonal pairs (near-hind + far-fore, far-hind + near-fore)
  const PHASE = { nh: 0.0, ff: 0.04, fh: 0.5, nf: 0.54 };

  function ik(h, f, a, b, bend) {
    let dx = f[0] - h[0], dy = f[1] - h[1];
    let d = Math.hypot(dx, dy);
    const maxD = a + b - 0.6;
    if (d > maxD) { f = [h[0] + (dx / d) * maxD, h[1] + (dy / d) * maxD]; d = maxD; dx = f[0] - h[0]; dy = f[1] - h[1]; }
    d = Math.max(d, Math.abs(a - b) + 2);
    const base = Math.atan2(dy, dx);
    const A = Math.acos(clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1));
    const ang = base + bend * A;
    return [[h[0] + a * Math.cos(ang), h[1] + a * Math.sin(ang)], f];
  }

  function gaitFoot(nx, p, amt) {
    p -= Math.floor(p);
    const S = D.stride * amt;
    if (p < D.duty) return [nx + S / 2 - S * (p / D.duty), 0];
    const u = (p - D.duty) / (1 - D.duty);
    return [nx - S / 2 + S * smooth(u), -Math.sin(Math.PI * u) * 42 * amt];
  }

  const rot = (p, a) => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)];

  class Cat {
    constructor(parent, { logoPath = window.Yarn?.CAT_PATH, tailClipId = "" } = {}) {
      this.root = mk("g", { class: "cat" }, parent);
      // profile rig
      this.prof = mk("g", { class: "cat-prof" }, this.root);
      this.legFH = mk("path", { fill: "none", stroke: FAR, "stroke-width": D.legW, "stroke-linecap": "round", "stroke-linejoin": "round" }, this.prof);
      this.legFF = mk("path", { fill: "none", stroke: FAR, "stroke-width": D.legW, "stroke-linecap": "round", "stroke-linejoin": "round" }, this.prof);
      this.pawFH = mk("ellipse", { rx: 20, ry: 13, fill: FAR }, this.prof);
      this.pawFF = mk("ellipse", { rx: 19, ry: 13, fill: FAR }, this.prof);
      this.farEar = mk("path", { d: FAR_EAR, fill: INK }, this.prof);
      this.tail = mk("path", { fill: "none", stroke: INK, "stroke-width": 27, "stroke-linecap": "round" }, this.prof);
      this.body = mk("g", {}, this.prof);
      mk("path", { d: BODY, fill: INK }, this.body);
      this.thigh = mk("ellipse", { cx: -76, cy: 6, rx: 56, ry: 58, fill: INK }, this.body);
      mk("ellipse", { cx: 76, cy: 4, rx: 40, ry: 46, fill: INK }, this.body);
      mk("ellipse", { cx: 112, cy: -18, rx: 34, ry: 40, fill: INK }, this.body); // throat
      this.neck = mk("path", { fill: INK }, this.prof);
      this.legNH = mk("path", { fill: "none", stroke: INK, "stroke-width": D.legW, "stroke-linecap": "round", "stroke-linejoin": "round" }, this.prof);
      this.legNF = mk("path", { fill: "none", stroke: INK, "stroke-width": D.legW, "stroke-linecap": "round", "stroke-linejoin": "round" }, this.prof);
      this.pawNH = mk("ellipse", { rx: 21, ry: 13.5, fill: INK }, this.prof);
      this.pawNF = mk("ellipse", { rx: 20, ry: 13.5, fill: INK }, this.prof);
      this.head = mk("g", {}, this.prof);
      this.farEarG = this.farEar; // drawn behind body, positioned with head
      mk("path", { d: HEAD, fill: INK }, this.head);
      const wh = mk("g", { stroke: INK, "stroke-width": 2.4, "stroke-linecap": "round", fill: "none", opacity: 0.85 }, this.head);
      mk("path", { d: "M70,18 C86,12 100,10 112,10" }, wh);
      mk("path", { d: "M70,24 C86,24 100,28 110,33" }, wh);

      // logo (back view), aligned so the body centre-bottom sits at the origin
      this.logo = mk("g", { class: "cat-logo", opacity: 0 }, this.root);
      this.logoInner = mk("g", { transform: "translate(-240 -373)" }, this.logo);
      mk("path", { d: logoPath, fill: INK }, this.logoInner);
      this.tailClipId = tailClipId;
      this.pose({});
    }

    /* s: { phase, gait, crouch, wiggle, swat, swatTarget:[x,y], sit, look, tailT, turn } */
    pose(s) {
      const gait = s.gait ?? 0, phase = s.phase ?? 0;
      const crouch = s.crouch ?? 0, sit = s.sit ?? 0, swat = s.swat ?? 0;
      const tt = s.tailT ?? 0;
      const turn = s.turn ?? 0; // 0 profile .. 1 logo

      // ---- body frame ----
      const bob = gait * 4.5 * Math.cos(4 * Math.PI * phase);
      const sx = 1 - 0.27 * smooth(sit); // spine curls up when sitting
      let pitch = (gait * 1.4 * Math.sin(2 * Math.PI * phase) + crouch * 7 - swat * 9 - sit * 47) * D2R;
      pitch += (s.wiggle || 0) * D2R;
      let oy = D.bodyY - bob + crouch * 30 + swat * -6;
      const hipR = rot([D.hip[0] * sx, D.hip[1]], pitch);
      oy = lerp(oy, -56 - hipR[1], sit); // haunch settles onto the floor
      const lunge = s.lunge || 0, rear = s.rear || 0, air = s.air || 0;
      pitch -= rear * 20 * D2R;
      let ox = sit * 10 - crouch * 4 + lunge * 16 - swat * (1 - lunge) * 6;
      pitch += lunge * 6 * D2R;
      const B = (p) => { const r = rot([p[0] * sx, p[1]], pitch); return [r[0] + ox, r[1] + oy]; };
      const tf = `translate(${f1(ox)} ${f1(oy)}) rotate(${f1(pitch / D2R)}) scale(${sx.toFixed(3)} 1)`;
      this.body.setAttribute("transform", tf);

      // ---- legs ----
      const hip = B(D.hip), sh = B(D.shoulder);
      const nhx = D.footX.hind, nfx = D.footX.fore;
      const sitHind = [hip[0] + 34, 0];
      const sitFore = [lerp(nfx, sh[0] + 6, sit), 0];
      const pick = (key, nx, sitP) => {
        let f = gaitFoot(nx, phase + PHASE[key], gait);
        f = [lerp(f[0], sitP[0], sit), lerp(f[1], 0, sit)];
        return f;
      };
      let fNH = pick("nh", nhx, sitHind), fFH = pick("fh", nhx - 8, [sitHind[0] - 10, 0]);
      let fNF = pick("nf", nfx, sitFore), fFF = pick("ff", nfx - 10, [sitFore[0] - 12, 0]);
      if (air > 0) {
        // mid-leap: hind legs trail back, fore legs reach
        const A = (f, tx, ty) => [lerp(f[0], tx, air), lerp(f[1], ty, air)];
        fNH = A(fNH, hip[0] - 70, hip[1] + 120); fFH = A(fFH, hip[0] - 50, hip[1] + 130);
        fNF = A(fNF, sh[0] + 70, sh[1] + 110); fFF = A(fFF, sh[0] + 40, sh[1] + 125);
      }
      if (swat > 0 && s.swatTarget) fNF = [lerp(fNF[0], s.swatTarget[0], swat), lerp(fNF[1], s.swatTarget[1], swat)];
      // far-side joints sit a touch higher/behind
      const hipF = [hip[0] + 6, hip[1] - 4], shF = [sh[0] - 6, sh[1] - 4];
      const leg = (path, paw, h, f, bones, bend, fwd) => {
        const [k, ft] = ik(h, f, bones[0], bones[1], bend);
        path.setAttribute("d", `M${f1(h[0])},${f1(h[1])}L${f1(k[0])},${f1(k[1])}L${f1(ft[0])},${f1(ft[1])}`);
        paw.setAttribute("cx", f1(ft[0] + fwd));
        paw.setAttribute("cy", f1(ft[1] - 5));
      };
      leg(this.legNH, this.pawNH, hip, fNH, D.hind, 1, 9);
      leg(this.legFH, this.pawFH, hipF, fFH, D.hind, 1, 9);
      leg(this.legNF, this.pawNF, sh, fNF, D.fore, -1, 8);
      leg(this.legFF, this.pawFF, shF, fFF, D.fore, -1, 8);

      // ---- head ----
      const hb = B([D.head[0] + crouch * 16 + sit * 6, D.head[1] + crouch * 26 + sit * 6]);
      const headBob = gait * 2.5 * Math.cos(4 * Math.PI * phase + 0.6);
      const look = (s.look ?? 0) + crouch * 14;
      const hr = (pitch / D2R) * (0.35 - 0.3 * sit) + look;
      const ht = `translate(${f1(hb[0])} ${f1(hb[1] + headBob)}) rotate(${f1(hr)})`;
      this.head.setAttribute("transform", ht);
      this.farEar.setAttribute("transform", ht);
      // neck: a soft quad from the chest top to under the jaw
      const n1 = B([70, -52]), n2 = B([120, 30]);
      const j1 = [hb[0] - 26 * Math.cos(hr * D2R), hb[1] + headBob - 30], j2 = [hb[0] + 20, hb[1] + headBob + 40];
      this.neck.setAttribute("d", `M${f1(n1[0])},${f1(n1[1])}Q${f1((n1[0] + j1[0]) / 2)},${f1(j1[1] - 6)} ${f1(j1[0])},${f1(j1[1])}L${f1(j2[0])},${f1(j2[1])}Q${f1(n2[0] + 10)},${f1(n2[1] - 10)} ${f1(n2[0])},${f1(n2[1])}Z`);

      // ---- tail: blend up (trot) / low (stalk) / wrap (sit) ----
      const tb = B(D.tailBase);
      const sway = Math.sin(tt * 5.2) * 10 * (1 - crouch) * (1 - sit) + Math.sin(2 * Math.PI * phase) * 8 * gait;
      const flick = Math.sin(tt * 17) * 9 * crouch;
      const up = [[-50, -24], [-92, -112 + sway * 0.3], [-46 + sway, -186]];
      // stalk: tail held low and hooked (compact, so a crouched cat fits narrow screens), tip twitching
      const low = [[-50, 12], [-96, 4], [-104, -46 + flick]];
      // sit: tail drops from the rump to the floor and curls forward round the paws (relative to tb)
      const wrapT = [[-44, -tb[1] - 30], [-6, -tb[1] + 2], [150, -tb[1] - 14 + Math.sin(tt * 3) * 3]];
      const wu = (1 - crouch) * (1 - sit), wl = crouch * (1 - sit), ww = sit;
      const C = [0, 1, 2].map((i) => [
        tb[0] + up[i][0] * wu + low[i][0] * wl + wrapT[i][0] * ww,
        tb[1] + up[i][1] * wu + low[i][1] * wl + wrapT[i][1] * ww,
      ]);
      this.tail.setAttribute("d", `M${f1(tb[0])},${f1(tb[1])}C${f1(C[0][0])},${f1(C[0][1])} ${f1(C[1][0])},${f1(C[1][1])} ${f1(C[2][0])},${f1(C[2][1])}`);

      // ---- turn (profile -> back view) ----
      if (turn <= 0) {
        this.prof.setAttribute("transform", "");
        this.prof.setAttribute("opacity", 1);
        this.logo.setAttribute("opacity", 0);
      } else if (turn < 0.5) {
        const u = smooth(turn / 0.5);
        this.prof.setAttribute("transform", `scale(${f1((1 - 0.78 * u) * 100) / 100} ${f1((1 + 0.03 * u) * 100) / 100})`);
        this.prof.setAttribute("opacity", 1);
        this.logo.setAttribute("opacity", 0);
      } else {
        const u = (turn - 0.5) / 0.5;
        // little overshoot as it settles into the back-view sit
        const sx = 0.22 + 0.78 * (1 - Math.pow(1 - u, 3)) + Math.sin(Math.PI * u) * 0.06;
        const sy = 1 + 0.03 * (1 - u) - Math.sin(Math.PI * clamp((u - 0.55) / 0.45, 0, 1)) * 0.025;
        this.prof.setAttribute("opacity", 0);
        this.logo.setAttribute("opacity", 1);
        this.logo.setAttribute("transform", `scale(${sx.toFixed(3)} ${sy.toFixed(3)})`);
      }
      if (turn >= 1) this.logo.setAttribute("transform", "");
    }

    place(x, y, k, facing = 1) {
      this.root.setAttribute("transform", `translate(${f1(x)} ${f1(y)}) scale(${(k * facing).toFixed(4)} ${k.toFixed(4)})`);
    }
  }

  Cat.D = D;
  Cat.gaitCycle = D.stride / D.duty; // distance (logo units) per full gait cycle
  window.YarnCat = Cat;
})();
