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
