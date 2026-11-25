# Iteration 2 "Yarn" · independent review (Fable)

Rendered every page at 390 / 768 / 1024 / 1440 in headless Chromium; tabbed through every surface; measured contrast against rendered pixels; traced scroll on open. Shots: `_shots/review2-*.png`. Scripts: `~/dev/temp/r3i2-review/`.

## Verdict
The cohesion goal is largely met: title, search, chips, badges, dates, cards and nav compute identically on every page, and all i1 P0/P1s are fixed (Contact link, player focus, modal mobile panel, 161 px stack). Zero console errors; no horizontal scroll except Studio @1024 (6 px). Contrast passes everywhere but one token. What remains: two kit bugs visible on many pages (focus ring lost; prose bullets on tags and tier tiles), mobile detail pages that give 27 % of the screen to bottom chrome, and three places where pages still diverge (mobile search/filter placement, detail-page skeleton, year separators).

## P0
1. **Keyboard focus is invisible on kit controls** (`review2-focus-sheet.png`, `projects/index.html?type=Personal`). (a) Any *selected* `.ysel` (current nav tab, pressed chip, active segment, picked tier tile): `kit/yarn.css:282` sets `outline-color: transparent` and out-ranks `:295`. (b) `.ynav__sound` (`:1002`), `.yfilter__browse` (`:552`), and `a.ycard` / `a.yrow` (`:455`, `:462`; Studio "New" sheet, reorder list): their dashed stitch outline beats `:focus-visible` (`:151`). Fix: append `:is(.ysel, .ynav__sound, .ychip, .ycard, .yrow):focus-visible { outline: 3px solid var(--focus); outline-offset: 3px; }` after `:295`, plus the same selector prefixed `html:not([data-rope="out"])` for selected items.
2. **Red prose bullets leak onto kit lists** inside `.ydetail__text` (`kit/yarn.css:918–923`): dots on tags (`projects/item.html`, `review2-bullets-on-tags-1440.png`), collection picks, and every tier row and tile (`thoughts/tier.html`, `review2-bottom-sheet.png`). Fix: scope lines 916–923 to `ul:not([class])`.

## P1
3. **Mobile detail pages: 226 px (27 %) of bottom chrome** on `thoughts/stitched.html?view=article&demo=1` and `thoughts/tier.html?demo=1` (`.ydetail__foot` 618–704 + `.ybar` 760–830), and the disc covers the foot's right-hand button (`review2-bottom-sheet.png`). Fix: below 960 px hide `.ybar` while the foot is stuck (give it an `.is-stuck` flag like `.ydetail__top`, `kit/yarn.css:878`; Back is in the top bar), and add the foot height to `--bottom-ui` (`kit/yarn.css:79`) so `.yp-disc` (`kit/player.js:615`) sits above it.
4. **Mobile search/filter placement differs per page**: Projects = FAB only; Music = top search + static row; Thoughts and Studio = top search + sticky row (`review2-{projects,music,thoughts}-390.png`). Pick one. Recommended: top search + sticky row (`search=bar`) everywhere.
5. **Detail pages share parts but not a skeleton** (`review2-{projitem,musicitem,article,collection,tier}-1440.png`): column 860 @x290 (project, music) / 720 @x360 (article) / 760 @x169 (collection) / full-width (tier); top actions `btn--icon btn--sm` 36 px (`projects/item.js`) vs `.ylinkicon` 44 px; foot 60 vs 52 px; `.ydetail__top` y=86 vs 92; body 16.32 px `#2a2828` (`kit/yarn.css:900`) vs 16 px ink. Fix: one `.ydetail` width token + optional rail, `.ylinkicon` for all top actions, one foot height.
6. **Touch targets under 44 px at 390** (hit-tested): `.ybar__sound` 36 wide; `.ysearch__input` 40; `.yfilter__browse` 40; `.btn--icon.btn--sm` 36 (project actions, Shuffle); `.ypost__link` titles 21–30; `.ypost__coll` 32; home `.kw` 22; `.yp-collapse`, `.yp-vol__btn`, `.ylb__vbtn` 40; `.yp-vol__track` 30; `.yp-qg` 30 wide; Studio `.st-grip` 34, toolbar 38. Fix: extend the `(pointer: coarse)` block at `kit/yarn.css:1439` and `.yp :is(button)` to `min-width/height: 44px`.
7. **Opening an item teleports the page**: no smooth-then-snap any more, but scroll jumps 329–591 px in one frame (`projects/index.html` @390, row 8; `?view=grid` @1440: 544 px). Fix in `projects/projects.js`: animate that scroll delta with the same spring as the row's expansion.
8. **Music on mobile opens a full-screen cover** that hides the nav (`music/index.html?item=revealed`, `review2-variants-music-390.png` "item open"), a modal by another name. Default mobile to `open=inplace`.
9. **Year separators come in four looks**: Projects pill on thread; Music left rail (desktop) and bare pills (mobile); Thoughts pill + dashed rule; collection 43 px vs 32 px. Projects mobile uses icon-only status badges while Music shows the label. Use one `.yyear` and one badge density per breakpoint.
10. **`.ydate__dur` is 3.79:1** at 12 px (`kit/yarn.css:646`, `opacity: .85`). Remove the opacity and use `--ink-2`.

## P2
- **1024 px Projects**: the stage is 270 px wide next to a 545 px list (`review2-projects-1024.png`). `projects/projects.css:37` → `minmax(340px, 2fr) minmax(0, 3fr)`.
- **768 px** is the phone layout stretched: rows with empty right halves, one 700 px feed column (`review2-sheet-768.png`). Add a two-column step at 640–959.
- **Skip link** only on Projects and Thoughts; move it into `<yarn-nav>`.
- **Thoughts search** at 390/768: the "/" hint sits mid-field (x=257 vs 337 on Music), input 186 px wide (`thoughts/stitched.css:214`). Hide `.ysearch__kbd` under `(pointer: coarse)`.
- **Music mobile header** is 4 px taller than the rest (`.yhead` with a `btn--sm` action, `kit/yarn.css:478`).
- **Scrub tooltip clipped** by the bar's top edge (`review2-misc-sheet.png`, `.yp-tip`, `kit/player.js:675`).
- **Disc sits over the right-aligned card play buttons** on mobile Music (`review2-variants-music-390.png`).
- `music/item.html` without `id` renders an unstyled blue link (`music/music.js:181`).
- Studio: "History" is announced twice (`studio/studio-editors.js:34`); 6 px horizontal scroll on the dashboard @1024.
- Thoughts desktop: "15 posts, newest first" repeats the header meta; the rail says "Everything" where other pages say "Show all".
- `End` on the Projects timeline scrolls the focused row off screen.
- Leftover i1 files: `thoughts/ethereal*`, `tierlist.html`, `tierlist-ethereal.css`.

**Verified good:** lightbox is modal, traps focus, announces "Image 2 of 4", Esc returns to the thumb; mobile player panel is `role=dialog` with `main` inert; seek and volume are sliders with arrow keys and `aria-valuetext`; tier tiles pick up, move and drop by keyboard with live announcements; Studio sheets trap Tab (0 leaks in 24); `?reduced=1` skips the intro, the transition and all loops.

## Feedback coverage
✅ done · ◐ partly · ✗ not done

| Bullet | | Evidence |
|---|---|---|
| A Maple Mono; body-font options; background options | ✅ | `review2-variants-kit-1440.png` |
| A Top bar and mobile nav "love" | ✅ | `review2-projects-1440.png` |
| A Hover = lift, selected = rope/ink; rope inside | ✅ | `?sel=ink`, `?rope=out` |
| A Tags hover + strike-through | ✅ | `kit/yarn.css:704`; `review2-focus-sheet.png` |
| A Stack icons; status/type badges | ✅ | `projects/index.html?p=sonata` |
| A Filter row like Thoughts | ◐ | same part, placement differs (P1 4) |
| A Red-dot titles; item-as-page option | ✅ | `?open=page`, `item.html` |
| A Metadata consistency | ◐ | P1 5, 9 |
| A Tags navigate; filter animation; lightbox everywhere | ✅ | `review2-thoughts-filter-mid-1440.png` |
| A Section transition hidden until uncovered | ✅ | `review2-variants-trans.png` |
| A Sounds; cat animation | ◐ | toggle + `research/`; cat is research only |
| B Intro schedule; ball squash; entrance cascade | ✅ | `review2-misc-sheet.png` |
| B Keywords, RIT orange, scribble | ✅ | `rgb(164,82,12)`; `review2-variants-home-390.png` |
| B Mobile layout; normal nav; icons on screen | ✅ | same |
| B Section-button rope in; icon shake | ◐ | shake not verified |
| C Header: search line, type and status chips | ◐ | "12 projects · since 2020" subtext remains |
| C Search turns into a stack token | ✅ | `review2-projects-search-token-1440.png` |
| C Grid max 2; timeline with years and ball | ✅ | `review2-variants-projects-1440.png` |
| C Scroll on open | ◐ | P1 7 |
| C Small media row; title → meta → media → text → links | ✅ | measured order |
| C Video unmute and scrub | ✅ | `review2-projects-lightbox-video-1440.png` |
| C Write-up as a link to the article | ✅ | `?p=forth-evaluator` |
| C Mobile: six filters fit, search, FAB, single column, sticky year pill, cards | ✅ | `review2-variants-projects-390.png` |
| D Yarn per instrument; folders; one list; play all | ✅ | `review2-music-1440.png` |
| D Opening without layout shift; subtler burst | ✅ | scroll delta 0; `?burst=` |
| D Disc FAB, bar, panel, swipes | ✅ | `review2-variants-music-390.png` |
| D Pin on hover + ghost; controls right of scrub; play centred (0,0) | ✅ | `review2-misc-sheet.png` |
| D YouTube-style volume; panel grows from bar | ✅ | same; `review2-variants-music-1440.png` |
| D Brand link icons | ◐ | SoundCloud/YouTube yes; BeepBox not checked |
| E Sticky scratch; mobile list; left rail | ✅ | `review2-variants-thoughts-*.png` |
| E Images open lightbox; pick opens collection at item | ✅ | `?view=collection&c=tools&item=p1` |
| E Tier: add your ranking, comments, own page | ✅ | `thoughts/tier.html#comments` |
| F Studio screens | ✅ | `review2-variants-studio-*.png` |

## Variants: keep / cut
- **Kit.** Keep `sel=rope`, `rope=in`, `bg=intarsia`, `nav=corduroy`, `disc=swatch`, `body=nunito-sans`. Cut `sel=ink` (black slabs fight the content), `rope=out` (collides with the focus ring), `jersey/quilt/speckle/current` (indistinguishable at page scale), `cork` (labels 3.2:1), `disc=cat` (hides what is playing), `figtree/system` (no visible gain); `atkinson` only as an accessibility setting.
- **Home.** Keep Schedule, `ball=toon`, `enter=cascade`, `contact=icons`, `secrope=hover`. Cut `contact=button` (no effect on mobile) and the alternate caption fonts (not distinguishable at caption size). Cursor stays only as the rare roll, desktop only. `notes` not compared.
- **Projects.** Keep Timeline + Grid toggle, `gimg=side`, `open=inline` (page as the share URL), `m=list`, `mf=wrap`, `search=bar`. Cut `m=cards` (one project per screen), `gimg=top` (brings back the oversized hero), `mf=scroll`, `fab-row`; `fab` only if all three pages adopt it.
- **Music.** Keep `dock` on desktop, `inplace` on mobile, `page` as the share URL, `burst=subtle`; disc → bar → panel are states of one player, keep all.
- **Thoughts.** Keep `scratch=sticky`, `mfeed=list`, `cview=timeline`. Cut `felt` (the black the owner flagged), `thread` (owner: no yarn balls on mobile), `cview=grid` (same cards without dates).
- **Studio.** Keep `layout=split` on desktop and single on mobile, `frame=section`, `confirm=smart`. Cut `frame=ink` (loses the section cue).
