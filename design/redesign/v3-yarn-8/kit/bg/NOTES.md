# Sheet backgrounds: notes

Compare in `kit/bg/index.html`; any page takes `?bg=<name>`.

## Diagnosis

1. **Grids that never agree.** The knit repeats every 14×16 px and the diamond every 36×36, so diamond edges cut the V's at a different spot each time: a print over a knit, not one cloth.
2. **Three diagonals:** V legs ~62°, lattice 45°, cord ~58°.
3. **No hierarchy.** Equal faint contrast, so neither reads as the ground.
4. **The dashes are used twice.** The lattice uses the "sewn edge" dash, so stitched edges lose meaning.
5. **Scale.** A 36 px diamond ≈ 1.5 text lines; it beats against reading.
6. **Cards blend in:** same knit, out of phase, so they look misprinted, not sewn on.
7. **Contrast.** The darkest pixels take `--ink-3` meta to 4.0:1 (2% of the sheet is under AA).

## Options

All are static data-URI SVG tiles sized in whole 14×12 stitches, so they tile seamlessly at 1× and 2×. Contrast was measured on the rendered sheet.

> **i4:** the default is now **`jersey`** (owner: "leaning on jersey … def between jersey and intarsia"); `intarsia` stays one click away in ⚙ (`?bg=intarsia`). The recommendation below is the bg agent's from i2.

- **`jersey`** ★ (default since i4): see below.
- **`intarsia`** (i2's recommendation; runner-up since i4): the diamonds are knitted in. Camel stitches step one per row on the same grid, under a quieter ground knit. Ink-3 is ≥ 4.48:1 everywhere. Cards are felt.
- **`jersey`**: plain knit with no motif. It's the calmest option and the base for the others. Ink-3 is ≥ 4.6:1 everywhere. Cards are felt.
- **`quilt`**: the diamonds become sunken quilting seams and the knit moves to the cards. Ink-3 is ≥ 4.5:1 on 99% of pixels.
- **`speckle`**: the knit with red and ink dye flecks. It's playful, but a fleck drops ink-3 to 3.5:1 (0.6% of pixels).
- **`current`**: for comparison.

Knit options redefine `--tex-knit`, so chips and sticky bars match the sheet. Cards go felt via `--patch-bg` plus a tile swap on `.patch`/`.ycard`, which leaves ink cards alone.

## Recommendation: `intarsia`

It fixes the stated problem and keeps what the owner likes: the diamonds are made *of* the ties, one grid, a clear figure on a quiet ground. The 112×96 repeat sits behind text, the dashes mean "sewn edge" again, and felt cards give text a calm surface. It's the only motif option that holds AA for meta text everywhere. If it feels busy, `jersey` is the same fabric without the lattice.

## For the kit

- Add intarsia, jersey, quilt and speckle to `BG_OPTIONS`.
- Page cards that hard-code `var(--tex-knit), var(--white)` should use `var(--patch-bg, …)`.
- `--ink-3` has only ~13% luminance headroom on cotton. #676161 (≈ 5.7:1) would give textures room.
