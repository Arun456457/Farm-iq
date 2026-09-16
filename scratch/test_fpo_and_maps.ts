import { calculateAccurateRoadDistanceAsync, calculateDeliveryFee, getGoogleMapsDirectionsUrl } from '../src/utils/distance';

async function runTests() {
  console.log('=== TEST 1: ACCURATE ROAD DISTANCE & GOOGLE MAPS ROUTING ===');
  
  // Test coordinates: Suresh Patil (Lasalgaon, Nashik: 20.1415, 74.2237) -> Priya Sharma (Kothrud, Pune: 18.5074, 73.8077)
  const origin = { latitude: 20.1415, longitude: 74.2237, address: 'Patil Agro Orchards, Lasalgaon, Nashik' };
  const dest = { latitude: 18.5074, longitude: 73.8077, address: 'Flat 402, Green Meadows, Kothrud, Pune' };
  
  const distResult = await calculateAccurateRoadDistanceAsync(origin, dest);
  console.log('Calculated Road Distance:', distResult.distanceKm, 'km');
  console.log('Calculation Method:', distResult.method);
  console.log('Driving Duration:', distResult.durationText);
  console.log('Delivery Fee: Rs', distResult.deliveryFee);
  console.log('Google Maps URL:', distResult.googleMapsDirectionsUrl);
  
  if (!distResult.googleMapsDirectionsUrl.includes('google.com/maps/dir/')) {
    throw new Error('Google Maps directions URL not generated correctly');
  }
  if (distResult.distanceKm <= 0) {
    throw new Error('Distance should be greater than 0');
  }
  if (distResult.deliveryFee !== calculateDeliveryFee(distResult.distanceKm)) {
    throw new Error(`Delivery fee mismatch: expected ${calculateDeliveryFee(distResult.distanceKm)}, got ${distResult.deliveryFee}`);
  }
  console.log('✓ TEST 1 PASSED: Distance calculation, Google Maps directions, and delivery fee are verified!\n');

  console.log('=== TEST 2: FPO COLLECTIVES & FARMER POOLING BACKEND API ===');
  const BASE_URL = 'http://localhost:3000/api';

  // 1. Fetch default FPO Collectives
  const listRes = await fetch(`${BASE_URL}/fpo/collectives`);
  const collectives = await listRes.json();
  console.log(`Fetched ${collectives.length} FPO Collectives`);
  const defaultCol = collectives.find((c: any) => c.id === 'FPO-COL-101');
  if (!defaultCol) throw new Error('Default collective FPO-COL-101 not found');
  console.log('Found default collective:', defaultCol.name, 'with', defaultCol.members.length, 'members');

  // 2. Login as Suresh Patil (id: 1)
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'farmer.patil@farmiq.in', role: 'farmer' })
  });
  const loginData = await loginRes.json();
  const token = loginData.access_token || loginData.token;
  console.log('Logged in as Suresh Patil, token:', token);

  // 3. Form a new FPO Collective inviting farmer 107 (Ramesh Shinde) & farmer 108 (Sunita Jadhav)
  const createRes = await fetch(`${BASE_URL}/fpo/collectives`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name: 'Godavari Agri Producers Collective',
      focus_crop: 'Tomato',
      target_volume_quintal: 400,
      location: 'Lasalgaon Cluster, Nashik',
      description: 'Nashik valley cooperative aggregating Grade-A export tomatoes.',
      invited_farmer_ids: [107, 108]
    })
  });
  const createData = await createRes.json();
  console.log('Created collective response:', createData.message);
  const newCol = createData.collective;
  if (!newCol || newCol.members.length !== 3) {
    throw new Error(`Expected collective to have 3 members (1 lead + 2 invited), got ${newCol?.members?.length}`);
  }
  console.log('New Collective ID:', newCol.id, 'with members:', newCol.members.map((m: any) => `${m.farmer_name} (${m.status})`).join(', '));

  // 4. Verify notification was dispatched to invited farmer Ramesh Shinde (id: 107)
  const notifsRes = await fetch(`${BASE_URL}/notifications`, {
    headers: { 'Authorization': `Bearer user_107` }
  });
  const notifs = await notifsRes.json();
  const inviteNotif = notifs.find((n: any) => n.type === 'FPO_INVITATION' && n.collective_id === newCol.id);
  if (!inviteNotif) throw new Error('FPO_INVITATION notification was not delivered to Ramesh Shinde');
  console.log('✓ Ramesh Shinde received invitation notification:', inviteNotif.title, '-', inviteNotif.message);

  // 5. Ramesh Shinde accepts the invitation
  const respondRes = await fetch(`${BASE_URL}/fpo/collectives/${newCol.id}/respond`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer user_107`
    },
    body: JSON.stringify({ action: 'accept', contributed_quantity: 120 })
  });
  const respondData = await respondRes.json();
  console.log('Ramesh Shinde response:', respondData.message);
  const updatedMember = respondData.collective.members.find((m: any) => m.farmer_id === 107);
  if (updatedMember.status !== 'ACCEPTED') throw new Error('Member status not updated to ACCEPTED');
  console.log('✓ Ramesh Shinde is now an ACCEPTED member with 120Q quota!');

  // 6. Invite another farmer (Ganesh Pawar, id: 109)
  const inviteMoreRes = await fetch(`${BASE_URL}/fpo/collectives/${newCol.id}/invite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ farmer_id: 109 })
  });
  const inviteMoreData = await inviteMoreRes.json();
  console.log('Invited Ganesh Pawar:', inviteMoreData.message);
  if (!inviteMoreData.collective.members.some((m: any) => m.farmer_id === 109)) {
    throw new Error('Ganesh Pawar was not added to collective members');
  }
  console.log('✓ TEST 2 PASSED: FPO Collective formation, multi-farmer invitations, notification delivery, acceptance, and quota pooling are all working seamlessly!\n');

  console.log('🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(err => {
  console.error('❌ TEST FAILED:', err);
  process.exit(1);
});
