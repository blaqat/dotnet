/* ============================================================
   Thoughts · shared data + helpers (iteration 2, mock-only)
   window.TH — used by stitched.js (feed / article / collection)
   and tier.js (tier list page). Loaded after kit/yarn.js.
   Mock-only additions live here (kit/thoughts-data.js is read-only):
     · comments for tier list tl1 (seed; new ones are stored in this browser only)
   ============================================================ */
(() => {
  "use strict";
  const Y = window.Yarn;
  const D = window.THOUGHTS || { posts: [], collections: {} };
  const P = Y.params;
  const esc = Y.esc;

  /* ---------- project write-ups (same split as iteration 1's projects.js) ---------- */
  function splitDesc(md) {
    let s = String(md || "").replace(/\r/g, "").trim();
    let tagline = "";
    const m = s.match(/^#{1,6}\s+(.+)\n+/);
    if (m) { tagline = m[1].trim(); s = s.slice(m[0].length); }
    const cut = s.search(/\n\s*(-{3,}\s*\n|#{1,6}\s)/);
    const summary = cut === -1 ? s : s.slice(0, cut);
    const writeup = cut === -1 ? "" : s.slice(cut).trim().replace(/^-{3,}\s*\n/, "");
    return { tagline, summary: summary.trim(), writeup: writeup.trim() };
  }
  // iteration 1's projects slug kept spaces→dashes only; the kit slug turns every non-alphanumeric run into "-". Accept both.
  const oldSlug = (s) => String(s).toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-");
  const PROJECTS = (window.BLAQAT?.projects || []).map((p) => ({ ...p, ...splitDesc(p.description), slug: Y.slug(p.name) }));
  const findProject = (s) => { const n = String(s || "").toLowerCase(); return PROJECTS.find((p) => p.slug === n || oldSlug(p.name) === n) || null; };
  const WRITEUPS = PROJECTS.filter((p) => p.writeup);
  const projectHref = (p) => `../projects/item.html?p=${encodeURIComponent(p.slug)}`; // i5: the project's own page
  const writeupHref = (p) => `stitched.html?view=article&project=${encodeURIComponent(p.slug)}`;
  const minsOf = (md) => Math.max(1, Math.round(String(md || "").split(/\s+/).length / 220));

  /* ---------- posts ----------
     i5 (T1, thoughts/CONCEPTS.md): a write-up is an article with `about`. A project write-up's text stays in the
     project (kit/data.js); its post (date, title, dek, tags) is in thoughts-data.js, or made up here if missing, so
     every project write-up is an ordinary article in the feed. ?pickart=article folds an article about a pick into
     the pick itself (the pick *is* the article); ?pickart=link (default) keeps them two posts. */
  const PICKART = P.get("pickart") === "article" ? "article" : "link";
  const ALIAS = {}; // folded article id → the pick it became (old links keep working)
  const raw = D.posts.map((p) => ({ ...p }));
  const isoOf = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T12:00`;
  for (const pr of WRITEUPS) {
    const ref = `project:${pr.slug}`;
    let wp = raw.find((p) => p.about === ref);
    if (!wp) raw.push((wp = { id: `wu-${pr.slug}`, type: "article", about: ref, date: isoOf(Y.parseDate(pr.end || pr.start) || new Date()), tags: [], title: pr.name, dek: pr.tagline || "" }));
    wp.body = wp.body || pr.writeup;
    wp.readMins = wp.readMins || minsOf(wp.body);
    // (no cover from the project's images: screenshots crop badly at 2.2:1; the About card shows the first one)
  }
  if (PICKART === "article") {
    for (const a of [...raw]) {
      const id = a.type === "article" && /^post:[^#]+$/.test(a.about || "") ? a.about.slice(5) : null;
      const pk = id && raw.find((p) => p.id === id && p.type === "pick");
      if (!pk || pk.body) continue;
      Object.assign(pk, { body: a.body, readMins: a.readMins || minsOf(a.body), articleTitle: a.title, articleDek: a.dek, tags: [...new Set([...(pk.tags || []), ...(a.tags || [])])] });
      ALIAS[a.id] = pk.id;
      raw.splice(raw.indexOf(a), 1);
    }
  }
  const POSTS = raw.sort((a, b) => b.date.localeCompare(a.date));
  const byId = Object.fromEntries(POSTS.map((p) => [p.id, p]));
  Object.entries(ALIAS).forEach(([a, p]) => { byId[a] = byId[p]; });
  const COLLECTIONS = D.collections || {};
  const collCount = (k) => POSTS.filter((p) => p.collection === k).length;

  // post types + the type badge: the kit's post vocabulary (kit/posts.js), shared with Studio
  const { TYPES, TYPE, typeBadge } = Y.post;
  const date = (p, o = {}) => Y.badge.date(p.date || p, { style: "day", ...o });

  // every tag in use, most used first
  const TAGS = (() => {
    const m = new Map();
    POSTS.forEach((p) => (p.tags || []).forEach((t) => m.set(t, (m.get(t) || 0) + 1)));
    return [...m].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  })();

  /* ---------- storage: never throws; ?state=… (frozen review states) never writes ---------- */
  const FROZEN = P.has("state");
  const store = {
    get(k, d = null) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (_) { return d; } },
    set(k, v) { if (FROZEN) return; try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} },
    del(k) { if (FROZEN) return; try { localStorage.removeItem(k); } catch (_) {} },
  };

  /* ---------- rankings (i4: tiers come from the post: default S–D or the owner's own names, kit/posts.js) ---------- */
  const TIERS = Y.post.TIERS; // the default set; a ranking's own tiers: tierDefs(post)
  const OWNER = "blaqat";
  const tierDefs = (post) => Y.post.tierDefs(post);
  const tierIds = (post) => tierDefs(post).map((d) => d.id);
  const tierLabel = (post, id) => Y.post.tierDef(post, id)?.label ?? id;
  const tierItems = (post) => Y.post.tierItems(post);
  const ownerTierOf = (post, name) => tierIds(post).find((t) => (post.tiers[t] || []).includes(name)) || null;
  // a believable sample ranking for review (?you=demo); never saved
  const DEMO_VOTE = {
    tl1: { tiers: { S: ["Zen", "Helium"], A: ["Arc", "Firefox"], B: ["Orion", "Safari"], C: ["Chrome", "Brave"], D: ["Edge", "Vivaldi"] }, at: "2026-11-09T21:12", name: "you" },
    tl3: { tiers: { ride: ["JetBrains Mono", "Maple Mono"], rotation: ["Berkeley Mono", "Fira Code"], sunday: ["Iosevka", "Monaspace", "Consolas"], screenshot: ["Comic Mono", "Courier New"] }, at: "2026-11-09T21:40", name: "you" },
  };
  const voteKey = (id) => `th:vote:${id}`;
  const myVote = (post) => (P.get("you") === "demo" ? DEMO_VOTE[post.id] || null : store.get(voteKey(post.id)));
  const saveVote = (post, tiers, name) => store.set(voteKey(post.id), { tiers, at: new Date().toISOString(), name: name || "" });
  const clearVote = (post) => store.del(voteKey(post.id));
  const tierOfVote = (vote, name, post = null) => Y.post.tierOfVote(vote, name, post);

  // community % (+ your vote if any) → per item { counts, pct[], best, bestPct, mean }; crowd placement. Both live in kit/posts.js.
  const aggregate = (post, vote = myVote(post)) => Y.post.aggregate(post, vote);
  const crowdTiers = (post, agg = aggregate(post)) => Y.post.crowdTiers(post, agg);

  /* ---------- comments (seed + this browser's) ---------- */
  const SEED_COMMENTS = {
    tl1: [
      // i6 (R1): comments mention items (@Arc) and tiers (#A) as smart words; the page renders them as chips
      { id: "c1", name: "mira", when: "2026-11-08T14:10", likes: 12, ranked: { Arc: "B" },
        text: "@Arc in #A is generous. I love it, but it's been coasting since they stopped adding features." },
      { id: "c2", name: OWNER, owner: true, replyTo: "c1", when: "2026-11-08T16:02", likes: 9,
        text: "fair. it's in #A on vibes alone, and the vibes are still immaculate" },
      { id: "c3", name: "devon", when: "2026-11-06T09:30", likes: 7, ranked: { Helium: "S" },
        text: "@Helium in #S. Finally someone who gets it." },
      { id: "c4", name: "kai", when: "2026-11-04T22:47", likes: 4, ranked: { Orion: "A" },
        text: "@Orion deserves better! Battery life on my laptop basically doubled, and it beats @Safari at its own game." },
    ],
    // custom tiers: `ranked` holds tier ids; the chips print the tier's own name
    tl3: [
      { id: "c1", name: "june", when: "2026-10-21T19:02", likes: 6, ranked: { "Comic Mono": "rotation" },
        text: "@Comic Mono in the rotation and I will not be taking questions." },
      { id: "c2", name: OWNER, owner: true, replyTo: "c1", when: "2026-10-21T20:30", likes: 4,
        text: "respect. it's a Sunday font for me but I see the vision" },
      { id: "c3", name: "theo", when: "2026-10-20T08:15", likes: 3, ranked: { Consolas: "sunday" },
        text: "@Consolas only showing up in screenshots is a crime. It's fine! It's fine." },
    ],
  };
  const commentsKey = (id) => `th:comments:${id}`;
  const localComments = (post) => store.get(commentsKey(post.id), []) || [];
  const comments = (post) => [...localComments(post), ...(SEED_COMMENTS[post.id] || [])];
  const addComment = (post, c) => { const list = localComments(post); list.unshift(c); store.set(commentsKey(post.id), list); return c; };
  const likedKey = (id) => `th:liked:${id}`;
  const liked = (post) => new Set(store.get(likedKey(post.id), []) || []);
  const setLiked = (post, set) => store.set(likedKey(post.id), [...set]);

  // "2d ago" within a week, else the kit day format
  function ago(iso) {
    const d = Y.parseDate(iso);
    if (!d) return "";
    const s = (Date.now() - d.getTime()) / 1000;
    if (s < 0 || s > 7 * 86400) return Y.fmt.day(d);
    if (s < 60) return "just now";
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  }

  const tierHref = (post, mode = "", hash = "") => `tier.html?id=${encodeURIComponent(post.id)}${mode ? `&mode=${mode}` : ""}${hash}`;
  const articleHref = (p) => `stitched.html?view=article&id=${encodeURIComponent(p.id)}`;
  const collHref = (k, id) => `stitched.html?view=collection&c=${encodeURIComponent(k)}${id ? `&item=${encodeURIComponent(id)}` : ""}`;

  /* ---------- i5 (T1) · "about": what an article is about, and the articles about a thing ----------
     about(ref) → { ref, kind, name, href, icon, post?, project?, item? }   (null if it points nowhere)
       kind: "project" · "release" · "ranking" · "item" (one entry on a ranking) · "pick" · "post"
     writeupsOf(ref) → the articles about exactly that thing, newest first ("post:tl1" ≠ "post:tl1#Helium") */
  const KIND_WORD = { project: "project", release: "release", ranking: "ranking", item: "ranked item", pick: "pick", post: "post" };
  function about(ref) {
    const m = String(ref || "").match(/^(project|release|post):([^#]+)(?:#(.+))?$/);
    if (!m) return null;
    const [, ns, id, item] = m;
    if (ns === "project") {
      const pr = findProject(id);
      return pr && { ref, kind: "project", word: KIND_WORD.project, name: pr.name, href: projectHref(pr), icon: "ph-folder-simple", project: pr };
    }
    if (ns === "release") {
      const r = (window.BLAQAT?.music || []).find((x) => Y.slug(x.name) === id);
      return r && { ref, kind: "release", word: KIND_WORD.release, name: r.name, href: "../music/index.html", icon: "ph-music-notes" };
    }
    const p = byId[id];
    if (!p) return null;
    if (item) {
      if (p.type !== "tierlist" || !tierItems(p).includes(item)) return null;
      const td = Y.post.tierDef(p, ownerTierOf(p, item)); // the owner's tier: the pill wears its felt key
      return { ref, kind: "item", word: KIND_WORD.item, name: item, href: `${tierHref(p)}&item=${encodeURIComponent(Y.slug(item))}`, icon: "ph-ranking", post: p, item, tier: td && { id: td.id, short: td.short, color: td.color } };
    }
    if (p.type === "tierlist") return { ref, kind: "ranking", word: KIND_WORD.ranking, name: p.title, href: tierHref(p), icon: "ph-ranking", post: p };
    if (p.type === "pick") return { ref, kind: "pick", word: KIND_WORD.pick, name: p.name, href: p.collection ? collHref(p.collection, p.id) : `stitched.html#post-${p.id}`, icon: "ph-tag", post: p };
    return { ref, kind: "post", word: (TYPE[p.type]?.one || "post").toLowerCase(), name: p.title || p.name || "a post", href: p.type === "article" ? articleHref(p) : `stitched.html#post-${p.id}`, icon: TYPE[p.type]?.icon || "ph-note", post: p };
  }
  const ABOUT = new Map(); // ref → [articles]
  POSTS.forEach((p) => { if (p.type === "article" && p.about) ABOUT.set(p.about, [...(ABOUT.get(p.about) || []), p]); });
  const writeupsOf = (ref) => ABOUT.get(ref) || [];
  // the items on a ranking that have their own write-up: Map(item → [articles])
  const itemWriteups = (post) => new Map(tierItems(post).map((n) => [n, writeupsOf(`post:${post.id}#${n}`)]).filter(([, a]) => a.length));
  const writeupOfProject = (pr) => writeupsOf(`project:${pr.slug}`)[0] || null;

  // the kit's post cards read this page's data: collections (+ the local video post), votes and comments from this browser
  Y.post.configure({
    collections: COLLECTIONS, collCount,
    href: { article: articleHref, collection: collHref, tier: tierHref },
    vote: myVote, comments, owner: OWNER,
    about, writeups: (p) => writeupsOf(`post:${p.id}`), // i5 (T1)
    itemWriteups, // i6 (R4)
  });

  /* ---------- i6 (T2) · back = what you clicked (owner: "going back should just take u to what u clicked on") ----------
     Leaving the feed by a link remembers { from: the feed URL (filters included), y: its scroll, id: the post you
     clicked in, to: where the link went } for this tab (sessionStorage). On the page it went to, TH.ret is that record,
     every Back link (.ydetail__back) steps back in history (the feed comes back as you left it) and TH.backTo() gives
     its href + label for a new tab or a direct visit (the feed with that post: #post-<id> scrolls to it and ropes it).
     Back on the feed (the browser's back too), TH.retOnFeed() tells the feed where to scroll and what to rope. */
  const RET = "th:ret";
  const bare = (u) => { try { const x = new URL(u, location.href); x.hash = ""; return x.href; } catch (_) { return String(u || ""); } };
  const isFeedURL = (u) => { try { const x = new URL(u, location.href); return /\/stitched\.html$/.test(x.pathname) && !x.searchParams.get("view"); } catch (_) { return false; } };
  const retStore = {
    get() { try { return JSON.parse(sessionStorage.getItem(RET) || "null"); } catch (_) { return null; } },
    set(v) { try { sessionStorage.setItem(RET, JSON.stringify(v)); } catch (_) {} },
  };
  const loadedAt = bare(location.href);
  const ret = (() => { const r = retStore.get(); return r && isFeedURL(r.from) && bare(r.to) === loadedAt ? r : null; })();
  const noteLeave = (href, id = null) => retStore.set({ from: bare(location.href), y: Math.round(scrollY), id, to: bare(href) });
  function retOnFeed({ persisted = false } = {}) {
    const nav = performance.getEntriesByType?.("navigation")?.[0]?.type;
    if (!persisted && nav !== "back_forward") return null;
    const r = retStore.get();
    return r && bare(r.from) === bare(location.href) ? r : null;
  }
  const backTo = (id) => (ret
    ? { href: `${ret.from}${ret.id ? `#post-${encodeURIComponent(ret.id)}` : ""}`, label: "Thoughts" }
    : { href: `stitched.html${id && byId[id] ? `#post-${encodeURIComponent(byId[id].id)}` : ""}`, label: "Thoughts" });
  document.addEventListener("click", (e) => {
    const b = e.target.closest?.(".ydetail__back");
    if (!b || !ret || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || history.length < 2) return;
    e.preventDefault();
    Y.sound("close", { el: b });
    history.back();
  });

  window.TH = {
    POSTS, byId, COLLECTIONS, collCount, TYPES, TYPE, TAGS, typeBadge, date,
    PROJECTS, WRITEUPS, findProject, projectHref, writeupHref, splitDesc,
    PICKART, ALIAS, about, writeupsOf, itemWriteups, writeupOfProject, articleHref, collHref, minsOf,
    store, FROZEN, TIERS, OWNER, tierDefs, tierIds, tierLabel, tierItems, ownerTierOf, myVote, saveVote, clearVote, tierOfVote, aggregate, crowdTiers,
    comments, addComment, liked, setLiked, ago, tierHref,
    ret, noteLeave, retOnFeed, backTo, isFeedURL, // i6 (T2)
  };
})();
