const fs = require('fs');

const file = 'C:/mahalaxmi_enterprises/lib/screens/product/product_details_screen.dart';
const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

console.log('Total lines:', lines.length);

lines.forEach((l, idx) => {
  if (l.includes('_customizationType') || l.includes('customizationCharge') || l.includes('priceForQuantity') || l.includes('Design & Logo') || l.includes('Custom Dimensions')) {
    console.log(`${idx + 1}: ${l.trim()}`);
  }
});
