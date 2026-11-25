# Iteration 10 · brief for the agents

You're one of three agents building iteration 10 of the blaqat.net redesign mocks (round 3, "Yarn": a black / red / white textile look; static HTML/CSS/JS, opened as `file://`). **i10 is a design pass on the site.** The owner prefers their old site's clarity; the yarn site has too much going on, so you can't tell what matters (see the owner's words). We're fixing hierarchy, colour meaning, type and grid, with a professional designer's eye. Studio comes along (it shares the kit).

Read first:
1. `DESIGN-i10.md`: the design brief (measurements, rules R1–R9, colour roles, type roles, grid, queue). **This is the spec of record.** When something isn't covered, decide by its rules.
2. `FEEDBACK-i10.md`: the contract (attributes, tokens) and your IDs.
3. `_feedback/roundup-i9-site.md` + `_feedback/i10-music-old-vs-new.png`: the owner's words and screenshot.
4. `kit/COMPONENTS.md`: the kit's parts. Use them; don't hand-roll a look the kit already has.

## Where things are
- **Folder** (yours to edit): `/Users/blaqat/dev/projects/my-litterbox/design/redesign/v3-yarn-10/`. Never edit `../v3-yarn-9/`, `../v3-yarn-8/` or older: they're frozen. i8 is the "before" for every comparison.
- **Site pages:** `home/index.html?skip` · `projects/index.html` (`?view=grid`, `?p=sonata`) · `projects/item.html?p=sonata` · `music/index.html` (`?view=grid`, `?q=shadow`, `?demo=<track id>&player=panel`) · `music/item.html` · `thoughts/stitched.html` (`?view=article&id=a1`) · `thoughts/tier.html?id=tl1`.
- **Studio:** `studio/index.html?view=<preset>` (`studio/studio.js` PRESETS); `?reset` clears its data.
- **Kit:** `kit/yarn.css` (sections: search `== `), `kit/yarn.js` (options `OPT`, the ⚙ `KIT_GROUPS`, parts `Yarn.*`), `kit/player.js`, `kit/posts.js` (Thoughts cards), `kit/swatch.js`, `kit/components.html` (reference page), `kit/COMPONENTS.md`.

## Who owns what (three agents work at the same time)
| Agent | IDs | Owns |
|---|---|---|
| **system** | L1–L8 | `kit/yarn.css` (all of it except the MUSIC FOLDER CARD and POST CARDS sections), `kit/yarn.js` (options, panel, every `Yarn.*` part except `Yarn.folder`), `kit/player.js`, `kit/blocks.js`, `kit/notes.js`, `kit/lightbox.js`, `studio/*`, new `kit/looks.html`, `kit/components.html`, `kit/COMPONENTS.md` |
| **music** | M1–M9 | `music/*`, `Yarn.folder` in `kit/yarn.js`, the `== MUSIC FOLDER CARD` section of `kit/yarn.css`, `kit/swatch.js` |
| **pages** | P1–P4 | `projects/*`, `thoughts/*`, `home/*`, `kit/posts.js`, the `== POST CARDS` section of `kit/yarn.css` |

**Where your work meets someone else's:**
- **Tokens:** system defines the colour, type and spacing tokens (names in `FEEDBACK-i10.md`). It adds them **first, within its first edits**, so the others can use them. Until then, use fallbacks: `var(--c-live, var(--red))`.
- **The play button + link discs:** system owns the parts (L4). music and pages use them, and tell system what they need.
- **Accent colour values in pages:** system may replace raw reds in your files with role tokens (small, exact edits). You own everything else there.
- **The player:** system owns `kit/player.js`. music needs its queue API (`YarnPlayer.play(track, queue)`, `setShuffle`) and, for `shuffle=player`, a mode toggle in the bar: ask system or add a small, clearly marked hook.
- **Shared files** (`kit/yarn.css`, `kit/yarn.js`, `kit/components.html`, `kit/COMPONENTS.md`):
  - Make small, exact Edit replacements, and re-read before you edit.
  - Never rewrite a whole file, run a formatter, or reorder code you don't own.
  - Put new CSS in a block headed `/* i10 · <agent> · … */`.

## The owner's rules (cumulative; all still apply)
- **Hover only lifts.** The selected rope sits flush on the element's own edge, with the element's radius. i10 changes the rope's *colour* by role, never its form.
- **Toggles** (multi-select) get a fill; **single choices** get the rope. i10: the fill's colour is the **on** role, the rope's the **pick** role.
- **Grid alignment is measured:** in repeated rows, assert column x positions in tests.
- Motion is interruptible.
- No filler text: no labels that only restate the obvious, no "Now playing" lines.
- Nothing clips a hover shadow.
- Pressing an inner button doesn't press its card.
- No hover flicker at card edges.
- Floating chrome sits on its own top layer (`Yarn.layer()`).
- **Phones never scroll sideways.**
- **Similar elements are one kit part.**
- When an owner note names a concept (a colour, a status, playing), apply it everywhere that concept shows.
- `[popover]` + a kit class that sets `display` is never hidden when closed: add `.x:not(:popover-open){display:none}`.
- `.ytip` must stay a single element.
- Genuine open choices: build the recommended one as the default, offer the rest as a ⚙ option with `open: true`, and add a question to `review/questions-i10.js` (`kind: "ask"`, `rec`, `try` links relative to `v3-yarn-10/`; see `review/questions-i9.js` for the format). Don't add options for things the owner decided, and keep the count low: DESIGN §8 lists the planned five.

## Design quality bar (this iteration's point)
- **Measure, don't eyeball.**
  - Run `node ~/dev/temp/r3i10-audit/audit.mjs i10 "look=section"` (and `look=ink`) on your screens: accent marks, distinct text styles, gaps.
  - Add `W=1000` for the owner's window.
  - Compare against `out-i8*` (i8) and `out-old-1000` (the old site).
  - Put the before / after numbers in your Done section.
- **Look at crops at 1:1**, at 1440, 1000 and 390 wide, in both looks. Ask of every screen: what's the loudest thing? Is it the thing that matters? Can you tell what's playing with your eyes half closed? (Blur the screenshot: `ffmpeg -i in.png -vf boxblur=6 out.png`. ffmpeg is at `/Users/blaqat/.local/bin/ffmpeg`.)
- Section hues must pass contrast (white on a live fill and deep text on a soft tint: 4.5:1). Gold (Thoughts) is the hard one.

## Testing (the owner's lesson from i6/i7: bugs passed every automated check)
- **Put your tests in `/Users/blaqat/dev/temp/r3i10-<agent>/`.**
  - Playwright is `require("/Users/blaqat/dev/playground/ripple-calc/node_modules/playwright-core")`, with `executablePath: ~/Library/Caches/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-mac-arm64/chrome-headless-shell` and `args: ["--allow-file-access-from-files"]` (+ `"--autoplay-policy=no-user-gesture-required"` for playback).
  - Hide `.mockpanel, .yrv-root` in screenshots.
- **Write interaction tests for what you add or change.** Cover:
  - mouse, keyboard (Tab / Enter / Space / Esc / arrows), and touch: `{ viewport: {width:390,height:844}, hasTouch:true, isMobile:true }`. Tap card bodies, not just titles.
  - reopening, and state after a reload.
  - measured alignment: column x positions across repeated rows, and gaps across vs down.
- **The existing suites** (copied from i8 + i9, repointed) are in `~/dev/temp/r3i10-*`, and the list is in `~/dev/temp/r3i10-orch/regress.sh`. They pass today (baseline: `~/dev/temp/r3i10-wip/baseline.log`).
  - Your work must not break them.
  - If a test asserted the old look you were asked to change (a red button, a mono count, an old gap), update the test in place and say so in your report.
  - Add your new suites to `regress.sh` under "i10 agents' suites".
- **While you work, run only your own suites and the ones for your area.** Other agents' browsers are running too. Cap each run (no `timeout` command on this Mac: `node x.mjs & pid=$!; (sleep 120; kill $pid) & wait $pid`). If something flakes, re-run it alone before calling it a failure.
- **Wait until `/Users/blaqat/dev/temp/r3i10-wip/baseline.log` contains `== done` before you open any browser.** Read code meanwhile.
- **Before you report**, run all three:
  - `node v3-yarn-10/_tools/overflow.mjs` on your pages (18 widths)
  - `node /Users/blaqat/dev/temp/r3i10-orch/sweep.mjs <filter>` (0 errors), also with `EXTRA="look=ink"`
  - your area's existing suites
- Don't commit. No new npm dependencies. CDN files must be pinned to an exact version.

## Docs (each agent)
- Add your section under **Done** in `FEEDBACK-i10.md`: what you built, per ID; any ⚙ options or questions you added; your test files; and the audit before / after numbers.
- Document new kit parts in `kit/COMPONENTS.md` and show them in `kit/components.html`.
- After changing ⚙ groups, run `node v3-yarn-10/_tools/review-data.mjs`.

## Your report back (short)
- What you built, per ID.
- Files touched.
- Tests, with their pass counts.
- Overflow, sweep, and suite results.
- The audit numbers, before → after.
- Screenshot paths of the key states, in both looks.
- Anything unfinished or unsure, said plainly.
