/* ============================================================
   projects/item.js · a project as its own page (?open=page)
   item.html?p=<slug> · kit detail shell: sticky top (back · title ·
   actions) and sticky foot (links); title → metadata → media → text → links.
   Back returns to the list with the project focused (?focus=<slug>).
   ============================================================ */
(() => {
  "use strict";
  const Y = window.Yarn, D = window.PJ, P = Y.params, esc = Y.esc;
  const host = document.getElementById("pj-item");
  const p = D.bySlug[P.get("p")] || D.list[0];
  const i = D.list.indexOf(p);
  const newer = D.list[i - 1], older = D.list[i + 1];

  document.title = `${p.name} · Projects · blaqat.net`;
  host.innerHTML = Y.detailPage(D.detailHTML(p, {
    back: { href: D.listHref(p), label: "Projects" },
    actions: D.act.prev(newer) + D.act.next(older) + D.act.copy(p),
    level: 1,
    stackAs: "li",
    // i3: the kit's in-flow pager (same end as a Thoughts article); the ends lead back to the list
    end: Y.pager({
      prev: newer && { href: D.pageHref(newer), title: newer.name, meta: esc(Y.dateRange(newer)) },
      next: older && { href: D.pageHref(older), title: older.name, meta: esc(Y.dateRange(older)) },
      ends: { prev: { label: "Newest project", title: "Back to all projects", href: D.listHref(p) }, next: { label: "Oldest project", title: "Back to all projects", href: D.listHref(p) } },
      labels: { prev: "Newer", next: "Older" }, icons: { prev: "ph-arrow-up", next: "ph-arrow-down" }, label: "More projects",
    }),
  }));

  // the back link plays the close sound; prev/next and the list link play open/close
  host.addEventListener("click", (e) => {
    if (e.target.closest(".ydetail__back")) Y.sound("close");
    else if (e.target.closest(".ypager__a")) Y.sound("open");
  });
  addEventListener("keydown", (e) => {
    if (Y.lightbox?.isOpen || e.metaKey || e.ctrlKey || e.altKey || e.target.closest?.("input, textarea")) return;
    if (e.key === "Escape") { location.href = D.listHref(p); }
  });

  Y.mockPanel([
    { label: "Project", param: "p", options: D.list.map((x) => [x.slug, x.name.replace(/\s*\(.*\)$/, "")]), default: D.list[0].slug },
  ], { title: "Project page options" });
})();
