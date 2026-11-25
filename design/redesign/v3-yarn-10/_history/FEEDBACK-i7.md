# Iteration 7 · the owner's i6 review — the finishing pass

`v3-yarn-7/` is a copy of `v3-yarn-6/` (i6 frozen; older in `../v3-yarn-*`). The owner's review is word for word in `_feedback/roundup-i6.md`, with three bug screenshots in `_feedback/owner-i6-*.png`. The owner: "we are getting reallly really close … i dont want much more iteartions".

**Three things passed i6's checks that shouldn't have** (see the screenshots). Every check in i6 measured errors, overflow, layering and contrast; none clicked through an interaction or compared columns across rows. i7 adds both (BRIEF-i7 › Checking) and ends with a real-browser walkthrough (W1) before handoff.

Review store: `localStorage["yarn.review.i7"]`. `review/questions-i7.js` is filled in by the orchestrator at the end.

---

## Decided (apply; cut values are removed from the code, not just from ⚙)

| Param | Now |
|---|---|
| `dlayout` | **label**. `side`, `rail` → Earlier; **cut `stack`** |
| `stackchip` | **tag**; **cut `chip`** |
| `mhide` | **feature removed** (always there); delete the option and its code |
| `redbtn` | **twill** (deep → Earlier) |
| `cardmeta` | **facts** (badges → Earlier) |
| `gridyears` | **fold** |
| `trackmatch` | **fade**, restyled (M2) |
| `pwip` | **redesigned** (M3); `seam`/`tag` → Earlier |
| `cardwu` | **short** |
| `apager` | **top** |
| `aboutgo` | **scroll** |
| `collicon` | **stubs**, rail only (T1) |
| `rmention` | **type** only (T6) |
| `wumark` | **bookmark** (T3) |
| `minimarks` | **off** |
| Studio | `frame=ink`, `layout=split`, `confirm=smart` |
| Unanswered questions → recommendation | small-card facts: type word + status icon (but Music cards drop the instrument entirely, M1) · timeline words: drop · status icon-only: only Ongoing · logos on the cream sheet: colour · tier A: lighter felt |

## Build list

### Bugs from the screenshots [each gets an interaction test]
- **B1** Music track rows (`owner-i6-track-rows.png`): the action buttons don't line up between rows (a row with fewer links shifts everything; one row shows a lone button and no duration). Rows get fixed columns: links · notes · add · duration, aligned across every row whatever a song has; and (Music pin 3) "id rather everything be spaced simmilarly" between the notes button and the links. [music]
- **B2** Thoughts' "All tags" browser (`owner-i6-tag-browser.png`): its ✕ is cut off at the top and "cant even close the more tags button". Fix both; it closes on ✕, Esc, outside click, and after picking a tag. [thoughts]
- **B3** Long-press actions (`owner-i6-play-hint.png`): the Play button looks washed out/disabled, and its "Play" hint covers the button beside it. Fix the look; a hint never covers a neighbouring control (place it outward). [music]

### Site [site]
- **K1** Sound tag (Home pin 1): "red should be darker, hover should just change icon not change ot white … makes it hard to tell when clicking if something happened / little white dashed line at the top is meh". Darker red when on; hover only swaps the icon (no colour change); remove the white dashed line at the top.
- **K2** Sticky top bar (Music pin 4): "there are times where theres barely a scroll and the top bar shows i think at minimim it shouldnt show until passin the height of it in scroll distance". Applies to every detail page.
- **K3** Apply the Decided table in the kit; remove `mhide` and every cut value's code.

### Projects [projects]
- **P1** "i accidentally click a stack tag on the items in the timeline items so maybe we disable the tag in those items opened can still have it … its fine on grid": timeline-row stack tags are display-only; grid and the opened item keep clickable tags.
- **P2** "make the text for the status smarter like comple could be "Completed in [End Month]" Paused in etc etc could be interesting to combine those two" → `?statusdate=joined|apart` (Open; joined = "Completed Dec 2024", "Paused since …", "Ongoing since …").
- **P3** "could also try only showing the icon like badges like grid has it on music side as an option" → `?cardfacts=words|icons` (Open).
- **P4** (pin 1) "i liked the previous version where the icon was big enough that it felt like when the tag was active it was coming from the icon rather than surrounding it" → the match highlight on a fact grows out of its (bigger) disc.
- **P5** (pin 2) "make the orange a little lighter for better contrast same with the blue" (School orange, Personal blue; measure).
- **P6** (pin 3) "theres a gap in the ribbon sometimes its small but noticable" (Rust Are We Secure Yet? selected, timeline).

### Music + player [music]
- **M1** "we dont need the piano/beepbox/daw tags since the icons tell u which type it is … (opened one doesnt matter as much)": no instrument fact on cards; the opened item keeps it.
- **M2** `trackmatch=fade`: grey, not tan; no tan highlight around the matched text ("we dont need both").
- **M3** `pwip`: "playing too hard into yarn … really i just want to say WIP the icon … doesnt really give "wip" its just a lasso maybe a hammer or something also instead of red should be something else" → a plain "WIP" mark with a hammer-type icon, not red.
  - **Follow-up (owner, after handoff):** "that was a general statement for ongoing everywhere" → the ongoing status itself is now **WIP · hammer · gold** site-wide (`Yarn.status` label, fact discs, filter chips, `statusDate` "WIP since …", Studio's choices, the Earlier badge/ribbon, the player's glyph = Phosphor `ph-hammer`). The key stays `ongoing`, so URLs and data are unchanged. Cards keep the disc alone (question `wip-cards`).
  - **Follow-up 2 (owner, screenshot of the panel art):** "remove the wip from the music icon" → no WIP label on the player's art (the bar mark, the disc pin and the panel's WIP fact stay). "maybe add an option to change all the player control colors from red to yellow when playing a wip song" → **Open** `?pwipc=red|gold` (kit-wide, default red): with gold, a WIP song turns the player's play buttons, progress ring, scrub, volume, eq bars, toggles and the queue's now-row rope gold (glyphs on gold go ink).
  - **Follow-up 3 (owner, screenshot of "WIP since Sep 2025"):** "the smart year text wasnt done on music" → `statusdate` is a **kit** option now (one Open choice for Projects, Music and the player; a pick saved on Projects moves over once). Music cards, the opened release and the player's facts use `Yarn.fact.statusDate`; the 4-column Music grid keeps the joined fact's words. The player's facts follow the release order (instrument · status · date).
  - **Follow-up 4 (owner, screenshot of the Music timeline):** the strand showed through the passed rings "when selecting a new option as its transitioning" → a moving / fading row becomes its own stacking context, so its knot sank under the z-index 1 strand; the strand is z-index 0 now (kit `.ytl__trail`), so knots stay on top (probe: `~/dev/temp/r3i7-fix/knots.mjs`).
  - **Follow-up 5 (owner):** "clicking items in thoughts on mobile does nothing" (DevTools phone mode) → a touch-only 44px rule made `.ypost__link` `position: relative`, shrinking the card's stretched link to the title line; removed (the whole card is the link, as on desktop). Probes: `thtap2.mjs`, `thinner.mjs` (inner controls still win).
  - **Follow-up 6 (owner):** "combine play and the music icon on mobile … have an option" → **Open** `?mart=apart|badge|cover` (phone rows): the art is the play button, with a red play badge on its corner or a play mark in its middle; the rest of the row still opens the release.
  - **Follow-up 7 (owner):** "on mobile for music and projects lets try … slightly thinner cards so we can fit at least some the description … image should still be on the left" → **Open** kit option `?phrow=row|card` (one choice for both pages, < 960px): card = a 72px image (Music: 56px art) top-left, name, facts on one line, two lines of the description; no ›, the whole card is the link. Pairs with `?mart=badge`.
  - **Follow-up 8 (owner, two screenshots):** "add … the add to queue next to [play] smaller like we have on grid, include that in this option" → `?phrow=card` Music cards end with the grid's foot (small + · play) at the bottom right. "the open music page song list [should] use the same styling as the … playlist … removing the number and having the pause show up over the image instead of the moving lines … the play pause button saying play and pause like [Thoughts]" → new kit part `.ytrkart` (track art: ▶ / ⏸ over the art) for Thoughts' playlist rows and Music's song rows; no number column; the playing row shows ⏸ (Thoughts' bars are gone too, for consistency); the big play button keeps its word (Play all → Pause → Play), no bars.
  - **Follow-up 9 (owner, three notes):** "(x tracks) could try to be single lined with the title" → phone rows put the count on the title's line when it fits (it wraps as one piece). "playing something in a collection should show its description similar to … desktop when hovering" → `?phrow=card` collection cards take the face: the playing song's notes replace the card's text (2 lines, "more" when cut); the face drops the "01" number everywhere. "the credits … easily missable with the line of metadata … under the title with a "made with" … or made by if its not by me" → kit `Yarn.detail({ by })` puts a credit line in the title ("made with **macaron**"); the player's line under the title reads "from … · made with …" / "made by …" (someone else's song); song rows say "made with …"; the "with …" fact is gone.
  - **Follow-up 10 (owner, two screenshots):** "thoughts article sticky top bar needs to prioritize showing the title text over the back button text also needs to be the width of the article page" → kit: on phones the stuck bar's back is its arrow alone (44px, the words kept for screen readers) so the compact title gets the line; below 960px an item page's stuck bar bleeds the page's 14px and spans the whole sheet. "the disk fab gets cut at the bottom … like the bottom part is a different element" → it was: on phones the disc's white rim came from the shell, whose circle ran 7px past the bottom of its box (clip-path can't paint outside the box), so a card's play button showed through the rim's bottom band. The disc now wears its own rim (`.yp-disc::before`, disc view), painted with the record. Probes `abar2.mjs`, `discrim.mjs`, `rimab.mjs`.
  - **Follow-up 11 (owner):** "maybe dropped can have the old red color ongoing used to have" → Dropped's disc is the red felt disc (white trash can).
  - **Follow-up 12 (owner, screenshot mid-filter):** leaving timeline rows "shift to the left and have this black dot … they should just fade" → kit `Yarn.flip`: a leaving item's ghost is cloned into the list's root (the page re-renders), so it lost its list (a bullet), the timeline's `--ytl-x / --ytl-gutter` (shifted left) and its ancestor selectors. Ghosts now ride in empty `display: contents` copies of their ancestors as they were before the change (classes snapshotted pre-mutation, so a grid's year fold can't hide a leaving year), and leave by opacity only (no shrink). Fixes Projects / Music timelines and grids and the Thoughts feed. Probe `ghost.mjs`.
- **M4** (pin 1) Volume: "the ball that shows on hover gets cut off on the left side".
- **M5** (pin 2) "search should also match text in the description".
- B1, B3.

### Thoughts + rankings [thoughts]
- **T1** Collection mark: stubs "look great in the left side bar but in the buttons to go to it it looks bad id remove it there nd just have the text and the arrow".
- **T2** (pin 1) Rail: "we can show a little more things verticaly theres room".
- **T3** Write-up bookmark: "a couple pixels too high".
- **T4** (pin 1) Empty tier: "the drop here text is lazy we can do better".
- **T5** (pin 2) Comment refs: "either the highlight needs to be less rounded or the square icons need to be circles so they fit each other".
- **T6** Mentions: type only; remove tap-to-mention.
- B2.

### Studio [studio]
- **S1** "studio also needs to match the design" + "each page should be resuing the same components not introducing their own unless necessary": Studio is rebuilt on the kit as it stands now (facts, tags, chips, buttons, the sticky top bar + Back, cards, toasts and the floating top layer, the sound tag, the hint, the filter row, the review panel) with `frame=ink`, `layout=split`, `confirm=smart`. Its own components only where nothing in the kit fits, listed.

### After the pages: consolidation [kit, second wave]
- **C1** Reuse audit across every page: replace page-made one-offs with kit components.
- **C2** "make sure the finalized components page is up to date with the things we dont need removed": `kit/components.html` shows every final component and state; anything cut or superseded is gone from it, from `COMPONENTS.md` and from the code.

### Last: walkthrough [orchestrator]
- **W1** "we really need a cuda walkthrough or something just to make sure all interactions are correct": a cua-driver walkthrough in a real browser (desktop window and a phone-sized window) through every interaction on every page, from a written checklist; everything it finds is fixed before handoff.
