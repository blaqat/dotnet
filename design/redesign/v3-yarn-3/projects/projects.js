/* ============================================================
   projects/projects.js · Projects page, iteration 2 (mock-only)
   Built on the kit (Yarn.*) + projects/pj-core.js (window.PJ).

   Desktop  ?view=list   timeline (year pills, yarn ball on the selected
                         project) + sticky stage (kit detail shell)
            ?view=grid   2-column info cards; open = expands in place
   Mobile   ?m=list      single-column timeline, tap opens in place
            ?m=cards     vertical card pager (one project per screen)
   Options  ?hover=click|intent  ?gimg=side|top  ?open=inline|page  ?mf=wrap|scroll
            mobile search/filters = the kit option ?msearch=bar|fab (Yarn.listTools)
   State    ?p=<slug> open/select · ?focus=<slug> (back from item page)
            ?fab=open · kit: ?lb=pj-<slug>:<i>, ?browse=open, filters
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
    hover: pick("hover", ["click", "intent"], "click"),
    gimg: pick("gimg", ["side", "top"], "side"),
    open: pick("open", ["inline", "page"], "inline"),
    m: pick("m", ["list", "cards"], "list"),
    mf: pick("mf", ["wrap", "scroll"], "wrap"),
  };
  const PJ = D.list, BY = D.bySlug, N = PJ.length;
  const desk = matchMedia("(min-width: 960px)");
  const isDesk = () => desk.matches;
  const modeNow = () => (isDesk() ? OPT.view : OPT.m === "cards" ? "cards" : "mlist");

  const pj = $("#pj"), headEl = $("#pj-head"), topEl = $("#pj-top"), body = $("#pj-body"), live = $("#pj-live");

  function setParam(k, v) {
    const u = new URL(location.href);
    v == null || v === "" ? u.searchParams.delete(k) : u.searchParams.set(k, v);
    history.replaceState(history.state, "", u);
  }
  const visible = (p) => F.test(p);
  const bottomUI = () => Y.px("--bottom-ui"); // a calc() token: the kit measures it
  const stickyTop = () => parseFloat(getComputedStyle(body).getPropertyValue("--sticky-top")) || 0;

  /* ============================================================
     FILTERS: kit model + search line + filter row (Show all, type | status; stack in Browse)
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
  const row = Y.filterRow(rowHost, F, { all: "Show all", browse: true });
  Y.search(searchHost, F, { placeholder: "Search projects… try “python”", hint: matchMedia("(pointer: fine)").matches });
  // one mobile pattern for every list page (kit ?msearch=bar|fab): top search + sticky filter row, or the search FAB
  const tools = Y.listTools(F, {
    tools: topEl, search: searchHost, row: rowHost, sticky: body,
    label: "Search and filter projects", title: "Find a project",
    count: () => `${PJ.filter(visible).length} of ${N} shown`,
  });
  const FAB = { close: (o) => tools.fab?.close(o), away: (on) => tools.fab?.away(on), get isOpen() { return !!tools.fab?.isOpen; } };

  function placeChrome() {
    const d = isDesk();
    rowHost.classList.toggle("yfilter--wrap", !d && OPT.mf === "wrap"); // kit option (filterRow({ wrap }))
    tools.place();
    // the pager never scrolls the page, so its row doesn't stick
    if (modeNow() === "cards" && rowHost.classList.contains("yfilter--sticky")) { rowHost.classList.remove("yfilter--sticky", "is-stuck"); body.style.removeProperty("--sticky-top"); }
    topEl.classList.add("ytools");
    pj.classList.toggle("pj--fab", tools.isFab());
  }

  /* ============================================================
     MARKUP
     ============================================================ */
  const emptyHTML = `<div class="pj-empty" hidden><p><b>No projects match.</b> Try fewer filters.</p><button type="button" class="btn btn--sm" data-reset><i class="ph-bold ph-arrow-counter-clockwise" aria-hidden="true"></i>Show all</button></div>`;
  const wuBadge = `<span class="pj-wu meta" title="Has a write-up on Thoughts"><i class="ph-bold ph-scroll" aria-hidden="true"></i>write-up</span>`;
  const quickLinks = (p) =>
    (p.github && p.github !== p.view ? Y.linkIcon("github", p.github, `${p.name} on GitHub`) : "") +
    (p.view ? Y.linkIcon("view", p.view, `${D.viewLabel(p)}: ${p.name}`) : "");
  // the element that opens an item: a disclosure button (in place) or a link (as a page)
  const opener = (p, cls, inner, extra = "") => OPT.open === "page"
    ? `<a class="${cls}" href="${esc(D.pageHref(p))}" data-nav="${p.slug}" ${extra}>${inner}</a>`
    : `<button type="button" class="${cls}" data-open="${p.slug}" aria-expanded="false" ${extra}>${inner}</button>`;

  // desktop timeline row (closed state: preview + name + meta)
  const rowHTML = (p) => `<button type="button" class="yrow ylift ysel pj-row" data-slug="${p.slug}" aria-current="false" aria-controls="pj-stage">
      ${D.thumbHTML(p)}
      <span class="pj-row__txt"><span class="pj-row__name">${esc(p.name)}</span>${Y.meta(p)}</span>
      ${p.hasWriteup ? `<span class="pj-row__wu" title="Has a write-up"><i class="ph-bold ph-scroll" aria-hidden="true"></i><span class="sr-only">, has a write-up</span></span>` : ""}
    </button>`;
  // mobile timeline row
  const mrowHTML = (p) => opener(p, "yrow ylift ysel pj-mrow",
    `${D.thumbHTML(p, "pj-thumb--m")}<span class="pj-row__txt"><span class="pj-row__name">${esc(p.name)}</span>${Y.meta(p, { compact: true })}</span>`,
    `aria-current="false"${OPT.open === "inline" ? ` aria-controls="pjm-panel-${p.slug}"` : ""}`);
  // grid card: info first (title, badges, description, stack, quick links), image beside/above when there is one
  // grid: one continuous flow (no row break per year, so odd counts leave no holes). The first card of each year
  // carries the kit year pill on its top edge; applyVisibility() moves it when filtering changes which card is first.
  const cardYear = (p) => `<span class="pj-cyear" data-cyear="${p.year}" hidden>${Y.yearPill(p.year, { count: 0, unit: "project", level: 2 })}</span>`;
  const cardHTML = (p) => `<article class="ycard ylift ysel pj-card ${p.preview ? "has-media" : "is-text"}" data-key="${p.slug}" aria-current="${p.slug === lastSel}">
      <div class="pj-card__main">
        <h3 class="pj-card__title">${opener(p, "pj-card__open", esc(p.name))}</h3>
        ${Y.meta(p)}
        <p class="pj-card__desc">${esc(p.text)}</p>
      </div>
      ${p.preview ? `<div class="pj-card__media">${D.thumbHTML(p, "pj-thumb--card")}</div>` : ""}
      ${cardYear(p)}
      <footer class="pj-card__foot">${Y.stack(p.stack, { max: 4 })}<span class="pj-card__links">${p.hasWriteup ? wuBadge : ""}${quickLinks(p)}</span></footer>
    </article>`;
  // mobile pager card: one project per screen
  const pcardHTML = (p) => `<article class="ycard pj-pcard ${p.preview ? "has-media" : "is-text"}" data-key="${p.slug}" aria-labelledby="pc-${p.slug}">
      <div class="pj-pcard__top"><span class="yyear pj-pcard__year">${p.year}</span><span class="meta pj-pcard__n"></span></div>
      ${p.preview ? `<div class="pj-pcard__media">${D.thumbHTML(p, "pj-thumb--hero")}</div>` : ""}
      <h2 class="pj-pcard__title" id="pc-${p.slug}">${opener(p, "pj-card__open", esc(p.name))}</h2>
      ${Y.meta(p)}
      ${Y.stack(p.stack, { max: 5 })}
      <div class="pj-pcard__text">${p.tagline ? `<p class="pj-lead">${D.inline(p.tagline)}</p>` : ""}${p.summaryHTML}</div>
      <footer class="pj-pcard__foot"><span class="btn btn--ink btn--sm pj-pcard__more" aria-hidden="true">Details<i class="ph-bold ph-arrow-${OPT.open === "page" ? "right" : "down"}"></i></span>${p.hasWriteup ? wuBadge : ""}<span class="pj-card__links">${quickLinks(p)}</span></footer>
    </article>`;
  // opened item (grid / mobile list / pager): kit detail shell in a cotton panel
  const panelHTML = (p, kind) => `<section class="pj-panel pj-panel--${kind}" id="pjm-panel-${p.slug}"${kind !== "mlist" ? ` data-key="${p.slug}"` : ""} aria-label="${esc(p.name)}">
      ${kind === "grid" ? cardYear(p) : ""}${D.detailHTML(p, { actions: D.act.page(p) + D.act.copy(p) + D.act.close(p), level: kind === "cards" ? 2 : 3 })}</section>`;

  // year pills take part in FLIP + know their group
  function keyPills() {
    for (const g of $$(".ytl__group, .pj-ygroup", body)) {
      const pill = $(".yyear", g);
      const y = (pill?.textContent.match(/\d{4}/) || [])[0];
      if (!y) continue;
      g.dataset.year = y;
      pill.dataset.key = `y-${y}`;
    }
  }

  /* ============================================================
     RENDER
     ============================================================ */
  let mode = null, tl = null, sel = null, openKey = null, lastSel = null, stageAnim = null;

  function renderHead() {
    headEl.innerHTML = Y.header({
      title: "Projects",
      // no subtext (owner: "just title, search bar, show all, type tags | status tags"); meta is an optional kit slot
      actions: isDesk() ? Y.seg([{ value: "list", label: "Timeline", icon: "ph-rows" }, { value: "grid", label: "Grid", icon: "ph-squares-four" }], { value: OPT.view, label: "Layout", name: "layout" }) : "",
    });
  }

  function build() {
    tl?.destroy(); tl = null;
    openKey = null;
    reading();
    mode = modeNow();
    pj.dataset.mode = mode;
    const groups = Y.byYear(PJ);
    if (mode === "list") {
      body.innerHTML = `<div class="pj-list">
          <div class="pj-tl">${Y.timelineHTML(groups, rowHTML, { key: (p) => p.slug, unit: "project", id: "pjy" })}${emptyHTML}</div>
          <div class="pj-stagewrap"><aside class="pj-stage" id="pj-stage" aria-label="Selected project" tabindex="-1"></aside></div>
        </div>`;
      tl = Y.timeline($(".ytl", body), { ball: true, trail: true });
    } else if (mode === "grid") {
      body.innerHTML = `<div class="pj-grid pj-grid--${OPT.gimg}"><div class="pj-cards">${PJ.map(cardHTML).join("")}</div>${emptyHTML}</div>`;
    } else if (mode === "mlist") {
      body.innerHTML = `<div class="pj-mtl">${Y.timelineHTML(groups, mrowHTML, { key: (p) => p.slug, unit: "project", id: "pjm" })}${emptyHTML}</div>`;
      tl = Y.timeline($(".ytl", body), { ball: true, trail: true });
    } else {
      body.innerHTML = `<div class="pj-pager" id="pj-pager" tabindex="0" aria-label="Projects, one per screen">${PJ.map(pcardHTML).join("")}${emptyHTML}</div>`;
    }
    keyPills();
    applyVisibility();
    if (mode === "list") selectList(sel && visible(BY[sel]) ? sel : firstVisible(), { from: "init" });
    else if (lastSel) markSelected(lastSel);
  }
  function render({ animate = false } = {}) {
    if (animate && !RM()) Y.flip(body, "[data-key]", build, { stagger: 10 });
    else build();
    if (mode === "list") { wireIntent(); fitStage(); }
    if (mode === "cards") sizePager();
  }
  const firstVisible = () => PJ.find(visible)?.slug || null;

  /* ---------- filtering (FLIP: survivors glide, others grow in / fade out) ---------- */
  function applyVisibility() {
    let n = 0;
    const perYear = {};
    for (const el of $$("[data-key]", body)) {
      const p = BY[el.dataset.key];
      if (!p) continue;
      const on = visible(p);
      el.hidden = !on;
      if (on) { n++; perYear[p.year] = (perYear[p.year] || 0) + 1; }
    }
    for (const g of $$("[data-year]", body)) {
      const c = perYear[g.dataset.year] || 0;
      g.hidden = !c;
      const t = $(".yyear__n", g);
      if (t) t.textContent = `${c} project${c === 1 ? "" : "s"}`;
    }
    // grid: the year pill rides on the first visible card (or opened panel) of each year
    const seen = new Set();
    for (const el of $$(".pj-cards > [data-key]", body)) {
      const pill = $(":scope > .pj-cyear", el);
      if (!pill) continue;
      const y = +pill.dataset.cyear, first = !el.hidden && !seen.has(y);
      if (!el.hidden) seen.add(y);
      pill.hidden = !first;
      const t = $(".yyear__n", pill);
      if (t) t.textContent = `${perYear[y] || 0} project${perYear[y] === 1 ? "" : "s"}`;
    }
    const empty = $(".pj-empty", body);
    if (empty) empty.hidden = n > 0;
    // pager counters
    if (mode === "cards") { let i = 0; for (const c of $$(".pj-pcard:not([hidden])", body)) c.querySelector(".pj-pcard__n").textContent = `${++i} / ${n}`; }
    const total = `${n} of ${N} project${N === 1 ? "" : "s"}`;
    tools.paint();
    return n;
  }
  let liveT = 0;
  F.on(() => {
    Y.flip(body, "[data-key]", () => {
      const n = applyVisibility();
      if (mode === "list") {
        if (!sel || !visible(BY[sel])) selectList(firstVisible(), { from: "filter" });
        else tl?.refresh();
      } else {
        if (openKey && !visible(BY[openKey])) collapse(openKey);
        if (mode === "mlist") tl?.select(lastSel && visible(BY[lastSel]) ? lastSel : null, { instant: true });
        if (mode === "cards") { const pg = $("#pj-pager"); if (pg) pg.scrollTop = 0; }
      }
      clearTimeout(liveT);
      liveT = setTimeout(() => { live.textContent = n ? `${n} of ${N} projects shown` : "No projects match"; }, 400);
    });
  });

  /* ============================================================
     DESKTOP LIST: timeline + stage
     ============================================================ */
  const visibleRows = () => $$(".pj-row", body).filter((r) => !r.closest("[hidden]"));
  function selectList(slug, { from = "click" } = {}) {
    const stage = $("#pj-stage");
    if (!stage) return;
    const prev = sel;
    sel = slug;
    for (const b of $$(".pj-row", body)) b.setAttribute("aria-current", String(b.dataset.slug === slug));
    tl?.select(slug, { instant: from === "init" || from === "filter" });
    const p = BY[slug];
    if (!p) { stage.innerHTML = `<p class="pj-stage__none muted">Nothing to show. <button type="button" class="ylinkbtn" data-reset>Show all projects</button></p>`; return; }
    if (prev === slug && from !== "init" && stage.firstElementChild) return;
    stageAnim?.cancel();
    stage.innerHTML = D.detailHTML(p, { actions: D.act.page(p) + D.act.copy(p), level: 2 });
    stage.scrollTop = 0;
    if (prev && prev !== slug && !RM() && from !== "init") {
      const dir = PJ.indexOf(BY[slug]) > PJ.indexOf(BY[prev]) ? 1 : -1;
      const sp = Y.springEasing({ response: 0.38 });
      stageAnim = stage.firstElementChild.animate([{ opacity: 0, transform: `translateY(${dir * 16}px)` }, { opacity: 1, transform: "none" }], { duration: sp.duration, easing: sp.easing });
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
     OPEN IN PLACE (grid · mobile list · pager)
     scroll goes straight to where the item settles; FLIP animates from
     the old on-screen spots, the panel grows out of its card (clip)
     ============================================================ */
  const itemEl = (slug) => body.querySelector(`[data-key="${CSS.escape(slug)}"]`);
  function markSelected(slug) {
    lastSel = slug;
    for (const el of $$(".pj-card, .pj-mrow", body)) {
      const k = el.dataset.key || el.closest("[data-key]")?.dataset.key;
      el.setAttribute("aria-current", String(k === slug));
    }
    if (mode === "mlist") tl?.select(slug && visible(BY[slug]) ? slug : null, { instant: true });
  }
  function expand(slug) {
    const p = BY[slug];
    const el = itemEl(slug);
    if (!p || !el) return null;
    let panel;
    if (mode === "mlist") {
      const row = $(".pj-mrow", el);
      row.hidden = true;
      row.setAttribute("aria-expanded", "true");
      el.insertAdjacentHTML("beforeend", panelHTML(p, "mlist"));
      panel = $(".pj-panel", el);
      tl?.select(slug);
    } else {
      el.insertAdjacentHTML("afterend", panelHTML(p, mode));
      panel = el.nextElementSibling;
      el.remove();
      if (mode === "cards") $("#pj-pager")?.classList.add("is-locked");
    }
    openKey = slug;
    lastSel = slug;
    reading();
    return panel;
  }
  function collapse(slug) {
    const p = BY[slug];
    const el = itemEl(slug);
    if (!p || !el) return null;
    let back;
    if (mode === "mlist") {
      $(".pj-panel", el)?.remove();
      back = $(".pj-mrow", el);
      back.hidden = false;
      back.setAttribute("aria-expanded", "false");
    } else {
      el.insertAdjacentHTML("afterend", mode === "grid" ? cardHTML(p) : pcardHTML(p));
      back = el.nextElementSibling;
      el.remove();
      if (mode === "cards") { $("#pj-pager")?.classList.remove("is-locked"); applyVisibility(); }
    }
    if (openKey === slug) openKey = null;
    reading();
    return back;
  }
  function reading() { FAB.away(!!openKey); }
  // where an opened item settles: just under the group's sticky year pill, so both stay readable
  function settleY(el) {
    const pill = el.closest("[data-year]")?.querySelector(":scope > .yyear");
    const under = pill ? 10 + pill.offsetHeight + 12 : 18;
    return Math.max(0, Math.min(el.getBoundingClientRect().top + scrollY - stickyTop() - under, document.documentElement.scrollHeight - innerHeight));
  }
  function settle(el) {
    if (mode === "cards") { const pg = $("#pj-pager"); if (pg) pg.scrollTop = el.offsetTop - pg.offsetTop; return; }
    window.scrollTo({ top: settleY(el), behavior: "instant" });
  }
  // the page scroll rides the same critically damped spring as the panel's growth (response .44), so the item
  // glides to where it settles: no jump, no smooth-then-snap. A wheel / touch / key takes over at once.
  let glide = null;
  function glideTo(y) {
    glide?.stop();
    if (RM() || Math.abs(y - scrollY) < 2) { scrollTo(0, y); return; }
    const from = scrollY;
    const sp = new Y.Spring(0, { response: Y.motion.panel, rest: 0.0005, onUpdate: (t) => scrollTo(0, from + (y - from) * t) });
    glide = sp;
    const stop = () => { sp.stop(); off(); };
    const off = () => { removeEventListener("wheel", stop); removeEventListener("touchstart", stop); removeEventListener("keydown", stop); };
    addEventListener("wheel", stop, { passive: true }); addEventListener("touchstart", stop, { passive: true }); addEventListener("keydown", stop);
    sp.to(1, { onRest: off });
  }
  function reveal(panel, r0) {
    if (!panel || !r0 || RM()) return;
    const w = panel.offsetWidth, h = panel.offsetHeight;
    const r = parseFloat(getComputedStyle(panel).borderTopLeftRadius) || 20;
    const sp = Y.springEasing({ response: Y.motion.panel });
    panel.animate([
      { clipPath: `inset(0px ${Math.max(0, w - r0.width).toFixed(1)}px ${Math.max(0, h - r0.height).toFixed(1)}px 0px round 16px)` },
      { clipPath: `inset(0px 0px 0px 0px round ${r}px)` },
    ], { duration: sp.duration, easing: sp.easing });
    const inner = panel.querySelector(".ydetail");
    inner?.animate([{ opacity: 0.25 }, { opacity: 1 }], { duration: Y.motion.contentMs + 20, easing: "ease-out" });
  }
  function openItem(slug, { instant = false, scroll = true, quiet = false } = {}) {
    const p = BY[slug];
    if (!p || !visible(p)) return;
    if (mode === "list") { selectList(slug, { from: quiet ? "init" : "click" }); return; }
    const src = mode === "mlist" ? $(".pj-mrow", itemEl(slug)) : itemEl(slug);
    const r0 = src?.getBoundingClientRect();
    let panel, target = null;
    const mutate = () => {
      if (openKey && openKey !== slug) collapse(openKey);
      panel = expand(slug);
      markSelected(slug);
      if (!panel || !scroll) return;
      const el = mode === "mlist" ? itemEl(slug) : panel;
      if (instant || RM() || mode === "cards") { settle(el); return; }
      // keep what you tapped under your finger while the item above collapses…
      const dy = el.getBoundingClientRect().top - r0.top;
      if (Math.abs(dy) > 0.5) window.scrollBy({ top: dy, behavior: "instant" });
      // …then glide to where it settles
      target = settleY(el);
    };
    if (instant || RM()) mutate(); else Y.flip(mode === "cards" ? $("#pj-pager") : body, "[data-key]", mutate);
    if (target != null) glideTo(target);
    if (!instant) reveal(panel, r0);
    const t = panel?.querySelector(".ydetail__title");
    if (t && !instant) { t.tabIndex = -1; t.focus({ preventScroll: true }); }
    if (!quiet) Y.sound("open", { el: panel });
    setParam("p", slug);
  }
  function closeOpen({ focus = true } = {}) {
    const slug = openKey;
    if (!slug) return;
    const before = itemEl(slug)?.getBoundingClientRect().top ?? 0;
    let back;
    const mutate = () => {
      back = collapse(slug);
      markSelected(slug);
      if (!back || mode === "cards") return;
      // close back into the card: keep it where the panel started (or bring it into view)
      const top = (mode === "mlist" ? itemEl(slug) : back).getBoundingClientRect().top;
      const want = Math.min(Math.max(before, stickyTop() + 12), innerHeight - 160);
      if (Math.abs(top - want) > 1) window.scrollBy({ top: top - want, behavior: "instant" });
    };
    RM() ? mutate() : Y.flip(mode === "cards" ? $("#pj-pager") : body, "[data-key]", mutate);
    Y.sound("close", { el: back });
    if (focus) (back?.matches("[data-open], [data-nav]") ? back : back?.querySelector("[data-open], [data-nav]"))?.focus({ preventScroll: true });
    setParam("p", null);
  }

  /* ---------- the stage always fits the viewport, so its sticky links bar stays on screen ---------- */
  let fitRaf = 0;
  function fitStage() {
    fitRaf = 0;
    const wrap = $(".pj-stagewrap", body), stage = $("#pj-stage");
    if (!wrap || !stage) return;
    const ui = bottomUI();
    const top = Math.max(18, wrap.getBoundingClientRect().top);
    stage.style.maxHeight = `${Math.max(320, Math.floor(innerHeight - top - 18 - ui))}px`;
  }
  const queueFit = () => { if (mode === "list" && !fitRaf) fitRaf = requestAnimationFrame(fitStage); };
  addEventListener("scroll", queueFit, { passive: true });
  addEventListener("resize", queueFit);

  /* ---------- pager sizing (one project per screen) ---------- */
  function sizePager() {
    const pg = $("#pj-pager");
    if (!pg) return;
    const top = pg.getBoundingClientRect().top + scrollY;
    const ui = bottomUI();
    const h = Math.max(380, Math.round(innerHeight - top - ui - 12));
    pg.style.setProperty("--ph", `${h}px`);
  }
  addEventListener("resize", () => { if (mode === "cards") sizePager(); });

  /* ============================================================
     EVENTS
     ============================================================ */
  body.addEventListener("click", (e) => {
    if (e.target.closest("[data-reset]")) { F.clear(); Y.sound("chip-off"); return; }
    if (e.target.closest("[data-close]")) { closeOpen(); return; }
    const row = e.target.closest(".pj-row");
    if (row) { selectList(row.dataset.slug); return; }
    const op = e.target.closest("[data-open]");
    if (op) { e.preventDefault(); openKey === op.dataset.open ? closeOpen() : openItem(op.dataset.open); return; }
    const nav = e.target.closest("[data-nav]");
    if (nav && !(e.metaKey || e.ctrlKey || e.shiftKey)) Y.sound("open", { el: nav });
  });
  document.addEventListener("ychange", (e) => {
    if (e.detail.name !== "layout") return;
    OPT.view = e.detail.value;
    setParam("view", OPT.view === "list" ? null : OPT.view);
    render({ animate: true });
  });
  document.addEventListener("keydown", (e) => {
    if (Y.lightbox?.isOpen || e.defaultPrevented) return;
    if (e.key === "Escape") {
      if (FAB.isOpen) { FAB.close({ focus: true }); return; }
      if (openKey && !e.target.closest?.(".ybrowse, .ysearch")) { e.preventDefault(); closeOpen(); }
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
    if (!next || next.dataset.slug === sel) { if (jump) e.preventDefault(); return; }
    next.focus({ preventScroll: true });
    // keep the row clear of the sticky year pill on top and the player at the bottom
    const r = next.getBoundingClientRect(), topRoom = 70, botRoom = bottomUI() + 16;
    const dy = r.top < topRoom ? r.top - topRoom : r.bottom > innerHeight - botRoom ? r.bottom - (innerHeight - botRoom) : 0;
    if (dy) window.scrollBy({ top: dy, behavior: RM() || jump ? "auto" : "smooth" });
    selectList(next.dataset.slug, { from: "key" });
  });

  /* ============================================================
     SEARCH FAB (mobile): the kit's Yarn.fab (above the nav, overlapping it a
     little; grows into a full-width panel from the button). Esc, outside tap,
     Done and the on-screen keyboard are handled by the kit.
     ============================================================ */

  /* ============================================================
     BOOT
     ============================================================ */
  function boot() {
    renderHead();
    placeChrome();
    const want = P.get("p"), focus = P.get("focus");
    if (BY[want]) { sel = want; lastSel = want; }
    else if (BY[focus]) { sel = focus; lastSel = focus; }
    render();
    if (BY[want] && mode !== "list") openItem(want, { instant: true, quiet: true });
    else if (BY[focus] && mode !== "list") {
      const el = itemEl(focus);
      if (mode === "cards") settle(el);
      else el?.scrollIntoView({ block: "center" });
      (el?.matches("[data-open], [data-nav]") ? el : el?.querySelector("[data-open], [data-nav]"))?.focus({ preventScroll: true });
    }
    if (BY[focus]) setParam("focus", null);
  }
  desk.addEventListener("change", () => { renderHead(); placeChrome(); render(); });
  boot();

  Y.mockPanel([
    { label: "Desktop layout", param: "view", options: [["list", "Timeline + stage"], ["grid", "2-col grid"]], default: "list" },
    { label: "Timeline: select on", param: "hover", options: [["click", "Click"], ["intent", "Hover (intent)"]], default: "click" },
    { label: "Grid: image", param: "gimg", options: [["side", "Beside text"], ["top", "On top"]], default: "side" },
    { label: "Open an item", param: "open", options: [["inline", "In place"], ["page", "As a page"]], default: "inline" },
    { label: "Mobile layout", param: "m", options: [["list", "Timeline list"], ["cards", "Card pager"]], default: "list" },
    { label: "Mobile filters", param: "mf", options: [["wrap", "Two lines, no scroll"], ["scroll", "One line, scrolls"]], default: "wrap" },
    { label: "State: item", param: "p", options: [["", "None"], ["blaqat-net-this-site", "blaqat.net"], ["sonata", "Sonata"], ["forth-evaluator", "Forth (write-up)"], ["fishbowl-ai-assistant", "Fishbowl (no media)"]], default: "" },
    { label: "State: search FAB (msearch=fab)", param: "fab", options: [["", "Closed"], ["open", "Open"]], default: "" },
  ], { title: "Projects options" });
})();
