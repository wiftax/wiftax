// Tooltips for any element with data-tip="…". Positioning by Floating UI; look and motion in style.css (.ftip).
// Once one tooltip is open, moving to another switches instantly and glides, instead of fading out and in.
import { computePosition, autoUpdate, offset, flip, shift, arrow } from "@floating-ui/dom";

const SHOW_DELAY = 250, HIDE_DELAY = 60, WARM_MS = 500;
const tip = document.createElement("div");
tip.className = "ftip";
tip.id = "ftip";
tip.setAttribute("role", "tooltip");
const body = document.createElement("div");
const arr = document.createElement("div");
arr.className = "ftip-arrow";
tip.append(body, arr);

// target: element whose tooltip is shown. hovered/focused: what the pointer / keyboard is on now.
// The tooltip always follows hovered ?? focused, so a click or focus change can never strand it closed.
let target = null, hovered = null, focused = null, dismissed = null, stopAuto = null, showT = 0, hideT = 0, warmUntil = 0, seq = 0;

async function place(el) {
  const { x, y, placement, middlewareData } = await computePosition(el, tip, {
    strategy: "fixed",
    placement: "top",
    middleware: [offset(10), flip({ padding: 8 }), shift({ padding: 8 }), arrow({ element: arr, padding: 6 })],
  });
  const side = placement.split("-")[0];
  Object.assign(tip.style, { left: `${x}px`, top: `${y}px` });
  tip.dataset.side = side;
  const a = middlewareData.arrow ?? {};
  Object.assign(arr.style, { left: a.x != null ? `${a.x}px` : "", top: a.y != null ? `${a.y}px` : "" });
}

function show(el, warm) {
  clearTimeout(hideT);
  if (target === el) return;
  const host = el.closest("wa-dialog") ?? document.body; // a dialog lives in the top layer; the tooltip must too
  if (tip.parentNode !== host) { tip.removeAttribute("data-open"); host.append(tip); warm = false; }
  if (target) target.removeAttribute("aria-describedby");
  stopAuto?.();
  target = el;
  body.textContent = el.dataset.tip;
  el.setAttribute("aria-describedby", tip.id);
  tip.classList.toggle("ftip-glide", warm && tip.hasAttribute("data-open"));
  stopAuto = autoUpdate(el, tip, () => place(el));
  const tok = ++seq; // ignore a positioning pass that finishes after we have moved on
  place(el).then(() => requestAnimationFrame(() => { if (tok === seq && target === el) tip.setAttribute("data-open", ""); }));
}

function hide() {
  clearTimeout(showT);
  seq++;
  if (!target) return;
  target.removeAttribute("aria-describedby");
  target = null;
  stopAuto?.(); stopAuto = null;
  tip.classList.remove("ftip-glide");
  tip.removeAttribute("data-open");
  warmUntil = performance.now() + WARM_MS;
}

const isWarm = () => target !== null || performance.now() < warmUntil;
function sync() {
  let want = hovered ?? focused;
  if (want && want === dismissed) want = null;
  clearTimeout(showT); clearTimeout(hideT);
  if (want === target) return;
  if (!want) { hideT = setTimeout(hide, HIDE_DELAY); return; }
  if (isWarm()) show(want, true);
  else showT = setTimeout(() => { if ((hovered ?? focused) === want) show(want, false); }, SHOW_DELAY);
}
const tipOf = (n) => n?.closest?.("[data-tip]") ?? null;

document.addEventListener("pointerover", (e) => {
  if (e.pointerType === "touch") return;
  const el = tipOf(e.target);
  if (el !== hovered) { hovered = el; if (el !== dismissed) dismissed = null; sync(); }
});
document.addEventListener("pointerout", (e) => { if (!e.relatedTarget && hovered) { hovered = null; sync(); } }); // left the window
document.addEventListener("focusin", (e) => { const el = tipOf(e.target); focused = el && el.matches(":focus-visible") ? el : null; sync(); });
document.addEventListener("focusout", (e) => { if (focused && tipOf(e.target) === focused) { focused = null; sync(); } });
document.addEventListener("click", (e) => { // touch: tap toggles
  if (!matchMedia("(hover: none)").matches) return;
  const el = tipOf(e.target);
  if (el) target === el ? hide() : show(el, false);
  else if (target) hide();
});
document.addEventListener("keydown", (e) => { // first Esc closes the tooltip, not the dialog
  if (e.key === "Escape" && target) { e.stopPropagation(); dismissed = target; hide(); }
}, true);
document.addEventListener("wa-hide", () => { hovered = focused = null; hide(); });
