R = [["kbd", "kbdIcon", "kbdDark", "hint", "tip"], ["toast", "toastAction", "toastPlain"], ["empty", "emptyText", "emptyQuiet"]]
CONFIG = {"file": "components/molecules/feedback.elyx", "sections": [{"rows": R}],
  "notes": {"kbd": "a key", "kbdIcon": "a key with a glyph", "kbdDark": "a key on ink", "hint": "a key hint",
    "tip": "the hint (.ytip)", "toast": "toast · Undo", "toastAction": "toast · an action", "toastPlain": "toast · words only",
    "empty": "empty · title + action", "emptyText": "empty · + a second line", "emptyQuiet": "empty · quiet"},
  "boards": [{"key": "feedback", "caption": "Toast · hint · empty", "rows": R}]}
