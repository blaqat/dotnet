# Iteration 7 · walkthrough results (W1)

**Browser:** Safari (WebKit) on macOS, driven with cua-driver. The owner's Dia and Helium windows were not touched; Safari was opened in a new window and closed at the end.
**Desktop pass:** a 1440 × 952 window (page about 1440 × 900). Real mouse (hover, press, drag, long-press, wheel) and keyboard.
**Phone pass:** Safari's **Responsive Design Mode, "iPhone size" preset (393 × 852, 3×)**. RDM in Safari doesn't emulate touch: taps are mouse clicks and there's no pinch or touch-drag. So the touch-only items (drag the player down, drag tiles by touch) were driven by mouse drag in RDM and also checked with real touch events in Playwright (Chromium, `hasTouch`).
**Pages:** `file:///…/v3-yarn-7/…`.

How each line was judged: done in the browser, then a fresh screenshot looked at full-size and at 1:1 crop. Hover needs the pointer to really be there, so a hover is a real pointer move plus a one-notch sideways wheel at that point (WebKit only updates `:hover` on a real event). Animations were judged from screen recordings (filter spam, timeline) or bursts of screenshots (ripple, rope, cross-fade).

---

## Checklist

**Totals: 31 lines · 24 ✓ · 7 ✗** (every ✗ is now fixed and re-checked; the findings follow).
"(not checked: …)" marks the parts of a line this walk didn't do in Safari; where an existing suite covers them it's named.

### Every page
- [✓] **Sound tag:** on and off with a click; reloading starts muted; hover swaps only the icon (no colour, ring or lift change); on is the deeper red; the white dashed stitch on top is gone. Right after a click the icon shows what just happened until the pointer leaves. *(phone: seen in place top right; toggled only on desktop)*
- [✗→✓] **Nav:** every section from every page. **F1:** on desktop the closed "⚙ Projects options" pill covered the nav's **Thoughts** button (Studio: "View site"), so a click meant for Thoughts opened the panel. Phone sections pill: opens, choosing a section works, outside tap and Esc close it.
- [✗→✓] **⚙ panel:** opens and closes; picking an Open option reloads and stays; it's still applied on another page; Reset (with its confirm) works; page note and "Note on something" work; Esc cancels the picker. **F2:** Esc didn't close the panel itself (nor an outside click). **F3 (Safari only):** the ✎ and "saved ×" sat one row low, so "saved" read as belonging to the first value. *(not checked: an option's ✎ note in Safari; covered by `r3i7-site/panel.mjs`)*
- [✗→✓] **Hints:** appear fast and leave on leave. The pager title hint, "Copied", the long-press ▶/mute/⏭ hints (outward, no overlap) and the volume ball were all fine. **F8:** at phone width the disc's hover tip opened leftward over the search knob and the sections pill.
- [✓] **Keyboard:** Tab through Projects and the ranking page; focus is always visible (search → chips → rows); Space/Enter pick up and place tiles; Esc closes the lightbox, video fullscreen, long-press actions, the tag browser and suggestions. (The ⚙ panel's missing Esc is F2.)
- [✗→✓] **Phones:** no sideways scroll (`overflow.mjs` clean at 18 widths). **F11:** the closed "⚙ Projects options" label sat over card text. **F12:** over the open player page, a toast sat on the ▶ ⏮ ⏭ row.

### Home
- [✓] **Intro:** "First ever" shows the "Press unmute for sound" callout with its countdown, then a muted start. Replay from ⚙ works.
- [✓] **Keywords:** each one ripples letter by letter; "composing" drops purple felt notes. *(not checked: the sound itself; no audio capture)*
- [✓] **Stack tags** shake their icon; the contact links hold still at their edges; section buttons go to their page with the colour transition (the sheet rises in the next section's colour).

### Projects
- [✓] **Filters:** chips fill red twill; a pressed chip shows the strike on hover; All clears; Browse opens, filters (Rust) and closes on an outside click; search; "No projects match" + Clear filters.
- [✓] **Filter spam** (double-clicks across chips, recorded): cards reverse from where they are, no snapping.
- [✓] **Timeline:** rows cross-fade with no blank frame; the passed rings follow the ball; a stack tag in a row opens the row, it doesn't filter.
- [✓] **Opened item:** facts; stage tags filter and clear on a second click; ‹ 3 / 14 › with the title hint; copy link ("Copied"); the lightbox opens and closes; the video goes fullscreen (native) and Esc leaves fullscreen, then the viewer; the sticky bar appears only after scrolling past its own height.
- [✓] **Grid:** pressing a link inside a card doesn't press the card; "open as a page" → Back keeps the scroll and the filter; ‹ › steps both ways.
- [✓] **`?statusdate`, `?cardfacts`:** both switch from ⚙ and show on the cards and the opened item. (The ⚙ row bug is F3.)

### Music
- [✓] **Cards:** play / pause shows the bars inside the button; "+" queues with a toast whose Undo is on the right (Undo works); hovering a folder tab shows that song's notes. *(not checked: playing from a tab, the one-tab card; covered by `t-m1-cards`)*
- [✓] **Track rows** (stage, and the release page `music/item.html`): links · notes · + · duration sit in the same columns on every row, including the one-link row. The notes ⌄ unrolls; "+" works.
- [✓] **Search:** "candyland" (only in a description) finds Land of Sugar and Spice; the opened collection greys the non-matches.
- [✗→✓] **Player:** disc → bar → panel → back works on desktop. The volume ball is fully visible at 0%. The queue reorders by drag. **F4:** there was no way to remove a song from "Up next". **F7 (broken, phone):** once the player's full page was open, nothing in it responded: no drag down, no ⌄, no buttons. *(not checked in Safari: Next disabled on the last song; covered by `t-b3-acts`)*
- [✓] **Long-press the disc** (desktop and phone): ▶, mute and ⏭ all look enabled; their hints open outward and don't cover each other; the search knob steps away; Esc and an outside tap close them.
- [✓] **Ongoing release in the player:** a gold "WIP" mark with a hammer (bar, panel art, disc pin), not red.

### Thoughts
- [✓] **Feed:** type filters; "8 more" tag browser closes on ✕, Esc, outside click and picking a tag (the B2 fix holds in WebKit); year filter; search (phone). The rail stays sticky.
- [✓] **Cards:** open a post, then Back (top bar) lands where you were with that post outlined; on a pick card the write-up pill and "about" go to the thing.
- [✓] **Article:** Back and ‹ n / N › in the top bar (hint shows the title); copy link copies the URL with the section anchor; a contents link flashes its heading even when it's already on screen. *(not checked: an article's lightbox; the lightbox itself is checked under Projects)*
- [✓] **Collection:** picks; the rope moves one step at a time; the go-to-collection buttons are text and an arrow only.

### Rankings
- [✗→✓] **Mine / Add yours:** dragging a tile with the mouse places it; click to pick and then click a tier works; keyboard Space to pick, a number key to drop. **F5:** with a tile picked on desktop, the empty tiers said "**Tap** to put it here". *(not checked in Safari: Everyone; dragging by touch, covered by `test-tier`)*
- [✓] **Comments:** "@sa" suggests Safari; Enter inserts it; "#" suggests tiers; Esc closes; a posted mention shows its tile on the board when clicked; the reference chip fits the icon's shape.
- [✓] **Write-up pill** on the page is white; the feed's write-up bookmarks sit right.

### Studio
- [✗→✓] **Screens from ⚙ › Screen:** dashboard; project editor (title and status update the live preview); publish with the smart check ("Publish anyway"); the "Published" toast then "Live now"; reorder by drag, and its Undo; history; the phone's red "+" sits on the floating layer. **F9:** History listed "Published" twice for one publish. **F10:** after Undo on a reorder, each grip's screen-reader label still said its moved position. *(not checked in Safari: sign in, media upload; covered by `r3i7-studio/flows.mjs`)*
- [✓] **It looks like the rest of the site:** same top bar, chips, facts, tags, buttons and toasts.

### Round-up (`review.html`)
- [✓] Picking a decision, answering a question, the notes count, **Copy everything** (pasted: the markdown has the pick, the answer and the page note), **Clear everything** (with its confirm). *(no cuts to Keep this round: "0 of 0")*

---

## Findings

**12 findings · broken 1 · wrong 5 · polish 6 · fixed 11 · left 1** (the left one is a round-up question).

| # | Severity | Page · size | Steps → what's wrong | Shots (`_shots/`) | Status |
|---|---|---|---|---|---|
| **F7** | **broken** | every page with the player · phone | Play a song → tap the bar's title (full page opens) → drag it down, or tap ⌄ / ▶ / a queue row. **Nothing responds.** The player has lived in the kit layer since i6 B2, and the modal code inerts all of `<body>`'s children, which now includes the layer, so the open page is inert. Every engine; Playwright's touch emulation shows the same. | `i7-walk-f7-panel-stuck-390.png` | **fixed** in `kit/player.js` `setModal`: it inerts only the siblings along the player's path to `<body>` (the page, plus the pill, search and fab in the layer), and leaves the toast live. Drag down → bar and ⌄ → bar both work in Safari (`…f7-fixed-drag-close-390.png`) and in Chromium with mouse and touch (`r3i7-walk/pdrag4.mjs`). |
| **F1** | wrong | all pages · desktop 960–1680 | The closed "⚙ <Page> options" sat over the nav's last button (Thoughts; Studio's "View site") at every width, so clicking Thoughts opened the panel. Scrolled, it also covered the sticky top bar's copy-link button. | `i7-walk-f1-pill-covers-nav-1440.png` | **fixed** (`kit/yarn.css`, mock-only): closed, it's a small ⚙ disc on the cord frame's top-right corner; hover or focus shows its name. Measured over 10 pages × 6 widths, scrolled and not: it covers nothing (`r3i7-walk/pill*.mjs`). `…f1-fixed-1440.png` |
| **F4** | wrong | Music player panel · all sizes | Open the panel → "Up next": rows can be reordered, but there's no way to remove one (the checklist's "Queue: reorder and remove"). | `i7-walk-f4-queue-no-remove-1440.png` | **fixed** (`kit/player.js`): each upcoming row has a ✕ (`.yp-ib`, the close icon). It's quiet until hover or focus with a mouse, always shown on touch, and a 44px target. It uses the kit toast with Music's own words ("… is out of the queue") and Undo puts the song back in the same place. Focus stays in the queue. The ✕ column is reserved on every row, so the durations still line up with the playing row's. 22 checks pass (`qrm.mjs`). `…f4-fixed-x-390.png` |
| **F9** | wrong | Studio › project › History · desktop | Edit Sonata → Publish anyway → History: two "Published" rows for one publish (the history was built *after* the item was marked live, so the seed had its own "Published" at that minute, then the real one was added). | `i7-walk-f9-history-double-published.png` | **fixed** (`studio/studio-core.js`): history is built before the state changes. One "Published" now (`hist.mjs`). |
| **F3** | wrong · **Safari-only** | ⚙ panel · all sizes | Pick a value in an Open group → "saved ×" and ✎ appear one line *below* the group's title, beside its first value. WebKit starts a fieldset's padding box *under* its legend, so `top: 0` against the fieldset lands lower than in Chrome. | `i7-walk-f3-saved-row-low-safari.png` | **fixed in both engines** (`kit/yarn.css`): the ✎ and the tag are positioned against their own legend and centred on its line, desktop and coarse pointer. Checked in Safari (`…f3-fixed-safari.png`) and Chromium (`legend.mjs`). |
| **F12** | wrong | player panel · phone | Over the open player page, remove a queue song → the toast sat on the ▶ ⏮ ⏭ row (it covered Play and the Undo was under a thumb's reach of Play). | `i7-walk-f12-toast-over-transport-390.png` | **fixed** (`kit/yarn.css`): while the phone player page is open, the toast waits just above that row (checked at 390 and 360: 17px clear). `…f4-fixed-toast-390.png` |
| **F2** | polish | ⚙ panel · all | Open the panel → press Esc: it stays open (only its own summary closed it). Everything else on the site closes on Esc. | `i7-walk-f2-esc-closes-1440.png` (after) | **fixed** (`kit/yarn.js`): Esc closes the open panel first and focus goes back to its summary. It doesn't fire while a review note is being typed or picked (review.js owns Esc there). An outside click still doesn't close it, on purpose, so notes being written aren't lost. |
| **F5** | polish | Rankings › Add yours · desktop | Click a tile to pick it → the empty tiers say "**Tap** to put it here". | `i7-walk-f5-tap-on-desktop-1440.png` | **fixed** (`thoughts/tier.js`): with a mouse it says "Click to put it here", with touch "Tap…". `test-tier.mjs` updated to expect the verb per pointer. |
| **F8** | polish | player disc · phone width with a mouse | Hover the disc at < 960px → its tip ("seeds you planted · 2:40 / 3:02") opened to the left, over the search knob and the sections pill. | `i7-walk-f8-disc-tip-and-pill-390.png` | **fixed** (`kit/player.js`): below 960px it opens upward, right-aligned with the disc (`…f8-fixed-tip-up-390.png`). |
| **F10** | polish | Studio › Projects › reorder | Drag a row → Undo: the order comes back, but each grip's label ("Reorder X, position n of 13") kept the moved position. | `i7-walk-f10-reorder-undo.png` | **fixed** (`studio/studio-screens.js`): one `relabel()` runs after a move and after Undo (`hist.mjs`). |
| **F11** | polish | ⚙ (closed) · phone | The closed "⚙ Projects options" label sat over the second card's facts on the right edge. | (in `…f8-disc-tip-and-pill-390.png`) | **fixed** with F1: on phones it's the same small ⚙, on the right cord (`…f11-fixed-phone-gear-390.png`). |
| **F6** | polish | Music grid · desktop | Music › Grid, nothing filtered: years with one release (2025, 2023) leave a lone card on a mostly empty row, so the grid reads gappy. `gridyears=fold` only folds while filtering. | `i7-walk-f6-music-grid-lone-years-1440.png` | **left**: a layout decision (round-up question 1). |

### Safari / WebKit notes
- **F3** was the only Safari-only layout bug (the fieldset/legend difference). Its fix uses no engine-specific code and checks out in both engines.
- Things that differ but are correct: video fullscreen is Safari's own native player, and Esc leaves fullscreen and then the viewer, as designed. `localStorage` / `sessionStorage` work from `file://` in Safari. No sideways scroll and no page errors seen in Safari.
- **Not a page bug, but worth knowing:** WebKit only updates `:hover` / `pointerover` on a real pointer *event*, not when the pointer is warped onto an element. People never notice this; testing tools that "teleport" the pointer will see no hover in Safari.

### Regression re-run (after all fixes)
| Suite | Result |
|---|---|
| `r3i7-music` B1 rows · B3 long-press · M1 cards · M4 volume · M5 search | 474 · 62 · 18 · 39 · 23, all pass |
| `r3i7-projects/tests.js` | 69/69 |
| `r3i7-site` soundtag · panel · sticky · mobile | 99/99 · 42/42 · 26/26 · all states ok. (In the parallel run one sound-tag check, "a tug" (300ms WAAPI), missed its sample under load; it passes 99/99 alone. Not touched by these fixes.) |
| `r3i7-studio` flows · mobile | 153 passed, 0 page errors · 22/22 states clean |
| `r3i7-thoughts` feed · tag browser · tier | 44 · 71 · 69, all pass (tier updated for F5's verb) |
| **new** `r3i7-walk/` qrm (F4) · hist (F9, F10) · legend (F2, F3) · pdrag4 (F7) | 22/22 · 4/4 · 8/8 · panel closes by mouse and by touch |
| `node _tools/overflow.mjs` (17 pages × 18 widths) | clean |
| error sweep (`r3i7-consol/errors.mjs`, 28 pages × 1440/1100/390) | 0 errors |

---

## Round-up questions

1. **Music grid with nothing filtered: years with one release leave a lone card on a near-empty row (2025, 2023).** Options: (a) keep the year rows as they are; (b) fold neighbouring small years into one row with a range label ("2023 – 2025"), as `gridyears=fold` already does while filtering; (c) drop year rows in Grid, and keep years in Timeline only. *Recommend (b): it reuses the fold that's already built for filtering ("2020 – 2023 · 5 projects").*
2. **The ⚙ panel now closes on Esc, but not on an outside click.** Options: (a) keep it this way, so a half-written note isn't lost to a stray click; (b) also close it on an outside click like every other popover. *Recommend (a): it's a review tool and losing a note costs more than one extra click.*
3. **The queue's new ✕** shows only on hover / focus with a mouse (always on touch). Options: (a) as built; (b) always visible on desktop too. *Recommend (a): the rows stay calm, and on touch, where hover doesn't exist, it's always there.*
