// /rubric/ interactions: grade ladders (autoplay while visible until touched), headline picker, hygiene meter, TOC spy.
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
const STEP = 4200;

for (const sec of document.querySelectorAll(".rb-surface")) {
  const tabs = [...sec.querySelectorAll(".ld")];
  const scenes = [...sec.querySelectorAll(".scene")], means = [...sec.querySelectorAll(".mean")];
  let i = 0, timer = 0, auto = !calm, visible = false;
  const select = (n, focus = false) => {
    i = (n + tabs.length) % tabs.length;
    const g = tabs[i].dataset.g;
    tabs.forEach((t, k) => { t.setAttribute("aria-selected", k === i); t.tabIndex = k === i ? 0 : -1; });
    for (const el of [...scenes, ...means]) el.toggleAttribute("data-on", el.dataset.g === g);
    sec.querySelector(".stage-wrap").setAttribute("aria-labelledby", tabs[i].id);
    if (focus) tabs[i].focus();
    restart();
  };
  const restart = () => {
    clearTimeout(timer);
    sec.classList.remove("playing"); void sec.offsetWidth; // restart the progress bar animation
    if (auto && visible) { sec.classList.add("playing"); timer = setTimeout(() => select(i + 1), STEP); }
  };
  const stop = () => { if (auto) { auto = false; restart(); } };
  tabs.forEach((t, k) => t.addEventListener("click", () => { stop(); select(k); }));
  sec.querySelector(".ladder").addEventListener("keydown", (e) => {
    const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (d) { e.preventDefault(); stop(); select(i + d, true); }
    else if (e.key === "Home" || e.key === "End") { e.preventDefault(); stop(); select(e.key === "Home" ? 0 : tabs.length - 1, true); }
  });
  sec.querySelector(".surf").addEventListener("pointerenter", () => { if (auto) { clearTimeout(timer); sec.classList.add("paused"); } });
  sec.querySelector(".surf").addEventListener("pointerleave", () => { sec.classList.remove("paused"); restart(); });
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; restart(); }, { threshold: 0.45 }).observe(sec.querySelector(".surf"));
}

// headline = lower of inbound and outbound (outbound n/a -> inbound)
const hl = document.querySelector(".hl");
if (hl) {
  const R = { A: 5, B: 4, C: 3, D: 2, F: 1 };
  const val = (side) => hl.querySelector(`[data-side=${side}] [aria-checked=true]`).dataset.g;
  const upd = () => {
    const a = val("inbound"), b = val("outbound"), h = b === "N/A" || R[a] <= R[b] ? a : b;
    hl.querySelectorAll(".hl-b").forEach((x) => x.toggleAttribute("data-on", x.dataset.g === h));
    hl.querySelectorAll(".hl-pick").forEach((p) => p.toggleAttribute("data-wins", p.querySelector("[aria-checked=true]").dataset.g === h));
  };
  hl.addEventListener("click", (e) => {
    const b = e.target.closest(".hl-btns button"); if (!b) return;
    b.parentElement.querySelectorAll("button").forEach((x) => x.setAttribute("aria-checked", x === b));
    upd();
  });
  upd();
}

// hygiene: >= 3 passing is D, else F
const hy = document.querySelector(".hyg");
if (hy) {
  const upd = () => {
    const n = hy.querySelectorAll('.hc[aria-pressed="true"]').length;
    hy.querySelector(".hyg-n b").textContent = n;
    hy.style.setProperty("--n", n);
    hy.dataset.res = n >= 3 ? "D" : "F";
  };
  hy.addEventListener("click", (e) => { const c = e.target.closest(".hc"); if (!c) return; c.setAttribute("aria-pressed", c.getAttribute("aria-pressed") !== "true"); upd(); });
  upd();
}

// table of contents: highlight the section in view
const links = new Map([...document.querySelectorAll(".rb-toc a")].map((a) => [a.dataset.to, a]));
const spy = new IntersectionObserver((es) => {
  for (const e of es) if (e.isIntersecting) { links.forEach((a) => a.removeAttribute("aria-current")); links.get(e.target.id)?.setAttribute("aria-current", "true"); }
}, { rootMargin: "-30% 0px -60% 0px" });
links.forEach((_, id) => { const s = document.getElementById(id); if (s) spy.observe(s); });
