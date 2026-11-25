// Placeholder content for the Thoughts mocks. Shapes are the point, not the words.
// Every post has: id, type, date (ISO), tags[]. Feed is newest-first by date.
// Collections ("tools", "browsers"...) gather posts across dates into one page.
// i3: `color` = the owner's pick for a scratch's sticky note (canary · pink · mint · sky · orange · lilac) or a
// pick's tag stub (tan · red · ink · blue · green · gold); no colour = the default (canary / tan). Set in Studio.
// i4: a ranking may name its own tiers: tierDefs = [{ id, label, color }] best first (any count, any length, colour
// from Yarn.post.TIER_COLORS); tiers + community are keyed by those ids. Without tierDefs it's S A B C D. `note` =
// the owner's line on the ranking page.
window.THOUGHTS = {
  collections: {
    tools: { title: "Tools I like", blurb: "Everything I've posted under #tools, in one place.", icon: "ph-wrench" },
    reading: { title: "Reading pile", blurb: "Links worth keeping.", icon: "ph-book-open" },
  },
  posts: [
    { id: "t1", type: "scratch", date: "2026-11-07T23:41", tags: ["shower"],
      text: "what if every website had a little cat that judged your scroll speed" },
    { id: "a1", type: "article", date: "2026-11-05T10:00", tags: ["svelte", "learnings"], readMins: 7,
      title: "Moving a site from Astro to SvelteKit without losing the music",
      dek: "One <audio> element, a root layout, and why the player kept restarting.",
      cover: "../media/site-plan.png",
      body: `## The problem

Every page change **remounted the player**, so audio cut out. The fix is boring: own the \`<audio>\` element in the root layout and never unmount it.

> If something has to survive navigation, it lives above the router.

### What moved

- Content went from \`src/data/*.json\` to D1
- Media went to R2
- The player became a store + one element

\`\`\`ts
// +layout.svelte
let audio: HTMLAudioElement;
setContext("player", createPlayer(() => audio));
\`\`\`

| Thing | Before | After |
| --- | --- | --- |
| Player | per page | root layout |
| Content | JSON in git | D1 |
| Deploy for a typo | yes | no |

![Planning the site](../media/site-plan.png)

That's it. More on the Studio later.` },
    { id: "p1", type: "pick", collection: "tools", date: "2026-11-04T18:20", tags: ["tools", "editor"],
      name: "Zed", url: "https://zed.dev", blurb: "Fast editor. I write my own themes for it." },
    { id: "p5", type: "pick", collection: "tools", date: "2026-11-03T09:10", tags: ["tools", "terminal"], color: "ink",
      name: "Ghostty", url: "https://ghostty.org", blurb: "A terminal that gets out of the way." },
    { id: "tl1", type: "tierlist", date: "2026-11-02T21:05", tags: ["browsers", "ranked"],
      title: "My favorite browsers, ranked",
      note: "Ten browsers I've actually lived in for a month or more. Helium is the quiet one that stuck.",
      tiers: {
        S: ["Helium"],
        A: ["Zen", "Arc"],
        B: ["Firefox", "Safari", "Orion"],
        C: ["Vivaldi", "Brave"],
        D: ["Chrome", "Edge"],
      },
      // community aggregate: share of N voters who placed each item in each tier
      community: { voters: 214, items: {
        Helium: [41, 33, 18, 6, 2], Zen: [28, 37, 24, 8, 3], Arc: [35, 30, 19, 10, 6],
        Firefox: [22, 34, 29, 11, 4], Safari: [12, 29, 35, 17, 7], Orion: [9, 21, 38, 22, 10],
        Vivaldi: [6, 18, 33, 28, 15], Brave: [10, 22, 30, 24, 14], Chrome: [8, 15, 27, 26, 24], Edge: [3, 7, 19, 31, 40],
      } } },
    { id: "t2", type: "scratch", date: "2026-11-01T08:12", tags: [], color: "pink",
      text: "the best ui feedback is the one you only notice when it's missing" },
    { id: "pl1", type: "playlist", date: "2026-10-30T22:30", tags: ["music", "focus"],
      title: "late night, low lights", note: "Stuff I've been writing to. Mostly mine, sorry.",
      tracks: [
        { title: "feline shores", by: "aiden", dur: "2:41", src: "https://music.blaqat.net/daw/feline-shores.mp3" },
        { title: "farewell my star", by: "aiden", dur: "3:12", src: "https://music.blaqat.net/daw/farewell-my-star.mp3" },
        { title: "combat", by: "aiden", dur: "1:58", src: "https://music.blaqat.net/vgm-class/combat.mp3" },
        { title: "explore (piano)", by: "aiden", dur: "2:20", src: "https://music.blaqat.net/vgm-class/explore-piano.mp3" },
      ] },
    { id: "e1", type: "embed", date: "2026-10-28T15:40", tags: ["design", "wip"],
      title: "Sona character sheets", note: "Old drawings I found. Tap to look closer.",
      media: [
        { src: "../media/sona.png", alt: "Sona, front view" },
        { src: "../media/sona-different.png", alt: "Sona, alternate outfit" },
        { src: "../media/sona-auri.png", alt: "Sona with Auri" },
        { src: "../media/rawsy.png", alt: "Rawsy sketch" },
      ] },
    { id: "p2", type: "pick", collection: "tools", date: "2026-10-26T12:00", tags: ["tools", "dotfiles"], color: "red",
      name: "chezmoi", url: "https://chezmoi.io", blurb: "Dotfiles across machines, with encrypted secrets." },
    { id: "t3", type: "scratch", date: "2026-10-24T01:03", tags: ["shower"], color: "mint",
      text: "folders are just tabs that grew up" },
    { id: "a2", type: "article", date: "2026-10-20T09:00", tags: ["design", "learnings"], readMins: 4,
      title: "Springs, not durations",
      dek: "What I took from Apple's fluid interface talk and how it maps to CSS.",
      body: `## Respond on press

Feedback starts on pointer-down. Commit on release.

## Interrupt anything

Animate from the **current** value, never the target.` },
    // i4: custom tier names (4 tiers, one long label, palette colours that aren't the S–D felts)
    { id: "tl3", type: "tierlist", date: "2026-10-19T23:15", // (tl2 is Studio's draft "Code editors, ranked") tags: ["design", "ranked"],
      title: "Coding fonts, by how long they'd last",
      note: "Every monospace I've given a real week to. This site's own font is in here, no pressure.",
      tierDefs: [
        { id: "ride", label: "Ride or die", color: "red" },
        { id: "rotation", label: "In the rotation", color: "teal" },
        { id: "sunday", label: "Nice for a Sunday", color: "lilac" },
        { id: "screenshot", label: "Only in someone else's screenshot", color: "ink" },
      ],
      tiers: {
        ride: ["Maple Mono", "Berkeley Mono"],
        rotation: ["JetBrains Mono", "Iosevka", "Monaspace"],
        sunday: ["Fira Code", "Comic Mono"],
        screenshot: ["Courier New", "Consolas"],
      },
      community: { voters: 86, items: {
        "Maple Mono": [38, 34, 20, 8], "Berkeley Mono": [44, 30, 18, 8], "JetBrains Mono": [36, 41, 17, 6],
        Iosevka: [29, 38, 24, 9], Monaspace: [18, 37, 33, 12], "Fira Code": [21, 30, 36, 13],
        "Comic Mono": [9, 16, 41, 34], "Courier New": [3, 7, 22, 68], Consolas: [8, 22, 31, 39],
      } } },
    { id: "p3", type: "pick", collection: "tools", date: "2026-10-18T19:45", tags: ["tools", "terminal"], color: "blue",
      name: "mise", url: "https://mise.jdx.dev", blurb: "One tool for node, bun, python versions." },
    { id: "e2", type: "embed", date: "2026-10-15T11:11", tags: ["projects"],
      title: "Senior project portal, coach view", note: "",
      media: [ { src: "../media/portal-coach.gif", alt: "Coach view of the senior project portal" }, { src: "../media/portal-student.png", alt: "Student view" } ] },
    { id: "p4", type: "pick", collection: "tools", date: "2026-10-09T08:30", tags: ["tools", "browser"],
      name: "Helium", url: "https://helium.computer", blurb: "Quiet Chromium browser. Currently my S tier." },
    { id: "t4", type: "scratch", date: "2026-10-02T17:20", tags: [], color: "sky",
      text: "a playlist is a mood with a tracklist" },
    { id: "e3", type: "embed", date: "2026-09-21T20:15", tags: ["projects", "video"],
      title: "Old builds, in motion", note: "Two clips and a gif from the archive.",
      media: [
        { src: "../media/webcheckers.mp4", alt: "WebCheckers: quick gameplay showcase", kind: "video" },
        { src: "../media/fitr-redesign.gif", alt: "FiTR: redesign of the skill selection card" },
        { src: "../media/wsg.mp4", alt: "Talking to Sonata in voice chat", kind: "video" },
      ] },
  ],
};
