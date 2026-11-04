// Product view inside the company modal: click a product row (or one of its grades / hygiene tiles)
// to slide to that product's receipts; back returns to the list where you left it.
const dlg = document.getElementById("m"), body = document.getElementById("m-body");
const scroller = () => dlg.shadowRoot?.querySelector('[part~="body"]');
const cache = new Map();
let listTop = 0, fromRow = null;
// read the deep link now: the index script rewrites the query string as it starts up
let deepP = new URLSearchParams(location.search).get("p");

const setP = (id) => { const u = new URL(location); id ? u.searchParams.set("p", id) : u.searchParams.delete("p"); history.replaceState(null, "", u); };
const load = async (id) => {
  if (!cache.has(id)) cache.set(id, fetch(`/ev/${encodeURIComponent(id)}.html`).then((r) => (r.ok ? r.text() : Promise.reject())).catch((e) => { cache.delete(id); throw e; }));
  return cache.get(id);
};

function select(pd, tab, focus = false) {
  const tabs = [...pd.querySelectorAll('[role="tab"]')];
  for (const t of tabs) { const on = t.dataset.tab === tab; t.setAttribute("aria-selected", on); t.tabIndex = on ? 0 : -1; if (on && focus) t.focus(); }
  for (const p of pd.querySelectorAll(".pd-pane")) p.hidden = p.dataset.tab !== tab;
}

async function open(id, tab = "in") {
  if (!body.querySelector(".m-table")) return;
  let html;
  try { html = await load(id); } catch { return; }
  const sc = scroller();
  listTop = sc?.scrollTop ?? 0;
  fromRow = body.querySelector(`tr[data-p="${CSS.escape(id)}"] .m-open`);
  body.querySelector(".pd")?.cleanup?.();
  body.querySelector(".pd")?.remove();
  const pd = document.createElement("div");
  pd.className = "pd ev";
  pd.innerHTML = html;
  const back = document.createElement("button");
  back.type = "button";
  back.className = "pd-back";
  back.setAttribute("aria-label", dlg.getAttribute("aria-label") || "Back");
  back.innerHTML = '<span class="pd-back-chev" aria-hidden="true"></span>';
  pd.querySelector(".pd-name").before(back);
  const top = document.createElement("div");
  top.className = "pd-top";
  back.after(top); top.append(back, pd.querySelector(".pd-name"));
  pd.prepend(top);
  pd.querySelectorAll('[role="tab"]').forEach((t, k) => { t.id = `pd-t-${k}`; pd.querySelector(`.pd-pane[data-tab="${t.dataset.tab}"]`)?.setAttribute("aria-labelledby", t.id); });
  body.append(pd);
  body.classList.add("drill");
  select(pd, tab);
  if (sc) {
    sc.scrollTop = 0;
    // hairline under the pinned name once content scrolls beneath it
    // pin flush with the top of the scroll area (the dialog body has top padding), keeping the same resting layout
    const pt = parseFloat(getComputedStyle(sc).paddingTop) || 0;
    Object.assign(top.style, { top: `${-pt}px`, marginTop: `${-pt}px`, paddingTop: `${pt}px` });
    const onScroll = () => top.classList.toggle("stuck", sc.scrollTop > 2);
    sc.addEventListener("scroll", onScroll, { passive: true });
    pd.cleanup = () => sc.removeEventListener("scroll", onScroll);
  }
  back.focus({ preventScroll: true });
  setP(id);
}

function close() {
  if (!body.classList.contains("drill")) return;
  body.classList.remove("drill");
  body.querySelector(".pd")?.cleanup?.();
  body.querySelector(".pd")?.remove();
  const sc = scroller();
  if (sc) sc.scrollTop = listTop;
  fromRow?.focus({ preventScroll: true });
  setP(null);
}

body.addEventListener("click", (e) => {
  if (e.target.closest(".pd-back")) return close();
  const t = e.target.closest('.pd-tabs [role="tab"]');
  if (t) return select(t.closest(".pd"), t.dataset.tab);
  const row = e.target.closest("tr[data-p]");
  if (row && !e.target.closest("a")) open(row.dataset.p, e.target.closest("[data-tab]")?.dataset.tab);
});
body.addEventListener("keydown", (e) => {
  const t = e.target.closest?.('.pd-tabs [role="tab"]');
  if (t) {
    const tabs = [...t.parentElement.children], d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (d) { e.preventDefault(); select(t.closest(".pd"), tabs[(tabs.indexOf(t) + d + tabs.length) % tabs.length].dataset.tab, true); }
    return;
  }
  // grade / hygiene tooltips are focusable: Enter on one opens the product at that part
  const tip = e.target.closest?.("tr[data-p] .tip");
  if (tip && e.key === "Enter") open(tip.closest("tr").dataset.p, tip.closest("[data-tab]")?.dataset.tab);
});
// Escape steps back to the list before it closes the modal.
addEventListener("keydown", (e) => {
  if (e.key === "Escape" && dlg.open && body.classList.contains("drill")) { e.preventDefault(); e.stopImmediatePropagation(); close(); }
}, true);
dlg.addEventListener("wa-show", (e) => { if (e.target === dlg) body.classList.remove("drill"); });
// Deep link (?c=…&p=…, where old /p/<id>/ URLs redirect): open the product as soon as its company's list is in the modal.
if (deepP) {
  const mo = new MutationObserver(() => {
    if (!body.querySelector(`tr[data-p="${CSS.escape(deepP)}"]`)) return;
    mo.disconnect();
    const id = deepP; deepP = null;
    open(id);
  });
  mo.observe(body, { childList: true });
}
