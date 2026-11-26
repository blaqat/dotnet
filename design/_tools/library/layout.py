import json, sys
sys.path.insert(0, '/Users/blaqat/dev/projects/blaqatdotnet/design/_tools/library')
import catalogue as C
from build import P

t = json.load(open('/tmp/agentLibrary/tree0.json'))
H = {c['name']: c['resolvedSize']['height'] for c in t['tree']['children']}

ROW_GAP, BAND_GAP_BEFORE, BAND_GAP_AFTER, HUE_GAP = 240, 360, 120, 120
rows = [('full', 'libraryHead'), ('full', 'bandFoundations'), ('full', 'palette')]
for g in ['foundations', 'components', 'patterns', 'studio']:
    if g != 'foundations':
        rows.append(('full', 'band' + g.capitalize()))
    for b in C.BOARDS[g]:
        rows.append(('triple', b.bid))
        if b.bid == 'roles':
            rows.append(('hue', ['hueHome', 'hueProjects', 'hueMusic', 'hueThoughts', 'hueStudio']))

pos = {}
y = 0
prev = None
for kind, what in rows:
    if prev is not None:
        if kind == 'full' and what.startswith('band'):
            y += BAND_GAP_BEFORE
        elif prev[0] == 'full' and prev[1].startswith('band'):
            y += BAND_GAP_AFTER
        else:
            y += ROW_GAP
    if kind == 'full':
        pos[what] = [0, round(y)]
        y += H[what]
    elif kind == 'triple':
        names = [what, what + 'I10', what + 'I11']
        for k, n in enumerate(names):
            pos[n] = [k * P, round(y)]
        y += max(H[n] for n in names)
    else:
        col_bottom = []
        for k, suf in enumerate(['', 'I10', 'I11']):
            yy = y
            for j, n in enumerate(what):
                if j:
                    yy += HUE_GAP
                pos[n + suf] = [k * P, round(yy)]
                yy += H[n + suf]
            col_bottom.append(yy)
        y = max(col_bottom)
    prev = (kind, what)

json.dump(pos, open('/Users/blaqat/dev/projects/blaqatdotnet/design/_tools/library/layout.json', 'w'), indent=0)
print('total height', y, 'boards', len(pos))
