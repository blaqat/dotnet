R9 = ["trackRow", "trackRowHover", "trackRowLive"]
CONFIG = {"file": "components/organisms/track-row.elyx", "sections": [{"rows": [R9, [s + "I10" for s in R9]]}],
  "notes": {"trackRow": "rest", "trackRowHover": "hover: the art's ▶", "trackRowLive": "live: playing",
    "trackRowI10": "i10 · duotone discs", "trackRowHoverI10": "i10 · hover", "trackRowLiveI10": "i10 · live tint"},
  "boards": [{"key": "trackRow", "caption": "Track row", "rows": [[s] for s in R9], "i10": {s: s + "I10" for s in R9}}]}
