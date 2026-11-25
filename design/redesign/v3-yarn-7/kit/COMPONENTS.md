# Yarn kit · components (the finished reference, i7)

The shared parts of blaqat.net round 3 "Yarn" (black / red / white, textile; static HTML/CSS/JS, no build step). This file describes the **decided** look and API only, in the same order as `kit/components.html` (see every part live, in every state). Nothing cut or superseded is described here; the ⚙ panel's **Earlier options** still switch old looks on the real pages for comparison, and their params are listed once, in § Kit params. History (how each decision was reached, every iteration's notes and measurements): `kit/_history/COMPONENTS-i3-to-i7-wave1.md` and `../v3-yarn-*/kit/COMPONENTS.md`. Reuse audit (what each page uses, what stays page-specific and why): `kit/REUSE-i7.md`.

**One rule for pages:** page CSS may position and lay out kit parts, never restyle them. A page that needs something the kit lacks adds the smallest local extension marked `/* KIT-CANDIDATE: … */`; once a second page needs it, it moves into the kit.

## Include (every page)

```html
<html lang="en" data-section="projects">   <!-- home | projects | music | thoughts | studio: the frame colour -->
<head>
  <link rel="stylesheet" href="../kit/yarn.css">
  <script src="../kit/data.js"></script>
  <script src="../kit/thoughts-data.js"></script>   <!-- only where needed -->
  <script src="../kit/yarn.js"></script>            <!-- NO defer: sets kit options + the transition gate before first paint -->
  <script src="../kit/player.js" defer></script>    <!-- pages with the player; plus <yarn-player></yarn-player> in body -->
  <script src="your-page.js" defer></script>
</head>
<body class="frame"><main class="sheet"><yarn-nav active="projects" base="../"></yarn-nav><div class="ypage"> … </div></main></body>
```
`yarn.js` loads `swatch.js`, `lightbox.js`, `posts.js` and `review.js` synchronously right after itself and `sound.js` async. `Yarn.ready` resolves once the DOM is ready.

---

# Foundations

## 1 · Colour
Tokens on `:root` in `kit/yarn.css` (hex values on the components page are read live).
- **Base:** `--ink #1f1e1e` · `--ink-2` (secondary, 7.9:1 on cotton) · `--ink-3` (meta, ≥ 4.9:1 on every light surface) · `--cotton #fbf8f3` (the sheet) · `--cotton-2` (recessed) · `--white` · `--red #d62f38` (fills, rope) · `--red-deep` (red text on white, 5.9:1) · `--red-soft` (tints, focus halo) · `--red-hi` (red on ink) · `--tog-red` (a step under red).
- **Sections** dye only the cord frame (`data-section` sets `--sec`): `--blue` projects · `--purple` music · `--gold` thoughts · `--brown` home · ink studio; each with `-deep` / `-soft`. Accents stay red.
- **Content colours** ride in discs and fills, never in text: project types `--pt-personal #5eb0e5` · `--pt-work #f2c230` · `--pt-school #f39a52` (ink on all three, ≥ 6.98:1; `-soft` for hover washes, `-deep` for glyphs) · instruments `--inst-piano` · `--inst-beepbox` · `--inst-daw` (white on all three) · tiers `--tier-S … --tier-D` (`[data-tier]` / `[data-tc]` → `--tc`).
- **Surface-aware text:** `--y-fg`, `--y-fg-2`, `--y-fg-3`, `--y-chip` (the in-card match chip), `--y-line`, `--y-strike`. `.on-ink` on any dark surface flips them, so every kit part inside works on ink (facts' ink discs turn white there).

## 2 · Type
Nunito (display, 850–900: titles, chips, buttons, facts) · Nunito Sans (body 16px / 1.55) · Maple Mono (`.meta`: dates, counts, durations, tabular). Tokens `--font-display`, `--font-body`, `--font-mono`; classes `.h1 .h2 .h3 .eyebrow .meta .muted .sr-only`. Never hard-code a family.
**Page header:** `Yarn.header({ title, meta?, actions?, level? })` → `.yhead` (2.75rem, 2.1rem on phones, red period). One per page; no lede under it. Page content goes in `.ypage` (40px gutters, 14px on phones, bottom room for `--bottom-ui`).

## 3 · Textures + depth
Every surface is cloth, as data-URI tiles painted once: `--tex-knit` (cards, fields, buttons on white) · `--tex-twill` (red and ink fills) · `--tex-felt` (discs, tiers, the record) · `--tex-cord` (the frame, in `--sec`) · `--tex-diamond` + the jersey `--sheet-bg` (the sheet; `kit/bg/jersey.css`). Classes `.m-knit .m-diamond .m-cord .m-ribbon .m-felt`. Cards build on `.ycard` / `.patch` (`--patch-bg`) so a background can restyle them.
Shadows `--shadow-patch` (rest) · `--shadow-lift` (hover) · `--shadow-pop` (popovers). Radii `--radius-card 16` · `--radius-sheet 22` · `--radius-pill`. The dashed stitch: 1.5–2px, 5–7px in.

## 4 · The interaction rules (rows, cards, chips, tabs, buttons)
- **Hover lifts** (`.ylift`: up 2px + `--shadow-lift`, `:active` .97). Never the rope. A hovered thing comes to the front (z 3), so nothing covers its shadow; a scrolling / clipping container pads for it. A lifted card keeps its hover while the pointer is anywhere over its lifted or at-rest box (no edge flicker).
- **Toggles fill** (multi-select: `.ysel.ytog` + `aria-pressed="true"`): the red twill. A selected toggle shows the red strike on hover / focus (a tap clears it). `Yarn.chip` and `Yarn.tag(…, { as: "button" })` add `.ytog`.
- **Single choices rope** (`.ysel` + `aria-current` / `aria-selected` / `.is-selected`): the red rope sewn flush on the element's own edge and radius (`--ysel-r`). Don't put `overflow: hidden` on a `.ysel`.
- **Focus** = a dark 3px thread ring (`--focus`), keys only: after a tap or click (`html[data-yinput="pointer"]`) it's clear; the first key press brings it back. Text fields always keep theirs.
- **Press depth:** pressing a control inside a lifting card presses only that control; the card presses for its own stretched opener (`[data-ylift-own]`).
- **In-card match:** a tag, fact or chip inside an item that matches the active filter or search = `color: var(--y-fg); background: var(--y-chip)` (`.is-match`, or a pressed `.ytag`).
- Showcase-only state classes mirror the pseudo-classes: `.is-hover`, `.is-focus`, `.is-active` (components.html).

---

# Components

## 5 · Buttons + link icons
- `.btn` (44px pill, knit, dashed stitch) + `--red` (primary: Play all, Visit site, Publish, New…) · `--ink` · `--ghost` · `--sm` (36px; 44px hit area on touch) · `--icon` (round) · `--m-icon` (label on desktop, icon-only on phones; keep an `aria-label`). Disabled (`:disabled` / `aria-disabled="true"`): flat, .5, no lift.
- **An item's link row:** `Yarn.dlink({ href, label, icon, kind, primary, cls, attrs })` → `.btn.btn--d` (40px). The first is the red primary; known sites get `data-brand` + `.btn--brand` and drop to icon-only past three links.
- **Round icon links:** `Yarn.linkIcon(kind, href, label?, { sm })` → `.ylinkicon` (44px; `sm` 32px with a 44px touch target). Kinds: github · soundcloud · youtube · beepbox · spotify · instagram · x · discord · linkedin · twitch · email · view · link. A known site fades to its colour on hover / focus (`Yarn.brandOf(href, kind)`, white ≥ 4.5:1 on every fill); a page's own `a.btn` to a known site gets its brand on first hover.
- **Copy link:** `Yarn.copyBtn(text, { label, sm, cls, attrs })` → `button.ylinkicon[data-copy]` (`text` "" = the page's URL when pressed). One kit listener copies (clipboard, else a textarea + execCommand), swaps the icon to ✓ (a broken link on failure), says "Link copied" / hint "Copied" for 1.6s, sound `copy`. `Yarn.copy(text, btn?)` → `Promise<boolean>` for a page's own trigger (Music's menu). Don't add a page listener for `[data-copy]`.
- `.ylinkbtn`: a text-only action inside a sentence.
The kit plays `tap` for `.btn`, nav tabs, segments, link icons and Back; don't play it again.

## 6 · Chips
- `Yarn.chip(group, valueInfo, { pressed, count, cls, attrs })` → `button.ychip.ysel.ytog[data-g][data-v][aria-pressed]` (icon + `.ychip__l` + optional `.ychip__c`). Rest = knit pill · hover lifts · pressed = the red twill · pressed + hover = the strike · `.is-zero` = the filter would find nothing (quiet).
- Type chips (`data-g="type"`) fill with their type colour (ink text); instrument chips with their instrument colour; both wash their `-soft` on hover.
- **All** (`[data-all]`) is a 40px circle, pressed while nothing is filtered; the floating phone row's ✕ is the same circle.
- `.ychip--row`: a full-width list row (a rail's types: `Yarn.post.swatch(key)` + label + count).
- `role="radio"` / `role="option"` chips (single choices in forms) never show the strike.
- `.ytoken`: a search token (roped chip with its icon; a click or ⌫ twice removes it).

## 7 · Tags
- **Topic hashtags:** `Yarn.tag(t, { as: "a"|"button"|"span", pressed, href })`, `Yarn.tags(list, { as, pressed: Set, max, tag: "ul"|"span", cls })`. `a` → Thoughts filtered by it (`Yarn.tagHref`); `button` → a filter toggle (`.ytog`, pressed = the in-card match look, strike on hover); `span` → **display-only** (`.ytag.is-static`): for tags inside something that opens (a timeline row, a Studio row). Quiet text at rest, hover lifts onto the chip, `#` wiggles.
- **Stack tags:** `Yarn.stackTags(list, { as: "button"|"a"|"span", pressed: Set, match: Set, href, max, label, tag })` → `ul.ytags.ytags--stk > li > .ytag.ytag--stk` (the hashtag with the stack's icon for its `#`). `button` gets `data-yf="stack:<name>"` (the kit toggles the page filter; a second tap clears). `max` folds the rest into a quiet `+n`. `match` = a typed-search hit (`.is-match`). Display-only ones keep `.is-on` (an active filter) and `.is-match`. `Yarn.stackChips(list, opts)` is the same thing for an opened item (`as: "li"` = display-only).
- **Display-only rule (P1):** `.is-static` = no lift, no press, no strike, no wiggle, the container's cursor; a click is a click on what holds it.
- **Stack icons:** `Yarn.stackIcon(name)` → `<i class="ystk-ic">` (a CSS-mask glyph): the colour logo on white surfaces, the one-colour glyph on filled / ink / `.on-tint` surfaces (set `--ystk-on` on a new filled surface). `Yarn.devicon(name)` · `Yarn.DEVICONS`. Sources: `research/STACK-ICONS.md`.

## 8 · Facts + card meta
One face for every fact: a disc `.yfact__i` (`--fact-d` 22px, colour `--fact-c`, glyph `--fact-on`) + a label (`750 .8rem` display).
```js
Yarn.fact.status(s, o) · .type(t, o) · .instrument(i, o) · .date(item, { dur }) · .text(phIcon, label, o)
Yarn.fact.statusDate(item, { dur, word })   // "Completed Dec 2024" · "WIP since Sep 2025" · "Paused, started Jun 2024"
Yarn.fact.pub(state, { compact, text })     // Studio's publish state: live (ink) · changed (red) · draft (dashed) · hidden (grey)
// o: { cls, attrs, title, sub, hint }   cls "yfact--icon" = disc only (the label stays for screen readers; hint names it)
```
Status vocabulary (`Yarn.status`): WIP (key `ongoing`; gold disc, ink hammer: the same mark as the player's WIP label) · Complete (ink, check) · Paused (grey) · Dropped (red felt disc, trash can: the red Ongoing used to wear). A matched fact (`.is-match`) wears the match chip starting at its disc's edge.
**Card meta** (cards, rows, phone rows): `Yarn.cardMeta(item, { parts, compact, dur, match: { type, instrument, status }, icons, statusdate, cls })` → `div.ymeta.ymeta--facts` of facts, each with `data-mk` so a page can toggle `.is-match` while filtering. Order **type · status · date**; ongoing = the icon-only gold WIP disc; the date has no disc and closes up to the status. `compact` (phones): the type keeps its word, the status is its disc. Music cards pass `parts: ["status", "date"]` (the swatch says the instrument). `Yarn.fitFacts(el, { max })` keeps a list's facts on one line (status word → short year range → type word).

## 9 · Search + fields
- `Yarn.search(el, F, { placeholder, hint, tokens })` → `{ el, input, focus(), refresh() }`: the full-width line (52px, knit, dashed stitch). Free text filters live; a known term becomes a token on Enter / Tab / comma (the top suggestion is pre-highlighted, ↑↓ to choose); a term whose group is in the chip row pulses that chip instead. ⌫ twice on an empty field removes a token; `/` focuses it. Focus = the solid red edge + `--red-soft` halo.
- `.yfield` on an `input`, `textarea` or `select`: the same cloth for any text field (Studio's forms, the tag finder). Focus = red edge + halo (never the rope) · `aria-invalid="true"` = the deep red edge · disabled .5 · `textarea.yfield` 120px, resizes · `select.yfield` with the kit caret · `.yfield--sm` = a 40px pill (pad its left for an icon).

## 10 · Pills + year marks
- `Yarn.yearPill(label, { count, unit, attrs, cls, rule, level })` → `.yyear`, the one separator everywhere (timelines, year groups, months). Sticky on its thread; `rule: true` adds the dashed line across its column (it steps away while stuck).
- `Yarn.seg([{ value, label, icon }], { value, label, name })` → `.yseg` (single choice, roped); listen for `ychange` (`detail.value`).
- **About / write-up pills** (`kit/posts.js`): `Yarn.post.aboutPill(ref, ctx)` ("about · Sonata" on a write-up) and `Yarn.post.writeupPill(list, ctx, { short: true })` ("Write-up · 4 min" on the thing): one `.yabout` pill, both directions, `.ylift`, 44px on touch.

## 11 · Toast · hint · empty state
- **Toast:** `Yarn.toast({ icon, html, undo, action, ms = 3400 })` → `{ el, hide() }` · `Yarn.toast.hide()`. One at a time (a new one replaces the text and bumps), `role="status"`, black twill, Undo (or `action`'s word) at the right end, pauses while hovered. Desktop: bottom centre above the player's bar. Phones: the slot above the nav; while it shows, the player, the search knob and the sections pill ride up one slot (`--ytoast-push`). Every page uses this one.
- **Hint:** `.ytip` on the floating layer. Every icon-only link / button (≤ 64px, no words) gets it on mouse hover (90ms; at once while another is up) or keyboard focus, never on touch. Text: `data-hint` › `title` (moved to `data-hint-t` so the slow native one never shows) › `aria-label`. `data-hint-at="left|right"` opens it beside the control (a cluster's hint never covers a neighbour); above by default, below when there's no room. Facts whose word is hidden get it too. Opt out: `[data-nohint]`. `.ytip` is the one kit hint element; a tip a page places itself (Music's folder-tab tip) wears the same look with `.ytip-own`.
- **Empty state:** `Yarn.empty({ title, text, action: { label, icon, attrs, href }, cls, attrs, hidden })` → `.yempty`: centred, one line in the display face, an optional quiet second line, an optional small action (default icon ↺; with `href` a link). Used where a list would be (Projects, Music, Thoughts, a collection, Studio). No filler text.

## 12 · Sound tag
`<yarn-nav>` sews a `button.ysound.ysound--tag[data-sound-toggle]` into the sheet's top edge (top centre; top right on phones). Off = the woven white tag, black speaker-slash · on = `--red-deep` twill, white speaker. Hover only swaps the icon to what a press would give; right after a press it shows the new state until the pointer leaves. It always starts muted and shows `YarnSound.live` (on **and** audible). `kit/sound.js` wires every `[data-sound-toggle]`; listen on `window` `"yarnsound"` or `YarnSound.on(fn)`. `Yarn.soundToggle()` finds the visible one (`.when()` waits for it). UI sounds go quiet while music plays.

## 13 · Media + lightbox
- `Yarn.carousel(images, { title, group, label, heading })`: a compact strip of 148px thumbs (120px phones; `--ycar-w`), videos with a frame + duration, a missing file = a designed placeholder. After the facts, never a hero. `Yarn.media(path)` → a file URL or null.
- **Lightbox** (`kit/lightbox.js`): any `[data-ylb="<group>"]` opens its group (`data-src`, `data-alt`, `data-kind`); `Yarn.lightbox.open({ items, index, title }) · openGroup(g, i) · close() · isOpen`. Opens from the thumb, closes into it; drag down to dismiss, swipe / ←→, Esc, focus trap. Videos start muted with real controls + full screen (Space/K, M, F, Shift+←/→).

## 14 · Disc · wave · folder
- `Yarn.disc(track, { size, label: "swatch"|"cat" })` (the felt record; spins under `.is-playing`) · `Yarn.wave.html(track, { n, played })` / `.svg` / `.values` (seeded by the track: the player, Studio's upload and its preview draw the same bars; `--f` = played) · `Yarn.EQ` (three red bars) · `Yarn.swatch(item)` / `Yarn.swatchHTML(item, { size, label })` (`kit/swatch.js`: piano = black yarn, BeepBox = purple circles, DAW = blue waves; seeded, so a track always gets the same swatch; don't label the instrument beside it).
- **Folder card:** `Yarn.folder(entry, { tracks, total, current, links, action, open: { attrs, label }, meta, desc, count, key })` → `.yfolder` (Music's card, Studio's preview). A collection is a folder: one tab per song peeks above the card (`current` stands up with a red thread; arrows move along; 44px tall on touch, `.is-dense` opens the folder instead); `meta` defaults to `Yarn.cardMeta(entry, { parts: ["status", "date"] })`. A page handles clicks on `.yfolder__tab[data-tid]` (play) and `.yfolder__open` (open). In a grid set `--yfolder-top: 22px`. `Yarn.fitTabs(strip)` after a page hides / shows tabs.

## 15 · Post cards (`kit/posts.js`)
`Yarn.post(post, ctx)` → `article.ypost.ypost--<type>`: scratch (sticky note) · article (bookmark) · pick (a hang tag on red yarn → its collection) · ranking (a mini felt board) · playlist (disc + swatch rows) · images (photo grid → lightbox). Every card heads with the **caps kicker** (type in its felt circle + mono date; `Yarn.post.typeBadge(key)` + `Yarn.badge.date`). Owner colours from the data: a scratch's note (`NOTE_COLORS`), a pick's stub (`STUB_COLORS`). A thing with a write-up shows the short write-up pill; a pick links its collection with words and an arrow. `Yarn.post.configure(ctx)` sets page data (collections, votes, comments, `about`, `writeups`); `inert: true` for previews. Rankings: `tierDefs` (custom tier names; ≤ 3 characters keep the square felt keys, longer ones become felt tabs). Also `Yarn.post.collMark(coll, picks)` (a collection's stubs mark, rails only), `aggregate`, `crowdTiers`, `miniBoard`, `swatch(key)`.

**Track art** (`.ytrkart`, i7 follow-up): every song row's art carries its state, one part for Thoughts' playlist rows (`.ypost__track`) and Music's song lists (`.mu-trk`). Hover / focus → ▶ over the art; the current song → ▶ (paused) or ⏸ (playing) over it. No number column, no bars. The page swaps the glyph. Tokens `--ytrkart-r` (radius) and `--ytrkart-i` (glyph size). Big play buttons keep their word: "Play all", then "Pause" while playing, then "Play" when paused.

## 16 · Navigation
- `<yarn-nav active="home|projects|music|thoughts" base="../">`: desktop = the wordmark + raised knit tabs with section-colour felt dots, the current one roped, on the page column's edges; phones (< 960px) = the **sections pill** (`.yspool`) at the left end of the floating row, which unspools into the four sections (Enter / tap opens and focuses the current page; ✕, Esc, an outside tap or tabbing away closes). It renders the skip link (`.yskip`). Another page list (Studio): `navEl.config = { pages, brand, badge, extra }` / `Yarn.navHTML(…)`.
- **Section buttons** (Home): `a.ysecbtn.ylift.ysel[data-section]` with a `.ydot`.
- **Section transition:** `Yarn.transition.go(el, href, section)` (or `a[data-transition]`): a cord cloth in the next section's colour grows out of the button on one spring and navigates once the screen is covered; the next page's white sheet rises in. Esc cancels; reduced motion fades.
- **Scribble:** `.yscribble[data-draw]` (+ `data-scribble="wave|loop|double"`, `--scribble` colour) draws a seeded hand-drawn underline (`Yarn.scribble.draw(el)`; `data-draw="auto"` on scroll-in).

---

# Patterns

## 17 · Filters
```js
const F = Yarn.filters({ groups: [{ key, label, row, values }], items, get, text, url: true });
// F.test(item) · toggle(k, v) · set · clear(k?) · setQuery(s) · has(k, v) · any() · count(k, v) · group(k) · info(k, v) · on(fn)
Yarn.search(searchEl, F, { placeholder });
Yarn.filterRow(rowEl, F, { all: "All", browse: true, sticky, wrap, extra });   // → { open(), close(), sheet }
const T = Yarn.listTools(F, { tools, search, row, sticky, count, label, title, stickyDesk });   // phones: search → the slot
F.on(() => Yarn.flip(list, "[data-key]", () => { /* hide / show or re-render; show Yarn.empty when nothing is left */ }));
```
None selected = all · a tap solos · more taps add · a tap on a selected one removes; OR within a group, AND across groups, then text. Any `[data-yf="group:value"]` toggles `Yarn.filters.current`. Put the search line + filter row in **`.ytools.ytools--line`** (one line on desktop: the hint, then the chips' icons and Browse's word give way below 1280px; the chip strip scrolls sideways, never wraps). **Browse** opens a sheet under the row with every group (stack with icons, "rust · 4" counts, Clear all / Done); Esc / outside click closes, focus returns. **Flip** is interruptible (everything measured where it is on screen; a second click reverses mid-flight); don't flip an element that also has `.ylift` (put `data-key` on a plain cell). Phones (`listTools`): the field moves into the slot, the row floats above it (its All turns into ✕ once anything is on, the active filters of hidden groups sit right after it), the knob's badge counts the filters. `Yarn.openInPlace(list, { cell, closed, opened, … })` grows an item out of its card in a grid (Projects' inline open).

## 18 · Detail shell
```js
Yarn.detail({ back, actions, nav, title, facts, stack, links, linksLabel, media, body, end, kicker, level, size, wide, id })
Yarn.detailPage(detailHTML, { side, rail, wide, sideLabel, railLabel })   // an item as its own page
Yarn.stageSwap(stageEl, html, { dir })                                    // a timeline's stage (.ystagewrap > .ypanel)
```
One order: title → facts (`Yarn.fact.*`, a label over the title) → the closing row (stack tags, eyebrow "Built with", left · `Yarn.dlink` links, right; under 580px the links go under) → media → text (`.ydetail__text`; `.yprose` for articles). **The sticky top bar** (`.ydetail__top`): Back (`back: { href, label }`, first, on the title's left edge, once per page), the compact title, `nav: { prev, next, index, total, unit }` (‹ n / N › with the neighbour's title as a hint; ←/→ and k/j follow it; a missing side stays, disabled) and the round utilities (`actions`: open as page, copy, close). The compact title shows once the big one is covered; without `back` (a panel) the bar lies over the head and gets its material only after the panel has carried it at least its own height. In a `.ypanel` (white card material, pop shadow, `--ypanel-pad`) for a stage or an opened card; on the sheet as a page (`.ydpage`: one 760px reading column at the same x everywhere, a 220px rail reserved beside it, `wide` spans both). The stage centres on its content (≥ 48px from the top); the player only shortens it. Focus moves to the (ring-less) title when an item opens. Prose: `.ydetail__text` styles markdown (red yarn bullets on class-less lists, knit quotes, felt code, tables); kit parts inside keep their own colours. `Yarn.pager({ prev, next, ends, labels })` is the in-flow "where next" pair (a write-up's end).

## 19 · Timeline + year groups
```js
host.innerHTML = Yarn.timelineHTML(Yarn.byYear(items), render, { key, unit: "project", rule: true, pillKeys: true });
const tl = Yarn.timeline(host.querySelector(".ytl"), { ball: true, trail: true, passed: true });   // tl.select(keyOrEl) · refresh() · current
host.innerHTML = Yarn.yearGroupsHTML(Yarn.byYear(items), render, { key, unit, grid: true, rule: true });
F.on(() => Yarn.flip(host, "[data-key]", () => { Yarn.filterGroups(host, test, { unit }); Yarn.gridYears(host, { on: F.any(), byYear }); }));
const rail = Yarn.yearRail(navEl, listEl, { item: "[data-year]", top });   // rail.refresh() · spy() · current
const s = Yarn.strand(host, items, { date, label, key, href, caption });  // s.select(key); listen for "ystrand"
```
The **timeline**: a dashed thread, ruled sticky year pills, a red yarn ball rolling (spring) to the selected row and unrolling a red strand; knots it has passed become open red rings. Set `aria-current` on your row; call `tl.select()` when an item opens and `tl.refresh()` after filtering; never `overflow: hidden` on `.ytl`. Rows carry card meta and display-only stack tags (the row selects). **Year groups** (grids, phone lists): a ruled pill over each year's cells; while filtering, a year with 1–2 results folds into its neighbour's divider (the pill reads the range). **Year rail**: pills on a thread beside one continuous flow (Music desktop), the year at the top roped. **Strand**: dated points on red yarn with the same rolling ball (a collection's picks).

## 20 · Player (`kit/player.js`, `<yarn-player>`)
```js
YarnPlayer.play(track, queue?) · toggle() · pause() · next() · prev() · seek(s) · setVolume(0..1) · setMuted(b) · setShuffle(on?)
YarnPlayer.enqueue(t) · playNext(t) · remove(t | i) · has(t) · queue · expand() · collapse() · minimize() · setView(v) · state · playing · on(fn)
```
Views: the **disc** (rests at the right end of the floating row on phones) → the **bar** (desktop: who · scrub · ⏮ ▶ ⏭ · volume · ⌃ · disc; phones: in the slot, who · ⏮ ▶ ⏭ · mute · disc) → the **panel** (art · title · "from <Collection>" · facts · platform `dlink`s · notes under a labelled seam · the queue). Drag: bar up → panel; down or sideways → disc; the panel diagonally → all the way to the disc. A long press (450ms) or right-click on the disc floats ▶ · mute · ⏭ (hints open outward; Esc / outside tap / scroll closes). ⏭ is `aria-disabled` on the last song. An ongoing song wears a gold **WIP** mark with a hammer (after the bar's title and a pin on the disc; none on the art. Open: `?pwipc=gold` turns the player's red controls gold while it plays). Queue rows: grip (drag / arrow keys) · the row (play now) · ✕ (remove; mouse: shows on hover / focus, touch: always; the toast's Undo puts it back in place). Every queue change emits `kind: "queue"` (and `window` `"yarnplayer"`); `html.y-playing` while audio plays. Review URLs: `?demo[=<id|name>]` · `?player=disc|bar|panel`.

## 21 · Floating layer (phones' bottom chrome)
`Yarn.layer()` = `div.ylayer` at the end of `<body>`: a fixed zero-size box with its own stacking context (`--z-layer: 100`). The sections pill, the search knob / bar / chip row / Browse, the player, toasts, the hint, Music's menu / notes / tab tip and Home's callout all live in it, so nothing in the page can paint over them. `html, body { overflow-x: clip }`: no page ever scrolls sideways.
**The slot** (phones): one strip `--yslot-gap` (8px) above the nav (`--ynav-top`) for whatever is open, the player's bar or the search bar (`Yarn.slot.owner / claim / release`, `html[data-yslot]`, event `yarn:slot`; opening one folds the other into its knob). Closed knobs rest on its centre line (`--yslot-mid`): the pill left, the search knob, the disc right. `Yarn.fab({ icon, label, title, owner })` → `{ el, btn, panel, body, float, open(), close(), badge(n), count(text), away(on), destroy() }`: the search bar unrolls out of its knob on one interruptible spring (the knob becomes ⌄; drag right / down folds it). Tokens: `--yslot-h 64px`, `--yslot-b`, `--yslot-mid`, `--yup-b`, `--bottom-ui` (pad fixed / sticky bottoms with it).

| token | z | layer |
|---|---|---|
| (page band) | 0–49 | cards, year pills (6), sticky filter row (28), search line (30/42), detail bars (20) |
| `--z-nav` | 50 | the phone nav (sections pill) |
| `--z-chrome` | 60 | the player's bar + disc |
| `--z-search` | 62 | the search knob, its bar, the floating chip row |
| `--z-pop-low` / `--z-pop` | 69 / 70 | popovers: Music's long-press menu, Home's callout, Browse / suggestions |
| `--z-scrim` / `--z-sheet` | 79 / 80 | the player's full page on phones |
| `--z-toast` | 90 | toasts |
| `--z-hint` | 95 | the hint |
| `--z-transition` · `--z-drag` · `--z-dev` · `--z-modal` · `--z-skip` | 9000 · 9500 · 9999 · 10000 · 10001 | section cloth · a dragged tier item · ⚙ panel · lightbox · skip link |

Check every floating state at 390 and 360: `/Users/blaqat/dev/temp/r3i7-site/mobile.mjs` (every layer on top at its centre and corners, none overlapping, none cut off).

## 22 · Review tools (mock-only)
- **⚙ panel:** `Yarn.mockPanel([{ label, param, options: [[value, label]], default, open?, state?, global?, when? }], { title })`. Shows **Notes on this page**, **Note on something** (a picker: hover outlines a part, ↑/↓ bigger / smaller, Enter or click picks, Esc cancels), **Pins · n**, **Round-up →**, then **Open** (decisions still open), **Jump to** (`state` demo helpers) and a collapsed **Earlier options** (decided; still clickable so old URLs keep working). A click on an Open / Earlier value is saved (`localStorage["yarn.review.i7"]`) and applied on every page (kit groups, params the kit reads, `global`) or per section; a param in the URL wins. **Reset my choices** forgets them.
- **Pins:** numbered on noted parts; `?rvnote=<id>` opens one. Everything outside ⚙ lives in `.yrv-root`. Screenshots hide **`.mockpanel, .yrv-root`**.
- **`review.html`:** the round-up: open decisions (from `review/options-i7.js`, generated by `node _tools/review-data.mjs`), questions (`review/questions-i7.js`), every note by page, **Copy everything** as Markdown. API: `window.YarnReview`.

---

## Kit params (all in ⚙)
Decided values are the default; the alternatives stay one click away under **Earlier options** (for comparison only; build the decided one).

| Param | Decided | Earlier (⚙ only) | What |
|---|---|---|---|
| `toggle` | `red` | `ink` · `tint` · `rope` | multi-select toggles' fill |
| `sel` | `rope` | `ink` | single choice: the rope on the edge |
| `rope` | `in` | `out` | the rope on the element's edge |
| `redbtn` | `twill` | `deep` | `.btn--red`'s red |
| `cardmeta` | `facts` | `badges` | card meta (`Yarn.cardMeta`) |
| `gridyears` | `fold` | `flow` · `label` · `rule` | a grid's year dividers while filtering |
| `dlayout` | `label` | `side` · `rail` | the opened item's arrangement |
| `dnav` | `count` | `labels` · `arrows` | ‹ › in an item page's top bar |
| `stagealign` | `center` | `top` | the timeline's stage |
| `dfoot` | `inline` | `float` | links in the flow (no floating foot) |
| `msearch` | `fab` | `bar` | phone search + filters |
| `mactive` | `start` | `end` | phones: where hidden-group filters sit in the floating row |
| `mnav` | `spool` | `top` · `corduroy` · `cotton` · `ink` · `frame` (`kit/mnav.html`) | the phone nav |
| `toast` | `bottom` | `top` | phone toasts |
| `soundui` | `tag` | `brand` · `nav` | where the sound toggle lives |
| `browseicon` | `shake` | `caret` | the Browse button's icon |
| `uisnd` | `quiet` | `always` | UI sounds while music plays |
| `discat` | `line` | `nav` | where the phone disc rests |
| `bg` | `jersey` | `intarsia` · `quilt` · `speckle` · `current` | the sheet's cloth (`kit/bg/`) |
| `body` | `nunito-sans` | `figtree` · `atkinson` · `system` | the body font |
| `motion` | `i3` | `i2` | motion timings (`Yarn.motion`) |
Review / demo params: `reduced=1` · `from=home` · `trp=0..1` · `lb=<group>:<i>` · `browse=open` · `fab=open` · `demo` · `player` · `rvnote`. Kit options `statusdate` (apart | joined: "WIP since Sep 2025" on Projects, Music and the player; `Yarn.opts.statusdate` is `cardMeta`'s default) and `pwipc` (red | gold player controls on a WIP song). Page options (Projects' `cardfacts`; Music's `trackmatch`, `pwip`; Thoughts' `cardwu`, `apager`, `aboutgo`, `collicon`, `wumark`, `minimarks`; Studio's `frame`, `layout`, `confirm`…) are listed in each page's ⚙ and `review/options-i7.js`.

## Also in the kit
`Yarn.Spring` (response / damping, interruptible) · `Yarn.springEasing({ response })` → `{ easing, duration }` · `Yarn.motion` (one timing table) · `Yarn.watchStuck(el)` · `Yarn.wireDetail` (auto) · `Yarn.sound(name)` · `Yarn.px("--token", el?)` · `Yarn.catSVG()` · `Yarn.esc / slug / hash / rng / clamp / uid` · vocab + format: `Yarn.status / type / instrument`, `Yarn.dateRange(item)` ("Sep 2025 – now", "Mar – Aug 2025"), `Yarn.duration`, `Yarn.fmt.{month, day, full, monthLong, time}`, `Yarn.byYear`, `Yarn.yearOf`, `Yarn.parseDate`. The building blocks behind the post kicker (`Yarn.badge.type`, `Yarn.badge.date`) and the Earlier `cardmeta=badges` / `ongoing=ribbon` looks (`Yarn.badge.*`, `Yarn.meta`, `Yarn.stack`, `.yribbon`) are still in the code for those comparisons; don't build new UI on them.
