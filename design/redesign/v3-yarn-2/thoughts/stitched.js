/* ============================================================
   Thoughts · iteration 2 (yarn kit). Mock-only page logic.
   Views (URL params, all in the ⚙ panel):
     (feed)            ?type=a,b  ?tag=x,y  ?q=text      masonry by month · mobile list
                       ?scratch=sticky|felt  ?mfeed=list|thread  ?tl=owner|everyone
                       #post-<id> scrolls to a post and flashes the rope
     ?view=article     &id=a1  |  &project=<slug>        article / a project's write-up
     ?view=collection  &c=tools &item=p1 &cview=timeline|grid   (item → scrolled there + highlight)
     ?lb=post-e1:0     kit: open the lightbox on load   ?hold  keep highlights on (review)
   Built on kit/yarn.js: header, search, filter row + Browse, chips, tags,
   badges/dates, year pills, timeline, flip, lightbox, detail shell, swatches.
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
  const { POSTS, byId, TYPE, TYPES } = TH;
  const VIEW = ["article", "collection"].includes(P.get("view")) ? P.get("view") : "feed";
  const SCRATCH = document.documentElement.dataset.scratch || "sticky";
  const MFEED = P.get("mfeed") === "thread" ? "thread" : "list";
  const HOLD = P.has("hold");
  const host = (url) => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; } };
  const cat = (fill = "currentColor") => Y.catSVG("", fill);
  const collHref = (k, item) => `stitched.html?view=collection&c=${encodeURIComponent(k)}${item ? `&item=${encodeURIComponent(item)}` : ""}`;
  const fmtSecs = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
  let F = null; // the feed's filter model

  /* ============================================================
     CARDS: the kit's post renderer (kit/posts.js), so Studio's previews are the same cards
     ============================================================ */
  const postCtx = () => ({ tagsAs: "button", pressed: F?.state.tag, scratch: SCRATCH, tl: P.get("tl") === "everyone" ? "everyone" : "owner" });
  const cardHTML = (p) => Y.post(p, postCtx());
  function setMiniMode(cardEl, mode) {
    const p = byId[cardEl.dataset.id], mini = $(".ypost__mini", cardEl);
    if (!mini || mini.dataset.mode === mode) return;
    Y.flip(mini, ".ypost__item[data-key]", () => { mini.innerHTML = Y.post.miniBoard(p, mode); mini.dataset.mode = mode; }, { response: 0.5 });
    const cell = cardEl.closest(".t-cell");
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
      if (all) { $("span", all).textContent = mine && np.playing ? "Pause" : "Play all"; $("i", all).className = `ph-fill ${mine && np.playing ? "ph-pause" : "ph-play"}`; }
      const now = $(".ypost__now", c);
      if (now) now.textContent = mine ? `${np.playing ? "Now playing" : "Paused"}: ${p.tracks[np.i].title}${window.YarnPlayer ? " · in the player" : ""}` : "";
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
  const links = {
    coll: (except) => Object.entries(TH.COLLECTIONS).filter(([k]) => k !== except).map(([k, c]) => {
      const n = TH.collCount(k);
      return `<li><a class="yrow ylift t-link" href="${collHref(k)}"><span class="t-link__ic" aria-hidden="true"><i class="ph-bold ${c.icon}"></i></span><span class="t-link__t"><b>${esc(c.title)}</b><span class="meta">${n ? plural(n, "pick") : "nothing yet"}</span></span><i class="ph-bold ph-arrow-right t-link__go" aria-hidden="true"></i></a></li>`;
    }).join(""),
    writeups: () => TH.WRITEUPS.map((pr) => {
      const mins = Math.max(1, Math.round(pr.writeup.split(/\s+/).length / 220));
      return `<li><a class="yrow ylift t-link" href="${TH.writeupHref(pr)}"><span class="t-link__ic t-link__ic--ink" aria-hidden="true"><i class="ph-bold ph-scroll"></i></span><span class="t-link__t"><b>${esc(pr.name)}</b><span class="meta">write-up · ${mins} min</span></span><i class="ph-bold ph-arrow-right t-link__go" aria-hidden="true"></i></a></li>`;
    }).join(""),
  };

  function makeFilters() {
    const urlTags = (P.get("tag") || "").split(",").map((s) => s.trim()).filter(Boolean);
    const known = new Set(TH.TAGS.map(([t]) => t));
    return Y.filters({
      groups: [
        { key: "type", label: "Type", kind: "post", row: true, values: TYPES.map((t) => ({ value: t.key, label: t.plural, icon: t.icon })), get: (p) => p.type },
        { key: "tag", label: "Tags", kind: "tag", values: [...known, ...urlTags.filter((t) => !known.has(t))] },
      ],
      items: POSTS,
      text: (p) => [p.title, p.text, p.name, p.blurb, p.dek, p.note, TYPE[p.type]?.one, ...(p.tags || []), ...(p.tracks || []).map((t) => t.title), ...(p.media || []).map((m) => m.alt)].filter(Boolean).join(" "),
      url: true,
    });
  }

  function railHTML() {
    const tg = F.group("type"), gg = F.group("tag");
    return `<section class="t-rail__sec" aria-labelledby="rail-type">
        <h2 class="eyebrow t-rail__h" id="rail-type">Type</h2>
        <div class="t-rail__types" role="group" aria-labelledby="rail-type">
          <button type="button" class="ychip ysel" data-all aria-pressed="true"><i class="ph-bold ph-stack" aria-hidden="true"></i><span class="ychip__l">Show all</span><span class="ychip__c" aria-hidden="true">${POSTS.length}</span></button>
          ${tg.values.map((vi) => Y.chip(tg, vi, { count: 0, attrs: `data-yf="type:${esc(vi.value)}"` })).join("")}
        </div>
      </section>
      <section class="t-rail__sec" aria-labelledby="rail-tags">
        <h2 class="eyebrow t-rail__h" id="rail-tags">Tags</h2>
        <div class="t-rail__tags" role="group" aria-labelledby="rail-tags">${gg.values.map((vi) => Y.chip(gg, vi, { cls: "ychip--sm", attrs: `data-yf="tag:${esc(vi.value)}"` })).join("")}</div>
      </section>
      <section class="t-rail__sec" aria-labelledby="rail-colls">
        <h2 class="eyebrow t-rail__h" id="rail-colls">Collections</h2>
        <ul class="t-links">${links.coll()}</ul>
      </section>
      ${TH.WRITEUPS.length ? `<section class="t-rail__sec" aria-labelledby="rail-wu">
        <h2 class="eyebrow t-rail__h" id="rail-wu">From projects</h2>
        <ul class="t-links">${links.writeups()}</ul>
      </section>` : ""}`;
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
        ${Y.yearPill(Y.fmt.monthLong(m.d), { count: m.posts.length, unit: "post", id: `m-${m.key}`, attrs: `data-key="m:${m.key}"` })}
        <div class="t-grid">${m.posts.map((p) => `<div class="t-cell${thread ? " ytl__item" : ""}" data-key="${p.id}">${thread ? `<span class="ytl__knot" aria-hidden="true"></span>` : ""}${cardHTML(p)}</div>`).join("")}</div>
      </section>`).join("");
  }

  function renderFeed() {
    document.title = "Thoughts · blaqat.net";
    F = makeFilters();
    const first = Y.parseDate(POSTS.at(-1).date);
    // one page header, same place and style as every page (desktop: above the rail + feed; meta inline)
    app.innerHTML = `
      ${Y.header({ title: "Thoughts", meta: `${POSTS.length} posts · since ${Y.fmt.month(first)}` })}
      <div class="t-feed${MFEED === "thread" ? " t-feed--thread" : ""}">
        <aside class="t-rail" aria-label="Browse thoughts">${railHTML()}</aside>
        <div class="t-main">
          <div class="ytools t-tools"><div class="t-search" id="t-search"></div><div class="t-row" id="t-row"></div></div>
          <div class="t-status" id="t-status" role="status"></div>
          <div class="t-stream${MFEED === "thread" ? " ytl" : ""}" id="t-stream">${streamHTML()}</div>
          <div class="t-empty" id="t-empty" hidden></div>
        </div>
      </div>`;
    Y.search($("#t-search"), F, { placeholder: "Search thoughts", label: "Search thoughts" });
    // the kit Browse sheet's link slot: Collections + project write-ups (they navigate, they don't filter)
    Y.filterRow($("#t-row"), F, { extra: [
      { label: "Collections", html: `<ul class="t-links">${links.coll()}</ul>` },
      TH.WRITEUPS.length ? { label: "From projects", html: `<ul class="t-links">${links.writeups()}</ul>` } : null,
    ] });
    // phones: the kit's one mobile pattern (?msearch=bar|fab); month pills stack under the sticky filter row
    const stream = $("#t-stream");
    Y.listTools(F, { tools: $(".t-tools"), search: $("#t-search"), row: $("#t-row"), sticky: stream,
      label: "Search and filter thoughts", title: "Find a thought", count: () => `${POSTS.filter((p) => F.test(p)).length} of ${POSTS.length} shown` });

    F.on(() => { paintRail(); paintCardTags(); applyFilter(true); });
    paintRail();
    applyFilter(false);
    watchSpans();
    markPlaying();
  }

  function paintRail() {
    const rail = $(".t-rail");
    if (!rail) return;
    for (const b of $$(".ychip[data-g]", rail)) {
      const on = F.has(b.dataset.g, b.dataset.v);
      b.setAttribute("aria-pressed", String(on));
      const n = F.count(b.dataset.g, b.dataset.v);
      b.classList.toggle("is-zero", n === 0 && !on);
      const c = $(".ychip__c", b); if (c) c.textContent = n;
      b.title = `${n} post${n === 1 ? "" : "s"}`;
    }
    $("[data-all]", rail).setAttribute("aria-pressed", String(!F.anyIn(["type", "tag"])));
  }
  const paintCardTags = () => $$(".ypost .ytag[data-tag]").forEach((b) => b.setAttribute("aria-pressed", String(F.has("tag", b.dataset.tag))));

  /* ---------- masonry: 4px grid rows, each cell spans its own height ---------- */
  let GAP = 16;
  function setSpan(cell) {
    if (!cell || cell.hidden) return;
    const h = cell.offsetHeight;
    if (h) cell.style.gridRowEnd = `span ${Math.ceil((h + GAP) / 4)}`;
  }
  let spanRO = null;
  function watchSpans() {
    GAP = parseFloat(getComputedStyle($("#t-stream")).getPropertyValue("--gap")) || 16;
    spanRO?.disconnect();
    spanRO = new ResizeObserver((es) => es.forEach((e) => { if (!e.target.hidden && e.contentRect.height) setSpan(e.target); }));
    $$(".t-cell").forEach((c) => { setSpan(c); spanRO.observe(c); });
    addEventListener("resize", () => { GAP = parseFloat(getComputedStyle($("#t-stream")).getPropertyValue("--gap")) || 16; });
  }

  /* ---------- filtering: survivors glide, new ones grow in, leaving ones fade (kit flip) ---------- */
  let firstApply = true;
  function applyFilter(animate) {
    const stream = $("#t-stream");
    const mutate = () => {
      let shown = 0;
      $$(".t-cell", stream).forEach((c) => { const ok = F.test(byId[c.dataset.key]); c.hidden = !ok; if (ok) shown++; });
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
  function paintStatus(shown) {
    const el = $("#t-status"), empty = $("#t-empty");
    const parts = [...F.state.type].map((k) => TYPE[k]?.plural || k).concat([...F.state.tag].map((t) => "#" + t));
    if (F.q.trim()) parts.push(`“${F.q.trim()}”`);
    const any = F.any();
    el.classList.toggle("is-idle", !any);
    el.innerHTML = any
      ? `<span class="meta">${shown} of ${POSTS.length} · ${esc(parts.join(", "))}</span><button type="button" class="ylinkbtn" data-clear-all>Clear filters</button>`
      : ""; // idle: the header already says how many (no repeat)
    empty.hidden = shown > 0;
    if (!shown) {
      const onlyTag = F.state.tag.size === 1 && !F.state.type.size && !F.q.trim() ? [...F.state.tag][0] : null;
      empty.innerHTML = `<p class="h3">${onlyTag ? `Nothing tagged #${esc(onlyTag)} yet.` : "Nothing matches that."}</p><p class="muted">${onlyTag ? "Other pages link here with their tags; this one hasn't been posted about." : "Try fewer filters."} <button type="button" class="ylinkbtn" data-clear-all>Show everything</button></p>`;
    }
  }

  /* ---------- #post-<id>: scroll there + a brief rope ---------- */
  function flash(el, ms = 2600) {
    el.classList.add("ysel");
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("is-selected")));
    if (!HOLD) setTimeout(() => el.classList.remove("is-selected"), ms);
  }
  function focusFromHash() {
    const id = location.hash.match(/^#post-(.+)$/)?.[1];
    if (!id || !byId[id]) return;
    if (!F.test(byId[id])) F.clear(null, "hash");
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const el = document.getElementById(`post-${id}`);
      if (!el) return;
      const r = el.getBoundingClientRect();
      scrollTo(0, scrollY + r.top - Math.max(80, (innerHeight - r.height) / 2));
      flash(el);
    }));
  }

  /* ============================================================
     ARTICLE (posts + project write-ups) on the kit detail shell
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
  const copyBtn = `<button type="button" class="ylinkicon r-copylink" aria-label="Copy link to this page" title="Copy link"><i class="ph-bold ph-link" aria-hidden="true"></i></button>`;

  // the kit's detail-page skeleton: reading column + the table of contents as its rail
  function articleShell({ detail, toc = true }) {
    return `<div class="t-progress" aria-hidden="true"><span></span></div>
      ${Y.detailPage(`<div class="r-main">${detail}</div>`, { rail: toc ? `<div class="r-toc"><nav aria-labelledby="toc-h"><p class="eyebrow" id="toc-h">On this page</p><ol></ol></nav></div>` : "", railLabel: "On this page" })}`;
  }
  function wireArticle(md, group, { cover = null } = {}) {
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
      const links = new Map($$(".r-toc a").map((a) => [a.getAttribute("href").slice(1), a]));
      const bar = $(".t-progress span");
      const onScroll = () => {
        const r = prose.getBoundingClientRect();
        bar.style.setProperty("--p", Math.max(0, Math.min(1, (-r.top + innerHeight * 0.3) / Math.max(1, r.height - innerHeight * 0.6))).toFixed(4));
        let cur = heads[0];
        for (const h of heads) if (h.getBoundingClientRect().top < innerHeight * 0.3) cur = h;
        links.forEach((a, id) => (id === cur?.id ? a.setAttribute("aria-current", "location") : a.removeAttribute("aria-current")));
      };
      addEventListener("scroll", onScroll, { passive: true });
      onScroll();
      tocM?.addEventListener("click", (e) => { if (e.target.closest("a")) tocM.open = false; });
    };
    if (window.marked || !md) draw();
    else addEventListener("load", draw, { once: true });
  }
  const tocMobile = `<details class="r-toc-m" hidden><summary><i class="ph-bold ph-list-bullets" aria-hidden="true"></i>On this page<i class="ph-bold ph-caret-down" aria-hidden="true"></i></summary><ol></ol></details>`;

  function renderArticle() {
    const proj = P.get("project");
    if (proj) return renderWriteup(proj);
    const p = byId[P.get("id") || "a1"];
    if (!p || p.type !== "article") return notFound();
    document.title = `${p.title} · Thoughts`;
    const arts = POSTS.filter((x) => x.type === "article");
    const i = arts.indexOf(p), newer = arts[i - 1], older = arts[i + 1];
    const g = `art-${p.id}`;
    const cover = p.cover ? `<figure class="r-cover"><button type="button" class="r-imgbtn" data-ylb="${g}" data-src="${esc(Y.media(p.cover))}" data-alt="${esc(p.title)} (cover)" data-kind="image" aria-haspopup="dialog" aria-label="Open the cover image"><img src="${esc(Y.media(p.cover))}" alt="" decoding="async"></button></figure>` : "";
    const meta = `<div class="ymeta">${TH.typeBadge("article")}<span class="meta">${p.readMins} min read</span>${Y.badge.date(p.date, { style: "full" })}</div>${Y.tags(p.tags)}`;
    const body = `${p.dek ? `<p class="r-dek">${esc(p.dek)}</p>` : ""}${tocMobile}<div class="yprose" id="prose"></div>
      <p class="r-sign">${cat("var(--ink)")}<span>Thanks for reading. More scraps in <a href="stitched.html">Thoughts</a>.</span></p>`;
    const foot = `${older ? `<a class="btn btn--sm" href="?view=article&id=${older.id}" rel="prev"><i class="ph-bold ph-arrow-left" aria-hidden="true"></i><span class="r-pn"><small>Older</small>${esc(older.title)}</span></a>` : ""}
      <span class="ydetail__spacer"></span>
      ${newer ? `<a class="btn btn--sm" href="?view=article&id=${newer.id}" rel="next"><span class="r-pn"><small>Newer</small>${esc(newer.title)}</span><i class="ph-bold ph-arrow-right" aria-hidden="true"></i></a>` : `<a class="btn btn--sm btn--ghost" href="stitched.html">All thoughts</a>`}`;
    app.innerHTML = articleShell({ detail: Y.detail({ back: { href: "stitched.html", label: "All thoughts" }, actions: copyBtn, title: p.title, meta, media: cover, body, links: foot, wide: true }) });
    $(".ydetail").dataset.ylbTitle = p.title;
    wireArticle(p.body, g);
  }

  // ?view=article&project=<slug>: the part of a project's description after the separator
  function renderWriteup(slug) {
    const pr = TH.findProject(slug);
    if (!pr) return notFound(`No project called “${slug}”.`);
    document.title = `${pr.name} · write-up · Thoughts`;
    const meta = `<p class="eyebrow r-from"><i class="ph-bold ph-scroll" aria-hidden="true"></i>Write-up from the project</p>${Y.meta(pr, { dur: true })}${Y.stack(pr.stack)}`;
    const media = pr.images?.length ? Y.carousel(pr.images, { title: pr.name, group: `wu-${pr.slug}` }) : "";
    const body = `${pr.tagline ? `<p class="r-dek">${esc(pr.tagline)}</p>` : ""}
      ${pr.summary ? `<div class="r-summary">${mdToHTML(pr.summary)}</div>` : ""}
      ${tocMobile}
      ${pr.writeup ? `<div class="yprose" id="prose"></div>` : `<div class="r-none" id="prose"><p class="h3">No write-up for this one yet.</p><p class="muted">The summary above is everything so far. The project page has the media and links.</p></div>`}`;
    const foot = `<a class="btn btn--ink btn--sm" href="${TH.projectHref(pr)}"><i class="ph-bold ph-folder-simple" aria-hidden="true"></i>Back to the project</a><span class="ydetail__spacer"></span>${pr.github ? Y.linkIcon("github", pr.github) : ""}${pr.view ? Y.linkIcon("view", pr.view) : ""}`;
    app.innerHTML = articleShell({ detail: Y.detail({ back: { href: TH.projectHref(pr), label: pr.name }, actions: copyBtn, title: pr.name, meta, media, body, links: foot, wide: true }), toc: !!pr.writeup });
    if (pr.writeup) wireArticle(pr.writeup, `wu-${pr.slug}`);
    else $(".t-progress")?.remove();
  }

  /* ============================================================
     COLLECTION — the picks on the kit timeline; ?item= arrives on one
     ============================================================ */
  let tl = null;
  function pickRow(p) {
    const h = host(p.url);
    const tone = ["ink", "red", "cotton"][Y.hash(p.name) % 3];
    return `<article class="ycard ylift ysel c-pick" id="pick-${p.id}" data-id="${p.id}" aria-labelledby="h-${p.id}" aria-current="false">
      <span class="c-mono" data-tone="${tone}" aria-hidden="true">${esc(p.name[0].toUpperCase())}</span>
      <div class="c-pick__main">
        <h3 class="c-pick__name" id="h-${p.id}"><a class="t-stretch" href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.name)}<i class="ph-bold ph-arrow-up-right" aria-hidden="true"></i><span class="sr-only"> (${esc(h)}, opens in a new tab)</span></a></h3>
        <div class="ymeta c-pick__meta"><span class="meta">${esc(h)}</span><span class="meta">· added</span>${TH.date(p)}</div>
        <p class="c-pick__blurb">${esc(p.blurb)}</p>
        <div class="c-pick__foot">${Y.tags(p.tags)}<a class="c-pick__post" href="stitched.html#post-${p.id}">See the post<i class="ph-bold ph-arrow-right" aria-hidden="true"></i></a></div>
      </div>
    </article>`;
  }
  function renderCollection() {
    const key = P.get("c") || "tools";
    const c = TH.COLLECTIONS[key];
    if (!c) return notFound(`No collection called “${key}”.`);
    document.title = `${c.title} · Thoughts`;
    const items = POSTS.filter((p) => p.collection === key);
    const mode = P.get("cview") === "grid" ? "grid" : "timeline";
    const first = items.at(-1), last = items[0];
    const span = items.length ? `<time class="ydate">${Y.fmt.day(Y.parseDate(first.date))} – ${Y.fmt.full(Y.parseDate(last.date))}</time>` : "";
    const meta = `<div class="ymeta">${TH.typeBadge("pick", "Collection")}<span class="meta">${plural(items.length, "pick")}</span>${span}</div>`;
    const list = !items.length
      ? `<div class="c-empty"><p class="h3">Still winding this one.</p><p class="muted">Picks for “${esc(c.title)}” will gather here.</p></div>`
      : mode === "grid"
        ? `<ol class="c-grid">${items.map((p) => `<li data-key="${p.id}">${pickRow(p)}</li>`).join("")}</ol>`
        : Y.timelineHTML(Y.byYear(items, (p) => p.date), pickRow, { key: (p) => p.id, unit: "pick" });
    const seg = items.length > 1 ? Y.seg([{ value: "timeline", label: "Timeline", icon: "ph-git-commit" }, { value: "grid", label: "Grid", icon: "ph-squares-four" }], { value: mode, label: "Layout", name: "cview" }) : "";
    const tags = [...new Set(items.flatMap((p) => p.tags))];
    // the kit's detail-page skeleton: the picks in the reading column, related links as the rail
    app.innerHTML = Y.detailPage(`<div class="c-main">${Y.detail({ back: { href: "stitched.html", label: "All thoughts" }, title: c.title, meta, body: `<div class="c-bar"><p class="c-blurb">${esc(c.blurb)}</p>${seg}</div><div class="c-list" data-mode="${mode}">${list}</div>` })}</div>`, {
      railLabel: "More",
      rail: `<div class="c-side">
          ${tags.length ? `<section class="c-side__sec"><h2 class="eyebrow t-rail__h">Tagged</h2>${Y.tags(tags)}</section>` : ""}
          ${Object.keys(TH.COLLECTIONS).length > 1 ? `<section class="c-side__sec"><h2 class="eyebrow t-rail__h">Other collections</h2><ul class="t-links">${links.coll(key)}</ul></section>` : ""}
          ${TH.WRITEUPS.length ? `<section class="c-side__sec"><h2 class="eyebrow t-rail__h">From projects</h2><ul class="t-links">${links.writeups()}</ul></section>` : ""}
        </div>` });
    tl = mode === "timeline" && items.length ? Y.timeline($(".c-list .ytl"), { ball: true, trail: true }) : null;
    const want = P.get("item") || location.hash.match(/^#pick-(.+)$/)?.[1];
    // wait (briefly) for web fonts: card heights settle, so the scroll and the ball land on the right knot
    if (want && byId[want]?.collection === key) Promise.race([document.fonts?.ready, new Promise((r) => setTimeout(r, 400))]).then(() => requestAnimationFrame(() => arrive(want, items)));
  }
  // land on the pick: scroll so it settles centred (instant), roll the ball down to it, sew the rope briefly
  function arrive(id, items) {
    const el = document.getElementById(`pick-${id}`);
    if (!el) return;
    const r = el.getBoundingClientRect();
    scrollTo(0, Math.max(0, scrollY + r.top - Math.max(90, (innerHeight - r.height) / 2)));
    if (tl) {
      tl.select(items[0].id, { instant: true });
      requestAnimationFrame(() => tl.select(id));
    }
    setTimeout(() => el.setAttribute("aria-current", "true"), tl && items[0].id !== id && !reduced() ? 260 : 0);
    if (!HOLD) setTimeout(() => el.setAttribute("aria-current", "false"), 2900);
    $(".c-pick__name a", el)?.focus({ preventScroll: true });
  }

  function notFound(msg = "That thought wandered off.") {
    app.innerHTML = `<div class="t-notfound"><p class="h2">${esc(msg)}</p><p class="muted">It may have been unravelled.</p><a class="btn" href="stitched.html"><i class="ph-bold ph-arrow-left" aria-hidden="true"></i>All thoughts</a></div>`;
  }

  /* ============================================================
     EVENTS (delegated)
     ============================================================ */
  app.addEventListener("click", (e) => {
    const t = e.target;
    const all = t.closest(".t-rail [data-all]");
    if (all) { const had = F.anyIn(["type", "tag"]); F.clear(null, "rail"); if (had) sound("chip-off", { el: all }); return; }
    const tag = t.closest(".ypost .ytag[data-tag]");
    if (tag) { const on = F.toggle("tag", tag.dataset.tag, undefined, "card"); sound(on ? "chip-on" : "tag-remove", { el: tag }); return; }
    const clr = t.closest("[data-clear-all]");
    if (clr) { F.clear(null, "status"); sound("chip-off", { el: clr }); $("#t-search input")?.focus({ preventScroll: true }); return; }
    // ([data-lbopen] — an Images title — opens its lightbox in kit/posts.js)
    const tr = t.closest(".ypost__track");
    if (tr) return playTrack(tr.dataset.pl, +tr.dataset.i);
    const pa = t.closest(".ypost__all");
    if (pa) return playTrack(pa.dataset.pl, nowPlaying?.pl === pa.dataset.pl ? nowPlaying.i : 0);
    const cl = t.closest(".r-copylink");
    if (cl) {
      try { navigator.clipboard?.writeText(location.href); } catch (_) {}
      sound("copy", { el: cl });
      cl.innerHTML = `<i class="ph-bold ph-check" aria-hidden="true"></i>`; cl.setAttribute("aria-label", "Link copied");
      setTimeout(() => { cl.innerHTML = `<i class="ph-bold ph-link" aria-hidden="true"></i>`; cl.setAttribute("aria-label", "Copy link to this page"); }, 1500);
    }
  });
  app.addEventListener("ychange", (e) => {
    const cardEl = e.target.closest(".ypost--tier");
    if (cardEl) return setMiniMode(cardEl, e.detail.value);
    if (e.detail.name === "cview") {
      const u = new URL(location.href);
      u.searchParams.set("cview", e.detail.value); u.searchParams.delete("item");
      history.replaceState(null, "", u);
      const y = scrollY;
      Y.params.set("cview", e.detail.value); Y.params.delete("item");
      renderCollection();
      scrollTo(0, y);
      $(`.yseg__btn[data-v="${e.detail.value}"]`)?.focus({ preventScroll: true });
    }
  });

  /* ============================================================
     BOOT
     ============================================================ */
  if (VIEW === "article") renderArticle();
  else if (VIEW === "collection") renderCollection();
  else { renderFeed(); focusFromHash(); }
  hookPlayer();
  addEventListener("load", hookPlayer, { once: true });

  Y.mockPanel([
    { label: "View", param: "view", options: [["", "Feed"], ["article", "Article"], ["collection", "Collection"]], default: "" },
    { label: "Scratch thoughts", param: "scratch", options: [["sticky", "Sticky note"], ["felt", "Black felt"]], default: "sticky" },
    { label: "Mobile feed", param: "mfeed", options: [["list", "List"], ["thread", "Thread, no ball"]], default: "list" },
    { label: "Tier card shows", param: "tl", options: [["owner", "Mine"], ["everyone", "Everyone"]], default: "owner" },
    { label: "Article (view=article)", param: "project", options: [["", "Post a1"], ["bank-simulation", "Bank Simulation write-up"], ["forth-evaluator", "Forth Evaluator write-up"], ["sonata", "No write-up (Sonata)"]], default: "" },
    { label: "Collection layout", param: "cview", options: [["timeline", "Timeline"], ["grid", "Grid"]], default: "timeline" },
    { label: "Lightbox on load", param: "lb", options: [["", "Closed"], ["post-e1:0", "Images"], ["post-e3:0", "Video"]], default: "" },
  ], { title: "Thoughts options" });
})();
