# Iteration 11 · the build list

**Read `DESIGN-i11.md` first.** It is the spec: the owner's 13 rules turned into T1–T10. The owner's words are verbatim in `_feedback/rules-i11.md`. i10's spec (`_history/DESIGN-i10.md`, `_history/FEEDBACK-i10.md`) still holds wherever i11 doesn't change it: colour roles, cards, queue, tabs.

## Setup (done by the orchestrator)
- `v3-yarn-11/` is a copy of i10 after round 2, without `_shots`. **i10 is frozen** in `../v3-yarn-10/` and is the "before".
- The review store is `yarn.review.i11`. The round-up reads `review/options-i11.js` and `review/questions-i11.js`; i10's open questions are carried over.
- Tests are copied to `~/dev/temp/r3i11-*` and repointed. The runner is `~/dev/temp/r3i11-orch/regress.sh` and the baseline is `~/dev/temp/r3i11-wip/baseline.log`. The audit is `~/dev/temp/r3i11-audit/audit.mjs`.

## The contract

### New `<html>` attribute
| attr | values (default first) | ⚙ |
|---|---|---|
| `data-hw` | `500` · `400` | Open: "Heading weight" |

### Type tokens (system re-defines them; everyone uses them, never a raw size)
- Keep i10's names (`--fs-*`, `--fw-*`, `--tr-*`, `--lh-*`, `--t-*`, `.t-*`) with DESIGN-i11 T1's values.
- `--fs-label` is "button text": the context sets it to its body size − 1.
- **The card context** re-declares `--fs-title / --fs-body / --fs-meta / --fs-label` (16 / 14 / 12 / 13) on `.ycard`, `.yfolder`, `.ypost`, track rows and Studio's cards. Pages get the in-card sizes just by using the roles.
- `--ff-head` (Nunito) is for Display, Heading and Title. `--ff-body` (Nunito Sans) is for everything else. `--ff-num` = `--ff-body` + `tabular-nums`. `--font-mono` is for code only.

### Inset and radius tokens
- `--inset` (16 / 12 phone), `--r-inner`, and `--r-card: calc(var(--inset) + var(--r-inner))`.
- Further pairs for the sheet, popover, player, field and Studio pane. They follow the formula in DESIGN T10.
- Write `--r-card` wherever you wrote `--radius-card` (keep `--radius-card` as an alias).

### Spacing
`--sp-8: 64px` is added. `--section-gap` is 48 / 32 phone, and every page uses it between its sections.

## Build list

### system · the kit, the player, Studio, the audit (L)
- **L1 · The audit's rules report (first).** Extend `~/dev/temp/r3i11-audit/audit.mjs` with the checks in DESIGN "Measuring", as `node audit.mjs <i10|i11> [params]` → `<name>-rules.json`, plus a one-line summary per screen. Run it on i10 for the before. Tell the others when it's ready: write `READY` into `~/dev/temp/r3i11-wip/audit-ready`.
- **L2 · Tokens (first, with L1).** T1, T2, T4, T5, T9 and T10's tokens, the card context and `data-hw`. Add the ⚙ group "Heading weight" (Open), and its question in `review/questions-i11.js`.
- **L3 · The kit's parts on the rules.** Buttons, chips, segments, fields, the nav, the folder-tab type, the hint, toasts, popovers, the lightbox, `.ysel` / rope / focus on `--r-card`, `Yarn.detail`, `Yarn.md` prose (T3: an upright blockquote; T7: balance; prose bold 600), and `kit/blocks.js`.
- **L4 · The player** (`kit/player.js`): its type on the roles, insets and radii (bar, panel, phone slot, page), no italics, no mono.
- **L5 · Studio** (`studio/*`): the same rules everywhere (T1–T10), including the cuts (T8) in Studio.
- **L6 · `kit/looks.html`**: i10 (`../../v3-yarn-10/…`) next to i11, on the owner's screen plus Projects, Thoughts and Home. **`kit/components.html` + `kit/COMPONENTS.md`**: the type scale table, card context, inset / radius system.
- **L7 · Checks.** A suite `~/dev/temp/r3i11-system/rules.mjs` that asserts T1–T10 on kit parts, Studio and `components.html`, at 1440 / 1000 / 390, in both looks and with `font=allo`.

### music · the Music page (M)
- **M1 · Type.** The page (title, tools, results line, year headings, timeline, item page, song notes) and the folder card on the roles, with the card context. The year headings are Headings (22) or smaller than them, never smaller than a card title.
- **M2 · Insets and radii (T10).** The folder card: equal insets; art, track rows, the playing tint and the foot on the nested radii; ▶ one inset from the corner. Track rows and the timeline rows follow the same rules. The tabs stay i10 r2's (outside the card, connected).
- **M3 · Section breathing room (T6)** on the list, grid, timeline and item page.
- **M4 · Cuts (T8)** on Music, with a table.
- **M5 · Checks.** Measured tests in `~/dev/temp/r3i11-music/t-i11-rules.js`: card vs page sizes, insets on all four sides of every card in a row, radii nesting, no lone words in titles at 1440 / 1000 / 390, the tabs still connected, and gaps 24 / 24 still holding.

### pages · Projects, Thoughts, Home (P)
- **P1 · Type** on Projects (list + stage, grid, item page), Thoughts (feed, every post card kind, article, rankings, tag browser) and Home, with the card context. Thoughts' month headings and Home's section heads are Headings.
- **P2 · Insets and radii (T10)** on post cards, project cards, the stage, the pick, the playlist's record, image sets, rankings rows and Home's buttons.
- **P3 · Breathing room (T6)** on every page, plus article sections.
- **P4 · Cuts (T8)** on all three pages, with a table. Kickers, decorative chips and duplicate "more" / "Read" buttons are the likely ones.
- **P5 · Checks.** `~/dev/temp/r3i11-pages/rules.mjs`, the same measures as M5 across these pages, plus touch / keys / reload on anything moved by a cut.

## Done
(each agent adds its section here: per ID, the cut table, ⚙ / questions added, test files, the audit before → after)

### music · done (M1–M5)
i10 r2's decisions all still hold: ▶ 44 is the biggest button, the tabs hang outside and joined, gaps are 24 / 24 (16 on phones), and purple means live. Files: `music/music.css`, `music/music.js`, `Yarn.folder` (`kit/yarn.js`), the MUSIC FOLDER CARD section of `kit/yarn.css`, `kit/swatch.js`, plus one bullet in `kit/COMPONENTS.md` (§14 folder card).

**M1 · Type.** Everything is on system's roles; the folder, track rows and timeline rows are card contexts.
- **Cards and rows:** Title 16/500 Nunito · Body 14/400 Nunito Sans · Meta 12 · tabs Micro 12/500.
- **Numbers:** tab numbers, track lengths, "no audio" and the counts are tabular Nunito Sans. There is no mono anywhere on Music.
- **Page roles:** Display 36 (28 on phones). The results line is Meta 13 and its buttons are Labels 14 (the page's body − 1). The opened release's title is Heading 22. The year pills are system's Heading 22 (phones 20): bigger than a card title, never bigger than Heading.
- **Weights:** the "Collection - **Song**" prefix is now 400 (it was 600; the title is 500). The face's song run-in, the matched word in a song's notes line and the `trackmatch=mark` knot are 500 (they were 600 / 700 / 700).
- **Upright:** the quote in a song's notes ("> " lines) is upright; its ink rule marks it.
- **Line height:** the notes text (rows and sheet) is Body 1.5 (it was 1.6 / .9rem).
- **Balance:** titles get `text-wrap: balance`; descriptions and notes get `pretty`.
- **Lone words (T7):** balance alone still left "Alphabet City / Collection" and "home region / ambient" in the timeline's 151px column at 1000. `Yarn.folder` now keeps the last two words of a 3+-word title together (a no-break space) when they are ≤ 15 characters, so the pair always fits. A first try at 18 characters broke "Tournamen / t" in that column; that was measured and fixed. The solo title's " - " is now no-break before the dash, so no line starts with "-".

**M2 · Insets and radii (T10).** Every surface's radius is its inset + `--r-inner`, so anything sitting in a corner is 8.

| Surface | Inset (all four sides) | Corner | Inside |
|---|---|---|---|
| Grid card, phone card | `--inset` 16 (12 under 720) | `--r-card` 24 / 20 | art 8 · ▶ one inset from the bottom and right |
| Timeline row | 12 (re-declares `--inset` + `--r-card` on `.mu-tl .yfolder`) | 20 | art 8 |
| Track row (`.mu-trk`, system's row pair) | 8 (was 8 / 12 / 8 / 10), row 56 | 16 | art and its ▶ scrim 8 |
| Long-press menu (pop pair) | 8 | 16 | items 8 |
| Song-notes sheet (`songnotes=sheet`, sheet pair) | 16 | 24 | swatch 8 |
| Stage / opened panel (system's panel pair) | `--inset-panel` 24 (Music's 30 / 14 went) | `--r-panel` | the opened card keeps its centred 900px column with `max(--inset-panel, …)` |

- The rope (`--ysel-r`), the focus ring and the playing tint follow each corner. The badge / cover art-play button follows the art's corner.
- `Yarn.folder` no longer hands the swatch a fixed 12; the CSS gives it the card's corner. `YarnSwatch.html` now also accepts a CSS length for `radius`.

**M3 · Section breathing room (T6).** `--section-gap` (48 / 32) between header → tools → results line → the list (the kit's `.yhead` / `.ytools` plus Music's `.mu-res`). The year sections are 48 apart (32 on phones) on the grid, phone list and timeline, because their pills are the list's Headings. Inside a section: pill → cards 16 (12 on phones), cards 24 / 16, timeline rows 16.

**M4 · Cuts (T8).** Neither cut contradicts an owner decision, so no question was added.

| Page | What | Why | Where it went |
|---|---|---|---|
| Music: stage, opened card, release page | the "TRACKS" label over the track list | a label that names what the rows already are | The head is just its count in Meta words: "4 tracks · 6:51" (was "TRACKS 4 · 6:51"); while a search narrows it, "1 of 4 match". "Tracks:" stays for screen readers (`.sr-only` in the `h3`). |
| Music: grid card, phone card (`songnotes=face`) | the face's "more" link | duplicated the card's own link: both opened the release's page (it added `&track=`) | While the face shows a song, the card's own link carries that song (`?track=<id>`, named "…, at <song>'s notes"), so a click or tap anywhere on the card lands where "more" did; it lets go when the face does. A cut notes line ends in "…". |

Kept on purpose: the results line's Play / Shuffle (owner); the collection card's copy-link disc (the owner missed the quick copy links in i2); "Collection - Song" (the owner's design); the year count, "made with …", "no audio" and "4 tracks" (facts, as Meta words).

**M5 · Checks.**
- New: `~/dev/temp/r3i11-music/t-i11-rules.js` **184 / 184**, added to `regress.sh` under "i11 agents' suites" (`V=1` prints every measure). It covers:
  - grid and phone list at 1440 / 1000 / 390, section + ink: card vs page sizes, the scale, weights, upright, families, tracking, lone words, the four insets of every card measured from the art and ▶, nested radii + rope, gaps 24 / 24 (16), tabs joined, section and year gaps;
  - the timeline + stage: rows 12 / 20 / 8, track rows 8 / 16 / 8, names and lengths, no "Tracks";
  - the release page at 1440 and 390;
  - the M4 cut by mouse (hover a tab, click the card → the release with that song's notes open), keyboard (tab → Tab → Enter), touch (a tap on a phone card's body while a song plays) and reload (the link resets);
  - the menu's pop pair.
- Existing suites, all green and unchanged (no test asserted the old look): t-b1-rows 474 · t-b3-acts 62 · t-m1-cards 18 · t-m4-vol 39 · t-m5-search 23 · t-i10-queue 79 · t-i10-cards 112 · t-i10-live 26 · fix/{knots, thinner, mart, phrow, trk, credit, abar2, discrim, disccut, ghost} all ok · walk2/{probe-shuffle 4, probe-meta-rows 12, probe-gaps 6, probe-focus 10, probe-esc 5}. Studio's folder / swatch users: st-music s9s6 65 · s7 38 · s8 25 · s10 74 · layout 82 · st-polish s13-swatches 127 · st-walk music-walk 51.
- `_tools/overflow.mjs --only music` (18 widths): clean, section and ink.
- `sweep.mjs music`: 36 loads, 0 errors, plain and `&look=ink`.

**Audit, i10 → i11** (`audit.mjs`, ONLY=music; outputs in `~/dev/temp/r3i11-music/audit11/`):

| Screen (1000) | sizes off-scale | weights off | mono-UI | tracking | page / card title | btn = body − 1 | lone | unbalanced | insets | radii |
|---|---|---|---|---|---|---|---|---|---|---|
| grid "shadow" (owner's), section | 2 (40, 13.5) → **0** | 39 → **0** | 6 → **0** | ✗1 → **monotonic** | 17/17 ✗ → **17/16 ✓** | 0/15 → **15/15** | 1 → 1* | 7 → **0** | 3/4 → 3/4† | 0/3 → **3/3** |
| list (timeline + stage), section | 2 → **0** | 162 → **0** | 35 → **0** | ✗1 → **monotonic** | 17/17 ✗ → **17/16 ✓** | 0/18 → **18/18** | 4 → **0** | 36 → **0** | 21/27 → 22/27‡ | 0/26 → **26/26** |
| release page, section | 2 → **0** | 16 → **0** | 2 → **0** | ✗1 → **monotonic** | – | 0/7 → **7/7** | 0 → 0 | 1 → **0** | – | – |

- Ink reads the same on all three. At 1440 the grid and the release page match the table; the list reads lone 0 → 0 and insets 26/27 → 26/27 (only the player bar misses there).
- Signal is unchanged: owner's screen 10 marks / 1 red (section), 9 / 8 red, all live (ink). Text styles 18 → 19 (section), because card text is 1px smaller than page text by rule 5, so the roles split.
- \* The one lone word was the `.sr-only` ": " of "Collection - Song". System's audit now skips `.sr-only`; visibly the title wraps "The 4th Beepbox Tournament - / Gleaming Shadows".
- † The grid's miss is the player bar (`.yp-bar`, system's; the disc is a separate fixed layer the audit can't see).
- ‡ The list's misses are the player bar plus 4 single releases whose titles wrap at 960–1279: their last line is a status fact, which the kit holds at 20px (`.ymeta--facts .yfact { min-height }`, so a search-matched fact's pill doesn't grow the card) around 16px of text, so the bottom reads 14.4, not 12. It's a real optical ~2px. System keeps it and lists it as known.

**Said plainly.**
- **The results line floats** (T6 applied literally). With 48 above and 48 below, "3 releases · 6 tracks for “shadow” · ▶ Play ⤮ Shuffle" sits as far from the list it plays as from the tools: `_shots/i11-music-results-line-gap.png`. I kept the rule. My taste would make it the list's own first line (24 below, inside the list's section); that's the owner's call.
- Track rows at an 8 inset are tighter than i10 (the stitch line runs 3px outside the art), but read fine at 1:1 (`_shots/i11-music-release-1440-section.png`).
- Nunito 500 still reads as the heading at 36 / 22 / 16, and the blurred owner's screen still says what's playing (`_shots/i11-music-owner-1000-section-blur.png`).

**Shots** (`_shots/`):
- the owner's screen: `i11-music-owner-1000-{section,ink}.png`, the before `i11-music-owner-1000-before-i10.png`, and `…-section-blur.png`
- `i11-music-grid-{1440,1000}.png`
- `i11-music-timeline-1440.png`
- `i11-music-release-1440-section.png` · `i11-music-release-390-ink.png`
- `i11-music-phone-{section,ink}.png`
- `i11-music-results-line-gap.png`

**⚙ / questions:** none added, so `review-data.mjs` didn't need a re-run.


### system · L1–L7 (the kit, the player, Studio, the audit) · done

**L1 · the audit's rules report.** `~/dev/temp/r3i11-audit/audit.mjs` + `rules.mjs`: `node audit.mjs <i10|i11> [params] [outdir]` → `<name>-rules.json` per screen, `rules-summary.json`, and one `rules · …` line per screen. Screens: i10's six plus the music item, project item, an article, a ranking, Studio and `kit/components.html` (`SCREENS=site` for the six only; `W=1000`; `ONLY=`; `RULES=0`). It measures the whole document (not just the viewport):
- sizes on the scale (12 · 13 · 14 · 15 · 16 · 17 · 20 · 22 · 28 · 36), weights (400 / 500, prose bold 600), families, Maple Mono outside code, italics (an author's `*em*` in prose allowed);
- tracking against size (a smaller size may not track tighter), large heads' line height (≥ 20 → ≤ 1.2, ≥ 28 → ≤ 1.1, nothing ≥ 16 looser than 1.5);
- card vs page per role (title / body / meta / label, in a card = outside − 1);
- every button's text against its context's body (rule 6) and its nearest text;
- headings and titles ending on a lone word (under half the line), and heads without `text-wrap: balance`;
- each surface's four insets (what you see: surface boxes, media, icons, inline words by their glyphs) and its nested radii (inner = outer − inset, min 4; pills, circles and icons exempt).
- Tuned with music and pages while they used it: card material (aria-hidden absolute bits, anything hanging off the edge) isn't content; SVG text is art; an unfilled pill counts by its words, not its padding; `.sr-only` text isn't a lone word; folder tabs (Micro) and number overlays aren't rule-6 button text; with one family (Allo) a heading is the 500 text.
- Known limits: a fixed layer floating over a surface (the player's disc over `.yp-bar`) isn't seen as its content (my suite measures the disc directly); a row's right inset reads the empty space when its content is left-aligned (rows that fill their width read true).

**L2 · tokens** (`kit/yarn.css` "i11 · system · L2 · THE TYPE SCALE", `kit/yarn.js` `OPT.hw`):
- `--fs-*` in whole px: display 36 / 28 phone, heading 22 / 20, title 17, body 15, meta 13, label 14, micro 12, num 13. Weights `--fw-head` 500 (Display, Heading, Title; `?hw=400`), label + micro 500, body + meta + num 400, `--fw-bold` 600 (prose). Tracking −.025 / −.015 / −.006 / 0 / 0 / 0 / +.01em; line height 1.05 / 1.15 / 1.25 / 1.5 / 1.4 / 1 / 1.2.
- `--ff-head` Nunito (Display, Heading, Title) · `--ff-body` Nunito Sans (Body, Meta, Label, Micro) · `--ff-num` = the body family + `tabular-nums`. `--font-mono` (Maple Mono 400) for code only. Google Fonts: Nunito upright 400–900 (no italic), Nunito Sans + its italic to 600 (prose `*em*`).
- **The card context**: `.ycard .yfolder .ypost .yrow .mu-trk .yp-row .yp-qr .ytrkrow .pj-card .pj-row .r-pickcard .tl-card` + Studio's cards + `.y-incard` re-declare `--fs-title / body / meta / label / num` (16 / 14 / 12 / 13 / 12) and the composed `--t-*`.
- T10: `--inset` 16 (12 phone) + `--r-inner` 8 = `--r-card` 24 (20) · `--inset-row` 8 / `--r-row` 16 · `--inset-pop` 8 / `--r-pop` 16 · `--inset-field` 4 / `--r-field` 12 · `--inset-player` 12 / 20 · `--inset-sheet` + `--inset-pane` 16 / 24 · `--inset-panel` 24 (16) / `--r-panel` 32 (24). `--radius-card` is an alias; `--card-pad` = `--inset`.
- T6: `--sp-8` 64, `--section-gap` 48 / 32 phone.
- `data-hw` (500 · 400) on `<html>`, ⚙ Open "Heading weight", question `hw` in `review/questions-i11.js`; `node _tools/review-data.mjs` re-run (86 groups, 10 open).

**L3 · the kit's parts** (`kit/yarn.css` "i11 · system · L3", same selectors later in the file; `.ycard` / `.yrow` edited in place so pages' and music's own paddings still win):
- type: every part on a role; the page's own `body` is Body 15 / 1.5 (was 16 / 1.55); an unclassed `b` / `strong` is 500, prose bold 600; buttons, chips, segments, fields, the search, Browse's chips, toasts, the hint, the lightbox, the detail shell (kicker, back, the `--lg` title), the pager, the strand, the nav (phones too), kbd; tags you can press are Labels, display-only tags Meta; numbers tabular; no Maple Mono outside code.
- T3: the prose blockquote is upright (its rule marks it); T7: `h1–h4`, every head role, prose h2–h4 and the nav wordmark balance, `p` is `pretty`.
- the year pill (`.yyear`) is a Heading on every page (rule 2: card titles 16 sit under it), a pill with its inset equal all round; in the year rail and a small timeline it's a Label.
- T10: buttons / chips / segments / tokens / Back hold their words `(height − 1em) / 2` from their ends; `.ycard` 16 all round, radius 24, rope + focus on it; `.yrow` 8 + 8 = 16; fields 12 / radius 12 (8 one inset into a card); the search's suggestions 8 + 8 = 16; the hint and the detail nav's tip; prose quote / code / images on `--r-inner`; the lightbox's pills; the opened item (`.ypanel`) on `--inset-panel` / `--r-panel` with Back one inset from its top.
- T6: `.yhead` and `.ytools` sit `--section-gap` above what follows (phones too); `.ygroups` and an item page's blocks are `--section-gap` apart.
- Allo: both families, numbers included; its bold oblique `@font-face` dropped (only prose `*em*` slants); its tracking row stays monotonic (label + meta now 0 like body).
- fix found on the way (i10 had it too): under stitch=calm an invalid field lost its deep-red edge and a select its chevron.

**L4 · the player** (`kit/player.js`): its rows are the card context; the bar's name is a Title 16, subs Meta, times Nunito Sans tabular; the open panel's title a Heading 22 (balanced), notes Body 15, "no notes" upright; tabs, mute, the disc's tip Labels; no Maple Mono, no 600+. T10: bar radius 20 (12 + 8, was 22), who 52 tall one inset (12) from the bar's edges with radius 8, its words still 24 in (the panel's edge); the disc in the bar 52 at 12 (was 56 at 10); the open panel holds its content 24 from every edge and its top corners grow to 32 (24 + 8) as it opens, the art 8, queue rows 12; phones: who 6 in the 64 slot, radius 14.

**L5 · Studio** (`studio/studio.css` "i11 · system · L5" + two inline label styles in `studio-links.js` / `studio-tiers.js`): every text on a role (the title field and Home's hello Display; sheets' and panes' heads Heading; section cards, rows, toggles, options Title; hints, file names, times Meta tabular; field labels, tabs, menu items Label; the woven tags Micro). Maple Mono stays only in the raw markdown editors. The small-caps labels were headings in disguise: the dashboard's sections are Headings 22 over the 16 cards (rule 2), form sections and sheet groups Titles, the preview's notes Meta, no uppercase. Status choices read as Labels. T10: section cards 16 all round, rows 12, the preview pane 16 + 8 = 24, sheets 16 / 24 with fields at 8.

**L6 · `kit/looks.html`**: i10 (the frozen `../v3-yarn-10`, the before) next to i11 on the owner's screen (Music grid at 1000, "shadow", glooming shadows playing) by default; also Music timeline, Projects, Thoughts, an article, Home, Studio; 1440 / 1000 / 390; compare i10 · i11 (either look), both looks (4 frames), i11 headings 500 · 400, i11 Section · Ink; Allo. **`kit/components.html`**: "Type scale" (each role on the page and in a card, its size · weight · family measured live), "Spacing" (`--sp-8`, `--section-gap`), a new "Insets + radii" (the token table + four measured demos), "Faces"; the showcase's own type on the roles. **`kit/COMPONENTS.md`**: § 2 type scale, § 2a spacing, § 2b insets + radii, § 2c faces, `hw` under Kit params.

**L7 · checks**: `~/dev/temp/r3i11-system/rules.mjs` (in `regress.sh` under "i11 agents' suites").

**⚙ / questions added**: `hw` (Open, "Heading weight", 500 · 400) + its question (`kind: "ask"`, rec 500).

**Cuts (T8)** in my areas — little was decorative; most labels name something the layout doesn't:
| page | what | why | where it went |
|---|---|---|---|
| kit/looks.html | the "default" badge on a column | a decorative badge; the column's note already says "as built" | gone |
| Studio (dashboard, editors, sheets) | uppercase small caps on section labels | not cut: they were section headings in disguise (rule 2) | now Headings / Titles / Meta, no caps |
| kept | the player's "Up next", "About this song / About <collection>", Studio's "STUDIO" tag, the collection editor's "Tracks n", the looks page's group words | each names something the layout or an icon doesn't say (whose notes, which list, which tool) | — |

**Rules vs taste (said plainly, not bent):**
- Weights 800–900 → 500: Nunito 500 still reads as a heading at 22 and 36 (size + family carry it); at 16 a card title leans on the family more than weight. The yarn look survives (it lives in the cloth, stitches and rope, not the weight). `?hw=400` flattens titles against the body a lot: rec 500.
- T7: `text-wrap: balance` can itself leave a lone word when the last word is just under half the line (seen only in a 162px demo column; the components demo flow is 240px now). `pretty` avoids that but doesn't balance; I kept balance (T7 says so).
- The year pill as a Heading is ~45px tall; it reads as the section head it is, but it's the loudest neutral thing in a timeline.
- `.ymeta--facts .yfact`'s 20px min-height leaves a real 2.4px optical difference at the bottom of rows whose last line is facts (music found it); kept so a WIP disc doesn't change row heights.
- Articles keep i10's reading size 17 (on the scale), tracked −.006em like every 17 (T4); T1's Body 15 everywhere else.
- `--section-gap` 48 makes the list tops airy at 1000 (header → tools → results line → list, each 48); it's the rule.

**Tests**: `~/dev/temp/r3i11-system/rules.mjs` (in `regress.sh`) **41/41**: A tokens + card context + `hw` (3) · B the type rules on components.html at 1440 / 1000 / 390 × section / ink + Allo, and Studio (dashboard, project, article, publish, media; 1440 / 1000 / 390, both looks) (19) · C the insets demo measured, ▶ one inset from both edges, nested radii, the rope flush on a card's own radius, the focus ring on it, hover only lifts (4) · D header → tools = `--section-gap` on Projects + Music at 1440 / 390 (4) · E the player's bar, who, disc and words, the open panel's corners / art / title, phones (5) · F the ⚙ "Heading weight" group by mouse, keys, touch and after a reload (3) · G Studio's sheets and preview pane (3).
- Updated in place (they asserted the look i11 changes): `r3i11-system/roles.mjs` G (Allo numbers are Allo, not Maple Mono: T9) and I (`kit/looks.html` is i10 vs i11 now) → **35/35**.
- My area's existing suites, all **rc=0** after the changes: site (soundtag 99, sticky 26, panel 42, mobile), studio (flows 153, mobile 22), st-links (4 suites), st-music (5), st-polish (8), st-blocks (4), st-walk (4), walk (7), fix (10, + discrim / disccut re-run after the disc change), walk2 (9), colour. One flake: `walk2/probe-player-rest.js` 11/13 once while the other agents' browsers ran; 13/13 alone.
- The baseline itself ran against the live folder while all three of us edited (its `test-feed` 5 / `test-tier` 2 / `pages.mjs` failures are pages' area).

**Overflow · sweep**: `_tools/overflow.mjs` (18 widths): **clean** on every Studio screen, `kit/components.html` + `kit/looks.html`, the open player (`music/index.html?player=panel`) and the owner's screen. Sweep (`sweep.mjs`, both looks): 150 loads, **3 with errors, the same 3 as the baseline**: `index.html` asks for `_shots/i10-hero-*.png`, which the i11 copy doesn't have (the orchestrator's page; not changed).

**Audit, i10 → i11** (`node audit.mjs i10|i11 "look=…"`, final `rules.mjs`): i10 (round 2, the frozen folder) → i11, the owner's width (W=1000, section). 1440 and ink give the same picture (every off-scale size, off weight, Maple Mono and italic on every screen is 0 in i11). Insets / radii left on Music, Projects and Thoughts are those agents' (see their sections).

| screen | off-scale sizes | off weights | mono UI | italic | tracking ✗ | lh ✗ | btn = body−1 | lone | unbalanced | insets ok | radii ok |
|---|---|---|---|---|---|---|---|---|---|---|---|
| music-grid-shadow | 2 → 0 | 39 → 0 | 6 → 0 | 0 → 0 | 1 → 0 | 0 → 0 | 0/15 → 15/15 | 1 → 0 | 7 → 0 | 3/4 → 3/4 | 0/3 → 3/3 |
| music-list | 2 → 0 | 162 → 0 | 35 → 0 | 0 → 0 | 1 → 0 | 0 → 0 | 0/18 → 18/18 | 4 → 0 | 36 → 0 | 21/27 → 22/27 | 0/26 → 26/26 |
| projects-grid | 2 → 0 | 118 → 0 | 0 → 0 | 0 → 0 | 1 → 0 | 0 → 0 | 0/51 → 55/55 | 0 → 0 | 7 → 0 | 0/12 → 9/12 | 0/10 → 10/10 |
| projects-list | 3 → 0 | 111 → 0 | 0 → 0 | 0 → 0 | 2 → 0 | 0 → 0 | 0/18 → 18/18 | 0 → 0 | 10 → 0 | 0/0 → 0/0 | 0/0 → 0/0 |
| thoughts | 3 → 0 | 246 → 0 | 8 → 0 | 0 → 0 | 2 → 0 | 0 → 0 | 0/73 → 73/73 | 0 → 0 | 20 → 0 | 0/22 → 14/22 | 0/27 → 27/27 |
| home | 2 → 0 | 44 → 0 | 0 → 0 | 1 → 0 | 2 → 0 | 5 → 0 | 0/5 → 5/5 | 0 → 0 | 3 → 0 | 0/0 → 0/0 | 0/0 → 0/0 |
| music-item | 2 → 0 | 16 → 0 | 2 → 0 | 0 → 0 | 1 → 0 | 0 → 0 | 0/7 → 7/7 | 0 → 0 | 1 → 0 | 0/0 → 0/0 | 0/0 → 0/0 |
| projects-item | 3 → 0 | 20 → 0 | 3 → 0 | 0 → 0 | 1 → 0 | 0 → 0 | 0/6 → 6/6 | 0 → 0 | 2 → 0 | 0/0 → 0/0 | 0/0 → 0/0 |
| thoughts-article | 4 → 0 | 34 → 0 | 4 → 0 | 1 → 0 | 3 → 0 | 0 → 0 | 0/4 → 5/5 | 0 → 0 | 1 → 0 | 0/0 → 0/0 | 0/0 → 0/0 |
| thoughts-tier | 7 → 0 | 88 → 0 | 4 → 0 | 0 → 0 | 9 → 0 | 0 → 0 | 4/17 → 17/17 | 0 → 0 | 2 → 0 | 0/3 → 2/3 | 0/5 → 5/5 |
| studio | 4 → 0 | 99 → 0 | 0 → 0 | 0 → 0 | 3 → 0 | 0 → 0 | 0/10 → 10/10 | 0 → 0 | 22 → 0 | 0/4 → 0/4 | 0/4 → 0/4 |
| components | 12 → 0 | 1236 → 0 | 320 → 0 | 0 → 0 | 26 → 1 | 18 → 0 | 0/335 → 337/337 | 0 → 0 | 136 → 17 | 4/60 → 22/60 | 0/53 → 53/55 |

- After those runs I fixed the last of mine: Studio at 1000 now reads insets **4/4** (a short section card's last line sits on the bottom inset), radii 2/3 (the one left is a tilted fanned print 18.8 from the right edge: not a nested pair by design); components reads tracking ✗**0**, unbalanced **0**, radii **55/55**. Components' inset misses (22/60) are the showcase's post cards (pages') and kit demo cards whose last line is a facts row: the fact's 20px min-height leaves 2.4px between its words and the bottom inset (see "Rules vs taste").

**Screenshots** (`~/dev/temp/r3i11-system/shots-i11/`, each `-section` / `-ink`, plus `-blur`): `type`, `type-390`, `insets`, `buttons`, `fields`, `md`, `player-bar`, `player-panel`, `player-390`, `player-page-390`, `studio-dash`, `studio-dash-390`, `studio-new`, `studio-project`, `studio-article`, `looks-section`, `hw-500-projects-1000` / `hw-400-projects-1000`.

### pages · P1–P5 (Projects, Thoughts, Home) · done

**P1 · Type.** Every role on Projects, Thoughts and Home now comes from system's tokens, so nothing in my files sets a raw size, and inside a card each role is 1px smaller by itself (Title 16 · Body 14 · Meta 12 · Label 13).
- **Projects** (`projects.css`):
  - The no-image monogram is Heading 500 (it was 900).
  - Row titles and card titles balance; card text is `pretty`.
  - The year pills are Headings (22): the kit's `.yyear` now, from system.
- **Thoughts, the cards** (`kit/posts.js` + POST CARDS):
  - In-card roles, with the kicker kept as Micro caps (Nunito Sans 500).
  - Nothing heavier than 500 (it was 750–900): the quote mark, the about pill's name, "+N", the offline card.
  - Mono went from the external-track links, the shelf count, the ranking %, and the durations (tabular Nunito Sans now).
- **Thoughts, the page** (`stitched.css`):
  - Month pills are Headings (22).
  - Article: the dek is 17 in Body's face at 1.5; the TOC, facts, sign-off, table and figcaption are on the roles.
  - The code window keeps the mono for code only, at 14; its language tag is Micro caps.
  - Comments in code are upright (the grey says "comment").
- **Thoughts, the ranking page** (`tier.css`, ~60 raw fonts went):
  - The tier letter is Display at 500; tile names are the in-card Label.
  - The side-card stat numbers are a tabular Title. Rule 1 puts nothing in a card above its Title; this replaces i10's 2.6rem / 900 figures.
  - The comments heading is a Heading; mentions and likes are Labels (the likes were mono).
- **Home** (`home.css`):
  - The tagline is upright Body (it was italic 700).
  - The bio is 17 at Body's 1.5 (it was 17–18.4 at 1.7). "aiden" and the keywords are 500 (they were 750).
  - The phone stack circles are 24, so they sit inside the 25.5px line.

**P2 · Insets and radii (T10).**
- **Insets.** Every card holds its content `--inset` in (16, 12 on phones) on all four sides: post cards, project cards, the sticky note (its tape ends above the kicker), the ranking's side cards and the compose box.
  - Rows use the kit's row pair (8 + 8 = 16): Projects' timeline rows, the rail's collection rows, the article's about patch.
  - Phone project cards use the card pair. The stage and the opened card use the kit's panel pair.
- **Nested radii** (inner = outer − inset):
  - Project art: 8.
  - The article's cover: 8, now 16 in on all sides. Its top margin had been collapsing through the card's 0 padding, so it sat flush on the card's top edge; the card's padding holds it now.
  - Image-set thumbs: 8, and their dashed inner line 4.
  - The playlist's track rows reach 8px past the text edge, so their art sits ON it: row 16, art 8, and the playing rope follows the row's radius.
  - The mini board: tray 8, items 4. The pick keeps its hang-tag shape (stub side 8, open side 24), and its rope and focus follow it.
  - The tag browser and the comment suggestions use the popover pair (8 + 8); their field is 8.
  - Ranking board: tile 16 with art 8 inside; tray 24 and its felt key 24 (16 / 12 / 8 on phones).
  - Home's "Press unmute" bubble is 16 in on all sides; the Skip pill keeps its words (44 − 1em) / 2 from its ends.
- **The rows that start and end a card hug their content.**
  - The kicker row is its 20px circle (it was 24, and the date's wrapper carried a 22.5px line box).
  - A foot row is its tallest part.
  - A last row of only #tags hangs the pills' padding below, as the first tag already hangs left. The words then sit 16 from the bottom edge as they do from the left.

**P3 · Breathing room (T6).** The header, the tools and the list are a section apart (48, 32 on phones), from the kit.
- Projects' and Thoughts' year / month groups are a section apart too. Thoughts' rail: header → tools 48, groups inside 24.
- Home: tagline → bio → section buttons 48, contact 24 under the buttons.
- Article: the sign-off is a section after the prose; the ranking's comments are a section below the board.
- Every gap in my files is on the 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 scale (14 / 10 / 9 / 6 / 5 / 3 went).

**P4 · Cuts (T8).** Restore any of them by its row.

| Page | What | Why | Where it went |
|---|---|---|---|
| Thoughts feed, Studio's previews | "Read →" on every article card | It repeated the card's own link (it was even aria-hidden) | The whole card opens the article; hover lifts it |
| Thoughts (`?pickart=article`, Earlier) | "Read →" on a pick that is an article | Same | Its title is the link |
| Thoughts rail | The "Type", "Tags", "Year" labels | They named what their chips already say (type swatches + names, #tags, years) | Screen-reader headings (`.sr-only`); each chip group is still `aria-labelledby` its heading. "Collections" keeps its label, because its rows don't say what they are |
| Thoughts article | "Posted" and "Reading time" in the side rail | The kicker above the title says both on the same screen (phones already hid them) | The kicker; the side rail keeps Built with · Links · Tags |
| Projects timeline | The "Has a write-up" badge on a row (`.pj-row__wu`) | A decorative badge for a fact | The stage's write-up link once the row is open; the row's button still says ", has a write-up" to screen readers |

- **Not cut, asked instead:** the kicker's caps type word ("ARTICLE", "PICK", …). The owner asked for the caps kicker in i3, so it's question **`cut-kicker-type`** (`kind: "cut"`, rec cut, in `review/questions-i11.js`).
- **Considered and kept, because each is a fact, another destination or the owner's own words:**
  - the playlist's "4 tracks · 10:11"
  - the ranking card's "4 comments" (a deep link to the comments)
  - the write-up pills
  - the shelf link
  - the "% who agree" note
  - Home's tagline and the section buttons' counts
  - "On this page"
- No ⚙ options added.

**P5 · Checks.**
- **New:** `~/dev/temp/r3i11-pages/rules.mjs` (in `regress.sh`), **384 / 384**. It covers Projects grid / timeline / item, the feed / article / collection / ranking, and Home, at 1440 / 1000 / 390 in section and ink (ink at 1440 / 390). Per screen:
  - sizes on the scale, weights 400 / 500, nothing slanted, no mono outside code, titles in Nunito
  - in-card Title 16 / Body 14 / Meta 12, and rule 2 (section headings > card titles)
  - no lone last word (and `balance`) on any title
  - four equal insets on every card, and every nested radius pair
  - T6: the section gaps on Home, Thoughts' rail and the article
  - the cuts by mouse, keys, touch and reload:
    - the article card's empty corner opens it (click and tap); Tab + Enter on its title opens it; still no "Read →" after a reload
    - the rail's groups are still named; Tab from All reaches a type row, Space toggles it, and it survives a reload
    - the article side rail stays clean on → to the next article
    - a timeline row opens by Enter, its stage links the write-up, and it survives a reload
- **Updated in place** (they asserted i10's look; originals in `*.i10bak`):
  - `r3i11-pages/pages.mjs`:
    - titles 16 / 500, card text 14, timeline names 16 / 500, kickers Nunito Sans 12 / 500
    - the card-body click now scrolls the first card into view: the taller grid keeps the write-up card's scroll on Back
  - `r3i11-thoughts/test-feed.mjs`: the rail's tag gaps are 8 / 4 (they were 6 / 5, off the scale).
  - `r3i11-colour/colour.mjs`: the go-link hover reads a pick's shelf link, since the article's "Read →" is cut.
- **Runs** (one at a time):

| Suite | Result |
|---|---|
| `pages.mjs` | 245 / 245 |
| `rules.mjs` | 384 / 384 |
| Thoughts: feed / tag browser / ranking | 44 / 71 / 69 |
| Projects `tests.js` | 69 / 69 |
| `colour.mjs` | 48 / 48 |
| site: sound tag / mobile | 99 / 99 · clean |
| Studio suites that render post cards: st-links links / playlist / kit | 105 / 86 / 21 |
| st-polish S13 / S14 / S16 | 127 / 170 / 39 |
| st-walk links / xplay | 62 / 8 |
| `overflow.mjs` (18 widths): home · projects · thoughts, section and ink | clean |
| `sweep.mjs` on home, projects, thoughts | 57 loads, 0 errors, section · 57, 0, `EXTRA="&look=ink"` |

**Audit** (`audit.mjs` rules report; out: `~/dev/temp/r3i11-pages/audit/{i10,i11}-{1440-section,1000-section,1440-ink}/`). i10 → i11 at 1440, section; 1000 and ink match it within 1 except where noted.

| Screen | off-scale sizes | off weights | mono | italic | tracking ✗ | lh ✗ | btn = body − 1 | unbalanced | insets | radii | text styles |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Projects grid | 2 → 0 | 120 → 0 | 0 → 0 | 0 → 0 | 1 → 0 | 0 → 0 | 0/58 → 58/58 | 7 → 0 | 0/12 → 9/12 | 0/10 → 10/10 | 10 → 13 |
| Projects timeline | 4 → 0 | 129 → 0 | 1 → 0 | 0 → 0 | 2 → 0 | 0 → 0 | 0/19 → 19/19 | 10 → 0 | n/a | n/a | 14 → 15 |
| Projects item | 3 → 0 | 20 → 0 | 3 → 0 | 0 → 0 | 1 → 0 | 0 → 0 | 0/6 → 6/6 | 2 → 0 | n/a | n/a | 15 → 15 |
| Thoughts | 3 → 0 | 246 → 0 | 8 → 0 | 0 → 0 | 2 → 0 | 0 → 0 | 0/73 → 73/73 | 20 → 0 | 0/22 → 14/22 | 0/27 → 26/26 | 15 → 21 (13 → 18 at 1000) |
| Article | 4 → 0 | 34 → 0 | 4 → 0 | 1 → 0 | 3 → 0 | 0 → 0 | 0/4 → 5/5 | 1 → 0 | n/a | n/a | 20 → 18 |
| Ranking | 7 → 0 | 88 → 0 | 4 → 0 | 0 → 0 | 9 → 0 | 0 → 0 | 4/17 → 17/17 | 2 → 0 | 0/3 → 2/3 | 0/5 → 5/5 | 18 → 18 |
| Home | 2 → 0 | 44 → 0 | 0 → 0 | 1 → 0 | 3 → 0 | 5 → 0 | 0/5 → 5/5 | 4 → 0 | n/a | n/a | 7 → 6 |

- The type on my screens went from 11 · 12 · 13.5 · 15 · 17 · 40 at 400 / 500 / 600 / 800 / 900 to 12 · 13 · 14 · 15 · 16 · 17 · 22 · 36 at 400 / 500 only.
- Accent marks are unchanged except Thoughts (26 → 30 at 1440). The cards are shorter, so the 900px window shows more of the feed: the mini board's lower tier felts (one sky blue) and another bookmark. Both are content colours; no new accent at rest.
- **Text styles went UP on Thoughts and the Projects grid. That's the rules, not drift:**
  - Rule 5 splits every role into a page size and a card size (Label 14 / 13, Meta 13 / 12, Body 15 / 14).
  - Rule 2 gives the month heading its own 22 (i10's pill shared the 17 Title).
  - Rule 6 makes the tags, which are toggle buttons, Labels (13).
- **What the insets column still counts.** The card padding is 16 on all four sides everywhere (`rules.mjs` asserts it), so these are measuring artifacts, not layout:
  - Thoughts' 8: 5 picks read 50 on the left (their 34px hang-tag stub, then 16 from its seam). 3 sticky notes are tilted 0.4–0.7°, which pads their bounding boxes by 1–2px.
  - Projects grid's 3: the cards without GitHub / ↗ discs read 24.5 at the bottom. Their stack keeps the foot's 32px centre line, the same line as the discs on the card beside them, rather than dropping onto the inset and breaking the row's alignment. That's a choice of grid alignment over the literal inset.
  - The ranking's 1: the crowd-notes card's last line ends 1.5px up (half-leading).

**Rules vs taste (said plainly):**
- **Nunito 500 carries a title.** It still reads as a title at 16 against 14 / 400 body: size, the rounder face and ink vs ink-2 do it. It's quieter than i10's 800, and the yarn look survives because the materials carry it.
- **The ranking's big numbers.** At the in-card cap (Title 16), "214 people ranked this" and the "you agree on n / N" figure lost their poster size. That's rule 1 + T1's table (no Display in a card) applied literally. If it reads too flat, the owner may want an exception for a card's one stat. Crop: `shots/i11-tier-section-1440.png`.
- **The kit's year pill as a Heading** (system, everywhere) makes the timeline's years noticeably bigger. It reads well on the grid and the feed.

**Screenshots** (`~/dev/temp/r3i11-pages/shots/`):
- before / after stacked (i10 top): `cmp-{thoughts,projects-grid,home}-{section,ink}-1440.png`, `cmp-thoughts-section-1000.png`, `cmp-390.png` (Thoughts + Projects phones, i10 / i11)
- the playlist card close-up: `pl-i10.png` / `pl-i11.png`
- every screen in both looks at 1440 / 1000 / 390: `i11-<screen>-<look>-<w>.png` (and `i10-…`)
- blurred (1000, section): `blur-i11-*.png`

### orchestrator · after the three agents
- **The results line heads the list (T6).** The music agent applied T6 literally (48 above and below the results line) and flagged that it then floats away from the list it plays. Decided: it belongs to the list's section, so it sits one gutter above the list (24, 16 on phones), with the tools still `--section-gap` (48 / 32) above it. Changed in `.mu-res` in `music/music.css`. `t-i11-rules.js` now asserts this: 190 / 190.
