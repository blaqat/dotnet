# Yarn kit · components (iteration 3)

> **i4 (site agent):** default background **jersey** (intarsia in ⚙) · `toggle=red` decided · the filter row's first chip says **All** · stuck year pills float on phones (no band) · link openers fade to their site's colour (`Yarn.brandOf`) · lightbox videos get **full screen** · in-card matches go back to i2's plain chip (`.is-match`) · rankings can name their own tiers (`tierDefs`).

> **i4 (chrome agent):** no **Contact** tab (Contact lives on Home) · the nav sits on the page column's edges · the sound toggle moved off the nav: a woven **tag** on the sheet's top edge by default (`?soundui=tag|brand|nav`), find the visible one with **`Yarn.soundToggle()`** · phones: one **slot** just above the nav for whatever is open, the player's bar or the search bar (`Yarn.slot`, § 21; **round 2:** i3's phone player is back, search unrolls out of its knob like the disc, nothing tucks under the nav, one **z-index scale**) · `msearch=fab` is the phone default, the FAB is quiet white · player: volume always out on desktop, no filler labels, prev + mute on the phone bar, a diagonal drag folds the page into the disc, panel = art + data + notes · rule · controls · queue, a fixed-art desktop grid, queue API `enqueue / playNext / remove / has` (§ 19b).

> **i4 round 2 (nav agent):** phones get six navs to choose from, `?mnav=corduroy|cotton|ink|frame|top|spool` (default corduroy until the owner picks; desktop unchanged). Each sets `--nav-bottom`, the layout contract for the bottom chrome (§ 12 "Mobile nav options"). Side by side: `kit/mnav.html`.

> **i3 (Thoughts deep dive) changed the kit for every page:** toggles fill (`?toggle`), detail pages keep links in the flow (`?dfoot`), year pills can carry a rule, post cards get the caps kicker + owner colours, "Tier list" → **Rankings**, `Yarn.flip` is interruptible, the opening animations are faster and lighter (`?motion=i2` to compare). New: `Yarn.pager`, `Yarn.strand`, `Yarn.post.swatch`, `.ychip--row`, `Yarn.motion`.

Every shared part lives here. See them live in `kit/components.html` (every state; ⚙ panel switches kit options). Page CSS may **position and lay out** kit parts, never restyle them. Missing something? Add the smallest page-local extension marked `/* KIT-CANDIDATE: … */` and report it.

## Include (every page)

```html
<html lang="en" data-section="projects">   <!-- home | projects | music | thoughts: frame color -->
<head>
  <link rel="stylesheet" href="../kit/yarn.css">
  <script src="../kit/data.js"></script>
  <script src="../kit/thoughts-data.js"></script>   <!-- only where needed -->
  <script src="../kit/yarn.js"></script>            <!-- NO defer: sets kit options + the transition gate before first paint -->
  <script src="your-page.js" defer></script>
</head>
<body class="frame"><main class="sheet"><yarn-nav active="projects" base="../"></yarn-nav><div class="ypage"> … </div></main></body>
```

`yarn.js` loads `swatch.js` + `lightbox.js` + `posts.js` (sync, right after itself) and `sound.js` (async). With `defer` it still works, but the arriving-page gate can flash and you must wait for `Yarn.ready` before using `Yarn.swatch`.

## Kit URL params (all pages, all in the ⚙ panel)

| Param | Values (default first) | What |
|---|---|---|
| `toggle` | `red` · `ink` · `tint` · `rope` | **multi-select toggles** (`.ytog`: filter chips, search tokens, Browse chips, a rail's type rows): red twill fill (**decided in i4**) · i1's ink fill · a quiet red wash · the rope (i2), the others kept to compare. In-card topic tags never fill: i4 puts them back on i2's plain chip (see "In-card match", § 7) |
| `sel` | `rope` · `ink` | **single-choice** selected (nav, segments, Mine/Everyone, year rail, a highlighted card) = red rope ring, or black twill fill |
| `dfoot` | `inline` · `float` | detail pages: `links` in the flow under the metadata + `end` (pager) after the text · i2's floating links bar |
| `motion` | `i3` · `i2` | motion timings (`Yarn.motion`): i3 = tuned, nothing waits on a fade · i2 = iteration 2's, to compare |
| `rope` | `in` · `out` | `in` = the rope sits ON the element's own edge with its own radius (it becomes the outline; no inset, no rim outside). `out` = a ring around it with a small gap |
| `body` | `nunito-sans` · `figtree` · `atkinson` · `system` | body font |
| `bg` | `jersey` · `intarsia` · `quilt` · `speckle` · `current` | sheet background; sets `<html data-bg>`, loads `kit/bg/<name>.css` (overrides `--sheet-bg`, `--patch-bg`). **i4: default `jersey`** (owner: "between jersey and intarsia"); `intarsia` (i2–i3's default) stays in ⚙. See `kit/bg/NOTES.md` |
| `mnav` | `corduroy` · `cotton` · `ink` · `frame` · `top` · `spool` | **phones only (< 960px): which mobile nav** (i4 round 2; owner "not sold on the brown bar"). Default `corduroy` until the owner picks. `html[data-mnav]`. Each value sets `--nav-bottom` (§ 12 "Mobile nav options"). Side by side: `kit/mnav.html` |
| `nav` | `corduroy` · `cork` | material of the `mnav=corduroy` bar only |
| `reduced` | `1` | reduced motion (also `prefers-reduced-motion`) → `html.y-reduced` |
| `from=home`, `trp=0..1` | | play / freeze the arriving sheet reveal |
| `lb=<group>:<i>` | | open the lightbox on load |
| `browse=open` | | open the first filter row's Browse sheet on load |
| `disc` | `swatch` · `cat` | the record's label: the track's yarn swatch, or the red cat (player + `Yarn.disc`) |
| `msearch` | `fab` · `bar` | mobile search + filters on every list page (< 960px), via `Yarn.listTools`: `fab` (i4 default) = a quiet search FAB that unrolls into the slot above the nav (just the field), the filter chips floating above it, the active filters kept as chips at the top of the list; `bar` = top search + sticky filter row. Old `?search=fab|fab-row` maps to `fab`, `search=bar` to `bar` |
| `fab=open` | | open the search FAB on load (msearch=fab) |
| `soundui` | `tag` · `brand` · `nav` | where the sound-effects toggle lives (i4): `tag` = a woven care label sewn into the sheet's top edge (top centre on desktop, top right on phones; every page incl. Home) · `brand` = a small knit button beside the wordmark (Home, which has no nav wordmark, falls back to the tag) · `nav` = i3 (desktop nav's top right + the phone bar's last slot). `html[data-soundui]` |

## The two rules (apply to rows, cards, chips, tabs, section buttons)

- **Hover** = `.ylift` (rises 2px + soft shadow, `:active` scale .97). Never the rope (Home's section buttons are the one exception).
- **Toggled** (multi-select, i3) = `.ysel.ytog` + `aria-pressed="true"`: a **fill** per `?toggle=` (default red twill, flat, quiet stitch), never a rope unless `?toggle=rope`. `Yarn.chip()` and `Yarn.tag(…, { as: "button" })` add `.ytog` for you.
- **Selected** (single choice) = `.ysel` + `aria-pressed="true"` | `aria-selected="true"` | `aria-current="page|true"` | `.is-selected`. Rope sews in when it becomes selected; ink mode fills black and flips every kit part inside (badges, tags, dates use `--y-fg*` tokens).
- Set `--ysel-r` to the element's radius (chips/rows/cards set it already). Don't put `overflow:hidden` on a `.ysel` (rope-out is drawn outside). Tight spots force the rope inside: `.rope-in` on the element or `.rope-in-all` on a container.
- Focus = dark 3px thread ring (`--focus`), so it never reads as "selected". It always wins: over the stitched outline, over rope-in (which hides the stitch) and over ink fill (kit rule after the selected styles).
- Do: `<button class="yrow ylift ysel" aria-current="true">` (one of many: add `.ytog`). Don't: animate a ring on hover, or invent your own selected color. The rope sits flush on the element's own edge with its own radius (`inset: 0`), never inset with a rim of fill outside it.

---

## 1 · Fonts
Nunito (display, 850–900), **Nunito Sans** body (16px/1.55), **Maple Mono** (`--font-mono`, `.meta`) for dates, counts, durations. Tokens: `--font-display`, `--font-body`, `--font-mono`. Classes: `.h1 .h2 .h3 .meta .eyebrow .muted .sr-only`.
Do: dates/counts in `.meta`/`Yarn.badge.date`. Don't: hard-code a font family.

## 2 · Page header
```js
Yarn.header({ title: "Projects", meta?: "12 projects", actions?: Yarn.seg([...]), level?: 1 })
```
→ `.yhead > .yhead__text > h1.yhead__title (+ .yhead__dot ".") + .yhead__actions`. Same size everywhere (2.75rem / 2.1rem mobile). `meta` is an optional slot: no subtext unless you pass it (Projects leaves it empty: title, search, filters only). On phones an action button overhangs instead of making the header taller.
`Yarn.seg([{ value, label, icon }], { value, label, name })` → `.yseg` segmented control; listen for `ychange` (`e.detail.value`, `e.detail.name`).
Do: one header per page. Don't: add a lede paragraph under it.

**Page column + tools.** Wrap a page's content in `.ypage` (same gutters on every page: 40px desktop, 14px phone; bottom room for `--bottom-ui`) and put the search line + filter row in `.ytools` right under the header. `.yhead` keeps a 48px min-height on desktop, so the search line starts at the same y with or without header actions. Header order everywhere: `Title.` + meta inline (left), actions (right), search (full line), filter row.

## 3 · Filter model (shared by search, row, Browse, `[data-yf]`)
```js
const F = Yarn.filters({
  groups: [
    { key: "type",   label: "Type",   row: true, values: ["Personal","Work","School"] },
    { key: "status", label: "Status", row: true, values: ["ongoing","complete","paused"] },
    { key: "stack",  label: "Stack",  values: [...stackNames] },          // Browse + search tokens only
  ],
  items: BLAQAT.projects,     // optional: facet counts, dims chips that would find nothing
  get: { },                   // optional getters; defaults: type, status (normalized), stack, instrument, tags
  text: (it) => "...",        // optional free-text haystack (default: name, description, type, stack, tags…)
  url: true,                  // reads/writes ?type=&status=&stack=&q=
});
F.test(item) · F.toggle(key, value) · F.set(key, values) · F.clear(key?) · F.setQuery(s) · F.has(k,v) · F.any() · F.count(k,v) · F.on(fn(F, src))
```
Kinds (`kind` defaults to `key`): `type`, `status`, `stack` (devicons), `instrument`, `tag` (`#x`), anything else = plain. Semantics: none selected = all · tap solos · more taps add · tap selected removes. Within a group OR, across groups AND, then text.
Any element with `data-yf="stack:Python"` toggles the latest model (`Yarn.filters.current`).

## 4 · Search
```js
Yarn.search(el, F, { placeholder: "Search projects…", hint: true, tokens: true })  // returns { el, input, focus(), refresh() }
```
Full-width line. Free text filters live. A known term becomes a filter on **Enter / Tab / comma** (top suggestion is pre-highlighted; ↑↓ to choose). Terms from a group shown in the chip row light that chip (pulse) instead of making a duplicate token; other groups appear as **tokens** (`.ychip.ytoken`, with icon). Click a token, or **Backspace twice** on an empty field, to remove (first press shows the strike). `/` focuses it. Sounds: `token-add`, `tag-remove`.
Do: put it above the filter row. Don't: build a separate stack-chip row (stack lives in search + Browse). The "/" hint is hidden on touch.
`tokens: false | (group) => bool` (i3): no tokens for groups a page already shows (Thoughts' split rail); a typed term then pulses its visible chip instead. Call `refresh()` after the layout changes. The clear button sits in the top-right corner (never wraps onto its own line).

### 4b · List tools: one mobile pattern (`?msearch=bar|fab`)
```js
const T = Yarn.listTools(F, { tools: el, search: searchHost, row: rowHost, sticky: listEl, count: () => "3 of 12 shown", label, title, stickyDesk: false, lift: 0 })
T.fab · T.place() · T.paint() · T.isFab() · T.destroy()
```
Build the search + filter row as usual, then hand both hosts to `listTools`. `fab` (i4 default), phones only: the search line moves into the `Yarn.fab` slot (§ 21: just the field, just above the nav) and the filter row into `f.float`, a horizontal row floating above the slot while it's open (`.yfilter--float`: one line even for `wrap: true` rows; its **All** chip shows a **✕** once anything is on, same click = clear every filter); the FAB badge counts active filters, the "n of m shown" count is read out (no visible text), and `.yactive` (removable chips + Clear all) sits in `tools` at the top of the list. `bar`: they live in `tools` (the `.ytools` box); on phones the row is sticky (`stickyDesk` makes it sticky on desktop too) and `--sticky-top` = its height is set on `sticky`. Re-places itself at the 960px breakpoint; tears itself down (FAB, observers, listeners) when `tools` leaves the DOM. `lift` stacks the FAB above another one.

## 5 · Filter row + Browse
```js
Yarn.filterRow(el, F, { sticky: false, all: "All", browse: true, wrap: false, extra: [] })   // { open(), close(), sheet }
```
`[All] [row group 1] ┆ [row group 2] …(scrolls)… [⚙ Browse n]`. Browse opens a sheet anchored under the row (grows from the button) with **every** group, stack with devicons, facet counts, Clear all / Done. Esc / outside click closes, focus returns. `sticky: true` pins it (`top: var(--sticky-top)`) and adds `.is-stuck`. Selected chips show a **red strike-through on hover/focus**. Sounds: `chip-on`, `chip-off`, `open`, `close`.
Single chip markup if you need one: `Yarn.chip(F.group("type"), F.info("type","Work"), { pressed, cls })` → `button.ychip.ysel.ytog[data-g][data-v]`. `cls: "ychip--row"` = a full-width list row (flat until hovered or toggled; a rail's type list, i1). Group values may pass `iconHTML` (e.g. `Yarn.post.swatch(key)`).
`wrap: true` (`.yfilter--wrap`): the chips wrap onto more lines instead of scrolling (Projects on phones). `extra: [{ label, html }]`: link groups shown in the Browse sheet after the filters (`.ybrowse__links`, a grid; Thoughts puts Collections + project write-ups there).
Do: row = the 1–2 groups people use most. Don't: put stack chips in the row.

## 6 · FLIP filter animation
```js
F.on(() => Yarn.flip(listEl, "[data-key]", () => {
  listEl.querySelectorAll("[data-key]").forEach((el) => (el.hidden = !F.test(byKey[el.dataset.key])));
}));
```
Survivors glide (spring), new ones grow in, leaving ones fade out in place (ghost clones). Works with hide/show or a full re-render (matched by `data-key` → `data-id` → `data-slug` → `id`). Options `{ response, enter, exit, stagger }` (defaults from `Yarn.motion`).
**Interruptible (i3):** everything is measured where it is *on screen* (mid-flight springs, a half grown-in item, a fading ghost) before the mutation, and springs keep their velocity, so a fast second click continues from there (i2 cleared the transform first and snapped items to their old target). An item that comes back while its ghost fades returns from the ghost; one that leaves mid grow-in fades from where it got to. Glides ride `transform`; grow-in / fade-out ride `scale` + `opacity`, so they compose. Reduced motion: instant. Zoom-aware: inside a CSS-zoomed list (Music while an item is docked) it divides by `currentCSSZoom`, so items start exactly where they were.
Do: do all layout work (masonry spans etc.) inside the callback. Don't: also run a view transition / fade.
**i4 (projects):** `own: (el) => bool` = elements the caller animates itself this time (`Yarn.openInPlace`'s growing / shrinking item): flip leaves them alone and drops any glide they had. Don't flip an element that also has `.ylift`: its CSS `transition: transform` smears every spring frame, and a fast re-click then looks "completed" instead of reversing (i3 Projects' grid bug). Put `data-key` on a plain cell and `.ylift` on the card inside it.

### 6b · Open in place (`Yarn.openInPlace`, i4 · projects; Music reuses)
```js
const io = Yarn.openInPlace(listRoot, { cell: ".ygroup__item", flipSel: "[data-key]",
  closed: (key) => cardHTML, opened: (key) => `<section class="ypanel">${Yarn.detail({…})}</section>`,
  settle: (cell) => scrollY | null, top: () => px, onOpen(cell, key, { instant }), onClose(cell, key) });
io.open(key, { instant }) · io.close({ instant }) · io.toggle(key) · io.current · io.collapse() · io.reset()
```
The cell swaps its closed content for the opened content and gets `.is-open` (`.ygroup__list--grid > .is-open` spans the row). Neighbours glide (`flip`). The opened item grows out of the card's on-screen rect: clip-path inset + translate on **one** spring, so the visible shape morphs rect → rect. The content fades in once there's room, and the closed card rides the shape's corner and fades. Closing: a ghost of the panel shrinks into the card's new slot (content leaves first) while the card fades in under it. Open / close / switch / filter all start from the shape on screen, so a second click reverses mid-flight. Scroll: `settle(cell)` runs inside the flip as one instant jump (flip measures before and after it, so nothing on screen jumps); there's no smooth scroll racing the morph. Close keeps the card where the panel's top was. Filtering the open item away: run the flip, then `io.collapse()`. Reduced motion: instant. Projects: grid `?open=inline`; recipe in `projects/LAYOUT.md`.

## 7 · Badges, meta, stack, tags
```js
Yarn.meta(item, { parts?, compact?, dur?, stack?: false|"chips"|"icons" })   // status · type · date
Yarn.badge.status(s, { compact })     // Ongoing = red ribbon w/ needle · Complete = sewn check · Paused = 2-hole button · Dropped = trash bag
Yarn.badge.type(t, { compact, icon, label })   // Personal / Work / School icon dots; { icon, label } for another vocabulary (Thoughts post types)
Yarn.badge.pub(state, { compact, text })        // Studio publish state: live (sewn on, ink) · changed (pinned edits) · draft (basted) · hidden
Yarn.badge.instrument(i)              // piano / beepbox / daw (music hides it by default: the yarn says it)
Yarn.badge.date(item | iso, { dur, style: "month|day|full|monthLong", time })
Yarn.stack(list, { variant: "chips"|"icons", max, as: "li"|"button", size: "sm" })   // as:"button" → data-yf filter buttons; size sm = 26px icons
Yarn.tag("svelte") / Yarn.tags(list, { as: "a"|"button", pressed: Set })  // links to ../thoughts/stitched.html?tag=svelte
Yarn.tagHref(tag) · Yarn.devicon(name) → url|null · Yarn.stackIcon(name) · Yarn.DEVICONS
Yarn.status(s) → { key, label, icon }  (Ongoing/wip/in progress → ongoing; Completed/complete/done → complete; paused; dropped)
Yarn.type(t) · Yarn.instrument(i) · Yarn.dateRange(item) · Yarn.duration(item) · Yarn.fmt.{month,day,full,time,monthLong}
```
Date format, everywhere: `Sep 2025 – now` · `Mar – Aug 2025` · `Jun 2024` · `Dec 2023 – Feb 2025` (ongoing → "– now"). Default parts: projects `status · type · date`; music `status · date`. Put `.on-ink` on any dark surface and everything flips.
**Density, one per breakpoint:** in lists on phones (< 960px) status / type / instrument badges are icon-only (the label stays for screen readers); desktop and detail heads (`.ydetail__meta`) show labels. `.ydate__dur` is `--y-fg-2` (AA at 12px).
Do: `Yarn.meta(p)` in rows, cards, detail heads. Don't: print status as plain text or color-only dots.
**In-card match (i4):** a tag, stack chip, type or status badge inside an item that matches the active filter or search uses i2's plain chip everywhere: `color: var(--y-fg); background: var(--y-chip)` (a pressed `.ytag` does it already). Put `.is-match` on a non-tag badge for the same look. Not the light-red wash (it didn't read on every card colour).

## 8 · Year pill + timeline
```js
host.innerHTML = Yarn.timelineHTML(Yarn.byYear(items), (p) => `<button class="yrow ylift ysel" aria-current="false">…</button>`, { key: (p) => Yarn.slug(p.name), unit: "project" });
const tl = Yarn.timeline(host.querySelector(".ytl"), { ball: true, trail: true });
tl.select(keyOrEl) · tl.refresh() · tl.current
Yarn.yearPill(2025, { count, unit, attrs, cls, rule })   // standalone sticky white oval (.yyear); attrs e.g. 'data-key="m:2026-11"' for flip
// rule: true → .yyear--rule: the pill + a dashed line across its column (i1's month marks). The line belongs to the pill
// (it glides with it in flip), is sized to the parent's right edge (--yrule, kept by yarn.js) and steps away while stuck.
```
`.yyear` is the one year separator everywhere (timelines, Music's phone list, Thoughts' months, the year rail, Projects' year groups (i4: ruled, over the grid / phone list)). **i4:** a stuck pill floats over the items on phones too (no cotton band behind it, owner); `.is-stuck` is only kept on ruled pills, whose line steps away while stuck.
Dashed thread at `--ytl-x`, dashed knots per item, sticky year pills on the thread (`top: var(--sticky-top)+10px`), a red yarn ball that rolls (spring) to the selected item and leaves a red strand. Set `aria-current` on your row yourself. `ball:false` for Thoughts mobile.
The ball follows layout changes under it (fonts landing, images, filtering): mid-roll it retargets the same spring instead of settling on the stale spot. `Yarn.timelineHTML(…, { cls: "ytl--sm" })` = small knots and pills (activity feeds).
Do: call `tl.select()` when an item opens and `tl.refresh()` after filtering. Don't: put `overflow:hidden` on `.ytl`.
**i4 (projects):** `Yarn.timelineHTML(…, { rule: true, pillKeys: true })` = ruled pills (the dashed year line, like Thoughts) that glide in `flip` (`data-key="y-<year>"`); every group carries `data-year`.
```js
// year groups: the plain sibling of the timeline (a ruled pill over a list or a grid), Projects' grid + phone list, Music next
host.innerHTML = Yarn.yearGroupsHTML(Yarn.byYear(items), render, { key, unit: "project", grid: true, rule: true });
// → .ygroups > section.ygroup[data-year] > h2.yyear.yyear--rule[data-key="y-…"] + ol.ygroup__list(--grid) > li.ygroup__item[data-key]
F.on(() => Yarn.flip(host, "[data-key]", () => Yarn.filterGroups(host, (key) => F.test(byKey[key]), { unit: "project" })));
// filterGroups hides items + empty years, rewrites the pill counts, returns the shown count (.ygroup* and .ytl*)
```
Tokens: `--ygroup-gap` (between years), `--ygroup-row` / `--ygroup-col` (gaps), `--ygroup-cols` (grid columns, 2).

## 9 · Lightbox (`kit/lightbox.js`)
Zero JS: any element with `data-ylb="<group>"` opens the group (all `[data-ylb=<group>]` in DOM order); `data-src`, `data-alt`, `data-kind="image|video"`; title from closest `[data-ylb-title]`. `Yarn.carousel` emits this.
```js
Yarn.lightbox.open({ items: [{ src, alt, kind }], index, title, thumbs: (i) => el }, { instant })
Yarn.lightbox.openGroup("group", i) · Yarn.lightbox.close() · Yarn.lightbox.isOpen
```
Opens from the thumbnail, closes into it (thumb hidden meanwhile: `.is-lb-source`). Drag down to dismiss, swipe/←→ to page, Esc, focus trap, "n / m", caption. Video: muted by default, controls under it (play/pause, time, scrub, mute, **full screen** (i4)), Space/K, M, **F**, Shift+←/→. Full screen puts the `<video>` itself full (Fullscreen API, native controls while full; iPhone Safari: `webkitEnterFullscreen`); with neither the button stays hidden. Esc leaves full screen first, then the viewer; paging or closing leaves it too. Sounds `lightbox-open/close`, `play/pause`.
Do: let thumbs be `<button>`s. Don't: autoplay with sound or add overlay play buttons.

## 10 · Media carousel
```js
Yarn.carousel(item.images, { title: item.name, group?, label: "Media", heading: true })
Yarn.media("/media/x.mp4") → absolute file URL (repo public/media or design media) | null (remote / missing)
```
Compact strip of 148px (120px mobile) thumbs; videos show a frame + duration; missing/remote media = designed placeholder (never a broken image). Override size with `--ycar-w` / `--ycar-w-m`.
Do: place it after the metadata. Don't: make media a 50% hero in an opened item.

## 11 · Detail shell
```js
Yarn.detail({ back: { href, label } | { label } (button[data-back]), actions, title, meta, media, body, links, end, kicker, top, size, level, wide })
Yarn.pager({ prev, next, ends: { prev, next }, labels: { prev: "Older", next: "Newer" }, icons, label })   // i1's in-flow pager
```
`article.ydetail > .ydetail__top(sticky: back · compact title · actions) + header.ydetail__head(title + meta) + .ydetail__body(media + .ydetail__text) + footer.ydetail__foot(sticky: .ydetail__bar)`. Order: title → metadata → media → text → links. Large-title pattern: the sticky bar shows the title once the big one scrolls under it (`.ydetail__top.is-stuck`), so the head never changes height (no jump) and stays short on phones; the foot gets `.is-stuck` when floating. Auto-wired, also inside a scrolling panel. Foot sits above `--bottom-ui`. `wide: true` lets the text use the full width (boards, previews) instead of the 68ch measure. The body grid is `minmax(0, 1fr)`, so a long code line scrolls inside its block. Prose links in `.ydetail__text` are red; kit parts in a body (`.ytag`, `.ystk`, `.btn`, `.ylinkicon`) keep their own colors.
**i3 · in the flow:** with `?dfoot=inline` (default) `links` render as `.ydetail__links`, a row right under the metadata (reachable near the top), and `end` renders after the text (`.ydetail__end`; put `Yarn.pager` there). `?dfoot=float` = i2's floating `.ydetail__foot` bar (and its nav-away on phones). `kicker` = a line above the title (`.ydetail__kicker`: caps type · mono date · read time); `top: false` drops the sticky top bar (the page places Back, e.g. an article's meta rail); `size: "lg"` = the reading-page title. **Pager:** `Yarn.pager` → `nav.ypager` with two `.ypager__a` cards (`← Older / title / meta` · `Newer → / title`); a missing side becomes the quiet dashed way out from `ends` ("Oldest article → Back to all thoughts"). Used by Thoughts articles + write-ups and the Projects item page.
**Detail page skeleton:** `Yarn.detailPage(Yarn.detail({ … level: 1 }), { rail, side, wide, railLabel, sideLabel })` (`side` = a left meta rail in the first column, `.ydpage--side`: an article reads as three columns sharing one top line; on phones it stacks above the column) → `.ydpage > .ydpage__main + aside.ydpage__rail`. One reading column (`--ydetail-w: 760px`) at the same x on every detail page (the rail column, `--ydetail-rail: 220px`, is reserved even when empty), `wide` spans column + rail (tier board). One top-bar offset/height (10px / 70px), one foot height (`.ydetail__bar` 60px), body text ink at 16px (`.yprose` keeps 17px for articles). Top actions are `.ylinkicon` (44px). A level-1 detail is `.ydetail--page`: on phones, while its links bar floats, `html.y-navaway` hides the nav bar (Back is in the top bar) and the bar drops to the nav's place; the player's disc and bar anchor above it (`yarn:bottomchrome` event).
`Yarn.linkIcon(kind, href, label?, { sm })` for round icon links: github · soundcloud · youtube · beepbox (the original site's duotone circle, `.yduo`) · spotify · instagram · x · discord · linkedin · twitch · email · view · link. `sm` = 32px (dense rows; 44px hit area on touch). Non-http hrefs open in place.
**Brand fade (i4):** a link opener to a known site fades to that site's colour on hover / focus (a twill layer, opacity only) and its icon turns white: GitHub black, YouTube red, BeepBox purple, SoundCloud orange, Spotify green, Discord blurple, Instagram gradient, X black, LinkedIn, Twitch. `data-brand` comes from the kind, or from the host for `view` / `link` (a `view` to discord.com gets Discord's logo + blurple); `Yarn.brandOf(href, kind?)` exposes it. A page's own text link-out (`a.btn[href^=http]`, e.g. Projects' "Add to Discord") gets its brand on first hover / focus, no page change needed. Unknown sites keep the default button. White on every fill ≥ 4.5:1 (SoundCloud and Spotify use a deeper shade for that; numbers in yarn.css "LINK OPENERS").
**i4 (projects) · what the detail sits on:** an item opened in place (or a timeline's stage) goes in a `.ypanel`: the white card material (`--patch-bg`, white felt with jersey / intarsia) with a pop shadow, not the sheet (owner, Projects 5). Its sticky bar wears the same material through `--ydetail-bg`. A detail page (`Yarn.detailPage`) stays on the sheet; its bar wears `--sheet-bg`. `.ypanel` pads its sides with `--ypanel-pad` (28px, 16px on phones) and the bar bleeds to the panel's edges. Pass no `links` (empty string) and there's no links section at all (no "private repo" line). Focus moves to a `tabindex=-1` title when an item opens; it shows no ring (it isn't a control).
Do: `meta: Yarn.meta(p, { dur: true }) + Yarn.stack(p.stack)`. Don't: repeat the title in the body.

## 12 · Navigation
`<yarn-nav active="home|projects|music|thoughts" base="../">` (re-renders if `active` changes). Desktop: brand left, raised knit tabs Projects / Music / Thoughts with section-color felt dots (`.ydot`), current tab = selected rule; the nav sits on the page column's edges (brand on the title's left edge, last tab on the tools' right edge). Mobile (<960px): Home / Projects / Music / Thoughts in the nav chosen by `?mnav` (below); default the corduroy bottom bar, current = cream patch with the rope (or ink felt). **i4: no Contact tab** (Contact lives on Home); nothing links to `?skip#contact` any more.
**Sound toggle (`?soundui`, i4):** a `button[data-sound-toggle]` (kit/sound.js unhides + wires it, keeps `aria-pressed`, the icon and any `[data-sound-label]` text in sync). `tag` (default) = `.ysound.ysound--tag`, a direct child of `<yarn-nav>` positioned on the `.sheet` (top centre desktop, top right phones; says "Sound off / on"); `brand` = `.ysound.ysound--brand` after `.ynav__brand` (Home → tag); `nav` = i3's `.ynav__sound` + `.ybar__sound`.
**Find the visible one:** `Yarn.soundToggle()` → the `[data-sound-toggle]` for this placement and width: the one on screen, else the one that will be once sound.js (loaded async) unhides it. `await Yarn.soundToggle.when()` → that element once it is showing (≤ ~3 s), or `null` (no WebAudio: sound.js keeps it hidden). Home's "Press unmute for sound" callout anchors to its `getBoundingClientRect()` (re-read on resize: the tag is top centre on desktop, top right on phones); `html[data-soundui]` says which placement is on. A click anywhere on `[data-sound-toggle]` toggles (sound.js delegates), so don't add your own handler; listen on `window` `"yarnsound"` (`detail.enabled`) or `YarnSound.on(fn)` for the change.
`--nav-bottom` (0 on desktop; on phones it depends on `?mnav`, table below) and `--bottom-ui` (= nav + player; the player may override on `<html>`): pad fixed/sticky bottoms with `var(--bottom-ui)`. `.sheet` already pads for it.

### Mobile nav options (`?mnav`, phones < 960px, i4 round 2)
**Layout contract for the bottom chrome (player, search FAB, toasts…):**
- `--nav-bottom` = the exact space the nav takes from the bottom of the viewport: bar height + its bottom margin, **not** counting `env(safe-area-inset-bottom)` (`--ynav-top` adds that). It is `0` when the nav takes no strip. Measured: `innerHeight - .ybar.getBoundingClientRect().top` equals it (±1px) for every value that has a bar.
- The nav is `z-index: var(--z-nav)` (50) in every value (the bar, the spool, the top strip). Anything that must be on top uses a higher token from the Z-INDEX SCALE.
- `.ybar` exists only where there is a bottom bar. `top` and `spool` render no `.ybar` at all (a reader that looks for `.ybar` sees no nav and falls back to the screen bottom, which is right: `--nav-bottom` is 0 there). Read `--nav-bottom` / `--ynav-top`, not the element.
- Under `html.y-navaway` (a page detail's floating links bar) every bar slides down and hides; the spool steps away too.
- `spool` reads the chrome's tokens: it rests centred on `--yslot-mid` at `--yslot-side`, moves up by `--yslot-h` (scale .846) while `html[data-yslot="player"]`, and hides while any other owner holds the slot.

| `mnav` | What it is | `--nav-bottom` |
|---|---|---|
| `corduroy` (default) | i3/i4's brown corduroy bar, floating 14px off the bottom, 70px tall; labels under felt dots; current = cream patch + rope | **84px** |
| `cotton` | a white knit pill (the sheet's cloth, like the white FABs), floating 14px off the bottom, 64px tall; labels; current = rope on the item's edge | **78px** |
| `ink` | a black felt bar, floating 14px off the bottom, 56px tall; icon-only, only the current page shows its label and its section colour | **70px** |
| `frame` | no floating bar: the section-coloured cord frame widens at the bottom into a docked band, flush with the screen's bottom and side edges (the sheet ends on it); current = a cotton patch + rope | **64px** |
| `top` | no bottom bar: the four sections sit in a knit strip under the wordmark, in the page flow (it scrolls away); the bottom is all content | **0** |
| `spool` | no bar: one quiet white **sections** pill (current section's dot + name) rests at the left end of the FAB row; it unspools upward into the four sections. While the player's bar holds the slot it waits above the slot (like the FAB), while search holds it it steps away | **0** |

Selected = the rope flush on the item's own edge with its radius (corduroy keeps i4's inset patch). Every item is ≥ 44px, has its label (ink's hidden labels stay as accessible text), and gets the focus ring (white on ink). `spool` is a disclosure: Enter/tap opens it and focuses the current page, Esc / an outside tap / tabbing away closes it, the card rises on opacity + transform only (a second tap reverses it mid-way), reduced motion = fade. Markup: `.ytop > ul.ytop__list > li > a.ytop__item.ysel` · `nav.yspool > .yspool__menu > ul.yspool__list > li > a.yspool__item.ysel` + `button.yspool__btn[aria-expanded]`. `?embed` hides the ⚙ panel (`kit/mnav.html`'s frames).

Sound toggle (`?soundui`): `tag` and `brand` don't touch the nav in any value. `nav` puts it in the nav: the bar's last slot (`.ybar__sound`: corduroy · cotton · ink · frame), the strip's last cell (`.ytop__sound`), or a small round button beside the pill (`.yspool__sound`). `Yarn.soundToggle()` knows which.
Another page list (Studio): `Yarn.navHTML({ active, pages: [{ key, label, href, icon, section?, tab?, bar? }], brand: { href, label }, badge, extra, label })` returns both bars' markup; or set `navEl.config = { pages, … }` on a `<yarn-nav>`. `tab: false` = mobile bar only, `bar: false` = desktop only; `section` dyes the felt dot (`studio` = ink).
The nav renders the page's **skip link** (`.yskip`, first Tab stop → the first `.ypage`); pages don't add their own.
Do: Home passes `active="home"` (no separate home nav on mobile). Don't: render your own tab bar.

## 13 · Section transition
```js
Yarn.transition.go(buttonEl, href, "music")   // or <a data-transition="music" href="…">
Yarn.transition.cancel()                     // Esc does this
```
Leaving: a cord cloth in the target section's color grows out of the button on one critically damped spring and navigates as soon as the screen is covered (≈0.4 s). Arriving (`from=home` or the session flag): `html.yt-enter` holds the page behind its cord; the white sheet arrives (`?sheetin=`, carried over from the departing page) while content fades in under it, never outside the white; everything outside `.sheet` (player, FABs, ⚙) and the phone bar fade in after. Reduced motion: fades. Failsafe un-hides after 3 s. Sounds `cloth`, `unroll`.
**i4 (home):** `sheetin=rise` (default) = the white's top edge comes up from the bottom (rounded like the sheet, a shadow "lip" riding it; content stays put) · `slide` = the whole sheet travels up (heavier on desktop: it moves a document-tall layer) · `grow` = i3, from the button. **Phase lock:** `.frame` and `.ytr__cloth` paint `--tex-cord` on the same fixed tiles from the top-left (`background-size: 520px 1008px, 520px 1002px`, both seamless), so the cloth lands on the next page's frame stitch for stitch (measured on the last/first frames: best offset 0,0, mean diff 0.0 desktop, ≤ 0.2 phone = gradient dither; i3 was 0.5–3.5px off, mean diff 2.5–12.8). If you restyle the frame's background, keep that `background-size`. The cloth's shadow is two flat clipped layers (no `filter`).
Do: call it from home's section buttons and keywords. Don't: write your own departing/arriving animation.

## 14 · Scribble underline
```html
<a class="yscribble" data-draw style="--scribble: var(--blue)">software engineer</a>
```
yarn.js adds a hand-drawn, seeded SVG sized to the word (redraws on resize). `data-scribble="wave|loop|double"`. Draw-in: `data-draw` + add `.is-drawn` (or `Yarn.scribble.draw(el)`); `data-draw="auto"` draws on scroll-in. Vars: `--scribble`, `--scribble-w`, `--scribble-dur`, `--scribble-delay`. Colors: `--blue --purple --gold --red --orange` (RIT orange).
Do: one per keyword, short words (it doesn't wrap). Don't: use dashed borders as underlines.

## 15 · Instrument swatches (`kit/swatch.js`)
```js
Yarn.swatch(item, { motif?, seed?, cols: 15, rows: 15 }) → data URI (cached)
Yarn.swatchHTML(item, { size: 56, radius, label }) → <span class="yswatch">
YarnSwatch.motif(item) · YarnSwatch.MOTIFS · YarnSwatch.PAL
```
Piano = black yarn (keys · stripes · argyle). BeepBox = purple with circles (ring · rings · dots · bubbles). DAW = blue with waves (sine · square · triangle · saw). Seeded by `id|url|name`: same track → same swatch everywhere (music, player, thoughts playlists, studio).
Do: pass the BLAQAT song/collection object. Don't: label the instrument next to it (the yarn already says it).

## 16 · Background hook
`.sheet` and `.m-diamond` paint `var(--sheet-bg, <diamond + knit + cotton>)`; `.patch`, `.ycard`, `.yrow` paint `var(--patch-bg, <knit + white>)`. `?bg=<name>` → `<html data-bg="<name>">` + `kit/bg/<name>.css` (jersey · intarsia · quilt · speckle · current). Options in the ⚙ panel come from `BG_OPTIONS` at the top of `yarn.js`.
Do: build cards on `.ycard`/`.patch` so backgrounds can restyle them. Don't: hard-code a sheet background in page CSS.

## 17 · Music folder card
```js
Yarn.folder(entry, { tracks?, current?, links, action, open: { attrs, label }, meta?, desc: true, key })
```
`.yfolder(.ylift) > .yfolder__tabs (collections) + .ycard.ysel.yfolder__card(.yfolder__open + head (swatch, name, meta) + desc + foot (links · playing eq · action))`. A collection is a folder: one tab per track peeks above the card, the playing track's tab (`current` = its id) stands up with a red thread, hover/focus shows its name, arrows move along the strip (kit-wired). Pages handle clicks on `.yfolder__tab[data-tid]` (play) and `.yfolder__open` (open). Touch: each tab is 44px tall; a strip packed tighter than 44px per tab gets `.is-dense` and opens the folder instead. In a multi-column grid set `--yfolder-top: 22px` so singles line up with collections. Used by Music and Studio's music preview.

## 18 · Year rail
```js
const rail = Yarn.yearRail(navEl, listEl, { item: "[data-year]", top: 24 })   // { refresh(), spy(), current }
```
The kit's `.yyear` pills on a dashed thread, sticky beside one continuous flow (no row break per year, so years with one item leave no holes). The year at the top of the view is selected (rope via `aria-current`); a pill jumps there. Call `rail.refresh()` after filtering (counts + empty years). Music desktop; on phones use one column with sticky `Yarn.yearPill`s.

## 19 · Disc · waveform · equalizer
```js
Yarn.disc(track?, { size: 60, label: "swatch"|"cat", spinning })   // the felt record; spins under .is-playing / .is-spinning
Yarn.wave.html(trackOrId, { n: 64, played: 0..1 }) · Yarn.wave.svg(trackOrValues, { n }) · Yarn.wave.values(trackOrId, n) · Yarn.wave.key(track)
Yarn.EQ                                                               // three red bars (.yeq), bounce under .is-playing
```
One record for the player's collapsed FAB (`kit/player.js` uses `.ydisc__rec`), Thoughts playlists and Studio. The waveform is seeded by the track (`id`, or the url → `<folder>_<file>`), so the player's scrub, Studio's upload and its preview draw the same bars; `--f` on any ancestor = played part (red). `--wave-fg` recolors the unplayed bars (e.g. white on a swatch).

## 19b · Player (`kit/player.js`, `<yarn-player>`, i4)
```js
YarnPlayer.play(track, queue?) · toggle() · pause() · next() · prev() · seek(sec) · setVolume(0..1) · setMuted(bool) · setShuffle(on?)
YarnPlayer.expand() · collapse() · minimize() · show() · setView("disc"|"bar"|"panel") · view · state · on(fn(state, kind)) → off
// i4 queue API (Music's "add to queue"): a track already waiting moves instead of doubling; nothing playing → it starts
YarnPlayer.enqueue(track) · playNext(track) · remove(track | index) · has(track) → bool (upcoming only) · queue → upcoming tracks
```
`track` = a library id (`"vgm-class_combat"`), an audio url, a track name, or `{ name, url, … }`. Every queue change emits `kind: "queue"` (and `window` `"yarnplayer"`), so an "In queue" state on a card can follow `YarnPlayer.has(t)`; enqueue / playNext announce "… added to the queue" / "… plays next" to screen readers. API and events are unchanged from i3 apart from these additions.
**Views.** Desktop: bar at the bottom (who · scrub · ⏮ ▶ ⏭ · volume, always out · ⌃ · disc); the open panel is one grid: a fixed 168px art top-left, the title on the art's top line (wraps to 2 lines, 3 smaller ones when long, then clamps; the full name is its `title`), sub · meta · links under it, notes under a rule; the queue in the right column with its header on the art's top line; the bar (controls) below the seam. Phones (round 2 = i3's player + these): the disc rests at the right end of the row; the bar unrolls out of it into the slot 8px above the nav, fully visible and over it in z (§ 21; shell and disc hang from the screen's bottom edge, like the nav) with who · ⏮ · ▶ · ⏭ · mute · disc, dropping mute then ⏮ when the bar is narrower than 356 / 300px; the open page reads art + song data + notes · rule · scrub · queue, with ⌄ and mute in its sticky header and ⇄ ⏮ ▶ ⏭ ↻ pinned below (▶ on the centre line). Drag: bar up → page; bar down or sideways → disc; page down → bar; page **diagonally** down → all the way to the disc. No filler text: a single has no sub line, the queue's current row has no "Playing now / Paused", tracks without notes have no notes section.
Review URLs: `?demo` · `?player=disc|bar|panel` · `?pdrag=bar-up|bar-right|bar-down|disc-up|disc-left|panel-down|panel-diag&pp=0..1` · `?demo=<id|name>` (e.g. `demo=stalking lowercase letters in alphabet city` for a long title).

## 20 · Thoughts post cards (`kit/posts.js`)
```js
Yarn.post(post, { scratch: "sticky"|"felt", tagsAs: "a"|"button", pressed: Set, tl: "owner"|"everyone", inert, collections, collCount, href: { article, collection, tier } })
Yarn.post.configure(ctx) · Yarn.post.TYPES / TYPE · Yarn.post.typeBadge(key) · Yarn.post.aggregate(p, vote) · crowdTiers · miniBoard(p, mode)
Yarn.post.swatch(key)   // i1's type swatch: scratch · article · pick · tierlist · playlist · embed · "all"
Yarn.post.NOTE_COLORS · Yarn.post.STUB_COLORS   // [key, label, hex]; the first is the default
```
**i3:** the meta row is a **caps kicker** (`.ypost__kick`: ALL-CAPS type + light mono subtext, the circled icon kept; `?kicker=plain` = i2), which keeps its label on phones. **i4:** no "·" between the caps type and its subtext; the playlist card's "Now playing / Paused" line is screen-reader only; the type swatches for Scratch (a sticky note with tape) and Images (two photos) were redrawn.
**Custom tier names (i4):** a ranking may carry `tierDefs: [{ id, label, color }]` (best first, any count, any length; `color` from `Yarn.post.TIER_COLORS`: red · orange · gold · sage · sky · teal · lilac · pink · ink · cotton), with `tiers`, votes and `community` keyed by those ids (a rename keeps the votes). Without it the keys of `tiers` are the labels (S–D). `Yarn.post.tierDefs(p)` normalises both. Every label ≤ 3 characters keeps the square felt keys; any longer label makes the board **named**: each row wears its label as a felt tab sewn on top of the row (the tray takes a breath of the tier colour), on the card, the ranking page and Studio's editor alike. Felts: `[data-tc="<key>"]` → `--tc` (S–D map onto red…sky). **Owner colours:** `p.color` on a scratch = its sticky note (`data-note`: canary · pink · mint · sky · orange · lilac), on a pick = its tag stub (`data-stub`: tan (darker, default) · red · ink · blue · green · gold); `?colors=default` previews everything in the default. Studio's Scratch / Pick editors set them. The sticky note is a touch flatter, its tape a little more visible. `ctx.here = <collection key>`: on that collection's page a pick links to its post ("See the post") instead of back. `tierlist` is shown as **Ranking / Rankings** (key unchanged).
`article.ypost.ypost--<type>`: scratch (sticky note / felt), article (bookmark), pick (hang tag on red yarn → its collection with `&item=`), ranking (mini felt board), playlist (`Yarn.disc` + swatch rows, `.ypost__track[data-pl][data-i]`), images (photo grid; the title, `[data-lbopen]`, opens the first image). The Thoughts page configures storage-backed votes/comments; Studio passes its own collections and `inert: true` (preview links lead nowhere). Tier felts: `--tier-S … --tier-D`, `[data-tier]` → `--tc`, `.ytierkey`.

## 21 · FAB ⇄ slot (i4 round 2) + the phone bottom chrome + the z-index scale
```js
const f = Yarn.fab({ icon: "ph-magnifying-glass", label, title, lift, owner: "search" })
// { el, btn, panel, body, float, open({ instant }), close({ instant, focus }), isOpen, badge(n, aria), count(text), away(on), destroy() }
Yarn.slot.owner · Yarn.slot.claim(owner) · Yarn.slot.release(owner)   // html[data-yslot]; window "yarn:slot" { owner }
```
**Round 2 (owner: "revert to what v3 used for the player … build the search experience off of that"):** iteration 3's phone player is back, and search is built on the same mechanics. Nothing tucks under the nav any more. **One system on phones, measured up from the nav's top edge** `--ynav-top` (= `--nav-bottom` + the safe area; the nav sets `--nav-bottom` per `?mnav`, 0 when it takes no strip). Tokens: `--yslot-h: 64px`, `--yslot-gap: 8px`, `--yslot-side` (frame + 8px), and the derived `--yslot-b` (the slot's lower edge), `--yslot-mid` (its centre line), `--yup-b` (the up line). `--yslot-tuck` is 0 (kept for old readers). kit/player.js reads `--yslot-b` / `--ynav-top` live through a probe (a ResizeObserver re-measures whenever the nav changes them), so it never hard-codes a nav height.
- **slot**: the strip `--yslot-gap` *above* the nav (i3's player bar), over it in z. Whichever FAB is open fills it: the player's bar, or the search bar. Opening one gives the other a `yarn:slot` event: the bar folds into its disc, the search folds into its knob.
- **row** = the slot's centre line. Closed FABs rest on it: the disc at the right end (`html.y-disc` while it shows; `?discat=nav` = i3's spot over the nav's top-right corner), the search knob left of it (or at the right end with no player). `?mnav=spool` rests its pill at the left end.
- **up**: the line above the slot. The FAB that isn't open waits there at the right end, 44px; the search's chip row floats on it while search is open (it stops short of the small disc).
**The search FAB = a disc for search.** A quiet white knit knob (52px, dashed stitch, ink icon centred to < 0.5px: the red count badge is out of flow). Tap: the search bar unrolls into the slot out of the knob the way the player's bar unrolls out of the disc: one spring (interruptible, a second tap turns it around from where it is), the cloth clipped from the knob's circle to the slot with the player's shade and stitch following the clip, the knob riding to the bar's right end where it turns into ⌄ (tap = fold back). Drag the bar right or down (or down on the field) to fold it, finger-tracked with a velocity hand-off. Only `f.body` (the search line) is in the bar; `f.float` (listTools' filter row) floats on the up line, **All** turning into a **✕** that clears every filter. Suggestions and Browse open upward (search z is above the disc, so they cover it). Esc, outside tap and the on-screen keyboard (the bar, knob and chips ride up onto it) are handled; `count(text)` is read out, not shown. While search is open `html[data-yslot="search"]` raises `--bottom-ui` over the bar + chips (the player overrides it inline when a track exists, counting the small disc). `f.el.hidden` shows/hides it; `destroy()` removes it and its listeners.

**Z-INDEX SCALE** (tokens in `kit/yarn.css` `:root`, a comment table there; use a token for anything that can meet the nav, never a raw number):

| token | z | layer |
|---|---|---|
| (page band) | 0–49 | cards, year pills (6), sticky filter row (28), search line (30/42), detail bars (20), Home's cursor lane (40): they scroll under the nav and the chrome |
| `--z-nav` | 50 | the mobile nav in every `?mnav` (bar, top strip, spool) |
| `--z-chrome` | 60 | the player's bar + disc (`yarn-player` makes no stacking context); Thoughts' reading-progress bar |
| `--z-search` | 62 | the search knob, its bar in the slot, the chip row (+ the suggestions and Browse inside them) |
| `--z-pop-low` / `--z-pop` | 69 / 70 | popovers: Music's long-press menu + folder-tab tips, Home's "Press unmute" callout (its ring 69), an open Browse / suggestions in the top-bar search (`?msearch=bar`) |
| `--z-scrim` / `--z-sheet` | 79 / 80 | the player's full page on phones (`.yp.is-sheet` while it's open or opening) |
| `--z-toast` | 90 | toasts ("added to the queue"), readable over the open player |
| `--z-transition` · `--z-drag` · `--z-dev` · `--z-modal` · `--z-skip` | 9000 · 9500 · 9999 · 10000 · 10001 | section cloth · a dragged tier item · ⚙ panel · lightbox + its controls · skip link |

Proof (i4 round 2): every layer above scripted open at 390 and 360 over every `?mnav`, `document.elementFromPoint` at its inset corners + centre lands inside the layer (`/Users/blaqat/dev/temp/r3i4-mobile/audit.js`).

## 22 · Prose
`.ydetail__text` styles markdown: headings, lists with red yarn bullets (class-less `ul`/`ol` only: tags, stack, picks, tier rows keep their own look), quotes on a knit patch with a red twill edge, inline code, felt code blocks, tables, rules, images. Add `.yprose` for the reading size (articles: bigger type, `h2` with a red stitched rule). Thoughts articles, project summaries, music notes and Studio's previews all use it.

## 23 · Small parts
`.btn:disabled` / `[aria-disabled=true]` (flat, quiet, readable) · `.btn--m-icon` (label on desktop, icon-only on phones; keep an `aria-label`) · `.btn--sm` gets a 44px hit area on touch (icon-only `.btn--sm` grows to 44px) · every control reaches 44px on `(pointer: coarse)`, player and lightbox included · chips with `role="radio"|"option"` never show the remove strike · `Yarn.px("--bottom-ui", el?)` reads a length token (often a `calc()` string) as a number · `[data-section="studio"]` = ink cord frame.

Not in the kit (Studio-only until another page needs them): form fields (`.st-in`, `.st-ta`, `.st-select`, toggles, choice pills), sheet + toast, storage meter, upload progress, tier creator, media library tiles.

## 23b · Strand (`Yarn.strand`, i3)
```js
const s = Yarn.strand(host, items, { date, label, key, href, caption: "Strung together from the feed", min: 34 })   // { el, layout(), select(key) }
host.addEventListener("ystrand", (e) => e.detail.key)
```
i1's horizontal "strung together" timeline: points sit on a red yarn at their real dates (distance = time, with a minimum gap so close dates stay apart), month ticks above, and a label that would collide drops to a second lane on a dashed leader. Re-lays out on resize. A click / Enter dispatches `ystrand`; `select(key)` marks one (`aria-current`). Thoughts' collection page scrolls to + ropes the card.

## 23c · Motion (`Yarn.motion`, i3)
One table for every opening (flip, Browse sheet, lightbox, section cover + reveal, Projects panel, Music dock): `Yarn.motion.{ flip, enter, exitMs, stagger, sheet, lbK, lbChrome, panel, cover, reveal, contentMs, contentDelay, extrasAt, fontWait, dock }`. i3: motion starts at once, nothing waits on a fade, springs a little quicker; `?motion=i2` restores iteration 2's numbers. Paint rules learned in i3: no `filter: drop-shadow` on a layer whose content changes every frame (the player now draws its shadow as a box on `.yp-shade`), and no per-frame `zoom` (Music's dock scales with a transform and sets zoom once at rest).

## 24 · Options panel
```js
Yarn.mockPanel([{ label, param, options: [[value, label], …], default }], { title })
```
One ⚙ panel per page: your groups under "This page", kit groups (Toggles, Single choice, Detail pages, Motion timing, Rope, Body font, Background, Mobile search, Mobile nav, Motion) under "Kit". Pages that show post cards also list `?kicker` and `?colors` (posts.js reads them). Pages that never call it still get the kit groups. Option value `""` removes the param.

## 25 · Also available
`.btn` (+ `--red --ink --sec --ghost --sm --icon`), `.ychip`, `.ycard`, `.yrow`, `.ysecbtn`, `.ydot`, `.patch`, materials (`.m-knit .m-diamond .m-cord .m-ribbon .m-felt .m-corduroy .m-cork`), `Yarn.Spring` (response/damping, interruptible), `Yarn.springEasing({response})` → `{ easing: "linear(…)", duration }` for WAAPI/CSS, `Yarn.watchStuck(el)`, `Yarn.sound(name)` (= `YarnSound?.play`), `Yarn.catSVG()`, `Yarn.esc/slug/hash/rng`. The kit plays `tap` for `.btn`, nav tabs, segmented buttons, link icons and back buttons: don't play it again.
Legacy iteration-1 classes (`.chip`, `.tag`, `.rope.is-roped`) still render but are not the kit look; rebuild with the parts above.
