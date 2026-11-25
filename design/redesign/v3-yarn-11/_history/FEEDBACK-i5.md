# Iteration 5 · refining the details

`v3-yarn-5/` is a copy of `v3-yarn-4/` (keep i4 frozen for comparison). Older: `../v3-yarn-3/` (i3, Thoughts deep dive), `../v3-yarn-2/` (i2), `../v3-yarn/` (i1, "the old one"). The live site's source is in the repo at `/Users/blaqat/dev/projects/my-litterbox/src/` (the owner's "original design", e.g. `src/components/Music/*`).

The owner's words are verbatim (typos kept). **→** lines are the build reading, with the owning agent in brackets (see `BRIEF-i5.md`). Owner's opener: "we are getting SO close!!!! a lot of this is refining the smaller details".

**Standing decision:** every ⚙ option the owner did not mention in i5 is decided at its current default. That closes all the i4 open questions (sound tag text → see G2, `kwline`, `sheetin`, `callout`, `gcols`, "All" at rest, the Thoughts status line, the Music count line, phone panel order, `discat`, search keyboard, 360px mute). New "try this" items are built as the default with the old behaviour one click away in ⚙, both listed under **Open**.

---

## General

**G1** "remove all the options from mock option menu that we decided on i want to hone on on the actual open design decisions / if i dont mention it assume the default is what i want from now on / can have a more/previous hidden/collapsable menu for rht other options if u want but yeah"
→ The ⚙ panel gets three parts: **Open** (expanded; only the decisions still open, mostly new in i5), **Jump to** (demo-state helpers: which item/release/ranking, player view, demo playing, FAB open…), and a collapsed **Earlier options (defaults kept)** with everything else, so old URLs still work. Group flags: `open: true`, `state: true`; no flag = earlier. [chrome builds it, tags the kit groups and Studio; every agent tags its own page's groups.] Studio isn't reviewed yet, so all its options stay Open.

**G2** "the sound on stands out too much while on tbh i think a mute icon would be just enough"
→ The sound toggle is icon only (speaker / speaker-slash) with an accessible name; no "SOUND ON/OFF" text. Same placement (`soundui=tag`). [chrome]

**G3** "“All” filter should be a circle"
→ The "All" chip is a circle on every list page (desktop + phones). It also fixes MO7. [chrome]

**G4** "Browse button in filter icon rotating looks bad because its not like a more carret either just make it shake and not rotate or use a carret"
→ Two versions: the icon shakes like other icons and never rotates (default), or it becomes a caret that turns when the sheet opens. `?browseicon=shake|caret`, Open. [chrome]

**G5** "the ongoing banner feels like it should co on the side of cards likea. proper ribon idk could be something to try"
→ Try a real ribbon on the card's side/corner for ongoing projects (cards in timeline, grid, phone list, open item). New ribbon is the default; today's badge is the alternative. `?ongoing=ribbon|badge`, Open. [projects; layout matches it in the open item]

**G6** "grid: i think im just leaning on open in new page rather than in line too many issues with the inline"
→ Decided: grid items open on their own page (`open=page` default for Projects and Music; inline moves to Earlier).
- **G6.1** "for newest vs older lets just do next/previous its too much and maybe just have it at the top replacing the carrots so its in 1 spot the top bar is sticky anyways… / can try different designs for this" → Drop the bottom Older/Newer pager on item pages. Previous/next lives once, in the sticky top bar, where today's ▲▼ caret buttons are. Build 2–3 designs as `?dnav=`, Open. [layout]
- **G6.2** "similar comments for layout to the projects timeline open item stuff" → The grid's item page gets the same layout work as P3.3. [layout]

**G7** "theres a few places where the hover shadow is cut off by some container like for instance the thoughts tab looks good in the thoughts page but the shadow gets cut off in the tools i like page lets try to fix that everywhere"
→ No container may clip a hover-lift shadow anywhere (scrollers, `overflow: hidden` media boxes, collection pages like "Tools I like"). Every agent fixes its own pages; chrome fixes kit containers and builds the site-wide check. [all; chrome checks]

**G8** "i think app sounds should mute when music is playing potentially"
→ UI sounds (taps, chips, shakes) go silent while the player is playing. `?uisnd=quiet|always` (quiet = default), Open. [chrome]

## Home

**H1** "Sound needs to start off if its raelly not on"
→ The toggle must never say "on" while nothing can play (before the browser allows audio, or before the visitor turns it on). Start in the muted state; the Home callout flow stays consistent with it. [chrome owns `kit/sound.js` + toggle; home checks the callout]

**H2** "for composing make it do the ripple 2 remove the purple music icons and change the music icons that fall from the wave purple instead of black. BOOM"
→ "composing" also gets the letter ripple; remove its purple music-note icons (the hover caption ones); the notes that fall from the wave are purple instead of black (this replaces the old "note bursts stay black" rule for composing). [home]

**H3** "the stack tags dont need to ripple can have the icon shake like normal tho."
→ Home's stack tags: no ripple; the icon shakes on hover like every other icon. [home]
- **H3.1** "wondering if the stack icons have line icons or if theres libraries for that. lets do some ivestigation because it would make the red background tags on other pages have look ebtter if we can just say hey its white lines here and colored here idk" → Research mono/line versions of the stack icons (devicon `-plain` / `-line` variants, Simple Icons, others) for every stack name we use, so a tag on a red (selected) background can show a white glyph and coloured elsewhere. Write `research/STACK-ICONS.md` (coverage table + licence + how to render white, e.g. CSS mask) and, if it works, a kit option `?stkicon=`, Open. [home]

**H4** "need the area that triggers the contact tags to be a little bigger i see flashes sometimes since people naturally move the mouse to the edges"
→ Bigger, stable hover area for the contact reveal; no flicker when the pointer runs along the edges. [home]

**H5** "on mobile the contact can be circle rather than with the names similar to what we did for the stack tags"
→ Phones: contact links are icon-only circles (accessible names kept), like the phone stack tags. [home]

## Projects

**P1** "why is there a weird outline when complete/ongoin/paused is filtered in the items is it trying to style like thoughts? cuz it needs to be fixed rn either way"
→ Bug: a status badge that matches the active filter shows an odd outline. It should use the in-card match style only (`.is-match`, i2 chip background), no outline. [projects]

**P2** "Lets try colors for the main tags blue - personal, yellow - work, orange - school. Needs to follow our styling guidelines of on hover color for the tags, but on the items they should be colored easily identifiable"
→ Type colours: personal blue, work yellow, school orange (yarn-toned, readable). In the filter rail they follow the chip rules (hover lifts and shows the colour; selected = filled); on items the type badge is always in its colour. Open (`?ptype=color|plain`).
- **P2.1** "maybe can try not having the text as well for the items just doing the icon" → `?ptypelabel=text|icon` on items, Open. [projects]

**P3 Timeline**
- **P3.1** "when u pass something on the timeline lets try having it have an open red circle instead of the grey dot that future stuff shows" → Knots the ball has passed become open red rings; knots ahead stay grey dots. `?passed=ring|dot`, Open. [projects]
- **P3.2** "try showing the stack tabs in line i think we have enough room for one more line in the timeline cards" → One line of stack chips inside each timeline card (overflow → "+n"). `?tlstack=on|off`, Open. [projects]
- **P3.3** the open items: [layout]
  - **P3.3.1** "still feels like everything is everywhere (u have action light buttons at the top right with space before title on left then compelte and personal have different icon and fonts then the month has a different font then the stack tags have a different icon and text format than the compelte AND what project was for THEN u have big action and little action links and sometimes anotherlink for read the write up but thats on the RIGHT then the text then the “in thoughts” hashtags sometimes which tbh idk if we even need) ave a fable agent draft up some layout options just make it feel better…" → A Fable agent drafts 2–3 genuinely different layouts with one grammar each: one meta style (status, type, date, stack share one icon + type treatment), one place and one style for links (primary + secondary), the write-up link with the other links, a decision on the "in thoughts" hashtags, title not pushed around by the action buttons. `?dlayout=`, Open, with a recommendation.
  - **P3.3.2** "missing the left dotted outline thats on every other component" → The open item gets the same dashed stitch outline every other patch has.
  - **P3.3.3** "the stack filter tags should be styled like they are in thoughts its almost there but when u highlight when its already selected it should have the red dashed line drawn in right?" → Stack tags in the open item behave exactly like Thoughts' chips: selected = red fill, and hovering a selected one draws the red strike-through (the remove affordance).
  - **P3.3.4** "media when hovered has a shadow, but the shadow is cut off by the container for the media section so it looks bad" → Media hover shadow never clipped (G7).
  - **P3.3.5** "maybe try centering it rather than stuck on the top? not sure if id like it more so have it as an option just curious" → `?stagealign=top|center` for the timeline stage, Open.

## Music

**M1** "theres no need to bring the piano/beepbox/daw tags into the cards when filtered" → Filtering by instrument doesn't inject instrument tags into cards. [music]

**M2** "trying color tags again piano black, beepbox purple, daw blue" → Instrument colours, same rules as P2. `?mtype=color|plain`, Open. [music]

**M3** "i think we should try to put the moving bars that go up and down whenn playing in the icon similar to the playlists in thoughts / this would reduce any need for shifting in many places / oh the music collection tabs wouldnt need them in this case just the active tab would be the one playing" → The playing bars replace the icon inside the play button (like Thoughts' playlist card); nothing beside it shifts. Collection tabs lose their bars; the active tab is the playing song. [music]

**M4** "collection tabs the area behind the tab should be a little darker currently its the same color as the tabs need to give a tiny bit more sense of depth" → Slightly darker strip behind the folder tabs. [music]

**M5** "hovering over a tab and then going up to the tip to add to queue is bad ux requires too much precision can leave adding to the queue when fully opening a collection imo / or draft mocks for other ieas but i cant see this working… the tab is already on the edge of bad ux i just like it because its interesting and does a lot at once in a compact design" → Remove add-to-queue from the tab tip. Add to queue lives in the opened collection (per song + whole collection). Optionally one or two other ideas as options. [music]

**M6** "currently the only way to view the actual text of songs in a collection is by opening the queue fully which isnt really intuitive come up with a few ideas on a better simpler route to also see it" → 2–3 simple ways to read a collection's song list from the card/list without opening the player, as `?songlist=`, Open. [music]

**M7** "for tabs the show vs dont show / if its not in the search result dont show / if it doesnt have audio dont show (its purpose is for easy play" → Tabs only for songs that match the current search/filters and have audio. [music]

**M8** "also note if there is only one tab left it should convert to a “single” card where it starts with the collection name - the song name in bold (my original design did this and it was pretty sweet)" → One tab left → the folder becomes a single card: "Collection — **Song**". See the original in `src/components/Music/`. [music]

### Music player [music]
**MP1** "disk view: wanna try an iteraction where if u long hold u get the key actions float above the fab or next to rather like play mute skip just curious if ill like this" → Long-press the disc: play/pause, mute, next float beside/above it. `?disclong=actions|off`, Open.

**MP2** "condesnsed view: also another thing from my original design in the music player, doing do x of x for collection just do from “collection name” / we should be able to have the name show on desktop just make the music scrubber a little smaller have some balanced max/min width before showing elipsis" → Bar subtext "from <Collection>" instead of "x of y"; on desktop it shows too, with a slightly narrower scrubber; title/subtext and scrubber get balanced min/max widths before ellipsis.

**MP3** "expanded view: not sure how i feel about collection notes being at the bottom but ig it makes sense maybe a divider to separate the 2 types would be good idk im open for other roptions as well / also similar ctritigues about the first sections layout as the other layouts but its better here from this iterations cleanup on the previous / also note the big image doesnt need the play symbols here from that reuqqest changed it would only be the item in the queue on the right side" → Song notes and collection notes clearly separated (divider + label, or another arrangement as an option `?pnotes=`, Open); the head section uses the same meta grammar as the layout work; the big art shows no playing symbol (only the queue row does).

## Thoughts [thoughts]

**T1** questions about linking artifacts to articles:
- "what if i wanted certain types of artifacts to he able to link to articles similar to write ups in thoughts like maybe i have an article for a ranking or even maybe a write up per item in the ranking"
- "an example would be for the browser arnking id have a write up going through everything and maybe id have a review for each browser it would be nice to have a way to link the information together in some way other than hashtags like saying this helium in the ranking has a write up but idk how that would be designed could make some mocks for this as well as the more basic artifact can have a write up"
- "another example would be for collections what if i wanted a write up for ghostty see the post just takes u to the thoughts page would that whole write up be placed in the pick card and expand it? idk makes more sense that a pick COULD just be an article thats styled differently since its a collection idk feels like theres multiple routes but we just need a consistent mental map about what these concepts mean"
- "write ups should show in thoughts generally like projects→write up opens in thoughts but u cant find that same write up in thoughts by itself a write up should basically just be an article not sure why its a different concept “from projects” it should just be ana rticle with an indicator/link that its for a project artifact idk"
- "collections are a weird outlier since the picks are what are the artifacts colleciton just is a more intentional grouping than filtering so its fine to be there on the side"

→ Write `thoughts/CONCEPTS.md`: one consistent model (post, article, write-up = an article *about* something, pick, collection, ranking, ranking item) and how "about" links render both ways. Mock it: (a) the Browsers ranking with an overall write-up and a per-item write-up (an item marker that opens the article); (b) a pick with an article, two routes as options (the pick links to its article page / the pick *is* an article shown as a pick card); (c) project write-ups appear in the Thoughts feed as ordinary articles with an "about <project>" indicator and are findable there. Open, with a recommendation.

**T2.1** "the strung together should use the rolling yarn ball" → The "Strung together" strand (`strand()`) uses the same rolling yarn ball as the timelines.

**T2.2** "other collections and from projects dont need to show on collection pages" → Remove both sections from collection pages.

**T2.3** "i want to try showing the icon (next to the card kicker) without the circle around it like the first iteration had just to see if i like it more" → `?kicon=circle|bare` on post cards, Open.

## Mobile [chrome]

**MO1** "Easiest choice of my life for the mobile nav style: Top strip! trades 2 taps to navigate for a lot more screen space to show content we could also do the thing where when u scroll down the items dissapear and come back when u scroll up? i dont know what the actual design specs are for that i vaguely remember but its almost not needed we can try it" → `mnav=top` is the default; the other navs move to Earlier. Try the "quick return" pattern (the strip hides while scrolling down, comes back on scroll up / near the top): `?mhide=on|off`, Open.

**MO2** "the search bar looks weird on the thoughts page lets just be consistent looks the best on the projects page" → Thoughts' phone search matches Projects'.

**MO3** "the browse menu tags look scrunched with the number of items for each showing there also lets separate like tag name - number or something give more room as well" → Browse sheet: roomier tags, count clearly separated from the name (e.g. "rust · 4" with the number muted), bigger tap targets.

**MO4** "for selected idk if being in the search bar makes sense like it does on desktop u dont really get to see what u wanna type after a while" → On phones, selected filters don't sit inside the search field.

**MO5** "the X close in the search isnt centered like the carrot button but we dont need it if we move those filters out the search bar / need ideas for best place to have the filtered items so theyre easy to unfilter but right now im just thinking clicking the All/X button will be the easy way then u just filter again via browse could have the filtered show at the end of the list (which i think we already do)" → Move filters out of the field; the All/✕ circle clears everything. Mock 2–3 places for the active filters as `?mactive=`, Open (e.g. pressed chips at the start/end of the floating chip row; a count on the Browse button).

**MO6** "also feels wasteful that we are showing the filtered items at the top again we can have even more vertical space" → Don't repeat the active filters at the top of the page on phones.

**MO7** "all and x button need to have the same width when saying x vs all so layout shift doesnt happen" → Same size in both states (G3's circle).

**MO8** "idk if toasts (like added to queue) should be on top or on bottom and shift the other stuff up can try both" → `?toast=top|bottom` (bottom pushes the floating player/search up while shown), Open.

---

## Round 2 · correction + review flow (owner, 2026-11-14)

"i completely lied for mobile i did not mean top strip i meant sections pill all my notes were about that haha / lets still consider this i5 but and just make changes based on that? so sorry :')"

→ **MO1 corrected:** the phone nav is `mnav=spool`, the sections pill. It's the default, and `top` moves to Earlier with the other navs. Every Mobile note (MO1–MO8) was written while testing the pill, so re-check each one against it. Quick return ("when u scroll down the items dissapear and come back when u scroll up") applies to the floating bottom items: the pill and the closed search button / disc. An open player bar or search bar never hides. [mobile]

"do a quick accessibility contrast review as well"

→ Measure text and icon contrast on every page at both widths, including textured backgrounds and the new colours. Fix the clear failures in the kit tokens, then write `A11Y-CONTRAST-i5.md`. [contrast]

"also can we just make the review flow a little better some ideas i have / 1. way to quickly/easily leave note on each aspect im reviewing (as well as whole pages) / 2. keeping my changes from mock setup over reloads and page switches so at the end i can copy them back to u as my choices / 3. having dedicated round up section on index or wherever that also includes the open questions you or fable prose (could format cut vs keep differentlylike crossing out)"

→ [review tools]
- **R1:** notes on each ⚙ option, on the whole page, and on any element (pick it on the page).
- **R2:** the owner's ⚙ choices persist across reloads and page switches. Demo states ("Jump to") don't persist.
- **R3:** a round-up page linked prominently from the index. It lists:
  - every open option with the owner's current pick;
  - every open question from the agents and Fable, with suggested cuts shown crossed out and a way to keep them;
  - all the owner's notes;
  - one "Copy everything" button that produces Markdown the owner pastes back.

"for "a collections songs on its card" the real issue was theres no way to access NOTES for the songs without opening the expanded player not it was hard to see the songs the tabs give us seeing the songs with the card in an opened card i was thinking there should be mocks of ways to solve this potentially"

→ **M6 corrected:** the problem is reaching a song's *notes*. The tabs already show the songs. Mock 2–3 ways to read a song's notes from the card or the opened collection without the expanded player, as `?songnotes=` (Open). [song notes]

"also noticed this visual issue which not sure how it passed review" (screenshot: on "Tools I like", Ghostty's write-up pill pushes its card out of its column and under the chezmoi card)

→ Fixed in the kit: `.ypost { min-width: 0 }`, so a post card can shrink inside its grid cell and the pill's ellipsis takes over. It slipped through because every check ran at 1440 / 1024 / 390 only. New check: `_tools/overflow.mjs` covers 18 widths (1680 → 360) and finds content that spills out of a card, cards that overlap, and sideways scrolling.
