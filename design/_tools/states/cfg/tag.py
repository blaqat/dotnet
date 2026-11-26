R = [["tag", "tagHover", "tagFocus", "tagMatch", "tagMatchHover", "tagMore"],
     ["tagStack", "tagStackMatch", "tagPress"],
     ["tagRow", "tagStackRow"]]
CONFIG = {"file": "components/molecules/tag.elyx", "sections": [{"rows": R}],
  "drop": ["tagStackRowLabel"],
  "notes": {"tag": "rest: a hashtag", "tagHover": "hover", "tagFocus": "focus (keys)",
    "tagMatch": "match: pressed / a typed hit", "tagMatchHover": "match + hover: the strike",
    "tagMore": "the rest of a folded list", "tagStack": "a stack tag", "tagStackMatch": "stack tag · match",
    "tagPress": "a tag you press (Thoughts)", "tagRow": "a row's tags", "tagStackRow": "a project's stack"},
  "boards": [{"key": "tag", "caption": "Tag", "rows": R}]}
