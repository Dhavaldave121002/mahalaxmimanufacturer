const fs = require('fs');
const path = require('path');

const flutterRoot = 'C:\\mahalaxmi_enterprises';

// -----------------------------------------------------------------
// 1. UPDATE product_model.dart
// -----------------------------------------------------------------
const productModelPath = path.join(flutterRoot, 'lib', 'models', 'product_model.dart');
if (fs.existsSync(productModelPath)) {
  let content = fs.readFileSync(productModelPath, 'utf8');

  if (!content.includes('prod-sample-bundle-all')) {
    // Look for closing array
    const lastProductMatch = content.lastIndexOf('    const ProductModel(');
    if (lastProductMatch !== -1) {
      const closingBracket = content.lastIndexOf('  ];');
      if (closingBracket !== -1) {
        const sampleProductsCode = `
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
`;
        content = content.slice(0, closingBracket) + sampleProductsCode + content.slice(closingBracket);
        fs.writeFileSync(productModelPath, content, 'utf8');
        console.log('✓ Successfully added sample products to product_model.dart');
      }
    }
  } else {
    console.log('Sample products already in product_model.dart');
  }
}

// -----------------------------------------------------------------
// 2. UPDATE home_screen.dart
// -----------------------------------------------------------------
const homeScreenPath = path.join(flutterRoot, 'lib', 'screens', 'home', 'home_screen.dart');
if (fs.existsSync(homeScreenPath)) {
  let content = fs.readFileSync(homeScreenPath, 'utf8');

  // A. Add Sample Kits category if not present
  if (!content.includes("'name': 'Sample Kits'")) {
    const catTarget = "  final List<Map<String, dynamic>> _categories = [";
    const catReplacement = `  final List<Map<String, dynamic>> _categories = [
    {
      'name': 'Sample Kits',
      'icon': Icons.all_inbox_rounded,
      'color': const Color(0xFFE11D48),
      'count': '2 Kits',
      'image': 'assets/images/banner_textile.jpg',
    },`;
    content = content.replace(catTarget, catReplacement);
    console.log('✓ Added Sample Kits category to home_screen.dart');
  }

  // B. Add keywords if not present
  if (!content.includes("'Sample Kit'")) {
    const kwTarget = "  final List<String> _popularKeywords = [";
    const kwReplacement = `  final List<String> _popularKeywords = [
    'Sample Kit',
    'Sample Bundle',`;
    content = content.replace(kwTarget, kwReplacement);
    console.log('✓ Added Sample Kit keywords to home_screen.dart');
  }

  // C. Update _buildCategoryVectorIcon
  if (!content.includes("case 'Sample Kits':")) {
    const vectorTarget = "    switch (category) {";
    const vectorReplacement = `    switch (category) {
      case 'Sample Kits':
      case 'Sample Bundles':
        imagePath = 'assets/images/banner_textile.jpg';
        icon = Icons.all_inbox_rounded;
        color = const Color(0xFFE11D48);
        break;`;
    content = content.replace(vectorTarget, vectorReplacement);
    console.log('✓ Added Sample Kits to _buildCategoryVectorIcon');
  }

  // D. Add _buildSampleKitsSpotlight widget and invocation
  if (!content.includes('_buildSampleKitsSpotlight')) {
    // 1. Invocation after B2B Quick Services Bar
    const b2bEndMarker = '                const SizedBox(height: 16),\n\n                // RECOMMENDED ITEMS';
    const b2bEndMarkerCRLF = '                const SizedBox(height: 16),\r\n\r\n                // RECOMMENDED ITEMS';

    const spotlightCall = `                const SizedBox(height: 16),

                // B2B SAMPLE KITS & COMMERCIAL TESTING BUNDLES SPOTLIGHT
                _buildSampleKitsSpotlight(context),

                const SizedBox(height: 16),

                // RECOMMENDED ITEMS`;

    if (content.includes(b2bEndMarkerCRLF)) {
      content = content.replace(b2bEndMarkerCRLF, spotlightCall);
    } else if (content.includes(b2bEndMarker)) {
      content = content.replace(b2bEndMarker, spotlightCall);
    } else {
      // Find fallback hook before RECOMMENDED ITEMS
      const recHeader = '// RECOMMENDED ITEMS / SEARCH RESULTS Section Header';
      if (content.includes(recHeader)) {
        content = content.replace(recHeader, `_buildSampleKitsSpotlight(context),\n                const SizedBox(height: 16),\n                ${recHeader}`);
      }
    }

    // 2. Helper widget definition
    const widgetDef = `
  // =========================================================================
  // B2B SAMPLE KITS & COMMERCIAL BUNDLES SPOTLIGHT CARD
  // =========================================================================
  Widget _buildSampleKitsSpotlight(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      child: Container(
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF0F172A), Color(0xFF1E1B4B), Color(0xFF311042)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFF6366F1).withOpacity(0.3), width: 1.5),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF311042).withOpacity(0.25),
              blurRadius: 15,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Badge & Guarantee Tag
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFBBF24).withOpacity(0.2),
                    border: Border.all(color: const Color(0xFFFBBF24).withOpacity(0.5)),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.verified_rounded, size: 13, color: Color(0xFFFBBF24)),
                      SizedBox(width: 4),
                      Text(
                        'B2B QUALITY ASSURANCE',
                        style: TextStyle(
                          color: Color(0xFFFBBF24),
                          fontSize: 9.5,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ],
                  ),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: const Color(0xFF10B981).withOpacity(0.2),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Text(
                    '100% REBATE VOUCHER',
                    style: TextStyle(
                      color: Color(0xFF34D399),
                      fontSize: 9.5,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),

            // Headline
            const Text(
              'Order Physical Sample Kits & Bundles',
              style: TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.w900,
                letterSpacing: -0.3,
              ),
            ),
            const SizedBox(height: 4),
            const Text(
              'Evaluate weave density, GSM weight & feel before placing bulk orders. 100% sample cost credited back on your first wholesale order (Code: SAMPLE100)!',
              style: TextStyle(
                color: Color(0xFFCBD5E1),
                fontSize: 11.5,
                height: 1.35,
              ),
            ),
            const SizedBox(height: 14),

            // 2 Kit Action Cards (Commercial Bundle ₹299 & Swatch Box ₹199)
            Row(
              children: [
                // Bundle Box Card (₹299)
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFFFBBF24).withOpacity(0.4)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.all_inbox_rounded, size: 14, color: Color(0xFFFBBF24)),
                            SizedBox(width: 4),
                            Text(
                              'Sample Bundle',
                              style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          '12 Swatches + 4 Minis',
                          style: TextStyle(color: Color(0xFF94A3B8), fontSize: 10),
                        ),
                        const SizedBox(height: 6),
                        const Row(
                          children: [
                            Text(
                              '₹299',
                              style: TextStyle(color: Color(0xFFFBBF24), fontSize: 14, fontWeight: FontWeight.w900),
                            ),
                            SizedBox(width: 4),
                            Text(
                              '₹999',
                              style: TextStyle(color: Color(0xFF64748B), fontSize: 10, decoration: TextDecoration.lineThrough),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: () {
                              _storage.addToCart('prod-sample-bundle-all', quantity: 1, customizationType: 'Commercial Sample Bundle');
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: const Text('Complete Sample Bundle (₹299) added to Cart!'),
                                  backgroundColor: const Color(0xFF7C3AED),
                                  duration: const Duration(seconds: 3),
                                  action: SnackBarAction(
                                    label: 'VIEW CART',
                                    textColor: Colors.white,
                                    onPressed: () => Navigator.pushNamed(context, AppRoutes.cart),
                                  ),
                                ),
                              );
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFFBBF24),
                              foregroundColor: const Color(0xFF0F172A),
                              padding: const EdgeInsets.symmetric(vertical: 6),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                            child: const Text('Add (₹299)', style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w900)),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 10),

                // Swatch Box Card (₹199)
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: Colors.white.withOpacity(0.15)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.layers_rounded, size: 14, color: Color(0xFF818CF8)),
                            SizedBox(width: 4),
                            Text(
                              'Swatch Kit',
                              style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          '12 Pure Cotton Cuts',
                          style: TextStyle(color: Color(0xFF94A3B8), fontSize: 10),
                        ),
                        const SizedBox(height: 6),
                        const Row(
                          children: [
                            Text(
                              '₹199',
                              style: TextStyle(color: Color(0xFF818CF8), fontSize: 14, fontWeight: FontWeight.w900),
                            ),
                            SizedBox(width: 4),
                            Text(
                              '₹499',
                              style: TextStyle(color: Color(0xFF64748B), fontSize: 10, decoration: TextDecoration.lineThrough),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: () {
                              _storage.addToCart('prod-swatch-box-01', quantity: 1, customizationType: 'Fabric Swatch Kit');
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: const Text('Fabric Swatch Kit (₹199) added to Cart!'),
                                  backgroundColor: const Color(0xFF4F46E5),
                                  duration: const Duration(seconds: 3),
                                  action: SnackBarAction(
                                    label: 'VIEW CART',
                                    textColor: Colors.white,
                                    onPressed: () => Navigator.pushNamed(context, AppRoutes.cart),
                                  ),
                                ),
                              );
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF4F46E5),
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 6),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                            child: const Text('Add (₹199)', style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w900)),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Bottom trust strip
            const Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Icon(Icons.flight_takeoff_rounded, size: 12, color: Color(0xFF94A3B8)),
                    SizedBox(width: 4),
                    Text('24h Air Express', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 9.5)),
                  ],
                ),
                Row(
                  children: [
                    Icon(Icons.assignment_turned_in_rounded, size: 12, color: Color(0xFF34D399)),
                    SizedBox(width: 4),
                    Text('Lab GSM Report Enclosed', style: TextStyle(color: Color(0xFF34D399), fontSize: 9.5)),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
`;

    // Append widget definition at end of State class before closing bracket
    const lastClosing = content.lastIndexOf('}');
    if (lastClosing !== -1) {
      content = content.slice(0, lastClosing) + widgetDef + '\n}\n';
      fs.writeFileSync(homeScreenPath, content, 'utf8');
      console.log('✓ Successfully injected _buildSampleKitsSpotlight into home_screen.dart');
    }
  }
}

// -----------------------------------------------------------------
// 3. UPDATE product_details_screen.dart (Sample Bundle box)
// -----------------------------------------------------------------
const detailsScreenPath = path.join(flutterRoot, 'lib', 'screens', 'product', 'product_details_screen.dart');
if (fs.existsSync(detailsScreenPath)) {
  let content = fs.readFileSync(detailsScreenPath, 'utf8');

  if (!content.includes('B2B Sample Bundle Box (₹299)')) {
    const quickBarTarget = '// 2. Direct WhatsApp Quote';
    const quickBarTargetFull = `// 2. Direct WhatsApp Quote`;

    const sampleBundleBox = `// Full Sample Bundle Promotion Box
                        Container(
                          margin: const EdgeInsets.only(top: 10),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF5F3FF),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFFDDD6FE)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  const Icon(Icons.all_inbox_rounded, size: 16, color: Color(0xFF7C3AED)),
                                  const SizedBox(width: 6),
                                  const Text(
                                    'B2B Sample Bundle Box (₹299)',
                                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: Color(0xFF5B21B6)),
                                  ),
                                  const Spacer(),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF10B981),
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: const Text('100% REFUNDABLE', style: TextStyle(color: Colors.white, fontSize: 8.5, fontWeight: FontWeight.bold)),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              const Text(
                                'Want to evaluate all fabrics before bulk order? Get our 12 Swatches + 4 Product Minis testing box with ₹300 rebate voucher (SAMPLE100).',
                                style: TextStyle(fontSize: 10.5, color: Color(0xFF4B5563)),
                              ),
                              const SizedBox(height: 8),
                              SizedBox(
                                width: double.infinity,
                                child: ElevatedButton.icon(
                                  onPressed: () {
                                    _storage.addToCart('prod-sample-bundle-all', quantity: 1, customizationType: 'Commercial Sample Bundle');
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: const Text('Complete Commercial Sample Bundle (₹299) added to Cart!'),
                                        backgroundColor: const Color(0xFF7C3AED),
                                        action: SnackBarAction(
                                          label: 'VIEW CART',
                                          textColor: Colors.white,
                                          onPressed: () => Navigator.pushNamed(context, AppRoutes.cart),
                                        ),
                                      ),
                                    );
                                  },
                                  icon: const Icon(Icons.all_inbox_rounded, size: 14),
                                  label: const Text('Order Complete Sample Bundle (₹299)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF7C3AED),
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(vertical: 8),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 12),

                        // 2. Direct WhatsApp Quote`;

    if (content.includes(quickBarTarget)) {
      content = content.replace(quickBarTarget, sampleBundleBox);
      fs.writeFileSync(detailsScreenPath, content, 'utf8');
      console.log('✓ Successfully added sample bundle box to product_details_screen.dart');
    }
  }
}

console.log('Flutter sample full integration script completed.');
