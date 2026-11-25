// Placeholder content for the Thoughts mocks. Shapes are the point, not the words.
// Every post has: id, type, date (ISO), tags[]. Feed is newest-first by date.
// Collections ("tools", "browsers"...) gather posts across dates into one page.
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
    { id: "tl1", type: "tierlist", date: "2026-11-02T21:05", tags: ["browsers", "ranked"],
      title: "My favorite browsers, ranked",
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
    { id: "t2", type: "scratch", date: "2026-11-01T08:12", tags: [],
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
    { id: "p2", type: "pick", collection: "tools", date: "2026-10-26T12:00", tags: ["tools", "dotfiles"],
      name: "chezmoi", url: "https://chezmoi.io", blurb: "Dotfiles across machines, with encrypted secrets." },
    { id: "t3", type: "scratch", date: "2026-10-24T01:03", tags: ["shower"],
      text: "folders are just tabs that grew up" },
    { id: "a2", type: "article", date: "2026-10-20T09:00", tags: ["design", "learnings"], readMins: 4,
      title: "Springs, not durations",
      dek: "What I took from Apple's fluid interface talk and how it maps to CSS.",
      body: `## Respond on press

Feedback starts on pointer-down. Commit on release.

## Interrupt anything

Animate from the **current** value, never the target.` },
    { id: "p3", type: "pick", collection: "tools", date: "2026-10-18T19:45", tags: ["tools", "terminal"],
      name: "mise", url: "https://mise.jdx.dev", blurb: "One tool for node, bun, python versions." },
    { id: "e2", type: "embed", date: "2026-10-15T11:11", tags: ["projects"],
      title: "Senior project portal, coach view", note: "",
      media: [ { src: "../media/portal-coach.gif", alt: "Coach view of the senior project portal" }, { src: "../media/portal-student.png", alt: "Student view" } ] },
    { id: "p4", type: "pick", collection: "tools", date: "2026-10-09T08:30", tags: ["tools", "browser"],
      name: "Helium", url: "https://helium.computer", blurb: "Quiet Chromium browser. Currently my S tier." },
    { id: "t4", type: "scratch", date: "2026-10-02T17:20", tags: [],
      text: "a playlist is a mood with a tracklist" },
  ],
};
