/* Medina World Market & Restaurant — demonstration data.
   Everything in MENU, PRODUCTS, SPECIALS and MOCK_* is ILLUSTRATIVE and must be
   replaced with owner-confirmed menu items, inventory, prices and services before launch.
   Only BUSINESS fields marked verified come from the brief. */
window.MEDINA = (function () {
  const BUSINESS = {
    name: "Medina World Market & Restaurant",
    street: "3116 S Hamilton Road",
    city: "Columbus", region: "OH", zip: "43232",
    phone: "(614) 322-0076", phoneE164: "+16143220076",
    listedHours: "9:00 AM – 12:00 AM daily",   // reported in public listings — verify
    open: 9, close: 24,
    since: 2012                                  // reported — verify
  };

  /* Option groups reused by dishes. price = add-on cost in USD. */
  const OPT = {
    portion: { id: "portion", label: "Portion", type: "one", required: true, choices: [
      { id: "reg", label: "Regular", price: 0 }, { id: "lg", label: "Large", price: 4 } ] },
    protein: { id: "protein", label: "Protein", type: "one", required: true, choices: [
      { id: "chicken", label: "Chicken", price: 0 }, { id: "lamb", label: "Lamb", price: 4 },
      { id: "fish", label: "Fish", price: 3 }, { id: "none", label: "No protein (vegetable)", price: -3 } ] },
    stewProtein: { id: "protein", label: "Protein", type: "one", required: true, choices: [
      { id: "beef", label: "Beef", price: 0 }, { id: "fish", label: "Fish", price: 1 },
      { id: "chicken", label: "Chicken", price: 0 } ] },
    spice: { id: "spice", label: "Spice level", type: "one", required: true, choices: [
      { id: "mild", label: "Mild", price: 0 }, { id: "med", label: "Medium", price: 0 }, { id: "hot", label: "Hot", price: 0 } ] },
    side: { id: "side", label: "Side", type: "one", required: true, choices: [
      { id: "rice", label: "White rice", price: 0 }, { id: "jollof", label: "Jollof rice", price: 1.5 },
      { id: "plantain", label: "Fried plantains", price: 1.5 }, { id: "fufu", label: "Fufu", price: 1.5 } ] },
    swallow: { id: "side", label: "Served with", type: "one", required: true, choices: [
      { id: "rice", label: "White rice", price: 0 }, { id: "fufu", label: "Fufu", price: 0 } ] },
    extras: { id: "extras", label: "Extras", type: "many", required: false, choices: [
      { id: "plantain", label: "Add fried plantains", price: 3 }, { id: "pepper", label: "Pepper sauce on the side", price: 0.5 },
      { id: "onion", label: "Grilled onions", price: 1 } ] },
    size: { id: "size", label: "Size", type: "one", required: true, choices: [
      { id: "16", label: "16 oz", price: 0 }, { id: "32", label: "32 oz", price: 2.5 } ] }
  };

  /* art = colours for the illustrated plate (base, main, accent, garnish) */
  const MENU = [
    { id: "jollof-chicken", cat: "rice", name: "Jollof Rice Plate", price: 14.99,
      desc: "Tomato-and-pepper jollof rice with your choice of protein, finished with a little fresh onion.",
      opts: ["portion", "protein", "spice", "extras"], tag: "Kitchen favorite" },
    { id: "veg-jollof", cat: "rice", name: "Vegetable Jollof", price: 10.99,
      desc: "Jollof rice cooked with carrots, peas and peppers. Vegetarian as prepared.",
      opts: ["portion", "spice", "extras"] },
    { id: "grilled-lamb", cat: "grill", name: "Grilled Lamb Plate", price: 19.99,
      desc: "Seasoned lamb grilled over high heat, served with onions and a side of your choice.",
      opts: ["portion", "spice", "side", "extras"], tag: "From the grill" },
    { id: "grilled-chicken", cat: "grill", name: "Grilled Chicken Plate", price: 15.99,
      desc: "Marinated chicken quarters, charred and juicy, with a side of your choice.",
      opts: ["portion", "spice", "side", "extras"] },
    { id: "grilled-fish", cat: "fish", name: "Grilled Whole Fish", price: 18.99,
      desc: "Whole fish, scored, seasoned and grilled, with peppers, onion and a side.",
      opts: ["spice", "side", "extras"], tag: "Made to order" },
    { id: "fried-fish", cat: "fish", name: "Fried Fish & Plantain", price: 16.99,
      desc: "Crisp fried fish with sweet plantains and a tomato-onion sauce.",
      opts: ["spice", "extras"] },
    { id: "cassava-leaf", cat: "stew", name: "Cassava Leaf Stew", price: 15.99,
      desc: "Slow-cooked pounded cassava leaves in a rich palm-oil stew with meat or fish.",
      opts: ["stewProtein", "swallow", "spice"], tag: "Slow-cooked" },
    { id: "okra-soup", cat: "stew", name: "Okra Soup", price: 15.99,
      desc: "Fresh okra simmered with peppers and your choice of protein. Served with rice or fufu.",
      opts: ["stewProtein", "swallow", "spice"] },
    { id: "peanut-stew", cat: "stew", name: "Peanut Stew", price: 15.99,
      desc: "Creamy groundnut sauce with tomato and tender meat, served over rice.",
      opts: ["stewProtein", "spice"] },
    { id: "plantains", cat: "sides", name: "Fried Plantains", price: 4.99,
      desc: "Ripe plantains, fried until caramelised at the edges.", opts: [] },
    { id: "white-rice", cat: "sides", name: "Steamed White Rice", price: 3.99,
      desc: "A generous side of fluffy long-grain rice.", opts: [] },
    { id: "fufu", cat: "sides", name: "Fufu", price: 4.99,
      desc: "Smooth, soft swallow to pair with any stew.", opts: [] },
    { id: "bissap", cat: "drinks", name: "Hibiscus Drink (Bissap)", price: 3.99,
      desc: "Chilled hibiscus infusion with a hint of mint.", opts: ["size"], drink: true },
    { id: "ginger", cat: "drinks", name: "Ginger Drink", price: 3.99,
      desc: "Fresh, fiery ginger juice, lightly sweetened.", opts: ["size"], drink: true },
    { id: "water", cat: "drinks", name: "Bottled Water", price: 1.49, desc: "16.9 oz bottle.", opts: [], drink: true }
  ];
  const MENU_CATS = [
    { id: "rice", label: "Rice dishes" }, { id: "grill", label: "Grilled meats" }, { id: "fish", label: "Fish & seafood" },
    { id: "stew", label: "Stews & traditional" }, { id: "sides", label: "Sides" }, { id: "drinks", label: "Beverages" }
  ];

  /* REAL branded products with REAL package photos (images/products/, same photo set as the
     Africa Supermarket demo; photo source sites listed in `credit`).
     NOT confirmed as Medina inventory. Prices, stock and shipping weights are ILLUSTRATIVE.
     Photos belong to their owners: obtain permission or manufacturer images before public commercial use.
     storage: shelf | chilled | frozen. ship = proposed nationwide eligibility. weight = est. shipping lb. */
  const PRODUCTS = [
    { id: "tropical-sun-fragrant-rice", name: "Fragrant Rice", brand: "Tropical Sun", size: "", cat: "rice", price: 15.99, weight: 5.2, storage: "shelf", ship: true, stock: "in", photo: "08_tropical_sun_fragrant_rice.webp", credit: "tropicalsunfoods.com" },
    { id: "ijebu-garri", name: "Ijebu Garri", brand: "Afrigrid", size: "", cat: "rice", price: 6.99, weight: 2.2, storage: "shelf", ship: true, stock: "in", photo: "07_ijebu_garri_afrigrid.webp", credit: "afrigrid.us" },
    { id: "cocoyam-fufu-flour", name: "Cocoyam Fufu Flour", brand: "Tropiway", size: "", cat: "rice", price: 6.49, weight: 1.8, storage: "shelf", ship: true, stock: "in", photo: "01_tropiway_cocoyam_fufu_flour.webp", credit: "africanmarketonline.com" },
    { id: "honey-beans", name: "Honey Beans (Oloyin)", brand: "", size: "5 lb", cat: "rice", price: 12.99, weight: 5.2, storage: "shelf", ship: true, stock: "low", photo: "10_honey_beans_oloyin_5lbs.webp", credit: "asherafricanmarket.com" },
    { id: "maggi-chicken-cubes", name: "Chicken Seasoning Cubes", brand: "Maggi", size: "", cat: "spices", price: 4.99, weight: 0.9, storage: "shelf", ship: true, stock: "in", photo: "09_maggi_chicken_cube.webp", credit: "a1cashandcarry.com" },
    { id: "titus-sardines", name: "Sardines in Soybean Oil", brand: "Titus", size: "", cat: "pantry", price: 2.49, weight: 0.5, storage: "shelf", ship: true, stock: "in", photo: "03_titus_sardines_in_soybean_oil.webp", credit: "shop.pathmark.com" },
    { id: "indomie-onion-chicken", name: "Onion Chicken Flavor Instant Noodles", brand: "Indomie", size: "70 g packs", cat: "pantry", price: 1.29, weight: 0.2, storage: "shelf", ship: true, stock: "in", photo: "12_indomie_onion_chicken_noodles.webp", credit: "africanmarketonline.com" },
    { id: "rosa-margarine", name: "Margarine", brand: "Rosa", size: "450 g", cat: "pantry", price: 4.49, weight: 1.2, storage: "shelf", ship: false, stock: "in", photo: "02_rosa_margarine_450g.webp", credit: "africanmarketonline.com", note: "heat-sensitive spread, shipping to be reviewed" },
    { id: "milo-tin", name: "Milo Chocolate Malt Drink, Tin", brand: "Nestlé", size: "1.5 kg", cat: "breakfast", price: 24.99, weight: 3.8, storage: "shelf", ship: true, stock: "in", photo: "11_nestle_milo_tin_1_5kg.webp", credit: "africanmarketonline.com" },
    { id: "nido-fortificada", name: "NIDO Fortificada Dry Whole Milk", brand: "Nestlé", size: "12.6 oz", cat: "breakfast", price: 9.99, weight: 1.1, storage: "shelf", ship: true, stock: "in", photo: "04_nestle_nido_fortificada_dry_whole_milk.webp", credit: "heb.com" },
    { id: "peak-evaporated-milk", name: "Evaporated Milk", brand: "Peak", size: "13 oz", cat: "breakfast", price: 2.49, weight: 1.0, storage: "shelf", ship: true, stock: "in", photo: "05_peak_evaporated_milk_13oz.webp", credit: "heb.com" },
    { id: "birds-custard", name: "Original Custard Powder", brand: "Bird's", size: "", cat: "breakfast", price: 6.99, weight: 1.4, storage: "shelf", ship: true, stock: "in", photo: "06_birds_original_custard_powder.webp", credit: "kroger.com" },
    { id: "goat-meat", name: "Halal Goat Meat, Bone-in", brand: "Butcher counter", size: "Per lb", cat: "halal", price: 8.99, weight: 1, storage: "chilled", ship: false, stock: "in" },
    { id: "lamb-leg", name: "Halal Lamb Leg", brand: "Butcher counter", size: "Per lb", cat: "halal", price: 10.49, weight: 1, storage: "chilled", ship: false, stock: "in" },
    { id: "beef-stew", name: "Halal Beef Stew Cuts", brand: "Butcher counter", size: "Per lb", cat: "halal", price: 7.99, weight: 1, storage: "chilled", ship: false, stock: "in" }
  ];
  const PRODUCT_CATS = [
    { id: "rice", tone: "#E9B949", label: "Rice, grains & flour" },
    { id: "spices", tone: "#D9532B", label: "Spices & seasonings" },
    { id: "pantry", tone: "#E07A2E", label: "Pantry essentials" },
    { id: "breakfast", tone: "#2E8B7A", label: "Milk & breakfast" },
    { id: "halal", tone: "#A3263F", label: "Halal meats" }
  ];

  const SPECIALS = [
    { id: "s1", side: "kitchen", title: "Weekend lamb plate", body: "Grilled Lamb Plate with a free side of plantains, Friday to Sunday.", ref: "grilled-lamb", active: true },
    { id: "s2", side: "market", title: "Stock-up rice week", body: "10% off Tropical Sun Fragrant Rice while the promotion runs.", ref: "tropical-sun-fragrant-rice", active: true },
    { id: "s3", side: "market", title: "Seasoning bundle", body: "Any three spice jars for one bundle price.", ref: "maggi-chicken-cubes", active: false }
  ];

  const MOCK_ORDERS = [
    { id: "M-1041", name: "Customer A.", items: "2 × Jollof Rice Plate, 1 × Bissap", total: 33.97, time: "6:45 PM", status: "new" },
    { id: "M-1040", name: "Customer B.", items: "1 × Grilled Lamb Plate", total: 19.99, time: "6:30 PM", status: "preparing" },
    { id: "M-1039", name: "Customer C.", items: "1 × Cassava Leaf Stew, 1 × Fufu", total: 20.98, time: "6:15 PM", status: "ready" },
    { id: "M-1038", name: "Customer D.", items: "3 × Grilled Chicken Plate", total: 47.97, time: "5:50 PM", status: "collected" }
  ];
  const MOCK_SALES = [ ["Mon", 412], ["Tue", 388], ["Wed", 455], ["Thu", 506], ["Fri", 742], ["Sat", 868], ["Sun", 690] ];

  return { BUSINESS, OPT, MENU, MENU_CATS, PRODUCTS, PRODUCT_CATS, SPECIALS, MOCK_ORDERS, MOCK_SALES };
})();
