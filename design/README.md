# Yarn design system (Elyx)

The round 3 "Yarn" redesign as an atomic Elyx design system. **i9 is the
base; i10 and i11 are layers on top of it.** Conventions, iteration
mechanics and verified Elyx gotchas are in [`SYSTEM.md`](SYSTEM.md). Read it
before editing.

The HTML mocks in `redesign/v3-yarn-*` are the frozen reference. Don't edit them.

## Where things are

| Folder | What |
|---|---|
| `tokens/color/` | `palette` (raw), `sections` (+ one file per section), `roles` (+ `-i10`, `-i10-<section>`) |
| `tokens/type/` | `sizes`, `faces`, `tracking`, `leading` (+ `-i10`, `-i11`) |
| `tokens/space/` | `steps`, `layout`, `radii`, `controls` (+ `-i10`, `-i11`) |
| `components/atoms/` | text roles, surface (patch, stitch, rope, disc), art, logo, eq bars |
| `components/molecules/` | button, play button, link disc, +, chip, tag (+ a project's stack row), fact, field, search, segmented, year pill, feedback, folder tab, nav tab, keyword, stack badge, section button, sound tag, sections pill, media thumb, prose blocks |
| `components/organisms/` | nav, page header, sheet, folder card, track row, results line, music tools, player, project (card + row), project tools, detail shell, project detail + article (both the detail shell + prose), post card, thoughts tools, home intro / links, studio chrome / parts / dashboard / editor / preview / article, phone nav (knobs, sections menu, search in the slot, the floating layer's states), phone player (disc, page, queue rows) |
| `blocks/` | music grid, projects grid, thoughts feed, home hero, studio dashboard / music editor / article editor; phone frames (390 × 844): `phone-home` (`homePhone`), `phone-music` (`musicPhone` + I10 / I11, `musicPhonePlayer`), `phone-projects` (`projectsPhone`), `phone-thoughts` (`thoughtsPhone` + I10 / I11), `phone-studio` (`studioPhone` + I11) |
| `screens/` | one page per site section, every iteration side by side (rows = screens, columns = i9 · i10 · i11, each board labelled): `home` (desktop, phone), `music` (grid 1440, grid 1000, phone, phone with the player open), `projects` (grid, item page, phone), `thoughts` (feed, article, phone), `studio` (dashboard, music editor, article editor, phone) |
| `assets/` | fonts (Nunito, Nunito Sans), Phosphor icons, covers, textures, stack logos |

## How to iterate

- **Change a value everywhere:** edit the token. Edit the base file to
  change i9 and everything after it. Edit the `-i10` or `-i11` file to
  change only that iteration onward.
- **See any file in any iteration:** `elyx render <file> --context i10=on --context i11=on`
  (add `--context section=music`). In the Elyx app, switch the canvas
  context (axes `i10`, `i11`, `section`).
- **Structural change in one iteration:** add an iteration variant to the
  component (`…I10` / `…I11`, with `@context`), and pick it from the parent's
  iteration variant with `@with-variant`. See SYSTEM.md.
- **Start i12:** add `@context(i10=on, i11=on, i12=on)` token files deriving
  from the `-i11` groups, register them from those groups, and give every
  board on the screen pages an `…I12` contextual variant deriving from its
  `…I11` (registered by it), placed in a fourth column.

## Checks

```bash
cd design
elyx diagnostics          # whole project: currently 0 errors, 0 warnings
```

Assets: application artwork imports through `@site-assets/assets/…`, public
files through `@public-assets/…` (workspace dependencies in `elyx.json`).
