/* ============================================================
   blaqat.net · round 3 · Projects page (mock)
   Desktop (≥ 960): ?view=stage (list + sticky stage, default) | grid
   Mobile:          ?m=rows (default) | grid | deck
   Shared:          ?p=<slug>  ?type=  ?status=  ?stack=  ?nav=  ?bar=  ?reduced
   ============================================================ */
(() => {
  "use strict";

  const Y = window.Yarn;
  const params = Y.params;
  const root = document.documentElement;
  const reducedMQ = matchMedia("(prefers-reduced-motion: reduce)");
  const isReduced = () => reducedMQ.matches || params.has("reduced");
  const syncReduced = () => root.classList.toggle("is-reduced", isReduced());
  syncReduced();
  if (params.has("clean")) root.classList.add("is-clean"); // hide the mock panel for screenshots
  reducedMQ.addEventListener?.("change", syncReduced);

  const desktopMQ = matchMedia("(min-width: 960px)");
  // room the global player (+ mobile nav) takes at the bottom; kit/player.js keeps --bottom-ui current
  const bottomUI = (fallback) => {
    const v = getComputedStyle(root).getPropertyValue("--bottom-ui").trim();
    return v === "" ? fallback : parseFloat(v) || 0;
  };
  const DEFAULT_M = "rows";

  /* ============================================================
     SPRINGS (damping ratio + response, Apple-style).
     Interruptible: .to() retargets from the current value and velocity.
     ============================================================ */
  const live = new Set();
  let rafId = 0;
  function frame(now) {
    rafId = 0;
    for (const s of [...live]) s._step(now);
    if (live.size) rafId = requestAnimationFrame(frame);
  }
  class Spring {
    constructor(value = 0, o = {}) {
      this.value = value; this.target = value; this.velocity = 0;
      this.damping = o.damping ?? 1; this.response = o.response ?? 0.4; this.rest = o.rest ?? 0.1;
      this.onUpdate = o.onUpdate ?? null; this.onRest = null;
    }
    get moving() { return live.has(this); }
    to(target, o = {}) {
      if (o.damping != null) this.damping = o.damping;
      if (o.response != null) this.response = o.response;
      if (o.velocity != null) this.velocity = o.velocity;
      this.onRest = o.onRest ?? null;
      this.target = target;
      if (o.immediate || isReduced()) { this.jump(target); return this; }
      this._t = performance.now();
      live.add(this);
      if (!rafId) rafId = requestAnimationFrame(frame);
      return this;
    }
    jump(v) {
      live.delete(this);
      this.value = this.target = v; this.velocity = 0;
      this.onUpdate?.(v);
      const r = this.onRest; this.onRest = null; r?.(v);
    }
    set(v) { live.delete(this); this.onRest = null; this.value = v; this.velocity = 0; this.onUpdate?.(v); }
    stop() { live.delete(this); }
    _step(now) {
      const dt = Math.min(0.05, Math.max(0.001, (now - this._t) / 1000));
      this._t = now;
      const w = (2 * Math.PI) / this.response, k = w * w, c = 2 * this.damping * w;
      const n = Math.ceil(dt / 0.004), h = dt / n;
      for (let i = 0; i < n; i++) {
        this.velocity += (-k * (this.value - this.target) - c * this.velocity) * h;
        this.value += this.velocity * h;
      }
      if (Math.abs(this.value - this.target) < this.rest && Math.abs(this.velocity) < this.rest * 20) return this.jump(this.target);
      this.onUpdate?.(this.value);
    }
  }
  // Apple's projection: where a flick would come to rest
  const project = (v, rate = 0.995) => ((v / 1000) * rate) / (1 - rate);
  const rubber = (over, dim, c = 0.55) => (over * dim * c) / (dim + c * Math.abs(over));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  function velocityOf(hist) {
    const now = hist[hist.length - 1];
    if (!now) return 0;
    let first = now;
    for (let i = hist.length - 1; i >= 0; i--) { if (now.t - hist[i].t > 90) break; first = hist[i]; }
    const dt = now.t - first.t;
    return dt > 0 ? ((now.v - first.v) / dt) * 1000 : 0;
  }

  /* ============================================================
     DATA
     ============================================================ */
  const MEDIA_OK = new Set(["sona.png", "sona-different.png", "sona-auri.png", "rawsy.png", "site-plan.png", "beepsearch.png", "portal-student.png", "portal-coach.gif", "bankresult.png", "fitr-redesign.gif", "wsg.mp4", "webcheckers.mp4"]);
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const today = new Date();
  const NOW = { y: today.getFullYear(), m: today.getMonth() };
  const ym = (s) => { const [m, y] = String(s).trim().split(/\s+/); return { y: +y, m: MONTHS.indexOf(m) }; };
  const monthsBetween = (a, b) => (b.y - a.y) * 12 + (b.m - a.m) + 1;
  const fmtDur = (n) => (n < 12 ? `${n} mo` : `${Math.floor(n / 12)} yr${n % 12 ? ` ${n % 12} mo` : ""}`);
  const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-");
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const lc = (s) => slugify(s);

  const STATUS = {
    Ongoing: { label: "Ongoing", icon: "ph-needle", cls: "st--on" },
    Completed: { label: "Done", icon: "ph-check", cls: "st--done" },
    Paused: { label: "Paused", icon: "ph-pause", cls: "st--paused" },
  };
  const TYPE = { Personal: "ph-user", Work: "ph-briefcase", School: "ph-graduation-cap" };

  function splitDesc(md) {
    let s = md.replace(/\r/g, "").trim();
    let tagline = "";
    const m = s.match(/^#{1,6}\s+(.+)\n+/);
    if (m) { tagline = m[1].trim(); s = s.slice(m[0].length); }
    const cut = s.search(/\n\s*(-{3,}\s*\n|#{1,6}\s)/);
    const summary = cut === -1 ? s : s.slice(0, cut);
    const writeup = cut === -1 ? "" : s.slice(cut).trim().replace(/^-{3,}\s*\n/, "");
    return { tagline, summary: summary.trim(), writeup: writeup.trim() };
  }

  function normalize(raw) {
    const p = { ...raw };
    p.slug = slugify(p.name);
    const s = ym(p.start);
    p.ongoing = p.status === "Ongoing";
    const e = !p.ongoing && p.end ? ym(p.end) : null;
    p.media = (p.images || []).map((im, i) => {
      const file = im.src.split("/").pop();
      const local = im.src.startsWith("/media/");
      const kind = /\.(mp4|webm|mov|m4v)$/i.test(file) ? "video" : "image";
      return { src: local ? `../media/${file}` : im.src, file, kind, ok: local && MEDIA_OK.has(file), alt: (im.alt || "").trim() || (kind === "video" ? `${p.name} demo video` : `Screenshot of ${p.name}`) };
    });
    p.thumb = p.media.find((m) => m.ok && m.kind === "image") || p.media.find((m) => m.ok) || p.media[0] || null;
    p.lead = Math.max(0, p.media.findIndex((m) => m.ok));
    p.years = p.ongoing ? `${s.y}–now` : e && e.y !== s.y ? `${s.y}–${String(e.y).slice(2)}` : `${s.y}`;
    p.when = p.ongoing ? `${p.start} – now` : e ? (p.end === p.start ? p.start : `${p.start} – ${p.end}`) : `${p.start} – on hold`;
    const n = p.ongoing ? monthsBetween(s, NOW) : e ? monthsBetween(s, e) : 0;
    p.dur = n ? fmtDur(n) : "";
    const last = p.ongoing ? null : e || s;
    p.yearKey = p.ongoing ? "now" : String(last.y);
    p.sortKey = p.ongoing ? 1e6 + s.y * 12 + s.m : last.y * 12 + last.m;
    Object.assign(p, splitDesc(p.description || ""));
    const code = p.writeup.match(/```[^\n]*\n([\s\S]*?)```/);
    p.code = code ? code[1] : "";
    p.summaryHTML = summaryHTML(p.summary);
    p.initials = p.name.split(/\s+/).filter((w) => /^[a-z0-9]/i.test(w)).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
    return p;
  }

  // summary: every line is its own paragraph (that's how the data is written); "> " lines become a note
  function summaryHTML(src) {
    const blocks = [];
    let q = null;
    for (const raw of src.split("\n")) {
      const t = raw.trim();
      if (!t) { q = null; continue; }
      if (t.startsWith(">")) { if (!q) blocks.push((q = [])); q.push(t.replace(/^>\s?/, "")); }
      else { q = null; blocks.push(t); }
    }
    return blocks.map((b) => (Array.isArray(b) ? `<blockquote><p>${b.map(inline).join("<br>")}</p></blockquote>` : `<p>${inline(b)}</p>`)).join("");
  }

  /* ---------- tiny markdown (enough for this data) ---------- */
  function inline(src) {
    const codes = [];
    let s = esc(src).replace(/`([^`]+)`/g, (_, c) => `\u0000${codes.push(c) - 1}\u0000`);
    s = s
      .replace(/\*\*([^*]+?)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\*)/g, "$1<em>$2</em>")
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    return s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${codes[+i]}</code>`);
  }
  function md(src) {
    const lines = src.replace(/\r/g, "").split("\n");
    let out = "", para = [], i = 0;
    const flush = () => { if (para.length) { out += `<p>${inline(para.join(" "))}</p>`; para = []; } };
    while (i < lines.length) {
      const line = lines[i].trim();
      if (line.startsWith("```")) {
        flush();
        const buf = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith("```")) buf.push(lines[i++]);
        i++;
        out += `<pre><code>${esc(buf.join("\n"))}</code></pre>`;
        continue;
      }
      if (!line) { flush(); i++; continue; }
      if (/^(-{3,}|\*{3,})$/.test(line)) { flush(); out += "<hr>"; i++; continue; }
      let m;
      if ((m = line.match(/^(#{1,6})\s+(.*)$/))) { flush(); const h = m[1].length <= 2 ? 4 : 5; out += `<h${h}>${inline(m[2])}</h${h}>`; i++; continue; }
      if (line.startsWith(">")) {
        flush();
        const buf = [];
        while (i < lines.length && lines[i].trim().startsWith(">")) buf.push(lines[i++].trim().replace(/^>\s?/, ""));
        out += `<blockquote>${md(buf.join("\n"))}</blockquote>`;
        continue;
      }
      if (/^[-*]\s+/.test(line)) {
        flush();
        let html = "<ul>", nested = false;
        while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
          const indent = lines[i].match(/^\s*/)[0].length;
          const text = inline(lines[i].trim().replace(/^[-*]\s+/, ""));
          if (indent >= 2 && html.endsWith("</li>")) {
            if (!nested) { html = html.slice(0, -5) + "<ul>"; nested = true; }
            html += `<li>${text}</li>`;
          } else {
            if (nested) { html += "</ul></li>"; nested = false; }
            html += `<li>${text}</li>`;
          }
          i++;
        }
        out += html + (nested ? "</ul></li>" : "") + "</ul>";
        continue;
      }
      para.push(line);
      i++;
    }
    flush();
    return out;
  }

  const ALL = (window.BLAQAT?.projects || []).map(normalize).sort((a, b) => b.sortKey - a.sortKey);
  const BY = Object.fromEntries(ALL.map((p) => [p.slug, p]));
  const stackCount = {};
  ALL.forEach((p) => p.stack.forEach((s) => (stackCount[s] = (stackCount[s] || 0) + 1)));
  const STACK_TOP = Object.keys(stackCount).filter((s) => stackCount[s] > 1).sort((a, b) => stackCount[b] - stackCount[a] || a.localeCompare(b));
  const STACK_REST = Object.keys(stackCount).filter((s) => stackCount[s] === 1).sort((a, b) => a.localeCompare(b));
  const FILTER_VALUES = { type: ["Personal", "Work", "School"], status: ["Ongoing", "Completed", "Paused"], stack: [...STACK_TOP, ...STACK_REST] };

  /* ============================================================
     STATE + URL
     ============================================================ */
  const fromParam = (key) => {
    const want = (params.get(key) || "").split(",").map((s) => s.trim()).filter(Boolean);
    return new Set(FILTER_VALUES[key].filter((v) => want.includes(lc(v))));
  };
  const state = {
    view: params.get("view") === "grid" ? "grid" : "stage",
    m: ["rows", "grid", "deck"].includes(params.get("m")) ? params.get("m") : DEFAULT_M,
    sel: BY[params.get("p")] ? params.get("p") : null,
    f: { type: fromParam("type"), status: fromParam("status"), stack: fromParam("stack") },
    media: {},
    moreStacks: false,
  };
  state.moreStacks = [...state.f.stack].some((s) => STACK_REST.includes(s));

  let urlT = 0;
  function syncURL(now = false) {
    const write = () => {
      const u = new URL(location.href);
      const sp = u.searchParams;
      const put = (k, v) => (v ? sp.set(k, v) : sp.delete(k));
      put("p", state.sel);
      for (const k of ["type", "status", "stack"]) put(k, [...state.f[k]].map(lc).join(","));
      if (desktopMQ.matches) put("view", state.view === "grid" ? "grid" : null);
      history.replaceState(history.state, "", u);
    };
    clearTimeout(urlT);
    now ? write() : (urlT = setTimeout(write, 120));
  }

  const matches = (p, f = state.f, skip) =>
    (skip === "type" || !f.type.size || f.type.has(p.type)) &&
    (skip === "status" || !f.status.size || f.status.has(p.status)) &&
    (skip === "stack" || !f.stack.size || p.stack.some((s) => f.stack.has(s)));
  const visibleList = () => ALL.filter((p) => matches(p));

  const liveEl = () => document.getElementById("pj-live");
  let liveT = 0;
  function announce(text) {
    clearTimeout(liveT);
    liveT = setTimeout(() => { const el = liveEl(); if (el) el.textContent = text; }, 380);
  }
  const describe = (p) => `${p.name}. ${p.when}. ${STATUS[p.status].label}. ${p.type} project.${p.media.length ? ` ${p.media.length} media.` : ""}`;

  /* ============================================================
     HTML BUILDERS
     ============================================================ */
  const tpl = document.createElement("template");
  const html = (s) => { tpl.innerHTML = s.trim(); return tpl.content.firstElementChild; };

  const statusHTML = (p) => {
    const s = STATUS[p.status];
    const icon = p.ongoing ? `<i class="ph-bold ${s.icon} st__needle" aria-hidden="true"></i>` : `<i class="ph-bold ${s.icon}" aria-hidden="true"></i>`;
    return `<span class="st ${s.cls}">${icon}${s.label}</span>`;
  };
  const statusTag = (p) => {
    const s = STATUS[p.status];
    return `<span class="tag ${p.ongoing ? "tag--on" : ""}"><i class="ph-bold ${s.icon}" aria-hidden="true"></i>${p.ongoing ? "Ongoing, now building" : p.status}</span>`;
  };
  const typeHTML = (p) => `<span class="ty"><i class="ph ${TYPE[p.type] || "ph-folder"}" aria-hidden="true"></i>${esc(p.type)}</span>`;
  const ribbonHTML = (small) => `<span class="ribbon-tab" aria-hidden="true"><i class="ph-bold ph-needle"></i>${small ? "Building" : "Now building"}</span>`;

  function codeHeroHTML(p) {
    const kw = /\b(fn|let|mut|match|impl|type|use|pub|struct|enum|if|else|return|for|in|Some|None|Ok|Err|self|Self)\b/g;
    const body = p.code.split("\n").slice(0, 18).map((l) => {
      let e = esc(l), com = "";
      const ci = e.indexOf("//");
      if (ci >= 0) { com = `<span class="c">${e.slice(ci)}</span>`; e = e.slice(0, ci); }
      return e.replace(kw, '<span class="k">$1</span>') + com;
    }).join("\n");
    return `<div class="codehero" role="img" aria-label="Code excerpt from the ${esc(p.name)} write-up"><pre aria-hidden="true">${body}</pre><span class="codehero__label"><i class="ph ph-code"></i>from the write-up</span></div>`;
  }
  // Designed placeholder: a cream felt badge with the project's initials, sewn onto
  // section-colored cord. Missing videos get a small "video · not in this mock" label in
  // the hero and a camera mark in filmstrips; never a black box.
  function swatchPH(p, mode, { video = false, alt = "" } = {}) {
    const ini = esc(p?.initials || "");
    const inner = mode === "hero" && video
      ? `<span class="cordph__label"><i class="ph-fill ph-video-camera" aria-hidden="true"></i><b>Video</b> · not in this mock</span>`
      : mode === "hero"
        ? `<span class="cordph__label"><i class="ph ph-image" aria-hidden="true"></i>No screenshots yet</span>`
        : "";
    const badge = mode === "thumb" && video ? `<i class="ph-fill ph-video-camera" aria-hidden="true"></i>` : `<span class="cordph__ini">${ini}</span>`;
    const a11y = mode === "hero" ? `role="img" aria-label="${video ? `Video, not included in this mock: ${esc(alt)}` : `No screenshots of ${esc(p?.name || "")} yet`}"` : 'aria-hidden="true"';
    return `<div class="cordph cordph--${mode}" ${a11y}><span class="cordph__badge">${badge}</span>${inner}</div>`;
  }
  const monoHTML = (p, mode) => swatchPH(p, mode);
  const posterHTML = (mi, mode, p) => swatchPH(p, mode, { video: true, alt: mi.alt });
  // the excerpt as a light "paper" tile for grid patches
  function codeTileHTML(p) {
    const lines = p.code.split("\n").filter((l) => l.trim()).slice(0, 9).map((l) => esc(l)).join("\n");
    return `<div class="codetile" aria-hidden="true"><pre>${lines}</pre><span class="codetile__ini">${esc(p.initials)}</span></div>`;
  }
  // thumbnails for rows / tiles / patches: the first real image; else a playable video frame (badged);
  // else the code excerpt (tiles) or the initials swatch
  function thumbHTML(p, mode) {
    const img = p.media.find((m) => m.ok && m.kind === "image");
    if (img) return mediaEl(img, mode, p);
    const vid = p.media.find((m) => m.ok && m.kind === "video");
    if (vid) return mode === "thumb" ? mediaEl(vid, "thumb", p) : mediaEl(vid, mode, p) + `<span class="vbadge"><i class="ph-fill ph-video-camera" aria-hidden="true"></i>video</span>`;
    if (p.code && mode === "tile") return codeTileHTML(p);
    return swatchPH(p, mode);
  }
  // mode: hero | tile | thumb
  function mediaEl(mi, mode, p) {
    if (!mi) return p.code && mode === "hero" ? codeHeroHTML(p) : monoHTML(p, mode);
    if (!mi.ok) return posterHTML(mi, mode, p);
    if (mi.kind === "video" && mode === "thumb") // filmstrip: frame + camera mark
      return `<video class="m-el" src="${mi.src}#t=0.5" muted playsinline preload="auto" aria-hidden="true" tabindex="-1"></video><span class="vbadge"><i class="ph-fill ph-video-camera" aria-hidden="true"></i></span>`;
    if (mi.kind === "video") {
      return mode === "hero"
        ? `<video class="m-el" src="${mi.src}#t=0.1" muted playsinline loop preload="auto" data-autoplay aria-label="${esc(mi.alt)}"></video>`
        : `<video class="m-el" src="${mi.src}#t=0.5" muted playsinline preload="auto" aria-hidden="true" tabindex="-1"></video>`;
    }
    return mode === "hero"
      ? `<img class="m-el" src="${mi.src}" alt="${esc(mi.alt)}" decoding="async" draggable="false">`
      : `<img class="m-el" src="${mi.src}" alt="" loading="lazy" decoding="async" draggable="false">`;
  }
  function slideHTML(p, i, { ribbon = true } = {}) {
    const mi = p.media[i];
    const bg = mi && mi.ok && mi.kind === "image" ? `<img class="slide__bg" src="${mi.src}" alt="" aria-hidden="true" draggable="false">` : "";
    return `<div class="slide" data-i="${i}">${bg}${mediaEl(mi, "hero", p)}${ribbon && p.ongoing ? ribbonHTML() : ""}</div>`;
  }
  const capText = (p, i) => {
    const mi = p.media[i];
    if (!mi) return p.code ? "No screenshots, so here's a bit of the code." : "No screenshots for this one yet.";
    return esc(mi.alt) + (mi.ok ? "" : ' <span class="meta">(video not in mock)</span>');
  };
  function stripHTML(p, i, cls = "strip") {
    const n = p.media.length;
    const thumbs = n > 1
      ? `<div class="strip__thumbs" role="group" aria-label="${esc(p.name)} media">${p.media
          .map((mi, j) => `<button type="button" class="sbtn" data-i="${j}" aria-current="${j === i}" aria-label="Show ${mi.kind} ${j + 1} of ${n}: ${esc(mi.alt)}"><span class="thumb">${mediaEl(mi, "thumb", p)}</span></button>`)
          .join("")}</div>`
      : "";
    return `<div class="${cls}">${thumbs}<p class="strip__cap">${capText(p, i)}</p></div>`;
  }
  const stackHTML = (p) => `<ul class="stack" aria-label="Built with">${p.stack.map((s) => `<li class="tag${state.f.stack.has(s) ? " is-hit" : ""}" data-stack="${esc(s)}">${esc(s)}</li>`).join("")}</ul>`;
  function viewLabel(url) {
    const h = (() => { try { return new URL(url).hostname; } catch { return ""; } })();
    if (h.includes("discord.com")) return "Add to Discord";
    if (h.includes("exercism.org")) return "On Exercism";
    if (h.includes("github.com")) return "See the themes";
    return "Visit site";
  }
  function linksHTML(p, cls = "links") {
    const a = [];
    if (p.view) a.push(`<a class="btn btn--red" href="${esc(p.view)}" target="_blank" rel="noopener"><i class="ph-bold ph-arrow-up-right" aria-hidden="true"></i>${viewLabel(p.view)}</a>`);
    if (p.github) a.push(`<a class="btn" href="${esc(p.github)}" target="_blank" rel="noopener"><i class="ph ph-github-logo" aria-hidden="true"></i>GitHub</a>`);
    return a.length ? `<div class="${cls}">${a.join("")}</div>` : `<p class="meta links__none">No public links: private or retired.</p>`;
  }
  const writeupHTML = (p) =>
    `<details class="dt__writeup"><summary><i class="ph ph-scroll" aria-hidden="true"></i>Read the write-up<i class="ph-bold ph-caret-down" aria-hidden="true"></i></summary><div class="md">${md(p.writeup)}</div></details>`;

  function detailsHTML(p) {
    return `<div class="dt">
      <div class="dt__main">
        <h2 class="h2 dt__name">${esc(p.name)}</h2>
        ${p.tagline ? `<p class="dt__tagline">${inline(p.tagline)}</p>` : ""}
        <div class="md dt__summary">${p.summaryHTML}</div>
        ${p.writeup ? writeupHTML(p) : ""}
      </div>
      <aside class="dt__side" aria-label="Facts">
        <dl class="facts">
          <div><dt>When</dt><dd>${esc(p.when)}${p.dur ? `<span class="meta">${p.dur}</span>` : ""}</dd></div>
          <div><dt>Status</dt><dd>${statusTag(p)}</dd></div>
          <div><dt>Type</dt><dd>${typeHTML(p)}</dd></div>
        </dl>
        ${stackHTML(p)}
        ${linksHTML(p)}
      </aside>
    </div>`;
  }

  let uid = 0;
  // compact filmstrip for tight spaces: labelled dot buttons over the hero
  const dotsHTML = (p, i) =>
    `<div class="hdots" role="group" aria-label="${esc(p.name)} media">${p.media
      .map((mi, j) => `<button type="button" class="sbtn sbtn--dot" data-i="${j}" aria-current="${j === i}" aria-label="Show ${mi.kind} ${j + 1} of ${p.media.length}: ${esc(mi.alt)}"></button>`)
      .join("")}</div>`;
  // media-first detail used by every mobile layout
  function mDetailHTML(p, { carousel = true, title = false } = {}) {
    const n = p.media.length, i = Math.min(state.media[p.slug] ?? p.lead, Math.max(0, n - 1));
    const id = `sum-${p.slug}-${++uid}`;
    const slides = n ? p.media.map((_, j) => slideHTML(p, j, { ribbon: false })).join("") : slideHTML(p, -1, { ribbon: false });
    const media = carousel
      ? `<div class="mcar">${p.ongoing ? ribbonHTML() : ""}<div class="mcar__track" tabindex="0" role="region" aria-label="${esc(p.name)} media${n > 1 ? ", swipe for more" : ""}">${slides}</div>${n > 1 ? `<span class="hero__count" aria-hidden="true">${i + 1} / ${n}</span>` : ""}</div>`
      : `<div class="hero">${slideHTML(p, n ? i : -1)}<span class="hero__count" aria-hidden="true">${n > 1 ? `${i + 1} / ${n}` : ""}</span>${n > 1 ? dotsHTML(p, i) : ""}</div>`;
    return `${media}
      ${carousel ? stripHTML(p, i, "mstrip") : ""}
      <div class="mdt">
        ${title ? `<div class="mdt__head"><p class="eyebrow">${esc(p.type)} · ${p.years}</p>${statusHTML(p)}</div><h2 class="h2 mdt__name">${esc(p.name)}</h2>` : ""}
        ${p.tagline ? `<p class="mdt__tagline">${inline(p.tagline)}</p>` : ""}
        <div class="md mdt__sum is-clamped" id="${id}">${p.summaryHTML}</div>
        <button type="button" class="mdt__more" aria-expanded="false" aria-controls="${id}" hidden>More<i class="ph-bold ph-caret-down" aria-hidden="true"></i></button>
        ${title ? "" : `<p class="mdt__when meta">${statusHTML(p)}<span>${esc(p.when)}${p.dur ? ` · ${p.dur}` : ""}</span>${typeHTML(p)}</p>`}
        ${stackHTML(p)}
        ${linksHTML(p, "mlinks")}
        ${p.writeup ? writeupHTML(p) : ""}
      </div>`;
  }

  const emptyHTML = () =>
    `<div class="pempty patch" hidden><p><strong>Nothing on the needles matches that.</strong><br>Try removing a filter.</p><button type="button" class="btn btn--red" data-reset><i class="ph-bold ph-arrow-counter-clockwise" aria-hidden="true"></i>Show all projects</button></div>`;

  /* ============================================================
     MEDIA: swap slides (cross-fade, interruptible), autoplay videos
     ============================================================ */
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) en.target._vis = en.isIntersecting;
    syncVideos();
  }, { threshold: 0.4 });
  const watchVideos = (el) => el.querySelectorAll("video[data-autoplay]").forEach((v) => io.observe(v));
  function syncVideos() {
    for (const v of document.querySelectorAll("video[data-autoplay]")) {
      const slide = v.closest(".slide");
      const hero = slide?.parentElement;
      const top = !hero?.classList.contains("hero") || [...hero.querySelectorAll(":scope > .slide")].pop() === slide;
      const ok = v._vis && !document.hidden && top && !v.closest("[hidden], [data-closing], .is-ghost");
      if (ok) { if (v.paused) v.play().catch(() => {}); } else if (!v.paused) v.pause();
    }
  }
  document.addEventListener("visibilitychange", syncVideos);
  // any media that fails to load becomes a tidy poster, never a broken element
  document.addEventListener("error", (e) => {
    const el = e.target;
    if (!(el instanceof HTMLElement) || !el.classList.contains("m-el")) return;
    const mode = el.closest(".slide") ? "hero" : "thumb";
    const p = BY[el.closest("[data-slug]")?.dataset.slug];
    el.replaceWith(html(posterHTML({ alt: el.getAttribute("aria-label") || el.alt || "media" }, mode, p)));
  }, true);

  function swapSlide(hero, p, i, { dx = 0, dy = 0, instant = false, ribbon = true } = {}) {
    const el = html(slideHTML(p, i, { ribbon }));
    const olds = [...hero.querySelectorAll(":scope > .slide")];
    olds.slice(0, -2).forEach((s) => s.remove());
    el.style.setProperty("--dx", dx);
    el.style.setProperty("--dy", dy);
    const anchor = hero.querySelector(":scope > .hero__count");
    if (instant) {
      olds.forEach((s) => s.remove());
      hero.insertBefore(el, anchor);
    } else {
      el.classList.add("is-enter");
      hero.insertBefore(el, anchor);
      void el.offsetWidth;
      el.classList.remove("is-enter");
      let cleaned = false;
      const done = () => {
        if (cleaned) return;
        cleaned = true;
        for (const s of [...hero.querySelectorAll(":scope > .slide")]) { if (s === el) break; s.remove(); }
        syncVideos();
      };
      el.addEventListener("transitionend", (e) => { if (e.target === el && e.propertyName === "opacity") done(); });
      setTimeout(done, 700);
    }
    watchVideos(el);
    syncVideos();
    return el;
  }
  function updateStrip(scope, p, i) {
    scope.querySelectorAll(".sbtn").forEach((b) => b.setAttribute("aria-current", String(+b.dataset.i === i)));
    const cap = scope.querySelector(".strip__cap");
    if (cap) cap.innerHTML = capText(p, i);
    const cnt = scope.querySelector(".hero__count");
    if (cnt) cnt.textContent = p.media.length > 1 ? `${i + 1} / ${p.media.length}` : "";
  }
  // ←/→ inside a filmstrip moves between its buttons
  function stripKeys(e) {
    const b = e.target.closest(".sbtn");
    if (!b || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    const all = [...b.parentElement.querySelectorAll(".sbtn")];
    let j = all.indexOf(b);
    j = e.key === "Home" ? 0 : e.key === "End" ? all.length - 1 : clamp(j + (e.key === "ArrowRight" ? 1 : -1), 0, all.length - 1);
    e.preventDefault();
    e.stopPropagation();
    all[j].focus();
    all[j].click();
  }

  /* ============================================================
     STAGE (desktop): hero + filmstrip + details, cross-fading
     ============================================================ */
  class Stage {
    constructor(el) {
      this.el = el;
      this.hero = el.querySelector(".hero");
      this.stripSlot = el.querySelector(".strip-slot");
      this.details = el.querySelector(".stage__details");
      this.p = null;
      this.i = 0;
      this.stripSlot.addEventListener("click", (e) => { const b = e.target.closest(".sbtn"); if (b) this.media(+b.dataset.i); });
      this.stripSlot.addEventListener("keydown", stripKeys);
      // fade the bottom edge only while there is more to scroll
      const more = () => this.details.classList.toggle("has-more", this.details.scrollTop + this.details.clientHeight < this.details.scrollHeight - 6);
      this.details.addEventListener("scroll", more, { passive: true });
      this.details.addEventListener("toggle", () => requestAnimationFrame(more), true);
      this._more = more;
    }
    show(p, { dir = 0, instant = false } = {}) {
      if (this.p === p) return;
      this.p = p;
      this.i = Math.min(state.media[p.slug] ?? p.lead, Math.max(0, p.media.length - 1));
      swapSlide(this.hero, p, p.media.length ? this.i : -1, { dy: dir, instant });
      this.stripSlot.innerHTML = stripHTML(p, this.i);
      updateStrip(this.el, p, this.i);
      // details: old pane fades out, new pane rises in from the direction of travel
      const pane = html(`<div class="dpane">${detailsHTML(p)}</div>`);
      for (const o of this.details.querySelectorAll(".dpane")) {
        o.classList.add("is-out");
        o.inert = true;
        o.setAttribute("aria-hidden", "true");
        setTimeout(() => o.remove(), instant ? 0 : 200);
      }
      pane.style.setProperty("--dy", dir);
      if (!instant) pane.classList.add("is-enter");
      this.details.append(pane);
      this.details.scrollTop = 0;
      if (!instant) { void pane.offsetWidth; pane.classList.remove("is-enter"); }
      setTimeout(this._more, instant ? 0 : 220);
      this.el.setAttribute("aria-label", p.name);
    }
    media(i) {
      const p = this.p;
      if (!p || i === this.i || i < 0 || i >= p.media.length) return;
      const dx = Math.sign(i - this.i);
      this.i = state.media[p.slug] = i;
      swapSlide(this.hero, p, i, { dx });
      updateStrip(this.el, p, i);
    }
  }
  const stageShell = (extra = "") => `
    <div class="hero"><span class="hero__count" aria-hidden="true"></span></div>
    <div class="strip-slot"></div>
    <div class="stage__details"></div>${extra}`;

  /* ============================================================
     ACCORDION ENGINE: an element opens/closes by a spring offset o
     (−H … 0). Everything after it in the container rides along by
     transform; the element itself is clipped. Layout only changes
     at rest, so nothing jumps and everything is interruptible.
     ============================================================ */
  class Accordion {
    constructor(container, { measure, clip, unclip }) {
      this.c = container;
      this.ex = new Map();
      this.measure = measure;
      this.clip = clip;
      this.unclip = unclip;
    }
    ensure(el) {
      let st = this.ex.get(el);
      if (!st) {
        const H = this.measure(el);
        st = { H, o: 0, closing: false, spring: new Spring(0, { rest: 0.4 }) };
        st.spring.onUpdate = (v) => { st.o = v; this.apply(); };
        this.ex.set(el, st);
      }
      return st;
    }
    open(el, { instant = false, velocity = 0, damping = 1 } = {}) {
      const fresh = !this.ex.has(el);
      const st = this.ensure(el);
      st.H = this.measure(el);
      if (fresh) st.spring.set(-st.H);
      st.closing = false;
      el.removeAttribute("data-closing");
      if (instant) { st.spring.stop(); this.ex.delete(el); this.apply(); return; }
      st.spring.to(0, { velocity, damping, response: 0.44, onRest: () => { this.ex.delete(el); this.apply(); } });
    }
    close(el, { instant = false, velocity = 0, done } = {}) {
      const st = this.ensure(el);
      st.closing = true;
      el.setAttribute("data-closing", "");
      const finish = () => { this.ex.delete(el); el.removeAttribute("data-closing"); done?.(); this.apply(); };
      if (instant) { st.spring.stop(); finish(); return; }
      st.spring.to(-st.H, { velocity, response: 0.38, onRest: finish });
      syncVideos();
    }
    apply() {
      let acc = 0;
      for (const c of this.c.children) {
        if (c.classList.contains("is-ghost")) continue;
        const t = acc ? `translate3d(0, ${acc.toFixed(2)}px, 0)` : "";
        if (c.style.transform !== t) c.style.transform = t;
        const st = this.ex.get(c);
        if (st) { this.clip(c, st); c._clipped = true; acc += st.o; }
        else if (c._clipped) { this.unclip(c); c._clipped = false; }
      }
    }
  }

  /* ============================================================
     FILTERS
     ============================================================ */
  const filtersEl = document.getElementById("pj-filters");
  const countEl = document.getElementById("pj-count");
  const anyFilter = () => state.f.type.size + state.f.status.size + state.f.stack.size > 0;

  function chip(f, v, label, icon) {
    return `<button type="button" class="chip" data-f="${f}" data-v="${esc(v)}" aria-pressed="false">${icon ? `<i class="ph ${icon}" aria-hidden="true"></i>` : ""}${esc(label)}</button>`;
  }
  function renderFilters() {
    filtersEl.innerHTML = `
      <div class="fbar" role="group" aria-label="Filter projects">
        <button type="button" class="chip chip--all" data-f="all" aria-pressed="true">Show all</button>
        <div class="fgroup" role="group" aria-label="Type"><span class="flabel eyebrow" aria-hidden="true">Type</span>
          ${FILTER_VALUES.type.map((v) => chip("type", v, v, TYPE[v])).join("")}</div>
        <div class="fgroup" role="group" aria-label="Status"><span class="flabel eyebrow" aria-hidden="true">Status</span>
          ${FILTER_VALUES.status.map((v) => chip("status", v, STATUS[v].label, STATUS[v].icon)).join("")}</div>
        <div class="fgroup" role="group" aria-label="Stack"><span class="flabel eyebrow" aria-hidden="true">Stack</span>
          ${STACK_TOP.map((v) => chip("stack", v, v)).join("")}
          <span class="fextra" id="fextra" ${state.moreStacks ? "" : "hidden"}>${STACK_REST.map((v) => chip("stack", v, v)).join("")}</span>
          <button type="button" class="chip chip--more" aria-expanded="${state.moreStacks}" aria-controls="fextra">${state.moreStacks ? "Fewer" : `+${STACK_REST.length} more`}</button>
        </div>
      </div>`;
    paintFilters();
  }
  function paintFilters() {
    for (const b of filtersEl.querySelectorAll(".chip[data-f]")) {
      const f = b.dataset.f, v = b.dataset.v;
      if (f === "all") { b.setAttribute("aria-pressed", String(!anyFilter())); continue; }
      b.setAttribute("aria-pressed", String(state.f[f].has(v)));
      // faceted: would this chip find anything, given the other groups?
      const n = ALL.filter((p) => matches(p, state.f, f) && (f === "stack" ? p.stack.includes(v) : p[f] === v)).length;
      b.classList.toggle("is-zero", n === 0);
      b.title = `${n} project${n === 1 ? "" : "s"}`;
    }
    const vis = visibleList().length;
    countEl.innerHTML = vis === ALL.length ? `<b>${ALL.length}</b> projects · 2020 → now` : `<b>${vis}</b> of ${ALL.length} projects`;
    document.querySelectorAll(".stack .tag[data-stack]").forEach((t) => t.classList.toggle("is-hit", state.f.stack.has(t.dataset.stack)));
  }
  filtersEl.addEventListener("click", (e) => {
    const more = e.target.closest(".chip--more");
    if (more) {
      state.moreStacks = !state.moreStacks;
      filtersEl.querySelector(".fextra").hidden = !state.moreStacks;
      more.setAttribute("aria-expanded", String(state.moreStacks));
      more.textContent = state.moreStacks ? "Fewer" : `+${STACK_REST.length} more`;
      view?.resize?.();
      return;
    }
    const b = e.target.closest(".chip[data-f]");
    if (!b) return;
    const f = b.dataset.f, v = b.dataset.v;
    if (f === "all") for (const k in state.f) state.f[k].clear();
    else state.f[f].has(v) ? state.f[f].delete(v) : state.f[f].add(v); // first tap solos, more taps add, tap again removes
    applyFilters();
  });
  function resetFilters() { for (const k in state.f) state.f[k].clear(); applyFilters(); }
  function applyFilters({ initial = false } = {}) {
    paintFilters();
    const vis = new Set(visibleList().map((p) => p.slug));
    view?.filter(vis, { initial });
    document.querySelectorAll(".pempty").forEach((el) => (el.hidden = vis.size > 0));
    if (!initial) syncURL();
  }
  document.addEventListener("click", (e) => { if (e.target.closest("[data-reset]")) resetFilters(); });

  // sticky filter strip on mobile: once it sticks, it gets a patch shadow + stitched edge so
  // rows scrolling under it don't collide with it. A 1px sentinel just above it tells us when.
  const stuckSentinel = document.createElement("div");
  stuckSentinel.setAttribute("aria-hidden", "true");
  stuckSentinel.style.cssText = "height:1px;margin-bottom:-1px;pointer-events:none";
  filtersEl.before(stuckSentinel);
  let stuckIO = null;
  function watchStuck() {
    stuckIO?.disconnect();
    const top = Math.round(parseFloat(getComputedStyle(filtersEl).top) || 0);
    stuckIO = new IntersectionObserver(([en]) => {
      filtersEl.classList.toggle("is-stuck", !desktopMQ.matches && !en.isIntersecting && en.boundingClientRect.top < top + 2);
    }, { rootMargin: `-${top + 1}px 0px 0px 0px`, threshold: 0 });
    stuckIO.observe(stuckSentinel);
  }

  /* ============================================================
     VIEW: desktop list + stage
     ============================================================ */
  const rowHTML = (p) => `
    <li data-slug="${p.slug}">
      <button type="button" class="prow rope" role="tab" id="tab-${p.slug}" data-slug="${p.slug}" aria-selected="false" aria-controls="stage" tabindex="-1">
        <span class="thumb">${thumbHTML(p, "thumb")}</span>
        <span class="prow__name">${esc(p.name)}</span>
        ${statusHTML(p)}
        ${typeHTML(p)}
        <span class="prow__yr">${p.years}</span>
      </button>
    </li>`;

  const StageView = {
    mount(body) {
      body.className = "pj-body pj-body--stage";
      body.innerHTML = `
        <div class="plist-col">
          <ol class="plist" role="tablist" aria-orientation="vertical" aria-label="Projects">${ALL.map(rowHTML).join("")}</ol>
          ${emptyHTML()}
          <p class="plist-foot"><kbd>↑</kbd><kbd>↓</kbd><span class="meta">or</span><kbd>J</kbd><kbd>K</kbd><span class="meta">to flip through · hover to peek</span></p>
        </div>
        <div class="stage-wrap">
          <section class="stage patch" id="stage" role="tabpanel" tabindex="-1">${stageShell()}</section>
        </div>`;
      this.body = body;
      this.list = body.querySelector(".plist");
      this.stage = new Stage(body.querySelector(".stage"));
      this.hoverRow = null;
      this.ht = 0;
      // hover intent: a row has to hold the pointer ~160 ms before the stage follows
      this.list.addEventListener("pointermove", (e) => {
        if (e.pointerType !== "mouse") return;
        const row = e.target.closest(".prow");
        if (!row || row === this.hoverRow) return;
        this.hoverRow = row;
        clearTimeout(this.ht);
        if (row.dataset.slug !== state.sel) this.ht = setTimeout(() => this.select(row.dataset.slug, { via: "hover" }), 160);
      });
      this.list.addEventListener("pointerleave", () => { clearTimeout(this.ht); this.hoverRow = null; });
      this.list.addEventListener("click", (e) => {
        const row = e.target.closest(".prow");
        if (!row) return;
        clearTimeout(this.ht);
        this.select(row.dataset.slug, { via: "click" });
      });
      this.list.addEventListener("keydown", (e) => {
        const map = { ArrowDown: 1, ArrowUp: -1, j: 1, k: -1, Home: "first", End: "last" };
        if (!(e.key in map) || e.metaKey || e.ctrlKey || e.altKey) return;
        e.preventDefault();
        e.stopPropagation();
        this.step(map[e.key], { focus: true });
      });
      this.resize();
    },
    rows() { return [...this.list.querySelectorAll("li:not([hidden]) .prow")]; },
    step(d, { focus = false } = {}) {
      const rows = this.rows();
      if (!rows.length) return;
      let i = rows.findIndex((r) => r.dataset.slug === state.sel);
      i = d === "first" ? 0 : d === "last" ? rows.length - 1 : clamp(i + d, 0, rows.length - 1);
      this.select(rows[i].dataset.slug, { via: "key", focus });
    },
    select(slug, { via = "click", focus = false, instant = false } = {}) {
      const p = BY[slug];
      if (!p) return;
      const prev = state.sel;
      const dir = prev && prev !== slug ? Math.sign(ALL.indexOf(p) - ALL.indexOf(BY[prev])) : 0;
      state.sel = slug;
      for (const r of this.list.querySelectorAll(".prow")) {
        const on = r.dataset.slug === slug;
        r.setAttribute("aria-selected", String(on));
        r.tabIndex = on ? 0 : -1;
        r.classList.toggle("is-roped", on);
      }
      const row = this.list.querySelector(`#tab-${CSS.escape(slug)}`);
      this.stage.el.setAttribute("aria-labelledby", row.id);
      this.stage.show(p, { dir, instant });
      if (focus) { row.focus({ preventScroll: true }); row.scrollIntoView({ block: "nearest", behavior: isReduced() ? "auto" : "smooth" }); }
      if (via !== "init") { syncURL(); announce(describe(p)); }
    },
    filter(vis, { initial } = {}) {
      const items = [...this.list.children];
      // FLIP: surviving rows glide to their new slots
      const first = new Map(items.map((li) => [li, li.hidden ? null : li.getBoundingClientRect().top]));
      items.forEach((li) => (li.hidden = !vis.has(li.dataset.slug)));
      if (!initial && !isReduced()) {
        for (const li of items) {
          if (li.hidden) continue;
          const f = first.get(li);
          li._sp?.stop();
          li.style.transform = "";
          if (f == null) { li.animate([{ opacity: 0, transform: "scale(.97)" }, { opacity: 1, transform: "none" }], { duration: 240, easing: "cubic-bezier(.2,.8,.2,1)" }); continue; }
          const d = f - li.getBoundingClientRect().top;
          if (Math.abs(d) < 0.5) continue;
          li._sp ||= new Spring(0, { rest: 0.3, onUpdate: (v) => (li.style.transform = v ? `translateY(${v}px)` : "") });
          li._sp.set(d);
          li._sp.to(0, { response: 0.42 });
        }
      }
      const stageEl = this.stage.el;
      stageEl.classList.toggle("is-empty", vis.size === 0);
      stageEl.inert = vis.size === 0;
      stageEl.style.opacity = vis.size === 0 ? ".35" : "";
      if (!vis.size) return;
      let sel = state.sel && vis.has(state.sel) ? state.sel : ALL.find((p) => vis.has(p.slug)).slug;
      const fromURL = initial && state.sel === sel;
      this.select(sel, { via: initial ? "init" : "filter", instant: initial });
      if (initial && !fromURL) state.sel = sel; // default pick stays out of the URL until the user acts
      else if (!initial) syncURL();
    },
    resize() {
      const top = this.body.getBoundingClientRect().top + scrollY;
      const frame = parseFloat(getComputedStyle(document.body).paddingTop) || 14;
      const h = Math.max(520, innerHeight - top - frame - 18 - bottomUI(0));
      this.body.style.setProperty("--stage-h", `${Math.round(h)}px`);
      // tall screens get roomier rows so the list keeps pace with the stage (always sized for all 12)
      this.body.style.setProperty("--row-h", `${Math.round(clamp((h - 40) / ALL.length - 6, 46, 64))}px`);
    },
    escape() {},
    destroy() { clearTimeout(this.ht); },
  };

  /* ============================================================
     VIEW: desktop contact-sheet grid. Choosing a patch unrolls a
     detail panel across the full row, right under it.
     ============================================================ */
  const gcellHTML = (p) => `
    <div class="gcell" data-slug="${p.slug}" style="position:relative">
      <button type="button" class="gpatch patch rope" data-slug="${p.slug}" aria-expanded="false">
        <span class="thumb">${thumbHTML(p, "tile")}</span>
        <span class="gpatch__name">${esc(p.name)}</span>
        <span class="gpatch__meta"><span class="yr">${p.years}</span>${statusHTML(p)}</span>
      </button>
      ${p.ongoing ? ribbonHTML(true) : ""}
    </div>`;

  const GridView = {
    mount(body, { fromURL = false } = {}) {
      body.className = "pj-body pj-body--grid";
      body.innerHTML = `<div class="ggrid">${ALL.map(gcellHTML).join("")}</div>${emptyHTML()}<p class="plist-foot desktop-only" style="margin-top:14px"><kbd>←</kbd><kbd>→</kbd><kbd>↑</kbd><kbd>↓</kbd><span class="meta">to move ·</span><kbd>J</kbd><kbd>K</kbd><span class="meta">next/previous ·</span><kbd>Esc</kbd><span class="meta">to close</span></p>`;
      this.grid = body.querySelector(".ggrid");
      this.panel = null;
      this.acc = new Accordion(this.grid, {
        measure: (el) => el.offsetHeight + (parseFloat(getComputedStyle(this.grid).rowGap) || 16),
        clip: (el, st) => {
          const ph = el.offsetHeight;
          el.style.clipPath = `inset(-14px -24px ${Math.min(ph, -st.o).toFixed(1)}px -24px)`;
          el.style.opacity = String(clamp(1 + (st.o / st.H) * 1.6, 0, 1));
        },
        unclip: (el) => { el.style.clipPath = ""; el.style.opacity = ""; },
      });
      this.grid.addEventListener("click", (e) => {
        if (e.target.closest(".gpanel__close")) return this.close({ focus: true });
        const b = e.target.closest(".gpatch");
        if (b) state.sel === b.dataset.slug && this.panel ? this.close() : this.open(b.dataset.slug);
      });
      this.grid.addEventListener("keydown", (e) => this.keys(e));
      this.pendingOpen = fromURL && state.sel;
      if (!fromURL) state.sel = null;
    },
    cells() { return [...this.grid.querySelectorAll(".gcell:not([hidden])")]; },
    cellOf(slug) { return this.grid.querySelector(`.gcell[data-slug="${CSS.escape(slug)}"]`); },
    rowEnd(cell) {
      const cells = this.cells();
      let last = cell;
      for (const c of cells.slice(cells.indexOf(cell) + 1)) { if (c.offsetTop === cell.offsetTop) last = c; else break; }
      return last;
    },
    open(slug, { instant = false } = {}) {
      const p = BY[slug], cell = this.cellOf(slug);
      if (!p || !cell || cell.hidden) return;
      const prevSlug = state.sel;
      const last = this.rowEnd(cell);
      let panel = last.nextElementSibling?.classList.contains("gpanel") ? last.nextElementSibling : null;
      if (this.panel && this.panel !== panel) {
        const old = this.panel;
        this.acc.close(old, { instant, done: () => old.remove() });
      }
      if (!panel) {
        panel = html(`<div class="gpanel" role="region" aria-label="Project details">
            <span class="gpanel__notch" aria-hidden="true"></span>
            <section class="stage patch">${stageShell()}</section>
            <button type="button" class="btn gpanel__close" aria-label="Close details"><i class="ph-bold ph-x" aria-hidden="true"></i></button>
          </div>`);
        last.after(panel);
        panel._stage = new Stage(panel.querySelector(".stage"));
        panel._stage.show(p, { instant: true });
        this.acc.open(panel, { instant });
      } else {
        const dir = prevSlug ? Math.sign(ALL.indexOf(p) - ALL.indexOf(BY[prevSlug])) : 0;
        panel._stage.show(p, { dir });
        if (panel.hasAttribute("data-closing")) this.acc.open(panel);
      }
      this.panel = panel;
      panel.setAttribute("aria-label", `${p.name} details`);
      // notch springs over to the chosen patch
      const nx = cell.offsetLeft + cell.offsetWidth / 2 - panel.offsetLeft;
      panel._nx ||= new Spring(nx, { rest: 0.3, onUpdate: (v) => panel.style.setProperty("--nx", `${v}px`) });
      panel._nx.to(nx, { immediate: instant || !panel._nxSet, response: 0.36 });
      panel._nxSet = true;
      state.sel = slug;
      for (const b of this.grid.querySelectorAll(".gpatch")) {
        const on = b.dataset.slug === slug;
        b.setAttribute("aria-expanded", String(on));
        b.classList.toggle("is-roped", on);
        if (on) b.setAttribute("aria-controls", panel.id || (panel.id = `gpanel-${++uid}`));
        else b.removeAttribute("aria-controls");
      }
      syncURL();
      announce(describe(p));
      // bring the panel into view if it unrolled below the fold
      requestAnimationFrame(() => {
        const r = cell.getBoundingClientRect();
        const bottom = r.bottom + panel.offsetHeight + 24;
        if (bottom > innerHeight) scrollBy({ top: Math.min(bottom - innerHeight, r.top - 24), behavior: instant || isReduced() ? "auto" : "smooth" });
      });
    },
    close({ instant = false, focus = false } = {}) {
      if (!this.panel) return;
      const old = this.panel, slug = state.sel;
      this.acc.close(old, { instant, done: () => old.remove() });
      this.panel = null;
      state.sel = null;
      for (const b of this.grid.querySelectorAll(".gpatch")) { b.setAttribute("aria-expanded", "false"); b.classList.remove("is-roped"); b.removeAttribute("aria-controls"); }
      if (focus && slug) this.cellOf(slug)?.querySelector(".gpatch").focus();
      syncURL();
    },
    keys(e) {
      if (!e.target.closest(".gpatch") || e.metaKey || e.ctrlKey || e.altKey) return;
      const cells = this.cells();
      const i = cells.indexOf(e.target.closest(".gcell"));
      const cols = cells.filter((c) => c.offsetTop === cells[0].offsetTop).length || 1;
      const d = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols }[e.key];
      if (d == null) return;
      e.preventDefault();
      const n = cells[clamp(i + d, 0, cells.length - 1)];
      n.querySelector(".gpatch").focus();
      if (this.panel) this.open(n.dataset.slug);
    },
    step(d) {
      const cells = this.cells();
      if (!cells.length) return;
      let i = cells.findIndex((c) => c.dataset.slug === state.sel);
      if (i < 0) { i = cells.indexOf(document.activeElement?.closest?.(".gcell")); if (i >= 0) d = 0; }
      const n = cells[clamp(i + d, 0, cells.length - 1)];
      n.querySelector(".gpatch").focus({ preventScroll: true });
      this.open(n.dataset.slug);
    },
    escape() { this.close({ focus: true }); },
    filter(vis, { initial } = {}) {
      const cells = [...this.grid.querySelectorAll(".gcell")];
      if (this.panel) this.close({ instant: true });
      const first = new Map(cells.map((c) => [c, c.hidden ? null : c.getBoundingClientRect()]));
      cells.forEach((c) => (c.hidden = !vis.has(c.dataset.slug)));
      if (!initial && !isReduced()) flipCells(cells, first);
      if (initial && this.pendingOpen && vis.has(this.pendingOpen)) this.open(this.pendingOpen, { instant: true });
      this.pendingOpen = null;
    },
    resize() {},
    destroy() {},
  };

  // generic translate-only FLIP with springs (x and y separately)
  function flipCells(els, first, { response = 0.44 } = {}) {
    for (const el of els) {
      if (el.hidden) continue;
      const f = first.get(el);
      el._fx?.stop(); el._fy?.stop();
      el.style.transform = "";
      if (!f) { el.animate([{ opacity: 0, transform: "scale(.96)" }, { opacity: 1, transform: "none" }], { duration: 260, easing: "cubic-bezier(.2,.8,.2,1)" }); continue; }
      const l = el.getBoundingClientRect();
      const dx = f.left - l.left, dy = f.top - l.top;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue;
      const paint = () => { const x = el._fx.value, y = el._fy.value; el.style.transform = Math.abs(x) + Math.abs(y) < 0.01 ? "" : `translate3d(${x}px, ${y}px, 0)`; };
      el._fx ||= new Spring(0, { rest: 0.3, onUpdate: paint });
      el._fy ||= new Spring(0, { rest: 0.3, onUpdate: paint });
      el._fx.set(dx); el._fy.set(dy);
      el._fx.to(0, { response }); el._fy.to(0, { response });
    }
  }

  /* ============================================================
     MOBILE shared: wire a media-first detail (carousel, strip, more)
     ============================================================ */
  function wireDetail(scope, p) {
    const track = scope.querySelector(".mcar__track");
    const n = p.media.length;
    if (track && n > 1) {
      let raf = 0;
      track.addEventListener("scroll", () => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          const i = clamp(Math.round(track.scrollLeft / track.clientWidth), 0, n - 1);
          if (i !== state.media[p.slug]) { state.media[p.slug] = i; updateStrip(scope, p, i); syncVideos(); }
        });
      }, { passive: true });
      const i = state.media[p.slug] ?? p.lead;
      if (i) requestAnimationFrame(() => (track.scrollLeft = i * track.clientWidth));
    }
    scope.addEventListener("click", (e) => {
      const b = e.target.closest(".sbtn");
      if (b && scope.contains(b)) {
        const i = +b.dataset.i;
        if (track) track.scrollTo({ left: i * track.clientWidth, behavior: isReduced() ? "auto" : "smooth" });
        else {
          const hero = scope.querySelector(".hero");
          const cur = state.media[p.slug] ?? p.lead;
          if (i !== cur) { state.media[p.slug] = i; swapSlide(hero, p, i, { dx: Math.sign(i - cur) }); }
        }
        state.media[p.slug] = i;
        updateStrip(scope, p, i);
      }
      const more = e.target.closest(".mdt__more");
      if (more && scope.contains(more)) {
        const sum = scope.querySelector(".mdt__sum");
        const open = more.getAttribute("aria-expanded") !== "true";
        sum.classList.toggle("is-clamped", !open);
        sum.classList.remove("is-fade");
        more.setAttribute("aria-expanded", String(open));
        more.innerHTML = open ? 'Less<i class="ph-bold ph-caret-up" aria-hidden="true"></i>' : 'More<i class="ph-bold ph-caret-down" aria-hidden="true"></i>';
        scope.querySelector(".mdt")?.classList.toggle("is-scroll", open);
        onDetailResize?.(scope);
      }
    });
    scope.addEventListener("keydown", stripKeys);
    scope.addEventListener("toggle", () => {
      const open = !!scope.querySelector(".dt__writeup[open]") || scope.querySelector(".mdt__more")?.getAttribute("aria-expanded") === "true";
      scope.querySelector(".mdt")?.classList.toggle("is-scroll", open);
    }, true);
    watchVideos(scope);
  }
  let onDetailResize = null;
  function checkMore(scope) {
    const sum = scope.querySelector(".mdt__sum");
    const more = scope.querySelector(".mdt__more");
    if (!sum || !more || more.getAttribute("aria-expanded") === "true") return;
    more.hidden = sum.scrollHeight <= sum.clientHeight + 4 && !scope.querySelector(".dt__writeup");
  }

  /* ============================================================
     VIEW (b): mobile compact rows → inline media-led detail,
     drag the bottom grip up to roll it closed.
     ============================================================ */
  const mrowHTML = (p) => `
    <li class="mrow" data-slug="${p.slug}">
      <button type="button" class="mrow__head" aria-expanded="false" aria-controls="mb-${p.slug}">
        <span class="thumb">${thumbHTML(p, "thumb")}</span>
        <span>
          <span class="mrow__name">${esc(p.name)}</span>
          <span class="mrow__meta"><span>${p.years}</span><span class="sep">·</span>${statusHTML(p)}<span class="sep">·</span><span>${esc(p.type)}</span></span>
        </span>
        <span class="mrow__caret" aria-hidden="true"><i class="ph-bold ph-caret-down"></i></span>
      </button>
      <div class="mrow__body" id="mb-${p.slug}" hidden></div>
    </li>`;

  // 640–959 px: rows flow into two columns (column-major, so reading order stays chronological)
  const twoColMQ = matchMedia("(min-width: 640px) and (max-width: 959px)");

  const RowsView = {
    mount(body) {
      body.className = "pj-body pj-body--rows";
      body.innerHTML = `<div class="mrows-cols"><ol class="mrows" aria-label="Projects">${ALL.map(mrowHTML).join("")}</ol><ol class="mrows mrows--b" aria-label="Projects, continued" hidden></ol></div>${emptyHTML()}`;
      this.wrap = body.querySelector(".mrows-cols");
      this.lists = [...body.querySelectorAll(".mrows")];
      this.openLi = null;
      const opts = {
        measure: (li) => li.querySelector(".mrow__body").offsetHeight,
        clip: (li, st) => {
          li.style.clipPath = `inset(-12px -12px ${(-st.o).toFixed(1)}px -12px round 16px)`;
          const body = li.querySelector(".mrow__body");
          body.style.opacity = String(clamp(1 + (st.o / st.H) * 1.25, 0, 1));
          const grab = li.querySelector(".grab");
          if (grab) grab.style.transform = `translateY(${st.o.toFixed(1)}px)`;
          body.style.transform = `translateY(${(st.o * 0.12).toFixed(1)}px)`;
        },
        unclip: (li) => {
          li.style.clipPath = "";
          const body = li.querySelector(".mrow__body");
          body.style.opacity = body.style.transform = "";
          const grab = li.querySelector(".grab");
          if (grab) grab.style.transform = "";
        },
      };
      // one accordion per column: an opening row only pushes rows below it in its own column
      this.accs = this.lists.map((l) => new Accordion(l, opts));
      this.wrap.addEventListener("click", (e) => {
        const head = e.target.closest(".mrow__head");
        if (head) {
          const li = head.closest(".mrow");
          return li.classList.contains("is-open") ? this.close(li, { keep: true }) : this.open(li.dataset.slug);
        }
        const grab = e.target.closest(".grab");
        if (grab && !this.dragged) this.close(grab.closest(".mrow"), { focus: true, keep: true });
        this.dragged = false;
      });
      this.wrap.addEventListener("pointerdown", (e) => this.grabStart(e));
      this._mq = () => this.distribute();
      twoColMQ.addEventListener("change", this._mq);
    },
    acc(li) { return this.accs[this.lists.indexOf(li.parentElement)] || this.accs[0]; },
    items() { return [...this.wrap.querySelectorAll(".mrow")].sort((a, b) => ALL.indexOf(BY[a.dataset.slug]) - ALL.indexOf(BY[b.dataset.slug])); },
    li(slug) { return this.wrap.querySelector(`.mrow[data-slug="${CSS.escape(slug)}"]`); },
    // put visible rows into one or two columns; settles any running animation first
    distribute() {
      // finish in-flight opens/closes (their completion callbacks run) before moving rows
      this.accs.forEach((a) => { for (const st of [...a.ex.values()]) st.spring.jump(st.spring.target); a.apply(); });
      const items = this.items();
      const vis = items.filter((li) => !li.hidden);
      const two = twoColMQ.matches && vis.length > 1;
      const half = two ? Math.ceil(vis.length / 2) : vis.length;
      const [a, b] = this.lists;
      vis.forEach((li, i) => (i < half ? a : b).append(li));
      items.filter((li) => li.hidden).forEach((li) => a.append(li));
      b.hidden = !two;
      b.start = half + 1;
    },
    open(slug, { instant = false } = {}) {
      const li = this.li(slug), p = BY[slug];
      if (!li || li.hidden) return;
      if (this.openLi && this.openLi !== li) this.close(this.openLi, { instant });
      const body = li.querySelector(".mrow__body");
      if (!body.dataset.ready) {
        body.innerHTML = mDetailHTML(p) + `<button type="button" class="grab" aria-label="Collapse ${esc(p.name)}"><span class="grab__bar" aria-hidden="true"></span><span aria-hidden="true">pull up to close</span></button>`;
        wireDetail(body, p);
        body.dataset.ready = "1";
      }
      body.hidden = false;
      li.classList.add("is-open");
      li.querySelector(".mrow__head").setAttribute("aria-expanded", "true");
      checkMore(body);
      this.openLi = li;
      state.sel = slug;
      syncURL();
      this.acc(li).open(li, { instant });
      watchVideos(body);
      // keep the opened row's head comfortably on screen
      requestAnimationFrame(() => {
        const r = li.getBoundingClientRect();
        const stickyBottom = filtersEl.getBoundingClientRect().bottom + 8;
        if (r.top < stickyBottom || r.top > innerHeight * 0.45) li.scrollIntoView({ block: "start", behavior: instant || isReduced() ? "auto" : "smooth" });
      });
    },
    // keep: after a standalone collapse, bring the header back if it ended up under the sticky strip
    close(li, { instant = false, velocity = 0, focus = false, keep = false } = {}) {
      if (!li) return;
      li.classList.remove("is-open");
      li.querySelector(".mrow__head").setAttribute("aria-expanded", "false");
      const body = li.querySelector(".mrow__body");
      this.acc(li).close(li, {
        instant, velocity,
        done: () => {
          body.hidden = true;
          syncVideos();
          if (keep && !li.hidden) {
            const top = li.getBoundingClientRect().top;
            if (top < filtersEl.getBoundingClientRect().bottom + 4) li.scrollIntoView({ block: "nearest", behavior: isReduced() ? "auto" : "smooth" });
          }
        },
      });
      if (focus) li.querySelector(".mrow__head").focus({ preventScroll: true });
      if (this.openLi === li) { this.openLi = null; state.sel = null; syncURL(); }
    },
    // drag-to-collapse: the grip tracks the finger 1:1, release hands off velocity
    grabStart(e) {
      const grab = e.target.closest(".grab");
      if (!grab || e.button > 0) return;
      const li = grab.closest(".mrow");
      const acc = this.acc(li);
      const st = acc.ensure(li);
      st.H = li.querySelector(".mrow__body").offsetHeight;
      st.spring.stop();
      grab.setPointerCapture(e.pointerId);
      const y0 = e.clientY, o0 = st.o;
      const hist = [{ t: performance.now(), v: o0 }];
      let moved = false;
      const move = (ev) => {
        const dy = ev.clientY - y0;
        if (Math.abs(dy) > 6) moved = true;
        let o = o0 + dy;
        if (o > 0) o = rubber(o, 260);
        if (o < -st.H) o = -st.H;
        st.spring.set(o);
        hist.push({ t: performance.now(), v: o });
        if (hist.length > 12) hist.shift();
      };
      const up = () => {
        grab.removeEventListener("pointermove", move);
        grab.removeEventListener("pointerup", up);
        grab.removeEventListener("pointercancel", up);
        if (!moved) { if (st.o === 0) acc.ex.delete(li); return; }
        this.dragged = true;
        const v = velocityOf(hist);
        const projected = st.o + project(v, 0.99);
        if (v < -500 || projected < -Math.min(st.H * 0.3, 110)) this.close(li, { velocity: v, keep: true });
        else acc.open(li, { velocity: v, damping: Math.abs(v) > 400 ? 0.8 : 1 });
      };
      grab.addEventListener("pointermove", move);
      grab.addEventListener("pointerup", up);
      grab.addEventListener("pointercancel", up);
    },
    step(d) {
      const items = this.items().filter((li) => !li.hidden);
      if (!items.length) return;
      const i = items.findIndex((li) => li.dataset.slug === state.sel);
      this.open(items[clamp(i + d, 0, items.length - 1)].dataset.slug);
    },
    escape() { if (this.openLi) this.close(this.openLi, { focus: true, keep: true }); },
    filter(vis, { initial } = {}) {
      const items = this.items();
      if (this.openLi && !vis.has(this.openLi.dataset.slug)) this.close(this.openLi, { instant: true });
      const first = new Map(items.map((li) => [li, li.hidden ? null : li.getBoundingClientRect()]));
      items.forEach((li) => (li.hidden = !vis.has(li.dataset.slug)));
      this.distribute();
      if (!initial && !isReduced()) flipCells(items, first);
      if (initial && state.sel && vis.has(state.sel)) this.open(state.sel, { instant: true });
    },
    resize() {},
    destroy() { twoColMQ.removeEventListener("change", this._mq); },
  };

  /* ============================================================
     VIEW (a): mobile 2-column patch grid; a tapped patch grows to
     full width in place (from its own rect), neighbours reflow.
     ============================================================ */
  const mtileHTML = (p) => `
    <div class="mtile patch" data-slug="${p.slug}">
      <button type="button" class="mtile__btn" aria-expanded="false" aria-controls="mt-${p.slug}">
        <span class="thumb">${thumbHTML(p, "tile")}</span>
        <span class="mtile__name">${esc(p.name)}</span>
        <span class="mtile__meta"><span class="yr">${p.years}</span>${statusHTML(p)}</span>
      </button>
      ${p.ongoing ? ribbonHTML(true) : ""}
      <div class="mtile__open" id="mt-${p.slug}" hidden></div>
    </div>`;

  const TilesView = {
    mount(body) {
      body.className = "pj-body pj-body--tiles";
      body.innerHTML = `<div class="mgrid">${ALL.map(mtileHTML).join("")}</div>${emptyHTML()}`;
      this.grid = body.querySelector(".mgrid");
      this.openEl = null;
      this.grid.addEventListener("click", (e) => {
        if (e.target.closest(".mtile__close")) return this.close({ focus: true });
        const b = e.target.closest(".mtile__btn");
        if (b) this.open(b.closest(".mtile").dataset.slug);
      });
    },
    tile(slug) { return this.grid.querySelector(`.mtile[data-slug="${CSS.escape(slug)}"]`); },
    tiles() { return [...this.grid.querySelectorAll(".mtile:not([hidden])")]; },
    expandDOM(t) {
      const p = BY[t.dataset.slug];
      const box = t.querySelector(".mtile__open");
      if (!box.dataset.ready) {
        box.innerHTML = `<div class="mtile__top"><h2 class="h2">${esc(p.name)}</h2><button type="button" class="btn mtile__close" aria-label="Close ${esc(p.name)}"><i class="ph-bold ph-x" aria-hidden="true"></i></button></div>${mDetailHTML(p)}`;
        wireDetail(box, p);
        box.dataset.ready = "1";
      }
      box.hidden = false;
      t.classList.add("is-open");
      t.querySelector(".mtile__btn").setAttribute("aria-expanded", "true");
    },
    collapseDOM(t) {
      t.querySelector(".mtile__open").hidden = true;
      t.classList.remove("is-open");
      t.querySelector(".mtile__btn").setAttribute("aria-expanded", "false");
    },
    // FLIP every tile; the opening one is revealed by a clip that starts at its old rect
    transition(mutate, { opening, closing, instant }) {
      const tiles = this.tiles();
      const gridR = this.grid.getBoundingClientRect();
      const first = new Map(tiles.map((t) => [t, t.getBoundingClientRect()]));
      let ghost = null;
      if (closing && !instant && !isReduced()) {
        const f = first.get(closing);
        ghost = closing.cloneNode(true);
        ghost.classList.add("is-ghost");
        ghost.setAttribute("aria-hidden", "true");
        ghost.inert = true;
        ghost.querySelectorAll("[id]").forEach((n) => n.removeAttribute("id"));
        ghost.querySelectorAll("video").forEach((v) => { v.removeAttribute("data-autoplay"); v.pause(); });
        Object.assign(ghost.style, { position: "absolute", left: `${f.left - gridR.left}px`, top: `${f.top - gridR.top}px`, width: `${f.width}px`, height: `${f.height}px`, margin: 0, transform: "", clipPath: "", pointerEvents: "none", zIndex: 3 });
      }
      mutate();
      if (instant || isReduced()) {
        tiles.forEach((t) => { t._p?.stop(); t._fx?.stop(); t._fy?.stop(); t.style.transform = t.style.clipPath = ""; });
        if (isReduced() && opening) opening.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
        return;
      }
      if (ghost) this.grid.append(ghost);
      const others = tiles.filter((t) => t !== opening);
      flipCells(others, first);
      if (closing) closing.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, delay: 60, fill: "backwards" });
      if (ghost) {
        const f = first.get(closing), l = closing.getBoundingClientRect();
        const ins = { t: l.top - f.top, r: f.right - l.right, b: f.bottom - l.bottom, l: l.left - f.left };
        const sp = new Spring(0, { rest: 0.004, onUpdate: (k) => {
          ghost.style.clipPath = `inset(${ins.t * k}px ${ins.r * k}px ${ins.b * k}px ${ins.l * k}px round 16px)`;
          ghost.style.opacity = String(1 - k * k);
        } });
        sp.to(1, { response: 0.4, onRest: () => ghost.remove() });
      }
      if (opening) {
        const f = first.get(opening);
        opening._fx?.stop(); opening._fy?.stop();
        opening.style.transform = "";
        const l = opening.getBoundingClientRect();
        const d = { x: f.left - l.left, y: f.top - l.top, r: Math.max(0, l.width - f.width), b: Math.max(0, l.height - f.height) };
        opening._p?.stop();
        opening._p = new Spring(0, { rest: 0.004, onUpdate: (k) => {
          const q = 1 - k;
          opening.style.transform = q > 0.0005 ? `translate3d(${d.x * q}px, ${d.y * q}px, 0)` : "";
          opening.style.clipPath = q > 0.0005 ? `inset(0 ${d.r * q}px ${d.b * q}px 0 round 16px)` : "";
        } });
        opening._p.set(0);
        opening._p.to(1, { response: 0.46 });
      }
    },
    open(slug, { instant = false } = {}) {
      const t = this.tile(slug);
      if (!t || t.hidden || t === this.openEl) return;
      const prev = this.openEl;
      this.transition(() => {
        if (prev) this.collapseDOM(prev);
        this.expandDOM(t);
      }, { opening: t, closing: prev, instant });
      this.openEl = t;
      state.sel = slug;
      syncURL();
      checkMore(t);
      requestAnimationFrame(() => {
        const r = t.getBoundingClientRect();
        const stickyBottom = filtersEl.getBoundingClientRect().bottom + 8;
        if (r.top < stickyBottom || r.top > innerHeight * 0.5) t.scrollIntoView({ block: "start", behavior: instant || isReduced() ? "auto" : "smooth" });
      });
    },
    close({ instant = false, focus = false } = {}) {
      const t = this.openEl;
      if (!t) return;
      this.transition(() => this.collapseDOM(t), { closing: t, instant });
      this.openEl = null;
      state.sel = null;
      syncURL();
      if (focus) t.querySelector(".mtile__btn").focus({ preventScroll: true });
      syncVideos();
    },
    step(d) {
      const tiles = this.tiles();
      if (!tiles.length) return;
      const order = tiles.map((t) => t.dataset.slug).sort((a, b) => ALL.indexOf(BY[a]) - ALL.indexOf(BY[b]));
      const i = order.indexOf(state.sel);
      this.open(order[clamp(i + d, 0, order.length - 1)]);
    },
    escape() { this.close({ focus: true }); },
    filter(vis, { initial } = {}) {
      const tiles = [...this.grid.querySelectorAll(".mtile")];
      if (this.openEl && !vis.has(this.openEl.dataset.slug)) this.close({ instant: true });
      const first = new Map(tiles.map((t) => [t, t.hidden ? null : t.getBoundingClientRect()]));
      tiles.forEach((t) => (t.hidden = !vis.has(t.dataset.slug)));
      if (!initial && !isReduced()) flipCells(tiles, first);
      if (initial && state.sel && vis.has(state.sel)) this.open(state.sel, { instant: true });
    },
    resize() {},
    destroy() {},
  };

  /* ============================================================
     VIEW (c): mobile swatch deck. Flick with momentum, rubber-band
     at the ends, scrub the year rail to fly through.
     ============================================================ */
  const swatchHTML = (p) => `
    <article class="swatch patch" data-slug="${p.slug}" role="group" aria-roledescription="slide" aria-label="${esc(p.name)}">
      ${mDetailHTML(p, { carousel: false, title: true })}
    </article>`;

  const DeckView = {
    mount(body) {
      body.className = "pj-body pj-body--deck";
      document.getElementById("pj-main").classList.add("pj--deck");
      body.innerHTML = `
        <div class="mdeck" tabindex="0" role="region" aria-roledescription="carousel" aria-label="Projects, use left and right arrows">
          <div class="mdeck__track">${ALL.map(swatchHTML).join("")}</div>
        </div>
        ${emptyHTML()}
        <div class="scrub">
          <button type="button" class="btn scrub__btn" data-step="-1" aria-label="Previous project"><i class="ph-bold ph-caret-left" aria-hidden="true"></i></button>
          <div class="scrub__rail" role="slider" tabindex="0" aria-label="Project timeline" aria-valuemin="1"></div>
          <button type="button" class="btn scrub__btn" data-step="1" aria-label="Next project"><i class="ph-bold ph-caret-right" aria-hidden="true"></i></button>
        </div>`;
      this.deck = body.querySelector(".mdeck");
      this.track = body.querySelector(".mdeck__track");
      this.rail = body.querySelector(".scrub__rail");
      this.scrub = body.querySelector(".scrub");
      this.x = new Spring(0, { rest: 0.25, onUpdate: (v) => this.render(v) });
      this.cur = -1;
      this.items = [];
      this.track.querySelectorAll(".swatch").forEach((sw) => wireDetail(sw, BY[sw.dataset.slug]));
      onDetailResize = () => {};
      this.wirePointer();
      this.wireRail();
      body.addEventListener("click", (e) => {
        const b = e.target.closest(".scrub__btn");
        if (b) this.go(this.cur + +b.dataset.step);
      });
      this.deck.addEventListener("keydown", (e) => {
        const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
        if (d && e.target === this.deck) { e.preventDefault(); this.go(this.cur + d); }
      });
      this.deck.addEventListener("focusin", (e) => {
        const sw = e.target.closest(".swatch");
        if (sw) { this.deck.scrollLeft = 0; const i = this.items.indexOf(sw); if (i >= 0 && i !== this.cur) this.go(i); }
      });
    },
    layout() {
      const vw = this.deck.clientWidth;
      const gap = 10;
      this.W = Math.min(vw - 40, 440);
      const pad = (vw - this.W) / 2;
      this.stepW = this.W + gap;
      this.deck.style.setProperty("--deck-w", `${this.W}px`);
      this.deck.style.setProperty("--deck-pad", `${pad}px`);
      this.deck.style.setProperty("--deck-gap", `${gap}px`);
      const top = this.deck.getBoundingClientRect().top + scrollY;
      const frame = parseFloat(getComputedStyle(document.body).paddingTop) || 7;
      const h = Math.max(400, innerHeight - top - this.scrub.offsetHeight - bottomUI(84) - frame - 14);
      this.deck.style.setProperty("--deck-h", `${Math.round(h)}px`);
      this.items.forEach((sw) => this.fit(sw));
      this.drawRail();
      this.x.jump(-Math.max(0, this.cur) * this.stepW);
    },
    // clamp the summary to whatever room the swatch has left
    fit(sw) {
      const sum = sw.querySelector(".mdt__sum");
      const more = sw.querySelector(".mdt__more");
      if (!sum || more.getAttribute("aria-expanded") === "true") return;
      more.hidden = true;
      sw.style.setProperty("--clamp", 99);
      const mdt = sw.querySelector(".mdt");
      const over = mdt.scrollHeight - mdt.clientHeight;
      if (over <= 0) { more.hidden = !sw.querySelector(".dt__writeup"); return; }
      const lh = parseFloat(getComputedStyle(sum).lineHeight) || 21;
      sw.style.setProperty("--clamp", Math.max(2, Math.floor((sum.clientHeight - over - 42) / lh)));
      more.hidden = false;
    },
    drawRail() {
      const n = this.items.length;
      const w = this.rail.clientWidth, pad = 14;
      this.railPad = pad;
      this.railW = w - pad * 2;
      const xs = this.items.map((_, i) => pad + (n > 1 ? (i / (n - 1)) * this.railW : this.railW / 2));
      this.xs = xs;
      const y = 33;
      let d = `M ${pad - 8} ${y}`;
      for (let x = pad - 8; x < w - pad + 8; x += 12) d += ` Q ${x + 3} ${y - 2.2}, ${x + 6} ${y} T ${x + 12} ${y}`;
      const yrs = [];
      this.items.forEach((sw, i) => {
        const k = BY[sw.dataset.slug].yearKey;
        const g = yrs[yrs.length - 1];
        if (!g || g.k !== k) yrs.push({ k, i, j: i });
        else g.j = i;
      });
      this.yrs = yrs;
      this.rail.innerHTML = `
        <svg class="scrub__svg" viewBox="0 0 ${w} 56" aria-hidden="true">
          <path class="ply-base" style="--ply:var(--ink-2)" stroke-width="3.2" d="${d}"/>
          <path class="ply-twist" stroke-width="3.2" d="${d}"/>
          ${xs.map((x) => `<circle cx="${x}" cy="${y}" r="3.4" fill="var(--cotton)" stroke="var(--ink-2)" stroke-width="1.6"/>`).join("")}
        </svg>
        ${yrs.map((g) => `<span class="scrub__yr" data-k="${g.k}" style="left:${(xs[g.i] + xs[g.j]) / 2}px">${g.k === "now" ? "now" : "’" + g.k.slice(2)}</span>`).join("")}
        <span class="scrub__bead"></span>`;
      this.bead = this.rail.querySelector(".scrub__bead");
      this.rail.setAttribute("aria-valuemax", String(n));
    },
    render(x) {
      this.track.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;
      const n = this.items.length;
      if (!n) return;
      const f = clamp(-x / this.stepW, -0.6, n - 0.4);
      if (this.bead) {
        const bx = this.railPad + (n > 1 ? (clamp(f, 0, n - 1) / (n - 1)) * this.railW : this.railW / 2);
        this.bead.style.transform = `translate3d(${bx.toFixed(2)}px, 0, 0) rotate(${(f * 140).toFixed(1)}deg)`;
      }
      const cur = clamp(Math.round(f), 0, n - 1);
      if (cur !== this.cur) this.setCur(cur);
    },
    setCur(i) {
      this.cur = i;
      const sw = this.items[i];
      if (!sw) return;
      const p = BY[sw.dataset.slug];
      state.sel = p.slug;
      syncURL();
      this.items.forEach((s, k) => s.setAttribute("aria-label", `${k + 1} of ${this.items.length}: ${BY[s.dataset.slug].name}`));
      this.rail.setAttribute("aria-valuenow", String(i + 1));
      this.rail.setAttribute("aria-valuetext", `${p.name}, ${p.years}`);
      this.rail.querySelectorAll(".scrub__yr").forEach((y) => y.classList.toggle("is-cur", y.dataset.k === p.yearKey));
      announce(describe(p));
      syncVideos();
    },
    go(i, { velocity = 0, instant = false } = {}) {
      const n = this.items.length;
      if (!n) return;
      i = clamp(i, 0, n - 1);
      this.x.to(-i * this.stepW, { velocity, damping: Math.abs(velocity) > 300 ? 0.86 : 1, response: 0.44, immediate: instant });
    },
    wirePointer() {
      let g = null;
      const minX = () => -(this.items.length - 1) * this.stepW;
      this.deck.addEventListener("pointerdown", (e) => {
        if (e.button > 0 || !this.items.length) return;
        if (this.x.moving) this.x.stop(); // touching catches the moving deck
        g = { id: e.pointerId, x: e.clientX, y: e.clientY, x0: this.x.value, on: false, hist: [{ t: performance.now(), v: this.x.value }] };
      });
      this.deck.addEventListener("pointermove", (e) => {
        if (!g || e.pointerId !== g.id) return;
        const dx = e.clientX - g.x, dy = e.clientY - g.y;
        if (!g.on) {
          if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) { g.on = true; g.x += Math.sign(dx) * 8; this.deck.setPointerCapture(e.pointerId); this.deck.classList.add("is-dragging"); }
          else if (Math.abs(dy) > 10) { g = null; return; }
          else return;
        }
        let x = g.x0 + (e.clientX - g.x);
        const lo = minX();
        if (x > 0) x = rubber(x, this.W);
        else if (x < lo) x = lo - rubber(lo - x, this.W);
        this.x.set(x);
        g.hist.push({ t: performance.now(), v: x });
        if (g.hist.length > 12) g.hist.shift();
      });
      const end = (e) => {
        if (!g || e.pointerId !== g.id) return;
        const was = g;
        g = null;
        this.deck.classList.remove("is-dragging");
        if (!was.on) { if (!this.x.moving && Math.abs(this.x.value + this.cur * this.stepW) > 0.5) this.go(this.cur); return; }
        this.suppressClick = true;
        setTimeout(() => (this.suppressClick = false), 0);
        const v = velocityOf(was.hist);
        const target = Math.round(-(this.x.value + project(v, 0.995)) / this.stepW);
        this.go(target, { velocity: v });
      };
      this.deck.addEventListener("pointerup", end);
      this.deck.addEventListener("pointercancel", end);
      this.deck.addEventListener("click", (e) => {
        if (this.suppressClick) { e.preventDefault(); e.stopPropagation(); return; }
        const sw = e.target.closest(".swatch");
        const i = this.items.indexOf(sw);
        if (sw && i !== this.cur) { e.preventDefault(); e.stopPropagation(); this.go(i); }
      }, true);
      this.deck.addEventListener("dragstart", (e) => e.preventDefault());
    },
    wireRail() {
      const toF = (cx) => {
        const r = this.rail.getBoundingClientRect();
        const n = this.items.length;
        return n > 1 ? ((cx - r.left - this.railPad) / this.railW) * (n - 1) : 0;
      };
      let g = null;
      this.rail.addEventListener("pointerdown", (e) => {
        if (e.button > 0 || !this.items.length) return;
        this.rail.setPointerCapture(e.pointerId);
        this.x.stop();
        const n = this.items.length;
        const f = clamp(toF(e.clientX), 0, n - 1);
        g = { id: e.pointerId, f };
        this.x.to(-f * this.stepW, { response: 0.22 });
      });
      this.rail.addEventListener("pointermove", (e) => {
        if (!g || e.pointerId !== g.id) return;
        const n = this.items.length;
        let f = toF(e.clientX);
        if (f < 0) f = -rubber(-f, 2);
        else if (f > n - 1) f = n - 1 + rubber(f - (n - 1), 2);
        g.f = f;
        this.x.set(-f * this.stepW);
      });
      const end = (e) => {
        if (!g || e.pointerId !== g.id) return;
        const f = g.f;
        g = null;
        this.go(Math.round(f));
      };
      this.rail.addEventListener("pointerup", end);
      this.rail.addEventListener("pointercancel", end);
      this.rail.addEventListener("keydown", (e) => {
        const n = this.items.length;
        const map = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 3, PageDown: -3 };
        if (e.key === "Home") { e.preventDefault(); return this.go(0); }
        if (e.key === "End") { e.preventDefault(); return this.go(n - 1); }
        if (map[e.key]) { e.preventDefault(); this.go(this.cur + map[e.key]); }
      });
    },
    step(d) { this.go(this.cur + d); },
    escape() {},
    filter(vis, { initial } = {}) {
      const all = [...this.track.querySelectorAll(".swatch")];
      const keep = state.sel;
      all.forEach((sw) => (sw.hidden = !vis.has(sw.dataset.slug)));
      this.items = all.filter((sw) => !sw.hidden);
      this.scrub.hidden = !this.items.length;
      let i = this.items.findIndex((sw) => sw.dataset.slug === keep);
      if (i < 0) i = 0;
      this.cur = -1;
      this.layout();
      this.x.jump(-i * this.stepW);
      if (!this.items.length) return;
      if (initial && !params.get("p")) { state.sel = null; syncURL(true); }
      if (!initial) this.track.animate([{ opacity: 0.4 }, { opacity: 1 }], { duration: 220 });
    },
    resize() { if (this.items.length) this.layout(); },
    destroy() { document.getElementById("pj-main").classList.remove("pj--deck"); onDetailResize = null; },
  };

  /* ============================================================
     BOOT / MODE SWITCHING
     ============================================================ */
  const bodyEl = document.getElementById("pj-body");
  let view = null;
  let mounted = "";
  const modeKey = () => (desktopMQ.matches ? `d-${state.view}` : `m-${state.m}`);
  const VIEWS = { "d-stage": StageView, "d-grid": GridView, "m-rows": RowsView, "m-grid": TilesView, "m-deck": DeckView };

  function mount({ fromURL = false } = {}) {
    const key = modeKey();
    if (key === mounted) return;
    view?.destroy?.();
    mounted = key;
    view = VIEWS[key];
    // filter strip material on mobile: ?bar=knit (default) | nav (matches the bottom bar)
    const navMat = params.get("nav") || "corduroy";
    filtersEl.className = "pj-filters" + (desktopMQ.matches ? "" : params.get("bar") === "nav" ? ` m-${navMat}` : " m-knit");
    view.mount(bodyEl, { fromURL });
    applyFilters({ initial: true });
    document.querySelectorAll(".pj-views button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === state.view)));
  }

  document.querySelector(".pj-views")?.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-view]");
    if (!b || b.dataset.view === state.view) return;
    state.view = b.dataset.view;
    if (state.view === "stage" && !state.sel) state.sel = state.lastStage || null;
    if (state.view === "grid") state.lastStage = state.sel;
    mount();
    syncURL(true);
  });

  document.addEventListener("keydown", (e) => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target.closest?.("input, textarea, select, [contenteditable]")) return;
    if (e.key === "j" || e.key === "k") { e.preventDefault(); view?.step?.(e.key === "j" ? 1 : -1, { focus: document.activeElement === document.body }); }
    else if (e.key === "Escape") view?.escape?.();
  });

  let rT = 0;
  window.addEventListener("resize", () => { clearTimeout(rT); rT = setTimeout(() => view?.resize?.(), 80); });
  // the player sets --bottom-ui whenever it appears, opens or closes: re-fit the stage / deck
  let lastUI = bottomUI(null);
  new MutationObserver(() => {
    const ui = bottomUI(null);
    if (ui !== lastUI) { lastUI = ui; clearTimeout(rT); rT = setTimeout(() => view?.resize?.(), 60); }
  }).observe(root, { attributes: true, attributeFilter: ["style"] });
  desktopMQ.addEventListener("change", () => { mount(); syncURL(true); watchStuck(); });

  function boot() {
    renderFilters();
    watchStuck();
    mount({ fromURL: !!state.sel });
    document.fonts?.ready.then(() => view?.resize?.());
    Y.mockPanel([
      { label: "Desktop view (≥ 960 px)", param: "view", options: [["stage", "List + stage"], ["grid", "Contact sheet"]], default: "stage" },
      { label: "Mobile layout", param: "m", options: [["rows", "(b) Rows"], ["grid", "(a) 2-col grid"], ["deck", "(c) Swatch deck"]], default: DEFAULT_M },
      { label: "Mobile nav material", param: "nav", options: [["corduroy", "Corduroy"], ["suede", "Suede"], ["cork", "Cork"], ["burlap", "Burlap"]], default: "corduroy" },
      { label: "Mobile filter strip", param: "bar", options: [["knit", "White knit"], ["nav", "Match nav"]], default: "knit" },
    ]);
  }
  boot();
})();
