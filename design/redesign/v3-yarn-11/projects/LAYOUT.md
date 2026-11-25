# Projects layouts (iteration 4) · and what Music reuses

> **i5:** the opened item (stage, item page) was reworked: its grammar, the three `?dlayout=` arrangements, the top-bar previous / next and the stage alignment are in [`../LAYOUT-i5.md`](../LAYOUT-i5.md). Where this file says "detail shell … links … pager", read that file instead; the list, timeline and grid notes below still hold.

Projects is the reference for list pages. Music copies these layouts (owner, Music 2). Everything below is either a kit part (`kit/yarn.js` + `kit/yarn.css`) or a few lines of page CSS.

## The pieces

| Piece | Kit | What it is |
|---|---|---|
| Year groups | `Yarn.yearGroupsHTML(groups, render, { key, unit, grid, rule })` | `.ygroups > section.ygroup[data-year] > h2.yyear.yyear--rule[data-key="y-<year>"] + ol.ygroup__list(--grid) > li.ygroup__item[data-key]`. The ruled pill is the year separator everywhere (same as Thoughts' month marks): it sits on the list's left edge, its dashed rule runs to the right edge, it sticks while its year is on screen, and the rule steps away while it's stuck. |
| Timeline | `Yarn.timelineHTML(groups, render, { key, unit, rule: true, pillKeys: true })` + `Yarn.timeline(el, { ball, trail })` | Same groups with a thread, knots and the yarn ball on the selected item. `rule` = ruled pills; `pillKeys` = the pills glide in `Yarn.flip`. |
| Filtering | `Yarn.filterGroups(root, (key, el) => bool, { unit })` inside `Yarn.flip(root, "[data-key]", …)` | Hides items and empty years, rewrites the pill counts and returns the shown count. Works for `.ygroup*` and `.ytl*`. Items and pills glide from where they are on screen, so spamming filters reverses mid-flight instead of jumping to the end layout. |
| Open in place | `Yarn.openInPlace(root, { cell, closed(key), opened(key), settle(cell), top(), onOpen, onClose })` | Grid/list items open where they sit (see below). |
| Opened item | `.ypanel` | The detail shell on the white card material (`--patch-bg`, white felt) instead of the sheet. The sticky detail bar inside wears the same material (`--ydetail-bg`). Used for the inline-opened card and the timeline's stage. |
| Detail shell | `Yarn.detail({ …, links })`, `Yarn.detailPage(html)`, `Yarn.pager()` | The same shell inline (`.ypanel`) and as a page. On a page, the sticky bar wears the sheet (`--sheet-bg`). No links section when `links` is empty. |
| In-item match | `.is-match` (kit) | A stack/type/status that matches the active filter or search is marked inside the item with i2's plain chip (`--y-fg` on `--y-chip`). Projects wraps status/type badges in `.pj-mk` so the badge itself (ribbon, patch) doesn't change, and shows list stacks plain so a matching one stands out. Matching stacks come first in a capped stack row. |

## Layouts

**Desktop · Timeline (`?view=list`, default):** `.pj-list` = two columns. Left: `timelineHTML(…, { rule: true, pillKeys: true })` with `.yrow.ylift.ysel` rows. The timeline keeps its selected state (rope + ball). Right: a sticky `.pj-stage.ypanel` (its own scroll, `max-height` set by CSS only) holding `PJ.detailHTML`. Click (or `?hover=intent`) selects; ↑/↓/j/k/Home/End move.

**Desktop · Grid (`?view=grid`):** `yearGroupsHTML(…, { grid: true })` with `.ycard.ylift` cards. The cards have no `.ysel` and no rope: an item is open or it isn't. `?open=` picks what a card does:

- `inline` (default): `Yarn.openInPlace(body, { cell: ".ygroup__item", … })`. The cell swaps its card for `.ypanel` + the detail shell and spans the row (`.ygroup__item.is-open`). Neighbours glide (`flip`). The panel grows out of the card's on-screen rect: clip-path inset and translate run on one spring, so the visible shape morphs from the card's rectangle to the panel's. Closing shrinks a ghost of the panel into the card's new slot while the card fades in. Open, close, switch and filter all start from the shape that's on screen, so a second click reverses mid-flight. The page scrolls once, instantly, inside the flip (flip measures before and after, so nothing on screen jumps): the panel's top lands under its year pill. While the panel's sticky bar is stuck, it stands in for the year pill, so they never overlap. Esc and × close; the ↗ action opens the page.
- `page`: the card's title is a link to `item.html?p=<slug>` (the whole card is the hit area). Back returns to the grid with the card focused (`?focus=`).

**Phones (< 960px):** one layout, `yearGroupsHTML(…)` (a list, not a grid) of `a.yrow.ylift` rows with thumb, name, compact meta, matched stacks and a ›. A tap opens the project's own page. There's no inline open and no selected state. 640–959px shows two columns of rows. Search/filters use the kit's `Yarn.listTools` (FAB by default, chrome agent).

**Item page (`item.html?p=`):** `Yarn.detailPage(PJ.detailHTML(p, { back, actions, level: 1, end: Yarn.pager(…) }))` on the sheet (normal page background).

**Tools line (desktop):** search and the filter row share one line (`.pj-top.ytools` flex). Below 1280px, things give way in this order: the search hint ("try python"), then the chip icons and Browse's word, then the search narrows to 220px. Past that, the chip strip scrolls; it never wraps.

## i5 · list, timeline and grid cards (projects agent)

- **Grid opens items on their own page** (`?open=page`, default; `inline` stays in Earlier options). The list keeps its filters and search in the URL (the item page's Back carries them, `q` included), and the scroll position rides in `sessionStorage` (`pj:list-scroll`), so Back (the link or the browser's) lands where you left.
- **Ongoing ribbon** (`?ongoing=ribbon|badge`): `PJ.ribbonHTML(p)` inside the row/card (kit `.yribbon`); list metas drop the ongoing badge (`PJ.metaHTML(p, { ribbon: true })`). Rows/cards with one get `.has-ribbon` so the title keeps clear of it.
- **Type colours** (`?ptype`) and **icon-only type** (`?ptypelabel=icon`, list items only; phones are icon-only anyway). A matched icon-only type opens into "dot + name" on the chip.
- **Timeline:** passed knots are open red rings (`?passed`, kit `timeline({ passed })`); one line of stack chips per card (`?tlstack`), matches first, the rest folded into the kit's "+n" by `fitStacks()` (widths read once per stack order; refits on filter, resize and fonts).
- **Match marks (P1):** `.pj-mk` is `display: contents`; the badge itself takes the chip look.

## i6 · list, timeline and grid cards (projects agent)

- **Card meta (O1):** `PJ.metaHTML` → `Yarn.cardMeta` (`?cardmeta=facts|badges`, kit, Open): type · status · date; facts by default (ongoing = the icon-only red disc, status + date wrap as one `.ymeta__pair`). `paintItem` toggles `.is-match` on `.ymeta [data-mk]`. `?ongoing=badge` is decided; the ribbon is Earlier.
- **Stack tags (P2):** timeline + grid cards use `Yarn.stackTags` (Thoughts' hashtags, `[data-yf]` buttons). The timeline row is a `div.yrow` whose name is `button.pj-row__open` (no buttons inside a button); a click anywhere else on the row still selects it, `[data-yf]` clicks are left to the kit. The project's own stack order is kept; active or matching stacks move forward only when they'd fold into "+n". `keepFocus` puts keyboard focus back on the same tag after a re-render.
- **Empty state (P3):** one message; in the timeline `.pj-list.is-empty` hides the stage (Music does the same).
- **Grid years (P4):** `applyVisibility` calls `Yarn.gridYears` after `filterGroups` (grid only); a 4-digit year in the search keeps the dividers.

## i7 · list, timeline and grid cards (projects agent)

- **P1 · timeline tags are display-only:** `tlStackHTML` → `Yarn.stackTags(…, { as: "span" })`; `fitStacks` measures the same spans and writes buttons only for grid cards (`cardStackHTML`). A click on a timeline tag is a click on its row. Grid cards and the opened item (stage, item page) keep their tag buttons / links.
- **P2 · `?statusdate=apart|joined`** (Open, pj-core `OPT.statusdate`): cards → `Yarn.cardMeta({ statusdate })`, the opened item → `Yarn.fact.statusDate(p, { dur: true })`. Carried to the item page and back.
- **P3 · `?cardfacts=words|icons`** (Open, pj-core `OPT.cardfacts`): cards → `Yarn.cardMeta({ icons })`. The opened item always shows words.
- **One line of facts in every list:** `applyVisibility` calls `Yarn.fitFacts` on the timeline, the grid and the phone list (after the match marks, which open a fact's word). The phone list passes `max: 2`: it never hides the type word (Decided: small cards keep it) and wraps a long row instead (at 390 only Beepbox Bot's cross-year range, before its short form fits; at 360 most rows).
- **Write-up mark:** cut in i11 (T8: a badge; the stage's write-up link says it once the row is open, and the row's button still says ", has a write-up" to screen readers). It sat in the top-right corner on the title's line.

## What Music should reuse

1. List/timeline: `timelineHTML(…, { rule: true, pillKeys: true })` + `timeline()`, with a `.ypanel` stage if Music keeps a stage. Or plain `yearGroupsHTML` if Music's list has no selection.
2. Grid: `yearGroupsHTML(…, { grid: true })` around the folder cards (keep `.yfolder`). Put `.ylift` on the card inside the cell, not on the `[data-key]` cell itself, because `.ylift`'s CSS `transition: transform` would smear `flip`'s per-frame transforms. That was the i3 Projects "looks completed" bug.
3. Open behaviour: `Yarn.openInPlace` with `closed`/`opened` renderers that return the card and `<section class="ypanel">${Yarn.detail(…)}</section>`. Copy `settleY` (under the year pill) and the `.ygroup:has(.ydetail__top.is-stuck) > .yyear` rule. Offer `?open=inline|page`.
4. Filtering: `F.on(() => { Yarn.flip(root, "[data-key]", () => Yarn.filterGroups(root, test, { unit })); if (io.current is filtered out) io.collapse(); })`.
5. Phones: `yearGroupsHTML` list of link rows to `item.html`, with no inline open.
6. Match marks: `.is-match` on the matching instrument/type/status badge (wrap ribbon-like badges as Projects does with `.pj-mk`).
