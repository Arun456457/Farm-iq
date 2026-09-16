const BASE_URL = 'http://localhost:3000';

async function runVerification() {
  console.log('=== STARTING FARMER PRODUCE LISTING & PERSISTENCE VERIFICATION ===');

  // 1. Register Farmer Ramesh
  const regPayload = {
    full_name: 'Ramesh Patil',
    email: 'ramesh.farmer.test@farmiq.in',
    phone: '+91 98221 00111',
    password: 'farmer123',
    role: 'farmer',
    farm_name: 'Patil Mango Orchards',
    location: 'Ratnagiri, Maharashtra',
    delivery_address: 'Ratnagiri, Maharashtra',
    pincode: '415612',
    upi_id: '9133144324@ybl'
  };

  console.log('\nStep 1: Registering or logging in farmer account (Ramesh Patil)...');
  let farmerToken;
  let regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(regPayload)
  });
  if (regRes.status === 400) {
    // Already registered, log in
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: regPayload.email, password: regPayload.password })
    });
    const loginData = await loginRes.json();
    farmerToken = loginData.access_token;
    console.log('✓ Farmer logged in. ID:', loginData.user.id, 'Role:', loginData.user.role);
  } else {
    const regData = await regRes.json();
    farmerToken = regData.access_token;
    console.log('✓ Farmer registered successfully. ID:', regData.user.id, 'Role:', regData.user.role);
  }

  // 2. Call an intermediate API to verify the user is NOT purged by any middleware
  console.log('\nStep 2: Calling intermediate API to verify user persistence...');
  const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { 'Authorization': `Bearer ${farmerToken}` }
  });
  const meData = await meRes.json();
  if (!meRes.ok) {
    throw new Error(`GET /api/auth/me failed (${meRes.status}): ${JSON.stringify(meData)}`);
  }
  console.log('✓ Farmer persisted across API calls! Found user ID:', meData.id, 'Role:', meData.role);

  // 3. Add Produce Listing (like in user screenshot: 50 kg Mangoes, ₹120/kg)
  console.log('\nStep 3: Submitting produce listing (Mangoes, 50kg, ₹120/kg)...');
  const producePayload = {
    name: 'Alphonso Mangoes',
    category: 'Fruits',
    quantity: 50,
    unit: 'kg',
    price: 110,
    harvest_date: '2026-09-16',
    location: 'Ratnagiri, Maharashtra',
    description: 'Freshly harvested Ratnagiri Alphonso grade A.',
    organic: true,
    shelf_life_days: 14
  };

  const prodRes = await fetch(`${BASE_URL}/api/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${farmerToken}`
    },
    body: JSON.stringify(producePayload)
  });
  const prodData = await prodRes.json();
  if (!prodRes.ok) {
    throw new Error(`Produce addition failed (${prodRes.status}): ${JSON.stringify(prodData)}`);
  }
  console.log('✓ Produce added successfully!');
  console.log('  Product ID:', prodData.product.id);
  console.log('  Name:', prodData.product.name);
  console.log('  Farmer ID:', prodData.product.farmer_id);
  console.log('  Price: ₹' + prodData.product.price + '/' + prodData.product.unit);

  // 4. Verify in farmer's products listing
  console.log('\nStep 4: Checking farmer produce listings...');
  const listRes = await fetch(`${BASE_URL}/api/farmer/products`, {
    headers: { 'Authorization': `Bearer ${farmerToken}` }
  });
  const listData = await listRes.json();
  if (!listRes.ok) {
    throw new Error(`GET /api/farmer/products failed (${listRes.status}): ${JSON.stringify(listData)}`);
  }
  const matching = listData.find(p => p.id === prodData.product.id);
  if (!matching) {
    throw new Error(`Newly created product ID ${prodData.product.id} not found in farmer listings!`);
  }
  console.log('✓ Product verified in farmer listings. Total listings:', listData.length);

  // 5. Test farmer login
  console.log('\nStep 5: Testing login with farmer credentials...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'ramesh.farmer.test@farmiq.in',
      password: 'farmer123'
    })
  });
  const loginData = await loginRes.json();
  if (!loginRes.ok || !loginData.access_token) {
    throw new Error(`Login failed (${loginRes.status}): ${JSON.stringify(loginData)}`);
  }
  console.log('✓ Farmer login successful! Returned user role:', loginData.user.role);

  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! The "Only farmers can list produce" bug is completely resolved!');
}

runVerification().catch(err => {
  console.error('\n❌ TEST FAILED:', err.message);
  process.exit(1);
});
