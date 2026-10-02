# clawd-spinner

A Claude Code mod: while Claude works, Clawd acts out the spinner word above the spinner line.

**It won't use any of your usage.** Every scene is drawn locally from code: no model calls, no tokens,
no network. Your usage goes to the things that matter.

- Every one of Claude Code's 189 spinner words has its own scene: *Baking* slides bread into an oven,
  *Beaming* gets pulled up by a UFO, *Gitifying* draws a commit graph, *Honking* honks.
- A word a later Claude Code adds falls back to one of 11 general acts (cook, think, dance, build, …).

## How a word picks its scene

Claude Code picks a random spinner word each turn. `hooks/frame.ts` looks the word up in
`hooks/scenes/` (one scene per word); an unknown word goes to `actFor()` in `hooks/acts.ts`, which
matches stem lists (`saut|whisk|brew…` → cook, …).

## Install

```
/plugin marketplace add saiharsha03/clawd-spinner
/plugin install clawd-spinner@clawd-spinner
```

Or from a clone: `claude --plugin-dir ./clawd-spinner`.

Terminal only. Needs a window at least 54 columns wide; narrower, the stock spinner shows.

## What the hooks do

`hooks/register.tsx` hooks four events and only reads them; it never changes what they carry:

- `session.start`: in an interactive session, starts a timer that repaints the animation about 12 times a second.
- `prompt.submit`: notes when the turn began, so the scene's clock starts at 0. The prompt passes through untouched.
- `turn.complete`: stops the animation when the main turn ends.
- `ui.render` on the `Spinner` component: draws Clawd above the spinner line. Below 54 columns, or outside
  the terminal, it hands the spinner back to Claude Code unchanged.

## Privacy: what data it sends

None. The mod reads only the spinner word and the turn's elapsed time that Claude Code hands it,
and draws in the terminal. It makes no network requests, no model calls, reads and writes no files,
and stores nothing. There is no remote server, so there is no privacy policy to link.

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
