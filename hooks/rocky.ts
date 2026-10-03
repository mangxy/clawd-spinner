// What Clawd says in his bubble about the word he is acting out, the way Rocky talks in Project
// Hail Mary: a question ends in ", question?", a word said three times is strong feeling, small
// words dropped. Every spinner word has its own ten lines about what that word means (lines.ts);
// a word a later Claude Code adds gets ten lines built around the word itself.
// Pure: lineFor(word, n) picks line n (mod 10).
import { keyOf } from './frame'
import { LINES } from './lines'

const up = (s: string) => s[0]!.toUpperCase() + s.slice(1)

// For a word Clawd has never seen: every line names it, so it still talks about that word.
const UNSEEN: ((w: string, W: string) => string)[] = [
  (w, W) => `${W}, question? New word!`,
  (w, W) => `${W} ${w} ${w}.`,
  w => `Never ${w} before. Try try.`,
  w => `Clawd learn ${w} now.`,
  w => `What ${w} mean, question?`,
  (w, W) => `${W}... like this, question?`,
  w => `First time ${w}. Careful.`,
  (w, W) => `${W} strange. Clawd curious.`,
  w => `Watch Clawd ${w}. Learning!`,
  (w, W) => `${W} getting easier. Good.`,
  w => `Who invent ${w}, question?`,
  (w, W) => `${W}! Clawd do best best.`,
  (w, W) => `Big word. Small Clawd. ${W}!`,
  w => `Teach Clawd ${w}, friend.`,
  (w, W) => `${W} in new update, question?`,
  w => `Hmm hmm. ${w} hard.`,
  (w, W) => `${W}. Clawd practice practice.`,
  w => `Is ${w} science, question?`,
  (w, W) => `${W} done! Clawd proud.`,
  w => `Add ${w} to Clawd list.`,
]

/** How many lines each known word has, and how many an unseen word cycles through. */
export const LINES_PER_WORD = 10
export const UNSEEN_LINES = UNSEEN.length

/** Line `n` for a spinner word: its own ten (mod 10), else twenty built on the unseen word (mod 20). */
export function lineFor(word: string, n: number): string {
  const w = keyOf(word)
  if (!w) return ''
  const own = LINES[w]
  const size = own ? LINES_PER_WORD : UNSEEN_LINES
  const i = ((n % size) + size) % size
  return own ? own[i]! : UNSEEN[i]!(w, up(w))
}

/** The words that have their own lines. */
export const WORDS_WITH_LINES = Object.keys(LINES)
