# Yarn design system in Elyx: conventions

The Yarn redesign (round 3) as an atomic Elyx design system. **i9 is the base.**
i10 and i11 are layers on top of it, never copies. The HTML mocks in
`redesign/v3-yarn-*` are the reference. Each iteration's `kit/components.html`
and `kit/COMPONENTS.md` is the inventory to start from. Specs:
`redesign/v3-yarn-10/DESIGN-i10.md`, `redesign/v3-yarn-11/DESIGN-i11.md`,
`redesign/v3-yarn-9/BRIEF-i9.md`, and the `FEEDBACK-i*.md` beside them.

## Iterations are contexts

| iteration | canvas context | what it means |
|---|---|---|
| i9 | none (default) | the base: the i9 kit (i8 site look, red everywhere) |
| i10 | `i10=on` | colour roles + state ladder, six type roles, equal gutters |
| i11 | `i10=on, i11=on` | 13 type/spacing rules, isometric insets, nested radii |

A second axis, `section=home|projects|music|thoughts|studio`, sets the
section hue (the cord frame in i9; section-coloured roles from i10).

Render a file in an iteration without editing it:

```bash
elyx render components/molecules/button.elyx --context i10=on --context i11=on -o /tmp/x.png
```

### How a difference between iterations is expressed (in this order)

1. **A token.** Anything that is a value (colour, size, weight, family,
   tracking, leading, spacing, radius, control height) is a token in
   `tokens/`, with `-i10` / `-i11` context files. A component that reads the
   token changes by itself. This is the default: prefer adding a token
   member to adding a variant.
2. **An iteration variant**, only for a structural change (a child added,
   removed, moved, or a layout change that no token can express). In the
   same file as the source:

   ```elyx
   @variants(folderCardI10)
   export folderCard = frame { … }

   @variants(folderCardI11)
   @context(i10=on)
   export folderCardI10 = frame : folderCard { … only what changed … }

   @context(i10=on, i11=on)
   export folderCardI11 = frame : folderCardI10 { … }
   ```

   Each iteration variant derives from the previous iteration, carries the
   cumulative `@context`, and is registered by its direct source.
3. **Nested instances do not switch on context by themselves.** When a
   parent's iteration variant contains a child that has its own iteration
   variant, the parent's variant picks it explicitly:

   ```elyx
   @context(i10=on)
   export folderCardI10 = frame : folderCard {
     @with-variant(play.playButtonI10)
     playBtn {}
   }
   ```

   Top-level instances on a screen do switch automatically.

## Elyx facts learned the hard way (verified)

- **Aliases are static.** A token that aliases another (`live: sec`) keeps
  the source's value in every context. So contextual token files restate
  every member they change, with a reference into `tokens/color/palette.elyx`
  (which never varies).
- Reserved words: don't name a token group or import alias `type` or
  `color`. Use the aliases below.
- Fonts need `use` statements (the `fonts.include` setting does not load
  them). `components/atoms/text.elyx` has them. Every file that has its own
  text layers instead of text atoms must add the same two `use` lines.
- Unicode is not used for icons. Phosphor SVGs are in
  `assets/icons/{regular,bold,fill}/<name>.svg` (the names the mocks use,
  without `ph-`). More are in the npm package `@phosphor-icons/core@2.1.1`
  (unpacked at `/tmp/phosphor/package/assets/`). Import and tint:
  `import "assets/icons/fill/play.svg" as playIcon` and then
  `asset {contents: playIcon, width: 18px, height: 18px, fill: col.roles.fg}`.
- Context layer variants render in their own context, so a library file
  can show base, i10 and i11 side by side.
- Reserved layer / alias names: `type`, `color`, `icon`, `text`, `group`.
- A variant that overrides only `left` (or only `top`) is re-centred on the
  other axis. Always set both on a variant.
- `opacity(token, a)` is baked at the base value and ignores context. Use a
  palette colour with alpha, or `opacity` on a child layer.
- `elyx normalize` silently drops whole-map overrides (`shadow[1].drop-shadow: {…}`),
  `subrange: []` and `subrange: .nil`. Override leaf paths
  (`shadow[1].drop-shadow.blur-radius`, `subrange[0].fill[0].color`) and keep a
  list the same shape, toggling `visible`.
- `insert(a, b, after = …)` is an error: one `insert` per child. An instance
  can't set `children:`; add with `overrides: [insert(...)]`.
- No ellipsis truncation, no flex-grow (use `width: 100%` + clip), no SVG
  `<pattern>`, `transform` is ignored inside a stack, `space-between` ignores
  `item-gap` when hugging.
- Children inserted into a nested slot (e.g. the sheet's `paper.page`) must
  be overridden at their tree position: `paper { page { @with-variant(…) grid {} } }`.
  At the root the override silently does nothing.
- `width: .nil` on an instance of a variant keeps the variant's width; use
  `width: 100%` to stretch.
- A text layer's `max-height` is ignored inside a grid: wrap it in a
  clipping frame.
- A colour SVG on an `asset` is tinted all over unless `fill[0].visible: .false`.
- Don't set a nested part's words at the card level: switching the card to
  another variant brings the card-level words back.
- No `text-wrap: balance`: balanced headings are explicit line breaks.
- Don't `elyx normalize` the token files (it strips comments and rewrites
  units), and re-normalizing the i10/i11 Music and Projects screens grows
  the cord texture's `sizing.scale` each time: normalize those once, or not.
- Board-level layers in a library file must not overlap. Give every exported
  source and variant its own `top` / `left`, at least 48px apart.
- Expressions (`a + b`) and tokens inside a list (`rows: [1fr, spc.…]`)
  are baked at the base value: they ignore the i10 / i11 context.
- A property override written next to a `@with-variant` on a nested part
  is dropped when an ancestor's variant is switched (the pick survives):
  restate the property in the ancestor's variant.
- `elyx normalize` drops comments inside an instance's override blocks:
  put the note in the declaration's header comment.
- A hidden layer still counts toward the render's bounds: a hidden child
  that sticks out (a variant's `display: .none` media) widens the image.
  Remove it (`overrides: [remove(…)]`) instead.

## Import aliases (use these exact names)

```elyx
use "assets/fonts/Nunito[wght].ttf"                       // only if the file has raw text layers
use "assets/fonts/NunitoSans[YTLC,opsz,wdth,wght].ttf"
import "tokens/color/palette.elyx" as pal     // pal.palette.*   raw colours (content colours only)
import "tokens/color/roles.elyx" as col       // col.roles.*     every accent / text / surface colour
import "tokens/color/sections.elyx" as sec    // sec.section.sec / sec-deep / sec-soft
import "tokens/type/type.elyx" as typ         // typ.sizes / typ.faces / typ.tracking / typ.leading
import "tokens/space/space.elyx" as spc       // spc.steps / spc.layout / spc.radii / spc.controls
import "components/atoms/text.elyx" as txt    // txt.display, txt.title, txt.titleCard, txt.metaCard, …
```

Components import other components by file, for example
`import "components/molecules/button.elyx" as btn`.

## Atomic layout of the project

```
tokens/      colour, type, space (+ -i10 / -i11 context files)
components/
  atoms/       text roles, surfaces (patch, stitch, rope), disc, icon glyph helpers
  molecules/   button, play button, link disc, chip, tag, fact, field, search, pill, tab, toast…
  organisms/   nav, page header, folder card, project, detail shell, post cards, track row, player…
blocks/      page sections composed of organisms (music grid, filters + results line…)
screens/     one page per section (home, music, projects, thoughts, studio):
             every screen of it, i9 · i10 · i11 side by side, labelled
```

- **Text:** every text layer is an instance of a `txt.*` role
  (`frame : …` for frames; for text, `name = text : txt.titleCard {contents: "…"}`).
  Never set a font size, family, weight or tracking on an instance.
- **Colour:** only `col.roles.*` (and `sec.section.*` for the frame). Use
  `pal.palette.*` only for content colours (project types, instruments,
  tiers). No hex values in components.
- **Spacing and radii:** `spc.*` tokens only. If the mocks use a value that
  has no token, add a member to the token group (and to the `-i10` / `-i11`
  files if it differs there). Don't write raw px in components, except 0 and
  1–2px hairlines.
- **Stacks**, `.auto` sizing and `item-gap` for layout. Freeform only for
  overlays (stitch, rope, badges).
- **Variants** for states (rest / hover / on / selected / live / current)
  and sizes (sm), registered with `@variants(...)` on the base. State names
  follow the kit: `…On` (toggle on), `…Picked` (single choice, the rope),
  `…Live` (playing), `…Current` (loaded and paused), `…Sm`.
- **Each component file** lays out its sources and variants as a readable
  specimen sheet: rows by component, states left to right, with
  `title:` on each exported source.
- **The states page** (every file in `components/` and the phone blocks):
  after the line `// ==== states page …` come `lbl-<symbol>` /
  `note-<symbol>` (doc labels over each definition), then the boards:
  local `<key>States` (a `doc.docBoard`; one `st-<symbol>` spec per state,
  in `row-N`), with `<key>StatesI10` / `…I11` registered on it (they pick a
  state's `…I10` / `…I11` at `body.row-N.st-<symbol>.slot.it`) and, for
  section variants, `<key>States<Section>` (+ `I10` / `I11`). A new state:
  give the variant its own `left` / `top` clear of the others, add its
  `lbl-` text above it and an `st-` spec to the board.
- **Interaction states** follow the kit: `…Hover` (the lift shadow),
  `…Focus` (insert `surf.focusRing` as the last child, pinned
  `spc.layout.focus-out`), `…Disabled` (opacity .5, no shadow).
- **Visible labels (owner's rule).** The Elyx canvas truncates layer titles
  ("Pl…"), so every specimen, state, board and screen gets a visible text
  label above it, using `components/atoms/doc.elyx`: `doc.spec` (label +
  slot), `doc.specRow`, `doc.specHeading` / `specSubheading`, `doc.iterTag`,
  `doc.docBoard`. Doc atoms use static palette colours and fixed type so
  they never change with the iteration. Never use doc atoms inside product
  components.
- **Screens: one page per screen, all iterations on it** (owner's rule).
  `screens/<page>.elyx` holds the page in i9, i10 and i11 side by side
  (desktop 1440, plus phone 390 where it exists), each under a doc label.
  Studio is one page (`screens/studio.elyx`) with all its screens.
  The file sets only the section: `@with-context(section=music) file {}`.

### Iterations side by side on one page (verified)

An instance of an imported contextual variant does NOT keep that variant's
context. What works: a wrapper declared in the page file itself, with local
contextual variants registered on it. Those render in their own context:

```elyx
@with-context(section=music)
file {}

@variants(musicGridI10, musicGridI11)
musicGrid = frame : doc.docBoard {            // i9 (base)
  left: 0px, top: 0px,
  boardHead { boardTag { iterName {contents: "i9"} } boardCaption {contents: "Music · grid"} }
  body { overrides: [insert(page)] }
  page = frame : musicScreen.musicPage {}
}

@context(i10=on)
musicGridI10 = frame : musicGrid {           // renders with i10 tokens
  left: 1700px, top: 0px,
  boardHead { boardTag { iterName {contents: "i10"} } }
  // structural i10 changes: pick the children's I10 variants here
}

@context(i10=on, i11=on)
musicGridI11 = frame : musicGridI10 { left: 3400px, top: 0px, boardHead { boardTag { iterName {contents: "i11"} } } }
```

The same pattern makes a component's **states board** show every state in
every iteration: a local `…States` frame of labelled specimens plus
`…StatesI10` / `…StatesI11` contextual variants of it.

## Composition (owner's rules)

- **Same thing, different layout = one component.** A project shown as a
  card and as a row is one `project` component with a layout variant, not
  two components. Don't split what differs only by arrangement.
- **Shared anatomy = shared parts.** An opened article and a project's item
  page are built from the same detail parts (header, facts, media figure,
  prose blocks, link row). If two organisms would draw the same element,
  that element is a molecule/organism both import.
- **Where they are.** `organisms/project.elyx`: `project` (the card),
  `projectRow` (+ `…Picked`), `projectText` (no media), `projectI10`.
  `organisms/detail.elyx`: the shell `detail` / `detailLg` (+ `…I10`) and
  its parts (`detailBar`, `detailHead`, `detailTitle`, `detailDek`,
  `detailMedia`, `linkRow`, `asideFact`, `tocItem`). `molecules/prose.elyx`:
  the prose blocks. `molecules/media-thumb.elyx`: every media thumb (card,
  row, strip, an images post). `tg.tagStackRow`: a project's stack.
  `project-detail.elyx` and `article.elyx` are the shell + content: they
  insert media and prose into `column.body` / `column.body.prose`.
- **Mobile is part of the system:** phone nav, the phone player and phone
  layouts are components like any other.

## Checks before you finish

```bash
cd design
elyx normalize -w <each changed file>
elyx diagnostics            # whole project: 0 errors, no new warnings
elyx render <file> -o /tmp/<you>/x.png                                   # i9
elyx render <file> --context i10=on -o /tmp/<you>/x10.png                # i10
elyx render <file> --context i10=on --context i11=on -o /tmp/<you>/x11.png  # i11
```

Look at every render next to the matching mock before you call it done.

### Screenshot a mock for reference

```bash
cd design/redesign
export CHROME_SHELL=~/Library/Caches/ms-playwright/chromium_headless_shell-1194/chrome-mac/headless_shell
bash v3-yarn-11/_tools/shot.sh "$PWD/v3-yarn-11/music/index.html?view=grid" /tmp/<you>/ref.png 1440x1200 8000
```

Pass an absolute path. Query params select states (see each iteration's
`index.html` for the links). `kit/components.html` shows every part in
every state. Keep renders and screenshots in `/tmp`, never in the repo.
Never edit anything in `redesign/`: it is the frozen reference.
