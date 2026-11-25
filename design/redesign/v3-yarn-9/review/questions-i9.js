/* Open questions for the iteration 9 round-up (review.html). i9 is Studio only: the site is decided (frozen in
   v3-yarn-8/). i8's answers: light only (no dark theme). The Studio agents append their questions here.
   kind: ask · cut · settle · try links are relative to v3-yarn-9/ */
window.YARN_ROUNDUP = {
  iteration: 9,
  questions: [
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
      try: [["studio/index.html?screen=list&section=music", "The Music list (as built)"], ["studio/index.html?screen=list&section=music&mcomplete=start", "Complete by its start"], ["kit/components.html?mcomplete=start#music", "The kit's order demo"]] },
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
