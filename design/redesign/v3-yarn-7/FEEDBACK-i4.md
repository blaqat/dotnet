# Iteration 4 · whole-site pass after the Thoughts deep dive

`v3-yarn-4/` is a copy of `v3-yarn-3/` (iteration 3 = the Thoughts deep dive; keep it frozen for comparison). Older iterations: `../v3-yarn/` (i1, "the old one"), `../v3-yarn-2/` (i2). The original live site's source is in the repo at `/Users/blaqat/dev/projects/my-litterbox/src/` (e.g. `src/pages/contact.astro`, `src/components/Music/*`, `src/components/Projects/*`).

The owner's words are verbatim (typos kept) under each heading; **→** lines are the build reading. Studio is out of scope: the owner hasn't reviewed it yet.

---

## Overall (site-wide)

1. "using the red fill for the toggleables" → `toggle=red` is decided (keep the other values as options for now).
2. "for the sticky year line on mobile, remove the sheet in the background of it let it float over items like it does on desktop" → no cotton band behind a stuck year pill on phones.
3. "think im leaning on jersy for the background, but its def between jersey and intarsia" → default `bg=jersey`; keep `intarsia` one click away in ⚙.
4. "the link openers can background fade into its website's color like github black, youtube red, beepbox purple, soundcloud orange, etc (ones we dont know use the default visit site or whatever text we give it buttons)" → link buttons fade to the brand colour on hover/focus (icon goes white); unknown sites stay the default "Visit site"/given-text button.
5. "ive noticed my memory spike a lot in testing this make sure this website is uber optimized (can be done after we finish iterating on design tho)" → **deferred** to a dedicated pass after design settles. Meanwhile, don't add heavy effects (big animated filters/blurs, per-frame layout, huge DOM, leaked listeners/observers/rAF loops/audio nodes).
6. "lightbox videos should have a full screen button"
7. "remove the contact tab" → from the nav (desktop and mobile). Contact lives on Home.
8. "the mute button also doesnt fit on the mobile bottom bar tbh nor at the top right on desktop need a better place to put it also if we need interaction before the first animation we can have. call out on first load before the items come in like "Press unmute for sound" after a couple seconds just assume muted" → find a better home for the sound toggle on desktop and mobile (offer 2–3 placements as ⚙ options); on Home's first load, show a small "Press unmute for sound" callout before the intro starts; after a couple of seconds with no answer, play the intro muted. (This also fixes "the first click skips the intro".)
9. "Show all should just be "All" similar to the first thoughts design"
10. "make sure we are using grids when placing the items on screen so everything feels aligned" → every page: shared left/right edges, columns that line up across views, consistent tops (see how i3 Thoughts aligns feed, article and collection on the same edges).

## Home

1. "RIT should be black like the other bolded text"
2. "the underlie should consistently be the style that is under software engineer" → every keyword uses the software-engineer wavy underline (colour/style consistent).
3. "the font for the fun text is kinda bad should be simpler tbh i really only want the fun text for composing since it shows notes and then the music sound plays which is cute, instead lets just do a ripple on the words ur highlighting over when u highlight" → hover captions only on "composing" (in a simpler face), keeping its notes + music sound; every other keyword gets a ripple through its letters on hover instead.
4. "also i think the pointer should be the click symbol when u highlight soemthing that takes u to a new page" → `cursor: pointer` on anything that navigates.
5. "the stack tags that show on the home screen should have the cotton background or whiter maybe"
6. "on mobile lets just show the stack icon not the word circular" → phones: Java/Python/Rust become circular icon-only tags (keep an accessible name).
7. "i prefer the old contact showing the username as well as the icon currently it just shows the icon" → contact links show icon + username (see `src/pages/contact.astro` and i1/i2 Home).
8. "i think the felt/paper items can be removed it was a neat idea but just feels excessive anytime i see it the shake and everything else can stay" → remove the paper-bit bursts (section buttons, keywords). Keep the icon shake. "composing" keeps its notes + sound (item 3).
9. "when opening projects/music/thoughts make sure the colored expansion lands where it would be pattern wise when opening the page so it doesnt feel like it shifts / also have the white come up from the bottom like a sheet instead of spawning from the middle" → the section colour's texture must be phase-aligned with the destination page's frame texture (no visible jump at hand-off); the white sheet rises from the bottom.

## Projects

1. Timeline: "use the dashed line for the year" → the i3 `.yyear--rule`.
2. Grid:
   1. "still figuring out if i like open in line vs need new page but what is def needed is love to the transitions it has the same issues thoughts use to have where spamming filters looks like the transition is completed instead of canceled before returning" → interruptible filter transitions like i3 Thoughts; offer open-inline vs open-on-a-page as a ⚙ option.
      - "theres also some jank with the scroll and overlap of the opened page and the side bars which shouldnt be a thing"
   2. "grid year line should be like the rest where its clear separators"
   3. "theres no real active "selected" state in grid its either open or not so no rope is needed unlike timeline"
3. "filter list is one line"
4. "the searched filter should show up differently in the items it shows up in similar to what it does in thoughts cards" → a stack/type/status that matches the active filter or search is marked inside each item, using the same in-card match style as Thoughts (see Thoughts 5: i2's plain chip background, not the light-red wash).
5. "for both grid and timeline the opened item should use the white texture not the background texture if we decide to do open in separate page then it would be fine for the background to be the normal background texture"
6. "layout wise we dont need to say "privde repo no public links" just dont have that section"
7. "on mobile i think it should just open up a separate page and do a vertical list separated by year keeping it simple there"

## Music

1. "dont like the dock right resize it makes things too small my thought is that seeing more information" → drop the dock/zoom-the-list behaviour.
2. "i think we can copy the layouts of projects from now on so fix up projects than replicate on music" → after Projects is done, Music adopts the same layouts (list/timeline + grid, open behaviour, mobile list-by-year + separate page), keeping the folder cards.
3. "the highlight over the tabs for collections hint text shows below the fiter bar" → the hover hint for folder tabs renders under the sticky filter bar; fix stacking.
4. "the buttons for opening in other links on the cards should be smaller than the play button the play button is the main one"
5. "there is no need for "Pause" text"
6. "there is no need to show the play movig bars twice on a collection just have it on the tab instead of next to the paly button we can tell its plying if its play vs pause"
7. "remove the music notes dropping similar to home page"
8. "i think u shoudl be able to add to the queue somehow"

### Music bar (the player, `kit/player.js`)

1. "the volume bar can always be shown (desktop)"
2. "no need to say "single" just have subtext when its needed kinda use this rule generally i dont need extra text when there doesnt need to be any" → general rule for every page: no filler labels.
3. "on mobile the condesned doesnt fully overlap the bottom par it gets cut off"
4. "on mobile can include the back button theres a lot of room really can include  things until they dont fit volume bar would turn into toggle mute button tho for mobile" → mobile bar adds previous (and more controls while they fit); volume becomes a mute toggle on phones.
5. "dragging down diagonally should close to full condesnse on mobile"
6. "notes should appear above the queue really should show with the song data then separator for controls etc" → panel order: art + song data + notes, separator, controls, then queue.
7. "when open the control buttons at the bottom are placed weirdly id think the pause button should be in the center but its off to the left a little also it overlaps with the outline border"
8. "fully expanded on desktop the design doesnt feel fully thought out just has all the right information i think the main issue  is the header text if overflowing goes above the start of the image when the image shouldnt move really the" (sentence cut off) → redesign the expanded desktop panel deliberately: the art never moves; long titles wrap/clamp below the art's top line; a clear grid.

## Thoughts

1. "can remove 16 posts, newest first at the top we have "16 posts · since Sep 2026" on the side its duplicate information"
2. "also can replace "Scratch notes posted to the void, longer write-ups, picks, rankings and playlists." with "welcome to my void""
3. "i think the images icon should be better its just some tan square. scratch can also be updated its using the old black styling should resemble the sticky note we use now"
4. "upper case item type can remove the * inbetween that and the next item like # images it looks weirdly organized" → drop the "·" separator after the caps type label (e.g. "IMAGES · 4 images").
5. "i prefer the v2 show of how tags show on the actual cards we switched it to this light red thing which doesnt always look good on all backgrounds compared to the previous more basic background thing (talking about the selected tags on the masonry items not the ones on the side the ones on the side are perfect)" → in-card matching tags go back to i2's `.ytag[aria-pressed="true"] { color: var(--y-fg); background: var(--y-chip); }` look; rail tags stay as they are.
6. "questions: curious how the design might be able to handle if for a tier list i wanted to use arbitrary names for tiers rather than just the default sabcd" → show it: rankings support custom tier names (any count, long labels, colours from a palette) on the card, the ranking page and in Studio's ranking editor (keep the Studio change small); one mock ranking uses custom tiers.
7. "remove the now playing and paused text in the playlist card we can visually see whats playing and if its playing or paused"

## Search bar FAB (mobile)

"my thought is this is the right direction for mobile it gives a lot more space to see content generally" → `msearch=fab` becomes the mobile default.

1. "its impelmented to take up more space than needed rn i think we can dedicate the section above the bottom bar on mobile to be the expanded section for whatever fab is clicked / meaning it switches out with music or search the unopened fab will move to the top and be smaller while the opened will take the expanded bottom bar space" → one slot above the bottom bar; whichever FAB (music disc or search) is open takes that slot; the other shrinks and moves up.
2. "the search bar should expand the same way the music does where its just the search bar no extra panel or text taking up that space currently it leaks off screen"
3. "as u search the filters can pop up floating above the search bar in a horizontal list like it normally does right now"
4. "maybe include a clear x button to remove all filters which would be equiviant to show all normally"
5. "the color and size of the fab shouldnt call too much attention to it should be white like the disk one potentially"

---

## Round 2 · mobile (owner, after testing i4)

"the mobile fab experience is pretty bad now revert to use what v3 used for the player (exceot with my new requirements) and then build the search experience off of that also currently the search icon is not centered at all / lots of visibility issues i saw testing where it was behind the navigation bar"

"also since we are focused on mobile im not sold on the brown bar lets make mocks of different options idk what i want"

→ Build reading:
- **Player on phones:** go back to iteration 3's mobile player (`../v3-yarn-3/kit/player.js`): disc → bar → panel, how it moves, and where it sits. Then re-apply the i4 Music-bar requirements on top: 2 (no filler labels), 3 (the condensed bar is fully visible and never cut off or tucked behind the nav), 4 (previous button; mute toggle instead of volume), 5 (diagonal drag down collapses), 6 (panel order: art + song data + notes, a separator, controls, queue), 7 (play/pause centred, nothing on the outline). Keep i4's desktop player (1: volume always shown; 8: the redesigned expanded panel).
- **Search on phones:** rebuild it on the same mechanics as the player. A search FAB like the disc expands into a search bar the way the disc expands into the player bar. Keep FAB items 1–5: one expanded spot above the nav for whichever FAB is open (the other moves up and gets smaller), just the field, filters floating above it in a row, a clear ✕, and a white, quiet FAB. The search icon is centred in its button.
- **Visibility:** nothing that should be on top may render behind the nav. That covers the player, search, chips, toasts, menus, tooltips, the Browse sheet, the sound callout and lightbox controls.
- **Bottom nav:** the brown corduroy bar is not settled. Make several genuinely different mobile nav options (not just materials) as a kit ⚙ option, plus a side-by-side comparison page.
