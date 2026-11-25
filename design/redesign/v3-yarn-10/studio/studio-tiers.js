/* ============================================================
   Studio · tier list creator (only the owner makes tier lists;
   visitors add their own ranking + comments on the public tier page).
   Type a name → pick an image → it lands in Unranked → drag (or tap,
   or keyboard) into tiers → Publish.
   Uses studio/tier-images.js + studio/tier-drag.js (copied from i1 thoughts/).
   ============================================================ */
(() => {
  "use strict";
  const S = window.Studio, Y = window.Yarn, E = S.ed;
  const { $, $$, esc } = S;
  const TI = () => window.TierImages;
  const RATES = [1.2, 1.1, 1, 0.9, 0.82, 0.78];

  S.tierlist = (view, q, p, typeChips = "") => {
    p.tiers ||= { S: [], A: [], B: [], C: [], D: [] };
    p.unranked ||= [];
    p.pics ||= {};          // name → image kind ("logo" | "patch" | "wordmark" | "photo" | "screen" | "text") · i9: or an image URL
    p.notes ||= {};         // i9 · polish (S16): name → the owner's line about it (the ranking page shows it with the item)
    p.settings ||= { rank: true, comments: true, community: true };
    // i4: tiers are { id, label, color } (kit/posts.js); ids stay put when a label changes, so visitors' votes survive
    // a rename. Labels: any text (≤ 40). Colour: the kit's felt palette (tap the dot to change it). Up to ten tiers.
    p.tierDefs = Y.post.tierDefs(p).map(({ id, label, color }) => ({ id, label, color }));
    for (const d of p.tierDefs) p.tiers[d.id] ||= [];
    const PAL = Y.post.TIER_COLORS, MAXT = PAL.length;
    const defOf = (id) => p.tierDefs.find((d) => d.id === id);
    const nameOf = (id) => defOf(id)?.label ?? id;
    const named = () => p.tierDefs.some((d) => [...d.label].length > 3);
    const order = () => p.tierDefs.map((d) => d.id);
    const ownImg = (k) => /^(https?:|data:image\/|blob:|\/)/.test(String(k || ""));
    const img = (name) => {
      const k = p.pics[name] || "logo";
      if (ownImg(k)) return `<span class="st-titem__img"><img src="${esc(S.url(k))}" alt="" draggable="false" style="width:100%;height:100%;object-fit:cover"></span>`;
      if (k === "text") return `<span class="st-titem__img" style="display:grid;place-items:center;background:var(--cotton-2);font:900 .9rem/1 var(--font-display);padding:4px;text-align:center">${esc(name.slice(0, 10))}</span>`;
      const c = TI().candidates(name).find((x) => x.kind === k) || TI().best(name);
      return `<span class="st-titem__img">${TI().svg(c, name)}</span>`;
    };
    const item = (name, where) => `<li class="st-titem" data-key="${esc(name)}"><button type="button" class="st-titem__btn ysel" aria-pressed="false" aria-label="${esc(name)}, ${where === "__tray" ? "unranked" : `in tier ${esc(nameOf(where))}`}" aria-describedby="tl-help">${img(name)}<span class="st-titem__name">${esc(name)}</span></button></li>`;
    const colName = (c) => PAL.find(([k]) => k === c)?.[1] || (/^#/.test(String(c)) ? `your own ${c}` : c);
    const tierRow = (d, i) => `<div class="st-tier" data-t="${Math.min(i, 5)}" data-tier="${esc(d.id)}"${Y.post.tcAttrs(d.color)}><div class="st-tier__lab"><input value="${esc(d.label)}" maxlength="40" size="${Math.max(2, [...d.label].length)}" aria-label="Name of tier ${i + 1}" data-tierlab="${esc(d.id)}"><button type="button" class="st-tier__c" data-tiercolor="${esc(d.id)}" aria-haspopup="dialog" aria-expanded="false" aria-label="Tier ${i + 1} colour: ${esc(colName(d.color))}. Change colour" title="Colour: ${esc(colName(d.color))}"></button></div><ul class="st-zone" data-zone="${esc(d.id)}" aria-label="Tier ${esc(d.label)}">${p.tiers[d.id].map((n) => item(n, d.id)).join("")}</ul></div>`;
    const board = () => `<div class="st-tiers"${named() ? " data-named" : ""} data-tiers>${p.tierDefs.map(tierRow).join("")}</div>`;
    const ranked = () => Object.values(p.tiers).flat().length;
    const form = `
      <div class="st-tl">
        <div class="st-tl__main">
          ${board()}
          <div class="st-tl__rows" style="margin:10px 0 16px"><button type="button" class="btn btn--ghost btn--sm" data-addtier><i class="ph-bold ph-plus" aria-hidden="true"></i><span>Add a tier</span></button><button type="button" class="btn btn--ghost btn--sm" data-rmtier><i class="ph-bold ph-minus" aria-hidden="true"></i><span>Remove the last tier</span></button></div>
          <section class="st-tray" data-tray aria-labelledby="tray-h">
            <div class="st-sec__h"><h2 class="eyebrow" id="tray-h">Unranked <span class="meta" data-trayn>${p.unranked.length}</span></h2><span class="meta st-hide-m">drag into a tier · tap one to edit it</span></div>
            <ul class="st-zone" data-zone="__tray" aria-label="Unranked">${p.unranked.map((n) => item(n, "__tray")).join("")}</ul>
          </section>
          <p class="sr-only" id="tl-help">Enter opens it to edit. Space picks it up: arrow up and down move between tiers, left and right move inside a tier. Number keys send it straight to a tier. Space drops, Escape cancels.</p>
        </div>
        <div class="st-tl__side">
          <section class="patch st-tl__add" aria-labelledby="add-h">
            <h2 id="add-h"><i class="ph-bold ph-plus-circle" aria-hidden="true"></i>Add things</h2>
            <form class="st-field" data-addform style="gap:8px"><label class="sr-only" for="tl-in">Name of a thing to rank</label>
              <div style="display:flex;gap:8px"><input class="yfield st-in" id="tl-in" placeholder="Type a name: arc, zen…" autocomplete="off" enterkeyhint="done" data-tlin><button type="submit" class="btn btn--red btn--icon" style="flex:none" aria-label="Add it with the first image"><i class="ph-bold ph-arrow-elbow-down-left" aria-hidden="true"></i></button></div>
              <p class="st-hint">Enter adds it with the first image. Paste <b>Arc, Zen, Firefox</b> to add several.</p></form>
            <div class="st-sugs" data-sugs role="listbox" aria-label="Suggestions"></div>
            <div data-imgs></div>
          </section>
          <section class="patch st-tl__add st-tl__set" aria-labelledby="vis-h">
            <h2 id="vis-h"><i class="ph-bold ph-users-three" aria-hidden="true"></i>On the public page</h2>
            <p class="st-note">Only you make rankings. Visitors get yours, then can add theirs.</p>
            ${S.f.toggle(p, "settings.rank", { label: "Visitors can rank it too", text: "They drag their own order; nobody can edit yours." })}
            ${S.f.toggle(p, "settings.community", { label: "Show everyone's average", text: "A small bar under each item, after they've ranked." })}
            ${S.f.toggle(p, "settings.comments", { label: "Comments", text: "A thread under the list. You can hide any comment." })}
          </section>
        </div>
      </div>`;
    view.innerHTML = E.shell({ section: "thoughts", item: p, back: { href: S.href("list", { section: "thoughts" }), label: "Thoughts" }, titlePath: "title", titlePH: "Name your ranking", facts: `<span class="st-pubslot" data-tlmeta></span>`, headExtra: `${typeChips}${(p.tags || []).length ? `<div class="st-tltags">${S.hashtags(p.tags, 6)}</div>` : ""}`, form, wide: true });
    // i7 · studio (S1): the ranking's numbers + visitor settings as facts in the head's label line (no mono strip)
    const paintMeta = () => { $("[data-tlmeta]", view).innerHTML = Y.fact.text("ph-ranking", `${ranked()} ranked · ${p.unranked.length} left`) + Y.fact.text("ph-users-three", `${p.settings.rank ? "visitors rank too" : "view only"}${p.settings.comments ? " · comments" : ""}`); $("[data-trayn]", view).textContent = p.unranked.length; };
    paintMeta();
    const checks = () => [
      { ok: !!(p.title || "").trim(), title: "Title", text: p.title || "Name it first.", fix: () => { const t = $("#st-title"); t.setAttribute("aria-invalid", "true"); t.focus(); } },
      { ok: ranked() >= 2, title: `${ranked()} ranked`, text: ranked() >= 2 ? `${order().filter((t) => p.tiers[t].length).length} tiers in use` : "Put at least two things in tiers." },
      { ok: p.unranked.length ? "warn" : true, title: p.unranked.length ? `${p.unranked.length} still unranked` : "Nothing left over", text: p.unranked.length ? "They won't show on the public page." : "" },
      { ok: true, title: "Visitors", text: `${p.settings.rank ? "can add their ranking" : "can only look"}${p.settings.comments ? " · comments on" : ""}` },
    ];
    E.wire(view, { section: "thoughts", item: p, checks, onChange: paintMeta });

    /* ---- model ← DOM ---- */
    const main = $(".st-tl__main", view);
    const sync = () => {
      for (const t of order()) p.tiers[t] = $$(`[data-zone="${CSS.escape(t)}"] .st-titem`, main).map((li) => li.dataset.key);
      p.unranked = $$(`[data-zone="__tray"] .st-titem`, main).map((li) => li.dataset.key);
      $$(".st-titem", main).forEach((li) => { const z = li.parentElement.dataset.zone; $(".st-titem__btn", li).setAttribute("aria-label", `${li.dataset.key}, ${z === "__tray" ? "unranked" : `in tier ${nameOf(z)}`}`); });
      paintMeta(); E.changed("tiers");
    };
    const zones = () => [...order().map((t) => ({ zone: $(`[data-zone="${CSS.escape(t)}"]`, main), hit: $(`[data-tier="${CSS.escape(t)}"]`, main) })), { zone: $(`[data-zone="__tray"]`, main), hit: $("[data-tray]", main) }];
    const rate = (zone) => { const i = order().indexOf(zone?.dataset.zone); return i < 0 ? 0.9 : RATES[Math.min(i, RATES.length - 1)]; };
    let sel = null; // tap-to-move selection
    const setSel = (li) => {
      $$(".st-titem__btn[aria-pressed='true']", main).forEach((b) => b.setAttribute("aria-pressed", "false"));
      sel = li;
      if (li) $(".st-titem__btn", li).setAttribute("aria-pressed", "true");
      main.toggleAttribute("data-selecting", !!li);
    };
    if (window.TierDrag) window.TierDrag.create({
      root: main, layer: S.layer(), itemSel: ".st-titem", enabled: () => true,
      items: () => $$(".st-titem", main), zones,
      onStart: (li) => { setSel(null); Y.sound("pickup", { el: li }); },
      onOver: (z) => { $$(".st-tier, .st-tray", main).forEach((r) => r.classList.remove("is-over")); if (z) (z.closest(".st-tier") || z.closest(".st-tray"))?.classList.add("is-over"); },
      onDrop: (li, info) => { Y.sound("drop", { el: li, rate: rate(li.parentElement) }); sync(); if (info.to.zone !== info.from.zone) S.say(`${li.dataset.key} moved to ${li.parentElement.dataset.zone === "__tray" ? "unranked" : `tier ${nameOf(li.parentElement.dataset.zone)}`}`); },
      onTap: (li) => editItem(li), // i9 · polish (S16): a press that never moved is a tap: edit it (a drag still drags)
    });
    // tap a row while something is picked → move it there
    main.addEventListener("click", (e) => {
      if (!sel || e.target.closest(".st-titem") || e.target.closest("input, [data-tiercolor]")) return;
      const row = e.target.closest(".st-tier, .st-tray"); if (!row) return;
      const z = $(".st-zone", row);
      window.TierDrag.flip($$(".st-titem", main), () => z.appendChild(sel));
      Y.sound("drop", { el: sel, rate: rate(z) });
      setSel(null); sync();
    });
    // keyboard: Space picks up / drops, ↑↓ between tiers, ←→ inside, 1–9 straight to a tier, Esc cancels
    let held = null;
    main.addEventListener("click", (e) => {
      const b = e.target.closest(".st-titem__btn"); if (!b || e.detail !== 0) return;
      const li = b.closest(".st-titem");
      if (!held) { held = { li, from: li.parentElement, next: li.nextElementSibling }; setSel(li); Y.sound("pickup", { el: li }); S.say(`Picked up ${li.dataset.key}.`); }
      else { const h = held; held = null; setSel(null); Y.sound("drop", { el: h.li, rate: rate(h.li.parentElement) }); sync(); $(".st-titem__btn", h.li).focus(); }
    });
    main.addEventListener("keydown", (e) => {
      const b = e.target.closest(".st-titem__btn"); if (!b) return;
      const li = b.closest(".st-titem");
      if (e.key === "Enter" && !held) { e.preventDefault(); editItem(li); return; } // i9 · polish (S16)
      const zs = zones().map((z) => z.zone);
      const move = (fn) => { window.TierDrag.flip($$(".st-titem", main), fn); $(".st-titem__btn", li).focus(); };
      if (/^[1-9]$/.test(e.key) && zs[+e.key - 1] && zs[+e.key - 1].dataset.zone !== "__tray") { e.preventDefault(); move(() => zs[+e.key - 1].appendChild(li)); Y.sound("drop", { el: li, rate: rate(zs[+e.key - 1]) }); if (held) { held = null; setSel(null); } sync(); return; }
      if (!held || held.li !== li) return;
      const zi = zs.indexOf(li.parentElement);
      if (e.key === "ArrowUp" || e.key === "ArrowDown") { e.preventDefault(); const nz = zs[zi + (e.key === "ArrowUp" ? -1 : 1)]; if (!nz) return Y.sound("nope"); move(() => nz.appendChild(li)); S.say(nz.dataset.zone === "__tray" ? "Unranked" : `Tier ${nameOf(nz.dataset.zone)}`); }
      else if (e.key === "ArrowLeft" && li.previousElementSibling) { e.preventDefault(); move(() => li.parentElement.insertBefore(li, li.previousElementSibling)); }
      else if (e.key === "ArrowRight" && li.nextElementSibling) { e.preventDefault(); move(() => li.parentElement.insertBefore(li, li.nextElementSibling.nextElementSibling)); }
      else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); const h = held; held = null; setSel(null); move(() => h.from.insertBefore(h.li, h.next && h.next.parentElement === h.from ? h.next : null)); S.say("Cancelled"); }
    });
    // tier names (i4: any text; the id stays, so a rename never loses votes). The field grows with its text; any
    // name past 3 characters turns the board into felt tabs, the same as the public page.
    main.addEventListener("input", (e) => {
      const inp = e.target.closest("[data-tierlab]"); if (!inp) return;
      inp.size = Math.max(2, [...inp.value].length);
      $("[data-tiers]", main).toggleAttribute("data-named", [...$$("[data-tierlab]", main)].some((x) => [...x.value.trim()].length > 3));
    });
    main.addEventListener("change", (e) => {
      const inp = e.target.closest("[data-tierlab]"); if (!inp) return;
      const d = defOf(inp.dataset.tierlab); if (!d) return;
      const nu = inp.value.trim().slice(0, 40);
      if (!nu || p.tierDefs.some((x) => x !== d && x.label.toLowerCase() === nu.toLowerCase())) { inp.value = d.label; inp.size = Math.max(2, [...d.label].length); if (nu) Y.sound("nope"); $("[data-tiers]", main).toggleAttribute("data-named", named()); return; }
      d.label = nu; inp.value = nu;
      $(".st-zone", inp.closest(".st-tier")).setAttribute("aria-label", `Tier ${nu}`);
      $("[data-tiers]", main).toggleAttribute("data-named", named());
      E.changed("tiers");
    });
    const repaintBoard = () => { closeColor({ focus: false }); $("[data-tiers]", main).outerHTML = board(); };

    /* ---- i9 · polish · S15 (pin 20: "make this open a color picker rather than having me cycle for years") ----
       The felt dot opens a picker on the kit's floating layer (Yarn.layer()): the ten felts as real tier keys (the
       felt, its wash, this tier's own letter) and a colour of the owner's own. Arrow keys move through the felts and
       show each on the row; Enter, Space or a tap chooses and closes; Esc puts the old colour back and closes; a tap
       outside (or Tab out) keeps it and closes. Focus comes back to the dot (Esc / choosing). */
    let tcp = null;
    const applyColor = (d, cb, color) => {
      d.color = color;
      const row = cb.closest(".st-tier"); if (row) Y.post.setTc(row, color);
      const n = colName(color), at = order().indexOf(d.id) + 1;
      cb.setAttribute("aria-label", `Tier ${at} colour: ${n}. Change colour`); cb.title = `Colour: ${n}`;
      E.changed("tiers");
    };
    const closeColor = ({ revert = false, focus = true } = {}) => {
      if (!tcp) return;
      const { pop, cb, d, was, ac } = tcp; tcp = null;
      ac.abort();
      if (revert && d.color !== was) { applyColor(d, cb, was); S.say(`Tier ${d.label}: back to ${colName(was)}`); }
      cb.setAttribute("aria-expanded", "false");
      pop.style.pointerEvents = "none";
      if (Y.reduced()) pop.remove();
      else pop.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(-4px) scale(.97)" }], { duration: 140, easing: "cubic-bezier(.4,0,1,1)", fill: "forwards" }).onfinish = () => pop.remove();
      if (focus && cb.isConnected) cb.focus({ preventScroll: true });
    };
    S.onLeave(() => closeColor({ focus: false }));
    const openColor = (cb) => {
      if (tcp?.cb === cb) return closeColor();
      closeColor({ focus: false });
      const d = defOf(cb.dataset.tiercolor); if (!d) return;
      const ac = new AbortController(), on = { signal: ac.signal };
      const mine = /^#[0-9a-f]{6}$/i.test(d.color);
      const key = [...d.label].length <= 3 ? d.label : [...d.label][0];
      const pop = document.createElement("div");
      pop.className = "st-tcp";
      pop.setAttribute("role", "dialog");
      pop.setAttribute("aria-label", `Colour for tier ${d.label}`);
      pop.innerHTML = `<div class="st-tcp__grid" role="radiogroup" aria-label="Felt colours">${PAL.map(([k, name]) => { const on1 = d.color === k; return `<button type="button" class="st-tcp__sw ytierkey ysel" role="radio" aria-checked="${on1}" aria-pressed="${on1}" tabindex="${on1 ? 0 : -1}" data-c="${k}"${Y.post.tcAttrs(k)} aria-label="${name}"><span aria-hidden="true">${esc(key)}</span></button>`; }).join("")}</div>
        <label class="st-tcp__own"><span class="st-tcp__ownsw ysel${mine ? " is-selected" : ""}"><input type="color" value="${mine ? d.color : PAL.find(([k]) => k === d.color)?.[2] || "#d22f3a"}" data-own aria-label="Your own colour"></span><span>Your own colour${mine ? ` <span class="meta">${esc(d.color)}</span>` : ""}</span></label>`;
      S.layer().appendChild(pop);
      tcp = { pop, cb, d, was: d.color, ac };
      cb.setAttribute("aria-expanded", "true");
      const sws = $$(".st-tcp__sw", pop), own = $("[data-own]", pop);
      if (!sws.some((b) => b.tabIndex === 0)) sws[0].tabIndex = 0;
      const mark = (k) => { sws.forEach((b) => { const s1 = b.dataset.c === k; b.setAttribute("aria-checked", String(s1)); b.setAttribute("aria-pressed", String(s1)); b.tabIndex = s1 ? 0 : -1; }); if (!sws.some((b) => b.tabIndex === 0)) sws[0].tabIndex = 0; $(".st-tcp__ownsw", pop).classList.toggle("is-selected", /^#/.test(k)); };
      const place = () => {
        if (!cb.isConnected) return closeColor({ focus: false });
        const r = cb.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight, m = 12;
        const x = Math.round(Math.min(Math.max(m, r.left - 12), innerWidth - w - m));
        let y = r.bottom + 8;
        if (y + h > innerHeight - m && r.top - h - 8 >= m) y = r.top - h - 8;
        pop.style.left = `${x}px`; pop.style.top = `${Math.round(Math.max(m, y))}px`;
        pop.style.transformOrigin = `${Math.round(r.left + r.width / 2 - x)}px ${y < r.top ? "100%" : "0"}`;
      };
      place();
      if (!Y.reduced()) { const sp = Y.springEasing({ response: 0.3 }); pop.animate([{ opacity: 0, transform: "scale(.9)" }, { opacity: 1, transform: "none" }], { duration: sp.duration, easing: sp.easing }); }
      Y.sound("open", { el: cb });
      addEventListener("resize", place, on);
      addEventListener("scroll", place, { ...on, passive: true, capture: true });
      document.addEventListener("pointerdown", (e) => { if (!pop.contains(e.target) && !cb.contains(e.target)) closeColor({ focus: false }); }, { ...on, capture: true });
      pop.addEventListener("focusout", (e) => { if (e.relatedTarget && !pop.contains(e.relatedTarget) && e.relatedTarget !== cb) closeColor({ focus: false }); }, on);
      pop.addEventListener("click", (e) => {
        const b = e.target.closest(".st-tcp__sw"); if (!b) return;
        applyColor(d, cb, b.dataset.c); mark(b.dataset.c);
        Y.sound("chip-on", { el: b }); S.say(`Tier ${d.label}: ${colName(b.dataset.c)}`);
        closeColor();
      }, on);
      pop.addEventListener("keydown", (e) => {
        if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); closeColor({ revert: true }); return; }
        // Tab keeps the page's order though the picker lives on the layer: past its end → whatever follows the dot;
        // Shift+Tab off the felts → back to the dot. Either way it closes (keeping the colour).
        if (e.key === "Tab") {
          if (!e.shiftKey && e.target === own) {
            e.preventDefault(); closeColor({ focus: false });
            const f = $$("a[href], button:not([disabled]), input:not([disabled]), textarea, select, [tabindex='0']", view).filter((x) => x.getClientRects().length);
            (f[f.indexOf(cb) + 1] || cb).focus();
          } else if (e.shiftKey && e.target !== own) { e.preventDefault(); closeColor(); }
          return;
        }
        const b = e.target.closest(".st-tcp__sw"); if (!b) return;
        const i = sws.indexOf(b), cols = 5;
        const j = { ArrowRight: i + 1, ArrowLeft: i - 1, ArrowDown: i + cols, ArrowUp: i - cols, Home: 0, End: sws.length - 1 }[e.key];
        if (j == null) return;
        e.preventDefault();
        const n = sws[(j + sws.length) % sws.length];
        n.focus(); mark(n.dataset.c); applyColor(d, cb, n.dataset.c); Y.sound("tap", { el: n });
      }, on);
      own.addEventListener("input", () => { applyColor(d, cb, own.value.toLowerCase()); mark(own.value); }, on);
      own.addEventListener("change", () => { applyColor(d, cb, own.value.toLowerCase()); S.say(`Tier ${d.label}: your own colour`); closeColor(); }, on);
      requestAnimationFrame(() => (sws.find((b) => b.tabIndex === 0) || own).focus({ preventScroll: true }));
    };

    view.addEventListener("click", (e) => {
      const cb = e.target.closest("[data-tiercolor]");
      if (cb) { openColor(cb); return; }
      if (e.target.closest("[data-addtier]")) {
        if (order().length >= MAXT) { Y.sound("nope"); S.toast({ icon: "ph-hand-palm", title: `${MAXT} tiers is the limit`, text: "One felt colour each. Past that nobody reads the bottom." }); return; }
        const letters = ["S", "A", "B", "C", "D", "E", "F"], short = p.tierDefs.every((x) => [...x.label].length <= 1);
        const label = (short && letters.find((n) => !p.tierDefs.some((x) => x.label === n))) || `Tier ${order().length + 1}`;
        const color = (PAL.find(([k]) => !p.tierDefs.some((x) => x.color === k)) || PAL[order().length % PAL.length])[0];
        const id = `t${Date.now().toString(36)}`;
        p.tierDefs.push({ id, label, color }); p.tiers[id] = [];
        window.TierDrag.flip($$(".st-titem, .st-tray", main), repaintBoard); Y.sound("token-add"); E.changed("tiers");
        $(`[data-tierlab="${CSS.escape(id)}"]`, main)?.focus(); return;
      }
      if (e.target.closest("[data-rmtier]")) {
        const ks = order(); if (ks.length <= 2) { Y.sound("nope"); return; }
        const last = ks[ks.length - 1]; p.unranked.push(...p.tiers[last]); delete p.tiers[last]; p.tierDefs.pop();
        window.TierDrag.flip($$(".st-titem, .st-tray", main), () => { repaintBoard(); $(`[data-zone="__tray"]`, main).innerHTML = p.unranked.map((n) => item(n, "__tray")).join(""); });
        Y.sound("tag-remove"); paintMeta(); E.changed("tiers");
      }
    });

    /* ---- add things: name → suggestions → image choices ---- */
    const input = $("[data-tlin]", view), sugs = $("[data-sugs]", view), imgs = $("[data-imgs]", view);
    let pick = null;
    const exists = (n) => Object.values(p.tiers).flat().concat(p.unranked).some((x) => x.toLowerCase() === n.toLowerCase());
    const add = (name, kind = "logo") => {
      name = name.trim(); if (!name) return;
      if (exists(name)) { Y.sound("nope", { el: input }); const li = $(`.st-titem[data-key="${CSS.escape(name)}"]`, main); li?.classList.remove("is-enter"); void li?.offsetWidth; li?.classList.add("is-enter"); S.say(`${name} is already on the list`); return; }
      p.pics[name] = kind;
      p.unranked.push(name);
      const z = $(`[data-zone="__tray"]`, main);
      z.insertAdjacentHTML("beforeend", item(name, "__tray"));
      z.lastElementChild.classList.add("is-enter");
      Y.sound("token-add", { el: input });
      paintMeta(); E.changed("unranked");
    };
    const paintImgs = () => {
      if (!pick) { imgs.innerHTML = ""; return; }
      const cs = TI().candidates(pick);
      imgs.innerHTML = `<div class="st-sec__h" style="margin:2px 0 8px"><span class="st-lab" style="font:800 .84rem/1.2 var(--font-display)">Images for “${esc(pick)}”</span><span class="meta">pick one to add</span></div>
        <div class="st-imgs" role="group" aria-label="Images for ${esc(pick)}">${cs.map((c, i) => `<button type="button" class="st-imgopt ysel ylift" data-img="${c.kind}"${i === 0 ? ' aria-describedby="tl-first"' : ""}><span>${TI().svg(c, pick)}</span><b>${c.label}</b><small>${esc(c.source)}</small></button>`).join("")}<button type="button" class="st-imgopt ysel ylift" data-img="text"><span style="display:grid;place-items:center;background:var(--cotton-2);font:900 1rem/1 var(--font-display)">${esc(pick.slice(0, 8))}</span><b>Text only</b><small>no image</small></button></div>
        <p class="st-hint" id="tl-first" style="margin-top:8px">Mock images drawn on the page. The real search would look up logos by domain and an image search, then copy the pick into R2.</p>`;
    };
    const paintSugs = () => {
      const list = TI().suggest(input.value, 5);
      if (!list.length) { sugs.innerHTML = ""; pick = null; paintImgs(); return; }
      if (!pick || !list.some((s) => s.name === pick)) pick = list[0].name;
      sugs.innerHTML = list.map((s) => `<button type="button" class="ychip ysel" role="option" aria-selected="${s.name === pick}" aria-pressed="${s.name === pick}" data-sug="${esc(s.name)}"><span class="ychip__l">${esc(s.name)}</span><small>${esc(s.hint)}</small></button>`).join("");
      paintImgs();
    };
    input.addEventListener("input", paintSugs);
    input.addEventListener("paste", (e) => { const t = e.clipboardData?.getData("text") || ""; if (!/[,\n]/.test(t)) return; e.preventDefault(); t.split(/[,\n]/).map((x) => x.trim()).filter(Boolean).forEach((n) => add(n)); input.value = ""; paintSugs(); });
    $("[data-addform]", view).addEventListener("submit", (e) => { e.preventDefault(); add(pick || input.value); input.value = ""; pick = null; paintSugs(); input.focus(); });
    view.addEventListener("click", (e) => {
      const sg = e.target.closest("[data-sug]"); if (sg) { pick = sg.dataset.sug; paintSugs(); Y.sound("chip-on", { el: sg }); return; }
      const im = e.target.closest("[data-img]"); if (im) { add(pick, im.dataset.img); input.value = ""; pick = null; paintSugs(); input.focus(); }
    });
    /* ---- i9 · polish · S16 (pin 21: "how do i edit already made things") ----
       Tap or click an item (a press that never moves: a drag still drags) or press Enter on it: its editor, a sheet with
       every part of it. Name (a rename carries its image, note, community votes and any write-up "about" it along),
       image (the same choices as when it was added, or the owner's own: upload or a link), a line about it (p.notes,
       shown with it on the ranking page), its tier (or back to Unranked) and Remove (Undo in the toast). */
    const paintItem = (li) => {
      const n = li.dataset.key, z = li.parentElement?.dataset.zone || "__tray";
      const b = $(".st-titem__btn", li);
      b.innerHTML = `${img(n)}<span class="st-titem__name">${esc(n)}</span>`;
      b.setAttribute("aria-label", `${n}, ${z === "__tray" ? "unranked" : `in tier ${nameOf(z)}`}`);
    };
    const rename = (li, from, to) => {
      const swap = (a) => (a || []).map((n) => (n === from ? to : n));
      for (const t of Object.keys(p.tiers)) p.tiers[t] = swap(p.tiers[t]);
      p.unranked = swap(p.unranked);
      for (const m of [p.pics, p.notes, p.community?.items]) if (m && from in m) { m[to] = m[from]; delete m[from]; }
      for (const x of S.data.thoughts) if (x.about === `post:${p.id}#${from}`) x.about = `post:${p.id}#${to}`;
      li.dataset.key = to; paintItem(li);
    };
    const keyOf = (label) => ([...label].length <= 3 ? label : [...label][0]);
    const editItem = (li) => {
      if (!li?.isConnected) return;
      setSel(null);
      const btn = $(".st-titem__btn", li), st = { note: p.notes[li.dataset.key] || "" };
      const zoneNow = () => li.parentElement?.dataset.zone || "__tray";
      const idN = Y.uid("itn"), idI = Y.uid("iti"), idT = Y.uid("itt");
      const imgOpts = () => {
        const n = li.dataset.key, cur = p.pics[n] || "logo";
        const opts = [...TI().candidates(n).map((c) => ({ k: c.kind, art: TI().svg(c, n), label: c.label })), { k: "text", art: `<span style="display:grid;place-items:center;width:100%;height:100%;background:var(--cotton-2);font:900 1rem/1 var(--font-display)">${esc(n.slice(0, 8))}</span>`, label: "Text only" }];
        if (ownImg(cur)) opts.push({ k: cur, art: `<img src="${esc(S.url(cur))}" alt="" style="width:100%;height:100%;object-fit:cover">`, label: "Your own" });
        const coarse = matchMedia("(pointer: coarse)").matches; // phones: open on the chosen image, not the keyboard
        return opts.map((o) => { const on = cur === o.k; return `<button type="button" class="st-imgopt ysel ylift" role="radio" aria-checked="${on}" aria-pressed="${on}" tabindex="${on ? 0 : -1}" data-itimg="${esc(o.k)}"${on && coarse ? " autofocus" : ""}><span>${o.art}</span><b>${esc(o.label)}</b></button>`; }).join("");
      };
      const tierOpts = () => [...p.tierDefs.map((d) => ({ id: d.id, label: d.label, color: d.color })), { id: "__tray", label: "Unranked" }].map((t) => {
        const on = zoneNow() === t.id;
        return `<button type="button" class="ychip ysel st-ited__tier${on ? " is-selected" : ""}" role="radio" aria-checked="${on}" tabindex="${on ? 0 : -1}" data-itzone="${esc(t.id)}">${t.color ? `<span class="ytierkey st-ited__key"${Y.post.tcAttrs(t.color)} aria-hidden="true">${esc(keyOf(t.label))}</span>` : `<i class="ph-bold ph-tray" aria-hidden="true"></i>`}<span class="ychip__l">${esc(t.label)}</span></button>`;
      }).join("");
      S.sheet({
        from: btn, title: esc(li.dataset.key), width: 600, cls: "st-ited",
        html: `<div class="st-field"><label for="${idN}">Name</label><input class="yfield st-in" id="${idN}" value="${esc(li.dataset.key)}" maxlength="60" autocomplete="off" enterkeyhint="done" data-itname aria-describedby="${idN}-h"><p class="st-hint" id="${idN}-h" data-itnameh>Its votes and write-ups follow a new name.</p></div>
          <div class="st-field"><span class="st-lab" id="${idI}">Image</span><div class="st-imgs st-ited__imgs" role="radiogroup" aria-labelledby="${idI}" data-itimgs>${imgOpts()}</div>
            <p class="st-hint"><label class="ylinkbtn st-ited__up">Upload your own<input type="file" class="sr-only" accept="image/*" data-itup></label> · <button type="button" class="ylinkbtn" data-iturl aria-expanded="false">Use a link</button></p>
            <form class="st-logo__url" data-iturlform hidden novalidate><input class="yfield st-in st-mono" type="url" inputmode="url" placeholder="https://…/image.png" aria-label="Image link" autocomplete="off"><button type="submit" class="btn btn--ink btn--sm">Use it</button></form></div>
          <div class="st-field"><span class="st-lab" id="${idT}">Tier</span><div class="st-choice st-ited__tiers" role="radiogroup" aria-labelledby="${idT}" data-ittiers>${tierOpts()}</div></div>
          ${S.f.area(st, "note", { label: "A line about it", rows: 2, max: 140, placeholder: "Why it sits where it does. Optional.", hint: "Shows with it on the ranking page." })}`,
        foot: `<button type="button" class="btn btn--ghost" data-itdel><i class="ph-bold ph-trash" aria-hidden="true"></i><span>Remove</span></button><span class="ydetail__spacer"></span><button type="button" class="btn btn--ink" data-close>Done</button>`,
        onMount: (s) => {
          const nameIn = $("[data-itname]", s.el), head = $(".st-sheet__head h2", s.wrap);
          const setHead = (n) => { if (head.firstChild) head.firstChild.textContent = n; };
          nameIn.addEventListener("input", () => { nameIn.removeAttribute("aria-invalid"); $("[data-itnameh]", s.el).textContent = "Its votes and write-ups follow a new name."; });
          nameIn.addEventListener("change", () => {
            const from = li.dataset.key, to = nameIn.value.trim().slice(0, 60);
            if (to === from) return;
            if (!to || exists(to) && to.toLowerCase() !== from.toLowerCase()) {
              nameIn.setAttribute("aria-invalid", "true"); Y.sound("nope", { el: nameIn });
              $("[data-itnameh]", s.el).textContent = to ? `${to} is already on the list.` : "It needs a name.";
              nameIn.value = from; return;
            }
            rename(li, from, to); setHead(to); sync();
            $("[data-itimgs]", s.el).innerHTML = imgOpts();
            S.say(`Renamed to ${to}`);
          });
          nameIn.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); nameIn.blur(); nameIn.focus(); } });
          S.bind(s.el, st, (path) => { if (path !== "note") return; const v = st.note.trim(); if (v) p.notes[li.dataset.key] = v; else delete p.notes[li.dataset.key]; E.changed("notes"); }); // (the field's own counter too)
          const pick = (k) => { p.pics[li.dataset.key] = k; paintItem(li); $("[data-itimgs]", s.el).innerHTML = imgOpts(); $(`[data-itimg="${CSS.escape(k)}"]`, s.el)?.focus(); E.changed("pics"); };
          const move = (z) => {
            const zone = $(`[data-zone="${CSS.escape(z)}"]`, main); if (!zone || zone === li.parentElement) return;
            window.TierDrag.flip($$(".st-titem", main), () => zone.appendChild(li));
            Y.sound("drop", { el: li, rate: rate(zone) }); sync(); paintItem(li);
            $("[data-ittiers]", s.el).innerHTML = tierOpts(); $(`[data-itzone="${CSS.escape(z)}"]`, s.el)?.focus();
            S.say(z === "__tray" ? `${li.dataset.key}: unranked` : `${li.dataset.key}: tier ${nameOf(z)}`);
          };
          s.el.addEventListener("click", (e) => {
            const im = e.target.closest("[data-itimg]"); if (im) { pick(im.dataset.itimg); Y.sound("chip-on", { el: im }); return; }
            const tz = e.target.closest("[data-itzone]"); if (tz) { move(tz.dataset.itzone); return; }
            const ub = e.target.closest("[data-iturl]");
            if (ub) { const f = $("[data-iturlform]", s.el), open = f.hidden; f.hidden = !open; ub.setAttribute("aria-expanded", String(open)); if (open) $("input", f).focus(); return; }
            if (e.target.closest("[data-itdel]")) {
              const n = li.dataset.key, from = li.parentElement, next = li.nextElementSibling, pic = p.pics[n], note = p.notes[n];
              s.close({ silent: true });
              window.TierDrag.flip($$(".st-titem", main), () => li.remove());
              delete p.pics[n]; delete p.notes[n];
              Y.sound("tag-remove"); sync();
              S.toast({ icon: "ph-trash", title: `Removed “${n}”`, text: "from this ranking", undo: () => { if (!from.isConnected) return; window.TierDrag.flip($$(".st-titem", main), () => from.insertBefore(li, next && next.parentElement === from ? next : null)); if (pic) p.pics[n] = pic; if (note) p.notes[n] = note; sync(); } });
            }
          });
          // radio groups: arrow keys move and choose
          s.el.addEventListener("keydown", (e) => {
            const r = e.target.closest("[data-itimg], [data-itzone]"); if (!r || !/^Arrow(Left|Right|Up|Down)$/.test(e.key)) return;
            e.preventDefault();
            const all = $$(r.matches("[data-itimg]") ? "[data-itimg]" : "[data-itzone]", s.el);
            all[(all.indexOf(r) + (/Right|Down/.test(e.key) ? 1 : -1) + all.length) % all.length].click();
          });
          s.el.addEventListener("change", async (e) => {
            const inp = e.target.closest("[data-itup]"); if (!inp?.files?.[0]) return;
            const url = await E.imageData(inp.files[0], 160); inp.value = "";
            if (!url) { Y.sound("nope"); S.toast({ icon: "ph-image-broken", title: "That file didn't work", text: "An SVG under 200 KB, or any PNG / JPG / WebP." }); return; }
            pick(url); Y.sound("token-add");
          });
          s.el.addEventListener("submit", (e) => {
            const f = e.target.closest("[data-iturlform]"); if (!f) return;
            e.preventDefault();
            const inp = $("input", f), u = inp.value.trim();
            if (!/^(https?:\/\/\S+|data:image\/)/i.test(u)) { inp.setAttribute("aria-invalid", "true"); Y.sound("nope", { el: inp }); inp.focus(); return; }
            const im = new Image();
            im.onload = () => { pick(u); f.hidden = true; Y.sound("token-add"); };
            im.onerror = () => { inp.setAttribute("aria-invalid", "true"); Y.sound("nope", { el: inp }); S.toast({ icon: "ph-image-broken", title: "Couldn't load that image", text: "Check the link, or upload the file instead." }); };
            im.src = u;
          });
        },
      });
    };
    // ?demo=add (type "arc") · ?demo=drag (hold an item over tier A)
    if (q.get("demo") === "add") { input.value = "arc"; paintSugs(); }
    if (q.get("demo") === "drag") requestAnimationFrame(() => setTimeout(() => {
      const li = $(`[data-zone="__tray"] .st-titem`, main); const row = $$(".st-tier", main)[1];
      if (!li || !row) return;
      const r = row.getBoundingClientRect();
      window.TierDrag.create; // same module; simulate a held drag for the screenshot
      const d = window.TierDrag.create({ root: document.createElement("div"), layer: S.layer(), itemSel: ".st-titem", enabled: () => true, items: () => $$(".st-titem", main), zones });
      $$(".st-tier", main).forEach((x) => x.classList.remove("is-over")); row.classList.add("is-over");
      d.simulate(li, r.left + r.width * 0.55, r.top + r.height / 2);
    }, 350));
  };
})();
