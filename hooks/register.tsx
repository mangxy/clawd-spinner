import type { EngineInterface, Register } from 'claude-code'

import * as A from './acts'
import { encode, frame } from './frame'
import { lineFor } from './rocky'

const FRAME_MS = 83  // ~12 frames a second
const EDGE = 4  // columns kept clear at the right edge
const LINE_MS = 10_000  // Clawd's line moves on to the word's next one every 10 seconds

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
  // where Clawd acts out: the band above the prompt (default — the engine never
  // takes that row away, and it carries its own [-] fold) or the spinner row
  // (the 0.5.x home, where streaming text takes the row and Clawd with it)
  place: 'band' as 'band' | 'spinner',
  turnAt: 0, word: '', talk: true,
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
  if (!m || !spin.working) return  // standing down (no turn running, or the row is gone)
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
      const place = await $.store.get('place')
      if (place === 'band' || place === 'spinner') spin.place = place
    } catch {
      spin.talk = true
    }
    await $.command.register({ name: 'clawd-talk', description: "Turn Clawd's speech bubble on the spinner off or on" })
    await $.command.register({ name: 'clawd-place', description: 'Move Clawd between the band above the prompt and the spinner row' })
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

  // /clawd-place moves Clawd; /clawd-place band or /clawd-place spinner sets it.
  on('command.run', { command: 'clawd-place' }, async ($, e) => {
    const arg = String((e as any).args ?? '').trim().toLowerCase()
    if (arg === 'band' || arg === 'spinner') spin.place = arg
    else spin.place = spin.place === 'band' ? 'spinner' : 'band'
    try {
      await $.store.set('place', spin.place)
    } catch {
      // kept for this session only
    }
    spin.mount = null  // the old row's blit anchor is void now
    spin.last = ''
    $.ui.invalidate('ui.render')  // wake the row Clawd just moved to
    return {
      text: spin.place === 'band'
        ? 'Clawd takes the band above the prompt. Fold him with the [-] when he crowds you.'
        : 'Clawd squeezes back onto the spinner row, standing down while text streams. /clawd-place band brings him up.',
    }
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
      // every API request's stream ends in a stop chunk, but stopReason tells
      // the two apart: tool_use pauses mean more work is coming (the act keeps
      // running through them), end_turn is the loop's exit — fold right there,
      // before the engine's tail redraws, so no takeover frame flashes.
      // On the band the engine's own isWorking folds it; this is the spinner
      // row's exit only
      if (chunk.kind === 'stop') {
        log($, `stop reason=${chunk.stopReason}`)
        if (chunk.stopReason === 'end_turn' && spin.place === 'spinner') {
          log($, 'end_turn → fold')
          ;[spin.working, spin.mount] = [false, null]
        }
      }
      yield chunk
    }
  })

  on('turn.start', ($, e, next) => {
    if (!e.agentId) {
      log($, `turn.start (mount was ${spin.mount ? 'set' : 'null'})`)
      // the act starts with the turn, not the submit: between them the prompt
      // hooks (memory recall & co.) may hold the UI frozen — Clawd mounted
      // there would stand petrified the whole wait. The official spinner row
      // covers it; Clawd mounts on the first render after this point
      spin.working = true
      spin.turnAt = Date.now()
      spin.last = ''  // a fresh act: don't let a same-cells frame skip the first paint
      // the engine doesn't repaint the spinner row on its own once the hooks
      // finish — the row just sits there until the next token tick. One nudge
      // mounts Clawd the instant the freeze lifts
      $.ui.invalidate('ui.render')
    }
    return next(e)
  })

  on('turn.complete', ($, e, next) => {
    if (!e.agentId) {
      log($, 'turn.complete')
      // fold the act away for good — no mid-turn stop revival past this point
      ;[spin.working, spin.mount] = [false, null]
      // on the band isWorking has just turned, but the engine won't repaint it
      // on its own — nudge once so the band folds the moment the turn ends
      $.ui.invalidate('ui.render')
    }
    return next(e)
  })

  on('ui.render', { component: 'Spinner' }, async ($, e, next) => {
    const official = await next(e)
    if (e.surface !== 'terminal') return official
    // the word tells Clawd what to act out in either place
    if (e.props.word) spin.word = e.props.word
    if (spin.place !== 'spinner') return official
    // idle means idle, all of it: the submit's renders still behind the prompt
    // hooks, a reload's repaint, a resize, a freshly reloaded module with no
    // history — the row stays the engine's own (the official ✻ stands in).
    // Clawd opens only once turn.start has fired: the model request is really
    // leaving, the freeze is over, the act runs its whole length live
    if (!spin.working) {
      log($, 'render idle-pass (no turn started)')
      return official
    }
    log($, `render req=${String(e.requestId).slice(-4)} word=${String(e.props.word)} mount=${spin.mount ? 1 : 0}`)
    const columns = (e.viewport?.columns ?? 0) - EDGE
    if (columns < 50) return official
    const now = Date.now()
    if (!spin.turnAt) spin.turnAt = now  // a reload mid-turn, before its first render
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

  // The band above the prompt: a row the engine never takes away for text, so
  // Clawd plays here through thinking, tools and streaming alike. Its props
  // carry the whole lifecycle — isWorking turns with the turn, bodyColumns
  // sizes the stage, and the row wears the engine's own [-] fold. No state of
  // ours to keep: the clock's paint() blits into the mount below.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (spin.place !== 'band') return next(e)
    if (e.surface !== 'terminal' || e.props.hasSurvey || !e.props.isWorking) {
      spin.mount = null  // the band is folded away: nothing mounted to repaint
      return next(e)
    }
    const columns = (e.props.bodyColumns ?? 0) - EDGE
    if (columns < 50) return next(e)
    const now = Date.now()
    if (!spin.turnAt) spin.turnAt = now  // a reload mid-turn, before its first render
    const { Raster, Box } = $.ui.resolve(e)
    if (spin.mount?.requestId !== e.requestId) spin.blit = true
    spin.mount = { requestId: e.requestId, columns }
    log($, `band take req=${String(e.requestId).slice(-4)} cols=${columns}`)
    const cells = encode(frame(moment(now), columns))
    spin.last = cells
    return (
      <Box>
        <Raster key="act" columns={columns} rows={A.ROWS} cells={cells} />
      </Box>
    )
  })
}
