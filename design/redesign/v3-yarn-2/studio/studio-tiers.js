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
    p.pics ||= {};          // name → image kind ("logo" | "patch" | "wordmark" | "photo" | "screen" | "text")
    p.settings ||= { rank: true, comments: true, community: true };
    const order = () => Object.keys(p.tiers);
    const img = (name) => {
      const k = p.pics[name] || "logo";
      if (k === "text") return `<span class="st-titem__img" style="display:grid;place-items:center;background:var(--cotton-2);font:900 .9rem/1 var(--font-display);padding:4px;text-align:center">${esc(name.slice(0, 10))}</span>`;
      const c = TI().candidates(name).find((x) => x.kind === k) || TI().best(name);
      return `<span class="st-titem__img">${TI().svg(c, name)}</span>`;
    };
    const item = (name, where) => `<li class="st-titem" data-key="${esc(name)}"><button type="button" class="st-titem__btn ysel" aria-pressed="false" aria-label="${esc(name)}, ${where === "__tray" ? "unranked" : `in tier ${esc(where)}`}" aria-describedby="tl-help">${img(name)}<span class="st-titem__name">${esc(name)}</span></button></li>`;
    const tierRow = (t, i) => `<div class="st-tier" data-t="${Math.min(i, 5)}" data-tier="${esc(t)}"><div class="st-tier__lab"><input value="${esc(t)}" maxlength="3" aria-label="Label for tier ${i + 1}" data-tierlab="${esc(t)}"></div><ul class="st-zone" data-zone="${esc(t)}" aria-label="Tier ${esc(t)}">${p.tiers[t].map((n) => item(n, t)).join("")}</ul></div>`;
    const board = () => `<div class="st-tiers" data-tiers>${order().map(tierRow).join("")}</div>`;
    const ranked = () => Object.values(p.tiers).flat().length;
    const form = `
      <div class="st-tl">
        <div class="st-tl__main">
          ${board()}
          <div class="st-tl__rows" style="margin:10px 0 16px"><button type="button" class="btn btn--ghost btn--sm" data-addtier><i class="ph-bold ph-plus" aria-hidden="true"></i><span>Add a tier</span></button><button type="button" class="btn btn--ghost btn--sm" data-rmtier><i class="ph-bold ph-minus" aria-hidden="true"></i><span>Remove the last tier</span></button></div>
          <section class="st-tray" data-tray aria-labelledby="tray-h">
            <div class="st-sec__h"><h2 class="eyebrow" id="tray-h">Unranked <span class="meta" data-trayn>${p.unranked.length}</span></h2><span class="meta st-hide-m">drag into a tier · or tap it, then tap a tier</span></div>
            <ul class="st-zone" data-zone="__tray" aria-label="Unranked">${p.unranked.map((n) => item(n, "__tray")).join("")}</ul>
          </section>
          <p class="sr-only" id="tl-help">Press Space to pick up. Arrow up and down move between tiers, left and right move inside a tier. Number keys send it straight to a tier. Space drops, Escape cancels.</p>
        </div>
        <div class="st-tl__side">
          <section class="patch st-tl__add" aria-labelledby="add-h">
            <h2 id="add-h"><i class="ph-bold ph-plus-circle" aria-hidden="true"></i>Add things</h2>
            <form class="st-field" data-addform style="gap:8px"><label class="sr-only" for="tl-in">Name of a thing to rank</label>
              <div style="display:flex;gap:8px"><input class="st-in" id="tl-in" placeholder="Type a name: arc, zen…" autocomplete="off" enterkeyhint="done" data-tlin><button type="submit" class="btn btn--red btn--icon" style="flex:none" aria-label="Add it with the first image"><i class="ph-bold ph-arrow-elbow-down-left" aria-hidden="true"></i></button></div>
              <p class="st-hint">Enter adds it with the first image. Paste <b>Arc, Zen, Firefox</b> to add several.</p></form>
            <div class="st-sugs" data-sugs role="listbox" aria-label="Suggestions"></div>
            <div data-imgs></div>
          </section>
          <section class="patch st-tl__add st-tl__set" aria-labelledby="vis-h">
            <h2 id="vis-h"><i class="ph-bold ph-users-three" aria-hidden="true"></i>On the public page</h2>
            <p class="st-note">Only you make tier lists. Visitors get your ranking, then can add theirs.</p>
            ${S.f.toggle(p, "settings.rank", { label: "Visitors can rank it too", text: "They drag their own order; nobody can edit yours." })}
            ${S.f.toggle(p, "settings.community", { label: "Show everyone's average", text: "A small bar under each item, after they've ranked." })}
            ${S.f.toggle(p, "settings.comments", { label: "Comments", text: "A thread under the list. You can hide any comment." })}
          </section>
        </div>
      </div>`;
    view.innerHTML = E.shell({ section: "thoughts", item: p, back: { href: S.href("list", { section: "thoughts" }), label: "Thoughts" }, titlePath: "title", titlePH: "Name your tier list", headExtra: `${typeChips}<div class="st-shows" style="margin-top:10px" data-tlmeta></div>`, form, wide: true });
    const paintMeta = () => { $("[data-tlmeta]", view).innerHTML = `<span class="meta">${ranked()} ranked · ${p.unranked.length} unranked</span>${Y.tags(p.tags || [])}<span class="meta">${p.settings.rank ? "visitors rank" : "view only"} · ${p.settings.comments ? "comments on" : "no comments"}</span>`; $("[data-trayn]", view).textContent = p.unranked.length; };
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
      $$(".st-titem", main).forEach((li) => { const z = li.parentElement.dataset.zone; $(".st-titem__btn", li).setAttribute("aria-label", `${li.dataset.key}, ${z === "__tray" ? "unranked" : `in tier ${z}`}`); });
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
      root: main, layer: $("#st-layer"), itemSel: ".st-titem", enabled: () => true,
      items: () => $$(".st-titem", main), zones,
      onStart: (li) => { setSel(null); Y.sound("pickup", { el: li }); },
      onOver: (z) => { $$(".st-tier, .st-tray", main).forEach((r) => r.classList.remove("is-over")); if (z) (z.closest(".st-tier") || z.closest(".st-tray"))?.classList.add("is-over"); },
      onDrop: (li, info) => { Y.sound("drop", { el: li, rate: rate(li.parentElement) }); sync(); if (info.to.zone !== info.from.zone) S.say(`${li.dataset.key} moved to ${li.parentElement.dataset.zone === "__tray" ? "unranked" : `tier ${li.parentElement.dataset.zone}`}`); },
      onTap: (li) => { if (sel === li) { setSel(null); Y.sound("chip-off", { el: li }); } else { setSel(li); Y.sound("pickup", { el: li }); S.say(`${li.dataset.key} picked. Tap a tier to move it.`); } },
    });
    // tap a row while something is picked → move it there
    main.addEventListener("click", (e) => {
      if (!sel || e.target.closest(".st-titem") || e.target.closest("input")) return;
      const row = e.target.closest(".st-tier, .st-tray"); if (!row) return;
      const z = $(".st-zone", row);
      window.TierDrag.flip($$(".st-titem", main), () => z.appendChild(sel));
      Y.sound("drop", { el: sel, rate: rate(z) });
      setSel(null); sync();
    });
    // keyboard: Space picks up / drops, ↑↓ between tiers, ←→ inside, 1–6 straight to a tier, Esc cancels
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
      const zs = zones().map((z) => z.zone);
      const move = (fn) => { window.TierDrag.flip($$(".st-titem", main), fn); $(".st-titem__btn", li).focus(); };
      if (/^[1-6]$/.test(e.key) && zs[+e.key - 1] && zs[+e.key - 1].dataset.zone !== "__tray") { e.preventDefault(); move(() => zs[+e.key - 1].appendChild(li)); Y.sound("drop", { el: li, rate: rate(zs[+e.key - 1]) }); if (held) { held = null; setSel(null); } sync(); return; }
      if (!held || held.li !== li) return;
      const zi = zs.indexOf(li.parentElement);
      if (e.key === "ArrowUp" || e.key === "ArrowDown") { e.preventDefault(); const nz = zs[zi + (e.key === "ArrowUp" ? -1 : 1)]; if (!nz) return Y.sound("nope"); move(() => nz.appendChild(li)); S.say(nz.dataset.zone === "__tray" ? "Unranked" : `Tier ${nz.dataset.zone}`); }
      else if (e.key === "ArrowLeft" && li.previousElementSibling) { e.preventDefault(); move(() => li.parentElement.insertBefore(li, li.previousElementSibling)); }
      else if (e.key === "ArrowRight" && li.nextElementSibling) { e.preventDefault(); move(() => li.parentElement.insertBefore(li, li.nextElementSibling.nextElementSibling)); }
      else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); const h = held; held = null; setSel(null); move(() => h.from.insertBefore(h.li, h.next && h.next.parentElement === h.from ? h.next : null)); S.say("Cancelled"); }
    });
    // tier labels
    main.addEventListener("change", (e) => {
      const inp = e.target.closest("[data-tierlab]"); if (!inp) return;
      const old = inp.dataset.tierlab, nu = inp.value.trim().slice(0, 3) || old;
      if (nu === old || p.tiers[nu]) { inp.value = old; if (p.tiers[nu] && nu !== old) Y.sound("nope"); return; }
      p.tiers = Object.fromEntries(Object.entries(p.tiers).map(([k, v]) => [k === old ? nu : k, v]));
      inp.dataset.tierlab = nu; inp.closest(".st-tier").dataset.tier = nu; $(".st-zone", inp.closest(".st-tier")).dataset.zone = nu;
      E.changed("tiers");
    });
    const repaintBoard = () => { $("[data-tiers]", main).outerHTML = board(); };
    view.addEventListener("click", (e) => {
      if (e.target.closest("[data-addtier]")) {
        const names = ["S", "A", "B", "C", "D", "E", "F"]; const nu = names.find((n) => !p.tiers[n]) || `T${order().length + 1}`;
        if (order().length >= 6) { Y.sound("nope"); S.toast({ icon: "ph-hand-palm", tone: "error", title: "Six tiers is the limit", text: "Past that nobody reads the bottom." }); return; }
        p.tiers[nu] = []; window.TierDrag.flip($$(".st-titem, .st-tray", main), repaintBoard); Y.sound("token-add"); E.changed("tiers"); return;
      }
      if (e.target.closest("[data-rmtier]")) {
        const ks = order(); if (ks.length <= 2) { Y.sound("nope"); return; }
        const last = ks[ks.length - 1]; p.unranked.push(...p.tiers[last]); delete p.tiers[last];
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
    // ?demo=add (type "arc") · ?demo=drag (hold an item over tier A)
    if (q.get("demo") === "add") { input.value = "arc"; paintSugs(); }
    if (q.get("demo") === "drag") requestAnimationFrame(() => setTimeout(() => {
      const li = $(`[data-zone="__tray"] .st-titem`, main); const row = $(`[data-tier="A"]`, main);
      if (!li || !row) return;
      const r = row.getBoundingClientRect();
      window.TierDrag.create; // same module; simulate a held drag for the screenshot
      const d = window.TierDrag.create({ root: document.createElement("div"), layer: $("#st-layer"), itemSel: ".st-titem", enabled: () => true, items: () => $$(".st-titem", main), zones });
      $$(".st-tier", main).forEach((x) => x.classList.remove("is-over")); row.classList.add("is-over");
      d.simulate(li, r.left + r.width * 0.55, r.top + r.height / 2);
    }, 350));
  };
})();
