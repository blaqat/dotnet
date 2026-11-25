/* ============================================================
   kit/swatch.js · instrument yarn swatches (kit agent; mock-only)
   A seeded knit square per track / collection. The instrument picks
   the yarn + motif family, the item's id picks the motif and its params.
     piano   → black yarn: keyboard, stripes, argyle
     beepbox → purple yarn: circles like the BeepBox logo (ring, rings, dots, bubbles)
     daw     → blue yarn: waves (sine, square, triangle, saw)
   API  window.YarnSwatch (also Yarn.swatch / Yarn.swatchHTML)
     uri(item, { cols, rows, motif, seed }) → "data:image/svg+xml…"   (cached)
       item: a BLAQAT music entry / song, or { instrument, id|name|seed }
     html(item, { size = 56, radius, label, cls }) → <span class="yswatch">
       size / radius: a number (px) or any CSS length (i11 · music: radius: "var(--r-inner)", the nested-radius token;
       left out = the .yswatch default; a card's art takes its radius from its card, yarn.css MUSIC FOLDER CARD)
     motif(item) → motif name    MOTIFS    PAL
     i9 · a mixed collection (item.mix / item.songs with more than one instrument): one striped band per instrument (mixOf)
   Loaded by kit/yarn.js. Works standalone too (kit/player.js may include it).
   ============================================================ */
(() => {
  "use strict";
  if (window.YarnSwatch) return;

  const hash = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rng = (seed) => () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, t) => { const A = hex(a), B = hex(b); return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join(""); };

  // yarn colours (art only; red stays the interactive accent)
  const PAL = {
    piano:   { base: ["#2b2828", "#262323", "#312d2c"], motif: ["#f4efe6", "#ece5d8", "#f7f1e8"] },
    beepbox: { base: ["#7b47c0", "#8550c9", "#6f3fb2"], motif: ["#fbf6ff", "#f3e3ff", "#fff1c9"] },
    daw:     { base: ["#3a6cc0", "#3466b8", "#4277cc"], motif: ["#f4f8ff", "#d7e7ff", "#fff3dc"] },
    other:   { base: ["#7a4e2d"], motif: ["#fbf8f3"] },
  };
  const MOTIFS = {
    piano: ["keys", "keys", "stripes", "argyle"],
    beepbox: ["ring", "rings", "dots", "bubbles"],
    daw: ["sine", "square", "triangle", "saw"],
    other: ["stripes", "argyle"],
  };
  const instOf = (item) => {
    const i = String(item?.instrument || "").toLowerCase();
    return PAL[i] ? i : "other";
  };
  const keyOf = (item, seed) => seed || (typeof item === "string" ? item : item?.seed || item?.id || item?.url || item?.name || "x");

  /* ---------- motif grids (1 = motif yarn) ---------- */
  function grid(kind, R, cols, rows) {
    const g = Array.from({ length: rows }, () => new Array(cols).fill(0));
    const set = (r, c, v = 1) => { r = Math.round(r); c = Math.round(c); if (r >= 0 && r < rows && c >= 0 && c < cols) g[r][c] = v; };
    const cx = (cols - 1) / 2, cy = (rows - 1) / 2;
    const ring = (x0, y0, rad, th = 1) => {
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const d = Math.hypot(c - x0, (r - y0) * 1.12);
        if (d > rad - th / 2 - 0.45 && d < rad + th / 2 + 0.05) set(r, c);
      }
    };
    const disc = (x0, y0, rad) => { for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (Math.hypot(c - x0, (r - y0) * 1.12) < rad + 0.15) set(r, c); };

    switch (kind) {
      /* ---- piano ---- */
      case "keys": {
        const top = 1 + Math.floor(R() * 3), bot = rows - 1 - Math.floor(R() * 2);
        const off = Math.floor(R() * 3);
        for (let r = top; r < bot; r++) for (let c = 0; c < cols; c++) if ((c + off) % 3 !== 2) set(r, c);
        const pat = [1, 1, 0, 1, 1, 1, 0];
        let j = Math.floor(R() * 7);
        const bh = Math.ceil((bot - top) * 0.55);
        for (let c = 0; c < cols; c++) if ((c + off) % 3 === 2) { if (pat[j++ % 7]) for (let r = top; r < top + bh; r++) { set(r, c - 1, 0); set(r, c + 1, 0); } }
        break;
      }
      case "stripes": {
        let r = 1 + Math.floor(R() * 2);
        while (r < rows - 1) { const h = 1 + Math.floor(R() * 2); for (let k = 0; k < h; k++) for (let c = 0; c < cols; c++) set(r + k, c); r += h + 1 + Math.floor(R() * 3); }
        const dr = Math.floor(R() * rows);
        if (g[dr].every((v) => !v)) for (let c = R() < 0.5 ? 0 : 1; c < cols; c += 2) set(dr, c);
        break;
      }
      case "argyle": {
        const k = 3 + Math.floor(R() * 3), fill = R() < 0.5;
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
          const d = Math.abs(c - cx) + Math.abs(r - cy) * 0.92;
          if (Math.abs(d - k) < 0.55 || (fill && d < 1.1) || Math.abs(d - k - 4) < 0.5) set(r, c);
        }
        break;
      }
      /* ---- beepbox: circles ---- */
      case "ring": { // one bold ring, like the BeepBox mark
        const rad = 4.2 + R() * 1.6;
        ring(cx + (R() - 0.5) * 1.4, cy + (R() - 0.5) * 1.4, rad, 1.7 + R() * 0.6);
        if (R() < 0.5) disc(cx, cy, 0.9);
        for (let c = 0; c < cols; c += 2) { set(0, c + (R() < .5 ? 0 : 1)); }
        break;
      }
      case "rings": { // concentric
        const n = 2 + Math.floor(R() * 2);
        for (let i = 0; i < n; i++) ring(cx, cy, 1.6 + i * 2.6, 1);
        break;
      }
      case "dots": { // polka of small rings / dots
        const sp = 4 + Math.floor(R() * 2), hollow = R() < 0.55;
        for (let r = 1, row = 0; r < rows; r += sp - 1, row++) for (let c = (row % 2) * Math.floor(sp / 2) + 1; c < cols; c += sp) hollow ? ring(c, r, 1.15, 0.6) : disc(c, r, 0.9);
        break;
      }
      default: case "bubbles": {
        const placed = [];
        for (let t = 0; t < 60 && placed.length < 6; t++) {
          const rad = 1 + Math.floor(R() * 3), x = rad + R() * (cols - 1 - 2 * rad), y = rad + R() * (rows - 1 - 2 * rad);
          if (placed.every((p) => Math.hypot(p.x - x, p.y - y) > p.rad + rad + 1.4)) { placed.push({ x, y, rad }); rad < 1.5 ? disc(x, y, 0.8) : ring(x, y, rad, 1); }
        }
        break;
      }
      /* ---- daw: waves ---- */
      case "sine": case "square": case "triangle": case "saw": {
        const A = 2.6 + R() * 1.6, period = 6 + Math.floor(R() * 5), ph = R() * period, thick = R() < 0.35 ? 2 : 1;
        const f = {
          sine: (u) => Math.sin(u * 2 * Math.PI),
          square: (u) => (((u % 1) + 1) % 1 < 0.5 ? 1 : -1),
          triangle: (u) => { const x = ((u % 1) + 1) % 1; return x < 0.5 ? 4 * x - 1 : 3 - 4 * x; },
          saw: (u) => 2 * (((u % 1) + 1) % 1) - 1,
        }[kind];
        const y0 = cy + (R() - 0.5) * 2;
        let prev = null;
        for (let c = 0; c < cols; c++) {
          const y = Math.round(y0 - A * f((c + ph) / period));
          for (let k = 0; k < thick; k++) set(y + k, c);
          if (prev != null && Math.abs(prev - y) > 1) for (let r = Math.min(prev, y); r <= Math.max(prev, y); r++) set(r, c);
          prev = y;
        }
        if (R() < 0.6) for (let c = 0; c < cols; c += 2) { set(1, c); set(rows - 2, c + 1); }
        break;
      }
    }
    return g;
  }

  /* ---------- knit render (V stitches, like the player's swatches) ---------- */
  const cache = new Map();
  function uri(item, { cols = 15, rows = 15, motif, seed } = {}) {
    const mixed = mixOf(item);
    if (mixed) return mixedURI(item, mixed, { cols, rows, motif, seed }); // i9 · music · S6
    const inst = instOf(item), key = keyOf(item, seed);
    const ck = `${key}|${inst}|${cols}x${rows}|${motif || ""}`;
    if (cache.has(ck)) return cache.get(ck);
    const R = rng(hash(key));
    const P = PAL[inst];
    const base = P.base[Math.floor(R() * P.base.length)];
    const mot = P.motif[Math.floor(R() * P.motif.length)];
    const fam = MOTIFS[inst];
    const kind = motif || fam[Math.floor(R() * fam.length)];
    const g = grid(kind, R, cols, rows);
    const CW = 10, CH = 8.4, W = cols * CW, H = rows * CH;
    const leg = (f) => `<ellipse cx="2.75" cy="4.4" rx="2.5" ry="4.8" transform="rotate(-23 2.75 4.4)" fill="${f}"/><ellipse cx="7.25" cy="4.4" rx="2.5" ry="4.8" transform="rotate(23 7.25 4.4)" fill="${f}"/>`;
    const hl = `<path d="M1.5 1.6Q2.2 4.6 4 7.5M8.5 1.6Q7.8 4.6 6 7.5" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width=".7" stroke-linecap="round"/>`;
    let body = "";
    for (let r = -1; r <= rows; r++) for (let c = 0; c < cols; c++) {
      const m = r >= 0 && r < rows && g[r][c];
      body += `<use href="#${m ? "m" : "b"}" x="${c * CW}" y="${(r * CH).toFixed(1)}"/>`;
    }
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H.toFixed(1)}" preserveAspectRatio="xMidYMid slice"><defs>` +
      `<linearGradient id="gb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix(base, "#ffffff", 0.14)}"/><stop offset="1" stop-color="${mix(base, "#000000", 0.2)}"/></linearGradient>` +
      `<linearGradient id="gm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mot}"/><stop offset="1" stop-color="${mix(mot, base, 0.22)}"/></linearGradient>` +
      `<radialGradient id="v" cx=".5" cy=".42" r=".78"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".24"/></radialGradient>` +
      `<g id="b">${leg("url(#gb)")}${hl}</g><g id="m">${leg("url(#gm)")}${hl}</g></defs>` +
      `<rect width="${W}" height="${H.toFixed(1)}" fill="${mix(base, "#000000", 0.45)}"/>${body}<rect width="${W}" height="${H.toFixed(1)}" fill="url(#v)"/></svg>`;
    const out = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    cache.set(ck, out);
    return out;
  }
  /* ---------- i9 · music · S6: a mixed collection (owner: "one song is piano another is daw") ----------
     item.mix = [[instrument, songs], …] (Yarn.musicFacts(x).mix), or item.songs, or an instrument list. More than one
     instrument → the knit is striped like a scarf: one band of rows per instrument, as tall as its share of the songs
     (at least 4 of the 15 rows, so one song in six still reads), most songs on top. Each band is that instrument's own
     yarn with a motif that fits a band: piano keys / stripes · BeepBox rings · a DAW wave flattened to the band.
     motif (the collection's pattern) dresses the top band when it's that band's family. data-instrument="mixed". */
  function mixOf(item) {
    let m = Array.isArray(item?.mix) ? item.mix : null;
    if (!m && Array.isArray(item?.songs) && item.songs.length && item.type !== "single") m = item.songs.map((s) => [s?.instrument || item.instrument, 1]);
    if (!m && Array.isArray(item?.instrument)) m = item.instrument.map((k) => [k, 1]);
    if (!m) return null;
    const n = new Map();
    for (const e of m) { const [k, c = 1] = Array.isArray(e) ? e : [e, 1]; const i = instOf({ instrument: k }); n.set(i, (n.get(i) || 0) + (+c || 0)); }
    const out = [...n.entries()].filter(([, c]) => c > 0).sort((a, b) => b[1] - a[1]);
    return out.length > 1 ? out : null;
  }
  const BAND = { piano: ["keys", "keys", "stripes"], beepbox: ["rings", "dots"], daw: ["sine", "square", "triangle", "saw"], other: ["stripes"] };
  function bandGrid(kind, R, cols, rows) {
    const g = Array.from({ length: rows }, () => new Array(cols).fill(0));
    const set = (r, c, v = 1) => { r = Math.round(r); c = Math.round(c); if (r >= 0 && r < rows && c >= 0 && c < cols) g[r][c] = v; };
    const ring = (x0, y0, rad, th) => { for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const d = Math.hypot(c - x0, (r - y0) * 1.12); if (d > rad - th / 2 - 0.45 && d < rad + th / 2 + 0.05) set(r, c); } };
    const pad = rows >= 6 ? 1 : 0, y0 = (rows - 1) / 2;
    switch (kind) {
      case "keys": { // the keyboard across the band: white keys, black keys on the top part
        const off = Math.floor(R() * 3), pat = [1, 1, 0, 1, 1, 1, 0];
        let j = Math.floor(R() * 7);
        for (let r = pad; r < rows - pad; r++) for (let c = 0; c < cols; c++) if ((c + off) % 3 !== 2) set(r, c);
        const bh = pad + Math.max(1, Math.ceil((rows - 2 * pad) * 0.55));
        for (let c = 0; c < cols; c++) if ((c + off) % 3 === 2 && pat[j++ % 7]) for (let r = pad; r < bh; r++) { set(r, c - 1, 0); set(r, c + 1, 0); }
        break;
      }
      case "stripes": { let r = pad; while (r < rows - pad) { for (let c = 0; c < cols; c++) set(r, c); r += 2 + Math.floor(R() * 2); } break; }
      case "rings": case "dots": { // a row of BeepBox circles (rings when the band has room)
        const sp = 4 + Math.floor(R() * 2), x0 = Math.floor(R() * sp), big = kind === "rings" && rows >= 5;
        for (let c = x0; c < cols + sp; c += sp) big ? ring(c, y0, Math.min(1.6, (rows - 2) / 2.4), 0.8) : ring(c, y0, 1.15, 0.6);
        break;
      }
      default: { // a wave, its swing flattened to the band
        const A = Math.min(2.6 + R() * 1.6, Math.max(0.8, (rows - 1) / 2 - 0.3)), period = 6 + Math.floor(R() * 5), ph = R() * period;
        const f = { sine: (u) => Math.sin(u * 2 * Math.PI), square: (u) => (((u % 1) + 1) % 1 < 0.5 ? 1 : -1), triangle: (u) => { const x = ((u % 1) + 1) % 1; return x < 0.5 ? 4 * x - 1 : 3 - 4 * x; }, saw: (u) => 2 * (((u % 1) + 1) % 1) - 1 }[kind] || ((u) => Math.sin(u * 2 * Math.PI));
        let prev = null;
        for (let c = 0; c < cols; c++) { const y = Math.round(y0 - A * f((c + ph) / period)); set(y, c); if (prev != null && Math.abs(prev - y) > 1) for (let r = Math.min(prev, y); r <= Math.max(prev, y); r++) set(r, c); prev = y; }
      }
    }
    return g;
  }
  function mixedURI(item, mix, { cols = 15, rows = 15, motif, seed } = {}) {
    const key = keyOf(item, seed);
    const ck = `${key}|mix:${mix.map(([k, n]) => k + n).join(",")}|${cols}x${rows}|${motif || ""}`;
    if (cache.has(ck)) return cache.get(ck);
    const total = mix.reduce((a, [, n]) => a + n, 0), min = mix.length > 3 ? 3 : 4;
    const hs = mix.map(([, n]) => Math.max(min, Math.round((rows * n) / total)));
    for (let over = hs.reduce((a, b) => a + b, 0) - rows; over !== 0; over -= Math.sign(over)) hs[hs.indexOf(Math.max(...hs))] -= Math.sign(over);
    const CW = 10, CH = 8.4, W = cols * CW, H = rows * CH;
    let r0 = 0, defs = "", back = "", body = "";
    const bands = mix.map(([k], i) => {
      const R = rng(hash(`${key}#${k}`)), P = PAL[k] || PAL.other;
      const base = P.base[Math.floor(R() * P.base.length)], mot = P.motif[Math.floor(R() * P.motif.length)];
      const fam = BAND[k] || BAND.other;
      const kind = i === 0 && motif && fam.includes(motif) ? motif : fam[Math.floor(R() * fam.length)];
      const b = { r0, h: hs[i], g: bandGrid(kind, R, cols, hs[i]) };
      defs += `<linearGradient id="gb${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix_(base, "#ffffff", 0.14)}"/><stop offset="1" stop-color="${mix_(base, "#000000", 0.2)}"/></linearGradient>`
        + `<linearGradient id="gm${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mot}"/><stop offset="1" stop-color="${mix_(mot, base, 0.22)}"/></linearGradient>`;
      back += `<rect y="${(r0 * CH).toFixed(1)}" width="${W}" height="${(hs[i] * CH + (i === mix.length - 1 ? 0 : 1)).toFixed(1)}" fill="${mix_(base, "#000000", 0.45)}"/>`;
      r0 += hs[i];
      return b;
    });
    const leg = (f) => `<ellipse cx="2.75" cy="4.4" rx="2.5" ry="4.8" transform="rotate(-23 2.75 4.4)" fill="${f}"/><ellipse cx="7.25" cy="4.4" rx="2.5" ry="4.8" transform="rotate(23 7.25 4.4)" fill="${f}"/>`;
    const hl = `<path d="M1.5 1.6Q2.2 4.6 4 7.5M8.5 1.6Q7.8 4.6 6 7.5" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width=".7" stroke-linecap="round"/>`;
    bands.forEach((_, i) => { defs += `<g id="b${i}">${leg(`url(#gb${i})`)}${hl}</g><g id="m${i}">${leg(`url(#gm${i})`)}${hl}</g>`; });
    for (let r = -1; r <= rows; r++) {
      const rr = Math.max(0, Math.min(rows - 1, r)), i = bands.findIndex((b) => rr >= b.r0 && rr < b.r0 + b.h), b = bands[i];
      for (let c = 0; c < cols; c++) { const m = r >= 0 && r < rows && b.g[r - b.r0][c]; body += `<use href="#${m ? "m" : "b"}${i}" x="${c * CW}" y="${(r * CH).toFixed(1)}"/>`; }
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H.toFixed(1)}" preserveAspectRatio="xMidYMid slice"><defs>${defs}`
      + `<radialGradient id="v" cx=".5" cy=".42" r=".78"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".24"/></radialGradient></defs>`
      + `${back}${body}<rect width="${W}" height="${H.toFixed(1)}" fill="url(#v)"/></svg>`;
    const out = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    cache.set(ck, out);
    return out;
  }
  const mix_ = mix;
  const LABEL = { piano: "Piano", beepbox: "BeepBox", daw: "DAW", other: "Yarn" };
  function motifOf(item, { seed } = {}) { const inst = instOf(item); const R = rng(hash(keyOf(item, seed))); R(); R(); return MOTIFS[inst][Math.floor(R() * MOTIFS[inst].length)]; }
  function html(item, { size = 56, radius, label = "", cls = "", motif, seed } = {}) {
    const a11y = label ? `role="img" aria-label="${String(label).replace(/"/g, "&quot;")}"` : `aria-hidden="true"`;
    return `<span class="yswatch ${cls}" ${a11y} data-instrument="${mixOf(item) ? "mixed" : instOf(item)}" style="--sw:${typeof size === "number" ? size + "px" : size};${radius != null ? `--sw-r:${typeof radius === "number" ? radius + "px" : radius};` : ""}background-image:url('${uri(item, { motif, seed })}')"></span>`;
  }

  window.YarnSwatch = { uri, html, motif: motifOf, mixOf, MOTIFS, BAND, PAL, LABEL };
  if (window.Yarn) { window.Yarn.swatch = uri; window.Yarn.swatchHTML = html; }
})();
