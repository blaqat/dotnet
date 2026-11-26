#!/bin/sh
mkdir -p /tmp/agentLibrary
# generate -> measure -> lay out -> generate -> normalize -> diagnose
set -e
D=/Users/blaqat/dev/projects/blaqatdotnet/design
G=/Users/blaqat/dev/projects/blaqatdotnet/design/_tools/library
cd $G && python3 build.py | tail -1
cd $D && elyx tree library.elyx --depth 0 > /tmp/agentLibrary/tree0.json
cd $G && python3 layout.py && python3 build.py | tail -1
cd $D && elyx normalize -w library.elyx && elyx diagnostics library.elyx | grep -A3 summary
