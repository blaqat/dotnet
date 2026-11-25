/* ============================================================
   Thoughts · Ethereal · views
   ?view=feed (default) | article&id=a1 | collection&c=tools
   ?type=a,b  ?tag=x,y   filters (none = all; AND across groups, OR within)
   ?lightbox=<postId>:<index>   ?tl=mine|everyone   ?frame=  ?arcs=  ?field=  ?nav=
   ============================================================ */
(() => {
  const T = window.THOUGHTS;
  const P = new URLSearchParams(location.search);
  const html = document.documentElement;
  const app = document.getElementById("app");
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches || P.has("reduced");
  if (reduced()) html.classList.add("is-reduced");

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const rng = (s) => () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  // ---------- variants ----------
  const frame = ["stitch", "cord", "none"].includes(P.get("frame")) ? P.get("frame") : "stitch";
  const arcsMode = ["hover", "always", "off"].includes(P.get("arcs")) ? P.get("arcs") : "hover";
  const view = P.get("view") || "feed";
  html.classList.add(`frame-${frame}`, `arcs-${arcsMode}`);

  // ---------- data ----------
  const posts = [...T.posts].sort((a, b) => b.date.localeCompare(a.date));
  const byId = Object.fromEntries(posts.map((p) => [p.id, p]));
  const TYPES = {
    scratch: { many: "Scratch", one: "Scratch", icon: "ph-cloud" },
    article: { many: "Articles", one: "Article", icon: "ph-article" },
    tierlist: { many: "Tier lists", one: "Tier list", icon: "ph-ranking" },
    playlist: { many: "Playlists", one: "Playlist", icon: "ph-vinyl-record" },
    pick: { many: "Picks", one: "Pick", icon: "ph-sparkle" },
    embed: { many: "Embeds", one: "Embed", icon: "ph-images" },
  };
  const kindLabel = (p) => (p.type === "scratch" && p.tags.includes("shower") ? "Shower thought" : TYPES[p.type].one);
  const dt = (s) => new Date(s);
  const fmtDay = (s) => dt(s).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const fmtFull = (s) => dt(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const fmtTime = (s) => dt(s).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).toLowerCase();
  const fmtMonth = (s) => dt(s).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const secs = (d) => d.split(":").reduce((a, b) => a * 60 + +b, 0);
  const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  // ---------- filters ----------
  const parseSet = (k) => new Set((P.get(k) || "").split(",").filter(Boolean));
  const sel = { type: parseSet("type"), tag: parseSet("tag") };
  const visible = (p) => (!sel.type.size || sel.type.has(p.type)) && (!sel.tag.size || p.tags.some((t) => sel.tag.has(t)));

  // posts that share a tag form a constellation: chain them in time order
  function constellations(list) {
    const chains = {};
    list.forEach((p) => p.tags.forEach((t) => (chains[t] ||= []).push(p.id)));
    const arcs = new Map();
    for (const [t, ids] of Object.entries(chains))
      for (let i = 0; i < ids.length - 1; i++) {
        const k = ids[i] + ">" + ids[i + 1];
        if (!arcs.has(k)) arcs.set(k, { a: ids[i], b: ids[i + 1], tags: [] });
        arcs.get(k).tags.push(t);
      }
    return { chains, arcs: [...arcs.values()] };
  }

  // ---------- small pieces ----------
  const CAT_STARS = [
    [190, 8, 1], [224, 31, 3], [292, 8, 1], [305, 80, 2], [291, 126, 3], [318, 190, 2], [339, 250, 1],
    [316, 336, 3], [330, 361, 2], [200, 371, 3], [72, 358, 2], [47, 324, 3], [112, 292, 1],
    [162, 333, 3], [150, 228, 2], [186, 160, 3], [178, 92, 2],
  ];
  function catConstellation() {
    const d = "M" + CAT_STARS.map(([x, y]) => `${x} ${y}`).join(" L") + " Z";
    const R = [0, 12, 8.5, 6];
    return `<svg class="catstars" viewBox="22 -16 340 404" aria-hidden="true">
      <path class="ghost" d="${window.Yarn?.CAT_PATH || ""}"/>
      <path class="lines" d="${d}"/>
      ${CAT_STARS.map(([x, y, m]) => `<circle class="halo" cx="${x}" cy="${y}" r="${R[m] * 2.6}"/>`).join("")}
      ${CAT_STARS.map(([x, y, m]) => `<circle class="st m${m}${m === 1 ? " tw" : ""}" cx="${x}" cy="${y}" r="${R[m]}"/>`).join("")}
    </svg>`;
  }
  function miniCluster(n) {
    const pts = [[12, 26], [20, 13], [29, 21], [24, 31], [33, 9]].slice(0, Math.max(n, 0));
    if (!pts.length)
      return `<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="13" fill="none" stroke="rgba(230,223,210,.18)" stroke-dasharray="2 3"/><circle cx="20" cy="20" r="1.6" fill="rgba(230,223,210,.4)"/></svg>`;
    return `<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="21" cy="20" r="18" fill="rgba(124,96,210,.12)"/>
      <path d="M${pts.map((p) => p.join(" ")).join(" L")}" fill="none" stroke="#d62f38" stroke-width="1.2" opacity=".8"/>
      ${pts.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i === pts.length - 1 ? 2.4 : 1.8}" fill="#fff1d8"/>`).join("")}</svg>`;
  }
  function clusterLink([k, c]) {
    const n = posts.filter((p) => p.type === "pick" && p.collection === k).length;
    return `<a class="cluster-link" href="?view=collection&c=${k}">${miniCluster(n)}<span><b>${esc(c.title)}</b><small>${n ? `${n} picks` : "still forming"}</small></span><i class="ph ph-arrow-right go" aria-hidden="true"></i></a>`;
  }
  const tagBtns = (p) =>
    p.tags.length
      ? `<span class="post__tags">${p.tags.map((t) => `<button type="button" class="tagbtn" data-f="tag" data-v="${esc(t)}" aria-pressed="${sel.tag.has(t)}" aria-label="Filter by tag ${esc(t)}">#${esc(t)}</button>`).join("")}</span>`
      : "";
  const kind = (p) => `<span class="kind"><i class="ph ${TYPES[p.type].icon}" aria-hidden="true"></i>${kindLabel(p)}</span>`;
  const sep = `<span class="sep" aria-hidden="true">·</span>`;
  const when = (p, time) => `<time datetime="${p.date}">${fmtDay(p.date)}${time ? `, ${fmtTime(p.date)}` : ""}</time>`;
  const linkhint = `<span class="linkhint"></span>`;

  // ---------- post templates ----------
  function scratch(p) {
    return `<li class="post post--scratch" id="${p.id}" data-id="${p.id}">
      <span class="post__star" aria-hidden="true"></span>
      <blockquote class="thought"><p class="thought__haze" aria-hidden="true">${esc(p.text)}</p><p class="thought__text">${esc(p.text)}</p></blockquote>
      <p class="post__meta meta-line">${kind(p)}${sep}${when(p, true)}${p.tags.length ? sep : ""}${tagBtns(p)}${linkhint}</p>
    </li>`;
  }
  function article(p) {
    return `<li class="post post--article card" id="${p.id}" data-id="${p.id}">
      <span class="post__star" aria-hidden="true"></span>
      <div>
        <p class="post__meta meta-line">${kind(p)}${sep}${when(p)}${sep}<span>${p.readMins} min read</span>${linkhint}</p>
        <h3 class="post__title"><a class="stretch" href="?view=article&id=${p.id}">${esc(p.title)}</a></h3>
        <p class="dek">${esc(p.dek)}</p>
        <p class="post__meta meta-line" style="margin:0">${tagBtns(p)}<span class="readmore" aria-hidden="true">Read<i class="ph ph-arrow-right"></i></span></p>
      </div>
      ${p.cover ? `<img class="cover" src="${p.cover}" alt="" loading="lazy" decoding="async">` : ""}
    </li>`;
  }
  function pick(p) {
    const col = T.collections[p.collection];
    const siblings = posts.filter((x) => x.type === "pick" && x.collection === p.collection).reverse();
    const nth = siblings.findIndex((x) => x.id === p.id) + 1;
    const host = new URL(p.url).hostname;
    return `<li class="post post--pick" id="${p.id}" data-id="${p.id}">
      <span class="post__star" aria-hidden="true"></span>
      <div class="pick">
        <h3 class="pick__h" style="margin:0"><a class="pick__name" href="${p.url}" target="_blank" rel="noopener">${esc(p.name)}<i class="ph ph-arrow-up-right" aria-hidden="true"></i><span class="sr-only"> (${host}, opens in a new tab)</span></a></h3>
        <p class="pick__blurb">${esc(p.blurb)}</p>
      </div>
      <p class="post__meta meta-line">${kind(p)}${sep}<span>in <a href="?view=collection&c=${p.collection}">${esc(col?.title || p.collection)}</a> <span aria-label="pick ${nth} of ${siblings.length}">(${nth}/${siblings.length})</span></span>${sep}${when(p)}${sep}${tagBtns(p)}${linkhint}</p>
    </li>`;
  }

  const TIERS = ["S", "A", "B", "C", "D"];
  // my tiers next to everyone's: each item lands in the tier most voters chose (plurality)
  function tierTable(p, mode) {
    const mine = {};
    TIERS.forEach((l, i) => (p.tiers[l] || []).forEach((n) => (mine[n] = i)));
    const groups = TIERS.map(() => []);
    for (const [name, pct] of Object.entries(p.community.items)) {
      const best = pct.reduce((b, v, i) => (v > pct[b] ? i : b), 0);
      groups[best].push({ name, pct: pct[best], delta: (mine[name] ?? best) - best });
    }
    const chip = (it) => {
      const my = TIERS[mine[it.name]];
      const dl = it.delta > 0 ? `<span class="dl" title="Everyone ranks it higher than I do (I said ${my})">▲<span class="sr-only">, higher than my ${my}</span></span>`
        : it.delta < 0 ? `<span class="dl down" title="Everyone ranks it lower than I do (I said ${my})">▼<span class="sr-only">, lower than my ${my}</span></span>` : "";
      return `<li class="tchip">${esc(it.name)} <span class="pc">${it.pct}%</span>${dl}</li>`;
    };
    const v = p.community.voters;
    const rows = TIERS.map((l, i) => `<tr class="tier tier--${l}"><th scope="row"><span class="tier__l">${l}</span></th>
      <td class="mine"><ul class="tier__items">${(p.tiers[l] || []).map((n) => `<li class="tchip">${esc(n)}</li>`).join("")}</ul></td>
      <td class="all"><ul class="tier__items">${groups[i].sort((a, b) => b.pct - a.pct).map(chip).join("")}</ul></td></tr>`).join("");
    return `<table class="tl-table" data-mode="${mode}">
      <caption class="sr-only">My tiers next to everyone’s: each browser sits in the tier most of the ${v} voters chose</caption>
      <thead><tr><th scope="col" class="c-l"><span class="sr-only">Tier</span></th><th scope="col" class="c-mine">Mine</th><th scope="col" class="c-all">Everyone’s <span class="n">· ${v} votes · ▲ higher than mine</span></th></tr></thead>
      <tbody>${rows}</tbody></table>`;
  }
  function tierlist(p) {
    const mode = P.get("tl") === "everyone" ? "everyone" : "mine";
    const v = p.community.voters;
    return `<li class="post post--tierlist card" id="${p.id}" data-id="${p.id}">
      <span class="post__star" aria-hidden="true"></span>
      <div class="tl-head">
        <div>
          <p class="post__meta meta-line">${kind(p)}${sep}${when(p)}${linkhint}</p>
          <h3 class="post__title">${esc(p.title)}</h3>
        </div>
        <div class="seg" role="group" aria-label="Whose ranking to show">
          <button type="button" data-tl="mine" aria-pressed="${mode === "mine"}">Mine</button>
          <button type="button" data-tl="everyone" aria-pressed="${mode === "everyone"}">Everyone’s<span class="n">${v}</span></button>
        </div>
      </div>
      ${tierTable(p, mode)}
      <div class="tl-foot">
        <a class="ebtn ebtn--ember" href="tierlist.html?skin=ethereal&from=${p.id}"><i class="ph ph-shuffle" aria-hidden="true"></i>View &amp; remix</a>
        <a class="ebtn" href="tierlist.html?skin=ethereal"><i class="ph ph-plus" aria-hidden="true"></i>Make your own</a>
        <span class="meta-line">${tagBtns(p)}</span>
      </div>
    </li>`;
  }
  function playlist(p) {
    const total = p.tracks.reduce((s, t) => s + secs(t.dur), 0);
    return `<li class="post post--playlist card" id="${p.id}" data-id="${p.id}">
      <span class="post__star" aria-hidden="true"></span>
      <div class="pl-head">
        <span class="pl-art" aria-hidden="true"></span>
        <div>
          <h3 class="post__title">${esc(p.title)}</h3>
          <p class="post__meta meta-line">${kind(p)}${sep}${when(p)}${sep}<span>${p.tracks.length} tracks, ${mmss(total)}</span>${linkhint}</p>
        </div>
        <button type="button" class="ebtn ebtn--ember" data-play-all="${p.id}"><i class="ph-fill ph-play" aria-hidden="true"></i>Play all</button>
      </div>
      ${p.note ? `<p class="note">${esc(p.note)}</p>` : ""}
      <ol class="tracks">${p.tracks.map((t, i) => `<li><button type="button" class="track" data-pl="${p.id}" data-i="${i}" aria-label="Play ${esc(t.title)} by ${esc(t.by)}, ${t.dur}"><span class="no">${i + 1}</span><span class="pb"><i class="ph-fill ph-play" aria-hidden="true"></i></span><span class="ti">${esc(t.title)}</span><span class="by">${esc(t.by)}</span><span class="du">${t.dur}</span></button></li>`).join("")}</ol>
      <p class="post__meta meta-line" style="margin:.6rem 0 0">${tagBtns(p)}</p>
    </li>`;
  }
  function embed(p) {
    const n = p.media.length;
    return `<li class="post post--embed card" id="${p.id}" data-id="${p.id}">
      <span class="post__star" aria-hidden="true"></span>
      <p class="post__meta meta-line">${kind(p)}${sep}<span>${n} ${n === 1 ? "image" : "images"}</span>${sep}${when(p)}${linkhint}</p>
      <h3 class="post__title">${esc(p.title)}</h3>
      ${p.note ? `<p class="note">${esc(p.note)}</p>` : ""}
      <div class="thumbs" data-n="${n}" style="--n:${n}">${p.media.map((m, i) => `<button type="button" class="thumb" data-lb="${p.id}" data-i="${i}" aria-label="Open image ${i + 1} of ${n}: ${esc(m.alt)}"><img src="${m.src}" alt="" loading="lazy" decoding="async"></button>`).join("")}</div>
      <p class="post__meta meta-line" style="margin:.75rem 0 0">${tagBtns(p)}</p>
    </li>`;
  }
  const RENDER = { scratch, article, pick, tierlist, playlist, embed };

  // ============================================================
  // FEED
  // ============================================================
  function renderFeed() {
    const counts = {}, tagCounts = {};
    posts.forEach((p) => { counts[p.type] = (counts[p.type] || 0) + 1; p.tags.forEach((t) => (tagCounts[t] = (tagCounts[t] || 0) + 1)); });
    const tags = Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a] || a.localeCompare(b));
    const oldest = posts[posts.length - 1];
    app.innerHTML = `
      <div class="feed-wrap">
        <aside class="rail" aria-label="About and filters">
          <header class="rail__head">
            ${catConstellation()}
            <h1 class="lede-title">Thoughts</h1>
            <p class="lede-sub">Half-formed ideas, longer write-ups, and things I keep coming back to.</p>
            <p class="count meta-line">${posts.length} thoughts${sep}since ${fmtFull(oldest.date)}</p>
          </header>
          <section aria-labelledby="f-kinds">
            <h2 class="label" id="f-kinds">Kinds</h2>
            <div class="chips">
              ${Object.entries(TYPES).filter(([k]) => counts[k]).map(([k, t]) => `<button type="button" class="fchip" data-f="type" data-v="${k}" aria-pressed="${sel.type.has(k)}"><i class="ph ${t.icon} ic" aria-hidden="true"></i><i class="ph-bold ph-check ck" aria-hidden="true"></i>${t.many}<span class="n" aria-label="${counts[k]} posts">${counts[k]}</span></button>`).join("")}
            </div>
          </section>
          <section aria-labelledby="f-tags">
            <h2 class="label" id="f-tags">Tags</h2>
            <div class="chips">
              ${tags.map((t) => `<button type="button" class="fchip fchip--tag" data-f="tag" data-v="${esc(t)}" aria-pressed="${sel.tag.has(t)}"><i class="ph-bold ph-check ck" aria-hidden="true"></i>#${esc(t)}</button>`).join("")}
            </div>
            <p class="filter-status meta-line" aria-live="polite"></p>
          </section>
          <section class="clusters" aria-labelledby="f-cl">
            <h2 class="label" id="f-cl">Clusters</h2>
            ${Object.entries(T.collections).map(clusterLink).join("")}
          </section>
          <a class="ebtn make-tl" href="tierlist.html?skin=ethereal"><i class="ph ph-ranking" aria-hidden="true"></i>Make a tier list</a>
        </aside>
        <section class="stream" aria-label="Posts, newest first">
          <svg class="thread-svg" aria-hidden="true"></svg>
          <div class="stream__list"></div>
        </section>
      </div>`;
    renderList(true);
    const stream = app.querySelector(".stream");
    wireHover(stream);
    new ResizeObserver(() => { drawThread(); maskField(); }).observe(stream);
  }

  let con = { chains: {}, arcs: [] };
  function renderList(first) {
    const list = posts.filter(visible);
    con = constellations(list);
    const host = app.querySelector(".stream__list");
    if (!list.length) {
      host.innerHTML = `<div class="empty"><p class="thought__text">Nothing has condensed here yet.</p><p>No posts match these filters. <button type="button" class="ebtn ebtn--quiet" data-clear>Clear filters</button></p></div>`;
    } else {
      let out = "", month = "";
      list.forEach((p) => {
        const m = fmtMonth(p.date);
        if (m !== month) { out += `${month ? "</ol>" : ""}<h2 class="month">${m}</h2><ol class="posts">`; month = m; }
        out += RENDER[p.type](p);
      });
      host.innerHTML = out + "</ol>";
    }
    // status
    const st = app.querySelector(".filter-status");
    const any = sel.type.size || sel.tag.size;
    st.classList.toggle("is-active", !!any);
    st.innerHTML = any
      ? `Showing ${list.length} of ${posts.length}<button type="button" class="ebtn ebtn--quiet" data-clear>Clear</button>`
      : `Showing all ${posts.length}. Nothing selected means everything.`;
    if (first) observeForming(host);
    else if (!reduced()) { host.classList.remove("fade-in-list"); void host.offsetWidth; host.classList.add("fade-in-list"); }
    requestAnimationFrame(drawThread);
  }

  // thoughts condense out of haze as they enter view. WAAPI (opacity/transform only),
  // so ?t=<ms> can freeze every condensation at one moment for review/screenshots.
  const FREEZE = P.has("t") ? Math.max(0, +P.get("t") || 0) : null;
  const EASE = "cubic-bezier(.2,.8,.2,1)";
  function condense(el, delay) {
    if (el.classList.contains("is-formed")) return;
    el.classList.add("is-formed");
    const anims = [];
    const o = { delay, easing: EASE, fill: "both" };
    if (el.classList.contains("post--scratch")) {
      anims.push(el.querySelector(".thought__text").animate([{ opacity: 0 }, { opacity: 0, offset: 0.22 }, { opacity: 1 }], { ...o, duration: 1600 }));
      anims.push(el.querySelector(".thought__haze").animate(
        [{ opacity: 0, transform: "scale(1.05)" }, { opacity: 0.85, offset: 0.3 }, { opacity: 0, transform: "none" }], { ...o, duration: 1600 }));
    } else {
      anims.push(el.animate([{ opacity: 0, transform: "translateY(10px) scale(.992)" }, { opacity: 1, transform: "none" }], { ...o, duration: 900 }));
    }
    const star = el.querySelector(".post__star");
    if (star) anims.push(star.animate([{ opacity: 0, transform: "scale(.2)" }, { opacity: 1, offset: 0.6 }, { opacity: 1, transform: "none" }], { ...o, duration: 900 }));
    anims.forEach((a) => {
      if (FREEZE != null) { a.pause(); a.currentTime = FREEZE; }
      else a.onfinish = () => a.cancel(); // hand transforms back to CSS (hover states)
    });
  }
  function observeForming(host) {
    if (reduced() || !("IntersectionObserver" in window) || !Element.prototype.animate) return;
    host.classList.add("forming");
    let batch = 0, timer;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        condense(en.target, Math.min(batch++, 7) * 90);
        io.unobserve(en.target);
      });
      clearTimeout(timer); timer = setTimeout(() => (batch = 0), 150);
    }, { rootMargin: "0px 0px -4% 0px", threshold: 0.08 });
    host.querySelectorAll(".post:not(.is-formed)").forEach((el) => io.observe(el));
  }

  // ---- the thread + constellation filaments ----
  function smooth(pts) {
    let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const [x, y] = pts[i], [nx, ny] = pts[i + 1];
      d += ` Q${x.toFixed(1)} ${y.toFixed(1)} ${((x + nx) / 2).toFixed(1)} ${((y + ny) / 2).toFixed(1)}`;
    }
    const l = pts[pts.length - 1];
    return d + ` L${l[0].toFixed(1)} ${l[1].toFixed(1)}`;
  }
  // a curve that passes through every point (the thread must go through each star)
  function throughPoints(pts) {
    let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    return d;
  }
  function drawThread() {
    const stream = app.querySelector(".stream");
    const svg = stream?.querySelector(".thread-svg");
    if (!svg) return;
    const els = [...stream.querySelectorAll(".post")];
    const gutter = parseFloat(getComputedStyle(stream).paddingLeft) || 0;
    const H = stream.offsetHeight;
    if (!els.length) { svg.innerHTML = ""; return; }
    const s0 = els[0].querySelector(".post__star");
    const spineX = els[0].offsetLeft + s0.offsetLeft + s0.offsetWidth / 2;
    const ys = Object.fromEntries(els.map((el) => { const s = el.querySelector(".post__star"); return [el.dataset.id, el.offsetTop + s.offsetTop + s.offsetHeight / 2]; }));
    const top = 0, bottom = Math.min(H, Math.max(...Object.values(ys)) + 90);
    const pts = [];
    for (let y = top; y < bottom; y += 64) pts.push([spineX + Math.sin(y / 97) * 1.5 + Math.sin(y / 37) * 0.5, y]);
    pts.push([spineX, bottom]);
    const spine = smooth(pts);
    let arcs = "";
    const narrow = gutter < 60;
    if (!narrow) {
      for (const a of con.arcs) {
        const ya = ys[a.a], yb = ys[a.b];
        if (ya == null || yb == null) continue;
        const bulge = Math.min(spineX - 10, 16 + (yb - ya) * 0.11);
        const cx = spineX - bulge * 1.333;
        const tags = a.tags.join(" ");
        arcs += `<path class="arc" data-tags="${tags}" d="M${spineX} ${ya} C${cx} ${ya} ${cx} ${yb} ${spineX} ${yb}"/>`;
        const lx = spineX - bulge - 5, ly = (ya + yb) / 2;
        arcs += `<text class="arc-label" data-tags="${tags}" x="${lx}" y="${ly}" text-anchor="middle" transform="rotate(-90 ${lx} ${ly})">${a.tags.map((t) => "#" + t).join(" ")}</text>`;
      }
    }
    svg.setAttribute("viewBox", `0 0 ${gutter} ${H}`);
    svg.style.height = H + "px";
    svg.innerHTML = `
      <defs><linearGradient id="fadeY" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${bottom}">
        <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="${Math.min(0.2, 60 / bottom)}" stop-color="#fff"/><stop offset="${1 - Math.min(0.3, 110 / bottom)}" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
        <mask id="threadMask" maskUnits="userSpaceOnUse" x="-200" y="0" width="${gutter + 400}" height="${H}"><rect x="-200" y="0" width="${gutter + 400}" height="${H}" fill="url(#fadeY)"/></mask></defs>
      <g mask="url(#threadMask)">
        ${arcs}
        <path class="spine-glow" d="${spine}"/>
        <path class="ply-base" stroke-width="2.6" d="${spine}"/>
        <path class="ply-twist" stroke-width="2.6" d="${spine}"/>
      </g>`;
    if (hot) setHot(hot, true);
  }

  // hover / focus a post: its constellations light up
  let hot = null;
  function setHot(id, force) {
    if (id === hot && !force) return;
    hot = id;
    const stream = app.querySelector(".stream");
    if (!stream) return;
    stream.querySelectorAll(".is-hot").forEach((el) => el.classList.remove("is-hot"));
    stream.querySelectorAll(".post.is-linked").forEach((el) => {
      el.classList.remove("is-linked");
      el.querySelectorAll(".is-shared").forEach((x) => x.classList.remove("is-shared"));
      const h = el.querySelector(".linkhint"); if (h) h.textContent = "";
    });
    const p = id && byId[id];
    const tags = p ? p.tags.filter((t) => con.chains[t]?.length > 1) : [];
    stream.classList.toggle("has-hot", tags.length > 0 && arcsMode !== "off");
    if (!tags.length) return;
    stream.querySelectorAll(".arc, .arc-label").forEach((el) => { if (el.dataset.tags.split(" ").some((t) => tags.includes(t))) el.classList.add("is-hot"); });
    const linked = new Map();
    tags.forEach((t) => con.chains[t].forEach((o) => { if (o !== id) { if (!linked.has(o)) linked.set(o, []); linked.get(o).push(t); } }));
    linked.forEach((ts, o) => {
      const el = document.getElementById(o);
      if (!el) return;
      el.classList.add("is-linked");
      ts.forEach((t) => el.querySelector(`.tagbtn[data-v="${CSS.escape(t)}"]`)?.classList.add("is-shared"));
      const h = el.querySelector(".linkhint");
      if (h) h.textContent = `✦ shares ${ts.map((t) => "#" + t).join(" ")}`;
    });
  }
  function wireHover(stream) {
    stream.addEventListener("pointerover", (e) => { if (e.pointerType === "mouse") setHot(e.target.closest(".post")?.dataset.id || null); });
    stream.addEventListener("pointerleave", () => setHot(null));
    stream.addEventListener("focusin", (e) => setHot(e.target.closest(".post")?.dataset.id || null));
    stream.addEventListener("focusout", (e) => { if (!stream.contains(e.relatedTarget)) setHot(null); });
  }

  function toggleFilter(kind, v) {
    const s = sel[kind];
    s.has(v) ? s.delete(v) : s.add(v);
    syncFilters();
  }
  function syncFilters() {
    const u = new URL(location.href);
    for (const k of ["type", "tag"]) sel[k].size ? u.searchParams.set(k, [...sel[k]].join(",")) : u.searchParams.delete(k);
    u.hash = "";
    history.replaceState(null, "", u);
    app.querySelectorAll("[data-f]").forEach((b) => b.setAttribute("aria-pressed", String(sel[b.dataset.f].has(b.dataset.v))));
    hot = null;
    renderList(false);
  }

  // ============================================================
  // ARTICLE
  // ============================================================
  function mdToHtml(md) {
    if (window.marked?.parse) return window.marked.parse(md, { gfm: true });
    // fallback if the CDN is unreachable: paragraphs only
    return md.split(/\n{2,}/).map((b) => `<p>${esc(b)}</p>`).join("");
  }
  function renderArticle(id) {
    const p = byId[id]?.type === "article" ? byId[id] : posts.find((x) => x.type === "article");
    document.title = `${p.title} · Thoughts · blaqat.net`;
    const arts = posts.filter((x) => x.type === "article");
    const i = arts.indexOf(p);
    const newer = arts[i - 1], older = arts[i + 1];
    const related = posts
      .filter((x) => x.id !== p.id)
      .map((x) => ({ x, via: x.tags.filter((t) => p.tags.includes(t)) }))
      .filter((r) => r.via.length)
      .sort((a, b) => b.via.length - a.via.length || b.x.date.localeCompare(a.x.date))
      .slice(0, 4);
    const titleOf = (x) => x.title || x.name || x.text;
    const hrefOf = (x) => (x.type === "article" ? `?view=article&id=${x.id}` : `?view=feed#${x.id}`);
    let lb = 0;
    app.innerHTML = `
      <div class="read-thread" aria-hidden="true"><span class="sewn"></span><span class="needle"></span></div>
      <article class="reader-wrap">
        <a class="back" href="?view=feed#${p.id}"><i class="ph ph-arrow-left" aria-hidden="true"></i>Thoughts</a>
        <header class="reader__head">
          <p class="meta-line">${kind(p)}${sep}${when(p)}, ${dt(p.date).getFullYear()}${sep}${p.readMins} min read</p>
          <h1 class="reader__title">${esc(p.title)}</h1>
          <p class="reader__dek">${esc(p.dek)}</p>
          <div class="reader__tags">${p.tags.map((t) => `<a class="tagbtn" href="?view=feed&tag=${esc(t)}">#${esc(t)}</a>`).join("")}</div>
        </header>
        ${p.cover ? `<figure class="reader__cover"><button type="button" data-lb="${p.id}" data-i="${lb++}" aria-label="View the cover image larger"><img src="${p.cover}" alt=""></button></figure>` : ""}
        <div class="prose">${mdToHtml(p.body)}</div>
        <footer class="reader__end">
          ${related.length ? `<h2>Connected thoughts</h2><p class="meta-line">Same stars, different nights: posts that share a tag with this one.</p>
          <ul class="related">${related.map(({ x, via }) => `<li><a href="${hrefOf(x)}"><span class="via">${via.map((t) => "#" + t).join(" ")}</span><span class="t">${esc(titleOf(x))}</span><span class="k">${kindLabel(x)} · ${fmtDay(x.date)}</span></a></li>`).join("")}</ul>` : ""}
          <p class="meta-line" style="margin-top:1.6rem;display:flex;gap:1rem;flex-wrap:wrap">
            ${older ? `<a class="ebtn" href="?view=article&id=${older.id}"><i class="ph ph-arrow-left" aria-hidden="true"></i>Older: ${esc(older.title)}</a>` : ""}
            ${newer ? `<a class="ebtn" href="?view=article&id=${newer.id}">Newer: ${esc(newer.title)}<i class="ph ph-arrow-right" aria-hidden="true"></i></a>` : ""}
          </p>
        </footer>
      </article>`;
    // post-process markdown: tables scroll, images become zoomable figures
    const prose = app.querySelector(".prose");
    prose.querySelectorAll("table").forEach((t) => { const w = document.createElement("div"); w.className = "tbl"; t.replaceWith(w); w.appendChild(t); });
    prose.querySelectorAll("img").forEach((img) => {
      const fig = document.createElement("figure");
      const btn = document.createElement("button");
      btn.type = "button"; btn.dataset.lb = p.id; btn.dataset.i = String(lb++);
      btn.setAttribute("aria-label", `View image larger: ${img.alt}`);
      const im = img.cloneNode(); im.alt = img.alt; im.loading = "lazy";
      btn.appendChild(im); fig.appendChild(btn);
      if (img.alt) { const c = document.createElement("figcaption"); c.textContent = img.alt; fig.appendChild(c); }
      const parent = img.parentElement;
      if (parent.tagName === "P" && parent.childNodes.length === 1) parent.replaceWith(fig); else img.replaceWith(fig);
    });
    prose.querySelectorAll("a[href^='http']").forEach((a) => { a.target = "_blank"; a.rel = "noopener"; });
    // "in this article": headings as a little column of stars, current one marked (wide screens)
    const hs = [...prose.querySelectorAll("h2, h3")];
    if (hs.length > 1) {
      hs.forEach((h) => (h.id = "s-" + h.textContent.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")));
      const toc = document.createElement("nav");
      toc.className = "toc";
      toc.setAttribute("aria-label", "In this article");
      toc.innerHTML = `<p class="label">In this article</p><ol>${hs.map((h) => `<li class="${h.tagName === "H3" ? "sub" : ""}"><a href="#${h.id}">${esc(h.textContent)}</a></li>`).join("")}</ol>`;
      app.appendChild(toc);
      const links = Object.fromEntries([...toc.querySelectorAll("a")].map((a) => [a.hash.slice(1), a]));
      const seen = new Set();
      const io = new IntersectionObserver((ents) => {
        ents.forEach((e) => (e.isIntersecting ? seen.add(e.target.id) : seen.delete(e.target.id)));
        const cur = hs.find((h) => seen.has(h.id)) || hs.filter((h) => h.getBoundingClientRect().top < innerHeight * 0.3).pop() || hs[0];
        Object.values(links).forEach((a) => a.removeAttribute("aria-current"));
        links[cur.id]?.setAttribute("aria-current", "location");
      }, { rootMargin: "-10% 0px -60% 0px" });
      hs.forEach((h) => io.observe(h));
    }
    // the thread sews down as you read
    const rt = app.querySelector(".read-thread");
    let q = 0;
    const upd = () => { q = 0; const max = document.documentElement.scrollHeight - innerHeight; rt.style.setProperty("--p", max > 0 ? clamp(scrollY / max, 0, 1).toFixed(4) : "1"); };
    addEventListener("scroll", () => { if (!q) q = requestAnimationFrame(upd); }, { passive: true });
    addEventListener("resize", upd);
    upd();
  }

  // ============================================================
  // COLLECTION (cluster)
  // ============================================================
  function renderCollection(c) {
    const key = T.collections[c] ? c : "tools";
    const C = T.collections[key];
    const picks = posts.filter((p) => p.type === "pick" && p.collection === key);
    document.title = `${C.title} · Thoughts · blaqat.net`;
    const others = Object.entries(T.collections).filter(([k]) => k !== key);
    const span = picks.length ? `Gathered ${fmtDay(picks[picks.length - 1].date)} → ${fmtFull(picks[0].date)}` : "Still forming";
    app.innerHTML = `
      <div class="cluster-wrap">
        <a class="back" href="?view=feed"><i class="ph ph-arrow-left" aria-hidden="true"></i>Thoughts</a>
        <header class="cluster-head">
          <div>
            <p class="label">Cluster${sep}${picks.length} ${picks.length === 1 ? "pick" : "picks"}</p>
            <h1 class="lede-title">${esc(C.title)}</h1>
            <p class="lede-sub">${esc(C.blurb)} Each one also lives in the feed on the day I posted it.</p>
          </div>
          <p class="meta-line">${span}</p>
        </header>
        <figure class="cluster-map" style="margin-inline:0">
          <div class="map"></div>
          <figcaption class="legend meta-line"><span><span class="sw-thread" aria-hidden="true"></span>red thread: the order I picked them, newest first</span><span><span class="sw-web" aria-hidden="true"></span>gold: same cluster</span></figcaption>
        </figure>
        ${picks.length ? `<ol class="picks">${picks.map(pickCard).join("")}</ol>` : `<div class="empty"><p class="thought__text">Nothing has condensed here yet.</p></div>`}
        ${others.length ? `<section class="other-clusters"><h2 class="label">Other clusters</h2>${others.map(clusterLink).join("")}</section>` : ""}
      </div>`;
    const fig = app.querySelector(".cluster-map");
    const draw = () => drawCluster(fig.querySelector(".map"), picks);
    draw();
    new ResizeObserver(draw).observe(fig);
    // card <-> star
    const link = (id, on) => app.querySelector(`.cluster-map a[data-id="${id}"]`)?.classList.toggle("is-hot", on);
    app.querySelectorAll(".pickcard").forEach((el) => {
      el.addEventListener("pointerenter", () => link(el.dataset.id, true));
      el.addEventListener("pointerleave", () => link(el.dataset.id, false));
      el.addEventListener("focusin", () => link(el.dataset.id, true));
      el.addEventListener("focusout", () => link(el.dataset.id, false));
    });
    fig.addEventListener("click", (e) => {
      const a = e.target.closest("a[data-id]");
      if (!a) return;
      e.preventDefault();
      const card = document.getElementById("c-" + a.dataset.id);
      card?.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "center" });
      card?.querySelector(".pick__name")?.focus({ preventScroll: true });
      flash(card);
    });
  }
  function pickCard(p) {
    const host = new URL(p.url).hostname;
    return `<li class="post pickcard card" id="c-${p.id}" data-id="${p.id}">
      <span class="post__star" aria-hidden="true"></span>
      <h2 style="margin:0"><a class="pick__name" href="${p.url}" target="_blank" rel="noopener">${esc(p.name)}<i class="ph ph-arrow-up-right" aria-hidden="true"></i><span class="sr-only"> (opens in a new tab)</span></a></h2>
      <p class="pick__blurb">${esc(p.blurb)}</p>
      <p class="post__meta meta-line"><span>${host}</span><span>picked ${fmtDay(p.date)}</span></p>
      <p class="pickcard__foot meta-line"><span class="post__tags">${p.tags.map((t) => `<a class="tagbtn" href="?view=feed&tag=${esc(t)}">#${esc(t)}</a>`).join("")}</span><a class="infeed" href="?view=feed#${p.id}">In the feed<i class="ph ph-arrow-right" aria-hidden="true"></i></a></p>
    </li>`;
  }
  function drawCluster(host, picks) {
    const w = Math.max(280, Math.round(host.clientWidth || 800));
    const narrow = w < 560;
    const r = rng(1108);
    const n = picks.length; // newest first, like the feed and the cards below
    const h = narrow ? Math.max(220, 60 + n * 64) : 264;
    const dust = Array.from({ length: narrow ? 46 : 80 }, () => `<circle class="dust" cx="${(r() * w).toFixed(1)}" cy="${(r() * h).toFixed(1)}" r="${(0.4 + r() * r() * 1.4).toFixed(2)}" opacity="${(0.25 + r() * 0.6).toFixed(2)}"/>`).join("");
    if (!n) {
      host.innerHTML = `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true">${dust}</svg>`;
      return;
    }
    const pts = picks.map((p, i) => {
      const t = n === 1 ? 0.5 : i / (n - 1);
      if (narrow) return [w * (i % 2 ? 0.64 : 0.36), 44 + t * (h - 88)];
      return [120 + t * (w - 240), h * 0.5 + Math.sin(i * 2.1 + 0.7) * h * 0.2];
    });
    const lead = narrow ? [[pts[0][0] + 10, 0]] : [[pts[0][0] - 90, pts[0][1] + 12]];
    const tail = narrow ? [[pts[n - 1][0] - 10, h]] : [[pts[n - 1][0] + 90, pts[n - 1][1] + 12]];
    const thread = throughPoints([...lead, ...pts, ...tail]);
    const web = pts.map((a, i) => pts.slice(i + 2, i + 3).map((b) => `<path class="web" d="M${a[0]} ${a[1]} L${b[0]} ${b[1]}"/>`).join("")).join("");
    const nodes = picks.map((p, i) => {
      const [x, y] = pts[i];
      let tx = x, ty, anchor = "middle";
      if (narrow) { // labels on the outside, away from the thread
        const left = i % 2 === 0;
        tx = left ? x - 18 : x + 18; anchor = left ? "end" : "start"; ty = y + 1;
      } else { // peaks get labels above, valleys below
        const nb = [pts[i - 1], pts[i + 1]].filter(Boolean);
        const mean = nb.reduce((s, q) => s + q[1], 0) / nb.length;
        ty = y <= mean ? y - 34 : y + 34;
      }
      return `<a href="#c-${p.id}" data-id="${p.id}" aria-label="${esc(p.name)}, picked ${fmtDay(p.date)}">
        <circle class="node-halo" cx="${x}" cy="${y}" r="14"/><circle class="focusring" cx="${x}" cy="${y}" r="20"/><circle class="node" cx="${x}" cy="${y}" r="4.5"/>
        <text class="nm" x="${tx}" y="${ty}" text-anchor="${anchor}">${esc(p.name)}</text>
        <text class="dt" x="${tx}" y="${ty + 15}" text-anchor="${anchor}">${fmtDay(p.date)}</text></a>`;
    }).join("");
    host.innerHTML = `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="group" aria-label="Map of this cluster: ${n} picks, threaded together newest first">
      <g aria-hidden="true">${dust}${web}<path class="ply-base" stroke-width="2.4" d="${thread}"/><path class="ply-twist" stroke-width="2.4" d="${thread}"/></g>${nodes}</svg>`;
  }

  // ============================================================
  // SHARED: lightbox, player, field mask, toast
  // ============================================================
  function lbItems(id) {
    const p = byId[id];
    if (!p) return null;
    if (p.type === "embed") return { title: p.title, items: p.media };
    if (p.type === "article") {
      const items = p.cover ? [{ src: p.cover, alt: `${p.title}, cover` }] : [];
      for (const m of p.body.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)) items.push({ src: m[2], alt: m[1] });
      return items.length ? { title: p.title, items } : null;
    }
    return null;
  }
  function openLB(id, i, opts = {}) {
    const L = lbItems(id);
    if (!L || !window.EthLightbox) return;
    const thumbs = L.items.map((_, k) => app.querySelector(`[data-lb="${id}"][data-i="${k}"]`));
    window.EthLightbox.open({ id, title: L.title, items: L.items, index: clamp(i || 0, 0, L.items.length - 1), thumbs, ...opts });
  }

  // the global <yarn-player> (kit/player.js) owns playback; rows mirror its state via the "yarnplayer" event
  function playTrack(id, i) {
    const p = byId[id];
    const row = app.querySelector(`.track[data-pl="${id}"][data-i="${i}"]`);
    const YP = window.YarnPlayer;
    if (YP && row?.getAttribute("aria-current") === "true" && YP.state?.track?.url === p.tracks[i].src) return YP.toggle();
    const queue = p.tracks.map((t) => ({ name: t.title, url: t.src, artist: t.by, collection: p.title }));
    if (YP?.play) YP.play(queue[i], queue);
    else toast(`Would play “${p.tracks[i].title}”. The global player isn’t loaded in this mock.`);
    markPlaying(p.tracks[i].src, true);
  }
  function markPlaying(url, playing) {
    app.querySelectorAll(".track").forEach((b) => {
      const t = byId[b.dataset.pl].tracks[+b.dataset.i];
      const on = !!url && t.src === url;
      if (on) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current");
      b.querySelector(".ti").dataset.st = on ? (playing ? "playing" : "paused") : "";
      b.querySelector(".pb i").className = on && playing ? "ph-bold ph-pause" : "ph-fill ph-play";
      b.setAttribute("aria-label", `${on && playing ? "Pause" : "Play"} ${t.title} by ${t.by}, ${t.dur}`);
    });
  }
  addEventListener("yarnplayer", (e) => { const d = e.detail; if (d && "track" in d) markPlaying(d.track?.url, !!d.playing); });

  function setTL(btn) {
    const card = btn.closest(".post");
    card.querySelectorAll("[data-tl]").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
    const tbl = card.querySelector(".tl-table");
    tbl.dataset.mode = btn.dataset.tl;
    if (!reduced()) { tbl.classList.remove("fade-in"); void tbl.offsetWidth; tbl.classList.add("fade-in"); }
    requestAnimationFrame(drawThread);
  }

  function maskField() {
    const f = document.getElementById("field");
    if (!f) return;
    const col = app.querySelector(".stream, .reader-wrap .prose, .cluster-wrap");
    if (!col) return;
    const r = col.getBoundingClientRect();
    const isFeed = col.classList.contains("stream");
    const left = isFeed ? r.left + (parseFloat(getComputedStyle(col).paddingLeft) || 0) - 24 : r.left - 16;
    f.style.setProperty("--cl", Math.round(left) + "px");
    f.style.setProperty("--cr", Math.round(r.right + 16) + "px");
    // feed: cards sit on their own haze, so dust may show faintly; articles: fully clear
    f.style.setProperty("--ca", isFeed ? (innerWidth < 960 ? ".4" : ".28") : col.classList.contains("prose") ? "0" : ".35");
  }

  let tt = 0;
  function toast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(tt);
    tt = setTimeout(() => t.classList.remove("show"), 3400);
  }
  function flash(el) {
    if (!el) return;
    el.classList.add("is-target");
    setTimeout(() => el.classList.remove("is-target"), 2200);
  }

  // ---------- events ----------
  app.addEventListener("click", (e) => {
    const f = e.target.closest("button[data-f]");
    if (f) return toggleFilter(f.dataset.f, f.dataset.v);
    if (e.target.closest("[data-clear]")) { sel.type.clear(); sel.tag.clear(); return syncFilters(); }
    const lb = e.target.closest("[data-lb]");
    if (lb) return openLB(lb.dataset.lb, +lb.dataset.i);
    const tr = e.target.closest(".track");
    if (tr) return playTrack(tr.dataset.pl, +tr.dataset.i);
    const pa = e.target.closest("[data-play-all]");
    if (pa) return playTrack(pa.dataset.playAll, 0);
    const sg = e.target.closest("[data-tl]");
    if (sg) return setTL(sg);
  });

  // ---------- boot ----------
  // keep reviewers inside this mock when they press "Thoughts"
  document.querySelectorAll('yarn-nav a[aria-current="page"]').forEach((a) => (a.href = "ethereal.html"));

  if (view === "article") renderArticle(P.get("id") || "a1");
  else if (view === "collection") renderCollection(P.get("c") || "tools");
  else renderFeed();

  // deep-linked post (#id): bring it into view and mark it
  const target = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (target) {
    target.classList.add("is-formed");
    target.scrollIntoView({ block: "center" });
    flash(target);
  }

  // deep-linked image (?lightbox=post:index): put its thumbnail in view right away, open once laid out
  const lbp = P.get("lightbox");
  const [lbId, lbIdx] = lbp && lbp.includes(":") ? lbp.split(":") : [];
  if (lbId) {
    const th = app.querySelector(`[data-lb="${lbId}"][data-i="${+lbIdx || 0}"]`);
    if (th) { th.closest(".post")?.classList.add("is-formed"); if (FREEZE == null) th.scrollIntoView({ block: "center" }); }
  }
  const ready = Promise.race([document.fonts?.ready || Promise.resolve(), new Promise((r) => setTimeout(r, 1200))]);
  ready.then(() => {
    drawThread(); maskField();
    // ?t= freezes motion for review, so the viewer opens already settled
    if (lbId) setTimeout(() => openLB(lbId, +lbIdx || 0, { instant: FREEZE != null }), 80);
  });
  let rz = 0;
  addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => { drawThread(); maskField(); }, 100); });

  // ---------- variants panel ----------
  window.Yarn?.mockPanel([
    { label: "View", param: "view", options: [["feed", "Feed"], ["article", "Article"], ["collection", "Cluster"]], default: "feed" },
    { label: "Frame", param: "frame", options: [["stitch", "Night + stitch"], ["cord", "Dusk gold cord"], ["none", "None"]], default: "stitch" },
    { label: "Field", param: "field", options: [["drift", "Drifting dust"], ["still", "Still"], ["off", "Off"]], default: "drift" },
    { label: "Tag filaments", param: "arcs", options: [["hover", "On hover"], ["always", "Always"], ["off", "Off"]], default: "hover" },
    { label: "Tier preview", param: "tl", options: [["mine", "Mine"], ["everyone", "Everyone’s"]], default: "mine" },
    { label: "Mobile bar", param: "nav", options: [["velvet", "Night velvet"], ["glass", "Smoked glass"], ["corduroy", "Corduroy (kit)"]], default: "velvet" },
    { label: "Lightbox", param: "lightbox", options: [["e1:0", "Sona sheets"], ["e2:0", "Portal"]], default: "" },
  ], { title: "Ethereal options" });
})();
