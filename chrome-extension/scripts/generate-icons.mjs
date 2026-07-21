import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const iconDirectory = resolve(scriptDirectory, "..", "icons");
mkdirSync(iconDirectory, { recursive: true });

function crc32(buffer) {
  let value = 0xffffffff;
  for (const byte of buffer) {
    value ^= byte;
    for (let bit = 0; bit < 8; bit += 1) value = (value >>> 1) ^ (value & 1 ? 0xedb88320 : 0);
  }
  return (value ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4); length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4); checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, checksum]);
}

function pointInPolygon(x, y, points) {
  let inside = false;
  for (let index = 0, previous = points.length - 1; index < points.length; previous = index++) {
    const [xi, yi] = points[index]; const [xj, yj] = points[previous];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function drawIcon(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const paint = (x, y, color) => {
    const offset = (y * size + x) * 4;
    pixels[offset] = color[0]; pixels[offset + 1] = color[1]; pixels[offset + 2] = color[2]; pixels[offset + 3] = color[3];
  };
  const scale = size / 128;
  const shield = [[64, 22], [97, 34], [91, 78], [64, 106], [37, 78], [31, 34]].map(([x, y]) => [x * scale, y * scale]);
  const leftTick = [[45, 65], [57, 77], [82, 48], [88, 55], [57, 87], [39, 70]].map(([x, y]) => [x * scale, y * scale]);
  const radius = 30 * scale;

  for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) {
    const nearX = Math.max(5 * scale, Math.min(x, size - 1 - 5 * scale));
    const nearY = Math.max(5 * scale, Math.min(y, size - 1 - 5 * scale));
    const rounded = (x - nearX) ** 2 + (y - nearY) ** 2 <= radius ** 2;
    if (!rounded) continue;
    paint(x, y, [230, 58, 30, 255]);
    if (pointInPolygon(x + 0.5, y + 0.5, shield)) paint(x, y, [13, 20, 34, 255]);
    if (pointInPolygon(x + 0.5, y + 0.5, leftTick)) paint(x, y, [248, 250, 252, 255]);
  }

  const rowLength = size * 4 + 1;
  const raw = Buffer.alloc(rowLength * size);
  for (let y = 0; y < size; y += 1) {
    raw[y * rowLength] = 0;
    pixels.copy(raw, y * rowLength + 1, y * size * 4, (y + 1) * size * 4);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0); header.writeUInt32BE(size, 4); header[8] = 8; header[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", header), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

for (const size of [16, 32, 48, 128]) writeFileSync(resolve(iconDirectory, `icon-${size}.png`), drawIcon(size));
console.log(`Generated Chrome extension icons in ${iconDirectory}`);
