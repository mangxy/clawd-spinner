# clawd-spinner

A Claude Code mod: while Claude works, Clawd acts out the spinner word above the spinner line.

> Maintained fork of [saiharsha03/clawd-spinner](https://github.com/saiharsha03/clawd-spinner).
> On top of upstream: no flash on fast turns or `/reload-plugins`, the act stops cleanly at a turn's
> real end, and Clawd opens only when the model actually starts responding — a slow prompt hook
> (memory recall and friends) freezes the UI for a moment, and he no longer stands petrified through
> it; the stock spinner covers that gap and he jumps in the instant the turn really starts.

**It won't use any of your usage.** Every scene is drawn locally from code: no model calls, no tokens,
no network. Your usage goes to the things that matter.

- Every one of Claude Code's 189 spinner words has its own scene: *Baking* slides bread into an oven,
  *Beaming* gets pulled up by a UFO, *Gitifying* draws a commit graph, *Honking* honks.
- A word a later Claude Code adds falls back to one of 11 general acts (cook, think, dance, build, …).
- Clawd talks about what he's doing, in a speech bubble beside his head that follows him around the
  scene and types itself out. He talks like Rocky from *Project Hail Mary*: a question ends in
  ", question?", a word said three times means a lot ("Hot hot hot."), and small words get dropped.
- Every word has ten lines of its own, 1,890 in all, and no two words share a line. *Baking*:
  "Oven very hot. Clawd wait." *Gitifying*: "Merge conflict, question? Ugh." He moves on to the next
  line every 10 seconds, starting somewhere different each turn. A word he has never seen gets
  twenty lines built around it ("Big word. Small Clawd. Defenestrating!").
- Rather have him quiet? `/clawd-talk` turns his speech bubble off (and on again); `/clawd-talk off`
  or `/clawd-talk on` sets it. The choice is remembered across sessions.

## How a word picks its scene

Claude Code picks a random spinner word each turn. `hooks/frame.ts` looks the word up in
`hooks/scenes/` (one scene per word); an unknown word goes to `actFor()` in `hooks/acts.ts`, which
matches stem lists (`saut|whisk|brew…` → cook, …).

His lines are in `hooks/lines.ts` (keyed by the word); `hooks/rocky.ts` picks one and holds the
twenty for unseen words; `bubble()` in `hooks/frame.ts` draws it where `clawd()` last put him.

## Install

```
/plugin marketplace add https://github.com/mangxy/clawd-spinner.git
/plugin install clawd-spinner@clawd-spinner
```

Then `/reload-plugins` (or restart Claude Code). The HTTPS link works with or without SSH keys for
GitHub; the short form `mangxy/clawd-spinner` may try SSH first. Or from a clone:
`claude --plugin-dir ./clawd-spinner`.

### 中文安装

在 Claude Code 里依次执行：

```
/plugin marketplace add https://github.com/mangxy/clawd-spinner.git
/plugin install clawd-spinner@clawd-spinner
/reload-plugins
```

之后 Claude 干活时，输入框上方的官方转圈（✻）头顶就会有一只像素小螃蟹 Clawd 演对应的场景——
189 个转圈词各配一景，旁边还有 Rocky 风台词气泡（`/clawd-talk` 可关）。纯本地动画，
不联网、不耗模型额度。需要 Claude Code 2.1.287+。

To update: `/plugin marketplace update clawd-spinner`, then `/plugin update clawd-spinner@clawd-spinner`.

Needs Claude Code 2.1.287 or newer (mods are on by default from there). Terminal only, in a window at
least 54 columns wide; narrower, the stock spinner shows. On Windows, a "Filename too long" error
while adding the marketplace goes away after `git config --global core.longpaths true`.

## What the hooks do

`hooks/register.tsx` hooks six events and only reads them; it never changes what they carry:

- `session.start`: in an interactive session, reads whether his speech is on, registers `/clawd-talk`,
  and starts a timer that repaints the animation about 12 times a second.
- `command.run` for `/clawd-talk`: turns his speech bubble off or on and remembers the choice.
- `turn.step`: watches the stream's stop chunks — `end_turn` folds the act away right there, before
  the engine's tail redraw, so nothing flashes (mid-turn `tool_use` pauses are skipped: more work is coming).
- `turn.start`: notes when the turn began, so the scene's clock starts at 0 (a subagent's turn doesn't restart it), and nudges one repaint so Clawd mounts the instant the turn starts.
- `turn.complete`: stops the animation when the main turn ends.
- `ui.render` on the `Spinner` component: draws Clawd, and his speech bubble, above the spinner line. Below 54 columns, or outside
  the terminal, it hands the spinner back to Claude Code unchanged. While no turn is running (a slow prompt hook, a reload's repaint), it hands the spinner back too — Clawd only plays during a live turn.

## Privacy: what data it sends

None. The mod reads only the spinner word and the turn's elapsed time that Claude Code hands it,
and draws in the terminal. Every line Clawd says is written into the mod; none is generated. It makes no network requests, no model calls, reads and writes no files,
and stores one thing: whether you turned his speech off (`talk`, in Claude Code's own plugin store). There is no remote server, so there is no privacy policy to link.

## Develop

```
claude plugin validate .
claude plugin test .
npx tsx scripts/preview.ts preview.png Baking Beaming   # PNG contact sheet
```

`/plugin-types .claude-plugin/types` regenerates the editor typings (git-ignored).

## Credits

Spinner word list: [shanraisshan/claude-code-best-practice](https://github.com/shanraisshan/claude-code-best-practice)
(`reports/claude-spinner-verbs-and-tips.md`). Clawd is Anthropic's mascot; this is an unofficial fan mod.

MIT licensed.
