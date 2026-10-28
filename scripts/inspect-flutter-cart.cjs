const fs = require('fs');
const lines = fs.readFileSync('C:/mahalaxmi_enterprises/lib/screens/cart/cart_screen.dart', 'utf8').split('\n');
lines.forEach((l, idx) => {
  if (l.includes('price') || l.includes('customiz') || l.includes('total') || l.includes('cartItem')) {
    console.log(`${idx + 1}: ${l.trim()}`);
  }
});
