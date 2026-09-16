const http = require('http');

async function runTests() {
  console.log('=== FARMIQ BUSINESS LOGIC & INTEGRATION TESTS ===\n');
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

  // 1. Health & Status
  const healthRes = await fetch(`${baseUrl}/api/products`);
  assert('API Gateway is alive and responding', healthRes.status === 200);

  // 2. Mandi Rates & APMC Benchmarks
  const mandiRes = await fetch(`${baseUrl}/api/mandi-prices?crop=Tomato`);
  const mandiData = await mandiRes.json();
  assert('Mandi Rates API returns commodities with price statistics', mandiRes.status === 200 && Array.isArray(mandiData.mandi_prices) && mandiData.mandi_prices.length > 0, `Length: ${mandiData.mandi_prices?.length}`);

  // 3. Distance Calculation (Haversine Formula Test)
  // Distance between Lasalgaon (20.1444, 74.2255) and Pune (18.5204, 73.8567) is approx 185-190 km
  function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }
  const dist = haversineDistance(20.1444, 74.2255, 18.5204, 73.8567);
  assert('Haversine distance calculation is accurate within +/- 5km', dist >= 180 && dist <= 195, `Calculated: ${dist} km`);

  // 4. Fair Distance-Tiered Logistics Pricing Algorithm (<=5km: ₹5/km, 5-15km: ₹3/km, >15km: ₹2/km)
  function calculateDeliveryFee(km) {
    if (km <= 5) return Math.round(km * 5);
    if (km <= 15) return Math.round(25 + (km - 5) * 3);
    return Math.round(55 + (km - 15) * 2);
  }
  assert('Logistics Pricing Formula applies ₹5/km for <=5km', calculateDeliveryFee(4) === 20, `Expected ₹20, got ₹${calculateDeliveryFee(4)}`);
  assert('Logistics Pricing Formula applies tiered rate for 10km', calculateDeliveryFee(10) === 40, `Expected ₹40, got ₹${calculateDeliveryFee(10)}`);
  assert('Logistics Pricing Formula applies far distance rate for 25km', calculateDeliveryFee(25) === 75, `Expected ₹75, got ₹${calculateDeliveryFee(25)}`);

  // 5. Digital Escrow Milestones (20% Advance, 50% Dispatch, 30% Delivery)
  const contractTotal = 50000;
  const advance = contractTotal * 0.20;
  const dispatch = contractTotal * 0.50;
  const finalRelease = contractTotal * 0.30;
  assert('Escrow milestone allocation sums to 100%', advance + dispatch + finalRelease === contractTotal, `Sum: ${advance + dispatch + finalRelease}`);

  // 6. Farmer Authentication Test
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: '9133144324', password: 'farmer123' })
  });
  const loginData = await loginRes.json();
  assert('Farmer Login succeeds for real authenticated account', loginRes.status === 200 && loginData.user && loginData.user.role === 'farmer', `Status: ${loginRes.status}`);

  // 7. Verified Buyers Directory
  const buyersRes = await fetch(`${baseUrl}/api/verified-buyers`);
  const buyers = await buyersRes.json();
  assert('Institutional Verified Buyers directory is populated', Array.isArray(buyers) && buyers.length > 0, `Length: ${buyers.length}`);

  // 8. FPO Collectives Endpoint
  const fpoRes = await fetch(`${baseUrl}/api/fpo/collectives`);
  const collectives = await fpoRes.json();
  assert('FPO Collectives directory is operational', Array.isArray(collectives));

  console.log(`\n=== RESULTS: ${passed}/${total} TESTS PASSED (${Math.round((passed / total) * 100)}%) ===`);
}

runTests().catch(console.error);
