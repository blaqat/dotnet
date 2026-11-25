# Iteration 5 · shared brief for every agent

You are one of several agents working **at the same time** on the blaqat.net redesign mocks (round 3 "Yarn": black/red/white, textile; static HTML/CSS/JS, no build step). Work only in `/Users/blaqat/dev/projects/my-litterbox/design/redesign/v3-yarn-5/`. Never edit `../v3-yarn/`, `../v3-yarn-2/`, `../v3-yarn-3/`, `../v3-yarn-4/` (read them for reference) or the repo's `src/` (read it for the owner's original designs). Do not commit; do not run git commands that change files (`checkout`, `restore`, `stash`, `reset`).

## Read first
1. `FEEDBACK-i5.md` is the spec: the owner's verbatim notes + the build reading. Your task names which items are yours (IDs like G4, P3.2).
2. `BRIEF.md` (iteration 2; still valid): kit-first architecture, craft rules, media paths, Playwright setup.
3. `FEEDBACK-i4.md` and `FEEDBACK-i3-thoughts.md`: what the last two iterations changed and why.
4. `kit/COMPONENTS.md` + `kit/components.html`: the shared kit and the ⚙ mock-panel option system (`Yarn.mockPanel`; every option is a URL param). Update COMPONENTS.md for anything you add or change in the kit.

## Owner rules (don't regress)
- Hover only lifts (translate + shadow). The rope never appears on hover, except Home's section buttons. **Nothing may clip a hover shadow** (G7).
- Single choices (segmented controls, the nav's current page) get the rope, flush on the element's own edge with its radius. Multi-select toggles get the red fill. A selected chip shows the red strike-through on hover/focus (the remove affordance).
- No floating footers. Item pages: previous/next lives once, in the sticky top bar (G6.1); no bottom Older/Newer pager.
- "Rankings", not "tier list". No filler text: labels and subtext only when they add information.
- Grid alignment everywhere: shared page edges, columns that line up between views, consistent top lines. Measure, don't eyeball.
- Motion is interruptible: a second click retargets from where things are on screen; nothing snaps (kit `flip()`; the ranking card's Mine ⇄ Everyone switch is the reference feel).
- Decided defaults: `toggle=red`, `bg=jersey`, `msearch=fab`, `mnav=spool` (round 2 correction; `top` is Earlier), grid `open=page` (new), Contact tab gone, "All" is a circle (new), sound toggle is icon-only (new). Note bursts stay black, except composing's falling notes, which are purple (H2).
- Performance: never animate `filter: drop-shadow`/blur on a layer that changes every frame, never change `zoom` or layout every frame, and clean up listeners, observers, rAF loops and audio nodes. A full optimisation pass comes later; don't make memory worse.

## The ⚙ panel (G1)
The owner only wants to see what's still open. `Yarn.mockPanel(groups)` groups take two new flags:
- `open: true`: an open decision. Shown expanded under **Open**. Use it only for items FEEDBACK-i5 marks Open (and everything in Studio, which isn't reviewed yet).
- `state: true`: a demo-state helper (which item/release/ranking, player view, demo playing, FAB open, lightbox open…). Shown under **Jump to**.
- No flag: decided. It goes in the collapsed **Earlier options (defaults kept)** section. Keep the param working; don't delete old options.

Tag the groups on your own pages. Chrome builds the panel sections and tags the kit groups. Until chrome's change lands the flags are simply ignored, so add them anyway. A new "try this" item is the default, with the old behaviour as the other value, and is tagged `open: true`.

## Working in parallel (important)
Other agents are editing `kit/yarn.js`, `kit/yarn.css`, `kit/player.js` and `kit/COMPONENTS.md` at the same time.
- Change shared kit files **only with the Edit tool**, in small anchored edits. Never Write, sed, regex-rewrite or reformat a whole kit file, and never copy a kit file over itself.
- If an Edit fails because the file changed, re-read that region and redo the edit.
- Stay inside the areas you own (table below). Put new CSS in a clearly commented block for your area (`/* == i5 · <agent> · … */`).
- If you truly need a change in someone else's area, keep it minimal and list it in your report.
- If you see an error coming from another agent's in-progress area, don't "fix" it. Report it.

| Agent | Owns |
|---|---|
| **chrome** (site-wide + phones) | ⚙ panel (`mockPanel`, `KIT_GROUPS`, `.mockpanel`) and tagging Studio's groups; `<yarn-nav>` (`.ynav*`, `.ytop*`, `.ybar*`, `.yspool*`, `kit/mnav.html`); the sound toggle + `kit/sound.js`; the filter kit (`filters`, `filterRow`, `search`, `.ychip`, `.ytag`, `.ytog`, the "All" chip, the Browse button + sheet); the FAB + list tools (`fab()`, `listTools`, `msearch`, `Yarn.slot`); toasts; kit-level hover-shadow clipping + the site-wide check; every Mobile item (MO1–MO8) including the Thoughts phone search |
| **home** | `home/`; `kit/notes.js`; the stack icon research and the stack icon code (`devicon`, `stackIcon`, `DEVICONS`, `STACK_PH`, `.ystk` icon CSS) |
| **layout** (Fable) | The open item / item page layout for Projects and Music: the detail shell (`detail`, `wireDetail`, `detailPage`, `.ydetail*`, `.ydpage*`, `pager`), `projects/item.*`, the detail/stage rendering in `projects/pj-core.js` + `projects/projects.js`, and the release page/stage head in `music/` (apply last, with small anchored edits) |
| **projects** | `projects/` list, timeline and grid (cards, filters, the list parts of `pj-core.js`, `projects.css`); kit `timeline()`, `yearRail()`, `flip()`, `openInPlace`; `.ybadge*` type/status colours and the ongoing ribbon |
| **music** | `music/` (except the release page/stage head layout, which is layout's); folder cards (`.yfolder*`, tabs); `kit/player.js`; instrument badge colours |
| **thoughts** | `thoughts/`; `kit/posts.js`; `kit/thoughts-data.js`; `kit/data.js` write-up links; `strand()` |

**In-card match style** (a tag, stack chip, type or status badge inside an item that matches the active filter or search): `.is-match` / `.ytag[aria-pressed="true"]`, i.e. `color: var(--y-fg); background: var(--y-chip);`. No outline, no light-red wash.

## Checking
- Playwright: `playwright-core` at `/Users/blaqat/dev/playground/ripple-calc/node_modules/playwright-core`; Chromium at `~/Library/Caches/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-mac-arm64/chrome-headless-shell`; launch with `--allow-file-access-from-files`; load pages as `file://` URLs.
- Widths: desktop 1440×900 @1x, 1024 wide, and mobile 390×844 @2x with `isMobile` + `hasTouch`.
- Hide `.mockpanel` in shots. Scripts go in `/Users/blaqat/dev/temp/r3i5-<agent>/`; shots go in `_shots/i5-<agent>-*.png`.
- Hover shadows: check hovered states (Playwright `hover()`, or CDP `CSS.forcePseudoState`) and confirm no ancestor with `overflow` other than `visible` cuts the shadow.
- The bar is zero `pageerror` and zero console errors on your pages and on every option URL you add.
- Before you finish, load every page at desktop and mobile (`home/index.html?skip`, `projects/index.html`, `projects/item.html?p=sonata`, `music/index.html`, `music/item.html`, `thoughts/stitched.html`, `thoughts/tier.html?id=tl1`, `studio/index.html`) and report any errors you see, saying whose area they are in.
- **Look at your shots** and compare them with iteration 4 (`../v3-yarn-4/`).

## Report back (≤ 400 words)
- Each of your items (by ID): done, partial or skipped, one line each.
- Every ⚙ option you added: param, values, default, and an example URL.
- Any change you made outside your area.
- Judgement calls, and open questions for the owner.
