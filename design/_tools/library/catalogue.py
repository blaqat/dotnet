from model import Spec as S, Swatch, Row as R, Sub, Board, SKIPPED, use
from tokens import TYPE, SPACE, ROLES9, ROLES10, PAL, num, pal_name

W = 1456  # a board's content width
# a phone's screen behind the floating layer's states (they are transparent but for the chrome)
PHONE = 'fill: pal.palette.cotton-2, border: pal.palette.line, corner-radius: 36px'


def it(fn):
    return {i: fn(i) for i in (9, 10, 11)}


# ---------------------------------------------------------------- foundations
PAL_GROUPS = [
    ('Base', ['ink', 'ink-2', 'ink-3', 'cotton', 'cotton-2', 'cotton-3', 'white']),
    ('Red (i9 everywhere)', ['red', 'red-deep', 'red-soft', 'red-hi', 'tog-red']),
    ('Section hues', ['blue', 'blue-deep', 'blue-soft', 'purple', 'purple-deep', 'purple-soft', 'gold', 'gold-deep',
                      'gold-soft', 'brown', 'brown-deep', 'brown-soft', 'orange', 'orange-deep', 'thoughts-tint']),
    ('Content: project types', ['pt-personal', 'pt-personal-soft', 'pt-personal-deep', 'pt-work', 'pt-work-soft',
                                'pt-work-deep', 'pt-school', 'pt-school-soft', 'pt-school-deep']),
    ('Content: instruments', ['inst-piano', 'inst-piano-soft', 'inst-piano-deep', 'inst-beepbox', 'inst-beepbox-soft',
                              'inst-beepbox-deep', 'inst-daw', 'inst-daw-soft', 'inst-daw-deep']),
    ('Lines, stitches, shadows (ink at an alpha)', ['line', 'hairline', 'hairline-soft', 'stitch', 'stitch-soft',
                                                   'stitch-btn', 'stitch-on-fill', 'on-dark-stitch', 'shadow-1',
                                                   'shadow-lift', 'shadow-pop', 'purple-glow', 'underline',
                                                   'gold-stitch', 'scrim', 'clear']),
    ('Thoughts: notes + tape', ['note-canary', 'note-canary-fg', 'note-canary-fg-3', 'note-pink', 'note-pink-fg',
                               'note-pink-fg-3', 'note-mint', 'note-mint-fg', 'note-mint-fg-3', 'note-sky',
                               'note-sky-fg', 'note-sky-fg-3', 'note-edge', 'note-drop', 'note-chip', 'tape']),
    ('Thoughts: pick stubs + ranking tiers', ['stub-tan', 'stub-ink', 'stub-tan-seam', 'stub-seam', 'tier-s',
                                             'tier-a', 'tier-b', 'tier-c', 'tier-d', 'tier-teal', 'tier-lilac',
                                             'tray-red', 'tray-teal', 'tray-lilac', 'tray-ink']),
    ('Code block', ['code-bg', 'code-fg', 'code-dim', 'code-chip', 'code-dot', 'code-comment', 'code-key',
                    'code-type', 'code-str', 'code-fn']),
]

ROLE_GROUPS = [
    ('Surfaces + text', ['sheet', 'recess', 'surface', 'fg', 'fg-2', 'fg-3', 'chip', 'line', 'stitch', 'focus',
                         'fold', 'dark', 'dark-fg', 'scrim']),
    ('The state ladder: here · pick · on · live', ['here-a', 'here-b', 'pick-a', 'pick-b', 'on-bg', 'on-fg', 'live',
                                                  'live-deep', 'live-soft', 'live-fg', 'live-glow', 'live-card',
                                                  'live-rope-a', 'live-rope-b']),
    ('Actions: primary · act · added', ['primary-bg', 'primary-fg', 'act-bg', 'act-fg', 'act-line', 'act-current',
                                        'added', 'added-line', 'disc-line', 'current-fg', 'level']),
    ('Control chrome', ['ctl-line', 'ctl-stitch', 'ctl-stitch-fill', 'ctl-shadow', 'media-stitch']),
    ('Link discs + nav dots', ['linkdisc-bg', 'linkdisc-fg', 'linkdisc-line', 'linkdisc-shadow', 'dot-fg',
                               'dot-stitch', 'dot-rest', 'dot-rest-fg', 'dot-rest-stitch', 'here-music-a',
                               'here-music-b', 'here-thoughts-a', 'here-thoughts-b']),
    ('Brand · now · link · deco · bookmark', ['brand', 'now', 'now-deep', 'now-soft', 'link', 'link-hover', 'deco',
                                              'mark', 'mark-deep']),
    ('Status + facts', ['wip', 'wip-deep', 'fact-fg', 'fact-ic', 'fact-done', 'fact-paused', 'fact-dropped',
                        'fact-personal', 'fact-personal-ic', 'fact-work', 'fact-work-ic', 'fact-school',
                        'fact-school-ic']),
    ('On, per content (types, instruments)', ['on-personal', 'on-personal-ic', 'on-work', 'on-work-ic', 'on-school',
                                              'on-school-ic', 'on-piano', 'on-piano-ic', 'on-beepbox',
                                              'on-beepbox-ic', 'on-daw', 'on-daw-ic', 'on-inst-fg']),
    ('Fields + feedback', ['field-focus', 'field-halo', 'invalid', 'toast-ic']),
    ("Thoughts' cards", ['kick', 'kick-sep', 'coll-bg', 'coll-fg', 'coll-stitch', 'go-line']),
    ('Studio: publish state + quiet facts', ['pub-live-ic', 'pub-edits', 'pub-edits-ic', 'pub-draft', 'pub-draft-ic',
                                             'fact-chip', 'fact-chip-ic', 'fact-chip-line']),
]


def check_groups():
    p = [m for _, ms in PAL_GROUPS for m in ms]
    r = [m for _, ms in ROLE_GROUPS for m in ms]
    miss_p = set(PAL) - set(p)
    miss_r = set(ROLES9) - set(r)
    extra = (set(p) - set(PAL)) | (set(r) - set(ROLES9))
    return miss_p, miss_r, extra


def palette_subs():
    subs = []
    for title, members in PAL_GROUPS:
        sw = [Swatch(f'pal.palette.{m}', m, PAL[m]) for m in members]
        subs.append(Sub(title, 'tokens/color/palette.elyx', R(*sw, gap=16, line_gap=20)))
    return subs


def role_ref(m, i):
    return pal_name((ROLES9 if i == 9 else ROLES10)[m])


ROLES_BOARD = Board(
    'roles', '1a', 'Colour roles',
    'Every accent, text and surface colour in a component goes through a role (col.roles.*). Under each swatch: '
    'the palette colour it points at in this iteration. i9 is red everywhere; i10 re-points the roles (a colour is a '
    'word: here · pick · on · live); i11 keeps i10’s. This page has no section, so section-coloured roles show their '
    'red (Home) value; 1b shows them per section.',
    *[Sub(t, 'tokens/color/roles.elyx (+ roles-i10.elyx)',
          R(*[Swatch(f'col.roles.{m}', m, it(lambda i, m=m: role_ref(m, i))) for m in ms], gap=16, line_gap=20))
      for t, ms in ROLE_GROUPS],
    Sub('Section hues (sec.section.*: every page)', 'tokens/color/sections.elyx',
        R(*[Swatch(f'sec.section.{m}', m, it(lambda i, m=m: pal_name(__import__('tokens').SECTION[None][m])))
            for m in ['sec', 'sec-deep', 'sec-soft', 'hue-home', 'hue-projects', 'hue-music', 'hue-thoughts',
                      'hue-studio']], gap=16, line_gap=20)),
)

# ---- type
TYPE_ROLES = [
    # (atom, size key, role key for face / tracking / leading, sample)
    ('display', 'display', 'display', None),
    ('displayPhone', 'display-phone', 'display', None),
    ('heading', 'heading', 'heading', 'Heading · 2025'),
    ('title', 'title', 'title', 'glooming shadows of alphabet city'),
    ('titleCard', 'title-card', 'title', 'glooming shadows of alphabet city'),
    ('body', 'body', 'body', 'My personal website, built with Astro and Svelte.'),
    ('bodyCard', 'body-card', 'body', 'My personal website, built with Astro and Svelte.'),
    ('meta', 'meta', 'meta', 'Sep 2025 – now · 12 projects'),
    ('metaCard', 'meta-card', 'meta', 'Completed Aug 2025 · 4 tracks'),
    ('label', 'label', 'label', 'Shuffle all'),
    ('labelCard', 'label-card', 'label', 'Shuffle all'),
    ('micro', 'micro', 'micro', '01 SONG · TYPE'),
    ('num', 'num', 'num', '3:41 · 12 / 26'),
    ('numCard', 'num-card', 'num', '3:41 · 12 / 26'),
]


def pct(v):
    v = num(v)
    return v.replace('-', '−')


def type_note(size_key, role, i):
    s = TYPE['sizes'][i][size_key]
    f = TYPE['faces'][i][role].strip('"')
    st = TYPE['faces'][i][role + '-style'].strip('"')
    tr = pct(TYPE['tracking'][i].get(role, '0%'))
    ld = num(TYPE['leading'][i].get(role, '1'))
    return f'{num(s)} · {f} {st} · {tr} · line {ld}'


def type_rows():
    specs = {atom: S(f'txt.{atom}', note=it(lambda i, sk=sk, role=role: type_note(sk, role, i)),
                     body=(f'contents: "{sample}"' if sample else ''), width=640)
             for atom, sk, role, sample in TYPE_ROLES}
    pairs = [('display', 'displayPhone'), ('heading',), ('title', 'titleCard'), ('body', 'bodyCard'),
             ('meta', 'metaCard'), ('label', 'labelCard'), ('micro',), ('num', 'numCard')]
    return [R(*[specs[a] for a in p], wrap=False, gap=48) for p in pairs]


def type_specs():
    out = []
    for atom, sk, role, sample in TYPE_ROLES:
        body = f'contents: "{sample}"' if sample else ''
        out.append(S(f'txt.{atom}', note=it(lambda i, sk=sk, role=role: type_note(sk, role, i)), body=body))
    return out


ROLE_SIZE_KEYS = {'display', 'display-phone', 'heading', 'heading-phone', 'title', 'title-card', 'body', 'body-card',
                  'meta', 'meta-card', 'label', 'label-card', 'micro', 'num', 'num-card'}


def part_size_specs():
    out = []
    for k in TYPE['sizes'][9]:
        if k in ROLE_SIZE_KEYS:
            continue
        decl = ('text {contents: "Aa 123", fill: pal.palette.ink, font-size: typ.sizes.%s, '
                'font-family: "Nunito Sans", font-style: "SemiBold", line-height: 1.2}' % k)
        out.append(S(decl=decl, label=f'sizes.{k}', note=it(lambda i, k=k: num(TYPE['sizes'][i][k]))))
    return out


TYPE_BOARD = Board(
    'typeScale', '2', 'Type scale',
    'The type roles (components/atoms/text.elyx), each at its size in this iteration: size · face · tracking · '
    'line height. A -Card role is the same role inside a card or row (i11 rule 5: 1px smaller there). Components '
    'never set a size: they use a role or a part size below.',
    Sub('Roles (txt.*): on the page | in a card or row', 'components/atoms/text.elyx · tokens/type/type.elyx', *type_rows()),
    Sub('Part sizes (typ.sizes.*): parts whose i9 size is not a role’s; from i10 most read a role’s size',
        'tokens/type/type.elyx (+ type-i10, type-i11)', R(*part_size_specs(), gap=28, line_gap=24)),
)

FACE_PAIRS = [('display', 'display-style'), ('heading', 'heading-style'), ('title', 'title-style'),
              ('body', 'body-style'), ('body', 'body-bold'), ('meta', 'meta-style'), ('label', 'label-style'),
              ('micro', 'micro-style'), ('num', 'num-style'), ('code', 'code-style'), ('fact', 'fact-style'),
              ('tip', 'tip-style'), ('kick-x', 'kick-x-style'), ('tag-btn', 'tag-btn-style'), ('lead', 'lead-style'),
              ('lead', 'lead-bold'), ('tagline', 'tagline-style'), ('article-dek', 'article-dek-style')]


def face_specs():
    out = []
    for fam, sty in FACE_PAIRS:
        decl = ('text {contents: "Aa Gg 0123 · the yarn", fill: pal.palette.ink, font-size: 18, '
                'font-family: typ.faces.%s, font-style: typ.faces.%s, line-height: 1.3}' % (fam, sty))
        out.append(S(decl=decl, label=f'faces.{fam} · {sty}',
                     note=it(lambda i, fam=fam, sty=sty: f"{TYPE['faces'][i][fam].strip(chr(34))} "
                                                         f"{TYPE['faces'][i][sty].strip(chr(34))}")))
    return out


FACES_BOARD = Board(
    'faces', '2c', 'Faces',
    'Two families: Nunito for headings and labels, Nunito Sans for everything else (from i10). Each specimen is set '
    'in the face token it names, as this iteration resolves it. Maple Mono (i9’s Meta and Numeric) is not bundled '
    'with the project, so it renders in a fallback face here.',
    Sub('Faces (typ.faces.*)', 'tokens/type/type.elyx (+ type-i10, type-i11)', R(*face_specs(), gap=40, line_gap=28)),
)

# ---- spacing, insets, radii, controls
LAYOUT_KEYS = ['page-x', 'page-x-phone', 'frame', 'frame-phone', 'section-gap', 'section-gap-phone', 'gutter-x',
               'gutter-y', 'gutter-phone', 'group-gap', 'results-gap', 'nav-top', 'nav-bottom', 'nav-gap', 'page-top',
               'page-bottom', 'inset-x', 'inset-y', 'inset-phone', 'folder-inset', 'row-inset-x', 'row-inset-y',
               'pop-inset', 'field-inset', 'sheet-inset', 'panel-inset', 'pane-inset', 'stack-tight', 'stack',
               'stack-loose', 'stitch-in', 'stitch-in-ctl', 'btn-x', 'btn-sm-x', 'btn-gap', 'chip-x', 'chip-gap',
               'pill-x', 'pill-y', 'field-x', 'fact-gap', 'post-gutter', 'player-inset']


def sp_note(group, k):
    return it(lambda i: num(SPACE[group][i][k]))


def step_specs():
    out = []
    for k, v in SPACE['steps'][9].items():
        out.append(S(decl=f'frame {{width: spc.steps.{k}, height: spc.steps.{k}, fill: pal.palette.ink, '
                          f'corner-radius: 2px}}', label=f'steps.{k}', note=num(v)))
    return out


def layout_specs():
    out = []
    for k in LAYOUT_KEYS:
        if k not in SPACE['layout'][9]:
            continue
        out.append(S(decl=f'frame {{width: spc.layout.{k}, height: 12px, fill: pal.palette.ink-2, '
                          f'corner-radius: 2px}}', label=f'layout.{k}', note=sp_note('layout', k)))
    return out


def radius_specs():
    out = []
    for k in SPACE['radii'][9]:
        out.append(S(decl=f'frame {{width: 64px, height: 64px, fill: pal.palette.cotton-2, border: pal.palette.line, '
                          f'corner-radius: spc.radii.{k}}}', label=f'radii.{k}', note=sp_note('radii', k)))
    return out


CONTROL_KEYS = ['btn', 'btn-sm', 'btn-d', 'chip', 'chip-sm', 'field', 'field-sm', 'play', 'play-sm', 'disc', 'add',
                'tag', 'token', 'seg', 'kbd', 'clear', 'opt', 'tab', 'nav-h', 'mark', 'art', 'art-sm', 'fact',
                'fact-wip', 'icon', 'icon-sm', 'btn-icon', 'play-icon', 'dot-icon', 'linkdisc-icon']


def control_specs():
    out = []
    for k in CONTROL_KEYS:
        if k not in SPACE['controls'][9]:
            continue
        out.append(S(decl=f'frame {{width: spc.controls.{k}, height: spc.controls.{k}, fill: pal.palette.cotton-2, '
                          f'border: pal.palette.line, corner-radius: 4px}}', label=f'controls.{k}',
                     note=sp_note('controls', k)))
    return out


def nested(name, outer_r, inset_x, inset_y, inner_r, inner_w, inner_h, fill_inner='pal.palette.cotton-2'):
    """A surface holding its content one inset in: outer radius, the inset, the inner radius."""
    L = SPACE['layout']
    Rr = SPACE['radii']
    note = it(lambda i: f'radius {num(Rr[i][outer_r])} · inset {num(L[i][inset_y])} / {num(L[i][inset_x])} · '
                        f'inner {num(Rr[i][inner_r])}')
    decl = (f'frame {{layout: {{stack: {{}}}}, fill: pal.palette.white, border: pal.palette.line, '
            f'corner-radius: spc.radii.{outer_r}, padding-top: spc.layout.{inset_y}, '
            f'padding-bottom: spc.layout.{inset_y}, padding-left: spc.layout.{inset_x}, '
            f'padding-right: spc.layout.{inset_x}, children: [{name}In]\n'
            f'{name}In = frame {{width: {inner_w}px, height: {inner_h}px, fill: {fill_inner}, '
            f'corner-radius: spc.radii.{inner_r}}}\n}}')
    return S(decl=decl, label=f'{name}: radii.{outer_r} · {inset_y} / {inset_x} · radii.{inner_r}', note=note)


SPACE_BOARD = Board(
    'spacing', '2a', 'Spacing',
    'The step scale is fixed (4 · 8 · 12 · 16 · 24 · 32 · 48 · 64). Layout tokens set the page, the gutters, the '
    'insets and the gaps inside a section; each bar is the token’s length in this iteration. Only the shared ones '
    'are here: tokens/space/space.elyx has every part’s own.',
    Sub('Steps (spc.steps.*)', 'tokens/space/space.elyx', R(*step_specs(), gap=40)),
    Sub('Layout (spc.layout.*)', 'tokens/space/space.elyx (+ space-i10, space-i11)', R(*layout_specs(), gap=36, line_gap=24)),
)

RADII_BOARD = Board(
    'radii', '2b', 'Insets + radii · control sizes',
    'i11 rule 13: a surface holds its content the same distance from all four edges, and a surface nested in '
    'another has radius = outer radius − the inset between them (min 4). Circles and pills are exempt. Below: '
    'surfaces with their content one inset in, every radius token, then the control sizes.',
    Sub('Insets: a surface and what sits inside it', 'tokens/space/space.elyx',
        R(nested('card', 'card', 'inset-x', 'inset-y', 'folder-art', 64, 64),
          nested('row', 'row', 'row-inset-x', 'row-inset-y', 'trk-art', 40, 40),
          nested('popover', 'pop', 'pop-inset', 'pop-inset', 'opt', 160, 40),
          nested('field', 'field', 'field-inset', 'field-inset', 'inner', 120, 40),
          nested('panel', 'panel', 'panel-inset', 'panel-inset', 'inner', 120, 64), gap=48)),
    Sub('Radii (spc.radii.*)', 'tokens/space/space.elyx (+ space-i10, space-i11)', R(*radius_specs(), gap=32, line_gap=24)),
    Sub('Control sizes (spc.controls.*)', 'tokens/space/space.elyx (+ space-i10, space-i11)',
        R(*control_specs(), gap=32, line_gap=24)),
)


def shadow_box(name, color, y, blur):
    return S(decl=f'frame {{width: 120px, height: 64px, fill: pal.palette.white, corner-radius: 16px, '
                  f'shadow: [{{drop-shadow: {{color: pal.palette.{color}, offset: point(0px, {y}px), '
                  f'blur-radius: {blur}px}}}}]}}', label=name, note=f'pal.palette.{color}')


TEXTURE_BOARD = Board(
    'textures', '3', 'Textures + depth',
    'Every surface is cloth. Cards and fields are knit on white with a dashed stitch inside (i9); the rope marks a '
    'single choice; discs are felt. Three shadows: at rest, lifted (hover), popover. The cord frame round the page is '
    'in 1b (the sheet, per section).',
    Sub('Surfaces', 'components/atoms/surface.elyx',
        R(S('surf.patch', 'a card at rest'), S('surf.patchLifted', 'hover: lifts 2px'),
          S('surf.stitch', 'the dashed stitch'), S('surf.rope', 'pick: the rope'), S('surf.ropeHere', 'here: the nav’s rope'),
          S('surf.disc', 'a felt disc'), S('surf.focusRing', 'focus (keys): the thread ring'))),
    Sub('Shadows', 'tokens/color/palette.elyx',
        R(shadow_box('shadow-1 · at rest', 'shadow-1', 2, 6), shadow_box('shadow-lift · hover', 'shadow-lift', 6, 16),
          shadow_box('shadow-pop · popovers', 'shadow-pop', 10, 28), gap=48)),
)

STATES_BOARD = Board(
    'states', '4', 'The state ladder (interaction rules)',
    'One ladder for every control: rest (neutral) → pick (the rope, a single choice) → on (a toggle’s fill) → live '
    '(playing). Hover lifts; the one primary per view is red in i9 and ink from i10. The same parts in context: '
    'a list row, a card, a segment.',
    Sub('Chips: rest → pick → on', 'components/molecules/chip.elyx',
        R(S('chips.chip', 'rest'), S('chips.chipPicked', 'pick: the rope'), S('chips.chipOn', 'on: the fill'))),
    Sub('▶: act → current → live', 'components/molecules/play-button.elyx',
        R(S('play.playBtn', 'act: at rest'), S('play.playBtnCurrent', 'current: loaded, paused'),
          S('play.playBtnLive', 'live: playing'), S('btn.btnPrimary', 'primary: one per view'))),
    Sub('Rows, cards, segments: rest → hover / picked', 'surface · project · segmented',
        R(S('prj.projectRow', 'row at rest'), S('prj.projectRowPicked', 'row picked: the rope'),
          S('segs.segBtn', 'segment at rest'), S('segs.segBtnPicked', 'segment picked'))),
)

# ---------------------------------------------------------------- components
LINK_KINDS = ['', 'Soundcloud', 'Beepbox', 'Youtube', 'Github', 'External', 'Writeup', 'Discord']
LINK_NOTES = {'': 'any link', 'Soundcloud': 'SoundCloud', 'Beepbox': 'BeepBox', 'Youtube': 'YouTube',
              'Github': 'GitHub', 'External': 'no brand: the arrow', 'Writeup': 'a write-up', 'Discord': 'Discord'}

BUTTONS_BOARD = Board(
    'buttons', '5', 'Buttons + link icons',
    'Every control reaches 44 on touch. Rest is the control at rest (i9 white knit with a stitch inside; i10 calm: '
    'a 1px ring); primary is the one primary per view; live is playing. ▶ never changes shape or size with its state.',
    Sub('Buttons: rest · hover · focus · disabled', 'components/molecules/button.elyx',
        R(S('btn.btn', 'rest'), S('btn.btnHover', 'hover: lifts'), S('btn.btnFocus', 'focus (keys): the ring'),
          S('btn.btnDisabled', 'disabled: flat, quiet')),
        R(S('btn.btnPrimary', 'primary: one per view'), S('btn.btnPrimaryHover', 'primary · hover'),
          S('btn.btnPrimaryFocus', 'primary · focus'), S('btn.btnPrimaryDisabled', 'primary · disabled'))),
    Sub('Buttons: kinds + sizes', 'components/molecules/button.elyx',
        R(S('btn.btnLive', 'live: playing'), S('btn.btnGhost', 'ghost: stitch / ring only'),
          S('btn.btnGhostSm', 'ghost, small (36)'), S('btn.btnSm', 'small (36)'), S('btn.btnIcon', 'icon only (44)'),
          S('btn.btnIconSm', 'icon only, small (36)'), S('btn.btnD', 'link button (40)'))),
    Sub('Play button: round', 'components/molecules/play-button.elyx',
        R(S('play.playBtn', 'rest (act)'), S('play.playBtnCurrent', 'current: loaded, paused'),
          S('play.playBtnLive', 'live: playing, the bars'), S('play.playBtnLivePause', 'live, showing pause'),
          S('play.playBtnSm', 'small (36)'), S('play.playBtnSmCurrent', 'small · current'),
          S('play.playBtnSmLive', 'small · live'))),
    Sub('Play button: labelled', 'components/molecules/play-button.elyx',
        R(S('play.playBtnLabel', 'labelled, at rest (act)'), S('play.playBtnLabelSm', 'labelled, small'),
          S('play.playBtnPrimary', 'primary: Play all'), S('play.playBtnPrimaryLive', 'primary while it plays'))),
    Sub('Add to queue (+)', 'components/molecules/add-button.elyx',
        R(S('addb.addBtn', '+ at rest'), S('addb.addBtnAdded', 'added: in the queue'))),
    Sub("Section buttons (Home's nav)", 'components/molecules/section-button.elyx',
        R(S('sbtn.secBtn', 'Projects'), S('sbtn.secBtnMusic', 'Music'), S('sbtn.secBtnThoughts', 'Thoughts'))),
)

LINKS_BOARD = Board(
    'links', '5b', 'Links',
    'Any link: a recognised site becomes its disc (i9 a white disc, the bold glyph; i10 R7 the one cotton-2 disc, '
    'the duotone glyph). In the i10 and i11 columns each disc is its …I10 variant. Inline links use the link role.',
    Sub('Link discs: rest · hover · focus', 'components/molecules/link-disc.elyx',
        R(S('ld.linkDisc', 'rest'), S('ld.linkDiscHover', 'hover: lifts, fills ink'),
          S('ld.linkDiscFocus', 'focus (keys): the ring'))),
    Sub('Link discs: every kind', 'components/molecules/link-disc.elyx',
        R(*[S(f'ld.linkDisc{k}', LINK_NOTES[k]) for k in LINK_KINDS[1:]])),
    Sub('Write-up link + go link', 'organisms/project.elyx · organisms/post-card.elyx',
        R(S('prj.writeup', 'a project’s write-up link', i10='prj.writeupI10'), S('prj.writeupMark', 'a row’s mark'),
          S('pc.postGo', 'a go-link: link role + →'))),
    Sub("Keywords (Home's bio)", 'components/molecules/keyword.elyx',
        R(S('kw.keyword', 'to Projects: blue'), S('kw.keywordMusic', 'to Music: purple'),
          S('kw.keywordRit', 'an outside link: orange'))),
)

CHIPS_BOARD = Board(
    'chipsLib', '6', 'Chips + segmented',
    'A chip toggles (on: i9 the red fill; i10 the section’s soft tint, deep words) or picks (the rope). Content '
    'chips (instruments, project types) wear their own colour when on. A segmented control is one choice in a '
    'recessed track.',
    Sub('Chips', 'components/molecules/chip.elyx',
        R(S('chips.chip', 'rest'), S('chips.chipHover', 'hover: lifts'), S('chips.chipFocus', 'focus (keys): the ring'),
          S('chips.chipOn', 'on: the fill'), S('chips.chipOnHover', 'on + hover: the strike'),
          S('chips.chipPicked', 'pick: the rope'), S('chips.chipDisabled', 'disabled: finds nothing')),
        R(S('chips.chipSm', 'small (32)'), S('chips.chipCount', 'with a count'), S('chips.chipAll', 'All, rest'),
          S('chips.chipAllOn', 'All on: nothing filtered'))),
    Sub('Instrument chips (Music)', 'components/molecules/chip.elyx',
        R(*[S(f'chips.chip{k}{s}', 'on' if s else 'rest') for k in ['Piano', 'Beepbox', 'Daw'] for s in ['', 'On']])),
    Sub('Project-type chips (Projects)', 'components/molecules/chip.elyx',
        R(*[S(f'chips.chip{k}{s}', 'on' if s else 'rest') for k in ['Personal', 'Work', 'School'] for s in ['', 'On']])),
    Sub('Segmented', 'components/molecules/segmented.elyx',
        R(S('segs.segBtn', 'a segment at rest'), S('segs.segBtnHover', 'hover: half-white'),
          S('segs.segBtnFocus', 'focus (keys): the ring'), S('segs.segBtnPicked', 'picked: white patch + rope')),
        R(S('segs.seg', 'the view switch'), S('segs.segSort', 'a sort (Studio)'))),
)

TAGS_BOARD = Board(
    'tags', '7', 'Tags',
    'A tag is woven into a card or row: quiet words at rest; a match (an active filter, a typed hit, a pressed tag) '
    'wears the in-card match chip. A card shows three and folds the rest into +n.',
    Sub('Tags', 'components/molecules/tag.elyx',
        R(S('tg.tag', 'rest'), S('tg.tagHover', 'hover: the match chip'), S('tg.tagFocus', 'focus (keys): the ring'),
          S('tg.tagMatch', 'a match (pressed)'), S('tg.tagMatchHover', 'pressed + hover: the strike')),
        R(S('tg.tagMore', 'the rest: +n'), S('tg.tagPress', 'pressable (topics)'), S('tg.tagStack', 'a stack tag'),
          S('tg.tagStackMatch', 'stack tag, match'))),
    Sub('Rows of tags', 'components/molecules/tag.elyx · organisms/post-card.elyx',
        R(S('tg.tagRow', 'a card’s tags (max 3)'), S('tg.tagStackRow', 'a project’s stack'),
          S('pc.postTags', 'a post’s tags (pressable)'))),
    Sub("Stack badges (Home's bio)", 'components/molecules/stack-badge.elyx',
        R(S('stk.stackBadge', 'Java'), S('stk.stackBadgePython', 'Python'), S('stk.stackBadgeRust', 'Rust'),
          S('stk.stackBadgeSm', 'phones: the logo alone'))),
)

FACTS_BOARD = Board(
    'facts', '8', 'Facts + card meta',
    'A fact is a glyph and its words (i9: a felt disc per status; i10 L3: a bare glyph in ink-3). WIP keeps its gold '
    'disc in every iteration. A match grows the in-card chip out of the glyph.',
    Sub('Status', 'components/molecules/fact.elyx',
        R(S('fct.fact', 'complete'), S('fct.factWip', 'WIP: gold, always'), S('fct.factPaused', 'paused'),
          S('fct.factDropped', 'dropped'), S('fct.factMatch', 'matched: the in-card chip'))),
    Sub('Project type', 'components/molecules/fact.elyx',
        R(S('fct.factPersonal', 'personal'), S('fct.factWork', 'work'), S('fct.factSchool', 'school'))),
    Sub('Publish state (Studio) + quiet facts', 'components/molecules/fact.elyx',
        R(S('fct.factLive', 'live: sewn on'), S('fct.factEdits', 'edits: pinned on'), S('fct.factDraft', 'draft: basted'),
          S('fct.factChip', 'a quiet fact (a date, saved)'))),
    Sub("A post's kicker", 'organisms/post-card.elyx', R(S('pc.postKicker', 'type · read time · date'))),
)

SEARCH_BOARD = Board(
    'search', '9', 'Search + fields',
    'The search line is full width: a known term becomes a token (an on chip); with a value the / key gives way to '
    'the clear button. Focus is a solid edge and a halo (i9 red; i10 ink).',
    Sub('Search', 'components/molecules/search.elyx',
        R(S('srch.search', 'rest: placeholder + / key'), S('srch.searchFilled', 'tokens + typed words'),
          S('srch.searchFocus', 'focus: solid edge + halo'), column=True, gap=24)),
    Sub('Suggestions', 'components/molecules/search.elyx',
        R(S('srch.searchOpt', 'the chosen option'), S('srch.searchOptRest', 'an option at rest'),
          S('srch.searchPop', 'the popover'))),
    Sub('Fields', 'components/molecules/field.elyx',
        R(S('fld.field', 'a value'), S('fld.fieldPlaceholder', 'empty: placeholder'), S('fld.fieldFocus', 'focus'),
          S('fld.fieldInvalid', 'invalid'), S('fld.fieldDisabled', 'disabled'), S('fld.fieldSm', 'the small finder (40)'),
          S('fld.fieldSelect', 'a select'), S('fld.fieldArea', 'a textarea'))),
)

PILLS_BOARD = Board(
    'pills', '10', 'Pills + year marks',
    'The year pill is the one separator (timelines, year groups, months): i9 Nunito 850; i10 Title; i11 a section '
    'heading. A year group’s header is the pill and a dashed rule across its column.',
    Sub('Year pill', 'components/molecules/year-pill.elyx',
        R(S('yp.yearPill', 'a year + its count'), S('yp.yearPillSm', 'small: a day in a timeline'),
          S('yp.yearHeader', 'a year group’s header (ruled)'))),
)

FEEDBACK_BOARD = Board(
    'feedback', '11', 'Toast · hint · empty state',
    'Feedback on the floating layer and in place of a list. The toast is ink with a quiet stitch (its glyph red-hi in '
    'i9, white from i10); the hint names an icon-only control; the empty state stands where the list would be.',
    Sub('Toast', 'components/molecules/feedback.elyx',
        R(S('fb.toast', 'with Undo'), S('fb.toastAction', 'with an action'), S('fb.toastPlain', 'plain'))),
    Sub('Hints + keys', 'components/molecules/feedback.elyx',
        R(S('fb.hint', 'a word + a key'), S('fb.tip', 'an icon’s name (hover)'), S('fb.kbd', 'a key'),
          S('fb.kbdIcon', 'a key: a glyph'), S('fb.kbdDark', 'the chosen suggestion’s key'))),
    Sub('Empty state', 'components/molecules/feedback.elyx',
        R(S('fb.empty', 'a line + an action'), S('fb.emptyText', 'a line, a quiet line, an action'),
          S('fb.emptyQuiet', 'a line + a quiet line'))),
)

SOUND_BOARD = Board(
    'sound', '12', 'Sound tag',
    'A woven care label sewn into the sheet’s top edge. Off: white cloth, the speaker-slash; on: the on role.',
    Sub('Sound tag', 'components/molecules/sound-tag.elyx',
        R(S('snd.soundTag', 'off'), S('snd.soundTagOn', 'on: the on role'))),
)

MEDIA_BOARD = Board(
    'media', '13', 'Media',
    'Covers are content (each release’s own yarn). A project’s media is one part wherever it shows: the card’s, the '
    'row’s thumb, the item page’s strip; a video with no still is the felt.',
    Sub('Art (covers)', 'components/atoms/art.elyx',
        R(S('artA.art', 'the art'), S('artA.artSm', 'grid size (54)'), S('artA.artRevealed', 'Revealed'),
          S('artA.artAikisu', 'aikisu’s shorts'), S('artA.artPeppy', 'peppy snowday'),
          S('artA.artFarewell', 'farewell my star'), S('artA.artGleaming', 'gleaming shadows'),
          S('artA.artGlooming', 'glooming shadows'))),
    Sub('Media thumbs', 'components/molecules/media-thumb.elyx',
        R(S('mt.mediaThumb', 'a screenshot'), S('mt.mediaThumbFelt', 'a video with no still: felt'),
          S('mt.mediaThumbMissing', 'a video that can’t play'), S('mt.mediaThumbMono', 'no media: initials'))),
    Sub('The media strip (an opened item)', 'organisms/detail.elyx', R(S('dt.detailMedia', 'MEDIA + count, the thumbs'))),
)

EQ_LIVE = ('frame {layout: {stack: {}}, padding: 12px, corner-radius: 999px, fill: col.roles.live, '
           'children: [eqLiveBars]\neqLiveBars = frame : eqb.eqBarsOnLive {}\n}')

FOLDER_BOARD = Board(
    'folder', '14', 'Disc · wave · folder',
    'Music’s parts. A collection’s tabs hang above its folder card; the chosen song’s tab stands up (current), and '
    'takes the live fill while it plays. From i10 the playing card takes the live tint. i10 / i11 columns show the '
    'cards’ and rows’ iteration variants.',
    Sub('Equalizer', 'components/atoms/eq-bars.elyx',
        R(S('eqb.eqBars', 'playing'), S('eqb.eqBarsIdle', 'idle: resting low'),
          S(decl=EQ_LIVE, label='eqBarsOnLive', note='inside ▶ (white, on live)', uses=['eqb.eqBarsOnLive']))),
    Sub('Folder tabs', 'components/molecules/folder-tab.elyx',
        R(S('ftab.folderTab', 'rest'), S('ftab.folderTabHover', 'hover: it rises'),
          S('ftab.folderTabCurrent', 'current: stands up'), S('ftab.folderTabLive', 'live: the fill')),
        R(S('ftab.folderTabs', 'a collection’s strip'), S('ftab.folderTabsCurrent', 'song 02 current'),
          S('ftab.folderTabsLive', 'song 02 playing'))),
    Sub('Folder card', 'organisms/folder-card.elyx',
        R(S('fc.folderCard', 'rest', i10='fc.folderCardI10'),
          S('fc.folderCardCurrent', 'current: loaded, paused', i10='fc.folderCardCurrentI10'),
          S('fc.folderCardLive', 'live: playing', i10='fc.folderCardLiveI10', i11='fc.folderCardLiveI11'),
          S('fc.folderCardSingle', 'a single: no tabs'))),
    Sub('Track rows', 'organisms/track-row.elyx',
        R(S('tr.trackRow', 'rest'), S('tr.trackRowHover', 'hover: ▶ on the art'), S('tr.trackRowLive', 'live: playing'),
          column=True, gap=24)),
)

CARDS_BOARD = Board(
    'cards', '15', 'Cards: projects + posts',
    'A project is one component shown as a card or a row. Thoughts’ posts are cards of their own kind (an article '
    'with its bookmark, a scratch on a sticky note, a pick on its yarn, a playlist, images, a ranking).',
    Sub('Project', 'organisms/project.elyx',
        R(S('prj.project', 'card', i10='prj.projectI10'), S('prj.projectText', 'card, no media', i10='prj.projectTextI10')),
        R(S('prj.projectRow', 'row (the timeline)'), S('prj.projectRowPicked', 'row, picked: the rope'))),
    Sub('Post parts', 'organisms/post-card.elyx',
        R(S('pc.postAbout', 'about pill'), S('pc.postWriteup', 'write-up pill'), S('pc.postRibbon', 'the bookmark'),
          S('pc.postGif', 'GIF badge'), S('pc.postTrack', 'a playlist’s track'), S('pc.postTierItem', 'a tier item'),
          S('pc.postTier', 'a tier row'), S('pc.postTierNamed', 'a named tier'))),
    Sub('Posts', 'organisms/post-card.elyx',
        R(S('pc.postArticle', 'an article', i11='pc.postArticleI11'),
          S('pc.postArticleCover', 'an article with a cover', i11='pc.postArticleCoverI11'),
          S('pc.postPick', 'a pick', i10='pc.postPickI10', slot='padding-top: 28px'), S('pc.postPlaylist', 'a playlist'), gap=32),
        R(S('pc.postNote', 'a scratch · canary'), S('pc.postNotePink', 'pink'), S('pc.postNoteMint', 'mint'),
          S('pc.postNoteSky', 'sky'), gap=32),
        R(S('pc.postImages', 'images · 1 + 3'), S('pc.postImages2', 'images · 2'),
          S('pc.postImages3', 'images · 1 + 2', i10='pc.postImages3I10'), S('pc.postRanking', 'a ranking'), gap=32)),
)

PROSE_BOARD = Board(
    'markdown', '15b', 'Markdown blocks',
    'What an article’s or a write-up’s markdown draws, one part per block, wherever it shows (an opened article, a '
    'project’s page, Studio’s editor). Deco (the h2 rule, the quote bar, the bullets) is red in i9 and the section’s '
    'hue from i10.',
    Sub('Text blocks', 'components/molecules/prose.elyx',
        R(S('prose.proseP', 'a paragraph'), S('prose.prosePSm', 'a paragraph, detail size'), S('prose.proseH2', 'h2 + rule'),
          S('prose.proseH3', 'h3'), S('prose.proseItem', 'a list item'), S('prose.proseItemSm', 'a list item, detail size'),
          S('prose.proseCodeInline', 'inline code'), S('prose.proseDivider', 'a divider'))),
    Sub('Blocks', 'components/molecules/prose.elyx',
        R(S('prose.proseQuote', 'a quote'), S('prose.proseCode', 'a code block'), S('prose.proseTable', 'a table'),
          S('prose.proseFigure', 'a figure'))),
)

NAV_BOARD = Board(
    'navigation', '16', 'Navigation',
    'The brand on the left, the section tabs on the right; the tab of the page’s section is here (the rope: i9 red, '
    'from i10 the section’s hue). The nav’s section variants (navProjects · navMusic · navThoughts) and the sheet’s are '
    'in 1b, where they render in their section. Home’s own nav is its section buttons and its links.',
    Sub('Brand', 'components/atoms/logo.elyx', R(S('lg.mark', 'the cat (28)'), S('lg.logo', 'the brand'))),
    Sub('Nav tabs', 'components/molecules/nav-tab.elyx',
        R(S('ntab.navTab', 'rest'), S('ntab.navTabHover', 'hover: lifts, the dot’s hue'), S('ntab.navTabHere', 'here: the rope'))),
    Sub('Nav (desktop)', 'organisms/nav.elyx', R(S('nv.nav', 'no section (Home): no tab is here'))),
    Sub('Page header', 'organisms/page-header.elyx',
        R(S('ph.pageHeader', 'title + actions'), S('ph.pageHeaderMeta', 'with a Meta line'), column=True, gap=24)),
    Sub("Home's links", 'organisms/home-links.elyx',
        R(S('hl.sectionNav', 'the section buttons'), S('hl.contactRow', 'contact: link buttons'))),
    Sub("Home's intro", 'organisms/home-intro.elyx',
        R(S('hi.lockup', 'the lockup'), S('hi.intro', 'lockup + tagline')),
        R(S('hi.bio', 'the bio, a line per row'), S('hi.leadText', 'the bio’s words'))),
)

# ---------------------------------------------------------------- patterns
FILTERS_BOARD = Board(
    'filters', '17', 'Filters',
    'Each section’s tools line: the search takes what the filters leave. From i10 a results line sits between the '
    'tools and the list (i9 has none: its counts are in the page header’s Meta). Thoughts filters from its rail.',
    Sub('Tools lines', 'organisms/music-tools.elyx · organisms/project-tools.elyx',
        R(S('mtools.musicTools', 'Music'), S('ptools.projectTools', 'Projects'), column=True, gap=24),
        R(S('ptools.filterDiv', 'a divider between filter groups'))),
    Sub('Results line', 'organisms/results-line.elyx',
        R(S('rl.resultsLine', {9: 'i9 has none (counts in the header)', 10: 'as it ships in i10', 11: 'on i11’s sizes'},
            i10='rl.resultsLineI10', i11='rl.resultsLineI11'))),
    Sub("Thoughts' rail", 'organisms/thoughts-tools.elyx',
        R(S('tt.railEyebrow', 'an eyebrow'), S('tt.railType', 'a type row'), S('tt.railTypeOn', 'a type row, on'),
          S('tt.railCollection', 'a collection'), S('tt.thoughtsRail', 'the rail, filled', i11='tt.thoughtsRailI11'))),
)

DETAIL_BOARD = Board(
    'detail', '18', 'Detail shell',
    'One anatomy for anything opened on its own page: the bar (back, the pager, copy link), the head (facts, title, '
    'dek), the body (media strip, prose, link row), the facts and contents beside it. A project’s page and an article '
    'are this shell with different content.',
    Sub('Bar', 'organisms/detail.elyx',
        R(S('dt.detailBack', 'back'), S('dt.detailNavDisc', 'a pager disc'), S('dt.detailNavDiscOff', 'the end of the list'),
          S('dt.detailBar', 'the bar', i10='dt.detailBarI10'))),
    Sub('Head', 'organisms/detail.elyx',
        R(S('dt.detailTitle', 'the title (an item)'), S('dt.detailTitleLg', 'the title (an article)'),
          S('dt.detailDek', 'the dek')),
        R(S('dt.detailHead', 'facts · title · dek'))),
    Sub('Body + aside', 'organisms/detail.elyx',
        R(S('dt.linkRow', 'the link row: one primary'), S('dt.asideFact', 'a facts-column fact'),
          S('dt.tocItem', 'contents: an h2'), S('dt.tocItemCurrent', 'contents: where you are'),
          S('dt.tocItemSub', 'contents: an h3'))),
    Sub('Shell', 'organisms/detail.elyx',
        R(S('dt.detail', 'the item size', i10='dt.detailI10'), S('dt.detailLg', 'an article’s size', i10='dt.detailLgI10'))),
    Sub('Filled', 'organisms/project-detail.elyx · organisms/article.elyx',
        R(S('pd.projectDetail', 'a project’s page', i10='pd.projectDetailI10')),
        R(S('artc.articlePage', 'an opened article', i10='artc.articlePageI10', i11='artc.articlePageI11'))),
)

TIMELINE = ('frame {layout: {stack: {direction: .column, item-gap: 12px}}, width: 560px, '
            'children: [tlYear, tlRow1, tlRow2, tlRow3]\n'
            'tlYear = frame : yp.yearHeader {width: 560px}\n'
            'tlRow1 = frame : prj.projectRow {}\ntlRow2 = frame : prj.projectRowPicked {}\n'
            'tlRow3 = frame : prj.projectRow {}\n}')

TIMELINE_BOARD = Board(
    'timeline', '19', 'Timeline + year groups',
    'A timeline is year groups: the year header, then its rows, one picked (the project on the stage). Studio’s '
    'Recently is the same idea: a day’s small pill, then its changes on a thread.',
    Sub('A year group (composed here)', 'molecules/year-pill.elyx · organisms/project.elyx',
        R(S(decl=TIMELINE, label='yearHeader + projectRow ×3', note='one picked', uses=['yp.yearHeader']))),
    Sub("Studio's Recently", 'organisms/studio-dashboard.elyx',
        R(S('sd.actItem', 'a change'), S('sd.actDay', 'a day and its changes'))),
)

PLAYER_BOARD = Board(
    'player', '20', 'Player',
    'The player floats over the page: a white knit bar on desktop; on a phone a disc (closed), the bar in the slot, '
    'and its page (open) with the queue. At rest ▶ is the view’s primary; playing, it is live.',
    Sub('Bar (desktop)', 'organisms/player.elyx',
        R(S('plr.player', 'playing'), S('plr.playerPaused', 'paused'), column=True, gap=24)),
    Sub('Phone: bar, disc, queue rows', 'organisms/player.elyx · organisms/player-phone.elyx',
        R(S('plr.playerPhone', 'the bar in the slot: playing'), S('plr.playerPhonePaused', 'paused'),
          S('pp.playerDisc', 'the disc (closed)')),
        R(S('pp.queueRow', 'a queue row'), S('pp.queueRowNow', 'now playing: the live rope'))),
    Sub('Phone: the page (open)', 'organisms/player-phone.elyx',
        R(S('pp.playerPage', 'playing'), S('pp.playerPagePaused', 'paused'), S('pp.playerPageQueue', 'scrolled to the queue'))),
)

PHONE_BOARD = Board(
    'phone', '21', 'Floating layer (phone chrome)',
    'Phones have no bottom bar: the page’s top keeps the brand and the sound tag; a floating layer holds the '
    'sections pill and the search knob, the player’s disc or bar, the search in the slot. Section variants of the '
    'pill and the menu are in 1b.',
    Sub('Page chrome on a phone', 'nav · sheet · page-header · results-line · studio-chrome · home-links',
        R(S('nv.navPhone', 'the brand alone'), S('sc.studioNavPhone', 'Studio: brand, tag, View site'),
          S('hl.contactRowPhone', 'Home’s contact: icons')),
        R(S('ph.pageHeaderPhone', 'header'), S('ph.pageHeaderMetaPhone', 'header with a Meta'),
          S('rl.resultsLinePhone', 'results line: icon-only buttons')),
        R(S('sht.sheetPhone', 'the sheet (390)'), S('hi.lockupPhone', 'Home’s lockup'),
          S('hi.introPhone', 'Home’s intro'), S('hi.bioPhone', 'Home’s bio'))),
    Sub('Knobs', 'organisms/phone-nav.elyx',
        R(S('pn.searchKnob', 'search: rest'), S('pn.searchKnobUp', 'up: the player has the slot'),
          S('pn.searchKnobOpen', 'open: folds the bar'), S('pn.searchKnobCount', '2 filters on'),
          S('pn.browseKnob', 'Browse'), S('pn.newKnob', 'Studio’s + (new)'))),
    Sub('Sections pill + menu', 'molecules/sections-pill.elyx · organisms/phone-nav.elyx',
        R(S('spill.sectionsPill', 'closed (Home)'), S('spill.sectionsPillOpen', 'open: caret down'),
          S('spill.sectionsPillUp', 'up: the player has the slot')),
        R(S('pn.spoolRow', 'a menu row'), S('pn.spoolRowHere', 'a row, here: the rope'), S('pn.sectionsMenu', 'the menu (Home here)'))),
    Sub('Search in the slot', 'organisms/phone-nav.elyx',
        R(S('pn.searchSlot', 'focused'), S('pn.searchSlotTyped', 'typed'), S('pn.filterFloat', 'the floating chip row'))),
    Sub("The floating layer's states (390 × 844)", 'organisms/phone-nav.elyx',
        R(S('pn.phoneLayer', 'rest: pill + knob', slot=PHONE), S('pn.phoneLayerDisc', 'a song loaded: the disc', slot=PHONE),
          S('pn.phoneLayerBar', 'the bar: playing', slot=PHONE), gap=40),
        R(S('pn.phoneLayerBarPaused', 'the bar: paused', slot=PHONE), S('pn.phoneLayerSearch', 'search open', slot=PHONE),
          S('pn.phoneLayerMenu', 'the sections menu open', slot=PHONE), gap=40),
        R(S('pn.phoneLayerNew', 'Studio: + (new)', slot=PHONE))),
)

EYEBROWS = [('eyebrowHeading', 'a pane’s head'), ('eyebrowTitle', 'a form section’s head'),
            ('eyebrowLabel', 'a section in the folder'), ('eyebrowQuiet', 'the preview’s labels')]

STUDIO_BOARD = Board(
    'studio', '22', 'Studio: chrome + dashboard',
    'Studio is the site’s own kit on an ink cord frame (section=studio). Its sheets render in their section in 1b '
    '(Section · Studio). i9 → i11 is mostly tokens; the eyebrows become real heads in i11.',
    Sub('Chrome', 'organisms/studio-chrome.elyx',
        R(S('sc.studioTag', 'the woven STUDIO tag')),
        R(S('sc.studioNav', 'the dashboard: no tab here'), S('sc.studioNavMusic', 'an editor in Music'),
          S('sc.studioNavThoughts', 'an editor in Thoughts'), column=True, gap=24)),
    Sub('Parts', 'organisms/studio-parts.elyx',
        R(S('sparts.secDot', 'a section card’s dot (44)'), S('sparts.secDotRow', 'a row’s dot (38)'),
          S('sparts.secDotAct', 'an activity’s dot (16)'),
          *[S('sparts.eyebrow', note, i11=f'sparts.{e}', label={9: 'eyebrow', 11: e}) for e, note in EYEBROWS])),
    Sub('Dashboard', 'organisms/studio-dashboard.elyx',
        R(S('sd.siteStrip', 'the site strip')),
        R(S('sd.print', 'a print: media'), S('sd.printSwatch', 'a print: swatch'), S('sd.printIcon', 'a print: post type'),
          S('sd.fan', 'fan: Projects'), S('sd.fanSwatches', 'fan: Music'), S('sd.fanIcons', 'fan: Thoughts'),
          S('sd.fanWords', 'fan: Home')),
        R(S('sd.secCard', 'Projects'), S('sd.secCardMusic', 'Music'), S('sd.secCardThoughts', 'Thoughts'),
          S('sd.secCardHome', 'Home & About')),
        R(S('sd.draftRow', 'a list row: a draft'))),
)

EDITOR_BOARD = Board(
    'editor', '23', 'Studio: editors + preview',
    'The editors are the detail shell: the bar (← the section · History · Publish), the head (publish state, the '
    'title that is the input), the form and its live preview built from the site’s own parts.',
    Sub('Editor: bar, head, form', 'organisms/studio-editor.elyx',
        R(S('se.edBar', 'published'), S('se.edBarPublish', 'a draft: Publish is primary'), column=True, gap=24),
        R(S('se.edHead', 'live'), S('se.edHeadDraft', 'a draft'), column=True, gap=24),
        R(S('se.formSec', 'a form section'), S('se.formSecSub', 'a section in the folder'), S('se.fieldLabel', 'a field’s label'),
          S('se.labeled', 'a labelled field'))),
    Sub('Editor: tracks + options', 'organisms/studio-editor.elyx',
        R(S('se.trackTab', 'a track tab'), S('se.trackTabPicked', 'chosen: the rope'), S('se.trackTabAdd', '+ Track'),
          S('se.statusOpt', 'a status option'), S('se.statusOptPicked', 'chosen'), S('se.motifOpt', 'a pattern'),
          S('se.motifOptPicked', 'chosen'), S('se.motifRow', 'the five patterns')),
        R(S('se.instOpt', 'an instrument'), S('se.instOptPicked', 'chosen: the rope'), S('se.instMix', 'from the tracks'),
          S('se.derivedBox', 'a derived fact: status'), S('se.derivedBoxDate', 'a derived fact: a month')),
        R(S('se.folder', 'a collection’s folder'), S('se.audioBox', 'the audio box')),
        R(S('se.linkRow', 'a link'), S('se.linkAdd', 'add links'), S('se.showsStrip', 'on the card'))),
    Sub('Article editor', 'organisms/studio-article.elyx',
        R(S('sa.tbBtn', 'a toolbar button'), S('sa.tbBtnLabel', '+ Block'), S('sa.coverAdd', 'the cover drop'),
          S('sa.mdBar', 'the toolbar')),
        R(S('sa.tagField', 'the tags field')),
        R(S('sa.proseDoc', 'blocks, as written'), S('sa.proseDocSite', 'blocks, as the site shows them'), gap=40),
        R(S('sa.docSheet', 'the block editor’s sheet'), S('sa.prevArticle', 'the article’s preview'), gap=40)),
    Sub('Preview', 'organisms/studio-preview.elyx',
        R(S('sp.prevPane', 'the preview pane'), S('sp.prevTrack', 'a track')),
        R(S('sp.prevRelease', 'a collection’s preview', i10='sp.prevReleaseI10', i11='sp.prevReleaseI11'))),
)

BOARDS = {
    'foundations': [ROLES_BOARD, TYPE_BOARD, SPACE_BOARD, RADII_BOARD, FACES_BOARD, TEXTURE_BOARD, STATES_BOARD],
    'components': [BUTTONS_BOARD, LINKS_BOARD, CHIPS_BOARD, TAGS_BOARD, FACTS_BOARD, SEARCH_BOARD, PILLS_BOARD,
                   FEEDBACK_BOARD, SOUND_BOARD, MEDIA_BOARD, FOLDER_BOARD, CARDS_BOARD, PROSE_BOARD, NAV_BOARD],
    'patterns': [FILTERS_BOARD, DETAIL_BOARD, TIMELINE_BOARD, PLAYER_BOARD, PHONE_BOARD],
    'studio': [STUDIO_BOARD, EDITOR_BOARD],
}

PALETTE_BOARD = Board(
    'palette', '1', 'Colour · palette',
    'The raw yarn colours (tokens/color/palette.elyx). They never vary by iteration or section, so they show once. '
    'Components never use them directly except content colours (project types, instruments, notes, tiers): every '
    'accent goes through a role (1a).',
    *palette_subs(),
)
