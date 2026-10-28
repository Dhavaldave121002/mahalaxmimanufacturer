const mysql = require('mysql2/promise');
const fs = require('fs');

async function listMle() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'mahalaxmi_db'
  });

  const [rows] = await conn.query('SELECT id, name, category_name, subcategory, specifications, images FROM products WHERE id LIKE "source-mle-%" ORDER BY id');
  
  const items = rows.map(r => {
    let imgs = [];
    try {
      imgs = typeof r.images === 'string' ? JSON.parse(r.images) : r.images;
    } catch(e){}
    let specs = {};
    try {
      specs = typeof r.specifications === 'string' ? JSON.parse(r.specifications) : r.specifications;
    } catch(e){}
    return {
      id: r.id,
      name: r.name,
      cat: r.category_name,
      sub: r.subcategory,
      material: specs['Material / Fabric'] || '',
      color: specs['Colour'] || '',
      size: specs['Dimensions / Size'] || specs['Diameter'] || '',
      pattern: specs['Pattern / Design'] || '',
      images: imgs
    };
  });

  console.log(`Found ${items.length} source-mle items.`);
  fs.writeFileSync('scripts/mle-items.json', JSON.stringify(items, null, 2));

  // Print grouped by subcategory
  const bySub = {};
  for (const it of items) {
    bySub[it.sub] = (bySub[it.sub] || 0) + 1;
  }
  console.log('Subcategories:', bySub);

  await conn.end();
}

listMle().catch(console.error);
