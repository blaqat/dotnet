/* Open questions for the iteration 6 round-up (review.html), written by the orchestrator from the five agents' reports
   and REVIEW-fable-i6.md. The ⚙ options themselves (every `open: true` group) come from review/options-i6.js.
   kind: ask (pick one) · cut (a suggested cut, crossed out unless kept) · settle (just decide an open option on `value`)
   rec: the recommended option value, or null · try: [href, label] links relative to v3-yarn-6/ */
window.YARN_ROUNDUP = {
  iteration: 6,
  questions: [
    // ---- the opened item ----
    { id: "dlayout-pick", kind: "ask", area: "Opened item", from: "layout agent + Fable",
      q: "Which opened-item layout? Label first (links bottom right), the new left rail like articles, the right rail, or stacked.",
      options: [["label", "Label first"], ["side", "Left rail"], ["rail", "Right rail"], ["stack", "Stacked"]], rec: "label",
      try: [["projects/index.html?p=sonata", "Label first"], ["projects/item.html?p=sonata&dlayout=side", "Left rail"], ["projects/item.html?p=sonata&dlayout=rail", "Right rail"], ["music/index.html?item=alphabet-city-collection&dlayout=side", "Left rail on Music"]] },
    { id: "rails-narrow", kind: "ask", area: "Opened item", from: "layout agent",
      q: "On narrow screens the rails fall back to the stacked layout. Fall back to label first instead?",
      options: [["label", "Label first"], ["stack", "Stacked"]], rec: "label",
      try: [["projects/item.html?p=sonata&dlayout=side", "Left rail (make the window narrow)"]] },
    { id: "cut-dlayout-stack", kind: "cut", area: "Opened item", from: "Fable review", param: "dlayout", value: "stack",
      q: "Stacked layout: you narrowed it to label first vs a rail.", try: [["projects/index.html?p=sonata&dlayout=stack", "See it"]] },
    { id: "cut-stackchip-chip", kind: "cut", area: "Opened item", from: "Fable review", param: "stackchip", value: "chip",
      q: "Felt stack chips in the opened item: you said they shouldn't feel like buttons.", try: [["projects/index.html?p=sonata&stackchip=chip", "See it"]] },

    // ---- cards ----
    { id: "small-card-facts", kind: "ask", area: "Projects + Music", from: "music agent + Fable",
      q: "On small cards (phones, Music's 4-column grid, the narrow timeline) facts shrink to icons. Which keep their word? Touch can't hover to learn an icon.",
      options: [["instword", "Instrument / type word, status as an icon"], ["discs", "Both as icons (named on hover)"], ["words", "Both as words (the date wraps)"]], rec: "instword",
      try: [["music/index.html?view=grid", "Music grid (1320px+ window)"], ["music/index.html", "Music (open on a phone)"]] },
    { id: "timeline-words", kind: "ask", area: "Projects", from: "review fixes",
      q: "When a timeline row's facts would wrap, the whole timeline drops the status words, then the type words (Projects at 1100–1280, Music at 960). OK, or should Projects keep its words and let a row wrap?",
      options: [["drop", "Drop words, keep one line"], ["wrap", "Keep words, let a row wrap"]], rec: "drop",
      try: [["projects/index.html", "Projects (make the window ~1100 wide)"]] },
    { id: "status-icon-only", kind: "ask", area: "Projects + Music", from: "projects agent",
      q: "On cards, only Ongoing is an icon-only red disc (it sits right before “– now”). Make every status icon-only?",
      options: [["ongoing", "Only Ongoing"], ["all", "Every status"]], rec: "ongoing",
      try: [["projects/index.html", "Projects"]] },
    { id: "logos-off-white", kind: "ask", area: "Stack icons", from: "Fable review",
      q: "Stack logos on the item page sit on the cream sheet and stay in colour. Colour on the sheet too (one-colour only on red and dark), or one-colour everywhere except white cards?",
      options: [["sheet-colour", "Colour on the sheet too"], ["white-only", "Colour only on white cards"]], rec: "sheet-colour",
      try: [["projects/item.html?p=sonata", "Project page"], ["projects/index.html?view=grid", "Grid cards"]] },

    // ---- site ----
    { id: "sound-hover-off", kind: "ask", area: "Site", from: "mobile agent",
      q: "While sound is on, hovering the tag previews off (white + mute icon). While it's off, should hovering preview on (red), or just lift?",
      options: [["lift", "Just lift"], ["preview", "Preview red"]], rec: "lift",
      try: [["projects/index.html", "Any page (top centre)"]] },
    { id: "settle-redbtn", kind: "settle", area: "Site", from: "Fable review", param: "redbtn", value: "deep",
      q: "Red buttons: one shade deeper passes contrast on every thread (5.93:1); the twill dips to 4.27 on its light threads.", try: [["projects/item.html?p=sonata&redbtn=twill", "Today's twill instead"]] },
    { id: "cut-mhide-all", kind: "cut", area: "Phones", from: "Fable review", param: "mhide", value: "all",
      q: "Hiding the bottom items on scroll: you said it fights the user. Cut it and keep them always there.", try: [["projects/index.html?mhide=all", "See it (on a phone)"]] },

    // ---- thoughts + rankings ----
    { id: "aboutgo-pick", kind: "ask", area: "Thoughts", from: "thoughts agent",
      q: "Where should an “about” pill take you? Open the thing's page, scroll to it in the feed, or split (the name scrolls to it, ↗ opens it).",
      options: [["split", "Split"], ["page", "Open the page"], ["scroll", "Scroll to it"]], rec: "split",
      try: [["thoughts/stitched.html?aboutgo=split", "Split"], ["thoughts/stitched.html?aboutgo=scroll", "Scroll"]] },
    { id: "settle-apager", kind: "settle", area: "Thoughts", from: "Fable review", param: "apager", value: "top",
      q: "Article previous / next in the top bar, like every other detail page.", try: [["thoughts/stitched.html?view=article&id=a2&apager=top", "Top bar"], ["thoughts/stitched.html?view=article&id=a2", "At the end (today)"]] },
    { id: "tier-a", kind: "ask", area: "Rankings", from: "thoughts agent",
      q: "Tier A passes contrast now by lightening the felt under its orange (ink label, 4.80:1). Keep that, or a darker orange with a white label (4.93:1)?",
      options: [["felt", "Keep the lighter felt"], ["dark", "Darker orange, white label"]], rec: "felt",
      try: [["thoughts/tier.html?id=tl1", "Browsers ranking"]] },
  ],
};
