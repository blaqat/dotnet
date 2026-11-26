CONFIG = {
  "file": "components/organisms/folder-card.elyx",
  "sections": [{"rows": [
     ["folderCard", "folderCardCurrent", "folderCardLive", "folderCardSingle"],
     ["folderCardI10", "folderCardCurrentI10", "folderCardLiveI10", "-"],
     ["-", "-", "folderCardLiveI11", "-"]]}],
  "notes": {
    "folderCard": "rest · a collection (its tabs above)",
    "folderCardCurrent": "current: loaded, paused",
    "folderCardLive": "live: playing",
    "folderCardSingle": "a single (no tabs)",
    "folderCardI10": "i10 · the count joins the facts",
    "folderCardCurrentI10": "i10 · current",
    "folderCardLiveI10": "i10 · live tint, the tab's live fill",
    "folderCardLiveI11": "i11 · the face's “more” is cut",
  },
  "boards": [{"key": "folderCard", "caption": "Folder card",
     "rows": [["folderCard", "folderCardCurrent", "folderCardLive", "folderCardSingle"]],
     "i10": {"folderCard": "folderCardI10", "folderCardCurrent": "folderCardCurrentI10", "folderCardLive": "folderCardLiveI10"},
     "i11": {"folderCardLive": "folderCardLiveI11"}}],
}
