# Iteration 9 · walkthrough results (Studio)

**Browser:** Safari 27 (WebKit) on macOS 27, driven with cua-driver: real mouse (click, drag, wheel), real keyboard (keystrokes, ⌘ shortcuts, ⌘V from the system clipboard). Safari wasn't running; it was launched into one new window, and that window was closed at the end (Safari itself was left running with no windows). No other app or window of the owner's was touched on purpose (one click went astray; see *Notes on the walk*).
**Desktop pass:** a 1440 × 960 window (page ≈ 1440 × 908).
**Phone pass:** Responsive Design Mode, **"iPhone size" (393 × 852, 3×)**. RDM doesn't emulate touch: taps are mouse clicks, there's no touch-drag or on-screen keyboard.
**Pages:** `file:///…/v3-yarn-9/studio/index.html` (+ `review.html`, `kit/components.html`), reached in-app (nav, the sections pill, ⚙ › Screen) after one `?reset`.
**How each line was judged:** done in the browser, then a fresh screenshot of the window, read full-size and zoomed. Text and stored values (the markdown a block editor saved, the copied round-up) were read back from Safari's own accessibility tree and the system clipboard, not assumed.

**Before the walk:** `regress.sh` alone: all 25 suites green and the sweep at 0 errors on the first run (nothing flaked, nothing to re-run). `overflow.mjs`: clean (21 pages × 18 widths).

---

## Checklist

**Totals: 20 lines · 14 ✓ · 6 ✗→✓ · 0 ✗** (9 findings, all fixed and re-checked in Safari; details follow).
"(not checked: …)" marks the parts of a line this walk didn't do in Safari; where a suite covers them it's named.

### The owner's pins
- [✓] **S1** After 8 moves between Projects / Music / Thoughts / Media / Dashboard (nav clicks), "New post" opens **one** sheet; it closes with ✕, Esc and an outside click (and the click doesn't open the row under it). Dashboard's "New" → one sheet, Esc closes. "New project" / "New piece" open a new editor by design (not a sheet); after visiting it, Projects still counts 13 (no stray drafts). Phone: sections pill → Projects → Thoughts → the red "+" → one bottom sheet. *(not checked in Safari: Music's and Media's own New; covered by `s1-nav.mjs`)*
- [✗→✓] **S2** Round-up (`?view=roundup`): pasting 4 links that were already there → "Already in the playlist: …" (no duplicates); pasting 3 new ones adds them (SoundCloud's title read off the address; Spotify / YouTube wait for one, the total says "25:56+"); a title + artist edited in its row; ✕ → Undo; a row dragged by its grip. Preview ▶ on Blinding Lights opens **Spotify's real player** in its row; ▶ on Flickermood closes it and opens SoundCloud's (one at a time; it played: 0:10 and Safari's audio mark). **F5** (Safari only): the "Paste SoundCloud, Spotify, …" box cut its own 2-line placeholder. **F9** (Safari): with your own song playing, ▶ on Spotify paused it but the embed closed again at once. Also: in Studio's preview your own songs don't play (Studio has no player: by design); checked on `kit/components.html#posts` with the real player instead: your song plays in the player, ▶ on Spotify pauses it and opens in the row, your next song closes it.
- [✗→✓] **S3** Block editor, desktop and phone (details in its own section below). **F1** focus lost after a drag · **F2** a post card three times too tall · **F3** the handle left behind after a keyboard move.
- [✓] **S4** `pstate=error` (set in ⚙ › Publish result) + a one-word body → the checks: ⚠ on gold for "1 word / Pretty short for an article" and "No cover", ✓ on ink for the rest, readable rows, "Publish anyway" → the failure toast ("Couldn't reach blaqat.net · Nothing changed. Your draft is safe here." + Retry). `shots/i9-walk-s4-checks-1440.jpg`
- [✓] **S5** One links field everywhere I tried it: a collection's own links (pasted a Spotify album with `?si=…` → "Spotify · album", the junk dropped; my own text "Stream the album"; the preview's release row shows it beside Play all), a project (2 links pasted at once; keyboard ✕ → Undo), the images post (its link buttons in the preview), a pick (its links field). A bad URL ("htp:/broken link") stays in the box with the reason. *(not checked in Safari: reordering links by drag / keys, Home's contacts; covered by `links.mjs`)* · see **F7** (below, the project preview with more links).
- [✓] **S6** VGM Class: "combat" set to Piano → its tab turns black yarn, the collection's striped swatch gains a piano band, facts read "Piano + DAW" / "DAW + Piano" by count.
- [✗→✓] **S7** A track: WIP disables Finished ("—", "WIP runs to “now” on the site. Jan 2026 is kept…"), Complete brings it back with a flash; a new track → Complete fills Nov 2026 + the toast with Undo, Undo clears it (inside the toast's 4.2 s; my first try was slower than that). **F4**: on WIP the Started selects dropped below the Finished ones. *(not checked in Safari: Dropped, a project's Ended; covered by `s7.mjs` + `music-walk.mjs`)*
- [✓] **S8** The chosen tab's rope is whole at 1440 and on the phone; + Track scrolls the new tab into view with its rope intact.
- [✗→✓] **S9** A track has every song field (audio, yarn, status, Started, Finished, its own links, notes); the collection's status / dates are read-only "from Track 7" with the rule written out. **F6**: the editor's "Tracks n" kept the old count after + Track / Remove.
- [✓] **S10** Music › Order on the site: Newest finished (WIP on top, then by finish), A–Z (case-blind, no year pills, the "not live yet · Undo · Publish order" bar), By hand (handles back; a row dragged); the clock opens its History. *(not checked in Safari: Newest started; covered by `s10.mjs`)*
- [✓] **S11** Project › Stack: "Bun" got its Simple Icons logo at once (network on); a made-up "Yarnwerk" got a monogram tile. *(not checked: Upload / Link a logo in Safari; covered by `s11-stack.mjs`)*
- [✓] **S12** The publishing rope round the button is an ink twist (`shots/i9-walk-s12-ink-rope-1440.jpg`); the upload knit bar (`?view=publishing`… "Uploading") is ink on white. Nothing tan.
- [✓] **S13** Pick › Tag stub colour: each swatch is the stub itself (twill X, seam, eyelet); the chosen one wears the rope flush on its own edge and radius; the preview's stub follows. Note colours (in the block editor's note form) are sticky notes with tape, the rope flush.
- [✓] **S14** `?view=images-9`: 1 big + 3 small, "+5" opens the viewer **at its own picture** (4 / 9), End reaches 9 / 9, Esc closes. `imgset=strip` (from ⚙): the second row becomes a strip running past the edge; "saved ×" puts the grid back. Phone: the same 1 big + 3 with "+5".
- [✓] **S15** Ranking › C tier's dot → the picker (10 felts as real "C" keys + "Your own colour"); → → previews teal on the row; Esc puts green back and focus returns to the dot. *(not checked in Safari: "Your own colour", Tab / outside click; covered by `s15-picker.mjs`)*
- [✓] **S16** Clicking Neovim opens its editor (name, image, tier, a line, Remove); choosing S moves it live; Done. *(not checked in Safari: drag still moving items; covered by `s16-items.mjs`)*

### Everywhere in Studio
- [✓] **Screens from ⚙ › Screen**, visited in Safari: Dashboard, Projects / Music / Thoughts lists, Project editor ×2, Uploading, Publishing, Track editor, Collection, Article, Pick, Playlist round-up, Images, Images · 9, Ranking, plus a new article. All looked finished; no clipped ropes; phone (RDM): no sideways scroll on any screen I opened. *(not checked in Safari: Sign in ×3, Notion import, Reordering, Poster picker, Live toast, History detail, Scratch, Playlist (pl1), Ranking · add / drag, Media library, Unused files, Home & About; all covered by the sweep (108 loads, 0 errors), `overflow.mjs` and `flows.mjs`)*
- [✓] **Keyboard:** Tab reaches the links field's controls with a visible ring and its keyboard hint; Esc closes the `/` menu, the handle menu, block forms, sheets, the picker, the ⚙ panel and the viewer, and focus goes back where it came from (the block, the dot). *(not checked: a full Tab pass through every editor; covered per area by each agent's suite)*
- [✓] **Toasts' Undo** (a removed track, a removed link, a playlist row, a finish auto-fill) all work. **View site** opens `v3-yarn-8/home/index.html?skip` in a new tab (the frozen i8 site).
- [✗→✓] **`review.html`**: the 4 open options (mdgallery, imgset, exttrack, mcomplete) and 6 questions show; **Copy everything** puts them on the clipboard (read back). **F8**: the page and the copied markdown said "Iteration 7" / "Yarn i7".

### S3 in Safari (the block editor; the risk this iteration)
Typed with real keystrokes, on the seeded article, a new article, and on the phone:
- **Shortcuts:** `## ` → heading, `- ` → bullets (Enter continues, Enter on an empty item leaves the list), `1. ` → numbered (2 follows), `> ` → quote, three backticks → a code block (typing goes into it; ⌘Enter leaves), `---` → divider, `**bold**` / `*slanted*` / `[zed link](https://zed.dev)` convert as you type. ⌘B / ⌘I on a double-clicked word work and keep the selection. Accents, an em dash and quotes type as typed (no smart-quote rewriting).
- **Caret + selection:** clicking places the caret where clicked (end of a line, mid-word); ↓↓ keeps the column across blocks; ⌘← reaches the line start.
- **Enter / Backspace at edges:** Enter mid-paragraph splits it (the tail starts the next block, caret at its start); Backspace at a block's start merges it back; Backspace at the start of a list item turns it into text first, then merges into the item above; Backspace after a divider selects it, a second Backspace deletes it; Shift+Enter adds a line break inside the block.
- **`/` menu and +:** `/` opens the menu under the line (yarn blocks first); typing filters ("note", "menti", "post", "link"); Enter or a click picks; the gutter **+** and the bar's **+ Block** open it too. All six yarn blocks inserted and edited in place: **note** (text + colour, live), **music** (search "couch", add), **mention** (Sonata, by keyboard), **post card**, **images** (From Media, 1 then 2 pictures → the strip), **link** (a SoundCloud profile recognised live). Esc / Done / ⌘Enter close a form and keep the block.
- **Handle:** drag by ⋮⋮ moves a block (red drop line, the block on the layer); click ⋮⋮ → the menu (Turn into, the current type roped); Esc closes it and leaves the block selected; ⌫ deletes the selection. Keys: Esc then ⌥⇧↑ moves a block.
- **Undo / redo, paste:** ⌘Z / the bar's Undo (in Safari ⌘Z goes to the editor, not the browser's own undo); pasting markdown with a heading, a list and a `<!-- yarn:link -->` block makes those blocks.
- **Markdown toggle + reload:** the stored markdown (read from the accessibility tree) is exactly what was written, yarn comments included; Blocks → Markdown → Blocks → Markdown gives the same text; ⌘R keeps everything.
- **Phone (RDM):** "Write, or tap + for a block"; typing works; the keyboard bar (+ Block · B I code link · undo · ⌄) docks at the bottom and the sections pill steps aside; the `/` menu and a block's form dock above the bar with the line kept in sight.
- Found: **F1**, **F2**, **F3** (fixed). Once, a code block's language box filled itself with "javascript" (no code sets it). Not reproduced in 6 tries, either engine; most likely Safari's autofill on an unnamed input. Hardened: `autocomplete="off" autocorrect="off"`.

---

## Findings

**9 findings · wrong 7 · polish 2 · fixed 9 · left 0** (one Safari-only).

| # | Severity | Screen · size | Steps → what's wrong | Shots (`_shots/`) | Status |
|---|---|---|---|---|---|
| **F1** | wrong | Block editor · all | Put the caret in a paragraph → drag any block by its handle → type or ⌘Z: nothing happens. The move re-rendered the blocks, so the focused one left and focus fell to `<body>`. Both engines. | `i9-walk-f1-focus-lost-after-drag-1440.png` | **fixed** (`studio/studio-blocks.js`, grip `pointerdown` + `endDrag`): the caret goes back where it was (like a keyboard move); with no caret, the moved block is selected so keys and ⌘Z work; on touch no field takes focus (the keyboard stays down). Safari: " Z" typed after the drag landed in the paragraph, ⌘Z ⌘Z undid both. `…f1-fixed-caret-kept-1440.png` · `blocks-walk.mjs` |
| **F2** | wrong | Block editor · all | Insert a **post card** block: it's 606px tall in the editor, 162px on the site (blank lines everywhere). Every yarn block inherited the text blocks' `white-space: pre-wrap`; the post card's HTML has the most whitespace. Both engines. | `i9-walk-f2-postcard-606px-1440.png` | **fixed** (`studio/studio.css`): atoms (yarn, image, divider, kept markdown) are `white-space: normal`; text blocks keep pre-wrap. Every yarn block is now as tall as on the site (± the 1px type-size difference). `…f2-fixed-postcard-1440.png` · `blocks-walk.mjs` |
| **F4** | wrong | Song / track / project editor · ≥ 600px | Status WIP → the Started selects sit 19px (1440) / 27px (1100) below the disabled Finished ones (the "WIP runs to now" line stretched Started's own grid). Every song, track and project. Both engines. | `i9-walk-f4-started-drops-1440.png` | **fixed** (`studio/studio.css`): fields beside a finish hold their rows at the top. Level at 1440 / 1100; phones still stack them. `…f4-fixed-level-1440.png` · `music-walk.mjs` |
| **F5** | wrong · **Safari only** | Playlist add box (always); any links box at phone width | The empty "Paste SoundCloud, Spotify, Bandcamp, YouTube links" box: its placeholder wraps to 2 lines and the box stays 1 line, so the border cuts the second. WebKit's `field-sizing: content` sizes an empty box to one row; Chromium fits the placeholder (64px). | `i9-walk-f5-placeholder-cut-safari-1440.png` | **fixed** (`studio/studio-links.js` `fit()`): an empty box gets a min-height that fits its placeholder at its width (after each render, on resize; typing drops it). Safari 1440 + phone. `…f5-fixed-safari-1440.png`, `…f5-fixed-safari-phone.png` · `links-walk.mjs` (WebKit's sizing simulated) |
| **F7** | wrong | Project preview · 960–1180 | Add links to a project (any number now, S5) → "Built with" in the preview is squeezed to one tool per line (137px at 1440, **24px** at 1100 with 5 buttons; 147px with the seed's 2 at 1100). The links column took its full width first. | `i9-walk-f7-builtwith-squeezed-1440.png` | **fixed** in the kit (`kit/yarn.css` `.ydetail--v5.ydetail--label`: links `fit-content(55%)`): the buttons wrap, right-aligned; the stack keeps ≥ 45% (2 tools a row). The seed at 1440 is unchanged. Carry to the site. `…f7-fixed-builtwith-1100.png` · `links-walk.mjs` |
| **F9** | wrong | Playlist post, your song playing · Safari | Play your own song in the player → ▶ on Blinding Lights: the player pauses but Spotify's player never shows. The row's "player started → close it" hook ran on any player event while `playing` was still true; a real `<audio>` reports its pause a tick later, so a time tick closed the row as it opened. | `i9-walk-f9-spotify-closes-at-once-1440.png` | **fixed** in the kit (`kit/posts.js`): it closes only on a "state" change to playing. Safari: Spotify stays open; playing your next song still closes it. `…f9-fixed-spotify-stays-1440.png` · `xplay-walk.mjs` |
| **F6** | polish | Collection editor | + Track / Remove track / its Undo: the editor's "TRACKS 6 · the folder on the site" kept the old count (the preview was right). | `i9-walk-f6-tracks-count-stale-1440.png` | **fixed** (`studio/studio-editors.js` `paintTabs`). `…f6-fixed-count-1440.jpg` · `music-walk.mjs` |
| **F3** | polish | Block editor · desktop | Esc → ⌥⇧↑: the block moves, but its handle stays beside the block's old place until you hover again (it measured the block mid-glide). | (live only) | **fixed** (`studio/studio-blocks.js` `placeGut`: where the block rests, its glide transform taken off). `…f3-fixed-handle-follows-1440.png` · `blocks-walk.mjs` |
| **F8** | polish | `review.html` | The round-up said "Iteration 7" and its copied markdown "# Yarn i7 · review round-up" (stale since i7). The owner pastes that text back. | `i9-walk-f8-roundup-iteration7-phone.png` | **fixed** (`review.html`; `review/roundup.js` reads `YARN_ROUNDUP.iteration`). Re-copied in Safari: "# Yarn i9". `…f8-fixed-roundup-phone.png` |

### Safari / WebKit notes
- **F5** and **F9** only showed in Safari: F5 is WebKit's `field-sizing` ignoring a placeholder; F9 needs a real `<audio>` (headless Chromium has none, so the links suite drove it with a stub). Neither fix uses engine-specific code.
- **contenteditable held up in WebKit.** Each block is its own editing host; caret placement, column-keeping ↑↓, split / merge, the inline shortcuts (zero-width-space trick), `execCommand` bold / italic (WebKit writes `<b>` / `<i>`, the serializer reads both), paste and the `/` menu all behaved as in Chromium. The S3 findings (F1–F3) were real but not WebKit-specific.
- macOS shows its Writing Tools affordance (a small separate window) after ⌘A in a field; harmless, but the driver counts it as a second Safari window.
- An empty text line has no height until it holds the caret (its hint only shows then); it looked like a gap below a block until clicked. As designed, noted for the owner.

### Not bugs (looked at, left)
- A quote is upright in the editor, italic in the article preview: the editor writes in `.ydetail__text` type (the project page's), the article page uses `.yprose`'s italic quote. The same in Chromium; by the blocks agent's design.
- "Saved h:mm" jumps between page loads: the mock's clock restarts at a fixed "now" each load (pre-i9).
- My first toast-Undo miss: the toast lasts 4.2 s and I was slower.

### Notes on the walk
- Two early pixel clicks used coordinates from a downsized screenshot: one landed at (1655, 299) on the owner's T3 Code window, which had come to the front (it read the click; nothing visible changed there and I didn't act on it further); one went off-screen. From then on every click carried its screenshot's capture id, so a stale coordinate is refused, and none went astray again.
- Setting Safari's address field through accessibility didn't load the page (the first S4 try, until ⚙ › Publish result was used); navigation was done in-page after that.

## What this walk couldn't check
- **Real touch** (RDM has none): touch-dragging blocks, tabs, playlist rows and ranking items; long-press; the phone's on-screen keyboard and the keyboard bar docking above it; the shake-to-undo menu. Covered in Chromium with real touch events by `blocks/phone.mjs`, `links.mjs`, `s16-items.mjs`, `blocks-walk.mjs` (F1 touch case).
- **IME / dictation** in the block editor (Japanese, emoji picker): not driven.
- **Sound** (the UI's yarn sounds): no audio capture.
- **Hover-only states** in WebKit need a real pointer move; hovers were checked where the pointer rested after a click, not systematically.
- Upload from disk (file pickers), Notion import, sign-in: not driven in Safari (sweep + `flows.mjs`).

---

## Regression re-run (after all fixes)
(regress.sh alone, nothing else running; suites in order)

| Suite | Result |
|---|---|
| `r3i9-studio` flows · mobile | 153 passed, 0 page errors · 22/22 states clean |
| `r3i9-links` linkinfo · links · playlist · kit | 93 · 105 · 86 · 21, all pass |
| `r3i9-music` s9s6 · s7 · s8 · s10 · layout | 65 · 38 · 25 · 74 · 82, all pass, 0 page errors |
| `r3i9-polish` s1-nav · s4-checks · s11-stack · s12-loaders · s13-swatches · s14-grid · s15-picker · s16-items | 62 · 149 · 40 · 32 · 127 · 170 · 54 · 39, all pass |
| `r3i9-blocks` node-parse · editor · phone · roundtrip | 85 seeds · 87 · 64 · 75, all pass |
| **new** `r3i9-walk` blocks-walk (F1 F2 F3) · music-walk (F4 F6) · links-walk (F5 F7) · xplay-walk (F9) | 20 · 51 · 62 · 8, all pass (each fails on the code before its fix) |
| error sweep (`r3i9-orch/sweep.mjs`: 36 pages × 1440 / 1024 / 390) | 108 loads, 0 errors |
| `node _tools/overflow.mjs` (21 pages × 18 widths) | clean (before the fixes, after them, and after the last one) |
