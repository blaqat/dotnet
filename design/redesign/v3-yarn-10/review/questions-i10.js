/* Open questions for the iteration 10 round-up (review.html). i10 = the site again (a design pass: hierarchy, colour
   meaning, type, grid; DESIGN-i10.md) + Studio. The i10 agents add their questions in the first block.
   i9's questions (Studio) weren't reviewed yet (the owner went back to the site first), so they're carried below.
   kind: ask · cut · settle · try links are relative to v3-yarn-10/ */
window.YARN_ROUNDUP = {
  iteration: 10,
  questions: [
    // ==== i10 (the site's design pass): agents add theirs here ====
    // (i10 r2 · cards: "pj-foot" and "cardart" are answered by the owner's round 2, "revert the general card design to
    // i9/i8": the stack left with the discs right, the art top-left. Both questions went.)
    // ---- system (L1, L2, L6) ----
    { id: "look", kind: "ask", area: "Site + Studio", from: "system agent",
      q: "What an accent colour means. Section (as built): each page is dyed in its section's yarn, like your old site's purple Music. The section hue means “you're here” (the nav tab's rope), and since round 2 “this is playing” is Music's purple on every page (the one filled ▶, its card's tint, the player), because purple is music. Everything at rest is black, white and grey. Ink: black thread does all the structure and red means one thing only, what's playing (a red ▶, a red rope round the playing card). In both, nothing at rest is a solid colour any more, so with your glasses off the only filled thing is what's playing. Compare them next to i8 in kit/looks.html.",
      options: [["section", "Section: the page's hue is here, purple is live"], ["ink", "Ink: black structure, red only for live"]], rec: "section",
      try: [["kit/looks.html?screen=mgrid&w=1000&cmp=all", "i8 · section · ink, Music grid at your width"], ["kit/looks.html?screen=mtl&w=1440&cmp=new", "Music timeline, section vs ink"], ["music/index.html?view=grid&q=shadow", "Section (as built)"], ["music/index.html?view=grid&q=shadow&look=ink", "Ink"]] },
    { id: "stitch", kind: "ask", area: "Site + Studio", from: "system agent",
      q: "The dashed stitches. As built, only surfaces keep them (the sheet, the cards, the year pill, the player); buttons, chips, the search field and the nav tabs are flat white with a thin line, so the stitches stop competing with the content. Or keep stitches on every control, like i8.",
      options: [["calm", "Surfaces only (as built)"], ["full", "Every control (i8)"]], rec: "calm",
      try: [["music/index.html?view=grid", "Calm (as built)"], ["music/index.html?view=grid&stitch=full", "Stitched everywhere"], ["projects/index.html?view=grid&stitch=full", "Projects, stitched everywhere"]] },
    { id: "font", kind: "ask", area: "Site + Studio", from: "system agent",
      q: "The font. Nunito + Nunito Sans (as built), or Allo (Inter's cousin with rounded ends) everywhere but the numbers. The spacing is tuned per role for Allo (its word spaces stay open, its x-height matches Nunito Sans), at roundness 50 or 100.",
      options: [["nunito", "Nunito (as built)"], ["allo", "Allo (roundness 50)"], ["allo-round", "Allo round (100)"]], rec: "nunito",
      try: [["kit/looks.html?screen=thoughts&w=1440&cmp=new&font=allo", "Allo on Thoughts, both looks"], ["music/index.html?view=grid&font=allo", "Music in Allo"], ["kit/components.html?font=allo#type", "The type roles in Allo"], ["thoughts/stitched.html?view=article&id=a1&font=allo-round", "An article in Allo round"]] },
    // ---- colour (round 2: S1–S3) ----
    { id: "taccent", kind: "ask", area: "Thoughts", from: "colour agent (round 2)",
      q: "You said Thoughts doesn't really need a section colour, but to keep black vs red to compare. Gold is gone from Thoughts' accents now: the nav tab's rope, the rail's “All” and type rows when they're on, the tag chips, link hovers, the reading bar on an article and a ranking's drop targets. Gold stays only in the cord frame, the nav's Thoughts dot and WIP; anything playing is Music's purple; bookmarks are red. As built (ink), Thoughts' accent is black: an “on” row is a soft grey with black text, the rope is black. Or red: an “on” row is a soft red with deep-red text, the rope is red, like Home. (In the Ink look Thoughts is black either way.)",
      options: [["ink", "Black (as built)"], ["red", "Red"]], rec: "ink",
      try: [["thoughts/stitched.html", "Black (as built)"], ["thoughts/stitched.html?taccent=red", "Red"], ["thoughts/stitched.html?type=article&taccent=red", "Red, with Articles on"], ["thoughts/stitched.html?view=article&id=a1", "An article (the reading bar)"], ["thoughts/tier.html?id=tl1", "A ranking"]] },
    // ---- music (M1) ----
    { id: "shuffle", kind: "ask", area: "Music", from: "music agent",
      q: "Play and Shuffle moved from beside Timeline / Grid to a line above the list that says what's shown (“3 releases · 6 tracks for “shadow””). They play exactly that: a collection shown for some of its songs plays only those, unless the collection itself matched. The same goes for ▶ on any card, a tab and “+”. As built, ▶ Play and ⤮ Shuffle are both on that line. Or keep only ▶ Play there and make Shuffle a mode in the player bar: a toggle beside ⏮ that stays on until you turn it off.",
      options: [["results", "Both on the results line (as built)"], ["player", "Shuffle is a mode in the player bar"]], rec: "results",
      try: [["music/index.html?view=grid&q=shadow", "On the results line (as built)"], ["music/index.html?view=grid&q=shadow&shuffle=player", "Shuffle in the player bar (press ▶ Play first)"], ["music/index.html?q=shadow", "On a phone: the same line, icon-only"]] },
    // ---- walkthrough ----
    { id: "ink-all", kind: "ask", area: "Site (Ink look)", from: "walkthrough",
      q: "Only if you pick Ink: with no filter on, the round “All” chip is a solid black circle, because it's an “on” toggle and Ink's on-fill is black. It ends up the second loudest thing near the top, after the nav. (In Section it's a soft tint, so it's quiet.) Keep it solid, or let “All” wear just a black outline when it's the resting default, and fill a chip only when you've turned a filter on yourself?",
      options: [["outline", "Outline when nothing is filtered"], ["solid", "Solid black (as built)"]], rec: "outline",
      try: [["music/index.html?view=grid&look=ink", "Ink, nothing filtered"], ["music/index.html?view=grid&look=ink&instrument=piano", "Ink, Piano on"], ["music/index.html?view=grid", "Section, for comparison"]] },

    // ==== carried from i9 (Studio; not reviewed yet) ====
    // ---- polish (S14) ----
    { id: "imgset", kind: "ask", area: "Site + Studio", from: "polish agent",
      q: "An images post with more than 4 pictures: two rows at most, 1 big + 3 small, and the last small one says “+5” and opens the viewer right there (the rest are one swipe away). Or keep the 1 big, then make the second row a carousel strip you swipe through (every picture on the card, no “+N”). 1–4 pictures look the same either way.",
      options: [["grid", "1 big + 3 small, the last says +N"], ["strip", "2nd row is a carousel strip"]], rec: "grid",
      try: [["studio/index.html?view=images-9", "+N (as built)"], ["studio/index.html?view=images-9&imgset=strip", "Carousel strip"], ["kit/components.html#image-sets", "The kit card, every count"]] },
    // ---- links (S2) ----
    { id: "exttrack", kind: "ask", area: "Site + Studio", from: "links agent",
      q: "A playlist track from SoundCloud, Spotify or YouTube (your yearly round-ups): pressing ▶ plays it right in its row with the service's own player (one at a time, the site's player pauses; ■ closes it). Or ▶ opens the song on that service in a new tab. Either way your own songs play in the site's player and “Play all” queues just yours; Bandcamp always opens its page (its player needs an id the real build reads when you save the link).",
      options: [["inline", "Plays in its row"], ["open", "Opens it on the service"]], rec: "inline",
      try: [["studio/index.html?view=roundup", "The 2025 round-up (press ▶ on Flickermood in the preview)"], ["studio/index.html?view=roundup&exttrack=open", "Opens on the service"], ["kit/components.html#posts", "The kit card + the real player"]] },
    // ---- music (S10) ----
    { id: "mcomplete", kind: "ask", area: "Site + Studio", from: "music agent",
      q: "The Music order, “Newest finished” (the default; WIP always on top): your pin's note said a Complete release “uses its start date”, but your old site's code sorted Complete by its end date, and Dropped uses its finish when it has one. As built, Complete goes by its finish too (so a long project finished this year sits near the top). Or should a Complete release go by the month it started? (“Newest started” is still there as its own order either way.)",
      options: [["end", "Its finish (the old site, as built)"], ["start", "Its start (the pin's note)"]], rec: "end",
      try: [["studio/index.html?screen=list&section=music", "The Music list (as built)"], ["studio/index.html?screen=list&section=music&mcomplete=start", "Complete by its start"], ["kit/components.html?mcomplete=start#music", "The kit's order demo"], ["music/index.html?view=grid&mcomplete=start", "The Music page (i10 uses this order too), Complete by its start"]] },
    // ---- blocks (S3) ----
    { id: "md-more", kind: "ask", area: "Site + Studio", from: "blocks agent",
      q: "Yarn blocks you can drop into an article or a write-up: a link (your link button, or a brand icon), images from Media, a song or a playlist of yours, a mention (the about pill), a note (a sticky note) and any Thoughts post as its card. Which one should come next?",
      options: [["project", "A project card (its cover + facts)"], ["video", "A video that plays in place (YouTube)"], ["toggle", "A fold (“show more”)"], ["none", "None, these six are enough"]], rec: "project",
      try: [["studio/index.html?screen=compose&type=article&id=a3&demo=slash", "The / menu"], ["studio/index.html?view=article", "An article with yarn blocks"], ["kit/components.html#md", "Every yarn block in the kit"]] },
    { id: "md-gallery", kind: "ask", area: "Site + Studio", from: "blocks agent",
      q: "An images block with 2 or more pictures inside an article: the media strip a project page uses (small thumbs in a row, as built), or the photo grid an images post uses (one big, then smaller ones)? One picture is always as wide as the text.",
      options: [["strip", "Media strip (as built)"], ["grid", "Photo grid"]], rec: "strip",
      try: [["studio/index.html?screen=compose&type=article&id=a3&demo=bkgallery", "Media strip"], ["studio/index.html?screen=compose&type=article&id=a3&demo=bkgallery&mdgallery=grid", "Photo grid"]] },
    { id: "md-mention", kind: "ask", area: "Site + Studio", from: "blocks agent",
      q: "A mention block is the about pill. Its small word says what it points at (“project · Sonata”, as built), where a write-up's pill says “about · Sonata”. Keep the kind, or use “about” everywhere?",
      options: [["kind", "The kind: project, ranking, pick… (as built)"], ["about", "“about”, like a write-up's pill"]], rec: "kind",
      try: [["studio/index.html?view=article", "The article (a mention under “How it works”)"]] },
  ],
};
