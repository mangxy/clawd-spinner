import type { EngineInterface, Register } from 'claude-code'

import * as A from './acts'
import { encode, frame } from './frame'
import { lineFor } from './rocky'

const FRAME_MS = 83  // ~12 frames a second
const EDGE = 4  // columns kept clear at the right edge
const LINE_MS = 10_000  // Clawd's line moves on to the word's next one every 10 seconds
const TEXT_WINDOW_MS = 600  // after the last answer-text chunk, how long the row stays the engine's own

const LOG = '/tmp/clawd-probe.log'
let buf = ''
let lastFlush = 0
function log($: EngineInterface, s: string) {
  buf += `${Date.now()} ${s}\n`
  const now = Date.now()
  if (now - lastFlush < 1000 && buf.length < 8192) return
  lastFlush = now
  const out = buf
  buf = ''
  void (async () => {
    try {
      const prev = await $.fs.read(LOG).catch(() => '')
      await $.fs.write(LOG, prev + out)
    } catch { /* probe best effort */ }
  })()
}

const spin = {
  turnAt: 0, word: '', talk: true, lastTextAt: 0,
  last: '', blit: true, denyAt: 0, working: false,
  mount: null as { requestId: string; columns: number } | null,
}

function moment(now: number): A.Moment {
  const t = now - spin.turnAt
  const n = Math.floor(spin.turnAt / 1000) + Math.floor(t / LINE_MS)
  return { word: spin.word, t, line: spin.talk ? lineFor(spin.word, n) : undefined, lineT: t % LINE_MS }
}

async function paint($: EngineInterface) {
  const m = spin.mount
  if (!m || !spin.working) return  // standing down (no turn running, text streaming, or the row is gone)
  if (Date.now() - spin.lastTextAt < TEXT_WINDOW_MS) {
    spin.mount = null  // the heart woke mid-tick: the next render hands the row to the engine
    log($, 'paint heart-clear mount')
    return
  }
  if (!spin.blit && Date.now() - spin.denyAt > 2000) {
    spin.blit = true
    log($, 'paint blit-retry-after-deny')
  }
  const cells = encode(frame(moment(Date.now()), m.columns))
  if (cells === spin.last) {
    log($, 'paint same-cells skip')
    return
  }
  spin.last = cells
  if (!spin.blit) {
    log($, 'paint invalidate-path (blit off)')
    $.ui.invalidate('ui.render')
    return
  }
  const r = await $.ui.blit({ requestId: m.requestId, key: 'act', cells })
  if ('deny' in r && r.deny) {
    log($, 'paint BLIT-DENY')
    spin.blit = false
    spin.denyAt = Date.now()
    $.ui.invalidate('ui.render')
  } else {
    log($, 'paint blit-ok')
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
    log($, 'session.start')
    const tick = () => paint($)
    $.clock.every(FRAME_MS, tick)
    return next(e)
  })

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

  on('turn.step', async function* ($, e, next) {
    if (e.agentId) {
      yield* next(e)
      return
    }
    let lastKind = ''
    for await (const chunk of next(e)) {
      if (chunk.kind !== lastKind) {
        lastKind = chunk.kind
        log($, `step kind=${chunk.kind}`)
      }
      if (chunk.kind === 'text') spin.lastTextAt = Date.now()
      yield chunk
    }
  })

  on('turn.start', ($, e, next) => {
    if (!e.agentId) {
      log($, `turn.start (mount was ${spin.mount ? 'set' : 'null'})`)
      spin.working = true  // the act runs only inside a turn: idle paints blit at a row that is
      spin.turnAt = Date.now()  // not on screen, and the engine denies every one of them
      spin.lastTextAt = 0  // the new turn has streamed no text yet: the row is Clawd's from frame one
      spin.mount = null  // the old turn's row is gone; the next render mounts a fresh one
    }
    return next(e)
  })

  on('turn.complete', ($, e, next) => {
    if (!e.agentId) log($, 'turn.complete')
    if (!e.agentId) [spin.working, spin.mount] = [false, null]  // the row folds away with the turn
    return next(e)
  })

  on('ui.render', { component: 'Spinner' }, async ($, e, next) => {
    const official = await next(e)
    if (e.surface !== 'terminal') return official
    if (e.props.word) spin.word = e.props.word
    const inWin = Date.now() - spin.lastTextAt < TEXT_WINDOW_MS
    log($, `render req=${String(e.requestId).slice(-4)} word=${String(e.props.word)} win=${inWin ? 1 : 0} mount=${spin.mount ? 1 : 0}`)
    if (inWin) {
      spin.mount = null  // text is streaming: the row is the engine's own
      return official
    }
    const columns = (e.viewport?.columns ?? 0) - EDGE
    if (columns < 50) return official
    const now = Date.now()
    if (!spin.turnAt) spin.turnAt = now  // a reload mid-turn
    if (!spin.working) log($, `render while idle (working=0)`)
    const { Raster, Box } = $.ui.resolve(e)
    if (spin.mount?.requestId !== e.requestId) spin.blit = true
    spin.mount = { requestId: e.requestId, columns }
    const cells = encode(frame(moment(now), columns))
    spin.last = cells
    return (
      <Box flexDirection="column">
        <Raster key="act" columns={columns} rows={A.ROWS} cells={cells} />
        {official}
      </Box>
    )
  })
}
