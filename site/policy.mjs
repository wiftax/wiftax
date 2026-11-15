// /policy/ page. All words come from site/policy.md; this file only adds layout and
// small diagrams. It shares rubric.css (and rubric.js for the table of contents).
import { marked } from "marked";

export function policyPage({ md, icon, badge, esc }) {
  // ---- parse policy.md into { title, intro, sections: [{ heading, body }] }
  const [head, ...rest] = md.split(/^## /m);
  const title = head.match(/^# (.+)$/m)[1];
  const intro = head.replace(/^# .+$/m, "").trim();
  const sections = rest.map((s) => {
    const nl = s.indexOf("\n");
    return { heading: s.slice(0, nl).trim(), body: s.slice(nl + 1).trim() };
  });
  const sec = (re) => sections.find((s) => re.test(s.heading)) ?? { heading: "", body: "" };
  const S = { dispute: sec(/^Dispute/), will: sec(/^What changes/), wont: sec(/^What does not/), grad: sec(/^Graduation/), bot: sec(/^Sisyphus/), contact: sec(/^Contact/) };
  const P = (m) => (m ? marked.parse(m) : "");
  const I = (m) => marked.parseInline(m);
  const listItems = (body, re) => body.split("\n").filter((l) => re.test(l)).map((l) => l.replace(re, "").trim());
  const prose = (body) => body.split("\n").filter((l) => !/^(\d+\.|-|\|)\s?/.test(l)).join("\n").trim();
  const head2 = (id, s, lead = "") => `<header class="rb-h"><h2 id="${id}-h">${esc(s.heading)}</h2>${lead}</header>`;

  // ---- dispute: two ways in, and a card going listed -> disputed -> re-read
  const [dIntro, ...dAfter] = prose(S.dispute.body).split(/\n\n+/);
  const doorIcon = ["code-pull-request", "envelope"];
  const doors = listItems(S.dispute.body, /^\d+\.\s+/).map((item, i) => {
    const m = item.match(/^\*\*(.+?)\.?\*\*\s*(.*)$/) ?? [null, "", item];
    return `<div class="panel door"><span class="door-i">${icon(doorIcon[i] ?? "circle")}</span><div><span class="door-n">${I(m[1])}</span><p>${I(m[2])}</p></div></div>`;
  });
  const sk = (cls = "") => `<span class="sk ${cls}"></span>`;
  const card = `<div class="panel dcard" aria-hidden="true">
<div class="dc-head"><span class="dc-name">${sk("w6")}${sk("w4")}</span><span class="dc-st"><code class="dc-l">${icon("circle-check")}listed</code><code class="dc-d">${icon("flag")}disputed</code></span>${badge("C")}</div>
<div class="dc-vs"><span class="dc-k">${icon("quote-left")}</span><span class="dc-lines">${sk("w9")}${sk("w7")}${sk("w5")}</span></div>
<div class="dc-rev"><span class="dc-who">${icon("user-check")}</span><span class="dc-lines">${sk("w8")}${sk("w5")}</span><span class="dc-ok">${icon("check")}</span></div>
</div>`;
  const dispute = `<section class="rb-sec" id="dispute">${head2("dispute", S.dispute, P(dIntro))}
<div class="split"><div class="doors">${doors.join("")}</div>${card}</div>
${dAfter.length ? `<div class="prose-s after">${P(dAfter.join("\n\n"))}</div>` : ""}</section>`;

  // ---- what changes a grade, and what does not
  const ledger = (s, kind) => `<div class="panel ledger ledger-${kind}"><h3><span class="tile ${kind === "yes" ? "hy" : "hn"}">${icon(kind === "yes" ? "check" : "xmark")}</span>${esc(s.heading)}</h3><ul>${listItems(s.body, /^-\s+/).map((t) => `<li>${I(t)}</li>`).join("")}</ul></div>`;
  const changes = `<section class="rb-sec" id="changes"><div class="ledgers">${ledger(S.will, "yes")}${ledger(S.wont, "no")}</div></section>`;

  // ---- graduation: F becomes A, the star stays
  const grad = `<section class="rb-sec" id="graduation">${head2("graduation", S.grad)}
<div class="split"><div class="prose-s">${P(S.grad.body)}</div>
<div class="panel gradp" aria-hidden="true"><span class="g-wrap"><span class="sv sv-grad">${badge("F")}${badge("A")}</span><span class="g-star">${icon("star", { solid: true })}</span></span><code>${icon("star")}graduated</code></div></div></section>`;

  // ---- sisyphus: crawler -> pull request -> a person. It never merges.
  const node = (ico, label, cls = "") => `<div class="nd ${cls}"><span class="nd-i">${icon(ico)}</span><span class="nd-l">${esc(label)}</span></div>`;
  const link = (ico, delay = 0) => `<div class="ln ln-tok"${delay ? ` style="--d:${delay}s"` : ""}><span class="ln-t"></span><span class="chip chip-tok">${icon(ico)}</span></div>`;
  const bot = `<section class="rb-sec" id="sisyphus">${head2("sisyphus", S.bot)}
<div class="split"><div class="prose-s">${P(S.bot.body)}</div>
<div class="panel botp" aria-hidden="true"><div class="flow">${node("robot", "Sisyphus")}${link("receipt")}${node("code-pull-request", "Pull request")}${link("eye", 1.2)}${node("user-check", "A person", "nd-person")}</div>
</div></div></section>`;

  // ---- contact: one row per address
  const rows = S.contact.body.split("\n").filter((l) => l.startsWith("|")).slice(2)
    .map((l) => l.replace(/^\||\|$/g, "").split(" | ").map((c) => c.trim()));
  const cIcon = (addr) => (/disputes@/.test(addr) ? "flag" : /security@/.test(addr) ? "shield-halved" : "envelope");
  const contact = `<section class="rb-sec" id="contact">${head2("contact", S.contact)}
<div class="contacts">${rows.map(([addr, what]) => `<div class="crow"><span class="tile">${icon(cIcon(addr))}</span><span class="c-addr">${I(addr)}</span><span class="c-what">${I(what)}</span></div>`).join("")}</div></section>`;

  const toc = [["dispute", S.dispute.heading], ["changes", S.will.heading], ["graduation", S.grad.heading], ["sisyphus", S.bot.heading], ["contact", S.contact.heading]]
    .map(([id, h]) => `<a href="#${id}" data-to="${id}">${esc(h)}</a>`).join("");

  return `<div class="rb pol">
<aside class="rb-toc"><nav aria-label="On this page">${toc}</nav></aside>
<div class="rb-main">
<section class="rb-hero"><h1>${esc(title)}</h1><div class="lead">${P(intro)}</div></section>
${dispute}
${changes}
${grad}
${bot}
${contact}
</div></div>`;
}
