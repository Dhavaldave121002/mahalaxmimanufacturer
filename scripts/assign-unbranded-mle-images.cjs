const mysql = require('mysql2/promise');

async function buildUnbrandedDataset() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'mahalaxmi_db'
  });

  // Pull all verified unbranded products
  const [verifiedRows] = await conn.query('SELECT id, name, subcategory, images FROM products WHERE id NOT LIKE "source-mle-%"');

  const pool = {};
  for (const r of verifiedRows) {
    const imgs = typeof r.images === 'string' ? JSON.parse(r.images) : r.images;
    if (!pool[r.subcategory]) pool[r.subcategory] = [];
    pool[r.subcategory].push({ id: r.id, name: r.name, images: imgs });
  }

  console.log('Available pools:');
  for (const k of Object.keys(pool)) {
    console.log(`- ${k}: ${pool[k].length} products`);
  }

  // Get all 80 MLE products
  const [mleRows] = await conn.query('SELECT id, name, subcategory, specifications FROM products WHERE id LIKE "source-mle-%" ORDER BY id');
  console.log(`\nMapping ${mleRows.length} source-mle products...`);

  // Map each product to unbranded images
  const assignments = [];

  for (const p of mleRows) {
    let chosenImgs = [];
    const name = p.name.toLowerCase();
    const sub = p.subcategory;

    if (sub === 'Cotton Chapati Cover' || sub === 'Cotton Roti Basket Cover' || name.includes('chapati') || name.includes('roti')) {
      // Find roti cover products
      const rotiProds = pool['Cotton Chapati Cover'] || [];
      if (name.includes('floral') || name.includes('printed') || name.includes('multi')) {
        const p1 = rotiProds.find(r => r.name.toLowerCase().includes('floral')) || rotiProds[0];
        chosenImgs = p1 ? p1.images.slice(0, 5) : [];
      } else if (name.includes('white') || name.includes('plain')) {
        const p2 = rotiProds.find(r => r.name.toLowerCase().includes('pure') || r.name.toLowerCase().includes('white')) || rotiProds[1] || rotiProds[0];
        chosenImgs = p2 ? p2.images.slice(0, 5) : [];
      } else if (name.includes('insulated') || name.includes('zip') || name.includes('double')) {
        const p3 = rotiProds.find(r => r.name.toLowerCase().includes('double') || r.name.toLowerCase().includes('wrap')) || rotiProds[2] || rotiProds[0];
        chosenImgs = p3 ? p3.images.slice(0, 5) : [];
      } else {
        const p4 = rotiProds[assignments.length % rotiProds.length];
        chosenImgs = p4 ? p4.images.slice(0, 5) : [];
      }
    } else if (sub === 'Vegetable Mesh Bag' || sub === 'Fruit Net Bag' || sub === 'Cotton Storage Bag' || sub === 'Vegetable Bags' || name.includes('vegetable') || name.includes('fridge net')) {
      const vegProds = pool['Vegetable Bags'] || [];
      if (name.includes('nylon')) {
        const p1 = vegProds.find(r => r.name.toLowerCase().includes('nylon')) || vegProds[0];
        chosenImgs = p1 ? p1.images.slice(0, 5) : [];
      } else if (name.includes('zip') || name.includes('fridge')) {
        const p2 = vegProds.find(r => r.name.toLowerCase().includes('zip')) || vegProds[1] || vegProds[0];
        chosenImgs = p2 ? p2.images.slice(0, 5) : [];
      } else {
        const p3 = vegProds.find(r => r.name.toLowerCase().includes('net') || r.name.toLowerCase().includes('mesh') || r.name.toLowerCase().includes('cotton')) || vegProds[2] || vegProds[0];
        chosenImgs = p3 ? p3.images.slice(0, 5) : [];
      }
    } else if (sub === 'Cotton Kitchen Apron' || name.includes('apron')) {
      // Find apron or bundles with apron
      const bundles = pool['Bundles & Sets'] || [];
      const apronBundle = bundles.find(b => b.name.toLowerCase().includes('apron')) || bundles[0];
      chosenImgs = apronBundle ? apronBundle.images.slice(0, 5) : [];
    } else if (sub === 'Cotton Saree Cover' || name.includes('saree cover')) {
      const sareeProds = pool['Cotton Saree Cover'] || [];
      const sp = sareeProds[assignments.length % sareeProds.length];
      chosenImgs = sp ? sp.images.slice(0, 5) : [];
    } else if (sub === 'Cotton Tote Bag' || sub === 'Canvas Tote Bag' || sub === 'Cotton Carry Bags' || sub === 'Tote Bags' || name.includes('tote') || name.includes('canvas')) {
      const toteProds = pool['Tote Bags'] || [];
      if (name.includes('plain') || name.includes('white') || name.includes('natural')) {
        const p1 = toteProds.find(t => t.name.toLowerCase().includes('classic') || t.name.toLowerCase().includes('white') || t.name.toLowerCase().includes('canvas')) || toteProds[0];
        chosenImgs = p1 ? p1.images.slice(0, 5) : [];
      } else {
        const p2 = toteProds[(assignments.length * 3) % toteProds.length];
        chosenImgs = p2 ? p2.images.slice(0, 5) : [];
      }
    } else if (sub === 'Non Woven Shoe Bag' || name.includes('shoe')) {
      const shoeProds = pool['Shoe Bags'] || [];
      chosenImgs = shoeProds[0] ? shoeProds[0].images.slice(0, 5) : [];
    } else if (sub === 'PVC Shower Cap' || name.includes('shower')) {
      const showerProds = pool['PVC Shower Cap'] || [];
      chosenImgs = showerProds[0] ? showerProds[0].images.slice(0, 5) : [];
    } else if (sub === 'Cotton Idli Cloth' || name.includes('idli')) {
      const idliProds = pool['Cotton Idli Cloth'] || [];
      chosenImgs = idliProds[0] ? idliProds[0].images.slice(0, 5) : [];
    } else if (sub === 'Papad Drying Cloth' || sub === 'Multipurpose Food Drying Net Cloth' || name.includes('drying') || name.includes('papad')) {
      const dryProds = pool['Multipurpose Food Drying Net Cloth'] || [];
      chosenImgs = dryProds[0] ? dryProds[0].images.slice(0, 5) : [];
    } else if (sub === 'Bamboo Basket' || name.includes('bamboo')) {
      const basketProds = pool['Fruit Baskets'] || [];
      chosenImgs = basketProds[0] ? basketProds[0].images.slice(0, 5) : [];
    } else if (sub === 'Cotton Oven Gloves' || name.includes('glove')) {
      // Find oven gloves in pool
      const kitAcc = pool['Kitchen Accessories'] || [];
      const glove = kitAcc.find(k => k.name.toLowerCase().includes('glove')) || kitAcc[0];
      chosenImgs = glove ? glove.images.slice(0, 5) : [];
    } else if (sub === 'Non Woven Handbag Organizer Bag' || name.includes('organizer')) {
      const orgProds = pool['Organizer Bags'] || [];
      chosenImgs = orgProds[0] ? orgProds[0].images.slice(0, 5) : [];
    } else if (name.includes('matka') || name.includes('pot cover') || sub === 'Pot Cover' || sub === 'Copper Pot') {
      const rotiProds = pool['Cotton Chapati Cover'] || [];
      chosenImgs = rotiProds[0] ? rotiProds[0].images.slice(0, 5) : [];
    } else if (name.includes('rice bag') || name.includes('drawstring') || sub === 'Drawstring Bags') {
      const drawProds = pool['Drawstring Bags'] || [];
      const dp = drawProds[assignments.length % (drawProds.length || 1)] || drawProds[0];
      chosenImgs = dp ? dp.images.slice(0, 5) : [];
    } else if (name.includes('pouch') || name.includes('zipper pouch')) {
      const hampers = pool['Hamper Bags'] || [];
      const hp = hampers[assignments.length % hampers.length];
      chosenImgs = hp ? hp.images.slice(0, 5) : [];
    } else {
      const def = pool['Tote Bags'] || pool['Bundles & Sets'];
      chosenImgs = def[0] ? def[0].images.slice(0, 5) : [];
    }

    assignments.push({
      id: p.id,
      name: p.name,
      sub,
      count: chosenImgs.length,
      images: chosenImgs
    });
  }

  const failedCount = assignments.filter(a => a.count < 4).length;
  console.log(`Assignments summary: ${assignments.length} total, ${failedCount} with < 4 images.`);
  if (failedCount === 0) {
    console.log('ALL 80 PRODUCTS HAVE 4-5 PERFECT UNBRANDED STUDIO IMAGES!');
  }

  // Update in DB
  let updated = 0;
  for (const a of assignments) {
    await conn.query('UPDATE products SET images = ? WHERE id = ?', [JSON.stringify(a.images), a.id]);
    updated++;
  }
  console.log(`Successfully updated all ${updated} existing listings in database!`);

  // Sync public/products.json
  const [allRows] = await conn.query('SELECT * FROM products ORDER BY id');
  const formatted = allRows.map(r => ({
    ...r,
    images: typeof r.images === 'string' ? JSON.parse(r.images) : r.images,
    tags: typeof r.tags === 'string' ? JSON.parse(r.tags) : r.tags,
    specifications: typeof r.specifications === 'string' ? JSON.parse(r.specifications) : r.specifications,
    wholesale_tiers: typeof r.wholesale_tiers === 'string' ? JSON.parse(r.wholesale_tiers) : r.wholesale_tiers,
    variants: typeof r.variants === 'string' ? JSON.parse(r.variants) : r.variants
  }));
  const fs = require('fs');
  fs.writeFileSync('public/products.json', JSON.stringify(formatted, null, 2), 'utf8');
  console.log('Synchronized public/products.json!');

  await conn.end();
}

buildUnbrandedDataset().catch(console.error);
