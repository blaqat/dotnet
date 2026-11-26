R = [["proseP", "prosePSm"], ["proseH2", "proseH3", "proseCodeInline"], ["proseQuote", "proseDivider"], ["proseItem", "proseItemSm"],
     ["proseCode", "proseTable"], ["proseFigure"]]
CONFIG = {"file": "components/molecules/prose.elyx", "sections": [{"rows": R}],
  "drop": ["prosePLabel", "prosePSmLabel", "proseH2Label", "proseH3Label", "proseQuoteLabel", "proseItemLabel", "proseItemSmLabel",
           "proseCodeLabel", "proseCodeInlineLabel", "proseTableLabel", "proseFigureLabel", "proseDividerLabel"],
  "notes": {"proseP": "reading size (.yprose)", "prosePSm": "detail size (.ydetail__text)", "proseH2": "a section heading",
    "proseH3": "a sub-heading", "proseQuote": "a quote", "proseItem": "a list item", "proseItemSm": "a list item · detail size",
    "proseCode": "a code block", "proseCodeInline": "inline code", "proseTable": "a table", "proseFigure": "an image + caption",
    "proseDivider": "a divider"},
  "boards": [{"key": "prose", "caption": "Prose blocks", "rows": R}]}
