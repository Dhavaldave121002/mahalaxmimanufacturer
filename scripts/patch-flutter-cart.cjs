const fs = require('fs');
const file = 'C:/mahalaxmi_enterprises/lib/screens/cart/cart_screen.dart';
let content = fs.readFileSync(file, 'utf8');

const targetModel = `  double get unitPrice => product.priceForQuantity(quantity);
  double get totalPrice => unitPrice * quantity;`;

const replacementModel = `  double get customizationCharge =>
      ProductModel.getCustomizationCharge(customizationType);
  double get sizeCharge => ProductModel.getSizeAddonCharge(selectedSize);
  double get totalAddonCharge => customizationCharge + sizeCharge;
  double get baseUnitPrice => product.priceForQuantity(quantity);
  double get unitPrice => baseUnitPrice + totalAddonCharge;
  double get totalPrice => unitPrice * quantity;`;

if (content.includes(targetModel)) {
  content = content.replace(targetModel, replacementModel);
}

const targetPriceText = `Text(
                                          '₹\${p.price.toStringAsFixed(2)} / \${p.unitText}',
                                          style: const TextStyle(
                                            color: AppTheme.textSecondary,
                                            fontSize: 12,
                                            fontWeight: FontWeight.w500,
                                          ),
                                        ),`;

const replacementPriceText = `Text(
                                          item.totalAddonCharge > 0
                                              ? '₹\${item.unitPrice.toStringAsFixed(0)} / \${p.unitText} (Base ₹\${item.baseUnitPrice.toStringAsFixed(0)} + ₹\${item.totalAddonCharge.toStringAsFixed(0)} add-on)'
                                              : '₹\${item.unitPrice.toStringAsFixed(0)} / \${p.unitText}',
                                          style: const TextStyle(
                                            color: AppTheme.textSecondary,
                                            fontSize: 11,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),`;

if (content.includes(targetPriceText)) {
  content = content.replace(targetPriceText, replacementPriceText);
}

const targetBadgeText = `'\\$\\{item.customizationType\\}\\$\\{item.selectedSize.isNotEmpty && item.selectedSize != "Standard" ? " (\\$\\{item.selectedSize\\})" : ""}',`;

const replacementBadgeText = `item.totalAddonCharge > 0
                                                          ? '\\$\\{item.customizationType\\} (+₹\\$\\{item.totalAddonCharge.toStringAsFixed(0)}/pc)\\$\\{item.selectedSize.isNotEmpty && item.selectedSize != "Standard" ? " (\\$\\{item.selectedSize\\})" : ""}'
                                                          : '\\$\\{item.customizationType\\}\\$\\{item.selectedSize.isNotEmpty && item.selectedSize != "Standard" ? " (\\$\\{item.selectedSize\\})" : ""}',`;

if (content.includes(targetBadgeText)) {
  content = content.replace(targetBadgeText, replacementBadgeText);
}

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully patched cart_screen.dart');
