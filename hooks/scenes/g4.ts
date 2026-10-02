import { CLAWD, CLAWD_TOP, GROUND, SPARKS, along, clawd, gear, ground, mix, put, rect, rnd, spot, sprite, wave } from '../acts'
import type { Canvas, Draw, Glyph } from '../acts'

// Words: Architecting, Blanching, Brewing, Cascading, Clauding, Concocting, Crunching, Dilly-dallying, Effecting, Fiddle-faddling, Fluttering, Galloping, Grooving, Honking, Incubating, Kerfuffling, Marinating, Mulling, Noodling, Perambulating, Pollinating, Processing, Razzle-dazzling, Sautéing, Shimmying, Sock-hopping, Swirling, Thundering, Transmuting, Waddling, Whisking

const line = (c: Canvas, x0: number, y0: number, x1: number, y1: number, col: number) => {
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))))
  for (let i = 0; i <= n; i++) put(c, x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, col)
}
const text = (g: Glyph[], x: number, y: number, s: string, fg: number) =>
  [...s].forEach((ch, i) => g.push({ x: Math.round(x) + i, row: Math.max(0, Math.min(7, Math.floor(y / 2))), ch, fg }))
const steam = (c: Canvas, t: number, x: number, y: number, col = 0x9aa0b0, n = 3) => {
  for (let k = 0; k < n; k++) {
    const life = (t / 120 + k * 5) % 9
    put(c, x + k * 2 + Math.round(Math.sin(life * 0.8 + k)), y - life, mix(col, 0x1a1c24, life / 9))
  }
}
const beat = (t: number, ms: number) => Math.floor(t / ms)
const BOWL = ['gggggggggggggg', 'gllllllllllllg', 'gllllllllllllg', '.gllllllllllg.', '..gllllllllg..', '...gggggggg...']

const architecting: Draw = (c, m) => {
  const cx = spot(c.W, 0.2)
  const bx = cx + 24
  const floors = 1 + Math.floor(((m.t % 7000) / 7000) * 6)
  const roof = GROUND - 2 - (floors - 1) * 2
  for (let k = 0; k < floors; k++) {
    const y = GROUND - 2 - k * 2
    rect(c, bx, y, 12, 2, k % 2 ? 0x8a919b : 0x6b7086)
    for (let w = 0; w < 3; w++) put(c, bx + 2 + w * 4, y, rnd(k * 3 + w, 4) > 0.5 ? 0xffe066 : 0x2e3440)
  }
  if (floors === 6) { rect(c, bx + 6, roof - 3, 1, 3, 0xcccccc); rect(c, bx + 7, roof - 3, 2, 1, 0xd94f4f) }
  rect(c, bx + 16, 1, 1, 14, 0xd9a82f); rect(c, bx + 2, 1, 17, 1, 0xd9a82f); rect(c, bx + 19, 0, 3, 2, 0x7a7a82)
  const tx = Math.round(bx + 6 + wave(m.t, 3200) * 7)
  const hy = Math.round(3 + wave(m.t, 2000, 2) * Math.max(0, roof - 7))
  line(c, tx, 2, tx, hy, 0xcccccc); rect(c, tx - 1, hy, 3, 2, 0xd9534f)
  const { hand } = clawd(c, m.t, 'pan', cx)
  rect(c, cx + 3, CLAWD_TOP - 1, 8, 1, 0xffd54f); rect(c, cx + 5, CLAWD_TOP - 2, 4, 1, 0xffd54f)
  rect(c, hand[0] + 1, hand[1] - 1, 7, 3, 0x2f6fb5)  // the blueprint
  for (let i = 0; i < 3; i++) put(c, hand[0] + 2 + i * 2, hand[1] - 1 + (i + beat(m.t, 500)) % 3, 0xdfe7ff)
  ground(c, 0x5a4a3a)
}

const blanching: Draw = (c, m) => {
  const cx = spot(c.W, 0.2)
  const px = cx + 17
  const ix = px + 15
  const { hand } = clawd(c, m.t, 'pan', cx)
  rect(c, hand[0] + 1, hand[1], 3, 1, 0x9aa0b0)  // tongs
  rect(c, px, GROUND - 6, 10, 6, 0x6b7086); rect(c, px + 1, GROUND - 6, 8, 1, 0x6fb6ff); rect(c, px - 2, GROUND - 5, 2, 1, 0x6b7086); rect(c, px + 10, GROUND - 5, 2, 1, 0x6b7086)
  for (let k = 0; k < 3; k++) put(c, px + 2 + k * 3 + Math.round(Math.sin(m.t / 200 + k)), GROUND - 7 - ((m.t / 150 + k * 3) % 4), 0xdff3ff)
  steam(c, m.t, px + 1, GROUND - 8)
  rect(c, ix, GROUND - 4, 11, 4, 0x8fb8d8); rect(c, ix + 1, GROUND - 4, 9, 1, 0xb9ecff)
  for (let k = 0; k < 3; k++) rect(c, ix + 1 + k * 3, GROUND - 5 + Math.round(wave(m.t, 900, k * 2)), 2, 2, 0xf4fbff)  // ice
  for (const o of [0, 1500]) {
    const p = ((m.t + o) % 3000) / 1500
    if (p >= 1) continue
    const bx = px + 4 + p * (ix - px + 1), by = GROUND - 8 - Math.sin(p * Math.PI) * 6
    rect(c, bx, by, 3, 1, mix(0x9aa860, 0x37d65a, p))
    if (p > 0.9) for (let s = 0; s < 4; s++) put(c, ix + 5 + (s - 2) * 2, GROUND - 6 - (s % 2), 0x9ad7ff)
  }
  ground(c)
}

const brewing: Draw = (c, m) => {
  const cx = spot(c.W, 0.25)
  const vx = cx + 18
  const { hand } = clawd(c, m.t, 'pan', cx)
  rect(c, vx, 2, 9, 11, 0xb87333); rect(c, vx + 1, 3, 2, 9, 0xd99a5b)
  for (let j = 0; j < 4; j++) put(c, vx + 7, 4 + j * 2, 0x6a3f1a)
  rect(c, vx + 1, 13, 1, 2, 0x6a3f1a); rect(c, vx + 7, 13, 1, 2, 0x6a3f1a)
  for (let k = 0; k < 5; k++) put(c, vx + 1 + k * 2, 1 - Math.round(wave(m.t, 700, k)) + (k % 2), 0xfff3d6)  // foam
  rect(c, vx - 2, 7, 3, 1, 0x8a919b)  // tap
  const p = (m.t % 4500) / 4500
  const fill = Math.min(3, Math.floor(p * 5))
  const mx = hand[0] + 1
  rect(c, mx, hand[1] - 1, 4, 4, 0xd9dde8); rect(c, mx + 1, hand[1], 2, 2 + 0, 0x0); put(c, mx + 4, hand[1], 0xd9dde8)
  rect(c, mx + 1, hand[1] + 2 - fill, 2, fill, 0xe0a030)
  if (fill) rect(c, mx, hand[1] - 1 + (3 - fill), 4, 1, 0xfff3d6)
  if (p < 0.6) for (let s = 8; s < hand[1] - 1; s++) put(c, vx - 2, s, (s + beat(m.t, 80)) % 2 ? 0xe0a030 : 0xffd54f)
  ground(c, 0x4a3a2a)
}

const cascading: Draw = (c, m) => {
  const sx = spot(c.W, 0.15)
  for (let i = 0; i < 4; i++) {
    const x0 = sx + i * 9, top = 3 + i * 3
    rect(c, x0, top, 9, GROUND - top, i % 2 ? 0x565b68 : 0x5e6478)
    rect(c, x0, top - 1, 9, 1, 0x4fa3d9)
    for (let y = top - 1; y < top + 3; y++) put(c, x0 + 8, y, (y + beat(m.t, 90)) % 3 ? 0x9ad7ff : 0x4fa3d9)
    for (let s = 0; s < 2; s++) put(c, x0 + 9 + s, top + 2 + (beat(m.t, 110) + s + i) % 2, 0xdff3ff)
  }
  const px = sx + 36
  for (let x = px; x < px + 22; x++) put(c, x, GROUND - 1, (x + beat(m.t, 160)) % 4 ? 0x4fa3d9 : 0x9ad7ff)
  for (let k = 0; k < 6; k++) put(c, px - 1 + Math.cos(k * 1.1 + m.t / 90) * 3 + 3, GROUND - 3 - Math.abs(Math.sin(k * 1.7 + m.t / 140)) * 3, 0xdff3ff)
  clawd(c, m.t, 'dance', px + 5)
  ground(c, 0x3a4a5a)
}

const clauding: Draw = (c, m, glyphs) => {
  const cx = spot(c.W, 0.25)
  const tx = cx + 17
  clawd(c, m.t, 'hammer', cx)
  rect(c, tx, 2, 24, 12, 0x2e3440); rect(c, tx + 1, 3, 22, 10, 0x14161c); rect(c, tx + 9, 14, 6, 1, 0x2e3440)
  const top = beat(m.t, 420)
  for (let j = 0; j < 5; j++) {
    const idx = top + j
    const len = 4 + Math.floor(rnd(idx, 1) * 12)
    const last = j === 4
    const w = last ? Math.min(len, (m.t % 420) / 30 + 1) : len
    rect(c, tx + 2 + (idx % 3) * 2, 12 - (4 - j) * 2 + 0, Math.floor(w), 1, rnd(idx, 2) > 0.5 ? CLAWD : [0xdfe7ff, 0x6ad94f, 0x4fa3d9][idx % 3]!)
  }
  rect(c, tx + 2, 3, 2, 1, m.t % 600 < 300 ? 0xf4f4f4 : 0x14161c)  // cursor
  for (let k = 0; k < 4; k++) text(glyphs, tx + 4 + ((m.t / 140 + k * 7) % 26), 0, '{};</>'[(k * 3 + beat(m.t, 700)) % 6]!, mix(CLAWD, 0x1a1c24, 0.2))
  ground(c)
}

const concocting: Draw = (c, m) => {
  const cx = spot(c.W, 0.2)
  const { hand } = clawd(c, m.t, 'umbrella', cx)
  const cols = [0xe0455b, 0x4f7fd9, 0x4fd36a]
  const k = beat(m.t, 1100)
  const flask = cols[k % 3]!
  rect(c, hand[0] + 1, 3, 3, 4, flask); put(c, hand[0] + 2, 2, 0xcfd8e8)
  const bx = hand[0] + 2
  const mixed = mix(cols[k % 3]!, cols[(k + 1) % 3]!, wave(m.t, 1100))
  rect(c, bx - 2, 12, 24, 1, 0x7a4a24); rect(c, bx - 2, 13, 1, 2, 0x7a4a24); rect(c, bx + 21, 13, 1, 2, 0x7a4a24)
  sprite(c, ['..g..', '.glg.', 'glllg', 'glllg', 'ggggg'], { g: 0xcfd8e8, l: mixed }, bx, 7)
  sprite(c, ['..g..', '.glg.', 'glllg', 'ggggg'], { g: 0xcfd8e8, l: cols[1]! }, bx + 9, 8)
  sprite(c, ['.g.', 'glg', 'ggg'], { g: 0xcfd8e8, l: cols[0]! }, bx + 16, 9)
  for (let d = 0; d < 3; d++) put(c, bx + 2, 6 + ((m.t / 60 + d * 2) % 5), flask)
  for (let s = 0; s < 4; s++) {
    const life = (m.t / 140 + s * 4) % 12
    put(c, bx + 2 + Math.round(Math.sin(life + s)) * 2, 6 - life * 0.5, mix(mixed, 0x1a1c24, life / 12))
  }
  ground(c)
}

const crunching: Draw = (c, m, glyphs) => {
  const span = c.W + 18
  const x = ((m.t * 0.011) % span) - 16
  const step = beat(m.t, 160)
  for (let lx = 0; lx < c.W; lx += 3) {
    const ahead = lx > x + 8
    const col = [0xd9a82f, 0xc2523a, 0xe08a2f, 0x8a5a2a][Math.floor(rnd(lx, 5) * 4)]!
    if (ahead) { rect(c, lx, GROUND - 2, 2, 2, col); if (rnd(lx, 6) > 0.4) put(c, lx, GROUND - 3, col) }
    else if (lx < x + 8 && lx > x - 30) put(c, lx, GROUND - 1, 0x6a4a2a)
  }
  clawd(c, m.t, 'walk', x, 1, step % 2 ? 1 : 0)
  for (let k = 0; k < 6; k++) {
    const life = ((m.t / 150) + k * 0.7) % 3
    put(c, x + 4 + (k % 2) * 7 + (k - 3) * life * 0.9, GROUND - 2 - Math.sin((life / 3) * Math.PI) * 4, [0xd9a82f, 0xc2523a, 0xe08a2f][k % 3]!)
  }
  if (m.t % 1500 < 600) text(glyphs, x + 5, 3, 'CRUNCH', 0xe08a2f)
}

const dillyDallying: Draw = (c, m) => {
  const stops = [{ x: 3, stay: 1500 }, { x: spot(c.W, 0.2), stay: 1900 }, { x: spot(c.W, 0.11), stay: 1200 }, { x: spot(c.W, 0.36), stay: 1700 }]
  const fx = spot(c.W, 0.2) + 20
  rect(c, fx, GROUND - 4, 1, 4, 0x4f9a3a); sprite(c, ['.p.', 'pyp', '.p.'], { p: 0xd94f8a, y: 0xffe066 }, fx - 1, GROUND - 7)
  const at = along(stops.map(s => ({ ...s, pose: 'pan' as const })), m.t)
  clawd(c, m.t, at.pose, at.x, at.facing)
  const cxk = spot(c.W, 0.78), a = m.t / 700
  for (let k = 0; k < 16; k++) put(c, cxk + Math.cos((k / 16) * 6.283) * 4, 5 + Math.sin((k / 16) * 6.283) * 4, 0xdfe7ff)
  line(c, cxk, 5, cxk + Math.cos(a) * 3, 5 + Math.sin(a) * 3, 0xe0455b); line(c, cxk, 5, cxk + Math.cos(a / 12) * 2, 5 + Math.sin(a / 12) * 2, 0xdfe7ff)
  const sx = c.W - ((m.t * 0.007) % (c.W + 12))
  sprite(c, ['.bb.', 'bkb.', 'ttttt'], { b: 0x8a5a2a, k: 0x5a3a1a, t: 0xc8b88a }, sx, GROUND - 3)
  put(c, sx - 1, GROUND - 4, 0xc8b88a)
  ground(c, 0x2d4a2b)
}

const effecting: Draw = (c, m) => {
  const cx = spot(c.W, 0.15)
  const t = m.t % 7500
  const bx = cx + 16
  const dx0 = bx + 15
  const { hand } = clawd(c, Math.floor(m.t / 700) * 700 + (t < 500 ? 500 : 0), 'hammer', cx)
  rect(c, bx, GROUND - 2, 5, 2, 0x55555f); rect(c, bx + 1, GROUND - 3 - (t < 500 ? 0 : 1), 3, 1, 0xe0455b)
  if (t > 500 && t < 2200) {
    const bxp = bx + 6 + ((t - 500) / 1700) * (dx0 - bx - 8)
    rect(c, bxp, GROUND - 3, 2, 2, 0xe0455b)
  }
  for (let i = 0; i < 6; i++) {
    const p = Math.max(0, Math.min(1, (t - (2000 + i * 280)) / 260))
    for (let h = 0; h < 5; h++) put(c, dx0 + i * 5 + Math.round(h * p), GROUND - 1 - Math.round(h * (1 - p)), h === 2 ? 0x4a4a5a : 0xeeeeee)
  }
  const lx = dx0 + 6 * 5 + 3
  const lit = t > 3900 && t < 6600
  sprite(c, ['.yyy.', 'yyyyy', 'yyyyy', '.yyy.', '..g..'], { y: lit ? 0xffe066 : 0x4a4a5a, g: 0x8a919b }, lx, GROUND - 7)
  if (lit) for (const [dx, dy] of [[-2, 2], [6, 2], [2, -1]]) put(c, lx + dx!, GROUND - 7 + dy!, 0xfff6c8)
  void hand
  ground(c)
}

const fiddleFaddling: Draw = (c, m, glyphs) => {
  const cx = spot(c.W, 0.3)
  clawd(c, m.t, 'pan', cx)
  const vx = cx + 15
  rect(c, vx, 10, 5, 4, 0xa0522d); rect(c, vx + 1, 11, 3, 2, 0x7a3a1a); put(c, vx + 2, 11, 0x14161c)
  rect(c, vx + 5, 11, 5, 1, 0x4a2a14); put(c, vx + 10, 10, 0x4a2a14)
  const bw = Math.sin(m.t / 180) * 2
  line(c, vx + 4 + bw, 7, vx + 1 + bw, 14, 0xe8dcc0)
  for (let k = 0; k < 3; k++) {
    const life = ((m.t / 900) + k / 3) % 1
    text(glyphs, vx + 10 + k * 3 + Math.round(life * 3), 3 - life * 3, k % 2 ? '♫' : '♪', [0xd94f8a, 0x4fa3d9, 0xd9c84f][k]!)
  }
  ground(c, 0x4a3a2a)
}

const flutterBug = (c: Canvas, t: number, x: number, y: number, a: number, b: number, ph: number) => {
  const open = Math.floor(t / 130 + ph * 3) % 2
  put(c, x, y, 0x2a2a30); put(c, x, y + 1, 0x2a2a30)
  for (const s of [-1, 1]) {
    put(c, x + s, y - open, a); put(c, x + s * 2, y - open, a); put(c, x + s, y + 1 - (open ? 1 : 0), b)
    if (open) put(c, x + s * 2, y - 1 - open, a)
  }
}
const fluttering: Draw = (c, m) => {
  const cx = spot(c.W, 0.4)
  const { hand } = clawd(c, m.t, 'pan', cx)
  for (let k = 0; k < c.W; k += 7) { const h = 2 + Math.floor(rnd(k, 8) * 2); rect(c, k, GROUND - 1 - h, 1, h, 0x4f9a3a); put(c, k, GROUND - 2 - h, [0xd94f8a, 0xffe066, 0x9a6ad9][k % 3]!) }
  const cols: [number, number][] = [[0xff9e3d, 0xffd54f], [0x4fa3d9, 0xdfe7ff], [0xd94f8a, 0xffd1e4], [0x9a6ad9, 0xe6d6ff], [0xffd54f, 0xffffff]]
  cols.forEach(([a, b], k) => flutterBug(c, m.t, cx + 7 + Math.sin(m.t / 1300 + k * 1.9) * 34, 4 + Math.sin(m.t / 410 + k * 2.3) * 3, a, b, k * 0.3))
  if (m.t % 6000 < 2400) flutterBug(c, m.t * 0.5, hand[0] + 1, hand[1] - 3, 0xff9e3d, 0xffd54f, 0)
  ground(c, 0x2d4a2b)
}

const galloping: Draw = (c, m) => {
  const span = c.W + 40
  const x = ((m.t * 0.034) % span) - 24
  const up = beat(m.t, 140) % 2
  for (let k = 0; k < 4; k++) {
    const cxp = (k * (c.W / 3.3) + 20 - m.t * 0.012) % (c.W + 20)
    const px = cxp < 0 ? cxp + c.W + 20 : cxp
    rect(c, px, GROUND - 5, 1, 5, 0x3d7a3a); rect(c, px - 2, GROUND - 4, 1, 2, 0x3d7a3a); rect(c, px + 2, GROUND - 5, 1, 2, 0x3d7a3a); rect(c, px - 2, GROUND - 3, 3, 1, 0x3d7a3a)
  }
  rect(c, c.W - 14, 1, 4, 4, 0xffd54f)
  clawd(c, m.t, 'walk', x, 1, up)
  rect(c, x + 1, CLAWD_TOP - 1 - up, 12, 1, 0x7a4a24); rect(c, x + 4, CLAWD_TOP - 3 - up, 6, 2, 0x7a4a24)
  const hy = x + 14, y0 = CLAWD_TOP + 1 - up
  sprite(c, ['..bbb', '.bbbbb', 'bbwkbb', 'bbbbbn'], { b: 0x9a6a3a, w: 0xffffff, k: 0x14161c, n: 0xd98a8a }, hy, y0 + 1)
  rect(c, hy, y0, 2, 1, 0x2a1a0a)
  line(c, hy + 1, y0 + 5, x + 8, GROUND - 1, 0x7a4a24)
  for (let k = 0; k < 4; k++) {
    const life = ((m.t / 100) + k * 2) % 8
    put(c, x - 1 - life * 1.2, GROUND - 1 - (life * 0.4) - (k % 2), mix(0xc8a878, 0x1a1c24, life / 8))
  }
  ground(c, 0x8a6a3a)
}

const grooving: Draw = (c, m) => {
  const cx = spot(c.W, 0.3)
  const hop = -(beat(m.t, 300) % 2)
  clawd(c, m.t, 'dance', cx)
  const y = CLAWD_TOP + hop
  rect(c, cx + 1, y - 1, 12, 1, 0x3a3a42); rect(c, cx + 1, y, 1, 2, 0xd94f4f); rect(c, cx + 12, y, 1, 2, 0xd94f4f)
  const tx = cx + 22
  rect(c, tx, 10, 18, 5, 0x7a4a24); rect(c, tx, 10, 18, 1, 0x9a6a3a)
  rect(c, tx + 2, 8, 12, 1, 0x14161c); rect(c, tx + 1, 9, 14, 1, 0x14161c); rect(c, tx + 3, 7, 10, 1, 0x14161c)
  const a = m.t / 250
  put(c, tx + 8 + Math.cos(a) * 5, 8 + Math.sin(a) * 1.2, 0x8a919b); put(c, tx + 8, 8, 0xd94f4f); put(c, tx + 7, 8, 0xd94f4f)
  line(c, tx + 16, 6, tx + 11, 8, 0xdfe7ff)
  for (let k = 0; k < 6; k++) {
    const h = 1 + Math.floor(rnd(k, beat(m.t, 160)) * 7)
    rect(c, tx + 20 + k * 2, GROUND - h, 1, h, [0x6ad94f, 0xd9c84f, 0xe0455b][h > 5 ? 2 : h > 3 ? 1 : 0]!)
  }
  ground(c, 0x3a2a4a)
}

const honking: Draw = (c, m, glyphs) => {
  const cx = spot(c.W, 0.25)
  const { hand } = clawd(c, m.t, 'pan', cx)
  const p = m.t % 1800
  const squeeze = p > 1000 && p < 1300
  const hx = hand[0] + 1, hy = hand[1]
  rect(c, hx, hy - (squeeze ? 0 : 1), 3, squeeze ? 2 : 3, 0xe0455b)
  rect(c, hx + 3, hy, 3, 1, 0xd9c84f); rect(c, hx + 6, hy - 1, 2, 3, 0xd9c84f); rect(c, hx + 8, hy - 2, 1, 5, 0xffe066)
  if (p > 1100) {
    const life = Math.min(1, (p - 1100) / 700)
    for (let k = 0; k < 3; k++) {
      const r = 3 + k * 3 + life * 6
      for (let a = -0.9; a <= 0.9; a += 0.18) put(c, hx + 8 + Math.cos(a) * r, hy + Math.sin(a) * r * 0.9, mix(0xffe066, 0x1a1c24, Math.min(1, life + k * 0.1)))
    }
    text(glyphs, hx + 14 + Math.round(life * 2), 2 + Math.round(life), p > 1500 ? 'HONK!!' : 'HONK', p % 200 < 100 ? 0xffe066 : 0xf4f4f4)
  }
  ground(c)
}

const incubating: Draw = (c, m) => {
  const cx = spot(c.W, 0.2)
  const ix = cx + 19
  const t = m.t % 7000
  const { hand } = clawd(c, m.t, 'pan', cx)
  rect(c, hand[0] + 1, hand[1] - 1, 1, 3, 0xdfe7ff); put(c, hand[0] + 1, hand[1] + 1, 0xe0455b)  // thermometer
  rect(c, ix - 1, 5, 24, 10, 0x9ad7ff); rect(c, ix, 6, 22, 8, 0x4a2e1a); rect(c, ix - 1, 14, 24, 1, 0x3a3f4b)
  const glow = mix(0xff6a2a, 0xffd54f, wave(m.t, 500))
  rect(c, ix + 8, 2, 6, 2, 0x3a3f4b); rect(c, ix + 9, 4, 4, 1, glow)
  for (let k = 0; k < 4; k++) put(c, ix + 2 + k * 6, 5 - Math.floor(wave(m.t, 600, k)), mix(glow, 0x1a1c24, 0.5))
  for (let k = 0; k < 3; k++) {
    const ex = ix + 3 + k * 6, wob = t < 5600 && k === 1 ? Math.round(Math.sin(m.t / 140)) : 0
    if (k === 1 && t > 5600) {
      const rise = Math.min(1, (t - 5600) / 800)
      rect(c, ex, 10, 4, 3, 0xf3efe0); sprite(c, ['.yy.', 'yyyy', 'yknn'], { y: 0xffe066, k: 0x14161c, n: 0xff9e3d }, ex, 8 - Math.round(rise * 2))
      rect(c, ex - 1, 11 - Math.round(rise), 1, 1, 0xf3efe0); rect(c, ex + 4, 11 - Math.round(rise), 1, 1, 0xf3efe0)
    } else rect(c, ex + wob, 9, 3, 4, 0xf3efe0)
  }
  const heat = Math.floor(2 + wave(m.t, 4000) * 4)
  for (let j = 0; j < heat; j++) put(c, ix + 23, 13 - j, 0xe0455b)
  ground(c, 0x3a3a42)
}

const kerfuffling: Draw = (c, m, glyphs) => {
  const cx = spot(c.W, 0.35)
  const f = beat(m.t, 110)
  const j = (k: number) => Math.round((rnd(f, k) - 0.5) * 2)
  clawd(c, m.t, 'dance', cx + j(1), 1, rnd(f, 2) > 0.6 ? 1 : 0)
  const rx = cx + 20 + j(3)
  rect(c, rx, CLAWD_TOP + j(4), 14, 5, 0x4f7fd9); rect(c, rx + 3, CLAWD_TOP + 1, 1, 2, 0x14161c); rect(c, rx + 10, CLAWD_TOP + 1, 1, 2, 0x14161c)
  const mx = cx + 17, my = 10
  for (let k = 0; k < 6; k++) {
    const a = rnd(f, k + 10) * 6.283
    line(c, mx, my, mx + Math.cos(a) * 9, my + Math.sin(a) * 4, k % 2 ? CLAWD : 0x4f7fd9)
  }
  for (let k = 0; k < 12; k++) {
    const bxp = mx + (rnd(f, k + 20) - 0.5) * 17, byp = my + (rnd(f, k + 40) - 0.5) * 8
    rect(c, bxp - 1, byp - 1, 3, 2, rnd(k, 3) > 0.5 ? 0xcfd0d8 : 0x9aa0b0)
  }
  for (let k = 0; k < 3; k++) {
    const a = m.t / 300 + k * 2.1
    const sx = mx + Math.cos(a) * 9, sy = 4 + Math.sin(a) * 2
    put(c, sx, sy, 0xffe066); put(c, sx - 1, sy, 0xfff3a8); put(c, sx + 1, sy, 0xfff3a8); put(c, sx, sy - 1, 0xfff3a8); put(c, sx, sy + 1, 0xfff3a8)
  }
  for (let k = 0; k < 3; k++) text(glyphs, mx - 8 + k * 8 + (f % 2), 2, '!#@?*'[(f + k * 2) % 5]!, SPARKS[(f + k) % 4]!)
  ground(c)
}

const marinating: Draw = (c, m) => {
  const cx = spot(c.W, 0.22)
  const p = (m.t % 7000) / 7000
  const at = Math.floor(m.t / 1000) * 1000
  const { hand } = clawd(c, m.t * 0.5 + at * 0, 'hammer', cx)
  const bx = cx + 17
  sprite(c, BOWL, { g: 0xcfd8e8, l: 0x6b3a1e }, bx, GROUND - 6)
  for (let k = 0; k < 3; k++) {
    const mx = bx + 2 + k * 3, my = 10 + Math.round(wave(m.t, 1500, k * 2))
    rect(c, mx, my, 3, 2, mix(0xd98a8a, 0x7a3a22, p))
  }
  for (const [dx, dy] of [[3, 0], [9, 1], [6, 2]]) put(c, bx + dx! + Math.round(Math.sin(m.t / 600 + dx!)), 10 + dy!, [0x4fb04f, 0xf3efe0, 0x4fb04f][dy!]!)
  for (let k = 0; k < 3; k++) put(c, bx + 3 + k * 3, 8 - ((m.t / 200 + k * 2) % 3), 0x9a6a3a)
  line(c, hand[0], hand[1], bx + 6, 11, 0xb08d57); rect(c, bx + 5, 11, 3, 1, 0x8a919b)
  put(c, bx + 6 + Math.round(Math.sin(m.t / 100) * 2), 9, 0x6b3a1e)
  rect(c, bx + 17, 3, 7, 1, 0x3a3a42)  // the clock: marinade time
  rect(c, bx + 17, 3, Math.floor(p * 7), 1, 0xe0a030)
  ground(c, 0x4a4a52)
}

const mulling: Draw = (c, m) => {
  const cx = spot(c.W, 0.3)
  const sip = m.t % 5000 > 2600
  const { hand } = clawd(c, m.t, sip ? 'umbrella' : 'pan', cx)
  const y = CLAWD_TOP
  rect(c, cx + 2, y + 3, 10, 1, 0xd94f4f)
  const fl = Math.round(Math.sin(m.t / 200))
  rect(c, cx + 9, y + 4, 2, 2 + (fl > 0 ? 1 : 0), 0xd94f4f)
  rect(c, hand[0] + 1, hand[1] - 2, 4, 4, 0xd9dde8); rect(c, hand[0] + 2, hand[1] - 2, 2, 1, 0x7a1a2a); put(c, hand[0] + 5, hand[1] - 1, 0xd9dde8); put(c, hand[0] + 5, hand[1], 0xd9dde8)
  line(c, hand[0] + 2, hand[1] - 3, hand[0] + 4, hand[1] - 5, 0x7a4a24); put(c, hand[0] + 1, hand[1] - 3, 0xffa030); put(c, hand[0] + 4, hand[1] - 3, 0xffa030)
  steam(c, m.t, hand[0] + 1, hand[1] - 4, 0xe8e4c8)
  for (let k = 0; k < c.W / 5; k++) {
    const fx = (rnd(k, 1) * c.W + Math.sin(m.t / 700 + k) * 3) % c.W
    put(c, fx, ((m.t / 45 + rnd(k, 2) * 20) % 15), 0xf4f8ff)
  }
  ground(c, 0xcfd8e8)
}

const noodling: Draw = (c, m) => {
  const cx = spot(c.W, 0.25)
  const { hand } = clawd(c, m.t * 0.5, 'hammer', cx)
  const bx = cx + 14
  rect(c, bx, 12, 13, 1, 0xe0a85a); rect(c, bx, 13, 13, 1, 0xc8443c); rect(c, bx + 1, 14, 11, 1, 0xc8443c); rect(c, bx + 1, 13, 11, 1, 0xf4f4f4)
  rect(c, bx + 2, 11, 3, 1, 0xf4f4f4); put(c, bx + 3, 11, 0xffd54f); put(c, bx + 8, 11, 0xff9aa8); put(c, bx + 9, 11, 0xf4d4d8); put(c, bx + 6, 11, 0x4fb04f); put(c, bx + 11, 11, 0x4fb04f)
  const tipX = hand[0] + 6, tipY = hand[1] - 1
  line(c, hand[0], hand[1], tipX, tipY, 0x7a4a24); line(c, hand[0], hand[1] + 1, tipX, tipY + 1, 0x9a6a3a)
  for (let k = 0; k < 3; k++) {
    for (let s = 0; s <= 8; s++) {
      const u = s / 8
      put(c, tipX - 1 + k + Math.sin(u * 5 + m.t / 160 + k) * (0.8 + u), tipY + 1 + u * (12 - tipY - 1), 0xf2d675)
    }
  }
  steam(c, m.t, bx + 3, 9, 0xdfe7ff)
  ground(c)
}

const perambulating: Draw = (c, m) => {
  const span = c.W + 50
  const x = ((m.t * 0.013) % span) - 36
  const step = beat(m.t, 200) % 2
  for (let k = 0; k < c.W; k += 38) {
    const lx = k + 11
    rect(c, lx, 3, 1, GROUND - 3, 0x5a5f6b); rect(c, lx - 1, 2, 3, 2, 0xffe066)
    sprite(c, ['.ggg.', 'ggggg', 'ggggg', '..t..'], { g: 0x3d7a3a, t: 0x5a3a22 }, lx + 14, GROUND - 5)
  }
  const { hand } = clawd(c, m.t, 'carry', x, 1, step)
  const px = x + 16, py = step
  line(c, hand[0], hand[1], px, 9 + py, 0x9a6a3a)
  rect(c, px, 9 + py, 10, 3, 0xe8b4c8); rect(c, px, 7 + py, 4, 2, 0x4f7fd9)
  rect(c, px + 4, 7 + py, 5, 2, CLAWD); put(c, px + 5, 7 + py, 0x1a1410); put(c, px + 7, 7 + py, 0x1a1410)
  rect(c, px + 4, 9 + py, 6, 1, 0xf4f4f4)
  for (const wx of [px + 1, px + 7]) { rect(c, wx, 12 + py, 3, 3 - py, 0x2a2d36); put(c, wx + 1 + Math.round(Math.cos(m.t / 120)), 13 + py + Math.round(Math.sin(m.t / 120)), 0xcfd8e8) }
  ground(c, 0x4a4a52)
}

const pollinating: Draw = (c, m) => {
  const f1 = spot(c.W, 0.25) + 14, f2 = spot(c.W, 0.62) + 14
  for (const [fx, a] of [[f1, 0xd94f8a], [f2, 0x9a6ad9]] as const) {
    rect(c, fx, 7, 1, 8, 0x4f9a3a); put(c, fx - 1, 11, 0x6ab84f)
    sprite(c, ['.p.', 'pyp', '.p.'], { p: a, y: 0xffe066 }, fx - 1, 4)
  }
  const at = along([{ x: f1 - 15, stay: 1500, pose: 'float' }, { x: f2 - 15, stay: 1500, pose: 'float' }], m.t, 'float')
  const lift = 3 + Math.round(wave(m.t, 500) * 2)
  clawd(c, m.t, 'float', at.x, 1, lift)
  const x = Math.round(at.x), y = CLAWD_TOP - lift
  for (const i of [4, 8]) rect(c, x + i, y, 1, 5, 0x1a1410)
  const fl = beat(m.t, 60) % 2
  rect(c, x + 4, y - 2 - fl, 2, 2, 0xdff3ff); rect(c, x + 8, y - 2 - fl, 2, 2, 0xdff3ff)
  put(c, x + 5, y - 3, 0x1a1410); put(c, x + 9, y - 3, 0x1a1410)
  for (let k = 0; k < 6; k++) put(c, x + 14 + ((m.t / 90 + k * 3) % 9) * (at.still ? 0.6 : -0.6), y + 3 + Math.sin(m.t / 130 + k * 2) * 3, 0xffe066)
  ground(c, 0x2d4a2b)
}

const processing: Draw = (c, m) => {
  const cx = spot(c.W, 0.14)
  clawd(c, m.t, 'crank', cx)
  const b0 = cx + 17, mx = b0 + 18
  for (let x = b0; x < b0 + 48; x++) put(c, x, GROUND - 1, (x + beat(m.t, 90)) % 4 ? 0x3a3f4b : 0x6b7086)
  rect(c, mx, 2, 14, 5, 0x6b7086); rect(c, mx, 7, 2, 7, 0x55555f); rect(c, mx + 12, 7, 2, 7, 0x55555f)
  gear(c, mx + 4, 4, 2, m.t / 300, 0xd9c84f)
  for (let k = 0; k < 3; k++) put(c, mx + 8 + k * 2, 3, rnd(k, beat(m.t, 200)) > 0.5 ? 0x6ad94f : 0xe0455b)
  const bpos = (k: number) => b0 + ((m.t * 0.02 + k * 16) % 48)
  let stamp = 0
  for (let k = 0; k < 3; k++) {
    const bxp = bpos(k)
    if (Math.abs(bxp - (mx + 5.5)) < 3) stamp = 1
    rect(c, bxp, GROUND - 4, 3, 3, bxp > mx + 7 ? 0x37d65a : 0xb07a3a)
    if (bxp > mx + 7) put(c, bxp + 1, GROUND - 3, 0xf4f4f4)
  }
  rect(c, mx + 6, 7, 2, 1 + stamp * 3, 0x9aa0b0)
  ground(c)
}

const razzleDazzling: Draw = (c, m, glyphs) => {
  const cx = spot(c.W, 0.5) - 7
  const bx = cx + 7
  const hop = -(beat(m.t, 300) % 2)
  const hue = SPARKS[beat(m.t, 400) % 4]!
  for (const sx of [cx - 20, cx + 34]) line(c, sx, 0, bx + (sx < bx ? -4 : 4), GROUND - 3, mix(hue, 0x1a1c24, 0.55))
  clawd(c, m.t, 'dance', cx)
  rect(c, cx + 2, CLAWD_TOP - 1 + hop, 10, 1, 0x14161c); rect(c, cx + 4, CLAWD_TOP - 4 + hop, 6, 3, 0x14161c); rect(c, cx + 4, CLAWD_TOP - 2 + hop, 6, 1, 0xe0455b)
  rect(c, cx + 6, CLAWD_TOP + 3 + hop, 2, 1, 0xe0455b)
  line(c, bx, 0, bx, 1, 0x9aa0b0)
  sprite(c, ['wgwg', 'gwgw', 'wgwg'], { w: 0xf4f4f4, g: 0x9aa0b0 }, bx - 2, 2)
  for (let k = 0; k < 14; k++) {
    const a = m.t / 600 + k * 0.9
    put(c, bx + Math.cos(a) * (8 + (k % 5) * 5), 8 + Math.sin(a * 0.7) * 6, SPARKS[k % 4]!)
  }
  for (let k = 0; k < 16; k++) put(c, (rnd(k, 1) * c.W + Math.sin(m.t / 400 + k) * 3 + c.W) % c.W, (m.t / 40 + rnd(k, 2) * 30) % 15, [0xe0455b, 0xffd54f, 0x4fa3d9, 0x6ad94f, 0xd94f8a][k % 5]!)
  for (let k = 0; k < 4; k++) text(glyphs, cx - 14 + k * 11 + beat(m.t, 300) % 2, 0, '*+*+'[k]!, SPARKS[(k + beat(m.t, 300)) % 4]!)
  ground(c, mix(hue, 0x1a1c24, 0.6))
}

const sauteing: Draw = (c, m) => {
  const cx = spot(c.W, 0.25)
  const { hand } = clawd(c, Math.floor(m.t / 700) * 700 + (m.t % 700) * 0.6, 'hammer', cx)
  rect(c, cx + 3, CLAWD_TOP - 1, 8, 1, 0xf4f4f4); rect(c, cx + 2, CLAWD_TOP - 3, 10, 2, 0xf4f4f4); rect(c, cx + 4, CLAWD_TOP - 4, 6, 1, 0xf4f4f4)
  const hx = hand[0], hy = hand[1]
  rect(c, hx, hy, 3, 1, 0x7a4a24); rect(c, hx + 3, hy, 9, 1, 0x3a3a42); put(c, hx + 3, hy - 1, 0x3a3a42); put(c, hx + 11, hy - 1, 0x3a3a42)
  rect(c, hx + 1, GROUND - 1, 11, 1, 0x55555f)
  for (let k = 0; k < 10; k++) put(c, hx + 2 + k, GROUND - 2 - (rnd(k, beat(m.t, 90)) > 0.6 ? 1 : 0), k % 3 ? 0x4f9aff : 0xff8c2a)
  const cols = [0xd9534f, 0x6aa84f, 0xffd54f, 0xf4f4f4, 0xff8c2a]
  for (let k = 0; k < 5; k++) {
    const u = ((m.t / 700) + k * 0.19) % 1
    put(c, hx + 4 + k * 1.4 + Math.sin(u * 3 + k) * 1.5, hy - 1 - Math.sin(u * Math.PI) * 5, cols[k]!)
  }
  for (let k = 0; k < 3; k++) put(c, hx + 3 + k * 4 + (rnd(k, beat(m.t, 100)) > 0.5 ? 1 : 0), hy - 7 + (k % 2), 0xffd54f)
  ground(c, 0x3a3a42)
}

const shimmying: Draw = (c, m) => {
  const cx = spot(c.W, 0.5) - 7
  const s = beat(m.t, 90) % 2 ? 1 : -1
  clawd(c, m.t, 'dance', cx + s, 1, 0)
  const y = CLAWD_TOP - (beat(m.t, 300) % 2)
  rect(c, cx + 3 + s, y - 1, 8, 1, 0xffd54f); line(c, cx + 9 + s, y - 2, cx + 12 + s, y - 5 + (s > 0 ? 1 : 0), 0xd94f8a)
  for (let i = 3; i < 11; i++) {
    put(c, cx + i + s, y + 3, i % 2 ? 0xffd54f : 0xd94f8a)
    put(c, cx + i - s * (i % 3), y + 4, i % 2 ? 0xd94f8a : 0xffd54f)
    put(c, cx + i - s * (1 + i % 2), y + 5, 0xffd54f)
  }
  for (let i = 4; i < 10; i++) put(c, cx + i + s, y + 2, 0xf4f4f4)  // pearls
  for (let k = 1; k <= 3; k++) {
    const on = (beat(m.t, 90) + k) % 3
    if (on) { put(c, cx - 3 - k * 2, 11, mix(0xffd54f, 0x1a1c24, k / 4)); put(c, cx + 16 + k * 2, 11, mix(0xffd54f, 0x1a1c24, k / 4)) }
  }
  ground(c, 0x4a2a3a)
}

const sockHopping: Draw = (c, m, glyphs) => {
  const cx = spot(c.W, 0.3)
  const lift = beat(m.t, 300) % 2
  clawd(c, m.t, 'dance', cx, 1, lift)
  const hop = -(beat(m.t, 300) % 2)
  const ly = CLAWD_TOP + 5 + hop - lift
  const f = beat(m.t, 83)
  for (const i of (f >> 1) % 2 ? [3, 5, 8, 10] : [2, 4, 9, 11]) { put(c, cx + i, ly, 0xf4f4f4); put(c, cx + i, ly + 1, i < 7 ? 0x14161c : 0xe0455b) }
  rect(c, cx + 9, CLAWD_TOP - 1 + hop, 3, 1, 0xd94f8a); put(c, cx + 8, CLAWD_TOP - 2 + hop, 0xd94f8a); put(c, cx + 12, CLAWD_TOP - 2 + hop, 0xd94f8a)
  const jx = cx + 20
  rect(c, jx + 2, 2, 5, 1, 0xe0455b); rect(c, jx + 1, 3, 7, 1, 0xe0455b); rect(c, jx, 4, 9, 11, 0x2aa6a0); rect(c, jx + 1, 5, 7, 5, 0x14161c)
  for (let k = 0; k < 3; k++) rect(c, jx + 2 + k * 2, 9 - Math.floor(1 + rnd(k, beat(m.t, 150)) * 3), 1, 1 + Math.floor(rnd(k, beat(m.t, 150)) * 3), [0xe0455b, 0xffd54f, 0x6ad94f][k]!)
  for (let k = 0; k < 3; k++) put(c, jx + 2 + k * 2, 12, 0xdfe7ff)
  for (let k = 0; k < 2; k++) {
    const life = ((m.t / 800) + k / 2) % 1
    text(glyphs, jx + 10 + k * 3 + Math.round(life * 3), 4 - life * 3, k ? '♫' : '♪', k ? 0xd94f8a : 0xffd54f)
  }
  for (let x = 0; x < c.W; x++) put(c, x, GROUND, Math.floor(x / 2) % 2 ? 0xf4f4f4 : 0x14161c)
}

const swirling: Draw = (c, m) => {
  const cx = spot(c.W, 0.2)
  const { hand } = clawd(c, m.t, 'pan', cx)
  const ex = cx + 20
  rect(c, ex, 1, 26, 12, 0xb8935a); rect(c, ex + 1, 2, 24, 10, 0x1c2b5a)
  rect(c, ex + 3, 13, 1, 2, 0x7a4a24); rect(c, ex + 22, 13, 1, 2, 0x7a4a24)
  const p = (m.t % 6400) / 6400
  let tip: [number, number] = [ex + 8, 7]
  const spiral = (ox: number, from: number, to: number, col: number, col2: number) => {
    const aMax = 12 * Math.max(0, Math.min(1, (p - from) / (to - from)))
    for (let a = 0; a < aMax; a += 0.25) {
      const r = a * 0.4
      const pt: [number, number] = [ox + Math.cos(a) * r * 1.4, 7 + Math.sin(a) * r * 0.9]
      put(c, pt[0], pt[1], a % 2 < 1 ? col : col2)
      if (aMax - a < 0.3) tip = pt
    }
  }
  spiral(ex + 8, 0, 0.42, 0x6fa8ff, 0xcfe4ff)
  spiral(ex + 18, 0.45, 0.85, 0xffd54f, 0x6fa8ff)
  if (p > 0.85) { rect(c, ex + 21, 3, 3, 3, 0xffe066); put(c, ex + 20, 4, 0xfff3a8); put(c, ex + 24, 4, 0xfff3a8) }
  line(c, hand[0], hand[1], tip[0], tip[1], 0x7a4a24); put(c, tip[0], tip[1], 0xffd54f)
  ground(c, 0x4a3a2a)
}

const thundering: Draw = (c, m, glyphs) => {
  const cx = spot(c.W, 0.35)
  const { hand } = clawd(c, m.t, 'umbrella', cx)
  const hx = hand[0], t = m.t % 3500
  const struck = t < 320
  const sway = Math.round(wave(m.t, 300) * 2)
  rect(c, cx - 1, CLAWD_TOP + 1, 2, 4 + sway, 0xc2323a)
  line(c, hx, 8, hx, 9, 0x7a4a24)
  rect(c, hx - 2, 5, 5, 3, struck ? 0xfff6c8 : 0x9aa0b0); rect(c, hx - 2, 5, 5, 1, struck ? 0xffffff : 0xcfd8e8)
  for (let x = hx - 14; x < hx + 16; x++) put(c, x, 0, 0x3a3d4a)
  for (let x = hx - 10; x < hx + 12; x++) put(c, x, 1, 0x4a4d5a)
  const bolt = (x0: number, y0: number, y1: number, col: number) => { let x = x0; for (let y = y0; y <= y1; y++) { put(c, x, y, col); x += (y % 3) - 1 } }
  if (struck) { bolt(hx + 1, 2, 4, 0xfff6c8); bolt(hx + 22, 2, GROUND - 1, 0xfff6c8); put(c, hx - 4, 3, 0xffe066); put(c, hx + 4, 3, 0xffe066) }
  if (t < 900) {
    const r = (t / 900) * 24
    for (const s of [-1, 1]) put(c, hx + 22 + s * r, GROUND - 1, mix(0xfff6c8, 0x1a1c24, t / 900))
  }
  if (t < 1100) text(glyphs, hx + 6, 4, 'BOOM!', t % 200 < 100 ? 0xffe066 : 0xffffff)
  for (let k = 0; k < 10; k++) put(c, cx + 16 + ((m.t / 25 + k * 9) % 22) - ((m.t / 60 + k * 4) % 15) * 0.3, ((m.t / 40 + k * 7) % 14) + 1, 0x5c7ea8)
  ground(c, 0x2a2d36)
}

const transmuting: Draw = (c, m) => {
  const cx = spot(c.W, 0.2)
  const { tip } = clawd(c, m.t, 'cast', cx)
  const mid = cx + 38
  const t = m.t % 6500
  const gold = t > 3200
  for (let a = 0; a < 40; a++) {
    const ang = (a / 40) * 6.283
    put(c, mid + Math.cos(ang) * 15, GROUND - 2 + Math.sin(ang) * 2.4, a % 4 === beat(m.t, 160) % 4 ? 0xd9a8ff : 0x7a4ad9)
  }
  for (let k = 0; k < 8; k++) {
    const a = m.t / 700 + k * 0.785
    put(c, mid + Math.cos(a) * 11, GROUND - 2 + Math.sin(a) * 1.8, 0xd9a8ff)
  }
  const y = 7 + Math.round(wave(m.t, 1500) * 1.5)
  const trans = t > 2400 && t < 3600
  const col = gold ? 0xffd54f : trans ? mix(0x8a919b, 0xffd54f, (t - 2400) / 1200) : 0x6b7086
  rect(c, mid - 4, y, 8, 3, col); rect(c, mid - 3, y, 6, 1, mix(col, 0xffffff, 0.4))
  if (tip && t < 3600 && t > 800) line(c, tip[0], tip[1], mid - 4, y + 1, mix(0xd9a8ff, 0x1a1c24, 0.3))
  for (let k = 0; k < 4; k++) put(c, mid + 6 * Math.cos(m.t / 400 + k * 1.6), y - 2 + Math.sin(m.t / 300 + k) * 2, 0x9a6ad9 + 0)
  if (gold) for (let k = 0; k < 4; k++) {
    const life = ((m.t / 300) + k) % 4
    put(c, mid - 5 + k * 3 + rnd(k, beat(m.t, 300)) * 2, y - 1 - life, 0xfff3a8)
  }
  for (let k = 0; k < 6; k++) put(c, mid - 12 + k * 5, GROUND - 3 - ((m.t / 100 + k * 3) % 10), mix(0x7a4ad9, 0x1a1c24, ((m.t / 100 + k * 3) % 10) / 10))
  ground(c)
}

const waddling: Draw = (c, m) => {
  const span = c.W + 50
  const x = ((m.t * 0.012) % span) - 36
  const sw = (k: number) => beat(m.t + k * 130, 260) % 2
  const peng = (px: number, k: number) => {
    const s = sw(k)
    sprite(c, ['.kkk.', 'kkkko', 'kwwwk', 'kwwwk', '.kkk.', '.o.o.'], { k: 0x34476e, w: 0xf4f4f4, o: 0xff9e3d }, px + s, GROUND - 6 - s)
  }
  for (let k = 0; k < c.W; k += 11) if (rnd(k, 9) > 0.5) rect(c, k, GROUND - 1, 4, 1, 0xf4f8ff)
  peng(x - 28, 2); peng(x - 14, 1)
  const s = sw(0)
  clawd(c, m.t, 'walk', x + s, 1, s)
  rect(c, x + 12 + s, CLAWD_TOP + 1 - s, 2, 2, 0xff9e3d)
  for (let k = 0; k < 8; k++) put(c, (rnd(k, 1) * c.W + m.t / 90) % c.W, (m.t / 70 + k * 5) % 14, 0xf4f8ff)
  ground(c, 0xcfd8e8)
}

const whisking: Draw = (c, m) => {
  const cx = spot(c.W, 0.25)
  const { hand } = clawd(c, m.t, 'crank', cx)
  const bx = cx + 16
  const p = (m.t % 6000) / 6000
  sprite(c, BOWL, { g: 0xe8b64a, l: 0xfff3d6 }, bx, GROUND - 6)
  const h = 1 + Math.floor(p * 5)
  for (let i = 0; i < 12; i++) rect(c, bx + 1 + i, 9 - Math.floor(h * (0.4 + 0.6 * rnd(i, 4))), 1, 2 + Math.floor(h * (0.4 + 0.6 * rnd(i, 4))), i % 3 ? 0xffffff : 0xfff3d6)
  if (p > 0.9) { rect(c, bx + 6, 8 - h, 2, 2, 0xe0455b); put(c, bx + 7, 7 - h, 0x4fb04f) }
  const a = m.t / 130
  const wx = bx + 7 + Math.cos(a) * 3, wy = 10 + Math.sin(a) * 1.2
  line(c, hand[0], hand[1], wx, wy - 2, 0x8a919b)
  for (let k = 0; k < 3; k++) put(c, wx + (k - 1), wy + (k % 2), 0xcfd8e8)
  for (let k = 0; k < 4; k++) {
    const life = ((m.t / 180) + k * 2.2) % 5
    put(c, bx + 7 + (k - 1.5) * life * 1.6, 7 - life * 0.9 + life * life * 0.25, 0xfff3d6)
  }
  ground(c, 0x4a4a52)
}

export const SCENES: Record<string, Draw> = {
  architecting, blanching, brewing, cascading, clauding, concocting, crunching,
  'dilly-dallying': dillyDallying, effecting, 'fiddle-faddling': fiddleFaddling, fluttering,
  galloping, grooving, honking, incubating, kerfuffling, marinating, mulling, noodling,
  perambulating, pollinating, processing, 'razzle-dazzling': razzleDazzling, sauteing,
  shimmying, 'sock-hopping': sockHopping, swirling, thundering, transmuting, waddling, whisking,
}
