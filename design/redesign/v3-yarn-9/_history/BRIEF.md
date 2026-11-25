# blaqat.net redesign · Round 3 "Yarn" · Iteration 2

Root: `design/redesign/v3-yarn-2/` inside `~/dev/projects/my-litterbox` (the owner's current Astro + Svelte site; its source is in `src/`, live at https://blaqat.net).
Static HTML mockups, no build step, opened straight from disk. Not production code. Iteration 1 is frozen at `../v3-yarn/`; don't edit it.

**Read `FEEDBACK-i2.md` first, all of it.** It holds the owner's review word for word, and the images it cites are in `_feedback/`. Every bullet in your area must be handled or explicitly reported as not done.

## What changed since iteration 1

The owner loved the direction ("GREAT start") but said **"having multiple subagents create the pages from scratch created discrepencies between the pages"**. Iteration 2 is about cohesion:

1. **Kit first.** One agent builds every shared part in `kit/` (below) with a showcase page. Page agents start after it lands.
2. **Pages use the kit, they don't re-invent it.** If a page needs a title, a filter row, a search field, a tag, a status/type/date/stack badge, a year separator, a timeline, a lightbox, a media carousel, a detail page, hover/selected states, or an instrument swatch, it uses the kit version. Page-local CSS may position and lay out kit parts, never restyle them.
3. **Page agents don't edit kit files.** If a kit part is missing something, add the smallest page-local extension with a `/* KIT-CANDIDATE: … */` comment and list it in your report. The orchestrator merges candidates afterwards.

## Direction (unchanged)

Black, red and white with yarn/textile materials (an original design language inspired by the *feel* of yarn games; no Nintendo characters or assets), still modern and minimal. Every page is a white knit sheet inside a rolled cord frame in its section color: home red, projects blue, music purple, thoughts gold. Red is the interactive accent everywhere. Mobile-first with a distinct desktop layout at ≥ 960 px. One global music player that never restarts. Filters: none selected = show all; tapping one solos it; more taps add; tapping a selected one removes it. Media lightboxes are allowed (they open from the thumbnail and close back into it); everything else opens in place or as its own page.

## The kit

Include on every page exactly as `kit/COMPONENTS.md` § Include shows. Note **`yarn.js` is loaded without `defer`** (it gates the arriving-page transition before first paint); your own page script uses `defer`:

```html
<link rel="stylesheet" href="../kit/yarn.css">
<script src="../kit/data.js"></script>          <!-- window.BLAQAT = { projects, music } (real site data) -->
<script src="../kit/thoughts-data.js"></script> <!-- window.THOUGHTS (where needed) -->
<script src="../kit/yarn.js"></script>          <!-- NO defer. window.Yarn, <yarn-nav>, Yarn.mockPanel, all components -->
<script src="your-page.js" defer></script>
```

`kit/components.html` shows every shared part in every state; `kit/COMPONENTS.md` documents the markup and JS API. **Read both before building a page.**

Ownership:

| File(s) | Owner |
|---|---|
| `kit/yarn.css`, `kit/yarn.js`, `kit/components.*`, `kit/COMPONENTS.md`, `kit/lightbox.js`, `kit/swatch.js`, other new shared kit files | kit agent (phase 1); afterwards the orchestrator |
| `kit/bg/*` | background agent (sheet background options, loaded with `?bg=`) |
| `kit/sound.js`, `kit/sounds/*`, `research/SOUNDS.md` | sound agent; everyone calls `window.YarnSound?.play(name)` |
| `research/cat-animation.md` | cat-animation research agent |
| `kit/notes.js` (falling paper-note burst) | home agent |
| `kit/player.js` (global `<yarn-player>`) | music agent |
| `home/*`, `projects/*`, `music/*`, `thoughts/*`, `studio/*` | the matching page agent |
| `kit/data.js`, `kit/thoughts-data.js` | read-only (page agents may add mock-only data in their own files) |

**Media:** data paths look like `/media/x.png`. Images exist in `media/` (sona.png, sona-different.png, sona-auri.png, rawsy.png, site-plan.png, beepsearch.png, portal-student.png, portal-coach.gif, bankresult.png, fitr-redesign.gif, wsg.mp4, webcheckers.mp4, blaqat.svg, nina.jpg). **Every other video exists in the repo at `../../../../public/media/*.mp4`** (relative to a page folder like `projects/`): use those so video controls and sound can be tested. Never show a broken image.

**Stack icons:** the original site maps stack names to devicons in `src/lib/devicons.ts` (`https://cdn.jsdelivr.net/gh/devicons/devicon/icons/<slug>/<slug>-original.svg`). Use the same mapping (the kit exposes it).

**Libraries:** plain HTML/CSS/JS. Libraries only from cdnjs.cloudflare.com, cdn.jsdelivr.net, or unpkg.com with an exact version. Fonts from Google Fonts, or `cdn.jsdelivr.net/npm/@fontsource/...` for fonts Google doesn't host (Maple Mono). No other network calls.

## Craft rules (Apple fluid-interface principles, web edition)

- Feedback on **press** (`:active` scale ~.97, 100 ms). Hover never shifts text or layout. **Hover = lift + soft shadow. Selected = rope ring (or ink fill; kit option).** Never animate the rope on mere hover of list items.
- Motion is **interruptible**: animate from the current on-screen value; springs for anything the hand touches, critically damped by default, a little bounce only after a flick. Hand off release velocity; project momentum to snap points; rubber-band at edges.
- **Spatial consistency:** things open from their trigger and close back into it. When something opens, scroll so it ends where it will settle (no smooth-scroll-then-snap).
- Animate `transform`/`opacity` (clip-path/mask where needed). Keep textures static.
- **Reduced motion** (`prefers-reduced-motion` or `?reduced`): cross-fades and static end states, no particles.
- **Accessibility:** WCAG AA text contrast (including on textures), visible focus, keyboard-operable, real buttons/links, `aria-pressed`/`aria-expanded`/`aria-current`, 44 px touch targets, alt text, no information by color alone (icons + text).
- Calm layout and type; the textures carry the play. Density matters.

## Variants

Expose every design option you make through a URL param and register it with `Yarn.mockPanel([{ label, param, options: [[value, label], …], default }])`. A reviewer must reach every state by URL. Recommend a default for each and say why in your report.

## Checking your work

Screenshot with Playwright: `playwright-core` at `/Users/blaqat/dev/playground/ripple-calc/node_modules/playwright-core`, Chromium at `~/Library/Caches/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-mac-arm64/chrome-headless-shell`, launched with `--allow-file-access-from-files`. Desktop 1440×900 @1x, mobile 390×844 @2x with `hasTouch`/`isMobile`. Inject `.mockpanel{display:none!important}` for clean shots. Collect `pageerror` and console errors: zero is the bar. Put scripts in `/Users/blaqat/dev/temp/r3i2-<area>/` and shots in `_shots/<area>-*.png`. **Look at the shots** and iterate until both sizes look intentional and consistent with `kit/components.html`. Compare against `../v3-yarn/` and the live site when the feedback says "my original design".

## Report back (≤ 300 words)

What you built, file paths, every URL param and what it shows, which `FEEDBACK-i2.md` bullets are done / partly done / not done, `KIT-CANDIDATE` items, the screenshots you took, and known gaps. Don't commit to git.
