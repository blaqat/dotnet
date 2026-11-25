# Thoughts · what the words mean (i5, T1)

**In one breath:** everything in the feed is a *post*. An *article* is a post you sit down and read. A *write-up* is just an article that is **about** something, and that thing links back to it. A *collection* is a shelf of picks you put together on purpose, so it stays on the side.

## The words

| Word | What it is | Is it a post? |
|---|---|---|
| **Post** | Anything dated in the Thoughts feed: scratch, article, pick, ranking, playlist, images. Has tags. | yes |
| **Article** | A post with a body, read on its own page (title, dek, reading time, On this page). | yes |
| **Write-up** | Not a type. An article with an `about`. Everywhere it's an article (feed, Articles filter, search, tags, Older/Newer); it also says what it's about. | yes (an article) |
| **Pick** | A short post pointing at one outside thing: a link and a line. Can sit on one collection's shelf. | yes |
| **Collection** | A named, hand-picked group of picks (Tools I like). Not a filter: it's *intentional*, so it lives on the side (rail, Browse sheet) and has its own page. Its picks stay in the feed too. | no |
| **Ranking** | A post that sorts items into tiers. Visitors add their own ranking and comment. | yes |
| **Ranking item** | One entry on a ranking (Helium). It lives on its ranking's page; no page of its own. | no |
| **Artifact** | The umbrella for anything an article can be about: a project, a music release, a post (ranking, pick, playlist, images), or a ranking item. | n/a |

## "About" (one field, two directions)

`about` on an article names one artifact. One article is about one thing; one thing can have several articles (newest first).

```
about: "project:bank-simulation"   a project        (projects page)
about: "release:<slug>"            a music release  (music page; not mocked yet)
about: "post:tl1"                  a ranking (or any post: a pick, a playlist…)
about: "post:tl1#Helium"           one item on that ranking
about: "post:p5"                   a pick (Ghostty)
```

| | On the article | On the thing |
|---|---|---|
| Card | `about · Bank Simulation` pill under the text | `write-up · Ghostty, three months in` pill under the text (pick, ranking) |
| Page | an **About** card under the dek: the thing's name, what it is, one meta line; it opens the thing | ranking page: the write-up pill in its head. Ranking item: a small round marker on its tile. Project / release: their existing "Read the write-up" link |

The text of a project write-up still lives in the project's description (after the `---`), and `?view=article&project=<slug>` still opens it, so the Projects page links work unchanged. The Thoughts side only adds the article's date, title, dek and tags.

## Where each one shows up

| | Feed | Search, type + tag filters | Collections | Own page |
|---|---|---|---|---|
| Article / write-up | yes, as an article card (+ "about") | yes: its own words, its tags, and the name of what it's about ("helium" finds the Helium review) | no | the article page |
| Pick | yes | yes (Picks) | its collection's shelf | no; it opens its collection (or its article, below) |
| Ranking | yes | yes (Rankings) | no | the ranking page |
| Ranking item | inside its ranking | through its ranking | no | no (a marker opens its write-up) |
| Collection | no | no (a side link) | is one | the collection page |
| Project / release | no | no | no | Projects / Music |

"From projects" is gone from the rail and the Browse sheet: those write-ups are ordinary articles in the feed now.

## A pick with an article (`?pickart`, open)

- **`link` (recommended, default):** the article is its own post *about* the pick. The pick card gets `write-up · <title>`. One rule for every artifact (project, ranking, item, pick); the pick stays a short thing; the Articles filter finds the article.
- **`article`:** the pick *is* the article. One card (the pick card, plus a reading time and "Read"), opening an article page that keeps the pick's link and shelf. Fewer cards, but the pick is secretly long, and it counts as a Pick, not an Article.
