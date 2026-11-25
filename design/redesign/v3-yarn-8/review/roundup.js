/* review.html · the i5 round-up (R3). Reads the review store (kit/review.js → window.YarnReview), the generated
   ⚙ groups (review/options-i8.js → YARN_OPTIONS) and the open questions (review/questions-i8.js → YARN_ROUNDUP).
   Picks and answers made here go into the same store as the ⚙ panel's. */
(() => {
  "use strict";
  const start = () => {
    const R = window.YarnReview;
    if (!R) return void setTimeout(start, 30);
    run(R);
  };
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", start, { once: true }) : start();

  function run(R) {
    const O = window.YARN_OPTIONS || { pages: [], groups: [] };
    const Q = (window.YARN_ROUNDUP && window.YARN_ROUNDUP.questions) || [];
    const root = document.getElementById("ru");
    const $ = (s, r = root) => r.querySelector(s);
    const $$ = (s, r = root) => [...r.querySelectorAll(s)];
    const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
    const txt = (s) => String(s || "").replace(/\s+/g, " ").trim();
    const md1 = (s) => String(s || "").replace(/\s*\n+\s*/g, " / ").trim(); // a note on one Markdown line
    const SECTIONS = ["kit", "home", "projects", "music", "thoughts", "studio"];
    const SEC_NAME = { kit: "Every page", home: "Home", projects: "Projects", music: "Music", thoughts: "Thoughts", studio: "Studio", root: "Index pages", kit_: "Kit pages", research: "Research" };
    const secName = (s) => SEC_NAME[s] || s;
    const PAGE_NAME = Object.fromEntries(O.pages.map((p) => [p.path, p.name]));
    const pageName = (path) => PAGE_NAME[path] || path;
    const pageOrder = (path) => { const i = O.pages.findIndex((p) => p.path === path); return i < 0 ? 99 : i; };
    const OPEN = O.groups.filter((g) => g.open);
    const BY_ID = new Map(O.groups.map((g) => [g.id, g]));
    const valLabel = (g, v) => (g?.options.find(([x]) => x === v) || [, v === "" ? "(none)" : v])[1];
    // questions that point at an option value
    const CUT = new Map(Q.filter((q) => q.kind === "cut").map((q) => [`${q.param}=${q.value}`, q]));
    const SETTLE = new Map(Q.filter((q) => q.kind === "settle").map((q) => [q.param, q]));
    const tryHref = (g, v) => {
      const [p, q = ""] = g.try.split("?");
      const u = new URLSearchParams(q);
      if (v === "") u.delete(g.param); else u.set(g.param, v);
      const s = u.toString().replace(/%2C/gi, ",");
      return p + (s ? "?" + s : "");
    };
    const PEN = '<svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path d="M11.2 1.8a1.6 1.6 0 0 1 2.3 0l.7.7a1.6 1.6 0 0 1 0 2.3l-8 8L2.5 14l1.2-3.7 7.5-8.5Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    const noteBox = (attrs, text, label, ph = "Your note… (saves as you type)") =>
      `<textarea class="yrv-ta ru-ta" ${attrs} rows="1" aria-label="${esc(label)}" placeholder="${esc(ph)}">${esc(text || "")}</textarea>`;
    let d = R.load();
    const openNotes = new Set(); // note fields opened but still empty

    /* ---------- Decisions ---------- */
    function optHTML(g) {
      const pick = d.choices[g.scope]?.[g.param];
      const note = d.notes.opt[g.id]?.text || "";
      const settle = SETTLE.get(g.param);
      const vals = g.options.map(([v, l]) => {
        const cut = CUT.get(`${g.param}=${v}`);
        const isCut = cut && d.answers[cut.id]?.v !== "keep";
        const on = !!pick && pick.v === v;
        return `<span class="ru-val${isCut ? " is-cut" : ""}"><button type="button" class="ychip ychip--sm ysel" aria-pressed="${on}" data-act="pick" data-v="${esc(v)}"${isCut ? ` title="Suggested cut (Questions)"` : ""}><span class="ychip__l">${esc(l)}</span>${v === (g.default ?? "") ? '<small class="ru-def">default</small>' : ""}${isCut ? '<small class="ru-cut">cut?</small>' : ""}</button><a class="ru-try" href="${esc(tryHref(g, v))}" title="Try “${esc(l)}”" aria-label="Try ${esc(l)}"><i class="ph-bold ph-arrow-up-right" aria-hidden="true"></i></a></span>`;
      }).join("");
      const where = g.scope === "kit" ? (g.pages.length > 4 ? "every page" : g.pages.map(pageName).join(" · ")) : g.pages.map(pageName).join(" · ");
      const phone = g.widths.length === 1 && g.widths[0] === "phone" ? " · phones" : "";
      const showNote = note || openNotes.has("opt:" + g.id);
      return `<li class="ycard ru-opt${pick ? " has-pick" : ""}" data-id="${esc(g.id)}">
        <div class="ru-opt__head"><h4>${esc(g.label)}</h4><button type="button" class="ru-pen${note ? " has-note" : ""}" data-act="onote" aria-expanded="${!!showNote}" aria-label="Note on ${esc(g.label)}" title="Note on this option">${PEN}</button></div>
        <p class="ru-where"><code>?${esc(g.param)}</code> ${esc(where)}${phone}</p>
        <div class="ru-vals" role="group" aria-label="${esc(g.label)}">${vals}</div>
        <p class="ru-status">${pick
          ? `Your pick: <b>${esc(valLabel(g, pick.v))}</b>${pick.v === (g.default ?? "") ? " (keeps the default)" : ""}`
          : `<span class="ru-none">No pick yet: the default stays (<b>${esc(valLabel(g, g.default ?? ""))}</b>)</span>`}${settle ? ` · <span class="ru-hint">Fable: just settle on <b>${esc(valLabel(g, settle.value))}</b></span>` : ""}</p>
        ${showNote ? noteBox(`data-note="opt" data-key="${esc(g.id)}"`, note, "Note on " + g.label) : ""}
      </li>`;
    }
    function renderDecisions() {
      const by = (scope) => OPEN.filter((g) => g.scope === scope);
      const scopes = [...SECTIONS, ...new Set(OPEN.map((g) => g.scope).filter((s) => !SECTIONS.includes(s)))];
      let h = scopes.filter((s) => by(s).length).map((s) => `<div class="ru-grp"><h3 class="ru-h3">${esc(secName(s))}<small>${by(s).length}</small></h3><ul class="ru-opts">${by(s).map(optHTML).join("")}</ul></div>`).join("");
      // picks on decided (Earlier) options, and picks this page doesn't know (a stale options file)
      const extra = [];
      for (const [scope, o] of Object.entries(d.choices)) for (const [param, c] of Object.entries(o || {})) {
        const g = BY_ID.get(`${scope}:${param}`);
        if (g && g.open) continue;
        extra.push({ scope, param, c, g });
      }
      if (extra.length) h += `<div class="ru-grp"><h3 class="ru-h3">Earlier options you changed<small>${extra.length}</small></h3><ul class="ru-extra">${extra.map(({ scope, param, c, g }) =>
        `<li><span><b>${esc(g ? g.label : param)}</b> <span class="meta">${esc(secName(scope))} · ?${esc(param)}=${esc(c.v)}</span></span><span>${esc(g ? valLabel(g, c.v) : c.v)}${g && c.v === g.default ? " (default)" : ""}</span><button type="button" class="ru-link" data-act="unpick" data-scope="${esc(scope)}" data-param="${esc(param)}">forget</button></li>`).join("")}</ul></div>`;
      if (!OPEN.length) h = '<p class="ru-empty">No ⚙ data yet: run <code>node _tools/review-data.mjs</code>.</p>';
      $("[data-mount=decisions]").innerHTML = h;
    }

    /* ---------- Questions ---------- */
    function qHTML(q) {
      const a = d.answers[q.id] || {};
      const tries = (q.try || []).map(([href, label]) => `<a class="ru-tlink" href="${esc(href)}">${esc(label)}<i class="ph-bold ph-arrow-up-right" aria-hidden="true"></i></a>`).join("");
      const showNote = a.note || openNotes.has("q:" + q.id);
      let body = "";
      if (q.kind === "ask") {
        body = `<div class="ru-vals" role="group" aria-label="Your answer">${q.options.map(([v, l]) => `<button type="button" class="ychip ychip--sm ysel" aria-pressed="${a.v === v}" data-act="answer" data-v="${esc(v)}"><span class="ychip__l">${esc(l)}</span>${q.rec === v ? '<small class="ru-rec">suggested</small>' : ""}</button>`).join("")}</div>`;
      } else if (q.kind === "cut") {
        const kept = a.v === "keep";
        body = `<div class="ru-vals"><button type="button" class="ychip ychip--sm ysel ytog ru-keep" aria-pressed="${kept}" data-act="keep"><i class="ph-bold ${kept ? "ph-check" : "ph-arrow-counter-clockwise"}" aria-hidden="true"></i><span class="ychip__l">${kept ? "Kept" : "Keep it"}</span></button><span class="ru-cutstate">${kept ? "Stays in ⚙" : "Cut unless you keep it"}</span></div>`;
      } else if (q.kind === "settle") {
        const g = O.groups.find((x) => x.param === q.param);
        body = `<div class="ru-vals" role="group" aria-label="Your answer"><button type="button" class="ychip ychip--sm ysel" aria-pressed="${a.v === "agree"}" data-act="answer" data-v="agree"><span class="ychip__l">Agree: ${esc(valLabel(g, q.value))}</span><small class="ru-rec">suggested</small></button><button type="button" class="ychip ychip--sm ysel" aria-pressed="${a.v === "compare"}" data-act="answer" data-v="compare"><span class="ychip__l">Keep comparing</span></button></div>`;
      }
      const isCut = q.kind === "cut" && a.v !== "keep";
      return `<li class="ycard ru-q ru-q--${esc(q.kind)}${a.v ? " has-answer" : ""}" data-q="${esc(q.id)}">
        <p class="ru-q__meta meta"><span class="ru-area">${esc(q.area || "")}</span> ${esc(q.from || "")}${q.param ? ` · <code>?${esc(q.param)}=${esc(q.value)}</code>` : ""}</p>
        <p class="ru-q__t${isCut ? " is-cut" : ""}">${esc(q.q)}</p>
        ${body}
        <div class="ru-q__foot">${tries}<button type="button" class="ru-pen${a.note ? " has-note" : ""}" data-act="qnote" aria-expanded="${!!showNote}" aria-label="Note on this question" title="Add a note">${PEN}<span>Note</span></button></div>
        ${showNote ? noteBox(`data-note="q" data-key="${esc(q.id)}"`, a.note, "Note on this question") : ""}
      </li>`;
    }
    function renderQuestions() {
      const part = (kind, title, sub) => { const list = Q.filter((q) => q.kind === kind); return list.length ? `<div class="ru-grp"><h3 class="ru-h3">${title}<small>${list.length}</small></h3>${sub ? `<p class="ru-sub">${sub}</p>` : ""}<ul class="ru-qs">${list.map(qHTML).join("")}</ul></div>` : ""; };
      $("[data-mount=questions]").innerHTML = (part("ask", "Open questions", "") + part("cut", "Suggested cuts", "Options Fable suggests removing from ⚙. Crossed out = cut; “Keep it” brings one back.") + part("settle", "Just settle it", "Small enough to decide now.")) || '<p class="ru-empty">No questions.</p>';
    }

    /* ---------- Notes ---------- */
    function allNotes() {
      const pages = new Map();
      const add = (path, n) => { if (!pages.has(path)) pages.set(path, []); pages.get(path).push(n); };
      for (const [path, n] of Object.entries(d.notes.page)) add(path, { type: "page", path, ...n });
      for (const [key, n] of Object.entries(d.notes.opt)) add(n.page || "?", { type: "opt", key, ...n });
      d.notes.el.forEach((n) => add(n.page, { type: "el", ...n }));
      return [...pages.entries()].sort((a, b) => pageOrder(a[0]) - pageOrder(b[0]) || a[0].localeCompare(b[0]));
    }
    const choicesStr = (c) => Object.entries(c || {}).map(([k, v]) => `${k}=${v}`).join(" · ");
    function renderNotes() {
      const pages = allNotes();
      if (!pages.length) { $("[data-mount=notes]").innerHTML = '<p class="ru-empty">No notes yet. On any page: ⚙ → <b>Notes on this page</b>, the ✎ beside an option, or <b>Note on something</b> to pin a note to a part of the page.</p>'; return; }
      $("[data-mount=notes]").innerHTML = `<div class="ru-npages">${pages.map(([path, list]) => {
        const elN = list.filter((n) => n.type === "el");
        const url = list.find((n) => n.type === "page")?.url || list[0].url || path;
        return `<article class="ycard ru-npage"><h3 class="ru-h3"><a href="${esc(R.rel(url))}">${esc(pageName(path))}<i class="ph-bold ph-arrow-up-right" aria-hidden="true"></i></a><small>${esc(path)}</small></h3><ul class="ru-notes">${[
          ...list.filter((n) => n.type === "page").map((n) => `<li class="ru-note"><p class="ru-note__on">The page</p>${noteBox(`data-note="page" data-key="${esc(n.path)}"`, n.text, "Note on " + pageName(path))}</li>`),
          ...list.filter((n) => n.type === "opt").map((n) => `<li class="ru-note"><p class="ru-note__on">Option <b>${esc(n.label)}</b> <code>?${esc(n.param)}</code>${n.scope === "kit" ? " · every page" : ""}</p>${noteBox(`data-note="opt" data-key="${esc(n.key)}"`, n.text, "Note on " + n.label)}</li>`),
          ...elN.map((n) => `<li class="ru-note"><p class="ru-note__on"><span class="ru-pinno">${list.filter((x) => x.type === "el").indexOf(n) + 1}</span><b>${esc(n.kind)}</b>${n.label ? ` “${esc(n.label)}”` : ""} <a class="ru-tlink" href="${esc(R.rel((n.url || n.page) + ((n.url || "").includes("?") ? "&" : "?") + "rvnote=" + encodeURIComponent(n.id)))}">show me<i class="ph-bold ph-arrow-up-right" aria-hidden="true"></i></a><button type="button" class="ru-link" data-act="delnote" data-id="${esc(n.id)}">delete</button></p><p class="ru-note__sel"><code>${esc(n.sel)}</code>${choicesStr(n.choices) ? ` · with ${esc(choicesStr(n.choices))}` : ""}</p>${noteBox(`data-note="el" data-key="${esc(n.id)}"`, n.text, "Note on " + (n.label || n.kind))}</li>`),
        ].join("")}</ul></article>`;
      }).join("")}</div>`;
    }

    /* ---------- counts + Markdown ---------- */
    function counts() {
      const picked = OPEN.filter((g) => d.choices[g.scope]?.[g.param]).length;
      const asks = Q.filter((q) => q.kind !== "cut");
      const answered = asks.filter((q) => d.answers[q.id]?.v).length;
      const kept = Q.filter((q) => q.kind === "cut" && d.answers[q.id]?.v === "keep").length;
      const nNotes = Object.keys(d.notes.page).length + Object.keys(d.notes.opt).length + d.notes.el.length;
      const set = (k, v) => { const el = root.querySelector(`[data-count="${k}"]`); if (el) el.textContent = v; };
      set("decisions", `${picked}/${OPEN.length}`);
      set("questions", `${answered}/${asks.length}`);
      set("notes", String(nNotes));
      const sub = (k, v) => { const el = root.querySelector(`[data-sub="${k}"]`); if (el) el.textContent = v; };
      sub("decisions", `${picked} of ${OPEN.length} picked`);
      sub("questions", `${answered} of ${asks.length} answered · ${kept} of ${Q.length - asks.length} cuts kept`);
      sub("notes", nNotes ? `${nNotes} note${nNotes === 1 ? "" : "s"}` : "");
      $(".ru-md").value = toMarkdown();
      $(".ru-store").textContent = R.storage === "localStorage" ? `Saved in this browser (${O.generated ? "options read " + O.generated.slice(0, 10) : "no options file"}).` : "This browser limits storage here: copy before you close the tab.";
    }
    function toMarkdown() {
      const L = [];
      const now = new Date();
      L.push(`# Yarn i7 · review round-up`, `_Copied ${now.toISOString().slice(0, 16).replace("T", " ")} from review.html_`, "");
      // choices
      const changed = [], confirmed = [], unpicked = [];
      for (const g of OPEN) {
        const c = d.choices[g.scope]?.[g.param];
        if (!c) { unpicked.push(g); continue; }
        (c.v === (g.default ?? "") ? confirmed : changed).push({ g, c });
      }
      for (const [scope, o] of Object.entries(d.choices)) for (const [param, c] of Object.entries(o || {})) {
        const g = BY_ID.get(`${scope}:${param}`);
        if (g && g.open) continue;
        const gg = g || { id: `${scope}:${param}`, scope, param, label: param, default: undefined, options: [] };
        (c.v === gg.default ? confirmed : changed).push({ g: gg, c, earlier: true });
      }
      const line = ({ g, c, earlier }) => {
        const n = d.notes.opt[g.id]?.text;
        return `- **${g.label}** \`${g.param}=${c.v}\`: ${valLabel(g, c.v)}${c.v !== g.default && g.default !== undefined ? ` (default: ${valLabel(g, g.default)})` : ""}${earlier ? " · an Earlier option" : ""}${n ? `\n  - Note: ${md1(n)}` : ""}`;
      };
      const byScope = (list) => {
        const out = [];
        const scopes = [...new Set(list.map((x) => x.g.scope))].sort((a, b) => (SECTIONS.indexOf(a) + 99) % 99 - (SECTIONS.indexOf(b) + 99) % 99);
        for (const s of scopes) { out.push(`**${secName(s)}**`); list.filter((x) => x.g.scope === s).forEach((x) => out.push(line(x))); }
        return out;
      };
      L.push("## ⚙ Choices");
      if (changed.length) L.push("", "### Changed from the default", ...byScope(changed));
      if (confirmed.length) L.push("", "### Confirmed defaults", ...byScope(confirmed));
      if (!changed.length && !confirmed.length) L.push("", "_No picks._");
      if (unpicked.length) L.push("", `### Not picked yet (default stands)`, unpicked.map((g) => `${g.label} \`${g.param}\``).join(" · "));
      // questions
      L.push("", "## Questions");
      const asks = Q.filter((q) => q.kind === "ask");
      const answered = asks.filter((q) => d.answers[q.id]?.v || d.answers[q.id]?.note);
      answered.forEach((q) => {
        const a = d.answers[q.id];
        const opt = q.options.find(([v]) => v === a.v);
        L.push(`- **${q.area}** · ${q.q}\n  → ${opt ? `**${opt[1]}** \`${q.id}=${a.v}\`${q.rec ? (q.rec === a.v ? " (as suggested)" : ` (suggested: ${q.options.find(([v]) => v === q.rec)?.[1] || q.rec})`) : ""}` : "_no pick_"}${a.note ? `\n  - Note: ${md1(a.note)}` : ""}`);
      });
      const open = asks.filter((q) => !answered.includes(q));
      if (open.length) L.push(`- _Not answered (${open.length}):_ ${open.map((q) => `\`${q.id}\``).join(" · ")}`);
      const cuts = Q.filter((q) => q.kind === "cut");
      if (cuts.length) {
        L.push("", "### Suggested cuts");
        cuts.forEach((q) => { const a = d.answers[q.id] || {}; const kept = a.v === "keep"; L.push(`- ${kept ? `**Keep** ${q.q}` : `~~${q.q}~~ → cut`} \`${q.param}=${q.value}\`${a.note ? `\n  - Note: ${md1(a.note)}` : ""}`); });
      }
      const settles = Q.filter((q) => q.kind === "settle");
      if (settles.length) {
        L.push("", "### Just settle it");
        settles.forEach((q) => { const a = d.answers[q.id] || {}; const g = O.groups.find((x) => x.param === q.param); L.push(`- ${q.q} \`${q.param}=${q.value}\` (${valLabel(g, q.value)}) → ${a.v === "agree" ? "**Agree**" : a.v === "compare" ? "**Keep comparing**" : "_no answer_"}${a.note ? `\n  - Note: ${md1(a.note)}` : ""}`); });
      }
      // notes by page
      const pages = allNotes();
      L.push("", "## Notes");
      if (!pages.length) L.push("", "_No notes._");
      for (const [path, list] of pages) {
        L.push("", `### ${pageName(path)} (\`${path}\`)`);
        list.filter((n) => n.type === "page").forEach((n) => L.push(`- **The page:** ${md1(n.text)}`));
        list.filter((n) => n.type === "opt").forEach((n) => L.push(`- **Option “${n.label}”** \`${n.param}\`${n.scope === "kit" ? " (every page)" : ""}: ${md1(n.text)}`));
        list.filter((n) => n.type === "el").forEach((n, i) => L.push(`- **Pin ${i + 1} · ${n.kind}${n.label ? ` “${n.label}”` : ""}**: ${md1(n.text)}\n  - \`${n.sel}\` · at \`${n.url || n.page}\`${choicesStr(n.choices) ? ` · with ${choicesStr(n.choices)}` : ""}`));
      }
      return L.join("\n") + "\n";
    }

    function renderAll(focus) {
      d = R.load();
      renderDecisions(); renderQuestions(); renderNotes(); counts();
      $$(".ru-ta").forEach(grow);
      if (focus) { const el = root.querySelector(focus); el?.focus({ preventScroll: true }); if (el?.tagName === "TEXTAREA") el.setSelectionRange(el.value.length, el.value.length); }
    }
    const fits = CSS.supports?.("field-sizing", "content");
    function grow(ta) { if (fits) return; ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight + 2, 320) + "px"; }

    /* ---------- events ---------- */
    root.addEventListener("click", async (e) => {
      const a = e.target.closest("[data-act]");
      if (!a) return;
      const act = a.dataset.act;
      const opt = a.closest(".ru-opt"), qn = a.closest(".ru-q");
      const g = opt && BY_ID.get(opt.dataset.id);
      const qq = qn && Q.find((x) => x.id === qn.dataset.q);
      const sel = (s) => `[data-${opt ? "id" : "q"}="${CSS.escape(opt ? opt.dataset.id : qn.dataset.q)}"] ${s}`;
      if (act === "pick" && g) {
        if (a.getAttribute("aria-pressed") === "true") R.forgetChoice(g.scope, g.param);
        else R.setChoice(g.scope, g.param, a.dataset.v, g.pages[0]);
        renderAll(sel(`[data-v="${CSS.escape(a.dataset.v)}"]`));
      } else if (act === "unpick") {
        R.forgetChoice(a.dataset.scope, a.dataset.param); renderAll();
      } else if (act === "answer" && qq) {
        const off = a.getAttribute("aria-pressed") === "true";
        R.update((x) => { const cur = x.answers[qq.id] || {}; x.answers[qq.id] = { ...cur, v: off ? "" : a.dataset.v, at: Date.now() }; });
        renderAll(sel(`[data-v="${CSS.escape(a.dataset.v)}"]`));
      } else if (act === "keep" && qq) {
        const kept = a.getAttribute("aria-pressed") === "true";
        R.update((x) => { const cur = x.answers[qq.id] || {}; x.answers[qq.id] = { ...cur, v: kept ? "" : "keep", at: Date.now() }; });
        renderAll(sel(".ru-keep"));
      } else if (act === "onote" && g) {
        const k = "opt:" + g.id;
        if (openNotes.has(k) && !d.notes.opt[g.id]) openNotes.delete(k); else openNotes.add(k);
        renderAll(openNotes.has(k) ? sel("textarea") : sel(".ru-pen"));
      } else if (act === "qnote" && qq) {
        const k = "q:" + qq.id;
        if (openNotes.has(k) && !d.answers[qq.id]?.note) openNotes.delete(k); else openNotes.add(k);
        renderAll(openNotes.has(k) ? sel("textarea") : sel(".ru-pen"));
      } else if (act === "delnote") {
        R.update((x) => { x.notes.el = x.notes.el.filter((n) => n.id !== a.dataset.id); });
        renderAll();
      } else if (act === "copy") {
        copy(a);
      } else if (act === "clear") {
        const n = R.countChoices(R.load()) + Object.keys(d.answers).length + Object.keys(d.notes.page).length + Object.keys(d.notes.opt).length + d.notes.el.length;
        if (!confirm(`Clear everything? This forgets ${n ? "all your" : "your"} ⚙ picks, answers and notes on every page, and can't be undone.\n\nTip: Copy everything first.`)) return;
        R.update((x) => { x.choices = {}; x.answers = {}; x.notes = { page: {}, opt: {}, el: [] }; });
        openNotes.clear();
        renderAll();
        status("Cleared.");
      }
    });
    root.addEventListener("input", (e) => {
      const ta = e.target.closest(".ru-ta");
      if (!ta) return;
      grow(ta);
      const k = ta.dataset.key, v = ta.value, now = Date.now();
      const has = !!txt(v);
      R.update((x) => {
        if (ta.dataset.note === "opt") {
          const g = BY_ID.get(k), prev = x.notes.opt[k] || {};
          if (has) x.notes.opt[k] = { ...prev, text: v, label: prev.label || g?.label || k, scope: prev.scope || g?.scope, param: prev.param || g?.param, page: prev.page || g?.pages[0] || "review.html", url: prev.url || g?.try || "", at: now };
          else delete x.notes.opt[k];
        } else if (ta.dataset.note === "q") {
          const cur = x.answers[k] || {};
          x.answers[k] = { ...cur, note: v, at: now };
        } else if (ta.dataset.note === "page") {
          if (has) x.notes.page[k] = { ...(x.notes.page[k] || {}), text: v, at: now }; else delete x.notes.page[k];
        } else if (ta.dataset.note === "el") {
          const n = x.notes.el.find((y) => y.id === k);
          if (n) { n.text = v; n.at = now; }
          if (!has) x.notes.el = x.notes.el.filter((y) => y.id !== k);
        }
      });
      d = R.load();
      ta.closest(".ru-opt, .ru-q")?.querySelector(".ru-pen")?.classList.toggle("has-note", has);
      counts();
    });

    function status(msg) { const s = $(".ru-copy__status"); if (s) { s.textContent = msg; } }
    async function copy(btn) {
      d = R.load();
      const md = toMarkdown();
      const box = $(".ru-md");
      box.value = md;
      let ok = false;
      try { if (navigator.clipboard && window.isSecureContext !== false) { await navigator.clipboard.writeText(md); ok = true; } } catch (_) {}
      if (!ok) {
        $(".ru-md-box").open = true;
        box.focus(); box.select();
        try { ok = document.execCommand("copy"); } catch (_) {}
      }
      status(ok ? "Copied: paste it into the chat." : "Selected: press ⌘C (Ctrl+C) to copy.");
      if (ok && window.Yarn?.toast) try { window.Yarn.toast({ icon: "check", html: "Copied the round-up" }); } catch (_) {} // (i7 · C1: it passed a string, so the kit's toast showed empty)
      if (btn.closest(".yhead") && !ok) document.getElementById("copy").scrollIntoView({ block: "start" });
    }

    // another tab (a page's ⚙ or pins) changed the store: refresh, unless you're typing here
    let pending = false;
    addEventListener("storage", (e) => {
      if (e.key !== R.KEY) return;
      if (document.activeElement?.matches?.(".ru-ta")) { pending = true; return; }
      renderAll();
    });
    root.addEventListener("focusout", () => { if (pending) setTimeout(() => { if (!document.activeElement?.matches?.(".ru-ta")) { pending = false; renderAll(); } }, 0); });
    addEventListener("pageshow", (e) => { if (e.persisted) renderAll(); });

    renderAll();
    if (location.hash) document.querySelector(location.hash)?.scrollIntoView();
  }
})();
