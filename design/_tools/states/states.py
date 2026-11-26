#!/usr/bin/env python3
"""Lay out an Elyx component file as a states page.

usage: states.py <config.py> [--dry] [--root DIR]

The config defines CONFIG = {
  "file": "components/molecules/play-button.elyx",
  "sections": [                      # definitions area; each section = rows sharing a column grid
     {"rows": [["playBtn", "playBtnCurrent"], ["playBtnSm", "-", "playBtnSmLive"]], "grid": True},
  ],
  "notes": {"playBtnCurrent": "loaded, paused"},   # second line under a label
  "labels": {"sym": "custom label text"},          # default: the symbol name
  "nolabel": ["someLocalSpec"],                     # already labelled
  "drop": ["oldLabel"],                             # top-level layers to delete (old labels)
  "boards": [
     {"key": "playBtn", "caption": "Play button",
      "rows": [["playBtn", "playBtnCurrent"], ...],
      "i10": {"playBtn": "playBtnI10"},           # pick per state in the i10 board
      "i11": {"playBtn": "playBtnI11"}},          # pick per state in the i11 board (falls back to i10 pick)
  ],
}
"""
import json, os, re, subprocess, sys

SENTINEL = "// ==== states page (labels over the definitions, then the states boards: i9 · i10 · i11) ===="
LABEL_H = 16       # specLabel line (12px * 1.3)
NOTE_H = 16
LABEL_GAP = 8      # label -> item
CHAR_W = 7.0       # SemiBold 12px, generous
NOTE_CHAR_W = 6.6
MIN_GAP = 56
ROW_GAP_MIN = 80
BOARD_GAP_MIN = 160

ROOT = "/Users/blaqat/dev/projects/blaqatdotnet/design"

DECL_RE = re.compile(r'^(export\s+)?([A-Za-z_][\w-]*)\s*=\s*(frame|text|asset|boolean|tokens|path|vector|ellipse|rect|line|image|svg)\b(.*)$')


def run(args, cwd=None):
    r = subprocess.run(args, cwd=cwd or ROOT, capture_output=True, text=True)
    if r.returncode != 0:
        raise SystemExit("command failed: %s\n%s%s" % (" ".join(args), r.stdout, r.stderr))
    return r.stdout


def strip_code(line):
    """line without strings / comments, for brace counting"""
    out, i, n = [], 0, len(line)
    while i < n:
        c = line[i]
        if c == '"':
            i += 1
            while i < n and line[i] != '"':
                if line[i] == '\\':
                    i += 1
                i += 1
            i += 1
            continue
        if line.startswith('//', i):
            break
        out.append(c)
        i += 1
    return ''.join(out)


def parse(lines):
    """top-level declarations: dict name -> {start (first annotation/comment line), open, end, export}"""
    decls, order = {}, []
    i, n = 0, len(lines)
    while i < n:
        m = DECL_RE.match(lines[i])
        if m and not lines[i].startswith(' '):
            name = m.group(2)
            # find end by brace matching
            depth, j, seen = 0, i, False
            while j < n:
                s = strip_code(lines[j])
                depth += s.count('{') - s.count('}')
                if '{' in s:
                    seen = True
                if seen and depth == 0:
                    break
                j += 1
            # annotations directly above
            k = i
            while k > 0 and (lines[k - 1].startswith('@')):
                k -= 1
            ann_start = k
            # comments directly above annotations
            while k > 0 and lines[k - 1].startswith('//'):
                k -= 1
            decls[name] = {"name": name, "start": k, "ann": ann_start, "open": i, "end": j,
                           "export": bool(m.group(1)), "kind": m.group(3), "rest": m.group(4)}
            order.append(name)
            i = j + 1
            continue
        i += 1
    return decls, order


def tree_top(path, extra=()):
    out = run(["elyx", "tree", path, "--depth", "0"] + list(extra))
    d = json.loads(out)
    res = {}
    for c in d["tree"]["children"]:
        res[c["name"]] = (c["position"]["x"], c["position"]["y"], c["resolvedSize"]["width"], c["resolvedSize"]["height"])
    return res


def set_pos(lines, d, left, top):
    """rewrite the declaration's own left/top (indent-2 properties)."""
    o, e = d["open"], d["end"]
    head = lines[o]
    if o == e:  # one-liner
        m = re.match(r'^(.*\{)\s*(.*?)\s*\}\s*$', head)
        inner = m.group(2)
        inner = re.sub(r'\b(left|top)\s*:\s*[^,}]+,?\s*', '', inner).strip().rstrip(',')
        body = ["  left: %dpx," % left, "  top: %dpx%s" % (top, "," if inner else "")]
        if inner:
            body.append("  " + inner)
        lines[o:o + 1] = [m.group(1)] + body + ["}"]
        return
    found = {"left": None, "top": None}
    depth = 0
    for j in range(o + 1, e):
        s = strip_code(lines[j])
        if depth == 0:
            mm = re.match(r'^  (left|top):\s*([^,]*?)(,?)\s*$', lines[j])
            if mm:
                found[mm.group(1)] = j
        depth += s.count('{') - s.count('}') + s.count('[') - s.count(']') + s.count('(') - s.count(')')
    for key, val in (("left", left), ("top", top)):
        j = found[key]
        if j is not None:
            lines[j] = re.sub(r'^  (left|top):\s*([^,]*?)(,?)\s*$', lambda m: "  %s: %dpx%s" % (m.group(1), val, m.group(3) or ","), lines[j])
    missing = [k for k in ("left", "top") if found[k] is None]
    if missing:
        # insert after title line if any, else after the opening line
        at = o + 1
        for j in range(o + 1, e):
            if re.match(r'^  title:', lines[j]):
                at = j + 1
                break
        ins = ["  %s: %dpx," % (k, left if k == "left" else top) for k in missing]
        lines[at:at] = ins


def tw(s, cw=CHAR_W):
    return int(len(s) * cw + 4)


def layout_defs(cfg, sizes):
    """returns placements {sym: (x, y)}, labels [(sym, x, y, text, kind)], bottom"""
    notes = cfg.get("notes", {})
    labels_txt = cfg.get("labels", {})
    nolabel = set(cfg.get("nolabel", []))
    place, labels = {}, []
    y = cfg.get("top", 0)
    for sec in cfg["sections"]:
        rows = sec["rows"]
        heading = sec.get("heading")
        if heading:
            labels.append(("__h_" + re.sub(r'\W', '', heading), 0, y, heading, "heading"))
            y += 40
        ncol = max(len(r) for r in rows)
        grid = sec.get("grid", True)
        # column widths
        def colw(sym):
            if sym == "-" or sym is None:
                return 0
            w = sizes[sym][2]
            lt = labels_txt.get(sym, sym)
            cw = max(w, tw(lt) if sym not in nolabel else 0, tw(notes.get(sym, ""), NOTE_CHAR_W) if sym in notes else 0)
            return cw
        if grid:
            widths = [max(colw(r[c]) if c < len(r) else 0 for r in rows) for c in range(ncol)]
        for r in rows:
            anynote = any(s in notes for s in r if s != "-")
            alllabel = any(s not in nolabel for s in r if s != "-")
            head = (LABEL_H + (NOTE_H if anynote else 0) + LABEL_GAP) if alllabel else 0
            itop = y + head
            x = 0
            rowh = 0
            for c, sym in enumerate(r):
                w = widths[c] if grid else colw(sym)
                if sym != "-" and sym is not None:
                    place[sym] = (x, itop)
                    rowh = max(rowh, sizes[sym][3])
                    if sym not in nolabel:
                        labels.append((sym, x, y, labels_txt.get(sym, sym), "label"))
                        if sym in notes:
                            labels.append((sym, x, y + LABEL_H, notes[sym], "note"))
                gap = max(MIN_GAP, int(round(w * 0.2 / 8.0)) * 8)
                x += w + gap
            y = itop + rowh + max(ROW_GAP_MIN, int(round(rowh * 0.2 / 8.0)) * 8)
        y += sec.get("after", 0)
    return place, labels, y


def lit(s):
    return json.dumps(s, ensure_ascii=False)


def ident(sym):
    return sym


def gen_labels(labels):
    out = []
    for sym, x, y, text, kind in labels:
        if kind == "heading":
            out.append("%s = text : doc.specSubheading {\n  left: %dpx,\n  top: %dpx,\n  contents: %s\n}\n" % (sym.replace("__h_", "head-"), x, y, lit(text)))
        elif kind == "label":
            out.append("lbl-%s = text : doc.specLabel {\n  left: %dpx,\n  top: %dpx,\n  contents: %s\n}\n" % (sym, x, y, lit(text)))
        else:
            out.append("note-%s = text : doc.specNote {\n  left: %dpx,\n  top: %dpx,\n  contents: %s\n}\n" % (sym, x, y, lit(text)))
    return out


KINDS = {}

def gen_board(b, notes, left, top, it="i9", base=None, picks=None, ctx=None, labels_txt=None, section=None):
    key = b["key"]
    secs = list(b.get("sections", {}).keys())
    S = section[0].upper() + section[1:] if section else ""
    suf = {"i9": "", "i10": "I10", "i11": "I11"}[it]
    name = key + "States" + S + suf
    rows = b["rows"]
    cap = b["caption"]
    notes = dict(notes)
    notes.update(b.get("notes", {}))
    labels_txt = dict(labels_txt or {})
    labels_txt.update(b.get("labels", {}))
    L = []
    sec_ctx = (', section="%s"' % section) if section else ""
    if it == "i9" and not section:
        regs = ["%sStatesI10" % key] + ["%sStates%s" % (key, x[0].upper() + x[1:]) for x in secs]
        L.append("@variants(%s)" % ", ".join(regs))
        L.append("%s = frame : doc.docBoard {" % name)
    elif it == "i9":
        L.append("@variants(%sStates%sI10)" % (key, S))
        L.append('@context(section="%s")' % section)
        L.append("%s = frame : %sStates {" % (name, key))
    elif it == "i10":
        L.append("@variants(%sStates%sI11)" % (key, S))
        L.append('@context(i10="on"%s)' % sec_ctx)
        L.append("%s = frame : %sStates%s {" % (name, key, S))
    else:
        L.append('@context(i10="on", i11="on"%s)' % sec_ctx)
        L.append("%s = frame : %sStates%sI10 {" % (name, key, S))
    if section:
        cap = "%s · %s" % (cap, section)
    L.append('  title: %s,' % lit("%s · states · %s" % (cap, it)))
    L.append("  left: %dpx," % left)
    L.append("  top: %dpx," % top)
    L.append("")
    L.append("  boardHead {")
    L.append("    boardTag {")
    L.append("      iterName {")
    L.append("        contents: %s" % lit(it))
    L.append("      }")
    L.append("    }")
    if it == "i9":
        L.append("")
        L.append("    boardCaption {")
        L.append("      contents: %s" % lit(b.get("boardCaption", "%s · every state" % cap) if not section else "%s · section = %s" % (b["caption"], section)))
        L.append("    }")
    L.append("  }")
    if it == "i9" and not section:
        L.append("")
        ins = []
        for i, r in enumerate(rows):
            rn = "row-%d" % (i + 1)
            ins.append("insert(%s)" % rn if i == 0 else "insert(%s, after = row-%d)" % (rn, i))
        L.append("  body {")
        L.append("    layout.stack.item-gap: 48px,")
        L.append("    overrides: [%s]" % ", ".join(ins))
        L.append("  }")
        for i, r in enumerate(rows):
            rn = "row-%d" % (i + 1)
            syms = [s for s in r if s != "-"]
            ins = []
            for k, s in enumerate(syms):
                ins.append("insert(st-%s)" % s if k == 0 else "insert(st-%s, after = st-%s)" % (s, syms[k - 1]))
            L.append("")
            L.append("  %s = frame : doc.specRow {" % rn)
            L.append("    layout.stack.item-gap: 48px,")
            L.append("    overrides: [%s]" % ", ".join(ins))
            L.append("  }")
        for r in rows:
            for s in r:
                if s == "-":
                    continue
                L.append("")
                L.append("  st-%s = frame : doc.spec {" % s)
                if s in notes:
                    L.append("    overrides: [insert(note, after = doc.spec.label)],")
                    L.append("")
                L.append("    label {")
                L.append("      contents: %s" % lit((labels_txt or {}).get(s, s)))
                L.append("    }")
                L.append("")
                L.append("    slot {")
                L.append("      overrides: [insert(it)]")
                L.append("    }")
                if s in notes:
                    L.append("")
                    L.append("    note = text : doc.specNote {")
                    L.append("      contents: %s" % lit(notes[s]))
                    L.append("    }")
                L.append("")
                src = b.get("ref", {}).get(s, s)
                L.append("    it = %s : %s {}" % (KINDS.get(src, "frame"), src))
                L.append("  }")
    else:
        # picks: state -> contextual variant symbol
        if picks:
            L.append("")
            L.append("  body {")
            first = True
            for i, r in enumerate(rows):
                rn = "row-%d" % (i + 1)
                rp = [s for s in r if s != "-" and s in picks]
                if not rp:
                    continue
                if not first:
                    L.append("")
                first = False
                L.append("    %s {" % rn)
                for k, s in enumerate(rp):
                    if k:
                        L.append("")
                    L.append("      st-%s {" % s)
                    L.append("        label {")
                    L.append("          contents: %s" % lit(picks[s]))
                    L.append("        }")
                    if s in notes and picks[s] in notes:
                        L.append("")
                        L.append("        note {")
                        L.append("          contents: %s" % lit(notes[picks[s]]))
                        L.append("        }")
                    L.append("")
                    L.append("        slot {")
                    L.append("          @with-variant(%s)" % picks[s])
                    L.append("          it {}")
                    L.append("        }")
                    L.append("      }")
                L.append("    }")
            L.append("  }")
    L.append("}")
    return "\n".join(L) + "\n"


def main():
    cfgpath = sys.argv[1]
    dry = "--dry" in sys.argv
    root = ROOT
    if "--root" in sys.argv:
        root = sys.argv[sys.argv.index("--root") + 1]
    ns = {}
    exec(open(cfgpath).read(), ns)
    cfg = ns["CONFIG"]
    path = os.path.join(root, cfg["file"])
    text = open(path).read()
    if SENTINEL in text:
        text = text[:text.index(SENTINEL)].rstrip() + "\n"
    lines = text.split("\n")
    # drop old layers
    decls, order = parse(lines)
    for dname in sorted([n for n in cfg.get("drop", []) if n in decls], key=lambda n: -decls[n]["start"]):
        d = decls[dname]
        s, e = d["start"], d["end"]
        while e + 1 < len(lines) and lines[e + 1].strip() == "":
            e += 1
        del lines[s:e + 1]
    # doc import
    if not cfg.get("self_doc") and not any(re.match(r'^import\s+"components/atoms/doc.elyx"\s+as\s+doc\b', l) for l in lines):
        last = max(i for i, l in enumerate(lines) if l.startswith("import "))
        lines.insert(last + 1, 'import "components/atoms/doc.elyx" as doc')
    open(path, "w").write("\n".join(lines).rstrip() + "\n")
    sizes = tree_top_root(cfg["file"], root)
    place, labels, bottom = layout_defs(cfg, sizes)
    lines = open(path).read().split("\n")
    decls, order = parse(lines)
    allsyms = [s for sec in cfg["sections"] for r in sec["rows"] for s in r if s != "-"]
    missing_defs = [n for n in order if n not in allsyms and n not in cfg.get("drop", [])]
    if missing_defs and not cfg.get("allow_unplaced"):
        raise SystemExit("top-level layers not placed: %s" % missing_defs)
    for n in order:
        d = decls[n]
        for j in range(d["open"] + 1, d["end"]):
            if re.match(r'^  (right|bottom):', lines[j]):
                print("WARNING %s has a top-level %s" % (n, lines[j].strip()))
    for n in order:
        KINDS[n] = decls[n]["kind"]
    unknown = [s for s in allsyms if s not in decls]
    if unknown:
        raise SystemExit("unknown symbols in rows: %s" % unknown)
    # apply positions bottom-up so line numbers stay valid
    for sym in sorted(place, key=lambda s: -decls[s]["open"]):
        x, y = place[sym]
        set_pos(lines, decls[sym], x, y)
    body = "\n".join(lines).rstrip() + "\n\n" + SENTINEL + "\n"
    gen = gen_labels(labels)
    if cfg.get("self_doc"):
        gen = [g.replace(" : doc.", " : ") for g in gen]
    notes = cfg.get("notes", {})
    labels_txt = cfg.get("labels", {})
    boards = cfg.get("boards", [])
    btop = bottom + 64
    # pass 1: provisional board positions
    def boards_text(positions):
        out = []
        for b in boards:
            p = positions[b["key"]]
            i10 = b.get("i10", {})
            i11 = b.get("i11", {})
            out.append(gen_board(b, notes, p[0][0], p[0][1], "i9", labels_txt=labels_txt))
            out.append(gen_board(b, notes, p[1][0], p[1][1], "i10", picks=i10, labels_txt=labels_txt))
            out.append(gen_board(b, notes, p[2][0], p[2][1], "i11", picks=i11, labels_txt=labels_txt))
            for k2, (sec, sp) in enumerate(b.get("sections", {}).items()):
                q = positions[b["key"] + ":" + sec]
                out.append(gen_board(b, notes, q[0][0], q[0][1], "i9", picks=sp.get("i9", {}), labels_txt=labels_txt, section=sec))
                out.append(gen_board(b, notes, q[1][0], q[1][1], "i10", picks=sp.get("i10", {}), labels_txt=labels_txt, section=sec))
                out.append(gen_board(b, notes, q[2][0], q[2][1], "i11", picks=sp.get("i11", {}), labels_txt=labels_txt, section=sec))
        return out
    prov = {}
    n = 0
    for b in boards:
        for kk in [b["key"]] + [b["key"] + ":" + sec for sec in b.get("sections", {})]:
            prov[kk] = [(0, btop + n * 5000), (6000, btop + n * 5000), (12000, btop + n * 5000)]
            n += 1
    open(path, "w").write(body + "\n".join(gen + boards_text(prov)))
    if dry:
        return
    sz = tree_top_root(cfg["file"], root)
    pos = {}
    y = btop
    g = lambda w: max(BOARD_GAP_MIN, int(round(w * 0.2 / 8.0)) * 8)
    for b in boards:
        k = b["key"]
        keys = [(k, "")] + [(k + ":" + sec, sec[0].upper() + sec[1:]) for sec in b.get("sections", {})]
        W9 = max(sz[k + "States" + S][2] for _, S in keys)
        W10 = max(sz[k + "States" + S + "I10"][2] for _, S in keys)
        x10 = int(W9 + g(W9))
        x11 = int(x10 + W10 + g(W10))
        for kk, S in keys:
            pos[kk] = [(0, y), (x10, y), (x11, y)]
            h = max(sz[k + "States" + S + suf][3] for suf in ("", "I10", "I11"))
            y += int(h + max(120 if S else 160, int(round(h * 0.2 / 8.0)) * 8))
    open(path, "w").write(body + "\n".join(gen + boards_text(pos)))
    print("ok", path, "defs bottom", bottom, "boards", pos)


def tree_top_root(f, root):
    out = run(["elyx", "tree", f, "--depth", "0"], cwd=root)
    d = json.loads(out)
    res = {}
    for c in d["tree"]["children"]:
        res[c["name"]] = (c["position"]["x"], c["position"]["y"], c["resolvedSize"]["width"], c["resolvedSize"]["height"])
    return res


if __name__ == "__main__":
    main()
