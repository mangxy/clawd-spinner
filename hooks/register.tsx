import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import * as A from './acts'
import { setSize } from './acts'
import { encode, frame } from './frame'
import { lineFor } from './rocky'

const FRAME_MS = 83  // ~12 frames a second

// The act's continuity, kept by the host: a plugin reload starts the module
// over — its heartbeat keeps beating, the engine has no unload event to stop
// it — so several generations of the module end up painting at once, each from
// its own half-remembered state, and the band flashes scenes at random. With
// the state itself living here, every generation reads the same act and draws
// the same frame; gen rises on each load and the older heartbeats see it move
// and stop themselves
const act = atom({ plugin: 'clawd-spinner', key: 'act' } as const, { word: '', turnAt: 0, force: null as string | null, gen: 0 })
let myGen = 0  // the gen this module loaded under; a heartbeat reading another has been replaced
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
  // (the 0.5.x home, where streaming text takes the row and Clawd with it).
  // Set from the manifest's userConfig, handed to register as `options`
  place: 'band' as 'band' | 'spinner',
  talk: true,
  last: '', blit: true, denyAt: 0, working: false,
  mount: null as { requestId: string; columns: number } | null,
}

type ActState = { word: string; turnAt: number; force: string | null; gen: number }

function moment(a: ActState, now: number): A.Moment {
  const t = now - a.turnAt
  const n = Math.floor(a.turnAt / 1000) + Math.floor(t / LINE_MS)
  return { word: a.word, t, line: spin.talk ? lineFor(a.word, n) : undefined, lineT: t % LINE_MS }
}

/** The frame for the act as it stands: the act's scene if the word is in,
 *  a blank stage holding the row's height while it isn't. */
function cellsFor(a: ActState, columns: number, now: number) {
  if (!a.word) return blankCells(columns)
  return encode(frame(moment(a, now), columns))
}

/** A blank stage, the row's height held: drawn while no word has reached us —
 *  the first frames after a plugin reload, before the Spinner's next render
 *  hands the word back. Drawing the act there would flash a wrong scene. */
function blankCells(columns: number) {
  const u = new Uint32Array(columns * A.ROWS * 3)
  for (let i = 0; i < u.length; i += 3) { u[i] = 0x20; u[i + 1] = A.DEF; u[i + 2] = A.DEF }
  return encode(u)
}

let heartbeats = 0
async function paint($: EngineInterface) {
  const m = spin.mount
  if (!m) return  // standing down (the row is gone)
  // a replaced module's heartbeat: it reads another generation's gen and stops.
  // Its mounts are stale anyway — its blits fall to deny and it would only
  // churn invalidate for as long as it ran
  if (++heartbeats % 30 === 0) {
    const a = await read($, act)
    if (a.gen !== myGen) {
      log($, 'paint gen-mismatch, heartbeat retiring')
      timer?.cancel()
      return
    }
  }
  if (!spin.blit && Date.now() - spin.denyAt > 2000) {
    spin.blit = true
    log($, 'paint blit-retry-after-deny')
  }
  const a = await read($, act)
  const cells = cellsFor(a, m.columns, Date.now())
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

let timer: { cancel(): void } | null = null

export const register: Register = (on, options) => {
  if (options?.place === 'band' || options?.place === 'spinner') spin.place = options.place
  if (options?.size === 'small' || options?.size === 'middle' || options?.size === 'large') setSize(options.size)
  on('session.start', async ($, e, next) => {
    if (!e.isInteractive) return next(e)
    try {
      spin.talk = (await $.store.get('talk')) !== false
    } catch {
      spin.talk = true
    }
    try {
      // this load's generation: the heartbeats of every older module see the
      // rise and retire; ours carries the act on from where it stood
      myGen = (await read($, act)).gen + 1
      await update($, act, cur => ({ ...cur, gen: myGen }))
    } catch { /* a fresh session: nothing to pick up */ }
    await $.command.register({ name: 'clawd-talk', description: "Turn Clawd's speech bubble on the spinner off or on" })
    await $.command.register({ name: 'clawd-word', description: 'Act out a word of your choosing — no more waiting on the spinner to roll it (no arg: back to the real words)' })
    log($, 'session.start')
    timer?.cancel()  // a hot reload's leftover from this module's last load, if any
    timer = $.clock.every(FRAME_MS, () => void paint($))
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

  on('command.run', { command: 'clawd-word' }, ($, e) => {
    const arg = String((e as any).args ?? '').trim()
    const force = arg || null
    // the new act starts now, from its first frame — written to the atom, so
    // whichever module's heartbeat paints next draws it
    void update($, act, cur => ({ ...cur, force, word: arg || cur.word, turnAt: Date.now() })).catch(() => {})
    spin.last = ''
    return { text: arg ? `Clawd acts out "${arg}" until you clear it: /clawd-word with no arg.` : 'Back to the real spinner words.' }
  })

  on('turn.start', ($, e, next) => {
    if (!e.agentId) {
      log($, `turn.start (mount was ${spin.mount ? 'set' : 'null'})`)
      // the act starts with the turn, not the submit: between them the prompt
      // hooks (memory recall & co.) may hold the UI frozen — Clawd mounted
      // there would stand petrified the whole wait. The official spinner row
      // covers it; Clawd mounts on the first render after this point
      spin.working = true
      // The word and the clock stay as they are: commands fire this event too
      // (a /reload-plugins among them) and never fire a turn.complete to
      // close it, so anything set here would leak. The old act plays on
      // seamlessly and the new word's arrival opens the new scene
      spin.last = ''
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
    // the word tells Clawd what to act out in either place. A new word opens
    // its scene from its first frame; the same word is the same act, kept on
    let word = e.props.word as string
    const cur = await read($, act)
    if (word && !cur.force && word !== cur.word) {
      const now = Date.now()
      await update($, act, s => ({ ...s, word, turnAt: now })).catch(() => {})
      spin.last = ''
    }
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
    const { Raster, Box } = $.ui.resolve(e)
    if (spin.mount?.requestId !== e.requestId) spin.blit = true
    spin.mount = { requestId: e.requestId, columns }
    const cells = cellsFor(await read($, act), columns, Date.now())
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
    const { Raster, Box } = $.ui.resolve(e)
    if (spin.mount?.requestId !== e.requestId) spin.blit = true
    spin.mount = { requestId: e.requestId, columns }
    const a = await read($, act)
    const cells = cellsFor(a, columns, Date.now())
    log($, `band take req=${String(e.requestId).slice(-4)} cols=${columns} word=${a.word || '(none)'}`)
    spin.last = cells
    return (
      <Box>
        <Raster key="act" columns={columns} rows={A.ROWS} cells={cells} />
      </Box>
    )
  })
}
