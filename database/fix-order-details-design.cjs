const fs = require('fs');
const path = require('path');

const flutterRoot = 'C:\\mahalaxmi_enterprises';

// -------------------------------------------------------------------------
// 1. Clean app_storage_service.dart
// -------------------------------------------------------------------------
const storageFile = path.join(flutterRoot, 'lib', 'services', 'app_storage_service.dart');
if (fs.existsSync(storageFile)) {
  let content = fs.readFileSync(storageFile, 'utf8');

  content = content.replace(/'â‚¹\$\{/g, "'₹${");
  content = content.replace(/â„–/g, '#');
  content = content.replace(/â‚¹/g, '₹');

  fs.writeFileSync(storageFile, content, 'utf8');
  console.log('✓ Cleaned encoding in app_storage_service.dart');
}

// -------------------------------------------------------------------------
// 2. Redesign _buildOrderItemCard in order_details_screen.dart
// -------------------------------------------------------------------------
const orderDetailsFile = path.join(flutterRoot, 'lib', 'screens', 'orders', 'order_details_screen.dart');
if (fs.existsSync(orderDetailsFile)) {
  let content = fs.readFileSync(orderDetailsFile, 'utf8');

  // Clean any â characters in order_details_screen.dart
  content = content.replace(/â„–/g, '#');
  content = content.replace(/â‚¹/g, '₹');

  // Replace _buildOrderItemCard
  const cardStart = '  // Individual Order Item Card Matching Figma Prototype Layout';
  const cardEnd = '  // Info Details Row Helper Component';

  const startIndex = content.indexOf(cardStart);
  const endIndex = content.indexOf(cardEnd);

  if (startIndex === -1 || endIndex === -1) {
    console.error('Could not locate _buildOrderItemCard boundaries! startIndex:', startIndex, 'endIndex:', endIndex);
    process.exit(1);
  }

  const newCardCode = `  // Individual Order Item Card (Clean, Responsive, Zero-Overlap Design)
  Widget _buildOrderItemCard(Map<String, dynamic> item) {
    final String rawPrice = (item['price'] as String? ?? '₹0.00')
        .replaceAll('â‚¹', '₹')
        .replaceAll(r'$', '₹');
    final String title = item['title'] as String? ?? 'Product';
    final String brand = item['brand'] as String? ?? 'Mahalaxmi Enterprise';
    final String color = item['color'] as String? ?? 'No Customization';
    final String size = item['size'] as String? ?? 'Standard';
    final int units = item['units'] as int? ?? 1;

    final bool isSamplePiece = color.toLowerCase().contains('sample request') || color.toLowerCase().contains('sample (1 pc)');
    final bool isSampleBundle = color.toLowerCase().contains('commercial sample') || title.toLowerCase().contains('sample bundle');

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isSampleBundle
              ? const Color(0xFFDDD6FE)
              : isSamplePiece
                  ? const Color(0xFFBBF7D0)
                  : const Color(0xFFE2E8F0),
          width: (isSampleBundle || isSamplePiece) ? 1.2 : 1.0,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Left Product Thumbnail Container
            ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: Container(
                width: 68,
                height: 68,
                color: isSampleBundle
                    ? const Color(0xFFFAF5FF)
                    : isSamplePiece
                        ? const Color(0xFFF0FDF4)
                        : const Color(0xFFF8FAFC),
                child: Center(
                  child: Icon(
                    isSampleBundle
                        ? Icons.all_inbox_rounded
                        : isSamplePiece
                            ? Icons.inventory_2_outlined
                            : (item['icon'] as IconData? ?? Icons.inventory_2_rounded),
                    size: 30,
                    color: isSampleBundle
                        ? const Color(0xFF7C3AED)
                        : isSamplePiece
                            ? const Color(0xFF16A34A)
                            : const Color(0xFF475569),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),

            // Right Details Column (Title, Price, Brand, Non-Overlapping Chips)
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Row 1: Product Title & Price
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(
                          title,
                          style: const TextStyle(
                            fontSize: 13.5,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF1E293B),
                            height: 1.25,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        rawPrice,
                        style: TextStyle(
                          fontSize: 14.5,
                          fontWeight: FontWeight.w900,
                          color: isSampleBundle
                              ? const Color(0xFF7C3AED)
                              : isSamplePiece
                                  ? const Color(0xFF16A34A)
                                  : const Color(0xFF0F172A),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 3),

                  // Brand Label
                  Text(
                    brand,
                    style: const TextStyle(
                      fontSize: 11,
                      color: Color(0xFF94A3B8),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 8),

                  // Row 3: Specifications and Chips (Never overlapping!)
                  Wrap(
                    spacing: 6,
                    runSpacing: 5,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      // Sample/Customization Tag
                      if (isSamplePiece)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                          decoration: BoxDecoration(
                            color: const Color(0xFFDCFCE7),
                            borderRadius: BorderRadius.circular(5),
                          ),
                          child: const Text(
                            'Sample (1 Pc)',
                            style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF15803D)),
                          ),
                        )
                      else if (isSampleBundle)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF3E8FF),
                            borderRadius: BorderRadius.circular(5),
                          ),
                          child: const Text(
                            'Commercial Sample Bundle',
                            style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF7E22CE)),
                          ),
                        )
                      else if (color != 'No Customization')
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(5),
                          ),
                          child: Text(
                            color,
                            style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: Color(0xFF334155)),
                          ),
                        ),

                      // Size Pill
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                          borderRadius: BorderRadius.circular(5),
                        ),
                        child: Text(
                          'Size: $size',
                          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: Color(0xFF475569)),
                        ),
                      ),

                      // Units Count
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                          borderRadius: BorderRadius.circular(5),
                        ),
                        child: Text(
                          'Units: $units',
                          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

`;

  content = content.slice(0, startIndex) + newCardCode + content.slice(endIndex);
  fs.writeFileSync(orderDetailsFile, content, 'utf8');
  console.log('✓ Successfully redesigned _buildOrderItemCard in order_details_screen.dart');
}
