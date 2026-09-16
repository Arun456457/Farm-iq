async function run() {
  const [network, collectives, lots, products] = await Promise.all([
    fetch('http://localhost:3000/api/farmers/network').then(r=>r.json()),
    fetch('http://localhost:3000/api/fpo/collectives').then(r=>r.json()),
    fetch('http://localhost:3000/api/lots').then(r=>r.json()),
    fetch('http://localhost:3000/api/products').then(r=>r.json())
  ]);

  console.log('=== NETWORK FARMERS ===');
  console.log('Count:', network.length);
  console.log('Farmers:', network.map(f => ({ id: f.id, name: f.full_name, location: f.location })));

  console.log('=== FPO COLLECTIVES ===');
  console.log('Count:', collectives.length);
  collectives.forEach(c => console.log('Collective:', c.name, 'Members:', c.members));

  console.log('=== LOTS ===');
  console.log('Count:', lots.length);
  lots.forEach(l => console.log('Lot:', l.crop_name, 'Member Farmers:', l.member_farmers));

  console.log('=== PRODUCTS ===');
  console.log('Count:', products.length);
  products.forEach(p => console.log('Product:', p.name, 'by farmer:', p.farmer_name, 'location:', p.location, 'mandi:', p.mandi_name));
}

run();
