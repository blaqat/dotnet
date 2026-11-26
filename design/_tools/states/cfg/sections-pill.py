R = [["sectionsPill", "sectionsPillOpen", "sectionsPillUp"]]
CONFIG = {"file": "components/molecules/sections-pill.elyx", "sections": [{"rows": [R[0], ["sectionsPillProjects", "sectionsPillMusic", "sectionsPillThoughts", "sectionsPillStudio"]]}],
  "drop": ["homeLabel", "projectsLabel", "musicLabel", "thoughtsLabel", "studioLabel", "openLabel", "upLabel"],
  "notes": {"sectionsPill": "Home · closed", "sectionsPillOpen": "the menu out", "sectionsPillUp": "the player in the slot",
    "sectionsPillProjects": "section = projects", "sectionsPillMusic": "section = music",
    "sectionsPillThoughts": "section = thoughts", "sectionsPillStudio": "section = studio"},
  "boards": [{"key": "sectionsPill", "caption": "Sections pill", "rows": R,
    "sections": {s: {"i9": {"sectionsPill": "sectionsPill" + s.capitalize()}} for s in ["projects", "music", "thoughts", "studio"]}}]}
