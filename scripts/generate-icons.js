import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(width, height, drawFn) {
  // RGBA buffer with filter byte 0 at start of each scanline
  const rowSize = width * 4 + 1;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type: None
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // Helper to calculate CRC32
  const crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[n] = c;
  }
  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const typeBuf = Buffer.from(type, 'ascii');
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(data.length, 0);
    const body = Buffer.concat([typeBuf, data]);
    const crcVal = crc32(body);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crcVal, 0);
    return Buffer.concat([lenBuf, body, crcBuf]);
  }

  // PNG Header
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 6; // Color type: RGBA
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // IDAT
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Brand drawing function
function farmiqIcon(x, y, w, h, isMaskable = false) {
  const nx = (x / w) * 2 - 1; // -1 to +1
  const ny = (y / h) * 2 - 1;
  const dist = Math.sqrt(nx * nx + ny * ny);

  // Gradient: Emerald #15803d to Deep Forest #052e16
  const t = (nx + ny + 2) / 4;
  let r = Math.round(21 * (1 - t) + 5 * t);
  let g = Math.round(163 * (1 - t) + 46 * t);
  let b = Math.round(74 * (1 - t) + 22 * t);
  let a = 255;

  if (!isMaskable) {
    // Rounded squircle: corner radius ~0.24
    const ax = Math.abs(nx);
    const ay = Math.abs(ny);
    const squircle = Math.pow(ax, 4) + Math.pow(ay, 4);
    if (squircle > 0.85) {
      return [0, 0, 0, 0]; // Transparent outside
    }
  }

  // Inner border highlight
  if (!isMaskable) {
    const ax = Math.abs(nx);
    const ay = Math.abs(ny);
    const sq = Math.pow(ax, 4) + Math.pow(ay, 4);
    if (sq > 0.72 && sq <= 0.82) {
      r = Math.min(255, r + 45);
      g = Math.min(255, g + 45);
      b = Math.min(255, b + 45);
    }
  }

  // Draw Central Leaves / Sprout
  // Left leaf
  const ldx = nx - (-0.2);
  const ldy = ny - (-0.1);
  if (Math.hypot(ldx, ldy) < 0.28 && nx < 0.05 && ny < 0.2) {
    r = 190; g = 242; b = 100; // Lime gold
  }

  // Right leaf
  const rdx = nx - (0.2);
  const rdy = ny - (-0.1);
  if (Math.hypot(rdx, rdy) < 0.28 && nx > -0.05 && ny < 0.2) {
    r = 34; g = 197; b = 94; // Vibrant green
  }

  // Golden Central Bud / Stem
  if (Math.abs(nx) < 0.06 && ny > -0.35 && ny < 0.35) {
    r = 254; g = 240; b = 138;
  }
  if (Math.hypot(nx, ny - (-0.38)) < 0.08) {
    r = 234; g = 179; b = 8; // Gold circle
  }

  // Marketplace Basket arc
  if (ny > 0.25 && ny < 0.42 && Math.abs(nx) < 0.42) {
    const curve = 0.28 + (nx * nx) * 0.7;
    if (Math.abs(ny - curve) < 0.07) {
      r = 255; g = 255; b = 255;
    }
  }

  return [r, g, b, a];
}

const outDir = path.resolve('public', 'icons');
fs.mkdirSync(outDir, { recursive: true });

// Generate 192x192
fs.writeFileSync(path.join(outDir, 'icon-192.png'), createPNG(192, 192, (x, y, w, h) => farmiqIcon(x, y, w, h, false)));
console.log('Created icon-192.png');

// Generate 512x512
fs.writeFileSync(path.join(outDir, 'icon-512.png'), createPNG(512, 512, (x, y, w, h) => farmiqIcon(x, y, w, h, false)));
console.log('Created icon-512.png');

// Generate maskable 192x192
fs.writeFileSync(path.join(outDir, 'icon-maskable-192.png'), createPNG(192, 192, (x, y, w, h) => farmiqIcon(x, y, w, h, true)));
console.log('Created icon-maskable-192.png');

// Generate maskable 512x512
fs.writeFileSync(path.join(outDir, 'icon-maskable-512.png'), createPNG(512, 512, (x, y, w, h) => farmiqIcon(x, y, w, h, true)));
console.log('Created icon-maskable-512.png');

// Generate favicon.png
fs.writeFileSync(path.resolve('public', 'favicon.png'), createPNG(64, 64, (x, y, w, h) => farmiqIcon(x, y, w, h, false)));
console.log('Created favicon.png');
