const mysql = require('mysql2/promise');
const fs = require('node:fs/promises');
const path = require('node:path');
require('dotenv').config();

const SOURCE_ORIGIN = 'https://wrapzy.in';
const SOURCE_COLLECTION_HANDLES = [
  'apron-dress',
  'muslin-idli-cloth',
  'organizer-bag',
  'roti-cover',
  'saree-cover',
  'shoe-bag',
  'shower-cap',
  'tiffin-cover',
  'tote-bag',
  'vegetable-bags'
];

const NEW_COLLECTIONS = [
  {
    name: 'Kitchen Aprons',
    slug: 'kitchen-aprons',
    parentCategoryId: 'home-kitchen',
    aliases: ['Cotton Kitchen Apron']
  },
  {
    name: 'Organizer Bags',
    slug: 'organizer-bags',
    parentCategoryId: 'household',
    aliases: ['Non Woven Handbag Organizer Bag']
  },
  {
    name: 'Shoe Bags',
    slug: 'shoe-bags',
    parentCategoryId: 'household',
    aliases: ['Non Woven Shoe Bag']
  },
  {
    name: 'Tiffin Covers',
    slug: 'tiffin-covers',
    parentCategoryId: 'home-kitchen',
    aliases: []
  },
  {
    name: 'Tote Bags',
    slug: 'tote-bags',
    parentCategoryId: 'textile',
    aliases: ['Cotton Tote Bag', 'Canvas Tote Bag', 'Cotton Carry Bags']
  },
  {
    name: 'Vegetable Bags',
    slug: 'vegetable-bags',
    parentCategoryId: 'household',
    aliases: ['Vegetable Mesh Bag']
  },
  {
    name: 'Fruit Baskets',
    slug: 'fruit-baskets',
    parentCategoryId: 'household',
    aliases: []
  },
  {
    name: 'Bundles & Sets',
    slug: 'bundles-and-sets',
    parentCategoryId: 'home-kitchen',
    aliases: []
  }
];

const COLLECTION_TARGETS = {
  'apron-dress': 'Kitchen Aprons',
  'muslin-idli-cloth': 'Cotton Idli Cloth',
  'organizer-bag': 'Organizer Bags',
  'roti-cover': 'Cotton Chapati Cover',
  'saree-cover': 'Cotton Saree Cover',
  'shoe-bag': 'Shoe Bags',
  'shower-cap': 'PVC Shower Cap',
  'tiffin-cover': 'Tiffin Covers',
  'tote-bag': 'Tote Bags',
  'vegetable-bags': 'Vegetable Bags'
};

const TYPE_TARGETS = {
  combo: 'Bundles & Sets',
  'kitchen accessories': 'Kitchen Accessories',
  'fruit basket': 'Fruit Baskets',
  'matka cover': 'Cotton Matka Cover',
  'drying cloth': 'Multipurpose Food Drying Net Cloth'
};

const BROAD_COLLECTION_MATCHERS = {
  'Kitchen Aprons': /\bapron\b/i,
  'Organizer Bags': /organizer/i,
  'Shoe Bags': /shoe\s*bags?/i,
  'Tote Bags': /\b(tote|carry\s*bags?)\b/i,
  'Vegetable Bags': /vegetable/i
};

function slugify(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function cleanText(value) {
  return String(value || '')
    .replace(/\bwrapzy(?:['’]s)?\b/gi, '')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/[|–—-]\s*(?=$|\n)/g, '')
    .replace(/:\s*(?=$|\n)/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function htmlToText(value) {
  return cleanText(String(value || '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
  );
}

function normalizeTitle(value) {
  return slugify(cleanText(value));
}

function normalizeCollectionName(value) {
  return slugify(value).replace(/-/g, '');
}

function extractJson(value) {
  if (value == null) return value;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function sanitizeTree(value) {
  if (typeof value === 'string') return cleanText(value);
  if (Array.isArray(value)) return value.map(sanitizeTree);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [cleanText(key), sanitizeTree(item)]));
  }
  return value;
}

function containsBrand(value) {
  if (typeof value === 'string') return /\bwrapzy\b/i.test(value);
  if (Array.isArray(value)) return value.some(containsBrand);
  if (value && typeof value === 'object') return Object.values(value).some(containsBrand);
  return false;
}

function tokensForMatching(value) {
  const stopWords = new Set([
    'a', 'an', 'and', 'bag', 'bags', 'cover', 'covers', 'cotton', 'for',
    'of', 'the', 'with', 'wrapzy', 'printed', 'print', 'reusable'
  ]);
  return new Set(
    normalizeTitle(value)
      .split('-')
      .filter(token => token.length > 2 && !stopWords.has(token))
  );
}

function tokenSimilarity(left, right) {
  const a = tokensForMatching(left);
  const b = tokensForMatching(right);
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  for (const token of a) if (b.has(token)) intersection += 1;
  return intersection / new Set([...a, ...b]).size;
}

function makePool() {
  const url = process.env.DATABASE_URL || process.env.MYSQL_URL;
  const options = url
    ? { uri: url }
    : {
        host: process.env.MYSQL_HOST || process.env.DB_HOST,
        port: Number(process.env.MYSQL_PORT || process.env.DB_PORT || 3306),
        user: process.env.MYSQL_USER || process.env.DB_USER,
        password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD,
        database: process.env.MYSQL_DATABASE || process.env.DB_NAME || 'mahalaxmi_db'
      };

  if (!url && (!options.host || !options.user)) {
    throw new Error('MySQL is not configured. Set the database environment variables before importing.');
  }

  return mysql.createPool({
    ...options,
    connectionLimit: 2,
    connectTimeout: 3000,
    ssl: process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : undefined
  });
}

async function getJson(url) {
  const parsed = new URL(url);
  if (parsed.origin !== SOURCE_ORIGIN) throw new Error('Refusing to fetch a URL outside the authorized source site.');
  const response = await fetch(parsed, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    const retryAfter = response.headers.get('retry-after');
    throw new Error(`Source request failed with HTTP ${response.status}${retryAfter ? ` (Retry-After: ${retryAfter})` : ''}: ${parsed.pathname}`);
  }
  return response.json();
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

function defaultWholesaleTiers(retailPrice) {
  return [
    { minQty: 1, maxQty: 9, pricePerUnit: retailPrice, savingsPercent: 0, label: 'Standard Rate' },
    { minQty: 10, maxQty: 49, pricePerUnit: Math.round(retailPrice * 0.9), savingsPercent: 10, label: 'Wholesale Tier 1' },
    { minQty: 50, pricePerUnit: Math.round(retailPrice * 0.8), savingsPercent: 20, label: 'Wholesale Tier 2' }
  ];
}

async function fetchSourceData() {
  const catalog = await getJson(`${SOURCE_ORIGIN}/products.json?limit=250`);
  if (!Array.isArray(catalog.products) || catalog.products.length >= 250) {
    throw new Error('The product feed is missing or reached its pagination limit; refusing an incomplete import.');
  }

  const sourceCollections = await getJson(`${SOURCE_ORIGIN}/collections.json?limit=250`);
  const availableHandles = new Set((sourceCollections.collections || []).map(item => item.handle));
  for (const handle of SOURCE_COLLECTION_HANDLES) {
    if (!availableHandles.has(handle)) throw new Error(`Required source collection "${handle}" is missing.`);
  }

  const collectionMembership = {};
  for (const [index, handle] of SOURCE_COLLECTION_HANDLES.entries()) {
    if (index > 0) await delay(1800);
    const result = await getJson(
      `${SOURCE_ORIGIN}/collections/${encodeURIComponent(handle)}/products.json?limit=250&fields=id`
    );
    if (!Array.isArray(result.products)) {
      throw new Error(`Collection membership for "${handle}" is unavailable.`);
    }
    collectionMembership[handle] = result.products.map(product => String(product.id));
  }
  return { products: catalog.products, collectionMembership };
}

async function readInputFile(filePath) {
  const content = (await fs.readFile(path.resolve(filePath), 'utf8')).replace(/^\uFEFF/, '');
  const data = JSON.parse(content);
  if (!Array.isArray(data.products) || !data.collectionMembership) {
    throw new Error('Input catalog must contain products and collectionMembership data.');
  }
  return data;
}

async function readStockFile(filePath) {
  const content = (await fs.readFile(path.resolve(filePath), 'utf8')).replace(/^\uFEFF/, '');
  const data = JSON.parse(content);
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Stock file must be a JSON object mapping source product IDs to exact quantities.');
  }

  const stockQuantities = new Map();
  for (const [sourceId, quantity] of Object.entries(data)) {
    if (!/^\d+$/.test(sourceId) || !Number.isSafeInteger(quantity) || quantity < 0) {
      throw new Error(`Stock file contains an invalid product ID or quantity for "${sourceId}".`);
    }
    stockQuantities.set(sourceId, quantity);
  }
  return stockQuantities;
}

function convertProduct(source, assignedCollections, categoryNames, stockQuantity) {
  const id = String(source.id);
  const name = cleanText(source.title);
  const slug = `${slugify(name)}-${id.slice(-6)}`;
  const sourceVariants = Array.isArray(source.variants) ? source.variants : [];
  const pricedVariants = sourceVariants
    .map(variant => ({ variant, price: Number(variant.price) }))
    .filter(item => Number.isFinite(item.price) && item.price > 0);
  if (!name || !pricedVariants.length) {
    throw new Error(`Product ${id} is missing a title or verified variant price.`);
  }

  const retailPrice = Math.min(...pricedVariants.map(item => item.price));
  const baseVariant = pricedVariants.find(item => item.price === retailPrice)?.variant;
  const compareAtPrice = Number(baseVariant?.compare_at_price);
  const mrp = Number.isFinite(compareAtPrice) && compareAtPrice >= retailPrice
    ? compareAtPrice
    : retailPrice;
  const imageUrls = [...new Set((source.images || [])
    .map(image => typeof image === 'string' ? image : image?.src)
    .filter(image => typeof image === 'string' && /^https:\/\/cdn\.shopify\.com\//i.test(image)))];
  if (!imageUrls.length) throw new Error(`Product ${id} has no usable product images.`);

  const variants = pricedVariants.map(({ variant, price }, index) => {
    const options = (source.options || [])
      .map((option, optionIndex) => ({
        name: cleanText(option.name),
        value: cleanText(variant[`option${optionIndex + 1}`])
      }))
      .filter(option => option.value && option.value.toLowerCase() !== 'default title');
    const values = options.map(option => option.value);
    const optionFor = expression => options.find(option => expression.test(option.name));
    const colorOption = optionFor(/colou?r/i);
    const sizeOption = optionFor(/size|pack|quantity/i);
    const packMatch = `${sizeOption?.value || ''} ${variant.title || ''}`.match(/(\d+)\s*(?:pack|pcs?|pieces|units?)/i);
    const variantName = cleanText(values.join(' / ') || variant.title || 'Standard') || 'Standard';
    const sourceSku = cleanText(variant.sku);
    return {
      id: String(variant.id || `${id}-${index + 1}`),
      name: variantName,
      ...(colorOption ? { colorName: colorOption.value } : {}),
      ...(sizeOption ? { size: sizeOption.value } : {}),
      ...(packMatch ? { packSize: Number(packMatch[1]) } : {}),
      sku: sourceSku || `CAT-${id}-V${index + 1}`,
      priceDelta: Math.round((price - retailPrice) * 100) / 100,
      inStock: Boolean(variant.available)
    };
  });

  const descriptions = htmlToText(source.body_html);
  const firstSentence = descriptions.split(/(?<=[.!?])\s+/)[0] || name;
  const categoryId = assignedCollections[0].parentCategoryId;
  const categoryName = categoryNames.get(categoryId);
  const product = {
    id: `catalog-${id}`,
    name,
    slug,
    sku: `CAT-${id}`,
    category: categoryId,
    categoryName,
    subcategory: assignedCollections[0].name,
    mrp,
    retailPrice,
    stock: stockQuantity,
    moq: 1,
    rating: 0,
    reviewCount: 0,
    isBestSeller: false,
    isDirectMillDeal: false,
    isTrending: false,
    hsnCode: '',
    gstRate: 0,
    shortDescription: cleanText(firstSentence).slice(0, 500) || name,
    description: descriptions || name,
    images: imageUrls,
    tags: [...new Set((source.tags || []).map(cleanText).filter(Boolean))],
    specifications: {
      'Product type': cleanText(source.product_type),
      Availability: variants.some(variant => variant.inStock)
        ? 'Listed as available; exact stock quantity is not exposed.'
        : 'Not listed as available.'
    },
    wholesaleTiers: defaultWholesaleTiers(retailPrice),
    variants
  };

  if (!categoryName || !assignedCollections.length) {
    throw new Error(`Product ${id} has no valid destination category or collection.`);
  }
  if (containsBrand(product)) {
    throw new Error(`Brand text remains in sanitized product ${id}.`);
  }
  return product;
}

function toStoredJson(value) {
  return JSON.stringify(value ?? null);
}

async function ensureCollectionTables(connection) {
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
}

function findSimilarExistingProducts(source, existingProducts) {
  const cleanName = cleanText(source.title);
  const exactMatches = existingProducts.filter(product =>
    normalizeTitle(product.name) === normalizeTitle(cleanName)
  );
  if (exactMatches.length) return { reason: 'matching title requires design review', matches: exactMatches };

  const sourceImages = new Set((source.images || [])
    .map(image => typeof image === 'string' ? image : image?.src)
    .filter(Boolean));
  const imageMatches = existingProducts.filter(product =>
    extractJson(product.images)?.some(image => sourceImages.has(image))
  );
  if (imageMatches.length) return { reason: 'matching image URL requires review', matches: imageMatches };

  const similar = existingProducts
    .map(product => ({ product, similarity: tokenSimilarity(cleanName, product.name) }))
    .filter(item => item.similarity >= 0.75)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 3);
  if (similar.length) return { reason: 'similar title requires review', matches: similar.map(item => item.product) };
  return null;
}

async function main() {
  const apply = process.argv.includes('--apply');
  const inputIndex = process.argv.indexOf('--input');
  const inputPath = inputIndex >= 0 ? process.argv[inputIndex + 1] : null;
  if (inputIndex >= 0 && (!inputPath || inputPath.startsWith('--'))) {
    throw new Error('Provide a file path after --input.');
  }
  const stockIndex = process.argv.indexOf('--stock-file');
  const stockPath = stockIndex >= 0 ? process.argv[stockIndex + 1] : null;
  if (stockIndex >= 0 && (!stockPath || stockPath.startsWith('--'))) {
    throw new Error('Provide a file path after --stock-file.');
  }

  const sourceData = inputPath ? await readInputFile(inputPath) : await fetchSourceData();
  const sourceProducts = sourceData.products.filter(product => product.published_at !== null);
  const sourceIds = new Set(sourceProducts.map(product => String(product.id)));
  if (sourceIds.size !== sourceProducts.length) throw new Error('The source catalog contains duplicate product IDs.');
  const stockQuantities = stockPath ? await readStockFile(stockPath) : new Map();
  const unknownStockIds = [...stockQuantities.keys()].filter(sourceId => !sourceIds.has(sourceId));
  if (unknownStockIds.length) {
    throw new Error(`Stock file contains source product IDs not present in the catalog: ${unknownStockIds.join(', ')}.`);
  }

  const pool = makePool();
  let connection;
  let transactionOpen = false;
  try {
    connection = await pool.getConnection();
    if (apply) await ensureCollectionTables(connection);
    const [requiredTables] = await connection.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME IN ('products', 'categories', 'collections', 'product_collections')`
    );
    const requiredTableNames = new Set(requiredTables.map(row => row.TABLE_NAME));
    for (const tableName of ['products', 'categories', 'collections', 'product_collections']) {
      if (!requiredTableNames.has(tableName)) {
        throw new Error(`Required database table "${tableName}" is unavailable.`);
      }
    }

    const [categories] = await connection.query('SELECT id, name FROM categories');
    const categoryNames = new Map(categories.map(category => [category.id, category.name]));
    const requiredCategoryIds = new Set([
      ...NEW_COLLECTIONS.map(collection => collection.parentCategoryId),
      'home-kitchen', 'household', 'textile', 'cotton-products'
    ]);
    for (const id of requiredCategoryIds) {
      if (!categoryNames.has(id)) throw new Error(`Required parent category "${id}" does not exist.`);
    }

    const [existingCollections] = await connection.query(
      'SELECT id, name, slug, parent_category_id, display_order, image FROM collections'
    );
    const [existingProducts] = await connection.query(
      'SELECT id, name, sku, images, category_id, subcategory FROM products'
    );
    const existingById = new Map(existingProducts.map(product => [product.id, product]));
    const collectionByName = new Map(existingCollections.map(collection => [
      normalizeCollectionName(collection.name),
      collection
    ]));

    const targetDefinitions = new Map();
    for (const definition of NEW_COLLECTIONS) {
      const existing = collectionByName.get(normalizeCollectionName(definition.name));
      targetDefinitions.set(definition.name, existing || {
        id: `catalog-collection-${definition.slug}`,
        name: definition.name,
        slug: definition.slug,
        parent_category_id: definition.parentCategoryId,
        display_order: existingCollections.length + targetDefinitions.size + 1,
        description: `Browse ${definition.name.toLowerCase()} in this collection.`,
        image: ''
      });
    }

    const resolveExistingCollection = name => {
      const exact = collectionByName.get(normalizeCollectionName(name));
      if (exact) return exact;
      const slug = slugify(name);
      return existingCollections.find(collection => collection.slug === slug) || null;
    };
    const collectionTargets = new Map(targetDefinitions);
    for (const definition of NEW_COLLECTIONS) {
      for (const alias of definition.aliases) {
        const existing = resolveExistingCollection(alias);
        if (existing) collectionTargets.set(alias, existing);
      }
    }

    const sourceCollectionNames = new Map(
      Object.entries(COLLECTION_TARGETS).map(([handle, name]) => [handle, name])
    );
    for (const [handle, name] of sourceCollectionNames) {
      if (!collectionTargets.has(name)) {
        const existing = resolveExistingCollection(name);
        if (existing) collectionTargets.set(name, existing);
      }
      if (!collectionTargets.has(name)) {
        throw new Error(`Destination collection for source category "${handle}" is not defined.`);
      }
    }

    const typeTargets = new Map();
    for (const [type, name] of Object.entries(TYPE_TARGETS)) {
      const target = collectionTargets.get(name) || resolveExistingCollection(name);
      if (!target) throw new Error(`Destination collection for product type "${type}" is missing.`);
      typeTargets.set(type, target);
    }

    const pendingProducts = [];
    const reviewProducts = [];
    const alreadyImported = [];
    const productAssignments = new Map();

    for (const source of sourceProducts) {
      const sourceId = String(source.id);
      const productId = `catalog-${sourceId}`;
      if (existingById.has(productId)) {
        alreadyImported.push(productId);
      } else {
        const match = findSimilarExistingProducts(source, existingProducts);
        if (match) {
          reviewProducts.push({
            sourceId,
            title: cleanText(source.title),
            reason: match.reason,
            matches: match.matches.map(product => ({ id: product.id, title: product.name }))
          });
          continue;
        }
      }

      const targets = [];
      for (const [handle, ids] of Object.entries(sourceData.collectionMembership)) {
        if (!Array.isArray(ids) || !ids.map(String).includes(sourceId)) continue;
        const targetName = COLLECTION_TARGETS[handle];
        if (!targetName) throw new Error(`No collection mapping exists for source category "${handle}".`);
        const target = collectionTargets.get(targetName);
        if (!target) throw new Error(`Mapped collection "${targetName}" is missing.`);
        if (!targets.some(item => item.id === target.id)) targets.push(target);
      }

      if (!targets.length) {
        const typeKey = String(source.product_type || '').trim().toLowerCase();
        const fallback = typeTargets.get(typeKey);
        if (!fallback) {
          throw new Error(`Product ${sourceId} (${cleanText(source.title)}) has no verified collection assignment.`);
        }
        targets.push(fallback);
      }

      const assignment = targets.map(target => ({
        id: target.id,
        name: target.name,
        parentCategoryId: target.parent_category_id
      }));
      productAssignments.set(productId, assignment);
      if (!existingById.has(productId)) {
        pendingProducts.push(convertProduct(source, assignment, categoryNames, stockQuantities.get(sourceId)));
      }
    }

    const collectionsToInsert = [...targetDefinitions.values()].filter(collection =>
      !existingCollections.some(existing => existing.id === collection.id)
    );
    for (const collection of collectionsToInsert) {
      const assignedProduct = pendingProducts.find(product => product.subcategory === collection.name);
      if (assignedProduct?.images[0]) collection.image = assignedProduct.images[0];
      if (!collection.image) {
        const sourceAssignment = [...productAssignments.values()].find(assignment =>
          assignment.some(item => item.id === collection.id)
        );
        if (sourceAssignment) {
          const sourceForCollection = sourceProducts.find(source => {
            const productId = `catalog-${source.id}`;
            return productAssignments.get(productId)?.some(item => item.id === collection.id);
          });
          const image = sourceForCollection?.images?.[0]?.src;
          if (image) collection.image = image;
        }
      }
    }

    const legacyBroadLinks = [];
    for (const [name, matcher] of Object.entries(BROAD_COLLECTION_MATCHERS)) {
      const target = targetDefinitions.get(name);
      if (!target) continue;
      for (const product of existingProducts) {
        if (matcher.test(`${product.name} ${product.subcategory || ''}`)) {
          legacyBroadLinks.push([product.id, target.id]);
        }
      }
    }
    for (const collection of collectionsToInsert) {
      if (collection.image) continue;
      const existingProductId = legacyBroadLinks.find(([, collectionId]) => collectionId === collection.id)?.[0];
      const image = existingProductId ? extractJson(existingById.get(existingProductId)?.images)?.[0] : '';
      if (image) collection.image = image;
    }

    const sourceCollectionsWithProducts = new Set();
    for (const assignments of productAssignments.values()) {
      for (const assignment of assignments) sourceCollectionsWithProducts.add(assignment.id);
    }
    const emptyCollections = collectionsToInsert.filter(collection =>
      !sourceCollectionsWithProducts.has(collection.id) &&
      !legacyBroadLinks.some(([, collectionId]) => collectionId === collection.id)
    );
    if (emptyCollections.length) {
      throw new Error(`Refusing to create empty collections: ${emptyCollections.map(item => item.name).join(', ')}.`);
    }

    const plan = {
      mode: apply ? 'apply' : 'dry-run',
      sourceProducts: sourceProducts.length,
      alreadyImported: alreadyImported.length,
      newProducts: pendingProducts.length,
      flaggedForReview: reviewProducts.length,
      collectionsRetained: existingCollections.length,
      collectionsToCreate: collectionsToInsert.map(collection => collection.name),
      newProductCollectionLinks: [...productAssignments.values()].reduce((count, assignments) => count + assignments.length, 0),
      existingProductsAddedToBroadCollections: legacyBroadLinks.length,
      variants: pendingProducts.reduce((count, product) => count + product.variants.length, 0),
      images: pendingProducts.reduce((count, product) => count + product.images.length, 0),
      variantsMarkedAvailable: pendingProducts.reduce(
        (count, product) => count + product.variants.filter(variant => variant.inStock).length,
        0
      ),
      missingInventoryQuantities: pendingProducts.filter(product => !Number.isSafeInteger(product.stock)).length,
      exactInventoryQuantitiesAvailable: pendingProducts.every(product => Number.isSafeInteger(product.stock)),
      newProductBrandTextRemoved: pendingProducts.every(product => !containsBrand(product)),
      existingProductBrandCleanup: apply ? 'planned during apply' : 'not run in dry-run',
      reviewProducts
    };
    console.log(JSON.stringify(plan, null, 2));
    if (!apply) return;
    if (plan.missingInventoryQuantities) {
      throw new Error(
        `Refusing to apply without exact stock quantities for ${plan.missingInventoryQuantities} products. ` +
        'Provide a --stock-file with verified product-level quantities.'
      );
    }

    await connection.beginTransaction();
    transactionOpen = true;

    if (collectionsToInsert.length) {
      const insertCollection = `INSERT INTO collections (
        id, name, slug, parent_category_id, description, image, display_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`;
      for (const collection of collectionsToInsert) {
        await connection.query(insertCollection, [
          collection.id,
          collection.name,
          collection.slug,
          collection.parent_category_id,
          collection.description,
          collection.image,
          collection.display_order
        ]);
      }
    }

    const insertProduct = `INSERT INTO products (
      id, name, slug, sku, category_id, category_name, subcategory,
      mrp, retail_price, stock, moq, rating, review_count,
      is_bestseller, is_direct_mill_deal, is_trending, hsn_code, gst_rate,
      short_description, description, images, tags, specifications, wholesale_tiers, variants
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    for (const product of pendingProducts) {
      await connection.query(insertProduct, [
        product.id,
        product.name,
        product.slug,
        product.sku,
        product.category,
        product.categoryName,
        product.subcategory,
        product.mrp,
        product.retailPrice,
        product.stock,
        product.moq,
        product.rating,
        product.reviewCount,
        0,
        0,
        0,
        product.hsnCode,
        product.gstRate,
        product.shortDescription,
        product.description,
        toStoredJson(product.images),
        toStoredJson(product.tags),
        toStoredJson(product.specifications),
        toStoredJson(product.wholesaleTiers),
        toStoredJson(product.variants)
      ]);
    }

    const insertLink = 'INSERT IGNORE INTO product_collections (product_id, collection_id) VALUES (?, ?)';
    for (const [productId, assignments] of productAssignments) {
      for (const assignment of assignments) {
        await connection.query(insertLink, [productId, assignment.id]);
      }
    }
    for (const [productId, collectionId] of legacyBroadLinks) {
      await connection.query(insertLink, [productId, collectionId]);
    }

    const [existingListingRows] = await connection.query(`
      SELECT id, name, sku, short_description, description, images, tags, specifications, wholesale_tiers, variants
      FROM products
    `);
    const brandCleanedIds = [];
    for (const row of existingListingRows) {
      const original = {
        name: row.name,
        sku: row.sku,
        short_description: row.short_description,
        description: row.description,
        images: extractJson(row.images),
        tags: extractJson(row.tags),
        specifications: extractJson(row.specifications),
        wholesale_tiers: extractJson(row.wholesale_tiers),
        variants: extractJson(row.variants)
      };
      const cleaned = {
        name: cleanText(row.name),
        sku: cleanText(row.sku),
        short_description: cleanText(row.short_description),
        description: cleanText(row.description),
        tags: sanitizeTree(extractJson(row.tags)),
        specifications: sanitizeTree(extractJson(row.specifications)),
        wholesale_tiers: sanitizeTree(extractJson(row.wholesale_tiers)),
        variants: sanitizeTree(extractJson(row.variants))
      };
      if (!containsBrand(original)) continue;
      await connection.query(
        `UPDATE products
         SET name = ?, sku = ?, short_description = ?, description = ?, tags = ?,
             specifications = ?, wholesale_tiers = ?, variants = ?
         WHERE id = ?`,
        [
          cleaned.name,
          cleaned.sku,
          cleaned.short_description,
          cleaned.description,
          toStoredJson(cleaned.tags),
          toStoredJson(cleaned.specifications),
          toStoredJson(cleaned.wholesale_tiers),
          toStoredJson(cleaned.variants),
          row.id
        ]
      );
      brandCleanedIds.push(row.id);
    }

    const [verifiedProducts] = await connection.query(`
      SELECT id, name, sku, short_description, description, images, tags, specifications, wholesale_tiers, variants
      FROM products
    `);
    const brandedListings = verifiedProducts.filter(row => containsBrand({
      name: row.name,
      sku: row.sku,
      shortDescription: row.short_description,
      description: row.description,
      images: extractJson(row.images),
      tags: extractJson(row.tags),
      specifications: extractJson(row.specifications),
      wholesaleTiers: extractJson(row.wholesale_tiers),
      variants: extractJson(row.variants)
    }));
    if (brandedListings.length) {
      throw new Error(
        `Brand-removal verification failed for ${brandedListings.length} product listings: ` +
        brandedListings.map(row => row.id).join(', ')
      );
    }

    const [collectionCounts] = await connection.query(`
      SELECT c.id, c.name, COUNT(DISTINCT pc.product_id) AS product_count
      FROM collections c
      LEFT JOIN product_collections pc ON pc.collection_id = c.id
      GROUP BY c.id, c.name
    `);
    const emptyTargetCollections = collectionCounts.filter(collection =>
      collectionsToInsert.some(inserted => inserted.id === collection.id) &&
      Number(collection.product_count) === 0
    );
    if (emptyTargetCollections.length) {
      throw new Error(`Post-import collection verification found empty collections: ${emptyTargetCollections.map(item => item.name).join(', ')}.`);
    }

    const [finalCounts] = await connection.query(`
      SELECT
        (SELECT COUNT(*) FROM products) AS products,
        (SELECT COUNT(DISTINCT id) FROM products) AS distinct_products,
        (SELECT COUNT(*) FROM collections) AS collections,
        (SELECT COUNT(*) FROM product_collections) AS product_collection_links
    `);
    const counts = finalCounts[0];
    if (Number(counts.products) !== existingProducts.length + pendingProducts.length ||
        Number(counts.distinct_products) !== Number(counts.products)) {
      throw new Error('Post-import product count verification failed.');
    }

    await connection.commit();
    transactionOpen = false;
    console.log(JSON.stringify({
      result: 'committed',
      importedProducts: pendingProducts.length,
      retainedExistingProducts: existingProducts.length,
      productsFlaggedForReview: reviewProducts.length,
      newCollections: collectionsToInsert.length,
      cleanedExistingListings: brandCleanedIds,
      productCollectionLinks: Number(counts.product_collection_links),
      totalProducts: Number(counts.products),
      totalCollections: Number(counts.collections),
      noBrandedProductFieldsRemain: true,
      exactInventoryQuantitiesRemainUnavailable: true
    }, null, 2));
  } catch (error) {
    if (transactionOpen) await connection.rollback();
    throw error;
  } finally {
    if (connection) connection.release();
    await pool.end();
  }
}

main().catch(error => {
  console.error(`Catalog import failed: ${error.message}`);
  process.exitCode = 1;
});
