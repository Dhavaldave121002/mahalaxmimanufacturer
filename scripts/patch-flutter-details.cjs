const fs = require('fs');
const file = 'C:/mahalaxmi_enterprises/lib/screens/product/product_details_screen.dart';
let content = fs.readFileSync(file, 'utf8');

// 1. Add _calculateCustomizationAddon method before build method
if (!content.includes('double _calculateCustomizationAddon(ProductModel p)')) {
  const target = '  @override\n  Widget build(BuildContext context) {';
  const helper = `  double _calculateCustomizationAddon(ProductModel p) {
    final effectiveSize = p.isImportedCatalogProduct
        ? _customizationType == 'No Customization'
            ? 'Standard'
            : _importedEffectiveSize()
        : _selectedSize == 'Custom' && _customSizeController.text.trim().isNotEmpty
            ? 'Custom (\${_customSizeController.text.trim()})'
            : _selectedSize;
    return ProductModel.calculateTotalCustomizationCharge(
      customizationType: _customizationType,
      selectedSize: effectiveSize,
    );
  }

  @override
  Widget build(BuildContext context) {`;
  content = content.replace(target, helper);
}

// 2. Update displayedPrice in build()
const targetDisplayedPrice = '    final displayedPrice = p.priceForQuantity(_selectedQuantity);';
const replacementDisplayedPrice = `    final basePrice = p.priceForQuantity(_selectedQuantity);
    final customAddon = _calculateCustomizationAddon(p);
    final displayedPrice = basePrice + customAddon;`;

if (content.includes(targetDisplayedPrice)) {
  content = content.replace(targetDisplayedPrice, replacementDisplayedPrice);
}

// 3. Update total in _buildQuantitySelector
const targetQtyTotal = `'Total: \\u20B9\${(product.priceForQuantity(_selectedQuantity) * _selectedQuantity).toStringAsFixed(0)}',`;
const replacementQtyTotal = `'Total: \\u20B9\${((product.priceForQuantity(_selectedQuantity) + _calculateCustomizationAddon(product)) * _selectedQuantity).toStringAsFixed(0)}',`;

if (content.includes(targetQtyTotal)) {
  content = content.replace(targetQtyTotal, replacementQtyTotal);
}

// 4. Update _buildImportedCustomizationStudio chips to show badge
const targetImportedChips = `            children: options.map((option) {
              return ChoiceChip(
                label: Text(option, style: const TextStyle(fontSize: 10)),
                selected: _customizationType == option,
                onSelected: (_) => setState(() => _customizationType = option),
              );
            }).toList(),`;

const replacementImportedChips = `            children: options.map((option) {
              final charge = ProductModel.getCustomizationCharge(option);
              final badge = charge > 0 ? ' (+₹\${charge.toStringAsFixed(0)}/pc)' : ' (Free)';
              return ChoiceChip(
                label: Text('\$option\$badge', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600)),
                selected: _customizationType == option,
                onSelected: (_) => setState(() => _customizationType = option),
              );
            }).toList(),`;

if (content.includes(targetImportedChips)) {
  content = content.replace(targetImportedChips, replacementImportedChips);
}

// 5. Update _buildTypeChip to show badge
const targetTypeChip = `  Widget _buildTypeChip(String label, IconData icon) {
    final isSelected = _customizationType == label;
    return ChoiceChip(
      showCheckmark: false,
      avatar: Icon(
        icon,
        size: 14,
        color: isSelected ? Colors.white : AppTheme.primaryPurple,
      ),
      label: Text(
        label,
        style: TextStyle(
          color: isSelected ? Colors.white : AppTheme.textPrimary,
          fontSize: 12,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
        ),
      ),`;

const replacementTypeChip = `  Widget _buildTypeChip(String label, IconData icon) {
    final isSelected = _customizationType == label;
    final charge = ProductModel.getCustomizationCharge(label);
    final badge = charge > 0 ? ' (+₹\${charge.toStringAsFixed(0)}/pc)' : ' (Free)';
    return ChoiceChip(
      showCheckmark: false,
      avatar: Icon(
        icon,
        size: 14,
        color: isSelected ? Colors.white : AppTheme.primaryPurple,
      ),
      label: Text(
        '\$label\$badge',
        style: TextStyle(
          color: isSelected ? Colors.white : AppTheme.textPrimary,
          fontSize: 12,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
        ),
      ),`;

if (content.includes(targetTypeChip)) {
  content = content.replace(targetTypeChip, replacementTypeChip);
}

// 6. Update _buildSizeChip for Custom (+₹20/pc)
const targetSizeChip = `  Widget _buildSizeChip(String size) {
    final isSelected = _selectedSize == size;
    return ChoiceChip(
      showCheckmark: false,
      label: Text(
        size,
        style: TextStyle(
          color: isSelected ? Colors.white : AppTheme.primaryNavy,
          fontSize: 12,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
        ),
      ),`;

const replacementSizeChip = `  Widget _buildSizeChip(String size) {
    final isSelected = _selectedSize == size;
    final isCustom = size == 'Custom';
    final labelText = isCustom ? 'Custom (+₹20/pc)' : size;
    return ChoiceChip(
      showCheckmark: false,
      label: Text(
        labelText,
        style: TextStyle(
          color: isSelected ? Colors.white : AppTheme.primaryNavy,
          fontSize: 12,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
        ),
      ),`;

if (content.includes(targetSizeChip)) {
  content = content.replace(targetSizeChip, replacementSizeChip);
}

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully patched product_details_screen.dart');
