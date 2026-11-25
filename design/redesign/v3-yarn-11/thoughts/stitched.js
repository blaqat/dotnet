/* ============================================================
   Thoughts · iteration 3 (yarn kit) · page deep dive #1. Mock-only page logic.
   Views (URL params, all in the ⚙ panel):
     (feed)            ?type=a,b  ?tag=x,y  ?q=text      masonry by month · mobile list
                       ?layout=split|stacked   split (i1, default): the rail holds title + intro + search + filters,
                                               the feed starts on the title's line · stacked = i2 (header on top)
                       ?tsearch=rail|top       split only: search in the rail (default) or on top of the feed
                       ?typeicons=i1|line      i1's material swatches (default) or i2's line icons
                       ?yearline=rule|pill     month pill + a dashed rule across the column (default) or i2's pill
                       ?scratch=sticky|felt  ?mfeed=list|thread  ?tl=owner|everyone
                       ?kicker=caps|plain  ?colors=data|default   (kit/posts.js)
                       #post-<id> scrolls to a post and flashes the rope
     ?view=article     &id=a1  |  &project=<slug>        three columns: meta rail · reading column · On this page
     ?view=collection  &c=tools &item=p1 &cview=grid|masonry   the feed's pick cards + the date strand (item → there)
     ?lb=post-e1:0     kit: open the lightbox on load   ?hold  keep highlights on (review)
   i5 (T1, CONCEPTS.md): a write-up is an article `about` something. Project write-ups are feed articles now
     (&project=<slug> opens the same article); an article shows an About card; things show "write-up · …".
     ?pickart=link|article   a pick's article is its own post (default) | the pick is the article (common.js)
     ?kicon=circle|bare      the kicker's type icon in its circle (default) | bare, like i1 (kit/posts.js)
   i6 (decided in i7; the first value is the default, the rest are Earlier):
     ?cardwu=short|foot|pill   T1 · a thing's card links its write-up: slim pill | "Write-up →" bottom right | i5's pill (kit/posts.js)
     ?apager=top|bottom        T4 · an article's previous / next: the item pages' ‹ n / N › top bar | the pager at the end
     ?aboutgo=scroll|page|split  T6 · the feed's "about" pill: finds the thing in the feed | opens it | name finds, ↗ opens
     ?collicon=stubs|circle|none|tile  T7 · a collection's mark, in the rail only (i7 T1; kit/posts.js)
     ?minimarks=off|on         R4 · the mini ranking marks items that have a write-up (kit/posts.js)
     T2 · Back (and the browser's back) returns to the post you clicked, scrolled and roped (common.js TH.ret)
     T3 · the rail shows the most used tags + "n more" (a tag browser popover); Year is a filter (rail, Browse, search)
     T5 · On this page: a click always answers (the heading flashes, the hash updates, the entry is current)
     T8 · one rope at a time: a new selection sews in while the previous one un-sews (no separate timers)
   i7:
     B2 · the tag browser closes (✕, Esc, a click outside, picking a tag) and focus goes back to "n more"
     T2 · the rail shows as many tags as its height holds (at least 8) before "n more"
   Kit (every page): ?toggle= ?sel= ?dfoot= ?motion= …
   ============================================================ */
(() => {
  "use strict";
  const Y = window.Yarn, TH = window.TH;
  const P = Y.params;
  const esc = Y.esc;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const app = document.getElementById("content");
  const reduced = () => Y.reduced();
  const sound = (n, o) => Y.sound(n, o);
  const pick = (k, ok, d) => (ok.includes(P.get(k)) ? P.get(k) : d);
  const { POSTS, byId, TYPE, TYPES } = TH;
  const VIEW = ["article", "collection"].includes(P.get("view")) ? P.get("view") : "feed";
  const SCRATCH = document.documentElement.dataset.scratch || "sticky";
  const MFEED = P.get("mfeed") === "thread" ? "thread" : "list";
  const LAYOUT = pick("layout", ["split", "stacked"], "split");
  const TSEARCH = pick("tsearch", ["rail", "top"], "rail");
  const ICONS = pick("typeicons", ["i1", "line"], "i1");
  const YEARLINE = pick("yearline", ["rule", "pill"], "rule");
  const CVIEW = pick("cview", ["grid", "masonry"], "grid");
  const HOLD = P.has("hold");
  const FLOAT = Y.opts.dfoot === "float";
  const APAGER = pick("apager", ["bottom", "top"], "top"); // i6 (T4) · i7: decided, top
  const ABOUTGO = pick("aboutgo", ["page", "scroll", "split"], "scroll"); // i6 (T6) · i7: decided, scroll
  const COLLICON = Y.post.COLLICON; // i6 (T7)
  // i6 (T3): the rail's most used tags; the rest live in the tag browser. i7 (T2, owner: "we can show a little more
  // things verticaly theres room"): at least TAGS_MIN, then as many as the rail's height holds (fitRail)
  const TAGS_MIN = 8;
  let tagsShown = TAGS_MIN;
  const yearOf = (p) => String(Y.parseDate(p.date)?.getFullYear() || "");
  const desk = matchMedia("(min-width: 960px)");
  const host = (url) => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; } };
  const cat = (fill = "currentColor") => Y.catSVG("", fill);
  const collHref = (k, item) => `stitched.html?view=collection&c=${encodeURIComponent(k)}${item ? `&item=${encodeURIComponent(item)}` : ""}`;
  const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
  let F = null, S = null; // the feed's filter model + search

  /* ============================================================
     CARDS: the kit's post renderer (kit/posts.js), so Studio's previews are the same cards
     ============================================================ */
  const postCtx = () => ({ tagsAs: "button", pressed: F?.state.tag, scratch: SCRATCH, tl: P.get("tl") === "everyone" ? "everyone" : "owner" });
  const cardHTML = (p) => Y.post(p, postCtx());
  function setMiniMode(cardEl, mode) {
    const p = byId[cardEl.dataset.id], mini = $(".ypost__mini", cardEl);
    if (!mini || mini.dataset.mode === mode) return;
    Y.flip(mini, ".ypost__item[data-key]", () => { mini.innerHTML = Y.post.miniBoard(p, mode); mini.dataset.mode = mode; }, { response: 0.5 });
    const cell = cardEl.closest(".t-cell, .c-cell");
    if (cell) setSpan(cell);
  }

  /* ============================================================
     PLAYLISTS → the global player (guarded), else a local <audio>
     ============================================================ */
  let localAudio = null, nowPlaying = null; // { pl, i, playing }
  const toTrack = (t) => ({ name: t.title, url: t.src, artist: t.by });
  const sameURL = (a, b) => !!a && !!b && (a === b || a.split("/").pop() === b.split("/").pop());
  const playlists = () => POSTS.filter((p) => p.type === "playlist");
  function syncFromPlayer(s) {
    if (!s) return;
    let hit = null;
    for (const p of playlists()) {
      const i = p.tracks.findIndex((t) => sameURL(t.src, s.track?.url));
      if (i >= 0) { hit = { pl: p.id, i }; break; }
    }
    if (hit) { nowPlaying = { ...hit, playing: !!s.playing }; markPlaying(); }
    else if (nowPlaying) { nowPlaying = null; markPlaying(); }
  }
  let hooked = false;
  function hookPlayer() {
    if (hooked || !window.YarnPlayer?.on) return;
    hooked = true;
    try {
      window.YarnPlayer.on((s, kind) => { if (kind === "track" || kind === "state") syncFromPlayer(s); });
      syncFromPlayer(window.YarnPlayer.state);
    } catch (_) {}
  }
  function markPlaying() {
    const np = nowPlaying;
    $$(".ypost--playlist").forEach((c) => {
      const p = byId[c.dataset.id];
      const mine = np && np.pl === c.dataset.id;
      c.classList.toggle("is-playing", !!(mine && np.playing));
      $$(".ypost__track", c).forEach((b) => {
        const i = +b.dataset.i, t = p.tracks[i], cur = mine && np.i === i;
        b.setAttribute("aria-current", cur ? "true" : "false");
        b.setAttribute("aria-label", `${cur && np.playing ? "Pause" : "Play"} ${t.title} by ${t.by}, ${t.dur}`);
        $(".ypost__tsw > i", b).className = `ph-fill ${cur && np.playing ? "ph-pause" : "ph-play"}`;
      });
      const all = $(".ypost__all", c);
      // i10 · pages (P2): the kit play part: rest → current (this playlist loaded, paused: a live ring) → playing (live fill)
      if (all) Y.playBtn.set(all, mine ? (np.playing ? "playing" : "current") : "", { label: mine && np.playing ? "Pause" : "Play all", ...(all.hasAttribute("aria-label") ? { aria: all.getAttribute("aria-label") } : {}) });
      const now = $(".ypost__now", c);
      if (now) now.textContent = mine ? `${np.playing ? "Now playing" : "Paused"}: ${p.tracks[np.i].title}` : ""; // screen readers only (i4)
    });
  }
  function playTrack(plId, i) {
    const p = byId[plId];
    const queue = p.tracks.map(toTrack);
    if (window.YarnPlayer?.play) {
      hookPlayer();
      try {
        const cur = window.YarnPlayer.state?.track;
        if (cur && sameURL(cur.url, p.tracks[i].src) && window.YarnPlayer.toggle) return window.YarnPlayer.toggle();
        window.YarnPlayer.play(queue[i], queue);
        nowPlaying = { pl: plId, i, playing: true };
        return markPlaying();
      } catch (_) { /* fall through to the local element */ }
    }
    if (!localAudio) {
      localAudio = new Audio();
      localAudio.preload = "none";
      localAudio.addEventListener("ended", () => {
        const nxt = nowPlaying && byId[nowPlaying.pl].tracks[nowPlaying.i + 1];
        if (nxt) playTrack(nowPlaying.pl, nowPlaying.i + 1);
        else if (nowPlaying) { nowPlaying.playing = false; markPlaying(); }
      });
    }
    if (nowPlaying && nowPlaying.pl === plId && nowPlaying.i === i) {
      nowPlaying.playing = !nowPlaying.playing;
      nowPlaying.playing ? localAudio.play().catch(() => {}) : localAudio.pause();
      sound(nowPlaying.playing ? "play" : "pause");
      return markPlaying();
    }
    localAudio.src = p.tracks[i].src;
    localAudio.play().catch(() => {});
    sound("play");
    nowPlaying = { pl: plId, i, playing: true };
    markPlaying();
  }

  /* ============================================================
     FEED
     ============================================================ */
  // i6 (T7): a collection's mark, ?collicon (tile = i5's icon in a gold tile)
  const collArt = (k, c, size = "") => (COLLICON === "tile" ? `<span class="t-link__ic" aria-hidden="true"><i class="ph-bold ${c.icon}"></i></span>`
    : COLLICON === "none" ? "" : Y.post.collMark(c, POSTS.filter((p) => p.collection === k), { size }));
  const links = {
    coll: (except) => Object.entries(TH.COLLECTIONS).filter(([k]) => k !== except).map(([k, c]) => {
      const n = TH.collCount(k);
      return `<li><a class="yrow ylift t-link t-link--${COLLICON}" href="${collHref(k)}">${collArt(k, c, "row")}<span class="t-link__t"><b>${esc(c.title)}</b><span class="meta">${n ? plural(n, "pick") : "nothing yet"}</span></span><i class="ph-bold ph-arrow-right t-link__go" aria-hidden="true"></i></a></li>`;
    }).join(""),
    // i5 (T1): no "From projects" links: project write-ups are ordinary articles in the feed now
  };
  // i1's material swatches (default) or i2's line icons, everywhere a post type is a filter (rail, row, Browse)
  const typeIcon = (key) => (ICONS === "i1" ? { iconHTML: Y.post.swatch(key) } : { icon: TYPE[key]?.icon || "ph-stack" });
  const allIcon = ICONS === "i1" ? Y.post.swatch("all") : `<i class="ph-bold ph-stack" aria-hidden="true"></i>`;
  const ALL_LABEL = "All"; // i4 (owner): "Show all should just be All, similar to the first thoughts design"

  function makeFilters() {
    const urlTags = (P.get("tag") || "").split(",").map((s) => s.trim()).filter(Boolean);
    const known = new Set(TH.TAGS.map(([t]) => t));
    // i6 (T3, owner: "there are also missing filters for years i noticed in search"): Year is a filter, newest first
    const years = [...new Set(POSTS.map(yearOf).filter(Boolean))].sort((a, b) => b - a);
    return Y.filters({
      groups: [
        { key: "type", label: "Type", kind: "post", row: true, values: TYPES.map((t) => ({ value: t.key, label: t.plural, ...typeIcon(t.key) })), get: (p) => p.type },
        { key: "tag", label: "Tags", kind: "tag", values: [...known, ...urlTags.filter((t) => !known.has(t))] },
        { key: "year", label: "Year", values: years, get: yearOf },
      ],
      items: POSTS,
      // i5 (T1): an article is found by its own words and by the name of what it's about ("helium", "bank")
      text: (p) => [p.title, p.text, p.name, p.blurb, p.dek, p.note, TYPE[p.type]?.one, ...(p.tags || []), ...(p.tracks || []).map((t) => t.title), ...(p.media || []).map((m) => m.alt),
        p.articleTitle, p.articleDek, p.body, p.about && TH.about(p.about)?.name].filter(Boolean).join(" "),
      url: true,
    });
  }

  const firstDate = () => Y.parseDate(POSTS.at(-1).date);
  const countLine = () => `${POSTS.length} posts · since ${Y.fmt.month(firstDate())}`;
  // split: the rail opens with the page title, i1's one-line intro and the count (the feed starts on the title's line)
  const introHTML = () => `<header class="t-intro">${Y.header({ title: "Thoughts" })}
      <p class="t-blurb">welcome to my void</p>
      <p class="meta t-count">${countLine()}</p></header>`;

  function railHTML() {
    const tg = F.group("type"), gg = F.group("tag"), yg = F.group("year");
    // i6 (T3): the most used tags; the rest are in the rail's DOM but hidden until pressed (so a tag picked in the
    // browser or typed in search shows up here as the chip that clears it), and the browser holds them all
    const more = Math.max(0, gg.values.length - tagsShown);
    return `<section class="t-rail__sec" aria-labelledby="rail-type">
        <h2 class="sr-only" id="rail-type">Type</h2><!-- i11 · pages · P4 (T8): read out, not shown (the swatches + names say it) -->
        <div class="t-rail__types" role="group" aria-labelledby="rail-type">
          <button type="button" class="ychip ysel ytog ychip--row t-all" data-all aria-pressed="true">${allIcon}<span class="ychip__l">${ALL_LABEL}</span><span class="ychip__c" aria-hidden="true">${POSTS.length}</span></button>
          ${tg.values.map((vi) => Y.chip(tg, vi, { count: 0, cls: "ychip--row", attrs: `data-yf="type:${esc(vi.value)}"` })).join("")}
        </div>
      </section>
      <section class="t-rail__sec" aria-labelledby="rail-tags">
        <h2 class="sr-only" id="rail-tags">Tags</h2>
        <div class="t-rail__tags" role="group" aria-labelledby="rail-tags">${gg.values.map((vi, i) => Y.chip(gg, vi, { cls: `ychip--sm${i >= tagsShown ? " t-tag--over" : ""}`, attrs: `data-yf="tag:${esc(vi.value)}" data-i="${i}"${i >= tagsShown ? " hidden" : ""}` })).join("")}<button type="button" class="ychip ychip--sm t-more" aria-haspopup="dialog" aria-expanded="false" aria-controls="t-tagpop"${more ? "" : " hidden"}><span class="ychip__l">${more} more</span><i class="ph-bold ph-caret-right" aria-hidden="true"></i></button></div>
      </section>
      <section class="t-rail__sec" aria-labelledby="rail-year">
        <h2 class="sr-only" id="rail-year">Year</h2>
        <div class="t-rail__tags t-rail__years" role="group" aria-labelledby="rail-year">${yg.values.map((vi) => Y.chip(yg, vi, { cls: "ychip--sm", attrs: `data-yf="year:${esc(vi.value)}"` })).join("")}</div>
      </section>
      <section class="t-rail__sec" aria-labelledby="rail-colls">
        <h2 class="eyebrow t-rail__h" id="rail-colls">Collections</h2>
        <ul class="t-links">${links.coll()}</ul>
      </section>`;
  }

  function streamHTML() {
    const months = [];
    for (const p of POSTS) {
      const d = Y.parseDate(p.date), key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!months.length || months.at(-1).key !== key) months.push({ key, d, posts: [] });
      months.at(-1).posts.push(p);
    }
    const thread = MFEED === "thread";
    return months.map((m) => `
      <section class="t-month${thread ? " ytl__group" : ""}" aria-labelledby="m-${m.key}">
        ${Y.yearPill(Y.fmt.monthLong(m.d), { count: m.posts.length, unit: "post", id: `m-${m.key}`, attrs: `data-key="m:${m.key}"`, rule: YEARLINE === "rule" })}
        <div class="t-grid">${m.posts.map((p) => `<div class="t-cell${thread ? " ytl__item" : ""}" data-key="${p.id}">${thread ? `<span class="ytl__knot" aria-hidden="true"></span>` : ""}${cardHTML(p)}</div>`).join("")}</div>
      </section>`).join("");
  }

  const SPLIT = LAYOUT === "split";
  // where the search line + (phone) filter row live: the rail (split, desktop), else on top of the feed
  const toolsSlot = () => (SPLIT && TSEARCH === "rail" && desk.matches ? "rail" : "main");
  function renderFeed() {
    document.title = "Thoughts · blaqat.net";
    F = makeFilters();
    app.innerHTML = `
      <div class="t-mhead">${Y.header({ title: "Thoughts", meta: countLine() })}</div>
      <div class="t-feed t-feed--${LAYOUT}${MFEED === "thread" ? " t-feed--thread" : ""}${SPLIT ? ` t-feed--s-${TSEARCH}` : ""}">
        <aside class="t-rail" aria-label="Browse thoughts">
          ${SPLIT ? introHTML() : ""}
          <div class="t-slot" data-slot="rail"></div>
          ${railHTML()}
        </aside>
        <div class="t-main">
          <div class="t-slot" data-slot="main"><div class="ytools t-tools"><div class="t-search" id="t-search"></div><div class="t-row" id="t-row"></div></div></div>
          <div class="t-status" id="t-status" role="status"></div>
          <div class="t-stream${MFEED === "thread" ? " ytl" : ""}" id="t-stream">${streamHTML()}</div>
          ${Y.empty({ cls: "t-empty", attrs: 'id="t-empty"', hidden: true })}
        </div>
      </div>
      ${tagBrowserHTML()}`;
    const tools = $(".t-tools");
    // split + desktop: the rail already shows every type and tag, so typed terms light those chips instead of tokens
    S = Y.search($("#t-search"), F, { placeholder: "Search thoughts", label: "Search thoughts", tokens: (g) => !(g.row && F._row) && !(SPLIT && desk.matches) });
    // the kit Browse sheet's link slot: Collections (they navigate, they don't filter; i5: write-ups are articles now)
    Y.filterRow($("#t-row"), F, { all: ALL_LABEL, extra: [
      { label: "Collections", html: `<ul class="t-links">${links.coll()}</ul>` },
    ] });
    S.refresh();
    // move the tools before the kit re-places search + row at the breakpoint (listeners run in order)
    const placeTools = () => { $(`.t-slot[data-slot="${toolsSlot()}"]`).appendChild(tools); S.refresh(); };
    desk.addEventListener("change", placeTools);
    placeTools();
    // phones: the kit's one mobile pattern (?msearch=bar|fab); month pills stack under the sticky filter row
    const stream = $("#t-stream");
    Y.listTools(F, { tools, search: $("#t-search"), row: $("#t-row"), sticky: stream,
      label: "Search and filter thoughts", title: "Find a thought", count: () => `${POSTS.filter((p) => F.test(p)).length} of ${POSTS.length} shown` });

    F.on(() => { paintRail(); paintCardTags(); applyFilter(true); });
    paintRail();
    applyFilter(false);
    watchSpans($("#t-stream"));
    markPlaying();
    wireTagBrowser();
    fitRail(); // i7 (T2)
    document.fonts?.ready.then(refit);
    addEventListener("resize", refit);
    desk.addEventListener("change", refit);
  }

  function paintRail() {
    const rail = $(".t-rail");
    if (!rail) return;
    for (const b of [...$$(".t-rail__sec .ychip[data-g]", rail), ...$$("#t-tagpop .ychip[data-g]")]) {
      const on = F.has(b.dataset.g, b.dataset.v);
      b.setAttribute("aria-pressed", String(on));
      const n = F.count(b.dataset.g, b.dataset.v);
      b.classList.toggle("is-zero", n === 0 && !on);
      const c = $(".ychip__c", b); if (c) c.textContent = n;
      b.title = `${n} post${n === 1 ? "" : "s"}`;
      if (b.classList.contains("t-tag--over")) b.hidden = !on; // i6 (T3): a pressed tag from the browser shows in the rail
    }
    const more = $(".t-more", rail);
    if (more) {
      const n = $$(".t-tag--over[hidden]", rail).length;
      more.hidden = !n;
      $(".ychip__l", more).textContent = `${n} more`;
    }
    const allOn = !F.anyIn(["type", "tag", "year"]);
    $(".t-all", rail).setAttribute("aria-pressed", String(allOn));
    $(".t-all .ychip__c", rail).textContent = POSTS.filter((p) => F.test(p, { except: "type" })).length;
  }

  /* ---------- i6 (T3) · the tag browser: every tag, A–Z with counts, a find field. A popover (the top layer: it
     floats over the feed beside the rail, light-dismisses, Esc closes). Its chips are the same filter toggles.
     i7 (B2): its list scrolls, not the whole popover, so the head and its ✕ are never clipped ---------- */
  function tagBrowserHTML() {
    const gg = F.group("tag");
    const az = [...gg.values].sort((a, b) => a.value.localeCompare(b.value));
    return `<div class="t-tagpop ycard" id="t-tagpop" popover role="dialog" aria-labelledby="t-tagpop-h">
      <div class="t-tagpop__head"><h2 class="eyebrow t-tagpop__h" id="t-tagpop-h">All tags <span class="meta">${az.length}</span></h2>
        <button type="button" class="ylinkicon ylinkicon--sm t-tagpop__x" popovertarget="t-tagpop" popovertargetaction="hide" aria-label="Close the tag browser"><i class="ph-bold ph-x" aria-hidden="true"></i></button></div>
      <label class="sr-only" for="t-tagq">Find a tag</label>
      <div class="t-tagpop__find"><i class="ph-bold ph-magnifying-glass" aria-hidden="true"></i><input id="t-tagq" class="yfield yfield--sm t-tagpop__q" type="search" placeholder="Find a tag" autocomplete="off" spellcheck="false" enterkeyhint="done"></div>
      <div class="t-tagpop__list" role="group" aria-label="All tags">${az.map((vi) => Y.chip(gg, vi, { count: 0, cls: "ychip--sm", attrs: `data-yf="tag:${esc(vi.value)}"` })).join("")}</div>
      <p class="meta t-tagpop__none" hidden>No tag like that.</p>
    </div>`;
  }
  /* i7 (B2, owner: "cant even close the more tags button"; its ✕ was cut off at the top). The cause: .ycard's
     display: block beat the browser's own [popover]:not(:popover-open) { display: none }, so a closed browser stayed
     drawn in the page (under the feed's cards, which covered its top) and ✕ / Esc / a click outside had nothing left to
     close. stitched.css hides it while closed. It closes on ✕, Esc, a click outside (the popover's light dismiss) and
     after picking a tag; focus goes back to "n more" (or, when that's gone, to the tag you picked in the rail). */
  function wireTagBrowser() {
    const pop = $("#t-tagpop"), btn = $(".t-more");
    if (!pop || !btn || typeof pop.showPopover !== "function") { btn?.remove(); $$(".t-tag--over").forEach((b) => { b.hidden = false; b.classList.remove("t-tag--over"); }); return; }
    btn.setAttribute("popovertarget", "t-tagpop");
    const q = $("#t-tagq", pop);
    let picked = null, pickT = 0;
    // its height while closed: shown for one synchronous measure (no paint), so it opens in place on its first frame
    const height = () => {
      if (pop.matches(":popover-open")) return pop.offsetHeight;
      pop.style.display = "flex"; const h = pop.offsetHeight; pop.style.display = ""; return h;
    };
    const place = () => {
      const r = btn.getBoundingClientRect(), rail = $(".t-rail").getBoundingClientRect();
      const w = Math.min(340, innerWidth - 32), h = height();
      pop.style.left = `${Math.round(Math.min(rail.right + 14, innerWidth - w - 16))}px`;
      pop.style.top = `${Math.round(Math.max(16, Math.min(r.top - 18, innerHeight - h - 16)))}px`;
    };
    pop.addEventListener("beforetoggle", (e) => {
      if (e.newState !== "open") return;
      picked = null;
      place();
      if (!reduced()) { const sp = Y.springEasing ? Y.springEasing({ response: 0.34 }) : { duration: 220, easing: "cubic-bezier(.2,.8,.2,1)" }; pop.animate([{ opacity: 0, transform: "translateX(-8px) scale(.97)" }, { opacity: 1, transform: "none" }], { duration: sp.duration, easing: sp.easing }); }
    });
    pop.addEventListener("toggle", (e) => {
      const open = e.newState === "open";
      btn.setAttribute("aria-expanded", String(open));
      sound(open ? "open" : "close", { el: btn });
      if (open) { place(); q.focus({ preventScroll: true }); return; }
      clearTimeout(pickT);
      q.value = ""; filterList();
      // back to "n more", unless a click outside landed on another control (that one keeps its focus). A click on the
      // page itself focuses #content or a post (tabindex -1): that's "nowhere", so it comes back here too
      const a = document.activeElement;
      const control = a && a !== document.body && !pop.contains(a) && a.getAttribute("tabindex") !== "-1"
        && a.matches("a[href], button, input, select, textarea, summary, [tabindex], [contenteditable='true']");
      if (!control) {
        const to = !btn.hidden ? btn : picked && $(`.t-rail .ychip[data-g="tag"][data-v="${CSS.escape(picked)}"]`);
        to?.focus({ preventScroll: true });
      }
    });
    const filterList = () => {
      const s = q.value.trim().toLowerCase().replace(/^#/, "");
      let n = 0;
      $$(".ychip", pop).forEach((c) => { const ok = !s || c.dataset.v.toLowerCase().includes(s); c.hidden = !ok; if (ok) n++; });
      $(".t-tagpop__none", pop).hidden = n > 0;
    };
    // choosing a tag: the kit's [data-yf] handler toggles it (document, after this); the browser closes a beat later,
    // once the chip shows it's on, so the choice registers before the popover goes
    $(".t-tagpop__list", pop).addEventListener("click", (e) => {
      const c = e.target.closest(".ychip[data-v]");
      if (!c) return;
      picked = c.dataset.v;
      clearTimeout(pickT);
      pickT = setTimeout(() => { if (pop.matches(":popover-open")) pop.hidePopover(); }, reduced() ? 0 : 160);
    });
    q.addEventListener("input", filterList);
    q.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); $$(".ychip:not([hidden])", pop)[0]?.click(); }
      else if (e.key === "Escape") { e.preventDefault(); pop.hidePopover(); } // (a search field would only clear itself)
    });
    addEventListener("resize", () => { if (pop.matches(":popover-open")) place(); });
    desk.addEventListener("change", () => { if (!desk.matches && pop.matches(":popover-open")) pop.hidePopover(); });
  }

  /* i7 (T2) · as many tags as the rail's height holds. The rail is sticky and as tall as the screen; it tries every tag,
     then gives one back at a time ("n more" takes the last place) until nothing in it scrolls. Never fewer than
     TAGS_MIN (a short screen keeps i6's rail). Refits on resize and once the fonts are in, never on a click (chips
     don't move under the pointer). */
  function setTagsShown(n) {
    tagsShown = n;
    for (const b of $$('.t-rail .t-rail__tags .ychip[data-g="tag"]')) {
      const over = +b.dataset.i >= n;
      b.classList.toggle("t-tag--over", over);
      b.hidden = over && !F.has("tag", b.dataset.v);
    }
    const more = $(".t-rail .t-more");
    if (more) { const k = $$(".t-rail .t-tag--over[hidden]").length; more.hidden = !k; $(".ychip__l", more).textContent = `${k} more`; }
  }
  function fitRail() {
    const rail = $(".t-rail");
    if (!rail || !F || !desk.matches || !rail.offsetHeight || $("#t-tagpop")?.matches(":popover-open")) return;
    const fits = () => rail.scrollHeight <= rail.clientHeight + 1;
    let n = F.group("tag").values.length;
    setTagsShown(n);
    while (n > TAGS_MIN && !fits()) setTagsShown(--n);
  }
  let fitRaf = 0;
  const refit = () => { cancelAnimationFrame(fitRaf); fitRaf = requestAnimationFrame(fitRail); };
  const paintCardTags = () => $$(".ypost .ytag[data-tag]").forEach((b) => b.setAttribute("aria-pressed", String(F.has("tag", b.dataset.tag))));

  /* ---------- masonry: 1px grid rows, each cell spans its own height + the gutter ----------
     i10 · pages (R6): the rows were 4px, so a card's span rounded up by 0–3px and the gap down was 16–19 against 16
     across. With 1px rows the gap down is the gutter (--gap = --gutter: 24, 16 on phones) to the pixel, like across. */
  let GAP = 24;
  function setSpan(cell) {
    if (!cell || cell.hidden || !cell.parentElement?.matches(".t-grid, .c-grid[data-cview='masonry']")) return;
    const h = cell.offsetHeight;
    if (h) cell.style.gridRowEnd = `span ${h + GAP}`;
  }
  let spanRO = null;
  function watchSpans(root) {
    const gap = () => Math.round(parseFloat(getComputedStyle(root).getPropertyValue("--gap")) || 24);
    GAP = gap();
    spanRO?.disconnect();
    spanRO = new ResizeObserver((es) => es.forEach((e) => { if (!e.target.hidden && e.contentRect.height) setSpan(e.target); }));
    $$(".t-cell, .c-cell", root).forEach((c) => { setSpan(c); spanRO.observe(c); });
    addEventListener("resize", () => { GAP = gap(); });
  }

  /* ---------- filtering: survivors glide, new ones grow in, leaving ones fade (kit flip, interruptible) ---------- */
  let firstApply = true;
  function applyFilter(animate) {
    const stream = $("#t-stream");
    const mutate = () => {
      let shown = 0;
      $$(".t-cell", stream).forEach((c) => { if (c.dataset.yghost != null) return; const ok = F.test(byId[c.dataset.key]); c.hidden = !ok; if (ok) shown++; });
      $$(".t-month", stream).forEach((m) => {
        const n = $$(".t-cell", m).filter((c) => !c.hidden).length;
        m.hidden = !n;
        const lab = $(".yyear__n", m); if (lab) lab.textContent = plural(n, "post");
      });
      $$(".t-cell:not([hidden])", stream).forEach(setSpan);
      paintStatus(shown);
      // if we were deep in the feed, bring its top back under the sticky bits (instant; flip keeps continuity)
      const top = stream.getBoundingClientRect().top, off = (parseFloat(stream.style.getPropertyValue("--sticky-top")) || 0) + 8;
      if (!firstApply && top < off - 2) scrollTo(0, scrollY + top - off - 60);
    };
    if (animate && !firstApply) Y.flip(stream, ".t-cell[data-key], .yyear[data-key]", mutate);
    else mutate();
    firstApply = false;
  }
  // i1's status line: "4 of 16 · articles + picks + scratch, tagged #tools or #music or #web"
  function paintStatus(shown) {
    const el = $("#t-status"), empty = $("#t-empty");
    const any = F.any();
    const desc = [
      F.state.type.size ? [...F.state.type].map((k) => (TYPE[k]?.plural || k).toLowerCase()).join(" + ") : "",
      F.state.tag.size ? `tagged ${[...F.state.tag].map((t) => "#" + t).join(" or ")}` : "",
      F.state.year.size ? `from ${[...F.state.year].sort().join(" or ")}` : "",
      F.q.trim() ? `matching “${F.q.trim()}”` : "",
    ].filter(Boolean).join(", ");
    el.classList.toggle("is-idle", !any);
    // i4 (owner): no idle line ("16 posts, newest first" repeated the rail's count); it shows only while filtering
    el.innerHTML = any
      ? `<span class="meta">${shown} of ${POSTS.length} · ${esc(desc)}</span><button type="button" class="ylinkbtn" data-clear-all>Clear filters</button>`
      : "";
    empty.hidden = shown > 0;
    if (!shown) {
      const onlyTag = F.state.tag.size === 1 && !F.state.type.size && !F.q.trim() ? [...F.state.tag][0] : null;
      // i7 · C1: the kit's empty state (Projects / Music / Studio say it the same way)
      empty.outerHTML = Y.empty({ title: onlyTag ? `Nothing tagged #${esc(onlyTag)} yet.` : "Nothing matches that.", text: onlyTag ? "Other pages link here with their tags; this one hasn't been posted about." : "Try fewer filters.",
        action: { label: "Clear filters", attrs: "data-clear-all" }, cls: "t-empty", attrs: 'id="t-empty"' });
    }
  }

  /* ---------- #post-<id>: scroll there + a brief rope (one thing highlighted = single choice = rope) ----------
     i6 (T8, owner: "the previous selection should animate out while the new one is coming in rather than being on its
     own timer"): one rope at a time. A new flash un-sews the previous one in the same frame it sews the new one (the
     rope's --sweep transition runs both ways at once, and a third click retargets whichever is mid-sweep). */
  let roped = null;
  function flash(el, ms = 2600) {
    if (roped && roped !== el) { clearTimeout(roped._flash); roped.classList.remove("is-selected"); }
    roped = el;
    el.classList.add("ysel");
    el.classList.remove("is-selected"); // (already roped: it re-sews from where its rope is)
    void el.offsetWidth; // style flush, so the sweep transitions from its current value
    requestAnimationFrame(() => el.classList.add("is-selected"));
    clearTimeout(el._flash);
    if (!HOLD) el._flash = setTimeout(() => { el.classList.remove("is-selected"); if (roped === el) roped = null; }, ms);
  }
  function focusFromHash() {
    const hid = location.hash.match(/^#post-(.+)$/)?.[1];
    if (!hid || !byId[hid]) return;
    showPost(byId[hid].id); // (?pickart=article: an article folded into its pick answers to the pick)
  }
  // bring a feed post into view (clearing filters that hide it) and rope it. smooth: from a click on this page
  // keep: coming back to where you were, only move if the post is mostly off screen (the restored scroll stays put)
  function showPost(id, { smooth = false, then = null, keep = false } = {}) {
    if (!byId[id]) return;
    if (!F.test(byId[id])) F.clear(null, "hash");
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const el = document.getElementById(`post-${id}`);
      if (!el) return;
      const r = el.getBoundingClientRect();
      const seen = Math.min(r.bottom, innerHeight) - Math.max(r.top, 70);
      const move = keep ? seen < Math.min(r.height, 160) : r.top < 80 || r.bottom > innerHeight - 40;
      if (move) scrollTo({ top: Math.max(0, scrollY + r.top - Math.max(80, (innerHeight - r.height) / 2)), behavior: smooth && !reduced() ? "smooth" : "instant" });
      // i6 fix (review P2-9: Back landed with the post in view but focus on <body>): focus goes to the post, so a
      // screen reader says where you are and Tab continues from it. It's not a control: no ring (the rope marks it)
      if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
      if (!el.contains(document.activeElement)) el.focus({ preventScroll: true });
      flash(el);
      then?.(el);
    }));
  }
  // a hash link on this page (an about pill for a post, a #post- link) lands the same way
  addEventListener("hashchange", () => { if (VIEW === "feed") focusFromHash(); });

  /* ---------- i6 (T2) · back = what you clicked. Leaving the feed by a link remembers where you were (TH.ret); coming
     back (Back link or the browser's back) restores the scroll and ropes the post you'd clicked. ---------- */
  function returnToClicked() {
    const r = TH.retOnFeed();
    if (!r) return;
    const land = () => {
      if (Math.abs(scrollY - r.y) > 4) scrollTo({ top: r.y, behavior: "instant" });
      if (r.id && byId[r.id]) showPost(byId[r.id].id, { keep: true });
    };
    // fonts first, so the masonry heights (and the restored offset) are the ones the page had
    Promise.race([document.fonts?.ready, new Promise((ok) => setTimeout(ok, 400))]).then(() => requestAnimationFrame(land));
  }

  /* ============================================================
     ARTICLE (posts + project write-ups): i1's three columns on the kit detail skeleton
     meta rail (back · posted · reading time · tags · share) │ reading column (caps kicker → title → dek → cover → prose
     → in-flow pager) │ On this page. All three start on one top line.
     ============================================================ */
  const hslug = (s) => s.toLowerCase().replace(/<[^>]+>/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  function mdToHTML(md) {
    if (window.marked?.parse) return window.marked.parse(md, { gfm: true });
    // tiny fallback if the CDN is unreachable: headings, quotes, fences, lists, paragraphs
    const out = [];
    for (const b of md.split(/\n{2,}/)) {
      if (/^```/.test(b)) { const [, lang, code] = b.match(/^```(\w*)\n([\s\S]*?)```?$/) || [, "", b]; out.push(`<pre><code class="language-${lang}">${esc(code)}</code></pre>`); continue; }
      if (/^#{1,4} /.test(b)) { const l = b.match(/^#+/)[0].length; out.push(`<h${l}>${esc(b.slice(l + 1).replace(/\*\*/g, ""))}</h${l}>`); continue; }
      if (/^> /.test(b)) { out.push(`<blockquote><p>${esc(b.replace(/^> /gm, ""))}</p></blockquote>`); continue; }
      if (/^\s*- /.test(b)) { out.push(`<ul>${b.split("\n").map((l) => `<li>${esc(l.replace(/^\s*- /, ""))}</li>`).join("")}</ul>`); continue; }
      const img = b.match(/^!\[(.*?)\]\((.*?)\)$/);
      if (img) { out.push(`<p><img src="${esc(img[2])}" alt="${esc(img[1])}"></p>`); continue; }
      out.push(`<p>${esc(b).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/`(.+?)`/g, "<code>$1</code>")}</p>`);
    }
    return out.join("\n");
  }
  function highlight(code, lang) {
    if (!/^(ts|js|typescript|javascript|svelte|rust|rs)$/.test(lang)) return esc(code);
    const KW = /\b(let|const|var|function|return|import|from|export|if|else|new|await|async|type|interface|fn|mut|impl|pub|use|match|struct|enum)\b/;
    return code.split(/(\/\/.*$|"[^"]*"|'[^']*'|`[^`]*`|\b[A-Za-z_]\w*\b(?=\s*\()|\b[A-Z]\w*\b|\b\w+\b)/m).map((tok) => {
      if (!tok) return "";
      if (tok.startsWith("//")) return `<span class="tok-c">${esc(tok)}</span>`;
      if (/^["'`]/.test(tok)) return `<span class="tok-s">${esc(tok)}</span>`;
      if (KW.test(tok) && /^\w+$/.test(tok)) return `<span class="tok-k">${esc(tok)}</span>`;
      if (/^[A-Z]\w*$/.test(tok)) return `<span class="tok-t">${esc(tok)}</span>`;
      return esc(tok);
    }).join("").replace(/\b(\w+)(?=\()/g, '<span class="tok-f">$1</span>');
  }
  // write-ups use any heading levels: compress them to h2, h3, h4… under the page title
  function normalizeHeadings(prose) {
    const hs = $$("h1, h2, h3, h4, h5, h6", prose);
    const levels = [...new Set(hs.map((h) => +h.tagName[1]))].sort();
    hs.forEach((h) => {
      const lvl = Math.min(6, 2 + levels.indexOf(+h.tagName[1]));
      if (+h.tagName[1] === lvl) return;
      const n = document.createElement(`h${lvl}`);
      n.innerHTML = h.innerHTML;
      h.replaceWith(n);
    });
  }
  function enhanceProse(prose, group) {
    const used = new Set();
    $$("h2, h3", prose).forEach((h) => {
      let id = hslug(h.textContent) || "section";
      while (used.has(id)) id += "-x";
      used.add(id);
      h.id = id;
      h.innerHTML = `<span class="h-text">${h.innerHTML}</span>`; // i6 (T5): the highlighter flash sits under the words only
      h.insertAdjacentHTML("afterbegin", `<a class="h-anchor" href="#${id}" aria-label="Link to this section">#</a>`);
    });
    $$("pre > code", prose).forEach((code) => {
      const pre = code.parentElement;
      const lang = (code.className.match(/language-(\w+)/) || [])[1] || "text";
      const raw = code.textContent;
      code.innerHTML = highlight(raw.replace(/\n$/, ""), lang);
      const wrap = document.createElement("div");
      wrap.className = "r-code";
      wrap.innerHTML = `<div class="r-code__bar"><span class="r-code__dots" aria-hidden="true"><b></b><b></b><b></b></span><span class="r-code__lang">${esc(lang)}</span><button type="button" class="r-copy" aria-label="Copy code"><i class="ph-bold ph-copy" aria-hidden="true"></i><span>Copy</span></button></div>`;
      pre.replaceWith(wrap);
      wrap.appendChild(pre);
      pre.tabIndex = 0;
      pre.setAttribute("aria-label", `${lang} code`);
      $(".r-copy", wrap).addEventListener("click", async (e) => {
        const b = e.currentTarget;
        try { await navigator.clipboard.writeText(raw); } catch (_) {}
        sound("copy", { el: b });
        $("span", b).textContent = "Copied";
        $("i", b).className = "ph-bold ph-check";
        setTimeout(() => { $("span", b).textContent = "Copy"; $("i", b).className = "ph-bold ph-copy"; }, 1400);
      });
    });
    $$("table", prose).forEach((t) => {
      const w = document.createElement("div");
      w.className = "r-table"; w.tabIndex = 0; w.setAttribute("role", "region"); w.setAttribute("aria-label", "Table");
      t.replaceWith(w); w.appendChild(t);
    });
    // images → kit lightbox triggers (the cover, if any, is first in the group)
    $$("img", prose).forEach((img) => {
      const alt = img.getAttribute("alt") || "";
      const src = Y.media(img.getAttribute("src")) || img.getAttribute("src");
      const fig = document.createElement("figure");
      fig.className = "r-fig";
      fig.innerHTML = `<button type="button" class="r-imgbtn" data-ylb="${group}" data-src="${esc(src)}" data-alt="${esc(alt)}" data-kind="image" aria-haspopup="dialog" aria-label="Open image: ${esc(alt)}"><img src="${esc(src)}" alt="" decoding="async"></button>${alt ? `<figcaption>${esc(alt)}</figcaption>` : ""}`;
      const hostP = img.closest("p");
      (hostP && hostP.textContent.trim() === "" ? hostP : img).replaceWith(fig);
    });
    $$("a[href^='http']", prose).forEach((a) => { a.target = "_blank"; a.rel = "noopener"; });
  }
  // copy link lives with the meta (left rail "Share"), not floating; labelled, so it reads as intentional
  // i6 (L7, LAYOUT-i6.md): Back is the first item in the sticky top bar and copy is its utility (like the ranking and
  // item pages); the side rail keeps the facts only
  const mFacts = (facts) => (facts.trim() ? `<dl class="r-facts r-facts--m">${facts}</dl>` : "");
  const copyIcon = Y.copyBtn("", { label: "Copy link to this article" }); // i7 · C1: the kit's (copies the page's URL when pressed)
  const fact = (dt, dd, cls = "") => `<div class="r-fact${cls ? ` ${cls}` : ""}"><dt>${dt}</dt><dd>${dd}</dd></div>`;
  // i7 · C1: a project's stack is the kit's stack tags everywhere (as on its opened item: each one opens Projects
  // filtered by it); was the old icon-only Yarn.stack list
  const builtWith = (stack) => Y.stackTags(stack, { as: "a", href: (s) => `../projects/index.html?stack=${encodeURIComponent(s)}` });
  const tocHTML = `<div class="r-toc"><nav aria-labelledby="toc-h"><p class="eyebrow r-toc__h" id="toc-h">On this page</p><ol></ol></nav></div>`;
  const tocMobile = `<details class="r-toc-m" hidden><summary><i class="ph-bold ph-list-bullets" aria-hidden="true"></i>On this page<i class="ph-bold ph-caret-down" aria-hidden="true"></i></summary><ol></ol></details>`;
  const sign = `<p class="r-sign">${cat("var(--ink)")}<span>Thanks for reading. More scraps in <a href="stitched.html">Thoughts</a>.</span></p>`;

  function articleShell({ detail, side, toc = true }) {
    return `<div class="t-progress" aria-hidden="true"><span></span></div>
      ${Y.detailPage(`<div class="r-main">${detail}</div>`, { side: `<div class="r-side">${side}</div>`, sideLabel: "About this article", rail: toc ? tocHTML : `<div class="r-toc is-empty"></div>`, railLabel: "On this page" })}`;
  }
  function wireArticle(md, group) {
    const prose = $("#prose");
    const draw = () => {
      prose.innerHTML = md ? mdToHTML(md) : "";
      normalizeHeadings(prose);
      enhanceProse(prose, group);
      const heads = $$("h2, h3", prose);
      const items = heads.map((h) => `<li class="lvl${h.tagName[1]}"><a href="#${h.id}">${esc(h.textContent.replace(/^#/, ""))}</a></li>`).join("");
      const toc = $(".r-toc ol"), tocM = $(".r-toc-m");
      if (toc) toc.innerHTML = items;
      if (tocM) { $("ol", tocM).innerHTML = items; tocM.hidden = heads.length < 2; }
      if (heads.length < 2) $(".r-toc")?.classList.add("is-empty");
      const tocLinks = new Map($$(".r-toc a").map((a) => [a.getAttribute("href").slice(1), a]));
      const bar = $(".t-progress span");
      let pinned = null; // i6 (T5): the heading you clicked stays current until you scroll yourself
      const setCur = (id) => tocLinks.forEach((a, k) => (k === id ? a.setAttribute("aria-current", "location") : a.removeAttribute("aria-current")));
      const onScroll = () => {
        const r = prose.getBoundingClientRect();
        bar.style.setProperty("--p", Math.max(0, Math.min(1, (-r.top + innerHeight * 0.3) / Math.max(1, r.height - innerHeight * 0.6))).toFixed(4));
        if (pinned) return setCur(pinned);
        let cur = heads[0];
        for (const h of heads) if (h.getBoundingClientRect().top < innerHeight * 0.3) cur = h;
        setCur(cur?.id);
      };
      addEventListener("scroll", onScroll, { passive: true });
      onScroll();
      // i6 (T5, owner: "when you cant scroll, the table of contents doesnt really work … something should happen over
      // nothing"): a click always answers. The entry becomes current, the hash updates (replace: Back still leaves the
      // article), the page scrolls as far as it can, and the heading flashes a red highlighter that sweeps on and
      // fades, so you can see where you landed even when the page didn't move. A second click moves the flash.
      const unpin = () => { if (pinned) { pinned = null; onScroll(); } };
      ["wheel", "touchmove"].forEach((t) => addEventListener(t, unpin, { passive: true }));
      addEventListener("keydown", (e) => { if (/^(Arrow(Up|Down)|Page(Up|Down)|Home|End| )$/.test(e.key) && !e.target.closest?.("input, textarea")) unpin(); });
      let lit = null;
      const goTo = (id, { smooth = true } = {}) => {
        const h = document.getElementById(id);
        if (!h) return;
        pinned = id;
        setCur(id);
        history.replaceState(history.state, "", `#${id}`);
        const top = Math.max(0, Math.min(scrollY + h.getBoundingClientRect().top - 96, document.documentElement.scrollHeight - innerHeight));
        if (Math.abs(top - scrollY) > 2) scrollTo({ top, behavior: smooth && !reduced() ? "smooth" : "instant" });
        if (lit && lit !== h) { clearTimeout(lit._t); lit.classList.remove("is-lit"); }
        lit = h;
        h.classList.remove("is-lit"); void h.offsetWidth;
        h.classList.add("is-lit");
        clearTimeout(h._t);
        h._t = setTimeout(() => h.classList.remove("is-lit"), 1800);
        sound("tap", { el: tocLinks.get(id) || h });
      };
      const onToc = (e) => {
        const a = e.target.closest("a[href^='#']");
        if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        if (tocM?.contains(a)) tocM.open = false;
        goTo(a.getAttribute("href").slice(1));
      };
      $(".r-toc")?.addEventListener("click", onToc);
      tocM?.addEventListener("click", onToc);
      // a heading's own "#" anchor answers the same way
      prose.addEventListener("click", (e) => { const a = e.target.closest(".h-anchor"); if (a) { e.preventDefault(); goTo(a.getAttribute("href").slice(1)); } });
      // arriving with #section: land there without the smooth scroll
      const h0 = decodeURIComponent(location.hash.slice(1));
      if (h0 && tocLinks.has(h0)) requestAnimationFrame(() => goTo(h0, { smooth: false }));
    };
    if (window.marked || !md) draw();
    else addEventListener("load", draw, { once: true });
  }
  const sep = `<span class="r-sep" aria-hidden="true">·</span>`;

  /* i5 (T1) · the About card, under the dek: what this article is about. It opens the thing (project page,
     ranking, the ranking with its item lit, the pick on its shelf). One line of meta, no filler. */
  function aboutCard(ref) {
    const a = TH.about(ref);
    if (!a) return "";
    let art = `<i class="ph-bold ${a.icon}"></i>`, meta = "";
    if (a.kind === "project") {
      const pr = a.project, img = pr.images?.[0]?.src && Y.media(pr.images[0].src);
      if (img) art = `<img src="${esc(img)}" alt="" decoding="async">`;
      meta = `${esc(pr.type || "")} project · ${esc(pr.start)}${pr.end && pr.end !== pr.start ? ` – ${esc(pr.end)}` : ""}`;
    } else if (a.kind === "ranking") {
      art = Y.post.swatch("tierlist");
      meta = `${plural(TH.tierItems(a.post).length, "item")} · ${TH.aggregate(a.post).voters} ranked`;
    } else if (a.kind === "item") {
      const d = Y.post.tierDef(a.post, TH.ownerTierOf(a.post, a.item));
      if (window.TierImages) art = TierImages.svg(TierImages.best(a.item), a.item);
      meta = `${d ? `<span class="ytierkey r-about__tier" data-tier="${esc(d.id)}" data-tc="${d.color}">${esc(d.short)}</span>` : ""}on ${esc(a.post.title)}`;
    } else if (a.kind === "pick") {
      const pk = a.post, coll = TH.COLLECTIONS[pk.collection];
      art = `<span class="r-about__stub" data-stub="${esc(Y.post.STUB_COLORS.some(([k]) => k === pk.color) && Y.post.COLORS === "data" ? pk.color : "tan")}"></span>`;
      meta = [host(pk.url), coll && `on ${esc(coll.title)}`].filter(Boolean).join(" · ");
    }
    return `<a class="r-about ylift" href="${esc(a.href)}" data-kind="${a.kind}">
      <span class="r-about__art" aria-hidden="true">${art}</span>
      <span class="r-about__t"><span class="r-about__k">About this ${esc(a.word)}</span><b>${esc(a.name)}</b>${meta ? `<span class="r-about__m">${meta}</span>` : ""}</span>
      <i class="ph-bold ph-arrow-right r-about__go" aria-hidden="true"></i></a>`;
  }

  // every article is one renderer (i5): posts, write-ups (articles with `about`, project ones included) and, with
  // ?pickart=article, a pick that is an article (its pick card sits where a cover would)
  const isArticle = (x) => x && (x.type === "article" || (x.type === "pick" && !!x.body));
  const titleOf = (x) => x.articleTitle || x.title || x.name || "Untitled";
  function renderArticle() {
    const proj = P.get("project");
    let p, pr = null;
    if (proj) {
      pr = TH.findProject(proj);
      if (!pr) return notFound(`No project called “${proj}”.`);
      p = TH.writeupOfProject(pr);
      if (!p) return renderWriteup(pr);
    } else p = byId[P.get("id") || "a1"];
    if (!isArticle(p)) return notFound();
    const ab = TH.about(p.about);
    const prj = ab?.project || null;
    document.title = `${titleOf(p)} · Thoughts`;
    const arts = POSTS.filter(isArticle);
    const i = arts.indexOf(p), newer = arts[i - 1], older = arts[i + 1];
    const g = `art-${p.id}`;
    const full = (x) => Y.fmt.full(Y.parseDate(x.date));
    const mins = (x) => x.readMins || TH.minsOf(x.body);
    const isPick = p.type === "pick";
    const cover = isPick
      ? `<div class="r-pickcard">${Y.post({ ...p, body: undefined }, { tagsAs: "a" })}</div>`
      : p.cover ? `<figure class="r-cover"><button type="button" class="r-imgbtn" data-ylb="${g}" data-src="${esc(Y.media(p.cover))}" data-alt="${esc(titleOf(p))} (cover)" data-kind="image" aria-haspopup="dialog" aria-label="Open the cover image"><img src="${esc(Y.media(p.cover))}" alt="" decoding="async"></button></figure>` : "";
    // back: where you came from (the project's "Read the write-up" → the project), else all thoughts
    // i6 (T2): from the feed it's the feed as you left it (TH.ret: scroll + the post roped), else the article's own post
    const back = pr && !TH.ret ? { href: TH.projectHref(pr), label: pr.name } : TH.backTo(p.id);
    const linksIc = prj ? `${prj.github ? Y.linkIcon("github", prj.github, "Source on GitHub", { sm: true }) : ""}${prj.view ? Y.linkIcon("view", prj.view, "Visit the site", { sm: true }) : ""}` : "";
    const TOPNAV = APAGER === "top" && !FLOAT; // (T4: ‹ n / N › joins Back + copy in the top bar, like an item page)
    const facts = `${prj?.stack?.length ? fact("Built with", builtWith(prj.stack)) : ""}
        ${linksIc ? fact("Links", `<span class="r-links">${linksIc}</span>`) : ""}
        ${p.tags?.length ? fact("Tags", Y.tags(p.tags)) : ""}`;
    // i11 · pages · P4 (T8): no "Posted" / "Reading time" in the side rail: the kicker above the title says both, on the
    // same screen (phones already hid them). The rail keeps what only it says: Built with · Links · Tags
    const side = `<dl class="r-facts">
        ${facts}
      </dl>`;
    // i10 · pages (P2): the cards' kicker grammar, one Micro caps style, so "·" separates every part again (i4 dropped the
    // first one when the type was caps and the rest mono: two styles told them apart)
    const kicker = `${TH.typeBadge(p.type)}${sep}${Y.badge.date(p.date, { style: "full" })}${sep}<span>${mins(p)} min read</span>`;
    const dek = p.articleDek || p.dek;
    // (L7 on phones: Back leads the page, so the side rail's facts come into the column under the dek instead)
    const meta = `${dek ? `<p class="r-dek">${esc(dek)}</p>` : ""}${mFacts(facts)}${p.about ? aboutCard(p.about) : ""}`;
    const body = `${tocMobile}<div class="yprose" id="prose"></div>`;
    // i6 (T4, owner: "im wondering what it would look like using the open page design < >"): ?apager=top (decided i7)
    // puts previous / next in the sticky top bar like an item page (‹ 3 / 7 ›; ←/→ follow it) and drops the end pager.
    // The feed runs newest first, so "previous" is the newer article and "next" the older one (same as Projects).
    const side3 = (x) => x && { href: `?view=article&id=${x.id}`, title: titleOf(x), meta: `${full(x)} · ${mins(x)} min` };
    const topNav = TOPNAV ? { prev: side3(newer), next: side3(older), index: i + 1, total: arts.length, unit: "article" } : null;
    // ?apager=bottom (Earlier): i1's pager at the end · ?dfoot=float: i2's floating Older / All thoughts bar
    const end = topNav ? sign : `${sign}${Y.pager({
      prev: older && { href: `?view=article&id=${older.id}`, title: titleOf(older), meta: `${full(older)} · ${mins(older)} min` },
      next: newer && { href: `?view=article&id=${newer.id}`, title: titleOf(newer), meta: `${full(newer)} · ${mins(newer)} min` },
      ends: { prev: { label: "Oldest article", title: "Back to all thoughts", href: "stitched.html" }, next: { label: "Newest article", title: "Back to all thoughts", href: "stitched.html" } },
      label: "More articles",
    })}`;
    const floatFoot = `${older ? `<a class="btn btn--sm" href="?view=article&id=${older.id}" rel="prev"><i class="ph-bold ph-arrow-left" aria-hidden="true"></i><span class="r-pn"><small>Older</small>${esc(titleOf(older))}</span></a>` : ""}
      <span class="ydetail__spacer"></span>
      ${newer ? `<a class="btn btn--sm" href="?view=article&id=${newer.id}" rel="next"><span class="r-pn"><small>Newer</small>${esc(titleOf(newer))}</span><i class="ph-bold ph-arrow-right" aria-hidden="true"></i></a>` : `<a class="btn btn--sm btn--ghost" href="stitched.html">All thoughts</a>`}`;
    const detail = Y.detail({ back, actions: copyIcon, nav: topNav, kicker, title: titleOf(p), size: "lg", meta, media: cover, body,
      end: FLOAT ? sign : end, links: FLOAT ? floatFoot : "", wide: true });
    app.innerHTML = articleShell({ detail, side });
    $(".ydetail").dataset.ylbTitle = titleOf(p);
    $(".ydpage")?.classList.toggle("r-page--topnav", !!topNav);
    // i7 (apager=top decided): a long Back label (a project's name) gives way to ‹ n / N › and copy on a phone
    // (stitched.css ellipses it; the kit's label is a bare text node, so it gets a span to shrink in)
    const bk = topNav && $(".ydetail__top > .ydetail__back");
    const bt = bk && [...bk.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
    if (bt) { const s = document.createElement("span"); s.className = "r-backl"; bt.replaceWith(s); s.append(bt); }
    wireArticle(p.body, g);
  }

  // ?view=article&project=<slug> for a project WITHOUT a write-up (the Projects page never links here; old links can)
  function renderWriteup(pr) {
    document.title = `${pr.name} · write-up · Thoughts`;
    const mins = pr.writeup ? Math.max(1, Math.round(pr.writeup.split(/\s+/).length / 220)) : 0;
    const linksIc = `${pr.github ? Y.linkIcon("github", pr.github, "Source on GitHub", { sm: true }) : ""}${pr.view ? Y.linkIcon("view", pr.view, "Visit the site", { sm: true }) : ""}`;
    const facts = `${pr.stack?.length ? fact("Built with", builtWith(pr.stack)) : ""}
        ${linksIc ? fact("Links", `<span class="r-links">${linksIc}</span>`) : ""}`;
    const side = `<dl class="r-facts">
        ${fact("Project", Y.cardMeta(pr, { dur: true }), "r-fact--when")}
        ${facts}
      </dl>`;
    const kicker = `${Y.badge.type("writeup", { icon: "ph-scroll", label: "Write-up" })}${sep}<span>from the project</span>${mins ? `${sep}<span>${mins} min read</span>` : ""}`;
    const media = pr.images?.length ? Y.carousel(pr.images, { title: pr.name, group: `wu-${pr.slug}` }) : "";
    const body = `${pr.summary ? `<div class="r-summary">${mdToHTML(pr.summary)}</div>` : ""}
      ${tocMobile}
      ${pr.writeup ? `<div class="yprose" id="prose"></div>` : `<div class="r-none" id="prose"><p class="h3">No write-up for this one yet.</p><p class="muted">The summary above is everything so far. The project page has the media and links.</p></div>`}`;
    const end = `${sign}${Y.pager({ prev: { href: TH.projectHref(pr), title: `Back to ${pr.name}`, label: "The project" }, next: { href: "stitched.html", title: "All thoughts", label: "Thoughts" }, label: "Where next" })}`;
    const floatFoot = `<a class="btn btn--ink btn--sm" href="${TH.projectHref(pr)}"><i class="ph-bold ph-folder-simple" aria-hidden="true"></i>Back to the project</a><span class="ydetail__spacer"></span>${pr.github ? Y.linkIcon("github", pr.github) : ""}${pr.view ? Y.linkIcon("view", pr.view) : ""}`;
    const detail = Y.detail({ back: { href: TH.projectHref(pr), label: pr.name }, actions: copyIcon, kicker, title: pr.name, size: "lg", meta: `${pr.tagline ? `<p class="r-dek">${esc(pr.tagline)}</p>` : ""}${mFacts(facts)}`, media, body,
      end: FLOAT ? "" : end, links: FLOAT ? floatFoot : "", wide: true });
    app.innerHTML = articleShell({ detail, side, toc: !!pr.writeup });
    if (pr.writeup) wireArticle(pr.writeup, `wu-${pr.slug}`);
    else $(".t-progress")?.remove();
  }

  /* ============================================================
     COLLECTION — the feed's own pick cards in a real grid (or masonry), with i1's horizontal date strand on top
     ============================================================ */
  let strandAPI = null;
  function renderCollection() {
    const key = P.get("c") || "tools";
    const c = TH.COLLECTIONS[key];
    if (!c) return notFound(`No collection called “${key}”.`);
    document.title = `${c.title} · Thoughts`;
    const items = POSTS.filter((p) => p.collection === key);
    const first = items.at(-1), last = items[0];
    const span = items.length ? `<time class="ydate">${Y.fmt.day(Y.parseDate(first.date))} – ${Y.fmt.full(Y.parseDate(last.date))}</time>` : "";
    // i6 (T7): the collection wears its own mark here too (?collicon), in the kicker's place; none = a plain caps label
    const kick = COLLICON === "tile" ? TH.typeBadge("pick", "Collection")
      : `<span class="ybadge ybadge--type c-kind">${COLLICON === "none" ? "" : Y.post.collMark(c, items)}<span>Collection</span></span>`;
    const meta = `<div class="ymeta c-sub">${kick}<span class="meta">${plural(items.length, "pick")}</span>${span}</div>${c.blurb ? `<p class="c-blurb">${esc(c.blurb)}</p>` : ""}`;
    const ctx = { ...postCtx(), tagsAs: "a", pressed: null, here: key };
    const grid = !items.length
      ? Y.empty({ title: "Still winding this one.", text: `Picks for “${esc(c.title)}” will gather here.`, cls: "c-empty" }) // i7 · C1: the kit's empty state
      : `<ol class="c-grid" data-cview="${CVIEW}" aria-label="${esc(c.title)}">${items.map((p) => `<li class="c-cell" data-key="${p.id}">${Y.post(p, ctx)}</li>`).join("")}</ol>`;
    // i5 (T2.2, owner: "other collections and from projects dont need to show on collection pages")
    // i6 (T2): Back returns to the feed as you left it (or to the pick you opened this from)
    app.innerHTML = `<div class="c-page">${Y.detail({ back: TH.backTo(P.get("item")), title: c.title, meta,
      media: `${items.length > 1 ? `<div class="c-strand" id="c-strand"></div>` : ""}${grid}`, wide: true })}</div>`;
    if (items.length > 1) {
      strandAPI = Y.strand($("#c-strand"), items, { date: (p) => p.date, label: (p) => p.name, key: (p) => p.id, href: (p) => `#post-${p.id}` });
      $("#c-strand").addEventListener("ystrand", (e) => land(e.detail.key, { smooth: true }));
    }
    if (CVIEW === "masonry") watchSpans($(".c-grid")); // (its gap: --gap = the gutter, read by watchSpans)
    const want = P.get("item") || location.hash.match(/^#(?:pick|post)-(.+)$/)?.[1];
    // wait (briefly) for web fonts: card heights settle, so the scroll lands on the right card
    if (want && byId[want]?.collection === key) Promise.race([document.fonts?.ready, new Promise((r) => setTimeout(r, 400))]).then(() => requestAnimationFrame(() => land(want)));
  }
  // land on a pick: scroll it to the middle (instant on arrival, smooth from the strand), sew the rope briefly
  function land(id, { smooth = false } = {}) {
    const el = document.getElementById(`post-${id}`);
    if (!el) return;
    strandAPI?.select(id, { instant: !smooth }); // arriving with ?item=: the ball is already there; from the strand: it rolls
    const r = el.getBoundingClientRect();
    const off = r.top < 70 || r.bottom > innerHeight - 20;
    if (off) scrollTo({ top: Math.max(0, scrollY + r.top - Math.max(90, (innerHeight - r.height) / 2)), behavior: smooth && !reduced() ? "smooth" : "instant" });
    flash(el, 2900); // i6 (T8): un-sews the previous pick's rope as this one sews in
    if (!smooth) $(".ypost__ext, .ypost__wu", el)?.focus({ preventScroll: true });
    sound("tap", { el });
  }

  function notFound(msg = "That thought wandered off.") {
    app.innerHTML = `<div class="t-notfound"><p class="h2">${esc(msg)}</p><p class="muted">It may have been unravelled.</p><a class="btn" href="stitched.html"><i class="ph-bold ph-arrow-left" aria-hidden="true"></i>All thoughts</a></div>`;
  }

  /* ============================================================
     EVENTS (delegated)
     ============================================================ */
  // i6 (T6) · the about pill on a feed card, ?aboutgo: scroll (decided i7) = find it in the feed · page = open the thing
  // (rope its card; an item on a ranking also lights on the card's mini board) · split = the pill finds it, a ↗ beside
  // it opens it. A thing that isn't a feed post (a project) always opens its page.
  const feedPostOf = (ref) => { const a = TH.about(ref), p = a?.post; return p && POSTS.includes(p) ? { a, p } : null; };
  function lightItem(card, name) {
    const it = $$(".ypost__item", card).find((x) => x.dataset.key === name);
    if (!it) return;
    it.classList.remove("is-lit"); void it.offsetWidth; it.classList.add("is-lit");
    clearTimeout(it._t); it._t = setTimeout(() => it.classList.remove("is-lit"), 2600);
  }
  function splitAboutPills() {
    if (ABOUTGO !== "split") return;
    $$(".t-stream .yabout--about[data-about]").forEach((pill) => {
      const hit = feedPostOf(pill.dataset.about);
      if (!hit || pill.parentElement.classList.contains("yabout-split")) return;
      const wrap = document.createElement("span");
      wrap.className = "yabout-split";
      pill.replaceWith(wrap);
      pill.querySelector(".yabout__go")?.remove();
      pill.setAttribute("aria-label", `Find ${hit.a.name} in the feed`);
      wrap.append(pill);
      wrap.insertAdjacentHTML("beforeend", `<a class="yabout__open ylift" href="${esc(hit.a.href)}" aria-label="Open ${esc(hit.a.name)}"><i class="ph-bold ph-arrow-up-right" aria-hidden="true"></i></a>`);
    });
  }

  app.addEventListener("click", (e) => {
    const t = e.target;
    const ab = VIEW === "feed" && ABOUTGO !== "page" && t.closest(".yabout--about[data-about]");
    if (ab && !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)) {
      const hit = feedPostOf(ab.dataset.about);
      if (hit) {
        e.preventDefault();
        sound("tap", { el: ab });
        showPost(hit.p.id, { smooth: true, then: (card) => { if (hit.a.item) lightItem(card, hit.a.item); } });
        return;
      }
    }
    const all = t.closest(".t-all");
    if (all) { const had = F.anyIn(["type", "tag"]); F.clear(null, "rail"); if (had) sound("chip-off", { el: all }); return; }
    const tag = t.closest(".ypost .ytag[data-tag]");
    if (tag && tag.tagName === "BUTTON") { const on = F.toggle("tag", tag.dataset.tag, undefined, "card"); sound(on ? "chip-on" : "tag-remove", { el: tag }); return; }
    const clr = t.closest("[data-clear-all]");
    if (clr) { F.clear(null, "status"); sound("chip-off", { el: clr }); $("#t-search input")?.focus({ preventScroll: true }); return; }
    // ([data-lbopen] — an Images title — opens its lightbox in kit/posts.js)
    const tr = t.closest(".ypost__track");
    if (tr) return playTrack(tr.dataset.pl, +tr.dataset.i);
    const pa = t.closest(".ypost__all");
    if (pa) return playTrack(pa.dataset.pl, nowPlaying?.pl === pa.dataset.pl ? nowPlaying.i : 0);
    // (the article's copy-link icon is the kit's Yarn.copyBtn; its listener copies the page's URL, i7 · C1)
  });
  app.addEventListener("ychange", (e) => {
    const cardEl = e.target.closest(".ypost--tier");
    if (cardEl) return setMiniMode(cardEl, e.detail.value);
  });
  // i6 (T2): leaving the feed by a link (not a new tab, not a hash on this page) remembers where you were and what you clicked
  app.addEventListener("click", (e) => {
    if (VIEW !== "feed" || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest("a[href]");
    if (!a || a.target === "_blank" || a.closest("#t-tagpop")) return;
    const u = new URL(a.href, location.href);
    if (u.pathname === location.pathname && u.search === location.search) return;
    TH.noteLeave(a.href, a.closest(".ypost")?.dataset.id || null);
  });
  // bfcache: the feed comes back exactly as it was; rope what you'd clicked
  addEventListener("pageshow", (e) => {
    if (VIEW !== "feed" || !e.persisted) return;
    const r = TH.retOnFeed({ persisted: true });
    if (r?.id && byId[r.id]) showPost(byId[r.id].id, { keep: true });
  });

  /* ============================================================
     BOOT
     ============================================================ */
  if (VIEW === "article") renderArticle();
  else if (VIEW === "collection") renderCollection();
  else { renderFeed(); splitAboutPills(); if (TH.retOnFeed()) returnToClicked(); else focusFromHash(); }
  hookPlayer();
  addEventListener("load", hookPlayer, { once: true });

  // G1 (i5): open = still being decided · state = demo helpers (Jump to) · no flag = decided (Earlier options)
  Y.mockPanel([
    { label: "View", param: "view", state: true, options: [["", "Feed"], ["article", "Article"], ["collection", "Collection"]], default: "" },
    { label: "Article (view=article)", param: "id", state: true, options: [["a1", "a1 · an article"], ["a3", "a3 · about a pick (Ghostty)"], ["a4", "a4 · about the Browsers ranking"], ["a5", "a5 · about one item (Helium)"], ["w-bank", "Bank Simulation write-up"]], default: "a1" },
    { label: "Write-up from a project", param: "project", state: true, options: [["", "None"], ["bank-simulation", "Bank Simulation"], ["forth-evaluator", "Forth Evaluator"], ["sonata", "No write-up (Sonata)"]], default: "" },
    { label: "Lightbox on load", param: "lb", state: true, options: [["", "Closed"], ["post-e1:0", "Images"], ["post-e3:0", "Video"]], default: "" },
    // decided (Earlier). i7 Decided table: cardwu short · apager top · aboutgo scroll · collicon stubs (rail only, T1) ·
    // minimarks off. i6: pickart link (T1 reopened only its design: cardwu) · kicon circle
    { label: "Write-up link on a card (T1)", param: "cardwu", options: [["short", "Slim pill, no title"], ["foot", "“Write-up →” bottom right, like Read"], ["pill", "Pill with the title (i5)"]], default: "short" },
    { label: "Article previous / next (T4)", param: "apager", options: [["top", "‹ n / N › in the top bar"], ["bottom", "Pager at the end"]], default: "top" },
    { label: "“About” pill goes to (T6)", param: "aboutgo", options: [["scroll", "The thing in the feed"], ["page", "The thing's page"], ["split", "Name finds it, ↗ opens it"]], default: "scroll" },
    { label: "Collection mark (T7)", param: "collicon", options: [["stubs", "Its picks' tag stubs (rail only)"], ["circle", "Icon in a circle"], ["none", "No mark"], ["tile", "Gold tile (i5)"]], default: "stubs" },
    { label: "Mini ranking marks write-ups (R4)", param: "minimarks", options: [["off", "Off: keep it clean"], ["on", "On"]], default: "off" },
    { label: "A pick's article (T1)", param: "pickart", options: [["link", "Its own post; the pick links to it"], ["article", "The pick is the article"]], default: "link" },
    { label: "Kicker icon (T2.3)", param: "kicon", options: [["circle", "In its circle"], ["bare", "Bare, like i1"]], default: "circle" },
    { label: "Layout (feed)", param: "layout", options: [["split", "Split: rail + feed (i1)"], ["stacked", "Stacked (i2)"]], default: "split" },
    { label: "Search (split)", param: "tsearch", options: [["rail", "In the rail"], ["top", "Top of the feed"]], default: "rail" },
    { label: "Type icons", param: "typeicons", options: [["i1", "Material swatches (i1)"], ["line", "Line icons (i2)"]], default: "i1" },
    { label: "Month marks", param: "yearline", options: [["rule", "Pill + rule (i1)"], ["pill", "Pill only (i2)"]], default: "rule" },
    { label: "Card kicker", param: "kicker", options: [["caps", "CAPS + mono (i1)"], ["plain", "Mixed case (i2)"]], default: "caps" },
    { label: "Note / stub colours", param: "colors", options: [["data", "From the post"], ["default", "All default"]], default: "data" },
    { label: "Scratch thoughts", param: "scratch", options: [["sticky", "Sticky note"], ["felt", "Black felt"]], default: "sticky" },
    { label: "Collection grid", param: "cview", options: [["grid", "Grid"], ["masonry", "Masonry"]], default: "grid" },
    { label: "Mobile feed", param: "mfeed", options: [["list", "List"], ["thread", "Thread, no ball"]], default: "list" },
    { label: "Ranking card shows", param: "tl", options: [["owner", "Mine"], ["everyone", "Everyone"]], default: "owner" },
  ], { title: "Thoughts options" });
})();
