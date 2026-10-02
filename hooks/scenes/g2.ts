import { CLAWD, CLAWD_TOP, DEF, GROUND, SPARKS, along, clawd, ground, mix, put, rect, rnd, spot, sprite, wave, WALK, type Canvas, type Draw, type Moment } from '../acts'

const lerp = (a: number, b: number, k: number) => a + (b - a) * Math.min(1, Math.max(0, k))
const wood = 0x7a4a24
const steel = 0x8a919b

function line(c: Canvas, x0: number, y0: number, x1: number, y1: number, colour: number) {
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))))
  for (let i = 0; i <= n; i++) put(c, lerp(x0, x1, i / n), lerp(y0, y1, i / n), colour)
}

function disc(c: Canvas, cx: number, cy: number, r: number, colour: number) {
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + 1) put(c, cx + x, cy + y, colour)
}

const stars = (c: Canvas, m: Moment, n: number, maxY: number) => {
  for (let k = 0; k < n; k++) if (rnd(k, 7 + Math.floor(m.t / 700 + k)) > 0.25) put(c, rnd(k, 1) * c.W, rnd(k, 2) * maxY, 0xdfe7ff)
}

function crescent(c: Canvas, x: number, y: number) {
  disc(c, x, y, 3, 0xf4eec8)
  for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) if ((i - 2) * (i - 2) + (j + 1) * (j + 1) <= 10) put(c, x + i, y + j, DEF)
}

/** A cell row above a pixel row, for glyphs. */
const cell = (y: number) => Math.max(0, Math.floor(y / 2))

// ------------------------------------------------------------------ the scenes

const actioning: Draw = (c, m) => {
  const bx = spot(c.W, 0.55)
  const p = m.t % 6000
  rect(c, bx - 8, 1, 17, 12, 0xe8e4d4)
  rect(c, bx - 3, 0, 7, 2, wood)
  const tip = clawd(c, m.t, 'cast', bx - 25, 1).tip
  for (let i = 0; i < 3; i++) {
    const y = 3 + i * 3
    const due = (i + 1) * 1300
    const done = p >= due
    rect(c, bx - 6, y, 3, 3, done ? 0x4fb04f : 0xb8b4a4)
    rect(c, bx - 2, y + 1, 8, 1, done ? 0x9aa0b0 : 0x3a3d4a)
    if (done) { put(c, bx - 6, y + 1, 0xffffff); put(c, bx - 5, y + 2, 0xffffff); put(c, bx - 4, y, 0xffffff) }
    if (tip && p >= due - 200 && p < due + 150) line(c, tip[0], tip[1], bx - 5, y + 1, 0xffd54f)
  }
  if (p > 4600 && p % 400 < 250) for (let x = bx - 8; x <= bx + 8; x++) { put(c, x, 1, 0x4fb04f); put(c, x, 12, 0x4fb04f) }
  ground(c)
}

const befuddling: Draw = (c, m, glyphs) => {
  const cx = spot(c.W, 0.4)
  const x = cx + Math.round(Math.sin(m.t / 450) * 3)
  clawd(c, m.t, 'float', x, 1)
  for (let k = 0; k < 3; k++) {  // dizzy stars
    const a = m.t / 260 + k * 2.1
    put(c, x + 7 + Math.cos(a) * 8, CLAWD_TOP - 2 + Math.sin(a) * 1.5, 0xffd54f)
  }
  const n = Math.floor(m.t / 600)
  for (let k = 0; k < 2; k++) glyphs.push({ x: Math.max(0, x - 4 + k * 22 + Math.round(rnd(n, k) * 3)), row: 1 + ((n + k) % 2), ch: '?', fg: k ? 0xff9e3d : 0xffd54f })
  const kx = cx + 24  // a tangled knot of thread
  let px = kx, py = 8
  for (let i = 0; i < 40; i++) {
    const a = i * 2.4 + m.t / 900
    const nx = kx + Math.cos(a * 1.3) * (2 + (i % 5) * 0.4)
    const ny = 8 + Math.sin(a) * (2 + (i % 4) * 0.4)
    line(c, px, py, nx, ny, mix(0x9a6ad9, 0x4fa3d9, (i % 7) / 7))
    px = nx; py = ny
  }
  const d = (m.t / 90) % 6
  put(c, x + 14, CLAWD_TOP + 1 + d, 0x7fa6d6)  // a sweat drop
  ground(c)
}

const booping: Draw = (c, m, glyphs) => {
  const cr = spot(c.W, 0.58)
  const k = m.t % 700
  const hit = k >= 450
  const col = [0xf08fb0, 0x8fd0f0, 0xb0e080][Math.floor(m.t / 2800) % 3]!
  const jump = hit ? 0 : Math.sin((k / 450) * Math.PI) * 4
  clawd(c, m.t, 'hammer', cr - 14, 1)
  const top = GROUND - 7 - Math.round(jump) + (hit ? 1 : 0)
  sprite(c, ['.pp..pp.', '.pp..pp.', 'pppppppp', hit ? 'pppppppp' : 'pkppppkp', 'pppnnppp', 'pppppppp', '.pppppp.'], { p: col, k: 0x1a1410, n: mix(col, 0x000000, 0.35) }, cr + (hit ? 1 : 0), top)
  if (!hit && k < 400) glyphs.push({ x: cr + 3, row: cell(top) - 1 - Math.floor(k / 200), ch: '♥', fg: 0xff6b9d })
  ground(c)
}

const canoodling: Draw = (c, m, glyphs) => {
  const cx = spot(c.W, 0.4)
  stars(c, m, 14, 8)
  crescent(c, spot(c.W, 0.88), 4)
  ground(c)
  rect(c, cx - 4, 10, 34, 1, wood)
  rect(c, cx - 4, 14, 34, 1, wood)
  for (const x of [cx - 3, cx + 28]) rect(c, x, 11, 1, 3, wood)
  clawd(c, m.t, 'float', cx, 1, 1)
  const lean = Math.sin(m.t / 900) > 0 ? 1 : 0
  sprite(c, ['.ppppp.', 'pkpppkp', 'pbpppbp', '.p...p.'], { p: 0xf4a6c0, k: 0x1a1410, b: 0xff6b9d }, cx + 15 - lean, 10 + (Math.floor(m.t / 700) % 2 && lean ? -1 : 0))
  for (let k = 0; k < 3; k++) {
    const life = (m.t / 1500 + k / 3) % 1
    glyphs.push({ x: cx + 13 + k * 2 + Math.round(Math.sin(life * 6 + k) * 2), row: Math.max(0, 3 - Math.floor(life * 4)), ch: '♥', fg: [0xff6b9d, 0xff4b3e, 0xf4a6c0][k]! })
  }
}

const FORMS = [[0, 10, 20], [10, 0, 20], [5, 10, 15], [20, 10, 0]]
const choreographing: Draw = (c, m, glyphs) => {
  const x0 = spot(c.W, 0.45)
  const n = Math.floor(m.t / 1500)
  const ease = Math.min(1, (m.t % 1500) / 500)
  const prev = FORMS[n % FORMS.length]!, cur = FORMS[(n + 1) % FORMS.length]!
  const beat = Math.floor(m.t / 375) % 2
  for (const [i, col] of [0xd94f8a, 0x4fa3d9, 0xd9c84f].entries()) {
    const x = Math.round(lerp(prev[i]!, cur[i]!, ease))
    put(c, x0 + cur[i]! + 1, GROUND, 0xffd54f)  // the tape mark
    sprite(c, beat ? ['bhb', '.b.', '.b.', 'l.l'] : ['.h.', 'bbb', '.b.', 'l.l'], { h: 0xf0d9b5, b: col, l: mix(col, 0x000000, 0.4) }, x0 + x, GROUND - 5 - (beat ? 1 : 0))
  }
  const at = spot(c.W, 0.1)
  clawd(c, m.t, 'hammer', at, 1)
  glyphs.push({ x: at + 6, row: 3, ch: '5678'[Math.floor(m.t / 375) % 4]!, fg: 0xffd54f })
  ground(c)
}

const composing: Draw = (c, m) => {
  const sx = spot(c.W, 0.3)
  const cols = Math.min(14, Math.floor((c.W - sx - 10) / 4))
  const prog = (m.t % (cols * 450 + 1400)) / 450
  for (let r = 0; r < 5; r++) rect(c, sx, 1 + r * 2, cols * 4 + 8, 1, 0x5a5f70)
  for (let i = 0; i < Math.min(cols, Math.floor(prog)); i++) {
    const y = 2 + Math.floor(rnd(i, 5) * 7)
    const x = sx + 4 + i * 4
    rect(c, x, y, 2, 1, 0xe8e4d4)
    rect(c, x + 1, y - 3, 1, 3, 0xe8e4d4)
  }
  const fx = sx + 4 + Math.min(cols, prog) * 4
  const { hand } = clawd(c, m.t, 'hammer', fx - 12, 1)
  line(c, hand[0] + 1, hand[1] - 1, fx, 8, 0xf4f0e0)  // the quill
  put(c, fx, 8, 0xffd54f)
  ground(c)
}

const crafting: Draw = (c, m) => {
  const bx = spot(c.W, 0.35)
  const tx = bx + 18
  const flags = Math.min(11, Math.floor((m.t % 7500) / 600))
  const len = 44
  for (let i = 0; i < len; i++) put(c, bx + i, 1 + Math.round(Math.sin((i / len) * Math.PI) * 2), 0x9aa0b0)
  for (let f = 0; f < flags; f++) {
    const x = bx + 2 + f * 4
    sprite(c, ['ccc', '.c.'], { c: [0xd94f8a, 0x4fa3d9, 0xd9c84f, 0x6ad94f][f % 4]! }, x, 2 + Math.round(Math.sin(((x - bx) / len) * Math.PI) * 2))
  }
  rect(c, tx, 11, 14, 1, wood); rect(c, tx + 1, 12, 1, 3, wood); rect(c, tx + 12, 12, 1, 3, wood)
  rect(c, tx + 2, 10, 5, 1, [0xd94f8a, 0x4fa3d9, 0xd9c84f, 0x6ad94f][flags % 4]!)  // the paper
  sprite(c, ['.o.', 'www', 'www'], { o: 0xff9e3d, w: 0xf0f0f0 }, tx + 9, 8)  // glue
  const { hand } = clawd(c, m.t, 'pan', tx - 17, 1)
  const open = Math.floor(m.t / 150) % 2
  line(c, hand[0] + 1, hand[1], hand[0] + 4, hand[1] - open, 0xdfe7ff)
  line(c, hand[0] + 1, hand[1], hand[0] + 4, hand[1] + open, 0xdfe7ff)
  put(c, hand[0] + 4, hand[1] + 1 + (m.t / 90) % 3, [0xd94f8a, 0x4fa3d9, 0xd9c84f][flags % 3]!)
  ground(c)
}

const deliberating: Draw = (c, m) => {
  const sx = spot(c.W, 0.55)
  const p = m.t % 6500
  const swing = Math.sin(p / 380) * Math.max(0, 1 - p / 4800) * 3
  const tilt = Math.round(swing)
  rect(c, sx, 5, 1, 9, 0xb08d57); rect(c, sx - 3, 14, 7, 1, 0xb08d57)
  line(c, sx - 8, 4 - tilt, sx + 8, 4 + tilt, 0xd9c84f)
  put(c, sx, 3, 0xffd54f)
  for (const [side, y] of [[-8, 4 - tilt], [8, 4 + tilt]] as const) {
    line(c, sx + side, y, sx + side - 2, y + 4, 0x9aa0b0); line(c, sx + side, y, sx + side + 2, y + 4, 0x9aa0b0)
    rect(c, sx + side - 3, y + 5, 7, 1, 0xd9c84f)
  }
  rect(c, sx - 10, 4 - tilt + 1 + 2, 3, 2, 0xd94f4f)  // heart-weight
  disc(c, sx + 8, 4 + tilt + 3, 1, 0xffd54f)
  const x = sx - 30
  clawd(c, m.t, 'float', x, 1)
  rect(c, x + 2, CLAWD_TOP - 1, 10, 1, 0xf4f0e0); rect(c, x + 1, CLAWD_TOP, 2, 3, 0xf4f0e0); rect(c, x + 11, CLAWD_TOP, 2, 3, 0xf4f0e0)
  if (p > 5000 && p < 5400) put(c, x + 15, CLAWD_TOP + 3, 0xffd54f)
  ground(c)
}

const drizzling: Draw = (c, m) => {
  const px = spot(c.W, 0.62)
  const p = m.t % 6500
  const prog = Math.min(1, p / 4500)
  const sway = (t: number) => Math.round(Math.sin(t / 380) * 4)
  const x = px - 20 + sway(p)
  const syrup = 0x4a2410
  rect(c, px - 7, 14, 15, 1, 0xf4f4f4)
  for (let j = 0; j < 3; j++) rect(c, px - 5, 11 + j, 11, 1, j === 1 ? 0xb97a3a : 0xd9a066)
  rect(c, px - 1, 10, 3, 1, 0xffe066)
  for (let t = 0; t < p && t < 4500; t += 90) put(c, px - 1 + sway(t), 11, syrup)  // the trail
  for (const dx of [-5, 0, 5]) rect(c, px + dx, 12, 1, Math.floor(prog * 3), syrup)  // drips
  clawd(c, m.t, 'pan', x, 1, 4)
  rect(c, x + 2, 11, 10, 4, wood)  // the stool
  const hx = x + 14, hy = CLAWD_TOP + 2 - 4
  rect(c, hx + 1, hy - 1, 4, 2, 0x3a3a42); put(c, hx + 5, hy, 0x3a3a42); put(c, hx + 5, hy + 1, 0x6a6a72)
  if (p < 4500) rect(c, hx + 5, hy + 2, 1, 11 - (hy + 2), syrup)
  ground(c)
}

const envisioning: Draw = (c, m) => {
  const bx = spot(c.W, 0.58)
  const glow = wave(m.t, 1800)
  disc(c, bx, 7, 6, mix(0x2a2a5a, 0x5a4a9a, glow * 0.5))
  rect(c, bx - 3, 13, 7, 2, 0xb08d57); rect(c, bx - 2, 12, 5, 1, 0xb08d57)
  const v = Math.floor(m.t / 2400) % 3
  const rise = Math.min(1, ((m.t % 2400) / 1400))
  for (let j = -4; j <= 4; j++) for (let i = -4; i <= 4; i++) {
    if (i * i + j * j > 18) continue
    let col = 0
    if (v === 0) {  // sunrise over hills
      if (j >= 2 - Math.round(Math.sin((i + 5) * 0.6) * 1.2)) col = 0x3f8f3a
      else if ((i * i + (j - (3 - rise * 4)) * (j - (3 - rise * 4))) <= 5) col = 0xffd54f
    } else if (v === 1) {  // a tiny castle
      const tower = (i === -3 || i === 0 || i === 3) && j >= -2 + (i === 0 ? -1 : 0) && j <= 4
      const wall = i >= -3 && i <= 3 && j >= 1 && j <= 4
      if (tower || wall) col = j === 3 && i === 0 ? 0x4a3a2a : 0xb8bcc8
      if (!tower && !wall && (j === -2 && Math.abs(i) === 3)) col = 0xb8bcc8
    } else {  // a rainbow
      const r = Math.hypot(i, j - 4)
      if (j < 4 && r > 1.4 && r < 5.6) col = [0xd94f4f, 0xffd54f, 0x6ad94f, 0x4fa3d9][Math.min(3, Math.floor(r - 1.5))]!
    }
    if (col) put(c, bx + i, 7 + j, mix(col, 0xffffff, Math.max(0, 0.6 - rise * 2)))
  }
  for (let a = 0; a < 20; a++) put(c, bx + Math.cos(a / 20 * 6.283) * 6.2, 7 + Math.sin(a / 20 * 6.283) * 6.2, mix(0x8ad9ff, 0xffffff, wave(m.t, 700, a)))
  for (let k = 0; k < 3; k++) {  // sparks swirl round the ball
    const a = m.t / 400 + k * 2.1
    put(c, bx + Math.cos(a) * 9, 7 + Math.sin(a) * 4, SPARKS[k]!)
  }
  clawd(c, m.t, 'float', bx - 24, 1)
  put(c, bx - 10, 8, mix(0x8ad9ff, 0x000000, 0.5)); put(c, bx - 8, 7, 0x8ad9ff)  // the gaze
  ground(c)
}

const flowing: Draw = (c, m) => {
  const wy = (x: number) => 13 + Math.round(Math.sin(x / 5 - m.t / 320) * 0.9)
  const bob = Math.round(wave(m.t, 1300))
  const bx = spot(c.W, 0.5) + Math.round(Math.sin(m.t / 1700) * 6)
  for (let x = 0; x < c.W; x++) for (let y = wy(x); y <= GROUND; y++) put(c, x, y, mix(0x2f6fb0, 0x1d4a80, (y - 12) / 4))
  for (let k = 0; k < c.W / 9; k++) {  // streaks of foam, drifting downstream
    const fx = (rnd(k, 1) * c.W + m.t / 22) % c.W
    put(c, fx, wy(fx) + 1, 0x9fcfff); put(c, fx + 1, wy(fx + 1) + 1, 0x9fcfff)
  }
  const { hand } = clawd(c, m.t, 'pan', bx, 1, bob)
  rect(c, bx - 1, 14 - bob, 16, 1, wood); rect(c, bx + 1, 15 - bob, 12, 1, 0x5a3a22)
  line(c, hand[0] + 1, hand[1] - 1, hand[0] + 2, 15, wood)
  put(c, hand[0] + 2, 15, 0xd9a066)
  for (let k = 0; k < 4; k++) {  // leaves riding the current
    const lx = (rnd(k, 9) * c.W + m.t / 18) % c.W
    put(c, lx, wy(lx) - 1, k % 2 ? 0x6ab84f : 0xd9c84f)
  }
}

const frosting: Draw = (c, m) => {
  const cx = spot(c.W, 0.55)
  const p = m.t % 7000
  const n = Math.min(7, Math.floor(p / 650))
  rect(c, cx - 2, 14, 24, 1, 0xf4f4f4)
  rect(c, cx, 8, 20, 6, 0xc98d55)
  rect(c, cx, 11, 20, 1, 0xf4ecd8)
  rect(c, cx, 8 + (7 - n), 20, n === 7 ? 6 : n, 0xf4a6c0)
  if (n > 0) rect(c, cx, 14 - n, 20, 1, 0xff8fb3)
  if (n >= 7) {
    for (let i = 0; i < 4; i++) put(c, cx + 2 + i * 5, 7, 0xf4a6c0)
    disc(c, cx + 10, 6, 1, 0xd62839)
    for (let k = 0; k < 10; k++) put(c, cx + 1 + rnd(k, 3) * 18, 9 + rnd(k, 4) * 4, [0xffd54f, 0x4fa3d9, 0x6ad94f, 0xffffff][k % 4]!)
  }
  const { hand } = clawd(c, m.t, 'hammer', cx - 15, 1)
  rect(c, hand[0] + 1, hand[1] - 1, 1, 3, 0xdfe7ff)  // the spatula
  ground(c)
}

const gesticulating: Draw = (c, m, glyphs) => {
  const x = spot(c.W, 0.3)
  rect(c, x + 1, 12, 12, 3, wood); rect(c, x + 1, 12, 12, 1, 0xb08d57)
  clawd(c, m.t, 'dance', x, 1, 3)
  const beat = Math.floor(m.t / 300) % 2
  const ex = beat ? x + 17 : x - 3
  put(c, ex, 4, 0xffd54f); put(c, ex + (beat ? 1 : -1), 6, 0xffd54f); put(c, ex, 8, 0xffd54f)
  for (let i = 0; i < 4; i++) {  // an audience, nodding
    const ax = x + 28 + i * 8
    const nod = Math.floor(m.t / 400 + i * 1.7) % 3 === 0 ? 1 : 0
    sprite(c, ['.hh.', 'hhhh', 'bbbb', 'bbbb'], { h: 0xf0d9b5, b: [0x4fa3d9, 0x6ad94f, 0xd94f8a, 0x9a6ad9][i]! }, ax, GROUND - 4 + nod)
    if ((Math.floor(m.t / 500) + i) % 5 === 0) put(c, ax + 4, GROUND - 6, 0xf0d9b5)  // a raised hand
  }
  const n = Math.floor(m.t / 450)
  glyphs.push({ x: x + 16 + (n % 3) * 2, row: 1 + (n % 2), ch: '!?…'[n % 3]!, fg: [0xff9e3d, 0xffd54f, 0xdfe7ff][n % 3]! })
  ground(c)
}

const hatching: Draw = (c, m, glyphs) => {
  const ex = spot(c.W, 0.55)
  const p = m.t % 7000
  const cracked = p > 3000, out = p > 4600
  const wob = p < 3000 ? Math.round(Math.sin(p / 130) * Math.min(1, p / 900)) : 0
  for (let y = 0; y < 8; y++) {  // the egg, top at row 7
    const half = Math.round(Math.sqrt(Math.max(0, 1 - ((y - 4) / 4.4) ** 2)) * 3.4)
    const shift = Math.round(wob * ((7 - y) / 7))
    if (out && y < 4) continue
    for (let i = -half; i <= half; i++) put(c, ex + i + shift, 7 + y, y === 2 || y === 5 ? 0xe8dcc0 : 0xf3efe0)
  }
  for (const [dx, dy] of [[-1, 3], [1, 5], [0, 6]]) if (!out || dy! > 3) put(c, ex + dx!, 7 + dy!, 0xc9a66b)
  if (cracked && !out) {
    const n = Math.floor(((p - 3000) / 1600) * 8)
    for (let i = 0; i < n; i++) put(c, ex - 3 + i, 10 + (i % 2), 0x3a2a1a)
  }
  if (out) {
    const k = (p - 4600) / 2400
    for (const s of [-1, 1]) put(c, ex + s * (3 + k * 8), 8 - Math.sin(Math.min(1, k * 1.5) * Math.PI) * 6 + k * 6, 0xf3efe0)  // shell halves
    const hop = Math.round(Math.abs(Math.sin(p / 220)) * (k > 0.4 ? 2 : 0))
    sprite(c, ['.yyy.', 'yyyyy', 'ykyky', 'yyooy', '.y.y.'], { y: 0xffe066, k: 0x1a1410, o: 0xff9e3d }, ex - 2, 9 - hop)
    if (k > 0.3 && p % 800 < 400) glyphs.push({ x: ex + 4, row: 3, ch: '♪', fg: 0xffe066 })
  }
  clawd(c, m.t, 'float', ex - 26, 1)
  ground(c)
}

const imagining: Draw = (c, m) => {
  const x = START_X(c)
  const bx = Math.max(x + 30, spot(c.W, 0.45))
  clawd(c, m.t, 'float', x, 1)
  for (let k = 0; k < 3; k++) disc(c, x + 16 + k * 3, 8 - k * 2, k === 0 ? 0 : 1, 0xc8ccd8)  // thought trail
  for (let j = -5; j <= 5; j++) for (let i = -11; i <= 11; i++) {
    const d = (i / 11) ** 2 + (j / 5.4) ** 2
    if (d <= 1) put(c, bx + i, 6 + j, d > 0.82 ? 0xc8ccd8 : 0x252a3d)
  }
  const v = Math.floor(m.t / 2000) % 3
  const art = [
    ['..r..', '.rwr.', '.rwr.', '.rbr.', 'rrrrr', '.o.o.'],
    ['..ggg..', '.ggggg.', 'ggggggg', '.ggggg.', '...t...', '...t...'],
    ['.rrrrr.', 'roooooo', 'rooyyyo'.slice(0, 7), 'ro.bbyo', 'ro.b.yo', 'ro...yo'],
  ][v]!
  sprite(c, art, { r: 0xd94f4f, w: 0xdfe7ff, b: 0x4fa3d9, o: 0xff9e3d, g: 0x4f9a3a, t: wood, y: 0xffd54f }, bx - 3, 3 + Math.round(Math.sin(m.t / 300)))
  if (m.t % 2000 < 200) for (const [dx, dy] of [[-9, -2], [8, 1], [0, -4]]) put(c, bx + dx!, 6 + dy!, 0xfff6c8)
  ground(c)
}
const START_X = (c: Canvas) => Math.min(3, c.W)

const jitterbugging: Draw = (c, m, glyphs) => {
  const jx = spot(c.W, 0.25)
  const swing = Math.round(Math.abs(((m.t / 220) % 8) - 4)) - 2
  const x = jx + 18 + swing * 2
  sprite(c, ['..rrr..', '.ryyyr.', 'ryyyyyr', 'rbbbbbr', 'rboobor', 'rbbbbbr', 'rrrrrrr', 'r.....r'], { r: 0xae0001, y: mix(0xffd54f, 0xff9e3d, wave(m.t, 500)), b: 0x2e3440, o: 0x1a1a1a }, jx - 3, GROUND - 8)
  const { hand } = clawd(c, m.t, 'dance', x, 1)
  const a = m.t / 170
  const bx = hand[0] + 2 + Math.cos(a) * 5, by = hand[1] - 3 + Math.sin(a) * 2
  sprite(c, ['.rrr.', 'rkrkr', '.rrr.'], { r: 0xd94f4f, k: 0x1a1410 }, bx - 2, by - 1)
  put(c, bx + (Math.cos(a) > 0 ? 3 : -3), by, 0x1a1410)
  for (let i = 0; i < c.W; i++) put(c, i, GROUND, Math.floor(i / 2) % 2 ? 0xf4f4f4 : 0x2a2d36)
  glyphs.push({ x: jx + 6, row: 2 - (Math.floor(m.t / 400) % 2), ch: '♫', fg: 0xffd54f })
}

const lollygagging: Draw = (c, m) => {
  const cx = spot(c.W, 0.5)
  for (const tx of [cx - 10, cx + 26]) {  // two palms
    rect(c, tx, 6, 2, 9, 0x7a5a3a)
    for (const [dx, dy] of [[-3, 5], [-2, 4], [3, 5], [4, 4], [0, 3]]) line(c, tx + 1, 5, tx + 1 + dx!, 5 + dy! - 3, 0x4f9a3a)
  }
  disc(c, spot(c.W, 0.85), 4, 2, 0xffd54f)
  for (let k = 0; k < 2; k++) {  // lazy clouds
    const x = (m.t / 140 + k * 70) % (c.W + 20) - 10
    rect(c, x, 2 + k * 3, 7, 1, 0xe8ecf4); rect(c, x + 1, 1 + k * 3, 4, 1, 0xe8ecf4)
  }
  const sway = Math.round(Math.sin(m.t / 900))
  clawd(c, m.t, 'float', cx + 3 + sway, 1, 1)
  for (let i = -9; i <= 25; i++) {  // the hammock, sagging round him
    const y = 7 + Math.round(Math.sin(((i + 9) / 34) * Math.PI) * 6)
    put(c, cx + i, y, 0xd94f8a); put(c, cx + i, y + 1, 0xa83a6a)
  }
  rect(c, cx + 29, 13, 3, 2, 0xf4ecd8); put(c, cx + 31, 11, 0xffd54f); put(c, cx + 30, 12, 0xffd54f)  // lemonade
  ground(c, 0x2d4a2b)
}

const moonwalking: Draw = (c, m) => {
  const stops = [{ x: spot(c.W, 0.15), stay: 900, pose: 'walk' as const }, { x: spot(c.W, 0.7), stay: 900, pose: 'walk' as const }]
  const at = along(stops, m.t)
  crescent(c, spot(c.W, 0.9), 4)
  const x = Math.round(at.x), lx = x + 7
  for (let y = 0; y < GROUND; y++) for (let i = -(2 + Math.floor(y / 3)); i <= 2 + Math.floor(y / 3); i++) put(c, lx + i, y, 0x23273a)  // the spotlight
  const face = at.facing > 0 ? -1 : 1
  clawd(c, m.t, at.still ? 'float' : 'walk', at.x, face)
  rect(c, x + 1, CLAWD_TOP - 1, 12, 1, 0x111111); rect(c, x + 3, CLAWD_TOP - 3, 8, 2, 0x111111); rect(c, x + 3, CLAWD_TOP - 2, 8, 1, 0x9aa0b0)  // fedora
  put(c, x + (face > 0 ? 14 : -1), CLAWD_TOP + 2, 0xffffff)  // the glove
  for (let i = 0; i < c.W; i++) put(c, i, GROUND, Math.abs(i - lx) <= 10 && Math.floor((i + Math.floor(m.t / 150)) / 2) % 2 ? 0x4fa3d9 : 0x3a3d4a)
  if (m.t % 500 < 90) put(c, lx + 8, CLAWD_TOP - 3, 0xffffff)
}

const nesting: Draw = (c, m, glyphs) => {
  const pile = spot(c.W, 0.2), nest = spot(c.W, 0.66)
  const A = pile - 2, B = nest - 20
  const period = 950 + (2 * (B - A)) / WALK
  const trips = Math.floor(m.t / period) % 9
  const at = along([{ x: A, stay: 450, pose: 'float' }, { x: B, stay: 500, pose: 'float' }], m.t, 'carry')
  const placed = trips + (at.stop === 1 || (at.stop === 0 && !at.still && at.facing < 0) ? 1 : 0)
  rect(c, nest + 9, 4, 2, 11, 0x5a3a22); disc(c, nest + 10, 3, 3, 0x3f7f3a)  // the tree it's built under
  for (let k = 0; k < 6; k++) line(c, pile - 6 + k * 2, GROUND - 1, pile - 6 + k * 2 + (k % 2 ? 4 : -3), GROUND - 2 - (k % 3), k % 2 ? wood : 0x9a7a4a)  // twig pile
  rect(c, nest - 6, 13, 13, 2, 0x6a4a2a); rect(c, nest - 4, 13, 9, 1, 0x2a2018)
  for (let k = 0; k < Math.min(placed, 6); k++) line(c, nest - 6 + k * 2, 13, nest - 6 + k * 2 + (k % 2 ? 2 : -1), 10 - (k % 3), k % 2 ? 0x9a7a4a : wood)
  if (placed >= 7) for (let e = 0; e < 3; e++) rect(c, nest - 3 + e * 3, 12, 2, 2, 0x8fd0f0)
  const { hand } = clawd(c, m.t, at.pose, at.x, at.facing)
  if (!at.still && at.facing > 0) line(c, hand[0] + 1, hand[1] - 1, hand[0] + 4, hand[1], 0x9a7a4a)
  if (placed >= 7) glyphs.push({ x: nest + 2, row: 1 + (Math.floor(m.t / 500) % 2), ch: '♪', fg: 0xffd54f })
  ground(c, 0x4a3a2a)
}

const orchestrating: Draw = (c, m, glyphs) => {
  const x = spot(c.W, 0.15)
  const beat = (m.t / 520) % 1
  rect(c, x + 1, 13, 12, 2, 0x5a3a22)
  const { hand } = clawd(c, m.t, 'float', x, 1, 2)
  const tip = [hand[0] + 3, hand[1] - 3 + 5 * Math.abs(Math.sin(beat * Math.PI))] as const
  line(c, hand[0], hand[1], tip[0], tip[1], 0xf4f0e0); put(c, tip[0], tip[1], 0xffd54f)
  const cols = [0xd94f4f, 0x4fa3d9, 0xd9c84f, 0x9a6ad9]
  for (let i = 0; i < 4; i++) {
    const mx = x + 22 + i * 9
    const hop = Math.floor(m.t / 260 + i) % 2
    sprite(c, ['.hh.', 'bbbb', 'bbbb', 'l..l'], { h: 0xf0d9b5, b: mix(cols[i]!, 0x000000, 0.2), l: 0x2a2d36 }, mx, GROUND - 5 - hop)
    if (i === 0) line(c, mx - 1, GROUND - 6 - hop, mx + 4, GROUND - 8 - hop, 0xb06a2a)  // violin
    if (i === 1) { rect(c, mx - 2, GROUND - 3, 3, 3, 0xd94f4f); rect(c, mx - 2, GROUND - 3, 3, 1, 0xf4f4f4) }  // drum
    if (i === 2) { rect(c, mx - 3, GROUND - 4 - hop, 4, 1, 0xffd54f); rect(c, mx - 4, GROUND - 5 - hop, 1, 3, 0xffd54f) }  // trumpet
    if (i === 3) rect(c, mx + 4, GROUND - 7 - hop, 2, 6, 0x8a4a22)  // cello
    const life = (m.t / 1100 + i * 0.27) % 1
    glyphs.push({ x: mx + 1 + Math.round(life * 2), row: Math.max(0, 3 - Math.floor(life * 4)), ch: i % 2 ? '♫' : '♪', fg: cols[i]! })
  }
  ground(c)
}

const photosynthesizing: Draw = (c, m, glyphs) => {
  const px = spot(c.W, 0.5), sx = spot(c.W, 0.8)
  const beam = wave(m.t, 900)
  rect(c, px, 6, 1, 9, 0x4f9a3a)
  const leaf = mix(0x4f9a3a, 0x9aff6a, beam)
  for (const [dx, dy, flip] of [[-4, 6, 1], [1, 8, 0], [-3, 11, 1], [1, 4, 0]] as const) sprite(c, ['.ll.', 'llll', '.ll.'], { l: leaf }, px + dx + (flip ? 0 : 0), dy)
  disc(c, sx, 3, 2, 0xffd54f)
  for (let k = 0; k < 8; k++) {
    const a = m.t / 700 + (k / 8) * 6.283
    put(c, sx + Math.cos(a) * 4, 3 + Math.sin(a) * 4, 0xffe066)
  }
  for (let k = 0; k < 14; k++) {  // sunbeams, streaming to the leaves
    const u = ((m.t / 900) + k / 14) % 1
    put(c, lerp(sx - 2, px + 2, u), lerp(4, 7, u) + Math.sin(k) * 0.5, 0xffe066)
  }
  const x = px - 22
  clawd(c, m.t, 'float', x, 1)
  rect(c, x + 3, CLAWD_TOP + 1, 3, 2, 0x111111); rect(c, x + 8, CLAWD_TOP + 1, 3, 2, 0x111111); rect(c, x + 6, CLAWD_TOP + 1, 2, 1, 0x111111)
  put(c, x + 4, CLAWD_TOP + 1, 0xdfe7ff)
  sprite(c, ['.l.', 'lll', '.l.'], { l: 0x6ab84f }, x + 6, CLAWD_TOP - 3)  // a leaf on his head
  const n = Math.floor(m.t / 700)
  for (let k = 0; k < 2; k++) {
    const life = ((m.t / 1400) + k * 0.5) % 1
    glyphs.push({ x: px + 3 + k * 2, row: Math.max(0, 3 - Math.floor(life * 4)), ch: 'O', fg: mix(0x7fd6ff, 0x1a1c24, life * 0.6) })
  }
  glyphs.push({ x: px - 8, row: 5 - (n % 2), ch: '2', fg: 0x9aa0b0 })
  ground(c, 0x4a3a2a)
}

const precipitating: Draw = (c, m) => {
  const x = spot(c.W, 0.12)
  const cl = spot(c.W, 0.55) + Math.round(Math.sin(m.t / 1800) * 3)
  const zone = 8
  rect(c, cl - 15, 0, 31, 2, 0x6b7086); rect(c, cl - 11, -1, 22, 1, 0x6b7086); rect(c, cl - 13, 2, 27, 1, 0x555a6e)
  for (let i = 0; i < 30; i++) {
    const kind = Math.floor(i / 10)
    const spd = kind === 2 ? 110 : kind === 1 ? 70 : 45
    const fall = ((m.t / spd) + rnd(i, 3) * 13) % 13
    const dx = cl - 14 + (i % 10) * 3 - (kind === 0 ? 0 : 0) + kind * 0
    const col = [0x7fa6d6, 0xc0e4f4, 0xffffff][kind]!
    put(c, dx + kind * 0 + (kind === 2 ? Math.round(Math.sin(m.t / 400 + i)) : 0), 3 + fall, col)
  }
  const fill = Math.min(1, (m.t % 7000) / 6000)
  rect(c, cl + 20, 4, 4, 11, 0x3a3d4a); rect(c, cl + 21, 5, 2, 9, 0x1a1c24)
  rect(c, cl + 21, 13 - Math.floor(fill * 8), 2, 1 + Math.floor(fill * 8), 0x4fa3d9)
  for (let t = 0; t < 4; t++) put(c, cl + 24, 5 + t * 2, 0x9aa0b0)
  rect(c, cl - 14, 14, Math.round(4 + fill * 8), 1, 0x4fa3d9)  // the puddle
  rect(c, cl + 4, 14, Math.round(4 + fill * 8), 1, 0xffffff)  // the drift
  void zone
  clawd(c, m.t, 'float', x, 1)
  rect(c, x + 1, CLAWD_TOP - 1, 12, 1, 0xf2c200); rect(c, x + 3, CLAWD_TOP - 2, 8, 1, 0xf2c200)
  ground(c)
}

const puzzling: Draw = (c, m) => {
  const px = spot(c.W, 0.58)
  const p = m.t % 6400
  const cols = [0x4fa3d9, 0x6ad94f, 0xd9c84f, 0xd94f8a]
  const slots: [number, number][] = [[0, 0], [6, 0], [6, 6], [0, 6]]
  for (const [sx, sy] of slots) rect(c, px + sx, 2 + sy, 6, 6, 0x23262f)
  rect(c, px - 1, 1, 14, 1, 0x7a7f90); rect(c, px - 1, 14, 14, 1, 0x7a7f90); rect(c, px - 1, 1, 1, 14, 0x7a7f90); rect(c, px + 12, 1, 1, 14, 0x7a7f90)
  let landed = 0
  for (let i = 0; i < 4; i++) {
    const start = 400 + i * 1100
    const k = (p - start) / 500
    if (k < 0) continue
    const [sx, sy] = slots[i]!
    const y = k >= 1 ? 2 + sy : lerp(-6, 2 + sy, k * k)
    if (k >= 1) landed++
    rect(c, px + sx, y, 6, 6, cols[i]!)
    put(c, px + sx + (sx ? -1 : 6), y + 2, cols[i]!); put(c, px + sx + 2, y + (sy ? -1 : 6), cols[i]!)  // knobs
    rect(c, px + sx + 1, y + 1, 4, 1, mix(cols[i]!, 0xffffff, 0.3))
  }
  if (landed === 4 && p % 500 < 250) for (let i = 0; i < 14; i++) put(c, px - 1 + i, 14, 0x4fb04f)
  clawd(c, m.t, 'hammer', px - 18, 1)
  ground(c)
}

const roosting: Draw = (c, m, glyphs) => {
  const cx = spot(c.W, 0.4)
  const p = m.t % 8000
  stars(c, m, 16, 7)
  crescent(c, spot(c.W, 0.9), 4)
  rect(c, cx - 6, 12, 40, 1, wood)
  for (const x of [cx - 6, cx + 33]) rect(c, x, 12, 1, 4, 0x5a3a22)
  const { hand } = clawd(c, m.t, 'float', cx, 1, 3)
  void hand
  const asleep = p > 3600 && p < 7000
  if (asleep) { rect(c, cx + 4, CLAWD_TOP - 3 + 1, 1, 2, CLAWD); rect(c, cx + 9, CLAWD_TOP - 3 + 1, 1, 2, CLAWD); rect(c, cx + 3, CLAWD_TOP - 1, 3, 1, 0x1a1410); rect(c, cx + 8, CLAWD_TOP - 1, 3, 1, 0x1a1410) }
  for (let i = 0; i < 3; i++) {
    const bx = cx + 17 + i * 7
    const a = 600 + i * 1000, d = 7000
    let k = 1, flying = false
    if (p < a) continue
    if (p < a + 700) { k = (p - a) / 700; flying = true } else if (p >= d) { k = 1 - (p - d) / 800; flying = true; if (k < 0) continue }
    const x = lerp(bx + 40, bx, k * k * (3 - 2 * k)), y = lerp(0, 8, k) + (flying ? Math.sin(p / 60) * 1 : 0)
    const wing = flying && Math.floor(p / 110) % 2
    sprite(c, wing ? ['b...b', '.bbb.', 'bbbbb', '..y..'] : ['.bbb.', 'bbbbb', 'bbbbb', '.y.y.'], { b: [0x6a8fd9, 0xb08d57, 0x9a6ad9][i]!, y: 0xffb22e }, x, y)
    if (!flying) put(c, bx + 3, 8, 0x1a1410)
  }
  if (asleep) glyphs.push({ x: cx + 12, row: 2 - Math.floor((p / 900) % 2), ch: 'z', fg: 0xdfe7ff })
  ground(c)
}

const seasoning: Draw = (c, m) => {
  const sx = spot(c.W, 0.6)
  const col = [0xf4f4f4, 0x2a2a30, 0xd94f4f][Math.floor(m.t / 2400) % 3]!
  rect(c, 0, 5, c.W, 1, wood)
  for (let i = 0; i < c.W; i += 7) sprite(c, ['.l.', 'jjj', 'jjj'], { l: 0xb8bcc8, j: [0xd94f4f, 0xf4f4f4, 0x4f9a3a, 0xd9a066, 0x2a2a30][(i / 7) % 5]! }, i + 2, 2)
  rect(c, sx - 2, 14, 18, 1, 0x3a3a42)
  rect(c, sx, 12, 14, 2, 0x8a3a2a); rect(c, sx + 1, 12, 12, 1, 0xa84a32)
  for (let i = 0; i < 3; i++) put(c, sx + 2 + i * 4, 13, 0x4a1a12)
  const { hand } = clawd(c, m.t, 'hammer', sx - 15, 1)
  const hx = hand[0] + 1, hy = hand[1]
  rect(c, hx, hy - 3, 3, 3, steel); rect(c, hx, hy - 4, 3, 1, col === 0xf4f4f4 ? 0xe8ecf4 : col)
  for (let g = 0; g < 8; g++) {
    const fall = ((m.t / 60) + g * 3) % 9
    put(c, hx + 1 + Math.round(Math.sin(g * 2) * 2), hy + fall * 0.5, col)
  }
  for (let i = 0; i < 12; i++) if (rnd(i, 4) < (m.t % 2400) / 2400) put(c, sx + 1 + i, 11, col)
  for (let k = 0; k < 2; k++) put(c, sx + 4 + k * 5, 11 - ((m.t / 150 + k * 3) % 5), mix(0x9aa0b0, 0x1a1c24, ((m.t / 150 + k * 3) % 5) / 5))
  ground(c)
}

const slithering: Draw = (c, m) => {
  const cx = spot(c.W, 0.5)
  const span = c.W + 50
  const head = ((m.t * 0.026) % span) - 10
  const len = 30
  const body = (i: number) => ({ x: head - i, y: 13 + Math.sin((head - i) / 3 + m.t / 160) })
  for (let i = len; i >= 0; i--) {
    const { x, y } = body(i)
    const col = i % 6 < 2 ? 0xd9c84f : 0x4f9a3a
    put(c, x, y, col); put(c, x, y + 1, col)
  }
  const h = body(0)
  put(c, h.x + 1, h.y, 0x6ab84f); put(c, h.x + 1, h.y - 1, 0x1a1410)
  if (m.t % 400 < 150) { put(c, h.x + 2, h.y, 0xd94f4f); put(c, h.x + 3, h.y - 1, 0xd94f4f) }
  const over = head > cx - 2 && head - len < cx + 14
  clawd(c, m.t, 'float', cx, 1, over ? 3 + Math.round(wave(m.t, 500)) : 0)
  const kx = spot(c.W, 0.88)  // a cactus
  rect(c, kx, 8, 2, 7, 0x4f9a3a); rect(c, kx - 2, 10, 2, 1, 0x4f9a3a); rect(c, kx - 2, 8, 1, 3, 0x4f9a3a)
  ground(c, 0xb08d57)
}

const stewing: Draw = (c, m) => {
  const px = spot(c.W, 0.58)
  for (let i = 0; i < 6; i++) put(c, px - 4 + i * 2, GROUND - (rnd(i, Math.floor(m.t / 110)) > 0.4 ? 1 : 0), i % 2 ? 0xffd54f : 0xff8c2a)
  rect(c, px - 7, 8, 15, 6, 0x2e3440); rect(c, px - 8, 8, 17, 1, 0x4a5262)
  rect(c, px - 6, 9, 13, 1, 0x8a4a22)
  for (let i = 0; i < 6; i++) {  // bobbing chunks, and bubbles that pop
    const bx = px - 5 + i * 2
    put(c, bx, 9 + Math.round(Math.sin(m.t / 300 + i * 2)), i % 3 === 0 ? 0xe0872e : i % 3 === 1 ? 0xd9c84f : 0x6ab84f)
    if (Math.floor(m.t / 200 + i * 5) % 4 === 0) put(c, bx + 1, 8, 0xc98d55)
  }
  for (let k = 0; k < 3; k++) {
    const life = ((m.t / 140) + k * 3) % 8
    put(c, px - 3 + k * 3 + Math.round(Math.sin(life)), 7 - life, mix(0xc8ccd8, 0x1a1c24, life / 8))
  }
  const { hand } = clawd(c, m.t, 'crank', px - 22, 1)
  line(c, hand[0], hand[1], px + Math.cos(m.t / 250) * 3, 9, wood)
  rect(c, px + Math.cos(m.t / 250) * 3 - 1, 9, 3, 1, wood)
  ground(c)
}

const tempering: Draw = (c, m) => {
  const sx = spot(c.W, 0.45)
  const u = (m.t % 7000) / 7000
  const level = u < 0.4 ? lerp(0.2, 0.9, u / 0.4) : u < 0.75 ? lerp(0.9, 0.35, (u - 0.4) / 0.35) : lerp(0.35, 0.5, (u - 0.75) / 0.25)
  rect(c, sx, 13, 26, 2, 0xd8dce6)
  for (let i = 0; i < 5; i++) put(c, sx + 2 + i * 5, 13 + (i % 2), 0x9aa0b0)
  const sweep = Math.round(Math.sin(m.t / 420) * 3)
  const { hand } = clawd(c, m.t, 'pan', sx - 14 + sweep, 1)
  const pool = mix(0x3a1d0c, 0x7a4a24, level * 0.4)
  rect(c, hand[0] + 2, 12, Math.max(3, 14 + sweep * 1 - 2), 1, pool)
  rect(c, hand[0] + 2, 12, 2, 1, 0xa86a3a)
  rect(c, hand[0] + 1, hand[1] - 1, 1, 3, steel)
  const tx = sx + 31
  rect(c, tx, 2, 3, 11, 0x3a3d4a); disc(c, tx + 1, 13, 1, 0x3a3d4a)
  const h = Math.round(level * 10)
  const hot = mix(0x4fa3d9, 0xd94f4f, level)
  rect(c, tx + 1, 12 - h + 1, 1, h, hot); put(c, tx + 1, 13, hot)
  put(c, tx + 3, 12 - Math.round(0.5 * 10), 0xffd54f)  // the target mark
  ground(c)
}

const transfiguring: Draw = (c, m) => {
  const cx = spot(c.W, 0.58)
  const k = m.t % 1600, v = Math.floor(m.t / 1600) % 3
  rect(c, cx - 3, 13, 8, 2, 0x8a919b); rect(c, cx - 2, 12, 6, 1, 0x8a919b)
  const art = [
    ['wwwww..', 'wbbbbw.', 'wbbbbww', 'wbbbbw.', '.wwww..'],
    ['g.g.g.g', 'gkgggkg', 'ggggggg', '.ggggg.', 'g.g.g.g'],
    ['...yy..', '.yyyyk.', 'yyyyyoo', '.yyyy..', '..o.o..'],
  ][v]!
  if (k > 260) sprite(c, art, { w: 0xdfe7ff, b: 0x4fa3d9, g: 0x6ab84f, k: 0x1a1410, y: 0xffe066, o: 0xff9e3d }, cx - 3, 7 + (k < 500 ? 1 : 0))
  const tipPos = clawd(c, m.t, 'cast', cx - 22, 1).tip
  const x = cx - 22
  rect(c, x + 3, CLAWD_TOP - 1, 8, 1, 0x6a4a9a); rect(c, x + 4, CLAWD_TOP - 2, 6, 1, 0x6a4a9a); rect(c, x + 5, CLAWD_TOP - 3, 4, 1, 0x6a4a9a); rect(c, x + 6, CLAWD_TOP - 4, 2, 1, 0x6a4a9a)
  put(c, x + 7, CLAWD_TOP - 2, 0xffd54f)
  if (k < 600) {
    const r = (k / 600) * 7
    for (let a = 0; a < 16; a++) put(c, cx + Math.cos((a / 16) * 6.283) * r, 9 + Math.sin((a / 16) * 6.283) * r * 0.8, k < 300 ? 0xffffff : 0x9aff6a)
    if (tipPos) line(c, tipPos[0], tipPos[1], cx - 3, 9, 0x9aff6a)
  }
  for (let s = 0; s < 4; s++) put(c, cx + 8 + Math.cos(m.t / 300 + s * 1.6) * 4, 4 + Math.sin(m.t / 300 + s * 1.6) * 2, SPARKS[s]!)
  ground(c)
}

const unraveling: Draw = (c, m) => {
  const sx = spot(c.W, 0.18)
  const travel = Math.min(40, c.W - sx - 40)
  const T = 7000, p = m.t % T
  const q = p < 5000 ? p / 5000 : p < 5500 ? 1 : 1 - (p - 5500) / 1500
  const w = Math.round(12 * (1 - q))
  for (let j = 0; j < 6; j++) for (let i = 0; i < w; i++) put(c, sx + i, 9 + j, (i + j) % 2 ? 0xc23a55 : 0x8a2a42)
  const fx = sx + 14 + q * travel
  const forward = !(p >= 5500)
  const { hand } = clawd(c, m.t, forward && p < 5000 ? 'carry' : 'float', fx, forward ? 1 : -1)
  const ex = hand[0], endY = hand[1]
  const x0 = sx + w
  for (let x = x0; x <= ex; x++) {  // the thread runs behind Clawd: only on empty pixels, never across his face
    const y = 12 + Math.round(Math.sin((x - x0) / 3 + m.t / 220) * 1)
    if (c.px[y * c.W + Math.round(x)] === DEF) put(c, x, y, 0xd94f6a)
  }
  put(c, ex, endY, 0xd94f6a)
  const ballR = 2
  const side = forward ? 1 : -1  // the ball sits beyond his hand, which is on his left when he walks back
  disc(c, ex + 3 * side, 13, ballR, 0xd94f6a)  // the ball it winds onto
  line(c, ex + side, 13, ex + 5 * side, 12, 0x8a2a42)
  ground(c)
}

const whirlpooling: Draw = (c, m) => {
  const cx = spot(c.W, 0.5)
  for (let i = 0; i < 4; i++) {  // rings of water, turning round the drain
    const rx = 6 + i * 6, ry = 1 + i * 0.6
    for (let k = 0; k < 28; k++) {
      if ((k + Math.floor(m.t / 90) * (i % 2 ? 1 : -1) + 280) % 3 === 0) continue
      const a = (k / 28) * 6.283
      put(c, cx + Math.cos(a) * rx, 13 + Math.sin(a) * ry, mix(0x1d4a80, 0xaadfff, (i + 1) / 4))
    }
  }
  rect(c, cx - 2, 13, 5, 2, 0x0a1a30)
  const a = m.t / 1300
  const fx = cx - 7 + Math.cos(a) * 24
  clawd(c, m.t, 'float', fx, Math.sin(a) > 0 ? 1 : -1, 1)
  rect(c, fx - 1, 14, 16, 1, 0xd94f4f); rect(c, fx + 1, 15, 12, 1, 0xf4f4f4)
  for (let k = 0; k < 3; k++) put(c, cx - 3 + k * 3, 11 - ((m.t / 140 + k * 2) % 3), 0xaadfff)
}

const zesting: Draw = (c, m) => {
  const x = spot(c.W, 0.3)
  const { hand } = clawd(c, m.t, 'hammer', x, 1)
  const gx = hand[0] + 5
  rect(c, gx, 6, 3, 8, steel); rect(c, gx, 5, 3, 1, 0x4a4a52)
  for (let j = 0; j < 4; j++) put(c, gx + 1, 7 + j * 2, 0x23262f)
  disc(c, hand[0] + 2, hand[1], 1, 0xffe066)
  put(c, hand[0] + 4, hand[1], 0xd9c84f)
  rect(c, gx - 3, 13, 9, 2, 0xf4f4f4)
  const fill = Math.min(4, Math.floor((m.t % 6500) / 1500))
  for (let k = 0; k < fill * 3; k++) put(c, gx - 2 + (k % 7), 12 - Math.floor(k / 7), 0xffe066)
  for (let k = 0; k < 3; k++) {
    const fall = ((m.t / 70) + k * 4) % 8
    put(c, gx + 1 + (k - 1) * 1, hand[1] + 1 + fall * 0.5, 0xffe066)
  }
  ground(c)
}

export const SCENES: Record<string, Draw> = {
  actioning, befuddling, booping, canoodling, choreographing, composing, crafting, deliberating, drizzling, envisioning,
  flowing, frosting, gesticulating, hatching, imagining, jitterbugging, lollygagging, moonwalking, nesting, orchestrating,
  photosynthesizing, precipitating, puzzling, roosting, seasoning, slithering, stewing, tempering, transfiguring, unraveling,
  whirlpooling, zesting,
}
