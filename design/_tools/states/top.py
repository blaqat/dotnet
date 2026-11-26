#!/usr/bin/env python3
"""list top-level layers of elyx files: name x y w h (+ registered variants / context from source)"""
import json, re, subprocess, sys
root = "/Users/blaqat/dev/projects/blaqatdotnet/design"
args = sys.argv[1:]
if "--root" in args:
    i = args.index("--root"); root = args[i + 1]; del args[i:i + 2]
for f in args:
    d = json.loads(subprocess.run(["elyx", "tree", f, "--depth", "0"], cwd=root, capture_output=True, text=True).stdout)
    src = open(root + "/" + f).read().split("\n")
    meta = {}
    ann = []
    for l in src:
        if l.startswith("@"): ann.append(l.strip()); continue
        m = re.match(r'^(export\s+)?([A-Za-z_][\w-]*)\s*=\s*\w+(\s*:\s*([\w.:-]+))?', l)
        if m and not l.startswith(" "):
            meta[m.group(2)] = ("E " if m.group(1) else "  ") + (": " + m.group(4) if m.group(4) else "") + "  " + " ".join(ann)
        if not l.startswith("//"): ann = []
    print("==", f)
    for c in d["tree"]["children"]:
        x, y = c["position"]["x"], c["position"]["y"]
        w, h = c["resolvedSize"]["width"], c["resolvedSize"]["height"]
        print("  %-30s %6d %6d %6d %6d  %s" % (c["name"], x, y, w, h, meta.get(c["name"], "?")))
