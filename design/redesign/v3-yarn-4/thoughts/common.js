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

  /* ---------- posts ---------- */
  const POSTS = [...D.posts].sort((a, b) => b.date.localeCompare(a.date));
  const byId = Object.fromEntries(POSTS.map((p) => [p.id, p]));
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
  const projectHref = (p) => `../projects/index.html?p=${encodeURIComponent(p.slug)}`;
  const writeupHref = (p) => `stitched.html?view=article&project=${encodeURIComponent(p.slug)}`;

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
      { id: "c1", name: "mira", when: "2026-11-08T14:10", likes: 12, ranked: { Arc: "B" },
        text: "Arc in A is generous. I love it, but it's been coasting since they stopped adding features." },
      { id: "c2", name: OWNER, owner: true, replyTo: "c1", when: "2026-11-08T16:02", likes: 9,
        text: "fair. it's in A on vibes alone, and the vibes are still immaculate" },
      { id: "c3", name: "devon", when: "2026-11-06T09:30", likes: 7, ranked: { Helium: "S" },
        text: "Helium in S. Finally someone who gets it." },
      { id: "c4", name: "kai", when: "2026-11-04T22:47", likes: 4, ranked: { Orion: "A" },
        text: "Orion deserves better! Battery life on my laptop basically doubled." },
    ],
    // custom tiers: `ranked` holds tier ids; the chips print the tier's own name
    tl3: [
      { id: "c1", name: "june", when: "2026-10-21T19:02", likes: 6, ranked: { "Comic Mono": "rotation" },
        text: "Comic Mono in the rotation and I will not be taking questions." },
      { id: "c2", name: OWNER, owner: true, replyTo: "c1", when: "2026-10-21T20:30", likes: 4,
        text: "respect. it's a Sunday font for me but I see the vision" },
      { id: "c3", name: "theo", when: "2026-10-20T08:15", likes: 3, ranked: { Consolas: "sunday" },
        text: "Consolas only showing up in screenshots is a crime. It's fine! It's fine." },
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

  // the kit's post cards read this page's data: collections (+ the local video post), votes and comments from this browser
  Y.post.configure({
    collections: COLLECTIONS, collCount,
    href: { article: (p) => `stitched.html?view=article&id=${encodeURIComponent(p.id)}`, collection: (k, id) => `stitched.html?view=collection&c=${encodeURIComponent(k)}${id ? `&item=${encodeURIComponent(id)}` : ""}`, tier: tierHref },
    vote: myVote, comments, owner: OWNER,
  });

  window.TH = {
    POSTS, byId, COLLECTIONS, collCount, TYPES, TYPE, TAGS, typeBadge, date,
    PROJECTS, WRITEUPS, findProject, projectHref, writeupHref, splitDesc,
    store, FROZEN, TIERS, OWNER, tierDefs, tierIds, tierLabel, tierItems, ownerTierOf, myVote, saveVote, clearVote, tierOfVote, aggregate, crowdTiers,
    comments, addComment, liked, setLiked, ago, tierHref,
  };
})();
