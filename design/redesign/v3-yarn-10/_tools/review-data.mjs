#!/usr/bin/env node
/* Builds review/options-i10.js for review.html (i5 · review tools · R3): every ⚙ group on every reviewed page.
   It opens each page at desktop and phone width with a fresh profile (no saved choices), opens the ⚙ panel (so each
   kit group's `when` is checked against the built page) and reads panel._groups (kit/yarn.js renderPanel).

   usage:  node _tools/review-data.mjs
   env:    PW_CORE=<path to playwright-core>  CHROME=<chromium or headless-shell binary>  (defaults: the mock setup) */
import { createRequire } from "module";
import { writeFileSync, existsSync, readdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath, pathToFileURL } from "url";

const HERE = join(dirname(fileURLToPath(import.meta.url)), "..");
const PW = process.env.PW_CORE || "/Users/blaqat/dev/playground/ripple-calc/node_modules/playwright-core";
const require = createRequire(import.meta.url);
const { chromium } = require(PW);
const cache = join(process.env.HOME, "Library/Caches/ms-playwright");
const shell = existsSync(cache) && readdirSync(cache).filter((d) => d.startsWith("chromium_headless_shell-")).sort().pop();
const CHROME = process.env.CHROME || (shell && join(cache, shell, "chrome-headless-shell-mac-arm64/chrome-headless-shell"));

// the pages the owner reviews (path?base state, name). The first page a group appears on is its "try it" base.
// i10: the site is back (i9 was Studio only), so both.
const PAGES = [
  ["home/index.html?skip", "Home"],
  ["projects/index.html", "Projects"],
  ["projects/index.html?view=grid", "Projects"], // grid-only kit groups (gridyears) only show here; same name (P2-10)
  ["projects/item.html?p=sonata", "Project page"],
  ["music/index.html", "Music"],
  ["music/index.html?view=grid", "Music"], // i10: the grid-only groups (i10 r2: cardart went, decided)
  ["music/item.html", "Release page"],
  ["thoughts/stitched.html", "Thoughts"],
  ["thoughts/tier.html?id=tl1", "Ranking page"],
  ["studio/index.html", "Studio"],
  ["studio/index.html?screen=compose&type=article&id=a3", "Studio"],
  ["studio/index.html?screen=compose&type=embed&id=e1", "Studio"],
  ["studio/index.html?screen=music&id=vgm-class-final-project&track=1", "Studio"],
  ["studio/index.html?screen=compose&type=playlist&id=pl-2025", "Studio"], // i9 · links: ?exttrack shows where a playlist post does
  ["studio/index.html?screen=list&section=music", "Studio"], // i9 · music: ?mcomplete shows where the Music order does
];
// a better place to try some options than the first page they appear on (page params → their screen)
const TRY = {
  dlayout: "projects/index.html?p=sonata",
  stagealign: "projects/index.html?p=sonata",
  dnav: "projects/item.html?p=sonata",
  uisnd: "music/index.html?demo=1",
  disclong: "music/index.html?demo=1",
  pnotes: "music/index.html?player=panel&demo=1",
  toast: "music/index.html",
  mactive: "projects/index.html?fab=open&stack=Rust",
  gridyears: "projects/index.html?view=grid&q=react",
  trackmatch: "music/index.html?q=alphabet%20shadow",
  pwip: "music/index.html?demo=revealed_libterrene&player=panel",
  pwipc: "music/index.html?demo=revealed_libterrene&player=bar&pwipc=gold",
  mart: "music/index.html?mart=badge",
  phrow: "projects/index.html?phrow=card",
  redbtn: "projects/item.html?p=sonata",
  wumark: "thoughts/tier.html?id=tl1",
  apager: "thoughts/stitched.html?view=article&id=a2",
  // i10 · the design pass (DESIGN-i10.md §8): the screen that shows each one best
  look: "music/index.html?view=grid&q=shadow",
  stitch: "music/index.html?view=grid",
  font: "thoughts/stitched.html?view=article&id=a1",
  shuffle: "music/index.html?view=grid&q=shadow",
};

const browser = await chromium.launch({ executablePath: CHROME, args: ["--allow-file-access-from-files"] });
const groups = new Map(); // id → group
const pages = [];
const problems = [];
const SIZES = { desktop: { viewport: { width: 1440, height: 900 } }, phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } };
for (const [href, name] of PAGES) {
  for (const [size, opts] of Object.entries(SIZES)) {
    const ctx = await browser.newContext(opts);
    const page = await ctx.newPage();
    page.on("pageerror", (e) => problems.push(`${href} @${size}: ${e.message}`));
    await page.goto(pathToFileURL(join(HERE, href.split("?")[0])).href + (href.includes("?") ? "?" + href.split("?")[1] : ""), { waitUntil: "load" });
    await page.waitForTimeout(900);
    const got = await page.evaluate(async () => {
      const p = document.querySelector(".mockpanel");
      if (!p) return null;
      p.open = true;
      await new Promise((r) => setTimeout(r, 250));
      const G = p._groups || { page: [], kit: [] };
      const R = window.YarnReview;
      const pick = (g, scope) => ({ param: g.param, label: g.label, open: !!g.open, state: !!g.state, default: g.default ?? "", options: g.options.map(([v, l]) => [String(v), String(l)]), scope });
      return {
        title: p.querySelector(":scope > summary")?.textContent.trim() || "",
        section: R?.SECTION || "",
        path: R?.PAGE || "",
        groups: [...G.page.map((g) => pick(g, R ? R.scopeOf(g, G.kit) : "page")), ...G.kit.map((g) => pick(g, "kit"))],
      };
    });
    await ctx.close();
    if (!got) { problems.push(`${href} @${size}: no ⚙ panel`); continue; }
    if (size === "desktop") pages.push({ href, name, path: got.path, section: got.section, panel: got.title });
    for (const g of got.groups) {
      if (g.state) continue; // Jump to: demo states, never decisions
      const id = `${g.scope}:${g.param}`;
      const prev = groups.get(id);
      if (prev) {
        if (!prev.pages.includes(got.path)) prev.pages.push(got.path);
        if (!prev.widths.includes(size)) prev.widths.push(size);
        prev.open ||= g.open;
        continue;
      }
      groups.set(id, { id, scope: g.scope, param: g.param, label: g.label, open: g.open, default: g.default, options: g.options,
        pages: [got.path], widths: [size], try: TRY[g.param] || href });
    }
  }
}
await browser.close();

const out = {
  generated: new Date().toISOString(),
  pages,
  groups: [...groups.values()],
};
const file = join(HERE, "review/options-i10.js");
writeFileSync(file, `/* GENERATED by _tools/review-data.mjs (${out.generated}). Don't edit by hand: rerun \`node _tools/review-data.mjs\`.
   Every non-state ⚙ group on every reviewed page (desktop + phone), for review.html's Decisions.
   id = scope:param · scope = "kit" (applies on every page) or the section folder · open = still an open decision ·
   pages = where it shows · widths = desktop / phone (a kit group's \`when\` can hide it) · try = the page to try it on */
window.YARN_OPTIONS = ${JSON.stringify(out, null, 1)};
`);
const open = out.groups.filter((g) => g.open);
console.log(`wrote review/options-i10.js: ${out.groups.length} groups (${open.length} open) from ${pages.length} pages`);
console.log("open:", open.map((g) => g.id).join(" "));
if (problems.length) { console.log("problems:\n  " + problems.join("\n  ")); process.exitCode = 1; }
