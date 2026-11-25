# Review · iteration 4 (Fable)

Scope: every page except `index.html` and `gallery.html`. Checked in headless Chromium at 1440×900, 1024, 390×844 and 360×740. No file other than this one was edited; screenshots are in `_shots/i4-review-*.png`. Zero console or page errors across about 45 loads. No horizontal overflow at 390 or 360 on any page.

**Not verified in the browser:** Music folder-tab hint stacking (Music 3), diagonal drag-to-close (Music bar 5), Home keyword ripple (Home 3), texture phase at the Home hand-off (Home 9), custom tiers in Studio (Thoughts 6).

## P0 · broken or against the owner's words

**1. Every selection leaks an observer and its detached detail DOM.**
- Repro: `projects/index.html`, 1440. Select timeline rows repeatedly.
- Measured (CDP, after forced GC): Nodes 3,202 → 8,392 → 13,669 → 18,946 over 90 selections. That is about 176 nodes per selection, linear, with no ceiling. With `IntersectionObserver` stubbed out the count stays at 3,199, so the observer is the retainer.
- Music list: about +100 nodes per selection. Music grid: 48.6k → 54.8k over 20 open/close cycles.
- Where: `kit/yarn.js:1300` (`wireDetail` creates an `IntersectionObserver` per render and never disconnects it). `watchStuck` near `kit/yarn.js:630` has the same shape.
- Why P0: Overall 5 names leaked observers, and the owner already reported memory spikes.
- Fix: store the observer on the element and `disconnect()` it before each re-render and on close, or use one shared observer with `unobserve`.

**2. The timeline ball lands on the wrong row after a filter.**
- Repro: `projects/index.html`, 1440, click "Work". The selected row ("Rust Are We Secure Yet?", y≈321) shows an empty ring; the ball sits at y≈554 beside the 2023 pill and stays there (checked at 2.5 s). Same on `music/index.html` with "Piano". Shots: `i4-review-pj-filter-settled-d.png`, `i4-review-mu-filter-d.png`.
- Where: `kit/yarn.js:1126` — `knotY` uses `getBoundingClientRect()`, so `select()` at `:1136` measures rows while the FLIP transform is still applied. Callers: `projects/projects.js:237,256`, `music/music.js:689,711,803,806`.
- Fix: measure the layout position (`offsetTop` chain), or call `tl.refresh()` when the flip comes to rest.

## P1 · clearly wrong or inconsistent

**3. Mobile player bar and search slot still look cut off (Music bar 3, FAB 1).** `music/index.html?demo` and `projects/index.html?fab=open`, 390 and 360. Both sit above the nav with their bottom edge tucked behind it. The owner's words were "doesn't fully overlap the bottom bar it gets cut off", which may mean the bar should cover the nav. Fix: either give the slot its own full rounded bottom edge with a gap above the nav, or let it cover the nav. Needs the owner's call.

**4. Filter feedback differs across the three list pages.** At 1440, Thoughts adds a status line ("5 of 17 · tagged #tools · Clear filters") that pushes the first month pill down by about 39 px (92 → 146). Projects and Music show nothing. Fix: pick one. Dropping the line fits the "no filler text" rule (Music bar 2), and the "All" chip already clears.

**5. Music header carries filler meta.** `music/index.html` shows "26 releases · 58 tracks" under the title, also on phones. Projects has none, and Thoughts 1 removed the same kind of line. Fix: remove it.

**6. Page titles and detail titles do not share edges (Overall 10).**
- Title top at 1440: Thoughts 92, Projects and Music 98.2.
- Detail title left at 1024: 95 on `projects/item.html`, `music/item.html` and `thoughts/tier.html`; 265 on the Thoughts article.
- Page column and nav edges do match (54→1386, 54→970, 21→369).
- Fix: one shared title-top token, and one detail column for all four detail pages.

**7. Home and Thoughts disagree on the post count.** Home says "Thoughts 16 posts"; the Thoughts page says "17 posts · since Sep 2026". Where: `home/home.js:58-62` counts `THOUGHTS.posts.length`. Fix: use the same source as the Thoughts header.

## P2 · polish

**8. Home underlines share a style but not a colour** (blue, orange, purple). The build reading of Home 2 says "colour/style consistent". Confirm with the owner.

**9. Music grid is 4 columns at 1440; Projects is 2.** Both are 2 at 1024. Music 2 says to copy Projects' layouts. Either match, or keep it and note it as deliberate (`gcols`).

**10. Music DOM is heavy.** 42–48k CDP nodes for about 1.7k elements (Projects: 3.2k), because each cover is its own SVG image document. Rasterise or cache covers in the optimisation pass.

**11. Mobile player panel order** is art + data + notes, scrubber, queue, with the controls fixed at the bottom. Music bar 6 asks for controls before the queue. It reads fine; mention it to the owner.

**12. Legacy light-red match rule remains.** `kit/yarn.css:724` (`.ystk.is-hit`) still uses the wash that Thoughts 5 retired. No page showed it; delete it.

**13. Scroll compensation on switching an open grid item** moves the page 615–815 px in one frame. It is compensated and I saw no jank in the filmstrip, but it is the likeliest source of the "jank with the scroll" in Projects 2.1 on a slower machine.

## What held up

- **Motion:** 50 rapid filter toggles leave no stray transforms or ghosts. Open, switch and close on Projects and Music retarget without snapping and end with one panel and zero ghosts. Home → Projects shows the section colour, then the white sheet rising from the bottom.
- **Performance:** no idle rAF on any page, including with the player bar. Listeners stay constant (106–127) through 50 toggles and 20 open/close cycles. Heap is 1.5–3.2 MB and grows 0.14 MB per 50 toggles. No animated filters or blurs.
- **Consistency:** "All" chip, red toggle fill, in-card match style (same computed colours on all three pages), year pills (sticky at 10 px, same dashed rule), sound tag position, and link buttons all match across pages.
- **Accessibility:** every visible control has a name. Focus rings are present on all tab stops tested. Enter opens a Projects grid card, Escape closes it and focus returns to the card. `?reduced=1` leaves no running animations.
- **Regressions vs i3:** none found.

## Spec checklist

| Item | Status | Note |
|---|---|---|
| Overall 1 red toggles | done | |
| Overall 2 no band behind stuck pill | done | |
| Overall 3 jersey default | done | |
| Overall 4 brand fade | done | GitHub checked |
| Overall 5 no heavy effects | **partial** | finding 1 |
| Overall 6 lightbox full screen | done | button present; not clicked |
| Overall 7 no Contact tab | done | |
| Overall 8 sound toggle + callout | done | callout shows about 2.5 s |
| Overall 9 "All" | done | |
| Overall 10 grids | **partial** | finding 6 |
| Home 1 RIT black | done | |
| Home 2 underline | partial | finding 8 |
| Home 3 captions / ripple | partial | notes only on composing; ripple unverified |
| Home 4 pointer | done | |
| Home 5 stack tags white | done | |
| Home 6 icon-only on phones | done | |
| Home 7 icon + username | done | |
| Home 8 no paper bits | done | |
| Home 9 hand-off | partial | sheet rises; phase unverified |
| Projects 1 dashed year | done | |
| Projects 2.1 interruptible + option | done | finding 13 |
| Projects 2.2 grid separators | done | |
| Projects 2.3 no rope in grid | done | |
| Projects 3 one-line filters | done | at 1440 |
| Projects 4 match in items | done | |
| Projects 5 white opened item | done | |
| Projects 6 no "private repo" | done | |
| Projects 7 mobile list + page | done | |
| Music 1 no dock | done | |
| Music 2 copy Projects | partial | findings 5, 9 |
| Music 3 tab hint stacking | unverified | |
| Music 4 smaller link buttons | done | 32 vs 44 |
| Music 5 no "Pause" text | done | |
| Music 6 bars on tab only | done | |
| Music 7 no dropping notes | done | |
| Music 8 queue | done | |
| Bar 1 volume always | done | |
| Bar 2 no filler | partial | finding 5 |
| Bar 3 mobile cut off | **partial** | finding 3 |
| Bar 4 mobile controls | done | |
| Bar 5 diagonal drag | unverified | |
| Bar 6 panel order | partial | finding 11 |
| Bar 7 centred pause | done | |
| Bar 8 desktop panel | done | |
| Thoughts 1–5, 7 | done | |
| Thoughts 6 custom tiers | partial | page done; Studio unverified |
| FAB 1 one slot | partial | finding 3 |
| FAB 2–5 | done | fits at 390 and 360 |

## Resolution (orchestrator, after the review)

- **P0 1, fixed.** `kit/yarn.js` `trackIO()`: each new observer first disconnects the ones whose element has left the document. Both `watchStuck` and `wireDetail` use it. Nodes after GC (0/30/60/90 selections):
  - Projects timeline: 3226 → 3152 → 3152 → 3152
  - Music timeline: 48770 → 54922 → 54922 → 54923 (the one-time step is the cover SVGs, see P2 10)
  - Projects grid, 0/8/16/24 open+close: 3405 → 3592 → 3592 → 3592
  - Music grid, same cycles: 42403 → 48726 → 48726 → 48726
- **P0 2, fixed.** `knotY` measures the knot's layout position (`offsetTop` chain), not its transformed rect. After "Work" on Projects the ball sits at y 321 and the knot at 321; after "Piano" on Music both are at 315.
- **P1 6, title tops fixed.** `.yhead__text { align-self: flex-start }` puts the title on the header's top line. Title top is now 92 on Projects, Music and Thoughts at 1440 and 1024, and 69 at 390. The Thoughts article sits at 265 at 1024 because of its left meta rail; that is by design.
- **P1 7, fixed.** The mock video post (`e3`) moved from `thoughts/common.js` into `kit/thoughts-data.js`, so Home, Thoughts and Studio all count 17 posts.
- **P2 12, fixed.** `.ystk.is-hit` is removed. `Yarn.stack` marks matches with `.is-match` directly, and the Projects remap is gone.
- **For the owner:**
  - P1 3: mobile bar overlap.
  - P1 4: Thoughts' filter status line.
  - P1 5: the Music count line.
  - P2 8: underline colour.
  - P2 9: Music grid columns.
  - P2 11: phone panel order.
- **Deferred to the optimisation pass:** P2 10 (Music cover DOM) and P2 13 (scroll compensation).
- **Re-check:** 78 loads (26 URLs × 1440/1024/390) with 0 page or console errors.

## Options: keep or cut

| Option | Call | Why |
|---|---|---|
| `toggle` | cut | owner decided on red |
| `bg` | keep jersey + intarsia only | owner is still between the two |
| `soundui` | cut to `tag` | the tag fits at every width; `nav` is what the owner rejected |
| `msearch` | cut `bar` | owner chose the FAB |
| `open` | keep | owner is undecided; inline is solid on desktop, page on phones |
| `sheetin` | cut to `rise` | matches the owner's words |
| `callout` | cut to `auto` | keep `always` as a debug param only |
| `player` | cut to the default | no reason found to keep the alternates |
| `gcols`, `gimg` | keep until finding 9 is settled | |
