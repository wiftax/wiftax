// Renders data/products/*.yaml to SCOREBOARD.md. The site will do the same with more taste.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import yaml from "js-yaml";

const root = new URL("..", import.meta.url).pathname;
const dir = join(root, "data/products");
const RANK = { A: 5, B: 4, C: 3, D: 2, F: 1 };
const rows = readdirSync(dir).filter((f) => f.endsWith(".yaml") && !f.startsWith("_"))
  .map((f) => yaml.load(readFileSync(join(dir, f), "utf8"), { schema: yaml.CORE_SCHEMA }))
  .map((d) => {
    const i = d.surfaces.inbound.grade, o = d.surfaces.outbound.grade;
    const headline = o === "N/A" ? i : (RANK[i] <= RANK[o] ? i : o);
    const h = d.hygiene;
    const hyg = ["expiry", "rotation_api", "scoping", "last_used", "leak_revocation"]
      .map((k) => h[k].pass === null ? "·" : h[k].pass ? "✓" : "✗").join(" ");
    const latest = JSON.stringify(d).match(/\d{4}-\d{2}-\d{2}/g)?.sort().at(-1) ?? "";
    return { d, i, o, headline, hyg, latest };
  })
  .sort((a, b) => RANK[a.headline] - RANK[b.headline] || a.d.vendor.localeCompare(b.d.vendor));

const badge = (g) => ({ A: "🟢 A", B: "🟡 B", C: "🟠 C", D: "🔴 D", F: "💀 F", "N/A": "—" })[g];
let md = `# wif.tax scoreboard\n\nGenerated from \`data/products/\` by \`npm run render\`. Do not edit by hand.\n\n`;
md += `Hygiene columns: expiry · rotation API · scoping · last-used · leak revocation. "·" means no static credential exists to check.\n\n`;
md += `| Grade | Vendor | Product | Inbound | Outbound | Hygiene | Status | Checked |\n|---|---|---|---|---|---|---|---|\n`;
for (const r of rows) {
  const status = r.d.status === "graduated" ? `⭐ graduated ${r.d.graduated_on}` : r.d.status;
  md += `| **${badge(r.headline)}** | ${r.d.vendor} | [${r.d.product}](data/products/${r.d.id}.yaml) | ${badge(r.i)} | ${badge(r.o)} | \`${r.hyg}\` | ${status} | ${r.latest} |\n`;
}
md += `\n## Cards\n\n`;
for (const r of rows) {
  const d = r.d;
  md += `### ${badge(r.headline)} ${d.vendor} ${d.product}\n\n${d.summary.trim()}\n\n`;
  md += `- **Inbound ${r.i}:** ${d.surfaces.inbound.mechanism}${d.surfaces.inbound.tier_gated ? ` *(requires ${d.surfaces.inbound.tier_gated})*` : ""}\n`;
  md += `- **Outbound ${r.o}:** ${d.surfaces.outbound.mechanism}\n`;
  if (d.vendor_statement) md += `- **Vendor says (${d.vendor_statement.date}):** "${d.vendor_statement.quote}" ([source](${d.vendor_statement.url}))\n`;
  const receipts = [...d.surfaces.inbound.evidence, ...d.surfaces.outbound.evidence].map((e) => e.url);
  md += `- **Receipts:** ${[...new Set(receipts)].map((u) => `[${new URL(u).hostname}](${u})`).join(", ")}\n\n`;
}
writeFileSync(join(root, "SCOREBOARD.md"), md);
console.log(`wrote SCOREBOARD.md (${rows.length} products)`);
