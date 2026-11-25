# Iteration 10 · the site again: hierarchy, signal, grid

**Read `DESIGN-i10.md` first.** It is the design brief: what we measured, why the site reads as overload, the rules (R1–R9), the colour roles (§4), the type roles (§5), the grid and card anatomy (§6), Play / Shuffle and the queue (§7), and the ⚙ options (§8). This file is the build list.

The owner's words are verbatim in `_feedback/roundup-i9-site.md`, with the screenshot `_feedback/i10-music-old-vs-new.png` (left: yarn i8, right: the old site).

## Setup (done by the orchestrator)
- `v3-yarn-10/` is i9 (kit + Studio, light only) **plus the i8 site pages back** (`home/ projects/ music/ thoughts/`, copied from the frozen `v3-yarn-8/`).
  - `kit/yarn.js` `SITE_DIR = "../"`. The player's and posts' site links point here again.
  - The dark leftovers in the site CSS are removed.
- The review store is `yarn.review.i10`. i9's docs moved to `_history/`. i9's "Carry to the site" list is in `_history/FEEDBACK-i9.md`; only the Music order (M9) is pulled in this round.
- **Compare against i8** in the frozen `../v3-yarn-8/` (the site exactly as it was). i10 does **not** keep the i8 look reachable inside itself; `kit/looks.html` frames i8 next to the new looks.
- Tests: i8's site suites and i9's Studio suites are copied into `~/dev/temp/r3i10-*` and repointed. The runner is `~/dev/temp/r3i10-orch/regress.sh`; the baseline is `~/dev/temp/r3i10-wip/baseline.log`. The audit is `~/dev/temp/r3i10-audit/audit.mjs`: `node audit.mjs i10 "look=ink"`, with `W=1000` for the owner's width. Its `*-marks.png` boxes every accent mark.

## The contract every agent builds against

### `<html>` attributes (set by `kit/yarn.js` before first paint; all are kit options)
| attr | values (default first) | ⚙ |
|---|---|---|
| `data-look` | `section` · `ink` | Open: "Colour: what an accent means" |
| `data-stitch` | `calm` · `full` | Open: "Stitches on controls" |
| `data-font` | `nunito` · `allo` · `allo-round` | Open: "Font" |
| `data-cardart` | `right` · `left` | Open: Music cards' art (`when` a folder card is on the page) |
| `data-shuffle` | `results` · `player` | Open: where Play / Shuffle live (`when` on Music) |

### Colour role tokens (system defines them in `kit/yarn.css` `:root` + per look; everyone else only *uses* them)
Until system's tokens land, write `var(--c-live, var(--red))` and the like. Never write a raw `var(--red)` / `#d62f38` for one of these jobs again.

| token | job | section | ink |
|---|---|---|---|
| `--c-brand` | logo dot, Home accents | red | red |
| `--c-here-a` / `--c-here-b` | the nav's current tab (rope colours) | `--sec` / `--sec-deep` | ink / ink-2 |
| `--c-pick-a` / `--c-pick-b` | a chosen single option (rope colours; `.ysel` reads them) | ink / ink-2 | ink / ink-2 |
| `--c-on-bg` / `--c-on-fg` | a toggle that's on (fill + text) | `--sec-soft` (+ texture) / `--sec-deep` | ink (+ twill) / #fff |
| `--c-primary-bg` / `--c-primary-fg` | the one primary action per view | ink / #fff | ink / #fff |
| `--c-act-bg` / `--c-act-fg` / `--c-act-line` | a repeated action at rest (every card's ▶) | #fff / ink / `--y-line` | same |
| `--c-live` / `--c-live-deep` / `--c-live-soft` / `--c-live-fg` | live: playing / now | `--sec` / `--sec-deep` / `--sec-soft` / #fff | red / red-deep / red-soft / #fff |
| `--c-link` / `--c-link-hover` | inline text links | ink / `--sec-deep` | ink / red-deep |

- `--sec*` is already set per page by the frame (Music purple …). Studio and the kit pages have no section, so they use ink for `--sec*` under `section`.
- **Contrast:** white on `--sec` / `--sec-deep` and `--sec-deep` text on `--sec-soft` must pass 4.5:1. Measure it. Gold is the weak one: Thoughts' live fill may need `--gold-deep`. Use a `--c-live` that passes; don't lower the bar.

### Type role tokens (system defines them; everyone uses them)
`--fs-display 40` · `--fs-heading 22` · `--fs-title 17` · `--fs-body 15` · `--fs-meta 13.5` · `--fs-label 13.5` · `--fs-micro 12` · `--fs-num 12` (phones < 720: display 30, heading 20)
`--fw-display 900` · `--fw-heading 850` · `--fw-title 800` · `--fw-label 800` · `--fw-micro 800` · `--fw-meta 600` · `--fw-body 400`
`--tr-display` · `--tr-heading` · `--tr-title` · `--tr-label` · `--tr-micro` · `--tr-caps` · `--tr-body`: per-font values; Allo's differ (§5)
`--ff-head` (= display font: titles, labels, micro) · `--ff-body` · `--ff-num` (mono, numbers that line up only)

### Spacing tokens
`--sp-1 4` · `--sp-2 8` · `--sp-3 12` · `--sp-4 16` · `--sp-5 24` · `--sp-6 32` · `--sp-7 48` · `--gutter` (24 desktop / 16 phone) · `--card-pad` (20 / 16)

## Build list

### system · the kit, the player, Studio (one agent)
- **L1 · Colour roles + `look`.** Add the tokens and the `look` option (Open, default `section`). Re-point **every** accent use in:
  - the kit (`yarn.css`, the CSS inside `player.js`, `posts.js`, `blocks.js`, `notes.js`, `lightbox.js`)
  - `studio/*`
  - the other agents' areas (`music/*`, `projects/*`, `thoughts/*`, `home/*`, `kit/posts.js`, the MUSIC FOLDER CARD and POST CARDS sections), but **only as small, exact replacements of colour values**, and say so in your report.

  Rules, each with the role it uses:
  - The nav's current tab is the **here** rope. The other tabs' section icons are grey (ink-3 glyph on cotton-2) until hover or focus, and the current one keeps its colour.
  - Single choices use the **pick** rope (the `.ysel` rope reads `--rope-a/-b` = `--c-pick-*`).
  - Toggles use **on** (`--tog-red` retires into it).
  - `.btn--red` splits into **primary** (ink fill, one per view), **act** (neutral, repeated) and **live**.
  - Links use **link**.
  - The page title's dot becomes `--c-live` under section (it is the section hue) and `--c-brand` under ink. The logo's dot stays brand.
  - Instrument and type chip colours (`--inst-c`) are content colours, not accents. When on, they keep their tint and lose the solid fill.
- **L2 · Stitches.** `stitch=calm` (default): chips, buttons, segments, the search field and link discs drop their dashed stitch at rest, and get a 1px `--y-line` hairline or just their fill. The sheet, cards, the year pill and the player shell keep theirs. `full` = i8.
- **L3 · Type roles in the kit.** Add the tokens and move every kit part onto them:
  - nav, page header (title + kicker), search, chips, seg, buttons
  - facts / `Yarn.cardMeta`: status is a 14px ink-3 glyph plus a word, not a 20px black disc; WIP keeps its gold glyph
  - year pill, timeline rows, `Yarn.detail` (the opened item), folder tabs' text style (Micro), prose sizes, the player's text
  - mono only for Numeric (time codes, durations, track numbers): "26 releases", "(4 tracks)", "3 releases" and dates become Meta

  Count the distinct text styles before and after with the audit, on Music grid, Music Timeline, Projects and Thoughts. The target is ≤ 16 per screen.
- **L4 · One link part, one play part.**
  - Every outside link disc (`Yarn.linkIcon` / `.ylinkicon`, `Yarn.dlinks`) has the same disc and the same duotone glyph treatment at rest (ink-3 on cotton-2; the brand colour on hover / focus). SoundCloud, BeepBox, GitHub, link and copy all match. The owner: "the beepbox AND soundcloud are using the duotone".
  - The kit gets **one play button part**, `.btn--play` (or a `Yarn.playBtn` helper if one helps), in two sizes:
    - At rest it's act (neutral disc, ink ▶).
    - When it's the current item but paused, it's act with a live ring.
    - When it's playing, it's a live fill with ⏸ or bars.

    Music uses it; tell music its API.
- **L5 · The player in roles.** The bar and panel are the strongest live signal:
  - ▶/⏸ and the progress / waveform are live
  - the volume, prev / next and the expand caret are neutral (ink)
  - the disc's label ring is live
  - the WIP gold rule (`pwipc=gold`) stays as decided
- **L6 · Allo** (`font=allo|allo-round`).
  - Load `https://cdn.jsdelivr.net/npm/allo-font@1.0.1/fonts/webfonts/AlloVariable.woff2` only when chosen. Add the italic faces if prose needs them. `allo` = ROND 50, `allo-round` = ROND 100.
  - Tune `--tr-*` per role for Allo, plus `size-adjust` against Nunito Sans's x-height (§5). Prove it with side-by-side crops: Display, Title, Body and Label in both fonts at 1:1. Word spaces must not close up. The preview's hack was 1/4 of Nunito's tracking.
  - The home wordmark is SVG stitches and stays.
- **L7 · `kit/looks.html`** (like `kit/mnav.html`). It shows the same screen side by side, in one window, as frames:
  - **i8** (`../../v3-yarn-8/…`), **section** and **ink**
  - for: Music grid with "shadow" and a track playing, Music Timeline, Projects, Thoughts and Home
  - with a picker for the screen and the width (1440 / 1000 / 390)

  Frames pass `?embed` so saved ⚙ picks don't leak in. The playing state comes from a param (`demo=<track id>` or a new one); build it if the player can't start a track from the URL.
- **L8 · Studio adopts the roles** (no section, so ink): `studio.css`'s reds become roles. Studio's suites stay green.
- Docs: `kit/COMPONENTS.md` (roles, type, spacing, the play part) and `kit/components.html` (a Roles section: each role in both looks; the type ramp; the play button's states).

### music · the Music page (one agent)
- **M1 · Header + results line.**
  - The title row is the title (Display) and the Timeline / Grid seg.
  - The count line under the title and the "Shuffle all" button go away.
  - A **results line** sits between the tools and the list. Left, in Meta: "26 releases · 58 tracks", or with any search / filter "3 releases · 5 tracks for “shadow”" (the filters named the way the filter row says them). Right: **▶ Play** and **⤮ Shuffle**, outlined Label buttons. Phones: the same line, icon-only buttons with labels for screen readers.
  - `shuffle=player` (Open): Shuffle becomes a mode toggle in the player bar (the kit player: ask system for the hook or add a small marked one). The results line keeps the count and ▶ Play.
- **M2 · The queue is what's shown** (DESIGN §7).
  - A collection shown because it matched *itself* (name, description, facts) plays all its songs.
  - One shown only for some songs plays **only those songs**: the same set its tabs keep.
  - Play, Shuffle, ▶ on a card or row, a tab, next / previous and the long-press "Play" all use one function (`shownQueue(fromItem?)`).
  - With no filter, everything plays (today's behaviour).
  - The player's queue view must show exactly that set. Write the rule as a test against hand-written expectations for "shadow", "alphabet shadow", "gurgling" and an instrument filter.
- **M3 · The folder card** (kit `Yarn.folder` + the MUSIC FOLDER CARD CSS):
  - It follows DESIGN §6: one left edge, the knit art top-right (`cardart=right`, default) or top-left with every line in one column beside it (`cardart=left`).
  - Title (Title) + "4 tracks" (Meta, not mono, not in brackets), one Meta line for status + date.
  - The description is Body, clamped to the same number of lines in a row.
  - The song name in the face text becomes Body weight 600, not a bold run inside the paragraph. "more" is a link role, not red.
  - The foot: links left, the same part (L4); + and ▶ right, the same height.
- **M4 · Gutters and tabs.**
  - The grid gap is `--gutter` across and down.
  - The folder tabs live inside the card's box (its top band), so a row's gap doesn't change with tabs.
  - Cards in a row are the same height, with the foot on the bottom edge.
  - Measure at 1440, 1100, 1000 and 390 (the audit's grid numbers): the column gap equals the row gap ±1, and there's one left edge per card.
- **M5 · Live.** The playing card (ladder: current-paused vs playing) shows:
  - Section: a `--c-live-soft` tint on the card body, the live ▶ (⏸ / bars), its tab in live fill with white text.
  - Ink: a live rope on the card's edge, plus the live ▶ and tab.

  Timeline rows and the stage's track rows do the same. Nothing else on the page is a solid accent; check with the audit's marks.
- **M6 · Timeline, stage, release page and phones** get the same roles and type: the timeline rows (Title + Meta, neutral ▶), the opened release (`Yarn.detail`: Heading, facts in Meta, the track rows), `item.html`, and the phone cards / rows (`phrow=card`, `mart`, as decided).
- **M7 · Equal heights on phones and the "more" link** are part of M3 / M4. Phones never scroll sideways.
- **M9 (if time, after M1–M6) · The Music order from i9.** Swap `ITEMS.sort(by start)` + `Yarn.byYear(…)` for `Yarn.musicOrder(items, "finished")` + `Yarn.musicOrder.groups` (`_history/FEEDBACK-i9.md`, Carry: "music (S10)"), and read a collection's facts from `Yarn.musicFacts` (Carry: "music (S9)").

### pages · Projects, Thoughts, Home (one agent)
- **P1 · Projects.**
  - Grid cards, timeline rows, the stage and `item.html` get the card grammar (DESIGN §6; the image is already top-right) and the type roles.
  - Facts in Meta with the quiet status glyph (L3 makes the part; you place it).
  - The GitHub / ↗ buttons and stack logos: links in the same part (L4) at the foot's left, actions at the right.
  - The primary ("Visit site") is ink primary.
  - Equal gutters across and down; one left edge.
- **P2 · Thoughts** (`thoughts/*`, `kit/posts.js` + POST CARDS):
  - Each post card has one left edge. The kicker row is Micro caps (type · read time · date), then the Title, then Body.
  - "Read →" is the link role.
  - The article ribbons and sticky / stub colours are content (the owner picks them per post), but a red ribbon on every article is decoration: make article ribbons the section hue (section) or ink (ink).
  - The rail's "All" row and type rows are **on** / **pick** roles, not a red fill.
  - Tags in Meta.
  - The ranking card's Mine / Everyone is pick.
  - The masonry gutters are equal across and down.
  - Then the article page and the tier page.
- **P3 · Home.** Red is Home's section hue, so under `section` Home stays red. Check that the keyword scribbles, the callout and the section buttons keep their meaning: the section buttons are the one place the rope shows on hover (owner, i2). Type roles.
- **P4** Count before / after with the audit on Projects grid + Thoughts. Targets: ≤ 16 text styles, and solid accents only where something is live or primary.

## Done
*(each agent adds its own section: what it built, its ⚙ options or questions, its tests)*

### pages · P1–P4 (Projects, Thoughts, Home)

**P1 · Projects** (`projects/projects.css`, `projects.js`)
- **Grid card** follows the one card grammar (DESIGN §6), the same one Music's folder card uses.
  - Padding is `--card-pad`. The title, facts, text and the foot's first link start on one left edge (measured). The media sits top-right.
  - The text clamps to 4 lines on every card, so the cards in a row are the same height.
  - **Foot:** one 36px row on the card's bottom edge.
    - Left: the outside links (GitHub, ↗) as the kit's link disc (`Yarn.linkIcon(…, { sm: true })`: 32px, 8px apart, the first on the text edge), then the stack. The stack is in Meta, filters on a tap, and folds into "+n" (`fitStacks`).
    - Right edge: **Write-up →**, the same `.yabout--wu.yabout--short` pill a Thoughts pick uses for its write-up (one concept, one part). It's its own link, so pressing it presses only it.
    - The old "write-up" meta mark is gone.
- **Type roles:**
  - Title: card and timeline names. The timeline name's button now inherits the tracking.
  - Body: card text and phone-card text. The stage's tagline is plain Body, not a size of its own.
  - Meta: stack tags. The kit's `.ytag` is Meta now, so my overrides went.
- **Gutters:**
  - Grid: `--gutter` across and down (24, 16 on phones). Years are 32 apart.
  - Phone list: 16. At 640–959 there are two columns at the gutter.
  - Every gap on the 4 / 8 / 12 / 16 / 24 scale.
- **Colour:** "Visit site" is ink. That's system's `dlink` primary, verified on the stage. My files have no raw reds left.
- **Question `pj-foot`** (review): links first then the stack (as built) vs the old site's stack left, links right. No ⚙ option.

**P2 · Thoughts** (`kit/posts.js`, POST CARDS in `kit/yarn.css`, `thoughts/*`)
- **Post cards: the grammar.**
  - **Kicker:** one style, Micro caps (type · read time · date), with "·" between the parts. It's always one line, checked at 10 widths:
    - Read time shows "2 MIN" and a ranking shows "👥 214". The words "read" and "ranked" stay for screen readers.
    - Gaps are 6px each side of every dot.
    - The bookmark keeps only the room it needs; its right edge is now on the text's right edge.
  - **Title role** on every card type. A scratch's quote is a Title too, and its opening quote hangs into the margin so the words start on the edge.
  - **Body:** the dek.
  - **Foot:** one row. Left: the post's links, then its tags (Meta). Right (`.ypost__right`): the go-link or action.
    - The links are the kit's labelled link buttons (`Yarn.dlinks` sm, 32px), because the owner chose their own link words in i9 S5. Projects and Music cards use the disc form.
    - The right side holds "Read →", the pick's shelf, "Write-up →", or Play all.
  - **The playlist's record** is its media, so it moved top-right.
- **Colour by role:**
  - **Link role:** "Read →", the shelf ("Tools I like →", which was a gold pill) and "Write-up →" are ink, underlined under the words only, with `--c-link-hover` on hover.
  - **New `--ypost-mark` / `-deep`:** the section hue, ink under look=ink, ink in Studio. It colours the article ribbon, the pick's yarn and knot, the type swatches' accent and the ranking page's write-up bookmark.
  - **Not red any more:**
    - The scratch quote mark is ink-3.
    - The mini board's "found" item is live.
    - The ranking's Add / You-vs-everyone button is a neutral `.btn` (36px).
  - **Play all** is `Yarn.playBtn`: rest (neutral) → current (live ring) → playing (live fill; white on gold-deep 5.64:1). The playing card gets a `--c-live-soft` tint (section) or a live ring (ink).
  - **The rail's All / type rows** are system's on role. I checked the result: 4.79:1, no red.
- **Equal gutters:**
  - The masonry rows are 1px now (they were 4px), so the gap down is the gutter to the pixel, the same as across: 24, or 16 on phones. It was 16 across and 16–19 down.
  - The collection grid and its masonry use the gutter too, and a pick's foot sits on its card's bottom edge.
- **Rail:** the intro is Body, the collection rows are Label + Meta, and the tag chips are Label (they were a 12px step of their own).
- **Article page:**
  - The kicker uses the cards' grammar, and the dek is the reading size (17) in Body's face, ink-2.
  - The facts are Micro caps keys over Label values.
  - The reading progress and the heading-jump flash are live.
  - The current "On this page" entry is the here role in its deep tone (gold itself is 2.2:1 on the sheet).
  - The sign-off link is the link role. The code window's dots are neutral, and focus rings on the code are white.
- **Ranking page:** drop targets, picking, mentions, reading highlights, the "you" badge and drafted tiles are live. Likes and the dots are on. The input's focus is the kit's ink ring. The bookmark is `--ypost-mark`. Errors stay red-deep, as a status.

**P3 · Home** (`home/home.css`)
- The "Press unmute" callout's ring and icon are the brand role (`--c-brand`, red in both looks, DESIGN §4), and its focus ring is the kit's ink.
- The skip button and the callout are Label.
- Checked by test:
  - The keyword scribbles keep their destination's colour (blue → Projects, purple → Music, orange RIT).
  - Hovering a section button still sews the rope in.

**P4 · audit** (`~/dev/temp/r3i10-audit/audit.mjs`; i8 numbers from `out-i8*`).

Text styles, i8 → i10:

| screen | 1440 · i8 | 1440 · section | 1440 · ink | 1000 · i8 | 1000 · section | 1000 · ink |
|---|---|---|---|---|---|---|
| Projects grid | 17 | **11** | 11 | 18 | **11** | 11 |
| Projects timeline + stage | 24 | **15** | 15 | 22 | **14** | 14 |
| Thoughts | 41 | **18** | 18 | 33 | **16** | 16 |
| Home | 7 | 7 | 7 | 7 | 7 | 7 |

Red marks, i8 → i10:

| screen | 1440 · i8 | 1440 · section | 1440 · ink | 1000 · i8 | 1000 · section | 1000 · ink |
|---|---|---|---|---|---|---|
| Projects grid | 4 | **1** | 2 | 4 | **1** | 2 |
| Projects timeline + stage | 11 | **1** | 2 | 10 | **1** | 2 |
| Thoughts | 22 | **6** | 7 | 20 | **3** | 4 |
| Home | 7 | 7 | 7 | 7 | 7 | 7 |

- **What the remaining reds are:**
  - The logo's dot (brand), plus the title's dot under ink (brand, by L1).
  - On Thoughts, only content colours the owner picks: the S-tier felt (the rail's Rankings swatch, an about pill's key, the mini board's key), red pick stubs in the collection mark, and the pink sticky note.
  - Home's 7 are the wordmark's yarn and ball (brand).
- **Thoughts at 1440 is 18 styles, two over the target.** Five styles are content-tinted text (the sticky notes' own inks, and white on the S felt) and two are the one-character title and logo dots. At 1000 it's 16.

**Tests** (`~/dev/temp/r3i10-pages/pages.mjs`, added to `regress.sh` under i10 agents' suites): **245 pass, 0 fail.**
- Projects grid at 1440 / 1100 / 1000 × section / ink:
  - one left edge per card (title, facts, text, foot)
  - gutter across = down = `--gutter`, and equal card heights per row
  - 32px discs, the foot read left to right on one centre line, the write-up on the right edge, the foot on the bottom edge
  - the Title / Body roles, no red at rest
- The write-up pill opens the article and doesn't press the card. A click on the card body opens the project. Tab order runs open → links → stack → write-up, and Enter opens. A stack filter survives a reload, pressed in its card.
- The timeline's Title role, no red, an ink primary on the stage. Phones: rows 16 apart, a tap on a row's body opens its page.
- Thoughts at 1440 / 1000 / 390 × both looks:
  - masonry across = down, one left edge
  - one-style kickers that fit on one line, link-role go-links
  - ribbons in the section hue or ink, no red decoration
  - the rail's All row (contrast), no sideways scroll
- Touch: a tap on an article's or a pick's body opens it, a tap on a tag filters, and a link opens a new tab only (44px). Play all goes rest → playing (live fill, contrast) → current in both looks. A tag filter survives a reload.
- The collection grid's gutters and feet; no red decoration on the article and ranking pages.
- Home: scribble colours, the section-button rope.

**Existing suites I updated** (they asserted the old look):
- `r3i10-thoughts/test-tier.mjs` T4: the picked outline is the live role (it was red).
- `r3i10-st-links/links.mjs`: a pick's links are kit link buttons (they were `.ypost__ext` text).
- `r3i10-projects/tests.js` (original kept as `tests.js.i9bak`):
  - "align grid cards": the foot's first item is on the text edge (links lead now).
  - P4 / P5 / P6, for system's L1 / L3: glyph facts, tinted type chips, the ink strand. System confirmed these match.

Suite results:
- Thoughts: feed 44/44, tag browser 71/71, ranking 69/69.
- Projects: 69/69 (after system's fix for the matched-facts gap, which P4 caught).
- `r3i10-site` 4/4, `r3i10-walk` 7/7, `r3i10-fix/phrow`: ok.
- Studio suites that render posts: `st-links` 3/3, `st-blocks` 3/3, `st-polish` S13–S16, the two `st-walk` suites, `studio/mobile`.
- `studio/flows` keeps its one baseline failure ("phone: pub at one x"); it's not in my area.
- `overflow.mjs`: home, projects, thoughts, compose and components are clean at 18 widths (projects and thoughts also under look=ink).
- `sweep.mjs` on home, projects and thoughts: 114 loads, 0 errors, in both looks.

**Docs:** `kit/COMPONENTS.md` §15 has the post-card grammar, `--ypost-mark`, and `linksRow` / Play all.

### system · L1–L8 (the kit, the player, Studio)

**Audit (`~/dev/temp/r3i10-audit/audit.mjs`), before (i8) → after (i10 section / ink).** Accent marks · red marks · distinct text styles; Music grid also gutters across / down.

| screen | i8 1440 | i10 section 1440 | i10 ink 1440 | i8 1000 | i10 section 1000 | i10 ink 1000 |
|---|---|---|---|---|---|---|
| Music grid "shadow", playing | 25 · 14 · 31, 20 / – | 9 · 1 · 20, 24 / – | 8 · 7 · 20 | 25 · 14 · 31, **20 / 42** | **9 · 1 · 20, 24 / 24** | 8 · 7 · 20, 24 / 24 |
| Music timeline, playing | 48 · 26 · 36 | 14 · 1 · 17 | 13 · 5 · 16 | 47 · 25 · 35 | 14 · 1 · 17 | 13 · 5 · 16 |
| Projects grid | 16 · 4 · 17 | 8 · 1 · 11 | 7 · 2 · 11 | 16 · 4 · 18 | 8 · 1 · 11 | 7 · 2 · 11 |
| Projects timeline + stage | 31 · 11 · 24 | 12 · 1 · 15 | 10 · 2 · 15 | 28 · 10 · 22 | 11 · 1 · 14 | 9 · 2 · 14 |
| Thoughts | 48 · 22 · 41 | 27 · 6 · 18 | 16 · 7 · 18 | 35 · 20 · 33 | 20 · 3 · 16 | 9 · 4 · 16 |
| Home | 13 · 7 · 7 | 12 · 7 · 7 | 12 · 7 · 7 | 13 · 7 · 7 | 12 · 7 · 7 | 12 · 7 · 7 |

(Music grid's 20 is after my last pass; music has since moved the tab numbers onto plain Numeric, and keeps one deliberate extra, the lighter "Collection -" prefix. The section look's one red mark is the logo's dot, which is the brand. Home is red because red is Home's section hue. Fonts: three families everywhere, but mono is now only time codes, durations and track numbers. Old site at 1000: 13 · 2 · 15, 24 / 24.)

**L1 · Colour roles + `look`.**
- The tokens are in `kit/yarn.css` ("i10 · system · ROLE TOKENS"), with exactly the contract's names, plus:
  - `--c-on-tex` / `--c-on-line`: the on fill's texture and hairline
  - `--c-deco`: prose bullets, a quote's bar, the h2 rule
  - `--c-wip`
  - `--sec-live`: Thoughts' live is `--gold-deep`, because white on gold is 2.3:1
  - `--c-ball-line`
- The tokens are declared on `:root` and on every `[data-section]`, so a nav tab or a demo wrapper resolves its own hue. Any wrapper can carry `data-look="ink"`.
- Kit pages get `[data-section="kit"]` (ink). Studio and contact are ink, with on = the ink fill.
- Contrast, measured: white on live / deep on soft / on-fg on on-bg ≥ 4.5 in every section × look.
  - red 4.86 / 4.98
  - blue 4.59 / 6.34
  - purple 5.23 / 7.17
  - gold-deep 5.64 / 4.79
  - ink 16.6 / 8.06
- `?look=section|ink` is in OPT, set on `<html>` before first paint, and is a ⚙ Open group. So are `stitch`, `font`, `cardart` (when a `.yfolder` is on the page) and `shuffle` (on Music), all readable as `Yarn.opts.*`.
- Re-pointed: every accent in `yarn.css` (outside MUSIC FOLDER CARD + POST CARDS), `player.js`, `blocks.js` and `studio/*`. In detail:
  - **The nav.** The current tab is the **here** rope. The other tabs' section dots are grey (cotton-2 + ink-3) until hover / focus. The brand dot is `--c-brand`.
  - **The rope.** `.ysel` re-declares `--tex-rope` on itself from `--rope-a/-b`, so every single choice is the **pick** rope (ink). The nav and Home's section buttons are **here**. The player's queue row is **live**.
  - **Toggles.** `?toggle=red` (decided) now means the **on** role. Instrument and project-type chips that are on keep their content tint (no solid fill).
  - **Buttons.** `.btn--red` is an alias of `.btn--primary` (ink), and `Yarn.dlink({ primary })` emits `.btn--primary`. `.btn--live` exists.
  - **The page title's dot** is `--c-live` (section) / `--c-brand` (ink).
  - **The timeline** ball, strand and knots, and the strand's knots, are pick (an ink yarn ball).
  - **Focus** on the search field and text fields is ink, not red.
  - **Links** in prose, details and `.ylinkbtn` use the link role.
  - **The sound toggles** (tag, nav, bars) use on.
  - **Status.** Dropped is grey; Studio's "changed" is WIP gold.
  - **The lightbox's** close is neutral, its video play / scrub are live.
  - **The disc label, waveform and `.yeq`** are live. Toasts carry no accent.
- In the other agents' areas I only did small exact colour edits in `studio/*` (mine). Pages and music re-pointed their own files (they asked me not to touch them).

**L2 · `?stitch=calm` (default) | full.**
- Under calm, buttons, chips, segments, the search field, text fields, nav tabs, section buttons, Browse and the suggestions are flat white with a 1px `--c-act-line` hairline at rest (lift + hairline on hover).
- The sheet, cards, the year pill and the player shell keep their stitches.
- The ink focus ring always wins. The calm rules skip `:focus-visible` / `:focus-within`, and the test asserts it.

**L3 · Type roles.**
- Tokens `--fs-* --fw-* --tr-* --lh-* --ff-*`, the `--t-*` shorthands (`font: var(--t-title)`), the classes `.t-display … .t-num` and `.t-caps`, and the spacing tokens `--sp-1…7`, `--gutter` and `--card-pad` (phones under 720px: Display 30, Heading 20, gutter 16, pad 16).
- One block, "i10 · system · L3 · TYPE ROLES IN THE KIT", moves every kit part onto a role:
  - **Display:** the page title, an item page's title.
  - **Heading:** the opened item, the player's title, prose h2.
  - **Title:** the year pill, the nav brand.
  - **Label:** buttons, chips, segments, nav.
  - **Meta:** `.meta`, facts, `.ydate`, tags, counts.
  - **Micro:** badges, kickers, hints, the sound tag.
  - **Numeric:** time codes only.
- **Facts / `Yarn.cardMeta`:** Meta plus a quiet 15px ink-3 glyph ("✓ Completed Aug 2025"). WIP keeps a small gold disc. A type's / instrument's glyph is in its deep shade. A mixed collection keeps its split disc, because its two colours are the information. The match chip pads 4px on cards (neighbours stay ≥ 6px apart; pages caught a 1.3px case, now fixed).
- **The player:** the bar's name is Title (Label on phones), subs are Meta, the queue head is Title, time codes are Numeric, the panel title is Heading 22.

**L4 · One link part, one play part.**
- `Yarn.linkIcon`, `Yarn.copyBtn` and the player's links are now **one disc**, `.ylinkicon--link`: cotton-2, a Phosphor **duotone** glyph in ink-3 (5.7:1), no shadow. On hover / focus it fades to the site's colour with a white glyph (no brand → ink).
  - The duotone weight is vendored and trimmed to the link glyphs: `kit/vendor/phosphor/duotone/` (@phosphor-icons/web@2.1.1).
  - `Yarn.dlink`'s known-site glyphs are duotone too.
  - Utility discs (✕, open as page, prev / next) stay plain.
- **`Yarn.playBtn({ state, label, sm, primary, cls, attrs, aria, tag, eq })`** + `Yarn.playBtn.set(el, state, { label, aria })` = `.btn--play`:
  - `""` = act (white disc, ink ▶)
  - `current` = act + a 2.5px live ring
  - `playing` = the live fill with white `.yeq` bars (⏸ on hover / keyboard focus)
  - sizes 44 / `sm` 36; `label` makes a pill; `primary` = ink at rest
  - Music and Thoughts use it, and so do `Yarn.md`'s music block Play all and Studio's previews.

**L5 · The player in roles.**
- **Live** (`--p-red*` now reads `--c-live*`): ▶/⏸, the waveform / thread / disc ring, the scrub pin, the disc's label, the playing queue row (tint + rope). The glows are tinted by live, not raw red.
- **Neutral ink:** the volume fill and pin, prev / next, the caret.
- **On:** shuffle / repeat / the long-press acts when on.
- WIP gold (`pwipc=gold`) still re-points live, as decided.
- **`?shuffle=player`:** the desktop bar gets its own shuffle toggle (`.yp-bshuf`, before ⏮). It syncs with the panel's.

**L6 · Allo** (`kit/allo.css`, loaded only when chosen; `allo` = ROND 50, `allo-round` = ROND 100; opsz auto; the italics are loaded).
- **Measured, not eyeballed:**
  - x-height 50.5 vs Nunito Sans 48.6 → `size-adjust: 96%` (within 1%).
  - The real problem is Allo's **space glyph**: 0.16–0.18em at 800–900 against Nunito's 0.28–0.29em. That's why the word spaces closed.
- **The fix:** per-role tracking (looser than Nunito's) plus a per-element `word-spacing` (`--ws-k`).
- **Rendered word gap / font size** (`~/dev/temp/r3i10-system/allo-crops.mjs`), Nunito → Allo:
  - Heading .261 → .264
  - Title .266 → .261
  - Body .256 → .257
  - Meta .262 → .258
  - Label .274 → .277
  - Micro (caps) .357 → .378
- Letter density (width per character) matches within 2%.
- Crops at 1:1: `~/dev/temp/r3i10-system/shots/type-ramp-{nunito,allo,allo-round}.png`. The numbers are in `allo.css`'s header.

**L7 · `kit/looks.html`.**
- i8 (the frozen `../../v3-yarn-8/`), section and ink as live frames, side by side.
- Screens: Music grid "shadow" ▶ (glooming shadows playing via `?demo=<name>`), Music timeline ▶, Projects, Thoughts, Home.
- Width: 1440 / 1000 / 390 (phones get a phone frame). Compare: all three, section · ink, or i8 · section. Font: Nunito / Allo / Allo round (on the i10 frames).
- Frames pass `?embed&reduced`. State lives in the URL; the pickers are radios with the pick rope and arrow keys.

**L8 · Studio on the roles** (no section → ink).
- Toggles are on: the switch, a held grip, Preview, a tile's check, the library's pressed card, a playlist row's +.
- The FAB / New / Publish are primary (ink).
- Drop slots, drop lines, the block selection and upload progress are pick (ink). Focus is ink.
- The waveform pin is live. The gate's brand marks are `--c-brand`.
- Studio's remaining reds mean one thing: **an error** (invalid, over the limit, a blocking check, offline, unused, denied, delete).
- The previews use `Yarn.playBtn` and `Yarn.copyBtn`.

**Docs.**
- `kit/COMPONENTS.md`: § 1a colour roles + looks, § 2 type roles (+ Allo), § 2a spacing, § 5 the play part + the link disc, and the Open params.
- `kit/components.html`: three new sections under Foundations:
  - **Colour roles + looks:** four columns (section · Music / Thoughts / Projects, ink); each shows the role swatches, rest · pick · on, play rest · current · playing, the primary / act / link and the one link disc.
  - **Type roles:** the ramp.
  - **Spacing.**

**⚙ Open + questions.**
- `look`, `stitch` and `font` are kit Open groups. `cardart` and `shuffle` are there for music.
- `review/questions-i10.js` has `look` (rec section), `stitch` (rec calm) and `font` (rec nunito), each with `try` links into `kit/looks.html`.
- `node _tools/review-data.mjs` was re-run: 9 Open.

**Tests.**
- **`~/dev/temp/r3i10-system/roles.mjs` (35/35), in `regress.sh`:**
  - tokens + contrast for 5 pages × 2 looks
  - the play part's states, sizes, hover / keyboard focus and `set`
  - the link disc (one look on components, Projects and Music, duotone, hover fade)
  - the nav's here rope + grey dots (hover + Tab)
  - a pressed chip = on (+ reload)
  - stitch calm / full + focus rings on a chip and the search
  - Allo / Allo round load (ROND, mono stays Maple)
  - the player in roles for 2 looks × 2 shuffle modes (incl. clicking the bar's shuffle)
  - `looks.html`: mouse, arrow keys, URL, reload, compare, font, frames really load with embed, and a phone tap with no sideways scroll
- **Updated in place for the look I was asked to change:**
  - `r3i10-site/soundtag.mjs`: on = the page's on role, was red-deep
  - `r3i10-st-links/linkinfo.mjs` + `links.mjs`: the primary is `.btn--primary`, and the link disc's class list includes `ylinkicon--link`
- **The kit / Studio fixes those suites caught:** a draft glyph 1px narrower (the Studio pub column), the mixed disc, stack tags wrapping in Studio's narrow preview.
- **Run green:** r3i10-site 4/4 suites, r3i10-walk 7/7, r3i10-fix (player) all rc 0, every Studio suite (studio 2, st-links 4, st-music 5, st-polish 8, st-blocks 4, st-walk 4), r3i10-projects 69/69, music t-b3-acts 62/62.
- **`overflow.mjs`:** clean at 18 widths on every page (+ `kit/looks.html`, now in its list), and clean under `look=ink` (Music) and `font=allo` (Thoughts, kit).
- **`sweep.mjs`:** 141 loads, 3 with errors, in both looks. All 3 are the gallery `index.html`'s missing `_shots/i9-blocks-*.png`, already in the baseline. I added `kit/looks.html` plus an Allo and a `shuffle=player` page to the sweep: 0 errors.
- **Screenshots** (both looks, + blurred copies): `~/dev/temp/r3i10-system/shots/`.

**Open / unsure.**
- **Studio's nav** wears the hue of the area you're in (Projects' tab = the blue here rope). It's coherent with the site, but strictly "Studio is ink". One line in `yarn.css` makes it ink if wanted.
- **Folder-card styles** keep Music grid at 20 text styles (target ≤ 16). Music owns those and has cut two.

### music · M1–M9 (the Music page, `Yarn.folder`, the MUSIC FOLDER CARD CSS)
**M1 · Header + results line.**
- The title row is now the title and the Timeline / Grid switch only. The count line and "Shuffle all" are gone.
- A **results line** (`#mu-res`) sits between the tools and the list:
  - Left, in Meta: "26 releases · 52 tracks", or "3 releases · 6 tracks for “shadow”". Filters are named as their chips say them: "9 releases · 12 tracks · Piano".
  - Right: **▶ Play** and **⤮ Shuffle**, outlined Label buttons. On phones they're icon-only, named for screen readers ("Play the 6 tracks shown").
  - Nothing shown → the line steps away.
  - "tracks" counts the songs with audio, i.e. what Play plays. That's 52 of the 58 songs; the spec's example said 58.
- `?shuffle=player` (kit, Open): the line keeps ▶ Play, and Shuffle is the player bar's mode. System built the toggle (`.yp-bshuf`). Play respects the mode.

**M2 · The queue is exactly what's shown** (`shownItems` / `shownSongs` / `shownQueue` in `music.js`).
- **Who uses it:** Play, Shuffle, ▶ on a card or row, a tab, "+", the right-click / long-press Play next and Add to queue, and the player's next / previous all use this one rule.
- **The rule:**
  - A collection whose own text answers the search plays all its songs.
  - One shown only for some songs plays exactly the tabs it keeps.
  - Instrument and status filters narrow songs too (the mixed-collection case).
- **Playing:**
  - ▶ on a card starts at its first shown song and goes on through the set.
  - Play = in order with shuffle off; Shuffle = the same set, shuffled.
- **Details:**
  - The card's meta says "2 of 7 tracks" while a search narrows it.
  - A grey (left-out) song in the opened collection still plays, with its own collection.
  - The release page keeps its own queue: Play all = the release.

**M3 · The folder card** (kit `Yarn.folder` + MUSIC FOLDER CARD).
- **One box, one left edge** at `--card-pad`: the first tab, the title, the meta, the text and the first link disc.
- **Art:** 48px, top-right; `?cardart=left` puts it top-left with every line beside it.
- **Type:** Title, then ONE Meta line (status · date · "4 tracks": no brackets, not mono; a wrapped count never starts with a "·"). The text is Body, clamped to the same lines per row (2 in the 4-column grid, 3 in 2 columns).
- **The face:** the song's name sits on its own line (Body 600), not as a bold run. "more" is the link role.
- **The foot:** link discs on the left (the kit's one 32px disc). On the right, + and ▶ at one height: 36 on desktop, 44 on phones.
- **▶** is the kit's `Yarn.playBtn`:
  - act at rest;
  - current and paused = a live ring;
  - playing = the live fill with bars.
- **Pressed "+":** a quiet in-card chip (neutral fill, ink check), in both looks. Since the queue is now what's shown, every other card in the set reads "in the queue" after Play. A fill on each would fight the one live ▶.

**M4 · Gutters + tabs.**
- The tabs live **inside** the card as its top band (the back cover). Nothing hangs into the gap.
- The grid gap is `--gutter`, across and down.
- `bandRows()` gives a single that shares a row with a collection the same band height, so the titles in a row line up.
- Cards in a row are one height, with the foot on the bottom edge.
- Timeline rows and phone cards carry the band too. The timeline knots are recomputed from the pad, band and art, and stay level when a title wraps.

**M5 · Live** (R2).
- The playing card is the only solid accent on the page:
  - Section: the card body in `--c-live-soft`, its ▶ and its tab in the live fill.
  - Ink: a live rope on its edge, its ▶ and tab in red.
- Current but paused: the ▶ ring and the tab's live thread only.
- The stage's and release page's song rows do the same: a live tint or rope, and the art's ⏸ on the live colour. The pick rope no longer marks "current".

**M6 · Timeline, stage, `item.html`, phones** get the same roles and type:
- Rows: Title + Meta, a neutral ▶ and +.
- Song rows: the name is Title, its line is Meta, the length stays Numeric.
- Notes, menu and sheet: on the type roles. "more" and the notes' links are the link role; the poem edge is ink, not red.
- `phrow=card` and `mart` are as decided; mart's badge is act at rest and live while playing.

**M7.** Phone cards reserve two lines of text, so the list is one height. The 640–959 two-column list uses the gutter across and down. Nothing scrolls sideways.

**M9 · The i9 Music order**, done.
- `Yarn.musicOrder(…, "finished")` + `.groups` for the list and the year pills. The Year filter uses the same years.
- A collection's status, start and end come from `Yarn.musicFacts`. For example, aikisu's shorts now finishes Jul 2025 (its latest song) and sorts after Alphabet City.
- `data-siteorder` brings the kit's `mcomplete` question to Music.

**⚙ / questions.**
- `cardart` and `shuffle` (kit groups by system, Open) each have a question in `review/questions-i10.js`. I added a Music try link to `mcomplete`.
- The Jump-to search states are now "shadow" · "kakiguava" · "stalking". "alphabet shadow" no longer narrows: every Alphabet City song's notes say "shadow".
- Ran `review-data.mjs`: 85 groups, 9 open.

**Tests** (`~/dev/temp/r3i10-music/`, in `regress.sh`):
- `t-i10-queue.js`: hand-written sets for shadow · alphabet shadow · gurgling · kakiguava · tournament (matched itself) · Piano · Listen on YouTube · none; the player's Up next, ▶ on a later card, next stays inside, "+" / menu / tab, keyboard, touch 390, reload, shuffle=player, the release page.
- `t-i10-cards.js`: one left edge · art right / left · tabs inside · gap across = down = 24 · row heights · titles level · foot on the edge · column lines · lines clamp · Meta count · disc / button sizes at 1440 / 1100 / 1000; knots level with art; phones 390 / 720; keyboard order; touch.
- `t-i10-live.js`: solid accents counted by computed colour, at rest / playing / paused, section + ink, Space / Enter, timeline + stage, reload, touch.
- Updated in place (they asserted the old look):
  - `r3i10-music/t-m4-vol.js`: the volume ball is ink now (system L5).
  - `r3i10-fix/trk.mjs`: the big ▶ is the kit part, `.btn__l` / `data-state`.
  - `r3i10-fix/credit.mjs`: the count is on the meta line; the face test uses Alphabet City, because Revealed is first under M9 and its first song has no notes.

**Audit** (`~/dev/temp/r3i10-music/audit/`, ONLY=music), i8 → i10:

| Screen | i8 | i10 section | i10 ink | old site |
|---|---|---|---|---|
| Music grid "shadow", 1000 | 25 marks / 14 red / 31 styles / gaps 20 across, 42 down | 9 / 1 (the logo dot) / 18 (16 visible) / 24 / 24 | 8 / 7 / 18 / 24 / 24 | 13 / 2 / 15 / 24 / 24 |
| Music timeline, 1000 | 47 / 25 / 35 | 14 / 1 / 16 | 13 / 5 / 15 | |
| Music grid "shadow", 1440 | 25 / 14 / 31 | 9 / 1 / 18 | 8 / 7 / 18 | |

- Heights per row are equal: 250 / 250.
- The 2 extra grid styles are the player disc's hidden hover tip (the audit only checks the element's own opacity).
- The remaining folder-card extra is the "Collection - **Song**" title (prefix 600). That's the owner's own original design, kept on purpose.
- Ink's 7 red marks are all live: the card's rope, ▶ and tab, plus the player. They also include the logo dot and the title's dot (= brand).

**Shots** (`_shots/`):
- `i10-music-grid-{1440,1100,1000}.png` (+ `-artleft`)
- `i10-music-live-{section,ink}-1000.png`
- `i10-music-live-timeline-1440.png`
- `i10-music-live-phone.png`
- `i10-music-phone-list.png`
- `i10-music-res-phone.png`
- Blurred pair: `~/dev/temp/r3i10-music/audit/blur-both.png`.

## Round 2 (owner, 2026-11-18): back to i8's card, purple means music everywhere
The owner's words are verbatim in `_feedback/roundup-i10-r2.md`, with the screenshot `_feedback/i10-r2-cards.png`. Done in place in `v3-yarn-10` (no new folder). Everything else from round 1 stays: "keep the rest of ur changes".

**cards** (one agent: `Yarn.folder` + the MUSIC FOLDER CARD CSS, `music/*`, `projects/*`, the layout parts of `kit/posts.js` / POST CARDS)
- **C1 · The card goes back to i8's design** ("lets revert the general card design to i9/i8 not sure what this is doing"). i9 had no site, so i8 is the reference: `../v3-yarn-8/music/index.html?view=grid`.
  - Music's folder card takes i8's arrangement again: the art top-left, the title and its meta line beside the art, then the description and the foot across the card's full width.
  - It keeps i10's type roles (Title; Meta "✓ Completed Aug 2025 · 4 tracks", no mono, no brackets), colour roles (neutral at rest, live fill), quiet facts, duotone link discs and the queue rule.
  - `?cardart` is decided (i8's) and goes, along with its question.
  - **Projects:** the card foot goes back to i8's order: the stack on the left, the GitHub / ↗ discs on the right. Keep the shared disc part. The `pj-foot` question is answered by this, so it goes.
  - **Thoughts:** if i10 *moved* anything on a post card, rather than restyling it, put it back where i8 had it.
- **C2 · ▶ is the biggest button again** ("make play the biggest button again"). Use i8's sizes wherever the play part sits in a card, row or phone card: ▶ 44 on a desktop card, + and the link discs 32. ▶ stays neutral at rest and gets the live fill when it plays.
- **C3 · No top space on a single; the tabs stay connected.** The owner: "this looks particularly bad on non collections giving more top space … the extra top space on collections is fine", and "make sure the tabs on collection stays connected".
  - The folder tabs hang above the collection's card again, joined to it as in i8 and i1–i9. The chosen tab merges into the card's top edge. There is no separate tan band inside the card.
  - A single gets no extra space inside its card. In a row, the card bodies' tops line up (as in i8). The space above a single next to a collection is gutter, not card.
  - **Gaps:** 24 across. Down, 24 from the lowest card bottom of the row above to the top of this row's tallest thing: the tabs if it has a collection, else the cards. Measure it at 1440 / 1000 / 390.

**colour** (one agent: the role tokens in `kit/yarn.css`, `kit/player.js`, `kit/yarn.js` options, the colour bits of `kit/posts.js`, `thoughts/*.css`)
- **S1 · Live is Music's purple on every page.** The owner: "section colors would make the player ALWAYS purple because purple is music but u have it changing colors depending on the page".
  - Under `look=section`, `--c-live*` is purple everywhere, not the page's `--sec`. That covers the player bar / panel / disc on Projects, Thoughts and Home, a playing playlist track or song block on Thoughts, and Studio's player.
  - `look=ink` is unchanged (live = red).
- **S2 · Thoughts drops its section colour** ("thoughts doesnt really need it but keep the black vs red for options curious what id think").
  - Under `section`, Thoughts' here rope, on fills (the rail's rows, chips), picks and links stop using gold.
  - New Open kit option `?taccent=ink|red` ("Thoughts' accent"; `when` on Thoughts pages; default **ink**, red to compare), with a question in `review/questions-i10.js`.
  - The page frame stays gold, and so does the nav's Thoughts icon (its identity, as on every page).
  - Gold stays where it means WIP. Live stays purple (S1).
- **S3 · Bookmarks stay red** ("bookmarks should stay red"). The article ribbons are red in both looks, as in i8. So is the pick's yarn, the same mark (`--ypost-mark`).
- Update `DESIGN-i10.md` §4 (the role table) to match: live = purple in section; Thoughts = taccent.

Both agents: update the round-1 tests that asserted what changed, in place, and say so. Run `regress.sh` sections for your areas, `_tools/overflow.mjs` on the pages you touched, and the sweep in both looks. Then add a "Round 2 · done" note under this section.

### Round 2 · colour done (S1–S3)
**S1 · Live is Music's purple on every page** (look=section; look=ink unchanged, red).
- `kit/yarn.css` ROLE TOKENS: `--c-live*` = purple / purple-deep / purple-soft on `:root` and every `[data-section]` (it was the page's `--sec-live`). So the player's bar, panel and disc, every playing ▶ (`Yarn.playBtn`), a playing card's tint and tab, the lightbox's playing video and Studio's waveform pin are purple on Projects, Thoughts, Home (when a player is there) and Studio.
- New role **`--c-now*`**: "now", but not music. It is the page's own accent under section (`--sec-live`: Projects blue, Home red, Music purple, Studio ink, Thoughts `taccent`) and red under ink, exactly what live was in round 1 for these states. It covers:
  - the page title's dot (`.yhead__dot`; Studio's sheet head)
  - the article's reading bar and heading-jump flash (`thoughts/stitched.css`)
  - the ranking's drop targets, picking, drafted tiles, "you", the lit references (`thoughts/tier.css`, 19 uses)
  - the mini board's lit item (`.ypost__item.is-lit`)
  - Studio's "blaqat.net is live" dot and its pulse
  - `.btn--sec`
- `kit/player.js`: the player is Music's everywhere. Under section its on toggles (shuffle, repeat, the long-press acts) are Music's on (purple-deep on purple-soft) and its links hover purple-deep, not the page's hue. Ink keeps the page's ink fill.
- **A playing playlist track on Thoughts** now uses Music's song-row ladder (`music.css` M5): playing = the row's rope re-dyed live, plus its art's ⏸ on the live colour; paused-current = no rope. It was the ink pick rope. With the purple card tint and the purple Play all, everything playing on a Thoughts playlist is purple.
- Home loads no player (as in i8), so there's nothing to see there. The token is purple on Home, and the test and the screenshot mount the player to prove it.

**S2 · Thoughts' accent: `?taccent=ink|red`** (kit Open group "Thoughts' accent", `when` on Thoughts pages; default **ink**; `html[data-taccent]` set before first paint).
- Under look=section on Thoughts it re-points here, on, link hover, deco and now. The section grammar stays (a soft tint + deep text, the rope); only the hue changes:
  - **ink**: a warm grey tint `#e6dfd4` + ink, the ink rope, ink deco and now
  - **red**: red-soft + red-deep (Home's), the red rope, red deco and now
- Gold is gone from the here rope, the rail's All / type rows and tag chips when on, link hovers, the title's dot, prose bullets and the quote bar, the article's reading bar and TOC dot, and the ranking's drop / draft / "you". The rail's collection-link tiles and an article's about art (`.t-link__ic`, `.r-about__art`) were gold tints at rest; they're neutral now.
- Gold stays only on the cord frame and the nav's Thoughts dot (identity), WIP, and content colours (sticky notes, tier felts, gold pick stubs).
- `look=ink` ignores `taccent`. `kit/components.html` § roles now shows Thoughts in both accents (any `[data-section="thoughts"][data-taccent]` wrapper works).
- Question **`taccent`** in `review/questions-i10.js` (rec: ink). The `look` question and its ⚙ label now say "purple is live". `review-data.mjs` re-run.

**S3 · Bookmarks are red** in both looks and everywhere, Studio too, as in i8: `--ypost-mark` = red / red-deep. That's the article ribbon, the pick's yarn + knot, the type swatches' marks and the ranking's write-up bookmark.

**Docs:** `DESIGN-i10.md` §4 (the live row and a new "Now" row; Here / On / Link note `taccent`; a Bookmark row; a Round 2 paragraph), `kit/COMPONENTS.md` § 1a (+ now, bookmark, `taccent`) and § 15, `kit/components.html` § roles.

**Contrast** (WCAG, measured in `colour.mjs`):

| pair | ratio |
|---|---|
| white on purple (every ▶, the player) | 5.23 |
| purple-deep on purple-soft (live tint, the player's on) | 7.17 |
| Thoughts ink: ink on `#e6dfd4` (on rows, chips) | 12.57 |
| Thoughts ink: ink-3 on `#e6dfd4` (the rows' counts) | 4.95 |
| Thoughts ink: white on ink (now, "you") | 16.63 |
| Thoughts red: red-deep on red-soft (on rows, chips) | 4.98 |
| Thoughts red: white on red (now, "you") | 4.86 |
| TOC here text: ink-2 / red-deep on the sheet | 8.79 / 6.23 |
| link hover: ink-2 / red-deep on a card | 9.31 / 6.60 |
| bookmark red-deep text on white | 6.60 |

**Tests**
- New: `~/dev/temp/r3i10-colour/colour.mjs` (in `regress.sh`), **48/48**. It covers:
  - S1: the player's ▶ / waveform / disc label on Projects, Thoughts, Music, Home (mounted) and the ranking in both looks; the panel's shuffle on by mouse, Enter and Space; a phone disc tap; a playing playlist track by mouse, keys and touch (card, row rope, ⏸ art, Play all, then paused → current, and after a reload)
  - S2: `taccent` default / ink / red on the feed, the article and the ranking, with a gold scan over every visible element (proven to catch planted gold); a rail row by mouse, a tag chip by Space, state after a reload; `look=ink` ignores it; the ⚙ group on Thoughts only, Red by mouse → reload → Ink by Enter; a phone tag tap
  - S3: ribbons, the pick's yarn + knot and the swatch marks in section × both accents and ink; Studio's `--ypost-mark`
- **Updated in place** (they asserted round 1's colours; originals kept as `*.r1bak`):
  - `r3i10-system/roles.mjs` A + B: live = purple in section on every page (was the page's hue); `--c-now` = the page's accent (Thoughts ink) + contrast; the title's dot = now
  - `r3i10-pages/pages.mjs` (Thoughts): ribbons red in both looks (were the section hue / ink); the bookmarks, the pick's yarn and the swatch marks skipped in the "no red decoration" scans of the cards, the rail and the ranking page
  - `r3i10-thoughts/test-tier.mjs` T4: the picked outline is `--c-now` (was `--c-live`)
  - `r3i10-music/t-i10-live.js`: no change needed (Music's live was already purple)
- **Runs** (one suite at a time, `mine.sh`; logs in `~/dev/temp/r3i10-colour/logs/`):
  - green: system `roles.mjs` 35/35 · Thoughts feed 44/44, tag browser 71/71, ranking 69/69 · player-fix 10/10 · walk 7/7 · site 4/4 (sound tag 99/99, sticky 26/26, panel 42/42, mobile) · every Studio suite (flows 153/153, mobile 22/22, st-links 4, st-music 5, st-polish 8, st-blocks 4, st-walk 4) · `colour.mjs` 48/48
  - **not mine, from cards' C1 / C3 (layout):**
    - `pages.mjs` 239/245: the 6 fails are "one left edge · title" on scratch and playlist cards (the quote is inline again and the record leads the head, `yarn.css` "r2 · cards · C1"). Every colour check in it passes.
    - `walk2/probe-gaps.js` 0/6: the Music grid's card-to-card gap down is 44, because the tabs hang above a collection again (C3 measures 24 to the tabs). The other 8 walk2 probes pass.
- `overflow.mjs`: Thoughts clean at 18 widths (default, `taccent=red`, `look=ink`); `kit/components.html` clean.
- Sweep: 150 loads, 0 errors (section); 150, 0 (`EXTRA="look=ink"`); Thoughts with `taccent=red`: 21, 0.

**Audit** (`audit.mjs`, `ONLY=thoughts`; before = round 1, after = now; marks by colour family):

| Thoughts | before: accent marks · red · gold | after |
|---|---|---|
| section 1440 | 27 · 6 · 22 | 26 · 18 · 10 |
| section 1000 | 20 · 3 · 18 | 19 · 15 · 6 |
| section + `taccent=red`, 1440 / 1000 | – | 27 · 20 · 10 / 20 · 17 · 6 |
| ink 1440 | 16 · 7 · 10 | 27 · 19 · 10 |
| ink 1000 | 9 · 4 · 6 | 20 · 16 · 6 |

- **Gold:** no gold accent is left. The 10 that remain at 1440 are the nav's Thoughts dot (identity) and content colours: the sticky note, the tier B felt and its items' dots, and the rail swatches' paper / tier colours.
- **Red:** the 12 new red marks are all S3 bookmarks, as the owner asked: 4 article ribbons, 2 picks' yarn + knot, and the rail swatches' ribbon / dot / record marks.
- **Ink look:** it rises by the same 11, because its bookmarks were ink in round 1.
- Text styles: section 17 → 15 (1440) and 15 → 13 (1000), from cards' changes.

**Screenshots** (`_shots/i10r2-colour-*.png`):
- Thoughts: `thoughts-{ink,red}-{1440,1000}` (1440 with Articles on), `thoughts-lookink-1440`, `article-{ink,red}-1440`, `tier-{ink,red}-1440`, `thoughts-playlist-playing` (+ `-ink`)
- the player under section: `player-projects` (+ `-panel`), `player-thoughts` (+ `-panel`, `-phone`), `player-home` (+ `-panel`, the player mounted), `player-music`, and `player-projects-ink`

**Unsure / left:**
- With `taccent=ink` the title's dot is ink: a plain period, because it follows the page's accent (`--c-now`). Under `look=ink` it's still the brand red.
- The rail's type swatches use `--ypost-mark`, so their small marks went red with the bookmarks. They mirror the cards' marks, as in i8.
- `kit/blocks.js`' song block never marks a playing row (no `aria-current` sync). It only appears in Studio and the kit, and the player is purple there, so I left the behaviour alone (system's file).
- The lightbox's playing video stays on live, so it's purple in section: it's something playing.


### Round 2 · cards done (C1–C3)
**C1 · i8's card again**, with round 1's type and colour roles, quiet facts, duotone discs, gutters, results line and queue kept.
- **Music's folder card** (`Yarn.folder` in `kit/yarn.js`, MUSIC FOLDER CARD in `kit/yarn.css`, `music/*`):
  - The art (54) is top-left. The Title and its ONE Meta line ("✓ Completed Aug 2025 · 4 tracks") sit beside it. The text and the foot span the card's full width.
  - The padding is i8's: 16 (12 under 960).
  - The face's song name leads its notes as a run again (Body 600, not round 1's line of its own), so the notes keep every line.
  - Timeline rows and phone cards follow the same arrangement.
- **`?cardart` is gone:** the option, `data-cardart`, its CSS, its question and the gallery link. `review-data.mjs` re-run: 85 groups, 9 Open.
- **Projects** (`projects/*`): the foot is i8's order. The stack is on the left, its first icon on the text edge. On the right are the write-up pill and then the GitHub / ↗ discs (the shared 32px disc), the last disc on the right edge. The `pj-foot` question is gone.
- **Thoughts:** what round 1 *moved* is back where i8 / i9 had it, and its restyles stay (`kit/posts.js` cards, POST CARDS layout lines):
  - the kicker's date is on the right
  - a pick has two foot rows: links + shelf, then tags + Read / Write-up
  - a playlist's record leads its head on the left, and Play all leads its foot
  - the images post's links have their own row
  - the article ribbon is at 22px from the edge
  - the scratch's opening quote is inline
- **Fixed on the way:** "Read →", the shelf and "Write-up →" sat 8px high in their 32px row. The go-link rule's `font` shorthand reset its `line-height`.

**C2 · ▶ is the biggest button.** It's 44 on every Music card, timeline row and phone card. The + is i8's 32px disc, the same size as the link discs. ▶ stays neutral at rest and takes the live fill while it plays.
- `kit/components.html`'s folder demo and Studio's library preview (`studio/studio-editors.js`, one line: it's a picture of the site card's foot) follow the same sizes.

**C3 · The tabs hang above, joined, and a single has no top space.**
- The tab strip sits before the card, 20px (`--yfolder-peek`) above its top edge, with i8's back cover behind it.
- **Joined:** the strip is in front of the card but clipped at the card's top edge. Every tab touches the card, at rest and when it lifts. The chosen tab merges into the edge: the card's white with a live thread when paused, the live fill while playing. A filtered-out tab slips down behind the card.
- **Room above, never inside:** a collection's folder has `margin-top: 20px`. A single in the same grid row gets `.is-band` (music.js `bandRows`, repurposed), which adds the same margin outside its card. So the card bodies in a row start on one line. Round 1's tan band inside the card and the single's padding are gone.
- A solo collection's empty strip is hidden once its tabs have gone.

**Measured** (`t-i10-cards.js` and `~/dev/temp/r3i10-cards/measure.js`), in section and ink:

| | 1440 | 1000 | 390 |
|---|---|---|---|
| card bodies in a row | level | level | level (two-column list too) |
| title under the card's top edge | 16 on every card (= padding) | 16 | 12 |
| gap across | 24 | 24 | – |
| gap down, to the tabs or cards | 24 | 24 | 16 |
| ▶ · + · link disc | 44 · 32 · 32 | 44 · 32 · 32 | 44 · 32 · – |
| tabs touch the card | yes (clip line = card top ±0.5) | yes | yes |

Audit (`audit.mjs`, Music grid "shadow" playing, 1000), i8 → now:
- section: 17 → 10 marks, 15 → 1 red, 31 → 18 styles; gaps 20 / 42 (23 to the tabs) → 24 / 24 (24 to the tabs)
- ink: 9 marks, 8 red, 18 styles, 24 / 24
- Projects grid: 10 styles (round 1: 11). Thoughts under section: 13 at 1000 and 15 at 1440 (round 1: 16 / 18).

**Tests**, updated in place (originals kept as `*.r1bak`):
- `r3i10-music/t-i10-cards.js` **112/112**. It was round 1's anatomy (art top-right, tabs inside, 36px buttons, `cardart` both ways). It now asserts i8's anatomy in both looks:
  - the art top-left, the title and meta beside it, the text, links and first tab on the padding
  - the tabs above the card and touching it
  - body tops level per row, and no extra room in any card
  - gap down measured to the tabs = 24 = across
  - ▶ 44, + and discs 32
  - phones: the gap to the tabs (16), the tabs joined, the two-column rows level
  - timeline tabs above and joined
  - keyboard order: tab → open → links → + → ▶
  - the "shadow" screen's single has no band
- `r3i10-pages/pages.mjs` **245/245**:
  - Projects: the foot reads stack → write-up → links; the last disc sits on the right edge; tab order open → stack → write-up → links
  - Thoughts: the title edge reads the scratch quote's box (its mark is inline again) and skips the playlist title (beside the record); a pick's foot is its last row
- `r3i10-walk2/probe-gaps.js` **6/6**: per row, to the tabs (it read 44 card to card).
- `r3i10-walk2/probe-meta-rows.js` **12/12**: its `cardart=left` case is now `look=ink`.

**Runs** (one suite at a time; `~/dev/temp/r3i10-cards/run.sh`, logs in `~/dev/temp/r3i10-cards/logs/`). All green:
- Music:
  - t-b1-rows 474, t-b3-acts 62, t-m1-cards 18, t-m4-vol 39, t-m5-search 23
  - t-i10-queue 79, t-i10-live 26, t-i10-cards 112
  - fix: knots, thinner, mart, phrow, trk, credit, ghost
  - walk2: probe-meta-rows, probe-gaps, probe-focus
- Projects 69/69. Thoughts: feed 44, tag browser 71, ranking 69. pages 245.
- walk: hist, legend, pdrag4, pill-scroll, pill, qrm, toastpos.
- Studio, which renders the folder card and the posts: st-music s9s6 65, s7 38, s8 25, s10 74, layout 82; st-links links 105, playlist 86, kit 21; st-walk music-walk 51.
- `overflow.mjs`: clean at 18 widths on `music/`, `projects/`, `thoughts/` (both looks), Studio's music and compose screens and `kit/components.html`.
- Sweep: 150 loads, 0 errors (section); 150, 0 (`EXTRA="look=ink"`).

**Shots:** `_shots/i10r2-{music-grid,music-shadow,music-timeline,projects-grid,thoughts}-{1440,1000,390}.png`, each i8 · section · ink side by side at 1:1. Each look on its own: `…-{section,ink}.png`. Grid shots from the suite: `i10r2-music-grid-{section,ink}-{1440,1100,1000}.png` and `i10r2-music-phone-list.png`.

**Unsure / left:**
- The playing tab (and a hovered one) still stands up 7 / 8px into the gap above, as in i8. The 24 is measured to the resting tabs.
- Thoughts' masonry places a few cards in other columns than i8 did, because the cards' heights changed with round 1's type. Nothing was moved by hand.
- `index.html`'s gallery text still describes round 1's card (it's generated). I only swapped its dead "Art on the left" link for i8's grid.
