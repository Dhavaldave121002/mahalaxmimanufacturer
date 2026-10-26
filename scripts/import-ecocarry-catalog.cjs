const mysql = require('mysql2/promise');
require('dotenv').config();

const SOURCE = 'https://ecocarry.co';
const PAGE_SIZE = 250;
const REQUEST_DELAY_MS = 1000;
const RESERVED_STOCK = 10000;
const CATEGORIES = {
  textile: 'Textile',
  household: 'Household',
  'home-kitchen': 'Home and Kitchen',
  'cotton-products': 'Cotton Products'
};
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'bag', 'bags', 'cotton', 'cover', 'covers', 'for', 'of',
  'the', 'with', 'reusable', 'printed', 'print', 'pouch', 'pouches'
]);
const KNOWN_BRANDS_PATTERN = /\b(?:barbie|labubu|moana|lilo|stitch|shinchan|shinchain|hello\s+kitty|sanrio|marvel|disney|pokemon|mickey|spider-?man|snoopy|paw\s+patrol)\b/i;

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

function defaultWholesaleTiers(retailPrice) {
  return [
    { minQty: 1, maxQty: 9, pricePerUnit: retailPrice, savingsPercent: 0, label: 'Standard Rate' },
    { minQty: 10, maxQty: 49, pricePerUnit: Math.round(retailPrice * 0.9), savingsPercent: 10, label: 'Wholesale Tier 1' },
    { minQty: 50, pricePerUnit: Math.round(retailPrice * 0.8), savingsPercent: 20, label: 'Wholesale Tier 2' }
  ];
}

function normalize(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function slugify(value) {
  return normalize(value).replace(/\s+/g, '-');
}

function tokens(value) {
  return new Set(normalize(value).split(' ').filter(token =>
    token.length > 2 && !STOP_WORDS.has(token)
  ));
}

function similarity(left, right) {
  const a = tokens(left);
  const b = tokens(right);
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  for (const token of a) if (b.has(token)) intersection++;
  return intersection / new Set([...a, ...b]).size;
}

function titleCase(value) {
  return String(value || '')
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}

function productSignals(product) {
  return [
    product.title,
    product.product_type,
    ...(Array.isArray(product.tags) ? product.tags : []),
    ...(Array.isArray(product.options) ? product.options.map(option => option.name) : []),
    ...(Array.isArray(product.variants) ? product.variants.flatMap(variant => [
      variant.title,
      variant.option1,
      variant.option2,
      variant.option3
    ]) : [])
  ].filter(Boolean).join(' ');
}

function inferSubcategory(product) {
  const explicitType = String(product.product_type || '').trim();
  if (explicitType && !/^customize?$/i.test(explicitType)) return titleCase(explicitType);

  const searchable = normalize([
    product.title,
    ...(Array.isArray(product.tags) ? product.tags : [])
  ].join(' '));
  const rules = [
    [/\b(tote|carry bag)\b/, 'Tote Bags'],
    [/\bdrawstring\b/, 'Drawstring Bags'],
    [/\bsaree cover\b/, 'Saree Covers'],
    [/\bpaper bag\b/, 'Paper Bags'],
    [/\b(lunch|cooler|insulated) bag\b/, 'Lunch Bags'],
    [/\bkids? bag\b/, 'Kids Bags'],
    [/\bhand ?bags?\b/, 'Hand Bags'],
    [/\bpouches?\b/, 'Cotton Pouches'],
    [/\bhamper\b/, 'Hamper Bags']
  ];
  return rules.find(([pattern]) => pattern.test(searchable))?.[1] || '';
}

function canonicalSubcategory(value) {
  const key = normalize(value);
  const aliases = {
    'drawstring bag': 'Drawstring Bags',
    'drawstring bags': 'Drawstring Bags',
    'hamper bag': 'Hamper Bags',
    'hamper bags': 'Hamper Bags',
    'paper bag': 'Paper Bags',
    'paper bags': 'Paper Bags',
    'lunch bag': 'Lunch Bags',
    'lunch bags': 'Lunch Bags',
    'hand bag': 'Hand Bags',
    'hand bags': 'Hand Bags',
    'kids bag': 'Kids Bags',
    'kids bags': 'Kids Bags',
    'tote bag': 'Tote Bags',
    'tote bags': 'Tote Bags',
    'saree cover': 'Cotton Saree Cover',
    'saree covers': 'Cotton Saree Cover',
    'office bag': 'Office Bags',
    'office bags': 'Office Bags'
  };
  return aliases[key] || titleCase(value);
}

function parentCategory(product, subcategory) {
  const value = normalize(`${subcategory} ${product.title}`);
  if (/\b(paper|lunch|cooler|insulated|organizer|storage|hamper|packaging)\b/.test(value)) {
    return 'household';
  }
  if (/\b(apron|kitchen|tiffin)\b/.test(value)) return 'home-kitchen';
  return 'textile';
}

function extractFacts(product) {
  const searchable = String(product.title || '');
  const normalizedTitle = normalize(searchable);
  const facts = {};
  const size = searchable.match(/\b\d{1,3}(?:\.\d+)?\s*[x×]\s*\d{1,3}(?:\.\d+)?(?:\s*[x×]\s*\d{1,3}(?:\.\d+)?)?\s*(?:inches?|inch|cm|mm)?\b/i);
  const gsm = searchable.match(/\b\d{2,4}\s*gsm\b/i);
  const materials = ['cotton', 'canvas', 'paper', 'polyester', 'non woven'];
  const material = materials.find(value => new RegExp(`\\b${value.replace(' ', '\\s+')}\\b`, 'i').test(normalizedTitle));
  if (material) facts.Material = titleCase(material);
  if (size) facts['Size (source title)'] = size[0].trim();
  if (gsm) facts['Fabric weight (source title)'] = gsm[0].replace(/\s+/g, ' ').toUpperCase();
  facts['Product type'] = titleCase(product.product_type || inferSubcategory(product));
  facts['Source Price Status'] = 'Approximate - verify before sale';
  facts['Source Availability'] = 'Needs confirmation';
  facts['Source Image Status'] = 'Awaiting approved image';
  return facts;
}

function parseProduct(product, categoryNames) {
  const name = String(product.title || '').replace(/\s+/g, ' ').trim();
  if (!name || name.length > 255) return { skip: 'invalid-title' };

  const inferredSubcategory = inferSubcategory(product);
  if (!inferredSubcategory) return { skip: 'unclassified' };
  const subcategory = canonicalSubcategory(inferredSubcategory);
  const category = parentCategory(product, subcategory);
  const prices = (Array.isArray(product.variants) ? product.variants : [])
    .map(variant => Number(variant.price))
    .filter(price => Number.isFinite(price) && price > 0);
  if (!prices.length) return { skip: 'missing-price' };

  const retailPrice = Math.min(...prices);
  const comparePrices = (product.variants || [])
    .map(variant => Number(variant.compare_at_price))
    .filter(price => Number.isFinite(price) && price > retailPrice);
  const mrp = comparePrices.length ? Math.max(...comparePrices) : retailPrice;

  return {
    id: `catalog-external-${product.id}`,
    name,
    slug: `catalog-${slugify(name)}-${String(product.id).slice(-8)}`.slice(0, 255),
    sku: `MLE-EXT-${String(product.id)}`.slice(0, 50),
    category,
    categoryName: categoryNames.get(category),
    subcategory,
    retailPrice,
    mrp,
    stock: RESERVED_STOCK,
    moq: 1,
    hsnCode: '',
    gstRate: 5,
    shortDescription: `${subcategory}${extractFacts(product).Material ? ` made from ${extractFacts(product).Material.toLowerCase()}` : ''}. Product image pending an approved asset.`,
    description: [
      `${name}.`,
      `Product category: ${subcategory}.`,
      'This listing contains verified catalog facts only. Product specifications and availability should be confirmed before ordering.',
      'Product image is not included.'
    ].join(' '),
    images: [],
    tags: [slugify(subcategory), slugify(categoryNames.get(category))],
    specifications: extractFacts(product),
    careInstructions: [],
    b2bPolicy: [],
    wholesaleTiers: defaultWholesaleTiers(retailPrice),
    variants: []
  };
}

async function fetchCatalog() {
  const products = [];
  for (let page = 1; ; page++) {
    const url = new URL('/products.json', SOURCE);
    url.searchParams.set('limit', String(PAGE_SIZE));
    url.searchParams.set('page', String(page));
    const response = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'MahalaxmiCatalogImporter/1.0' }
    });
    if (!response.ok) throw new Error(`Source product feed returned HTTP ${response.status} on page ${page}.`);
    const payload = await response.json();
    if (!Array.isArray(payload.products)) throw new Error(`Source product feed page ${page} is invalid.`);
    products.push(...payload.products);
    if (payload.products.length < PAGE_SIZE) break;
    await delay(REQUEST_DELAY_MS);
  }
  return products;
}

function makePool() {
  const url = process.env.DATABASE_URL || process.env.MYSQL_URL;
  if (url) return mysql.createPool(url);

  const options = {
    host: process.env.MYSQL_HOST || process.env.DB_HOST,
    port: Number(process.env.MYSQL_PORT || process.env.DB_PORT || 3306),
    user: process.env.MYSQL_USER || process.env.DB_USER,
    password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD,
    database: process.env.MYSQL_DATABASE || process.env.DB_NAME || 'mahalaxmi_db'
  };
  if (!options.host || !options.user) {
    throw new Error('MySQL is not configured. Set the database environment variables before importing.');
  }
  return mysql.createPool({
    ...options,
    connectionLimit: 2,
    connectTimeout: 5000,
    ssl: process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : undefined
  });
}

async function main() {
  const apply = process.argv.includes('--apply');
  if (process.argv.some(argument => argument.startsWith('--') && argument !== '--apply')) {
    throw new Error('Only the optional --apply flag is supported.');
  }

  const feedProducts = await fetchCatalog();
  const feedIds = new Set();
  const duplicateFeedIds = feedProducts.filter(product => {
    const id = String(product.id);
    if (feedIds.has(id)) return true;
    feedIds.add(id);
    return false;
  });
  if (duplicateFeedIds.length) throw new Error('Source feed contains duplicate product IDs; import stopped.');

  const pool = makePool();
  let connection;
  let transactionOpen = false;
  try {
    connection = await pool.getConnection();
    const [tableRows] = await connection.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME IN ('products', 'categories', 'collections', 'product_collections')`
    );
    const tables = new Set(tableRows.map(row => row.TABLE_NAME));
    for (const table of ['products', 'categories', 'collections', 'product_collections']) {
      if (!tables.has(table)) throw new Error(`Required database table "${table}" is unavailable.`);
    }

    const [categoryRows] = await connection.query('SELECT id, name FROM categories');
    const categoryNames = new Map(categoryRows.map(row => [row.id, row.name]));
    for (const categoryId of Object.keys(CATEGORIES)) {
      if (!categoryNames.has(categoryId)) throw new Error(`Required category "${categoryId}" is missing.`);
    }
    const [collectionRows] = await connection.query(
      'SELECT id, name, slug, parent_category_id, display_order FROM collections'
    );
    const [existingRows] = await connection.query(
      'SELECT id, name, sku, category_id, subcategory FROM products'
    );
    const collectionsByName = new Map(collectionRows.map(row => [normalize(row.name), row]));
    const existingIds = new Set(existingRows.map(row => row.id));
    const existingSkus = new Set(existingRows.map(row => row.sku));
    const exactNames = new Map(existingRows.map(row => [normalize(row.name), row]));
    const candidates = [];
    const possibleMatches = [];
    const skipped = {
      juteOrJuco: 0,
      brandedOrLogoOrCustom: 0,
      unclassified: 0,
      missingPrice: 0,
      exactDuplicates: 0
    };
    const newCollectionNames = new Map();

    for (const sourceProduct of feedProducts) {
      const signals = productSignals(sourceProduct);
      if (/\b(jute|juco)\b/i.test(signals)) {
        skipped.juteOrJuco++;
        continue;
      }
      if (/\b(?:logo|branded|brand\s+name|personalized|personalised|custom(?:ized|ised)?|monogram|ecocarry)\b/i.test(signals)) {
        skipped.brandedOrLogoOrCustom++;
        continue;
      }
      if (KNOWN_BRANDS_PATTERN.test(signals) || /\bwith\s+name\b/i.test(signals)) {
        skipped.brandedOrLogoOrCustom++;
        continue;
      }

      const parsed = parseProduct(sourceProduct, categoryNames);
      if (parsed.skip) {
        skipped[parsed.skip === 'missing-price' ? 'missingPrice' : 'unclassified']++;
        continue;
      }
      if (exactNames.has(normalize(parsed.name)) || existingIds.has(parsed.id) || existingSkus.has(parsed.sku)) {
        skipped.exactDuplicates++;
        continue;
      }

      const match = existingRows
        .map(existing => ({ existing, score: similarity(parsed.name, existing.name) }))
        .sort((a, b) => b.score - a.score)[0];
      if (match && match.score >= 0.72) {
        possibleMatches.push({ sourceId: sourceProduct.id, name: parsed.name, existingId: match.existing.id, existingName: match.existing.name, similarity: Number(match.score.toFixed(2)) });
        continue;
      }

      let collection = collectionsByName.get(normalize(parsed.subcategory));
      if (!collection) {
        const aliases = {
          'tote bags': 'Tote Bags',
          'cotton tote bag': 'Cotton Tote Bag',
          'canvas tote bag': 'Canvas Tote Bag',
          'saree covers': 'Cotton Saree Cover',
          'saree cover': 'Cotton Saree Cover',
          'hand bags': 'Hand Bags',
          'hand bag': 'Hand Bags',
          'kids bags': 'Kids Bags',
          'kids bag': 'Kids Bags',
          'paper bags': 'Paper Bags',
          'paper bag': 'Paper Bags',
          'drawstring bags': 'Drawstring Bags',
          'drawstring bag': 'Drawstring Bags',
          'cotton pouches': 'Cotton Pouch',
          'pouches': 'Cotton Pouch',
          'lunch bags': 'Lunch Bags',
          'lunch bag': 'Lunch Bags',
          'hamper bags': 'Hamper Bags',
          'hamper bag': 'Hamper Bags',
          'office bags': 'Office Bags',
          'cooler bags': 'Insulated Cooler Bag',
          'kids tote bags': 'Kids Tote Bags',
          'cotton canvas tote bag': 'Canvas Tote Bag'
        };
        const alias = aliases[normalize(parsed.subcategory)];
        if (alias) collection = collectionsByName.get(normalize(alias));
      }

      if (!collection) {
        const slug = slugify(parsed.subcategory);
        collection = {
          id: `catalog-external-collection-${slug}`.slice(0, 64),
          name: parsed.subcategory,
          slug: slug.slice(0, 100),
          parent_category_id: parsed.category,
          display_order: collectionRows.length + newCollectionNames.size + 1
        };
        newCollectionNames.set(normalize(parsed.subcategory), collection);
      }

      candidates.push({ sourceId: String(sourceProduct.id), product: parsed, collection });
    }

    const summary = {
      mode: apply ? 'apply' : 'dry-run',
      existingDatabase: process.env.MYSQL_DATABASE || process.env.DB_NAME || 'configured MySQL database',
      sourceFeedProducts: feedProducts.length,
      juteAndJucoExcluded: skipped.juteOrJuco,
      brandedLogoCustomOrSourceNamedExcluded: skipped.brandedOrLogoOrCustom,
      unclassifiedOrMissingPriceSkipped: skipped.unclassified + skipped.missingPrice,
      exactDuplicatesSkipped: skipped.exactDuplicates,
      possibleDuplicatesFlagged: possibleMatches.length,
      productsReady: candidates.length,
      existingCollectionsUsed: [...new Set(candidates.filter(item => !newCollectionNames.has(normalize(item.collection.name))).map(item => item.collection.name))].length,
      existingCollectionNames: collectionRows.map(collection => collection.name),
      collectionsToCreate: [...newCollectionNames.values()].map(collection => collection.name),
      productImagesImported: 0,
      reservedStockPerNewProduct: RESERVED_STOCK,
      plannedProductNames: candidates.map(item => item.product.name),
      review: possibleMatches.slice(0, 25)
    };
    console.log(JSON.stringify(summary, null, 2));
    if (!apply) return;
    if (possibleMatches.length) {
      console.warn(`Review ${possibleMatches.length} possible title matches before treating the import as complete; these were skipped.`);
    }
    if (!candidates.length) return;

    await connection.beginTransaction();
    transactionOpen = true;
    for (const collection of newCollectionNames.values()) {
      await connection.query(
        `INSERT INTO collections (id, name, slug, parent_category_id, description, image, display_order)
         VALUES (?, ?, ?, ?, ?, '', ?)`,
        [collection.id, collection.name, collection.slug, collection.parent_category_id,
          `Browse ${collection.name.toLowerCase()} in this collection. Product image is pending an approved asset.`,
          collection.display_order]
      );
    }

    const insertProduct = `INSERT INTO products (
      id, name, slug, sku, category_id, category_name, subcategory,
      mrp, retail_price, stock, moq, rating, review_count,
      is_bestseller, is_direct_mill_deal, is_trending, hsn_code, gst_rate,
      short_description, description, images, tags, specifications,
      care_instructions, b2b_policy, wholesale_tiers, variants
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 0, '', 5, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const insertLink = 'INSERT IGNORE INTO product_collections (product_id, collection_id) VALUES (?, ?)';
    for (const item of candidates) {
      const p = item.product;
      await connection.query(insertProduct, [
        p.id, p.name, p.slug, p.sku, p.category, p.categoryName, p.subcategory,
        p.mrp, p.retailPrice, p.stock, p.moq, p.shortDescription, p.description,
        JSON.stringify(p.images), JSON.stringify(p.tags), JSON.stringify(p.specifications),
        JSON.stringify(p.careInstructions), JSON.stringify(p.b2bPolicy),
        JSON.stringify(p.wholesaleTiers), JSON.stringify(p.variants)
      ]);
      await connection.query(insertLink, [p.id, item.collection.id]);
    }
    const [verification] = await connection.query(
      `SELECT COUNT(*) AS products,
              SUM(JSON_LENGTH(images) = 0) AS without_images,
              SUM(LOWER(CONCAT(name, ' ', description, ' ', short_description, ' ', CAST(tags AS CHAR), ' ', CAST(specifications AS CHAR))) REGEXP 'ecocarry|jute|juco|logo|branded|monogram|personalized|personalised') AS blocked_text
       FROM products WHERE id LIKE 'catalog-external-%'`
    );
    const imported = Number(verification[0].products);
    const noImages = Number(verification[0].without_images);
    const blockedText = Number(verification[0].blocked_text);
    if (imported < candidates.length || noImages !== imported || blockedText > 0) {
      throw new Error(`Post-import verification failed (products=${imported}, image-less=${noImages}, blocked-text=${blockedText}).`);
    }
    await connection.commit();
    transactionOpen = false;
    console.log(JSON.stringify({
      applied: true,
      newProductsVerified: imported,
      allImagesOmitted: noImages === imported,
      blockedListingTextFound: blockedText
    }, null, 2));
  } catch (error) {
    if (transactionOpen && connection) await connection.rollback();
    throw error;
  } finally {
    if (connection) connection.release();
    await pool.end();
  }
}

main().catch(error => {
  console.error(`EcoCarry catalog import failed: ${error.message}`);
  process.exitCode = 1;
});
