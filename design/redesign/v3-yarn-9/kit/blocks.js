/* ============================================================
   blaqat.net · yarn kit · i9 · blocks (S3): markdown with yarn blocks
   Loaded by kit/yarn.js (sync, after posts.js). One parser for Studio's block editor and for the site's renderer, so
   what the editor shows is what an article or a write-up shows.

   Yarn.md(text, ctx?) → HTML       the markdown, with every yarn block drawn as the kit's own part (the rest goes
                                    through marked when the page has it, like the Thoughts article page, else the
                                    kit's own renderer below)
   Yarn.md.parse(text) → { blocks, tail }
                                    blocks keep their exact source (b.src) and the whitespace before them (b.sep), so
                                    serialize(parse(x)) === x for any text. An edited block drops its src (b.src = null)
                                    and is written back in a canonical form.
   Yarn.md.serialize(doc) → text
   Yarn.md.inline(md, { soft }) → HTML     inline markdown: **bold** *italic* `code` ~~strike~~ [links](url) <auto> breaks
   Yarn.md.fromDOM(el, { multi }) → md     an element's inline content back to markdown (Studio's editor)
   Yarn.md.block(b) → md                   one block's markdown (its src when untouched)
   Yarn.md.text(md) → string · Yarn.md.words(md) → n    what a reader sees (comments, URLs and syntax left out)
   Yarn.md.KINDS                    the yarn blocks: link · images · music · mention · note · post
   Yarn.md.yarn(kind, data) → block · Yarn.md.yarnData(b) → data · Yarn.md.renderYarn(b, ctx) → HTML
   Yarn.md.about(ref, ctx?)         "project:<slug>" · "release:<slug>" · "post:<id>" · "post:<id>#<ranked item>"

   THE YARN DIRECTIVE (storage stays plain markdown):
     <!-- yarn:<kind> key=value key="a value" -->
     <fallback markdown: the one block right under it, up to the next blank line>
   The comment is invisible to every markdown renderer, so a page that ignores yarn blocks shows the fallback: a link,
   a list of songs, images, a quote. The fallback IS the data (link text + URL, image alt + src, track title + audio
   URL + length, the note's text); the comment only says how to draw it and carries what the fallback can't (a
   mention's ref, a post's id, a note's colour, link style). Examples:
     <!-- yarn:link -->                       [Source on GitHub](https://github.com/blaqat/dotnet) · [Visit site](https://blaqat.net)
     <!-- yarn:link style=icon -->            [GitHub](https://github.com/blaqat) · [SoundCloud](https://soundcloud.com/blaqat)
     <!-- yarn:images caption="Old drawings" -->   ![Sona, front view](../media/sona.png)  (one per line)
     <!-- yarn:music title="late night" -->   - [feline shores](https://music.blaqat.net/daw/feline-shores.mp3) · 2:41
     <!-- yarn:mention ref=project:sonata --> [Sonata](https://blaqat.net/projects/sonata)
     <!-- yarn:note color=pink -->            > The note's text, **markdown** works.
     <!-- yarn:post id=tl1 -->                [My favorite browsers, ranked](https://blaqat.net/thoughts/tl1)
   An unknown kind renders its fallback. Studio's editor writes these; the Markdown toggle shows them as text.

   ctx (all optional): { about(ref) → { name, word, href, icon, tier? }, track(src) → song, post(id) → post,
     postCtx (Yarn.post ctx), gallery: "strip" | "grid", group (lightbox group prefix) }
   CSS: kit/yarn.css "i9 · blocks".
   ============================================================ */
(() => {
  "use strict";
  const Y = window.Yarn;
  if (!Y || Y.md) return;
  const esc = Y.esc;

  /* ============================================================
     INLINE: markdown → nodes → HTML
     ============================================================ */
  const ASCII_P = /[!-/:-@[-`{-~]/;
  const isWS = (c) => !c || /\s/.test(c);
  const isP = (c) => !!c && (ASCII_P.test(c) || /[\u2000-\u206f\u2e00-\u2e7f\u3000-\u303f]/.test(c));
  const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: "\u00a0", copy: "©", reg: "®", hellip: "…", mdash: "—", ndash: "–", lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”", times: "×", rarr: "→", larr: "←" };
  const decodeEnt = (e) => {
    if (e[0] === "#") { const n = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return n > 0 && n < 0x110000 ? String.fromCodePoint(n) : null; }
    return Object.prototype.hasOwnProperty.call(ENT, e) ? ENT[e] : null;
  };
  // [text](dest "title") starting at s[i] === "["; null if it isn't one
  function linkAt(s, i) {
    let depth = 0, j = i;
    for (; j < s.length; j++) {
      const c = s[j];
      if (c === "\\") { j++; continue; }
      if (c === "`") { let n = 1; while (s[j + n] === "`") n++; const k = s.indexOf("`".repeat(n), j + n); if (k > 0) { j = k + n - 1; continue; } j += n - 1; continue; }
      if (c === "[") depth++;
      else if (c === "]") { depth--; if (depth === 0) break; }
    }
    if (depth !== 0 || s[j + 1] !== "(") return null;
    let k = j + 2;
    while (s[k] === " " || s[k] === "\t") k++;
    let href = "";
    if (s[k] === "<") { const e = s.indexOf(">", k); if (e < 0) return null; href = s.slice(k + 1, e); k = e + 1; }
    else {
      let par = 0; const st = k;
      for (; k < s.length; k++) { const c = s[k]; if (c === "\\") { k++; continue; } if (/\s/.test(c)) break; if (c === "(") par++; else if (c === ")") { if (!par) break; par--; } }
      href = s.slice(st, k).replace(/\\([!-/:-@[-`{-~])/g, "$1");
    }
    while (s[k] === " " || s[k] === "\t" || s[k] === "\n") k++;
    let title = "";
    if (s[k] === '"' || s[k] === "'" || s[k] === "(") {
      const close = s[k] === "(" ? ")" : s[k]; const e = s.indexOf(close, k + 1);
      if (e < 0) return null;
      title = s.slice(k + 1, e); k = e + 1;
      while (s[k] === " " || s[k] === "\t") k++;
    }
    if (s[k] !== ")") return null;
    return { text: s.slice(i + 1, j), href, title, end: k + 1 };
  }
  const BARE = /^https?:\/\/[^\s<]*[^\s<.,:;"')\]!?*_~]/;
  function bareAt(s, i) {
    const m = s.slice(i).match(BARE);
    if (!m) return null;
    let u = m[0];
    // a ")" at the end belongs to the URL only when it opened one
    while (u.endsWith(")") && (u.match(/\(/g) || []).length < (u.match(/\)/g) || []).length) u = u.slice(0, -1);
    return u;
  }
  function nodesOf(s) {
    const out = []; let buf = "";
    const flush = () => { if (buf) { out.push({ t: "text", v: buf }); buf = ""; } };
    let i = 0;
    while (i < s.length) {
      const c = s[i];
      if (c === "\\") {
        const nx = s[i + 1];
        if (nx === "\n") { flush(); out.push({ t: "br" }); i += 2; while (s[i] === " ") i++; continue; }
        if (nx && ASCII_P.test(nx)) { buf += nx; i += 2; continue; }
        buf += c; i++; continue;
      }
      if (c === "\n") {
        const hard = / {2,}$/.test(buf);
        buf = buf.replace(/ +$/, ""); flush();
        out.push({ t: hard ? "br" : "soft" });
        i++; while (s[i] === " " || s[i] === "\t") i++;
        continue;
      }
      if (c === "`") {
        let n = 1; while (s[i + n] === "`") n++;
        let j = i + n, found = -1;
        while (j < s.length) {
          const k = s.indexOf("`", j); if (k < 0) break;
          let m = 1; while (s[k + m] === "`") m++;
          if (m === n) { found = k; break; }
          j = k + m;
        }
        if (found >= 0) {
          let code = s.slice(i + n, found).replace(/\n/g, " ");
          if (code.length > 2 && code[0] === " " && code[code.length - 1] === " " && /\S/.test(code)) code = code.slice(1, -1);
          flush(); out.push({ t: "code", v: code, n }); i = found + n; continue;
        }
        buf += "`".repeat(n); i += n; continue;
      }
      if (c === "!" && s[i + 1] === "[") { const r = linkAt(s, i + 1); if (r) { flush(); out.push({ t: "img", alt: r.text, src: r.href, title: r.title }); i = r.end; continue; } }
      if (c === "[") { const r = linkAt(s, i); if (r) { flush(); out.push({ t: "a", href: r.href, title: r.title, kids: nodesOf(r.text) }); i = r.end; continue; } }
      if (c === "<") {
        const m = s.slice(i).match(/^<((?:https?|mailto|ftp):[^\s<>]*|[\w.+-]+@[\w-]+(?:\.[\w-]+)+)>/i);
        if (m) { flush(); out.push({ t: "a", href: /@/.test(m[1]) && !/^mailto:/i.test(m[1]) ? `mailto:${m[1]}` : m[1], auto: true, kids: [{ t: "text", v: m[1] }] }); i += m[0].length; continue; }
      }
      if (c === "h" && (i === 0 || /[\s(]/.test(s[i - 1])) && s.startsWith("http", i)) {
        const u = bareAt(s, i);
        if (u) { flush(); out.push({ t: "a", href: u, bare: true, kids: [{ t: "text", v: u }] }); i += u.length; continue; }
      }
      if (c === "*" || c === "_" || c === "~") {
        let n = 1; while (s[i + n] === c) n++;
        if (c === "~" && n !== 2) { buf += c.repeat(n); i += n; continue; }
        const before = i > 0 ? s[i - 1] : "", after = s[i + n] || "";
        const lf = !isWS(after) && (!isP(after) || isWS(before) || isP(before));
        const rf = !isWS(before) && (!isP(before) || isWS(after) || isP(after));
        const open = c === "_" ? lf && (!rf || isP(before)) : lf;
        const close = c === "_" ? rf && (!lf || isP(after)) : rf;
        flush(); out.push({ t: "d", ch: c, n, orig: n, open, close }); i += n; continue;
      }
      if (c === "&") {
        const m = s.slice(i).match(/^&(#\d{1,7}|#[xX][0-9a-fA-F]{1,6}|[a-zA-Z][a-zA-Z0-9]{1,31});/);
        const d = m && decodeEnt(m[1]);
        if (d != null) { buf += d; i += m[0].length; continue; }
      }
      buf += c; i++;
    }
    flush();
    emphasis(out);
    return out;
  }
  // CommonMark's "process emphasis", over one level of nodes (link text is its own level)
  function emphasis(nodes) {
    let ci = 0;
    while (ci < nodes.length) {
      const cl = nodes[ci];
      if (!(cl.t === "d" && cl.close && cl.n > 0)) { ci++; continue; }
      let found = -1;
      for (let oi = ci - 1; oi >= 0; oi--) {
        const op = nodes[oi];
        if (op.t !== "d" || op.ch !== cl.ch || !op.open || op.n === 0) continue;
        if (cl.ch === "~") { if (op.n !== cl.n) continue; }
        else if ((op.close || cl.open) && (op.orig + cl.orig) % 3 === 0 && !(op.orig % 3 === 0 && cl.orig % 3 === 0)) continue;
        found = oi; break;
      }
      if (found < 0) { ci++; continue; }
      const op = nodes[found];
      const use = cl.ch === "~" ? 2 : op.n >= 2 && cl.n >= 2 ? 2 : 1;
      const el = { t: "el", tag: cl.ch === "~" ? "del" : use === 2 ? "strong" : "em", d: cl.ch, kids: nodes.slice(found + 1, ci) };
      nodes.splice(found + 1, ci - found - 1, el);
      op.n -= use; cl.n -= use;
      let c2 = found + 2;
      if (op.n === 0) { nodes.splice(found, 1); c2--; }
      if (cl.n === 0) nodes.splice(c2, 1);
      ci = c2;
    }
  }
  const safeHref = (h) => (/^\s*(javascript|vbscript|data):/i.test(h) && !/^\s*data:image\//i.test(h) ? "#" : h);
  function nodesHTML(nodes, o) {
    let h = "";
    for (const n of nodes) {
      if (n.t === "text") h += esc(n.v);
      else if (n.t === "d") h += esc(n.ch.repeat(n.n));
      else if (n.t === "br") h += "<br>";
      else if (n.t === "soft") h += o.soft ?? "\n";
      else if (n.t === "code") h += `<code${n.n > 1 ? ` data-t="${n.n}"` : ""}>${esc(n.v)}</code>`;
      else if (n.t === "img") h += `<img src="${esc(o.media ? o.media(n.src) : n.src)}" alt="${esc(textOf(nodesOf(n.alt)))}"${n.title ? ` title="${esc(n.title)}"` : ""}>`;
      else if (n.t === "a") {
        const ext = o.ext && /^https?:/i.test(n.href);
        h += `<a href="${esc(safeHref(n.href))}"${n.title ? ` title="${esc(n.title)}"` : ""}${n.auto ? " data-auto" : ""}${n.bare ? " data-bare" : ""}${ext ? ' target="_blank" rel="noopener"' : ""}>${nodesHTML(n.kids, o)}</a>`;
      } else if (n.t === "el") h += `<${n.tag}${n.d === "_" ? ' data-d="_"' : ""}>${nodesHTML(n.kids, o)}</${n.tag}>`;
    }
    return h;
  }
  function textOf(nodes) {
    let t = "";
    for (const n of nodes) {
      if (n.t === "text") t += n.v;
      else if (n.t === "d") t += n.ch.repeat(n.n);
      else if (n.t === "br" || n.t === "soft") t += " ";
      else if (n.t === "code") t += n.v;
      else if (n.t === "a" || n.t === "el") t += textOf(n.kids);
    }
    return t;
  }
  const inline = (md, o = {}) => nodesHTML(nodesOf(String(md ?? "")), o);
  const inlineText = (md) => textOf(nodesOf(String(md ?? "")));

  /* ============================================================
     INLINE: DOM → markdown (Studio's editor)
     ============================================================ */
  const URL_IN = /https?:\/\/[^\s<]*[^\s<.,:;"')\]!?*_~]/g;
  function escText(s) {
    // URLs typed into the text stay as they are (marked links them); everything else gets the escapes it needs
    let out = "", last = 0;
    s.replace(URL_IN, (m, at) => { out += escPlain(s.slice(last, at)) + m; last = at + m.length; return m; });
    return out + escPlain(s.slice(last));
  }
  function escPlain(s) {
    const tilde = (s.match(/~/g) || []).length > 1;
    let o = "";
    for (let i = 0; i < s.length; i++) {
      const c = s[i], p = s[i - 1] || "", n = s[i + 1] || "";
      if (c === "\\" || c === "`" || c === "*" || c === "[" || c === "]") o += "\\" + c;
      else if (c === "_") o += /[A-Za-z0-9]/.test(p) && /[A-Za-z0-9]/.test(n) ? c : "\\_";
      else if (c === "~") o += tilde ? "\\~" : c;
      else if (c === "<") o += /[A-Za-z/!?]/.test(n) ? "\\<" : c;
      else if (c === "&") o += /^&(#\d+|#x[0-9a-f]+|[a-z][a-z0-9]+);/i.test(s.slice(i)) ? "\\&" : c;
      else o += c;
    }
    return o;
  }
  // emphasis can't open or close on a space: move the spaces outside the markers
  const wrap = (inner, d) => {
    const m = inner.match(/^(\s*)([\s\S]*?)(\s*)$/);
    return m[2] ? `${m[1]}${d}${m[2]}${d}${m[3]}` : inner;
  };
  const codeSpan = (t) => {
    t = t.replace(/\u200b/g, "").replace(/\u00a0/g, " ").replace(/\n/g, " ");
    if (!t) return "";
    const runs = t.match(/`+/g) || [];
    const n = Math.max(0, ...runs.map((r) => r.length)) + 1;
    const pad = /^`|`$/.test(t) || (/^ /.test(t) && / $/.test(t) && /\S/.test(t)) ? " " : "";
    return "`".repeat(n) + pad + t + pad + "`".repeat(n);
  };
  const dest = (u) => (/[\s()<>]/.test(u) ? `<${u.replace(/[<>]/g, encodeURIComponent)}>` : u);
  function fromDOM(root, { multi = false } = {}) {
    const BR = "\u0000";
    const ser = (node) => {
      if (node.nodeType === 3) return escText(node.data.replace(/\u200b/g, "").replace(/\u00a0/g, " ").replace(/\n/g, " "));
      if (node.nodeType !== 1 || node.hasAttribute("data-noser")) return "";
      const tag = node.tagName.toLowerCase();
      const kids = () => [...node.childNodes].map(ser).join("");
      switch (tag) {
        case "br": return BR;
        case "strong": case "b": return wrap(kids(), node.dataset.d === "_" ? "__" : "**");
        case "em": case "i": return wrap(kids(), node.dataset.d === "_" ? "_" : "*");
        case "del": case "s": case "strike": return wrap(kids(), "~~");
        case "code": case "kbd": case "samp": return codeSpan(node.textContent);
        case "img": return `![${escText(node.getAttribute("alt") || "")}](${dest(node.getAttribute("src") || "")})`;
        case "a": {
          const href = node.getAttribute("href") || "", inner = kids(), t = node.textContent;
          if (!href) return inner;
          if (node.hasAttribute("data-bare") && t === href) return href;
          if (node.hasAttribute("data-auto") && (t === href || `mailto:${t}` === href)) return `<${t}>`;
          const title = node.getAttribute("title");
          return `[${inner}](${dest(href)}${title ? ` "${title.replace(/"/g, '\\"')}"` : ""})`;
        }
        case "div": case "p": case "li": case "h1": case "h2": case "h3": case "h4": case "h5": case "h6": case "blockquote": case "pre":
          return (node.previousSibling ? BR : "") + kids();
        case "script": case "style": case "template": return "";
        default: return kids();
      }
    };
    let s = [...root.childNodes].map(ser).join("");
    // Chrome keeps a <br> in an emptied editable: trailing breaks never count
    s = s.replace(new RegExp(`${BR}+$`), "").replace(new RegExp(`^${BR}+`), "");
    // the marker's own spaces around a break don't survive in markdown
    s = s.replace(new RegExp(` +${BR}`, "g"), BR).replace(new RegExp(`${BR} +`, "g"), BR);
    if (multi) s = s.replace(new RegExp(`${BR}{2,}`, "g"), "\n\n").replace(new RegExp(BR, "g"), "\\\n");
    else s = s.replace(new RegExp(`${BR}+`, "g"), "\\\n");
    return s.trim() ? s.replace(/^[ \t]+|[ \t]+$/g, "") : "";
  }

  /* ============================================================
     BLOCKS: parse (exact source kept) → serialize
     ============================================================ */
  const RX = {
    blank: /^[ \t]*$/,
    fence: /^( {0,3})(`{3,}|~{3,})(.*)$/,
    atx: /^ {0,3}(#{1,6})(?=[ \t]|$)(.*)$/,
    hr: /^ {0,3}(?:(?:-[ \t]*){3,}|(?:\*[ \t]*){3,}|(?:_[ \t]*){3,})$/,
    quote: /^ {0,3}>/,
    li: /^( *)([-+*]|\d{1,9}[.)])([ \t]+|$)(.*)$/,
    yarn: /^ {0,3}<!--\s*yarn:\s*([a-z][\w-]*)([\s\S]*?)-->[ \t]*$/i,
    html: /^ {0,3}(?:<!--|<\?|<![A-Za-z]|<\/?[a-zA-Z][a-zA-Z0-9-]*(?:[\s/>]|$))/,
    htmlBlock: /^ {0,3}(?:<!--|<\/?(?:address|article|aside|blockquote|details|dialog|div|dl|fieldset|figcaption|figure|footer|form|h[1-6]|header|hr|iframe|li|main|nav|ol|p|pre|section|summary|table|tbody|td|th|thead|tr|ul|script|style|video|audio)(?:[\s/>]|$))/i,
    setext: /^ {0,3}(=+|-+)[ \t]*$/,
    table: /^ {0,3}\|?[ \t]*:?-+:?[ \t]*(\|[ \t]*:?-*:?[ \t]*)*\|?[ \t]*$/,
    indcode: /^(?: {4}|\t)/,
    img: /^!\[((?:\\.|[^\]\\])*)\]\(\s*(<[^>]*>|[^\s)]+)(?:\s+"((?:\\.|[^"\\])*)")?\s*\)$/,
  };
  const lead = (l) => l.match(/^ */)[0].length;
  const isFence = (l) => { const m = l.match(RX.fence); return !!m && !(m[2][0] === "`" && m[3].includes("`")); };
  // a line that ends a paragraph (CommonMark: the blocks that may interrupt one)
  const interrupts = (l) => isFence(l) || RX.atx.test(l) || RX.hr.test(l) || RX.quote.test(l) || RX.yarn.test(l) || RX.htmlBlock.test(l)
    || /^ {0,3}[-+*][ \t]+\S/.test(l) || /^ {0,3}1[.)][ \t]+\S/.test(l);
  const atxText = (t) => t.replace(/^[ \t]+/, "").replace(/[ \t]+#+[ \t]*$/, "").replace(/^#+[ \t]*$/, "").replace(/[ \t]+$/, "");
  // what the editor can't draw as a block of its own stays raw markdown (lossless; drawn by the renderer)
  const stripCode = (t) => t.replace(/(`+)[\s\S]*?\1/g, "");
  const unsupported = (t) => { const s = stripCode(t); return /<\/?[A-Za-z][A-Za-z0-9-]*(?:\s[^>]*)?\/?>/.test(s.replace(/<(?:https?|mailto|ftp):[^\s<>]*>/gi, "")) || /\[[^\]]*\]\[[^\]]*\]|\[\^/.test(s) || /^\s*\[[^\]]+\]:\s/m.test(s) || /!\[[^\]]*\]\([^)]*\)/.test(s); };
  function parseAttrs(s) {
    const a = {};
    String(s || "").replace(/([\w-]+)(?:=("([^"]*)"|'([^']*)'|[^\s"']+))?/g, (m, k, raw, q1, q2) => { a[k.toLowerCase()] = raw == null ? true : unEsc(q1 ?? q2 ?? raw); return m; });
    return a;
  }
  const unEsc = (v) => String(v).replace(/&quot;/g, '"').replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&amp;/g, "&");
  const attrsMD = (a) => Object.entries(a || {}).filter(([, v]) => v != null && v !== false && v !== "").map(([k, v]) => (v === true ? ` ${k}` : /^[\w:#.,/@+-]+$/.test(String(v)) ? ` ${k}=${v}` : ` ${k}="${String(v).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/>/g, "&gt;")}"`)).join("");

  function parse(text) {
    const src = String(text ?? "").replace(/\r\n?/g, "\n");
    const lines = src.split("\n"), n = lines.length;
    const starts = []; { let o = 0; for (const l of lines) { starts.push(o); o += l.length + 1; } }
    const blocks = []; let prevEnd = 0;
    const push = (b, a, e) => {
      const st = starts[a], en = starts[e - 1] + lines[e - 1].length;
      b.sep = src.slice(prevEnd, st); b.src = src.slice(st, en); prevEnd = en; blocks.push(b);
    };
    let i = 0, m;
    while (i < n) {
      const L = lines[i];
      if (RX.blank.test(L)) { i++; continue; }
      // fenced code
      if (isFence(L)) {
        m = L.match(RX.fence);
        const ind = m[1].length, f = m[2];
        const close = new RegExp(`^ {0,3}${f[0] === "`" ? "`" : "~"}{${f.length},}[ \\t]*$`);
        let j = i + 1; while (j < n && !close.test(lines[j])) j++;
        const code = lines.slice(i + 1, j).map((l) => l.replace(new RegExp(`^ {0,${ind}}`), "")).join("\n");
        const end = j < n ? j + 1 : n;
        push({ type: "code", lang: m[3].trim(), code, fence: f }, i, end);
        i = end; continue;
      }
      // a yarn block: the directive + the fallback right under it
      if ((m = L.match(RX.yarn))) {
        let j = i + 1; while (j < n && !RX.blank.test(lines[j])) j++;
        push({ type: "yarn", kind: m[1].toLowerCase(), attrs: parseAttrs(m[2]), body: lines.slice(i + 1, j).join("\n") }, i, j);
        i = j; continue;
      }
      if ((m = L.match(RX.atx))) { push({ type: "h", level: m[1].length, text: atxText(m[2]) }, i, i + 1); i++; continue; }
      if (RX.hr.test(L)) { push({ type: "hr" }, i, i + 1); i++; continue; }
      if (RX.quote.test(L)) {
        let j = i; const inner = [];
        while (j < n) {
          const l = lines[j];
          if (RX.blank.test(l)) break;
          const q = l.match(/^ {0,3}> ?(.*)$/);
          if (q) { inner.push(q[1]); j++; continue; }
          if (inner.length && !RX.blank.test(inner[inner.length - 1]) && !interrupts(l)) { inner.push(l); j++; continue; }
          break;
        }
        const sub = parse(inner.join("\n")).blocks;
        if (sub.length && sub.every((b) => b.type === "p")) push({ type: "quote", text: sub.map((b) => b.text).join("\n\n") }, i, j);
        else push({ type: "raw" }, i, j);
        i = j; continue;
      }
      if (RX.li.test(L) && lead(L) <= 3) {
        const run = listRun(lines, i);
        if (run.complex) push({ type: "raw" }, i, run.end);
        else for (const it of run.items) push({ type: "li", list: it.list, ind: it.depth, mark: it.mark, num: it.num, text: it.text }, it.a, it.e);
        i = run.end; continue;
      }
      if (RX.html.test(L)) {
        let j = i;
        if (/^ {0,3}<!--/.test(L)) { while (j < n && !lines[j].includes("-->")) j++; j = Math.min(n, j + 1); }
        else { while (j < n && !RX.blank.test(lines[j])) j++; }
        push({ type: "raw" }, i, j); i = j; continue;
      }
      if (RX.indcode.test(L)) {
        let j = i + 1;
        while (j < n) { if (RX.indcode.test(lines[j])) { j++; continue; } if (RX.blank.test(lines[j])) { let k = j; while (k < n && RX.blank.test(lines[k])) k++; if (k < n && RX.indcode.test(lines[k])) { j = k; continue; } } break; }
        push({ type: "raw" }, i, j); i = j; continue;
      }
      if (L.includes("|") && i + 1 < n && RX.table.test(lines[i + 1]) && lines[i + 1].includes("-")) {
        let j = i + 2; while (j < n && !RX.blank.test(lines[j]) && lines[j].includes("|")) j++;
        push({ type: "raw" }, i, j); i = j; continue;
      }
      // paragraph (or a setext heading)
      let j = i + 1, setext = 0;
      while (j < n) {
        const l = lines[j];
        if (RX.blank.test(l)) break;
        if ((m = l.match(RX.setext))) { setext = m[1][0] === "=" ? 1 : 2; j++; break; }
        if (interrupts(l)) break;
        j++;
      }
      const para = lines.slice(i, setext ? j - 1 : j);
      const text = para.map((l, k) => (k === para.length - 1 ? l.trim() : l.replace(/^[ \t]+/, ""))).join("\n");
      const im = !setext && para.length === 1 && text.match(RX.img);
      if (setext) push({ type: "h", level: setext, text: text.replace(/\s*\n\s*/g, " ").trim(), setext: true }, i, j);
      else if (im) push({ type: "img", alt: im[1].replace(/\\(.)/g, "$1"), url: im[2].replace(/^<|>$/g, ""), title: (im[3] || "").replace(/\\(.)/g, "$1") }, i, j);
      else if (unsupported(text)) push({ type: "raw" }, i, j);
      else push({ type: "p", text }, i, j);
      i = j;
    }
    for (const b of blocks) if (b.type === "raw") b.raw = b.src;
    if (blocks[0]) blocks[0].first = true; // (its sep is the text's leading whitespace)
    return { blocks, tail: src.slice(prevEnd) };
  }

  // a list run: items (nested by content column, CommonMark style) until the list ends
  function listRun(lines, i0) {
    const n = lines.length, items = [], stack = [];
    let j = i0, complex = false;
    while (j < n) {
      const m = lines[j].match(RX.li);
      if (!m) break;
      const indent = m[1].length;
      if (!stack.length && indent > 3) break;
      while (stack.length && indent < stack[stack.length - 1]) stack.pop();
      if (stack.length && indent >= stack[stack.length - 1] + 4) { complex = true; }
      const depth = stack.length;
      const w = m[2].length, sp = m[3].length;
      const col = indent + w + (sp === 0 || sp > 4 ? 1 : sp);
      stack.push(col);
      const ol = /\d/.test(m[2][0]);
      let first = m[4];
      if (/^\[[ xX]\]([ \t]|$)/.test(first)) complex = true;
      const text = [first];
      let k = j + 1;
      while (k < n) {
        const c = lines[k];
        if (RX.blank.test(c)) {
          let k2 = k; while (k2 < n && RX.blank.test(lines[k2])) k2++;
          if (k2 >= n) break;
          const nx = lines[k2];
          if (RX.li.test(nx) && lead(nx) < col + 4) break;
          if (lead(nx) >= col) { complex = true; k = k2; continue; }
          break;
        }
        if (RX.li.test(c) && lead(c) < col + 4) break;
        if (lead(c) >= col) { if (interrupts(c.slice(col))) complex = true; text.push(c.trim()); k++; continue; }
        if (!interrupts(c)) { text.push(c.trim()); k++; continue; }
        break;
      }
      const t = text.join("\n").replace(/[ \t]+$/, "");
      if (unsupported(t) || isFence(first) || RX.atx.test(first) || RX.quote.test(first) || (RX.hr.test(first) && first.trim())) complex = true;
      items.push({ a: j, e: k, depth, list: ol ? "ol" : "ul", mark: ol ? m[2].slice(-1) : m[2], num: ol ? parseInt(m[2], 10) : 0, text: t });
      j = k;
      // the run goes on through blank lines while a list item follows (a loose list); the seps keep the blank lines
      let k2 = j; while (k2 < n && RX.blank.test(lines[k2])) k2++;
      if (k2 < n && RX.li.test(lines[k2])) { j = k2; continue; }
      break;
    }
    return { items, end: j, complex };
  }

  /* ---------- serialize ---------- */
  // a paragraph-ish line that would read as another block gets its first character escaped
  const escStarts = (t) => String(t).split("\n").map((l) => {
    l = l.replace(/^[ \t]+/, "");
    if (/^#{1,6}(?=[ \t]|$)/.test(l) || /^[-+*](?=[ \t]|$)/.test(l) || /^>/.test(l) || /^=+[ \t]*$/.test(l) || /^-+[ \t]*$/.test(l) || /^(?:[-*_][ \t]*){3,}$/.test(l)) return "\\" + l;
    if (/^\d{1,9}[.)](?=[ \t]|$)/.test(l)) return l.replace(/^(\d+)([.)])/, "$1\\$2");
    if (/^(`{3,}|~{3,})/.test(l)) return "\\" + l;
    return l;
  }).join("\n");
  function block(b, ctx = {}) {
    if (b.src != null) return b.src;
    switch (b.type) {
      case "p": return escStarts(b.text || "");
      case "h": return `${"#".repeat(Math.min(6, Math.max(1, b.level || 2)))} ${String(b.text || "").replace(/\\\n|\n/g, " ").replace(/(\s)(#+)\s*$/, "$1\\$2")}`.replace(/ $/, "");
      case "li": {
        const ind = " ".repeat(ctx.indent || 0);
        const mark = b.list === "ol" ? `${ctx.num ?? b.num ?? 1}${b.mark === ")" ? ")" : "."}` : (b.mark && /^[-+*]$/.test(b.mark) ? b.mark : "-");
        const pad = " ".repeat(ind.length + mark.length + 1);
        return `${ind}${mark} ${escStarts(b.text || "").replace(/\n/g, "\n" + pad)}`.replace(/ +$/, "");
      }
      case "quote": return String(b.text || "").split("\n\n").map((para) => escStarts(para)).join("\n\n").split("\n").map((l) => (l ? `> ${l}` : ">")).join("\n");
      case "code": {
        const code = String(b.code || "");
        const runs = code.match(/^ {0,3}`{3,}/gm) || [];
        const f = "`".repeat(Math.max(3, ...runs.map((r) => r.trim().length + 1)));
        return `${f}${b.lang || ""}\n${code}${code ? "\n" : ""}${f}`;
      }
      case "hr": return "---";
      case "img": return `![${escText(b.alt || "")}](${dest(b.url || "")}${b.title ? ` "${b.title.replace(/"/g, '\\"')}"` : ""})`;
      case "yarn": return `<!-- yarn:${b.kind}${attrsMD(b.attrs)} -->${b.body ? `\n${b.body}` : ""}`;
      case "raw": return b.raw || "";
    }
    return "";
  }
  const isEmptyText = (b) => (b.type === "p") && !String(b.text || "").trim() && b.src == null;
  // the content column of a list item: where a child's marker must start
  const liCol = (b, txt) => { const m = txt.match(/^( *)([-+*]|\d{1,9}[.)])( +|$)/); return m ? m[1].length + m[2].length + (m[3].length === 0 || m[3].length > 4 ? 1 : m[3].length) : 2; };
  function serialize(doc) {
    const bs = (doc.blocks || []).filter((b) => !isEmptyText(b));
    let out = "", prev = null;
    const cols = []; // content columns of the open list items, by depth
    const nums = []; // numbering of the open ordered runs, by depth
    bs.forEach((b, i) => {
      let ctx = {};
      if (b.type === "li") {
        const d = Math.max(0, b.ind || 0);
        if (prev?.type !== "li") { cols.length = 0; nums.length = 0; }
        cols.length = Math.min(cols.length, d);
        const indent = d ? (cols[d - 1] ?? d * 2) : 0;
        // numbering: a run at this depth continues while the items stay ordered
        const run = nums[d];
        const num = b.list === "ol" ? (run && run.list === "ol" && prev?.type === "li" ? run.n + 1 : (b.num || 1)) : 0;
        nums.length = d; nums[d] = { list: b.list, n: num };
        ctx = { indent, num };
        const txt = block(b, ctx);
        cols[d] = liCol(b, b.src != null ? txt.split("\n")[0] : txt);
        out += sepOf(prev, b, i) + txt;
      } else {
        cols.length = 0; nums.length = 0;
        out += sepOf(prev, b, i) + block(b, ctx);
      }
      prev = b;
    });
    return out + (bs.length ? doc.tail ?? "" : "");
  }
  function sepOf(prev, b, i) {
    if (i === 0) return b.first && b.sep != null ? b.sep : "";
    if (b.sep != null && b.sep.includes("\n")) return b.sep;
    if (prev?.type === "li" && b.type === "li" && ((b.ind || 0) > 0 || prev.list === b.list)) return "\n";
    return "\n\n";
  }

  /* ============================================================
     YARN BLOCKS
     ============================================================ */
  const LINK_ALL = /\[((?:\\.|[^\]\\])*)\]\(\s*(<[^>]*>|[^\s)]+)(?:\s+"[^"]*")?\s*\)/g;
  const linksIn = (body) => [...String(body || "").matchAll(LINK_ALL)].filter((m) => body[m.index - 1] !== "!").map((m) => ({ text: inlineText(m[1]), md: m[1], href: m[2].replace(/^<|>$/g, "") }));
  const mdText = (t) => escText(String(t || "")).replace(/\n/g, " ");
  const quoteBody = (body) => String(body || "").split("\n").map((l) => l.replace(/^ {0,3}> ?/, "")).join("\n");
  const fmtDur = (s) => Y.fmtTime ? Y.fmtTime(s) : `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
  const secsOf = (d) => { const [mm, ss] = String(d || "").split(":").map(Number); return (mm || 0) * 60 + (ss || 0); };
  const SITE = "https://blaqat.net";

  // the kit's own lookups (the site's data); Studio passes its own working copies through ctx
  const POSTS = () => window.THOUGHTS?.posts || [];
  const KIND_WORD = { project: "project", release: "release", ranking: "ranking", item: "ranked item", pick: "pick", post: "post" };
  function about(ref, ctx = {}) {
    if (ctx.about) return ctx.about(ref);
    const m = String(ref || "").match(/^(project|release|post):([^#]+)(?:#(.+))?$/);
    if (!m) return null;
    const [, ns, id, item] = m;
    if (ns === "project") {
      const pr = (window.BLAQAT?.projects || []).find((p) => Y.slug(p.name) === id);
      return pr && { ref, kind: "project", word: KIND_WORD.project, name: pr.name, href: Y.siteURL(`projects/item.html?p=${encodeURIComponent(id)}`), icon: "ph-folder-simple" };
    }
    if (ns === "release") {
      const r = (window.BLAQAT?.music || []).find((x) => Y.slug(x.name) === id);
      return r && { ref, kind: "release", word: KIND_WORD.release, name: r.name, href: Y.siteURL("music/index.html"), icon: "ph-music-notes" };
    }
    const p = (ctx.posts || POSTS()).find((x) => String(x.id) === id);
    if (!p) return null;
    const T = Y.post?.TYPE || {};
    if (item) {
      const td = Y.post?.tierDefs?.(p).find((d) => (p.tiers?.[d.id] || []).includes(item));
      return { ref, kind: "item", word: KIND_WORD.item, name: item, href: Y.siteURL(`thoughts/tier.html?id=${encodeURIComponent(p.id)}&item=${encodeURIComponent(Y.slug(item))}`), icon: "ph-ranking", tier: td && { id: td.id, short: td.short, color: td.color } };
    }
    if (p.type === "tierlist") return { ref, kind: "ranking", word: KIND_WORD.ranking, name: p.title, href: Y.siteURL(`thoughts/tier.html?id=${encodeURIComponent(p.id)}`), icon: "ph-ranking" };
    if (p.type === "pick") return { ref, kind: "pick", word: KIND_WORD.pick, name: p.name, href: Y.siteURL(`thoughts/stitched.html?view=collection&c=${encodeURIComponent(p.collection || "")}&item=${encodeURIComponent(p.id)}`), icon: "ph-tag" };
    return { ref, kind: "post", word: (T[p.type]?.one || "post").toLowerCase(), name: p.title || p.name || p.text || "a post", href: Y.siteURL(p.type === "article" ? `thoughts/stitched.html?view=article&id=${encodeURIComponent(p.id)}` : `thoughts/stitched.html#post-${encodeURIComponent(p.id)}`), icon: T[p.type]?.icon || "ph-note" };
  }
  // a public URL for the fallback markdown (what a reader of plain markdown clicks)
  const publicOf = (ref) => {
    const m = String(ref || "").match(/^(project|release|post):([^#]+)(?:#(.+))?$/);
    if (!m) return SITE;
    if (m[1] === "project") return `${SITE}/projects/${m[2]}`;
    if (m[1] === "release") return `${SITE}/music/${m[2]}`;
    return `${SITE}/thoughts/${m[2]}${m[3] ? `#${Y.slug(m[3])}` : ""}`;
  };
  const trackOf = (src, title, ctx) => (ctx.track ? ctx.track(src, title) : null) || Y.post?.trackItem?.({ src, title }) || { name: title, url: src, instrument: "daw" };
  let G = 0;
  const gid = (ctx, k) => `${ctx.group || "ymd"}-${k}-${(++G).toString(36)}`;

  const linkName = (href) => { const i = Y.linkInfo?.(href); if (i?.valid) return i.label; const b = Y.brandOf?.(href); return (b && Y.LINK_ICONS?.[b]?.[1]) || String(href).replace(/^https?:\/\/(www\.)?/, "").split(/[/?#]/)[0] || "Link"; };
  const KINDS = {
    link: {
      label: "Link", icon: "ph-link", hint: "your link button, or a brand icon", keys: "url button github soundcloud youtube spotify brand",
      data: (a, body) => ({ links: linksIn(body).map((l) => ({ text: l.text, href: l.href })), style: a.style === "icon" ? "icon" : "button", primary: a.plain ? false : true }),
      attrs: (d) => ({ style: d.style === "icon" ? "icon" : null, plain: d.style !== "icon" && d.primary === false ? true : null }),
      // no text of its own: the recogniser's name for it ("SoundCloud"), so the plain markdown still reads
      body: (d) => (d.links || []).filter((l) => l.href).map((l) => `[${mdText(l.text || linkName(l.href)) || "Link"}](${dest(l.href)})`).join(" · "),
      empty: (d) => !(d.links || []).some((l) => l.href),
      text: (d) => (d.links || []).map((l) => l.text).join(" "),
      // the owner's link component: Yarn.dlinks (the recogniser: brand, icon, a known site's name when there's no text)
      // or round brand icons (Yarn.linkIcon). Older kits: Yarn.dlink one by one.
      render(d) {
        const ls = (d.links || []).filter((l) => l.href), list = ls.map((l) => ({ url: l.href, text: l.text || "" }));
        if (d.style === "icon") {
          const info = Y.links ? Y.links(list) : ls.map((l) => ({ url: l.href, label: l.text, brand: Y.brandOf?.(l.href) || "" }));
          return `<div class="ymd-links ymd-links--icons">${info.map((l) => Y.linkIcon(l.brand || "link", l.url, l.label || undefined)).join("")}</div>`;
        }
        const row = Y.dlinks ? Y.dlinks(list, { primary: d.primary !== false }) : ls.map((l, i) => Y.dlink({ href: l.href, label: l.text || "", primary: d.primary !== false && i === 0 })).join("");
        return `<div class="ymd-links">${row}</div>`;
      },
    },
    images: {
      label: "Images", icon: "ph-images", hint: "from Media: one, or a set", keys: "image photo picture gallery media video",
      data: (a, body) => ({ images: [...String(body || "").matchAll(/!\[((?:\\.|[^\]\\])*)\]\(\s*(<[^>]*>|[^\s)]+)(?:\s+"[^"]*")?\s*\)/g)].map((m) => ({ src: m[2].replace(/^<|>$/g, ""), alt: inlineText(m[1]) })), caption: a.caption || "" }),
      attrs: (d) => ({ caption: d.caption || null }),
      body: (d) => (d.images || []).map((m) => `![${escText(m.alt || "")}](${dest(m.src)})`).join("\n"),
      empty: (d) => !(d.images || []).length,
      text: (d) => d.caption || "",
      render(d, ctx) {
        const ims = d.images || [];
        const g = gid(ctx, "img");
        if (ims.length === 1) {
          const m = ims[0], src = Y.media(m.src), vid = Y.isVideo(m.src, m.kind);
          const inner = !src ? `<span class="ymissing"><i class="ph ${vid ? "ph-video-camera" : "ph-image"}" aria-hidden="true"></i>${vid ? "video" : "image"} not in this mock</span>`
            : vid ? `<video src="${src}#t=0.6" muted playsinline preload="metadata" aria-hidden="true" tabindex="-1"></video><span class="ycar__dur" aria-hidden="true"><i class="ph-fill ph-play"></i><span>video</span></span>`
            : `<img src="${src}" alt="" loading="lazy" decoding="async" draggable="false">`;
          return `<figure class="ymd-fig" data-ylb-title="${esc(d.caption || "")}"><button type="button" class="ymd-fig__btn"${src ? ` data-ylb="${g}" data-src="${src}" data-alt="${esc(m.alt || "")}" data-kind="${vid ? "video" : "image"}" aria-haspopup="dialog"` : " disabled"} aria-label="Open ${vid ? "video" : "image"}${m.alt ? `: ${esc(m.alt)}` : ""}">${inner}</button>${d.caption ? `<figcaption class="meta">${esc(d.caption)}</figcaption>` : ""}</figure>`;
        }
        if ((ctx.gallery || Y.params?.get("mdgallery")) === "grid" && Y.post?.thumbHTML) return `<figure class="ymd-grid" data-ylb-title="${esc(d.caption || "")}"><div class="ypost__grid" data-n="${Math.min(ims.length, 4)}">${ims.map((m, i) => Y.post.thumbHTML(g, m, i, ims.length)).join("")}</div>${d.caption ? `<figcaption class="meta">${esc(d.caption)}</figcaption>` : ""}</figure>`;
        return `<div class="ymd-strip">${Y.carousel(ims, { group: g, title: d.caption || "", label: d.caption || "Images", heading: !!d.caption })}</div>`;
      },
    },
    music: {
      label: "Music", icon: "ph-music-notes", hint: "a song or a playlist of yours", keys: "song track playlist audio listen play",
      data: (a, body) => ({ title: a.title || "", tracks: String(body || "").split("\n").map((l) => { const k = linksIn(l)[0]; if (!k) return null; const du = (l.match(/·\s*(\d{1,3}:\d{2})\s*$/) || [])[1] || ""; return { title: k.text, src: k.href, dur: du }; }).filter(Boolean) }),
      attrs: (d) => ({ title: d.title || null }),
      body: (d) => (d.tracks || []).map((t) => `- [${mdText(t.title || "Untitled")}](${dest(t.src)})${t.dur ? ` · ${t.dur}` : ""}`).join("\n"),
      empty: (d) => !(d.tracks || []).length,
      text: (d) => [d.title, ...(d.tracks || []).map((t) => t.title)].join(" "),
      render(d, ctx) {
        const ts = d.tracks || [];
        const total = ts.reduce((s, t) => s + secsOf(t.dur), 0);
        const rows = ts.map((t, i) => {
          const song = trackOf(t.src, t.title, ctx);
          return `<li><button type="button" class="ypost__track ysel" data-ymd-track="${i}" aria-current="false" aria-label="Play ${esc(t.title || song.name || "track")}${t.dur ? `, ${esc(t.dur)}` : ""}">
            <span class="ypost__tsw ytrkart" aria-hidden="true">${Y.swatchHTML(song, { size: 34, radius: 8 })}<i class="ph-fill ph-play"></i></span>
            <span class="ypost__tt">${esc(t.title || song.name || "Untitled")}${song.collection ? `<small>${esc(song.collection)}</small>` : ""}</span><span class="ypost__tdur">${esc(t.dur || "")}</span></button></li>`;
        }).join("");
        const head = d.title || ts.length > 1 ? `<div class="ymd-music__head">${d.title ? `<b>${esc(d.title)}</b>` : ""}${ts.length > 1 ? `<span class="meta">${ts.length} tracks${total ? ` · ${fmtDur(total)}` : ""}</span>` : ""}${ts.length > 1 ? `<button type="button" class="btn btn--red btn--sm ymd-music__all" data-ymd-all><i class="ph-fill ph-play" aria-hidden="true"></i><span>Play all</span></button>` : ""}</div>` : "";
        return `<div class="ycard ymd-music" data-ymd-tracks="${esc(JSON.stringify(ts.map((t) => t.src)))}">${head}<ol class="ypost__tracks">${rows}</ol></div>`;
      },
    },
    mention: {
      label: "Mention", icon: "ph-at", hint: "a project, post or ranked item", keys: "about project post ranking pick release write-up pill",
      data: (a, body) => ({ ref: a.ref || "", name: linksIn(body)[0]?.text || "" }),
      attrs: (d) => ({ ref: d.ref || null }),
      body: (d, ctx = {}) => (d.ref ? `[${mdText(about(d.ref, ctx)?.name || d.name || d.ref)}](${publicOf(d.ref)})` : ""),
      empty: (d) => !d.ref,
      text: (d) => d.name || "",
      render(d, ctx) {
        const a = about(d.ref, ctx);
        if (!a) return `<p class="ymd-about"><span class="yabout yabout--gone"><span class="yabout__k">gone</span><b>${esc(d.name || d.ref || "?")}</b></span></p>`;
        const pill = Y.post?.aboutPill ? Y.post.aboutPill(d.ref, { about: () => a }, { k: a.word }) : "";
        return `<p class="ymd-about">${pill}</p>`;
      },
    },
    note: {
      label: "Note", icon: "ph-note", hint: "a sticky note, in your colours", keys: "callout sticky note aside tip warning",
      data: (a, body) => ({ text: quoteBody(body), color: a.color || "" }),
      attrs: (d) => ({ color: d.color && d.color !== (Y.post?.NOTE_COLORS?.[0]?.[0]) ? d.color : null }),
      body: (d) => String(d.text || "").split("\n").map((l) => (l ? `> ${l}` : ">")).join("\n"),
      empty: (d) => !String(d.text || "").trim(),
      text: (d) => inlineText(d.text),
      render(d) {
        const cols = Y.post?.NOTE_COLORS || [["canary"]];
        const c = cols.some(([k]) => k === d.color) ? d.color : cols[0][0];
        const paras = String(d.text || "").split(/\n{2,}/).map((p) => `<p>${inline(p, { soft: " " })}</p>`).join("");
        return `<aside class="ypost ypost--sticky ymd-note" data-note="${c}"><span class="ypost__tape" aria-hidden="true"></span>${paras}</aside>`;
      },
    },
    post: {
      label: "Post card", icon: "ph-cards", hint: "a Thoughts post, as its card", keys: "post card ranking tier pick playlist scratch embed thought",
      data: (a, body) => ({ id: a.id || "", name: linksIn(body)[0]?.text || "" }),
      attrs: (d) => ({ id: d.id || null }),
      body: (d, ctx = {}) => { const p = (ctx.posts || POSTS()).find((x) => String(x.id) === String(d.id)); return d.id ? `[${mdText(p ? p.title || p.name || p.text || "A post" : d.name || "A post")}](${SITE}/thoughts/${d.id})` : ""; },
      empty: (d) => !d.id,
      text: (d) => d.name || "",
      render(d, ctx) {
        const p = (ctx.posts || POSTS()).find((x) => String(x.id) === String(d.id));
        if (!p || !Y.post) return `<p class="ymd-about"><span class="yabout yabout--gone"><span class="yabout__k">gone</span><b>${esc(d.name || d.id || "?")}</b></span></p>`;
        return `<div class="ymd-post">${Y.post(p, ctx.postCtx || {})}</div>`;
      },
    },
  };
  const yarnData = (b) => (KINDS[b.kind] ? KINDS[b.kind].data(b.attrs || {}, b.body || "") : {});
  // a yarn block from its data (the editor's forms): attrs + fallback written fresh
  const yarn = (kind, d, ctx = {}) => ({ type: "yarn", kind, attrs: Object.fromEntries(Object.entries(KINDS[kind].attrs(d)).filter(([, v]) => v != null)), body: KINDS[kind].body(d, ctx), src: null });
  function renderYarn(b, ctx = {}) {
    const K = KINDS[b.kind];
    if (!K) return renderMD(b.body || "", ctx);
    try { return `<div class="ymd ymd--${b.kind}" data-ymd="${b.kind}">${K.render(yarnData(b), ctx)}</div>`; }
    catch (e) { console.warn(e); return renderMD(b.body || "", ctx); }
  }

  /* ============================================================
     RENDER (the site): marked for plain markdown when the page has it, the kit's own otherwise
     ============================================================ */
  const fixMedia = (s) => (Y.kitURL ? s.replace(/\]\(\s*(?:\.\.\/media\/|\/media\/)/g, "](" + Y.kitURL("../media/")) : s);
  const mediaSrc = (s) => (Y.media && /^(\.\.\/|\/)media\//.test(s) ? Y.media(s) || s : s);
  function blockHTML(b) {
    const il = (t) => inline(t, { media: mediaSrc });
    switch (b.type) {
      case "p": return `<p>${il(b.text)}</p>`;
      case "h": return `<h${b.level}>${il(b.text)}</h${b.level}>`;
      case "quote": return `<blockquote>${String(b.text || "").split(/\n{2,}/).map((p) => `<p>${il(p)}</p>`).join("")}</blockquote>`;
      case "code": return `<pre><code${b.lang ? ` class="language-${esc(b.lang.split(/\s/)[0])}"` : ""}>${esc(b.code)}</code></pre>`;
      case "hr": return "<hr>";
      case "img": return `<p><img src="${esc(mediaSrc(b.url))}" alt="${esc(b.alt)}"${b.title ? ` title="${esc(b.title)}"` : ""}></p>`;
      case "raw": return /^\s*</.test(b.raw) ? b.raw : `<p>${esc(b.raw).replace(/\n/g, "<br>")}</p>`;
    }
    return "";
  }
  // flat items (each with its depth) → real nested lists
  function listHTML(items) {
    let h = ""; const open = [];
    for (const it of items) {
      const d = Math.min(it.ind || 0, open.length);
      while (open.length > d + 1) h += `</li></${open.pop()}>`;
      if (open.length === d + 1) {
        if (open[d] !== it.list) h += `</li></${open.pop()}>`;
        else h += "</li>";
      }
      if (open.length === d) { h += `<${it.list}${it.list === "ol" && (it.num || 1) !== 1 ? ` start="${it.num}"` : ""}>`; open.push(it.list); }
      h += `<li>${inline(it.text, { media: mediaSrc })}`;
    }
    while (open.length) h += `</li></${open.pop()}>`;
    return h;
  }
  function ownHTML(blocks) {
    let h = "", run = [];
    const flush = () => { if (run.length) { h += listHTML(run); run = []; } };
    for (const b of blocks) { if (b.type === "li") { run.push(b); continue; } flush(); h += blockHTML(b); }
    flush();
    return h;
  }
  function renderMD(s, ctx = {}, blocks = null) {
    if (window.marked?.parse && !ctx.own) return window.marked.parse(fixMedia(s), { gfm: true, breaks: false });
    return ownHTML(blocks || parse(s).blocks);
  }
  function md(text, ctx = {}) {
    const doc = parse(text);
    const out = []; let run = [];
    const flush = () => { if (!run.length) return; out.push(renderMD(run.map((b, i) => (i ? b.sep : "") + b.src).join(""), ctx, run)); run = []; };
    for (const b of doc.blocks) {
      if (b.type === "yarn" && KINDS[b.kind]) { flush(); out.push(renderYarn(b, ctx)); }
      else run.push(b);
    }
    flush();
    return out.join("\n");
  }

  /* ---------- what a reader sees ---------- */
  function text(src) {
    return parse(src).blocks.map((b) => {
      if (b.type === "p" || b.type === "h" || b.type === "li" || b.type === "quote") return inlineText(b.text);
      if (b.type === "code") return b.code;
      if (b.type === "yarn") return KINDS[b.kind] ? KINDS[b.kind].text(yarnData(b)) : inlineText(b.body);
      if (b.type === "raw") return inlineText(b.raw.replace(/<!--[\s\S]*?-->/g, " ").replace(/<[^>]+>/g, " ").replace(/^[ \t]*(?:[#>|]+|[-*+]|\d+[.)])[ \t]*/gm, "").replace(/\|/g, " ").replace(/^[\s:|-]+$/gm, ""));
      return "";
    }).join("\n");
  }
  const words = (src) => (text(src).match(/[\p{L}\p{N}][\p{L}\p{N}\p{M}'’._@/+-]*/gu) || []).length;

  /* ---------- the site: a music block plays through the kit player ---------- */
  document.addEventListener("click", (e) => {
    const b = e.target.closest?.("[data-ymd-track], [data-ymd-all]");
    if (!b || !window.YarnPlayer || b.closest("[inert], .st-prevbox, .st-bk")) return;
    const box = b.closest("[data-ymd-tracks]"); if (!box) return;
    let q = []; try { q = JSON.parse(box.dataset.ymdTracks); } catch (_) {}
    if (!q.length) return;
    const i = b.hasAttribute("data-ymd-all") ? 0 : +b.dataset.ymdTrack;
    window.YarnPlayer.play(q[i], q);
  });

  Y.md = Object.assign(md, { parse, serialize, block, inline, inlineText, fromDOM, escText, text, words, KINDS, yarn, yarnData, renderYarn, render: renderMD, about, publicOf, attrs: parseAttrs, own: (s) => ownHTML(parse(s).blocks) });
})();
