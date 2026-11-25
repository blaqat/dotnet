/* ============================================================
   Thoughts · tier list page (iteration 2, mock-only)
   tier.html?id=tl1
     &mode=owner (default) | everyone | add | you
       owner     blaqat's ranking
       everyone  the aggregate: each item in the tier most people chose, with vote bars
       add       "Add your ranking": drag (mouse / long-press on touch), keyboard
                 (Space picks up · ↑↓ tiers · ←→ order · Space drops · 1–5 / S A B C D place · Esc),
                 or tap an item then tap a tier. Saving reveals You vs everyone.
       you       your ranking with everyone's tier on each item + a summary
     &you=demo        a sample saved ranking (review only, never stored)
     &state=picked|dragging   frozen add-mode review states (never stored)
   Only the owner creates tier lists (Studio). Visitors add their own ranking
   and comment. Comments + your ranking live in this browser only.
   Kit: detail shell, badges/dates/tags, seg, btn, ycard, ysel/ylift, sounds.
   Reused from iteration 1: tier-drag.js (springs + pointer drag), tier-images.js (item art).
   ============================================================ */
(() => {
  "use strict";
  const Y = window.Yarn, TH = window.TH, TD = window.TierDrag, TI = window.TierImages;
  const P = Y.params;
  const esc = Y.esc;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const app = document.getElementById("tl");
  const layer = document.getElementById("tl-layer");
  const live = document.getElementById("tl-live");
  const reduced = () => Y.reduced();
  const sound = (n, o) => Y.sound(n, o);
  const { TIERS } = TH;
  const ZONES = [...TIERS, "tray"];
  const ZNAME = { S: "S tier", A: "A tier", B: "B tier", C: "C tier", D: "D tier", tray: "Unranked" };
  const RATE = { S: 1.2, A: 1.1, B: 1, C: 0.9, D: 0.84, tray: 0.8 };
  const STATE = P.get("state") || "";
  const announce = (s) => { live.textContent = ""; requestAnimationFrame(() => (live.textContent = s)); };
  const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;

  const post = TH.byId[P.get("id") || "tl1"];
  if (!post || post.type !== "tierlist") {
    app.innerHTML = `<div class="tl-missing"><p class="h2">That ranking wandered off.</p><a class="btn" href="stitched.html"><i class="ph-bold ph-arrow-left" aria-hidden="true"></i>All thoughts</a></div>`;
    Y.mockPanel([]);
    return;
  }
  document.title = `${post.title} · Thoughts`;
  const NAMES = TH.tierItems(post);
  const SLUG = (n) => Y.slug(n);
  const ART = Object.fromEntries(NAMES.map((n) => [n, TI ? TI.svg(TI.best(n), n) : ""]));

  let vote = TH.myVote(post);
  const want = P.get("mode");
  let mode = ["owner", "everyone", "add", "you"].includes(want) ? want : "owner";
  if (mode === "you" && !vote) mode = "add";
  if (STATE) mode = "add";
  let place = null;   // add mode: { S:[], …, tray:[] } (DOM is the truth while editing; read back after each move)
  let sel = null;     // the picked item (tap or keyboard)
  let selFrom = null; // where it was picked from (Esc puts it back)

  /* ============================================================
     MARKUP
     ============================================================ */
  const agg = () => TH.aggregate(post, mode === "add" ? null : vote);
  function itemHTML(n, t, m, A) {
    const it = A.items[n];
    let extra = "";
    if (m === "everyone") {
      extra = `<span class="tl-bars" aria-hidden="true">${it.pct.map((v, i) => `<b data-tier="${TIERS[i]}" style="--v:${Math.max(6, v * 1.6).toFixed(1)}%"${TIERS[i] === it.best ? ' class="is-best"' : ""}></b>`).join("")}</span>
        <span class="tl-pct">${it.bestPct}% ${it.best}<span class="sr-only"> of ${A.voters} people put it in ${it.best}</span></span>`;
    } else if (m === "you") {
      const d = TIERS.indexOf(it.best) - TIERS.indexOf(t);
      extra = `<span class="tl-vs" data-tier="${it.best}" data-diff="${d < 0 ? "up" : d > 0 ? "down" : "same"}" title="Everyone: ${it.best}"><b aria-hidden="true">${it.best}</b><i class="ph-bold ${d < 0 ? "ph-arrow-up" : d > 0 ? "ph-arrow-down" : "ph-check"}" aria-hidden="true"></i><span class="sr-only">. Everyone put it in ${it.best}${d < 0 ? ", higher than you" : d > 0 ? ", lower than you" : ", same as you"}</span></span>`;
    }
    const inner = `<span class="tl-art" aria-hidden="true">${ART[n]}</span><span class="tl-name">${esc(n)}</span>${extra}`;
    if (m === "add") return `<li class="tl-item" data-key="${SLUG(n)}" data-name="${esc(n)}"><button type="button" class="tl-tile ysel ylift" aria-pressed="false" aria-describedby="tl-help">${inner}</button></li>`;
    return `<li class="tl-item" data-key="${SLUG(n)}" data-name="${esc(n)}"><div class="tl-tile">${inner}</div></li>`;
  }
  function rowsFor(m, A) {
    if (m === "owner") return post.tiers;
    if (m === "everyone") return TH.crowdTiers(post, A);
    if (m === "you") return vote.tiers;
    return place;
  }
  function boardHTML(m) {
    const A = agg(), rows = rowsFor(m, A);
    const label = { owner: `${TH.OWNER}'s ranking`, everyone: `Everyone's ranking, ${A.voters} people`, you: "Your ranking, with everyone's tier on each item", add: "Your ranking (editing)" }[m];
    return `<ol class="tl-board" data-mode="${m}" aria-label="${esc(label)}">${TIERS.map((t) => {
      const names = rows[t] || [];
      const key = m === "add"
        ? `<button type="button" class="tl-key" data-tier="${t}" data-move="${t}" aria-label="Put the picked item in ${t} tier"><b>${t}</b></button>`
        : `<div class="tl-key" data-tier="${t}" aria-hidden="true"><b>${t}</b></div>`;
      return `<li class="tl-row" data-tier="${t}">${key}<ul class="tl-zone" data-zone="${t}" aria-label="${t} tier${m === "add" ? "" : `, ${plural(names.length, "item")}`}">${names.map((n) => itemHTML(n, t, m, A)).join("")}<li class="tl-empty" aria-hidden="true">${m === "add" ? "drop here" : "nothing landed here"}</li></ul></li>`;
    }).join("")}</ol>`;
  }
  const trayHTML = () => `<section class="ycard tl-tray" aria-labelledby="tl-tray-h">
      <h3 class="eyebrow tl-tray__h" id="tl-tray-h">Unranked <span class="meta" data-tray-n>${place.tray.length}</span></h3>
      <ul class="tl-zone" data-zone="tray" aria-label="Unranked">${place.tray.map((n) => itemHTML(n, "tray", "add", agg())).join("")}<li class="tl-empty" aria-hidden="true">all placed</li></ul>
    </section>`;

  // crowd notes: favorite, most split, least loved
  function notesHTML(A) {
    const items = Object.values(A.items);
    const fav = [...items].sort((a, b) => b.mean - a.mean)[0];
    const low = [...items].sort((a, b) => a.mean - b.mean)[0];
    const split = [...items].sort((a, b) => a.bestPct - b.bestPct)[0];
    const row = (lab, it, txt) => `<li class="tl-note"><span class="tl-note__art" aria-hidden="true">${ART[it.name]}</span><span><span class="eyebrow">${lab}</span><b>${esc(it.name)}</b> <span class="meta">${txt}</span></span></li>`;
    return `<ul class="tl-notes">${row("Crowd favorite", fav, `${Math.round(fav.pct[0])}% put it in S`)}${row("Most split", split, `no tier past ${split.bestPct}%`)}${row("Least loved", low, `${Math.round(low.pct[4])}% put it in D`)}</ul>`;
  }
  const dots = (n, of) => `<span class="tl-dots" aria-hidden="true">${Array.from({ length: of }, (_, i) => `<b${i < n ? ' class="on"' : ""}></b>`).join("")}</span>`;
  function sideHTML(m) {
    const A = agg();
    if (m === "add") return `${trayHTML()}
      <div class="ycard tl-card tl-help" id="tl-help">
        <p class="eyebrow">How to rank</p>
        <ul class="tl-howto">
          <li><i class="ph-bold ph-hand-grabbing" aria-hidden="true"></i><span><b>Drag</b> items into tiers (on a phone, press and hold first).</span></li>
          <li><i class="ph-bold ph-hand-tap" aria-hidden="true"></i><span><b>Tap</b> an item, then tap a tier.</span></li>
          <li><i class="ph-bold ph-keyboard" aria-hidden="true"></i><span><kbd>Space</kbd> picks up, <kbd>↑</kbd><kbd>↓</kbd> change tier, <kbd>←</kbd><kbd>→</kbd> reorder, <kbd>Space</kbd> drops. <kbd>1</kbd>–<kbd>5</kbd> place it in S–D.</span></li>
        </ul>
      </div>`;
    if (m === "you") {
      const mine = (n) => TH.tierOfVote(vote, n);
      const ranked = NAMES.filter(mine);
      const withCrowd = ranked.filter((n) => mine(n) === A.items[n].best).length;
      const withOwner = ranked.filter((n) => mine(n) === TH.ownerTierOf(post, n)).length;
      const splits = ranked.map((n) => ({ n, d: TIERS.indexOf(mine(n)) - TIERS.indexOf(A.items[n].best) })).filter((x) => x.d).sort((a, b) => Math.abs(b.d) - Math.abs(a.d)).slice(0, 3);
      return `<div class="ycard tl-card tl-sum">
          <p class="eyebrow">You vs everyone</p>
          <div class="tl-sum__row"><b class="tl-big" data-count="${withCrowd}">${withCrowd}</b><span><span class="tl-sum__of">of ${ranked.length}</span> match where most people put them</span></div>
          ${dots(withCrowd, ranked.length)}
          <div class="tl-sum__row"><b class="tl-big" data-count="${withOwner}">${withOwner}</b><span><span class="tl-sum__of">of ${ranked.length}</span> match ${TH.OWNER}'s ranking</span></div>
          ${dots(withOwner, ranked.length)}
          ${splits.length ? `<p class="eyebrow tl-sum__h">Where you split</p><ul class="tl-splits">${splits.map(({ n, d }) => `<li><span class="tl-note__art" aria-hidden="true">${ART[n]}</span><b>${esc(n)}</b><span class="tl-split"><span class="tl-chipk" data-tier="${mine(n)}">you ${mine(n)}</span><i class="ph-bold ${d > 0 ? "ph-arrow-up" : "ph-arrow-down"}" aria-hidden="true"></i><span class="tl-chipk" data-tier="${A.items[n].best}">all ${A.items[n].best}</span><span class="sr-only">${d > 0 ? "Everyone ranks it higher" : "Everyone ranks it lower"}</span></span></li>`).join("")}</ul>` : `<p class="tl-sum__agree">You agree with the crowd on every one. Suspicious.</p>`}
          <p class="meta tl-sum__note">Your ranking is counted: ${A.voters} people now.</p>
        </div>
        <div class="ycard tl-card"><p class="eyebrow">Crowd notes</p>${notesHTML(A)}</div>`;
    }
    if (m === "everyone") return `<div class="ycard tl-card tl-count">
        <p class="eyebrow">Everyone's ranking</p>
        <p class="tl-count__n"><b>${A.voters}</b><span>people ranked these${A.withYou ? ", you included" : ""}</span></p>
        <p class="tl-legend"><span class="tl-bars tl-bars--legend" aria-hidden="true">${TIERS.map((t, i) => `<b data-tier="${t}" style="--v:${[70, 52, 38, 24, 14][i]}%"></b>`).join("")}</span><span class="meta">bars = share of votes, S → D. Each item sits in the tier most people chose.</span></p>
      </div>
      <div class="ycard tl-card"><p class="eyebrow">Crowd notes</p>${notesHTML(A)}</div>`;
    return `<div class="ycard tl-card tl-by">
        <div class="tl-by__who"><span class="tl-ava tl-ava--owner" aria-hidden="true">${Y.catSVG("", "#fff")}</span><span><b>${TH.OWNER}</b><span class="meta">ranked these ${Y.fmt.day(Y.parseDate(post.date))}</span></span></div>
        <p>Ten browsers I've actually lived in for a month or more. Helium is the quiet one that stuck.</p>
        <p class="meta">${A.voters} people added their own ranking${vote ? ", you included" : ""}.</p>
      </div>
      <div class="ycard tl-card"><p class="eyebrow">Crowd notes</p>${notesHTML(A)}</div>`;
  }
  function footHTML(m) {
    const nC = TH.comments(post).length;
    const comments = `<a class="btn btn--ghost btn--sm" href="#comments" aria-label="${plural(nC, "comment")}"><i class="ph-bold ph-chat-circle" aria-hidden="true"></i>${nC}<span class="tl-l-long">&nbsp;comment${nC === 1 ? "" : "s"}</span></a>`;
    if (m === "add") {
      const n = NAMES.length - place.tray.length;
      return `<button type="button" class="btn btn--ghost btn--sm" data-act="cancel" aria-label="Cancel"><i class="ph-bold ph-x tl-l-x" aria-hidden="true"></i><span class="tl-l-long">Cancel</span></button>
        <span class="meta tl-foot__n" aria-live="polite">${n} of ${NAMES.length}<span class="tl-l-long"> placed</span></span>
        <span class="ydetail__spacer"></span>
        <button type="button" class="btn btn--sm" data-act="${n ? "reset" : "start"}">${n ? `<i class="ph-bold ph-arrow-counter-clockwise" aria-hidden="true"></i><span class="tl-l-long">Start over</span><span class="tl-l-short">Reset</span>` : `<i class="ph-bold ph-copy" aria-hidden="true"></i><span class="tl-l-long">Start from ${TH.OWNER}'s</span><span class="tl-l-short">Use ${TH.OWNER}'s</span>`}</button>
        <button type="button" class="btn btn--red btn--sm" data-act="save"${n ? "" : " disabled"}><i class="ph-bold ph-check" aria-hidden="true"></i>${vote ? "Save" : "Add"}<span class="tl-l-long"> my ranking</span></button>`;
    }
    if (vote) return `<button type="button" class="btn btn--red btn--sm" data-act="${m === "you" ? "edit" : "you"}">${m === "you" ? `<i class="ph-bold ph-pencil-simple" aria-hidden="true"></i>Edit your ranking` : `<i class="ph-bold ph-scales" aria-hidden="true"></i>You vs everyone`}</button>
      ${m === "you" ? `<button type="button" class="ylinkbtn" data-act="remove">Remove mine</button>` : ""}<span class="ydetail__spacer"></span>${comments}`;
    return `<button type="button" class="btn btn--red btn--sm" data-act="add"><i class="ph-bold ph-plus" aria-hidden="true"></i>Add your ranking</button>
      <span class="meta tl-foot__n tl-hide-s">${agg().voters} people did · takes a minute</span><span class="ydetail__spacer"></span>${comments}`;
  }
  const segHTML = () => Y.seg([
    { value: "owner", label: `${TH.OWNER}'s` },
    { value: "everyone", label: "Everyone" },
    { value: "you", label: vote ? "You vs everyone" : "Add yours" },
  ], { value: mode === "add" ? "you" : mode, label: "Whose ranking to show", name: "tl-mode" });

  /* ---------- comments (seed + this browser's) ---------- */
  const AVA = ["var(--red)", "#2b2828", "var(--gold-deep)", "var(--blue-deep)", "var(--purple-deep)"];
  const ava = (c) => c.owner
    ? `<span class="tl-ava tl-ava--owner" aria-hidden="true">${Y.catSVG("", "#fff")}</span>`
    : `<span class="tl-ava" style="--ava:${AVA[Y.hash(c.name) % AVA.length]}" aria-hidden="true">${esc((c.name || "?")[0].toUpperCase())}</span>`;
  let likedSet = TH.liked(post);
  function commentHTML(c, replies = []) {
    const rk = c.ranked ? Object.entries(c.ranked).filter(([n]) => n && n !== "undefined").map(([n, t]) => `<span class="tl-rk"><span class="tl-chipk" data-tier="${t}">${t}</span>${esc(n)}</span>`).join("") : "";
    const on = likedSet.has(c.id), n = (c.likes || 0) + (on ? 1 : 0);
    return `<li class="tl-c" data-key="${esc(c.id)}" id="c-${esc(c.id)}">
      <article class="tl-c__card${c.owner ? " is-owner" : ""}" aria-labelledby="c-${esc(c.id)}-n">
        ${ava(c)}
        <div class="tl-c__body">
          <header class="tl-c__head"><b id="c-${esc(c.id)}-n">${esc(c.name || "Anonymous")}</b>${c.owner ? `<span class="tl-author">author</span>` : ""}${c.mine ? `<span class="tl-author tl-author--you">you</span>` : ""}<time class="ydate" datetime="${esc(c.when)}">${TH.ago(c.when)}</time>${rk ? `<span class="tl-c__rk" aria-label="their ranking">${rk}</span>` : ""}</header>
          <p class="tl-c__text">${esc(c.text)}</p>
          <footer class="tl-c__foot">
            <button type="button" class="tl-like" data-like="${esc(c.id)}" aria-pressed="${on}" aria-label="Like (${n})"><i class="${on ? "ph-fill" : "ph-bold"} ph-heart" aria-hidden="true"></i><span>${n}</span></button>
            ${c.replyTo ? "" : `<button type="button" class="ylinkbtn tl-reply" data-reply="${esc(c.id)}" data-name="${esc(c.name)}">Reply</button>`}
          </footer>
        </div>
      </article>
      ${replies.length ? `<ol class="tl-thread tl-thread--replies">${replies.map((r) => commentHTML(r)).join("")}</ol>` : ""}
    </li>`;
  }
  function threadHTML() {
    const all = TH.comments(post);
    const top = all.filter((c) => !c.replyTo);
    return top.map((c) => commentHTML(c, all.filter((r) => r.replyTo === c.id).sort((a, b) => a.when.localeCompare(b.when)))).join("");
  }
  const commentsHTML = () => {
    const n = TH.comments(post).length;
    let name = "";
    try { name = localStorage.getItem("th:name") || ""; } catch (_) {}
    return `<section class="tl-comments" id="comments" aria-labelledby="cm-h">
      <h2 class="tl-h2" id="cm-h">Comments <span class="meta" data-cm-n>${n}</span></h2>
      <form class="ycard tl-compose" novalidate>
        <div class="tl-compose__who">
          <span class="tl-ava" style="--ava:var(--ink-3)" aria-hidden="true"><i class="ph-bold ph-user"></i></span>
          <label class="sr-only" for="cm-name">Your name (optional)</label>
          <input id="cm-name" class="tl-input" name="name" autocomplete="nickname" maxlength="40" placeholder="Your name (optional)" value="${esc(name)}">
        </div>
        <p class="tl-replying" hidden><span></span><button type="button" class="ylinkbtn" data-act="noreply">Cancel reply</button></p>
        <label class="sr-only" for="cm-text">Comment</label>
        <textarea id="cm-text" class="tl-input tl-text" name="text" rows="3" maxlength="600" placeholder="Agree? Disagree? Say why…"></textarea>
        <div class="tl-compose__foot"><p class="meta">Mock: comments stay in this browser.</p><p class="tl-err" role="alert" hidden>Write something first.</p><button type="submit" class="btn btn--red btn--sm"><i class="ph-bold ph-paper-plane-tilt" aria-hidden="true"></i>Post</button></div>
      </form>
      <ol class="tl-thread" id="tl-thread">${threadHTML()}</ol>
    </section>`;
  };

  /* ============================================================
     PAGE
     ============================================================ */
  function renderPage() {
    const A = agg();
    const meta = `<div class="ymeta">${TH.typeBadge("tierlist")}<span class="meta tl-meta-n"><i class="ph-bold ph-users" aria-hidden="true"></i><span data-voters>${A.voters}</span> ranked</span>${Y.badge.date(post.date, { style: "full" })}<span class="meta">by ${TH.OWNER}</span></div>${Y.tags(post.tags)}`;
    const body = `
      <div class="tl-bar" id="tl-bar">${segHTML()}</div>
      <div class="tl-grid" id="tl-grid" data-mode="${mode}">
        <section class="tl-main" id="tl-main" aria-label="Board">${boardHTML(mode)}</section>
        <aside class="tl-side" id="tl-side" aria-label="About this ranking">${sideHTML(mode)}</aside>
      </div>
      ${commentsHTML()}`;
    const copy = `<button type="button" class="ylinkicon" data-act="copy" aria-label="Copy link to this ranking" title="Copy link"><i class="ph-bold ph-link" aria-hidden="true"></i></button>`;
    // the kit's detail-page skeleton, wide: the board spans the column and the rail
    app.innerHTML = Y.detailPage(Y.detail({ back: { href: `stitched.html#post-${post.id}`, label: "Thoughts" }, actions: copy, title: post.title, meta, body, links: `<div class="tl-foot" id="tl-foot">${footHTML(mode)}</div>`, wide: true }), { wide: true });
  }
  function syncURL() {
    const u = new URL(location.href);
    mode === "owner" ? u.searchParams.delete("mode") : u.searchParams.set("mode", mode);
    history.replaceState(null, "", u);
  }
  // switch mode: tiles glide to their new tiers (shared FLIP from the kit)
  function setMode(m, { focus = false } = {}) {
    if (m === "you" && !vote) m = "add";
    if (m === "add") place = vote ? Object.fromEntries(ZONES.map((z) => [z, z === "tray" ? NAMES.filter((n) => !TH.tierOfVote(vote, n)) : [...(vote.tiers[z] || [])]])) : Object.fromEntries(ZONES.map((z) => [z, z === "tray" ? [...NAMES] : []]));
    const prev = mode;
    mode = m; sel = null;
    const grid = $("#tl-grid");
    Y.flip(grid, ".tl-item[data-key]", () => {
      grid.dataset.mode = m;
      $("#tl-main").innerHTML = boardHTML(m);
      $("#tl-side").innerHTML = sideHTML(m);
    }, { response: 0.5, exit: false });
    $("#tl-bar").innerHTML = segHTML();
    $("#tl-foot").innerHTML = footHTML(m);
    $("[data-voters]").textContent = agg().voters;
    syncURL();
    if (m === "add" && prev !== "add") sound("open");
    if (prev === "add" && m !== "add") sound("close");
    if (m === "you") revealYou();
    if (focus) $(m === "add" ? ".tl-tile" : `.yseg__btn[data-v="${m === "add" ? "you" : m}"]`)?.focus({ preventScroll: true });
    announce({ owner: `${TH.OWNER}'s ranking`, everyone: "Everyone's ranking", add: "Adding your ranking. Every item starts unranked.", you: "Your ranking compared with everyone" }[m]);
  }
  // You vs everyone: badges pop in one by one, the numbers count up
  function revealYou() {
    if (reduced()) return;
    $$(".tl-vs").forEach((b, i) => b.animate([{ opacity: 0, transform: "scale(.4)" }, { opacity: 1, transform: "scale(1.15)", offset: .6 }, { opacity: 1, transform: "none" }], { duration: 420, delay: 160 + i * 45, easing: "cubic-bezier(.2,.8,.2,1)", fill: "backwards" }));
    $$(".tl-big[data-count]").forEach((el) => {
      const to = +el.dataset.count, t0 = performance.now();
      const step = (t) => { const k = Math.min(1, (t - t0) / 700); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    });
  }

  /* ============================================================
     ADD YOUR RANKING: drag · keyboard · tap-to-move
     ============================================================ */
  const items = () => $$(".tl-grid .tl-item");
  const zoneEl = (z) => $(`.tl-zone[data-zone="${z}"]`);
  const zoneOf = (li) => li.parentElement?.dataset.zone;
  const indexIn = (li) => $$(".tl-item", li.parentElement).indexOf(li);
  function readPlace() {
    place = Object.fromEntries(ZONES.map((z) => [z, $$(".tl-item", zoneEl(z)).map((li) => li.dataset.name)]));
    const n = NAMES.length - place.tray.length;
    const tn = $("[data-tray-n]"); if (tn) tn.textContent = place.tray.length;
    $("#tl-foot").innerHTML = footHTML("add");
    return n;
  }
  function setSel(li, { from = true } = {}) {
    if (sel && sel !== li) $(".tl-tile", sel)?.setAttribute("aria-pressed", "false");
    sel = li;
    selFrom = li && from ? { zone: zoneOf(li), index: indexIn(li) } : selFrom;
    $("#tl-grid").classList.toggle("is-picking", !!li);
    if (li) $(".tl-tile", li).setAttribute("aria-pressed", "true");
  }
  function moveTo(li, z, index = Infinity, { focus = true, quiet = false } = {}) {
    const zone = zoneEl(z);
    if (!zone) return;
    TD.flip(items(), () => {
      const kids = $$(".tl-item", zone).filter((c) => c !== li);
      zone.insertBefore(li, kids[Math.min(index, kids.length)] || $(".tl-empty", zone));
    });
    readPlace();
    if (focus) { const b = $(".tl-tile", li); b.focus({ preventScroll: true }); b.scrollIntoView({ block: "nearest", behavior: "auto" }); }
    if (!quiet) announce(`${li.dataset.name}: ${ZNAME[z]}, ${indexIn(li) + 1} of ${$$(".tl-item", zone).length}`);
  }
  function drop(li, z) {
    sound(z === "tray" ? "chip-off" : "drop", { el: li, rate: RATE[z] });
    setSel(null);
    announce(`Dropped ${li.dataset.name} in ${ZNAME[z]}.`);
  }
  // tap-to-move: tap an item (picks it), tap a tier (puts it there)
  function pickItem(li) {
    if (sel === li) { setSel(null); announce(`Put ${li.dataset.name} down.`); return; }
    setSel(li);
    sound("pickup", { el: li });
    $(".tl-tile", li).focus({ preventScroll: true });
    announce(`Picked ${li.dataset.name}. Tap a tier, or use the arrow keys.`);
  }
  let drag = null;
  function wireDrag() {
    if (!TD) return;
    drag = TD.create({
      root: $("#tl-grid"),
      layer,
      itemSel: ".tl-item",
      enabled: () => mode === "add",
      items,
      zones: () => ZONES.map((z) => zoneEl(z)).filter(Boolean).map((zone) => ({ zone, hit: zone.closest(".tl-row, .tl-tray") })),
      onTap: (li) => pickItem(li),
      onStart: (li) => { setSel(null); sound("pickup", { el: li }); },
      onOver: (zone) => $$(".tl-row, .tl-tray").forEach((r) => r.classList.toggle("is-over", !!zone && r.contains(zone))),
      onDrop: (li, info) => {
        $$(".is-over").forEach((r) => r.classList.remove("is-over"));
        readPlace();
        const z = zoneOf(li);
        if (info.cancelled) { announce(`Cancelled. ${li.dataset.name} went back.`); return; }
        sound(info.outside ? "nope" : z === "tray" ? "chip-off" : "drop", { el: li, rate: RATE[z] });
        announce(`${li.dataset.name}: ${ZNAME[z]}.`);
      },
      shelfTop: () => null,
    });
  }
  // keyboard on a tile
  app.addEventListener("keydown", (e) => {
    if (mode !== "add") return;
    const b = e.target.closest?.(".tl-tile");
    if (!b) return;
    const li = b.closest(".tl-item"), z = zoneOf(li), zi = ZONES.indexOf(z);
    const k = e.key;
    if (k === " " || k === "Enter") {
      e.preventDefault();
      if (sel === li) drop(li, z);
      else { setSel(li); sound("pickup", { el: li }); announce(`Picked up ${li.dataset.name} in ${ZNAME[z]}. Up and down change tier, left and right reorder, Space drops, Escape cancels.`); }
      return;
    }
    const direct = { 1: "S", 2: "A", 3: "B", 4: "C", 5: "D", 0: "tray", s: "S", a: "A", b: "B", c: "C", d: "D", u: "tray" }[k.toLowerCase()];
    if (direct && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); moveTo(li, direct, Infinity, { quiet: true }); drop(li, direct); return; }
    if (sel !== li) return;
    if (k === "ArrowUp" || k === "ArrowDown") {
      e.preventDefault();
      const nz = ZONES[Math.max(0, Math.min(ZONES.length - 1, zi + (k === "ArrowUp" ? -1 : 1)))];
      if (nz !== z) { moveTo(li, nz, indexIn(li)); sound("tap", { rate: RATE[nz] }); }
    } else if (k === "ArrowLeft" || k === "ArrowRight") {
      e.preventDefault();
      const i = indexIn(li) + (k === "ArrowLeft" ? -1 : 1);
      if (i >= 0 && i < $$(".tl-item", li.parentElement).length) moveTo(li, z, i);
    } else if (k === "Escape") {
      e.preventDefault(); e.stopPropagation();
      if (selFrom) moveTo(li, selFrom.zone, selFrom.index, { quiet: true });
      setSel(null);
      announce(`Cancelled. ${li.dataset.name} went back.`);
    }
  });

  /* ============================================================
     EVENTS
     ============================================================ */
  app.addEventListener("click", (e) => {
    const t = e.target;
    // tap a tier (or its key) while an item is picked
    if (mode === "add" && sel && !t.closest(".tl-item")) {
      const row = t.closest("[data-move], .tl-row, .tl-tray");
      if (row) {
        const z = row.dataset.move || row.dataset.tier || "tray";
        const li = sel;
        moveTo(li, z);
        drop(li, z);
        return;
      }
    }
    if (t.closest("[data-move]") && !sel) { announce("Pick an item first, then choose its tier."); return; }
    const act = t.closest("[data-act]")?.dataset.act;
    if (act === "add" || act === "edit") return setMode("add", { focus: true });
    if (act === "you") return setMode("you");
    if (act === "cancel") return setMode(vote ? "you" : "owner");
    if (act === "start" || act === "reset") {
      const from = act === "start" ? post.tiers : null;
      TD.flip(items(), () => {
        for (const li of items()) {
          const z = from ? TIERS.find((x) => (from[x] || []).includes(li.dataset.name)) || "tray" : "tray";
          zoneEl(z).insertBefore(li, $(".tl-empty", zoneEl(z)));
        }
        if (from) TIERS.forEach((z) => (from[z] || []).forEach((n) => { const li = $(`.tl-item[data-name="${CSS.escape(n)}"]`, $("#tl-grid")); zoneEl(z).insertBefore(li, $(".tl-empty", zoneEl(z))); }));
      });
      setSel(null);
      readPlace();
      sound(from ? "drop" : "chip-off");
      announce(from ? `Started from ${TH.OWNER}'s ranking. Move anything you disagree with.` : "Everything is back in Unranked.");
      return;
    }
    if (act === "save") {
      const n = readPlace();
      if (!n) { sound("nope"); return; }
      const tiers = Object.fromEntries(TIERS.map((z) => [z, [...place[z]]]));
      TH.saveVote(post, tiers);
      vote = { tiers, at: new Date().toISOString() };
      sound("post");
      setMode("you");
      requestAnimationFrame(() => { const top = $("#tl-bar").getBoundingClientRect().top; if (top < 0 || top > innerHeight * 0.5) scrollTo(0, scrollY + top - 70); });
      announce(`Saved. ${n} items ranked. Showing you versus everyone.`);
      return;
    }
    if (act === "remove") { TH.clearVote(post); vote = null; sound("tag-remove"); setMode("owner"); announce("Your ranking was removed."); return; }
    if (act === "copy") {
      const b = t.closest("[data-act]");
      try { navigator.clipboard?.writeText(location.href.replace(/[?&]state=[^&]*/, "")); } catch (_) {}
      sound("copy", { el: b });
      b.innerHTML = `<i class="ph-bold ph-check" aria-hidden="true"></i>`; b.setAttribute("aria-label", "Link copied");
      setTimeout(() => { b.innerHTML = `<i class="ph-bold ph-link" aria-hidden="true"></i>`; b.setAttribute("aria-label", "Copy link to this ranking"); }, 1500);
      return;
    }
    if (act === "noreply") return setReply(null);
    const like = t.closest("[data-like]");
    if (like) {
      const id = like.dataset.like, on = !likedSet.has(id);
      on ? likedSet.add(id) : likedSet.delete(id);
      TH.setLiked(post, likedSet);
      const n = +$("span", like).textContent + (on ? 1 : -1);
      like.setAttribute("aria-pressed", String(on)); like.setAttribute("aria-label", `Like (${n})`);
      $("span", like).textContent = n; $("i", like).className = `${on ? "ph-fill" : "ph-bold"} ph-heart`;
      if (on && !reduced()) $("i", like).animate([{ transform: "scale(1)" }, { transform: "scale(1.35)" }, { transform: "scale(1)" }], { duration: 320, easing: "cubic-bezier(.2,.8,.2,1)" });
      sound(on ? "chip-on" : "chip-off", { el: like });
      return;
    }
    const rep = t.closest("[data-reply]");
    if (rep) return setReply({ id: rep.dataset.reply, name: rep.dataset.name });
  });
  app.addEventListener("ychange", (e) => { if (e.detail.name === "tl-mode") setMode(e.detail.value); });

  /* ---------- composer ---------- */
  let replyTo = null;
  function setReply(r) {
    replyTo = r;
    const p = $(".tl-replying");
    p.hidden = !r;
    if (r) { $("span", p).textContent = `Replying to ${r.name}`; $("#cm-text").focus(); }
  }
  app.addEventListener("submit", (e) => {
    if (!e.target.matches(".tl-compose")) return;
    e.preventDefault();
    const text = $("#cm-text").value.trim(), name = $("#cm-name").value.trim();
    const err = $(".tl-err");
    if (!text) { err.hidden = false; $("#cm-text").focus(); sound("nope"); return; }
    err.hidden = true;
    try { if (name) localStorage.setItem("th:name", name); } catch (_) {}
    const top = vote ? Object.fromEntries(TIERS.flatMap((z) => (vote.tiers[z] || []).slice(0, 1).map((n) => [n, z])).slice(0, 1)) : null;
    const c = { id: `u${Date.now().toString(36)}`, name: name || "Anonymous", when: new Date().toISOString(), text, likes: 0, mine: true, ...(replyTo ? { replyTo: replyTo.id } : {}), ...(top ? { ranked: top } : {}) };
    TH.addComment(post, c);
    if (TH.FROZEN) addEphemeral(c);
    const list = $("#tl-thread");
    Y.flip(list, ".tl-c[data-key]", () => { list.innerHTML = threadHTML(); });
    $("[data-cm-n]").textContent = TH.comments(post).length;
    $("#tl-foot").innerHTML = footHTML(mode);
    $("#cm-text").value = "";
    setReply(null);
    sound("post", { el: e.target });
    announce("Comment posted.");
    $(`#c-${CSS.escape(c.id)} .tl-c__card`)?.scrollIntoView({ block: "nearest" });
  });
  // frozen review states never write storage: keep posted comments in memory so the flow still works
  const ephemeral = [];
  const _comments = TH.comments;
  function addEphemeral(c) { ephemeral.unshift(c); }
  TH.comments = (p) => [...ephemeral, ..._comments(p)];

  /* ============================================================
     BOOT
     ============================================================ */
  if (mode === "add") place = vote ? Object.fromEntries(ZONES.map((z) => [z, z === "tray" ? NAMES.filter((n) => !TH.tierOfVote(vote, n)) : [...(vote.tiers[z] || [])]])) : Object.fromEntries(ZONES.map((z) => [z, z === "tray" ? [...NAMES] : []]));
  // review states: a believable half-placed board
  if (STATE) {
    place = { S: ["Helium"], A: ["Zen", "Firefox"], B: ["Safari"], C: [], D: ["Edge"], tray: ["Arc", "Orion", "Vivaldi", "Brave", "Chrome"] };
  }
  renderPage();
  wireDrag();
  syncURL();
  if (STATE === "picked") requestAnimationFrame(() => {
    const li = $('.tl-item[data-name="Arc"]'); setSel(li); $(".tl-tile", li).focus({ preventScroll: true });
    const top = $(".tl-bar").getBoundingClientRect().top; scrollTo(0, scrollY + top - 70);
  });
  if (STATE === "dragging") setTimeout(() => {
    const li = $('.tl-item[data-name="Orion"]'), target = $('.tl-zone[data-zone="B"]');
    if (!li || !target || !drag) return;
    const r = target.getBoundingClientRect();
    const scrollY0 = Math.max(0, $(".tl-board").getBoundingClientRect().top + scrollY - 120);
    scrollTo(0, scrollY0);
    const r2 = target.getBoundingClientRect();
    drag.simulate(li, r2.left + Math.min(260, r2.width * 0.5), r2.top + r2.height / 2 + 6);
    $$(".tl-row").forEach((row) => row.classList.toggle("is-over", row.dataset.tier === "B"));
    void r;
  }, 450);
  if (location.hash === "#comments") requestAnimationFrame(() => document.getElementById("comments")?.scrollIntoView({ block: "start" }));

  Y.mockPanel([
    { label: "Mode", param: "mode", options: [["owner", `${TH.OWNER}'s`], ["everyone", "Everyone"], ["add", "Add your ranking"], ["you", "You vs everyone"]], default: "owner" },
    { label: "Your ranking", param: "you", options: [["", "Saved in this browser"], ["demo", "Sample (review)"]], default: "" },
    { label: "Add mode review state", param: "state", options: [["", "Live"], ["picked", "Item picked"], ["dragging", "Mid-drag"]], default: "" },
  ], { title: "Ranking options" });
})();
