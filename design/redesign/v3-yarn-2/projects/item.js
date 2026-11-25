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
  }) + `<nav class="pj-pn" aria-label="More projects">
      ${newer ? `<a class="ycard ylift pj-pn__a" href="${esc(D.pageHref(newer))}" rel="prev"><span class="eyebrow"><i class="ph-bold ph-arrow-up" aria-hidden="true"></i>Newer</span><b>${esc(newer.name)}</b>${Y.meta(newer)}</a>` : `<span></span>`}
      ${older ? `<a class="ycard ylift pj-pn__a pj-pn__a--next" href="${esc(D.pageHref(older))}" rel="next"><span class="eyebrow">Older<i class="ph-bold ph-arrow-down" aria-hidden="true"></i></span><b>${esc(older.name)}</b>${Y.meta(older)}</a>` : `<span></span>`}
    </nav>`);

  // the back link plays the close sound; prev/next and the list link play open/close
  host.addEventListener("click", (e) => {
    if (e.target.closest(".ydetail__back")) Y.sound("close");
    else if (e.target.closest(".pj-pn__a")) Y.sound("open");
  });
  addEventListener("keydown", (e) => {
    if (Y.lightbox?.isOpen || e.metaKey || e.ctrlKey || e.altKey || e.target.closest?.("input, textarea")) return;
    if (e.key === "Escape") { location.href = D.listHref(p); }
  });

  Y.mockPanel([
    { label: "Project", param: "p", options: D.list.map((x) => [x.slug, x.name.replace(/\s*\(.*\)$/, "")]), default: D.list[0].slug },
  ], { title: "Project page options" });
})();
