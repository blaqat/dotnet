/* ============================================================
   blaqat.net · round 3 · Music page
   ?lib=swatch  (default) collections as knit swatch cards with sewn-in
                track labels + a dense singles table
   ?lib=ledger  one chronological ledger by year; collections are
                skein rows with label chips; singles are rows with notes
   ?i=piano,daw  ?s=wip,dropped  ?q=text   filters (none = all)
   ?open=<collection-id>   that collection opened in place
   ?sort=date|name|len&dir=asc|desc        singles table order
   player params are read by kit/player.js (?demo ?player= ?pmode= ?ios=)
   ============================================================ */
(() => {
  const P = window.YarnPlayer;
  if (!P) return;
  const { INST, STATUS, YARN, dates, md, fmt, esc } = P.meta;
  const params = new URLSearchParams(location.search);
  // ?lib= wins; otherwise the swatch book on desktop and the denser ledger under 960px
  const narrow = matchMedia("(max-width: 959px)");
  const libFor = () => (params.get("lib") === "ledger" || params.get("lib") === "swatch" ? params.get("lib") : narrow.matches ? "ledger" : "swatch");
  let LIBOPT = libFor();
  const reduced = () => (window.Yarn?.reduced ? Yarn.reduced() : matchMedia("(prefers-reduced-motion: reduce)").matches);

  const L = P.library;
  const singles = L.entries.filter((e) => e.kind === "track");
  const colls = L.entries.filter((e) => e.kind === "collection");
  const tracks = L.tracks;

  const $ = (s, r = document) => r.querySelector(s);
  const lib = $("#lib");

  /* ---------------- state ---------------- */
  const list = (k) => new Set((params.get(k) || "").split(",").map((x) => x.trim()).filter(Boolean));
  const F = { inst: list("i"), st: list("s"), q: params.get("q") || "" };
  let openId = params.get("open") || null;
  const sort = { key: params.get("sort") || "date", dir: params.get("dir") || "desc" };

  const MONTHS = "janfebmaraprmayjunjulaugsepoctnovdec";
  const ym = (s) => { const m = String(s || "").match(/([A-Za-z]{3})[a-z]*\.?\s+(\d{4})/); return m ? +m[2] * 12 + MONTHS.indexOf(m[1].toLowerCase()) / 3 : 0; };
  const year = (s) => (String(s || "").match(/\d{4}/) || [""])[0];
  const norm = (s) => String(s || "").toLowerCase();
  const plain = (s) => String(s || "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[*#>`_]/g, "").replace(/\s+/g, " ").trim();
  const two = (n) => String(n).padStart(2, "0");
  const bare = (name) => String(name).replace(/^\d{1,2}\s*[-.]\s*/, "");

  /* ---------------- filtering ---------------- */
  const facetOK = (t) => (!F.inst.size || F.inst.has(t.instrument)) && (!F.st.size || F.st.has(t.status));
  const qOK = (t, q) => !q || norm(t.name).includes(q) || norm(t.description).includes(q) || norm(t.collection).includes(q);
  const match = (t) => facetOK(t) && qOK(t, norm(F.q));
  const collView = (c) => {
    const q = norm(F.q), nameHit = !!q && norm(c.name).includes(q);
    const hits = c.tracks.filter((t) => facetOK(t) && (nameHit || qOK(t, q)));
    return { show: hits.length > 0, hits: new Set(hits) };
  };

  /* ---------------- tiny renderers ---------------- */
  const EQ = `<span class="eq" aria-hidden="true"><i></i><i></i><i></i></span>`;
  const inst = (i) => `<span class="in"><span class="dot" style="--c:${(YARN[i] || YARN.other).base}"></span>${esc(INST[i] || i)}</span>`;
  const st = (s) => { const [ic, label] = STATUS[s] || ["complete", s]; return `<span class="st st--${esc(s)}">${P.icon(ic)}<span>${esc(label)}</span></span>`; };
  const linkPill = (k, u) => {
    const m = P.meta.LINKS[k]; if (!m) return "";
    return `<a class="pill" href="${esc(u)}" target="_blank" rel="noopener">${P.icon(m[0])}<span>${m[1]}</span></a>`;
  };
  const noAudio = (t) => (!t.url ? ` aria-disabled="true" title="No audio file for this one"` : "");

  /* ---------------- header + filters ---------------- */
  function renderHead() {
    const playable = tracks.filter((t) => t.url).length;
    const yrs = tracks.map((t) => +year(t.start)).filter(Boolean);
    $("#mu-stats").innerHTML = `${tracks.length} tracks · ${colls.length} collections · ${singles.length} singles<span class="wide"> · ${Math.min(...yrs)}–${Math.max(...yrs)} · ${playable} with audio</span>`;
  }
  function renderFilters() {
    const cnt = (k, v) => tracks.filter((t) => t[k] === v).length;
    const chip = (group, v, label, extra = "") =>
      `<button class="chip" type="button" data-f="${group}" data-v="${v}" aria-pressed="${F[group].has(v)}">${extra}${esc(label)}<span class="ct">${cnt(group === "inst" ? "instrument" : "status", v)}</span></button>`;
    const any = F.inst.size || F.st.size || F.q;
    $("#mu-filters").innerHTML = `
      <div class="fg" role="group" aria-label="Instrument">
        <span class="fl" aria-hidden="true">Instrument</span>
        ${["piano", "daw", "beepbox"].map((v) => chip("inst", v, INST[v], `<span class="dot" style="--c:${YARN[v].base}"></span>`)).join("")}
      </div>
      <div class="fg" role="group" aria-label="Status">
        <span class="fl" aria-hidden="true">Status</span>
        ${["complete", "wip", "dropped"].map((v) => chip("st", v, STATUS[v][1], P.icon(STATUS[v][0]))).join("")}
      </div>
      <button class="chip chip--all" type="button" data-reset aria-pressed="${!any}">Show all</button>
      <label class="find"><i class="ph ph-magnifying-glass" aria-hidden="true"></i><span class="sr-only">Find a track</span>
        <input type="search" id="find" placeholder="Find a track" value="${esc(F.q)}" autocomplete="off" spellcheck="false"></label>
      <p class="fcount meta" id="fcount" aria-live="polite"></p>`;
  }
  function syncURL() {
    const u = new URL(location.href);
    const set = (k, v) => (v ? u.searchParams.set(k, v) : u.searchParams.delete(k));
    set("i", [...F.inst].join(","));
    set("s", [...F.st].join(","));
    set("q", F.q);
    set("open", openId || "");
    set("sort", sort.key === "date" && sort.dir === "desc" ? "" : sort.key);
    set("dir", sort.key === "date" && sort.dir === "desc" ? "" : sort.dir);
    history.replaceState(null, "", u);
  }

  /* ---------------- shared bits ---------------- */
  function sortedSingles() {
    const k = sort.key, d = sort.dir === "asc" ? 1 : -1;
    const val = (t) => (k === "name" ? norm(t.name) : k === "len" ? P.durationOf(t) : ym(t.start) * 100 + (ym(t.end) || 0) / 1e4);
    return singles.filter(match).sort((a, b) => (val(a) > val(b) ? d : val(a) < val(b) ? -d : 0));
  }
  function collectionMore(c) {
    const links = [...new Set(c.tracks.flatMap((t) => Object.entries(t.links || {}).filter(([k]) => k === "soundcloud").map(([, u]) => u.split("?")[0].replace(/\/[^/]+$/, "")).filter((u) => /soundcloud\.com\/[^/]+$/.test(u))))].slice(0, 1);
    return `
      <div class="notes">${c.description ? md(c.description) : `<p class="muted">No notes for this collection yet.</p>`}</div>
      <div class="more-cta">
        <button class="btn btn--red btn--sm" type="button" data-play-coll="${c.id}"><i class="ph-fill ph-play" aria-hidden="true"></i>Play all ${c.tracks.filter((t) => t.url).length}</button>
        <button class="btn btn--sm" type="button" data-shuffle-coll="${c.id}"><i class="ph-bold ph-shuffle" aria-hidden="true"></i>Shuffle</button>
        ${links.map((u) => `<a class="pill" href="${esc(u)}" target="_blank" rel="noopener">${P.icon("cloud")}<span>On SoundCloud</span></a>`).join("")}
      </div>`;
  }
  function trackExtra(t) {
    const bits = [];
    if (dates(t)) bits.push(`<span class="x-date">${esc(dates(t))}</span>`);
    if (t.status !== "complete") bits.push(st(t.status));
    if (!t.url) bits.push(`<span class="x-na">no audio</span>`);
    Object.entries(t.links || {}).forEach(([k, u]) => bits.push(linkPill(k, u)));
    const d = plain(t.description);
    return `<div class="lbl-x">${bits.join("")}${d ? `<p class="x-desc">${esc(d.length > 180 ? d.slice(0, 178) + "…" : d)}</p>` : ""}</div>`;
  }

  /* ============================================================
     OPTION A · SWATCH BOOK
     ============================================================ */
  function swatchBook() {
    const cards = colls.map((c) => {
      const v = collView(c);
      if (!v.show) return "";
      const open = openId === c.id;
      const playable = c.tracks.filter((t) => t.url).length;
      const labels = c.tracks.map((t, i) => {
        const dim = v.hits.has(t) ? "" : " is-dim";
        return `<li class="li${dim}"><button class="lbl" type="button" data-track="${esc(t.id)}"${noAudio(t)} aria-label="${esc(t.name)}, track ${i + 1}${t.url ? ", " + fmt(P.durationOf(t)) : ", no audio"}${t.status === "dropped" ? ", dropped" : ""}">` +
          `<span class="lbl-n"><span class="n">${two(i + 1)}</span>${EQ}</span>` +
          `<span class="lbl-t">${esc(bare(t.name))}${t.status === "dropped" ? `<span class="cut" title="Dropped">${P.icon("dropped")}</span>` : ""}</span>` +
          `<span class="lbl-d">${t.url ? fmt(P.durationOf(t)) : "—"}</span></button>${trackExtra(t)}</li>`;
      }).join("");
      return `
      <article class="cc${open ? " is-open" : ""}" id="c-${c.id}" data-coll="${c.id}" aria-labelledby="cn-${c.id}" style="view-transition-name:cc-${c.id}">
        <div class="cc-cloth" data-cloth="${c.id}" aria-hidden="true"></div>
        <div class="cc-body">
          <header class="cc-head">
            <div class="cc-tt">
              <h3 class="cc-name" id="cn-${c.id}">${esc(c.name)}</h3>
              <p class="cc-meta">${inst(c.instrument)}<span>${esc(year(c.start))}${c.end && year(c.end) !== year(c.start) ? "–" + esc(year(c.end).slice(2)) : ""}</span><span>${c.tracks.length} tracks</span>${c.status !== "complete" ? st(c.status) : ""}</p>
            </div>
            <button class="cc-play" type="button" data-play-coll="${c.id}" aria-label="Play ${esc(c.name)}"${playable ? "" : " disabled"}><i class="ph-fill ph-play i-play" aria-hidden="true"></i><i class="ph-fill ph-pause i-pause" aria-hidden="true"></i></button>
          </header>
          <ol class="labels">${labels}</ol>
          <div class="cc-more" id="cm-${c.id}"${open ? "" : " hidden"}>${collectionMore(c)}</div>
          <footer class="cc-foot">
            <span class="cc-now" aria-hidden="true"></span>
            <button class="cc-open" type="button" data-open="${c.id}" aria-expanded="${open}" aria-controls="cm-${c.id}">
              <span class="o-l">${open ? "Fold up" : "Notes & details"}</span><i class="ph-bold ph-caret-down" aria-hidden="true"></i></button>
          </footer>
        </div>
      </article>`;
    }).join("");
    const rows = sortedSingles();
    const th = (key, label, cls = "") => {
      const on = sort.key === key;
      return `<th scope="col" class="${cls}"${on ? ` aria-sort="${sort.dir === "asc" ? "ascending" : "descending"}"` : ""}><button type="button" class="th-b" data-sort="${key}">${label}<i class="ph-bold ${on ? (sort.dir === "asc" ? "ph-arrow-up" : "ph-arrow-down") : "ph-arrows-down-up"}" aria-hidden="true"></i></button></th>`;
    };
    const body = rows.map((t) =>
      `<tr class="tr" data-row="${esc(t.id)}">
        <td class="c-t"><button class="tr-b" type="button" data-track="${esc(t.id)}"${noAudio(t)}>
          <span class="thumb"><span class="sw" data-sw="${esc(t.id)}"></span>${EQ}</span>
          <span class="tr-tt"><span class="tr-name">${esc(t.name)}</span><span class="tr-meta">${esc(INST[t.instrument])} · ${esc(year(t.start))}${t.status !== "complete" ? " · " + esc(STATUS[t.status]?.[1] || t.status) : ""}</span></span></button></td>
        <td class="c-i">${inst(t.instrument)}</td>
        <td class="c-y" title="${esc(dates(t))}">${esc(t.start || "")}</td>
        <td class="c-s">${st(t.status)}</td>
        <td class="c-d">${t.url ? fmt(P.durationOf(t)) : "—"}</td>
      </tr>`).join("");
    const nColl = colls.filter((c) => collView(c).show).length;
    return `
      <section class="sec sec--coll" aria-labelledby="h-coll">
        <h2 class="sec-h" id="h-coll">Collections <small>${nColl}</small></h2>
        ${nColl ? `<div class="cgrid">${cards}</div>` : `<p class="none">No collections match.</p>`}
      </section>
      <section class="sec sec--singles" aria-labelledby="h-sing" style="view-transition-name:singles">
        <h2 class="sec-h" id="h-sing">Singles <small>${rows.length}</small></h2>
        ${rows.length ? `<div class="tl-wrap"><table class="tl">
          <caption class="sr-only">Singles. Activate a title to play it.</caption>
          <thead><tr>${th("name", "Title", "c-t")}<th scope="col" class="c-i">Instrument</th>${th("date", "Made", "c-y")}<th scope="col" class="c-s">Status</th>${th("len", "Length", "c-d")}</tr></thead>
          <tbody>${body}</tbody></table></div>` : `<p class="none">No singles match.</p>`}
      </section>`;
  }

  /* ============================================================
     OPTION B · LEDGER (by year, collections as skein rows)
     ============================================================ */
  function ledger() {
    const items = [];
    colls.forEach((c) => { const v = collView(c); if (v.show) items.push({ kind: "c", c, v, at: ym(c.start) }); });
    singles.filter(match).forEach((t) => items.push({ kind: "t", t, at: ym(t.start) }));
    items.sort((a, b) => b.at - a.at);
    const groups = new Map();
    items.forEach((it) => { const y = year(it.kind === "c" ? it.c.start : it.t.start) || "Undated"; if (!groups.has(y)) groups.set(y, []); groups.get(y).push(it); });
    const row = (t, { child = false, dim = false, n } = {}) => {
      const d = plain(t.description);
      return `<li class="lr${child ? " lr--child" : ""}${dim ? " is-dim" : ""}"><button class="lr-b" type="button" data-track="${esc(t.id)}"${noAudio(t)}>
        <span class="thumb">${n ? `<span class="lr-n">${two(n)}</span>` : `<span class="sw" data-sw="${esc(t.id)}"></span>`}${EQ}</span>
        <span class="lr-tt"><span class="lr-name">${esc(child ? bare(t.name) : t.name)}</span>${d ? `<span class="lr-desc">${esc(d)}</span>` : `<span class="lr-desc lr-desc--date">${esc(dates(t))}</span>`}</span>
        ${child ? "" : `<span class="lr-in">${inst(t.instrument)}</span>`}
        <span class="lr-st">${st(t.status)}</span>
        <span class="lr-d">${t.url ? fmt(P.durationOf(t)) : "—"}</span></button>
        ${child && Object.keys(t.links || {}).length ? `<div class="lr-links">${Object.entries(t.links).map(([k, u]) => linkPill(k, u)).join("")}</div>` : ""}</li>`;
    };
    const coll = ({ c, v }) => {
      const open = openId === c.id;
      const chips = c.tracks.map((t, i) => `<li class="${v.hits.has(t) ? "" : "is-dim"}"><button class="tab" type="button" data-track="${esc(t.id)}"${noAudio(t)}><span class="tab-n"><span class="n">${two(i + 1)}</span>${EQ}</span><span class="tab-t">${esc(bare(t.name))}</span></button></li>`).join("");
      return `<li class="lc${open ? " is-open" : ""}" id="c-${c.id}" data-coll="${c.id}" style="view-transition-name:lc-${c.id}">
        <div class="lc-cloth" data-cloth="${c.id}" data-cloth-kind="tall" aria-hidden="true"></div>
        <div class="lc-main">
          <div class="lc-head">
            <div class="lc-tt"><h3 class="lc-name" id="cn-${c.id}">${esc(c.name)}</h3>
              <p class="lc-meta">${inst(c.instrument)}<span>${c.tracks.length} tracks</span><span class="lc-dates">${esc(dates(c))}</span>${st(c.status)}</p></div>
            <button class="cc-play" type="button" data-play-coll="${c.id}" aria-label="Play ${esc(c.name)}"><i class="ph-fill ph-play i-play" aria-hidden="true"></i><i class="ph-fill ph-pause i-pause" aria-hidden="true"></i></button>
            <button class="lc-open" type="button" data-open="${c.id}" aria-expanded="${open}" aria-controls="lm-${c.id}" aria-label="${open ? "Fold up" : "Open"} ${esc(c.name)}"><i class="ph-bold ph-caret-down" aria-hidden="true"></i></button>
          </div>
          <ol class="tabs" aria-label="Tracks in ${esc(c.name)}">${chips}</ol>
          <div class="lc-more" id="lm-${c.id}"${open ? "" : " hidden"}>
            ${collectionMore(c)}
            <ol class="lc-rows" style="--c:${(YARN[c.instrument] || YARN.other).base}">${c.tracks.map((t, i) => row(t, { child: true, dim: !v.hits.has(t), n: i + 1 })).join("")}</ol>
          </div>
        </div></li>`;
    };
    let html = "";
    groups.forEach((its, y) => {
      html += `<section class="yr" aria-labelledby="y-${y}"><h2 class="yr-h" id="y-${y}"><span class="yr-y">${y}</span><small>${its.length} ${its.length === 1 ? "entry" : "entries"}</small></h2>
        <ul class="lg">${its.map((it) => (it.kind === "c" ? coll(it) : row(it.t))).join("")}</ul></section>`;
    });
    return html;
  }

  /* ---------------- render + swatches + now-playing marks ---------------- */
  function applySwatches(root = lib) {
    root.querySelectorAll("[data-sw]").forEach((el) => { const t = P.resolve(el.dataset.sw); if (t) el.style.backgroundImage = `url("${P.swatch(t)}")`; });
    root.querySelectorAll("[data-cloth]").forEach((el) => {
      const c = L.collections.get(el.dataset.cloth); if (!c) return;
      const tall = el.dataset.clothKind === "tall";
      el.style.backgroundImage = `url("${P.swatch({ id: "cloth:" + c.id, instrument: c.instrument }, tall ? { cols: 7, rows: 14, seed: "cloth:" + c.id } : { cols: 34, rows: 6, kind: "fairisle", seed: "cloth:" + c.id })}")`;
    });
  }
  function renderLib() {
    lib.className = `lib lib--${LIBOPT}`;
    lib.innerHTML = LIBOPT === "ledger" ? ledger() : swatchBook();
    applySwatches();
    markCurrent(P.state);
    const nT = tracks.filter((t) => match(t) || (t.collectionId && collView(L.collections.get(t.collectionId)).hits.has(t))).length;
    const any = F.inst.size || F.st.size || F.q;
    $("#fcount").textContent = any ? `${nT} of ${tracks.length} tracks` : `${tracks.length} tracks`;
    $("#mu-empty").hidden = !!lib.querySelector("[data-track]");
  }

  function markCurrent(s) {
    const id = s?.track?.id;
    lib.querySelectorAll(".is-current").forEach((el) => { el.classList.remove("is-current"); el.removeAttribute("aria-current"); });
    lib.querySelectorAll(".has-current").forEach((el) => el.classList.remove("has-current"));
    lib.classList.toggle("is-playing", !!s?.playing);
    if (!id) return;
    lib.querySelectorAll(`[data-track="${CSS.escape(id)}"]`).forEach((el) => {
      el.classList.add("is-current");
      el.setAttribute("aria-current", "true");
      el.closest("tr,.lr,.li")?.classList.add("is-current");
      const box = el.closest(".cc,.lc");
      if (box) {
        box.classList.add("has-current");
        const now = box.querySelector(".cc-now");
        if (now) now.innerHTML = `${EQ}<span>${s.playing ? "Playing" : "Paused on"} ${two(s.track.index)}</span>`;
      }
    });
    lib.querySelectorAll(".cc:not(.has-current) .cc-now").forEach((el) => { el.innerHTML = ""; });
    const pa = $("#play-all");
    if (pa) pa.querySelector("span").textContent = "Play all";
  }

  /* ---------------- open in place ---------------- */
  function setOpen(id, { scroll = false, focus = true } = {}) {
    const apply = () => {
      openId = id;
      lib.querySelectorAll(".cc,.lc").forEach((box) => {
        const on = box.dataset.coll === id;
        box.classList.toggle("is-open", on);
        const more = box.querySelector(".cc-more,.lc-more");
        if (more) more.hidden = !on;
        const b = box.querySelector("[data-open]");
        if (b) {
          b.setAttribute("aria-expanded", String(on));
          const l = b.querySelector(".o-l"); if (l) l.textContent = on ? "Fold up" : "Notes & details";
          if (b.classList.contains("lc-open")) b.setAttribute("aria-label", `${on ? "Fold up" : "Open"} ${L.collections.get(box.dataset.coll)?.name || ""}`);
        }
      });
      syncURL();
    };
    const vt = document.startViewTransition && !reduced() ? document.startViewTransition(apply) : (apply(), null);
    const after = () => {
      const box = id && document.getElementById("c-" + id);
      if (scroll && box) box.scrollIntoView({ block: "nearest", behavior: reduced() ? "auto" : "smooth" });
      if (focus && box) box.querySelector("[data-open]")?.focus({ preventScroll: true });
    };
    vt ? vt.finished.then(after, after) : after();
  }

  /* ---------------- playing ---------------- */
  const burst = (el) => { if (!reduced()) window.Notes?.burst?.(el, "music"); };
  const visibleQueue = () => [...lib.querySelectorAll("[data-track]")].map((b) => P.resolve(b.dataset.track)).filter((t, i, a) => t && t.url && a.indexOf(t) === i);
  function playTrack(t) {
    const s = P.state;
    if (s.track && s.track.id === t.id) return P.toggle();
    if (t.collectionId) return P.play(t, L.collections.get(t.collectionId).tracks);
    const order = LIBOPT === "ledger" ? visibleQueue().filter((x) => !x.collectionId) : sortedSingles();
    return P.play(t, order);
  }
  function playColl(id, btn, shuffle = false) {
    const c = L.collections.get(id); if (!c) return;
    const ok = c.tracks.filter((t) => t.url);
    const s = P.state;
    if (!shuffle && s.track && s.track.collectionId === id) return P.toggle();
    P.setShuffle(shuffle);
    const first = shuffle ? ok[Math.floor(Math.random() * ok.length)] : ok[0];
    if (first) { P.play(first, c.tracks); burst(btn); }
  }

  /* ---------------- events ---------------- */
  lib.addEventListener("click", (e) => {
    const t = e.target.closest("[data-track]");
    if (t) { if (t.getAttribute("aria-disabled") === "true") return; const tr = P.resolve(t.dataset.track); if (tr) playTrack(tr); return; }
    const pc = e.target.closest("[data-play-coll]");
    if (pc) return playColl(pc.dataset.playColl, pc);
    const sc = e.target.closest("[data-shuffle-coll]");
    if (sc) return playColl(sc.dataset.shuffleColl, sc, true);
    const o = e.target.closest("[data-open]");
    if (o) return setOpen(openId === o.dataset.open ? null : o.dataset.open);
    const so = e.target.closest("[data-sort]");
    if (so) {
      const k = so.dataset.sort;
      if (sort.key === k) sort.dir = sort.dir === "asc" ? "desc" : "asc";
      else { sort.key = k; sort.dir = k === "name" ? "asc" : "desc"; }
      renderLib(); syncURL();
      lib.querySelector(`[data-sort="${k}"]`)?.focus();
    }
  });
  // whole table row is a target for pointer users; the button stays the accessible control
  lib.addEventListener("click", (e) => {
    const tr = e.target.closest("tr.tr");
    if (!tr || e.target.closest("button,a")) return;
    tr.querySelector("[data-track]")?.click();
  });

  const filters = $("#mu-filters");
  filters.addEventListener("click", (e) => {
    const c = e.target.closest("[data-f]");
    if (c) {
      const set = F[c.dataset.f], v = c.dataset.v;
      set.has(v) ? set.delete(v) : set.add(v); // none = all; first tap solos; more taps add; tap again removes
      return refresh(c);
    }
    if (e.target.closest("[data-reset]")) { F.inst.clear(); F.st.clear(); F.q = ""; refresh(e.target.closest("[data-reset]")); }
  });
  filters.addEventListener("input", (e) => {
    if (e.target.id !== "find") return;
    F.q = e.target.value.trim();
    clearTimeout(filters._t);
    filters._t = setTimeout(() => { renderLib(); syncURL(); updateChips(); }, 120);
  });
  $("#mu-empty").addEventListener("click", (e) => { if (e.target.closest("[data-reset]")) { F.inst.clear(); F.st.clear(); F.q = ""; refresh(); } });
  function updateChips() {
    filters.querySelectorAll("[data-f]").forEach((b) => b.setAttribute("aria-pressed", String(F[b.dataset.f].has(b.dataset.v))));
    filters.querySelector("[data-reset]").setAttribute("aria-pressed", String(!(F.inst.size || F.st.size || F.q)));
    const f = $("#find"); if (f && f.value !== F.q && document.activeElement !== f) f.value = F.q;
  }
  function refresh() {
    updateChips();
    const apply = () => { renderLib(); syncURL(); };
    document.startViewTransition && !reduced() ? document.startViewTransition(apply) : apply();
  }

  $("#play-all").addEventListener("click", (e) => {
    const q = visibleQueue(); if (!q.length) return;
    P.setShuffle(false); P.play(q[0], q); burst(e.currentTarget);
  });
  $("#shuffle-all").addEventListener("click", (e) => {
    const q = visibleQueue(); if (!q.length) return;
    P.setShuffle(true); P.play(q[Math.floor(Math.random() * q.length)], q); burst(e.currentTarget);
  });

  window.addEventListener("yarnplayer", (e) => { if (e.detail.kind !== "time" && e.detail.kind !== "volume") markCurrent(e.detail); });
  // the player's collection link opens the collection here, in place
  window.addEventListener("yarnplayer:collection", (e) => {
    if (!L.collections.has(e.detail.id)) return;
    e.preventDefault();
    if (!lib.querySelector(`#c-${CSS.escape(e.detail.id)}`)) { F.inst.clear(); F.st.clear(); F.q = ""; updateChips(); renderLib(); }
    setOpen(e.detail.id, { scroll: true });
  });

  narrow.addEventListener("change", () => { const n = libFor(); if (n !== LIBOPT) { LIBOPT = n; renderLib(); } });

  /* ---------------- boot ---------------- */
  renderHead();
  renderFilters();
  renderLib();
  if (openId && document.getElementById("c-" + openId)) {
    requestAnimationFrame(() => {
      const box = document.getElementById("c-" + openId);
      if (box && box.getBoundingClientRect().top > innerHeight * 0.7) box.scrollIntoView({ block: "start" });
    });
  }

  window.Yarn?.mockPanel([
    { label: "Library", param: "lib", options: [["swatch", "Swatch book"], ["ledger", "Ledger"]], default: LIBOPT },
    { label: "Player · desktop", param: "pmode", options: [["float", "Panel over bar"], ["dock", "Dock column"]], default: "float" },
    { label: "Player · state", param: "player", options: [["mini", "Mini"], ["expanded", "Expanded"]], default: "mini" },
    { label: "Demo playback", param: "demo", options: [["", "On (combat 1:12)"], ["0", "Off"]], default: "0" },
    { label: "Collection", param: "open", options: [["", "All folded"], ["vgm-class-final-project", "Open VGM"], ["aikisus-shorts", "Open aikisu"]], default: "" },
    { label: "Volume UI", param: "ios", options: [["0", "Slider"], ["1", "iOS (mute only)"]], default: "0" },
    { label: "Mobile nav", param: "nav", options: [["corduroy", "Corduroy"], ["suede", "Suede"], ["cork", "Cork"], ["burlap", "Burlap"]], default: "corduroy" },
  ]);
})();
