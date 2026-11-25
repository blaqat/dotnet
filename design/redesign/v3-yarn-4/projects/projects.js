/* ============================================================
   projects/projects.js · Projects page, iteration 4 (mock-only)
   Built on the kit (Yarn.*) + projects/pj-core.js (window.PJ).
   How the layouts are put together (and what Music reuses): projects/LAYOUT.md

   Desktop  ?view=list   timeline (ruled year pills, yarn ball on the selected project)
                         + sticky stage (.ypanel, the white card material)
            ?view=grid   year groups (ruled pills = clear separators) of 2-column cards; no selected state
                         ?open=inline (default): the card opens in place (Yarn.openInPlace)
                         ?open=page: the card is a link to its own page (item.html)
   Phones   a plain vertical list grouped by year; a tap opens the project's own page (item.html)
   Options  ?open=inline|page  ?gimg=side|top  ?hover=click|intent  ?mf=wrap|scroll
            phone search/filters = the kit option ?msearch=fab|bar (Yarn.listTools)
   State    ?p=<slug> selected (timeline) / open (grid) · ?focus=<slug> (back from the item page) · ?fab=open
   ============================================================ */
(() => {
  "use strict";
  const Y = window.Yarn, D = window.PJ, P = Y.params, esc = Y.esc;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const pick = (k, ok, d) => (ok.includes(P.get(k)) ? P.get(k) : d);
  const RM = () => Y.reduced();

  const OPT = {
    view: pick("view", ["list", "grid"], "list"),
    open: pick("open", ["inline", "page"], "inline"),
    hover: pick("hover", ["click", "intent"], "click"),
    gimg: pick("gimg", ["side", "top"], "side"),
    mf: pick("mf", ["wrap", "scroll"], "wrap"),
  };
  const PJ = D.list, BY = D.bySlug, N = PJ.length;
  const desk = matchMedia("(min-width: 960px)");
  const isDesk = () => desk.matches;
  // phones: always the list by year + a separate page (owner, Projects 7: "keeping it simple there")
  const modeNow = () => (isDesk() ? OPT.view : "mlist");
  const keyOf = (p) => p.slug;

  const pj = $("#pj"), headEl = $("#pj-head"), topEl = $("#pj-top"), body = $("#pj-body"), live = $("#pj-live");

  function setParam(k, v) {
    const u = new URL(location.href);
    v == null || v === "" ? u.searchParams.delete(k) : u.searchParams.set(k, v);
    history.replaceState(history.state, "", u);
  }
  const visible = (p) => !!p && F.test(p);
  const stickyTop = () => parseFloat(getComputedStyle(body).getPropertyValue("--sticky-top")) || 0;

  /* ============================================================
     FILTERS: kit model + search line + filter row (All, type | status; stack in Browse)
     ============================================================ */
  const F = Y.filters({
    groups: [
      { key: "type", label: "Type", row: true, values: ["Personal", "Work", "School"] },
      { key: "status", label: "Status", row: true, values: ["ongoing", "complete", "paused"] },
      { key: "stack", label: "Stack", values: D.STACKS },
    ],
    items: PJ,
    text: (p) => [p.name, p.text, p.type, Y.status(p.status)?.label, Y.dateRange(p), p.year, ...p.stack, ...p.tags].join(" "),
  });
  const searchHost = document.createElement("div");
  const rowHost = document.createElement("div");
  rowHost.className = "pj-filters";
  // filterRow first so search knows type/status chips live in the row (they light up instead of becoming tokens)
  Y.filterRow(rowHost, F, { all: "All", browse: true });
  // desktop: search + filters share one line (owner, Projects 3); the long hint gives way below 1280px (phones too)
  const longHint = matchMedia("(min-width: 1280px)");
  Y.search(searchHost, F, { placeholder: "Search projects", hint: matchMedia("(pointer: fine)").matches });
  const hintInput = $(".ysearch__input", searchHost);
  const paintHint = () => { if (hintInput) hintInput.placeholder = longHint.matches ? "Search projects… try “python”" : "Search projects"; };
  longHint.addEventListener("change", paintHint);
  // one mobile pattern for every list page (kit ?msearch=bar|fab): top search + sticky filter row, or the search FAB
  const tools = Y.listTools(F, {
    tools: topEl, search: searchHost, row: rowHost, sticky: body,
    label: "Search and filter projects", title: "Find a project",
    count: () => `${PJ.filter(visible).length} of ${N} shown`,
  });

  function placeChrome() {
    rowHost.classList.toggle("yfilter--wrap", !isDesk() && OPT.mf === "wrap"); // kit option (filterRow({ wrap }))
    tools.place();
    topEl.classList.add("ytools");
    pj.classList.toggle("pj--fab", tools.isFab());
    paintHint();
  }

  /* ============================================================
     IN-ITEM MATCH MARKS (owner, Projects 4): a stack / type / status that matches
     the active filter or search is marked inside each item (.is-match, see pj-core)
     ============================================================ */
  function hits() {
    const words = F.q.trim().toLowerCase().split(/\s+/).filter((w) => w.length >= 2);
    // a typed word marks a value when it starts one of the value's words ("py" → Python, "next" → Next.js)
    const typed = (label) => words.length > 0 && String(label || "").toLowerCase().split(/[\s/._-]+/).some((x) => x && words.some((w) => x.startsWith(w)));
    return {
      status: (p) => { const st = Y.status(p.status); return !!st && (F.has("status", st.key) || typed(st.label)); },
      type: (p) => F.has("type", p.type) || typed(p.type),
      stack: (s) => F.has("stack", s) || typed(s),
    };
  }
  // rows don't list their stack, so a matching stack shows up in the row as a marked chip
  const hitsHTML = (p, H) => p.stack.filter(H.stack).map((s) => `<span class="ystk is-match">${Y.stackIcon(s)}<span>${esc(s)}</span></span>`).join("");
  function paintItem(el, p, H) {
    for (const m of $$(".pj-mk", el)) m.classList.toggle("is-match", m.dataset.mk === "status" ? H.status(p) : H.type(p));
    for (const b of $$(".ystk[data-yf^='stack:']", el)) b.classList.toggle("is-match", H.stack(b.dataset.yf.slice(6)));
    const cs = $(".pj-card__stack", el);
    if (cs) { const h = D.stackHTML(p.stack, { max: 4, hits: H }); if (cs._h !== h) { cs.innerHTML = h; cs._h = h; } }
    const hs = $(".pj-hits", el);
    if (hs) { const h = hitsHTML(p, H); if (hs._h !== h) { hs.innerHTML = h; hs._h = h; hs.hidden = !h; } }
  }
  function paintMatches() {
    const H = hits();
    for (const el of $$(".ygroup__item, .ytl__item", body)) { const p = BY[el.dataset.key]; if (p && !("yioGhost" in el.dataset)) paintItem(el, p, H); }
    const st = $("#pj-stage");
    if (st && sel && BY[sel]) paintItem(st, BY[sel], H);
  }

  /* ============================================================
     MARKUP
     ============================================================ */
  const emptyHTML = `<div class="pj-empty" hidden><p><b>No projects match.</b> Try fewer filters.</p><button type="button" class="btn btn--sm" data-reset><i class="ph-bold ph-arrow-counter-clockwise" aria-hidden="true"></i>Clear filters</button></div>`;
  const wuBadge = `<span class="pj-wu meta" title="Has a write-up on Thoughts"><i class="ph-bold ph-scroll" aria-hidden="true"></i>write-up</span>`;
  const quickLinks = (p) =>
    (p.github && p.github !== p.view ? Y.linkIcon("github", p.github, `${p.name} on GitHub`) : "") +
    (p.view ? Y.linkIcon("view", p.view, `${D.viewLabel(p)}: ${p.name}`) : "");
  // the element that opens a grid card: a disclosure button (in place) or a link (its own page)
  const opener = (p, cls, inner) => OPT.open === "page"
    ? `<a class="${cls}" href="${esc(D.pageHref(p))}" data-nav="${p.slug}">${inner}</a>`
    : `<button type="button" class="${cls}" data-open="${p.slug}" aria-expanded="false">${inner}</button>`;

  // desktop timeline row (selected = rope + yarn ball: the timeline keeps its selected state)
  const rowHTML = (p) => { const H = hits(); return `<button type="button" class="yrow ylift ysel pj-row" data-slug="${p.slug}" aria-current="false" aria-controls="pj-stage">
      ${D.thumbHTML(p)}
      <span class="pj-row__txt"><span class="pj-row__name">${esc(p.name)}</span>${D.metaHTML(p, { hits: H })}<span class="pj-hits"${hitsHTML(p, H) ? "" : " hidden"}>${hitsHTML(p, H)}</span></span>
      ${p.hasWriteup ? `<span class="pj-row__wu" title="Has a write-up"><i class="ph-bold ph-scroll" aria-hidden="true"></i><span class="sr-only">, has a write-up</span></span>` : ""}
    </button>`; };
  // phone row: a link to the project's own page
  const mrowHTML = (p) => { const H = hits(); return `<a class="yrow ylift pj-mrow" href="${esc(D.pageHref(p))}" data-nav="${p.slug}">
      ${D.thumbHTML(p, "pj-thumb--m")}
      <span class="pj-row__txt"><span class="pj-row__name">${esc(p.name)}</span>${D.metaHTML(p, { compact: true, hits: H })}<span class="pj-hits"${hitsHTML(p, H) ? "" : " hidden"}>${hitsHTML(p, H)}</span></span>
      <i class="ph-bold ph-caret-right pj-mrow__go" aria-hidden="true"></i>
    </a>`; };
  // grid card: info first (title, badges, description, stack, quick links), image beside/above when there is one.
  // No rope: in the grid an item is open or it isn't (owner, Projects 2.3).
  const cardHTML = (p) => { const H = hits(); return `<article class="ycard ylift pj-card ${p.preview ? "has-media" : "is-text"}">
      <div class="pj-card__main">
        <h3 class="pj-card__title">${opener(p, "pj-card__open", esc(p.name))}</h3>
        ${D.metaHTML(p, { hits: H })}
        <p class="pj-card__desc">${esc(p.text)}</p>
      </div>
      ${p.preview ? `<div class="pj-card__media">${D.thumbHTML(p, "pj-thumb--card")}</div>` : ""}
      <footer class="pj-card__foot"><div class="pj-card__stack">${D.stackHTML(p.stack, { max: 4, hits: H })}</div><span class="pj-card__links">${p.hasWriteup ? wuBadge : ""}${quickLinks(p)}</span></footer>
    </article>`; };
  // opened grid card: the kit detail shell on the white card material (.ypanel)
  const panelHTML = (p) => `<section class="ypanel pj-panel" aria-label="${esc(p.name)}">${D.detailHTML(p, { actions: D.act.page(p) + D.act.copy(p) + D.act.close(p), level: 3, hits: hits() })}</section>`;

  /* ============================================================
     RENDER
     ============================================================ */
  let mode = null, tl = null, sel = null, stageAnim = null;
  const itemEl = (slug) => $$(".ygroup__item, .ytl__item", body).find((el) => el.dataset.key === slug && !("yioGhost" in el.dataset)) || null;
  const firstVisible = () => PJ.find(visible)?.slug || null;

  function renderHead() {
    headEl.innerHTML = Y.header({
      title: "Projects",
      actions: isDesk() ? Y.seg([{ value: "list", label: "Timeline", icon: "ph-rows" }, { value: "grid", label: "Grid", icon: "ph-squares-four" }], { value: OPT.view, label: "Layout", name: "layout" }) : "",
    });
  }

  // GRID · open in place: the kit's Yarn.openInPlace (Music uses the same)
  // where an opened item settles: just under its group's sticky year pill, so both stay readable
  function settleY(el) {
    const pill = el.closest(".ygroup")?.querySelector(":scope > .yyear");
    const under = pill ? 10 + pill.offsetHeight + 14 : 18;
    const y = el.getBoundingClientRect().top + scrollY - stickyTop() - under;
    return Math.max(0, Math.min(y, document.documentElement.scrollHeight - innerHeight));
  }
  const io = Y.openInPlace(body, {
    cell: ".ygroup__item", flipSel: "[data-key]",
    closed: (k) => cardHTML(BY[k]), opened: (k) => panelHTML(BY[k]),
    settle: settleY, top: () => stickyTop() + 64,
    onOpen(cell, k, { instant }) {
      const t = $(".ydetail__title", cell);
      if (t && !instant) { t.tabIndex = -1; t.focus({ preventScroll: true }); }
      if (!instant) Y.sound("open", { el: cell });
      setParam("p", k);
    },
    onClose(cell) {
      Y.sound("close", { el: cell });
      $("[data-open]", cell)?.focus({ preventScroll: true });
      setParam("p", null);
    },
  });

  function build() {
    tl?.destroy(); tl = null;
    io.reset();
    mode = modeNow();
    pj.dataset.mode = mode;
    const groups = Y.byYear(PJ);
    if (mode === "list") {
      body.innerHTML = `<div class="pj-list">
          <div class="pj-tl">${Y.timelineHTML(groups, rowHTML, { key: keyOf, unit: "project", id: "pjy", rule: true, pillKeys: true })}${emptyHTML}</div>
          <div class="pj-stagewrap"><aside class="pj-stage ypanel" id="pj-stage" aria-label="Selected project" tabindex="-1"></aside></div>
        </div>`;
      tl = Y.timeline($(".ytl", body), { ball: true, trail: true });
    } else if (mode === "grid") {
      body.innerHTML = `<div class="pj-grid pj-grid--${OPT.gimg} pj-grid--${OPT.open}">${Y.yearGroupsHTML(groups, cardHTML, { key: keyOf, unit: "project", id: "pjg", grid: true })}${emptyHTML}</div>`;
    } else {
      body.innerHTML = `<div class="pj-mlist">${Y.yearGroupsHTML(groups, mrowHTML, { key: keyOf, unit: "project", id: "pjm" })}${emptyHTML}</div>`;
    }
    applyVisibility();
    if (mode === "list") selectList(sel && visible(BY[sel]) ? sel : firstVisible(), { from: "init" });
  }
  function render({ animate = false } = {}) {
    if (animate && !RM()) Y.flip(body, "[data-key]", build, { stagger: 10 });
    else build();
    if (mode === "list") wireIntent();
  }

  /* ---------- filtering: the kit flip, interruptible (survivors glide from where they are on screen) ---------- */
  function applyVisibility() {
    const n = Y.filterGroups(body, (k) => visible(BY[k]), { unit: "project" });
    paintMatches();
    const empty = $(".pj-empty", body);
    if (empty) empty.hidden = n > 0;
    tools.paint();
    return n;
  }
  let liveT = 0;
  F.on(() => {
    let n = 0, drop = false;
    Y.flip(body, "[data-key]", () => {
      n = applyVisibility();
      if (mode === "list") {
        if (!sel || !visible(BY[sel])) selectList(firstVisible(), { from: "filter" });
        else tl?.refresh({ instant: false });
      } else if (io.current && !visible(BY[io.current])) drop = true;
    });
    // the open item was filtered away: it fades out as a flip ghost; swap it back to its card quietly
    if (drop) { io.collapse(); setParam("p", null); }
    clearTimeout(liveT);
    liveT = setTimeout(() => { live.textContent = n ? `${n} of ${N} projects shown` : "No projects match"; }, 400);
  });

  /* ============================================================
     DESKTOP TIMELINE: select → stage
     ============================================================ */
  const visibleRows = () => $$(".pj-row", body).filter((r) => !r.closest("[hidden]"));
  function selectList(slug, { from = "click" } = {}) {
    const stage = $("#pj-stage");
    if (!stage) return;
    const prev = sel;
    sel = slug;
    for (const b of $$(".pj-row", body)) b.setAttribute("aria-current", String(b.dataset.slug === slug));
    tl?.select(slug, { instant: from === "init" });
    const p = BY[slug];
    if (!p) { stage.innerHTML = `<p class="pj-stage__none muted">Nothing to show. <button type="button" class="ylinkbtn" data-reset>Clear filters</button></p>`; return; }
    if (prev === slug && from !== "init" && stage.querySelector(".ydetail")) return;
    stageAnim?.cancel();
    stage.innerHTML = D.detailHTML(p, { actions: D.act.page(p) + D.act.copy(p), level: 2, hits: hits() });
    stage.scrollTop = 0;
    if (prev && prev !== slug && !RM() && from !== "init") {
      const dir = PJ.indexOf(BY[slug]) > PJ.indexOf(BY[prev]) ? 1 : -1;
      const sp = Y.springEasing({ response: 0.36 });
      stageAnim = stage.firstElementChild.animate([{ opacity: 0, transform: `translateY(${dir * 14}px)` }, { opacity: 1, transform: "none" }], { duration: sp.duration, easing: sp.easing });
    }
    if (from === "click") Y.sound("open", { el: $(`.pj-row[data-slug="${slug}"]`, body) });
    if (from !== "init") setParam("p", slug);
  }
  // hover with intent: select once the pointer rests on a row (never while flicking past or scrolling)
  let intentWired = false;
  function wireIntent() {
    if (OPT.hover !== "intent" || intentWired) return;
    intentWired = true;
    let timer = 0, lx = 0, ly = 0, lt = 0, scrollT = 0, target = null;
    addEventListener("scroll", () => { scrollT = performance.now(); clearTimeout(timer); timer = 0; }, { passive: true });
    body.addEventListener("pointermove", (e) => {
      if (mode !== "list" || e.pointerType !== "mouse") return;
      const now = performance.now();
      const v = Math.hypot(e.clientX - lx, e.clientY - ly) / Math.max(8, now - lt); // px per ms
      lx = e.clientX; ly = e.clientY; lt = now;
      const row = e.target.closest?.(".pj-row");
      if (row !== target || v > 0.3) { clearTimeout(timer); timer = 0; target = row; }
      if (!row || row.dataset.slug === sel || timer) return;
      timer = setTimeout(() => {
        timer = 0;
        if (performance.now() - scrollT < 200 || target !== row || !row.matches(":hover")) return;
        selectList(row.dataset.slug, { from: "intent" });
      }, 230);
    });
    body.addEventListener("pointerleave", () => { clearTimeout(timer); timer = 0; target = null; });
  }

  /* ============================================================
     EVENTS
     ============================================================ */
  body.addEventListener("click", (e) => {
    if (e.target.closest("[data-reset]")) { F.clear(); Y.sound("chip-off"); return; }
    if (e.target.closest("[data-close]")) { io.close(); return; }
    const row = e.target.closest(".pj-row");
    if (row) { selectList(row.dataset.slug); return; }
    const op = e.target.closest("[data-open]");
    if (op) { e.preventDefault(); io.toggle(op.dataset.open); return; }
    const nav = e.target.closest("[data-nav]");
    if (nav && !(e.metaKey || e.ctrlKey || e.shiftKey)) Y.sound("open", { el: nav });
  });
  document.addEventListener("ychange", (e) => {
    if (e.detail.name !== "layout") return;
    OPT.view = e.detail.value;
    setParam("view", OPT.view === "list" ? null : OPT.view);
    setParam("p", OPT.view === "list" ? sel : null);
    render({ animate: true });
  });
  document.addEventListener("keydown", (e) => {
    if (Y.lightbox?.isOpen || e.defaultPrevented) return;
    if (e.key === "Escape") {
      if (tools.fab?.isOpen) { tools.fab.close({ focus: true }); return; }
      if (io.current && !e.target.closest?.(".ybrowse, .ysearch")) { e.preventDefault(); io.close(); }
      return;
    }
    if (mode !== "list" || e.metaKey || e.ctrlKey || e.altKey) return;
    const jump = e.key === "Home" ? -Infinity : e.key === "End" ? Infinity : 0;
    const dir = jump || (e.key === "ArrowDown" || e.key === "j" ? 1 : e.key === "ArrowUp" || e.key === "k" ? -1 : 0);
    if (!dir) return;
    const t = e.target;
    if (t.closest?.("input, textarea, select, [contenteditable='true'], .ybrowse, .ycar")) return;
    if (!(t === document.body || t.closest?.(".pj-tl, .pj-stage"))) return;
    e.preventDefault();
    const rows = visibleRows();
    const i = rows.findIndex((r) => r.dataset.slug === sel);
    const next = rows[Math.max(0, Math.min(rows.length - 1, jump ? (jump > 0 ? rows.length - 1 : 0) : i + dir))];
    if (!next || next.dataset.slug === sel) return;
    next.focus({ preventScroll: true });
    // keep the row clear of the sticky year pill on top and the player at the bottom
    const r = next.getBoundingClientRect(), topRoom = 70, botRoom = Y.px("--bottom-ui") + 16;
    const dy = r.top < topRoom ? r.top - topRoom : r.bottom > innerHeight - botRoom ? r.bottom - (innerHeight - botRoom) : 0;
    if (dy) window.scrollBy({ top: dy, behavior: RM() || jump ? "auto" : "smooth" });
    selectList(next.dataset.slug, { from: "key" });
  });

  /* ============================================================
     BOOT
     ============================================================ */
  function boot() {
    renderHead();
    placeChrome();
    const want = BY[P.get("p")] ? P.get("p") : null, focus = BY[P.get("focus")] ? P.get("focus") : null;
    if (want || focus) sel = want || focus;
    render();
    if (want && mode === "grid" && OPT.open === "inline" && visible(BY[want])) io.open(want, { instant: true });
    else if ((focus || want) && mode !== "list") {
      // back from an item page (or a ?p= link on a phone): the project is in view and focused
      const el = itemEl(focus || want);
      el?.scrollIntoView({ block: "center" });
      $("[data-open], [data-nav]", el || document.createElement("i"))?.focus({ preventScroll: true });
      if (want) setParam("p", null);
    }
    if (focus) setParam("focus", null);
  }
  desk.addEventListener("change", () => { renderHead(); placeChrome(); render(); });
  boot();

  Y.mockPanel([
    { label: "Desktop layout", param: "view", options: [["list", "Timeline + stage"], ["grid", "Grid by year"]], default: "list" },
    { label: "Grid: open an item", param: "open", options: [["inline", "In place"], ["page", "Its own page"]], default: "inline" },
    { label: "Grid: image", param: "gimg", options: [["side", "Beside text"], ["top", "On top"]], default: "side" },
    { label: "Timeline: select on", param: "hover", options: [["click", "Click"], ["intent", "Hover (intent)"]], default: "click" },
    { label: "Phone filters (msearch=bar)", param: "mf", options: [["wrap", "Two lines, no scroll"], ["scroll", "One line, scrolls"]], default: "wrap" },
    { label: "State: item", param: "p", options: [["", "None"], ["blaqat-net-this-site", "blaqat.net"], ["sonata", "Sonata"], ["forth-evaluator", "Forth (write-up)"], ["fishbowl-ai-assistant", "Fishbowl (no links)"]], default: "" },
    { label: "State: search FAB (phones)", param: "fab", options: [["", "Closed"], ["open", "Open"]], default: "" },
  ], { title: "Projects options" });
})();
