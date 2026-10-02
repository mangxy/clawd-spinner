import { CLAWD_TOP, GROUND, PH, SPARKS, START, WALK, along, clawd, gear, ground, mix, put, rect, rnd, spot, sprite, wave, type Canvas, type Draw, type Pose } from '../acts'

const WHITE = 0xf4f4f4
const WOOD = 0x7a4a24
const tk = (t: number, ms: number) => Math.floor(t / ms)
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const lerp = (a: number, b: number, k: number) => a + (b - a) * k
const line = (c: Canvas, x0: number, y0: number, x1: number, y1: number, col: number) => {
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))))
  for (let i = 0; i <= n; i++) put(c, lerp(x0, x1, i / n), lerp(y0, y1, i / n), col)
}
const disc = (c: Canvas, cx: number, cy: number, r: number, col: number) => {
  for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (i * i + j * j <= r * r + 1) put(c, cx + i, cy + j, col)
}

// ------------------------------------------------------------------ baking: a loaf rises in the oven

const baking: Draw = (c, m, g) => {
  const ox = spot(c.W, 0.62)
  const p = (m.t % 6400) / 6400
  rect(c, ox, GROUND - 9, 13, 9, 0x5a5f6b); rect(c, ox, GROUND - 9, 13, 1, 0x8a919b)
  for (const k of [2, 6, 10]) put(c, ox + k, GROUND - 8, 0xd9c84f)
  rect(c, ox + 2, GROUND - 7, 9, 6, 0x1a1410)
  const ins = clamp(p < 0.12 ? p / 0.12 : p > 0.88 ? (1 - p) / 0.12 : 1)
  const bake = clamp((p - 0.15) / 0.65)
  if (ins === 1) rect(c, ox + 2, GROUND - 2, 9, 1, mix(0xff6a1a, 0xffb347, wave(m.t, 500)))
  const tx = Math.round(ox - 5 + ins * 8)
  rect(c, tx, 12, 7, 1, 0x9aa0ab)
  const crust = mix(0xf3dfa8, 0xb8742a, bake)
  for (let k = 0; k < 1 + Math.floor(bake * 3.2); k++) {
    const w = Math.max(2, 6 - 2 * k)
    rect(c, tx + 1 + (6 - w) / 2, 11 - k, w, 1, crust)
  }
  const { hand } = clawd(c, m.t, 'carry', ox - 17)
  rect(c, ox - 14, CLAWD_TOP - 2, 8, 2, WHITE); rect(c, ox - 13, CLAWD_TOP - 3, 6, 1, WHITE)
  void hand
  if (bake > 0.4) g.push({ x: ox + 6, row: 2 - (tk(m.t, 450) % 3), ch: '~', fg: 0xc8ccd8 })
  ground(c)
}

// ------------------------------------------------------------------ bloviating: ranting from a soapbox

const bloviating: Draw = (c, m, g) => {
  const bx = spot(c.W, 0.4)
  rect(c, bx, GROUND - 3, 12, 3, WOOD); rect(c, bx, GROUND - 3, 12, 1, 0x9a6a3a)
  clawd(c, m.t, 'hammer', bx - 1, 1, 3)
  for (let k = 0; k < 3; k++) {  // sound arcs
    const r = ((m.t / 90) + k * 4) % 12
    for (let a = -0.9; a <= 0.9; a += 0.45) put(c, bx + 14 + Math.cos(a) * r, 8 + Math.sin(a) * r * 0.8, mix(0xffe066, 0x1a1c24, r / 12))
  }
  for (let k = 0; k < 3; k++) {
    const n = tk(m.t + k * 170, 500)
    g.push({ x: bx + 17 + k * 4, row: k % 2, ch: '!?#@'[Math.floor(rnd(n, k) * 4)]!, fg: SPARKS[(n + k) % 4]! })
  }
  ground(c)
}

// ------------------------------------------------------------------ bunning: buns ride a conveyor into a bag

const bunning: Draw = (c, m) => {
  clawd(c, m.t, 'carry', START)
  rect(c, 0, 13, c.W, 2, 0x3a3d4a)
  for (let x = 0; x < c.W; x++) if ((x + tk(m.t, 70)) % 4 === 0) put(c, x, 13, 0x6b7086)
  const end = c.W - 12
  for (let k = 0; k < Math.ceil((end - 18) / 14) + 1; k++) {
    const bx = 18 + ((m.t * 0.02 + k * 14) % (end - 18))
    sprite(c, ['.sss.', 'bbbbb'], { s: 0xe6b86a, b: 0xd49a4a }, bx, 11)
    put(c, bx + 1, 11, 0xfff3d6); put(c, bx + 3, 11, 0xfff3d6)
  }
  rect(c, c.W - 9, 8, 8, 7, 0xb08d57); rect(c, c.W - 9, 8, 8, 1, 0x8a6a3a)
  rect(c, 3, CLAWD_TOP - 1, 8, 1, 0x7fb5ff); rect(c, 4, CLAWD_TOP - 2, 6, 1, 0x7fb5ff)
  ground(c)
}

// ------------------------------------------------------------------ catapulting: arm snaps over and lobs a ball

const catapulting: Draw = (c, m) => {
  const cx = spot(c.W, 0.4), py = 9, L = 8
  const p = (m.t % 5200) / 5200
  const lx = Math.min(c.W - 6, cx + Math.round(c.W * 0.4))
  const swing = clamp((p - 0.45) / 0.1)
  const a = ((215 - swing * 175) * Math.PI) / 180
  const dx = Math.cos(a), dy = -Math.sin(a)
  rect(c, cx - 6, GROUND - 1, 13, 1, WOOD); rect(c, cx - 1, py, 2, 5, WOOD)
  put(c, cx - 5, GROUND, 0x2a2a30); put(c, cx + 5, GROUND, 0x2a2a30)
  for (let s = -3; s <= L; s++) put(c, cx + dx * s, py + dy * s, 0x9a6a3a)
  rect(c, cx - dx * 3 - 1, py - dy * 3 - 1, 2, 2, 0x55555f)
  const cupx = cx + dx * L, cupy = py + dy * L
  rect(c, cupx - 1, cupy, 3, 1, 0x7a4a24)
  let bx = cupx, by = cupy - 1
  if (p > 0.55) {
    const u = clamp((p - 0.55) / 0.3)
    bx = lerp(cx + 6, lx, u)
    by = lerp(3.9, 13, u) - 6.5 * 4 * u * (1 - u)
  }
  if (p < 0.97) {
    rect(c, bx - 1, by - 1, 2, 2, 0x3a3a42); put(c, bx - 1, by - 1, 0x8a919b)
  }
  if (p > 0.85 && p < 0.97) for (let k = 0; k < 6; k++) {  // dust at the landing
    const r = (p - 0.85) * 40
    put(c, lx + Math.cos(k * 1.05) * r, 13 - Math.abs(Math.sin(k * 1.05)) * r * 0.6, 0x9a8a70)
  }
  clawd(c, m.t, p < 0.5 ? 'carry' : 'dance', Math.max(0, cx - 22))
  ground(c, 0x4a3a2a)
}

// ------------------------------------------------------------------ coalescing: specks drift together into a droplet

const coalescing: Draw = (c, m) => {
  const cx = spot(c.W, 0.55), cy = 7
  const p = (m.t % 6000) / 6000
  const g = clamp(p / 0.6), e = g * g * (3 - 2 * g)
  if (p < 0.62) for (let k = 0; k < 16; k++) {
    const sx = 20 + rnd(k, 1) * (c.W - 34), sy = 1 + rnd(k, 2) * 12
    const sw = (1 - e) * 3 * Math.sin(m.t / 300 + k)
    put(c, lerp(sx, cx, e) + sw, lerp(sy, cy, e) + sw * 0.5, mix(0x4fa3d9, 0xe8f6ff, e))
  }
  if (p >= 0.55 && p < 0.9) {
    const r = 1 + Math.round(clamp((p - 0.55) / 0.35) * 3)
    disc(c, cx, cy, r, 0x4fa3d9)
    put(c, cx - 1, cy - 1, 0xe8f6ff); put(c, cx, cy - r + 1, 0x9fd4f2)
  }
  if (p >= 0.9) for (let k = 0; k < 12; k++) {
    const r = (p - 0.9) * 90
    put(c, cx + Math.cos(k * 0.52) * r * 1.5, cy + Math.sin(k * 0.52) * r * 0.8, mix(0xe8f6ff, 0x1a1c24, (p - 0.9) * 8))
  }
  clawd(c, m.t, 'cast', START)
  ground(c)
}

// ------------------------------------------------------------------ considering: a balance weighs two options

const considering: Draw = (c, m, g) => {
  const sx = spot(c.W, 0.55)
  rect(c, sx, 4, 1, GROUND - 4, 0x8a919b); rect(c, sx - 3, GROUND - 1, 7, 1, 0x8a919b)
  const tilt = Math.round(Math.sin(m.t / 1100) * 2.6)
  for (let i = -8; i <= 8; i++) put(c, sx + i, 4 - Math.round((i * tilt) / 8), 0xd9c84f)
  put(c, sx, 3, 0xd9c84f)
  for (const side of [-1, 1]) {
    const ex = sx + side * 8, ey = 4 - side * tilt
    line(c, ex, ey, ex - 3, ey + 5, 0x9aa0b0); line(c, ex, ey, ex + 3, ey + 5, 0x9aa0b0)
    rect(c, ex - 3, ey + 5, 7, 1, 0xd9c84f)
    if (side < 0) rect(c, ex - 1, ey + 3, 3, 2, 0xd94f4f)
    else disc(c, ex, ey + 3, 1, 0x4fa3d9)
  }
  const x = Math.max(0, sx - 25)
  clawd(c, m.t, 'stand', x)
  g.push({ x: x + 7, row: 1, ch: tk(m.t, 1400) % 2 ? '?' : '!', fg: 0xffe066 })
  ground(c)
}

// ------------------------------------------------------------------ crystallizing: ice crystals grow from the floor

const crystallizing: Draw = (c, m) => {
  const xs = [0.45, 0.55, 0.65, 0.76, 0.86].map(k => spot(c.W, k) + 6)
  for (const [i, bx] of xs.entries()) {
    const grow = ((m.t / 5500) + i * 0.21) % 1
    const h = grow < 0.8 ? 1 + Math.floor((grow / 0.8) * 8) : 9
    for (let j = 0; j < h; j++) {
      const y = GROUND - h + j
      if (j === 0) put(c, bx, y, 0xdff6ff)
      else { put(c, bx - 1, y, 0xbfeaff); put(c, bx, y, 0x7cc4f2); put(c, bx + 1, y, 0x4a8fc4) }
    }
    if (rnd(i, tk(m.t, 160)) > 0.8) put(c, bx - 1 + Math.floor(rnd(i + 4, tk(m.t, 160)) * 3), GROUND - 1 - Math.floor(rnd(i + 8, tk(m.t, 160)) * h), WHITE)
  }
  const { hand } = clawd(c, m.t, 'hammer', Math.max(0, xs[0]! - 20))
  rect(c, hand[0] + 1, hand[1] - (m.t % 700 < 450 ? 2 : 0), 2, 1, 0x8a919b)
  ground(c, 0x4a5a70)
}

// ------------------------------------------------------------------ discombobulating: dizzy lurching, stars round the head

const discombobulating: Draw = (c, m, g) => {
  const cx = spot(c.W, 0.5) + Math.round(Math.sin(m.t / 700) * 12 + Math.sin(m.t / 290) * 4)
  clawd(c, m.t, 'walk', cx, Math.sin(m.t / 430) > 0 ? 1 : -1, tk(m.t, 260) % 3 === 0 ? 1 : 0)
  for (let k = 0; k < 3; k++) {
    const a = m.t / 180 + k * 2.1
    put(c, cx + 7 + Math.cos(a) * 7, CLAWD_TOP - 2 + Math.sin(a) * 1.5, 0xffe066)
  }
  const n = tk(m.t, 400)
  g.push({ x: cx + 7 + Math.round(rnd(n) * 6 - 3), row: 2 - (n % 2), ch: '@?~'[n % 3]!, fg: SPARKS[n % 4]! })
  for (let x = 0; x < c.W; x++) put(c, x, GROUND - (Math.sin((x + m.t / 50) / 4) > 0.85 ? 1 : 0), 0x2a2d36)
}

// ------------------------------------------------------------------ elucidating: a diagram chalked out on a board

const elucidating: Draw = (c, m) => {
  const bx = spot(c.W, 0.55)
  rect(c, bx - 2, 0, 26, 12, WOOD); rect(c, bx - 1, 1, 24, 10, 0x2f4a3a)
  const pts: [number, number][] = []
  const box = (x: number, y: number, w: number, h: number) => {
    for (let i = 0; i < w; i++) pts.push([x + i, y], [x + i, y + h - 1])
    for (let j = 1; j < h - 1; j++) pts.push([x, y + j], [x + w - 1, y + j])
  }
  box(bx, 3, 6, 5); for (let i = 6; i < 9; i++) pts.push([bx + i, 5]); box(bx + 9, 3, 6, 5)
  for (let i = 3; i < 15; i++) pts.push([bx + i, 9])
  const lt = m.t % 7600
  const n = Math.floor(clamp(lt / 5000) * pts.length)
  pts.slice(0, n).forEach(([x, y]) => put(c, x, y, 0xdfe7ff))
  const last = pts[Math.max(0, n - 1)]!
  put(c, last[0], last[1], 0xffffff)
  if (lt > 5000 && lt < 7000) sprite(c, ['.yyy.', 'yyyyy', 'yyyyy', '.yyy.', '..g..'], { y: 0xffe066, g: 0x9aa0b0 }, bx + 16, 3)
  const x = Math.max(0, bx - 20)
  const { hand } = clawd(c, m.t, 'carry', x)
  const tip = lt < 5000 ? last : [bx + 18, 5]
  line(c, hand[0] + 1, hand[1], tip[0]! - 1, tip[1]! + 1, 0xb08d57)
  rect(c, x + 3, CLAWD_TOP + 1, 3, 1, 0x1a1410); rect(c, x + 8, CLAWD_TOP + 1, 3, 1, 0x1a1410)
  ground(c)
}

// ------------------------------------------------------------------ finagling: the shell game

const finagling: Draw = (c, m) => {
  const tx = spot(c.W, 0.5) + 8
  rect(c, tx - 14, 12, 29, 1, WOOD); rect(c, tx - 12, 13, 1, 2, WOOD); rect(c, tx + 12, 13, 1, 2, WOOD)
  const lt = m.t % 9000, T0 = 1500, D = 650
  const swaps = [[0, 1], [1, 2], [0, 2], [1, 2], [0, 1], [0, 2]] as const
  const slot = [0, 1, 2]
  const n = Math.floor(clamp((lt - T0) / (D * swaps.length)) * swaps.length)
  for (let k = 0; k < n; k++) { const [a, b] = swaps[k]!; const t = slot[a]!; slot[a] = slot[b]!; slot[b] = t }
  const xOf = (s: number) => tx - 11 + s * 9
  const pos = slot.map(s => ({ x: xOf(s), y: 0 }))
  if (lt >= T0 && lt < T0 + D * swaps.length) {
    const [a, b] = swaps[n]!
    const f = (lt - T0 - n * D) / D
    pos[a] = { x: lerp(xOf(slot[a]!), xOf(slot[b]!), f), y: Math.round(Math.sin(f * Math.PI) * 2) }
    pos[b] = { x: lerp(xOf(slot[b]!), xOf(slot[a]!), f), y: -Math.round(Math.sin(f * Math.PI) * 1) }
  }
  const lifted = lt < 1000 || lt > 7400
  disc(c, Math.round(pos[1]!.x) + 2, 11, 0, 0xffd54f)
  for (const [i, p] of pos.entries()) {
    const up = i === 1 && lifted ? 3 : 0
    sprite(c, ['.rrr.', 'rwwwr', 'rrrrr'], { r: 0xd94f4f, w: 0xf4f4f4 }, Math.round(p.x), 9 - p.y - up)
  }
  const { hand } = clawd(c, m.t, 'carry', START)
  rect(c, 5, CLAWD_TOP - 1, 10, 1, 0x2a2a30); rect(c, 7, CLAWD_TOP - 3, 6, 2, 0x3a3a42); rect(c, 7, CLAWD_TOP - 2, 6, 1, 0xd94f4f)
  rect(c, 6, CLAWD_TOP + 1, 3, 1, 0x1a1410); rect(c, 11, CLAWD_TOP + 1, 3, 1, 0x1a1410)
  void hand
  ground(c)
}

// ------------------------------------------------------------------ forging: a blade is hammered, quenched and held up

const forging: Draw = (c, m) => {
  const ax = spot(c.W, 0.45)
  const lt = m.t % 6400
  sprite(c, ['aaaaaaa', '.aaaaa.', '..aaa..', '.aaaaa.'], { a: 0x55555f }, ax - 3, GROUND - 4)
  const bucket = ax + 11
  rect(c, bucket, GROUND - 4, 5, 4, 0x6b7086); rect(c, bucket, GROUND - 4, 5, 1, 0x2f6fa8)
  const hits = Math.min(10, Math.floor(lt / 450))
  const len = 4 + hits
  const heat = clamp(1 - (lt % 450) / 900 * 0.5)
  const hot = mix(0xff4b3e, 0xffe9a0, heat)
  const steel = 0xc8d0dc
  if (lt < 4500) rect(c, ax - 3, GROUND - 5, len, 1, hot)
  else if (lt < 5300) {  // dunked in the bucket
    rect(c, bucket + 2, 3, 1, 10, mix(hot, steel, (lt - 4500) / 800))
    for (let k = 0; k < 4; k++) put(c, bucket + 1 + (k % 3) + Math.sin(m.t / 90 + k), 3 - ((m.t / 60 + k * 3) % 4), 0xc8ccd8)
  } else {  // held up, a glint running along it
    rect(c, ax - 3, 2, 1, 12, steel); put(c, ax - 3, 2 + Math.floor(((lt - 5300) / 1100) * 11), WHITE)
    put(c, ax - 4, 8, 0xd9c84f); put(c, ax - 2, 8, 0xd9c84f)
  }
  const down = lt < 4500 && m.t % 700 >= 450
  const { hand } = clawd(c, m.t, lt < 4500 ? 'hammer' : 'dance', ax - 17)
  if (lt < 4500) {
    rect(c, hand[0] + 1, hand[1] - (down ? 0 : 2), 2, 2, 0x8a919b)
    if (down) for (let s = 0; s < 5; s++) put(c, ax + Math.cos(s * 1.3) * 4, GROUND - 6 - Math.abs(Math.sin(s * 1.3)) * 4, s % 2 ? 0xffd54f : 0xff8c2a)
  }
  ground(c)
}

// ------------------------------------------------------------------ garnishing: herbs, tomatoes and lemon on a plate

const garnishing: Draw = (c, m) => {
  const tx = spot(c.W, 0.62)
  const p = (m.t % 7000) / 7000
  rect(c, tx, 13, 16, 2, 0x9a6a3a)
  rect(c, tx + 1, 12, 13, 1, WHITE)
  rect(c, tx + 3, 11, 9, 1, 0xf0d27a); rect(c, tx + 4, 10, 7, 1, 0xe6c060)
  for (let i = 0; i < 4; i++) put(c, tx + 4 + i * 2, 11, 0xd49a4a)
  const herbs = [[5, 9], [7, 9], [9, 9], [6, 10], [8, 10], [10, 10]] as const
  for (const [i, [dx, dy]] of herbs.entries()) if (p > 0.1 + i * 0.05) put(c, tx + dx, dy, 0x4f9a3a)
  if (p > 0.45) { put(c, tx + 6, 9, 0xd94f4f); put(c, tx + 9, 9, 0xd94f4f); put(c, tx + 6, 8, 0xd94f4f) }
  if (p > 0.65) sprite(c, ['yyy', '.y.'], { y: 0xffe066 }, tx + 12, 11)
  if (p > 0.9 && tk(m.t, 120) % 2) put(c, tx + 8, 7, WHITE)
  const x = tx - 20
  rect(c, x + 2, 13, 10, 1, 0x7a4a24); put(c, x + 2, 14, 0x7a4a24); put(c, x + 11, 14, 0x7a4a24)
  const { hand } = clawd(c, m.t, 'umbrella', x, 1, 2)
  rect(c, x + 4, CLAWD_TOP - 5, 6, 3, WHITE)  // chef's hat: on top of the head, which Clawd lifts to CLAWD_TOP - 2
  if (p > 0.08 && p < 0.42) for (let k = 0; k < 4; k++) {
    const life = ((m.t / 350) + k * 0.25) % 1
    put(c, hand[0] + 1 + life * 9, hand[1] + life * life * 5, k % 2 ? 0x4f9a3a : 0x6ab84f)
  }
  ground(c)
}

// ------------------------------------------------------------------ gusting: a gale: leaves, a snapping flag, a scarf

const gusting: Draw = (c, m) => {
  const gust = wave(m.t, 2600)
  const fx = spot(c.W, 0.78)
  rect(c, fx, 3, 1, GROUND - 3, 0x8a919b)
  for (let i = 1; i <= 7; i++) for (let j = 0; j < 3; j++) put(c, fx + i, 3 + j + Math.round(Math.sin(m.t / 120 - i * 0.7) * (1 + gust)), j === 1 ? WHITE : 0xd94f4f)
  for (let k = 0; k < 5; k++) {
    const wx = (m.t / (10 + k * 2) + k * 41) % (c.W + 24) - 12
    rect(c, wx, 1 + k * 3, 6 + (k % 3) * 2, 1, mix(0x9aa0b0, 0x1a1c24, 0.35))
  }
  const x = spot(c.W, 0.3) - Math.round(gust * 2)
  clawd(c, m.t, 'walk', x, -1)
  for (let i = 0; i < 7; i++) put(c, x + 12 + i, CLAWD_TOP + 3 + Math.round(Math.sin(m.t / 110 - i * 0.9) * (1 + gust)), i % 2 ? 0x4f9a3a : 0xd94f4f)
  for (let k = 0; k < 7; k++) {
    const lx = (m.t * (0.04 + rnd(k, 5) * 0.04) + rnd(k, 1) * c.W) % (c.W + 10) - 5
    put(c, lx, 4 + rnd(k, 2) * 8 + Math.sin(m.t / 200 + k) * 2, [0xe67e22, 0xffb22e, 0x8fb04f][k % 3]!)
  }
  for (let k = 0; k < c.W; k += 9) put(c, k + 2, GROUND - 1, 0x3d5a3a)
  ground(c, 0x4a3a2a)
}

// ------------------------------------------------------------------ hullaballooing: floating off under a bunch of balloons

const hullaballooing: Draw = (c, m) => {
  for (let k = 0; k < 24; k++) {
    const y = (rnd(k, 2) * 15 + m.t / (40 + rnd(k, 3) * 40)) % 15
    put(c, rnd(k, 1) * c.W + Math.sin(m.t / 400 + k), y, [0xd94f8a, 0x4fa3d9, 0xffd54f, 0x6ad94f][k % 4]!)
  }
  const x = ((m.t * 0.018) % (c.W + 24)) - 16
  const lift = 3 + Math.round(wave(m.t, 1800) * 2)
  const { hand } = clawd(c, m.t, 'umbrella', x, 1, lift)
  const top = CLAWD_TOP - lift
  rect(c, x + 6, top - 3, 2, 1, 0xd94f8a); rect(c, x + 5, top - 2, 4, 1, 0xffd54f); rect(c, x + 4, top - 1, 6, 1, 0xd94f8a)
  const cols = [0xd94f4f, 0xffd54f, 0x4fa3d9, 0xd94f8a]
  cols.forEach((col, k) => {
    const bx = hand[0] - 5 + k * 3 + Math.round(Math.sin(m.t / 700 + k)), by = k % 2
    line(c, hand[0], hand[1], bx + 1, by + 3, 0xb0b0b8)
    rect(c, bx, by, 3, 3, col); put(c, bx, by, 0); put(c, bx + 2, by, 0)
    put(c, bx + 1, by, mix(col, WHITE, 0.5))
  })
  ground(c)
}

// ------------------------------------------------------------------ inferring: a detective follows the footprints

const inferring: Draw = (c, m, g) => {
  const xs = [START, Math.round(c.W * 0.3), Math.round(c.W * 0.55), Math.max(START, c.W - 34)]
  const at = along(xs.map((x, i) => ({ x, stay: i === 3 ? 1800 : 1000, pose: 'carry' as Pose })), m.t, 'carry')
  ground(c, 0x5a4a3a)
  for (let x = 20; x < c.W - 6; x += 6) put(c, x, GROUND, 0x9a8a6a)
  const key = xs[3]! + 20
  if (key < c.W - 2) { rect(c, key, GROUND - 2, 2, 2, 0xffd54f); put(c, key + 2, GROUND - 2, 0xffd54f) }
  if (at.stop === 3 && at.still && tk(m.t, 160) % 2) put(c, key + 1, GROUND - 4, WHITE)
  const { hand } = clawd(c, m.t, at.pose, at.x, at.facing)
  const gx = hand[0] + at.facing * 3, gy = hand[1] + 1
  for (let a = 0; a < 12; a++) put(c, gx + Math.cos((a / 12) * 6.283) * 2.4, gy + Math.sin((a / 12) * 6.283) * 2.4, 0xb08d57)
  put(c, gx - at.facing, gy - 1, 0xdff6ff)
  line(c, gx + at.facing * 2, gy + 2, gx + at.facing * 4, gy + 4, 0x7a4a24)
  const ox = Math.round(at.x)
  rect(c, ox + 3, CLAWD_TOP - 1, 8, 1, 0x7a5a3a); rect(c, ox + 2, CLAWD_TOP, 2, 1, 0x7a5a3a); rect(c, ox + 10, CLAWD_TOP, 2, 1, 0x7a5a3a)
  if (at.still) g.push({ x: ox + 7, row: 1, ch: at.stop === 3 ? '!' : '?', fg: 0xffe066 })
}

// ------------------------------------------------------------------ kneading: pushing dough on a floured table

const kneading: Draw = (c, m) => {
  const tx = spot(c.W, 0.55)
  rect(c, tx, 13, 14, 1, 0x9a6a3a); put(c, tx + 1, 14, 0x9a6a3a); put(c, tx + 12, 14, 0x9a6a3a)
  const press = m.t % 700 >= 450
  const dough = 0xf3e3b0
  if (press) { rect(c, tx + 2, 12, 10, 1, dough); put(c, tx + 1, 12, 0xe0c88a); put(c, tx + 12, 12, 0xe0c88a) }
  else { rect(c, tx + 3, 11, 8, 2, dough); put(c, tx + 5, 11, 0xe0c88a); put(c, tx + 8, 12, 0xe0c88a) }
  for (let k = 0; k < 6; k++) if (rnd(k, tk(m.t, 300)) > 0.5) put(c, tx + 1 + k * 2, 13, WHITE)
  if (press) for (let k = 0; k < 4; k++) put(c, tx + 3 + k * 2 + ((m.t % 700) - 450) / 40 * (k % 2 ? 1 : -1), 11 - ((m.t % 700) - 450) / 60, WHITE)
  const x = tx - 8
  clawd(c, m.t, 'hammer', x)
  rect(c, x + 4, CLAWD_TOP + 3, 6, 2, WHITE)
  ground(c)
}

// ------------------------------------------------------------------ meandering: ambling over rolling hills

const hill = (x: number) => Math.max(0, Math.round(1.8 + 1.6 * Math.sin(x / 11)))

const meandering: Draw = (c, m) => {
  const sx = c.W * 0.78
  disc(c, sx, 3, 1, 0xffd54f)
  for (let k = 0; k < 2; k++) {
    const cxp = ((m.t * 0.006 + k * c.W * 0.5) % (c.W + 12)) - 6
    sprite(c, ['.cc.', 'cccc'], { c: 0xc8ccd8 }, cxp, 2 + k * 2)
  }
  for (let x = 0; x < c.W; x++) {
    const y0 = GROUND - hill(x)
    put(c, x, y0, 0x4f9a3a); rect(c, x, y0 + 1, 1, PH - y0 - 1, 0x3f6e3a)
    if (x % 11 === 4) put(c, x, y0 - 1, [0xd94f8a, 0xffe066, 0xdfe7ff][(x / 11 | 0) % 3]!)
  }
  const x = ((m.t * WALK * 0.7) % (c.W + 18)) - 16
  clawd(c, m.t, 'walk', x, 1, Math.max(hill(Math.round(x + 3)), hill(Math.round(x + 10))))
}

// ------------------------------------------------------------------ musing: dreamy night, a moon and sky lanterns

const musing: Draw = (c, m) => {
  for (let k = 0; k < c.W / 4; k++) {
    const twinkle = (tk(m.t, 450) + k) % 5
    if (twinkle) put(c, rnd(k, 1) * c.W, rnd(k, 2) * 11, twinkle === 1 ? 0x6a7090 : 0xdfe7ff)
  }
  sprite(c, ['.yyy.', 'yy...', 'yy...', 'yy...', '.yyy.'], { y: 0xf3e6a8 }, Math.round(c.W * 0.82), 1)
  const u = (m.t % 3500) / 3500
  if (u < 0.3) for (let i = 0; i < 5; i++) put(c, c.W * 0.7 - (u / 0.3) * 40 + i, (u / 0.3) * 9 - i * 0.6, mix(WHITE, 0x1a1c24, i / 5))
  for (let k = 0; k < 3; k++) {
    const r = ((m.t / 7000) + k * 0.33) % 1
    const lx = spot(c.W, 0.45 + k * 0.17) + Math.sin(m.t / 900 + k * 2) * 3, ly = GROUND - r * 18
    rect(c, lx, ly, 2, 3, 0xe67e22); put(c, lx, ly, 0xffd54f); put(c, lx + 1, ly, 0xffd54f)
    put(c, lx, ly - 1, mix(0xffd54f, 0x1a1c24, 0.5))
  }
  clawd(c, m.t, 'stand', spot(c.W, 0.2))
  ground(c, 0x2a3350)
}

// ------------------------------------------------------------------ nucleating: an atom's nucleus assembling, electrons whirling

const nucleating: Draw = (c, m) => {
  const cx = spot(c.W, 0.55), cy = 7
  const n = 1 + Math.floor(((m.t % 7000) / 7000) * 6)
  for (const [e, th] of [0, 0.45, -0.45].entries()) {
    for (let s = 0; s < 40; s++) {
      const a = (s / 40) * 6.283
      const ox = Math.cos(a) * 10, oy = Math.sin(a) * 3.3
      put(c, cx + ox * Math.cos(th) - oy * Math.sin(th), cy + ox * Math.sin(th) + oy * Math.cos(th), 0x2e3a5a)
    }
    for (let tr = 0; tr < 3; tr++) {
      const a = m.t / (550 + e * 170) + e * 2.1 - tr * 0.22
      const ox = Math.cos(a) * 10, oy = Math.sin(a) * 3.3
      put(c, cx + ox * Math.cos(th) - oy * Math.sin(th), cy + ox * Math.sin(th) + oy * Math.cos(th), mix(0x7fe8ff, 0x2e3a5a, tr / 3))
    }
  }
  for (let k = 0; k < n; k++) {
    const jx = Math.round(Math.sin(m.t / 120 + k * 2.3)), jy = Math.round(Math.cos(m.t / 140 + k))
    rect(c, cx - 1 + (k % 3) - 1 + jx * (k > 3 ? 1 : 0), cy - 1 + Math.floor(k / 3) + jy * 0, 2, 2, k % 2 ? 0xd94f4f : 0x4fa3d9)
  }
  clawd(c, m.t, 'stand', START)
  ground(c)
}

// ------------------------------------------------------------------ percolating: a coffee percolator, bubbling in its glass knob

const percolating: Draw = (c, m, g) => {
  const px = spot(c.W, 0.6)
  rect(c, px, 7, 8, 8, 0xb8bcc8); rect(c, px + 6, 7, 2, 8, 0x8a8fa0); rect(c, px + 1, 6, 6, 1, 0x8a919b)
  rect(c, px - 2, 8, 2, 1, 0xb8bcc8); put(c, px - 2, 7, 0xb8bcc8)
  rect(c, px + 8, 8, 1, 5, 0x3a3a42); put(c, px + 7, 8, 0x3a3a42); put(c, px + 7, 12, 0x3a3a42)
  rect(c, px + 2, 3, 4, 3, 0xcfe8f5)
  rect(c, px + 3, 4, 2, 2, 0x5a3a22)
  for (let k = 0; k < 3; k++) put(c, px + 3 + ((k + tk(m.t, 170)) % 2), 5 - ((m.t / 90 + k * 2) % 3), 0xa9743c)
  put(c, px + 2 + (tk(m.t, 130) % 4), 3, 0xdff6ff)
  const x = px - 20
  const { hand } = clawd(c, m.t, 'carry', x)
  rect(c, hand[0] + 1, 10, 3, 3, WHITE); rect(c, hand[0] + 2, 10, 1, 1, 0x5a3a22)
  put(c, px - 3, 8, 0x5a3a22); put(c, px - 3, 9, 0x5a3a22)
  for (let k = 0; k < 2; k++) g.push({ x: px + 3 + k * 2, row: 0 + ((tk(m.t, 350) + k) % 2), ch: '~', fg: 0xc8ccd8 })
  ground(c)
}

// ------------------------------------------------------------------ pondering: fishing, ripples, a leaping fish

const pondering: Draw = (c, m) => {
  const px0 = spot(c.W, 0.45)
  rect(c, px0, 12, c.W - px0 - 4, 3, 0x2f6fa8)
  for (let x = px0; x < c.W - 4; x++) if ((x + tk(m.t, 200)) % 5 === 0) put(c, x, 12, 0x5aa0d9)
  sprite(c, ['.ggg.', 'ggggg'], { g: 0x4f9a3a }, px0 + 20, 11)
  const x = px0 - 20
  const { hand } = clawd(c, m.t, 'carry', x)
  const hx = hand[0], bx = hx + 9
  line(c, hx + 1, 10, hx + 6, 5, 0x9a6a3a)
  line(c, hx + 6, 5, bx, 12, 0xdfe7ff)
  put(c, bx, 11 + (tk(m.t, 500) % 2 ? 0 : 0), 0xd94f4f); put(c, bx, 12, WHITE)
  const r = (m.t / 200) % 7
  for (const a of [-1, 1]) put(c, bx + a * (1 + r * 1.4), 12, mix(0xdfe7ff, 0x2f6fa8, r / 7))
  const u = (m.t % 4800) / 700
  if (u < 1) {
    const fx = px0 + 14 + u * 8, fy = 12 - Math.sin(u * Math.PI) * 7
    rect(c, fx, fy, 2, 1, 0xff9e3d); put(c, fx - 1, fy - (u > 0.5 ? 0 : 1), 0xd9743a)
  }
  ground(c)
}

// ------------------------------------------------------------------ proofing: dough rises under a watchful clock

const proofing: Draw = (c, m, g) => {
  const bx = spot(c.W, 0.6)
  const p = (m.t % 7000) / 7000
  const rise = clamp(p / 0.85)
  rect(c, bx, 12, 12, 1, 0x8fb5d9); rect(c, bx + 1, 13, 10, 1, 0x7aa0c8); rect(c, bx + 3, 14, 6, 1, 0x6f95b9)
  const h = 1 + Math.floor(rise * 4)
  for (let k = 0; k < h; k++) rect(c, bx + 1 + k, 11 - k, 10 - 2 * k, 1, 0xf3e3b0)
  put(c, bx - 1, 8, 0xd94f4f); put(c, bx + 12, 8, 0xd94f4f)
  disc(c, bx + 6, 3, 3, WHITE)
  const a = (m.t / 3500) * 6.283
  line(c, bx + 6, 3, bx + 6 + Math.sin(a) * 2.5, 3 - Math.cos(a) * 2.5, 0x2a2a30)
  put(c, bx + 6, 3, 0xd94f4f)
  const x = bx - 22
  clawd(c, m.t, 'stand', Math.max(0, x))
  for (let k = 0; k < 3; k++) g.push({ x: Math.max(0, x) + 15 + k * 2, row: 3 - ((tk(m.t, 500) + k) % 3), ch: 'z', fg: mix(0x9aa0b0, 0x1a1c24, k * 0.25) })
  ground(c)
}

// ------------------------------------------------------------------ razzmatazzing: jazz hands under the spotlight

const razzmatazzing: Draw = (c, m) => {
  const at = along([{ x: spot(c.W, 0.3), stay: 1300, pose: 'dance' }, { x: spot(c.W, 0.6), stay: 1300, pose: 'dance' }], m.t, 'dance')
  const cx = Math.round(at.x) + 7
  for (let y = 0; y < GROUND; y++) for (let x = Math.ceil(cx - 1 - y * 0.8); x <= cx + 1 + y * 0.8; x++) put(c, x, y, 0x23242e)
  for (let y = 0; y < GROUND; y++) for (let x = 0; x < 6; x++) {
    put(c, x, y, x % 2 ? 0x7c1822 : 0xa3202a)
    put(c, c.W - 1 - x, y, x % 2 ? 0x7c1822 : 0xa3202a)
  }
  for (let x = 0; x < c.W; x++) put(c, x, GROUND, [0xffd54f, 0xd94f8a, 0x4fa3d9][(Math.floor(x / 3) + tk(m.t, 250)) % 3]!)
  clawd(c, m.t, 'dance', at.x, at.facing)
  const y = CLAWD_TOP - (tk(m.t, 300) % 2)
  rect(c, at.x + 4, y - 3, 6, 3, 0x1a1410); rect(c, at.x + 4, y - 1, 6, 1, 0xd94f4f); rect(c, at.x + 3, y, 8, 1, 0x1a1410)
  for (let k = 0; k < 6; k++) {
    const n = tk(m.t + k * 90, 380)
    const sx = cx + (rnd(k, n) - 0.5) * 30, sy = 1 + rnd(k + 9, n) * 11
    const col = SPARKS[(k + n) % 4]!
    put(c, sx, sy, col); put(c, sx - 1, sy, mix(col, 0x1a1c24, 0.5)); put(c, sx + 1, sy, mix(col, 0x1a1c24, 0.5)); put(c, sx, sy - 1, mix(col, 0x1a1c24, 0.5))
  }
}

// ------------------------------------------------------------------ scampering: darting after a mouse in quick bursts

const scampering: Draw = (c, m) => {
  const cyc = 1400, D = 26, span = c.W + 36
  const ph = (m.t % cyc) / cyc
  const e = clamp(ph / 0.7)
  const dist = tk(m.t, cyc) * D + D * e * e * (3 - 2 * e)
  const x = (dist % span) - 18
  if (ph < 0.7) for (let k = 1; k <= 3; k++) rect(c, x - 3 * k, GROUND - 2 + (k % 2), 2, 1, mix(0xc8ccd8, 0x1a1c24, k / 4))
  for (let k = 0; k < 4; k++) if (ph > 0.05 && ph < 0.8) put(c, x - 4 - k * 2 - ph * 6, GROUND - 1 - ((k * 2) % 3), mix(0x9a8a70, 0x1a1c24, k / 4))
  clawd(c, m.t, 'walk', x)
  const mx = x + 30 + Math.round(Math.sin(m.t / 150) * 2)
  sprite(c, ['..e...', 'mmmmmn', tk(m.t, 90) % 2 ? '.l..l.' : '..ll..'], { m: 0xb0b0b8, e: 0xe88aa0, n: 0xe88aa0, l: 0x6a6a74 }, mx, GROUND - 3)
  for (let i = 1; i <= 3; i++) put(c, mx - i, GROUND - 2 - (i % 2 ? Math.round(Math.sin(m.t / 100 + i)) : 0), 0xe88aa0)
  ground(c, 0x2d4a2b)
}

// ------------------------------------------------------------------ simmering: a pot on a blue flame, stirred and steaming

const simmering: Draw = (c, m) => {
  const px = spot(c.W, 0.6)
  rect(c, px - 2, 13, 16, 2, 0x3a3d4a)
  for (let i = 0; i < 10; i++) {
    put(c, px + 1 + i, 12, 0x4fa3ff)
    if (rnd(i, tk(m.t, 120)) > 0.6) put(c, px + 1 + i, 11, 0xbfe0ff)
  }
  rect(c, px, 6, 12, 5, 0x8a919b); rect(c, px, 6, 12, 1, 0xb8bcc8); put(c, px - 1, 7, 0x3a3a42); put(c, px + 12, 7, 0x3a3a42)
  rect(c, px + 1, 5, 10, 1, 0xd9803a)
  for (let k = 0; k < 4; k++) if (rnd(k, tk(m.t, 260)) > 0.5) put(c, px + 2 + Math.floor(rnd(k + 9, tk(m.t, 260)) * 8), 4, 0xffb060)
  for (let k = 0; k < 3; k++) {
    const a = m.t / 500 + k * 2.1
    put(c, px + 6 + Math.cos(a) * 4, 5, k % 2 ? 0xe67e22 : 0x6ab84f)
  }
  for (let k = 0; k < 3; k++) {
    const life = ((m.t / 220) + k * 3) % 8
    put(c, px + 3 + k * 3 + Math.sin(life), 3 - life * 0.4, mix(0xc8ccd8, 0x1a1c24, life / 8))
  }
  const { hand } = clawd(c, m.t, 'crank', px - 16)
  line(c, hand[0], hand[1], px + 6 + Math.sin(m.t / 250) * 3, 5, 0xb08d57)
  ground(c)
}

// ------------------------------------------------------------------ spelunking: a headlamp beam through a dark cave

const spelunking: Draw = (c, m) => {
  const cx = spot(c.W, 0.3), hx = cx + 12, hy = CLAWD_TOP - 1
  const off = Math.floor(m.t * 0.012)
  for (let y = 0; y < PH; y++) for (let x = 0; x < c.W; x++) put(c, x, y, 0x14121a)
  for (let x = 0; x < c.W; x++) {
    const k = Math.floor((x + off) / 7), d = Math.abs(((x + off) % 7) - 3)
    const len = 2 + Math.floor(rnd(k, 2) * 5), ln = 1 + Math.floor(rnd(k, 3) * 4)
    for (let y = 0; y < 2; y++) put(c, x, y, 0x3a3340)
    if (rnd(k, 1) > 0.4) for (let y = 0; y < len; y++) if (d <= ((len - y) / len) * 2.6) put(c, x, 2 + y, 0x3a3340)
    if (rnd(k, 4) > 0.5) for (let y = 0; y < ln; y++) if (d <= ((ln - y) / ln) * 2.4) put(c, x, GROUND - 1 - y, 0x4a4352)
    put(c, x, GROUND, 0x3a3340)
    if (d === 0 && rnd(k, 6) > 0.8) put(c, x, 8 + Math.floor(rnd(k, 7) * 5), tk(m.t, 500) % 3 ? 0x4fd9a3 : 0x2a7a60)
  }
  for (let x = hx + 1; x < hx + 30; x++) {
    const f = (x - hx) / 29, spread = 1 + (x - hx) * 0.3
    for (let y = Math.floor(hy - spread); y <= Math.ceil(hy + spread); y++) {
      if (y < 0 || y >= PH) continue
      const b = (1 - f) * (1 - Math.abs(y - hy) / (spread + 1)) * 0.85
      put(c, x, y, mix(c.px[y * c.W + x]!, 0xfff0b0, b))
    }
  }
  clawd(c, m.t, 'walk', cx)
  rect(c, cx + 3, CLAWD_TOP - 2, 8, 2, 0xf2c230); put(c, hx, hy, WHITE)
  const bx = c.W - ((m.t / 28) % (c.W + 20)), by = 3 + Math.sin(m.t / 400) * 2
  if (bx > hx + 12) { put(c, bx, by, 0x6a5a80); put(c, bx - 1, by - (tk(m.t, 140) % 2), 0x6a5a80); put(c, bx + 1, by - (tk(m.t, 140) % 2), 0x6a5a80) }
}

// ------------------------------------------------------------------ swooping: a caped dive over the river, snatching a fish

const swooping: Draw = (c, m) => {
  for (let x = 0; x < c.W; x++) {
    rect(c, x, 13, 1, 2, 0x2f6fa8)
    if ((x + tk(m.t, 150)) % 5 === 0) put(c, x, 13, 0x5aa0d9)
  }
  const u = (m.t % 4600) / 4600
  const x = u * (c.W + 10) - 14
  const lift = Math.round(7 * (1 - Math.sin(Math.PI * u)))
  const top = CLAWD_TOP - lift
  for (let i = 1; i <= 6; i++) for (let j = 0; j < 3; j++) if (j < 4 - i / 2) put(c, x + 2 - i, top + 1 + j + Math.round(Math.sin(m.t / 80 - i * 0.8)), mix(0xd94f4f, 0x7c1822, i / 8))
  clawd(c, m.t, 'float', x, 1, lift)
  for (let k = 0; k < 4; k++) rect(c, x - 8 - k * 3 - ((m.t / 30 + k * 7) % 6), 2 + k * 3, 4, 1, mix(0x9aa0b0, 0x1a1c24, 0.5))
  const hx = Math.round(x) + 13, hy = top + 2
  const fx = 0.5 * (c.W + 10) - 14 + 13
  if (u < 0.38) put(c, fx, 13, 0x1a1c24)
  else if (u < 0.5) { const v = (u - 0.38) / 0.12; rect(c, lerp(fx, hx, v), lerp(13, hy, v), 2, 1, 0xff9e3d) }
  else {
    rect(c, hx, hy + 1, 2, 1, 0xff9e3d); put(c, hx + 2, hy + 1, 0xd9743a)
    for (let d = 0; d < 2; d++) put(c, hx + d, hy + 2 + ((m.t / 70 + d * 3) % 5), 0x7fa6d6)
  }
}

// ------------------------------------------------------------------ tinkering: fiddling a gadget at a bench, a spring boings out

const tinkering: Draw = (c, m) => {
  const bx = spot(c.W, 0.58)
  rect(c, bx - 12, 0, 27, 9, 0x4a3a2a)
  for (let x = bx - 11; x < bx + 15; x += 2) for (let y = 1; y < 9; y += 2) put(c, x, y, 0x3a2e22)
  sprite(c, ['hhh.', '.w..', '.w..', '.w..'], { h: 0x8a919b, w: 0xb08d57 }, bx - 10, 2)
  sprite(c, ['w.w', 'www', '.w.', '.w.'], { w: 0x8a919b }, bx - 4, 2)
  sprite(c, ['.r.', '.r.', '.s.', '.s.'], { r: 0xd94f4f, s: 0xc8ccd8 }, bx + 2, 2)
  sprite(c, ['sssss', '.sss.'], { s: 0xc8ccd8 }, bx + 8, 3)
  rect(c, bx - 6, 11, 16, 1, WOOD); rect(c, bx - 5, 12, 1, 3, WOOD); rect(c, bx + 8, 12, 1, 3, WOOD)
  rect(c, bx - 2, 8, 8, 3, 0x6b7086); put(c, bx - 1, 9, 0xd9c84f); put(c, bx + 1, 9, 0x6ad94f)
  put(c, bx + 4, 7, 0x8a919b); put(c, bx + 4, 6, tk(m.t, 300) % 2 ? 0xd94f4f : 0x6a2020)
  gear(c, bx + 9, 9, 2, m.t / 200, 0xb08d57)
  const u = (m.t % 2800) / 2800
  if (u < 0.3) {
    const len = Math.floor(Math.sin((u / 0.3) * Math.PI) * 5) + 1
    for (let j = 1; j <= len; j++) put(c, bx + (j % 2 ? 0 : 1), 8 - j, 0xdfe7ff)
    rect(c, bx - 1, 8 - len - 1, 3, 1, 0xd9c84f)
  }
  const { hand } = clawd(c, m.t, 'hammer', bx - 19)
  const down = m.t % 700 >= 450
  rect(c, hand[0] + 1, hand[1] - (down ? 0 : 2), 2, 2, 0x8a919b)
  if (down) { put(c, hand[0] + 3, hand[1] - 1, 0xffd54f); put(c, hand[0] + 4, hand[1], 0xff8c2a) }
  ground(c)
}

// ------------------------------------------------------------------ twisting: the twist, beside a turning double helix

const twisting: Draw = (c, m, g) => {
  const hx = spot(c.W, 0.6)
  for (let i = 0; i < 20; i++) {
    const a = i * 0.55 + m.t / 300
    const y1 = 7 + Math.sin(a) * 5, y2 = 7 - Math.sin(a) * 5, x = hx - 10 + i
    if (i % 3 === 0) line(c, x, y1, x, y2, 0x4a5170)
    const front = Math.cos(a) > 0
    put(c, x, front ? y2 : y1, 0x4fa3d9); put(c, x, front ? y1 : y2, 0xd94f8a)
  }
  const x = START + Math.round(Math.sin(m.t / 130))
  clawd(c, m.t, 'dance', x, tk(m.t, 260) % 2 ? 1 : -1)
  const n = tk(m.t, 500)
  g.push({ x: x + 15 + (n % 3), row: 1 + (n % 2), ch: '~', fg: SPARKS[n % 4]! })
  ground(c)
}

// ------------------------------------------------------------------ wandering: a hiker with a pack through pines

const wandering: Draw = (c, m) => {
  const far = m.t * 0.008, near = m.t * WALK * 1.3
  for (let x = 0; x < c.W; x++) {
    const h = Math.max(1, Math.round(4 + 2.5 * Math.sin((x + far) / 13) + Math.sin((x + far) / 5)))
    rect(c, x, GROUND - h - 1, 1, h, 0x2a3350)
  }
  for (let k = -1; k < c.W / 11 + 2; k++) {
    const wk = Math.floor((near + k * 11) / 11) * 11
    const id = Math.floor(wk / 11)
    if (rnd(id, 1) < 0.35) continue
    const tx = Math.round(wk - near)
    const h = 5 + Math.floor(rnd(id, 2) * 4)
    for (let j = 0; j < h; j++) rect(c, tx - 1 - Math.floor(j / 2), GROUND - 1 - h + j + 0, 3 + 2 * Math.floor(j / 2), 1, j % 2 ? 0x2d6a3a : 0x3a7d44)
    put(c, tx, GROUND - 1, 0x5a3a22)
  }
  const x = spot(c.W, 0.4)
  const { hand } = clawd(c, m.t, 'carry', x)
  rect(c, x - 1, CLAWD_TOP + 1, 3, 3, 0x6a4a2a); rect(c, x - 2, CLAWD_TOP, 3, 1, 0x4f9a3a)
  line(c, hand[0] + 1, 10, hand[0] + 2 + (tk(m.t, 160) % 2), 14, 0xb08d57)
  ground(c, 0x2d4a2b)
}

// ------------------------------------------------------------------ wibbling: poking a wobbling jelly

const wibbling: Draw = (c, m, g) => {
  const jx = spot(c.W, 0.6)
  const ph = m.t % 3200
  const amp = ph > 900 ? Math.exp(-(ph - 900) / 700) * 2.4 : 0
  rect(c, jx - 2, 14, 16, 1, WHITE)
  const widths = [6, 8, 10, 11, 12, 12]
  for (const [j, w] of widths.entries()) {
    const off = Math.round(Math.sin(ph / 90 + j * 0.6) * amp * ((6 - j) / 6))
    const wide = w + (ph > 900 && ph < 1100 ? 1 : 0)
    rect(c, jx + 6 - wide / 2 + off, 8 + j, wide, 1, j < 1 ? 0x8fe86f : 0x6ad94f)
    put(c, jx + 6 - wide / 2 + off, 8 + j, 0x4f9a3a)
    if (j === 1) put(c, jx + 4 + off, 9, 0xc9f5b8)
    if (j === 0) { put(c, jx + 6 + off, 7, 0xd94f4f); put(c, jx + 6 + off, 6, 0x4f9a3a) }
  }
  clawd(c, m.t, 'carry', jx - 14 + (ph > 850 && ph < 1000 ? 2 : 0) + Math.round(Math.sin(ph / 90) * amp * 0.4))
  if (amp > 0.3) g.push({ x: jx + 13 + (tk(m.t, 200) % 2), row: 3, ch: '~', fg: 0x6ad94f })
  ground(c)
}

export const SCENES: Record<string, Draw> = {
  baking, bloviating, bunning, catapulting, coalescing, considering, crystallizing, discombobulating, elucidating, finagling,
  forging, garnishing, gusting, hullaballooing, inferring, kneading, meandering, musing, nucleating, percolating, pondering,
  proofing, razzmatazzing, scampering, simmering, spelunking, swooping, tinkering, twisting, wandering, wibbling,
}
