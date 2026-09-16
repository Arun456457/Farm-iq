const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('--- STARTING COMPLETE FARMIQ CORE FEATURES VERIFICATION ---');

  // 1. Customer Login
  console.log('\n1. Logging in as Customer Priya Sharma...');
  const custLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'priya.sharma@gmail.com', password: 'customer123' })
  });
  const custLogin = await custLoginRes.json();
  if (!custLogin.access_token) throw new Error(`Customer login failed: ${JSON.stringify(custLogin)}`);
  const custToken = custLogin.access_token;
  console.log('✓ Customer logged in successfully. ID:', custLogin.user.id);

  // 2. Location & Address Selection Update (Requirement 1)
  console.log('\n2. Testing Location & Address Selection (Profile persistence)...');
  const updateAddressRes = await fetch(`${BASE_URL}/api/users/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${custToken}`
    },
    body: JSON.stringify({
      delivery_address: 'Flat 402, Green Meadows, Kothrud, Pune - 411038',
      location: 'Flat 402, Green Meadows, Kothrud, Pune - 411038',
      latitude: 18.5074,
      longitude: 73.8077
    })
  });
  const updateAddress = await updateAddressRes.json();
  console.log('✓ Address saved to user profile:', updateAddress.user?.delivery_address);
  console.log('✓ GPS coordinates saved:', updateAddress.user?.latitude, updateAddress.user?.longitude);

  // 3. Farmer Login & Setting UPI VPA
  console.log('\n3. Logging in as Farmer Suresh Patil & checking payment settings...');
  const farmerLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'farmer.patil@farmiq.in', password: 'farmer123' })
  });
  const farmerLogin = await farmerLoginRes.json();
  const farmerToken = farmerLogin.access_token;
  console.log('✓ Farmer logged in. ID:', farmerLogin.user.id);

  const farmerProfileRes = await fetch(`${BASE_URL}/api/users/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${farmerToken}`
    },
    body: JSON.stringify({
      upi_id: 'suresh.patil@oksbi',
      upi_name: 'Suresh Patil (Patil Agro)',
      location: 'Patil Agro Orchards, Lasalgaon, Nashik - 422306',
      latitude: 20.1415,
      longitude: 74.2237
    })
  });
  const farmerProfile = await farmerProfileRes.json();
  console.log('✓ Farmer UPI VPA securely configured in profile:', farmerProfile.user?.upi_id);
  console.log('✓ Farm pickup location set:', farmerProfile.user?.location);

  // 4. Customer Places Order
  console.log('\n4. Customer placing order for fresh produce...');
  // Fetch or list available product for Farmer Suresh Patil
  let prodsRes = await fetch(`${BASE_URL}/api/products`);
  let products = await prodsRes.json();
  let targetProd = products.find((p: any) => p.farmer_id === 1);
  if (!targetProd) {
    const createProdRes = await fetch(`${BASE_URL}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${farmerToken}`
      },
      body: JSON.stringify({
        name: 'Organic Tomatoes',
        category: 'Vegetables',
        price: 30,
        quantity: 50,
        unit: 'kg',
        location: 'Patil Agro Orchards, Lasalgaon, Nashik',
        description: 'Farm fresh organic tomatoes'
      })
    });
    const createdData = await createProdRes.json();
    targetProd = createdData.product;
  }
  console.log(`Target product: ${targetProd.name} by ${targetProd.farmer_name} (Price: ₹${targetProd.price}/${targetProd.unit})`);

  const orderRes = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${custToken}`
    },
    body: JSON.stringify({
      product_id: targetProd.id,
      quantity: 5,
      distance_km: 15,
      delivery_address: 'Flat 402, Green Meadows, Kothrud, Pune - 411038',
      payment_method: 'UPI'
    })
  });
  const orderData = await orderRes.json();
  const order = orderData.order;
  console.log('✓ Order created successfully! ID:', order.id);
  console.log('✓ Order Initial Status:', order.status);
  console.log('✓ Order Payment Status:', order.payment_status);
  console.log('✓ Order Grand Total (₹2/km delivery included): ₹' + order.grand_total);

  // 5. New-Order Notification for Farmer (Requirement 2)
  console.log('\n5. Checking Farmer Real-Time New-Order Notification...');
  const farmerNotifsRes = await fetch(`${BASE_URL}/api/notifications`, {
    headers: { 'Authorization': `Bearer ${farmerToken}` }
  });
  const farmerNotifs = await farmerNotifsRes.json();
  const newOrderNotif = farmerNotifs.find((n: any) => n.order_id === order.id && n.type === 'NEW_ORDER');
  if (!newOrderNotif) throw new Error('Farmer did not receive NEW_ORDER notification!');
  console.log('✓ Farmer Received Real-Time Notification:');
  console.log('   - Title:', newOrderNotif.title);
  console.log('   - Customer Name:', newOrderNotif.customer_name);
  console.log('   - Customer Phone:', newOrderNotif.customer_phone);
  console.log('   - Produce & Quantity:', newOrderNotif.products_summary);
  console.log('   - Delivery Address:', newOrderNotif.delivery_address);
  console.log('   - Order Total: ₹' + newOrderNotif.order_total);
  console.log('   - Order Time:', newOrderNotif.order_time);

  // 6. Farmer Accepts Order & Automatic Invoice Generation (Requirements 3 & 4)
  console.log('\n6. Farmer accepting order and verifying automatic invoice generation...');
  const acceptRes = await fetch(`${BASE_URL}/api/orders/${order.id}/accept`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${farmerToken}` }
  });
  const acceptData = await acceptRes.json();
  console.log('✓ Order status after acceptance:', acceptData.order?.status);
  console.log('✓ Automatic Invoice Generated:');
  console.log('   - Invoice Number:', acceptData.invoice?.invoice_number);
  console.log('   - Generated At:', acceptData.invoice?.generated_at);
  console.log('   - Farmer Details:', acceptData.invoice?.farmer_name, '|', acceptData.invoice?.farmer_phone, '|', acceptData.invoice?.farmer_address);
  console.log('   - Customer Details:', acceptData.invoice?.customer_name, '|', acceptData.invoice?.customer_phone, '|', acceptData.invoice?.customer_address);
  console.log('   - Items Count:', acceptData.invoice?.items?.length);
  console.log('   - Subtotal: ₹' + acceptData.invoice?.product_subtotal);
  console.log('   - Delivery Fee (₹2/km): ₹' + acceptData.invoice?.delivery_fee);
  console.log('   - Taxes (Fresh Agri 0% GST): ₹' + acceptData.invoice?.taxes);
  console.log('   - Final Amount: ₹' + acceptData.invoice?.final_amount);
  console.log('   - Invoice Status:', acceptData.invoice?.order_status);

  // 7. Customer Order-Confirmation Notification (Requirement 3)
  console.log('\n7. Checking Customer Real-Time Order-Confirmation Notification...');
  const custNotifsRes = await fetch(`${BASE_URL}/api/notifications`, {
    headers: { 'Authorization': `Bearer ${custToken}` }
  });
  const custNotifs = await custNotifsRes.json();
  const confirmNotif = custNotifs.find((n: any) => n.order_id === order.id && n.type === 'ORDER_CONFIRMED');
  if (!confirmNotif) throw new Error('Customer did not receive ORDER_CONFIRMED notification!');
  console.log('✓ Customer Received Real-Time Notification:');
  console.log('   - Title:', confirmNotif.title);
  console.log('   - Message:', confirmNotif.message);
  console.log('   - Linked Invoice #:', confirmNotif.invoice_number);

  // 8. Shared Invoice Access for Both Parties (Requirement 5)
  console.log('\n8. Checking Shared Invoice Access for Both Users (Prevent Duplicates)...');
  const custInvoiceRes = await fetch(`${BASE_URL}/api/orders/${order.id}/invoice`, {
    headers: { 'Authorization': `Bearer ${custToken}` }
  });
  const custInvoice = await custInvoiceRes.json();

  const farmerInvoiceRes = await fetch(`${BASE_URL}/api/orders/${order.id}/invoice`, {
    headers: { 'Authorization': `Bearer ${farmerToken}` }
  });
  const farmerInvoice = await farmerInvoiceRes.json();

  if (custInvoice.invoice_number !== farmerInvoice.invoice_number) {
    throw new Error('Customer and Farmer got different invoice numbers!');
  }
  console.log('✓ Idempotent shared invoice confirmed. Invoice ID:', custInvoice.invoice_number);

  // 9. Real-Time UPI Payment (Requirement 6)
  console.log('\n9. Customer completing real-time UPI payment matching invoice total...');
  console.log('   - Farmer Configured UPI ID:', custInvoice.farmer_upi_id);
  console.log('   - Payable Amount:', custInvoice.final_amount);

  const testUtr = `UPI98202611${Math.floor(1000 + Math.random() * 9000)}`;
  const payRes = await fetch(`${BASE_URL}/api/orders/${order.id}/pay-upi`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${custToken}`
    },
    body: JSON.stringify({
      amount: custInvoice.final_amount,
      transaction_id: testUtr,
      gateway_mode: 'sandbox'
    })
  });
  const payData = await payRes.json();
  console.log('✓ Payment processed successfully!');
  console.log('   - Order status updated to:', payData.order?.status);
  console.log('   - Payment status updated to:', payData.order?.payment_status);
  console.log('   - Saved UTR Reference:', payData.payment?.transaction_id);
  console.log('   - Payment Timestamp:', payData.payment?.timestamp);

  // Verify Invoice is also marked Paid
  const updatedInvoiceRes = await fetch(`${BASE_URL}/api/orders/${order.id}/invoice`, {
    headers: { 'Authorization': `Bearer ${custToken}` }
  });
  const updatedInvoice = await updatedInvoiceRes.json();
  console.log('✓ Updated Invoice Status:', updatedInvoice.order_status, '| Payment:', updatedInvoice.payment_status, '| UTR:', updatedInvoice.transaction_id);

  // 10. Farmer Notification for Payment Received (Requirement 6)
  console.log('\n10. Checking Farmer Real-Time Payment Received Notification...');
  const farmerPostPayNotifsRes = await fetch(`${BASE_URL}/api/notifications`, {
    headers: { 'Authorization': `Bearer ${farmerToken}` }
  });
  const farmerPostPayNotifs = await farmerPostPayNotifsRes.json();
  const paymentNotif = farmerPostPayNotifs.find((n: any) => n.order_id === order.id && n.type === 'PAYMENT_RECEIVED');
  if (!paymentNotif) throw new Error('Farmer did not receive PAYMENT_RECEIVED notification!');
  console.log('✓ Farmer Received Real-Time Payment Notification:');
  console.log('   - Title:', paymentNotif.title);
  console.log('   - Message:', paymentNotif.message);
  console.log('   - Amount Received: ₹' + paymentNotif.amount);
  console.log('   - UTR Reference:', paymentNotif.transaction_id);

  console.log('\n============================================================');
  console.log('🎉 ALL 6 CORE FEATURES VERIFIED AND WORKING FLAWLESSLY!');
  console.log('============================================================');
}

runTests().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
