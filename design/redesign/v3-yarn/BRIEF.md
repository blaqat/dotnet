# blaqat.net redesign · Round 3 · "Yarn"

Root: `design/redesign/v3-yarn/` (inside `~/dev/projects/my-litterbox`, the current Astro + Svelte site).
These are **static HTML mockups** (no build step), opened straight from disk. Not production code.

## Where we are

- **Round 1** (sea glass, WebGL glass material): rejected as too much.
- **Round 2** (kept the current white-card + pastel-orb look, made cuter): explored. The owner liked:
  1. the **Projects desktop layout**: a list on the left and a sticky "stage" on the right showing the selected project large (hero media over a blurred backdrop of the same image, a filmstrip, then details). Selection follows hover with a ~160 ms intent delay, click, and ↑/↓ or j/k. The URL follows the selection.
  2. the **music player opening up** to show more metadata and controls, but it "needs to be designed way more intentionally".
  3. the **hover effects** on home nav buttons (round 2 released little icons from the button).
- Rules carried from earlier rounds: **no modals** (things open in place), mobile-first with a distinct desktop layout at **≥ 960 px**, nav and player in the bottom thumb zone on mobile, one global player that never restarts, filters where **none selected = show all**, tapping a filter solos it, more taps add, tapping a selected one removes it.

## Round 3 direction (the owner's words, lightly cleaned up)

> Lean into a basic color set of **black, red and white** with more interesting **textures based on yarn**, similar to Kirby's Epic Yarn. It should still feel **modern/minimal, just a little better**.
>
> Section pages tie into their color with **red as the accent**. Everything feels textured, including the background. Maybe the **outline frame of the page is the section color in a rolled texture and inside is a white diamond yarn texture**. No more blue blobs floating around.
>
> Pages should be more **content-centric** and fit more content on screen. Right now it's rows of 3 or 2 when more could fit.
>
> Mobile nav can be textured differently, maybe **brown something instead of glass**, same with any element on the page.

Reference screenshot of the vibe (do not copy its art or characters): stitched dashed borders just inside every edge, a red twill ribbon, a rope outline that hugs the selected menu item, felt and knit surfaces, soft fabric shadows. It is an **original** yarn/textile design language: no Nintendo characters, logos or assets.

## The kit (use it, don't edit it)

Include in every page:

```html
<link rel="stylesheet" href="../kit/yarn.css">
<script src="../kit/data.js"></script>          <!-- window.BLAQAT = { projects, music } (real site data) -->
<script src="../kit/thoughts-data.js"></script> <!-- window.THOUGHTS (Thoughts pages only) -->
<script src="../kit/yarn.js" defer></script>    <!-- window.Yarn, <yarn-nav>, Yarn.mockPanel -->
```

Open `kit/kit.html` to see every material. Read `kit/yarn.css` and `kit/yarn.js` before you start; they are short.

- **Palette:** `--ink` #1f1e1e (logo black), `--cotton` warm white, `--red` #d62f38 (fills, ribbons, rope), `--red-deep` (red text on white). Section frame colors: projects `--blue`, music `--purple`, thoughts `--gold`, home `--red`. Set `data-section` on `<html>` and `--sec / --sec-deep / --sec-soft` follow. **Section color goes on the frame and small accents only. Red stays the interactive accent everywhere.**
- **Materials:** `.m-knit`, `.m-diamond` (inner sheet), `.m-cord` (rolled cord in section color, the page frame), `.m-ribbon` (red twill), `.m-felt` (set `--felt`), and brown `.m-corduroy / .m-suede / .m-cork / .m-burlap`.
- **Page shell:** `<body class="frame"><main class="sheet">…</main></body>`. The sheet is the white diamond-knit page with a stitched inset edge; the frame is cord in the section color. `?from=home` plays the sheet "unroll" entrance (handled by yarn.js).
- **Stitches & rope:** `.stitch` (dashed running stitch inset from the edge, follows border-radius), `.patch` (default card: white knit + stitch + soft shadow), `.rope` (a twisted red rope that sews itself around an element on hover/focus or with `.is-roped`; tune with `--rope-w`, `--rope-gap`, `--rope-radius`, `--rope-a/-b`).
- **SVG yarn strokes:** draw a path twice, `.ply-base` then `.ply-twist`, same `d` and `stroke-width`, to get a twisted-yarn line.
- **Controls:** `.btn` (+ `--red`, `--ink`, `--sec`, `--ghost`), `.chip[aria-pressed]`, `.tag` (+ `--red`, `--sec`).
- **Type:** Nunito (display, 800–900, negative tracking at large sizes), system-ui body, JetBrains Mono for metadata (`.meta`). Classes `.h1 .h2 .h3 .eyebrow .meta .muted`.
- **Nav:** `<yarn-nav active="projects|music|thoughts" base="../"></yarn-nav>` renders the desktop top bar and the mobile bottom bar. Mobile bar material via `?nav=corduroy|suede|cork|burlap`.
- **Variants:** expose every option you design through a URL param and register it with `Yarn.mockPanel([{ label, param, options: [[value, label], …], default }])`. A reviewer must be able to reach every state by URL.
- Icons: Phosphor (`<i class="ph ph-play">`, `ph-fill`, `ph-bold`) are loaded by yarn.js.

**Ownership:** don't modify `kit/yarn.css`, `kit/yarn.js`, `kit/data.js` or `kit/thoughts-data.js`. Put page CSS/JS in your own files. Two shared files have owners: `kit/notes.js` (home agent: falling-note burst, reusable) and `kit/player.js` (music agent: the global `<yarn-player>`). Anyone may include them guarded (`window.Notes?.burst`, an undefined `<yarn-player>` renders nothing). If you think the kit needs a change, do it locally and say so in your report.

**Media:** data paths look like `/media/x.png`; map them to `../media/x.png`. Files that exist in `media/`: sona.png, sona-different.png, sona-auri.png, rawsy.png, site-plan.png, beepsearch.png, portal-student.png, portal-coach.gif, bankresult.png, fitr-redesign.gif, wsg.mp4, webcheckers.mp4, blaqat.svg (the cat logo), nina.jpg (the owner's cat). Anything else (big mp4s) is missing: show a tidy poster placeholder, never a broken image.

**Libraries:** plain HTML/CSS/JS. If you need a library, load it only from cdnjs.cloudflare.com, cdn.jsdelivr.net/npm, or unpkg.com with an exact version (e.g. `marked@12.0.2`). Fonts only from Google Fonts. No other network calls.

## Craft rules (Apple fluid-interface principles, web edition)

- Feedback on **press**, not release (`:active` scale .97, 100 ms). Hover never shifts text or layout.
- Motion is **interruptible**: animate from the current on-screen value. Use springs for anything the hand touches; critically damped by default, a little bounce only after a flick or throw. Hand off release velocity; project momentum to pick snap points; rubber-band at edges.
- **Spatial consistency:** things open from their trigger and close back into it. No modals.
- Animate only `transform`/`opacity` (and clip-path/mask where needed). Keep textures static; don't animate big `feTurbulence` surfaces.
- **Reduced motion** (`prefers-reduced-motion` or `?reduced`): cross-fades and static end states, no particles, no drifting.
- **Accessibility:** WCAG AA contrast for text (check text on textures and on the section frame), visible focus, everything keyboard-operable, real buttons/links, `aria-pressed`/`aria-expanded`/`aria-current`, 44 px touch targets, alt text, no information carried by color alone.
- Typography: tight negative tracking on big display type, ~0 on body, `rem` spacing.
- "Modern/minimal, just a little better": the **textures carry the play**; layout and type stay calm. Density matters: show more per screen than the current site.

## Checking your work

`_tools/shot.sh <page?query> <out.png> desktop|mobile|WxH [wait_ms]` screenshots with headless Chromium (desktop 1440×900, mobile 390×844 @2x). Save to `_shots/<your-area>-*.png`, **look at them**, and iterate until both sizes look intentional. Use `WxH` (e.g. `1440x2200`) for long pages. For animations, take shots at several `wait_ms` values or expose a `?t=<ms>` / `?state=` param that freezes a moment.

## Report back (≤ 250 words)

What you built, file paths, every URL param and what it shows, the screenshots you took, decisions you made on the owner's open questions, and known gaps. Don't commit to git.
