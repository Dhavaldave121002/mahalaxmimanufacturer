const path = require('node:path');
const XLSX = require('xlsx');
const mysql = require('mysql2/promise');
require('dotenv').config();

const workbookPath = 'C:\\Users\\mahal\\.copilot\\session-state\\1f7dc677-4865-480e-aa98-6029450ca99c\\files\\Mahalaxmi Enterprise - Source Product Catalogue.xlsx';
const archiveTable = 'products_backup_catalogue_cleanup_20261022';
const temporaryPricing = {
  mrp: 999,
  retailPrice: 449,
  wholesaleTiers: [
    { minQty: 1, maxQty: 9, pricePerUnit: 449, savingsPercent: 0, label: 'Standard Rate' },
    { minQty: 10, maxQty: 49, pricePerUnit: 320, savingsPercent: 29, label: 'Wholesale Tier 1' },
    { minQty: 50, maxQty: 199, pricePerUnit: 265, savingsPercent: 41, label: 'Wholesale Tier 2' },
    { minQty: 200, pricePerUnit: 225, savingsPercent: 50, label: 'Direct Mill Contract' }
  ]
};
const coreCategories = [
  { id: 'home-kitchen', name: 'Home and Kitchen' },
  { id: 'household', name: 'Household' },
  { id: 'textile', name: 'Textile' },
  { id: 'cotton-products', name: 'Cotton Products' }
];
const coreCategoryNames = Object.fromEntries(coreCategories.map(category => [category.id, category.name]));

function slugify(value) {
  return String(value || '').toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function text(value) {
  const result = String(value || '').trim();
  return result && !/^not provided$/i.test(result) ? result : '';
}

function cleanSpecification(value) {
  return text(value).replace(/^(fabric|gsm|thickness|layers|shape|colour|color|pattern|diameter|size|capacity|closure type|handle type|handle|stitching|printing|customization|minimum order quantity)\s*:\s*/i, '').trim();
}

function broadCategory(category, title = '') {
  const searchable = `${category} ${title}`;
  if (/vegetable|fruit|storage|shower|shoe|handbag|organizer|fridge|bamboo|mesh bag|matka|pot cover|copper pot/i.test(searchable)) {
    return 'household';
  }
  if (/tote|saree|carry bag|canvas|drawstring|rice bag|pouch|bedsheet|curtain|linen|fabric/i.test(searchable)) {
    return 'textile';
  }
  if (/chapati|roti|apron|papad|idli|oven|kitchen|food drying|kitchenware/i.test(searchable)) {
    return 'home-kitchen';
  }
  return 'cotton-products';
}

function parseMoq(value) {
  const match = String(value || '').match(/(\d[\d,]*)/);
  const quantity = match ? Number(match[1].replace(/,/g, '')) : 1;
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
}

function imageQuality(url) {
  if (!/^https?:\/\//i.test(url)) return -1;
  if (/125x125|150x150|200x200/i.test(url)) return 0;
  const dimensions = url.match(/(?:^|[^\d])(\d{3,4})x(\d{3,4})(?:[^\d]|$)/i);
  if (dimensions) return 3 + (Number(dimensions[1]) * Number(dimensions[2])) / 1_000_000;
  if (/\.(jpg|jpeg|png|webp)(\?|$)/i.test(url)) return 2;
  return 1;
}

function sameProductRows(left, right) {
  const withoutTimestamps = rows => rows.map(row => {
    const comparable = { ...row };
    delete comparable.created_at;
    delete comparable.updated_at;
    return comparable;
  });
  return JSON.stringify(withoutTimestamps(left)) === JSON.stringify(withoutTimestamps(right));
}

async function main() {
  const workbook = XLSX.readFile(workbookPath);
  const listings = XLSX.utils.sheet_to_json(workbook.Sheets['All Extracted Products'], { defval: '' });
  const websiteReady = XLSX.utils.sheet_to_json(workbook.Sheets['Website Ready Catalogue'], { defval: '' });
  const imageRows = XLSX.utils.sheet_to_json(workbook.Sheets['Image References'], { defval: '' });
  if (listings.length !== 80) throw new Error(`Expected 80 source listings; found ${listings.length}.`);

  const readyById = new Map(websiteReady.map(row => [row['Record ID'], row]));
  const imageUrlsById = new Map();
  for (const image of imageRows) {
    const ids = String(image['Matching Record IDs'] || '').split(/[;,]\s*/).filter(Boolean);
    for (const id of ids) {
      const current = imageUrlsById.get(id) || [];
      current.push(String(image['Image URL'] || ''));
      imageUrlsById.set(id, current);
    }
  }

  const products = listings.map(item => {
    const id = String(item['Record ID']).toLowerCase();
    const title = String(item['Original Product Title']).trim();
    const ready = readyById.get(item['Record ID']);
    const sourceCategory = String(item.Category || 'Uncategorized');
    const category = broadCategory(sourceCategory, title);
    const candidates = [...new Set(imageUrlsById.get(item['Record ID']) || [])]
      .map(url => ({ url, quality: imageQuality(url) }))
      .filter(image => image.quality >= 1)
      .sort((a, b) => b.quality - a.quality)
      .map(image => image.url)
      .slice(0, 5);
    if (!candidates.length) throw new Error(`No usable image URL found for ${item['Record ID']}.`);

    const specifications = {
      'Source Listing ID': item['Record ID'],
      'Source Product Page': item['Product Page URL'],
      'Source Category Page': item['Source Category Page'],
      'Source Availability': 'Needs confirmation',
      'Source Price Status': 'Admin-set temporary price',
      'Admin Price Note': 'Temporary catalogue-wide rates. Review and update in Admin before launch.',
      'Source Listed Price': text(item['Listed Price (as shown)']) || 'Not provided',
      'Source MOQ': text(item.MOQ) || 'Not provided',
      'Material / Fabric': cleanSpecification(item['Material / Fabric']) || 'Not provided',
      'GSM': cleanSpecification(item.GSM) || 'Not provided',
      'Thickness': text(item.Thickness) || 'Not provided',
      'Layers': cleanSpecification(item.Layers) || 'Not provided',
      'Shape': cleanSpecification(item.Shape) || 'Not provided',
      'Colour': cleanSpecification(item.Colour) || 'Not provided',
      'Pattern / Design': cleanSpecification(item['Pattern / Design']) || 'Not provided',
      'Dimensions / Size': text(item['Dimensions / Size']) || 'Not provided',
      'Capacity': text(item.Capacity) || 'Not provided',
      'Closure': cleanSpecification(item.Closure) || 'Not provided',
      'Handle': cleanSpecification(item.Handle) || 'Not provided',
      'Stitching': text(item.Stitching) || 'Not provided',
      'Printing / Customization': text(item['Printing / Customization']) || 'Not provided',
      'Source Product Code / SKU': text(item['Product Code / SKU']) || 'Not provided',
      'Production Capacity': text(item['Production Capacity']) || 'Not provided',
      'Delivery Time': text(item['Delivery Time']) || 'Not provided',
      'Packaging': text(item.Packaging) || 'Not provided',
      'Source Review Flags': text(item['Review Flags']) || 'None noted by extraction rules',
      'Source Listing Classification': text(item.Classification) || 'Needs confirmation'
    };
    const description = text(ready?.['Source Description / Applications (unverified source text)']);

    return {
      id: `source-${id}`,
      name: title,
      slug: `${slugify(title)}-${String(item['Record ID']).slice(-3)}`,
      sku: `SRC-${item['Record ID']}`,
      category,
      categoryName: coreCategoryNames[category],
      subcategory: sourceCategory,
      mrp: temporaryPricing.mrp,
      retailPrice: temporaryPricing.retailPrice,
      stock: 0,
      moq: parseMoq(item.MOQ),
      rating: 0,
      reviewCount: 0,
      isBestSeller: false,
      isDirectMillDeal: false,
      isTrending: false,
      hsnCode: '',
      gstRate: 0,
      shortDescription: description.slice(0, 500) || `${category}. Contact us to confirm current availability and pricing.`,
      description: description || `${category}. Contact us to confirm current availability and pricing.`,
      images: candidates,
      tags: [...new Set([category, title, 'Source catalogue', 'Availability needs confirmation'])],
      specifications,
      wholesaleTiers: temporaryPricing.wholesaleTiers,
      variants: []
    };
  });

  const invalidProducts = products.filter(product =>
    !product.id || !product.name || !product.sku || !product.images.length ||
    product.description.length > 60000 || product.retailPrice <= 0 || product.moq <= 0
  );
  if (invalidProducts.length) {
    throw new Error(`Source validation failed for ${invalidProducts.length} product records.`);
  }
  const collectionsById = new Map(coreCategories.map(category => [category.id, {
    id: `core-${category.id}`,
    name: category.name,
    slug: category.id,
    parentCategoryId: category.id,
    image: '',
    products: []
  }]));
  for (const product of products) {
    const collection = collectionsById.get(product.category);
    if (!collection) throw new Error(`Product "${product.id}" has an unsupported category.`);
    if (!collection.image) collection.image = product.images[0];
    collection.products.push(product.id);
  }
  const collections = [...collectionsById.values()];
  if (new Set(collections.map(collection => collection.id)).size !== collections.length ||
      new Set(collections.map(collection => collection.slug)).size !== collections.length) {
    throw new Error('Source collection names do not produce unique collection IDs and slugs.');
  }
  if (process.env.DRY_RUN === 'true') {
    console.log(JSON.stringify({
      mode: 'dry-run; database unchanged',
      listings: products.length,
      collections: collections.length,
      productCollectionLinks: products.length,
      uniqueIds: new Set(products.map(product => product.id)).size,
      uniqueSkus: new Set(products.map(product => product.sku)).size,
      uniqueSlugs: new Set(products.map(product => product.slug)).size,
      productRecordsWithImages: products.filter(product => product.images.length > 0).length,
      productsMarkedUnavailable: products.filter(product => product.stock === 0).length,
      temporaryRetailPrice: temporaryPricing.retailPrice,
      temporaryMrp: temporaryPricing.mrp,
      temporaryWholesaleTiers: temporaryPricing.wholesaleTiers.length,
      categories: coreCategories.length,
      productsPerCoreCategory: Object.fromEntries(
        coreCategories.map(category => [
          category.id,
          products.filter(product => product.category === category.id).length
        ])
      ),
      sourceCategoriesPerCoreCategory: Object.fromEntries(
        coreCategories.map(category => [
          category.id,
          [...new Set(products
            .filter(product => product.category === category.id)
            .map(product => product.subcategory))]
        ])
      ),
      productsWithVerifiedVariantChoices: products.filter(product => product.variants.length > 0).length,
      archiveWillBeCreatedBeforeReplacingExistingRows: archiveTable
    }, null, 2));
    return;
  }

  const url = process.env.DATABASE_URL || process.env.MYSQL_URL;
  const pool = mysql.createPool(url ? {
    uri: url,
    connectionLimit: 2,
    connectTimeout: 3000,
    ssl: process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : undefined
  } : {
    host: process.env.MYSQL_HOST || process.env.DB_HOST,
    port: Number(process.env.MYSQL_PORT || process.env.DB_PORT || 3306),
    user: process.env.MYSQL_USER || process.env.DB_USER,
    password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD,
    database: process.env.MYSQL_DATABASE || process.env.DB_NAME || 'mahalaxmi_db',
    connectionLimit: 2,
    connectTimeout: 3000,
    ssl: process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : undefined
  });

  const collectionArchiveTable = 'collections_backup_catalogue_cleanup_20261022';
  const linkArchiveTable = 'product_collections_backup_catalogue_cleanup_20261022';
  let connection;
  let transactionOpen = false;
  try {
    connection = await pool.getConnection();
    await connection.query(`
      CREATE TABLE IF NOT EXISTS collections (
        id VARCHAR(64) NOT NULL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) NOT NULL UNIQUE,
        parent_category_id VARCHAR(50) NOT NULL,
        description TEXT,
        image VARCHAR(255),
        display_order INT NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_collections_parent (parent_category_id),
        CONSTRAINT fk_collection_parent_category FOREIGN KEY (parent_category_id)
          REFERENCES categories (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS product_collections (
        product_id VARCHAR(50) NOT NULL,
        collection_id VARCHAR(64) NOT NULL,
        PRIMARY KEY (product_id, collection_id),
        INDEX idx_product_collections_collection (collection_id),
        CONSTRAINT fk_product_collection_product FOREIGN KEY (product_id)
          REFERENCES products (id) ON DELETE CASCADE,
        CONSTRAINT fk_product_collection_collection FOREIGN KEY (collection_id)
          REFERENCES collections (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    const [current] = await connection.query(
      "SELECT * FROM products WHERE id LIKE 'source-mle-%' ORDER BY id"
    );
    const [backups] = await pool.query(
      'SELECT COUNT(*) AS count FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
      [archiveTable]
    );
    const archiveExists = Number(backups[0].count) > 0;
    if (!archiveExists) {
      await connection.query(`CREATE TABLE \`${archiveTable}\` LIKE products`);
      await connection.query(`INSERT INTO \`${archiveTable}\` SELECT * FROM products WHERE id LIKE 'source-mle-%'`);
    }
    const [archivedRows] = await connection.query(`SELECT * FROM \`${archiveTable}\` ORDER BY id`);
    if (archivedRows.length !== current.length || !sameProductRows(archivedRows, current)) {
      throw new Error('The existing product archive does not exactly match the live products; refusing to continue.');
    }

    for (const [table, backupTable] of [
      ['collections', collectionArchiveTable],
      ['product_collections', linkArchiveTable]
    ]) {
      const [tableExists] = await connection.query(
        'SELECT COUNT(*) AS count FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
        [backupTable]
      );
      if (Number(tableExists[0].count) === 0) {
        await connection.query(`CREATE TABLE \`${backupTable}\` LIKE \`${table}\``);
        await connection.query(`INSERT INTO \`${backupTable}\` SELECT * FROM \`${table}\``);
      }
    }

    const [retainedProducts] = await connection.query(
      "SELECT id, category_id FROM products WHERE id NOT LIKE 'source-mle-%'"
    );
    const supportedCategoryIds = new Set(coreCategories.map(category => category.id));
    const unsupportedProducts = retainedProducts.filter(product => !supportedCategoryIds.has(product.category_id));
    if (unsupportedProducts.length) {
      throw new Error(`${unsupportedProducts.length} existing products have unsupported categories; refusing to reassign them.`);
    }

    await connection.beginTransaction();
    transactionOpen = true;
    await connection.query('DELETE FROM product_collections');
    await connection.query('DELETE FROM collections');
    await connection.query("DELETE FROM products WHERE id LIKE 'source-mle-%'");
    const insertCollection = `INSERT INTO collections (
      id, name, slug, parent_category_id, description, image, display_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    for (const [index, collection] of collections.entries()) {
      await connection.query(insertCollection, [
        collection.id,
        collection.name,
        collection.slug,
        collection.parentCategoryId,
        `Products source-listed under ${collection.name}. Confirm current specifications, availability and pricing before ordering.`,
        collection.image,
        index + 1
      ]);
    }
    const insert = `INSERT INTO products (
      id, name, slug, sku, category_id, category_name, subcategory,
      mrp, retail_price, stock, moq, rating, review_count,
      is_bestseller, is_direct_mill_deal, is_trending, hsn_code, gst_rate,
      short_description, description, images, tags, specifications, wholesale_tiers, variants
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    for (const product of products) {
      await connection.query(insert, [
        product.id, product.name, product.slug, product.sku, product.category, product.categoryName, product.subcategory,
        product.mrp, product.retailPrice, product.stock, product.moq, product.rating, product.reviewCount,
        0, 0, 0, product.hsnCode, product.gstRate, product.shortDescription, product.description,
        JSON.stringify(product.images), JSON.stringify(product.tags), JSON.stringify(product.specifications),
        JSON.stringify(product.wholesaleTiers), JSON.stringify(product.variants)
      ]);
    }
    const [allProducts] = await connection.query('SELECT id, category_id FROM products ORDER BY id');
    const collectionIdByCategory = new Map(collections.map(collection => [collection.parentCategoryId, collection.id]));
    const categoryNameById = new Map(coreCategories.map(category => [category.id, category.name]));
    for (const product of allProducts) {
      const collectionId = collectionIdByCategory.get(product.category_id);
      const categoryName = categoryNameById.get(product.category_id);
      if (!collectionId || !categoryName) {
        throw new Error(`Product "${product.id}" has no matching core collection; rolling back catalogue replacement.`);
      }
      await connection.query(
        'INSERT INTO product_collections (product_id, collection_id) VALUES (?, ?)',
        [product.id, collectionId]
      );
      await connection.query(
        'UPDATE products SET category_name = ? WHERE id = ?',
        [categoryName, product.id]
      );
    }
    const [imported] = await connection.query(
      `SELECT COUNT(*) AS count, COUNT(DISTINCT p.id) AS distinct_count,
        COUNT(DISTINCT pc.collection_id) AS collection_count,
        COUNT(pc.product_id) AS collection_link_count
       FROM products p
       LEFT JOIN product_collections pc ON pc.product_id = p.id`
    );
    const [storedCollections] = await connection.query(
      'SELECT COUNT(*) AS count FROM collections'
    );
    if (Number(imported[0].count) !== allProducts.length ||
        Number(imported[0].distinct_count) !== allProducts.length ||
        Number(imported[0].collection_count) !== coreCategories.length ||
        Number(imported[0].collection_link_count) !== allProducts.length ||
        Number(storedCollections[0].count) !== coreCategories.length) {
      throw new Error('Post-import product or collection verification failed; rolling back catalogue replacement.');
    }
    await connection.commit();
    transactionOpen = false;

    console.log(JSON.stringify({
      importedListings: products.length,
      importedCollections: collections.length,
      productCollectionLinks: Number(imported[0].collection_link_count),
      allProductsLinkedToCoreCollections: true,
      productsOutsideSourceCataloguePreserved: true,
      archivedPreviousProductRows: archivedRows.length,
      archiveTable,
      collectionArchiveTable,
      linkArchiveTable,
      uniqueProductIds: Number(imported[0].distinct_count),
      unavailableStockMarkedZero: products.every(product => product.stock === 0),
      temporaryPricesMarked: products.every(product => product.specifications['Source Price Status'] === 'Admin-set temporary price'),
      sourceCategories: new Set(products.map(product => product.categoryName)).size,
      productsWithImages: products.filter(product => product.images.length > 0).length,
      variantGroupsWithMultipleListings: [...variantGroups.values()].filter(group => group.length > 1).length
    }, null, 2));
  } catch (error) {
    if (transactionOpen) await connection.rollback();
    console.error(`Catalogue import failed: ${error.message}`);
    console.error('Live product replacement was rolled back if it had started.');
    throw error;
  } finally {
    if (connection) connection.release();
    await pool.end();
  }
}

main().catch(error => {
  console.error(`Catalogue import did not complete: ${error.message}`);
  process.exitCode = 1;
});
