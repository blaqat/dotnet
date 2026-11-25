# Contrast review · i5 round 2

**Summary:** the site is in good shape. axe found **no hard failures** on any page. Five things were a little too faint: the grey meta colour on folder tabs and tinted surfaces, the counts on filled (pressed) chips, and the small "ONGOING" ribbon text. All five are fixed with token-level colour changes, and the look is the same (compare the `_shots/i5r2-contrast-*-before/after.png` pairs). What's left is the **red twill buttons** ("Visit site", "Add your ranking", "Play all", "New", "Copy everything"). They pass on the plain red but dip a little on the twill's light threads. I'd fix them next with a one-word change (below).

Standard: WCAG 2.2 AA. Normal text needs 4.5:1. Large text (≥ 24px, or ≥ 18.66px bold) needs 3:1, and so do icons and control edges. Tables mark ◐ for 3–4.5:1 and ✗ for under 3:1.

## What was checked

- 16 URLs × 2 widths (1440, and 390 @2× touch), 32 loads. The URLs: home, projects (list, grid, opened item, item page, all three types pressed), music (list, panel + demo, item, all three instruments pressed), thoughts (stitched, article a1, collection tools), ranking tl1, studio, and `review.html`.
- axe-core 4.10.2 `color-contrast`: **0 violations**. It flagged 3,718 nodes as "can't tell", nearly all because of the knit/felt/twill textures. I measured every one of those from rendered pixels: hide the node's text, crop its text box, then compare the text colour with the lightest and darkest background pixels (the 3rd/97th percentile, so one stray stitch doesn't count) and with the most common one.
- 161 extra state checks: chip hover, chip pressed, Projects type colours, Music instrument colours, tags hover/pressed, the "All" circle, the ongoing ribbon, dates, mono meta, the placeholder, the player bar + panel, a live toast, ranking tier keys, studio badges, and disabled pager arrows.
- No text sits on the coloured page frame. The nav and all labels are on the sheet.

## Token table

Text tokens on the light surfaces:

| text colour | white | cotton (sheet) | cotton-2 / y-chip / tab | red-soft | blue-soft | gold-soft |
|---|--:|--:|--:|--:|--:|--:|
| `--ink` #1f1e1e | 16.6 | 15.7 | 14.4 | 12.6 | 13.3 | 14.1 |
| `--ink-2` / `--y-fg-2` #4a4646 | 9.3 | 8.8 | 8.1 | 7.0 | 7.4 | 7.9 |
| `--ink-3` / `--y-fg-3` **was** #6e6868 | 5.5 | 5.2 | 4.7 | 4.1 ◐ | 4.4 ◐ | 4.6 |
| `--ink-3` / `--y-fg-3` **now** #625c5c | 6.6 | 6.2 | 5.7 | 4.9 | 5.2 | 5.6 |
| `--red` #d62f38 (only dots, brand mark, icons) | 4.9 | 4.6 | 4.2 ◐ | 3.7 ◐ | 3.9 ◐ | 4.1 ◐ |
| `--red-deep` #b4202b (red text, links) | 6.6 | 6.2 | 5.7 | 5.0 | 5.3 | 5.6 |
| `--blue-deep` #24518f | 7.9 | 7.5 | 6.9 | 6.0 | 6.3 | 6.7 |
| `--purple-deep` #5f2f93 | 9.1 | 8.6 | 7.9 | 6.8 | 7.3 | 7.7 |
| `--gold-deep` #8a5f0c | 5.6 | 5.3 | 4.9 | 4.3 ◐ | 4.5 | 4.8 |
| `--orange-deep` #a4520c | 5.5 | 5.2 | 4.8 | 4.2 ◐ | 4.4 ◐ | 4.7 |
| `--pt-personal-deep` #16679c | 6.1 | 5.7 | 5.3 | 4.6 | 4.9 | 5.2 |
| `--pt-work-deep` #7a5b00 | 6.3 | 6.0 | 5.5 | 4.8 | 5.1 | 5.4 |
| `--pt-school-deep` #9a4a0a | 6.3 | 5.9 | 5.4 | 4.7 | 5.0 | 5.3 |
| `--inst-beepbox` #7444b6 | 6.5 | 6.1 | 5.6 | 4.9 | 5.2 | 5.5 |
| `--inst-daw` #2f62b3 | 6.0 | 5.6 | 5.2 | 4.5 | 4.8 | 5.1 |
| `--blue` (frame) #3a74cf | 4.6 | 4.3 ◐ | 4.0 ◐ | 3.5 ◐ | 3.7 ◐ | 3.9 ◐ |
| `--purple` (frame) #8a4fc6 | 5.2 | 4.9 | 4.5 | 3.9 ◐ | 4.2 ◐ | 4.4 ◐ |
| `--gold` (frame) #d9a21b | 2.3 ✗ | 2.2 ✗ | 2.0 ✗ | 1.7 ✗ | 1.8 ✗ | 2.0 ✗ |

Text on the fills:

| on fill | #fff | #fff @.92 (fg-2; fg-3 now) | #fff @.80 (fg-3 was) | #fff @.74 (on-ink fg-3) | `--ink` | ink @.78 (fg-3 was) | `--red-hi` |
|---|--:|--:|--:|--:|--:|--:|--:|
| `--tog-red` #bb2d36 (pressed toggle) | 5.9 | 5.2 | 4.3 ◐ | 3.9 ◐ | 2.8 ✗ | 2.4 ✗ | 2.4 ✗ |
| `--red` #d62f38 (buttons, ribbon was) | 4.9 | 4.3 ◐ | 3.6 ◐ | 3.3 ◐ | 3.4 ◐ | 2.8 ✗ | 1.9 ✗ |
| `--ink` (toast, tooltips, on-ink) | 16.6 | 14.2 | 11.0 | 9.6 | — | — | 6.6 |
| BeepBox fill #7444b6 | 6.5 | 5.8 | 4.8 | 4.3 ◐ | 2.6 ✗ | 2.2 ✗ | 2.6 ✗ |
| DAW fill #2f62b3 | 6.0 | 5.3 | 4.5 ◐ | 4.1 ◐ | 2.8 ✗ | 2.3 ✗ | 2.4 ✗ |
| Piano fill #2b2828 | 14.6 | 12.6 | 9.9 | 8.7 | — | — | 5.8 |
| Personal fill #3a9ad8 | 3.1 ◐ | 2.9 ✗ | 2.5 ✗ | 2.4 ✗ | 5.4 | 3.9 ◐ | 1.2 ✗ |
| Work fill #f2c230 | 1.7 ✗ | 1.6 ✗ | 1.5 ✗ | 1.5 ✗ | 9.9 | 5.9 | 1.5 ✗ |
| School fill #ef8432 | 2.6 ✗ | 2.4 ✗ | 2.2 ✗ | 2.1 ✗ | 6.3 | 4.4 ◐ | 1.0 ✗ |

The ✗ cells are combinations the site doesn't use. The type fills already carry ink, and the instrument fills carry white. They're listed so no one swaps them later.

## Fixed (all in `kit/yarn.css`, colour values only)

Ratios below are measured on the page as average → on the worst texture pixels.

| what you'll notice | where | before → after |
|---|---|---|
| Grey meta text (dates, counts, folder-tab names and numbers, placeholders, studio hints) is one step darker. It matters most on the folder tabs and tinted cards. | `kit/yarn.css:42` `--ink-3` #6e6868 → **#625c5c** | Folder-tab number 4.67 → 4.32 **⇒** 5.61 → 5.18 · sheet meta 5.33 → **6.36** · red-soft tint 4.1 → **4.9** (token) |
| Counts on a pressed red chip (Thoughts "All 22") are no longer faded. | `:337` pressed-toggle `--y-fg-3` white .80 → **.92** | 4.29 → 3.78 **⇒** 5.22 → 4.50 |
| Counts on a pressed DAW/BeepBox chip | `:767` `--y-fg-3` white .80 → **.92** | DAW 4.47 **⇒** 5.33 (token) |
| Counts and other faint text on a pressed Personal/Work/School chip (the filter row shows none today; this covers any that appear later) | `:797` `--y-fg-3` ink @.78 → **ink** | Personal 3.86 **⇒** 5.38 (token) |
| The "ONGOING" ribbon (10px bold caps) uses the toggle red, one shade deeper. | `:820` ribbon base `--red` → **`--tog-red`** | 4.97 → 4.27 **⇒** 5.92 → 5.03 |

Shots: `_shots/i5r2-contrast-{folder-tabs, thoughts-filter-pressed, ribbon, projects-type-pressed, music-inst-pressed, projects-filter-rest}-{before,after}.png`.

## Left as is, with a suggestion

1. **Red twill buttons**: `.btn--red` (`kit/yarn.css:382`). This covers "Visit site", "Add your ranking", "Play all", Studio's "New" and the round-up's "Copy everything". White on plain `--red` is 4.86, so they pass on average (4.97). On the twill's light threads they drop to 4.27. These are 14–15px bold labels, so that's a fail on strict worst-pixel terms but not a clear one. *Suggestion:* use `var(--tog-red)` in `.btn--red`, as I did for the ribbon (worst pixel 5.0). The buttons come out one shade deeper, matching the pressed chips. I left it because it's a visible brand change on every page, so it's the owner's call.
2. **Ranking tier key "A"** (`thoughts/tier.css:161`, ink on the orange felt dot, 11px/900): 4.77 on average, 4.27–4.5 on the felt's darkest flecks. *Suggestion:* lighten the A colour's mix a little (62% → 55%) or drop the felt layer on the key chips.
3. **`--red` as text**: 4.2 on cotton-2. It's only used for decorative marks: the brand dot, `.yhead__dot`, the quote mark, and Studio's large icons, which pass 3:1. Keep `--red-deep` for any real red words.
4. **`--gold` frame colour**: 2.3 on white, so it must never carry text or a meaningful icon. Use `--gold-deep` (5.6) for gold text. No page uses `--gold` as text today.
5. **Disabled states** (`.btn:disabled` at opacity .5, the pager's `.ydnav__a.is-off` at .36, the lightbox's disabled arrow at .3) are exempt from WCAG contrast, so I didn't change them.
6. **Decorative, not changed**: the code-block comment colour (6.3, passes), the stitch outlines, the rope, the `.ymeta__sep` dots, and the Browse sheet's "·" separator.

## Passes only on some texture pixels (fine on average, close to the line on the worst threads)

- Pressed **Personal** chip label (ink on sky-blue twill): 5.53 avg, 4.70 worst.
- Pressed **DAW** chip label: 5.85 avg, 4.81 worst. Pressed **BeepBox**: 6.50 / 5.19.
- Pressed red toggle counts after the fix: 5.22 avg, exactly **4.50** on the light threads.
- Home section dots (white glyph icons on blue/purple felt): 5.35 / 6.45 avg, 3.5 worst. That's fine for icons (3:1).
- Toast icon (`--red-hi` on ink twill): 6.78 / 4.87 (icon).
- The player panel's "from …" line (`--ink-2`): 9.07 avg, 4.85 on the artwork-blurred edge.

## Measurement notes

- About 40 groups still show low "worst" numbers in the raw sweep (`/Users/blaqat/dev/temp/r3i5-contrast/fails-after.txt`). Every one of them was a crop artifact. Some picked up a neighbour's text: overlapping folder tabs, review-page list rows, wrapped lines. Some picked up an icon drawn in a `::before`. Some text was covered by the open player panel. The most common background colour behind each of those passes comfortably (6.4–16:1).
- During the "before" run, `music/index.html?instrument=…` threw `PE face is not defined`. That's the music agent's in-progress `?songnotes` work, and it was gone in the "after" run. Every other page loaded with 0 page or console errors, before and after.
- Scripts: `/Users/blaqat/dev/temp/r3i5-contrast/` (`sweep.mjs` for axe + pixels, `states.mjs` for hover/pressed/toast/player, `tokens.mjs` / `tokentable.mjs` for the tables, `shots.mjs`).
