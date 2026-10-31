const fetch = globalThis.fetch;

async function run() {
  const payload = {
    id: 'ord-custom-999',
    orderNumber: 'MLE-TEST-CUSTOM-999',
    source: 'WEB',
    customer: {
      name: 'Dhaval Dave',
      email: 'dhavaldave121002@gmail.com',
      phone: '+91 85111 72099',
      companyName: 'Mahalaxmi Enterprise'
    },
    subtotal: 44500,
    totalAmount: 44500,
    paymentMethod: 'UPI',
    paymentStatus: 'PAID',
    status: 'PLACED',
    shippingAddress: { fullName: 'Dhaval Dave', phone: '+91 85111 72099', city: 'Ahmedabad' },
    items: [
      {
        productId: 'prod-bedsheet-01',
        productName: 'Glance 300 TC 100% Combed Cotton Double Bedsheet',
        quantity: 50,
        unitPrice: 890,
        totalPrice: 44500,
        variantDescription: 'Customized [Design and Logo • Logo: "MAHALAXMI GOLD" • Size: Super King • 📎 Logo: brand_logo_crest.png • 📎 Design: damask_weave.pdf]',
        customization: {
          type: 'Design and Logo',
          logoText: 'MAHALAXMI GOLD',
          logoColor: '#EAB308',
          logoPosition: 'top-right',
          logoStyle: 'crown',
          selectedSize: 'Super King',
          logoFileName: 'brand_logo_crest.png',
          designFileName: 'damask_weave.pdf'
        }
      }
    ]
  };

  const res = await fetch('http://localhost:5173/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  console.log('Response:', data);
}

run().catch(console.error);
