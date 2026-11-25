/* ============================================================
   projects/pj-core.js · shared by index.html + item.html (mock-only)
   Project data (normalized from BLAQAT.projects), the tiny markdown
   the data needs, and the renderers both pages use: preview thumb,
   detail shell (kit Yarn.detail), links, write-up link, and the
   match-aware card facts + stack tags (in-item match marks).
   window.PJ = { list, bySlug, detailHTML, metaHTML, stackTagsHTML, thumbHTML, … }
   ============================================================ */
(() => {
  "use strict";
  const Y = window.Yarn;
  const esc = Y.esc;
  const P = Y.params;

  /* ---------- i5 · projects options read on both pages (list + item page) ----------
     ptype      color (decided) | plain   P2: type colours (kit CSS keys off html[data-ptype])
     ongoing    badge (decided i6) | ribbon  G5: ongoing = in the meta row (with ?cardmeta=facts: the icon-only gold WIP disc)
                                             | i5's ribbon on the card's side (PJ.ribbonHTML), Earlier
     Card meta (O1, ?cardmeta, decided facts) is a kit option: Yarn.cardMeta. */
  const pickP = (k, ok) => (ok.includes(P.get(k)) ? P.get(k) : ok[0]);
  /* i7 (open) statusdate  apart (i6) | joined   P2: status + date as one fact on cards and in the opened item
                                                 ("Completed Dec 2024", "WIP since Sep 2025": Yarn.fact.statusDate)
               cardfacts   words (i6) | icons    P3: card facts as discs only (the type too), named by the kit hint,
                                                 like Music's small cards (Yarn.cardMeta({ icons })) */
  const OPT = { ptype: pickP("ptype", ["color", "plain"]), ongoing: pickP("ongoing", ["badge", "ribbon"]),
    statusdate: pickP("statusdate", ["apart", "joined"]), cardfacts: pickP("cardfacts", ["words", "icons"]) };
  document.documentElement.dataset.ptype = OPT.ptype;
  document.documentElement.dataset.ongoing = OPT.ongoing;

  /* ---------- mock-only: topic tags that exist on the Thoughts page ---------- */
  const TAGS = {
    "blaqat-net-this-site": ["svelte", "design", "wip"],
    "code-editor-theme-generator": ["editor", "terminal", "tools"],
    "forth-evaluator": ["learnings"],
    "bank-simulation": ["learnings"],
    "fitr-skills-career-roadmaps": ["design"],
  };

  /* ---------- tiny markdown (enough for this data) ---------- */
  function inline(src) {
    const codes = [];
    let s = esc(src).replace(/`([^`]+)`/g, (_, c) => `\u0000${codes.push(c) - 1}\u0000`);
    s = s
      .replace(/\*\*([^*]+?)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\*)/g, "$1<em>$2</em>")
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    return s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${codes[+i]}</code>`);
  }
  const plain = (s) => String(s || "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`>#]+/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // "# tagline\n" + summary + (--- or a heading → the write-up, which lives on Thoughts now)
  function splitDesc(md) {
    let s = String(md || "").replace(/\r/g, "").trim();
    let tagline = "";
    const m = s.match(/^#{1,6}\s+(.+)\n+/);
    if (m) { tagline = m[1].trim(); s = s.slice(m[0].length); }
    const cut = s.search(/\n\s*(-{3,}\s*\n|#{1,6}\s)/);
    return { tagline, summary: (cut === -1 ? s : s.slice(0, cut)).trim(), writeup: cut === -1 ? "" : s.slice(cut).trim() };
  }
  // every line of the summary is its own paragraph (that's how the data is written); "> " lines become a quote
  function summaryHTML(src) {
    const blocks = [];
    let q = null;
    for (const raw of src.split("\n")) {
      const t = raw.trim();
      if (!t) { q = null; continue; }
      if (t.startsWith(">")) { if (!q) blocks.push((q = [])); q.push(t.replace(/^>\s?/, "")); }
      else { q = null; blocks.push(t); }
    }
    return blocks.map((b) => (Array.isArray(b) ? `<blockquote><p>${b.map(inline).join("<br>")}</p></blockquote>` : `<p>${inline(b)}</p>`)).join("");
  }

  /* ---------- normalize ---------- */
  function previewOf(images) {
    const list = (images || []).map((m) => ({ ...m, url: Y.media(m.src), video: Y.isVideo(m.src, m.kind) })).filter((m) => m.url);
    const img = list.find((m) => !m.video);
    const pick = img || list[0];
    return pick ? { src: pick.url, kind: pick.video ? "video" : "image", alt: (pick.alt || "").trim() } : null;
  }
  function initials(name) {
    return name.split(/\s+/).filter((w) => /^[a-z0-9]/i.test(w)).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
  }
  function normalize(raw) {
    const d = splitDesc(raw.description);
    const slug = Y.slug(raw.name);
    return {
      ...raw,
      slug,
      key: slug,
      year: Y.yearOf(raw),
      startT: (Y.parseDate(raw.start) || new Date(0)).getTime(),
      tagline: d.tagline,
      summary: d.summary,
      hasWriteup: !!d.writeup,
      summaryHTML: summaryHTML(d.summary),
      text: plain((d.tagline ? d.tagline + ". " : "") + d.summary),
      preview: previewOf(raw.images),
      initials: initials(raw.name),
      tags: TAGS[slug] || [],
    };
  }
  const list = window.BLAQAT.projects.map(normalize).sort((a, b) => b.startT - a.startT);
  const bySlug = Object.fromEntries(list.map((p) => [p.slug, p]));
  const STACKS = (() => {
    const n = {};
    list.forEach((p) => p.stack.forEach((s) => (n[s] = (n[s] || 0) + 1)));
    return Object.keys(n).sort((a, b) => n[b] - n[a] || a.localeCompare(b));
  })();

  /* ---------- URLs ---------- */
  // the write-up is a Thoughts article now (the Thoughts page renders it); slug = Yarn.slug(name)
  const writeupHref = (p) => `../thoughts/stitched.html?view=article&project=${encodeURIComponent(p.slug)}`;
  // params worth carrying between the list and the item page (kit options, page options, filters)
  // i5 · projects: + the i5 list options; q now rides along too, so the item page's Back restores the search (G6)
  const CARRY = ["sel", "rope", "body", "bg", "nav", "reduced", "view", "hover", "gimg", "open", "msearch", "mf", "type", "status", "stack", "q", "ptype", "ongoing", "passed", "tlstack", "cardmeta", "gridyears", "dlayout", "dnav", "stagealign", "dfoot", "statusdate", "cardfacts", "phrow"]; // i7: + P2 · P3 · phone cards
  function carry(extra = {}, drop = []) {
    const u = new URLSearchParams();
    for (const k of CARRY) if (P.get(k) != null && !drop.includes(k)) u.set(k, P.get(k));
    for (const [k, v] of Object.entries(extra)) v == null ? u.delete(k) : u.set(k, v);
    const s = u.toString();
    return s ? `?${s}` : "";
  }
  const pageHref = (p) => `item.html${carry({ p: p.slug })}`;
  const listHref = (p) => `index.html${carry({ focus: p ? p.slug : null })}`;
  const absHref = (p) => new URL(`item.html?p=${encodeURIComponent(p.slug)}`, location.href).href;

  function viewLabel(p) {
    const h = (() => { try { return new URL(p.view).hostname; } catch (_) { return ""; } })();
    if (/discord\.com$/.test(h)) return "Add to Discord";
    if (/github\.com$/.test(h)) return "Open repo";
    if (/exercism\.org$/.test(h)) return "View exercise";
    return "Visit site";
  }

  /* ---------- renderers ---------- */
  // closed-state preview: image, else a video frame, else a knit monogram (never a broken image)
  function thumbHTML(p, cls = "") {
    const pv = p.preview;
    if (!pv) return `<span class="pj-thumb pj-thumb--none ${cls}" aria-hidden="true"><b>${esc(p.initials)}</b></span>`;
    if (pv.kind === "video") return `<span class="pj-thumb ${cls}" aria-hidden="true"><video src="${esc(pv.src)}#t=1.2" muted playsinline preload="metadata" tabindex="-1" disablepictureinpicture></video></span>`;
    return `<span class="pj-thumb ${cls}" aria-hidden="true"><img src="${esc(pv.src)}" alt="" loading="lazy" decoding="async" draggable="false"></span>`;
  }
  /* ---------- in-item match marks (owner, Projects 4) ----------
     hits = { status(p), type(p), stack(name) } → true when that value matches the active filter or search.
     A matching fact or stack tag takes the kit's in-card match look itself (.is-match: --y-fg on --y-chip). */
  const NOHITS = { status: () => false, type: () => false, stack: () => false };
  // i6 · projects (O1): type · status · date through the kit's Yarn.cardMeta (?cardmeta=facts: the opened item's fact
  // grammar, ongoing as the icon-only gold WIP disc · badges: i5's badges). Each part carries data-mk="type|status" and
  // .is-match (projects.js paintItem keeps it in step); an icon-only part opens to show its name when it matches.
  // ribbon → with ?ongoing=ribbon (Earlier) an ongoing project's status lives on the card's ribbon (ribbonHTML) instead.
  const onRibbon = (p) => OPT.ongoing === "ribbon" && Y.status(p.status)?.key === "ongoing";
  const metaHTML = (p, { compact = false, dur = false, hits = NOHITS, ribbon = false } = {}) =>
    Y.cardMeta(p, { compact, dur, parts: ribbon && onRibbon(p) ? ["type", "date"] : ["type", "status", "date"], match: { type: hits.type(p), status: hits.status(p) },
      icons: OPT.cardfacts === "icons", statusdate: OPT.statusdate }); // i7 · P3 · P2
  // P2 · a card's stack as hashtags (Yarn.stackTags): a tap filters by it, a tap on an active one clears it. Active
  // filters are pressed, typed-search hits marked (.is-match). The order stays the project's own (a tapped tag doesn't
  // jump away from the pointer); only when one of those would hide in "+n" do they move to the front.
  function stackTagsHTML(list, { max = Infinity, hits = NOHITS, pressed = () => false } = {}) {
    const on = (s) => hits.stack(s) || pressed(s);
    const order = list.some((s, i) => on(s) && i >= max) ? [...list.filter(on), ...list.filter((s) => !on(s))] : list;
    return Y.stackTags(order, { max, pressed: new Set(list.filter(pressed)), match: new Set(list.filter(hits.stack)) });
  }
  // G5 · the ongoing ribbon (kit .yribbon): put it inside a position:relative card (row, card, the open item's panel)
  const ribbonHTML = (p) => (onRibbon(p) ? `<span class="yribbon">${Y.badge.status("ongoing")}</span>` : "");

  // top actions: the kit's round .ylinkicon (44px), same as every other detail page
  const act = {
    page: (p) => `<a class="ylinkicon" href="${esc(pageHref(p))}" data-open-page aria-label="Open ${esc(p.name)} as its own page" title="Open as page"><i class="ph-bold ph-arrow-square-out" aria-hidden="true"></i></a>`,
    copy: (p) => Y.copyBtn(absHref(p), { label: `Copy link to ${p.name}` }),
    close: (p) => `<button type="button" class="ylinkicon" data-close aria-label="Close ${esc(p.name)}" title="Close (Esc)"><i class="ph-bold ph-x" aria-hidden="true"></i></button>`,
  };

  /* ---------- i5 · layout · the opened item in the one grammar (LAYOUT-i5.md) ----------
     facts  status · type · date, all Yarn.fact (disc + label, one face). data-mk marks the two that can match a filter.
     stack  the kit's stack tags: buttons that toggle the stack filter on the list (pressed = the in-card match look,
            strike on hover/focus), links to the filtered list on the item page.
     links  one row: the first is the primary (red), the rest secondaries; the write-up is one of them.
     No "In thoughts" hashtags: the write-up link is the one bridge to Thoughts. */
  // i6 review (P1-4): type · status · date, the same order as the cards (owner: "status and year really goes together")
  // i7 · P2: ?statusdate=joined → type · "(✓) Completed Dec 2024 · 5 mo" (one fact; the opened item keeps the length)
  const factsHTML = (p, hits = NOHITS) =>
    Y.fact.type(p.type, { attrs: 'data-mk="type"', cls: hits.type(p) ? "is-match" : "" }) +
    (OPT.statusdate === "joined" && Y.fact.statusDate(p)
      ? Y.fact.statusDate(p, { dur: true, attrs: 'data-mk="status"', cls: hits.status(p) ? "is-match" : "" })
      : Y.fact.status(p.status, { attrs: 'data-mk="status"', cls: hits.status(p) ? "is-match" : "" }) + Y.fact.date(p, { dur: true }));
  function linksV5(p) {
    const a = [];
    if (p.view) a.push({ href: p.view, label: viewLabel(p), icon: "ph-arrow-up-right", kind: "view" });
    if (p.github && p.github !== p.view) a.push({ href: p.github, label: "Source", kind: "github" });
    if (p.hasWriteup) a.push({ href: writeupHref(p), label: "Read the write-up", icon: "ph-scroll", cls: "pj-wu-btn" });
    return a.map((l, i) => Y.dlink({ ...l, primary: i === 0 })).join("");
  }
  const stackListHref = (s) => `index.html${carry({ stack: s }, ["q", "type", "status", "stack"])}`;
  // (i6 · L6: no ongoing tab on an opened panel's edge; the facts line's gold WIP disc says it)

  // title → facts (type · status · date) → stack → links → media → text
  // pressed: Set of stack names that are active filters (list page) · nav: { prev, next, index, total } (item page)
  function detailHTML(p, { back = null, actions = "", level = 2, stackAs = "button", id, end = "", hits = NOHITS, pressed = null, nav = null } = {}) {
    const media = Y.carousel(p.images || [], { title: p.name, group: `pj-${p.slug}` });
    return Y.detail({
      back, actions, level, id, end, nav,
      title: p.name,
      facts: factsHTML(p, hits),
      stack: Y.stackChips(p.stack, { as: stackAs, pressed, match: new Set(p.stack.filter((s) => hits.stack(s) && !pressed?.has(s))), href: stackListHref }),
      media,
      body: (p.tagline ? `<p class="pj-lead">${inline(p.tagline)}</p>` : "") + p.summaryHTML,
      links: linksV5(p),
    });
  }
  // (copy-link buttons: the kit's Yarn.copyBtn + its one listener, i7 · C1)

  window.PJ = { list, bySlug, STACKS, inline, plain, thumbHTML, detailHTML, metaHTML, stackTagsHTML, NOHITS, act, writeupHref, pageHref, listHref, carry, viewLabel, OPT, onRibbon, ribbonHTML };
})();
