const fs = require('fs');
const path = require('path');

const targetFile = 'C:\\mahalaxmi_enterprises\\lib\\screens\\product\\product_details_screen.dart';
let code = fs.readFileSync(targetFile, 'utf8');

// Find the start: // B2B QUICK ACTION BAR
const startMarker = '// B2B QUICK ACTION BAR';
const endMarker = '// Trust & Business Assurance Badges Box';

const startIndex = code.indexOf(startMarker);
const endIndex = code.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error('Markers not found! start:', startIndex, 'end:', endIndex);
  process.exit(1);
}

const replacement = `// ===================================================================
                        // B2B QUALITY TESTING & SAMPLE EVALUATION SUITE
                        // ===================================================================
                        Container(
                          width: double.infinity,
                          margin: const EdgeInsets.symmetric(vertical: 10),
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFFF0FDF4), Color(0xFFDCFCE7)],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0xFF86EFAC), width: 1.2),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF16A34A).withValues(alpha: 0.06),
                                blurRadius: 10,
                                offset: const Offset(0, 3),
                              ),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Header Badge & Title
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF16A34A),
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: const Text(
                                      'ZERO MOQ SAMPLING',
                                      style: TextStyle(color: Colors.white, fontSize: 9.5, fontWeight: FontWeight.w900),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  const Expanded(
                                    child: Text(
                                      'Test Quality Before Bulk Order',
                                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF166534)),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 10),

                              // Card 1: 1-Piece Sample of THIS Product
                              Container(
                                width: double.infinity,
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: const Color(0xFFBBF7D0)),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        const Icon(Icons.inventory_2_outlined, size: 16, color: Color(0xFF166534)),
                                        const SizedBox(width: 6),
                                        Expanded(
                                          child: Text(
                                            'Order 1-Pc Sample: \${p.title}',
                                            style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w800, color: Color(0xFF0F172A)),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                        const SizedBox(width: 4),
                                        Text(
                                          '₹\${p.price.toStringAsFixed(0)}',
                                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Color(0xFF16A34A)),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                    const Text(
                                      'Order just 1 piece without wholesale MOQ to test fabric texture, stitching and wash durability.',
                                      style: TextStyle(fontSize: 10.5, color: Color(0xFF64748B), height: 1.3),
                                    ),
                                    const SizedBox(height: 8),
                                    SizedBox(
                                      width: double.infinity,
                                      child: ElevatedButton.icon(
                                        onPressed: () {
                                          _storage.addToCart(p.id, quantity: 1, customizationType: 'Sample Request (1 Pc)');
                                          ScaffoldMessenger.of(context).showSnackBar(
                                            SnackBar(
                                              content: Text('1-Pc Sample for "\${p.title}" added to Cart!'),
                                              backgroundColor: const Color(0xFF16A34A),
                                              duration: const Duration(seconds: 3),
                                              action: SnackBarAction(
                                                label: 'VIEW CART',
                                                textColor: Colors.white,
                                                onPressed: () => Navigator.pushNamed(context, AppRoutes.cart),
                                              ),
                                            ),
                                          );
                                        },
                                        icon: const Icon(Icons.shopping_bag_outlined, size: 15),
                                        label: Text(
                                          'Order 1-Pc Product Sample (₹\${p.price.toStringAsFixed(0)})',
                                          style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold),
                                        ),
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: const Color(0xFF16A34A),
                                          foregroundColor: Colors.white,
                                          padding: const EdgeInsets.symmetric(vertical: 9),
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                          elevation: 0,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 10),

                              // Card 2: Complete Commercial Sample Bundle Box (All 4 Categories)
                              Container(
                                width: double.infinity,
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: Colors.white,
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
                                        const Expanded(
                                          child: Text(
                                            'Complete Commercial Sample Bundle',
                                            style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w800, color: Color(0xFF5B21B6)),
                                          ),
                                        ),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFF7C3AED),
                                            borderRadius: BorderRadius.circular(4),
                                          ),
                                          child: const Text('100% REFUNDABLE', style: TextStyle(color: Colors.white, fontSize: 8.5, fontWeight: FontWeight.bold)),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                    const Text(
                                      'Includes 12 fabric swatches + 4 product minis + Lab GSM report + ₹300 coupon (SAMPLE100).',
                                      style: TextStyle(fontSize: 10.5, color: Color(0xFF64748B), height: 1.3),
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
                                              duration: const Duration(seconds: 3),
                                              action: SnackBarAction(
                                                label: 'VIEW CART',
                                                textColor: Colors.white,
                                                onPressed: () => Navigator.pushNamed(context, AppRoutes.cart),
                                              ),
                                            ),
                                          );
                                        },
                                        icon: const Icon(Icons.all_inbox_rounded, size: 15),
                                        label: const Text(
                                          'Order Complete Sample Bundle (₹299)',
                                          style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold),
                                        ),
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: const Color(0xFF7C3AED),
                                          foregroundColor: Colors.white,
                                          padding: const EdgeInsets.symmetric(vertical: 9),
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                          elevation: 0,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 8),

                              // WhatsApp Bulk Quote Button
                              InkWell(
                                onTap: () => _showWhatsAppInquirySheet(context, p),
                                borderRadius: BorderRadius.circular(8),
                                child: Container(
                                  width: double.infinity,
                                  padding: const EdgeInsets.symmetric(vertical: 8),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFDCFCE7).withValues(alpha: 0.6),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: const Color(0xFF86EFAC)),
                                  ),
                                  child: const Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(Icons.chat_rounded, color: Color(0xFF16A34A), size: 15),
                                      SizedBox(width: 6),
                                      Text(
                                        'Need Custom Fabric Mill Quote? Chat on WhatsApp',
                                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF166534)),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 14),
                        `;

code = code.slice(0, startIndex) + replacement + code.slice(endIndex);
fs.writeFileSync(targetFile, code, 'utf8');
console.log('✓ Successfully fixed ProductDetailsScreen Sample Evaluation UI!');
