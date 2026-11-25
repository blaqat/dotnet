# Iteration 9 · brief for the Studio agents

You're one of four agents building iteration 9 of the blaqat.net redesign mocks (round 3, "Yarn": a black / red / white textile look; static HTML/CSS/JS, opened as `file://`). **i9 is Studio only**: the owner's admin app for publishing to their site. The site itself is decided and frozen.

Read first:
1. `FEEDBACK-i9.md`: the spec, your IDs, and the owner's words.
2. `_feedback/roundup-i8.md`: the owner's 21 pins, verbatim, with the exact element and URL of each.
3. `kit/COMPONENTS.md`: the kit's parts. Use them; don't hand-roll a look the kit already has.
4. The Studio code: `studio/` (core, screens, editors, tiers, data, css).

## Where things are
- **Folder** (yours to edit): `/Users/blaqat/dev/projects/my-litterbox/design/redesign/v3-yarn-9/`. Never edit `../v3-yarn-8/` or older: they're frozen.
- **Studio**: `studio/index.html`. Every screen opens by URL: `?view=<preset>` (the list is in `studio/studio.js` PRESETS) or `?screen=…&section=…&id=…`. `?reset` clears Studio's saved data (localStorage `blaqat.studio.i2`).
  - `studio-core.js`: state, router, sheets, toasts, fields (`S.f.*`), markdown, publish flow.
  - `studio-screens.js`: sign-in, dashboard, lists, history, media.
  - `studio-editors.js`: the project / music / home / compose editors and their live previews.
  - `studio-tiers.js` + `tier-*.js`: the ranking editor.
  - `studio-data.js`: the seed, built from `kit/data.js` (the site's real music + projects) and `kit/thoughts-data.js`.
- **Kit**: `kit/yarn.css`, `kit/yarn.js` (options, parts, `Yarn.*`), `kit/posts.js` (`Y.post`: the Thoughts post cards), `kit/swatch.js` (instrument swatches), `kit/player.js`, `kit/components.html` (the reference page), `kit/COMPONENTS.md`.
- **Links to the site** go to the frozen i8 folder through `Y.siteURL("music/index.html")`. Never link to `../music/` and the like: those folders don't exist in i9.

## Who owns what (four agents work at the same time)
| Agent | IDs | Owns |
|---|---|---|
| **blocks** | S3 | the markdown editor everywhere it's used (`E.md` / `E.wireMd` and their callers), a new `studio/studio-blocks.js` (add it to `studio/index.html`), and the kit renderer for yarn blocks (a new kit file or a section in `kit/posts.js` / `kit/yarn.js`, your call) |
| **links** | S2, S5 | the link recognizer in the kit (`LINK_ICONS` / `BRAND_HOSTS` / `brandOf` / `dlink` / `linkIcon` in `kit/yarn.js`), one Studio links field, the `links` data shape, the playlist editor, and the playlist + images post's links in `kit/posts.js` |
| **music** | S6–S10 | the music editor (`S.screens.music`: song, collection, the track tabs), the Music list's order (`studio-screens.js`), mixed instruments in the kit (swatch / facts / disc), and one shared order function in the kit |
| **polish** | S1, S4, S11–S16 | the sheet / handler bug, publish checks + publishing look (`studio-core.js`), the project's Stack field, `E.colors` (stub swatches), the images post's media layout in `kit/posts.js` (`embed`), and the ranking editor (`studio-tiers.js`, `tier-*.js`) |

**Where your work meets someone else's:**
- **links ↔ music.** The music editor builds each song's and collection's links with `linkFields(x, base)` in `studio-editors.js`.
  - links replaces what `linkFields` renders: it becomes the new links list. The name and signature stay.
  - music calls `linkFields(x, …)` for every song, every collection track, and the collection itself. It never builds links any other way.
  - The data shape is links': today `links: { soundcloud: "…" }`. Migrate old shapes on load, in one place.
- **links ↔ polish.** Both touch the images post (`embed(p, c)` in `kit/posts.js` and its compose form).
  - links owns the post's links (the field and how they show).
  - polish owns the media grid / carousel.
  - Keep your edits to your part of the function.
- **blocks ↔ links.** A yarn "link" block uses the kit's link part (`Y.dlink` / `linkIcon`, the owner's "my link component"). If links changes that part's API, it keeps the old calls working.
- **Shared files** (`studio.css`, `kit/yarn.css`, `kit/yarn.js`, `studio-editors.js`, `studio-data.js`, `kit/posts.js`):
  - Make small, exact Edit replacements.
  - Re-read before you edit, because another agent may have just changed the file.
  - Never rewrite a whole file, run a formatter, or reorder code you don't own.
  - Put new CSS in a block headed `/* i9 · <agent> · … */`.
- If you need something another agent owns, write it as a small, clearly marked hook and say so in your report. Don't rebuild their part.

## The owner's rules (cumulative; all still apply)
- **Hover only lifts.** The selected rope sits flush on the element's own edge, with the element's radius.
- **Toggles** (multi-select) get the red fill; **single choices** get the rope.
- **Grid alignment is measured:** in repeated rows, assert column x positions in tests.
- Motion is interruptible.
- No filler text: no labels that only restate the obvious, no "Now playing" lines.
- Nothing clips a hover shadow.
- Pressing an inner button doesn't press its card.
- No hover flicker at card edges.
- Floating chrome sits on its own top layer (`Yarn.layer()`).
- **Phones never scroll sideways.**
- **Similar elements are one kit part.** A Studio field that looks like a site part uses the kit part.
- When an owner note names a concept (a link, a status, a colour), apply it everywhere that concept shows in Studio, not only where it was pinned.
- `[popover]` + a kit class that sets `display` is never hidden when closed. Add `.x:not(:popover-open){display:none}`.
- `.ytip` must stay a single element. A page-placed tip uses `.ytip-own`.
- If something is a genuine open choice (the owner said "idk", or two good answers exist):
  - Build the recommended one as the default.
  - Offer the others as a ⚙ option marked `open: true`: Studio's groups are in `studio/studio.js` (`Y.mockPanel`), kit groups in `kit/yarn.js` `KIT_GROUPS`.
  - Add a question to `review/questions-i9.js` (`kind: "ask"`, `rec`, `try` links relative to `v3-yarn-9/`; see `../v3-yarn-8/review/questions-i8.js` for the format).
  - Don't add options for things the owner decided.

## Testing (owner's lesson from i6/i7: bugs passed every automated check)
- **Put your tests in `/Users/blaqat/dev/temp/r3i9-<agent>/`.**
  - Playwright is `require("/Users/blaqat/dev/playground/ripple-calc/node_modules/playwright-core")`, with `executablePath: ~/Library/Caches/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-mac-arm64/chrome-headless-shell` and `args: ["--allow-file-access-from-files"]`.
  - `~/dev/temp/r3i9-studio/lib.mjs` has helpers. Its `open()` clears Studio's storage once per context.
  - Hide `.mockpanel, .yrv-root` in screenshots.
- **Write interaction tests for everything you add or fix.** Cover:
  - mouse, keyboard (Tab / Enter / Space / Esc / arrows), and touch: `{ viewport: {width:390,height:844}, hasTouch:true, isMobile:true }`. Tap the bodies of cards, not just their titles.
  - every way to close, and reopening.
  - state surviving a reload where Studio persists it.
  - **in-app navigation before acting.** S1 only shows after moving between screens, so a test that loads a URL and clicks once misses it.
- **Look at your crops at 1:1**, at 1440, 1100 and 390 wide. Screenshots are how you judge.
- Add your suites to `/Users/blaqat/dev/temp/r3i9-orch/regress.sh`, under "i9 agents' suites", as `run r3i9-<agent> <file>`. The orchestrator runs it at the end, one suite at a time.
- **While you work, run only your own suites.** Other agents' browsers are running too. Cap each run with a timeout (no `timeout` command on this Mac: `node x.mjs & pid=$!; (sleep 120; kill $pid) & wait $pid`). If something flakes, re-run it alone before calling it a failure.
- **Before you report**, run all three:
  - `node v3-yarn-9/_tools/overflow.mjs --only <your screens>` (18 widths)
  - `node /Users/blaqat/dev/temp/r3i9-orch/sweep.mjs <filter>` (0 errors; it also catches broken local file links)
  - the existing Studio suites `node ~/dev/temp/r3i9-studio/flows.mjs` and `mobile.mjs`. They pass today (baseline: `~/dev/temp/r3i9-wip/baseline.log`). Your work must not break them. If a test asserted the old behaviour you were asked to change, update the test and say so.
- **Wait until `/Users/blaqat/dev/temp/r3i9-wip/baseline.log` contains `== done` before you open any browser.** Read code meanwhile.
- Don't commit. No new npm dependencies.
  - CDN scripts are allowed, pinned to an exact version, the way `marked@12.0.2` is loaded.
  - A network lookup (e.g. logos) must have an offline fallback that still looks finished.

## Docs (each agent)
- Add your section under **Done** in `FEEDBACK-i9.md`: what you built, any ⚙ options or questions you added, and your test files.
- Add a line under **Carry to the site** for every kit change the real site needs.
- Document new kit parts in `kit/COMPONENTS.md` and show them in `kit/components.html`.
- After changing ⚙ groups, run `node v3-yarn-9/_tools/review-data.mjs`.

## Your report back (short)
- What you built, per ID.
- Files touched.
- Tests, with their pass counts.
- Overflow, sweep, and Studio suite results.
- Screenshot paths of the key states.
- Anything unfinished or unsure, said plainly.
