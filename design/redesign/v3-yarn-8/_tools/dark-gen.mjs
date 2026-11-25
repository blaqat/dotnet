#!/usr/bin/env node
/* i8 · DK · the dark theme's generated layer.
   For every stylesheet a themed page loads, writes kit/dark/<name>.gen.css: a copy of each rule's colour declarations
   (background*, border*, outline*, box-shadow, text-shadow, filter, color, fill, stroke, …), scoped to
   html[data-theme="dark"] with ZERO added specificity (`X:where(html[data-theme="dark"] *)`), with the light theme's
   literals swapped for dark tokens (kit/dark.css defines them). kit/theme.js inserts each file right after its source
   stylesheet, so the dark cascade is the light cascade, rule for rule (every colour declaration is copied, changed or
   not, so a later light rule still beats an earlier one). Light never loads these files.

   What it changes (everything else is copied as is):
     text      color / fill …     the ink thread (#1f1e1e, rgba(31,30,30,a), black) → the cotton text token
                                  var(--white) / var(--cotton) as text (text on a fill) → the literal light value
     lines     border / outline / stroke / column-rule …   ink thread → the light thread (rgb(var(--yd-line-rgb) / a))
     surfaces  background*        white → var(--white) (the dark card) · cotton → var(--cotton) · ink thread washes →
                                  a light wash · var(--ink) / var(--red-deep) fills → the dark theme's ink / deep red fill
     shadows   box-shadow / text-shadow / drop-shadow   ink thread → deeper black; a ring (no blur, no offset) → a line;
                                  white highlights → faint
   Hand-made dark rules live in kit/dark.css (tokens + tuning, specificity +0,1,1) and never here.

   usage:  node _tools/dark-gen.mjs [--report]   (rerun after changing any of the sources below) */
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const HERE = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPORT = process.argv.includes("--report");
export const SOURCES = [
  { name: "yarn", file: "kit/yarn.css" },
  { name: "jersey", file: "kit/bg/jersey.css" },
  { name: "home", file: "home/home.css" },
  { name: "projects", file: "projects/projects.css" },
  { name: "music", file: "music/music.css" },
  { name: "stitched", file: "thoughts/stitched.css" },
  { name: "tier", file: "thoughts/tier.css" },
  { name: "studio", file: "studio/studio.css" },
  { name: "roundup", file: "review/roundup.css" },
  { name: "components", file: "kit/components.html", from: "style" },
  { name: "index", file: "index.html", from: "style" },
  { name: "player", file: "kit/player.js", from: "js" },
];

/* ---------- parse ---------- */
function strip(src) { // comments out, strings kept
  let out = "", i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === "/" && src[i + 1] === "*") { const j = src.indexOf("*/", i + 2); i = j < 0 ? src.length : j + 2; out += " "; continue; }
    if (c === '"' || c === "'") { let j = i + 1; while (j < src.length && src[j] !== c) { if (src[j] === "\\") j++; j++; } out += src.slice(i, j + 1); i = j + 1; continue; }
    out += c; i++;
  }
  return out;
}
// split at depth-0 `sep` (outside strings, (), [])
function split(s, sep) {
  const out = []; let d = 0, q = null, last = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === "\\") i++; else if (c === q) q = null; continue; }
    if (c === '"' || c === "'") q = c;
    else if (c === "(" || c === "[") d++;
    else if (c === ")" || c === "]") d--;
    else if (c === sep && d === 0) { out.push(s.slice(last, i)); last = i + 1; }
  }
  out.push(s.slice(last));
  return out;
}
function parse(src) {
  let i = 0;
  const block = () => {
    const nodes = [];
    while (i < src.length) {
      let d = 0, q = null, start = i;
      for (; i < src.length; i++) {
        const c = src[i];
        if (q) { if (c === "\\") i++; else if (c === q) q = null; continue; }
        if (c === '"' || c === "'") q = c;
        else if (c === "(" || c === "[") d++;
        else if (c === ")" || c === "]") d--;
        else if (d === 0 && (c === "{" || c === ";" || c === "}")) break;
      }
      const pre = src.slice(start, i).trim(), c = src[i++];
      if (c === "}" || c === undefined) return nodes;
      if (c === ";") continue; // @import / stray
      if (pre.startsWith("@")) {
        const kw = pre.slice(1).split(/[\s(]/)[0];
        if (["media", "supports", "container", "layer", "document"].includes(kw)) nodes.push({ at: pre, kids: block() });
        else skipBlock();
        continue;
      }
      // a style rule: declarations until the matching }
      let j = i; d = 0; q = null;
      for (; j < src.length; j++) {
        const ch = src[j];
        if (q) { if (ch === "\\") j++; else if (ch === q) q = null; continue; }
        if (ch === '"' || ch === "'") q = ch;
        else if (ch === "(" || ch === "[") d++;
        else if (ch === ")" || ch === "]") d--;
        else if (ch === "{" && d === 0) throw new Error("nested rule in: " + pre);
        else if (ch === "}" && d === 0) break;
      }
      const body = src.slice(i, j); i = j + 1;
      const decls = split(body, ";").map((x) => x.trim()).filter(Boolean).map((x) => {
        const k = x.indexOf(":"); let v = x.slice(k + 1).trim(), imp = false;
        if (/!important\s*$/i.test(v)) { imp = true; v = v.replace(/\s*!important\s*$/i, ""); }
        return { prop: x.slice(0, k).trim().toLowerCase(), value: v, imp };
      });
      nodes.push({ sel: pre, decls });
    }
    return nodes;
  };
  const skipBlock = () => { let d = 1, q = null; for (; i < src.length && d; i++) { const c = src[i]; if (q) { if (c === "\\") i++; else if (c === q) q = null; continue; } if (c === '"' || c === "'") q = c; else if (c === "{") d++; else if (c === "}") d--; } };
  return block();
}

/* ---------- selectors: zero-specificity dark scope ---------- */
function scopeSel(sel) {
  return split(sel, ",").map((s) => s.trim()).filter(Boolean).map((s) => {
    // the last compound (after the last depth-0 combinator) and a trailing pseudo-element
    let d = 0, q = null, lastComb = -1, pseudo = -1;
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (q) { if (c === "\\") i++; else if (c === q) q = null; continue; }
      if (c === '"' || c === "'") q = c;
      else if (c === "(" || c === "[") d++;
      else if (c === ")" || c === "]") d--;
      else if (d === 0 && (/\s/.test(c) || c === ">" || c === "+" || c === "~")) { lastComb = i; pseudo = -1; }
      else if (d === 0 && c === ":" && s[i + 1] === ":" && pseudo < 0) pseudo = i;
    }
    const at = pseudo >= 0 ? pseudo : s.length;
    const subjectIsRoot = lastComb < 0 && /^(html|:root)(?![\w-])/.test(s);
    const add = subjectIsRoot ? ':where([data-theme="dark"])' : ':where(html[data-theme="dark"] *)';
    return s.slice(0, at) + add + s.slice(at);
  }).join(",\n");
}

/* ---------- values ---------- */
const COLOR_PROP = /^(background|border|outline|box-shadow|text-shadow|filter|-webkit-filter|backdrop-filter|-webkit-backdrop-filter|color|fill|stroke|column-rule|text-decoration|text-emphasis-color|scrollbar-color|caret-color|accent-color|-webkit-text-fill-color|-webkit-text-stroke|-webkit-tap-highlight-color)/;
const kindOf = (prop) => {
  if (/^(box-shadow|text-shadow)$/.test(prop) || /filter$/.test(prop)) return "shadow";
  if (/^(background|fill)/.test(prop)) return "bg";
  if (/^(color|-webkit-text-fill-color|caret-color|accent-color|text-emphasis-color|-webkit-tap-highlight-color)$/.test(prop)) return "text";
  if (/^(border|outline|column-rule|text-decoration|scrollbar-color|stroke|-webkit-text-stroke)/.test(prop)) return "line";
  if (prop.startsWith("--")) {
    if (/shadow|drop|glow|lift/.test(prop)) return "shadow";
    if (/line|stitch|rule|border|edge|thread|ring|outline|wave/.test(prop)) return "line";
    if (/bg|cloth|fill|paper|surface|card|chip|felt|wash|tint|back|patch/.test(prop)) return "bg";
    if (/fg|text/.test(prop)) return "text"; // (a disc's --fact-c, a --brand colour: not text; left as they are)
    return "unknown";
  }
  return null;
};
const r3 = (x) => String(Math.round(x * 1000) / 1000).replace(/^0\./, ".");
const COLOR_RE = /rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)|#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b|\b(?:white|black)\b|var\(--(?:ink|ink-2|ink-3|white|cotton|cotton-2|red-deep|red)\)/g;
function parseColor(m) {
  let r, g, b, a = 1, tok = null;
  if (m.startsWith("var(")) tok = m.slice(6, -1);
  else if (m === "white") [r, g, b] = [255, 255, 255];
  else if (m === "black") [r, g, b] = [0, 0, 0];
  else if (m[0] === "#") {
    let h = m.slice(1); if (h.length <= 4) h = [...h].map((c) => c + c).join("");
    [r, g, b] = [0, 2, 4].map((k) => parseInt(h.slice(k, k + 2), 16)); if (h.length === 8) a = parseInt(h.slice(6), 16) / 255;
  } else {
    const x = m.match(/[\d.]+%?/g); [r, g, b] = x.slice(0, 3).map(Number); if (x[3] != null) a = x[3].endsWith("%") ? parseFloat(x[3]) / 100 : Number(x[3]);
  }
  const cls = tok ? "tok" : (r === 31 && g === 30 && b === 30) ? "thread" : (r === 0 && g === 0 && b === 0) ? "black"
    : (r === 251 && g === 248 && b === 243) ? "cotton" : (r === 243 && g === 238 && b === 230) ? "cotton2"
    : Math.min(r, g, b) >= 244 ? "white" /* white and the near-whites (#fffdf9 paper) */
    : (Math.min(r, g, b) >= 214 && Math.max(r, g, b) - Math.min(r, g, b) <= 20) ? "cotton2" /* warm light greys (#f1ece4, #e8e1d6): recessed */ : "other";
  return { r, g, b, a, tok, cls };
}
const lineC = (a) => `rgb(var(--yd-line-rgb) / ${r3(Math.min(0.8, a * 1.3 + 0.02))})`;
// one colour in one context → its dark value (or null = keep)
function mapColor(m, kind, ctx = {}) {
  const c = parseColor(m);
  if (c.tok) {
    if (kind === "text" && c.tok === "white") return "#fff";
    if (kind === "text" && c.tok === "cotton") return "#fbf8f3";
    if (kind === "text" && c.tok === "red") return "var(--yd-red-text)"; // red glyphs / text on the dark cloth: a step brighter
    if (kind === "bg" && c.tok === "ink") return "var(--yd-ink)";
    if (kind === "bg" && c.tok === "red-deep") return "var(--yd-red-deep)";
    return null; // flips with its token
  }
  const dark = c.cls === "thread" || (c.cls === "black" && kind !== "shadow" && kind !== "bg");
  if (kind === "text") {
    if (dark) return c.a >= 0.95 ? "var(--ink)" : `rgb(var(--yd-fg-rgb) / ${r3(c.a >= 0.3 ? Math.max(c.a, 0.66) : c.a)})`;
    return null;
  }
  if (kind === "line") {
    if (dark) return c.a >= 0.95 ? "var(--ink)" : lineC(c.a);
    if (c.cls === "white" && c.a >= 0.95 && !ctx.onFill) return "var(--white)";
    return null;
  }
  if (kind === "bg") {
    if (c.cls === "white") return c.a >= 0.95 ? "var(--white)" : c.a >= 0.45 ? `rgb(var(--yd-card-rgb) / ${r3(c.a)})` : null;
    if (c.cls === "cotton") return c.a >= 0.95 ? "var(--cotton)" : `rgb(var(--yd-sheet-rgb) / ${r3(c.a)})`;
    if (c.cls === "cotton2") return c.a >= 0.95 ? "var(--cotton-2)" : `rgb(var(--yd-sheet2-rgb) / ${r3(c.a)})`;
    // a faint ink wash (a rail, a hover tint) → a faint cotton wash; a strong one is a scrim / a shade over art → darker
    if (c.cls === "thread") return c.a >= 0.95 ? "var(--yd-ink)" : c.a >= 0.3 ? `rgba(0, 0, 0, ${r3(Math.min(0.75, c.a * 1.3 + 0.05))})` : `rgb(var(--yd-wash-rgb) / ${r3(c.a)})`;
    return null;
  }
  if (kind === "shadow") {
    if (ctx.ring) { // a hairline / ring drawn with a shadow
      if (dark) return c.a >= 0.95 ? "var(--ink)" : lineC(c.a);
      if (c.cls === "white" && c.a >= 0.95) return "var(--white)";
      if (c.cls === "cotton" && c.a >= 0.95) return "var(--cotton)";
      return null;
    }
    if (c.cls === "thread") return `rgba(0, 0, 0, ${r3(Math.min(0.72, c.a * 2.4 + 0.04))})`;
    if (c.cls === "white") return `rgba(255, 255, 255, ${r3(c.a * (ctx.blur ? 0.3 : 0.14))})`;
    return null;
  }
  if (kind === "unknown") return null;
  return null;
}
function mapList(v, kind) { // replace every colour in v
  return v.replace(COLOR_RE, (m) => mapColor(m, kind) ?? m);
}
// box-shadow / text-shadow: per layer (a ring vs a shadow)
function mapShadow(v) {
  return split(v, ",").map((layer) => {
    const lens = (layer.replace(COLOR_RE, " ").replace(/var\([^)]*\)/g, " ").match(/-?[\d.]+(px|rem|em)?\b/g) || []).map(parseFloat);
    const [x = 0, y = 0, blur = 0] = lens;
    const ring = !blur && !x && !y;
    return layer.replace(COLOR_RE, (m) => mapColor(m, "shadow", { ring, blur: !!blur }) ?? m);
  }).join(",");
}
function mapFilter(v) { // drop-shadow(...) only
  return v.replace(/drop-shadow\(((?:[^()]|\([^()]*\))*)\)/g, (all, inner) => {
    const lens = (inner.replace(COLOR_RE, " ").match(/-?[\d.]+(px|rem|em)?\b/g) || []).map(parseFloat);
    const [x = 0, y = 0, blur = 0] = lens;
    return "drop-shadow(" + inner.replace(COLOR_RE, (m) => mapColor(m, "shadow", { ring: !blur && !x && !y, blur: !!blur }) ?? m) + ")";
  });
}
// data-URI SVGs: ink strokes / fills → the light thread hex (no tokens inside a data URI)
const URI_FG = "%23e9e2d7";
function mapURIs(v, kind) {
  return v.replace(/url\((["']?)data:image\/svg\+xml[^)]*?\1\)/g, (u) => (kind === "bg" || kind === "line" || kind === "unknown")
    ? u.replace(/%231f1e1e|%23000000|%23000(?![0-9a-f])/gi, URI_FG) : u);
}
/* textures: knit stitches keep their shading but deeper (dark thread → black) and their highlights go faint (the knit
   is drawn light-on-dark by its rims, not its shadows); the diamond's dashed lines are lines → the light thread */
const TEX_LINES = /^--tex-diamond$/;
function mapTex(prop, value) {
  return value.replace(/url\(("|')data:image\/svg\+xml,(.*?)\1\)/g, (all, q, body) => {
    let svg = decodeURIComponent(body);
    const scale = (attrs, k, cap = 1) => attrs.replace(/((?:fill|stroke|stop)-opacity|opacity)='([\d.]+)'/g, (a, n, o) => `${n}='${r3(Math.min(cap, parseFloat(o) * k))}'`);
    svg = svg.replace(/<[^<>]*>/g, (el) => {
      if (/(fill|stroke|stop-color)='#(1f1e1e|000|000000)'/.test(el)) {
        return TEX_LINES.test(prop) ? scale(el.replace(/#(1f1e1e|000000|000)'/g, "#e9e2d7'"), 1.25) : scale(el.replace(/#(1f1e1e|000000|000)'/g, "#000'"), 3.2, 0.5);
      }
      if (/(fill|stroke|stop-color)='#(fff|ffffff)'/.test(el)) return scale(el, 0.13);
      return el;
    });
    // knit loops that only have a white rim: give them a faint light body so the stitch reads on the dark sheet
    return `url(${q}data:image/svg+xml,${encodeURIComponent(svg).replace(/%20/g, " ").replace(/%3D/g, "=").replace(/%2F/g, "/").replace(/%3A/g, ":").replace(/%2C/g, ",")}${q})`;
  });
}
function mapDecl({ prop, value }) {
  if (/^--tex-/.test(prop)) return /data:image\/svg/.test(value) && !/feTurbulence/.test(value) ? mapTex(prop, value) : value;
  // a glyph / strike / knock-out ON a colour fill (--fact-on, --y-strike on a type chip, --y-knock): ink stays the thread
  if (/^--.*(-on|knock|strike)$/.test(prop)) return value.replace(/var\(--ink\)/g, "var(--yd-thread)").replace(/#1f1e1e\b/gi, "var(--yd-thread)");
  const kind = kindOf(prop);
  if (!kind) return value;
  let v = mapURIs(value, kind);
  if (kind === "shadow") v = /filter$/.test(prop) || /drop-shadow/.test(v) ? mapFilter(v) : mapShadow(v);
  else if (kind !== "unknown") v = mapList(v, kind); // (low-alpha white in a background = a highlight on a fill: kept)
  return v;
}

/* ---------- emit ---------- */
function gen(nodes, report, file) {
  const out = [];
  for (const n of nodes) {
    if (n.at) { const inner = gen(n.kids, report, file); if (inner.trim()) out.push(`${n.at} {\n${inner}\n}`); continue; }
    if (/data-theme/.test(n.sel)) continue; // a source's own dark rules stay where they are
    const keep = [];
    for (const d of n.decls) {
      if (d.prop.startsWith("--")) {
        if (/^:root$/.test(n.sel.trim()) && !/^--tex-/.test(d.prop)) continue; // tokens: kit/dark.css owns them (textures are redrawn here)
        const v = mapDecl(d);
        if (v !== d.value) { keep.push(`${d.prop}: ${v}${d.imp ? " !important" : ""};`); report.push([file, n.sel, d.prop, d.value, v]); }
        else if (kindOf(d.prop) === "unknown" && COLOR_RE.test(d.value)) report.push([file, n.sel, d.prop, d.value, "(kept: unknown custom prop)"]);
        COLOR_RE.lastIndex = 0;
        continue;
      }
      if (!COLOR_PROP.test(d.prop)) continue;
      const v = mapDecl(d);
      if (v !== d.value) report.push([file, n.sel, d.prop, d.value, v]);
      keep.push(`${d.prop}: ${v}${d.imp ? " !important" : ""};`);
    }
    if (keep.length) out.push(`${scopeSel(n.sel)} {\n  ${keep.join("\n  ")}\n}`);
  }
  return out.join("\n");
}

const outDir = join(HERE, "kit/dark");
mkdirSync(outDir, { recursive: true });
const report = [];
for (const s of SOURCES) {
  let src = readFileSync(join(HERE, s.file), "utf8");
  if (s.from === "style") src = [...src.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join("\n");
  if (s.from === "js") { const a = src.indexOf("const CSS = `") + 13; src = src.slice(a, src.indexOf("\n`;", a)); }
  const css = gen(parse(strip(src)), report, s.file);
  writeFileSync(join(outDir, `${s.name}.gen.css`), `/* GENERATED by _tools/dark-gen.mjs from ${s.file}: do not edit, rerun the tool. Loaded only in the dark theme,\n   right after its source (kit/theme.js). Zero added specificity: the dark cascade is the light one. */\n${css}\n`);
  console.log(`${s.name}.gen.css  ${css.split("\n").length} lines`);
}
const changed = report.length;
console.log(`${changed} declarations changed`);
if (REPORT) writeFileSync("/Users/blaqat/dev/temp/r3i8-dark/gen-report.txt", report.map((r) => `${r[0]} | ${r[1].replace(/\s+/g, " ").slice(0, 120)} | ${r[2]}: ${r[3].slice(0, 140)}\n      → ${r[4].slice(0, 160)}`).join("\n"));
