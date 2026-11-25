/* ============================================================
   Tier list · image candidates from text (MOCK) · copied into studio/ from thoughts/tierlist-images.js (i1)
   window.TierImages = { suggest, search, candidates, lookup, svg, KINDS }

   ┌──────────────────────────────────────────────────────────┐
   │ WHERE REAL IMAGE SEARCH PLUGS IN                          │
   │ search(query) is the only async seam. In production it    │
   │ would GET a Worker endpoint, e.g. /api/tier-images?q=arc, │
   │ which fans out to:                                        │
   │   • logos by domain (Clearbit-style / logo.dev / favicon) │
   │     using guessDomain(name) below                         │
   │   • an image search API (Brave Image Search, Bing, or     │
   │     Wikimedia Commons for a free option)                  │
   │ and copies the picked image into R2 (key = sha1(url)) so  │
   │ posts never hotlink. It resolves to the same Candidate    │
   │ shape, with { src } instead of the generated art.         │
   └──────────────────────────────────────────────────────────┘
   Here every candidate is drawn locally as inline SVG so the
   mock works offline: logo mark, embroidered patch, wordmark,
   photo-like gradient, screenshot-like window.
   ============================================================ */
(() => {
  // name | hint | domain | hue | glyph | saturation (optional)
  const RAW = `
Arc|browser|arc.net|352|arc
Arc Search|browser|arc.net|258|arc
Arcade|games|arcade.example|300|tri
Arch Linux|os|archlinux.org|205|tri
Archive.org|library|archive.org|30|letter|10
Zen|browser|zen-browser.app|222|rings
Helium|browser|helium.computer|196|orbit
Firefox|browser|firefox.com|20|swirl
Safari|browser|apple.com/safari|204|compass
Orion|browser|kagi.com/orion|268|stars
Vivaldi|browser|vivaldi.com|356|letter
Brave|browser|brave.com|14|shield
Chrome|browser|google.com/chrome|132|aperture
Edge|browser|microsoft.com/edge|186|wave
Opera|browser|opera.com|354|ring
Opera GX|browser|opera.com/gx|330|ring
Tor Browser|browser|torproject.org|282|rings
DuckDuckGo|browser|duckduckgo.com|12|letter
LibreWolf|browser|librewolf.net|214|swirl
Floorp|browser|floorp.app|222|wave
Ladybird|browser|ladybird.org|4|dot
SigmaOS|browser|sigmaos.com|240|letter
Min|browser|minbrowser.org|205|dot
Zed|editor|zed.dev|212|letter
VS Code|editor|code.visualstudio.com|206|tri
Neovim|editor|neovim.io|110|tri
Vim|editor|vim.org|122|letter
Emacs|editor|gnu.org/software/emacs|268|swirl
Sublime Text|editor|sublimetext.com|28|wave
Cursor|editor|cursor.com|0|tri|6
Helix|editor|helix-editor.com|268|hex
Xcode|editor|developer.apple.com/xcode|210|hex
Ghostty|terminal|ghostty.org|236|prompt
iTerm2|terminal|iterm2.com|128|prompt
WezTerm|terminal|wezterm.org|252|prompt
Kitty|terminal|sw.kovidgoyal.net/kitty|32|prompt
Alacritty|terminal|alacritty.org|18|prompt
Warp|terminal|warp.dev|190|bolt
Rust|language|rust-lang.org|18|hex
Go|language|go.dev|192|letter
TypeScript|language|typescriptlang.org|212|letter
Python|language|python.org|210|swirl
Swift|language|swift.org|14|wave
Zig|language|ziglang.org|34|bolt
Kotlin|language|kotlinlang.org|276|tri
Elixir|language|elixir-lang.org|272|dot
Svelte|framework|svelte.dev|12|swirl
SvelteKit|framework|svelte.dev/kit|12|swirl
Astro|framework|astro.build|268|tri
React|framework|react.dev|192|orbit
Vue|framework|vuejs.org|152|tri
Solid|framework|solidjs.com|214|hex
Figma|design|figma.com|14|dot
Notion|notes|notion.so|0|letter|6
Obsidian|notes|obsidian.md|262|hex
Raycast|tools|raycast.com|356|bolt
chezmoi|tools|chezmoi.io|160|letter
mise|tools|mise.jdx.dev|300|letter`;

  const CATALOG = RAW.trim().split("\n").map((l) => {
    const [name, hint, domain, hue, glyph, sat] = l.split("|");
    return { name, hint, domain, hue: +hue, glyph, sat: sat ? +sat : 58 };
  });

  const norm = (s) => String(s || "").trim().toLowerCase();
  function hash(s) {
    let h = 2166136261;
    for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
    return h >>> 0;
  }
  const slug = (s) => norm(s).replace(/[^a-z0-9]+/g, "") || "item";
  function guessDomain(name) {
    return slug(name) + ".com";
  }

  /** Known entity or a stable made-up one for any text. */
  function lookup(name) {
    const n = norm(name);
    const hit = CATALOG.find((c) => norm(c.name) === n);
    if (hit) return hit;
    const h = hash(n);
    return { name: String(name).trim(), hint: "", domain: guessDomain(name), hue: h % 360, glyph: "letter", sat: 46 };
  }

  /** Autocomplete from the local catalog. Typed text is always offered last when it isn't an exact hit. */
  function suggest(text, max = 5) {
    const q = norm(text);
    if (!q) return [];
    const scored = [];
    for (const c of CATALOG) {
      const n = norm(c.name);
      let s = -1;
      if (n === q) s = 0;
      else if (n.startsWith(q)) s = 1;
      else if (n.split(/[\s.]+/).some((w) => w.startsWith(q))) s = 2;
      else if (q.length > 2 && n.includes(q)) s = 3;
      if (s >= 0) scored.push([s, n.length, c]);
    }
    scored.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const out = scored.slice(0, max).map(([, , c]) => ({ name: c.name, hint: c.hint }));
    if (!out.some((o) => norm(o.name) === q)) {
      const typed = String(text).trim();
      if (out.length >= max) out.pop();
      out.push({ name: typed, hint: "as typed", typed: true });
    }
    return out;
  }

  const KINDS = [
    { kind: "logo", label: "Logo", src: (e) => `logo · ${e.domain.split("/")[0]}` },
    { kind: "patch", label: "Patch", src: () => "badge" },
    { kind: "wordmark", label: "Wordmark", src: () => "type" },
    { kind: "photo", label: "Photo", src: () => "image search" },
    { kind: "screen", label: "Screenshot", src: (e) => e.domain.split("/")[0] },
  ];

  /** Synchronous candidate list (what search() resolves to). */
  function candidates(name) {
    const e = lookup(name);
    return KINDS.map((k) => ({
      kind: k.kind,
      label: k.label,
      source: k.src(e),
      hue: e.hue,
      sat: e.sat,
      glyph: e.glyph,
      domain: e.domain,
    }));
  }

  /** The async seam. Swap the body for a fetch() to a real image search. */
  function search(query, { instant = false } = {}) {
    const result = candidates(query);
    if (instant) return Promise.resolve(result);
    // pretend network: ~180–320 ms
    const ms = 180 + (hash(norm(query)) % 140);
    return new Promise((r) => setTimeout(() => r(result), ms));
  }

  // ---------------------------------------------------------- art
  let uid = 0;
  const hsl = (h, s, l) => `hsl(${((h % 360) + 360) % 360} ${s}% ${l}%)`;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const FONT = `font-family="Nunito, ui-rounded, system-ui, sans-serif" font-weight="900"`;

  function monogram(name, n = 2) {
    const words = String(name).trim().split(/[\s.\-_]+/).filter(Boolean);
    if (words.length > 1) return words.slice(0, n).map((w) => w[0]).join("").toUpperCase();
    return (words[0] || "?")[0].toUpperCase();
  }

  function glyph(g, name, ink) {
    const W = `stroke="#fff" fill="none" stroke-linecap="round" stroke-linejoin="round"`;
    switch (g) {
      case "arc":
        return `<path d="M25 64 A23 23 0 0 1 71 64" ${W} stroke-width="11"/><circle cx="48" cy="64" r="6" fill="#fff"/>`;
      case "rings":
        return `<circle cx="48" cy="48" r="24" ${W} stroke-width="5"/><circle cx="48" cy="48" r="13" ${W} stroke-width="5"/><circle cx="48" cy="48" r="4.5" fill="#fff"/>`;
      case "orbit":
        return `<ellipse cx="48" cy="48" rx="29" ry="11" ${W} stroke-width="4.5" transform="rotate(-32 48 48)"/><ellipse cx="48" cy="48" rx="29" ry="11" ${W} stroke-width="4.5" transform="rotate(32 48 48)"/><circle cx="48" cy="48" r="7" fill="#fff"/>`;
      case "swirl":
        return `<path d="M67 40 A21 21 0 1 0 66 58" ${W} stroke-width="9"/><path d="M66 58 C58 50 50 52 46 46" ${W} stroke-width="9"/>`;
      case "compass":
        return `<circle cx="48" cy="48" r="26" ${W} stroke-width="4"/><path d="M48 25 L54.5 48 L48 71 L41.5 48 Z" fill="#fff" transform="rotate(42 48 48)"/><circle cx="48" cy="48" r="3" fill="${ink}"/>`;
      case "stars":
        return `<path d="M56 24 A25 25 0 1 0 72 62 A19 19 0 1 1 56 24 Z" fill="#fff"/><circle cx="67" cy="30" r="2.6" fill="#fff"/><circle cx="74" cy="42" r="1.8" fill="#fff"/>`;
      case "shield":
        return `<path d="M48 21 L71 29 V49 C71 62 61 71 48 76 C35 71 25 62 25 49 V29 Z" fill="#fff"/><text x="48" y="58" text-anchor="middle" ${FONT} font-size="26" fill="${ink}">${esc(monogram(name, 1))}</text>`;
      case "aperture":
        return `<circle cx="48" cy="48" r="26" fill="#fff"/><g stroke="${ink}" stroke-width="4" stroke-linecap="round"><path d="M48 37 L48 22"/><path d="M57.5 53.5 L70.5 61"/><path d="M38.5 53.5 L25.5 61"/></g><circle cx="48" cy="48" r="11" fill="${ink}" stroke="#fff" stroke-width="4"/>`;
      case "wave":
        return `<path d="M22 56 C32 36 44 36 50 50 S68 64 74 42" ${W} stroke-width="9"/>`;
      case "ring":
        return `<ellipse cx="48" cy="48" rx="17" ry="24" ${W} stroke-width="10"/>`;
      case "tri":
        return `<path d="M48 23 L73 69 H23 Z" ${W} stroke-width="7"/><circle cx="48" cy="54" r="5" fill="#fff"/>`;
      case "hex":
        return `<path d="M48 22 L70 35 V61 L48 74 L26 61 V35 Z" ${W} stroke-width="7"/><path d="M48 40 L57 45 V55 L48 60 L39 55 V45 Z" fill="#fff"/>`;
      case "dot":
        return `<circle cx="48" cy="48" r="17" fill="#fff"/><circle cx="48" cy="48" r="27" ${W} stroke-width="3" stroke-dasharray="3 5"/>`;
      case "bolt":
        return `<path d="M53 20 L30 54 H46 L42 76 L66 41 H50 Z" fill="#fff"/>`;
      case "prompt":
        return `<path d="M27 36 L43 48 L27 60" ${W} stroke-width="7"/><path d="M50 62 H69" ${W} stroke-width="7"/>`;
      default: {
        const m = monogram(name, 2);
        return `<text x="48" y="${m.length > 1 ? 61 : 64}" text-anchor="middle" ${FONT} font-size="${m.length > 1 ? 34 : 46}" letter-spacing="-1.5" fill="#fff">${esc(m)}</text>`;
      }
    }
  }

  /** Inline SVG for an image descriptor ({kind, hue, sat, glyph, domain}). Decorative: the item name is real text. */
  function svg(img, name) {
    if (!img) return "";
    const id = "ti" + ++uid;
    const h = img.hue ?? 0;
    const s = img.sat ?? 58;
    const c1 = hsl(h, s + 8, 63);
    const c2 = hsl(h, s, 47);
    const c3 = hsl(h + 10, s, 29);
    const soft = hsl(h, Math.min(s, 40), 93);
    const open = `<svg viewBox="0 0 96 96" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid slice">`;
    switch (img.kind) {
      case "patch":
        return `${open}<defs><pattern id="${id}t" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="1.4" height="4" fill="#fff" opacity=".13"/></pattern></defs>
          <rect width="96" height="96" fill="${soft}"/>
          <circle cx="48" cy="49" r="40" fill="${c3}" opacity=".25"/>
          <circle cx="48" cy="47" r="40" fill="${c2}"/><circle cx="48" cy="47" r="40" fill="url(#${id}t)"/>
          <circle cx="48" cy="47" r="33.5" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="2.2" stroke-dasharray="4.2 3.2" stroke-linecap="round"/>
          <text x="48" y="${monogram(name).length > 1 ? 58 : 61}" text-anchor="middle" ${FONT} font-size="${monogram(name).length > 1 ? 28 : 36}" letter-spacing="-1" fill="#fff">${esc(monogram(name))}</text></svg>`;
      case "wordmark": {
        const word = String(name).trim().toLowerCase();
        const words = word.split(/\s+/);
        const lines = word.length > 8 && words.length > 1 ? [words[0], words.slice(1).join(" ")] : [word];
        const longest = Math.max(...lines.map((l) => l.length));
        const fs = Math.max(12, Math.min(34, 150 / Math.max(longest, 1)));
        const y0 = lines.length > 1 ? 47 - fs * 0.15 : 54;
        const tspans = lines.map((l, i) => `<tspan x="48" y="${y0 + i * fs * 0.95}">${esc(l)}</tspan>`).join("");
        return `${open}<rect width="96" height="96" fill="${soft}"/>
          <text text-anchor="middle" ${FONT} font-size="${fs.toFixed(1)}" letter-spacing="-1" fill="${c3}">${tspans}</text>
          <path d="M24 ${lines.length > 1 ? 76 : 66} Q48 ${lines.length > 1 ? 82 : 72} 72 ${lines.length > 1 ? 74 : 64}" stroke="${c2}" stroke-width="3.5" fill="none" stroke-linecap="round"/></svg>`;
      }
      case "photo":
        return `${open}<defs><linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${hsl(h + 30, s, 82)}"/><stop offset=".62" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>
          <filter id="${id}b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5"/></filter></defs>
          <rect width="96" height="96" fill="url(#${id}s)"/>
          <g filter="url(#${id}b)"><circle cx="68" cy="28" r="15" fill="#fff6e6" opacity=".9"/><circle cx="18" cy="36" r="13" fill="${hsl(h - 30, s, 75)}" opacity=".8"/></g>
          <path d="M0 68 L20 50 L34 60 L56 40 L96 70 V96 H0 Z" fill="${c3}" opacity=".7"/>
          <path d="M0 80 Q26 68 50 78 T96 76 V96 H0 Z" fill="${c3}"/>
          <rect width="96" height="96" fill="none" stroke="#000" stroke-opacity=".06"/></svg>`;
      case "screen": {
        const dom = esc(String(img.domain || "").split("/")[0]);
        return `${open}<defs><linearGradient id="${id}h" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c3}"/></linearGradient></defs>
          <rect width="96" height="96" fill="#e9e5df"/>
          <rect x="7" y="11" width="82" height="76" rx="7" fill="#fff"/>
          <path d="M7 18 a7 7 0 0 1 7 -7 h68 a7 7 0 0 1 7 7 v5 h-82 z" fill="#f1eee9"/>
          <circle cx="14" cy="17" r="2" fill="#d62f38"/><circle cx="20" cy="17" r="2" fill="#c9c1b6"/><circle cx="26" cy="17" r="2" fill="#c9c1b6"/>
          <rect x="33" y="13.5" width="50" height="7" rx="3.5" fill="#fff"/>
          <text x="37" y="18.6" font-family="JetBrains Mono, ui-monospace, monospace" font-size="4.6" fill="#6e6868">${dom}</text>
          <rect x="13" y="28" width="70" height="27" rx="4" fill="url(#${id}h)"/>
          <text x="20" y="45" ${FONT} font-size="10" fill="#fff">${esc(String(name).slice(0, 12))}</text>
          <rect x="13" y="61" width="38" height="4" rx="2" fill="#1f1e1e" opacity=".22"/>
          <rect x="13" y="69" width="30" height="4" rx="2" fill="#1f1e1e" opacity=".12"/>
          <rect x="13" y="77" width="34" height="4" rx="2" fill="#1f1e1e" opacity=".12"/>
          <rect x="57" y="61" width="26" height="20" rx="3" fill="${c1}" opacity=".35"/></svg>`;
      }
      case "logo":
      default:
        return `${open}<defs><linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset=".55" stop-color="${c2}"/><stop offset="1" stop-color="${c3}"/></linearGradient>
          <radialGradient id="${id}r" cx=".3" cy=".2" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
          <rect width="96" height="96" fill="url(#${id}g)"/><rect width="96" height="96" fill="url(#${id}r)"/>
          ${glyph(img.glyph, name, c3)}</svg>`;
    }
  }

  /** Default image for quick adds (paste, Enter): the logo candidate. */
  function best(name) {
    return candidates(name)[0];
  }

  window.TierImages = { suggest, search, candidates, lookup, svg, best, slug, guessDomain, KINDS };
})();
