# Iteration 9 · real-browser walkthrough checklist (Studio)

Run it in **Safari** (WebKit) on macOS, driven like a person would use it, with the cua-driver skill.
- Open Safari in a **new window** and close that window at the end. Never touch the owner's other browsers or windows.
- Pages open from disk: `file:///Users/blaqat/dev/projects/my-litterbox/design/redesign/v3-yarn-9/studio/index.html?…`. Add `&reset` once at the start for clean data.

Do two passes:
1. **Desktop:** a window about 1440×900.
2. **Phone-sized:** Safari's Responsive Design Mode, the iPhone preset. RDM doesn't emulate touch, so taps are clicks. Say which touch-only parts you couldn't check.

For each line:
- Do it, look at a fresh screenshot at 1:1, then mark ✓ or ✗.
- "Wrong" includes anything that looks broken, misaligned, clipped, washed out, covered, jumpy or slow, not only errors.
- For each ✗: a screenshot path and one line saying what's wrong.

## The owner's pins (FEEDBACK-i9.md)
- [ ] **S1** New post: move between Projects / Music / Thoughts / Media / Dashboard a few times, then press "New post", "New project" and "New piece". Each opens exactly one sheet, and closes with ✕, Esc and an outside click. Repeat on every list.
- [ ] **S2** Playlist (`?view=roundup` and a new playlist):
  - Paste several SoundCloud / Spotify / Bandcamp / YouTube links at once. Edit a title and an artist, reorder, remove and Undo.
  - In the preview, ▶ on an outside track plays it in its row (network allowed). Only one plays at a time, and your own songs play in the player.
- [ ] **S3** Block editor (`?view=article`, a project's write-up, a description):
  - Typing shortcuts: `## `, `- `, `1. `, `> `, three backticks, `---`. Bold / italic / links.
  - `/` menu and `+`: insert every yarn block (link, images, music, mention, note, post card). Edit each one in place.
  - Drag a block by its handle, and use the handle menu.
  - Undo / redo. Paste markdown.
  - Blocks ⇄ Markdown toggle: the text is unchanged after a round-trip.
  - Reload: everything is kept.
  - **WebKit:** caret placement, selection, IME-free typing, Enter / Backspace at block edges. Safari's contenteditable is the riskiest part of this iteration; spend time here.
- [ ] **S4** Publish checks (`?view=article&pstate=error`, a short body): warning icon, readable colours, "1 word".
- [ ] **S5** Links field (song, collection, collection track, project, images post, pick, Home):
  - Paste one link and several. Write your own text. Reorder by mouse and keyboard. Remove + Undo. Try a bad URL.
  - The preview shows the links the way the site would.
- [ ] **S6** Mixed collection (`?view=collection`): a track's instrument changes the collection's striped swatch and its "Piano + DAW" facts.
- [ ] **S7** Status → Finished:
  - Complete / Dropped fills this month, with Undo.
  - WIP disables Finished and keeps the old month; it comes back on Complete.
  - Projects behave the same.
- [ ] **S8** Collection track tabs: the chosen tab's rope is whole (not cut at the top) at every width. The chosen tab scrolls into view.
- [ ] **S9** A collection track has every song field. The collection's dates and status come from its tracks and say so.
- [ ] **S10** Music list › Order on the site: every mode, then By hand (drag). The list order matches the rule, and it shows in History.
- [ ] **S11** Project › Stack:
  - Add a tool the kit doesn't know (e.g. "Svelte", "Bun", "Zig"): its logo appears.
  - Add a made-up one: a monogram, then Upload / Link a logo.
- [ ] **S12** Publishing (`?view=publishing`, uploads, audio): every loader is ink, none tan.
- [ ] **S13** Pick › stub colours and note colours: the swatches look like the real stub / note. The selected rope is flush.
- [ ] **S14** Images post with 5 and 9 images: 1 big + 3 small with "+N", which opens the viewer at that picture. Also try `&imgset=strip`.
- [ ] **S15** Ranking › tier colour: the picker opens, arrows preview a colour, Enter picks it, and "Your own colour" works. Esc / outside click / Tab close it.
- [ ] **S16** Ranking › an existing item: click / Enter opens its editor (name, image, note, tier, remove). Dragging still moves items.

## Everywhere in Studio
- [ ] Every screen in ⚙ › Screen loads and looks finished: no clipped ropes, no covered hints, no sideways scroll on the phone.
- [ ] Keyboard: Tab through each editor. Focus is visible, Esc closes whatever is open, and focus goes back where it came from.
- [ ] Toasts' Undo works. "View site" opens the i8 site.
- [ ] `review.html`: the new questions and the Open options show, and Copy everything works.
