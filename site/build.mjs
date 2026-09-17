// Static site generator: data/products/*.yaml -> dist/
import { readFileSync, readdirSync, writeFileSync, mkdirSync, cpSync, rmSync } from "node:fs";
import { join } from "node:path";
import yaml from "js-yaml";
import { marked } from "marked";

const root = new URL("..", import.meta.url).pathname;
const out = join(root, "dist");
const SITE = "https://wif.tax";
const TODAY = new Date().toISOString().slice(0, 10);
const RANK = { A: 5, B: 4, C: 3, D: 2, F: 1 };
const HYG = ["expiry", "rotation_api", "scoping", "last_used", "leak_revocation"];
const HYG_LABEL = { expiry: "Expiry enforceable", rotation_api: "Rotation via API", scoping: "Scoped keys", last_used: "Last-used visible", leak_revocation: "Leak revocation" };
const COLOR = { A: "#1f8a4c", B: "#b8860b", C: "#d9731a", D: "#c8322b", F: "#3a0f0f", "N/A": "#9a9a9a" };

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const gcls = (g) => `g g-${g === "N/A" ? "NA" : g}`;
const badge = (g) => `<span class="${gcls(g)}">${g === "N/A" ? "n/a" : g}</span>`;
const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; } };

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const products = readdirSync(join(root, "data/products"))
  .filter((f) => f.endsWith(".yaml") && !f.startsWith("_"))
  .map((f) => yaml.load(readFileSync(join(root, "data/products", f), "utf8"), { schema: yaml.CORE_SCHEMA }))
  .map((d) => {
    const i = d.surfaces.inbound.grade, o = d.surfaces.outbound.grade;
    const headline = o === "N/A" ? i : RANK[i] <= RANK[o] ? i : o;
    const dates = JSON.stringify(d).match(/\d{4}-\d{2}-\d{2}/g) ?? [];
    const receipts = [...new Set([...d.surfaces.inbound.evidence, ...d.surfaces.outbound.evidence, ...HYG.flatMap((k) => d.hygiene[k].evidence ?? [])].map((e) => e.url))];
    return { ...d, headline, checked: dates.sort().at(-1), receipts };
  })
  .sort((a, b) => RANK[a.headline] - RANK[b.headline] || a.vendor.localeCompare(b.vendor) || a.product.localeCompare(b.product));

const counts = Object.fromEntries("ABCDF".split("").map((g) => [g, products.filter((p) => p.headline === g).length]));

const layout = ({ title, desc, body, path = "/", extraHead = "" }) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${SITE}${path}"><link rel="stylesheet" href="/style.css"><link rel="icon" href="/favicon.svg" type="image/svg+xml">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${SITE}${path}"><meta property="og:type" content="website"><meta name="twitter:card" content="summary">${extraHead}
</head><body><header class="top"><div class="wrap"><a class="brand" href="/">wif<span>.tax</span></a><nav><a href="/">Scoreboard</a><a href="/rubric/">Rubric</a><a href="/policy/">Disputes</a><a href="/our-own-tax/">Our own tax</a><a href="https://github.com/wiftax/wiftax">GitHub</a></nav></div></header>
<main class="wrap">${body}</main>
<footer><div class="wrap">wif.tax grades how machines authenticate. Humans are <a href="https://sso.tax">sso.tax</a>'s problem. Data is CC BY 4.0, code is Apache-2.0, every grade has a receipt. Wrong about something? <a href="/policy/">Dispute it</a>. Built ${TODAY}.</div></footer>
</body></html>`;

const hygRow = (p) => HYG.map((k) => { const v = p.hygiene[k].pass; return `<span class="${v === null ? "z" : v ? "y" : "n"}" title="${HYG_LABEL[k]}: ${v === null ? "no static credential to check" : v ? "pass" : "fail"}">${v === null ? "·" : v ? "✓" : "✗"}</span>`; }).join("");

// ---- index
const rows = products.map((p) => `<tr data-g="${p.headline}"><td>${badge(p.headline)}</td><td><a href="/p/${p.id}/"><b>${esc(p.vendor)}</b> ${esc(p.product)}</a>${p.status !== "listed" ? ` <span class="status-${p.status}">${p.status}</span>` : ""}</td><td>${badge(p.surfaces.inbound.grade)}</td><td>${badge(p.surfaces.outbound.grade)}</td><td class="hyg hide-sm">${hygRow(p)}</td><td class="hide-sm sub">${p.checked}</td></tr>`).join("\n");
const index = `<section class="hero"><h1>The static key tax.</h1>
<p>Some products let your workloads authenticate with a short-lived federated identity. The rest make you hold a long-lived secret, and you pay for that in rotation toil, vault sprawl, and eventually an incident.</p>
<p>This is the list. Machines only. Every grade has a receipt.</p>
<div class="stats"><div><b>${products.length}</b>products</div><div><b>${counts.A}</b>keyless (A)</div><div><b>${counts.D + counts.F}</b>static only (D–F)</div><div><b>${TODAY}</b>last build</div></div></section>
<table class="board" id="board"><thead><tr><th data-k="g">Grade</th><th data-k="n">Product</th><th title="How your workload reaches the product">Inbound</th><th title="How the product reaches your infrastructure">Outbound</th><th class="hide-sm" title="expiry · rotation API · scoping · last-used · leak revocation">Hygiene</th><th class="hide-sm">Checked</th></tr></thead><tbody>${rows}</tbody></table>
<p class="sub">Headline grade is the lower of the two surfaces. Hygiene marks: expiry · rotation API · scoping · last-used · leak revocation. Read the <a href="/rubric/">rubric</a>. Grades as JSON: <a href="/api/products.json"><code>/api/products.json</code></a>.</p>
<script>document.querySelectorAll('#board th[data-k]').forEach(th=>{let asc=true;th.onclick=()=>{const tb=th.closest('table').tBodies[0],rs=[...tb.rows],k=th.dataset.k;const r={A:5,B:4,C:3,D:2,F:1};rs.sort((a,b)=>k==='g'?(r[a.dataset.g]-r[b.dataset.g])*(asc?1:-1):a.cells[1].textContent.localeCompare(b.cells[1].textContent)*(asc?1:-1));asc=!asc;rs.forEach(x=>tb.appendChild(x))}})</script>`;
writeFileSync(join(out, "index.html"), layout({ title: "wif.tax — the static key tax", desc: "Which products let machines authenticate without long-lived secrets. Graded, with receipts.", body: index }));

// ---- product pages, json, badges
mkdirSync(join(out, "api/products"), { recursive: true });
mkdirSync(join(out, "badge"), { recursive: true });
const evList = (ev) => `<ul class="receipts">${(ev ?? []).map((e) => `<li><a href="${esc(e.url)}" rel="nofollow">${esc(host(e.url))}</a> <span class="sub">checked ${esc(e.checked_on)}</span>${e.quote ? `<blockquote>“${esc(e.quote)}”</blockquote>` : ""}</li>`).join("")}</ul>`;
const surface = (name, s, hint) => `<div class="card"><h2>${name} ${badge(s.grade)}${s.tier_gated ? `<span class="tier">requires ${esc(s.tier_gated)}</span>` : ""}</h2><p class="sub">${hint}</p><p class="mech">${esc(s.mechanism)}</p>${s.issuers?.length ? `<dl class="kv"><dt>Issuers</dt><dd>${esc(s.issuers.join(", "))}</dd></dl>` : ""}${evList(s.evidence)}${s.notes ? `<p class="notes">${esc(s.notes)}</p>` : ""}</div>`;
for (const p of products) {
  const path = `/p/${p.id}/`;
  const hyg = `<div class="card"><h2>Hygiene <span class="sub">for any static credential the product still issues</span></h2><table class="hygtable">${HYG.map((k) => { const c = p.hygiene[k]; return `<tr><td>${c.pass === null ? "·" : c.pass ? "✓" : "✗"} ${HYG_LABEL[k]}</td><td>${c.pass === null ? "<span class=sub>Not applicable: no static credential on the graded path.</span>" : ""}${c.notes ? `<div class="notes">${esc(c.notes)}</div>` : ""}${evList(c.evidence)}</td></tr>`; }).join("")}</table></div>`;
  const vs = p.vendor_statement ? `<div class="card"><h2>Vendor statement <span class="sub">${esc(p.vendor_statement.date)}</span></h2><blockquote>“${esc(p.vendor_statement.quote)}”</blockquote><a href="${esc(p.vendor_statement.url)}">source</a></div>` : "";
  const body = `<section class="hero"><p class="sub">${esc(p.vendor)}${p.status !== "listed" ? ` · <span class="status-${p.status}">${p.status}${p.graduated_on ? " " + p.graduated_on : ""}</span>` : ""}</p><h1>${badge(p.headline)} ${esc(p.product)}</h1><p class="summary">${esc(p.summary)}</p><p class="sub">Docs: <a href="${esc(p.docs ?? p.website)}">${esc(host(p.docs ?? p.website))}</a> · Checked ${p.checked} · <a href="https://github.com/wiftax/wiftax/blob/main/data/products/${p.id}.yaml">source YAML</a> · <a href="https://github.com/wiftax/wiftax/edit/main/data/products/${p.id}.yaml">dispute via PR</a></p></section>
${surface("Inbound", p.surfaces.inbound, "How a workload running anywhere authenticates to this product.")}
${surface("Outbound", p.surfaces.outbound, "How this product reaches into your cloud, repos, or other SaaS.")}
${hyg}${vs}${p.notes ? `<div class="card"><h2>Notes</h2><p class="notes">${esc(p.notes)}</p></div>` : ""}
<div class="card"><h2>Badge</h2><p><img src="/badge/${p.id}.svg" alt="wif.tax grade ${p.headline}"></p><pre>[![wif.tax grade](${SITE}/badge/${p.id}.svg)](${SITE}${path})</pre></div>`;
  mkdirSync(join(out, "p", p.id), { recursive: true });
  writeFileSync(join(out, "p", p.id, "index.html"), layout({ title: `${p.vendor} ${p.product}: grade ${p.headline} — wif.tax`, desc: p.summary, body, path }));
  writeFileSync(join(out, "api/products", `${p.id}.json`), JSON.stringify({ ...p, url: SITE + path }, null, 2));
  const label = "wif.tax", g = p.headline, w1 = 52, w2 = 30;
  writeFileSync(join(out, "badge", `${p.id}.svg`), `<svg xmlns="http://www.w3.org/2000/svg" width="${w1 + w2}" height="20" role="img" aria-label="wif.tax: ${g}"><title>wif.tax: ${g}</title><rect width="${w1}" height="20" fill="#555"/><rect x="${w1}" width="${w2}" height="20" fill="${COLOR[g]}"/><g fill="#fff" font-family="Verdana,DejaVu Sans,sans-serif" font-size="11" text-anchor="middle"><text x="${w1 / 2}" y="14">${label}</text><text x="${w1 + w2 / 2}" y="14" font-weight="bold">${g}</text></g></svg>`);
}
writeFileSync(join(out, "api/products.json"), JSON.stringify({ generated: TODAY, license: "CC-BY-4.0", rubric: SITE + "/rubric/", products: products.map((p) => ({ id: p.id, vendor: p.vendor, product: p.product, headline: p.headline, inbound: p.surfaces.inbound.grade, outbound: p.surfaces.outbound.grade, hygiene: Object.fromEntries(HYG.map((k) => [k, p.hygiene[k].pass])), status: p.status, checked: p.checked, summary: p.summary, url: `${SITE}/p/${p.id}/`, badge: `${SITE}/badge/${p.id}.svg` })) }, null, 2));

// ---- markdown pages
const mdPage = (slug, title, md, desc) => { mkdirSync(join(out, slug), { recursive: true }); writeFileSync(join(out, slug, "index.html"), layout({ title: `${title} — wif.tax`, desc, path: `/${slug}/`, body: `<article class="prose">${marked.parse(md)}</article>` })); };
mdPage("rubric", "Rubric", readFileSync(join(root, "RUBRIC.md"), "utf8"), "How wif.tax grades machine authentication.");
mdPage("policy", "Disputes and policy", readFileSync(join(root, "site/policy.md"), "utf8"), "How to dispute a grade, and what we will and will not change.");
mdPage("our-own-tax", "Our own tax", readFileSync(join(root, "site/our-own-tax.md"), "utf8"), "The static credentials wif.tax itself is forced to hold.");

// ---- misc
writeFileSync(join(out, "404.html"), layout({ title: "Not found — wif.tax", desc: "Not found", body: `<section class="hero"><h1>404</h1><p>No such page. The key you are looking for may have been rotated.</p><p><a href="/">Back to the scoreboard</a></p></section>` }));
mkdirSync(join(out, ".well-known"), { recursive: true });
writeFileSync(join(out, ".well-known/security.txt"), `Contact: mailto:security@wif.tax\nExpires: ${new Date(Date.now() + 365 * 864e5).toISOString()}\nPreferred-Languages: en\nCanonical: ${SITE}/.well-known/security.txt\nPolicy: https://github.com/wiftax/wiftax/blob/main/SECURITY.md\n`);
writeFileSync(join(out, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
const urls = ["/", "/rubric/", "/policy/", "/our-own-tax/", ...products.map((p) => `/p/${p.id}/`)];
writeFileSync(join(out, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${SITE}${u}</loc><lastmod>${TODAY}</lastmod></url>`).join("")}</urlset>`);
writeFileSync(join(out, "_headers"), `/*\n  X-Content-Type-Options: nosniff\n  X-Frame-Options: DENY\n  Referrer-Policy: strict-origin-when-cross-origin\n  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload\n  Content-Security-Policy: default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self' 'unsafe-inline'; frame-ancestors 'none'\n/api/*\n  Access-Control-Allow-Origin: *\n  Cache-Control: public, max-age=3600\n/badge/*\n  Access-Control-Allow-Origin: *\n  Cache-Control: public, max-age=3600\n`);
writeFileSync(join(out, "favicon.svg"), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#1a1a1a"/><text x="16" y="22" text-anchor="middle" font-family="monospace" font-weight="700" font-size="17" fill="#fff">$</text></svg>`);
cpSync(join(root, "site/style.css"), join(out, "style.css"));
console.log(`built ${products.length} products -> dist/`);
