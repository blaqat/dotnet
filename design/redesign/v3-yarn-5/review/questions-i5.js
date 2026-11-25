/* Open questions for the iteration 5 round-up (review.html).
   Written by the orchestrator from the agents' reports and REVIEW-fable-i5.md. The ⚙ options themselves (every
   `open: true` group) are listed separately from review/options-i5.js, which is generated from the pages.

   kind
     ask     pick one of `options` (or leave a note)
     cut     a suggested cut: shown crossed out until the owner keeps it
     settle  a suggestion to stop comparing and just decide an open ⚙ option on `value`
   rec      the recommended answer (an option value), or null
   try      [href, label] links (relative to the v3-yarn-5 folder) to look at before answering
*/
window.YARN_ROUNDUP = {
  iteration: 5,
  questions: [
    // ---- the big ones (Fable review) ----
    { id: "thoughts-all", kind: "ask", area: "Thoughts", from: "Fable review",
      q: "Thoughts' desktop side list keeps “All” as a row, like the type rows under it. Make it a circle like the other pages?",
      options: [["circle", "Make it a circle"], ["row", "Keep the row"]], rec: null,
      try: [["thoughts/stitched.html", "Thoughts"], ["projects/index.html", "Projects (circle)"]] },
    { id: "meta-grammar", kind: "ask", area: "Projects + Music", from: "Fable review",
      q: "Cards still show status as a pill and the date in mono; the opened item beside them uses the new fact style. Should cards match the opened item?",
      options: [["match", "Cards match the opened item"], ["keep", "Keep cards as they are"]], rec: "match",
      try: [["projects/index.html?p=sonata", "Projects, item open"], ["music/index.html", "Music"]] },
    { id: "article-pager", kind: "ask", area: "Thoughts", from: "Fable review",
      q: "Articles still end with an Older / Newer pager. Move previous / next to the top bar like project and release pages?",
      options: [["top", "Top bar, like items"], ["bottom", "Keep it at the bottom"]], rec: null,
      try: [["thoughts/stitched.html?view=article&id=a1", "An article"], ["projects/item.html?p=sonata", "A project page"]] },
    { id: "music-ongoing", kind: "ask", area: "Music", from: "orchestrator",
      q: "On Music the ongoing ribbon landed on the play and queue buttons, so ongoing releases still show a badge. Keep the badge, or rearrange the card to make room for a ribbon?",
      options: [["badge", "Keep the badge on Music"], ["room", "Rearrange the card for a ribbon"]], rec: null,
      try: [["music/index.html", "Music (Revealed is ongoing)"], ["projects/index.html", "Projects' ribbon"]] },
    { id: "tabs-phone", kind: "ask", area: "Music", from: "Fable review",
      q: "Collection tabs on phones: should tapping a tab play that song, or open the collection?",
      options: [["play", "Play the song"], ["open", "Open the collection"]], rec: null,
      try: [["music/index.html", "Music (open on a phone)"]] },

    // ---- layout (Fable layout agent) ----
    { id: "open-ongoing-tab", kind: "ask", area: "Opened item", from: "layout agent",
      q: "In the opened item, ongoing is a small icon-only tab in the right margin (the fact line still says “Ongoing”). Keep that, or a labelled ribbon instead of the fact?",
      options: [["tab", "Icon-only tab"], ["ribbon", "Labelled ribbon, drop the fact"]], rec: "tab",
      try: [["projects/index.html?p=blaqat-net-this-site", "An ongoing project, open"]] },

    // ---- projects ----
    { id: "personal-blue", kind: "ask", area: "Projects", from: "projects agent",
      q: "Personal is sky blue, lighter and more cyan than the blue page frame. Is it different enough?",
      options: [["ok", "Yes, keep it"], ["other", "Try another colour"]], rec: null,
      try: [["projects/index.html", "Projects"], ["projects/index.html?type=personal", "Personal only"]] },

    // ---- music + player ----
    { id: "card-plus", kind: "ask", area: "Music", from: "music agent",
      q: "Keep the “+” (add to queue) on collection cards? Only the tab tip was the precision problem.",
      options: [["keep", "Keep it"], ["remove", "Remove it; add from the opened collection"]], rec: "keep",
      try: [["music/index.html", "Music"]] },
    { id: "queue-from", kind: "ask", area: "Player", from: "music agent",
      q: "Queue rows still say “Collection · 2/4” because order matters there. Say “from …” there too?",
      options: [["position", "Keep the position"], ["from", "Say “from …”"]], rec: "position",
      try: [["music/index.html?player=panel&demo=1", "Player panel"]] },
    { id: "single-rule", kind: "ask", area: "Music", from: "music agent",
      q: "A collection becomes a single “Collection — Song” card when one tab is left, even if another matching song has no audio. Is that right?",
      options: [["tabs", "Yes, count tabs"], ["songs", "No, count every matching song"]], rec: "tabs",
      try: [["music/index.html?q=stalking", "One tab left"]] },
    // song notes agent, round 2 (M6 corrected). r1's ?songlist= is gone (the tabs already list the songs), so its cut went with it
    { id: "face-playing", kind: "ask", area: "Music", from: "song notes agent",
      q: "With songnotes=face, a collection's grid card shows the playing song's notes while it plays. That is how a tablet gets them: a tap plays. Or keep the collection's own notes there until you hover a tab?",
      options: [["playing", "Show the playing song's notes"], ["collection", "Keep the collection's notes"]], rec: "playing",
      try: [["music/index.html?view=grid&demo=abc_glooming", "Grid, a song playing"], ["music/index.html?view=grid", "Grid (hover a tab)"]] },

    // ---- thoughts ----
    { id: "writeup-title", kind: "ask", area: "Thoughts", from: "thoughts agent",
      q: "Should a project page show the write-up's title instead of just “Read the write-up”?",
      options: [["title", "Show the title"], ["generic", "Keep “Read the write-up”"]], rec: null,
      try: [["projects/item.html?p=bank-simulation", "Bank Simulation"]] },
    { id: "minirank-marks", kind: "ask", area: "Thoughts", from: "thoughts agent",
      q: "Should the small ranking preview on its feed card also mark which items have a write-up?",
      options: [["mark", "Mark them"], ["no", "Leave the preview clean"]], rec: null,
      try: [["thoughts/stitched.html?type=tierlist", "Ranking cards"]] },

    // ---- stack icons (home agent) ----
    { id: "mono-rest", kind: "ask", area: "Stack icons", from: "home agent",
      q: "With one-colour logos (stkicon=mono), should unselected tags keep each brand's colour or all be plain ink?",
      options: [["brand", "Brand colour"], ["ink", "Plain ink"]], rec: "brand",
      try: [["projects/index.html?stkicon=mono", "Mono logos"], ["research/stack-icons.html", "Side by side"]] },
    { id: "mono-new-logos", kind: "ask", area: "Stack icons", from: "home agent",
      q: "Five stacks show a generic icon today (Semantic UI, Spark, TOML, Zola, STM32). Give them the new logos in colour mode too?",
      options: [["yes", "Yes"], ["no", "Only in mono"]], rec: "yes",
      try: [["research/stack-icons.html", "Side by side"]] },
    { id: "mono-line", kind: "ask", area: "Stack icons", from: "home agent",
      q: "Filled logos, or outline “line” icons? The outline set only covers 18 of the 29 stacks, so a third would stay filled.",
      options: [["solid", "Filled"], ["line", "Outline where possible"]], rec: "solid",
      try: [["research/STACK-ICONS.md", "Research notes"]] },

    // ---- sound ----
    { id: "saved-sound", kind: "ask", area: "Site", from: "chrome agent",
      q: "If you turned sound on last visit, it shows muted until your first tap or key, then turns on by itself. OK, or always start muted?",
      options: [["resume", "Resume after the first tap"], ["muted", "Always start muted"]], rec: "resume",
      try: [["home/index.html?skip", "Home"]] },

    // ---- suggested cuts (Fable review): crossed out unless kept ----
    { id: "cut-dlayout-i4", kind: "cut", area: "Opened item", from: "Fable review", param: "dlayout", value: "i4",
      q: "The i4 layout in “Opened item: layout”. It's a comparison, not a candidate.", try: [["projects/index.html?p=sonata&dlayout=i4", "See it"]] },
    { id: "cut-mactive-top", kind: "cut", area: "Phones", from: "Fable review", param: "mactive", value: "top",
      q: "“Strip on top (i4)” for phone filters: the strip you asked to remove.", try: [["projects/index.html?fab=open&stack=Rust&mactive=top", "See it"]] },
    { id: "cut-mactive-count", kind: "cut", area: "Phones", from: "Fable review", param: "mactive", value: "count",
      q: "“Counts only” for phone filters: it hides which filters are on.", try: [["projects/index.html?fab=open&stack=Rust&mactive=count", "See it"]] },
    { id: "cut-ptypelabel-icon", kind: "cut", area: "Projects", from: "Fable review", param: "ptypelabel", value: "icon",
      q: "Icon-only type labels on items: the yellow Work dot alone is too faint on a white card.", try: [["projects/index.html?view=grid&ptypelabel=icon", "See it"]] },
    { id: "settle-browseicon", kind: "settle", area: "Site", from: "Fable review", param: "browseicon", value: "shake",
      q: "Browse icon: small enough to just decide on “shakes on hover”.", try: [["projects/index.html?browseicon=caret", "The caret instead"]] },
    { id: "settle-uisnd", kind: "settle", area: "Site", from: "Fable review", param: "uisnd", value: "quiet",
      q: "UI sounds while music plays: small enough to just decide on “silent”.", try: [["music/index.html?demo=1&uisnd=always", "Keep playing instead"]] },
    { id: "studio-open", kind: "ask", area: "Studio", from: "Fable review",
      q: "Studio's design options are still open because you haven't reviewed it. Review Studio next, or fold its options away for now?",
      options: [["review", "Review Studio next"], ["fold", "Fold them away"]], rec: null,
      try: [["studio/index.html", "Studio"]] },

    // ---- phones: the sections pill + quick return (mobile agent, round 2) ----
    { id: "qr-short-pages", kind: "ask", area: "Phones", from: "mobile agent",
      q: "On short pages (Projects on a phone scrolls about 660px), the bottom items hide and then come straight back as you reach the end. Keep them in place on pages shorter than about two screens?",
      options: [["stay", "Stay put on short pages"], ["hide", "Hide everywhere"]], rec: "stay",
      try: [["projects/index.html", "Projects (open on a phone)"], ["thoughts/stitched.html", "Thoughts (a long page)"]] },
    { id: "qr-distance", kind: "ask", area: "Phones", from: "mobile agent",
      q: "The bottom items hide after a 14px scroll down and come back after 6px up. Does that feel right?",
      options: [["ok", "Feels right"], ["later", "Hide later"], ["sooner", "Hide sooner"]], rec: "ok",
      try: [["thoughts/stitched.html", "Thoughts (open on a phone)"]] },
    { id: "studio-new-hides", kind: "ask", area: "Phones", from: "mobile agent",
      q: "Studio's “+ New” button stays put while the pill slides away on scroll. Should it hide with the pill?",
      options: [["hide", "Hide with the pill"], ["stay", "Stay put"]], rec: null,
      try: [["studio/index.html", "Studio (open on a phone)"]] },

    // ---- contrast (A11Y-CONTRAST-i5.md, round 2) ----
    { id: "contrast-red-btn", kind: "ask", area: "Site", from: "contrast review",
      q: "Red buttons (Visit site, Play all, Add your ranking, New…) pass contrast on plain red but dip just under on the twill's light threads (4.27 where 4.5 is the bar). Make every red button one shade deeper to pass everywhere?",
      options: [["deeper", "One shade deeper"], ["keep", "Keep today's red"]], rec: "deeper",
      try: [["projects/item.html?p=sonata", "Visit site"], ["thoughts/tier.html?id=tl1", "Add your ranking"]] },
    { id: "contrast-tier-a", kind: "ask", area: "Thoughts", from: "contrast review",
      q: "The ranking's orange “A” tier key is just under the bar on its darkest felt flecks (4.27 where 4.5 is the bar; 4.77 on average). Darken that orange a touch?",
      options: [["darken", "Darken it a touch"], ["keep", "Keep it"]], rec: "darken",
      try: [["thoughts/tier.html?id=tl1", "Browsers ranking"]] },
  ],
};
