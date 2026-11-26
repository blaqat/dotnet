K = ["Soundcloud", "Beepbox", "Youtube", "Github", "External", "Writeup", "Discord"]
row9 = ["linkDisc", "linkDiscHover", "linkDiscFocus"] + ["linkDisc" + k for k in K]
row10 = [s + "I10" for s in row9]
CONFIG = {
  "file": "components/molecules/link-disc.elyx",
  "sections": [{"rows": [row9, row10]}],
  "notes": {
    "linkDisc": "rest · link",
    "linkDiscHover": "hover: lifts, fills",
    "linkDiscFocus": "focus (keys)",
    "linkDiscI10": "i10 · duotone glyph",
    "linkDiscHoverI10": "i10 · hover",
    "linkDiscFocusI10": "i10 · focus",
  },
  "boards": [{"key": "linkDisc", "caption": "Link disc",
     "rows": [row9[:3], row9[3:]],
     "i10": {s: s + "I10" for s in row9}}],
}
