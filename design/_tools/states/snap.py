#!/usr/bin/env python3
"""snapshot the definitions of an elyx file (full tree, root positions dropped) and compare.
usage: snap.py save <file> <out.json> [root] | snap.py cmp <file> <before.json> [root]"""
import json, subprocess, sys
mode, f, out = sys.argv[1], sys.argv[2], sys.argv[3]
root = sys.argv[4] if len(sys.argv) > 4 else "/Users/blaqat/dev/projects/blaqatdotnet/design"
r = subprocess.run(["elyx", "tree", f, "--depth", "full"], cwd=root, capture_output=True, text=True)
d = json.loads(r.stdout)
GEN = ("lbl-", "note-", "head-")
def clean(n, top):
    n = dict(n)
    n.pop("target", None)
    if top:
        n.pop("position", None); n.pop("constraints", None)
    n["children"] = [clean(c, False) for c in n.get("children", [])]
    return n
cur = {}
for c in d["tree"]["children"]:
    if c["name"].startswith(GEN) or "States" in c["name"]:
        continue
    cur[c["name"]] = clean(c, True)
if mode == "save":
    json.dump(cur, open(out, "w"))
    print("saved", len(cur), "definitions")
else:
    before = json.load(open(out))
    bad = 0
    for k, v in before.items():
        if k not in cur:
            print("MISSING", k); bad += 1; continue
        if json.dumps(v, sort_keys=True) != json.dumps(cur[k], sort_keys=True):
            # find first diff path
            def diff(a, b, p):
                if type(a) != type(b): return p
                if isinstance(a, dict):
                    for kk in set(a) | set(b):
                        r = diff(a.get(kk), b.get(kk), p + "." + str(kk))
                        if r: return r
                    return None
                if isinstance(a, list):
                    if len(a) != len(b): return p + "[len]"
                    for i, (x, y) in enumerate(zip(a, b)):
                        r = diff(x, y, p + "[%d]" % i)
                        if r: return r
                    return None
                return None if a == b else p + " %r -> %r" % (a, b)
            print("CHANGED", k, diff(v, cur[k], k)); bad += 1
    for k in cur:
        if k not in before: print("NEW", k)
    print("compared", len(before), "definitions;", bad, "differ")
