/* ============================================================
   projects/pj-core.js · shared by index.html + item.html (mock-only)
   Project data (normalized from BLAQAT.projects), the tiny markdown
   the data needs, and the renderers both pages use: preview thumb,
   detail shell (kit Yarn.detail), links, write-up link, and (i4) the
   match-aware meta + stack (in-item match marks).
   window.PJ = { list, bySlug, detailHTML, metaHTML, stackHTML, linksHTML, thumbHTML, … }
   ============================================================ */
(() => {
  "use strict";
  const Y = window.Yarn;
  const esc = Y.esc;
  const P = Y.params;

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
  const CARRY = ["sel", "rope", "body", "bg", "nav", "reduced", "view", "hover", "gimg", "open", "msearch", "mf", "type", "status", "stack", "q"];
  function carry(extra = {}, drop = []) {
    const u = new URLSearchParams();
    for (const k of CARRY) if (P.get(k) != null && !drop.includes(k)) u.set(k, P.get(k));
    for (const [k, v] of Object.entries(extra)) v == null ? u.delete(k) : u.set(k, v);
    const s = u.toString();
    return s ? `?${s}` : "";
  }
  const pageHref = (p) => `item.html${carry({ p: p.slug }, ["q"])}`;
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
  // links: primary visit, GitHub, then the write-up as its own action (→ Thoughts article).
  // i4 (owner, Projects 6): a project with no public links has no links section at all (no "private repo" line).
  function linksHTML(p, { writeup = true } = {}) {
    const a = [];
    if (p.view) a.push(`<a class="btn btn--red" href="${esc(p.view)}" target="_blank" rel="noopener"><i class="ph-bold ph-arrow-up-right" aria-hidden="true"></i>${viewLabel(p)}<span class="sr-only"> (opens in a new tab)</span></a>`);
    if (p.github && p.github !== p.view) a.push(Y.linkIcon("github", p.github, "Source on GitHub"));
    if (writeup && p.hasWriteup) a.push(`<span class="ydetail__spacer"></span><a class="btn btn--ink pj-wu-btn" href="${writeupHref(p)}"><i class="ph-bold ph-scroll" aria-hidden="true"></i>Read the write-up<i class="ph-bold ph-arrow-right" aria-hidden="true"></i></a>`);
    return a.join("");
  }

  /* ---------- in-item match marks (owner, Projects 4) ----------
     hits = { status(p), type(p), stack(name) } → true when that value matches the active filter or search.
     A matching status / type badge sits in a .pj-mk wrapper that takes the kit's in-card match look (.is-match:
     --y-fg on --y-chip, i2's pressed tag), so the badge itself (ribbon, patch) never changes; a matching stack
     chip gets .is-match itself (in a list, the other stack chips are plain, like Thoughts' in-card tags). */
  const NOHITS = { status: () => false, type: () => false, stack: () => false };
  const mk = (kind, html, on) => (html ? `<span class="pj-mk${on ? " is-match" : ""}" data-mk="${kind}">${html}</span>` : "");
  // status · type · date (the kit's Yarn.meta order), each badge in its match wrapper
  const metaHTML = (p, { compact = false, dur = false, hits = NOHITS } = {}) =>
    `<div class="ymeta">${mk("status", Y.badge.status(p.status, { compact }), hits.status(p))}${mk("type", Y.badge.type(p.type, { compact }), hits.type(p))}${Y.badge.date(p, { dur })}</div>`;
  // stack chips; with a max (cards), matching stacks come first so a match is never hidden in "+N"
  function stackHTML(list, { max = Infinity, as = "li", hits = NOHITS, label } = {}) {
    const on = (s) => hits.stack(s);
    const order = max < Infinity ? [...list.filter(on), ...list.filter((s) => !on(s))] : list;
    const m = new Set(list.filter(on));
    // Yarn.stack marks `pressed` chips .is-match (the in-card match look)
    return Y.stack(order, { max, as, pressed: m, ...(label ? { label } : {}) });
  }

  const bodyHTML = (p) =>
    (p.tagline ? `<p class="pj-lead">${inline(p.tagline)}</p>` : "") + p.summaryHTML +
    (p.tags.length ? `<div class="pj-tags"><span class="eyebrow">In thoughts</span>${Y.tags(p.tags)}</div>` : "");

  // top actions: the kit's round .ylinkicon (44px), same as every other detail page
  const act = {
    page: (p) => `<a class="ylinkicon" href="${esc(pageHref(p))}" data-open-page aria-label="Open ${esc(p.name)} as its own page" title="Open as page"><i class="ph-bold ph-arrow-square-out" aria-hidden="true"></i></a>`,
    copy: (p) => `<button type="button" class="ylinkicon" data-copy="${esc(absHref(p))}" aria-label="Copy link to ${esc(p.name)}" title="Copy link"><i class="ph-bold ph-link" aria-hidden="true"></i></button>`,
    close: (p) => `<button type="button" class="ylinkicon" data-close aria-label="Close ${esc(p.name)}" title="Close (Esc)"><i class="ph-bold ph-x" aria-hidden="true"></i></button>`,
    prev: (p) => (p ? `<a class="ylinkicon" href="${esc(pageHref(p))}" rel="prev" aria-label="Newer project: ${esc(p.name)}" title="${esc(p.name)}"><i class="ph-bold ph-caret-up" aria-hidden="true"></i></a>` : ""),
    next: (p) => (p ? `<a class="ylinkicon" href="${esc(pageHref(p))}" rel="next" aria-label="Older project: ${esc(p.name)}" title="${esc(p.name)}"><i class="ph-bold ph-caret-down" aria-hidden="true"></i></a>` : ""),
  };

  // title → metadata (status · type · time, then stack) → links → media → text
  function detailHTML(p, { back = null, actions = "", level = 2, stackAs = "button", id, end = "", hits = NOHITS } = {}) {
    return Y.detail({
      back, actions, level, id, end,
      title: p.name,
      meta: metaHTML(p, { dur: true, hits }) + stackHTML(p.stack, { as: stackAs, hits }),
      media: Y.carousel(p.images || [], { title: p.name, group: `pj-${p.slug}` }),
      body: bodyHTML(p),
      links: linksHTML(p),
    });
  }

  // copy-link buttons anywhere on the page
  document.addEventListener("click", (e) => {
    const b = e.target.closest?.("[data-copy]");
    if (!b) return;
    const done = (ok) => {
      const i = b.querySelector("i");
      b.classList.toggle("is-copied", ok);
      if (i) i.className = `ph-bold ${ok ? "ph-check" : "ph-link-break"}`;
      b.title = ok ? "Copied" : "Couldn't copy: " + b.dataset.copy;
      if (ok) Y.sound("copy", { el: b });
      clearTimeout(b._t);
      b._t = setTimeout(() => { if (i) i.className = "ph-bold ph-link"; b.title = "Copy link"; b.classList.remove("is-copied"); }, 1600);
    };
    try { navigator.clipboard.writeText(b.dataset.copy).then(() => done(true), () => done(false)); } catch (_) { done(false); }
  });

  window.PJ = { list, bySlug, STACKS, inline, plain, thumbHTML, linksHTML, bodyHTML, detailHTML, metaHTML, stackHTML, NOHITS, act, writeupHref, pageHref, listHref, carry, viewLabel };
})();
