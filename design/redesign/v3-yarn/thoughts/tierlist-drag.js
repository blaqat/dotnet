/* ============================================================
   Tier list · springs + drag (mock)
   window.TierDrag = { Springs, flip, lift, create }

   - Springs: per-element x / y / scale springs on one rAF loop.
     Critically damped by default (Apple "response" + "damping").
     Always animate from the current on-screen value (interruptible).
   - flip(items, mutate): measure → change DOM → spring from old spot.
   - create(opts): Pointer Events drag with setPointerCapture.
       mouse/pen: lifts on press, drags after 4 px
       touch: long-press (260 ms) picks up, so vertical scroll still works
     The dragged item stays in the DOM as a dashed "slot" that moves
     between zones; a clone follows the pointer 1:1 (grab offset kept).
     Release: the real item springs from the clone's spot with the
     release velocity. Dropped outside a zone → it goes home.
   ============================================================ */
(() => {
  const reduced = () =>
    (window.Yarn && Yarn.reduced && Yarn.reduced()) || matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ------------------------------------------------------------ springs
  const anims = new Map();
  let raf = 0;
  let last = 0;

  function A(el) {
    let a = anims.get(el);
    if (!a) {
      a = {
        el,
        x: { v: 0, vel: 0, t: 0 },
        y: { v: 0, vel: 0, t: 0 },
        s: { v: 1, vel: 0, t: 1 },
        resp: 0.36,
        damp: 1,
        sresp: 0.26,
        rest: true,
        onRest: null,
      };
      anims.set(el, a);
    }
    return a;
  }
  function stepAxis(sp, dt, resp, damp) {
    const w = (2 * Math.PI) / resp;
    const acc = -w * w * (sp.v - sp.t) - 2 * damp * w * sp.vel;
    sp.vel += acc * dt;
    sp.v += sp.vel * dt;
  }
  const settled = (sp, eps) => Math.abs(sp.v - sp.t) < eps && Math.abs(sp.vel) < eps * 20;
  function apply(a) {
    const { x, y, s } = a;
    const moved = Math.abs(x.v) > 0.01 || Math.abs(y.v) > 0.01 || Math.abs(s.v - 1) > 0.0005;
    a.el.style.transform = moved ? `translate3d(${x.v.toFixed(2)}px, ${y.v.toFixed(2)}px, 0) scale(${s.v.toFixed(4)})` : "";
  }
  function tick(now) {
    const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
    last = now;
    let active = false;
    for (const a of anims.values()) {
      if (a.rest) continue;
      if (!a.el.isConnected) {
        anims.delete(a.el);
        continue;
      }
      const n = Math.max(1, Math.ceil(dt * 240));
      const h = dt / n;
      for (let i = 0; i < n; i++) {
        stepAxis(a.x, h, a.resp, a.damp);
        stepAxis(a.y, h, a.resp, a.damp);
        stepAxis(a.s, h, a.sresp, 1);
      }
      if (settled(a.x, 0.3) && settled(a.y, 0.3) && settled(a.s, 0.001)) {
        for (const k of ["x", "y", "s"]) {
          a[k].v = a[k].t;
          a[k].vel = 0;
        }
        a.rest = true;
        apply(a);
        const cb = a.onRest;
        a.onRest = null;
        cb && cb();
      } else {
        active = true;
        apply(a);
      }
    }
    raf = active ? requestAnimationFrame(tick) : 0;
  }
  function wake() {
    if (!raf) {
      last = performance.now();
      raf = requestAnimationFrame(tick);
    }
  }

  const Springs = {
    get: A,
    /** Spring toward targets. opts: resp, damp, vx, vy (px/s), onRest */
    to(el, tgt, opts = {}) {
      const a = A(el);
      if (opts.resp) a.resp = opts.resp;
      a.damp = opts.damp ?? 1;
      if (opts.sresp) a.sresp = opts.sresp;
      if ("x" in tgt) a.x.t = tgt.x;
      if ("y" in tgt) a.y.t = tgt.y;
      if ("s" in tgt) a.s.t = tgt.s;
      if (opts.vx != null) a.x.vel = opts.vx;
      if (opts.vy != null) a.y.vel = opts.vy;
      if (opts.onRest) a.onRest = opts.onRest;
      if (reduced()) {
        Springs.finish(el);
        return;
      }
      a.rest = false;
      wake();
    },
    /** Jump (no animation). */
    set(el, vals) {
      const a = A(el);
      for (const k of ["x", "y", "s"]) if (k in vals) {
        a[k].v = a[k].t = vals[k];
        a[k].vel = 0;
      }
      apply(a);
    },
    finish(el) {
      const a = A(el);
      for (const k of ["x", "y", "s"]) {
        a[k].v = a[k].t;
        a[k].vel = 0;
      }
      a.rest = true;
      apply(a);
      const cb = a.onRest;
      a.onRest = null;
      cb && cb();
    },
    finishAll() {
      for (const el of [...anims.keys()]) Springs.finish(el);
    },
    value(el) {
      const a = anims.get(el);
      return a ? { x: a.x.v, y: a.y.v, s: a.s.v } : { x: 0, y: 0, s: 1 };
    },
  };

  const center = (r) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });

  /** FLIP every element in `els` across a DOM mutation, keeping velocity. */
  function flip(els, mutate, opts = {}) {
    const before = new Map();
    for (const el of els) if (el.isConnected) before.set(el, center(el.getBoundingClientRect()));
    mutate();
    const rm = reduced();
    for (const [el, b] of before) {
      if (!el.isConnected) continue;
      const a = A(el);
      const c = center(el.getBoundingClientRect());
      // layout centre = visual centre minus current offset (scale is around the centre)
      const nx = b.x - (c.x - a.x.v);
      const ny = b.y - (c.y - a.y.v);
      if (Math.abs(nx - a.x.v) < 0.5 && Math.abs(ny - a.y.v) < 0.5) continue;
      if (rm) {
        Springs.set(el, { x: 0, y: 0 });
        continue;
      }
      a.x.v = nx;
      a.y.v = ny;
      a.x.t = 0;
      a.y.t = 0;
      a.resp = opts.resp || 0.36;
      a.damp = 1;
      a.rest = false;
      apply(a);
    }
    wake();
  }

  /** Lift / lower an item (press feedback: scale + shadow). */
  function lift(el, on, scale = 1.06) {
    el.classList.toggle("is-lifted", !!on);
    Springs.to(el, { s: on ? scale : 1 }, { sresp: on ? 0.22 : 0.3, damp: A(el).damp });
  }

  function rubber(v, min, max, dim = 120) {
    const c = 0.55;
    if (v < min) return min - ((min - v) * dim * c) / (dim + c * (min - v));
    if (v > max) return max + ((v - max) * dim * c) / (dim + c * (v - max));
    return v;
  }

  // ------------------------------------------------------------ drag
  /**
   * opts: root, layer, itemSel, enabled(), items() → all draggable items,
   *       zones() → [{ zone: ul, hit: el }], home zone order is DOM order
   *       onTap(li, e), onStart(li), onOver(zoneEl|null), onDrop(li, info), shelfTop() → px | null
   */
  function create(o) {
    const LONG_PRESS = 260;
    const MOUSE_SLOP = 4;
    const TOUCH_SLOP = 9;
    let g = null; // active gesture

    const itemFrom = (t) => {
      const li = t && t.closest && t.closest(o.itemSel);
      return li && o.root.contains(li) ? li : null;
    };
    const indexIn = (li) => [...li.parentElement.children].filter((c) => c.matches(o.itemSel)).indexOf(li);

    function down(e) {
      if (g || !o.enabled() || (e.pointerType === "mouse" && e.button !== 0)) return;
      const li = itemFrom(e.target);
      if (!li) return;
      g = {
        id: e.pointerId,
        type: e.pointerType,
        li,
        x0: e.clientX,
        y0: e.clientY,
        x: e.clientX,
        y: e.clientY,
        hist: [{ x: e.clientX, y: e.clientY, t: e.timeStamp }],
        phase: "press",
        timer: 0,
      };
      try {
        o.root.setPointerCapture(e.pointerId);
      } catch (_) {}
      if (g.type === "touch") {
        // gentle "charging" squeeze, then lift once the long-press lands
        Springs.to(li, { s: 0.97 }, { sresp: 0.18 });
        g.timer = setTimeout(() => {
          if (!g || g.li !== li) return;
          g.phase = "armed";
          lift(li, true, 1.07);
          navigator.vibrate && navigator.vibrate(8);
        }, LONG_PRESS);
      } else {
        e.preventDefault(); // no text selection / native drag
        lift(li, true, 1.04);
      }
    }

    function track(e) {
      g.x = e.clientX;
      g.y = e.clientY;
      g.hist.push({ x: e.clientX, y: e.clientY, t: e.timeStamp });
      while (g.hist.length > 2 && e.timeStamp - g.hist[0].t > 100) g.hist.shift();
    }

    function move(e) {
      if (!g || e.pointerId !== g.id) return;
      track(e);
      const d = Math.hypot(g.x - g.x0, g.y - g.y0);
      if (g.phase === "press") {
        if (g.type === "touch") {
          if (d > TOUCH_SLOP) abortPress(); // it's a scroll
        } else if (d > MOUSE_SLOP) start();
        return;
      }
      if (g.phase === "armed" && d > 2) start();
      if (g.phase === "drag") dragTo(g.x, g.y);
    }

    function abortPress() {
      if (!g) return;
      clearTimeout(g.timer);
      lift(g.li, false);
      try {
        o.root.releasePointerCapture(g.id);
      } catch (_) {}
      g = null;
    }

    /** Begin a drag on g.li at the current pointer. */
    function start() {
      const li = g.li;
      const r = li.getBoundingClientRect();
      const s0 = Springs.value(li).s;
      const w = li.offsetWidth;
      const h = li.offsetHeight;
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const left = cx - w / 2;
      const top = cy - h / 2;
      // grab point in the clone's own (unscaled) box, so it scales around the finger
      const gx = w / 2 + (g.x0 - cx) / s0;
      const gy = h / 2 + (g.y0 - cy) / s0;

      const ghost = li.cloneNode(true);
      ghost.classList.remove("is-slot", "is-selected");
      ghost.classList.add("tl-ghost", "is-lifted");
      ghost.setAttribute("aria-hidden", "true");
      ghost.querySelectorAll("[id]").forEach((n) => n.removeAttribute("id"));
      ghost.querySelectorAll("button").forEach((b) => b.setAttribute("tabindex", "-1"));
      Object.assign(ghost.style, {
        left: left + "px",
        top: top + "px",
        width: w + "px",
        height: h + "px",
        transformOrigin: `${gx}px ${gy}px`,
        transform: "",
      });
      o.layer.appendChild(ghost);
      Springs.set(ghost, { x: g.x - g.x0, y: g.y - g.y0, s: s0 });
      Springs.to(ghost, { s: g.type === "touch" ? 1.08 : 1.06 }, { sresp: 0.22 });

      li.classList.remove("is-lifted");
      li.classList.add("is-slot");
      Springs.set(li, { x: 0, y: 0, s: 1 });

      g.ghost = ghost;
      g.from = { zone: li.parentElement, index: indexIn(li) };
      g.over = null;
      g.phase = "drag";
      document.documentElement.classList.add("tl-dragging");
      o.onStart && o.onStart(li);
      loop();
      dragTo(g.x, g.y);
    }

    function place(zone, index) {
      const li = g.li;
      if (li.parentElement === zone && indexIn(li) === index) return;
      flip(o.items().filter((n) => n !== li), () => {
        const kids = [...zone.children].filter((c) => c.matches(o.itemSel) && c !== li);
        zone.insertBefore(li, kids[index] || null);
      });
    }

    function zoneAt(x, y) {
      for (const z of o.zones()) {
        const r = z.hit.getBoundingClientRect();
        if (x >= r.left - 6 && x <= r.right + 6 && y >= r.top - 4 && y <= r.bottom + 4) return z.zone;
      }
      return null;
    }

    /** Insertion index among the zone's items (layout positions, not mid-spring ones). */
    function indexAt(zone, x, y) {
      const kids = [...zone.children].filter((c) => c.matches(o.itemSel) && c !== g.li);
      for (let i = 0; i < kids.length; i++) {
        const r = kids[i].getBoundingClientRect();
        const off = Springs.value(kids[i]);
        const top = r.top - off.y;
        const bottom = r.bottom - off.y;
        const mid = r.left - off.x + r.width / 2;
        if (y < top - 4) return i;
        if (y <= bottom + 4 && x < mid) return i;
      }
      return kids.length;
    }

    function dragTo(x, y) {
      // 1:1, rubber-banded past the viewport edges
      const vw = innerWidth;
      const vh = innerHeight;
      const rx = rubber(x, 0, vw);
      const ry = rubber(y, 0, vh);
      const a = A(g.ghost);
      a.x.v = a.x.t = rx - g.x0;
      a.y.v = a.y.t = ry - g.y0;
      a.x.vel = a.y.vel = 0;
      if (a.rest) apply(a);

      const zone = zoneAt(x, y);
      if (zone !== g.over) {
        g.over = zone;
        o.onOver && o.onOver(zone);
      }
      if (zone) place(zone, indexAt(zone, x, y));
      else place(g.from.zone, g.from.index); // outside → make room back home

      // auto-scroll near the top / above the bottom shelf
      const shelf = (o.shelfTop && o.shelfTop()) || vh;
      const overShelf = y > shelf;
      const edge = 72;
      const inTop = y < edge;
      const inBottom = !overShelf && y > shelf - edge;
      // only arm edge-scrolling once the pointer has been clear of both edges,
      // so lifting an item out of the bottom shelf doesn't scroll the page
      if (!inTop && !inBottom && !overShelf) g.edgeArmed = true;
      let v = 0;
      if (g.edgeArmed && inTop) v = -Math.min(18, ((edge - y) / edge) * 18);
      else if (g.edgeArmed && inBottom) v = Math.min(18, ((y - (shelf - edge)) / edge) * 18);
      g.scrollV = v;
    }

    function loop() {
      if (!g || g.phase !== "drag") return;
      if (g.scrollV) {
        const before = scrollY;
        scrollBy(0, g.scrollV);
        if (scrollY !== before) dragTo(g.x, g.y);
      }
      requestAnimationFrame(loop);
    }

    function velocity() {
      const h = g.hist;
      if (h.length < 2) return { vx: 0, vy: 0 };
      const a = h[0];
      const b = h[h.length - 1];
      const dt = Math.max(1, b.t - a.t) / 1000;
      return { vx: (b.x - a.x) / dt, vy: (b.y - a.y) / dt };
    }

    function finish(cancelled) {
      const { li, ghost } = g;
      if (cancelled) place(g.from.zone, g.from.index);
      const { vx, vy } = cancelled ? { vx: 0, vy: 0 } : velocity();
      const gr = ghost.getBoundingClientRect();
      const gs = Springs.value(ghost).s;
      ghost.remove();
      li.classList.remove("is-slot");
      const lr = li.getBoundingClientRect();
      const gc = center(gr);
      const lc = center(lr);
      Springs.set(li, { x: gc.x - lc.x, y: gc.y - lc.y, s: gs });
      li.classList.add("is-settling");
      const fast = Math.hypot(vx, vy) > 900;
      Springs.to(
        li,
        { x: 0, y: 0, s: 1 },
        { vx, vy, damp: fast ? 0.8 : 1, resp: 0.38, sresp: 0.3, onRest: () => li.classList.remove("is-settling") },
      );
      const to = { zone: li.parentElement, index: indexIn(li) };
      const info = { from: g.from, to, cancelled, outside: !g.over };
      g.over && o.onOver && o.onOver(null);
      document.documentElement.classList.remove("tl-dragging");
      g = null;
      o.onDrop && o.onDrop(li, info);
    }

    function up(e) {
      if (!g || e.pointerId !== g.id) return;
      track(e);
      clearTimeout(g.timer);
      try {
        o.root.releasePointerCapture(e.pointerId);
      } catch (_) {}
      if (g.phase === "drag") return finish(false);
      // a tap (or a long-press that never moved) selects
      const li = g.li;
      lift(li, false);
      g = null;
      o.onTap && o.onTap(li, e);
    }

    function cancel(e) {
      if (!g || (e && e.pointerId !== g.id)) return;
      clearTimeout(g.timer);
      if (g.phase === "drag") return finish(true);
      lift(g.li, false);
      g = null;
    }

    o.root.addEventListener("pointerdown", down);
    o.root.addEventListener("pointermove", move);
    o.root.addEventListener("pointerup", up);
    o.root.addEventListener("pointercancel", cancel);
    // stop the page from scrolling once a touch drag owns the finger
    document.addEventListener(
      "touchmove",
      (e) => {
        if (g && (g.phase === "armed" || g.phase === "drag")) e.preventDefault();
      },
      { passive: false },
    );
    o.root.addEventListener("contextmenu", (e) => {
      if (itemFrom(e.target) && o.enabled()) e.preventDefault();
    });
    addEventListener("keydown", (e) => {
      if (e.key === "Escape" && g && g.phase === "drag") cancel();
    });
    addEventListener("scroll", () => g && g.phase === "drag" && dragTo(g.x, g.y), { passive: true });

    return {
      active: () => !!g,
      cancel: () => cancel(),
      /** Freeze a drag mid-flight for screenshots: pick `li` up and hold it at (x, y). */
      simulate(li, x, y) {
        const r = li.getBoundingClientRect();
        const cx = r.left + r.width * 0.45;
        const cy = r.top + r.height * 0.4;
        g = { id: -1, type: "mouse", li, x0: cx, y0: cy, x: cx, y: cy, hist: [], phase: "press" };
        start();
        g.x = x;
        g.y = y;
        dragTo(x, y);
        g.scrollV = 0;
        Springs.finishAll();
        Springs.set(g.ghost, { s: 1.06 });
        g.phase = "frozen";
      },
    };
  }

  window.TierDrag = { Springs, flip, lift, create, center };
})();
