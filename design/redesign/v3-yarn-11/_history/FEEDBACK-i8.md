# Iteration 8 · the last one: decided defaults + a dark-theme mock

Owner's i7 round-up, word for word: `_feedback/roundup-i7.md`. Their message: "for the last iteration lets just do all my defaults as i selected but i want to see a mocked dark theme im curious what it might look like".

i7 (with its post-handoff follow-ups 1–12 in `../v3-yarn-7/FEEDBACK-i7.md`) is the base; `v3-yarn-7/` stays frozen. Review store: `yarn.review.i8`.

## Decided

| Option | Decided | Note |
|---|---|---|
| `statusdate` (kit) | **joined** | "Completed Dec 2024", "WIP since Sep 2025" on Projects, Music and the player; `apart` → Earlier |
| `phrow` (kit) | **card** | phone lists are slim cards with two lines of text and the + · ▶ foot; `row` → Earlier |
| `pwipc` (kit) | **gold** | the player's red turns WIP gold while an ongoing song plays; `red` → Earlier |
| `cardfacts` (Projects) | **words** | (confirmed) |
| `mart` (Music) | **apart** | (confirmed) the play button stays beside the art |
| Every other ⚙ option | its current default | |
| The 18 unanswered i7 questions | the recommended answer | Only one changes anything: **grid-lone-years → merge** (below). The rest were already built as recommended: phone-type-word keep the word · no-audio label · wip-colour gold · wip-cards disc (with joined, cards say "WIP since …" anyway) · coll-count text · coll-page-stubs keep · rail-900 leave · off-tag-line keep · panel-outside Esc only · queue-remove on hover · tagpop-browse keep · empty-wording one style · studio-live-toast View only · studio-plus red · studio-label hide the label |

## Build list

- **D1 · grid-lone-years → merge** (done by the orchestrator): the unfiltered Music grid folds years with 1–2 releases into a shared row (kit `Yarn.gridYears` fold, `on: true` on Music's grid): "2022 – 2025 · 8 releases", "2017 – 2020 · 10 releases". No card sits alone on a mostly empty row.
- **DK · a mocked dark theme** (dark-theme agent, `BRIEF-i8.md`): one kit option `?theme=light|dark|auto` (Open, every page, default light). The whole site, the player, Studio and the review tools, in the same yarn language on a dark ground. Light stays pixel-identical.

## Done (2026-11-16)
- **D1** grid-lone-years → merge: the unfiltered Music grid reads "2022 – 2025 · 8 releases", 2021, "2017 – 2020 · 10 releases".
- **DK** the dark-theme mock (`?theme=light|dark|auto`, ⚙ › Open › "Theme (dark mock)", every page, default light):
  - `kit/theme.js` sets `<html data-theme>` before first paint and loads the dark files only when needed. `auto` follows the OS live, and links carry `?theme` while dark is on.
  - `kit/dark.css` holds the tokens and the hand-made decisions.
  - `_tools/dark-gen.mjs` writes `kit/dark/*.gen.css`, a dark copy of every colour rule that loads right after its source. **After any light CSS edit, rerun `node _tools/dark-gen.mjs`.**
  - Palette:
    - surfaces: sheet `#211f1e` · recessed `#1a1918` · cards `#2c2a28` · raised `#36332f`
    - text: `#ece6dc` / `#cdc5b9` / `#b9b0a4`
    - red stays, red text `#ff8a8f`
    - ink as a material `#121111`
  - Light is byte-identical to before. The only differences are the intended additions: the components toggle and the round-up's Theme decision.
  - Dark passes AA across 12,266 measured text runs and icons. 10 leftovers are probe artifacts, each checked by eye.
  - Screenshots: `~/dev/temp/r3i8-dark/shots/` (light|dark pairs of every page and Studio screen, desktop + phone, plus states).
  - Not themed: the Earlier sheet backgrounds (intarsia / quilt / speckle), `gallery.html`, `kit/kit.html`, `mnav.html`, the test pages.
- Round-up: Theme is the only open option; two questions (`dark-ship`, `dark-sheet`).
