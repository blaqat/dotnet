/* ============================================================
   Studio · links (i9 · links agent: S5 + S2)
   E.links(item, { key, label, placeholder })   one links field for everywhere Studio keeps links: a song, a collection
     track, the collection itself (its album / playlist), a project, the images post, a pick, Home's contacts.
     Owner (pins 5, 11, 15, 18): "a list any of arbitrary links and the ones we recognize we convert" · "choose the
     copy/text for a link" · "why not multiple links".
     - paste any address, or several at once (one per line): the kit's recogniser (Yarn.linkInfo) converts the ones it
       knows: the brand mark + name, the address normalised (tracking dropped, youtu.be → youtube.com …), the kind
       (track · album · playlist · set · repo · video …). Anything else is a plain link named after its domain.
     - each link has its own text (the copy); empty = the default (the service's name, "Play on itch.io" …)
     - reorder: drag the grip (mouse, touch) or Space + arrows (E.kbdReorder) · remove: ✕, Undo in the toast
     - an address that isn't one says so under its row (and in the add box, for pasted lines that aren't links)
     Data: item[key] = [{ url, text? }] (studio-data.js migrates every older shape on load). The field wires itself
     (one set of document listeners, keyed by data-links), so a screen only places the HTML: the music editor's
     linkFields(x, base) is this field.
   E.plForm(p) · E.wirePl(view, p)   the playlist editor (S2): your songs + tracks pasted from SoundCloud, Spotify,
     Bandcamp, YouTube (Apple Music …). An external track: { url, title, by, dur?, art? }: the title + artist are read
     off the address (both editable in the row), its art is the service's mark unless one is picked from Media, the
     length is optional. Rows keep the playlist's fixed columns: art · title · length · ✕.
   ============================================================ */
(() => {
  "use strict";
  const S = window.Studio, Y = window.Yarn, E = S.ed;
  const { $, $$, esc } = S;

  /* ---------- the model ---------- */
  const toLinks = (v) => Y.links(Array.isArray(v) ? v : v && typeof v === "object" ? { links: v } : [], { all: true }).map((l) => (l.text ? { url: l.url, text: l.text } : { url: l.url }));
  // stable keys for rows (reorder + FLIP) without writing ids into the data
  const KEYS = new WeakMap();
  let kn = 0;
  const kOf = (o) => { if (!KEYS.has(o)) KEYS.set(o, `k${++kn}`); return KEYS.get(o); };
  const REG = new Map(); // field id → { id, item, key, label, placeholder, t }
  const prune = () => { const now = Date.now(); for (const [id, r] of REG) if (now - r.t > 5000 && !document.querySelector(`[data-links="${id}"]`)) REG.delete(id); };
  const kindWord = (inf) => (inf.valid && !["link", "email"].includes(inf.kind) ? inf.kind : "");
  const named = (inf) => (inf.valid ? (kindWord(inf) ? `${inf.name} ${inf.kind}` : inf.name) : "link");

  /* ---------- markup ---------- */
  const markHTML = (inf) => (inf.valid
    ? Y.linkIcon({ ...inf, label: `Open the ${named(inf)}` }) + (kindWord(inf) ? `<span class="st-lk__kind" aria-hidden="true">${kindWord(inf)}</span>` : "")
    : `<span class="ylinkicon st-lk__none" aria-hidden="true"><i class="ph-bold ph-link-break"></i></span>`);
  const row = (l, r) => {
    const inf = Y.linkInfo(l.url), k = kOf(l), u = `${r.id}-${k}`;
    const what = inf.valid ? `the ${l.text ? `“${l.text}”` : named(inf)} link` : "this link";
    return `<li class="st-li st-lk" data-key="${k}">
      <button type="button" class="st-grip" aria-pressed="false" aria-label="Move ${esc(what)}" aria-describedby="${r.id}-help"><i class="ph-bold ph-dots-six-vertical" aria-hidden="true"></i></button>
      <div class="yrow st-lkrow">
        <span class="st-lk__mark" data-lkmark>${markHTML(inf)}</span>
        <span class="st-lk__f">
          <label class="sr-only" for="${u}-t">Text for ${esc(what)}</label>
          <input class="yfield st-in st-lk__t" id="${u}-t" data-lk="text" value="${esc(l.text || "")}" placeholder="${esc(inf.valid ? inf.label : "Text")}" maxlength="60" autocomplete="off" enterkeyhint="next">
          <label class="sr-only" for="${u}-u">Address of ${esc(what)}</label>
          <input class="yfield st-in st-mono st-lk__u" id="${u}-u" data-lk="url" type="url" inputmode="url" value="${esc(l.url)}" spellcheck="false" autocomplete="off" aria-describedby="${u}-e"${inf.valid ? "" : ' aria-invalid="true"'}>
          <span class="st-lk__err" id="${u}-e"${inf.valid ? " hidden" : ""}><i class="ph-bold ph-warning" aria-hidden="true"></i>${esc(inf.why)}</span>
        </span>
        <button type="button" class="ylinkicon ylinkicon--sm st-lk__rm" data-lkrm aria-label="Remove ${esc(what)}"><i class="ph-bold ph-x" aria-hidden="true"></i></button>
      </div></li>`;
  };
  const rowsHTML = (r) => r.item[r.key].map((l) => row(l, r)).join("");
  // the add box: one part for the links field and the playlist (paste one or several, one per line)
  E.linkAdd = (id, placeholder, label = "links") => `<div class="st-lkadd" data-lkadd>
      <label class="sr-only" for="${id}-add">Add ${esc(label)}: paste one or more, one per line</label>
      <div class="st-lkadd__row"><textarea class="yfield st-ta st-mono st-lkadd__in" id="${id}-add" rows="1" data-lkin placeholder="${esc(placeholder)}" spellcheck="false" autocomplete="off" aria-describedby="${id}-adderr"></textarea>
        <button type="button" class="btn st-lkadd__btn" data-lkaddbtn aria-label="Add ${esc(label)}"><i class="ph-bold ph-plus" aria-hidden="true"></i><span>Add</span></button></div>
      <p class="st-lk__err" id="${id}-adderr" data-lkadderr role="status" hidden></p></div>`;
  E.links = (item, { key = "links", label = "Links", placeholder = "Paste a link, or several", onChange = null } = {}) => {
    if (!Array.isArray(item[key])) item[key] = toLinks(item[key]);
    const id = Y.uid("lk");
    const r = { id, item, key, label, placeholder, onChange, t: Date.now() };
    REG.set(id, r);
    if (REG.size > 40) prune();
    return `<div class="st-links" data-links="${id}">
      <ol class="st-list st-lklist" data-lklist aria-label="${esc(label)}, in order"${item[key].length ? "" : " hidden"}>${rowsHTML(r)}</ol>
      ${E.linkAdd(id, placeholder, label.toLowerCase())}
      <p class="sr-only" id="${id}-help">Drag the handle, or press Space and use the arrow keys to move it.</p></div>`;
  };

  /* ---------- reading a paste ---------- */
  // lines (and spaces) split it; a line of prose keeps only its link-looking words ("listen: soundcloud.com/a/b")
  E.parseLinks = (text) => {
    const ok = [], bad = [];
    for (const line of String(text || "").split(/\r?\n/)) {
      const toks = line.trim().split(/\s+/).filter(Boolean);
      if (!toks.length) continue;
      const linky = toks.filter((t) => /^[a-z][a-z0-9+.-]*:\S|\w\.[a-z]{2,}/i.test(t));
      for (const t of linky.length ? linky : [line.trim()]) {
        const clean = t.replace(/^[<(["'“]+|[>)\]"'”,;]+$/g, "");
        const inf = Y.linkInfo(clean);
        if (inf.valid) ok.push(inf); else bad.push(clean);
      }
    }
    return { ok, bad };
  };
  const short = (s) => (s.length > 32 ? `${s.slice(0, 30)}…` : s);
  // i9 · walk (F5): WebKit's field-sizing sizes an empty box to one row, not to its placeholder (Chromium fits the
  // placeholder), so a placeholder that wraps (the playlist's, any at phone width) was cut by the box's border in Safari.
  // An empty box gets a min-height that fits its placeholder at its current width; typing clears it.
  const phFit = (ta) => {
    if (!ta?.isConnected) return;
    if (ta.value) { ta.style.minHeight = ""; return; }
    const cs = getComputedStyle(ta), m = document.createElement("div");
    Object.assign(m.style, { position: "absolute", left: "-9999px", top: "0", visibility: "hidden", boxSizing: "border-box", width: `${ta.getBoundingClientRect().width}px`, padding: cs.padding, borderStyle: "solid", borderColor: "transparent", borderWidth: `${cs.borderTopWidth} ${cs.borderRightWidth} ${cs.borderBottomWidth} ${cs.borderLeftWidth}`, font: cs.font, letterSpacing: cs.letterSpacing, lineHeight: cs.lineHeight, whiteSpace: "pre-wrap", overflowWrap: cs.overflowWrap || "anywhere" });
    m.textContent = ta.placeholder; document.body.appendChild(m);
    const h = Math.ceil(m.getBoundingClientRect().height); m.remove();
    ta.style.minHeight = ""; const base = parseFloat(getComputedStyle(ta).minHeight) || 0; // (the stylesheet's own floor)
    if (h > base + 1) ta.style.minHeight = `${h}px`;
  };
  const phAll = () => $$("textarea.st-lkadd__in").forEach(phFit);
  let phRaf = 0; const phSoon = () => { cancelAnimationFrame(phRaf); phRaf = requestAnimationFrame(phAll); };
  S.on("render", phSoon); addEventListener("resize", phSoon); document.fonts?.ready?.then(phSoon);
  const fit = (ta) => { if (!ta) return; phFit(ta); if (CSS.supports?.("field-sizing", "content")) return; ta.style.height = "auto"; ta.style.height = `${Math.min(200, ta.scrollHeight + 2)}px`; };
  // what the add box says about the lines it kept (and links already there)
  E.addReport = (box, bad, dup) => {
    const ta = $("[data-lkin]", box), err = $("[data-lkadderr]", box), msgs = [];
    if (bad.length === 1) msgs.push(`“${short(bad[0])}”: ${Y.linkInfo(bad[0]).why.replace(/^\w/, (c) => c.toLowerCase())}`);
    else if (bad.length) msgs.push(`${bad.length} lines aren't links yet (they stay in the box): ${bad.map((b) => `“${short(b)}”`).join(", ")}.`);
    if (dup.length) msgs.push(`${dup.join(", ")} ${dup.length === 1 ? "is" : "are"} already in the list.`);
    err.innerHTML = msgs.length ? `<i class="ph-bold ph-warning" aria-hidden="true"></i>${esc(msgs.join(" "))}` : "";
    err.hidden = !msgs.length;
    if (bad.length) ta.setAttribute("aria-invalid", "true"); else ta.removeAttribute("aria-invalid");
    ta.value = bad.join("\n"); fit(ta);
  };
  const flash = (els) => els.forEach((el) => { if (!el) return; el.classList.remove("is-flash"); void el.offsetWidth; el.classList.add("is-flash"); setTimeout(() => el.classList.remove("is-flash"), 1300); });

  /* ---------- the field's behaviour (document listeners, once) ---------- */
  const ctx = (el) => {
    const host = el.closest?.("[data-links]"), r = host && REG.get(host.dataset.links);
    const li = el.closest?.(".st-lk"), l = li && r ? r.item[r.key].find((x) => kOf(x) === li.dataset.key) : null;
    return { host, r, li, l };
  };
  const hostOf = (r) => $$("[data-links]").find((h) => { const x = REG.get(h.dataset.links); return x && x.item === r.item && x.key === r.key; }) || null;
  const notify = (r) => { r.onChange?.(); E.changed?.(r.key); S.persist(); };
  const repaint = (r, host) => {
    const ol = $("[data-lklist]", host);
    Y.flip(ol, ".st-lk", () => { ol.innerHTML = rowsHTML(r); ol.hidden = !r.item[r.key].length; });
  };
  const addTo = (r, host, text) => {
    const { ok, bad } = E.parseLinks(text), list = r.item[r.key];
    const have = new Map(list.map((l) => [Y.linkInfo(l.url).url, l])), added = [], dup = [], dupEls = [];
    for (const inf of ok) {
      if (have.has(inf.url)) { dup.push(inf.label); dupEls.push(host.querySelector(`.st-lk[data-key="${kOf(have.get(inf.url))}"] .st-lkrow`)); continue; }
      const l = { url: inf.url };
      list.push(l); have.set(inf.url, l); added.push(inf);
    }
    const box = $("[data-lkadd]", host);
    E.addReport(box, bad, dup);
    if (added.length) {
      repaint(r, host); notify(r);
      Y.sound("token-add", { el: $("[data-lkaddbtn]", box) });
      S.say(`Added ${added.map(named).join(", ")}`);
    } else if (!dup.length) Y.sound("nope", { el: $("[data-lkaddbtn]", box) });
    if (dupEls.length) flash(dupEls);
    return added.length;
  };
  const removeLink = (r, host, l) => {
    const list = r.item[r.key], i = list.indexOf(l);
    if (i < 0) return;
    list.splice(i, 1);
    const inf = Y.linkInfo(l.url), name = l.text || (inf.valid ? inf.label : "the link");
    repaint(r, host); notify(r);
    Y.sound("tag-remove");
    const rms = $$(".st-lk__rm", host);
    (rms[Math.min(i, rms.length - 1)] || $("[data-lkin]", host))?.focus({ preventScroll: true });
    S.say(`Removed ${name}`);
    S.toast({ icon: "ph-trash", title: `Removed “${name}”`, undo: () => {
      list.splice(Math.min(i, list.length), 0, l);
      const h = hostOf(r); if (h) repaint(r, h);
      notify(r); S.say(`${name} is back`);
    } });
  };
  const commit = (r, host) => {
    const ol = $("[data-lklist]", host), list = r.item[r.key];
    const next = $$(".st-lk", ol).map((li) => list.find((l) => kOf(l) === li.dataset.key)).filter(Boolean);
    if (next.length !== list.length) return;
    list.splice(0, list.length, ...next);
    ol.innerHTML = rowsHTML(r);
    notify(r);
  };
  // drag + keys are made the first time a hand or the keyboard reaches the list (rows re-render; the list stays)
  const armed = new WeakSet();
  const arm = (host) => {
    const ol = host && $("[data-lklist]", host);
    if (!ol || armed.has(ol)) return;
    armed.add(ol);
    const r = () => REG.get(host.dataset.links);
    window.TierDrag?.create({ root: ol, layer: S.layer(), itemSel: ".st-lk", handle: ".st-grip", axis: "y", enabled: () => true, items: () => $$(".st-lk", ol), zones: () => [{ zone: ol, hit: ol }],
      onStart: (li) => Y.sound("pickup", { el: li }),
      onDrop: (li, info) => { Y.sound("drop", { el: li }); if (info.from.index !== info.to.index) { commit(r(), host); S.say(`Moved to position ${info.to.index + 1}`); } } });
    E.kbdReorder(ol, ".st-lk", ".st-grip", () => commit(r(), host));
  };
  const armFrom = (e) => { const ol = e.target.closest?.("[data-lklist]"); if (ol) arm(ol.closest("[data-links]")); };
  document.addEventListener("pointerdown", armFrom, true);
  document.addEventListener("focusin", armFrom, true);

  document.addEventListener("input", (e) => {
    const el = e.target, f = el.dataset?.lk;
    if (el.matches?.("[data-links] [data-lkin]")) { fit(el); if (!el.value.trim()) E.addReport($("[data-lkadd]", el.closest("[data-links]")), [], []); return; }
    if (!f) return;
    const { r, li, l } = ctx(el);
    if (!r || !l) return;
    if (f === "text") { if (el.value.trim()) l.text = el.value; else delete l.text; }
    if (f === "url") {
      l.url = el.value.trim();
      const inf = Y.linkInfo(l.url);
      $("[data-lkmark]", li).innerHTML = markHTML(inf);
      $(".st-lk__t", li).placeholder = inf.valid ? inf.label : "Text";
      if (inf.valid) { el.removeAttribute("aria-invalid"); $(".st-lk__err", li).hidden = true; } // fixed: say so at once (the error waits for the blur)
    }
    notify(r);
  });
  document.addEventListener("change", (e) => {
    const el = e.target, f = el.dataset?.lk;
    if (!f) return;
    const { r, li, l } = ctx(el);
    if (!r || !l) return;
    if (f === "text") { const v = el.value.trim(); if (v) l.text = v; else delete l.text; el.value = v; notify(r); return; }
    const inf = Y.linkInfo(el.value);
    const err = $(".st-lk__err", li);
    if (inf.valid) {
      if (inf.url !== el.value) { el.value = l.url = inf.url; notify(r); S.say(`Cleaned up: ${inf.url}`); }
      el.removeAttribute("aria-invalid"); err.hidden = true;
      $("[data-lkmark]", li).innerHTML = markHTML(inf);
    } else { el.setAttribute("aria-invalid", "true"); err.innerHTML = `<i class="ph-bold ph-warning" aria-hidden="true"></i>${esc(inf.why)}`; err.hidden = false; }
  });
  document.addEventListener("click", (e) => {
    const rm = e.target.closest?.("[data-links] [data-lkrm]");
    if (rm) { const { r, host, l } = ctx(rm); if (r && l) removeLink(r, host, l); return; }
    const ab = e.target.closest?.("[data-links] [data-lkaddbtn]");
    if (ab) { const { r, host } = ctx(ab); const ta = $("[data-lkin]", host); if (!ta.value.trim()) { ta.focus(); Y.sound("nope", { el: ab }); return; } addTo(r, host, ta.value); }
  });
  document.addEventListener("keydown", (e) => {
    const ta = e.target.closest?.("[data-links] [data-lkin]");
    if (!ta || e.key !== "Enter" || e.shiftKey || e.isComposing) return;
    e.preventDefault();
    const { r, host } = ctx(ta);
    if (ta.value.trim()) addTo(r, host, ta.value);
  });
  // a paste of links into the empty box adds them right away (typing a list by hand waits for Enter / Add)
  document.addEventListener("paste", (e) => {
    const ta = e.target.closest?.("[data-links] [data-lkin]");
    if (!ta || ta.value.trim()) return;
    const text = e.clipboardData?.getData("text") || "";
    if (!E.parseLinks(text).ok.length) return;
    e.preventDefault();
    const { r, host } = ctx(ta);
    addTo(r, host, text);
  });

  /* ============================================================
     PLAYLIST EDITOR (S2) · your songs + tracks from anywhere
     ============================================================ */
  const isExt = (t) => !!t && !t.src && !!t.url;
  const parseDur = (v) => {
    const s = String(v || "").trim();
    if (!s) return { ok: true, txt: "", secs: 0 };
    // 3:20 · 3.20 · 320 (the last two digits are seconds) · 45 (seconds)
    const m = s.match(/^(\d{1,3})[:.](\d{2})$/) || (/^\d{3,4}$/.test(s) ? [s, s.slice(0, -2), s.slice(-2)] : null);
    const secs = m ? (+m[2] < 60 ? +m[1] * 60 + +m[2] : NaN) : /^\d{1,2}$/.test(s) ? +s : NaN;
    return secs > 0 ? { ok: true, txt: Y.fmtTime(secs), secs } : { ok: false, txt: s, secs: 0 };
  };
  const secsOf = (t) => (isExt(t) ? parseDur(t.dur).secs : S.durOf(t));
  E.plForm = () => `<div class="st-pl"><div><div class="st-field"><label for="pl-q">Your music</label><input class="yfield st-in" id="pl-q" type="search" placeholder="Search your tracks…" data-plq autocomplete="off"></div><ul class="st-plpick" data-plpick aria-label="Your tracks"></ul></div>
      <div><span class="st-lab" style="font:800 .8rem/1.2 var(--font-display);color:var(--ink-2)">In the playlist <span class="meta" data-pltotal></span></span><ol class="st-list" data-pl style="margin-top:8px" aria-label="Playlist order"></ol><p class="st-hint" data-plempty>Add your songs, or paste links from anywhere.</p>
        <div class="st-plfrom" data-plfrom>${E.linkAdd("pl", "Paste SoundCloud, Spotify, Bandcamp, YouTube links", "tracks from other services")}</div></div></div>
      <p class="sr-only" id="st-pl-help">Drag the handle, or press Space and use the arrow keys to move it.</p>`;
  const plRow = (t, i) => {
    const k = kOf(t), grip = (name) => `<button type="button" class="st-grip" aria-pressed="false" aria-label="Reorder ${esc(name)}" aria-describedby="st-pl-help"><i class="ph-bold ph-dots-six-vertical" aria-hidden="true"></i></button>`;
    if (!isExt(t)) return `<li class="st-li" data-key="${k}">${grip(t.title)}<div class="yrow st-plrow">${S.swatch(S.trackRef(t), { size: 40 })}<b>${i + 1}. ${esc(t.title)}</b><span class="meta">${esc(t.dur || "")}</span><button type="button" class="ylinkicon ylinkicon--sm" data-unsong="${k}" aria-label="Remove ${esc(t.title)}"><i class="ph-bold ph-x" aria-hidden="true"></i></button></div></li>`;
    const inf = Y.linkInfo(t.url), name = t.title || `this ${named(inf)}`, d = parseDur(t.dur);
    return `<li class="st-li st-plx" data-key="${k}">${grip(name)}<div class="yrow st-plrow st-plrow--x">
        <button type="button" class="st-plart" data-plart="${k}" aria-haspopup="dialog" aria-label="Art for ${esc(name)}: ${t.art ? "a picture from Media" : `the ${esc(inf.name)} mark`}. Change it">${Y.post.extArt(t, { size: 40, radius: 8 })}</button>
        <span class="st-plmeta"><span class="st-pln" aria-hidden="true">${i + 1}.</span><span class="st-plins">
          <input class="st-plin st-plin--t" data-plf="title" value="${esc(t.title || "")}" placeholder="Add the title" aria-label="Title of the ${esc(named(inf))}" autocomplete="off" maxlength="90">
          <input class="st-plin st-plin--b" data-plf="by" value="${esc(t.by || "")}" placeholder="Artist" aria-label="Artist" autocomplete="off" maxlength="60"></span></span>
        <input class="st-plin st-pldur meta" data-plf="dur" value="${esc(t.dur || "")}" placeholder="m:ss" aria-label="Length of ${esc(name)} (optional)" inputmode="numeric" autocomplete="off" maxlength="6"${d.ok ? "" : ' aria-invalid="true"'}>
        <button type="button" class="ylinkicon ylinkicon--sm" data-unsong="${k}" aria-label="Remove ${esc(name)}"><i class="ph-bold ph-x" aria-hidden="true"></i></button>
      </div></li>`;
  };
  E.wirePl = (view, p) => {
    p.tracks ||= [];
    const songs = S.allSongs();
    const pick = $("[data-plpick]", view), pl = $("[data-pl]", view), from = $("[data-plfrom]", view);
    const has = (s) => p.tracks.some((t) => t.src === s.url);
    const byKey = (k) => p.tracks.find((t) => kOf(t) === k);
    const paintPick = (qq = "") => { pick.innerHTML = songs.filter((s) => !qq || `${s.name} ${s.coll || ""}`.toLowerCase().includes(qq.toLowerCase())).map((s) => `<li><button type="button" class="yrow ylift st-plrow" data-song="${esc(s.url)}" aria-pressed="${has(s)}">${S.swatch(s, { size: 40 })}<b>${esc(s.name)}</b><span class="meta">${Y.fmtTime(S.durOf(s))}</span><span class="st-plus-ic" aria-hidden="true"><i class="ph-bold ${has(s) ? "ph-check" : "ph-plus"}"></i></span><span class="sr-only">${has(s) ? "in the playlist, tap to remove" : "add"}</span></button></li>`).join(""); };
    const total = () => {
      const n = p.tracks.length, secs = p.tracks.reduce((a, t) => a + secsOf(t), 0), open = p.tracks.some((t) => isExt(t) && !parseDur(t.dur).secs);
      $("[data-pltotal]", view).textContent = n ? `${n} · ${Y.fmtTime(secs)}${open ? "+" : ""}` : "";
      $("[data-pltotal]", view).title = open ? "Plus the tracks without a length" : "";
    };
    const paintPl = () => { pl.innerHTML = p.tracks.map(plRow).join(""); $("[data-plempty]", view).hidden = p.tracks.length > 0; total(); };
    const changed = () => { E.changed("tracks"); };
    paintPick(); paintPl();
    $("[data-plq]", view).addEventListener("input", (e) => paintPick(e.target.value));
    // paste links: your own song's address adds the song; anything else is an external track
    const addFrom = (text) => {
      const { ok, bad } = E.parseLinks(text), dup = [], added = [];
      for (const inf of ok) {
        const mine = songs.find((s) => s.url === inf.url || Y.linkInfo(s.url).url === inf.url);
        if (mine) { if (has(mine)) { dup.push(mine.name); continue; } const t = { title: mine.name, by: "aiden", dur: Y.fmtTime(S.durOf(mine)), src: mine.url }; p.tracks.push(t); added.push(t); continue; }
        const same = p.tracks.find((t) => isExt(t) && Y.linkInfo(t.url).url === inf.url);
        if (same) { dup.push(same.title || named(inf)); continue; }
        const t = { url: inf.url, title: inf.guess?.title || "", by: inf.guess?.by || "", dur: "" };
        p.tracks.push(t); added.push(t);
      }
      E.addReport($("[data-lkadd]", from), bad, dup);
      if (!added.length) { if (!dup.length) Y.sound("nope", { el: $("[data-lkaddbtn]", from) }); return; }
      Y.flip(pl, ".st-li", paintPl);
      paintPick($("[data-plq]", view).value);
      changed();
      Y.sound("token-add", { el: $("[data-lkaddbtn]", from) });
      S.say(`Added ${added.map((t) => (isExt(t) ? `${t.title || "a track"} from ${Y.linkInfo(t.url).name}` : t.title)).join(", ")}`);
      // one track that still needs its name: its title field takes the cursor
      if (added.length === 1 && isExt(added[0]) && !added[0].title) requestAnimationFrame(() => pl.querySelector(`[data-key="${kOf(added[0])}"] [data-plf="title"]`)?.focus());
    };
    from.addEventListener("click", (e) => { if (!e.target.closest("[data-lkaddbtn]")) return; const ta = $("[data-lkin]", from); if (!ta.value.trim()) { ta.focus(); Y.sound("nope", { el: e.target }); return; } addFrom(ta.value); });
    from.addEventListener("keydown", (e) => { const ta = e.target.closest("[data-lkin]"); if (!ta || e.key !== "Enter" || e.shiftKey || e.isComposing) return; e.preventDefault(); if (ta.value.trim()) addFrom(ta.value); });
    from.addEventListener("paste", (e) => { const ta = e.target.closest("[data-lkin]"); if (!ta || ta.value.trim()) return; const text = e.clipboardData?.getData("text") || ""; if (!E.parseLinks(text).ok.length) return; e.preventDefault(); addFrom(text); });
    from.addEventListener("input", (e) => { const ta = e.target.closest("[data-lkin]"); if (ta) { fit(ta); if (!ta.value.trim()) E.addReport($("[data-lkadd]", from), [], []); } });
    // an external track's title / artist / length, in its row
    pl.addEventListener("input", (e) => {
      const f = e.target.dataset.plf; if (!f) return;
      const t = byKey(e.target.closest(".st-li")?.dataset.key); if (!t) return;
      t[f] = e.target.value;
      if (f === "dur") { if (parseDur(t.dur).ok) e.target.removeAttribute("aria-invalid"); total(); } // (a wrong length says so on leaving the field)
      changed();
    });
    pl.addEventListener("change", (e) => {
      const f = e.target.dataset.plf; if (!f) return;
      const t = byKey(e.target.closest(".st-li")?.dataset.key); if (!t) return;
      if (f === "dur") { const d = parseDur(t.dur); if (d.ok) { t.dur = e.target.value = d.txt; e.target.removeAttribute("aria-invalid"); } else e.target.setAttribute("aria-invalid", "true"); total(); }
      else { t[f] = e.target.value = e.target.value.trim(); }
      changed();
    });
    pl.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.matches("[data-plf]")) { e.preventDefault(); e.target.blur(); e.target.focus(); } });
    view.addEventListener("click", (e) => {
      const sb = e.target.closest("[data-song]");
      if (sb) { const s = songs.find((x) => x.url === sb.dataset.song); if (has(s)) { p.tracks = p.tracks.filter((t) => t.src !== s.url); Y.sound("chip-off", { el: sb }); } else { p.tracks.push({ title: s.name, by: "aiden", dur: Y.fmtTime(S.durOf(s)), src: s.url }); Y.sound("chip-on", { el: sb }); } paintPick($("[data-plq]", view).value); Y.flip(pl, ".st-li", paintPl); changed(); return; }
      const ub = e.target.closest("[data-unsong]");
      if (ub) {
        const t = byKey(ub.dataset.unsong), i = p.tracks.indexOf(t); if (!t) return;
        p.tracks.splice(i, 1); Y.sound("tag-remove", { el: ub }); paintPick($("[data-plq]", view).value); Y.flip(pl, ".st-li", paintPl); changed();
        const name = t.title || (isExt(t) ? Y.linkInfo(t.url).name : "track");
        S.toast({ icon: "ph-trash", title: `Removed “${name}”`, undo: () => { p.tracks.splice(Math.min(i, p.tracks.length), 0, t); paintPick($("[data-plq]", view).value); Y.flip(pl, ".st-li", paintPl); changed(); } });
        return;
      }
      const ab = e.target.closest("[data-plart]");
      if (ab) artSheet(byKey(ab.dataset.plart), ab, () => { paintPl(); changed(); requestAnimationFrame(() => pl.querySelector(`[data-plart="${ab.dataset.plart}"]`)?.focus({ preventScroll: true })); });
    });
    const commit = () => { const next = $$(".st-li", pl).map((li) => byKey(li.dataset.key)).filter(Boolean); if (next.length === p.tracks.length) p.tracks = next; paintPl(); changed(); };
    window.TierDrag.create({ root: pl, layer: S.layer(), itemSel: ".st-li", handle: ".st-grip", axis: "y", enabled: () => true, items: () => $$(".st-li", pl), zones: () => [{ zone: pl, hit: pl }], onStart: (li) => Y.sound("pickup", { el: li }), onDrop: (li, info) => { Y.sound("drop", { el: li }); if (info.from.index !== info.to.index) commit(); } });
    E.kbdReorder(pl, ".st-li", ".st-grip", commit);
  };
  // an external track's art: the service's mark (default) or any picture in Media (single choice: the rope)
  const artSheet = (t, from, onChange) => {
    if (!t) return;
    const inf = Y.linkInfo(t.url);
    const imgs = S.library().filter((f) => f.kind === "image" && S.url(f.src));
    const opt = (src, inner, label) => { const on = (t.art || "") === src; return `<button type="button" class="st-artopt ysel" role="radio" aria-checked="${on}" aria-pressed="${on}" data-art="${esc(src)}" aria-label="${esc(label)}">${inner}</button>`; };
    S.sheet({
      from, title: "Track art", width: 560,
      html: `<p class="st-artfor">${Y.post.extArt(t, { size: 44, radius: 10 })}<span><b>${esc(t.title || "Untitled")}</b>${t.by ? `<span class="meta">${esc(t.by)}</span>` : ""}</span>${Y.dlink({ href: inf.url, label: `Open on ${inf.name}`, kind: inf.brand, cls: "btn--sm" })}</p>
        <div class="st-artpick" role="radiogroup" aria-label="Art for ${esc(t.title || "this track")}">${opt("", Y.post.extArt({ url: t.url }, { size: 76, radius: 12 }), `The ${inf.name} mark`)}${imgs.map((f) => opt(S.norm(f.src), `<img src="${esc(S.url(f.src))}" alt="" loading="lazy" decoding="async">`, f.file)).join("")}</div>`,
      foot: `<span class="ydetail__spacer"></span><button type="button" class="btn btn--ink" data-close>Done</button>`,
      onMount: (s) => {
        s.el.addEventListener("click", (e) => {
          const b = e.target.closest("[data-art]"); if (!b) return;
          if (b.dataset.art) t.art = b.dataset.art; else delete t.art;
          $$("[data-art]", s.el).forEach((x) => { const on = x === b; x.setAttribute("aria-checked", String(on)); x.setAttribute("aria-pressed", String(on)); });
          $(".st-artfor .yxart", s.el).outerHTML = Y.post.extArt(t, { size: 44, radius: 10 });
          Y.sound("chip-on", { el: b });
          onChange();
        });
        s.el.addEventListener("keydown", (e) => {
          const b = e.target.closest?.("[data-art]"); if (!b || !/^Arrow(Left|Right|Up|Down)$/.test(e.key)) return;
          e.preventDefault();
          const all = $$("[data-art]", s.el), j = (all.indexOf(b) + (/Right|Down/.test(e.key) ? 1 : -1) + all.length) % all.length;
          all[j].focus(); all[j].click();
        });
      },
    });
  };
  E.plTime = (p) => { const ts = p.tracks || [], secs = ts.reduce((a, t) => a + secsOf(t), 0); return `${Y.fmtTime(secs)}${ts.some((t) => isExt(t) && !parseDur(t.dur).secs) ? " + the ones without a length" : ""}`; };
  E.plChecks = (p) => {
    const need = (p.tracks || []).filter((t) => isExt(t) && !(t.title || "").trim());
    return need.length ? [{ ok: "warn", title: `${need.length} ${need.length === 1 ? "track needs" : "tracks need"} a title`, text: `${Y.linkInfo(need[0].url).name} links don't say the song's name.`, fix: () => document.querySelector(`[data-pl] [data-key="${kOf(need[0])}"] [data-plf="title"]`)?.focus(), fixLabel: "Add it" }] : [];
  };
})();
