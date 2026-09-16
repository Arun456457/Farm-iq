const http = require('http');

async function testWhatsAppWorkflow() {
  console.log('=== TESTING WHATSAPP ORDER & CONFIRMATION NOTIFICATION FLOW ===\n');
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

  // 1. Authenticate Farmer (arun.gera / 9133144324)
  const farmerLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: '9133144324', password: 'farmer123' })
  });
  const farmerAuth = await farmerLogin.json();
  const farmerToken = farmerAuth.access_token;
  assert('Farmer login successful', farmerLogin.status === 200 && !!farmerToken);

  // 2. Authenticate Customer (Paul / 9876543210)
  const custLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: '9876543210', password: 'customer123' })
  });
  const custAuth = await custLogin.json();
  const custToken = custAuth.access_token;
  assert('Customer login successful', custLogin.status === 200 && !!custToken);

  // 3. Ensure farmer has in-stock produce to order
  const createProdRes = await fetch(`${baseUrl}/api/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${farmerToken}`
    },
    body: JSON.stringify({
      name: 'Nashik Red Onions',
      category: 'Vegetables',
      quantity: 50,
      unit: 'kg',
      price: 26,
      location: 'Lasalgaon, Nashik',
      description: 'Fresh farm harvest'
    })
  });
  const newProdData = await createProdRes.json();
  const targetProduct = newProdData.product;
  assert('Farmer produce is listed in marketplace', !!targetProduct && targetProduct.quantity > 0);

  // 4. Customer places an order
  const orderRes = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${custToken}`
    },
    body: JSON.stringify({
      product_id: targetProduct.id,
      quantity: 1,
      delivery_address: 'Flat 402, Shivajinagar, Pune',
      distance_km: 18,
      payment_method: 'UPI'
    })
  });
  const orderData = await orderRes.json();
  const orderId = orderData.order?.id;
  assert('Order placed with status ORDERED', orderRes.status === 200 && orderId && orderData.order.status === 'ORDERED', `Status: ${orderRes.status}, Error: ${JSON.stringify(orderData)}`);

  // 5. Verify Farmer WhatsApp message URL and message body
  const farmerWhatsAppUrl = orderData.farmer_whatsapp_url || orderData.order?.farmer_whatsapp_url;
  const farmerWhatsAppMsg = orderData.order?.farmer_whatsapp_msg;
  assert('Farmer WhatsApp notification URL is generated', typeof farmerWhatsAppUrl === 'string' && farmerWhatsAppUrl.includes('api.whatsapp.com/send'));
  assert('Farmer WhatsApp message contains order details and FarmiQ link', typeof farmerWhatsAppMsg === 'string' && farmerWhatsAppMsg.includes(`Order ID:* #${orderId}`) && farmerWhatsAppMsg.includes('Open FarmiQ to Confirm'));

  // 6. Verify Farmer received in-app notification with NEW_ORDER
  const farmerNotifsRes = await fetch(`${baseUrl}/api/notifications`, {
    headers: { 'Authorization': `Bearer ${farmerToken}` }
  });
  const farmerNotifs = await farmerNotifsRes.json();
  const newOrderNotif = farmerNotifs.find(n => n.order_id === orderId && n.type === 'NEW_ORDER');
  assert('Farmer received real-time NEW_ORDER notification', !!newOrderNotif && newOrderNotif.requires_action === true);

  // 7. Farmer accepts order at website / app
  const acceptRes = await fetch(`${baseUrl}/api/orders/${orderId}/accept`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${farmerToken}`
    }
  });
  const acceptData = await acceptRes.json();
  assert('Farmer accepted order successfully (CONFIRMED)', acceptRes.status === 200 && acceptData.order?.status === 'CONFIRMED');

  // 8. Verify Customer WhatsApp Acceptance Message has Track Order, Pay, and Invoice options
  const custWhatsAppUrl = acceptData.customer_whatsapp_url || acceptData.order?.customer_whatsapp_url;
  const custWhatsAppMsg = acceptData.order?.customer_whatsapp_msg;
  assert('Customer WhatsApp accepted URL generated', typeof custWhatsAppUrl === 'string' && custWhatsAppUrl.includes('api.whatsapp.com/send'));
  assert('WhatsApp message contains 📍 Track Order link', typeof custWhatsAppMsg === 'string' && custWhatsAppMsg.includes(`track=${orderId}`));
  assert('WhatsApp message contains 💳 Pay via UPI link', typeof custWhatsAppMsg === 'string' && custWhatsAppMsg.includes(`pay=${orderId}`));
  assert('WhatsApp message contains 📄 View Invoice link', typeof custWhatsAppMsg === 'string' && custWhatsAppMsg.includes(`invoice=${orderId}`));

  // 9. Verify Customer received ORDER_CONFIRMED notification with commercial invoice
  const custNotifsRes = await fetch(`${baseUrl}/api/notifications`, {
    headers: { 'Authorization': `Bearer ${custToken}` }
  });
  const custNotifs = await custNotifsRes.json();
  const confirmedNotif = custNotifs.find(n => n.order_id === orderId && n.type === 'ORDER_CONFIRMED');
  assert('Customer received ORDER_CONFIRMED notification with invoice and direct options', !!confirmedNotif && !!confirmedNotif.invoice_number);

  console.log(`\n=== WORKFLOW RESULTS: ${passed}/${total} TESTS PASSED (${Math.round((passed / total) * 100)}%) ===\n`);
  if (passed === total) {
    console.log('🎉 Complete WhatsApp order notification and farmer acceptance workflow verified successfully!');
  }
}

testWhatsAppWorkflow().catch(console.error);
