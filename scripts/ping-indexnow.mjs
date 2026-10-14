// Instant IndexNow ping script to notify Bing, Yandex, and partner search engines for fast indexing
async function pingIndexNow() {
  const payload = {
    host: "mahalaxmimanufacturer.vercel.app",
    key: "d80f4f91899147cbba1b7e42d7658c14",
    keyLocation: "https://mahalaxmimanufacturer.vercel.app/d80f4f91899147cbba1b7e42d7658c14.txt",
    urlList: [
      "https://mahalaxmimanufacturer.vercel.app/",
      "https://mahalaxmimanufacturer.vercel.app/catalog",
      "https://mahalaxmimanufacturer.vercel.app/wholesale",
      "https://mahalaxmimanufacturer.vercel.app/category/textile",
      "https://mahalaxmimanufacturer.vercel.app/category/cotton-products",
      "https://mahalaxmimanufacturer.vercel.app/category/home-kitchen",
      "https://mahalaxmimanufacturer.vercel.app/category/household",
      "https://mahalaxmimanufacturer.vercel.app/product/glance-300-tc-cotton-double-bedsheet",
      "https://mahalaxmimanufacturer.vercel.app/product/luxury-600-gsm-cotton-bath-towel",
      "https://mahalaxmimanufacturer.vercel.app/product/commercial-350-gsm-microfiber-cloth-pack",
      "https://mahalaxmimanufacturer.vercel.app/product/heavy-duty-canvas-shopping-tote-bag"
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
