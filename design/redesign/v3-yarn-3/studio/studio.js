/* ============================================================
   Studio · boot (studio agent, iteration 2)
   Every screen is reachable by URL:
     ?screen=signin|dashboard|list|project|music|compose|history|media|home (+ section, id, type)
   or by a preset (also in the ⚙ panel):  ?view=<preset>
   Page options (⚙ "This page"):
     frame=section|ink     layout=split|single     confirm=smart|always
     offline=1             pstate=ok|error
   State demos for screenshots: demo=reorder|upload|published|publishing|add|drag|wave|select|code,
     sheet=new|notion|publish|media, nstep=2, usage=orphaned, pane=preview
   Data: ?reset clears what the Studio saved on this device (localStorage).
   ============================================================ */
(() => {
  "use strict";
  const S = window.Studio, Y = window.Yarn;

  const PRESETS = {
    signin: ["Sign in", { screen: "signin" }],
    "signin-code": ["Sign in · code", { screen: "signin", step: "code", demo: "code" }],
    "signin-denied": ["Sign in · denied", { screen: "signin", step: "denied" }],
    dashboard: ["Dashboard", { screen: "dashboard" }],
    new: ["New sheet", { screen: "dashboard", sheet: "new" }],
    notion: ["Notion import", { screen: "dashboard", sheet: "notion", nstep: "2" }],
    "list-projects": ["Projects list", { screen: "list", section: "projects" }],
    reorder: ["Reordering", { screen: "list", section: "projects", demo: "reorder" }],
    "list-music": ["Music list", { screen: "list", section: "music" }],
    "list-thoughts": ["Thoughts list", { screen: "list", section: "thoughts" }],
    project: ["Project editor", { screen: "project", id: "sonata" }],
    "project-upload": ["Uploading", { screen: "project", id: "studio", demo: "upload" }],
    "project-media": ["Poster picker", { screen: "project", id: "blaqat-net-this-site", sheet: "media" }],
    publish: ["Publish check", { screen: "project", id: "sonata", sheet: "publish" }],
    publishing: ["Publishing", { screen: "project", id: "studio", demo: "publishing" }],
    published: ["Live toast", { screen: "project", id: "studio", demo: "published" }],
    history: ["History", { screen: "history", section: "projects", id: "sonata" }],
    music: ["Track editor", { screen: "music", id: "couch-demo-4", demo: "wave" }],
    collection: ["Collection", { screen: "music", id: "vgm-class-final-project", track: "1" }],
    scratch: ["Scratch", { screen: "compose", type: "scratch", id: "t5" }],
    article: ["Article", { screen: "compose", type: "article", id: "a3" }],
    pick: ["Pick", { screen: "compose", type: "pick", id: "p1" }],
    playlist: ["Playlist", { screen: "compose", type: "playlist", id: "pl1" }],
    images: ["Images", { screen: "compose", type: "embed", id: "e1" }],
    tierlist: ["Ranking", { screen: "compose", type: "tierlist", id: "tl2" }],
    "tier-add": ["Ranking · add", { screen: "compose", type: "tierlist", id: "tl2", demo: "add" }],
    "tier-drag": ["Ranking · drag", { screen: "compose", type: "tierlist", id: "tl2", demo: "drag" }],
    media: ["Media library", { screen: "media" }],
    orphans: ["Unused files", { screen: "media", usage: "orphaned" }],
    home: ["Home & About", { screen: "home" }],
  };
  const DEFAULT_ID = { project: { id: "sonata" }, music: { id: "couch-demo-4" }, history: { section: "projects", id: "sonata" } };

  function start() {
    const u = new URL(location.href);
    const view = u.searchParams.get("view");
    if (view && PRESETS[view]) {
      // clear whatever the previous preset set; keep everything else (kit + page options, pane=…)
      const used = new Set(Object.values(PRESETS).flatMap(([, o]) => Object.keys(o)));
      for (const k of [...u.searchParams.keys()]) if (used.has(k)) u.searchParams.delete(k);
      for (const [k, v] of Object.entries(PRESETS[view][1])) u.searchParams.set(k, v);
    }
    const scr = u.searchParams.get("screen");
    if (scr && DEFAULT_ID[scr] && !u.searchParams.get("id")) for (const [k, v] of Object.entries(DEFAULT_ID[scr])) u.searchParams.set(k, v);
    u.searchParams.delete("reset");
    history.replaceState({ st: 1 }, "", u);

    Y.mockPanel([
      { label: "Screen (preset)", param: "view", options: Object.entries(PRESETS).map(([k, [l]]) => [k, l]), default: "dashboard" },
      { label: "Frame", param: "frame", options: [["section", "Section colour"], ["ink", "Always ink"]], default: "section" },
      { label: "Editor on desktop", param: "layout", options: [["split", "Form + live preview"], ["single", "Edit / Preview toggle"]], default: "split" },
      { label: "Publish", param: "confirm", options: [["smart", "Check only if needed"], ["always", "Always show checklist"]], default: "smart" },
      { label: "Network", param: "offline", options: [["", "Online"], ["1", "Offline"]], default: "" },
      { label: "Publish result", param: "pstate", options: [["ok", "Goes live"], ["error", "Fails"]], default: "ok" },
      { label: "Post card kicker (previews)", param: "kicker", options: [["caps", "CAPS + mono (i1)"], ["plain", "Mixed case (i2)"]], default: "caps" },
      { label: "Note / stub colours (previews)", param: "colors", options: [["data", "From the post"], ["default", "All default"]], default: "data" },
    ], { title: "Studio options" });

    // sheets that a URL can open on top of a screen
    S.on("render", (name, q) => {
      const sh = q.get("sheet");
      if (name === "dashboard" && sh === "new") requestAnimationFrame(() => S.openNew(document.querySelector(".yhead [data-new]")));
      if (name === "dashboard" && sh === "notion") requestAnimationFrame(() => S.openNotion(document.querySelector("[data-notion]"), +(q.get("nstep") || 1)));
    });
    S.render();
  }
  // marked (defer, CDN) may arrive after us; the fallback renderer covers it either way
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
