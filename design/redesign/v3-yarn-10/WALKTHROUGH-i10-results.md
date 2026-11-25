# Iteration 10 · walkthrough results (the site's design pass)

**Browser: mostly not Safari.** The brief asked for real Safari driven with cua-driver. I launched Safari into one new window (it wasn't running), but the Mac's **screen was locked and its display asleep** from 04:55 to about 07:30 (`CGSSessionScreenIsLocked = true`, "Display Asleep: Yes").
- Window and desktop captures came back black or failed, and the window's accessibility tree didn't resolve, so no click or key could be sent.
- Safari's WebDriver route needs "Allow remote automation", a Safari security setting I didn't change on the owner's behalf. I didn't try to wake or unlock the Mac.

**So the walk ran in headless Chromium** (the repo's Playwright shell), driven like a person: typing in the search, clicking tabs, chips, ▶ and the bar's buttons, Tab / Space / Enter / Esc, touch taps in a 390 × 844 touch context. I read fresh 1:1 screenshots of every screen at 1440, 1000 and 390 wide in both looks (plus blurred copies of the owner's screen). Shots are in `~/dev/temp/r3i10-walk2/shots/`, and the scripts (`w1`–`w5`, `probe-*`) are next to them. **The checklist below is Chromium.**

**A short Safari pass at the end, by observation only.** About 07:30 the Mac was unlocked and someone was at it.
- **Why observation only:** Safari refused accessibility presses on page links ("element outside target window"), and a background pixel click landed where the real pointer was: it opened a different hub link, inside the walk's own window. The only route left was foreground input, which moves the pointer and takes focus from whoever is using the Mac, so I didn't use it.
- **How:** the hub (`tour-safari.js`) played the WebKit-sensitive pages in a full-size iframe, each labelled, and I read window captures (`shots/safari-tour-*.png`). It took two View › Reload menu actions on the walk's window, and nothing else.
- **Seen in Safari (WebKit):**
  - F2 at 1440: Alphabet City's meta wraps, Revealed's doesn't, and the row's descriptions start on one line.
  - The owner's screen ("shadow", glooming shadows playing) at 1000 in both looks matches Chromium: section = the tinted card, purple tab, ▶ and bar ▶; ink = the red rope, tab, ▶ and bar ▶; every other ▶ a plain disc.
  - Allo round renders its rounded terminals the same as Chromium (`shots/allo-compare.png`).
- **The window:** closed at the end with its own close button (accessibility press). Safari is left running with no windows, as i9's walk left it. I touched no other window.

---

## Findings (all fixed; each has a probe in `~/dev/temp/r3i10-walk2/`, listed in `regress.sh` under "walk2")

### F1 · Shuffle played only part of what's shown
- **What:** on the owner's screen ("shadow", 6 songs), Shuffle often reached only 1–5 of the 6. Over 12 presses, the songs reachable were 5, 3, 1, 2, 1, 4, 1, 4, 2, 5, 5, 5. ▶ on the last card with shuffle on reached 1 of 6. The player's Up next listed 1 song.
- **Why:** `YarnPlayer.play(t, queue)` with shuffle on put the queue in its given order, set the index to `t`, then shuffled only the songs *after* `t`. Music's Shuffle picks a random first song, so every song before it in the set was left behind the play head. (i8's "Shuffle all" had the same bug; i10's "plays exactly what's shown" made it visible.)
- **Where / fix:** `kit/player.js` `play()`: with shuffle on, the started song leads and every other song of the set follows it in a random order. `S.base` keeps the set's own order, so turning shuffle off still restores it.
- **Test:** `probe-shuffle.js`: 12 presses reach 6 of 6 every time, Shuffle again gives a new order (12 orders in 12 presses), the opened player lists 5 up next, and ▶ on the last card with shuffle on still reaches all 6. Before the fix it was 1 pass, 3 fail; after, 4 / 4.

### F2 · Descriptions in a grid row didn't start on one line (4-column grid)
- **What:** from 1320px the grid has 4 columns, and a card's text column is about 192–211px beside the 48px art. "✓ Completed Aug 2025 · 4 tracks" needs 215px, so the meta wraps to a second line. At 1440, Alphabet City, the 5th and 3rd Tournaments and VGM Class Final Project wrapped; at 1366 seven cards did, and "Alphabet City Collection" also wrapped its title. Those cards' descriptions started 20–40px lower than their row-mates'. Revealed fits by 0.4px in Chromium, so in Safari it may well wrap too. With `font=allo`, more cards wrap. This broke "one meta line" and the owner's "elements aligned consistently". 1100 and 1000 (2 columns) are unaffected.
- **Where / fix:** `music/music.js` `bandRows()` already lines up the titles in a row. It now also gives every card in a row the tallest head in that row (title + meta + art), like a subgrid. It re-runs on filter, search, resize, open and close, and once the fonts have loaded.
- **Trade-off:** in a row where one card wraps, the others show a blank line between their meta and description. I judged level text across the row the better read. The alternative is a design call (a narrower meta, the count moved, or 3 columns at 1320–1500), so I left it.
- **Test:** `probe-meta-rows.js`: descriptions level (±1px) in every row at 1320 / 1366 / 1440 / 1100 / 1000, both looks, after a search and its ✕, after resizing 1440 → 1100 → 1366, and with `cardart=left`. Before: 8 of 12 fail. After: 12 / 12.

### F3 · The player's ▶ stayed a solid accent while paused, and after a reload on every page
- **What:** pause the song (with the card's ▶, the bar's ▶ or Space) and the card correctly drops to a ring on ▶ and a thread on its tab. But the bar's ▶ stayed the solid live fill (purple / red). After a reload the paused song is restored, so **every page loaded with a solid purple / blue / gold / red ▶ at rest**, the loudest thing on screen while nothing played. That breaks R2 ("nothing at rest is a solid accent") and contradicts the card's own paused state. No suite caught it: `t-i10-live` counts accents inside `.mu` only ("nav + player are system's"), and `roles.mjs` checks the player only in its playing demo.
- **Where / fix:** `kit/player.js` (the L5 block): while not playing, the bar's ▶ and the disc's ▶ bubble are the player's one primary action at rest, the ink fill (as the kit's `Yarn.playBtn` primary). Only while a song plays are they the live fill. This also covers a WIP song (its gold is its live colour). Hover on the paused disc bubble stays ink.
- **Test:** `probe-player-rest.js`: playing = live, paused (mouse) = ink, Space plays again = live, after a reload = ink on Music, Projects and Thoughts, both looks, and a WIP song gold → ink. 13 / 13.

### F4 · `review.html` said "Iteration 9"
- **What / where / fix:** the round-up's header line read "Iteration 9 · your ⚙ picks…". It now says Iteration 10 (`review.html`). The copied Markdown was already "Yarn i10". The gallery `index.html` still says Iteration 9 too, but that's the orchestrator's to rebuild at the end, so I left it.
- **Test:** `probe-review.js`: header says Iteration 10, no "Iteration 9" on the page, the 9 Open options and 12 questions show, Copy everything (mouse) gives "# Yarn i10 · review round-up", and Enter reports its status. 6 / 6.

### F5 · The search field showed no focus edge after a click or tap; the phone's search slot lost its stitch
- **What:** two causes, one symptom: you couldn't see that the search had focus unless you'd arrived with Tab.
  1. L1 changed the search's focus edge from red to `var(--focus)` (on `.ysearch:focus-within` and on the phone slot's stitch). After a mouse click or a tap the kit sets `data-yinput="pointer"`, which makes `--focus` **transparent**. The kit exempts raw inputs from this (they keep ink), but the search draws its edge on its wrapper. So clicking into the desktop search, or tapping into the phone's floating search, showed no edge at all. i8 always showed it (red).
  2. On the phone the slot *is* the field: its stitch carries the edge. But calm stitches painted the field white with a hairline on top of it, so the slot's dashed stitch disappeared, and the focus edge only peeked out around the chevron (a broken-looking ring).
- **Where / fix:** `kit/yarn.css`:
  1. Next to the pointer rule: `.ysearch:focus-within` and the slot holding it keep `--focus: ink` after a click / tap, as text inputs already do.
  2. In the L2 calm block: in the phone slot (`.yfab__panel .ysearch`) the field's own chrome steps back (no fill, no hairline), as the slot's comment intends.

  Desktop at rest is unchanged: white field + hairline under calm.
- **Test:** `probe-fabfocus.js`:
  - Phone 390 on Music / Projects / Thoughts, both looks, calm and full: open → the dashed stitch shows and the field doesn't cover it; tap into the field → a solid ink edge.
  - 600 wide with the keyboard → ink edge.
  - Desktop: calm white + hairline at rest, an ink ring after a mouse click.

  Before: no edge, transparent. After: 18 / 18.

---

## Checklist

### Music (the owner's screen first)
- [✗→✓] **The owner's screen** (grid, 1000, type "shadow", click tab 02, which plays glooming shadows). With eyes half closed (`shots/w1-blur-trio.png`: section · ink · i8), the playing card is the one different thing in both looks:
  - **Section:** the card body in the purple tint, its ▶ (bars), its tab and the bar's ▶ in purple.
  - **Ink:** a red rope on the card, red ▶, tab and bar ▶.

  Every other ▶ is a plain white disc. In i8 all three ▶ were the same solid red, plus a red All chip, nav rope and Grid rope, and you can't find the playing card blurred. **Pause → F3** (the bar's ▶ stayed solid), now fixed (`shots/w1-section-1000-paused.png`). Shots: `w1-{section,ink,i8}-1000-{found,playing,paused}.png`.
- [✓] **Results line**:
  - Typed one key at a time: "25 releases · 51 tracks for “s”" → "10 · 24 for “sh”" → "3 releases · 6 tracks for “shadow”".
  - "+ BeepBox" → "… · BeepBox"; "+ Complete" → "… · BeepBox · Complete"; BeepBox off.
  - ✕ → "26 releases · 52 tracks"; "zzzzqq" → the line steps away.
  - (A hovered "on" chip shows a strike-through: the kit's intended "click removes it" hint, not a bug.)
- [✗→✓] **Play**:
  - It queues exactly the 6 shown songs in order; the opened player's Up next lists the other 5 (`shots/w2-queue-panel-section.png`).
  - "alphabet" plays all 4 of Alphabet City (the collection matched itself).
  - next × 7 stays inside the set and stops at its end.
  - **Shuffle → F1**, fixed.
- [✓] **`?shuffle=player`**: the results line keeps only ▶ Play; the bar's shuffle toggle shows and turns on (the on tint) (`shots/w2-shufp.png`).
- [✓] **▶ on a card**:
  - It starts there and plays on through the shown set.
  - Pause → a ring on ▶ and a thread on its tab; play again → the card goes live.
- [✗→✓] **Card anatomy**:
  - Gutters measured from the cards' own edges are **24 across = 24 down** at 1440 / 1100 / 1000 in both looks (`probe-gaps.js`).
  - One left edge; art top-right; `cardart=left` top-left with the text in one column; tabs inside the box; equal heights per row.
  - **Descriptions in a 4-column row → F2**, fixed (`shots/f2-grid-1366.png`).
  - Phones use the decided row form (art left), which is the phone row, not the card grammar.
- [✓] **Timeline**: click a row → stage; ↓ moves to the next release; ▶ on a stage song row → the row, its tab, its ▶ and the song row are the only live marks, in both looks (`shots/w4-tl-playing-{section,ink}.png`). *(long-press B3 menu: not walked; `t-b3-acts.js` 62 pass)*
- [✓] **Release page** (`item.html`: Play is the ink primary), the player panel (`?player=panel&demo=1`), the disc.
- [✓] **Phone** (390, touch context):
  - The results line's icon-only ▶ / ⤮ (44px).
  - The floating player + search: tap the knob, tap the field, type, and the results line updates. **Its focus edge → F5**, fixed.
  - The sections pill, the cards; no sideways scroll (0px).

### Projects · Thoughts · Home
- [✓] **Projects** grid / timeline + stage / `item.html?p=sonata` at 1440 and 390, both looks:
  - The card grammar; Visit site is ink.
  - The "on" fill is a blue tint (section) / ink (ink), never red.
  - Calm. *(the browse sheet, tag stack and open / close weren't re-walked; `pages.mjs` 245 + `tests.js` 69 cover them)*
- [✓] **Thoughts** feed, article, ranking at 1440 and 390:
  - The kickers are one style; Read → is an ink link.
  - The rail's All row uses the on role (gold tint); Mine has the ink rope.
  - Masonry gaps equal. *(the tag browser, playlist Play all and voting weren't re-walked; their suites cover them)*
- [✓] **Home** `?skip` in both looks: the scribbles keep their section colours; the brand red is the wordmark's only. *(the intro and the section transition weren't walked)*

### The system layer
- [✓] **`stitch=full` vs calm**: calm controls are flat with a hairline; cards, the year pill and the player keep their stitches. (The phone search slot's stitch was the exception → F5.)
- [✓] **`font=allo` / `allo-round`** on the Music grid, Thoughts feed, an article and Home, at 1440 and 390:
  - Word spaces are open; nothing clips.
  - Allo wraps more metas at 1440, and F2 keeps the rows level.
  - *(Safari's rendering of the variable font's roundness: not checked, see below)*
- [✓] **`kit/looks.html`**: the three live frames (i8 · section · ink) render the owner's screen side by side.
- [✓] **Nav**: the current tab's rope is the section hue (section) or ink (ink); the other tabs' icons are grey and take their colour on hover.
- [✓] **Hover only lifts**: cards lift with no rope, chips lift, a link disc fades to its site's colour, ▶ shows its tip. *(edge flicker: not checked in a real pointer)*
- [✓] **Keyboard**: 40 Tab stops each on Music grid, Music timeline, Thoughts, Projects grid and Home (38), both looks, all with a visible ring. Search fields and cards draw it on their container (`probe-focus.js`, 10 / 10).
  - **Esc** (`probe-esc.js`, 5 / 5): in the phone search, the 1st Esc clears the text and the 2nd closes the panel, with focus back on the knob. Esc closes the player's panel. Enter on a grid card opens its release page (the grid's decided open mode), and Esc there goes back with focus on that card.
- [✓] **Studio** (`view=music|collection|project|article`): the previews show the new folder cards; no solid-accent button at rest in any preview (`probe-studio.js`, 4 / 4). Its primary buttons are ink (`btn--red` is now an alias of primary).
- [✗→✓] **`review.html`**: the 9 Open options and 12 questions show; Copy everything works. The header said Iteration 9 → **F4**.

---

## Observations I didn't change (design calls for the owner)
- **The "All" chip at rest.** With no filter on, All is a toggle that's on, so it wears the on role: a soft purple tint under section, a **solid black** fill under ink. With eyes half closed, ink's black All dot is the second-loudest mark near the top. It's the rule working as written; whether "All" should count as on is the owner's call.
- **A collection that's playing shows "+" while the other cards in the set show ✓ "in the queue".** Its current song isn't "up next", so its + doesn't read as queued. It's consistent with how the queue works, but a person may wonder why.
- **F2's blank line.** See F2's trade-off.

## Not checked (and why)
- **Anything interactive in Safari.** I had only the observation pass at the end (see the top), so these weren't checked in WebKit:
  - real `<audio>` play / pause timing (F3's paused state; i9 found audio events arriving a tick late in Safari);
  - the phone slot's focus edge (F5) and `:has()` on it;
  - `field-sizing`;
  - hover, the keyboard, Shuffle;
  - the phone pass and `kit/looks.html`: their tour steps didn't come round in my captures.

  F1–F5 are engine-neutral JS / CSS, and their probes are Chromium.
- **Responsive Design Mode / real touch.** I used a Chromium touch context (390 × 844, `hasTouch`, `isMobile`), so taps are real touch events, but not iOS: no on-screen keyboard (the slot's keyboard lift), no momentum scrolling, no long-press callout. Long-press menus were left to `t-b3-acts.js`.

## Verdict: does i10's Music screen read as clearly as the old site?
**On the thing the owner asked about, yes.** Search "shadow", play glooming shadows, and blur your eyes (the playing state seen in Chromium and in Safari, the paused state in Chromium):
- **Section:** the one tinted card, with its purple tab, its purple ▶ and the bar's purple ▶, is the only coloured thing besides the nav's Music tab and the soft All chip. That's the old site's grammar (purple = music, the playing thing is the only filled thing), and the tinted card body makes it even easier to find than the old site's small filled pause.
- **Ink** is as clear: one red-roped card, red ▶ and tab.
- **i8 is not close:** three identical red ▶, a red All, red ropes on the nav and the Grid switch, and the playing card is invisible blurred.
- **Since F3**, pausing no longer leaves a solid ▶ in the bar, so a paused page is calm too.

**Where it still reads busier than blaqat.net:**
- **More chrome above the list:** the filter row (8 chips + a filter button at 1000), the results line with two outlined buttons, the year pill, the mute tab, the frame's knit edge. The old site has the field and three instrument chips.
- **The dashed stitches on every card**, the tab band and the knit backgrounds still add texture the old site doesn't have.
- **Type:** 18 text styles to the old site's 15, down from 31.

These are the yarn identity, not hierarchy problems: the eye still lands first on the title, then the playing card, then the player. **Honest summary:** i10 now tells you what's playing as fast as the old site, and much faster than i8; it's still a denser page than the old one.

## Runs (after all five fixes)
- **`regress.sh`, every suite, one at a time:** 66 suites, all rc 0 (log: `~/dev/temp/r3i10-walk2/regress-1.log`).
  - The site's, Studio's and the three agents' suites have the same pass counts as the baseline (`r3i10-wip/final.log`): pages 245, roles 35/35, t-i10-queue 79, t-i10-cards 96, t-i10-live 26, t-b1-rows 474, Projects 69/69, Thoughts 44 / 71 / 69, every Studio suite green.
  - The walk2 probes: shuffle 4, meta-rows 12, player-rest 13, fabfocus 18, review 6, gaps 6, focus 10, studio 4. `probe-esc.js` (5 / 5) was added after this run, and I ran it alone.
- **Sweep:** 150 loads, 3 with errors, both looks (`sweep-section.log`, `sweep-ink.log`). All 3 are `index.html`'s missing `_shots/i9-blocks-*.png` (expected; the gallery is rebuilt at the end).
- **`overflow.mjs`:** clean on every page at all 18 widths, and on Music with `look=ink` and with `font=allo` (`overflow-{all,ink,allo}.log`).
- **No existing test needed changing.**
- **Files touched:**
  - `kit/player.js` (F1 `play()`, F3 the L5 block)
  - `music/music.js` (F2 `bandRows()`)
  - `kit/yarn.css` (F5: the L2 calm block, the slot's stitch comment, the pointer rule)
  - `review.html` (F4)
  - `~/dev/temp/r3i10-orch/regress.sh` (the walk2 line)
