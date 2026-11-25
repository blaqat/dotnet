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
   i5 (decided) the grid opens items on their own page (G6: ?open=page default; inline stays one click away)
   i6 (decided) ?ptype=color · ?ongoing=badge (ribbon → Earlier) · ?passed=ring · ?tlstack=on
   i7 (decided, kit) ?cardmeta=facts (O1, Yarn.cardMeta) · ?gridyears=fold (P4, Yarn.gridYears)
   i6 P2: the stack line in timeline + grid cards is hashtags (Yarn.stackTags): a tap filters, a tap on an active one clears.
      (i7 P1: in the timeline they're display-only now)
      The timeline row is a div with its name as the button (.pj-row__open), so the tags can be buttons too.
   i6 P3: one empty state (the stage steps away when nothing matches)
   i7 P1: the timeline row's tags are display-only (grid cards + the opened item keep buttons) · P2 ?statusdate=apart|joined
      · P3 ?cardfacts=words|icons (both Open, pj-core.js → Yarn.cardMeta / Yarn.fact.statusDate)
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
    open: pick("open", ["inline", "page"], "page"), // i5 (G6, owner): items open on their own page; inline = Earlier
    hover: pick("hover", ["click", "intent"], "click"),
    gimg: pick("gimg", ["side", "top"], "side"),
    mf: pick("mf", ["wrap", "scroll"], "wrap"),
    passed: pick("passed", ["ring", "dot"], "ring"),
    tlstack: pick("tlstack", ["on", "off"], "on"),
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
    topEl.classList.add("ytools", "ytools--line"); // i7 · C1: the kit's one-line list top (was this page's CSS)
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
  // phone rows don't list their stack, so a matching stack shows up in the row as a marked (static) hashtag
  const hitsHTML = (p, H) => { const m = p.stack.filter(H.stack); return m.length ? Y.stackTags(m, { as: "span", tag: "span", match: new Set(m), label: "Matching stack" }) : ""; };
  // i5 · layout · the opened item (stage / opened card): a fact that matches takes the in-card match look; a stack
  // tag that IS an active filter is pressed (the in-card match look, strike on hover/focus), a typed match is marked
  // (the same hashtags as the cards: any [data-yf^="stack:"])
  const pressedStacks = (p) => new Set(p.stack.filter((s) => F.has("stack", s)));
  const isOn = (s) => F.has("stack", s);
  function paintOpen(el, p, H) {
    for (const f of $$(".yfact[data-mk]", el)) f.classList.toggle("is-match", f.dataset.mk === "status" ? H.status(p) : H.type(p));
    for (const b of $$("[data-yf^='stack:']", el)) {
      const s = b.dataset.yf.slice(6), on = F.has("stack", s);
      b.setAttribute("aria-pressed", String(on));
      b.classList.toggle("is-match", !on && H.stack(s));
    }
  }
  function paintItem(el, p, H) {
    for (const m of $$(".ymeta [data-mk]", el)) m.classList.toggle("is-match", m.dataset.mk === "status" ? H.status(p) : H.type(p));
    const cs = $(".pj-card__stack", el);
    if (cs) cs._p = p; // i6 fix (review P2-3): fitStacks writes the card's one stack line too
    const hs = $(".pj-hits", el);
    if (hs) { const h = hitsHTML(p, H); if (hs._h !== h) { hs.innerHTML = h; hs._h = h; hs.hidden = !h; } }
    const ts = $(".pj-row__stack", el);
    if (ts) ts._p = p; // fitStacks writes the line
  }

  /* ============================================================
     P3.2 · TIMELINE STACK LINE: every stack on one line inside the timeline card (active filters and matches first);
     what doesn't fit folds into a quiet "+n". i6 · P2: they're hashtags (Yarn.stackTags, Thoughts' look): a tap
     filters by that stack, a tap on an active one clears it (the kit's [data-yf] toggle). Tag widths are read once per
     stack order + pressed state (they don't depend on the column), then each fit is arithmetic on the column width:
     one pass of reads, one pass of writes, on build / filter / resize / fonts only.
     ============================================================ */
  // i7 · P1 (owner: "i accidentally click a stack tag on the items in the timeline … opened can still have it … its fine on
  // grid"): a timeline row's tags are display-only spans (.is-static: not focusable, no hover, no strike). An active filter
  // or a typed match still shows the in-card match look; a click on a tag is a click on the row (it selects it).
  const tlStackHTML = (order, max = Infinity, H = hits()) => Y.stackTags(order, { as: "span", max, pressed: new Set(order.filter(isOn)), match: new Set(order.filter((s) => !isOn(s) && H.stack(s))) });
  const cardStackHTML = (order, max = Infinity, H = hits()) => Y.stackTags(order, { max, pressed: new Set(order.filter(isOn)), match: new Set(order.filter((s) => !isOn(s) && H.stack(s))) });
  // re-rendering a tag line keeps keyboard focus on the same tag (or the row's name, if it folded into "+n")
  function keepFocus(host, write) {
    const a = document.activeElement, yf = a && host.contains(a) ? a.dataset?.yf : null;
    write();
    if (yf) (host.querySelector(`[data-yf="${CSS.escape(yf)}"]`) || host.closest(".pj-row, .pj-card")?.querySelector(".pj-row__open, .pj-card__open"))?.focus({ preventScroll: true });
  }
  // i6 fix (review P2-3): the grid card's stack is one line too (a long tag no longer wraps and pushes the foot down);
  // what doesn't fit beside the card's links folds into "+n". The gap and the "+n" width are read per kind of line.
  const FITM = {};
  const fitSel = () => (mode === "list" ? (OPT.tlstack === "on" ? ".pj-row__stack" : "") : mode === "grid" ? ".pj-card__stack" : "");
  function fitStacks() {
    const fs = fitSel();
    if (!fs) return;
    const fm = (FITM[fs] ||= { gap: -1, more: 0 });
    let stackGap = fm.gap, moreW = fm.more;
    const ws = $$(fs, body);
    const vis = ws.map((w) => w.getClientRects().length > 0); // read
    const fresh = ws.filter((w, i) => vis[i] && w._p && !w._wmap);
    const asOf = (w) => (w.classList.contains("pj-row__stack") ? { as: "span" } : {}); // i7 · P1: measure what's drawn
    for (const w of fresh) { w.innerHTML = Y.stackTags(w._p.stack, asOf(w)); w._sig = null; } // write: every tag, to measure
    let probe = null;
    if (!moreW && ws.some((w, i) => vis[i])) { probe = document.createElement("span"); probe.className = "ytag ytag--stk ytag--more"; probe.innerHTML = "<span>+8</span>"; probe.style.cssText = "position:absolute;visibility:hidden"; ws[vis.indexOf(true)].appendChild(probe); }
    // read: tag widths (fresh rows: a tag's width is its name's, pressed or not), the "+n", the gap, every visible row's room
    for (const w of fresh) { const t = $$(".ytag--stk:not(.ytag--more)", w); w._wmap = new Map(w._p.stack.map((s, j) => [s, t[j]?.getBoundingClientRect().width || 0])); }
    if (probe) { moreW = probe.getBoundingClientRect().width; probe.remove(); }
    const line = ws.find((w, i) => vis[i])?.firstElementChild;
    if (stackGap < 0 && line) stackGap = parseFloat(getComputedStyle(line).columnGap) || 0;
    fm.gap = stackGap; fm.more = moreW;
    const room = ws.map((w, i) => (vis[i] ? w.clientWidth : 0));
    // write: how many fit. The project's own order, unless an active / matching stack would fold into "+n": then those lead
    const H = hits(), gap = Math.max(0, stackGap);
    ws.forEach((w, i) => {
      if (!room[i] || !w._wmap) return;
      const nat = w._p.stack, hot = (s) => isOn(s) || H.stack(s);
      const fit = (order) => fitCount(order.map((s) => w._wmap.get(s) || 0), room[i], gap, moreW);
      let order = nat, k = fit(nat);
      if (nat.some((s, j) => hot(s) && j >= k)) { order = [...nat.filter(hot), ...nat.filter((s) => !hot(s))]; k = fit(order); }
      const sig = order.map((s) => (isOn(s) ? "!" : H.stack(s) ? "*" : "") + s).join("|") + "#" + k;
      // i7 · P1: the timeline row's line is display-only spans; a grid card's stays filter buttons
      if (sig !== w._sig) { w._sig = sig; keepFocus(w, () => { w.innerHTML = w.classList.contains("pj-row__stack") ? tlStackHTML(order, k, H) : cardStackHTML(order, k, H); }); }
    });
  }
  function fitCount(widths, room, gap, more) {
    let used = 0, k = 0;
    for (; k < widths.length; k++) { const add = (k ? gap : 0) + widths[k]; if (used + add > room + 0.5) break; used += add; }
    if (k === widths.length) return k;
    while (k > 0 && used + (k ? gap : 0) + more > room + 0.5) { used -= widths[k - 1] + (k > 1 ? gap : 0); k--; }
    return k;
  }
  // the column changes width (window resize): refit on the next frame, once
  let fitRaf = 0;
  const fitSoon = () => { if (!fitRaf) fitRaf = requestAnimationFrame(() => { fitRaf = 0; fitStacks(); }); };
  const stackRO = new ResizeObserver(fitSoon);
  document.fonts?.ready?.then(() => { for (const w of $$(".pj-row__stack, .pj-card__stack", body)) w._wmap = null; for (const k in FITM) delete FITM[k]; fitSoon(); });
  function paintMatches() {
    const H = hits();
    for (const el of $$(".ygroup__item, .ytl__item", body)) { const p = BY[el.dataset.key]; if (p && !("yioGhost" in el.dataset)) paintItem(el, p, H); }
    const st = $("#pj-stage");
    if (st && sel && BY[sel]) { paintItem(st, BY[sel], H); paintOpen(st, BY[sel], H); }
    const op = io.current && $(".pj-panel", body);
    if (op && BY[io.current]) paintOpen(op, BY[io.current], H);
  }

  /* ============================================================
     MARKUP
     ============================================================ */
  // i6 · P3 (owner: "two things show nothing to show clear filters its redundant we should show one"): one empty
  // state for the whole list (timeline: the stage steps away, .pj-list.is-empty), one line and one button
  const emptyHTML = Y.empty({ title: "No projects match", action: { label: "Clear filters", attrs: "data-reset" }, cls: "pj-empty", hidden: true }); // i7 · C1: the kit's empty state
  const wuBadge = `<span class="pj-wu meta" title="Has a write-up on Thoughts"><i class="ph-bold ph-scroll" aria-hidden="true"></i>write-up</span>`;
  const quickLinks = (p) =>
    (p.github && p.github !== p.view ? Y.linkIcon("github", p.github, `${p.name} on GitHub`) : "") +
    (p.view ? Y.linkIcon("view", p.view, `${D.viewLabel(p)}: ${p.name}`) : "");
  // the element that opens a grid card: a disclosure button (in place) or a link (its own page)
  const opener = (p, cls, inner) => OPT.open === "page"
    ? `<a class="${cls}" href="${esc(D.pageHref(p))}" data-nav="${p.slug}">${inner}</a>`
    : `<button type="button" class="${cls}" data-open="${p.slug}" aria-expanded="false">${inner}</button>`;

  // desktop timeline row (selected = rope + yarn ball: the timeline keeps its selected state)
  // i5: one line of stack chips (P3.2, ?tlstack=on) in place of the matched-stack line · ?ongoing=ribbon (Earlier): the ribbon
  // i6 · P2: the stack line is hashtag buttons, so the row is a div and its name is the button that selects it (a click
  // anywhere else on the row selects it too; the focus ring is drawn on the row)
  const rowHTML = (p) => { const H = hits(), rb = D.ribbonHTML(p); return `<div class="yrow ylift ysel pj-row${rb ? " has-ribbon" : ""}" data-slug="${p.slug}" aria-current="false">
      ${D.thumbHTML(p)}
      <span class="pj-row__txt"><span class="pj-row__name"><button type="button" class="pj-row__open" aria-controls="pj-stage" aria-current="false">${esc(p.name)}${p.hasWriteup ? '<span class="sr-only">, has a write-up</span>' : ""}</button></span>${D.metaHTML(p, { hits: H, ribbon: true })}${OPT.tlstack === "on"
        ? `<span class="pj-row__stack">${tlStackHTML(p.stack, Infinity, H)}</span>`
        : `<span class="pj-hits"${hitsHTML(p, H) ? "" : " hidden"}>${hitsHTML(p, H)}</span>`}</span>${rb}
      ${p.hasWriteup ? `<span class="pj-row__wu" title="Has a write-up"><i class="ph-bold ph-scroll" aria-hidden="true"></i></span>` : ""}
    </div>`; };
  // phone row: a link to the project's own page
  const mrowHTML = (p) => { const H = hits(), rb = D.ribbonHTML(p); return `<a class="yrow ylift pj-mrow${rb ? " has-ribbon" : ""}" href="${esc(D.pageHref(p))}" data-nav="${p.slug}">
      ${D.thumbHTML(p, "pj-thumb--m")}
      <span class="pj-row__txt"><span class="pj-row__name">${esc(p.name)}</span>${D.metaHTML(p, { compact: true, hits: H, ribbon: true })}<span class="pj-hits"${hitsHTML(p, H) ? "" : " hidden"}>${hitsHTML(p, H)}</span>${Y.opts.phrow === "card" && p.text ? `<span class="pj-mrow__desc">${esc(p.text)}</span>` : ""}</span>${rb}
      <i class="ph-bold ph-caret-right pj-mrow__go" aria-hidden="true"></i>
    </a>`; };
  // grid card: info first (title, badges, description, stack, quick links), image beside/above when there is one.
  // No rope: in the grid an item is open or it isn't (owner, Projects 2.3).
  const cardHTML = (p) => { const H = hits(), rb = D.ribbonHTML(p); return `<article class="ycard ylift pj-card ${p.preview ? "has-media" : "is-text"}${rb ? " has-ribbon" : ""}">
      <div class="pj-card__main">
        <h3 class="pj-card__title">${opener(p, "pj-card__open", esc(p.name))}</h3>
        ${D.metaHTML(p, { hits: H, ribbon: true })}${rb}
        <p class="pj-card__desc">${esc(p.text)}</p>
      </div>
      ${p.preview ? `<div class="pj-card__media">${D.thumbHTML(p, "pj-thumb--card")}</div>` : ""}
      <footer class="pj-card__foot"><div class="pj-card__stack">${D.stackTagsHTML(p.stack, { max: 4, hits: H, pressed: isOn })}</div><span class="pj-card__links">${p.hasWriteup ? wuBadge : ""}${quickLinks(p)}</span></footer>
    </article>`; };
  // opened grid card: the kit detail shell on the white card material (.ypanel)
  const panelHTML = (p) => `<section class="ypanel pj-panel" aria-label="${esc(p.name)}">${D.detailHTML(p, { actions: D.act.page(p) + D.act.copy(p) + D.act.close(p), level: 3, hits: hits(), pressed: pressedStacks(p) })}</section>`;

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
          <div class="pj-stagewrap ystagewrap"><aside class="pj-stage ypanel" id="pj-stage" aria-label="Selected project" tabindex="-1"></aside></div>
        </div>`;
      tl = Y.timeline($(".ytl", body), { ball: true, trail: true, passed: OPT.passed === "ring" }); // P3.1
    } else if (mode === "grid") {
      body.innerHTML = `<div class="pj-grid pj-grid--${OPT.gimg} pj-grid--${OPT.open}">${Y.yearGroupsHTML(groups, cardHTML, { key: keyOf, unit: "project", id: "pjg", grid: true })}${emptyHTML}</div>`;
    } else {
      body.innerHTML = `<div class="pj-mlist">${Y.yearGroupsHTML(groups, mrowHTML, { key: keyOf, unit: "project", id: "pjm" })}${emptyHTML}</div>`;
    }
    stackRO.disconnect();
    if (mode === "list" && OPT.tlstack === "on") stackRO.observe($(".pj-tl", body));
    else if (mode === "grid") stackRO.observe($(".pj-grid", body)); // i6 fix (P2-3): the cards' stack lines
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
    // i6 · P4: the grid's year dividers while a search / filter is on (kit ?gridyears); a year in the search keeps them
    if (mode === "grid") Y.gridYears(body, { on: F.any(), byYear: /\b(19|20)\d\d\b/.test(F.q), unit: "project" });
    paintMatches();
    fitStacks();
    // i7: every list's card facts on one line (the kit's fitFacts: status word → short years → type word), re-run here
    // because a match opens a fact's word (the timeline fits itself on resize; the grid + phone list join it)
    // phones never hide the type word (Decided: small cards keep it; touch can't hover a disc): a long row wraps instead
    Y.fitFacts?.($(".ytl, .pj-grid, .pj-mlist", body), { max: mode === "mlist" ? 2 : 0 });
    const empty = $(".pj-empty", body);
    if (empty) empty.hidden = n > 0;
    $(".pj-list", body)?.classList.toggle("is-empty", !n); // i6 · P3: the stage steps away; the list's empty state is the one message
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
    for (const b of $$(".pj-row", body)) { const on = String(b.dataset.slug === slug); b.setAttribute("aria-current", on); $(".pj-row__open", b)?.setAttribute("aria-current", on); }
    tl?.select(slug, { instant: from === "init" });
    const p = BY[slug];
    // i6 · P3: nothing matches → the stage is empty and steps away (.pj-list.is-empty); the list says it once
    if (!p) { Y.stageSwap(stage, "", { animate: false }); return; }
    if (prev === slug && from !== "init" && stage.querySelector(".ydetail")) return;
    // i5 · layout: the kit swaps the stage's content (fade up from the travel direction; with ?stagealign=center the
    // panel glides to its new place from where it is on screen). i6 (L6): no ongoing tab; the facts say it.
    const moved = !!prev && prev !== slug && from !== "init";
    Y.stageSwap(stage, D.detailHTML(p, { actions: D.act.page(p) + D.act.copy(p), level: 2, hits: hits(), pressed: pressedStacks(p) }), {
      dir: moved ? (PJ.indexOf(BY[slug]) > PJ.indexOf(BY[prev]) ? 1 : -1) : 0,
      animate: moved,
    });
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
    if (e.target.closest("[data-yf]")) return; // a stack tag / chip: the kit toggles that filter (P2)
    const row = e.target.closest(".pj-row");
    if (row) { selectList(row.dataset.slug); return; }
    const op = e.target.closest("[data-open]");
    if (op) { e.preventDefault(); io.toggle(op.dataset.open); return; }
    const nav = e.target.closest("[data-nav]");
    if (nav && !(e.metaKey || e.ctrlKey || e.shiftKey)) { Y.sound("open", { el: nav }); saveScroll(nav.dataset.nav); }
  });
  // G6 · grid → item page → Back: the list comes back where it was (filters ride in the URL; the scroll is kept here)
  const SCROLL_KEY = "pj:list-scroll";
  function saveScroll(slug) { try { sessionStorage.setItem(SCROLL_KEY, JSON.stringify({ slug, mode, y: Math.round(scrollY) })); } catch (_) {} }
  function savedScroll(slug) {
    try { const s = JSON.parse(sessionStorage.getItem(SCROLL_KEY) || "null"); sessionStorage.removeItem(SCROLL_KEY); return s && s.slug === slug && s.mode === mode ? s.y : null; } catch (_) { return null; }
  }
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
    ($(".pj-row__open", next) || next).focus({ preventScroll: true });
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
      // back from an item page (or a ?p= link on a phone): the project is in view and focused.
      // i5 (G6): the same scroll position as when it was opened, if the card is still on screen there
      const el = itemEl(focus || want);
      const y = focus ? savedScroll(focus) : null;
      if (y != null) scrollTo(0, y);
      const r = el?.getBoundingClientRect();
      if (el && (y == null || r.bottom < stickyTop() + 60 || r.top > innerHeight - 60)) el.scrollIntoView({ block: "center" });
      $("[data-open], [data-nav]", el || document.createElement("i"))?.focus({ preventScroll: true });
      if (want) setParam("p", null);
    }
    if (focus) setParam("focus", null);
  }
  desk.addEventListener("change", () => { renderHead(); placeChrome(); render(); });
  boot();

  // G1: open: true = an open decision (i5 "try this" items) · state: true = a demo-state helper · no flag = decided (Earlier)
  Y.mockPanel([
    // i7 (Open): status + date (P2) · card facts (P3)
    { global: true, label: "Status + date (P2)", param: "statusdate", options: [["joined", "Joined: (✓) Completed Dec 2024 · (hammer) WIP since Sep 2025 (decided i8)"], ["apart", "Apart: (✓) Complete · Aug – Dec 2024"]], default: "joined" },
    { global: true, label: "Phone list · rows or cards", param: "phrow", options: [["card", "Cards: a bigger image and two lines of the description (decided i8)"], ["row", "Rows: image, name, facts (i7)"]], default: "card" },
    { label: "Card facts (P3)", param: "cardfacts", options: [["words", "Words: type + status named (decided i8)"], ["icons", "Icons: discs only, named on hover"]], default: "words" },
    // i6: card meta (?cardmeta, O1) and grid years (?gridyears, P4) are kit groups (Open) · these five are decided (Earlier)
    { label: "Ongoing (G5)", param: "ongoing", options: [["badge", "In the meta row (decided)"], ["ribbon", "Ribbon on the card (i5)"]], default: "badge" },
    { label: "Type colours (P2)", param: "ptype", options: [["color", "Blue · yellow · orange"], ["plain", "Plain (i4)"]], default: "color" },
    { label: "Timeline: passed knots (P3.1)", param: "passed", options: [["ring", "Open red rings"], ["dot", "Grey dots (i4)"]], default: "ring" },
    { label: "Timeline: stack line (P3.2)", param: "tlstack", options: [["on", "One line + “+n”"], ["off", "Off (i4)"]], default: "on" },
    ...Y.detailOptions({ stage: true }), // i5 · layout: ?dlayout= (P3.3.1) · ?stagealign= (P3.3.5)
    { label: "Desktop layout", param: "view", options: [["list", "Timeline + stage"], ["grid", "Grid by year"]], default: "list" },
    { label: "Grid: open an item", param: "open", options: [["page", "Its own page"], ["inline", "In place"]], default: "page" },
    { label: "Grid: image", param: "gimg", options: [["side", "Beside text"], ["top", "On top"]], default: "side" },
    { label: "Timeline: select on", param: "hover", options: [["click", "Click"], ["intent", "Hover (intent)"]], default: "click" },
    { label: "Phone filters (msearch=bar)", param: "mf", options: [["wrap", "Two lines, no scroll"], ["scroll", "One line, scrolls"]], default: "wrap" },
    { label: "State: item", param: "p", options: [["", "None"], ["blaqat-net-this-site", "blaqat.net"], ["sonata", "Sonata"], ["forth-evaluator", "Forth (write-up)"], ["fishbowl-ai-assistant", "Fishbowl (no links)"]], default: "", state: true },
    { label: "State: search FAB (phones)", param: "fab", options: [["", "Closed"], ["open", "Open"]], default: "", state: true },
  ], { title: "Projects options" });
})();
