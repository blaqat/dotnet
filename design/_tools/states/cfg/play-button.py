R = [["playBtn", "playBtnCurrent", "playBtnLive", "playBtnLivePause"],
     ["playBtnSm", "playBtnSmCurrent", "playBtnSmLive"],
     ["playBtnLabel", "playBtnLabelSm", "playBtnPrimary", "playBtnPrimaryLive"]]
CONFIG = {
  "file": "components/molecules/play-button.elyx",
  "sections": [{"rows": R}],
  "notes": {
    "playBtn": "rest (act)",
    "playBtnCurrent": "current: loaded, paused",
    "playBtnLive": "live: playing, eq bars",
    "playBtnLivePause": "live, pause glyph (hover · focus · eq off)",
    "playBtnSm": "sm (36) · rest",
    "playBtnSmCurrent": "sm · current",
    "playBtnSmLive": "sm · live",
    "playBtnLabel": "labelled pill · rest",
    "playBtnLabelSm": "labelled · sm",
    "playBtnPrimary": "primary (one per view)",
    "playBtnPrimaryLive": "primary · live (Pause)",
  },
  "boards": [{"key": "playBtn", "caption": "Play button", "rows": R}],
}
