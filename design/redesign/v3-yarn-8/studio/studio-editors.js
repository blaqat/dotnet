/* ============================================================
   Studio · editors: shared shell (kit detail: sticky top + sticky foot),
   media strip, token fields, markdown, audio + waveform; then the
   Project, Music, Home & About editors and the Thought composers
   (scratch, article, pick, playlist, images). Tier lists: studio-tiers.js.
   ============================================================ */
(() => {
  "use strict";
  const S = window.Studio, Y = window.Yarn;
  const { $, $$, esc } = S;
  const E = (S.ed = {});

  /* ============================================================
     SHELL
     ============================================================ */
  // i7 · studio (S1): the kit's detail shell, the way an item page wears it (owner: "No floating footers"):
  //   sticky top bar = Back · the compact title · utilities (Preview toggle on phones, History, Publish)
  //   head = the facts line as a label over the title (?dlayout=label, decided: publish state · autosave) → the title
  //          (an input in the shell's title type)
  //   body = form | live preview (layout=split, decided) · phones: the Preview toggle swaps them
  const paneNow = () => (new URLSearchParams(location.search).get("pane") === "preview" ? "preview" : "edit");
  E.shell = ({ section, item, back, titlePath = "name", titlePH = "Untitled", title = "", headExtra = "", facts = "", form = "", preview = "", previewHead = "", wide = false }) => `
    <article class="ydetail ydetail--page st-ed${wide ? " st-ed--wide" : ""}" data-pane="${paneNow()}">
      <div class="ydetail__top">
        <a class="ydetail__back" href="${back.href}"><i class="ph-bold ph-arrow-left" aria-hidden="true"></i>${esc(back.label)}</a>
        <p class="ydetail__mini" aria-hidden="true" data-mini>${esc(title || S.get(item, titlePath) || titlePH)}</p>
        <div class="ydetail__actions">
          ${wide ? "" : `<button type="button" class="ylinkicon ysel ytog st-panebtn" data-pane-toggle aria-pressed="${paneNow() === "preview"}" aria-label="Preview"><i class="ph-bold ph-eye" aria-hidden="true"></i></button>`}
          <a class="ylinkicon" href="${S.href("history", { section, id: item.id })}" aria-label="History"><i class="ph-bold ph-clock-counter-clockwise" aria-hidden="true"></i></a>
          <button type="button" class="btn btn--red st-pubbtn" data-publish><i class="ph-bold ph-paper-plane-tilt" aria-hidden="true"></i><span>${pubLabel(item)}</span></button>
        </div>
      </div>
      <header class="ydetail__head">
        <div class="ydetail__facts st-ed__facts"><span class="st-pubslot" data-pubfact>${S.pub(item._pub)}</span>${S.saveHTML(item)}${facts}</div>
        ${title ? `<h1 class="ydetail__title">${esc(title)}</h1>` : titlePath ? `<label class="sr-only" for="st-title">Title</label><textarea class="st-titlein ydetail__title" id="st-title" rows="1" data-f="${titlePath}" placeholder="${esc(titlePH)}" enterkeyhint="next">${esc(S.get(item, titlePath) || "")}</textarea>` : ""}
        ${headExtra ? `<div class="st-ed__headmeta" data-headmeta>${headExtra}</div>` : ""}
      </header>
      <div class="st-ed__grid">
        <div class="st-ed__form" data-form>${form}</div>
        ${wide ? "" : `<aside class="st-ed__preview" aria-label="Preview">
          <div class="st-prevhead"><span class="eyebrow"><i class="ph-bold ph-eye" aria-hidden="true"></i>Preview <span class="meta">as on blaqat.net</span></span>${previewHead}</div>
          <div class="st-prevbox" data-prev>${preview}</div></aside>`}
      </div>
    </article>`;
  // the button names what it will do (phones keep the verb: the facts line says what's live)
  const pubLabel = (it) => (it._pub === "draft" ? "Publish" : it._pub === "changed" ? `Publish<span class="st-pubw"> edits</span>` : "Published");
  // wire: autosave + preview refresh + pane toggle + publish
  E.wire = (view, { section, item, checks, preview, onChange }) => {
    const art = $(".st-ed", view);
    const prev = $("[data-prev]", view);
    let pt = 0;
    const refresh = () => { if (!prev || !preview) return; clearTimeout(pt); pt = setTimeout(() => E.swapPreview(prev, preview()), 120); };
    const changed = (path, el) => {
      S.touch(section, item);
      if (path === (art.querySelector("#st-title")?.dataset.f)) $("[data-mini]", view).textContent = S.get(item, path) || "Untitled";
      onChange?.(path, el);
      refresh();
    };
    S.bind(art, item, changed);
    E.changed = changed;
    E.refresh = refresh;
    // title textarea grows with its text (fallback for field-sizing)
    const t = $("#st-title", view);
    if (t) { const fit = () => { t.style.height = "auto"; t.style.height = t.scrollHeight + "px"; }; t.addEventListener("input", fit); requestAnimationFrame(fit); t.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); $("[data-form] input, [data-form] textarea, [data-form] button", view)?.focus(); } }); }
    // Preview (phones, and desktop with layout=single): one kit toggle in the top bar (red fill while it shows the preview)
    const paneBtn = $("[data-pane-toggle]", view);
    paneBtn?.addEventListener("click", () => {
      const to = art.dataset.pane === "preview" ? "edit" : "preview";
      art.dataset.pane = to;
      paneBtn.setAttribute("aria-pressed", String(to === "preview"));
      const u = new URL(location.href); to === "preview" ? u.searchParams.set("pane", "preview") : u.searchParams.delete("pane"); history.replaceState(history.state, "", u);
      if (to === "preview") E.swapPreview(prev, preview());
      Y.sound(to === "preview" ? "open" : "close", { el: paneBtn });
      S.say(to === "preview" ? "Showing the preview" : "Showing the editor");
      scrollTo({ top: 0 });
    });
    const pb = $("[data-publish]", view);
    const paintPub = () => { $("[data-pubfact]", view).innerHTML = S.pub(item._pub); $("span", pb).innerHTML = pubLabel(item); pb.disabled = item._pub === "live" || item._pub === "hidden"; pb.classList.toggle("btn--red", !pb.disabled); $("i", pb).className = `ph-bold ${pb.disabled ? "ph-check" : "ph-paper-plane-tilt"}`; }; // nothing to publish: the kit's quiet disabled button, not a faded red one
    paintPub();
    const off = S.on("pub", (it) => { if (it === item) paintPub(); });
    S.onLeave(off);
    pb.addEventListener("click", () => S.publish({ section, item, btn: pb, checks: checks(), onDone: paintPub }));
    // links inside the preview don't navigate away
    prev?.addEventListener("click", (e) => { const a = e.target.closest("a, [data-back]"); if (a) { e.preventDefault(); S.toast({ icon: "ph-eye", title: "Just a preview", text: "Links work on the live page." , duration: 2200 }); } });
    if (S.opt.offline) S.toast({ icon: "ph-cloud-slash", title: "You're offline", text: "Edits save on this device and sync when you're back.", duration: 4000 });
    return { refresh, changed };
  };
  // replace preview contents but keep media nodes that didn't change (no video flicker) and the scroll spot
  E.swapPreview = (box, htmlStr) => {
    if (!box) return;
    const top = box.scrollTop;
    const tmp = document.createElement("div");
    tmp.innerHTML = htmlStr;
    const oldCar = $(".ycar", box), newCar = $(".ycar", tmp);
    if (oldCar && newCar && oldCar.dataset.sig && oldCar.dataset.sig === newCar.dataset.sig) newCar.replaceWith(oldCar);
    box.replaceChildren(...tmp.childNodes);
    box.scrollTop = top;
  };
  E.sec = (title, body, { meta = "", action = "", id = Y.uid("s") } = {}) =>
    `<section class="st-sec" aria-labelledby="${id}"><div class="st-sec__h"><h2 class="eyebrow" id="${id}">${title}${meta ? ` <span class="meta">${meta}</span>` : ""}</h2>${action}</div>${body}</section>`;
  E.newId = (p) => `${p}-${Date.now().toString(36)}`;
  E.nothere = (view, what) => { view.innerHTML = `<div class="st-wrap">${Y.empty({ title: `That ${what} isn't here anymore.`, action: { label: "Back to the studio", icon: "ph-arrow-left", href: S.href("dashboard") } })}</div>`; }; // i7 · C1: the kit's empty state

  /* ============================================================
     TOKEN FIELD (kit search: Enter/Tab/comma → token, backspace twice removes)
     unknown words become new tokens too
     ============================================================ */
  E.tokens = (host, { item, key, kind, values, label, placeholder, onChange }) => {
    let vals = [...new Set([...(values || []), ...(item[key] || [])])];
    let api = null, gen = 0;
    const build = () => {
      const mine = ++gen; // a rebuilt field retires the old model (its debounced query must not write back)
      const F = Y.filters({ groups: [{ key: "v", kind, label, values: vals }], url: false });
      (item[key] || []).forEach((v) => F.state.v.add(F.info("v", v).value));
      host.innerHTML = ""; host.className = "";
      api = Y.search(host, F, { placeholder, label, hint: false });
      host.setAttribute("role", "group");
      host.setAttribute("aria-label", label);
      F.on(() => {
        if (mine !== gen) return;
        const next = [...F.state.v];
        if (next.join("\u0000") === (item[key] || []).join("\u0000")) return; // typing only changes the query
        item[key] = next; onChange?.();
      });
    };
    build();
    host.addEventListener("keydown", (e) => {
      if (!(e.key === "Enter" || e.key === ",")) return;
      const inp = e.target.closest(".ysearch__input"); if (!inp) return;
      const v = inp.value.trim().replace(/^#/, "");
      if (host.querySelector(".ysearch__pop:not([hidden]) .ysearch__opt")) return; // a suggestion is highlighted: the kit adds it
      if (!v || vals.some((x) => x.toLowerCase() === v.toLowerCase() || (kind === "tag" && `#${x}`.toLowerCase() === v.toLowerCase()))) return;
      e.preventDefault(); e.stopPropagation();
      vals.push(v); item[key] = [...(item[key] || []), v]; onChange?.();
      build(); api.focus(); Y.sound("token-add", { el: host });
    }, true);
    return { focus: () => api.focus() };
  };

  /* ============================================================
     MEDIA STRIP — upload, reorder (drag the handle / keyboard), cover, poster, alt
     ============================================================ */
  const vidOf = (m) => S.isVideo(m.src, m.kind);
  E.mtile = (m, i, item, { cover = true } = {}) => {
    const vid = vidOf(m), isCover = cover && (item._cover || 0) === i;
    const what = vid ? "video" : "image";
    const img = m.poster ? `<img src="${m.poster}" alt="">` : S.mediaEl(m.src, { poster: m.posterAt || 0.6 });
    return `<li class="st-mtile" data-i="${i}" data-key="${esc(m.src)}">
      <button type="button" class="st-mtile__btn" data-medit="${i}" aria-label="Edit ${what} ${i + 1}${isCover ? ", cover" : ""}${m.alt ? `: ${esc(m.alt)}` : ", needs alt text"}">${img}
        ${isCover ? `<span class="st-cover"><i class="ph-fill ph-star" aria-hidden="true"></i>Cover</span>` : ""}
        ${vid ? `<span class="ycar__dur" aria-hidden="true"><i class="ph-fill ph-play"></i><span>${m.dur ? Y.fmtTime(m.dur) : "video"}</span></span><span class="st-poster" aria-hidden="true">poster ${m.posterAt ? `@ ${Y.fmtTime(m.posterAt)}` : "· auto"}</span>` : ""}
        ${m._up != null ? `<span class="st-upmsg" data-upmsg>${m._msg || "Uploading"}</span><span class="st-knitbar" aria-hidden="true"><b style="--v:${Math.round(m._up * 100)}%"></b></span>` : ""}
      </button>
      <div class="st-mtile__cap"><button type="button" class="st-mtile__grip" aria-pressed="false" aria-label="Move ${what} ${i + 1}" aria-describedby="st-media-help"><i class="ph-bold ph-dots-six" aria-hidden="true"></i></button><span class="meta${m.alt ? "" : " is-missing"}">${m.alt ? esc(m.alt) : "needs alt text"}</span></div>
    </li>`;
  };
  E.media = (item, field, { grid = false, cover = true, accept = "image/*,video/*", addLabel = "Add photos & videos", hint = "" } = {}) => `
    <div class="st-drop" data-drop="${field}">
      <ul class="st-media${grid ? " is-grid" : ""}" data-media="${field}" data-cover="${cover}" aria-label="Media, in order">${(item[field] || []).map((m, i) => E.mtile(m, i, item, { cover })).join("")}
        <li class="st-mtile st-mtile--add"><label class="st-add"><input type="file" class="sr-only" multiple accept="${accept}" data-up="${field}"><i class="ph-bold ph-plus-circle" aria-hidden="true"></i><span>${addLabel}</span><small>from your phone, or drop here</small></label></li>
      </ul></div>
    <p class="sr-only" id="st-media-help">Drag the handle, or press Space and use the arrow keys to move it.</p>
    <p class="st-hint"><button type="button" class="ylinkbtn" data-sample="${field}">Add a sample file</button> · ${hint || `videos get a poster frame automatically · ${cover ? "★ marks the cover" : "drag to set the order"}`}</p>`;
  E.wireMedia = (root, item, field, onChange, { pool = ["/media/wsg.mp4", "/media/sona-auri.png", "/media/beepsearch.png", "/media/webcheckers.mp4", "/media/nina.jpg"], max = 0 } = {}) => {
    const ul = $(`[data-media="${field}"]`, root);
    const cover = ul.dataset.cover === "true";
    const repaint = () => { const add = $(".st-mtile--add", ul); $$(".st-mtile:not(.st-mtile--add)", ul).forEach((n) => n.remove()); add.insertAdjacentHTML("beforebegin", (item[field] || []).map((m, i) => E.mtile(m, i, item, { cover })).join("")); };
    E.repaintMedia = repaint;
    const coverObj = () => (item[field] || [])[item._cover || 0];
    const reorderFromDOM = () => {
      const c = coverObj();
      const keys = $$(".st-mtile:not(.st-mtile--add)", ul).map((li) => li.dataset.key);
      item[field] = keys.map((k) => item[field].find((m) => m.src === k));
      if (cover) item._cover = Math.max(0, item[field].indexOf(c));
      repaint(); onChange(field);
    };
    if (window.TierDrag) window.TierDrag.create({
      root: ul, layer: S.layer(), itemSel: ".st-mtile:not(.st-mtile--add)", handle: ".st-mtile__grip", enabled: () => true,
      items: () => $$(".st-mtile:not(.st-mtile--add)", ul), zones: () => [{ zone: ul, hit: ul }],
      onStart: (li) => Y.sound("pickup", { el: li }),
      onDrop: (li, info) => { Y.sound("drop", { el: li }); if (info.from.index !== info.to.index) { const add = $(".st-mtile--add", ul); ul.appendChild(add); reorderFromDOM(); S.say(`Moved to position ${info.to.index + 1}`); } },
    });
    E.kbdReorder(ul, ".st-mtile:not(.st-mtile--add)", ".st-mtile__grip", reorderFromDOM, { before: $(".st-mtile--add", ul) });
    ul.addEventListener("click", (e) => { const b = e.target.closest("[data-medit]"); if (b) E.mediaSheet(item, field, +b.dataset.medit, b, { cover, onChange: () => { repaint(); onChange(field); } }); });
    const addFiles = async (files) => {
      for (const file of files) {
        const kind = file.type.startsWith("video") ? "video" : "image";
        const src = URL.createObjectURL(file);
        const m = { src, alt: "", kind, _up: 0, _msg: "Uploading" };
        (item[field] ||= []).push(m);
        if (max && item[field].length > max) item[field].splice(0, item[field].length - max);
        repaint();
        await E.fakeUpload(ul, m, file.size, async () => {
          if (kind === "video") { m._msg = "Picking a poster…"; paintUp(ul, m); const p = await S.posterFrom(src); if (p) { m.poster = p.poster; m.dur = p.dur; } }
        });
        S.addUpload({ file: file.name, src, kind, size: file.size, poster: m.poster || 0, dur: m.dur || 0 });
        delete m._up; delete m._msg;
        repaint(); onChange(field);
      }
    };
    root.addEventListener("change", (e) => { const inp = e.target.closest(`[data-up="${field}"]`); if (inp) { addFiles([...inp.files]); inp.value = ""; } });
    root.addEventListener("click", async (e) => {
      const s = e.target.closest(`[data-sample="${field}"]`); if (!s) return;
      const src = pool.find((p) => !(item[field] || []).some((m) => m.src === p)) || pool[0];
      const m = { src, alt: "", kind: S.isVideo(src) ? "video" : "image", _up: 0, _msg: "Uploading" };
      (item[field] ||= []).push(m);
      if (max && item[field].length > max) item[field].splice(0, item[field].length - max);
      repaint();
      await E.fakeUpload(ul, m, 4e6, async () => { if (m.kind === "video") { m._msg = "Picking a poster…"; paintUp(ul, m); await new Promise((r) => setTimeout(r, Y.reduced() ? 0 : 500)); m.posterAt = 0.6; } });
      delete m._up; delete m._msg; repaint(); onChange(field);
      Y.sound("token-add", { el: s });
    });
    const drop = $(`[data-drop="${field}"]`, root);
    drop.addEventListener("dragover", (e) => { if ([...(e.dataTransfer?.types || [])].includes("Files")) { e.preventDefault(); drop.classList.add("is-over"); } });
    drop.addEventListener("dragleave", (e) => { if (!drop.contains(e.relatedTarget)) drop.classList.remove("is-over"); });
    drop.addEventListener("drop", (e) => { e.preventDefault(); drop.classList.remove("is-over"); addFiles([...e.dataTransfer.files].filter((f) => /^(image|video)\//.test(f.type))); });
  };
  const paintUp = (ul, m) => { const li = ul.querySelector(`[data-key="${CSS.escape(m.src)}"]`); if (!li) return; const b = $(".st-knitbar b", li); if (b) b.style.setProperty("--v", `${Math.round(m._up * 100)}%`); const t = $("[data-upmsg]", li); if (t) t.textContent = m._up < 1 ? `${m._msg} ${Math.round(m._up * 100)}%` : m._msg; };
  E.fakeUpload = (ul, m, size, after) => new Promise((res) => {
    S.progress(Math.min(2600, 700 + size / 6e3), (f) => { m._up = f; paintUp(ul, m); }, async () => { m._up = 1; await after?.(); res(); });
  });

  // media sheet: preview, alt, cover, poster frame, remove
  E.mediaSheet = (item, field, i, from, { cover = true, onChange }) => {
    const m = item[field][i]; if (!m) return;
    const vid = vidOf(m), u = S.url(m.src);
    const frames = [0.6, 2, 4, 6, 9, 12];
    const pv = vid ? (u ? `<video src="${u}#t=${m.posterAt || 0.6}" muted playsinline preload="metadata" controls aria-label="Video preview"></video>` : S.mediaEl(m.src)) : m.poster ? `<img src="${m.poster}" alt="">` : u ? `<img src="${u}" alt="">` : S.mediaEl(m.src);
    const state = { alt: m.alt || "", cover: (item._cover || 0) === i };
    S.sheet({
      from, title: vid ? "Video" : "Photo", width: 620,
      html: `<div class="st-mprev">${pv}</div>
        ${vid && u ? `<div class="st-field"><span class="st-lab">Poster frame <span class="meta">what shows before it plays</span></span><div class="st-frames" role="radiogroup" aria-label="Poster frame">${frames.map((t) => `<button type="button" class="st-frame ysel" role="radio" aria-checked="${(m.posterAt || 0.6) === t}" aria-pressed="${(m.posterAt || 0.6) === t}" data-t="${t}" aria-label="Frame at ${Y.fmtTime(t)}"><video src="${u}#t=${t}" muted playsinline preload="metadata" aria-hidden="true" tabindex="-1"></video><span>${Y.fmtTime(t)}</span></button>`).join("")}</div></div>` : ""}
        ${S.f.text(state, "alt", { label: "Alt text", placeholder: vid ? "What happens in the video" : "What's in the picture", hint: "Screen readers read this. Keep it short and specific." })}
        ${cover ? S.f.toggle(state, "cover", { label: "Use as the cover", text: "Shows on the card and in link previews." }) : ""}`,
      foot: `<button type="button" class="btn btn--ghost" data-rm><i class="ph-bold ph-trash" aria-hidden="true"></i><span>Remove from ${field === "images" ? "project" : "post"}</span></button><span class="ydetail__spacer"></span><button type="button" class="btn btn--ink" data-close>Done</button>`,
      onMount: (s) => {
        S.bind(s.el, state, (path) => {
          if (path === "alt") m.alt = state.alt;
          if (path === "cover") item._cover = state.cover ? item[field].indexOf(m) : 0;
          onChange();
        });
        s.el.addEventListener("click", (e) => {
          const f = e.target.closest(".st-frame");
          if (f) { $$(".st-frame", s.el).forEach((b) => { const on = b === f; b.setAttribute("aria-pressed", String(on)); b.setAttribute("aria-checked", String(on)); }); m.posterAt = +f.dataset.t; m.poster = 0; const v = $(".st-mprev video", s.el); if (v) v.currentTime = m.posterAt; Y.sound("chip-on", { el: f }); onChange(); }
          if (e.target.closest("[data-rm]")) { const c = item[field][item._cover || 0]; item[field].splice(item[field].indexOf(m), 1); item._cover = Math.max(0, item[field].indexOf(c)); Y.sound("tag-remove"); s.close({ silent: true }); onChange(); S.toast({ icon: "ph-trash", title: "Removed from this " + (field === "images" ? "project" : "post"), text: "The file stays in Media until you remove it there.", undo: () => { item[field].splice(i, 0, m); onChange(); } }); }
        });
      },
    });
  };

  /* keyboard reorder for any strip/list: Space picks up, arrows move, Space drops, Esc cancels */
  E.kbdReorder = (root, itemSel, gripSel, commit, { before = null } = {}) => {
    let held = null;
    const items = () => $$(itemSel, root);
    root.addEventListener("click", (e) => {
      const g = e.target.closest(gripSel);
      if (!g || e.detail !== 0) return;
      const li = g.closest(itemSel);
      if (!held) { held = { li, from: items().map((n) => n.dataset.key) }; g.setAttribute("aria-pressed", "true"); Y.sound("pickup", { el: li }); S.say("Picked up. Arrow keys to move, Space to drop."); }
      else { const h = held; held = null; Y.sound("drop", { el: h.li }); const moved = h.from.join() !== items().map((n) => n.dataset.key).join(); if (moved) commit(); else $(gripSel, h.li).setAttribute("aria-pressed", "false"); S.say("Dropped"); requestAnimationFrame(() => root.querySelector(`${itemSel}[data-key="${CSS.escape(h.li.dataset.key)}"] ${gripSel}`)?.focus()); }
    });
    root.addEventListener("keydown", (e) => {
      if (!held || !e.target.closest(gripSel)) return;
      const lis = items(), i = lis.indexOf(held.li);
      const dir = /ArrowUp|ArrowLeft/.test(e.key) ? -1 : /ArrowDown|ArrowRight/.test(e.key) ? 1 : 0;
      if (dir) {
        e.preventDefault();
        const j = i + dir;
        if (j < 0 || j >= lis.length) { Y.sound("nope"); return; }
        window.TierDrag.flip(lis, () => root.insertBefore(held.li, dir < 0 ? lis[j] : lis[j].nextSibling || before));
        $(gripSel, held.li).focus();
        S.say(`Position ${j + 1} of ${lis.length}`);
      } else if (e.key === "Escape") {
        e.preventDefault(); e.stopPropagation();
        const h = held; held = null;
        window.TierDrag.flip(items(), () => h.from.forEach((k) => root.insertBefore(root.querySelector(`${itemSel}[data-key="${CSS.escape(k)}"]`), before)));
        $(gripSel, h.li).setAttribute("aria-pressed", "false"); $(gripSel, h.li).focus(); S.say("Cancelled");
      }
    });
  };

  /* ============================================================
     MARKDOWN EDITOR (write | split | preview), toolbar wraps the selection
     ============================================================ */
  const TOOLS = [["ph-text-h-two", "Heading", "## ", ""], ["ph-text-b", "Bold", "**", "**"], ["ph-text-italic", "Italic", "_", "_"], ["ph-link", "Link", "[", "](https://)"], ["ph-list-bullets", "List", "- ", ""], ["ph-quotes", "Quote", "> ", ""], ["ph-code", "Code", "`", "`"], ["ph-image", "Image", "![alt](", ")"]];
  E.md = (item, path, { label = "Write-up", mode = "write", rows = 12, placeholder = "## Start with a heading…" } = {}) => {
    const id = Y.uid("md");
    return `<div class="st-md" data-md="${path}" data-mode="${mode}">
      <div class="st-mdbar" role="toolbar" aria-label="${label} formatting">${TOOLS.map(([ic, l], i) => `<button type="button" data-tool="${i}" aria-label="${l}" title="${l}"><i class="ph-bold ${ic}" aria-hidden="true"></i></button>`).join("")}<span class="st-mdbar__sep" aria-hidden="true"></span>
        ${Y.seg([{ value: "write", label: "Write" }, { value: "split", label: "Split" }, { value: "preview", label: "Preview" }], { value: mode, label: `${label} view`, name: `md:${path}` })}</div>
      <div class="st-md__panes"><label class="sr-only" for="${id}">${label} (markdown)</label><textarea class="yfield st-ta st-md__ta" id="${id}" data-f="${path}" rows="${rows}" placeholder="${esc(placeholder)}" spellcheck="true">${esc(S.get(item, path) || "")}</textarea>
        <div class="st-md__prev ydetail__text" aria-label="${label} preview" data-mdprev>${S.md(S.get(item, path) || "")}</div></div>
      <p class="st-hint"><span data-words>${S.words(S.get(item, path))} words</span> · markdown · images from Media paste in as <b>![alt](file)</b></p>
    </div>`;
  };
  E.wireMd = (root, item) => {
    $$(".st-md", root).forEach((box) => {
      const path = box.dataset.md, ta = $("textarea", box), pv = $("[data-mdprev]", box);
      const paint = () => { pv.innerHTML = S.md(ta.value); $("[data-words]", box).textContent = `${S.words(ta.value)} words`; };
      ta.addEventListener("input", paint);
      box.addEventListener("ychange", (e) => { if (e.detail.name === `md:${path}`) { box.dataset.mode = e.detail.value; e.stopPropagation(); } });
      box.addEventListener("click", (e) => {
        const b = e.target.closest("[data-tool]"); if (!b) return;
        const [, , a, z] = TOOLS[+b.dataset.tool];
        const s = ta.selectionStart, en = ta.selectionEnd, v = ta.value;
        const lineStart = !z;
        if (lineStart) { const ls = v.lastIndexOf("\n", s - 1) + 1; ta.setRangeText(a, ls, ls, "end"); }
        else ta.setRangeText(a + v.slice(s, en) + z, s, en, "select");
        if (!lineStart && s === en) { ta.selectionStart = ta.selectionEnd = s + a.length; }
        ta.focus(); ta.dispatchEvent(new Event("input", { bubbles: true }));
      });
    });
  };

  /* ============================================================
     AUDIO + WAVEFORM (upload → duration + peaks; scrub; mock play)
     track fields: url, _file, _dur, _peaks
     ============================================================ */
  E.audio = (t, { label = "Audio" } = {}) => {
    if (!t.url) return `<div class="st-audio__empty" data-audio-empty><i class="ph-bold ph-waveform" aria-hidden="true"></i><b>Add the audio</b><span class="st-note">MP3, WAV or a phone voice memo. Duration and waveform come from the file.</span>
      <span class="st-sheetacts" style="justify-content:center"><label class="btn btn--red btn--sm"><i class="ph-bold ph-upload-simple" aria-hidden="true"></i><span>Upload audio</span><input type="file" class="sr-only" accept="audio/*" data-aup></label><button type="button" class="btn btn--sm" data-asample>Use a sample</button></span></div>`;
    const dur = t._dur || S.durOf(t), peaks = t._peaks || S.peaks(t.url || t.name);
    const file = t._file || S.fileOf(t.url);
    return `<div class="patch st-audio" data-audio>
      <div class="st-audio__top"><button type="button" class="btn btn--icon btn--ink" data-aplay aria-label="Play ${esc(t.name || "track")}" aria-pressed="false"><i class="ph-fill ph-play" aria-hidden="true"></i></button>
        <div class="st-audio__name"><b>${esc(file)}</b><span class="meta"><span data-acur>0:00</span> / ${Y.fmtTime(dur)}${t._rate ? ` · ${(t._rate / 1000).toFixed(1)} kHz` : ""} · waveform saved</span></div>
        <label class="btn btn--ghost btn--sm"><i class="ph-bold ph-arrows-clockwise" aria-hidden="true"></i><span class="st-hide-m">Replace</span><span class="sr-only">Replace audio</span><input type="file" class="sr-only" accept="audio/*" data-aup></label></div>
      <div class="st-wave${t._fresh ? " is-drawing" : ""}" data-wave tabindex="0" role="slider" aria-label="${label} position" aria-valuemin="0" aria-valuemax="${Math.round(dur)}" aria-valuenow="0" aria-valuetext="0:00 of ${Y.fmtTime(dur)}">${S.waveSVG(peaks)}<span class="st-wave__pin" aria-hidden="true"></span></div>
    </div>`;
  };
  // uploads: delegated once on a stable root; getT() = the track being edited; after(host) re-renders that host
  E.wireAudioUploads = (root, getT, after) => {
    root.addEventListener("change", async (e) => {
      const inp = e.target.closest("[data-aup]"); if (!inp || !inp.files[0]) return;
      const file = inp.files[0]; inp.value = "";
      const host = inp.closest("[data-audiohost]");
      await E.loadAudio(host, getT(), { file, name: file.name, size: file.size }, () => after(host));
    });
    root.addEventListener("click", (e) => { const b = e.target.closest("[data-asample]"); if (!b) return; const host = b.closest("[data-audiohost]"); const t = getT(); E.loadAudio(host, t, { name: `${Y.slug(t.name || "take") || "take"}-final.mp3`, size: 3.1e6 }, () => after(host)); });
  };
  // the waveform box: scrub (pointer + arrow keys), mock play (real playback for a freshly uploaded file)
  E.wireAudioBox = (host, t) => {
    const box = $("[data-audio]", host);
    if (!box) return;
    t._fresh = false;
    const wave = $("[data-wave]", box), dur = t._dur || S.durOf(t);
    let pos = 0, playing = false, raf = 0, last = 0, audioEl = null;
    const set = (f) => { pos = Math.max(0, Math.min(1, f)); S.paintWave(wave, pos); wave.setAttribute("aria-valuenow", String(Math.round(pos * dur))); wave.setAttribute("aria-valuetext", `${Y.fmtTime(pos * dur)} of ${Y.fmtTime(dur)}`); $("[data-acur]", box).textContent = Y.fmtTime(pos * dur); };
    const at = (x) => { const r = wave.getBoundingClientRect(); return (x - r.left) / r.width; };
    let drag = false;
    wave.addEventListener("pointerdown", (e) => { drag = true; wave.setPointerCapture(e.pointerId); set(at(e.clientX)); if (audioEl) audioEl.currentTime = pos * dur; });
    wave.addEventListener("pointermove", (e) => { if (drag) { set(at(e.clientX)); if (audioEl) audioEl.currentTime = pos * dur; } });
    wave.addEventListener("pointerup", () => (drag = false));
    wave.addEventListener("keydown", (e) => { const d = e.key === "ArrowRight" ? 5 : e.key === "ArrowLeft" ? -5 : 0; if (d) { e.preventDefault(); set(pos + d / dur); if (audioEl) audioEl.currentTime = pos * dur; } });
    const btn = $("[data-aplay]", box);
    const stop = () => { playing = false; cancelAnimationFrame(raf); audioEl?.pause(); btn.setAttribute("aria-pressed", "false"); btn.innerHTML = `<i class="ph-fill ph-play" aria-hidden="true"></i>`; btn.setAttribute("aria-label", "Play"); };
    const tick = (now) => { if (!playing) return; if (audioEl) set(audioEl.currentTime / dur); else set(pos + (now - last) / 1000 / dur); last = now; if (pos >= 1) return stop(); raf = requestAnimationFrame(tick); };
    btn.addEventListener("click", () => {
      if (playing) { stop(); Y.sound("pause", { el: btn }); return; }
      playing = true; last = performance.now();
      if (/^blob:/.test(t.url)) { audioEl ||= new Audio(t.url); audioEl.currentTime = pos * dur; audioEl.play().catch(() => {}); }
      Y.sound("play", { el: btn });
      btn.setAttribute("aria-pressed", "true"); btn.innerHTML = `<i class="ph-fill ph-pause" aria-hidden="true"></i>`; btn.setAttribute("aria-label", "Pause");
      raf = requestAnimationFrame(tick);
    });
    S.onLeave(stop);
    if (new URLSearchParams(location.search).get("demo") === "wave") set(0.38);
  };
  // the "upload": progress, read/decode, waveform draws in
  E.loadAudio = async (root, t, { file = null, name, size }, rerender) => {
    const host = $("[data-audio], [data-audio-empty]", root);
    if (!host) return;
    host.outerHTML = `<div class="patch st-audio" data-audio-busy><div class="st-audio__top"><span class="ydot" data-section="music" aria-hidden="true"><i class="ph-bold ph-upload-simple"></i></span><div class="st-audio__name"><b>${esc(name)}</b><span class="meta" data-amsg>Uploading 0%</span></div></div><div class="st-mprev" style="aspect-ratio:auto;height:14px;background:var(--cotton-2);border-radius:999px;position:relative"><span class="st-knitbar" style="left:0;right:0;bottom:0;top:0;height:auto"><b style="--v:0%"></b></span></div></div>`;
    const busy = $("[data-audio-busy]", root);
    await new Promise((res) => S.progress(Math.min(2200, 600 + size / 5e3), (f) => { $(".st-knitbar b", busy).style.setProperty("--v", `${Math.round(f * 100)}%`); $("[data-amsg]", busy).textContent = `Uploading ${Math.round(f * 100)}%`; }, res));
    $("[data-amsg]", busy).textContent = "Reading the file · making the waveform…";
    let peaks = null, dur = 0, rate = 44100;
    if (file) { try { const a = await S.decodeAudio(file); peaks = a.peaks; dur = a.duration; rate = a.rate; } catch (_) {} t.url = URL.createObjectURL(file); }
    else { await new Promise((r) => setTimeout(r, Y.reduced() ? 0 : 450)); t.url = `/media/${name}`; }
    t._file = name; t._dur = dur || S.durOf({ url: name }); t._peaks = peaks || S.peaks(name); t._rate = rate; t._fresh = true;
    S.addUpload({ file: name, src: t.url, kind: "audio", size, dur: t._dur });
    Y.sound("token-add");
    rerender();
    S.toast({ icon: "ph-waveform", title: `${Y.fmtTime(t._dur)} · waveform ready`, text: `${name} · ${S.bytes(size)}`, duration: 3200 });
  };

  /* ============================================================
     PROJECT EDITOR · ?screen=project&id=sonata|new
     ============================================================ */
  // i7 · studio (S1): the preview is the opened project exactly as the site writes it (projects/pj-core.js detailHTML):
  // the i5 shell (facts · stack tags · link buttons · media · text), so Studio never shows an older grammar
  E.projectPreview = (p) => {
    const links = [
      p.view ? { href: p.view, label: "Visit site", icon: "ph-arrow-up-right", kind: "view" } : null,
      p.github && p.github !== p.view ? { href: p.github, label: "Source", kind: "github" } : null,
      (p.writeup || "").trim() ? { href: "../thoughts/stitched.html", label: "Read the write-up", icon: "ph-scroll" } : null,
    ].filter(Boolean).map((l, i) => Y.dlink({ ...l, primary: i === 0 })).join("");
    const imgs = (p.images || []).map((m) => ({ src: m.src, alt: m.alt, kind: m.kind }));
    const car = imgs.length ? Y.carousel(imgs, { title: p.name, group: "prev-media" }) : "";
    const sig = (p.images || []).map((m) => m.src + (m.posterAt || "")).join("|");
    return Y.detail({
      back: { label: "Projects" }, actions: `<button type="button" class="ylinkicon" aria-label="Copy link"><i class="ph-bold ph-link" aria-hidden="true"></i></button>`,
      title: p.name || "Untitled project", level: 2,
      facts: Y.fact.type(p.type) + Y.fact.status(p.status) + Y.fact.date(p, { dur: true }),
      stack: (p.stack || []).length ? Y.stackChips(p.stack, { as: "li" }) : "",
      media: car.replace('<section class="ycar"', `<section class="ycar" data-sig="${esc(sig)}"`),
      body: S.md(p.description || "_No description yet._"), links,
    });
  };
  S.screens.project = {
    section: () => "projects", navKey: () => "projects", focus: true, foot: true,
    title: (q) => S.titleOf(S.find("projects", q.get("id"))) || "New project",
    render(view, q) {
      let p = S.find("projects", q.get("id"));
      if (!p && q.get("id") === "new") {
        p = { id: E.newId("project"), name: "", start: Y.fmt.month(new Date(S.now())), status: "Ongoing", type: "Personal", stack: [], images: [], description: "", writeup: "", _pub: "draft", _order: 0, _edited: S.now(), _cover: 0 };
        S.data.projects.unshift(p); S.persist();
        history.replaceState(history.state, "", S.href("project", { id: p.id }));
      }
      if (p && p._pub === "draft") S.onLeave(() => { if (!(p.name || "").trim() && !(p.images || []).length && !(p.description || "").trim()) { const i = S.data.projects.indexOf(p); if (i >= 0) S.data.projects.splice(i, 1); S.persist(); } });
      if (!p) return E.nothere(view, "project");
      const stacks = [...new Set([...S.data.projects.flatMap((x) => x.stack || []), ...Object.keys(Y.DEVICONS)])];
      const isOn = () => Y.status(p.status)?.key === "ongoing";
      const shows = () => `<span class="eyebrow">On the card</span>${Y.cardMeta(p)}`; // the site card's own facts (Yarn.cardMeta)
      const form = [
        E.sec("Media", E.media(p, "images"), { meta: `${(p.images || []).length} · drag to reorder` }),
        E.sec("Details", `
          ${S.f.choice(p, "status", ["Ongoing", "Completed", "Paused", "Dropped"].map((s) => [s, Y.fact.status(s), Y.status(s)?.label || s]), { label: "Status" })}
          ${S.f.choice(p, "type", ["Personal", "Work", "School"].map((t) => [t, Y.fact.type(t), t]), { label: "Type" })}
          <div class="st-fieldrow">${S.f.month(p, "start", { label: "Started" })}<div data-endwrap>${S.f.month(p, "end", { label: isOn() ? "Ended · still going" : "Ended", allowEmpty: true })}</div></div>
          <div class="st-shows" data-shows>${shows()}</div>`),
        E.sec("Stack", `<div class="st-tagfield" data-stack></div><p class="st-hint">Type a tool: <b>py</b> → Python with its icon. Enter, Tab or comma adds it; Backspace twice removes the last one.</p>`),
        E.sec("Links", `<div class="st-fieldrow">${S.f.text(p, "view", { label: "Live site", placeholder: "https://…", type: "url", mono: true, inputmode: "url" })}${S.f.text(p, "github", { label: "GitHub", placeholder: "https://github.com/…", type: "url", mono: true, inputmode: "url" })}</div>`),
        E.sec("Description", S.f.area(p, "description", { label: "Short description", rows: 5, max: 900, placeholder: "What it is, what you did, what was hard.", hint: "Shows on the project page under the media. **Bold** and links work." })),
        E.sec("Write-up", `${E.md(p, "writeup", { label: "Write-up", mode: "write", rows: 9, placeholder: "## The long version\n\nOptional. Publishes as a Thoughts article and the project gets a “Read the write-up” button." })}`, { meta: "optional · becomes a linked article" }),
      ].join("");
      view.innerHTML = E.shell({ section: "projects", item: p, back: { href: S.href("list", { section: "projects" }), label: "Projects" }, titlePH: "Untitled project", form, preview: E.projectPreview(p) });
      const checks = () => {
        const missingAlt = (p.images || []).filter((m) => !m.alt).length;
        return [
          { ok: !!(p.name || "").trim(), title: "Name", text: (p.name || "").trim() ? p.name : "Every project needs a name.", fix: () => { const t = $("#st-title"); t.setAttribute("aria-invalid", "true"); t.focus(); } },
          { ok: !!Y.parseDate(p.start), title: "Start date", text: Y.dateRange(p) || "Pick a month" },
          { ok: (p.images || []).length ? true : "warn", title: (p.images || []).length ? `${p.images.length} media · cover set` : "No media", text: (p.images || []).length ? "" : "The card will show text instead. That's fine for some projects." },
          { ok: missingAlt ? "warn" : true, title: missingAlt ? `${missingAlt} without alt text` : "Alt text on everything", text: missingAlt ? "Screen-reader users get nothing for those." : "", fix: missingAlt ? () => { const i = p.images.findIndex((m) => !m.alt); E.mediaSheet(p, "images", i, $(`[data-medit="${i}"]`), { onChange: () => { E.repaintMedia(); E.changed("images"); } }); } : null, fixLabel: "Add alt text" },
          { ok: (p.description || "").length > 40 ? true : "warn", title: "Description", text: (p.description || "").length > 40 ? `${S.words(p.description)} words` : "Very short. Two sentences help." },
        ];
      };
      E.wire(view, {
        section: "projects", item: p, checks, preview: () => E.projectPreview(p),
        onChange: (path) => {
          if (path === "status" || path === "start" || path === "end" || path === "type") {
            $("[data-shows]", view).innerHTML = shows();
            if (path === "status") paintEnd();
          }
        },
      });
      // ongoing = no end month ("– now"): the end selects step aside
      const paintEnd = () => { $("[data-endwrap] .st-lab", view).textContent = isOn() ? "Ended · still going, shows “now”" : "Ended"; $$("[data-endwrap] select", view).forEach((x) => (x.disabled = isOn())); };
      paintEnd();
      E.wireMedia(view, p, "images", (f) => E.changed(f));
      E.tokens($("[data-stack]", view), { item: p, key: "stack", kind: "stack", values: stacks, label: "Stack", placeholder: "Add a tool: Python, Svelte…", onChange: () => E.changed("stack") });
      E.wireMd(view, p);
      if (q.get("demo") === "upload") {
        const m = { src: "/media/webcheckers.mp4", alt: "", kind: "video", _up: 0.62, _msg: "Uploading" };
        (p.images ||= []).push(m); E.repaintMedia(); const ul = $("[data-media=images]", view); paintUp(ul, m);
        S.onLeave(() => { const i = p.images.indexOf(m); if (i >= 0) p.images.splice(i, 1); });
      }
      if (q.get("sheet") === "media") requestAnimationFrame(() => $("[data-medit='1']", view)?.click());
      if (q.get("sheet") === "publish") requestAnimationFrame(() => S.checkSheet({ section: "projects", item: p, btn: $("[data-publish]", view), checks: checks() }));
      if (q.get("demo") === "published") requestAnimationFrame(() => S.liveToast("projects", p));
      if (q.get("demo") === "publishing") requestAnimationFrame(() => { const b = $("[data-publish]", view); b.classList.add("ysel", "is-publishing"); $("span", b).textContent = "Publishing…"; b.getAnimations?.({ subtree: true }).forEach((a) => { a.pause(); a.currentTime = 900; }); });
    },
  };

  /* ============================================================
     MUSIC EDITOR · ?screen=music&id=…|new[&kind=collection][&track=n]
     ============================================================ */
  const INST = [["piano", "Piano", "black yarn"], ["beepbox", "BeepBox", "purple, circles"], ["daw", "DAW", "blue, waves"]];
  E.musicPreview = (m, tr) => {
    const coll = m.type === "collection";
    const linksOf = (x) => Object.entries(x.links || {}).filter(([, v]) => v).map(([k, v]) => Y.linkIcon(k, v)).join("");
    // i7 · studio (S1): the release as music.js writes it: the swatch as the kicker, the facts line (instrument · status ·
    // date · length), one row of link buttons (Play is the primary), the tracks as rows with fixed columns (B1), notes
    const dur = (x) => Y.fmtTime(x._dur || S.durOf(x));
    const total = coll ? (m.songs || []).reduce((n, s) => n + (s._dur || S.durOf(s)), 0) : (m._dur || S.durOf(m));
    const tracks = coll ? `<section class="st-trks"><h3 class="eyebrow">Tracks <span class="meta">${(m.songs || []).length} · ${Y.fmtTime(total)}</span></h3><ol class="st-tracks">${(m.songs || []).map((s, i) => `<li class="st-track">${S.swatch({ ...s, instrument: s.instrument || m.instrument }, { size: 40 })}<b>${esc(s.name || `Track ${i + 1}`)}</b>${Y.fact.status(s.status, { cls: "yfact--icon", hint: Y.status(s.status)?.label || "" })}<span class="meta st-track__d">${dur(s)}</span></li>`).join("")}</ol></section>` : "";
    const card = Y.folder({ ...m, type: coll ? "collection" : "single" }, {
      tracks: coll ? (m.songs || []).map((s, i) => ({ ...s, id: s.id || `t${i}`, name: s.name || `Track ${i + 1}` })) : [],
      links: coll ? "" : linksOf(m), // (meta: the kit folder's default, status · date facts)
      action: coll ? `<span class="btn btn--red btn--sm" aria-hidden="true"><i class="ph-fill ph-play"></i>Play all</span>` : `<span class="btn btn--red btn--icon" aria-hidden="true"><i class="ph-fill ph-play"></i></span>`,
    });
    const links = `<button type="button" class="btn btn--d btn--red"><i class="ph-fill ph-play" aria-hidden="true"></i><span class="btn__l">${coll ? "Play all" : "Play"}</span></button>`
      + Object.entries((coll ? tr?.links : m.links) || {}).filter(([, u]) => u).map(([k, u]) => Y.dlink({ href: u, kind: k })).join("");
    return `<div class="st-prevrow st-prevcard"><p class="eyebrow">In the library</p>${card}</div>` + Y.detail({
      back: { label: "Music" }, actions: `<button type="button" class="ylinkicon" aria-label="Copy link"><i class="ph-bold ph-link" aria-hidden="true"></i></button>`,
      kicker: `<span class="st-art">${S.swatch(m, { size: 64, radius: 14 })}</span>`,
      title: m.name || (coll ? "Untitled collection" : "Untitled track"), level: 2,
      facts: Y.fact.instrument(m.instrument) + Y.fact.status(m.status) + Y.fact.date(m) + (!coll && (m.url || m._dur) ? Y.fact.text("ph-timer", dur(m)) : ""),
      links, linksLabel: "Listen",
      media: tracks || (m.url ? `<div class="st-wave st-wave--prev" aria-hidden="true">${S.waveSVG(m._peaks || S.peaks(m.url || m.name, 64))}</div>` : ""),
      body: m.description ? S.md(m.description) : "",
    });
  };
  S.screens.music = {
    section: () => "music", navKey: () => "music", focus: true, foot: true,
    title: (q) => S.titleOf(S.find("music", q.get("id"))) || "New music",
    render(view, q) {
      let m = S.find("music", q.get("id"));
      if (!m && q.get("id") === "new") {
        const coll = q.get("kind") === "collection";
        m = { id: E.newId("music"), type: coll ? "collection" : "single", name: "", start: Y.fmt.month(new Date(S.now())), status: "wip", instrument: "piano", url: "", description: "", links: {}, _pub: "draft", _order: 0, _edited: S.now(), ...(coll ? { songs: [{ id: E.newId("t"), name: "", status: "wip", url: "", links: {} }] } : {}) };
        S.data.music.unshift(m); S.persist();
        history.replaceState(history.state, "", S.href("music", { id: m.id }));
      }
      if (m && m._pub === "draft") S.onLeave(() => { if (!(m.name || "").trim() && !m.url && !(m.songs || []).some((x) => x.url || x.name)) { const i = S.data.music.indexOf(m); if (i >= 0) S.data.music.splice(i, 1); S.persist(); } });
      if (!m) return E.nothere(view, "piece");
      m.links ||= {};
      const coll = m.type === "collection";
      let ti = Math.max(0, Math.min((m.songs || []).length - 1, +(q.get("track") || 0)));
      const tr = () => (m.songs || [])[ti];
      const yarn = () => `
        <div class="st-field"><span class="st-lab" id="inst-l">Instrument <span class="meta">the yarn says it, so the site never labels it</span></span>
          <div class="st-insts" role="radiogroup" aria-labelledby="inst-l">${INST.map(([k, l, d]) => `<button type="button" class="yrow ylift ysel${m.instrument === k ? " is-selected" : ""}" role="radio" aria-checked="${m.instrument === k}" data-inst="${k}">${S.swatch({ instrument: k, url: m.url, name: m.name }, { size: 44 })}<span>${l}<small>${d}</small></span></button>`).join("")}</div></div>
        <div class="st-field"><span class="st-lab" id="motif-l">Pattern <span class="meta">auto picks one from the track</span></span>
          <div class="st-motifs" role="radiogroup" aria-labelledby="motif-l">${["", ...window.YarnSwatch.MOTIFS[m.instrument] .filter((v, i, a) => a.indexOf(v) === i)].map((mo) => `<button type="button" class="st-motif ysel" role="radio" aria-checked="${(m._motif || "") === mo}" aria-pressed="${(m._motif || "") === mo}" data-motif="${mo}">${S.swatch({ ...m, _motif: mo || undefined }, { size: 52, motif: mo || undefined })}<span>${mo || "auto"}</span></button>`).join("")}</div></div>`;
      const statusOpts = [["wip", "WIP"], ["complete", "Complete"], ["dropped", "Dropped"]].map(([v, l]) => [v, Y.fact.status(v), l]);
      const linkFields = (x, base) => `<div class="st-fieldrow">${S.f.text(x, "links.soundcloud", { label: '<i class="ph-bold ph-soundcloud-logo" aria-hidden="true"></i> SoundCloud', placeholder: "https://soundcloud.com/…", mono: true, type: "url" })}${S.f.text(x, "links.youtube", { label: '<i class="ph-bold ph-youtube-logo" aria-hidden="true"></i> YouTube', placeholder: "https://youtu.be/…", mono: true, type: "url" })}${(x.instrument || m.instrument) === "beepbox" ? S.f.text(x, "links.beepbox", { label: '<i class="ph-bold ph-circle" aria-hidden="true"></i> BeepBox song', placeholder: "https://beepbox.co/#…", mono: true, type: "url" }) : ""}</div>`;
      const trackPanel = () => {
        const t = tr(); if (!t) return "";
        t.links ||= {};
        return `<div data-track>${S.f.text(t, "name", { label: "Track name", placeholder: `Track ${ti + 1}` })}
          <div class="st-field"><span class="st-lab">Audio</span><div data-audiohost>${E.audio(t)}</div></div>
          ${S.f.choice(t, "status", statusOpts, { label: "Status" })}
          ${linkFields(t)}
          <div class="st-sheetacts"><button type="button" class="btn btn--ghost btn--sm" data-rmtrack><i class="ph-bold ph-trash" aria-hidden="true"></i><span>Remove track</span></button></div></div>`;
      };
      const tabs = () => `<ul class="st-tabs" role="tablist" aria-label="Tracks">${(m.songs || []).map((s, i) => `<li class="st-tab" data-key="${esc(s.id || i)}"><button type="button" class="st-tab__btn ysel" role="tab" id="tab-${i}" aria-selected="${i === ti}" aria-controls="trackpanel" tabindex="${i === ti ? 0 : -1}" data-tab="${i}">${S.swatch({ ...s, instrument: s.instrument || m.instrument }, { size: 20 })}<span>${esc(s.name || `Track ${i + 1}`)}</span></button></li>`).join("")}<li class="st-tab st-tab--add"><button type="button" class="st-tab__btn" data-addtrack aria-label="Add a track"><i class="ph-bold ph-plus" aria-hidden="true"></i><span>Track</span></button></li></ul>`;
      const form = [
        coll ? E.sec("Tracks", `<div class="st-folder"><div data-tabs>${tabs()}</div><div class="patch st-folder__body" role="tabpanel" id="trackpanel" aria-labelledby="tab-${ti}" data-trackpanel data-scope>${trackPanel()}</div></div><p class="st-hint">Drag a tab to reorder. Each tab is a track; the folder is the collection.</p>`, { meta: `${(m.songs || []).length} · the folder on the site` })
          : E.sec("Audio", `<div data-audiohost>${E.audio(m)}</div>`),
        E.sec("Yarn", `<div data-yarn>${yarn()}</div>`),
        E.sec("Details", `${S.f.choice(m, "status", statusOpts, { label: "Status" })}<div class="st-fieldrow">${S.f.month(m, "start", { label: "Made" })}${S.f.month(m, "end", { label: "Finished", allowEmpty: true })}</div><div class="st-shows" data-shows><span class="eyebrow">On the card</span>${Y.cardMeta(m, { parts: ["status", "date"] })}</div>`),
        coll ? "" : E.sec("Links", linkFields(m)),
        E.sec("Notes", S.f.area(m, "description", { label: coll ? "About this collection" : "About this track", rows: 3, max: 400, placeholder: "A line or two. Optional." })),
      ].join("");
      const kindSeg = q.get("id") === "new" || !m.name ? `<div style="margin-top:8px">${Y.seg([{ value: "single", label: "Single", icon: "ph-music-note" }, { value: "collection", label: "Collection", icon: "ph-folder-simple" }], { value: m.type, label: "Kind", name: "kind" })}</div>` : "";
      view.innerHTML = E.shell({ section: "music", item: m, back: { href: S.href("list", { section: "music" }), label: "Music" }, titlePH: coll ? "Untitled collection" : "Untitled track", headExtra: kindSeg, form, preview: E.musicPreview(m, tr()) });
      const paintSwatches = () => { $("[data-yarn]", view).innerHTML = yarn(); };
      const checks = () => [
        { ok: !!(m.name || "").trim(), title: "Name", text: m.name || "Give it a name.", fix: () => { const t = $("#st-title"); t.setAttribute("aria-invalid", "true"); t.focus(); } },
        coll ? { ok: (m.songs || []).length > 0 && (m.songs || []).every((s) => s.url) ? true : false, title: "Every track has audio", text: `${(m.songs || []).filter((s) => s.url).length} of ${(m.songs || []).length} uploaded` }
          : { ok: !!m.url, title: "Audio", text: m.url ? `${Y.fmtTime(m._dur || S.durOf(m))} · waveform saved` : "Upload the track first." },
        { ok: true, title: "Yarn", text: `${INST.find(([k]) => k === m.instrument)?.[1]} · ${m._motif || "auto pattern"}` },
      ];
      E.wire(view, {
        section: "music", item: m, checks, preview: () => E.musicPreview(m, tr()),
        onChange: () => {
                    $("[data-shows]", view).innerHTML = `<span class="eyebrow">On the card</span>${Y.cardMeta(m, { parts: ["status", "date"] })}`;
        },
      });
      // instrument + motif
      view.addEventListener("click", (e) => {
        const ib = e.target.closest("[data-inst]");
        if (ib) { m.instrument = ib.dataset.inst; m._motif = ""; (m.songs || []).forEach((s) => (s.instrument = m.instrument)); paintSwatches(); Y.sound("chip-on", { el: ib }); E.changed("instrument"); $(`[data-inst="${m.instrument}"]`, view)?.focus(); if (coll) $("[data-tabs]", view).innerHTML = tabs(); return; }
        const mb = e.target.closest("[data-motif]");
        if (mb) { m._motif = mb.dataset.motif; paintSwatches(); Y.sound("chip-on", { el: mb }); E.changed("motif"); $(`[data-motif="${m._motif}"]`, view)?.focus(); }
      });
      view.addEventListener("ychange", (e) => {
        if (e.detail.name !== "kind") return;
        m.type = e.detail.value;
        if (m.type === "collection" && !m.songs) m.songs = [{ id: E.newId("t"), name: m.name || "", status: m.status, url: m.url, _dur: m._dur, _peaks: m._peaks, _file: m._file, links: {} }];
        S.touch("music", m); S.render({ pop: true });
      });
      const audioAfter = (host) => { const t = coll ? tr() : m; host.innerHTML = E.audio(t); E.wireAudioBox(host, t); E.changed(coll ? "songs" : "url"); };
      E.wireAudioUploads($("[data-form]", view), () => (coll ? tr() : m), audioAfter);
      const wireTrack = () => { const host = $(coll ? "[data-trackpanel] [data-audiohost]" : "[data-audiohost]", view); E.wireAudioBox(host, coll ? tr() : m); };
      wireTrack();
      if (coll) {
        const panel = $("[data-trackpanel]", view);
        S.bind(panel, new Proxy({}, { get: (_, k) => tr()[k], set: (_, k, v) => ((tr()[k] = v), true) }), () => {});
        const select = (i, focus = true) => {
          ti = i;
          const u = new URL(location.href); u.searchParams.set("track", i); history.replaceState(history.state, "", u);
          $("[data-tabs]", view).innerHTML = tabs();
          panel.innerHTML = trackPanel(); panel.setAttribute("aria-labelledby", `tab-${i}`);
          wireTrack();
          if (focus) $(`#tab-${i}`, view)?.focus();
          E.refresh();
        };
        view.addEventListener("click", (e) => {
          const tb = e.target.closest("[data-tab]");
          if (tb) { select(+tb.dataset.tab); Y.sound("tap"); return; }
          if (e.target.closest("[data-addtrack]")) { m.songs.push({ id: E.newId("t"), name: "", status: "wip", url: "", links: {}, instrument: m.instrument }); select(m.songs.length - 1); E.changed("songs"); Y.sound("token-add"); $("[data-track] input", view)?.focus(); return; }
          if (e.target.closest("[data-rmtrack]")) {
            if (m.songs.length < 2) { Y.sound("nope"); S.toast({ icon: "ph-hand-palm", title: "A collection needs a track", text: "Switch it to a single instead." }); return; }
            const [gone] = m.songs.splice(ti, 1); Y.sound("tag-remove"); select(Math.max(0, ti - 1)); E.changed("songs");
            S.toast({ icon: "ph-trash", title: `Removed “${gone.name || "track"}”`, undo: () => { m.songs.splice(ti + 1, 0, gone); select(ti + 1); E.changed("songs"); } });
          }
        });
        // track fields write into the selected song
        panel.addEventListener("input", (e) => { if (e.target.matches("[data-f]")) { E.changed("songs"); if (e.target.dataset.f === "name") { const b = $(`#tab-${ti} span`, view); if (b) b.textContent = e.target.value || `Track ${ti + 1}`; } } });
        panel.addEventListener("click", (e) => { if (e.target.closest(".st-opt")) setTimeout(() => { E.changed("songs"); $("[data-tabs]", view).innerHTML = tabs(); }, 0); });
        // tabs: arrow keys move between tabs; drag a tab to reorder
        view.addEventListener("keydown", (e) => {
          const tb = e.target.closest?.("[data-tab]"); if (!tb || !/^Arrow(Left|Right)$/.test(e.key) || e.altKey) return;
          e.preventDefault(); select((+tb.dataset.tab + (e.key === "ArrowRight" ? 1 : -1) + m.songs.length) % m.songs.length);
        });
        if (window.TierDrag) window.TierDrag.create({
          root: $("[data-tabs]", view), layer: S.layer(), itemSel: ".st-tab:not(.st-tab--add)", enabled: () => true,
          items: () => $$(".st-tab:not(.st-tab--add)", view), zones: () => [{ zone: $(".st-tabs", view), hit: $(".st-folder", view) }],
          onStart: (li) => Y.sound("pickup", { el: li }),
          onTap: (li) => { const b = $("[data-tab]", li); if (b) { select(+b.dataset.tab); Y.sound("tap"); } },
          onDrop: (li, info) => {
            Y.sound("drop", { el: li });
            if (info.from.index === info.to.index) return;
            const cur = tr();
            const keys = $$(".st-tab:not(.st-tab--add)", view).map((n) => n.dataset.key);
            m.songs = keys.map((k, i) => m.songs.find((s, j) => String(s.id || j) === k));
            select(m.songs.indexOf(cur), false); E.changed("songs");
          },
        });
      }
    },
  };

  /* ============================================================
     HOME & ABOUT · ?screen=home
     ============================================================ */
  const COLORS = [["blue", "Projects blue"], ["purple", "Music purple"], ["gold", "Thoughts gold"], ["red", "Red"], ["orange", "RIT orange"]];
  E.homePreview = (h) => `<div style="padding:22px 0 26px">
      <p class="st-hello">${esc(h.hello)}</p>
      <div class="st-bio">${h.lines.map((l) => `<p>${esc(l.before)} <span class="yscribble" style="--scribble: var(--${l.color})">${esc(l.word)}</span> ${esc(l.after)}</p>`).join("")}</div>
      <div class="st-contact">${h.contact.map((c) => `<a href="${esc(c.href)}"><i class="ph-bold ph-${c.kind === "x" ? "x" : c.kind}-logo" aria-hidden="true"></i>${esc(c.label)}</a>`).join("")}</div></div>`;
  S.screens.home = {
    section: () => "home", navKey: () => "home", focus: true, foot: true, title: () => "Home & About",
    render(view) {
      const h = S.data.home;
      const line = (l, i) => `<div class="patch st-kw" data-line="${i}">
        <div class="st-kw__row">${S.f.text(h, `lines.${i}.before`, { label: "Before" })}${S.f.text(h, `lines.${i}.word`, { label: "Keyword" })}${S.f.text(h, `lines.${i}.after`, { label: "After" })}</div>
        <div class="st-kw__opts"><span class="st-lab">Scribble</span><span class="st-colors" role="radiogroup" aria-label="Scribble colour for ${esc(l.word)}">${COLORS.map(([c, n]) => `<button type="button" class="st-color" role="radio" style="--c: var(--${c})" data-color="${c}" data-line="${i}" aria-checked="${l.color === c}" aria-pressed="${l.color === c}" aria-label="${n}"></button>`).join("")}</span>
          <label class="st-lab" style="margin-left:8px" for="opens-${i}">Opens</label><select class="yfield st-select" id="opens-${i}" data-f="lines.${i}.to" style="width:auto;min-width:150px">${[["projects", "Projects"], ["music", "Music"], ["thoughts", "Thoughts"], ["link", "A link"], ["", "Nothing"]].map(([v, l]) => `<option value="${v}"${l === "" || (h.lines[i].to || "") === v ? " selected" : ""}>${l}</option>`).join("")}</select></div></div>`;
      const form = [
        E.sec("Hello", S.f.text(h, "hello", { label: "First line", placeholder: "hi, i'm aiden!" })),
        E.sec("Intro", `<div style="display:grid;gap:10px">${h.lines.map(line).join("")}</div>`, { meta: "keywords get the scribble underline" }),
        E.sec("Contact", `<div style="display:grid;gap:10px">${h.contact.map((c, i) => `<div class="st-fieldrow" style="grid-template-columns:150px 1fr">${S.f.text(h, `contact.${i}.label`, { label: `<i class="ph-bold ph-${c.kind === "x" ? "x" : c.kind}-logo" aria-hidden="true"></i> ${c.kind[0].toUpperCase() + c.kind.slice(1)}` })}${S.f.text(h, `contact.${i}.href`, { label: "Link", mono: true, type: "url" })}</div>`).join("")}</div>`),
      ].join("");
      view.innerHTML = E.shell({ section: "home", item: h, back: { href: S.href("dashboard"), label: "Studio" }, titlePath: "", title: "Home & About", form, preview: E.homePreview(h) });
      E.wire(view, { section: "home", item: h, checks: () => [{ ok: !!h.hello.trim(), title: "First line", text: h.hello }, { ok: h.lines.every((l) => l.word.trim()), title: "Keywords", text: h.lines.map((l) => l.word).join(" · ") }], preview: () => E.homePreview(h) });
      view.addEventListener("click", (e) => {
        const c = e.target.closest("[data-color]"); if (!c) return;
        const l = h.lines[+c.dataset.line]; l.color = c.dataset.color;
        $$(`[data-color][data-line="${c.dataset.line}"]`, view).forEach((b) => { b.setAttribute("aria-pressed", String(b === c)); b.setAttribute("aria-checked", String(b === c)); });
        Y.sound("chip-on", { el: c }); E.changed("lines");
      });
    },
  };

  /* ============================================================
     THOUGHT COMPOSER · ?screen=compose&type=scratch|article|pick|playlist|embed|tierlist[&id=…]
     ============================================================ */
  // the real Thoughts card (Yarn.post): Studio's collections + counts; links lead nowhere inside a preview
  E.postCard = (p) => Y.post({ ...p, id: p.id || "draft", date: p.date || new Date(S.now()).toISOString() }, {
    collections: S.data.collections || {},
    collCount: (k) => (S.data.thoughts || []).filter((x) => x.collection === k).length,
    inert: true,
  });
  // i7 · studio (S1): the article as Thoughts writes it (stitched.js renderArticle): caps kicker (type · date · read
  // time), the reading-size title, the dek, then the prose; its hashtags close the head
  E.articlePreview = (p) => Y.detail({
    back: { label: "Thoughts" }, title: p.title || "Untitled article", size: "lg", level: 2, wide: true,
    kicker: `${Y.post.typeBadge("article")}${Y.badge.date(p.date || new Date(S.now()).toISOString(), { style: "full" })}<span>${Math.max(1, Math.round(S.words(p.body) / 220))} min read</span>`,
    meta: `${p.dek ? `<p class="st-dek">${esc(p.dek)}</p>` : ""}${Y.tags(p.tags || [])}`,
    media: p.cover && S.url(p.cover) ? `<img class="st-post__cover" src="${S.url(p.cover)}" alt="">` : "",
    body: `<div class="yprose">${S.md(p.body || "")}</div>`,
  });
  S.trackRef = (t) => { const s = S.allSongs().find((x) => x.url === t.src || x.name === t.title); return s || { instrument: "daw", name: t.title, url: t.src }; };

  E.isEmptyPost = (p) => !((p.title || "").trim() || (p.text || "").trim() || (p.name || "").trim() || (p.body || "").trim() || (p.tracks || []).length || (p.media || []).length || Object.values(p.tiers || {}).flat().length || (p.unranked || []).length);
  const BLANK = { scratch: { text: "" }, article: { title: "", dek: "", body: "" }, pick: { name: "", url: "", blurb: "", collection: "tools" }, playlist: { title: "", note: "", tracks: [] }, embed: { title: "", note: "", media: [] }, tierlist: { title: "", tiers: { S: [], A: [], B: [], C: [], D: [] }, unranked: [], settings: { rank: true, comments: true, community: true } } };
  // i3 · owner colours: a scratch's sticky note, a pick's tag stub (kit/posts.js palettes; first = default)
  E.colors = (p, list, label) => `<div class="st-swatches" role="radiogroup" aria-label="${esc(label)}">${list.map(([k, name, hex], i) => {
    const on = (p.color || list[0][0]) === k;
    return `<button type="button" class="st-swatch ysel" role="radio" data-color="${k}" aria-checked="${on}" aria-pressed="${on}" style="--sw:${hex}" title="${esc(name)}"><span class="sr-only">${esc(name)}${i === 0 ? " (default)" : ""}</span></button>`;
  }).join("")}</div>`;
  document.addEventListener("click", (e) => {
    const b = e.target.closest?.(".st-swatch[data-color]"); if (!b || S.state?.name !== "compose") return;
    const p = S.find("thoughts", S.state.q.get("id")); if (!p) return;
    const first = b.parentElement.querySelector(".st-swatch")?.dataset.color;
    if (b.dataset.color === first) delete p.color; else p.color = b.dataset.color;
    b.parentElement.querySelectorAll(".st-swatch").forEach((x) => { x.setAttribute("aria-pressed", String(x === b)); x.setAttribute("aria-checked", String(x === b)); });
    Y.sound("chip-on", { el: b });
    E.changed?.("color");
  });
  const typeChipsFor = (p) => (E.isEmptyPost(p) ? `<div class="st-types" role="radiogroup" aria-label="Post type">${Object.entries(S.TTYPES).map(([k, t]) => `<button type="button" class="ychip ysel" role="radio" data-totype="${k}" aria-checked="${k === p.type}" aria-pressed="${k === p.type}"><i class="ph-bold ${t.icon}" aria-hidden="true"></i><span class="ychip__l">${t.label}</span></button>`).join("")}</div>` : "");
  // an empty draft can still change what it is
  document.addEventListener("click", (e) => {
    const b = e.target.closest?.("[data-totype]"); if (!b || S.state?.name !== "compose") return;
    const p = S.find("thoughts", S.state.q.get("id")); if (!p || p.type === b.dataset.totype) return;
    const keep = { id: p.id, date: p.date, tags: p.tags, _pub: p._pub, _order: p._order, _edited: p._edited };
    Object.keys(p).forEach((k) => delete p[k]);
    Object.assign(p, keep, { type: b.dataset.totype }, JSON.parse(JSON.stringify(BLANK[b.dataset.totype])));
    Y.sound("chip-on", { el: b });
    history.replaceState(history.state, "", S.href("compose", { type: p.type, id: p.id }));
    S.render({ pop: true });
    requestAnimationFrame(() => document.querySelector(`[data-totype="${p.type}"]`)?.focus());
  });
  S.screens.compose = {
    section: () => "thoughts", navKey: () => "thoughts", focus: true, foot: true,
    title: (q) => (q.get("id") ? S.titleOf(S.find("thoughts", q.get("id"))) : `New ${S.TTYPES[q.get("type")]?.label.toLowerCase() || "post"}`),
    render(view, q) {
      const type = S.TTYPES[q.get("type")] ? q.get("type") : "scratch";
      let p = q.get("id") ? S.find("thoughts", q.get("id")) : null;
      if (!p) {
        p = { id: E.newId(type[0]), type, date: new Date(S.now()).toISOString().slice(0, 16), tags: [], _pub: "draft", _order: 0, _edited: S.now(),
          ...JSON.parse(JSON.stringify(BLANK[type])) };
        S.data.thoughts.unshift(p); S.persist();
        history.replaceState(history.state, "", S.href("compose", { type, id: p.id }));
      }
      if (p.type !== type) { history.replaceState(history.state, "", S.href("compose", { type: p.type, id: p.id })); return S.render({ pop: true }); }
      if (type === "tierlist") return S.tierlist(view, q, p, typeChipsFor(p));
      const isNew = E.isEmptyPost(p);
      const typeChips = `<div class="st-types" role="radiogroup" aria-label="Post type">${Object.entries(S.TTYPES).map(([k, t]) => `<button type="button" class="ychip ysel" role="radio" data-totype="${k}" aria-checked="${k === type}" aria-pressed="${k === type}"><i class="ph-bold ${t.icon}" aria-hidden="true"></i><span class="ychip__l">${t.label}</span></button>`).join("")}</div>`;
      S.onLeave(() => { if (E.isEmptyPost(p) && p._pub === "draft") { const i = S.data.thoughts.indexOf(p); if (i >= 0) S.data.thoughts.splice(i, 1); S.persist(); } });
      const tagsSec = E.sec("Tags", `<div class="st-tagfield" data-tags></div><p class="st-hint">Tags link to the Thoughts page filtered by that tag.</p>`);
      let form = "", titlePath = "title", titlePH = "Untitled";
      const coverHolder = { images: p.cover ? [{ src: S.norm(p.cover), alt: p.coverAlt || "" }] : [], _cover: 0 };
      if (type === "scratch") {
        titlePath = "";
        form = E.sec("Scratch", S.f.area(p, "text", { label: "The thought", rows: 5, max: 280, placeholder: "what's on your mind?", cls: "st-scratch" }), { meta: "no title, just the line" })
          + E.sec("Note colour", E.colors(p, Y.post.NOTE_COLORS, "Sticky note colour"), { meta: "the sticky note on the feed" }) + tagsSec;
      } else if (type === "article") {
        form = [
          E.sec("Lede", S.f.text(p, "dek", { label: "One line under the title", placeholder: "What's this about?" })),
          E.sec("Cover", E.media(coverHolder, "images", { cover: false, addLabel: "Add a cover", accept: "image/*", hint: "one image · shows on the card and in link previews" }), { meta: "optional · one image" }),
          E.sec("Body", E.md(p, "body", { label: "Body", mode: innerWidth >= 960 ? "write" : "write", rows: 16, placeholder: "## Start with a heading\n\nWrite in markdown." }), { meta: `${Math.max(1, Math.round(S.words(p.body) / 220))} min read`, action: `<button type="button" class="btn btn--ghost btn--sm" data-notion><i class="ph-bold ph-arrow-square-in" aria-hidden="true"></i><span>Import from Notion</span></button>` }),
          tagsSec,
        ].join("");
      } else if (type === "pick") {
        titlePath = "name"; titlePH = "What are you picking?";
        const colls = S.data.collections;
        const n = (k) => S.data.thoughts.filter((x) => x.type === "pick" && x.collection === k).length;
        form = [
          E.sec("Link", `<div class="st-fieldrow" style="grid-template-columns:1fr auto;align-items:end">${S.f.text(p, "url", { label: "URL", placeholder: "https://…", type: "url", mono: true, inputmode: "url" })}<button type="button" class="btn" data-fetch><i class="ph-bold ph-sparkle" aria-hidden="true"></i><span>Fill in</span></button></div>${S.f.area(p, "blurb", { label: "Why it's good", rows: 3, max: 200, placeholder: "One line." })}`),
          E.sec("Collection", `<div class="st-colls" role="radiogroup" aria-label="Collection" data-colls>${Object.entries(colls).map(([k, c]) => `<button type="button" class="ycard ylift ysel st-coll" role="radio" data-coll="${k}" aria-checked="${p.collection === k}" aria-pressed="${p.collection === k}"><span class="st-coll__ic" aria-hidden="true"><i class="ph-bold ${c.icon}"></i></span><span><b>${esc(c.title)}</b><span class="meta">${n(k)} picks</span></span></button>`).join("")}<button type="button" class="ycard ylift st-coll st-coll--new" data-newcoll aria-expanded="false"><span class="st-coll__ic" aria-hidden="true"><i class="ph-bold ph-plus"></i></span><span><b>New collection</b><span class="meta">a page that gathers picks</span></span></button></div>
            <div data-newcollform data-scope hidden></div><div data-order></div>`, { meta: "picks gather into a collection page" }),
          E.sec("Tag colour", E.colors(p, Y.post.STUB_COLORS, "Tag stub colour"), { meta: "the stub the yarn loops through" }),
          tagsSec,
        ].join("");
      } else if (type === "playlist") {
        form = [
          E.sec("Note", S.f.text(p, "note", { label: "A line about it", placeholder: "Stuff I've been writing to." })),
          E.sec("Tracks", `<div class="st-pl"><div><div class="st-field"><label for="pl-q">Your music</label><input class="yfield st-in" id="pl-q" type="search" placeholder="Search tracks…" data-plq autocomplete="off"></div><ul class="st-plpick" data-plpick aria-label="Your tracks"></ul></div>
            <div><span class="st-lab" style="font:800 .8rem/1.2 var(--font-display);color:var(--ink-2)">In the playlist <span class="meta" data-pltotal></span></span><ol class="st-list" data-pl style="margin-top:8px" aria-label="Playlist order"></ol><p class="st-hint" data-plempty>Tap tracks on the left to add them.</p></div></div>`, { meta: "from your own music" }),
          tagsSec,
        ].join("");
      } else if (type === "embed") {
        form = [
          E.sec("Note", S.f.text(p, "note", { label: "A line about them", placeholder: "Old drawings I found." })),
          E.sec("Images", E.media(p, "media", { grid: true, cover: false, addLabel: "Add photos" }), { meta: "tap one to add alt text" }),
          E.sec("Or embed a link", S.f.text(p, "embed", { label: "YouTube, Figma, CodePen…", placeholder: "https://…", type: "url", mono: true, hint: "Shows as a card with the site's preview. Optional." })),
          tagsSec,
        ].join("");
      }
      const preview = () => (type === "article" ? E.articlePreview(p) : `<div style="padding:22px 0">${E.postCard(p)}</div>`);
      view.innerHTML = E.shell({ section: "thoughts", item: p, back: { href: S.href("list", { section: "thoughts" }), label: "Thoughts" }, titlePath, title: titlePath ? "" : (isNew ? "New scratch" : "Scratch"), titlePH: type === "article" ? "Untitled article" : type === "playlist" ? "Name the playlist" : type === "embed" ? "Title the set" : titlePH, headExtra: isNew ? typeChips : "", form, preview: preview() });
      
      const checks = () => {
        const c = [];
        if (type === "scratch") c.push({ ok: !!(p.text || "").trim(), title: "The thought", text: (p.text || "").length > 280 ? "Over 280 characters" : (p.text || "").trim() ? `${(p.text || "").length} / 280` : "Write something first.", fix: () => $("textarea[data-f=text]", view).focus() });
        if (type === "article") { c.push({ ok: !!(p.title || "").trim(), title: "Title", text: p.title || "Needs a title", fix: () => $("#st-title").focus() }); c.push({ ok: S.words(p.body) > 30 ? true : "warn", title: `${S.words(p.body)} words`, text: S.words(p.body) > 30 ? `${Math.max(1, Math.round(S.words(p.body) / 220))} min read` : "Pretty short for an article." }); c.push({ ok: p.cover ? true : "warn", title: p.cover ? "Cover set" : "No cover", text: p.cover ? "" : "Link previews will use the site card." }); }
        if (type === "pick") { c.push({ ok: !!(p.name || "").trim(), title: "Name", text: p.name || "Name it", fix: () => $("#st-title").focus() }); c.push({ ok: /^https?:\/\/\S+\.\S+/.test(p.url || ""), title: "URL", text: p.url || "Add the link", fix: () => $("input[data-f=url]", view).focus() }); c.push({ ok: true, title: "Collection", text: S.data.collections[p.collection]?.title || "None" }); }
        if (type === "playlist") { c.push({ ok: !!(p.title || "").trim(), title: "Name", text: p.title || "Name it", fix: () => $("#st-title").focus() }); c.push({ ok: (p.tracks || []).length > 1 ? true : (p.tracks || []).length ? "warn" : false, title: `${(p.tracks || []).length} tracks`, text: (p.tracks || []).length ? Y.fmtTime(p.tracks.reduce((n, t) => n + S.durOf(t), 0)) : "Add at least one" }); }
        if (type === "embed") { const miss = (p.media || []).filter((m) => !m.alt).length; c.push({ ok: (p.media || []).length || p.embed ? true : false, title: `${(p.media || []).length} images`, text: (p.media || []).length ? "" : "Add a photo or an embed link" }); c.push({ ok: miss ? "warn" : true, title: miss ? `${miss} without alt text` : "Alt text on everything", text: "", fix: miss ? () => { const i = p.media.findIndex((m) => !m.alt); E.mediaSheet(p, "media", i, $(`[data-medit="${i}"]`), { cover: false, onChange: () => { E.repaintMedia(); E.changed("media"); } }); } : null, fixLabel: "Add alt text" }); }
        return c;
      };
      E.wire(view, { section: "thoughts", item: p, checks, preview });
      const allTags = [...new Set(S.data.thoughts.flatMap((x) => x.tags || []))];
      if ($("[data-tags]", view)) E.tokens($("[data-tags]", view), { item: p, key: "tags", kind: "tag", values: allTags, label: "Tags", placeholder: "Add a tag…", onChange: () => E.changed("tags") });
      E.wireMd(view, p);
      if (type === "article") {
        view.addEventListener("click", (e) => { const n = e.target.closest("[data-notion]"); if (n) S.openNotion(n); });
        E.wireMedia($("[data-drop=images]", view).closest(".st-sec"), coverHolder, "images", () => {
          const last = coverHolder.images[coverHolder.images.length - 1];
          p.cover = last?.src || ""; p.coverAlt = last?.alt || "";
          E.changed("cover");
        }, { pool: ["/media/site-plan.png", "/media/sona.png", "/media/rawsy.png"], max: 1 });
      }
      if (type === "embed") E.wireMedia(view, p, "media", (f) => E.changed(f));
      if (type === "pick") {
        const paintOrder = () => {
          const k = p.collection, c = S.data.collections[k];
          if (!c) { $("[data-order]", view).innerHTML = ""; return; }
          const picks = S.data.thoughts.filter((x) => x.type === "pick" && x.collection === k).sort((a, b) => (a._corder ?? 99) - (b._corder ?? 99) || (b.date || "").localeCompare(a.date || ""));
          $("[data-order]", view).innerHTML = `<div class="st-field" style="margin-top:10px"><span class="st-lab">Order in ${esc(c.title)} <span class="meta">drag to reorder · this pick is roped</span></span><ol class="st-list" data-picks>${picks.map((x) => `<li class="st-li" data-key="${esc(x.id)}"><button type="button" class="st-grip" aria-pressed="false" aria-label="Reorder ${esc(x.name || "this pick")}" aria-describedby="st-media-help"><i class="ph-bold ph-dots-six-vertical" aria-hidden="true"></i></button><div class="yrow ${x === p ? "ysel is-selected" : ""}" style="min-height:56px"><span class="st-favicon" style="width:36px;height:36px;border-radius:10px" aria-hidden="true">${window.TierImages.svg(window.TierImages.best(x.name || "pick"), x.name || "pick")}</span><div class="st-row__main"><p class="st-row__title"><span>${esc(x.name || "This pick")}</span></p><span class="meta">${esc((x.url || "").replace(/^https?:\/\//, ""))}</span></div>${x === p ? S.pub(p._pub) : ""}</div></li>`).join("")}</ol></div>`;
          const ol = $("[data-picks]", view);
          const commit = () => { $$(".st-li", ol).forEach((li, i) => (S.find("thoughts", li.dataset.key)._corder = i)); S.persist(); E.changed("order"); };
          window.TierDrag.create({ root: ol, layer: S.layer(), itemSel: ".st-li", handle: ".st-grip", enabled: () => true, items: () => $$(".st-li", ol), zones: () => [{ zone: ol, hit: ol }], onStart: (li) => Y.sound("pickup", { el: li }), onDrop: (li, info) => { Y.sound("drop", { el: li }); if (info.from.index !== info.to.index) commit(); } });
          E.kbdReorder(ol, ".st-li", ".st-grip", commit);
        };
        paintOrder();
        view.addEventListener("click", (e) => {
          const cb = e.target.closest("[data-coll]");
          if (cb) { p.collection = cb.dataset.coll; $$("[data-coll]", view).forEach((b) => { b.setAttribute("aria-pressed", String(b === cb)); b.setAttribute("aria-checked", String(b === cb)); }); Y.sound("chip-on", { el: cb }); E.changed("collection"); paintOrder(); return; }
          const nb = e.target.closest("[data-newcoll]");
          if (nb) {
            const f = $("[data-newcollform]", view), open = f.hidden; f.hidden = !open; nb.setAttribute("aria-expanded", String(open));
            const nc = { title: "", icon: S.D.COLLECTION_ICONS[2] };
            f.innerHTML = `<div class="patch" style="padding:14px;display:grid;gap:10px;margin-top:10px">${S.f.text(nc, "title", { label: "Collection name", placeholder: "Things I listen to" })}<div class="st-field"><span class="st-lab">Icon</span><div class="st-icons" role="radiogroup" aria-label="Icon">${S.D.COLLECTION_ICONS.map((ic) => `<button type="button" class="ysel" role="radio" data-ic="${ic}" aria-checked="${ic === nc.icon}" aria-pressed="${ic === nc.icon}" aria-label="${ic.replace("ph-", "").replace(/-/g, " ")}"><i class="ph-bold ${ic}" aria-hidden="true"></i></button>`).join("")}</div></div><div class="st-sheetacts"><button type="button" class="btn btn--ink btn--sm" data-makecoll>Create and use it</button></div></div>`;
            S.bind(f, nc, () => {});
            f.onclick = (ev) => {
              const ic = ev.target.closest("[data-ic]"); if (ic) { nc.icon = ic.dataset.ic; $$("[data-ic]", f).forEach((b) => { b.setAttribute("aria-pressed", String(b === ic)); b.setAttribute("aria-checked", String(b === ic)); }); Y.sound("chip-on", { el: ic }); }
              const mk = ev.target.closest("[data-makecoll]");
              if (mk) { if (!nc.title.trim()) { Y.sound("nope", { el: mk }); $("input", f).setAttribute("aria-invalid", "true"); $("input", f).focus(); return; } const k = Y.slug(nc.title); S.data.collections[k] = { title: nc.title, blurb: "", icon: nc.icon }; p.collection = k; S.touch("thoughts", p); Y.sound("token-add"); S.render({ pop: true }); }
            };
            if (open) $("input", f).focus();
            return;
          }
          const fb = e.target.closest("[data-fetch]");
          if (fb) {
            if (!/\S+\.\S+/.test(p.url || "")) { Y.sound("nope", { el: fb }); $("input[data-f=url]", view).setAttribute("aria-invalid", "true"); $("input[data-f=url]", view).focus(); return; }
            $("span", fb).textContent = "Fetching…";
            setTimeout(() => {
              const host = (p.url || "").replace(/^https?:\/\//, "").split("/")[0];
              const name = host.split(".").slice(-2, -1)[0] || host;
              if (!p.name) p.name = name.charAt(0).toUpperCase() + name.slice(1);
              if (!p.blurb) p.blurb = `From ${host}: add your own line.`;
              $("#st-title").value = p.name; $("textarea[data-f=blurb]", view).value = p.blurb; $("[data-mini]", view).textContent = p.name;
              $("span", fb).textContent = "Fill in"; Y.sound("token-add", { el: fb }); E.changed("url"); paintOrder();
            }, Y.reduced() ? 0 : 500);
          }
        });
      }
      if (type === "playlist") {
        p.tracks ||= [];
        const songs = S.allSongs();
        const pick = $("[data-plpick]", view), pl = $("[data-pl]", view);
        const has = (s) => p.tracks.some((t) => t.src === s.url);
        const paintPick = (qq = "") => { pick.innerHTML = songs.filter((s) => !qq || `${s.name} ${s.coll || ""}`.toLowerCase().includes(qq.toLowerCase())).map((s) => `<li><button type="button" class="yrow ylift st-plrow" data-song="${esc(s.url)}" aria-pressed="${has(s)}">${S.swatch(s, { size: 40 })}<b>${esc(s.name)}</b><span class="meta">${Y.fmtTime(S.durOf(s))}</span><span class="st-plus-ic" aria-hidden="true"><i class="ph-bold ${has(s) ? "ph-check" : "ph-plus"}"></i></span><span class="sr-only">${has(s) ? "in the playlist, tap to remove" : "add"}</span></button></li>`).join(""); };
        const paintPl = () => {
          pl.innerHTML = p.tracks.map((t, i) => `<li class="st-li" data-key="${esc(t.src)}"><button type="button" class="st-grip" aria-pressed="false" aria-label="Reorder ${esc(t.title)}" aria-describedby="st-media-help"><i class="ph-bold ph-dots-six-vertical" aria-hidden="true"></i></button><div class="yrow st-plrow">${S.swatch(S.trackRef(t), { size: 40 })}<b>${i + 1}. ${esc(t.title)}</b><span class="meta">${t.dur}</span><button type="button" class="ylinkicon ylinkicon--sm" data-unsong="${esc(t.src)}" aria-label="Remove ${esc(t.title)}"><i class="ph-bold ph-x" aria-hidden="true"></i></button></div></li>`).join("");
          $("[data-plempty]", view).hidden = p.tracks.length > 0;
          $("[data-pltotal]", view).textContent = p.tracks.length ? `${p.tracks.length} · ${Y.fmtTime(p.tracks.reduce((n, t) => n + S.durOf(t), 0))}` : "";
        };
        paintPick(); paintPl();
        $("[data-plq]", view).addEventListener("input", (e) => paintPick(e.target.value));
        view.addEventListener("click", (e) => {
          const sb = e.target.closest("[data-song]");
          if (sb) { const s = songs.find((x) => x.url === sb.dataset.song); if (has(s)) { p.tracks = p.tracks.filter((t) => t.src !== s.url); Y.sound("chip-off", { el: sb }); } else { p.tracks.push({ title: s.name, by: "aiden", dur: Y.fmtTime(S.durOf(s)), src: s.url }); Y.sound("chip-on", { el: sb }); } paintPick($("[data-plq]", view).value); Y.flip(pl, ".st-li", paintPl); E.changed("tracks"); return; }
          const ub = e.target.closest("[data-unsong]");
          if (ub) { p.tracks = p.tracks.filter((t) => t.src !== ub.dataset.unsong); Y.sound("tag-remove", { el: ub }); paintPick($("[data-plq]", view).value); Y.flip(pl, ".st-li", paintPl); E.changed("tracks"); }
        });
        const commit = () => { const keys = $$(".st-li", pl).map((li) => li.dataset.key); p.tracks = keys.map((k) => p.tracks.find((t) => t.src === k)); paintPl(); E.changed("tracks"); };
        window.TierDrag.create({ root: pl, layer: S.layer(), itemSel: ".st-li", handle: ".st-grip", enabled: () => true, items: () => $$(".st-li", pl), zones: () => [{ zone: pl, hit: pl }], onStart: (li) => Y.sound("pickup", { el: li }), onDrop: (li, info) => { Y.sound("drop", { el: li }); if (info.from.index !== info.to.index) commit(); } });
        E.kbdReorder(pl, ".st-li", ".st-grip", commit);
      }
      if (q.get("sheet") === "publish") requestAnimationFrame(() => S.checkSheet({ section: "thoughts", item: p, btn: $("[data-publish]", view), checks: checks() }));
    },
  };
})();
