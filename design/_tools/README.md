# Generators

Layout helpers that wrote the doc pages. The `.elyx` files are the source of
truth; rerun these only to re-lay-out after adding variants.

- `library/pipeline.sh` rebuilds `design/library.elyx` (catalogue of every
  export, i9 | i10 | i11 boards, measured layout). Add new components to
  `library/catalogue.py`.
- `states/do.sh <name>` rebuilds everything below `// ==== states page` in one
  component file, from `states/cfg/<name>.py` (add an entry for a new variant).

Scratch output goes to `/tmp/agentLibrary` and `/tmp/agentStates`.
