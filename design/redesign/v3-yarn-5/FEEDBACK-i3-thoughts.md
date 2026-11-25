# Iteration 3 · Thoughts (page-by-page deep dive #1)

Iteration 3 goes page by page. Thoughts is first because the owner says it's the best-looking and best-feeling page. Every page deep dive happens in this folder (`v3-yarn-3/`, copied from `v3-yarn-2/`). `../v3-yarn/` is **iteration 1** ("the old one"); `../v3-yarn-2/` is **iteration 2** ("the new one"), which stays frozen.

Side-by-side screenshots: `_feedback/i3-thoughts/` (`i1-*` = old, `i2-*` = new). The `-tog` shots have 3 types + 3 tags toggled on.

## Owner's words (verbatim, grouped)

**Overall:** "I think the way the previous thought page was laid out just outclasses the new one."

**Type list:** "The previous one had really good icons in the type list"

**Year marks:** "it had a line separating each year mark not just the floating tag"

**Selected state:** "the black ink fill worked a lot more than the red ribbon, but when i try the ink vs ribbon it looks better with ribbon in some places and better filled maybe we can do something different like filled red for toggleables / I think the issue is most easily seen when u have a bunch of stuff toggled they call too much attention to themselves compared to the blank [black] fill on the old one"

**Sticky note:** "In the new one i like the sticky note its a little too different from the rest in terms of rendering tho we can make it a tiny bit flatter while keeping its character and depth also maybe making the tape more visible on top of the background (slightly not much)"

**Tags:** "I also like the new tags (inside the items on the page i mean) well i also like the tags in the tags list showing whats showing even tho its not selected thats a nice touch i missed"

**Layout:** "Old layout was better split from left side and right side while new one has top, left, top for search then content tho im not sure which i prefer though probably the older one it just feels easier to read"

**Colors:** "Curious if we could make it so i could control the color of the sticky note and pick tag color (thats currently tan on the side) that would make me enjoy this even more."

**Pick card:** "Between the old and new pick the new one is probably better, but the tan needs to be a tad darker since we dont have the outline anymore it blends too much with the background imo"

**Text styling:** "I do think the older one's text styling made things easier to read but im not sure new one has circles around each icon which is fine but the all caps + light sub text really helped differentiating immediately from the main text articles are a good example"

**Motion:** "UX wise, i think the animations feel slow/laggy all across the board for opening things im not sure if its an optimization issue or an animation speed/easing issue. Also noticed if i click a filter really fast it looks like its snapping to the finished position instead of just returning to where it needs to go mid animation it should cancel and move from where it is / I think the best animation speed ive seen is switching from mine to everyone in tier lists"

**Naming:** "also we can call tierlist "rankings""

**Collections:** "For collections the old one was definitely better just using the same cards instead of making new ones also grid is actually a grid in the previous one… we can remove the like letters not sure why they are there / i do like the simplified collection title and subtext compared to the old.. i think we just keep it as a masonry or grid so its reactive and basic dont need anything special for this.. maybe bring back the like horizontal timeline feed thingy was a neat idea being able to see when u found tools also maybe try to have the distance between each item be weighted by the actual date difference instead of equidistance"

**Articles:** "the old one's ← oldest · newer → looks a lot better than our floating footer tbh the floating footer doesnt really look good anywhere / i will say on the new one it feels like things are placed randomly make sure we are using grid lines and being consistent like the on this page aligns with nothing by default the copy link button is just chilling randomly on the screen"

**Process:** "keep making options for the things im leaving open hoping ill be able to settle on stuff in this iteration"

## What that means (the build list)

Old = `../v3-yarn/thoughts/stitched.*` (read its code for icons, year rules, kicker type, pager, collection cards/timeline). New = this folder's `thoughts/` + `kit/`.

1. **Layout: split (old) is the default.** Left column = Thoughts title + one-line intro + count, then search, TYPE, TAGS, COLLECTIONS. Right column = status line + feed, with its first row on the same top line as the title. `?layout=stacked` keeps the i2 arrangement. Pick where search sits in split (rail vs top of the content column), offer the other as an option, and say which you picked and why.
2. **Type list icons from i1** (the coloured little marks: black square = Scratch, red-ribbon page = Articles, red dot tag = Picks, striped = Rankings, record = Playlists, photo swatch = Images, four-colour quarters = Everything). Keep i2's live counts and dimming of empty types. `?typeicons=line` keeps i2's line icons.
3. **Toggleables get a fill; single choices keep the rope.** New kit param `?toggle=red|ink|tint|rope` for multi-select toggles (type rows, tag chips, search-bar filter tokens, the same kit chips on Projects/Music). Default `red` (the owner's suggestion); `ink` = i1's black fill; `tint` = a quieter red wash so you can compare; `rope` = i2. Single-choice controls (nav current page, Mine/Everyone, view segments) keep the rope (`?sel=` still governs them). Bar: with 3 types + 3 tags on, the rail must read calm, not shouty. Check that exact URL.
4. **Year/month marks get a rule.** The pill plus a dashed line running across the column, like i1. Make it a kit modifier (e.g. `.yyear--rule`) so other pages can adopt it later; use it on the Thoughts feed. `?yearline=pill` = i2.
5. **Card type styling: i1's ALL-CAPS mono kicker + light mono subtext** ("SCRATCH · Nov 7 · 11:41 pm", "ARTICLE · 7 min read") so meta separates from the main text at a glance. Keep i2's circled icon if it still reads well with caps (owner: "fine"). This lives in the kit post renderer (`kit/posts.js`), so Studio previews match. `?kicker=plain` = i2.
6. **Keep from i2:** the in-card tags; the tag list showing which tags are present in the current results even when not selected; the sticky note; live type counts.
7. **Sticky note:** a touch flatter (less curl/shadow difference from the other cards) while keeping its character and depth; tape slightly more visible against the sheet background (slightly!).
8. **Owner-controlled colours.** Each scratch post can set its sticky-note colour and each pick can set its tag (side stub) colour from a small curated palette that fits black/red/white yarn (e.g. canary, pink, mint, sky, orange, lilac for notes; tan (darker), red, ink, blue, green, gold for the pick stub). Store it in the post data (`color`), render from data, give a few mock posts non-default colours so variety shows, and add a swatch picker to the matching Studio post editors (`studio/`, keep it small; Studio gets its own deep dive later). Mock-panel option to preview "from data / all default".
9. **Pick card:** keep i2's card, but darken the tan stub so it separates from the sheet now that the dashed outline is gone.
10. **Motion: interruptible and faster-feeling everywhere.**
    - Bug: `kit/yarn.js` `flip()` stops springs and clears `transform` *before* measuring, so a mid-flight card jumps to its settled spot. Measure the on-screen (transformed) rect first, then retarget from there, so a fast second click continues from where things are. Same for entering/leaving items that get toggled again mid-animation (no ghost pile-up, no pop).
    - "Opening things" feels slow/laggy across the board (lightbox, article/collection open, section transition, project open, player panel, Browse sheet…). Find out whether it's jank or timing: measure frame times (Playwright + `requestAnimationFrame` deltas or a performance trace) on the big ones; cut expensive paint (big blurs, drop-shadow filters, animated masks over large areas, layout-thrashing reads); then tune durations/springs. The reference feel is the Mine ⇄ Everyone switch on the ranking card (`Y.flip` on the mini board). Kit-level, so every page benefits. `?motion=i2` keeps the old timings for comparison.
11. **Rename "Tier list" → "Rankings"** in every user-facing string (type list, badges, ranking page, Studio, Home, gallery, sounds labels). Internal keys/filenames can stay; if you rename a page file, leave a redirect.
12. **Collections:** use the same feed cards (the pick card with stub + string), in a real grid or masonry that reflows with width; no letter monograms. Keep i2's simplified title + subtext line. Bring back i1's horizontal "strung together" timeline above the cards, spaced by **actual date difference** (with a minimum gap and label collision handling so close dates stay readable; clicking a point scrolls to/highlights that card). Basic and reactive; nothing special. `?cview=grid|masonry`.
13. **Articles:** replace the floating footer with i1's in-flow pager at the end ("← Older / title / date" · "Newer → / title", with "Oldest/Newest article → Back to all thoughts" at the ends). The owner says the floating footer "doesn't look good anywhere": make in-flow the kit default for every detail page (Projects item, Music item too), keeping `?dfoot=float` as an option, and make sure links that lived only in a floating bar are still reachable near the top on those pages.
14. **Articles: grid lines.** i1's three columns (left meta rail: back link, POSTED, READING TIME, TAGS; centre reading column with the caps kicker over the title; right "On this page"), and everything starts on one shared top line. Copy-link goes somewhere intentional (with the meta or the kicker row), not floating. Same skeleton for project write-ups (`?view=article&project=…`).
15. **Mobile:** not commented on. Keep it working and consistent with the above (split collapses to the i2 mobile list; pager in flow).

## Options

Every open choice above is a ⚙ option with its own URL. Defaults: `layout=split`, `typeicons` = i1, `toggle=red`, `yearline=rule`, `kicker=caps`, `dfoot=inline`, note/stub colours from data. List each option and its URL in your report so the owner can compare.
