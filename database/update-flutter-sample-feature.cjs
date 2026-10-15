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
      description: 'The ultimate procurement-grade sample bundle: 12 physical fabric swatches across Bedsheets, Towels, Canvas & Microfiber + 4 actual product minis + Mill Lab GSM Certificate + 100% Refund Voucher code (SAMPLE100) credited back on your first wholesale order.',
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
      description: 'The ultimate procurement-grade sample bundle: 12 physical fabric swatches across Bedsheets, Towels, Canvas & Microfiber + 4 actual product minis + Mill Lab GSM Certificate + 100% Refund Voucher code (SAMPLE100) credited back on your first wholesale order.',
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

// 2. Update cart_screen.dart (SAMPLE100 coupon code & promo sheet card)
const cartScreenPath = path.join(flutterRoot, 'lib', 'screens', 'cart', 'cart_screen.dart');
if (fs.existsSync(cartScreenPath)) {
  let content = fs.readFileSync(cartScreenPath, 'utf8');

  if (!content.includes('SAMPLE100')) {
    // A. Update _applyCoupon
    const couponTarget = "if (code == 'MAHALAXMI10' || code == 'B2B10') {";
    const couponReplacement = `if (code == 'SAMPLE100' || code == 'SAMPLEKIT' || code == 'SAMPLEREBATE') {
      setState(() {
        _isCouponApplied = true;
        _discountAmount = 300.0;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('🎉 100% Sample Rebate Applied! ₹300.00 credited back to your order.'),
          backgroundColor: AppTheme.success,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    if (code == 'MAHALAXMI10' || code == 'B2B10') {`;

    if (content.includes(couponTarget)) {
      content = content.replace(couponTarget, couponReplacement);
    }

    // B. Add promo card in _showPromoCodesBottomSheet
    const promoListTarget = 'final List<Map<String, dynamic>> promoList = [';
    const promoListReplacement = `final List<Map<String, dynamic>> promoList = [
      {
        'discount': '₹300 OFF',
        'title': '100% Sample Rebate Credit',
        'code': 'SAMPLE100',
        'saved': 300.0,
        'validity': 'Valid on wholesale bulk orders (100% Rebate)',
        'color': const Color(0xFF7C3AED),
      },`;

    if (content.includes(promoListTarget)) {
      content = content.replace(promoListTarget, promoListReplacement);
    }

    fs.writeFileSync(cartScreenPath, content, 'utf8');
    console.log('✓ Successfully updated cart_screen.dart with SAMPLE100 coupon');
  }
}

console.log('Flutter sample feature base script executed.');
