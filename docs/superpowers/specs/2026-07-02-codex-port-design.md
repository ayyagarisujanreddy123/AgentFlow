# Codex / cross-runtime port — design

Date: 2026-07-02
Status: approved-by-default (user requested "work on it"; scope question timed out, recommended option taken: Codex first, designed for more runtimes)

## Problem

AgentFlow skills only run in Claude Code today: each SKILL.md dispatches a named
Claude Code subagent (`agentflow-haiku-worker` / `agentflow-sonnet-worker`) with a
Claude-specific model pin. Codex (OpenAI CLI) and other tools have no Haiku/Sonnet
and no Claude agent-definition format, so the skills are undispatched dead weight
there. The user wants the skills usable in Codex and other AI coding tools.

## What ports and what doesn't

- **Ports:** the methodology prompts (the real value — review format, gen rules,
  format discipline) and the context firewall (Codex `spawn_agent` gives an
  isolated subagent context; most tools have some equivalent).
- **Does not port:** model pinning. Codex workers run the runtime's default model.
  The cheap-Haiku economics are lost; documented honestly.

## Approach chosen: single-source portable skills

(Chosen over "Codex-native fork" — a second tree duplicates 7 methodology prompts
and drifts; and over "port methodology only" — that gives up the existing Claude
wiring for nothing.)

One `skills/` tree stays the single source of truth. Each SKILL.md keeps its
Claude Code dispatch line verbatim (tests and the primary product depend on it)
and gains a short, uniform **"Other runtimes"** subsection:

- **Codex CLI:** `spawn_agent` with the filled prompt (requires
  `multi_agent = true` in `~/.codex/config.toml`), `wait_agent`, `close_agent`.
- **Any other tool:** use its isolated-subagent mechanism; if none, run the
  prompt inline and honor its output rules exactly.
- Because non-Claude runtimes lack the worker agent files (which carry the
  worker persona), the subsection tells the dispatcher to prepend one preamble
  line: *"You are a disposable worker in an isolated context. Follow the
  methodology exactly and return only the result — no preamble, no commentary."*
- Model guidance replaces the pin: haiku-tier skills say "cheapest/fastest model
  if the runtime lets you choose"; sonnet-tier skills (gen, review) say
  "strongest available model — correctness matters".

The fenced methodology prompts are **not touched** (they stay in sync with the
legacy MCP `SYSTEM` constants per CLAUDE.md).

`agents/*.md` stay Claude-only and are not installed elsewhere.

## Installer (`bin/agentflow.js`)

- `--codex`: install skills into `~/.codex/skills/` (or `./.codex/skills` with
  `--project`). Skips `agents/` and prints why (Claude-only format). Prints the
  `multi_agent = true` config reminder.
- `--dest <path>`: install skills into an arbitrary skills directory (covers
  `~/.agents/skills/` and future tools). Also skips agents.
- `uninstall` honors the same flags. `help` documents them.

## Docs

- `AGENTS.md` at repo root: Codex-facing repo instructions, pointing to CLAUDE.md.
- README: "Use with Codex / other tools" section — install command, what you
  keep (methodology + firewall), what you lose (model pins).
- CHANGELOG: Unreleased entry. CLAUDE.md: note the portable dispatch subsection
  and the rule to keep the 7 subsections uniform.

## Tests

- `test/skills.mjs`: per skill, assert the Other-runtimes subsection exists
  (`spawn_agent`, `multi_agent`, the worker preamble line). +3 checks × 7 skills.
- `test/installer.mjs`: `--codex` installs skills (no agents) into `.codex/skills`,
  `--dest` installs into the given dir, uninstall cleans both.

## Error handling

Installer: unknown `--dest` parent dirs are created (`mkdir -p` semantics, same
as today); `--codex` + `--dest` together is an error (ambiguous target).

## Out of scope

Per-runtime forks, Codex agent-definition emulation, any change to fenced
methodology prompts, legacy MCP.
