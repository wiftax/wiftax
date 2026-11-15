// Render site/favicon.svg to the PNG fallbacks with headless Chrome. Run after changing the icon: npm run favicon
//   site/favicon-32.png         browsers without SVG favicon support
//   site/apple-touch-icon.png   iOS home screen, 180x180, on the site's background
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const root = new URL("..", import.meta.url).pathname;
const chrome = process.env.CHROME ?? ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find(existsSync);
if (!chrome) throw new Error("Chrome not found; set CHROME=/path/to/chrome");
const svg = readFileSync(join(root, "site/favicon.svg"), "utf8");
const dir = mkdtempSync(join(tmpdir(), "favicon-"));
const render = (name, size, { pad = 0, bg = "transparent" } = {}) => {
  const html = join(dir, `${name}.html`);
  writeFileSync(html, `<!doctype html><html><body style="margin:0;background:${bg}"><div style="width:${size}px;height:${size}px;box-sizing:border-box;padding:${pad}px">${svg.replace("<svg ", '<svg width="100%" height="100%" ')}</div></body></html>`);
  execFileSync(chrome, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1", "--default-background-color=00000000", `--window-size=${size},${size}`, `--screenshot=${join(root, "site", name)}`, `file://${html}`], { stdio: "ignore" });
  console.log(`favicon: site/${name} (${size}x${size})`);
};
render("favicon-32.png", 32);
render("apple-touch-icon.png", 180, { pad: 30, bg: "#F7F6F2" });
