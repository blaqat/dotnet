// Placeholder content for the Thoughts mocks. Shapes are the point, not the words.
// Every post has: id, type, date (ISO), tags[]. Feed is newest-first by date.
// Collections ("tools", "browsers"...) gather posts across dates into one page.
// i3: `color` = the owner's pick for a scratch's sticky note (canary · pink · mint · sky · orange · lilac) or a
// pick's tag stub (tan · red · ink · blue · green · gold); no colour = the default (canary / tan). Set in Studio.
// i4: a ranking may name its own tiers: tierDefs = [{ id, label, color }] best first (any count, any length, colour
// from Yarn.post.TIER_COLORS); tiers + community are keyed by those ids. Without tierDefs it's S A B C D. `note` =
// the owner's line on the ranking page.
// i5 (T1, thoughts/CONCEPTS.md): a write-up is an article with `about` = what it's about:
//   "project:<slug>" · "release:<slug>" · "post:<id>" (a ranking, a pick…) · "post:<id>#<item>" (one ranking item).
// A project write-up keeps its text in the project's description (kit/data.js, after the "---"): its post here has
// no body, just the date, title, dek and tags (thoughts/common.js fills the body in).
window.THOUGHTS = {
  collections: {
    tools: { title: "Tools I like", blurb: "Everything I've posted under #tools, in one place.", icon: "ph-wrench" },
    reading: { title: "Reading pile", blurb: "Links worth keeping.", icon: "ph-book-open" },
  },
  posts: [
    { id: "t1", type: "scratch", date: "2026-11-07T23:41", tags: ["shower"],
      text: "what if every website had a little cat that judged your scroll speed" },
    // i5 (T1): an article about a pick (?pickart=article folds it into the pick itself)
    { id: "a3", type: "article", about: "post:p5", date: "2026-11-07T10:15", tags: ["tools", "terminal"], readMins: 2,
      title: "Ghostty, three months in",
      dek: "The terminal I stopped tweaking.",
      body: `## Why I switched

I wanted a terminal that's fast and native without a config the size of a novel. Ghostty's defaults were already right.

## My whole config

\`\`\`ini
font-family = Maple Mono
theme = blaqat-dark
window-padding-x = 12
\`\`\`

Three lines. I keep opening the file to add something and closing it again.

## The one feature

The quick terminal. A hotkey drops it over whatever I'm doing, and it's gone when I'm done.` },
    // i5 (T1): an article about one item on a ranking (Helium on tl1)
    { id: "a5", type: "article", about: "post:tl1#Helium", date: "2026-11-06T19:30", tags: ["browser", "tools"], readMins: 2,
      title: "Helium, the quiet one",
      dek: "A month in, I forgot I'd switched. That's why it's in S.",
      body: `## What it is

Chromium with the extra stuff taken out. It opens fast, it stays out of the way, and my extensions just work.

## What I'd change

- Tab groups only come in pastel
- I miss Arc's command bar a little

## Why S

It's the only browser I never thought about the whole month. That's the bar.` },
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
    // i5 (T1): the ranking's overall write-up
    { id: "a4", type: "article", about: "post:tl1", date: "2026-11-04T21:00", tags: ["browsers", "ranked"], readMins: 3,
      title: "Ten browsers, a month each",
      dek: "How the ranking happened, and why Chrome is in D.",
      body: `## The rule

A browser only got ranked if it was my **only** browser for a month: work, music, forty tabs of docs, all of it.

## The top

Helium won by being boring in the best way (more on that in its own post). Zen and Arc are the fun ones: Arc taught me spaces, Zen kept them and stayed fast.

## The middle

Firefox, Safari and Orion are all fine. Orion surprised me on battery. Safari still fights my extensions.

## The bottom

Nothing is wrong with Chrome. I just never want to open it. Edge keeps asking me to reconsider.

> Your ranking goes on the board too. Tell me I'm wrong in the comments.` },
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
    // (tl2 is Studio's draft "Code editors, ranked") · i5: the tags had slipped into that comment
    { id: "tl3", type: "tierlist", date: "2026-10-19T23:15", tags: ["design", "ranked"],
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
    // i5 (T1): project write-ups are ordinary articles (text: the project's description in kit/data.js)
    { id: "w-bank", type: "article", about: "project:bank-simulation", date: "2024-04-26T17:00", tags: ["learnings"],
      title: "Simulating a bank on an STM32",
      dek: "FreeRTOS tasks, queues and semaphores, and how I stopped busy-waiting." },
    { id: "w-forth", type: "article", about: "project:forth-evaluator", date: "2023-06-20T15:00", tags: ["learnings"],
      title: "Writing a Forth evaluator in Rust, twice",
      dek: "Closures in a HashMap, then a tokenizer. The second one stuck." },
  ],
};
