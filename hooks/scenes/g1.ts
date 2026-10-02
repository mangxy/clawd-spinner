import { CLAWD, CLAWD_TOP, DEF, GROUND, PH, SPARKS, along, canvas, clawd, ground, mix, put, rect, rnd, spot, sprite, wave } from '../acts'
import type { Canvas, Draw, Glyph, Pose } from '../acts'

// ------------------------------------------------------------------ helpers

const WOOD = 0x7a4a24
const STEEL = 0x8a919b
const GOLD = 0xffd54f

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v))
const ease = (k: number) => { k = clamp(k); return k * k * (3 - 2 * k) }
const lerp = (a: number, b: number, k: number) => a + (b - a) * k

function line(c: Canvas, x0: number, y0: number, x1: number, y1: number, colour: number) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1)
  for (let i = 0; i <= n; i++) put(c, x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, colour)
}

const txt = (g: Glyph[], x: number, row: number, s: string, fg: number) => [...s].forEach((ch, i) => g.push({ x: x + i, row, ch, fg }))

/** Where Clawd's head top is, matching clawd(): hop, breathing and lift. */
const topOf = (t: number, pose: Pose, lift = 0) =>
  CLAWD_TOP + (pose === 'dance' ? -(Math.floor(t / 300) % 2) : 0) + ((pose === 'stand' || pose === 'cast') && Math.floor(t / 700) % 2 ? 1 : 0) - lift

type Stroke = { pts: [number, number][]; col: number }

/** Draws the strokes up to fraction f of their total length at (ox, oy); returns the pen tip. */
function strokes(c: Canvas, list: Stroke[], f: number, ox: number, oy: number): [number, number] {
  const seg = (s: Stroke) => s.pts.slice(1).map((p, i) => Math.hypot(p[0] - s.pts[i]![0], p[1] - s.pts[i]![1]))
  let left = f * list.reduce((n, s) => n + seg(s).reduce((a, b) => a + b, 0), 0)
  let pen: [number, number] = [ox + list[0]!.pts[0]![0], oy + list[0]!.pts[0]![1]]
  for (const s of list) {
    for (const [i, d] of seg(s).entries()) {
      if (left <= 0) return pen
      const [ax, ay] = s.pts[i]!
      const [bx, by] = s.pts[i + 1]!
      const k = d ? Math.min(1, left / d) : 1
      pen = [ox + ax + (bx - ax) * k, oy + ay + (by - ay) * k]
      line(c, ox + ax, oy + ay, pen[0], pen[1], s.col)
      left -= d
      if (k < 1) return pen
    }
  }
  return pen
}

function pile(c: Canvas, x: number, h: number, colour: number) {
  for (let r = 0; r < h; r++) rect(c, x - (h - r - 1), GROUND - 1 - r, (h - r) * 2 - 1, 1, r % 2 ? mix(colour, 0xffffff, 0.12) : colour)
}

const HEX = '0123456789abcdef'

// ------------------------------------------------------------------ scenes

/** A checklist board ticks off item by item; the last tick sets off confetti. */
const accomplishing: Draw = (c, m) => {
  const bx = spot(c.W, 0.55)
  const p = m.t % 6400
  const done = (j: number) => p > 900 + j * 1200
  const party = p > 4500 && p < 6200
  rect(c, bx - 8, 2, 17, 11, 0x8a6a44); rect(c, bx - 7, 3, 15, 9, 0xe9e4d4)
  rect(c, bx - 6, 13, 1, 2, WOOD); rect(c, bx + 6, 13, 1, 2, WOOD)
  const active = [0, 1, 2].find(j => !done(j)) ?? -1
  for (let j = 0; j < 3; j++) {
    const y = 4 + j * 3
    rect(c, bx - 6, y, 2, 2, done(j) ? 0x3fb950 : active === j && Math.floor(p / 250) % 2 ? GOLD : 0x9a958a)
    rect(c, bx - 3, y, 9, 1, done(j) ? 0x9fd49a : 0xb8b2a0)
    rect(c, bx - 3, y + 1, 5, 1, done(j) ? 0xc4e6c0 : 0xd2cdbd)
  }
  clawd(c, m.t, party ? 'dance' : 'pan', bx - 23)
  if (party) for (let k = 0; k < 16; k++) put(c, bx - 10 + rnd(k) * 21, ((p - 4500) / 90 + rnd(k, 2) * 12) % 15, SPARKS[k % 4]!)
  ground(c)
}

/** Cool-cat jazz: shades, a trumpet, a spotlight and a black-and-white stage. */
const beboppin: Draw = (c, m, g) => {
  const x = spot(c.W, 0.4)
  for (let y = 0; y < GROUND; y++) rect(c, x + 7 - 3 - (y >> 1), y, 7 + (y >> 1) * 2, 1, 0x2b2818)
  const beat = Math.floor(m.t / 240) % 2
  const ox = x - 7 + Math.round(Math.sin(m.t / 480) * 2)
  const { hand } = clawd(c, m.t, 'pan', ox, 1, beat)
  const top = CLAWD_TOP - beat
  rect(c, ox + 3, top + 1, 8, 2, 0x0b0b0e); put(c, ox + 4, top + 1, 0x7a7a8a)
  rect(c, hand[0] + 1, hand[1], 5, 1, GOLD); rect(c, hand[0] + 6, hand[1] - 1, 1, 3, GOLD); put(c, hand[0] + 2, hand[1] - 1, 0xb08d57)
  for (let k = 0; k < 4; k++) {
    const life = (m.t / 900 + k / 4) % 1
    g.push({ x: hand[0] + 8 + Math.round(life * 12), row: 5 - Math.floor(life * 5), ch: k % 2 ? '♫' : '♪', fg: [0xd94f8a, 0x4fa3d9, 0xd9c84f, 0x6ad94f][k]! })
  }
  for (let i = 0; i < c.W; i++) put(c, i, GROUND, Math.floor(i / 2) % 2 ? 0xe8e8e8 : 0x1a1a1e)
}

/** Pointless busywork: Clawd shovels a pile of dirt across, then shovels it all back. */
const boondoggling: Draw = (c, m) => {
  const L = Math.round(c.W * 0.18)
  const R = Math.round(c.W * 0.82)
  const p = (m.t % 8000) / 8000
  const dir = p < 0.5 ? 0 : 1
  const q = ease((((p * 2) % 1) - 0.08) / 0.84)
  const a = dir ? 1 - q : q
  const hL = 1 + Math.round(4 * (1 - a))
  const hR = 1 + Math.round(4 * a)
  pile(c, L, hL, 0x6b4a2c); pile(c, R, hR, 0x6b4a2c)
  const ox = Math.round((L + R) / 2) - 7
  const { hand } = clawd(c, m.t, 'hammer', ox, dir ? -1 : 1)
  const sx = hand[0] + (dir ? -1 : 1)
  line(c, hand[0], hand[1], sx * 1, hand[1] - 2, WOOD); rect(c, sx - 1 + (dir ? -1 : 0), hand[1] - 3, 2, 2, STEEL)
  if (q > 0 && q < 1) for (let k = 0; k < 3; k++) {
    const s = (m.t / 700 + k / 3) % 1
    const from = dir ? R : L
    const to = dir ? L : R
    const y0 = GROUND - (dir ? hR : hL) - 1
    const y1 = GROUND - (dir ? hL : hR) - 1
    rect(c, lerp(from, to, s), lerp(y0, y1, s) - Math.sin(Math.PI * s) * 7, 2, 2, 0x8a6a44)
  }
  ground(c, 0x4a3a2a)
}

/** An abacus whose beads slide back and forth while the answer flickers above. */
const calculating: Draw = (c, m, g) => {
  const x0 = spot(c.W, 0.56) - 9
  rect(c, x0 - 1, 2, 22, 1, WOOD); rect(c, x0 - 1, 12, 22, 1, WOOD); rect(c, x0 - 1, 2, 1, 11, WOOD); rect(c, x0 + 20, 2, 1, 11, WOOD)
  for (let r = 0; r < 3; r++) {
    const y = 3 + r * 3
    rect(c, x0, y + 1, 20, 1, 0x6b6b72)
    const moved = 3.5 + 3.5 * Math.sin((m.t / 1000) * (0.9 + r * 0.45) + r * 2)
    for (let i = 0; i < 7; i++) rect(c, x0 + 1 + i * 2 + clamp(moved - (6 - i)) * 4, y, 2, 2, [0xd94f4f, 0xd9c84f, 0x4fa3d9][r]!)
  }
  clawd(c, m.t, 'pan', x0 - 15)
  txt(g, x0 + 4, 0, '=', 0x6ad94f)
  for (let i = 0; i < 4; i++) g.push({ x: x0 + 6 + i, row: 0, ch: String(Math.floor(rnd(i, Math.floor(m.t / 450)) * 10)), fg: 0x6ad94f })
  ground(c)
}

/** A medium in a turban: the crystal ball glows and a ghost rises out of it. */
const channeling: Draw = (c, m) => {
  const tx = spot(c.W, 0.62)
  const p = m.t % 4200
  const up = ease(p / 900) - ease((p - 3500) / 600)
  const gy = Math.round(6 - up * 6)
  const sway = Math.round(Math.sin(m.t / 350) * 2)
  sprite(c, ['.www.', 'wwwww', 'wkwkw', 'wwwww', 'wwwww', Math.floor(m.t / 250) % 2 ? 'w.w.w' : '.w.w.'], { w: 0xe6dcff, k: 0x3a2a5a }, tx - 2 + sway, gy)
  rect(c, tx - 7, 11, 15, 4, 0x4a2a6a); rect(c, tx - 7, 11, 15, 1, 0xb08d57)
  rect(c, tx - 2, 10, 5, 1, 0xb08d57)
  sprite(c, ['.ppp.', 'ppppp', 'ppppp', '.ppp.'], { p: mix(0x7a3fb0, 0xd9a8ff, wave(m.t, 900)) }, tx - 2, 6)
  put(c, tx - 1, 7, 0xffffff)
  for (let k = 0; k < 8; k++) {
    const a = m.t / 300 + k * 0.785
    put(c, tx + Math.cos(a) * 6, 8 + Math.sin(a) * 2, SPARKS[k % 4]!)
  }
  const ox = tx - 23
  clawd(c, m.t, 'cast', ox)
  const top = topOf(m.t, 'cast')
  rect(c, ox + 3, top - 1, 8, 1, 0x7a3fb0); put(c, ox + 7, top - 1, GOLD)
  ground(c)
}

/** Scattered pieces fly together into a heart, hold, then drift apart again. */
const combobulating: Draw = (c, m) => {
  const gx = spot(c.W, 0.62)
  const art = ['.xx.xx.', 'xxxxxxx', 'xxxxxxx', '.xxxxx.', '..xxx..', '...x...']
  const tt = m.t % 6400
  let i = 0
  art.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch !== 'x') return
    const k = i++
    const f = ease((tt - (400 + rnd(k, 3) * 1800)) / 800) - ease((tt - (4200 + rnd(k, 4) * 1200)) / 800)
    const sx = gx - 30 + rnd(k, 1) * 60 + Math.sin(m.t / 500 + k) * 1.5
    const sy = rnd(k, 2) * 12 + Math.cos(m.t / 600 + k) * 1.5
    rect(c, lerp(sx, gx - 7 + x * 2, f), lerp(sy, 1 + y * 2, f), 2, 2, mix(0xff4b6e, 0xffa0c4, y / 5))
  }))
  clawd(c, m.t, 'cast', Math.max(2, gx - 30))
  ground(c)
}

/** A chef's hat, a stove and a big soup pot: Clawd stirs while carrots drop in. */
const cooking: Draw = (c, m) => {
  const px = spot(c.W, 0.62)
  rect(c, px - 6, 11, 13, 4, 0x4a4a52); rect(c, px - 6, 11, 13, 1, 0x6a6a74)
  for (const k of [-4, 0, 4]) put(c, px + k, 13, 0xd94f4f)
  rect(c, px - 5, 11, 11, 1, mix(0xff8c2a, 0xffd54f, wave(m.t, 300)))
  rect(c, px - 4, 8, 9, 3, 0x2a2e38); rect(c, px - 5, 7, 11, 1, 0x8a919b); rect(c, px - 3, 8, 7, 1, 0xd9873a)
  for (let k = 0; k < 3; k++) if (rnd(k, Math.floor(m.t / 260)) > 0.4) put(c, px - 2 + k * 2, 6, 0xffb868)
  for (let k = 0; k < 4; k++) {
    const life = (m.t / 140 + k * 6) % 20
    put(c, px - 3 + k * 2 + Math.sin(life / 2 + k) , 5 - life / 4, mix(0xaab0c0, 0x1a1c24, life / 20))
  }
  const fall = (m.t % 2600) / 700
  if (fall < 1) rect(c, px - 1 + (Math.floor(m.t / 2600) % 3), -1 + fall * 8, 1, 3, 0xff8c2a)
  const ox = px - 19
  const { hand } = clawd(c, m.t, 'crank', ox)
  sprite(c, ['.ww.', 'wwww', 'wwww', 'wwww'], { w: 0xf4f4f4 }, ox + 5, topOf(m.t, 'crank') - 4)
  line(c, hand[0] + 1, hand[1], px - 1 + Math.round(2 * Math.cos(m.t / 250)), 9, 0xb0b6c2)
  ground(c)
}

/** A row of cipher symbols; a magnifying lens sweeps along and turns each into a letter. */
const deciphering: Draw = (c, m, g) => {
  const msg = 'HELLO CLAWD'
  const cipher = '◊¤§¶∆Ω∑'
  const x0 = Math.round(c.W * 0.35)
  const p = m.t % 6000
  const idx = clamp(p / 4800) * msg.length
  const back = ease((p - 5200) / 800)
  const cx = x0 + (idx - 0.5) * 2 - back * (msg.length * 2)
  const ox = Math.max(0, Math.round(cx) - 16)
  clawd(c, m.t, 'cast', ox)
  const lx = ox + 16
  for (let a = 0; a < 16; a++) put(c, lx + Math.cos((a / 16) * Math.PI * 2) * 2.2, 6 + Math.sin((a / 16) * Math.PI * 2) * 2.2, 0xdfe7ff)
  ;[...msg].forEach((ch, i) => {
    if (ch === ' ') return
    const ok = p < 5600 && i < idx - 0.5
    const near = Math.abs(i - idx + 0.5) < 0.5
    g.push({
      x: x0 + i * 2, row: 1,
      ch: ok ? ch : cipher[Math.floor(rnd(i, near ? Math.floor(m.t / 70) : 9) * cipher.length)]!,
      fg: ok ? 0x6ad94f : near ? 0xffe066 : 0x9a6ad9,
    })
  })
  ground(c)
}

/** Pencil in hand, Clawd scribbles a little house, sun and flower onto a pad, stroke by stroke. */
const doodling: Draw = (c, m) => {
  const ox = spot(c.W, 0.3) - 10
  const px = ox + 17
  const p = m.t % 6400
  rect(c, px - 1, 13, 19, 3, WOOD)
  rect(c, px, 3, 17, 10, 0xf2eee0)
  for (let y = 5; y < 13; y += 2) for (let x = 0; x < 17; x += 4) put(c, px + x, y, 0xdcd6c4)
  const f = p < 5200 ? ease(p / 4400) : 1
  const art: Stroke[] = [
    { pts: [[2, 7], [2, 3], [6, 0], [10, 3], [10, 7], [2, 7]], col: 0x2a5fd9 },
    { pts: [[5, 7], [5, 5], [7, 5], [7, 7]], col: 0xd9702a },
    { pts: [[8, 2], [8, 0], [9, 0], [9, 3]], col: 0xae3030 },
    { pts: [[13, 0], [14, 1], [13, 2], [12, 1], [13, 0]], col: 0xe0a800 },
    { pts: [[14, 7], [14, 4]], col: 0x2f9e44 },
    { pts: [[13, 4], [15, 4], [14, 3], [14, 5]], col: 0xd94f8a },
  ]
  if (p < 5900) {
    const pen = strokes(c, art, f, px + 1, 4)
    const { hand } = clawd(c, m.t, 'pan', ox)
    line(c, hand[0] + 1, hand[1], pen[0], pen[1], 0xe0b030)
  } else clawd(c, m.t, 'pan', ox)
  ground(c)
}

/** A floating sword inside a rotating rune circle while Clawd's wand feeds it light. */
const enchanting: Draw = (c, m, g) => {
  const cx = spot(c.W, 0.64)
  const pulse = wave(m.t, 1200)
  for (let k = 0; k < 40; k++) {
    const a = (k / 40) * Math.PI * 2
    put(c, cx + Math.cos(a) * 12, 13.5 + Math.sin(a) * 1.3, (k + Math.floor(m.t / 60)) % 13 < 4 ? 0xe0b0ff : 0x6a3fa0)
  }
  const by = 1 + Math.round(Math.sin(m.t / 500))
  for (let k = 0; k < 14; k++) {
    const a = m.t / 400 + k * 0.45
    put(c, cx + Math.cos(a) * (5 + pulse * 2), by + 4 + Math.sin(a) * 4, mix(0x7a3fb0, 0xe0b0ff, k % 3 / 2))
  }
  sprite(c, ['.w.', '.w.', '.w.', '.w.', '.w.', '.w.', 'ggg', '.g.'], { w: 0xe8f4ff, g: GOLD }, cx - 1, by)
  const ox = cx - 25
  const { tip } = clawd(c, m.t, 'cast', ox)
  if (tip) for (let k = 0; k < 14; k++) if ((k + Math.floor(m.t / 70)) % 3 === 0) put(c, lerp(tip[0], cx, k / 14), lerp(tip[1], by + 3, k / 14) + Math.sin(k + m.t / 100), SPARKS[k % 4]!)
  g.push({ x: cx - 6, row: 3 + (Math.floor(m.t / 500) % 2), ch: '✧', fg: 0xe0b0ff }, { x: cx + 6, row: 4 - (Math.floor(m.t / 500) % 2), ch: '✦', fg: 0xe0b0ff })
  ground(c)
}

/** Jabbering nonsense: Clawd bounces and flaps, mouth going, gibberish flying out. */
const flibbertigibbeting: Draw = (c, m, g) => {
  const bx = spot(c.W, 0.4)
  const facing = Math.floor(m.t / 900) % 2 ? -1 : 1
  const ox = bx + Math.round(Math.sin(m.t / 130) * 1.5)
  clawd(c, m.t, 'dance', ox, facing)
  const top = CLAWD_TOP - (Math.floor(m.t / 300) % 2)
  if (Math.floor(m.t / 110) % 2) rect(c, ox + 6, top + 3, 2, 1, 0x1a1410)
  const cols = [0xff4b3e, GOLD, 0x8fe0ff, 0xb6f5a0, 0xff9ec0]
  for (let k = 0; k < 7; k++) {
    const life = (m.t / 800 + k / 7) % 1
    const n = Math.floor(m.t / 800 + k / 7)
    const dir = rnd(k, n) > 0.5 ? 1 : -1
    g.push({ x: ox + 7 + dir * (2 + Math.round(life * (6 + rnd(k, n + 1) * 10))), row: 4 - Math.floor(life * 4 * (0.4 + rnd(k, n + 2))), ch: '@#$%&*?!~^'[Math.floor(rnd(k, Math.floor(m.t / 160)) * 10)]!, fg: cols[k % 5]! })
  }
  ground(c)
}

/** Skipping through a flowery meadow under a sun, shedding petals as he hops. */
const frolicking: Draw = (c, m) => {
  const span = c.W + 18
  const x = ((m.t % 6000) / 6000) * span - 16
  const hop = Math.abs(Math.sin(m.t / 230))
  for (let k = 0; k < c.W; k += 6) {
    const fx = k + Math.floor(rnd(k, 5) * 4)
    put(c, fx, GROUND - 1, 0x3d7a3a)
    put(c, fx, GROUND - 2, [0xff9ec0, GOLD, 0xffffff, 0xb48cff][Math.floor(rnd(k, 6) * 4)]!)
  }
  for (let k = 0; k < 8; k++) put(c, c.W - 7 + Math.cos(m.t / 600 + k * 0.785) * 4, 3 + Math.sin(m.t / 600 + k * 0.785) * 4, 0xffd54f)
  rect(c, c.W - 8, 2, 3, 3, 0xffd54f)
  for (let i = 0; i < 9; i++) put(c, x + 3 - i * 3, 10 + ((m.t / 90 + i * 5) % 5), mix(0xff9ec0, 0x3d7a3a, i / 9))
  clawd(c, m.t, 'dance', x, 1, Math.round(hop * 4))
  ground(c, 0x2d4a2b)
}

/** A cutaway of soil: rain wets a seed, it splits, sends a root down and a shoot up. */
const germinating: Draw = (c, m) => {
  const sx = spot(c.W, 0.62)
  const p = m.t % 7000
  rect(c, sx - 8, 6, 16, 10, 0x5a3a22)
  for (let k = 0; k < 14; k++) put(c, sx - 7 + rnd(k, 1) * 14, 7 + rnd(k, 2) * 8, 0x4a2e1a)
  for (let k = 0; k < 10; k++) put(c, sx - 7 + rnd(k, 3) * 14, 7 + rnd(k, 4) * 8, 0x7a5a38)
  const wet = clamp(p / 1800) * 3
  rect(c, sx - 7, 6, 14, Math.round(wet), 0x3f2a18)
  rect(c, sx - 8, 6, 1, 10, 0x8a6a44); rect(c, sx + 7, 6, 1, 10, 0x8a6a44); rect(c, sx - 8, 5, 16, 1, 0x8a6a44)
  const raining = p < 2200
  if (raining) {
    rect(c, sx - 4, 0, 9, 1, 0x6b7086)
    for (let d = 0; d < 5; d++) put(c, sx - 4 + d * 2, 1 + ((m.t / 60 + d * 3) % 4), 0x7fa6d6)
  }
  const split = p > 1800
  sprite(c, ['.ss.', 'ssss', '.ss.'], { s: split ? 0xd8c490 : 0xb89a5a }, sx - 1, 9)
  if (p > 2200) {
    const r = ease((p - 2200) / 2200)
    const len = Math.round(r * 4)
    for (let k = 0; k < len; k++) put(c, sx, 12 + k, 0xf0e6c8)
    if (len > 2) { put(c, sx - 1, 14, 0xf0e6c8); put(c, sx - 2, 15, 0xf0e6c8) }
    if (len > 3) { put(c, sx + 1, 14, 0xf0e6c8); put(c, sx + 2, 15, 0xf0e6c8) }
  }
  if (p > 3000) {
    const top = 9 - Math.round(ease((p - 3000) / 2400) * 8)
    for (let y = top; y < 9; y++) put(c, sx, y, 0x4f9a3a)
    if (p > 5000) { sprite(c, ['gg.gg', '.ggg.'], { g: 0x6ab84f }, sx - 2, top - 1) }
    else put(c, sx, top - 1, 0x8fd46a)
  }
  clawd(c, m.t, p > 4800 ? 'dance' : 'float', sx - 26)
  ground(c, 0x4a3a2a)
}

/** A hash machine: junk of every length drops in the hopper, a fixed-length digest rolls out. */
const hashing: Draw = (c, m, g) => {
  const hx = spot(c.W, 0.5)
  const n = Math.floor(m.t / 1400)
  const age = m.t % 1400
  for (let j = 0; j < 3; j++) rect(c, hx - 4 + j, 2 + j, 9 - 2 * j, 1, STEEL)
  rect(c, hx - 6, 5, 13, 8, 0x3a4150); rect(c, hx - 6, 5, 13, 1, 0x5a6478)
  sprite(c, ['.x.x.', 'xxxxx', '.x.x.', 'xxxxx', '.x.x.'], { x: mix(0x4fd9c8, GOLD, wave(m.t, 800)) }, hx - 2, 7)
  const w = 2 + Math.floor(rnd(n, 1) * 5)
  if (age < 600) rect(c, hx - Math.floor(w / 2), -2 + (age / 600) * 6, w, 2, SPARKS[n % 4]!)
  rect(c, hx + 7, 12, 16, 1, 0x555a66)
  for (let k = 0; k < 4; k++) put(c, hx + 8 + ((m.t / 50 + k * 4) % 15), 12, 0x9aa0b0)
  for (let i = 0; i < 6; i++) {
    const seed = age < 350 ? Math.floor(m.t / 50) : n
    g.push({ x: hx + 9 + i * 2, row: 5, ch: HEX[Math.floor(rnd(i, seed) * 16)]!, fg: age < 350 ? 0x9a6ad9 : 0x6ad94f })
  }
  rect(c, hx - 8, 11, 1, 1, STEEL)
  put(c, hx - 8 + Math.cos(m.t / 250) * 2, 11 + Math.sin(m.t / 250) * 2, GOLD)
  clawd(c, m.t, 'crank', hx - 21)
  ground(c)
}

/** A corkboard fills with sticky notes tossed from Clawd's hand, a bulb blinking for each. */
const ideating: Draw = (c, m) => {
  const bx = spot(c.W, 0.6)
  const p = m.t % 6600
  rect(c, bx - 11, 1, 23, 12, 0x6b4a2c); rect(c, bx - 10, 2, 21, 10, 0xa5733a)
  const order = [...Array(12).keys()].sort((a, b) => rnd(a, 77) - rnd(b, 77))
  const cols = [0xffe066, 0xff9ec0, 0x8fe0ff, 0xb6f5a0]
  const n = Math.floor(p / 450)
  const ox = bx - 28
  const { hand } = clawd(c, m.t, 'hammer', ox)
  for (let k = 0; k < Math.min(12, n + 1); k++) {
    const slot = order[k]!
    const tx = bx - 9 + (slot % 4) * 5
    const ty = 3 + Math.floor(slot / 4) * 3
    const fly = ease((p - k * 450) / 280)
    if (k === n && fly < 1) rect(c, lerp(hand[0] + 1, tx, fly), lerp(hand[1], ty, fly) - Math.sin(Math.PI * fly) * 4, 4, 2, cols[k % 4]!)
    else rect(c, tx, ty, 4, 2, cols[(slot + k) % 4]!)
  }
  if (p % 450 < 220 && n < 12) sprite(c, ['.yy.', 'yyyy', '.yy.'], { y: GOLD }, ox + 5, topOf(m.t, 'hammer') - 4)
  ground(c)
}

/** Clawd between two charged plates: arcs crackle, his hair stands on end, + and - drift. */
const ionizing: Draw = (c, m, g) => {
  const e1 = Math.round(c.W * 0.18)
  const e2 = Math.round(c.W * 0.82)
  const cx = Math.round((e1 + e2) / 2)
  rect(c, e1, 2, 2, 13, 0xb08d57); rect(c, e2, 2, 2, 13, 0x6a8fd9)
  const f = Math.floor(m.t / 70)
  const ox = cx - 7 + (rnd(f, 3) > 0.7 ? 1 : 0)
  if (m.t % 1000 < 650) {
    let y = 4
    for (let x = e1 + 2; x < e2; x++) { y = clamp(y + Math.floor(rnd(x, f) * 3) - 1, 2, 6); put(c, x, y, rnd(x, f + 1) > 0.5 ? 0xcfe3ff : 0xb48cff) }
  }
  if (m.t % 1000 > 300) line(c, e1 + 2, 9, ox + 2, CLAWD_TOP - 1, 0xcfe3ff)
  clawd(c, m.t, 'walk', ox)
  for (const i of [3, 5, 7, 9]) {
    const h = 2 + Math.floor(rnd(i, f) * 3)
    for (let k = 1; k <= h; k++) put(c, ox + i + (k > 2 ? (rnd(i, f + 5) > 0.5 ? 1 : -1) : 0), CLAWD_TOP - k, k > 2 ? 0xcfe3ff : 0xb48cff)
  }
  for (let k = 0; k < 6; k++) {
    const life = (m.t / 1800 + k / 6) % 1
    const pos = k % 2
    g.push({ x: Math.round(pos ? lerp(e1 + 3, e2 - 2, life) : lerp(e2 - 2, e1 + 3, life)), row: 1 + (k % 3), ch: pos ? '+' : '-', fg: pos ? 0xff6b6b : 0x6ab0ff })
  }
  g.push({ x: e1, row: 0, ch: '+', fg: 0xff6b6b }, { x: e2, row: 0, ch: '-', fg: 0x6ab0ff })
  ground(c, mix(0x2a2d36, 0xb48cff, wave(m.t, 400) * 0.5))
}

/** Eyes shut, Clawd rises in meditation; pebbles lift, his shadow shrinks, rings pulse below. */
const levitating: Draw = (c, m, g) => {
  const x = spot(c.W, 0.5) - 7
  const lift = 4 + Math.round(wave(m.t, 3200) * 3)
  for (let k = 0; k < 6; k++) {
    const rise = Math.round(wave(m.t, 2000 + k * 300, k) * (2 + k % 3 * 2))
    const px = x + 7 + (k - 2.5) * 6
    rect(c, px, GROUND - 1 - rise, k % 2 ? 2 : 1, 1, 0x8a8f9a)
  }
  const sw = 12 - lift
  rect(c, x + 7 - sw / 2, GROUND, sw, 1, 0x14161c)
  const ring = (m.t / 600) % 1
  for (const k of [0, 0.5]) {
    const r = ((ring + k) % 1) * 12
    put(c, x + 7 - r, GROUND - 1, mix(0x6ad9d9, 0x1a1c24, r / 12)); put(c, x + 7 + r, GROUND - 1, mix(0x6ad9d9, 0x1a1c24, r / 12))
  }
  clawd(c, m.t, 'float', x, 1, lift)
  const top = CLAWD_TOP - lift
  put(c, x + 4, top + 1, 0xd97757); put(c, x + 9, top + 1, 0xd97757)
  for (let k = 0; k < 4; k++) {
    const life = (m.t / 1500 + k / 4) % 1
    g.push({ x: x + 1 + k * 4, row: 5 - Math.floor(life * 5), ch: k % 2 ? '*' : '·', fg: mix(0x9ee8ff, 0x1a1c24, life * 0.6) })
  }
  ground(c)
}

/** A spray bottle: pumped bursts of fine mist drift onto a fern, leaving dew drops. */
const misting: Draw = (c, m) => {
  const ox = spot(c.W, 0.25) - 10
  const { hand } = clawd(c, m.t, 'pan', ox)
  const spraying = m.t % 1500 < 800
  rect(c, hand[0] + 1, hand[1] - 2, 3, 4, 0xa8d4f0); rect(c, hand[0] + 1, hand[1] - 3, 3, 1, 0x4a7ab0); put(c, hand[0] + 4, hand[1] - 3, 0x4a7ab0)
  const nx = hand[0] + 5
  const px = hand[0] + 24
  rect(c, px - 3, 12, 7, 3, 0x9a4a2a); rect(c, px - 4, 11, 9, 1, 0xb8603a)
  for (const [dx, dy] of [[-3, -3], [-1, -5], [1, -5], [3, -3], [0, -3], [-2, -1], [2, -1]] as const) { line(c, px, 11, px + dx, 11 + dy, 0x4f9a3a); put(c, px + dx, 11 + dy, 0x6ab84f) }
  const beads = Math.min(5, Math.floor((m.t % 6000) / 1000))
  for (const [dx, dy] of [[-3, -3], [3, -3], [-1, -5], [1, -5], [0, -3]].slice(0, beads) as [number, number][]) put(c, px + dx, 11 + dy + 1, 0xbfe9ff)
  if (spraying) for (let k = 0; k < 26; k++) {
    const life = ((m.t % 1500) / 800 + rnd(k, 1)) % 1
    const spread = (rnd(k, 2) - 0.5) * life * 9
    put(c, nx + life * (px - nx - 3), 9 + spread + life * life * 3, mix(0xdfeaff, 0x1a1c24, life * 0.55))
  }
  ground(c)
}

/** A medical nebulizer: compressor, tube and mask; Clawd breathes in a rhythm, puffing vapour out. */
const nebulizing: Draw = (c, m) => {
  const mx = spot(c.W, 0.3)
  rect(c, mx - 4, 10, 9, 5, 0xdfe7ee); rect(c, mx - 4, 10, 9, 1, 0xaab4c0)
  put(c, mx - 2, 12, 0xd94f4f); put(c, mx, 12, 0x6ad94f); rect(c, mx + 2, 12, 2, 2, 0x4a7ab0)
  const ox = mx + 22
  const breath = Math.floor(m.t / 1500) % 2
  clawd(c, m.t, 'float', ox, 1, 0)
  const top = CLAWD_TOP
  for (let k = 0; k <= 12; k++) {
    const s = k / 12
    put(c, lerp(mx + 5, ox + 3, s), lerp(11, top + 4, s) + Math.sin(Math.PI * s) * 3, 0xaed6e8)
  }
  rect(c, ox + 4, top + 3, 6, 2, 0xaed6e8); rect(c, ox + 5, top + 3, 4, 1, 0xdff3fa); put(c, ox + 6, top + 5, 0x6a9ab0)
  const w = (m.t % 1500) / 1500
  for (let k = 0; k < 8; k++) {
    const life = breath ? (w + k / 8) % 1 : 0
    if (breath || k < 2) put(c, ox + 7 + Math.sin(life * 6 + k) * (1 + life * 3) + 3 * life, top + 2 - life * 9 - (breath ? 0 : k), mix(0xd8f2ff, 0x1a1c24, life * 0.7))
  }
  if (!breath) for (let k = 0; k < 5; k++) put(c, mx + 1 + Math.sin(m.t / 200 + k) * 2, 8 - ((m.t / 100 + k * 3) % 8), 0x7fa6b6)
  ground(c)
}

/** Clawd circles a blue planet, passing behind it and in front, trailing a dotted orbit. */
const orbiting: Draw = (c, m) => {
  const cx = spot(c.W, 0.5)
  const rx = Math.min(24, c.W / 2 - 9)
  for (let k = 0; k < c.W / 4; k++) put(c, rnd(k, 1) * c.W, rnd(k, 3) * 14, 0x5a6478)
  for (let k = 0; k < 44; k++) { const a = (k / 44) * Math.PI * 2; put(c, cx + Math.cos(a) * rx, 7.5 + Math.sin(a) * 3, 0x2e3342) }
  const a = (m.t / 6000) * Math.PI * 2
  const near = Math.sin(a) > 0
  const draw = () => clawd(c, m.t, 'float', cx - 7 + Math.cos(a) * rx, Math.sin(a) < 0 ? 1 : -1, Math.round(4 - 3 * Math.sin(a)))
  if (!near) draw()
  for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
    if (dx * dx + dy * dy > 18) continue
    const lit = (dx + dy) / 8
    put(c, cx + dx, 7 + dy, mix(dy % 3 === 0 ? 0x4fa36a : 0x3f7fd9, lit < 0 ? 0xcfe8ff : 0x0e1f3a, Math.abs(lit) * 0.8))
  }
  if (near) draw()
}

/** A bearded thinker in a laurel between two Greek columns, pacing; big ideas rise overhead. */
const philosophizing: Draw = (c, m, g) => {
  const l = Math.round(c.W * 0.1)
  const r = Math.round(c.W * 0.9)
  for (const x of [l, r]) {
    rect(c, x - 2, 1, 5, 1, 0xe8e4d8); rect(c, x - 1, 2, 3, 12, 0xd2cebf); rect(c, x - 2, 14, 5, 1, 0xe8e4d8)
    for (let y = 3; y < 13; y += 2) put(c, x, y, 0xb2ae9f)
  }
  const at = along([{ x: l + 6, stay: 2200, pose: 'float' }, { x: r - 20, stay: 2200, pose: 'float' }], m.t)
  const ox = Math.round(at.x)
  clawd(c, m.t, at.pose, ox, at.facing)
  rect(c, ox + 4, CLAWD_TOP + 4, 6, 1, 0xf4f4f4); rect(c, ox + 5, CLAWD_TOP + 5, 4, 1, 0xf4f4f4)
  for (let i = 3; i <= 10; i++) put(c, ox + i, CLAWD_TOP - 1, i % 2 ? 0x4f9a3a : 0x6ab84f)
  const k = Math.floor(m.t / 1400)
  const life = (m.t % 1400) / 1400
  g.push({ x: ox + 7 + Math.round(Math.sin(m.t / 500) * 2), row: 3 - Math.floor(life * 3), ch: '?∞∃≠∴'[k % 5]!, fg: mix(0xffe066, 0x1a1c24, life * 0.6) })
  ground(c)
}

/** Cat ears and a wiggle: Clawd stalks a mouse, springs onto it, then saunters back. */
const pouncing: Draw = (c, m, g) => {
  const x0 = Math.round(c.W * 0.1)
  const mx = x0 + 13 + Math.min(40, Math.round(c.W * 0.35))
  const p = m.t % 6000
  const land = mx - 13
  let ox = x0
  let pose: Pose = 'float'
  let lift = 0
  let facing: 1 | -1 = 1
  if (p < 2400) ox = x0 + (p > 1400 ? Math.floor(p / 110) % 2 : 0)
  else if (p < 3200) { const s = (p - 2400) / 800; ox = lerp(x0, land, s); lift = Math.round(Math.sin(Math.PI * s) * 7); pose = 'pan' }
  else if (p < 4400) { ox = land; pose = 'pan' }
  else { ox = lerp(land, x0, ease((p - 4400) / 1600)); pose = 'walk'; facing = -1 }
  const mouseUp = p > 600 && p < 3200 || p > 3600 && p < 4400
  if (mouseUp) sprite(c, ['.m.m.', 'mmmmm', 'kmmmm', '.l.l.'], { m: 0xb8b2a8, k: 0xe88aa0, l: 0x8a847a }, mx + (p < 3200 ? Math.round(Math.sin(p / 150)) : 0), GROUND - 4)
  clawd(c, m.t, pose, ox, facing, lift)
  const top = CLAWD_TOP - lift
  for (const [dx, dy] of [[2, -1], [3, -1], [3, -2], [11, -1], [10, -1], [10, -2]] as const) put(c, ox + dx, top + dy, CLAWD)
  if (p >= 3200 && p < 3900) {
    for (let k = 0; k < 6; k++) put(c, land + 10 + Math.cos(k) * ((p - 3200) / 60), GROUND - 1 - Math.abs(Math.sin(k)) * 3, 0xb8b2a8)
    g.push({ x: land + 8, row: 3, ch: '!', fg: 0xffe066 })
  }
  ground(c, 0x2d4a2b)
}

/** Slow household chores: straighten a picture, check a mug on the shelf, sweep the floor. */
const puttering: Draw = (c, m) => {
  const a = Math.round(c.W * 0.2)
  const b = Math.round(c.W * 0.5)
  const d = Math.round(c.W * 0.8)
  const at = along([{ x: a - 7, stay: 2000, pose: 'hammer' }, { x: b - 7, stay: 2000, pose: 'pan' }, { x: d - 14, stay: 2200, pose: 'float' }], m.t)
  const cycle = m.t % (4000 + 2000 + 2200 + 3000)
  const crooked = cycle < 900 || at.stop !== 0
  rect(c, a - 4, 1, 9, 6, 0x6b4a2c); rect(c, a - 3, 2, 7, 4, 0x6aa4c8); put(c, a + 1, 4, 0xe8e4d8)
  if (crooked) { put(c, a - 4, 7, 0x6b4a2c); put(c, a + 4, 0, 0x1a1c24) }
  rect(c, b - 6, 7, 13, 1, WOOD); rect(c, b - 2, 4, 4, 3, 0xe8e4d8); rect(c, b + 2, 5, 1, 1, 0xe8e4d8)
  for (let k = 0; k < 3; k++) put(c, b - 1 + k + Math.sin(m.t / 300 + k) * 0.8, 3 - ((m.t / 200 + k * 2) % 3), 0x9aa0b0)
  const sweeping = at.stop === 2 && at.still
  const ox = sweeping ? Math.round(at.x + Math.sin(m.t / 200) * 4) : Math.round(at.x)
  const { hand } = clawd(c, m.t, at.pose, ox, at.facing)
  if (sweeping) {
    line(c, hand[0], hand[1], hand[0] + 3, GROUND - 1, WOOD); rect(c, hand[0] + 2, GROUND - 1, 4, 1, 0xd9c84f)
    for (let k = 0; k < 5; k++) put(c, hand[0] + 6 + k + ((m.t / 100) % 3), GROUND - 1 - ((m.t / 150 + k) % 3), 0x9a8f78)
  }
  if (at.pose === 'hammer' && at.still) rect(c, hand[0] + 1, hand[1] - 2, 2, 1, 0xe8e4d8)
  ground(c, 0x3a2f24)
}

/** A warping wireframe net of splines, tuned by a crank, its nodes pulsing. */
const reticulating: Draw = (c, m) => {
  const x0 = Math.round(c.W * 0.38)
  const sp = clamp((c.W - x0 - 4) / 6, 3, 6)
  const node = (i: number, j: number): [number, number] => [x0 + i * sp + Math.sin(m.t / 500 + j * 0.9 + i * 0.5) * 1.5, 2 + j * 3 + Math.cos(m.t / 400 + i * 0.7) * 1.2]
  for (let j = 0; j < 4; j++) for (let i = 0; i < 7; i++) {
    const [x, y] = node(i, j)
    if (i < 6) { const [nx, ny] = node(i + 1, j); line(c, x, y, nx, ny, 0x2f8f86) }
    if (j < 3) { const [nx, ny] = node(i, j + 1); line(c, x, y, nx, ny, 0x2f8f86) }
  }
  for (let j = 0; j < 4; j++) for (let i = 0; i < 7; i++) {
    const [x, y] = node(i, j)
    put(c, x, y, (i + j * 2 - Math.floor(m.t / 150)) % 9 === 0 ? 0xffffff : 0x4fd9c8)
  }
  const ox = x0 - 16
  const { hand } = clawd(c, m.t, 'crank', ox)
  line(c, hand[0], hand[1], x0 - 2, 11, 0xb08d57)
  ground(c)
}

/** Nervous sprints: freezes, bolts in short bursts kicking up dust, with a startled "!". */
const scurrying: Draw = (c, m, g) => {
  const cycleMs = 900
  const dist = 16
  const n = Math.floor(m.t / cycleMs)
  const s = (m.t % cycleMs) / cycleMs
  const K = Math.ceil((c.W + 18) / dist)
  const mv = clamp(s / 0.34)
  const x = (n % K) * dist + ease(mv) * dist - 16
  const moving = s < 0.34
  if (moving) for (let k = 0; k < 4; k++) rect(c, x - 3 - k * 3, 9 + k, 3 - (k >> 1), 1, mix(0x9aa0b0, 0x1a1c24, 0.3 + k * 0.15))
  clawd(c, m.t, moving ? 'walk' : 'float', x)
  if (s < 0.5) for (let k = 0; k < 5; k++) put(c, x - 1 - k * 1.5 * s * 6, GROUND - 1 - ((k * 7) % 3) * (s * 5), 0x7a6a50)
  if (!moving) g.push({ x: Math.round(x) + 7, row: 3, ch: s < 0.7 ? '!' : '?', fg: 0xffe066 })
  for (let k = 0; k < c.W; k += 8) put(c, k + Math.floor(rnd(k, 2) * 4), GROUND - 1, 0x5a4a30)
  ground(c, 0x4a3a2a)
}

/** At an easel in a beret: charcoal lines of a mountain scene, then washes of colour fill in. */
const sketching: Draw = (c, m) => {
  const ex = spot(c.W, 0.62)
  const p = m.t % 7000
  const cx = ex - 8
  rect(c, cx - 1, 0, 19, 12, WOOD); rect(c, cx, 1, 17, 10, 0xf2efe6)
  line(c, ex - 5, 12, ex - 8, GROUND, WOOD); line(c, ex + 5, 12, ex + 8, GROUND, WOOD); line(c, ex, 12, ex, GROUND, WOOD)
  const ridge: [number, number][] = [[0, 6], [3, 3], [5, 5], [8, 0], [11, 4], [13, 3], [16, 6]]
  const rY = (x: number) => { const i = ridge.findIndex(([px]) => px >= x); if (i <= 0) return ridge[0]![1]; const [ax, ay] = ridge[i - 1]!; const [bx, by] = ridge[i]!; return lerp(ay, by, (x - ax) / (bx - ax)) }
  const fill = ease((p - 3800) / 2000)
  for (let x = 0; x < Math.round(fill * 17); x++) {
    const ry = Math.round(rY(x))
    rect(c, cx + x, 2, 1, ry, 0xbfe3f5)
    rect(c, cx + x, 2 + ry, 1, 7 - ry, 0x8a7fb0)
    rect(c, cx + x, 9, 1, 2, 0x7fb069)
  }
  if (fill > 0.5) rect(c, cx + 2, 3, 2, 2, GOLD)
  const f = ease(p / 3400)
  const art: Stroke[] = [
    { pts: ridge.map(([x, y]) => [x, y + 2] as [number, number]), col: 0x3a3a46 },
    { pts: [[0, 9], [16, 9]], col: 0x3a3a46 },
    { pts: [[1, 3], [2, 2], [3, 3], [2, 4], [1, 3]], col: 0x3a3a46 },
  ]
  const pen = strokes(c, art, f, cx, 2)
  const ox = ex - 8 - 24
  const { hand } = clawd(c, m.t, 'pan', ox)
  const top = CLAWD_TOP
  rect(c, ox + 2, top - 1, 9, 1, 0x7a1f2e); rect(c, ox + 4, top - 2, 6, 1, 0x7a1f2e); put(c, ox + 6, top - 3, 0x7a1f2e)
  if (p < 3800) line(c, hand[0] + 1, hand[1], pen[0], pen[1], 0x3a3a46)
  ground(c)
}

/** Sprouts pop up wherever Clawd steps, bounce, and later sink away behind him. */
const sprouting: Draw = (c, m) => {
  const cyc = 6000
  const span = c.W + 18
  const x = ((m.t % cyc) / cyc) * span - 16
  for (let xi = 5; xi < c.W - 2; xi += 6) {
    const pass = ((xi - 7 + 16) / span) * cyc
    const age = (((m.t - pass) % cyc) + cyc) % cyc
    if (age > 4800) continue
    const up = clamp(age / 450)
    const down = clamp((age - 4000) / 800)
    const h = Math.round((up < 1 ? up * 1.15 : 1) * 5 * (1 - down)) + (up >= 1 && age < 700 ? 0 : 0)
    if (h < 1) continue
    for (let k = 1; k <= h; k++) put(c, xi, GROUND - k, 0x4f9a3a)
    if (h >= 3) { put(c, xi - 1, GROUND - h, 0x8fd46a); put(c, xi + 1, GROUND - h - 1, 0x8fd46a) }
    else put(c, xi, GROUND - h - 1, 0x8fd46a)
    put(c, xi - 1, GROUND, 0x7a5a38)
  }
  clawd(c, m.t, 'walk', x)
  ground(c, 0x4a3a2a)
}

/** A synth: Clawd plays the keys, the lit key follows his tune and a scope shows the wave morph. */
const synthesizing: Draw = (c, m, g) => {
  const kx = spot(c.W, 0.55) - 10
  rect(c, kx - 1, 10, 23, 5, 0x24262e)
  const tune = [0, 2, 4, 2, 5, 4, 2, 1]
  const lit = tune[Math.floor(m.t / 280) % 8]!
  for (let i = 0; i < 7; i++) {
    rect(c, kx + i * 3, 11, 2, 4, i === lit ? 0x4fd9c8 : 0xe8e8e8)
    if ([0, 1, 3, 4, 5].includes(i)) rect(c, kx + i * 3 + 2, 11, 1, 2, 0x0e0e12)
  }
  rect(c, kx - 1, 1, 23, 8, 0x14202a); rect(c, kx, 2, 21, 6, 0x0b1a14)
  const shape = Math.floor(m.t / 2000) % 3
  for (let x = 0; x < 21; x++) {
    const ph = ((x + m.t / 80) / 7) % 1
    const v = shape === 0 ? Math.sin(ph * Math.PI * 2) : shape === 1 ? (ph < 0.5 ? 1 : -1) : 1 - 2 * ph
    put(c, kx + x, 5 - Math.round(v * 2), 0x6ad94f)
  }
  clawd(c, m.t, 'hammer', kx - 15)
  for (let k = 0; k < 3; k++) {
    const life = (m.t / 800 + k / 3) % 1
    g.push({ x: kx - 4 + k * 2, row: 4 - Math.floor(life * 4), ch: k % 2 ? '♫' : '♪', fg: [0x4fd9c8, 0xd94f8a, GOLD][k]! })
  }
}

/** The world flips: Clawd walks the meadow, then everything - rain included - turns upside down. */
const topsyTurvying: Draw = (c, m, g) => {
  const s = canvas(c.W)
  const at = along([{ x: 4, stay: 300, pose: 'float' }, { x: Math.round(c.W * 0.55), stay: 300, pose: 'float' }], m.t)
  for (let k = 0; k < c.W; k += 6) {
    const fx = k + Math.floor(rnd(k, 5) * 4)
    put(s, fx, GROUND - 1, 0x3d7a3a)
    put(s, fx, GROUND - 2, [0xff9ec0, GOLD, 0xffffff, 0xb48cff][Math.floor(rnd(k, 6) * 4)]!)
  }
  rect(s, c.W - 8, 2, 3, 3, 0xffd54f)
  for (let d = 0; d < 6; d++) put(s, Math.round(c.W * (0.1 + d * 0.16)) + 3, ((m.t / 45 + d * 5) % 14), 0x7fa6d6)
  clawd(s, m.t, at.pose, at.x, at.facing)
  ground(s, 0x2d4a2b)
  const p = m.t % 6000
  const strobe = (p >= 2700 && p < 3000) || p >= 5700
  const flip = strobe ? Math.floor(m.t / 70) % 2 === 1 : p >= 3000
  for (let y = 0; y < PH; y++) for (let x = 0; x < c.W; x++) {
    const v = s.px[y * c.W + x]!
    if (v !== DEF) c.px[(flip ? PH - 1 - y : y) * c.W + x] = v
  }
  if (strobe) for (let k = 0; k < 5; k++) g.push({ x: Math.floor(rnd(k, 8) * c.W), row: Math.floor(rnd(k, 9) * 8), ch: '@%*&?'[Math.floor(rnd(k, Math.floor(m.t / 60)) * 5)]!, fg: SPARKS[k % 4]! })
}

/** A red carpet rolls out ahead of Clawd as he pushes the roll along, then rewinds. */
const unfurling: Draw = (c, m, g) => {
  const x0 = 3
  const xEnd = Math.max(x0 + 24, c.W - 26)
  const p = m.t % 7000
  const out = ease(p / 3600) - ease((p - 5200) / 1600)
  const ox = lerp(x0, xEnd, out)
  const facing = p > 5200 ? -1 : 1
  const rx = Math.round(ox) + 15
  rect(c, x0 + 15, GROUND - 1, rx - x0 - 15, 2, 0xb3202a)
  for (let x = x0 + 15; x < rx; x += 2) put(c, x, GROUND - 1, GOLD)
  const { hand } = clawd(c, m.t, 'pan', ox, 1)
  void hand
  rect(c, rx, 11, 3, 4, 0xb3202a); rect(c, rx, 11, 3, 1, 0x8a1a22)
  put(c, rx + 1, 12 + (Math.floor(ox * 2) % 2), GOLD); put(c, rx + 2, 14, GOLD)
  if (p > 3600 && p < 5200) for (let k = 0; k < 4; k++) g.push({ x: rx + 3 + k * 2, row: 4 - Math.floor(((m.t / 90 + k * 3) % 8) / 2), ch: '*', fg: SPARKS[k]! })
  void facing
}

/** A mystery contraption that re-rolls into a new random thingamajig every beat while Clawd fiddles. */
const whatchamacalliting: Draw = (c, m, g) => {
  const gx = spot(c.W, 0.58)
  const n = Math.floor(m.t / 1300)
  const age = m.t % 1300
  const pal = [0xd94f4f, 0x4fa3d9, 0xd9c84f, 0x6ad94f, 0xb48cff, 0xff9e3d]
  const pick = (k: number, len: number) => Math.floor(rnd(k, n) * len)
  const pa = pal[pick(1, 6)]!
  const pb = pal[(pick(1, 6) + 1 + pick(2, 5)) % 6]!
  const pals = { a: pa, b: pb, w: 0xf4f4f4, g: STEEL }
  const bodies = [['aaaaaaa', 'aabbbaa', 'aabbbaa', 'aaaaaaa'], ['.aaaaa.', 'abbbbba', 'abbbbba', '.aaaaa.'], ['..aaa..', '.aaaaa.', 'aabbbaa', 'aaaaaaa'], ['...a...', '..aaa..', '.aabaa.', 'aaaaaaa']]
  const tops = [['..w..', '..g..', '..g..'], ['aaaaa', '.aaa.', '..a..'], ['.gg.', 'g..g', '.gg.', 'g..g'], ['b...b', '.bbb.', '..g..']]
  const sides = [['ggg', '..g'], ['.b.', 'bab', '.b.'], ['bb', 'b.']]
  rect(c, gx - 6, 12, 13, 3, 0x4a4f5c); rect(c, gx - 6, 12, 13, 1, STEEL)
  const body = bodies[pick(3, 4)]!
  const top = tops[pick(4, 4)]!
  const side = sides[pick(5, 3)]!
  sprite(c, body, pals, gx - 3, 12 - body.length)
  sprite(c, top, pals, gx - 2, 12 - body.length - top.length)
  sprite(c, side, pals, gx + 4, 12 - body.length)
  if (age < 260) for (let k = 0; k < 10; k++) put(c, gx + Math.cos(k * 0.63) * (age / 28 + 2), 7 + Math.sin(k * 0.63) * (age / 40 + 1), mix(0xdfe7ff, 0x1a1c24, age / 260))
  const ox = gx - 22
  const { hand } = clawd(c, m.t, 'hammer', ox)
  rect(c, hand[0] + 1, hand[1] - (m.t % 700 >= 450 ? 0 : 2), 2, 1, STEEL)
  g.push({ x: ox + 7, row: 3, ch: '?!'.charAt(n % 2 && age > 650 ? 1 : 0), fg: age > 650 && n % 2 ? 0xffe066 : 0xc8ccd8 })
  ground(c)
}

/** A cowboy hat, a spinning lasso, a throw: a calf is roped, hauled in, then let go to trot off. */
const wrangling: Draw = (c, m) => {
  const x0 = Math.round(c.W * 0.1)
  const F = Math.min(c.W - 12, x0 + 14 + 46)
  const N = F - 17
  const p = m.t % 7000
  let cow = F
  let rope: 'twirl' | 'throw' | 'taut' | 'drop' = 'twirl'
  let back = false
  if (p >= 2600 && p < 3100) rope = 'throw'
  else if (p >= 3100 && p < 4500) { rope = 'taut'; cow = lerp(F, N, ease((p - 3100) / 1400)) }
  else if (p >= 4500 && p < 5000) { rope = 'drop'; cow = N }
  else if (p >= 5000) { cow = lerp(N, F, ease((p - 5000) / 2000)); back = true }
  const trot = (rope === 'taut' || back) && Math.floor(m.t / 140) % 2
  sprite(c, ['kk......', 'kbbbbbbt', 'bbkbbkbb', 'bbbbbbbb', trot ? '.l.l.l.l' : 'l.l..l.l'], { b: 0xf2f2f2, k: 0x2a2a30, t: 0xd8c8c8, l: 0x6a6a70 }, cow, GROUND - 5, back)
  const { hand } = clawd(c, m.t, 'umbrella', x0)
  const top = CLAWD_TOP
  rect(c, x0 + 1, top - 1, 12, 1, WOOD); rect(c, x0 + 4, top - 3, 6, 2, WOOD); rect(c, x0 + 4, top - 2, 6, 1, 0x4a2a14)
  const rope_c = 0xd9b36a
  if (rope === 'twirl') {
    for (let k = 0; k < 16; k++) {
      const a = m.t / 130 + (k / 16) * Math.PI * 2
      put(c, x0 + 7 + Math.cos(a) * 7, 4 + Math.sin(a) * 1.6, rope_c)
    }
    line(c, hand[0], hand[1], x0 + 7 + 6, 4, rope_c)
  } else if (rope === 'throw' || rope === 'taut') {
    const s = rope === 'throw' ? ease((p - 2600) / 500) : 1
    const tx = lerp(hand[0], cow + 1, s)
    const ty = lerp(hand[1], GROUND - 5, s) - (rope === 'throw' ? Math.sin(Math.PI * s) * 4 : 0)
    line(c, hand[0], hand[1], tx, ty, rope_c)
    for (let k = 0; k < 12; k++) put(c, tx + Math.cos((k / 12) * Math.PI * 2) * 2, ty + Math.sin((k / 12) * Math.PI * 2) * 1.5, rope_c)
  } else if (rope === 'drop') {
    const s = ease((p - 4500) / 500)
    const tx = lerp(cow + 1, hand[0], s)
    line(c, hand[0], hand[1], tx, lerp(GROUND - 5, hand[1], s) + Math.sin(Math.PI * s) * 2, rope_c)
  }
  ground(c, 0x2d4a2b)
}

export const SCENES: Record<string, Draw> = {
  accomplishing,
  "beboppin'": beboppin,
  boondoggling,
  calculating,
  channeling,
  combobulating,
  cooking,
  deciphering,
  doodling,
  enchanting,
  flibbertigibbeting,
  frolicking,
  germinating,
  hashing,
  ideating,
  ionizing,
  levitating,
  misting,
  nebulizing,
  orbiting,
  philosophizing,
  pouncing,
  puttering,
  reticulating,
  scurrying,
  sketching,
  sprouting,
  synthesizing,
  'topsy-turvying': topsyTurvying,
  unfurling,
  whatchamacalliting,
  wrangling,
}
