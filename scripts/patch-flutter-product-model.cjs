const fs = require('fs');
const file = 'C:/mahalaxmi_enterprises/lib/models/product_model.dart';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('static double getCustomizationCharge')) {
  const target = '  double priceForQuantity(int quantity) {';
  const addition = `  static double getCustomizationCharge(String? type) {
    if (type == null) return 0.0;
    switch (type.trim()) {
      case 'Only Logo':
      case 'Only Logo Print':
        return 12.0;
      case 'Only Design':
        return 22.0;
      case 'Design & Logo':
        return 32.0;
      case 'Embroidery Branding':
      case 'Embroidery':
        return 42.0;
      case 'Custom Weave & GSM':
      case 'Weave & GSM':
        return 55.0;
      case 'No Customization':
      case 'Standard Pack':
      default:
        return 0.0;
    }
  }

  static double getSizeAddonCharge(String? selectedSize) {
    if (selectedSize == null) return 0.0;
    final lower = selectedSize.toLowerCase();
    if (lower.contains('custom')) {
      return 20.0;
    }
    return 0.0;
  }

  static double calculateTotalCustomizationCharge({
    String? customizationType,
    String? selectedSize,
  }) {
    return getCustomizationCharge(customizationType) + getSizeAddonCharge(selectedSize);
  }

  double priceForQuantity(int quantity) {`;

  content = content.replace(target, addition);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Successfully patched product_model.dart');
} else {
  console.log('product_model.dart already has customization charge methods');
}
