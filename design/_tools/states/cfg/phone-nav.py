knobs = ["searchKnob", "searchKnobUp", "searchKnobOpen", "searchKnobCount", "browseKnob", "newKnob"]
layers = ["phoneLayer", "phoneLayerDisc", "phoneLayerBar", "phoneLayerBarPaused", "phoneLayerSearch", "phoneLayerMenu", "phoneLayerNew"]
CONFIG = {"file": "components/organisms/phone-nav.elyx",
  "sections": [{"rows": [knobs, ["spoolRow", "spoolRowHere"],
     ["sectionsMenu", "sectionsMenuProjects", "sectionsMenuMusic", "sectionsMenuThoughts", "sectionsMenuStudio"],
     ["searchSlot", "searchSlotTyped", "filterFloat"], layers]}],
  "drop": ["knobLabel", "knobUpLabel", "knobOpenLabel", "knobCountLabel", "browseLabel", "newLabel", "rowLabel", "rowHereLabel",
           "menuLabel", "menuProjectsLabel", "menuMusicLabel", "menuThoughtsLabel", "menuStudioLabel", "slotLabel", "slotTypedLabel",
           "floatLabel", "layerLabel", "layerDiscLabel", "layerBarLabel", "layerBarPausedLabel", "layerSearchLabel", "layerMenuLabel", "layerNewLabel"],
  "notes": {"searchKnob": "the search knob · rest", "searchKnobUp": "up: on the line", "searchKnobOpen": "open: unrolled",
    "searchKnobCount": "with a filter count", "browseKnob": "browse (filters)", "newKnob": "Studio's new",
    "spoolRow": "a sections row", "spoolRowHere": "here", "sectionsMenu": "the sections menu · Home",
    "sectionsMenuProjects": "section = projects", "sectionsMenuMusic": "section = music", "sectionsMenuThoughts": "section = thoughts",
    "sectionsMenuStudio": "section = studio", "searchSlot": "search in the slot · focused", "searchSlotTyped": "typed",
    "filterFloat": "the chip row on the up line", "phoneLayer": "the floating layer · rest", "phoneLayerDisc": "a song loaded",
    "phoneLayerBar": "the bar · playing", "phoneLayerBarPaused": "the bar · paused", "phoneLayerSearch": "search open",
    "phoneLayerMenu": "sections open", "phoneLayerNew": "Studio"},
  "boards": [
    {"key": "phoneNav", "caption": "Phone nav", "rows": [knobs, ["spoolRow", "spoolRowHere"], ["searchSlot", "searchSlotTyped", "filterFloat"], layers]},
    {"key": "sectionsMenu", "caption": "Sections menu", "rows": [["sectionsMenu"]],
     "sections": {s: {"i9": {"sectionsMenu": "sectionsMenu" + s.capitalize()}} for s in ["projects", "music", "thoughts", "studio"]}}]}
