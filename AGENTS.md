# AGENTS.md

Instructions for AI coding agents (Codex and others) working in this repository.
The canonical, detailed guidance lives in [`CLAUDE.md`](./CLAUDE.md) — read it
first; everything there applies here too. Key points:

- Two implementations of the same idea: **Skills** (`skills/` + `agents/`,
  primary) and a **legacy MCP server** (`legacy/mcp/`, archived). Default to the
  Skills implementation.
- Skills/agents are plain markdown with YAML frontmatter — no build step.
- Tests: `node test/skills.mjs` and `node test/installer.mjs` from the repo
  root, no network. Legacy MCP tests run from `legacy/mcp/`.
- The fenced methodology prompts in `skills/*/SKILL.md` are intentionally
  identical to the legacy MCP `SYSTEM` constants in `legacy/mcp/src/tools/` —
  change them together or not at all.
- Each `SKILL.md` has an "Other runtimes" section so the skills work outside
  Claude Code (Codex `spawn_agent`, etc.). Keep those seven sections uniform.
- `INTERNAL.md` is gitignored engineering scratch — never ship or reference it.
- Never commit a real API key; `.env` files live under `legacy/mcp/` only.

## Using the skills from Codex

Install with `npx agentflow-skills install --codex`, enable `multi_agent = true`
in `~/.codex/config.toml`, and dispatch per each skill's "Other runtimes"
section: `spawn_agent` with the filled methodology prompt, `wait_agent`, then
`close_agent`.
