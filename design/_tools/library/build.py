import json, os, sys
from collections import OrderedDict
from model import Spec, Swatch, Row, Sub, Board, ALIASES, q, USED, KINDS, use
import catalogue as C
from tokens import ROLES9, ROLES10_SEC, SECTION, pal_name, ROOT

COLW = 1520           # a board's width (32 padding each side)
GAP = 320             # between the iteration columns
P = COLW + GAP
FULLW = 3 * COLW + 2 * GAP
ROWW = COLW - 64      # a row's width inside a board

LAYOUT = {}
if os.path.exists('/Users/blaqat/dev/projects/blaqatdotnet/design/_tools/library/layout.json'):
    LAYOUT = json.load(open('/Users/blaqat/dev/projects/blaqatdotnet/design/_tools/library/layout.json'))

PROV = {'y': 0}


def pos(name):
    if name in LAYOUT:
        return LAYOUT[name]
    PROV['y'] += 100
    return [0, PROV['y']]


CTX = {9: 'base · no context', 10: 'i10=on', 11: 'i10=on, i11=on'}
TAG = {9: 'i9', 10: 'i10', 11: 'i11'}


def ind(lines, n=2):
    return [(' ' * n + l) if l else l for l in lines]


def decl_lines(s):
    """Split a multi-line declaration string into indented lines."""
    parts = s.split('\n')
    if len(parts) == 1:
        return parts
    out = [parts[0]]
    for p in parts[1:-1]:
        out.append('  ' + p)
    out.append(parts[-1])
    return out


# ---------------------------------------------------------------- override trees
class Node:
    def __init__(self):
        self.stmts = []
        self.kids = OrderedDict()
        self.with_ = None
        self.overrides = None

    def at(self, path):
        n = self
        for p in path:
            n = n.kids.setdefault(p, Node())
        return n


def emit_node(name, n, out, depth):
    pad = '  ' * depth
    if n.with_:
        out.append(pad + f'@with-variant({n.with_})')
    if not n.stmts and not n.kids and not n.overrides:
        out.append(pad + f'{name} {{}}')
        return
    out.append(pad + f'{name} {{')
    if n.overrides:
        out.append(pad + '  ' + n.overrides)
    for s in n.stmts:
        out.append(pad + '  ' + s)
    for k, c in n.kids.items():
        emit_node(k, c, out, depth + 1)
    out.append(pad + '}')


# ---------------------------------------------------------------- ids
class Ids:
    def __init__(self):
        self.seen = set()

    def get(self, base):
        b = base
        n = 2
        while b in self.seen:
            b = f'{base}{n}'
            n += 1
        self.seen.add(b)
        return b


def item_base(it):
    if isinstance(it, Spec):
        if it.ref:
            return it.ref.split('.')[1] + 'Spec'
        lab = it.label[9]
        w = ''.join(ch for ch in lab.title() if ch.isalnum())
        return (w[0].lower() + w[1:] if w else 'raw') + 'Spec'
    if isinstance(it, Swatch):
        w = ''.join(p.capitalize() for p in it.name.split('-'))
        return 'sw' + w
    return 'item'


# ---------------------------------------------------------------- emitters
def emit_spec(sp, sid):
    L = [f'{sid} = frame : doc.spec {{']
    if sp.width:
        L.append(f'  width: {sp.width}px,')
    if sp.note:
        L.append(f'  overrides: [insert({sid}Note, after = doc.spec.label)]')
    L.append(f'  label {{contents: {q(sp.label[9])}}}')
    if sp.slot:
        L.append(f'  slot {{overrides: [insert({sid}X)], {sp.slot}}}')
    else:
        L.append(f'  slot {{overrides: [insert({sid}X)]}}')
    if sp.note:
        L.append(f'  {sid}Note = text : doc.specNote {{contents: {q(sp.note[9])}}}')
    L += ind(decl_lines(sp.inner(sid + 'X')))
    L.append('}')
    return L


def emit_swatch(sw, sid):
    return [f'{sid} = frame : doc.specSwatch {{',
            f'  chip {{fill[0].color: {sw.token}}}',
            f'  name {{contents: {q(sw.name)}}}',
            f'  refName {{contents: {q(sw.ref[9])}}}',
            '}']


def emit_row(row, rid, ids, width):
    L = [f'{rid} = frame : doc.specRow {{']
    if row.column:
        L.append('  layout.stack.direction: .column,')
    else:
        L.append(f'  width: {width}px,')
        if row.wrap:
            L.append('  layout.stack.wrap: .true,')
            L.append(f'  layout.stack.line-gap: {row.line_gap}px,')
    L.append(f'  layout.stack.item-gap: {row.gap}px,')
    sids = []
    body = []
    for it in row.items:
        sid = ids.get(item_base(it))
        it.sid = sid
        sids.append(sid)
        body += (emit_spec(it, sid) if isinstance(it, Spec) else emit_swatch(it, sid))
    ins = [f'insert({sids[0]})'] + [f'insert({b}, after = {a})' for a, b in zip(sids, sids[1:])]
    L.append(f'  overrides: [{", ".join(ins)}]')
    L.append('')
    L += ind(body)
    L.append('}')
    return L


def emit_sub(sub, subid, ids, width):
    rids = []
    rows = []
    for k, r in enumerate(sub.rows):
        rid = ids.get(f'{subid}Row{k + 1}')
        r.rid = rid
        rids.append(rid)
        rows += emit_row(r, rid, ids, width)
    sub.subid = subid
    L = [f'{subid} = frame {{',
         '  layout: {stack: {direction: .column, item-gap: 16px}},',
         f'  children: [{subid}Head, {", ".join(rids)}],',
         '',
         f'  {subid}Head = frame {{',
         '    layout: {stack: {align-items: .center, item-gap: 14px}},',
         f'    children: [{subid}Name, {subid}Path],',
         '',
         f'    {subid}Name = text : doc.specSubheading {{contents: {q(sub.title)}}}',
         '',
         f'    {subid}Path = text : doc.specNote {{contents: {q(sub.path)}}}',
         '  }',
         '']
    L += ind(rows)
    L.append('}')
    return L


def board_head_lines(bid, num, title, intro, width=960):
    return [f'{bid}Head = frame {{',
            '  layout: {stack: {direction: .column, item-gap: 10px}},',
            f'  children: [{bid}Title, {bid}Intro],',
            '',
            f'  {bid}Title = text : doc.specHeading {{contents: {q(f"{num} · {title}")}}}',
            '',
            f'  {bid}Intro = text : doc.specIntro {{width: {width}px, contents: {q(intro)}}}',
            '}']


def emit_board_base(b, name, variants, width=ROWW, ctx_caption=None, ctx=None, extra_title=''):
    ids = Ids()
    ids.seen.add(name)
    subs = []
    subids = []
    for k, s in enumerate(b.subs):
        sid = ids.get(f'{b.bid}Sub{k + 1}')
        subids.append(sid)
        subs += emit_sub(s, sid, ids, width)
    head = f'{b.bid}Head'
    ins = [f'insert({head})'] + [f'insert({x}, after = {y})' for y, x in zip([head] + subids, subids)]
    x, y = pos(name)
    L = []
    if variants:
        L.append(f'@variants({", ".join(variants)})')
    if ctx:
        L.append(f'@context({ctx})')
    L += [f'{name} = frame : doc.docBoard {{',
          f'  title: {q(f"{b.num} · {b.title} · i9{extra_title}")},',
          f'  left: {x}px,',
          f'  top: {y}px,',
          '',
          '  boardHead {',
          '    boardTag {',
          '      iterName {contents: "i9"}',
          '    }',
          '',
          f'    boardCaption {{contents: {q(ctx_caption or f"{b.num} · {b.title} · {CTX[9]}")}}}',
          '  }',
          '',
          f'  body {{overrides: [{", ".join(ins)}]}}',
          '']
    L += ind(board_head_lines(b.bid, b.num, b.title, b.intro, 1100 if width <= ROWW else 1600))
    L.append('')
    L += ind(subs)
    L.append('}')
    return L


def iter_tree(b, i):
    """Override tree for the iteration-i board (relative to i-1's)."""
    prev = 9 if i == 10 else 10
    root = Node()
    for s in b.subs:
        for r in s.rows:
            for it in r.items:
                path = [s.subid, r.rid, it.sid]
                if isinstance(it, Spec):
                    if it.label[i] != it.label[prev]:
                        root.at(path + ['label']).stmts.append(f'contents: {q(it.label[i])}')
                    if it.note and it.note[i] != it.note[prev]:
                        root.at(path + [it.sid + 'Note']).stmts.append(f'contents: {q(it.note[i])}')
                    pick = it.i10 if i == 10 else it.i11
                    if pick:
                        root.at(path + ['slot', it.sid + 'X']).with_ = pick
                elif isinstance(it, Swatch):
                    if it.ref[i] != it.ref[prev]:
                        root.at(path + ['refName']).stmts.append(f'contents: {q(it.ref[i])}')
    return root


def emit_board_iter(b, name, src, i, variants, ctx, caption, extra_title='', extra_tree=None):
    tree = iter_tree(b, i) if extra_tree is None else extra_tree
    x, y = pos(name)
    L = []
    if variants:
        L.append(f'@variants({", ".join(variants)})')
    L.append(f'@context({ctx})')
    L += [f'{name} = frame : {src} {{',
          f'  title: {q(f"{b.num} · {b.title} · {TAG[i]}{extra_title}")},',
          f'  left: {x}px,',
          f'  top: {y}px,',
          '',
          '  boardHead {',
          '    boardTag {',
          f'      iterName {{contents: "{TAG[i]}"}}',
          '    }',
          '',
          f'    boardCaption {{contents: {q(caption)}}}',
          '  }']
    if tree.kids:
        L.append('')
        out = []
        emit_node('body', tree, out, 1)
        L += out
    L.append('}')
    return L


def emit_triple(b):
    L = emit_board_base(b, b.bid, [b.bid + 'I10'])
    L.append('')
    L += emit_board_iter(b, b.bid + 'I10', b.bid, 10, [b.bid + 'I11'], 'i10=on', f'{b.num} · {b.title} · {CTX[10]}')
    L.append('')
    L += emit_board_iter(b, b.bid + 'I11', b.bid + 'I10', 11, [], 'i10=on, i11=on', f'{b.num} · {b.title} · {CTX[11]}')
    return L


# ---------------------------------------------------------------- 1b section hues
HUE_SECTIONS = [  # (key, name, sheet, pill, menu)
    (None, 'Home', 'sht.sheet', 'spill.sectionsPill', 'pn.sectionsMenu'),
    ('projects', 'Projects', 'sht.sheetProjects', 'spill.sectionsPillProjects', 'pn.sectionsMenuProjects'),
    ('music', 'Music', 'sht.sheetMusic', 'spill.sectionsPillMusic', 'pn.sectionsMenuMusic'),
    ('thoughts', 'Thoughts', 'sht.sheetThoughts', 'spill.sectionsPillThoughts', 'pn.sectionsMenuThoughts'),
    ('studio', 'Studio', None, 'spill.sectionsPillStudio', 'pn.sectionsMenuStudio'),
]
HUE_SEC_TOKENS = ['sec', 'sec-deep', 'sec-soft']
HUE_ROLE_TOKENS = ['here-a', 'here-b', 'on-bg', 'on-fg', 'now', 'now-deep', 'now-soft', 'link-hover', 'deco', 'live',
                   'live-soft']


def hue_ref(tok, kind, sec, i):
    if kind == 'sec':
        return pal_name(SECTION[sec][tok])
    return pal_name((ROLES9 if i == 9 else ROLES10_SEC[sec])[tok])


HUE_INTRO = ('The axis section=home|projects|music|thoughts|studio dyes the cord frame (i9) and, from i10, the '
             'section-coloured roles: here (the nav’s rope), on (a toggle’s fill), now, link hover, deco. Live is '
             'Music’s purple on every page from i10. Each board renders in its section; under each swatch, the palette '
             'colour it resolves to there.')


def hue_board():
    swatches = [Swatch(f'sec.section.{t}', t, {}) for t in HUE_SEC_TOKENS] + \
               [Swatch(f'col.roles.{t}', t, {}) for t in HUE_ROLE_TOKENS]
    for sw in swatches:
        kind = 'sec' if sw.token.startswith('sec.') else 'role'
        sw.kind = kind
        sw.ref = {i: hue_ref(sw.name, kind, None, i) for i in (9, 10, 11)}
    ctxrow = [Spec('chips.chipOn', 'on'), Spec('snd.soundTagOn', 'on'), Spec('play.playBtnLive', 'live'),
              Spec('prose.proseH2', 'deco: the rule'), Spec('prose.proseItem', 'deco: the bullet'),
              Spec('spill.sectionsPill', 'the page’s pill'), Spec('pn.sectionsMenu', 'the menu: here')]
    navspec = Spec('nv.nav', 'the nav: the section’s tab is here')
    sheet = Spec('sht.sheet', 'the page: the cord frame + the nav')
    b = Board('hue', '1b', 'Section hues', HUE_INTRO,
              Sub('Section colours', 'tokens/color/sections*.elyx · roles-i10-<section>.elyx', Row(*swatches, gap=16)),
              Sub('In context', 'chip · sound-tag · play-button · prose · sections-pill · phone-nav',
                  Row(*ctxrow[:5]), Row(*ctxrow[5:])),
              Sub('The page: cord frame + nav', 'organisms/nav.elyx · organisms/sheet.elyx · organisms/studio-chrome.elyx',
                  Row(navspec, sheet, column=True, gap=24)))
    b.navspec = navspec
    for (key, nm, sh, pill, menu) in HUE_SECTIONS:
        use(pill)
        use(menu)
        if sh:
            use(sh)
    for r in ('sc.studioSheet', 'sc.studioSheetMusic', 'sc.studioSheetThoughts', 'nv.navProjects', 'nv.navMusic',
              'nv.navThoughts'):
        use(r)
    return b, swatches, ctxrow, sheet


def emit_hues():
    b, swatches, ctxrow, sheet = hue_board()
    names = {key: ('hue' + nm) for key, nm, *_ in HUE_SECTIONS}
    L = []
    base = 'hueHome'
    b.bid = 'hue'
    sec_variants = [names[k] for k, *_ in HUE_SECTIONS if k]
    b.title = 'Section hues · Home'
    L += emit_board_base(b, base, [base + 'I10'] + sec_variants,
                         ctx_caption='1b · Section hues · Home · no section (= Home)')
    b.title = 'Section hues'
    # Home's title inside the body
    L.append('')
    subs = b.subs
    sw_sub, ctx_sub, sheet_sub = subs
    pill_spec, menu_spec = ctxrow[5], ctxrow[6]
    navspec = b.navspec
    navs = {'projects': 'nv.navProjects', 'music': 'nv.navMusic', 'thoughts': 'nv.navThoughts'}

    def tree_for(key, i, prev_key, prev_i):
        root = Node()
        for sw in swatches:
            a = hue_ref(sw.name, sw.kind, key, i)
            p = hue_ref(sw.name, sw.kind, prev_key, prev_i)
            if a != p:
                root.at([sw_sub.subid, sw_sub.rows[0].rid, sw.sid, 'refName']).stmts.append(f'contents: {q(a)}')
        return root

    for key, nm, sh, pill, menu in HUE_SECTIONS:
        name = names[key]
        if key:
            # the section's i9 board: a variant of Home's
            root = tree_for(key, 9, None, 9)
            root.at([f'{b.bid}Head', f'{b.bid}Title']).stmts.append(f'contents: {q(f"1b · Section hues · {nm}")}')
            p = [ctx_sub.subid, ctx_sub.rows[1].rid]
            root.at(p + [pill_spec.sid, 'label']).stmts.append(f'contents: {q(pill.split(".")[1])}')
            root.at(p + [pill_spec.sid, 'slot', pill_spec.sid + 'X']).with_ = pill
            root.at(p + [menu_spec.sid, 'label']).stmts.append(f'contents: {q(menu.split(".")[1])}')
            root.at(p + [menu_spec.sid, 'slot', menu_spec.sid + 'X']).with_ = menu
            sp = [sheet_sub.subid, sheet_sub.rows[0].rid]
            extra = []
            if sh:
                root.at(sp + [navspec.sid, 'label']).stmts.append(f'contents: {q(navs[key].split(".")[1])}')
                root.at(sp + [navspec.sid, 'slot', navspec.sid + 'X']).with_ = navs[key]
                root.at(sp + [sheet.sid, 'label']).stmts.append(f'contents: {q(sh.split(".")[1])}')
                root.at(sp + [sheet.sid, 'slot', sheet.sid + 'X']).with_ = sh
            else:
                ids = ['stSheetSpec', 'stSheetMusicSpec', 'stSheetThoughtsSpec']
                refs = ['sc.studioSheet', 'sc.studioSheetMusic', 'sc.studioSheetThoughts']
                notes = ['the dashboard: the ink cord frame', 'an editor in Music', 'an editor in Thoughts']
                n = root.at(sp)
                hp = f'hueHome.{sheet_sub.subid}.{sheet_sub.rows[0].rid}'
                n.overrides = (f'overrides: [remove({hp}.{navspec.sid}), remove({hp}.{sheet.sid}), insert({ids[0]}), insert({ids[1]}, after = {ids[0]}), '
                               f'insert({ids[2]}, after = {ids[1]})]')
                for sid, ref, note in zip(ids, refs, notes):
                    extra += emit_spec(Spec(ref, note), sid)
            x, y = pos(name)
            L.append(f'@variants({name}I10)')
            L.append(f'@context(section={key})')
            L += [f'{name} = frame : {base} {{',
                  f'  title: {q(f"1b · Section hues · {nm} · i9")},',
                  f'  left: {x}px,',
                  f'  top: {y}px,',
                  '',
                  '  boardHead {',
                  f'    boardCaption {{contents: {q(f"1b · Section hues · {nm} · section={key}")}}}',
                  '  }',
                  '']
            out = []
            emit_node('body', root, out, 1)
            L += out
            if extra:
                L.append('')
                L += ind(extra)
            L.append('}')
            L.append('')
        # i10 + i11
        secctx = f', section={key}' if key else ''
        t10 = tree_for(key, 10, key, 9)
        L += emit_board_iter(b, name + 'I10', name, 10, [name + 'I11'], 'i10=on' + secctx,
                             f'1b · Section hues · {nm} · i10=on{secctx}', extra_title=f' · {nm}', extra_tree=t10)
        L.append('')
        t11 = tree_for(key, 11, key, 10)
        L += emit_board_iter(b, name + 'I11', name + 'I10', 11, [], 'i10=on, i11=on' + secctx,
                             f'1b · Section hues · {nm} · i10=on, i11=on{secctx}', extra_title=f' · {nm}', extra_tree=t11)
        L.append('')
    return L, names


# ---------------------------------------------------------------- header, bands, palette
INDEX = [
    ('Foundations', ['1 · Colour · palette', '1a · Colour roles', '1b · Section hues', '2 · Type scale', '2a · Spacing',
                     '2b · Insets + radii · control sizes', '2c · Faces', '3 · Textures + depth', '4 · The state ladder']),
    ('Components', ['5 · Buttons + link icons', '5b · Links', '6 · Chips + segmented', '7 · Tags',
                    '8 · Facts + card meta', '9 · Search + fields', '10 · Pills + year marks',
                    '11 · Toast · hint · empty state', '12 · Sound tag', '13 · Media', '14 · Disc · wave · folder',
                    '15 · Cards: projects + posts', '15b · Markdown blocks', '16 · Navigation']),
    ('Patterns', ['17 · Filters', '18 · Detail shell', '19 · Timeline + year groups', '20 · Player',
                  '21 · Floating layer (phone chrome)']),
    ('Studio', ['22 · Studio: chrome + dashboard', '23 · Studio: editors + preview']),
]

HEAD_LEAD = ('Every component of the Yarn design system and every state it has, on one page, in the order of the kit '
             '(redesign/v3-yarn-11/kit/COMPONENTS.md): Foundations, Components, Patterns, then Studio. Each section is '
             'three boards side by side, one per iteration: i9 (the base) | i10 | i11. Each board renders in its own '
             'iteration, so a specimen reads across its row from left to right.')
HEAD_HOW = [
    'The grey label over a specimen is its exported symbol; the line under it says what the state means (or, in '
    'Foundations, the token’s value in that iteration).',
    'Where a component has a structural iteration variant (…I10, …I11), the i10 / i11 columns show that variant and '
    'the label names it. Everything else changes through tokens alone.',
    'This page has no section: section-coloured roles show Home’s red. 1b shows each section’s hues, sheets, pills '
    'and menus in that section. Leave the canvas context empty when you view this page: every board sets its own.',
    'Components live in components/atoms, components/molecules and components/organisms (each heading names the '
    'file); tokens in tokens/; page sections in blocks/; screens in screens/ (one page per screen, every iteration '
    'on it). Conventions: SYSTEM.md.',
]


def emit_header():
    x, y = pos('libraryHead')
    L = ['libraryHead = frame {',
         '  title: "Yarn · component library",',
         f'  left: {x}px,',
         f'  top: {y}px,',
         f'  width: {FULLW}px,',
         '  layout: {stack: {direction: .column, item-gap: 24px}},',
         '  children: [headTitle, headLead, headCols, headHow, headIndex],',
         '',
         '  headTitle = text : doc.specHeading {contents: "Yarn · component library", font-size: 56}',
         '',
         f'  headLead = text : doc.specIntro {{width: 1500px, font-size: 17, contents: {q(HEAD_LEAD)}}}',
         '',
         '  headCols = frame {',
         f'    layout: {{stack: {{item-gap: {GAP}px}}}},',
         '    children: [colI9, colI10, colI11],']
    for i, nm in ((9, 'colI9'), (10, 'colI10'), (11, 'colI11')):
        desc = {9: 'i9 · the base: the i9 kit (no context)', 10: 'i10 · colour roles + the state ladder, six type roles (i10=on)',
                11: 'i11 · type + spacing rules, insets, nested radii (i10=on, i11=on)'}[i]
        L += ['',
              f'    {nm} = frame {{',
              f'      width: {COLW}px,',
              '      layout: {stack: {align-items: .center, item-gap: 12px}},',
              '      padding-top: 14px,',
              '      padding-bottom: 14px,',
              '      border: {color: pal.palette.ink, sides: [.top]},',
              f'      children: [{nm}Tag, {nm}Words],',
              '',
              f'      {nm}Tag = frame : doc.iterTag {{',
              f'        iterName {{contents: "{TAG[i]}"}}',
              '      }',
              '',
              f'      {nm}Words = text : doc.specLabel {{font-size: 15, contents: {q(desc)}}}',
              '    }']
    L += ['  }', '',
          '  headHow = frame {',
          '    layout: {stack: {direction: .column, item-gap: 6px}},',
          f'    children: [{", ".join(f"how{k + 1}" for k in range(len(HEAD_HOW)))}],']
    for k, h in enumerate(HEAD_HOW):
        L += ['', f'    how{k + 1} = text : doc.specIntro {{width: 1500px, font-size: 16, contents: {q(h)}}}']
    L += ['  }', '',
          '  headIndex = frame {',
          '    layout: {stack: {item-gap: 80px}},',
          '    padding-top: 8px,',
          f'    children: [{", ".join(f"index{g}" for g, _ in INDEX)}],']
    for g, items in INDEX:
        L += ['', f'    index{g} = frame {{',
              '      layout: {stack: {direction: .column, item-gap: 6px}},',
              f'      children: [index{g}Head, {", ".join(f"index{g}{k + 1}" for k in range(len(items)))}],',
              '',
              f'      index{g}Head = text : doc.specSubheading {{contents: {q(g)}}}']
        for k, s in enumerate(items):
            L += ['', f'      index{g}{k + 1} = text : doc.specLabel {{font-size: 16, contents: {q(s)}}}']
        L.append('    }')
    L += ['  }', '}']
    return L


BANDS = {
    'Foundations': 'Colour, type, spacing, insets and radii, faces, textures, and the state ladder every control '
                   'climbs. Values come from tokens/: the same token resolves differently in each column.',
    'Components': 'The parts every page shares: use them as they are; a page positions and lays them out, never '
                  'restyles them.',
    'Patterns': 'Parts composed into the recurring arrangements: filters, the detail shell, timelines, the player and '
                'the phones’ floating layer.',
    'Studio': 'The owner’s editor: the site’s own kit, on the ink cord frame.',
}


def emit_band(g):
    name = f'band{g}'
    x, y = pos(name)
    return [f'band{g} = frame : doc.groupBand {{',
            f'  title: {q(g)},',
            f'  left: {x}px,',
            f'  top: {y}px,',
            f'  width: {FULLW}px,',
            f'  bandTitle {{contents: {q(g)}}}',
            f'  bandNote {{width: 1600px, contents: {q(BANDS[g])}}}',
            '}']


def emit_palette():
    b = C.PALETTE_BOARD
    L = emit_board_base(b, 'palette', [], width=FULLW - 64, ctx_caption='1 · Colour · palette · the same in every iteration')
    # tag: all
    L = [l.replace('iterName {contents: "i9"}', 'iterName {contents: "i9 · i10 · i11"}') for l in L]
    L = [l.replace('title: "1 · Colour · palette · i9"', 'title: "1 · Colour · palette"') for l in L]
    return L


# ---------------------------------------------------------------- fallback
def add_fallbacks():
    """Any export the catalogue doesn't place yet (added since) goes into an
    'Also exported' sub of the board that already shows its file."""
    from model import ALIAS_FILE
    hue_board()  # registers the section variants it shows
    owner, last = {}, None
    for g in ['foundations', 'components', 'patterns', 'studio']:
        for bd in C.BOARDS[g]:
            last = bd
            for s in bd.subs:
                for r in s.rows:
                    for it in r.items:
                        if isinstance(it, Spec) and it.ref:
                            owner.setdefault(it.ref.split('.')[0], bd)
    allx = {(a, s) for a, ks in KINDS.items() for s in ks if a != 'doc'}
    missing = sorted(allx - USED)
    by = {}
    for a, s in missing:
        by.setdefault(a, []).append(s)
    for a, syms in by.items():
        bd = owner.get(a, last)
        bd.subs.append(Sub('Also exported', ALIAS_FILE[a].replace('components/', ''),
                           Row(*[Spec(f'{a}.{s}') for s in syms])))
    return missing


# ---------------------------------------------------------------- the file
def build():
    add_fallbacks()
    out = ['use "assets/fonts/Nunito[wght].ttf"',
           'use "assets/fonts/NunitoSans[YTLC,opsz,wdth,wght].ttf"',
           '']
    for a, f in ALIASES:
        out.append(f'import "{f}" as {a}')
    out += ['',
            '// The component library: every component and every state, in the kit\'s',
            '// order (redesign/v3-yarn-11/kit/COMPONENTS.md), in i9 | i10 | i11 columns.',
            '// Each section is a local board (i9, the base) with local contextual',
            '// variants (…I10 @context(i10=on), …I11 @context(i10=on, i11=on)): an',
            '// instance of an imported contextual variant would not keep its context.',
            '// A component\'s structural iteration variant is picked at its tree',
            '// position in the …I10 / …I11 board. 1b (hue*) adds the section axis.',
            '']
    out += emit_header() + ['']
    out += emit_band('Foundations') + ['']
    out += emit_palette() + ['']
    order = []
    for g in ['foundations', 'components', 'patterns', 'studio']:
        if g != 'foundations':
            out += emit_band(g.capitalize()) + ['']
        for k, b in enumerate(C.BOARDS[g]):
            out += emit_triple(b) + ['']
            if b.bid == 'roles':
                hl, names = emit_hues()
                out += hl
    return out


if __name__ == '__main__':
    lines = build()
    open(os.path.join(ROOT, 'library.elyx'), 'w').write('\n'.join(lines) + '\n')
    # coverage report
    allx = {(a, s) for a, ks in KINDS.items() for s in ks if a != 'doc'}
    missing = sorted(allx - USED)
    print('lines', len(lines), 'used', len(USED), 'exported', len(allx))
    print('NOT SHOWN:', missing)
