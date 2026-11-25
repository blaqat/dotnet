# The opened item · layout (iteration 6)

Replaces `LAYOUT-i5.md` (kept for comparison). Covers L1–L7 from `FEEDBACK-i6.md`. Applies to the Projects timeline stage, an opened grid card, the project page (`projects/item.html`), and Music's stage and release page (`music/item.html`). The grammar from i5 stands; what changed is below it.

## The grammar (unchanged · copy this)

An opened item has four kinds of things. Each has **one** look and **one** home.

1. **Facts** (status, type or instrument, date, length, "with …"): `Yarn.fact.*` → `.yfact`, an 18px disc + a label, one face (`750 .8rem var(--font-display)`). Colour lives in the disc only. Order: status → type / instrument → date → the rest. **`Yarn.fact`'s API did not change in i6**; the cards now use the same facts (projects agent, O1).
2. **Stack** (press to filter): `Yarn.stackChips()`. **New (L5):** `?stackchip=tag` (default) writes it as Thoughts-style tags, see below.
3. **Links** (site, repo, write-up; Music: play, queue, platforms): one row of `.btn.btn--d` (`Yarn.dlink()`), the first is the primary (red).
4. **Utilities** (open as page, copy link, close, previous / next): only in the top bar, top right, round `.ylinkicon`.

One DOM order (title → facts → stack → links → media → text); `?dlayout=` arranges it with CSS only, so every layout reads the same to a screen reader.

## L1 · `?dlayout=` (Open)

| Value | What it is | Where things go | Folds |
|---|---|---|---|
| **`label` (default)** | Facts as a label over the title; the item closes with one row | Facts on the utilities' line (panel) or above the title (page) → title → media → text → a dashed rule → **"Built with" + the stack on the left, the links bottom right** | Narrower than 580px: the stack, then the links under it (still right); under 420px the buttons fill the row |
| **`side`** (new) | A left rail like a Thoughts article's (`thoughts/stitched.html?view=article&id=a1`), in yarn parts | Rail: facts (one per line, discs in a column) → **BUILT WITH** (the tags, wrapped) → **LINKS** / **LISTEN** (full-width buttons, labels centred). Title, media and text to its right. On an item page the rail takes the page's first column (x = the page gutter, the article rail's x) and sticks; the reading column stays at the x it has on every detail page | A panel narrower than 640px, a page under 960px: the stacked order |
| `rail` (fixed) | The right rail (i5), a compact spec sheet without section labels | Facts, stack rows and full-width buttons right of the text. **Item page: the top bar now spans column + rail**, so ‹ 3/14 › and copy sit right above the rail, on its right edge (1386 = 1386 at 1440), as in the stage | Same as `side` |
| `stack` | i5's default, one column (title → facts → stack → links → media → text) | | |
| ~~`i4`~~ | Cut (Decided table) | | |

**Fixes from the owner's notes**
- *"make sure there isnt like a massive gap between the last bit of text and the bottom section"*: `label` is now a grid that packs to the top. On the item page the closing row follows the text (Fishbowl, 1440: text ends 563, rule at 613); before, the body stretched to the page's min-height and pushed the stack to the bottom.
- *"put the action buttons on the bottom right"*: the closing row (stage 1440: stack 643–1147, links 1147–1356, one centre line).
- *Rail on the item page, "too far to the right … looks off cause of the other buttons in the top bar"*: decided **right**, under the utilities (above). The left version is `side`, so the owner can compare both sides.
- *"side rail looks awful when theres no content for the song"*: with no media and under ~160 characters of text (a song with no notes, or a one-line note like "nighttime thoughts"), there is nothing for a rail to sit beside, so `rail` and `side` **fold into `label`** (`.ydetail--folded`): label, art, title, line, buttons bottom right.
- *"for the play button in side rail either center the text for all buttons or add "Play/Pause" text"*: in both rails every button's label is centred, so Play's ⏸ (icon-only while playing, owner's earlier "no Pause text") sits in the middle like the other labels.
- *"labels for the section like built with, links"*: `side` names its sections (the article rail's eyebrow face); `label` names its stack. Music passes `linksLabel: "Listen"`.

**Measured (1440)**

| Where | Title / column left | Rail | Utilities right |
|---|---|---|---|
| Stage, `label` | 643 (panel 613 + 30) | n/a: closing row y 736 | 1356 |
| Stage, `side` | 857 | 643–827 (184px), first disc on the title's centre line | 1356 |
| Item page, `label` / `stack` | 340 | n/a | 1100 |
| Item page, `side` | 340 (unchanged) | 54–274, top = the title's top (162) | 1100 |
| Item page, `rail` | 340 | 1156–1386, top = 162 | **1386** (was 1100) |
| Item page, `side`, 1100 | 268 (the first column keeps its 170px minimum) | 54–224 | 1002 |

**Recommendation: `label`.** It is the only layout that looks the same with no content (a song), a long text (a project page), a narrow stage and a phone; it has no gap on the page; and it keeps the head calm (label, title). `side` is the best-looking one on a wide item page and worth comparing there; `rail` is now tidy but repeats `side` on the other side and is the least flexible.

## L2 · `?dnav=count` (decided)

‹ 3 / 14 › in the top bar, with the neighbour's title and date in a tip on hover and keyboard focus (`.ydnav__tip`, ink twill, under the button; never the slow native `title`; hidden on touch and under 560px). The mobile agent is standardising a kit hint popup (X3); `.ydnav__tip` can switch to it once that exists. `labels` and `arrows` → Earlier.

## L3 · Sticky bar

- **The title never hides without the compact title.** `wireDetail` measures the bar against the title on scroll (rAF) and resize: the compact title shows once the title's bottom edge is at or above the bar's bottom edge. i5 used IntersectionObserver root margins fixed at wiring time; an over bar (66px) covered the title before its 6px margin noticed, and the margin went stale when `--sticky-top` moved. Checked by scrolling the stage, the release stage, the item page, an opened grid card and a 390 page in 5px steps: 0 frames where the title is covered without the compact title.
- **No flash on switching items.** The stage's new content fades up from ±14px; that transform pushed i5's sentinel past the observer's edge, so the fresh bar briefly got its white material and shadow, then faded it out (measured: 250ms on, 200ms fade). The bar, title and sentinel are now compared with each other, so a transform on all of them changes nothing. Per-frame sampling of the switch on Projects and Music: no state change.

## L4 · Stage position (`?stagealign=center`, decided)

`top = max(48px, (100dvh − natural height) / 2)`. The natural height comes from the stage's content (a ResizeObserver on it), not from the clamped panel, and the player's space is not in the formula, so opening the player can't move it. The player only lowers the panel's `max-height` (it scrolls inside). Measured on Music, Revealed, scrolled: top 102 → 102 with the player opening (`--bottom-ui` 0 → 120); the panel's bottom 756 clears the player bar (780). A short item (Forth) sits at 276, centred. The minimum went from 18 to 48px (owner: "a tiny bit more padding from the top").

## L5 · `?stackchip=tag|chip` (Open, default `tag`)

`tag` = projects' `.ytag--stk` (`Yarn.stackTags`, P2): Thoughts' hashtag with the stack icon instead of "#". No felt, no outline: quiet text at rest; hover lifts onto the chip colour; pressed (an active filter) = the in-card match look (`--y-chip`) with the red strike on hover / focus, and a tap clears it; a typed-search hit = `.is-match` (same look). On the item page each tag is a link to the list filtered by it. `chip` = i5's felt chip. One class for cards and the opened item; `Yarn.stackChips` keeps its API and delegates.

## L6 · Ongoing

The facts line carries it: the red disc with the needle, like the cards' facts (O1). The gutter tab (`.yribbon--tab`) is gone from the stage and opened cards.

## L7 · Back: one placement (for every page that shows one thing)

**Rule.** Back is the **first item in the sticky top bar** (`Yarn.detail({ back: { href, label } })` → `a.ydetail__back`), on the **title's left edge**, directly above the title. The same bar holds the compact title (it slides in once the title is covered) and the utilities on the right (‹ n / N ›, copy). Never in a side rail, never at the bottom, never twice on a page.

- **Label** = the place it goes, as named in the nav: "Projects", "Music", "Thoughts". When you came from one specific thing, its name (a write-up opened from a project → the project's name). Thoughts' "All thoughts" becomes "Thoughts".
- **Style** = the kit's `.ydetail__back` (arrow + label, display face, the hover pill bleeding left so the arrow sits on the column edge). No other back style.
- **Where it lands** = what you clicked (T2: back to the post / card, focused), via the href.

| Page | Before | Now |
|---|---|---|
| Item pages (Projects, Music) | top bar, x 340 | unchanged |
| Ranking (`tier.html`) | top bar, x 340 | unchanged |
| Collection | top bar over its full-width title, x 55 | unchanged (its title is at 55) |
| **Article / write-up** | top of the left meta rail (x 55), no top bar | **thoughts agent:** render with `Yarn.detail({ back, actions: copy (+ ‹ › with ?apager=top), top: true })` and drop the `.r-back` link from the side rail. The kit already starts the side rail and the contents column on the title's line under the bar (`.ydpage--side` with a top bar: `margin-top: 70px`, sticky at `--sticky-top + 86px`, no 18px page padding), so the three columns still share one top line, just under the bar. "Share / Copy link" can stay in the rail or move to the bar's copy button (theirs to decide) |

Kit side (done): the item pages already follow it; `.ydpage--side` pages with a top bar line their side columns up with the title. Phones: one column, Back first in the bar.

## Changed in the kit (layout's parts)

`kit/yarn.js`: `OPT.dlayout` (`label|side|rail|stack`, default `label`), `OPT.dnav`/`stagealign` defaults, new `OPT.stackchip`; `stackChips({ look })` → `stackTags`; `dnavHTML` count tip; `detailOptions({ nav, stage, stack })`; `detail5` (`stackLabel`, `linksLabel`, `.no-body`, the rail fold); `detail()` (no i4); `wireDetail` (L3); `stageSwap` + its ResizeObserver (L4). `kit/yarn.css`: the i5 layout block (label grid, rail page top bar, stage centring, tab removed) and a new `/* == i6 · layout */` block (side, centred rail buttons, tags in the item, page columns by `:has()`, L7, the tip on touch).

Pages: `projects/pj-core.js` (no i4 branch, no tab), `projects/projects.js` (no tab), `projects/item.js` (no `wide`: the kit's CSS gives the rails their columns), `music/music.js` (`linksLabel: "Listen"`, `detailOptions({ stack: false })`, the i4 head is dead code now: `v5 = true`).

## Round-up questions

1. **Opened item layout** (`dlayout`): `label` · `side` · `rail` · `stack`. *Recommended: `label`* (see above). If the owner picks `side`, `rail` should be cut (it is the same idea on the other side).
2. **Stack in the opened item** (`stackchip`): tags · felt chips. *Recommended: tags* (the owner: "more like the hashtags on the thoughts page … dont want these to feel like buttons").
3. **Narrow rails**: `side`/`rail` fold to the stacked order under 640px (stage at 1024–1100, phones). Fold to `label` instead, so a narrow screen looks like the default? *Recommended: yes, if `label` is chosen.*
