// Instant IndexNow ping script to notify Bing, Yandex, and partner search engines for fast indexing
async function pingIndexNow() {
  const payload = {
    host: "mahalaxmimanufacturer.com",
    key: "d80f4f91899147cbba1b7e42d7658c14",
    keyLocation: "https://mahalaxmimanufacturer.com/d80f4f91899147cbba1b7e42d7658c14.txt",
    urlList: [
      "https://mahalaxmimanufacturer.com/",
      "https://mahalaxmimanufacturer.com/catalog",
      "https://mahalaxmimanufacturer.com/wholesale",
      "https://mahalaxmimanufacturer.com/category/textile",
      "https://mahalaxmimanufacturer.com/category/cotton-products",
      "https://mahalaxmimanufacturer.com/category/home-kitchen",
      "https://mahalaxmimanufacturer.com/category/household",
      "https://mahalaxmimanufacturer.com/product/glance-300-tc-cotton-double-bedsheet",
      "https://mahalaxmimanufacturer.com/product/luxury-600-gsm-cotton-bath-towel",
      "https://mahalaxmimanufacturer.com/product/commercial-350-gsm-microfiber-cloth-pack",
      "https://mahalaxmimanufacturer.com/product/heavy-duty-canvas-shopping-tote-bag"
    ]
  };

  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload)
    });
    console.log(`IndexNow Ping Response Status: ${res.status}`);
  } catch (err) {
    console.error("IndexNow ping failed:", err);
  }
}

pingIndexNow();
