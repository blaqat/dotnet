# Iteration 7 · real-browser walkthrough checklist (W1)

Run in a real browser (Google Chrome on macOS) driven like a person would, with the cua-driver skill. Do two passes:
- **Desktop:** a window about 1440×900.
- **Phone-sized:** a window about 390 wide. Also use Chrome's device toolbar with touch emulation for the touch-only items.

Pages open from disk as `file:///Users/blaqat/dev/projects/my-litterbox/design/redesign/v3-yarn-7/…`.

For each line: do it, look, and mark **✓** or **✗**. For a ✗, add a screenshot and one line saying what's wrong. "Wrong" includes anything that looks broken, misaligned, clipped, washed out, covered, jumpy or slow, not only errors. Hide nothing: the ⚙ panel and review pins are part of the owner's experience too.

## Every page
- [ ] Sound tag: tap it on and off; it starts muted on reload; hover swaps only the icon; the on state is a darker red; there's no dashed line at the top.
- [ ] Nav: go to every section from every page. On phones, open the sections pill, choose a section, and close it with ✕ / outside tap / Esc.
- [ ] ⚙ panel: open and close it. Pick an Open option (it reloads and stays), go to another page (it's still applied), and use Reset. Write a page note, an option note, and a "Note on something" pin; Esc cancels the picker.
- [ ] Hints: hover every icon-only control. The hint appears quickly, never covers a neighbour, and disappears on leave and on Esc.
- [ ] Keyboard: Tab through the page. Focus is always visible and the order makes sense; Enter / Space activate; Esc closes whatever is open.
- [ ] Phones: the page never scrolls sideways; floating items (pill, search, disc / player, toasts) are never drawn over and never cut off.

## Home
- [ ] Intro: first visit, "Press unmute for sound", then a muted start. Replay the intro from ⚙.
- [ ] Keywords: every one ripples; "composing" drops purple notes and plays its sound when sound is on.
- [ ] Stack tags shake their icon; contact links don't flicker at the edges; section buttons go to their pages with the colour transition.

## Projects
- [ ] Filters: type / status chips toggle (red fill, strike on hover), "All" clears, Browse opens / filters / closes, search, the empty state appears, and "Clear filters".
- [ ] Spam the filters: cards reverse from where they are, no snapping.
- [ ] Timeline: click rows. The stage cross-fades with no blank frame. The passed rings follow the ball. Stack tags in rows are **not** clickable.
- [ ] Opened item: the facts, the tags (they filter, and clear on a second click), the links (the hint shows), the media (lightbox opens / closes, and video plays fullscreen), ‹ 3 / 14 › with the title hint, copy link, and the sticky bar only after real scrolling.
- [ ] Grid: cards lift with no edge flicker; pressing a link inside a card doesn't press the card; open a project as a page, go Back (scroll and filters are kept), and step through ‹ ›.
- [ ] `?statusdate`, `?cardfacts`: switch between them in ⚙ and look at the cards and the opened item.

## Music
- [ ] Cards: play / pause (the bars show inside the button), "+" adds to the queue (the toast's Undo is on the right), and the tabs play their song. Hover a tab and the card shows that song's notes. With one tab left you get the single "Collection - Song" card.
- [ ] Track rows (stage + release page): buttons sit in the same columns on every row; the notes ⌄ unrolls the notes; "+" works; the durations line up.
- [ ] Search: a word from a description finds the song; an opened collection fades the non-matches to grey.
- [ ] Player: disc → bar → panel → back. Drag down to collapse it on a phone. Volume: the hover ball is fully visible at 0%. Next is disabled on the last song. Queue: reorder and remove.
- [ ] Long-press the disc: play, mute and next all look enabled and press; their hints don't cover each other; search gets out of the way; Esc / outside tap closes it.
- [ ] An ongoing release in the player shows a plain WIP mark (not red).

## Thoughts
- [ ] Feed: filters, the 8+ tags and "n more" tag browser (close it with ✕, Esc, an outside click, and by picking a tag), year filter, search.
- [ ] Cards: open a post and go Back (you land where you were, with that post focused). On a pick card, the write-up pill and "about" (scrolls to the thing).
- [ ] Article: Back and ‹ n / N › in the top bar, copy link, contents links (the heading flashes even without scrolling), and the lightbox.
- [ ] Collection: picks, the rope moves one at a time, and the go-to-collection buttons show text and an arrow only.

## Rankings
- [ ] Mine / Everyone / Add yours. In Add yours, drag tiles by mouse, touch and keyboard. The empty tier's copy reads well.
- [ ] Comments: typing @ or # suggests items (Enter inserts, Esc closes); posted mentions light their tiles on hover; the ref highlight fits the icon's shape.
- [ ] Write-up bookmark on Helium sits right; the write-up pill on the page is white.

## Studio
- [ ] Every screen in ⚙ › Screen: the dashboard, sign in, reorder (drag and keyboard), every editor (edit, live preview), publish (smart check), history, media (upload). The toast's Undo works, Back works, and the phone's new-item button sits on the floating layer.
- [ ] It looks like the rest of the site: same tags, chips, facts, buttons, top bar.

## Round-up (`review.html`)
- [ ] Options list, answering questions, cuts (Keep it), settle, notes (with links back), Copy everything (paste somewhere and check), Clear everything.
