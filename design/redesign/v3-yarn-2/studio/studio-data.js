/* ============================================================
   Studio · mock-only data (studio agent)
   Builds the Studio's working copy from the real site data
   (window.BLAQAT, window.THOUGHTS: read-only) and adds what only
   the Studio knows: publish state, drafts, edit times, revisions,
   activity, the media library's extra files.
   window.StudioData = { NOW, seed(), revisions(item), ACTIVITY, LIBRARY_EXTRA, COLLECTION_ICONS }
   ============================================================ */
(() => {
  "use strict";
  const Y = window.Yarn, B = window.BLAQAT, T = window.THOUGHTS;
  const slug = Y.slug, hash = Y.hash;
  const clone = (o) => JSON.parse(JSON.stringify(o));
  // the mock's "now": Tue Nov 10 2026, 2:32 pm
  const NOW = new Date(2026, 10, 10, 14, 32).getTime();
  const MIN = 60e3, HR = 60 * MIN, DAY = 24 * HR;
  const ago = (ms) => NOW - ms;

  /* ---------- working copies ---------- */
  function seed() {
    const projects = B.projects.map((p, i) => ({
      ...clone(p), id: slug(p.name), _pub: "live", _order: i + 1, _edited: ago((3 + i * 2.3) * DAY + (hash(p.name) % 600) * MIN), _cover: 0,
    }));
    const by = (id) => projects.find((p) => p.id === id);
    // a project with unpublished edits, and a brand-new draft
    const sonata = by("sonata"); if (sonata) { sonata._pub = "changed"; sonata._edited = ago(2 * HR + 14 * MIN); }
    projects.unshift({
      id: "studio", name: "Studio", start: "Oct 2026", status: "Ongoing", type: "Personal",
      stack: ["Svelte", "Cloudflare", "Typescript"],
      description: "A private place to add and manage everything on this site from my phone: drafts that autosave, media that uploads straight from the camera roll, and a Publish button that goes live in seconds without a redeploy.",
      writeup: "## Why a studio\n\nEvery typo fix used to be a **commit, a push and a redeploy**. Now content lives in D1 and media in R2, so the site reads it at request time.\n\n### What it does\n\n- Drafts autosave while I type\n- Photos and videos upload from my phone, posters get picked for me\n- Publish is one tap and live in a few seconds\n\n> If I can't post it from the couch, I won't post it.\n",
      images: [{ src: "/media/site-plan.png", alt: "Sketch of the site map with the studio added" }],
      github: "https://github.com/blaqat/dotnet", _pub: "draft", _order: 0, _edited: ago(4 * MIN), _cover: 0,
    });
    const site = by("blaqat-net-this-site"); if (site) site.writeup = "## The music page\n\nThe hard part was showing **what's playing** across singles and collections with only cards.\n\n- Folders for collections\n- One player that never restarts\n";

    const music = B.music.map((m, i) => ({
      ...clone(m), id: slug(m.name), _pub: "live", _order: i + 1, _edited: ago((5 + i * 3.1) * DAY + (hash(m.name) % 700) * MIN),
      ...(m.songs ? { songs: m.songs.map((s) => ({ ...clone(s), id: slug(m.name + "-" + s.name) })) } : {}),
    }));
    const stars = music.find((m) => m.id === "of-the-stars"); if (stars) { stars._pub = "changed"; stars._edited = ago(26 * HR); }
    const revealed = music.find((m) => m.id === "revealed"); if (revealed) { revealed._pub = "changed"; revealed._edited = ago(3 * DAY); }
    music.unshift({
      id: "couch-demo-4", type: "single", name: "couch demo 4", start: "Nov 2026", status: "wip", instrument: "piano",
      url: "/media/couch-demo-4.m4a", description: "voice memo off the living room piano, cleaning it up later", _dur: 152, _file: "couch-demo-4.m4a", _pub: "draft", _order: 0, _edited: ago(46 * MIN),
    });

    const thoughts = T.posts.map((p, i) => ({ ...clone(p), _pub: "live", _order: i + 1, _edited: new Date(p.date).getTime() + 20 * MIN }));
    thoughts.unshift(
      { id: "a3", type: "article", date: "2026-11-10T09:12", tags: ["studio", "learnings"], title: "Building the Studio", dek: "Publishing from my phone, in yarn.",
        body: "## Why\n\nI wanted to post a thought **without opening a laptop**.\n\n## How it works\n\n- Content in D1, media in R2\n- The site reads at request time, so Publish is live in seconds\n", _pub: "draft", _edited: ago(12 * MIN), _order: 0 },
      { id: "tl2", type: "tierlist", date: "2026-11-09T22:40", tags: ["tools", "editor", "ranked"], title: "Code editors, ranked",
        tiers: { S: ["Zed"], A: ["Neovim", "Helix"], B: ["VS Code"], C: [], D: [] }, unranked: ["Sublime Text", "Emacs", "Cursor", "Xcode"],
        settings: { rank: true, comments: true, community: true }, _pub: "draft", _edited: ago(16 * HR), _order: 0 },
      { id: "t5", type: "scratch", date: "2026-11-10T13:58", tags: ["shower"], text: "drafts are just thoughts that haven't left the house yet", _pub: "draft", _edited: ago(34 * MIN), _order: 0 },
    );
    const tl1 = thoughts.find((p) => p.id === "tl1"); if (tl1) tl1.settings = { rank: true, comments: true, community: true };

    const home = {
      id: "home", name: "Home & About", _pub: "live", _edited: ago(9 * DAY),
      hello: "hi, i’m aiden!",
      lines: [
        { before: "a", word: "software engineer", after: "with a soft spot for ui design", color: "blue", to: "projects" },
        { before: "recent", word: "RIT", after: "grad, fluent in Java, Python, Rust and more", color: "orange", to: "link" },
        { before: "away from screens, i’m", word: "composing", after: "for piano, film, and games", color: "purple", to: "music" },
      ],
      contact: [
        { kind: "github", label: "blaqat", href: "https://github.com/blaqat" },
        { kind: "instagram", label: "@blaqat_ag", href: "https://instagram.com/blaqat_ag" },
        { kind: "x", label: "@blaqat_ag", href: "https://x.com/blaqat_ag" },
        { kind: "discord", label: "blaqat", href: "https://discordapp.com/users/383851442341019658" },
      ],
    };
    return { projects, music, thoughts, home, collections: clone(T.collections) };
  }

  /* ---------- revisions (deterministic per item) ---------- */
  // each: { id, t, who, kind: "publish"|"edit"|"create"|"restore", summary, changes: [{ field, before, after }] }
  function revisions(item, section) {
    const R = Y.rng(hash(item.id || item.name || "x"));
    const title = item.name || item.title || (item.text || "").slice(0, 40);
    const desc = item.description || item.dek || item.text || item.note || item.blurb || "";
    const shorter = desc.split(/(?<=[.!?])\s+/).slice(0, 1).join(" ");
    const out = [];
    let t = item._edited || NOW;
    const push = (o) => { out.push({ id: `r${out.length}`, who: "you", t, ...o }); t -= (0.4 + R() * 1.6) * DAY * (out.length > 2 ? 2.2 : .35) + R() * 90 * MIN; };
    if (item._pub === "changed" || item._pub === "draft") push({ kind: "edit", summary: "Autosaved draft", changes: desc ? [{ field: "Description", before: shorter + " (early notes)", after: desc }] : [] });
    if (section === "projects") {
      push({ kind: "publish", summary: "Published", changes: [] });
      push({ kind: "edit", summary: "Added a video", changes: [{ field: "Media", before: `${Math.max(0, (item.images || []).length - 1)} files`, after: `${(item.images || []).length} files` }] });
      push({ kind: "edit", summary: "Changed status", changes: [{ field: "Status", before: "Ongoing", after: item.status || "Complete" }] });
      push({ kind: "publish", summary: "Published", changes: [] });
      push({ kind: "edit", summary: "Rewrote the description", changes: [{ field: "Description", before: desc.replace(/\b(designed|built|developed|researched)\b/i, "made").replace(/playful/i, "fun"), after: desc }] });
      push({ kind: "create", summary: "Created", changes: [{ field: "Name", before: "", after: title }] });
    } else if (section === "music") {
      push({ kind: "publish", summary: "Published", changes: [] });
      push({ kind: "edit", summary: "Uploaded a new mix", changes: [{ field: "Audio", before: "2:31 · v1.mp3", after: "2:41 · final.mp3" }] });
      push({ kind: "edit", summary: "Added a SoundCloud link", changes: [{ field: "Links", before: "", after: "SoundCloud" }] });
      push({ kind: "create", summary: "Created", changes: [{ field: "Name", before: "", after: title }] });
    } else {
      push({ kind: "publish", summary: "Published", changes: [] });
      push({ kind: "edit", summary: "Edited text", changes: desc ? [{ field: "Text", before: shorter.replace(/\bthe\b/, "a"), after: shorter }] : [] });
      push({ kind: "create", summary: "Created", changes: [{ field: "Title", before: "", after: title }] });
    }
    return out;
  }

  /* ---------- activity (newest first) ---------- */
  const ACTIVITY = [
    { t: ago(4 * MIN), verb: "Autosaved", section: "projects", id: "studio", title: "Studio", icon: "ph-floppy-disk" },
    { t: ago(12 * MIN), verb: "Imported from Notion", section: "thoughts", id: "a3", title: "Building the Studio", icon: "ph-arrow-square-in" },
    { t: ago(46 * MIN), verb: "Uploaded a voice memo to", section: "music", id: "couch-demo-4", title: "couch demo 4", icon: "ph-upload-simple" },
    { t: ago(2 * HR + 14 * MIN), verb: "Edited", section: "projects", id: "sonata", title: "Sonata", icon: "ph-pencil-simple" },
    { t: ago(5 * HR), verb: "Published", section: "thoughts", id: "t1", title: "what if every website had a little cat…", icon: "ph-broadcast", live: true },
    { t: ago(26 * HR), verb: "Reordered tracks in", section: "music", id: "of-the-stars", title: "of.the.stars✨", icon: "ph-arrows-down-up" },
    { t: ago(30 * HR), verb: "Removed 2 unused files from", section: "media", id: "", title: "Media", icon: "ph-scissors" },
    { t: ago(2 * DAY + 3 * HR), verb: "Published", section: "thoughts", id: "tl1", title: "My favorite browsers, ranked", icon: "ph-broadcast", live: true },
    { t: ago(2 * DAY + 5 * HR), verb: "Restored an older version of", section: "projects", id: "code-editor-theme-generator", title: "Code Editor Theme Generator", icon: "ph-clock-counter-clockwise" },
  ];

  // files only the library knows about (not in the site data): uploads that never made it into a post
  const LIBRARY_EXTRA = [
    { file: "lofi-sketch-3.wav", kind: "audio", dur: 94, size: 16.6e6, t: ago(19 * DAY) },
    { file: "piano-take-2.m4a", kind: "audio", dur: 171, size: 2.9e6, t: ago(33 * DAY) },
    { file: "couch-demo-4.m4a", kind: "audio", dur: 152, size: 2.4e6, t: ago(46 * MIN) },
  ];

  const COLLECTION_ICONS = ["ph-wrench", "ph-book-open", "ph-headphones", "ph-game-controller", "ph-coffee", "ph-palette", "ph-terminal-window", "ph-heart"];

  window.StudioData = { NOW, MIN, HR, DAY, seed, revisions, ACTIVITY, LIBRARY_EXTRA, COLLECTION_ICONS };
})();
