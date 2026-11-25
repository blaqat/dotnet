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
    let api = null, gen = 0, F = null;
    const build = () => {
      const mine = ++gen; // a rebuilt field retires the old model (its debounced query must not write back)
      F = Y.filters({ groups: [{ key: "v", kind, label, values: vals }], url: false });
      (item[key] || []).forEach((v) => F.state.v.add(F.info("v", v).value));
      // i9 · polish (S1): a fresh element for every build. Y.search wires listeners on its own host, so rebuilding on the
      // same element (each added token) stacked them; the host stays a plain wrapper (.st-tagfield) around the field.
      const el = document.createElement("div");
      host.replaceChildren(el);
      api = Y.search(el, F, { placeholder, label, hint: false });
      el.setAttribute("role", "group");
      el.setAttribute("aria-label", label);
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
    // repaint(): the chips take fresh icons (S11: a stack logo found after the token went in) without touching the
    // text being typed
    const repaint = () => { if (kind === "stack") for (const v of F.groups[0].values) v.iconHTML = Y.stackIcon(v.value); api.refresh?.(); };
    return { focus: () => api.focus(), repaint };
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
     MARKDOWN EDITOR · i9 · blocks (S3): E.md / E.wireMd live in studio-blocks.js (the block editor with yarn blocks;
     the i8 textarea + Write / Split / Preview is gone: the field is WYSIWYG, the page preview stays)
     ============================================================ */

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
    // i9 · links (S5): the project's own links (Yarn.dlinks: any site, recognised ones with their mark, the owner's
    // text; the first is the red primary), then the write-up button the site adds
    const own = Y.dlinks(p);
    const links = own + ((p.writeup || "").trim() ? Y.dlink({ href: Y.siteURL("thoughts/stitched.html"), label: "Read the write-up", icon: "ph-scroll", primary: !own }) : "");
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
  /* ============================================================
     i9 · polish · S11 (pin 13: "if i add an item that we dont have yet it should automatically find the logo")
     A tool the kit has no logo for is looked up the moment it's added (Yarn.stackLookup: Simple Icons, pinned), and the
     chip, the preview and every list wear what comes back (Yarn.stackLogo registers it). Nothing found / offline: the
     kit's monogram, and the row under the field lets the owner upload one or paste a link (or look again).
     Saved with the project: p.stackIcons = { [name]: { src, by: "si", slug } | { col, src, by: "upload" | "url" } |
     { mono: true, none | offline } }. Every project's logos are registered when the Studio starts.
     ============================================================ */
  E.stackLogos = () => { for (const pr of S.data.projects || []) for (const [n, info] of Object.entries(pr.stackIcons || {})) Y.stackLogo(n, info.pending ? { mono: true } : info); };
  E.stackLogos();
  const logoState = (i) => (i.pending ? "looking" : i.by || (i.offline ? "offline" : "none"));
  const LOGO_TEXT = { si: (i) => `Found on Simple Icons · <code>${esc(i.slug || "")}</code>`, upload: () => "Your image", url: () => "From a link", looking: () => "Looking for its logo…", offline: () => "Couldn't reach the logo library: initials for now", none: () => "No logo out there yet: initials for now" };
  // an uploaded logo as a data URL (kept with the project): SVGs as they are, anything else drawn down to 128px
  E.imageData = (file, max = 128) => new Promise((res) => {
    const rd = new FileReader();
    rd.onerror = () => res(null);
    rd.onload = () => {
      if (/svg/.test(file.type)) return res(file.size < 200e3 ? rd.result : null);
      const im = new Image();
      im.onload = () => { const k = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight)); const c = document.createElement("canvas"); c.width = Math.max(1, Math.round(im.naturalWidth * k)); c.height = Math.max(1, Math.round(im.naturalHeight * k)); c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL("image/png")); };
      im.onerror = () => res(null);
      im.src = rd.result;
    };
    rd.readAsDataURL(file);
  });
  E.wireStackLogos = (view, p, field) => {
    const box = $("[data-logos]", view), ul = $("ul", box);
    const own = () => (p.stack || []).filter((n) => !Y.stackKnown(n));
    const info = (n) => p.stackIcons?.[n] || { mono: true, pending: true };
    const set = (n, i) => { (p.stackIcons ||= {})[n] = i; Y.stackLogo(n, i.pending ? { mono: true } : i); };
    const row = (n) => { const i = info(n), st = logoState(i), hand = i.by === "upload" || i.by === "url"; return `<li class="st-logo" data-name="${esc(n)}" data-state="${st}">
        <span class="ytag ytag--stk is-static">${Y.stackIcon(n)}<span class="ychip__l">${esc(n)}</span></span>
        <span class="meta st-logo__st" role="status">${LOGO_TEXT[st](i)}</span>
        <span class="st-logo__acts"><label class="btn btn--ghost btn--sm"><i class="ph-bold ph-upload-simple" aria-hidden="true"></i><span>Upload</span><input type="file" class="sr-only" accept="image/*" data-logoup aria-label="Upload a logo for ${esc(n)}"></label><button type="button" class="btn btn--ghost btn--sm" data-logourl aria-expanded="false" aria-label="Use a link for the ${esc(n)} logo"><i class="ph-bold ph-link" aria-hidden="true"></i><span>Link</span></button>${hand || st === "offline" ? `<button type="button" class="ylinkbtn" data-logoauto>${hand ? "Find it again" : "Try again"}</button>` : ""}</span>
        <form class="st-logo__url" data-logoform hidden novalidate><input class="yfield st-in st-mono" type="url" inputmode="url" placeholder="https://…/logo.svg" aria-label="Logo link for ${esc(n)}" autocomplete="off"><button type="submit" class="btn btn--ink btn--sm">Use it</button></form></li>`; };
    const repaint = () => {
      if (!box.isConnected) return;
      const list = own();
      box.hidden = !list.length;
      ul.innerHTML = list.map(row).join("");
      field?.repaint?.(); E.refresh?.();
    };
    const paintRow = (n) => {
      if (!box.isConnected) return;
      const li = ul.querySelector(`[data-name="${CSS.escape(n)}"]`);
      if (li) li.outerHTML = row(n); else repaint();
      field?.repaint?.(); E.refresh?.();
    };
    const look = async (n) => {
      set(n, { mono: true, pending: true }); paintRow(n);
      const r = await Y.stackLookup(n);
      if (!(p.stack || []).includes(n) || !p.stackIcons?.[n]?.pending) return; // removed, or set by hand meanwhile
      set(n, r.found ? { src: r.found.src, tint: r.found.tint, by: "si", slug: r.found.slug } : r.offline ? { mono: true, offline: true } : { mono: true, none: true });
      S.persist(); paintRow(n);
      S.say(r.found ? `Found the ${n} logo` : `No logo for ${n}: showing its initials`);
      if (r.found) Y.sound("token-add");
    };
    const sync = () => {
      for (const n of Object.keys(p.stackIcons || {})) if (!(p.stack || []).includes(n)) { delete p.stackIcons[n]; Y.stackLogo(n, null); }
      repaint();
      for (const n of own()) { const i = p.stackIcons?.[n]; if (!i || i.pending || i.offline) look(n); } // new, or offline last time
    };
    box.addEventListener("click", (e) => {
      const li = e.target.closest("[data-name]"); if (!li) return;
      const n = li.dataset.name;
      if (e.target.closest("[data-logoauto]")) { look(n); return; }
      const ub = e.target.closest("[data-logourl]");
      if (ub) { const f = $("[data-logoform]", li), open = f.hidden; f.hidden = !open; ub.setAttribute("aria-expanded", String(open)); if (open) $("input", f).focus(); }
    });
    box.addEventListener("submit", (e) => {
      const f = e.target.closest("[data-logoform]"); if (!f) return;
      e.preventDefault();
      const n = f.closest("[data-name]").dataset.name, inp = $("input", f), u = inp.value.trim();
      if (!/^(https?:\/\/\S+|data:image\/)/i.test(u)) { inp.setAttribute("aria-invalid", "true"); Y.sound("nope", { el: inp }); inp.focus(); return; }
      const im = new Image();
      im.onload = () => { set(n, { col: u, src: u, by: "url" }); E.changed("stack"); paintRow(n); Y.sound("token-add"); };
      im.onerror = () => { inp.setAttribute("aria-invalid", "true"); Y.sound("nope", { el: inp }); S.toast({ icon: "ph-image-broken", title: "Couldn't load that image", text: "Check the link, or upload the file instead." }); };
      im.src = u;
    });
    box.addEventListener("change", async (e) => {
      const inp = e.target.closest("[data-logoup]"); if (!inp?.files?.[0]) return;
      const n = inp.closest("[data-name]").dataset.name, file = inp.files[0]; inp.value = "";
      const url = await E.imageData(file);
      if (!url) { Y.sound("nope"); S.toast({ icon: "ph-image-broken", title: "That file didn't work as a logo", text: "An SVG under 200 KB, or any PNG / JPG / WebP." }); return; }
      set(n, { col: url, src: url, by: "upload" }); E.changed("stack"); paintRow(n); Y.sound("token-add");
    });
    sync();
    return { sync };
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
      const shows = () => `<span class="eyebrow">On the card</span>${Y.cardMeta(p)}`; // the site card's own facts (Yarn.cardMeta)
      const form = [
        E.sec("Media", E.media(p, "images"), { meta: `${(p.images || []).length} · drag to reorder` }),
        E.sec("Details", `
          ${S.f.choice(p, "status", ["Ongoing", "Completed", "Paused", "Dropped"].map((s) => [s, Y.fact.status(s), Y.status(s)?.label || s]), { label: "Status" })}
          ${S.f.choice(p, "type", ["Personal", "Work", "School"].map((t) => [t, Y.fact.type(t), t]), { label: "Type" })}
          <div class="st-fieldrow">${S.f.month(p, "start", { label: "Started" })}${E.finish(p, { label: "Ended" })}</div>
          <div class="st-shows" data-shows>${shows()}</div>`),
        E.sec("Stack", `<div class="st-tagfield" data-stack></div><p class="st-hint">Type a tool: <b>py</b> → Python with its icon. Enter, Tab or comma adds it; Backspace twice removes the last one.</p>
          <div class="st-logos" data-logos hidden><p class="st-lab">Logos <span class="meta">for tools that are new here</span></p><ul class="st-logos__list" aria-label="Logos for new tools"></ul></div>`),
        E.sec("Links", E.links(p, { placeholder: "Paste links: the live site, GitHub, itch.io…" }), { meta: "the first is the red button" }), // i9 · links (S5, pin 15)
        // i9 · blocks (S3): both markdown fields are the block editor (the description: basic blocks only, no yarn blocks)
        E.sec("Description", E.md(p, "description", { label: "Short description", compact: true, max: 900 }), { meta: "under the media on the project page" }),
        E.sec("Write-up", E.md(p, "writeup", { label: "Write-up" }), { meta: "optional · becomes a linked article" }),
      ].join("");
      view.innerHTML = E.shell({ section: "projects", item: p, back: { href: S.href("list", { section: "projects" }), label: "Projects" }, titlePH: "Untitled project", form, preview: E.projectPreview(p) });
      const checks = () => {
        const missingAlt = (p.images || []).filter((m) => !m.alt).length;
        return [
          { ok: !!(p.name || "").trim(), title: "Name", text: (p.name || "").trim() ? p.name : "Every project needs a name.", fix: () => { const t = $("#st-title"); t.setAttribute("aria-invalid", "true"); t.focus(); } },
          { ok: !!Y.parseDate(p.start), title: "Start date", text: Y.dateRange(p) || "Pick a month" },
          { ok: (p.images || []).length ? true : "warn", title: (p.images || []).length ? `${S.plural(p.images.length, "media file")} · cover set` : "No media", text: (p.images || []).length ? "" : "The card will show text instead. That's fine for some projects." },
          { ok: missingAlt ? "warn" : true, title: missingAlt ? `${missingAlt} without alt text` : "Alt text on everything", text: missingAlt ? "Screen-reader users get nothing for those." : "", fix: missingAlt ? () => { const i = p.images.findIndex((m) => !m.alt); E.mediaSheet(p, "images", i, $(`[data-medit="${i}"]`), { onChange: () => { E.repaintMedia(); E.changed("images"); } }); } : null, fixLabel: "Add alt text" },
          { ok: (p.description || "").length > 40 ? true : "warn", title: "Description", text: (p.description || "").length > 40 ? S.plural(S.words(p.description), "word") : "Very short. Two sentences help." },
        ];
      };
      E.wire(view, {
        section: "projects", item: p, checks, preview: () => E.projectPreview(p),
        onChange: (path) => {
          if (path === "status" || path === "start" || path === "end" || path === "type") {
            $("[data-shows]", view).innerHTML = shows();
            if (path === "status") E.onStatus(view, p, { onChange: (k) => E.changed(k) }); // i9 · music · S7: a song's rule
          }
        },
      });
      // ongoing = no end month ("– now"): the end selects step aside (i9 · music · S7: E.finish, the same rule as a song)
      E.paintFinish(view, p);
      E.wireMedia(view, p, "images", (f) => E.changed(f));
      let logos = null; // i9 · polish (S11): new tools get their logo looked up (E.wireStackLogos)
      const stackField = E.tokens($("[data-stack]", view), { item: p, key: "stack", kind: "stack", values: stacks, label: "Stack", placeholder: "Add a tool: Python, Svelte…", onChange: () => { E.changed("stack"); logos?.sync(); } });
      logos = E.wireStackLogos(view, p, stackField);
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
     i9 · music · S7 · STATUS ↔ FINISHED: one rule wherever a status and a finish month sit together (a single, every
     track of a collection, a project). Owner: "switching to complete or dropped to auto fill finished" · "finished
     should be disabled for wip".
       Complete / Dropped → an empty finish takes this month, visibly (the selects flash; a toast says so, with Undo)
       WIP (a project's Ongoing) → the finish is disabled and says why in one line. A month it had stays in the data
       (the site never shows a finish for WIP: Yarn.dateRange) and comes back with Complete / Dropped.
     E.finish(x, { path, label }) → the field · E.paintFinish(host, x) once it's on the page · E.onStatus(host, x,
     { onChange }) after the status changes. host = the element holding that item's finish field.
     ============================================================ */
  const FILLS = new Set(["complete", "dropped"]);
  const isWip = (x) => Y.status(x?.status)?.key === "ongoing";
  E.finish = (x, { path = "end", label = "Finished" } = {}) => `<div class="st-finish" data-finish="${path}" data-label="${esc(label)}">${S.f.month(x, path, { label, allowEmpty: true })}<p class="st-hint st-finish__why" data-finish-why hidden></p></div>`;
  const showMonth = (box, v) => { const d = Y.parseDate(v); $$("select[data-month]", box).forEach((s) => { s.value = d ? String(s.dataset.part === "m" ? d.getMonth() : d.getFullYear()) : ""; }); };
  E.paintFinish = (host, x) => $$("[data-finish]", host).forEach((box) => {
    const path = box.dataset.finish, wip = isWip(x), kept = S.get(x, path);
    box._x = x; box.dataset.wip = wip ? "1" : "";
    box.classList.toggle("is-off", wip);
    $$("select", box).forEach((s) => (s.disabled = wip));
    showMonth(box, wip ? "" : kept);
    const why = $("[data-finish-why]", box);
    why.hidden = !wip;
    why.textContent = wip ? `WIP runs to “now” on the site.${kept ? ` ${kept} is kept for when it's done.` : ""}` : "";
  });
  E.onStatus = (host, x, { onChange } = {}) => {
    const boxes = $$("[data-finish]", host).map((box) => ({ box, was: box.dataset.wip === "1" }));
    E.paintFinish(host, x);
    if (!FILLS.has(Y.status(x.status)?.key)) return;
    for (const { box, was } of boxes) {
      const path = box.dataset.finish, label = box.dataset.label, cur = S.get(x, path);
      const flash = () => { box.classList.remove("is-filled"); void box.offsetWidth; box.classList.add("is-filled"); };
      if (!cur) {
        const v = Y.fmt.month(new Date(S.now()));
        S.set(x, path, v); showMonth(box, v); flash(); onChange?.(path);
        S.toast({ icon: "ph-calendar-check", title: `${label} set to ${v}`, text: "this month · change it any time", undo: () => {
          if (S.get(x, path) !== v) return; // changed by hand since: keep that
          S.set(x, path, "");
          $$(`[data-finish="${path}"]`).filter((b) => b._x === x).forEach((b) => { b.classList.remove("is-filled"); showMonth(b, ""); });
          onChange?.(path); S.say(`${label} cleared`);
        } });
      } else if (was) { flash(); S.say(`${label}: ${cur}, kept from before`); }
    }
  };
  // i9 · music · S9: a collection's own status, dates and instrument are its songs' (Yarn.musicFacts), kept in sync
  E.syncColl = (m) => {
    if (m?.type !== "collection" || !Array.isArray(m.songs)) return m;
    const f = Y.musicFacts(m);
    Object.assign(m, { status: f.status, start: f.start, end: f.end, instrument: f.instrument || m.instrument });
    return m;
  };

  /* ============================================================
     MUSIC EDITOR · ?screen=music&id=…|new[&kind=collection][&track=n]
     ============================================================ */
  const INST = [["piano", "Piano", "black yarn"], ["beepbox", "BeepBox", "purple, circles"], ["daw", "DAW", "blue, waves"]];
  E.musicPreview = (m, tr) => {
    const coll = m.type === "collection";
    const linksOf = (x) => Y.links(x).map((l) => Y.linkIcon(l)).join(""); // i9 · links (S5): any links, recognised ones with their mark
    // i7 · studio (S1): the release as music.js writes it: the swatch as the kicker, the facts line (instrument · status ·
    // date · length), one row of link buttons (Play is the primary), the tracks as rows with fixed columns (B1), notes
    const dur = (x) => Y.fmtTime(x._dur || S.durOf(x));
    const total = coll ? (m.songs || []).reduce((n, s) => n + (s._dur || S.durOf(s)), 0) : (m._dur || S.durOf(m));
    const lkN = coll ? Math.max(0, ...(m.songs || []).map((s) => Y.links(s).length)) : 0; // i9 · links: each track's links, like the site's song rows (one column, as wide as the most)
    const tracks = coll ? `<section class="st-trks"><h3 class="eyebrow">Tracks <span class="meta">${(m.songs || []).length} · ${Y.fmtTime(total)}</span></h3><ol class="st-tracks${lkN ? " has-lk" : ""}" style="--lkn:${lkN}">${(m.songs || []).map((s, i) => `<li class="st-track">${S.swatch({ ...s, instrument: s.instrument || m.instrument }, { size: 40 })}<b>${esc(s.name || `Track ${i + 1}`)}</b>${lkN ? `<span class="st-track__lk">${Y.links(s).map((l) => Y.linkIcon(l, { sm: true })).join("")}</span>` : ""}${Y.fact.status(s.status, { cls: "yfact--icon", hint: Y.status(s.status)?.label || "" })}<span class="meta st-track__d">${dur(s)}</span></li>`).join("")}</ol></section>` : "";
    const card = Y.folder({ ...m, type: coll ? "collection" : "single" }, {
      tracks: coll ? (m.songs || []).map((s, i) => ({ ...s, id: s.id || `t${i}`, name: s.name || `Track ${i + 1}` })) : [],
      links: coll ? "" : linksOf(m), // (meta: the kit folder's default, status · date facts)
      action: coll ? `<span class="btn btn--red btn--sm" aria-hidden="true"><i class="ph-fill ph-play"></i>Play all</span>` : `<span class="btn btn--red btn--icon" aria-hidden="true"><i class="ph-fill ph-play"></i></span>`,
    });
    const links = `<button type="button" class="btn btn--d btn--red"><i class="ph-fill ph-play" aria-hidden="true"></i><span class="btn__l">${coll ? "Play all" : "Play"}</span></button>`
      + Y.dlinks(m, { primary: false }); // i9 · links (S5, pin 11): a collection's own album / playlist links; a single's links
    return `<div class="st-prevrow st-prevcard"><p class="eyebrow">In the library</p>${card}</div>` + Y.detail({
      back: { label: "Music" }, actions: `<button type="button" class="ylinkicon" aria-label="Copy link"><i class="ph-bold ph-link" aria-hidden="true"></i></button>`,
      kicker: `<span class="st-art">${S.swatch(m, { size: 64, radius: 14 })}</span>`,
      title: m.name || (coll ? "Untitled collection" : "Untitled track"), level: 2,
      facts: Y.fact.instrument(coll ? Y.musicFacts(m).instruments : m.instrument) + Y.fact.status(m.status) + Y.fact.date(m) + (!coll && (m.url || m._dur) ? Y.fact.text("ph-timer", dur(m)) : ""), // i9 · music · S6: "Piano + DAW" for a mixed collection
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
        m = { id: E.newId("music"), type: coll ? "collection" : "single", name: "", start: Y.fmt.month(new Date(S.now())), status: "wip", instrument: "piano", url: "", description: "", links: [], _pub: "draft", _order: 0, _edited: S.now(), ...(coll ? { songs: [{ id: E.newId("t"), name: "", status: "wip", start: Y.fmt.month(new Date(S.now())), instrument: "piano", url: "", links: [] }] } : {}) };
        S.data.music.unshift(m); S.persist();
        history.replaceState(history.state, "", S.href("music", { id: m.id }));
      }
      if (m && m._pub === "draft") S.onLeave(() => { if (!(m.name || "").trim() && !m.url && !(m.songs || []).some((x) => x.url || x.name)) { const i = S.data.music.indexOf(m); if (i >= 0) S.data.music.splice(i, 1); S.persist(); } });
      if (!m) return E.nothere(view, "piece");
      m.links ||= {};
      const coll = m.type === "collection";
      let ti = Math.max(0, Math.min((m.songs || []).length - 1, +(q.get("track") || 0)));
      const tr = () => (m.songs || [])[ti];
      // i9 · music · S9: a collection's status, dates and instrument are its tracks' (read-only here, with where they come from)
      const sync = () => { if (coll) E.syncColl(m); };
      sync();
      // the yarn: an instrument (single choice holding the kit swatch) + its pattern. One for a single and for each track
      // (S6: every track has its own instrument); a collection's own yarn is its tracks' + the pattern of its art
      const motifs = (x, inst, meta = "auto picks one from the track") => { const id = Y.uid("motif"), SW = window.YarnSwatch; const list = ["", ...((Y.musicFacts(x).mixed ? SW.BAND : SW.MOTIFS)[inst] || SW.MOTIFS.other)].filter((v, i, a) => a.indexOf(v) === i); return `<div class="st-field"><span class="st-lab" id="${id}">Pattern <span class="meta">${meta}</span></span>
          <div class="st-motifs" role="radiogroup" aria-labelledby="${id}">${list.map((mo) => `<button type="button" class="st-motif ysel" role="radio" aria-checked="${(x._motif || "") === mo}" aria-pressed="${(x._motif || "") === mo}" data-motif="${mo}">${S.swatch({ ...x, _motif: mo || undefined }, { size: 52, motif: mo || undefined })}<span>${mo || "auto"}</span></button>`).join("")}</div></div>`; };
      const yarn = (x) => { const id = Y.uid("inst"); return `
        <div class="st-field"><span class="st-lab" id="${id}">Instrument <span class="meta">the yarn says it, so the site never labels it</span></span>
          <div class="st-insts" role="radiogroup" aria-labelledby="${id}">${INST.map(([k, l, d]) => `<button type="button" class="yrow ylift ysel${x.instrument === k ? " is-selected" : ""}" role="radio" aria-checked="${x.instrument === k}" data-inst="${k}">${S.swatch({ instrument: k, url: x.url, name: x.name }, { size: 44 })}<span>${l}<small>${d}</small></span></button>`).join("")}</div></div>
        ${motifs(x, x.instrument)}`; };
      const instName = (k) => INST.find(([x]) => x === k)?.[1] || k;
      const collYarn = () => {
        const f = Y.musicFacts(m);
        return `<div class="st-field"><span class="st-lab">Instrument <span class="meta">from its tracks</span></span>
          <div class="st-instmix">${S.swatch(m, { size: 44 })}<span class="st-instmix__t">${Y.fact.instrument(f.instruments)}<small>${f.mixed ? f.mix.map(([k, n]) => `${n} ${instName(k)}`).join(" · ") : `all ${f.songs} track${f.songs === 1 ? "" : "s"}`}</small></span></div></div>
          ${motifs(m, f.instrument, f.mixed ? `the ${instName(f.instrument)} stripe; auto picks the others` : "auto picks one from the collection")}`;
      };
      const statusOpts = [["wip", "WIP"], ["complete", "Complete"], ["dropped", "Dropped"]].map(([v, l]) => [v, Y.fact.status(v), l]);
      const shows = () => `<span class="eyebrow">On the card</span>${Y.cardMeta(m, { parts: ["status", "date"] })}`;
      // i9 · links (S5, pins 5 + 11): any links, recognised ones converted, each with its own text (studio-links.js).
      // x = the song / track / collection; base = its collection (or itself): a collection's own links are its album / playlist
      const linkFields = (x, base) => E.links(x, { placeholder: x === base && x.type === "collection" ? "Paste the album or playlist link" : "Paste links: SoundCloud, YouTube, BeepBox…" });
      // i9 · music · S9: one song form, for a single and for each track of a collection (owner: "collection items can
      // show up as singles and also have the same metadata a normal song does"): audio · yarn · details · links · notes
      const details = (x) => `${S.f.choice(x, "status", statusOpts, { label: "Status" })}<div class="st-fieldrow">${S.f.month(x, "start", { label: "Started" })}${E.finish(x)}</div>`;
      const sub = (title, body, o) => E.sec(title, body, o).replace('class="st-sec"', 'class="st-sec st-sec--sub"').replace("<h2 ", "<h3 ").replace("</h2>", "</h3>");
      const songForm = (x, { track = false } = {}) => {
        const sec = track ? sub : E.sec;
        return [
          sec("Audio", `<div data-audiohost>${E.audio(x)}</div>`),
          sec("Yarn", `<div data-yarn>${yarn(x)}</div>`),
          sec("Details", details(x) + (track ? "" : `<div class="st-shows" data-shows>${shows()}</div>`)),
          sec("Links", linkFields(x, track ? m : x)),
          sec("Notes", S.f.area(x, "description", { label: "About this track", rows: 3, max: 400, placeholder: "A line or two. Optional." })),
        ].join("");
      };
      const trackPanel = () => {
        const t = tr(); if (!t) return "";
        t.links ||= []; // i9 · links (S5) shape: [{ url, text? }]
        return `<div data-track>${S.f.text(t, "name", { label: "Track name", placeholder: `Track ${ti + 1}` })}
          ${songForm(t, { track: true })}
          <div class="st-sheetacts"><button type="button" class="btn btn--ghost btn--sm" data-rmtrack><i class="ph-bold ph-trash" aria-hidden="true"></i><span>Remove track</span></button></div></div>`;
      };
      // the collection's own details: read-only, each with where it comes from (a jump to that track)
      const nameOf = (s) => s?.name || `Track ${(m.songs || []).indexOf(s) + 1}`;
      const goto = (s) => `<button type="button" class="ylinkbtn st-from" data-gotrack="${(m.songs || []).indexOf(s)}">${esc(nameOf(s))}</button>`;
      const derived = () => {
        const f = Y.musicFacts(m), songs = m.songs || [], when = (s, p) => Y.parseDate(s[p]);
        const n = (k) => songs.filter((s) => Y.status(s.status)?.key === k).length;
        const first = songs.filter((s) => when(s, "start")).sort((a, b) => when(a, "start") - when(b, "start"))[0];
        const last = f.end ? songs.filter((s) => !isWip(s) && when(s, "end")).sort((a, b) => when(b, "end") - when(a, "end"))[0] : null;
        const why = n("ongoing") ? `${n("ongoing")} of ${songs.length} WIP` : n("complete") ? `${n("complete")} complete${n("dropped") ? ` · ${n("dropped")} dropped` : ""}` : `all ${songs.length} dropped`;
        return `<dl class="st-derived">
            <div><dt>Status</dt><dd>${Y.fact.status(f.status)}<span class="meta">${why}</span></dd></div>
            <div><dt>Started</dt><dd><b>${f.start || "—"}</b><span class="meta">${first ? `from ${goto(first)}` : "no track has one yet"}</span></dd></div>
            <div><dt>Finished</dt><dd><b>${f.end || "—"}</b><span class="meta">${isWip(f) ? "none while a track is WIP" : last ? `from ${goto(last)}` : "no track has one yet"}</span></dd></div>
          </dl>
          <p class="st-hint">WIP while any track is WIP, else Complete if any track is, else Dropped. It runs from the earliest start to the latest finish.</p>
          <div class="st-shows" data-shows>${shows()}</div>`;
      };
      const tabs = () => `<ul class="st-tabs" role="tablist" aria-label="Tracks">${(m.songs || []).map((s, i) => `<li class="st-tab" data-key="${esc(s.id || i)}"><button type="button" class="st-tab__btn ysel" role="tab" id="tab-${i}" aria-selected="${i === ti}" aria-controls="trackpanel" tabindex="${i === ti ? 0 : -1}" data-tab="${i}">${S.swatch({ ...s, instrument: s.instrument || m.instrument }, { size: 20 })}<span class="st-tab__l">${esc(s.name || `Track ${i + 1}`)}</span></button></li>`).join("")}<li class="st-tab st-tab--add"><button type="button" class="st-tab__btn" data-addtrack aria-label="Add a track"><i class="ph-bold ph-plus" aria-hidden="true"></i><span>Track</span></button></li></ul>`;
      const form = coll ? [
        E.sec("Tracks", `<div class="st-folder"><div data-tabs>${tabs()}</div><div class="patch st-folder__body" role="tabpanel" id="trackpanel" aria-labelledby="tab-${ti}" data-trackpanel data-scope>${trackPanel()}</div></div><p class="st-hint">Drag a tab to reorder. Each tab is a track; the folder is the collection.</p>`, { meta: `<span data-trackn>${(m.songs || []).length}</span> · the folder on the site` }),
        E.sec("Yarn", `<div data-cyarn>${collYarn()}</div>`, { meta: "the collection's art" }),
        E.sec("Details", `<div data-derived>${derived()}</div>`, { meta: "from its tracks" }),
        E.sec("Links", linkFields(m, m), { meta: "the whole collection: an album or a playlist" }),
        E.sec("Notes", S.f.area(m, "description", { label: "About this collection", rows: 3, max: 400, placeholder: "A line or two. Optional." })),
      ].join("") : songForm(m);
      const kindSeg = q.get("id") === "new" || !m.name ? `<div style="margin-top:8px">${Y.seg([{ value: "single", label: "Single", icon: "ph-music-note" }, { value: "collection", label: "Collection", icon: "ph-folder-simple" }], { value: m.type, label: "Kind", name: "kind" })}</div>` : "";
      view.innerHTML = E.shell({ section: "music", item: m, back: { href: S.href("list", { section: "music" }), label: "Music" }, titlePH: coll ? "Untitled collection" : "Untitled track", headExtra: kindSeg, form, preview: E.musicPreview(m, tr()) });
      const formEl = $("[data-form]", view);
      // i9 · music · S8: the strip scrolls sideways; the chosen tab (and its rope) always sits fully inside it, with room
      const revealTab = () => { const ul = $(".st-tabs", view), li = $(`#tab-${ti}`, view)?.parentElement; if (!ul || !li) return; const l = li.offsetLeft - 14, r = li.offsetLeft + li.offsetWidth + 14; if (l < ul.scrollLeft) ul.scrollLeft = l; else if (r > ul.scrollLeft + ul.clientWidth) ul.scrollLeft = r - ul.clientWidth; };
      const paintTabs = () => { const h = $("[data-tabs]", view); if (!h) return; h.innerHTML = tabs(); revealTab(); const n = $("[data-trackn]", view); if (n) n.textContent = (m.songs || []).length; }; // (i9 · walk, F6: the count follows + Track / Remove / Undo)
      if (coll) requestAnimationFrame(revealTab);
      const paintColl = () => { if (!coll) return; sync(); const c = $("[data-cyarn]", view); if (c) c.innerHTML = collYarn(); paintDerived(); };
      const paintDerived = () => { if (!coll) return; sync(); const d = $("[data-derived]", view); if (d) d.innerHTML = derived(); };
      const checks = () => {
        const f = Y.musicFacts(m);
        return [
          { ok: !!(m.name || "").trim(), title: "Name", text: m.name || "Give it a name.", fix: () => { const t = $("#st-title"); t.setAttribute("aria-invalid", "true"); t.focus(); } },
          coll ? { ok: (m.songs || []).length > 0 && (m.songs || []).every((s) => s.url) ? true : false, title: "Every track has audio", text: `${(m.songs || []).filter((s) => s.url).length} of ${(m.songs || []).length} uploaded` }
            : { ok: !!m.url, title: "Audio", text: m.url ? `${Y.fmtTime(m._dur || S.durOf(m))} · waveform saved` : "Upload the track first." },
          { ok: true, title: "Yarn", text: `${f.instruments.map(instName).join(" + ")} · ${m._motif || "auto pattern"}` },
        ];
      };
      E.wire(view, {
        section: "music", item: m, checks, preview: () => E.musicPreview(m, tr()),
        onChange: (path) => {
          if (coll) { paintDerived(); return; }
          if (path === "status") E.onStatus(formEl, m, { onChange: (p) => E.changed(p) });
          const sh = $("[data-shows]", view); if (sh) sh.innerHTML = shows();
        },
      });
      if (!coll) E.paintFinish(formEl, m);
      // instrument + pattern: the song they sit in (a single, the selected track, or the collection's art)
      view.addEventListener("click", (e) => {
        const ib = e.target.closest("[data-inst]"), mb = e.target.closest("[data-motif]");
        if (!ib && !mb) return;
        const inTrack = coll && !!e.target.closest("[data-trackpanel]"), x = inTrack ? tr() : m;
        const host = (ib || mb).closest("[data-yarn], [data-cyarn]");
        if (ib) { x.instrument = ib.dataset.inst; x._motif = ""; }
        else x._motif = mb.dataset.motif;
        Y.sound("chip-on", { el: ib || mb });
        host.innerHTML = host.matches("[data-cyarn]") ? collYarn() : yarn(x);
        if (inTrack) { paintTabs(); if (ib) paintColl(); E.changed("songs"); }
        else E.changed(ib ? "instrument" : "motif");
        $(ib ? `[data-inst="${x.instrument}"]` : `[data-motif="${x._motif}"]`, host)?.focus();
      });
      view.addEventListener("ychange", (e) => {
        if (e.detail.name !== "kind") return;
        m.type = e.detail.value;
        // a single becoming a collection: it's the first track, with everything it had (its links and notes move with it)
        if (m.type === "collection" && !m.songs) {
          m.songs = [{ id: E.newId("t"), name: m.name || "", status: m.status, start: m.start, end: m.end, instrument: m.instrument, _motif: m._motif, url: m.url, _dur: m._dur, _peaks: m._peaks, _file: m._file, description: m.description || "", links: m.links || [] }];
          m.links = []; m.description = "";
        }
        S.touch("music", m); S.render({ pop: true });
      });
      const audioAfter = (host) => { const t = coll ? tr() : m; host.innerHTML = E.audio(t); E.wireAudioBox(host, t); E.changed(coll ? "songs" : "url"); };
      E.wireAudioUploads(formEl, () => (coll ? tr() : m), audioAfter);
      const panel = coll ? $("[data-trackpanel]", view) : null;
      const wireTrack = () => { const host = $(coll ? "[data-trackpanel] [data-audiohost]" : "[data-audiohost]", view); E.wireAudioBox(host, coll ? tr() : m); if (panel) { E.paintFinish(panel, tr()); $$("textarea[data-max]", panel).forEach((t) => { const c = $(`[data-count-for="${t.id}"]`, view); if (c) c.textContent = `${t.value.length} / ${t.dataset.max}`; }); } }; // (a re-rendered track's counter starts filled, like the first)
      wireTrack();
      if (coll) {
        const select = (i, focus = true) => {
          ti = i;
          const u = new URL(location.href); u.searchParams.set("track", i); history.replaceState(history.state, "", u);
          paintTabs();
          panel.innerHTML = trackPanel(); panel.setAttribute("aria-labelledby", `tab-${i}`);
          wireTrack();
          if (focus) $(`#tab-${i}`, view)?.focus();
          E.refresh();
        };
        // the track's fields write into the selected song (S7: its status ↔ its finish); the collection follows (S9)
        const onTrack = (path) => {
          const t = tr();
          if (path === "status") E.onStatus(panel, t, { onChange: () => { paintDerived(); E.changed("songs"); } });
          if (path === "name") { const b = $(`#tab-${ti} .st-tab__l`, view); if (b) b.textContent = t.name || `Track ${ti + 1}`; }
          paintDerived(); E.changed("songs");
        };
        S.bind(panel, new Proxy({}, { get: (_, k) => tr()[k], set: (_, k, v) => ((tr()[k] = v), true) }), onTrack);
        view.addEventListener("click", (e) => {
          const g = e.target.closest("[data-gotrack]");
          if (g) { select(+g.dataset.gotrack); Y.sound("tap"); return; }
          const tb = e.target.closest("[data-tab]");
          if (tb) { select(+tb.dataset.tab); Y.sound("tap"); return; }
          if (e.target.closest("[data-addtrack]")) { const was = tr(); m.songs.push({ id: E.newId("t"), name: "", status: "wip", start: Y.fmt.month(new Date(S.now())), instrument: was?.instrument || m.instrument, url: "", links: [] }); select(m.songs.length - 1); paintColl(); E.changed("songs"); Y.sound("token-add"); $("[data-track] input", view)?.focus(); return; }
          if (e.target.closest("[data-rmtrack]")) {
            if (m.songs.length < 2) { Y.sound("nope"); S.toast({ icon: "ph-hand-palm", title: "A collection needs a track", text: "Switch it to a single instead." }); return; }
            const [gone] = m.songs.splice(ti, 1); Y.sound("tag-remove"); select(Math.max(0, ti - 1)); paintColl(); E.changed("songs");
            S.toast({ icon: "ph-trash", title: `Removed “${gone.name || "track"}”`, undo: () => { m.songs.splice(ti + 1, 0, gone); select(ti + 1); paintColl(); E.changed("songs"); } });
          }
        });
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
            select(m.songs.indexOf(cur), false); paintDerived(); E.changed("songs");
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
      <div class="st-contact">${Y.links(h.contact).map((l) => `<a href="${esc(l.url)}"><i class="ph-bold ${l.icon}" aria-hidden="true"></i>${esc(l.label)}</a>`).join("")}</div></div>`; // i9 · links: the contacts are a links list (any profile, their text)
  S.screens.home = {
    section: () => "home", navKey: () => "home", focus: true, foot: true, title: () => "Home & About",
    render(view) {
      const h = S.data.home;
      const line = (l, i) => `<div class="patch st-kw" data-line="${i}">
        <div class="st-kw__row">${S.f.text(h, `lines.${i}.before`, { label: "Before" })}${S.f.text(h, `lines.${i}.word`, { label: "Keyword" })}${S.f.text(h, `lines.${i}.after`, { label: "After" })}</div>
        <div class="st-kw__opts"><span class="st-lab">Scribble</span><span class="st-colors" role="radiogroup" aria-label="Scribble colour for ${esc(l.word)}">${COLORS.map(([c, n]) => `<button type="button" class="st-color ysel" role="radio" style="--scribble: var(--${c})" data-color="${c}" data-line="${i}" aria-checked="${l.color === c}" aria-pressed="${l.color === c}" tabindex="${l.color === c ? 0 : -1}" aria-label="${n}"><span class="yscribble" data-seed="${c}" aria-hidden="true">Aa</span></button>`).join("")}</span>
          <label class="st-lab" style="margin-left:8px" for="opens-${i}">Opens</label><select class="yfield st-select" id="opens-${i}" data-f="lines.${i}.to" style="width:auto;min-width:150px">${[["projects", "Projects"], ["music", "Music"], ["thoughts", "Thoughts"], ["link", "A link"], ["", "Nothing"]].map(([v, l]) => `<option value="${v}"${l === "" || (h.lines[i].to || "") === v ? " selected" : ""}>${l}</option>`).join("")}</select></div></div>`;
      const form = [
        E.sec("Hello", S.f.text(h, "hello", { label: "First line", placeholder: "hi, i'm aiden!" })),
        E.sec("Intro", `<div style="display:grid;gap:10px">${h.lines.map(line).join("")}</div>`, { meta: "keywords get the scribble underline" }),
        E.sec("Contact", E.links(h, { key: "contact", label: "Contact links", placeholder: "Paste a profile link or an email" }), { meta: "the text is what shows: @handle" }), // i9 · links (S5)
      ].join("");
      view.innerHTML = E.shell({ section: "home", item: h, back: { href: S.href("dashboard"), label: "Studio" }, titlePath: "", title: "Home & About", form, preview: E.homePreview(h) });
      E.wire(view, { section: "home", item: h, checks: () => [{ ok: !!h.hello.trim(), title: "First line", text: h.hello }, { ok: h.lines.every((l) => l.word.trim()), title: "Keywords", text: h.lines.map((l) => l.word).join(" · ") }], preview: () => E.homePreview(h) });
      view.addEventListener("click", (e) => {
        const c = e.target.closest("[data-color]"); if (!c) return;
        const l = h.lines[+c.dataset.line]; l.color = c.dataset.color;
        $$(`[data-color][data-line="${c.dataset.line}"]`, view).forEach((b) => { b.setAttribute("aria-pressed", String(b === c)); b.setAttribute("aria-checked", String(b === c)); b.tabIndex = b === c ? 0 : -1; });
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
  // i9 · polish (S13, pin 17): each swatch is the thing in miniature, the kit's .ystub (a pick's tag stub: its twill
  // "x pattern", seam, eyelet) or .ynote (a scratch's sticky note), coloured by the post's own [data-stub] / [data-note]
  // rules. One tab stop per group; arrow keys move and choose (as S.f.choice).
  E.colors = (p, list, label) => {
    const kind = list === Y.post.STUB_COLORS ? "stub" : "note";
    return `<div class="st-swatches" role="radiogroup" aria-label="${esc(label)}">${list.map(([k, name], i) => {
      const on = (p.color || list[0][0]) === k;
      return `<button type="button" class="st-swatch ysel y${kind}" data-${kind}="${k}" role="radio" data-color="${k}" aria-checked="${on}" aria-pressed="${on}" tabindex="${on ? 0 : -1}" title="${esc(name)}"><span class="sr-only">${esc(name)}${i === 0 ? " (default)" : ""}</span></button>`;
    }).join("")}</div>`;
  };
  document.addEventListener("keydown", (e) => {
    const b = e.target.closest?.(".st-swatch[role=radio], .st-color[role=radio]"); if (!b || !/^Arrow(Left|Right|Up|Down)$/.test(e.key)) return;
    e.preventDefault();
    const all = [...b.parentElement.querySelectorAll("[role=radio]")];
    const n = all[(all.indexOf(b) + (/Right|Down/.test(e.key) ? 1 : -1) + all.length) % all.length];
    n.focus(); n.click();
  });
  document.addEventListener("click", (e) => {
    const b = e.target.closest?.(".st-swatch[data-color]"); if (!b || S.state?.name !== "compose") return;
    const p = S.find("thoughts", S.state.q.get("id")); if (!p) return;
    const first = b.parentElement.querySelector(".st-swatch")?.dataset.color;
    if (b.dataset.color === first) delete p.color; else p.color = b.dataset.color;
    b.parentElement.querySelectorAll(".st-swatch").forEach((x) => { x.setAttribute("aria-pressed", String(x === b)); x.setAttribute("aria-checked", String(x === b)); x.tabIndex = x === b ? 0 : -1; });
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
          E.sec("Body", E.md(p, "body", { label: "Body" }), { action:`<button type="button" class="btn btn--ghost btn--sm" data-notion><i class="ph-bold ph-arrow-square-in" aria-hidden="true"></i><span>Import from Notion</span></button>` }),
          tagsSec,
        ].join("");
      } else if (type === "pick") {
        titlePath = "name"; titlePH = "What are you picking?";
        const colls = S.data.collections;
        const n = (k) => S.data.thoughts.filter((x) => x.type === "pick" && x.collection === k).length;
        form = [
          // i9 · links (S5): a pick's links are the one links field too (the first is the pick's own link: p.url follows it)
          E.sec("Links", `${E.links(p, { placeholder: "Paste the link (+ its GitHub, docs…)", onChange: () => { p.url = Y.links(p)[0]?.url || ""; } })}${S.f.area(p, "blurb", { label: "Why it's good", rows: 3, max: 200, placeholder: "One line." })}`, { meta: "the first is the pick", action: `<button type="button" class="btn btn--ghost btn--sm" data-fetch><i class="ph-bold ph-sparkle" aria-hidden="true"></i><span>Fill in</span></button>` }),
          E.sec("Collection", `<div class="st-colls" role="radiogroup" aria-label="Collection" data-colls>${Object.entries(colls).map(([k, c]) => `<button type="button" class="ycard ylift ysel st-coll" role="radio" data-coll="${k}" aria-checked="${p.collection === k}" aria-pressed="${p.collection === k}"><span class="st-coll__ic" aria-hidden="true"><i class="ph-bold ${c.icon}"></i></span><span><b>${esc(c.title)}</b><span class="meta">${n(k)} picks</span></span></button>`).join("")}<button type="button" class="ycard ylift st-coll st-coll--new" data-newcoll aria-expanded="false"><span class="st-coll__ic" aria-hidden="true"><i class="ph-bold ph-plus"></i></span><span><b>New collection</b><span class="meta">a page that gathers picks</span></span></button></div>
            <div data-newcollform data-scope hidden></div><div data-order></div>`, { meta: "picks gather into a collection page" }),
          E.sec("Tag colour", E.colors(p, Y.post.STUB_COLORS, "Tag stub colour"), { meta: "the stub the yarn loops through" }),
          tagsSec,
        ].join("");
      } else if (type === "playlist") {
        form = [
          E.sec("Note", S.f.text(p, "note", { label: "A line about it", placeholder: "Stuff I've been writing to." })),
          E.sec("Tracks", E.plForm(p), { meta: "your songs + links from anywhere" }), // i9 · links (S2): studio-links.js
          tagsSec,
        ].join("");
      } else if (type === "embed") {
        form = [
          E.sec("Note", S.f.text(p, "note", { label: "A line about them", placeholder: "Old drawings I found." })),
          E.sec("Images", E.media(p, "media", { grid: true, cover: false, addLabel: "Add photos" }), { meta: "tap one to add alt text" }),
          E.sec("Links", E.links(p, { placeholder: "Paste links: YouTube, Figma, any site…" }), { meta: "optional · buttons under the images" }), // i9 · links (S5, pin 18)
          tagsSec,
        ].join("");
      }
      const preview = () => (type === "article" ? E.articlePreview(p) : `<div style="padding:22px 0">${E.postCard(p)}</div>`);
      view.innerHTML = E.shell({ section: "thoughts", item: p, back: { href: S.href("list", { section: "thoughts" }), label: "Thoughts" }, titlePath, title: titlePath ? "" : (isNew ? "New scratch" : "Scratch"), titlePH: type === "article" ? "Untitled article" : type === "playlist" ? "Name the playlist" : type === "embed" ? "Title the set" : titlePH, headExtra: isNew ? typeChips : "", form, preview: preview() });
      
      const checks = () => {
        const c = [];
        if (type === "scratch") c.push({ ok: !!(p.text || "").trim(), title: "The thought", text: (p.text || "").length > 280 ? "Over 280 characters" : (p.text || "").trim() ? `${(p.text || "").length} / 280` : "Write something first.", fix: () => $("textarea[data-f=text]", view).focus() });
        if (type === "article") { c.push({ ok: !!(p.title || "").trim(), title: "Title", text: p.title || "Needs a title", fix: () => $("#st-title").focus() }); c.push({ ok: S.words(p.body) > 30 ? true : "warn", title: S.plural(S.words(p.body), "word"), text: S.words(p.body) > 30 ? `${Math.max(1, Math.round(S.words(p.body) / 220))} min read` : "Pretty short for an article." }); c.push({ ok: p.cover ? true : "warn", title: p.cover ? "Cover set" : "No cover", text: p.cover ? "" : "Link previews will use the site card." }); }
        if (type === "pick") { c.push({ ok: !!(p.name || "").trim(), title: "Name", text: p.name || "Name it", fix: () => $("#st-title").focus() }); c.push({ ok: /^https?:\/\/\S+\.\S+/.test(p.url || ""), title: "URL", text: p.url || "Add the link", fix: () => $("[data-links] [data-lkin]", view)?.focus() }); c.push({ ok: true, title: "Collection", text: S.data.collections[p.collection]?.title || "None" }); }
        if (type === "playlist") { c.push({ ok: !!(p.title || "").trim(), title: "Name", text: p.title || "Name it", fix: () => $("#st-title").focus() }); c.push({ ok: (p.tracks || []).length > 1 ? true : (p.tracks || []).length ? "warn" : false, title: S.plural((p.tracks || []).length, "track"), text: (p.tracks || []).length ? E.plTime(p) : "Add at least one" }); c.push(...E.plChecks(p)); } // i9 · links (S2): external tracks' lengths are optional; one without a title is a warning
        if (type === "embed") { const miss = (p.media || []).filter((m) => !m.alt).length; c.push({ ok: (p.media || []).length || Y.links(p).length ? true : false, title: S.plural((p.media || []).length, "image"), text: (p.media || []).length ? "" : "Add a photo or a link" }); c.push({ ok: miss ? "warn" : true, title: miss ? `${miss} without alt text` : "Alt text on everything", text: "", fix: miss ? () => { const i = p.media.findIndex((m) => !m.alt); E.mediaSheet(p, "media", i, $(`[data-medit="${i}"]`), { cover: false, onChange: () => { E.repaintMedia(); E.changed("media"); } }); } : null, fixLabel: "Add alt text" }); }
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
      // i9 · polish (S14) · ?demo=sets: the set lends 5 more pictures for this screen (9 in all), so the preview shows the
      // two-row grid's "+N" (or ?imgset=strip's carousel); they leave with the screen
      if (type === "embed" && q.get("demo") === "sets") {
        const lent = ["sona-different.png", "rawsy.png", "site-plan.png", "portal-student.png", "bankresult.png"].map((f) => ({ src: `../media/${f}`, alt: f.replace(/\.\w+$/, "").replace(/-/g, " ") }));
        (p.media ||= []).push(...lent); E.repaintMedia?.(); E.swapPreview($("[data-prev]", view), preview());
        S.onLeave(() => { p.media = p.media.filter((m) => !lent.includes(m)); });
      }
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
            if (!/\S+\.\S+/.test(p.url || "")) { Y.sound("nope", { el: fb }); const a = $("[data-links] [data-lkin]", view); a?.setAttribute("aria-invalid", "true"); a?.focus(); return; }
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
      if (type === "playlist") E.wirePl(view, p); // i9 · links (S2): your songs + tracks from anywhere (studio-links.js)
      if (q.get("sheet") === "publish") requestAnimationFrame(() => S.checkSheet({ section: "thoughts", item: p, btn: $("[data-publish]", view), checks: checks() }));
    },
  };
})();
