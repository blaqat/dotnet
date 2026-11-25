/* ============================================================
   Tier list maker · app (mock)
   Modes: edit (new list / remix of a post) and view (post with
   Mine · Everyone · You vs everyone). Same markup in both skins.
   URL: ?skin=yarn|ethereal  ?from=tl1|draft  ?tab=mine|everyone|diff
        ?state=editing|dragging|results  ?q=arc  ?agg=mode|mean  ?reduced
   ============================================================ */
(() => {
  const params = new URLSearchParams(location.search);
  const SKIN = params.get("skin") === "ethereal" ? "ethereal" : "yarn";
  const STATE = params.get("state") || "";
  const FROZEN = ["editing", "dragging", "results"].includes(STATE);
  const TIERS = ["S", "A", "B", "C", "D"];
  const ZONES = [...TIERS, "tray"];
  const ZNAME = { S: "S tier", A: "A tier", B: "B tier", C: "C tier", D: "D tier", tray: "Unranked" };
  const OWNER = "blaqat";
  const FEED = SKIN === "ethereal" ? "ethereal.html" : "stitched.html";
  const POST = window.THOUGHTS.posts.find((p) => p.id === "tl1");
  const { Springs, flip, lift, center } = window.TierDrag;
  const TI = window.TierImages;
  const reduced = () => window.Yarn.reduced();
  const app = document.getElementById("tl");
  const layer = document.getElementById("tl-layer");
  const live = document.getElementById("tl-live");
  const mobile = matchMedia("(max-width: 959px)");

  const $ = (s, r = app) => r.querySelector(s);
  const $$ = (s, r = app) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const norm = (s) => String(s || "").trim().toLowerCase();
  const cat = (cls = "") => window.Yarn.catSVG(cls, "currentColor");
  const emptyPlace = () => ({ S: [], A: [], B: [], C: [], D: [], tray: [] });
  const clone = (o) => JSON.parse(JSON.stringify(o));

  // ------------------------------------------------------------ storage (never throws; frozen states never write)
  const K = { draft: "tl:draft", post: "tl:post", vote: "tl:vote:tl1", remix: "tl:remix:tl1" };
  const store = {
    get(k) {
      try { return JSON.parse(localStorage.getItem(k)); } catch (_) { return null; }
    },
    set(k, v) {
      if (FROZEN) return;
      try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {}
    },
    del(k) {
      if (FROZEN) return;
      try { localStorage.removeItem(k); } catch (_) {}
    },
  };

  // ------------------------------------------------------------ data: the tl1 post + community
  function tl1Items() {
    const style = { Orion: "patch", Edge: "text" }; // a little variety: one patch, one text-only
    const items = {};
    for (const t of TIERS) for (const name of POST.tiers[t]) {
      const id = TI.slug(name);
      const k = style[name];
      items[id] = { id, name, img: k === "text" ? null : k ? TI.candidates(name).find((c) => c.kind === k) : TI.best(name) };
    }
    return items;
  }
  function tl1Owner() {
    const p = emptyPlace();
    for (const t of TIERS) p[t] = POST.tiers[t].map(TI.slug);
    return p;
  }
  function baseCounts() {
    const N = POST.community.voters;
    const counts = {};
    for (const [name, pct] of Object.entries(POST.community.items)) counts[TI.slug(name)] = pct.map((p) => Math.round((p * N) / 100));
    return { voters: N, counts };
  }
  /** Pretend-submit: the visitor's list becomes one more voter. */
  function withVote(base, vote) {
    if (!vote) return base;
    const counts = {};
    for (const [id, c] of Object.entries(base.counts)) counts[id] = c.slice();
    for (const t of TIERS) for (const id of vote[t] || []) if (counts[id]) counts[id][TIERS.indexOf(t)]++;
    return { voters: base.voters + 1, counts };
  }
  function stats(c) {
    const tot = c.reduce((a, b) => a + b, 0) || 1;
    const pct = c.map((n) => (n / tot) * 100);
    const mean = c.reduce((s, n, i) => s + n * i, 0) / tot;
    let mode = 0;
    c.forEach((n, i) => { if (n > c[mode]) mode = i; });
    return { tot, pct, mean, mode, max: Math.max(...pct) };
  }
  /** Consensus tier list: modal tier ("most votes") or rounded mean ("average"). Best mean first inside a tier. */
  function consensus(comm, agg) {
    const p = emptyPlace();
    const rows = Object.entries(comm.counts).map(([id, c]) => {
      const st = stats(c);
      const ti = agg === "mean" ? Math.max(0, Math.min(4, Math.round(st.mean))) : st.mode;
      return { id, ti, st };
    });
    rows.sort((a, b) => a.st.mean - b.st.mean);
    for (const r of rows) p[TIERS[r.ti]].push(r.id);
    return p;
  }
  const tierOf = (place, id) => (place ? ZONES.find((z) => (place[z] || []).includes(id)) || null : null);
  const scoreOf = (mean) => (5 - mean).toFixed(1); // S=5 … D=1

  function compare(vote, comm, agg) {
    const cons = consensus(comm, agg);
    const rows = [];
    for (const id of Object.keys(comm.counts)) {
      const yt = tierOf(vote, id);
      if (!yt || yt === "tray") continue;
      const ct = tierOf(cons, id);
      const st = stats(comm.counts[id]);
      const yi = TIERS.indexOf(yt);
      rows.push({ id, yt, ct, d: TIERS.indexOf(ct) - yi, agree: st.pct[yi], sync: 1 - Math.abs(yi - st.mean) / 4 });
    }
    rows.sort((a, b) => Math.abs(b.d) - Math.abs(a.d) || b.d - a.d || a.sync - b.sync);
    const sync = rows.length ? rows.reduce((s, r) => s + r.sync, 0) / rows.length : 0;
    return { rows, sync, exact: rows.filter((r) => !r.d).length, near: rows.filter((r) => Math.abs(r.d) <= 1).length };
  }

  // demo content for frozen states
  const DEMO_VOTE = { S: ["arc", "zen"], A: ["helium", "firefox"], B: ["orion", "safari"], C: ["brave", "vivaldi"], D: ["chrome", "edge"], tray: [] };
  function demoDraft(withArc) {
    const names = ["Helium", "Zen", "Firefox", "Safari", "Vivaldi", "Chrome", "Edge", "Orion", "Brave"];
    const items = {};
    for (const n of names) items[TI.slug(n)] = { id: TI.slug(n), name: n, img: n === "Orion" ? TI.candidates(n)[1] : TI.best(n) };
    const place = { S: ["helium"], A: ["zen"], B: ["firefox", "safari"], C: ["vivaldi"], D: ["chrome", "edge"], tray: ["orion", "brave"] };
    if (withArc) {
      items.arc = { id: "arc", name: "Arc", img: TI.best("Arc") };
      place.tray.unshift("arc");
    }
    return { title: "My favorite browsers, ranked", items, place };
  }
  const DEMO_REMIX = { S: ["arc"], A: ["helium", "zen"], B: ["firefox"], C: [], D: ["edge"], tray: ["safari", "orion", "vivaldi", "brave", "chrome"] };

  // ------------------------------------------------------------ state
  const S = {
    mode: "edit", // edit | view
    kind: "new", // edit: new | remix · view: tl1 | draft
    title: "",
    items: {},
    place: emptyPlace(),
    owner: null,
    community: null,
    vote: null,
    tab: "mine",
    agg: params.get("agg") === "mean" ? "mean" : "mode",
    selected: null,
    justVoted: false,
    query: params.get("q") || "",
    date: null,
    tags: [],
  };

  function sanitize(place, items) {
    const out = emptyPlace();
    const seen = new Set();
    for (const z of ZONES) for (const id of (place && place[z]) || []) {
      if (items[id] && !seen.has(id)) { out[z].push(id); seen.add(id); }
    }
    for (const id of Object.keys(items)) if (!seen.has(id)) out.tray.push(id);
    return out;
  }

  function loadTl1() {
    S.items = tl1Items();
    S.owner = tl1Owner();
    S.title = POST.title;
    S.date = POST.date;
    S.tags = POST.tags;
    const saved = store.get(K.vote);
    S.vote = STATE === "results" ? clone(DEMO_VOTE) : FROZEN ? null : saved && saved.place ? sanitize(saved.place, S.items) : null;
    S.community = withVote(baseCounts(), S.vote);
  }

  function init() {
    const tabP = params.get("tab");
    let from = params.get("from") || "";
    const editing = STATE === "editing" || STATE === "dragging";
    if (STATE === "results") from = "tl1";
    else if (!from && tabP && !editing) from = "tl1";
    if (["mine", "everyone", "diff"].includes(tabP)) S.tab = tabP;

    if (from === "tl1") {
      loadTl1();
      if (editing) {
        S.mode = "edit";
        S.kind = "remix";
        S.place = clone(DEMO_REMIX);
      } else {
        S.mode = "view";
        S.kind = "tl1";
        if (STATE === "results") { S.tab = params.get("tab") || "diff"; S.justVoted = true; }
      }
      return;
    }
    if (from === "draft") {
      const p = store.get(K.post);
      if (p && p.items && p.owner) {
        S.mode = "view";
        S.kind = "draft";
        S.items = p.items;
        S.owner = sanitize(p.owner, p.items);
        S.title = p.title;
        S.date = p.at;
        S.community = { voters: 0, counts: {} };
        return;
      }
    }
    S.mode = "edit";
    S.kind = "new";
    const d = editing ? demoDraft(STATE === "dragging") : store.get(K.draft);
    if (d && d.items) {
      S.title = d.title || "";
      S.items = d.items;
      S.place = sanitize(d.place, d.items);
    }
  }

  // ------------------------------------------------------------ helpers
  function setURL(changes) {
    const u = new URL(location.href);
    for (const [k, v] of Object.entries(changes)) {
      if (v == null || v === "") u.searchParams.delete(k);
      else u.searchParams.set(k, v);
    }
    try { history.replaceState(null, "", u); } catch (_) {}
  }
  let liveTimer = 0;
  function announce(msg) {
    live.textContent = "";
    clearTimeout(liveTimer);
    liveTimer = setTimeout(() => (live.textContent = msg), 30);
  }
  let statusTimer = 0;
  function status(msg, { undo, warn } = {}) {
    const el = $("#tl-status");
    if (!el) return announce(msg);
    el.classList.toggle("is-warn", !!warn);
    el.innerHTML = `<span>${esc(msg)}</span>${undo ? `<button type="button" data-act="undo">Undo</button>` : ""}`;
    status.undo = undo || null;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => {
      if (el.isConnected) el.innerHTML = S.mode === "edit" && S.kind === "new" ? `<span>${savedLine()}</span>` : "";
      status.undo = null;
    }, undo ? 7000 : 4200);
  }
  const savedLine = () => (FROZEN ? "Preview state · not saved" : "Saved on this device");

  const zoneEl = (z) => $(`.tl-zone[data-zone="${z}"]`);
  const allItems = () => $$(".tl-zone > .tl-item");
  const itemsIn = (z) => [...zoneEl(z).children].filter((c) => c.classList.contains("tl-item"));
  const liOf = (id) => $(`.tl-zone > .tl-item[data-id="${CSS.escape(id)}"]`);
  const zoneOf = (li) => li.parentElement.dataset.zone;
  const idxOf = (li) => itemsIn(zoneOf(li)).indexOf(li);

  function readPlace() {
    const p = emptyPlace();
    for (const z of ZONES) { const el = zoneEl(z); if (el) p[z] = itemsIn(z).map((li) => li.dataset.id); }
    return p;
  }

  function save() {
    if (S.mode !== "edit") return;
    S.place = readPlace();
    if (S.kind === "new") store.set(K.draft, { title: S.title, items: S.items, place: S.place });
    else store.set(K.remix, { place: S.place });
    updateCounts();
  }

  function updateCounts() {
    const n = S.place.tray.length;
    const c = $("#tl-tray-count");
    if (c) c.textContent = n;
    for (const t of TIERS) {
      const el = $(`.tl-tier[data-tier="${t}"] .tl-tier__n`);
      if (el) el.textContent = S.mode === "edit" ? (itemsIn(t).length || "") : "";
    }
    const prog = $("#tl-progress");
    if (prog) {
      const total = Object.keys(S.items).length;
      const placed = total - n;
      prog.style.setProperty("--p", total ? placed / total : 0);
      $("#tl-progress-txt").innerHTML = `<span>${placed} of ${total} placed</span><span>${n ? `${n} to go` : "all set"}</span>`;
    }
  }

  // ------------------------------------------------------------ templates
  function imgHTML(it) {
    return it.img ? TI.svg(it.img, it.name) : "";
  }
  function itemHTML(it) {
    const edit = S.mode === "edit";
    const attrs = edit ? `aria-describedby="tl-help" aria-pressed="false"` : `aria-expanded="false"`;
    return `<li class="tl-item${it.img ? "" : " is-text"}" data-id="${esc(it.id)}">
      <button class="tl-item__btn rope" type="button" ${attrs}>
        ${it.img ? `<span class="tl-item__img">${imgHTML(it)}</span><span class="tl-item__name">${esc(it.name)}</span>` : `<span class="tl-item__face"><span class="tl-item__name">${esc(it.name)}</span></span>`}
        ${edit ? "" : `<span class="tl-item__more" aria-hidden="true"></span>`}
      </button></li>`;
  }
  function itemEl(it) {
    const t = document.createElement("template");
    t.innerHTML = itemHTML(it).trim();
    return t.content.firstElementChild;
  }
  function tierHTML(t) {
    const empty = S.mode === "edit" ? "Drop here" : S.tab === "everyone" ? "Nothing landed here" : "Empty";
    return `<section class="tl-tier" data-tier="${t}" aria-labelledby="tl-lbl-${t}">
      <div class="tl-tier__label"><span class="tl-tier__letter" aria-hidden="true">${t}</span><span class="tl-tier__n" aria-hidden="true"></span><span class="sr-only" id="tl-lbl-${t}">${t} tier</span></div>
      <ul class="tl-zone" role="list" data-zone="${t}" aria-labelledby="tl-lbl-${t}" data-empty="${empty}"></ul>
    </section>`;
  }
  const crumbs = (label) =>
    `<nav class="tl-crumbs" aria-label="Breadcrumb"><a class="tl-back" href="${FEED}"><i class="ph-bold ph-arrow-left" aria-hidden="true"></i> Thoughts</a><span class="tl-crumbs__sep" aria-hidden="true">/</span><p class="eyebrow"><i class="ph-fill ph-ranking" aria-hidden="true"></i>${label}</p></nav>`;
  const fmtDate = (iso) => {
    const d = iso ? new Date(iso) : new Date();
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  function trayHTML() {
    return `<section class="tl-tray" data-tier="tray" aria-labelledby="tl-tray-h">
      <div class="tl-tray__head">
        <h2 class="tl-tray__title" id="tl-tray-h"><i class="ph ph-tray" aria-hidden="true"></i> Unranked <span class="tl-count" id="tl-tray-count" aria-label="items">0</span></h2>
        <span class="meta">${mobile.matches ? "hold to drag" : "drag into a tier · click for options"}</span>
      </div>
      <ul class="tl-zone" role="list" data-zone="tray" aria-labelledby="tl-tray-h" data-empty="${S.kind === "remix" ? "Everything's placed. Nice." : "Things you add land here first."}"></ul>
      <p class="tl-help meta" id="tl-help">Keyboard: <kbd>Space</kbd> picks up, <kbd>↑</kbd><kbd>↓</kbd> or <kbd>1</kbd>–<kbd>5</kbd> change tier, <kbd>←</kbd><kbd>→</kbd> reorder, <kbd>Space</kbd> drops, <kbd>Esc</kbd> cancels, <kbd>Enter</kbd> for options.</p>
    </section>`;
  }

  function addHTML() {
    return `<section class="tl-panel-card tl-add" aria-labelledby="tl-add-h">
      <h2 class="tl-h2" id="tl-add-h"><i class="ph-bold ph-plus-circle" aria-hidden="true"></i> Add things</h2>
      <form class="tl-field" id="tl-add-form" autocomplete="off">
        <i class="ph ph-magnifying-glass" aria-hidden="true"></i>
        <label class="sr-only" for="tl-q">Name of something to add, or a comma separated list</label>
        <input id="tl-q" type="text" placeholder="Type a name, or paste a list" enterkeyhint="done" spellcheck="false" aria-describedby="tl-add-tip">
        <button class="tl-go" type="submit" aria-label="Add with the first image"><i class="ph-bold ph-arrow-elbow-down-left" aria-hidden="true"></i></button>
      </form>
      <p class="tl-tip meta" id="tl-add-tip">Enter adds it with the first image. Paste “Arc, Zen, Firefox” to add several.</p>
      <div class="tl-results" id="tl-results"></div>
    </section>`;
  }

  function remixCardHTML() {
    return `<section class="tl-panel-card tl-card tl-remixcard" aria-labelledby="tl-remix-h">
      <h2 class="tl-h2" id="tl-remix-h"><i class="ph-bold ph-shuffle" aria-hidden="true"></i> Your take</h2>
      <p class="tl-card-p">Same ${Object.keys(S.items).length} browsers as ${OWNER}'s list, starting unranked. Put them where <em>you</em> would.</p>
      <div class="tl-progress"><div class="tl-progress__bar"><span class="tl-progress__fill" id="tl-progress"></span></div><p class="tl-progress__txt" id="tl-progress-txt"></p></div>
      <div class="tl-card-acts"><button class="btn btn--red" type="button" data-act="submit"><i class="ph-bold ph-check" aria-hidden="true"></i> Add my ranking</button></div>
      <span class="meta">Saved on this device. Unplaced items don't count.</span>
    </section>`;
  }

  function editHTML() {
    const remix = S.kind === "remix";
    return `<header class="tl-head">
      <div class="tl-head__main">
        ${crumbs(remix ? `Your take · ${OWNER}'s list` : "New tier list · draft")}
        ${remix ? `<h1 class="tl-title">${esc(S.title)}</h1>` : `<label class="sr-only" for="tl-title">Title</label><textarea id="tl-title" class="tl-title tl-title--input" rows="1" placeholder="Name your tier list" maxlength="80" autocomplete="off" spellcheck="false">${esc(S.title)}</textarea>`}
        <p class="tl-status meta" id="tl-status" role="status">${remix ? "" : savedLine()}</p>
      </div>
      <div class="tl-head__actions">
        ${remix
          ? `<button class="btn btn--ghost" type="button" data-act="cancel-remix">Cancel</button><button class="btn btn--red" type="button" data-act="submit"><i class="ph-bold ph-check" aria-hidden="true"></i> Add my ranking</button>`
          : `<button class="btn btn--ghost tl-iconish" type="button" data-act="clear" aria-label="Start over"><i class="ph ph-arrow-counter-clockwise" aria-hidden="true"></i><span>Start over</span></button><button class="btn btn--red" type="button" data-act="post"><i class="ph-bold ph-paper-plane-tilt" aria-hidden="true"></i> Post</button>`}
      </div>
    </header>
    <div class="tl-grid">
      <div class="tl-main">
        <section class="tl-board" aria-label="Tiers">${TIERS.map(tierHTML).join("")}</section>
        ${trayHTML()}
      </div>
      <aside class="tl-side" aria-label="${remix ? "Your take" : "Add things"}">${remix ? remixCardHTML() : addHTML()}</aside>
    </div>`;
  }

  function tabHTML(id, label) {
    const on = S.tab === id;
    return `<button class="tl-tab" role="tab" type="button" id="tl-tab-${id}" data-tab="${id}" aria-controls="tl-panel" aria-selected="${on}" tabindex="${on ? 0 : -1}">${label}</button>`;
  }
  function odo(n, from) {
    return from != null && from !== n
      ? `<span class="tl-odo is-ticking"><span class="tl-odo__old">${from}</span><span class="tl-odo__new">${n}</span></span>`
      : `<span class="tl-odo"><span class="tl-odo__new">${n}</span></span>`;
  }

  function viewHTML() {
    const draft = S.kind === "draft";
    const placed = TIERS.reduce((s, t) => s + S.owner[t].length, 0);
    const v = S.community.voters;
    const from = S.justVoted ? v - 1 : null;
    return `<header class="tl-head">
      <div class="tl-head__main">
        ${crumbs(`Tier list · <time datetime="${esc(S.date || "")}">${fmtDate(S.date)}</time><span class="tl-tagbits">${S.tags.map((t) => ` · #${esc(t)}`).join("")}</span>`)}
        <h1 class="tl-title">${esc(S.title)}</h1>
        <p class="tl-byline">${cat()}<span>by <b>${OWNER}</b></span><span class="meta">· ${placed} ranked · ${draft ? "just posted" : `${odo(v, from)} voters`}</span></p>
      </div>
      <div class="tl-head__actions">
        ${draft
          ? `<button class="btn" type="button" data-act="edit-post"><i class="ph ph-pencil-simple" aria-hidden="true"></i> Edit</button><a class="btn btn--ghost" href="?skin=${SKIN}"><i class="ph ph-plus" aria-hidden="true"></i> New list</a>`
          : S.vote
            ? `<button class="btn" type="button" data-act="remix-edit"><i class="ph ph-pencil-simple" aria-hidden="true"></i> Edit my ranking</button>`
            : `<button class="btn btn--red" type="button" data-act="remix"><i class="ph-bold ph-shuffle" aria-hidden="true"></i> Make your own</button>`}
      </div>
    </header>
    <div class="tl-tabsbar">
      <div class="tl-tabs" role="tablist" aria-label="Whose ranking">
        <span class="tl-tabs__thumb" aria-hidden="true"></span>
        ${tabHTML("mine", `${cat()}Mine<span class="sr-only"> (${OWNER}'s)</span>`)}
        ${tabHTML("everyone", `Everyone <span class="tl-tab__n">${v}</span>`)}
        ${tabHTML("diff", `<span class="tl-wide">You vs everyone</span><span class="tl-narrow">You vs all</span>`)}
      </div>
      <div class="tl-panelbar" id="tl-panelbar"></div>
    </div>
    <div class="tl-grid">
      <div class="tl-panel" id="tl-panel" role="tabpanel" aria-labelledby="tl-tab-${S.tab}" tabindex="-1">
        <section class="tl-board" aria-label="Tiers">${TIERS.map(tierHTML).join("")}</section>
        <section class="tl-diff" id="tl-diff" aria-label="You vs everyone" hidden></section>
      </div>
      <aside class="tl-side" aria-label="Community">${communityHTML()}${crowdHTML()}</aside>
    </div>`;
  }

  function communityHTML() {
    const draft = S.kind === "draft";
    const v = S.community.voters;
    const n = Object.keys(S.items).length;
    if (draft) {
      return `<section class="tl-panel-card tl-card" aria-labelledby="tl-card-h">
        <p class="eyebrow" id="tl-card-h">Everyone's ranking</p>
        <p class="tl-card-big">0 <small>votes yet</small></p>
        <p class="tl-card-p">Visitors get a “Make your own” button with these ${n} things, unranked. Their lists roll up into the Everyone tab.</p>
        <span class="meta">This draft lives on this device in the mock.</span>
      </section>`;
    }
    const from = S.justVoted ? v - 1 : null;
    const sync = S.vote ? Math.round(compare(S.vote, S.community, S.agg).sync * 100) : 0;
    return `<section class="tl-panel-card tl-card" aria-labelledby="tl-card-h">
      <p class="eyebrow" id="tl-card-h">Everyone's ranking</p>
      <p class="tl-card-big">${odo(v, from)} <small>people ranked these</small></p>
      ${S.vote
        ? `<p class="tl-card-you"><i class="ph-fill ph-check-circle" aria-hidden="true"></i><span>Your ranking is in. You're ${sync}% in sync with everyone.</span></p>
           <div class="tl-card-acts"><button class="btn" type="button" data-act="tab-diff">See the differences</button><button class="btn btn--ghost" type="button" data-act="unvote">Remove mine</button></div>`
        : `<p class="tl-card-p">Rank the same ${n} browsers yourself. Your list joins everyone's results, then you'll see where you and the crowd split.</p>
           <div class="tl-card-acts"><button class="btn btn--red" type="button" data-act="remix"><i class="ph-bold ph-shuffle" aria-hidden="true"></i> Make your own</button></div>`}
      <span class="meta">Saved on this device. No account needed.</span>
    </section>`;
  }

  /** A few plain-language takeaways from the aggregate, visible from any tab. */
  function crowdHTML() {
    const rows = Object.entries(S.community.counts).map(([id, c]) => ({ id, st: stats(c) }));
    if (!rows.length || !S.community.voters) return "";
    const spread = (r) => r.st.pct.reduce((s, p, i) => s + (p / 100) * (i - r.st.mean) ** 2, 0);
    const pick = (f) => rows.reduce((a, b) => (f(b) > f(a) ? b : a));
    const fav = pick((r) => r.st.pct[0]);
    const split = pick(spread);
    const low = pick((r) => r.st.pct[4]);
    const line = (k, r, txt) => {
      const it = S.items[r.id];
      return `<li><span class="tl-crowd__img" aria-hidden="true">${it.img ? imgHTML(it) : esc(it.name.slice(0, 2))}</span>
        <span class="tl-crowd__txt"><span class="tl-crowd__k">${k}</span><span><b>${esc(it.name)}</b> <span class="meta">${txt}</span></span></span></li>`;
    };
    return `<section class="tl-panel-card tl-crowd" aria-labelledby="tl-crowd-h">
      <p class="eyebrow" id="tl-crowd-h">Crowd notes</p>
      <ul>
        ${line("Crowd favorite", fav, `${Math.round(fav.st.pct[0])}% put it in S`)}
        ${line("Most split", split, `spread across all five tiers`)}
        ${line("Least loved", low, `${Math.round(low.st.pct[4])}% put it in D`)}
      </ul>
    </section>`;
  }

  // ------------------------------------------------------------ render
  function autosize(ta) {
    if (!ta || CSS.supports("field-sizing", "content")) return;
    ta.style.height = "auto";
    ta.style.height = ta.scrollHeight + "px";
  }
  function captureCenters() {
    const m = new Map();
    for (const li of $$(".tl-zone > .tl-item")) m.set(li.dataset.id, center(li.getBoundingClientRect()));
    return m;
  }
  /** Things keep their identity across modes: items spring from where they were. */
  function continuity(before) {
    if (reduced() || !before.size) return;
    for (const li of allItems()) {
      const b = before.get(li.dataset.id);
      if (!b) continue;
      const c = center(li.getBoundingClientRect());
      if (Math.abs(b.x - c.x) < 1 && Math.abs(b.y - c.y) < 1) continue;
      Springs.set(li, { x: b.x - c.x, y: b.y - c.y });
      li.classList.add("is-settling");
      Springs.to(li, { x: 0, y: 0 }, { resp: 0.48, onRest: () => li.classList.remove("is-settling") });
    }
  }

  function render() {
    const before = captureCenters();
    S.selected = null;
    app.removeAttribute("data-selecting");
    app.dataset.mode = S.mode;
    app.dataset.kind = S.kind;
    app.dataset.tab = S.mode === "view" ? S.tab : "";
    app.innerHTML = S.mode === "edit" ? editHTML() : viewHTML();
    if (S.mode === "edit") {
      for (const z of ZONES) {
        const zone = zoneEl(z);
        for (const id of S.place[z]) zone.appendChild(itemEl(S.items[id]));
      }
      updateCounts();
      if (S.kind === "new") renderResults();
      autosize($("#tl-title"));
    } else {
      const ids = new Set([...TIERS.flatMap((t) => S.owner[t]), ...Object.keys(S.community.counts)]);
      for (const id of ids) if (S.items[id]) zoneEl("S").appendChild(itemEl(S.items[id]));
      decorateView();
      placeView(false);
      showTab(false);
    }
    continuity(before);
  }

  // ------------------------------------------------------------ add: search, suggestions, image results
  const R = { sugg: [], idx: 0, name: "", cands: null, loading: false, token: 0, timer: 0 };
  const splitList = (t) => String(t).split(/\s*(?:,|;|\n|\t)\s*/).map((s) => s.trim()).filter(Boolean);

  function onQuery(text, instant) {
    S.query = text;
    clearTimeout(R.timer);
    const run = () => {
      const parts = splitList(text);
      if (!text.trim()) { R.name = ""; R.cands = null; renderResults(); return; }
      if (parts.length > 1) { R.name = ""; renderResults(); return; }
      R.sugg = TI.suggest(text);
      R.idx = 0;
      searchFor(R.sugg[0].name, instant);
    };
    instant ? run() : (R.timer = setTimeout(run, 90));
  }
  function searchFor(name, instant) {
    const tok = ++R.token;
    R.name = name;
    R.loading = !instant;
    renderResults();
    // ↓ the async seam: swap TierImages.search() for a real image search (see tierlist-images.js)
    TI.search(name, { instant }).then((c) => {
      if (tok !== R.token) return;
      R.cands = c;
      R.loading = false;
      renderResults();
    });
  }

  function candHTML(c, name, { pressed, isDefault, act } = {}) {
    const text = c.kind === "text";
    const label = text ? "Text only" : c.label;
    const pressedAttr = pressed == null ? "" : ` aria-pressed="${pressed}"`;
    const aria = act === "swap" ? `Use ${label.toLowerCase()} for ${name}` : `Add ${name} with ${text ? "no image" : `the ${label.toLowerCase()} image`}`;
    return `<button class="tl-cand rope${text ? " tl-cand--text" : ""}" type="button" data-act="${act}" data-kind="${c.kind}" aria-label="${esc(aria)}"${pressedAttr}>
      <span class="tl-cand__img">${text ? `<span>${esc(name)}</span>` : TI.svg(c, name)}</span>
      <span class="tl-cand__label">${label}</span>
      <span class="tl-cand__src">${text ? "no image" : esc(c.source)}</span>
      ${isDefault ? `<span class="tl-cand__key" aria-hidden="true"><i class="ph-bold ph-arrow-elbow-down-left"></i></span>` : ""}
    </button>`;
  }

  function renderResults() {
    const box = $("#tl-results");
    if (!box) return;
    const text = S.query || "";
    const parts = splitList(text);
    if (!text.trim()) { box.innerHTML = ""; return; }
    if (parts.length > 1) {
      box.innerHTML = `<div class="tl-multi">
        <div class="tl-res-head"><p class="tl-res-h">Add ${parts.length} at once</p><span class="meta">each gets its logo, swap later</span></div>
        <ul aria-label="Items to add">${parts.map((p) => `<li><span>${TI.svg(TI.best(p), p)}</span>${esc(p)}</li>`).join("")}</ul>
        <div><button class="btn btn--ink" type="button" data-act="add-multi"><i class="ph-bold ph-plus" aria-hidden="true"></i> Add ${parts.length} to Unranked</button></div>
      </div>`;
      return;
    }
    const sugg = `<div class="tl-sugg" role="group" aria-label="Did you mean">${R.sugg
      .map((s, i) => `<button class="chip" type="button" data-act="sugg" data-i="${i}" aria-pressed="${i === R.idx}">${esc(s.name)}${s.hint ? ` <small>${esc(s.hint)}</small>` : ""}</button>`)
      .join("")}</div>`;
    let grid;
    if (!R.cands) {
      grid = `<div class="tl-cands" aria-busy="true">${Array.from({ length: 6 }, () => `<span class="tl-cand is-loading"><span class="tl-cand__img"></span><span class="tl-cand__label">Loading</span><span class="tl-cand__src">source</span></span>`).join("")}</div>`;
    } else {
      const name = R.name;
      const list = R.loading ? R.cands : TI.candidates(name);
      grid = `<div class="tl-cands${R.loading ? " is-stale" : ""}" role="group" aria-label="Images for ${esc(name)}" ${R.loading ? 'aria-busy="true"' : ""}>
        ${list.map((c, i) => candHTML(c, name, { isDefault: i === 0, act: "add-cand" })).join("")}
        ${candHTML({ kind: "text" }, name, { act: "add-cand" })}
      </div>`;
    }
    box.innerHTML = `${sugg}
      <div class="tl-res-head"><p class="tl-res-h">Images for <q>${esc(R.name)}</q></p><span class="meta">pick one to add</span></div>
      ${grid}
      <p class="tl-note-mock"><i class="ph ph-info" aria-hidden="true"></i><span class="tl-long">Mock images, drawn on this page. Real search plugs into <code>TierImages.search()</code>: logos by domain + Brave or Wikimedia image search, cached in R2.</span><span class="tl-short">Mock images. Real search plugs into <code>TierImages.search()</code>.</span></p>`;
  }

  function uniqueId(base) {
    let id = base;
    let n = 2;
    while (S.items[id]) id = `${base}-${n++}`;
    return id;
  }

  /** Add one item to the front of the tray; it flies in from `fromEl` (the picked image). */
  function addItem(name, img, fromEl) {
    name = String(name).trim().slice(0, 40);
    if (!name) return null;
    const dupe = Object.values(S.items).find((i) => norm(i.name) === norm(name));
    if (dupe) {
      const li = liOf(dupe.id);
      if (li) { li.classList.remove("is-pulse"); void li.offsetWidth; li.classList.add("is-pulse"); }
      status(`${dupe.name} is already on the list.`, { warn: true });
      return null;
    }
    const it = { id: uniqueId(TI.slug(name)), name, img: img || null };
    S.items[it.id] = it;
    const li = itemEl(it);
    const tray = zoneEl("tray");
    flip(allItems(), () => tray.insertBefore(li, tray.firstChild));
    if (mobile.matches) tray.scrollTo({ left: 0 });
    if (fromEl && !reduced()) {
      const a = center(fromEl.getBoundingClientRect());
      const b = center(li.getBoundingClientRect());
      Springs.set(li, { x: a.x - b.x, y: a.y - b.y, s: 0.75 });
      li.classList.add("is-settling");
      Springs.to(li, { x: 0, y: 0, s: 1 }, { resp: 0.46, sresp: 0.4, onRest: () => li.classList.remove("is-settling") });
    } else li.classList.add("is-enter");
    save();
    return li;
  }

  function clearQuery() {
    const q = $("#tl-q");
    if (q) q.value = "";
    S.query = "";
    R.cands = null;
    R.name = "";
    R.token++;
    renderResults();
  }

  function addFromInput() {
    const q = $("#tl-q");
    const text = q.value;
    const parts = splitList(text);
    if (!parts.length) return;
    if (parts.length > 1) return addMany(parts);
    const name = R.sugg[R.idx]?.name || text.trim();
    const img = (R.cands && R.name === name ? R.cands[0] : null) || TI.best(name);
    const from = $(".tl-cands .tl-cand");
    if (addItem(name, img, from)) {
      announce(`Added ${name} to Unranked with the logo image.`);
      status(`Added ${name}. Tap it to change the image.`);
      clearQuery();
    }
  }
  function addMany(parts) {
    const added = [];
    for (const p of parts) if (addItem(p, TI.best(p))) added.push(p);
    if (added.length) {
      announce(`Added ${added.length} items to Unranked: ${added.join(", ")}.`);
      status(`Added ${added.join(", ")}.`);
    }
    clearQuery();
  }

  // ------------------------------------------------------------ selection + inspector (opens in place)
  function setSelected(id, instant) {
    if (S.selected === id) id = null;
    S.selected = id;
    for (const li of allItems()) {
      const on = li.dataset.id === id;
      li.classList.toggle("is-selected", on);
      const b = li.querySelector(".tl-item__btn");
      b.setAttribute(S.mode === "edit" ? "aria-pressed" : "aria-expanded", String(on));
    }
    app.toggleAttribute("data-selecting", !!id && S.mode === "edit");
    placeInspector(true, instant);
  }

  function inspectorHTML(it) {
    const z = zoneOf(liOf(it.id));
    if (S.mode === "view") return breakdownHTML(it, z);
    const remix = S.kind === "remix";
    const cands = TI.candidates(it.name);
    const curKind = it.img ? it.img.kind : "text";
    return `<div class="tl-insp" id="tl-insp" role="group" aria-label="Options for ${esc(it.name)}">
      <div class="tl-insp__top">
        <span class="tl-insp__thumb" aria-hidden="true">${it.img ? imgHTML(it) : esc(it.name.slice(0, 2))}</span>
        <div class="tl-insp__name">
          <label class="tl-insp__lbl" for="tl-rename">${remix ? "Selected" : "Selected · rename"}</label>
          <input id="tl-rename" value="${esc(it.name)}" maxlength="40" autocomplete="off" ${remix ? "readonly" : ""}>
        </div>
        ${remix ? "" : `<button class="tl-x tl-x--danger" type="button" data-act="remove" aria-label="Remove ${esc(it.name)}"><i class="ph-bold ph-trash" aria-hidden="true"></i></button>`}
        <button class="tl-x" type="button" data-act="deselect" aria-label="Done"><i class="ph-bold ph-x" aria-hidden="true"></i></button>
      </div>
      <div class="tl-insp__sec">
        <p class="tl-insp__lbl" id="tl-mv-lbl">Move to <span class="sr-only">(or tap a tier row)</span></p>
        <div class="tl-moveto" role="group" aria-labelledby="tl-mv-lbl">${ZONES.map(
          (q) => `<button class="tl-mv" type="button" data-act="move" data-move="${q}" data-tier="${q}" aria-pressed="${q === z}" aria-label="${ZNAME[q]}">${q === "tray" ? `<i class="ph-bold ph-tray" aria-hidden="true"></i><span class="tl-mv__txt">Unranked</span>` : q}</button>`,
        ).join("")}</div>
      </div>
      ${remix ? "" : `<div class="tl-insp__sec">
        <p class="tl-insp__lbl" id="tl-im-lbl">Image</p>
        <div class="tl-cands tl-cands--row" role="group" aria-labelledby="tl-im-lbl">
          ${cands.map((c) => candHTML(c, it.name, { pressed: c.kind === curKind, act: "swap" })).join("")}
          ${candHTML({ kind: "text" }, it.name, { pressed: curKind === "text", act: "swap" })}
        </div>
      </div>`}
    </div>`;
  }

  function breakdownHTML(it, z) {
    const c = S.community.counts[it.id];
    const youT = tierOf(S.vote, it.id);
    const ownerT = tierOf(S.owner, it.id);
    const head = `<div class="tl-insp__top">
        <span class="tl-insp__thumb" aria-hidden="true">${it.img ? imgHTML(it) : esc(it.name.slice(0, 2))}</span>
        <div class="tl-insp__name"><p class="tl-insp__lbl">${c ? `How ${S.community.voters} people ranked it` : "No votes yet"}</p><p class="tl-insp__title">${esc(it.name)}</p></div>
        <button class="tl-x" type="button" data-act="deselect" aria-label="Close breakdown"><i class="ph-bold ph-x" aria-hidden="true"></i></button>
      </div>`;
    if (!c) return `<div class="tl-insp" id="tl-insp" role="region" aria-label="${esc(it.name)}">${head}<p class="tl-card-p" style="margin:0">Once visitors make their own lists, you'll see where they put ${esc(it.name)}.</p></div>`;
    const st = stats(c);
    return `<div class="tl-insp" id="tl-insp" role="region" aria-label="How everyone ranked ${esc(it.name)}">${head}
      <ul class="tl-bars" role="list">${TIERS.map((t, i) => {
        const who = `${ownerT === t ? `<span class="tl-who">${cat()} ${OWNER}</span>` : ""}${youT === t ? `<span class="tl-who tl-who--you">you</span>` : ""}`;
        return `<li class="tl-bar" data-tier="${t}"><span class="tl-badge" data-tier="${t}" aria-hidden="true">${t}</span>
          <span class="tl-bar__track" aria-hidden="true"><span class="tl-bar__fill" style="--p:${(st.pct[i] / 100).toFixed(3)}"></span></span>
          <span class="tl-bar__pct"><span class="sr-only">${t} tier: </span>${Math.round(st.pct[i])}%</span><span class="tl-bar__who">${who}</span></li>`;
      }).join("")}</ul>
      <p class="meta" style="margin:0">Average ${scoreOf(st.mean)} / 5 · most picked ${TIERS[st.mode]} · ${ownerT && ownerT !== "tray" ? `${OWNER} put it in ${ownerT}` : ""}</p>
    </div>`;
  }

  function placeInspector(fresh, instant) {
    const old = $("#tl-insp");
    const id = S.selected;
    const li = id && liOf(id);
    const run = (fn) => (instant ? fn() : flip(allItems(), fn));
    if (!li) { if (old) run(() => old.remove()); return; }
    const t = document.createElement("template");
    t.innerHTML = inspectorHTML(S.items[id]).trim();
    const el = fresh || !old ? t.content.firstElementChild : old;
    if (!fresh && old) {
      // keep the same panel, just refresh the "move to" state
      const z = zoneOf(li);
      $$(".tl-mv", old).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.move === z)));
    }
    if ((!fresh && old) || instant) el.style.animation = "none";
    run(() => {
      if (old && old !== el) old.remove();
      const z = zoneOf(li);
      if (z === "tray") {
        const tray = $(".tl-tray");
        if (mobile.matches) tray.insertBefore(el, tray.firstChild);
        else tray.after(el);
      } else li.closest(".tl-tier").after(el);
    });
    // point the little tab at the item
    const r = li.getBoundingClientRect();
    const pr = el.getBoundingClientRect();
    el.style.setProperty("--tab-x", Math.max(16, Math.min(pr.width - 30, r.left + r.width / 2 - pr.left - 7)) + "px");
  }

  function moveTo(li, zone, index, { announceIt = true } = {}) {
    const z = zoneEl(zone);
    const kids = itemsIn(zone).filter((c) => c !== li);
    index = index == null ? kids.length : Math.max(0, Math.min(index, kids.length));
    flip(allItems(), () => {
      z.insertBefore(li, kids[index] || null);
      if (S.selected === li.dataset.id) placeInspectorSync(li);
    });
    if (announceIt) announce(`${S.items[li.dataset.id].name}, ${ZNAME[zone]}, ${index + 1} of ${kids.length + 1}.`);
    return index;
  }
  // inspector follows the selected item (inside the same flip so rows below spring too)
  function placeInspectorSync(li) {
    const el = $("#tl-insp");
    if (!el) return;
    const zone = zoneOf(li);
    $$(".tl-mv", el).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.move === zone)));
    el.style.animation = "none";
    if (zone === "tray") {
      const tray = $(".tl-tray");
      if (mobile.matches) tray.insertBefore(el, tray.firstChild);
      else tray.after(el);
    } else li.closest(".tl-tier").after(el);
    requestAnimationFrame(() => {
      const r = li.getBoundingClientRect();
      const pr = el.getBoundingClientRect();
      el.style.setProperty("--tab-x", Math.max(16, Math.min(pr.width - 30, r.left + r.width / 2 - pr.left - 7)) + "px");
    });
  }

  function swapImage(kind) {
    const it = S.items[S.selected];
    if (!it) return;
    it.img = kind === "text" ? null : TI.candidates(it.name).find((c) => c.kind === kind) || null;
    const li = liOf(it.id);
    const fresh = itemEl(it);
    flip(allItems(), () => {
      li.className = fresh.className + " is-selected";
      li.innerHTML = fresh.innerHTML;
      li.querySelector(".tl-item__btn").setAttribute("aria-pressed", "true");
    });
    $$(".tl-insp .tl-cand").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.kind === kind)));
    const th = $(".tl-insp__thumb");
    if (th) th.innerHTML = it.img ? imgHTML(it) : esc(it.name.slice(0, 2));
    announce(`${it.name} now uses ${kind === "text" ? "text only" : `the ${kind} image`}.`);
    save();
  }

  function rename(name) {
    const it = S.items[S.selected];
    name = String(name).trim().slice(0, 40);
    if (!it || !name || name === it.name) return;
    it.name = name;
    const li = liOf(it.id);
    li.querySelector(".tl-item__name").textContent = name;
    if (li.classList.contains("is-text")) {
      // width may change
      flip(allItems(), () => {});
    }
    save();
  }

  function removeItem(id) {
    const li = liOf(id);
    if (!li) return;
    const it = S.items[id];
    const zone = zoneOf(li);
    const index = idxOf(li);
    const next = li.nextElementSibling || li.previousElementSibling;
    if (S.selected === id) setSelected(null);
    flip(allItems(), () => li.remove());
    delete S.items[id];
    save();
    announce(`Removed ${it.name}.`);
    status(`Removed ${it.name}.`, {
      undo: () => {
        S.items[id] = it;
        const el = itemEl(it);
        const kids = itemsIn(zone);
        flip(allItems(), () => zoneEl(zone).insertBefore(el, kids[index] || null));
        el.classList.add("is-enter");
        save();
        announce(`Restored ${it.name}.`);
      },
    });
    (next && next.querySelector ? next.querySelector(".tl-item__btn") : $("#tl-q"))?.focus({ preventScroll: true });
  }

  // ------------------------------------------------------------ keyboard pick-up / move / drop
  let kb = null;
  let lastKey = 0;
  function kbPick(li) {
    kb = { li, from: { zone: zoneOf(li), index: idxOf(li) } };
    li.classList.add("is-kb");
    lift(li, true);
    const n = itemsIn(kb.from.zone).length;
    announce(`Picked up ${S.items[li.dataset.id].name}. ${ZNAME[kb.from.zone]}, ${kb.from.index + 1} of ${n}. Arrow keys or 1 to 5 to move, Space to drop, Escape to cancel.`);
  }
  function kbMove(zone, index) {
    const li = kb.li;
    moveTo(li, zone, index);
    refocus(li);
  }
  function kbDrop(silent) {
    if (!kb) return;
    const li = kb.li;
    li.classList.remove("is-kb");
    lift(li, false);
    if (!silent) announce(`Dropped ${S.items[li.dataset.id].name} in ${ZNAME[zoneOf(li)]}, position ${idxOf(li) + 1} of ${itemsIn(zoneOf(li)).length}.`);
    kb = null;
    save();
  }
  function kbCancel() {
    const { li, from } = kb;
    moveTo(li, from.zone, from.index, { announceIt: false });
    refocus(li);
    kbDrop(true);
    announce(`Cancelled. ${S.items[li.dataset.id].name} is back in ${ZNAME[from.zone]}.`);
  }
  function refocus(li) {
    const b = li.querySelector(".tl-item__btn");
    if (document.activeElement !== b) b.focus({ preventScroll: true });
    const r = li.getBoundingClientRect();
    const bottom = mobile.matches && zoneOf(li) !== "tray" ? $(".tl-tray").getBoundingClientRect().top : innerHeight;
    if (r.top < 70 || r.bottom > bottom - 10) scrollBy({ top: r.top < 70 ? r.top - 90 : r.bottom - bottom + 30, behavior: reduced() ? "auto" : "smooth" });
    if (zoneOf(li) === "tray") li.scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  function onKey(e) {
    const btn = e.target.closest && e.target.closest(".tl-item__btn");
    if (S.mode !== "edit") return;
    if (!btn) {
      if (e.key === "Escape" && S.selected) { const id = S.selected; setSelected(null); liOf(id)?.querySelector(".tl-item__btn").focus(); }
      return;
    }
    const li = btn.closest(".tl-item");
    if (kb && kb.li === li) {
      const z = zoneOf(li);
      const i = idxOf(li);
      const n = itemsIn(z).length;
      const k = e.key;
      lastKey = performance.now();
      if (k === "ArrowUp" || k === "ArrowDown") {
        const zi = ZONES.indexOf(z) + (k === "ArrowUp" ? -1 : 1);
        if (zi < 0 || zi >= ZONES.length) announce(zi < 0 ? "Already at the top tier." : "Already in Unranked.");
        else kbMove(ZONES[zi], Math.min(i, itemsIn(ZONES[zi]).length));
      } else if (k === "ArrowLeft") {
        if (i > 0) kbMove(z, i - 1);
        else announce(`Start of ${ZNAME[z]}.`);
      } else if (k === "ArrowRight") {
        if (i < n - 1) kbMove(z, i + 1);
        else announce(`End of ${ZNAME[z]}.`);
      } else if (/^[1-5]$/.test(k)) kbMove(TIERS[+k - 1], null);
      else if (k === "0" || k === "u" || k === "U") kbMove("tray", null);
      else if (k === " " || k === "Enter") kbDrop();
      else if (k === "Escape") kbCancel();
      else if (k === "Tab") { kbDrop(); return; }
      else return;
      e.preventDefault();
      return;
    }
    if (e.key === " ") {
      e.preventDefault();
      lastKey = performance.now();
      if (kb) kbDrop(true);
      kbPick(li);
    } else if (e.key === "Enter") {
      e.preventDefault();
      lastKey = performance.now();
      setSelected(li.dataset.id);
      if (S.selected) $("#tl-insp .tl-mv[aria-pressed='true']")?.focus();
    } else if ((e.key === "Delete" || e.key === "Backspace") && S.kind === "new") {
      e.preventDefault();
      removeItem(li.dataset.id);
    }
  }

  // ------------------------------------------------------------ view: tabs, consensus, diff
  function decorateView() {
    for (const li of allItems()) {
      const id = li.dataset.id;
      const it = S.items[id];
      const c = S.community.counts[id];
      const more = li.querySelector(".tl-item__more");
      const btn = li.querySelector(".tl-item__btn");
      if (!c) {
        more.innerHTML = "";
        btn.setAttribute("aria-label", `${it.name}. Show details`);
        continue;
      }
      const st = stats(c);
      const you = tierOf(S.vote, id);
      const yi = you && you !== "tray" ? TIERS.indexOf(you) : -1;
      more.innerHTML = `<span class="tl-hist">${st.pct.map((p, i) => `<i style="--p:${(p / st.max).toFixed(3)}"${i === yi ? ' class="is-you"' : ""}></i>`).join("")}</span><span class="tl-item__stat"></span>`;
      const dist = TIERS.map((t, i) => `${t} ${Math.round(st.pct[i])}%`).join(", ");
      li.dataset.dist = dist;
    }
    updateStats();
  }
  function updateStats() {
    const cons = S.community.voters ? consensus(S.community, S.agg) : null;
    for (const li of allItems()) {
      const id = li.dataset.id;
      const c = S.community.counts[id];
      if (!c) continue;
      const st = stats(c);
      const ct = tierOf(cons, id);
      const statEl = li.querySelector(".tl-item__stat");
      if (statEl) statEl.textContent = S.agg === "mean" ? `avg ${scoreOf(st.mean)}/5` : `${Math.round(st.pct[TIERS.indexOf(ct)])}% ${ct}`;
      const it = S.items[id];
      const ot = tierOf(S.owner, id);
      const btn = li.querySelector(".tl-item__btn");
      btn.setAttribute(
        "aria-label",
        S.tab === "everyone"
          ? `${it.name}, everyone: ${ct} tier. Votes: ${li.dataset.dist}. Show breakdown`
          : `${it.name}, ${ot} tier. Show how everyone ranked it`,
      );
    }
  }

  function viewPlacement(tab) {
    if (tab === "everyone" && S.community.voters) return consensus(S.community, S.agg);
    return S.owner;
  }
  function placeView(animate) {
    const p = viewPlacement(S.tab);
    const doIt = () => {
      for (const t of TIERS) {
        const zone = zoneEl(t);
        for (const id of p[t]) { const li = liOf(id); if (li) zone.appendChild(li); }
      }
      // anything not in this placement (unranked in the author's list) is hidden
      const shown = new Set(TIERS.flatMap((t) => p[t]));
      for (const li of allItems()) li.hidden = !shown.has(li.dataset.id);
      if (S.selected) { const li = liOf(S.selected); const el = $("#tl-insp"); if (li && el && !li.hidden) li.closest(".tl-tier").after(el); }
      for (const t of TIERS) {
        const zone = zoneEl(t);
        zone.dataset.empty = S.tab === "everyone" ? "Nothing landed here" : "Empty";
      }
    };
    animate ? flip(allItems(), doIt, { resp: 0.5 }) : doIt();
    updateStats();
  }

  function moveThumb() {
    const tabs = $(".tl-tabs");
    const on = $(".tl-tab[aria-selected='true']");
    const th = $(".tl-tabs__thumb");
    if (!tabs || !on || !th) return;
    const tr = th.getBoundingClientRect();
    const r = on.getBoundingClientRect();
    th.style.setProperty("--l", Math.max(0, r.left - tr.left) + "px");
    th.style.setProperty("--r", Math.max(0, tr.right - r.right) + "px");
    tabs.classList.add("is-ready");
  }

  function panelbarHTML() {
    if (S.tab === "everyone" && S.community.voters) {
      return `<span class="meta">Placed by</span>
        <button class="chip" type="button" data-act="agg" data-agg="mode" aria-pressed="${S.agg === "mode"}">Most votes</button>
        <button class="chip" type="button" data-act="agg" data-agg="mean" aria-pressed="${S.agg === "mean"}">Average</button>
        <span class="meta" style="display:inline-flex;align-items:center;gap:6px;margin-left:6px">bars
          <span class="tl-legend" aria-hidden="true">${TIERS.map((t, i) => `<i style="height:${[100, 80, 60, 40, 25][i]}%;background:var(--bar-${t})"></i>`).join("")}</span> S→D</span>`;
    }
    if (S.tab === "diff" && S.vote) {
      return `<span class="meta">vs</span>
        <button class="chip" type="button" data-act="agg" data-agg="mode" aria-pressed="${S.agg === "mode"}">Most votes</button>
        <button class="chip" type="button" data-act="agg" data-agg="mean" aria-pressed="${S.agg === "mean"}">Average</button>`;
    }
    if (S.tab === "mine") return `<span class="meta">${mobile.matches ? "Tap" : "Select"} anything to see how everyone ranked it</span>`;
    return "";
  }

  function showTab(animate) {
    app.dataset.tab = S.tab;
    for (const b of $$(".tl-tab")) {
      const on = b.dataset.tab === S.tab;
      b.setAttribute("aria-selected", String(on));
      b.tabIndex = on ? 0 : -1;
    }
    $("#tl-panel").setAttribute("aria-labelledby", `tl-tab-${S.tab}`);
    $("#tl-panelbar").innerHTML = panelbarHTML();
    // "You vs everyone", or "Everyone" before anybody voted, swap the board for a panel
    const diff = S.tab === "diff" || (S.tab === "everyone" && !S.community.voters);
    $(".tl-board").hidden = diff;
    $("#tl-diff").hidden = !diff;
    if (diff) renderDiff();
    else placeView(animate);
    requestAnimationFrame(moveThumb);
  }

  function setTab(tab, focus) {
    if (tab === S.tab) return;
    S.tab = tab;
    if (S.selected) setSelected(null);
    setURL({ tab });
    showTab(true);
    if (focus) $(`#tl-tab-${tab}`).focus();
    const label = { mine: `${OWNER}'s ranking`, everyone: `Everyone's ranking, ${S.community.voters} voters`, diff: "You versus everyone" }[tab];
    announce(`Showing ${label}.`);
  }

  let ringId = 0;
  /** Agreement ring drawn as a twisted-yarn stroke (kit .ply-base + .ply-twist), masked to p. */
  function ring(p) {
    const id = "tl-ring-" + ++ringId;
    const pc = Math.max(0, Math.min(100, p * 100)).toFixed(1);
    return `<svg class="tl-ring" viewBox="0 0 100 100" aria-hidden="true">
      <defs><mask id="${id}"><circle cx="50" cy="50" r="40" fill="none" stroke="#fff" stroke-width="12" pathLength="100" stroke-dasharray="${pc} 100" stroke-linecap="round"/></mask></defs>
      <circle cx="50" cy="50" r="40" fill="none" stroke="var(--tl-track)" stroke-width="10"/>
      <g mask="url(#${id})">
        <circle class="ply-base" cx="50" cy="50" r="40" stroke-width="10" style="--ply:var(--tl-accent)"/>
        <circle class="ply-twist" cx="50" cy="50" r="40" stroke-width="10"/>
      </g>
    </svg>`;
  }

  function renderDiff() {
    const box = $("#tl-diff");
    if (S.kind === "draft") {
      box.innerHTML = S.tab === "everyone"
        ? `<div class="tl-panel-card tl-empty"><h2>No votes yet</h2><p>When visitors tap “Make your own”, their lists roll up here into one consensus tier list, with a little histogram under each thing.</p></div>`
        : `<div class="tl-panel-card tl-empty"><h2>Nobody to compare with yet</h2><p>When visitors make their own version, this tab shows where each of them splits from everyone else.</p></div>`;
      return;
    }
    if (!S.vote) {
      box.innerHTML = `<div class="tl-panel-card tl-empty">
        <h2>Where do you land?</h2>
        <p>Make your own version of this list. You'll get the same ${Object.keys(S.items).length} browsers unranked, and afterwards this tab shows, item by item, where you and ${S.community.voters} others disagree.</p>
        <button class="btn btn--red" type="button" data-act="remix"><i class="ph-bold ph-shuffle" aria-hidden="true"></i> Make your own</button>
      </div>`;
      return;
    }
    const cmp = compare(S.vote, S.community, S.agg);
    const pct = Math.round(cmp.sync * 100);
    const top = cmp.rows[0];
    const words = pct >= 85 ? "Basically the crowd." : pct >= 70 ? "Mostly with the crowd." : "You've got opinions.";
    const others = S.community.voters - 1;
    box.innerHTML = `
      ${S.justVoted ? `<p class="tl-joined" role="status"><i class="ph-fill ph-check-circle" aria-hidden="true"></i> Added to everyone's results: ${others} → ${S.community.voters} voters.</p>` : ""}
      <div class="tl-panel-card tl-sync">
        ${ring(cmp.sync)}
        <div>
          <p class="tl-sync__pct">${pct}%<small>in sync</small></p>
          <p class="muted">${words} Compared with ${others} other voters, by ${S.agg === "mean" ? "average tier" : "most-voted tier"}.</p>
          <ul class="tl-facts">
            <li><b>${cmp.exact}</b> exact matches</li>
            <li><b>${cmp.near}</b> within one tier</li>
            ${top && top.d ? `<li>Biggest split: <b>${esc(S.items[top.id].name)}</b></li>` : ""}
          </ul>
        </div>
      </div>
      <p class="tl-cmp-legend meta"><span><i class="ph-bold ph-arrow-up" aria-hidden="true"></i> you rank it higher than everyone</span><span><i class="ph-bold ph-arrow-down" aria-hidden="true"></i> lower</span><span><i class="ph-bold ph-equals" aria-hidden="true"></i> same</span></p>
      <ol class="tl-cmp" role="list">${cmp.rows.map((r) => {
        const it = S.items[r.id];
        const n = Math.abs(r.d);
        const dir = r.d > 0 ? "up" : r.d < 0 ? "down" : "same";
        const icon = { up: "ph-arrow-up", down: "ph-arrow-down", same: "ph-equals" }[dir];
        const txt = dir === "same" ? "same" : `${n} ${dir === "up" ? "higher" : "lower"}`;
        const sr = dir === "same" ? "Same tier as everyone." : `You rank it ${n} tier${n > 1 ? "s" : ""} ${dir === "up" ? "higher" : "lower"} than everyone.`;
        return `<li class="tl-cmp__row">
          <span class="tl-cmp__img" aria-hidden="true">${it.img ? imgHTML(it) : esc(it.name.slice(0, 2))}</span>
          <span class="tl-cmp__main"><span class="tl-cmp__name">${esc(it.name)}</span><span class="meta">${Math.round(r.agree)}% put it where you did</span></span>
          <span class="tl-vs" aria-hidden="true">
            <span class="tl-vs__col"><span class="tl-vs__k">You</span><span class="tl-badge" data-tier="${r.yt}">${r.yt}</span></span>
            <span class="tl-delta is-${dir}"><i class="ph-bold ${icon}"></i> ${txt}</span>
            <span class="tl-vs__col"><span class="tl-vs__k">All</span><span class="tl-badge" data-tier="${r.ct}">${r.ct}</span></span>
          </span>
          <span class="sr-only">You: ${r.yt}. Everyone: ${r.ct}. ${sr}</span>
        </li>`;
      }).join("")}</ol>
      <div class="tl-card-acts"><button class="btn" type="button" data-act="remix-edit"><i class="ph ph-pencil-simple" aria-hidden="true"></i> Edit my ranking</button><button class="btn btn--ghost" type="button" data-act="unvote">Remove mine</button></div>`;
  }

  // ------------------------------------------------------------ flows
  function post() {
    S.title = ($("#tl-title")?.value || "").trim();
    const place = readPlace();
    if (!S.title) {
      status("Give it a title first.", { warn: true });
      $("#tl-title").focus();
      return;
    }
    if (!TIERS.some((t) => place[t].length)) {
      status("Put at least one thing in a tier first.", { warn: true });
      return;
    }
    const at = new Date().toISOString();
    store.set(K.post, { title: S.title, items: S.items, owner: place, at });
    Object.assign(S, { mode: "view", kind: "draft", owner: place, date: at, tags: [], community: { voters: 0, counts: {} }, tab: "mine" });
    setURL({ from: "draft", tab: null, state: null, q: null });
    render();
    announce("Posted. This is the read-only view people will see.");
    $(".tl-title")?.focus?.();
  }
  function editPost() {
    const place = sanitize(S.owner, S.items);
    Object.assign(S, { mode: "edit", kind: "new", place });
    setURL({ from: null, tab: null });
    render();
    save();
  }
  function remix(prefill) {
    const saved = !prefill && store.get(K.remix);
    let place;
    if (prefill && S.vote) place = sanitize(S.vote, S.items);
    else if (saved && saved.place) place = sanitize(saved.place, S.items);
    else {
      place = emptyPlace();
      place.tray = TIERS.flatMap((t) => S.owner[t]);
    }
    Object.assign(S, { mode: "edit", kind: "remix", place, justVoted: false });
    render();
    announce(`Your copy of ${S.title}: ${place.tray.length} unranked. Drag each into a tier, or select one and pick a tier.`);
    if (mobile.matches) scrollTo({ top: 0, behavior: reduced() ? "auto" : "smooth" });
    $(".tl-tray .tl-item__btn, .tl-board .tl-item__btn")?.focus({ preventScroll: true });
  }
  function submit() {
    const place = readPlace();
    const n = TIERS.reduce((s, t) => s + place[t].length, 0);
    if (!n) {
      status("Place at least one browser first.", { warn: true });
      return;
    }
    S.vote = place;
    store.set(K.vote, { place, at: new Date().toISOString() });
    store.del(K.remix);
    S.community = withVote(baseCounts(), S.vote);
    Object.assign(S, { mode: "view", kind: "tl1", tab: "diff", justVoted: true });
    setURL({ from: "tl1", tab: "diff", state: null });
    render();
    scrollTo({ top: 0, behavior: reduced() ? "auto" : "smooth" });
    announce(`Your ranking is in. ${S.community.voters} voters now.`);
  }
  function unvote() {
    store.del(K.vote);
    S.vote = null;
    S.justVoted = false;
    S.community = baseCounts();
    render();
    announce(`Removed your ranking. Back to ${S.community.voters} voters.`);
  }
  function clearAll() {
    const snap = { title: S.title, items: clone(S.items), place: readPlace() };
    S.items = {};
    S.place = emptyPlace();
    S.title = "";
    render();
    store.del(K.draft);
    status("Cleared.", {
      undo: () => {
        Object.assign(S, { title: snap.title, items: snap.items, place: snap.place });
        render();
        save();
      },
    });
  }

  // ------------------------------------------------------------ events
  app.addEventListener("click", (e) => {
    const a = e.target.closest("[data-act]");
    if (a) {
      const act = a.dataset.act;
      switch (act) {
        case "sugg": R.idx = +a.dataset.i; searchFor(R.sugg[R.idx].name, false); return;
        case "add-cand": {
          const name = R.name;
          const kind = a.dataset.kind;
          const img = kind === "text" ? null : TI.candidates(name).find((c) => c.kind === kind);
          if (addItem(name, img, a.querySelector(".tl-cand__img"))) {
            announce(`Added ${name} to Unranked${kind === "text" ? " as text" : ` with the ${kind} image`}.`);
            status(`Added ${name}.`);
            clearQuery();
            $("#tl-q")?.focus({ preventScroll: true });
          }
          return;
        }
        case "add-multi": return addMany(splitList($("#tl-q").value));
        case "swap": return swapImage(a.dataset.kind);
        case "move": {
          const li = liOf(S.selected);
          if (li) {
            moveTo(li, a.dataset.move, null);
            save();
            $("#tl-insp .tl-mv[aria-pressed='true']")?.focus({ preventScroll: true });
          }
          return;
        }
        case "remove": return removeItem(S.selected);
        case "deselect": {
          const id = S.selected;
          setSelected(null);
          liOf(id)?.querySelector(".tl-item__btn").focus({ preventScroll: true });
          return;
        }
        case "post": return post();
        case "clear": return clearAll();
        case "undo": { const u = status.undo; status.undo = null; u && u(); status(S.kind === "new" ? savedLine() : ""); return; }
        case "edit-post": return editPost();
        case "remix": return remix(false);
        case "remix-edit": return remix(true);
        case "cancel-remix": S.mode = "view"; S.kind = "tl1"; render(); return;
        case "submit": return submit();
        case "unvote": return unvote();
        case "tab-diff": return setTab("diff");
        case "agg":
          S.agg = a.dataset.agg;
          setURL({ agg: S.agg === "mode" ? null : S.agg });
          $$('[data-act="agg"]').forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.agg === S.agg)));
          if (S.tab === "diff") renderDiff();
          else placeView(true);
          announce(S.agg === "mean" ? "Placed by average tier." : "Placed by most votes.");
          return;
      }
    }
    const tab = e.target.closest(".tl-tab");
    if (tab) return setTab(tab.dataset.tab);

    // keyboard / assistive-tech activation of an item (pointer taps come from the drag controller)
    const ib = e.target.closest(".tl-item__btn");
    if (ib && S.mode === "view") return setSelected(ib.closest(".tl-item").dataset.id);
    if (ib && e.detail === 0 && performance.now() - lastKey > 300) return setSelected(ib.closest(".tl-item").dataset.id);

    // tap-to-select, then tap a tier
    if (S.mode === "edit" && S.selected && !e.target.closest(".tl-item, .tl-insp, button, a, input")) {
      const row = e.target.closest(".tl-tier, .tl-tray");
      if (row) {
        const li = liOf(S.selected);
        const z = row.classList.contains("tl-tray") ? "tray" : row.dataset.tier;
        if (li && zoneOf(li) !== z) { moveTo(li, z, null); save(); }
      }
    }
  });

  app.addEventListener("keydown", (e) => {
    const tab = e.target.closest && e.target.closest(".tl-tab");
    if (tab && ["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
      const order = ["mine", "everyone", "diff"];
      let i = order.indexOf(S.tab);
      i = e.key === "Home" ? 0 : e.key === "End" ? 2 : (i + (e.key === "ArrowRight" ? 1 : 2)) % 3;
      e.preventDefault();
      return setTab(order[i], true);
    }
    onKey(e);
  });
  app.addEventListener("focusout", (e) => {
    if (kb && e.target.closest && e.target.closest(".tl-item") === kb.li) {
      // moving the element in the DOM blurs it for a tick; only drop if focus really left
      setTimeout(() => {
        if (kb && !kb.li.contains(document.activeElement)) kbDrop();
      }, 0);
    }
  });

  app.addEventListener("input", (e) => {
    if (e.target.id === "tl-q") onQuery(e.target.value, false);
    if (e.target.id === "tl-title") { S.title = e.target.value.replace(/\s*\n\s*/g, " "); autosize(e.target); save(); }
  });
  app.addEventListener("change", (e) => {
    if (e.target.id === "tl-rename") rename(e.target.value);
  });
  app.addEventListener("submit", (e) => {
    if (e.target.id === "tl-add-form") { e.preventDefault(); addFromInput(); }
  });
  app.addEventListener("keydown", (e) => {
    if (e.target.id === "tl-rename" && e.key === "Enter") { e.preventDefault(); rename(e.target.value); e.target.blur(); }
    if (e.target.id === "tl-q" && e.key === "Escape") clearQuery();
    if (e.target.id === "tl-title" && e.key === "Enter") { e.preventDefault(); $("#tl-q")?.focus(); }
  });
  app.addEventListener("paste", (e) => {
    if (e.target.id !== "tl-q") return;
    const text = (e.clipboardData || window.clipboardData)?.getData("text") || "";
    const parts = splitList(text);
    if (parts.length > 1) { e.preventDefault(); addMany(parts); }
  });
  addEventListener("resize", () => { if (S.mode === "view") moveThumb(); });

  // ------------------------------------------------------------ drag controller
  const drag = window.TierDrag.create({
    root: app,
    layer,
    itemSel: ".tl-item",
    enabled: () => S.mode === "edit" && !kb,
    items: allItems,
    zones: () => {
      const z = [];
      const tray = $(".tl-tray");
      if (tray) z.push({ zone: zoneEl("tray"), hit: tray }); // on mobile the shelf floats above the board: test it first
      for (const t of TIERS) z.push({ zone: zoneEl(t), hit: $(`.tl-tier[data-tier="${t}"]`) });
      return z;
    },
    shelfTop: () => (mobile.matches ? $(".tl-tray")?.getBoundingClientRect().top : null),
    onTap: (li) => {
      setSelected(li.dataset.id);
      li.querySelector(".tl-item__btn").focus({ preventScroll: true });
    },
    onStart: (li) => {
      if (S.selected && S.selected !== li.dataset.id) setSelected(null);
    },
    onOver: (zone) => {
      $$(".is-over").forEach((n) => n.classList.remove("is-over"));
      if (zone) (zone.closest(".tl-tier") || zone.closest(".tl-tray"))?.classList.add("is-over");
    },
    onDrop: (li, info) => {
      const name = S.items[li.dataset.id].name;
      const z = zoneOf(li);
      if (info.cancelled || info.outside) announce(`${name} went back to ${ZNAME[z]}.`);
      else announce(`Dropped ${name} in ${ZNAME[z]}, position ${idxOf(li) + 1} of ${itemsIn(z).length}.`);
      if (S.selected === li.dataset.id) placeInspectorSync(li);
      save();
    },
  });

  // ------------------------------------------------------------ boot
  // wait for web fonts (layout depends on them) but never longer than ~0.8 s
  const fontsReady = () => Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise((r) => setTimeout(r, 800))]);
  init();
  render();
  if (S.mode === "edit" && S.kind === "new" && S.query) {
    $("#tl-q").value = S.query;
    onQuery(S.query, true);
  }
  if (STATE === "dragging") {
    const go = () => {
      const li = liOf("arc") || allItems().find((n) => zoneOf(n) === "tray");
      const target = itemsIn("A")[0];
      if (!li) return;
      let x, y;
      if (target) {
        const r = target.getBoundingClientRect();
        x = r.left + r.width * 0.3;
        y = r.top + r.height * 0.45;
      } else {
        const r = zoneEl("A").getBoundingClientRect();
        x = r.left + 50;
        y = r.top + r.height / 2;
      }
      drag.simulate(li, x - 6, y - 10);
    };
    fontsReady().then(() => setTimeout(go, 120));
  }
  if (S.mode === "view") fontsReady().then(moveThumb);
  // ?select=<id> opens the inspector (edit) or the breakdown (post view) for that item
  const sel = params.get("select");
  if (sel && liOf(sel)) fontsReady().then(() => setSelected(sel, true));

  window.Yarn.mockPanel([
    { label: "Skin", param: "skin", options: [["yarn", "Yarn"], ["ethereal", "Ethereal"]], default: "yarn" },
    { label: "List", param: "from", options: [["", "New list"], ["tl1", "Browsers post"]], default: "" },
    { label: "Post tab", param: "tab", options: [["mine", "Mine"], ["everyone", "Everyone"], ["diff", "You vs everyone"]], default: "mine" },
    { label: "Freeze", param: "state", options: [["", "Live"], ["editing", "Editing"], ["dragging", "Mid-drag"], ["results", "Results"]], default: "" },
    { label: "Search text", param: "q", options: [["", "None"], ["arc", "arc"], ["ghostty", "ghostty"], ["Arc, Zen, Firefox", "Pasted list"]], default: "" },
    { label: "Consensus", param: "agg", options: [["mode", "Most votes"], ["mean", "Average"]], default: "mode" },
    { label: "Selected item", param: "select", options: [["", "None"], ["orion", "Orion"], ["helium", "Helium"]], default: "" },
  ]);

  // expose for poking around in devtools
  window.TierList = { S, consensus, compare, stats };
})();
