/* ============================================================
   Studio · core (studio agent, iteration 2). Mock-only, client-side.
   window.Studio: state + autosave, router, nav, sheets, toasts,
   field binding, waveform, markdown, word diff, media library,
   publish flow, revisions. Screens register into Studio.screens
   (studio-screens.js, studio-editors.js, studio-tiers.js);
   studio.js boots it.
   ============================================================ */
(() => {
  "use strict";
  const Y = window.Yarn, D = window.StudioData;
  const S = (window.Studio = window.Studio || {});
  S.screens = S.screens || {};
  const html = document.documentElement;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = Y.esc;
  Object.assign(S, { $, $$, esc, Y, D });

  /* ============================================================
     OPTIONS (page params; all in the ⚙ panel)
     ============================================================ */
  const P0 = new URLSearchParams(location.search);
  const pick = (v, ok, d) => (ok.includes(v) ? v : d);
  S.opt = {
    frame: pick(P0.get("frame"), ["section", "ink"], "section"),
    layout: pick(P0.get("layout"), ["split", "single"], "split"),
    confirm: pick(P0.get("confirm"), ["smart", "always"], "smart"),
    offline: P0.get("offline") === "1",
    pstate: pick(P0.get("pstate"), ["ok", "error"], "ok"),
  };
  html.dataset.frame = S.opt.frame;
  html.dataset.layout = S.opt.layout;
  // params that survive navigation inside the Studio (kit options + page options)
  S.KEEP = ["sel", "rope", "body", "bg", "nav", "reduced", "frame", "layout", "confirm", "offline", "pstate", "sound"];

  /* ============================================================
     STATE (+ optional localStorage; every access in try/catch)
     ============================================================ */
  const KEY = "blaqat.studio.i2";
  const boot = Date.now();
  S.now = () => D.NOW + (Date.now() - boot);
  let data = null;
  try {
    if (P0.has("reset")) localStorage.removeItem(KEY);
    const s = JSON.parse(localStorage.getItem(KEY) || "null");
    if (s && s.v === 3 && s.data) data = s.data;
  } catch (_) {}
  if (!data) data = { ...D.seed(), activity: D.ACTIVITY.slice(), uploads: [], removed: [], revs: {} };
  S.data = data;
  let persistT = 0;
  S.persist = () => {
    clearTimeout(persistT);
    persistT = setTimeout(() => {
      try {
        const lite = { ...data, uploads: data.uploads.filter((u) => !/^blob:/.test(u.src)) };
        localStorage.setItem(KEY, JSON.stringify({ v: 3, data: lite }));
      } catch (_) {}
    }, 250);
  };
  S.items = (sec) => (sec === "home" ? [data.home] : data[sec] || []);
  S.find = (sec, id) => (sec === "home" ? data.home : (data[sec] || []).find((x) => String(x.id) === String(id)));
  S.titleOf = (it) => it?.name || it?.title || (it?.text ? it.text.slice(0, 60) + (it.text.length > 60 ? "…" : "") : "") || "Untitled";

  /* ---------- section vocabulary ---------- */
  S.SECTIONS = {
    projects: { key: "projects", label: "Projects", one: "project", icon: "ph-folder-simple" },
    music: { key: "music", label: "Music", one: "piece", icon: "ph-music-notes" },
    thoughts: { key: "thoughts", label: "Thoughts", one: "post", icon: "ph-cloud" },
    home: { key: "home", label: "Home & About", one: "page", icon: "ph-house" },
    media: { key: "studio", label: "Media", one: "file", icon: "ph-images-square" },
  };
  // same names + icons as the Thoughts page
  S.TTYPES = {
    scratch: { label: "Scratch", icon: "ph-scribble-loop", hint: "a quick line, no title" },
    article: { label: "Article", icon: "ph-article", hint: "markdown, cover, read time" },
    pick: { label: "Pick", icon: "ph-tag", hint: "a link into a collection" },
    playlist: { label: "Playlist", icon: "ph-playlist", hint: "tracks from your music" },
    embed: { label: "Images", icon: "ph-images", hint: "photos, a set, or an embed" },
    tierlist: { label: "Ranking", icon: "ph-ranking", hint: "rank things; visitors add theirs" },
  };

  /* ---------- time ---------- */
  S.clock = (t) => Y.fmt.time(new Date(t));
  S.ago = (t) => {
    const d = S.now() - t, m = Math.round(d / 60e3);
    if (m < 1) return "just now";
    if (m < 60) return `${m} min ago`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h} h ago`;
    const day = new Date(t), today = new Date(S.now());
    const yest = new Date(today); yest.setDate(today.getDate() - 1);
    if (day.toDateString() === yest.toDateString()) return `yesterday, ${S.clock(t)}`;
    return Y.fmt.day(day);
  };
  S.dayLabel = (t) => {
    const day = new Date(t), today = new Date(S.now());
    const yest = new Date(today); yest.setDate(today.getDate() - 1);
    if (day.toDateString() === today.toDateString()) return "Today";
    if (day.toDateString() === yest.toDateString()) return "Yesterday";
    return Y.fmt.day(day);
  };
  S.bytes = (n) => (n >= 1e9 ? `${(n / 1e9).toFixed(1)} GB` : n >= 1e6 ? `${(n / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1e3))} KB`);

  /* ============================================================
     PUBLISH STATE + AUTOSAVE
     ============================================================ */
  // publication state: the kit badge (Yarn.badge.pub), a second axis next to status
  S.PUB = Y.PUB;
  S.pub = (state, { compact = false } = {}) => Y.badge.pub(state, { compact });
  S.saveHTML = (item) => `<span class="st-save" data-save data-state="${S.opt.offline ? "offline" : "saved"}" role="status" aria-live="polite"><i class="ph-bold ${S.opt.offline ? "ph-cloud-slash" : "ph-check"}" aria-hidden="true"></i><span class="st-save__run" aria-hidden="true"></span><span data-save-t>${S.opt.offline ? "Offline · saved on this device" : `<span class="st-save__w">Saved </span>${S.clock(item?._edited || S.now())}`}</span></span>`;
  // edit → mark changed, show "Saving…", then "Saved h:mm" (debounced)
  let saveT = 0, saveT2 = 0;
  S.touch = (sec, item, { quiet = false } = {}) => {
    item._edited = S.now();
    if (item._pub === "live") { item._pub = "changed"; S.emit("pub", item); }
    S.persist();
    if (quiet) return;
    const pills = $$("[data-save]");
    pills.forEach((p) => { p.dataset.state = "saving"; $("[data-save-t]", p).textContent = "Saving…"; });
    clearTimeout(saveT); clearTimeout(saveT2);
    saveT = setTimeout(() => {
      saveT2 = setTimeout(() => {
        $$("[data-save]").forEach((p) => {
          p.dataset.state = S.opt.offline ? "offline" : "saved";
          const i = $("i", p); if (i) i.className = `ph-bold ${S.opt.offline ? "ph-cloud-slash" : "ph-check"}`;
          $("[data-save-t]", p).innerHTML = S.opt.offline ? "Offline · saved on this device" : `<span class="st-save__w">Saved </span>${S.clock(S.now())}`;
        });
      }, 380);
    }, 520);
  };

  /* ---------- tiny event bus ---------- */
  const subs = {};
  S.on = (n, fn) => ((subs[n] ||= new Set()).add(fn), () => subs[n].delete(fn));
  S.emit = (n, ...a) => subs[n]?.forEach((fn) => { try { fn(...a); } catch (e) { console.warn(e); } });

  /* ---------- activity + revisions ---------- */
  S.log = (verb, section, item, icon = "ph-pencil-simple", extra = {}) => {
    data.activity.unshift({ t: S.now(), verb, section, id: item?.id ?? "", title: S.titleOf(item), icon, ...extra });
    S.persist();
  };
  S.revisions = (section, item) => {
    const k = `${section}:${item.id}`;
    if (!data.revs[k]) data.revs[k] = D.revisions(item, section);
    return data.revs[k];
  };

  /* ============================================================
     ROUTER — every screen is a URL (?screen=…); links are real <a href>
     ============================================================ */
  S.href = (screen, params = {}) => {
    const u = new URLSearchParams();
    const cur = new URLSearchParams(location.search);
    for (const k of S.KEEP) if (cur.has(k)) u.set(k, cur.get(k));
    u.set("screen", screen);
    for (const [k, v] of Object.entries(params)) if (v != null && v !== "") u.set(k, v);
    return `?${u}`;
  };
  S.go = (screen, params = {}, { replace = false, trigger = null } = {}) => {
    const url = S.href(screen, params);
    history[replace ? "replaceState" : "pushState"]({ st: 1 }, "", url);
    S.render({ trigger });
  };
  // intercept in-app links (same page, ?screen=…)
  document.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest?.("a[href^='?']");
    if (!a || a.target === "_blank" || a.closest(".st-prevbox")) return;
    e.preventDefault();
    history.pushState({ st: 1 }, "", a.getAttribute("href"));
    S.render({ trigger: a });
  });
  addEventListener("popstate", () => S.render({ pop: true }));

  // keep the kit's params object in step with the address bar (filters + ⚙ panel read it)
  function syncParams() {
    const p = Y.params;
    [...p.keys()].forEach((k) => p.delete(k));
    new URLSearchParams(location.search).forEach((v, k) => p.set(k, v));
  }

  S.view = () => $("#st-view");
  let cleanup = [];
  S.onLeave = (fn) => cleanup.push(fn);
  S.render = ({ trigger = null, pop = false } = {}) => {
    syncParams();
    const q = new URLSearchParams(location.search);
    let name = q.get("screen") || "dashboard";
    if (!S.screens[name]) name = "dashboard";
    const def = S.screens[name];
    cleanup.forEach((fn) => { try { fn(); } catch (_) {} }); cleanup = [];
    S.closeAllSheets(true);
    const sec = def.section ? def.section(q) : "studio";
    html.dataset.section = S.opt.frame === "section" ? sec : "studio";
    html.classList.toggle("st-focus", !!def.focus);
    html.classList.toggle("st-has-foot", !!def.foot);
    S.renderNav(def.nav === false ? null : (def.navKey ? def.navKey(q) : sec));
    const view = S.view();
    view.innerHTML = "";
    view.classList.remove("is-enter");
    def.render(view, q);
    void view.offsetWidth;
    if (!pop) view.classList.add("is-enter");
    if (!pop) scrollTo(0, 0);
    document.title = `${def.title ? def.title(q) : "Studio"} · Studio · blaqat.net`;
    S.state = { name, q };
    S.emit("render", name, q);
    if (trigger && !trigger.closest?.(".ybar, .ynav")) view.focus({ preventScroll: true });
  };

  /* ============================================================
     NAV — the kit nav (Yarn.navHTML) with Studio's own page list
     ============================================================ */
  // Studio's page list for the kit nav (Yarn.navHTML): Studio home is a bar item, Home & About a desktop tab; ink felt for Studio's own pages
  const NAV = () => [
    { key: "studio", label: "Studio", icon: "ph-squares-four", href: S.href("dashboard"), section: "studio", tab: false },
    { key: "projects", label: "Projects", icon: "ph-folder-simple", href: S.href("list", { section: "projects" }) },
    { key: "music", label: "Music", icon: "ph-music-notes", href: S.href("list", { section: "music" }) },
    { key: "thoughts", label: "Thoughts", icon: "ph-cloud", href: S.href("list", { section: "thoughts" }) },
    { key: "home", label: "Home", icon: "ph-house", href: S.href("home"), bar: false },
    { key: "media", label: "Media", icon: "ph-images-square", href: S.href("media"), section: "studio" },
  ];
  S.renderNav = (active) => {
    const host = $("#st-nav");
    if (active == null) { host.innerHTML = ""; return; }
    host.innerHTML = Y.navHTML({
      active, pages: NAV(), label: "Studio",
      brand: { href: S.href("dashboard"), label: "Studio dashboard" },
      badge: `<span class="st-label" aria-hidden="true"><i class="ph-fill ph-lock-simple"></i>Studio</span>`,
      extra: `<a class="btn btn--ghost btn--sm st-viewsite" href="../home/index.html?skip" target="_blank" rel="noopener" aria-label="View the live site (opens in a new tab)"><i class="ph-bold ph-arrow-up-right" aria-hidden="true"></i><span>View site</span></a>`,
    });
  };

  /* ============================================================
     SHEETS — grow from the trigger, close back into it.
     Desktop: centred card (or docked right). Phone: bottom sheet, drag down to dismiss.
     ============================================================ */
  const sheets = [];
  const isPhone = () => innerWidth < 960;
  const FOCUSABLE = "a[href], button:not([disabled]), input:not([disabled]), textarea, select, [tabindex]:not([tabindex='-1'])";
  S.sheet = ({ from = null, title = "", html: body = "", foot = "", width = 560, side = "center", label = "", onMount, onClose, cls = "" } = {}) => {
    const wrap = document.createElement("div");
    wrap.className = "st-sheetwrap";
    const id = Y.uid("sheet");
    wrap.innerHTML = `<div class="st-scrim" data-close></div>
      <section class="st-sheet ${side === "right" ? "st-sheet--right" : ""} ${cls}" role="dialog" aria-modal="true" aria-labelledby="${id}-t" style="--w:${width}px">
        <button type="button" class="st-grab" aria-label="Drag down to close" tabindex="-1"></button>
        <header class="st-sheet__head"><h2 id="${id}-t">${title}${/[?!.]$/.test(title) ? "" : `<span class="yhead__dot" aria-hidden="true">.</span>`}</h2>
          <button type="button" class="btn btn--ghost btn--icon btn--sm" data-close aria-label="Close"><i class="ph-bold ph-x" aria-hidden="true"></i></button></header>
        <div class="st-sheet__body">${body}</div>
        ${foot ? `<footer class="st-sheet__foot">${foot}</footer>` : ""}
      </section>`;
    $("#st-layer").appendChild(wrap);
    const sheet = $(".st-sheet", wrap), scrim = $(".st-scrim", wrap);
    const api = { el: sheet, wrap, body: $(".st-sheet__body", sheet), foot: $(".st-sheet__foot", sheet), from, closed: false, close: (o) => close(o) };
    sheets.push(api);
    html.style.overflow = "hidden";
    const returnTo = document.activeElement;
    Y.sound("open", { el: from || undefined });
    let anim = null;
    const fromRect = () => (from && from.isConnected ? from.getBoundingClientRect() : null);
    function openAnim() {
      if (Y.reduced()) { sheet.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160 }); return; }
      const sr = sheet.getBoundingClientRect();
      scrim.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: "ease-out" });
      if (isPhone()) {
        const sp = Y.springEasing({ response: 0.42 });
        anim = sheet.animate([{ transform: `translateY(${sr.height + 20}px)` }, { transform: "none" }], { duration: sp.duration, easing: sp.easing });
        return;
      }
      const fr = fromRect();
      const sp = Y.springEasing({ response: 0.4 });
      if (fr) {
        const dx = fr.left + fr.width / 2 - (sr.left + sr.width / 2), dy = fr.top + fr.height / 2 - (sr.top + sr.height / 2);
        const s = Math.max(0.08, Math.min(fr.width / sr.width, 0.5));
        anim = sheet.animate([{ transform: `translate(${dx}px, ${dy}px) scale(${s})`, opacity: 0, borderRadius: "40px" }, { transform: "none", opacity: 1, offset: 0.35 }, { transform: "none", opacity: 1, borderRadius: "24px" }], { duration: sp.duration, easing: sp.easing });
      } else anim = sheet.animate([{ transform: "translateY(12px) scale(.97)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: sp.duration, easing: sp.easing });
    }
    function close({ instant = false, silent = false } = {}) {
      if (api.closed) return;
      api.closed = true;
      sheets.splice(sheets.indexOf(api), 1);
      if (!sheets.length) html.style.overflow = "";
      if (!silent) Y.sound("close", { el: from || undefined });
      onClose?.();
      document.removeEventListener("keydown", onKey, true);
      const done = () => wrap.remove();
      if (instant || Y.reduced()) { done(); }
      else {
        anim?.cancel();
        const sr = sheet.getBoundingClientRect(), fr = fromRect();
        scrim.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: "forwards" });
        let to = isPhone() ? { transform: `translateY(${innerHeight - sr.top}px)` } : { transform: "translateY(8px) scale(.97)", opacity: 0 };
        if (!isPhone() && fr) { const dx = fr.left + fr.width / 2 - (sr.left + sr.width / 2), dy = fr.top + fr.height / 2 - (sr.top + sr.height / 2); to = { transform: `translate(${dx}px, ${dy}px) scale(${Math.max(0.08, Math.min(fr.width / sr.width, 0.5))})`, opacity: 0 }; }
        sheet.animate([{ transform: getComputedStyle(sheet).transform === "none" ? "none" : getComputedStyle(sheet).transform, opacity: 1 }, to], { duration: 230, easing: "cubic-bezier(.4,0,.8,.6)", fill: "forwards" }).onfinish = done;
      }
      if (!instant && returnTo && returnTo.isConnected) returnTo.focus({ preventScroll: true });
    }
    function onKey(e) {
      if (sheets[sheets.length - 1] !== api) return;
      if (e.key === "Escape") { e.stopPropagation(); e.preventDefault(); close(); return; }
      if (e.key === "Tab") {
        const f = $$(FOCUSABLE, sheet).filter((n) => n.getClientRects().length && !n.classList.contains("st-grab"));
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener("keydown", onKey, true);
    wrap.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) close(); });
    // phone: drag the grabber / header down to dismiss (spring back otherwise)
    const grab = $(".st-grab", sheet), head = $(".st-sheet__head", sheet);
    let dg = null;
    const ty = new Y.Spring(0, { onUpdate: (v) => (sheet.style.transform = v > 0.3 ? `translateY(${v}px)` : "") });
    const down = (e) => { if (!isPhone() || e.target.closest("button:not(.st-grab)")) return; dg = { y0: e.clientY, t: e.timeStamp, last: e.clientY, lt: e.timeStamp, v: 0 }; e.currentTarget.setPointerCapture(e.pointerId); anim?.cancel(); };
    const move = (e) => { if (!dg) return; const d = e.clientY - dg.y0; dg.v = (e.clientY - dg.last) / Math.max(1, e.timeStamp - dg.lt) * 1000; dg.last = e.clientY; dg.lt = e.timeStamp; ty.set(d > 0 ? d : d / 4); };
    const up = () => { if (!dg) return; const d = ty.value, v = dg.v; dg = null; if (d > 120 || v > 900) close(); else ty.to(0, { velocity: v, response: 0.36 }); };
    for (const h of [grab, head]) { h.addEventListener("pointerdown", down); h.addEventListener("pointermove", move); h.addEventListener("pointerup", up); h.addEventListener("pointercancel", up); }
    onMount?.(api);
    requestAnimationFrame(openAnim);
    requestAnimationFrame(() => { const f = $("[autofocus]", sheet) || $$(FOCUSABLE, sheet).find((n) => !n.classList.contains("st-grab") && !n.hasAttribute("data-close")) || $("[data-close]", sheet); f?.focus({ preventScroll: true }); });
    return api;
  };
  S.closeAllSheets = (instant = false) => [...sheets].forEach((s) => s.close({ instant, silent: instant }));
  S.topSheet = () => sheets[sheets.length - 1] || null;

  /* ============================================================
     TOASTS
     ============================================================ */
  S.toast = ({ icon = "ph-check-circle", title = "", text = "", actions = [], tone = "", duration = 5200, progress = 0, id = "" } = {}) => {
    const host = $("#st-toasts");
    if (id) $(`[data-tid="${id}"]`, host)?.remove();
    const t = document.createElement("div");
    t.className = `st-toast ${tone ? `st-toast--${tone}` : ""}`;
    if (id) t.dataset.tid = id;
    t.innerHTML = `<i class="ph-bold ${icon}" aria-hidden="true"></i><div class="st-toast__t"><b>${title}</b>${text ? `<span>${text}</span>` : ""}${progress ? `<span class="st-toast__prog" style="--d:${progress}ms" aria-hidden="true"><b></b></span>` : ""}</div>${actions.map((a, i) => `<button type="button" class="btn ${a.cls || "btn--ghost"} btn--sm" data-a="${i}">${a.label}</button>`).join("")}`;
    host.appendChild(t);
    if (!Y.reduced()) { const sp = Y.springEasing({ response: 0.4, damping: 0.82 }); t.animate([{ transform: "translateY(24px) scale(.96)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: sp.duration, easing: sp.easing }); }
    let timer = 0;
    const kill = () => { clearTimeout(timer); if (!t.isConnected) return; if (Y.reduced()) return t.remove(); t.animate([{ opacity: 1 }, { opacity: 0, transform: "translateY(10px)" }], { duration: 180, fill: "forwards" }).onfinish = () => t.remove(); };
    t.addEventListener("click", (e) => { const b = e.target.closest("[data-a]"); if (!b) return; const a = actions[+b.dataset.a]; a?.onClick?.(b); if (!a?.keep) kill(); });
    t.addEventListener("pointerenter", () => clearTimeout(timer));
    t.addEventListener("pointerleave", () => { if (duration) timer = setTimeout(kill, 2000); });
    if (duration) timer = setTimeout(kill, duration);
    return { el: t, close: kill };
  };
  S.say = (msg) => { const l = $("#st-live"); if (l) { l.textContent = ""; setTimeout(() => (l.textContent = msg), 30); } };

  /* ============================================================
     FIELDS — markup helpers + one binder (data-f="path" on controls)
     ============================================================ */
  const get = (o, p) => p.split(".").reduce((a, k) => (a == null ? a : a[k]), o);
  const set = (o, p, v) => { const ks = p.split("."); let a = o; ks.slice(0, -1).forEach((k) => (a = a[k] ??= {})); a[ks[ks.length - 1]] = v; };
  S.get = get; S.set = set;
  S.f = {
    text: (item, path, { label, placeholder = "", type = "text", hint = "", mono = false, id = Y.uid("f"), max = 0, inputmode = "", autocomplete = "off" } = {}) =>
      `<div class="st-field"><label for="${id}">${label}</label><input class="st-in${mono ? " st-mono" : ""}" id="${id}" type="${type}" data-f="${path}" value="${esc(get(item, path) ?? "")}" placeholder="${esc(placeholder)}" autocomplete="${autocomplete}"${inputmode ? ` inputmode="${inputmode}"` : ""}${max ? ` maxlength="${max}"` : ""}${hint ? ` aria-describedby="${id}-h"` : ""}>${hint ? `<p class="st-hint" id="${id}-h">${hint}</p>` : ""}</div>`,
    area: (item, path, { label, placeholder = "", rows = 4, hint = "", id = Y.uid("f"), max = 0, cls = "" } = {}) =>
      `<div class="st-field"><label for="${id}">${label}${max ? ` <span class="meta" data-count-for="${id}"></span>` : ""}</label><textarea class="st-ta ${cls}" id="${id}" data-f="${path}" rows="${rows}" placeholder="${esc(placeholder)}"${max ? ` data-max="${max}"` : ""}${hint ? ` aria-describedby="${id}-h"` : ""}>${esc(get(item, path) ?? "")}</textarea>${hint ? `<p class="st-hint" id="${id}-h">${hint}</p>` : ""}</div>`,
    select: (item, path, options, { label, id = Y.uid("f") } = {}) =>
      `<div class="st-field"><label for="${id}">${label}</label><select class="st-select" id="${id}" data-f="${path}">${options.map(([v, l]) => `<option value="${esc(v)}"${String(get(item, path) ?? "") === String(v) ? " selected" : ""}>${esc(l)}</option>`).join("")}</select></div>`,
    toggle: (item, path, { label, text = "" } = {}) =>
      `<button type="button" class="st-toggle" role="switch" data-f="${path}" aria-checked="${!!get(item, path)}"><span class="st-toggle__track" aria-hidden="true"><span class="st-toggle__knob"></span></span><span class="st-toggle__txt"><b>${label}</b>${text ? `<span>${text}</span>` : ""}</span></button>`,
    // single choice showing real kit badges
    choice: (item, path, options, { label, id = Y.uid("c") } = {}) =>
      `<div class="st-field"><span class="st-lab" id="${id}">${label}</span><div class="st-choice" role="radiogroup" aria-labelledby="${id}">${options.map(([v, inner, name]) => {
        const on = String(get(item, path) ?? "").toLowerCase() === String(v).toLowerCase() || (Y.status(v) && Y.status(get(item, path))?.key === Y.status(v)?.key);
        return `<button type="button" class="st-opt ysel ylift${on ? " is-selected" : ""}" role="radio" aria-checked="${!!on}" data-f="${path}" data-v="${esc(v)}" aria-label="${esc(name || v)}" tabindex="${on ? 0 : -1}">${inner}</button>`;
      }).join("")}</div></div>`,
  };
  // month/year pair (data model keeps "Sep 2025" strings like the site)
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  S.f.month = (item, path, { label, allowEmpty = false, id = Y.uid("m") } = {}) => {
    const d = Y.parseDate(get(item, path));
    const years = []; for (let y = 2027; y >= 2016; y--) years.push(y);
    return `<div class="st-field"><span class="st-lab" id="${id}">${label}</span><div class="st-fieldrow" style="grid-template-columns:1fr 1fr" role="group" aria-labelledby="${id}">
      <select class="st-select" data-month="${path}" data-part="m" aria-label="${label} month">${allowEmpty ? `<option value="">—</option>` : ""}${MON.map((m, i) => `<option value="${i}"${d && d.getMonth() === i ? " selected" : ""}>${m}</option>`).join("")}</select>
      <select class="st-select" data-month="${path}" data-part="y" aria-label="${label} year">${allowEmpty ? `<option value="">—</option>` : ""}${years.map((y) => `<option${d && d.getFullYear() === y ? " selected" : ""}>${y}</option>`).join("")}</select></div></div>`;
  };
  S.bind = (root, item, onChange) => {
    const fire = (path, el) => onChange?.(path, el);
    // a nested [data-scope] (e.g. the selected track inside a collection) binds to its own object
    const mine = (el) => { const sc = el.closest("[data-scope]"); return !sc || sc === root || !root.contains(sc); };
    root.addEventListener("input", (e) => {
      const el = e.target;
      if (!mine(el)) return;
      if (el.matches("[data-f]") && !el.matches(".st-toggle, .st-opt")) {
        let v = el.value;
        if (el.type === "number") v = el.value === "" ? null : +el.value;
        set(item, el.dataset.f, v);
        if (el.dataset.max) counter(el);
        if (el.getAttribute("aria-invalid") === "true" && v) el.removeAttribute("aria-invalid");
        fire(el.dataset.f, el);
      }
    });
    root.addEventListener("change", (e) => {
      const el = e.target;
      if (!mine(el)) return;
      if (el.matches("select[data-month]")) {
        const path = el.dataset.month;
        const sels = $$(`select[data-month="${CSS.escape(path)}"]`, root);
        const m = sels.find((s) => s.dataset.part === "m").value, y = sels.find((s) => s.dataset.part === "y").value;
        set(item, path, m === "" || y === "" ? "" : `${MON[+m]} ${y}`);
        fire(path, el);
      } else if (el.matches("select[data-f]")) { set(item, el.dataset.f, el.value); fire(el.dataset.f, el); }
    });
    root.addEventListener("click", (e) => {
      const t = e.target.closest(".st-toggle[data-f]");
      if (t && root.contains(t) && mine(t)) {
        const on = t.getAttribute("aria-checked") !== "true";
        t.setAttribute("aria-checked", String(on));
        set(item, t.dataset.f, on);
        Y.sound(on ? "chip-on" : "chip-off", { el: t });
        fire(t.dataset.f, t);
        return;
      }
      const o = e.target.closest(".st-opt[data-f]");
      if (o && root.contains(o) && mine(o)) {
        const grp = o.closest("[role=radiogroup]");
        $$(".st-opt", grp).forEach((b) => { const on = b === o; b.classList.toggle("is-selected", on); b.setAttribute("aria-checked", String(on)); b.tabIndex = on ? 0 : -1; });
        set(item, o.dataset.f, o.dataset.v);
        Y.sound("chip-on", { el: o });
        fire(o.dataset.f, o);
      }
    });
    // arrow keys move inside radio groups
    root.addEventListener("keydown", (e) => {
      const o = e.target.closest?.(".st-opt[role=radio]");
      if (!o || !/^Arrow(Left|Right|Up|Down)$/.test(e.key)) return;
      e.preventDefault();
      const all = $$(".st-opt", o.closest("[role=radiogroup]"));
      const n = all[(all.indexOf(o) + (/Right|Down/.test(e.key) ? 1 : -1) + all.length) % all.length];
      n.focus(); n.click();
    });
    $$("textarea[data-max]", root).forEach(counter);
  };
  function counter(el) {
    const c = el.ownerDocument.querySelector(`[data-count-for="${el.id}"]`);
    if (!c) return;
    const max = +el.dataset.max, n = el.value.length;
    c.textContent = `${n} / ${max}`;
    c.classList.toggle("is-over", n > max);
  }

  /* ============================================================
     WAVEFORM — seeded peaks (mock) or real ones from a decoded file
     ============================================================ */
  // the kit waveform (Yarn.wave): seeded by the track, so an upload looks the same here as in the player's scrub
  S.peaks = (seed, n = 96) => Y.wave.values(seed, n);
  S.waveSVG = (peaks) => Y.wave.svg(peaks);
  S.paintWave = (el, frac) => {
    el.style.setProperty("--f", frac.toFixed(4));
    el.style.setProperty("--p", `${(frac * 100).toFixed(2)}%`);
  };
  S.decodeAudio = async (file, n = 96) => {
    const AC = window.AudioContext || window.webkitAudioContext;
    const ctx = new AC();
    try {
      const buf = await ctx.decodeAudioData(await file.arrayBuffer());
      const ch = buf.getChannelData(0), step = Math.floor(ch.length / n), peaks = [];
      for (let i = 0; i < n; i++) { let m = 0; for (let j = i * step; j < (i + 1) * step; j += 32) m = Math.max(m, Math.abs(ch[j] || 0)); peaks.push(m); }
      const max = Math.max(...peaks, 0.01);
      return { peaks: peaks.map((p) => Math.max(0.05, p / max)), duration: buf.duration, rate: buf.sampleRate };
    } finally { ctx.close?.(); }
  };
  // mock duration (seconds) for a track with no known length
  const KNOWN_DUR = new Map((window.THOUGHTS?.posts || []).flatMap((p) => p.tracks || []).map((t) => [t.src, t.dur]));
  S.durOf = (t) => {
    const d = t?.dur || KNOWN_DUR.get(t?.url || t?.src);
    if (d) { if (typeof d === "number") return d; const [m, s] = String(d).split(":"); return +m * 60 + +s; }
    return 80 + (Y.hash(t?.url || t?.name || "x") % 190);
  };

  /* ============================================================
     MARKDOWN (marked, like the Thoughts page; tiny fallback offline)
     ============================================================ */
  S.md = (src = "") => {
    const fix = (s) => s.replace(/\(\.\.\/media\//g, "(" + Y.kitURL("../media/"));
    if (window.marked?.parse) return window.marked.parse(fix(src), { gfm: true, breaks: false });
    return src.split(/\n{2,}/).map((b) => {
      if (/^#{2,4} /.test(b)) { const l = b.match(/^#+/)[0].length; return `<h${l}>${esc(b.slice(l + 1))}</h${l}>`; }
      if (/^> /.test(b)) return `<blockquote><p>${esc(b.replace(/^> /gm, ""))}</p></blockquote>`;
      if (/^- /.test(b)) return `<ul>${b.split("\n").map((l) => `<li>${esc(l.slice(2))}</li>`).join("")}</ul>`;
      return `<p>${esc(b).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/`(.+?)`/g, "<code>$1</code>")}</p>`;
    }).join("");
  };
  S.words = (s = "") => (String(s).trim().match(/\S+/g) || []).length;

  /* word diff (LCS) → <del>/<ins> */
  S.diff = (a = "", b = "") => {
    const A = String(a).split(/(\s+)/), B = String(b).split(/(\s+)/);
    if (A.length * B.length > 250000) return `<del>${esc(a)}</del> <ins>${esc(b)}</ins>`;
    const m = A.length, n = B.length, L = Array.from({ length: m + 1 }, () => new Uint16Array(n + 1));
    for (let i = m - 1; i >= 0; i--) for (let j = n - 1; j >= 0; j--) L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    let i = 0, j = 0, out = "";
    while (i < m && j < n) {
      if (A[i] === B[j]) { out += esc(A[i]); i++; j++; }
      else if (L[i + 1][j] >= L[i][j + 1]) { out += /^\s+$/.test(A[i]) ? esc(A[i]) : `<del>${esc(A[i])}</del>`; i++; }
      else { out += /^\s+$/.test(B[j]) ? esc(B[j]) : `<ins>${esc(B[j])}</ins>`; j++; }
    }
    while (i < m) { out += /^\s+$/.test(A[i]) ? esc(A[i]) : `<del>${esc(A[i])}</del>`; i++; }
    while (j < n) { out += /^\s+$/.test(B[j]) ? esc(B[j]) : `<ins>${esc(B[j])}</ins>`; j++; }
    return out.replace(/<\/del>(\s*)<del>/g, "$1").replace(/<\/ins>(\s*)<ins>/g, "$1");
  };

  /* ============================================================
     MEDIA — resolve any src the data uses; the library with usage counts
     ============================================================ */
  const PUBLIC = ["bankresult.png", "beepsearch.png", "fitr-recruiter.mp4", "fitr-redesign.gif", "harrypotter.mp4", "musicpagecomp.mp4", "portal-coach.gif", "portal-student.png", "rawsy.png", "site-plan.png", "sona-auri.png", "sona-different.png", "sona.png", "sub-overrides.mp4", "sub-terminal-sexy.mp4", "webcheckers.mp4", "wsg.mp4", "blaqat.svg", "nina.jpg"];
  S.norm = (src) => String(src || "").replace(/^\.\.\/media\//, "/media/");
  S.url = (src) => {
    const s = S.norm(src);
    if (/^blob:|^data:/.test(s)) return s;
    return Y.media(s);
  };
  S.isVideo = (src, kind) => Y.isVideo(S.norm(src), kind);
  S.fileOf = (src) => { const s = S.norm(src); const up = data.uploads.find((u) => u.src === s); return up ? up.file : decodeURIComponent(s.split(/[/?#]/).filter(Boolean).pop() || s); };
  // <img>/<video> markup for a src: poster frame for videos, designed placeholder when missing
  S.mediaEl = (src, { alt = "", poster = 0.6 } = {}) => {
    const u = S.url(src);
    if (!u) return `<span class="ymissing"><i class="ph ${S.isVideo(src) ? "ph-video-camera" : "ph-image"}" aria-hidden="true"></i>${S.isVideo(src) ? "remote video" : "not in this mock"}</span>`;
    if (S.isVideo(src)) return `<video src="${u}#t=${poster}" muted playsinline preload="metadata" aria-hidden="true" tabindex="-1" data-ydur></video>`;
    return `<img src="${u}" alt="${esc(alt)}" loading="lazy" decoding="async" draggable="false">`;
  };
  S.library = () => {
    const files = new Map();
    const add = (key, o) => { if (!files.has(key)) files.set(key, { key, uses: [], ...o }); return files.get(key); };
    const kindOf = (f) => (/\.(mp4|webm|mov|m4v)$/i.test(f) ? "video" : /\.(mp3|wav|m4a|ogg|flac)$/i.test(f) ? "audio" : "image");
    const R = (k) => Y.rng(Y.hash(k));
    for (const f of PUBLIC) {
      if (data.removed.includes(f)) continue;
      const r = R(f), kind = kindOf(f);
      add(f, { file: f, src: `/media/${f}`, kind, size: kind === "video" ? 2e6 + r() * 14e6 : f.endsWith(".gif") ? 1.2e6 + r() * 3e6 : 90e3 + r() * 700e3, dims: kind === "video" ? "1920×1080" : `${1200 + Math.round(r() * 8) * 80}×${700 + Math.round(r() * 6) * 60}`, t: D.NOW - (20 + r() * 400) * D.DAY });
    }
    for (const u of data.uploads) add(u.file, { file: u.file, src: u.src, kind: u.kind, size: u.size, dims: u.dims || "", dur: u.dur, t: u.t, upload: true, poster: u.poster });
    for (const x of D.LIBRARY_EXTRA) if (!data.removed.includes(x.file)) add(x.file, { ...x, src: `/media/${x.file}` });
    const use = (src, sec, item, kindHint) => {
      if (!src) return;
      const s = S.norm(src);
      const key = data.uploads.find((u) => u.src === s)?.file || decodeURIComponent(s.split(/[/?#]/).filter(Boolean).pop());
      const f = files.get(key) || add(key, { file: key, src: s, kind: kindHint || kindOf(key), size: (kindHint === "audio" ? 2e6 : 4e6) + (Y.hash(key) % 3e6), remote: /^https?:/.test(s), t: D.NOW - (60 + (Y.hash(key) % 900)) * D.DAY });
      if (!f.uses.some((u) => u.section === sec && u.id === item.id)) f.uses.push({ section: sec, id: item.id, title: S.titleOf(item) });
    };
    for (const p of data.projects) (p.images || []).forEach((m) => use(m.src, "projects", p));
    for (const m of data.music) {
      if (m.url) use(m.url, "music", m, "audio");
      (m.songs || []).forEach((s) => s.url && use(s.url, "music", m, "audio"));
    }
    for (const t of data.thoughts) {
      (t.media || []).forEach((m) => use(m.src, "thoughts", t));
      if (t.cover) use(t.cover, "thoughts", t);
      (t.tracks || []).forEach((tr) => tr.src && use(tr.src, "thoughts", t, "audio"));
    }
    for (const x of D.LIBRARY_EXTRA) (x.usedBy || []).forEach(([sec, id]) => { const it = S.find(sec, id); if (it && files.has(x.file)) files.get(x.file).uses.push({ section: sec, id, title: S.titleOf(it) }); });
    return [...files.values()].filter((f) => !data.removed.includes(f.key)).sort((a, b) => b.t - a.t);
  };
  // a fake upload (file picker or "use a sample"): returns the entry + a progress driver
  S.addUpload = ({ file, src, kind, size, dims = "", dur = 0, poster = 0 }) => {
    const u = { file, src, kind, size, dims, dur, poster, t: S.now() };
    data.uploads.unshift(u);
    S.persist();
    return u;
  };
  // generate a poster frame for a real (blob) video: seek, draw, return a data URL
  S.posterFrom = (src, at = 0.5) => new Promise((res) => {
    const v = document.createElement("video");
    v.muted = true; v.playsInline = true; v.preload = "auto"; v.src = src;
    const fail = setTimeout(() => res(null), 4000);
    v.addEventListener("loadedmetadata", () => { v.currentTime = Math.min(at, Math.max(0, (v.duration || 1) - 0.1)); }, { once: true });
    v.addEventListener("seeked", () => {
      try { const c = document.createElement("canvas"); c.width = 480; c.height = Math.round(480 * (v.videoHeight / v.videoWidth || 0.625)); c.getContext("2d").drawImage(v, 0, 0, c.width, c.height); clearTimeout(fail); res({ poster: c.toDataURL("image/jpeg", 0.8), dur: v.duration, dims: `${v.videoWidth}×${v.videoHeight}` }); }
      catch (_) { clearTimeout(fail); res(null); }
    }, { once: true });
  });
  // fake network progress: calls step(0..1), then done()
  S.progress = (ms, step, done) => {
    if (Y.reduced()) { step(1); done?.(); return () => {}; }
    const t0 = performance.now();
    let raf = 0;
    const tick = (t) => { const f = Math.min(1, (t - t0) / ms); step(1 - Math.pow(1 - f, 1.6)); if (f < 1) raf = requestAnimationFrame(tick); else done?.(); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  };

  /* ============================================================
     PUBLISH FLOW
     checks: [{ ok: true|false|"warn", title, text, fix?: () => void }]
     smart = straight to live when everything passes; always = the checklist sheet every time
     ============================================================ */
  S.publish = ({ section, item, btn, checks = [], label = "", onDone } = {}) => {
    const bad = checks.filter((c) => c.ok === false), warn = checks.filter((c) => c.ok === "warn");
    if (bad.length) {
      Y.sound("nope", { el: btn });
      btn?.classList.remove("is-shake"); void btn?.offsetWidth; btn?.classList.add("is-shake");
      S.say(`Can't publish yet: ${bad.map((b) => b.title).join(", ")}`);
      bad[0].fix?.();
      if (!bad[0].fix) S.checkSheet({ section, item, btn, checks, onDone });
      else S.toast({ icon: "ph-warning-circle", tone: "error", title: `Can't publish yet`, text: bad.map((b) => b.title).join(" · "), duration: 4200 });
      return;
    }
    if (S.opt.confirm === "always" || warn.length) return S.checkSheet({ section, item, btn, checks, onDone });
    go({ section, item, btn, label, onDone });
  };
  S.checkSheet = ({ section, item, btn, checks, onDone }) => {
    const bad = checks.some((c) => c.ok === false);
    const icon = (c) => (c.ok === true ? "ph-check-circle" : c.ok === "warn" ? "ph-push-pin" : "ph-x-circle");
    const sh = S.sheet({
      from: btn, title: bad ? "Not quite ready" : "Ready to go live?", width: 520,
      html: `<p class="st-note">${bad ? "Fix the red ones and Publish again." : `This replaces what visitors see on <b>${S.SECTIONS[section]?.label || "the site"}</b>. No redeploy: it's live in a few seconds.`}</p>
        <ul class="st-checks">${checks.map((c, i) => `<li class="st-check" data-ok="${c.ok}"><i class="ph-bold ${icon(c)}" aria-hidden="true"></i><div><b>${c.title}</b>${c.text ? `<span>${c.text}</span>` : ""}${c.fix && c.ok !== true ? `<button type="button" class="ylinkbtn" data-fix="${i}">${c.fixLabel || "Fix it"}</button>` : ""}</div></li>`).join("")}</ul>`,
      foot: `<button type="button" class="btn btn--ghost" data-close>Not yet</button><span class="ydetail__spacer"></span><button type="button" class="btn btn--red" data-go${bad ? " disabled" : " autofocus"}><i class="ph-bold ph-paper-plane-tilt" aria-hidden="true"></i>${bad ? "Publish" : checks.some((c) => c.ok === "warn") ? "Publish anyway" : "Publish now"}</button>`,
      onMount: (s) => {
        s.el.addEventListener("click", (e) => {
          const f = e.target.closest("[data-fix]"); if (f) { s.close(); checks[+f.dataset.fix].fix(); return; }
          if (e.target.closest("[data-go]")) { s.close({ silent: true }); go({ section, item, btn, onDone }); }
        });
      },
    });
    return sh;
  };
  function go({ section, item, btn, onDone }) {
    const fail = S.opt.pstate === "error" || S.opt.offline;
    const lab = btn ? $("span", btn) : null, old = lab?.textContent;
    if (btn) { btn.classList.add("ysel", "is-publishing"); btn.setAttribute("aria-busy", "true"); if (lab) lab.textContent = "Publishing…"; }
    S.say("Publishing…");
    setTimeout(() => {
      if (btn) { btn.classList.remove("is-publishing"); btn.removeAttribute("aria-busy"); if (lab) lab.textContent = old; }
      if (fail) {
        Y.sound("nope", { el: btn });
        btn?.classList.remove("is-shake"); void btn?.offsetWidth; btn?.classList.add("is-shake");
        S.toast({ icon: "ph-cloud-slash", tone: "error", title: "Couldn't reach blaqat.net", text: "Nothing changed on the site. Your draft is safe on this device.", duration: 0, actions: [{ label: "Retry", cls: "btn--ghost", onClick: () => { S.opt.pstate = "ok"; S.opt.offline = false; go({ section, item, btn, onDone }); } }, { label: "OK", cls: "btn--ghost" }] });
        return;
      }
      const was = item._pub;
      item._pub = "live"; item._published = S.now(); item._edited = S.now();
      if (section && item.id != null) S.revisions(section, item).unshift({ id: `r${Date.now()}`, t: S.now(), who: "you", kind: "publish", summary: "Published", changes: [] });
      S.log(was === "draft" ? "Published" : "Published edits to", section, item, "ph-broadcast", { live: true });
      S.persist();
      Y.sound("post", { el: btn });
      S.emit("pub", item);
      onDone?.();
      const url = S.publicURL(section, item);
      const tt = S.toast({ id: "pub", icon: "ph-paper-plane-tilt", title: "Published", text: "Going live on blaqat.net · no redeploy", progress: Y.reduced() ? 1 : 3200, duration: 0 });
      setTimeout(() => {
        tt.close();
        S.toast({
          id: "pub", icon: "ph-broadcast", title: "Live now", text: `${url.replace(/^https?:\/\//, "")}`, duration: 7000,
          actions: [
            { label: '<i class="ph-bold ph-link" aria-hidden="true"></i>Copy', onClick: async () => { try { await navigator.clipboard.writeText(url); } catch (_) {} Y.sound("copy"); S.say("Link copied"); } },
            { label: 'View<i class="ph-bold ph-arrow-up-right" aria-hidden="true"></i>', cls: "btn--red", onClick: () => window.open(S.publicHref(section, item), "_blank", "noopener") },
          ],
        });
        S.say("Live now");
      }, Y.reduced() ? 600 : 3300);
    }, Y.reduced() ? 300 : 1350);
  }
  S.publicURL = (section, item) => {
    const sl = Y.slug(S.titleOf(item));
    if (section === "projects") return `https://blaqat.net/projects/${sl}`;
    if (section === "music") return `https://blaqat.net/music/${sl}`;
    if (section === "thoughts") return item.type === "tierlist" ? `https://blaqat.net/thoughts/tier/${sl}` : `https://blaqat.net/thoughts/${item.id}`;
    return "https://blaqat.net";
  };
  // the mock's public pages (other agents own them)
  S.publicHref = (section, item) => ({ projects: "../projects/index.html", music: "../music/index.html", thoughts: item?.type === "tierlist" ? "../thoughts/tierlist.html" : "../thoughts/stitched.html", home: "../home/index.html?skip" })[section] || "../home/index.html?skip";

  /* ============================================================
     SMALL RENDER HELPERS
     ============================================================ */
  S.dot = (section, icon, { cls = "" } = {}) => `<span class="ydot ${cls}" data-section="${section === "media" ? "studio" : section}" aria-hidden="true"><i class="ph-bold ${icon || S.SECTIONS[section]?.icon || "ph-circle"}"></i></span>`;
  S.secIcon = (section, item) => (section === "thoughts" && item?.type ? S.TTYPES[item.type]?.icon : S.SECTIONS[section]?.icon);
  S.editHref = (section, item) => {
    if (section === "projects") return S.href("project", { id: item.id });
    if (section === "music") return S.href("music", { id: item.id });
    if (section === "thoughts") return S.href("compose", { type: item.type, id: item.id });
    if (section === "home") return S.href("home");
    return S.href("media");
  };
  S.thumb = (section, item) => {
    if (section === "music") return S.swatch(item, { size: 56 });
    if (section === "thoughts") return `<span class="st-thumb st-thumb--ic${item.type === "scratch" ? " is-scratch" : ""}" aria-hidden="true"><i class="ph-bold ${S.TTYPES[item.type]?.icon || "ph-note"}"></i></span>`;
    const imgs = item.images || [];
    const c = imgs[item._cover || 0] || imgs[0];
    if (c && S.url(c.src)) return `<span class="st-thumb" aria-hidden="true">${S.mediaEl(c.src, { poster: c.poster || 0.6 })}</span>`;
    const ini = S.titleOf(item).replace(/[^A-Za-z0-9 ]/g, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
    return `<span class="st-thumb st-thumb--text" aria-hidden="true">${esc(ini || "·")}</span>`;
  };
  // swatches seed from url|name like the public music page (never from the Studio's own id)
  S.swatch = (item, o = {}) => Y.swatchHTML({ instrument: item.instrument, url: item.url || undefined, name: item.name }, { motif: item._motif || undefined, ...o });
  S.allSongs = () => data.music.flatMap((m) => (m.songs ? m.songs.map((s) => ({ ...s, instrument: s.instrument || m.instrument, coll: m.name, collId: m.id })) : [{ ...m }])).filter((s) => s.url);
})();
