# Medina World Market & Restaurant — website demonstration

Proposed website by **Dalal Technologies** · dalaltechnologies.com · info@dalaltechnologies.com · +1 (718) 912-3441 · 228 Park Ave S, PMB 473086, New York, NY 10003

Static site, no build step, no dependencies (Google Fonts only). Deploy by dragging this folder onto Netlify, or push to GitHub and connect the repo (publish directory `.`).

## Files
- `index.html` — all pages (hash routes: `#restaurant`, `#market`, `#item-<id>`, `#specials`, `#story`, `#visit`, `#cart`, `#owner`, `#launch`)
- `data.js` — business details, demo menu, demo products, specials, mock dashboard data. **Edit this file to load the real menu and inventory.**
- `app.js` — ordering, cart, checkout simulation, owner dashboard
- `styles.css` — design system (forest green, cream, terracotta, gold; Fraunces + Figtree)
- `images/` — two sharp photographs supplied by Medina: the storefront and a market aisle (low-resolution photos were removed). Add `images/dalal-logo.png` and the footer shows the Dalal logo in place of the text wordmark.
- `images/menu/` and `images/products/` — **photo slots.** Drop in a real dish photo or licensed product packshot, then add `photo: "filename.jpg"` to that item in `data.js`. It appears on the menu, dish sheet, product tiles and product page automatically. Until then, dishes are shown as a typographic menu and products as labelled colour swatches (no illustrations, no generated packaging).

## What is real vs illustrative
- Verified: name, address (3116 S Hamilton Road, Columbus, OH 43232), phone (614) 322-0076.
- To confirm: hours (9 AM–12 AM listed), founding year (2012 reported). Hours are deliberately left out of the JSON-LD.
- Illustrative: every dish, product, brand, price, stock level, special, and all dashboard figures.
- No drawn or generated food or packaging. Product tiles say "Photo pending" until a real photo is supplied. No stock photography is presented as Medina's food.

## Demo behaviour
- Carts, favorites, order history and owner edits are stored in the visitor's browser (localStorage) only.
- Checkout collects no card data and sends nothing. Demo orders appear in the owner dashboard in the same browser.
- Shipping: per-product eligibility, ZIP validation, cart weight, packed weight and box count are calculated; no rates or delivery dates are invented.
- Halal meats, chilled and frozen items are blocked from nationwide shipping; the checkout refuses to mix them into a shipment.

## Production checklist
1. Payments: Square or Stripe hosted checkout (keeps PCI scope off the site). Separate kitchen / market reporting.
2. Orders: Netlify Function → database (e.g. Supabase) → counter tablet with sound alert + SMS backup; customer status texts.
3. Inventory: sync from Medina's POS or a small admin; per-product `ship`, `weight`, `storage`, `stock`.
4. Shipping: Netlify Function calling Shippo or EasyPost for live USPS/UPS/FedEx rates; packaging rules for liquids and glass; label printing.
5. Taxes: Ohio / Franklin County rules for prepared food vs groceries, confirmed with Medina's accountant; destination rules for shipments.
6. Accounts: optional email-link sign-in to sync favorites and reorders.
7. Marketing: consent records, double opt-in email, SMS STOP/HELP (e.g. Twilio), one-click unsubscribe.
8. Security: dashboard behind authentication (Netlify Identity / Auth0), secrets in environment variables, HTTPS.
9. Content: real menu and photos from the kitchen, licensed product packshots, owner-written story, approved reviews with attribution.
