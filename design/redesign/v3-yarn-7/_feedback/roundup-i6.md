# The owner's i6 review (verbatim, 2026-11-15)

## The message around it

[screenshot: `owner-i6-track-rows.png`, Music track rows whose action buttons don't line up]
"not sure what happened this iteration... lots of mistakes that im suprised this passed review????"
[screenshot: `owner-i6-tag-browser.png`, Thoughts' "All tags" browser with its ✕ cut off at the top]
"cant even close the more tags button"
[screenshot: `owner-i6-play-hint.png`, a washed-out Play button with a "Play" hint covering the speaker button]

"anyway heres the review we are getting reallly really close
i think in this iteration once updates are done we really need a cuda walkthrough or something just to make sure all interactions are correct because i dont want much more iteartions
also we need to make sure the finalized components page is up to date with the things we dont need removed
studio also needs to match the design
realistically each page should be resuing the same components not introducing their own unless necessary"

## The round-up, as pasted

# Yarn i6 · review round-up
*Copied 2026-11-15 04:11 from review.html*

## ⚙ Choices

### Changed from the default
**Every page**
- **Player · an ongoing song (M7)** `pwip=seam`: The player's stitching is unfinished: red, it stops at a needle (default: Ongoing tape: bar title · a label on the art · a pin on the disc)
  - Note: i think we are playing too hard into yarn for something that doesnt really need to i like the idea but really i just want to say WIP the icon for it also doesnt really give "wip" its just a lasso maybe a hammer or something also instead of red should be something else
**Music**
- **Opened collection while searching (M4)** `trackmatch=fade`: Every song; the rest faded (default: Only the matches · “2 of 4 match · Show all”)
  - Note: this is fine dont like the liek tan fade should just be grey but also remove the tan around the text of the matched we dont need both
**Thoughts**
- **Write-up link on a card (T1)** `cardwu=short`: Slim pill, no title (default: “Write-up →” bottom right, like Read)
- **Article previous / next (T4)** `apager=top`: ‹ n / N › in the top bar (default: Pager at the end)
- **“About” pill goes to (T6)** `aboutgo=scroll`: The thing in the feed (default: The thing's page)
- **Collection mark (T7)** `collicon=stubs`: Its picks' tag stubs (default: Icon in a circle)
  - Note: it looks great in the left side bar but in the buttons to go to it it looks bad id remove it there nd just have the text and the arrow
- **Mention items in a comment (R1)** `rmention=type`: Type @ / # only (default: Tap tiles + type @ / #)
**Studio**
- **Frame** `frame=ink`: Always ink (default: Section colour)

### Confirmed defaults
**Every page**
- **Bottom items on scroll (phones)** `mhide=off`: Always there
- **Opened item: layout** `dlayout=label`: Label first
- **Opened item: stack** `stackchip=tag`: Like Thoughts' hashtags
- **Red buttons (X6)** `redbtn=twill`: Brand red twill (i5)
- **Card meta (O1)** `cardmeta=facts`: Facts: icon in a circle (like the opened item)
- **Grid years while filtering (P4)** `gridyears=fold`: Fold: years with 1–2 results share a divider
**Thoughts**
- **Item has a write-up (R3)** `wumark=bookmark`: Red bookmark (an article's mark)
  - Note: like this but its a couple pixels too high it looks like?
**Studio**
- **Editor on desktop** `layout=split`: Form + live preview
- **Publish** `confirm=smart`: Check only if needed

### Not picked yet (default stands)
Mini ranking marks write-ups (R4) `minimarks`

## Questions
- *Not answered (9):* `dlayout-pick` · `rails-narrow` · `small-card-facts` · `timeline-words` · `status-icon-only` · `logos-off-white` · `sound-hover-off` · `aboutgo-pick` · `tier-a`

### Suggested cuts
- ~~Stacked layout: you narrowed it to label first vs a rail.~~ → cut `dlayout=stack`
- ~~Felt stack chips in the opened item: you said they shouldn't feel like buttons.~~ → cut `stackchip=chip`
- ~~Hiding the bottom items on scroll: you said it fights the user. Cut it and keep them always there.~~ → cut `mhide=all`

### Just settle it
- Red buttons: one shade deeper passes contrast on every thread (5.93:1); the twill dips to 4.27 on its light threads. `redbtn=deep` (One shade deeper (passes 4.5 on every thread)) → *no answer*
- Article previous / next in the top bar, like every other detail page. `apager=top` (‹ n / N › in the top bar) → *no answer*

## Notes

### Home (`home/index.html`)
- **Pin 1 · button .ysound “Sound effects”**: red should be darker, hover should just change icon not change ot white to makes it hard to tell when clicking if something happened / little white dashed line at the top is meh
  - `button.ysound.ysound--tag[aria-label="Sound effects"]` · at `home/index.html?dlayout=label&stackchip=tag&redbtn=twill&cardmeta=facts&pwip=seam&gridyears=fold`

### Projects (`projects/index.html`)
- **The page:** i noticed sometimes i accidentally click a stack tag on the items in the timeline items so maybe we disable the tag in those items opened can still have it sorry for going back and forth on that its fine on grid tho i think / i wonder if we can make the text for the status smarter like comple could be "Completed in [End Month]" Paused in etc etc could be interesting to combine those two / could also try only showing the icon like badges like grid has it on music side as an option
- **Pin 1 · text .yfact “Personal”**: i liked the previous version where the icon was big enough that it felt like when the tag was active it was coming from the icon rather than surrounding it
  - `div.yrow.ylift[data-slug="blaqat-net-this-site"] > span.pj-row__txt > div.ymeta.ymeta--facts > span.yfact.yfact--type` · at `projects/index.html?…&p=blaqat-net-this-site&type=Personal` · with redbtn=deep
- **Pin 2 · button .ychip “4 matches”**: lets make the orange a little lighter for better contrast same with the blue
  - `div.yfilter__grp[aria-label="Type"] > button.ychip.ysel[data-v="School"]` · at `projects/index.html?…&type=Personal%2CWork%2CSchool`
- **Pin 3 · item .ytl__item “Rust Are We Secure Yet? Work Complete Aug – Dec 2024 Python PostgreSQL…”**: theres a gap in the ribbon sometimes its small but noticable
  - `li.ytl__item[data-key="rust-are-we-secure-yet"]` · at `projects/index.html?…&p=rust-are-we-secure-yet&type=Personal%2CWork%2CSchool`

### Music (`music/index.html`)
- **The page:** feel like we dont need the piano/beepbox/daw tags since the icons tell u which type it is would help reduce the amount of icons on an element (opened one doesnt matter as much ig)
- **Option “Opened collection while searching (M4)”** `trackmatch`: this is fine dont like the liek tan fade should just be grey but also remove the tan around the text of the matched we dont need both
- **Option “Player · an ongoing song (M7)”** `pwip` (every page): i think we are playing too hard into yarn for something that doesnt really need to i like the idea but really i just want to say WIP the icon for it also doesnt really give "wip" its just a lasso maybe a hammer or something also instead of red should be something else
- **Pin 1 · slider .yp-vol__track “Volume”**: the ball that shows on hover gets cut off on the left side
  - `div.yp-vol__track[aria-label="Volume"]` · at `music/index.html?…&item=cast-adrift`
- **Pin 2 · combobox .ysearch__input “Search”**: theoretically search should also match text in the description
  - `#search-3-in` · at `music/index.html?…&q=gleaming+shadow&item=gleaming-shadows`
- **Pin 3 · button .ylinkicon “Notes: glooming shadows of alphabet city”**: i understand the weird psacing betweeen this and the external links but it still looks weird id rather everything be spaced simmilarly at least
  - `button.ylinkicon.ylinkicon--sm[aria-label="Notes: glooming shadows of alphabet city"]` · at `music/index.html?…&item=alphabet-city-collection`
- **Pin 4 · div .ydetail__top “Alphabet City Collection”**: there are times where theres barely a scroll and the top bar shows i think at minimim it shouldnt show until passin the height of it in scroll distance?
  - `div.ydetail__top` · at `music/index.html?…&item=alphabet-city-collection`

### Thoughts (`thoughts/stitched.html`)
- **Option “Collection mark (T7)”** `collicon`: it looks great in the left side bar but in the buttons to go to it it looks bad id remove it there nd just have the text and the arrow
- **Pin 1 · aside .t-rail “Browse thoughts”**: we can show a little more things verticaly theres room...
  - `aside.t-rail[aria-label="Browse thoughts"]` · at `thoughts/stitched.html?apager=top&aboutgo=scroll&cardwu=short&collicon=stubs&rmention=type&…`

### Ranking page (`thoughts/tier.html`)
- **Option “Item has a write-up (R3)”** `wumark`: like this but its a couple pixels too high it looks like?
- **Pin 1 · item .tl-empty “drop here”**: the drop ehre text is lazy we can do better
  - `ul.tl-zone[aria-label="Ride or die"] > li.tl-empty` · at `thoughts/tier.html?id=tl3&mode=add&…`
- **Pin 2 · button .tl-ref “JetBrains Mono: show it on the board”**: either the highlight needs to be less rounded or the square icons need to be circles so they fit each other and not look wonky
  - `button.tl-ref[aria-label="JetBrains Mono: show it on the board"]` · at `thoughts/tier.html?id=tl3&…&rmention=type` · with rmention=type
