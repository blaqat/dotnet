/* ============================================================
   Studio · screens: sign-in, dashboard, content lists, history,
   media library, plus the New and Import-from-Notion sheets.
   (editors live in studio-editors.js / studio-tiers.js)
   ============================================================ */
(() => {
  "use strict";
  const S = window.Studio, Y = window.Yarn, D = window.StudioData;
  const { $, $$, esc } = S;

  /* ============================================================
     SIGN-IN GATE (mock Cloudflare Access: email → one-time code)
     ?screen=signin&step=email|code|denied
     ============================================================ */
  S.screens.signin = {
    nav: false, title: () => "Sign in",
    render(view, q) {
      const step = ["email", "code", "denied"].includes(q.get("step")) ? q.get("step") : "email";
      const email = q.get("email") || (step === "denied" ? "aiden.g@gmail.com" : "aiden@blaqat.net");
      const thread = `<svg class="st-gate__thread" viewBox="0 0 120 70" aria-hidden="true" style="--ply: var(--red); --ply-shade: rgba(255,255,255,.35)">
        <path class="ply-base" d="M48 -4 C44 22 54 44 57 68" stroke-width="4"/><path class="ply-twist" d="M48 -4 C44 22 54 44 57 68" stroke-width="4"/>
        <path class="ply-base" d="M74 -4 C78 24 66 46 63 68" stroke-width="4"/><path class="ply-twist" d="M74 -4 C78 24 66 46 63 68" stroke-width="4"/></svg>`;
      const body = {
        email: `<p>This part of the site is private. Enter the email on the allow-list and we'll send you a one-time code.</p>
          <form class="st-field" data-form="email" novalidate>${S.f.text({ email }, "email", { label: "Email", type: "email", placeholder: "you@example.com", autocomplete: "email", inputmode: "email" })}
            <button class="btn btn--red" type="submit"><i class="ph-bold ph-envelope-simple" aria-hidden="true"></i><span>Email me a code</span></button></form>
          <p class="st-or">or</p>
          <button type="button" class="btn" data-github><i class="ph-bold ph-github-logo" aria-hidden="true"></i><span>Continue with GitHub</span></button>`,
        code: `<p>We sent a 6-digit code to <b>${esc(email)}</b>. It works for 10 minutes.</p>
          <form data-form="code" novalidate><fieldset class="st-pin" style="border:0;margin:0;padding:0"><legend class="sr-only">One-time code</legend>${[0, 1, 2, 3, 4, 5].map((i) => `<input class="yfield st-in" inputmode="numeric" pattern="[0-9]*" maxlength="1" aria-label="Digit ${i + 1}" ${i === 0 ? 'autocomplete="one-time-code"' : 'autocomplete="off"'} value="${q.get("demo") === "code" && i < 4 ? "4729"[i] : ""}">`).join("")}</fieldset></form>
          <button type="button" class="btn btn--red" data-verify><i class="ph-bold ph-lock-key-open" aria-hidden="true"></i><span>Open the studio</span></button>
          <p class="st-gate__foot"><button type="button" class="ylinkbtn" data-back>Use a different email</button><span aria-hidden="true">·</span><span data-resend>Resend in 0:24</span></p>`,
        denied: `<div class="st-gate__denied" role="alert"><i class="ph-bold ph-hand-palm" aria-hidden="true"></i><div><b>That email isn't on the list</b>${esc(email)} can't open the studio. Only the owner's addresses can sign in.</div></div>
          <button type="button" class="btn" data-back><i class="ph-bold ph-arrow-left" aria-hidden="true"></i><span>Try another email</span></button>`,
      }[step];
      view.innerHTML = `<div class="st-gate"><div class="st-gate__hang">
        <div class="st-gate__brand">${Y.catSVG("", "var(--ink)")}<b>blaqat<i>.</i>net</b><span class="st-label" aria-hidden="true"><i class="ph-fill ph-lock-simple"></i>Studio</span></div>
        ${thread}
        <section class="st-tagcard patch" aria-labelledby="gate-t">
          ${Y.header({ title: step === "code" ? "Check your email" : "Studio", id: "gate-t" })}
          ${body}
          <p class="st-gate__foot"><i class="ph-bold ph-shield-check" aria-hidden="true"></i>Behind Cloudflare Access · 24-hour sessions</p>
        </section></div></div>`;
      if (step === "denied") Y.sound("nope");
      const card = $(".st-tagcard", view);
      // swing in like a tag on a thread (critically damped, from a small tilt)
      if (!Y.reduced()) { const sp = Y.springEasing({ response: 0.7, damping: 0.55 }); card.style.transformOrigin = "50% 0"; card.animate([{ transform: "rotate(-4deg)" }, { transform: "none" }], { duration: sp.duration, easing: sp.easing }); }
      $("[data-form=email]", view)?.addEventListener("submit", (e) => {
        e.preventDefault();
        const v = $("input", e.currentTarget).value.trim();
        if (!/^\S+@\S+\.\S+$/.test(v)) { $("input", e.currentTarget).setAttribute("aria-invalid", "true"); Y.sound("nope"); S.say("Enter an email address"); return; }
        S.go("signin", { step: /@blaqat\.net$/i.test(v) ? "code" : "denied", email: v }, { replace: true });
      });
      $("[data-github]", view)?.addEventListener("click", () => S.go("dashboard"));
      $$("[data-back]", view).forEach((b) => b.addEventListener("click", () => S.go("signin", { step: "email" }, { replace: true })));
      const pins = $$(".st-pin input", view);
      const verify = () => {
        const code = pins.map((p) => p.value).join("");
        if (code.length < 6) { pins.find((p) => !p.value)?.focus(); Y.sound("nope"); S.say("Enter all 6 digits"); return; }
        S.go("dashboard");
      };
      pins.forEach((p, i) => {
        p.addEventListener("input", () => { p.value = p.value.replace(/\D/g, "").slice(-1); if (p.value && pins[i + 1]) pins[i + 1].focus(); if (pins.every((x) => x.value)) verify(); });
        p.addEventListener("keydown", (e) => { if (e.key === "Backspace" && !p.value && pins[i - 1]) { pins[i - 1].focus(); pins[i - 1].value = ""; } });
        p.addEventListener("paste", (e) => { const d = (e.clipboardData?.getData("text") || "").replace(/\D/g, "").slice(0, 6); if (!d) return; e.preventDefault(); pins.forEach((x, j) => (x.value = d[j] || "")); (pins[d.length] || pins[5]).focus(); if (d.length === 6) verify(); });
      });
      $("[data-verify]", view)?.addEventListener("click", verify);
      if (pins.length) (pins.find((p) => !p.value) || pins[0]).focus({ preventScroll: true });
      // resend countdown
      const rs = $("[data-resend]", view);
      if (rs) { let n = 24; const t = setInterval(() => { n--; if (!rs.isConnected) return clearInterval(t); rs.innerHTML = n > 0 ? `Resend in 0:${String(n).padStart(2, "0")}` : `<button type="button" class="ylinkbtn">Resend code</button>`; if (n <= 0) clearInterval(t); }, 1000); S.onLeave(() => clearInterval(t)); }
    },
  };

  /* ============================================================
     DASHBOARD
     ============================================================ */
  S.pubCount = (state, n, word) => S.pub(state, { text: `${n} ${word || S.PUB[state].label.toLowerCase()}` });
  const counts = (sec) => { const it = S.items(sec); return { live: it.filter((x) => x._pub === "live").length, changed: it.filter((x) => x._pub === "changed").length, draft: it.filter((x) => x._pub === "draft").length, all: it.length }; };

  function fan(sec) {
    const it = S.items(sec).slice().sort((a, b) => b._edited - a._edited);
    if (sec === "projects") return it.filter((p) => (p.images || []).some((m) => S.url(m.src) && !S.isVideo(m.src))).slice(0, 4).map((p) => { const m = p.images.find((x) => S.url(x.src) && !S.isVideo(x.src)); return `<img class="st-fan__img" src="${S.url(m.src)}" alt="" loading="lazy">`; }).join("");
    if (sec === "music") return it.slice(0, 5).map((m) => S.swatch(m, { size: 46 })).join("");
    if (sec === "thoughts") return Object.entries(S.TTYPES).map(([k, t]) => `<span class="st-fan__ic" title="${t.label}"><i class="ph-bold ${t.icon}" aria-hidden="true"></i></span>`).join("");
    return `<span class="st-fan__words">${esc(S.data.home.hello)} a <span class="yscribble" style="--scribble: var(--blue)">software engineer</span>…</span>`;
  }
  function secCard(sec) {
    const c = counts(sec), info = S.SECTIONS[sec];
    const last = S.items(sec).slice().sort((a, b) => b._edited - a._edited)[0];
    const href = sec === "home" ? S.href("home") : S.href("list", { section: sec });
    const newHref = { projects: S.href("project", { id: "new" }), music: S.href("music", { id: "new" }), thoughts: null, home: null }[sec];
    const add = sec === "thoughts" ? `<button type="button" class="btn btn--sm btn--icon st-seccard__add" data-new="thoughts" aria-label="New post"><i class="ph-bold ph-plus" aria-hidden="true"></i></button>`
      : newHref ? `<a class="btn btn--sm btn--icon st-seccard__add" href="${newHref}" aria-label="New ${info.one}"><i class="ph-bold ph-plus" aria-hidden="true"></i></a>` : "";
    // a kit card (.ycard.ylift) whose name is its stretched opener ([data-ylift-own]: pressing the + presses only the +)
    return `<article class="ycard ylift st-seccard" data-section="${sec}">
      <div class="st-seccard__top"><span class="ydot" aria-hidden="true"><i class="ph-bold ${info.icon}"></i></span><h3 class="st-seccard__name"><a href="${href}" data-ylift-own>${info.label}</a></h3>${add}</div>
      <div class="st-fan" aria-hidden="true">${fan(sec)}</div>
      <div class="ymeta ymeta--facts st-seccard__counts">${sec === "home" ? S.pub(S.data.home._pub) : `${S.pubCount("live", c.live)}${c.changed ? S.pubCount("changed", c.changed, "with edits") : ""}${c.draft ? S.pubCount("draft", c.draft, c.draft === 1 ? "draft" : "drafts") : ""}`}</div>
      <p class="st-seccard__last">${last ? `Last touched <b>${esc(S.titleOf(last))}</b> <span class="meta">${S.ago(last._edited)}</span>` : ""}</p>
    </article>`;
  }
  S.screens.dashboard = {
    title: () => "Dashboard", navKey: () => "studio",
    render(view) {
      const lib = S.library(), orph = lib.filter((f) => !f.uses.length), used = lib.reduce((n, f) => n + f.size, 0);
      const drafts = ["projects", "music", "thoughts"].flatMap((sec) => S.items(sec).filter((x) => x._pub !== "live").map((x) => ({ sec, x }))).sort((a, b) => b.x._edited - a.x._edited);
      const lastPub = S.data.activity.find((a) => a.live);
      // activity grouped by day on the kit timeline
      const groups = [];
      for (const a of S.data.activity.slice(0, 9)) { const l = S.dayLabel(a.t); let g = groups.find((x) => x.year === l); if (!g) groups.push((g = { year: l, items: [] })); g.items.push(a); }
      const act = (a) => {
        const it = a.id !== "" ? S.find(a.section, a.id) : null;
        const href = it ? S.editHref(a.section, it) : a.section === "media" ? S.href("media") : "";
        const inner = `${esc(a.verb)} <b>${esc(a.title)}</b><span class="meta">${S.dot(a.section, a.section === "thoughts" && it ? S.secIcon("thoughts", it) : null)}${S.clock(a.t)}${a.live ? " · live" : ""}</span>`;
        return href ? `<a class="st-act" href="${href}">${inner}</a>` : `<span class="st-act">${inner}</span>`;
      };
      view.innerHTML = `<div class="st-wrap">
        ${Y.header({ title: "Studio", meta: `hi aiden · ${Y.fmt.full(new Date(S.now()))}`, actions: `<button type="button" class="btn btn--ghost st-hide-m" data-notion><i class="ph-bold ph-arrow-square-in" aria-hidden="true"></i><span>Import from Notion</span></button><button type="button" class="btn btn--red st-hide-m" data-new><i class="ph-bold ph-plus" aria-hidden="true"></i><span>New</span></button>` })}
        <section class="st-strip patch" aria-label="Site status">
          <span class="st-strip__live"><span class="st-strip__dot" aria-hidden="true"></span>blaqat.net is live</span>
          <p class="meta">last publish ${lastPub ? S.ago(lastPub.t) : "—"} · no redeploys needed</p>
          <div class="st-strip__store"><span class="meta">media ${S.bytes(used)} of 10 GB</span><span class="st-meter" role="meter" aria-label="Storage used" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(used / 1e8)}"><b style="--v:${Math.max(3, used / 1e8).toFixed(1)}%"></b></span></div>
          <a class="btn btn--sm st-strip__orph" href="${S.href("media", { usage: "orphaned" })}"><i class="ph-bold ph-scissors" aria-hidden="true"></i><span>${orph.length} unused file${orph.length === 1 ? "" : "s"}</span></a>
        </section>
        <div class="st-dash">
          <section class="st-dash__secs" aria-labelledby="secs-h">
            <div class="st-eyebrow-row"><h2 class="eyebrow" id="secs-h">Sections</h2></div>
            <div class="st-secs">${["projects", "music", "thoughts", "home"].map(secCard).join("")}</div>
          </section>
          <section class="st-dash__drafts" aria-labelledby="drafts-h">
            <div class="st-eyebrow-row"><h2 class="eyebrow" id="drafts-h">On the needles <span class="meta">${drafts.length} unpublished</span></h2></div>
            <ul class="st-drafts">${drafts.map(({ sec, x }) => `<li><a class="yrow ylift st-drow" href="${S.editHref(sec, x)}" data-section="${sec}">${S.dot(sec, S.secIcon(sec, x))}<span class="st-drow__t"><b>${esc(S.titleOf(x))}</b><span class="ymeta ymeta--facts">${S.pub(x._pub)}${sec === "thoughts" ? S.TTYPE_FACT(x.type) : Y.fact.text(S.SECTIONS[sec].icon, S.SECTIONS[sec].label.replace(/s$/, ""), { cls: "st-secf" })}<span class="meta st-ago">${x._pub === "draft" ? "autosaved" : "edited"} ${S.ago(x._edited)}</span></span></span><i class="ph-bold ph-caret-right st-go" aria-hidden="true"></i></a></li>`).join("")}</ul>
          </section>
          <aside class="st-recent" aria-label="Recent activity">
            <div class="st-eyebrow-row"><h2 class="eyebrow">Recently</h2></div>
            ${Y.timelineHTML(groups, act, { key: (a) => String(a.t), unit: "change", cls: "ytl--sm" })}
          </aside>
        </div>
      </div>`;
      S.fab({ label: "New", onClick: (b) => S.openNew(b) }); // phones: the floating "+" on the kit's layer
      Y.timeline($(".ytl", view), { ball: false });
      view.addEventListener("click", (e) => {
        const n = e.target.closest("[data-new]"); if (n) { S.openNew(n, n.dataset.new || ""); return; }
        const m = e.target.closest("[data-notion]"); if (m) S.openNotion(m);
      });
    },
  };

  /* ---------- New: "what are you making?" ---------- */
  S.openNew = (from, only = "") => {
    const opt = (sec, icon, label, small, href) => `<a class="ycard ylift st-newopt" href="${href}" data-section="${sec}">${S.dot(sec, icon)}<span><b>${label}</b><small>${small}</small></span></a>`;
    const groups = [
      ["projects", "Projects", [opt("projects", "ph-folder-simple", "Project", "media first, then the details", S.href("project", { id: "new" }))]],
      ["music", "Music", [opt("music", "ph-music-note", "Single", "upload a track, get a waveform", S.href("music", { id: "new" })), opt("music", "ph-folder-simple", "Collection", "a folder with track tabs", S.href("music", { id: "new", kind: "collection" }))]],
      ["thoughts", "Thoughts", Object.entries(S.TTYPES).map(([k, t]) => opt("thoughts", t.icon, t.label, t.hint, S.href("compose", { type: k })))],
    ].filter(([k]) => !only || k === only);
    return S.sheet({
      from, title: only === "thoughts" ? "New post" : "Make something", width: 720,
      html: `<div class="st-newgrid">${groups.map(([k, l, opts]) => `<section class="st-newgrp">${only ? "" : `<h3 class="eyebrow">${l}</h3>`}<div class="st-newopts">${opts.join("")}</div></section>`).join("")}
        ${only ? "" : `<p class="st-note"><i class="ph-bold ph-arrow-square-in" aria-hidden="true"></i> Got it in Notion already? <button type="button" class="ylinkbtn" data-notion>Import a page as a draft</button></p>`}</div>`,
      onMount: (s) => s.el.addEventListener("click", (e) => { const n = e.target.closest("[data-notion]"); if (n) { s.close({ silent: true }); S.openNotion(from); } }),
    });
  };

  /* ---------- Import from Notion → a draft article ---------- */
  S.openNotion = (from, step = 1) => {
    const url = "https://www.notion.so/blaqat/Building-the-Studio-2c41e8…";
    const map = [
      ["ph-text-h-two", "3 headings", "## headings"], ["ph-paragraph", "9 paragraphs", "text, bold, links kept"], ["ph-list-bullets", "2 lists", "- lists"],
      ["ph-image", "2 images", "copied to Media, alt text from captions"], ["ph-code", "1 code block", "``` fenced, language kept"], ["ph-caret-circle-right", "1 toggle", "flattened into text"], ["ph-table", "1 database", "skipped: link kept"],
    ];
    const step1 = `${S.f.text({ u: step === 2 ? url : "" }, "u", { label: "Notion page link", placeholder: "https://www.notion.so/…", mono: true, hint: "Read-only through your Notion connection. The page itself never changes." })}`;
    const step2 = `<div class="ycard st-livecard"><span class="st-coll__ic" style="background:var(--tex-twill), var(--ink)"><i class="ph-bold ph-file-text" aria-hidden="true"></i></span><div><b style="font:850 1rem/1.2 var(--font-display)">Building the Studio</b><span class="meta">edited in Notion yesterday · 640 words · 3 min read</span></div></div>
      <h3 class="eyebrow" style="margin:6px 0 0">What comes across</h3>
      <ul class="st-checks">${map.map(([ic, a, b], i) => `<li class="st-check" data-ok="${i === 6 ? "warn" : "true"}"><span class="yfact__i" aria-hidden="true"><i class="ph-bold ${ic}"></i></span><div><b>${a}</b><span>${b}</span></div></li>`).join("")}</ul>`;
    const sh = S.sheet({
      from, title: "Import from Notion", width: 560,
      html: `<div data-step>${step === 2 ? step2 : step1}</div>`,
      foot: `<button type="button" class="btn btn--ghost" data-close>Cancel</button><span class="ydetail__spacer"></span><button type="button" class="btn btn--red" data-act><i class="ph-bold ${step === 2 ? "ph-note-pencil" : "ph-arrow-square-in"}" aria-hidden="true"></i><span>${step === 2 ? "Create draft article" : "Fetch page"}</span></button>`,
      onMount: (s) => {
        let st = step;
        $("[data-act]", s.el).addEventListener("click", (e) => {
          const b = e.currentTarget;
          if (st === 1) {
            const inp = $("input", s.el);
            if (!inp.value.trim()) inp.value = url;
            $("span", b).textContent = "Fetching…"; b.disabled = true;
            setTimeout(() => { st = 2; $("[data-step]", s.el).innerHTML = step2; b.disabled = false; $("span", b).textContent = "Create draft article"; $("i", b).className = "ph-bold ph-note-pencil"; Y.sound("token-add", { el: b }); }, Y.reduced() ? 50 : 700);
            return;
          }
          const post = { id: `a${Date.now().toString(36)}`, type: "article", date: new Date(S.now()).toISOString().slice(0, 16), tags: ["studio"], title: "Building the Studio", dek: "Publishing from my phone, in yarn.", cover: "../media/site-plan.png",
            body: "## Why\n\nI wanted to post a thought **without opening a laptop**.\n\n## How it works\n\n- Content lives in D1, media in R2\n- The site reads at request time, so Publish is live in seconds\n\n```ts\nexport const publish = (id) => db.posts.update(id, { live: true });\n```\n\n> Imported from Notion. Check the images' alt text.\n", _pub: "draft", _edited: S.now(), _order: 0, _from: "notion" };
          S.data.thoughts.unshift(post);
          S.log("Imported from Notion", "thoughts", post, "ph-arrow-square-in");
          S.persist();
          s.close({ silent: true });
          S.go("compose", { type: "article", id: post.id });
          S.toast({ icon: "ph-arrow-square-in", title: "Imported as a draft", text: "2 images went to Media · 1 database was skipped" });
        });
      },
    });
    return sh;
  };

  /* ============================================================
     CONTENT LISTS — search + filter row (kit), drag / keyboard reorder
     ?screen=list&section=projects|music|thoughts (&pub=draft …kit filter params)
     ============================================================ */
  const PUBV = [{ value: "live", label: "Live", icon: "ph-broadcast" }, { value: "changed", label: "Edits", icon: "ph-push-pin" }, { value: "draft", label: "Drafts", icon: "ph-pencil-simple-line" }];
  function listGroups(sec, items) {
    const pub = { key: "pub", label: "Publish", row: true, values: PUBV, get: (it) => it._pub };
    if (sec === "projects") {
      const st = [...new Set(items.map((p) => Y.status(p.status)?.key).filter(Boolean))];
      return [pub, { key: "status", label: "Status", row: true, values: ["ongoing", "complete", "paused", "dropped"].filter((s) => st.includes(s)) }, { key: "type", label: "Type", values: ["Personal", "Work", "School"] }, { key: "stack", label: "Stack", values: [...new Set(items.flatMap((p) => p.stack || []))] }];
    }
    if (sec === "music") return [pub, { key: "kind", label: "Kind", row: true, values: [{ value: "single", label: "Singles", icon: "ph-music-note" }, { value: "collection", label: "Collections", icon: "ph-folder-simple" }], get: (it) => it.type }, { key: "instrument", label: "Instrument", values: ["piano", "beepbox", "daw"] }, { key: "status", label: "Status", values: ["ongoing", "complete", "dropped"] }];
    return [pub, { key: "ttype", label: "Type", row: true, values: Object.entries(S.TTYPES).map(([k, t]) => ({ value: k, label: t.label, icon: t.icon })), get: (it) => it.type }, { key: "tag", label: "Tags", values: [...new Set(items.flatMap((p) => p.tags || []))] }];
  }
  // i7 · studio (S1): a row is the site's own phone row (projects' .pj-mrow: thumb · name · facts, the › at the end), with
  // the publish state + "edited" as Studio's column on the right. Facts = Yarn.cardMeta (icon-only on phones, as on the
  // site); the stack and tags are the display-only hashtags (P1: tags inside a row that opens something don't filter).
  const phoneMQ = matchMedia("(max-width: 959px)");
  function rowHTML(sec, it, i, n) {
    const title = esc(S.titleOf(it)), compact = phoneMQ.matches;
    let sub = S.itemMeta(sec, it, { compact });
    if (sec === "projects" && (it.stack || []).length && !compact) sub += Y.stackTags(it.stack, { as: "span", max: 3, tag: "span" });
    if (sec === "thoughts" && !compact) sub += S.hashtags(it.tags);
    const extra = sec === "music" && it.songs ? `<small>${it.songs.length} tracks</small>` : sec === "thoughts" && it.type === "tierlist" ? `<small>${Object.values(it.tiers || {}).flat().length} ranked</small>` : "";
    return `<li class="st-li" data-key="${esc(it.id)}">
      <button type="button" class="st-grip" aria-pressed="false" aria-label="Reorder ${title}, position ${i + 1} of ${n}" aria-describedby="st-reorder-help" data-nohint><i class="ph-bold ph-dots-six-vertical" aria-hidden="true"></i></button>
      <a class="yrow ylift st-row" href="${S.editHref(sec, it)}">${S.thumb(sec, it)}
        <span class="st-row__main"><span class="st-row__title"><span>${sec === "thoughts" && it.type === "scratch" ? `“${title}”` : title}</span>${extra}</span><span class="st-row__sub">${sub}</span></span>
        <span class="st-row__side">${S.pub(it._pub, { compact })}<span class="meta st-ago">${S.ago(it._edited)}</span></span><i class="ph-bold ph-caret-right st-go" aria-hidden="true"></i></a></li>`;
  }
  S.screens.list = {
    section: (q) => (["projects", "music", "thoughts"].includes(q.get("section")) ? q.get("section") : "projects"),
    title: (q) => S.SECTIONS[S.screens.list.section(q)].label,
    render(view, q) {
      const sec = this.section(q), info = S.SECTIONS[sec];
      const items = S.items(sec);
      const manualOK = sec !== "thoughts";
      let sort = manualOK ? (q.get("sort") === "edited" ? "edited" : "order") : "date";
      const c = counts(sec);
      const newBtn = sec === "thoughts" ? `<button type="button" class="btn btn--red st-hide-m" data-new="thoughts"><i class="ph-bold ph-plus" aria-hidden="true"></i><span>New post</span></button>`
        : `<a class="btn btn--red st-hide-m" href="${S.href(sec === "projects" ? "project" : "music", { id: "new" })}"><i class="ph-bold ph-plus" aria-hidden="true"></i><span>New ${info.one}</span></a>`;
      view.innerHTML = `<div class="st-wrap">
        ${Y.header({ title: info.label, meta: `${c.all} · ${c.live} live${c.changed ? ` · ${c.changed} with edits` : ""}${c.draft ? ` · ${c.draft} draft${c.draft > 1 ? "s" : ""}` : ""}`, actions: `${manualOK ? Y.seg([{ value: "order", label: "Site order", icon: "ph-arrows-down-up" }, { value: "edited", label: "Recent", icon: "ph-clock" }], { value: sort, label: "Sort", name: "sort" }) : ""}${newBtn}` })}
        <div class="st-listhead ytools"><div data-search></div><div data-row></div></div>
        <div class="st-orderbar patch" data-orderbar role="group" aria-label="New order" hidden><p>${S.pub("changed", { text: "New order saved" })}<span class="meta">not live yet</span></p><button type="button" class="btn btn--ghost btn--sm" data-undo>Undo</button><button type="button" class="btn btn--red btn--sm st-pubbtn" data-puborder><i class="ph-bold ph-paper-plane-tilt" aria-hidden="true"></i><span>Publish order</span></button></div>
        <p class="st-note st-lockhint" data-lock hidden><i class="ph-bold ph-lock-simple" aria-hidden="true"></i> ${manualOK ? "Clear the search and filters (and sort by Site order) to drag things into a new order." : "Thoughts are ordered by date. Reorder picks inside a collection from the Pick composer."}</p>
        <p class="sr-only" id="st-reorder-help">Drag the handle, or press Space to pick up, arrow keys to move, Space to drop, Escape to cancel.</p>
        <ol class="st-list" data-list aria-label="${info.label}"></ol>
        ${Y.empty({ title: "Nothing matches", action: { label: "Clear filters", attrs: "data-clearall" }, attrs: "data-empty", hidden: true })}
      </div>`;
      // phones: the floating "+" (kit layer), the search knob waits left of it on the same row
      S.fab(sec === "thoughts" ? { label: "New post", onClick: (b) => S.openNew(b, "thoughts") } : { label: `New ${info.one}`, href: S.href(sec === "projects" ? "project" : "music", { id: "new" }) });
      const list = $("[data-list]", view);
      const byId = new Map(items.map((x) => [String(x.id), x]));
      const F = Y.filters({ groups: listGroups(sec, items), items, url: true });
      // the row first, so the search knows those groups already have chips (no duplicate tokens)
      Y.filterRow($("[data-row]", view), F);
      Y.search($("[data-search]", view), F, { placeholder: `Search ${info.label.toLowerCase()}…` });
      // the kit's one mobile pattern (?msearch=bar|fab); the search FAB stacks above Studio's "New" button
      Y.listTools(F, { tools: $(".st-listhead", view), search: $("[data-search]", view), row: $("[data-row]", view), sticky: list, stickyDesk: true,
        label: `Search and filter ${info.label.toLowerCase()}`, title: `Find ${info.label.toLowerCase()}`, count: () => `${items.filter((x) => F.test(x)).length} of ${items.length} shown` });
      const ordered = () => {
        const a = items.slice();
        if (sort === "order") a.sort((x, y) => x._order - y._order);
        else if (sort === "edited") a.sort((x, y) => y._edited - x._edited);
        else a.sort((x, y) => (y.date || "").localeCompare(x.date || ""));
        return a;
      };
      function paint() {
        const arr = ordered();
        if (sec === "thoughts") {
          // month pills between rows, like the public feed
          let last = "";
          list.innerHTML = arr.map((it, i) => { const m = Y.fmt.monthLong(new Date(it.date)); const pill = m !== last ? `<li class="st-month" data-month="${m}" aria-hidden="true">${Y.yearPill(m, { level: 3 })}</li>` : ""; last = m; return pill + rowHTML(sec, it, i, arr.length); }).join("");
        } else list.innerHTML = arr.map((it, i) => rowHTML(sec, it, i, arr.length)).join("");
        apply();
      }
      const canReorder = () => manualOK && sort === "order" && !F.any();
      function apply() {
        let shown = 0;
        $$(".st-li:not([inert])", list).forEach((li) => { const it = byId.get(li.dataset.key); const ok = !!it && F.test(it); li.hidden = !ok; if (ok) shown++; });
        $$(".st-month", list).forEach((m) => { let n = m.nextElementSibling, any = false; while (n && !n.classList.contains("st-month")) { if (!n.hidden) any = true; n = n.nextElementSibling; } m.hidden = !any; });
        $("[data-empty]", view).hidden = shown > 0;
        const lock = !canReorder();
        list.classList.toggle("is-locked", lock);
        list.classList.toggle("is-fixed", !manualOK); // Thoughts: ordered by date, never dragged → no grip column at all
        $$(".st-grip", list).forEach((g) => (g.disabled = lock));
        $("[data-lock]", view).hidden = !(lock && (F.any() || sort !== "order" || !manualOK));
      }
      paint();
      F.on(() => Y.flip(list, ".st-li, .st-month", apply));
      // the facts go icon-only on phones (as on the site): repaint the rows when the window crosses 960
      const onMQ = () => { if (!held) paint(); };
      phoneMQ.addEventListener("change", onMQ);
      S.onLeave(() => phoneMQ.removeEventListener("change", onMQ));
      view.addEventListener("ychange", (e) => {
        if (e.detail.name !== "sort") return;
        sort = e.detail.value;
        const u = new URL(location.href); sort === "order" ? u.searchParams.delete("sort") : u.searchParams.set("sort", sort); history.replaceState(history.state, "", u);
        Y.flip(list, ".st-li", paint);
      });
      view.addEventListener("click", (e) => {
        const n = e.target.closest("[data-new]"); if (n) S.openNew(n, "thoughts");
        if (e.target.closest("[data-clearall]")) F.clear();
      });

      /* ---- reorder: pointer (handle) ---- */
      let before = null;
      const snapshot = () => $$(".st-li", list).map((li) => li.dataset.key);
      // i7 · W1: the grips' "position n of N" follow every order change, Undo included (it left them stale)
      const relabel = () => { const lis = $$(".st-li", list); lis.forEach((li, i) => $(".st-grip", li).setAttribute("aria-label", `Reorder ${S.titleOf(byId.get(li.dataset.key))}, position ${i + 1} of ${lis.length}`)); };
      const commit = (prev) => {
        const keys = snapshot();
        keys.forEach((k, i) => (byId.get(k)._order = i + 1));
        relabel();
        before = before || prev;
        const bar = $("[data-orderbar]", view);
        if (bar.hidden) { bar.hidden = false; if (!Y.reduced()) bar.animate([{ opacity: 0, transform: "translateY(-6px) scale(.98)" }, { opacity: 1, transform: "none" }], { duration: 260, easing: "cubic-bezier(.2,.8,.2,1)" }); }
        S.persist();
      };
      if (manualOK && window.TierDrag) {
        let start = null;
        window.TierDrag.create({
          root: list, layer: S.layer(), itemSel: ".st-li", handle: ".st-grip",
          enabled: canReorder, items: () => $$(".st-li", list), zones: () => [{ zone: list, hit: list }],
          onStart: (li) => { start = snapshot(); Y.sound("pickup", { el: li }); },
          onDrop: (li, info) => { Y.sound("drop", { el: li }); if (info.from.index !== info.to.index) { commit(start); S.say(`Moved to position ${info.to.index + 1}`); } },
        });
      }
      /* ---- reorder: keyboard (Space/Enter pick up, arrows move, Space drop, Esc cancel) ---- */
      let held = null;
      const setHeld = (li, on) => { const g = $(".st-grip", li); g.setAttribute("aria-pressed", String(on)); $(".yrow", li).classList.toggle("is-selected", on); $(".yrow", li).classList.toggle("ysel", on); };
      list.addEventListener("click", (e) => {
        const g = e.target.closest(".st-grip");
        if (!g || e.detail !== 0 || g.disabled) return; // keyboard / assistive "click" only; mouse drags
        const li = g.closest(".st-li");
        if (!held) { held = { li, from: snapshot() }; setHeld(li, true); Y.sound("pickup", { el: li }); S.say(`Picked up ${S.titleOf(byId.get(li.dataset.key))}. Arrow keys to move, Space to drop, Escape to cancel.`); }
        else { const h = held; held = null; setHeld(h.li, false); Y.sound("drop", { el: h.li }); if (h.from.join() !== snapshot().join()) commit(h.from); S.say(`Dropped at position ${snapshot().indexOf(h.li.dataset.key) + 1}`); }
      });
      list.addEventListener("keydown", (e) => {
        if (!held || !e.target.closest(".st-grip")) return;
        const lis = $$(".st-li", list), i = lis.indexOf(held.li);
        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
          e.preventDefault();
          const j = e.key === "ArrowUp" ? i - 1 : i + 1;
          if (j < 0 || j >= lis.length) { Y.sound("nope"); return; }
          window.TierDrag.flip(lis, () => list.insertBefore(held.li, e.key === "ArrowUp" ? lis[j] : lis[j].nextSibling));
          $(".st-grip", held.li).focus();
          S.say(`Position ${j + 1} of ${lis.length}`);
        } else if (e.key === "Escape") {
          e.preventDefault(); e.stopPropagation();
          const h = held; held = null; setHeld(h.li, false);
          window.TierDrag.flip($$(".st-li", list), () => h.from.forEach((k) => list.appendChild(list.querySelector(`[data-key="${CSS.escape(k)}"]`))));
          $(".st-grip", h.li).focus(); S.say("Cancelled");
        }
      });
      $("[data-undo]", view).addEventListener("click", () => {
        if (!before) return;
        window.TierDrag.flip($$(".st-li", list), () => before.forEach((k) => list.appendChild(list.querySelector(`[data-key="${CSS.escape(k)}"]`))));
        before.forEach((k, i) => (byId.get(k)._order = i + 1));
        relabel();
        before = null; $("[data-orderbar]", view).hidden = true; S.persist();
      });
      $("[data-puborder]", view).addEventListener("click", (e) => {
        const btn = e.currentTarget;
        S.publish({ section: sec, item: { id: `order-${sec}`, name: `${info.label} order`, _pub: "changed" }, btn, onDone: () => { before = null; setTimeout(() => ($("[data-orderbar]", view).hidden = true), 200); } });
      });
      // ?demo=reorder: hold the 3rd row mid-drag for the screenshot
      if (q.get("demo") === "reorder" && manualOK) requestAnimationFrame(() => setTimeout(() => {
        const li = $$(".st-li", list)[2]; if (!li) return;
        const g = $(".st-grip", li); g.focus(); g.click(); // keyboard path
        const lis = $$(".st-li", list); list.insertBefore(li, lis[1]); $(".st-grip", li).focus();
        commit(snapshot());
      }, 300));
    },
  };

  /* ============================================================
     HISTORY — revisions on the kit timeline, the ball rolls to the one you pick
     ?screen=history&section=projects&id=sonata[&rev=r2]
     ============================================================ */
  S.screens.history = {
    section: (q) => q.get("section") || "projects", focus: true,
    title: (q) => `History`,
    render(view, q) {
      const sec = this.section(q), item = S.find(sec, q.get("id")) || S.items(sec)[0];
      const revs = S.revisions(sec, item);
      let cur = revs.find((r) => r.id === q.get("rev")) || revs.find((r) => r.changes.length) || revs[0];
      const groups = [];
      for (const r of revs) { const l = S.dayLabel(r.t); let g = groups.find((x) => x.year === l); if (!g) groups.push((g = { year: l, items: [] })); g.items.push(r); }
      const row = (r) => `<button type="button" class="yrow ylift ysel st-rev" data-rev="${r.id}" aria-current="${r === cur}"><span class="st-rev__time">${S.clock(r.t)}</span><span class="st-rev__t"><b>${esc(r.summary)}</b><span class="meta">${r.who}${r.changes.length ? ` · ${r.changes.map((c) => c.field.toLowerCase()).join(", ")}` : ""}</span></span>${r.kind === "publish" ? S.pub("live", { text: "Published" }) : r.kind === "restore" ? Y.fact.text("ph-clock-counter-clockwise", "Restored", { attrs: 'data-pub="changed"', cls: "st-pubf" }) : ""}</button>`;
      const cmp = (r) => {
        const isFirst = r === revs[0];
        return `<div class="st-cmp__h"><h2>${esc(r.summary)} <span class="meta">${S.dayLabel(r.t)}, ${S.clock(r.t)}</span></h2></div>
          ${r.changes.length ? r.changes.map((c) => `<div class="st-diff"><span class="st-diff__f">${esc(c.field)}</span><p class="st-diff__v">${c.before ? S.diff(c.before, c.after) : `<ins>${esc(c.after)}</ins>`}</p></div>`).join("") + `<p class="st-diff"><span class="st-diff__legend"><span><del>struck</del> = this version had it</span><span><ins>marked</ins> = added after</span></span></p>`
          : `<p class="st-note">${r.kind === "publish" ? "Everything above this line went live at this point." : "No field changes recorded."}</p>`}
          <div class="st-sheetacts">${isFirst ? `<span class="meta">This is the current version.</span>` : `<button type="button" class="btn btn--ink" data-restore="${r.id}"><i class="ph-bold ph-clock-counter-clockwise" aria-hidden="true"></i><span>Restore this version</span></button>`}<span class="ydetail__spacer"></span><a class="btn btn--ghost btn--sm" href="${S.editHref(sec, item)}"><i class="ph-bold ph-pencil-simple" aria-hidden="true"></i><span>Back to editing</span></a></div>`;
      };
      // i7 · studio (S1): the kit's detail shell (Yarn.detail: sticky top bar with Back, facts as a label over the title)
      view.innerHTML = Y.detail({
        back: { href: S.editHref(sec, item), label: S.titleOf(item) }, title: "History", level: 1, wide: true,
        facts: S.pub(item._pub) + Y.fact.text("ph-clock-counter-clockwise", `${revs.length} versions`) + Y.fact.text("ph-calendar-blank", "kept for a year"),
        body: `<div class="st-hist">
          <div data-tl>${Y.timelineHTML(groups, row, { key: (r) => r.id, unit: "version" })}</div>
          <section class="patch st-cmp st-hist__cmp" aria-live="polite" aria-label="Compare" data-cmp>${cmp(cur)}</section>
        </div>`,
      }).replace('<article class="ydetail', '<article class="st-ed st-hp ydetail');
      const tl = Y.timeline($(".ytl", view), { ball: true });
      requestAnimationFrame(() => tl.select(cur.id, { instant: true }));
      const phone = () => innerWidth < 960;
      const choose = (r, btn) => {
        cur = r;
        $$("[data-rev]", view).forEach((b) => b.setAttribute("aria-current", String(b.dataset.rev === r.id)));
        tl.select(r.id);
        Y.sound("tap");
        const u = new URL(location.href); u.searchParams.set("rev", r.id); history.replaceState(history.state, "", u);
        if (phone()) S.sheet({ from: btn, title: "Compare", html: `<div class="st-cmp" style="padding:0">${cmp(r)}</div>`, onMount: (s) => s.el.addEventListener("click", onRestore) });
        else $("[data-cmp]", view).innerHTML = cmp(r);
      };
      view.addEventListener("click", (e) => { const b = e.target.closest("[data-rev]"); if (b) choose(revs.find((r) => r.id === b.dataset.rev), b); });
      function onRestore(e) {
        const b = e.target.closest("[data-restore]"); if (!b) return;
        const r = revs.find((x) => x.id === b.dataset.restore);
        const undo = {};
        const MAP = { Description: "description", Status: "status", Name: "name", Title: "title", Text: "text" };
        for (const c of r.changes) { const k = MAP[c.field]; if (k && c.before) { undo[k] = item[k]; item[k] = c.before; } }
        S.touch(sec, item, { quiet: true });
        revs.unshift({ id: `r${Date.now()}`, t: S.now(), who: "you", kind: "restore", summary: `Restored ${S.dayLabel(r.t)}, ${S.clock(r.t)}`, changes: r.changes.map((c) => ({ field: c.field, before: c.after, after: c.before })).filter((c) => c.after) });
        S.log("Restored an older version of", sec, item, "ph-clock-counter-clockwise");
        S.closeAllSheets(true);
        S.toast({ icon: "ph-clock-counter-clockwise", title: "Restored as a draft", text: "The live page doesn't change until you publish.", undo: () => { Object.assign(item, undo); revs.shift(); S.persist(); S.render({ pop: true }); } });
        S.render({ pop: true });
      }
      view.addEventListener("click", onRestore);
    },
  };

  /* ============================================================
     MEDIA LIBRARY — usage counts, orphan filter, bulk remove
     ?screen=media[&usage=orphaned][&kind=video][&select=1][&file=…]
     ============================================================ */
  const kindIcon = { image: "ph-image", video: "ph-video-camera", audio: "ph-waveform" };
  function tile(f) {
    const n = f.uses.length;
    let pv;
    if (f.kind === "audio") pv = `${S.swatch({ instrument: /beepbox/.test(f.src) ? "beepbox" : /piano|vgm/.test(f.src) ? "piano" : "daw", name: f.file })}<span class="st-wave" aria-hidden="true">${S.waveSVG(S.peaks(f.file, 40))}</span>`;
    else if (f.poster) pv = `<img src="${f.poster}" alt="" loading="lazy">`;
    else pv = S.mediaEl(f.src);
    return `<li data-key="${esc(f.key)}"><button type="button" class="ycard ylift st-ltile" data-file="${esc(f.key)}" aria-label="${esc(f.file)}, ${f.kind}, ${n ? `used ${n} time${n > 1 ? "s" : ""}` : "unused"}">
      <span class="st-ltile__pv">${pv}${f.kind === "video" ? `<span class="ycar__dur" aria-hidden="true"><i class="ph-fill ph-play"></i><span>${f.dur ? Y.fmtTime(f.dur) : "video"}</span></span>` : f.kind === "audio" ? `<span class="ycar__dur" aria-hidden="true"><i class="ph-fill ph-waveform"></i><span>${Y.fmtTime(f.dur || S.durOf({ url: f.src }))}</span></span>` : ""}</span>
      <span class="st-lcheck" aria-hidden="true"><i class="ph-bold ph-check"></i></span>
      <span class="st-ltile__name">${esc(f.file)}</span>
      <span class="st-ltile__row"><span class="meta">${f.remote ? "remote · " : ""}${S.bytes(f.size)}</span>${n ? Y.fact.text("ph-link-simple", n === 1 ? "Used once" : `Used ${n}×`, { cls: "st-use" }) : Y.fact.text("ph-scissors", "Unused", { cls: "st-use st-use--none" })}</span>
    </button></li>`;
  }
  S.screens.media = {
    navKey: () => "media", title: () => "Media",
    render(view, q) {
      let lib = S.library();
      const total = () => lib.reduce((n, f) => n + f.size, 0);
      view.innerHTML = `<div class="st-wrap">
        ${Y.header({ title: "Media", meta: `<span data-total>${lib.length} files · ${S.bytes(total())} of 10 GB</span>`, actions: `<button type="button" class="btn btn--ghost" data-select aria-pressed="false"><i class="ph-bold ph-check-square" aria-hidden="true"></i><span>Select</span></button><label class="btn btn--red"><i class="ph-bold ph-upload-simple" aria-hidden="true"></i><span>Upload</span><input type="file" class="sr-only" multiple accept="image/*,video/*,audio/*" data-upload></label>` })}
        <div class="st-listhead ytools"><div data-search></div><div data-row></div></div>
        <div data-orph></div>
        <div class="st-bulk patch" data-bulk role="group" aria-label="Selected files" hidden><p><span data-n>0 selected</span><span class="meta" data-sz></span></p><button type="button" class="btn btn--ghost btn--sm" data-cancel>Cancel</button><button type="button" class="btn btn--red btn--sm" data-del><i class="ph-bold ph-scissors" aria-hidden="true"></i><span>Remove</span></button></div>
        <ul class="st-lib" data-lib aria-label="Files"></ul>
        ${Y.empty({ title: "Nothing here", text: "Every file is in use.", attrs: "data-empty", hidden: true })}
      </div>`;
      const F = Y.filters({
        groups: [
          { key: "kind", label: "Kind", row: true, values: [{ value: "image", label: "Images", icon: "ph-image" }, { value: "video", label: "Videos", icon: "ph-video-camera" }, { value: "audio", label: "Audio", icon: "ph-waveform" }], get: (f) => f.kind },
          { key: "usage", label: "Usage", row: true, values: [{ value: "used", label: "In use", icon: "ph-link-simple" }, { value: "orphaned", label: "Unused", icon: "ph-scissors" }], get: (f) => (f.uses.length ? "used" : "orphaned") },
          { key: "usedin", label: "Used in", values: [{ value: "projects", label: "Projects", icon: "ph-folder-simple" }, { value: "music", label: "Music", icon: "ph-music-notes" }, { value: "thoughts", label: "Thoughts", icon: "ph-cloud" }], get: (f) => f.uses.map((u) => u.section) },
        ],
        items: lib, url: true, text: (f) => `${f.file} ${f.kind} ${f.uses.map((u) => u.title).join(" ")}`,
      });
      Y.filterRow($("[data-row]", view), F);
      Y.search($("[data-search]", view), F, { placeholder: "Search files, or where they're used…" });
      Y.listTools(F, { tools: $(".st-listhead", view), search: $("[data-search]", view), row: $("[data-row]", view), sticky: [$("[data-lib]", view), $("[data-bulk]", view)], stickyDesk: true,
        label: "Search and filter media", title: "Find a file", count: () => `${lib.filter((x) => F.test(x)).length} of ${lib.length} shown` });
      const grid = $("[data-lib]", view);
      let selecting = q.get("select") === "1";
      const sel = new Set();
      const byKey = () => new Map(lib.map((f) => [f.key, f]));
      function paint() {
        grid.innerHTML = lib.map(tile).join("");
        apply();
      }
      function apply() {
        const map = byKey();
        let shown = 0;
        F.items = lib; // keep facet counts in step after uploads / removals
        $$("li[data-key]:not([inert])", grid).forEach((li) => { const f = map.get(li.dataset.key); const ok = !!f && F.test(f); li.hidden = !ok; if (ok) shown++; });
        $("[data-empty]", view).hidden = shown > 0;
        const orph = lib.filter((f) => !f.uses.length);
        const onlyOrph = F.has("usage", "orphaned") && !F.has("usage", "used");
        $("[data-orph]", view).innerHTML = onlyOrph && orph.length ? `<div class="patch st-orphnote"><i class="ph-bold ph-scissors" aria-hidden="true"></i><p><b>${orph.length} file${orph.length > 1 ? "s" : ""} aren't used anywhere</b><br><span class="meta">${S.bytes(orph.reduce((n, f) => n + f.size, 0))} · nothing on the site links to them</span></p><button type="button" class="btn btn--sm" data-selorph>Select all unused</button></div>` : "";
        $("[data-total]", view).textContent = `${lib.length} files · ${S.bytes(total())} of 10 GB`;
        paintSel();
      }
      function paintSel() {
        grid.classList.toggle("is-selecting", selecting);
        const sb = $("[data-select]", view); sb.setAttribute("aria-pressed", String(selecting)); $("span", sb).textContent = selecting ? "Done" : "Select";
        $$(".st-ltile", grid).forEach((b) => (selecting ? b.setAttribute("aria-pressed", String(sel.has(b.dataset.file))) : b.removeAttribute("aria-pressed")));
        const bulk = $("[data-bulk]", view);
        bulk.hidden = !selecting;
        const map = byKey(), arr = [...sel].map((k) => map.get(k)).filter(Boolean);
        $("[data-n]", view).textContent = `${arr.length} selected`;
        $("[data-sz]", view).textContent = arr.length ? S.bytes(arr.reduce((n, f) => n + f.size, 0)) : "";
        $("[data-del]", view).disabled = !arr.length;
      }
      paint();
      F.on(() => Y.flip(grid, "li[data-key]", apply));
      if (q.get("demo") === "select") { selecting = true; lib.filter((f) => !f.uses.length).slice(0, 3).forEach((f) => sel.add(f.key)); paintSel(); }
      view.addEventListener("click", (e) => {
        const t = e.target;
        if (t.closest("[data-select]")) { selecting = !selecting; if (!selecting) sel.clear(); paintSel(); return; }
        if (t.closest("[data-cancel]")) { selecting = false; sel.clear(); paintSel(); return; }
        if (t.closest("[data-selorph]")) { selecting = true; lib.filter((f) => !f.uses.length).forEach((f) => sel.add(f.key)); paintSel(); Y.sound("chip-on"); return; }
        const tl = t.closest(".st-ltile");
        if (tl) {
          if (selecting) { sel.has(tl.dataset.file) ? sel.delete(tl.dataset.file) : sel.add(tl.dataset.file); Y.sound(sel.has(tl.dataset.file) ? "chip-on" : "chip-off", { el: tl }); paintSel(); }
          else fileSheet(byKey().get(tl.dataset.file), tl);
          return;
        }
        const d = t.closest("[data-del]");
        if (d) {
          const map = byKey(), arr = [...sel].map((k) => map.get(k));
          const used = arr.filter((f) => f.uses.length);
          if (used.length) {
            Y.sound("nope", { el: d });
            d.classList.remove("is-shake"); void d.offsetWidth; d.classList.add("st-pubbtn", "is-shake");
            S.toast({ icon: "ph-hand-palm", title: `${used.length} of these ${used.length === 1 ? "is" : "are"} still in use`, text: `${used.slice(0, 2).map((f) => `${f.file} → ${f.uses.map((u) => u.title).join(", ")}`).join(" · ")}. Remove ${used.length === 1 ? "it" : "them"} there first.`, duration: 6000 });
            return;
          }
          remove(arr, d);
        }
      });
      function remove(arr, btn) {
        const bytes = arr.reduce((n, f) => n + f.size, 0);
        Y.flip(grid, "li[data-key]", () => { arr.forEach((f) => S.data.removed.push(f.key)); lib = S.library(); arr.forEach((f) => grid.querySelector(`li[data-key="${CSS.escape(f.key)}"]`)?.remove()); });
        Y.sound("tag-remove", { el: btn });
        sel.clear(); selecting = false;
        S.log(`Removed ${arr.length} unused file${arr.length > 1 ? "s" : ""} from`, "media", { id: "", name: "Media" }, "ph-scissors");
        S.persist(); apply();
        S.toast({ icon: "ph-scissors", title: `Removed ${arr.length} file${arr.length > 1 ? "s" : ""}`, text: `${S.bytes(bytes)} freed · in the bin for 30 days`, undo: () => { S.data.removed = S.data.removed.filter((k) => !arr.some((f) => f.key === k)); lib = S.library(); S.persist(); Y.flip(grid, "li[data-key]", paint); } });
      }
      function fileSheet(f, from) {
        const isImg = f.kind === "image", url = f.poster || S.url(f.src);
        const pv = f.kind === "audio"
          ? `<div class="patch st-audio"><div class="st-audio__top">${S.swatch({ instrument: "daw", name: f.file }, { size: 52 })}<div class="st-audio__name"><b>${esc(f.file)}</b><span class="meta">${Y.fmtTime(f.dur || S.durOf({ url: f.src }))} · peaks cached</span></div></div><div class="st-wave">${S.waveSVG(S.peaks(f.file))}</div></div>`
          : `<button type="button" class="st-mprev" style="display:block;width:100%;border:0;padding:0;cursor:zoom-in" data-zoom aria-label="Open ${esc(f.file)} larger">${f.kind === "video" ? (S.url(f.src) ? `<video src="${S.url(f.src)}#t=0.6" muted playsinline preload="metadata" aria-hidden="true"></video>` : S.mediaEl(f.src)) : url ? `<img src="${url}" alt="">` : S.mediaEl(f.src)}</button>`;
        const alt = { alt: (S.data.projects.flatMap((p) => p.images || []).find((m) => S.norm(m.src) === S.norm(f.src)) || {}).alt || "" };
        S.sheet({
          from, title: f.file, width: 560,
          html: `${pv}
            <dl class="st-facts"><dt>Type</dt><dd>${f.kind}${f.remote ? " · served from music.blaqat.net" : ""}</dd><dt>Size</dt><dd>${S.bytes(f.size)}</dd>${f.dims ? `<dt>${f.kind === "video" ? "Frame" : "Pixels"}</dt><dd>${f.dims}</dd>` : ""}${f.dur || f.kind !== "image" ? `<dt>Length</dt><dd>${Y.fmtTime(f.dur || S.durOf({ url: f.src }))}</dd>` : ""}<dt>Uploaded</dt><dd>${Y.fmt.full(new Date(f.t))}</dd>${f.kind === "video" ? `<dt>Poster</dt><dd>auto: frame at 0:00.6</dd>` : ""}</dl>
            ${isImg || f.kind === "video" ? S.f.text(alt, "alt", { label: "Alt text", placeholder: "Describe it for people who can't see it", hint: "Used everywhere this file appears unless a post overrides it." }) : ""}
            <h3 class="eyebrow" style="margin:4px 0 0">${f.uses.length ? `Used in ${f.uses.length} place${f.uses.length > 1 ? "s" : ""}` : "Not used anywhere"}</h3>
            ${f.uses.length ? `<ul class="st-uses">${f.uses.map((u) => { const it = S.find(u.section, u.id); return `<li><a class="yrow ylift" href="${it ? S.editHref(u.section, it) : "#"}">${S.dot(u.section, it ? S.secIcon(u.section, it) : null)}<span style="flex:1;min-width:0;font:800 .92rem/1.2 var(--font-display)">${esc(u.title)}</span><span class="meta">${S.SECTIONS[u.section].label}</span><i class="ph-bold ph-caret-right" aria-hidden="true"></i></a></li>`; }).join("")}</ul>` : `<p class="st-note">Nothing on the site links to this file. Safe to remove.</p>`}`,
          foot: `<button type="button" class="btn btn--ghost" data-replace><i class="ph-bold ph-arrows-clockwise" aria-hidden="true"></i><span>Replace</span></button><span class="ydetail__spacer"></span><button type="button" class="btn ${f.uses.length ? "" : "btn--red"}" data-rm><i class="ph-bold ph-scissors" aria-hidden="true"></i><span>Remove</span></button>`,
          onMount: (s) => s.el.addEventListener("click", (e) => {
            if (e.target.closest("[data-zoom]")) { const z = e.target.closest("[data-zoom]"); Y.lightbox.open({ items: [{ src: url || S.url(f.src), alt: alt.alt || f.file, kind: f.kind === "video" ? "video" : "image" }], index: 0, title: f.file, thumbs: () => z }); }
            if (e.target.closest("[data-replace]")) S.toast({ icon: "ph-arrows-clockwise", title: "Pick a file to replace it", text: `Every place that uses ${f.file} updates. The old one stays in history.` });
            const rm = e.target.closest("[data-rm]");
            if (rm) {
              if (f.uses.length) { Y.sound("nope", { el: rm }); rm.classList.remove("is-shake"); void rm.offsetWidth; rm.classList.add("st-pubbtn", "is-shake"); S.toast({ icon: "ph-hand-palm", title: "It's still in use", text: `Remove it from ${f.uses.map((u) => u.title).join(", ")} first.` }); return; }
              s.close({ silent: true }); remove([f], from);
            }
          }),
        });
      }
      if (q.get("file")) { const f = lib.find((x) => x.key === q.get("file")); if (f) requestAnimationFrame(() => fileSheet(f, grid.querySelector(`[data-file="${CSS.escape(f.key)}"]`))); }
      // uploads (real files: posters / peaks are computed on the device)
      $("[data-upload]", view).addEventListener("change", async (e) => {
        const files = [...e.target.files]; e.target.value = "";
        for (const file of files) {
          const kind = file.type.startsWith("video") ? "video" : file.type.startsWith("audio") ? "audio" : "image";
          const src = URL.createObjectURL(file);
          let extra = {};
          try { if (kind === "video") extra = (await S.posterFrom(src)) || {}; if (kind === "audio") { const a = await S.decodeAudio(file); extra = { dur: a.duration }; } } catch (_) {}
          S.addUpload({ file: file.name, src, kind, size: file.size, ...extra });
        }
        lib = S.library();
        Y.flip(grid, "li[data-key]", paint);
        if (files.length) { Y.sound("token-add"); S.toast({ icon: "ph-upload-simple", title: `Uploaded ${files.length} file${files.length > 1 ? "s" : ""}`, text: "Not used anywhere yet: add them to a post or project." }); }
      });
    },
  };
})();
