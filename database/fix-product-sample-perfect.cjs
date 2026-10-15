const fs = require('fs');

const targetFile = 'C:\\mahalaxmi_enterprises\\lib\\screens\\product\\product_details_screen.dart';
let code = fs.readFileSync(targetFile, 'utf8');

const startMarker = '// ===================================================================\n                        // B2B QUALITY TESTING & SAMPLE EVALUATION SUITE';
const startMarkerCRLF = '// ===================================================================\r\n                        // B2B QUALITY TESTING & SAMPLE EVALUATION SUITE';
const endMarker = '// Trust & Business Assurance Badges Box';

let startIndex = code.indexOf(startMarkerCRLF);
if (startIndex === -1) {
  startIndex = code.indexOf(startMarker);
}
if (startIndex === -1) {
  startIndex = code.indexOf('B2B QUALITY TESTING & SAMPLE EVALUATION SUITE');
  if (startIndex !== -1) {
    startIndex = code.lastIndexOf('// ===================================================================', startIndex);
  }
}

const endIndex = code.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error('Markers not found! start:', startIndex, 'end:', endIndex);
  process.exit(1);
}

const perfectSnippet = `// ===================================================================
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
                                          setState(() {
                                            _storage.addToCart(p.id, quantity: 1, customizationType: 'Sample Request (1 Pc)');
                                          });
                                          ScaffoldMessenger.of(context).showSnackBar(
                                            SnackBar(
                                              content: Text('1-Pc Sample for "\${p.title}" added to cart!'),
                                              backgroundColor: const Color(0xFF10B981),
                                              duration: const Duration(seconds: 2),
                                              behavior: SnackBarBehavior.floating,
                                              margin: const EdgeInsets.only(bottom: 125, left: 16, right: 16),
                                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
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
                                          setState(() {
                                            _storage.addToCart('prod-sample-bundle-all', quantity: 1, customizationType: 'Commercial Sample Bundle');
                                          });
                                          ScaffoldMessenger.of(context).showSnackBar(
                                            SnackBar(
                                              content: const Text('Complete Sample Bundle (₹299) added to cart!'),
                                              backgroundColor: const Color(0xFF10B981),
                                              duration: const Duration(seconds: 2),
                                              behavior: SnackBarBehavior.floating,
                                              margin: const EdgeInsets.only(bottom: 125, left: 16, right: 16),
                                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
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
                              const SizedBox(height: 10),

                              // WhatsApp Bulk Quote Button (Responsive & Never Truncates)
                              InkWell(
                                onTap: () => _showWhatsAppInquirySheet(context, p),
                                borderRadius: BorderRadius.circular(10),
                                child: Container(
                                  width: double.infinity,
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFDCFCE7),
                                    borderRadius: BorderRadius.circular(10),
                                    border: Border.all(color: const Color(0xFF86EFAC), width: 1.1),
                                  ),
                                  child: const Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(Icons.chat_rounded, color: Color(0xFF16A34A), size: 16),
                                      SizedBox(width: 6),
                                      Flexible(
                                        child: FittedBox(
                                          fit: BoxFit.scaleDown,
                                          child: Text(
                                            'Custom Fabric Mill Quote? Chat on WhatsApp',
                                            style: TextStyle(
                                              fontSize: 11.5,
                                              fontWeight: FontWeight.w800,
                                              color: Color(0xFF166534),
                                            ),
                                          ),
                                        ),
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

code = code.slice(0, startIndex) + perfectSnippet + code.slice(endIndex);
fs.writeFileSync(targetFile, code, 'utf8');
console.log('✓ Successfully applied perfect UI fixes to ProductDetailsScreen!');
