# Yarn i5 · review round-up
*Copied 2026-11-14 18:09 from review.html*

## ⚙ Choices

### Changed from the default
**Every page**
- **Toasts on phones** `toast=bottom`: Bottom, player + search move up (default: Top of the screen)
  - Note: make sure the undo button is right aligned
- **Stack icons** `stkicon=mono`: One-colour: tinted, white on red (default: Colour logos (i4))
  - Note: i think on a white background colour logos are good but otherwise we should switch to one-colour tinted
- **Opened item: layout** `dlayout=label`: Label first (default: Stacked)
  - Note: i wanna try having labels for the section like built with, links, etc. / im not 100% decided but its between label first and side rail i think if label first we can put the action buttons on the bottom right (tbh article's left side side rail looks great tho isnt as in design as our current stuff with the button styling lets try an option like that as well for everyhting else) / also make sure there isnt like a massive gap between the last bit of text and the bottom section for label first i saw that happen in the opened project page not in an open item / also for opened project page i wonder if side rail makes more sense on the left or if its just too far to the right i think it looks off cause of the other buttons in the top bar of the content for copy link and < > while label first doesnt have that issue / ---- / note on music page just noticed side rail looks awful when theres no content for the song while label first doesnt have this issue so maybe im now leaning label first over side rail / also for the play button in side rail either center the text for all buttons or add "Play/Pause" text so it doesnt look off
- **Timeline stage sits** `stagealign=center`: Centred (default: At the top)
**Projects**
- **Ongoing (G5)** `ongoing=badge`: Badge (i4) (default: Ribbon on the card)
  - Note: yeah badge makes more sense. im wondering if the order should be type, status, year because status and year really goes together. also i think the badge could be "icon" only (really the condensed one) / i also kinda like how it looks on the opened card with the icon in the circle...

### Confirmed defaults
**Every page**
- **UI sounds while music plays** `uisnd=quiet`: Silent
- **Bottom items on scroll (phones)** `mhide=all`: Pill + search / disc hide going down
  - Note: im not sure about this yet, but if we do keep this feature it will be everything hiding
- **Browse button icon** `browseicon=shake`: Shakes on hover
- **Active filters on phones** `mactive=start`: Right after ✕ (always in view)
- **Item page: previous / next** `dnav=count`: ‹ 3 / 14 ›
  - Note: lets do this selection + title on hover
- **Player · long-press the disc (MP1)** `disclong=actions`: Play · mute · next float beside it
  - Note: next should become disabled if on the last song / also missing click animation on the 3 buttons / also should move the search out of the way either more to the left or just gone until the interation is done (prolly for the best)
- **Player · song vs collection notes (MP3)** `pnotes=divider`: One column, a labelled divider
  - Note: label should just be "About [collection name]" also add "About this song" instead of this song
**Projects**
- **Type colours (P2)** `ptype=color`: Blue · yellow · orange
- **Type on items (P2.1)** `ptypelabel=text`: Icon + name
  - Note: the weird background isnt that good (feels out of place) but the background on the open items also isnt good for contrast but i understand why its dark so just iterate on that ig maybe contrast test and use white on the color if its too dark on dark idk
- **Timeline: passed knots (P3.1)** `passed=ring`: Open red rings
- **Timeline: stack line (P3.2)** `tlstack=on`: One line + “+n”
  - Note: this stack line should work like the hashtags on the thoughts page where clicking them lets u clear the filter as well if theyre active. styled the same as well (same on grid)
**Music**
- **Instrument colours (M2)** `mtype=color`: Coloured (piano black · BeepBox purple · DAW blue)
  - Note: the hover state for the filters should match the style of projects where it has a soft color tint when hovered not just the text changing color. for piano the current way doesnt show anything since piano is black
- **A song's notes without the player (M6)** `songnotes=face`: Rows unroll · a grid card shows the hovered or playing song's notes
  - Note: if the hovered item doesnt have notes dont say "no notes" just remove that text i think i gave feedback on pointless text earlier
**Thoughts**
- **A pick's article (T1)** `pickart=link`: Its own post; the pick links to it
  - Note: i prefer its on post in functionality but i prefer the pick is the article in design lets try more different design options / i think the issue is that the title feels too long for write ups but the about one feels right idk why / actually no i like write up but maybe just have it in the bottom right similar to read thats what it is clicking that takes u to write up clicking the item takes u to its item page
- **Kicker icon (T2.3)** `kicon=circle`: In its circle

### Not picked yet (default stands)
Frame `frame` · Editor on desktop `layout` · Publish `confirm`

## Questions
- **Thoughts** · Thoughts' desktop side list keeps “All” as a row, like the type rows under it. Make it a circle like the other pages?
  → **Keep the row** `thoughts-all=row`
- **Projects + Music** · Cards still show status as a pill and the date in mono; the opened item beside them uses the new fact style. Should cards match the opened item?
  → **Cards match the opened item** `meta-grammar=match` (as suggested)
  - Note: make this an option in the next round i might change my mind
- **Music** · On Music the ongoing ribbon landed on the play and queue buttons, so ongoing releases still show a badge. Keep the badge, or rearrange the card to make room for a ribbon?
  → **Keep the badge on Music** `music-ongoing=badge`
  - Note: i was thinking in the player thats the most important place to show something is wip we dont have that at all yet and its unrelted to ur question but im curious how that would look
- **Music** · Collection tabs on phones: should tapping a tab play that song, or open the collection?
  → **Play the song** `tabs-phone=play`
- **Projects** · Personal is sky blue, lighter and more cyan than the blue page frame. Is it different enough?
  → **Yes, keep it** `personal-blue=ok`
- **Music** · Keep the “+” (add to queue) on collection cards? Only the tab tip was the precision problem.
  → **Keep it** `card-plus=keep` (as suggested)
- **Player** · Queue rows still say “Collection · 2/4” because order matters there. Say “from …” there too?
  → **Keep the position** `queue-from=position` (as suggested)
- **Music** · A collection becomes a single “Collection — Song” card when one tab is left, even if another matching song has no audio. Is that right?
  → **Yes, count tabs** `single-rule=tabs` (as suggested)
  - Note: oh lets remove the emdash just do "-"
- **Music** · With songnotes=face, a collection's grid card shows the playing song's notes while it plays. That is how a tablet gets them: a tap plays. Or keep the collection's own notes there until you hover a tab?
  → **Show the playing song's notes** `face-playing=playing` (as suggested)
- **Thoughts** · Should a project page show the write-up's title instead of just “Read the write-up”?
  → **Keep “Read the write-up”** `writeup-title=generic`
- **Thoughts** · Should the small ranking preview on its feed card also mark which items have a write-up?
  → **Leave the preview clean** `minirank-marks=no`
  - Note: can have an option to try this but i think clean will probably be my option
- **Stack icons** · With one-colour logos (stkicon=mono), should unselected tags keep each brand's colour or all be plain ink?
  → **Brand colour** `mono-rest=brand` (as suggested)
- **Stack icons** · Five stacks show a generic icon today (Semantic UI, Spark, TOML, Zola, STM32). Give them the new logos in colour mode too?
  → **Yes** `mono-new-logos=yes` (as suggested)
- **Stack icons** · Filled logos, or outline “line” icons? The outline set only covers 18 of the 29 stacks, so a third would stay filled.
  → **Filled** `mono-line=solid` (as suggested)
- **Site** · If you turned sound on last visit, it shows muted until your first tap or key, then turns on by itself. OK, or always start muted?
  → **Always start muted** `saved-sound=muted` (suggested: Resume after the first tap)
- **Studio** · Studio's design options are still open because you haven't reviewed it. Review Studio next, or fold its options away for now?
  → *no pick*
  - Note: ill review studio in iteration 6 the main site is priority right now
- **Phones** · On short pages (Projects on a phone scrolls about 660px), the bottom items hide and then come straight back as you reach the end. Keep them in place on pages shorter than about two screens?
  → **Stay put on short pages** `qr-short-pages=stay` (as suggested)
  - Note: this is part of why im not sold on the feature idk it just feels like its fighting against the users intention maybe just doing away with the feature is the best option
- **Site** · Red buttons (Visit site, Play all, Add your ranking, New…) pass contrast on plain red but dip just under on the twill's light threads (4.27 where 4.5 is the bar). Make every red button one shade deeper to pass everywhere?
  → *no pick*
  - Note: can have an option so i can choose between
- *Not answered (5):* `article-pager` · `open-ongoing-tab` · `qr-distance` · `studio-new-hides` · `contrast-tier-a`

### Suggested cuts
- ~~The i4 layout in “Opened item: layout”. It's a comparison, not a candidate.~~ → cut `dlayout=i4`
- ~~“Strip on top (i4)” for phone filters: the strip you asked to remove.~~ → cut `mactive=top`
- ~~“Counts only” for phone filters: it hides which filters are on.~~ → cut `mactive=count`
- ~~Icon-only type labels on items: the yellow Work dot alone is too faint on a white card.~~ → cut `ptypelabel=icon`

### Just settle it
- Browse icon: small enough to just decide on “shakes on hover”. `browseicon=shake` (Shakes on hover) → **Agree**
- UI sounds while music plays: small enough to just decide on “silent”. `uisnd=quiet` (Silent) → **Agree**

## Notes

### Projects (`projects/index.html`)
- **Option “Stack icons”** `stkicon` (every page): i think on a white background colour logos are good but otherwise we should switch to one-colour tinted
- **Option “Ongoing (G5)”** `ongoing`: yeah badge makes more sense. im wondering if the order should be type, status, year because status and year really goes together. also i think the badge could be "icon" only (really the condensed one) / i also kinda like how it looks on the opened card with the icon in the circle...
- **Option “Timeline: stack line (P3.2)”** `tlstack`: this stack line should work like the hashtags on the thoughts page where clicking them lets u clear the filter as well if theyre active. styled the same as well (same on grid)
- **Option “Type on items (P2.1)”** `ptypelabel`: the weird background isnt that good (feels out of place) but the background on the open items also isnt good for contrast but i understand why its dark so just iterate on that ig maybe contrast test and use white on the color if its too dark on dark idk
- **Pin 1 · div .pj-list “20250 projects”**: When there is nothing filtered, two things show nothing to show clear filters its redundant we should show one
  - `div.pj-list` · at `projects/index.html?uisnd=quiet&stagealign=center&stkicon=mono&ptypelabel=text&p=blaqat-net-this-site&ongoing=badge&passed=ring&tlstack=on&dlayout=label&browseicon=shake&status=ongoing&type=School` · with ongoing=badge · dlayout=label · stagealign=center · stkicon=mono
- **Pin 2 · button .ysound “Sound effects”**: maybe when on make the whole tag red with white icon and then when off its the normal tag with the black icon overing over when on should change color to black and do the mute icon basically wanna remove the red outline thingy. also make sure the mute icon is centered/placed correctly
  - `button.ysound.ysound--tag[aria-label="Sound effects"]` · at `projects/index.html?uisnd=quiet&stagealign=center&stkicon=mono&ptypelabel=text&p=fitr-skills-career-roadmaps&ongoing=badge&passed=ring&tlstack=on&dlayout=label&browseicon=shake` · with ongoing=badge · dlayout=label · stagealign=center · stkicon=mono
- **Pin 3 · link .ylinkicon “Visit site: blaqat.net (this site) (opens in a new tab)”**: I think the links on a grid card should have our normal hint popup that shows sooner and shows the text on hover relying on the native hint is too slow also just being consistent (the tabs on music have the hint im referrng to)
  - `a.ylinkicon[aria-label="Visit site: blaqat.net (this site) (opens in a new tab)"]` · at `projects/index.html?ptypelabel=text&ongoing=badge&passed=ring&tlstack=on&dlayout=label&stagealign=center&uisnd=quiet&stkicon=mono&browseicon=shake&view=grid` · with ongoing=badge · dlayout=label · stagealign=center · view=grid · stkicon=mono
- **Pin 4 · article .ycard “blaqat.net (this site)”**: Also just a general ui component rule that i had in my original design, when u have an element thats clickable that contains clickable things like the card that have link action buttons when you press down on the inner buttons it shouldnt play the press animation for the whole container; only that button ur clicking on. gives a better sense of depth and what the action is doing
  - `li.ygroup__item[data-key="blaqat-net-this-site"] > article.ycard.ylift` · at `projects/index.html?ptypelabel=text&ongoing=badge&passed=ring&tlstack=on&dlayout=label&stagealign=center&uisnd=quiet&stkicon=mono&browseicon=shake&view=grid` · with ongoing=badge · dlayout=label · stagealign=center · view=grid · stkicon=mono
- **Pin 5 · button .ychip “Tailwind”**: not sure if these make sense to have the cotton/felt texture they are more like the hashtags on the thoughts page in reality... we can try options tho just dont want these to feel like buttons like visit site and source do
  - `button.ychip.ychip--sm[data-yf="stack:Tailwind"]` · at `projects/index.html?ptypelabel=text&ongoing=badge&passed=ring&tlstack=on&dlayout=label&stagealign=center&uisnd=quiet&stkicon=mono&browseicon=shake&p=blaqat-net-this-site` · with ongoing=badge · dlayout=label · stagealign=center · stkicon=mono

### Project page (`projects/item.html`)
- **Option “Item page: previous / next”** `dnav` (every page): lets do this selection + title on hover

### Music (`music/index.html`)
- **The page:** noticed that the sticky bar flashes when changing elements on this and projects page should fix that / also would like for opened items in timeline view to be a little more visually centered so its like a letter/card right now its leaning too close to the top so like just a tiny bit more padding from the top would look so much nicer / i feel like i said the oppposite previously, but when searching idk if we need the year dividers anymore on grid mode? maybe some other way to show year divide because if ur search only has 3 items each in different years u have to scroll to see all 3 when all 3 could really fit (at least on desktop) but tbh if ur filtering for a year it shold do the divide too theres probably a smart solution we can do / wondering also if the tracks shown in the opened collection if multiple match a search if it should filter out the rest or at least show stronger that the other ones are not included in the seaerch maybe faded out or darker not sure what best route is so try multiple / noticed if u placed ur mouse on the edge of a card in grid it can start flickering hover and unhover state we need the hover boundary to be bigger so it covers both states / noticed on mobile when search is active the disk has a really ugly looking drop shadow thats fully cut off and extended not sure why, when player is active the search button above it looks perfect; nvm relaized tere was a like glow effect above the search but it stops before the music disk so it looks weird that should be touched up keeping my whole thought here so u can see how it looked to me originally / noticed that in timeline view the opened item shifts up and down when opening the player it shouldnt be effected by that imo
- **Option “Opened item: layout”** `dlayout` (every page): (same note as under Choices → Opened item: layout)
- **Option “Instrument colours (M2)”** `mtype`: the hover state for the filters should match the style of projects where it has a soft color tint when hovered not just the text changing color. for piano the current way doesnt show anything since piano is black
- **Option “Player · song vs collection notes (MP3)”** `pnotes` (every page): label should just be "About [collection name]" also add "About this song" instead of this song
- **Option “Player · long-press the disc (MP1)”** `disclong` (every page): next should become disabled if on the last song / also missing click animation on the 3 buttons / also should move the search out of the way either more to the left or just gone until the interation is done (prolly for the best)
- **Option “A song's notes without the player (M6)”** `songnotes`: if the hovered item doesnt have notes dont say "no notes" just remove that text i think i gave feedback on pointless text earlier
- **Option “Bottom items on scroll (phones)”** `mhide` (every page): im not sure about this yet, but if we do keep this feature it will be everything hiding
- **Pin 1 · button .ychip “3 matches”**: i think the trash can dropped icon makes a lot more sense than this. this looks like a rock medal to me idk
  - `div.yfilter__grp[aria-label="Status"] > button.ychip.ysel[data-v="dropped"]` · at `music/index.html?uisnd=quiet&stagealign=center&stkicon=mono&dlayout=rail&browseicon=shake&dnav=count` · with dlayout=rail · stagealign=center
- **Pin 2 · div .ydetail__top “Alphabet City Collection”**: theres a state where the sticky bar shows and the title is fully covered but the title doesnt show in the sticky bar we should make sure it shows
  - `div.ydetail__top` · at `music/index.html?uisnd=quiet&stagealign=center&stkicon=mono&dlayout=rail&browseicon=shake&dnav=count&item=alphabet-city-collection` · with dlayout=rail · stagealign=center
- **Pin 3 · text .ytl__knot**: just noticed it doesnt have the same red circle projects page does lets make sure we are using the same exact component across pages
  - `li.ytl__item[data-key="alphabet-city-collection"] > span.ytl__knot` · at `music/index.html?songnotes=face&uisnd=quiet&stagealign=center&stkicon=mono&dlayout=label&browseicon=shake&dnav=count&disclong=actions&pnotes=divider&mhide=all&mactive=start&toast=bottom&item=marmalade-cafe` · with dlayout=label · stagealign=center · toast=bottom

### Release page (`music/item.html`)
- **Option “Toasts on phones”** `toast` (every page): make sure the undo button is right aligned

### Thoughts (`thoughts/stitched.html`)
- **The page:** when going to a next item the previous selection should animate out while the new one is coming in rather than being on its on timer
- **Option “A pick's article (T1)”** `pickart`: i prefer its on post in functionality but i prefer the pick is the article in design lets try more different design options / i think the issue is that the title feels too long for write ups but the about one feels right idk why / actually no i like write up but maybe just have it in the bottom right similar to read thats what it is clicking that takes u to write up clicking the item takes u to its item page
- **Pin 1 · link .ypost__see “See the post”**: tbh i dont think we need the see the post button doesnt really add a lot going back should just take u to what u clicked on
  - `a.ypost__see[href=".../thoughts/stitched.html#post-p1"]` · at `thoughts/stitched.html?view=collection&c=tools&item=p1&pickart=link&…`
- **Pin 2 · div .t-rail__tags “#tools #learnings #design #ranked #browser #browsers #projects #shower…”**: i think we should limit the amount of tags and have a browser overflow or something idk if it should be here or somewhere else but its definitely needed there are also missing filters for years i noticed in search
  - `div.t-rail__tags` · at `thoughts/stitched.html?pickart=article&…` · with pickart=article
- **Pin 3 · nav .ypager “More articles”**: i like this for article but im wondering what it would look like using the open page design < >
  - `nav.ypager[aria-label="More articles"]` · at `thoughts/stitched.html?view=article&id=a4&…`
- **Pin 4 · nav “ON THIS PAGE Respond on press Interrupt anything”**: when you cant scroll, the table of contents doesnt really work like clicking to a next elemnt we should make sure the interaction stays even tho theres no scroll also switch to its href ig but idk just something should happen over nothing
  - `div.r-toc > nav` · at `thoughts/stitched.html?view=article&id=a2&…`
- **Pin 5 · link .yabout “about My favorite browsers, ranked (ranking)”**: when clicking about im torn between scrolling and ribbon selecting the item it was about and opening the page...
  - `a.yabout.ylift[href="tier.html?id=tl1"]` · at `thoughts/stitched.html?…`
- **Pin 6 · link .yrow “Tools I like 5 picks”**: the default icon is kinda useless sinec it doesnt show on the collections page also looks weird compared to how we do icons for every other item not bad tho i wanna see different options making it feel coheisve or just removing the icon and just having collections be collections
  - `section.t-rail__sec:nth-child(5) > ul.t-links > li:nth-child(1) > a.yrow.ylift[href="stitched.html?view=collection&c=tools"]` · at `thoughts/stitched.html?…`

### Ranking page (`thoughts/tier.html`)
- **The page:** i see in the comments that some are referring to a specific rating but when leaving a comment i dont see how to do that nor does clicking an item do anything... could also have different ways of doin git i could see smart words similar to search bar works or clicking or if u wanted to talk about multiple idk but point is theres nothing i see atm
- **Pin 1 · link .yabout “write-up Ten browsers, a month each 3 min”**: feels disabled maaybe use white here we use darker on white but since we arent on white we should use white
  - `a.yabout.ylift[href="stitched.html?view=article&id=a4"]` · at `thoughts/tier.html?id=tl1&…`
- **Pin 2 · link .ylift “Write-up on Helium: Helium, the quiet one”**: lets try different design options for this (showing a ranking item has a write up) im not 100% sold /
  - `a.tl-wu.ylift[aria-label="Write-up on Helium: Helium, the quiet one"]` · at `thoughts/tier.html?id=tl1&…`
- **Pin 3 · link .ydetail__back “Thoughts”**: theres inconsistency where the back button is on open pages, articles, and. these type of thoughts page we need more consistency overall
  - `a.ydetail__back[href="stitched.html#post-tl1"]` · at `thoughts/tier.html?id=tl1&…`
