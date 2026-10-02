// The frame: each spinner word's own scene, else its act's (a word a later build adds).
import { ACTS, actFor, canvas, DEF, ROWS, type Draw, type Glyph, type Moment } from './acts'
import { SCENES } from './scenes'

type Cell = [number, number, number]

/** The scene's key: the word lower-cased, accents and a trailing ellipsis dropped. */
export const keyOf = (word: string) =>
  word.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[.\u2026]+$/, '')

export const sceneFor = (word: string): Draw => SCENES[keyOf(word)] ?? ACTS[actFor(word)]

/** The frame's cells, packed for a Raster: columns * ROWS triplets of [codePoint, fg, bg]. */
export function frame(m: Moment, columns: number): Uint32Array {
  const c = canvas(columns)
  const glyphs: Glyph[] = []
  sceneFor(m.word)(c, m, glyphs)
  const cells: Cell[] = []
  for (let r = 0; r < ROWS; r++) {
    for (let x = 0; x < columns; x++) {
      const top = c.px[2 * r * columns + x]!
      const bot = c.px[(2 * r + 1) * columns + x]!
      if (top === DEF && bot === DEF) cells.push([0x20, DEF, DEF])
      else if (top === bot) cells.push([0x2588, top, DEF])
      else if (top === DEF) cells.push([0x2584, bot, DEF])
      else cells.push([0x2580, top, bot])
    }
  }
  for (const g of glyphs) {
    const i = g.row * columns + g.x
    if (g.x >= 0 && g.x < columns && g.row >= 0 && g.row < ROWS && cells[i]![0] === 0x20) cells[i] = [g.ch.codePointAt(0)!, g.fg, DEF]
  }
  const out = new Uint32Array(cells.length * 3)
  cells.forEach(([cp, fg, bg], i) => out.set([cp, fg, bg], i * 3))
  return out
}

/** Base64 of the cells, as RasterProps.cells wants them. */
export const encode = (cells: Uint32Array): string => new Uint8Array(cells.buffer).toBase64()

