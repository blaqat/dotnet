/* ============================================================
   projects/item.js · a project as its own page (the grid and phones open this)
   item.html?p=<slug> · the kit detail shell in the i5 grammar (LAYOUT-i5.md):
   sticky top bar (Back · compact title · previous / next · copy), then
   title → facts → stack → links → media → text. ?dlayout= arranges it.
   i5 (G6.1): no pager at the bottom. Previous / next lives once, in the top bar
   (?dnav=count|labels|arrows; ←/→ or k/j follow it). Back returns to the list
   with the project focused (?focus=<slug>).
   i6 (LAYOUT-i6.md): ?dlayout=label (decided; side | rail under Earlier) · the stack = the kit's stack tags ·
   dnav=count decided (+ the neighbour's title on hover / focus) · Back = the top bar's first item (L7).
   ============================================================ */
(() => {
  "use strict";
  const Y = window.Yarn, D = window.PJ, P = Y.params, esc = Y.esc;
  const host = document.getElementById("pj-item");
  const p = D.bySlug[P.get("p")] || D.list[0];
  const i = D.list.indexOf(p);
  // the list runs newest first: "previous" is the one above (newer), "next" the one below (older)
  const side = (x) => (x ? { href: D.pageHref(x), title: x.name, meta: esc(Y.dateRange(x)) } : null);

  document.title = `${p.name} · Projects · blaqat.net`;
  host.innerHTML = Y.detailPage(D.detailHTML(p, {
    back: { href: D.listHref(p), label: "Projects" },
    actions: D.act.copy(p),
    nav: { prev: side(D.list[i - 1]), next: side(D.list[i + 1]), index: i + 1, total: D.list.length, unit: "project" },
    level: 1,
    stackAs: "a", // a stack chip leads to the list filtered by it
  })); // i6: the kit's CSS gives the rails their page columns (rail: column + right rail · side: left rail + column)

  // the back link plays the close sound (previous / next get the kit's tap)
  host.addEventListener("click", (e) => {
    if (e.target.closest(".ydetail__back")) Y.sound("close");
  });
  addEventListener("keydown", (e) => {
    if (Y.lightbox?.isOpen || e.metaKey || e.ctrlKey || e.altKey || e.target.closest?.("input, textarea")) return;
    if (e.key === "Escape") { location.href = D.listHref(p); }
  });

  // G1: ?p is a demo-state helper (Jump to); the layout + previous/next designs are the open decisions
  Y.mockPanel([
    ...Y.detailOptions({ nav: true }),
    // i7 · P2 (Open): the facts' status + date, as on the list (pj-core.js)
    { global: true, label: "Status + date (P2)", param: "statusdate", options: [["joined", "Joined: (✓) Completed Dec 2024 · (hammer) WIP since Sep 2025 (decided i8)"], ["apart", "Apart: (✓) Complete · Aug – Dec 2024"]], default: "joined" },
    { label: "Project", param: "p", options: D.list.map((x) => [x.slug, x.name.replace(/\s*\(.*\)$/, "")]), default: D.list[0].slug, state: true },
  ], { title: "Project page options" });
})();
