import type { Register } from 'claude-code'

import * as A from './acts'
import { encode, frame } from './frame'
import { lineFor } from './rocky'

const EDGE = 4  // columns kept clear at the right edge
const LINE_MS = 10_000  // Clawd's line moves on to the word's next one every 10 seconds
const TEXT_WINDOW_MS = 600  // after the last answer-text chunk, how long the row stays the engine's own

/**
 * The spinner row while a turn runs. Module state: a reload starts the act over, which is fine.
 *
 * While the model streams its answer the engine takes the spinner row away for the text, and in the
 * gaps between blocks it briefly brings the row back — a mod that draws there unconditionally
 * flashes in and out with those gaps. So the row is drawn only while no answer text has arrived
 * recently: a text chunk of the main loop's stream updates lastTextAt (a thinking chunk never does;
 * the spinner row is alive and Clawd's while Claude thinks), and inside the window the hook hands
 * the row to the engine untouched. The frames ride the engine's own spinner redraws; no clock, no
 * blit bookkeeping.
 */
const spin = {
  turnAt: 0, word: '', talk: true, lastTextAt: 0,
  // talk: his speech bubble; /clawd-talk turns it off and on, remembered across sessions
}

/**
 * The moment to draw: the scene's time and what Clawd says in his bubble. Each word has ten lines,
 * starting at a different one each turn and moving on every 10s.
 */
function moment(now: number): A.Moment {
  const t = now - spin.turnAt
  const n = Math.floor(spin.turnAt / 1000) + Math.floor(t / LINE_MS)
  return { word: spin.word, t, line: spin.talk ? lineFor(spin.word, n) : undefined, lineT: t % LINE_MS }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    if (!e.isInteractive) return next(e)
    try {
      spin.talk = (await $.store.get('talk')) !== false
    } catch {
      spin.talk = true
    }
    await $.command.register({ name: 'clawd-talk', description: "Turn Clawd's speech bubble on the spinner off or on" })
    return next(e)
  })

  // /clawd-talk flips his speech bubble; /clawd-talk on or /clawd-talk off sets it.
  on('command.run', { command: 'clawd-talk' }, async ($, e) => {
    const arg = String((e as any).args ?? '').trim().toLowerCase()
    spin.talk = arg === 'on' ? true : arg === 'off' ? false : !spin.talk
    try {
      await $.store.set('talk', spin.talk)
    } catch {
      // kept for this session only
    }
    return { text: spin.talk ? 'Clawd talks again. Hello hello!' : 'Clawd is quiet now. /clawd-talk brings his voice back.' }
  })

  // The heart of the anti-flash scheme: every text chunk of the main loop's response marks now.
  // A subagent's text (its own agentId) does not touch it: the main window's row is not the one
  // being folded away for it.
  on('turn.step', async function* ($, e, next) {
    if (e.agentId) {
      yield* next(e)
      return
    }
    for await (const chunk of next(e)) {
      if (chunk.kind === 'text') spin.lastTextAt = Date.now()
      yield chunk
    }
  })

  // A subagent's turn starts while the main one runs: the clock keeps the main turn's start.
  on('turn.start', ($, e, next) => {
    if (!e.agentId) {
      spin.turnAt = Date.now()
      spin.lastTextAt = 0  // the new turn has streamed no text yet: the row is Clawd's from frame one
    }
    return next(e)
  })

  // Clawd above the spinner's own line (the word, the tokens, the elapsed time — the engine's
  // own tree, its animation included), standing down whenever answer text is on its way.
  on('ui.render', { component: 'Spinner' }, async ($, e, next) => {
    const official = await next(e)
    if (e.surface !== 'terminal') return official
    if (e.props.word) spin.word = e.props.word
    if (Date.now() - spin.lastTextAt < TEXT_WINDOW_MS) return official  // text is streaming: the row is the engine's own
    const columns = (e.viewport?.columns ?? 0) - EDGE
    if (columns < 50) return official
    const now = Date.now()
    if (!spin.turnAt) spin.turnAt = now  // a reload mid-turn
    const { Raster, Box } = $.ui.resolve(e)
    const cells = encode(frame(moment(now), columns))
    return (
      <Box flexDirection="column">
        <Raster key="act" columns={columns} rows={A.ROWS} cells={cells} />
        {official}
      </Box>
    )
  })
}
