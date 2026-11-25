// Overflow / overlap check across many window widths (the owner's windows aren't 1440 / 1024 / 390).
// For every card-like box (.ycard, .ypost, .yfolder, .ychip rows, .ydetail panels …):
//   1. a visible descendant sticks out past the box's edge by more than 2px (text, pills, buttons, media)
//   2. two sibling cards in the same list/grid overlap each other by more than 2px
//   3. the page scrolls sideways (document wider than the window)
// usage: node _tools/overflow.mjs [--widths 1280,1366] [--only thoughts] [--params theme=dark]   (run from anywhere)
//   i8 · DK: --params adds query params to every page (the dark pass: --params theme=dark)
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { chromium } = require("/Users/blaqat/dev/playground/ripple-calc/node_modules/playwright-core");
const exe = process.env.HOME + "/Library/Caches/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-mac-arm64/chrome-headless-shell";
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const R = new URL("../", import.meta.url).href;
const WIDTHS = arg("--widths", "1680,1536,1440,1366,1280,1180,1100,1024,960,900,820,768,700,600,480,430,390,360").split(",").map(Number);
const ONLY = arg("--only", "");
const PARAMS = arg("--params", "");
const PAGES = [
  "home/index.html?skip", "projects/index.html", "projects/index.html?view=grid", "projects/index.html?p=sonata", "projects/item.html?p=sonata",
  "music/index.html", "music/index.html?view=grid", "music/item.html", "music/index.html?player=panel&demo=1",
  "thoughts/stitched.html", "thoughts/stitched.html?view=collection&c=tools", "thoughts/stitched.html?view=article&id=a1",
  "thoughts/stitched.html?view=article&project=bank-simulation", "thoughts/tier.html?id=tl1", "studio/index.html", "index.html", "review.html",
].filter((u) => u.includes(ONLY));
const b = await chromium.launch({ executablePath: exe, args: ["--allow-file-access-from-files"] });
let total = 0;
for (const u of PAGES) {
  for (const w of WIDTHS) {
    const phone = w < 500;
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1, isMobile: phone, hasTouch: phone });
    const p = await ctx.newPage();
    const r = await p.goto(R + u + (PARAMS ? (u.includes("?") ? "&" : "?") + PARAMS : ""), { waitUntil: "load", timeout: 20000 }).catch(() => null);
    if (!r) { await ctx.close(); continue; }
    await p.waitForTimeout(900);
    const found = await p.evaluate(() => {
      const out = [];
      const vis = (e) => { const cs = getComputedStyle(e); return cs.visibility !== "hidden" && cs.display !== "none" && +cs.opacity > 0.05; };
      const name = (e) => (e.className?.toString?.() || e.tagName).split(" ").filter((c) => !c.startsWith("is-")).slice(0, 2).join(".") + (e.textContent ? ` "${e.textContent.trim().replace(/\s+/g, " ").slice(0, 28)}"` : "");
      const CARDS = ".ycard, .ypost, .yfolder, .ydetail, .ypanel, .ytl__card, .pj-card, .mu-card, .yrow";
      const cards = [...document.querySelectorAll(CARDS)].filter((c) => !c.closest(".mockpanel, [aria-hidden='true'], [hidden], .yrv") && vis(c));
      for (const c of cards) {
        const cr = c.getBoundingClientRect(); if (cr.width < 40 || cr.height < 20) continue;
        const cs = getComputedStyle(c); if (cs.overflow !== "visible" && cs.overflow !== "") continue; // a clipping box can't spill
        for (const d of c.querySelectorAll("a, button, b, span, p, h1, h2, h3, img, video, .yabout, .ychip, .ybadge, .ytag, time")) {
          if (!vis(d) || d.closest(".ydetail__back, .yribbon, .yfolder__tabs, .ypost__hole, [class*='stub'], [class*='string'], .sr-only, .ytip, [role='tooltip']")) continue;
          const dr = d.getBoundingClientRect(); if (!dr.width || !dr.height) continue;
          const pos = getComputedStyle(d).position; if (pos === "absolute" || pos === "fixed") continue; // decorations hang off on purpose
          let inScroller = false; for (let n = d.parentElement; n && n !== c; n = n.parentElement) { const o = getComputedStyle(n).overflowX; if (o !== "visible") { inScroller = true; break; } }
          if (inScroller) continue; // inside a scroller / clip box: what sticks out is scrolled or clipped, not spilled
          // invisible padding (no background, border or outline) doesn't count: measure the content box then
          const ds = getComputedStyle(d), bare = ds.backgroundColor === "rgba(0, 0, 0, 0)" && ds.backgroundImage === "none" && !parseFloat(ds.borderLeftWidth) && ds.outlineStyle === "none";
          const L = bare ? dr.left + parseFloat(ds.paddingLeft) : dr.left, Rr = bare ? dr.right - parseFloat(ds.paddingRight) : dr.right;
          const over = Math.max(Rr - cr.right, cr.left - L);
          if (over > 2) { out.push(`spill ${Math.round(over)}px: ${name(d)} out of ${name(c)}`); break; }
        }
      }
      // sibling overlap inside the same parent list/grid
      const byParent = new Map();
      for (const c of cards) { const k = c.parentElement?.parentElement; if (!k) continue; (byParent.get(k) || byParent.set(k, []).get(k)).push(c); }
      for (const list of byParent.values()) for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
        const a = list[i].getBoundingClientRect(), z = list[j].getBoundingClientRect();
        if (list[i].contains(list[j]) || list[j].contains(list[i])) continue;
        const ox = Math.min(a.right, z.right) - Math.max(a.left, z.left), oy = Math.min(a.bottom, z.bottom) - Math.max(a.top, z.top);
        if (ox > 2 && oy > 2) out.push(`overlap ${Math.round(ox)}×${Math.round(oy)}: ${name(list[i])} ⟷ ${name(list[j])}`);
      }
      if (document.documentElement.scrollWidth > innerWidth + 1) out.push(`sideways scroll: page is ${document.documentElement.scrollWidth}px in a ${innerWidth}px window`);
      return [...new Set(out)].slice(0, 6);
    });
    if (found.length) { total += found.length; console.log(`${u} @${w}\n  ${found.join("\n  ")}`); }
    await ctx.close();
  }
}
await b.close();
console.log(total ? `${total} findings` : "clean");
