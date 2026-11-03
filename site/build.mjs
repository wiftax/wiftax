// Static site generator: data/products/*.yaml -> dist/
import { readFileSync, readdirSync, writeFileSync, mkdirSync, cpSync, rmSync } from "node:fs";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import yaml from "js-yaml";
import { marked } from "marked";
import { rubricPage } from "./rubric.mjs";

const root = new URL("..", import.meta.url).pathname;
const out = join(root, "dist");
const SITE = "https://wif.tax";
const TODAY = new Date().toISOString().slice(0, 10);
// Web Awesome: self-host Pro when `npm run wa:pro` has fetched it, else the free CDN.
const WA_PRO = existsSync(join(root, "vendor/webawesome-pro/webawesome.loader.js"));
const WA = WA_PRO ? "/wa" : "https://ka-f.webawesome.com/webawesome@3.14.0";
// Font Awesome Pro icons, self-hosted under /icons when `npm run wa:pro` has fetched them; else Font Awesome Free.
const FA_PRO = existsSync(join(root, "vendor/fontawesome-pro/svgs/sharp-regular"));
const FREE_ALT = { "shield-check": "shield-halved", "badge-check": "circle-check" }; // Pro-only names, swapped on the free fallback
const icon = (name, { brand = false, solid = false, label = "", slot = "", cls = "" } = {}) => `<wa-icon${brand ? ' family="brands"' : FA_PRO ? ` family="sharp" variant="${solid ? "solid" : "regular"}"` : ""} name="${FA_PRO ? name : FREE_ALT[name] ?? name}"${label ? ` label="${esc(label)}"` : ""}${slot ? ` slot="${slot}"` : ""}${cls ? ` class="${cls}"` : ""}></wa-icon>`;
const TIP_V = createHash("sha256").update(readFileSync(join(root, "site/tooltip.js"))).digest("hex").slice(0, 8);
const OG_V = createHash("sha256").update(readFileSync(join(root, "site/og.png"))).digest("hex").slice(0, 8);
const CSS_V = createHash("sha256").update(readFileSync(join(root, "site/style.css"))).digest("hex").slice(0, 8);
const THEME = WA_PRO ? { theme: "tailspin", palette: "vogue" } : { theme: "default", palette: "default" };
const RANK = { A: 5, B: 4, C: 3, D: 2, F: 1 };
const HYG = ["expiry", "rotation_api", "scoping", "last_used", "leak_revocation"];
const HYG_LABEL = { expiry: "Expiry enforceable", rotation_api: "Rotation via API", scoping: "Scoped keys", last_used: "Last-used visible", leak_revocation: "Leak revocation" };
const COLOR = { A: "#5BBF8A", B: "#5E9BE0", C: "#E3B341", D: "#EE9360", F: "#E36A7F", "N/A": "#9a9a9a" }; // keep in sync with --grade-* in style.css

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const gcls = (g) => `g g-${g === "N/A" ? "NA" : g}`;
const badge = (g) => `<wa-badge class="grade grade-${g === "N/A" ? "NA" : g}" appearance="filled">${g === "N/A" ? "n/a" : g}</wa-badge>`;
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
<html lang="en" class="wa-theme-${THEME.theme} wa-palette-${THEME.palette} wa-light wa-cloak"><head><meta charset="utf-8"><link rel="stylesheet" href="${WA}/styles/webawesome.css">${THEME.theme !== "default" ? `<link rel="stylesheet" href="${WA}/styles/themes/${THEME.theme}.css">` : ""}${THEME.palette !== "default" ? `<link rel="stylesheet" href="${WA}/styles/color/palettes/${THEME.palette}.css">` : ""}<script type="importmap">{"imports":{"@floating-ui/core":"/vendor/floating-ui.core.mjs","@floating-ui/dom":"/vendor/floating-ui.dom.mjs"}}</script><script type="module" src="${WA}/webawesome.loader.js"></script><script type="module" src="/tooltip.js?v=${TIP_V}"></script>${FA_PRO ? `<script type="module">import { setIconPath } from "${WA}/webawesome.loader.js"; setIconPath("/icons");</script>` : ""}<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${SITE}${path}"><link rel="stylesheet" href="/style.css?v=${CSS_V}"><link rel="icon" href="/favicon.svg" type="image/svg+xml">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${SITE}${path}"><meta property="og:type" content="website"><meta property="og:site_name" content="wif.tax"><meta property="og:image" content="${SITE}/og.png?v=${OG_V}"><meta property="og:image:type" content="image/png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="wif.tax with grade tiles A, B, C, D and F"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${SITE}/og.png?v=${OG_V}"><meta name="twitter:image:alt" content="wif.tax with grade tiles A, B, C, D and F"><meta name="theme-color" content="#F7F6F2">${extraHead}
</head><body><header class="top"><div class="wrap wa-split"><a class="brand" href="/">wif<span>.tax</span></a><nav class="wa-cluster wa-gap-l"><a href="/rubric/">Rubric</a><a href="/policy/">Disputes</a><a href="/our-own-tax/">Our own tax</a><a href="https://github.com/wiftax/wiftax" aria-label="GitHub">${icon("github", { brand: true })}</a></nav></div></header>
<main class="wrap">${body}</main>
</body></html>`;

// ---- index: one entry per company
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const companies = Object.values(products.reduce((m, p) => ((m[p.vendor] ??= { vendor: p.vendor, parent: p.parent, products: [] }).products.push(p), m), {}))
  .map((c) => ({ ...c, slug: slug(c.vendor), grade: c.products.reduce((g, p) => (RANK[p.headline] < RANK[g] ? p.headline : g), "A") }))
  .sort((a, b) => a.vendor.localeCompare(b.vendor));
const href = (c) => `/?c=${c.slug}`;
const items = companies.map((c) => {
  const hay = [c.vendor, c.parent, ...c.products.flatMap((p) => [p.product, ...(p.aliases ?? [])])].filter(Boolean).join(" ").toLowerCase();
  return `<li data-s="${esc(hay)}" data-g="${c.grade}"><a href="${href(c)}" data-m="${c.slug}"><span class="co">${esc(c.vendor)}</span>${c.products.length > 1 ? `<wa-badge class="nprod" variant="neutral" appearance="outlined" pill>${c.products.length}</wa-badge>` : ""}</a><button type="button" class="gpick" data-grade="${c.grade}" aria-label="Show only grade ${c.grade}">${badge(c.grade)}</button></li>`;
}).join("");
// ---- company modal: every company opens in a dialog (the page link stays as the no-JS fallback)
// Grade names straight from RUBRIC.md: first A–F table is inbound, second (A–F, N/A) is outbound.
const RUBRIC_NAMES = (() => {
  const rows = [...readFileSync(join(root, "RUBRIC.md"), "utf8").matchAll(/^\| \*\*(A|B|C|D|F|N\/A)\*\* \| (.+?) \|\s*$/gm)];
  const name = (cell) => (cell.match(/^\*\*(.+?)\*\*/)?.[1] ?? cell).replace(/\.$/, "").replace(/^"(.*)"$/, "$1");
  const inbound = {}, outbound = {};
  rows.forEach(([, g, cell], n) => ((n < 5 ? inbound : outbound)[g] = name(cell)));
  if (Object.keys(inbound).length !== 5 || Object.keys(outbound).length !== 6) throw new Error("RUBRIC.md grade tables not found in the expected shape");
  return { inbound, outbound };
})();
const tip = (id, target, text) => `<span class="tip" tabindex="0" data-tip="${esc(text)}">${target}</span>`;
const HYG_ICON = { expiry: "hourglass", rotation_api: "arrows-rotate", scoping: "shield-check", last_used: "clock-rotate-left", leak_revocation: "link-slash" };
const mHygRow = (p) => HYG.map((k) => { const v = p.hygiene[k].pass; return tip(`t-${p.id}-h-${k}`, `<span class="tile ${v === null ? "hz" : v ? "hy" : "hn"}">${icon(HYG_ICON[k], { label: v === null ? "n/a" : v ? "pass" : "fail" })}</span>`, HYG_LABEL[k]); }).join("");
const mRow = (p) => {
  const i = p.surfaces.inbound.grade, o = p.surfaces.outbound.grade;
  const side = o !== "N/A" && RANK[o] < RANK[i] ? ["Outbound", RUBRIC_NAMES.outbound[o]] : ["Inbound", RUBRIC_NAMES.inbound[i]];
  return `<tr data-p="${p.id}"><th scope="row"><button type="button" class="m-open">${esc(p.product)}</button></th><td data-l="Grade" data-tab="${side[0] === "Outbound" ? "out" : "in"}">${tip(`t-${p.id}-g`, badge(p.headline), side[1])}</td><td data-l="Inbound" data-tab="in">${tip(`t-${p.id}-in`, badge(i), RUBRIC_NAMES.inbound[i])}</td><td data-l="Outbound" data-tab="out">${o === "N/A" ? tip(`t-${p.id}-out`, `<span class="na">—</span>`, RUBRIC_NAMES.outbound["N/A"]) : tip(`t-${p.id}-out`, badge(o), RUBRIC_NAMES.outbound[o])}</td><td class="m-hy" data-l="Hygiene" data-tab="hy">${mHygRow(p)}</td><td class="m-go" aria-hidden="true"></td></tr>`;
};
// Expandable receipts under each product row: the card's own summary, mechanisms and evidence quotes.
// Evidence text comes verbatim from vendor docs (markdown, code spans, table rows, JSON). Render it readably without changing the words.
const PRODUCT_NAME = Object.fromEntries(products.map((p) => [p.id, p.product === p.vendor ? p.vendor : `${p.vendor} ${p.product}`]));
const tidy = (t) => String(t).replace(/\s+/g, " ").replace(/\s+([.,;:!?)\]])/g, "$1").replace(/([(\[])\s+/g, "$1").trim();
const inline = (t) => {
  // split out code spans first so nothing inside them is touched
  const md = tidy(t).replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/\*\*/g, "").replace(/^#+\s+/, "");
  return md.split(/(`[^`]+`)/g).map((seg) => {
    if (/^`[^`]+`$/.test(seg)) { const c = seg.slice(1, -1); return PRODUCT_NAME[c] ? esc(PRODUCT_NAME[c]) : `<code>${esc(c)}</code>`; }
    seg = seg.replace(/(\w)`(\w)/g, "$1’$2").replace(/`/g, "").replace(/(^|\s)\*([^*\s][^*]*?)\*(?=[\s.,;:]|$)/g, "$1$2").replace(/(\w)\*(?=\s|$)/g, "$1");
    // URLs, <PLACEHOLDERS>, snake_case and namespaced identifiers read as code
    return seg.split(/(https?:\/\/[^\s"')]+[^\s"').,;:]|<[A-Za-z_][\w-]*>|\b[a-z][a-z0-9]*(?:_[a-z0-9]+)+\b|\b[a-z0-9-]+:[A-Z][A-Za-z]+\b)/g).map((x, k) => k % 2 ? `<code>${esc(x)}</code>` : esc(x)).join("");
  }).join("");
};
const GH_COLS = ["Partner", "User alert", "Push protection", "Validity check", "Metadata", "Base64"];
const quote = (e) => {
  const q = tidy(e.quote);
  const cells = q.split("|").map((c) => c.trim()).filter((c, k, a) => !(c === "" && (k === 0 || k === a.length - 1)));
  if (/supported-secret-scanning-patterns/.test(e.url) && cells.length === 9)
    return `<div class="ev-gh"><b>${esc(cells[1])}</b><span class="ev-cells">${GH_COLS.map((h, k) => `<span class="${cells[k + 3] === "✓" ? "y" : "n"}">${cells[k + 3] === "✓" ? "✓" : "✗"} ${h}</span>`).join("")}</span></div>`;
  if (cells.length >= 3 && /\|/.test(q)) return `<div class="ev-cells ev-row">${cells.filter(Boolean).map((c) => `<span>${inline(c)}</span>`).join("")}</div>`;
  if (/^\s*(\{|\[\s*["{\d])/.test(q) || /^\s*"[\w$-]+"\s*:/.test(q) || /\s{2,}=/.test(e.quote)) return `<code class="ev-code">${esc(q)}</code>`;
  return `<blockquote>${inline(q)}</blockquote>`;
};
// One source line per page, with every quote taken from it.
// Product view: opened from a row in the company modal. Body is dist/ev/<id>.html, fetched on demand (site/pd.js).
const pdSrc = (ev) => {
  if (!ev?.length) return "";
  const by = new Map();
  for (const e of ev) { const g = by.get(e.url) ?? by.set(e.url, { url: e.url, on: e.checked_on, qs: [] }).get(e.url); if (e.quote) g.qs.push(e); if (e.checked_on > g.on) g.on = e.checked_on; }
  return `<div class="srcs">${[...by.values()].map((g) => `<article class="src">${g.qs.map(quote).join("")}<footer><a href="${esc(g.url)}" target="_blank" rel="nofollow noopener">${esc(host(g.url))}<span aria-hidden="true">↗</span></a><time>${esc(g.on)}</time></footer></article>`).join("")}</div>`;
};
const pdSurf = (key, side, s) => `<div class="pd-pane" role="tabpanel" data-tab="${key}" hidden><p class="pd-mean">${badge(s.grade)}<span>${esc(RUBRIC_NAMES[side][s.grade])}</span></p>${s.tier_gated ? `<p class="pd-tier">${esc(s.tier_gated)}</p>` : ""}${pdSrc(s.evidence)}</div>`;
const pdHyg = (p) => `<div class="pd-pane" role="tabpanel" data-tab="hy" hidden><ul class="pd-hyg">${HYG.map((k) => {
  const h = p.hygiene[k], v = h.pass, cls = v === null ? "hz" : v ? "hy" : "hn", st = v === null ? "n/a" : v ? "pass" : "fail";
  const row = `<span class="tile ${cls}">${icon(HYG_ICON[k])}</span><span class="pd-hl">${HYG_LABEL[k]}</span><span class="pd-hv pd-${cls}">${st}</span>`;
  return `<li>${h.evidence?.length ? `<details><summary>${row}<span class="pd-chev" aria-hidden="true"></span></summary>${pdSrc(h.evidence)}</details>` : `<div class="pd-hrow">${row}</div>`}</li>`;
}).join("")}</ul></div>`;
const mFlags = (p) => `${p.status === "disputed" ? `<p class="ev-flag">${icon("flag")} <b>Disputed.</b></p>` : p.status === "graduated" ? `<p class="ev-flag ev-grad">${icon("star")} <b>Graduated${p.graduated_on ? ` ${esc(p.graduated_on)}` : ""}.</b></p>` : ""}${p.confidence ? `<p class="ev-flag">${icon("triangle-exclamation")} <span><b>Low confidence.</b> ${inline(p.confidence.reason)}</span></p>` : ""}${p.vendor_statement ? `<div class="pd-vs"><h4>Vendor statement</h4>${pdSrc([{ url: p.vendor_statement.url, checked_on: p.vendor_statement.date, quote: p.vendor_statement.quote }])}</div>` : ""}`;
const pdBody = (p) => {
  const i = p.surfaces.inbound.grade, o = p.surfaces.outbound.grade, applic = HYG.filter((k) => p.hygiene[k].pass !== null), pass = applic.filter((k) => p.hygiene[k].pass).length;
  return `<h3 class="pd-name">${esc(p.product)}</h3>${p.summary ? `<p class="ev-sum">${inline(p.summary)}</p>` : ""}${mFlags(p)}<div class="pd-tabs" role="tablist"><button type="button" role="tab" data-tab="in">Inbound ${badge(i)}</button><button type="button" role="tab" data-tab="out">Outbound ${o === "N/A" ? `<span class="na">—</span>` : badge(o)}</button><button type="button" role="tab" data-tab="hy">Hygiene <span class="pd-n">${applic.length ? `${pass}/${applic.length}` : "n/a"}</span></button></div>${pdSurf("in", "inbound", p.surfaces.inbound)}${pdSurf("out", "outbound", p.surfaces.outbound)}${pdHyg(p)}`;
};
mkdirSync(join(out, "ev"), { recursive: true });
for (const p of products) writeFileSync(join(out, "ev", `${p.id}.html`), pdBody(p));
// Column heading with a "?" that explains it. Wording is the site's existing surface descriptions.
const qh = (slug, key, label, text) => `<span class="qh">${label}<span class="q" tabindex="0" aria-label="About ${label}" data-tip="${esc(text)}">${icon("circle-question", { solid: true })}</span></span>`;
const companyModal = (c) => `<template id="m-${c.slug}" data-label="${esc(c.vendor)}"><div class="m-head" tabindex="-1" autofocus><span class="m-name">${esc(c.vendor)}</span>${c.parent ? `<span class="m-parent">${esc(c.parent)}</span>` : ""}</div><table class="m-table"><thead><tr><th scope="col"><span class="wa-visually-hidden">Product</span></th><th scope="col">${qh(c.slug, "g", "Grade", "The product's headline grade is the lower of the two, because the weakest link is the one that leaks.")}</th><th scope="col">${qh(c.slug, "in", "Inbound", "How a workload running anywhere authenticates to this product.")}</th><th scope="col">${qh(c.slug, "out", "Outbound", "How this product reaches into your cloud, repos, or other SaaS.")}</th><th scope="col">${qh(c.slug, "hy", "Hygiene", "For any static credential the product still issues.")}</th><th aria-hidden="true"></th></tr></thead><tbody>${c.products.map(mRow).join("")}</tbody></table><div class="m-foot"><wa-button class="btn-2" href="/rubric/">Methodology</wa-button><wa-button class="btn-1" href="https://github.com/wiftax/wiftax/issues/new?title=${encodeURIComponent(c.vendor)}" target="_blank">Suggest a fix</wa-button></div></template>`;
const index = `<h1 class="wa-visually-hidden">wif.tax</h1>
<div class="finder"><wa-input id="q" type="search" size="large" placeholder="Search" with-clear autocomplete="off" label="Search companies and products">${icon("magnifying-glass", { slot: "start" })}<div slot="end" class="gf" role="group" aria-label="Filter by grade"><div class="gf-tray">${"ABCDF".split("").map((g) => `<button type="button" class="gt gt-${g}" data-grade="${g}" aria-pressed="false" aria-label="Grade ${g}">${g}</button>`).join("")}</div>${icon(FA_PRO ? "bars-filter" : "filter", { cls: "gf-icon" })}</div></wa-input></div>
<ul class="companies wa-grid wa-gap-0" id="list">${items}</ul>
<wa-dialog id="m" light-dismiss class="m-dialog"><div slot="label" id="m-label"></div><div id="m-body"></div><div slot="footer" id="m-foot"></div></wa-dialog>${companies.map(companyModal).join("")}
<p class="empty" id="empty" hidden>${icon("magnifying-glass")} No match. <a href="https://github.com/wiftax/wiftax#add-or-dispute-a-product">Add it</a>.</p>
<script type="module">await customElements.whenDefined('wa-input');const q=document.getElementById('q'),gf=q.querySelector('.gf'),gb=[...gf.querySelectorAll('[data-grade]')],li=[...document.querySelectorAll('#list li')],empty=document.getElementById('empty'),list=document.getElementById('list'),sel=new Set();
const u0=new URLSearchParams(location.search);if(u0.get('q'))q.value=u0.get('q');for(const g of (u0.get('g')||''))if('ABCDF'.includes(g))sel.add(g);
const calm=matchMedia('(prefers-reduced-motion: reduce)'),EASE='cubic-bezier(.22,1,.36,1)';
function flip(apply){if(calm.matches)return apply();const box=list.getBoundingClientRect(),before=new Map();for(const r of li)if(!r.hidden)before.set(r,r.getBoundingClientRect());const wasEmpty=!empty.hidden;apply();
for(const [r,b] of before)if(r.hidden){const g=r.cloneNode(true);g.hidden=false;g.removeAttribute('data-s');g.setAttribute('aria-hidden','true');g.className='ghost';g.style.cssText=\`left:\${b.left-box.left}px;top:\${b.top-box.top}px;width:\${b.width}px\`;list.appendChild(g);g.animate([{opacity:1,transform:'none'},{opacity:0,transform:'scale(.94)'}],{duration:200,easing:'ease-out',fill:'forwards'}).finished.then(()=>g.remove(),()=>g.remove())}
let k=0;for(const r of li){if(r.hidden)continue;const a=r.getBoundingClientRect(),b=before.get(r);if(b){const dx=b.left-a.left,dy=b.top-a.top;if(dx||dy)r.animate([{transform:\`translate(\${dx}px,\${dy}px)\`},{transform:'none'}],{duration:480,easing:EASE})}else r.animate([{opacity:0,transform:'translateY(8px) scale(.97)'},{opacity:1,transform:'none'}],{duration:380,delay:Math.min(k++,24)*14,easing:EASE,fill:'backwards'})}
if(wasEmpty!==!empty.hidden&&!empty.hidden)empty.animate([{opacity:0,transform:'translateY(-4px)'},{opacity:1,transform:'none'}],{duration:260,easing:EASE})}
function run(animate=true){const v=(q.value||'').trim(),t=v.toLowerCase().split(/\\s+/).filter(Boolean);const apply=()=>{let n=0;for(const r of li){const ok=(!sel.size||sel.has(r.dataset.g))&&t.every(w=>r.dataset.s.includes(w));r.hidden=!ok;if(ok)n++}empty.hidden=n>0;list.hidden=n===0};animate?flip(apply):apply();gb.forEach(b=>b.setAttribute('aria-pressed',sel.has(b.dataset.grade)));gf.classList.toggle('active',sel.size>0);const u=new URLSearchParams();if(v)u.set('q',v);if(sel.size)u.set('g',[...sel].sort().join(''));history.replaceState(null,'',u.toString()?'?'+u:location.pathname)}
document.getElementById('list').addEventListener('click',e=>{const b=e.target.closest('.gpick');if(!b)return;const g=b.dataset.grade,only=sel.size===1&&sel.has(g);sel.clear();if(!only)sel.add(g);run()});
gb.forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();const g=b.dataset.grade;sel.has(g)?sel.delete(g):sel.add(g);run()}));
gf.querySelector('.gf-icon').addEventListener('click',()=>q.focus());
q.addEventListener('input',run);q.addEventListener('keydown',e=>{if(e.key==='Enter'){const r=li.find(x=>!x.hidden);if(r)r.querySelector('a').click()}});
const dlg=document.getElementById('m'),mLabel=document.getElementById('m-label'),mBody=document.getElementById('m-body'),mFoot=document.getElementById('m-foot');
function setC(slug){const u=new URL(location);slug?u.searchParams.set('c',slug):(u.searchParams.delete('c'),u.searchParams.delete('p'));history.replaceState(null,'',u)}
async function openCompany(slug){const t=document.getElementById('m-'+slug);if(!t)return false;await customElements.whenDefined('wa-dialog');const f=t.content.cloneNode(true),h=f.querySelector('.m-head');mLabel.replaceChildren(h);mFoot.replaceChildren(f.querySelector('.m-foot'));mBody.replaceChildren(f);dlg.setAttribute('aria-label',t.dataset.label);dlg.open=true;setC(slug);return true}
list.addEventListener('click',e=>{const a=e.target.closest('a[data-m]');if(!a||e.metaKey||e.ctrlKey||e.shiftKey)return;e.preventDefault();openCompany(a.dataset.m)});
dlg.addEventListener('wa-hide',e=>{if(e.target===dlg)dlg.classList.add('closing')});
const hold=e=>{const b=e.composedPath().find(n=>n.part&&n.part.contains('body'));if(!b||b.scrollHeight<=b.clientHeight)e.preventDefault()};
dlg.addEventListener('wa-show',e=>{if(e.target!==dlg)return;addEventListener('wheel',hold,{passive:false});addEventListener('touchmove',hold,{passive:false})});
dlg.addEventListener('wa-after-hide',e=>{if(e.target!==dlg)return;removeEventListener('wheel',hold);removeEventListener('touchmove',hold)});
dlg.addEventListener('wa-after-hide',e=>{if(e.target===dlg){dlg.classList.remove('closing');setC(null)}});
(window.requestIdleCallback||setTimeout)(()=>{const w=document.createElement('div');w.hidden=true;w.setAttribute('aria-hidden','true');const t=document.querySelector('template[id^="m-"]');if(t)w.append(...[...t.content.querySelectorAll('wa-icon')].map(i=>i.cloneNode()));document.body.append(w)});
run(false);if(u0.get('c'))openCompany(u0.get('c'))</script>`;
writeFileSync(join(out, "index.html"), layout({ extraHead: `<script type="module" src="/pd.js?v=${createHash("sha256").update(readFileSync(join(root, "site/pd.js"))).digest("hex").slice(0, 8)}"></script>`, title: "wif.tax — the static key tax", desc: "Which products let machines authenticate without long-lived secrets. Graded, with receipts.", body: index }));

// ---- json, badges (no per-product pages: products live in the company modal on /)
mkdirSync(join(out, "api/products"), { recursive: true });
mkdirSync(join(out, "badge"), { recursive: true });
for (const p of products) {
  const path = `/?c=${slug(p.vendor)}&p=${p.id}`;
  writeFileSync(join(out, "api/products", `${p.id}.json`), JSON.stringify({ ...p, url: SITE + path }, null, 2));
  const label = "wif.tax", g = p.headline, w1 = 52, w2 = 30;
  writeFileSync(join(out, "badge", `${p.id}.svg`), `<svg xmlns="http://www.w3.org/2000/svg" width="${w1 + w2}" height="20" role="img" aria-label="wif.tax: ${g}"><title>wif.tax: ${g}</title><rect width="${w1}" height="20" fill="#555"/><rect x="${w1}" width="${w2}" height="20" fill="${COLOR[g]}"/><g fill="#fff" font-family="Verdana,DejaVu Sans,sans-serif" font-size="11" text-anchor="middle"><text x="${w1 / 2}" y="14">${label}</text><text x="${w1 + w2 / 2}" y="14" font-weight="bold">${g}</text></g></svg>`);
}
writeFileSync(join(out, "api/products.json"), JSON.stringify({ generated: TODAY, license: "CC-BY-4.0", rubric: SITE + "/rubric/", products: products.map((p) => ({ id: p.id, vendor: p.vendor, product: p.product, headline: p.headline, inbound: p.surfaces.inbound.grade, outbound: p.surfaces.outbound.grade, hygiene: Object.fromEntries(HYG.map((k) => [k, p.hygiene[k].pass])), status: p.status, confidence: p.confidence?.level ?? "normal", checked: p.checked, summary: p.summary, url: `${SITE}/p/${p.id}/`, badge: `${SITE}/badge/${p.id}.svg` })) }, null, 2));

// ---- markdown pages
const mdPage = (slug, title, md, desc) => { mkdirSync(join(out, slug), { recursive: true }); writeFileSync(join(out, slug, "index.html"), layout({ title: `${title} — wif.tax`, desc, path: `/${slug}/`, body: `<article class="prose">${marked.parse(md)}</article>` })); };
{
  const ex = products.find((p) => p.id === "aembit-workload-iam") ?? products[0];
  const e = ex.surfaces.inbound.evidence.find((x) => x.quote && x.quote.length < 160) ?? ex.surfaces.inbound.evidence[0];
  const v = (f) => createHash("sha256").update(readFileSync(join(root, "site", f))).digest("hex").slice(0, 8);
  const body = rubricPage({ md: readFileSync(join(root, "RUBRIC.md"), "utf8"), icon, badge, esc, HYG, HYG_LABEL, HYG_ICON, sample: { ...e, vendor: ex.vendor, product: ex.product } });
  mkdirSync(join(out, "rubric"), { recursive: true });
  writeFileSync(join(out, "rubric", "index.html"), layout({ title: "Rubric — wif.tax", desc: "How wif.tax grades machine authentication.", path: "/rubric/", body, extraHead: `<link rel="stylesheet" href="/rubric.css?v=${v("rubric.css")}"><script type="module" src="/rubric.js?v=${v("rubric.js")}"></script>` }));
}
mdPage("policy", "Disputes and policy", readFileSync(join(root, "site/policy.md"), "utf8"), "How to dispute a grade, and what we will and will not change.");
mdPage("our-own-tax", "Our own tax", readFileSync(join(root, "site/our-own-tax.md"), "utf8"), "The static credentials wif.tax itself is forced to hold.");

// ---- misc
writeFileSync(join(out, "404.html"), layout({ title: "Not found — wif.tax", desc: "Not found", body: `<section class="hero"><h1>404</h1><p>No such page. The key you are looking for may have been rotated.</p><p><a href="/">Back to the scoreboard</a></p></section>` }));
mkdirSync(join(out, ".well-known"), { recursive: true });
writeFileSync(join(out, ".well-known/security.txt"), `Contact: mailto:security@wif.tax\nExpires: ${new Date(Date.now() + 365 * 864e5).toISOString()}\nPreferred-Languages: en\nCanonical: ${SITE}/.well-known/security.txt\nPolicy: https://github.com/wiftax/wiftax/blob/main/SECURITY.md\n`);
writeFileSync(join(out, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
const urls = ["/", "/rubric/", "/policy/", "/our-own-tax/"];
writeFileSync(join(out, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${SITE}${u}</loc><lastmod>${TODAY}</lastmod></url>`).join("")}</urlset>`);
// Old per-company and per-product pages now open the company modal (and expand the product's evidence).
writeFileSync(join(out, "_redirects"), [
  ...products.flatMap((p) => [`/p/${p.id}/ /?c=${slug(p.vendor)}&p=${p.id} 301`, `/p/${p.id} /?c=${slug(p.vendor)}&p=${p.id} 301`]),
  "/c/:slug/ /?c=:slug 301", "/c/:slug /?c=:slug 301", "/p/* / 301",
].join("\n") + "\n");
writeFileSync(join(out, "_headers"), `/*\n  X-Content-Type-Options: nosniff\n  X-Frame-Options: DENY\n  Referrer-Policy: strict-origin-when-cross-origin\n  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload\n  Content-Security-Policy: default-src 'self'; img-src 'self' data: https://ka-f.webawesome.com https://ka-f.fontawesome.com; style-src 'self' 'unsafe-inline' https://ka-f.webawesome.com https://fonts.bunny.net https://ka-f.fontawesome.com; font-src 'self' https://ka-f.webawesome.com https://fonts.bunny.net https://ka-f.fontawesome.com; connect-src 'self' data: https://ka-f.webawesome.com https://ka-f.fontawesome.com; script-src 'self' 'unsafe-inline' https://ka-f.webawesome.com https://ka-f.fontawesome.com; frame-ancestors 'none'\n/api/*\n  Access-Control-Allow-Origin: *\n  Cache-Control: public, max-age=3600\n/badge/*\n  Access-Control-Allow-Origin: *\n  Cache-Control: public, max-age=3600\n`);
writeFileSync(join(out, "favicon.svg"), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#1a1a1a"/><text x="16" y="22" text-anchor="middle" font-family="monospace" font-weight="700" font-size="17" fill="#fff">$</text></svg>`);
cpSync(join(root, "site/style.css"), join(out, "style.css"));
cpSync(join(root, "site/tooltip.js"), join(out, "tooltip.js"));
for (const f of ["rubric.css", "rubric.js", "og.png", "pd.js"]) cpSync(join(root, "site", f), join(out, f));
mkdirSync(join(out, "vendor"), { recursive: true });
for (const [pkg, f] of [["core", "floating-ui.core.mjs"], ["dom", "floating-ui.dom.mjs"]]) cpSync(join(root, `node_modules/@floating-ui/${pkg}/dist/floating-ui.${pkg}.browser.min.mjs`), join(out, "vendor", f));
if (WA_PRO) cpSync(join(root, "vendor/webawesome-pro"), join(out, "wa"), { recursive: true });
if (FA_PRO) {
  const used = new Set();
  const walk = (d) => readdirSync(d, { withFileTypes: true }).forEach((e) => e.isDirectory() ? walk(join(d, e.name)) : e.name.endsWith(".html") && readFileSync(join(d, e.name), "utf8").replace(/<wa-icon([^>]*)>/g, (_, a) => used.add((/family="brands"/.test(a) ? "brands" : /variant="solid"/.test(a) ? "sharp-solid" : "sharp-regular") + "/" + a.match(/name="([^"]+)"/)[1])));
  walk(out);
  for (const u of used) {
    const src = join(root, "vendor/fontawesome-pro/svgs", u + ".svg");
    if (!existsSync(src)) throw new Error(`icon not found: ${u}`);
    mkdirSync(join(out, "icons", u.split("/")[0]), { recursive: true });
    cpSync(src, join(out, "icons", u + ".svg"));
  }
  console.log(`icons: ${used.size} Font Awesome Pro SVGs -> dist/icons/`);
}
console.log(`built ${products.length} products -> dist/ (Web Awesome ${WA_PRO ? "Pro, self-hosted" : "free CDN"}, theme ${THEME.theme}/${THEME.palette}, icons ${FA_PRO ? "Font Awesome Pro" : "Font Awesome Free"})`);
