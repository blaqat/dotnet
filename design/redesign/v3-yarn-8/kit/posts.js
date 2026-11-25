/* ============================================================
   blaqat.net · yarn kit · Thoughts post cards (iteration 3, mock-only)
   Loaded by kit/yarn.js (sync). One renderer, so a post looks the same on
   the Thoughts feed and in Studio's preview.

   Yarn.post(p, ctx?) → <article class="ypost ypost--<type>">   (scratch · article · pick · tierlist · playlist · embed)
   Yarn.post.TYPES / TYPE              post vocabulary (key, plural, one, icon)
   Yarn.post.typeBadge(key, label?)    the kit type badge with the post vocabulary
   Yarn.post.configure(ctx)            page defaults (Thoughts: storage-backed votes; Studio: its own collections)
   Yarn.post.aggregate(p, vote) · crowdTiers(p, agg) · miniBoard(p, mode, ctx)
   Yarn.post.tierDefs(p) → [{ id, label, color, short, i }]  (i4: custom tier names; default S–D) · tiersNamed(p) ·
     tierDef(p, id) · tierItems(p) · tierOfVote(vote, name, p) · TIER_COLORS [key, label, hex] (the felt palette)
   Yarn.post.swatch(key)               i1's post-type swatch (a legend for the card materials; "all" = everything)
   Yarn.post.NOTE_COLORS / STUB_COLORS owner colours: a scratch's sticky note (p.color), a pick's tag stub (p.color)
   Yarn.post.aboutPill(ref, ctx?) · writeupPill(articles, ctx?)   i5 (T1, thoughts/CONCEPTS.md): the slim "about ·
     <thing>" pill on a write-up, and the "write-up · <article>" pill on the thing (same component, both directions)
   Params (pages that show posts list them in their ⚙ panel):
     ?kicker=caps|plain   caps type + light mono subtext (i1, default) | i2's mixed-case badge
     ?colors=data|default note / stub colours from the post data (default) | everything in the default colour
     ?kicon=circle|bare   i5 (T2.3): the type icon by the kicker in its felt circle (default, decided i6) | bare, like i1
     ?cardwu=short|foot|pill   i6 (T1): a thing's card (pick, ranking) links its write-up: the slim pill without the
                          title (decided i7) | "Write-up →" at the bottom right, like an article's "Read" | i5's pill
     ?collicon=stubs|circle|none|tile   i6 (T7): a collection's mark (Yarn.post.collMark). i7 (T1): stubs (decided) is
                          the rail's mark only; a pick's "Tools I like →" pill is just its words and the arrow
     ?minimarks=off|on    i6 (R4): the mini ranking marks items that have their own write-up (a small red bookmark;
                          decided i7: off)
   i6: aboutPill carries data-about (a page may send the pill somewhere else: Thoughts ?aboutgo) · writeupPill(list,
     ctx, { short }) · collMark(coll, picks, { size: "row"|"xs" }) · ctx.itemWriteups(p) → Map(item → [articles])
     (R4) · on its own collection's page (ctx.here) a pick has no shelf link and no "See the post" (T2)
   ctx: { collections, collCount(k), href: { article(p), collection(k, id), tier(p, mode, hash) },
          vote(p), comments(p), scratch: "sticky"|"felt", tagsAs: "a"|"button", pressed: Set, tl: "owner"|"everyone",
          inert: true (preview: card links lead nowhere), here: <collection key> (on that collection's page a pick
          links to its post in the feed instead of back to the collection),
          about(ref) → { name, word, href, icon } | null, writeups(p) → [articles about p] (i5; default: none) }
   A pick with a body (?pickart=article on Thoughts) is an article shown as a pick card: its title opens the article.
   CSS: kit/yarn.css "== POST CARDS".
   ============================================================ */
(() => {
  "use strict";
  const Y = window.Yarn;
  if (!Y || Y.post) return;
  const esc = Y.esc;

  const TYPES = [
    { key: "scratch", plural: "Scratch", one: "Scratch", icon: "ph-scribble-loop" },
    { key: "article", plural: "Articles", one: "Article", icon: "ph-article" },
    { key: "pick", plural: "Picks", one: "Pick", icon: "ph-tag" },
    { key: "tierlist", plural: "Rankings", one: "Ranking", icon: "ph-ranking" }, // i3: "we can call tierlist rankings" (key stays)
    { key: "playlist", plural: "Playlists", one: "Playlist", icon: "ph-playlist" },
    { key: "embed", plural: "Images", one: "Images", icon: "ph-images" },
  ];
  const TYPE = Object.fromEntries(TYPES.map((t) => [t.key, t]));
  const KICKER = Y.params.get("kicker") === "plain" ? "plain" : "caps";
  const COLORS = Y.params.get("colors") === "default" ? "default" : "data";
  document.documentElement.dataset.kicker = KICKER;
  // i5 (T2.3, owner: "showing the icon … without the circle around it like the first iteration had")
  const KICON = Y.params.get("kicon") === "bare" ? "bare" : "circle";
  document.documentElement.dataset.kicon = KICON;
  // i6 (T1) · how a thing's card (pick, ranking) links to its write-up. short (decided i7): the slim pill without the
  // title ("write-up · 4 min") · foot (Earlier): "Write-up →" at the bottom right, like an article's "Read" (the card
  // itself still opens the thing) · pill (Earlier): i5's pill with the article's title
  const pickp = (k, ok, d) => (ok.includes(Y.params.get(k)) ? Y.params.get(k) : d);
  const CARDWU = pickp("cardwu", ["foot", "short", "pill"], "short");
  // i6 (T7) · a collection's mark: stubs (decided i7: a fan of its picks' own tag stubs) · circle (its icon in the
  // kicker's felt circle) · none (collections are just collections) · tile (i5)
  const COLLICON = pickp("collicon", ["circle", "stubs", "none", "tile"], "stubs");
  document.documentElement.dataset.collicon = COLLICON;
  // i6 (R4) · the mini ranking on a feed card marks the items that have their own write-up (?minimarks=on)
  const MINIMARKS = Y.params.get("minimarks") === "on";
  // owner colours (Studio sets p.color from these); the first is the default
  const NOTE_COLORS = [["canary", "Canary", "#ffe27a"], ["pink", "Pink", "#ffc9d5"], ["mint", "Mint", "#c9edd5"], ["sky", "Sky", "#cfe4fb"], ["orange", "Orange", "#ffd29e"], ["lilac", "Lilac", "#e3d6fb"]];
  const STUB_COLORS = [["tan", "Tan", "#e4d5ba"], ["red", "Red", "#d62f38"], ["ink", "Ink", "#2b2828"], ["blue", "Blue", "#3a74cf"], ["green", "Green", "#5e9a5b"], ["gold", "Gold", "#d9a21b"]];
  const colorOf = (p, list) => (COLORS === "data" && list.some(([k]) => k === p.color) ? p.color : list[0][0]);
  const swatch = (key) => `<span class="ytsw ytsw--${esc(key)}" aria-hidden="true"></span>`;
  const typeBadge = (key, label) => {
    const t = TYPE[key] || { one: label || key, icon: "ph-tag" };
    return Y.badge.type(key, { icon: t.icon, label: label || t.one });
  };
  const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
  const host = (url) => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return String(url || ""); } };
  const fmtSecs = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const secsOf = (dur) => { const [m, s] = String(dur || "0:00").split(":").map(Number); return (m || 0) * 60 + (s || 0); };

  /* ---------- rankings: tiers (default S–D or the owner's own), community aggregate (+ an optional vote) ----------
     i4 (owner: "arbitrary names for tiers rather than just the default sabcd"): a ranking may carry
       p.tierDefs = [{ id, label, color }]   best first; any count; label = any text; color = a TIER_COLORS key
       p.tiers    = { [id]: [names…] }       (votes + community use the same ids, so renaming a tier keeps its votes)
     Without tierDefs the keys of p.tiers are the labels (S A B C D, Studio's older drafts). Every label ≤ 3
     characters → the square felt keys; any longer label → "named": each row wears its label as a felt tab. */
  const TIERS = ["S", "A", "B", "C", "D"];
  const TIER_COLORS = [["red", "Red", "#d22f3a"], ["orange", "Orange", "#ef7d4e"], ["gold", "Gold", "#f0b63f"], ["sage", "Sage", "#9cb86b"], ["sky", "Sky", "#8aa3c8"],
    ["teal", "Teal", "#5fb3a6"], ["lilac", "Lilac", "#b59ad8"], ["pink", "Pink", "#f2a0b5"], ["ink", "Ink", "#2b2828"], ["cotton", "Cotton", "#e3ddd2"]];
  const TC = new Set(TIER_COLORS.map(([k]) => k));
  const chars = (s) => [...String(s ?? "")].length;
  // derived on every call (≤ ~10 entries): Studio edits tierDefs in place, so nothing is cached
  function tierDefs(p) {
    const raw = p && Array.isArray(p.tierDefs) && p.tierDefs.length
      ? p.tierDefs.map((d) => ({ id: String(d.id), label: String(d.label ?? d.id), color: d.color }))
      : (p && Object.keys(p.tiers || {}).length ? Object.keys(p.tiers) : TIERS).map((k) => ({ id: k, label: k }));
    return raw.map((d, i) => ({ ...d, i, color: TC.has(d.color) ? d.color : TIER_COLORS[i % TIER_COLORS.length][0], short: chars(d.label) <= 3 ? d.label : String(i + 1) }));
  }
  const tiersNamed = (p) => tierDefs(p).some((d) => chars(d.label) > 3);
  const tierDef = (p, id) => tierDefs(p).find((d) => d.id === id) || null;
  const tierItems = (p) => tierDefs(p).flatMap((d) => (p.tiers || {})[d.id] || []);
  const tierOfVote = (vote, name, p = null) => (vote ? tierDefs(p || { tiers: vote.tiers }).map((d) => d.id).find((t) => (vote.tiers[t] || []).includes(name)) || null : null);
  function aggregate(p, vote = null) {
    const ids = tierDefs(p).map((d) => d.id), N = ids.length;
    const base = p.community || { voters: 0, items: {} };
    const voters = base.voters + (vote ? 1 : 0);
    const items = {};
    for (const name of tierItems(p)) {
      const pct0 = base.items[name]?.length === N ? base.items[name] : Array(N).fill(100 / N);
      const sum0 = pct0.reduce((a, b) => a + b, 0) || 1;
      const counts = pct0.map((v) => (v / sum0) * base.voters);
      const yt = tierOfVote(vote, name, p);
      if (yt) counts[ids.indexOf(yt)] += 1;
      const tot = counts.reduce((a, b) => a + b, 0) || 1;
      const pct = counts.map((c) => (c / tot) * 100);
      let best = 0;
      pct.forEach((v, i) => { if (v > pct[best]) best = i; });
      // 0 (bottom tier) … 4 (top tier), whatever the count, so "crowd favourite" reads the same on every board
      const mean = N > 1 ? (pct.reduce((s, v, i) => s + v * (N - 1 - i), 0) / 100) * (4 / (N - 1)) : 0;
      items[name] = { name, counts, pct, best: ids[best], bestIndex: best, bestPct: Math.round(pct[best]), mean };
    }
    return { voters, items, withYou: !!vote };
  }
  function crowdTiers(p, agg = aggregate(p)) {
    const ids = tierDefs(p).map((d) => d.id);
    const out = Object.fromEntries(ids.map((t) => [t, []]));
    Object.values(agg.items).forEach((it) => out[it.best].push(it.name));
    ids.forEach((t) => out[t].sort((a, b) => agg.items[b].mean - agg.items[a].mean));
    return out;
  }

  /* ---------- defaults (pages override with configure) ---------- */
  const THOUGHTS = Y.kitURL("../thoughts/");
  const defaults = {
    collections: window.THOUGHTS?.collections || {},
    collCount: (k) => (window.THOUGHTS?.posts || []).filter((p) => p.collection === k).length,
    href: {
      article: (p) => `${THOUGHTS}stitched.html?view=article&id=${encodeURIComponent(p.id)}`,
      collection: (k, id) => `${THOUGHTS}stitched.html?view=collection&c=${encodeURIComponent(k)}${id ? `&item=${encodeURIComponent(id)}` : ""}`,
      tier: (p, mode = "", hash = "") => `${THOUGHTS}tier.html?id=${encodeURIComponent(p.id)}${mode ? `&mode=${mode}` : ""}${hash}`,
      post: (p) => `${THOUGHTS}stitched.html#post-${encodeURIComponent(p.id)}`,
    },
    vote: () => null,
    comments: (p) => p.comments || [],
    owner: "blaqat",
    scratch: "sticky",
    tagsAs: "a",
    pressed: null,
    tl: "owner",
    inert: false,
    about: () => null,
    writeups: () => [],
    itemWriteups: () => new Map(), // i6 (R4): (ranking) → Map(item name → [articles about that item])
  };
  let base = { ...defaults };
  const configure = (c = {}) => { base = { ...base, ...c, href: { ...base.href, ...(c.href || {}) } }; return base; };

  // playlist tracks are real BLAQAT songs: same object → same yarn swatch as the music page + player
  const MUSIC = (() => {
    const m = new Map();
    for (const e of window.BLAQAT?.music || []) for (const s of e.songs || [e]) if (s.url) m.set(s.url, { ...s, instrument: s.instrument || e.instrument, collection: e.songs ? e.name : undefined });
    return m;
  })();
  const trackItem = (t) => MUSIC.get(t.src) || { name: t.title, url: t.src, instrument: "daw" };

  /* ---------- pieces ---------- */
  const tagsHTML = (p, c) => (p.tags?.length ? `<div class="ypost__tags">${Y.tags(p.tags, c.tagsAs === "button" ? { as: "button", pressed: c.pressed } : {})}</div>` : "");
  const metaRow = (p, extra = "", o = {}) =>
    `<div class="ymeta ypost__meta${KICKER === "caps" ? " ypost__kick" : ""}">${typeBadge(p.type)}${extra ? `<span class="meta ypost__x">${extra}</span>` : ""}<span class="ypost__date">${Y.badge.date(p.date || new Date().toISOString(), { style: "day", ...o })}</span></div>`;
  // the card's main link, stretched over the card (interactive bits sit above it)
  const link = (c, href, inner, attrs = "") => (c.inert || !href ? `<a class="ypost__link" ${attrs}>${inner}</a>` : `<a class="ypost__link" href="${esc(href)}" ${attrs}>${inner}</a>`);
  const minsOf = (p) => p.readMins || Math.max(1, Math.round(String(p.body || "").split(/\s+/).length / 220));
  // i5 (T1): "about" both ways, one slim pill. On a write-up: about · <thing> (its icon says what kind; a ranked item
  // wears its tier's felt key, so Helium-the-ranked-item never reads as Helium-the-pick). On the thing: write-up ·
  // <the article> · n min (+n when there are more). A link to another page: it lifts, never ropes.
  const pill = (c, href, k, mark, name, tail, cls = "") =>
    `<a class="yabout ylift${cls ? ` ${cls}` : ""}"${c.inert || !href ? "" : ` href="${esc(href)}"`}><span class="yabout__k">${k}</span>${mark}<b>${esc(name)}</b>${tail}<i class="ph-bold ph-arrow-right yabout__go" aria-hidden="true"></i></a>`;
  const icon = (ic) => `<i class="ph-bold ${ic}" aria-hidden="true"></i>`;
  function aboutPill(ref, ctx = {}) {
    const c = { ...base, ...ctx }, a = ref && c.about(ref);
    if (!a) return "";
    const mark = a.tier ? `<span class="ytierkey yabout__tier" data-tier="${esc(a.tier.id)}" data-tc="${esc(a.tier.color)}" aria-hidden="true">${esc(a.tier.short)}</span>` : icon(a.icon);
    // i6 (T6): data-about lets a page decide where the pill goes (?aboutgo on Thoughts)
    return pill(c, a.href, "about", mark, a.name, `<span class="sr-only"> (${esc(a.word)})</span>`, "yabout--about").replace(`<a class="yabout `, `<a data-about="${esc(ref)}" class="yabout `);
  }
  // short (i6, T1): no title, so it stays as slim as the about pill ("the about one feels right")
  function writeupPill(list, ctx = {}, { short = false } = {}) {
    const c = { ...base, ...ctx, href: { ...base.href, ...(ctx.href || {}) } }, a = list?.[0];
    if (!a) return "";
    const n = `${minsOf(a)} min${list.length > 1 ? ` +${list.length - 1}` : ""}`;
    if (short) return `<a class="yabout ylift yabout--wu yabout--short"${c.inert ? "" : ` href="${esc(c.href.article(a))}"`}>${icon("ph-scroll")}<b>Write-up</b><span class="yabout__n">${n}</span><span class="sr-only">: ${esc(a.title || "Untitled")}</span><i class="ph-bold ph-arrow-right yabout__go" aria-hidden="true"></i></a>`;
    return pill(c, c.href.article(a), "write-up", icon("ph-scroll"), a.title || "Untitled", `<span class="yabout__n">${n}</span>`, "yabout--wu");
  }
  // i6 (T1, ?cardwu=foot): "Write-up →" at the card's bottom right, where an article says "Read →". Its own link, above
  // the card's stretched link, so the card opens the thing and this opens its write-up.
  function writeupFoot(list, c) {
    const a = list?.[0];
    if (!a) return "";
    const lab = `Write-up: ${a.title || "Untitled"}, ${minsOf(a)} min read${list.length > 1 ? ` (+${list.length - 1} more)` : ""}`;
    return `<a class="ypost__go ypost__wu"${c.inert ? "" : ` href="${esc(c.href.article(a))}"`} aria-label="${esc(lab)}">Write-up<i class="ph-bold ph-arrow-right" aria-hidden="true"></i></a>`;
  }
  // a thing's card: its write-up as the chosen design. under = the pill row (short / pill) · foot = the link in its last row
  const wuParts = (list, c) => (!list?.length ? { under: "", foot: "" }
    : CARDWU === "foot" ? { under: "", foot: writeupFoot(list, c) }
    : { under: `<div class="ypost__about">${writeupPill(list, c, { short: CARDWU === "short" })}</div>`, foot: "" });
  // i6 (T7) · a collection's mark (?collicon). key = the collection; picks = its posts (newest first) for the stubs
  function collMark(coll, picks = [], { size = "" } = {}) {
    if (!coll || COLLICON === "none") return "";
    if (COLLICON === "stubs") {
      const cols = picks.slice(0, 3).map((p) => colorOf(p, STUB_COLORS));
      while (cols.length < 3) cols.push("tan");
      return `<span class="ycollm ycollm--stubs${size ? ` ycollm--${size}` : ""}" aria-hidden="true">${cols.reverse().map((k) => `<b data-stub="${k}"></b>`).join("")}</span>`;
    }
    return `<span class="ycollm ycollm--${COLLICON}${size ? ` ycollm--${size}` : ""}" aria-hidden="true"><i class="ph-bold ${esc(coll.icon || "ph-folder")}"></i></span>`;
  }

  // a teardrop loop of red yarn through the pick tag's eyelet
  const LOOP = "M17 26 C 9 22, -6 10, -5 -3 C -4 -12, 8 -13, 10 -4 C 12 5, 13 16, 17 26";
  const STRING = `<svg class="ypost__string" viewBox="-14 -16 46 56" aria-hidden="true"><path class="ply-base" stroke-width="2.8" d="${LOOP}"/><path class="ply-twist" stroke-width="2.8" d="${LOOP}"/><circle cx="17" cy="26" r="2.6" fill="var(--red-deep)"/></svg>`;

  // kit lightbox thumbs (same markup as Yarn.carousel), laid out as a photo grid
  function thumbHTML(g, m, i, n) {
    const src = Y.media(m.src), vid = Y.isVideo(m.src, m.kind), what = vid ? "video" : "image";
    if (!src) return `<div class="ycar__thumb ypost__thumb" role="img" aria-label="${what} not included in this mock"><span class="ymissing"><i class="ph ${vid ? "ph-video-camera" : "ph-image"}" aria-hidden="true"></i>${what} not in this mock</span></div>`;
    const inner = vid
      ? `<video src="${src}#t=0.6" muted playsinline preload="metadata" aria-hidden="true" tabindex="-1" data-ydur></video><span class="ycar__dur" aria-hidden="true"><i class="ph-fill ph-play"></i><span>video</span></span>`
      : `<img src="${src}" alt="" decoding="async" draggable="false">${/\.gif$/i.test(m.src) ? `<span class="ycar__dur" aria-hidden="true"><span>GIF</span></span>` : ""}`;
    return `<button type="button" class="ycar__thumb ypost__thumb" data-ylb="${g}" data-src="${src}" data-alt="${esc(m.alt || "")}" data-kind="${what}" aria-haspopup="dialog" aria-label="Open ${what} ${i + 1} of ${n}${m.alt ? `: ${esc(m.alt)}` : ""}">${inner}</button>`;
  }

  // tier card: a mini felt board (Mine / Everyone)
  function miniBoard(p, mode, c = base) {
    const agg = aggregate(p, c.vote(p));
    const rows = mode === "owner" ? p.tiers : crowdTiers(p, agg);
    const label = mode === "owner" ? `${c.owner}'s ranking` : `Everyone's ranking, ${agg.voters} people`;
    const named = tiersNamed(p);
    const iwu = MINIMARKS ? (c.itemWriteups || base.itemWriteups)(p) : new Map();
    // named tiers: the label is a felt tab sewn on top of its row (never cut off; wraps when it's longer than the row)
    return `<ol class="ypost__rows"${named ? " data-named" : ""} aria-label="${esc(label)}">${tierDefs(p).map((d) => `
      <li class="ypost__row" data-tier="${esc(d.id)}" data-tc="${d.color}"><span class="ytierkey" data-tier="${esc(d.id)}" data-tc="${d.color}" aria-hidden="true">${esc(d.label)}</span>
        <ul class="ypost__items" aria-label="${esc(named ? d.label : `${d.label} tier`)}">${(rows[d.id] || []).map((n) => {
          const it = agg.items[n];
          const wu = MINIMARKS && iwu.has(n) ? `<span class="ypost__wum" aria-hidden="true"></span><span class="sr-only">, has a write-up</span>` : "";
          return `<li class="ypost__item${wu ? " has-wu" : ""}" data-key="${esc(n)}" data-tier="${esc(d.id)}" data-tc="${d.color}">${esc(n)}${mode === "everyone" && it ? `<span class="ypost__pct"><span class="sr-only">, </span>${it.bestPct}%<span class="sr-only"> agree</span></span>` : ""}${wu}</li>`;
        }).join("") || `<li class="ypost__none">empty</li>`}</ul></li>`).join("")}</ol>
      ${mode === "everyone" ? `<p class="ypost__note meta">Each sits where most of ${agg.voters} people put it · % who agree</p>` : ""}`;
  }

  /* ---------- the cards ---------- */
  const card = {
    scratch(p, c) {
      const d = Y.parseDate(p.date) || new Date();
      const felt = c.scratch === "felt";
      return `<article class="ypost ypost--scratch ${felt ? "m-felt on-ink" : "ypost--sticky"}" id="post-${esc(p.id)}" data-id="${esc(p.id)}"${felt ? "" : ` data-note="${colorOf(p, NOTE_COLORS)}"`} aria-label="Scratch thought, ${Y.fmt.full(d)}">
        ${felt ? "" : `<span class="ypost__tape" aria-hidden="true"></span>`}
        ${metaRow(p, "", { time: true })}
        <p class="ypost__quote">${esc(p.text || "…")}</p>
        ${tagsHTML(p, c)}
      </article>`;
    },
    article(p, c) {
      const cover = p.cover && Y.media(p.cover);
      const mins = p.readMins || Math.max(1, Math.round(String(p.body || "").split(/\s+/).length / 220));
      return `<article class="ycard ylift ypost ypost--article${cover ? " has-cover" : ""}" id="post-${esc(p.id)}" data-id="${esc(p.id)}" aria-labelledby="h-${esc(p.id)}">
        <span class="ypost__bookmark" aria-hidden="true"></span>
        ${cover ? `<div class="ypost__cover"><img src="${esc(cover)}" alt="" loading="lazy" decoding="async"></div>` : ""}
        <div class="ypost__body">
          ${metaRow(p, `${mins} min read`)}
          <h3 class="ypost__title" id="h-${esc(p.id)}">${link(c, c.href.article(p), esc(p.title || "Untitled article"))}</h3>
          ${p.dek ? `<p class="ypost__dek">${esc(p.dek)}</p>` : ""}
          ${p.about ? `<div class="ypost__about">${aboutPill(p.about, c)}</div>` : ""}
          <div class="ypost__foot">${tagsHTML(p, c)}<span class="ypost__go" aria-hidden="true">Read<i class="ph-bold ph-arrow-right"></i></span></div>
        </div>
      </article>`;
    },
    pick(p, c) {
      const coll = c.collections[p.collection] || (p.collection ? { title: p.collection, icon: "ph-folder" } : null);
      const n = p.collection ? c.collCount(p.collection) : 0, h = host(p.url);
      // i5 (T1): a pick with a body IS an article (?pickart=article): its title opens it, the shelf pill is a plain link
      const art = !!p.body, wu = wuParts(art ? [] : c.writeups(p), c);
      // i6 (T2, owner: "i dont think we need the see the post button"): on its own collection's page the pick has no
      // shelf link and no "See the post"; Back returns to the post you came from
      // i7 (T1, owner: the stubs "look great in the left side bar but in the buttons to go to it it looks bad id remove it
      // there nd just have the text and the arrow"): with stubs (decided) or none, the shelf pill is its words and the
      // arrow (no mark, no count; the count stays in its name). circle / tile (Earlier) keep i6's pill
      const shelfMark = COLLICON === "tile" ? `<i class="ph-bold ${coll?.icon}" aria-hidden="true"></i>` : COLLICON === "circle" ? collMark(coll, [], { size: "xs" }) : "";
      const shelf = c.here && p.collection === c.here ? "" : coll ? `<a class="ypost__coll${shelfMark ? "" : " ypost__coll--plain"}${art ? "" : " ypost__link"}"${c.inert ? "" : ` href="${esc(c.href.collection(p.collection, p.id))}"`} aria-label="${esc(p.name || "This pick")} in ${esc(coll.title)}, ${plural(n, "pick")}">${shelfMark}<span>${esc(coll.title)}</span>${shelfMark ? `<span class="ypost__colln" aria-hidden="true">${n}</span>` : ""}<i class="ph-bold ph-arrow-right" aria-hidden="true"></i></a>` : "";
      const last = art ? `<span class="ypost__go" aria-hidden="true">Read<i class="ph-bold ph-arrow-right"></i></span>` : wu.foot;
      return `<article class="ycard ylift ypost ypost--pick${art ? " ypost--pickart" : ""}" id="post-${esc(p.id)}" data-id="${esc(p.id)}" data-stub="${colorOf(p, STUB_COLORS)}" aria-labelledby="h-${esc(p.id)}">
        <span class="ypost__eyelet" aria-hidden="true"></span>${STRING}
        ${metaRow(p, art ? `${minsOf(p)} min read` : "")}
        <h3 class="ypost__title" id="h-${esc(p.id)}">${art ? link(c, c.href.article(p), esc(p.name || "Untitled pick")) : esc(p.name || "Untitled pick")}</h3>
        ${p.blurb ? `<p class="ypost__dek">${esc(p.blurb)}</p>` : ""}
        ${wu.under}
        ${p.url || shelf ? `<div class="ypost__foot">
          ${p.url ? `<a class="ypost__ext" href="${esc(p.url)}" target="_blank" rel="noopener">${esc(h)}<i class="ph-bold ph-arrow-up-right" aria-hidden="true"></i><span class="sr-only"> (opens in a new tab)</span></a>` : ""}
          ${shelf}
        </div>` : ""}
        ${last ? `<div class="ypost__foot ypost__foot--read">${tagsHTML(p, c)}${last}</div>` : tagsHTML(p, c)}
      </article>`;
    },
    tierlist(p, c) {
      const mode = c.tl === "everyone" ? "everyone" : "owner";
      const vote = c.vote(p), agg = aggregate(p, vote), nC = c.comments(p).length;
      const href = (m, h) => (c.inert ? "" : ` href="${esc(c.href.tier(p, m, h))}"`);
      const wu = wuParts(c.writeups(p), c); // i6 (T1): the same write-up design as a pick's
      return `<article class="ycard ylift ypost ypost--tier" id="post-${esc(p.id)}" data-id="${esc(p.id)}" aria-labelledby="h-${esc(p.id)}">
        ${metaRow(p, `<i class="ph-bold ph-users" aria-hidden="true"></i>${agg.voters} ranked`)}
        <h3 class="ypost__title" id="h-${esc(p.id)}">${link(c, c.href.tier(p), esc(p.title || "Untitled ranking"))}</h3>
        <div class="ypost__seg">${Y.seg([{ value: "owner", label: "Mine" }, { value: "everyone", label: "Everyone", icon: "ph-users-three" }], { value: mode, label: "Whose ranking to show", name: p.id })}</div>
        <div class="ypost__mini" data-mode="${mode}">${miniBoard(p, mode, c)}</div>
        ${wu.under}
        <div class="ypost__actions">
          <a class="btn btn--red btn--sm"${href(vote ? "you" : "add", "")}>${vote ? `<i class="ph-bold ph-scales" aria-hidden="true"></i>You vs everyone` : `<i class="ph-bold ph-plus" aria-hidden="true"></i>Add your ranking`}</a>
          <a class="btn btn--ghost btn--sm"${href("", "#comments")}><i class="ph-bold ph-chat-circle" aria-hidden="true"></i>${plural(nC, "comment")}</a>
        </div>
        ${wu.foot ? `<div class="ypost__foot ypost__foot--read">${tagsHTML(p, c)}${wu.foot}</div>` : tagsHTML(p, c)}
      </article>`;
    },
    playlist(p, c) {
      const tracks = p.tracks || [];
      const secs = tracks.reduce((s, t) => s + secsOf(t.dur), 0);
      return `<article class="ycard ypost ypost--playlist" id="post-${esc(p.id)}" data-id="${esc(p.id)}" aria-labelledby="h-${esc(p.id)}">
        ${metaRow(p)}
        <div class="ypost__plhead">
          ${Y.disc(null, { size: 68, label: "cat" })}
          <div class="ypost__plinfo">
            <h3 class="ypost__title" id="h-${esc(p.id)}">${esc(p.title || "Untitled playlist")}</h3>
            ${p.note ? `<p class="ypost__dek">${esc(p.note)}</p>` : ""}
            <p class="meta">${plural(tracks.length, "track")} · ${fmtSecs(secs)}</p>
          </div>
        </div>
        <ol class="ypost__tracks">${tracks.map((t, i) => `<li><button type="button" class="ypost__track ysel" data-pl="${esc(p.id)}" data-i="${i}" aria-current="false" aria-label="Play ${esc(t.title)}${t.by ? ` by ${esc(t.by)}` : ""}, ${esc(t.dur || "")}">
            <span class="ypost__tsw ytrkart" aria-hidden="true">${Y.swatchHTML(trackItem(t), { size: 34, radius: 8 })}<i class="ph-fill ph-play"></i><span class="ypost__teq"><b></b><b></b><b></b></span></span>
            <span class="ypost__tt">${esc(t.title)}${t.by ? `<small>${esc(t.by)}</small>` : ""}</span>
            <span class="ypost__tdur">${esc(t.dur || "")}</span>
          </button></li>`).join("")}</ol>
        <p class="ypost__now sr-only" aria-live="polite"></p><!-- i4 (owner): no visible "Now playing / Paused" line; the rows show it. Screen readers still hear it. -->
        <div class="ypost__foot"><button type="button" class="btn btn--red btn--sm ypost__all" data-pl="${esc(p.id)}"><i class="ph-fill ph-play" aria-hidden="true"></i><span>Play all</span></button>${tagsHTML(p, c)}</div>
      </article>`;
    },
    embed(p, c) {
      const media = p.media || [];
      const n = media.length, vids = media.filter((m) => Y.isVideo(m.src, m.kind)).length;
      const what = vids ? (vids === n ? plural(n, "video") : plural(n, "item")) : plural(n, "image");
      const g = `post-${p.id}`;
      return `<article class="ycard ylift ypost ypost--embed" id="post-${esc(p.id)}" data-id="${esc(p.id)}" data-ylb-title="${esc(p.title || "")}" aria-labelledby="h-${esc(p.id)}">
        ${metaRow(p, what)}
        <h3 class="ypost__title" id="h-${esc(p.id)}"><button type="button" class="ypost__link ypost__open" data-lbopen="${esc(g)}" aria-haspopup="dialog">${esc(p.title || "Untitled set")}<span class="sr-only">: open the ${what}</span></button></h3>
        ${p.note ? `<p class="ypost__dek">${esc(p.note)}</p>` : ""}
        ${n ? `<div class="ypost__grid" data-n="${Math.min(n, 4)}">${media.map((m, i) => thumbHTML(g, m, i, n)).join("")}</div>` : ""}
        ${tagsHTML(p, c)}
      </article>`;
    },
  };

  function post(p, ctx = {}) {
    if (!p || !card[p.type]) return "";
    const c = { ...base, ...ctx, href: { ...base.href, ...(ctx.href || {}) } };
    return card[p.type](p, c);
  }
  // the "Images" title / any [data-lbopen] opens its first image in the lightbox
  document.addEventListener("click", (e) => {
    const b = e.target.closest?.("[data-lbopen]");
    if (b && Y.lightbox?.openGroup) { e.preventDefault(); Y.lightbox.openGroup(b.dataset.lbopen, 0); }
  });

  Y.post = Object.assign(post, { TYPES, TYPE, TIERS, TIER_COLORS, tierDefs, tierDef, tiersNamed, tierItems, tierOfVote, typeBadge, aggregate, crowdTiers, miniBoard, thumbHTML, trackItem, configure, swatch, NOTE_COLORS, STUB_COLORS, KICKER, COLORS, KICON, CARDWU, COLLICON, MINIMARKS, aboutPill, writeupPill, collMark, get ctx() { return base; } });
})();
