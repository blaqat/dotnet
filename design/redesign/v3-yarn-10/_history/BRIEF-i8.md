# Iteration 8 · brief for the dark-theme agent (DK)

You are building **DK** from `FEEDBACK-i8.md`: a mocked dark theme for the blaqat.net redesign mocks (round 3, "Yarn": a black / red / white textile look, static HTML/CSS/JS). The owner: *"i want to see a mocked dark theme im curious what it might look like"*. This is the last iteration; everything else is decided. Make the dark theme good enough that the owner can judge it seriously, not a token swap that half works.

## Where things are
- Folder: `/Users/blaqat/dev/projects/my-litterbox/design/redesign/v3-yarn-8/` (yours). `../v3-yarn-7/` is frozen: never edit it.
- Pages: `home/index.html`, `projects/index.html` + `projects/item.html`, `music/index.html` + `music/item.html`, `thoughts/stitched.html` (feed · `?view=article&id=a1` · `?view=collection&c=tools`), `thoughts/tier.html?id=tl1`, `studio/index.html` (every screen in its ⚙ › Screen), `review.html` (the round-up), `kit/components.html` (the component reference), `index.html` (the gallery).
- Kit:
  - `kit/yarn.css`: tokens in `:root` (lines ~40–140: `--ink*`, `--cotton*`, `--white`, `--red*`, section colours, the surface-aware `--y-fg / --y-fg-2 / --y-fg-3 / --y-chip / --y-line`, textures `--tex-knit / --tex-diamond / --tex-felt / --tex-twill / --tex-rope`). There's already a light-on-dark flip for ink surfaces (`.on-ink`, around lines 155 and 330); read it, it's your starting vocabulary.
  - `kit/yarn.js`: options `OPT` (~line 72 onward; `pick(params.get(...))`), the kit ⚙ groups (~line 3131).
  - `kit/player.js`: the music player. Its CSS is a string inside the JS, with its own `--p-*` tokens (~line 637).
  - Also: `kit/posts.js`, `kit/review.js` (the ⚙ panel + review pins), `kit/lightbox.js`, `kit/COMPONENTS.md`.
- Page CSS: `home/home.css`, `projects/projects.css`, `music/music.css`, `thoughts/stitched.css`, `thoughts/tier.css`, `studio/studio.css`.
- Read `kit/COMPONENTS.md` first. Then skim `FEEDBACK-i8.md` and `../v3-yarn-7/FEEDBACK-i7.md` (the owner's rules and recent fixes).

## What to build
1. **One kit option `theme`: `light` (default) | `dark` | `auto`** (follows `prefers-color-scheme`).
   - In `OPT`, set `html[data-theme]` early so there's no flash of light.
   - Add an **Open** kit ⚙ group visible on every page: `{ open: true, global: true, … }`. Look at how the other kit groups are declared.
   - The choice must survive navigation: kit choices are saved by the review tools and re-applied by the early block in `kit/yarn.js` (~line 36). Also add `theme` to the pages' `CARRY` lists (`projects/pj-core.js`, `music/music.js`, and any other page that rebuilds links) so plain links keep it.
   - Check the section transition (the cloth between pages) doesn't flash light.
2. **The dark look.** Keep the same yarn/textile language on a dark ground.
   - The sheet: a dark wool / felt, charcoal rather than pure black, with the knit texture redrawn light-on-dark.
   - Cards and patches: a step lighter than the sheet, with light dashed stitches.
   - Text: cotton, not pure white.
   - Red: stays the accent (the rope, toggles, play). Adjust only where contrast needs it.
   - Gold: WIP stays gold. Section frame colours stay recognisable.
   - Status discs: WIP gold · Complete (ink on light → cotton disc with an ink check on dark: see `.on-ink`) · Paused grey · Dropped red. All must read on dark.
   - Instrument swatches: the piano swatch is black, so give it a rim or edge so it doesn't vanish.
   - Code blocks (already dark): keep them distinct from the sheet.
   - Shadows: dark-on-dark shadows disappear, so use deeper shadows plus a faint top highlight. The "lift" must still read.
   - Every page and state, including:
     - nav and phone nav
     - search and Browse sheet
     - chips (toggles keep the red fill)
     - facts and tags
     - timelines (the red strand, rings, the ball)
     - opened items
     - top bars
     - the player (disc / bar / panel / long-press actions / queue)
     - toasts, hints, the lightbox
     - Thoughts' posts: sticky note, bookmark, hang tag, ranking board, playlist, images
     - the rankings page (tiers, drag)
     - Studio (forms, uploads, editors)
     - the ⚙ panel and review pins
     - review.html, components.html
3. **Docs:**
   - A "Theme" section in `kit/COMPONENTS.md`: tokens, what flips, how a page adds a dark rule.
   - A dark preview in `kit/components.html`: a toggle or a dark panel showing every part.
   - One or two round-up questions appended to `review/questions-i8.js` (copy the format of `../v3-yarn-7/review/questions-i7.js`; `kind: "ask"`, `rec`, `try` links). At least one should ask whether the real site ships the dark theme, and how: auto with the OS, a toggle, or no.

## Hard rules
- **Light must not change at all.**
  - Put every dark rule under `html[data-theme="dark"]` (and the `auto` + `prefers-color-scheme: dark` form).
  - If you swap a hard-coded colour for a token, the token's light value must equal the old literal exactly.
  - Prove it: before your first edit, screenshot the pages listed above at 1440×900 and 390×844 (light, `?reduced=1`, the ⚙ and pins hidden). Do it again at the end and compare the PNG bytes. Identical renders give identical bytes. Report any difference and why.
- **Contrast:** WCAG AA in dark (4.5:1 for text, 3:1 for icons, borders and focus). Write a probe that walks visible text and controls in dark on every page and reports failures; fix them all.
- **Owner rules (cumulative):**
  - Hover only lifts.
  - The selected rope sits flush on the element's edge.
  - Toggles get a red fill; single choices get the rope.
  - No floating footers.
  - Nothing clips a hover shadow.
  - Pressing an inner button doesn't press its card.
  - No hover flicker at card edges.
  - Floating chrome sits on its own top layer.
  - Phones never scroll sideways.
  - No filler text.
  - Grid alignment is measured, not eyeballed.
- **Edit with small, exact replacements.** Never rewrite a whole file with a script; the kit files are large and shared.
- Work only in `v3-yarn-8/` and `/Users/blaqat/dev/temp/r3i8-*` (put your probes in `/Users/blaqat/dev/temp/r3i8-dark/`). Don't commit. No new dependencies or webfonts.

## Tools
- Playwright: `require("/Users/blaqat/dev/playground/ripple-calc/node_modules/playwright-core")` with `executablePath: ~/Library/Caches/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-mac-arm64/chrome-headless-shell` and `args: ["--allow-file-access-from-files"]`. Pages open as `file:///Users/blaqat/dev/projects/my-litterbox/design/redesign/v3-yarn-8/…`. Hide `.mockpanel, .yrv-root` in screenshots. Phones: `{ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }`. Look at your crops at 1:1; screenshots are how you judge.
- **Before you open any browser, wait until `/Users/blaqat/dev/temp/r3i8-wip/baseline.log` contains `== done`** (the orchestrator's baseline run is still going; parallel browsers flake it). Read the code meanwhile.
- Regression: `zsh /Users/blaqat/dev/temp/r3i8-orch/regress.sh` runs every interaction suite **one at a time**. Never run two suites, or two runs, in parallel: they flake on timing. The orchestrator's baseline is in `/Users/blaqat/dev/temp/r3i8-wip/baseline.log`; your work must not add a failure.
- Overflow (18 widths): `node v3-yarn-8/_tools/overflow.mjs`.
- Error sweep: `node /Users/blaqat/dev/temp/r3i8-orch/sweep.mjs`.
- Regenerate the round-up's option list after changing ⚙ groups: `node v3-yarn-8/_tools/review-data.mjs`.

## Done means
- `?theme=dark` (and `auto` on a dark OS) looks finished on every page and state above, at desktop and phone. You've looked at every screenshot; fix what looks wrong.
- Light renders byte-identical to before.
- The contrast probe passes in dark.
- regress.sh adds no failures; overflow is clean in light and in dark (add a dark pass); the sweep has 0 errors in light and in dark.

## Your report back
- What you built and the dark palette (tokens).
- Where the screenshots are (light/dark pairs of every page, desktop + phone).
- The contrast results and the light byte-compare results.
- Anything you couldn't finish or are unsure of, said plainly.
