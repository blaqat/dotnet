# Iteration 7 · shared brief for every agent

Same setup as `BRIEF-i6.md`. Read it for the owner rules, the parallel-editing rules and the Playwright setup; those still apply. This file replaces its ownership table and adds to its checking. Work only in `/Users/blaqat/dev/projects/my-litterbox/design/redesign/v3-yarn-7/`. Don't commit.

## Read first
1. `FEEDBACK-i7.md`, the spec: the Decided table and the build list (IDs B, K, P, M, T, S, C, W).
2. `_feedback/roundup-i6.md`, the owner's words for your items, and the three `_feedback/owner-i6-*.png` screenshots.
3. `kit/COMPONENTS.md` and `LAYOUT-i6.md`.

## Why i7 checks differently
In i6, three visible bugs passed every check: a tag browser that couldn't be closed, track-row buttons that didn't line up, and a washed-out Play button with its hint covering a neighbour. The owner was rightly unhappy. Error/overflow/layer checks don't catch these, so for i7 they are not enough on their own.

## Ownership (wave 1)

| Agent | Owns |
|---|---|
| **site** | the sound tag + `kit/sound.js`, the detail shell's sticky bar (`wireDetail`, `.ydetail__top`), the ⚙ panel and `KIT_GROUPS`, cut-option removal in the kit (K1–K3) |
| **projects** | `projects/` cards, timeline, grid; `Yarn.cardMeta`, `Yarn.fact`, `.ybadge*` type colours; P1–P6 |
| **music** | `music/`, folder cards, `kit/player.js` (incl. the long-press actions); B1, B3, M1–M5 |
| **thoughts** | `thoughts/`, `kit/posts.js`, `kit/thoughts-data.js`; B2, T1–T6 |
| **studio** | `studio/` (all of it); S1. Use kit components; if you need a kit change, keep it small and anchored and list it |

The kit hint popup, `Yarn.layer()` and `Yarn.toast` belong to nobody this round. Use them as they are, and make only small anchored fixes if you must.

## Checking: everything in BRIEF-i6 › Checking, plus
- **Interaction tests (mandatory).** For every control you add or change, and every control in the bug you fix, write a Playwright test that uses it like a person would and asserts the result:
  - click / tap
  - keyboard (Tab, Enter / Space, Esc)
  - open → close by every route (✕, Esc, outside click, choosing)
  - reopening
  - a second rapid click

  Keep the tests in `/Users/blaqat/dev/temp/r3i7-<agent>/` and list them in your report with pass counts.
- **Visual checks that numbers miss:**
  - *Repeated rows and cards:* the same column (button, duration, stack row, title) sits at the same x and baseline in every row; assert it.
  - *Close buttons and hints:* every close / ✕ is fully inside its container and clickable; a hint never covers another control.
  - *States:* nothing that is enabled looks disabled.
- **Look at your shots at 1:1 crop,** not just whole pages. Compare them with `_feedback/owner-i6-*.png` where relevant.
- `node _tools/overflow.mjs` (18 widths) and zero page or console errors, as before.

## Report back (≤ 400 words)
- Each item by ID: done, partial or skipped.
- Interaction tests: names and pass counts.
- Every ⚙ option you added, decided or cut.
- Changes outside your area.
- Questions for the owner as round-up questions: question, options, recommendation.
