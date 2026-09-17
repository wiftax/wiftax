import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import yaml from "js-yaml";
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
  if (inb?.grade === "F" && passes >= 3) errs.push(`inbound F with ${passes} hygiene passes should be D`);
  for (const c of Object.values(hyg)) if (c && c.pass !== null && !(c.evidence?.length)) errs.push("hygiene check with a pass/fail needs evidence");
  if (doc?.status === "graduated" && !doc.graduated_on) errs.push("graduated status requires graduated_on");

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
