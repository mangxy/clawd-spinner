import type { EngineInterface, Register } from 'claude-code'

import * as A from './acts'
import { encode, frame } from './frame'
import { lineFor } from './rocky'

const FRAME_MS = 83  // ~12 frames a second
const EDGE = 4  // columns kept clear at the right edge
const LINE_MS = 10_000  // Clawd's line moves on to the word's next one every 10 seconds

/** The spinner row while a turn runs. Module state: a reload starts the act over, which is fine. */
const spin = {
  turnAt: 0, word: '', working: false, done: false, last: '', blit: true,
  talk: true,  // his speech bubble; /clawd-talk turns it off and on, remembered across sessions
  mount: null as { requestId: string; columns: number } | null,
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

async function paint($: EngineInterface) {
  const m = spin.mount
  if (!m || !spin.working) return
  const now = await $.clock.now()
  if (!spin.working || spin.mount !== m) return  // the turn ended while we awaited
  const cells = encode(frame(moment(now), m.columns))
  if (cells === spin.last) return
  spin.last = cells
  if (!spin.blit) {
    // This row refused blits: redraw it instead (the engine folds these to its own rate).
    $.ui.invalidate('ui.render')
    return
  }
  const r = await $.ui.blit({ requestId: m.requestId, key: 'act', cells })
  if ('deny' in r && r.deny) {
    spin.blit = false
    $.ui.invalidate('ui.render')
  }
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
    const tick = () => paint($)
    $.clock.every(FRAME_MS, tick)
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
    spin.last = ''
    return { text: spin.talk ? 'Clawd talks again. Hello hello!' : 'Clawd is quiet now. /clawd-talk brings his voice back.' }
  })

  // A subagent's turn starts while the main one runs: the clock keeps the main turn's start.
  on('turn.start', async ($, e, next) => {
    if (!spin.working) [spin.working, spin.turnAt] = [true, await $.clock.now()]
    spin.done = false
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const done = await next(e)
    if (!e.agentId) [spin.working, spin.mount, spin.done] = [false, null, true]
    return done
  })

  // Clawd acts out the word with a line in his bubble; under him the spinner's line (the word and
  // the turn's time).
  on('ui.render', { component: 'Spinner' }, async ($, e, next) => {
    const columns = (e.viewport?.columns ?? 0) - EDGE
    if (e.surface !== 'terminal' || columns < 50 || spin.done) {  // a late Spinner frame after turn.complete: don't take it over
      spin.mount = null
      return next(e)
    }
    const { Raster, Box, Text } = $.ui.resolve(e)
    const now = await $.clock.now()
    if (!spin.working) [spin.working, spin.turnAt] = [true, now]  // a reload mid-turn
    if (spin.mount?.requestId !== e.requestId) spin.blit = true
    spin.word = e.props.word
    spin.mount = { requestId: e.requestId, columns }
    const cells = encode(frame(moment(now), columns))
    spin.last = cells
    return (
      <Box flexDirection="column">
        <Raster key="act" columns={columns} rows={A.ROWS} cells={cells} />
        <Text><Text color="#d97757">✻ {e.props.message ?? e.props.word}{e.props.suffix}</Text><Text dimColor> ({A.elapsed(now - spin.turnAt)})</Text></Text>
      </Box>
    )
  })
}
