/* Open questions for the iteration 7 round-up (review.html), written by the orchestrator from the agents' reports.
   kind: ask · cut · settle (see v3-yarn-5/review/questions-i5.js) · try links are relative to v3-yarn-7/ */
window.YARN_ROUNDUP = {
  iteration: 7,
  questions: [
    // ---- projects ----
    { id: "statusdate", kind: "ask", area: "Site", from: "projects agent",
      q: "Status and date: two facts (“Complete · Aug – Dec 2024”), or joined (“Completed Dec 2024”, “WIP since Sep 2025”)? One choice for Projects, Music and the player.",
      options: [["joined", "Joined"], ["apart", "Two facts (today)"]], rec: "joined",
      try: [["projects/index.html?statusdate=joined", "Joined"], ["music/index.html?statusdate=joined&item=revealed", "Joined on Music"], ["projects/index.html", "Apart"]] },
    { id: "cardfacts", kind: "ask", area: "Projects", from: "projects agent",
      q: "Card facts as words, or icons only (named on hover, like Music's small cards)? Touch can't hover to learn an icon.",
      options: [["words", "Words"], ["icons", "Icons only"]], rec: "words",
      try: [["projects/index.html?cardfacts=icons", "Icons only"]] },
    { id: "phone-type-word", kind: "ask", area: "Projects", from: "projects agent",
      q: "On phones the type keeps its word, so at 360px most rows put the date on a second line. Keep that, or show the type as a circle only on phones?",
      options: [["word", "Keep the word"], ["circle", "Circle only on phones"]], rec: "word",
      try: [["projects/index.html", "Projects (on a phone)"]] },

    // ---- music ----
    { id: "no-audio", kind: "ask", area: "Music", from: "music agent",
      q: "A song with no audio here: show “no audio” where + and the length go, or leave those cells empty?",
      options: [["label", "“no audio”"], ["empty", "Empty cells"]], rec: "label",
      try: [["music/item.html", "A release with a silent song"]] },
    { id: "wip-colour", kind: "ask", area: "Site", from: "music agent",
      q: "Ongoing is now “WIP” with a hammer, in gold, everywhere: card discs, filters, the opened item's facts, Studio and the player. Gold, or ink black?",
      options: [["gold", "Gold"], ["ink", "Ink"]], rec: "gold",
      try: [["music/index.html?demo=revealed_libterrene&player=panel", "An ongoing song in the player"], ["projects/index.html?p=blaqat-net-this-site", "An ongoing project"]] },
    { id: "wip-cards", kind: "ask", area: "Site", from: "orchestrator",
      q: "With status + date apart (today's default), WIP on cards and rows is the gold hammer disc alone (your i5 call: ongoing icon-only), named “WIP” on hover. Joined says it in words (“WIP since Sep 2025”). If you keep apart, should cards add the word (“WIP  Sep 2025 – now”)?",
      options: [["disc", "Disc alone"], ["word", "Disc + “WIP”"]], rec: "disc",
      try: [["projects/index.html", "Projects timeline"], ["music/index.html?view=grid", "Music grid"]] },

    // ---- thoughts ----
    { id: "coll-count", kind: "ask", area: "Thoughts", from: "thoughts agent",
      q: "The link to a collection now reads “Tools I like →” (the “5” count dropped, read literally from “just the text and the arrow”). Keep it that way, or bring the count back?",
      options: [["text", "Text and arrow"], ["count", "Keep the count"]], rec: "text",
      try: [["thoughts/stitched.html", "A pick card"]] },
    { id: "coll-page-stubs", kind: "ask", area: "Thoughts", from: "thoughts agent",
      q: "A collection's own page shows the stubs by “Collection” (it isn't a link there). Keep them, or remove them like the links?",
      options: [["keep", "Keep"], ["remove", "Remove"]], rec: "keep",
      try: [["thoughts/stitched.html?view=collection&c=tools", "Tools I like"]] },
    { id: "rail-900", kind: "ask", area: "Thoughts", from: "thoughts agent",
      q: "The rail fits as many tags as its height allows (all 16 at 1080px tall); on a 900px-tall screen it's already full and shows 8. Leave it, or tighten the rail there to fit more?",
      options: [["leave", "Leave it"], ["tighten", "Tighten"]], rec: "leave",
      try: [["thoughts/stitched.html", "Thoughts"]] },

    // ---- site ----
    { id: "off-tag-line", kind: "ask", area: "Site", from: "site agent",
      q: "The white dashed line is gone from the red (on) sound tag. Should the off tag lose its dark dashed line too, so both states match?",
      options: [["keep", "Keep the dark line"], ["remove", "Remove it"]], rec: "keep",
      try: [["home/index.html?skip", "Home (top centre)"]] },

    // ---- walkthrough (WALKTHROUGH-i7-results.md) ----
    { id: "grid-lone-years", kind: "ask", area: "Music", from: "walkthrough",
      q: "Unfiltered, the Music grid leaves a single card alone on a mostly empty row for one-release years (2025, 2023). Leave it, merge small years into one row like the filtered view does (“2020 – 2023”), or drop year rows in the grid?",
      options: [["merge", "Merge small years"], ["leave", "Leave it"], ["drop", "No year rows in the grid"]], rec: "merge",
      try: [["music/index.html?view=grid", "Music grid"]] },
    { id: "panel-outside", kind: "ask", area: "Review tools", from: "walkthrough",
      q: "Esc closes the ⚙ panel; clicking outside it doesn't (so a half-written note isn't lost to a stray click). Keep that, or close on an outside click too?",
      options: [["keep", "Esc only"], ["outside", "Outside click too"]], rec: "keep",
      try: [["projects/index.html", "Any page"]] },
    { id: "queue-remove", kind: "ask", area: "Player", from: "walkthrough",
      q: "Queue rows now have a ✕ to remove a song (with Undo). With a mouse it shows on hover / focus; on touch it's always there. Keep that, or always show it on desktop too?",
      options: [["hover", "On hover / focus"], ["always", "Always"]], rec: "hover",
      try: [["music/index.html?player=panel&demo=1", "Player panel"]] },

    // ---- consolidation (kit/REUSE-i7.md) ----
    { id: "tagpop-browse", kind: "ask", area: "Thoughts", from: "consolidation",
      q: "Thoughts' “All tags” browser does what Browse does on every other page. Fold it into Browse, or keep it for now?",
      options: [["keep", "Keep it for now"], ["fold", "Fold into Browse"]], rec: "keep",
      try: [["thoughts/stitched.html", "Thoughts (“n more” in the rail)"]] },
    { id: "empty-wording", kind: "ask", area: "Site", from: "consolidation",
      q: "Every empty state is now one kit part: a short line plus “Clear filters” (Thoughts said “Show everything”; Studio's had big icons, now gone). OK?",
      options: [["ok", "Yes, one style everywhere"], ["vary", "Let pages vary"]], rec: "ok",
      try: [["projects/index.html?type=School&status=paused", "An empty Projects filter"], ["thoughts/stitched.html?q=zzzz", "An empty Thoughts search"]] },

    // ---- studio ----
    { id: "studio-live-toast", kind: "ask", area: "Studio", from: "studio agent",
      q: "After publishing, the “Live now” toast has one button: View (Copy link is gone; the kit toast has one action). Keep View only, add Copy as a second button, or put a copy-link icon in the editor's top bar?",
      options: [["view", "View only"], ["two", "View + Copy"], ["topbar", "Copy in the top bar"]], rec: "view",
      try: [["studio/index.html?view=project", "Project editor (publish)"]] },
    { id: "studio-plus", kind: "ask", area: "Studio", from: "studio agent",
      q: "Studio's new-item “+” on phones: red (the main action) or plain white like the search button?",
      options: [["red", "Red"], ["white", "White"]], rec: "red",
      try: [["studio/index.html", "Studio (on a phone)"]] },
    { id: "studio-label", kind: "ask", area: "Studio", from: "studio agent",
      q: "At 960–1099px wide the STUDIO label hides so the sound tag fits in Studio's nav. Keep that, or drop the Home tab instead?",
      options: [["keep", "Hide the label"], ["home", "Drop the Home tab"]], rec: "keep",
      try: [["studio/index.html", "Studio (window ~1000 wide)"]] },
  ],
};
