# Owner feedback on iteration 1 → what iteration 2 must do

Source: the owner's review on the Notion page "Redesign: Round 3 Mocks" (2026-11-10). Their words are quoted as written, typos included; don't "correct" their meaning. Images they attached are in `_feedback/` and are referenced where they belong. Iteration 1 is untouched at `../v3-yarn/` for comparison. The owner's **original live site** is https://blaqat.net (source in this repo under `src/`), and they often say "my original design" or "my old design": screenshot the live site with Playwright when you need it.

Overall verdict: "GREAT start though generally." The main process problem: **"having multiple subagents create the pages from scratch created discrepencies between the pages"**. Iteration 2 fixes that: shared parts live in the kit, and every page uses them.

---

## A. Site-wide / kit (inline annotations + general notes)

- **Mono font:** "could use maple mono it fits more with the style" → use Maple Mono instead of JetBrains Mono.
- **Body font:** "not sure about system font for body" → offer 2–3 body-font options (a ⚙ param), recommend one.
- **Background texture:** "my artist friend said the background could use some work i dont really see an issue with it but im not an artist … i think its probably how the ties and the diamonds play together because by themselves they look fine but together it looks not cohesive" → a separate Fable agent proposes sheet-background options in `kit/bg/`.
- **Top bar (desktop) + mobile nav:** "im not a fa of the ring or how the tabs look maybe give them more love and depth i do like my og design where its centered but now we'd have an uneven amount of buttons unless we made home one which isnt really normal so its fine for now just give the buttons love same on mobile tbh" → `_feedback/01-topbar-original-centered.png` (their original: the cat logo centered between Projects and Music pills).
- **Hover vs selected:** (from Projects) "Should follow the example of the thoughts page, where hover just brings the item upwards with a shadow, then the selected one can have the rope ring. The reason being seeing the ring animate as u move ur mouse is distracting and it honestly just looks bad sometimes…" and (from Thoughts) "this black makes me wonder if making selected items black would be better than the rope ring can play with that idea too in the other pages". → One kit-wide rule: **hover = lift + shadow; selected = rope ring OR black fill (⚙ option)**.
- **Rope placement:** "i like the rope but i think maybe it might look better if it fit in the button instead of around it? lets try that maybe im wrong" → offer rope-inside as an option.
- **Tags:** "Tags should do something on hover i like cute ux, also if hovering to remove can do a red strike through similar to my old site" → `_feedback/02-tags-remove-strikethrough-original.png`.
- **Stack tags:** "i dont like that the stack tags are now just text it should at minimum include the icon could be icon and text". The original site uses devicons (`src/lib/devicons.ts`).
- **Filter row:** "On the filter tags row i noticed each page has a different design which is good to help me pick the one i like but bad for site cohesiveness haha i REALLY like how thoughts has it done each page should do it like thoughts … u could do the scrolling list and then the Browse which would show more options for the stack tags and what not".
- **Page titles:** "Each page should also have the red period and title size/font style as thoughts does".
- **Item detail as a page (option):** "TBH if each page worked like thoughts generally it would be better like opening an item takes u to a new page rather than shifting. layout then u go bak to browse id like to try that as an option".
- **Metadata consistency:** "make sure we show things consistently between the pages if we decide on a design cause in this one date shows different than thoughts and projects". Status/type/date/stack must look the same everywhere.
- **Status as badges, not text** (from Projects): "using colors/icons/materials for things like completed vs in progress (though we have the ribbon for improgress, completed is boring doesnt need something over the whole card but maybe just a checkmark badge and dropped can be a trash bag or something idk we can be creative); similarly type can be icon based school, work, personal all have icons so its like a couple badges and then time. Stack can also be a series of icon badges".
- **Tags navigate:** "clicking tags (even when on a different page like collections) should take u to the thoughts page with that tag filter like it does on the thoughts page".
- **Filtering animation:** projects' animate-in/out on filter is loved ("Love how the items animate in and out when selecting tags"); Thoughts should do the same "would be nicer than just the fade".
- **Lightbox everywhere:** project images "Should be able to open the image in lightbox like thoughts".
- **Section transition:** "i think the transition easing style feels wonky when it should feel smoother it like currently starts slow and snaps up also sometimes the page content loads before the colored first half of the transition is done we need to make sure its hidden until the white uncovers it".
- **Sound effects:** "maybe also have an agent investigate sound effects for the whole app".
- **Cat animation:** "i do think the walking cat could be improved maybe theres some tools i can give u for u to make it look better rather than doing it raw can have a sonnet/terra investigate…"

## B. Home

- **Intro schedule:** "to be honest i like all three of this it might be that first time always does drop, subsequent with in an hour session does simple and then both randomly on rare occasion maybe 1/500 chance u get the cursor ball…"
- **Ball physics:** "for the ball fall if it could bounce and roll with a little bit more exaggerated squash and stretch that would be cute".
- **Keywords:** "we can add some love to the animations when hovering the key words can do the little pop of paper stuff like we do for the buttons below and RIT lost its orange color thats important maybe the text can be drawn in and use the cute bubly font".
- **Mobile layout:** "mobile layout looks off the text is in the center but it feels really bunched together with so much space inbetween it and the buttons… or maybe its the header is too high and buttons too low.. i think theres many places my original design has better ux this is one of them" (compare with https://blaqat.net on a 390 px phone).
- **Entrance:** "it would be cool for each text section to fade in after each other (really briefly) with animations for the keywords as it comes in as well as the underlines being drawn in (the stack tags count as key words)".
- **Mobile nav on home:** "mobile i think should just use the normal mobile nav at the bottom since its basically doing the same thing right now so the contact button can be moved above the nav or tbh idk if contact button needs to be there on mobile could just put the contact icons on screen".
- **Underline:** "i do miss the scribble underline rather than the dashed one".
- **Section-button hover:** rope inside the button (see A); "also not sure if i like te rotated icon maybe it can rotate back and forth like it shaking the music notes out but settle back in normal place".

## C. Projects

- Love: items animating in and out when selecting tags. Keep.
- Hover = lift + shadow; selected = rope ring (see A). Desktop list: "Do not select on hover, well actually maybe do but apply the same ring feedback where hover should just bring an item forward not do the ring".
- **Header is too busy:** "I think we show too many options to click above the content i care about also everything is the same i used color previously to help build a mental map of what is what and wht effects what we can use icons to do the same thing now but currently the cards dont show the icons other than building ribbon"
  - "I'd prefer a search bar like i had previously / whats on the music page"
  - "Really remove the subtext it should just be title, search bar (a whole line), show all , type tags | status tags dont need stack"
  - "Search bar could make it so if u searched Python it turns into a python stack tag with the icon and name which u could click to remove"
- **Grid:** "Grid shouldnt really max out at 3 or 4 my original design was able to show a lot more because the grid layout was maxed at 2 items we lose a lot of information right now like the stack cards the quick copy links etc (which im kinda ok with the latter but just a note i guess this is what happens when its image first…) for items that dont have an image we could show text it doesnt have to be uber consistent layout we want to show the most important information as we go". Also (mobile section): "the 2 column grid would work better on desktop like what we have on desktop more tho because less layout shifting".
- **Scroll on open:** "The scroll when opening an item in a different row should scroll u where its going to snap at the end right now it scrolls u smoothly but then snaps u to a different position once its open".
- **Opened item media:** "I think the image takes up a little too much space in the opened section the content is hard to read. idea should be we show an image gallery carousel with the content not that it takes up 50% similar to my old design" → `_feedback/03-project-open-original-vs-i1.png` (left: original modal with a small Media row; right: iteration 1 with a huge hero).
- **Video:** "videos dont have sound they should be able to be unmuted (muted by default) also with video controls to scrub play/pause (i think there was a play button in the top right which doesnt make sense)". Real videos exist in the repo at `public/media/*.mp4`.
- **Write-up:** "I like the idea of write up but currently theres no functional difference between it and "show more" other than it having a preview and currently the write up is impossible to read because the preview takes up half the screen … It would almost make sense as an action button to go to a thoughts article "from the article"" → `_feedback/04-writeup-preview-too-big-i1.png`.
- **Opened layout:** "For the opened i almost feel like there should be a sticky title and sticky footer … put the status/metadata at the top where it belongs under the title … Reason being is because this almost works as a resume the most important parts for a resume are the name stack time and type then the content … So theoretically ordered title, metadata, content [media], content [text], links".
- **List view = timeline:** "Like the layout generally, but i wanted it to be a timeline currently everything is too close too small we can give it more spaec and also bring back the year separation like round 2 had it if we reuse the timeline concept thoughts has except the yarn ball would be on the currently selected project (also ntoe this was in my original design for the site, just never implemented)" → `_feedback/05-projects-timeline-original-sketch.png` (their original sketch: years, dashed timeline, filled dot on the open project) and `_feedback/06-projects-list-years-round2.png` (round 2: search bar, type filters, years, timeline ticks, stage).
- **Opened preview image (list/stage):** "the preview image is really for the closed state so u get an idea of what ur looking at" — it takes "wayyy to much space" when open.

### Projects on mobile
(The owner's heading here reads "Mobile / Music" but the content is about mobile Projects.)
- "The filter picker is a lot better now here just im pretty sure we could fit the 6 filters on a screen without a scroll but its nice to have the option"
- "Readd search bar similar idea"
- "the carousel idea is the best by far at showing the most content but the filter doesnt really work well with the bottom timeline kinda thing its also not really intuitive — Maybe we can try a tiktok type of view except it would be cards of content"
- "really im thinking a verticle single column list would work the best for mobile similar to my initial design idea" (`_feedback/05`) — "the one u are scrolled to (or really the one u clicked on) is the one thats opened like in the b Rows version — do the year separation from the thoughts page here where its sticky and white oval shapped"
- "im wondering if it mkaes more sense to have a search FAB above the navigation maybe overlapping a little when u click it expands to screen width and u can search and filter there rather than on top (this would remove the filter sticky bar so we can see more content) we can try this idk if ill settle on it or not or maybe search is just for search and tags can be sticky"
- Filter row like Thoughts, detail-as-page option, red-period titles (see A).

## D. Music

- **Yarn per instrument:** "I like the yarn designs if we were consistent making black do piano, beepbox (needs to be purple) should be circles like the beepbox logo, daw can be blue still but designs should be like different kinds of waves like square, triangle, sine, saw, etc"
- **Folders are back:** "I think i prefer my old design with the folders for the collections it does a lot in a little space — shows u its a collection — shows u visual idea of how many tracks — shows u which individual track is playing — u can see the name if u hover (really they should be clickable to start it or open it idk) — opening the collection tool u to the item" → `_feedback/07-music-folder-cards-original.png` (original: track tabs peeking above the card, "(7 tracks)", Play All + queue button; singles have a round play button and link icons).
- **One list:** "theres definitely room for improvement for ux but the idea of the folder makes the most sense rather than showing a list would let us put everything in one list because i dont like the separtion of single from collection at all"
- "each item could have a play wth collection play all for the another difference teller like my old design — tho with the yarn thing we dont really need to show "piano" or the icon since the yarn gives that information"
- **Opening:** "when it opens it needs to scroll… or something — maybe it should work like projects where it doesnt actually shift layout — or also i like the idea of it opening docked to the right side for collections, but wed need to scale the things on the left such that the layout doesnt actually change can play with both ideas in this second iteration"
- "the play button shooting music notes out is cute but too exaggerated atm feels unnecessary"

### Play bar
- "I think it needs to be collapsable like i had for mobile previously when collapsed it can be a FAB with the spinning or still disk that was made for the thoughts playlist"
- "On mobile as well, we can get rid of the combined nav and music player can be the disk and opening expands to show the bar with open to open up swiping up on bar can expand to full page as well and to the right to close idk play with this idea — could make it so swiping diagnally or up opens the full page immediately"
- "when opened it can expand out to how we have it now"
- "the pin scrub line shouldnt show unless hovering or on mobile (since theres no hover on mobile) — also its missing the darker or lighter indicator when u hover wher ethe pin is goinng to go (same with volume)"
- "the play < and > buttons should be to thr right of the scrub bar — play icon in button isnt centered correctly; pause is"
- "volume should work like youtube where it shows just its icon and on hover expands to let u control volume or click to mute. if it shifts layout it needs to be anchored ina. way that hovering doesnt move where the icon is" → `_feedback/08-volume-youtube-style.png`
- "when opened i prefer the panel over bar option, but it should be a PART of the bar rather than a whole separate component that shows visibly more forward like it should actually grow from and literally lines connect (one dotteted line for separation) then animated back"
- "the soundcloud/beepbox/copy link buttons are worse than they were previously go back to using the icons i had chosen for each or at least one based off that because beepbox should be a circle, soundcloud should be the soundcloud logo same with youtube etc also theres no need to have the word "SoundCLoud" if we have the icon" (original: `src/components/Music/MusicCard.svelte`, `MusicModal.svelte`)
- Same date/status display as everywhere else (see A).

## E. Thoughts

- "not too many thoughts on thoughts i think it was nailed — desktop masonary by month is great mobile would be the same except listed i dont think we need the yarn balls"
- "i wonder if scratch would look better yellow like a sticky note idk i like how it is a lot just wanna see something else (blakc sticks out a lot)" → offer a sticky-note option.
- "clicking an images type should just open the lightbox like clicking an image on it would (the first image)"
- "clicking a pick should take u to the list scrolled to the item like the tools i like on it would"
- "id like the items to animate similar to projects when filtering would be nicer than just the fade"
- "i think the type tags collections works great on desktop on the left side doesnt take too much spaece" (keep the left rail)
- **Tier lists:** "Note only I can make the tier list not anyone; anyone can put their ranking on mine… id also like people to be able to post comments so there should be a tier list page clicking the item takes u to — the buttons "make your own" and "remix this one" should be replaced with something to just make ur ratings essentially"
- Tags navigate to the Thoughts page filtered (see A).
- Ethereal wasn't mentioned: it's not carried into iteration 2.

## F. Studio / content management (new)

"We didnt have it here but it was in round 1 where there would be a separate page or separate app where i can add and manage contnet on each page. This is where i would create the tierlist and everything. Need to have mocks for this in our style can reference round 1" — Round 1's Studio: a mobile-first `/studio` (Cloudflare Access sign-in), content list with drag to reorder, a media-first editor, autosaved drafts, Publish goes live in seconds, upload photos/videos from the phone (poster frames generated), tracks get duration + waveform on upload, revisions/undo, media library with usage counts, import from Notion.

"I'll probably have more to say after the next iteration but this is enough to go off for now"
