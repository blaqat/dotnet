/* ============================================================
   Studio · i9 · blocks (S3): the block editor, for every markdown field (owner pins 3 + 14: "a live markdown editor
   like notion with blocks that would make adding our yarn blocks easier tho u can have button to view raw markdown")

   E.md(item, path, { label, compact, max }) → markup · E.wireMd(root, item) mounts every editor in root
   You write in the site's own article type (.ydetail__text), one block at a time: text, headings, lists, quote, code,
   divider, images, and the yarn blocks (kit/blocks.js: link · images · music · mention · note · post card).
     - markdown shortcuts as you type: "## " "- " "1. " "> " "```" "---", **bold** *italic* `code` ~~strike~~ [text](url)
     - "/" (or the "+" at a block, or the bar's "+ Block") opens the block menu: it filters as you type, ↑↓ Enter Esc
     - each block has a handle (⋮⋮): drag it to move the block, tap it for the menu (turn into · duplicate · move · delete)
     - keys: Esc selects the block (↑↓ pick, ⇧↑↓ extend, ⌥⇧↑↓ / ⌘⇧↑↓ move, ⌫ delete, ⌘D duplicate, Enter edit), ⌘Z ⌘⇧Z
     - a yarn block is the real kit part; a click or Enter opens its form on the kit's layer (phones: docked at the bottom)
     - "Markdown" in the bar shows the text itself, editable; back to Blocks re-reads it (untouched blocks keep their exact
       source, so the round-trip is lossless)
   Storage stays markdown (S.set(item, path, md) on every change → autosave, preview, publish checks, History).
   CSS: studio.css "i9 · blocks". Kit: Yarn.md (parse / serialize / render). Tests: ~/dev/temp/r3i9-blocks/.
   ============================================================ */
(() => {
  "use strict";
  const S = window.Studio, Y = window.Yarn, E = S.ed, M = Y.md;
  const { $, $$, esc } = S;
  if (!M) return;

  /* ---------- Studio's data for the yarn blocks (drafts included) ---------- */
  const studioAbout = (ref) => {
    const m = String(ref || "").match(/^(project|release|post):([^#]+)(?:#(.+))?$/);
    if (!m) return null;
    const [, ns, id] = m;
    if (ns === "project") { const p = S.data.projects.find((x) => String(x.id) === id || Y.slug(x.name || "") === id); return p && { ref, kind: "project", word: "project", name: p.name || "Untitled project", href: S.publicHref("projects", p), icon: "ph-folder-simple" }; }
    if (ns === "release") { const r = S.data.music.find((x) => String(x.id) === id || Y.slug(x.name || "") === id); return r && { ref, kind: "release", word: "release", name: r.name || "Untitled", href: S.publicHref("music", r), icon: "ph-music-notes" }; }
    return M.about(ref, { posts: S.data.thoughts });
  };
  const studioTrack = (src, title) => { const s = S.allSongs().find((x) => x.url === src); return s ? { ...s, collection: s.coll } : null; };
  S.mdCtx = () => ({
    about: studioAbout, track: studioTrack, posts: S.data.thoughts, group: "st-md",
    postCtx: { collections: S.data.collections || {}, collCount: (k) => (S.data.thoughts || []).filter((x) => x.collection === k).length, inert: true },
  });

  /* ---------- vocabulary ---------- */
  const TURN = [
    { k: "p", label: "Text", icon: "ph-text-t", md: "" },
    { k: "h2", label: "Heading", icon: "ph-text-h-two", md: "##" },
    { k: "h3", label: "Subheading", icon: "ph-text-h-three", md: "###" },
    { k: "ul", label: "Bulleted list", icon: "ph-list-bullets", md: "-" },
    { k: "ol", label: "Numbered list", icon: "ph-list-numbers", md: "1." },
    { k: "quote", label: "Quote", icon: "ph-quotes", md: ">" },
    { k: "code", label: "Code", icon: "ph-code", md: "```" },
  ];
  const BASIC = [...TURN, { k: "hr", label: "Divider", icon: "ph-minus", md: "---", keys: "line rule separator hr" }];
  const YARN = ["link", "images", "music", "mention", "note", "post"].map((k) => ({ k: `y:${k}`, kind: k, label: M.KINDS[k].label, icon: M.KINDS[k].icon, hint: M.KINDS[k].hint, keys: M.KINDS[k].keys, yarn: true }));
  const kOf = (b) => (b.type === "h" ? `h${b.level}` : b.type === "li" ? b.list : b.type);
  const NAME = { p: "Text", h1: "Heading 1", h2: "Heading", h3: "Subheading", h4: "Heading 4", h5: "Heading 5", h6: "Heading 6", ul: "Bulleted list", ol: "Numbered list", quote: "Quote", code: "Code", hr: "Divider", img: "Image", raw: "Markdown" };
  const nameOf = (b) => (b.type === "yarn" ? `${M.KINDS[b.kind]?.label || "Yarn"} block` : NAME[kOf(b)] || "Block");
  const isText = (b) => !!b && (b.type === "p" || b.type === "h" || b.type === "li" || b.type === "quote");
  const isAtom = (b) => !!b && (b.type === "hr" || b.type === "img" || b.type === "yarn" || b.type === "raw");
  const phone = () => innerWidth < 600 || matchMedia("(pointer: coarse)").matches && innerWidth < 960;
  const mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  const K = (s) => (mac ? s : s.replace(/⌘/g, "Ctrl+").replace(/⌥/g, "Alt+").replace(/⇧/g, "Shift+"));
  let N = 0;
  const bid = () => `b${(++N).toString(36)}${Date.now().toString(36).slice(-3)}`;
  const withId = (b) => ((b.id ||= bid()), b);
  // the hint under the editor: the reader's words (+ read time for an article / write-up)
  const countText = (md, compact) => { const n = M.words(md); return `${n} word${n === 1 ? "" : "s"}${compact ? "" : ` · ${Math.max(1, Math.round(n / 220))} min read`}`; };
  const newP = (text = "") => ({ id: bid(), type: "p", text, src: null, sep: null });

  /* ============================================================
     MARKUP
     ============================================================ */
  const PENDING = new Map();
  const ph = (on) => (on ? (phone() ? "Write, or tap + for a block" : "Write, or press / for a block") : "");
  // an empty heading / list item / quote says what it is (always); an empty text block only when it has the cursor
  const phFor = (b, on) => (b.type === "h" ? NAME[`h${b.level}`] || "Heading" : b.type === "li" ? "List" : b.type === "quote" ? "Quote" : ph(on));
  // ordered-list numbers, the way the markdown will number them (each run at a depth counts on from its first)
  function numbers(blocks) {
    const out = new Map(); const runs = [];
    let prev = null;
    for (const b of blocks) {
      if (b.type !== "li") { runs.length = 0; prev = null; continue; }
      const d = b.ind || 0;
      runs.length = Math.min(runs.length, d + 1);
      const r = runs[d];
      const n = b.list === "ol" ? (r && r.list === "ol" ? r.n + 1 : b.num || 1) : 0;
      runs[d] = { list: b.list, n };
      out.set(b.id, n); prev = b;
    }
    return out;
  }
  const quoteHTML = (t) => String(t || "").split(/\n{2,}/).map((p) => M.inline(p, { soft: " " })).join("<br><br>");
  function blockHTML(b, ctx, o = {}) {
    const cur = o.cur === b.id;
    const tab = cur ? 0 : -1;
    const empty = isText(b) && !String(b.text || "").trim();
    const common = `class="yb${empty ? " is-empty" : ""}" data-b="${b.id}" contenteditable="true" spellcheck="true" tabindex="${tab}"${empty ? ` data-ph="${esc(o.ph || "")}"` : ""}`;
    switch (b.type) {
      case "p": return `<p ${common}>${M.inline(b.text, { soft: " " })}</p>`;
      case "h": { const l = Math.min(6, Math.max(1, b.level || 2)); return `<h${l} ${common}>${M.inline(b.text, { soft: " " })}</h${l}>`; }
      case "li": return `<li ${common} data-ind="${b.ind || 0}" style="--ind:${b.ind || 0}"${b.ind ? ` aria-level="${b.ind + 1}"` : ""}${b.list === "ol" ? ` value="${o.num || 1}"` : ""}>${M.inline(b.text, { soft: " " })}</li>`;
      case "quote": return `<blockquote ${common}>${quoteHTML(b.text)}</blockquote>`;
      case "code": return `<div class="yb yb-code" data-b="${b.id}"><pre><textarea class="yb-code__t" data-host rows="${Math.max(1, String(b.code || "").split("\n").length)}" wrap="off" spellcheck="false" autocapitalize="off" autocomplete="off" tabindex="${tab}" aria-label="Code${b.lang ? `, ${esc(b.lang)}` : ""}">${esc(b.code || "")}</textarea></pre><input class="yb-code__lang" value="${esc(b.lang || "")}" placeholder="language" aria-label="Code language" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" tabindex="-1"></div>`;
      case "hr": return `<div class="yb yb-atom yb-hr" data-b="${b.id}" tabindex="${tab}" role="separator" aria-label="Divider"><hr></div>`;
      case "img": { const u = S.url(b.url) || b.url; return `<figure class="yb yb-atom yb-img" data-b="${b.id}" tabindex="${tab}" role="group" aria-roledescription="image block" aria-label="${esc(b.alt || "Image without alt text")}. Enter to edit."><div class="yb-atom__in" inert>${S.isVideo(b.url) ? S.mediaEl(b.url) : `<img src="${esc(u)}" alt="" draggable="false">`}</div></figure>`; }
      case "yarn": {
        const K2 = M.KINDS[b.kind], d = M.yarnData(b);
        const empty2 = K2 ? K2.empty(d) : false;
        const inner = empty2 ? `<span class="yb-yarn__empty"><i class="ph-bold ${K2.icon}" aria-hidden="true"></i>${esc(K2.label)}: nothing here yet</span>` : M.renderYarn(b, ctx);
        return `<div class="yb yb-atom yb-yarn" data-b="${b.id}" data-kind="${esc(b.kind)}" tabindex="${tab}" role="group" aria-roledescription="${esc(nameOf(b))}" aria-label="${esc(nameOf(b))}: ${esc((K2 ? K2.text(d) : "").slice(0, 120) || "empty")}. Enter to edit."><div class="yb-atom__in" inert>${inner}</div></div>`;
      }
      case "raw": return `<div class="yb yb-atom yb-raw" data-b="${b.id}" tabindex="${tab}" role="group" aria-roledescription="markdown block" aria-label="Kept as markdown (a table or HTML). Enter to edit."><div class="yb-atom__in" inert>${M.render(b.raw || "", ctx)}</div><span class="yb-raw__tag" aria-hidden="true"><i class="ph-bold ph-markdown-logo"></i>markdown</span></div>`;
    }
    return "";
  }
  function docHTML(blocks, o = {}) {
    const ctx = S.mdCtx(), nums = numbers(blocks);
    const only = blocks.length === 1 && isText(blocks[0]);
    let h = "", i = 0;
    while (i < blocks.length) {
      const b = blocks[i];
      if (b.type === "li") {
        const list = b.list; let inner = "";
        while (i < blocks.length && blocks[i].type === "li" && blocks[i].list === list) { inner += blockHTML(blocks[i], ctx, { ...o, num: nums.get(blocks[i].id), ph: phFor(blocks[i], only) }); i++; }
        h += `<${list}>${inner}</${list}>`;
        continue;
      }
      h += blockHTML(b, ctx, { ...o, ph: phFor(b, only || o.cur === b.id) });
      i++;
    }
    return h;
  }
  const seg = (id) => Y.seg([{ value: "blocks", label: "Blocks", icon: "ph-squares-four" }, { value: "md", label: "Markdown", icon: "ph-markdown-logo" }], { value: "blocks", label: "Editor view", name: `bk:${id}` });
  const tb = (attrs, icon, label, hint = "") => `<button type="button" class="st-bk__tb" ${attrs} aria-label="${esc(label)}${hint ? ` (${esc(K(hint))})` : ""}"><i class="ph-bold ${icon}" aria-hidden="true"></i></button>`;
  const tog = (fmt, icon, label, hint) => `<button type="button" class="st-bk__tb ysel ytog" data-bkfmt="${fmt}" aria-pressed="false" aria-label="${esc(label)} (${esc(K(hint))})"><i class="ph-bold ${icon}" aria-hidden="true"></i></button>`;

  E.md = (item, path, { label = "Write-up", compact = false, max = 0 } = {}) => {
    const id = Y.uid("bk");
    const md = String(S.get(item, path) || "");
    let doc = null;
    try { doc = M.parse(md); doc.blocks.forEach(withId); } catch (e) { console.warn(e); doc = null; }
    const blocks = doc ? (doc.blocks.length ? doc.blocks : [newP()]) : null;
    PENDING.set(id, { blocks, tail: doc?.tail ?? "", label, compact, max });
    let body = "";
    try { body = blocks ? docHTML(blocks, { cur: blocks[0].id }) : ""; } catch (e) { console.warn(e); PENDING.get(id).blocks = null; }
    return `<div class="st-bk" id="${id}" data-md="${esc(path)}" data-mode="blocks"${compact ? " data-compact" : ""}>
      <div class="st-bk__bar" role="toolbar" aria-label="${esc(label)} tools">
        <button type="button" class="st-bk__tb st-bk__tb--ins" data-bkins aria-haspopup="listbox" aria-label="Insert a block (/)"><i class="ph-bold ph-plus" aria-hidden="true"></i><span>Block</span></button>
        <span class="st-bk__sep" aria-hidden="true"></span>
        ${tog("bold", "ph-text-b", "Bold", "⌘B")}${tog("italic", "ph-text-italic", "Italic", "⌘I")}${tog("code", "ph-code-simple", "Inline code", "⌘E")}${tog("link", "ph-link-simple", "Link", "⌘K")}
        <span class="st-bk__sep st-bk__sep--hist" aria-hidden="true"></span><span class="st-bk__br" aria-hidden="true"></span>
        ${tb("data-bkundo", "ph-arrow-counter-clockwise", "Undo", "⌘Z")}${tb("data-bkredo", "ph-arrow-clockwise", "Redo", "⇧⌘Z")}
        <span class="st-bk__grow" aria-hidden="true"></span>${seg(id)}
      </div>
      <div class="st-bk__wrap" data-bkwrap>
        <div class="st-bk__doc ydetail__text" data-bkdoc tabindex="-1" role="group" aria-roledescription="block editor" aria-label="${esc(label)}" aria-describedby="${id}-help">${body}</div>
        <div class="st-bk__gut" data-bkgut hidden>
          <button type="button" class="st-bk__gbtn" data-bkplus aria-label="Add a block below" tabindex="-1"><i class="ph-bold ph-plus" aria-hidden="true"></i></button>
          <button type="button" class="st-bk__gbtn st-bk__grip" data-bkgrip aria-haspopup="menu" aria-label="Block menu: drag to move" tabindex="-1"><i class="ph-bold ph-dots-six-vertical" aria-hidden="true"></i></button>
        </div>
        <div class="st-bk__drop" data-bkdrop hidden aria-hidden="true"></div>
        <label class="sr-only" for="${id}-raw">${esc(label)}, as markdown</label>
        <textarea class="yfield st-bk__raw" id="${id}-raw" data-bkraw spellcheck="true" hidden>${esc(md)}</textarea>
      </div>
      <p class="st-hint st-bk__hint"><span data-words>${countText(md, compact)}</span>${max ? ` · <span data-chars>${md.length} / ${max}</span>` : ""}<span class="st-bk__keys"> · <kbd>/</kbd> for blocks · markdown shortcuts work · <kbd>Esc</kbd> selects a block</span></p>
      <p class="sr-only" id="${id}-help">Block editor. Type slash for the block menu. Escape selects the block: arrow keys move between blocks, ${mac ? "Option" : "Alt"} Shift and an arrow moves it, Enter edits it, Tab leaves the editor.</p>
    </div>`;
  };

  E.wireMd = (root, item) => $$(".st-bk", root).forEach((box) => { if (!box._bk && box.dataset.mode === "blocks") box._bk = mount(box, item); });

  /* ============================================================
     THE EDITOR
     ============================================================ */
  function mount(box, item) {
    const st = PENDING.get(box.id) || {};
    PENDING.delete(box.id);
    const path = box.dataset.md, compact = !!st.compact, max = st.max || 0;
    const doc = $("[data-bkdoc]", box), wrap = $("[data-bkwrap]", box), gut = $("[data-bkgut]", box), raw = $("[data-bkraw]", box), dropLine = $("[data-bkdrop]", box);
    const plusBtn = $("[data-bkplus]", gut), grip = $("[data-bkgrip]", gut);
    const changed = E.changed || (() => {});
    let blocks = st.blocks, tail = st.tail || "";
    let cur = blocks?.[0]?.id || null; // the roving block (Tab lands here)
    let selIds = [], selAnchor = null; // block selection
    let gutFor = null;
    const cleanup = [];
    const on = (t, ev, fn, o) => { t.addEventListener(ev, fn, o); cleanup.push(() => t.removeEventListener(ev, fn, o)); };
    S.onLeave(() => { closePops(); cleanup.forEach((f) => f()); });
    try { document.execCommand("styleWithCSS", false, false); } catch (_) {}
    // the browser's own formatting commands fire an input event; ours sync + record once, so that one is muted
    let muted = false;
    const exec = (cmd, val = null) => { muted = true; try { document.execCommand(cmd, false, val); } finally { muted = false; } };

    const byId = (id) => blocks.find((b) => b.id === id) || null;
    const idx = (id) => blocks.findIndex((b) => b.id === id);
    const elOf = (id) => doc.querySelector(`[data-b="${CSS.escape(id)}"]`);
    const hostOf = (el) => (!el ? null : el.matches("[contenteditable]") ? el : el.querySelector("[data-host]") || el);
    const blockOfNode = (n) => { const el = (n?.nodeType === 1 ? n : n?.parentElement)?.closest?.("[data-b]"); return el && doc.contains(el) ? byId(el.dataset.b) : null; };

    /* ---------- text offsets inside a host (a <br> counts as one) ---------- */
    const lenOf = (n) => (n.nodeType === 3 ? n.data.length : n.nodeName === "BR" ? 1 : [...n.childNodes].reduce((s, c) => s + lenOf(c), 0));
    const plain = (n) => (n.nodeType === 3 ? n.data : n.nodeName === "BR" ? "\n" : [...n.childNodes].map(plain).join(""));
    function offsetIn(host, node, off) { const r = document.createRange(); r.setStart(host, 0); try { r.setEnd(node, off); } catch (_) { return 0; } return lenOf(r.cloneContents()); }
    function pointAt(host, off) {
      let n = Math.max(0, off);
      const walk = (node) => {
        for (const c of node.childNodes) {
          if (c.nodeType === 3) { if (n <= c.data.length) return [c, n]; n -= c.data.length; }
          else if (c.nodeName === "BR") { if (n === 0) return [node, [...node.childNodes].indexOf(c)]; n -= 1; }
          else if (c.nodeType === 1) { const r = walk(c); if (r) return r; }
        }
        return null;
      };
      return walk(host) || [host, host.childNodes.length];
    }
    function caret() {
      const s = getSelection();
      if (!s.rangeCount) return null;
      const r = s.getRangeAt(0);
      const b = blockOfNode(r.startContainer); if (!b) return null;
      const el = elOf(b.id), host = hostOf(el);
      if (b.type === "code") { const ta = host; return document.activeElement === ta ? { b, el, host, start: ta.selectionStart, end: ta.selectionEnd, collapsed: ta.selectionStart === ta.selectionEnd, code: true } : null; }
      if (!host.contains(r.startContainer)) return null;
      return { b, el, host, start: offsetIn(host, r.startContainer, r.startOffset), end: host.contains(r.endContainer) ? offsetIn(host, r.endContainer, r.endOffset) : lenOf(host), collapsed: r.collapsed, range: r };
    }
    const caretNow = () => { const c = caret(); return c ? { id: c.b.id, at: c.start } : cur ? { id: cur, at: "end" } : null; };
    function setRange(host, a, z = a) {
      const [n1, o1] = pointAt(host, a), [n2, o2] = pointAt(host, z);
      const r = document.createRange(); r.setStart(n1, o1); r.setEnd(n2, o2);
      const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    }
    function focusBlock(b, at = "end", { scroll = true } = {}) {
      if (!b) return;
      const el = elOf(b.id); if (!el) return;
      setCur(b.id); clearSel(false);
      if (isAtom(b)) { el.focus({ preventScroll: true }); if (scroll) seen(el); return; }
      const host = hostOf(el);
      host.focus({ preventScroll: true });
      if (b.type === "code") { const L = host.value.length; const o = at === "end" ? L : at === "start" ? 0 : Math.min(+at, L); host.setSelectionRange(o, o); }
      else { const L = lenOf(host) - (host.lastChild?.nodeName === "BR" ? 1 : 0); setRange(host, at === "end" ? L : at === "start" ? 0 : Math.min(+at, L)); }
      if (scroll) seen(host);
    }
    // keep a block in view (under the sticky top bar + toolbar, above a docked popover / the keyboard)
    function seen(el) {
      const r = el.getBoundingClientRect(), vv = window.visualViewport;
      const top = 150, bot = (vv ? vv.offsetTop + vv.height : innerHeight) - (openPop?.classList.contains("is-docked") ? openPop.offsetHeight + 24 : 40);
      if (r.top < top) scrollBy({ top: r.top - top, behavior: "instant" });
      else if (r.bottom > bot && r.height < bot - top) scrollBy({ top: r.bottom - bot, behavior: "instant" });
    }

    /* ---------- render ---------- */
    function setCur(id) {
      if (cur === id) return;
      cur = id;
      $$("[data-b]", doc).forEach((el) => { const h = hostOf(el); const t = el.dataset.b === id ? 0 : -1; if (h) h.tabIndex = t; if (h !== el && el.classList.contains("yb-atom")) el.tabIndex = t; });
    }
    function render() {
      if (!blocks.some((b) => b.id === cur)) cur = blocks[0]?.id || null;
      doc.innerHTML = docHTML(blocks, { cur });
      $$(".yb-code__t", doc).forEach(fitCode);
      paintSel(); placeGut();
    }
    function repaint(b) {
      const old = elOf(b.id);
      if (!old || b.type === "li" || old.tagName === "LI") return render();
      const t = document.createElement("div");
      t.innerHTML = blockHTML(b, S.mdCtx(), { cur, ph: "" });
      const nu = t.firstElementChild;
      old.replaceWith(nu);
      if (selIds.includes(b.id)) nu.classList.add("is-bsel");
      placeGut();
    }
    const fitCode = (ta) => { ta.style.height = "auto"; ta.style.height = ta.scrollHeight + "px"; };
    function markEmpty(el) {
      const h = hostOf(el);
      const e = !plain(h).replace(/[​\n]/g, "").trim() && !h.querySelector("img");
      el.classList.toggle("is-empty", e);
      if (e) el.dataset.ph = phFor(byId(el.dataset.b) || { type: "p" }, true); else delete el.dataset.ph;
    }

    /* ---------- model ← DOM ---------- */
    function sync(el) {
      const b = el && byId(el.dataset.b); if (!b) return null;
      if (b.type === "code") { b.code = hostOf(el).value; b.lang = $(".yb-code__lang", el).value.trim(); }
      else if (isText(b)) b.text = M.fromDOM(hostOf(el), { multi: b.type === "quote" });
      b.src = null;
      return b;
    }
    const resetSep = (...bs) => bs.forEach((b) => { if (b) { b.sep = null; b.first = false; } });
    function fix() {
      if (!blocks.length) blocks.push(newP());
      let prev = null;
      for (const b of blocks) {
        if (b.type === "li") { const maxInd = prev?.type === "li" ? (prev.ind || 0) + 1 : 0; if ((b.ind || 0) > maxInd) { b.ind = maxInd; b.src = null; } }
        prev = b;
      }
      // a numbered item whose number changed is rewritten (its source would carry the old one)
      const nums = numbers(blocks);
      for (const b of blocks) if (b.type === "li" && b.list === "ol" && b.src != null && nums.get(b.id) !== b.num) { b.num = nums.get(b.id); b.src = null; }
    }

    /* ---------- save + history ---------- */
    const shape = (bs) => bs.filter((b) => !(b.type === "p" && !String(b.text || "").trim() && b.src == null)).map((b) => `${b.type}${b.level || ""}${b.list || ""}${b.ind || ""}`).join();
    function serialize() {
      let md = M.serialize({ blocks, tail });
      // the written markdown must read back as the same blocks; if a kept blank-line choice breaks that, use the defaults
      if (shape(M.parse(md).blocks) !== shape(blocks)) { blocks.forEach((b) => { if (b.src == null) b.sep = null; }); md = M.serialize({ blocks, tail }); }
      return md;
    }
    const H = { stack: [], i: -1, t: 0, key: "" };
    const snap = () => ({ blocks: JSON.parse(JSON.stringify(blocks)), tail, caret: caretNow() });
    function record(kind, key) {
      const now = performance.now(), s = snap();
      if (kind === "type" && H.key === key && now - H.t < 1000 && H.i === H.stack.length - 1 && H.i > 0) H.stack[H.i] = s;
      else { H.stack.length = H.i + 1; H.stack.push(s); H.i = H.stack.length - 1; if (H.stack.length > 300) { H.stack.shift(); H.i--; } }
      H.t = now; H.key = kind === "type" ? key : "";
      paintHist();
    }
    function commit(kind = "op", key = "") {
      fix();
      const md = serialize();
      const was = String(S.get(item, path) || "");
      if (md !== was) { S.set(item, path, md); changed(path); }
      paintCount(md);
      record(kind, key);
    }
    function restore(s, c) {
      blocks = JSON.parse(JSON.stringify(s.blocks)); tail = s.tail;
      closePops(); clearSel(false);
      render();
      const md = serialize();
      S.set(item, path, md); changed(path); paintCount(md);
      const at = c || s.caret;
      const b = (at && byId(at.id)) || blocks[0];
      focusBlock(b, at && at.id === b.id ? at.at : "end");
      paintHist();
    }
    function undo() { if (H.i <= 0) { Y.sound("nope"); S.say("Nothing to undo"); return; } const c = H.stack[H.i].caret; H.i--; restore(H.stack[H.i], H.stack[H.i].caret || c); S.say("Undone"); }
    function redo() { if (H.i >= H.stack.length - 1) { Y.sound("nope"); S.say("Nothing to redo"); return; } H.i++; restore(H.stack[H.i]); S.say("Redone"); }
    const ub = $("[data-bkundo]", box), rb = $("[data-bkredo]", box);
    function paintHist() { ub.disabled = H.i <= 0; rb.disabled = H.i >= H.stack.length - 1; }
    const wordsEl = $("[data-words]", box), charsEl = $("[data-chars]", box);
    function paintCount(md) {
      wordsEl.textContent = countText(md, compact);
      if (charsEl) { charsEl.textContent = `${md.length} / ${max}`; charsEl.classList.toggle("is-over", md.length > max); }
    }

    /* ============================================================
       STRUCTURE OPS
       ============================================================ */
    function insertAfter(ref, nb) { const i = ref ? idx(ref.id) : blocks.length - 1; blocks.splice(i + 1, 0, nb); resetSep(nb, blocks[i + 2]); return nb; }
    function insertBefore(ref, nb) { const i = idx(ref.id); blocks.splice(i, 0, nb); resetSep(nb, ref); return nb; }
    function remove(list, { focus = "prev" } = {}) {
      const ids = new Set(list.map((b) => b.id));
      const first = blocks.findIndex((b) => ids.has(b.id));
      blocks = blocks.filter((b) => !ids.has(b.id));
      resetSep(blocks[first]);
      if (!blocks.length) blocks.push(newP());
      render();
      const to = focus === "next" ? blocks[first] || blocks[first - 1] : blocks[first - 1] || blocks[first];
      if (to) focusBlock(to, focus === "next" ? "start" : "end");
      return to;
    }
    function turnInto(b, k, { at = null, num = 1, mark = "" } = {}) {
      const from = kOf(b);
      if (from === k) return;
      const el = elOf(b.id); if (el && (isText(b) || b.type === "code")) sync(el);
      const c = caret(); const pos = at ?? (c && c.b === b ? c.start : "end");
      let text = isText(b) ? b.text || "" : b.type === "code" ? String(b.code || "").split("\n").map((l) => M.escText(l)).join("\\\n") : "";
      const flat = (t) => t.replace(/\n\n/g, "\\\n");
      Object.keys(b).forEach((key) => { if (!["id", "sep", "first"].includes(key)) delete b[key]; });
      if (k === "code") Object.assign(b, { type: "code", lang: "", code: text.split(/\\\n|\n\n/).map((l) => M.inlineText(l)).join("\n"), fence: "```" });
      else if (/^h\d$/.test(k)) Object.assign(b, { type: "h", level: +k[1], text: flat(text).replace(/\\\n/g, " ") });
      else if (k === "ul" || k === "ol") Object.assign(b, { type: "li", list: k, ind: 0, num, mark: mark || (k === "ol" ? "." : "-"), text: flat(text) });
      else if (k === "quote") Object.assign(b, { type: "quote", text });
      else Object.assign(b, { type: "p", text: flat(text) });
      b.src = null; resetSep(b, blocks[idx(b.id) + 1]);
      render(); focusBlock(b, pos);
      commit("op");
      S.say(`${NAME[k] || k}`);
    }
    function moveBlocks(list, dir) {
      const ids = new Set(list.map((b) => b.id));
      const pos = blocks.map((b, i) => (ids.has(b.id) ? i : -1)).filter((i) => i >= 0);
      const a = pos[0], z = pos[pos.length - 1];
      if (dir < 0 ? a === 0 : z === blocks.length - 1) { Y.sound("nope"); S.say(dir < 0 ? "Already at the top" : "Already at the bottom"); return; }
      const moving = blocks.filter((b) => ids.has(b.id)), rest = blocks.filter((b) => !ids.has(b.id));
      const at = dir < 0 ? a - 1 : a + 1;
      const keepFocus = caretNow(), wasSel = selIds.slice();
      resetSep(...moving, blocks[a], blocks[z + 1], blocks[at], blocks[at + moving.length]);
      rest.splice(at, 0, ...moving); blocks = rest;
      fix(); resetSep(blocks[at + moving.length]);
      flip(() => render());
      if (wasSel.length) selectBlocks(wasSel.map(byId).filter(Boolean));
      else if (keepFocus) focusBlock(byId(keepFocus.id), keepFocus.at);
      commit("op");
      Y.sound("drop");
      S.say(`Moved to ${at + 1} of ${blocks.length}`);
    }
    function moveTo(list, to) { // to = index in the list without the moving blocks
      const ids = new Set(list.map((b) => b.id));
      const from = blocks.findIndex((b) => ids.has(b.id));
      const moving = blocks.filter((b) => ids.has(b.id)), rest = blocks.filter((b) => !ids.has(b.id));
      if (to === from) return false;
      resetSep(...moving, blocks[from + moving.length], rest[to]);
      rest.splice(to, 0, ...moving); blocks = rest;
      fix(); resetSep(blocks[to + moving.length]);
      return true;
    }
    function duplicate(list) {
      const last = list[list.length - 1];
      const copies = list.map((b) => ({ ...JSON.parse(JSON.stringify(b)), id: bid(), sep: null, first: false }));
      const i = idx(last.id);
      blocks.splice(i + 1, 0, ...copies); resetSep(blocks[i + 1 + copies.length]);
      render();
      if (selIds.length) selectBlocks(copies); else focusBlock(copies[copies.length - 1], "end");
      commit("op"); Y.sound("token-add");
      S.say(copies.length > 1 ? `Duplicated ${copies.length} blocks` : `Duplicated`);
    }
    const flip = (fn) => (Y.flip ? Y.flip(doc, "[data-b]", fn, { key: (el) => el.dataset.b, enter: false }) : fn());

    /* ---------- split / merge (Enter, Backspace, Delete) ---------- */
    function enter(c) {
      const { b, el, host } = c;
      if (b.type === "li" && !plain(host).replace(/​/g, "").trim()) {
        if ((b.ind || 0) > 0) { b.ind--; b.src = null; resetSep(b); render(); focusBlock(b, 0); commit("op"); S.say("Outdented"); }
        else turnInto(b, "p", { at: 0 });
        return;
      }
      if (!c.collapsed) { c.range.deleteContents(); sync(el); }
      const pos = caret();
      const type = b.type === "li" ? "li" : "p";
      const mk = () => (type === "li" ? { id: bid(), type: "li", list: b.list, ind: b.ind || 0, mark: b.mark, num: (b.num || 1) + 1, text: "", src: null, sep: null } : newP());
      if (pos.start === 0 && lenOf(host) > 0 && plain(host).replace(/​/g, "").trim()) {
        // at the very start: a new empty block above, the caret stays put
        insertBefore(b, mk()); render(); focusBlock(b, 0); commit("op"); return;
      }
      const r = document.createRange(); r.setStart(pos.range.startContainer, pos.range.startOffset); r.setEnd(host, host.childNodes.length);
      const tmp = document.createElement("div"); tmp.appendChild(r.extractContents());
      sync(el);
      const nb = mk();
      nb.text = M.fromDOM(tmp, { multi: false });
      insertAfter(b, nb);
      render(); focusBlock(nb, "start"); commit("op");
    }
    function lineBreak(c) {
      if (c.b.type === "h") return enter(c);
      const r = c.range; r.deleteContents();
      const br = document.createElement("br"); r.insertNode(br);
      // a <br> at the very end needs a second one to show the new line
      if (!br.nextSibling || (br.nextSibling.nodeType === 3 && !br.nextSibling.data && !br.nextSibling.nextSibling)) br.after(document.createElement("br"));
      const s = getSelection(), r2 = document.createRange(); r2.setStartAfter(br); r2.collapse(true); s.removeAllRanges(); s.addRange(r2);
      sync(c.el); commit("op");
    }
    function backspaceStart(c) {
      const { b, el } = c;
      if (b.type === "li") { if ((b.ind || 0) > 0) { b.ind--; b.src = null; render(); focusBlock(b, 0); commit("op"); S.say("Outdented"); } else turnInto(b, "p", { at: 0 }); return; }
      if (b.type === "h" || b.type === "quote") { turnInto(b, "p", { at: 0 }); return; }
      const i = idx(b.id), prev = blocks[i - 1];
      if (!prev) return;
      const emptyMe = !plain(hostOf(el)).replace(/​/g, "").trim();
      if (isText(prev)) {
        const ph2 = hostOf(elOf(prev.id));
        while (ph2.lastChild?.nodeName === "BR") ph2.lastChild.remove();
        const at = lenOf(ph2);
        const mine = hostOf(el); while (mine.lastChild?.nodeName === "BR") mine.lastChild.remove();
        ph2.insertAdjacentHTML("beforeend", mine.innerHTML);
        sync(elOf(prev.id));
        blocks.splice(i, 1); resetSep(blocks[i]);
        render(); focusBlock(prev, at); commit("op");
        return;
      }
      if (prev.type === "code") { if (emptyMe) { blocks.splice(i, 1); render(); commit("op"); } focusBlock(prev, "end"); return; }
      if (emptyMe) { blocks.splice(i, 1); resetSep(blocks[i]); render(); commit("op"); }
      selectBlocks([prev]);
    }
    function deleteEnd(c) {
      const { b } = c, i = idx(b.id), next = blocks[i + 1];
      if (!next) return;
      if (isText(next)) {
        const at = lenOf(c.host);
        const nh = hostOf(elOf(next.id)); while (nh.lastChild?.nodeName === "BR") nh.lastChild.remove();
        while (c.host.lastChild?.nodeName === "BR") c.host.lastChild.remove();
        c.host.insertAdjacentHTML("beforeend", nh.innerHTML);
        sync(c.el); blocks.splice(i + 1, 1); resetSep(blocks[i + 1]);
        render(); focusBlock(b, at); commit("op");
      } else if (isAtom(next)) selectBlocks([next]);
    }
    function indent(c, dir) {
      const { b } = c;
      if (b.type !== "li") return false;
      const i = idx(b.id), prev = blocks[i - 1];
      if (dir > 0) { if (prev?.type !== "li" || (b.ind || 0) > (prev.ind || 0)) { Y.sound("nope"); return true; } b.ind = (b.ind || 0) + 1; }
      else { if (!(b.ind > 0)) { Y.sound("nope"); return true; } b.ind--; }
      b.src = null; resetSep(b);
      const at = c.start; render(); focusBlock(b, at); commit("op");
      S.say(dir > 0 ? "Indented" : "Outdented");
      return true;
    }

    /* ---------- caret on the first / last line (arrow keys leave the block) ---------- */
    function caretRect() {
      const s = getSelection(); if (!s.rangeCount) return null;
      const r = s.getRangeAt(0).cloneRange(); r.collapse(true);
      let rc = r.getClientRects()[0];
      if (!rc) {
        const n = r.startContainer, o = r.startOffset;
        if (n.nodeType === 3 && n.data.length) { const r2 = document.createRange(); if (o < n.data.length) { r2.setStart(n, o); r2.setEnd(n, o + 1); } else { r2.setStart(n, o - 1); r2.setEnd(n, o); } const q = r2.getClientRects(); rc = q[q.length - 1]; if (rc && o >= n.data.length) rc = { top: rc.top, bottom: rc.bottom, left: rc.right, right: rc.right }; }
      }
      return rc || null;
    }
    function edge(host, which) {
      if (!plain(host).replace(/[​\n]/g, "")) return true;
      const rc = caretRect(); if (!rc) return true;
      const hr = host.getBoundingClientRect(), cs = getComputedStyle(host);
      const lh = parseFloat(cs.lineHeight) || 26;
      return which === "up" ? rc.top - (hr.top + parseFloat(cs.paddingTop)) < lh * 0.7 : hr.bottom - parseFloat(cs.paddingBottom) - rc.bottom < lh * 0.7;
    }
    function goVert(b, dir) {
      const i = idx(b.id), to = blocks[i + dir];
      if (!to) return false;
      if (isAtom(to)) { selectBlocks([to]); return true; }
      const rc = caretRect();
      if (rc && document.caretRangeFromPoint && isText(to)) {
        const h = hostOf(elOf(to.id)), hr = h.getBoundingClientRect(), cs = getComputedStyle(h), lh = parseFloat(cs.lineHeight) || 26;
        const y = dir < 0 ? hr.bottom - parseFloat(cs.paddingBottom) - lh / 2 : hr.top + parseFloat(cs.paddingTop) + lh / 2;
        const r = document.caretRangeFromPoint(Math.min(Math.max(rc.left, hr.left + 1), hr.right - 1), y);
        if (r && h.contains(r.startContainer)) { setCur(to.id); clearSel(false); h.focus({ preventScroll: true }); const s = getSelection(); s.removeAllRanges(); s.addRange(r); seen(h); return true; }
      }
      focusBlock(to, dir < 0 ? "end" : "start");
      return true;
    }

    /* ============================================================
       INPUT RULES (markdown shortcuts as you type)
       ============================================================ */
    function blockRule(c, data) {
      const { b, el, host } = c;
      if (b.type !== "p" || !c.collapsed) return false;
      const before = plain(host).slice(0, c.start).replace(/ /g, " ");
      const cut = () => { setRange(host, 0, c.start); getSelection().getRangeAt(0).deleteContents(); sync(el); };
      let m;
      if (data === " ") {
        if ((m = before.match(/^(#{1,4}) $/))) { cut(); turnInto(b, `h${m[1].length}`, { at: 0 }); return true; }
        if ((m = before.match(/^([-*+]) $/))) { cut(); turnInto(b, "ul", { at: 0, mark: m[1] }); return true; }
        if ((m = before.match(/^(\d{1,9})([.)]) $/))) { cut(); turnInto(b, "ol", { at: 0, num: +m[1], mark: m[2] }); return true; }
        if (/^> $/.test(before)) { cut(); turnInto(b, "quote", { at: 0 }); return true; }
      }
      if (data === "`" && before === "```") { cut(); turnInto(b, "code", { at: 0 }); return true; }
      if ((data === "-" || data === "*" || data === "_") && /^(-{3}|\*{3}|_{3})$/.test(before) && plain(host).replace(/​/g, "").trim() === before) {
        const hr = { id: bid(), type: "hr", src: null, sep: null };
        const i = idx(b.id);
        blocks.splice(i, 1, hr); resetSep(blocks[i + 1]);
        const np = insertAfter(hr, newP());
        render(); focusBlock(np, "start"); commit("op"); S.say("Divider");
        return true;
      }
      return false;
    }
    const ZW = "​";
    function inlineRule(c, data) {
      if (!"*_`~)".includes(data) || !c.collapsed) return false;
      const s0 = getSelection(), node = s0.anchorNode, off = s0.anchorOffset;
      if (node?.nodeType !== 3 || node.parentElement.closest("code, a")) return false;
      const s = node.data.slice(0, off); // (a zero-width mark from an earlier shortcut may start the node; it never ends a match)
      let m, tag = "", inner = "", href = "", len = 0;
      if (data === "`" && (m = s.match(/`([^`]+)`$/))) { tag = "code"; inner = m[1]; len = m[0].length; }
      else if ((data === "*" || data === "_") && (m = s.match(/(^|[^*_\\])(\*\*|__)([^*_\s](?:[^*_]*[^*_\s])?)\2$/)) && (m[2] === "**" || !/\w/.test(m[1]))) { tag = "strong"; inner = m[3]; len = m[0].length - m[1].length; }
      else if (data === "*" && (m = s.match(/(^|[^*\\])\*([^*\s](?:[^*]*[^*\s])?)\*$/))) { tag = "em"; inner = m[2]; len = m[0].length - m[1].length; }
      else if (data === "_" && (m = s.match(/(^|[^\w_\\])_([^_\s](?:[^_]*[^_\s])?)_$/))) { tag = "em"; inner = m[2]; len = m[0].length - m[1].length; }
      else if (data === "~" && (m = s.match(/~~([^~\s](?:[^~]*[^~\s])?)~~$/))) { tag = "del"; inner = m[1]; len = m[0].length; }
      else if (data === ")" && (m = s.match(/\[([^\]]+)\]\(([^)\s]+)\)$/))) { tag = "a"; inner = m[1]; href = m[2]; len = m[0].length; }
      if (!tag) return false;
      const r = document.createRange(); r.setStart(node, off - len); r.setEnd(node, off); r.deleteContents();
      const elx = document.createElement(tag); elx.textContent = inner; if (href) elx.setAttribute("href", href);
      r.insertNode(elx);
      const z = document.createTextNode(ZW); elx.after(z);
      const r2 = document.createRange(); r2.setStart(z, 1); r2.collapse(true); s0.removeAllRanges(); s0.addRange(r2);
      return true;
    }

    /* ============================================================
       FORMATTING (bar, keys)
       ============================================================ */
    const fmtBtns = $$("[data-bkfmt]", box);
    function paintFmt() {
      const c = caret(), on = (sel) => { if (!c || !isText(c.b)) return false; const n = c.range.startContainer; const e2 = n.nodeType === 1 ? n : n.parentElement; return !!e2?.closest(sel); };
      [...fmtBtns, ...(kbar ? $$("[data-bkfmt]", kbar) : [])].forEach((bt) => bt.setAttribute("aria-pressed", String(on({ bold: "strong, b", italic: "em, i", code: "code", link: "a" }[bt.dataset.bkfmt]))));
    }

    /* ---------- phones: the keyboard bar (+ · B I code link · undo redo · done), docked above the on-screen keyboard
       while a block has the cursor, like a phone notes app; the editor's own bar stays in the flow ---------- */
    let kbar = null, kbarT = 0;
    const vvOf = () => window.visualViewport || { offsetTop: 0, offsetLeft: 0, height: innerHeight, width: innerWidth };
    function placeKbar() {
      if (!kbar || kbar.hidden) return;
      const vv = vvOf();
      kbar.style.left = `${vv.offsetLeft + 8}px`; kbar.style.width = `${vv.width - 16}px`;
      kbar.style.top = `${vv.offsetTop + vv.height - kbar.offsetHeight - 8}px`;
    }
    function kbarShow() {
      if (!phone() || box.dataset.mode !== "blocks") return;
      clearTimeout(kbarT);
      if (!kbar) {
        kbar = document.createElement("div");
        kbar.className = "st-bk__kbar";
        kbar.setAttribute("role", "toolbar"); kbar.setAttribute("aria-label", `${st.label || "Editor"} tools`);
        kbar.innerHTML = `<button type="button" class="st-bk__tb st-bk__tb--ins" data-k="plus" aria-label="Add a block"><i class="ph-bold ph-plus" aria-hidden="true"></i><span>Block</span></button>
          ${tog("bold", "ph-text-b", "Bold", "⌘B")}${tog("italic", "ph-text-italic", "Italic", "⌘I")}${tog("code", "ph-code-simple", "Inline code", "⌘E")}${tog("link", "ph-link-simple", "Link", "⌘K")}
          ${tb('data-k="undo"', "ph-arrow-counter-clockwise", "Undo", "⌘Z")}<button type="button" class="st-bk__tb" data-k="done" aria-label="Done: hide the keyboard"><i class="ph-bold ph-caret-down" aria-hidden="true"></i></button>`;
        S.layer().appendChild(kbar);
        kbar.addEventListener("pointerdown", (e) => { if (e.target.closest("button")) e.preventDefault(); });
        kbar.addEventListener("click", (e) => {
          const bt = e.target.closest("button"); if (!bt) return;
          if (bt.dataset.bkfmt) { format(bt.dataset.bkfmt); return; }
          const k = bt.dataset.k;
          if (k === "plus") { const c = caret(); if (c && isText(c.b)) sync(c.el); plusAt(c?.b || byId(cur)); }
          else if (k === "undo") undo();
          else if (k === "done") { closePops(); document.activeElement?.blur?.(); kbarHide(true); }
        });
        cleanup.push(() => kbar?.remove());
        const mv = () => placeKbar();
        window.visualViewport?.addEventListener("resize", mv); window.visualViewport?.addEventListener("scroll", mv);
        cleanup.push(() => { window.visualViewport?.removeEventListener("resize", mv); window.visualViewport?.removeEventListener("scroll", mv); });
      }
      kbar.hidden = false; html.classList.add("st-bk-kbar"); placeKbar(); paintFmt();
    }
    function kbarHide(now = false) {
      clearTimeout(kbarT);
      const go = () => { if (!kbar) return; if (!now && (doc.contains(document.activeElement) || openPop)) return; kbar.hidden = true; html.classList.remove("st-bk-kbar"); };
      now ? go() : (kbarT = setTimeout(go, 160));
    }
    const html = document.documentElement;
    cleanup.push(() => html.classList.remove("st-bk-kbar"));
    function format(kind) {
      const c = caret();
      if (!c || !isText(c.b)) { Y.sound("nope"); S.say("Put the cursor in a text block first"); return; }
      if (kind === "bold") exec("bold");
      else if (kind === "italic") exec("italic");
      else if (kind === "strike") exec("strikeThrough");
      else if (kind === "code") {
        const n = c.range.startContainer, inCode = (n.nodeType === 1 ? n : n.parentElement).closest("code");
        if (inCode && c.host.contains(inCode)) { inCode.replaceWith(document.createTextNode(inCode.textContent)); }
        else if (!c.collapsed) { const t = c.range.toString(); c.range.deleteContents(); const k = document.createElement("code"); k.textContent = t; c.range.insertNode(k); const r = document.createRange(); r.selectNodeContents(k); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
        else { Y.sound("nope"); S.say("Select some text to make it code"); return; }
      } else if (kind === "link") return linkForm(c);
      sync(c.el); commit("op"); paintFmt();
    }

    /* ============================================================
       BLOCK SELECTION (Esc, a drag across blocks, the handle)
       ============================================================ */
    function paintSel() { $$("[data-b]", doc).forEach((el) => el.classList.toggle("is-bsel", selIds.includes(el.dataset.b))); }
    function selectBlocks(list, { focus = true, say = true } = {}) {
      list = list.filter(Boolean);
      if (!list.length) return;
      selIds = list.map((b) => b.id); selAnchor ||= selIds[0];
      setCur(selIds[0]);
      paintSel();
      if (focus) { getSelection().removeAllRanges(); doc.focus({ preventScroll: true }); }
      seen(elOf(selIds[selIds.length - 1]));
      placeGut(byId(selIds[0]));
      if (say) S.say(list.length > 1 ? `${list.length} blocks selected` : `${nameOf(list[0])} selected. Enter edits it.`);
    }
    function clearSel(paint = true) { if (!selIds.length) return; selIds = []; selAnchor = null; if (paint) paintSel(); else $$(".is-bsel", doc).forEach((e) => e.classList.remove("is-bsel")); }
    const selected = () => blocks.filter((b) => selIds.includes(b.id));
    const mdOf = (list) => M.serialize({ blocks: list.map((b, i) => ({ ...b, sep: i ? b.sep : null, first: false })), tail: "" });
    function editBlock(b) {
      clearSel();
      if (isAtom(b) && b.type !== "hr") { openForm(b); return; }
      focusBlock(b, "end");
    }
    function selKey(e) {
      const mod = e.metaKey || e.ctrlKey, list = selected();
      if (!list.length) return;
      const first = idx(list[0].id), last = idx(list[list.length - 1].id);
      const k = e.key;
      if ((e.altKey && e.shiftKey) || (mod && e.shiftKey)) { if (k === "ArrowUp" || k === "ArrowDown") { e.preventDefault(); moveBlocks(list, k === "ArrowUp" ? -1 : 1); return; } }
      if (k === "ArrowUp" || k === "ArrowDown") {
        e.preventDefault();
        const dir = k === "ArrowUp" ? -1 : 1;
        if (e.shiftKey) {
          const a = idx(selAnchor), f = (selIds.length === 1 ? a : idx(selIds[0]) === a ? last : first) + dir;
          if (f < 0 || f >= blocks.length) return;
          const lo = Math.min(a, f), hi = Math.max(a, f);
          selectBlocks(blocks.slice(lo, hi + 1), { say: false }); S.say(`${hi - lo + 1} blocks selected`);
        } else { const t = blocks[dir < 0 ? first - 1 : last + 1]; if (t) { selAnchor = null; selectBlocks([t]); } }
        return;
      }
      if (k === "Enter") { e.preventDefault(); editBlock(list[0]); return; }
      if (k === "Backspace" || k === "Delete") { e.preventDefault(); const n = list.length; clearSel(false); remove(list, { focus: k === "Delete" ? "next" : "prev" }); commit("op"); Y.sound("tag-remove"); S.say(n > 1 ? `Deleted ${n} blocks` : "Block deleted"); return; }
      if (k === "Escape") { e.preventDefault(); const b = list[0]; clearSel(); focusBlock(b, "end"); return; }
      if (mod && k.toLowerCase() === "a") { e.preventDefault(); selAnchor = blocks[0].id; selectBlocks(blocks.slice()); return; }
      if (mod && k.toLowerCase() === "d") { e.preventDefault(); duplicate(list); return; }
      if (mod && k.toLowerCase() === "z") { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
      if (mod && k === "/") { e.preventDefault(); openMenu(list[0], grip); return; }
    }

    /* ============================================================
       KEYS
       ============================================================ */
    on(doc, "keydown", (e) => {
      if (e.isComposing || e.keyCode === 229) return;
      if (slash.el && slash.key(e)) return;
      if (e.target === doc) return selKey(e);
      const bEl = e.target.closest?.("[data-b]"); if (!bEl) return;
      const b = byId(bEl.dataset.b); if (!b) return;
      const mod = e.metaKey || e.ctrlKey, k = e.key, kl = k.length === 1 ? k.toLowerCase() : k;
      if (e.target.matches(".yb-code__lang")) { if (k === "Enter" || k === "Escape") { e.preventDefault(); focusBlock(b, "end"); } return; }
      if (mod && !e.altKey && kl === "z") { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
      if (mod && kl === "y") { e.preventDefault(); redo(); return; }
      if (((e.altKey && e.shiftKey) || (mod && e.shiftKey)) && (k === "ArrowUp" || k === "ArrowDown")) { e.preventDefault(); if (isText(b)) sync(bEl); moveBlocks([b], k === "ArrowUp" ? -1 : 1); return; }
      if (mod && kl === "d") { e.preventDefault(); if (isText(b)) sync(bEl); duplicate([b]); return; }
      if (mod && k === "/") { e.preventDefault(); openMenu(b, grip); return; }
      if (isAtom(b)) return atomKey(e, b);
      if (b.type === "code") return codeKey(e, b, bEl);
      if (mod && !e.shiftKey && !e.altKey && (kl === "b" || kl === "i" || kl === "e" || kl === "k")) { e.preventDefault(); format({ b: "bold", i: "italic", e: "code", k: "link" }[kl]); return; }
      if (mod && e.shiftKey && (kl === "x" || kl === "s")) { e.preventDefault(); format("strike"); return; }
      const c = caret(); if (!c) return;
      if (k === "Enter") { e.preventDefault(); e.shiftKey ? lineBreak(c) : enter(c); return; }
      if (k === "Backspace" && c.collapsed && c.start === 0 && !mod) { e.preventDefault(); backspaceStart(c); return; }
      if (k === "Delete" && c.collapsed && c.start >= lenOf(c.host) - (c.host.lastChild?.nodeName === "BR" ? 1 : 0)) { e.preventDefault(); deleteEnd(c); return; }
      if (k === "Tab" && b.type === "li") { e.preventDefault(); sync(bEl); indent(c, e.shiftKey ? -1 : 1); return; }
      if (k === "Escape") { e.preventDefault(); sync(bEl); selAnchor = null; selectBlocks([b]); return; }
      if (mod && kl === "a") {
        const L = lenOf(c.host) - (c.host.lastChild?.nodeName === "BR" ? 1 : 0);
        if (c.start === 0 && c.end >= L) { e.preventDefault(); selAnchor = blocks[0].id; selectBlocks(blocks.slice()); }
        return;
      }
      if (e.shiftKey || e.altKey || mod) return;
      if (k === "ArrowUp" && edge(c.host, "up")) { if (goVert(b, -1)) e.preventDefault(); return; }
      if (k === "ArrowDown" && edge(c.host, "down")) { if (goVert(b, 1)) e.preventDefault(); return; }
      if (k === "ArrowLeft" && c.collapsed && c.start === 0) { const p = blocks[idx(b.id) - 1]; if (p) { e.preventDefault(); isAtom(p) ? selectBlocks([p]) : focusBlock(p, "end"); } return; }
      if (k === "ArrowRight" && c.collapsed && c.start >= lenOf(c.host) - (c.host.lastChild?.nodeName === "BR" ? 1 : 0)) { const n2 = blocks[idx(b.id) + 1]; if (n2) { e.preventDefault(); isAtom(n2) ? selectBlocks([n2]) : focusBlock(n2, "start"); } }
    });
    function atomKey(e, b) {
      const k = e.key;
      if (k === "Enter" || k === " ") { e.preventDefault(); if (b.type === "hr") { const np = insertAfter(b, newP()); render(); focusBlock(np); commit("op"); } else openForm(b); return; }
      if (k === "Backspace" || k === "Delete") { e.preventDefault(); remove([b], { focus: k === "Delete" ? "next" : "prev" }); commit("op"); Y.sound("tag-remove"); S.say(`${nameOf(b)} deleted`); return; }
      if (k === "ArrowUp" || k === "ArrowLeft") { const p = blocks[idx(b.id) - 1]; if (p) { e.preventDefault(); isAtom(p) ? focusBlock(p) : focusBlock(p, "end"); } return; }
      if (k === "ArrowDown" || k === "ArrowRight") { const n2 = blocks[idx(b.id) + 1]; e.preventDefault(); if (n2) isAtom(n2) ? focusBlock(n2) : focusBlock(n2, "start"); else { const np = insertAfter(b, newP()); render(); focusBlock(np); commit("op"); } return; }
      if (k === "Escape") { e.preventDefault(); selAnchor = null; selectBlocks([b]); return; }
      // just start typing: a new text block right after it
      if (k.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        const np = insertAfter(b, newP(M.escText(k))); render(); focusBlock(np, "end"); commit("op");
        if (k === "/") { const h = hostOf(elOf(np.id)); setRange(h, 1); slash.show(np, 0, "slash"); }
      }
    }
    function codeKey(e, b, el) {
      const ta = hostOf(el), k = e.key, mod = e.metaKey || e.ctrlKey;
      if (k === "Tab" && !e.shiftKey && !mod) { e.preventDefault(); document.execCommand("insertText", false, "  "); return; }
      if (k === "Escape") { e.preventDefault(); sync(el); selAnchor = null; selectBlocks([b]); return; }
      if (k === "Enter" && mod) { e.preventDefault(); const nx = blocks[idx(b.id) + 1]; if (nx && isText(nx) && !String(nx.text || "").trim()) focusBlock(nx, "start"); else { const np = insertAfter(b, newP()); render(); focusBlock(np); commit("op"); } return; }
      const s = ta.selectionStart, z = ta.selectionEnd, v = ta.value;
      if (k === "Backspace" && s === 0 && z === 0 && !v) { e.preventDefault(); turnInto(b, "p", { at: 0 }); return; }
      if (k === "ArrowUp" && s === z && !v.slice(0, s).includes("\n")) { if (goVert(b, -1)) e.preventDefault(); return; }
      if (k === "ArrowDown" && s === z && !v.slice(s).includes("\n")) { const n2 = blocks[idx(b.id) + 1]; e.preventDefault(); if (n2) goVert(b, 1); else { const np = insertAfter(b, newP()); render(); focusBlock(np); commit("op"); } }
    }
    // phones (and anything without a usable keydown): the same structure ops from beforeinput
    on(doc, "beforeinput", (e) => {
      const t = e.inputType;
      if (t === "historyUndo" || t === "historyRedo") { const b = blockOfNode(e.target); if (b?.type === "code") return; e.preventDefault(); t === "historyUndo" ? undo() : redo(); return; }
      const b = blockOfNode(e.target); if (!b || !isText(b)) return;
      const c = caret(); if (!c) return;
      if (t === "insertParagraph") { e.preventDefault(); enter(c); }
      else if (t === "insertLineBreak") { e.preventDefault(); lineBreak(c); }
      else if (t === "deleteContentBackward" && c.collapsed && c.start === 0) { e.preventDefault(); backspaceStart(c); }
      else if (t === "formatBold" || t === "formatItalic" || t === "formatUnderline") { if (t === "formatUnderline") e.preventDefault(); }
    });
    on(doc, "input", (e) => {
      if (muted) return; // (an exec() of ours: the op records itself once)
      const bEl = e.target.closest?.("[data-b]"); if (!bEl) return;
      const b = byId(bEl.dataset.b); if (!b) return;
      if (b.type === "code") { if (e.target.matches(".yb-code__t")) fitCode(e.target); sync(bEl); commit("type", b.id); placeGut(); return; }
      if (!isText(b)) return;
      clearSel();
      const c = caret();
      if (c && e.inputType === "insertText" && !e.isComposing && e.data) {
        if (blockRule(c, e.data)) return;
        if (e.data === "/" && /(^|\s)$/.test(plain(c.host).slice(0, c.start - 1).replace(/ /g, " "))) { sync(bEl); markEmpty(bEl); commit("type", b.id); slash.show(b, c.start - 1, "slash"); return; }
        if (inlineRule(c, e.data)) {}
      }
      sync(bEl); markEmpty(bEl);
      if (slash.el && slash.b === b) slash.input();
      commit("type", b.id);
      placeGut();
    });
    on(doc, "focusin", (e) => {
      const bEl = e.target.closest?.("[data-b]");
      if (bEl) { setCur(bEl.dataset.b); placeGut(byId(bEl.dataset.b)); const b = byId(bEl.dataset.b); if (isText(b)) markEmpty(bEl); if (selIds.length && !selIds.includes(bEl.dataset.b)) clearSel(); }
      if (bEl && (isText(byId(bEl.dataset.b)) || byId(bEl.dataset.b)?.type === "code")) kbarShow();
    });
    on(document, "selectionchange", () => { if (doc.contains(document.activeElement)) paintFmt(); });
    on(doc, "focusout", (e) => {
      // an empty block that loses focus drops its hint
      const bEl = e.target.closest?.("[data-b]");
      if (bEl && bEl.classList.contains("is-empty") && blocks.length > 1 && bEl.tagName === "P") delete bEl.dataset.ph;
      if (!e.relatedTarget || !(doc.contains(e.relatedTarget) || kbar?.contains(e.relatedTarget))) kbarHide();
    });

    /* ---------- copy / cut / paste ---------- */
    on(doc, "copy", (e) => clip(e, false));
    on(doc, "cut", (e) => clip(e, true));
    function clip(e, cut) {
      if (document.activeElement === doc && selIds.length) {
        const list = selected();
        e.preventDefault(); e.clipboardData.setData("text/plain", mdOf(list));
        try { e.clipboardData.setData("text/html", M.own(mdOf(list))); } catch (_) {}
        if (cut) { clearSel(false); remove(list); commit("op"); S.say("Cut"); }
        return;
      }
      const b = blockOfNode(e.target); if (!b || !isText(b)) return;
      const s = getSelection(); if (s.isCollapsed) return;
      const r = s.getRangeAt(0), div = document.createElement("div"); div.appendChild(r.cloneContents());
      e.preventDefault(); e.clipboardData.setData("text/plain", M.fromDOM(div, { multi: true })); e.clipboardData.setData("text/html", div.innerHTML);
      if (cut) { r.deleteContents(); sync(elOf(b.id)); commit("op"); }
    }
    on(doc, "paste", (e) => {
      const text = (e.clipboardData?.getData("text/plain") || "").replace(/\r\n?/g, "\n");
      if (e.target.matches?.(".yb-code__t, .yb-code__lang")) return;
      if (document.activeElement === doc && selIds.length) {
        e.preventDefault(); if (!text) return;
        const list = selected(), at = idx(list[0].id);
        const nb = M.parse(text).blocks.map(withId);
        blocks.splice(at, list.length, ...nb); resetSep(nb[0], blocks[at + nb.length]); clearSel(false);
        render(); focusBlock(nb[nb.length - 1] || blocks[at], "end"); commit("op"); S.say(`Pasted ${nb.length} block${nb.length === 1 ? "" : "s"}`);
        return;
      }
      const b = blockOfNode(e.target); if (!b || !isText(b)) return;
      e.preventDefault();
      if (!text) return;
      const c = caret(); if (!c) return;
      if (/^\s*https?:\/\/\S+\s*$/.test(text) && !c.collapsed) { exec("createLink", text.trim()); sync(c.el); commit("op"); return; }
      const parsed = M.parse(text).blocks;
      if (!parsed.length) return;
      if (parsed.length === 1 && parsed[0].type === "p") {
        c.range.deleteContents();
        const frag = c.range.createContextualFragment(M.inline(parsed[0].text, { soft: " " }));
        const lastN = frag.lastChild; c.range.insertNode(frag);
        if (lastN) { const r = document.createRange(); r.setStartAfter(lastN); r.collapse(true); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
        sync(c.el); markEmpty(c.el); commit("op"); return;
      }
      // several blocks: split here, the pasted blocks go in between (each keeps its exact markdown)
      c.range.deleteContents();
      const r = document.createRange(); r.setStart(c.range.startContainer, c.range.startOffset); r.setEnd(c.host, c.host.childNodes.length);
      const tmp = document.createElement("div"); tmp.appendChild(r.extractContents());
      sync(c.el);
      const after = M.fromDOM(tmp);
      const nb = parsed.map(withId);
      let at = idx(b.id) + 1;
      if (!String(b.text || "").trim()) { blocks.splice(at - 1, 1); at--; }
      blocks.splice(at, 0, ...nb); resetSep(nb[0]);
      let tailB = null;
      if (after.trim()) { tailB = { ...(b.type === "li" ? { type: "li", list: b.list, ind: b.ind, mark: b.mark } : { type: "p" }), id: bid(), text: after, src: null, sep: null }; blocks.splice(at + nb.length, 0, tailB); }
      resetSep(blocks[at + nb.length + (tailB ? 1 : 0)]);
      render(); focusBlock(nb[nb.length - 1], "end"); commit("op");
      S.say(`Pasted ${nb.length} blocks`);
    });

    /* ---------- pointer: a drag across blocks selects them; a click below the last block adds one ---------- */
    let dsel = null;
    on(doc, "pointerdown", (e) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      const b = blockOfNode(e.target);
      dsel = b ? { from: b.id, on: false } : null;
      // shift-click while blocks are selected extends the selection to the clicked block
      if (b && e.shiftKey && selIds.length) { e.preventDefault(); const a = idx(selAnchor || selIds[0]), z = idx(b.id); selectBlocks(blocks.slice(Math.min(a, z), Math.max(a, z) + 1)); dsel = null; return; }
      if (selIds.length) clearSel();
    });
    on(doc, "pointermove", (e) => {
      if (e.pointerType === "mouse" && !drag) hoverGut(e);
      if (!dsel || !(e.buttons & 1)) return;
      const over = blockOfNode(document.elementFromPoint(e.clientX, e.clientY));
      if (!over) return;
      if (over.id !== dsel.from || dsel.on) {
        dsel.on = true;
        const a = idx(dsel.from), z = idx(over.id);
        if (a === z) { clearSel(); return; }
        selAnchor = dsel.from;
        selectBlocks(blocks.slice(Math.min(a, z), Math.max(a, z) + 1), { say: false });
      }
    });
    on(document, "pointerup", () => { if (dsel?.on) S.say(`${selIds.length} blocks selected`); dsel = null; });
    on(doc, "click", (e) => {
      const at = e.target.closest?.(".yb-atom");
      if (at && doc.contains(at)) { const b = byId(at.dataset.b); if (b && b.type !== "hr") { e.preventDefault(); openForm(b); } else if (b) focusBlock(b); return; }
      if (e.target === doc) {
        const last = blocks[blocks.length - 1], le = elOf(last.id);
        if (le && e.clientY > le.getBoundingClientRect().bottom) {
          if (isText(last) && last.type === "p" && !String(last.text || "").trim()) focusBlock(last);
          else { const np = insertAfter(last, newP()); render(); focusBlock(np); commit("op"); }
        }
      }
    });
    on(wrap, "click", (e) => { if (e.target === wrap) { const last = blocks[blocks.length - 1]; if (last.type === "p" && !String(last.text || "").trim()) focusBlock(last); else { const np = insertAfter(last, newP()); render(); focusBlock(np); commit("op"); } } });

    /* ============================================================
       THE GUTTER (+ and the handle) · drag to move
       ============================================================ */
    function hoverGut(e) {
      const el = document.elementFromPoint(Math.max(doc.getBoundingClientRect().left + 8, e.clientX), e.clientY)?.closest?.("[data-b]");
      if (el && doc.contains(el)) placeGut(byId(el.dataset.b));
    }
    on(wrap, "pointermove", (e) => { if (e.pointerType === "mouse" && !drag && (e.target === wrap || gut.contains(e.target))) { if (e.target === wrap) hoverGut(e); } });
    on(wrap, "pointerleave", (e) => { if (e.pointerType === "mouse" && !drag && !openPop) { const f = blockOfNode(document.activeElement); placeGut(f || null); } });
    function placeGut(b = gutFor ? byId(gutFor) : null) {
      if (box.dataset.mode !== "blocks" || !b || !elOf(b.id)) { gut.hidden = true; gutFor = null; return; }
      gutFor = b.id;
      const el = elOf(b.id), wr = wrap.getBoundingClientRect(), r = el.getBoundingClientRect();
      // i9 · walk (F3): a block that's mid-glide (Y.flip after a move, or a hover lift) sits off its place by its own
      // transform; the handle goes where the block rests, not where it was a frame ago
      const tf = getComputedStyle(el).transform, ty = tf && tf !== "none" ? new DOMMatrixReadOnly(tf).m42 : 0;
      const cs = getComputedStyle(hostOf(el) || el), lh = Math.min(parseFloat(cs.lineHeight) || 26, r.height || 26);
      const empty = isText(b) && !String(b.text || "").trim() && b.type === "p";
      gut.hidden = false;
      gut.dataset.empty = String(empty);
      const pt = isText(b) ? parseFloat(cs.paddingTop) || 0 : 0;
      gut.style.top = `${r.top - ty - wr.top + pt + (isAtom(b) ? Math.min(18, r.height / 2 - 14) : lh / 2 - 15)}px`;
      grip.setAttribute("aria-label", `${nameOf(b)}, block ${idx(b.id) + 1} of ${blocks.length}: menu, or drag to move`);
      plusBtn.setAttribute("aria-label", empty ? "Choose a block for this line" : "Add a block below");
    }
    // + : an empty line opens the menu right there; otherwise a new line below with the menu open
    function plusAt(b) {
      if (!b) b = byId(cur) || blocks[blocks.length - 1];
      let t = b;
      if (!(b.type === "p" && !String(b.text || "").trim())) { const el = elOf(b.id); if (isText(b) && el) sync(el); t = insertAfter(b, newP()); render(); }
      focusBlock(t, "start");
      const h = hostOf(elOf(t.id));
      h.textContent = "/"; setRange(h, 1); sync(elOf(t.id)); markEmpty(elOf(t.id));
      slash.show(t, 0, "plus");
    }
    on(plusBtn, "pointerdown", (e) => e.preventDefault());
    on(plusBtn, "click", () => { Y.sound("tap", { el: plusBtn }); plusAt(byId(gutFor)); });
    on($("[data-bkins]", box), "pointerdown", (e) => e.preventDefault());
    on($("[data-bkins]", box), "click", () => { if (box.dataset.mode !== "blocks") { Y.sound("nope"); S.say("Switch back to Blocks to insert one"); return; } plusAt(byId(cur)); });
    on(ub, "pointerdown", (e) => e.preventDefault()); on(rb, "pointerdown", (e) => e.preventDefault());
    on(ub, "click", undo); on(rb, "click", redo);
    fmtBtns.forEach((bt) => { on(bt, "pointerdown", (e) => e.preventDefault()); on(bt, "click", () => { Y.sound("tap", { el: bt }); format(bt.dataset.bkfmt); }); });

    let drag = null;
    on(grip, "pointerdown", (e) => {
      if (e.button !== 0 || !gutFor) return;
      e.preventDefault();
      const b = byId(gutFor);
      const el = elOf(b.id); if (el && isText(b)) sync(el);
      // (i9 · walk, F1: where the caret was, if it was in this editor: the move re-renders the blocks, so it's put back after)
      drag = { b, x0: e.clientX, y0: e.clientY, pid: e.pointerType, on: false, list: selIds.includes(b.id) ? selected() : [b], focusWas: doc.contains(document.activeElement) && !selIds.length ? caretNow() : null };
      try { grip.setPointerCapture(e.pointerId); } catch (_) {}
    });
    on(grip, "pointermove", (e) => {
      if (!drag) return;
      if (!drag.on) { if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < (drag.pid === "touch" ? 6 : 5)) return; startDrag(e); }
      moveDrag(e);
    });
    // a press that never moved is a click: the menu opens on the click itself (opening it on pointerup let a phone's
    // tap land its click on the menu that had just docked under the finger)
    let dragged = 0;
    on(grip, "pointerup", () => {
      if (!drag) return;
      const d = drag;
      if (d.on) { endDrag(false); dragged = performance.now(); return; }
      drag = null;
    });
    on(grip, "pointercancel", () => { if (drag?.on) { endDrag(true); dragged = performance.now(); } drag = null; });
    on(grip, "click", () => { if (performance.now() - dragged < 400 || !gutFor) return; openMenu(byId(gutFor), grip); });
    on(grip, "contextmenu", (e) => e.preventDefault());
    function startDrag(e) {
      drag.on = true;
      closePops();
      const els = drag.list.map((b) => elOf(b.id)).filter(Boolean);
      const r = els[0].getBoundingClientRect();
      const g = document.createElement("div");
      g.className = "st-bk__ghost ydetail__text";
      g.style.width = `${r.width}px`;
      g.innerHTML = els.map((x) => (x.tagName === "LI" ? `<${x.parentElement.tagName.toLowerCase()}>${x.outerHTML}</${x.parentElement.tagName.toLowerCase()}>` : x.outerHTML)).join("");
      $$("[contenteditable]", g).forEach((x) => x.removeAttribute("contenteditable"));
      $$("[id]", g).forEach((x) => x.removeAttribute("id"));
      g.setAttribute("aria-hidden", "true");
      S.layer().appendChild(g);
      drag.ghost = g; drag.dx = drag.x0 - r.left; drag.dy = drag.y0 - r.top; drag.els = els;
      els.forEach((x) => x.classList.add("is-moving"));
      document.documentElement.classList.add("st-bk-dragging");
      Y.sound("pickup", { el: els[0] });
      const tick = () => { if (!drag?.on) return; const y = drag.y; const edgeT = 120, edgeB = innerHeight - 80; if (y < edgeT) scrollBy(0, -Math.ceil((edgeT - y) / 8)); else if (y > edgeB) scrollBy(0, Math.ceil((y - edgeB) / 8)); place(); drag.raf = requestAnimationFrame(tick); };
      const place = () => {
        const tops = blocks.filter((b) => !drag.list.includes(b)).map((b) => ({ b, el: elOf(b.id) })).filter((x) => x.el);
        let to = tops.length;
        for (let i = 0; i < tops.length; i++) { const rr = tops[i].el.getBoundingClientRect(); if (drag.y < rr.top + rr.height / 2) { to = i; break; } }
        drag.to = to;
        const wr = wrap.getBoundingClientRect();
        const ref = tops[to]?.el, prevEl = tops[to - 1]?.el;
        const y = ref ? ref.getBoundingClientRect().top - 6 : prevEl ? prevEl.getBoundingClientRect().bottom + 6 : 0;
        dropLine.hidden = false; dropLine.style.top = `${y - wr.top}px`;
      };
      drag.raf = requestAnimationFrame(tick);
    }
    function moveDrag(e) {
      drag.y = e.clientY;
      const g = drag.ghost; if (!g) return;
      g.style.transform = `translate(${e.clientX - drag.dx}px, ${e.clientY - drag.dy}px) rotate(-1deg)`;
    }
    function endDrag(cancel) {
      const d = drag; drag = null;
      cancelAnimationFrame(d.raf);
      d.ghost?.remove(); dropLine.hidden = true;
      d.els?.forEach((x) => x.classList.remove("is-moving"));
      document.documentElement.classList.remove("st-bk-dragging");
      if (cancel || d.to == null) { Y.sound("drop"); return; }
      const moved = moveTo(d.list, d.to);
      Y.sound("drop");
      if (!moved) { placeGut(d.b); return; }
      flip(() => render());
      // i9 · walk (F1): the render replaced the focused block, so focus fell to <body> and ⌘Z / the keys did nothing.
      // The caret goes back where it was (like a keyboard move); without one, the moved block is selected (keys + ⌘Z work)
      const fw = d.focusWas && byId(d.focusWas.id);
      if (d.list.length > 1 || !fw) selectBlocks(d.list, { say: false });
      else focusBlock(fw, d.focusWas.at, { scroll: false });
      commit("op");
      S.say(`Moved to ${idx(d.list[0].id) + 1} of ${blocks.length}`);
      placeGut(d.b);
    }
    on(document, "keydown", (e) => { if (drag?.on && e.key === "Escape") { e.preventDefault(); endDrag(true); } }, true);

    /* ============================================================
       POPOVERS (on the kit's floating layer): the / menu, the block menu, the link form, the yarn forms
       ============================================================ */
    let openPop = null, popCleanup = null;
    function closePops({ focus = false } = {}) {
      if (!openPop) return;
      const p = openPop; openPop = null;
      popCleanup?.(); popCleanup = null;
      p.remove();
      box.style.marginBottom = "";
      if (focus && focus.focus) focus.focus({ preventScroll: true });
    }
    function mkPop(cls, attrs = {}) {
      closePops();
      const p = document.createElement("div");
      p.className = `st-bk__pop ${cls}`;
      for (const [k, v] of Object.entries(attrs)) p.setAttribute(k, v);
      S.layer().appendChild(p);
      openPop = p;
      return p;
    }
    // desktop: under (or over) the anchor · phones: docked above the keyboard (the visual viewport's bottom)
    function placePop(p, rect, { width = 360, dock = phone(), min = 220, scroll = false } = {}) {
      const vv = window.visualViewport || { offsetTop: 0, offsetLeft: 0, height: innerHeight, width: innerWidth };
      p.style.maxHeight = ""; p.style.top = ""; p.style.bottom = "";
      if (dock) {
        p.classList.add("is-docked");
        p.style.left = `${vv.offsetLeft + 8}px`; p.style.width = `${vv.width - 16}px`;
        const bottom = vv.offsetTop + vv.height, kb = kbar && !kbar.hidden ? kbar.offsetHeight + 8 : 0;
        p.style.bottom = `${Math.max(8, innerHeight - bottom + 8) + kb}px`;
        p.style.maxHeight = `${Math.max(180, Math.min((vv.height - kb) * 0.55, 460))}px`;
        // room under the editor while it's open, so even the last block can scroll up above it
        box.style.marginBottom = `${Math.max(0, innerHeight - bottom) + p.offsetHeight + kb + 24}px`; // (+ what the keyboard covers)
        return;
      }
      p.classList.remove("is-docked");
      const w = Math.min(width, vv.width - 16);
      p.style.width = `${w}px`;
      p.style.left = `${Math.max(8, Math.min(rect.left, vv.width - w - 8))}px`;
      let below = vv.height - rect.bottom - 14, above = rect.top - 14;
      const h = p.scrollHeight;
      // not enough room under it: scroll the page up first (a menu that flips over the top bar hides the title)
      if (scroll && below < Math.min(h, min) && rect.top > 170) {
        const by = Math.min(rect.top - 150, Math.min(h, min) - below + 16, document.documentElement.scrollHeight - innerHeight - scrollY);
        if (by > 8) { scrollBy({ top: by, behavior: "instant" }); rect = { left: rect.left, right: rect.right, top: rect.top - by, bottom: rect.bottom - by }; below += by; above -= by; }
      }
      if (below >= Math.min(h, min) || below >= above) { p.style.top = `${rect.bottom + 6}px`; p.style.maxHeight = `${below}px`; }
      else { p.style.top = `${Math.max(8, rect.top - 6 - Math.min(h, above))}px`; p.style.maxHeight = `${above}px`; }
    }
    function outside(p, close) {
      const down = (e) => { if (p.contains(e.target) || e.target.closest?.(".st-sheetwrap, .ytip, [data-bkgrip], [data-bkplus], [data-bkins]")) return; close(e); };
      document.addEventListener("pointerdown", down, true);
      return () => document.removeEventListener("pointerdown", down, true);
    }
    const caretBox = () => { const r = caretRect(); return r ? { left: r.left - 10, right: r.right, top: r.top, bottom: r.bottom } : null; };

    /* ---------- the / menu ---------- */
    const slash = {
      el: null, b: null, start: 0, mode: "slash", items: [], i: 0, q: "",
      all() { return [...(compact ? [] : YARN), ...BASIC]; },
      show(b, start, mode) {
        this.b = b; this.start = start; this.mode = mode; this.q = ""; this.i = 0;
        const p = mkPop("st-bk__slash", { role: "listbox", "aria-label": "Blocks", id: `${box.id}-slash` });
        this.el = p;
        Y.sound("open", { el: elOf(b.id) });
        p.addEventListener("pointerdown", (e) => e.preventDefault());
        p.addEventListener("click", (e) => { const o = e.target.closest("[data-k]"); if (o) this.pick(this.items.find((x) => x.k === o.dataset.k)); });
        p.addEventListener("pointermove", (e) => { const o = e.target.closest("[data-k]"); if (o) { const j = this.items.findIndex((x) => x.k === o.dataset.k); if (j !== this.i) { this.i = j; this.paint(false); } } });
        const vvMove = () => this.place();
        window.visualViewport?.addEventListener("resize", vvMove); window.visualViewport?.addEventListener("scroll", vvMove);
        const off = outside(p, () => this.close({ drop: this.mode === "plus" }));
        popCleanup = () => { off(); window.visualViewport?.removeEventListener("resize", vvMove); window.visualViewport?.removeEventListener("scroll", vvMove); const h = hostOf(elOf(this.b?.id)); h?.removeAttribute("aria-activedescendant"); h?.removeAttribute("aria-controls"); this.el = null; };
        this.filter(); this.place(true);
        const h = hostOf(elOf(b.id)); h?.setAttribute("aria-controls", p.id);
        S.say(`Block menu. ${this.items.length} blocks. Type to filter, arrows to choose, Enter to add.`);
      },
      place(first = false) {
        if (!this.el) return;
        const rect = caretBox() || elOf(this.b.id)?.getBoundingClientRect();
        placePop(this.el, rect, { width: 340, min: 260, scroll: first });
        if (this.el.classList.contains("is-docked")) { const er = elOf(this.b.id)?.getBoundingClientRect(), pr = this.el.getBoundingClientRect(); if (er && er.bottom > pr.top - 10) scrollBy({ top: er.bottom - pr.top + 24, behavior: "instant" }); }
      },
      filter() {
        const q = this.q.trim().toLowerCase();
        const score = (it) => { if (!q) return 1; const l = it.label.toLowerCase(); if (l.startsWith(q)) return 3; if (l.includes(q) || it.k.includes(q) || (it.md && it.md === q)) return 2; return `${it.keys || ""} ${it.hint || ""}`.toLowerCase().includes(q) ? 1 : 0; };
        this.items = this.all().map((it) => [it, score(it)]).filter(([, s]) => s > 0).sort((a, b) => (q ? b[1] - a[1] : 0)).map(([it]) => it);
        this.i = Math.min(this.i, Math.max(0, this.items.length - 1));
        this.paint(true);
      },
      paint(rebuild) {
        const p = this.el; if (!p) return;
        if (rebuild) {
          const q = this.q.trim();
          let h = "", grp = "";
          this.items.forEach((it, j) => {
            const g = q ? "" : it.yarn ? "Yarn blocks" : "Basic";
            if (g && g !== grp) { grp = g; h += `<div class="st-bk__grp" role="presentation">${g}</div>`; }
            h += `<div class="ysearch__opt st-bk__opt" role="option" id="${box.id}-o-${j}" data-k="${it.k}" aria-selected="false"><span class="st-bk__oic${it.yarn ? " is-yarn" : ""}" aria-hidden="true"><i class="ph-bold ${it.icon}"></i></span><span class="st-bk__ot"><b>${esc(it.label)}</b>${it.hint ? `<small>${esc(it.hint)}</small>` : ""}</span>${it.md ? `<kbd class="st-bk__okbd" aria-hidden="true">${esc(it.md)}</kbd>` : ""}</div>`;
          });
          p.innerHTML = h || `<p class="st-bk__none">No block called “${esc(q)}”. Esc to keep typing.</p>`;
        }
        $$("[role=option]", p).forEach((o, j) => o.setAttribute("aria-selected", String(j === this.i)));
        const act = $(`#${CSS.escape(`${box.id}-o-${this.i}`)}`, p);
        const h = hostOf(elOf(this.b.id));
        if (act) { h?.setAttribute("aria-activedescendant", act.id); act.scrollIntoView({ block: "nearest" }); }
      },
      input() {
        const h = hostOf(elOf(this.b.id)), t = plain(h), c = caret();
        if (!c || t[this.start] !== "/" || c.start <= this.start) return this.close();
        const q = t.slice(this.start + 1, c.start);
        if (q.length > 24 || /\n/.test(q) || (/\s$/.test(q) && !this.items.length)) return this.close();
        this.q = q; this.i = 0; this.filter(); this.place();
        if (this.items.length) S.say(`${this.items.length} blocks. ${this.items[0].label}`);
      },
      key(e) {
        const k = e.key;
        if (k === "ArrowDown" || k === "ArrowUp") { e.preventDefault(); const n = this.items.length; if (!n) return true; this.i = (this.i + (k === "ArrowDown" ? 1 : -1) + n) % n; this.paint(false); const it = this.items[this.i]; S.say(`${it.label}${it.hint ? `, ${it.hint}` : ""}. ${this.i + 1} of ${n}`); return true; }
        if (k === "Enter" || (k === "Tab" && this.items.length)) { if (!this.items.length) { this.close(); return false; } e.preventDefault(); this.pick(this.items[this.i]); return true; }
        if (k === "Escape") { e.preventDefault(); this.close({ drop: this.mode === "plus" }); return true; }
        if (k === "Home" || k === "End") { if (!this.items.length) return false; e.preventDefault(); this.i = k === "Home" ? 0 : this.items.length - 1; this.paint(false); return true; }
        return false;
      },
      close({ drop = false } = {}) {
        if (!this.el) return;
        const b = this.b;
        closePops();
        if (drop && b) { const el = elOf(b.id), h = hostOf(el); if (h && plain(h).slice(this.start).match(/^\/\S*$/)) { const c0 = this.start; setRange(h, c0, plain(h).length); getSelection().getRangeAt(0).deleteContents(); sync(el); markEmpty(el); commit("op"); } }
        Y.sound("close");
      },
      pick(it) {
        if (!it) return;
        const b = this.b, el = elOf(b.id), h = hostOf(el), c = caret();
        const end = c && c.b === b ? c.start : this.start + 1 + this.q.length;
        setRange(h, this.start, end); getSelection().getRangeAt(0).deleteContents(); sync(el);
        closePops();
        const empty = !String(b.text || "").trim();
        Y.sound("token-add", { el });
        if (it.yarn) return addYarn(b, it.kind, empty);
        if (it.k === "hr") {
          const hr = { id: bid(), type: "hr", src: null, sep: null };
          if (empty) { const i = idx(b.id); blocks.splice(i, 1, hr); resetSep(blocks[i + 1]); } else insertAfter(b, hr);
          const nx = blocks[idx(hr.id) + 1];
          const np = nx && nx.type === "p" && !String(nx.text || "").trim() ? nx : insertAfter(hr, newP());
          render(); focusBlock(np, "start"); commit("op"); S.say("Divider added"); return;
        }
        if (empty) { if (kOf(b) === it.k) { focusBlock(b, "start"); commit("op"); } else turnInto(b, it.k, { at: 0 }); return; }
        const nb = newP(); insertAfter(b, nb); render(); turnInto(nb, it.k, { at: 0 });
      },
    };
    // a new yarn block (or images) where the / was: its form opens at once; closed empty, it goes away again
    function addYarn(b, kind, replace) {
      const nb = kind === "images" ? { id: bid(), type: "yarn", kind: "images", attrs: {}, body: "", src: null, sep: null } : { id: bid(), ...M.yarn(kind, kind === "link" ? { links: [], style: "button", primary: true } : kind === "note" ? { text: "", color: "" } : kind === "music" ? { tracks: [] } : {}), sep: null };
      if (replace) { const i = idx(b.id); blocks.splice(i, 1, nb); resetSep(nb, blocks[i + 1]); }
      else insertAfter(b, nb);
      const i = idx(nb.id);
      if (!blocks[i + 1]) insertAfter(nb, newP());
      render();
      setCur(nb.id);
      openForm(nb, { fresh: true });
    }

    /* ---------- the block menu (the handle) ---------- */
    function openMenu(b, from) {
      if (!b) return;
      if (openPop?.classList.contains("st-bk__menu")) { closePops(); return; }
      const multi = selIds.length > 1 && selIds.includes(b.id);
      const list = multi ? selected() : [b];
      if (!multi) { selAnchor = null; selectBlocks([b], { focus: false, say: false }); }
      const p = mkPop("st-bk__menu", { role: "menu", "aria-label": multi ? `${list.length} blocks` : nameOf(b) });
      const k0 = kOf(b);
      const turn = !multi && (isText(b) || b.type === "code");
      const item = (act, icon, label, kb = "", extra = "") => `<button type="button" class="st-bk__mi" role="menuitem" data-act="${act}" tabindex="-1"${extra}><i class="ph-bold ${icon}" aria-hidden="true"></i><span>${esc(label)}</span>${kb ? `<kbd aria-hidden="true">${esc(K(kb))}</kbd>` : ""}</button>`;
      p.innerHTML = `
        ${!multi && isAtom(b) && b.type !== "hr" ? item("edit", "ph-pencil-simple", b.type === "raw" ? "Edit the markdown" : `Edit ${nameOf(b).toLowerCase()}`, "↵") : ""}
        ${turn ? `<div class="st-bk__grp" role="presentation">Turn into</div><div class="st-bk__turn" role="group" aria-label="Turn into">${TURN.map((t) => `<button type="button" class="st-bk__mi st-bk__mt ysel${t.k === k0 ? " is-selected" : ""}" role="menuitemradio" aria-checked="${t.k === k0}" data-turn="${t.k}" tabindex="-1"><i class="ph-bold ${t.icon}" aria-hidden="true"></i><span>${t.label}</span>${t.md ? `<kbd aria-hidden="true">${esc(t.md)}</kbd>` : ""}</button>`).join("")}</div><hr class="st-bk__hr">` : ""}
        ${!multi && b.type === "yarn" ? item("unwrap", "ph-markdown-logo", "Turn into plain markdown") : ""}
        ${item("dup", "ph-copy", multi ? `Duplicate ${list.length}` : "Duplicate", "⌘D")}
        ${item("up", "ph-arrow-up", "Move up", "⌥⇧↑")}${item("down", "ph-arrow-down", "Move down", "⌥⇧↓")}
        ${item("del", "ph-trash", multi ? `Delete ${list.length}` : "Delete", "⌫", ' data-danger')}`;
      const items = () => $$("[role^=menuitem]", p);
      const rect = from?.isConnected && !from.hidden ? from.getBoundingClientRect() : elOf(b.id).getBoundingClientRect();
      placePop(p, { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom }, { width: 260, min: 300, scroll: true });
      Y.sound("open", { el: from || elOf(b.id) });
      const done = (focusEl) => { closePops(); if (focusEl) focusEl.focus?.({ preventScroll: true }); };
      const backTo = () => { const t = byId(list[0].id); if (!t) return; if (isAtom(t)) focusBlock(t); else { selectBlocks([t], { say: false }); } };
      p.addEventListener("click", (e) => {
        const tb2 = e.target.closest("[data-turn]");
        if (tb2) { done(); turnInto(b, tb2.dataset.turn); return; }
        const a = e.target.closest("[data-act]"); if (!a) return;
        const act = a.dataset.act;
        done();
        if (act === "edit") openForm(b);
        else if (act === "unwrap") unwrap(b);
        else if (act === "dup") duplicate(list);
        else if (act === "up" || act === "down") { moveBlocks(list, act === "up" ? -1 : 1); if (!multi) { const t = byId(b.id); isAtom(t) ? focusBlock(t) : selectBlocks([t], { say: false }); } }
        else if (act === "del") { clearSel(false); remove(list); commit("op"); Y.sound("tag-remove"); S.say(list.length > 1 ? `Deleted ${list.length} blocks` : `${nameOf(b)} deleted`); S.toast({ icon: "ph-trash", title: list.length > 1 ? `Deleted ${list.length} blocks` : `${nameOf(b)} deleted`, undo: () => undo(), action: "Undo" }); }
      });
      p.addEventListener("keydown", (e) => {
        const all = items(), i = all.indexOf(document.activeElement);
        if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); all[(i + (e.key === "ArrowDown" ? 1 : -1) + all.length) % all.length]?.focus(); }
        else if (e.key === "Home" || e.key === "End") { e.preventDefault(); all[e.key === "Home" ? 0 : all.length - 1]?.focus(); }
        else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); done(); backTo(); Y.sound("close"); }
        else if (e.key === "Tab") { done(); backTo(); }
      });
      const off = outside(p, () => { closePops(); });
      popCleanup = () => { off(); };
      const first = items().find((x) => x.classList.contains("is-selected")) || items()[0];
      if (Y.params?.get("demo") !== "bkmenu") first?.focus({ preventScroll: true });
    }
    function unwrap(b) {
      const i = idx(b.id);
      const nb = M.parse(b.body || "").blocks.map(withId);
      blocks.splice(i, 1, ...nb); resetSep(nb[0], blocks[i + nb.length]);
      render(); if (nb[0]) focusBlock(nb[0], "end"); commit("op"); S.say("Now plain markdown");
    }

    /* ---------- inline link form ---------- */
    function linkForm(c) {
      const n = c.range.startContainer, a = (n.nodeType === 1 ? n : n.parentElement).closest("a");
      const saved = c.range.cloneRange(), host = c.host, el = c.el;
      const cr = c.range.getBoundingClientRect();
      const p = mkPop("st-bk__lnk", { role: "dialog", "aria-label": a ? "Edit link" : "Add a link" });
      const state = { href: a?.getAttribute("href") || "", text: a ? a.textContent : c.range.toString() };
      p.innerHTML = `<div class="st-bk__lrow">${!a && c.collapsed ? S.f.text(state, "text", { label: "Text", placeholder: "What it says" }) : ""}${S.f.text(state, "href", { label: "Link", placeholder: "https://…", type: "url", mono: true, inputmode: "url" })}</div>
        <p class="st-hint">For a button in your link style, use <b>/link</b> instead.</p>
        <div class="st-sheetacts">${a ? `<button type="button" class="btn btn--ghost btn--sm" data-l="rm"><i class="ph-bold ph-link-break" aria-hidden="true"></i><span>Remove link</span></button>` : ""}<span class="ydetail__spacer"></span><button type="button" class="btn btn--ink btn--sm" data-l="ok">${a ? "Save" : "Add link"}</button></div>`;
      S.bind(p, state, () => {});
      placePop(p, cr.width || cr.height ? cr : el.getBoundingClientRect(), { width: 360, min: 160 });
      const restoreSel = () => { host.focus({ preventScroll: true }); const s = getSelection(); s.removeAllRanges(); s.addRange(saved); };
      const apply = () => {
        const href = state.href.trim();
        restoreSel();
        if (!href) { closePops(); return; }
        if (a) a.setAttribute("href", href);
        else if (c.collapsed) { const x = document.createElement("a"); x.href = href; x.textContent = state.text.trim() || href; saved.insertNode(x); const r = document.createRange(); r.setStartAfter(x); r.collapse(true); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
        else exec("createLink", href);
        closePops(); sync(el); commit("op"); paintFmt(); Y.sound("token-add");
      };
      p.addEventListener("click", (e) => {
        const bt = e.target.closest("[data-l]"); if (!bt) return;
        if (bt.dataset.l === "rm") { a.replaceWith(...a.childNodes); closePops(); restoreSel(); sync(el); commit("op"); paintFmt(); return; }
        apply();
      });
      p.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); apply(); } else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); closePops(); restoreSel(); } });
      const off = outside(p, () => closePops());
      popCleanup = off;
      requestAnimationFrame(() => $("input", p)?.focus());
    }

    /* ============================================================
       YARN BLOCK FORMS (live: every change redraws the real kit part in the editor)
       ============================================================ */
    function openForm(b, { fresh = false } = {}) {
      const kind = b.type === "img" ? "images" : b.type === "raw" ? "raw" : b.kind;
      const F = FORMS[kind]; if (!F) return;
      const state = F.state(b);
      const p = mkPop("st-bk__form", { role: "dialog", "aria-labelledby": `${box.id}-fh` });
      const K2 = M.KINDS[kind];
      p.innerHTML = `<header class="st-bk__fh"><span class="st-bk__oic is-yarn" aria-hidden="true"><i class="ph-bold ${K2?.icon || "ph-markdown-logo"}"></i></span><h2 id="${box.id}-fh">${esc(F.title)}</h2><span class="ydetail__spacer"></span>
        <button type="button" class="ylinkicon ylinkicon--sm" data-frm="rm" aria-label="Remove this block"><i class="ph-bold ph-trash" aria-hidden="true"></i></button>
        <button type="button" class="btn btn--ink btn--sm" data-frm="done">Done</button></header><div class="st-bk__fbody">${F.html(state)}</div>`;
      let live = b;
      const apply = (opts = {}) => {
        const nb = F.block(state);
        const keep = { id: live.id, sep: live.sep, first: live.first };
        Object.keys(live).forEach((key) => delete live[key]);
        Object.assign(live, nb, keep, { src: null });
        repaint(live);
        if (!opts.quiet) commit("type", `form:${live.id}`);
        place();
      };
      const place = (first = false) => {
        const el = elOf(live.id); if (!el) return;
        placePop(p, el.getBoundingClientRect(), { width: 460, min: 340, scroll: first });
        if (!p.classList.contains("is-docked")) return;
        // phones: the block stays in sight above the docked form (just above it, or its top under the top bar)
        const pr = p.getBoundingClientRect(), er = el.getBoundingClientRect(), top = 72;
        const target = er.height <= pr.top - 12 - top ? pr.top - 12 - er.height : top;
        if (er.top < top || er.bottom > pr.top - 12) scrollBy({ top: er.top - target, behavior: "instant" });
      };
      F.wire(p, state, apply, { live: () => live });
      const close = ({ remove: rm = false, say = true } = {}) => {
        if (openPop !== p) return;
        closePops();
        const gone = rm || F.empty(state);
        if (gone) {
          const i = idx(live.id);
          blocks.splice(i, 1); resetSep(blocks[i]);
          if (!blocks.length) blocks.push(newP());
          render(); focusBlock(blocks[Math.max(0, i - 1)], "end"); commit("op");
          if (say) S.say(rm ? `${F.title} block removed` : `Nothing in the ${F.title.toLowerCase()} block, so it's gone`);
          Y.sound("tag-remove");
        } else { focusBlock(live); Y.sound("close"); }
      };
      p.addEventListener("click", (e) => { const a = e.target.closest("[data-frm]"); if (!a) return; close({ remove: a.dataset.frm === "rm" }); });
      p.addEventListener("keydown", (e) => {
        if (e.key === "Escape") { if (e.target.closest(".ysearch, [data-noesc]") && e.target.value) return; e.preventDefault(); e.stopPropagation(); close(); return; }
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); close(); return; }
        if (e.key === "Tab") { const f = $$("a[href], button:not([disabled]), input:not([disabled]), textarea, select, [tabindex='0']", p).filter((x) => x.getClientRects().length); if (!f.length) return; const i = f.indexOf(document.activeElement); if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); } }
      });
      const vvMove = () => place();
      window.visualViewport?.addEventListener("resize", vvMove);
      const off = outside(p, () => close());
      popCleanup = () => { off(); window.visualViewport?.removeEventListener("resize", vvMove); F.cleanup?.(state); };
      place(true);
      Y.sound("open", { el: elOf(b.id) });
      requestAnimationFrame(() => (F.focus?.(p) || $("input, textarea, button:not([data-frm])", $(".st-bk__fbody", p)))?.focus({ preventScroll: true }));
      S.say(`${F.title} block. ${fresh ? "Fill it in" : "Edit it"}; it updates as you type. Escape or Done to close.`);
    }

    // start: the history's first state, the counts
    $$(".yb-code__t", doc).forEach(fitCode);
    H.stack = [snap()]; H.i = 0; paintHist();
    paintCount(String(S.get(item, path) || ""));

    return {
      // (tests) every block written back from what the editor shows: the DOM → markdown path, as if each were edited
      dirtyAll: () => { $$("[data-b]", doc).forEach((el) => { const b = byId(el.dataset.b); if (!b) return; if (isText(b) || b.type === "code") sync(el); else if (b.type !== "raw") b.src = null; }); return serialize(); },
      blocks: () => blocks, undo, redo, render, focusBlock, selectBlocks, openForm, openMenu, plusAt, slash, byId, mode: () => box.dataset.mode, md: () => serialize(),
      // the raw toggle
      toMode, };

    /* ---------- Blocks | Markdown ---------- */
    function toMode(m) {
      if (m === box.dataset.mode) return;
      if (m === "md") {
        $$("[data-b]", doc).forEach((el) => { const b = byId(el.dataset.b); if (b && (isText(b) || b.type === "code") && b.src == null) sync(el); });
        closePops(); clearSel(false);
        raw.value = serialize();
        box.dataset.mode = "md"; doc.hidden = true; gut.hidden = true; raw.hidden = false;
        fitRaw();
        S.say("Showing the markdown");
      } else {
        let parsed;
        try { parsed = M.parse(raw.value); } catch (e) { console.warn(e); Y.sound("nope"); S.toast({ icon: "ph-warning", title: "Couldn't read that as blocks", text: "The markdown stays as it is." }); return setSeg("md"); }
        const before = JSON.stringify(blocks.map((b) => M.block(b)));
        blocks = parsed.blocks.map(withId); tail = parsed.tail;
        if (!blocks.length) blocks.push(newP());
        box.dataset.mode = "blocks"; raw.hidden = true; doc.hidden = false;
        render();
        if (JSON.stringify(blocks.map((b) => M.block(b))) !== before) record("op");
        focusBlock(blocks[0], "start", { scroll: false });
        S.say("Showing the blocks");
      }
      setSeg(m);
    }
    function setSeg(m) { $$(`.yseg[data-name="bk:${box.id}"] .yseg__btn`, box).forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.v === m))); }
    function fitRaw() { raw.style.height = "auto"; raw.style.height = `${Math.max(260, raw.scrollHeight + 4)}px`; }
  }

  /* ============================================================
     FORMS, per kind: state(block) → html(state) → wire(p, state, apply) → block(state) · empty(state)
     ============================================================ */
  const plusIc = (on) => `<span class="st-plus-ic" aria-hidden="true"><i class="ph-bold ${on ? "ph-check" : "ph-plus"}"></i></span>`;
  const songsList = () => S.allSongs();
  const FORMS = {
    link: {
      title: "Link",
      state: (b) => { const d = M.yarnData(b); return { links: d.links.length ? d.links.map((l) => ({ ...l })) : [{ text: "", href: "" }], style: d.style, primary: d.primary !== false }; },
      html: (s) => `
        <div class="st-field"><span class="st-lab" id="lk-st">Looks like</span>${Y.seg([{ value: "button", label: "Button", icon: "ph-cursor-click" }, { value: "icon", label: "Brand icon", icon: "ph-github-logo" }], { value: s.style, label: "Looks like", name: "bk-lstyle" })}</div>
        <ol class="st-bk__links" data-links>${s.links.map((l, i) => linkRow(s, i)).join("")}</ol>
        <div class="st-sheetacts"><button type="button" class="btn btn--sm" data-addlink><i class="ph-bold ph-plus" aria-hidden="true"></i><span>Another link</span></button></div>
        <div data-prim${s.style === "icon" ? " hidden" : ""}>${S.f.toggle(s, "primary", { label: "First one in red", text: "Like the first button on a project page." })}</div>`,
      wire(p, s, apply) {
        const paint = () => { $("[data-links]", p).innerHTML = s.links.map((l, i) => linkRow(s, i)).join(""); };
        S.bind(p, s, (path) => { if (/^links\.\d+\.href$/.test(path)) checkUrl(p, s, +path.split(".")[1]); apply(); });
        p.addEventListener("ychange", (e) => { if (e.detail.name !== "bk-lstyle") return; e.stopPropagation(); s.style = e.detail.value; $("[data-prim]", p).hidden = s.style === "icon"; Y.sound("chip-on"); apply(); });
        p.addEventListener("click", (e) => {
          if (e.target.closest("[data-addlink]")) { s.links.push({ text: "", href: "" }); paint(); $(`[data-f="links.${s.links.length - 1}.href"]`, p)?.focus(); Y.sound("token-add"); return; }
          const rm = e.target.closest("[data-rmlink]"); if (rm) { s.links.splice(+rm.dataset.rmlink, 1); if (!s.links.length) s.links.push({ text: "", href: "" }); paint(); apply(); Y.sound("tag-remove"); $(`[data-f="links.0.href"]`, p)?.focus(); }
        });
      },
      focus: (p) => $("[data-f='links.0.href']", p),
      block: (s) => M.yarn("link", { links: s.links.filter((l) => l.href.trim()).map((l) => ({ text: l.text.trim(), href: (Y.linkInfo?.(l.href.trim())?.valid ? Y.linkInfo(l.href.trim()).url : l.href.trim()) })), style: s.style, primary: s.primary }),
      empty: (s) => !s.links.some((l) => l.href.trim()),
    },
    images: {
      title: "Images",
      state: (b) => { const d = b.type === "img" ? { images: [{ src: b.url, alt: b.alt }], caption: b.title || "" } : M.yarnData(b); return { images: d.images.map((m) => ({ src: S.norm(m.src), alt: m.alt || "", kind: S.isVideo(m.src) ? "video" : "image" })), caption: d.caption || "", lib: false }; },
      html: (s) => `${E.media(s, "images", { grid: true, cover: false, addLabel: "Upload", hint: "tap one for alt text · drag to reorder" })}
        <div class="st-sheetacts"><button type="button" class="btn btn--sm" data-lib aria-expanded="false"><i class="ph-bold ph-images-square" aria-hidden="true"></i><span>From Media</span></button></div>
        <div class="st-bk__lib" data-libgrid hidden></div>
        ${S.f.text(s, "caption", { label: "Caption", placeholder: "Optional" })}`,
      wire(p, s, apply) {
        const keep = E.repaintMedia;
        E.wireMedia(p, s, "images", () => { apply(); paintLib(); }, { pool: ["/media/sona.png", "/media/site-plan.png", "/media/beepsearch.png", "/media/rawsy.png", "/media/wsg.mp4"] });
        const repaintMine = E.repaintMedia; E.repaintMedia = keep; // (the screen's own media strip keeps its repaint)
        S.bind($("[data-f=caption]", p).closest(".st-field"), s, () => apply());
        const lib = () => S.library().filter((f) => f.kind === "image" || f.kind === "video");
        const has = (f) => s.images.some((m) => m.src === S.norm(f.src));
        const paintLib = () => { const g = $("[data-libgrid]", p); if (g.hidden) return; g.innerHTML = `<ul class="st-bk__libl" aria-label="Your media">${lib().map((f) => `<li><button type="button" class="st-bk__libt ysel ytog" data-libsrc="${esc(f.src)}" aria-pressed="${has(f)}" aria-label="${esc(f.file)}${has(f) ? ", in this block" : ""}">${S.mediaEl(f.src, { poster: f.poster || 0.6 })}<span class="st-bk__libc" aria-hidden="true"><i class="ph-bold ${has(f) ? "ph-check" : "ph-plus"}"></i></span></button></li>`).join("")}</ul>`; };
        p.addEventListener("click", (e) => {
          const lb = e.target.closest("[data-lib]");
          if (lb) { const g = $("[data-libgrid]", p); g.hidden = !g.hidden; lb.setAttribute("aria-expanded", String(!g.hidden)); paintLib(); Y.sound(g.hidden ? "close" : "open", { el: lb }); if (!g.hidden) $("[data-libsrc]", g)?.focus(); return; }
          const t = e.target.closest("[data-libsrc]");
          if (t) {
            const src = S.norm(t.dataset.libsrc), i = s.images.findIndex((m) => m.src === src);
            if (i >= 0) { s.images.splice(i, 1); Y.sound("chip-off", { el: t }); } else { s.images.push({ src, alt: "", kind: S.isVideo(src) ? "video" : "image" }); Y.sound("chip-on", { el: t }); }
            repaintMine(); apply(); paintLib(); $(`[data-libsrc="${CSS.escape(t.dataset.libsrc)}"]`, p)?.focus();
          }
        });
      },
      block: (s) => {
        const ims = s.images.filter((m) => m.src);
        if (ims.length === 1 && !s.caption.trim() && !S.isVideo(ims[0].src)) return { type: "img", alt: ims[0].alt || "", url: ims[0].src, title: "" };
        return M.yarn("images", { images: ims.map((m) => ({ src: m.src, alt: m.alt })), caption: s.caption.trim() });
      },
      empty: (s) => !s.images.length,
    },
    music: {
      title: "Music",
      state: (b) => { const d = M.yarnData(b); return { tracks: d.tracks.map((t) => ({ ...t })), title: d.title || "", q: "" }; },
      html: (s) => `${S.f.text(s, "title", { label: "Title", placeholder: "Optional, e.g. what I listened to" })}
        <div class="st-field"><label for="bk-mq">Your music</label><input class="yfield st-in" id="bk-mq" type="search" placeholder="Search songs…" data-mq autocomplete="off" data-noesc></div>
        <ul class="st-plpick st-bk__picks" data-mpick aria-label="Your songs"></ul>
        <p class="st-hint" data-mcount></p>`,
      wire(p, s, apply) {
        const songs = songsList();
        const has = (u) => s.tracks.some((t) => t.src === u);
        const paint = () => {
          const q = $("[data-mq]", p).value.trim().toLowerCase();
          $("[data-mpick]", p).innerHTML = songs.filter((x) => !q || `${x.name} ${x.coll || ""}`.toLowerCase().includes(q)).map((x) => `<li><button type="button" class="yrow ylift st-plrow" data-song="${esc(x.url)}" aria-pressed="${has(x.url)}">${S.swatch(x, { size: 40 })}<b>${esc(x.name)}${x.coll ? ` <small class="meta">${esc(x.coll)}</small>` : ""}</b><span class="meta">${Y.fmtTime(S.durOf(x))}</span>${plusIc(has(x.url))}<span class="sr-only">${has(x.url) ? "in the block, tap to take it out" : "add"}</span></button></li>`).join("") || `<li class="st-hint">No song called that.</li>`;
          $("[data-mcount]", p).textContent = s.tracks.length ? `${s.tracks.length} in the block: ${s.tracks.map((t) => t.title).join(" · ")}` : "Tap songs to add them, in order.";
        };
        paint();
        S.bind($("[data-f=title]", p).closest(".st-field"), s, () => apply());
        $("[data-mq]", p).addEventListener("input", paint);
        p.addEventListener("click", (e) => {
          const t = e.target.closest("[data-song]"); if (!t) return;
          const u = t.dataset.song, x = songs.find((y) => y.url === u);
          if (has(u)) { s.tracks = s.tracks.filter((y) => y.src !== u); Y.sound("chip-off", { el: t }); }
          else { s.tracks.push({ title: x.name, src: u, dur: Y.fmtTime(S.durOf(x)) }); Y.sound("chip-on", { el: t }); }
          paint(); apply(); $(`[data-song="${CSS.escape(u)}"]`, p)?.focus();
        });
      },
      focus: (p) => $("[data-mq]", p),
      block: (s) => M.yarn("music", { title: s.title.trim(), tracks: s.tracks }),
      empty: (s) => !s.tracks.length,
    },
    mention: {
      title: "Mention",
      state: (b) => ({ ref: M.yarnData(b).ref || "" }),
      html: () => `<div class="st-field"><label for="bk-aq">Mention</label><input class="yfield st-in" id="bk-aq" type="search" placeholder="A project, release, post or ranked item…" data-aq autocomplete="off" data-noesc></div>
        <div class="st-bk__picks" role="radiogroup" aria-label="What to mention" data-apick></div>`,
      wire(p, s, apply) {
        const all = mentionables();
        const paint = () => {
          const q = $("[data-aq]", p).value.trim().toLowerCase();
          const list = all.filter((x) => !q || `${x.name} ${x.word}`.toLowerCase().includes(q)).slice(0, 40);
          $("[data-apick]", p).innerHTML = list.map((x) => `<button type="button" class="yrow ylift ysel st-bk__pick${x.ref === s.ref ? " is-selected" : ""}" role="radio" aria-checked="${x.ref === s.ref}" tabindex="${x.ref === s.ref || (!s.ref && x === list[0]) ? 0 : -1}" data-ref="${esc(x.ref)}"><span class="st-bk__oic" aria-hidden="true"><i class="ph-bold ${x.icon}"></i></span><b>${esc(x.name)}</b><span class="meta">${esc(x.word)}</span></button>`).join("") || `<p class="st-hint">Nothing called that.</p>`;
        };
        paint();
        $("[data-aq]", p).addEventListener("input", paint);
        const pick = (t) => { s.ref = t.dataset.ref; paint(); apply(); Y.sound("chip-on", { el: t }); $(`[data-ref="${CSS.escape(s.ref)}"]`, p)?.focus(); };
        p.addEventListener("click", (e) => { const t = e.target.closest("[data-ref]"); if (t) pick(t); });
        p.addEventListener("keydown", (e) => { const t = e.target.closest?.("[data-ref]"); if (!t || !/^Arrow(Up|Down)$/.test(e.key)) return; e.preventDefault(); const all2 = $$("[data-ref]", p), i = all2.indexOf(t), n = all2[(i + (e.key === "ArrowDown" ? 1 : -1) + all2.length) % all2.length]; n?.focus(); });
      },
      focus: (p) => $("[data-aq]", p),
      block: (s) => M.yarn("mention", { ref: s.ref }, { about: studioAbout }),
      empty: (s) => !s.ref,
    },
    note: {
      title: "Note",
      state: (b) => { const d = M.yarnData(b); return { text: d.text || "", color: d.color || Y.post.NOTE_COLORS[0][0] }; },
      html: (s) => `${S.f.area(s, "text", { label: "The note", rows: 3, placeholder: "Something worth pinning. **Markdown** works." })}
        <div class="st-field"><span class="st-lab" id="bk-nc">Colour</span><div class="st-swatches" role="radiogroup" aria-labelledby="bk-nc">${Y.post.NOTE_COLORS.map(([k, name], i) => `<button type="button" class="st-swatch ysel ynote" role="radio" data-note="${k}" data-ncolor="${k}" aria-checked="${s.color === k}" aria-pressed="${s.color === k}" tabindex="${s.color === k ? 0 : -1}" title="${esc(name)}"><span class="sr-only">${esc(name)}${i === 0 ? " (default)" : ""}</span></button>`).join("")}</div></div>`,
      // (the scratch post's own colour swatch, .ynote; Studio's swatch keys move + pick with the arrows)
      wire(p, s, apply) {
        S.bind(p, s, () => apply());
        const set = (t) => { s.color = t.dataset.ncolor; $$("[data-ncolor]", p).forEach((x) => { const on2 = x === t; x.setAttribute("aria-checked", String(on2)); x.setAttribute("aria-pressed", String(on2)); x.tabIndex = on2 ? 0 : -1; }); Y.sound("chip-on", { el: t }); apply(); };
        p.addEventListener("click", (e) => { const t = e.target.closest("[data-ncolor]"); if (t) set(t); });
      },
      focus: (p) => $("textarea", p),
      block: (s) => M.yarn("note", { text: s.text.replace(/\r/g, ""), color: s.color }),
      empty: (s) => !s.text.trim(),
    },
    post: {
      title: "Post card",
      state: (b) => ({ id: M.yarnData(b).id || "" }),
      html: () => `<div class="st-field"><label for="bk-pq">A Thoughts post</label><input class="yfield st-in" id="bk-pq" type="search" placeholder="Search your posts…" data-pq autocomplete="off" data-noesc></div>
        <div class="st-bk__picks" role="radiogroup" aria-label="Which post" data-ppick></div>`,
      wire(p, s, apply) {
        const posts = S.data.thoughts.filter((x) => x.type !== "article" || true);
        const label = (x) => x.title || x.name || x.text || "Untitled";
        const paint = () => {
          const q = $("[data-pq]", p).value.trim().toLowerCase();
          const list = posts.filter((x) => !q || `${label(x)} ${x.type}`.toLowerCase().includes(q)).slice(0, 40);
          $("[data-ppick]", p).innerHTML = list.map((x) => `<button type="button" class="yrow ylift ysel st-bk__pick${String(x.id) === s.id ? " is-selected" : ""}" role="radio" aria-checked="${String(x.id) === s.id}" tabindex="${String(x.id) === s.id || (!s.id && x === list[0]) ? 0 : -1}" data-pid="${esc(x.id)}"><span class="st-bk__oic" aria-hidden="true"><i class="ph-bold ${S.TTYPES[x.type]?.icon || "ph-note"}"></i></span><b>${esc(label(x).slice(0, 80))}</b><span class="meta">${esc(S.TTYPES[x.type]?.label || "")}${x._pub === "draft" ? " · draft" : ""}</span></button>`).join("") || `<p class="st-hint">No post like that.</p>`;
        };
        paint();
        $("[data-pq]", p).addEventListener("input", paint);
        p.addEventListener("click", (e) => { const t = e.target.closest("[data-pid]"); if (!t) return; s.id = t.dataset.pid; paint(); apply(); Y.sound("chip-on", { el: t }); $(`[data-pid="${CSS.escape(s.id)}"]`, p)?.focus(); });
        p.addEventListener("keydown", (e) => { const t = e.target.closest?.("[data-pid]"); if (!t || !/^Arrow(Up|Down)$/.test(e.key)) return; e.preventDefault(); const all = $$("[data-pid]", p), i = all.indexOf(t); all[(i + (e.key === "ArrowDown" ? 1 : -1) + all.length) % all.length]?.focus(); });
      },
      focus: (p) => $("[data-pq]", p),
      block: (s) => M.yarn("post", { id: s.id }, { posts: S.data.thoughts }),
      empty: (s) => !s.id,
    },
    raw: {
      title: "Markdown",
      state: (b) => ({ raw: b.raw || "" }),
      html: (s) => `<p class="st-note">The block view can't draw this one (a table or HTML), so it stays as markdown. The preview shows it the way the site will.</p>${S.f.area(s, "raw", { label: "Markdown", rows: 8, cls: "st-mono st-bk__rawta" })}`,
      wire(p, s, apply) { S.bind(p, s, () => apply()); },
      block: (s) => ({ type: "raw", raw: s.raw }),
      empty: (s) => !s.raw.trim(),
    },
  };
  function linkRow(s, i) {
    const l = s.links[i];
    return `<li class="st-bk__link"><div class="st-fieldrow">${S.f.text(s, `links.${i}.text`, { label: i ? `Text ${i + 1}` : "Text", placeholder: "Optional: the site's name by default" })}${S.f.text(s, `links.${i}.href`, { label: i ? `Link ${i + 1}` : "Link", placeholder: "https://…", type: "url", mono: true, inputmode: "url" })}</div>
      <p class="st-hint" data-why="${i}">${l.href ? whyOf(l.href) : ""}</p>${s.links.length > 1 || l.href ? `<button type="button" class="ylinkicon ylinkicon--sm st-bk__lrm" data-rmlink="${i}" aria-label="Remove link ${i + 1}"><i class="ph-bold ph-x" aria-hidden="true"></i></button>` : ""}</li>`;
  }
  const whyOf = (href) => { const i = Y.linkInfo?.(href); return !i ? "" : i.valid ? `${esc(i.name || i.host)}${i.brand ? " · its logo on the button" : ""}` : esc(i.why); };
  function checkUrl(p, s, i) { const w = $(`[data-why="${i}"]`, p); if (w) w.innerHTML = s.links[i]?.href ? whyOf(s.links[i].href) : ""; }
  function mentionables() {
    const out = [];
    for (const p of S.data.projects) if ((p.name || "").trim()) out.push({ ref: `project:${p.id}`, name: p.name, word: "project", icon: "ph-folder-simple" });
    for (const m of S.data.music) if ((m.name || "").trim()) out.push({ ref: `release:${m.id}`, name: m.name, word: "release", icon: "ph-music-notes" });
    for (const t of S.data.thoughts) {
      const name = t.title || t.name || ""; if (!name) continue;
      const word = t.type === "tierlist" ? "ranking" : (S.TTYPES[t.type]?.label || "post").toLowerCase();
      out.push({ ref: `post:${t.id}`, name, word, icon: S.TTYPES[t.type]?.icon || "ph-note" });
      if (t.type === "tierlist") for (const it of Y.post.tierItems(t)) out.push({ ref: `post:${t.id}#${it}`, name: it, word: `ranked on ${name}`, icon: "ph-ranking" });
    }
    return out;
  }

  // the Blocks | Markdown toggle (the kit segment's ychange) and the raw text
  document.addEventListener("ychange", (e) => {
    const name = e.detail?.name || ""; if (!name.startsWith("bk:")) return;
    const box = document.getElementById(name.slice(3)); if (typeof box?._bk?.toMode !== "function") return;
    e.stopPropagation();
    box._bk.toMode(e.detail.value);
  }, true);
  document.addEventListener("input", (e) => {
    const ta = e.target.closest?.("[data-bkraw]"); if (!ta) return;
    const box = ta.closest(".st-bk"), item = box?._bkItem; if (!item) return;
    ta.style.height = "auto"; ta.style.height = `${Math.max(260, ta.scrollHeight + 4)}px`;
    S.set(item, box.dataset.md, ta.value); E.changed?.(box.dataset.md);
    const w = $("[data-words]", box); if (w) w.textContent = countText(ta.value, box.hasAttribute("data-compact"));
    const ch = $("[data-chars]", box); if (ch) { const mx = +ch.textContent.split("/")[1]; ch.textContent = `${ta.value.length} / ${mx}`; ch.classList.toggle("is-over", ta.value.length > mx); }
  });
  const wire0 = E.wireMd;
  E.wireMd = (root, item) => {
    $$(".st-bk", root).forEach((box) => {
      box._bkItem = item;
      const st = PENDING.get(box.id);
      if (st && !st.blocks) { // the block view couldn't be built: the markdown, editable, and a note
        PENDING.delete(box.id);
        box.dataset.mode = "md"; $("[data-bkdoc]", box).hidden = true; $("[data-bkraw]", box).hidden = false;
        $$(".yseg__btn", box).forEach((x) => { x.setAttribute("aria-pressed", String(x.dataset.v === "md")); if (x.dataset.v === "blocks") x.disabled = true; });
        $(".st-bk__hint", box).insertAdjacentHTML("afterbegin", `<span class="st-bk__warn">Showing the markdown: the block view couldn't draw this text. · </span>`);
        return;
      }
    });
    wire0(root, item);
  };
  // demo states for the ⚙ Screen presets: ?demo=slash · bkmenu · bkform · bksel · bkmd
  S.on("render", (name, q) => {
    const demo = q.get("demo"); if (!["slash", "bkmenu", "bkform", "bksel", "bkmd", "bkgallery"].includes(demo)) return;
    setTimeout(() => {
      const box = $(".st-bk"), ed = box?._bk; if (!ed) return;
      const bs = ed.blocks();
      box.scrollIntoView({ block: "start" }); scrollBy(0, -140);
      if (demo === "slash") { const b = bs.find((x) => x.type === "p") || bs[0]; ed.plusAt(b); }
      if (demo === "bkmenu") { const b = bs.find((x) => x.type === "h") || bs[0]; ed.focusBlock(b); setTimeout(() => ed.openMenu(b, $("[data-bkgrip]", box)), 60); }
      if (demo === "bkform") { const b = bs.find((x) => x.type === "yarn") || bs.find((x) => x.type === "img"); if (b) { $(`[data-b="${b.id}"]`, box).scrollIntoView({ block: "center" }); ed.openForm(b); } }
      if (demo === "bksel") { const i = bs.findIndex((x) => x.type === "li"); ed.selectBlocks(bs.slice(Math.max(0, i), Math.max(0, i) + 2)); }
      if (demo === "bkmd") ed.toMode("md");
      if (demo === "bkgallery") { const g = $(".st-bk .yb-yarn[data-kind=images]"); g?.scrollIntoView({ block: "center" }); $(".st-prevbox .ymd--images")?.scrollIntoView({ block: "center" }); }
    }, 120);
  });
})();
