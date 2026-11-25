# Iteration 11 · Thirteen type and spacing rules, everywhere

The owner asked for an iteration that applies 13 rules across the whole site and Studio. Their words are verbatim in `_feedback/rules-i11.md`. i10 (round 2) is the starting point and is frozen in `../v3-yarn-10/` as the "before". Everything i10 decided still holds unless a rule below changes it. i10's spec is in `_history/DESIGN-i10.md`, covering the colour roles, the state ladder, i8's card layout, the queue and the folder tabs.

This page turns each rule into numbers and a check. **The rules are the spec of record.** When a case isn't covered, decide by the rule's intent and write the decision down.

## The rules, made concrete

### T1 · A small, consistent type scale (rules 1, 2, 5, 6)
All sizes are whole pixels, so "1px smaller" is exact. A role's size depends on **where it sits**: on the page, or inside a card. Rule 5: card text is 1px smaller than the same role outside. Rule 6: button text is 1px smaller than the text next to it.

| Role | Page | In a card / row | Weight | Tracking | Line height |
|---|---|---|---|---|---|
| Display (page title) | 36 (phone 28) | n/a | 500 | −0.025em | 1.05 |
| Heading (section heading, an opened item's title) | 22 (phone 20) | n/a | 500 | −0.015em | 1.15 |
| Title (a card or row title) | 17, used only outside cards | **16** | 500 | −0.006em | 1.25 |
| Body | 15 | **14** | 400 | 0 | 1.5 |
| Meta (dates, counts, status) | 13 | **12** | 400 | 0 | 1.4 |
| Label (buttons, chips, segments, nav, tabs) | nearby text − 1 = **14** | **13** | 500 | 0 | 1 |
| Micro (folder tabs, anything that is smaller still) | 12 | 12 | 500 | +0.01em | 1.2 |

- **The scale is 12 · 13 · 14 · 15 · 16 · 17 · 22 · 36**, and nothing else. The 1px steps exist only because rules 5 and 6 require them. A page normally shows four or five of these sizes.
- **Card titles (16) are smaller than section headings (22)** on every page (rule 2). This covers the Music grid's year headings, Thoughts' month headings, Home's sections and Studio's pane headings.
- Implement this as tokens, with the card context re-declaring the size tokens on the card (`.ycard, .yfolder, .ypost, .yrow …`), so a role used inside a card shrinks by itself. Buttons read a `--fs-label` that the context sets to its body size − 1.
- **Phones** shrink Display and Heading only.

### T2 · Weights (rule 3)
- Body and Meta are 400. Headings, Titles, Labels and Micro are **500**.
- No other weights anywhere: no 600 / 700 / 800 / 850 / 900, and no `<b>` / `<strong>` heavier than 500 outside prose. In prose, bold is 600, the one exception: it is emphasis inside body text, not a heading.
- ⚙ Open: `?hw=500|400` is the heading weight (rule 3 allows either), with 500 as the default.

### T3 · Upright (rule 4)
- No `font-style: italic` on any heading, title, quote, label or status, including the prose blockquote, Home's line, empty states and the player's "no notes".
- Quotes are marked by the quote mark and the rule beside them, not by slanting.
- Markdown `*em*` in an article's prose may stay italic, because that is the author's emphasis and not styling. Studio's editor keeps its Italic button for the same reason.
- Drop Allo's italic `@font-face` blocks unless prose `em` needs them.

### T4 · Tracking grows tighter with size (rule 7)
Tracking runs monotonically: +0.01em at 12px, 0 at 13–15, −0.006em at 16–17, −0.015em at 22 and −0.025em at 36. No role may track looser than a smaller role. Allo gets its own row of values, still monotonic, with its word-space fix kept (`kit/allo.css`).

### T5 · Tight line height for large headings (rule 8)
Display is 1.05 and Heading is 1.15. Body keeps 1.5. Line height never grows with size.

### T6 · Breathing room between sections (rule 9)
A step on the 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 scale:
- **Between the page's sections:** 48 on desktop, 32 on phones. Sections are the header → tools → results line → the list, Home's blocks, an item page's blocks, an article's h2 sections and Studio's panes.
- **Inside a section:** 8 to 24.
- **Between cards:** 24 / 16, as i10 decided.
- The gap between sections is always larger than any gap inside a section, so the groups read as groups.

### T7 · Balanced headings (rule 10)
- Every heading and title role, and prose h2–h4, gets `text-wrap: balance`.
- Body and descriptions get `text-wrap: pretty`.
- Check: at every overflow width (18 of them), no wrapped heading or title ends with a single word on its last line, unless the last word is longer than half the line.

### T8 · Cut decorative labels, badges and redundant buttons (rule 11)
Audit every page and Studio:
- **Labels:** cut a label that names what the layout, an icon or its position already says. Examples to check are uppercase kickers ("ARTICLE", "PICK") and "Tracks" over a track list.
- **Badges:** cut a decorative badge or chip. Keep facts, written as Meta words. WIP is a status, so it stays as the Meta word with its gold glyph (i10).
- **Buttons:** cut a button that duplicates another control on the same screen, such as a second Play for the same set or a "more" next to a card that already opens.
- **Keep** the results line's Play / Shuffle and anything else the owner explicitly asked for. When a cut contradicts an earlier owner decision (see the Decided tables in `_history/FEEDBACK-i*.md`), keep it and add a question (`kind: "cut"`, `rec`) instead of cutting.
- Every cut goes in a table in your Done section (page · what · why · where it went), so the owner can restore any one.

### T9 · One sans for body, one family for headings (rule 12)
- **Headings:** Nunito, for Display, Heading and Title.
- **Everything else:** Nunito Sans, for Body, Meta, Label and Micro.
- **Numbers:** Nunito Sans with `font-variant-numeric: tabular-nums`. Maple Mono is gone from the UI and stays only for `<code>` and code blocks, since code is not body text.
- `?font=allo|allo-round` still works. Allo is then both families (one family for everything also satisfies the rule).
- Studio follows the same rule.

### T10 · Isometric insets and nested radii (rule 13)
- **Equal insets.** A surface holds its content the same distance from all four edges: top = right = bottom = left. This applies to cards, folder cards, post cards, track rows, the player bar and panel, popovers, sheets, Studio panes and fields. A ▶ or + in a card's corner sits exactly one inset from both edges. The folder tabs sit outside, so they don't count.
- **Nested radii.** A surface nested in another has `radius = outer radius − the inset between them`, with a minimum of 4. Examples are art in a card, the playing track's tint in a row, a field in a popover and a chip strip in a bar.
- Circles and pills (▶, discs, chips) are exempt from the radius formula, but not from the inset.
- Tokens: `--inset` (card 16 / phone 12) and `--r-card` = `--inset` + `--r-inner`. Pick `--r-inner` (8 is the suggestion) so that `--r-card` is a clean number. Sheets, popovers, the player and Studio get their own `--r-*` / `--inset-*` pairs from the same formula.
- The card's radius changes from 16, and the rope, focus ring, hover shadow and `.ysel` all follow `--r-card`.
- Check: for every nested pair on every page, the inner radius equals the outer radius minus the inset (±1px), and the four insets are equal (±1px).

## Measuring

The audit (`~/dev/temp/r3i11-audit/audit.mjs`, run as `node audit.mjs i11 [params]`, with `W=1000` for the owner's width) gains a **rules** report, written by the system agent first. It records:
- the sizes, weights and families used
- the italic count
- tracking against size (monotonic?)
- line height against size
- the card size against the outside size of the same role
- each button's text against its neighbour's
- headings whose last line is a lone word
- each card's four insets and its nested radii

Compare `i10` (round 2) with `i11`, and the old site too where it applies. Put the before / after numbers in your Done section.

## Compare

`kit/looks.html` frames i10 (the before, `../v3-yarn-10/`) next to i11 on the same screens. Use the owner's screen (Music grid, 1000px, "shadow" searched with glooming shadows playing), Projects, Thoughts and Home.

## ⚙ options
- Keep i10's Open options: look, stitch, font, shuffle and taccent, plus the four carried from i9.
- New: `hw` (500 · 400).
- Add no others unless a rule genuinely leaves a choice, and then ask first in your report.
