R = [["nav"], ["navPhone"]]
CONFIG = {"file": "components/organisms/nav.elyx", "sections": [{"rows": [["nav", "navPhone"], ["navProjects"], ["navMusic"], ["navThoughts"]]}],
  "drop": ["navPhoneLabel"],
  "notes": {"nav": "desktop · Home here", "navProjects": "section = projects", "navMusic": "section = music",
    "navThoughts": "section = thoughts", "navPhone": "phones: the top line (sections pill on the floating row)"},
  "boards": [{"key": "nav", "caption": "Nav", "rows": R,
     "sections": {"projects": {"i9": {"nav": "navProjects"}}, "music": {"i9": {"nav": "navMusic"}}, "thoughts": {"i9": {"nav": "navThoughts"}}}}]}
