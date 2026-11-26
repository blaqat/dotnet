import re, os
ROOT = '/Users/blaqat/dev/projects/blaqatdotnet/design'

def parse_groups(path):
    """Return {groupName: {member: value}} and {groupName: base} for a token file, plus
    ordered comment headings per group: {group: [(comment, [members])]}"""
    src = open(os.path.join(ROOT, path)).read().split('\n')
    groups, bases, sections = {}, {}, {}
    cur = None; pending = []
    for line in src:
        m = re.match(r'^export (\w+) = tokens(?: : ([\w.]+))? \{', line)
        if m:
            cur = m.group(1); groups[cur] = {}; bases[cur] = m.group(2)
            sections[cur] = [['', []]]; pending = []
            continue
        if cur is None: continue
        if line.startswith('}'):
            cur = None; continue
        s = line.strip()
        if s.startswith('//'):
            txt = s[2:].strip()
            if sections[cur][-1][1]:
                sections[cur].append([txt, []])
            else:
                sections[cur][-1][0] = (sections[cur][-1][0] + ' ' + txt).strip()
            continue
        m = re.match(r'^([a-z0-9-]+):\s*(.+?),?$', s)
        if m:
            k, v = m.group(1), m.group(2).rstrip(',').strip()
            groups[cur][k] = v
            sections[cur][-1][1].append(k)
    return groups, bases, sections

def merged(chain):
    """chain: list of (path, group) from base to most derived; returns merged dict."""
    out = {}
    for path, g in chain:
        groups, _, _ = parse_groups(path)
        out.update(groups[g])
    return out

def pal_name(v):
    m = re.match(r'p\.palette\.([\w-]+)', v)
    return m.group(1) if m else v

def num(v):
    v = v.strip()
    m = re.match(r'^(-?[\d.]+)(px|%)?$', v)
    if not m: return v
    n = m.group(1)
    if '.' in n: n = n.rstrip('0').rstrip('.')
    return n + ('%' if m.group(2) == '%' else '')

TYPE = {}
for g, g10, g11 in [('sizes','sizesI10','sizesI11'),('faces','facesI10','facesI11'),('tracking','trackingI10','trackingI11'),('leading','leadingI10','leadingI11')]:
    TYPE[g] = {
        9: merged([('tokens/type/type.elyx', g)]),
        10: merged([('tokens/type/type.elyx', g), ('tokens/type/type-i10.elyx', g10)]),
        11: merged([('tokens/type/type.elyx', g), ('tokens/type/type-i10.elyx', g10), ('tokens/type/type-i11.elyx', g11)]),
    }
SPACE = {}
for g, g10, g11 in [('layout','layoutI10','layoutI11'),('radii','radiiI10','radiiI11'),('controls','controlsI10','controlsI11')]:
    SPACE[g] = {
        9: merged([('tokens/space/space.elyx', g)]),
        10: merged([('tokens/space/space.elyx', g), ('tokens/space/space-i10.elyx', g10)]),
        11: merged([('tokens/space/space.elyx', g), ('tokens/space/space-i10.elyx', g10), ('tokens/space/space-i11.elyx', g11)]),
    }
SPACE['steps'] = {i: parse_groups('tokens/space/space.elyx')[0]['steps'] for i in (9,10,11)}

ROLES9 = parse_groups('tokens/color/roles.elyx')[0]['roles']
ROLES_SECTIONS = parse_groups('tokens/color/roles.elyx')[2]['roles']
ROLES10 = dict(ROLES9); ROLES10.update(parse_groups('tokens/color/roles-i10.elyx')[0]['rolesI10'])
SECNAMES = ['home','projects','music','thoughts','studio']
ROLES10_SEC = {}
SECTION = {}
base_sec = parse_groups('tokens/color/sections.elyx')[0]['section']
for s in SECNAMES:
    r = dict(ROLES10); r.update(parse_groups(f'tokens/color/roles-i10-{s}.elyx')[0][f'rolesI10{s.capitalize()}'])
    ROLES10_SEC[s] = r
    d = dict(base_sec); d.update(parse_groups(f'tokens/color/sections-{s}.elyx')[0][f'{s}Section'])
    SECTION[s] = d
SECTION[None] = base_sec
ROLES10_SEC[None] = ROLES10

PAL, _, PAL_SECTIONS = parse_groups('tokens/color/palette.elyx')
PAL = PAL['palette']; PAL_SECTIONS = PAL_SECTIONS['palette']

if __name__ == '__main__':
    print(len(ROLES9), len(ROLES10), len(PAL))
    for t, ms in ROLES_SECTIONS[:40]: print('R', t[:70], ms)
    for t, ms in PAL_SECTIONS: print('P', t[:70], ms)
    print(TYPE['sizes'][11]['display'], TYPE['faces'][10]['meta'], SPACE['radii'][11]['card'], SPACE['layout'][10].get('gutter-x'))
