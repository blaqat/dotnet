# Yarn i8 · review round-up
*Copied 2026-11-16 11:46 from review.html (pasted by the owner, word for word)*

Owner's message with it (word for word):

> ok i dont think the dakr was dark enough but this was more of an expierment than something i actually want to do didnt even have dark theme on my original site
> this iteration i went in on studio the main site looks good now so u can remove main site stuff for i9 just focus on studio to keep things easier

## ⚙ Choices

### Confirmed defaults
**Every page**
- **Theme (dark mock)** `theme=light`: Light

## Questions
- **Site** · Should the real site ship the dark theme, and how? Auto = dark whenever the visitor's device is dark. A toggle = a small woven switch (beside the sound tag) that remembers the choice. Both = auto by default, the toggle overrides it.
  → **No, light only** `dark-ship=no` (suggested: Auto + a toggle)
- **Site** · If dark ships: the sheet is a warm charcoal wool with the knit drawn light-on-dark, cards a step lighter, text cotton (never pure white), and floating things (menus, the player, the phone search) a step lighter again. Keep that, or go deeper (near black, more contrast with the frame)?
  → **Deeper, near black** `dark-sheet=deeper` (suggested: Charcoal (as built))

## Notes

### Studio (`studio/index.html`)
- **Pin 1 · button .btn “New post”**: clicking this opens like 20 modals
  - `div.yhead__actions > button.btn.btn--red` · at `studio/index.html?theme=light&screen=list&section=thoughts`
- **Pin 2 · link .ycard “Playlist tracks from your music”**: i explicitly stated that i wanted playlists to support not just my music but soundcloud bandcamp spotify and youtube so i can post my yearly music roundups
  - `div.st-sheetwrap:nth-child(12) > section.st-sheet > div.st-sheet__body > div.st-newgrid > section.st-newgrp > div.st-newopts > a.ycard.ylift[data-section="thoughts"]:nth-child(4)` · at `studio/index.html?theme=light&screen=list&section=thoughts&ttype=playlist`
- **Pin 3 · field .yfield “## Start with a heading Write in markdown.”**: i need a way t easily insert yarn components here so i can make things that fit the rest of the pages especially for stuff like links using my link component if i want it to
  - `#md-3s` · at `studio/index.html?theme=light&screen=compose&type=article&id=a-mwj61213`
- **Pin 4 · item .st-check “1 words Pretty short for an article.”**: pin icon makes no sense here should be a warning icon also dark red on medium dark grey looks bad
  - `li.st-check:nth-child(2)` · at `studio/index.html?theme=light&screen=compose&type=article&id=a-mwj61213&pstate=error`
- **Pin 5 · div .st-field “SoundCloud”**: specifying link is too limiting i should be able to give a list any of arbitrary links and the ones we recognize we convert /
  - `div > div.st-fieldrow > div.st-field:nth-child(1)` · at `studio/index.html?theme=light&pstate=error&screen=music&id=revealed&track=0`
- **Pin 6 · div .st-field “Instrument the yarn says it, so the site never labels it Piano black ya…”**: what if i have a collection thats multi type like one song is piano another is daw right now we dont support that but its 100% something that will happen
  - `div:nth-child(2) > div.st-field:nth-child(1)` · at `studio/index.html?theme=light&pstate=error&screen=music&id=revealed&track=1`
- **Pin 7 · section .st-sec “DETAILS”**: i think it would make sense if switching to complete or dropped to auto fill finished
  - `section.st-sec:nth-child(3)` · at `studio/index.html?theme=light&pstate=error&screen=music&id=revealed&track=1`
- **Pin 8 · tab .ysel “revealed”**: the tab is cut off on the top hard to see its highlighted
  - `#tab-2` · at `studio/index.html?theme=light&pstate=error&screen=music&id=revealed&track=2`
- **Pin 9 · div .st-field “Finished — Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec — 2027 2026…”**: finished should be disabled for wip
  - `section.st-sec:nth-child(3) > div.st-fieldrow > div.st-field:nth-child(2)` · at `studio/index.html?theme=light&pstate=error&screen=music&id=revealed&track=2`
- **Pin 10 · radiogroup .st-choice “WIP Complete Dropped”**: wheres the start and end time dont forget collection items can show up as singles and also have the same metadata a normal song does
  - `div.st-field:nth-child(3) > div.st-choice` · at `studio/index.html?theme=light&pstate=error&screen=music&id=revealed&track=2`
- **Pin 11 · section .st-sec “DETAILS”**: wheres te place to add links for a collection usually youd make a playlist/album in sc or spotify and tht would be the link for the whole collection /
  - `section.st-sec:nth-child(3)` · at `studio/index.html?theme=light&pstate=error&screen=music&id=revealed&track=2`
- **Pin 12 · div .st-wrap “Music.”**: how do i set the order of how it shows on the site like maybe i decide to do it alphabetically for some reason... or by end date which i think is what my old site did because i noticed we have a different order here than there / (wip shows at top, dropped uses its start date if no finished is there, complete uses its start date also for collections the start and end date are automatic based on the songs)
  - `div.st-wrap` · at `studio/index.html?theme=light&pstate=error&screen=list&section=music`
- **Pin 13 · div .ysearch “Stack”**: if i add an item that we dont have yet it should automatically find the logo
  - `div.ysearch[aria-label="Stack"]` · at `studio/index.html?theme=light&pstate=error&screen=project&id=studio`
- **Pin 14 · div .ydetail__text “Write-up preview”**: id like it to just be a live markdow editor like notion with blocks that would make adding our yarn blocks easier tho u can have button to view raw markdown
  - `div.st-md__prev.ydetail__text[aria-label="Write-up preview"]` · at `studio/index.html?theme=light&pstate=error&screen=project&id=studio`
- **Pin 15 · section .st-sec “LINKS”**: same iss about links here bieng too limiting i should also be able to choose the copy/text for a link
  - `section.st-sec:nth-child(4)` · at `studio/index.html?theme=light&pstate=error&screen=project&id=studio`
- **Pin 16 · div .ydetail__actions “Published”**: the published loading had a like tan loading color make it black
  - `article.ydetail.ydetail--page > div.ydetail__top > div.ydetail__actions` · at `studio/index.html?theme=light&pstate=ok&screen=project&id=studio`
- **Pin 17 · radiogroup .st-swatches “Tag stub colour”**: why do these not use the x pattern that it does on the actual item minor thing but
  - `div.st-swatches[aria-label="Tag stub colour"]` · at `studio/index.html?theme=light&pstate=ok&screen=compose&type=pick&id=p1`
- **Pin 18 · field .yfield “https://…”**: why not multiple links also it doesnt show in the preview
  - `#f-2w` · at `studio/index.html?theme=light&pstate=ok&screen=compose&type=embed&id=e1`
- **Pin 19 · div .st-prevbox “Sona character sheets : open the 5 images”**: here and on the site we should probably limit to. 2 rows 1 big 3 small or maybe turn the 2nd row into a carousel idk
  - `div.st-prevbox` · at `studio/index.html?theme=light&pstate=ok&screen=compose&type=embed&id=e1`
- **Pin 20 · button .st-tier__c “Tier 3 colour: Pink. Change colour”**: make this opena. color picker rather than having me cycle for years
  - `button.st-tier__c[aria-label="Tier 3 colour: Pink. Change colour"]` · at `studio/index.html?theme=light&pstate=ok&screen=compose&type=tierlist&id=tl2`
- **Pin 21 · button .ysel “Neovim, in tier A”**: how do i edit already made "things"
  - `button.st-titem__btn.ysel[aria-label="Neovim, in tier A"]` · at `studio/index.html?theme=light&pstate=ok&screen=compose&type=tierlist&id=tl2`
