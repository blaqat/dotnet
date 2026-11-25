# Review · iteration 5 (Fable, end of iteration)

Read against `FEEDBACK-i5.md`, `BRIEF-i5.md`, `LAYOUT-i5.md`, `thoughts/CONCEPTS.md`. Loaded in headless Chromium at 1440×900, 1024×768 and 390×844 @2x (touch). Scripts and shots: `/Users/blaqat/dev/temp/r3i5-fable/` (`sweep`, `probe1`, `phone1`, `mem`, `mem2`, `mem3`, `a11y`, `inter`, `snd`, `tabs`, `rib`; shots in `s/` and `v/`).

**Counts: P0 0 · P1 7 · P2 12.**

Baseline: 162 loads (54 URLs × 3 widths, every new option) with 0 page errors and 0 console errors. No mock file was edited.

## What I could not check

- **Real audio.** Everything ran on the demo clock (`?demo=`), so no `<audio>` element played and no AudioContext was created in the memory runs. Audio-node clean-up is unmeasured.
- **Feel.** Interruptible motion, the letter ripple and purple falling notes (H2), the stack-tag shake (H3) and the contact hover area (H4) were checked in code and by state, not by watching them move. H4 in particular needs the owner's hand.
- **Hover-only-lifts** was checked by scanning stylesheets for `:hover` rules that draw the rope outside Home (none found) and by spot shots, not by hovering every element.
- **Screen readers** were not run; names and roles were read from the DOM.

---

## P1 · clearly wrong, or against an owner rule

### 1. Thoughts' "All" is not a circle on desktop (G3)
- **Where:** `thoughts/stitched.html` at 1440 and 1024 · `thoughts/stitched.js:186`.
- **Saw:** the rail's "All" is a full row, 250×40 with a 12px radius ("All 22"). Projects and Music are 40×40 with a 999px radius. On phones Thoughts does get the circle (34×34).
- **Why:** G3 says the circle goes on every list page. This is the one page that missed it, and the owner will see it straight away.
- **Fix:** either make the rail's first control the same 40px circle sitting above the type rows, or tell the owner plainly that the rail keeps a row because its siblings are rows, and let them choose. Right now it is neither decided nor listed in ⚙.

### 2. Collection tabs have an 18px tap strip, on phones too (M5)
- **Where:** `music/index.html`, list and grid, all widths · `kit/yarn.css:1970` (`.yfolder__tabs { top: -19px; height: 40px }`).
- **Saw:** each tab is 40px tall but the card's `.yfolder__open` button covers the lower 22px. Hit-testing the centre column gives 18 clickable pixels out of 40, at 1440, 1024 and 390. On phones that is a 100×18 touch target that starts playback. Playwright could not hover a tab's centre at all.
- **Why:** the owner called this "on the edge of bad ux… requires too much precision". i5 removed the queue tip but left the precision problem, and on touch it is well under 44px.
- **Fix:** on touch, make the whole strip open the collection (the code already does this for `.is-dense` strips at `kit/yarn.js:2690`) and leave play to the card's button. On desktop, raise the peek to about 28px or give the tab an invisible hit area reaching 12px above it.

### 3. The ⚙ panel shows six site-wide "open" options on every page (G1)
- **Where:** every page · `kit/yarn.js:2583-2589`.
- **Saw:** `browseicon`, `uisnd`, `mhide`, `mactive`, `toast` and `stkicon` are listed under Open everywhere. The ranking page and both item pages have no Browse button, no filters and no stack icons, yet show all six. Home and the ranking page have nothing of their own open and still show six. Three of them only do anything on phones but are shown at 1440.
- **Why:** the owner asked to "hone in on the actual open design decisions". Half of what they see under Open on most pages does nothing there.
- **Fix:** give each kit group a `when` test (page has a filter row, a stack icon, a player, is phone-width) and drop the group when it fails. Label the phone-only ones "phones" and collapse them at desktop widths.

### 4. Card meta and open-item meta are two grammars on one screen (P3.3.1)
- **Where:** `projects/index.html` and `music/index.html`, timeline + stage.
- **Saw:** in the card, status is an outlined pill ("Complete"), the date is mono ("Mar – Aug 2025"), and stack is bare icon + text. In the stage beside it, status is a disc + label with no pill, the date is in the display face, and stack is a pressable chip. Music cards show the same split. The player head uses the stage grammar.
- **Why:** the owner's complaint was "everything is everywhere… different icon and fonts". The open item is now clean, but the mismatch moved to card-versus-stage, where the two sit 40px apart.
- **Fix:** render card meta with `Yarn.fact.*` too (a compact size), so status, type and date are one family everywhere. If the pill is wanted on cards, say so and list it as a decision.

### 5. Thoughts articles keep a bottom Older/Newer pager
- **Where:** `thoughts/stitched.html?view=article&id=a1` · `thoughts/stitched.js:564` and `:597`.
- **Saw:** `.ypager` with two cards at the foot of every article. Projects and Music item pages have none, and their previous/next is in the top bar.
- **Why:** the owner rule says previous/next lives once, in the sticky top bar. `LAYOUT-i5.md` keeps the pager "for Thoughts" without the owner having said so.
- **Fix:** move it to the article's top bar with the same `?dnav=` control, or ask the owner whether articles are an exception.

### 6. Ongoing looks different on Music than on Projects (G5)
- **Where:** `music/index.html` (Revealed, and one more) against `projects/index.html`.
- **Saw:** Projects cards carry the corner ribbon ("ONGOING", 102×22, overhanging the edge). Music cards carry a small red flag inline in the meta line; there is no `.yribbon` on the Music page at any width.
- **Why:** G5 is filed under General. The build reading narrowed it to projects, so two releases still show the treatment the owner asked to move.
- **Fix:** use the same `.yribbon` on Music cards and follow `?ongoing=`.

### 7. With the default `mactive=end`, the active filter is off-screen on phones (MO5)
- **Where:** `projects/index.html?stack=Python` and `music/index.html?kind=single` at 390 · `kit/yarn.js:85`.
- **Saw:** after picking Python in Browse, the pressed chip sits at x=531 in a 390px-wide row. You must scroll the chip row sideways to see or remove it. The only visible signs are the ✕ circle and a "1" on Browse.
- **Why:** the owner wanted filters "easy to unfilter". ✕ clears everything, but removing one of two filters means a hidden scroll.
- **Fix:** make `start` the default (the pressed chips sit right after ✕), or scroll the row to the active chip when the sheet closes.

---

## P2 · polish

8. **Music's page weight: 49,267 nodes for 2,115 elements** (`music/index.html`; `kit/swatch.js:161-169`). 30 knit swatches are inline SVG data URIs of about 18.7KB each; inline `style` attributes total 567KB of a 767KB document, and Chromium holds 34 documents. Projects is 3,695 nodes. This was already in i4 (48,741), so it is not an i5 regression, but it is my best lead for the memory spikes the owner saw. Fix: draw each motif once to a small canvas and reuse a blob URL, or put each URI in one CSS custom property and reference it.
9. **Phone "All / ✕" circle is 34×34** (`kit/yarn.css:653`, `:2153`). Same size in both states, so MO7 is met, but it is the clear-everything control and its neighbour Browse is 44×44. Make it 44.
10. **Sound toggle is 42×34** on phones (`kit/yarn.css:1568`), in the corner where the sheet clips 6px of its hover shadow.
11. **Phone toast cuts its message** (`kit/yarn.css:2176`, `nowrap` + ellipsis): "Added marmalade cafe to the qu…". Allow two lines, or shorten to "Queued **marmalade cafe**".
12. **Type and instrument chips hover differently.** Projects washes the chip background; Music colours the text. Pressed is ink on colour for Projects, white on colour for Music. Each is defensible for contrast (yellow text fails), but pick one rule: the wash works for all six colours.
13. **Hover shadows still cut in four places** (`shadowclip.mjs`): Home contact pills under the section buttons (11px); the write-up pill under "Read" in the Thoughts feed (11px); the sound tag at the sheet edge (6px); item-page media thumbs at 390 (2px). The folder-tab reports are the card overlap in finding 2.
14. **The ribbon lies over the image in the grid** (`projects/index.html?view=grid`): 73×22 of the thumbnail is covered. It is clear of titles and buttons at every width.
15. **A saved "sound on" needed two gestures on Home.** After a reload the toggle rightly shows muted (H1 works). On Projects the first click turned it on; on Home a click did not and the next key press did. Worth one look in a real browser.
16. **No instrument on Music list cards.** With M1 done, cards carry no instrument badge at all; the colour only lives in the artwork. Fine if intended, but M2's "easily identifiable on items" then rests on the art alone.
17. **Projects at 1024**: timeline cards wrap to four meta lines (status, type, date, stack each on a row) and titles wrap to make room for the ribbon. Consider dropping the stack line under about 1100px.
18. **The long-press actions cover the search FAB** on phones: Pause lands at 236,772, exactly on the FAB at 239,769. It is temporary and closes on scroll, but the arc could start one step higher.
19. **Player repaints every frame while playing** (`kit/player.js:1753`): 121 rAF callbacks per 2s, setting a custom property and an SVG attribute on every scrubber, including ones that are not on screen. Cheap, but paint only the visible view.

---

## What held up

- **Memory, repeated use.** 25 rounds each of: player disc ⇄ bar ⇄ panel (desktop and phone), switching timeline items, toggling filter chips on four pages, quick-return scrolling on three pages, toasts, play/pause, FAB + Browse open/close, Home hovering. Nodes, DOM size and `JSEventListeners` were identical before and after in every run; window/document listeners did not grow; heap moved 0.02–0.27MB. 100 filter toggle pairs on Projects stayed at 3,562 nodes and 121 listeners. The timeline rebuilds its ResizeObserver on each render but disconnects the old one.
- **Idle.** No rAF loop at idle on any page. Music's 81 `mu-eq` animations are paused until a button is playing and animate `scale` only.
- **Accessibility.** No control without a name on any page at either width. Sound is a button named "Sound effects" with `aria-pressed`. Contact circles, nav arrows ("Next project: …") and icon-only badges are named. Every tab stop shows a 3px outline except the search input and the Thoughts post-card links, which have `outline: none` on the element itself; I assume their ring is drawn on the wrapper but did not confirm it. Reduced motion: 0 running animations on all four pages checked.
- **Contrast.** Ink on work yellow 9.93, on school orange 6.35, on personal blue 5.38; white on BeepBox purple 6.47, on DAW blue 5.97, on piano 14.62. The yellow disc against the card is only 1.68, so it relies on its label or glyph, which is why `ptypelabel=icon` is the weaker option for Work.
- **Items met as meant (seen on the page):** G2, G6, G6.1, H1, H5, P1, P2, P3.1, P3.2, P3.3.2, P3.3.3 (strike draws on a pressed stage chip), P3.3.5, M1, M5 (the tab tip is the title only), M7, M8, MP1, MP2, MP3, T1, T2.1, T2.2, MO1, MO2, MO3, MO4, MO6, MO7, MO8.
- **Present in code, not looked at:** G4 (the Browse icon has a shake rule and no rotation), G8 (`kit/sound.js:617` returns early while the player plays), M3's no-shift claim (the bars sit inside the button; I did not get a clean before/after measurement), M4, M6's `disclose` and `peek` in use, T2.3 (`kicon=bare`).
- **Quick return.** Hides at scrollY 735, returns after 120px up, and sticky year pills move under it (74px) instead of behind it.

## For the owner to decide or cut

- **Cut `dlayout=i4`** from Open. It is a comparison, not a candidate; move it to Earlier.
- **Cut `mactive=top`** (the i4 strip the owner asked to remove) and **`mactive=count`** (hides which filters are on). Decide between `start` and `end`; I recommend `start`.
- **`dnav`:** keep `count`. `arrows` hides the neighbour's name behind hover, and `labels` collapses to arrows under 560px anyway.
- **`dlayout`:** `stack` as recommended. `rail` is worth keeping only for the item page.
- **`ptypelabel=icon`:** cut. The yellow disc alone is too faint on a white card.
- **`pickart`:** `link`, as CONCEPTS recommends; one rule for every artifact.
- **`songlist`:** `disclose`. `peek` is a hover list, which has no good touch equivalent.
- **`browseicon`, `uisnd`:** small enough to just decide (shake, quiet) and move to Earlier.
- **Collection tabs on phones:** decide whether they play or only open the collection (finding 2).
- **Studio** still has three options under Open that nobody has reviewed; either review Studio or collapse them.

## Clearly better than i4

The opened item reads as one thing now: one fact line, one chip row, one link row, title at the corner, and the same shell on the stage, the item page and the player head. The ⚙ panel's three sections, the top strip with quick return, and filters out of the phone search field are all real gains in usable space.

---

## Resolution (orchestrator, after the review)

- **P1-3 ⚙ noise:** fixed. Kit groups take a `when` test, checked each time the panel opens: Browse icon and active-filter placement only on pages with a filter row, stack icons only where stack chips exist. The ranking, item and Studio pages no longer list them.
- **P1-7 active filter off-screen:** fixed by making `mactive=start` the default (pressed chips right after ✕). Scrolling the row to the end would push ✕ out of view instead. `end` stays as the second option.
- **P1-2 tab tap strip:** measured again, counting the tab's invisible pad above the peek. The real hit area is 31px on desktop and 33–43px on touch; a year pill above the first card of a year covers part of the pad. The 18px figure leaves the pad out. Left as is. Whether tabs on phones should play or only open stays an owner question.
- **P1-6 Music ribbon:** tried. The ribbon lands on the play / queue buttons (desktop) and the "4 tracks" button (phone), because Music cards keep their controls where Projects cards have room. Reverted; it goes to the owner as a decision.
- **P1-1 Thoughts "All" row, P1-4 card vs stage meta grammar, P1-5 the Thoughts article pager:** owner decisions, listed in the report.
- **P2-9 / P2-10 phone targets:** All/✕ already had a 44×44 hit area. The sound tag measured 1×1 because the closed ⚙ panel sat on top of it at the top right. On phones the closed ⚙ now waits on the right edge lower down; the sound tag hits 44×44.
- **P2-11 toast:** wraps to two lines (kit `.ytoast__t` and Music's `.mu-toast__t`).
- **Studio ⚙:** Network and Publish result moved to Jump to; the kicker and colour previews (decided in Thoughts) moved to Earlier.
- **Left for the perf pass:** P2-8 (Music's 49k nodes from inline swatch SVG data URIs, the best lead for the memory spikes) and P2-19 (the player's per-frame scrubber paint).
