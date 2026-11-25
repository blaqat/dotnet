/* ============================================================
   Thoughts · "Stitched" (round 3 yarn). Mock-only page logic.
   Views (URL params):
     ?view=feed (default)  &layout=masonry|thread  &type=a,b  &tag=x,y
     ?view=article&id=a1
     ?view=collection&c=tools  &cview=grid|list
     ?lightbox=e1:0   opens the lightbox on post e1, item 0
     ?reduced         reduced motion   ?nav=…  mobile nav material
   ============================================================ */
(() => {
  const P = new URLSearchParams(location.search);
  const D = window.THOUGHTS || { posts: [], collections: {} };
  const app = document.getElementById("content");
  const reduced = () => (window.Yarn?.reduced ? window.Yarn.reduced() : matchMedia("(prefers-reduced-motion: reduce)").matches);
  if (reduced()) document.documentElement.classList.add("t-reduced");

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const cat = (fill = "currentColor") => (window.Yarn?.catSVG ? window.Yarn.catSVG("", fill) : "");

  /* ---------- data ---------- */
  // Mock-local addition: one video post so the lightbox can be checked with video + gif.
  // Remove with ?extra=0. Uses media that exists in ../media.
  const LOCAL = P.get("extra") === "0" ? [] : [
    { id: "e3", type: "embed", date: "2026-09-21T20:15", tags: ["projects", "video"], local: true,
      title: "Old builds, in motion", note: "Two clips and a gif from the archive.",
      media: [
        { src: "../media/webcheckers.mp4", alt: "WebCheckers: quick gameplay showcase", kind: "video" },
        { src: "../media/fitr-redesign.gif", alt: "FiTR: redesign of the skill selection card" },
        { src: "../media/wsg.mp4", alt: "Talking to Sonata in voice chat", kind: "video" },
      ] },
  ];
  const POSTS = [...D.posts, ...LOCAL].sort((a, b) => b.date.localeCompare(a.date));
  const byId = Object.fromEntries(POSTS.map((p) => [p.id, p]));
  const media = (src) => (src?.startsWith("/media/") ? ".." + src : src);
  const isVideo = (m) => m.kind === "video" || /\.(mp4|webm|mov)(#.*)?$/i.test(m.src);

  const TYPES = [
    ["scratch", "Scratch", "Scratch", "ph-scribble-loop"],
    ["article", "Articles", "Article", "ph-article"],
    ["pick", "Picks", "Pick", "ph-tag"],
    ["tierlist", "Tier lists", "Tier list", "ph-ranking"],
    ["playlist", "Playlists", "Playlist", "ph-playlist"],
    ["embed", "Images", "Images", "ph-images"],
  ];
  const TYPE = Object.fromEntries(TYPES.map(([k, plural, one, icon]) => [k, { plural, one, icon }]));

  /* ---------- dates ---------- */
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const MONTH = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const parse = (s) => { const [d, t = "00:00"] = s.split("T"); const [y, m, dd] = d.split("-").map(Number); const [h, mi] = t.split(":").map(Number); return new Date(y, m - 1, dd, h, mi); };
  const fDay = (d) => `${MON[d.getMonth()]} ${d.getDate()}`;
  const fFull = (d) => `${MON[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  const fTime = (d) => { const h = d.getHours(); return `${h % 12 || 12}:${String(d.getMinutes()).padStart(2, "0")} ${h >= 12 ? "pm" : "am"}`; };

  /* ---------- filter state (none selected = all) ---------- */
  const readSet = (k) => new Set((P.get(k) || "").split(",").map((s) => s.trim()).filter(Boolean));
  const state = { types: new Set([...readSet("type")].filter((k) => TYPE[k])), tags: readSet("tag") };
  const TAGS = (() => {
    const m = new Map();
    POSTS.forEach((p) => p.tags.forEach((t) => m.set(t, (m.get(t) || 0) + 1)));
    return [...m].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  })();
  const matches = (p) => (!state.types.size || state.types.has(p.type)) && (!state.tags.size || p.tags.some((t) => state.tags.has(t)));
  function syncURL() {
    const u = new URL(location.href);
    state.types.size ? u.searchParams.set("type", [...state.types].join(",")) : u.searchParams.delete("type");
    state.tags.size ? u.searchParams.set("tag", [...state.tags].join(",")) : u.searchParams.delete("tag");
    history.replaceState(null, "", u);
  }
  const toggle = (set, v) => (set.has(v) ? set.delete(v) : set.add(v));

  /* ============================================================
     CARDS
     ============================================================ */
  const tagsHTML = (p) => !p.tags.length ? "" :
    `<ul class="post__tags" aria-label="Tags">${p.tags.map((t) =>
      `<li><button type="button" class="t-tag" data-tag="${esc(t)}" aria-pressed="${state.tags.has(t)}"><span class="h" aria-hidden="true">#</span>${esc(t)}</button></li>`).join("")}</ul>`;

  function metaHTML(p, extra = "", withTime = false) {
    const d = parse(p.date);
    return `<header class="post__meta">
      <span class="post__type"><i class="ph-bold ${TYPE[p.type].icon}" aria-hidden="true"></i>${TYPE[p.type].one}</span>${extra}
      <a class="post__date" href="#post-${p.id}" title="${fFull(d)}, ${fTime(d)}"><time datetime="${p.date}">${fDay(d)}${withTime ? " · " + fTime(d) : ""}</time></a>
    </header>`;
  }

  // a teardrop loop of red yarn through the tag's eyelet
  const LOOP = "M17 26 C 9 22, -6 10, -5 -3 C -4 -12, 8 -13, 10 -4 C 12 5, 13 16, 17 26";
  const STRING = `<svg class="pick__string" viewBox="-14 -16 46 56" aria-hidden="true">
      <path class="ply-base" stroke-width="2.8" d="${LOOP}"/><path class="ply-twist" stroke-width="2.8" d="${LOOP}"/>
      <circle cx="17" cy="26" r="2.6" fill="var(--red-deep)"/>
    </svg>`;

  const host = (url) => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; } };
  const collCount = (key) => POSTS.filter((x) => x.collection === key).length;

  const card = {
    scratch(p) {
      const d = parse(p.date);
      return `<article class="post post--scratch m-felt" id="post-${p.id}" data-id="${p.id}" aria-label="Scratch thought, ${fFull(d)}">
        ${metaHTML(p, "", true)}
        <p class="scratch__text">${esc(p.text)}</p>
        ${tagsHTML(p)}
      </article>`;
    },
    article(p) {
      return `<article class="post post--article patch" id="post-${p.id}" data-id="${p.id}" aria-labelledby="h-${p.id}">
        <span class="bookmark" aria-hidden="true"></span>
        ${p.cover ? `<div class="article__cover"><img src="${media(p.cover)}" alt="" loading="lazy" decoding="async"></div>` : ""}
        <div class="post__body">
          ${metaHTML(p, `<span class="post__read">${p.readMins} min read</span>`)}
          <h3 class="article__title" id="h-${p.id}"><a class="stretch" href="?view=article&id=${p.id}">${esc(p.title)}</a></h3>
          <p class="article__dek">${esc(p.dek)}</p>
          <div class="post__foot">${tagsHTML(p)}<span class="article__go" aria-hidden="true">Read <i class="ph-bold ph-arrow-right"></i></span></div>
        </div>
      </article>`;
    },
    pick(p, opts = {}) {
      const c = D.collections[p.collection] || { title: p.collection, icon: "ph-folder" };
      const h = host(p.url);
      const inColl = opts.inCollection;
      const d = parse(p.date);
      return `<article class="post post--pick patch${inColl ? " c-card" : ""}" id="${inColl ? "pick" : "post"}-${p.id}" data-id="${p.id}" aria-labelledby="h-${p.id}">
        <span class="pick__eyelet" aria-hidden="true"></span>${STRING}
        ${inColl ? `<span class="c-mono" data-tone="${["ink", "red", "cotton"][[...p.name].reduce((a, ch) => a + ch.charCodeAt(0), 0) % 3]}" aria-hidden="true">${esc(p.name[0].toUpperCase())}</span>` : ""}
        ${inColl
          ? `<header class="post__meta"><span class="post__type"><i class="ph-bold ph-calendar-blank" aria-hidden="true"></i>Added</span><span class="post__date"><time datetime="${p.date}">${fFull(d)}</time></span></header>`
          : metaHTML(p)}
        <h3 class="pick__name" id="h-${p.id}"><a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.name)}<i class="ph-bold ph-arrow-up-right" aria-hidden="true"></i><span class="sr-only"> (${h}, opens in a new tab)</span></a></h3>
        <p class="pick__blurb">${esc(p.blurb)}</p>
        <div class="pick__foot">
          <p class="pick__host meta">${h}</p>
          ${inColl
            ? `<a class="c-card__post" href="stitched.html#post-${p.id}">See the post<i class="ph-bold ph-arrow-right" aria-hidden="true"></i></a>`
            : `<a class="pick__coll" href="?view=collection&c=${p.collection}#pick-${p.id}"><i class="ph-bold ${c.icon}" aria-hidden="true"></i><span>${esc(c.title)}</span><span class="n" aria-label="${collCount(p.collection)} picks">${collCount(p.collection)}</span><i class="ph-bold ph-arrow-right" aria-hidden="true"></i></a>`}
        </div>
        ${inColl ? tagsHTML(p).replace("post__tags", "post__tags c-tags") : ""}
      </article>`;
    },
    tierlist(p) {
      const mode = P.get("tl") === "all" ? "all" : "mine";
      return `<article class="post post--tier patch" id="post-${p.id}" data-id="${p.id}" aria-labelledby="h-${p.id}">
        ${metaHTML(p, `<span class="post__read"><i class="ph-bold ph-users" aria-hidden="true"></i>${p.community.voters} ranked</span>`)}
        <div class="tier__head"><h3 class="tier__title" id="h-${p.id}"><a href="tierlist.html?skin=yarn&from=${p.id}">${esc(p.title)}</a></h3></div>
        <div class="seg tier__seg" role="group" aria-label="Whose ranking to show">
          <button type="button" class="seg__btn" data-tier-mode="mine" aria-pressed="${mode === "mine"}">Mine</button>
          <button type="button" class="seg__btn" data-tier-mode="all" aria-pressed="${mode === "all"}"><i class="ph-bold ph-users-three" aria-hidden="true"></i>Everyone <span class="n">${p.community.voters}</span></button>
        </div>
        <div class="tier__board" data-tl="${p.id}" data-mode="${mode}">${tierBoardHTML(p, mode)}</div>
        <div class="tier__actions">
          <a class="btn t-btn-sm t-btn-red" href="tierlist.html?skin=yarn"><i class="ph-bold ph-plus" aria-hidden="true"></i>Make your own</a>
          <a class="btn t-btn-sm" href="tierlist.html?skin=yarn&from=${p.id}"><i class="ph-bold ph-shuffle" aria-hidden="true"></i>Remix this one</a>
        </div>
        ${p.tags.length ? `<div class="post__foot">${tagsHTML(p)}</div>` : ""}
      </article>`;
    },
    playlist(p) {
      const secs = p.tracks.reduce((s, t) => { const [m, ss] = t.dur.split(":").map(Number); return s + m * 60 + ss; }, 0);
      return `<article class="post post--playlist patch" id="post-${p.id}" data-id="${p.id}" aria-labelledby="h-${p.id}">
        ${metaHTML(p)}
        <div class="pl__head">
          <div class="pl__disc" aria-hidden="true"><span class="pl__label">${cat("#fff")}</span></div>
          <div class="pl__info">
            <h3 class="pl__title" id="h-${p.id}">${esc(p.title)}</h3>
            ${p.note ? `<p class="pl__note">${esc(p.note)}</p>` : ""}
            <p class="meta">${p.tracks.length} tracks · ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}</p>
          </div>
        </div>
        <ol class="pl__tracks">${p.tracks.map((t, i) => `<li><button type="button" class="pl__track" data-pl="${p.id}" data-i="${i}" aria-label="Play ${esc(t.title)} by ${esc(t.by)}, ${t.dur}">
            <span class="pl__num" aria-hidden="true"><span>${i + 1}</span><i class="ph-fill ph-play"></i><span class="pl__eq"><b></b><b></b><b></b></span></span>
            <span class="pl__t">${esc(t.title)}<small>${esc(t.by)}</small></span>
            <span class="pl__dur">${t.dur}</span>
          </button></li>`).join("")}</ol>
        <p class="pl__now" aria-live="polite"></p>
        <div class="post__foot">
          <button type="button" class="btn t-btn-sm t-btn-red pl__all" data-pl="${p.id}"><i class="ph-fill ph-play" aria-hidden="true"></i><span>Play all</span></button>
          ${tagsHTML(p)}
        </div>
      </article>`;
    },
    embed(p) {
      const n = p.media.length;
      const kinds = p.media.some(isVideo) ? (p.media.every(isVideo) ? "videos" : "items") : (n === 1 ? "image" : "images");
      return `<article class="post post--embed patch" id="post-${p.id}" data-id="${p.id}" aria-labelledby="h-${p.id}">
        ${metaHTML(p, `<span class="post__read">${n} ${kinds}</span>`)}
        <h3 class="embed__title" id="h-${p.id}">${esc(p.title)}</h3>
        ${p.note ? `<p class="embed__note">${esc(p.note)}</p>` : ""}
        <div class="embed__grid" data-n="${Math.min(n, 4)}">${p.media.map((m, i) => thumbHTML(p, m, i, n)).join("")}</div>
        ${p.tags.length ? `<div class="post__foot">${tagsHTML(p)}</div>` : ""}
      </article>`;
    },
  };

  function thumbHTML(p, m, i, n) {
    const vid = isVideo(m), gif = /\.gif$/i.test(m.src);
    const src = media(m.src);
    return `<button type="button" class="embed__thumb" data-lb="${p.id}:${i}" aria-haspopup="dialog" aria-label="Open ${vid ? "video" : "image"} ${i + 1} of ${n}: ${esc(m.alt)}">
      ${vid
        ? `<video src="${src}#t=0.6" muted playsinline preload="metadata" aria-hidden="true" tabindex="-1"></video>`
        : `<img src="${src}" alt="" decoding="async">`}
      ${vid ? `<span class="embed__badge"><i class="ph-fill ph-play" aria-hidden="true"></i>VIDEO</span>` : gif ? `<span class="embed__badge">GIF</span>` : ""}
      <span class="embed__zoom" aria-hidden="true"><i class="ph-bold ph-arrows-out-simple"></i></span>
    </button>`;
  }

  // missing media -> tidy placeholder, never a broken image
  document.addEventListener("error", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLImageElement || t instanceof HTMLVideoElement)) return;
    if (t.dataset.missing) return;
    t.dataset.missing = "1";
    const ph = document.createElement("span");
    ph.className = "t-missing";
    ph.innerHTML = `<i class="ph ph-image-broken" aria-hidden="true"></i><span>media coming soon</span>`;
    t.replaceWith(ph);
  }, true);

  /* ---------- tier board ---------- */
  const TIERS = ["S", "A", "B", "C", "D"];
  function tierRows(p, mode) {
    if (mode === "mine") return TIERS.map((t) => ({ tier: t, items: (p.tiers[t] || []).map((name) => ({ name })) }));
    const mine = {};
    TIERS.forEach((t, i) => (p.tiers[t] || []).forEach((n) => (mine[n] = i)));
    const rows = TIERS.map((t) => ({ tier: t, items: [] }));
    for (const [name, dist] of Object.entries(p.community.items)) {
      let best = 0;
      dist.forEach((v, i) => { if (v > dist[best]) best = i; });
      const tot = dist.reduce((a, b) => a + b, 0) || 1;
      const mean = dist.reduce((s, v, i) => s + v * (4 - i), 0) / tot;
      rows[best].items.push({ name, pct: Math.round((dist[best] / tot) * 100), mean, delta: (mine[name] ?? best) - best, mineTier: TIERS[mine[name]] });
    }
    rows.forEach((r) => r.items.sort((a, b) => b.mean - a.mean));
    return rows;
  }
  function tierBoardHTML(p, mode) {
    const rows = tierRows(p, mode);
    const label = mode === "mine" ? "My ranking" : `Everyone's ranking, ${p.community.voters} people`;
    return `<ol class="tier__rows" aria-label="${label}">${rows.map((r) => `
      <li class="tier__row" data-tier="${r.tier}">
        <span class="tier__key" aria-hidden="true">${r.tier}</span>
        <ul class="tier__items" aria-label="${r.tier} tier">${r.items.length ? r.items.map((it) => `
          <li class="tier__item" data-name="${esc(it.name)}">${esc(it.name)}${it.pct != null ? `<span class="tier__pct" aria-label=", ${it.pct}% agree">${it.pct}%</span>` : ""}${
            it.delta > 0 ? `<i class="ph-bold ph-arrow-up tier__delta" role="img" aria-label="ranked higher than mine (I put it in ${it.mineTier})" title="Higher than mine (${it.mineTier})"></i>`
            : it.delta < 0 ? `<i class="ph-bold ph-arrow-down tier__delta" role="img" aria-label="ranked lower than mine (I put it in ${it.mineTier})" title="Lower than mine (${it.mineTier})"></i>` : ""}</li>`).join("")
          : `<li class="tier__none">empty</li>`}</ul>
      </li>`).join("")}</ol>
      ${mode === "all" ? `<p class="tier__note meta">Each item sits where most voters put it; % is how many agree. <i class="ph-bold ph-arrow-up" aria-hidden="true"></i><i class="ph-bold ph-arrow-down" aria-hidden="true"></i> = differs from mine.</p>` : ""}`;
  }
  function setTierMode(cardEl, mode) {
    const p = byId[cardEl.dataset.id];
    const board = $(".tier__board", cardEl);
    if (board.dataset.mode === mode) return;
    $$(".seg__btn", cardEl).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.tierMode === mode)));
    // FLIP: chips travel between rows instead of popping
    const before = new Map($$(".tier__item", board).map((el) => [el.dataset.name, el.getBoundingClientRect()]));
    board.innerHTML = tierBoardHTML(p, mode);
    board.dataset.mode = mode;
    if (reduced()) { board.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180, easing: "ease-out" }); return; }
    const spring = getComputedStyle(document.documentElement).getPropertyValue("--ease-spring").trim() || "cubic-bezier(.2,.8,.2,1)";
    $$(".tier__item", board).forEach((el, i) => {
      const a = before.get(el.dataset.name);
      if (!a) return;
      const b = el.getBoundingClientRect();
      const dx = a.left - b.left, dy = a.top - b.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], { duration: 560, delay: i * 14, easing: spring, fill: "backwards" });
    });
    const note = $(".tier__note", board);
    note?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240, delay: 200, fill: "backwards" });
  }

  /* ---------- playlist: global player if present, else a local <audio> ---------- */
  let localAudio = null, nowPlaying = null; // { pl, i }
  // shape the global player understands ({ name, url }); extra fields are harmless
  const toTrack = (p, t) => ({ name: t.title, url: t.src, title: t.title, by: t.by, artist: t.by, dur: t.dur, collection: p.title, from: `thoughts/${p.id}` });
  const sameURL = (a, b) => !!a && !!b && (a === b || a.split("/").pop() === b.split("/").pop());
  // mirror the global player's state onto any tracklist that holds its current track
  function syncFromPlayer(s) {
    if (!s) return;
    let hit = null;
    for (const p of POSTS) if (p.type === "playlist") {
      const i = p.tracks.findIndex((t) => sameURL(t.src, s.track?.url));
      if (i >= 0) { hit = { pl: p.id, i }; break; }
    }
    if (hit) { nowPlaying = { ...hit, playing: !!s.playing }; markPlaying(hit.pl, hit.i, !!s.playing); }
    else if (nowPlaying) { nowPlaying = null; markPlaying(null, null, false); }
  }
  let playerHooked = false;
  function hookPlayer() {
    if (playerHooked || !window.YarnPlayer?.on) return;
    playerHooked = true;
    window.YarnPlayer.on((s, kind) => { if (kind === "track" || kind === "state") syncFromPlayer(s); });
    syncFromPlayer(window.YarnPlayer.state);
  }
  function markPlaying(plId, i, playing) {
    $$(".post--playlist").forEach((c) => {
      const on = c.dataset.id === plId && playing;
      c.classList.toggle("is-playing", on);
      $$(".pl__track", c).forEach((b) => {
        const cur = c.dataset.id === plId && +b.dataset.i === i;
        const p = byId[c.dataset.id], t = p.tracks[+b.dataset.i];
        cur ? b.setAttribute("aria-current", "true") : b.removeAttribute("aria-current");
        b.setAttribute("aria-label", `${cur && on ? "Pause" : "Play"} ${t.title} by ${t.by}, ${t.dur}`);
        $(".pl__num i", b).className = `ph-fill ${cur && on ? "ph-pause" : "ph-play"}`;
      });
      const all = $(".pl__all", c);
      if (all) { $("span", all).textContent = on ? "Pause" : "Play all"; $("i", all).className = `ph-fill ${on ? "ph-pause" : "ph-play"}`; }
      const now = $(".pl__now", c);
      if (now) now.textContent = c.dataset.id === plId && i != null ? `${playing ? "Now playing" : "Paused"}: ${byId[plId].tracks[i].title}${window.YarnPlayer ? " (in the player)" : ""}` : "";
    });
  }
  function playTrack(plId, i) {
    const p = byId[plId];
    const queue = p.tracks.map((t) => toTrack(p, t));
    if (window.YarnPlayer?.play) {
      hookPlayer();
      const cur = window.YarnPlayer.state?.track;
      if (cur && sameURL(cur.url, p.tracks[i].src) && window.YarnPlayer.toggle) return window.YarnPlayer.toggle();
      window.YarnPlayer.play(queue[i], queue);
      nowPlaying = { pl: plId, i, playing: true };
      return markPlaying(plId, i, true);
    }
    if (!localAudio) {
      localAudio = new Audio();
      localAudio.preload = "none";
      localAudio.addEventListener("ended", () => {
        const n = nowPlaying && byId[nowPlaying.pl].tracks[nowPlaying.i + 1];
        n ? playTrack(nowPlaying.pl, nowPlaying.i + 1) : (nowPlaying.playing = false, markPlaying(nowPlaying.pl, nowPlaying.i, false));
      });
    }
    if (nowPlaying && nowPlaying.pl === plId && nowPlaying.i === i) {
      nowPlaying.playing = !nowPlaying.playing;
      nowPlaying.playing ? localAudio.play().catch(() => {}) : localAudio.pause();
      return markPlaying(plId, i, nowPlaying.playing);
    }
    localAudio.src = p.tracks[i].src;
    localAudio.play().catch(() => {});
    nowPlaying = { pl: plId, i, playing: true };
    markPlaying(plId, i, true);
  }

  /* ============================================================
     FEED
     ============================================================ */
  const layout = P.get("layout") === "thread" ? "thread" : "masonry";
  const firstDate = parse(POSTS[POSTS.length - 1]?.date || "2026-01-01");

  function railHTML() {
    const count = (k) => POSTS.filter((p) => p.type === k).length;
    return `
      <header class="t-rail__head">
        <h1 class="t-title">Thoughts<span class="dot">.</span></h1>
        <p class="t-blurb">Scratch notes posted to the void, longer write-ups, picks, rankings and playlists. Newest first.</p>
        <p class="meta">${POSTS.length} posts · since ${MON[firstDate.getMonth()]} ${firstDate.getFullYear()}</p>
      </header>
      <section class="t-rail__sec" aria-labelledby="rail-types">
        <h2 class="eyebrow" id="rail-types">Type</h2>
        <div class="t-typelist" role="group" aria-labelledby="rail-types">
          <button type="button" class="chip t-type" data-type="" aria-pressed="${!state.types.size}"><span class="t-sw t-sw--all" aria-hidden="true"></span>Everything<span class="t-count">${POSTS.length}</span></button>
          ${TYPES.map(([k, plural]) => `<button type="button" class="chip t-type" data-type="${k}" aria-pressed="${state.types.has(k)}"><span class="t-sw t-sw--${k}" aria-hidden="true"></span>${plural}<span class="t-count">${count(k)}</span></button>`).join("")}
        </div>
      </section>
      <section class="t-rail__sec" aria-labelledby="rail-tags">
        <h2 class="eyebrow" id="rail-tags">Tags</h2>
        <div class="t-taglist" role="group" aria-labelledby="rail-tags">${tagChips()}</div>
      </section>
      <section class="t-rail__sec" aria-labelledby="rail-colls">
        <h2 class="eyebrow" id="rail-colls">Collections</h2>
        <ul class="t-colls">${collLinks()}</ul>
      </section>
      <a class="t-maker" href="tierlist.html?skin=yarn">
        <span class="t-maker__rows" aria-hidden="true">
          <span style="--c:var(--tier-S);--w:38%"></span><span style="--c:var(--tier-A);--w:64%"></span><span style="--c:var(--tier-B);--w:88%"></span><span style="--c:var(--tier-C);--w:52%"></span><span style="--c:var(--tier-D);--w:30%"></span>
        </span>
        <b>Rank anything</b><small>Make a tier list, then see how it stacks up against everyone else's.</small>
        <span class="t-maker__go">Open the tier list maker <i class="ph-bold ph-arrow-right" aria-hidden="true"></i></span>
      </a>`;
  }
  const tagChips = () => TAGS.map(([t, n]) => `<button type="button" class="chip t-tagchip" data-tag="${esc(t)}" aria-pressed="${state.tags.has(t)}"><span class="h" aria-hidden="true">#</span>${esc(t)}<span class="sr-only">, ${n} posts</span></button>`).join("");
  const collLinks = (except) => Object.entries(D.collections).filter(([k]) => k !== except).map(([k, c]) => {
    const n = collCount(k);
    return `<li><a class="t-coll-link" href="?view=collection&c=${k}"><span class="t-coll-ico" aria-hidden="true"><i class="ph-bold ${c.icon}"></i></span><span><b>${esc(c.title)}</b><span class="meta">${n ? `${n} pick${n > 1 ? "s" : ""}` : "nothing yet"}</span></span><i class="ph-bold ph-arrow-right" aria-hidden="true"></i></a></li>`;
  }).join("");

  // mobile: one compact title row; collections + the tier list maker live in the "Browse" sheet
  function mobileHeadHTML() {
    return `<header class="t-mhead">
      <h1 class="t-title">Thoughts<span class="dot">.</span></h1>
      <p class="meta">${POSTS.length} posts · newest first</p>
    </header>`;
  }
  function chipbarHTML() {
    return `<div class="t-chiprow">
        <div class="t-chipscroll" role="group" aria-label="Filter by type">
          <button type="button" class="chip t-type" data-type="" aria-pressed="${!state.types.size}">All</button>
          ${TYPES.map(([k, plural, , icon]) => `<button type="button" class="chip t-type" data-type="${k}" aria-pressed="${state.types.has(k)}"><i class="ph-bold ${icon}" aria-hidden="true"></i>${plural}</button>`).join("")}
        </div>
        <button type="button" class="chip t-tagtoggle" aria-expanded="false" aria-controls="t-tagtray"><i class="ph-bold ph-faders-horizontal" aria-hidden="true"></i>Browse<span class="n" aria-hidden="true">${state.tags.size || ""}</span></button>
      </div>
      <div class="t-tagtray" id="t-tagtray" hidden>
        <p class="eyebrow t-tray__h" id="tray-tags">Tags</p>
        <div class="t-tray__tags" role="group" aria-labelledby="tray-tags">${tagChips()}</div>
        <p class="eyebrow t-tray__h" id="tray-colls">Collections</p>
        <ul class="t-colls t-tray__colls" aria-labelledby="tray-colls">${collLinks()}<li><a class="t-coll-link t-mk" href="tierlist.html?skin=yarn"><span class="t-coll-ico" aria-hidden="true"><i class="ph-bold ph-ranking"></i></span><span><b>Tier list maker</b><span class="meta">rank anything</span></span><i class="ph-bold ph-arrow-right" aria-hidden="true"></i></a></li></ul>
      </div>`;
  }

  function renderFeed() {
    document.title = "Thoughts · blaqat.net";
    app.innerHTML = `
      <div class="t-feed" data-layout="${layout}">
        <aside class="t-rail" aria-label="Browse thoughts">${railHTML()}</aside>
        <div class="t-main">
          ${mobileHeadHTML()}
          <div class="t-chipbar">${chipbarHTML()}</div>
          <div class="t-status" id="t-status" role="status"></div>
          <div class="t-stream" id="t-stream"></div>
        </div>
      </div>`;
    renderStream(false);
    // a selected chip that starts off-screen in the mobile row is scrolled into view
    const row = $(".t-chipscroll"), on = $(".t-chipscroll .t-type[data-type]:not([data-type='' ])[aria-pressed='true']");
    if (row && on && on.offsetLeft + on.offsetWidth > row.clientWidth) row.scrollLeft = on.offsetLeft - 14;
  }

  function renderStream(animate = true) {
    const stream = $("#t-stream");
    const list = POSTS.filter(matches);
    const any = state.types.size || state.tags.size;
    const desc = [
      state.types.size ? [...state.types].map((k) => TYPE[k].plural.toLowerCase()).join(" + ") : "",
      state.tags.size ? [...state.tags].map((t) => "#" + t).join(" or ") : "",
    ].filter(Boolean).join(", tagged ");
    $("#t-status").classList.toggle("is-idle", !any);
    $("#t-status").innerHTML = any
      ? `<span class="meta">${list.length} of ${POSTS.length} · ${esc(desc)}</span><button type="button" class="t-clear t-hit">Clear filters</button>`
      : `<span class="meta">${POSTS.length} posts, newest first</span>`;

    const months = [];
    for (const p of list) {
      const d = parse(p.date), key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!months.length || months.at(-1).key !== key) months.push({ key, d, posts: [] });
      months.at(-1).posts.push(p);
    }
    const html = !list.length
      ? `<div class="t-empty"><p class="h3">Nothing matches that.</p><p>Try fewer filters. <button type="button" class="t-clear t-hit">Clear filters</button></p></div>`
      : months.map((m) => `
        <section class="t-month" aria-labelledby="m-${m.key}">
          <h2 class="t-month__label" id="m-${m.key}">${MONTH[m.d.getMonth()]} ${m.d.getFullYear()}<span class="meta">${m.posts.length} post${m.posts.length > 1 ? "s" : ""}</span></h2>
          ${layout === "thread"
            ? `<ol class="t-thread">${m.posts.map((p) => { const d = parse(p.date); return `<li class="t-thread__item"><div class="t-thread__when" aria-hidden="true">${fDay(d)}<span>${DOW[d.getDay()]}</span><span>${fTime(d)}</span></div><span class="t-thread__knot" aria-hidden="true"></span>${card[p.type](p)}</li>`; }).join("")}</ol>`
            : `<div class="t-grid">${m.posts.map((p) => card[p.type](p)).join("")}</div>`}
        </section>`).join("");
    // thread layout: a sticky month index (one swatch per post) uses the right-hand space
    const index = layout === "thread" && list.length ? `<nav class="t-mindex" aria-label="Jump to month"><p class="eyebrow">On the thread</p><ol>${months.map((m) => `
        <li><a href="#m-${m.key}" data-month="${m.key}"><b>${MON[m.d.getMonth()]} ${m.d.getFullYear()}</b><span class="meta">${m.posts.length}</span>
          <span class="t-mindex__map" aria-hidden="true">${m.posts.map((p) => `<span class="t-sw t-sw--${p.type}" title="${TYPE[p.type].one}"></span>`).join("")}</span></a></li>`).join("")}</ol></nav>` : "";

    const swap = () => {
      stream.innerHTML = index ? `<div class="t-threadwrap"><div class="t-threadcol">${html}</div>${index}</div>` : html;
      layoutMasonry(); restorePlaying(); watchMonths();
      // a tag pressed inside a card was just re-rendered: put focus back where the hand was
      if (pendingFocus) {
        const f = pendingFocus; pendingFocus = null;
        const el = document.querySelector(`#post-${f.id} .t-tag[data-tag="${CSS.escape(f.tag)}"]`) || $("#t-status .t-clear") || $("#t-status");
        if (el) { if (el.id === "t-status") el.setAttribute("tabindex", "-1"); el.focus({ preventScroll: true }); }
      }
    };
    if (animate && document.startViewTransition && !reduced()) document.startViewTransition(swap);
    else if (animate && !reduced()) { swap(); stream.animate([{ opacity: 0.4 }, { opacity: 1 }], { duration: 200, easing: "ease-out" }); }
    else swap();
  }
  let pendingFocus = null;
  let monthIO;
  function watchMonths() {
    monthIO?.disconnect();
    const links = $$(".t-mindex a");
    if (!links.length) return;
    const set = (key) => links.forEach((a) => (a.dataset.month === key ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current")));
    set(links[0].dataset.month);
    monthIO = new IntersectionObserver((es) => {
      const vis = es.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (vis) set(vis.target.getAttribute("aria-labelledby").slice(2));
    }, { rootMargin: "-10% 0px -70% 0px" });
    $$(".t-month").forEach((m) => monthIO.observe(m));
  }
  function restorePlaying() { if (nowPlaying) markPlaying(nowPlaying.pl, nowPlaying.i, nowPlaying.playing); }

  // masonry: each card spans ceil((h + gap) / 4px) rows. ResizeObserver handles image loads + resizes.
  let ro;
  function setSpan(el) {
    const g = parseFloat(getComputedStyle(el).marginBottom) || 16;
    el.style.gridRowEnd = `span ${Math.ceil((el.getBoundingClientRect().height + g) / 4)}`;
  }
  function layoutMasonry() {
    ro?.disconnect();
    const cards = $$(".t-grid > .post");
    if (!cards.length) return;
    ro = new ResizeObserver((entries) => entries.forEach((e) => setSpan(e.target)));
    cards.forEach((c) => { setSpan(c); ro.observe(c); });
  }

  function refreshFilters() {
    $$(".t-type").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.type ? state.types.has(b.dataset.type) : !state.types.size)));
    $$(".t-tagchip, .t-tag").forEach((b) => b.setAttribute("aria-pressed", String(state.tags.has(b.dataset.tag))));
    const n = $(".t-tagtoggle .n");
    if (n) n.textContent = state.tags.size || "";
    syncURL();
    renderStream(true);
  }

  function focusPostFromHash() {
    const id = location.hash.match(/^#post-(.+)$/)?.[1];
    if (!id || !byId[id]) return;
    if (!matches(byId[id])) { state.types.clear(); state.tags.clear(); refreshFilters(); }
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const el = document.getElementById(`post-${id}`);
      if (!el) return;
      el.scrollIntoView({ block: "center", behavior: "instant" });
      ropeFlash(el);
    }));
  }
  function ropeFlash(el) {
    el.classList.add("rope");
    requestAnimationFrame(() => el.classList.add("is-roped"));
    setTimeout(() => el.classList.remove("is-roped"), P.has("hold") ? 1e9 : 2600);
    setTimeout(() => el.classList.remove("rope"), P.has("hold") ? 1e9 : 3100);
  }

  /* ============================================================
     ARTICLE
     ============================================================ */
  const slug = (s) => s.toLowerCase().replace(/<[^>]+>/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  function mdToHTML(md) {
    if (window.marked?.parse) return window.marked.parse(md, { gfm: true });
    // tiny fallback if the CDN is unreachable: headings, quotes, fences, lists, paragraphs
    const out = [];
    for (const b of md.split(/\n{2,}/)) {
      if (/^```/.test(b)) { const [, lang, code] = b.match(/^```(\w*)\n([\s\S]*?)```?$/) || [, "", b]; out.push(`<pre><code class="language-${lang}">${esc(code)}</code></pre>`); continue; }
      if (/^#{2,4} /.test(b)) { const l = b.match(/^#+/)[0].length; out.push(`<h${l}>${esc(b.slice(l + 1))}</h${l}>`); continue; }
      if (/^> /.test(b)) { out.push(`<blockquote><p>${esc(b.replace(/^> /gm, ""))}</p></blockquote>`); continue; }
      if (/^- /.test(b)) { out.push(`<ul>${b.split("\n").map((l) => `<li>${esc(l.slice(2))}</li>`).join("")}</ul>`); continue; }
      const img = b.match(/^!\[(.*?)\]\((.*?)\)$/);
      if (img) { out.push(`<p><img src="${esc(img[2])}" alt="${esc(img[1])}"></p>`); continue; }
      out.push(`<p>${esc(b).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/`(.+?)`/g, "<code>$1</code>")}</p>`);
    }
    return out.join("\n");
  }
  function highlight(code, lang) {
    if (!/^(ts|js|typescript|javascript|svelte)$/.test(lang)) return esc(code);
    const KW = /\b(let|const|var|function|return|import|from|export|if|else|new|await|async|type|interface)\b/;
    return code.split(/(\/\/.*$|"[^"]*"|'[^']*'|`[^`]*`|\b[A-Za-z_]\w*\b(?=\s*\()|\b[A-Z]\w*\b|\b\w+\b)/m).map((tok) => {
      if (!tok) return "";
      if (tok.startsWith("//")) return `<span class="tok-c">${esc(tok)}</span>`;
      if (/^["'`]/.test(tok)) return `<span class="tok-s">${esc(tok)}</span>`;
      if (KW.test(tok) && /^\w+$/.test(tok)) return `<span class="tok-k">${esc(tok)}</span>`;
      if (/^[A-Z]\w*$/.test(tok)) return `<span class="tok-t">${esc(tok)}</span>`;
      return esc(tok);
    }).join("").replace(/\b(\w+)(?=\()/g, '<span class="tok-f">$1</span>');
  }
  function enhanceProse(prose, p) {
    // headings: ids + anchors
    const used = new Set();
    $$("h2, h3", prose).forEach((h) => {
      let id = slug(h.textContent) || "section";
      while (used.has(id)) id += "-x";
      used.add(id);
      h.id = id;
      h.insertAdjacentHTML("afterbegin", `<a class="h-anchor" href="#${id}" aria-label="Link to this section">#</a>`);
    });
    // code blocks
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
        try { await navigator.clipboard.writeText(raw); } catch {}
        $("span", b).textContent = "Copied";
        $("i", b).className = "ph-bold ph-check";
        setTimeout(() => { $("span", b).textContent = "Copy"; $("i", b).className = "ph-bold ph-copy"; }, 1400);
      });
    });
    // tables
    $$("table", prose).forEach((t) => {
      const w = document.createElement("div");
      w.className = "r-table"; w.tabIndex = 0; w.setAttribute("role", "region"); w.setAttribute("aria-label", "Table");
      t.replaceWith(w); w.appendChild(t);
    });
    // images -> figures that open the lightbox (cover is item 0)
    let n = p.cover ? 1 : 0;
    $$("img", prose).forEach((img) => {
      const fig = document.createElement("figure");
      fig.className = "r-fig";
      const alt = img.getAttribute("alt") || "";
      fig.innerHTML = `<button type="button" class="r-imgbtn" data-lb="${p.id}:${n}" aria-haspopup="dialog" aria-label="Open image: ${esc(alt)}"><img src="${esc(img.getAttribute("src"))}" alt="" decoding="async" data-alt="${esc(alt)}"><span class="embed__zoom" aria-hidden="true"><i class="ph-bold ph-arrows-out-simple"></i></span></button>${alt ? `<figcaption>${esc(alt)}</figcaption>` : ""}`;
      const host = img.closest("p");
      (host && host.textContent.trim() === "" ? host : img).replaceWith(fig);
      n++;
    });
    $$("a[href^='http']", prose).forEach((a) => { a.target = "_blank"; a.rel = "noopener"; });
  }

  function renderArticle() {
    const p = byId[P.get("id") || "a1"];
    if (!p || p.type !== "article") return renderNotFound();
    document.title = `${p.title} · Thoughts`;
    const d = parse(p.date);
    const arts = POSTS.filter((x) => x.type === "article");
    const i = arts.indexOf(p), newer = arts[i - 1], older = arts[i + 1];
    const tagLinks = p.tags.map((t) => `<a class="r-tagl" href="stitched.html?tag=${encodeURIComponent(t)}">#${esc(t)}</a>`).join("");
    app.innerHTML = `
      <div class="t-progress" aria-hidden="true"><span></span></div>
      <div class="r-wrap">
        <aside class="r-side" aria-label="About this article">
          <a class="r-back" href="stitched.html"><i class="ph-bold ph-arrow-left" aria-hidden="true"></i>All thoughts</a>
          <dl class="r-facts">
            <div><dt>Posted</dt><dd><time datetime="${p.date}">${fFull(d)}</time></dd></div>
            <div><dt>Reading time</dt><dd>${p.readMins} minutes</dd></div>
            <div><dt>Tags</dt><dd class="r-tags">${tagLinks}</dd></div>
          </dl>
        </aside>
        <article class="r-main" aria-labelledby="r-title">
          <header class="r-head">
            <p class="r-eyebrow"><span class="post__type"><i class="ph-bold ph-article" aria-hidden="true"></i>Article</span><span>·</span><time datetime="${p.date}">${fFull(d)}</time><span>·</span><span>${p.readMins} min read</span></p>
            <h1 class="r-title" id="r-title">${esc(p.title)}</h1>
            ${p.dek ? `<p class="r-dek">${esc(p.dek)}</p>` : ""}
          </header>
          <div class="r-mfacts">${tagLinks}</div>
          ${p.cover ? `<figure class="r-cover"><button type="button" class="r-imgbtn" data-lb="${p.id}:0" aria-haspopup="dialog" aria-label="Open cover image"><img src="${media(p.cover)}" alt="" data-alt="${esc(p.title)} (cover)" decoding="async"><span class="embed__zoom" aria-hidden="true"><i class="ph-bold ph-arrows-out-simple"></i></span></button></figure>` : ""}
          <details class="r-toc-m"><summary><i class="ph-bold ph-list-bullets" aria-hidden="true"></i>On this page<i class="ph-bold ph-caret-down" aria-hidden="true"></i></summary><ol></ol></details>
          <div class="prose" id="prose"></div>
          <footer class="r-end">
            <p class="r-sign">${cat("var(--ink)")}<span>Thanks for reading. More scraps in <a href="stitched.html" style="color:var(--red-deep)">Thoughts</a>.</span></p>
            <nav class="r-pn" aria-label="More articles">
              ${older ? `<a class="r-pn__link prev" href="?view=article&id=${older.id}" rel="prev"><span class="eyebrow"><i class="ph-bold ph-arrow-left" aria-hidden="true"></i>Older</span><b>${esc(older.title)}</b><span class="meta">${fFull(parse(older.date))} · ${older.readMins} min</span></a>` : `<a class="r-pn__link prev is-empty" href="stitched.html"><span class="eyebrow"><i class="ph-bold ph-arrow-left" aria-hidden="true"></i>Oldest article</span><b>Back to all thoughts</b></a>`}
              ${newer ? `<a class="r-pn__link next" href="?view=article&id=${newer.id}" rel="next"><span class="eyebrow">Newer<i class="ph-bold ph-arrow-right" aria-hidden="true"></i></span><b>${esc(newer.title)}</b><span class="meta">${fFull(parse(newer.date))} · ${newer.readMins} min</span></a>` : `<a class="r-pn__link next is-empty" href="stitched.html"><span class="eyebrow">Newest article<i class="ph-bold ph-arrow-right" aria-hidden="true"></i></span><b>Back to all thoughts</b></a>`}
            </nav>
          </footer>
        </article>
        <aside class="r-toc"><nav aria-labelledby="toc-h"><p class="eyebrow" id="toc-h">On this page</p><ol></ol></nav></aside>
      </div>`;

    const prose = $("#prose");
    const draw = () => {
      prose.innerHTML = mdToHTML(p.body);
      enhanceProse(prose, p);
      const heads = $$("h2, h3", prose);
      const items = heads.map((h) => `<li class="lvl${h.tagName[1]}"><a href="#${h.id}">${esc(h.textContent.replace(/^#/, ""))}</a></li>`).join("");
      $(".r-toc ol").innerHTML = items;
      $(".r-toc-m ol").innerHTML = items;
      if (heads.length < 2) $(".r-toc-m").hidden = true;
      // active section in the TOC
      const links = new Map($$(".r-toc a").map((a) => [a.getAttribute("href").slice(1), a]));
      const setActive = () => {
        let cur = heads[0];
        for (const h of heads) if (h.getBoundingClientRect().top < innerHeight * 0.3) cur = h;
        links.forEach((a, id) => (id === cur?.id ? a.setAttribute("aria-current", "location") : a.removeAttribute("aria-current")));
      };
      const bar = $(".t-progress span");
      const onScroll = () => {
        const r = prose.getBoundingClientRect();
        const total = r.height - innerHeight * 0.6;
        bar.style.setProperty("--p", Math.max(0, Math.min(1, (-r.top + innerHeight * 0.3) / Math.max(1, total))).toFixed(4));
        setActive();
      };
      addEventListener("scroll", onScroll, { passive: true });
      onScroll();
      $(".r-toc-m").addEventListener("click", (e) => { if (e.target.closest("a")) e.currentTarget.open = false; });
    };
    if (window.marked) draw();
    else addEventListener("load", draw, { once: true });
  }

  /* ============================================================
     COLLECTION
     ============================================================ */
  function renderCollection() {
    const key = P.get("c") || "tools";
    const c = D.collections[key];
    if (!c) return renderNotFound();
    document.title = `${c.title} · Thoughts`;
    const items = POSTS.filter((p) => p.collection === key);
    const mode = P.get("cview") === "list" ? "list" : "grid";
    const span = items.length ? `Gathered from ${items.length} post${items.length > 1 ? "s" : ""}, ${fFull(parse(items.at(-1).date))} to ${fFull(parse(items[0].date))}. Newest first.` : "Nothing posted here yet.";
    app.innerHTML = `
      <div class="c-wrap" data-mode="${mode}">
        <a class="r-back" href="stitched.html"><i class="ph-bold ph-arrow-left" aria-hidden="true"></i>All thoughts</a>
        <header class="c-head">
          <span class="c-badge" aria-hidden="true"><i class="ph-bold ${c.icon}"></i></span>
          <div>
            <p class="eyebrow">Collection · ${items.length} pick${items.length === 1 ? "" : "s"}</p>
            <h1 class="c-title">${esc(c.title)}</h1>
            <p class="c-blurb">${esc(c.blurb)}</p>
            <p class="meta">${span}</p>
          </div>
          ${items.length ? `<div class="seg c-seg" role="group" aria-label="Layout">
            <button type="button" class="seg__btn" data-cview="grid" aria-pressed="${mode === "grid"}"><i class="ph-bold ph-squares-four" aria-hidden="true"></i>Grid</button>
            <button type="button" class="seg__btn" data-cview="list" aria-pressed="${mode === "list"}"><i class="ph-bold ph-list" aria-hidden="true"></i>List</button>
          </div>` : ""}
        </header>
        ${items.length > 1 ? threadHTML(items) : ""}
        ${items.length
          ? `<ol class="c-items" aria-label="${esc(c.title)}">${items.map((p) => `<li class="c-item">${card.pick(p, { inCollection: true })}</li>`).join("")}</ol>`
          : `<div class="c-empty"><svg viewBox="0 0 120 90" aria-hidden="true"><circle cx="58" cy="48" r="30" fill="var(--cotton-2)"/><path class="ply-base" style="--ply:var(--red)" stroke-width="4" d="M34 36 C50 28, 70 30, 84 42 M30 52 C48 44, 72 46, 88 56 M38 68 C52 62, 70 62, 80 70 M88 56 C100 62, 106 72, 112 74"/><path class="ply-twist" stroke-width="4" d="M34 36 C50 28, 70 30, 84 42 M30 52 C48 44, 72 46, 88 56 M38 68 C52 62, 70 62, 80 70 M88 56 C100 62, 106 72, 112 74"/></svg><p class="h3">Still winding this one.</p><p>Picks tagged for “${esc(c.title)}” will gather here.</p></div>`}
        <section class="c-more" aria-labelledby="c-more-h">
          <h2 class="eyebrow" id="c-more-h">Other collections</h2>
          <ul class="t-colls">${collLinks(key)}<li><a class="t-coll-link" href="tierlist.html?skin=yarn"><span class="t-coll-ico" aria-hidden="true"><i class="ph-bold ph-ranking"></i></span><span><b>Tier list maker</b><span class="meta">rank anything</span></span><i class="ph-bold ph-arrow-right" aria-hidden="true"></i></a></li></ul>
        </section>
      </div>`;
    const id = location.hash.match(/^#pick-(.+)$/)?.[1];
    if (id) requestAnimationFrame(() => {
      const el = document.getElementById(`pick-${id}`);
      if (el) { el.scrollIntoView({ block: "center", behavior: "instant" }); ropeFlash(el); }
    });
  }

  // the collection's picks were posted on different days: show them strung along one yarn
  function threadHTML(items) {
    const t = items.map((p) => parse(p.date).getTime());
    const lo = Math.min(...t), hi = Math.max(...t), span = Math.max(1, hi - lo);
    const first = parse(items.at(-1).date), last = parse(items[0].date);
    return `<figure class="c-thread">
      <figcaption class="eyebrow">Strung together from the feed</figcaption>
      <div class="c-thread__rail">
        <span class="c-thread__cap meta" aria-hidden="true">${fDay(first)}</span>
        <ol class="c-thread__line">${items.slice().reverse().map((p) => {
          const x = 4 + ((parse(p.date).getTime() - lo) / span) * 92;
          return `<li style="--x:${x.toFixed(2)}%"><a href="#pick-${p.id}" data-pick="${p.id}"><span class="c-knot" aria-hidden="true"></span><b>${esc(p.name)}</b><time class="meta" datetime="${p.date}">${fDay(parse(p.date))}</time></a></li>`;
        }).join("")}</ol>
        <span class="c-thread__cap meta" aria-hidden="true">${fDay(last)}</span>
      </div>
    </figure>`;
  }

  function renderNotFound() {
    app.innerHTML = `<div class="t-notfound"><p class="h2">That thought wandered off.</p><p class="muted">It may have been unravelled.</p><a class="btn" href="stitched.html"><i class="ph-bold ph-arrow-left"></i>All thoughts</a></div>`;
  }

  /* ============================================================
     EVENTS (delegated)
     ============================================================ */
  app.addEventListener("click", (e) => {
    const t = e.target;
    const typeBtn = t.closest(".t-type");
    if (typeBtn) {
      const k = typeBtn.dataset.type;
      k ? toggle(state.types, k) : state.types.clear();
      return refreshFilters();
    }
    const tagBtn = t.closest(".t-tagchip, .t-tag");
    if (tagBtn) {
      if (tagBtn.classList.contains("t-tag")) pendingFocus = { id: tagBtn.closest(".post")?.dataset.id, tag: tagBtn.dataset.tag };
      toggle(state.tags, tagBtn.dataset.tag);
      return refreshFilters();
    }
    if (t.closest(".t-clear")) { state.types.clear(); state.tags.clear(); return refreshFilters(); }
    const tt = t.closest(".t-tagtoggle");
    if (tt) {
      const open = tt.getAttribute("aria-expanded") !== "true";
      tt.setAttribute("aria-expanded", String(open));
      const tray = $("#t-tagtray");
      tray.hidden = !open;
      if (open && !reduced()) tray.animate([{ opacity: 0, transform: "translateY(-6px)" }, { opacity: 1, transform: "none" }], { duration: 200, easing: "cubic-bezier(.2,.8,.2,1)" });
      return;
    }
    const tm = t.closest("[data-tier-mode]");
    if (tm) return setTierMode(tm.closest(".post"), tm.dataset.tierMode);
    const tr = t.closest(".pl__track");
    if (tr) return playTrack(tr.dataset.pl, +tr.dataset.i);
    const all = t.closest(".pl__all");
    if (all) {
      const pl = all.dataset.pl;
      if (nowPlaying?.pl === pl) return playTrack(pl, nowPlaying.i);
      return playTrack(pl, 0);
    }
    const knot = t.closest("[data-pick]");
    if (knot) {
      e.preventDefault();
      const el = document.getElementById(`pick-${knot.dataset.pick}`);
      if (el) {
        const r = el.getBoundingClientRect();
        if (r.top < 0 || r.bottom > innerHeight) el.scrollIntoView({ block: "center", behavior: reduced() ? "auto" : "smooth" });
        ropeFlash(el);
        el.querySelector(".pick__name a")?.focus({ preventScroll: true });
      }
      return;
    }
    const cv = t.closest("[data-cview]");
    if (cv) {
      const wrap = $(".c-wrap");
      const mode = cv.dataset.cview;
      $$("[data-cview]").forEach((b) => b.setAttribute("aria-pressed", String(b === cv)));
      const go = () => (wrap.dataset.mode = mode);
      document.startViewTransition && !reduced() ? document.startViewTransition(go) : go();
      const u = new URL(location.href); u.searchParams.set("cview", mode); history.replaceState(null, "", u);
      return;
    }
    const lb = t.closest("[data-lb]");
    if (lb) {
      const [g, i] = lb.dataset.lb.split(":");
      window.StitchLB?.open(g, +i, lb);
    }
  });

  /* ---------- lightbox groups ---------- */
  function lbGroup(id) {
    const p = byId[id];
    if (!p) return null;
    if (p.type === "embed") return { id, title: p.title, items: p.media.map((m) => ({ src: media(m.src), alt: m.alt, video: isVideo(m) })) };
    if (p.type === "article") {
      const btns = $$(`[data-lb^="${id}:"]`);
      const items = btns.length
        ? btns.map((b) => { const img = $("img", b); return { src: img?.getAttribute("src"), alt: img?.dataset.alt || "" }; })
        : [p.cover && { src: media(p.cover), alt: `${p.title} (cover)` }].filter(Boolean);
      return { id, title: p.title, items };
    }
    return null;
  }

  /* ============================================================
     BOOT
     ============================================================ */
  const view = P.get("view") || "feed";
  if (view === "article") renderArticle();
  else if (view === "collection") renderCollection();
  else { renderFeed(); focusPostFromHash(); }
  hookPlayer();

  window.StitchLB?.init({
    getGroup: lbGroup,
    getThumb: (g, i) => document.querySelector(`[data-lb="${g}:${i}"]`),
  });

  // ?lightbox=e1:0 → open on load. No page scroll: if the source is off-screen the
  // media scales up in place instead of flying from its thumbnail.
  const lbp = P.get("lightbox");
  if (lbp && window.StitchLB) {
    const [g, i] = lbp.split(":");
    const start = () => window.StitchLB.open(g, +i || 0, document.querySelector(`[data-lb="${g}:${+i || 0}"]`), P.has("lbp") ? { freeze: +P.get("lbp") } : { instant: true });
    if (view === "article" && !window.marked) addEventListener("load", () => setTimeout(start, 30), { once: true });
    else requestAnimationFrame(() => requestAnimationFrame(start));
  }

  window.Yarn?.mockPanel([
    { label: "View", param: "view", options: [["feed", "Feed"], ["article", "Article"], ["collection", "Collection"]], default: "feed" },
    { label: "Feed layout", param: "layout", options: [["masonry", "Masonry by month"], ["thread", "Thread"]], default: "masonry" },
    { label: "Tier board", param: "tl", options: [["mine", "Mine"], ["all", "Everyone"]], default: "mine" },
    { label: "Lightbox", param: "lightbox", options: [["", "Closed"], ["e1:0", "Images"], ["e3:0", "Video"]], default: "" },
    { label: "Mobile nav", param: "nav", options: [["corduroy", "Corduroy"], ["suede", "Suede"], ["cork", "Cork"], ["burlap", "Burlap"]], default: "corduroy" },
  ]);
})();
