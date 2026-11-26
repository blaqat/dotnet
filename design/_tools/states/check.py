#!/usr/bin/env python3
"""check top-level layout of an elyx file: overlaps and tight gaps."""
import json, subprocess, sys
root = "/Users/blaqat/dev/projects/blaqatdotnet/design"
f = sys.argv[1]
if len(sys.argv) > 2: root = sys.argv[2]
d = json.loads(subprocess.run(["elyx", "tree", f, "--depth", "0"], cwd=root, capture_output=True, text=True).stdout)
boxes = []
for c in d["tree"]["children"]:
    x, y = c["position"]["x"], c["position"]["y"]
    w, h = c["resolvedSize"]["width"], c["resolvedSize"]["height"]
    boxes.append((c["name"], x, y, x + w, y + h))
def owner(n):
    for p in ("lbl-", "note-"):
        if n.startswith(p): return n[len(p):]
    return n
bad = 0
for i in range(len(boxes)):
    for j in range(i + 1, len(boxes)):
        a, b = boxes[i], boxes[j]
        if owner(a[0]) == owner(b[0]): continue
        dx = max(b[1] - a[3], a[1] - b[3])
        dy = max(b[2] - a[4], a[2] - b[4])
        sep = max(dx, dy)
        isl = lambda n: n.startswith("lbl-") or n.startswith("note-") or n.startswith("head-")
        lim = 16 if (isl(a[0]) or isl(b[0])) else 48
        if sep < lim:
            bad += 1
            print("TIGHT %-28s %-28s sep=%.0f (dx=%.0f dy=%.0f)" % (a[0], b[0], sep, dx, dy))
print("checked", len(boxes), "layers;", bad, "problems")
