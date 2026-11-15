// /our-own-tax/ page. All words come from site/our-own-tax.md; this file only adds
// layout and small diagrams. It shares rubric.css (and rubric.js for the table of contents).
import { marked } from "marked";

export function ownTaxPage({ md, icon, badge, esc }) {
  // ---- parse: title, intro (with the credentials table), sections
  const [head, ...rest] = md.split(/^## /m);
  const title = head.match(/^# (.+)$/m)[1];
  const headBody = head.replace(/^# .+$/m, "").trim();
  const sections = rest.map((s) => {
    const nl = s.indexOf("\n");
    return { heading: s.slice(0, nl).trim(), body: s.slice(nl + 1).trim() };
  });
  const sec = (re) => sections.find((s) => re.test(s.heading)) ?? { heading: "", body: "" };
  const S = { zero: sec(/zero/i), humans: sec(/^Human/) };
  const P = (m) => (m ? marked.parse(m) : "");
  const I = (m) => marked.parseInline(m);
  const cells = (l) => l.replace(/^\||\|$/g, "").split(" | ").map((c) => c.trim());
  const lines = headBody.split("\n");
  const tbl = lines.filter((l) => l.startsWith("|"));
  const intro = lines.filter((l) => !l.startsWith("|")).join("\n").trim();
  const [cols, , ...rows] = tbl.map(cells);

  // ---- the ledger: every credential we hold, and the grade we would give ourselves
  const gradeCell = (c) => (/^(A|B|C|D|F)$/.test(c) ? badge(c) : `<span>${I(c)}</span>`);
  const ledger = `<div class="panel tax" aria-label="${esc(cols?.[0] ?? "")}">${(rows ?? [])
    .map((r) => cols.map((k, i) => `<div class="tax-row${i === cols.length - 1 ? " tax-grade" : ""}"><span class="hl-k">${esc(k)}</span>${i === cols.length - 1 ? gradeCell(r[i]) : `<span class="tax-v">${I(r[i])}</span>`}</div>`).join(""))
    .join("")}</div>`;

  // ---- what we got to zero: one card each, the secret struck out, and what replaced it
  const items = S.zero.body.split("\n").filter((l) => /^-\s+/.test(l)).map((l) => l.replace(/^-\s+/, ""));
  const brand = { github: "github", cloudflare: "cloudflare" };
  const leadIcon = (name) => {
    const n = name.toLowerCase();
    if (n.includes("actions")) return icon("gears");
    if (n.includes("anthropic")) return icon("robot");
    for (const b of Object.keys(brand)) if (n.includes(b)) return icon(brand[b], { brand: true });
    return icon("cube");
  };
  // What holds the door now: a short-lived token, or a person with a passkey.
  const after = (text) => (/passkey/i.test(text) && !/token, which lives/i.test(text) ? `<span class="chip chip-pass still">${icon("fingerprint")}</span>` : `<span class="chip chip-tok still">${icon("stopwatch")}</span>`);
  const cards = items.map((it) => {
    const m = it.match(/^\*\*(.+?)\.?\*\*\s*(.*)$/) ?? [null, it, ""];
    return `<div class="panel zero"><div class="zero-h"><span class="door-i">${leadIcon(m[1])}</span><span class="zero-n">${I(m[1])}</span><span class="swap" aria-hidden="true"><span class="chip chip-key still struck">${icon("key")}</span>${icon("arrow-right")}${after(m[2])}</span></div><p>${I(m[2])}</p></div>`;
  });
  const legend = `<div class="legend"><span><span class="chip chip-key still struck">${icon("key")}</span>long-lived secret, gone</span><span><span class="chip chip-tok still">${icon("stopwatch")}</span>short-lived token</span><span><span class="chip chip-pass still">${icon("fingerprint")}</span>a person with a passkey</span></div>`;
  const zero = `<section class="rb-sec" id="zero"><header class="rb-h zero-head"><h2>${esc(S.zero.heading)}</h2>${legend}</header><div class="zeros">${cards.join("")}</div></section>`;

  // ---- human logins: the services a person signs in to, each behind a passkey
  const [hFirst, ...hRest] = S.humans.body.split(/\n\n+/);
  const svc = [["github", "GitHub", true], ["cloudflare", "Cloudflare", true], ["globe", "Registrar", false], ["envelope", "Email", false]];
  const logins = `<div class="panel logins" aria-hidden="true">${svc.map(([ic, label, isBrand]) => `<div class="nd"><span class="nd-i">${icon(ic, { brand: isBrand })}</span><span class="pin pin-pass">${icon("fingerprint")}</span><span class="nd-l">${esc(label)}</span></div>`).join("")}</div>`;
  const humans = `<section class="rb-sec" id="humans"><header class="rb-h"><h2>${esc(S.humans.heading)}</h2></header>
<div class="split"><div class="prose-s">${P(hFirst)}</div>${logins}</div>
${hRest.length ? `<div class="prose-s after quiet">${P(hRest.join("\n\n"))}</div>` : ""}</section>`;

  const toc = [["zero", S.zero.heading], ["humans", S.humans.heading]].map(([id, h]) => `<a href="#${id}" data-to="${id}">${esc(h)}</a>`).join("");

  return `<div class="rb owntax">
<aside class="rb-toc"><nav aria-label="On this page">${toc}</nav></aside>
<div class="rb-main">
<section class="rb-hero"><h1>${esc(title)}</h1><div class="split hero-split"><div class="lead">${P(intro)}</div>${rows?.length ? ledger : ""}</div></section>
${zero}
${humans}
</div></div>`;
}
