import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import * as yaml from "js-yaml";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = new URL("..", import.meta.url).pathname;
const schema = JSON.parse(readFileSync(join(root, "schema/product.schema.json"), "utf8"));
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile(schema);

const dir = join(root, "data/products");
const files = readdirSync(dir).filter((f) => f.endsWith(".yaml") && !f.startsWith("_"));
const STALE_DAYS = 365;
const RANK = { A: 5, B: 4, C: 3, D: 2, F: 1, "N/A": 6 };
let failed = 0;

// Receipt URLs must be pages a reader can open. A site's build files (hashed JS bundles,
// /assets/js/, /_next/static/) change name on every deploy, so cite the page instead.
// Source files in a repo (raw.githubusercontent.com, github.com) are fine.
//
// The exception: docs sites that render only in the browser, where every page is an
// empty app shell to anything but a browser and the bundle is the only readable copy
// of the sentence. Sisyphus follows those bundles to their new name on each deploy.
// Add a host here only after checking that its pages have no text without JavaScript.
const BUILD_FILE = [
  /\/(assets|static|_next|_nuxt|build|dist)\/.*\.(m?js|css|map)$/i,
  /[.-][0-9a-f]{8,}\.(m?js|css|map)$/i,
];
const BROWSER_ONLY_DOCS = new Set(["docs.upwind.io", "automate.zscaler.com"]);
const SOURCE_HOSTS = new Set(["github.com", "raw.githubusercontent.com", "gist.githubusercontent.com"]);
function receiptUrls(doc) {
  const out = [];
  const walk = (o, path) => {
    if (!o || typeof o !== "object") return;
    if (typeof o.url === "string" && (path.includes("evidence") || path === "vendor_statement")) out.push([path, o.url]);
    for (const [k, v] of Object.entries(o)) walk(v, path ? `${path}.${k}` : k);
  };
  walk(doc, "");
  return out
    .filter(([, url]) => {
      try {
        const u = new URL(url);
        if (SOURCE_HOSTS.has(u.hostname) || BROWSER_ONLY_DOCS.has(u.hostname)) return false;
        return BUILD_FILE.some((re) => re.test(u.pathname));
      } catch {
        return false;
      }
    })
    .map(([path, url]) => `${path}: ${url} is a site build file, not a page. Its name changes on every deploy. Cite the page that shows the text. If that page has no text without JavaScript, see BROWSER_ONLY_DOCS in scripts/validate.mjs`);
}

// Prose lint. Cards must read as sentences, not identifier soup strung together with
// semicolons. Applies to our own words only; evidence quotes are verbatim and exempt.
const PROSE_FIELDS = new Set(["summary", "mechanism", "notes", "covers", "reason"]);
const MAX_SENTENCE_WORDS = 35, MAX_PARENS = 2, MAX_IDENTS = 3, MAX_SUMMARY_WORDS = 60;
// backticked code, snake_case, SCREAMING_CASE, camelCase, a.b.c paths, scheme:value
const IDENT = /`[^`]+`|\b[a-z]+_[a-z0-9_]+\b|\b[A-Z][A-Z0-9]*_[A-Z0-9_]+\b|\b[a-z]+[A-Z]\w*\b|\b\w+\.\w+\.\w+\b|\b[a-z]+:[a-z]+\b/g;
const words = (s) => s.trim().split(/\s+/).length;
// Card text describes the product. How a page was fetched is reviewer context and goes in
// the PR description. Checked in summary and notes only, so a mechanism can still say a
// product needs JavaScript.
const PROCESS = /plain (HTTP )?fetch|(renders?|rendered) only (with|in)|(needs?|without) JavaScript|rendered by script|receipts? cites?|bot check|browser (check|challenge)|non-browser client/i;
// Sentences that say nothing about this product. Every C, D or F card moves to A or B only
// with federation, the page already shows the grade, and every card applies the rubric.
const FILLER = [
  [/moves to (A or B|B or A) only\b/i, "says the card moves to A or B only with federation, which is true of every card. Cut it"],
  [/^the headline( grade)? is [A-F]\b(?!.*either way)(,| because)?[^.]*\.$/i, "restates the headline grade, which the page already shows. Cut it"],
  [/rubric's rule|under the rubric\b/i, "talks about the rubric. Describe the product"],
];
const NUM = { no: 0, none: 0, zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5 };
const sentences = (v) => v.split(/(?<=[.!?])\s+(?=[A-Z"`(])/);
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
function prose(doc, passes) {
  const out = [];
  const seen = new Map();
  const walk = (o, path) => {
    if (!o || typeof o !== "object") return;
    for (const [k, v] of Object.entries(o)) {
      const p = path ? `${path}.${k}` : k;
      if (k === "evidence") continue;
      if (!PROSE_FIELDS.has(k) || typeof v !== "string") { walk(v, p); continue; }
      if (v.includes(";")) out.push(`${p}: has a semicolon. Split it into sentences`);
      if (k === "summary" && words(v) > MAX_SUMMARY_WORDS) out.push(`${p}: ${words(v)} words, max ${MAX_SUMMARY_WORDS}`);
      if ((k === "summary" || k === "notes") && PROCESS.test(v)) out.push(`${p}: says how a page was fetched (${v.match(PROCESS)[0]}). That goes in the PR description, not the card`);
      for (const s of sentences(v)) {
        const at = `${p}: "${s.slice(0, 50)}..."`;
        for (const [re, why] of FILLER) if (re.test(s)) out.push(`${at} ${why}`);
        const n = s.match(/\b(none|no|one|two|three|four|five|[0-5]) (?:of (?:the )?(?:five|5) )?hygiene checks? pass(?:es)?\b(?! for)/i);
        if (n && passes !== undefined) {
          const claimed = NUM[n[1].toLowerCase()] ?? Number(n[1]);
          if (claimed !== passes) out.push(`${at} says ${claimed} hygiene checks pass, but the card has ${passes}`);
        }
        const k = norm(s);
        if (words(s) >= 6) {
          if (seen.has(k) && !(p.startsWith("hygiene.") && seen.get(k).startsWith("hygiene."))) out.push(`${at} repeats a sentence from ${seen.get(k)}. Say it once`);
          else seen.set(k, p);
        }
        if (words(s) > MAX_SENTENCE_WORDS) out.push(`${at} ${words(s)}-word sentence, max ${MAX_SENTENCE_WORDS}`);
        if ((s.match(/\(/g) ?? []).length > MAX_PARENS) out.push(`${at} more than ${MAX_PARENS} parentheticals`);
        if ((s.match(IDENT) ?? []).length > MAX_IDENTS) out.push(`${at} more than ${MAX_IDENTS} code identifiers. Say it in words`);
      }
    }
  };
  walk(doc, "");
  return out;
}

for (const f of files) {
  const doc = yaml.load(readFileSync(join(dir, f), "utf8"), { schema: yaml.CORE_SCHEMA });
  const errs = [];
  if (!validate(doc)) errs.push(...validate.errors.map((e) => `${e.instancePath || "/"} ${e.message}`));
  if (doc?.id && doc.id !== f.replace(/\.yaml$/, "")) errs.push(`id "${doc.id}" does not match filename`);

  // rubric rules the schema cannot express
  const inb = doc?.surfaces?.inbound, out = doc?.surfaces?.outbound;
  if (inb?.grade === "N/A") errs.push("inbound grade cannot be N/A");
  if (inb?.grade === "B" && !(inb.issuers?.length)) errs.push("inbound grade B requires a non-empty issuers allowlist");
  if (inb?.grade === "A" && inb.issuers && !inb.issuers.includes("any")) errs.push('inbound grade A should list issuers: ["any"]');
  const hyg = doc?.hygiene ?? {};
  const passes = Object.values(hyg).filter((c) => c?.pass === true).length;
  const applicable = Object.values(hyg).filter((c) => c?.pass !== null).length;
  const staticOnly = ["D", "F"].includes(inb?.grade);
  if (staticOnly && applicable < 5) errs.push("inbound D/F means static keys exist, so every hygiene check must be true/false, not null");
  if (inb?.grade === "D" && passes < 3) errs.push(`inbound D requires >=3 hygiene passes, found ${passes}`);
  if (inb?.grade === "F" && passes >= 3 && !inb.walled) errs.push(`inbound F with ${passes} hygiene passes should be D`);
  for (const [k, sf] of Object.entries(doc?.surfaces ?? {})) if (sf?.walled && sf.grade !== "F") errs.push(`${k}: docs not public (walled), so the grade must be F`);
  for (const c of Object.values(hyg)) if (c && c.pass !== null && !(c.evidence?.length)) errs.push("hygiene check with a pass/fail needs evidence");
  if (doc?.status === "graduated" && !doc.graduated_on) errs.push("graduated status requires graduated_on");
  errs.push(...prose(doc, passes));
  errs.push(...receiptUrls(doc));

  // staleness
  const now = Date.now();
  const dates = [];
  const walk = (o) => { if (o && typeof o === "object") { if (o.checked_on) dates.push(o.checked_on); Object.values(o).forEach(walk); } };
  walk(doc);
  const oldest = dates.map((d) => new Date(d).getTime()).sort()[0];
  const stale = oldest && (now - oldest) / 86400000 > STALE_DAYS;

  if (errs.length) { failed++; console.log(`✗ ${f}\n   ${errs.join("\n   ")}`); }
  else {
    const headline = [inb.grade, out.grade].filter((g) => g !== "N/A").sort((a, b) => RANK[a] - RANK[b])[0];
    console.log(`✓ ${f}  inbound=${inb.grade} outbound=${out.grade} headline=${headline}${stale ? "  (STALE)" : ""}`);
  }
}
console.log(`\n${files.length - failed}/${files.length} valid`);
process.exit(failed ? 1 : 0);
