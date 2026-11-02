// Fetch Web Awesome Pro and Font Awesome Pro icons into vendor/ (gitignored) so the build can self-host them.
// Needs WEBAWESOME_NPM_TOKEN and FONTAWESOME_NPM_TOKEN. Each is optional: without it that part is skipped and
// the build falls back to the free CDN / free icons, so forks and CI without the secrets still work.
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync, cpSync, mkdirSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const WA_VERSION = "3.14.0";
export const FA_VERSION = "7.3.1";
export const FA_FAMILIES = ["sharp-regular", "sharp-solid", "brands"];
const root = new URL("..", import.meta.url).pathname;

// npm pack <spec> from a private registry; token is read from the env by npm, never written in clear.
function fetchPackage(scope, registry, envVar, spec) {
  const tmp = mkdtempSync(join(tmpdir(), "wa-pro-"));
  const rc = join(tmp, ".npmrc");
  writeFileSync(rc, `${scope}:registry=https://${registry}/\n//${registry}/:_authToken=\${${envVar}}\n`, { mode: 0o600 });
  execFileSync("npm", ["pack", spec, "--userconfig", rc, "--pack-destination", tmp, "--silent"], { stdio: ["ignore", "ignore", "inherit"] });
  const tgz = readdirSync(tmp).find((f) => f.endsWith(".tgz"));
  execFileSync("tar", ["xzf", join(tmp, tgz), "-C", tmp]);
  return tmp;
}

if (process.env.FONTAWESOME_NPM_TOKEN) {
  const tmp = fetchPackage("@fortawesome", "npm.fontawesome.com", "FONTAWESOME_NPM_TOKEN", `@fortawesome/fontawesome-pro@${FA_VERSION}`);
  try {
    const fa = join(root, "vendor/fontawesome-pro");
    rmSync(fa, { recursive: true, force: true });
    for (const fam of FA_FAMILIES) cpSync(join(tmp, "package/svgs", fam), join(fa, "svgs", fam), { recursive: true });
    writeFileSync(join(fa, "VERSION"), FA_VERSION + "\n");
    console.log(`wa:pro: Font Awesome Pro ${FA_VERSION} (${FA_FAMILIES.join(", ")}) -> vendor/fontawesome-pro`);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
} else {
  console.log("wa:pro: FONTAWESOME_NPM_TOKEN not set, skipping (build will use free icons)");
}

if (!process.env.WEBAWESOME_NPM_TOKEN) {
  console.log("wa:pro: WEBAWESOME_NPM_TOKEN not set, skipping (build will use the free CDN)");
  process.exit(0);
}
const dest = join(root, "vendor/webawesome-pro");
const tmp = fetchPackage("@awesome.me", "npm.webawesome.com", "WEBAWESOME_NPM_TOKEN", `@awesome.me/webawesome-pro@${WA_VERSION}`);
try {
  rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });
  const src = join(tmp, "package/dist-cdn");
  for (const f of readdirSync(src)) {
    if (["react", "ssr", "types", "skills"].includes(f) || f.endsWith(".d.ts") || f.endsWith(".json") || f === "llms.txt" || f === "vscode.html-custom-data.json") continue;
    cpSync(join(src, f), join(dest, f), { recursive: true });
  }
  writeFileSync(join(dest, "VERSION"), WA_VERSION + "\n");
  console.log(`wa:pro: Web Awesome Pro ${WA_VERSION} -> vendor/webawesome-pro`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
