# Iteration 10 · real-browser walkthrough checklist (the site's design pass)

**i10 is about how the site reads.** The owner preferred their old site because "you can immediately know exactly whats important": purple is music, and the playing thing is the only thing in a different state. So beyond "does it work", this walk judges **hierarchy**: what's the loudest thing on each screen, is it the thing that matters, and can you tell what's playing with your eyes half closed. Read `DESIGN-i10.md` (the rules R1–R9) before starting.

## How to run it
Run it in **Safari** (WebKit) on macOS, driven the way a person would use it, with the cua-driver skill.
- Open Safari in a **new window** and close that window at the end.
- **Never touch the owner's other apps or windows.** Pass the capture's `capture_id` with every pixel click, keep captures full size before clicking, and use `delivery_mode:"foreground"` only on the walk's own window. See the memory note on Safari walks: a stray click hit the owner's T3 Code window in i9.
- Pages open from disk: `file:///Users/blaqat/dev/projects/my-litterbox/design/redesign/v3-yarn-10/…`. `launch_app` can't open a `file://…?query` URL, and setting the address field doesn't navigate, so use a small **hub page** in your temp folder (`~/dev/temp/r3i10-walk2/hub.html`): links to every URL below, plus a query box.

Do two passes:
1. **Desktop:** a window about 1440×900, and once at about 1000 wide (the owner's window).
2. **Phone-sized:** Safari's Responsive Design Mode, the iPhone preset (`invoke_menu ["Develop","Enter Responsive Design Mode"]`). It doesn't emulate touch, so taps are clicks; say which touch-only parts you couldn't check.

For each line:
- Do it, look at a fresh screenshot at 1:1, then mark ✓ or ✗.
- "Wrong" includes anything broken, misaligned, clipped, washed out, covered, jumpy or slow, and anything that **reads wrong**: a second loud thing competing with the live one, an accent at rest, two left edges in a card, unequal gaps.
- For each ✗: a screenshot path and one line saying what's wrong.

Do every page in **both looks** (`?look=section`, the default, and `?look=ink`). The ⚙ panel switches them, and so does the hub's query box.

## Music (the owner's screen first)
- [ ] **The owner's screen.** `music/index.html?view=grid` at about 1000 wide. Search "shadow", then press ▶ on Alphabet City's tab 02 (glooming shadows). Blur your eyes:
  - the playing card, its tab, its ▶ and the player are the only accent
  - every other ▶ is a plain disc
  - Compare with the same screen in `../v3-yarn-8/music/index.html?view=grid` (i8) and say which reads clearer, honestly.
- [ ] **Results line.** It names what's shown, e.g. "3 releases · 6 tracks for “shadow”". It updates as you type, filter by instrument or status, and clear.
- [ ] **Play.** It plays exactly what's shown. Open the player's queue (expand the bar / panel): only the found songs.
  - Alphabet City contributes only its matching songs, unless the search matches the collection itself (try "alphabet").
  - Next and previous stay inside the set.
- [ ] **Shuffle.** It shuffles the same set, the queue shows that set, and Shuffle again reshuffles.
- [ ] **`?shuffle=player`.** The results line keeps only ▶ Play, and the player bar's shuffle toggle works.
- [ ] **▶ on a card.** It starts there and plays on through the shown set. Pause → the card keeps only a ring on ▶ and a thread on its tab. Play again → the card goes live.
- [ ] **Card anatomy** at 1440 / 1000 / phone:
  - one left edge, art top-right; `?cardart=left` puts it top-left
  - the title, one meta line, a clamped description, links left, + and ▶ right at one height
  - the folder tabs inside the card's box
  - gaps equal across and down
  - cards in a row the same height
- [ ] **Timeline** (default view): the rows, the stage and the stage's track rows; the playing row is live, and the opened row has the ink rope. Click rows, use the keyboard, and long-press a row (B3 menu).
- [ ] **Release page** (`music/item.html`), the player panel (`?player=panel&demo=1`), the disc.
- [ ] **Phone:** cards, the results line's icon-only buttons, the floating player + search, the sections pill. No sideways scroll.

## Projects · Thoughts · Home
- [ ] **Projects grid + Timeline + stage + `item.html?p=sonata`.**
  - The card grammar: one left edge, the image top-right, links then the stack in the foot.
  - "Visit site" is the ink primary.
  - Filters on / off: the "on" fill, not red.
  - The browse sheet, the tag stack, opening and closing an item.
- [ ] **Thoughts feed** (`thoughts/stitched.html`):
  - the rail's All / type rows (on / pick roles), tags, year, collections
  - post cards: the Micro caps kicker, Title, Body, "Read →" an ink link
  - the masonry gaps equal across and down
  - the tag browser, search, a playlist's Play all (neutral → live)
- [ ] **Thoughts article** (`?view=article&id=a1`), the collection view, and **ranking** (`thoughts/tier.html?id=tl1`: Mine / Everyone, voting, the picked outline).
- [ ] **Home** (`home/index.html`, the intro then `?skip`): the scribbles, the callout, the section buttons' hover rope, the nav into each section (the section transition).

## The system layer
- [ ] **`?stitch=full` vs `calm`.** Calm: controls flat with a hairline; the sheet, cards, year pills and player keep their stitches.
- [ ] **`?font=allo` and `allo-round`** on Music, Thoughts, an article and Home:
  - Word spaces are clearly open in headings and labels (the old preview closed them up).
  - Nothing overflows or clips; no line is noticeably tighter or looser than Nunito.
  - Safari renders the variable font and its roundness.
- [ ] **`kit/looks.html`.** Every screen / width / compare / font picker works in Safari, and the frames load and respond.
- [ ] **Nav:** the current tab's rope is in the section hue (section) or ink (ink); the other tabs' icons are grey until hover.
- [ ] **Hover only lifts, everywhere.** No rope on hover except Home's section buttons; no hover flicker at card edges; nothing clips a hover shadow.
- [ ] **Keyboard:** Tab through Music and Thoughts. Focus is always visible (calm controls included), and Esc closes what's open.
- [ ] **Studio** (`studio/index.html?view=music`, `?view=collection`, `?view=project`, `?view=article`):
  - The previews show the new cards and roles.
  - No old red buttons in the music preview: music reported that Studio passes the old red button markup into the folder card.
- [ ] **`review.html`:** the i10 questions and Open options show, and Copy everything works.

## Fix what you find
You own the fixes for your findings (small, exact edits; re-read files first). Add a probe or test for each fix to `~/dev/temp/r3i10-walk2/` and to `~/dev/temp/r3i10-orch/regress.sh`. Write `WALKTHROUGH-i10-results.md` (F1…Fn: what, where, the fix, the test), and run the suites for the areas you touched before reporting.
