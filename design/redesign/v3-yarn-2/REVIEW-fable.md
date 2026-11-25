# Round 3 "Yarn" · independent review (Fable)

Rendered every page at 390 / 768 / 1024 / 1440 with headless Chromium, tabbed through, read computed colors, tested reduced motion. Shots: `_shots/review-*.png`. No console errors, no horizontal scroll on any page.

## Verdict
The direction works: black/red/white plus knit, cord and stitch reads as one language across Home, Projects, Music and Stitched, and it still feels minimal. Desktop Projects and the player are the strongest work. What most needs to change: (1) a handful of real accessibility gaps in the player (focus on the red play button, the mobile sheet is not modal); (2) touch targets: chips, tags and date links are 26–38 px everywhere; (3) mobile loses 161 px of every screen to the mini player + nav stack; (4) two kit bugs (dead Contact link, no player on the tier list); (5) Ethereal needs its frame and player restyled before it can be compared fairly.

## Cross-cutting / kit
- **P0 · `kit/yarn.js` PAGES `contact` → `#contact`.** On every section page the desktop nav shows "Contact" linking to an anchor that only exists on Home (verified: `#contact` absent on Projects). Fix: `href: "home/index.html?skip#contact"` with `base`, or drop it from section pages.
- **P1 · Touch targets.** `.chip` is 34 px (desktop) / 38 px (mobile); Stitched `.t-tag` 26 px, `.post__date` links 14 px tall, Ethereal `.tagbtn` 28 px, Music `.cc-open`/`.tr-b` 34 px, `.th-b` 19 px. Brief says 44. Fix in the kit: `.chip{min-height:44px}` under `(pointer:coarse)`, and give tags/dates `padding-block` or a `::before` hit area.
- **P1 · Mobile bottom stack = 161 px** (`--bottom-ui`, `review-music-m.png`). Mini player (64) + gap + nav (62) + frame eats 19 % of a 844 px screen. Fix: dock the mini player *into* the brown bar (one taller corduroy dock: track row above the four tabs), or collapse the nav to icons when the player is present.
- **P1 · `thoughts/tierlist.html` has no `<yarn-player>`** (confirmed). Music stops when a visitor opens a tier list. Add the two script/element lines; set `--bottom-ui`.
- **P2 · Mobile nav material:** keep **corduroy** (6.7:1, reads as fabric at 390). Cork is the only one that lets ink text work but looks like chipboard; suede is a blur of corduroy; burlap is too busy behind 10.9 px labels. Cut suede/burlap.
- **P2 · 10–11 px text:** `.ybar a` 10.9 px, `.flabel` 9.9 px, ledger `.n` 10.2 px at 4.3:1 (`music-m-ledger`), `.embed__badge` 10.2 px. Floor meta at 11.5 px / `--ink-2`.
- **P2 · Ethereal repoints the kit nav** (`ethereal.js:729`). Fine for a mock; if Ethereal wins, give `<yarn-nav>` a `thoughts-href` attribute instead.

## Home (`home/`)
- **Confirmed:** at `?intro=drop&t=3050` the cat's head covers the "b" by ~39 px (`review-intro-drop-d-3050.png`); on mobile at `t=2900` the tail is cut by the sheet edge (`review-intro-drop-m-2900.png`). Fix: in `cat.js` stop the stalk 40 px short of the first letter and clamp the pose `x ≥ frame + tail length`, or let the tail overflow (`.home-sheet{overflow:visible}` with the ball clipped separately).
- **Good:** intro never blocks: Skip button present, any pointerdown or Esc ends it, Tab focuses the bio (reveals via `:focus-within`), `?reduced` goes straight to `intro-off`. Drop runs 4.06 s; Simple 1.3 s.
- **P1 · Skip button 40 px tall and mono 12.5 px** (`.skip`). Make it 44 and show it only after ~600 ms so it doesn't compete with the drop.
- **P2 · Mobile redundancy** (`review-home-contact-m.png`): three big section tiles *and* a corduroy bar with the same three links, plus ~200 px dead space under Contact. Hide `.ybar` on Home (the tiles are the nav) or shrink `.hero` padding so the sheet ends with the tiles.
- **P2 · Note burst falls across the bio** (`review-home-notes-d.png`, notes over "RIT grad"). Spawn below the button baseline only, or lower `Notes.config` opacity to .7.
- **Open transition** (`review-home-open-d-03/07`): swatch → pill → band → full cloth, reversible on Esc, fade under reduced motion. Crafted. Production note: this is a real navigation, so expect a white flash on slow loads; use the View Transitions API or persist the cloth until `DOMContentLoaded` of the next page.
- **Keep:** Drop (default) and Simple (returning visitors, `sessionStorage` already does this). **Cut:** Cursor. The cat sitting in the bottom corner with nothing in the lockup (`review-intro-cursor-d-9000.png`) weakens the wordmark, and the lane only works with a fine pointer.

## Projects (`projects/`)
- **Excellent desktop** (`review-projects-d.png`): all 12 rows in one screen, `role=tablist`/`aria-selected`, ↑↓/j/k, 160 ms hover intent, URL follows, missing videos auto-skip to the first image in the stage hero. Rope ring doubles as focus ring on rows (visible).
- **Confirmed:** 5 projects show black "video" posters in Grid tiles and Rows thumbs (`review-projects-grid-d.png`). Three (Code Editor Theme Gen, Fishbowl, Midi Player) have no images at all. Fix: for image-less projects use the `codehero` excerpt or a section-color knit swatch with initials (like "FE"), never a black box that reads as broken.
- **Not reproduced:** header above screen after closing a lower row. Opening row 9, scrolling 600 px and tapping it closed left the header at y=416 (`review-projects-m-rows-lowclosed.png`). Only the tap path was tested; if drag-close differs, after collapse do `scrollIntoView({block:"nearest"})` on the header.
- **P2 · 768 px** (`review-projects-t-rows.png`): rows stretch to 700 px with empty right halves. Add a 2-column rows grid between 640–959, or drop the desktop breakpoint to 900.
- **P2 · Sticky mobile filter strip** overlaps row content with no shadow (`...-lowclosed.png`); add `--shadow-patch` when stuck.
- **Keep:** List+stage (desktop default), Grid as the toggle, **Rows** on mobile (10 rows per screen, open in place). **Cut:** Deck (one project per screen, contrary to the density goal; the scrubber is a second way to do what scroll does). Grid mobile is fine as the secondary option.

## Music (`music/`, `kit/player.js`)
- **P0 · Focus invisible on the play button.** `.play{outline:2px dashed rgba(255,255,255,.62)}` (line 663) overrides `:focus-visible` (647); measured focus = the dashed stitch (`review-music-d-player-focus.png`). Fix: `.play:focus-visible{outline:3px solid var(--y-ink);outline-offset:3px}` or move the stitch to a `::after`.
- **P1 · Mobile expanded sheet is not modal** (`review-music-m-expanded-tap.png`): `main` not inert, body scroll not locked, no `role=dialog`. Tab leaves the sheet into the page behind it. Fix: `document.querySelector('main').inert = open`, `aria-modal`, lock scroll. Desktop panel: fine as non-modal.
- **P1 · Mobile library density** (`review-music-m.png`): collections are a horizontal strip, one card per swipe, so 7 collections = 7 swipes plus a cut-off card. Use the **Ledger** stacking on mobile (`review-music-m-ledger.png`) and keep Swatch book on desktop.
- **Good:** `role=slider` seek with `aria-valuetext` and arrow keys, named buttons, focus to the title on open and back to the trigger on close, swipe-down dismiss, spring with velocity handoff and rubber band in code, reduced motion → cross-fade. Knit swatches as covers and the pin scrubber are the most "designed" thing in the round.
- **P2 · `.bar{touch-action:none}`** on the compact mini bar: a scroll that starts on it does nothing. Use `pan-y` and detect the vertical swipe yourself.
- **Keep:** Swatch (desktop), Ledger (mobile), **Panel over bar** (desktop; the sheet grows from the bar it belongs to). **Cut:** Dock column (squeezes the library to 2 cards, `review-music-d-dock.png`).

## Thoughts · Stitched (`thoughts/stitched.html`)
- **Good:** dense 3-column masonry with left rail (`review-stitched-d.png`), filters announce via `#t-status`, lightbox traps focus, announces "Image 2 of 4", Esc returns to the thumb, `main` inert.
- **P1 · Tag/date targets** (see kit) and `.seg__btn` 38 px.
- **P2 · Mobile header** (`review-stitched-m.png`): collections strip + sticky "All/Scratch/Articles/Tags" + count = 600 px before the first post. Fold collections into the Tags sheet on mobile.
- **P2 · Lightbox is a modal** in a no-modals brief. Acceptable for media, but open it from the thumb (scale from its rect) so it obeys spatial consistency; currently it fades in centered.
- **Keep:** Masonry (default), Thread as a secondary layout (`review-stitched-d-thread.png` is lovely but single-column).

## Thoughts · Ethereal (`thoughts/ethereal.html`)
- **Confirmed · P1:** the white knit player bar on the night page (`review-ethereal-d-player.png`, `-m-`). The player's CSS uses `--y-*` tokens; expose them (`--y-bg`, `--y-line`, `--y-ink`) and set them from `.eth`, or add `yarn-player[theme=night]`.
- **P1 · Frame:** the "dusk gold cord" reads as mustard-brown mud around a navy page (`review-ethereal-d.png`). `?frame=stitch` (`review-ethereal-d-framestitch.png`) is far better; make it the default and drop cord.
- **Contrast is fine:** star-3 6.6:1, ember 8.6:1, gold-lit 10.9:1. Lightbox trap works but `main` is not inert; set it.
- **Comparison:** Ethereal is handsome (Fraunces, constellation cat, red thread) but it is a second design system: new fonts, new palette, single-column feed at 2928 px vs Stitched 2073 px, and it breaks the "section color on the frame, everything on the white sheet" rule. **Keep Stitched** as the Thoughts page. Salvage from Ethereal: the vertical red thread timeline (`review-stitched-d-thread.png` already has it) and the italic serif for scratch quotes, as an *article reading mode* at most.

## Tier list (`thoughts/tierlist.html`)
- **Good:** keyboard pickup/move/drop with assertive live region (`Picked up Arc… Arrow keys or 1 to 5…`), tap-to-select opens an in-place "Move to S/A/B/C/D/Unranked" inspector on touch (`review-tierlist-m-edit-tap.png`), so drag is never the only path. Yarn skin is consistent with the kit.
- **P1 · No player** (kit section).
- **P2 · Unnamed inputs:** `textarea#tl-title` and `input#tl-q` rely on placeholders; add `aria-label`.
- **P2 · `.tl-tab` selected state** depends on a JS-positioned thumb; before fonts load the white "Mine" sits on cream (1.15:1). Give `[aria-selected=true]` a CSS background fallback.
- **Keep:** Yarn skin, Mine/Everyone/You-vs-all tabs. **Cut:** Ethereal skin (follows the Thoughts decision).

## Motion craft
Press feedback exists on `.btn/.chip/.ynav__link/.sbtn` (`:active` scale, 100 ms). Springs with velocity handoff and retargeting in both `player.js` and `projects.js`; hover never shifts layout (row hover: 0 px). Reduced motion is honored in every file including `notes.js`. Gaps: the lightboxes and the Stitched filter re-layout use fades rather than opening from the trigger; the ethereal field canvas keeps drifting unless `?field=still`.
