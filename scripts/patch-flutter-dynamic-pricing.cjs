const fs = require('fs');

// 1. Update ProductModel in Flutter
const modelFile = 'C:/mahalaxmi_enterprises/lib/models/product_model.dart';
let modelContent = fs.readFileSync(modelFile, 'utf8');

const targetModelStatic = `  static double getCustomizationCharge(String? type) {
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
  }`;

const replacementModelStatic = `  static final Map<String, double> customizationPricing = {
    'Only Logo': 12.0,
    'Only Design': 22.0,
    'Design & Logo': 32.0,
    'Embroidery Branding': 42.0,
    'Custom Weave & GSM': 55.0,
    'Custom Size': 20.0,
  };

  static void updateCustomizationPricing(Map<String, dynamic> newPricing) {
    newPricing.forEach((key, val) {
      if (val is num) {
        customizationPricing[key] = val.toDouble();
      }
    });
  }

  static double getCustomizationCharge(String? type) {
    if (type == null) return 0.0;
    switch (type.trim()) {
      case 'Only Logo':
      case 'Only Logo Print':
        return customizationPricing['Only Logo'] ?? 12.0;
      case 'Only Design':
        return customizationPricing['Only Design'] ?? 22.0;
      case 'Design & Logo':
        return customizationPricing['Design & Logo'] ?? 32.0;
      case 'Embroidery Branding':
      case 'Embroidery':
        return customizationPricing['Embroidery Branding'] ?? 42.0;
      case 'Custom Weave & GSM':
      case 'Weave & GSM':
        return customizationPricing['Custom Weave & GSM'] ?? 55.0;
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
      return customizationPricing['Custom Size'] ?? 20.0;
    }
    return 0.0;
  }`;

if (modelContent.includes(targetModelStatic)) {
  modelContent = modelContent.replace(targetModelStatic, replacementModelStatic);
  fs.writeFileSync(modelFile, modelContent, 'utf8');
  console.log('Successfully updated product_model.dart with dynamic customizationPricing map');
} else {
  console.log('Target static block not found or already updated in product_model.dart');
}

// 2. Update AppConfigService in Flutter to parse customizationPricing
const configServiceFile = 'C:/mahalaxmi_enterprises/lib/services/app_config_service.dart';
let configContent = fs.readFileSync(configServiceFile, 'utf8');

// Ensure ProductModel is imported if needed
if (!configContent.includes("import '../models/product_model.dart';")) {
  configContent = "import '../models/product_model.dart';\n" + configContent;
}

if (!configContent.includes("ProductModel.updateCustomizationPricing")) {
  const targetParse = "    _settings = Map<String, dynamic>.from(data);";
  const replacementParse = `    if (data['customizationPricing'] is Map) {
      ProductModel.updateCustomizationPricing(
        Map<String, dynamic>.from(data['customizationPricing'] as Map),
      );
    }
    _settings = Map<String, dynamic>.from(data);`;

  configContent = configContent.replace(targetParse, replacementParse);
  fs.writeFileSync(configServiceFile, configContent, 'utf8');
  console.log('Successfully updated app_config_service.dart to sync customizationPricing from server');
}

// 3. Update ProductDetailsScreen to dynamically show custom size fee
const detailsFile = 'C:/mahalaxmi_enterprises/lib/screens/product/product_details_screen.dart';
let detailsContent = fs.readFileSync(detailsFile, 'utf8');
if (detailsContent.includes("final labelText = isCustom ? 'Custom (+₹20/pc)' : size;")) {
  detailsContent = detailsContent.replace(
    "final labelText = isCustom ? 'Custom (+₹20/pc)' : size;",
    "final customSizeFee = ProductModel.getSizeAddonCharge('Custom').toStringAsFixed(0);\n    final labelText = isCustom ? 'Custom (+₹\${customSizeFee}/pc)' : size;"
  );
  fs.writeFileSync(detailsFile, detailsContent, 'utf8');
  console.log('Successfully updated product_details_screen.dart with dynamic custom size badge');
}
