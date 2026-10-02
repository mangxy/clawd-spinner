import { CLAWD, CLAWD_TOP, DEF, GROUND, SPARKS, along, canvas, clawd, ground, mix, put, rect, rnd, spot, sprite, wave, type Canvas, type Draw } from '../acts'

// Words: Beaming, Boogieing, Burrowing, Cerebrating, Cogitating, Contemplating, Cultivating, Doing, Embellishing, Flambéing, Forming, Generating, Harmonizing, Hyperspacing, Infusing, Leavening, Metamorphosing, Mustering, Onioning, Perusing, Pontificating, Propagating, Recombobulating, Schlepping, Skedaddling, Spinning, Symbioting, Tomfoolering, Undulating, Warping, Working

const clamp = (k: number) => Math.min(1, Math.max(0, k))
const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a))
const ease = (k: number) => k * k * (3 - 2 * k)
const lerp = (a: number, b: number, k: number) => a + (b - a) * k
const GREEN = 0x4f9a3a
const WOOD = 0x7a4a24

function line(c: Canvas, x0: number, y0: number, x1: number, y1: number, col: number) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1)
  for (let i = 0; i <= n; i++) put(c, lerp(x0, x1, i / n), lerp(y0, y1, i / n), col)
}

function disc(c: Canvas, cx: number, cy: number, r: number, col: number) {
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.5) put(c, cx + x, cy + y, col)
}

const beaming: Draw = (c, m) => {
  const cx = spot(c.W, 0.5)
  const T = m.t % 6400
  const up = ease(seg(T, 1400, 3000)) - ease(seg(T, 4200, 5600))
  const on = T > 700 && T < 5800
  const sway = Math.round(Math.sin(m.t / 500) * 1.4)
  for (let k = 0; k < c.W / 7; k++) if ((Math.floor(m.t / 400) + k) % 5) put(c, rnd(k, 1) * c.W, rnd(k, 2) * 8, 0x8a91b0)
  if (on) {
    for (let y = 4; y < GROUND; y++) {
      const half = 2 + Math.floor((y - 4) * 0.5)
      for (let x = -half; x <= half; x++) {
        const shimmer = (x * 5 + y * 3 + Math.floor(m.t / 90)) % 6 === 0
        put(c, cx + sway + x, y, mix(shimmer ? 0xf4ffe8 : 0xa8f0b8, 0x2a5a44, (Math.abs(x) / (half + 1)) * 0.8 + (y - 4) / 40))
      }
    }
    for (let k = 0; k < 6; k++) put(c, cx + sway + (rnd(k, 5) - 0.5) * 6, 14 - (((T / 700) + k / 6) % 1) * 10, 0xffffff)
  }
  clawd(c, m.t, 'float', cx - 7 + sway, 1, Math.round(up * 5))
  const light = Math.floor(m.t / 150) % 2 ? 0xffe066 : 0xff8a3e
  sprite(c, ['...ddddd...', '.sssssssss.', 'sysysysysys', '..sssssss..'], { d: 0x9fd8ff, s: 0xb0b4c0, y: light }, cx + sway - 5, 0)
}

const boogieing: Draw = (c, m) => {
  const cx = spot(c.W, 0.5)
  const beat = Math.floor(m.t / 300)
  const hop = -(beat % 2)
  const cols = [0xd94f8a, 0x4fa3d9, 0xd9c84f, 0x6ad94f]
  for (let k = 0; k < 18; k++) {  // the ball's light spots crawl round the room
    const x = (((rnd(k, 1) * c.W + (k % 2 ? 1 : -1) * m.t / 40) % c.W) + c.W) % c.W
    const y = 1 + rnd(k, 2) * (GROUND - 3)
    put(c, x, y, cols[(k + beat) % 4]!)
    if (k % 3 === 0) put(c, x + 1, y, cols[(k + beat) % 4]!)
  }
  put(c, cx, 0, 0x8a919b)
  for (let dy = 0; dy < 5; dy++) for (let dx = -2; dx <= 2; dx++) if (Math.abs(dx) + Math.abs(dy - 2) < 4) put(c, cx + dx, 1 + dy, (dx + dy + Math.floor(m.t / 150)) % 2 ? 0xdfe7ff : 0x8a919b)
  const ox = cx - 7
  clawd(c, m.t, 'dance', ox, 1)
  const hair = 0x4a2a18
  sprite(c, ['..hhhhhhhh..', '.hhhhhhhhhh.', 'hhhhhhhhhhhh'], { h: hair }, ox + 1, CLAWD_TOP + hop - 3)
  rect(c, ox + 1, CLAWD_TOP + hop, 1, 3, hair); rect(c, ox + 12, CLAWD_TOP + hop, 1, 3, hair)
  rect(c, ox + 3, CLAWD_TOP + hop + 1, 8, 2, 0x0b0b10)  // shades
  put(c, ox + 4, CLAWD_TOP + hop + 1, 0x4a4f63)
  ground(c, 0x3a2d4a)
}

const burrowing: Draw = (c, m) => {
  const P = 5200
  const n = Math.floor(m.t / P)
  const T = m.t % P
  const a = spot(c.W, 0.3)
  const b = spot(c.W, 0.7)
  const [src, dst] = n % 2 ? [b, a] : [a, b]
  const soil = 0x6b4a2b
  const dark = 0x4a3320
  let x = -99
  let sink = 0
  if (T < 2000) { x = src; sink = ease(seg(T, 600, 2000)) * 7 }
  else if (T >= 3000) { x = dst; sink = (1 - ease(seg(T, 3000, 4300))) * 7 }
  if (x > -99) clawd(c, m.t, T < 2000 || sink > 0.5 ? 'hammer' : 'float', x - 7, 1, -Math.round(sink))
  rect(c, 0, 14, c.W, 1, 0x4f7a3a); rect(c, 0, 15, c.W, 1, soil)
  for (const hx of [a, b]) sprite(c, ['..s..', '.sss.', 'sdsss'], { s: soil, d: dark }, hx + 8, 12)
  if ((T > 400 && T < 3000)) rect(c, src - 3, 14, 7, 2, 0x2a1d12)
  if (T > 2800 && T < 4600) rect(c, dst - 3, 14, 7, 2, 0x2a1d12)
  const spray = (hx: number, t0: number) => {
    for (let k = 0; k < 10; k++) {
      const life = (((T - t0) / 700) + k / 10) % 1
      put(c, hx + (rnd(k, 3) - 0.5) * 2 * life * 10, 13 - Math.sin(life * Math.PI) * 7, k % 3 ? soil : dark)
    }
  }
  if (T > 500 && T < 2100) spray(src, 500)
  if (T > 3000 && T < 4400) spray(dst, 3000)
  if (T >= 2000 && T < 3000) {  // the tunnel's ridge travels underground
    const rx = lerp(src, dst, seg(T, 2000, 3000))
    const dir = dst > src ? 1 : -1
    for (let j = 0; j < 4; j++) { put(c, rx - dir * j * 3, 13, soil); put(c, rx - dir * j * 3, 12, j < 2 ? soil : dark) }
  }
}

const cerebrating: Draw = (c, m) => {
  const cx = spot(c.W, 0.5)
  const pulse = wave(m.t, 900)
  clawd(c, m.t, 'float', cx - 7)
  const art = ['...ppppppp...', '.pppfpppfppp.', 'ppfpppfpppfpp', 'pppfpppfpppfp', '.pppfppfpppp.', '..ppppppppp..', '.....sss.....']
  sprite(c, art, { p: mix(0xf09ab8, 0xffc6d8, pulse), f: mix(0xc86a88, 0xe08aa8, pulse), s: 0x9aa0b0 }, cx - 6, 1)
  const f = Math.floor(m.t / 110)
  for (let k = 0; k < 5; k++) if (rnd(k, f) > 0.5) put(c, cx - 5 + Math.floor(rnd(k, 1) * 11), 2 + Math.floor(rnd(k, 2) * 5), 0xfff6a0)
  if (Math.floor(m.t / 150) % 2) { put(c, cx, 8, 0xffe066); put(c, cx + 1, 8, 0xffe066) }
  for (let k = 0; k < 3; k++) {  // thought ripples either side
    const life = ((m.t / 1100) + k / 3) % 1
    put(c, cx - 8 - life * 5, 4, mix(0xf09ab8, 0x1a1c24, life)); put(c, cx + 8 + life * 5, 4, mix(0xf09ab8, 0x1a1c24, life))
  }
  ground(c)
}

const cogitating: Draw = (c, m) => {
  const T = m.t % 7000
  const bx = spot(c.W, 0.45)
  const bw = Math.min(30, c.W - bx - 3)
  rect(c, bx, 1, bw, 11, WOOD); rect(c, bx + 1, 2, bw - 2, 9, 0x2f4a3a); rect(c, bx, 12, bw, 1, WOOD)
  const sweep = bx + 2 + seg(T, 6200, 6900) * bw
  for (let r = 0; r < 4; r++) {
    const len = Math.min(8 + Math.floor(rnd(r, 7) * 10), bw - 5)
    const n = Math.round(clamp((T - 500 - r * 1300) / 1200) * len)
    for (let i = 0; i < n; i++) {
      const x = bx + 2 + i
      if (rnd(i, r + 10) > 0.3 && x >= sweep) put(c, x, 3 + r * 2 + (i % 5 === 2 ? 1 : 0), 0xf0f0e8)
    }
    if (n > 0 && n < len) { put(c, bx + 2 + n, 3 + r * 2, 0xffffff); put(c, bx + 3 + n, 2 + r * 2, 0xb0b0a8) }
  }
  clawd(c, m.t, 'hammer', bx - 14)
  ground(c)
}

const contemplating: Draw = (c, m) => {
  const cx = spot(c.W, 0.35)
  const mx = spot(c.W, 0.72)
  for (let k = 0; k < c.W / 5; k++) if ((Math.floor(m.t / 500) + k) % 4) put(c, rnd(k, 1) * c.W, rnd(k, 2) * 10, 0xdfe7ff)
  disc(c, mx, 5, 4, 0xf4efc8); disc(c, mx + 2, 4, 3, DEF)
  const T = m.t % 7000
  if (T > 4200 && T < 5000) {
    const k = seg(T, 4200, 5000)
    for (let i = 0; i < 6; i++) put(c, c.W * 0.9 - k * c.W * 0.4 + i, 1 + k * 8 - i * 0.5, mix(0xffffff, 0x1a1c24, i / 6))
  }
  sprite(c, ['..rrrrrrrr..', '.rrrrrrrrrr.', 'rrrrrrrrrrrr'], { r: 0x5a5f70 }, cx - 6, 13)
  clawd(c, m.t, 'float', cx - 7, 1, 2)
  for (let k = 0; k < 3; k++) {  // a slow thought drifts toward the moon
    const life = ((m.t / 1500) + k / 3) % 1
    put(c, cx + 8 + (mx - cx - 8) * life * 0.8, 8 - life * 4 - Math.sin(life * 6) * 0.6, mix(0xc8ccd8, 0x1a1c24, life * 0.7))
  }
}

const cultivating: Draw = (c, m) => {
  const x = ((m.t * 0.016) % (c.W + 24)) - 14
  const hx = x + 14
  rect(c, 0, 13, c.W, 3, 0x5a3d24)
  for (let px = 0; px < c.W; px++) {
    if (px < hx) {
      if (px % 4 < 2) put(c, px, 12, 0x6b4a2b)
      if (px % 8 === 3) for (let h = 0; h < Math.min(4, Math.floor((hx - px) / 5)); h++) put(c, px, 11 - h, GREEN)
    } else if (rnd(px, 4) > 0.8) put(c, px, 12, 0x3d5a3a)
  }
  const { hand } = clawd(c, m.t, 'walk', x)
  const bx = hand[0] + 5 + Math.round(Math.sin(m.t / 220) * 1.5)
  line(c, hand[0], hand[1], bx, 12, WOOD)
  rect(c, bx, 12, 2, 1, 0x9aa0ab)
  for (let k = 0; k < 2; k++) put(c, bx + (rnd(k, Math.floor(m.t / 120)) - 0.2) * 4, 11 - rnd(k, 9) * 2, 0x6b4a2b)
}

const doing: Draw = (c, m) => {
  const P = 3400
  const n = Math.floor(m.t / P) % 4
  const T = m.t % P
  const a = spot(c.W, 0.2)
  const b = spot(c.W, 0.7)
  const slots: [number, number][] = [[-3, 12], [2, 12], [0, 9]]
  const box = (x: number, y: number, tape: number) => { rect(c, x - 2, y, 5, 3, 0xb08850); rect(c, x, y, 1, 3, tape) }
  const trip = n < 3
  const carrying = trip && T >= 500 && T < 2100
  const dropped = n === 3 ? 3 : n + (T >= 2100 ? 1 : 0)
  for (let i = 0; i < (carrying ? 2 : 3); i++) box(a + slots[i]![0], slots[i]![1], 0xd9c9a0)
  if (!(n === 3 && T > 3000)) for (let i = 0; i < dropped; i++) box(b + slots[i]![0], slots[i]![1], 0x6ad94f)
  let ox = a - 20
  let pose: 'float' | 'carry' | 'walk' | 'dance' = 'float'
  if (n === 3) pose = 'dance'
  else if (carrying) { ox = lerp(a - 20, b - 20, (T - 500) / 1600); pose = 'carry' }
  else if (T >= 2100 && T < 2600) ox = b - 20
  else if (T >= 2600) { ox = lerp(b - 20, a - 20, (T - 2600) / 800); pose = 'walk' }
  const { hand } = clawd(c, m.t, pose, ox)
  if (carrying) box(hand[0] + 1, hand[1] - 3, 0xd9c9a0)
  if (n === 3 && T < 2800) sprite(c, ['....g', '...g.', 'g.g..', '.g...'], { g: 0x6ad94f }, b - 2, 3)
  ground(c)
}

const embellishing: Draw = (c, m) => {
  const T = m.t % 8000
  const tx = spot(c.W, 0.62)
  const half = (j: number) => 1 + Math.floor(j * 0.45)
  for (let j = 0; j < 10; j++) rect(c, tx - half(j), 3 + j, 2 * half(j) + 1, 1, j % 2 ? 0x2f7a3a : 0x3a8f46)
  rect(c, tx - 1, 13, 3, 2, 0x6a4a2a)
  sprite(c, ['.y.', 'yyy'], { y: Math.floor(m.t / 300) % 3 ? 0xffe066 : 0xfff6c8 }, tx - 1, 1)
  const cols = [0xff4b3e, 0xffd54f, 0x4fa3d9, 0xd94f8a]
  const { hand } = clawd(c, m.t, 'hammer', tx - 20)
  for (let i = 0; i < 9; i++) {
    const j = 1 + i
    const gx = tx + Math.round((rnd(i, 4) - 0.5) * 2 * (half(j) - 0.5))
    const gy = 3 + j
    const at = 400 + i * 540
    if (T >= at && T < 7600) {
      put(c, gx, gy, cols[i % 4]!)
      if ((Math.floor(m.t / 250) + i) % 4 === 0) put(c, gx + 1, gy, 0xffffff)
    } else if (T >= at - 360 && T < at) put(c, lerp(hand[0] + 1, gx, (T - at + 360) / 360), lerp(hand[1], gy, (T - at + 360) / 360) - Math.sin(((T - at + 360) / 360) * Math.PI) * 2, cols[i % 4]!)
  }
  ground(c)
}

const flambeing: Draw = (c, m) => {
  const cx = spot(c.W, 0.45)
  const T = m.t % 5200
  const burst = seg(T, 2200, 2500) * (1 - seg(T, 3300, 4300))
  const ox = cx - 21 - Math.round(burst * 2)
  const { hand } = clawd(c, m.t, 'pan', ox)
  sprite(c, ['.wwwwww.', 'wwwwwwww', 'wwwwwwww', '.wwwwww.'], { w: 0xf4f4f4 }, ox + 3, CLAWD_TOP - 4)
  const px = hand[0] + 1
  rect(c, px - 1, 13, 9, 3, 0x4a4a54); rect(c, px, 12, 7, 1, 0x2a2a30)
  for (let i = 0; i < 6; i++) put(c, px + 1 + i, 12, rnd(i, Math.floor(m.t / 90)) > 0.4 ? 0x4fa3d9 : 0x2a2a30)
  rect(c, px, hand[1], 6, 1, 0x3a3a42)
  const fx = px + 3
  const H = (T > 1400 ? 2 : 0) + Math.round(burst * 11)
  for (let y = 1; y <= H; y++) {
    const u = y / (H + 2)
    const w = Math.max(0, Math.round((1.6 + burst * 2) * (1 - u) + rnd(y, Math.floor(m.t / 70)) * 0.8))
    const col = u < 0.25 ? 0xfff3c0 : u < 0.55 ? 0xffb02e : u < 0.85 ? 0xff5a2e : 0xb0301f
    rect(c, fx - w + Math.round(Math.sin(m.t / 80 + y) * u * 2), hand[1] - y, 2 * w + 1, 1, col)
  }
  if (T > 1000 && T < 2200) for (let k = 0; k < 3; k++) put(c, fx - 1 + k, hand[1] - 2 - ((m.t / 100 + k * 2) % 4), mix(0x9aa0b0, 0x1a1c24, 0.5))
  ground(c)
}

const forming: Draw = (c, m) => {
  const T = m.t % 7600
  const cx = spot(c.W, 0.62)
  const p = ease(seg(T, 600, 5000)) * (1 - ease(seg(T, 6400, 7200)))
  rect(c, cx - 6, 13, 13, 2, 0x55555f); rect(c, cx - 1, 12, 3, 1, 0x55555f)
  rect(c, cx - 8, 12, 17, 1, 0xa0a6b0)
  for (let i = -8; i <= 8; i++) if (((i + Math.floor(m.t / 70)) % 5 + 5) % 5 === 0) put(c, cx + i, 12, 0x6a707c)
  const h = 2 + p * 7
  for (let j = 0; j < Math.floor(h); j++) {
    const u = j / h
    const hw = Math.round(3.5 + p * (2.2 * Math.sin(u * Math.PI * 0.9) - 1.6 * u))
    for (let x = -hw; x <= hw; x++) {
      const light = ((x + Math.floor(m.t / 70)) % 5 + 5) % 5 === 0
      put(c, cx + x, 11 - j, Math.abs(x) >= hw ? 0x8a4a30 : light ? 0xd88a60 : 0xc06a45)
    }
  }
  const { hand } = clawd(c, m.t, 'pan', cx - 17)
  for (let k = 0; k < 2; k++) put(c, hand[0] + 2 + k, 10 + ((m.t / 110 + k * 2) % 3), 0x7fa6d6)
}

const generating: Draw = (c, m) => {
  const cx = spot(c.W, 0.25)
  const tx = spot(c.W, 0.7)
  const hy = 5
  rect(c, tx, hy, 1, GROUND - hy, 0xc8ccd8); rect(c, tx - 1, 14, 3, 1, 0x8a919b)
  for (let k = 0; k < 3; k++) {
    const a = m.t / 450 + k * 2.094
    line(c, tx, hy, tx + Math.cos(a) * 5, hy + Math.sin(a) * 4.8, 0xe8ecf4)
  }
  put(c, tx, hy, 0xff8a3e)
  const span = tx - cx - 9
  rect(c, cx + 8, 14, span, 1, 0x555a66)
  for (let k = 0; k < 3; k++) put(c, tx - 1 - ((m.t / 25 + k * span / 3) % span), 14, 0xffe066)
  clawd(c, m.t, 'float', cx - 7)
  const b = clamp(0.35 + wave(m.t, 700) * 0.65)
  sprite(c, ['.yyy.', 'yyyyy', 'yyyyy', '.yyy.', '..g..'], { y: mix(0x6a6a50, 0xffe066, b), g: 0x8a919b }, cx - 2, 3)
  if (b > 0.7) for (const [dx, dy] of [[-4, 3], [4, 3], [0, 1], [-3, 6], [3, 6]]) put(c, cx + dx!, dy!, 0xfff6c8)
  ground(c)
}

const harmonizing: Draw = (c, m) => {
  const ox = START_X
  clawd(c, m.t, 'float', ox)
  rect(c, ox + 6, CLAWD_TOP + 3, 2, Math.floor(m.t / 300) % 2 ? 2 : 1, 0x3a1a10)
  const x0 = ox + 16
  const span = Math.max(8, c.W - x0 - 4)
  for (const y of [1, 3, 5, 7, 9]) rect(c, x0, y, span + 2, 1, 0x4a4f63)
  const cols = [0xd94f8a, 0x4fa3d9, 0xd9c84f]
  for (let k = 0; k < 4; k++) {
    const u = m.t / 45 + (k * span) / 4
    const nn = Math.floor(u / span)
    const xx = x0 + (u % span)
    const base = 1 + ((k * 3 + nn * 5) % 4)
    for (let v = 0; v < 3; v++) { rect(c, xx, base + v * 2, 2, 2, cols[v]!); put(c, xx + 1, base + v * 2 - 2, cols[v]!) }
  }
  ground(c)
}
const START_X = 5

const hyperspacing: Draw = (c, m) => {
  const cx = spot(c.W, 0.5)
  const R = c.W / 2
  for (let k = 0; k < c.W / 3; k++) {
    const a = rnd(k, 1) * Math.PI * 2
    const sp = 0.5 + rnd(k, 2)
    const u = ((m.t / 1800) * sp + rnd(k, 3)) % 1
    const r0 = u * u * R * 1.1
    const r1 = Math.max(0, u - 0.08 * sp) ** 2 * R * 1.1
    for (let s = 0; s <= 3; s++) {
      const r = lerp(r1, r0, s / 3)
      if (r > 14) put(c, cx + Math.cos(a) * r, 7 + Math.sin(a) * r * 0.4, mix(0x6a7ab0, 0xffffff, u))
    }
  }
  const bob = Math.round(Math.sin(m.t / 220))
  for (let a = 0; a <= 12; a++) put(c, cx + Math.cos((a / 12) * Math.PI) * 9, 13 + bob - Math.sin((a / 12) * Math.PI) * 9, 0x9fd8ff)
  clawd(c, m.t, 'float', cx - 7, 1, 2 - bob)
  sprite(c, ['.sssssssssssssss.', 'sbsbsbsbsbsbsbsbs'], { s: 0xaab0c0, b: 0x4fa3d9 }, cx - 8, 13 + bob)
  for (let i = 0; i < 7; i++) put(c, cx - 9 - i, 13 + bob + (rnd(i, Math.floor(m.t / 60)) > 0.5 ? 1 : 0), mix(0xffe066, 0xff4b3e, i / 7))
}

const infusing: Draw = (c, m) => {
  const T = m.t % 7000
  const cx = spot(c.W, 0.58)
  const p = ease(seg(T, 300, 5800)) * (1 - seg(T, 6400, 7000))
  const glass = 0xaab4c0
  for (let y = 7; y < 14; y++) { put(c, cx - 6, y, glass); put(c, cx + 5, y, glass) }
  rect(c, cx - 6, 14, 12, 1, glass)
  for (let j = 0; j < 5; j++) for (let x = -5; x <= 4; x++) put(c, cx + x, 9 + j, mix(0xe4eef2, 0xc0721a, clamp(p * 1.7 - j * 0.18 + (rnd(x + 9, j) - 0.5) * 0.15)))
  sprite(c, ['.gg', '..g', '..g', '.gg'], { g: glass }, cx + 6, 9)
  const { hand } = clawd(c, m.t, 'hammer', cx - 21)
  const by = hand[1] - 1
  line(c, hand[0] + 1, hand[1], cx - 4, by, 0xe8e4d0)
  rect(c, cx - 4, by, 3, 3, 0xf0e8d0)
  for (let k = 0; k < 3; k++) {
    const life = ((m.t / 110) + k * 3) % 7
    put(c, cx - 3 + k * 3 + Math.sin(m.t / 300 + k) * 1, 6 - life, mix(0xc8ccd8, 0x1a1c24, life / 7))
  }
}

const leavening: Draw = (c, m) => {
  const T = m.t % 8000
  const cx = spot(c.W, 0.6)
  const rise = ease(seg(T, 400, 5600))
  const poke = ease(seg(T, 6200, 6900))
  let h = T < 6200 ? 1 + rise * 7 : lerp(8, 1.2, poke)
  if (T >= 5600 && T < 6200) h += Math.sin(T / 120) * 0.4
  const dome = (x: number) => Math.round(h * Math.sqrt(Math.max(0, 1 - (x / 5.6) ** 2)))
  for (let x = -5; x <= 5; x++) for (let j = 0; j < dome(x); j++) put(c, cx + x, 11 - j, (x + j) % 4 === 0 ? 0xe3cfa0 : 0xf3e3c0)
  if (h > 3) for (let b = 0; b < 6; b++) {
    const bx = -4 + Math.floor(rnd(b, 3) * 9)
    if (rnd(b, Math.floor(T / 300)) > 0.5 && dome(bx) > 1) put(c, cx + bx, 11 - Math.floor(rnd(b, 8) * (dome(bx) - 1)), 0xcdb685)
  }
  sprite(c, ['aaaaaaaaaaaaa', '.bbbbbbbbbbb.', '..bbbbbbbbb..'], { a: 0xa5b3c8, b: 0x7f8fa6 }, cx - 6, 12)
  const { hand } = clawd(c, m.t, 'float', cx - 24)
  if (T >= 6200 && T < 7100) {
    const fy = lerp(3, 11 - dome(0), Math.sin(seg(T, 6200, 6700) * Math.PI / 2))
    line(c, hand[0] + 1, hand[1], cx, fy, CLAWD)
    rect(c, cx - 1, fy - 1, 2, 2, CLAWD)
    if (T > 6600) for (let k = 0; k < 5; k++) put(c, cx + (rnd(k, 6) - 0.5) * 12, 10 - rnd(k, 7) * 4 * seg(T, 6600, 7100), 0xf4f4f4)
  }
  ground(c)
}

const metamorphosing: Draw = (c, m) => {
  const T = m.t % 8000
  const cx = spot(c.W, 0.5)
  const ox = cx - 7
  const wing = ease(seg(T, 5300, 5900)) * (1 - ease(seg(T, 7300, 7900)))
  const hover = wing > 0.5 ? 2 + Math.round(wave(T, 900) * 2) : 0
  const flap = 0.4 + 0.6 * Math.abs(Math.cos(T / 180))
  const ext = Math.round(6 * wing * flap)
  const wy = CLAWD_TOP + 1 - hover
  for (let dx = 1; dx <= ext; dx++) for (let dy = -5; dy <= 3; dy++) {
    if ((dx / 6) ** 2 + ((dy + 1) / 4.2) ** 2 > 1) continue
    const col = dy < 0 ? (dx === 3 && dy === -2 ? 0xffe066 : 0xff9e3d) : dx === 3 && dy === 2 ? 0xffe066 : 0x4fa3d9
    put(c, ox + 1 - dx, wy + dy, col); put(c, ox + 12 + dx, wy + dy, col)
  }
  clawd(c, m.t, 'float', ox, 1, hover)
  if (T > 600 && T < 5450) {
    const rows = Math.ceil(seg(T, 600, 2400) * 9)
    const wob = T > 2400 ? Math.round(Math.sin(T / 130)) : 0
    const flash = T > 5300
    for (let y = 14; y > 14 - rows; y--) {
      const hw = Math.round(7.5 * Math.sqrt(Math.max(0, 1 - ((y - 10) / 4.8) ** 2)))
      for (let x = -hw; x <= hw; x++) put(c, cx + wob + x, y, flash ? 0xffffff : (x + y) % 3 === 0 ? 0xc9bf98 : 0xe6dec0)
    }
    if (T > 4700 && !flash) for (const [dx, dy] of [[0, 8], [1, 9], [0, 10], [-1, 11], [0, 12]]) put(c, cx + wob + dx!, dy!, 0x5a4a30)
  }
  ground(c)
}

const mustering: Draw = (c, m) => {
  const T = m.t % 8400
  const ox = 4
  const { hand } = clawd(c, m.t, 'umbrella', ox)
  const px = hand[0] + 1
  rect(c, px, 0, 1, hand[1] + 2, WOOD)
  for (let i = 0; i < 6; i++) rect(c, px + 1 + i, 1 + Math.round(Math.sin(m.t / 150 + i) * 0.7), 1, 4, i % 2 ? 0xd94f4f : 0xe8604f)
  const n = Math.max(3, Math.min(7, Math.floor((c.W - ox - 26) / 8)))
  for (let i = 0; i < n; i++) {
    const slot = ox + 22 + i * 8
    const arrive = 300 + i * 450
    const leave = 6200 + i * 100
    let x = c.W + 6
    let moving = false
    let flip = true
    if (T >= arrive && T < arrive + 1400) { x = lerp(c.W + 6, slot, (T - arrive) / 1400); moving = true }
    else if (T >= arrive + 1400 && T < leave) x = slot
    else if (T >= leave && T < leave + 1200) { x = lerp(slot, c.W + 6, (T - leave) / 1200); moving = true; flip = false }
    if (x > c.W + 5) continue
    const step = Math.floor(m.t / 110 + i) % 2
    sprite(c, ['hhhhh', 'ccccc', 'cecec', 'ccccc', !moving ? '.c.c.' : step ? '.c.c.' : 'c...c'], { h: 0x5a6a3a, c: CLAWD, e: 0x1a1410 }, x, 10, flip)
    if (!moving && T >= arrive + 1400) put(c, x + 5, 12 - (Math.floor(m.t / 400 + i) % 2), CLAWD)
  }
  ground(c, 0x3a3d2a)
}

const onioning: Draw = (c, m) => {
  const P = 1500
  const T = m.t % (P * 4)
  const s = Math.floor(T / P)
  const u = (T % P) / P
  const cx = spot(c.W, 0.6)
  const R = 5 - s
  const cy = 13 - R
  rect(c, cx - 8, 14, 17, 1, WOOD)
  for (let r = R; r >= 1; r--) disc(c, cx, cy, r, (R - r) % 2 ? 0xe8d0e8 : 0xc78ac8)
  put(c, cx, cy - R - 1, 0x6aa84f); put(c, cx, cy - R - 2, 0x6aa84f)
  if (u < 0.5) {  // the peel
    const k = u * 2
    const col = (s % 2) ? 0xe8d0e8 : 0xc78ac8
    rect(c, cx + R + k * 10, cy - R - Math.sin(k * Math.PI) * 3 + k * 4, 3, 1, col)
    put(c, cx + R + k * 10 + 2, cy - R - Math.sin(k * Math.PI) * 3 + k * 4 + 1, col)
  }
  const ox = cx - 19
  clawd(c, m.t, 'pan', ox)
  for (let k = 0; k < 1 + s; k++) {  // tears fly off the face
    const life = ((m.t / 600) + k / (1 + s)) % 1
    put(c, ox + 4 - life * 5, CLAWD_TOP + 2 - Math.sin(life * Math.PI) * 3 + life * 3, 0x6ab4f0)
    put(c, ox + 9 + life * 5, CLAWD_TOP + 2 - Math.sin(life * Math.PI) * 3 + life * 3, 0x6ab4f0)
  }
  ground(c)
}

const perusing: Draw = (c, m) => {
  const ox = 4
  const { hand } = clawd(c, m.t, 'float', ox)
  const sx = ox + 20
  const sw = Math.max(10, c.W - sx - 3)
  rect(c, sx, 3, sw, 10, 0xe8dcb8); rect(c, sx - 1, 2, 1, 12, 0xb08850); rect(c, sx + sw, 2, 1, 12, 0xb08850)
  const ink = 0x8a7f5a
  for (let r = 0; r < 4; r++) for (let xi = 1; xi < sw - 1; xi++) {
    if (rnd(Math.floor((xi + Math.floor(m.t / 70)) / 5), r) > 0.25) put(c, sx + xi, 5 + r * 2, ink)
  }
  const lx = Math.round(sx + 6 + Math.sin(m.t / 1100) * 4)
  const ly = 8 + Math.round(Math.sin(m.t / 2300))
  line(c, hand[0] + 1, hand[1], lx - 2, ly + 2, WOOD)
  for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
    const d2 = dx * dx + dy * dy
    const i = (ly + dy) * c.W + lx + dx
    if (d2 <= 7) put(c, lx + dx, ly + dy, c.px[i] === ink ? 0x1a1810 : 0xfff6d8)
    else if (d2 <= 13) put(c, lx + dx, ly + dy, 0xb08d57)
  }
  ground(c)
}

const pontificating: Draw = (c, m) => {
  const cx = spot(c.W, 0.28)
  rect(c, cx - 7, 12, 14, 4, 0x8a6a3a); rect(c, cx - 7, 13, 14, 1, 0x6a4a2a)
  clawd(c, m.t, 'hammer', cx - 7, 1, 3)
  rect(c, cx - 3, 2, 6, 3, 0x24242c); rect(c, cx - 4, 5, 8, 1, 0x24242c); rect(c, cx - 3, 4, 6, 1, 0xae0001)
  const bx = cx + 8
  const bw = Math.min(24, c.W - bx - 2)
  if (bw > 6) {
    rect(c, bx, 0, bw, 6, 0xeceae0)
    put(c, bx, 0, DEF); put(c, bx + bw - 1, 0, DEF); put(c, bx, 5, DEF); put(c, bx + bw - 1, 5, DEF)
    for (const r of [1, 3]) for (let i = 2; i < bw - 2; i++) if (rnd(i + Math.floor(m.t / 400) * 7, r) > 0.3) put(c, bx + i, r + 1, 0x5e6478)
    put(c, bx - 1, 4, 0xeceae0); put(c, bx - 2, 5, 0xeceae0)
  }
  const bodies = [0x5e6478, 0x6b4a6b, 0x4a6b5e]
  for (let i = 0; i < 3; i++) {
    const ax = cx + 17 + i * 6
    if (ax + 3 > c.W) continue
    sprite(c, ['.h.', 'bbb', 'bbb', 'b.b'], { h: 0xc8ccd8, b: bodies[i]! }, ax, 11 + ((Math.floor(m.t / 450 + i * 3) % 2) ? 1 : 0) * 0)
    if (Math.floor(m.t / 450 + i * 3) % 2) put(c, ax + 1, 11, 0x9aa0b0)
  }
  ground(c)
}

const propagating: Draw = (c, m) => {
  const pl = spot(c.W, 0.35)
  const jr = Math.min(c.W - 8, pl + 30)
  const at = along([{ x: pl - 18, stay: 1400, pose: 'pan' }, { x: jr - 18, stay: 2800, pose: 'pan' }], m.t, 'carry')
  const leaf = (x: number, y: number, d: number) => { put(c, x + d, y, GREEN); put(c, x + 2 * d, y - 1, GREEN) }
  rect(c, pl - 3, 12, 7, 3, 0xb5654a)
  rect(c, pl, 4, 1, 8, GREEN)
  for (const [i, j] of [5, 7, 9].entries()) leaf(pl, j, i % 2 ? 1 : -1)
  put(c, pl, 3, 0xd94f8a)
  const glass = 0xaed8e8
  for (let y = 8; y < 14; y++) { put(c, jr - 3, y, glass); put(c, jr + 3, y, glass) }
  rect(c, jr - 3, 14, 7, 1, glass); rect(c, jr - 2, 10, 5, 4, 0x6aa8d8)
  const { hand } = clawd(c, m.t, at.pose, at.x)
  const holding = at.stop === 0 && (at.still ? at.stayed > 600 : true)
  if (at.stop === 0 && at.still && at.stayed <= 600 && at.stayed > 250) { put(c, pl + 2, 6, 0xffffff); put(c, pl + 3, 5, 0xffffff); put(c, pl + 3, 7, 0xffffff) }
  if (holding) { rect(c, hand[0] + 1, hand[1] - 3, 1, 3, GREEN); leaf(hand[0] + 1, hand[1] - 2, 1) }
  const g = at.stop === 1 ? (at.still ? clamp(at.stayed / 2800) : 1) : 0
  if (at.stop === 1) {
    rect(c, jr, 5, 1, 7, GREEN); leaf(jr, 7, -1)
    if (g > 0.7) { put(c, jr + 1, 4, 0x6ab84f); put(c, jr + 2, 3, 0x6ab84f) }
    const roots: [number, number][] = [[0, 12], [-1, 13], [1, 13], [-2, 13], [2, 13], [0, 13]]
    for (let r = 0; r < Math.ceil(g * 6); r++) put(c, jr + roots[r]![0], roots[r]![1], 0xf4f4f4)
  }
  ground(c, 0x4a3a2a)
}

const recombobulating: Draw = (c, m, glyphs) => {
  const T = m.t % 7000
  const cx = spot(c.W, 0.5)
  const ox = cx - 7
  const jump = T > 3000 && T < 4400 ? Math.round(Math.sin(seg(T, 3000, 4400) * Math.PI) * 4) : 0
  const tmp = canvas(c.W)
  clawd(tmp, m.t, 'float', ox, 1, jump)
  const span = Math.min(30, c.W / 3)
  for (let ty = 0; ty < 5; ty++) for (let tx = 0; tx < 7; tx++) {
    const id = ty * 7 + tx
    const d = rnd(id, 5) * 0.5
    const k = T < 5200 ? ease(seg(T, 700 + d * 1400, 1800 + d * 1400)) : 1 - ease(seg(T, 5200 + d * 500, 5900 + d * 500))
    const ex = Math.round((rnd(id, 1) - 0.5) * 2 * span * (1 - k))
    const ey = Math.round((rnd(id, 2) - 0.55) * 12 * (1 - k) + Math.sin(T / 70 + id) * (1 - k))
    const y0 = CLAWD_TOP - 4 + ty * 2
    for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
      const col = tmp.px[(y0 + j) * c.W + ox + tx * 2 + i]
      if (col !== undefined && col !== DEF) put(c, ox + tx * 2 + i + ex, y0 + j + ey, col)
    }
  }
  if (T < 1500 || T > 5700) for (let k = 0; k < 3; k++) if (Math.floor(m.t / 250 + k) % 2) glyphs.push({ x: cx - 8 + k * 7, row: k % 2, ch: '?', fg: 0xffd54f })
  if (T > 2900 && T < 3400) for (let k = 0; k < 8; k++) put(c, cx + Math.cos(k * 0.785) * (T - 2900) / 40, 10 + Math.sin(k * 0.785) * (T - 2900) / 70, SPARKS[k % 4]!)
  ground(c)
}

const schlepping: Draw = (c, m) => {
  const T = m.t % 7200
  const a = 5
  const b = spot(c.W, 0.75)
  let x = a
  let face: 1 | -1 = 1
  let moving = true
  if (T < 3200) x = lerp(a, b, T / 3200)
  else if (T < 3600) { x = b; moving = false }
  else if (T < 6800) { x = lerp(b, a, (T - 3600) / 3200); face = -1 }
  else { x = a; face = -1; moving = false }
  const { hand } = clawd(c, m.t, moving ? 'carry' : 'float', x, face)
  const bob = moving ? Math.floor(m.t / 250) % 2 : 0
  sprite(c, ['....skks....', '..ssssssss..', '.sssspsssss.', 'sssssssssdds', 'ssssssssssdd', '.ssssssssdd.'], { s: 0xa8844f, k: 0x6a4a2a, p: 0xc8a46f, d: 0x86683a }, Math.round(x) + (face > 0 ? 0 : 0), CLAWD_TOP - 5 + bob, face < 0)
  const sx = hand[0] - (face < 0 ? 3 : 0)
  rect(c, sx, hand[1] + 1, 4, 3, 0x7a4a24); rect(c, sx + 1, hand[1] + 1, 2, 1, 0xb08850)
  put(c, Math.round(x) + (face > 0 ? 1 : 12), CLAWD_TOP + ((m.t / 90) % 5), 0x6ab4f0)
  if (moving) for (let k = 0; k < 3; k++) put(c, x + (face > 0 ? -2 - k * 2 : 15 + k * 2), 14 - ((m.t / 200 + k) % 3), mix(0xb0a58a, 0x1a1c24, (k + 1) / 4))
  ground(c)
}

const skedaddling: Draw = (c, m, glyphs) => {
  const T = m.t % 6400
  const x0 = spot(c.W, 0.3) - 7
  const dash = (t: number) => x0 + (seg(t, 1000, 2600) ** 2) * (c.W - x0 + 16)
  if (T < 1000) {
    clawd(c, m.t, 'float', x0 + (T > 400 ? Math.round(Math.sin(T / 40)) : 0))
    glyphs.push({ x: x0 + 7, row: 3, ch: '!', fg: 0xff4b3e })
  } else if (T < 2600) clawd(c, m.t, 'walk', dash(T))
  else if (T >= 3800) clawd(c, m.t, T < 6000 ? 'walk' : 'float', lerp(-14, x0, seg(T, 3800, 6000)))
  for (let k = 0; k < 16; k++) {
    const kt = 1000 + k * 100
    if (T < kt || kt > 2600) continue
    const age = T - kt
    if (age > 1600) continue
    const col = mix(0xb0a58a, 0x1a1c24, age / 1600)
    const px = dash(kt) + 4
    const py = 13 - age / 150
    if (age < 800) rect(c, px, py, 2, 2, col)
    else put(c, px, py, col)
  }
  if (T > 1100 && T < 2500) for (let k = 0; k < 3; k++) rect(c, dash(T) - 10 - k * 3, 10 + k * 2, 6, 1, 0xdfe7ff)
  ground(c)
}

const spinning: Draw = (c, m) => {
  const cx = spot(c.W, 0.6)
  const cy = 8
  for (let a = 0; a < 28; a++) put(c, cx + Math.cos((a / 28) * Math.PI * 2) * 5.5, cy + Math.sin((a / 28) * Math.PI * 2) * 5.5, 0xb08850)
  for (let k = 0; k < 6; k++) line(c, cx, cy, cx + Math.cos(m.t / 300 + k * 1.047) * 5, cy + Math.sin(m.t / 300 + k * 1.047) * 5, 0xd8b078)
  line(c, cx, cy, cx - 5, 14, WOOD); line(c, cx, cy, cx + 5, 14, WOOD); rect(c, cx - 5, 14, 11, 1, WOOD)
  put(c, cx, cy, 0xffe066)
  const r = 1 + Math.floor((m.t % 6000) / 1500) % 3
  disc(c, cx + 11, 13 - r, r, 0xf4f0e8)
  for (let i = 0; i < r * 2; i++) put(c, cx + 11 - r + i, 13 - r + (i % 2), 0xd8d0c0)
  line(c, cx + 6, cy + 1, cx + 11, 13 - 2 * r, 0xf4f0e8)
  const { hand } = clawd(c, m.t, 'crank', cx - 19)
  put(c, hand[0] + 1, hand[1], 0xf4f0e8)
  ground(c)
}

const symbioting: Draw = (c, m, glyphs) => {
  const T = m.t % 6000
  const cx = spot(c.W, 0.35)
  const bx = Math.min(c.W - 6, cx + 24)
  sprite(c, ['..ggg..', '.ggggg.', 'ggggggg'], { g: 0x3a7a3a }, bx - 3, 12)
  const berries: [number, number][] = [[bx - 1, 12], [bx + 1, 13], [bx + 2, 12]]
  berries.forEach(([x, y], i) => { if (!(i === 0 && T > 3600 && T < 6000)) put(c, x, y, 0xd9304f) })
  clawd(c, m.t, 'float', cx - 7)
  const peck = Math.floor(m.t / 300) % 2
  const perch: [number, number] = [cx - 2, CLAWD_TOP - 3]
  const away: [number, number] = [bx - 3, 9]
  let p = perch
  let flip = false
  let fly = 0
  if (T >= 2400 && T < 3100) { const k = ease(seg(T, 2400, 3100)); p = [lerp(perch[0], away[0], k), lerp(perch[1], away[1], k) - Math.sin(k * Math.PI) * 5]; fly = 1 }
  else if (T >= 3100 && T < 4100) { p = [away[0], away[1] + peck]; flip = true }
  else if (T >= 4100 && T < 4800) { const k = ease(seg(T, 4100, 4800)); p = [lerp(away[0], perch[0], k), lerp(away[1], perch[1], k) - Math.sin(k * Math.PI) * 5]; flip = true; fly = 1 }
  else p = [perch[0], perch[1] + (T < 2400 || T >= 4800 ? peck : 0)]
  sprite(c, ['.bbb.', 'bbbkY', '..b..'], { b: 0x3a7ab8, k: 0x10131c, Y: 0xffd54f }, Math.round(p[0]), Math.round(p[1]), flip)
  if (fly && Math.floor(m.t / 100) % 2) put(c, p[0] + 2, p[1] - 1, 0x3a7ab8)
  if (T >= 4300 && T < 4800) put(c, p[0] - 1, p[1] + 1, 0xd9304f)
  for (const [t0, hx] of [[1200, cx + 4], [3400, bx - 1]] as [number, number][]) {
    const life = (T - t0) / 1200
    if (life >= 0 && life < 1) glyphs.push({ x: hx, row: 3 - Math.floor(life * 3), ch: '♥', fg: 0xff7aa8 })
  }
  ground(c)
}

const tomfoolering: Draw = (c, m) => {
  const cx = spot(c.W, 0.5)
  const ox = cx - 7
  const hop = -(Math.floor(m.t / 300) % 2)
  for (let k = 0; k < 10; k++) put(c, rnd(k, 1) * c.W, (m.t / 90 + rnd(k, 2) * 16) % 16, SPARKS[k % 4]!)
  clawd(c, m.t, 'dance', ox)
  sprite(c, ['.r......y.', '.rr....yy.', '.rrbbbbyy.', 'bbbbbbbbbb'], { r: 0xd94f4f, y: 0xd9c84f, b: 0x4f6ad9 }, ox + 2, CLAWD_TOP + hop - 3)
  put(c, ox + 2, CLAWD_TOP + hop - 3, 0xffffff); put(c, ox + 11, CLAWD_TOP + hop - 3, 0xffffff)
  rect(c, ox + 6, CLAWD_TOP + hop + 2, 2, 2, 0xff3b3b)
  const balls = [0xff4b3e, 0xffd54f, 0x4fa3d9]
  for (let i = 0; i < 3; i++) {
    const u = m.t / 760 + i * (2 / 3)
    const f = u - Math.floor(u)
    const k = Math.floor(u) % 2 ? 1 - f : f
    rect(c, lerp(ox - 1, ox + 14, k), 8 - 28 * f * (1 - f), 2, 2, balls[i]!)
  }
  ground(c)
}

const undulating: Draw = (c, m) => {
  const cx = spot(c.W, 0.5)
  const surf = (x: number) => 11 + Math.sin(x / 5 - m.t / 320) * 2 + Math.sin(x / 11 + m.t / 700) * 1.2
  disc(c, spot(c.W, 0.85), 4, 3, 0xffd54f)
  for (let x = 0; x < c.W; x++) {
    const s = Math.round(surf(x))
    for (let y = s; y < PH_ROWS; y++) put(c, x, y, y === s ? 0xe8f4ff : mix(0x4fa3d9, 0x1f3a6a, (y - s) / 8))
  }
  const sy = Math.round(surf(cx))
  const slope = surf(cx + 4) - surf(cx - 4)
  for (let i = -7; i <= 7; i++) put(c, cx + i, sy + Math.round((slope * i) / 8), Math.abs(i) < 2 ? 0xffffff : 0xff9e3d)
  clawd(c, m.t, 'float', cx - 7, 1, PH_ROWS - 1 - sy)
}
const PH_ROWS = 16

const warping: Draw = (c, m) => {
  const T = m.t % 4800
  const cx = spot(c.W, 0.5)
  const ox = cx - 7
  for (let k = 0; k < 5; k++) {
    const r = ((m.t / 50) + k * 6) % 30
    const col = mix(mix(0x9a5ad9, 0x4fe0f0, k / 5), 0x1a1c24, r / 30)
    for (let a = 0; a < 120; a++) put(c, cx + Math.cos((a / 120) * Math.PI * 2) * r * 1.6, 8 + Math.sin((a / 120) * Math.PI * 2) * r * 0.28, col)
  }
  const s = 1 + 7 * (ease(seg(T, 1400, 2300)) - ease(seg(T, 3100, 3600)))
  const tmp = canvas(c.W)
  clawd(tmp, m.t, 'float', ox)
  for (let y = CLAWD_TOP; y < GROUND; y++) {
    const shear = Math.round(Math.sin(y * 0.9 + m.t / 90) * (s - 1) * 0.6)
    for (let x = 0; x < c.W; x++) {
      const sxp = Math.round(cx + (x - cx) / s - shear)
      const col = sxp >= 0 && sxp < c.W ? tmp.px[y * c.W + sxp]! : DEF
      if (col !== DEF) put(c, x, y, mix(col, 0x6af0ff, (s - 1) / 9))
    }
  }
  ground(c, 0x4a3a6a)
}

const working: Draw = (c, m) => {
  const mx = spot(c.W, 0.62)
  clawd(c, m.t, 'hammer', mx - 21)
  rect(c, mx - 9, 12, 22, 2, 0x8a6a3a); rect(c, mx - 9, 14, 2, 1, 0x6a4a2a); rect(c, mx + 10, 14, 2, 1, 0x6a4a2a)
  rect(c, mx - 6, 2, 14, 9, 0x3a3d4a); rect(c, mx - 5, 3, 12, 7, 0x10131c); rect(c, mx, 11, 2, 1, 0x3a3d4a)
  rect(c, mx - 8, 11, 6, 1, 0x555a66)
  const n = Math.floor(m.t / 900)
  const cols = [0x6ad94f, 0xdfe7ff, 0xd9c84f]
  for (let r = 0; r < 3; r++) {
    const seed = n + r
    rect(c, mx - 4 + (rnd(seed, 6) > 0.5 ? 2 : 0), 4 + r * 2, 3 + Math.floor(rnd(seed, 5) * 7), 1, cols[seed % 3]!)
  }
  if (Math.floor(m.t / 400) % 2) put(c, mx + 5, 8, 0xdfe7ff)
  rect(c, mx + 9, 10, 3, 2, 0xf0efe8); put(c, mx + 12, 10, 0xf0efe8)
  for (let k = 0; k < 2; k++) put(c, mx + 10 + k + Math.sin(m.t / 300 + k), 9 - ((m.t / 150 + k * 3) % 5), mix(0xc8ccd8, 0x1a1c24, ((m.t / 150 + k * 3) % 5) / 5))
  ground(c)
}

export const SCENES: Record<string, Draw> = {
  beaming, boogieing, burrowing, cerebrating, cogitating, contemplating, cultivating, doing, embellishing, flambeing, forming,
  generating, harmonizing, hyperspacing, infusing, leavening, metamorphosing, mustering, onioning, perusing, pontificating,
  propagating, recombobulating, schlepping, skedaddling, spinning, symbioting, tomfoolering, undulating, warping, working,
}
