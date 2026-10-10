---
name: "separate-cli-commands"
description: "Use whenever presenting terminal/shell/CLI commands to the user (install steps, setup instructions, any runnable commands). Ensures each command is given as its own separate copyable entry rather than combined into one block."
---

# Separate CLI Commands

When presenting terminal, shell, or CLI commands to the user, **always give each command as its own separate, individually copyable entry** — one command per code block. Do not combine multiple commands into a single block for the user to copy all at once.

## Why

Commands are often sequentially dependent in ways that break when pasted together:

- One command modifies `PATH` (e.g. `winget install`, `uv tool install`, `pipx install`, installers that add a bin directory) and the change only takes effect in a **new** terminal session — so a following command that relies on it fails with "command not found" if run in the same session.
- A command may prompt for input, require accepting a license, or need to finish before the next one is valid.
- Errors in an earlier command should be seen and resolved before the next runs.

Separating commands ensures proper, verifiable execution step by step.

## How to present

- Put **each command in its own fenced code block**, numbered or briefly labeled with what it does.
- Call out explicitly when the user must **open a new terminal** between steps (e.g. after any install that changes `PATH`).
- Note expected prompts, PATH caveats, or verification checks (e.g. "if `X` isn't found, run `...` and open a new terminal").
- Never present a multi-line block of chained commands as the single thing to copy, unless the user explicitly asks for a one-liner or a combined script.

## Example

Instead of one block containing three commands, present:

1. Install the tool:
```
winget install astral-sh.uv
```
Then open a new terminal (this adds `uv` to your PATH).

2. Install the package:
```
uv tool install graphifyy
```

3. Register it:
```
graphify install
```

