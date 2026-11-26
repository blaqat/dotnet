import re, os
from tokens import ROOT

ALIASES = [
    ('doc', 'components/atoms/doc.elyx'),
    ('pal', 'tokens/color/palette.elyx'),
    ('col', 'tokens/color/roles.elyx'),
    ('sec', 'tokens/color/sections.elyx'),
    ('typ', 'tokens/type/type.elyx'),
    ('spc', 'tokens/space/space.elyx'),
    ('txt', 'components/atoms/text.elyx'),
    ('artA', 'components/atoms/art.elyx'),
    ('eqb', 'components/atoms/eq-bars.elyx'),
    ('lg', 'components/atoms/logo.elyx'),
    ('surf', 'components/atoms/surface.elyx'),
    ('addb', 'components/molecules/add-button.elyx'),
    ('btn', 'components/molecules/button.elyx'),
    ('chips', 'components/molecules/chip.elyx'),
    ('fct', 'components/molecules/fact.elyx'),
    ('fb', 'components/molecules/feedback.elyx'),
    ('fld', 'components/molecules/field.elyx'),
    ('ftab', 'components/molecules/folder-tab.elyx'),
    ('kw', 'components/molecules/keyword.elyx'),
    ('ld', 'components/molecules/link-disc.elyx'),
    ('mt', 'components/molecules/media-thumb.elyx'),
    ('ntab', 'components/molecules/nav-tab.elyx'),
    ('play', 'components/molecules/play-button.elyx'),
    ('prose', 'components/molecules/prose.elyx'),
    ('srch', 'components/molecules/search.elyx'),
    ('sbtn', 'components/molecules/section-button.elyx'),
    ('spill', 'components/molecules/sections-pill.elyx'),
    ('segs', 'components/molecules/segmented.elyx'),
    ('snd', 'components/molecules/sound-tag.elyx'),
    ('stk', 'components/molecules/stack-badge.elyx'),
    ('tg', 'components/molecules/tag.elyx'),
    ('yp', 'components/molecules/year-pill.elyx'),
    ('artc', 'components/organisms/article.elyx'),
    ('dt', 'components/organisms/detail.elyx'),
    ('fc', 'components/organisms/folder-card.elyx'),
    ('hi', 'components/organisms/home-intro.elyx'),
    ('hl', 'components/organisms/home-links.elyx'),
    ('mtools', 'components/organisms/music-tools.elyx'),
    ('nv', 'components/organisms/nav.elyx'),
    ('ph', 'components/organisms/page-header.elyx'),
    ('pn', 'components/organisms/phone-nav.elyx'),
    ('pp', 'components/organisms/player-phone.elyx'),
    ('plr', 'components/organisms/player.elyx'),
    ('pc', 'components/organisms/post-card.elyx'),
    ('pd', 'components/organisms/project-detail.elyx'),
    ('ptools', 'components/organisms/project-tools.elyx'),
    ('prj', 'components/organisms/project.elyx'),
    ('rl', 'components/organisms/results-line.elyx'),
    ('sht', 'components/organisms/sheet.elyx'),
    ('sa', 'components/organisms/studio-article.elyx'),
    ('sc', 'components/organisms/studio-chrome.elyx'),
    ('sd', 'components/organisms/studio-dashboard.elyx'),
    ('se', 'components/organisms/studio-editor.elyx'),
    ('sparts', 'components/organisms/studio-parts.elyx'),
    ('sp', 'components/organisms/studio-preview.elyx'),
    ('tt', 'components/organisms/thoughts-tools.elyx'),
    ('tr', 'components/organisms/track-row.elyx'),
]
ALIAS_FILE = dict(ALIASES)

# exported symbol -> kind, per alias
KINDS = {}
for a, f in ALIASES:
    if not f.startswith('components/'):
        continue
    src = open(os.path.join(ROOT, f)).read()
    KINDS[a] = {m.group(1): m.group(2) for m in re.finditer(r'^export (\w+) = (frame|text|asset)\b', src, re.M)}


def kind_of(ref):
    a, s = ref.split('.')
    if s not in KINDS[a]:
        raise KeyError(f'{ref} is not exported')
    return KINDS[a][s]


def q(s):
    return '"' + s.replace('\\', '\\\\').replace('"', '\\"') + '"'


USED = set()  # (alias, symbol) shown on the page
SKIPPED = {}  # (alias, symbol) -> where it is shown instead / why


def use(ref):
    kind_of(ref)
    USED.add(tuple(ref.split('.')))


def fill_iter(v):
    if v is None:
        return None
    if not isinstance(v, dict):
        return {9: v, 10: v, 11: v}
    out, last = {}, None
    for i in (9, 10, 11):
        if v.get(i) is not None:
            last = v[i]
        out[i] = last
    return out


class Spec:
    """One labelled specimen (doc.spec): label, optional note, the thing.

    ref: 'alias.symbol' of an exported component (or decl= a raw declaration
    body such as 'frame {...}'). label / note: str or {9:, 10:, 11:} (missing
    keys inherit from the previous iteration). i10 / i11: the iteration
    variant ('alias.symbol') picked in that column; the label then names it.
    """

    def __init__(self, ref=None, note=None, i10=None, i11=None, label=None, decl=None, body='', uses=(), width=None,
                 auto=True, slot=''):
        if ref and auto:
            # pick the component's own iteration variants (…I10 / …I11) by name
            al, sy = ref.split('.')
            if i10 is None and sy + 'I10' in KINDS[al]:
                i10 = f'{al}.{sy}I10'
            if i11 is None and sy + 'I11' in KINDS[al]:
                i11 = f'{al}.{sy}I11'
        self.ref, self.i10, self.i11, self.decl, self.body = ref, i10, i11, decl, body
        self.width = width
        self.slot = slot
        for r in (ref, i10, i11, *uses):
            if r:
                use(r)
        sym = lambda r: r.split('.')[1]
        if isinstance(label, dict):
            self.label = fill_iter(label)
        else:
            base = label or sym(ref)
            lab = {9: base}
            if i10:
                lab[10] = sym(i10) if not label else f'{label} · {sym(i10)}'
            if i11:
                lab[11] = sym(i11) if not label else f'{label} · {sym(i11)}'
            self.label = fill_iter(lab)
        self.note = fill_iter(note)
        self.sid = None

    def inner(self, xid):
        if self.ref:
            body = self.body.strip()
            return f'{xid} = {kind_of(self.ref)} : {self.ref} {{{(" " + body + " ") if body else ""}}}'
        return f'{xid} = {self.decl}'


class Swatch:
    def __init__(self, token, name, ref):
        self.token, self.name, self.ref = token, name, fill_iter(ref)
        self.sid = None


class Row:
    def __init__(self, *items, wrap=True, gap=40, line_gap=32, column=False):
        self.items = list(items)
        self.wrap, self.gap, self.line_gap, self.column = wrap, gap, line_gap, column


class Sub:
    def __init__(self, title, path, *rows, note=None):
        self.title, self.path, self.rows, self.note = title, path, list(rows), note


class Board:
    def __init__(self, bid, num, title, intro, *subs):
        self.bid, self.num, self.title, self.intro, self.subs = bid, num, title, intro, list(subs)
