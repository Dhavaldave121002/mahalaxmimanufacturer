import { Product } from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  // ==========================================
  // TEXTILE CATEGORY
  // ==========================================
  {
    id: 'prod-bedsheet-01',
    name: 'Glance 300 TC 100% Pure Combed Cotton Double Bedsheet with 2 Pillow Covers',
    slug: 'glance-300-tc-cotton-double-bedsheet',
    sku: 'MLE-TEX-BS-3001',
    category: 'textile',
    categoryName: 'Textile',
    subcategory: 'Double Bedsheets',
    shortDescription: 'Direct mill woven 300 Thread Count sateen weave double bedsheet engineered for 500+ commercial wash cycles.',
    description: 'Crafted at our Ahmedabad weaving unit using long-staple Gujarat combed cotton. This 300 TC bedsheet offers hotel-grade luster, breathable skin feel, and extreme color fastness even under industrial hot-water washing. Comes with 2 matching Oxford pillow covers.',
    images: [
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1631679706909-1844bbd07221?q=80&w=1000&auto=format&fit=crop'
    ],
    mrp: 1899,
    retailPrice: 899,
    wholesaleTiers: [
      { minQty: 1, maxQty: 9, pricePerUnit: 899, savingsPercent: 0, label: 'Standard Retail' },
      { minQty: 10, maxQty: 49, pricePerUnit: 649, savingsPercent: 28, label: 'Wholesale Tier 1' },
      { minQty: 50, maxQty: 199, pricePerUnit: 549, savingsPercent: 39, label: 'Institutional Bulk' },
      { minQty: 200, pricePerUnit: 489, savingsPercent: 46, label: 'Direct Mill Contract' }
    ],
    moq: 1,
    stock: 480,
    rating: 5.0,
    reviewCount: 2,
    isBestSeller: true,
    isDirectMillDeal: true,
    isTrending: true,
    hsnCode: '630221',
    gstRate: 5,
    specifications: {
      'Fabric Composition': '100% Super Combed Pure Cotton',
      'Thread Count': '300 TC Sateen Weave',
      'Sheet Dimensions': '108 x 108 inches (Super King / Double)',
      'Pillow Cover Size': '18 x 28 inches (Oxford border)',
      'Wash Care': 'Machine wash 40°C, colorfast dye, tumble dry low',
      'Mill Location': 'Narol Textile Cluster, Ahmedabad, Gujarat'
    },
    careInstructions: [
      'Machine wash gentle cycle with mild detergent',
      'Do not use chlorine bleach or acid rinse',
      'Tumble dry at low to medium heat',
      'Warm iron while slightly damp for crisp hotel finish'
    ],
    variants: [
      { id: 'v1', name: 'Royal Ivory Cream', colorName: 'Ivory Cream', colorHex: '#FBF8F2', size: 'Super King (108x108")', sku: 'MLE-BS-IVY-SK', inStock: true },
      { id: 'v2', name: 'Navy Indigo Stripe', colorName: 'Navy Stripe', colorHex: '#1B2C52', size: 'Super King (108x108")', sku: 'MLE-BS-NVY-SK', inStock: true },
      { id: 'v3', name: 'Slate Charcoal', colorName: 'Slate Grey', colorHex: '#4A5568', size: 'Super King (108x108")', sku: 'MLE-BS-SLT-SK', inStock: true }
    ],
    tags: ['bedsheet', 'cotton', 'hotel linen', 'double bedsheet', '300 tc', 'mill direct']
  },
  {
    id: 'prod-curtain-02',
    name: 'Heritage Textured Linen-Blend Blackout Eyelet Curtains (Set of 2)',
    slug: 'heritage-linen-blend-blackout-curtains',
    sku: 'MLE-TEX-CRT-102',
    category: 'textile',
    categoryName: 'Textile',
    subcategory: 'Curtains',
    shortDescription: 'Heavy-drape 280 GSM linen-textured room darkening curtains with anti-rust brass eyelets.',
    description: 'Engineered for luxury homes, boutique hotels, and executive guest houses. High density weave blocks 85%+ sunlight, enhances thermal insulation, and prevents AC cooling loss. Heavy self-weighted drape ensures straight fall without bunching.',
    images: [
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1000&auto=format&fit=crop'
    ],
    mrp: 2499,
    retailPrice: 1249,
    wholesaleTiers: [
      { minQty: 1, maxQty: 4, pricePerUnit: 1249, savingsPercent: 0, label: 'Retail Pack' },
      { minQty: 5, maxQty: 19, pricePerUnit: 920, savingsPercent: 26, label: 'Contractor Rate' },
      { minQty: 20, pricePerUnit: 780, savingsPercent: 38, label: 'Commercial Bulk' }
    ],
    moq: 1,
    stock: 220,
    rating: 4.7,
    reviewCount: 145,
    isBestSeller: false,
    isDirectMillDeal: true,
    hsnCode: '630392',
    gstRate: 12,
    specifications: {
      'Weight / Density': '280 GSM Structured Weave',
      'Length': '7 Feet (Door) / 9 Feet (Long Door)',
      'Eyelets': '8 Anti-Rust Matte Finish Brass Grommets',
      'Light Blocking': '85-90% Room Darkening'
    },
    tags: ['curtains', 'blackout', 'linen blend', 'home decor', 'hotel room']
  },
  {
    id: 'prod-linen-03',
    name: 'Hospitality Grade 100% Pure Crisp White Linen Duvet Covers',
    slug: 'hospitality-crisp-white-linen-duvet-cover',
    sku: 'MLE-TEX-LIN-405',
    category: 'textile',
    categoryName: 'Textile',
    subcategory: 'Premium Linen',
    shortDescription: 'Institutional 400 TC percale woven duvet cover with concealed zipper closure.',
    description: 'Supplied directly to 3-star and 4-star hospitality chains across India. Reinforced double-stitched seams, sanforized preshrunk fabric, and hypoallergenic properties for maximum guest comfort.',
    images: [
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=1000&auto=format&fit=crop'
    ],
    mrp: 2999,
    retailPrice: 1499,
    wholesaleTiers: [
      { minQty: 1, maxQty: 9, pricePerUnit: 1499, savingsPercent: 0, label: 'Retail' },
      { minQty: 10, maxQty: 49, pricePerUnit: 1050, savingsPercent: 30, label: 'Hotelier Batch' },
      { minQty: 50, pricePerUnit: 890, savingsPercent: 41, label: 'Direct Mill Container' }
    ],
    moq: 1,
    stock: 350,
    rating: 4.9,
    reviewCount: 94,
    isBestSeller: true,
    hsnCode: '630221',
    gstRate: 5,
    specifications: {
      'Thread Count': '400 TC Percale Weave',
      'Fabric': '100% Long Staple Cotton',
      'Closure': 'Concealed high-tensile nylon zipper',
      'Certification': 'OEKO-TEX Standard 100'
    },
    tags: ['duvet', 'hotel linen', 'white bedsheet', 'hospitality', 'percale']
  },
  {
    id: 'prod-fabrics-04',
    name: 'Raw Greige Unbleached Cotton Drill & Poplin Fabric (By the Roll / Meter)',
    slug: 'raw-unbleached-cotton-drill-fabric-roll',
    sku: 'MLE-TEX-FAB-901',
    category: 'textile',
    categoryName: 'Textile',
    subcategory: 'Fabrics',
    shortDescription: 'Standard mill direct unbleached greige cotton fabric for garment factories, printing, and bag manufacturing.',
    description: 'Fresh off our automatic air-jet looms. Available in 58-inch width with consistent warp/weft tension. Uniform grain ideal for digital printing, garment manufacturing, aprons, and eco-friendly tote bags.',
    images: [
      'https://images.unsplash.com/photo-1604014237800-1c9102c219da?q=80&w=1000&auto=format&fit=crop'
    ],
    mrp: 320,
    retailPrice: 195,
    wholesaleTiers: [
      { minQty: 5, maxQty: 49, pricePerUnit: 195, savingsPercent: 0, label: 'Sample Cut (Meters)' },
      { minQty: 50, maxQty: 199, pricePerUnit: 145, savingsPercent: 25, label: 'Bale Rate (Meters)' },
      { minQty: 200, pricePerUnit: 115, savingsPercent: 41, label: 'Mill Direct Roll (500m+)' }
    ],
    moq: 5,
    stock: 8500,
    rating: 4.6,
    reviewCount: 68,
    isDirectMillDeal: true,
    hsnCode: '520811',
    gstRate: 5,
    specifications: {
      'Width': '58 Inches (147 cm)',
      'GSM': '210 GSM Drill',
      'Yarn Count': '20s x 20s / 108 x 56',
      'Loom Type': 'Tsudakoma Air-Jet'
    },
    tags: ['fabric', 'raw cotton', 'greige', 'garment manufacturing', 'wholesale rolls']
  },

  // ==========================================
  // COTTON PRODUCTS CATEGORY
  // ==========================================
  {
    id: 'prod-cotton-towel-01',
    name: 'Mahalaxmi Enterprises Super-Plush 600 GSM Combed Cotton Bath Towel (75 x 150 cm)',
    slug: 'mahalaxmi-600-gsm-plush-cotton-bath-towel',
    sku: 'MLE-COT-TWL-600',
    category: 'cotton-products',
    categoryName: 'Cotton Products',
    subcategory: 'Cotton Bath Towels',
    shortDescription: 'Heavyweight zero-twist 600 GSM bath towel designed for 5-star hotel absorbency and soft hand-feel.',
    description: 'Engineered with ring-spun 100% Gujarat cotton. Features double-edge hemstitching to prevent fraying across heavy laundry machines. High capillary action absorbs 4x its weight in water within 3 seconds.',
    images: [
      'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1616627547584-bf28cee262db?q=80&w=1000&auto=format&fit=crop'
    ],
    mrp: 999,
    retailPrice: 449,
    wholesaleTiers: [
      { minQty: 1, maxQty: 9, pricePerUnit: 449, savingsPercent: 0, label: 'Single Piece' },
      { minQty: 10, maxQty: 49, pricePerUnit: 320, savingsPercent: 29, label: 'Salon & Spa Pack' },
      { minQty: 50, maxQty: 199, pricePerUnit: 265, savingsPercent: 41, label: 'Hotel Carton (50 Pcs)' },
      { minQty: 200, pricePerUnit: 225, savingsPercent: 50, label: 'Mill Direct Bale' }
    ],
    moq: 1,
    stock: 1200,
    rating: 5.0,
    reviewCount: 1,
    isBestSeller: true,
    isDirectMillDeal: true,
    isTrending: true,
    hsnCode: '630260',
    gstRate: 5,
    specifications: {
      'GSM': '600 GSM Zero Twist Terry',
      'Dimensions': '75 cm x 150 cm (Large Bath Sheet)',
      'Material': '100% Combed Indian Cotton',
      'Border': 'Woven Dobby Stripe Border'
    },
    variants: [
      { id: 'ct1', name: 'Optic Hotel White', colorName: 'White', colorHex: '#FFFFFF', sku: 'MLE-TWL-WHT', inStock: true },
      { id: 'ct2', name: 'Royal Navy Blue', colorName: 'Navy', colorHex: '#14213D', sku: 'MLE-TWL-NVY', inStock: true },
      { id: 'ct3', name: 'Muted Champagne Sand', colorName: 'Sand', colorHex: '#C6AA80', sku: 'MLE-TWL-SND', inStock: true }
    ],
    tags: ['bath towel', 'hotel towel', '600 gsm', 'cotton towel', 'absorbent', 'wholesale towels']
  },
  {
    id: 'prod-canvas-bag-02',
    name: 'Eco-Craft 380 GSM Heavy Duty Cotton Canvas Tote Bag with Reinforced Handles',
    slug: 'eco-craft-heavy-duty-cotton-canvas-tote-bag',
    sku: 'MLE-COT-BAG-380',
    category: 'cotton-products',
    categoryName: 'Cotton Products',
    subcategory: 'Canvas Bags',
    shortDescription: 'Sustainable unbleached cotton shopping bag capable of carrying 15kg load for retail & corporate gifting.',
    description: 'Customizable bulk canvas tote bag. Features cross-stitched webbed cotton handles, 4-inch bottom gusset for extra capacity, and smooth printable surface for screen print or embroidery logos.',
    images: [
      'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=1000&auto=format&fit=crop'
    ],
    mrp: 349,
    retailPrice: 149,
    wholesaleTiers: [
      { minQty: 5, maxQty: 49, pricePerUnit: 149, savingsPercent: 0, label: 'Retail Trial' },
      { minQty: 50, maxQty: 199, pricePerUnit: 98, savingsPercent: 34, label: 'Retailer Bundle' },
      { minQty: 200, maxQty: 999, pricePerUnit: 74, savingsPercent: 50, label: 'Corporate Gifting' },
      { minQty: 1000, pricePerUnit: 58, savingsPercent: 61, label: 'OEM Print Direct' }
    ],
    moq: 5,
    stock: 3500,
    rating: 4.8,
    reviewCount: 230,
    isBestSeller: true,
    hsnCode: '420222',
    gstRate: 5,
    specifications: {
      'Fabric Density': '380 GSM Heavy Duck Canvas (14 Oz)',
      'Dimensions': '15" W x 16" H with 4" Bottom Gusset',
      'Handle Length': '24" Reinforced Shoulder Webbing',
      'Load Capacity': 'Tested up to 18 Kilograms'
    },
    tags: ['canvas bag', 'tote bag', 'cotton bag', 'promotional bag', 'eco friendly', 'wholesale bags']
  },
  {
    id: 'prod-cotton-essentials-03',
    name: 'Waffle-Weave Super-Soft Cotton Baby Swaddles & Multi-Purpose Quilts (Pack of 3)',
    slug: 'waffle-weave-cotton-baby-swaddle-pack',
    sku: 'MLE-COT-ESS-702',
    category: 'cotton-products',
    categoryName: 'Cotton Products',
    subcategory: 'Cotton Essentials',
    shortDescription: 'Ultra-gentle breathable pre-washed muslin cotton wraps for infant care and sensitive skin.',
    description: 'Double gauze cotton with open honeycomb weave that maintains ideal body temperature. Naturally dyed with azo-free organic pigments.',
    images: [
      'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?q=80&w=1000&auto=format&fit=crop'
    ],
    mrp: 1299,
    retailPrice: 599,
    wholesaleTiers: [
      { minQty: 1, maxQty: 9, pricePerUnit: 599, savingsPercent: 0, label: 'Retail Pack' },
      { minQty: 10, maxQty: 49, pricePerUnit: 430, savingsPercent: 28, label: 'Baby Boutique Bulk' },
      { minQty: 50, pricePerUnit: 340, savingsPercent: 43, label: 'Distributor Case' }
    ],
    moq: 1,
    stock: 450,
    rating: 4.9,
    reviewCount: 180,
    hsnCode: '630130',
    gstRate: 5,
    specifications: {
      'Material': '100% Organic Muslin Gauze',
      'Pack Contents': '3 Swaddles (120 x 120 cm each)',
      'Pattern': 'Pastel Neutrals / Animal Prints'
    },
    tags: ['swaddles', 'baby cotton', 'muslin', 'essentials']
  },
  {
    id: 'prod-mill-goods-04',
    name: 'Direct Mill Industrial Cotton Waste / Comber Noil Bales (For Spinning & Padding)',
    slug: 'direct-mill-cotton-waste-comber-noil',
    sku: 'MLE-COT-MIL-001',
    category: 'cotton-products',
    categoryName: 'Cotton Products',
    subcategory: 'Direct Mill Goods',
    shortDescription: 'High purity 100% clean comber noil cotton waste baled directly at Ahmedabad spinning facility.',
    description: 'Minimal trash content (<0.8%), high fiber micronaire. Ideal for surgical cotton manufacturing, yarn open-end spinning, mattress batting, and acoustic insulation.',
    images: [
      'https://images.unsplash.com/photo-1596704017254-9b121068fb31?q=80&w=1000&auto=format&fit=crop'
    ],
    mrp: 140,
    retailPrice: 110,
    wholesaleTiers: [
      { minQty: 100, maxQty: 499, pricePerUnit: 110, savingsPercent: 0, label: 'Small Bale (100 Kg)' },
      { minQty: 500, maxQty: 1999, pricePerUnit: 92, savingsPercent: 16, label: 'Truck Load (Per Kg)' },
      { minQty: 200, pricePerUnit: 82, savingsPercent: 25, label: 'Contract (Per Tonne)' }
    ],
    moq: 100,
    stock: 25000,
    rating: 4.7,
    reviewCount: 42,
    isDirectMillDeal: true,
    hsnCode: '520210',
    gstRate: 5,
    specifications: {
      'Fiber Length': '12 - 16 mm',
      'Trash Content': 'Under 0.8%',
      'Micronaire': '3.8 - 4.4 NCL',
      'Packing': 'Mechanically pressed wire-bound bales'
    },
    tags: ['mill goods', 'cotton waste', 'raw cotton', 'industrial', 'comber noil']
  },

  // ==========================================
  // HOME AND KITCHEN CATEGORY
  // ==========================================
  {
    id: 'prod-kitchen-towel-01',
    name: 'Chef-Pro Herringbone Weave 100% Cotton Kitchen Bar Towels (Pack of 12)',
    slug: 'chef-pro-herringbone-cotton-kitchen-towels',
    sku: 'MLE-KIT-TWL-12PK',
    category: 'home-kitchen',
    categoryName: 'Home and Kitchen',
    subcategory: 'Kitchen Towels',
    shortDescription: 'Commercial lint-free restaurant kitchen wiper towels engineered for high temperature sanitization.',
    description: 'Designed specifically for cloud kitchens, banquet catering, fine dining restaurants, and home cooks. Lint-free tight herringbone weave prevents residue on glassware and stainless steel cutlery.',
    images: [
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?q=80&w=1000&auto=format&fit=crop'
    ],
    mrp: 899,
    retailPrice: 429,
    wholesaleTiers: [
      { minQty: 1, maxQty: 4, pricePerUnit: 429, savingsPercent: 0, label: 'Single Pack (12 Pcs)' },
      { minQty: 5, maxQty: 19, pricePerUnit: 319, savingsPercent: 26, label: 'Caterer Pack (60 Pcs)' },
      { minQty: 20, pricePerUnit: 259, savingsPercent: 40, label: 'Hotelier Carton (240 Pcs)' }
    ],
    moq: 1,
    stock: 800,
    rating: 4.8,
    reviewCount: 388,
    isBestSeller: true,
    isDirectMillDeal: true,
    hsnCode: '630291',
    gstRate: 5,
    specifications: {
      'Pack Size': '12 Pieces per pack',
      'Size per towel': '18 x 28 inches (45 x 70 cm)',
      'Weave': 'Lint-Free Herringbone Cotton with Center Loop',
      'Color Code': 'Classic White with Blue Stripe'
    },
    tags: ['kitchen towels', 'tea towel', 'bar towel', 'cotton', 'caterer supply', 'restaurant linen']
  },
  {
    id: 'prod-apron-02',
    name: 'Industrial Heavy Cotton Drill Barista & Chef Apron with 3 Storage Pockets',
    slug: 'industrial-cotton-drill-chef-apron',
    sku: 'MLE-KIT-APR-201',
    category: 'home-kitchen',
    categoryName: 'Home and Kitchen',
    subcategory: 'Aprons',
    shortDescription: 'Heavy-duty 260 GSM water & oil resistant cotton bib apron with cross-back ergonomic straps.',
    description: 'Crafted for kitchen staff, baristas, bakers, and factory personnel. Features reinforced bar-tack stitching on all stress points and double chest pencil slots.',
    images: [
      'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=1000&auto=format&fit=crop'
    ],
    mrp: 699,
    retailPrice: 299,
    wholesaleTiers: [
      { minQty: 1, maxQty: 9, pricePerUnit: 299, savingsPercent: 0, label: 'Single Apron' },
      { minQty: 10, maxQty: 49, pricePerUnit: 199, savingsPercent: 33, label: 'Cafe Team Pack' },
      { minQty: 50, pricePerUnit: 149, savingsPercent: 50, label: 'Chain Restaurant Master Pack' }
    ],
    moq: 1,
    stock: 550,
    rating: 4.7,
    reviewCount: 160,
    hsnCode: '621142',
    gstRate: 5,
    specifications: {
      'Fabric': '260 GSM Pure Cotton Twill Drill',
      'Dimensions': '32" L x 27" W (Unisex fit)',
      'Pockets': '2 Kangaroo Pockets + 1 Pen Pocket',
      'Color': 'Deep Charcoal Black / Khaki Tan'
    },
    tags: ['apron', 'chef apron', 'barista', 'kitchen linen', 'restaurant uniform']
  },
  {
    id: 'prod-table-linen-03',
    name: 'Banquet Satin Damask Stain-Resistant Round & Rectangular Table Covers',
    slug: 'banquet-satin-damask-table-cloth',
    sku: 'MLE-KIT-TBL-501',
    category: 'home-kitchen',
    categoryName: 'Home and Kitchen',
    subcategory: 'Table Linen',
    shortDescription: 'Commercial spill-repellent jacquard table cloth for wedding banquets and convention centers.',
    description: 'Woven with elegant tonal damask ivy motifs. Teflon-coated yarn naturally beads spilled liquids, sauces, and wine for instantaneous wipe-clean maintenance without soaking the fabric.',
    images: [
      'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=1000&auto=format&fit=crop'
    ],
    mrp: 1499,
    retailPrice: 699,
    wholesaleTiers: [
      { minQty: 1, maxQty: 4, pricePerUnit: 699, savingsPercent: 0, label: 'Standard' },
      { minQty: 5, maxQty: 19, pricePerUnit: 490, savingsPercent: 30, label: 'Event Planner Set' },
      { minQty: 20, pricePerUnit: 395, savingsPercent: 44, label: 'Hall Contractor Lot' }
    ],
    moq: 1,
    stock: 320,
    rating: 4.8,
    reviewCount: 92,
    hsnCode: '630251',
    gstRate: 12,
    specifications: {
      'Sizes': '60 x 90 inches / 90" Round',
      'Weave': 'Jacquard Satin Damask',
      'Finish': 'Soil-Release & Water Repellent Treatment'
    },
    tags: ['table cloth', 'table linen', 'banquet linen', 'wedding decor', 'caterer supply']
  },

  // ==========================================
  // HOUSEHOLD CATEGORY
  // ==========================================
  {
    id: 'prod-cleaning-cloth-01',
    name: 'Commercial Grade 350 GSM Microfiber Cleaning Cloths (Pack of 24 - 4 Colors)',
    slug: 'commercial-microfiber-cleaning-cloths-pack',
    sku: 'MLE-HSD-CLN-350',
    category: 'household',
    categoryName: 'Household',
    subcategory: 'Cleaning Cloths',
    shortDescription: 'Color-coded ultra-fine split microfiber cloths for scratch-free hospital, hotel, and automotive cleaning.',
    description: 'Color-coded in 4 standard facility management colors (Blue, Yellow, Green, Red) to prevent cross-contamination between restrooms, kitchen counters, and guest bedrooms. 80/20 Polyester-Polyamide blend traps 99% dust without chemicals.',
    images: [
      'https://images.unsplash.com/photo-1585421514738-01798e348b17?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1000&auto=format&fit=crop'
    ],
    mrp: 1299,
    retailPrice: 599,
    wholesaleTiers: [
      { minQty: 1, maxQty: 4, pricePerUnit: 599, savingsPercent: 0, label: 'Single Pack (24 Pcs)' },
      { minQty: 5, maxQty: 19, pricePerUnit: 420, savingsPercent: 30, label: 'Housekeeping Box (120 Pcs)' },
      { minQty: 20, pricePerUnit: 340, savingsPercent: 43, label: 'Facility Master Bale (480 Pcs)' }
    ],
    moq: 1,
    stock: 1500,
    rating: 4.9,
    reviewCount: 460,
    isBestSeller: true,
    isDirectMillDeal: true,
    hsnCode: '630710',
    gstRate: 12,
    specifications: {
      'Density': '350 GSM Split Microfiber',
      'Dimensions': '40 cm x 40 cm (16 x 16 inches)',
      'Blend': '80% Polyester, 20% Polyamide',
      'Color Coding': '6 Blue, 6 Yellow, 6 Green, 6 Red per pack'
    },
    tags: ['microfiber', 'cleaning cloth', 'housekeeping', 'facility management', 'car cleaning']
  },
  {
    id: 'prod-dusters-02',
    name: 'Electrostatic Bendable Microfiber Ceiling & Fan Duster with Telescopic Stainless Pole',
    slug: 'electrostatic-microfiber-fan-duster-pole',
    sku: 'MLE-HSD-DST-801',
    category: 'household',
    categoryName: 'Household',
    subcategory: 'Microfiber Dusters',
    shortDescription: '100-inch extendable high-reach feather duster head with bendable silicone core.',
    description: 'Effortlessly clean high ceilings, cobwebs, chandelier lights, AC vents, and ceiling fan blades without ladders. Electrostatic microfiber attracts dust particles instead of dispersing them into the air.',
    images: [
      'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?q=80&w=1000&auto=format&fit=crop'
    ],
    mrp: 799,
    retailPrice: 389,
    wholesaleTiers: [
      { minQty: 1, maxQty: 9, pricePerUnit: 389, savingsPercent: 0, label: 'Single Unit' },
      { minQty: 10, maxQty: 49, pricePerUnit: 260, savingsPercent: 33, label: 'Reseller Bundle' },
      { minQty: 50, pricePerUnit: 195, savingsPercent: 50, label: 'Distributor Carton' }
    ],
    moq: 1,
    stock: 620,
    rating: 4.6,
    reviewCount: 110,
    hsnCode: '960390',
    gstRate: 18,
    specifications: {
      'Extendable Reach': 'Adjustable from 30 inches to 100 inches',
      'Head Type': 'Bendable 360° washable microfiber head',
      'Shaft': 'Corrosion-resistant stainless steel with rubberized grip'
    },
    tags: ['duster', 'microfiber duster', 'ceiling duster', 'cleaning equipment', 'household essentials']
  },
  {
    id: 'prod-storage-03',
    name: 'Reinforced Canvas Foldable Laundry Hamper & Quilt Storage Organizer (Pack of 3)',
    slug: 'reinforced-canvas-laundry-hamper-organizer-set',
    sku: 'MLE-HSD-STR-303',
    category: 'household',
    categoryName: 'Household',
    subcategory: 'Storage and Laundry',
    shortDescription: 'Breathable 80-liter cotton canvas storage bags with transparent view window and dual sturdy handles.',
    description: 'Heavy duty moisture-resistant storage containers engineered for storing seasonal winter quilts, heavy double bedsheets, garments, and hotel spare linen. Dust-proof zippered top.',
    images: [
      'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=1000&auto=format&fit=crop'
    ],
    mrp: 1199,
    retailPrice: 549,
    wholesaleTiers: [
      { minQty: 1, maxQty: 4, pricePerUnit: 549, savingsPercent: 0, label: '3-Piece Set' },
      { minQty: 5, maxQty: 19, pricePerUnit: 399, savingsPercent: 27, label: 'Retailer 5-Set Lot' },
      { minQty: 20, pricePerUnit: 310, savingsPercent: 44, label: 'Bulk Institutional' }
    ],
    moq: 1,
    stock: 410,
    rating: 4.7,
    reviewCount: 138,
    hsnCode: '630790',
    gstRate: 12,
    specifications: {
      'Capacity': '80 Liters each (Pack contains 3 organizers)',
      'Dimensions': '60 x 43 x 35 cm each',
      'Material': 'Three-ply non-woven & cotton composite with PVC window'
    },
    tags: ['storage', 'laundry hamper', 'quilt bag', 'home storage', 'wardrobe organizer']
  },
  {
    id: 'prod-swatch-box-01',
    name: 'Mahalaxmi Enterprises Official Mill Fabric Swatch & Quality Assurance Sample Kit (100% Refundable)',
    slug: 'mill-fabric-swatch-sample-kit',
    sku: 'MLE-SWATCH-KIT-01',
    category: 'textile',
    categoryName: 'Textile',
    subcategory: 'Fabrics',
    shortDescription: '12 curated fabric swatches including 300 TC Combed Cotton, 600 GSM Terry, Canvas & Microfiber with Mill Quality Certificate.',
    description: 'Designed specifically for B2B procurement managers, hotel executives, and retail shop owners. Feel the hand-touch, inspect GSM weights, test bleach tolerance, and verify weave density before committing to large commercial orders. Includes ₹199 discount code applicable on your first wholesale order.',
    images: [
      'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=1000&auto=format&fit=crop'
    ],
    mrp: 499,
    retailPrice: 199,
    wholesaleTiers: [
      { minQty: 1, maxQty: 5, pricePerUnit: 199, savingsPercent: 60, label: 'Standard Sample Box' },
      { minQty: 6, pricePerUnit: 149, savingsPercent: 70, label: 'Multi-Location Audit Kit' }
    ],
    moq: 1,
    stock: 150,
    rating: 4.9,
    reviewCount: 420,
    isBestSeller: true,
    isDirectMillDeal: true,
    isTrending: true,
    hsnCode: '630790',
    gstRate: 5,
    specifications: {
      'Contents': '12 Fabric Swatches (15x15 cm each)',
      'Included Materials': '300 TC Combed Sateen, 210 TC Percale, 600 GSM Combed Terry, 380 GSM Canvas, 350 GSM Microfiber',
      'Documentation': 'Mill Technical Test Report & Fabric Weight (GSM) Certificate',
      'Rebate Policy': '₹199 Cash Coupon included for your next order > ₹5,000'
    },
    tags: ['swatch', 'sample', 'fabric sample', 'mill kit', 'b2b testing']
  },
  {
    id: 'prod-sample-bundle-all',
    name: 'Mahalaxmi Enterprises Complete Commercial Sample Bundle (All 4 Categories Swatch & Product Minis Box)',
    slug: 'mill-commercial-sample-bundle',
    sku: 'MLE-BUNDLE-SMP-01',
    category: 'textile',
    categoryName: 'Textile',
    subcategory: 'Sample Bundles',
    shortDescription: 'The ultimate commercial evaluation box: 12 fabric swatches + 4 actual product minis across Home, Textile, Cotton & Household with ₹300 Rebate Voucher.',
    description: 'Procurement-grade sample bundle designed for corporate clients, hospitality chains, and garment retailers. Includes: (1) Full set of 12 luxury fabric swatches, (2) One 600 GSM Cotton Hand Towel, (3) One Heavy-Duty Microfiber Cloth, (4) One Chef-Grade Kitchen Wipe, and (5) Mill Technical Report & Lab Certification. Fully refundable via an included ₹300 coupon code on your first wholesale order.',
    images: [
      'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?q=80&w=1000&auto=format&fit=crop'
    ],
    mrp: 999,
    retailPrice: 299,
    wholesaleTiers: [
      { minQty: 1, maxQty: 3, pricePerUnit: 299, savingsPercent: 70, label: 'Single Sample Bundle' },
      { minQty: 4, pricePerUnit: 249, savingsPercent: 75, label: 'Multi-Branch Audit Pack' }
    ],
    moq: 1,
    stock: 200,
    rating: 5.0,
    reviewCount: 310,
    isBestSeller: true,
    isDirectMillDeal: true,
    isTrending: true,
    hsnCode: '630790',
    gstRate: 5,
    specifications: {
      'Bundle Contents': '12 Swatches (15x15cm) + 1 Cotton Towel + 1 Microfiber + 1 Kitchen Wipe',
      'Quality Standard': 'ISO 9001:2015 & Oeko-Tex Standard 100 Certified',
      'Rebate Guarantee': '100% Refundable via ₹300 Instant Voucher on next bulk order',
      'Dispatch Speed': 'Same-Day Air Express Dispatch from Ahmedabad Mill'
    },
    tags: ['sample bundle', 'sample pack', 'swatch kit', 'commercial sample', 'b2b testing', 'bundle']
  }
];

export const CATEGORIES_CONFIG = [
  {
    id: 'textile',
    name: 'Textile',
    tagline: 'Bags, Covers & Household Textile Products',
    icon: 'Layers',
    image: '/assets/images/banner_textile.jpg',
    subcategories: ['Double Bedsheets', 'Curtains', 'Premium Linen', 'Fabrics', 'Sample Bundles'],
    description: 'Browse source-listed tote bags, saree covers, carry bags and related products. Product details and availability may need confirmation.'
  },
  {
    id: 'cotton-products',
    name: 'Cotton Products',
    tagline: 'Cotton Products & Household Essentials',
    icon: 'Feather',
    image: '/assets/images/banner_cotton.jpg',
    subcategories: ['Cotton Bath Towels', 'Canvas Bags', 'Cotton Essentials', 'Direct Mill Goods'],
    description: 'Browse cotton household products and source-listed product details. Confirm specifications, current availability and pricing before ordering.'
  },
  {
    id: 'home-kitchen',
    name: 'Home and Kitchen',
    tagline: 'Kitchen Covers, Aprons & Food Preparation Products',
    icon: 'UtensilsCrossed',
    image: '/assets/images/banner_home_kitchen.jpg',
    subcategories: ['Kitchen Towels', 'Aprons', 'Table Linen'],
    description: 'Browse source-listed kitchen covers, aprons and food-preparation products. Confirm specifications, availability and current prices before ordering.'
  },
  {
    id: 'roti-covers',
    name: 'Roti Covers',
    tagline: 'Cotton Roti and Chapati Covers',
    icon: 'UtensilsCrossed',
    image: 'https://cdn.shopify.com/s/files/1/0747/9472/9639/files/35480734-4cad-4ee7-9ec3-c3b53c2a6b3d.webp?v=1792060590',
    subcategories: ['Cotton Chapati Cover'],
    description: 'Cotton roti and chapati covers.'
  },
  {
    id: 'household',
    name: 'Household',
    tagline: 'Storage Bags & Household Products',
    icon: 'Sparkles',
    image: '/assets/images/banner_household.jpg',
    subcategories: ['Cleaning Cloths', 'Microfiber Dusters', 'Storage and Laundry'],
    description: 'Browse source-listed storage bags and household products. Confirm specifications, availability and current prices before ordering.'
  }
];
