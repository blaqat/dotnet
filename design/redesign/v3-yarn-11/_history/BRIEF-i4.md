# Iteration 4 · shared brief for every agent

You are one of several agents working **at the same time** on the blaqat.net redesign mocks (round 3 "Yarn": black/red/white, textile; static HTML/CSS/JS, no build step). Work only in `/Users/blaqat/dev/projects/my-litterbox/design/redesign/v3-yarn-4/`. Never edit `../v3-yarn/`, `../v3-yarn-2/`, `../v3-yarn-3/` (read them for reference) or the repo's `src/`. Do not commit; do not run git commands that change files (`checkout`, `restore`, `stash`, `reset`).

## Read first
1. `FEEDBACK-i4.md` is the spec: the owner's verbatim notes + the build reading. Your task names which items are yours.
2. `BRIEF.md` (iteration 2; still valid): kit-first architecture, craft rules, media paths, Playwright setup.
3. `FEEDBACK-i3-thoughts.md`: what iteration 3 changed and why (Thoughts is the reference page for feel and alignment).
4. `kit/COMPONENTS.md` + `kit/components.html`: the shared kit and the ⚙ mock-panel option system (`Yarn.mockPanel`; every option is a URL param).

## Owner rules (don't regress)
- Hover only lifts (translate + shadow). The rope never appears on hover, except Home's section buttons.
- Single choices (the nav's current page, segmented controls) get the rope. It sits flush on the element's own edge with the element's radius. Multi-select toggles get the **red fill** (decided).
- No floating detail footers. Use an in-flow Older/Newer pager and in-flow links.
- "Rankings", not "tier list".
- Grid alignment everywhere: shared page edges, columns that line up between views, consistent top lines.
- No filler text. Labels and subtext appear only when they add information.
- Motion is interruptible. A second click retargets from where things are on screen; nothing snaps. The reference feel is the ranking card's Mine ⇄ Everyone switch and i3's Thoughts filtering (kit `flip()`).
- Performance:
  - Never animate `filter: drop-shadow`/blur on a layer that changes every frame, and never change `zoom` or layout every frame.
  - Clean up listeners, observers, rAF loops and audio nodes.
  - The owner saw memory spikes; a full optimisation pass comes later, so don't make it worse.
- Every choice the owner left open is a ⚙ option with its own URL. Decided items need no option.
- Default background is now `jersey`, with `intarsia` as an option. Note bursts stay black.

## Working in parallel (important)
Other agents are editing `kit/yarn.js` and `kit/yarn.css` at the same time.
- Change shared kit files **only with the Edit tool**, in small anchored edits. Never Write, sed, regex-rewrite or reformat a whole kit file, and never copy a kit file over itself.
- If an Edit fails because the file changed, re-read that region and redo the edit.
- Stay inside the areas you own (table below). Put new CSS in a clearly commented block for your area.
- If you truly need a change in someone else's area, keep it minimal and list it in your report.
- If you see an error coming from another agent's in-progress area, don't "fix" it. Report it.

| Agent | Owns |
|---|---|
| **site** (site-wide + Thoughts) | Filter/chip/tag/toggle kit (`filters`, `filterRow`, `search` tokens, `.ychip`, `.ytag`, `.ytog`, the "All" chip); year pills (`.yyear*`, `paintPills`); link buttons (`LINK_ICONS`, `linkIcon`, `.ylinkicon`, link-opener buttons); `kit/lightbox.js`; `kit/bg/` + the bg default; `kit/posts.js`; `kit/thoughts-data.js`; `thoughts/`; small Studio edits for rankings/posts |
| **chrome** (nav + bottom chrome + player) | `<yarn-nav>` (`.ynav*`, `.ybar*`, nav tabs, contact tab, sound toggle placement); `kit/player.js`; the FAB + list tools (`fab()`, `listTools`, `msearch`); `kit/sound.js` |
| **home** | `home/`; `kit/notes.js`; the section transition (`Yarn.transition` and its CSS) |
| **projects** | `projects/`; kit `flip()`, `timeline()`, `yearRail()`; the detail shell (`detail`, `wireDetail`, `detailPage`, `.ydetail*`, `.ydpage*`, `pager`) |
| **music** (starts after projects) | `music/`; then takes over projects' kit areas |

**In-card "match" style** (a tag, stack chip, type or status badge inside an item that matches the active filter or search) uses i2's look everywhere: `color: var(--y-fg); background: var(--y-chip);`, the same as i2's `.ytag[aria-pressed="true"]`. It is not the light-red wash. Use the class `.is-match` for non-tag badges, styled with those same tokens.

## Checking
- Playwright setup is as in `BRIEF.md` (`playwright-core` at `/Users/blaqat/dev/playground/ripple-calc/node_modules/playwright-core`, chrome-headless-shell-1248, `--allow-file-access-from-files`).
- Widths: desktop 1440×900 @1x, 1024 wide, and mobile 390×844 @2x with touch.
- Hide `.mockpanel` in shots. Scripts go in `/Users/blaqat/dev/temp/r3i4-<agent>/`; shots go in `_shots/i4-<agent>-*.png`.
- The bar is zero `pageerror` and zero console errors on your pages and every option URL you add.
- Before you finish, load every page at desktop and mobile (`home/`, `projects/index.html`, `projects/item.html?p=sonata`, `music/index.html`, `music/item.html`, `thoughts/stitched.html`, `thoughts/tier.html?id=tl1`, `studio/index.html`) and report any errors you see, saying whose area they are in.
- **Look at your shots** and compare them with iteration 3 (`../v3-yarn-3/`). Measure alignment (element left/top edges) rather than eyeballing it.

## Report back (≤ 400 words)
- Each of your items: done, partial or skipped, one line each.
- Every ⚙ option you added: param, values, default, and an example URL.
- Any change you made outside your area.
- Judgement calls, and open questions for the owner.
