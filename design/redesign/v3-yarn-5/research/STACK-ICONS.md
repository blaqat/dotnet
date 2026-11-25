# Stack icons: mono / line versions (i5 · H3.1)

Owner: *"wondering if the stack icons have line icons or if theres libraries for that … it would make the red background tags on other pages look better if we can just say hey its white lines here and colored here"*

**Verdict: it works.** Every stack name that has a logo today gets a clean one-colour glyph, and five that have none today (Semantic UI, Spark, TOML, Zola, STM32) gain one: 28 names via 26 **Simple Icons** glyphs, 2 via **devicon `-plain`** (Azure, Java); 6 stay Phosphor. Drawn as a CSS mask, the same glyph is its brand tint on a light chip and **white on a red (selected) chip**. Built as the kit option **`?stkicon=color|mono`** (default `color`, Open). Side by side: [`stack-icons.html`](stack-icons.html). On a real page: `projects/index.html?stkicon=mono&stack=Python&browse=open`.

## Sources looked at

| Source | What it has | Licence | Fit |
|---|---|---|---|
| **devicon** `v2.16.0` (pinned, what the kit uses) | per icon: `original` (full colour), often `plain` (one or two flat colours, no gradients), sometimes `line` (outline). `devicon.json` lists the variants. | MIT (the set); logos remain their owners' trademarks | Rendered as masks (checked): most `plain` files mask cleanly (details are cut-outs). But React, Flask, Deno, Tailwind have **no** `plain` and Rust has only `line`; Node.js `plain` is a solid hexagon (the "JS" is lost); the `line` files (C, Next.js, Node.js, Rust) are hairlines at 16px; sizes and padding vary per icon (128px boxes). Good second source, not a complete one. |
| **Simple Icons** `16.36.0` (pinned; Oct 25 2026) | one SVG per brand: **a single path, 24×24, one colour, holes cut out** (made for exactly this), plus the brand hex in `data/simple-icons.json` | **CC0-1.0** (the set). A few logos carry their own licence (below); all remain trademarks, used here to name the tool, as the old site does | Best fit: mask-ready by design, consistent weight/size. Missing: Microsoft (Azure) and Oracle (Java) logos were removed at the brands' request; OpenAI isn't in it. |
| **Phosphor** `2.1.1` (vendored) | generic line icons; already loaded | MIT | Fallback for things without a logo (Beepbox, DAC, FreeRTOS, OpenAI API, "Cloudbased LLM Provider APIs", Freemarker). Already single colour (`currentColor`), so already white on red. |
| **Tabler Icons** `3.50.0` `brand-*` (378 brands) | true **line** icons (2px strokes, 24×24), the literal "white lines" | MIT | Covers 18 of our 29 logo names (Astro, Azure, Cloudflare, Deno, Discord, Google, JavaScript, MongoDB, Next.js, Node.js, OpenAI, Python, React, Rust, Supabase, Svelte, Tailwind, TypeScript). **Missing** C, Flask, Java, JSON, PostgreSQL, SQLite, Spark, TOML, Zola, Semantic UI, STM32, so a third of the chips would fall back to a filled glyph: two styles side by side. Masks work the same way (`icons/outline/brand-<x>.svg`). Worth a look if the owner wants outline over solid; not built. |
| Others considered | **svgl** (colour, light/dark variants, no mono), **Iconify `logos:`** (colour), **Iconify `simple-icons:` / `skill-icons:`** (same glyphs as Simple Icons, or coloured tiles), **Font Awesome brands** (CC-BY-4.0, icon font, fewer dev tools) | — | Nothing beats Simple Icons' coverage at no extra weight; Iconify would add a runtime. |

## Coverage (every stack name the mocks use: Projects data, Home, Thoughts' "Built with", Studio's picker)

`SI` = `https://cdn.jsdelivr.net/npm/simple-icons@16.36.0/icons/<slug>.svg` · `DV` = `https://cdn.jsdelivr.net/gh/devicons/devicon@v2.16.0/icons/<slug>/<file>.svg`. Tint = the colour at rest in `mono` (the brand hex, darkened toward ink until it has ≥ 3:1 on `--cotton-2`; `ink` = the text colour, for black or near-white brands).

| Name | Colour today (devicon) | Mono glyph | Variant / URL | Tint | Own licence |
|---|---|---|---|---|---|
| Astro | astro-original | SI | `astro` | #bc52ee | |
| Azure | azure-original | DV | `azure/azure-plain` (Simple Icons dropped Microsoft) | #0078d4 | |
| Beepbox | Phosphor `ph-circle` | Phosphor | `ph-circle` | text | |
| C | c-original | SI | `c` (DV `c-plain` also works; SI keeps the set on one grid) | #03599c (devicon's blue; SI's #a8b9cc is 1.7:1) | |
| Cloudbased LLM Provider APIs | Phosphor `ph-cloud` | Phosphor | `ph-cloud` | text | |
| Cloudflare | cloudflare-original | SI | `cloudflare` | #d17020 (from #f38020) | |
| DAC | Phosphor `ph-waveform` | Phosphor | `ph-waveform` | text | |
| Deno | denojs-original | SI | `deno` (devicon has no plain) | ink | MIT |
| Discord.js / Discord.py | discordjs-original | SI | `discorddotjs` (same "DJS" mark as today) | #5865f2 | |
| Flask | flask-original | SI | `flask` (devicon has no plain) | ink | |
| Freemarker | Phosphor `{}` | Phosphor | `ph-brackets-curly` (SI `apachefreemarker` exists but is unreadable at 16px) | text | (Apache-2.0) |
| FreeRTOS | Phosphor `ph-cpu` | Phosphor | `ph-cpu` (no logo anywhere) | text | |
| Google Sheets API | google-original | SI | `google` (the "G", as today; SI `googlesheets` is an option) | #4285f4 | |
| Java | java-original | DV | `java/java-plain` (Simple Icons dropped Oracle's Java cup; `openjdk` is a different mark) | #ea2d2e | |
| JavaScript | javascript-original | SI | `javascript` (the square, letters cut out) | #988a1e (from #f7df1e, 1.2:1) | MIT |
| JSON | json-original | SI | `json` | ink | |
| MongoDB | mongodb-original | SI | `mongodb` | #459a45 | |
| Next.js | nextjs-original | SI | `nextdotjs` | ink | |
| Node / Node.js | nodejs-original | SI | `nodedotjs` | #5b984b | |
| OpenAI API | Phosphor `ph-open-ai-logo` | Phosphor | `ph-open-ai-logo` (OpenAI isn't in Simple Icons) | text | |
| PostgreSQL | postgresql-original | SI | `postgresql` | #4169e1 | |
| Python | python-original | SI | `python` (DV `python-plain` is near-identical) | #3776ab | |
| React | react-original | SI | `react` (devicon has no plain) | #4893a7 (from #61dafb, 1.4:1) | |
| Rust | rust-original | SI | `rust` | ink | CC-BY-SA-4.0 |
| Semantic UI | Phosphor `{}` | SI | `semanticui` (**new**: today shows `{}`) | #069a93 | |
| Spark | Phosphor `{}` | SI | `apachespark` (**new**) | #e25a1c | Apache-2.0 |
| Sqlite3 | sqlite-original | SI | `sqlite` | #003b57 | |
| STM32 | Phosphor `ph-cpu` | SI | `stmicroelectronics` (**new**: ST's mark, printed on every STM32) | ink | |
| Supabase | supabase-original | SI | `supabase` | #359a6c | |
| Svelte | svelte-original | SI | `svelte` | #ff3e00 | |
| Tailwind | tailwindcss-original | SI | `tailwindcss` (devicon has no plain) | #0c95ac | |
| TOML | Phosphor `{}` | SI | `toml` (**new**) | #9c4121 | |
| Typescript | typescript-original | SI | `typescript` | #3178c6 | |
| Zola | Phosphor `{}` | SI | `zola` (**new**) | ink (brand #eae7d6 is invisible on cotton) | CC-BY-SA-4.0 |

**Falls back to Phosphor** (single colour already, white on red already): Beepbox, DAC, FreeRTOS, OpenAI API, Cloudbased LLM Provider APIs, Freemarker, and any new name not in the table (`{}`), as today.

**Licences, in short:** Simple Icons' set is CC0 and devicon's is MIT; Phosphor is MIT. The logos stay their owners' trademarks either way; showing them to say "built with X" is the same use as today. Rust and Zola marks are CC-BY-SA-4.0, Deno and JavaScript MIT, Apache marks Apache-2.0: fine to display unmodified; credit them in the site's colophon if the owner wants to be thorough. Some brands publish guidelines (Simple Icons links them: Python, Rust, Node.js, Tailwind, TypeScript, Cloudflare, Google, Next.js, PostgreSQL, Deno); single-colour marks are the usual "small size" form, but a guideline may ask for the exact brand colour, so the darkened tints (JS, React, Cloudflare, Tailwind, Supabase, MongoDB, Node.js) are the soft spot. If that matters, use `ink` at rest for those.

## How it renders (kit)

```html
<!-- Yarn.stackIcon("Python", { mode: "mono" }) -->
<i class="ystk-ic" style="--ystk-src: url(https://cdn.jsdelivr.net/npm/simple-icons@16.36.0/icons/python.svg); --ystk-tint: #3776ab" aria-hidden="true"></i>
```
```css
.ystk-ic { width: 16px; height: 16px; mask: var(--ystk-src) center / contain no-repeat;
           background: var(--ystk-on, var(--ystk-tint, currentColor)); }
/* any filled surface: the glyph takes the text colour (white on red, red-deep on ?toggle=tint, white on ink) */
html:not([data-toggle="rope"]) .ytog:is([aria-pressed="true"], .is-selected), .on-ink { --ystk-on: var(--y-fg); }
```
- One glyph, any colour: the mask is the shape, `background` is the colour. No second request, no filter, no JS.
- It's an `<i>`, so every existing `.ystk > i`, `.ychip > i` size, wiggle and dim rule applies unchanged.
- A new filled surface that can hold a stack icon needs one line: `--ystk-on: var(--y-fg)` (or `#fff`).
- Masks fetch in CORS mode; jsDelivr sends `Access-Control-Allow-Origin: *` (checked), so it works from `file://` and from blaqat.net. A glyph that fails to load leaves an empty 16px slot (an `<img>` fell back to `{}`); acceptable for a pinned CDN, or self-host the ~27 SVGs in production.
- Weight: the whole mono set is ~39 KB raw (~250 B–5 KB each) vs ~63 KB for today's devicon originals; fetched only for icons on screen.
- Production (Astro): inline the Simple Icons path data at build time (`simple-icons` npm, tree-shaken per icon) as `<svg fill="currentColor">`; then there's no request and no mask at all.

## Open questions for the owner
1. `mono` at rest: brand tint (built) or plain ink for every glyph (closer to "white lines here", calmer next to the coloured type/status badges)? One-line change (drop the tints).
2. Today's `color` mode could also use the new Simple Icons glyphs (tinted) for Spark, TOML, Zola, Semantic UI and STM32 instead of `{}`.
3. Hybrid: keep the full-colour logos at rest and swap to the white glyph only on red. Possible (two layers per chip); not built, since `mono` already shows the red case.
4. Solid glyphs (Simple Icons, built) or outline "line" glyphs (Tabler, 18 of 29 names covered, the rest would stay solid)?
