const http = require('http');

async function testCustomerNumberAndFlow() {
  console.log('=== VERIFYING CUSTOMER NUMBER SYNC & DROPDOWN LOGIC ===\n');
  const baseUrl = 'http://localhost:3000';
  let passed = 0;
  let total = 0;

  function assert(name, condition, details = '') {
    total++;
    if (condition) {
      console.log(`✓ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`✗ [FAIL] ${name} ${details}`);
    }
  }

  // 1. Authenticate Customer (Paul Newman)
  const custLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: '9876543210', password: 'customer123', role: 'customer' })
  });
  const custAuth = await custLogin.json();
  const custToken = custAuth.access_token;
  assert('Customer authenticates successfully', custLogin.status === 200 && !!custToken);

  // 2. Authenticate Farmer (Arun Gera)
  const farmerLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: '9133144324', password: 'farmer123', role: 'farmer' })
  });
  const farmerAuth = await farmerLogin.json();
  const farmerToken = farmerAuth.access_token;
  assert('Farmer authenticates successfully', farmerLogin.status === 200 && !!farmerToken);

  // 3. Customer changes phone number in Edit Profile
  const newCustomerPhone = '9822998877';
  const updateRes = await fetch(`${baseUrl}/api/users/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${custToken}`
    },
    body: JSON.stringify({
      full_name: 'Paul Newman',
      phone: newCustomerPhone,
      delivery_address: 'Skyline Penthouse 401, Pune',
      email: 'paul456@gmail.com'
    })
  });
  const updateData = await updateRes.json();
  assert('Customer profile updated successfully', updateRes.status === 200 && updateData.user);
  assert('User profile returns new phone', updateData.user.phone === newCustomerPhone);

  // 4. Verify Customer Orders reflect the new phone immediately
  const custOrdersRes = await fetch(`${baseUrl}/api/customer/orders`, {
    headers: { 'Authorization': `Bearer ${custToken}` }
  });
  const custOrders = await custOrdersRes.json();
  assert('Customer orders endpoint returns orders', Array.isArray(custOrders) && custOrders.length > 0);
  const custOrderHasNewPhone = custOrders.every(o => o.customer_phone === newCustomerPhone);
  assert('All customer orders reflect new phone number', custOrderHasNewPhone, `Found phone: ${custOrders[0]?.customer_phone}`);

  // 5. Verify Farmer incoming orders reflect the updated customer phone
  const farmerOrdersRes = await fetch(`${baseUrl}/api/farmer/orders`, {
    headers: { 'Authorization': `Bearer ${farmerToken}` }
  });
  const farmerOrders = await farmerOrdersRes.json();
  assert('Farmer orders endpoint returns orders', Array.isArray(farmerOrders) && farmerOrders.length > 0);
  const farmerViewsCustOrder = farmerOrders.find(o => o.customer_id === custAuth.user.id);
  assert('Farmer sees updated customer phone on incoming orders', farmerViewsCustOrder?.customer_phone === newCustomerPhone, `Farmer sees: ${farmerViewsCustOrder?.customer_phone}`);

  // 6. Ensure in-stock produce exists for fresh order test
  const prodsRes = await fetch(`${baseUrl}/api/products`);
  const prods = await prodsRes.json();
  let availableProd = prods.find(p => p.quantity > 5);
  if (!availableProd) {
    const addProdRes = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${farmerToken}`
      },
      body: JSON.stringify({
        name: 'Fresh Nagpur Oranges',
        category: 'Fruits',
        price: 75,
        quantity: 120,
        unit: 'kg',
        harvest_date: new Date().toISOString().split('T')[0],
        location: 'Nagpur Orchards, Maharashtra'
      })
    });
    availableProd = await addProdRes.json();
  }

  // 7. Customer places order with a custom contact phone number
  const orderSpecificPhone = '9911223344';
  const orderRes = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${custToken}`
    },
    body: JSON.stringify({
      product_id: availableProd.id,
      quantity: 2,
      delivery_address: 'Direct Farm Delivery Doorstep, Pune',
      customer_phone: orderSpecificPhone,
      distance_km: 14,
      payment_method: 'UPI'
    })
  });
  const orderData = await orderRes.json();
  const placedOrder = orderData.order;
  assert('Order placed with custom contact phone', orderRes.status === 200 && placedOrder);
  assert('Order customer_phone is exactly the new phone', placedOrder.customer_phone === orderSpecificPhone);

  // 8. Farmer accepts order -> verify customer WhatsApp link has the exact phone
  const acceptRes = await fetch(`${baseUrl}/api/orders/${placedOrder.id}/accept`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${farmerToken}` }
  });
  const acceptData = await acceptRes.json();
  assert('Farmer accepts order successfully', acceptRes.status === 200 && acceptData.order);
  assert('Accepted order customer_phone remains accurate', acceptData.order.customer_phone === orderSpecificPhone);
  assert('Customer WhatsApp alert link contains new phone', acceptData.order.customer_whatsapp_url && acceptData.order.customer_whatsapp_url.includes('9911223344'));

  // 9. Reset customer phone back to standard test number
  await fetch(`${baseUrl}/api/users/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${custToken}`
    },
    body: JSON.stringify({
      phone: '9876543210'
    })
  });

  console.log(`\n=== RESULTS: ${passed}/${total} TESTS PASSED ===`);
  if (passed === total) {
    console.log('✓ All Customer Number & Dropdown Flow tests completed successfully!');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

testCustomerNumberAndFlow().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
