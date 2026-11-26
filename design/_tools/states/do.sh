#!/usr/bin/env bash
mkdir -p /tmp/agentStates
# usage: do.sh <cfg-name> [root]
set -euo pipefail
cfg=/Users/blaqat/dev/projects/blaqatdotnet/design/_tools/states/cfg/$1.py
root=${2:-/Users/blaqat/dev/projects/blaqatdotnet/design}
f=$(python3 -c "ns={}; exec(open('$cfg').read(), ns); print(ns['CONFIG']['file'])")
cd "$root"
python3 /Users/blaqat/dev/projects/blaqatdotnet/design/_tools/states/snap.py save "$f" /tmp/agentStates/snap-$1.json "$root"
cp "$f" /tmp/agentStates/pre-$1.elyx
python3 /Users/blaqat/dev/projects/blaqatdotnet/design/_tools/states/states.py "$cfg" --root "$root"
elyx normalize -w "$f" 2>&1 | tail -3
python3 /Users/blaqat/dev/projects/blaqatdotnet/design/_tools/states/snap.py cmp "$f" /tmp/agentStates/snap-$1.json "$root"
python3 /Users/blaqat/dev/projects/blaqatdotnet/design/_tools/states/check.py "$f" "$root"
(elyx diagnostics --importers "$f" || true) | python3 -c "import json,sys; d=json.load(sys.stdin); print('diagnostics', d['summary']); [print(x) for x in d['diagnostics'][:10]]"
elyx render "$f" -o /tmp/agentStates/$1.png
