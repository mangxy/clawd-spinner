// Renders words' scenes to a PNG contact sheet: one row per word, frames across.
// npx tsx scripts/preview.ts out.png Baking Brewing ...   (no words: all of them)
import { writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'

import { ROWS } from '../hooks/acts'
import { frame } from '../hooks/frame'
import { WORDS } from '../hooks/words'

const [out = 'preview.png', ...asked] = process.argv.slice(2)
const words = asked.length ? asked : [...WORDS]
const COLS = 110, TIMES = [600, 2200, 3800, 5400, 7000], SCALE = 3, BG = 0x1b1b1e

const SX = COLS + 2, SY = ROWS * 2 + 4
const W = TIMES.length * SX * SCALE, H = words.length * SY * SCALE
const img = new Uint32Array(W * H).fill(0x0e0e10)

const dot = (x: number, y: number, c: number) => {
  for (let j = 0; j < SCALE; j++) for (let i = 0; i < SCALE; i++) img[(y * SCALE + j) * W + x * SCALE + i] = c
}
words.forEach((word, wi) => {
  TIMES.forEach((t, ti) => {
    const cells = frame({ word, t }, COLS)
    const ox = ti * SX, oy = wi * SY
    for (let r = 0; r < ROWS; r++) for (let x = 0; x < COLS; x++) {
      const i = (r * COLS + x) * 3, cp = cells[i]!, fg = cells[i + 1]!, bg = cells[i + 2]!
      const col = (c: number) => (c > 0xffffff ? BG : c)
      let top = BG, bot = BG
      if (cp === 0x2588) top = bot = col(fg)
      else if (cp === 0x2584) bot = col(fg)
      else if (cp === 0x2580) [top, bot] = [col(fg), col(bg)]
      else if (cp !== 0x20) top = bot = mixGlyph(col(fg))
      dot(ox + x, oy + 2 * r, top); dot(ox + x, oy + 2 * r + 1, bot)
    }
  })
})
function mixGlyph(c: number) { return c }  // a text glyph (note, digit): drawn as its colour

const crcT = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0 })
const crc = (b: Buffer) => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255]! ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0 }
const chunk = (type: string, data: Buffer) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td))
  return Buffer.concat([len, td, c])
}
const raw = Buffer.alloc((W * 3 + 1) * H)
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const p = img[y * W + x]!, o = y * (W * 3 + 1) + 1 + x * 3
  raw[o] = (p >> 16) & 255; raw[o + 1] = (p >> 8) & 255; raw[o + 2] = p & 255
}
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 2
writeFileSync(out, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]))
console.log(`${out}: ${words.length} words x ${TIMES.length} frames (rows in order: ${words.join(', ')})`)
