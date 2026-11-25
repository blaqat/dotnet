# Iteration 6 · shared brief for every agent

You are one of several agents working **at the same time** on the blaqat.net redesign mocks: round 3 "Yarn", black/red/white, textile, static HTML/CSS/JS with no build step.
- **Where to work:** only in `/Users/blaqat/dev/projects/my-litterbox/design/redesign/v3-yarn-6/`.
- **Read-only:** `../v3-yarn*/` (earlier iterations, frozen; read them for reference) and the repo's `src/` (the owner's original site).
- **No commits:** don't commit, and don't run git commands that change files (checkout, restore, stash, reset).

## Read first
1. `FEEDBACK-i6.md`: the spec. It has a Decided table, then a build list with IDs (B, X, L, O, P, S, M, MP, T, R) and an owner for each item. Your task names your items.
2. `_feedback/roundup-i5.md`: the owner's own review, word for word. Read the notes behind your items, not only the build reading.
3. `BRIEF-i5.md`: still valid for craft rules and owner rules. This file replaces its ownership table and checking section.
4. `kit/COMPONENTS.md` + `kit/components.html`: the kit. ⚙ groups take `open: true` (Open), `state: true` (Jump to), or no flag (decided: Earlier).
5. `LAYOUT-i5.md`: the meta grammar (facts · chips · links · utilities).

## Owner rules (don't regress)
**Hover and selection**
- Hover only lifts.
- The rope is for single choices; toggles get the red fill. A selected chip shows the red strike on hover.
- Nothing clips a hover shadow.
- **New (X4):** pressing an inner button inside a clickable card animates only that button, never the card.
- **New (X5):** a lifting card keeps its hover while the pointer is anywhere over its at-rest or lifted area, so it never flickers at the edge.

**Text and layout**
- No filler text, e.g. never "No notes".
- "Rankings", not "tier list".
- Grid alignment, measured.
- No floating footers; previous/next lives in the sticky top bar.

**Motion**
- Interruptible: a second action retargets from where things are on screen, and an outgoing item animates out *while* the incoming one animates in.
- Never animate blur/drop-shadow filters, `zoom` or layout every frame.
- Clean up listeners, observers, rAF loops and audio nodes.

**Floating chrome (B2)**
- It lives on its own top layer, unaffected by the page.
- The page never scrolls sideways on phones.

**⚙ options**
- Every choice the owner left open is an Open ⚙ option.
- Apply the Decided table: decided values become the default; the old value moves to Earlier (untagged) or is cut where the table says so.

## Working in parallel (important)
Other agents are editing `kit/yarn.js`, `kit/yarn.css`, `kit/player.js` and `kit/COMPONENTS.md` at the same time.
- **Shared kit files:** change them only with the Edit tool, in small anchored edits. Never Write, sed or regex-rewrite a whole kit file.
- **If an Edit fails** because the file changed, re-read that region and redo the edit.
- **Your CSS:** put it in a commented block, `/* == i6 · <agent> · … */`.
- **Outside your area:** keep any change minimal and list it in your report.
- **Others' errors:** don't "fix" errors that come from another agent's in-progress area; report them.

| Agent | Owns |
|---|---|
| **mobile** (chrome + kit interaction) | Floating chrome and its top layer (pill `.yspool*`, FAB/search/chips `fab()`/`listTools`/`Yarn.slot`, Browse sheet, toasts `Yarn.toast`, the phone parts of `kit/player.js` positioning); `<yarn-nav>`; the sound toggle + `kit/sound.js`; the kit hint popup (tooltips); `.ylift` press/hover rules; `.btn--red`; the ⚙ panel; items **B1, B2, X1–X8** |
| **layout** | The opened item + item pages: detail shell (`detail`, `wireDetail`, `detailPage`, `pager`, `.ydetail*`, `.ydpage*`, `Yarn.fact`, `detailOptions`), `projects/item.*`, the stage/detail rendering in `projects/pj-core.js`/`projects.js`, the release page/stage head in `music/` (small anchored edits); items **L1–L7** (L7: the shell side; it tells thoughts what to apply) |
| **projects** | `projects/` lists, timeline and grid cards, filters; kit `timeline()`, `yearRail()`, year groups, `flip()`; `.ybadge*` type/status; stack icons (`devicon`, `stackIcon`, `.ystk*`); items **O1, P1–P4, S2** |
| **music** | `music/` (except the release page/stage head layout); folder cards `.yfolder*`; `kit/player.js` (except phone positioning, which is mobile's); instrument badges; items **M1–M7, MP1, MP2**, O1 on Music cards |
| **thoughts** | `thoughts/`, `kit/posts.js`, `kit/thoughts-data.js`, `kit/data.js` write-up links, `strand()`; items **T1–T8, R1–R5**, L7 on Thoughts pages |

**In-card match style:** `.is-match` / `.ytag[aria-pressed="true"]` = `color: var(--y-fg); background: var(--y-chip)`.

## Checking (all of it, before you report)
- **Playwright:**
  - `playwright-core` is at `/Users/blaqat/dev/playground/ripple-calc/node_modules/playwright-core`.
  - Chromium is at `~/Library/Caches/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-mac-arm64/chrome-headless-shell`; launch it with `--allow-file-access-from-files` and load pages as `file://` URLs.
  - Widths: 1440×900, 1024, and 390×844 @2x with `isMobile` + `hasTouch`.
- **Screenshots:**
  - Hide `.mockpanel, .yrv-root` in every shot.
  - Scripts go in `/Users/blaqat/dev/temp/r3i6-<agent>/`; shots go in `_shots/i6-<agent>-*.png`.
  - **Look at your shots.**
- **Errors:** zero `pageerror` and zero console errors on your pages and on every option URL you add.
- **Every width:** `node _tools/overflow.mjs` (run it from the folder; `--only <substring>` narrows it). It checks 18 widths from 1680 to 360 for content spilling out of cards, overlapping cards, and sideways scroll. Nothing new from your work may show. The owner caught a bug at 1100px that 1440/1024/390 missed.
- **Phones:** if you touch anything floating, run `/Users/blaqat/dev/temp/r3i5-mobile/mobile.mjs`. Copy it to your temp folder and point it at v3-yarn-6. It probes every bottom-of-screen state at 390 and 360 and confirms every floating layer is on top.
- **Before you finish:** load every page at desktop and mobile and report any errors, saying whose area they're in. The pages are `home/index.html?skip`, `projects/index.html`, `projects/item.html?p=sonata`, `music/index.html`, `music/item.html`, `thoughts/stitched.html`, `thoughts/tier.html?id=tl1`, `studio/index.html` and `review.html`.

## Report back (≤ 400 words)
- Each item, by ID: done, partial or skipped.
- Every ⚙ option you added or decided: param, values, default, and an example URL.
- Changes outside your area.
- Judgement calls, and questions for the owner, written as round-up questions: the question, the options, and your recommendation.
