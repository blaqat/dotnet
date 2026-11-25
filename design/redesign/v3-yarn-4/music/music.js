/* ============================================================
   music/music.js · Music page + item page, iteration 4 (music agent)
   Music copies Projects' layouts (projects/LAYOUT.md) and keeps its own parts: the folder cards
   (collections are folders, their tracks are tabs), play buttons, track rows, the player hand-off.
   Singles and collections live in one list, newest first, grouped by year (ruled year pills).

   Desktop  ?view=list (default)  timeline (yarn ball on the selected release) + sticky stage (.ypanel)
            ?view=grid            year groups of folder cards (4 columns ≥ 1320px, else 2: Projects' column lines;
                                  ?gcols=2 keeps 2)
                                  ?open=inline (default): the card opens in place (Yarn.openInPlace)
                                  ?open=page: the card opens its own page (item.html)
   Phones   one list of folder rows grouped by year; a tap opens the release's page (item.html)
   Item     item.html?id=<key> · the kit detail page + an in-flow Newer / Older pager
   Queue    YarnPlayer.enqueue / playNext / remove / has (i4 · chrome): a quiet "+" on cards, rows, track rows and
            the tab tip; right-click (desktop) / long-press (touch) / the menu key = Play next · Add to queue;
            a toast with Undo. Nothing playing yet → the first one starts playing.
   State    ?item=<key> selected (timeline) / open (grid) · ?focus=<key> (back from the item page)
   Filters  ?instrument= ?status= ?kind= ?year= ?on= ?q= · phones: ?msearch=fab|bar (kit) ?mf=wrap|scroll
   ============================================================ */
(() => {
  "use strict";
  const Y = window.Yarn, P = window.YarnPlayer;
  if (!Y || !P) return;
  const params = Y.params, esc = Y.esc, sound = Y.sound;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const pick = (k, ok, d) => (ok.includes(params.get(k)) ? params.get(k) : d);
  const RM = () => Y.reduced();
  const PAGE = document.body.dataset.page === "item" ? "item" : "library";
  const OPT = {
    view: pick("view", ["list", "grid"], "list"),
    open: pick("open", ["inline", "page"], "inline"),
    mf: pick("mf", ["wrap", "scroll"], "wrap"),
    gcols: pick("gcols", ["auto", "2"], "auto"),
  };
  const desk = matchMedia("(min-width: 960px)");
  const isDesk = () => desk.matches;
  const fine = matchMedia("(pointer: fine)");
  const fmt = P.meta.fmt;
  const ph = (n, w = "bold") => `<i class="ph-${w} ph-${n}" aria-hidden="true"></i>`;

  /* ---------------- data: the player's library (same ids, same tracks) ---------------- */
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
  const N = ITEMS.length;
  const plain = (s) => String(s || "").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/\*\*|__|^#+\s*/gm, "").replace(/\s+/g, " ").trim();
  const sw = (t, size, radius) => Y.swatchHTML({ instrument: t.instrument, url: t.url || undefined, name: t.name }, { size, radius });
  const isCurrent = (it) => { const t = P.state.track; return !!t && (it.kind === "collection" ? t.collectionId === it.entry.id : t === it.entry); };
  const itemOfTrack = (tk) => (tk?.collectionId ? ITEMS.find((i) => i.entry.id === tk.collectionId) : ITEMS.find((i) => i.entry === tk)) || null;
  const trackName = (it, t) => (it.kind === "collection" ? t.name.replace(/^0*(\d+)\s*-\s*/, (m, d) => (+d === t.index ? "" : m)) : t.name);

  /* ---------------- URLs (kit + page options and filters ride along between the list and a page) ---------------- */
  const CARRY = ["sel", "rope", "body", "bg", "nav", "toggle", "soundui", "reduced", "view", "open", "gcols", "msearch", "mf", "player", "disc", "demo", "instrument", "status", "kind", "year", "on", "q"];
  function carry(extra = {}, drop = []) {
    const u = new URLSearchParams();
    for (const k of CARRY) if (params.get(k) != null && !drop.includes(k)) u.set(k, params.get(k));
    for (const [k, v] of Object.entries(extra)) v == null ? u.delete(k) : u.set(k, v);
    const s = u.toString();
    return s ? `?${s}` : "";
  }
  const pageHref = (it) => `item.html${carry({ id: it.key }, ["q"])}`;
  const listHref = (it) => `index.html${carry({ focus: it ? it.key : null })}`;
  const shareURL = (it) => `https://blaqat.net/music?item=${encodeURIComponent(it.key)}`;
  function setParam(k, v) {
    const u = new URL(location.href);
    v == null || v === "" ? u.searchParams.delete(k) : u.searchParams.set(k, v);
    history.replaceState(history.state, "", u);
  }

  /* ============================================================
     QUEUE (owner, Music 8) · the player's queue API. A release's "+" adds every playable track that isn't
     already waiting; pressed (all of them waiting) it takes them out again. ref = "item:<key>" | "track:<id>"
     ============================================================ */
  const qTracks = (ref) => {
    const i = ref.indexOf(":"), k = ref.slice(0, i), v = ref.slice(i + 1);
    if (k === "track") { const t = P.resolve(v); return t ? [t] : []; }
    return BY_KEY[v]?.playable || [];
  };
  const qName = (ref) => {
    const i = ref.indexOf(":"), k = ref.slice(0, i), v = ref.slice(i + 1);
    if (k === "track") { const t = P.resolve(v), it = itemOfTrack(t); return t ? (it ? trackName(it, t) : t.name) : ""; }
    return BY_KEY[v]?.name || "";
  };
  function qInfo(ref) {
    const tr = qTracks(ref).filter((t) => t.url && t !== P.state.track);
    return { tr, on: tr.length > 0 && tr.every((t) => P.has(t)) };
  }
  // the quiet "+": a small round icon beside the play button (cards, rows, track rows) or a labelled button (details)
  function qBtn(ref, { big = false } = {}) {
    const { tr, on } = qInfo(ref), name = esc(qName(ref));
    const off = tr.length ? "" : " disabled";
    if (big) return `<button type="button" class="btn mu-q mu-q--big" data-q="${esc(ref)}" aria-pressed="${on}"${off}>${ph(on ? "check" : "list-plus")}<span class="mu-q__l">${on ? "In queue" : "Add to queue"}</span></button>`;
    return `<button type="button" class="ylinkicon ylinkicon--sm mu-q" data-q="${esc(ref)}" aria-pressed="${on}" aria-label="${on ? `${name} is in the queue. Take it out` : `Add ${name} to the queue`}" title="${on ? "In the queue" : "Add to queue"}"${off}>${ph(on ? "check" : "plus")}</button>`;
  }
  function paintQ(b) {
    const { tr, on } = qInfo(b.dataset.q), name = qName(b.dataset.q);
    if (b.getAttribute("aria-pressed") !== String(on)) {
      b.setAttribute("aria-pressed", String(on));
      const i = $("i", b); if (i) i.className = `ph-bold ph-${on ? "check" : b.classList.contains("mu-q--big") ? "list-plus" : "plus"}`;
      const l = $(".mu-q__l", b); if (l) l.textContent = on ? "In queue" : "Add to queue";
    }
    if (!b.classList.contains("mu-q--big")) { b.setAttribute("aria-label", on ? `${name} is in the queue. Take it out` : `Add ${name} to the queue`); b.title = on ? "In the queue" : "Add to queue"; }
    b.disabled = !tr.length;
  }
  // add (or, when it's all waiting already, take out); next = play right after the current track
  function queue(ref, { next = false, el = null } = {}) {
    const { tr, on } = qInfo(ref), name = qName(ref);
    if (!tr.length) return;
    if (on && !next) {
      tr.forEach((t) => P.remove(t));
      sound("tag-remove", { el });
      toast({ icon: "list-dashes", html: `<b>${esc(name)}</b> is out of the queue`, undo: () => tr.forEach((t) => P.enqueue(t)) });
      return;
    }
    const idle = !P.state.track;
    const added = tr.filter((t) => !P.has(t));
    if (next) [...tr].reverse().forEach((t) => P.playNext(t)); else added.forEach((t) => P.enqueue(t));
    sound(idle ? "play" : "token-add", { el });
    if (idle) return; // nothing was playing: it starts, and the player arriving says so
    toast({ icon: next ? "skip-forward" : "list-plus", html: `<b>${esc(name)}</b> ${next ? "plays next" : "is in the queue"}`, undo: () => (next ? tr : added).forEach((t) => P.remove(t)) });
  }

  /* ---------- toast: one at a time, above the bottom chrome; Undo ---------- */
  const toastEl = document.createElement("div");
  toastEl.className = "mu-toast";
  toastEl.hidden = true;
  document.body.appendChild(toastEl);
  let toastT = 0, toastAnim = null, toastUndo = null;
  function toast({ icon = "list-plus", html = "", undo = null }) {
    clearTimeout(toastT);
    toastUndo = undo;
    toastEl.innerHTML = `${ph(icon)}<span class="mu-toast__t">${html}</span>${undo ? `<button type="button" class="btn btn--sm btn--ghost mu-toast__undo">Undo</button>` : ""}`;
    const fresh = toastEl.hidden;
    toastEl.hidden = false;
    toastAnim?.cancel();
    if (!RM()) {
      const sp = Y.springEasing({ response: 0.34 });
      toastAnim = toastEl.animate(fresh ? [{ opacity: 0, transform: "translateY(12px) scale(.96)" }, { opacity: 1, transform: "none" }] : [{ transform: "scale(.97)" }, { transform: "none" }], { duration: sp.duration, easing: sp.easing });
    }
    toastT = setTimeout(hideToast, 3400);
  }
  function hideToast() {
    clearTimeout(toastT);
    if (toastEl.hidden) return;
    toastUndo = null;
    if (RM()) { toastEl.hidden = true; return; }
    toastAnim?.cancel();
    toastAnim = toastEl.animate([{ opacity: 1 }, { opacity: 0, transform: "translateY(8px)" }], { duration: 180, easing: "ease-in", fill: "forwards" });
    toastAnim.onfinish = () => { toastEl.hidden = true; toastAnim?.cancel(); toastAnim = null; };
  }
  toastEl.addEventListener("pointerenter", () => clearTimeout(toastT));
  toastEl.addEventListener("pointerleave", () => { clearTimeout(toastT); toastT = setTimeout(hideToast, 1800); });
  toastEl.addEventListener("click", (e) => {
    if (!e.target.closest(".mu-toast__undo")) return;
    const u = toastUndo; toastUndo = null; u?.(); sound("tag-remove"); hideToast();
  });

  /* ============================================================
     BITS
     ============================================================ */
  // the primary action: a round red play / pause (cards, rows); details get the labelled one ("Play all"), which
  // keeps its width while it's the current one and shows only the icon (owner, Music 5: no "Pause" text)
  function playBtn(it, { big = false } = {}) {
    const cur = isCurrent(it), on = cur && P.state.playing;
    const label = it.kind === "collection" ? "Play all" : "Play";
    const aria = `${on ? "Pause" : cur ? "Play" : label} ${esc(it.name)}`;
    if (big) return `<button type="button" class="btn btn--red mu-play mu-play--big${cur ? " is-cur" : ""}" data-play="${esc(it.key)}" aria-label="${aria}">${ph(on ? "pause" : "play", "fill")}<span class="mu-play__l" aria-hidden="true">${label}</span></button>`;
    return `<button type="button" class="btn btn--red btn--icon mu-play" data-play="${esc(it.key)}" aria-label="${aria}">${ph(on ? "pause" : "play", "fill")}</button>`;
  }
  function paintPlay(b) {
    const it = BY_KEY[b.dataset.play]; if (!it) return;
    const cur = isCurrent(it), on = cur && P.state.playing;
    const label = it.kind === "collection" ? "Play all" : "Play";
    const i = $("i", b), want = `ph-fill ph-${on ? "pause" : "play"}`;
    if (i && i.className !== want) i.className = want;
    b.setAttribute("aria-label", `${on ? "Pause" : cur ? "Play" : label} ${it.name}`);
    b.classList.toggle("is-cur", cur);
  }
  const copyBtn = (it, { sm = false } = {}) => `<button type="button" class="ylinkicon${sm ? " ylinkicon--sm" : ""}" data-copy="${esc(it.key)}" aria-label="Copy a link to ${esc(it.name)}" title="Copy link">${ph("link")}</button>`;
  // link openers on cards are smaller than the play button (owner, Music 4); they keep the brand fade (kit)
  const smLinks = (t) => P.linksHTML(t).replace(/class="ylinkicon"/g, 'class="ylinkicon ylinkicon--sm"');

  /* in-item match marks (kit .is-match): a status / instrument that matches the active filter or search, and on a
     collection the tab (and track row) whose name matches the search */
  function hits() {
    const words = F ? F.q.trim().toLowerCase().split(/\s+/).filter((w) => w.length >= 2) : [];
    const typed = (label) => words.length > 0 && String(label || "").toLowerCase().split(/[\s/._()-]+/).some((x) => x && words.some((w) => x.startsWith(w)));
    return {
      status: (it) => { const st = Y.status(it.status); return !!F && !!st && (F.has("status", st.key) || typed(st.label)); },
      inst: (it) => { const i = Y.instrument(it.instrument); return !!F && !!i && (F.has("instrument", i.key) || typed(i.label)); },
      track: (t) => typed(t.name),
    };
  }
  const NOHITS = { status: () => false, inst: () => false, track: () => false };
  const mk = (kind, html, on) => (html ? `<span class="mu-mk${on ? " is-match" : ""}" data-mk="${kind}">${html}</span>` : "");
  // status · (instrument, only while it matches: the swatch already says it) · date
  const metaHTML = (it, H = NOHITS, { compact = false } = {}) =>
    `<div class="ymeta">${mk("status", Y.badge.status(it.status, { compact }), H.status(it))}${H.inst(it) ? mk("inst", Y.badge.instrument(it.instrument, { compact }), true) : ""}${Y.badge.date(it.src)}</div>`;

  /* ---------- the folder (kit Yarn.folder): grid card · timeline row · phone row ---------- */
  function folderHTML(it, kind) {
    const coll = it.kind === "collection", k = esc(it.key);
    const open = kind === "row" ? { attrs: `data-pick="${k}" aria-controls="mu-stage" aria-current="false"`, label: `Show ${it.name}${coll ? `, ${it.tracks.length} tracks` : ""}` }
      : kind === "card" && OPT.open === "inline" ? { attrs: `data-open="${k}" aria-expanded="false"` }
      : { attrs: `data-href="${esc(pageHref(it))}"` };
    let html = Y.folder(it.src, {
      tracks: coll ? it.tracks : [],
      current: P.state.track?.id ?? null,
      links: kind === "card" ? (coll ? copyBtn(it, { sm: true }) : smLinks(it.entry)) : "",
      // phone rows stay lean (owner, Projects 7): play only; the queue is a long-press away, and on the release's page
      action: (it.playable.length && kind !== "mrow" ? qBtn(`item:${it.key}`) : "") + playBtn(it),
      swatchSize: kind === "card" ? 54 : kind === "row" ? 48 : 44,
      open,
      meta: metaHTML(it, hits(), { compact: kind === "mrow" }),
      desc: kind === "card",
      key: it.key,
    });
    // its own page: the card's hit area is a real link (middle-click, copy link address)
    if (kind === "mrow") html = html.replace('<div class="yfolder__foot">', '<i class="ph-bold ph-caret-right mu-go" aria-hidden="true"></i><div class="yfolder__foot">');
    if (open.attrs.startsWith("data-href")) html = html.replace(/<button type="button" class="yfolder__open" data-href="([^"]*)"([^>]*)><\/button>/, '<a class="yfolder__open" href="$1" data-nav="' + k + '"$2></a>');
    return html;
  }
  const cardHTML = (it) => folderHTML(it, "card");
  const rowHTML = (it) => folderHTML(it, "row");
  const mrowHTML = (it) => folderHTML(it, "mrow");

  /* ---------- the detail (stage · opened card · its own page): title → meta → play / queue / links → tracks → notes ---------- */
  const act = {
    page: (it) => `<a class="ylinkicon" href="${esc(pageHref(it))}" data-nav="${esc(it.key)}" aria-label="Open ${esc(it.name)} as its own page" title="Open as page">${ph("arrow-square-out")}</a>`,
    close: (it) => `<button type="button" class="ylinkicon" data-close aria-label="Close ${esc(it.name)}" title="Close (Esc)">${ph("x")}</button>`,
    prev: (it) => (it ? `<a class="ylinkicon" href="${esc(pageHref(it))}" rel="prev" aria-label="Newer: ${esc(it.name)}" title="${esc(it.name)}">${ph("caret-up")}</a>` : ""),
    next: (it) => (it ? `<a class="ylinkicon" href="${esc(pageHref(it))}" rel="next" aria-label="Older: ${esc(it.name)}" title="${esc(it.name)}">${ph("caret-down")}</a>` : ""),
  };
  function trackRow(it, t, H) {
    const n = String(t.index || 1).padStart(2, "0");
    const sub = !t.url ? "No audio here, listen on the links" : t.artist ? `with ${[].concat(t.artist).join(", ")}` : t.description ? plain(t.description) : "";
    const now = P.state.track === t, on = now && P.state.playing, name = trackName(it, t);
    return `<li><div class="yrow ylift ysel mu-trk${t.url ? "" : " is-off"}${on ? " is-playing" : ""}" data-tid="${esc(t.id)}" aria-current="${now}">
      ${t.url ? `<button type="button" class="mu-trk__btn" data-play-track="${esc(t.id)}" aria-label="${on ? "Pause" : "Play"} ${esc(name)}"></button>` : ""}
      <span class="mu-trk__n" aria-hidden="true"><span>${n}</span>${ph("play", "fill")}${Y.EQ}</span>
      ${sw(t, 40, 10)}
      <span class="mu-trk__t"><b${H.track(t) ? ' class="is-match"' : ""}>${esc(name)}</b>${sub ? `<small>${esc(sub)}</small>` : ""}</span>
      <span class="mu-trk__links">${smLinks(t)}</span>
      ${t.url ? qBtn(`track:${t.id}`) : "<span></span>"}
      <span class="mu-trk__d meta">${t.url ? fmt(P.durationOf(t)) : ""}</span>
    </div></li>`;
  }
  function detailHTML(it, { ctx = "stage", back = null, actions = "", end = "", level = 2 } = {}) {
    const coll = it.kind === "collection", H = PAGE === "item" ? NOHITS : hits();
    const total = it.playable.reduce((s, t) => s + (P.durationOf(t) || 0), 0);
    const meta = metaHTML(it, H) +
      (!coll && it.playable.length ? `<span class="meta mu-dmeta">${fmt(total)}</span>` : "") +
      (it.artist ? `<span class="meta mu-dmeta">with ${esc([].concat(it.artist).join(", "))}</span>` : "");
    const tracks = coll ? `<section class="mu-trks-wrap" aria-labelledby="mut-${esc(it.key)}-${ctx}"><h3 class="eyebrow mu-trks-h" id="mut-${esc(it.key)}-${ctx}">Tracks <span class="meta">${it.tracks.length} · ${fmt(total)}</span></h3><ol class="mu-trks">${it.tracks.map((t) => trackRow(it, t, H)).join("")}</ol></section>` : "";
    const links = (it.playable.length ? playBtn(it, { big: true }) + qBtn(`item:${it.key}`, { big: true }) : "") + (coll ? "" : `<span class="mu-dlinks">${P.linksHTML(it.entry)}</span>`);
    return Y.detail({
      back, actions: actions || `${act.page(it)}${copyBtn(it)}${ctx === "panel" ? act.close(it) : ""}`, level, end,
      kicker: `<span class="mu-art">${sw(it.src, 64, 14)}</span>`,
      title: it.name, meta, media: tracks, body: it.description ? P.meta.md(it.description) : "", links,
      id: `mud-${it.key}-${ctx}`,
    });
  }

  /* ============================================================
     PLAY
     ============================================================ */
  function visibleQueueFrom(it) { // a single plays on through the list as you see it
    const vis = F ? ITEMS.filter((x) => F.test(x)) : ITEMS;
    const i = vis.indexOf(it);
    return (i < 0 ? [it] : vis.slice(i)).flatMap((x) => x.playable);
  }
  function playItem(it, btn) {
    if (isCurrent(it)) { const was = P.state.playing; P.toggle(); sound(was ? "pause" : "play", { el: btn }); return; }
    const q = it.kind === "collection" ? it.playable : visibleQueueFrom(it);
    if (!q.length) return;
    P.play(q[0], q);
    sound("play", { el: btn });
  }
  function playTrack(it, t, el) {
    if (!t?.url) return;
    if (P.state.track === t) { const was = P.state.playing; P.toggle(); sound(was ? "pause" : "play", { el }); return; }
    P.play(t, it && it.kind === "collection" ? it.playable : it ? visibleQueueFrom(it) : undefined);
    sound("play", { el });
  }
  // keep folders / tabs / rows / buttons in step with the player (one pass; nothing is re-rendered, focus stays put)
  function sync() {
    const s = P.state, t = s.track;
    for (const f of $$(".mu .yfolder[data-folder]")) {
      const it = BY_KEY[f.dataset.folder]; if (!it) continue;
      const cur = isCurrent(it);
      f.classList.toggle("is-current", cur); f.classList.toggle("is-playing", cur && s.playing);
      for (const tab of $$(".yfolder__tab", f)) {
        const now = !!t && tab.dataset.tid === t.id;
        if (tab.classList.contains("is-now") !== now) tab.classList.toggle("is-now", now);
        now ? tab.setAttribute("aria-current", "true") : tab.removeAttribute("aria-current");
      }
    }
    for (const row of $$(".mu-trk")) {
      const now = !!t && row.dataset.tid === t.id, on = now && s.playing;
      row.setAttribute("aria-current", String(now));
      row.classList.toggle("is-playing", on);
      const b = $(".mu-trk__btn", row); if (b) b.setAttribute("aria-label", `${on ? "Pause" : "Play"} ${$("b", row).textContent}`);
    }
    $$(".mu [data-play]").forEach(paintPlay);
    $$("[data-q]").forEach(paintQ);
    paintTip();
  }
  P.on((_, kind) => { if (kind === "track" || kind === "state" || kind === "queue") sync(); });

  async function copyLink(it, b) {
    const ok = await P.copyText(shareURL(it));
    const i = $("i", b);
    if (i) i.className = `ph-bold ${ok ? "ph-check" : "ph-link-break"}`;
    b.title = ok ? "Copied" : "Couldn't copy";
    b.classList.toggle("is-copied", ok);
    if (ok) sound("copy", { el: b });
    clearTimeout(b._t);
    b._t = setTimeout(() => { if (i) i.className = "ph-bold ph-link"; b.title = "Copy link"; b.classList.remove("is-copied"); }, 1600);
  }

  /* ============================================================
     TAB TIP (owner, Music 3 + 8) · one tip for every folder tab, on the page's top layer (fixed), so it never
     sits under the sticky filter row or a year pill: the track's full name + a "+" for the queue. It replaces
     the kit's CSS hint on this page. Mouse hover / keyboard focus; the tab stays up while the pointer is on the tip.
     ============================================================ */
  const tip = document.createElement("div");
  tip.className = "mu-tip";
  tip.hidden = true;
  tip.innerHTML = `<span class="mu-tip__t"></span><button type="button" class="mu-tip__q" tabindex="-1"></button>`;
  document.body.appendChild(tip);
  const tipT = $(".mu-tip__t", tip), tipQ = $(".mu-tip__q", tip);
  let tipTab = null, tipHide = 0;
  function paintTip() {
    if (!tipTab) return;
    const t = P.resolve(tipTab.dataset.tid);
    const ref = t?.url ? `track:${t.id}` : "";
    tipQ.hidden = !ref;
    if (!ref) return;
    const { tr, on } = qInfo(ref);
    tipQ.dataset.q = ref;
    tipQ.disabled = !tr.length;
    tipQ.innerHTML = ph(on ? "check" : "plus");
    tipQ.setAttribute("aria-label", on ? `${qName(ref)} is in the queue. Take it out` : `Add ${qName(ref)} to the queue`);
    tipQ.title = on ? "In the queue" : "Add to queue";
    tip.classList.toggle("is-on", on);
  }
  function showTip(tab) {
    clearTimeout(tipHide);
    if (tipTab && tipTab !== tab) tipTab.classList.remove("is-tip");
    tipTab = tab;
    tab.classList.add("is-tip");
    tipT.textContent = tab.dataset.name || "";
    paintTip();
    tip.hidden = false;
    // the tab rises 8px (hover / .is-tip); the tip sits above where it lands, on the tab's left (right for late tabs)
    const strip = tab.parentElement.getBoundingClientRect(), r = tab.getBoundingClientRect();
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    const top = strip.top - 8 - 6 - th;
    let left = tab.classList.contains("is-r") ? r.right - tw : r.left;
    left = Math.max(8, Math.min(left, innerWidth - tw - 8));
    tip.style.translate = `${Math.round(left)}px ${Math.round(top)}px`;
    tip.classList.toggle("is-r", tab.classList.contains("is-r"));
  }
  function hideTip(now = false) {
    clearTimeout(tipHide);
    const go = () => { tip.hidden = true; tipTab?.classList.remove("is-tip"); tipTab = null; };
    if (now) go(); else tipHide = setTimeout(go, 140);
  }
  document.addEventListener("pointerover", (e) => {
    if (e.pointerType === "touch") return;
    const tab = e.target.closest?.(".mu .yfolder__tab");
    if (tab && !tab.closest(".is-dense, [data-yio-ghost], [data-yghost]")) showTip(tab);
  });
  document.addEventListener("pointerout", (e) => {
    if (!tipTab || e.pointerType === "touch") return;
    const to = e.relatedTarget;
    if (to && (tip.contains(to) || to.closest?.(".yfolder__tab") === tipTab)) return;
    if (e.target.closest?.(".yfolder__tab") === tipTab || tip.contains(e.target)) hideTip();
  });
  document.addEventListener("focusin", (e) => {
    const tab = e.target.closest?.(".mu .yfolder__tab");
    if (tab && tab.matches(":focus-visible")) showTip(tab);
    else if (tipTab && !tip.contains(e.target)) hideTip(true);
  });
  document.addEventListener("focusout", (e) => { if (tipTab && e.target === tipTab && !tip.contains(e.relatedTarget)) hideTip(true); });
  addEventListener("scroll", () => { if (tipTab) hideTip(true); }, { passive: true });
  tipQ.addEventListener("click", () => { if (tipQ.dataset.q) queue(tipQ.dataset.q, { el: tipQ }); });

  /* ============================================================
     CONTEXT MENU (owner, Music 8) · right-click, the menu key / Shift+F10, or a long press on touch, on a folder,
     a tab or a track row: Play next · Add to queue (or take it out) · Copy link
     ============================================================ */
  const menu = (() => {
    const el = document.createElement("div");
    el.className = "mu-menu";
    el.setAttribute("role", "menu");
    el.tabIndex = -1;
    el.hidden = true;
    document.body.appendChild(el);
    let back = null, ref = "", item = null, anim = null;
    function open(r, it, { x, y, from, kb = false }) {
      ref = r; item = it; back = from;
      const { tr, on } = qInfo(r);
      const name = qName(r);
      el.setAttribute("aria-label", name);
      el.innerHTML = `<p class="mu-menu__h" aria-hidden="true">${esc(name)}</p>
        <button type="button" role="menuitem" data-m="next"${tr.length ? "" : " disabled"}>${ph("skip-forward")}<span>Play next</span></button>
        <button type="button" role="menuitem" data-m="queue"${tr.length ? "" : " disabled"}>${ph(on ? "minus-circle" : "list-plus")}<span>${on ? "Take out of the queue" : "Add to queue"}</span></button>
        ${it ? `<button type="button" role="menuitem" data-m="copy">${ph("link")}<span>Copy link</span></button>` : ""}`;
      el.hidden = false;
      const w = el.offsetWidth, h = el.offsetHeight;
      const L = Math.max(8, Math.min(x, innerWidth - w - 8)), T = Math.max(8, Math.min(y, innerHeight - h - 8 - Y.px("--bottom-ui")));
      el.style.translate = `${Math.round(L)}px ${Math.round(T)}px`;
      anim?.cancel();
      if (!RM()) { const sp = Y.springEasing({ response: 0.28 }); anim = el.animate([{ opacity: 0, transform: "scale(.94)" }, { opacity: 1, transform: "none" }], { duration: sp.duration, easing: sp.easing }); }
      hideTip(true);
      // keyboard (menu key / Shift+F10): the first item takes focus; a pointer opens it without a focus ring
      (kb ? $("[role=menuitem]:not([disabled])", el) || el : el).focus({ preventScroll: true });
      document.addEventListener("pointerdown", outside, true);
      addEventListener("scroll", close, { passive: true, once: true });
      sound("open", { el: from });
    }
    function close({ focus = false } = {}) {
      if (el.hidden) return;
      el.hidden = true; anim?.cancel();
      document.removeEventListener("pointerdown", outside, true);
      removeEventListener("scroll", close);
      if (focus && back?.isConnected) back.focus({ preventScroll: true });
      back = null;
    }
    function outside(e) { if (!el.contains(e.target)) close(); }
    el.addEventListener("click", (e) => {
      const b = e.target.closest("[data-m]"); if (!b || b.disabled) return;
      const m = b.dataset.m, r = ref, it = item, from = back;
      close({ focus: true });
      if (m === "next") queue(r, { next: true, el: from });
      else if (m === "queue") queue(r, { el: from });
      else if (m === "copy" && it) copyLink(it, from?.matches?.("[data-copy]") ? from : document.createElement("button"));
    });
    el.addEventListener("keydown", (e) => {
      const items = $$("[role=menuitem]:not([disabled])", el), i = items.indexOf(document.activeElement);
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close({ focus: true }); }
      else if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); items[(i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]?.focus(); }
      else if (e.key === "Home" || e.key === "End") { e.preventDefault(); items[e.key === "Home" ? 0 : items.length - 1]?.focus(); }
      else if (e.key === "Tab") close();
    });
    return { show: open, close, get isOpen() { return !el.hidden; } };
  })();
  // what a context action targets: a tab or a track row → that track; a folder / opened release → the release
  function ctxTarget(node) {
    const tab = node.closest?.(".mu .yfolder__tab");
    if (tab) { const t = P.resolve(tab.dataset.tid); return t?.url ? { ref: `track:${t.id}`, it: null, el: tab } : null; }
    const row = node.closest?.(".mu .mu-trk:not(.is-off)");
    if (row) return { ref: `track:${row.dataset.tid}`, it: null, el: $(".mu-trk__btn", row) || row };
    const f = node.closest?.(".mu .yfolder[data-folder]");
    if (f && !f.closest("[data-yio-ghost], [data-yghost]")) { const it = BY_KEY[f.dataset.folder]; return it ? { ref: `item:${it.key}`, it, el: $(".yfolder__open", f) || f } : null; }
    return null;
  }
  let press = null; // a touch long-press in progress
  document.addEventListener("contextmenu", (e) => {
    if (e.target.closest?.("input, textarea, a[href^='http']")) return;
    const c = ctxTarget(e.target);
    if (!c) return;
    e.preventDefault();
    if (press) return; // touch: the long-press timer opens it
    const kb = e.pointerId === -1 || e.pointerType === "" || (!e.clientX && !e.clientY); // the menu key / Shift+F10
    const r = c.el.getBoundingClientRect();
    menu.show(c.ref, c.it, { x: kb ? r.left : e.clientX, y: kb ? r.bottom + 6 : e.clientY, from: c.el, kb });
  });
  document.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "touch" || e.target.closest("a[href^='http'], input")) return;
    const c = ctxTarget(e.target);
    if (!c) return;
    const x = e.clientX, y = e.clientY;
    press = { x, y, fired: false, t: setTimeout(() => { if (!press) return; press.fired = true; navigator.vibrate?.(8); menu.show(c.ref, c.it, { x, y: y + 8, from: c.el }); }, 480) };
  }, { passive: true });
  const unpress = (e) => { if (!press) return; if (e.type === "pointermove" && Math.hypot(e.clientX - press.x, e.clientY - press.y) < 10) return; clearTimeout(press.t); if (!press.fired) press = null; };
  document.addEventListener("pointermove", unpress, { passive: true });
  document.addEventListener("pointercancel", unpress);
  document.addEventListener("pointerup", (e) => { if (press && !press.fired) unpress(e); });
  // the click that ends a long press doesn't also play / open
  document.addEventListener("click", (e) => { if (press?.fired) { e.preventDefault(); e.stopPropagation(); press = null; } }, true);

  /* ============================================================
     ITEM PAGE (item.html?id=<key>)
     ============================================================ */
  const root = $("#mu");
  let F = null;
  if (PAGE === "item") {
    const it = BY_KEY[params.get("id")] || BY_KEY[params.get("item")] || ITEMS[0];
    const i = ITEMS.indexOf(it), newer = ITEMS[i - 1], older = ITEMS[i + 1];
    document.title = `${it.name} · Music · blaqat.net`;
    root.innerHTML = Y.detailPage(detailHTML(it, {
      ctx: "page", level: 1,
      back: { href: listHref(it), label: "Music" },
      actions: act.prev(newer) + act.next(older) + copyBtn(it),
      end: Y.pager({
        prev: newer && { href: pageHref(newer), title: newer.name, meta: esc(Y.dateRange(newer.src)) },
        next: older && { href: pageHref(older), title: older.name, meta: esc(Y.dateRange(older.src)) },
        ends: { prev: { label: "Newest release", title: "Back to all music", href: listHref(it) }, next: { label: "Oldest release", title: "Back to all music", href: listHref(it) } },
        labels: { prev: "Newer", next: "Older" }, icons: { prev: "ph-arrow-up", next: "ph-arrow-down" }, label: "More music",
      }),
    }));
    root.addEventListener("click", (e) => {
      if (e.target.closest(".ydetail__back")) sound("close");
      else if (e.target.closest(".ypager__a")) sound("open");
    });
    addEventListener("keydown", (e) => {
      if (e.key !== "Escape" || Y.lightbox?.isOpen || P.view === "panel" || e.defaultPrevented || menu.isOpen) return;
      location.href = listHref(it);
    });
    // the player's "collection" link: that collection's own page (this one: stay)
    addEventListener("yarnplayer:collection", (e) => {
      const c = BY_KEY[e.detail.key]; if (!c) return;
      e.preventDefault();
      if (c !== it) location.href = pageHref(c);
    });
    Y.mockPanel([
      { label: "Release", param: "id", options: ITEMS.map((x) => [x.key, x.name]), default: ITEMS[0].key },
      { label: "Player view", param: "player", options: [["", "Saved"], ["disc", "Disc"], ["bar", "Bar"], ["panel", "Panel"]], default: "" },
      { label: "Demo playing", param: "demo", options: [["", "Off"], ["1", "On"]], default: "" },
    ], { title: "Music page options" });
  }

  /* ============================================================
     LIBRARY
     ============================================================ */
  let body = null, mode = null, tl = null, sel = null, stageAnim = null, io = null, tools = null;
  const stickyTop = () => (body ? parseFloat(getComputedStyle(body).getPropertyValue("--sticky-top")) || 0 : 0);
  const visible = (it) => !!it && F.test(it);
  const modeNow = () => (isDesk() ? OPT.view : "mlist");
  const itemEl = (k) => (body ? $$(".ygroup__item, .ytl__item", body).find((el) => el.dataset.key === k && !("yioGhost" in el.dataset)) : null) || null;
  const firstVisible = () => ITEMS.find(visible)?.key || null;
  const emptyHTML = `<div class="mu-empty" hidden><p><b>Nothing matches.</b> Try fewer filters.</p><button type="button" class="btn btn--sm" data-reset>${ph("arrow-counter-clockwise")}Clear filters</button></div>`;

  if (PAGE === "library") {
    root.innerHTML = `<div id="mu-head"></div><div class="mu-top" id="mu-top"></div>
      <div class="mu-body" id="mu-body" tabindex="-1"></div><p class="sr-only" id="mu-live" aria-live="polite"></p>`;
    body = $("#mu-body");
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
      text: (it) => [it.name, it.description, Y.instrument(it.instrument)?.label, Y.status(it.status)?.label, ...it.tracks.map((t) => t.name), ...[].concat(it.artist || [])].filter(Boolean).join(" "),
      url: true,
    });
    const searchHost = document.createElement("div");
    const rowHost = document.createElement("div");
    rowHost.className = "mu-filters";
    // filterRow first so search knows instrument/status chips live in the row (they light up instead of becoming tokens)
    Y.filterRow(rowHost, F, { all: "All", browse: true });
    const longHint = matchMedia("(min-width: 1280px)");
    Y.search(searchHost, F, { placeholder: "Search music", hint: fine.matches });
    const hintInput = $(".ysearch__input", searchHost);
    const paintHint = () => { if (hintInput) hintInput.placeholder = longHint.matches ? "Search music and tracks… try “piano”" : "Search music"; };
    longHint.addEventListener("change", paintHint);
    const topEl = $("#mu-top");
    tools = Y.listTools(F, {
      tools: topEl, search: searchHost, row: rowHost, sticky: body,
      label: "Search and filter music", title: "Find music",
      count: () => `${ITEMS.filter(visible).length} of ${N} shown`,
    });
    function placeChrome() {
      rowHost.classList.toggle("yfilter--wrap", !isDesk() && OPT.mf === "wrap");
      tools.place();
      topEl.classList.add("ytools");
      root.classList.toggle("mu--fab", tools.isFab());
      paintHint();
    }
    function renderHead() {
      $("#mu-head").innerHTML = Y.header({
        title: "Music",
        meta: `${N} releases · ${LIB.tracks.length} tracks`,
        actions: `<button class="btn btn--sm btn--m-icon" type="button" data-shuffle aria-label="Shuffle everything">${ph("shuffle")}<span>Shuffle all</span></button>` +
          (isDesk() ? Y.seg([{ value: "list", label: "Timeline", icon: "ph-rows" }, { value: "grid", label: "Grid", icon: "ph-squares-four" }], { value: OPT.view, label: "Layout", name: "layout" }) : ""),
      });
    }

    /* ---------- in-item match marks ---------- */
    function paintItem(el, it, H) {
      for (const m of $$(".mu-mk[data-mk='status']", el)) m.classList.toggle("is-match", H.status(it));
      const meta = $(".yfolder__tt .ymeta, .ydetail__meta .ymeta", el);
      const hasInst = !!$(".mu-mk[data-mk='inst']", meta || el);
      if (meta && hasInst !== H.inst(it)) {
        if (H.inst(it)) $(".mu-mk[data-mk='status']", meta)?.insertAdjacentHTML("afterend", mk("inst", Y.badge.instrument(it.instrument, { compact: mode === "mlist" && !el.closest(".ydetail") }), true));
        else $(".mu-mk[data-mk='inst']", meta)?.remove();
      }
      for (const tab of $$(".yfolder__tab", el)) { const t = P.resolve(tab.dataset.tid); tab.classList.toggle("is-match", !!t && H.track(t)); }
      for (const b of $$(".mu-trk__t b", el)) { const t = P.resolve(b.closest(".mu-trk").dataset.tid); b.classList.toggle("is-match", !!t && H.track(t)); }
    }
    function paintMatches() {
      const H = hits();
      for (const el of $$(".ygroup__item, .ytl__item", body)) { const it = BY_KEY[el.dataset.key]; if (it && !("yioGhost" in el.dataset)) paintItem(el, it, H); }
      const st = $("#mu-stage");
      if (st && sel && BY_KEY[sel]) paintItem(st, BY_KEY[sel], H);
    }

    /* ---------- GRID · open in place (the kit's Yarn.openInPlace, as Projects) ---------- */
    // where an opened item settles: just under its group's sticky year pill
    function settleY(el) {
      const pill = el.closest(".ygroup")?.querySelector(":scope > .yyear");
      const under = pill ? 10 + pill.offsetHeight + 14 : 18;
      const y = el.getBoundingClientRect().top + scrollY - stickyTop() - under;
      return Math.max(0, Math.min(y, document.documentElement.scrollHeight - innerHeight));
    }
    const panelHTML = (it) => `<section class="ypanel mu-panel" aria-label="${esc(it.name)}">${detailHTML(it, { ctx: "panel", level: 3 })}</section>`;
    io = Y.openInPlace(body, {
      cell: ".ygroup__item", flipSel: "[data-key]",
      closed: (k) => cardHTML(BY_KEY[k]), opened: (k) => panelHTML(BY_KEY[k]),
      settle: settleY, top: () => stickyTop() + 64,
      onOpen(cell, k, { instant }) {
        const t = $(".ydetail__title", cell);
        if (t && !instant) { t.tabIndex = -1; t.focus({ preventScroll: true }); }
        if (!instant) sound("open", { el: cell });
        setParam("item", k);
        sync();
      },
      onClose(cell) {
        sound("close", { el: cell });
        $("[data-open]", cell)?.focus({ preventScroll: true });
        setParam("item", null);
        sync();
      },
    });

    function build() {
      tl?.destroy(); tl = null;
      io.reset();
      hideTip(true);
      mode = modeNow();
      root.dataset.mode = mode;
      const groups = Y.byYear(ITEMS, (it) => it.start);
      const key = (it) => it.key;
      if (mode === "list") {
        body.innerHTML = `<div class="mu-list">
            <div class="mu-tl">${Y.timelineHTML(groups, rowHTML, { key, unit: "release", id: "muy", rule: true, pillKeys: true })}${emptyHTML}</div>
            <div class="mu-stagewrap"><aside class="mu-stage ypanel" id="mu-stage" aria-label="Selected release" tabindex="-1"></aside></div>
          </div>`;
        tl = Y.timeline($(".ytl", body), { ball: true, trail: true });
      } else if (mode === "grid") {
        body.innerHTML = `<div class="mu-grid mu-grid--${OPT.open} mu-grid--c${OPT.gcols}">${Y.yearGroupsHTML(groups, cardHTML, { key, unit: "release", id: "mug", grid: true })}${emptyHTML}</div>`;
      } else {
        body.innerHTML = `<div class="mu-mlist">${Y.yearGroupsHTML(groups, mrowHTML, { key, unit: "release", id: "mum" })}${emptyHTML}</div>`;
      }
      applyVisibility();
      if (mode === "list") selectList(sel && visible(BY_KEY[sel]) ? sel : firstVisible(), { from: "init" });
      sync();
    }
    function render({ animate = false } = {}) {
      if (animate && !RM()) Y.flip(body, "[data-key]", build, { stagger: 10 });
      else build();
    }

    /* ---------- filtering: the kit flip, interruptible (items glide from where they are on screen) ---------- */
    function applyVisibility() {
      const n = Y.filterGroups(body, (k) => visible(BY_KEY[k]), { unit: "release" });
      paintMatches();
      const empty = $(".mu-empty", body);
      if (empty) empty.hidden = n > 0;
      tools.paint();
      return n;
    }
    let liveT = 0;
    F.on(() => {
      let n = 0, drop = false;
      hideTip(true);
      Y.flip(body, "[data-key]", () => {
        n = applyVisibility();
        if (mode === "list") {
          if (!sel || !visible(BY_KEY[sel])) selectList(firstVisible(), { from: "filter" });
          else tl?.refresh({ instant: false });
        } else if (io.current && !visible(BY_KEY[io.current])) drop = true;
      });
      if (drop) { io.collapse(); setParam("item", null); }
      clearTimeout(liveT);
      liveT = setTimeout(() => { $("#mu-live").textContent = n ? `${n} of ${N} releases shown` : "No music matches"; }, 400);
    });

    /* ---------- DESKTOP TIMELINE: select → stage ---------- */
    function markSel(k) {
      for (const el of $$(".ytl__item", body)) {
        const on = el.dataset.key === k;
        $(".yfolder__card", el)?.classList.toggle("is-selected", on);
        $(".yfolder__open", el)?.setAttribute("aria-current", String(on));
      }
    }
    function selectList(k, { from = "click" } = {}) {
      const stage = $("#mu-stage");
      if (!stage) return;
      const prev = sel;
      sel = k;
      markSel(k);
      tl?.select(k, { instant: from === "init" });
      const it = BY_KEY[k];
      if (!it) { stage.innerHTML = `<p class="mu-stage__none muted">Nothing to show. <button type="button" class="ylinkbtn" data-reset>Clear filters</button></p>`; return; }
      if (prev === k && from !== "init" && stage.querySelector(".ydetail")) return;
      stageAnim?.cancel();
      stage.innerHTML = detailHTML(it, { ctx: "stage" });
      stage.scrollTop = 0;
      paintItem(stage, it, hits());
      if (prev && prev !== k && !RM() && from !== "init") {
        const dir = ITEMS.indexOf(it) > ITEMS.indexOf(BY_KEY[prev]) ? 1 : -1;
        const sp = Y.springEasing({ response: 0.36 });
        stageAnim = stage.firstElementChild.animate([{ opacity: 0, transform: `translateY(${dir * 14}px)` }, { opacity: 1, transform: "none" }], { duration: sp.duration, easing: sp.easing });
      }
      if (from === "click") sound("open", { el: itemEl(k) });
      if (from !== "init") setParam("item", k);
    }
    const visibleRows = () => $$(".ytl__item", body).filter((r) => !r.hidden && !r.closest("[hidden]"));

    /* ---------- events ---------- */
    body.addEventListener("click", (e) => {
      if (e.target.closest("[data-reset]")) { F.clear(); sound("chip-off"); return; }
      if (e.target.closest("[data-close]")) { io.close(); return; }
      const s = e.target.closest("[data-pick]"); // (not data-sel: <html data-sel> is the kit's selection style)
      if (s) { selectList(s.dataset.pick); return; }
      const op = e.target.closest("[data-open]");
      if (op) { e.preventDefault(); io.toggle(op.dataset.open); return; }
      const nav = e.target.closest("[data-nav]");
      if (nav && !(e.metaKey || e.ctrlKey || e.shiftKey)) sound("open", { el: nav });
    });
    document.addEventListener("ychange", (e) => {
      if (e.detail.name !== "layout") return;
      OPT.view = e.detail.value;
      setParam("view", OPT.view === "list" ? null : OPT.view);
      setParam("item", OPT.view === "list" ? sel : null);
      render({ animate: true });
    });
    document.addEventListener("keydown", (e) => {
      if (Y.lightbox?.isOpen || e.defaultPrevented || menu.isOpen) return;
      if (e.key === "Escape") {
        if (P.view === "panel") return;
        if (tools.fab?.isOpen) { tools.fab.close({ focus: true }); return; }
        if (io.current && !e.target.closest?.(".ybrowse, .ysearch")) { e.preventDefault(); io.close(); }
        return;
      }
      if (mode !== "list" || e.metaKey || e.ctrlKey || e.altKey) return;
      const jump = e.key === "Home" ? -Infinity : e.key === "End" ? Infinity : 0;
      const dir = jump || (e.key === "ArrowDown" || e.key === "j" ? 1 : e.key === "ArrowUp" || e.key === "k" ? -1 : 0);
      if (!dir) return;
      const t = e.target;
      if (t.closest?.("input, textarea, select, [contenteditable='true'], .ybrowse, .yfolder__tabs, yarn-player")) return;
      if (!(t === document.body || t.closest?.(".mu-tl, .mu-stage"))) return;
      e.preventDefault();
      const rows = visibleRows();
      const i = rows.findIndex((r) => r.dataset.key === sel);
      const next = rows[Math.max(0, Math.min(rows.length - 1, jump ? (jump > 0 ? rows.length - 1 : 0) : i + dir))];
      if (!next || next.dataset.key === sel) return;
      $(".yfolder__open", next)?.focus({ preventScroll: true });
      const r = next.getBoundingClientRect(), topRoom = 70, botRoom = Y.px("--bottom-ui") + 16;
      const dy = r.top < topRoom ? r.top - topRoom : r.bottom > innerHeight - botRoom ? r.bottom - (innerHeight - botRoom) : 0;
      if (dy) scrollBy({ top: dy, behavior: RM() || jump ? "auto" : "smooth" });
      selectList(next.dataset.key, { from: "key" });
    });
    // the player's "collection" link: show it here instead of reloading the page
    addEventListener("yarnplayer:collection", (e) => {
      const it = BY_KEY[e.detail.key];
      if (!it) return;
      e.preventDefault();
      if (!visible(it)) F.clear();
      if (mode === "list") { selectList(it.key); itemEl(it.key)?.scrollIntoView({ block: "center", behavior: RM() ? "auto" : "smooth" }); }
      else if (mode === "grid" && OPT.open === "inline") io.open(it.key);
      else location.href = pageHref(it);
    });

    /* ---------- boot ---------- */
    const want = BY_KEY[params.get("item")] ? params.get("item") : null, focus = BY_KEY[params.get("focus")] ? params.get("focus") : null;
    if (want || focus) sel = want || focus;
    renderHead();
    placeChrome();
    render();
    if (want && mode === "grid" && OPT.open === "inline" && visible(BY_KEY[want])) io.open(want, { instant: true });
    else if (mode === "list" && sel) {
      const el = itemEl(sel), r = el?.getBoundingClientRect();
      if (r && (r.top < 80 || r.bottom > innerHeight - 120)) scrollTo(0, Math.max(0, r.top + scrollY - innerHeight * 0.35));
      if (focus) $(".yfolder__open", el)?.focus({ preventScroll: true });
    } else if (want || focus) {
      // back from an item page (or a ?item= link on a phone): the release is in view and focused
      const el = itemEl(focus || want);
      el?.scrollIntoView({ block: "center" });
      $(".yfolder__open", el || document.createElement("i"))?.focus({ preventScroll: true });
      if (want && mode !== "grid") setParam("item", null);
    }
    if (focus) setParam("focus", null);
    tl?.refresh();
    desk.addEventListener("change", () => { renderHead(); placeChrome(); render(); });
    // the timeline's knots move when fonts land (row heights change): keep the ball on its knot
    document.fonts?.ready.then(() => tl?.refresh());

    Y.mockPanel([
      { label: "Desktop layout", param: "view", options: [["list", "Timeline + stage"], ["grid", "Grid by year"]], default: "list" },
      { label: "Grid: open an item", param: "open", options: [["inline", "In place"], ["page", "Its own page"]], default: "inline" },
      { label: "Grid: columns", param: "gcols", options: [["auto", "4 from 1320px, else 2"], ["2", "Always 2 (Projects' cards)"]], default: "auto" },
      { label: "Phone filters (msearch=bar)", param: "mf", options: [["wrap", "Two lines, no scroll"], ["scroll", "One line, scrolls"]], default: "wrap" },
      { label: "State: release", param: "item", options: [["", "None"], ["revealed", "Revealed (collection)"], ["the-5th-beepbox-tournament", "5th Beepbox (6 tracks)"], ["cast-adrift", "cast adrift (single)"], ["village-night-symphony-cover", "Village Night (with an artist)"]], default: "" },
      { label: "State: search FAB (phones)", param: "fab", options: [["", "Closed"], ["open", "Open"]], default: "" },
      { label: "Player view", param: "player", options: [["", "Saved"], ["disc", "Disc"], ["bar", "Bar"], ["panel", "Panel"]], default: "" },
      { label: "Disc label", param: "disc", options: [["swatch", "Yarn swatch"], ["cat", "Red cat"]], default: "swatch" },
      { label: "Demo playing", param: "demo", options: [["", "Off"], ["1", "On"]], default: "" },
    ], { title: "Music options" });
  }

  /* ============================================================
     CLICKS anywhere on the page (cards, rows, the stage, an opened card, the item page)
     ============================================================ */
  document.addEventListener("click", (e) => {
    const t = e.target;
    if (!t.closest?.(".mu")) return;
    const play = t.closest("[data-play]");
    if (play) { const it = BY_KEY[play.dataset.play]; if (it) playItem(it, play); return; }
    const q = t.closest("[data-q]");
    if (q) { queue(q.dataset.q, { el: q }); return; }
    const tr = t.closest("[data-play-track]");
    if (tr) { const tk = P.resolve(tr.dataset.playTrack); playTrack(itemOfTrack(tk), tk, tr.closest(".mu-trk")); return; }
    const tab = t.closest(".yfolder__tab");
    if (tab) {
      const f = tab.closest(".yfolder"), it = BY_KEY[f?.dataset.folder], tk = P.resolve(tab.dataset.tid);
      if (tk?.url) playTrack(it, tk, tab); else $(".yfolder__open", f)?.click();
      return;
    }
    const cp = t.closest("[data-copy]");
    if (cp) { const it = BY_KEY[cp.dataset.copy]; if (it) copyLink(it, cp); return; }
    if (t.closest("[data-shuffle]")) {
      const all = ITEMS.flatMap((i) => i.playable);
      P.setShuffle(true);
      P.play(all[Math.floor(Math.random() * all.length)], all);
      sound("play", { el: t.closest("[data-shuffle]") });
    }
  });

  sync();
})();
