/* Medina demo — app logic (v2). Vanilla JS, no dependencies.
   Nothing here sends data anywhere: carts, orders, favorites and owner edits live in
   localStorage on this device only.
   PHOTOS: add a real image to images/menu/ or images/products/ and set `photo: "file.jpg"`
   on that item in data.js — it appears everywhere automatically. */
{
const D = window.MEDINA;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = n => "$" + (Math.round(n * 100) / 100).toFixed(2);
const KEY = "medina-demo-v2";
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- state ---------- */
const fresh = () => ({ kitchen: [], market: [], fav: [], history: [], ownerOrders: D.MOCK_ORDERS.map(o => ({ ...o })),
  menu: {}, specials: D.SPECIALS.map(s => ({ ...s })), mfill: "pickup", zip: "", pickup: "", contact: {}, tg: {} });
let S = fresh();
try { const raw = localStorage.getItem(KEY); if (raw) S = Object.assign(fresh(), JSON.parse(raw)); } catch (e) {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };

const dish = id => D.MENU.find(d => d.id === id);
const prod = id => D.PRODUCTS.find(p => p.id === id);
const cat = id => D.PRODUCT_CATS.find(c => c.id === id) || {};
const dPrice = d => (S.menu[d.id] && S.menu[d.id].price != null) ? S.menu[d.id].price : d.price;
const dAvail = d => !(S.menu[d.id] && S.menu[d.id].off);
const digits = s => (s || "").replace(/\D/g, "");

let tt;
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("on"); clearTimeout(tt); tt = setTimeout(() => t.classList.remove("on"), 2400); }

/* ---------- header / nav ---------- */
function count() {
  const n = S.kitchen.reduce((a, l) => a + l.qty, 0) + S.market.reduce((a, l) => a + l.qty, 0);
  $$("[data-count]").forEach(b => { b.textContent = n; b.hidden = !n; });
  $("#cartTop").setAttribute("aria-label", `Cart, ${n} item${n === 1 ? "" : "s"}`);
  orderBar();
}
const burger = $("#burger");
function closeNav() { document.body.classList.remove("navopen"); burger.setAttribute("aria-expanded", "false"); burger.setAttribute("aria-label", "Open menu"); }
burger.addEventListener("click", () => {
  document.documentElement.style.setProperty("--navtop", $("#hdr").getBoundingClientRect().bottom + "px");
  const o = document.body.classList.toggle("navopen"); burger.setAttribute("aria-expanded", o); burger.setAttribute("aria-label", o ? "Close menu" : "Open menu");
});
$("#mainnav").addEventListener("click", e => { if (e.target.closest("a")) closeNav(); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && document.body.classList.contains("navopen")) { closeNav(); burger.focus(); } });
const sizeHdr = () => document.documentElement.style.setProperty("--hh", $("#hdr").offsetHeight + "px");
window.addEventListener("resize", sizeHdr);

/* ---------- time (Columbus) ---------- */
function colNow() {
  const p = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "numeric", hour12: false }).formatToParts(new Date());
  const g = t => +((p.find(x => x.type === t) || {}).value);
  return { h: g("hour") % 24, m: g("minute") };
}
function openNow() {
  const { h } = colNow(), open = h >= D.BUSINESS.open && h < D.BUSINESS.close;
  $("#openNow").innerHTML = `<i class="dot${open ? " on" : ""}"></i>${open ? "Open now" : "Closed now"} · listed 9 AM – 12 AM daily`;
}
const fmtT = (h, m) => `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 || h === 24 ? "AM" : "PM"}`;
function slots() {
  const { h, m } = colNow(); let t = Math.ceil((h * 60 + m + 30) / 15) * 15, day = "Today";
  const first = D.BUSINESS.open * 60 + 30, last = D.BUSINESS.close * 60 - 30, out = [];
  if (t < first) t = first; if (t > last) { t = first; day = "Tomorrow"; }
  for (; t <= last && out.length < 28; t += 15) out.push(`${day} ${fmtT(Math.floor(t / 60), t % 60)}`);
  return out;
}

/* ---------- shared bits ---------- */
const dishImg = (d, cls) => d.photo ? `<img class="${cls}" src="images/menu/${esc(d.photo)}" alt="${esc(d.name)} at Medina" loading="lazy">` : "";
function prodVisual(p, big) {
  const c = cat(p.cat);
  if (p.photo) return `<div class="pv${big ? " pv-big" : ""} has-photo"><img src="images/products/${esc(p.photo)}" alt="${esc(p.name)}" loading="lazy"></div>`;
  return `<div class="pv${big ? " pv-big" : ""}" style="--t:${c.tone}" aria-hidden="true"><span class="pv-brand">${esc(p.brand || c.label)}</span><span class="pv-size">${esc(p.size)}</span><span class="pv-pending">Photo pending</span></div>`;
}
const stock = p => ({ in: `<span class="stk s-in">In stock</span>`, low: `<span class="stk s-low">Low stock</span>`, out: `<span class="stk s-out">Out of stock</span>` }[p.stock]);
const storage = p => ({ shelf: "Shelf-stable", chilled: "Refrigerated", frozen: "Frozen" }[p.storage]);
const qtyIn = id => (S.market.find(x => x.id === id) || {}).qty || 0;
function buy(p) {
  if (p.stock === "out") return `<span class="soldout">Sold out</span>`;
  const q = qtyIn(p.id);
  return q ? `<div class="qty" role="group" aria-label="Quantity of ${esc(p.name)}"><button data-mq="${p.id}" data-d="-1" aria-label="Remove one ${esc(p.name)}">−</button><output>${q}</output><button data-mq="${p.id}" data-d="1" aria-label="Add one ${esc(p.name)}">+</button></div>`
    : `<button class="addbtn" data-madd="${p.id}" aria-label="Add ${esc(p.name)} to cart"><span aria-hidden="true">+</span><span class="addtxt">Add</span></button>`;
}
function favBtn(p) { const on = S.fav.includes(p.id);
  return `<button class="fav${on ? " on" : ""}" data-fav="${p.id}" aria-pressed="${on}" aria-label="${on ? "Remove from" : "Save to"} favorites: ${esc(p.name)}"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" fill="${on ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.8"/></svg></button>`; }

/* ---------- HOME ---------- */
const ink = hex => { const n = parseInt(hex.slice(1), 16), r = n >> 16, g = n >> 8 & 255, b = n & 255; return (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? "#1B1E1C" : "#FBF7EE"; };
function renderHome() {
  $("#aisleGrid").innerHTML = D.PRODUCT_CATS.map((c, i) => `<a class="aisle${i === 0 ? " a-lead" : ""}" href="#market" data-gocat="${c.id}" style="--t:${c.tone};--ink:${ink(c.tone)}">
     <span class="aisle-n">${esc(c.label)}</span><span class="aisle-c">${D.PRODUCTS.filter(p => p.cat === c.id).length} items</span><span class="aisle-go" aria-hidden="true">→</span></a>`).join("");
  $("#homeBoard").innerHTML = ["jollof-chicken", "grilled-lamb", "grilled-fish", "cassava-leaf", "okra-soup", "peanut-stew"].map(dish).map(d =>
    `<li><a href="#restaurant" data-opendish="${d.id}"><span class="bn">${esc(d.name)}</span><span class="bl" aria-hidden="true"></span><span class="bp">${money(dPrice(d))}</span></a><span class="bd">${esc(d.desc)}</span></li>`).join("");
  renderOffers($("#homeOffers")); openNow();
}
function renderOffers(el) {
  const list = S.specials.filter(s => s.active);
  el.innerHTML = list.length ? list.map(s => `<article class="offer o-${s.side}"><p class="o-k">${s.side === "kitchen" ? "Kitchen" : "Market"} offer</p><h3>${esc(s.title)}</h3><p>${esc(s.body)}</p>
     <a class="arrow-link" href="${s.side === "kitchen" ? "#restaurant" : "#item-" + s.ref}" ${s.side === "kitchen" ? `data-opendish="${s.ref}"` : ""}>${s.side === "kitchen" ? "Order it" : "See product"}</a></article>`).join("")
    : `<p class="muted">No specials are running this week.</p>`;
}

/* ---------- RESTAURANT ---------- */
function menuItem(d) {
  const off = !dAvail(d);
  return `<article class="mi${off ? " off" : ""}${d.photo ? " has-photo" : ""}">
    <button class="mi-btn" data-dish="${d.id}" ${off ? 'aria-disabled="true"' : ""} aria-label="${esc(d.name)}, ${money(dPrice(d))}${off ? ", unavailable today" : ", view options"}">
      ${dishImg(d, "mi-img")}
      <span class="mi-txt"><span class="mi-top"><span class="mi-n">${esc(d.name)}</span>${d.tag ? `<span class="mi-tag">${esc(d.tag)}</span>` : ""}</span>
      <span class="mi-d">${esc(d.desc)}</span>
      <span class="mi-foot"><span class="mi-p">${money(dPrice(d))}</span>${off ? `<span class="mi-off">Unavailable today</span>` : `<span class="mi-add" aria-hidden="true">+</span>`}</span></span>
    </button></article>`;
}
function renderMenu() {
  $("#menuCats").innerHTML = D.MENU_CATS.map((c, i) => `<a href="#restaurant" data-jump="mc-${c.id}" ${i === 0 ? 'aria-current="true"' : ""}>${esc(c.label)}</a>`).join("");
  $("#menuBody").innerHTML = D.MENU_CATS.map(c => `<section class="msec" id="mc-${c.id}" aria-labelledby="mh-${c.id}">
    <h2 id="mh-${c.id}">${esc(c.label)}</h2><div class="mgrid">${D.MENU.filter(d => d.cat === c.id).map(menuItem).join("")}</div></section>`).join("")
    + `<p class="note">Sample menu based on dishes described publicly. Dishes, prices and photos to be confirmed by Medina.</p>`;
  renderPanel(); watchCats();
}
let catObs;
function watchCats() {
  if (catObs) catObs.disconnect();
  catObs = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { const id = e.target.id;
    $$("#menuCats a").forEach(a => { const on = a.dataset.jump === id; a.toggleAttribute("aria-current", on); if (on) a.scrollIntoView({ block: "nearest", inline: "nearest" }); }); } }),
    { rootMargin: "-35% 0px -60% 0px" });
  $$(".msec").forEach(s => catObs.observe(s));
}
function lineUnit(d, sel) {
  let p = dPrice(d);
  d.opts.forEach(k => { const g = D.OPT[k], v = sel[g.id]; (Array.isArray(v) ? v : [v]).forEach(cid => { const c = g.choices.find(x => x.id === cid); if (c) p += c.price; }); });
  return Math.max(p, 0);
}
function selText(d, sel) {
  return d.opts.map(k => { const g = D.OPT[k], v = sel[g.id];
    return (Array.isArray(v) ? v : [v]).map(cid => (g.choices.find(x => x.id === cid) || {}).label).filter(Boolean).join(", "); }).filter(Boolean).join(" · ");
}
const kSub = () => S.kitchen.reduce((a, l) => a + l.unit * l.qty, 0);
const mSub = () => S.market.reduce((a, l) => a + prod(l.id).price * l.qty, 0);
function renderPanel() {
  const el = $("#orderPanel"); if (!el) return;
  el.innerHTML = `<h2>Your order</h2>` + (S.kitchen.length
    ? `<ul class="op-lines">${S.kitchen.map(l => { const d = dish(l.id); return `<li><span class="op-q">${l.qty}</span><span><b>${esc(d.name)}</b><small>${esc(selText(d, l.sel))}</small></span><span class="op-a">${money(l.unit * l.qty)}</span></li>`; }).join("")}</ul>
       <p class="op-sub"><span>Subtotal</span><b>${money(kSub())}</b></p><a class="b b-saffron b-w" href="#cart">Choose pickup time</a>`
    : `<p class="muted">Tap any dish to choose options and add it. Your order builds here.</p>`);
}
function orderBar() {
  const b = $("#orderBar"); const n = S.kitchen.reduce((a, l) => a + l.qty, 0);
  const show = cur === "restaurant" && n > 0; b.hidden = !show;
  if (show) b.innerHTML = `<span><b>${n}</b> item${n === 1 ? "" : "s"} · ${money(kSub())}</span><span>Review order →</span>`;
}

/* dish sheet */
const dlg = $("#dishDlg");
function openDish(id) {
  const d = dish(id); if (!d) return; if (!dAvail(d)) { toast(`${d.name} is unavailable today`); return; }
  const groups = d.opts.map(k => { const g = D.OPT[k];
    return `<fieldset class="og"><legend>${esc(g.label)}${g.required ? "" : ' <span class="muted">optional</span>'}</legend><div class="pills">
      ${g.choices.map((c, i) => `<label class="pill"><input type="${g.type === "one" ? "radio" : "checkbox"}" name="${g.id}" value="${c.id}" ${g.type === "one" && i === 0 ? "checked" : ""}><span>${esc(c.label)}${c.price ? ` <em>${c.price > 0 ? "+" : "−"}${money(Math.abs(c.price))}</em>` : ""}</span></label>`).join("")}</div></fieldset>`; }).join("");
  dlg.innerHTML = `<form class="sh" id="dishForm">
    <button type="button" class="sh-x" data-close aria-label="Close">×</button>
    ${d.photo ? `<img class="sh-img" src="images/menu/${esc(d.photo)}" alt="${esc(d.name)} at Medina">` : `<div class="sh-band" aria-hidden="true"></div>`}
    <div class="sh-body">
      <p class="sh-cat">${esc(D.MENU_CATS.find(c => c.id === d.cat).label)}</p>
      <h2 id="dishTitle">${esc(d.name)}</h2>
      <p class="sh-price">${money(dPrice(d))} <span class="flag">Illustrative price</span></p>
      <p class="sh-desc">${esc(d.desc)}</p>
      ${groups}
      <div class="field"><label for="dishNote">Special instructions</label><textarea id="dishNote" rows="2" maxlength="160" placeholder="e.g. sauce on the side"></textarea></div>
    </div>
    <div class="sh-foot"><div class="qty qty-l" role="group" aria-label="Quantity"><button type="button" data-dq="-1" aria-label="Decrease quantity">−</button><output id="dq">1</output><button type="button" data-dq="1" aria-label="Increase quantity">+</button></div>
      <button type="submit" class="b b-saffron" id="dishAdd">Add</button></div></form>`;
  dlg.showModal();
  const upd = () => { const q = +$("#dq").textContent; $("#dishAdd").textContent = `Add ${q} to order · ${money(lineUnit(d, readSel(d)) * q)}`; };
  upd(); dlg.oninput = upd;
  dlg.onclick = e => {
    if (e.target === dlg || e.target.closest("[data-close]")) dlg.close();
    const b = e.target.closest("[data-dq]"); if (b) { const o = $("#dq"); o.textContent = Math.min(20, Math.max(1, +o.textContent + +b.dataset.dq)); upd(); }
  };
  $("#dishForm").onsubmit = e => { e.preventDefault();
    const sel = readSel(d), qty = +$("#dq").textContent, note = $("#dishNote").value.trim(), key = d.id + "|" + JSON.stringify(sel) + "|" + note;
    const ex = S.kitchen.find(l => l.key === key);
    if (ex) ex.qty = Math.min(20, ex.qty + qty); else S.kitchen.push({ key, id: d.id, sel, note, qty, unit: lineUnit(d, sel) });
    save(); count(); renderPanel(); dlg.close(); toast(`Added ${qty} × ${d.name}`);
  };
}
function readSel(d) {
  const sel = {}; d.opts.forEach(k => { const g = D.OPT[k];
    sel[g.id] = g.type === "one" ? (($(`input[name="${g.id}"]:checked`, dlg) || {}).value) : $$(`input[name="${g.id}"]:checked`, dlg).map(i => i.value); });
  return sel;
}

/* ---------- MARKET ---------- */
let mCat = "all";
function pRow(p) {
  return `<article class="pr">${favBtn(p)}<a class="pr-link" href="#item-${p.id}">${prodVisual(p)}
    <span class="pr-txt"><span class="pr-brand">${esc(p.brand || cat(p.cat).label)}</span><span class="pr-name">${esc(p.name)}</span><span class="pr-size">${esc(p.size)}</span>
    <span class="pr-meta">${stock(p)}${p.ship ? `<span class="shp">Ships US-wide</span>` : `<span class="shp no">Pickup only</span>`}</span></span></a>
    <div class="pr-buy"><span class="pr-price">${money(p.price)}</span>${buy(p)}</div></article>`;
}
function renderMarket() {
  $("#catChips").innerHTML = [{ id: "all", label: "All", tone: "#0B4A37" }, ...D.PRODUCT_CATS].map(c => `<button data-cat="${c.id}" aria-pressed="${mCat === c.id}" style="--t:${c.tone}"><i aria-hidden="true"></i>${esc(c.label)}</button>`).join("");
  $$(".tgl").forEach(b => b.setAttribute("aria-pressed", !!S.tg[b.dataset.tgl]));
  const q = $("#q").value.trim().toLowerCase();
  let list = D.PRODUCTS.filter(p => (mCat === "all" || p.cat === mCat)
    && (!q || (p.name + " " + p.brand + " " + cat(p.cat).label).toLowerCase().includes(q))
    && (!S.tg.ship || p.ship) && (!S.tg.stock || p.stock !== "out") && (!S.tg.fav || S.fav.includes(p.id)));
  const so = $("#sort").value;
  if (so === "low") list.sort((a, b) => a.price - b.price); else if (so === "high") list.sort((a, b) => b.price - a.price); else if (so === "name") list.sort((a, b) => a.name.localeCompare(b.name));
  $("#resultLine").textContent = `${list.length} product${list.length === 1 ? "" : "s"}${mCat !== "all" ? " · " + cat(mCat).label : ""}${q ? ` · “${$("#q").value.trim()}”` : ""}`;
  $("#productGrid").innerHTML = list.length ? list.map(pRow).join("") : `<div class="empty"><p>No products match.</p><button class="b b-line b-s" id="clearF">Clear search and filters</button></div>`;
}
function renderItem(id) {
  const p = prod(id), el = $("#itemView");
  if (!p) { el.innerHTML = `<p>That product isn't in the catalogue. <a href="#market">Back to the market</a></p>`; return; }
  const c = cat(p.cat), rel = D.PRODUCTS.filter(x => x.cat === p.cat && x.id !== p.id).slice(0, 4);
  el.innerHTML = `<nav class="crumbs" aria-label="Breadcrumb"><a href="#market">World Market</a><span aria-hidden="true">/</span><a href="#market" data-gocat="${p.cat}">${esc(c.label)}</a></nav>
   <div class="pdp-main">${prodVisual(p, true)}<div class="pdp-info">
     <p class="pr-brand">${esc(p.brand || c.label)}</p><h1>${esc(p.name)}</h1><p class="pdp-size">${esc(p.size)}</p>
     <p class="pdp-price">${money(p.price)} <span class="flag">Illustrative price</span></p>
     <div class="pdp-buy">${buy(p)}${favBtn(p)}</div>
     <div class="pdp-meta">${stock(p)}</div>
     <dl class="specs"><dt>Category</dt><dd>${esc(c.label)}</dd><dt>Storage</dt><dd>${storage(p)}</dd><dt>Shipping weight</dt><dd>${p.weight} lb${p.size.startsWith("Per lb") ? " per lb" : ""}</dd>
       <dt>Nationwide shipping</dt><dd>${p.ship ? "Eligible (proposed)" + (p.liquid ? ", packed as a liquid" : "") : "Not eligible — " + (p.storage !== "shelf" ? storage(p).toLowerCase() + " product, pickup or local only" : esc(p.note || "pickup only"))}</dd>
       <dt>Pickup</dt><dd>3116 S Hamilton Road</dd></dl>
     <p class="note">Illustrative listing: brand, size, price and stock to be confirmed by Medina.</p></div></div>
   ${rel.length ? `<h2 class="rel-h">More in ${esc(c.label)}</h2><div class="plist">${rel.map(pRow).join("")}</div>` : ""}`;
}
function setMQ(id, d) {
  const p = prod(id); let l = S.market.find(x => x.id === id);
  if (!l && d > 0) { S.market.push({ id, qty: 1 }); toast(`Added ${p.name}`); }
  else if (l) { l.qty = Math.min(99, l.qty + d); if (l.qty <= 0) S.market = S.market.filter(x => x.id !== id); }
  save(); count(); refresh();
}

/* ---------- CART & CHECKOUT ---------- */
const shipBad = () => S.market.filter(l => !prod(l.id).ship);
const zipOk = z => /^\d{5}$/.test(z);
const localZip = z => /^43[02]\d\d$/.test(z);
function line(name, sub, qtyCtl, amt) { return `<li><div class="ln-t"><b>${name}</b><small>${sub}</small></div>${qtyCtl}<span class="ln-a">${amt}</span></li>`; }
function renderCheckout(confirm) {
  const el = $("#checkoutView");
  if (confirm) { el.innerHTML = confirm; return; }
  if (!S.kitchen.length && !S.market.length) {
    el.innerHTML = `<h1 id="c-h">Your <em>order</em></h1><div class="empty big"><p>Your cart is empty.</p><div class="row-b"><a class="b b-saffron" href="#restaurant">Order from the restaurant</a><a class="b b-em" href="#market">Shop the market</a></div></div>${reorderHTML()}`;
    return;
  }
  const ks = kSub(), ms = mSub(), wt = S.market.reduce((a, l) => a + prod(l.id).weight * l.qty, 0);
  const sl = slots(); if (!sl.includes(S.pickup)) S.pickup = "";
  const bad = shipBad();
  const kitchen = S.kitchen.length ? `<section class="cbox cb-k" aria-labelledby="cok-h"><header><h2 id="cok-h">Restaurant order</h2><span class="flag f-saffron">Pickup</span></header>
    <ul class="lines">${S.kitchen.map((l, i) => { const d = dish(l.id); return line(esc(d.name), esc(selText(d, l.sel)) + (l.note ? ` · “${esc(l.note)}”` : ""),
      `<div class="qty" role="group" aria-label="Quantity of ${esc(d.name)}"><button data-kq="${i}" data-d="-1" aria-label="Remove one">−</button><output>${l.qty}</output><button data-kq="${i}" data-d="1" aria-label="Add one">+</button></div>`, money(l.unit * l.qty)); }).join("")}</ul>
    <fieldset class="opts"><legend>How you'll get it</legend>
      <label class="opt"><input type="radio" name="kfill" checked><span><b>Pickup at the counter</b><small>3116 S Hamilton Road</small></span></label>
      <label class="opt dis"><input type="radio" name="kfill" disabled><span><b>Local delivery</b><small>Proposed — pending Medina's approval</small></span></label></fieldset>
    <div class="field"><label for="pickTime">Pickup time</label><select id="pickTime" aria-describedby="pickTimeErr"><option value="">Choose a time</option>${sl.map(s => `<option ${s === S.pickup ? "selected" : ""}>${s}</option>`).join("")}</select><p class="err" id="pickTimeErr"></p>
      <p class="hint">Proposed windows from listed hours and a 30-minute prep time.</p></div>
    <p class="subt"><span>Restaurant subtotal</span><b>${money(ks)}</b></p></section>` : "";
  const zipField = lab => `<div class="field zipf"><label for="zip">${lab}</label><input id="zip" inputmode="numeric" maxlength="5" autocomplete="postal-code" value="${esc(S.zip)}" aria-describedby="zipErr"><p class="err" id="zipErr"></p></div>`;
  const shipPanel = S.mfill === "ship" ? `<div class="panel">${zipField("Destination ZIP code")}
      <dl class="calc"><div><dt>Items</dt><dd>${S.market.reduce((a, l) => a + l.qty, 0)}</dd></div><div><dt>Product weight</dt><dd>${wt.toFixed(1)} lb</dd></div><div><dt>Packed (est.)</dt><dd>${(wt * 1.1 + 1).toFixed(1)} lb</dd></div><div><dt>Boxes</dt><dd>${Math.max(1, Math.ceil((wt * 1.1 + 1) / 50))}</dd></div></dl>
      <p class="hint">Live carrier rates and delivery dates aren't connected in this demo. At launch, the ZIP and packed weight go to a carrier rating service and the customer picks a rate here.</p>
      ${bad.length ? `<div class="warn" role="alert"><p><b>${bad.length === 1 ? "This item can't" : "These items can't"} ship:</b> ${bad.map(l => esc(prod(l.id).name)).join(", ")}. Halal meats, refrigerated and frozen products are pickup or local only.</p>
        <div class="row-b"><button type="button" class="b b-line b-s" data-act="topickup">Switch to pickup</button><button type="button" class="b b-line b-s" data-act="dropbad">Remove ${bad.length === 1 ? "it" : "them"}</button></div></div>` : `<p class="ok">Every item in this order can ship.</p>`}</div>` : "";
  const localPanel = S.mfill === "local" ? `<div class="panel">${zipField("Delivery ZIP code")}<p class="hint">Proposed: Columbus-area ZIP codes only, radius and fee set by Medina. Not yet offered.</p></div>` : "";
  const market = S.market.length ? `<section class="cbox cb-m" aria-labelledby="com-h"><header><h2 id="com-h">Market order</h2><span class="flag f-em">Groceries</span></header>
    <ul class="lines">${S.market.map(l => { const p = prod(l.id); return line(esc(p.name), esc([p.brand, p.size].filter(Boolean).join(" · ")) + (S.mfill === "ship" && !p.ship ? ` · <span class="bad">can't ship</span>` : ""),
      `<div class="qty" role="group" aria-label="Quantity of ${esc(p.name)}"><button data-mq="${p.id}" data-d="-1" aria-label="Remove one">−</button><output>${l.qty}</output><button data-mq="${p.id}" data-d="1" aria-label="Add one">+</button></div>`, money(p.price * l.qty)); }).join("")}</ul>
    <fieldset class="opts"><legend>How you'll get it</legend>
      <label class="opt"><input type="radio" name="mfill" value="pickup" ${S.mfill === "pickup" ? "checked" : ""}><span><b>In-store pickup</b><small>Ready within the hour</small></span></label>
      <label class="opt"><input type="radio" name="mfill" value="local" ${S.mfill === "local" ? "checked" : ""}><span><b>Local delivery</b><small>Proposed, pending approval</small></span></label>
      <label class="opt"><input type="radio" name="mfill" value="ship" ${S.mfill === "ship" ? "checked" : ""}><span><b>Ship nationwide</b><small>Eligible shelf-stable items</small></span></label></fieldset>
    ${shipPanel}${localPanel}<p class="subt"><span>Market subtotal</span><b>${money(ms)}</b></p></section>` : "";
  const c = S.contact || {};
  const addr = S.market.length && S.mfill !== "pickup" ? `<div class="field"><label for="coAddr">Street address</label><input id="coAddr" autocomplete="street-address" value="${esc(c.addr || "")}" aria-describedby="coAddrErr"><p class="err" id="coAddrErr"></p></div>` : "";
  const combo = S.kitchen.length && S.market.length ? `<p class="combo">${S.mfill === "pickup" ? "Two tickets, one visit: your meal is cooked for the time you choose and your groceries are packed to collect at the same counter."
    : `Handled separately: your meal is for <b>pickup</b>; your groceries go by <b>${S.mfill === "ship" ? "nationwide shipping" : "local delivery"}</b>. Prepared food is never added to a shipment.`}</p>` : "";
  el.innerHTML = `<h1 id="c-h">Your <em>order</em></h1>${combo}<div class="co"><div class="co-l">${kitchen}${market}</div>
   <aside class="co-r"><section class="cbox cb-pay" aria-labelledby="cs-h"><h2 id="cs-h">Contact &amp; payment</h2><form id="coForm" novalidate>
      <div class="field"><label for="coName">Full name</label><input id="coName" autocomplete="name" value="${esc(c.name || "")}" aria-describedby="coNameErr"><p class="err" id="coNameErr"></p></div>
      <div class="field"><label for="coPhone">Mobile phone</label><input id="coPhone" type="tel" inputmode="tel" autocomplete="tel" value="${esc(c.phone || "")}" aria-describedby="coPhoneErr"><p class="err" id="coPhoneErr"></p></div>
      <div class="field"><label for="coEmail">Email for confirmation</label><input id="coEmail" type="email" autocomplete="email" value="${esc(c.email || "")}" aria-describedby="coEmailErr"><p class="err" id="coEmailErr"></p></div>
      ${addr}
      <dl class="tot">${S.kitchen.length ? `<dt>Restaurant</dt><dd>${money(ks)}</dd>` : ""}${S.market.length ? `<dt>Market</dt><dd>${money(ms)}</dd>` : ""}
        ${S.market.length && S.mfill === "ship" ? `<dt>Shipping</dt><dd class="tbd">Live rate at launch</dd>` : ""}${S.market.length && S.mfill === "local" ? `<dt>Delivery fee</dt><dd class="tbd">Set by Medina</dd>` : ""}
        <dt>Sales tax</dt><dd class="tbd">Calculated at launch</dd><dt class="g">Item subtotal</dt><dd class="g">${money(ks + ms)}</dd></dl>
      <div class="paynote"><b>Payment</b><p>At launch, a secure hosted payment page (Square or Stripe) opens here. This demonstration collects no card details and charges nothing.</p></div>
      <p class="err" id="coErr" role="alert"></p>
      <button class="b b-saffron b-w" type="submit">Place demo order</button>
      <p class="hint c">Simulation only — nothing is sent to Medina.</p></form></section></aside></div>`;
}
function reorderHTML() {
  const h = S.history.slice(0, 3), favs = S.fav.map(prod).filter(Boolean);
  if (!h.length && !favs.length) return "";
  return `<section class="reorder"><h2>Quick <em>reorder</em></h2>${h.map((o, i) => `<div class="ro"><div><b>${esc(o.date)}</b><small>${esc(o.summary)}</small></div><button class="b b-line b-s" data-reorder="${i}">Order again</button></div>`).join("")}
   ${favs.length ? `<div class="ro"><div><b>Saved groceries</b><small>${favs.map(p => esc(p.name)).join(", ")}</small></div><button class="b b-line b-s" data-act="addfavs">Add all to cart</button></div>` : ""}</section>`;
}
function setErr(id, msg) { const e = $("#" + id + "Err"), i = $("#" + id); if (e) e.textContent = msg || ""; if (i) i.setAttribute("aria-invalid", msg ? "true" : "false"); return !msg; }
function placeOrder() {
  const name = $("#coName").value.trim(), phone = $("#coPhone").value.trim(), email = $("#coEmail").value.trim();
  S.contact = { name, phone, email, addr: $("#coAddr") ? $("#coAddr").value.trim() : "" };
  let ok = setErr("coName", name.length < 2 ? "Enter your name so the counter can find your order." : "");
  const pd = digits(phone); ok = setErr("coPhone", !(pd.length === 10 || (pd.length === 11 && pd[0] === "1")) ? "Enter a 10-digit US phone number." : "") && ok;
  ok = setErr("coEmail", !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? "Enter a valid email address." : "") && ok;
  if (S.kitchen.length) ok = setErr("pickTime", !$("#pickTime").value ? "Choose a pickup time for your meal." : "") && ok;
  if (S.market.length && S.mfill !== "pickup") {
    const z = $("#zip").value.trim(); S.zip = z;
    ok = setErr("zip", !zipOk(z) ? "Enter a 5-digit ZIP code." : (S.mfill === "local" && !localZip(z) ? "That ZIP is outside the proposed Columbus delivery area." : "")) && ok;
    ok = setErr("coAddr", S.contact.addr.length < 5 ? "Enter the street address." : "") && ok;
  }
  if (S.market.length && S.mfill === "ship" && shipBad().length) { ok = false; $("#coErr").textContent = "Some items can't ship. Switch to pickup or remove them first."; }
  else $("#coErr").textContent = ok ? "" : "Please fix the highlighted fields.";
  save();
  if (!ok) { const f = $('[aria-invalid="true"]'); if (f) f.focus(); return; }
  const n = Math.floor(1000 + Math.random() * 9000), when = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }), tickets = [];
  if (S.kitchen.length) {
    const tot = kSub(), id = "K-" + n;
    tickets.push(`<div class="tk tk-k"><p class="tk-l">Restaurant ticket</p><p class="tk-n">${id}</p><p>Pickup <b>${esc($("#pickTime").value)}</b> · 3116 S Hamilton Road</p><ul>${S.kitchen.map(l => `<li>${l.qty} × ${esc(dish(l.id).name)}<small>${esc(selText(dish(l.id), l.sel))}</small></li>`).join("")}</ul><p class="tk-t">${money(tot)}</p></div>`);
    const parts = name.split(/\s+/);
    S.ownerOrders.unshift({ id, name: parts[0] + (parts[1] ? " " + parts[1][0] + "." : ""), items: S.kitchen.map(l => `${l.qty} × ${dish(l.id).name}`).join(", "), total: tot, time: $("#pickTime").value.replace(/^(Today|Tomorrow) /, ""), status: "new", site: true });
  }
  if (S.market.length) {
    const how = { pickup: "In-store pickup, ready within the hour", local: `Local delivery to ${esc(S.zip)} (proposed service)`, ship: `Ship to ${esc(S.zip)} — rate and delivery date confirmed at launch` }[S.mfill];
    tickets.push(`<div class="tk tk-m"><p class="tk-l">Market order</p><p class="tk-n">G-${n}</p><p>${how}</p><ul>${S.market.map(l => `<li>${l.qty} × ${esc(prod(l.id).name)}</li>`).join("")}</ul><p class="tk-t">${money(mSub())}</p></div>`);
  }
  S.history.unshift({ date: when, kitchen: S.kitchen.map(l => ({ ...l })), market: S.market.map(l => ({ ...l })),
    summary: [...S.kitchen.map(l => `${l.qty} × ${dish(l.id).name}`), ...S.market.map(l => `${l.qty} × ${prod(l.id).name}`)].join(", ") });
  S.history = S.history.slice(0, 6); S.kitchen = []; S.market = []; S.pickup = ""; save(); count();
  renderCheckout(`<div class="confirm"><span class="flag f-saffron">Demonstration confirmation</span><h1 id="c-h">Thank you, <em>${esc(name.split(" ")[0])}</em>.</h1>
    <p class="lead">On the live site Medina's counter would receive this instantly, and you'd get a text when it's accepted and ready. This was a simulation: no order was sent and no payment was taken.</p>
    <div class="tickets">${tickets.join("")}</div><div class="row-b"><a class="b b-em" href="#owner">See it in the owner dashboard</a><a class="b b-line" href="#home">Back to home</a></div></div>`);
  window.scrollTo(0, 0);
}

/* ---------- OWNER ---------- */
let oTab = "orders";
const NEXT = { new: [["preparing", "Accept"], ["rejected", "Reject"]], preparing: [["ready", "Ready for pickup"]], ready: [["collected", "Collected"]] };
const SL = { new: "New", preparing: "Preparing", ready: "Ready", collected: "Collected", rejected: "Rejected" };
function renderOwner() {
  $$("#ownerTabs button").forEach(b => b.setAttribute("aria-pressed", b.dataset.otab === oTab));
  const el = $("#ownerView");
  if (oTab === "orders") {
    el.innerHTML = `<div class="kanban">${["new", "preparing", "ready", "collected"].map(c => { const list = S.ownerOrders.filter(o => o.status === c || (c === "collected" && o.status === "rejected"));
      return `<section class="kc" aria-labelledby="kc-${c}"><h2 id="kc-${c}">${SL[c]}${c === "collected" ? " / closed" : ""}<span>${list.length}</span></h2>
      ${list.map(o => `<article class="oc oc-${o.status}"><header><b>${o.id}</b><span>${esc(o.time)}</span></header><p class="oc-n">${esc(o.name)}${o.site ? ' <span class="flag f-saffron">From this site</span>' : ""}</p>
        <p>${esc(o.items)}</p><p class="oc-t">${money(o.total)}${o.status === "rejected" ? " · rejected" : ""}</p>
        <div class="row-b">${(NEXT[o.status] || []).map(([to, lab]) => `<button class="b b-s ${to === "rejected" ? "b-line" : "b-em"}" data-ost="${o.id}" data-to="${to}">${lab}</button>`).join("")}</div></article>`).join("") || `<p class="muted">None</p>`}</section>`; }).join("")}</div>
      <p class="hint">At launch, orders arrive through a serverless function with a sound alert; customers get a text at each step.</p>`;
  } else if (oTab === "menu") {
    el.innerHTML = `<table class="stack mtable"><thead><tr><th>Dish</th><th>Category</th><th>Price</th><th>Available today</th></tr></thead><tbody>
      ${D.MENU.map(d => `<tr><td><b>${esc(d.name)}</b></td><td>${esc(D.MENU_CATS.find(c => c.id === d.cat).label)}</td>
      <td><label class="sr" for="pr-${d.id}">Price for ${esc(d.name)}</label><span class="pin">$<input id="pr-${d.id}" type="number" min="0" step="0.25" value="${dPrice(d).toFixed(2)}" data-price="${d.id}"></span></td>
      <td><label class="sw"><input type="checkbox" data-avail="${d.id}" ${dAvail(d) ? "checked" : ""}><span>${dAvail(d) ? "On menu" : "Unavailable"}</span></label></td></tr>`).join("")}</tbody></table>
      <div class="row-b"><button class="b b-line b-s" data-act="resetmenu">Reset to original prices</button></div><p class="hint">Changes show on the Restaurant page immediately (this browser).</p>`;
  } else if (oTab === "specials") {
    el.innerHTML = `<div class="sp-ed">${S.specials.map((s, i) => `<fieldset class="cbox"><legend>${s.side === "kitchen" ? "Kitchen" : "Market"} offer</legend>
      <div class="field"><label for="spt${i}">Title</label><input id="spt${i}" data-sp="${i}" data-k="title" value="${esc(s.title)}"></div>
      <div class="field"><label for="spb${i}">Details</label><textarea id="spb${i}" rows="2" data-sp="${i}" data-k="body">${esc(s.body)}</textarea></div>
      <label class="sw"><input type="checkbox" data-sp="${i}" data-k="active" ${s.active ? "checked" : ""}><span>${s.active ? "Showing on site" : "Hidden"}</span></label></fieldset>`).join("")}</div>
      <p class="hint">Edits publish to the homepage and Specials page as you type (this browser).</p>`;
  } else {
    const max = Math.max(...D.MOCK_SALES.map(s => s[1])), tot = D.MOCK_SALES.reduce((a, s) => a + s[1], 0);
    el.innerHTML = `<div class="kpis"><div><span>Online restaurant sales, 7 days</span><b>${money(tot)}</b></div><div><span>Orders</span><b>196</b></div><div><span>Average order</span><b>${money(tot / 196)}</b></div><div><span>Busiest day</span><b>Saturday</b></div></div>
      <div class="bars" role="img" aria-label="Daily online restaurant sales, mock data">${D.MOCK_SALES.map(([d, v]) => `<div class="bar"><span>${d}</span><span class="bt"><i style="width:${(v / max * 100).toFixed(1)}%"></i></span><span class="bv">${money(v)}</span></div>`).join("")}</div>
      <p class="hint">All figures are mock data.</p>`;
  }
  labelStack();
}

/* ---------- forms ---------- */
$("#signupForm").addEventListener("submit", e => { e.preventDefault();
  const em = $("#suEmail").value.trim(), ph = $("#suPhone").value.trim(), eok = $("#suEmailOk").checked, sok = $("#suSmsOk").checked;
  let ok = setErr("suEmail", em && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em) ? "Enter a valid email address." : "");
  ok = setErr("suPhone", ph && digits(ph).length < 10 ? "Enter a 10-digit mobile number." : "") && ok;
  const c = !eok && !sok ? "Tick at least one box to give consent." : eok && !em ? "Add an email address for email offers." : sok && !ph ? "Add a mobile number for text offers." : "";
  $("#suConsentErr").textContent = c; if (!ok || c) return;
  $("#signupMsg").textContent = "Demo only: at launch this records your consent and sends a confirmation. Nothing was saved or sent."; e.target.reset();
});
$("#cateringForm").addEventListener("submit", e => { e.preventDefault();
  let ok = setErr("ctName", $("#ctName").value.trim().length < 2 ? "Enter your name." : "");
  ok = setErr("ctPhone", digits($("#ctPhone").value).length < 10 ? "Enter a 10-digit phone number." : "") && ok;
  const dv = $("#ctDate").value; ok = setErr("ctDate", !dv ? "Choose the event date." : (new Date(dv + "T12:00") < new Date() ? "Choose a future date." : "")) && ok;
  ok = setErr("ctGuests", !(+$("#ctGuests").value >= 10) ? "Catering starts at 10 guests." : "") && ok;
  if (!ok) return;
  $("#cateringMsg").textContent = "Demo only: at launch this inquiry is emailed to Medina. Nothing was sent."; e.target.reset();
});

/* ---------- events ---------- */
document.addEventListener("click", e => {
  const t = e.target;
  const db = t.closest("[data-dish]"); if (db) { e.preventDefault(); openDish(db.dataset.dish); return; }
  const od = t.closest("[data-opendish]"); if (od) { e.preventDefault(); location.hash = "restaurant"; setTimeout(() => openDish(od.dataset.opendish), 80); return; }
  const gc = t.closest("[data-gocat]"); if (gc) { mCat = gc.dataset.gocat; $("#q").value = ""; }
  const j = t.closest("[data-jump]"); if (j) { e.preventDefault(); const s = document.getElementById(j.dataset.jump); if (s) s.scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); return; }
  const ch = t.closest("[data-cat]"); if (ch) { mCat = ch.dataset.cat; renderMarket(); return; }
  const tg = t.closest("[data-tgl]"); if (tg) { S.tg[tg.dataset.tgl] = !S.tg[tg.dataset.tgl]; save(); renderMarket(); return; }
  if (t.closest("#clearF")) { mCat = "all"; $("#q").value = ""; S.tg = {}; save(); renderMarket(); return; }
  const ma = t.closest("[data-madd]"); if (ma) { setMQ(ma.dataset.madd, 1); return; }
  const mq = t.closest("[data-mq]"); if (mq) { setMQ(mq.dataset.mq, +mq.dataset.d); return; }
  const kq = t.closest("[data-kq]"); if (kq) { const i = +kq.dataset.kq, l = S.kitchen[i]; l.qty = Math.min(20, l.qty + +kq.dataset.d); if (l.qty <= 0) S.kitchen.splice(i, 1); save(); count(); renderCheckout(); return; }
  const fv = t.closest("[data-fav]"); if (fv) { const id = fv.dataset.fav; S.fav = S.fav.includes(id) ? S.fav.filter(x => x !== id) : [...S.fav, id]; save(); toast(S.fav.includes(id) ? "Saved to favorites" : "Removed from favorites"); refresh(); return; }
  const os = t.closest("[data-ost]"); if (os) { const o = S.ownerOrders.find(x => x.id === os.dataset.ost); o.status = os.dataset.to; save(); renderOwner(); toast(`${o.id}: ${SL[o.status]}`); return; }
  const ot = t.closest("[data-otab]"); if (ot) { oTab = ot.dataset.otab; renderOwner(); return; }
  const ro = t.closest("[data-reorder]"); if (ro) { const o = S.history[+ro.dataset.reorder];
    o.kitchen.forEach(l => { const d = dish(l.id); if (d && dAvail(d)) S.kitchen.push({ ...l, unit: lineUnit(d, l.sel), key: l.key + "|" + Date.now() }); });
    o.market.forEach(l => { const p = prod(l.id); if (p && p.stock !== "out") { const ex = S.market.find(x => x.id === l.id); ex ? ex.qty += l.qty : S.market.push({ ...l }); } });
    save(); count(); toast("Previous order added to your cart"); location.hash = "cart"; return; }
  const act = t.closest("[data-act]"); if (act) { const a = act.dataset.act;
    if (a === "topickup") S.mfill = "pickup";
    if (a === "dropbad") { S.market = S.market.filter(l => prod(l.id).ship); toast("Non-shippable items removed"); }
    if (a === "addfavs") { S.fav.forEach(id => { const p = prod(id); if (p && p.stock !== "out" && !S.market.find(x => x.id === id)) S.market.push({ id, qty: 1 }); }); toast("Favorites added to your cart"); location.hash = "cart"; }
    if (a === "resetmenu") { S.menu = {}; toast("Menu reset"); }
    save(); count(); refresh(); return; }
});
document.addEventListener("change", e => {
  const t = e.target;
  if (t.name === "mfill") { S.mfill = t.value; save(); renderCheckout(); const f = $(`input[name=mfill][value="${t.value}"]`); if (f) f.focus(); }
  if (t.id === "pickTime") { S.pickup = t.value; save(); }
  if (t.id === "sort") renderMarket();
  if (t.dataset.price) { const v = parseFloat(t.value); if (v >= 0) { S.menu[t.dataset.price] = { ...(S.menu[t.dataset.price] || {}), price: Math.round(v * 100) / 100 }; S.kitchen.forEach(l => l.unit = lineUnit(dish(l.id), l.sel)); save(); toast("Price updated"); } }
  if (t.dataset.avail) { S.menu[t.dataset.avail] = { ...(S.menu[t.dataset.avail] || {}), off: !t.checked }; save(); renderOwner(); toast(t.checked ? "Back on the menu" : "Marked unavailable today"); }
  if (t.dataset.sp && t.dataset.k === "active") { S.specials[+t.dataset.sp].active = t.checked; save(); renderOwner(); }
});
document.addEventListener("input", e => {
  const t = e.target;
  if (t.id === "q") renderMarket();
  if (t.id === "zip") { t.value = digits(t.value).slice(0, 5); S.zip = t.value; save(); if (t.value.length === 5) setErr("zip", S.mfill === "local" && !localZip(t.value) ? "That ZIP is outside the proposed Columbus delivery area." : ""); }
  if (t.dataset.sp && t.dataset.k !== "active") { S.specials[+t.dataset.sp][t.dataset.k] = t.value; save(); }
});
document.addEventListener("submit", e => { if (e.target.id === "coForm") { e.preventDefault(); placeOrder(); } });

function labelStack() {
  $$(".stack").forEach(t => { const hs = $$("thead th", t).map(th => th.textContent);
    $$("tbody tr", t).forEach(tr => [...tr.cells].forEach((c, i) => c.dataset.l = hs[i] || "")); });
}

/* ---------- router ---------- */
const VIEWS = ["home", "restaurant", "market", "item", "specials", "story", "visit", "cart", "owner", "launch"];
const TITLES = { restaurant: "Restaurant", market: "World Market", specials: "Specials", story: "Our Story", visit: "Visit Us", cart: "Your Order", owner: "Owner Dashboard", launch: "About This Demo" };
let cur = "", itemId = null;
function refresh() {
  if (cur === "home") renderHome();
  if (cur === "restaurant") renderMenu();
  if (cur === "market") renderMarket();
  if (cur === "item") renderItem(itemId);
  if (cur === "specials") { renderOffers($("#allOffers")); $("#reorderBox").innerHTML = reorderHTML(); }
  if (cur === "cart" && !$(".confirm")) renderCheckout();
  if (cur === "owner") renderOwner();
}
function route() {
  let h = location.hash.slice(1) || "home"; itemId = null;
  if (h.startsWith("item-")) { itemId = h.slice(5); h = "item"; }
  if (!VIEWS.includes(h)) h = "home";
  const changed = h !== cur || h === "item"; cur = h;
  document.body.dataset.view = h;
  $$(".view").forEach(v => v.hidden = v.dataset.view !== h);
  $$("[data-nav]").forEach(a => a.toggleAttribute("aria-current", a.dataset.nav === h || (h === "item" && a.dataset.nav === "market")));
  if (h === "cart") renderCheckout(); else refresh();
  labelStack(); orderBar();
  if (changed) { window.scrollTo(0, 0); const t = $(`.view[data-view="${h}"] h1`); if (t && h !== "home") { t.setAttribute("tabindex", "-1"); t.focus({ preventScroll: true }); } }
  document.title = (h === "home" ? "" : (h === "item" ? ((prod(itemId) || {}).name || "Product") : TITLES[h]) + " · ") + "Medina World Market & Restaurant";
}
window.addEventListener("hashchange", route);
sizeHdr(); route(); count();
setInterval(() => { if (cur === "home") openNow(); }, 60000);
}
