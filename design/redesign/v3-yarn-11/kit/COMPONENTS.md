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

## 1a · Colour roles + looks (i10 · L1)
**A colour is a word (R1).** Every accent goes through one role token (`kit/yarn.css` "i10 · system · ROLE TOKENS"); `?look=section|ink` (html `data-look`, ⚙ Open) only re-points the roles. They are declared on `:root` and on every `[data-section]`, so a wrapper with its own section (a nav tab, a demo) gets its own hue. Any wrapper can carry `data-look="ink"`.

| role | tokens | section (default) | ink | where |
|---|---|---|---|---|
| brand | `--c-brand` | red | red | the logo's dot, Home, scribbles |
| here | `--c-here-a/-b` | `--sec` / `--sec-deep` rope (Thoughts: `?taccent`) | ink rope | the nav's current tab; the other tabs' section dots are grey until hover / focus |
| pick | `--c-pick-a/-b` (= `--rope-a/-b`) | ink rope | ink rope | a chosen single option (seg, sort, Mine / Everyone), the opened row, the timeline's ball + strand |
| on | `--c-on-bg/-fg/-tex/-line` | `--sec-soft` knit + `--sec-deep` (Thoughts: `?taccent`; the player: Music's purple) | ink twill + white | a toggle that's on (chips, tokens, rail rows, the sound tag, the player's shuffle / repeat). `?toggle=red` (decided) now means this |
| primary | `--c-primary-bg/-fg` | ink + white | ink + white | `.btn--primary` (= `.btn--red`): the one primary per view |
| act | `--c-act-bg/-fg/-line` | white, ink, hairline | same | every repeated action at rest (every ▶, the +) |
| live | `--c-live/-deep/-soft/-fg` | **Music's purple on every page** (i10 r2 · S1: “purple is music”) | red | playing: the play button's fill, the player's ▶ / progress / disc / its on toggles, a playing card's tint (section) or rope (ink), a playing track row's rope |
| now | `--c-now/-deep/-soft/-fg` | the page's own accent (`--sec-live`: Projects blue, Home red, Thoughts `?taccent`, Studio ink) | red | “now” that isn't music (i10 r2): the title's dot, an article's reading bar + jump flash, a ranking's drop / draft / “you”, a lit mini-board item, Studio's “site is live” |
| link | `--c-link/-hover` | ink, `--sec-deep` on hover (Thoughts: `?taccent`) | ink, red-deep on hover | inline links, "more", `.ylinkbtn` |
| deco | `--c-deco` | `--sec` (Thoughts: `?taccent`) | ink | prose bullets, a quote's bar, the h2 rule |
| bookmark | `--ypost-mark/-deep` | red | red | the article ribbon, the pick's yarn + knot, the type swatches' marks, the ranking's write-up bookmark (i10 r2 · S3, as in i8; Studio too) |
| status | `--c-wip` (gold) | WIP gold · Complete ink · Dropped grey | same | facts, badges |

The ladder (R2): rest is neutral → a chosen single option wears the **pick** rope → a toggle that's on gets the **on** fill → something **live** gets the live fill. Nothing at rest is a solid accent. Content colours (project types, instruments, tiers, sticky notes) are not accents: an instrument / type chip that's on keeps its soft tint and ink text.
**Contrast** (measured): white on the live fill ≥ 4.5 and deep text on the soft tint ≥ 4.5 in every section: red 4.86 / 4.98 · blue 4.59 / 6.34 · purple 5.23 / 7.17 · gold → `--gold-deep` 5.64 / 4.79 · ink 16.6 / 8.06. Gold itself carries white at 2.3:1, which is why a no-taccent Thoughts demo's now is `--gold-deep`. Since r2, live is purple everywhere in section (5.23 / 7.17); now uses the page's pair above (Thoughts: ink 16.6 / 12.57 · red 4.86 / 4.98).
**Thoughts' accent (i10 r2 · S2):** `?taccent=ink|red` (html `data-taccent`, ⚙ Open on Thoughts pages; default ink) re-points here / on / link hover / deco / now on Thoughts under `look=section` only: ink = a warm grey tint `#e6dfd4` + ink (12.57; ink-3 on it 4.95), the ink rope · red = red-soft + red-deep (4.98), the red rope. Gold stays Thoughts' identity (the cord frame, the nav's Thoughts dot) and WIP. A demo wrapper can carry `data-section="thoughts" data-taccent="…"` (components.html § roles). Live is purple and bookmarks red either way.
Compare on the real site: `kit/looks.html` (i11: i10 before next to i11 after; also i11 at headings 500 · 400 and in both looks; any screen at 1440 / 1000 / 390).

## 2 · Type scale (i11 · L2 + L3, DESIGN-i11 T1–T9)
**12 · 13 · 14 · 15 · 16 · 17 · 22 · 36 px, nothing else.** A role's size depends on where it sits: in a card or a row it's 1px smaller than on the page (rule 5); a button's text is 1px smaller than the text beside it (rule 6). Two families (rule 12): Nunito for Display / Heading / Title, Nunito Sans for everything else; numbers are Nunito Sans with `tabular-nums`. Maple Mono (`--font-mono`) is for code only.

| role | tokens | page | in a card / row | weight | tracking | lh | family | use |
|---|---|---|---|---|---|---|---|---|
| Display | `--t-display` | 36 (phones 28) | n/a | 500 (`hw`) | −.025em | 1.05 | Nunito | the page title (`.yhead__title`), an item page's title, Studio's title field |
| Heading | `--t-heading` | 22 (phones 20) | n/a | 500 (`hw`) | −.015em | 1.15 | Nunito | an opened item's title, a section, **the year pill** (`.yyear`), prose h2, the player panel's title |
| Title | `--t-title` | 17 | **16** | 500 (`hw`) | −.006em | 1.25 | Nunito | a card / row title, the player bar's name |
| Body | `--t-body` | 15 | **14** | 400 | 0 | 1.5 | Nunito Sans | descriptions, fields, prose in cards (articles read at 17) |
| Meta | `--t-meta` | 13 | **12** | 400 | 0 | 1.4 | Nunito Sans | facts, dates, counts, tags, hints, toasts |
| Label | `--t-label` | 14 | **13** | 500 | 0 | 1 | Nunito Sans | buttons, chips, segments, nav, tabs, field labels (`--fs-label` = the context's body − 1) |
| Micro | `--t-micro` | 12 | 12 | 500 | +.01em | 1.2 | Nunito Sans | folder tabs, woven tags, badges (`.t-caps`: +.06em) |
| Numeric | `--t-num` | 13 | 12 | 400 | 0 | 1.4 | Nunito Sans + `tabular-nums` | time codes, durations, track numbers |

- **Weights (T2):** 400 and 500 only. Prose bold (`strong` in `.yprose` / `.ydetail__text`) is `--fw-bold` 600, the one exception. `?hw=400` (⚙ Open, "Heading weight") sets `--fw-head`, which Display, Heading and Title read; Labels and Micro stay 500.
- **Upright (T3):** no italic on any heading, title, quote, label or status (the prose blockquote is upright, marked by its rule). An author's `*em*` in prose stays italic.
- **Balance (T7):** every heading / title role, prose h2–h4 and `h1–h4` get `text-wrap: balance`; `p` and descriptions get `pretty`.
- **The card context:** `.ycard .yfolder .ypost .yrow .mu-trk .yp-row .yp-qr .ytrkrow .pj-card .pj-row .r-pickcard .tl-card` and Studio's cards (+ any element with `class="y-incard"`) re-declare `--fs-title / -body / -meta / -label / -num` (16 / 14 / 12 / 13 / 12) **and** the composed `--t-*` (a `var()` resolves where it's declared), so a role used inside a card shrinks by itself. Never write a size: use the role.
- Use `font: var(--t-title); letter-spacing: var(--tr-title)` or the classes `.t-display .t-heading .t-title .t-body .t-meta .t-label .t-micro .t-caps .t-num`. Longhands: `--fs-* --fw-* --tr-* --lh-*`, `--ff-head --ff-body --ff-num`, `--fw-head`, `--fw-bold`.
- **Facts** (`Yarn.fact`, `Yarn.cardMeta`) are Meta plus a quiet 15px glyph in ink-3; WIP keeps its gold disc.
- **Allo** (`?font=allo|allo-round`, ⚙ Open): `kit/allo.css` makes Allo both families (one family for everything also satisfies rule 12), with its own monotonic `--tr-*` and word-spacing.

## 2a · Spacing (i11 · T6)
`--sp-1 … --sp-8` = 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64. **`--section-gap`** (48; 32 under 720px) separates a page's sections: header → tools → results line → the list, Home's blocks, an item page's blocks, an article's h2 sections, Studio's panes. The kit puts it under `.yhead` and `.ytools`, between `.ygroups` and between `.ydetail--page` blocks. Inside a section: 8–24. `--gutter` (24; 16) is the gap between cards across **and** down. Anything that hangs off a card lives inside its box.

## 2b · Insets + radii (i11 · T10, rule 13)
A surface holds its content **the same distance from all four edges**, and a surface nested in another has **radius = outer radius − the inset between them** (min 4). Circles and pills (▶, discs, chips, buttons, the year pill) are exempt from the radius formula, never from the inset: a pill's words sit `(height − 1em) / 2` from its ends. A ▶ or + in a card's corner sits one inset from both edges. The rope (`.ysel`), the focus ring and the hover shadow follow the surface's own radius.

| surface | inset | + inner | = radius |
|---|---|---|---|
| card (`.ycard`, folder, post, project card) | `--inset` 16 (phones 12) | `--r-inner` 8 | `--r-card` 24 (20) |
| row (`.yrow`, a track row) | `--inset-row` 8 | `--r-row-inner` 8 | `--r-row` 16 |
| popover, menu, tip | `--inset-pop` 8 | `--r-pop-inner` 8 | `--r-pop` 16 |
| field | `--inset-field` 4 | `--r-field-inner` 8 | `--r-field` 12 (one inset into a card: `--r-inner`) |
| player bar · its open panel (top corners) | 12 · 24 | 8 | 20 · 32 (set per frame in `kit/player.js`) |
| sheet, Studio pane | `--inset-sheet` / `--inset-pane` 16 | 8 | `--r-sheet` / `--r-pane` 24 |
| opened item (`.ypanel`) | `--inset-panel` 24 (16) | 8 | `--r-panel` 32 (24) |

`--radius-card` stays as an alias of `--r-card`; `--card-pad` is `--inset`.

## 2c · Faces
Nunito (`--font-display` → `--ff-head`): headings and titles, 500. Nunito Sans (`--font-body` → `--ff-body`, `--ff-num`): everything else, 400 / 500. Maple Mono (`--font-mono`): `<code>` and code blocks only. Classes `.h1 .h2 .h3 .display .eyebrow .meta .muted .sr-only` are roles. Never hard-code a family.
**Page header:** `Yarn.header({ title, meta?, actions?, level? })` → `.yhead` (Display, red period, `--section-gap` below). One per page; no lede under it. Page content goes in `.ypage` (40px gutters, 14px on phones, bottom room for `--bottom-ui`).

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
**i10 (L1 + L4):** `.btn` at rest is the **act** role (white, ink, a hairline under `?stitch=calm`) · `.btn--primary` the one primary per view (ink; `.btn--red` is now an alias, so `Yarn.dlink({ primary: true })` and old markup are ink) · `.btn--live` the live fill.
- **The one play button** (R7): `Yarn.playBtn({ state, label, sm, primary, cls, attrs, aria, tag, eq })` → `button.btn.btn--play[data-state]` with ▶, ⏸ and the kit `.yeq` bars in `.btn--play__ic`. `state` "" = act (a white disc, ink ▶) · `"current"` = loaded but paused (act + a 2.5px live ring, ▶ in live-deep) · `"playing"` = the live fill with white bars (⏸ on hover / focus; `eq: false` = ⏸ always). 44px, `sm` 36px. `label` makes a pill (`.btn--play-l`); `primary: true` = ink at rest (a release page's Play all). `Yarn.playBtn.set(el, state, { label, aria })` re-states one in place. Its state changes its fill, never its shape or size.
- **The one link disc** (R7, owner: "the beepbox AND soundcloud are using the duotone"): `Yarn.linkIcon` and `Yarn.copyBtn` render `.ylinkicon.ylinkicon--link`, a cotton-2 disc with the Phosphor **duotone** glyph in ink-3 (`kit/vendor/phosphor/duotone`, trimmed to the link glyphs: add one there when `LINK_ICONS` gains one). Hover / focus: it lifts and fades to its site's colour, glyph white; a link with no brand (a site, copy) fades to ink. Utility discs (✕, open as page, prev / next) stay plain `.ylinkicon`. `Yarn.dlink`'s known-site glyphs are duotone too.
- `.btn` (44px pill, knit, dashed stitch) + `--red` (primary: Play all, Visit site, Publish, New…) · `--ink` · `--ghost` · `--sm` (36px; 44px hit area on touch) · `--icon` (round) · `--m-icon` (label on desktop, icon-only on phones; keep an `aria-label`). Disabled (`:disabled` / `aria-disabled="true"`): flat, .5, no lift.
- **An item's link row:** `Yarn.dlink({ href, label, icon, kind, primary, cls, attrs })` → `.btn.btn--d` (40px). The first is the red primary; known sites get `data-brand` + `.btn--brand` and drop to icon-only past three links.
- **Round icon links:** `Yarn.linkIcon(kind, href, label?, { sm })` → `.ylinkicon` (44px; `sm` 32px with a 44px touch target); i9: also `Yarn.linkIcon(link, { sm })` with a `Yarn.links` / `Yarn.linkInfo` object. Kinds: github · soundcloud · youtube · beepbox · spotify · bandcamp · apple · itch · instagram · x · discord · linkedin · twitch · email · view · link (Bandcamp + itch.io have no Phosphor logo: `.yic.yic-bandcamp` / `.yic-itch` draw the mark in the same `<i>` slot). A known site fades to its colour on hover / focus (`Yarn.brandOf(href, kind)`, white ≥ 4.5:1 on every fill); a page's own `a.btn` to a known site gets its brand on first hover.
- **Copy link:** `Yarn.copyBtn(text, { label, sm, cls, attrs })` → `button.ylinkicon[data-copy]` (`text` "" = the page's URL when pressed). One kit listener copies (clipboard, else a textarea + execCommand), swaps the icon to ✓ (a broken link on failure), says "Link copied" / hint "Copied" for 1.6s, sound `copy`. `Yarn.copy(text, btn?)` → `Promise<boolean>` for a page's own trigger (Music's menu). Don't add a page listener for `[data-copy]`.
- `.ylinkbtn`: a text-only action inside a sentence.
- **i9 · `Yarn.dlink`** also takes `url` (= `href`, so a links object spreads in) and `keepLabel` (the owner's own text: never drops to the icon in a crowded row); with no `label` it uses `Yarn.linkInfo`'s ("Play on itch.io", "JummBox song").

## 5b · Links: any link, recognised ones converted (i9 · links, S5)
- **`Yarn.linkInfo(url, { kind? })`** → `{ url, valid, brand, kind, name, label, icon, host, guess, embed, why }`. One recogniser for every link, Studio and site:
  - **services:** SoundCloud · Spotify · Bandcamp · YouTube (+ YouTube Music) · Apple Music · GitHub · itch.io · BeepBox and its forks (JummBox, UltraBox, ModBox) · Instagram · X · Discord · LinkedIn · Twitch · email. Anything else is a plain link: `brand ""`, its domain is its name, `ph-arrow-up-right`.
  - **`url`, normalised:** https for a known service; its own host (youtu.be · music.youtube · m.youtube → `www.youtube.com/watch?v=…`, m.soundcloud → soundcloud.com, `open.spotify.com/intl-xx/…` → `open.spotify.com/…`, twitter → x.com, discordapp → discord.com, a Spotify URI → its web address); tracking dropped everywhere (`utm_*`, `si`, `fbclid`, `gclid` …) plus a service's share junk (Spotify keeps nothing, Apple Music keeps `?i=`, SoundCloud `?in=`, YouTube `v` / `t` / `list`, Bandcamp nothing). An unknown site keeps its address (and its own params). A bare `zed.dev` gets https. BeepBox's `#song` hash is never touched. Normalising twice changes nothing.
  - **`kind`:** track · album · playlist · set · artist · video · channel · repo · gist · profile · game · song · post · server · app · email · link.
  - **`label`:** the default text: the service's name ("SoundCloud"), "Play on itch.io" for a game, "<fork> song" for BeepBox, "Add to Discord" for a bot, the domain for anything else.
  - **`guess`:** `{ title, by }` off the slug (soundcloud.com/numaiden/feline-shores → "Feline Shores" by numaiden; Bandcamp, itch.io, Apple Music too). Spotify and YouTube addresses carry no name: `null`.
  - **`embed`:** the service's own player `{ src, h }` / `{ src, ratio }` (SoundCloud widget, Spotify embed, youtube-nocookie, Apple Music embed). Bandcamp's needs the page's numeric id (the real build reads it when the link is saved): `null`.
  - **`why`** (invalid): one sentence for the field ("That isn't a link yet: it needs a site, like soundcloud.com/…").
- **`Yarn.links(x, { all })`** → `[{ ...linkInfo, text, label }]` from any shape: `[{ url, text }]` (the i9 data) · `["url"]` · `{ soundcloud: url, youtube: url, beepbox: url }` (the site's music data, key = a brand hint) · a project's `view` + `github` (their site words kept as text: "Visit site" / "Open repo" / "Add to Discord", "Source") · a pick's `url` · an images post's `embed` · `[{ kind, label, href }]` (Home's contacts). `label` = the owner's `text`, else the default. Invalid and repeated links drop out unless `all: true`.
- **`Yarn.dlinks(x, { primary, sm, cls })`** → that list as an item's link row (`Yarn.dlink`s; the first red unless `primary: false`; own text keeps its words).
- **Data (i9):** every links field is `links: [{ url, text? }]` (Home: `contact: [{ url, text? }]`). Studio migrates every older shape on load (`studio-data.js` `migrate`).
- **Studio's links field** (`E.links(item, { key, label, placeholder })`, `studio/studio-links.js`): kit parts only. A row = `.st-grip` · the mark (`.ylinkicon`, opens the link; the kind under it) · its text over its address (`.yfield`) · ✕ (`.ylinkicon--sm`). Paste one link or a list (one per line) into the add box; lines that aren't links stay there and it says why; repeats flash their row. Reorder by the grip (mouse, touch) or Space + arrows; ✕ = Undo in the toast; an address that isn't one says so under its row.
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
- **Stack logos for new tools (i9 · polish, S11):** names the kit doesn't know (`Yarn.stackKnown(name)` false) get one at run time: `Yarn.stackLookup(name)` → `{ found: { slug, title, src, tint } } | { none } | { offline }` (one cached read of the pinned `simple-icons@16.36.0/data/simple-icons.json`: title, alias, `Yarn.stackSlugs(name)` variants, a sole "<name> …" title; `+ # &` only spell out: `C#` → csharp, never `c`). Register what a page knows with `Yarn.stackLogo(name, info)`: `{ src, tint }` a one-colour glyph · `{ col, src }` an upload / link · `{ mono: true }` the monogram (`.ystk-mono`: an ink tile with `Yarn.stackInitials(name)`, white in a pressed token). A project keeps them as `stackIcons`; register before rendering. Live: components.html#stack-logos.
- **Stack icons:** `Yarn.stackIcon(name)` → `<i class="ystk-ic">` (a CSS-mask glyph): the colour logo on white surfaces, the one-colour glyph on filled / ink / `.on-tint` surfaces (set `--ystk-on` on a new filled surface). `Yarn.devicon(name)` · `Yarn.DEVICONS`. Sources: `research/STACK-ICONS.md`.

## 8 · Facts + card meta
One face for every fact: a disc `.yfact__i` (`--fact-d` 22px, colour `--fact-c`, glyph `--fact-on`) + a label (`750 .8rem` display).
```js
Yarn.fact.status(s, o) · .type(t, o) · .instrument(i, o) · .date(item, { dur }) · .text(phIcon, label, o)
Yarn.fact.statusDate(item, { dur, word })   // "Completed Dec 2024" · "WIP since Sep 2025" · "Paused, started Jun 2024"
Yarn.fact.pub(state, { compact, text })     // Studio's publish state: live (ink) · changed (red) · draft (dashed) · hidden (grey)
// o: { cls, attrs, title, sub, hint }   cls "yfact--icon" = disc only (the label stays for screen readers; hint names it)
```
- **i9 · a list of instruments** (a mixed collection): `Yarn.fact.instrument(["piano", "daw"])` / `Yarn.badge.instrument([…])` → one fact, "Piano + DAW", `data-instrument="mixed"`, its disc split into one slice per instrument (`--fact-mix`, the `--inst-*` colours). `Yarn.cardMeta` with `parts: ["instrument", …]` reads a collection's from its songs.
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
- **i9 · a mixed collection's swatch** (`kit/swatch.js`): pass `mix: [[instrument, songs], …]` (`Yarn.musicFacts(x).mix`), a collection with `songs`, or an instrument list. With more than one instrument the knit is striped like a scarf: one band of rows per instrument, as tall as its share of the songs (at least 4 of 15 rows), most songs on top, each band its own yarn with a motif that fits a band (keys / stripes · rings · a flattened wave). `data-instrument="mixed"`; `motif` dresses the top band. `YarnSwatch.mixOf(item)`, `YarnSwatch.BAND` (the band motifs). A track (the player's art, the disc's label, a playlist row) is one song, so it keeps its one yarn. `Yarn.folder` passes its songs' mix.
- **i9 · a release's facts + the Music order** (`kit/yarn.js`, the one place the site and Studio read them):
  - `Yarn.musicFacts(entry)` → `{ status, start, end, instrument, instruments, mix, mixed, songs }`. A single: its own fields. A collection: from its songs: status = WIP if any song is WIP, else Complete if any is, else Paused if any is, else Dropped; start = the earliest song start; end = the latest finish among songs that aren't WIP (none while it's WIP); mix = instruments by how many songs, most first.
  - `Yarn.musicOrder(items, mode, { now })` → a new array, the order the Music page shows; ties A–Z by name (numbers in order). `finished` (default; the old site's `sortByDate` + the owner's note): WIP = now, always on top · Complete: its finish (else its start) · Dropped: its finish if it has one, else its start · Paused: its start. `started`: the newest start. `az`: by name. `hand`: Studio's drag order (`_order`).
  - `Yarn.musicOrder.groups(items, mode, { now })` → `[{ year, items }]`, the year pills (the year of what it sorts by; WIP = this year), `null` for `az` / `hand`. `.key(item, mode)` → `{ t, year }`. `.MODES` → `[{ key, label, short, rule }]`.
  - The filter's `instrument` group matches a collection when any of its songs matches (the old site's rule).
- **Folder card** (i10 r2 · cards · C1–C3: i8's card again, with i10's type + colour roles; DESIGN-i10 §6): `Yarn.folder(entry, { tracks, total, current, links, action, open: { attrs, label }, meta, desc, count, countText, swatchSize, key })` → `.yfolder` (Music's card, Studio's preview). Markup: `.yfolder > [.yfolder__tabs] + .ycard.yfolder__card > .yfolder__open · .yfolder__head · .yfolder__desc · .yfolder__foot`.
  - a collection's **tabs** (`.yfolder__tabs`, before the card) **hang above the card, joined to it**: `--yfolder-peek` (20px) above its top edge, behind them the back cover (`.yfolder--coll::before`). The strip sits in front of the card but is clipped at the card's top edge, so every tab (40px tall) touches the card at rest and when it lifts (hover / focus / a match / the face), and the chosen tab (`.is-now`: the card's white with a live thread, or the live fill while it plays) merges into the edge with no seam. A tab filtered out slips down behind the card. The tab label is Micro and the number Numeric (`.yfolder__tn` · `.yfolder__tl`). Arrows move along the tabs, each reaches 44px tall on touch (above the peek), and `.is-dense` opens the folder instead.
  - **room above, never inside:** a collection's `.yfolder` has `margin-top: var(--yfolder-peek)`. A single that shares a grid row with one gets `.is-band` (the page sets it; Music's `bandRows`), the same margin, so the card bodies in a row start on one line and a single has no empty band inside it. A row's gap down is the grid's gutter, measured to the top of its tabs.
  - **the head:** the art top-left (`swatchSize`, 54 on Music's grid), then `.yfolder__tt` beside it: the Title, then ONE `.yfolder__meta` line (`meta`, default `Yarn.cardMeta(entry, { parts: ["status", "date"] })`, then `.yfolder__n` "· 4 tracks" in Meta; `countText` overrides it, e.g. "2 of 4 tracks"). `?cardart` is gone (decided).
  - **the text:** `.yfolder__desc` in Body, the card's full width, clamped to `--yfolder-lines`.
  - **the foot:** `.yfolder__foot` (44px) = `.yfolder__links` (32px discs) on the left · `action` on the right: + as the 32px disc (`ylinkicon ylinkicon--sm`) and `Yarn.playBtn()` at 44. **▶ is the biggest button** on a card, a row and a phone card.
  - **spacing:** `--yfolder-pad` 16 (12 under 960px), the head's gap 16.
  - **i11 · music (DESIGN-i11 T1 T10):** the folder is a card context (Title 16 · Body 14 · Meta 12 · Micro 12, 500 / 400, the tab number tabular Nunito Sans). Isometric: `--yfolder-pad` is `--inset` (16, phones under 720 12) on all four sides; the card's corner is `--r-card` (inset + `--r-inner` = 24 / 20) and the art in its corner `--r-card − the inset` (8); ▶ sits one inset from the bottom and right edges; the rope (`--ysel-r`), the focus ring and the live tint follow `--r-card`. A row form re-declares `--inset` + `--r-card` on its `.yfolder` (Music's timeline: 12 / 20) and everything follows. The swatch takes no radius from `Yarn.folder` any more (the CSS gives it the card's); `YarnSwatch.html` accepts a CSS length too (`radius: "var(--r-inner)"`).
  - **page hooks:** `.is-band` (above). `.is-current` / `.is-playing` on `.yfolder` give the live state (R2): the playing tab is the live fill; under `look=section` the playing card's body is `--c-live-soft`, and under `ink` a live rope runs on its edge. The current paused tab gets a live thread only.
  - A page handles clicks on `.yfolder__tab[data-tid]` (play) and `.yfolder__open` (open). Call `Yarn.fitTabs(strip)` after a page hides or shows tabs.

## 15 · Post cards (`kit/posts.js`)
**The card grammar (i10 · pages, P2; DESIGN-i10 §6):** every post card has one left edge (its `--card-pad`; a pick's text edge is past its stub). It reads, top to bottom:
- **Kicker:** one style, Micro caps: type · read time with "·" between them (CSS, read out as nothing), the date on the right (i8's place, i10 r2).
- **Title:** the Title role. A scratch's quote is a Title too; its opening quote mark sits inline (i8).
- **Dek:** Body.
- **About / write-up pill:** Label + Meta.
- **Foot** (`.ypost__foot` rows; i10 r2 · cards · C1: back in i8 / i9's places, round 1's restyles kept):
  - Article, ranking: the tags, then on the right (`.ypost__right`) the ranking's "Write-up →" (i11: an article's "Read →" is cut).
  - Pick: two rows. The links (the kit's small link buttons with the owner's own words, `Yarn.post.linksRow(p)` → `Yarn.dlinks(p, { sm: true })`) with the shelf ("Tools I like →") on the right; then `.ypost__foot--read`: the tags, with "Write-up →" on the right (i11: a pick-as-article's "Read →" is cut).
  - Playlist: the record leads its head on the left; the foot is Play all, then the tags.
  - Images: the links on their own row, then the tags.
  - `.ypost__right` is not positioned, because a pick's shelf link is the card's stretched link.

**i11 · pages (DESIGN-i11 T1–T10):**
- **Type.** A post card is a card context (`.ypost`), so every role in it is 1px smaller than outside: Title 16, Body 14, Meta 12, Label 13. The kicker stays Micro (12, caps, Nunito Sans 500). Nothing in a card is heavier than 500.
- **The cuts (T8).** An article card has no "Read →", and neither does a pick that is an article: the card, or its title, is already the link. The foot is just the tags, and a card without tags has no foot. The kicker's caps type word stays for now: the owner asked for it in i3 (question `cut-kicker-type`).
- **Insets (T10).** Every card holds its content `--inset` in (16, 12 on phones) on all four sides, the sticky note too: its tape ends 13px down, above the kicker. A pick's left inset is measured past its 34px stub.
- **Nested radii (T10):** inner radius = outer radius − the inset between them, min 4.
  - The article's cover and the images' thumbs sit on the inset: `--r-inner` (8).
  - A playlist's track rows reach 8px past the text edge, so their art sits on the text edge: row radius `--r-inner` + 8 (16), art 8.
  - The mini board's key and tray: 8. Its items sit 4 in: 4.
  - The pick keeps its hang-tag shape: the stub side `--r-inner`, the open side `--r-card`. `--ysel-r` follows that shape, so the rope does too.

The go-links (`.ypost__go`, `.ypost__coll`, `.ypost__wu`) are the **link role**: ink, underlined, and `--c-link-hover` on hover. Play all is the kit's play part (`Yarn.playBtn({ label: "Play all", sm: true })`). It's neutral at rest, `current` when its playlist is loaded and paused, and the live fill while it plays; the playing card gets a `--c-live-soft` tint (section) or a live ring (ink). The ranking's add button is a plain `.btn` (neutral).

`--ypost-mark` / `--ypost-mark-deep` colour a post's material marks: the article ribbon, the pick's yarn and knot, the type swatches' marks and the ranking's write-up bookmark. They're the bookmark **red** in both looks and everywhere, Studio too (i10 r2 · S3, owner: “bookmarks should stay red”, as in i8). Nothing else red decorates a post; tier felts, note colours and stub colours are content and keep their colours.

**Image sets (i9 · polish, S14):** `Yarn.post.mediaGrid(group, media)` lays out the images card: two rows at most, 1 big + up to 3 small (1 wide · 2 side by side · 3 = 1 + 2 · 4 = 1 + 3); past 4 the last small one wears **+N** (`.ypost__more`) and opens the lightbox at its own picture; the rest are hidden `[data-ylb]` thumbs (`thumbHTML(g, m, i, n, { hidden, more })`), one arrow away in the viewer. `?imgset=strip` (open): the second row is a `.ycar__strip` (`.ypost__strip`, ~3¼ thumbs wide). Live: components.html#image-sets.

**Colour swatches that are the thing (i9 · polish, S13):** `.ystub[data-stub]` (a pick's tag stub: twill / tan's knit, seam, eyelet; 34×44) and `.ynote[data-note]` (a sticky note: paper, gloss, curl, tape; 40×40) share the post's own `[data-stub]` / `[data-note]` colour rules. Add `.ysel` for the rope; it follows each shape's radius (`--ysel-r`). Studio's colour radios wear them.

**Tier colours (i9 · polish, S15):** a tier's `color` is a felt key (`TIER_COLORS`) or the owner's `#rrggbb`. `Yarn.post.tcAttrs(color)` → the attributes for anything tier-coloured (`data-tc="custom" style="--tc:#…"` + `data-tc-dark` when white reads better); `Yarn.post.setTc(el, color)` repaints one; `Yarn.post.tcDark(color)`. Rankings may carry `pics[name]` (a TierImages kind or an image URL) and `notes[name]` (the owner's line).

`Yarn.post(post, ctx)` → `article.ypost.ypost--<type>`: scratch (sticky note) · article (bookmark) · pick (a hang tag on a loop of yarn, `--ypost-mark` → its collection) · ranking (a mini felt board) · playlist (disc + swatch rows) · images (photo grid → lightbox). Every card heads with the **caps kicker** (type in its felt circle, then read time and date in the same Micro caps; `Yarn.post.typeBadge(key)` + `Yarn.badge.date`). Owner colours from the data: a scratch's note (`NOTE_COLORS`), a pick's stub (`STUB_COLORS`). A thing with a write-up shows the short write-up pill; a pick links its collection with words and an arrow. `Yarn.post.configure(ctx)` sets page data (collections, votes, comments, `about`, `writeups`); `inert: true` for previews. Rankings: `tierDefs` (custom tier names; ≤ 3 characters keep the square felt keys, longer ones become felt tabs). Also `Yarn.post.collMark(coll, picks)` (a collection's stubs mark, rails only), `aggregate`, `crowdTiers`, `miniBoard`, `swatch(key)`.

**Tracks from other services** (i9 · links, S2): a playlist track is the owner's own `{ src, title, by, dur }` or another service's `{ url, title, by, dur?, art? }` (`Yarn.post.isExt(t)`). Same row (`.ypost__track` + `.ytrkart`); the art is `Yarn.post.extArt(t, { size, radius })` → `.yxart`: the service's mark in its colour, or a picture from Media wearing the mark in its corner. ▶ (`?exttrack`, open decision): `inline` (default) plays it in its row with the service's own player (`.ypost__xemb`, one at a time on the page; it pauses the kit player, the kit player starting closes it; ■ closes it; offline: a finished card + "Open on …"); Bandcamp, and anything without a player, opens the song's page (↗); `open` makes every external row a link. "Play all" queues the owner's tracks only (`Yarn.post.queueOf(p)`; its hint says the others play in their rows); with no own tracks it opens the first external one. A page that plays the owner's tracks (Thoughts) skips `[data-xplay]` rows. `Yarn.post.linksRow(p)`: a post's links as small `dlink`s with the owner's text, the first thing in its foot. That covers the images post and, since i10, a pick, whose first link is named after its host (i9 used mono text links there).

**Track art** (`.ytrkart`, i7 follow-up): every song row's art carries its state, one part for Thoughts' playlist rows (`.ypost__track`) and Music's song lists (`.mu-trk`). Hover / focus → ▶ over the art; the current song → ▶ (paused) or ⏸ (playing) over it. No number column, no bars. The page swaps the glyph. Tokens `--ytrkart-r` (radius) and `--ytrkart-i` (glyph size). Big play buttons keep their word: "Play all", then "Pause" while playing, then "Play" when paused.

## 15b · Markdown + yarn blocks (`kit/blocks.js`, i9 · S3)
An article's or a write-up's markdown, with the kit's own parts between its paragraphs. One parser serves Studio's block editor and the site's renderer, so the editor shows what the page will show. `yarn.js` loads it after `posts.js`.
```js
Yarn.md(text, ctx?) → HTML                    // plain markdown through marked (when the page has it) or the kit's own renderer; yarn blocks as kit parts
Yarn.md.parse(text) → { blocks, tail }        // every block keeps its exact source (b.src) + the whitespace before it (b.sep):
Yarn.md.serialize(doc) → text                 //   serialize(parse(x)) === x. An edited block drops src and is written canonically.
Yarn.md.inline(md, { soft }) · fromDOM(el, { multi }) · escText(s)    // inline markdown ↔ HTML (bold, italic, code, strike, links, breaks)
Yarn.md.text(md) · words(md)                  // what a reader sees: Studio's word counts + read time
Yarn.md.KINDS · yarn(kind, data) · yarnData(block) · renderYarn(block, ctx) · about(ref, ctx)
// ctx: { about(ref), track(src), posts, postCtx, gallery: "strip" | "grid", group }   (Studio passes its own data: drafts resolve)
```
**The yarn directive** (storage stays plain markdown): an HTML comment saying what to draw, over the fallback markdown it draws from (the one block right under it, up to the next blank line). A renderer that ignores yarn blocks shows the fallback: a link, a list of songs, images, a quote.
```md
<!-- yarn:link -->                     [Source on GitHub](https://github.com/blaqat/dotnet) · [Visit site](https://blaqat.net)
<!-- yarn:link style=icon -->          [GitHub](https://github.com/blaqat) · [SoundCloud](https://soundcloud.com/blaqat)
<!-- yarn:images caption="Old drawings" -->   ![Sona, front view](/media/sona.png)   ← one per line
<!-- yarn:music title="Written to" -->  - [feline shores](https://music.blaqat.net/daw/feline-shores.mp3) · 2:41   ← one per line
<!-- yarn:mention ref=project:sonata --> [Sonata](https://blaqat.net/projects/sonata)
<!-- yarn:note color=pink -->           > The note's text, **markdown** works.
<!-- yarn:post id=tl1 -->               [My favorite browsers, ranked](https://blaqat.net/thoughts/tl1)
```
(each comment sits on its own line, its fallback on the next.) The fallback is the data (link text + URL, alt + src, title + audio URL + length, the note's text); the comment carries only what markdown can't (style, a ref, a post id, a colour, a caption). An unknown kind draws its fallback.

| kind | the kit part | |
|---|---|---|
| `link` | `Yarn.dlinks` row (the first red unless `plain`), or round `Yarn.linkIcon`s (`style=icon`) | brand-aware through the link recogniser |
| `images` | one: as wide as the text (`.ymd-fig`, opens the lightbox) · more: the media strip (`Yarn.carousel`), or the images post's grid with `?mdgallery=grid` (⚙, open) | one plain image with no caption is just `![alt](src)` |
| `music` | the playlist post's track rows (`.ypost__track` + `.ytrkart`) on a knit card; 2+ get a title line + Play all | rows play through `YarnPlayer` on the site |
| `mention` | the about pill (`Yarn.post.aboutPill(ref, ctx, { k })`, the small word = its kind) | refs: `project:` `release:` `post:` `post:<id>#<item>` |
| `note` | the scratch post's sticky note (`.ypost--sticky[data-note]`) | the note colours (`Yarn.post.NOTE_COLORS`) |
| `post` | any Thoughts post as its card (`Yarn.post`) | |

The prose rules (`.ydetail__text`, `.yprose`) keep out of yarn parts (`:where(:not(.ymd *))`, specificity unchanged), so each part looks as it does everywhere else.

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

**Open in i11** (⚙ "Open"; DESIGN-i11): `hw` = **500** · 400 (the heading weight: Display, Heading, Title; rule 3).

**Open in i10** (⚙ "Open"; DESIGN-i10 §8): `look` = **section** · ink (the colour roles, § 1a) · `stitch` = **calm** · full (controls flat at rest vs i8's stitches everywhere) · `font` = **nunito** · allo · allo-round (§ 2) · `shuffle` = **results** · player (where Play / Shuffle live; `player` shows the bar's shuffle toggle `.yp-bshuf`) · `taccent` = **ink** · red (Thoughts' accent under section, § 1a; i10 r2). All are set on `<html>` before first paint (`data-look` …) and readable as `Yarn.opts.*`. (`cardart` went in i10 r2: decided, i8's card.)

| Param | Decided | Earlier (⚙ only) | What |
|---|---|---|---|
| `toggle` | `red` (i10: = the **on** role) | `ink` · `tint` · `rope` | multi-select toggles' fill |
| `sel` | `rope` | `ink` | single choice: the rope on the edge |
| `rope` | `in` | `out` | the rope on the element's edge |
| `redbtn` | `twill` | `deep` | `.btn--red`'s red (moot since i10: `.btn--red` = the ink primary) |
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
Open (i9): `exttrack` = `inline` (▶ plays an external playlist track in its row) · `open` (opens it on its service) · `kit/posts.js`.
Review / demo params: `reduced=1` · `from=home` · `trp=0..1` · `lb=<group>:<i>` · `browse=open` · `fab=open` · `demo` · `player` · `rvnote`. Kit options `statusdate` (apart | joined: "WIP since Sep 2025" on Projects, Music and the player; `Yarn.opts.statusdate` is `cardMeta`'s default) and `pwipc` (red | gold player controls on a WIP song). Page options (Projects' `cardfacts`; Music's `trackmatch`, `pwip`; Thoughts' `cardwu`, `apager`, `aboutgo`, `collicon`, `wumark`, `minimarks`; Studio's `frame`, `layout`, `confirm`…) are listed in each page's ⚙ and `review/options-i7.js`.

## Also in the kit
- **`whenGone(el, fn)`** (internal, i9 · polish S1): runs `fn` once `el` has been in the page and then left it (swept with the list tools on DOM changes). The search's "/" shortcut, timelines, scribbles and folder tabs use it, so a view that's thrown away (Studio re-renders) takes its document listeners and observer targets with it.
`Yarn.Spring` (response / damping, interruptible) · `Yarn.springEasing({ response })` → `{ easing, duration }` · `Yarn.motion` (one timing table) · `Yarn.watchStuck(el)` · `Yarn.wireDetail` (auto) · `Yarn.sound(name)` · `Yarn.px("--token", el?)` · `Yarn.catSVG()` · `Yarn.esc / slug / hash / rng / clamp / uid` · vocab + format: `Yarn.status / type / instrument`, `Yarn.dateRange(item)` ("Sep 2025 – now", "Mar – Aug 2025"), `Yarn.duration`, `Yarn.fmt.{month, day, full, monthLong, time}`, `Yarn.byYear`, `Yarn.yearOf`, `Yarn.parseDate`. The building blocks behind the post kicker (`Yarn.badge.type`, `Yarn.badge.date`) and the Earlier `cardmeta=badges` / `ongoing=ribbon` looks (`Yarn.badge.*`, `Yarn.meta`, `Yarn.stack`, `.yribbon`) are still in the code for those comparisons; don't build new UI on them.
