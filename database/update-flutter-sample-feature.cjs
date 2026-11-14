const fs = require('fs');
const path = require('path');

const flutterRoot = 'C:\\mahalaxmi_enterprises';

// 1. Update product_model.dart
const productModelPath = path.join(flutterRoot, 'lib', 'models', 'product_model.dart');
if (fs.existsSync(productModelPath)) {
  let content = fs.readFileSync(productModelPath, 'utf8');

  if (!content.includes('prod-sample-bundle-all')) {
    const target = '    const ProductModel(\n      id: \'prod_12\',';
    const sampleProductsCode = `    const ProductModel(
      id: 'prod-sample-bundle-all',
      title: 'Mahalaxmi Complete Commercial Sample Bundle (All 4 Categories)',
      category: 'Sample Kits',
      subCategory: 'Sample Bundles',
      price: 299,
      originalPrice: 999,
      unitText: 'per complete kit',
      rating: 5.0,
      reviewCount: 310,
      stockStatus: 'IN STOCK (AIR EXPRESS)',
      inStockCount: 200,
      material: '12 Swatches + 4 Product Minis + Lab Certificate',
      moq: '1 Kit (MOQ Bypassed)',
      description: 'The ultimate procurement-grade sample bundle: 12 physical fabric swatches across Bedsheets, Towels, Canvas & Microfiber + 4 actual product minis + Mill Lab GSM Certificate.',
    ),
    const ProductModel(
      id: 'prod-swatch-box-01',
      title: 'Mahalaxmi Fabric Swatch Kit (12 Premium Samples)',
      category: 'Sample Kits',
      subCategory: 'Sample Bundles',
      price: 199,
      originalPrice: 499,
      unitText: 'per box of 12 swatches',
      rating: 4.9,
      reviewCount: 420,
      stockStatus: 'IN STOCK',
      inStockCount: 150,
      material: '300-600 TC & 400-650 GSM Cotton Swatches',
      moq: '1 Box',
      description: 'Physical touch & feel kit: 12 tagged fabric swatches with yarn count, GSM specifications, color fastness ratings and commercial wash test documentation.',
    ),
    const ProductModel(
      id: 'prod_12',`;

    if (content.includes(target)) {
      content = content.replace(target, sampleProductsCode);
      fs.writeFileSync(productModelPath, content, 'utf8');
      console.log('✓ Successfully added sample products to product_model.dart');
    } else {
      console.log('Target for product_model.dart not found directly, checking alternate hook');
      const closingTarget = '    ),\n  ];\n}';
      if (content.includes(closingTarget)) {
        const appended = `    ),
    const ProductModel(
      id: 'prod-sample-bundle-all',
      title: 'Mahalaxmi Complete Commercial Sample Bundle (All 4 Categories)',
      category: 'Sample Kits',
      subCategory: 'Sample Bundles',
      price: 299,
      originalPrice: 999,
      unitText: 'per complete kit',
      rating: 5.0,
      reviewCount: 310,
      stockStatus: 'IN STOCK (AIR EXPRESS)',
      inStockCount: 200,
      material: '12 Swatches + 4 Product Minis + Lab Certificate',
      moq: '1 Kit (MOQ Bypassed)',
      description: 'The ultimate procurement-grade sample bundle: 12 physical fabric swatches across Bedsheets, Towels, Canvas & Microfiber + 4 actual product minis + Mill Lab GSM Certificate.',
    ),
    const ProductModel(
      id: 'prod-swatch-box-01',
      title: 'Mahalaxmi Fabric Swatch Kit (12 Premium Samples)',
      category: 'Sample Kits',
      subCategory: 'Sample Bundles',
      price: 199,
      originalPrice: 499,
      unitText: 'per box of 12 swatches',
      rating: 4.9,
      reviewCount: 420,
      stockStatus: 'IN STOCK',
      inStockCount: 150,
      material: '300-600 TC & 400-650 GSM Cotton Swatches',
      moq: '1 Box',
      description: 'Physical touch & feel kit: 12 tagged fabric swatches with yarn count, GSM specifications, color fastness ratings and commercial wash test documentation.',
    ),
  ];
}`;
        content = content.replace(closingTarget, appended);
        fs.writeFileSync(productModelPath, content, 'utf8');
        console.log('✓ Successfully appended sample products to product_model.dart');
      }
    }
  } else {
    console.log('Sample products already present in product_model.dart');
  }
}

console.log('Flutter sample feature base script executed.');
