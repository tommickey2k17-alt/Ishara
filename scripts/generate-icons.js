/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createCrcTable() {
  const cTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    cTable[n] = c;
  }
  return cTable;
}

const crcTable = createCrcTable();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const toCrc = chunk.subarray(4, 8 + len);
  const crc = crc32(toCrc);
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

function createPng(width, height, drawPixelFn) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR: width(4), height(4), bitDepth(1), colorType(6: RGBA), compression(0), filter(0), interlace(0)
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Scanlines with filter byte 0
  const rowStride = width * 4 + 1;
  const rawData = Buffer.alloc(height * rowStride);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowStride;
    rawData[rowOffset] = 0; // Filter None
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawPixelFn(x, y, width, height);
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Brand Colors: Teal-700: #0f766e (15, 118, 110), White: 255, 255, 255, Accent Mint: #2dd4bf (45, 212, 191)
function drawAppIcon(x, y, width, height, isMaskable = false) {
  const nx = x / width;
  const ny = y / height;

  // Background
  const bgR = 15;
  const bgG = 118;
  const bgB = 110;

  if (isMaskable) {
    // Solid background extending to all edges for Android safe zone
    const cx = nx - 0.5;
    const cy = ny - 0.5;
    // Inner emblem centered in the 70% safe zone
    const dist = Math.sqrt(cx * cx + cy * cy);
    if (dist < 0.28) {
      // White shield background
      return [255, 255, 255, 255];
    }
    // Medical cross in center
    if (Math.abs(cx) < 0.05 && Math.abs(cy) < 0.16) {
      return [13, 148, 136, 255]; // Teal-600
    }
    if (Math.abs(cy) < 0.05 && Math.abs(cx) < 0.16) {
      return [13, 148, 136, 255];
    }
    return [bgR, bgG, bgB, 255];
  }

  // Rounded squircle icon for standard and iOS
  const cornerRadius = 0.22;
  const dx = Math.max(Math.abs(nx - 0.5) - (0.5 - cornerRadius), 0);
  const dy = Math.max(Math.abs(ny - 0.5) - (0.5 - cornerRadius), 0);
  const distFromCorner = Math.sqrt(dx * dx + dy * dy);

  if (distFromCorner > cornerRadius) {
    return [0, 0, 0, 0]; // Transparent outside squircle
  }

  // Inside Card/Emblem
  const cx = nx - 0.5;
  const cy = ny - 0.5;
  
  // White card in center
  if (Math.abs(cx) < 0.28 && Math.abs(cy) < 0.32) {
    // Medical cross inside white card
    if (Math.abs(cx) < 0.045 && cy > -0.22 && cy < 0.02) {
      return [15, 118, 110, 255]; // Teal cross vertical
    }
    if (Math.abs(cy + 0.10) < 0.045 && Math.abs(cx) < 0.14) {
      return [15, 118, 110, 255]; // Teal cross horizontal
    }
    // Pulse wave line near bottom of card
    if (Math.abs(cy - 0.14) < 0.015 && Math.abs(cx) < 0.20) {
      return [13, 148, 136, 255];
    }
    return [255, 255, 255, 255];
  }

  // Border ring
  if (distFromCorner > cornerRadius - 0.02) {
    return [45, 212, 191, 200];
  }

  return [bgR, bgG, bgB, 255];
}

const outDir = path.resolve('public');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

console.log('Generating PWA and web icon assets...');

// 1. 192x192
const png192 = createPng(192, 192, (x, y, w, h) => drawAppIcon(x, y, w, h, false));
fs.writeFileSync(path.join(outDir, 'pwa-192x192.png'), png192);
console.log('✓ Created public/pwa-192x192.png');

// 2. 512x512
const png512 = createPng(512, 512, (x, y, w, h) => drawAppIcon(x, y, w, h, false));
fs.writeFileSync(path.join(outDir, 'pwa-512x512.png'), png512);
console.log('✓ Created public/pwa-512x512.png');

// 3. 512x512 maskable (safe-zone padded)
const pngMaskable = createPng(512, 512, (x, y, w, h) => drawAppIcon(x, y, w, h, true));
fs.writeFileSync(path.join(outDir, 'pwa-maskable-512x512.png'), pngMaskable);
console.log('✓ Created public/pwa-maskable-512x512.png');

// 4. Apple Touch Icon (180x180)
const appleIcon = createPng(180, 180, (x, y, w, h) => drawAppIcon(x, y, w, h, false));
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), appleIcon);
console.log('✓ Created public/apple-touch-icon.png');

// 5. Favicon (32x32 PNG renamed or ICO format)
// Windows ICO header containing a 32x32 PNG
const png32 = createPng(32, 32, (x, y, w, h) => drawAppIcon(x, y, w, h, false));
const icoHeader = Buffer.alloc(6 + 16);
icoHeader.writeUInt16LE(0, 0); // reserved
icoHeader.writeUInt16LE(1, 2); // ICO type
icoHeader.writeUInt16LE(1, 4); // 1 image
icoHeader.writeUInt8(32, 6);   // width
icoHeader.writeUInt8(32, 7);   // height
icoHeader.writeUInt8(0, 8);    // color count
icoHeader.writeUInt8(0, 9);    // reserved
icoHeader.writeUInt16LE(1, 10); // color planes
icoHeader.writeUInt16LE(32, 12); // bpp
icoHeader.writeUInt32LE(png32.length, 14); // image size
icoHeader.writeUInt32LE(22, 18); // offset

const icoFile = Buffer.concat([icoHeader, png32]);
fs.writeFileSync(path.join(outDir, 'favicon.ico'), icoFile);
console.log('✓ Created public/favicon.ico');

console.log('All PWA assets successfully generated!');
