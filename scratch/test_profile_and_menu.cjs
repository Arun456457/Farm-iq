const http = require('http');

async function testProfileAndMenu() {
  console.log('=== TESTING EDIT PROFILE & ONE-BY-ONE MENU WORKFLOW ===\n');
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

  // 1. Authenticate Customer
  const custLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: '9876543210', password: 'customer123' })
  });
  const custAuth = await custLogin.json();
  const custToken = custAuth.access_token;
  assert('Customer authenticated successfully', custLogin.status === 200 && !!custToken);

  // 2. Test Customer Profile Edit & Save
  const updatedCustName = 'Paul Newman';
  const updatedCustAddress = 'Penthouse 7B, Koregaon Park, Pune';
  const updatedCustUpi = 'paul@oksbi';

  const updateRes = await fetch(`${baseUrl}/api/users/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${custToken}`
    },
    body: JSON.stringify({
      full_name: updatedCustName,
      delivery_address: updatedCustAddress,
      upi_id: updatedCustUpi,
      phone: '9876543210'
    })
  });
  const updateData = await updateRes.json();
  assert('Profile update endpoint succeeds', updateRes.status === 200 && updateData.user);
  assert('New saved name is returned in response', updateData.user?.full_name === updatedCustName, `Got: ${updateData.user?.full_name}`);
  assert('New saved delivery address is returned', updateData.user?.delivery_address === updatedCustAddress, `Got: ${updateData.user?.delivery_address}`);
  assert('New saved UPI ID is returned', updateData.user?.upi_id === updatedCustUpi, `Got: ${updateData.user?.upi_id}`);

  // 3. Verify that GET /api/auth/me uses the new saved profile
  const meRes = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { 'Authorization': `Bearer ${custToken}` }
  });
  const meData = await meRes.json();
  assert('GET /api/auth/me returns new saved profile', meData.full_name === updatedCustName && meData.delivery_address === updatedCustAddress && meData.upi_id === updatedCustUpi);

  // 4. Authenticate Farmer
  const farmerLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: '9133144324', password: 'farmer123' })
  });
  const farmerAuth = await farmerLogin.json();
  const farmerToken = farmerAuth.access_token;
  assert('Farmer authenticated successfully', farmerLogin.status === 200 && !!farmerToken);

  // 5. Test Farmer Profile Edit & Save (with farm name and farm location)
  const updatedFarmName = 'Gera Premium Organic Agro';
  const updatedFarmerLocation = 'Lasalgaon Mandi Road, Niphad, Nashik';
  const updatedFarmerUpi = '9133144324@ybl';

  const fUpdateRes = await fetch(`${baseUrl}/api/auth/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${farmerToken}`
    },
    body: JSON.stringify({
      full_name: 'Arun Gera',
      farm_name: updatedFarmName,
      location: updatedFarmerLocation,
      upi_id: updatedFarmerUpi
    })
  });
  const fUpdateData = await fUpdateRes.json();
  assert('/api/auth/profile alias route works', fUpdateRes.status === 200 && fUpdateData.user);
  assert('Farmer farm name updated', fUpdateData.user?.farm_name === updatedFarmName);
  assert('Farmer location updated', fUpdateData.user?.location === updatedFarmerLocation);

  // 6. Verify farmer products show updated farm name or farmer name
  const prodsRes = await fetch(`${baseUrl}/api/farmer/products`, {
    headers: { 'Authorization': `Bearer ${farmerToken}` }
  });
  const prods = await prodsRes.json();
  assert('Farmer products reflect updated profile information', Array.isArray(prods) && prods.every(p => p.farmer_name === 'Arun Gera'));

  console.log(`\n=== PROFILE TEST RESULTS: ${passed}/${total} TESTS PASSED (${Math.round((passed / total) * 100)}%) ===\n`);
  if (passed === total) {
    console.log('🎉 Profile editing, saving, and immediate utilization verified successfully!');
  }
}

testProfileAndMenu().catch(console.error);
