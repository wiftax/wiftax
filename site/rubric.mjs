// /rubric/ page. All words come from RUBRIC.md; this file only adds layout and diagrams.
// Diagrams are plain HTML nodes + links; chips travel along links (CSS), site/rubric.js switches grades.
import { marked } from "marked";

export function rubricPage({ md, icon, badge, esc, HYG, HYG_LABEL, HYG_ICON, sample }) {
  // ---- parse RUBRIC.md into { title, intro, sections: [{ heading, before, rows, after }] }
  const [head, ...rest] = md.split(/^## /m);
  const title = head.match(/^# (.+)$/m)[1];
  const intro = head.replace(/^# .+$/m, "").trim();
  const sections = rest.map((s) => {
    const nl = s.indexOf("\n");
    const heading = s.slice(0, nl).trim(), body = s.slice(nl + 1);
    const lines = body.split("\n");
    const t0 = lines.findIndex((l) => l.startsWith("|"));
    if (t0 < 0) return { heading, before: body.trim(), rows: [], after: "" };
    let t1 = t0; while (t1 < lines.length && lines[t1].startsWith("|")) t1++;
    const cells = (l) => l.replace(/^\||\|$/g, "").split(" | ").map((c) => c.trim());
    return { heading, before: lines.slice(0, t0).join("\n").trim(), rows: lines.slice(t0 + 2, t1).map(cells), after: lines.slice(t1).join("\n").trim() };
  });
  const sec = (re) => sections.find((s) => re.test(s.heading)) ?? { heading: "", before: "", rows: [], after: "" };
  const S = { unit: sec(/^Unit/), inb: sec(/Inbound/), outb: sec(/Outbound/), hyg: sec(/^Hygiene/), ev: sec(/^Evidence/), st: sec(/^Status/), not: sec(/do not grade/) };
  const P = (m) => (m ? marked.parse(m) : "");
  const I = (m) => marked.parseInline(m);
  const gradeOf = (c) => c.replace(/\*/g, ""); // "**A**" -> "A"
  const split = (cell) => { const m = cell.match(/^\*\*(.+?)\*\*\s*(.*)$/); return m ? [m[1].replace(/\.$/, ""), m[2]] : [cell, ""]; };
  const tocName = (h) => h.replace(/^Surface \d+:\s*/, "");

  // ---- diagram atoms
  const node = (ico, label, { cls = "", pin = "" } = {}) => `<div class="nd ${cls}"><span class="nd-i">${ico}</span>${label ? `<span class="nd-l">${label}</span>` : ""}${pin}</div>`;
  const pin = (kind) => `<span class="pin pin-${kind}">${icon(kind === "key" ? "key" : "stopwatch")}</span>`;
  const link = (kind, delay = 0) => `<div class="ln ln-${kind}"${delay ? ` style="--d:${delay}s"` : ""}><span class="ln-t"></span>${kind === "none" ? "" : `<span class="chip chip-${kind}">${icon(kind === "key" ? "key" : "stopwatch")}</span>`}</div>`;
  const brand = (n) => icon(n, { brand: true });
  const tiles = (n) => `<div class="mini-hyg">${HYG.map((k, i) => `<span class="tip" tabindex="0" data-tip="${esc(HYG_LABEL[k])}"><span class="tile ${i < n ? "hy" : "hn"}">${icon(HYG_ICON[k], { label: i < n ? "pass" : "fail" })}</span></span>`).join("")}<span class="mini-n">${n}/5</span></div>`;
  const W = () => node(icon("server"), "Workload");
  const Pd = (o) => node(icon("cube"), "Product", o);
  const issuer = node(icon("id-badge"), "Issuer");
  const secret = node(icon("key"), "", { cls: "nd-key" });
  const allow = `<div class="nd nd-allow"><span class="nd-brands">${["github", "gitlab", "aws", "google", "microsoft"].map(brand).join("")}</span></div>`;
  const flow3 = (a, l1, b, l2, c, extra = "") => `<div class="flow">${a}${l1}${b}${l2}${c}</div>${extra}`;

  const inScene = {
    A: flow3(issuer, link("tok"), W(), link("tok", 1.2), Pd()),
    B: `<div class="flow"><div class="col">${allow}${node(icon("id-badge"), "Issuer", { cls: "nd-off", pin: `<span class="pin pin-ban">${icon("ban")}</span>` })}</div><div class="col">${link("tok")}${link("none")}</div>${W()}${link("tok", 1.2)}${Pd()}</div>`,
    C: flow3(secret, link("key"), W({}), link("tok", 1.2), Pd()),
    D: flow3(secret, link("key"), W(), link("key", 1.2), Pd(), tiles(3)),
    F: flow3(secret, link("key"), W(), link("key", 1.2), Pd({ pin: `<span class="pin pin-inf">${icon("infinity")}</span>` }), tiles(1)),
  };
  const targets = (kinds, off = false) => `<div class="col">${kinds.map((k, i) => link(off ? "none" : k, i * 0.35)).join("")}</div><div class="col">${["aws", "google", "microsoft"].map((b) => `<div class="nd nd-sm${off ? " nd-off" : ""}"><span class="nd-i">${brand(b)}</span></div>`).join("")}</div>`;
  const outScene = {
    A: `<div class="flow flow-fan">${Pd({ cls: "nd-issuer", pin: pin("tok") })}${targets(["tok", "tok", "tok"])}</div>`,
    B: `<div class="flow flow-fan">${Pd()}${targets(["tok", "tok", "key"])}</div>`,
    C: `<div class="flow flow-fan">${Pd({ pin: pin("key") })}${targets(["tok", "tok", "tok"])}</div>`,
    D: `<div class="flow flow-fan">${Pd()}${targets(["key", "key", "key"])}</div><div class="mini-hyg">${["shield-check"].map((n) => `<span class="tile hy">${icon(n)}</span>`).join("")}</div>`,
    F: `<div class="flow flow-fan">${Pd()}${targets(["key", "key", "key"])}</div><div class="mini-hyg"><span class="tile hn">${icon("shield-check")}</span></div>`,
    "N/A": `<div class="flow flow-fan">${Pd()}${targets(["none", "none", "none"], true)}</div>`,
  };

  const legend = `<div class="legend"><span><span class="chip chip-tok still">${icon("stopwatch")}</span>short-lived token</span><span><span class="chip chip-key still">${icon("key")}</span>long-lived secret</span></div>`;

  // ---- a surface: ladder of grades + stage + meaning
  const surface = (id, s, scenes, opts = {}) => {
    const rows = s.rows.map(([g, cell]) => { const [name, text] = split(cell); return { g: gradeOf(g), name, text }; });
    const slug = (g) => (g === "N/A" ? "NA" : g);
    const ladder = rows.map((r, i) => `<button type="button" role="tab" class="ld" id="${id}-t-${slug(r.g)}" aria-controls="${id}-p" data-g="${slug(r.g)}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${badge(r.g)}<span class="ld-n">${I(r.name)}</span><span class="prog"></span></button>`).join("");
    const stage = rows.map((r, i) => `<div class="scene" data-g="${slug(r.g)}"${i === 0 ? " data-on" : ""}>${scenes[r.g] ?? ""}</div>`).join("");
    const meaning = rows.map((r, i) => `<div class="mean" data-g="${slug(r.g)}"${i === 0 ? " data-on" : ""}><span class="mean-n">${I(r.name)}</span><p>${I(r.text)}</p></div>`).join("");
    const [eyebrow, name] = s.heading.includes(":") ? s.heading.split(/:\s*/) : ["", s.heading];
    return `<section class="rb-sec rb-surface" id="${id}" data-auto>
<header class="rb-h"><h2>${esc(name)}</h2>${P(s.before)}</header>
<div class="surf"><div class="ladder" role="tablist" aria-label="${esc(name)}">${ladder}</div>
<div class="stage-wrap" id="${id}-p" role="tabpanel"><div class="stage">${legend}<div class="scenes">${stage}</div></div><div class="means">${meaning}</div></div></div>
${s.after && !opts.noNotes ? `<div class="rb-notes">${P(s.after)}</div>` : ""}</section>`;
  };

  // ---- unit of assessment: headline = lower of the two
  const pick = (side, grades, init) => `<div class="hl-pick" role="radiogroup" aria-label="${side}" data-side="${side.toLowerCase()}"><span class="hl-k">${side}</span><div class="hl-btns">${grades.map((g) => `<button type="button" role="radio" class="gt gt-${g === "N/A" ? "NA" : g}" data-g="${g}" aria-checked="${g === init}">${g}</button>`).join("")}</div></div>`;
  const unit = `<section class="rb-sec" id="unit"><header class="rb-h"><h2>${esc(S.unit.heading)}</h2></header>
<div class="split"><div class="prose-s">${P(S.unit.before)}</div>
<div class="panel hl" aria-live="polite">${pick("Inbound", ["A", "B", "C", "D", "F"], "A")}${pick("Outbound", ["A", "B", "C", "D", "F", "N/A"], "D")}
<div class="hl-out"><span class="hl-k">Headline</span><span class="hl-res">${["A", "B", "C", "D", "F"].map((g) => `<span class="hl-b" data-g="${g}"${g === "D" ? " data-on" : ""}>${badge(g)}</span>`).join("")}</span></div></div></div></section>`;

  // ---- hygiene: toggle checks, watch D/F flip at 3
  const passes = Object.fromEntries(S.hyg.rows.map(([k, t]) => [k.replace(/`/g, ""), t]));
  const hyg = `<section class="rb-sec" id="hygiene"><header class="rb-h"><h2>${esc(S.hyg.heading)}</h2>${P(S.hyg.before)}</header>
<div class="panel hyg"><div class="hyg-meter"><span class="hyg-n"><b>3</b>/5</span><span class="hyg-bar"><span class="hyg-fill"></span><span class="hyg-mark"></span></span><span class="hyg-res">${badge("D")}${badge("F")}</span></div>
<div class="hyg-grid">${HYG.map((k, i) => `<button type="button" class="hc" aria-pressed="${i < 3}" data-k="${k}"><span class="tile">${icon(HYG_ICON[k])}</span><span class="hc-n">${esc(HYG_LABEL[k])}</span><span class="hc-t">${I(passes[k] ?? "")}</span></button>`).join("")}</div></div>
${S.hyg.after ? `<div class="rb-notes">${P(S.hyg.after)}</div>` : ""}</section>`;

  // ---- evidence: a real receipt from the dataset, aging toward stale
  const plus12 = (d) => { const x = new Date(d + "T00:00:00Z"); x.setUTCFullYear(x.getUTCFullYear() + 1); return x.toISOString().slice(0, 10); };
  const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; } };
  const [evA, ...evRest] = S.ev.before.split(/\n\n/);
  const ev = `<section class="rb-sec" id="evidence"><header class="rb-h"><h2>${esc(S.ev.heading)}</h2></header>
<div class="split"><div class="prose-s">${P(evA)}${P(evRest.join("\n\n"))}</div>
<div class="panel receipt-wrap">${sample ? `<figure class="receipt"><div class="rc-top">${icon("receipt")}<a href="${esc(sample.url)}" rel="noopener" target="_blank">${esc(host(sample.url))}</a></div><blockquote>${esc(sample.quote)}</blockquote><figcaption><span>${esc(sample.vendor)} · ${esc(sample.product)}</span><span class="rc-d">${icon("calendar")}${esc(sample.checked_on)}</span></figcaption></figure>
<div class="age"><div class="age-bar"><span class="age-fill"></span><span class="age-dot"></span></div><div class="age-l"><span>${esc(sample.checked_on)}</span><span>${plus12(sample.checked_on)}</span></div><span class="age-stale">stale</span></div>` : ""}</div></div></section>`;

  // ---- status: three tiny animated stories
  const stIcon = { listed: "badge-check", graduated: "star", disputed: "flag" };
  const stViz = { listed: `<span class="sv">${badge("B")}</span>`, graduated: `<span class="sv sv-grad">${badge("F")}${badge("A")}</span>`, disputed: `<span class="sv sv-disp">${badge("C")}<span class="sv-flag">${icon("flag")}</span></span>` };
  const st = `<section class="rb-sec" id="status"><header class="rb-h"><h2>${esc(S.st.heading)}</h2>${P(S.st.before)}</header>
<div class="st-grid">${S.st.rows.map(([k, t]) => { const key = k.replace(/`/g, ""); return `<div class="panel st">${stViz[key] ?? ""}<code>${icon(stIcon[key] ?? "circle-check")}${esc(key)}</code><p>${I(t)}</p></div>`; }).join("")}</div></section>`;

  const not = `<section class="rb-sec" id="not"><header class="rb-h"><h2>${esc(S.not.heading)}</h2></header><div class="prose-s quiet">${P(S.not.before)}</div></section>`;

  const toc = [["unit", S.unit.heading], ["inbound", tocName(S.inb.heading)], ["outbound", tocName(S.outb.heading)], ["hygiene", S.hyg.heading], ["evidence", S.ev.heading], ["status", S.st.heading]]
    .map(([id, h]) => `<a href="#${id}" data-to="${id}">${esc(h)}</a>`).join("");
  const [t1, ver] = title.match(/^(.*?)\s*\((v\d+)\)$/)?.slice(1) ?? [title, ""];

  return `<div class="rb">
<aside class="rb-toc"><nav aria-label="On this page">${toc}</nav></aside>
<div class="rb-main">
<section class="rb-hero"><h1>${esc(t1.replace(/^The wif\.tax /, ""))}${ver ? ` <span class="ver">${esc(ver)}</span>` : ""}</h1><div class="lead">${P(intro)}</div></section>
${unit}
${surface("inbound", S.inb, inScene, { noNotes: true })}
${surface("outbound", S.outb, outScene, { noNotes: true })}
${hyg}
${ev}
${st}
</div></div>`;
}
