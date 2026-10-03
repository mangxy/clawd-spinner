import { expect, test } from 'claude-code/testing'

import { frame, keyOf } from '../hooks/frame'
import { LINES_PER_WORD, lineFor, UNSEEN_LINES, WORDS_WITH_LINES } from '../hooks/rocky'
import { WORDS } from '../hooks/words'

test('every spinner word has ten lines of its own, none said for another word', async () => {
  const seen = new Map<string, string>()
  for (const word of WORDS) {
    expect([word, WORDS_WITH_LINES.includes(keyOf(word))]).toEqual([word, true])
    const lines = Array.from({ length: LINES_PER_WORD }, (_, n) => lineFor(word, n))
    for (const line of lines) {
      expect([word, line, seen.get(line) ?? word]).toEqual([word, line, word])
      expect([line, line.length <= 34, /^[\x20-\x7e]+$/.test(line)]).toEqual([line, true, true])
      seen.set(line, word)
    }
    expect(lineFor(word, LINES_PER_WORD)).toBe(lines[0])
  }
  expect(seen.size).toBe(WORDS.length * LINES_PER_WORD)
})

test('his bubble draws inside the row, narrow or wide, and types itself out', async () => {
  for (const columns of [50, 80, 160]) {
    for (const word of ['Baking', 'Hyperspacing', 'Herding', 'Whatchamacalliting']) {
      const full = frame({ word, t: 1200, line: lineFor(word, 3), lineT: 5000 }, columns)
      expect(full.length).toBe(columns * 8 * 3)
      const typed = frame({ word, t: 1200, line: lineFor(word, 3), lineT: 70 }, columns)
      expect(typed.length).toBe(columns * 8 * 3)
    }
  }
})

test('a word Clawd has never seen gets twenty lines about that word', async () => {
  const lines = Array.from({ length: UNSEEN_LINES }, (_, n) => lineFor('Defenestrating', n))
  expect(UNSEEN_LINES).toBe(20)
  expect(new Set(lines).size).toBe(20)
  for (const line of lines) expect(line.toLowerCase()).toContain('defenestrating')
  expect(lineFor('Defenestrating', 20)).toBe(lines[0])
})
