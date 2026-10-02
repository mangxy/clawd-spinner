import { along, canvas, clawd, CLAWD_TOP, DEF, GROUND, ground, mix, put, rect, rnd, spot, SPARKS, sprite, START, wave, type Canvas, type Draw, type Pose } from '../acts'

const BG = 0x1a1c24
const WOOD = 0x7a4a24
const ease = (k: number) => { k = Math.min(1, Math.max(0, k)); return k * k * (3 - 2 * k) }
const tri = (x: number, p: number) => { const k = (((x % p) + p) % p) / p; return k < 0.5 ? k * 2 : 2 - k * 2 }

function ln(c: Canvas, x0: number, y0: number, x1: number, y1: number, col: number) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1)
  for (let i = 0; i <= n; i++) put(c, x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, col)
}

/** A dithered, tinted Clawd: a maybe-here, maybe-there copy. */
function ghost(c: Canvas, t: number, x: number, keep: number, pose: Pose = 'stand') {
  const g = canvas(c.W)
  clawd(g, t, pose, x)
  for (let y = 0; y < g.px.length / c.W; y++) for (let i = 0; i < c.W; i++) {
    const v = g.px[y * c.W + i]!
    if (v !== DEF && (i + y + Math.floor(t / 90)) % 4 < keep) put(c, i, y, mix(v, 0x4fa3d9, 0.45))
  }
}

// Actualizing: a dotted blueprint of a house turns solid, brick by brick, under Clawd's wand
const HOUSE = ['....R....', '...RRR...', '..RRRRR..', '.RRRRRRR.', '.WWWWWWW.', '.WWDWWWW.', '.WWDWWWW.', '.WWDWWWW.']
const actualizing: Draw = (c, m) => {
  const hx = spot(c.W, 0.66) - 4
  const y0 = GROUND - HOUSE.length
  const p = Math.min(1, (m.t % 7000) / 5200)
  const built = Math.floor(p * HOUSE.length)
  const pal: Record<string, number> = { R: 0xb04a3a, W: 0xe8d9b0, D: WOOD }
  HOUSE.forEach((row, j) => [...row].forEach((ch, i) => {
    if (ch === '.') return
    if (HOUSE.length - 1 - j < built) put(c, hx + i, y0 + j, pal[ch]!)
    else if ((i + j) % 2 === 0) put(c, hx + i, y0 + j, 0x3a64a8)
  }))
  const { tip } = clawd(c, m.t, 'cast', hx - 30)
  const fy = y0 + HOUSE.length - built
  if (tip && p < 1) for (let k = 0; k < 4; k++) {
    const a = (m.t / 450 + k / 4) % 1
    put(c, tip[0] + (hx + 4 - tip[0]) * a, tip[1] + (fy - tip[1]) * a - Math.sin(a * Math.PI) * 3, SPARKS[k]!)
  }
  if (p >= 1 && m.t % 400 < 200) for (const [dx, dy] of [[-1, 3], [9, 4], [4, 0]]) put(c, hx + dx!, y0 + dy!, 0xfff6c8)
  ground(c)
}

// Billowing: a hero's cape and a pennant streaming in a strong wind
const billowing: Draw = (c, m) => {
  const hx = spot(c.W, 0.45) - 7
  clawd(c, m.t, 'stand', hx)
  for (let i = 1; i <= 14; i++) {
    const dy = Math.sin(m.t / 150 - i * 0.7) * (i / 14) * 3
    for (let j = 0; j < 5 - Math.floor(i / 5); j++) put(c, hx + 2 - i, CLAWD_TOP + 1 + j + dy, (i + j) % 4 < 2 ? 0xd94f4f : 0xa33a3a)
  }
  const px = spot(c.W, 0.82)
  rect(c, px, 3, 1, GROUND - 3, 0x8a919b)
  for (let i = 1; i < 12; i++) {
    const dy = Math.sin(m.t / 130 - i * 0.55) * (i / 12) * 2.5
    for (let j = 0; j < 5; j++) put(c, px + i, 3 + j + dy, j % 2 ? 0xf4f4f4 : 0x4fa3d9)
  }
  for (let k = 0; k < 5; k++) rect(c, ((m.t / 14 + k * 41) % (c.W + 12)) - 6, 2 + k * 2 + (k % 2), 4, 1, 0x4a4f60)
  ground(c)
}

// Bootstrapping: Clawd hauls himself off the ground by his own bootstraps
const bootstrapping: Draw = (c, m) => {
  const hx = spot(c.W, 0.5) - 7
  const lift = Math.round(ease(tri(m.t, 5200) * 1.6) * 5)
  clawd(c, m.t, 'stand', hx, 1, lift)
  const legY = CLAWD_TOP + 5 - lift
  const armY = CLAWD_TOP + 2 - lift
  for (const bx of [hx + 2, hx + 9]) rect(c, bx - 1, legY, 4, 1, 0x7a3b1e)
  for (const sx of [hx - 1, hx + 14]) for (let y = armY; y <= legY; y++) put(c, sx, y, y % 2 ? 0xc8b08a : 0x9a7a52)
  for (let k = 0; k < 3; k++) put(c, hx + 4 + k * 3, GROUND - 1, mix(0x4a4f60, BG, lift ? 0 : 1))
  ground(c)
  if (lift > 0) rect(c, hx + 4, GROUND, 6, 1, 0x14151a)
}

// Caramelizing: sugar melts, darkens to amber and bubbles in a pot Clawd stirs
const caramelizing: Draw = (c, m) => {
  const px = spot(c.W, 0.6)
  const p = (m.t % 7200) / 6200
  const col = p < 0.5 ? mix(0xf4ecd8, 0xe0a030, p * 2) : mix(0xe0a030, 0x7a3a0e, Math.min(1, (p - 0.5) * 2))
  rect(c, px - 5, GROUND - 6, 1, 5, 0x3a3a42); rect(c, px + 5, GROUND - 6, 1, 5, 0x3a3a42); rect(c, px - 5, GROUND - 1, 11, 1, 0x3a3a42)
  rect(c, px - 4, GROUND - 6, 9, 5, mix(col, BG, 0.25)); rect(c, px - 4, GROUND - 6, 9, 2, col)
  for (let k = 0; k < 4; k++) {
    const a = (m.t / 700 + k / 4) % 1
    put(c, px - 3 + k * 2 + (k % 2), GROUND - 6 - a * 3, mix(mix(col, 0xffffff, 0.5), BG, a))
  }
  rect(c, px - 5, GROUND, 11, 1, mix(0xff4b3e, 0xffd54f, wave(m.t, 500)))
  const hx = px - 22
  const { hand } = clawd(c, m.t, 'crank', hx)
  const sx = px - 1 + Math.sin(m.t / 250) * 3
  ln(c, hand[0] + 1, hand[1], sx, GROUND - 7, WOOD)
  const drip = (m.t / 500) % 1
  put(c, sx, GROUND - 6 + drip * 2, col)
  ground(c)
}

// Churning: a wooden butter churn, plunger pumping, a block of butter growing beside it
const churning: Draw = (c, m) => {
  const bx = spot(c.W, 0.62)
  rect(c, bx - 4, GROUND - 9, 9, 9, 0x8a5a2e)
  for (const y of [GROUND - 8, GROUND - 3]) rect(c, bx - 4, y, 9, 1, 0x5a3a1c)
  rect(c, bx - 5, GROUND - 10, 11, 1, 0xb88a52)
  const hx = bx - 15
  const { hand } = clawd(c, m.t, 'hammer', hx)
  const down = m.t % 700 >= 450
  rect(c, hand[0] - 1, hand[1], 4, 1, 0xb88a52)
  for (let y = hand[1]; y < GROUND - 10; y++) put(c, bx, y, 0xb88a52)
  if (down) for (let s = 0; s < 4; s++) put(c, bx - 4 + s * 3, GROUND - 11 - (s % 2), 0xf4f4f4)
  const h = 1 + Math.floor(((m.t % 7000) / 7000) * 4)
  rect(c, bx + 8, GROUND - h, 4, h, 0xffd86a); rect(c, bx + 8, GROUND - h, 4, 1, 0xfff0b0)
  ground(c)
}

// Computing: Clawd types at a monitor of scrolling code and a filling progress bar
const computing: Draw = (c, m) => {
  const mx = spot(c.W, 0.62)
  rect(c, mx - 1, 3, 17, 9, 0x6b7086); rect(c, mx, 4, 15, 7, 0x10231a)
  const base = Math.floor(m.t / 350)
  for (let k = 0; k < 3; k++) {
    const len = 3 + Math.floor(rnd(base + k) * 9)
    rect(c, mx + 1 + Math.floor(rnd(base + k, 4) * 2) * 2, 5 + k * 2 - (m.t % 350 > 175 ? 0 : 0), len, 1, [0x6ad94f, 0x4fd9c8, 0xd9c84f][(base + k) % 3]!)
  }
  rect(c, mx + 1, 10, Math.floor(13 * ((m.t % 5600) / 5600)), 1, 0x4fa3d9)
  if (m.t % 700 < 350) put(c, mx + 13, 9, 0xf4f4f4)
  rect(c, mx + 6, 12, 3, 2, 0x55555f); rect(c, mx + 3, 14, 9, 1, 0x55555f)
  const hx = mx - 29
  clawd(c, m.t, 'hammer', hx)
  rect(c, hx + 12, GROUND - 2, 11, 1, 0x55555f); rect(c, hx + 12, GROUND - 1, 11, 1, 0x3a3a42)
  ground(c)
}

// Creating: a landscape painting appears stroke by stroke on an easel
const PIC = [
  'bbbbbbbbbbyyb', 'bbbbbbbbbbyyb', 'bbbbbbtbbbbbb', 'bbbbbtttbbbbb',
  'bbbgggkgggggb', 'gggggggggGggg', 'GGGGGGGGGGGGG',
]
const creating: Draw = (c, m) => {
  const hx = spot(c.W, 0.3) - 7
  const ex = hx + 18
  const pal: Record<string, number> = { b: 0x8ac4ff, y: 0xffe066, t: 0x8a5a2e, g: 0x6aa84f, k: 0x3a7a2a, G: 0x3f7a35 }
  ln(c, ex + 3, 14, ex + 7, 12, WOOD); ln(c, ex + 11, 12, ex + 15, 14, WOOD)
  rect(c, ex, 3, 15, 9, WOOD); rect(c, ex + 1, 4, 13, 7, 0xf4f4f4)
  const p = Math.min(1, (m.t % 7600) / 5600)
  const reveal = Math.floor(p * 14)
  PIC.forEach((row, j) => [...row].forEach((ch, i) => i < reveal && put(c, ex + 1 + i, 4 + j, pal[ch]!)))
  const { hand } = clawd(c, m.t, 'pan', hx)
  const bi = Math.min(12, reveal)
  if (p < 1) {
    ln(c, hand[0] + 1, hand[1], ex + 1 + bi, 6 + Math.round(Math.sin(m.t / 140) * 2), 0xb8c0d0)
    put(c, ex + 1 + bi, 6 + Math.round(Math.sin(m.t / 140) * 2), SPARKS[Math.floor(m.t / 120) % 4]!)
  } else if (m.t % 500 < 250) put(c, ex + 14, 3, 0xfff6c8)
  ground(c)
}

// Determining: a balance scale swings, wobbles, settles on one side and gets a tick
const determining: Draw = (c, m) => {
  const sx = spot(c.W, 0.6)
  const s = (m.t % 7000) / 1000
  const a = 0.55 + 0.45 * Math.exp(-s * 0.8) * Math.cos(s * 4.5)
  const dy = Math.round(a * 4)
  rect(c, sx, 4, 1, 10, 0x8a919b); rect(c, sx - 3, 14, 7, 1, 0x8a919b)
  ln(c, sx - 8, 4 - dy, sx + 8, 4 + dy, 0xd9c84f)
  for (const [px, py, w] of [[sx - 8, 4 - dy, 0], [sx + 8, 4 + dy, 1]] as const) {
    ln(c, px, py, px - 2, py + 4, 0x6b7086); ln(c, px, py, px + 2, py + 4, 0x6b7086)
    rect(c, px - 3, py + 4, 7, 1, 0xd9c84f)
    if (w) rect(c, px - 1, py + 2, 3, 2, 0xd94f4f)
  }
  clawd(c, m.t, 'stand', sx - 28)
  if (s > 4.4) put(c, sx, 1, 0x6ad94f), put(c, sx - 1, 2, 0x6ad94f), put(c, sx + 1, 0, 0x6ad94f), put(c, sx + 2, -1, 0x6ad94f)
  ground(c)
}

// Ebbing: the tide slides out, baring shells on the sand, and creeps back in under a pale moon
const ebbing: Draw = (c, m) => {
  const lo = spot(c.W, 0.5), hi = spot(c.W, 0.9)
  const shore = lo + (hi - lo) * wave(m.t, 7000, -Math.PI / 2)
  for (const [k, col] of [[0.58, 0xe8a0b0], [0.68, 0xf4efe0], [0.78, 0xd9c84f]] as const) {
    const x = spot(c.W, k)
    if (x < shore - 2) { put(c, x, GROUND - 1, col); put(c, x + 1, GROUND - 1, col) }
  }
  for (let x = Math.round(shore); x < c.W; x++) {
    const top = 9 + Math.round(Math.sin(x / 2 + m.t / 300))
    for (let y = top; y < GROUND; y++) put(c, x, y, y === top ? 0x9fd0ff : mix(0x2a6fb0, 0x14355a, (y - top) / 6))
  }
  put(c, shore - 1, 12, 0xf4f4f4); put(c, shore, 10, 0xf4f4f4)
  sprite(c, ['.mm.', 'mm..', 'mm..', '.mm.'], { m: 0xe8e4c8 }, c.W - 9, 1)
  clawd(c, m.t, 'stand', spot(c.W, 0.2) - 7)
  ground(c, 0xc9a96a)
}

// Fermenting: jars of cabbage, pickles and carrots bubble away; one lid pops
const fermenting: Draw = (c, m) => {
  const jars: [number, number][] = [[0.5, 0x8a3a8a], [0.65, 0x6aa84f], [0.8, 0xff8c2a]]
  for (const [i, [k, col]] of jars.entries()) {
    const jx = spot(c.W, k) - 4
    rect(c, jx, GROUND - 9, 1, 8, 0x9ab8c8); rect(c, jx + 7, GROUND - 9, 1, 8, 0x9ab8c8); rect(c, jx, GROUND - 1, 8, 1, 0x9ab8c8)
    rect(c, jx + 1, GROUND - 7, 6, 6, col)
    for (let b = 0; b < 3; b++) {
      const a = (m.t / 900 + b / 3 + i * 0.3) % 1
      put(c, jx + 2 + b * 2 + (Math.floor(a * 6) % 2), GROUND - 2 - a * 5, mix(col, 0xffffff, 0.6))
    }
    const pop = i === Math.floor(m.t / 3000) % 3 && m.t % 3000 < 400
    rect(c, jx - 1, GROUND - 10 - (pop ? 3 : 0), 10, 1, 0xb0b6c0)
    if (pop) for (let s = 0; s < 4; s++) put(c, jx + 1 + s * 2, GROUND - 12 - (s % 2) - ((m.t % 400) / 130), mix(col, 0xffffff, 0.5))
  }
  clawd(c, m.t, 'stand', spot(c.W, 0.2) - 7)
  ground(c)
}

// Flummoxing: Clawd glances every which way while dizzy stars and question marks swarm his head
const flummoxing: Draw = (c, m, glyphs) => {
  const hx = spot(c.W, 0.5) - 7
  clawd(c, m.t, 'stand', hx, Math.floor(m.t / 900) % 2 ? 1 : -1)
  for (let k = 0; k < 3; k++) {
    const a = m.t / 260 + (k * Math.PI * 2) / 3
    const sx = hx + 7 + Math.cos(a) * 9, sy = CLAWD_TOP - 1 + Math.sin(a) * 2
    put(c, sx, sy, 0xffd54f); put(c, sx - 1, sy, 0xfff3b0); put(c, sx + 1, sy, 0xfff3b0)
  }
  for (let k = 0; k < 3; k++) {
    const step = Math.floor(m.t / 600) + k * 7
    glyphs.push({ x: hx - 3 + Math.floor(rnd(step) * 20), row: Math.floor(rnd(step, 5) * 3), ch: k === 2 ? '!' : '?', fg: [0xd94f8a, 0x4fa3d9, 0xd9c84f][k]! })
  }
  ground(c)
}

// Gallivanting: a jaunty feathered hat, a streaming scarf and a hop in every step
const gallivanting: Draw = (c, m, glyphs) => {
  const x = ((m.t * 0.026) % (c.W + 30)) - 16
  const lift = Math.round(Math.abs(Math.sin(m.t / 230)) * 3)
  clawd(c, m.t, 'walk', x, 1, lift)
  const top = CLAWD_TOP - lift
  rect(c, x + 4, top - 2, 6, 2, 0x6a4a9a); rect(c, x + 2, top, 10, 1, 0x4a3270)
  ln(c, x + 9, top - 2, x + 13, top - 5, 0xff7ab0)
  for (let i = 1; i <= 6; i++) put(c, x + 1 - i, top + 3 + Math.round(Math.sin(m.t / 110 - i)), i % 2 ? 0xd94f4f : 0xf4c8c8)
  for (let k = 0; k < c.W; k += 7) put(c, k + Math.floor(rnd(k) * 4), GROUND - 1, [0xd94f8a, 0xffd54f, 0x9a6ad9][k % 3]!)
  for (let k = 0; k < 2; k++) {
    const a = (m.t / 600 + k / 2) % 1
    glyphs.push({ x: Math.round(x) + 15 + k * 2, row: Math.max(0, 3 - Math.floor(a * 4)), ch: '♥', fg: mix(0xff7ab0, BG, a * 0.6) })
  }
  ground(c, 0x2d4a2b)
}

// Gitifying: a commit graph scrolls by, branching off and merging back, while Clawd types
const gitifying: Draw = (c, m, glyphs) => {
  const gx = 28, U = 8
  const scroll = (m.t * 0.012) % (4 * U)
  const g = (x: number, y: number, col: number) => x >= gx && put(c, x, y, col)
  for (let x = gx; x < c.W; x++) put(c, x, 3, 0x2f7a4a)
  for (let i = -1; i < (c.W - gx) / U + 4; i++) {
    const x0 = gx + i * U - scroll
    if (i % 4 === 0) {
      for (let k = 0; k <= 6; k++) g(Math.round(x0 + k), 3 + k, 0xb0409a)
      for (let k = 7; k <= U; k++) g(Math.round(x0 + k), 9, 0xb0409a)
    }
    if (i % 4 === 2) {
      for (let k = 0; k <= U - 6; k++) g(Math.round(x0 + k), 9, 0xb0409a)
      for (let k = 0; k <= 6; k++) g(Math.round(x0 + U - 6 + k), 9 - k, 0xb0409a)
    }
  }
  for (let i = -1; i < (c.W - gx) / U + 4; i++) {
    const x0 = Math.round(gx + i * U - scroll)
    const y = i % 4 === 1 || i % 4 === 2 ? 9 : 3
    const col = y === 9 ? 0xff7ad9 : 0x6ad98a
    for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) g(x0 - 1 + a, y - 1 + b, a === 1 && b === 1 ? 0xf4f4f4 : col)
  }
  clawd(c, m.t, 'hammer', START)
  glyphs.push({ x: START + 17, row: 6, ch: '$', fg: 0x6ad98a })
  if (m.t % 600 < 300) glyphs.push({ x: START + 19, row: 6, ch: '_', fg: 0xf4f4f4 })
  ground(c, 0x2a2d36)
}

// Herding: Clawd drives strays through a gate into a fenced pen of sheep, then trudges back for more
const herding: Draw = (c, m) => {
  const pen = spot(c.W, 0.66)
  for (let x = pen; x < pen + 22; x += 4) rect(c, x, GROUND - 5, 1, 5, 0xb88a52)
  rect(c, pen, GROUND - 4, 22, 1, 0xb88a52); rect(c, pen, GROUND - 2, 22, 1, 0xb88a52)
  const sheep = (x: number, y: number, step: number) => sprite(c, ['.www.', 'wwwwk', '.wwww', step ? '.l.l.' : 'l...l'], { w: 0xeeeeee, k: 0x2a2a30, l: 0x2a2a30 }, x, y)
  for (let k = 0; k < 3; k++) sheep(pen + 3 + k * 6, GROUND - 4 - (Math.floor(m.t / 500 + k * 2) % 4 === 0 ? 1 : 0), 0)
  const at = along([{ x: -20, stay: 0, pose: 'walk' }, { x: pen - 34, stay: 900, pose: 'stand' }], m.t)
  clawd(c, m.t, at.pose, at.x, at.facing)
  if (at.facing > 0 && (at.stop === 0 || at.still)) for (let k = 0; k < 2; k++) {
    const sx = at.x + 22 + k * 9
    if (sx < pen + 20) sheep(sx, GROUND - 4, Math.floor(m.t / 160 + k) % 2)
  }
  if (at.still) for (let k = 0; k < 2; k++) sheep(pen + 15 + k * 3 - (k ? 0 : 0), GROUND - 4 - (Math.floor(m.t / 400) % 2), 0)
  ground(c, 0x2d4a2b)
}

// Improvising: Clawd jams on a keyboard, hitting random keys and shooting off random notes
const improvising: Draw = (c, m, glyphs) => {
  const hx = spot(c.W, 0.4) - 7
  const kx = hx + 14
  clawd(c, m.t, 'hammer', hx)
  rect(c, kx, GROUND - 3, 18, 3, 0xf0f0f0)
  for (let i = 1; i < 18; i += 2) rect(c, kx + i, GROUND - 3, 1, 3, 0xc0c4cc)
  for (let i = 1; i < 18; i += 4) rect(c, kx + i, GROUND - 3, 2, 2, 0x2a2a30)
  const step = Math.floor(m.t / 180)
  const key = Math.floor(rnd(step) * 9)
  rect(c, kx + key * 2, GROUND - 1, 2, 1, SPARKS[step % 4]!)
  for (let j = 0; j < 3; j++) {
    const s = step - j
    const age = ((m.t % 180) + j * 180) / 540
    glyphs.push({ x: kx + Math.floor(rnd(s) * 9) * 2, row: Math.max(0, 4 - Math.floor(age * 5)), ch: rnd(s, 3) > 0.5 ? '♪' : '♫', fg: mix(SPARKS[s % 4]!, BG, age * 0.7) })
  }
  ground(c)
}

// Julienning: a carrot is chopped into thin sticks, Clawd inching along behind the knife
const julienning: Draw = (c, m) => {
  const bx = spot(c.W, 0.6) - 8
  const T = m.t % 7000
  const N = 14
  const p = Math.min(1, T / 5200)
  const n = Math.floor(p * N)
  const fade = T > 5600 ? (T - 5600) / 1400 : 0
  const cut = bx + n
  rect(c, bx - 2, GROUND - 3, N + 6, 1, 0xc89a5a); rect(c, bx - 1, GROUND - 2, 1, 2, WOOD); rect(c, bx + N + 2, GROUND - 2, 1, 2, WOOD)
  for (let i = 0; i < N; i++) {
    const stick = i < n
    const col = i % 2 ? 0xff8c2a : 0xe07a20
    if (stick) { if (i % 2 === 0) rect(c, bx + i, GROUND - 5, 1, 2, mix(0xffb050, BG, fade)) }
    else if (fade === 0 || T > 6200) rect(c, bx + i, GROUND - 5, 1, 2, col)
  }
  const walkBack = T > 5200 && T < 6300
  const x = walkBack ? cut - 15 - (cut - bx - 6) * ease((T - 5200) / 1100) : cut - 15
  const { hand } = clawd(c, m.t, walkBack ? 'walk' : 'hammer', x, walkBack ? -1 : 1)
  if (!walkBack && T < 5600) {
    const kx = walkBack ? 0 : hand[0] + 1
    rect(c, kx, hand[1] - 3, 1, 4, 0xdfe7ff); put(c, kx, hand[1] - 4, 0x4a3a2a)
  }
  ground(c)
}

// Manifesting: Clawd floats in a ring of glowing light as a wished-for star takes shape above him
const manifesting: Draw = (c, m) => {
  const hx = spot(c.W, 0.5) - 7
  const lift = 1 + Math.round(wave(m.t, 2400) * 2)
  const p = (m.t % 7000) / 7000
  for (let k = 0; k < 14; k++) {
    const a = m.t / 700 + (k * Math.PI * 2) / 14
    put(c, hx + 7 + Math.cos(a) * 13, CLAWD_TOP + 3 - lift + Math.sin(a) * 5, k % 2 ? 0xc8a0ff : 0xff9ad0)
  }
  clawd(c, m.t, 'stand', hx, 1, lift)
  const sx = hx + 7
  const star = [['y'], ['.y.', 'yyy', '.y.'], ['..y..', '..y..', 'yyyyy', '..y..', '..y..']]
  const lvl = p < 0.2 ? -1 : p < 0.45 ? 0 : p < 0.7 ? 1 : 2
  if (lvl >= 0 && p < 0.9) sprite(c, star[lvl]!, { y: p < 0.7 ? 0xffe066 : 0xfff6c8 }, sx - Math.floor(star[lvl]![0]!.length / 2), 1)
  if (p >= 0.9) for (let k = 0; k < 8; k++) {
    const r = (p - 0.9) * 90
    put(c, sx + Math.cos(k * 0.785) * r, 3 + Math.sin(k * 0.785) * r * 0.5, SPARKS[k % 4]!)
  }
  ground(c, 0x2a2540)
}

// Moseying: a slow, whistling cowboy amble past a cactus, with a tumbleweed rolling by
const moseying: Draw = (c, m, glyphs) => {
  const cx = spot(c.W, 0.7)
  rect(c, cx, GROUND - 7, 2, 7, 0x4f8a3a); rect(c, cx - 3, GROUND - 5, 1, 3, 0x4f8a3a); rect(c, cx - 3, GROUND - 3, 4, 1, 0x4f8a3a)
  rect(c, cx + 4, GROUND - 6, 1, 3, 0x4f8a3a); rect(c, cx + 2, GROUND - 4, 3, 1, 0x4f8a3a)
  sprite(c, ['.yy.', 'yyyy', 'yyyy', '.yy.'], { y: 0xffd54f }, c.W - 10, 1)
  const x = ((m.t * 0.0085) % (c.W + 26)) - 16
  const tx = ((m.t * 0.022 + c.W * 0.5) % (c.W + 20)) - 6
  const a = m.t / 140
  for (let k = 0; k < 8; k++) put(c, tx + 2 + Math.cos(a + k * 0.785) * (k % 2 ? 2 : 1), GROUND - 3 + Math.sin(a + k * 0.785) * (k % 2 ? 2 : 1), 0x8a6a3a)
  clawd(c, m.t, 'walk', x)
  rect(c, x + 2, CLAWD_TOP - 1, 10, 1, WOOD); rect(c, x + 4, CLAWD_TOP - 3, 6, 2, 0x9a6a34); rect(c, x + 4, CLAWD_TOP - 2, 6, 1, 0x4a2a14)
  for (let k = 0; k < 3; k++) put(c, x - 1 - k * 2, GROUND - 1 - ((m.t / 150 + k * 2) % 3) * 0.7, mix(0xc9a96a, BG, 0.3 + k * 0.2))
  glyphs.push({ x: Math.round(x) + 16, row: 3 - Math.floor(((m.t / 500) % 2) * 1), ch: '♪', fg: 0xe8e4c8 })
  for (let k = 0; k < c.W; k += 8) put(c, k + Math.floor(rnd(k) * 5), GROUND - 1, 0x8a7448)
  ground(c, 0xc9a96a)
}

// Newspapering: Clawd reads a broadsheet and flips its pages
const newspapering: Draw = (c, m) => {
  const hx = spot(c.W, 0.4) - 7
  clawd(c, m.t, 'pan', hx)
  const T = m.t % 1900
  const seed = Math.floor(m.t / 1900)
  const x0 = hx + 15
  const flip = T < 380 ? Math.abs(Math.cos((T / 380) * Math.PI)) : 1
  const w = Math.max(1, Math.round(13 * flip))
  for (let i = 0; i < w; i++) {
    const src = Math.floor((i * 13) / w)
    const ox = x0 + Math.floor((13 - w) / 2) + i
    for (let j = 0; j < 9; j++) {
      let col = 0xece6d2
      if (j < 2) col = 0x2a2a30
      else if (j >= 3 && j < 6 && src < 5) col = 0x8a8f9a
      else if (j >= 3 && src >= 5 && j % 2 === 1 && src < 3 + 6 + Math.floor(rnd(seed, j) * 4)) col = 0x5a5f6a
      else if (j >= 6 && j % 2 === 0 && src < 4 + Math.floor(rnd(seed, j + 9) * 9)) col = 0x5a5f6a
      put(c, ox, 5 + j, col)
    }
    put(c, ox, 5, 0x2a2a30)
  }
  ground(c)
}

// Osmosing: water seeps through a membrane toward the saltier side, whose level rises
const osmosing: Draw = (c, m) => {
  const bx = spot(c.W, 0.64)
  const s = Math.sin((m.t / 7000) * Math.PI * 2)
  const lvlL = 8 - Math.round(s * 2), lvlR = 8 + Math.round(s * 2)
  rect(c, bx - 13, 4, 1, GROUND - 4, 0x9ab8c8); rect(c, bx + 13, 4, 1, GROUND - 4, 0x9ab8c8); rect(c, bx - 13, GROUND - 1, 27, 1, 0x9ab8c8)
  for (let y = lvlL; y < GROUND - 1; y++) rect(c, bx - 12, y, 12, 1, y === lvlL ? 0x6fb0e8 : 0x2a5a8a)
  for (let y = lvlR; y < GROUND - 1; y++) rect(c, bx + 1, y, 12, 1, y === lvlR ? 0x6fb0e8 : 0x2a5a8a)
  for (let y = 5; y < GROUND - 1; y++) if (y % 2) put(c, bx, y, 0xff9ad0)
  for (let k = 0; k < 6; k++) put(c, bx - 10 + (k % 3) * 3 + Math.round(Math.sin(m.t / 400 + k * 2)), 11 + Math.floor(k / 3) * 2, 0xffa040)
  const dir = Math.cos((m.t / 7000) * Math.PI * 2) > 0 ? 1 : -1
  for (let k = 0; k < 6; k++) {
    const a = (m.t / 900 + k / 6) % 1
    put(c, dir > 0 ? bx - 7 + a * 14 : bx + 7 - a * 14, 9 + (k * 5) % 4, 0xcfe8ff)
  }
  clawd(c, m.t, 'stand', spot(c.W, 0.64) - 40 > 3 ? spot(c.W, 0.64) - 40 : START)
  ground(c)
}

// Polishing: buffs a dull gem with a cloth until it flares into sparkle
const polishing: Draw = (c, m) => {
  const gx = spot(c.W, 0.62)
  const p = Math.min(1, (m.t % 6400) / 4800)
  rect(c, gx - 3, GROUND - 4, 7, 4, 0x55555f); rect(c, gx - 4, GROUND - 5, 9, 1, 0x7a7a86)
  const col = mix(0x5a6a7a, 0x6ad9ff, p), hi = mix(0x8a9aaa, 0xffffff, p)
  sprite(c, ['.hccch.', 'hcccccc', '.ccdcc.', '..cdc..', '...d...'].map(r => r.slice(0, 7)), { c: col, h: hi, d: mix(col, 0x2a3a6a, 0.5) }, gx - 3, GROUND - 10)
  const { hand } = clawd(c, m.t, 'pan', gx - 18)
  const off = Math.round(Math.sin(m.t / 90) * 2)
  rect(c, hand[0] + 1 + off, hand[1] - 3, 3, 4, 0xd94f8a)
  const s = (m.t % 1000) / 1000
  if (p >= 1 || s < 0.15) for (const [dx, dy, d] of [[4, -1, 0], [-3, -3, 0.4], [6, 3, 0.7]] as const) {
    if (p < 1 && d > 0) continue
    const q = p >= 1 ? ((m.t / 700 + d) % 1) : 0
    const r = p >= 1 ? Math.sin(q * Math.PI) * 2 : 1
    const sx = gx + dx, sy = GROUND - 8 + dy
    put(c, sx, sy, 0xffffff)
    if (r > 0.5) { put(c, sx - 1, sy, 0xdff6ff); put(c, sx + 1, sy, 0xdff6ff); put(c, sx, sy - 1, 0xdff6ff); put(c, sx, sy + 1, 0xdff6ff) }
    if (r > 1.5) { put(c, sx - 2, sy, 0xdff6ff); put(c, sx + 2, sy, 0xdff6ff); put(c, sx, sy - 2, 0xdff6ff); put(c, sx, sy + 2, 0xdff6ff) }
  }
  ground(c)
}

// Prestidigitating: sleight of hand, a stream of playing cards flicks from hand to hand across the strip
const prestidigitating: Draw = (c, m) => {
  const hx = spot(c.W, 0.3) - 7
  const { hand } = clawd(c, m.t, 'pan', hx)
  rect(c, hand[0] - 2, hand[1], 2, 1, 0xf4f4f4)
  for (let k = 0; k < 5; k++) {
    const a = (m.t / 1200 + k / 5) % 1
    const x = hand[0] + 2 + a * 22
    const y = hand[1] - 2 - Math.sin(a * Math.PI) * 9
    const thin = Math.floor(a * 9) % 2
    rect(c, x, y, thin ? 1 : 2, 3, 0xf8f8f8)
    if (!thin) put(c, x, y + 1, k % 2 ? 0xd94f4f : 0x2a2a30)
    if (a > 0.9) { put(c, x + 2, y + 3, 0xfff6c8); put(c, x + 3, y + 2, 0xffd54f) }
  }
  const cx = hand[0] + 25
  rect(c, cx - 1, GROUND - 3, 5, 1, 0xd94f4f); rect(c, cx, GROUND - 2, 3, 1, 0xf8f8f8)
  ground(c)
}

// Quantumizing: Clawd sits in several places at once, flickering until a measurement collapses him into one
const quantumizing: Draw = (c, m) => {
  const slots = [0.22, 0.5, 0.78].map(k => spot(c.W, k) - 7)
  const T = m.t % 2600
  const pick = Math.floor(rnd(Math.floor(m.t / 2600)) * 3)
  const collapsed = T > 1500
  slots.forEach((x, i) => {
    if (collapsed && i === pick) return
    if (!collapsed) ghost(c, m.t + i * 40, x, 1 + ((Math.floor(m.t / 200) + i) % 2))
    else if (T < 1700) ghost(c, m.t, x, 1)
  })
  if (collapsed) clawd(c, m.t, 'stand', slots[pick]!)
  for (let x = 0; x < c.W; x++) {
    let amp = 0.6
    for (const [i, s] of slots.entries()) amp += Math.exp(-((x - s - 7) ** 2) / 90) * (collapsed ? (i === pick ? 3 : 0) : 2)
    put(c, x, 3 - Math.sin(x / 2 - m.t / 120) * Math.min(3, amp), mix(0x4fd9ff, BG, collapsed && x % 2 ? 0.4 : 0))
  }
  if (T > 1500 && T < 1800) for (let k = 0; k < 8; k++) put(c, slots[pick]! + 7 + Math.cos(k * 0.785) * (T - 1500) / 12, 9 + Math.sin(k * 0.785) * (T - 1500) / 40, 0xffffff)
  ground(c)
}

// Ruminating: Clawd and a cow chew things over, a thought going round and round above
const ruminating: Draw = (c, m) => {
  const hx = spot(c.W, 0.3) - 7
  clawd(c, m.t, 'stand', hx)
  const cx = hx + 22, cy = GROUND - 6
  const chew = Math.floor(m.t / 300) % 2
  sprite(c, ['h.........t', 'wwwwwwwwwwt', 'wkwwwkkwwwt', 'wwwwwkkwww.', '.w.w...w.w.', '.w.w...w.w.'], { w: 0xf4f4f4, k: 0x2a2a30, h: 0xd9c84f, t: 0x2a2a30 }, cx, cy)
  rect(c, cx - 1, cy + 2 + chew, 2, 1, 0xe88aa0)
  put(c, cx - 2, cy + 3 + chew, 0x6aa84f)
  for (let k = 0; k < 8; k++) {
    const a = -m.t / 260 + k * 0.785
    put(c, hx + 7 + Math.cos(a) * 5, 4 + Math.sin(a) * 2.5, mix(0xe8e4c8, BG, k / 9))
  }
  put(c, hx + 7, 4, 0xe8e4c8)
  ground(c, 0x2d4a2b)
}

// Shenaniganing: a banana peel trap, a hiding Clawd, a robot who slips, and the giggles
const shenaniganing: Draw = (c, m, glyphs) => {
  const peel = spot(c.W, 0.5)
  rect(c, peel, GROUND - 1, 3, 1, 0xffd54f); put(c, peel + 1, GROUND - 2, 0xffd54f); put(c, peel + 3, GROUND - 2, 0xc8a020)
  const x = c.W + 6 - ((c.W - 12) * (m.t % 7000)) / 7000
  const s = (peel + 3 - x) / 16
  const slipping = s > 0 && s < 1
  const lift = slipping ? Math.sin(s * Math.PI) * 7 : 0
  const body = ['..r..', '.bbb.', 'bwbwb', '.bbb.', '.b.b.']
  if (x > 14) {
    sprite(c, slipping && s > 0.3 && s < 0.7 ? [...body].reverse() : body, { b: 0x4fa3d9, w: 0xf4f4f4, r: 0xd94f4f }, x, GROUND - 5 - lift)
    if (slipping) glyphs.push({ x: Math.round(x) + 1, row: Math.max(0, Math.floor((GROUND - 8 - lift) / 2)), ch: '*', fg: 0xffd54f })
  }
  const laugh = s >= 1
  clawd(c, m.t, laugh ? 'dance' : 'stand', START)
  if (!laugh) rect(c, START - 1, CLAWD_TOP + 3, 16, 3, 0xa8743c)
  if (!laugh) for (let i = 0; i < 16; i += 5) rect(c, START - 1 + i, CLAWD_TOP + 4, 1, 2, 0x7a4a24)
  if (laugh) for (let k = 0; k < 3; k++) glyphs.push({ x: START + 15 + k * 2, row: 2 + (Math.floor(m.t / 150) + k) % 2, ch: k % 2 ? 'a' : 'h', fg: 0xffd54f })
  ground(c)
}

// Smooshing: a press comes down and squashes a pink blob flat, then lets it spring back
const smooshing: Draw = (c, m) => {
  const px = spot(c.W, 0.62)
  const s = (m.t % 3200) / 3200
  const h = s < 0.3 ? 6 - 4 * ease(s / 0.3) : s < 0.55 ? 2 : s < 0.85 ? 2 + 4 * ease((s - 0.55) / 0.3) : 6
  const hh = Math.round(h)
  const w = Math.min(20, Math.round(48 / hh))
  for (let j = 0; j < hh; j++) rect(c, px - Math.floor(w / 2) + (j === 0 || j === hh - 1 ? 1 : 0), GROUND - 1 - j, w - (j === 0 || j === hh - 1 ? 2 : 0), 1, j === hh - 1 ? 0xffc0d0 : 0xf0a0b8)
  put(c, px - 2, GROUND - Math.ceil(hh / 2), 0x2a2a30); put(c, px + 2, GROUND - Math.ceil(hh / 2), 0x2a2a30)
  const yb = GROUND - hh - 1
  rect(c, px - 10, yb, 21, 1, 0x8a919b); rect(c, px - 10, yb - 1, 21, 1, 0xb0b6c0)
  for (let y = 0; y < yb - 1; y++) put(c, px, y, 0x6b7086)
  clawd(c, m.t, 'crank', px - 31)
  ground(c)
}

// Sublimating: an ice block turns straight to vapour over a hot plate, then frosts back in
const sublimating: Draw = (c, m) => {
  const bx = spot(c.W, 0.6)
  const T = m.t % 6800
  const p = Math.min(1, T / 5400)
  const grow = T > 6100 ? ease((T - 6100) / 700) : 0
  const f = T > 6100 ? grow : 1 - p
  rect(c, bx - 6, GROUND - 2, 13, 1, 0x6b7086)
  rect(c, bx - 5, GROUND - 1, 11, 1, mix(0xff4b3e, 0xffd54f, wave(m.t, 500)))
  const w = Math.round(7 * f), h = Math.round(5 * f)
  rect(c, bx - Math.floor(w / 2), GROUND - 2 - h, w, h, 0xbfe0ff)
  if (h) rect(c, bx - Math.floor(w / 2), GROUND - 2 - h, w, 1, 0xffffff)
  if (T < 6100) for (let k = 0; k < 12; k++) {
    const a = ((m.t / 1100) + k / 12) % 1
    const spread = 0.4 + a * 2
    put(c, bx + Math.sin(k * 7 + a * 5) * 3 * spread, GROUND - 3 - h - a * 9, mix(0xcfe8ff, BG, a))
  }
  clawd(c, m.t, 'stand', bx - 25)
  ground(c)
}

// Thinking: a thought bubble cycles through ellipsis, a question, a gear, a heart and a tick
const ICONS: [string[], number][] = [
  [['ooo.', '..o.', '.o..', '....', '.o..'], 0x4fa3d9],
  [['..o..', '.ooo.', 'oo.oo', '.ooo.', '..o..'], 0xb0b6c0],
  [['.o.o.', 'ooooo', 'ooooo', '.ooo.', '..o..'], 0xd94f6a],
  [['....o', '...o.', 'o.o..', '.o...', '.....'], 0x6ad94f],
]
const thinking: Draw = (c, m) => {
  const hx = spot(c.W, 0.4) - 7
  clawd(c, m.t, 'stand', hx)
  const bob = Math.floor(m.t / 600) % 2
  const bx = hx + 12
  rect(c, bx, bob, 15, 7, 0xdfe3ee); rect(c, bx + 1, bob - 1, 13, 9, 0xdfe3ee)
  put(c, bx - 1, bob + 7, 0xdfe3ee); put(c, bx - 2, bob + 8, 0xdfe3ee)
  const T = m.t % 6400
  const slot = Math.floor(T / 1600)
  if (T % 1600 < 500) for (let k = 0; k < Math.floor(((T % 1600) / 500) * 3.9); k++) put(c, bx + 4 + k * 3, bob + 3, 0x5e6478)
  else { const [art, col] = ICONS[slot]!; sprite(c, art, { o: col }, bx + 5, bob + 1) }
  put(c, hx + 12, 8, 0xc8ccd8); put(c, hx + 13, 7, 0xc8ccd8)
  ground(c)
}

// Transmogrifying: Clawd poofs into a frog, a pumpkin, a mouse, and back
const FROG = ['.ww...ww.', 'wkw...wkw', 'ggggggggg', 'ggggggggg', 'g.g...g.g']
const PUMPKIN = ['....s....', '.ooooooo.', 'ooyoooyoo', 'ooooyoooo', 'ooyyyyyoo', '.ooooooo.']
const MOUSE = ['.gg......', 'gGgggg...', 'ggggggkg.', '.ggggggg.', '.g.g.g.gp']
const transmogrifying: Draw = (c, m) => {
  const mx = spot(c.W, 0.5) - 7
  const T = m.t % 2000
  const form = Math.floor(m.t / 2000) % 4
  if (form === 0) clawd(c, m.t, 'stand', mx)
  else if (form === 1) sprite(c, FROG, { w: 0xf4f4f4, k: 0x2a2a30, g: 0x5aa83a }, mx + 2, GROUND - 5 - (Math.floor(m.t / 300) % 2 ? 2 : 0))
  else if (form === 2) sprite(c, PUMPKIN, { s: 0x4f8a3a, o: 0xff8c2a, y: 0xffe066 }, mx + 2, GROUND - 6)
  else sprite(c, MOUSE, { g: 0xa0a4b0, G: 0x70747f, k: 0x2a2a30, p: 0xe88aa0 }, mx + 2, GROUND - 5)
  if (T < 420) {
    const r = (T / 420) * 11
    for (let k = 0; k < 18; k++) {
      const a = k * 0.35 + Math.floor(m.t / 2000) * 2
      put(c, mx + 7 + Math.cos(a) * r, 11 + Math.sin(a) * r * 0.55, mix(k % 2 ? 0xd8dcea : 0xb0b6c8, BG, T / 520))
    }
    for (let k = 0; k < 6; k++) put(c, mx + 7 + Math.cos(k * 1.05 + 0.4) * (r + 2), 11 + Math.sin(k * 1.05 + 0.4) * (r + 2) * 0.55, SPARKS[k % 4]!)
  }
  ground(c)
}

// Vibing: headphones on, head nodding, an equaliser bouncing in neon behind
const vibing: Draw = (c, m, glyphs) => {
  const hx = spot(c.W, 0.35) - 7
  const bob = Math.floor(m.t / 500) % 2
  clawd(c, m.t, 'stand', hx, 1, bob)
  const top = CLAWD_TOP - bob
  rect(c, hx + 3, top - 2, 8, 1, 0x2e2a40); rect(c, hx + 2, top - 1, 1, 2, 0x2e2a40); rect(c, hx + 11, top - 1, 1, 2, 0x2e2a40)
  rect(c, hx + 1, top + 1, 2, 3, 0xd94fa8); rect(c, hx + 11, top + 1, 2, 3, 0xd94fa8)
  const ex = hx + 20
  for (let i = 0; i < 9; i++) {
    const h = 1 + Math.floor(rnd(i, Math.floor(m.t / 170)) * 9)
    for (let y = 0; y < h; y++) rect(c, ex + i * 3, GROUND - 1 - y, 2, 1, mix(0x9a4fd9, 0xff4fa8, y / 9))
  }
  for (let k = 0; k < 2; k++) {
    const a = (m.t / 900 + k / 2) % 1
    glyphs.push({ x: hx + 15 + k * 3, row: Math.max(0, 3 - Math.floor(a * 4)), ch: k ? '♫' : '♪', fg: mix(0xff9ad0, BG, a * 0.7) })
  }
  ground(c, 0x2e2a40)
}

// Whirring: a propeller beanie lifts Clawd off the ground in a downdraft
const whirring: Draw = (c, m) => {
  const hx = spot(c.W, 0.5) - 7
  const lift = 2 + Math.round(wave(m.t, 1800) * 3)
  clawd(c, m.t, 'float', hx, 1, lift)
  const top = CLAWD_TOP - lift
  rect(c, hx + 4, top - 1, 6, 1, 0xd94f4f); rect(c, hx + 6, top - 2, 2, 1, 0x4fa3d9); put(c, hx + 7, top - 3, 0x8a919b)
  const l = Math.round(Math.cos(m.t / 50) * 6)
  const sweep = Math.min(Math.abs(l), 6)
  for (let i = -sweep; i <= sweep; i++) put(c, hx + 7 + i, top - 3 + (i % 2 ? 0 : 1) * 0, Math.abs(i) > 3 ? mix(0xdfe7ff, BG, 0.5) : 0xdfe7ff)
  for (let k = 0; k < 7; k++) {
    const a = ((m.t / 220) + k / 7) % 1
    put(c, hx + 3 + k + (k < 3 ? -1 : 1) * a * 5, CLAWD_TOP + 6 - lift + a * (lift + 1), mix(0xdfe7ff, BG, a))
  }
  for (let k = 0; k < 4; k++) {
    const a = ((m.t / 260) + k / 4) % 1
    put(c, hx + 7 - a * 18 - 3, GROUND - 1, mix(0x9aa0b0, BG, a)); put(c, hx + 7 + a * 18 + 3, GROUND - 1, mix(0x9aa0b0, BG, a))
  }
  ground(c)
}

// Zigzagging: Clawd bounds up and down a dotted zigzag track that runs the length of the strip
const zigzagging: Draw = (c, m) => {
  const P = 24
  const x = ((m.t * 0.034) % (c.W + 30)) - 16
  const y = (tx: number) => GROUND - Math.round(tri(tx, P) * 8)
  for (let tx = 0; tx < c.W; tx++) if (tx % 2 === 0) put(c, tx, y(tx - 7) - 5 < 0 ? 0 : y(tx - 7) - 5, 0x3a3f58)
  for (let tx = Math.max(0, Math.floor(x) - 24); tx <= x + 7; tx++) put(c, tx, y(tx - 7) - 5, mix(SPARKS[Math.floor(tx / 4) % 4]!, BG, ((x + 7 - tx) / 24) * 0.8))
  clawd(c, m.t, 'walk', x, 1, Math.round(tri(x, P) * 8))
}

export const SCENES: Record<string, Draw> = {
  actualizing, billowing, bootstrapping, caramelizing, churning, computing, creating, determining, ebbing, fermenting,
  flummoxing, gallivanting, gitifying, herding, improvising, julienning, manifesting, moseying, newspapering, osmosing,
  polishing, prestidigitating, quantumizing, ruminating, shenaniganing, smooshing, sublimating, thinking, transmogrifying,
  vibing, whirring, zigzagging,
}
