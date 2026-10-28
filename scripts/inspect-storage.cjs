const fs = require('fs');
const lines = fs.readFileSync('C:/mahalaxmi_enterprises/lib/services/app_storage_service.dart', 'utf8').split('\n');
lines.forEach((l, idx) => {
  if (l.includes('addToCart') || l.includes('LocalCartItem') || l.includes('customization') || l.includes('size')) {
    console.log(`${idx + 1}: ${l.trim()}`);
  }
});
