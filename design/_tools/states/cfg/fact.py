R = [["fact", "factWip", "factPaused", "factDropped", "factMatch"],
     ["factPersonal", "factWork", "factSchool", "factChip"],
     ["factLive", "factEdits", "factDraft"]]
CONFIG = {"file": "components/molecules/fact.elyx", "sections": [{"rows": R}],
  "notes": {"fact": "status · complete", "factWip": "status · WIP", "factPaused": "status · paused",
    "factDropped": "status · dropped", "factMatch": "matched (in-card chip)", "factPersonal": "type · personal",
    "factWork": "type · work", "factSchool": "type · school", "factChip": "a quiet fact (date, text)",
    "factLive": "publish · live", "factEdits": "publish · edits", "factDraft": "publish · draft"},
  "boards": [{"key": "fact", "caption": "Fact", "rows": R}]}
