const fs = require('fs');
const p = 'C:/mahalaxmi_enterprises/lib/services/app_storage_service.dart';
let c = fs.readFileSync(p, 'utf8');
c = c.replace("orderNumber: 'MLE-APP-',", "orderNumber: 'MLE-APP-$randomNo',");
fs.writeFileSync(p, c, 'utf8');
console.log('✓ Fixed orderNumber in app_storage_service.dart');
