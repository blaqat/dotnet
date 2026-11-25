# Sound effects for blaqat.net (yarn)

Prototype: `kit/sound.js` (API) and `kit/sound-test.html` (audition every sound, play the intro, and see an offline-rendered waveform, spectrogram and level for each). Sound is **off by default**.

## 1. What fits the language

The site is felt, knit, cord and paper, and the sounds should be made of the same stuff: **soft, short, close, toy-like**. That means filtered noise for cloth and fibre, low cushioned thuds for presses and landings, and small wooden marimba notes (C-major pentatonic) for "happy" moments. There is no metal, glass, beep, square-wave chiptune, click-track or buzzer. Even errors are two muffled bumps. Everything sits below 6 kHz, so nothing is shrill. Thuds get a mid "knock" (~450–700 Hz) so they still exist on phone and laptop speakers, which play almost nothing below 250 Hz.

**Sound goes on:** things the hand did (press, toggle, drop, open/close), and the few scripted moments that are the site's personality (the intro, section transition, player open/close, Publish).
**Stays silent:** page load and anything that wasn't caused by a gesture (the intro only plays sound if the visitor already turned sound on *and* has interacted). Also scrolling, focus moves, typing in search (only the token conversion makes a sound), hover on touch devices (the `sew` hover is gated to `(hover: hover) and (pointer: fine)`), list-item hover anywhere, video and music controls beyond play/pause, filter-animation items (one sound per tap, never one per card), and anything that can repeat faster than ~5/s.

**Loudness and variation.** UI sounds sit far under the music player. They come in three tiers, measured as the loudest 50 ms RMS after the master: micro ≈ −31 dBFS (tap, chip, pawstep, play/pause), normal ≈ −26 (open/close, tag, lightbox, drop) and feature ≈ −21 (intro beats, notes, transition, player, Publish). Peaks are ≤ −8.5 dBFS for every sound and −4 dBFS for the whole overlapping intro, so nothing clips. A soft limiter sits on the master as a safety net, and a 55 Hz high-pass removes DC/sub lumps. Each play gets ±0.6 semitone and ±1.5 dB of random variation (a setting per sound), so repeats never sound machine-gunned. Each name has a rate limit (50–1200 ms), and at most 8 voices play at once (the oldest is stolen). UI sounds duck 40 % while music plays.

**Accessibility.** Off by default. One toggle per nav (`[data-sound-toggle]`, `aria-pressed`, label "Sound effects", title "Sound on/off"), remembered per visitor in localStorage. `?sound=on|off` overrides it for testing without saving. Sound is never the only feedback: every sound accompanies a visible change. The OS/browser is respected where it can be:
- No "reduce sounds" media query exists. `prefers-reduced-motion` is about motion, so I don't tie it to sound; off-by-default already covers it.
- Browser tab mute and autoplay rules apply automatically. Sounds stop when the tab is hidden.
- **iOS silent switch:** a page using only Web Audio gets the "ambient" audio session, which the switch mutes. That's good. But once an `<audio>` element plays (our music player), WebKit moves the page to "playback", and UI sounds then ignore the switch. `navigator.audioSession.type = "ambient"` (Safari 16.4/17+) would fix that, but it would also make the music obey the switch, so I left it as an open decision. [W3C Audio Session](https://www.w3.org/TR/audio-session/), [explainer](https://github.com/w3c/audio-session/blob/main/explainer.md)

## 2. Sources and licensing

| Option | Licence | Fit | Verdict |
|---|---|---|---|
| **WebAudio synthesis** (chosen) | None needed, our own code | Exactly tunable to felt/wood; intensity, duration and pitch are continuous parameters (the ball's bounces really shrink); 0 bytes of audio, ~11 KB gzipped JS | Use. Cost: tuning time and slightly "designed" timbres, and nobody has listened yet (see gaps) |
| [Kenney "Interface Sounds"](https://kenney.nl/assets/interface-sounds) (100 files) and other Kenney audio packs | CC0 1.0 (verified on the page) | Clean, but clicky/plastic, more game UI than textile | Good fallback for a single sampled layer, e.g. a real cloth swish. Formats not stated on the page (unverified, believed OGG) |
| [Freesound](https://freesound.org/help/faq/) | Per file: CC0, CC BY 4.0, CC BY-NC 4.0, legacy Sampling+ (verified) | Best real recordings of felt, yarn, wool, a cat's chirp | Only **CC0** files, and only after the licence on each file's own page has been checked. Avoid NC/Sampling+. Log URLs in `kit/sounds/LICENSES.md` |
| Commercial packs (e.g. Sonniss GDC bundles, Soundsnap, Epidemic, Zapsplat) | Royalty-free EULAs, usually "no redistribution of raw files" | Excellent foley | Not checked in detail (unverified). Shipping raw files on a public static site is redistribution under some EULAs, so read the EULA first |

No audio files ship in this prototype, so `kit/sounds/` is empty. If any are added, they must be CC0 and get a `LICENSES.md` there.

## 3. Tech

- **WebAudio over `<audio>`:** sample-accurate scheduling (the intro is one `schedule()` call), mixing, panning and per-play variation, and no per-element decode or pool. `<audio>` stays for the music player.
- **Unlock:** browsers start an `AudioContext` "suspended" until a user gesture ([Chrome autoplay policy](https://developer.chrome.com/blog/autoplay)). `sound.js` creates and resumes the context inside the first `pointerdown`/`touchend`/`keydown`/`click`, and also starts a silent 1-sample buffer, which old iOS needs. It re-resumes on later gestures, because iOS can leave the context "interrupted" after calls or Siri. Sounds requested before audio runs are **dropped, not queued**, so there's never a burst on unlock.
- **Mobile Safari:** use `webkitAudioContext` as a fallback; contexts get interrupted; the silent switch (above); and if no `AudioContext` exists at all, the toggle stays hidden.
- **Budget:** synthesis costs ~11 KB gzipped of JS and builds noise buffers lazily (~2 s × 4, built once). If samples are added later, keep them to one sprite of ≤ 100 KB (Opus/AAC, mono), decoded once after the toggle is turned on, never on page load.
- **Preload:** nothing loads until sound is on. A pre-rendered sprite would buy nothing here, because every sound renders in under 1 ms of scheduling.

## 4. Interaction → sound

| Interaction | Sound | Character | When |
|---|---|---|---|
| Intro: ball hits floor / smaller bounces | `ball-bounce` {intensity 1 → .4} | felt thud + tiny toy boing | each contact (`tFall`, `tB`) |
| Intro: ball rolls into the dot | `ball-roll` {duration} | lumpy low rumble, slowing | `tB` → `tRoll` |
| Intro: letters stitch out | `unspool` {duration} | rising thread zip | `tLet` |
| Intro: strand lands | `strand-land` | rustle + 3 tiny taps | `tRel + fallDur` |
| Intro: cat walks in | `pawstep` {pan} | barely-there pad | 3–4 footfalls, not every frame |
| Intro: cat swats ×2 | `swat` {intensity 1, .55} | airy swipe → soft bop | `tC1`, `tC2` |
| Intro: cat sits | `cat-sit` | cushioned flump | `tSit` |
| Click the cat (optional) | `cat-chirp` | synthesized "mrrp" (experimental) | on click, ≤ 1 per 1.2 s |
| Any plain button/nav press | `tap` | light felt tick | on press |
| Section button hover (desktop) | `sew` | quiet thread zip | rope sews in; fine pointer only |
| Notes burst out of section button | `notes` | 3 rising marimba notes | with `Notes.burst` |
| Section transition: cloth grows | `cloth` | warm whoosh + whomp | start of transition |
| Section transition: sheet unrolls | `unroll` | flutter rustle → flap | on the new page (`?from=home`) |
| Filter chip on / off, show all | `chip-on` / `chip-off` | press + G5 / softer + D5 | on toggle (one per tap) |
| Remove tag / token | `tag-remove` | soft scissor snip-snip | with the strike-through |
| Search text → token | `token-add` | bubbly pop + A5 | on conversion |
| Open / close item, sheet, detail page | `open` / `close` | cloth fwip up / fwop down + tap | on open / on close |
| Lightbox open / close | `lightbox-open` / `lightbox-close` | paper flick + lift / fall + tap | open / close |
| Copy link | `copy` | 2 paper ticks + high C | on success |
| Tier list pick up / drop | `pickup` / `drop` {rate per tier} | fibre tick + glide / felt thud + C5 | drag start / drop |
| Player expands / collapses to disc | `player-open` / `player-close` | whoosh + G4→D5 / D5→G4 + dock click | morph start |
| Play / pause | `play` / `pause` | tiny press + up/down blip | on press (not on auto-advance) |
| Studio Publish / Post | `post` | pin thud + C–E–G–C | on success only |
| Failed action / invalid drop | `nope` | two muffled bumps | on failure |
| Sound toggle turned on | `sound-on` | G5 → C6 | on enable (off is silent) |

The page agents call `window.YarnSound?.play(name, { el })`; passing `el` pans gently toward the element.
