# Iteration 6 · end-of-iteration review (Fable)

Reviewed 2026-11-14 against `_feedback/roundup-i5.md`, `FEEDBACK-i6.md`, `BRIEF-i6.md`, `LAYOUT-i6.md` and `kit/COMPONENTS.md`, with i5 (`../v3-yarn-5/`) as the baseline. Nothing in the mock was edited. Scripts, logs and shots are in `/Users/blaqat/dev/temp/r3i6-fable/` (shots in `shots/`).

**Counts: P0 0 · P1 5 · P2 14.**

## What was run

| Check | Result |
|---|---|
| 16 pages × 1440 / 1100 / 390 | 0 page errors, 0 console errors, no sideways scroll |
| `node _tools/overflow.mjs` (17 pages × 18 widths) | clean |
| The mobile agent's floating-layer audit, copied and pointed at my temp folder (44 states × 390 + 360) | all clean: every layer on top, none overlapping, none cut off |
| B1 path with real taps (Music → search → Browse → Collection + SoundCloud + 2020 → close → scroll), with and without a track | i5 reproduces the bug: the layout viewport grows from 390 to **431px**. i6 stays at 390 at every step |
| Memory (CDP `collectGarbage` + `getMetrics`) | no growth: see the table in "Performance" |

## Did the owner's notes land?

Landed as meant (checked by loading and measuring, not by reading the code):

- **B1** fixed. No sideways scroll, floaters stay in place, and the chip you tap no longer gets the black ring (`html[data-yinput]`; the ring returns on the first key press).
- **B2** fixed on the reviewed pages. Pill, search, player, toasts and Music's popovers are children of `.ylayer` (z 100). Hit tests at five points on the disc, pill and knob all land on the floater; nothing in the page has z ≥ 100.
- **X1** Undo sits 8px from the toast's right edge on phone and desktop, including a two-line toast.
- **X2** Sound tag: on = red with a white icon, hover while on = white with the mute icon, no red outline. Reload starts muted and stays muted after the first click.
- **X3** Hint shows 125–152ms after hover and on keyboard focus; Esc dismisses it.
- **X4** Pressing an inner tag or icon scales only that control (0.94–0.95); the card keeps its hover transform. Checked on Projects grid and timeline, Music grid and timeline, and Thoughts collection cards.
- **X5** 0 hover flips at any of 17 positions across each of the four edges, on seven pages (28 edge sweeps). No hover shadow is within 8px of a clipping ancestor.
- **X6, X8** options present; `mhide` defaults to off.
- **L1** label layout: closing row with stack left and buttons right; on the Fishbowl page the text ends at 618 and the row starts at 640, so no gap. `side` and `rail` fold to `label` for a song with no content.
- **L2** count plus a title tip on hover and focus; ends are disabled with a clear label.
- **L3** 0 frames with the title covered and no compact title (4px steps, nine page states); the bar's material does not change during a switch.
- **L7** Back is the first item of the sticky top bar on item pages, rankings, collections and articles, on desktop and phone, in one style. "See the post" is gone.
- **P2** stack tags filter, show the red strike on hover, and clear on a second click. **P3** one empty state. **P4** four `gridyears` values behave as described. **M1** type and instrument chips tint on hover (piano goes grey). **M2** no "no notes" text anywhere. **M3** "Collection - Song". **M4** three `trackmatch` values. **M5** trash can. **M6** Music's passed knots are the red rings. **M7** two treatments. **MP1** search hides while the actions are out; Next is `aria-disabled` and faded on the last track; a press style exists (`kit/player.js:702`). **MP2** "About this song" / "About Revealed".
- **T3** eight tags plus "8 more" opening a searchable browser; years 2026 / 2024 / 2023 are suggested in search. **T5** a click on "On this page" updates the hash and the current entry and flashes the heading even with 42px of scroll. **T8** one rope at a time on Thoughts. **R2** the write-up pill is white (16.6:1). **R5** tier A is 6.1:1.

Not landed, or only half: the five P1s below.

---

## P1 · wrong, or breaks an owner rule

### P1-1 · The opened item is hard-cut when you switch items (Projects and Music timelines)
- **Where:** `projects/index.html?p=sonata`, `music/index.html?item=alphabet-city-collection`; `kit/yarn.js:1797` (`stage.innerHTML = html`) and `:1809`.
- **Saw:** sampling every frame of a switch (56 frames), the old item and the new one are never on screen together: **0 frames**. The old content is gone at frame 0 and the new one starts from opacity 0 (0.23–0.33 at 85ms, 0.95 at 290ms). Three quick clicks leave **6–9 frames with nothing visible** in the panel.
- **Why:** the brief's motion rule is that the outgoing item animates out while the incoming one comes in. T8 was built for Thoughts' rope only; the stage, which is the most used switch on the site, still blinks.
- **Fix:** in `stageSwap`, clone the current child before replacing it, position the clone absolutely over the stage, and fade it out with the opposite `translateY` over the same spring. On a second click, cancel and remove any earlier clone, and start the new item from the current opacity.

### P1-2 · After "Play all", the player bar covers the buttons you just pressed (Music stage)
- **Where:** `music/index.html?item=alphabet-city-collection` at 1440×900, scroll 0; `kit/yarn.css:1383–1388`.
- **Saw:** the panel does not move (top 230 before and after, one value across all frames), which is what the owner asked for. But it spans 230–899 and the bar sits at 794–870, so the closing row (Play all, Add to queue, y ≈ 850) is under the bar. Computed `max-height` on the panel is `none`. `LAYOUT-i6.md` L4 says the player shortens the panel; that only holds once the page is scrolled (at scroll 500 the panel is 116–785 and clears the bar).
- **Why:** the owner's note fixed one problem and exposed another: the primary action disappears on press.
- **Fix:** apply the `--bottom-ui` cap to the panel at scroll 0 as well (`max-height: calc(100dvh - top - var(--bottom-ui))`, scrolling inside), so the top stays put and the closing row stays in view.

### P1-3 · Tapping a ranking item still looks like it does nothing
- **Where:** `thoughts/tier.html?id=tl1`; `thoughts/tier.js:552`, `:631`.
- **Saw:** a tap adds "@Zen " to the comment and ropes the tile with a small "@". The "Mentioning Zen · Write your comment · Clear" bar and the composer are both below the fold at every size (bar top at 1022 / 1014 / 1329 for viewports 900 / 768 / 844 tall). A second tap adds a second "@Zen " ("@Zen @Zen ") instead of removing the first, and the tile has no `aria-pressed`.
- **Why:** the owner's note was "nor does clicking an item do anything". The only thing in view is an 8px badge.
- **Fix:** pin the "Mentioning …" bar to the bottom of the board (sticky) or show it as a toast while the composer is off screen; make the tile a toggle (`aria-pressed`, second tap removes the mention).
- Typing works well: `@he` opens a labelled listbox with `aria-activedescendant`, Enter inserts, Esc closes and keeps the text, and posted mentions are buttons that rope their tile.

### P1-4 · Cards and the opened item order their facts differently
- **Where:** cards via `Yarn.cardMeta` (`kit/yarn.js:516`); opened item in `projects/pj-core.js:205–206` and `music/music.js:521`.
- **Saw:** on the Projects timeline the card reads "Personal · Ongoing · Sep 2025 – now" and the panel beside it reads "Ongoing · Personal · Dec 2023 – now". Music: card "BeepBox · Complete · date", panel "Complete · BeepBox · date".
- **Why:** O1's point was that cards match the opened item, and the owner's reason ("status and year really goes together") applies to both. `LAYOUT-i6.md` still lists status first for the opened item.
- **Fix:** type · status · date in both, or ask (question 3 below).

### P1-5 · The round-up page has no questions
- **Where:** `review.html`; `review/questions-i6.js:3` (`questions: []`).
- **Saw:** Decisions shows "0 of 18 picked" with the right 18 options, defaults and "try it" links. Questions shows "No questions." `LAYOUT-i6.md` alone ends with three round-up questions.
- **Why:** the owner answers questions on this page; as delivered there is nothing to answer.
- **Fix:** fill `questions-i6.js` from the agents' reports and the section at the end of this file.

---

## P2 · polish

1. **Icon-only facts still use the slow native tooltip.** `kit/yarn.js:522–526` gives `.yfact--icon` a `title`. On Music phone rows and narrow grid cards both the instrument and the status are icon-only, so touch has no way to learn them. Fix: give them the kit hint on hover and focus, and on touch keep at least the instrument's word.
2. **Projects and Music grid cards differ.** Projects shows the type with its word; Music's grid at 1440 shows two bare discs. Pick one rule per card width.
3. **Grid alignment, Projects.** At 1440 the stack row sits at 204px in a card with link icons and 212px in one without (blaqat.net vs FiTR; Sonata vs Fishbowl). At 1100 Sonata's long tag wraps and its stack row sits at 196 against Fishbowl's 250. `projects/projects.css:135`. Fix: fixed-height foot row, stack and icons on one baseline, tags truncated to "+n".
4. **Grid alignment, Music.** Collection card titles start at 14px, single cards at 16px in the same row (four rows at 1440). Thoughts' collection: Ghostty's foot is 2px higher than its neighbours.
5. **Music timeline row wraps.** "peppy snowday" (Dec 2022 – Jan 2023) breaks its facts onto two lines at 1440 and is taller than every other row.
6. **Sound tag hint contradicts the icon.** Hovering while on shows the mute icon and the hint "Sound on". Use the action: "Turn sound off".
7. **S2 rule on non-white surfaces.** Stack logos stay in colour on the item page, where they sit on the cream sheet, and on a pressed tag (chip colour). Red search tokens do switch to one colour. See question 5.
8. **Phones: the site nav is last in tab order.** The pill moves to `.ylayer` at the end of `<body>` (`kit/yarn.js:2747–2759`), so keyboard and screen-reader order is brand → sound → every row → nav → search. Fix: keep a visually hidden nav landmark in place, or point the skip link's sibling at the pill.
9. **Back lands in view but not in focus.** From a pick, Back returns to `#post-p1` with the post visible; `document.activeElement` is `body`. Focus the post (`thoughts/stitched.js`, `showPost`).
10. **Round-up names every Projects option "Projects (grid)".** `_tools/review-data.mjs:24–26` lists `projects/index.html` twice and `review/roundup.js:25` keeps the last name. Layout, stack and card meta read as grid-only.
11. **`mhide` is offered where it does nothing.** It is under Open on desktop and on Home (`kit/yarn.js:2979`), and its "try it" link opens `home/index.html?skip`. Limit it to phone width and add a `TRY` entry for a list page.
12. **Article previous/next is at the end of the page by default** (`apager=bottom`), while every other detail page has it in the top bar. It is an Open option by the owner's request; see question 4.
13. **Music's DOM is about ten times Projects'.** CDP reports 42,650 nodes on Music at 390 (50,632 with a track) against 4,036 on Projects, with only 1,820 elements in the document. i5 is the same (42,349), and it does not grow, so this is not a regression. I did not trace the source.
14. **Studio is outside the floating layer** (pill z 50, `.st-fab` z 60, `.st-toasts` z 950; `.ylayer` empty). Out of scope this round; do it when Studio is reviewed.

---

## ⚙ panel and `review.html`

- Open holds exactly the 18 open decisions: `mhide`, `dlayout`, `stackchip`, `redbtn`, `cardmeta`, `gridyears`, `pwip`, `trackmatch`, `cardwu`, `apager`, `aboutgo`, `collicon`, `minimarks`, `rmention`, `wumark`, and Studio's `frame`, `layout`, `confirm`.
- Decided options are untagged under Earlier. Cut values fall back to the default with no error: `dlayout=i4` → label, `mactive=top|count` → start, `mhide=nav` → off. `ptypelabel` and `stkicon` are gone from the panel.
- Saved choices work: picking "Left rail" on Projects writes `yarn.review.i6`, applies on Music with no param in the link, loses to a param in the URL, shows as "1/18" on the round-up, and appears in the copied Markdown. A planted `yarn.review.i5` store is ignored.

## Accessibility

- No icon-only control lacks an accessible name on the seven pages checked (Projects, Music, Thoughts, a collection and the ranking).
- Focus rings are visible on every Tab stop at 1440 and 390 (the search field rings its wrapper).
- New text passes 4.5:1: stack tags 6.55, pressed tag 14.4, mention chips 14.4, "Write-up" 6.6, deep red button 5.93. The twill red button and the "Ongoing" tape are 4.86 on the base colour; the light threads are the known 4.27, which `redbtn=deep` fixes.
- Reduced motion: only 260ms transitions run after a switch, on the two pages sampled (Projects, Music).

## Performance

| Repeated action | Nodes | Listeners |
|---|---|---|
| 60 stage swaps (Projects) | +153 (a different item is open) | 0 |
| 80 hint hovers | −21, one `.ytip` in the page | 0 |
| 90 stack-tag toggles, 40 chip toggles | 0 | 0 (173 throughout) |
| 40 searches typed and cleared | +40 | 0 |
| 20× search → Browse → filter → close → toast (phone) | +2 | 0 |
| 15 long-presses on the disc | 0 | 0 |
| 25× tag browser open, type, pick, close | +25 | 0 |
| 40 mention cycles | +91 | 0 |
| 60 contents clicks | 0 | 0 |

---

## For the owner

**Clearly better than i5:** the phone no longer breaks after Browse → SoundCloud, and the floating controls now sit above everything on every page I checked.

Round-up questions:

1. **Switching items in the timeline.** The old item vanishes and the new one fades in. Cross-fade them? · *Cross-fade (recommended)* · Leave it.
2. **Opened item layout** (`dlayout`). *Label first (recommended)* · Left rail · Right rail · Stacked. If you pick the left rail, cut the right rail: it is the same idea mirrored. Cut Stacked either way.
3. **Order of facts.** Cards say type · status · date; the opened item says status · type · date. · *Type · status · date in both (recommended)* · Status first in both · Leave them different.
4. **Article previous / next** (`apager`). · *In the top bar, like every other page (recommended)* · At the end of the article.
5. **Stack logos off white.** On the item page the logos sit on the cream sheet and stay in colour. · *Colour on the sheet too, one-colour only on red and dark (recommended)* · One-colour everywhere except white cards.
6. **Tapping a ranking item** (`rmention`). · *Keep tap + type, but show "Mentioning …" where you tapped and let a second tap undo it (recommended)* · Type only.
7. **Card facts** (`cardmeta`). · *Facts (recommended)* · Badges. Cut Badges.
8. **Stack in the opened item** (`stackchip`). · *Tags (recommended)* · Felt chips. Cut the chips: you said they should not feel like buttons.
9. **Bottom items on scroll** (`mhide`). · *Always there (recommended)* · Everything hides. Cut the option: you said it fights the user.
10. **Red buttons** (`redbtn`). · *One shade deeper (recommended; it passes contrast on every thread)* · Brand twill.
11. **Icon-only facts on phones.** Music rows show two bare discs. · *Keep the instrument's word, status as an icon (recommended)* · Both icons · Both words.

---

## Resolution (orchestrator, after the review)

- **P1-1 fixed** (review-fix agent): `stageSwap` cross-fades. A clone of the old item fades out on the same spring the new one comes in on. Frame sampling shows 0 blank frames and both items on screen for 5–6 frames; three quick clicks leave 0 blank frames and at most one clone. Reduced motion is a plain swap.
- **P1-2 fixed** (orchestrator): the stage's height cap now also uses where the wrap rests before you scroll (`--ystage-nat`, `stageNat()` in `kit/yarn.js`). With the bar open on Music the panel ends at 756 and the bar starts at 794.
- **P1-3 fixed** (review-fix agent): ranking tiles toggle (`aria-pressed`; a second tap removes that mention). The "Mentioning …" bar pins to the bottom of the screen and links to the composer.
- **P1-4 fixed** (orchestrator): the opened item's facts read type · status · date on Projects and instrument · status · date on Music, the same order as the cards.
- **P1-5 fixed** (orchestrator): `review/questions-i6.js` holds 16 questions taken from this review and the agents' reports.
- **P2-1, 3, 4, 9 and the tag browser ✕ fixed** (review-fix agent). **P2-5 partial:** when a row would wrap, the whole timeline drops words (status, then type) and shortens cross-year ranges; at 960px three Music rows are still 5–7px over. This went to the owner as a question.
- **P2-6 fixed:** the sound hint names the action ("Turn sound off" / "Turn sound on"). **P2-10 fixed:** the round-up's Projects options are named "Projects". **P2-11:** `mhide` keeps its "(phones)" label and now has a try link to a list page.
- **Left as is:**
  - P2-2 (one rule for small cards), P2-7 (logos on the cream sheet), P2-12 (`apager`): all owner questions.
  - P2-8 (the phone nav is last in tab order since it moved to the top layer): next pass.
  - P2-13 (Music's DOM weight): the deferred performance pass.
  - P2-14: Studio, when it's reviewed.
