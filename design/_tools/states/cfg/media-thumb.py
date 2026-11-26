R = [["mediaThumb", "mediaThumbFelt", "mediaThumbMono", "mediaThumbMissing"]]
CONFIG = {"file": "components/molecules/media-thumb.elyx", "sections": [{"rows": R}],
  "drop": ["mediaThumbLabel", "mediaThumbFeltLabel", "mediaThumbMonoLabel", "mediaThumbMissingLabel"],
  "notes": {"mediaThumb": "an image", "mediaThumbFelt": "a video with no still: the felt", "mediaThumbMono": "no media: the monogram",
    "mediaThumbMissing": "a file that can't play"},
  "boards": [{"key": "mediaThumb", "caption": "Media thumb", "rows": R}]}
