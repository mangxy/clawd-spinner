// The frame: each spinner word's own scene, else its act's (a word a later build adds).
import { ACTS, actFor, canvas, DEF, ROWS, type Draw, type Glyph, type Moment } from './acts'
import { SCENES } from './scenes'

type Cell = [number, number, number]

/** The scene draws full-size; SCALE shrinks it on the way out (2 = half size). */
export const SCALE = 2
export const OUT_ROWS = ROWS / SCALE

/** The scene's key: the word lower-cased, accents and a trailing ellipsis dropped. */
export const keyOf = (word: string) =>
  word.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[.\u2026]+$/, '')

export const sceneFor = (word: string): Draw => SCENES[keyOf(word)] ?? ACTS[actFor(word)]

/** The frame's cells, packed for a Raster: floor(columns / SCALE) * OUT_ROWS triplets of [codePoint, fg, bg]. */
export function frame(m: Moment, columns: number): Uint32Array {
  const c = canvas(columns)
  const glyphs: Glyph[] = []
  sceneFor(m.word)(c, m, glyphs)
  const cells: Cell[] = []
  const W = Math.floor(columns / SCALE)
  for (let r = 0; r < OUT_ROWS; r++) {
    for (let x = 0; x < W; x++) {
      const py = 2 * SCALE * r
      const px = SCALE * x
      const top = c.px[py * columns + px]! !== DEF ? c.px[py * columns + px]! : c.px[py * columns + px + 1]!
      const bot = c.px[(py + 1) * columns + px]! !== DEF ? c.px[(py + 1) * columns + px]! : c.px[(py + 1) * columns + px + 1]!
      if (top === DEF && bot === DEF) cells.push([0x20, DEF, DEF])
      else if (top === bot) cells.push([0x2588, top, DEF])
      else if (top === DEF) cells.push([0x2584, bot, DEF])
      else cells.push([0x2580, top, bot])
    }
  }
  for (const g of glyphs) {
    const x = Math.floor(g.x / SCALE)
    const row = Math.floor(g.row / SCALE)
    const i = row * W + x
    if (x >= 0 && x < W && row >= 0 && row < OUT_ROWS && cells[i]![0] === 0x20) cells[i] = [g.ch.codePointAt(0)!, g.fg, DEF]
  }
  if (m.line && c.clawdAt) {
    const at = { x: Math.floor(c.clawdAt.x / SCALE), y: Math.floor(c.clawdAt.y / SCALE) }
    bubble(cells, W, at, m.line, m.lineT ?? Infinity)
  }
  const out = new Uint32Array(cells.length * 3)
  cells.forEach(([cp, fg, bg], i) => out.set([cp, fg, bg], i * 3))
  return out
}

const EDGE_GREY = 0x9aa0a6
const SPEECH = 0xd97757
const TYPE_MS = 35  // one letter every 35ms as a new line starts

/**
 * Clawd's speech bubble, three cell rows above and beside his head, with a tail down to him: to his
 * right when it fits, else to his left; the text is cut to fit the row. It follows him as he moves.
 */
function bubble(cells: Cell[], W: number, at: { x: number; y: number }, line: string, lineT: number) {
  const headRow = Math.floor(at.y / 2)
  const top = Math.max(0, headRow - 4)
  const room = Math.max(at.x - 2, W - (at.x + 8) - 1)
  const text = line.slice(0, Math.max(0, room - 4)).slice(0, Math.floor(lineT / TYPE_MS) + 1)
  if (room < 8 || !text) return
  const width = Math.min(line.length, room - 4) + 4
  const right = at.x + 8 + width <= W
  const x0 = right ? at.x + 15 : Math.max(0, at.x - width - 1)
  const set = (x: number, row: number, ch: string, fg: number) => {
    if (x >= 0 && x < W && row >= 0 && row < OUT_ROWS) cells[row * W + x] = [ch.codePointAt(0)!, fg, DEF]
  }
  const inner = width - 2
  set(x0, top, '╭', EDGE_GREY)
  set(x0 + width - 1, top, '╮', EDGE_GREY)
  set(x0, top + 1, '│', EDGE_GREY)
  set(x0 + width - 1, top + 1, '│', EDGE_GREY)
  set(x0, top + 2, '╰', EDGE_GREY)
  set(x0 + width - 1, top + 2, '╯', EDGE_GREY)
  for (let i = 1; i <= inner; i++) {
    set(x0 + i, top, '─', EDGE_GREY)
    set(x0 + i, top + 2, '─', EDGE_GREY)
    const ch = text[i - 2]
    set(x0 + i, top + 1, i >= 2 && ch ? ch : ' ', SPEECH)
  }
  // the tail, from the bubble's corner nearest him down toward his head
  if (right) set(x0 - 1, top + 3, '╱', EDGE_GREY)
  else set(x0 + width, top + 3, '╲', EDGE_GREY)
}

/** Base64 of the cells, as RasterProps.cells wants them. */
export const encode = (cells: Uint32Array): string => new Uint8Array(cells.buffer).toBase64()

