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
   i5       grid opens on its own page by default (G6) · cards never gain an instrument badge (M1); the opened release
            names it, coloured (M2, ?mtype=color|plain) · the playing bars live inside the play button (M3) · the tab
            tip is the name only (M5) · tabs = songs with audio in the result (M7) ·
            one tab left → "Collection — Song" single card (M8) · ⚙ groups tagged open / state (G1)
   i5 r2    M6 corrected (owner: the tabs already list the songs; what's missing is a song's NOTES without opening the
            expanded player): ?songnotes=face|rows|sheet · ?track=<id> opens that song's notes
   i6       mtype · songnotes · disclong · pnotes decided (Earlier) · M2 no "no notes": a song without notes leaves the
            face card its own text (the tab tip names it) · M3 "Collection - Song" · M4 ?trackmatch=hide|fade|mark (Open)
            · M6 the timeline's passed rings (kit, as Projects) · O1 Yarn.cardMeta (instrument · status · date) · P4
            Yarn.gridYears in the grid · M7 ?pwip= lives in kit/player.js (its ⚙ group is here)
   i7       B1 track rows on fixed columns (trackCols) · M1 no instrument on cards · M2 trackmatch=fade decided (grey,
            no name chip) · M3 pwip=wip decided · M5 search reads song notes (a notes match shows its passage)
   i10      (DESIGN-i10, FEEDBACK-i10 M1–M9) M1 the header is the title + the view switch; a RESULTS LINE between the
            tools and the list names what's shown ("3 releases · 6 tracks for “shadow”") and holds ▶ Play · ⤮ Shuffle
            (kit ?shuffle=player: Shuffle is the player bar's mode, the line keeps ▶ Play) · M2 the queue is exactly
            what's shown: shownQueue() (a collection shown only for some songs plays only those; one that matched itself
            plays all) is what Play, Shuffle, ▶ on a card / row, a tab, "+", Play next and the player's next / previous
            use · M3 the folder card (kit Yarn.folder): one left edge, art top-right (kit ?cardart=), Title + one Meta
            line, link discs left, + and ▶ right (kit Yarn.playBtn) · M4 the grid's gap is --gutter across and down; the
            tabs live inside the card's box (bandRows lines titles up in a row) · M5 live = the only solid accent
   i10 r2   (cards, FEEDBACK-i10 C1–C3) i8's card again: the tabs hang above the card, joined to it (a row with a
            collection keeps that room above every card: bandRows → .is-band), the art top-left beside the Title + Meta,
            the text and the foot across the full width · ▶ is the biggest button again (44; + and the link discs 32) ·
            the face's song name is a run at the start of its notes (Body 600) · ?cardart is gone (decided)
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
    // i5 (owner, G6): grid items open on their own page; in place is one click away under Earlier
    open: pick("open", ["inline", "page"], "page"),
    mf: pick("mf", ["wrap", "scroll"], "wrap"),
    gcols: pick("gcols", ["auto", "2"], "auto"),
    // i5 · M2: instrument colours (kit/yarn.css "instrument colours") · plain = i4's neutral chips + badges
    mtype: pick("mtype", ["color", "plain"], "color"),
    // i5 r2 · M6 (corrected): reading a SONG's notes without the expanded player.
    //   face  = rows, + a grid card's text follows the tab under the pointer or focus (else the song that's playing)
    //   rows  = in the opened collection (stage · release page · opened card) a row's caret unrolls its notes in place
    //   sheet = a notes button (rows · a grid card's foot · the long-press menu) opens a popover (phones: a sheet
    //           from the bottom edge) with the notes, play, queue and links; ‹ › step through the collection's notes
    songnotes: pick("songnotes", ["face", "rows", "sheet"], "face"),
    // i6 · M4 (owner: "if multiple match a search … filter out the rest or at least show stronger that the other ones
    // are not included … maybe faded out or darker … try multiple"): the opened collection while a search or a
    // "Listen on" filter narrows its songs (the same songs the card's tabs keep).
    //   hide = the rest fold away; the head says "2 of 4 match · Show all" · fade = the rest stay, faded
    //   mark = every row stays; the matches get the in-card match look on the whole row
    // i7 · M2 (decided: fade, restyled): the rest go grey (not i6's tan) and a match's name gets no chip behind it
    trackmatch: pick("trackmatch", ["hide", "fade", "mark"], "fade"),
    // i7 follow-up (owner: "i wonder if we can combine play and the music icon on mobile … have an option"), phone rows:
    //   apart  = today: the red play button leads the row, then the art
    //   badge  = the art is the play button; a small red play disc sits on its corner (bars while it plays)
    //   cover  = the art is the play button; a play mark in its middle (a dark round chip, white glyph / bars)
    //   Either way a tap on the art plays, a tap anywhere else on the row opens the release (as today).
    mart: pick("mart", ["apart", "badge", "cover"], "apart"),
    // i10 · M1 (kit option, Open): where Play / Shuffle live · results = both on the results line · player = Shuffle is
    // the player bar's mode toggle (kit/player.js .yp-bshuf), the line keeps ▶ Play
    shuffle: Y.opts.shuffle === "player" ? "player" : "results",
  };
  document.documentElement.dataset.mart = OPT.mart;
  document.documentElement.dataset.mtype = OPT.mtype;
  document.documentElement.dataset.songnotes = OPT.songnotes;
  document.documentElement.dataset.trackmatch = OPT.trackmatch;
  // ⚙ (i5 · G1 · i6): the open decisions + the demo-state helpers. i6: mtype · songnotes · disclong · pnotes are
  // decided (FEEDBACK-i6 "Decided"): no tag, so they sit under Earlier with their values kept.
  // i7 · M2 + M3: trackmatch (fade) and pwip (redesigned: wip) are decided, so both sit under Earlier now
  // i7 follow-up (owner): the player's controls turn WIP gold while an ongoing song plays · global: it's the kit player
  const OPEN_GROUPS = [
    // i7 follow-up (owner: "the smart year text wasnt done on music"): Projects' P2 is kit-wide now (cards, the opened
    // release, the player's facts); the same group on both pages
    { global: true, label: "Status + date (P2)", param: "statusdate", options: [["joined", "Joined: (✓) Completed Dec 2024 · (hammer) WIP since Sep 2025 (decided i8)"], ["apart", "Apart: (✓) Complete · Aug – Dec 2024"]], default: "joined" },
    { global: true, label: "Phone list · rows or cards", param: "phrow", options: [["card", "Cards: a bigger image and two lines of the description (decided i8)"], ["row", "Rows: image, name, facts (i7)"]], default: "card" },
    { label: "Phone rows · play and the art", param: "mart", options: [["apart", "Apart: the play button leads the row (decided i8)"], ["badge", "The art plays: a red play badge on its corner"], ["cover", "The art plays: a play mark in its middle"]], default: "apart" },
    { global: true, label: "Player · controls on a WIP song", param: "pwipc", options: [["gold", "Gold while a WIP song plays (decided i8)"], ["red", "Red, like every song"]], default: "gold" },
  ];
  const DECIDED_GROUPS = [
    { label: "Opened collection while searching (M4)", param: "trackmatch", options: [["fade", "Every song; the rest grey"], ["hide", "Only the matches · “2 of 4 match · Show all”"], ["mark", "Every song; the matches marked"]], default: "fade" },
    { label: "Player · an ongoing song (M7)", param: "pwip", global: true, options: [["wip", "A plain “WIP” mark (hammer, gold): bar · disc (not on the art)"], ["tag", "Ongoing tape: bar title · a label on the art · a pin on the disc"], ["seam", "The player's stitching is unfinished: red, it stops at a needle"], ["off", "Only the panel's fact (i5)"]], default: "wip" },
    { label: "Instrument colours (M2)", param: "mtype", options: [["color", "Coloured (piano black · BeepBox purple · DAW blue)"], ["plain", "Plain (i4)"]], default: "color" },
    { label: "A song's notes without the player (M6)", param: "songnotes", options: [["face", "Rows unroll · a grid card shows the hovered or playing song's notes"], ["rows", "Rows unroll in the opened collection"], ["sheet", "A notes button: popover (phones: a sheet) with play + links"]], default: "face" },
    { label: "Player · long-press the disc (MP1)", param: "disclong", options: [["actions", "Play · mute · next float beside it"], ["off", "Nothing (i4)"]], default: "actions" },
    { label: "Player · song vs collection notes (MP3)", param: "pnotes", options: [["divider", "One column, a labelled divider"], ["tabs", "Two tabs: This song · The collection"]], default: "divider" },
  ];
  const STATE_GROUPS = [
    { label: "Player view", param: "player", options: [["", "Saved"], ["disc", "Disc"], ["bar", "Bar"], ["panel", "Panel"]], default: "", state: true },
    { label: "Demo playing", param: "demo", options: [["", "Off"], ["1", "On"], ["vgm-class_combat", "On · a collection song"], ["cast adrift", "On · a single"], ["revealed_libterrene", "On · an ongoing song (M7)"], ["revealed_revealed", "On · the last song of the queue (MP1)"]], default: "", state: true },
  ];
  // i5 r2 · M6: a song's notes open (rows / face: unrolled · sheet: the popover). Alphabet City is the release the
  // timeline selects and the item page shows by default, and its songs have the longest notes
  const TRACK_GROUP = { label: "State: a song's notes open (M6)", param: "track", options: [["", "None"], ["abc_uncovering", "uncovering the truth… (3 paragraphs)"], ["abc_escaping", "escaping the shadow… (the longest)"]], default: "", state: true };
  const desk = matchMedia("(min-width: 960px)");
  const isDesk = () => desk.matches;
  const fine = matchMedia("(pointer: fine)");
  const fmt = P.meta.fmt;
  const ph = (n, w = "bold") => `<i class="ph-${w} ph-${n}" aria-hidden="true"></i>`;

  /* ---------------- data: the player's library (same ids, same tracks) ---------------- */
  const LIB = P.library;
  /* i10 · M9 (i9's "Carry to the site", music S9 + S10): a collection's status / start / end come from its songs
     (Yarn.musicFacts: WIP if any song is, earliest start, latest finish), and the list is the site's Music order
     (Yarn.musicOrder, the mode Studio publishes; "finished" = the old site's: WIP on top, then the newest finish;
     Dropped with no finish by its start; ties A–Z). The year pills are the order's own years (WIP = this year).
     ?mcomplete=start (kit, Open since i9) sorts a Complete release by its start instead. */
  const ORDER_MODE = "finished";
  const ITEMS = Y.musicOrder(LIB.entries.map((e) => {
    const coll = e.kind === "collection";
    const tracks = coll ? e.tracks : [e];
    const f = coll ? Y.musicFacts(e) : null;
    const status = f?.status || e.status, start = f?.start || e.start, end = coll ? f.end : e.end;
    const d = Y.parseDate(start);
    return {
      key: e.key, kind: coll ? "collection" : "single", name: e.name, instrument: e.instrument, status, start, end,
      description: e.description || "", src: coll ? { ...e.src, status, start, end } : e.src, entry: e, tracks, playable: tracks.filter((t) => t.url),
      on: [...new Set(tracks.flatMap((t) => Object.keys(t.links || {})))], artist: e.artist || null,
      year: d ? d.getFullYear() : 0, t: d ? +d : 0,
    };
  }), ORDER_MODE);
  for (const it of ITEMS) it.year = Y.musicOrder.key(it, ORDER_MODE).year ?? it.year; // (the Year filter = the pills' years)
  const BY_KEY = Object.fromEntries(ITEMS.map((i) => [i.key, i]));
  const N = ITEMS.length;
  const plain = (s) => String(s || "").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/\*\*|__|^#+\s*/gm, "").replace(/\s+/g, " ").trim();
  const sw = (t, size, radius) => Y.swatchHTML({ instrument: t.instrument, url: t.url || undefined, name: t.name }, { size, radius });
  const isCurrent = (it) => { const t = P.state.track; return !!t && (it.kind === "collection" ? t.collectionId === it.entry.id : t === it.entry); };
  const itemOfTrack = (tk) => (tk?.collectionId ? ITEMS.find((i) => i.entry.id === tk.collectionId) : ITEMS.find((i) => i.entry === tk)) || null;
  const trackName = (it, t) => (it.kind === "collection" ? t.name.replace(/^0*(\d+)\s*-\s*/, (m, d) => (+d === t.index ? "" : m)) : t.name);

  /* ---------------- URLs (kit + page options and filters ride along between the list and a page) ---------------- */
  const CARRY = ["sel", "rope", "body", "bg", "nav", "toggle", "soundui", "reduced", "view", "open", "gcols", "msearch", "mf", "player", "disc", "demo", "instrument", "status", "kind", "year", "on", "q",
    "mtype", "songnotes", "disclong", "pnotes", "mnav", "uisnd", "toast", "dlayout", "dnav", "stagealign", "dfoot",
    "trackmatch", "pwip", "pwipc", "statusdate", "mart", "phrow", "passed", "cardmeta", "gridyears", "theme",
    "look", "stitch", "font", "shuffle", "taccent"]; // i6 (i8 · DK: + theme) · i10: the design pass's kit options (r2: cardart went)
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
  // i10 · M2: a release's "+" (and Play next / Add to queue) takes the songs it SHOWS: a collection narrowed by the
  // search or filters adds only the songs its tabs keep (shownSongs); the release page has no filters (all of them)
  const qTracks = (ref) => {
    const i = ref.indexOf(":"), k = ref.slice(0, i), v = ref.slice(i + 1);
    if (k === "track") { const t = P.resolve(v); return t ? [t] : []; }
    return BY_KEY[v] ? shownSongs(BY_KEY[v]) : [];
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
  // i10 r2 · cards · C2 (owner: "make play the biggest button again"): on a card, a row and a phone card the "+" is i8's
  // 32px disc again (the link discs' size; touch reaches 44 through the kit's hit area), so ▶ (44) is the biggest button
  function qBtn(ref, { big = false } = {}) {
    const { tr, on } = qInfo(ref), name = esc(qName(ref));
    const off = tr.length ? "" : " disabled";
    if (big) return `<button type="button" class="btn mu-q mu-q--big" data-q="${esc(ref)}" aria-pressed="${on}"${off}>${ph(on ? "check" : "list-plus")}<span class="mu-q__l">${on ? "In queue" : "Add to queue"}</span></button>`;
    const cls = "ylinkicon ylinkicon--sm mu-q";
    return `<button type="button" class="${cls}" data-q="${esc(ref)}" aria-pressed="${on}" aria-label="${on ? `${name} is in the queue. Take it out` : `Add ${name} to the queue`}" title="${on ? "In the queue" : "Add to queue"}"${off}>${ph(on ? "check" : "plus")}</button>`;
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

  /* ---------- toast: the kit's (Yarn.toast: one at a time, above the bottom chrome, Undo; i7 · C1 · this page had its
     own copy of it) ---------- */
  const toast = (o) => Y.toast(o);

  /* ============================================================
     BITS
     ============================================================ */
  // the primary action: a round red play / pause (cards, rows); details get the labelled one ("Play all"), which
  // keeps its width while it's the current one and shows only the icon (owner, Music 5: no "Pause" text)
  // i5 · M3 (owner: "put the moving bars … in the icon similar to the playlists in thoughts"): while it plays, white
  // bars stand in the icon's own slot (hover / focus shows ⏸, the action); nothing beside the button appears or moves
  // what a play button plays: the release, or (a collection shown as a single card, M8) one of its tracks
  const playTarget = (b) => (b.dataset.playTrack ? P.resolve(b.dataset.playTrack) : null);
  /* i10 · M3 + M5 (R2, R7): the kit's ONE play button (Yarn.playBtn): at rest it is act (white disc, ink ▶), the
     current release paused = act + a live ring, playing = the live fill with the kit's bars (⏸ on hover / focus).
     i10 r2 · C2: 44 on every card, row and phone card (i8's size: the biggest button); size "sm" (36) is left for
     whoever wants it. .is-cur / .is-on stay for the pages' own CSS.
     The big one (the opened release) is the labelled pill, the one primary per view: "Play all" / "Play" → "Pause"
     while it plays → "Play" when paused (i7 follow-up: ▶ / ⏸, no bars, like Thoughts). */
  const playState = (cur, on) => (on ? "playing" : cur ? "current" : "");
  function playBtn(it, { big = false, track = null, size = "" } = {}) {
    const cur = track ? P.state.track === track : isCurrent(it), on = cur && P.state.playing;
    const name = track ? trackName(it, track) : it.name;
    const label = it.kind === "collection" && !track ? "Play all" : "Play";
    const aria = `${on ? "Pause" : cur ? "Play" : label} ${name}`;
    const st = `${cur ? " is-cur" : ""}${on ? " is-on" : ""}`;
    const attrs = `data-play="${esc(it.key)}"${track ? ` data-play-track="${esc(track.id)}"` : ""}`;
    if (big) return Y.playBtn({ state: playState(cur, on), label: on ? "Pause" : cur ? "Play" : label, primary: true, eq: false, cls: `mu-play mu-play--big${st}`, attrs, aria });
    return Y.playBtn({ state: playState(cur, on), sm: size === "sm", cls: `mu-play${st}`, attrs, aria });
  }
  function paintPlay(b) {
    const it = BY_KEY[b.dataset.play]; if (!it) return;
    const tk = playTarget(b);
    const cur = tk ? P.state.track === tk : isCurrent(it), on = cur && P.state.playing;
    const label = it.kind === "collection" && !tk ? "Play all" : "Play";
    const state = playState(cur, on), big = b.classList.contains("mu-play--big");
    if (b.dataset.state !== state || big) Y.playBtn.set(b, state, { label: big ? (on ? "Pause" : cur ? "Play" : label) : undefined, aria: `${on ? "Pause" : cur ? "Play" : label} ${tk ? trackName(it, tk) : it.name}` });
    b.classList.toggle("is-cur", cur);
    b.classList.toggle("is-on", on);
  }
  const copyBtn = (it, { sm = false } = {}) => Y.copyBtn(shareURL(it), { label: `Copy a link to ${it.name}`, sm }); // i7 · C1: the kit's copy button
  // link openers on cards are smaller than the play button (owner, Music 4); they keep the brand fade (kit)
  // i10 · M3 (R7): the kit's one link disc at 32px (Yarn.linkIcon sm), in the player's link order
  const smLinks = (t) => Object.entries(t?.links || {}).filter(([k, u]) => u && P.meta.LINKS[k]).map(([k, u]) => Y.linkIcon(k, u, null, { sm: true })).join("");

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
  // i6 · O1 (owner: cards match the opened item's facts, "status and year really goes together"; ?cardmeta=facts|badges,
  // the kit's Open option): the kit's Yarn.cardMeta. facts: instrument · status · date (the instrument's disc in its
  // colour; ongoing = the icon-only gold WIP disc; phone rows icon-only) · badges: i5's cards, status · date (i5 · M1: the
  // swatch says the instrument). data-mk="instrument|status" carries the match mark while filtering.
  // i7 · M1 (owner: "we dont need the piano/beepbox/daw tags since the icons tell u which type it is"): no card
  // (grid · timeline row · phone row) names the instrument; the swatch says it. The opened release keeps it.
  const cardMetaHTML = (it, H = NOHITS, { compact = false } = {}) =>
    Y.cardMeta({ ...it.src, instrument: it.instrument, status: it.status }, { parts: ["status", "date"], compact, match: { status: H.status(it) } });

  /* ---------- which songs a collection shows (i5 · M7 + M8) ----------
     A tab is for playing, so tabs = the songs with audio that are in the current result: every word of the search
     is in the release's own text or in that song's name (a search that only matches the release keeps them all), and
     a "Listen on" filter keeps the songs you can hear there. One tab left → the folder is a single card,
     "Collection — Song" (the owner's original design, src/components/Music/MusicCard.svelte). */
  const low = (s) => String(s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");
  const ownText = (it) => low([it.name, it.description, Y.instrument(it.instrument)?.label, Y.status(it.status)?.label, ...[].concat(it.artist || [])].filter(Boolean).join(" "));
  function trackIn(it, t) {
    if (!F) return true;
    const on = F.state.on;
    if (on?.size && ![...on].some((v) => t.links?.[v])) return false;
    // i10 · M2: an instrument / status filter keeps the songs that are that instrument / status (a mixed collection is
    // shown for some of its songs: it plays those; a song without its own falls back to the collection's)
    const ins = F.state.instrument, sts = F.state.status;
    if (ins?.size && !ins.has(Y.instrument(t.instrument || it.instrument)?.key || "")) return false;
    if (sts?.size && !sts.has(Y.status(t.status || it.status)?.key || "")) return false;
    const words = low(F.q).trim().split(/\s+/).filter(Boolean);
    if (!words.length) return true;
    // i7 · M5 (owner: "search should also match text in the description"): a song's notes count as its text too
    const mine = it._own ??= ownText(it), tt = t._txt ??= low(`${t.name} ${[].concat(t.artist || []).join(" ")} ${plain(t.description || "")}`);
    return words.every((w) => mine.includes(w) || tt.includes(w));
  }
  /* i7 · M5: a song that's in the result because of its NOTES (a typed word the name doesn't have) shows, as its one
     line, the passage that matched (not the start of the notes), the words underlined in ink: full strength, no fill */
  function noteSnip(t) {
    if (!F || !hasNotes(t)) return null;
    const words = low(F.q).trim().split(/\s+/).filter((w) => w.length >= 2);
    const name = low(`${t.name} ${[].concat(t.artist || []).join(" ")}`), line = noteLine(t), ln = low(line);
    const w0 = words.filter((w) => !name.includes(w)).map((w) => [w, ln.indexOf(w)]).filter(([, i]) => i >= 0).sort((a, b) => a[1] - b[1])[0];
    if (!w0) return null;
    // from the start of the word ~24 characters before the hit (… when it's not the notes' start)
    let s = Math.max(0, w0[1] - 24);
    if (s > 0) { const sp = line.lastIndexOf(" ", s); s = sp > 0 && w0[1] - sp < 40 ? sp + 1 : s; }
    const cut = line.slice(s), cl = low(cut), hits = [];
    for (const w of words) for (let i = cl.indexOf(w); i >= 0; i = cl.indexOf(w, i + w.length)) hits.push([i, i + w.length]);
    hits.sort((a, b) => a[0] - b[0]);
    let html = "", at = 0;
    for (const [a, b] of hits) { if (a < at) continue; html += esc(cut.slice(at, a)) + `<mark class="mu-hit">${esc(cut.slice(a, b))}</mark>`; at = b; }
    return (s > 0 ? "…" : "") + html + esc(cut.slice(at));
  }
  function tabState(it) {
    if (it.kind !== "collection") return { tabs: [], one: null };
    const tabs = it.playable.filter((t) => trackIn(it, t));
    return { tabs, one: tabs.length === 1 && it.tracks.length > 1 ? tabs[0] : null };
  }

  /* ---------- i10 · M2 · THE QUEUE IS EXACTLY WHAT'S SHOWN (DESIGN-i10 §7) ----------
     owner: "when u search like shadows the queue should play the found items not everything unless it matched the
     collection itself". One rule for Play, Shuffle, ▶ on a card / row / the stage, a tab, "+", Play next / Add to queue:
       shownItems()     the releases the list shows, in the list's order (no search / filter: all of them)
       shownSongs(it)   what a shown release plays: a single itself · a collection whose own text answers the search
                        all its songs with audio · one shown only for some songs exactly those (= the tabs it keeps)
       shownQueue()     every shown release's songs, in order. ▶ on a card starts at that card's first song and goes on
                        through the same set; the player's next / previous stay inside it.
     The release page (no list, no filters) keeps its own: a collection's songs · a single on through the library. */
  const shownSongs = (it) => (it.kind === "collection" ? it.playable.filter((t) => trackIn(it, t)) : it.playable);
  const shownItems = () => (F ? ITEMS.filter((x) => F.test(x)) : ITEMS);
  const shownQueue = () => shownItems().flatMap(shownSongs);
  // the release page: today's rule (its songs; a single plays on through the library from it)
  const pageQueue = (it) => (it.kind === "collection" ? it.playable : ITEMS.slice(Math.max(0, ITEMS.indexOf(it))).flatMap((x) => x.playable));

  /* ---------- i6 · M4: the opened collection while a search / "Listen on" narrows its songs (?trackmatch=) ----------
     The songs in the result are the ones the card's tabs keep (trackIn). Nothing narrowed (no search, a search that
     only matches the release, or one that no single song answers) → the list is as always.
       hide  the rest fold away (the list glides: kit flip on the list, interruptible); the head says "2 of 4 match"
             and "Show all" brings them back (faded) until the search changes
       fade  every song stays; the rest are faded (a hover or focus brings one back up)
       mark  every song stays; each match gets the in-card match look on its whole row */
  function trackSet(it) {
    if (PAGE === "item" || it.kind !== "collection" || !F) return null;
    const ids = it.tracks.filter((t) => trackIn(it, t)).map((t) => t.id);
    return ids.length && ids.length < it.tracks.length ? new Set(ids) : null;
  }
  function paintTrackMatch(root, it, { animate = false } = {}) {
    const wrap = $(".mu-trks-wrap", root), ol = wrap && $(".mu-trks", wrap);
    if (!ol) return;
    const set = trackSet(it), sig = set ? [...set].join(",") : "";
    if (wrap.dataset.sig !== sig) { wrap.dataset.sig = sig; wrap.classList.remove("is-all"); } // a new search: matches first
    const all = wrap.classList.contains("is-all"), hide = OPT.trackmatch === "hide";
    wrap.classList.toggle("is-narrow", !!set);
    const c = $(".mu-trks-c", wrap), b = $(".mu-trks-all", wrap);
    if (c) c.textContent = set ? `${set.size} of ${it.tracks.length} match` : c.dataset.all;
    if (b) {
      b.hidden = !(set && hide);
      b.setAttribute("aria-pressed", String(all));
      b.textContent = all ? "Only the matches" : `Show all ${it.tracks.length}`;
    }
    const mutate = () => {
      for (const li of ol.children) {
        if (li.dataset.yghost != null) continue; // (a row fading out: the kit flip's ghost)
        const out = !!set && !set.has(li.dataset.tk);
        li.classList.toggle("is-out", out);
        li.classList.toggle("is-in", !!set && !out);
        li.hidden = hide && out && !all;
        // i7 · M5: a song in the result because of its notes shows the passage that matched as its one line
        const sm = $(".mu-trk__t > small.is-np", li), t = sm && !out ? P.resolve(li.dataset.tk) : null;
        if (sm) {
          const snip = t ? noteSnip(t) : null;
          if (snip) { sm.innerHTML = snip; sm.classList.add("is-snip"); }
          else if (sm.classList.contains("is-snip")) { sm.textContent = noteLine(P.resolve(li.dataset.tk)); sm.classList.remove("is-snip"); }
        }
      }
    };
    if (animate && hide && !RM()) Y.flip(ol, ":scope > li", mutate, { key: (li) => li.dataset.tk || null, stagger: 0 });
    else mutate();
  }

  /* ---------- a song's notes (i5 r2 · M6, ?songnotes=face|rows|sheet) ---------- */
  const hasNotes = (t) => !!String(t?.description || "").trim();
  const two = (t) => String(t.index || 1).padStart(2, "0");
  // the notes on one line (a row's start of them, the face): no "> " quote marks
  const noteLine = (t) => plain(String(t?.description || "").replace(/^\s*>\s?/gm, ""));
  // the notes as text to read: the player's tiny markdown, plus "> " lines as one quote (Revealed's poem)
  function notesMD(src) {
    const out = [];
    for (const l of String(src || "").trim().split("\n")) {
      const q = /^\s*>/.test(l), last = out[out.length - 1];
      if (last && last.q === q) last.lines.push(q ? l.replace(/^\s*>\s?/, "") : l); else out.push({ q, lines: [q ? l.replace(/^\s*>\s?/, "") : l] });
    }
    return out.map((s) => (s.q ? `<blockquote>${P.meta.md(s.lines.join("\n"))}</blockquote>` : P.meta.md(s.lines.join("\n")))).join("");
  }
  // where "more" (face) and ?track= land: the release's page, with that song's notes open
  const notesHref = (it, t) => `item.html${carry({ id: it.key, track: t.id }, ["q"])}`;
  // sheet: a grid card's foot gets one notes button (the collection's songs with notes, ‹ › between them)
  const sheetBtn = (it) => (OPT.songnotes === "sheet" && it.tracks.some(hasNotes)
    ? `<button type="button" class="ylinkicon ylinkicon--sm mu-nb" data-sheet="${esc(it.key)}" aria-haspopup="dialog" aria-expanded="false" aria-controls="mu-notes" aria-label="Song notes: ${esc(it.name)}" title="Song notes">${ph("note")}</button>` : "");
  // face: the card's text box holds two layers in one cell (the collection's notes · a song's), fixed at 3 lines
  function faceUp(f) {
    const d = $(".yfolder__desc", f);
    if (!d) return;
    const box = document.createElement("div");
    box.className = "mu-face";
    d.replaceWith(box);
    d.classList.add("mu-face__c");
    box.append(d);
    box.insertAdjacentHTML("beforeend", '<div class="mu-face__s"></div>');
    f.dataset.face = "";
  }

  /* ---------- the folder (kit Yarn.folder): grid card · timeline row · phone row ---------- */
  const tpl = document.createElement("template");
  // i10 · M3: the meta line's count: "4 tracks", or while a search / filter narrows the songs "2 of 4 tracks"
  function countText(it) {
    const all = it.tracks.length, n = F ? it.tracks.filter((t) => trackIn(it, t)).length : all;
    return n < all ? `${n} of ${all} tracks` : `${all} track${all === 1 ? "" : "s"}`;
  }
  // one = a track: the collection is down to one tab and shows as that song's single card (M8)
  function folderEl(it, kind, st = tabState(it)) {
    const coll = it.kind === "collection", k = esc(it.key), one = st.one;
    const open = kind === "row" ? { attrs: `data-pick="${k}" aria-controls="mu-stage" aria-current="false"`, label: `Show ${it.name}${one ? `: ${trackName(it, one)}` : coll ? `, ${it.tracks.length} tracks` : ""}` }
      : kind === "card" && OPT.open === "inline" ? { attrs: `data-open="${k}" aria-expanded="false"`, label: one ? `Open ${it.name}: ${trackName(it, one)}` : null }
      : { attrs: `data-href="${esc(pageHref(it))}"`, label: one ? `Open ${it.name}: ${trackName(it, one)}` : null };
    // i10 r2 · C2: ▶ is the biggest button (44) and "+" the 32px disc, as in i8, on cards, rows and phone cards
    const make = (entry, tracks) => {
      tpl.innerHTML = Y.folder(entry, {
        tracks, total: it.tracks.length,
        count: coll && !one, countText: coll && !one ? countText(it) : null,
        current: P.state.track?.id ?? null,
        links: kind === "card" ? (one ? smLinks(one) : coll ? copyBtn(it, { sm: true }) + sheetBtn(it) : smLinks(it.entry)) : "",
        // phone rows stay lean (owner, Projects 7): play only; the queue is a long-press away, and on the release's page
        // (i7 follow-up: ?phrow=card phone cards get the grid's small "+" beside play, at the card's foot)
        action: (kind === "mrow" && Y.opts.phrow !== "card" ? "" : one ? qBtn(`track:${one.id}`) : it.playable.length ? qBtn(`item:${it.key}`) : "") + playBtn(it, { track: one }),
        swatchSize: kind === "card" ? 54 : kind === "row" ? 48 : Y.opts.phrow === "card" ? 56 : 44, // (i10 r2: i8's sizes)
        open,
        meta: cardMetaHTML(it, hits(), { compact: kind === "mrow" }), // i6 · O1
        desc: kind === "card" || (kind === "mrow" && Y.opts.phrow === "card"), // (i7 follow-up: phone cards show 2 lines)
        key: it.key,
      });
      const el = tpl.content.firstElementChild;
      tpl.content.replaceChildren(); // (the template keeps nothing)
      return el;
    };
    // the outer folder is always the collection's (its tabs glide out and back in as filters change)
    const f = make(it.src, coll ? it.playable : []);
    f.dataset.kind = kind;
    // i6 · O1: a fact that shows only its disc (the 4-column grid's instrument, music.css) names itself on hover
    // (i6 fix P2-1: with the kit's quick hint, data-hint, not the slow native title)
    for (const x of f.querySelectorAll(".ymeta--facts > .yfact[data-mk]")) if (!x.dataset.hint) x.dataset.hint = x.textContent.trim();
    if (coll) {
      if (one) {
        // the single card: the song's own swatch, notes and links; the collection's status and dates
        const face = make({ name: trackName(it, one), instrument: one.instrument, url: one.url, description: one.description || it.description, type: "single" }, []);
        // (the collection's strip stays, above the card, its tabs slipped down, so they glide back when the filter changes)
        $(".yfolder__card", f).replaceChildren(...$(".yfolder__card", face).childNodes);
        f.classList.add("is-solo"); f.dataset.solo = one.id;
        // i6 · M3 (owner: "lets remove the emdash just do "-""): "Collection - Song"
        $(".yfolder__name", f).insertAdjacentHTML("afterbegin", `<span class="mu-solo__c">${esc(it.name)}<span aria-hidden="true"> - </span><span class="sr-only">: </span></span>`);
      }
      paintTabs(f, st);
      // (i7 follow-up, owner: "playing something in a collection should show its description similar to how we do in
      // desktop when hovering"): ?phrow=card phone cards take the face too; touch shows the playing song's notes
      if (!one && (kind === "card" || (kind === "mrow" && Y.opts.phrow === "card")) && OPT.songnotes === "face") faceUp(f);
    }
    // its own page: the card's hit area is a real link (middle-click, copy link address)
    if (kind === "mrow") $(".yfolder__foot", f).insertAdjacentHTML("beforebegin", '<i class="ph-bold ph-caret-right mu-go" aria-hidden="true"></i>');
    // ?phrow=card: the description joins the name and facts (the image keeps the left edge)
    if (kind === "mrow" && Y.opts.phrow === "card") { const d = $(".mu-face", f) || $(".yfolder__desc", f), tt = $(".yfolder__head .yfolder__tt", f); if (d && tt) tt.append(d); }
    // ?phrow=card: the foot (+ · play) closes the text column, bottom right, like a grid card's foot
    if (kind === "mrow" && Y.opts.phrow === "card") { const ft = $(".yfolder__foot", f), tt = $(".yfolder__head .yfolder__tt", f); if (ft && tt) tt.append(ft); }
    // ?mart=badge|cover: the row's play button moves onto its art (one 44px target: the art), the foot empties
    if (kind === "mrow" && OPT.mart !== "apart") {
      const sw = $(".yfolder__head > .yswatch", f), pb = $(".yfolder__foot .mu-play", f);
      if (sw && pb) { const w = document.createElement("span"); w.className = "mu-artplay"; sw.replaceWith(w); w.append(sw, pb); }
    }
    const ob = $("button.yfolder__open[data-href]", f);
    if (ob) {
      const a = document.createElement("a");
      for (const at of ob.attributes) if (at.name !== "type" && at.name !== "data-href") a.setAttribute(at.name, at.value);
      a.href = ob.dataset.href; a.dataset.nav = it.key;
      ob.replaceWith(a);
    }
    return f;
  }
  const folderHTML = (it, kind) => folderEl(it, kind).outerHTML;
  const cardHTML = (it) => folderHTML(it, "card");
  const rowHTML = (it) => folderHTML(it, "row");
  const mrowHTML = (it) => folderHTML(it, "mrow");
  // the tabs in the result stand in the strip, re-packed (--i / --n); the rest slip down behind the card
  function paintTabs(f, st) {
    const strip = $(".yfolder__tabs", f); if (!strip) return;
    const show = new Set(st.one ? [] : st.tabs.map((t) => t.id));
    const tabs = $$(".yfolder__tab", strip);
    const n = Math.max(1, show.size);
    let i = 0;
    for (const tab of tabs) {
      const on = show.has(tab.dataset.tid);
      tab.classList.toggle("is-out", !on);
      tab.tabIndex = -1;
      if (on) { tab.style.setProperty("--i", i); tab.classList.toggle("is-r", i >= n / 2); if (!i) tab.tabIndex = 0; i++; }
    }
    strip.style.setProperty("--n", n);
    strip.inert = !show.size;
    if (strip.dataset.yinit != null) Y.fitTabs?.(strip);
  }
  // after a filter change: re-pack the tabs; a folder that becomes (or stops being) a single card swaps its face.
  // Phone + timeline rows: a collection has 22px above it for its tabs, a single doesn't; the row glides that
  // difference instead of jumping (a spring on `translate`, interruptible: it continues from where it is)
  function paintFolder(f, it) {
    const st = tabState(it), was = f.dataset.solo || "", now = st.one?.id || "";
    const n = $(".yfolder__n", f), nt = countText(it); if (n && n.textContent !== nt) n.textContent = nt; // (i10 · M3)
    if (was === now) { paintTabs(f, st); return; }
    const kind = f.dataset.kind, fresh = folderEl(it, kind, st);
    const card = $(".yfolder__card", f), y0 = f.getBoundingClientRect().top;
    card.replaceChildren(...$(".yfolder__card", fresh).childNodes); // (the strip above the card stays, so its tabs glide)
    f.classList.toggle("is-solo", !!now);
    now ? (f.dataset.solo = now) : delete f.dataset.solo;
    f.toggleAttribute("data-face", !!$(".mu-face", f)); // (face: a single card has no song layer; the new face starts fresh)
    f._fh = f._ff = null;
    face.paint(f);
    paintTabs(f, st);
    if (kind !== "card" && !RM()) {
      const dy = y0 - f.getBoundingClientRect().top + (f._ys?.value || 0);
      if (Math.abs(dy) > 0.5) {
        f._ys ||= new Y.Spring(0, { rest: 0.3, onUpdate: (v) => { f.style.translate = Math.abs(v) < 0.05 ? "" : `0 ${v.toFixed(2)}px`; } });
        f._ys.set(dy); f._ys.to(0, { response: 0.4 });
      }
    }
    if (!RM()) { card._fade?.cancel(); card._fade = $(".yfolder__head", card)?.animate([{ opacity: 0.25 }, { opacity: 1 }], { duration: 240, easing: "ease-out" }); }
  }
  /* ---------- the detail (stage · opened card · its own page): title → meta → play / queue / links → tracks → notes ---------- */
  const act = {
    page: (it) => `<a class="ylinkicon" href="${esc(pageHref(it))}" data-nav="${esc(it.key)}" aria-label="Open ${esc(it.name)} as its own page" title="Open as page">${ph("arrow-square-out")}</a>`,
    close: (it) => `<button type="button" class="ylinkicon" data-close aria-label="Close ${esc(it.name)}" title="Close (Esc)">${ph("x")}</button>`,
    prev: (it) => (it ? `<a class="ylinkicon" href="${esc(pageHref(it))}" rel="prev" aria-label="Newer: ${esc(it.name)}" title="${esc(it.name)}">${ph("caret-up")}</a>` : ""),
    next: (it) => (it ? `<a class="ylinkicon" href="${esc(pageHref(it))}" rel="next" aria-label="Older: ${esc(it.name)}" title="${esc(it.name)}">${ph("caret-down")}</a>` : ""),
  };
  /* i7 · B1 (owner: the row's buttons didn't line up; "id rather everything be spaced simmilarly"): a collection's rows
     share fixed columns, the same x on every row whatever a song has: one per link kind the list has (the kind most
     songs have sits nearest the notes, so the holes gather at the outer edge) · notes (when any song has some) · + ·
     the length (as wide as the list's longest, in mono). A song without a link or notes keeps that cell, empty. One gap
     between every button (6px). i6's half-empty row was a song with no audio: no "+" and no length (and the links
     packed right, so its one link sat in another kind's column): now its "+" and length cells hold "no audio". */
  const LINK_ORDER = Object.keys(P.meta.LINKS);
  function trackCols(it) {
    const n = {};
    for (const t of it.tracks) for (const [k, u] of Object.entries(t.links || {})) if (u && P.meta.LINKS[k]) n[k] = (n[k] || 0) + 1;
    const links = Object.keys(n).sort((a, b) => n[a] - n[b] || LINK_ORDER.indexOf(b) - LINK_ORDER.indexOf(a));
    const dn = Math.max(4, ...it.tracks.filter((t) => t.url).map((t) => fmt(P.durationOf(t)).length));
    return { links, notes: it.tracks.some(hasNotes), dn };
  }
  // a track row: n · swatch · name / one line · [links · notes · + · length]; i5 r2 (M6): a song with notes gets a
  // notes button (rows / face: a caret that unrolls the notes under the row, in place · sheet: opens the popover).
  function trackRow(it, t, H, ctx = "x", cols = trackCols(it)) {
    const has = hasNotes(t), slot = cols.notes; // (i7 follow-up: no number column; the art carries ▶ / ⏸)
    const np = !t.artist && has; // the one line is the start of the notes (it gives way when they unroll)
    const sub = t.artist ? `made with ${[].concat(t.artist).join(", ")}` : has ? noteLine(t) : "";
    const now = P.state.track === t, on = now && P.state.playing, name = trackName(it, t);
    const nid = `mun-${ctx}-${t.id}`;
    const SLOT = '<span class="mu-slot" aria-hidden="true"></span>';
    const lk = (k) => (t.links?.[k] ? Y.linkIcon(k, t.links[k], null, { sm: true }) : SLOT);
    // no audio: on a phone (no link columns there) the song's own way to listen stands in the "+" column
    const go = !t.url ? cols.links.slice().reverse().find((k) => t.links?.[k]) : null;
    const add = t.url ? qBtn(`track:${t.id}`) + `<span class="mu-trk__d meta">${fmt(P.durationOf(t))}</span>`
      : `<span class="mu-trk__na meta">no audio</span>${go ? Y.linkIcon(go, t.links[go], null, { sm: true }).replace('class="ylinkicon', 'class="mu-trk__go ylinkicon') : SLOT.replace("mu-slot", "mu-slot mu-trk__go")}`;
    const nb = !has ? (slot ? SLOT : "")
      : OPT.songnotes === "sheet"
        ? `<button type="button" class="ylinkicon ylinkicon--sm mu-nb" data-sheet-track="${esc(t.id)}" aria-haspopup="dialog" aria-expanded="false" aria-controls="mu-notes" aria-label="Notes: ${esc(name)}" title="Notes">${ph("note")}</button>`
        : `<button type="button" class="ylinkicon ylinkicon--sm mu-nb" data-notes="${esc(t.id)}" aria-expanded="false" aria-controls="${esc(nid)}" aria-label="Notes: ${esc(name)}" title="Notes">${ph("caret-down")}</button>`;
    const notes = has && OPT.songnotes !== "sheet"
      ? `<div class="mu-trk__notes" id="${esc(nid)}" role="region" aria-label="Notes: ${esc(name)}" inert><div class="mu-trk__nin"><div class="mu-trk__nx">${notesMD(t.description)}</div></div></div>` : "";
    return `<li data-tk="${esc(t.id)}"><div class="yrow ylift ysel mu-trk${t.url ? "" : " is-off"}${on ? " is-playing" : ""}" data-tid="${esc(t.id)}" aria-current="${now}">
      ${t.url ? `<button type="button" class="mu-trk__btn" data-play-track="${esc(t.id)}" aria-label="${on ? "Pause" : "Play"} ${esc(name)}"></button>` : ""}
      <span class="ytrkart" aria-hidden="true">${sw(t, 40, 10)}${ph(on ? "pause" : "play", "fill")}</span>
      <span class="mu-trk__t"><b${markName && H.track(t) ? ' class="is-match"' : ""}>${esc(name)}</b>${sub ? `<small${np ? ' class="is-np"' : ""}>${esc(sub)}</small>` : ""}</span>
      <span class="mu-trk__acts">${cols.links.length ? `<span class="mu-trk__links">${cols.links.map(lk).join("")}</span>` : ""}${nb}${add}</span>
      ${notes}
    </div></li>`;
  }
  // i7 · M2 (owner: "remove the tan around the text of the matched we dont need both"): with fade, a match's name has
  // no chip (the rest going grey says it); hide / mark (Earlier) keep the in-card match look
  const markName = OPT.trackmatch !== "fade";
  function detailHTML(it, { ctx = "stage", back = null, actions = "", end = "", level = 2, nav = null } = {}) {
    const coll = it.kind === "collection", H = PAGE === "item" ? NOHITS : hits();
    const total = it.playable.reduce((s, t) => s + (P.durationOf(t) || 0), 0);
    const cols = coll ? trackCols(it) : null; // i7 · B1: the list's columns (every row gets the same cells)
    // i6 · M4: the head's count says "2 of 4 match" while a search narrows the songs; hide: + "Show all 4"
    const cAll = `${it.tracks.length} · ${fmt(total)}`;
    const tracks = coll ? `<section class="mu-trks-wrap" aria-labelledby="mut-${esc(it.key)}-${ctx}"><div class="mu-trks-hd"><h3 class="eyebrow mu-trks-h" id="mut-${esc(it.key)}-${ctx}">Tracks <span class="meta mu-trks-c" data-all="${esc(cAll)}">${esc(cAll)}</span></h3><button type="button" class="ylinkbtn mu-trks-all" aria-pressed="false" hidden>Show all</button></div><ol class="mu-trks" style="--mu-dn: ${cols?.dn || 4}">${it.tracks.map((t) => trackRow(it, t, H, ctx, cols)).join("")}</ol></section>` : "";
    // the release head in the one grammar (LAYOUT-i5.md):
    //   facts  instrument · status · date · length · "with …": Yarn.fact (disc + label, one face); data-mk = a match is marked
    //   links  one row, one height: play (primary) · queue · the platforms as secondaries (icon-only past three links)
    const facts =
      // i6 review (P1-4): instrument · status · date, the same order as the cards
      Y.fact.instrument(it.instrument, { cls: H.inst(it) ? "is-match" : "", attrs: 'data-mk="inst"' }) +
      // i7 follow-up: ?statusdate=joined → one fact, "(✓) Completed Dec 2024 · 4 mo" / "(hammer) WIP since Sep 2025"
      (Y.opts.statusdate === "joined" && Y.fact.statusDate({ ...it.src, status: it.status })
        ? Y.fact.statusDate({ ...it.src, status: it.status }, { dur: true, cls: H.status(it) ? "is-match" : "", attrs: 'data-mk="status"' })
        : Y.fact.status(it.status, { cls: H.status(it) ? "is-match" : "", attrs: 'data-mk="status"' }) + Y.fact.date(it.src)) +
      (!coll && it.playable.length ? Y.fact.text("ph-timer", fmt(total)) : ""); // (i7 follow-up: "with …" → the credit line, by:)
    const links =
      (it.playable.length ? (playBtn(it, { big: true }) + qBtn(`item:${it.key}`, { big: true })).replace(/class="btn /g, 'class="btn btn--d ') : "") +
      (coll ? "" : Object.entries(it.entry?.links || {}).filter(([, u]) => u).map(([k, u]) => Y.dlink({ href: u, kind: k })).join(""));
    return Y.detail({
      back, actions: actions || `${act.page(it)}${copyBtn(it)}${ctx === "panel" ? act.close(it) : ""}`, level, end, nav,
      kicker: `<span class="mu-art">${sw(it.src, 64, 14)}</span>`,
      title: it.name, by: it.artist ? `made with <b>${[].concat(it.artist).join(", ")}</b>` : "", media: tracks, body: it.description ? P.meta.md(it.description) : "",
      facts, links, linksLabel: "Listen", // (linksLabel: Earlier's side rail names the section)
      id: `mud-${it.key}-${ctx}`,
    });
  }

  /* ============================================================
     PLAY
     ============================================================ */
  // i10 · M2: ▶ on a release starts at its first shown song and goes on through what's shown (shownQueue)
  function playItem(it, btn) {
    if (isCurrent(it)) { const was = P.state.playing; P.toggle(); sound(was ? "pause" : "play", { el: btn }); return; }
    const own = PAGE === "item" ? it.playable : shownSongs(it);
    if (!own.length) return;
    const q = PAGE === "item" ? pageQueue(it) : shownQueue();
    P.play(own[0], q.includes(own[0]) ? q : own);
    sound("play", { el: btn });
  }
  // a song (a tab, a track row, the notes sheet): from it, through what's shown. A song the search left out (a grey
  // row in the opened collection, trackmatch=fade) plays with its own collection, as it did before i10
  function playTrack(it, t, el) {
    if (!t?.url) return;
    if (P.state.track === t) { const was = P.state.playing; P.toggle(); sound(was ? "pause" : "play", { el }); return; }
    const q = PAGE === "item" ? (it ? pageQueue(it) : []) : shownQueue();
    P.play(t, q.includes(t) ? q : it ? it.playable : undefined);
    sound("play", { el });
  }
  // the results line (M1): ▶ Play = the shown set in order · ⤮ Shuffle = shuffled. With ?shuffle=player the player
  // bar's mode decides, so Play keeps it (and starts on a random song when it's on)
  function playShown({ shuffle = null, el = null } = {}) {
    const q = shownQueue();
    if (!q.length) return;
    if (shuffle != null) P.setShuffle(shuffle);
    const first = P.state.shuffle ? q[Math.floor(Math.random() * q.length)] : q[0];
    P.play(first, q);
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
      const gi = $(".ytrkart > i", row), gw = `ph-fill ph-${on ? "pause" : "play"}`; if (gi && gi.className !== gw) gi.className = gw;
    }
    face.all(); // (M6 face: a card shows the playing song's notes)
    $$(".mu [data-play], .mu-notes [data-play]").forEach(paintPlay);
    $$("[data-q]").forEach(paintQ);
  }
  P.on((_, kind) => { if (kind === "track" || kind === "state" || kind === "queue") sync(); });

  const copyLink = (it, b) => Y.copy(shareURL(it), b); // (the menu's "Copy link"; buttons are the kit's, i7 · C1)

  /* ============================================================
     TAB TIP (owner, Music 3) · one tip for every folder tab, on the page's top layer (fixed), so it never sits
     under the sticky filter row or a year pill: the track's full name. It replaces the kit's CSS hint on this page.
     Mouse hover / keyboard focus. i5 · M5 (owner: "requires too much precision"): no "+" on the tip any more; adding
     to the queue lives in the opened collection (each song + the whole collection) and in the right-click /
     long-press menu, which is aimed at the tab itself.
     ============================================================ */
  const tip = document.createElement("div");
  tip.className = "ytip-own mu-tip"; // i7 · C1: the kit hint's look (.ytip-own); this page only places it over the strip
  tip.hidden = true;
  tip.setAttribute("aria-hidden", "true"); // the tab's own label says the same
  tip.innerHTML = `<span class="mu-tip__t"></span>`;
  document.body.appendChild(tip);
  const tipT = $(".mu-tip__t", tip);
  let tipTab = null, tipHide = 0;
  // a face card (M6) names a song with notes on its face; a song without notes gets the tip (i6 · M2)
  const tipOK = (tab) => !tab.closest("[data-face]") || !noteLine(P.resolve(tab.dataset.tid));
  function showTip(tab) {
    clearTimeout(tipHide);
    if (tipTab && tipTab !== tab) tipTab.classList.remove("is-tip");
    tipTab = tab;
    tab.classList.add("is-tip");
    tipT.textContent = tab.dataset.name || "";
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
    // (M6 face: a card with a face names the song there, so its tabs don't float a tip as well; i6 · M2: unless the
    // song has no notes, when the card keeps its own text and the tip names the song)
    if (tab && !tab.closest(".is-dense, [data-yio-ghost], [data-yghost]") && tipOK(tab)) showTip(tab);
  });
  document.addEventListener("pointerout", (e) => {
    if (!tipTab || e.pointerType === "touch") return;
    const to = e.relatedTarget;
    if (to && (tip.contains(to) || to.closest?.(".yfolder__tab") === tipTab)) return;
    if (e.target.closest?.(".yfolder__tab") === tipTab || tip.contains(e.target)) hideTip();
  });
  document.addEventListener("focusin", (e) => {
    const tab = e.target.closest?.(".mu .yfolder__tab");
    if (tab && tab.matches(":focus-visible") && tipOK(tab)) showTip(tab);
    else if (tipTab && !tip.contains(e.target)) hideTip(true);
  });
  document.addEventListener("focusout", (e) => { if (tipTab && e.target === tipTab && !tip.contains(e.relatedTarget)) hideTip(true); });
  addEventListener("scroll", () => { if (tipTab) hideTip(true); }, { passive: true });

  /* ============================================================
     SONG NOTES (i5 r2 · M6, corrected · owner: "theres no way to access NOTES for the songs without opening the
     expanded player"). The tabs already list the songs; these are ways to read one song's notes (?songnotes=):
       rows, face  the opened collection (stage · release page · opened card): a row's caret unrolls its notes in
                   place; the row's one line gives way to the full text
       face        + a grid card's text follows the tab under the pointer or keyboard focus, else the song that's
                   playing (touch: a tap plays, so the card then shows what you hear); "more" opens the release's
                   page with that song's notes unrolled
       sheet       one popover (phones: a sheet from the bottom edge) with a song's notes, play, queue and links,
                   from a row's notes button, a grid card's foot or the long-press menu; ‹ › step through the notes
     ============================================================ */
  // rows: open / close a row's notes (CSS transitions on grid rows, so a second press turns back from where it is)
  function toggleNotes(b, { open = b.getAttribute("aria-expanded") !== "true", instant = false } = {}) {
    const row = b.closest(".mu-trk"), box = row && $(".mu-trk__notes", row);
    if (!box) return;
    if (instant) { row.classList.add("is-instant"); requestAnimationFrame(() => requestAnimationFrame(() => row.classList.remove("is-instant"))); }
    b.setAttribute("aria-expanded", String(open));
    row.classList.toggle("is-notes", open);
    box.inert = !open;
    if (!instant) sound(open ? "open" : "close", { el: b });
  }

  // face: the song a card shows = the tab under the pointer (held while the pointer stays on the folder) · else the
  // tab with keyboard focus (held while focus stays inside, so "more" is one Tab away) · else this collection's
  // playing song · else nothing (the collection's own notes)
  const face = (() => {
    const on = OPT.songnotes === "face";
    function paint(f) {
      const it = BY_KEY[f?.dataset.folder], box = f && $(".mu-face", f);
      if (!it || !box) return;
      const now = P.state.track, cur = now && now.collectionId === it.entry.id ? now.id : "";
      // i6 · M2 (owner: "if the hovered item doesnt have notes dont say "no notes" just remove that text"): a song
      // without notes leaves the card its own text (the tab names it in the tip instead, like any card's tab)
      const want = f._fh || f._ff || cur || "";
      const tid = want && noteLine(P.resolve(want)) ? want : "";
      if ((box.dataset.tid || "") === tid) return;
      const was = !!box.dataset.tid;
      box.dataset.tid = tid;
      box.classList.toggle("is-song", !!tid);
      for (const tab of $$(".yfolder__tab", f)) tab.classList.toggle("is-face", !!tid && tab.dataset.tid === tid); // (its tab stays up a little)
      const t = tid ? P.resolve(tid) : null, s = $(".mu-face__s", box);
      if (!t || !s) return;
      const name = trackName(it, t), txt = noteLine(t);
      // i10 r2 · C1: i8's arrangement again, the song's name leads its notes as a run (Body 600, i10's type role, not a
      // bold display run), so the notes keep every line of the card's text
      s.innerHTML = `<p class="mu-face__x"><b class="mu-face__h">${esc(name)}</b> ${esc(txt)}</p>` +
        `<a class="mu-face__more" href="${esc(notesHref(it, t))}" data-nav="${esc(it.key)}" aria-label="All of ${esc(name)}'s notes">more</a>`;
      const x = $(".mu-face__x", s), more = $(".mu-face__more", s);
      if (more) more.hidden = x.scrollHeight <= x.clientHeight + 1; // only when the 3 lines cut it
      if (was && !RM()) { s._a?.cancel(); s._a = s.animate([{ opacity: 0.3 }, { opacity: 1 }], { duration: 180, easing: "ease-out" }); }
    }
    if (on) {
      const faceOf = (n) => n?.closest?.(".mu .yfolder[data-face]");
      document.addEventListener("pointerover", (e) => {
        if (e.pointerType === "touch") return;
        const tab = e.target.closest?.(".yfolder__tab:not(.is-out)"), f = tab && faceOf(tab);
        if (f && f._fh !== tab.dataset.tid) { f._fh = tab.dataset.tid; paint(f); }
      });
      document.addEventListener("pointerout", (e) => {
        const f = faceOf(e.target);
        if (f && f._fh && !f.contains(e.relatedTarget)) { f._fh = null; paint(f); }
      });
      document.addEventListener("focusin", (e) => {
        const tab = e.target.closest?.(".yfolder__tab"), f = tab && faceOf(tab);
        if (f && f._ff !== tab.dataset.tid) { f._ff = tab.dataset.tid; paint(f); }
      });
      document.addEventListener("focusout", (e) => {
        const f = faceOf(e.target);
        if (f && f._ff && !f.contains(e.relatedTarget)) { f._ff = null; paint(f); }
      });
    }
    return { paint, all() { if (on) for (const f of $$(".mu .yfolder[data-face]")) paint(f); } };
  })();

  // sheet: one dialog for every notes button. Desktop: a popover beside its button (below if it fits, else above;
  // it keeps that side while ‹ › change its height). Phones (< 640px): a sheet from the bottom edge over a scrim.
  // Long notes scroll inside. Esc / ✕ / a tap outside close it and focus goes back to the button; Tab stays inside.
  const sheet = (() => {
    const on = OPT.songnotes === "sheet";
    const el = document.createElement("div");
    el.className = "mu-notes"; el.id = "mu-notes"; el.inert = true;
    el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-labelledby", "mu-notes-t");
    el.innerHTML = `<div class="mu-notes__head"><span class="mu-notes__sw"></span><div class="mu-notes__tt"><h2 class="mu-notes__t" id="mu-notes-t" tabindex="-1"></h2><p class="mu-notes__s"></p></div>
      <div class="mu-notes__nav"><button type="button" class="ylinkicon ylinkicon--sm" data-step="-1">${ph("caret-left")}</button><button type="button" class="ylinkicon ylinkicon--sm" data-step="1">${ph("caret-right")}</button><button type="button" class="ylinkicon ylinkicon--sm" data-x aria-label="Close" title="Close (Esc)">${ph("x")}</button></div></div>
      <div class="mu-notes__acts"></div>
      <div class="mu-notes__body" tabindex="0" role="region" aria-label="Notes"></div>`;
    const scrim = document.createElement("div");
    scrim.className = "mu-notes-scrim"; scrim.setAttribute("aria-hidden", "true");
    if (on) document.body.append(scrim, el);
    const phone = matchMedia("(max-width: 639px)");
    const B = (s) => $(s, el);
    let it = null, tk = null, from = null, list = [], up = false, sizeA = null;
    const isOpen = () => el.classList.contains("is-open");
    function fill() {
      const name = trackName(it, tk), i = list.indexOf(tk), n = list.length;
      B(".mu-notes__sw").innerHTML = sw(tk, 44, 11);
      B(".mu-notes__t").textContent = name;
      B(".mu-notes__s").textContent = [it.kind === "collection" ? `${it.name} · ${tk.index} of ${it.tracks.length}` : "", tk.url ? fmt(P.durationOf(tk)) : "no audio"].filter(Boolean).join(" · ");
      for (const [b, t, w] of [[B("[data-step='-1']"), list[(i - 1 + n) % n], "Previous"], [B("[data-step='1']"), list[(i + 1) % n], "Next"]]) {
        b.hidden = n < 2;
        b.setAttribute("aria-label", `${w} notes: ${trackName(it, t)}`);
        b.title = `${w}: ${trackName(it, t)}`;
      }
      B(".mu-notes__acts").innerHTML = (tk.url ? playBtn(it, { big: true, track: tk }) + qBtn(`track:${tk.id}`) : "") + `<span class="mu-notes__links">${smLinks(tk)}</span>`;
      const body = B(".mu-notes__body");
      body.innerHTML = notesMD(tk.description);
      body.scrollTop = 0;
    }
    function place({ side = false } = {}) {
      el.style.maxHeight = "";
      if (phone.matches || !from?.isConnected) { el.style.left = el.style.top = el.style.bottom = ""; el.classList.remove("is-up"); return; }
      const r = from.getBoundingClientRect(), w = el.offsetWidth, h = el.offsetHeight;
      const below = innerHeight - Y.px("--bottom-ui") - 12 - r.bottom - 8, above = r.top - 8 - 12;
      if (side) up = !(h <= below || below >= above);
      el.style.maxHeight = `${Math.round(Math.max(180, Math.min(560, up ? above : below)))}px`;
      const left = r.left + r.width / 2 > innerWidth / 2 ? r.right + 6 - w : r.left - 6;
      el.style.left = `${Math.round(Math.max(8, Math.min(left, innerWidth - w - 8)))}px`;
      el.style.top = up ? "auto" : `${Math.round(r.bottom + 8)}px`;
      el.style.bottom = up ? `${Math.round(innerHeight - r.top + 8)}px` : "auto";
      el.classList.toggle("is-up", up);
    }
    function open(itm, t, src) {
      if (!on || !hasNotes(t)) return;
      it = itm || itemOfTrack(t);
      if (!it) return;
      const fresh = !isOpen();
      if (from && from !== src && from.matches?.("[aria-haspopup]")) from.setAttribute("aria-expanded", "false");
      tk = t; from = src || null;
      list = it.kind === "collection" ? it.tracks.filter(hasNotes) : [t];
      sizeA?.cancel(); sizeA = null; el.classList.remove("is-sizing");
      fill();
      place({ side: true });
      if (from?.matches?.("[aria-haspopup]")) from.setAttribute("aria-expanded", "true");
      if (fresh) {
        el.inert = false;
        el.classList.add("is-open");
        scrim.classList.toggle("is-open", phone.matches);
        document.addEventListener("pointerdown", outside, true);
        addEventListener("scroll", onScroll, { capture: true, passive: true });
        addEventListener("resize", onResize);
        sound("open", { el: src || undefined });
      }
      B(".mu-notes__t").focus({ preventScroll: true });
    }
    function step(d) {
      if (list.length < 2) return;
      const h0 = el.getBoundingClientRect().height;
      sizeA?.cancel(); sizeA = null; el.classList.remove("is-sizing");
      tk = list[(list.indexOf(tk) + d + list.length) % list.length];
      fill();
      place();
      if (RM()) return;
      const body = B(".mu-notes__body");
      body._a?.cancel();
      body._a = body.animate([{ opacity: 0, transform: `translateX(${d * 10}px)` }, { opacity: 1, transform: "none" }], { duration: 240, easing: "cubic-bezier(.2, .8, .2, 1)" });
      const h1 = el.getBoundingClientRect().height;
      if (Math.abs(h1 - h0) < 1) return;
      // the height glides from where it is (a second step mid-glide starts from the current height)
      el.classList.add("is-sizing");
      const sp = Y.springEasing({ response: 0.34 });
      sizeA = el.animate([{ height: `${h0}px` }, { height: `${h1}px` }], { duration: sp.duration, easing: sp.easing });
      sizeA.onfinish = () => { el.classList.remove("is-sizing"); sizeA = null; };
    }
    function close({ focus = false } = {}) {
      if (!isOpen()) return;
      el.classList.remove("is-open", "is-sizing"); scrim.classList.remove("is-open");
      el.inert = true; sizeA?.cancel(); sizeA = null;
      cancelAnimationFrame(scrollF); scrollF = 0;
      document.removeEventListener("pointerdown", outside, true);
      removeEventListener("scroll", onScroll, { capture: true });
      removeEventListener("resize", onResize);
      if (from?.matches?.("[aria-haspopup]")) from.setAttribute("aria-expanded", "false");
      if (focus && from?.isConnected) from.focus({ preventScroll: true });
      sound("close", { el: from || undefined });
      from = null;
    }
    function outside(e) { if (!el.contains(e.target) && !from?.contains(e.target)) close(); }
    // desktop: the popover rides with its button while the page (or the stage) scrolls; it closes once the button
    // has left the window (a momentum scroll that's still running when you click doesn't shut it at once)
    let scrollF = 0;
    function onScroll(e) {
      if (phone.matches || el.contains(e.target) || scrollF) return;
      scrollF = requestAnimationFrame(() => {
        scrollF = 0;
        if (!isOpen()) return;
        const r = from?.isConnected ? from.getBoundingClientRect() : null;
        if (!r || r.bottom < 0 || r.top > innerHeight - Y.px("--bottom-ui")) close();
        else place();
      });
    }
    function onResize() { if (phone.matches) place(); else close(); }
    if (on) {
      phone.addEventListener("change", () => close());
      el.addEventListener("keydown", (e) => {
        if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close({ focus: true }); return; }
        if (e.key !== "Tab") return;
        const fs = $$("button, a[href], [tabindex='0']", el).filter((x) => !x.disabled && !x.hidden && x.getClientRects().length);
        const i = fs.indexOf(document.activeElement);
        if (!fs.length) return;
        if (e.shiftKey && i <= 0) { e.preventDefault(); fs[fs.length - 1].focus(); }
        else if (!e.shiftKey && i === fs.length - 1) { e.preventDefault(); fs[0].focus(); }
      });
      el.addEventListener("click", (e) => {
        if (e.target.closest("[data-x]")) { close({ focus: true }); return; }
        const s = e.target.closest("[data-step]");
        if (s) step(+s.dataset.step);
      });
    }
    return {
      open, close, get isOpen() { return isOpen(); },
      toggle(itm, t, b) { if (isOpen() && from === b) close({ focus: true }); else open(itm, t, b); },
    };
  })();

  // ?track=<id> (a deep link, the face's "more", ⚙ "Jump to"): that song's notes, open and in view
  function openTrack(root, tid) {
    const row = tid && root ? $$(".mu-trk[data-tid]", root).find((r) => r.dataset.tid === tid) : null;
    const b = row && $(".mu-nb", row);
    if (!b) return;
    if (b.dataset.notes != null) toggleNotes(b, { open: true, instant: true });
    const sc = root.closest?.(".mu-stage");
    if (sc) sc.scrollTop += row.getBoundingClientRect().top - sc.getBoundingClientRect().top - 90;
    else scrollTo(0, Math.max(0, row.getBoundingClientRect().top + scrollY - Math.min(160, innerHeight * 0.22))); // (under the sticky bar)
    if (b.dataset.sheetTrack != null) requestAnimationFrame(() => { const t = P.resolve(tid); sheet.open(itemOfTrack(t), t, b); });
  }

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
      // M6 sheet: a song with notes also offers them here (on phones this is the card's way in: long-press a tab)
      const nt = OPT.songnotes === "sheet" && r.startsWith("track:") && hasNotes(P.resolve(r.slice(6)));
      el.setAttribute("aria-label", name);
      el.innerHTML = `<p class="mu-menu__h" aria-hidden="true">${esc(name)}</p>
        <button type="button" role="menuitem" data-m="next"${tr.length ? "" : " disabled"}>${ph("skip-forward")}<span>Play next</span></button>
        <button type="button" role="menuitem" data-m="queue"${tr.length ? "" : " disabled"}>${ph(on ? "minus-circle" : "list-plus")}<span>${on ? "Take out of the queue" : "Add to queue"}</span></button>
        ${nt ? `<button type="button" role="menuitem" data-m="notes">${ph("note")}<span>Notes</span></button>` : ""}
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
      else if (m === "copy" && it) copyLink(it, from?.matches?.("[data-copy]") ? from : null);
      else if (m === "notes") { const t = P.resolve(r.slice(6)); sheet.open(itemOfTrack(t), t, from); }
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
    if (node.closest?.(".mu-trk__notes")) return null; // (unrolled notes are text: the browser's own menu, to copy)
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
    // i5 · layout (G6.1): no pager at the bottom; previous / next lives once, in the sticky top bar (?dnav=)
    const side = (x) => (x ? { href: pageHref(x), title: x.name, meta: esc(Y.dateRange(x.src)) } : null);
    root.innerHTML = Y.detailPage(detailHTML(it, {
      ctx: "page", level: 1,
      back: { href: listHref(it), label: "Music" },
      actions: copyBtn(it),
      nav: { prev: side(newer), next: side(older), index: i + 1, total: ITEMS.length, unit: "release" },
    }), { wide: Y.opts.dlayout === "rail" });
    root.addEventListener("click", (e) => {
      if (e.target.closest(".ydetail__back")) sound("close");
      else if (e.target.closest(".ypager__a")) sound("open");
    });
    addEventListener("keydown", (e) => {
      if (e.key !== "Escape" || Y.lightbox?.isOpen || P.view === "panel" || e.defaultPrevented || menu.isOpen || sheet.isOpen) return;
      location.href = listHref(it);
    });
    openTrack(root, params.get("track")); // (M6: ?track=<id> · the face's "more" lands here)
    // the player's "collection" link: that collection's own page (this one: stay)
    addEventListener("yarnplayer:collection", (e) => {
      const c = BY_KEY[e.detail.key]; if (!c) return;
      e.preventDefault();
      if (c !== it) location.href = pageHref(c);
    });
    // i5 · G1: open = still to decide (i5's new tries) · state = demo-state helpers ("Jump to") · untagged = decided
    Y.mockPanel([
      ...OPEN_GROUPS,
      ...Y.detailOptions({ nav: true, stack: false }), // i5/i6 · layout: ?dlayout= · ?dnav= (no stack on Music)
      { label: "Release", param: "id", options: ITEMS.map((x) => [x.key, x.name]), default: ITEMS[0].key, state: true },
      TRACK_GROUP,
      ...STATE_GROUPS,
      ...DECIDED_GROUPS.filter((g) => g.param !== "trackmatch"), // (no search on a release's page)
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
  const emptyHTML = Y.empty({ title: "Nothing matches", action: { label: "Clear filters", attrs: "data-reset" }, cls: "mu-empty", hidden: true }); // i7 · C1: the kit's empty state

  if (PAGE === "library") {
    // i10 · M1: header (title + view switch) · tools · the RESULTS LINE (what's shown + ▶ Play · ⤮ Shuffle) · the list
    root.innerHTML = `<div id="mu-head"></div><div class="mu-top" id="mu-top"></div>
      <div class="mu-res" id="mu-res"><p class="mu-res__c" id="mu-res-c"></p><div class="mu-res__acts" role="group" aria-label="Play what's shown">
        <button type="button" class="btn btn--sm btn--m-icon mu-res__b" data-qplay>${ph("play", "fill")}<span>Play</span></button>${OPT.shuffle === "results"
          ? `<button type="button" class="btn btn--sm btn--m-icon mu-res__b" data-qshuffle>${ph("shuffle")}<span>Shuffle</span></button>` : ""}</div></div>
      <div class="mu-body" id="mu-body" tabindex="-1" data-siteorder></div><p class="sr-only" id="mu-live" aria-live="polite"></p>`; // (data-siteorder: the kit's ?mcomplete group shows here, M9)
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
      // i7 · M5: the release's notes and every song's notes are searched too (the description already was)
      text: (it) => [it.name, it.description, Y.instrument(it.instrument)?.label, Y.status(it.status)?.label, ...it.tracks.map((t) => `${t.name} ${plain(t.description || "")}`), ...[].concat(it.artist || [])].filter(Boolean).join(" "),
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
      topEl.classList.add("ytools", "ytools--line"); // i7 · C1: the kit's one-line list top (was this page's CSS)
      root.classList.toggle("mu--fab", tools.isFab());
      paintHint();
    }
    // i10 · M1: the title row is the title (Display) and the Timeline / Grid switch; the count and "Shuffle all" moved
    // to the results line (an action sits with what it acts on, R8)
    function renderHead() {
      $("#mu-head").innerHTML = Y.header({
        title: "Music",
        actions: isDesk() ? Y.seg([{ value: "list", label: "Timeline", icon: "ph-rows" }, { value: "grid", label: "Grid", icon: "ph-squares-four" }], { value: OPT.view, label: "Layout", name: "layout" }) : "",
      });
    }
    /* i10 · M1 · the results line: left, in Meta, what's shown ("26 releases · 52 tracks" · with a search or filters
       "3 releases · 6 tracks for “shadow” · Piano", the filters named as their chips say them; tracks = the songs with
       audio that Play plays) · right, ▶ Play and ⤮ Shuffle (outlined Label buttons; phones: icon-only, named for screen
       readers). Nothing shown → the line steps away (the empty state says it). */
    const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
    function paintResults() {
      const items = shownItems(), n = items.length, t = items.reduce((s, it) => s + shownSongs(it).length, 0);
      const q = F.q.trim(), groups = F.groups.filter((g) => F.state[g.key].size).map((g) => [...F.state[g.key]].map((v) => F.label(g.key, v)).join(" or "));
      const txt = `${plural(n, "release")} · ${plural(t, "track")}${q ? ` for “${q}”` : ""}${groups.length ? ` · ${groups.join(" · ")}` : ""}`;
      const c = $("#mu-res-c"); if (c.textContent !== txt) c.textContent = txt;
      $("#mu-res").hidden = !n;
      const what = F.any() ? `the ${plural(t, "track")} shown` : `all ${plural(t, "track")}`;
      for (const b of $$("#mu-res [data-qplay], #mu-res [data-qshuffle]")) {
        b.disabled = !t;
        b.setAttribute("aria-label", `${b.dataset.qplay != null ? "Play" : "Shuffle"} ${what}`);
      }
    }
    /* i10 · M4 + i10 r2 · C3: card bodies line up in a grid row. A collection's tabs hang above its card (the kit
       folder's margin-top, --yfolder-peek); a single (or a one-song collection) that shares a row with one gets .is-band,
       the same margin ABOVE its card (gutter, never card: no empty band inside a single), so the bodies' tops, titles
       and text in the row line up. A row without a collection has no margin, so its gap is the gutter. Rows are
       read from offsetTop (transforms from an interrupted glide don't count), so this runs inside the kit flip too. */
    function bandRows() {
      if ((mode !== "grid" && mode !== "mlist") || !body) return; // (mlist: the 640–959 two-column phone list)
      const topIn = (el) => { let y = 0; for (let e = el; e && e !== body; e = e.offsetParent) y += e.offsetTop; return y; };
      const rows = new Map();
      for (const f of $$(".ygroup__item > .yfolder", body)) {
        if (f.closest("[hidden], [data-yghost], [data-yio-ghost]") || !f.getClientRects().length) { f.classList.remove("is-band"); continue; }
        const y = topIn(f.parentElement);
        if (!rows.has(y)) rows.set(y, []);
        rows.get(y).push(f);
      }
      for (const fs of rows.values()) {
        const band = fs.some((f) => f.matches(".yfolder--coll:not(.is-solo)"));
        for (const f of fs) if (f.classList.contains("is-band") !== band) f.classList.toggle("is-band", band);
        /* i10 · walk F2: a narrow card (the 4-column grid from 1320px) can wrap its title or its meta ("· 4 tracks"
           onto a second line). Its row-mates then keep the same head height (title + meta + art), so the descriptions
           in a row still start on one line, like a subgrid. */
        const heads = fs.map((f) => $(".yfolder__head", f)).filter(Boolean);
        for (const h of heads) if (h.style.minHeight) h.style.minHeight = "";
        const hs = heads.map((h) => h.getBoundingClientRect().height), max = Math.max(0, ...hs);
        heads.forEach((h, i) => { if (hs[i] < max - 0.5) h.style.minHeight = `${max}px`; });
      }
    }
    document.fonts?.ready.then(() => bandRows()); // (F2: a meta's wrap depends on the loaded fonts)

    /* ---------- in-item match marks ---------- */
    // (i5 · M1: no instrument badge comes and goes on cards; the opened release always has one, marked when it matches)
    function paintItem(el, it, H, { animate = false } = {}) {
      // (the opened release's facts: [data-mk=status|inst] · cards (i6 · O1, Yarn.cardMeta): [data-mk=status|instrument])
      for (const m of $$(".yfact[data-mk='status']", el)) m.classList.toggle("is-match", H.status(it));
      for (const m of $$(".yfact:is([data-mk='inst'], [data-mk='instrument'])", el)) m.classList.toggle("is-match", H.inst(it));
      // i6 · M4: a song's name is marked only when that song is in the result (a word it shares with the others,
      // like "alphabet", doesn't mark the songs the search leaves out)
      const set = trackSet(it), inSet = (t) => !set || set.has(t.id);
      for (const tab of $$(".yfolder__tab", el)) { const t = P.resolve(tab.dataset.tid); tab.classList.toggle("is-match", !!t && H.track(t) && inSet(t)); }
      for (const b of $$(".mu-trk__t b", el)) { const t = P.resolve(b.closest(".mu-trk").dataset.tid); b.classList.toggle("is-match", markName && !!t && H.track(t) && inSet(t)); }
      paintTrackMatch(el, it, { animate });
    }
    function paintMatches() {
      const H = hits();
      for (const f of $$(".yfolder--coll[data-folder]", body)) { const it = BY_KEY[f.dataset.folder]; if (it && !f.closest("[data-yio-ghost], [data-yghost]")) paintFolder(f, it); }
      for (const el of $$(".ygroup__item, .ytl__item", body)) { const it = BY_KEY[el.dataset.key]; if (it && !("yioGhost" in el.dataset)) paintItem(el, it, H, { animate: true }); }
      const st = $("#mu-stage");
      if (st && sel && BY_KEY[sel]) paintItem(st, BY_KEY[sel], H, { animate: true });
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
        bandRows(); // (i10 · M4: an opened card takes its row; the rows around it change)
      },
      onClose(cell) {
        sound("close", { el: cell });
        $("[data-open]", cell)?.focus({ preventScroll: true });
        setParam("item", null);
        sync();
        bandRows();
      },
    });

    function build() {
      tl?.destroy(); tl = null;
      io.reset();
      hideTip(true);
      mode = modeNow();
      root.dataset.mode = mode;
      const groups = Y.musicOrder.groups(ITEMS, ORDER_MODE) || [{ year: "", items: ITEMS }]; // i10 · M9: the order's own years
      const key = (it) => it.key;
      if (mode === "list") {
        body.innerHTML = `<div class="mu-list">
            <div class="mu-tl">${Y.timelineHTML(groups, rowHTML, { key, unit: "release", id: "muy", rule: true, pillKeys: true })}${emptyHTML}</div>
            <div class="mu-stagewrap ystagewrap"><aside class="mu-stage ypanel" id="mu-stage" aria-label="Selected release" tabindex="-1"></aside></div>
          </div>`;
        // i6 · M6 (owner: "we are using the same exact component across pages"): Projects' passed knots (kit
        // timeline passed: true = open red rings behind the ball); ?passed=dot keeps i4's grey dots, as on Projects
        tl = Y.timeline($(".ytl", body), { ball: true, trail: true, passed: params.get("passed") !== "dot" });
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
      // i6 · P4 (the kit's ?gridyears=, Open): the grid's year dividers while a search / filter is on. A search naming
      // a year, or a Year filter, keeps them (owner: "if ur filtering for a year it shold do the divide too")
      // i8 · grid-lone-years (recommended, decided: merge): unfiltered too, a year with 1–2 releases shares a row
      // ("2023 – 2025") instead of leaving one card alone on a mostly empty row
      if (mode === "grid") Y.gridYears?.(body, { on: true, byYear: /\b(19|20)\d\d\b/.test(F.q) || F.state.year?.size > 0, unit: "release" });
      paintMatches();
      const empty = $(".mu-empty", body);
      if (empty) empty.hidden = n > 0;
      $(".mu-list", body)?.classList.toggle("is-empty", !n); // i6 · projects agent · P3: one empty state, the stage steps away
      tools.paint();
      paintResults(); // i10 · M1
      bandRows(); // i10 · M4
      return n;
    }
    // i10 · M4: the grid's columns change with the window (2 ⇄ 4 at 1320px), so its rows do
    let bandF = 0;
    addEventListener("resize", () => { cancelAnimationFrame(bandF); bandF = requestAnimationFrame(bandRows); });
    let liveT = 0;
    F.on(() => {
      let n = 0, drop = false;
      hideTip(true); sheet.close();
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
      if (!it) { Y.stageSwap(stage, "", { animate: false }); return; } // i6 · P3 (projects agent): the list's empty state is the one message
      if (prev === k && from !== "init" && stage.querySelector(".ydetail")) return;
      // i5 · layout: the kit swaps the stage (fade up from the travel direction; ?stagealign=center glides the panel)
      const moved = !!prev && prev !== k && from !== "init";
      Y.stageSwap(stage, detailHTML(it, { ctx: "stage" }), { dir: moved ? (ITEMS.indexOf(it) > ITEMS.indexOf(BY_KEY[prev]) ? 1 : -1) : 0, animate: moved });
      paintItem(stage, it, hits());
      if (from === "click") sound("open", { el: itemEl(k) });
      if (from !== "init") setParam("item", k);
    }
    const visibleRows = () => $$(".ytl__item", body).filter((r) => !r.hidden && !r.closest("[hidden]"));

    /* ---------- events ---------- */
    body.addEventListener("click", (e) => {
      if (e.target.closest("[data-reset]")) { F.clear(); sound("chip-off"); return; }
      // i6 · M4 (trackmatch=hide): "Show all 4" ⇄ "Only the matches"
      const sa = e.target.closest(".mu-trks-all");
      if (sa) {
        const host = sa.closest(".mu-stage, .ygroup__item"), it = BY_KEY[host?.id === "mu-stage" ? sel : host?.dataset.key];
        const wrap = sa.closest(".mu-trks-wrap"), on = !wrap.classList.contains("is-all");
        wrap.classList.toggle("is-all", on);
        if (it) paintTrackMatch(host, it, { animate: true });
        sound(on ? "open" : "close", { el: sa });
        return;
      }
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
        if (sheet.isOpen) { sheet.close({ focus: true }); return; }
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
    // M6: ?track=<id> opens that song's notes in the stage (rows / face: unrolled · sheet: the popover)
    if (mode === "list" && params.get("track")) openTrack($("#mu-stage"), params.get("track"));
    desk.addEventListener("change", () => { renderHead(); placeChrome(); render(); });
    // the timeline's knots move when fonts land (row heights change): keep the ball on its knot
    document.fonts?.ready.then(() => tl?.refresh());

    // i5 · G1: open = still to decide (i5's new tries) · state = demo-state helpers ("Jump to") · untagged = decided
    Y.mockPanel([
      ...OPEN_GROUPS,
      ...Y.detailOptions({ stage: true, stack: false }), // i5/i6 · layout: ?dlayout= · ?stagealign= (no stack on Music)
      { label: "State: release", param: "item", options: [["", "None"], ["revealed", "Revealed (collection)"], ["the-5th-beepbox-tournament", "5th Beepbox (6 tracks)"], ["cast-adrift", "cast adrift (single)"], ["village-night-symphony-cover", "Village Night (with an artist)"]], default: "", state: true },
      // i10 · M2: each of these plays exactly what it shows (Play / Shuffle on the results line)
      { label: "State: a search (what Play plays, M2)", param: "q", options: [["", "No search"], ["shadow", "“shadow” → 3 releases · 6 songs (the owner's screen)"], ["kakiguava", "“kakiguava” → aikisu's shorts, 2 of its 7 songs"], ["stalking", "“stalking” → one left: Alphabet City - stalking…"]], default: "", state: true },
      { label: "State: search FAB (phones)", param: "fab", options: [["", "Closed"], ["open", "Open"]], default: "", state: true },
      TRACK_GROUP,
      ...STATE_GROUPS,
      { label: "Desktop layout", param: "view", options: [["list", "Timeline + stage"], ["grid", "Grid by year"]], default: "list" },
      { label: "Grid: open an item", param: "open", options: [["page", "Its own page (decided)"], ["inline", "In place (i4)"]], default: "page" },
      { label: "Grid: columns", param: "gcols", options: [["auto", "4 from 1320px, else 2"], ["2", "Always 2 (Projects' cards)"]], default: "auto" },
      { label: "Phone filters (msearch=bar)", param: "mf", options: [["wrap", "Two lines, no scroll"], ["scroll", "One line, scrolls"]], default: "wrap" },
      { label: "Disc label", param: "disc", options: [["swatch", "Yarn swatch"], ["cat", "Red cat"]], default: "swatch" },
      { label: "Timeline: passed knots (as Projects, M6)", param: "passed", options: [["ring", "Open red rings"], ["dot", "Grey dots (i4)"]], default: "ring" },
      ...DECIDED_GROUPS,
    ], { title: "Music options" });
  }

  /* ============================================================
     CLICKS anywhere on the page (cards, rows, the stage, an opened card, the item page)
     ============================================================ */
  document.addEventListener("click", (e) => {
    const t = e.target;
    if (!t.closest?.(".mu, .mu-notes")) return;
    // a song: a track row, the notes sheet's play (M6), or a collection shown as one song's card (M8)
    const tr = t.closest("[data-play-track]");
    if (tr) { const tk = P.resolve(tr.dataset.playTrack); playTrack(itemOfTrack(tk), tk, tr.closest(".mu-trk") || tr); return; }
    const play = t.closest("[data-play]");
    if (play) { const it = BY_KEY[play.dataset.play]; if (it) playItem(it, play); return; }
    const q = t.closest("[data-q]");
    if (q) { queue(q.dataset.q, { el: q }); return; }
    // M6: a song's notes · rows / face: the row's caret unrolls them · sheet: a row's or a card's notes button
    const nb = t.closest("[data-notes]");
    if (nb) { toggleNotes(nb); return; }
    const sb = t.closest("[data-sheet-track], [data-sheet]");
    if (sb) {
      const it = BY_KEY[sb.dataset.sheet], cur = it && isCurrent(it) && hasNotes(P.state.track) ? P.state.track : null;
      const tk = sb.dataset.sheetTrack ? P.resolve(sb.dataset.sheetTrack) : cur || it?.tracks.find(hasNotes);
      sheet.toggle(it || itemOfTrack(tk), tk, sb);
      return;
    }
    const tab = t.closest(".yfolder__tab");
    if (tab) {
      const f = tab.closest(".yfolder"), it = BY_KEY[f?.dataset.folder], tk = P.resolve(tab.dataset.tid);
      if (tk?.url) playTrack(it, tk, tab); else $(".yfolder__open", f)?.click();
      return;
    }
    const cp = t.closest("[data-copy]");
    if (cp) return; // the kit copies it (Yarn.copyBtn); nothing else on the card reacts
    // i10 · M1 + M2: the results line plays exactly what's shown (Play: in order, shuffle off · Shuffle: on).
    // ?shuffle=player: Shuffle is the player bar's mode, so Play leaves it as it is
    const rp = t.closest("[data-qplay], [data-qshuffle]");
    if (rp && !rp.disabled) playShown({ shuffle: rp.dataset.qshuffle != null ? true : OPT.shuffle === "results" ? false : null, el: rp });
  });

  sync();
})();
