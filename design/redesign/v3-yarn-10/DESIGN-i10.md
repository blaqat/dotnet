# Iteration 10 · Hierarchy, signal and grid

The owner went back to the site and kept preferring the old one (blaqat.net), even though the yarn site looks better and does more. Their read: on the old site you can tell at once what matters. Purple *is* music, and the thing that's playing is the only thing in a different state. On the yarn site, red is everywhere, so you can't tell what's playing. Titles don't feel like titles, the card parts don't line up, the icon buttons don't match, and the gaps between cards differ across and down. The owner's words are in `_feedback/roundup-i9-site.md`, with the screenshot `_feedback/i10-music-old-vs-new.png`.

This page is the design brief: what we measured, why the yarn site reads as overload, the rules we design by now, and the directions to compare. The agents' build list is in `FEEDBACK-i10.md`.

## 1 · What we measured

The same screen on both sites: Music grid, 1000px wide (the owner's window), searching "shadow", with glooming shadows playing. The audit script is `~/dev/temp/r3i10-audit/audit.mjs`; marked-up shots are in `~/dev/temp/r3i10-audit/out-*/` (`*-marks.png` boxes every accent mark).

| | Old site | Yarn i8 |
|---|---|---|
| Accent marks on screen | Purple: the Music tab, the playing card (tint + filled pause), its tab, the player. Instrument chips are soft tints. | **14 red** (nav 2 · title 1 · filters 1 · cards 5 · player 5), plus blue, purple and gold nav icons and gold fills |
| The playing card vs the others | It's the only filled button, and its card is tinted | All three play buttons are the same solid red; only the glyph differs (▶ vs bars) |
| Distinct text styles on screen | **15** | **31** |
| Font sizes | **5**, on a scale: 12 · 14 · 16 · 18 · 24 | **13**: 10.5 · 11 · 11.5 · 12 · 13 · 13.5 · 14 · 14.5 · 15 · 15.5 · 17.5 · 19 · 44 |
| Weights | 400 · 500 · 600 · 700 | 400 · 500 · 600 · 750 · 800 · 850 · 900 |
| Font families | 1 | 3 (Nunito · Nunito Sans · Maple Mono). The mono sits at 10.5–12px inside every card |
| Gap between cards, across / down | **24 / 24** | **20 / 42** (23 to the next row's folder tabs) |
| Left edges inside a card | **1** | **2** (16px: the art, description and foot · 84px: the title and facts) |
| Link buttons | One look: grey duotone discs (SoundCloud, BeepBox) | A link glyph, the SoundCloud mark and a BeepBox circle on white discs, a + at 32px, and a red play at 44px |

The rest of the site at 1440 (i8): Music Timeline has 26 red marks, 36 text styles and 15 sizes. Thoughts has 22 red marks, 41 styles and 17 sizes. Projects grid has 4 red marks and 17 styles. Projects is the calmest page, and it's the one whose cards already put text left and media right.

## 2 · Why it reads as overload

1. **Red has seven jobs.** It means:
   - the brand (the logo dot, the title's dot)
   - where you are (the nav)
   - a single choice (Timeline / Grid)
   - a toggle that's on (All)
   - a primary action (every ▶)
   - what's live (the playing tab, the player)
   - a link ("more")

   When one hue carries every message, it carries none. The old site gave each section one hue and had a **state ladder**: outlined at rest → tinted when chosen → **filled when live**. The owner can find the playing card without glasses because it's the only filled thing.
2. **Too many voices in the type.** 13 sizes half a pixel apart don't read as levels; they read as noise. A card has four kinds of emphasis competing with its title:
   - a black status disc
   - a bold track name inside the description
   - a red "more"
   - mono counts

   The title stops being the only loud thing.
3. **No grid the eye can find.** There are two left edges per card. The folder tabs take the row gap, so cards are 20 apart across and 42 down. The foot buttons come in three sizes and three styles.
4. **Texture on every control.** Dashed stitches outline every chip, button, field and card. Texture should mark *surfaces* (the sheet, a card), not every control on them.
5. **Actions far from what they act on.** "Shuffle all" sits beside the view switch, which is a setting, not next to the list it plays. It also ignores the search: with "shadow" typed, it still shuffles all 58 tracks.

## 3 · The rules we design by now

- **R1 · A colour is a word.** Each hue means one thing on a page. If two things share a hue, they share a meaning.
- **R2 · The state ladder.** At rest a control is neutral. A chosen single option gets the rope; a toggle that's on gets a fill. Something **live** (playing, now) gets the accent fill. **Nothing at rest is a solid accent.** The only solid accent on a page is the thing that's live; with nothing live, the one primary action per view gets an ink fill.
- **R3 · One loud thing per region**: nav, header, tools, each card, the player.
- **R4 · Text roles, not sizes.** Every text is one of: Display, Heading, Title, Body, Meta, Label, Micro or Numeric (§5). That's six sizes and four weights in all, and **no more than three weights in a card**.
- **R5 · One left edge per card.** All of a card's text and its link row start on one line. The right edge holds the media (top) and the actions (bottom). *(Round 2: Music's card is i8's again, the art top-left with the title and meta beside it, so it has two edges: the art, text and foot on the padding, the title and meta beside the art. §6.)*
- **R6 · Equal gutters on an 8px grid.** The gap between cards is the same across and down: 24 on desktop, 16 on phones. Anything that hangs off a card (folder tabs) lives inside the card's own box, not in the gap. *(Round 2: folder tabs hang above the card again; the gap down is measured to their top, and a row with a collection keeps their room above every card. §6.)*
- **R7 · Same job, same part.** Every outside link (SoundCloud, BeepBox, GitHub, …) is one part: the same disc with the same duotone. Every play button is one part, and its state changes its *fill*, never its shape or size.
- **R8 · Actions sit with what they act on.** Play / Shuffle go on the results line and play **exactly what's shown** (§7).
- **R9 · Texture marks surfaces.** The sheet and the cards keep their knit and stitches; controls at rest are flat (`?stitch=calm`).

The owner's earlier rules all still hold:
- hover only lifts
- the rope sits flush on the edge
- toggles get a fill, single choices get the rope
- no floating footers
- no filler text
- nothing clips a hover shadow
- …

R2 changes the *colour* of the rope and the fill, never their form.

## 4 · Colour roles (the tokens)

Every use of an accent in the kit and the pages goes through one role token, so a direction only re-points roles:

| Role | Token(s) | Where it shows | i8 (as it was) | **Section** | **Ink** |
|---|---|---|---|---|---|
| Brand | `--c-brand` | the logo's dot, Home's accents | red | red | red |
| Here (where you are) | `--c-here*` | the nav's current tab, a phone's current section | red rope | section rope (Thoughts: the `taccent` rope, ink or red); the tab's icon stays in colour and the others go grey until hover | ink rope; the other icons go grey until hover |
| Chosen (one of a set) | `--c-pick*` (= `--rope-a/-b`) | Timeline / Grid, sort, Mine / Everyone, the opened row | red rope | ink rope | ink rope |
| On (a toggle) | `--c-on*` | filter chips, tokens, type rows | red fill (`--tog-red`) | section tint + section-deep text (Thoughts: `taccent` = a warm grey tint + ink, or red-soft + red-deep; the player's shuffle / repeat: Music's purple tint) | ink fill + white text |
| Primary (one per view, at rest) | `--c-primary*` | Visit site, Play all on a release page, Publish | red | ink fill | ink fill |
| Action (repeated, at rest) | `--c-act*` | every card's ▶, a row's ▶ | red fill | **neutral**: white disc, ink glyph, hairline | **neutral** |
| Live (playing) | `--c-live*` | the playing card, its ▶ (⏸ / bars), its tab, its timeline row, a playing track row, the player's bar / panel / disc | red | **Music's purple on every page** (r2: “purple is music”): solid fill + tint on the card | **red**: solid fill + a red rope on the card |
| Now (not music) | `--c-now*` | the title's dot, an article's reading bar + jump flash, a ranking's drop / draft / “you”, Studio's “site is live” | red | the page's own accent (Projects blue, Home red, Thoughts `taccent`, Studio ink) | red |
| Link (inline text) | `--c-link` | "more", "Read →", inline links | red-deep | ink, underlined (section-deep on hover; Thoughts: `taccent`'s deep) | ink, underlined (red-deep on hover) |
| Bookmark (r2) | `--ypost-mark*` | the article ribbon, the pick's yarn + knot, the type swatches' marks, the ranking's write-up bookmark | red | **red** (r2 · S3: “bookmarks should stay red”) | **red** |
| Status | `--c-wip` (gold) etc. | WIP gold, Complete ink, Dropped grey | as decided | as decided | as decided |

The section hues are already decided for the frame: Home red, Projects blue, Music purple, Thoughts gold (`--sec`, `--sec-deep`, `--sec-soft`). Studio has no section, so it uses ink.

**Round 2 (owner, 2026-11-18).** Purple is music: under *Section*, live is Music's purple on every page (the player, anything playing), never the page's hue; what is "now" but not music keeps the page's accent (`--c-now`). Thoughts has no section accent any more: its frame and the nav's Thoughts dot stay gold (its identity), gold elsewhere means only WIP, and its accent is `?taccent=ink` (default) or `red`, in the section grammar (a soft tint + deep text, the rope). Bookmarks are red in both looks. *Ink* is unchanged. Contrast: white on purple 5.23, purple-deep on purple-soft 7.17; Thoughts ink on `#e6dfd4` 12.57 (ink-3 4.95), red-deep on red-soft 4.98, white on red 4.86.

**Why two directions.** *Section* is the old site's logic in yarn materials: the page is dyed in its section's yarn, and the section hue means "here, and live". *Ink* keeps the black / red / white identity: black thread does the structure, and red means one thing, what's live. In both, nothing at rest is a solid accent; that's what fixes "I can't tell what's playing".

## 5 · Type roles

| Role | Nunito (today's fonts) | Use |
|---|---|---|
| Display | Nunito 40 / 900, −0.03em, lh 1.0 | the page title |
| Heading | Nunito 22 / 850, −0.02em | an opened item's title, a section heading |
| Title | Nunito 17 / 800, −0.012em, lh 1.25 | a card or row title |
| Body | Nunito Sans 15 / 400, lh 1.5, ink-2 | descriptions, prose in cards |
| Meta | Nunito Sans 13.5 / 600, ink-3 | dates, counts ("4 tracks", "26 releases"), status words |
| Label | Nunito 13.5 / 800, −0.003em | buttons, chips, nav, segments |
| Micro | Nunito 12 / 800, +0.01em (caps +0.08em) | folder tabs, kickers ("ARTICLE") |
| Numeric | Maple Mono 12 / 500, tabular | time codes, durations, track numbers. **Mono is only for numbers that line up.** |

- **Six sizes:** 12 · 13.5 · 15 · 17 · 22 · 40.
- **Four weights:** 400 · 600 · 800 · 900 (850 only for Heading).
- **Phones:** Display 30, Heading 20, everything else the same.
- **Status in meta is a word plus a small glyph** ("✓ Completed Aug 2025"). The glyph is 14px in ink-3, not a black 20px disc. WIP keeps its gold glyph; that's its one colour.

**Allo** (`?font=allo|allo-round`, the owner: "keep the option … make sure spacing is good"): Allo replaces Display, Heading, Title, Label, Micro and Body; Numeric stays Maple Mono. Allo started from Inter, so it is narrower and has a taller x-height than Nunito. To keep the spacing right:
- Each role gets its own tracking value for Allo. The kit's Nunito values are too tight for it and closed the word spaces in the preview.
- An `@font-face` `size-adjust` matches Nunito Sans's x-height within ±5%.
- Allo's optical-size axis is left on auto.

These are measured, not eyeballed: compare the word-space and x-height in crops of the same text in both fonts.

## 6 · Grid and card anatomy

**Spacing.** Every gap is a step of the scale **4 · 8 · 12 · 16 · 24 · 32 · 48**:
- card padding 20 (desktop) / 16 (phone); Music's folder card keeps i8's 16 / 12 (round 2)
- card gap 24 / 16, the same across and down
- a header's rows 16 apart
- the tools-to-results gap 24

**Round 2 (owner, 2026-11-18): the cards are i8's again.** "lets revert the general card design to i9/i8 not sure what this is doing · make play the biggest button again · keep the rest of ur changes". Round 1's one-grammar layout (art top-right, tabs as a band inside the card, 36px ▶) is gone. What round 1 changed in *type and colour* stays: Title / Meta / Body, the quiet status glyph, "4 tracks" in Meta, the duotone link discs, neutral ▶ at rest and the live fill, equal gutters, the results line and the queue.

**Music's folder card** (i8's arrangement):

```
     ┌─01 song─┬─02 song─┬─03 song─┐          tabs hang ABOVE the card (20px), joined to its top edge:
┌────┴─────────┴─────────┴─────────┴───────┐   the chosen tab merges into the edge, no seam
│ ┌─────┐ Title (Title)                    │
│ │ art │ ✓ Completed Aug 2025 · 4 tracks  │   the art top-left; the title + its Meta line beside it
│ └─────┘ (Meta)                           │
│ Description in Body, the card's full     │   the text and the foot across the full width,
│ width, clamped to the same lines in a row│   clamped to the same lines in a row
│                                          │
│ (sc) (bb)                     (+)  ( ▶ ) │   links 32 left · + 32 and ▶ 44 right: ▶ is the biggest
└──────────────────────────────────────────┘
```

- **Folder tabs** hang above a collection's card, joined to it as in i1–i9: they stand in front of the card's top edge and stop exactly on it, so they touch it at rest and when they lift, and the chosen (playing) tab merges into the edge.
- **The room for the tabs is outside the card.** A row with a collection keeps 20px above every card in it, so the card bodies line up and a single never gets extra space inside its card (the owner: "this looks particularly bad on non collections giving more top space"). A row without a collection has none.
- **Gaps:** 24 across. Down, 24 from the lowest card bottom of the row above to the top of the next row's tallest thing: its tabs if it has a collection, else its cards. Phones: 16.
- **▶ is the biggest button** on every card, row and phone card: 44. The + and the link discs are 32 (i8's sizes).
- **Projects' foot** is i8's order: the stack on the left, the write-up and the GitHub / ↗ discs on the right (the shared 32px disc).
- **Thoughts:** what round 1 *moved* on a post card is back where i8 had it (the date on the right of the kicker, a pick's two foot rows, a playlist's record on the left with Play all leading its foot, the images post's links on their own row, the ribbon at 22px, the inline quote mark). Its restyles stay.
- **Cards in a row are the same height.** The foot sits on the bottom edge, and descriptions clamp to the same number of lines.
- **The playing card**:
  - Section: a soft tint in the live colour plus the live ▶ fill.
  - Ink: a red rope on its edge plus the red ▶ fill.

  Its tab gets the same live fill. Nothing else on the page is a solid accent.
- `?cardart` is gone: decided, i8's art top-left.

## 7 · Play / Shuffle and the queue

The owner: "the shuffle button just being where it is feels so random and out of place, when u search like shadows the queue should play the found items not everything unless it matched the collection itself".

- **Placement.** A results line sits between the tools and the list, in Meta. Its left side reads "26 releases · 58 tracks", or with a search "3 releases · 5 tracks for “shadow”". Its right side has **▶ Play** and **⤮ Shuffle** (Label buttons, outlined). The count moves out of the page title's line. `?shuffle=results` is the default; `?shuffle=player` is the alternative, where Shuffle is a mode in the player bar and the results line keeps only the count and ▶ Play.
- **What plays: exactly what's shown.**
  - A single that's shown plays.
  - A collection whose *own* name, description or facts match plays all its songs.
  - A collection that's shown only because some of its songs match plays **only those songs**: the tabs the card keeps.
  - Shuffle shuffles that set.
  - ▶ on any card starts there and continues through the same set, and next / previous stay inside it.
  - With no search and no filter, everything plays, as today.

## 8 · What to compare (⚙, Open)

| Option | Values (default first) | What it compares |
|---|---|---|
| `look` | **section** · ink · i8 | the colour roles (§4) with the new type, grid and cards; `i8` is the site exactly as it was, for A/B |
| `stitch` | **calm** · full | controls flat at rest vs stitched everywhere (i8) |
| `font` | **nunito** · allo · allo-round | Allo with tuned spacing (§5) |
| ~~`cardart`~~ | ~~right · left~~ | decided in round 2: i8's art top-left; the option went (§6) |
| `shuffle` | **results** · player | where Play / Shuffle live (§7) |

`kit/looks.html` shows the same screen in each `look`, side by side, in one window. It's built like `kit/mnav.html`.
