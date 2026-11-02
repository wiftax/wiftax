// Render the share card (scripts/og.html) to site/og.png with headless Chrome. Run after changing the design: npm run og
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
const root = new URL("..", import.meta.url).pathname;
const chrome = process.env.CHROME ?? ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find(existsSync);
if (!chrome) throw new Error("Chrome not found; set CHROME=/path/to/chrome");
execFileSync(chrome, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1", "--window-size=1200,630", "--virtual-time-budget=4000", `--screenshot=${root}site/og.png`, `file://${root}scripts/og.html`], { stdio: "inherit" });
console.log("og: site/og.png (1200x630)");
