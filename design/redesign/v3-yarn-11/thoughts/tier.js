/* ============================================================
   Thoughts · ranking page (iteration 2; i4: custom tier names, mock-only)
   tier.html?id=tl1 (S–D) | tl3 (the owner's own tiers: 4 named, one long; felt tabs on each row)
     &mode=owner (default) | everyone | add | you
       owner     blaqat's ranking
       everyone  the aggregate: each item in the tier most people chose, with vote bars
       add       "Add your ranking": drag (mouse / long-press on touch), keyboard
                 (Space picks up · ↑↓ tiers · ←→ order · Space drops · 1–5 / S A B C D place · Esc),
                 or tap an item then tap a tier. Saving reveals You vs everyone.
       you       your ranking with everyone's tier on each item + a summary
     &you=demo        a sample saved ranking (review only, never stored)
     &state=picked|dragging   frozen add-mode review states (never stored)
     &item=<slug>     i5: light one item on arrival (an item's write-up links here with it)
   i5 (T1, CONCEPTS.md): the ranking's write-up (an article about it) is a pill in the head; an item with its own
   write-up wears a small round marker on its tile that opens it (not while adding your ranking).
   i6:
     R1 · mention items in a comment by typing @item / #tier (i7 T6, decided: type only; tapping a tile no longer
          mentions it, so a tile on the board is not a control again, as before i6). Mentions in comments light their
          tiles on hover; a mention chip ropes its tile on the board.
     ?wumark=bookmark|pin|label  R3 · an item with a write-up: a red bookmark like an article card's (decided i7) |
                               i5's round pin | a "write-up" tag hanging under the tile (both Earlier)
     R2 · the head's write-up pill is white (the page isn't). R5 · tier A's orange, deeper (contrast, kit yarn.css).
     T2 · Back returns to the feed as you left it (common.js TH.ret).
   i7: T3 · the bookmark sits flush with the tile's top edge · T4 · an empty tier, while adding yours: a chalked patch
     outline where the next tile goes · T5 · a mention chip's art is a circle, like the pill it sits in
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
  // i4: the ranking's own tiers (default S–D, or the owner's names: any count, any length, palette colours)
  const DEFS = TH.tierDefs(post);
  const TIERS = DEFS.map((d) => d.id);
  const DEF = Object.fromEntries(DEFS.map((d) => [d.id, d]));
  const NAMED = Y.post.tiersNamed(post);
  const N = TIERS.length;
  const ZONES = [...TIERS, "tray"];
  const ZNAME = { ...Object.fromEntries(DEFS.map((d) => [d.id, NAMED ? d.label : `${d.label} tier`])), tray: "Unranked" };
  const RATE = { ...Object.fromEntries(TIERS.map((t, i) => [t, +(1.2 - (0.36 * i) / Math.max(1, N - 1)).toFixed(3)])), tray: 0.8 };
  const tc = (t) => DEF[t]?.color || "cotton";
  // a felt chip naming a tier (where you split, comments): the tier's own name, short ones as a round chip
  const chipk = (t, pre = "") => `<span class="tl-chipk" data-tier="${esc(t)}" data-tc="${tc(t)}">${pre}${esc(DEF[t]?.label ?? t)}</span>`;
  // typing a tier: 1–9 by position; a one-letter label (S A B …) by its letter; 0 / U = Unranked
  const KEYMAP = { 0: "tray", u: "tray" };
  DEFS.slice(0, 9).forEach((d, i) => { KEYMAP[i + 1] = d.id; });
  DEFS.forEach((d) => { const k = d.label.toLowerCase(); if (/^[a-z]$/.test(k) && k !== "u" && !(k in KEYMAP)) KEYMAP[k] = d.id; });
  const range = `${DEFS[0].label}–${DEFS[N - 1].label}`;
  const NAMES = TH.tierItems(post);
  const SLUG = (n) => Y.slug(n);
  const ART = Object.fromEntries(NAMES.map((n) => [n, TI ? TI.svg(TI.best(n), n) : ""]));
  const IWU = TH.itemWriteups(post); // i5 (T1): item → its write-ups
  const opt = (k, ok, d) => (ok.includes(P.get(k)) ? P.get(k) : d);
  // i6 (R3, owner: "lets try different design options for this (showing a ranking item has a write up)")
  const WUMARK = opt("wumark", ["bookmark", "pin", "label"], "bookmark");
  const wuMark = (n) => {
    const a = IWU.get(n)?.[0];
    if (!a) return "";
    const lab = `Write-up on ${esc(n)}: ${esc(a.title)}`;
    if (WUMARK === "label") return `<a class="tl-wu tl-wu--label ylift" href="${esc(TH.articleHref(a))}" aria-label="${lab}"><i class="ph-bold ph-scroll" aria-hidden="true"></i>write-up</a>`;
    if (WUMARK === "bookmark") return `<a class="tl-wu tl-wu--bookmark" href="${esc(TH.articleHref(a))}" aria-label="${lab}"><span class="tl-wu__tip" aria-hidden="true">Write-up</span></a>`;
    return `<a class="tl-wu ylift" href="${esc(TH.articleHref(a))}" aria-label="${lab}" title="Write-up: ${esc(a.title)}"><i class="ph-bold ph-scroll" aria-hidden="true"></i></a>`;
  };

  let vote = TH.myVote(post);
  const want = P.get("mode");
  let mode = ["owner", "everyone", "add", "you"].includes(want) ? want : "owner";
  if (mode === "you" && !vote) mode = "add";
  if (STATE) mode = "add";
  let place = null;   // add mode: { S:[], …, tray:[] } (DOM is the truth while editing; read back after each move)
  let sel = null;     // the picked item (tap or keyboard)
  let selFrom = null; // where it was picked from (Esc puts it back)
  // add mode starts from your saved ranking (anything you hadn't placed → Unranked), else everything Unranked
  function startPlace() {
    if (!vote) return Object.fromEntries(ZONES.map((z) => [z, z === "tray" ? [...NAMES] : []]));
    return Object.fromEntries(ZONES.map((z) => [z, z === "tray" ? NAMES.filter((n) => !TH.tierOfVote(vote, n, post)) : (vote.tiers[z] || []).filter((n) => NAMES.includes(n))]));
  }

  /* ============================================================
     MARKUP
     ============================================================ */
  const agg = () => TH.aggregate(post, mode === "add" ? null : vote);
  function itemHTML(n, t, m, A) {
    const it = A.items[n];
    let extra = "";
    if (m === "everyone") {
      // the tile already sits in the tier most people chose, so a named tier needs no label here: just the share
      const bd = DEF[it.best];
      extra = `<span class="tl-bars" aria-hidden="true">${it.pct.map((v, i) => `<b data-tier="${esc(TIERS[i])}" data-tc="${tc(TIERS[i])}" style="--v:${Math.max(6, v * 1.6).toFixed(1)}%"${TIERS[i] === it.best ? ' class="is-best"' : ""}></b>`).join("")}</span>
        <span class="tl-pct">${it.bestPct}%${NAMED ? "" : ` ${esc(bd.label)}`}<span class="sr-only"> of ${A.voters} people put it in ${esc(ZNAME[it.best])}</span></span>`;
    } else if (m === "you") {
      const d = TIERS.indexOf(it.best) - TIERS.indexOf(t), bd = DEF[it.best];
      // named tiers show their position (1 = top) on the badge; the full name is in the title + for screen readers
      extra = `<span class="tl-vs" data-tier="${esc(it.best)}" data-tc="${bd.color}" data-diff="${d < 0 ? "up" : d > 0 ? "down" : "same"}" title="Everyone: ${esc(bd.label)}"><b aria-hidden="true">${esc(bd.short)}</b><i class="ph-bold ${d < 0 ? "ph-arrow-up" : d > 0 ? "ph-arrow-down" : "ph-check"}" aria-hidden="true"></i><span class="sr-only">. Everyone put it in ${esc(ZNAME[it.best])}${d < 0 ? ", higher than you" : d > 0 ? ", lower than you" : ", same as you"}</span></span>`;
    }
    const inner = `<span class="tl-art" aria-hidden="true">${ART[n]}</span><span class="tl-name">${esc(n)}</span>${extra}`;
    if (m === "add") return `<li class="tl-item" data-key="${SLUG(n)}" data-name="${esc(n)}"><button type="button" class="tl-tile ysel ylift" aria-pressed="false" aria-describedby="tl-help">${inner}</button></li>`;
    // i7 (T6, decided: mentions are typed): outside "add yours" a tile is not a control (as before i6); ysel lets a
    // mention chip in a comment rope it
    const wu = wuMark(n);
    return `<li class="tl-item${wu ? ` has-wu has-wu--${WUMARK}` : ""}" data-key="${SLUG(n)}" data-name="${esc(n)}"><div class="tl-tile ysel">${inner}</div>${wu}</li>`;
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
    // named tiers (i4): the label is a felt tab sewn on top of its row, so any length fits and nothing truncates
    // i7 (T4, owner: "the drop here text is lazy we can do better"): adding yours, an empty tier shows a chalked patch
    // outline exactly where its first tile will sit (a needle in it) and says what to do; picking (tap, then a tier)
    // turns it red and says "Tap to put it here". A drag over it puts the real slot in the same place.
    // i7 · W1 (walkthrough): with a mouse it says "Click to put it here" (desktop was told to tap)
    const put = matchMedia("(hover: hover) and (pointer: fine)").matches ? "Click" : "Tap";
    const empty = m === "add"
      ? `<li class="tl-empty tl-empty--add" aria-hidden="true"><span class="tl-chalk"><i class="ph-bold ph-needle"></i></span><span class="tl-empty__t"><span class="tl-empty__drag">Drag one here</span><span class="tl-empty__tap">${put} to put it here</span></span></li>`
      : `<li class="tl-empty" aria-hidden="true">nothing landed here</li>`;
    return `<ol class="tl-board"${NAMED ? " data-named" : ""} data-mode="${m}" aria-label="${esc(label)}">${DEFS.map((d) => {
      const t = d.id, names = rows[t] || [];
      const key = m === "add"
        ? `<button type="button" class="tl-key" data-tier="${esc(t)}" data-tc="${d.color}" data-move="${esc(t)}" aria-label="Put the picked item in ${esc(ZNAME[t])}"><b>${esc(d.label)}</b></button>`
        : `<div class="tl-key" data-tier="${esc(t)}" data-tc="${d.color}" aria-hidden="true"><b>${esc(d.label)}</b></div>`;
      return `<li class="tl-row" data-tier="${esc(t)}" data-tc="${d.color}">${key}<ul class="tl-zone" data-zone="${esc(t)}" aria-label="${esc(ZNAME[t])}${m === "add" ? "" : `, ${plural(names.length, "item")}`}">${names.map((n) => itemHTML(n, t, m, A)).join("")}${empty}</ul></li>`;
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
    return `<ul class="tl-notes">${row("Crowd favorite", fav, `${Math.round(fav.pct[0])}% put it in ${esc(DEFS[0].label)}`)}${row("Most split", split, `no tier past ${split.bestPct}%`)}${row("Least loved", low, `${Math.round(low.pct[N - 1])}% put it in ${esc(DEFS[N - 1].label)}`)}</ul>`;
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
          <li><i class="ph-bold ph-keyboard" aria-hidden="true"></i><span><kbd>Space</kbd> picks up, <kbd>↑</kbd><kbd>↓</kbd> change tier, <kbd>←</kbd><kbd>→</kbd> reorder, <kbd>Space</kbd> drops. <kbd>1</kbd>–<kbd>${Math.min(9, N)}</kbd> place it ${NAMED ? "in a tier, top first" : `in ${esc(range)}`}.</span></li>
        </ul>
      </div>`;
    if (m === "you") {
      const mine = (n) => TH.tierOfVote(vote, n, post);
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
          ${splits.length ? `<p class="eyebrow tl-sum__h">Where you split</p><ul class="tl-splits${NAMED ? " tl-splits--named" : ""}">${splits.map(({ n, d }) => `<li><span class="tl-note__art" aria-hidden="true">${ART[n]}</span><b>${esc(n)}</b><span class="tl-split">${chipk(mine(n), "you ")}<i class="ph-bold ${d > 0 ? "ph-arrow-up" : "ph-arrow-down"}" aria-hidden="true"></i>${chipk(A.items[n].best, "all ")}<span class="sr-only">${d > 0 ? "Everyone ranks it higher" : "Everyone ranks it lower"}</span></span></li>`).join("")}</ul>` : `<p class="tl-sum__agree">You agree with the crowd on every one. Suspicious.</p>`}
          <p class="meta tl-sum__note">Your ranking is counted: ${A.voters} people now.</p>
        </div>
        <div class="ycard tl-card"><p class="eyebrow">Crowd notes</p>${notesHTML(A)}</div>`;
    }
    if (m === "everyone") return `<div class="ycard tl-card tl-count">
        <p class="eyebrow">Everyone's ranking</p>
        <p class="tl-count__n"><b>${A.voters}</b><span>people ranked these${A.withYou ? ", you included" : ""}</span></p>
        <p class="tl-legend"><span class="tl-bars tl-bars--legend" aria-hidden="true">${TIERS.map((t, i) => `<b data-tier="${esc(t)}" data-tc="${tc(t)}" style="--v:${Math.round(70 - (56 * i) / Math.max(1, N - 1))}%"></b>`).join("")}</span><span class="meta">bars = share of votes, ${NAMED ? "top tier first" : `${esc(DEFS[0].label)} → ${esc(DEFS[N - 1].label)}`}. Each item sits in the tier most people chose.</span></p>
      </div>
      <div class="ycard tl-card"><p class="eyebrow">Crowd notes</p>${notesHTML(A)}</div>`;
    return `<div class="ycard tl-card tl-by">
        <div class="tl-by__who"><span class="tl-ava tl-ava--owner" aria-hidden="true">${Y.catSVG("", "#fff")}</span><span><b>${TH.OWNER}</b><span class="meta">ranked these ${Y.fmt.day(Y.parseDate(post.date))}</span></span></div>
        ${post.note ? `<p>${esc(post.note)}</p>` : ""}
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

  /* ---------- i6 (R1) · mentions: @item and #tier ("smart words similar to search bar") ----------
     A comment's text keeps plain words: "@Helium in #S". Rendering turns each known @item (longest name first, any
     case) into an item chip (its art + name) and each #tier (id or label) into the tier's felt chip. A chip is a
     button: it ropes its tile (or flashes its row) on the board. Hovering a comment lights every tile it refers to. */
  const BY_LOWER = [...NAMES].sort((a, b) => b.length - a.length);
  const TIER_WORDS = DEFS.flatMap((d) => [[d.id, d], [d.label, d]]).sort((a, b) => b[0].length - a[0].length);
  const startsWord = (s, i, w) => s.slice(i, i + w.length).toLowerCase() === w.toLowerCase() && !/[\p{L}\p{N}]/u.test(s[i + w.length] || "");
  // → [{ kind: "text"|"item"|"tier", text, name?, def? }]
  function parseRefs(s) {
    const out = [];
    let buf = "";
    for (let i = 0; i < s.length; i++) {
      const ch = s[i], prev = s[i - 1];
      if ((ch === "@" || ch === "#") && (i === 0 || /[\s(“"'\-]/.test(prev))) {
        const hit = ch === "@" ? BY_LOWER.find((n) => startsWord(s, i + 1, n)) : null;
        const th = ch === "#" ? TIER_WORDS.find(([w]) => startsWord(s, i + 1, w)) : null;
        if (hit || th) {
          if (buf) out.push({ kind: "text", text: buf }), (buf = "");
          const len = 1 + (hit ? hit.length : th[0].length);
          out.push(hit ? { kind: "item", text: s.slice(i, i + len), name: hit } : { kind: "tier", text: s.slice(i, i + len), def: th[1] });
          i += len - 1;
          continue;
        }
      }
      buf += ch;
    }
    if (buf) out.push({ kind: "text", text: buf });
    return out;
  }
  const refChip = (r) => (r.kind === "item"
    ? `<button type="button" class="tl-ref" data-ref="${esc(SLUG(r.name))}" aria-label="${esc(r.name)}: show it on the board"><span class="tl-ref__art" aria-hidden="true">${ART[r.name]}</span>${esc(r.name)}</button>`
    : `<button type="button" class="tl-ref tl-ref--tier" data-reftier="${esc(r.def.id)}" aria-label="${esc(ZNAME[r.def.id])}: show it on the board">${chipk(r.def.id)}</button>`);
  const richText = (s) => parseRefs(String(s || "")).map((r) => (r.kind === "text" ? esc(r.text) : refChip(r))).join("");
  // every tile a comment points at: its mentions + the tiers it shows from the commenter's ranking
  const refsOf = (c) => {
    const ps = parseRefs(String(c.text || ""));
    return { items: [...new Set([...ps.filter((r) => r.kind === "item").map((r) => SLUG(r.name)), ...Object.keys(c.ranked || {}).filter((n) => NAMES.includes(n)).map(SLUG)])],
      tiers: [...new Set(ps.filter((r) => r.kind === "tier").map((r) => r.def.id))] };
  };

  function commentHTML(c, replies = []) {
    const rk = c.ranked ? Object.entries(c.ranked).filter(([n, t]) => n && n !== "undefined" && DEF[t]).map(([n, t]) => `<span class="tl-rk" data-ref="${esc(SLUG(n))}">${chipk(t)}${esc(n)}</span>`).join("") : "";
    const on = likedSet.has(c.id), n = (c.likes || 0) + (on ? 1 : 0);
    const refs = refsOf(c);
    return `<li class="tl-c" data-key="${esc(c.id)}" id="c-${esc(c.id)}">
      <article class="tl-c__card${c.owner ? " is-owner" : ""}" aria-labelledby="c-${esc(c.id)}-n"${refs.items.length ? ` data-refs="${esc(refs.items.join(" "))}"` : ""}${refs.tiers.length ? ` data-reftiers="${esc(refs.tiers.join(" "))}"` : ""}>
        ${ava(c)}
        <div class="tl-c__body">
          <header class="tl-c__head"><b id="c-${esc(c.id)}-n">${esc(c.name || "Anonymous")}</b>${c.owner ? `<span class="tl-author">author</span>` : ""}${c.mine ? `<span class="tl-author tl-author--you">you</span>` : ""}<time class="ydate" datetime="${esc(c.when)}">${TH.ago(c.when)}</time>${rk ? `<span class="tl-c__rk" aria-label="their ranking">${rk}</span>` : ""}</header>
          <p class="tl-c__text">${richText(c.text)}</p>
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
        <div class="tl-textwrap">
          <textarea id="cm-text" class="tl-input tl-text" name="text" rows="3" maxlength="600" placeholder="Agree? Disagree? @ an item, # a tier…" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="cm-sug" aria-describedby="cm-help"></textarea>
          <ul class="tl-sug ycard" id="cm-sug" role="listbox" aria-label="Mention" hidden></ul>
        </div>
        <p class="tl-ments" aria-live="polite" hidden></p>
        <p class="sr-only" id="cm-help">Type @ to mention an item or # for a tier.</p>
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
    const wu = Y.post.writeupPill(TH.writeupsOf(`post:${post.id}`)); // i5 (T1): the ranking's own write-up
    const meta = `<div class="ymeta">${TH.typeBadge("tierlist")}<span class="meta tl-meta-n"><i class="ph-bold ph-users" aria-hidden="true"></i><span data-voters>${A.voters}</span> ranked</span>${Y.badge.date(post.date, { style: "full" })}<span class="meta">by ${TH.OWNER}</span></div>${Y.tags(post.tags)}${wu ? `<div class="tl-wuhead">${wu}</div>` : ""}`;
    const body = `
      <div class="tl-bar" id="tl-bar">${segHTML()}</div>
      <div class="tl-grid" id="tl-grid" data-mode="${mode}">
        <section class="tl-main" id="tl-main" aria-label="Board">${boardHTML(mode)}</section>
        <aside class="tl-side" id="tl-side" aria-label="About this ranking">${sideHTML(mode)}</aside>
      </div>
      ${commentsHTML()}`;
    const copy = `<button type="button" class="ylinkicon" data-act="copy" aria-label="Copy link to this ranking" title="Copy link"><i class="ph-bold ph-link" aria-hidden="true"></i></button>`;
    // the kit's detail-page skeleton, wide: the board spans the column and the rail
    // i6 (T2): Back returns to the feed as you left it (history), else to this ranking's post in the feed
    app.innerHTML = Y.detailPage(Y.detail({ back: TH.backTo(post.id), actions: copy, title: post.title, meta, body, links: `<div class="tl-foot" id="tl-foot">${footHTML(mode)}</div>`, wide: true }), { wide: true });
  }
  function syncURL() {
    const u = new URL(location.href);
    mode === "owner" ? u.searchParams.delete("mode") : u.searchParams.set("mode", mode);
    history.replaceState(null, "", u);
  }
  // switch mode: tiles glide to their new tiers (shared FLIP from the kit)
  function setMode(m, { focus = false } = {}) {
    if (m === "you" && !vote) m = "add";
    if (m === "add") place = startPlace();
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
    lightDraft(); // i6 (R1): the new board shows what your draft mentions
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
    const direct = KEYMAP[k.toLowerCase()];
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
          const z = from ? TIERS.find((x) => (from[x] || []).includes(li.dataset.name)) || "tray" : "tray"; // TIERS = this ranking's ids
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
    // i6 (R1): a mention chip shows its item (or tier) on the board
    const ref = t.closest(".tl-ref");
    if (ref) { sound("tap", { el: ref }); return ref.dataset.reftier ? flashRow(ref.dataset.reftier) : ropeTile(ref.dataset.ref, { scroll: true }); }
  });
  app.addEventListener("ychange", (e) => { if (e.detail.name === "tl-mode") setMode(e.detail.value); });

  /* ---------- i6 (R1) · mentions: type @ / # (i7 T6: typed only), light what a comment refers to ---------- */
  // one rope at a time on the board (i6, T8): the previous tile un-sews while this one sews in
  let ropedTile = null;
  function ropeTile(slug, { scroll = false } = {}) {
    const tile = $(`.tl-item[data-key="${CSS.escape(slug)}"] .tl-tile`, app);
    if (!tile) return;
    if (ropedTile && ropedTile !== tile) { clearTimeout(ropedTile._t); ropedTile.classList.remove("is-selected"); }
    ropedTile = tile;
    if (scroll) {
      const r = tile.getBoundingClientRect();
      if (r.top < 90 || r.bottom > innerHeight - 30) scrollTo({ top: Math.max(0, scrollY + r.top - Math.max(100, (innerHeight - r.height) / 2)), behavior: reduced() ? "auto" : "smooth" });
    }
    tile.classList.add("ysel");
    tile.classList.remove("is-selected"); void tile.offsetWidth;
    requestAnimationFrame(() => tile.classList.add("is-selected"));
    clearTimeout(tile._t);
    if (!P.has("hold")) tile._t = setTimeout(() => { tile.classList.remove("is-selected"); if (ropedTile === tile) ropedTile = null; }, 2900);
  }
  function flashRow(id) {
    const row = $(`.tl-row[data-tier="${CSS.escape(id)}"]`, app);
    if (!row) return;
    const r = row.getBoundingClientRect();
    if (r.top < 90 || r.bottom > innerHeight - 30) scrollTo({ top: Math.max(0, scrollY + r.top - Math.max(100, (innerHeight - r.height) / 2)), behavior: reduced() ? "auto" : "smooth" });
    row.classList.remove("is-lit"); void row.offsetWidth; row.classList.add("is-lit");
    clearTimeout(row._t); row._t = setTimeout(() => row.classList.remove("is-lit"), 1800);
  }
  // light: tiles (slugs) and rows (tier ids) a comment or a draft refers to. hot = the one chip under the pointer
  function light(slugs = [], tiers = [], cls = "is-ref") {
    $$(`.tl-board .${cls}`, app).forEach((el) => el.classList.remove(cls));
    slugs.forEach((s) => $(`.tl-board .tl-item[data-key="${CSS.escape(s)}"]`, app)?.classList.add(cls));
    tiers.forEach((t) => $(`.tl-board .tl-row[data-tier="${CSS.escape(t)}"]`, app)?.classList.add(cls));
  }
  const refTarget = (el) => el?.closest?.(".tl-ref, .tl-rk, .tl-c__card");
  function onRefHover(el) {
    const card = el?.closest(".tl-c__card");
    light(card ? (card.dataset.refs || "").split(" ").filter(Boolean) : [], card ? (card.dataset.reftiers || "").split(" ").filter(Boolean) : []);
    const hot = el?.closest(".tl-ref, .tl-rk");
    light(hot?.dataset.ref ? [hot.dataset.ref] : [], hot?.dataset.reftier ? [hot.dataset.reftier] : [], "is-ref-hot");
    $$(".tl-c__card.is-reading", app).forEach((c) => c !== card && c.classList.remove("is-reading"));
    card?.classList.add("is-reading");
  }
  app.addEventListener("pointerover", (e) => { if (e.pointerType === "touch") return; const t = refTarget(e.target); if (t) onRefHover(t); });
  app.addEventListener("pointerout", (e) => {
    if (e.pointerType === "touch") return;
    const from = refTarget(e.target), to = refTarget(e.relatedTarget);
    if (from && from !== to) to ? onRefHover(to) : (onRefHover(null), lightDraft());
  });
  app.addEventListener("focusin", (e) => { const t = e.target.closest?.(".tl-ref"); if (t) onRefHover(t); });
  app.addEventListener("focusout", (e) => { if (e.target.closest?.(".tl-ref") && !refTarget(e.relatedTarget)) { onRefHover(null); lightDraft(); } });

  // the draft: what it mentions shows as chips under the box and lights on the board
  const draftRefs = () => parseRefs($("#cm-text")?.value || "").filter((r) => r.kind !== "text");
  function lightDraft() {
    light([...new Set(draftRefs().filter((r) => r.kind === "item").map((r) => SLUG(r.name)))], [], "is-drafted");
  }
  function onDraft() {
    const rs = draftRefs(), seen = new Set();
    const uniq = rs.filter((r) => { const k = r.kind === "item" ? `i:${r.name}` : `t:${r.def.id}`; if (seen.has(k)) return false; seen.add(k); return true; });
    const pv = $(".tl-ments");
    if (pv) { pv.hidden = !uniq.length; pv.innerHTML = uniq.length ? `<span class="meta">Mentions</span>${uniq.map(refChip).join("")}` : ""; }
    lightDraft();
  }

  // smart words while typing: "@he" → Helium, "#a" → A tier (↑↓ choose · Enter / Tab put it in · Esc closes)
  let sugs = [], sugI = 0, sugAt = -1;
  function tokenAtCaret(ta) {
    const s = ta.value.slice(0, ta.selectionStart);
    const m = s.match(/(^|[\s(“"'\-])([@#])([^\s@#]*(?: [^\s@#]+)?)$/);
    if (!m) return null;
    return { at: s.length - m[3].length - 1, sigil: m[2], q: m[3] };
  }
  function suggest() {
    const ta = $("#cm-text"), pop = $("#cm-sug");
    if (!ta || !pop) return;
    const tk = tokenAtCaret(ta);
    const q = (tk?.q || "").toLowerCase();
    sugs = !tk ? [] : tk.sigil === "@"
      ? NAMES.map((n) => [n.toLowerCase().startsWith(q) ? 0 : n.toLowerCase().split(/\s+/).some((w) => w.startsWith(q)) ? 1 : n.toLowerCase().includes(q) ? 2 : 9, n]).filter(([s]) => s < 9).sort((a, b) => a[0] - b[0]).slice(0, 6).map(([, n]) => ({ kind: "item", name: n }))
      : DEFS.filter((d) => !q || d.id.toLowerCase().startsWith(q) || d.label.toLowerCase().startsWith(q) || d.label.toLowerCase().split(/\s+/).some((w) => w.startsWith(q))).slice(0, 6).map((d) => ({ kind: "tier", def: d }));
    // a finished mention ("@Helium ") is not a question any more
    if (tk && sugs.length === 1 && sugs[0].kind === "item" && sugs[0].name.toLowerCase() === q && /\s$/.test(ta.value.slice(0, ta.selectionStart))) sugs = [];
    sugAt = tk ? tk.at : -1;
    sugI = Math.min(sugI, Math.max(0, sugs.length - 1));
    if (!sugs.length) return closeSug();
    pop.innerHTML = sugs.map((s, i) => `<li class="tl-sug__o" role="option" id="cm-sug-${i}" aria-selected="${i === sugI}" data-i="${i}">${s.kind === "item"
      ? `<span class="tl-ref__art" aria-hidden="true">${ART[s.name]}</span><b>${esc(s.name)}</b><span class="meta">${esc(ZNAME[TH.ownerTierOf(post, s.name)] || "")}</span>`
      : `${chipk(s.def.id)}<span class="meta">${plural((post.tiers[s.def.id] || []).length, "item")}</span>`}</li>`).join("") + `<li class="tl-sug__note" role="presentation">Enter or Tab puts it in</li>`;
    if (pop.hidden) { pop.hidden = false; if (!reduced()) pop.animate([{ opacity: 0, transform: "translateY(-4px) scale(.98)" }, { opacity: 1, transform: "none" }], { duration: 180, easing: "cubic-bezier(.2,.8,.2,1)" }); }
    ta.setAttribute("aria-expanded", "true");
    ta.setAttribute("aria-activedescendant", `cm-sug-${sugI}`);
  }
  function closeSug() { const pop = $("#cm-sug"), ta = $("#cm-text"); if (pop) pop.hidden = true; sugs = []; sugI = 0; ta?.setAttribute("aria-expanded", "false"); ta?.removeAttribute("aria-activedescendant"); }
  function takeSug(i) {
    const ta = $("#cm-text"), s = sugs[i];
    if (!ta || !s || sugAt < 0) return;
    const word = s.kind === "item" ? `@${s.name} ` : `#${s.def.label.length <= 3 ? s.def.label : s.def.id} `;
    const end = ta.selectionStart;
    ta.value = ta.value.slice(0, sugAt) + word + ta.value.slice(end).replace(/^ /, "");
    const caret = sugAt + word.length;
    ta.setSelectionRange(caret, caret);
    closeSug();
    onDraft();
    sound("token-add", { el: ta });
  }
  app.addEventListener("input", (e) => { if (e.target.id === "cm-text") { onDraft(); suggest(); } });
  app.addEventListener("keydown", (e) => {
    if (e.target.id !== "cm-text" || !sugs.length || $("#cm-sug")?.hidden) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); sugI = (sugI + (e.key === "ArrowDown" ? 1 : -1) + sugs.length) % sugs.length; suggest(); }
    else if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); takeSug(sugI); }
    else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); closeSug(); }
  });
  app.addEventListener("click", (e) => { if (e.target.id === "cm-text") suggest(); });
  app.addEventListener("pointerdown", (e) => { if (e.target.closest?.("#cm-sug")) e.preventDefault(); }); // keep the caret in the box
  app.addEventListener("click", (e) => { const o = e.target.closest?.(".tl-sug__o"); if (o) takeSug(+o.dataset.i); });
  app.addEventListener("focusout", (e) => { if (e.target.id === "cm-text") setTimeout(() => { if (document.activeElement?.id !== "cm-text") closeSug(); }, 120); });

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
    onDraft(); closeSug();
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
  if (mode === "add") place = startPlace();
  // review states: a believable half-placed board (tl1's names; any other ranking: every other item placed top-down)
  if (STATE) {
    if (post.id === "tl1") place = { S: ["Helium"], A: ["Zen", "Firefox"], B: ["Safari"], C: [], D: ["Edge"], tray: ["Arc", "Orion", "Vivaldi", "Brave", "Chrome"] };
    else {
      place = Object.fromEntries(ZONES.map((z) => [z, []]));
      NAMES.forEach((n, i) => (i % 2 ? place.tray : place[TIERS[Math.min(N - 1, Math.floor(i / 2) % N)]]).push(n));
    }
  }
  const pickedName = post.id === "tl1" ? "Arc" : place?.tray[0], dragName = post.id === "tl1" ? "Orion" : place?.tray.at(-1);
  const dragTo = TIERS[Math.min(2, N - 1)];
  renderPage();
  wireDrag();
  syncURL();
  if (STATE === "picked") requestAnimationFrame(() => {
    const li = $(`.tl-item[data-name="${CSS.escape(pickedName || "")}"]`); if (!li) return; setSel(li); $(".tl-tile", li).focus({ preventScroll: true });
    const top = $(".tl-bar").getBoundingClientRect().top; scrollTo(0, scrollY + top - 70);
  });
  if (STATE === "dragging") setTimeout(() => {
    const li = $(`.tl-item[data-name="${CSS.escape(dragName || "")}"]`), target = $(`.tl-zone[data-zone="${CSS.escape(dragTo)}"]`);
    if (!li || !target || !drag) return;
    const r = target.getBoundingClientRect();
    const scrollY0 = Math.max(0, $(".tl-board").getBoundingClientRect().top + scrollY - 120);
    scrollTo(0, scrollY0);
    const r2 = target.getBoundingClientRect();
    drag.simulate(li, r2.left + Math.min(260, r2.width * 0.5), r2.top + r2.height / 2 + 6);
    $$(".tl-row").forEach((row) => row.classList.toggle("is-over", row.dataset.tier === dragTo));
    void r;
  }, 450);
  if (location.hash === "#comments") requestAnimationFrame(() => document.getElementById("comments")?.scrollIntoView({ block: "start" }));
  // i5 (T1): ?item=<slug> (an item's write-up links back here): bring that tile into view and sew the rope round it
  const lit = P.get("item");
  if (lit && mode !== "add") Promise.race([document.fonts?.ready, new Promise((r) => setTimeout(r, 400))]).then(() => requestAnimationFrame(() => {
    const tile = $(`.tl-item[data-key="${CSS.escape(lit)}"] .tl-tile`, app);
    if (!tile) return;
    const r = tile.getBoundingClientRect();
    if (r.top < 80 || r.bottom > innerHeight - 20) scrollTo(0, scrollY + r.top - Math.max(100, (innerHeight - r.height) / 2));
    ropeTile(lit);
  }));

  // G1 (i5): demo states → Jump to; nothing here is still open
  Y.mockPanel([
    { label: "Ranking", param: "id", state: true, options: [["tl1", "Browsers (S–D)"], ["tl3", "Coding fonts (custom tiers)"]], default: "tl1" },
    { label: "Mode", param: "mode", state: true, options: [["owner", `${TH.OWNER}'s`], ["everyone", "Everyone"], ["add", "Add your ranking"], ["you", "You vs everyone"]], default: "owner" },
    { label: "Your ranking", param: "you", state: true, options: [["", "Saved in this browser"], ["demo", "Sample (review)"]], default: "" },
    { label: "Add mode review state", param: "state", state: true, options: [["", "Live"], ["picked", "Item picked"], ["dragging", "Mid-drag"]], default: "" },
    { label: "Light an item", param: "item", state: true, options: [["", "None"], ["helium", "Helium (has a write-up)"]], default: "" },
    // decided (Earlier), i7: wumark bookmark (T3) · (rmention: type only (T6); tapping a tile to mention it is cut)
    { label: "Item has a write-up (R3)", param: "wumark", options: [["bookmark", "Red bookmark (an article's mark)"], ["pin", "Round pin (i5)"], ["label", "“write-up” tag under the tile"]], default: "bookmark" },
  ], { title: "Ranking options" });
})();
