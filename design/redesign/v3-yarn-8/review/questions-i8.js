/* Open questions for the iteration 8 round-up (review.html). i8 is the last iteration: every i7 question took its
   recommended answer (FEEDBACK-i8.md). New: the dark-theme mock (DK). kind: ask · cut · settle · try links are relative
   to v3-yarn-8/ */
window.YARN_ROUNDUP = {
  iteration: 8,
  questions: [
    // ---- dark theme (DK) ----
    { id: "dark-ship", kind: "ask", area: "Site", from: "dark-theme agent",
      q: "Should the real site ship the dark theme, and how? Auto = dark whenever the visitor's device is dark. A toggle = a small woven switch (beside the sound tag) that remembers the choice. Both = auto by default, the toggle overrides it.",
      options: [["both", "Auto + a toggle"], ["auto", "Auto with the OS only"], ["toggle", "A toggle only (light by default)"], ["no", "No, light only"]], rec: "both",
      try: [["home/index.html?theme=dark&skip", "Home in dark"], ["music/index.html?theme=dark&demo=1&player=panel", "Music + the player"], ["thoughts/stitched.html?theme=dark", "Thoughts"], ["kit/components.html?theme=dark", "Every part (toggle at the top)"], ["projects/index.html?theme=auto", "Auto (follows your OS)"]] },
    { id: "dark-sheet", kind: "ask", area: "Site", from: "dark-theme agent",
      q: "If dark ships: the sheet is a warm charcoal wool with the knit drawn light-on-dark, cards a step lighter, text cotton (never pure white), and floating things (menus, the player, the phone search) a step lighter again. Keep that, or go deeper (near black, more contrast with the frame)?",
      options: [["charcoal", "Charcoal (as built)"], ["deeper", "Deeper, near black"]], rec: "charcoal",
      try: [["projects/index.html?theme=dark", "Projects"], ["studio/index.html?theme=dark", "Studio"], ["thoughts/tier.html?id=tl1&theme=dark", "A ranking"]] },
  ],
};
