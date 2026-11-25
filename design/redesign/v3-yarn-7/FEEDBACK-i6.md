# Iteration 6 · the owner's i5 review

`v3-yarn-6/` is a copy of `v3-yarn-5/` (i5 stays frozen for comparison; older iterations in `../v3-yarn-*`). The owner reviewed i5 with the new round-up page and pasted it back; it's at the end of this file **word for word**, together with the bug report that came with it. The build list below is the reading of it, with an ID and an owner per item (see `BRIEF-i6.md`). Studio is still unreviewed ("ill review studio in iteration 6 the main site is priority right now"): leave its options open, change nothing there.

The review store is now `localStorage["yarn.review.i6"]`, so i5's saved picks don't leak into i6. `review/questions-i6.js` is filled in by the orchestrator at the end.

---

## Decided (apply; the old values move to Earlier or are cut)

| Param | Now | Notes |
|---|---|---|
| `ongoing` | **badge** (ribbon → Earlier) | plus O1 below |
| `mhide` | **off** by default; keep `all` as an Open option; drop `nav` | "maybe just doing away with the feature is the best option … if we do keep this feature it will be everything hiding" |
| `toast` | **bottom** (top → Earlier) | the owner picked bottom; X1 below |
| `dlayout` | **label** (leaning); keep `rail`, add a left rail (L1); **cut `i4`** | |
| `stagealign` | **center** (top → Earlier) | plus L4 |
| `dnav` | **count**, plus the neighbour's title on hover/focus | |
| `disclong`, `pnotes` | decided (`actions`, `divider`) with the fixes in MP1/MP2 | |
| `ptype` / `ptypelabel` / `passed` / `tlstack` | decided (`color` / `text` / `ring` / `on`); **cut `ptypelabel=icon`** | plus P2/P3 |
| `mtype` / `songnotes` | decided (`color` / `face`) | plus M1/M2 |
| `pickart` | `link` decided as behaviour; the *design* is open again (T1) | |
| `kicon` | **circle** | |
| `browseicon` / `uisnd` / `mactive` | decided (`shake` / `quiet` / `start`); **cut `mactive=top` and `mactive=count`** | |
| `stkicon` | becomes a rule: colour logos on white surfaces, one-colour tinted on any other surface (S2) | |
| Unanswered round-up questions | recommended answer stands: `open-ongoing-tab` → no tab (see O1), `contrast-tier-a` → darken | `article-pager` → T4 · `qr-distance`, `studio-new-hides` → moot with `mhide=off` |

Answers that need no build: Thoughts' "All" stays a row · personal blue OK · keep "+" on collection cards · queue rows keep "2/4" · single-card rule counts tabs · write-up link stays "Read the write-up" · solid logos, new logos for the five generic stacks · Studio: later.

---

## Build list

### Bugs first [mobile]
- **B1** "got into a really weird state using filter browse on mobile i selected soundcloud and it shifted everything down or something looks really bad" (screenshots: Browse sheet with a heavy black ring on the "2020" chip; after closing it, the chip row and the search bar run past the right edge of the screen, the Browse knob sits on the disc's red ring). → Reproduce at 390 on Music (Browse → Listen on → SoundCloud, plus Collection), fix the cause (sideways overflow? a sheet that doesn't restore? the knob/disc positions), and make the black ring a proper focus style only for keyboard focus.
- **B2** "also scroll was going over the edge lets have these floating elements on their own plane of existance shouldnt be effected by the rest of the page and should be layered on top of everything else on the page (currently i saw the dashed line overlap the disk floater)" → All floating chrome (sections pill, search button/bar + chip row, player disc/bar/panel, Browse sheet, toasts, long-press actions, popovers/sheets) lives in **one fixed top layer** outside the page's sheet (its own stacking context above everything), and the page can never scroll sideways on phones (`overflow-x: clip` at the root, plus fixing whatever overflows). Nothing from the page (dashed stitch lines, shadows, glows) draws over a floater.

### Site-wide
- **X1** Toast: the Undo button is right-aligned. [mobile]
- **X2** Sound tag (Projects pin 2): "when on make the whole tag red with white icon and then when off its the normal tag with the black icon … hovering when on should change color to black and do the mute icon basically wanna remove the red outline thingy. also make sure the mute icon is centered/placed correctly". Also "always start muted" (round-up answer): drop the resume-after-first-tap behaviour. [mobile]
- **X3** Link icons on cards (Projects pin 3): use the kit's quick hint popup (the one Music's tabs use) instead of the slow native `title`, everywhere icon-only links/buttons appear. [mobile]
- **X4** Press depth (Projects pin 4), a general rule from the owner's original design: "when u have an element thats clickable that contains clickable things like the card that have link action buttons when you press down on the inner buttons it shouldnt play the press animation for the whole container; only that button ur clicking on." Kit-wide. [mobile]
- **X5** Hover hit area (Music note): "if u placed ur mouse on the edge of a card in grid it can start flickering hover and unhover state we need the hover boundary to be bigger so it covers both states". Kit-wide for lifting cards/rows (the lift moves the edge away from the pointer). [mobile]
- **X6** Red buttons (contrast): make `.btn--red` deeper-red an Open option (`?redbtn=twill|deep`) so the owner can compare. [mobile]
- **X7** Mobile glow (Music note): "when search is active … there was a like glow effect above the search but it stops before the music disk so it looks weird that should be touched up". [mobile]
- **X8** `mhide`: default `off`; `all` stays as an Open option ("if we do keep this feature it will be everything hiding"). [mobile]

### Opened item / item pages [layout]
- **L1** `dlayout`: default `label`. Owner, on label first: "if label first we can put the action buttons on the bottom right … make sure there isnt like a massive gap between the last bit of text and the bottom section for label first i saw that happen in the opened project page not in an open item". New option: a **left rail like Thoughts articles** ("article's left side side rail looks great tho isnt as in design as our current stuff with the button styling lets try an option like that as well for everyhting else"). Keep `rail`, fixed: on the item page "side rail … on the left or … just too far to the right i think it looks off cause of the other buttons in the top bar"; on Music "side rail looks awful when theres no content for the song"; "for the play button in side rail either center the text for all buttons or add "Play/Pause" text". Cut `i4`.
- **L2** `dnav`: `count` + the neighbour's title on hover/focus ("lets do this selection + title on hover").
- **L3** Sticky bar (Music pin 2 + note): "theres a state where the sticky bar shows and the title is fully covered but the title doesnt show in the sticky bar" and "the sticky bar flashes when changing elements on this and projects page".
- **L4** Stage position: `center` default, and "opened items in timeline view … a little more visually centered so its like a letter/card right now its leaning too close to the top so … a tiny bit more padding from the top"; "in timeline view the opened item shifts up and down when opening the player it shouldnt be effected by that".
- **L5** Stack chips in the opened item (Projects pin 5): "not sure if these make sense to have the cotton/felt texture they are more like the hashtags on the thoughts page … we can try options tho just dont want these to feel like buttons like visit site and source do". Build `?stackchip=tag|chip` (tag = Thoughts-hashtag look, default).
- **L6** The facts on the opened item (Ongoing note): "i also kinda like how it looks on the opened card with the icon in the circle" → that's the fact grammar the cards adopt in O1; keep it and drop the ongoing tab in the panel's gutter.
- **L7** Back links (Ranking pin 3): "theres inconsistency where the back button is on open pages, articles, and these type of thoughts page we need more consistency overall" → one back-link placement and style for item pages, articles, collections and rankings (shell side; thoughts applies it on its pages).

### Projects [projects]
- **O1** Card meta: cards match the opened item's facts (icon in a circle, display face), as an **Open option** `?cardmeta=facts|badges` (owner: "make this an option in the next round i might change my mind"). Order **type · status · date** ("status and year really goes together"); the ongoing status can be the condensed icon-only badge. Same for Music cards [music].
- **P1** Type badge on items (`ptypelabel=text` note): "the weird background isnt that good (feels out of place) but the background on the open items also isnt good for contrast … contrast test and use white on the color if its too dark". Rework, measure contrast.
- **P2** Stack line in timeline + grid cards: "should work like the hashtags on the thoughts page where clicking them lets u clear the filter as well if theyre active. styled the same as well (same on grid)".
- **P3** Empty state (Projects pin 1): "When there is nothing filtered, two things show nothing to show clear filters its redundant we should show one". (Music too, if it has the same.)
- **P4** Grid while searching (Music note, applies to both grids, kit year groups): "when searching idk if we need the year dividers anymore on grid mode? … if ur search only has 3 items each in different years u have to scroll to see all 3 when all 3 could really fit … but tbh if ur filtering for a year it shold do the divide too theres probably a smart solution". Build 2–3 approaches as `?gridyears=` (Open).
- **S2** Stack icons (`stkicon` note): "on a white background colour logos are good but otherwise we should switch to one-colour tinted" → colour logos on white surfaces, tinted one-colour on every other surface (selected/red chips, tinted cards, dark), as the default; drop the `stkicon` option. Also give the five generic stacks their new logos in colour mode.

### Music + player [music]
- **M1** Instrument filter hover: "should match the style of projects where it has a soft color tint when hovered not just the text changing color. for piano the current way doesnt show anything since piano is black".
- **M2** `songnotes=face`: "if the hovered item doesnt have notes dont say "no notes" just remove that text".
- **M3** Single card: "lets remove the emdash just do "-"" ("Collection - **Song**").
- **M4** Opened collection while searching: "if multiple match a search if it should filter out the rest or at least show stronger that the other ones are not included in the seaerch maybe faded out or darker not sure what best route is so try multiple" → `?trackmatch=` (Open).
- **M5** Dropped icon (Music pin 1): "i think the trash can dropped icon makes a lot more sense than this. this looks like a rock medal to me".
- **M6** Music's timeline knots use the same passed-ring component as Projects (Music pin 3: "we are using the same exact component across pages").
- **M7** Ongoing in the player (round-up note): "in the player thats the most important place to show something is wip we dont have that at all yet … im curious how that would look" → mock it (bar + panel).
- **MP1** Long-press actions: "next should become disabled if on the last song / also missing click animation on the 3 buttons / also should move the search out of the way either more to the left or just gone until the interation is done (prolly for the best)".
- **MP2** Notes labels: "label should just be "About [collection name]" also add "About this song" instead of this song".
- O1 on Music cards.

### Thoughts + rankings [thoughts]
- **T1** Pick + write-up: "i prefer its own post in functionality but i prefer the pick is the article in design lets try more different design options / i think the issue is that the title feels too long for write ups but the about one feels right idk why / actually no i like write up but maybe just have it in the bottom right similar to read thats what it is clicking that takes u to write up clicking the item takes u to its item page" → `pickart` design options, including the write-up link at the bottom right like "Read".
- **T2** "See the post" (Thoughts pin 1): "i dont think we need the see the post button doesnt really add a lot going back should just take u to what u clicked on".
- **T3** Rail tags (pin 2): "limit the amount of tags and have a browser overflow or something … there are also missing filters for years i noticed in search".
- **T4** Article pager (pin 3): "i like this for article but im wondering what it would look like using the open page design < >" → `?apager=bottom|top` (Open).
- **T5** Table of contents (pin 4): "when you cant scroll, the table of contents doesnt really work … something should happen over nothing" (flash/highlight the section).
- **T6** About pill (pin 5): "when clicking about im torn between scrolling and ribbon selecting the item it was about and opening the page" → `?aboutgo=` options (Open).
- **T7** Collection icons (pin 6): "the default icon is kinda useless sinec it doesnt show on the collections page also looks weird compared to how we do icons for every other item … different options making it feel coheisve or just removing the icon" → `?collicon=` (Open).
- **T8** Next item motion (page note): "when going to a next item the previous selection should animate out while the new one is coming in rather than being on its on timer".
- **R1** Ranking comments (page note): "some are referring to a specific rating but when leaving a comment i dont see how to do that nor does clicking an item do anything … smart words similar to search bar … or clicking or if u wanted to talk about multiple" → mock ways to reference items in a comment.
- **R2** The ranking's write-up pill (pin 1): "feels disabled maaybe use white here … since we arent on white we should use white".
- **R3** Item write-up marker (pin 2): "lets try different design options for this (showing a ranking item has a write up)" → `?wumark=` (Open).
- **R4** Mini-ranking marks: keep clean, but "can have an option to try this" → `?minimarks=off|on` (Open, default off).
- **R5** Tier "A" orange: darken a touch (contrast).
- L7 on Thoughts pages.

---

## The owner's words (verbatim)

**With the round-up (bug report):**

"little bug i found that didnt make it to the round-up / got into a really weird state using filter browse on mobile i selected soundcloud and it shifted everything down or something looks really bad [2 screenshots] also scroll was going over the edge lets have these floating elements on their own plane of existance shouldnt be effected by the rest of the page and should be layered on top of everything else on the page (currently i saw the dashed line overlap the disk floater"

**The round-up, as pasted:** see `_feedback/roundup-i5.md` (the full Markdown the owner copied from review.html on 2026-11-14 18:09).
