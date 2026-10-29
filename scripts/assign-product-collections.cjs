const fs = require('fs');
const path = require('path');

const productsFilePath = path.join(__dirname, '..', 'public', 'products.json');

if (!fs.existsSync(productsFilePath)) {
  console.error('File not found:', productsFilePath);
  process.exit(1);
}

const products = JSON.parse(fs.readFileSync(productsFilePath, 'utf8'));

function getSmartCollections(p) {
  const cat = p.category_id || p.category || 'textile';
  const sub = (p.subcategory || '').toLowerCase();
  const name = (p.name || '').toLowerCase();
  const desc = (p.description || '').toLowerCase();
  const colls = new Set();

  // Always include primary category
  colls.add(cat);

  // 1. Roti Covers & Chapati Covers
  if (
    sub.includes('chapati') ||
    sub.includes('roti') ||
    name.includes('roti') ||
    name.includes('chapati')
  ) {
    colls.add('roti-covers');
    colls.add('home-kitchen');
    colls.add('cotton-products');
  }

  // 2. Kitchen Essentials (Aprons, Gloves, Drying Net, Idli Cloth, Pot Cover)
  if (
    sub.includes('apron') ||
    sub.includes('oven') ||
    sub.includes('kitchen') ||
    sub.includes('drying') ||
    sub.includes('idli') ||
    sub.includes('pot cover') ||
    name.includes('apron') ||
    name.includes('glove') ||
    name.includes('drying net')
  ) {
    colls.add('home-kitchen');
    colls.add('cotton-products');
    colls.add('textile');
  }

  // 3. Vegetable Bags & Fruit Baskets
  if (
    sub.includes('vegetable') ||
    sub.includes('fruit') ||
    name.includes('vegetable') ||
    name.includes('fruit') ||
    name.includes('fridge')
  ) {
    colls.add('home-kitchen');
    colls.add('household');
    colls.add('cotton-products');
  }

  // 4. Saree Covers, Wardrobe Organizers, Shoe Bags
  if (
    sub.includes('saree') ||
    sub.includes('shoe') ||
    sub.includes('organizer') ||
    name.includes('saree cover') ||
    name.includes('wardrobe') ||
    name.includes('closet')
  ) {
    colls.add('household');
    colls.add('textile');
    colls.add('cotton-products');
  }

  // 5. Cotton Bags (Tote Bags, Canvas, Drawstring, Hand Bags, Kids Bags, Hamper Bags, Lunch Bags)
  if (
    sub.includes('tote') ||
    sub.includes('bag') ||
    name.includes('tote') ||
    name.includes('bag') ||
    name.includes('canvas') ||
    name.includes('pouch')
  ) {
    colls.add('textile');
    colls.add('cotton-products');
    colls.add('household');
  }

  // 6. Bedsheets, Linen, Bundles & Sets
  if (
    sub.includes('bedsheet') ||
    sub.includes('bundles') ||
    sub.includes('towel') ||
    name.includes('bedsheet') ||
    name.includes('pillow') ||
    name.includes('dohar') ||
    name.includes('towel')
  ) {
    colls.add('textile');
    colls.add('cotton-products');
  }

  // 7. General pure cotton products
  if (name.includes('cotton') || sub.includes('cotton') || desc.includes('100% cotton')) {
    colls.add('cotton-products');
  }

  // 8. PVC shower cap
  if (sub.includes('shower cap')) {
    colls.add('household');
    colls.add('home-kitchen');
  }

  return Array.from(colls);
}

let updatedCount = 0;
const collectionCounts = {};

const updatedProducts = products.map(prod => {
  const collections = getSmartCollections(prod);
  for (const c of collections) {
    collectionCounts[c] = (collectionCounts[c] || 0) + 1;
  }
  updatedCount++;
  return {
    ...prod,
    collections
  };
});

fs.writeFileSync(productsFilePath, JSON.stringify(updatedProducts, null, 2), 'utf8');

console.log(`Successfully assigned multi-collections across ${updatedCount} products!`);
console.log('Collection Product Counts:');
for (const [col, cnt] of Object.entries(collectionCounts)) {
  console.log(`  - ${col}: ${cnt} products`);
}
