/* ============================================================
   music · iteration 2 (owner: music agent)
   One list: singles and collections mixed, newest first, year pills.
   Collections are folders: track tabs peek out above the card (count at
   a glance), the playing track's tab stands up, hover shows its name,
   click plays it. Single = round play; collection = "Play all".

   Open an item (⚙ "Open an item", ?open=; default = dock on desktop, inplace on phones):
     dock     a panel docked right; the list zooms so its layout never changes
     inplace  a sheet grows out of the card over its neighbours; nothing below moves
     page     its own page: item.html?id=<key> (kit detail shell)
   Other params: ?item=<key> opens one on load · ?burst=subtle|off notes on play
   Filters (kit): ?instrument= ?status= ?kind= ?year= ?on= ?q=
   Uses the player API (window.YarnPlayer) for play state + library.
   ============================================================ */
(() => {
  "use strict";
  const Y = window.Yarn, P = window.YarnPlayer;
  if (!Y || !P) return;
  const params = Y.params;
  const PAGE = document.body.dataset.page === "item" ? "item" : "library";
  const OPEN = ["inplace", "dock", "page"].includes(params.get("open")) ? params.get("open") : null;
  const BURST = params.get("burst") === "off" ? "off" : "subtle";
  const reduced = () => Y.reduced();
  const { esc, sound } = Y;
  const fmt = P.meta.fmt;
  const compactMQ = matchMedia("(max-width: 959px)");
  // no ?open: dock on desktop; in place on phones (a full-screen cover would be a modal by another name)
  const modeNow = () => OPEN || (compactMQ.matches ? "inplace" : "dock");
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (t) => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };
  const bottomUI = () => Y.px("--bottom-ui");

  Y.mockPanel([
    { label: "Open an item", param: "open", options: [["", "Auto: dock · in place on phones"], ["dock", "Dock right"], ["inplace", "In place"], ["page", "Own page"]], default: "" },
    { label: "Notes on play", param: "burst", options: [["subtle", "Subtle"], ["off", "Off"]], default: "subtle" },
    { label: "Player view", param: "player", options: [["", "Saved"], ["disc", "Disc"], ["bar", "Bar"], ["panel", "Panel"]], default: "" },
    { label: "Disc label", param: "disc", options: [["swatch", "Yarn swatch"], ["cat", "Red cat"]], default: "swatch" },
    { label: "Demo playing", param: "demo", options: [["", "Off"], ["1", "On"]], default: "" },
  ], { title: "Music options" });

  /* ---------------- data (the player's library: same ids, same tracks) ---------------- */
  const LIB = P.library;
  const ITEMS = LIB.entries.map((e) => {
    const coll = e.kind === "collection";
    const tracks = coll ? e.tracks : [e];
    const d = Y.parseDate(e.start);
    return {
      key: e.key, kind: coll ? "collection" : "single", name: e.name, instrument: e.instrument, status: e.status, start: e.start, end: e.end,
      description: e.description || "", src: e.src, entry: e, tracks, playable: tracks.filter((t) => t.url),
      on: [...new Set(tracks.flatMap((t) => Object.keys(t.links || {})))], artist: e.artist || null,
      year: d ? d.getFullYear() : 0, t: d ? +d : 0,
    };
  }).sort((a, b) => b.t - a.t || a.name.localeCompare(b.name));
  const BY_KEY = Object.fromEntries(ITEMS.map((i) => [i.key, i]));
  const plain = (s) => String(s || "").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/\*\*|__|^#+\s*/gm, "").replace(/\s+/g, " ").trim();
  const sw = (t, size, radius) => Y.swatchHTML({ instrument: t.instrument, url: t.url || undefined, name: t.name }, { size, radius });
  const isCurrent = (it) => { const t = P.state.track; return !!t && (it.kind === "collection" ? t.collectionId === it.entry.id : t === it.entry); };
  const shareURL = (it) => `https://blaqat.net/music?item=${encodeURIComponent(it.key)}`;
  const ph = (n, w = "bold") => `<i class="ph-${w} ph-${n}" aria-hidden="true"></i>`;

  /* ---------------- bits ---------------- */
  function playBtn(it, { detail = false } = {}) {
    const on = isCurrent(it) && P.state.playing;
    if (it.kind === "collection" || detail) {
      const label = it.kind === "collection" ? "Play all" : "Play";
      return `<button type="button" class="btn btn--red ${detail ? "" : "btn--sm"} mu-play" data-play="${esc(it.key)}" aria-label="${on ? "Pause" : label} ${esc(it.name)}">${ph(on ? "pause" : "play", "fill")}<span>${on ? "Pause" : label}</span></button>`;
    }
    return `<button type="button" class="btn btn--red btn--icon mu-play" data-play="${esc(it.key)}" aria-label="${on ? "Pause" : "Play"} ${esc(it.name)}">${ph(on ? "pause" : "play", "fill")}</button>`;
  }
  const copyBtn = (it) => `<span class="mu-copy-t"><button type="button" class="ylinkicon" data-copy="${esc(it.key)}" aria-label="Copy a link to ${esc(it.name)}${it.kind === "collection" ? " (playlist)" : ""}" title="Copy link">${ph("link")}</button><span class="mu-copied" hidden>Copied</span></span>`;

  // the library card: the kit's music folder (Yarn.folder). Tabs = the player's tracks (same ids), so clicks play them.
  function cardHTML(it) {
    const coll = it.kind === "collection";
    return `<li class="mu-item" data-key="${esc(it.key)}" data-kind="${it.kind}" data-year="${it.year}">
      ${Y.folder(it.src, {
        tracks: coll ? it.tracks : [],
        current: P.state.track?.id ?? null,
        links: coll ? copyBtn(it) : P.linksHTML(it.entry),
        action: playBtn(it),
        open: { attrs: `data-open="${esc(it.key)}" aria-expanded="false" aria-controls="mu-detail"` },
        meta: Y.meta(it.src),
      })}
    </li>`;
  }

  function trackRow(it, t) {
    const n = String(t.index || 1).padStart(2, "0");
    const sub = !t.url ? "No audio here, listen on the links" : t.artist ? `with ${[].concat(t.artist).join(", ")}` : it.kind === "collection" && t.description ? plain(t.description) : "";
    const now = P.state.track === t;
    return `<li><div class="yrow ylift ysel mu-trk${t.url ? "" : " is-off"}${now && P.state.playing ? " is-playing" : ""}" data-tid="${esc(t.id)}" aria-current="${now}">
      ${t.url ? `<button type="button" class="mu-trk__btn" data-play-track="${esc(t.id)}" aria-label="${now && P.state.playing ? "Pause" : "Play"} ${esc(t.name)}"></button>` : ""}
      <span class="mu-trk__n" aria-hidden="true"><span>${n}</span><i class="ph-fill ph-play"></i>${Y.EQ}</span>
      ${sw(t, 40, 10)}
      <span class="mu-trk__t"><b>${esc(it.kind === "collection" ? t.name.replace(/^0*(\d+)\s*-\s*/, (m, d) => (+d === t.index ? "" : m)) : t.name)}</b>${sub ? `<small>${esc(sub)}</small>` : ""}</span>
      <span class="mu-trk__links">${it.kind === "collection" ? P.linksHTML(t).replace(/class="ylinkicon"/g, 'class="ylinkicon ylinkicon--sm"') : ""}</span>
      <span class="mu-trk__d meta">${t.url ? fmt(P.durationOf(t)) : ""}</span>
    </div></li>`;
  }

  // the kit detail shell: title → metadata → media (the tracks) → text → links
  function detailHTML(it, ctx) {
    const coll = it.kind === "collection";
    const close = ctx === "page" ? "" : `<button type="button" class="ylinkicon" data-close aria-label="Close ${esc(it.name)}" title="Close">${ph("x")}</button>`;
    const back = ctx === "page" ? { href: "index.html" + (params.get("back") ? "?" + params.get("back") : ""), label: "Music" } : null;
    const meta = Y.meta(it.src) + `<span class="meta mu-dmeta">${coll ? `${it.tracks.length} tracks` : "Single"}${it.artist ? ` · with ${esc([].concat(it.artist).join(", "))}` : ""}</span>`;
    const media = `<section class="mu-trks-wrap" aria-label="${coll ? "Tracks" : "Track"}"><h3 class="eyebrow mu-trks-h">${coll ? "Tracks" : "Track"} <span class="meta">${it.tracks.length}</span></h3><ol class="mu-trks">${it.tracks.map((t) => trackRow(it, t)).join("")}</ol></section>`;
    const body = it.description ? P.meta.md(it.description) : `<p class="muted">No liner notes for this one.</p>`;
    const links = `${it.playable.length ? playBtn(it, { detail: true }) : ""}${coll ? "" : P.linksHTML(it.entry)}${copyBtn(it)}<span class="ydetail__spacer"></span>`;
    return Y.detail({ back, actions: close, title: it.name, meta, media, body, links, level: ctx === "page" ? 1 : 2, id: `mud-${it.key}` });
  }

  /* ---------------- play ---------------- */
  function burst(el) { if (BURST !== "off" && !reduced()) window.Notes?.burst?.(el, "music", { intensity: "subtle" }); }
  function visibleQueueFrom(it) { // a single plays on through the list as you see it
    const vis = ITEMS.filter((x) => F ? F.test(x) : true);
    const i = vis.indexOf(it);
    return (i < 0 ? [it] : vis.slice(i)).flatMap((x) => x.playable);
  }
  function playItem(it, btn) {
    const s = P.state;
    if (isCurrent(it)) { P.toggle(); sound(s.playing ? "pause" : "play", { el: btn }); if (!s.playing) burst(btn); return; }
    const q = it.kind === "collection" ? it.playable : visibleQueueFrom(it);
    if (!q.length) return;
    P.play(q[0], q);
    sound("play", { el: btn });
    burst(btn);
  }
  function playTrack(it, t, el) {
    if (!t?.url) return;
    if (P.state.track === t) { const was = P.state.playing; P.toggle(); sound(was ? "pause" : "play", { el }); return; }
    P.play(t, it.kind === "collection" ? it.playable : visibleQueueFrom(it));
    sound("play", { el });
    burst(el);
  }
  // keep cards / tabs / rows in step with the player
  function sync() {
    const s = P.state, t = s.track;
    for (const el of $$(".mu-item")) {
      const it = BY_KEY[el.dataset.key]; if (!it) continue;
      const cur = isCurrent(it), on = cur && s.playing;
      el.classList.toggle("is-current", cur); el.classList.toggle("is-playing", on);
      const b = $(".mu-play", el);
      if (b && b.dataset.on !== String(on)) { b.dataset.on = String(on); b.outerHTML = playBtn(it).replace("<button ", `<button data-on="${on}" `); }
      for (const tab of $$(".yfolder__tab", el)) {
        const now = !!t && tab.dataset.tid === t.id;
        tab.classList.toggle("is-now", now);
        now ? tab.setAttribute("aria-current", "true") : tab.removeAttribute("aria-current");
      }
    }
    for (const row of $$(".mu-trk")) {
      const now = !!t && row.dataset.tid === t.id;
      row.setAttribute("aria-current", String(now));
      row.classList.toggle("is-playing", now && s.playing);
      const b = $(".mu-trk__btn", row); if (b) b.setAttribute("aria-label", `${now && s.playing ? "Pause" : "Play"} ${$("b", row).textContent}`);
    }
    for (const b of $$(".ydetail .mu-play")) {
      const it = BY_KEY[b.dataset.play], on = isCurrent(it) && s.playing;
      if (b.dataset.on !== String(on)) { b.dataset.on = String(on); b.outerHTML = playBtn(it, { detail: true }).replace("<button ", `<button data-on="${on}" `); }
    }
  }
  P.on((_, kind) => { if (kind === "track" || kind === "state") sync(); });

  async function copyLink(it, btn) {
    const ok = await P.copyText(shareURL(it));
    const tip = btn.parentElement.querySelector(".mu-copied");
    btn.innerHTML = ph(ok ? "check" : "link");
    if (tip) { tip.hidden = false; tip.textContent = ok ? "Copied" : "Couldn't copy"; }
    if (ok) sound("copy", { el: btn });
    clearTimeout(btn._t);
    btn._t = setTimeout(() => { btn.innerHTML = ph("link"); if (tip) tip.hidden = true; }, 1600);
  }

  /* ---------------- render ---------------- */
  const root = $("#mu");
  let F = null, rail = null;

  if (PAGE === "item") {
    const it = BY_KEY[params.get("id")] || BY_KEY[params.get("item")];
    root.innerHTML = it ? Y.detailPage(detailHTML(it, "page"))
      : `${Y.header({ title: "Pick a piece" })}<div class="mu-none ycard"><p class="h3">${params.get("id") || params.get("item") ? "That piece isn't here." : "This page shows one piece of music."}</p>
         <p class="muted">Open one from the library, or try <a href="item.html?id=${esc(ITEMS[0].key)}">${esc(ITEMS[0].name)}</a>.</p>
         <a class="btn btn--ink" href="index.html"><i class="ph-bold ph-arrow-left" aria-hidden="true"></i>All music</a></div>`;
    if (it) document.title = `${it.name} · Music · blaqat.net`;
  } else {
    root.innerHTML = `
      ${Y.header({ title: "Music", meta: `${ITEMS.length} releases · ${LIB.tracks.length} tracks`, actions: `<button class="btn btn--sm btn--m-icon" type="button" data-shuffle aria-label="Shuffle everything">${ph("shuffle")}<span>Shuffle all</span></button>` })}
      <div class="ytools"><div id="mu-search"></div><div id="mu-filter"></div></div>
      <div class="mu-body" data-open="${modeNow()}">
        <nav class="mu-rail" id="mu-rail"></nav>
        <div class="mu-listwrap"><div class="mu-list" id="mu-list"></div><p class="mu-empty" hidden>Nothing matches those filters. <button type="button" class="ylinkbtn" data-reset>Show all</button></p></div>
        <aside class="mu-dock" id="mu-dock" aria-label="Opened item" hidden><div class="mu-dock__in" id="mu-detail-dock"></div></aside>
      </div>`;
    const years = [...new Set(ITEMS.map((i) => String(i.year)))];
    F = Y.filters({
      groups: [
        { key: "instrument", label: "Instrument", row: true, values: ["piano", "beepbox", "daw"] },
        { key: "status", label: "Status", row: true, values: ["complete", "ongoing", "dropped"] },
        { key: "kind", label: "Kind", values: [{ value: "single", label: "Single", icon: "ph-music-note" }, { value: "collection", label: "Collection", icon: "ph-folders" }] },
        { key: "year", label: "Year", values: years },
        { key: "on", label: "Listen on", values: [{ value: "soundcloud", label: "SoundCloud", icon: "ph-soundcloud-logo" }, { value: "youtube", label: "YouTube", icon: "ph-youtube-logo" }, { value: "beepbox", label: "BeepBox", icon: "ph-circle" }] },
      ],
      items: ITEMS,
      get: { kind: (it) => it.kind, year: (it) => String(it.year), on: (it) => it.on },
      text: (it) => [it.name, it.description, it.kind, Y.instrument(it.instrument)?.label, ...it.tracks.map((t) => t.name), ...[].concat(it.artist || [])].filter(Boolean).join(" "),
      url: true,
    });
    Y.filterRow($("#mu-filter"), F, { browse: true });
    Y.search($("#mu-search"), F, { placeholder: "Search music, tracks, collections…" });

    const list = $("#mu-list");
    // phones: the kit's one mobile pattern (?msearch=bar|fab): top search + sticky filter row, or the search FAB
    Y.listTools(F, { tools: $(".ytools", root), search: $("#mu-search"), row: $("#mu-filter"), sticky: list,
      label: "Search and filter music", title: "Find music", count: () => `${ITEMS.filter((x) => F.test(x)).length} of ${ITEMS.length} shown` });
    // one continuous flow, newest first. Desktop: the kit year rail beside it (no row break per year, so a year
    // with one release leaves no hole). Phone: one column; the kit's sticky year pill heads each year.
    list.innerHTML = Y.byYear(ITEMS, (it) => it.start).map((g) =>
      `<section class="mu-year" data-y="${g.year}" aria-labelledby="mu-y${g.year}">
        ${Y.yearPill(g.year, { id: `mu-y${g.year}`, count: g.items.length, unit: "release", cls: "mu-yr", attrs: `data-key="y-${g.year}"` })}
        <ul class="mu-grid">${g.items.map(cardHTML).join("")}</ul></section>`).join("");
    rail = Y.yearRail($("#mu-rail"), list, { item: ".mu-item[data-year]", label: "Jump to a year" });
    const empty = $(".mu-empty");
    const applyFilter = () => {
      for (const el of $$(".mu-item", list)) el.hidden = !F.test(BY_KEY[el.dataset.key]);
      for (const sec of $$(".mu-year", list)) {
        const n = $$(".mu-item:not([hidden])", sec).length;
        sec.hidden = !n;
        const c = $(".yyear__n", sec); if (c) c.textContent = `${n} release${n === 1 ? "" : "s"}`;
      }
      empty.hidden = !!$(".mu-item:not([hidden])", list);
      rail?.refresh();
    };
    applyFilter();
    F.on(() => { if (pop.it) closeInplace({ instant: true }); Y.flip(list, "[data-key]", applyFilter); });
    $("[data-reset]").addEventListener("click", () => F.clear());
  }

  /* ---------------- open: in place ---------------- */
  const pop = { el: null, it: null, sp: null, from: null };
  function cardOf(it) { return $(`.mu-item[data-key="${CSS.escape(it.key)}"] .yfolder__card`); }
  function markOpen(it, on) {
    const card = it && cardOf(it); if (!card) return;
    card.classList.toggle("is-selected", on);
    card.closest(".mu-item").classList.toggle("is-open", on);
    $(".yfolder__open", card)?.setAttribute("aria-expanded", String(on));
  }
  function openInplace(it, { focus = true } = {}) {
    if (pop.it === it) return closeInplace();
    if (pop.el) closeInplace({ instant: true });
    const card = cardOf(it), list = $("#mu-list");
    if (!card) return;
    const lr = list.getBoundingClientRect(), cr = card.getBoundingClientRect();
    const x = cr.left - lr.left, y = cr.top - lr.top;
    const gap = parseFloat(getComputedStyle(list).columnGap) || parseFloat(getComputedStyle($(".mu-grid", list)).columnGap) || 22;
    const tw = compactMQ.matches ? lr.width : Math.min(lr.width, Math.max(cr.width * 2 + gap, 600));
    let left = x; if (left + tw > lr.width) left = Math.max(0, x + cr.width - tw);
    const el = document.createElement("div");
    el.className = "mu-pop";
    el.innerHTML = `<div class="mu-pop__sheet ysel" id="mu-detail" role="region" aria-label="${esc(it.name)}"><div class="mu-pop__scroll">${detailHTML(it, "inplace")}</div></div>`;
    Object.assign(el.style, { left: left + "px", top: y + "px", width: tw + "px", height: "10px" });
    list.appendChild(el);
    const scroll = $(".mu-pop__scroll", el);
    const th = Math.max(cr.height, Math.min(scroll.scrollHeight, innerHeight - 120 - bottomUI()));
    el.style.height = th + "px";
    pop.el = el; pop.it = it;
    pop.from = { t: 0, r: tw - (x - left + cr.width), b: Math.max(0, th - cr.height), l: x - left };
    const sheet = $(".mu-pop__sheet", el);
    const paint = (p) => {
      const f = pop.from, q = (n) => (n * (1 - p)).toFixed(2);
      sheet.style.clipPath = `inset(${q(f.t)}px ${q(f.r)}px ${q(f.b)}px ${q(f.l)}px round ${lerp(16, 18, p).toFixed(1)}px)`;
      scroll.style.opacity = String(smooth((p - 0.2) / 0.6));
    };
    pop.sp = new Y.Spring(0, { rest: 0.002, response: 0.42, onUpdate: paint });
    paint(0);
    list.classList.add("is-dim");
    markOpen(it, true);
    // scroll once, so the sheet ends where it settles
    const topPage = lr.top + scrollY + y, botPage = topPage + th, viewBot = scrollY + innerHeight - bottomUI() - 16;
    let to = scrollY;
    if (botPage > viewBot) to = Math.min(topPage - 90, scrollY + (botPage - viewBot));
    if (topPage < scrollY + 70) to = topPage - 90;
    if (Math.abs(to - scrollY) > 2) scrollTo({ top: to, behavior: reduced() ? "auto" : "smooth" });
    pop.sp.to(1, { onRest: () => sheet.classList.add("is-selected") });
    sound("open", { el: card });
    if (focus) requestAnimationFrame(() => $("[data-close]", el)?.focus({ preventScroll: true }));
  }
  function closeInplace({ instant = false } = {}) {
    const { el, it } = pop; if (!el) return;
    const card = cardOf(it), list = $("#mu-list");
    pop.el = pop.it = null;
    list.classList.remove("is-dim");
    markOpen(it, false);
    const done = () => el.remove();
    if (instant || reduced() || !card) { done(); return; }
    const sheet = $(".mu-pop__sheet", el); sheet.classList.remove("is-selected");
    const er = el.getBoundingClientRect(), cr = card.getBoundingClientRect();
    pop.from = { t: Math.max(0, cr.top - er.top), r: Math.max(0, er.right - cr.right), b: Math.max(0, er.bottom - cr.bottom), l: Math.max(0, cr.left - er.left) };
    const sp = new Y.Spring(1, { rest: 0.002, response: 0.36, onUpdate: (p) => {
      const f = pop.from.el === el ? pop.from : { ...pop.from };
      const q = (n) => (n * (1 - p)).toFixed(2);
      sheet.style.clipPath = `inset(${q(f.t)}px ${q(f.r)}px ${q(f.b)}px ${q(f.l)}px round 16px)`;
      $(".mu-pop__scroll", el).style.opacity = String(smooth((p - 0.4) / 0.6));
    } });
    sp.to(0, { onRest: done });
    sound("close", { el: card });
    $(".yfolder__open", card)?.focus({ preventScroll: true });
  }

  /* ---------------- open: docked right ---------------- */
  const dock = { it: null, sp: null, p: 0, anchor: null };
  const DOCK_W = () => Math.round(Math.min(460, Math.max(380, innerWidth * 0.32)));
  const DOCK_GAP = 24;
  function dockPaint(p) {
    dock.p = p;
    const d = $("#mu-dock"), inner = $("#mu-detail-dock"), body = $(".mu-body"), list = $("#mu-list"), wrap = $(".mu-listwrap");
    if (compactMQ.matches) {
      d.style.transform = `translate3d(${((1 - p) * 104).toFixed(2)}%,0,0)`;
      d.style.opacity = String(smooth(p * 3));
      list.style.zoom = ""; list.style.width = ""; wrap.style.width = ""; wrap.style.flex = "";
      return;
    }
    d.style.transform = ""; d.style.opacity = "";
    // the list's own width (the body minus the year rail beside it), so the zoomed list keeps its exact layout
    const rail = $("#mu-rail"), rs = rail && rail.offsetWidth ? getComputedStyle(rail) : null;
    const W0 = dock.tf ? dock.W0 : body.clientWidth - (rs ? rail.offsetWidth + parseFloat(rs.marginLeft) + parseFloat(rs.marginRight) : 0), D = DOCK_W();
    const s = (W0 - (D + DOCK_GAP) * p) / W0;
    // i3: while the spring runs the list scales with a transform (compositor only; a negative margin keeps the page
    // height the zoomed list will have); CSS zoom, which re-lays out every card, is set once when it comes to rest.
    // (i2 changed zoom on every frame: ~200ms of layout + ~780ms of paint per open, 17 slow frames.)
    const moving = !!dock.sp?.moving;
    if (p > 0.0005 && moving) {
      if (!dock.tf) { dock.tf = true; dock.W0 = W0; list.style.zoom = ""; list.style.width = W0 + "px"; list.style.transformOrigin = "0 0"; dock.H = list.offsetHeight; }
      list.style.transform = `scale(${s.toFixed(4)})`;
      list.style.marginBottom = `${(-dock.H * (1 - s)).toFixed(1)}px`;
      wrap.style.flex = "none"; wrap.style.width = (W0 * s).toFixed(2) + "px";
    } else if (p > 0.0005) {
      dock.tf = false; list.style.transform = ""; list.style.marginBottom = ""; list.style.transformOrigin = "";
      list.style.width = W0 + "px"; list.style.zoom = s.toFixed(4);
      wrap.style.flex = "none"; wrap.style.width = (W0 * s).toFixed(2) + "px";
    } else { dock.tf = false; list.style.transform = ""; list.style.marginBottom = ""; list.style.transformOrigin = ""; list.style.zoom = ""; list.style.width = ""; wrap.style.width = ""; wrap.style.flex = ""; }
    d.style.width = (D * p).toFixed(2) + "px";
    d.style.marginLeft = (DOCK_GAP * p).toFixed(2) + "px";
    inner.style.width = D + "px";
    inner.style.opacity = String(smooth(p * 1.6));
    inner.style.transform = `translate3d(${((1 - p) * 30).toFixed(2)}px,0,0)`;
    // keep what you clicked under your hand while the list zooms
    if (dock.anchor?.isConnected) { const dy = dock.anchor.getBoundingClientRect().top - dock.anchorTop; if (Math.abs(dy) > 0.5) scrollBy(0, dy); }
  }
  function openDock(it, { focus = true } = {}) {
    if (dock.it === it) return closeDock();
    const d = $("#mu-dock"), inner = $("#mu-detail-dock");
    if (dock.it) markOpen(dock.it, false);
    inner.innerHTML = `<div class="mu-dock__scroll" id="mu-detail" role="region" aria-label="${esc(it.name)}">${detailHTML(it, "dock")}</div>`;
    dock.it = it;
    markOpen(it, true);
    const card = cardOf(it);
    dock.anchor = card; dock.anchorTop = card ? card.getBoundingClientRect().top : 0;
    d.hidden = false;
    dock.sp ||= new Y.Spring(0, { rest: 0.001, response: Y.motion?.dock ?? 0.46, onUpdate: dockPaint });
    if (dock.p < 1 || dock.sp.moving) { dockPaint(dock.p); dock.sp.to(1, { onRest: () => { dock.anchor = null; } }); }
    inner.classList.add("ysel");
    sound("open", { el: card || d });
    if (focus) requestAnimationFrame(() => $("[data-close]", inner)?.focus({ preventScroll: true }));
  }
  function closeDock() {
    const it = dock.it; if (!it) return;
    dock.it = null;
    markOpen(it, false);
    const card = cardOf(it);
    dock.anchor = card; dock.anchorTop = card ? card.getBoundingClientRect().top : 0;
    dock.sp.to(0, { onRest: () => { $("#mu-dock").hidden = true; dockPaint(0); dock.anchor = null; } });
    sound("close", { el: card || $("#mu-dock") });
    card && $(".yfolder__open", card)?.focus({ preventScroll: true });
  }

  function openItem(it, opts) {
    if (!it) return;
    const MODE = modeNow();
    if (MODE === "page") { location.href = `item.html?id=${encodeURIComponent(it.key)}${location.search.length > 1 ? `&back=${encodeURIComponent(location.search.slice(1))}` : ""}`; return; }
    if (MODE === "inplace") openInplace(it, opts); else openDock(it, opts);
    $(".mu-body")?.setAttribute("data-open", MODE);
  }
  const closeOpen = () => { if (pop.it) closeInplace(); else if (dock.it) closeDock(); };

  /* ---------------- events ---------------- */
  document.addEventListener("click", (e) => {
    const t = e.target;
    const play = t.closest("[data-play]");
    if (play) { const it = BY_KEY[play.dataset.play]; if (it) playItem(it, play); return; }
    const tr = t.closest("[data-play-track]");
    if (tr) { const it = itemOfTrack(tr.dataset.playTrack); playTrack(it, P.resolve(tr.dataset.playTrack), tr.closest(".mu-trk")); return; }
    const tab = t.closest(".yfolder__tab");
    if (tab) {
      const it = BY_KEY[tab.closest(".mu-item").dataset.key], tk = P.resolve(tab.dataset.tid);
      if (tk?.url) playTrack(it, tk, tab); else openItem(it);
      return;
    }
    const cp = t.closest("[data-copy]");
    if (cp) { copyLink(BY_KEY[cp.dataset.copy], cp); return; }
    if (t.closest("[data-close]")) { closeOpen(); return; }
    const op = t.closest("[data-open]");
    if (op) { openItem(BY_KEY[op.dataset.open]); return; }
    if (t.closest("[data-shuffle]")) {
      const all = ITEMS.flatMap((i) => i.playable);
      P.setShuffle(true);
      P.play(all[Math.floor(Math.random() * all.length)], all);
      sound("play", { el: t.closest("[data-shuffle]") });
    }
  });
  const itemOfTrack = (id) => { const tk = P.resolve(id); return tk?.collectionId ? ITEMS.find((i) => i.entry.id === tk.collectionId) : ITEMS.find((i) => i.entry === tk); };
  // in place: a tap outside the sheet closes it
  document.addEventListener("pointerdown", (e) => {
    if (!pop.el || pop.el.contains(e.target) || e.target.closest("yarn-player, .mockpanel, .ylb")) return;
    if (e.target.closest(".mu-item")?.dataset.key === pop.it?.key && e.target.closest(".yfolder__open")) return; // its own card toggles
    closeInplace();
  });
  // Esc closes the opened item (the player's full panel gets it first)
  addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || P.view === "panel" || Y.lightbox?.isOpen) return;
    if (pop.it || dock.it) { e.preventDefault(); closeOpen(); }
  }, true);
  // the player's "collection" link opens it here instead of reloading
  addEventListener("yarnplayer:collection", (e) => {
    const it = BY_KEY[e.detail.key];
    if (!it) return;
    if (PAGE === "item") { if (params.get("id") === it.key) e.preventDefault(); return; }
    if (modeNow() === "page") return;
    e.preventDefault();
    if (!(pop.it === it || dock.it === it)) openItem(it);
  });
  addEventListener("resize", () => { if (dock.it && !dock.sp.moving) dockPaint(1); });
  compactMQ.addEventListener("change", () => { if (dock.it) dockPaint(dock.p); if (pop.it) closeInplace({ instant: true }); });

  sync();
  // ?item=<key> opens one on load (no animation)
  const first = PAGE === "library" && BY_KEY[params.get("item")];
  if (first) requestAnimationFrame(() => {
    const MODE = modeNow();
    if (MODE === "page") return openItem(first);
    const card = cardOf(first);
    if (card && MODE === "dock" && !compactMQ.matches) { const r = card.getBoundingClientRect(); if (r.top > innerHeight * 0.6) scrollTo(0, scrollY + r.top - 160); }
    openItem(first, { focus: false });
    if (MODE === "dock") { dock.sp.jump(1); dock.anchor = null; }
    else if (pop.sp) { pop.sp.jump(1); $(".mu-pop__sheet")?.classList.add("is-selected"); }
  });
})();
