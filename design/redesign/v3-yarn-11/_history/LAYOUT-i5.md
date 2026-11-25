# The opened item · layout (iteration 5)

Covers P3.3.1–P3.3.5, G6.1, G6.2 and the open-item side of G5. Applies to the Projects timeline stage, the project page (`projects/item.html`), and Music's stage and release page (`music/item.html`).

## The grammar (copy this · Music's expanded player head uses the same rules)

An opened item has four kinds of things. Each kind has **one** look and **one** home.

1. **Facts** (status, type or instrument, date, length, "with …"): `Yarn.fact.*` → `.yfact`.
   - Every fact is `disc + label`: an 18px round disc holding an 11px glyph, then the label.
   - One face for every label: `750 .8rem/1 var(--font-display)`, colour `--y-fg-2`. No mono, no caps, no pill, no outline. The date is written in the same face (tabular numbers); a second part ("· 1 yr 3 mo") is the same face in `--y-fg-3` (`.yfact__s`).
   - Colour lives in the disc only (`--fact-c`, glyph `--fact-on`): red = ongoing, ink = complete, the type colour (`--pt-*`) or instrument colour (`--inst-*`) when the page has one, a quiet grey disc for the date and plain text facts. The label never changes colour.
   - Order: status → type / instrument → date → anything else. One line (`.ydetail__facts`, gap 4px 16px); it wraps only when it must.
   - A fact that matches the active filter or search takes the in-card match look (`.is-match`), nothing else.
2. **Chips** (things you can press to filter: the stack): `Yarn.stackChips()` → the kit chip, small (`.ychip.ychip--sm.ystkc`, 30px).
   - Same icon size (16px) and the same face as a fact, so the two lines read as one family. The patch around it says "pressable".
   - Selected = the red fill (`aria-pressed="true"`). Hover or focus on a selected chip draws the strike-through. Hover on any chip lifts.
3. **Links** (leave for the thing itself: site, repo, write-up; in Music: play, queue, platforms): one row, `.ydetail__links`.
   - All `.btn.btn--d`, one height (40px; 44px on phones). The first is the primary (`.btn--red`). Every other link is a secondary (plain `.btn`: white knit, dashed stitch) with `icon + label` (`Yarn.dlink()`).
   - The write-up is a secondary in this row, not a separate button on the right.
   - Past three links, platform links (`.btn--brand`) drop their label and keep the height and material.
4. **Utilities** (open as page, copy link, close, previous / next): only in the top bar, top right, round `.ylinkicon`.
   - In a panel (stage, opened card) the bar lies over the head's first row (`.ydetail--over`), so the title starts at the panel's top-left corner and never moves for the buttons. On a page the bar is the Back row.
   - Previous / next exists once, here (`?dnav=`). No pager at the bottom.

Shared edges: title, fact discs, chips, buttons, media and text all start on the column's left edge. Nothing is right-aligned except the utilities.

Not in the grammar any more: the "In thoughts" hashtags, the mono date, the ribbon-shaped status badge inside the meta line, the round icon-only GitHub button next to a labelled button.

To use it: pass `facts` (and `stack`, `links`, `nav`) to `Yarn.detail()` instead of `meta`. The kit renders one DOM order (title → facts → stack → links → media → text) and `?dlayout=` arranges it with CSS only.

## What was wrong (owner, P3.3.1) and what answers it

| Owner's note | Now |
|---|---|
| Action buttons top right, with space before the title | The bar lies over the title's row in a panel. The title sits at the panel's top-left, on the buttons' centre line. |
| Complete and Personal in different icons and fonts | Both are facts: the same disc, the same face. |
| The month in another font | The date is a fact in the same face. |
| Stack tags in yet another icon and text format | Chips with the facts' icon size and face. They look pressable because they are. |
| Big and little action links | One row, one height: a primary and labelled secondaries. |
| "Read the write-up" on the right | A secondary in the same row. |
| "In thoughts" hashtags | Removed. See below. |

**"In thoughts" hashtags: removed.** They were mock-only tags on five projects, and they were a fifth style in the item. The write-up link is the real bridge to Thoughts, and Thoughts now lists write-ups as articles "about" a project (T1). Search still matches on those tag words.

## Layouts (`?dlayout=`, Open)

All three use the grammar above and the same DOM. They differ in where the facts, the stack and the links sit.

| Value | What it is | Good at | Costs |
|---|---|---|---|
| `stack` **(default, recommended)** | One column, top-down: title → facts → stack → links → media → text. | The same at every width (stage at 1440 and 1024, page, phone). Links stay beside the title. | Four short rows before the content. |
| `rail` | Title on top; media and text on the left; facts, stack and links in a side rail on the right, one icon column, stack as rows, links as full-width buttons. On an item page the rail takes the page's rail column (the same x as a Thoughts article's rail). | Content starts right under the title. The facts read like a spec sheet. | Needs 640px. Narrower (the stage at 1024, phones) it folds to `stack`. The text column in the stage drops to about 470px. |
| `label` | The facts are a one-line label over the title (in a panel they share the buttons' row). Links under the title. The stack closes the item after the text. | The calmest head: label, title, links. | The stack chips can be below the fold on a long item, so filtering from the open item takes a scroll. |
| `i4` | The layout before this pass, kept for comparison (Earlier in spirit; listed so it is one click away). | | |

**Recommendation: `stack`.** It answers every point in the note with the least risk: one edge, one reading order, no dependence on the container's width, and the links are next to the title on every screen. `rail` is the strongest look on a wide screen and is worth a look on the item page. `label` is the best fit when an item has no stack (Music).

## Measured edges

Left edge of title, first fact disc, first chip, first link, media label, first thumb and text (`stack`, `label`): one x in each case.

| Where | Left edge | Right edge of utilities |
|---|---|---|
| Stage, 1440 | 642.7 (panel 613 + 30 pad) | 1356 (= column) |
| Stage, 1024 | 468.8 (panel 439 + 30 pad) | 940 (= column) |
| Item page, 1440 | 340 (the detail column, same as every detail page) | 1100 (= column) |
| Item page, 1024 | 95 | 709 |
| Item page, 390 | 21 | 369 |

`rail`: the disc column and the chip icons share one centre line (1157 in the stage at 1440). On the item page the rail starts at 1156, the page grid's third column, on the title's top line.

In a panel the title's row is 40px tall and starts 16px from the top, so its centre (266) is the buttons' centre (266).

## The other items

- **P3.3.2** `.ypanel` has the dashed stitch (`outline`, 6px in, same as `.ycard`). While the bar has its material it carries the same stitch round its top, so the line is never cut.
- **P3.3.3** Stack chips are `button.ychip.ysel.ytog[data-yf="stack:<name>"]`. Pressed = red fill; hover or focus = the strike. On the item page a chip is a link to the list filtered by that stack.
- **P3.3.4 / G7** `.ydetail .ycar__strip` carries the lift shadow's reach as padding and gives it back as margin, so the scroller no longer cuts the shadow. Checked by hovering every lift-able thing in the open item (media, chips, buttons, utilities, track rows) against every clipping ancestor: 0 clipped. The same check on i4 reports the media strip (6px top, 15.5px bottom, 14px left).
- **P3.3.5** `?stagealign=top|center` (default `top`). `center` puts a short item in the middle of the window; a tall one still starts at the top. The panel's top then depends on its height, so `Yarn.stageSwap` glides it from where it is on screen (largest step measured while spamming six picks: 5.5px per frame).
- **G6.1** `?dnav=count|labels|arrows` (default `count`). `count` = ‹ 3 / 14 ›; `labels` = ‹ Previous · Next › (arrows only under 560px); `arrows` = an arrow pair with the neighbour's title and date on hover or focus. A missing side stays in place, disabled. Links keep `rel="prev|next"` and names like "Next project: Sonata". ←/→ and k/j follow them. The bottom pager is gone from Projects and Music item pages. `Yarn.pager` stays in the kit for Thoughts.
- **G6.2** The grid opens `item.html`, which uses the same shell and the same `?dlayout=`.
- **G5** The projects agent's ribbon (`.yribbon`) appears on an opened panel as an icon-only tab in the panel's right gutter, under the utilities (`.yribbon--tab`). It never lies on the title, the buttons or the text, and it doesn't scroll. The facts line says "Ongoing". An item page has no panel edge, so it has the fact only. `?ongoing=badge` removes the tab.
- **Music** `music.js` passes facts (status · instrument · date · length · "with …") and one link row (Play · Add to queue · platforms). The stage uses `Yarn.stageSwap`. The release page has the top-bar previous / next and no pager.
