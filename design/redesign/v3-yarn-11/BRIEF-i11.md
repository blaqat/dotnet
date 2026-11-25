# Iteration 11 · brief for the agents

You're one of three agents building iteration 11 of the blaqat.net redesign mocks. This is round 3, "Yarn": a black / red / white textile look, built as static HTML/CSS/JS and opened as `file://`. **i11 applies the owner's 13 type and spacing rules everywhere:** the site, the kit, the player and Studio. i10 round 2 is the base and is frozen in `../v3-yarn-10/` as the "before".

Read first:
1. `DESIGN-i11.md`: the rules turned into numbers and checks (T1–T10). **This is the spec of record.**
2. `FEEDBACK-i11.md`: the contract (tokens, `data-hw`) and your IDs.
3. `_feedback/rules-i11.md`: the owner's words.
4. `_history/DESIGN-i10.md`: everything i10 decided (colour roles, cards, queue, tabs) still holds.
5. `kit/COMPONENTS.md`: the kit's parts. Use them.

## Where things are
- **Folder** (yours to edit): `/Users/blaqat/dev/projects/my-litterbox/design/redesign/v3-yarn-11/`. Never edit `../v3-yarn-10/` or older: they're frozen. i10 is the "before" for every comparison.
- **Site pages:** `home/index.html?skip` · `projects/index.html` (`?view=grid`, `?p=sonata`) · `projects/item.html?p=sonata` · `music/index.html` (`?view=grid`, `?q=shadow`, `?demo=<track id>&player=panel`) · `music/item.html` · `thoughts/stitched.html` (`?view=article&id=a1`) · `thoughts/tier.html?id=tl1`.
- **Studio:** `studio/index.html?view=<preset>` (`studio/studio.js` PRESETS); `?reset` clears its data.
- **Kit:** `kit/yarn.css` (sections: search `== `), `kit/yarn.js` (options `OPT`, the ⚙ `KIT_GROUPS`, parts `Yarn.*`), `kit/player.js`, `kit/posts.js` (Thoughts cards), `kit/swatch.js`, `kit/components.html` (reference page), `kit/COMPONENTS.md`.

## Who owns what (three agents work at the same time)
| Agent | IDs | Owns |
|---|---|---|
| **system** | L1–L7 | `kit/yarn.css` (all of it except the MUSIC FOLDER CARD and POST CARDS sections), `kit/yarn.js` (options, panel, every `Yarn.*` part except `Yarn.folder`), `kit/player.js`, `kit/blocks.js`, `kit/notes.js`, `kit/lightbox.js`, `studio/*`, `kit/looks.html`, `kit/allo.css`, the audit, `kit/components.html`, `kit/COMPONENTS.md` |
| **music** | M1–M5 | `music/*`, `Yarn.folder` in `kit/yarn.js`, the `== MUSIC FOLDER CARD` section of `kit/yarn.css`, `kit/swatch.js` |
| **pages** | P1–P5 | `projects/*`, `thoughts/*`, `home/*`, `kit/posts.js`, the `== POST CARDS` section of `kit/yarn.css` |

**Where your work meets someone else's:**
- **Tokens:** system defines the colour, type and spacing tokens (names in `FEEDBACK-i11.md`). It adds them **first, within its first edits**, so the others can use them. Until then, use fallbacks: `var(--c-live, var(--red))`.
- **The play button + link discs:** system owns the parts (L3). music and pages use them, and tell system what they need.
- **Accent colour values in pages:** system may replace raw reds in your files with role tokens (small, exact edits). You own everything else there.
- **The player:** system owns `kit/player.js`. music needs its queue API (`YarnPlayer.play(track, queue)`, `setShuffle`) and, for `shuffle=player`, a mode toggle in the bar: ask system or add a small, clearly marked hook.
- **Shared files** (`kit/yarn.css`, `kit/yarn.js`, `kit/components.html`, `kit/COMPONENTS.md`):
  - Make small, exact Edit replacements, and re-read before you edit.
  - Never rewrite a whole file, run a formatter, or reorder code you don't own.
  - Put new CSS in a block headed `/* i11 · <agent> · … */`.

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
- Genuine open choices: build the recommended one as the default, offer the rest as a ⚙ option with `open: true`, and add a question to `review/questions-i11.js` (`kind: "ask"`, `rec`, `try` links relative to `v3-yarn-11/`; see the entries already in `review/questions-i11.js` for the format). Don't add options for things the owner decided. Keep the count low: DESIGN "⚙ options" plans only `hw`.

## i11 specifics
- **Rules over taste, but taste decides the gaps.** Apply T1–T10 literally. If a rule makes something look wrong at 1:1, say so in your report with a crop; don't quietly bend the rule.
- **Font weights drop a lot** (800–900 → 500). Check that Nunito 500 still reads as a heading at every size, and that the yarn look survives.
- **Cuts (T8):** every cut goes in a table. Never cut something an owner decision asked for; ask instead.
- **The radius change (T10)** moves the rope, focus and shadow on every card. Check the owner's i2 rule: the rope sits flush on the element's own edge, with its radius.

## Design quality bar (this iteration's point)
- **Measure, don't eyeball.**
  - Run `node ~/dev/temp/r3i11-audit/audit.mjs i11 "look=section"` (and `look=ink`) on your screens. Once system has added it (`~/dev/temp/r3i11-wip/audit-ready`), this includes the rules report; until then, use the accent marks, text styles and gaps.
  - Add `W=1000` for the owner's window.
  - Compare against the same run on `i10`, the before.
  - Put the before / after numbers in your Done section.
- **Look at crops at 1:1**, at 1440, 1000 and 390 wide, in both looks. Ask of every screen: what's the loudest thing? Is it the thing that matters? Can you tell what's playing with your eyes half closed? (Blur the screenshot: `ffmpeg -i in.png -vf boxblur=6 out.png`. ffmpeg is at `/Users/blaqat/.local/bin/ffmpeg`.)
- Section hues must pass contrast (white on a live fill and deep text on a soft tint: 4.5:1). Gold (Thoughts) is the hard one.

## Testing (the owner's lesson from i6/i7: bugs passed every automated check)
- **Put your tests in `/Users/blaqat/dev/temp/r3i11-<agent>/`.**
  - Playwright is `require("/Users/blaqat/dev/playground/ripple-calc/node_modules/playwright-core")`, with `executablePath: ~/Library/Caches/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-mac-arm64/chrome-headless-shell` and `args: ["--allow-file-access-from-files"]` (+ `"--autoplay-policy=no-user-gesture-required"` for playback).
  - Hide `.mockpanel, .yrv-root` in screenshots.
- **Write interaction tests for what you add or change.** Cover:
  - mouse, keyboard (Tab / Enter / Space / Esc / arrows), and touch: `{ viewport: {width:390,height:844}, hasTouch:true, isMobile:true }`. Tap card bodies, not just titles.
  - reopening, and state after a reload.
  - measured alignment: column x positions across repeated rows, and gaps across vs down.
- **The existing suites** (copied from i10, repointed) are in `~/dev/temp/r3i11-*`, and the list is in `~/dev/temp/r3i11-orch/regress.sh`. They pass today (baseline: `~/dev/temp/r3i11-wip/baseline.log`).
  - Your work must not break them.
  - If a test asserted the old look you were asked to change (a red button, a mono count, an old gap), update the test in place and say so in your report.
  - Add your new suites to `regress.sh` under "i11 agents' suites".
- **While you work, run only your own suites and the ones for your area.** Other agents' browsers are running too. Cap each run (no `timeout` command on this Mac: `node x.mjs & pid=$!; (sleep 120; kill $pid) & wait $pid`). If something flakes, re-run it alone before calling it a failure.
- **Wait until `/Users/blaqat/dev/temp/r3i11-wip/baseline.log` contains `== done` before you open any browser.** Read code meanwhile.
- **Before you report**, run all three:
  - `node v3-yarn-11/_tools/overflow.mjs` on your pages (18 widths)
  - `node /Users/blaqat/dev/temp/r3i11-orch/sweep.mjs <filter>` (0 errors), also with `EXTRA="look=ink"`
  - your area's existing suites
- Don't commit. No new npm dependencies. CDN files must be pinned to an exact version.

## Docs (each agent)
- Add your section under **Done** in `FEEDBACK-i11.md`: what you built, per ID; any ⚙ options or questions you added; your test files; and the audit before / after numbers.
- Document new kit parts in `kit/COMPONENTS.md` and show them in `kit/components.html`.
- After changing ⚙ groups, run `node v3-yarn-11/_tools/review-data.mjs`.

## Your report back (short)
- What you built, per ID.
- Files touched.
- Tests, with their pass counts.
- Overflow, sweep, and suite results.
- The audit numbers, before → after.
- Screenshot paths of the key states, in both looks.
- Anything unfinished or unsure, said plainly.
