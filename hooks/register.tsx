import type { EngineInterface, Register } from 'claude-code'

import * as A from './acts'
import { encode, frame } from './frame'
import { lineFor } from './rocky'

const FRAME_MS = 83  // ~12 frames a second
const EDGE = 4  // columns kept clear at the right edge
const LINE_MS = 10_000  // Clawd's line moves on to the word's next one every 10 seconds

/** The band above the prompt while a turn runs. Module state: a reload starts the act over, which is fine. */
const spin = {
  turnAt: 0, word: '', last: '', blit: true,
  talk: true,  // his speech bubble; /clawd-talk turns it off and on, remembered across sessions
  mount: null as { requestId: string; columns: number } | null,
  denyAt: 0,
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
  if (!m) return  // the band is folded away: nothing mounted to repaint
  // A denied blit once wore off when the request id changed; the band's id never changes,
  // so retry the blit ourselves after a beat rather than redrawing every frame.
  if (!spin.blit && Date.now() - spin.denyAt > 2000) spin.blit = true
  const now = Date.now()
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
    spin.denyAt = Date.now()
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
  on('turn.start', ($, e, next) => {
    if (!e.agentId) {
      spin.turnAt = Date.now()
      spin.last = ''
      $.ui.invalidate('ui.render')  // wake the band: isWorking has turned
    }
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    if (!e.agentId) $.ui.invalidate('ui.render')  // fold the band away: isWorking has turned
    return await next(e)
  })

  // The spinner's word tells Clawd what to act out; the row itself stays the engine's own. While
  // the model streams its answer the engine takes that row away for the text, so Clawd lives in
  // the band above the prompt, a site it never takes away.
  on('ui.render', { component: 'Spinner' }, ($, e, next) => {
    if (e.surface === 'terminal' && e.props.word) spin.word = e.props.word
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.surface !== 'terminal' || e.props.hasSurvey || !e.props.isWorking) {
      spin.mount = null
      return next(e)
    }
    const columns = (e.props.bodyColumns ?? 0) - EDGE
    if (columns < 50) return next(e)
    const now = Date.now()
    if (!spin.turnAt) spin.turnAt = now  // a reload mid-turn
    const { Raster, Box } = $.ui.resolve(e)
    if (spin.mount?.requestId !== e.requestId) spin.blit = true
    spin.mount = { requestId: e.requestId, columns }
    const cells = encode(frame(moment(now), columns))
    spin.last = cells
    return (
      <Box>
        <Raster key="act" columns={columns} rows={A.ROWS} cells={cells} />
      </Box>
    )
  })
}
