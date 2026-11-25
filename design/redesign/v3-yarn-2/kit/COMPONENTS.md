# Yarn kit · components (iteration 2)

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
| `sel` | `rope` · `ink` | selected = red rope ring, or black twill fill |
| `rope` | `in` · `out` | `in` = the rope sits ON the element's own edge with its own radius (it becomes the outline; no inset, no rim outside). `out` = a ring around it with a small gap |
| `body` | `nunito-sans` · `figtree` · `atkinson` · `system` | body font |
| `bg` | `intarsia` · `jersey` · `quilt` · `speckle` · `current` | sheet background; sets `<html data-bg>`, loads `kit/bg/<name>.css` (overrides `--sheet-bg`, `--patch-bg`). See `kit/bg/NOTES.md` |
| `nav` | `corduroy` · `cork` | mobile bar material |
| `reduced` | `1` | reduced motion (also `prefers-reduced-motion`) → `html.y-reduced` |
| `from=home`, `trp=0..1` | | play / freeze the arriving sheet reveal |
| `lb=<group>:<i>` | | open the lightbox on load |
| `browse=open` | | open the first filter row's Browse sheet on load |
| `disc` | `swatch` · `cat` | the record's label: the track's yarn swatch, or the red cat (player + `Yarn.disc`) |
| `msearch` | `bar` · `fab` | mobile search + filters on every list page (< 960px), via `Yarn.listTools`: `bar` = top search + sticky filter row; `fab` = a search FAB above the nav that grows into the bottom panel, with the active filters kept as chips at the top of the list. Old `?search=fab|fab-row` maps to `fab`, `search=bar` to `bar` |
| `fab=open` | | open the search FAB on load (msearch=fab) |

## The two rules (apply to rows, cards, chips, tabs, section buttons)

- **Hover** = `.ylift` (rises 2px + soft shadow, `:active` scale .97). Never the rope.
- **Selected** = `.ysel` + `aria-pressed="true"` | `aria-selected="true"` | `aria-current="page|true"` | `.is-selected`. Rope sews in when it becomes selected; ink mode fills black and flips every kit part inside (badges, tags, dates use `--y-fg*` tokens).
- Set `--ysel-r` to the element's radius (chips/rows/cards set it already). Don't put `overflow:hidden` on a `.ysel` (rope-out is drawn outside). Tight spots force the rope inside: `.rope-in` on the element or `.rope-in-all` on a container.
- Focus = dark 3px thread ring (`--focus`), so it never reads as "selected". It always wins: over the stitched outline, over rope-in (which hides the stitch) and over ink fill (kit rule after the selected styles).
- Do: `<button class="yrow ylift ysel" aria-current="true">`. Don't: animate a ring on hover, or invent your own selected color.

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
Yarn.search(el, F, { placeholder: "Search projects…", hint: true })  // returns { el, input, focus() }
```
Full-width line. Free text filters live. A known term becomes a filter on **Enter / Tab / comma** (top suggestion is pre-highlighted; ↑↓ to choose). Terms from a group shown in the chip row light that chip (pulse) instead of making a duplicate token; other groups appear as **tokens** (`.ychip.ytoken`, with icon). Click a token, or **Backspace twice** on an empty field, to remove (first press shows the strike). `/` focuses it. Sounds: `token-add`, `tag-remove`.
Do: put it above the filter row. Don't: build a separate stack-chip row (stack lives in search + Browse). The "/" hint is hidden on touch.

### 4b · List tools: one mobile pattern (`?msearch=bar|fab`)
```js
const T = Yarn.listTools(F, { tools: el, search: searchHost, row: rowHost, sticky: listEl, count: () => "3 of 12 shown", label, title, stickyDesk: false, lift: 0 })
T.fab · T.place() · T.paint() · T.isFab() · T.destroy()
```
Build the search + filter row as usual, then hand both hosts to `listTools`. `bar` (default): they live in `tools` (the `.ytools` box); on phones the row is sticky (`stickyDesk` makes it sticky on desktop too) and `--sticky-top` = its height is set on `sticky`. `fab`, phones only: both move into a `Yarn.fab` (row on top, search near the thumb), the FAB badge counts active filters, and `.yactive` (removable chips + Clear all) sits in `tools` at the top of the list. Re-places itself at the 960px breakpoint; tears itself down when `tools` leaves the DOM. `lift` stacks the FAB above another one.

## 5 · Filter row + Browse
```js
Yarn.filterRow(el, F, { sticky: false, all: "Show all", browse: true, wrap: false, extra: [] })   // { open(), close(), sheet }
```
`[Show all] [row group 1] ┆ [row group 2] …(scrolls)… [⚙ Browse n]`. Browse opens a sheet anchored under the row (grows from the button) with **every** group, stack with devicons, facet counts, Clear all / Done. Esc / outside click closes, focus returns. `sticky: true` pins it (`top: var(--sticky-top)`) and adds `.is-stuck`. Selected chips show a **red strike-through on hover/focus**. Sounds: `chip-on`, `chip-off`, `open`, `close`.
Single chip markup if you need one: `Yarn.chip(F.group("type"), F.info("type","Work"), { pressed })` → `button.ychip.ysel[data-g][data-v]`.
`wrap: true` (`.yfilter--wrap`): the chips wrap onto more lines instead of scrolling (Projects on phones). `extra: [{ label, html }]`: link groups shown in the Browse sheet after the filters (`.ybrowse__links`, a grid; Thoughts puts Collections + project write-ups there).
Do: row = the 1–2 groups people use most. Don't: put stack chips in the row.

## 6 · FLIP filter animation
```js
F.on(() => Yarn.flip(listEl, "[data-key]", () => {
  listEl.querySelectorAll("[data-key]").forEach((el) => (el.hidden = !F.test(byKey[el.dataset.key])));
}));
```
Survivors glide (spring), new ones grow in, leaving ones fade out in place (ghost clones). Works with hide/show or a full re-render (matched by `data-key` → `data-id` → `data-slug` → `id`). Options `{ response: .44, enter, exit, stagger }`. Reduced motion: instant. Zoom-aware: inside a CSS-zoomed list (Music while an item is docked) it divides by `currentCSSZoom`, so items start exactly where they were.
Do: do all layout work (masonry spans etc.) inside the callback. Don't: also run a view transition / fade.

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

## 8 · Year pill + timeline
```js
host.innerHTML = Yarn.timelineHTML(Yarn.byYear(items), (p) => `<button class="yrow ylift ysel" aria-current="false">…</button>`, { key: (p) => Yarn.slug(p.name), unit: "project" });
const tl = Yarn.timeline(host.querySelector(".ytl"), { ball: true, trail: true });
tl.select(keyOrEl) · tl.refresh() · tl.current
Yarn.yearPill(2025, { count, unit, attrs, cls })   // standalone sticky white oval (.yyear); attrs e.g. 'data-key="m:2026-11"' for flip
```
`.yyear` is the one year separator everywhere (timelines, Music's phone list, Thoughts' months, the year rail, Projects' grid where it rides on the first card of each year). On phones a stuck pill gets a cotton band the width of the sheet (`.yyear.is-stuck`), so cards slide under the band instead of colliding with it.
Dashed thread at `--ytl-x`, dashed knots per item, sticky year pills on the thread (`top: var(--sticky-top)+10px`), a red yarn ball that rolls (spring) to the selected item and leaves a red strand. Set `aria-current` on your row yourself. `ball:false` for Thoughts mobile.
The ball follows layout changes under it (fonts landing, images, filtering): mid-roll it retargets the same spring instead of settling on the stale spot. `Yarn.timelineHTML(…, { cls: "ytl--sm" })` = small knots and pills (activity feeds).
Do: call `tl.select()` when an item opens and `tl.refresh()` after filtering. Don't: put `overflow:hidden` on `.ytl`.

## 9 · Lightbox (`kit/lightbox.js`)
Zero JS: any element with `data-ylb="<group>"` opens the group (all `[data-ylb=<group>]` in DOM order); `data-src`, `data-alt`, `data-kind="image|video"`; title from closest `[data-ylb-title]`. `Yarn.carousel` emits this.
```js
Yarn.lightbox.open({ items: [{ src, alt, kind }], index, title, thumbs: (i) => el }, { instant })
Yarn.lightbox.openGroup("group", i) · Yarn.lightbox.close() · Yarn.lightbox.isOpen
```
Opens from the thumbnail, closes into it (thumb hidden meanwhile: `.is-lb-source`). Drag down to dismiss, swipe/←→ to page, Esc, focus trap, "n / m", caption. Video: muted by default, controls under it (play/pause, time, scrub, mute), Space/K, M, Shift+←/→. Sounds `lightbox-open/close`, `play/pause`.
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
Yarn.detail({ back: { href, label } | { label } (button[data-back]), actions, title, meta, media, body, links, level, wide })
```
`article.ydetail > .ydetail__top(sticky: back · compact title · actions) + header.ydetail__head(title + meta) + .ydetail__body(media + .ydetail__text) + footer.ydetail__foot(sticky: .ydetail__bar)`. Order: title → metadata → media → text → links. Large-title pattern: the sticky bar shows the title once the big one scrolls under it (`.ydetail__top.is-stuck`), so the head never changes height (no jump) and stays short on phones; the foot gets `.is-stuck` when floating. Auto-wired, also inside a scrolling panel. Foot sits above `--bottom-ui`. `wide: true` lets the text use the full width (boards, previews) instead of the 68ch measure. The body grid is `minmax(0, 1fr)`, so a long code line scrolls inside its block. Prose links in `.ydetail__text` are red; kit parts in a body (`.ytag`, `.ystk`, `.btn`, `.ylinkicon`) keep their own colors.
**Detail page skeleton:** `Yarn.detailPage(Yarn.detail({ … level: 1 }), { rail, wide, railLabel })` → `.ydpage > .ydpage__main + aside.ydpage__rail`. One reading column (`--ydetail-w: 760px`) at the same x on every detail page (the rail column, `--ydetail-rail: 220px`, is reserved even when empty), `wide` spans column + rail (tier board). One top-bar offset/height (10px / 70px), one foot height (`.ydetail__bar` 60px), body text ink at 16px (`.yprose` keeps 17px for articles). Top actions are `.ylinkicon` (44px). A level-1 detail is `.ydetail--page`: on phones, while its links bar floats, `html.y-navaway` hides the nav bar (Back is in the top bar) and the bar drops to the nav's place; the player's disc and bar anchor above it (`yarn:bottomchrome` event).
`Yarn.linkIcon(kind, href, label?, { sm })` for round icon links: github · soundcloud · youtube · beepbox (the original site's duotone circle, `.yduo`) · spotify · instagram · x · discord · email · view · link. `sm` = 32px (dense rows; 44px hit area on touch). Non-http hrefs open in place.
Do: `meta: Yarn.meta(p, { dur: true }) + Yarn.stack(p.stack)`. Don't: repeat the title in the body.

## 12 · Navigation
`<yarn-nav active="home|projects|music|thoughts" base="../">` (re-renders if `active` changes). Desktop: brand left, raised knit tabs with section-color felt dots (`.ydot`), current tab = selected rule, plus a hidden `button[data-sound-toggle]` (kit/sound.js unhides it). Mobile (<960px): corduroy bottom bar Home / Projects / Music / Thoughts + sound slot; current = cream patch with the rope (or ink felt).
`--nav-bottom` (80px on mobile, 0 desktop) and `--bottom-ui` (= nav + player; the player may override on `<html>`): pad fixed/sticky bottoms with `var(--bottom-ui)`. `.sheet` already pads for it.
Another page list (Studio): `Yarn.navHTML({ active, pages: [{ key, label, href, icon, section?, tab?, bar? }], brand: { href, label }, badge, extra, label })` returns both bars' markup; or set `navEl.config = { pages, … }` on a `<yarn-nav>`. `tab: false` = mobile bar only, `bar: false` = desktop only; `section` dyes the felt dot (`studio` = ink).
The nav renders the page's **skip link** (`.yskip`, first Tab stop → the first `.ypage`); pages don't add their own.
Do: Home passes `active="home"` (no separate home nav on mobile). Don't: render your own tab bar.

## 13 · Section transition
```js
Yarn.transition.go(buttonEl, href, "music")   // or <a data-transition="music" href="…">
Yarn.transition.cancel()                     // Esc does this
```
Leaving: a cord cloth in the target section's color grows out of the button on one critically damped spring and navigates as soon as the screen is covered (≈0.4 s). Arriving (`from=home` or the session flag): `html.yt-enter` holds the page behind its cord; the white sheet grows open from the same spot while content fades in under it; fixed UI (player, bar) fades in after. Reduced motion: fades. Failsafe un-hides after 3 s. Sounds `cloth`, `unroll`.
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

## 20 · Thoughts post cards (`kit/posts.js`)
```js
Yarn.post(post, { scratch: "sticky"|"felt", tagsAs: "a"|"button", pressed: Set, tl: "owner"|"everyone", inert, collections, collCount, href: { article, collection, tier } })
Yarn.post.configure(ctx) · Yarn.post.TYPES / TYPE · Yarn.post.typeBadge(key) · Yarn.post.aggregate(p, vote) · crowdTiers · miniBoard(p, mode)
```
`article.ypost.ypost--<type>`: scratch (sticky note / felt), article (bookmark), pick (hang tag on red yarn → its collection with `&item=`), tier list (mini felt board), playlist (`Yarn.disc` + swatch rows, `.ypost__track[data-pl][data-i]`), images (photo grid; the title, `[data-lbopen]`, opens the first image). The Thoughts page configures storage-backed votes/comments; Studio passes its own collections and `inert: true` (preview links lead nowhere). Tier felts: `--tier-S … --tier-D`, `[data-tier]` → `--tc`, `.ytierkey`.

## 21 · FAB → bottom panel
```js
const f = Yarn.fab({ icon: "ph-magnifying-glass", label, title })   // { el, btn, panel, body, open(), close({ focus }), isOpen, badge(n, aria), count(text), away(on) }
```
A red round button above the mobile nav (overlapping it a little; above the player's disc when one shows; `{ lift }` px higher to stack above another FAB) that grows into a full-width panel with a circle reveal from the button and shrinks back into it. Put a search line / filter row in `f.body`; suggestions and Browse open upward. Esc, outside tap, Done and the on-screen keyboard are handled. `f.el.hidden` shows/hides it (Projects: phones only).

## 22 · Prose
`.ydetail__text` styles markdown: headings, lists with red yarn bullets (class-less `ul`/`ol` only: tags, stack, picks, tier rows keep their own look), quotes on a knit patch with a red twill edge, inline code, felt code blocks, tables, rules, images. Add `.yprose` for the reading size (articles: bigger type, `h2` with a red stitched rule). Thoughts articles, project summaries, music notes and Studio's previews all use it.

## 23 · Small parts
`.btn:disabled` / `[aria-disabled=true]` (flat, quiet, readable) · `.btn--m-icon` (label on desktop, icon-only on phones; keep an `aria-label`) · `.btn--sm` gets a 44px hit area on touch (icon-only `.btn--sm` grows to 44px) · every control reaches 44px on `(pointer: coarse)`, player and lightbox included · chips with `role="radio"|"option"` never show the remove strike · `Yarn.px("--bottom-ui", el?)` reads a length token (often a `calc()` string) as a number · `[data-section="studio"]` = ink cord frame.

Not in the kit (Studio-only until another page needs them): form fields (`.st-in`, `.st-ta`, `.st-select`, toggles, choice pills), sheet + toast, storage meter, upload progress, tier creator, media library tiles.

## 24 · Options panel
```js
Yarn.mockPanel([{ label, param, options: [[value, label], …], default }], { title })
```
One ⚙ panel per page: your groups under "This page", kit groups (Selected style, Rope, Body font, Background, Mobile search, Mobile nav, Motion) under "Kit". Pages that never call it still get the kit groups. Option value `""` removes the param.

## 25 · Also available
`.btn` (+ `--red --ink --sec --ghost --sm --icon`), `.ychip`, `.ycard`, `.yrow`, `.ysecbtn`, `.ydot`, `.patch`, materials (`.m-knit .m-diamond .m-cord .m-ribbon .m-felt .m-corduroy .m-cork`), `Yarn.Spring` (response/damping, interruptible), `Yarn.springEasing({response})` → `{ easing: "linear(…)", duration }` for WAAPI/CSS, `Yarn.watchStuck(el)`, `Yarn.sound(name)` (= `YarnSound?.play`), `Yarn.catSVG()`, `Yarn.esc/slug/hash/rng`. The kit plays `tap` for `.btn`, nav tabs, segmented buttons, link icons and back buttons: don't play it again.
Legacy iteration-1 classes (`.chip`, `.tag`, `.rope.is-roped`) still render but are not the kit look; rebuild with the parts above.
