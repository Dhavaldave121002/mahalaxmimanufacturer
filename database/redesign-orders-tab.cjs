const fs = require('fs');

// 1. Redesign home_screen.dart _buildOrdersView
const homePath = 'C:/mahalaxmi_enterprises/lib/screens/home/home_screen.dart';
let homeContent = fs.readFileSync(homePath, 'utf8');

// Replace default selected order tab to 'All'
homeContent = homeContent.replace(
  "String _selectedOrderTab =\n      'Delivered'; // 'Delivered', 'Processing', 'Cancelled'",
  "String _selectedOrderTab = 'All'; // 'All', 'Processing', 'Delivered', 'Cancelled'"
);
homeContent = homeContent.replace(
  "String _selectedOrderTab = 'Delivered';",
  "String _selectedOrderTab = 'All';"
);

// Replace № with #
homeContent = homeContent.split('Order №').join('Order #');

// Redesign _buildOrdersView
const startTag = 'Widget _buildOrdersView() {';
const endTag = 'Widget _buildProfileView() {';

const startIndex = homeContent.indexOf(startTag);
const endIndex = homeContent.indexOf(endTag);

if (startIndex === -1 || endIndex === -1) {
  console.error('Could not find boundaries in home_screen.dart!');
  process.exit(1);
}

const newOrdersView = `Widget _buildOrdersView() {
    final List<Map<String, dynamic>> allOrders = [
      ..._storage.placedOrders.map((o) => o.toMap()),
      {
        'orderNo': 'Order #1947034',
        'date': '05-12-2019',
        'trackingNo': 'IW3475453455',
        'quantity': 3,
        'totalAmount': '₹112.00',
        'status': 'Delivered',
        'statusColor': const Color(0xFF2AA952),
      },
      {
        'orderNo': 'Order #1947035',
        'date': '01-10-2026',
        'trackingNo': 'IW3475459920',
        'quantity': 2,
        'totalAmount': '₹85.00',
        'status': 'Processing',
        'statusColor': const Color(0xFFD97706),
      },
      {
        'orderNo': 'Order #1947036',
        'date': '20-09-2026',
        'trackingNo': 'IW3475451100',
        'quantity': 1,
        'totalAmount': '₹40.00',
        'status': 'Cancelled',
        'statusColor': const Color(0xFFEF4444),
      },
    ];

    final filteredOrders = allOrders.where((o) {
      if (_selectedOrderTab == 'All') return true;
      return o['status'] == _selectedOrderTab;
    }).toList();

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top Header: "My Orders" Title
          const Text(
            'My Orders',
            style: TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.w900,
              color: Color(0xFF0F172A),
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 14),

          // Horizontal Status Filter Pills (All, Processing, Delivered, Cancelled)
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            child: Row(
              children: ['All', 'Processing', 'Delivered', 'Cancelled'].map((tabName) {
                final isSel = _selectedOrderTab == tabName;
                return Padding(
                  padding: const EdgeInsets.only(right: 8.0),
                  child: GestureDetector(
                    onTap: () {
                      setState(() {
                        _selectedOrderTab = tabName;
                      });
                    },
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: isSel
                            ? AppTheme.primaryNavy
                            : const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: isSel ? AppTheme.primaryNavy : const Color(0xFFE2E8F0),
                        ),
                      ),
                      child: Text(
                        tabName,
                        style: TextStyle(
                          color: isSel ? Colors.white : const Color(0xFF475569),
                          fontSize: 12.5,
                          fontWeight: isSel ? FontWeight.w700 : FontWeight.w500,
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),

          const SizedBox(height: 18),

          // List of Clean Non-Overlapping Order Cards
          filteredOrders.isEmpty
              ? Padding(
                  padding: const EdgeInsets.all(40.0),
                  child: Center(
                    child: Column(
                      children: [
                        const Icon(
                          Icons.search_off_rounded,
                          size: 48,
                          color: AppTheme.textMuted,
                        ),
                        const SizedBox(height: 12),
                        Text(
                          _selectedOrderTab == 'All' ? 'No orders found.' : 'No $_selectedOrderTab orders found.',
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            color: Color(0xFF94A3B8),
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  ),
                )
              : ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: filteredOrders.length,
                  itemBuilder: (context, index) {
                    final order = filteredOrders[index];
                    final rawStatus = (order['status'] as String? ?? 'Processing');
                    final statusColor = (order['statusColor'] as Color? ?? const Color(0xFFD97706));
                    final items = (order['items'] as List<dynamic>?)?.cast<Map<String, dynamic>>() ?? [];
                    final rawTotal = (order['totalAmount'] as String? ?? '₹0.00').replaceAll('â‚¹', '₹');
                    final rawOrderNo = (order['orderNo'] as String? ?? 'Order #').replaceAll('№', '#');

                    String itemsSummary = 'Direct Mill Wholesale Order';
                    if (items.isNotEmpty) {
                      final firstItemTitle = items.first['title'] as String? ?? 'Item';
                      if (items.length == 1) {
                        itemsSummary = firstItemTitle;
                      } else {
                        itemsSummary = '$firstItemTitle + \${items.length - 1} more items';
                      }
                    }

                    return GestureDetector(
                      onTap: () {
                        Navigator.pushNamed(
                          context,
                          AppRoutes.orderDetails,
                          arguments: order,
                        );
                      },
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 16),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.03),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Top Row: Order No (Left) + Status Pill (Right)
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    rawOrderNo,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      fontSize: 15.5,
                                      fontWeight: FontWeight.w900,
                                      color: Color(0xFF0F172A),
                                      letterSpacing: -0.2,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: statusColor.withValues(alpha: 0.12),
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Container(
                                        width: 6,
                                        height: 6,
                                        decoration: BoxDecoration(
                                          shape: BoxShape.circle,
                                          color: statusColor,
                                        ),
                                      ),
                                      const SizedBox(width: 5),
                                      Text(
                                        rawStatus,
                                        style: TextStyle(
                                          color: statusColor,
                                          fontSize: 11.5,
                                          fontWeight: FontWeight.w700,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),

                            // Sub-Row: Date & Tracking
                            Row(
                              children: [
                                const Icon(Icons.calendar_today_rounded, size: 12, color: Color(0xFF94A3B8)),
                                const SizedBox(width: 5),
                                Text(
                                  order['date'] as String? ?? 'Today',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    color: Color(0xFF64748B),
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                const Icon(Icons.local_shipping_outlined, size: 13, color: Color(0xFF94A3B8)),
                                const SizedBox(width: 5),
                                Expanded(
                                  child: Text(
                                    order['trackingNo'] as String? ?? 'Pending',
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: Color(0xFF64748B),
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),

                            // Order Items Summary Box
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF8FAFC),
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: const Color(0xFFF1F5F9)),
                              ),
                              child: Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(7),
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(color: const Color(0xFFE2E8F0)),
                                    ),
                                    child: const Icon(Icons.inventory_2_outlined, size: 18, color: AppTheme.primaryNavy),
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          itemsSummary,
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                          style: const TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.w700,
                                            color: Color(0xFF1E293B),
                                          ),
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          '\${order['quantity']} Units • \${items.isNotEmpty ? '\${items.length} Product\${items.length > 1 ? 's' : ''}' : 'Direct Mill Order'}',
                                          style: const TextStyle(
                                            fontSize: 11,
                                            color: Color(0xFF64748B),
                                            fontWeight: FontWeight.w500,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    rawTotal,
                                    style: const TextStyle(
                                      fontSize: 15,
                                      fontWeight: FontWeight.w900,
                                      color: Color(0xFF0F172A),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 14),

                            // Bottom Action Buttons: Full-width equal distribution (No overlap!)
                            Row(
                              children: [
                                Expanded(
                                  child: OutlinedButton.icon(
                                    onPressed: () {
                                      Navigator.pushNamed(
                                        context,
                                        AppRoutes.orderDetails,
                                        arguments: order,
                                      );
                                    },
                                    icon: const Icon(Icons.receipt_long_rounded, size: 14, color: Color(0xFF0F172A)),
                                    label: const Text(
                                      'Order Details',
                                      style: TextStyle(
                                        color: Color(0xFF0F172A),
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    style: OutlinedButton.styleFrom(
                                      padding: const EdgeInsets.symmetric(vertical: 9),
                                      side: const BorderSide(color: Color(0xFFCBD5E1), width: 1.2),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: ElevatedButton.icon(
                                    onPressed: () {
                                      if (items.isNotEmpty) {
                                        for (var item in items) {
                                          final title = item['title'] as String? ?? '';
                                          final matchedProd = ProductModel.sampleProducts.firstWhere(
                                            (p) => p.title.toLowerCase() == title.toLowerCase() || p.id == title,
                                            orElse: () => ProductModel.sampleProducts.first,
                                          );
                                          _storage.addToCart(
                                            matchedProd.id,
                                            quantity: item['units'] as int? ?? 1,
                                            customizationType: item['color'] as String? ?? 'No Customization',
                                            selectedSize: item['size'] as String? ?? 'Standard',
                                          );
                                        }
                                      } else {
                                        _storage.addToCart(ProductModel.sampleProducts.first.id, quantity: order['quantity'] as int? ?? 1);
                                      }
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        const SnackBar(
                                          content: Text('Items from this order added to Cart!'),
                                          backgroundColor: Color(0xFF10B981),
                                          duration: Duration(seconds: 1),
                                        ),
                                      );
                                      Navigator.pushNamed(context, AppRoutes.cart);
                                    },
                                    icon: const Icon(Icons.replay_rounded, size: 14, color: Colors.white),
                                    label: const Text(
                                      'Reorder',
                                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white),
                                    ),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: AppTheme.primaryNavy,
                                      padding: const EdgeInsets.symmetric(vertical: 9),
                                      elevation: 0,
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
        ],
      ),
    );
  }

  `;

homeContent = homeContent.slice(0, startIndex) + newOrdersView + homeContent.slice(endIndex);
fs.writeFileSync(homePath, homeContent, 'utf8');
console.log('✓ Successfully redesigned _buildOrdersView in home_screen.dart');

// 2. Clean order_details_screen.dart №
const detailsPath = 'C:/mahalaxmi_enterprises/lib/screens/orders/order_details_screen.dart';
let detailsContent = fs.readFileSync(detailsPath, 'utf8');
detailsContent = detailsContent.split('Order №').join('Order #');
fs.writeFileSync(detailsPath, detailsContent, 'utf8');
console.log('✓ Cleaned Order № in order_details_screen.dart');
