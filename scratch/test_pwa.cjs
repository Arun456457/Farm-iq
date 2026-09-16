const http = require('http');

async function test() {
  const htmlRes = await fetch('http://localhost:3000/');
  const html = await htmlRes.text();
  console.log('HTML status:', htmlRes.status);
  console.log('HTML has manifest link:', html.includes('/manifest.json'));
  console.log('HTML has apple-touch-icon:', html.includes('apple-touch-icon'));
  console.log('HTML has serviceWorker:', html.includes('serviceWorker.register'));
  console.log('HTML has viewport-fit:', html.includes('viewport-fit=cover'));

  const manifestRes = await fetch('http://localhost:3000/manifest.json');
  const manifest = await manifestRes.json();
  console.log('Manifest status:', manifestRes.status);
  console.log('Manifest name:', manifest.name);
  console.log('Manifest display:', manifest.display);

  const swRes = await fetch('http://localhost:3000/sw.js');
  console.log('SW status:', swRes.status);

  const iconRes = await fetch('http://localhost:3000/pwa-192x192.png');
  console.log('192 Icon status:', iconRes.status, 'size:', (await iconRes.arrayBuffer()).byteLength);

  const svgIconRes = await fetch('http://localhost:3000/pwa-icon.svg');
  console.log('SVG Icon status:', svgIconRes.status);
}

test().catch(console.error);
