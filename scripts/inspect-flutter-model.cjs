const fs = require('fs');

function inspect(path, terms) {
  console.log('=== Inspecting ' + path + ' ===');
  if (!fs.existsSync(path)) {
    console.log('FILE NOT FOUND: ' + path);
    return;
  }
  const lines = fs.readFileSync(path, 'utf8').split('\n');
  lines.forEach((l, idx) => {
    if (terms.some(t => l.toLowerCase().includes(t.toLowerCase()))) {
      console.log(`${idx + 1}: ${l.trim()}`);
    }
  });
}

inspect('C:/mahalaxmi_enterprises/lib/models/product_model.dart', ['price', 'tier', 'customiz', 'charge']);
