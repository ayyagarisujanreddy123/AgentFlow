---
name: agentflow-ask
description: General-purpose escape hatch to offload any self-contained subtask to a cheap, isolated Haiku worker. Use when the primary session has a small, well-scoped chunk of work that does not need the main model or the main context — a quick classification, a one-off rewrite, a contained question — and you want it done out-of-band. Dispatches a Haiku worker with a free-form prompt (and optional system override) and returns its answer. Prefer the more specific AgentFlow skills (read, search, summarize, transform, review, gen) when one fits; this is the catch-all.
---

# agentflow-ask

The catch-all. Offload any contained subtask to an isolated Haiku worker with a
free-form prompt. Use it when no more-specific AgentFlow skill fits but you still
want the work done cheaply and out of the primary context.

## When it fires
- "Classify each of these 50 log lines as INFO/WARN/ERROR."
- "Rewrite this commit message in conventional-commits form."
- "Quick: what's the plural of each word in this list?"

> Prefer `agentflow-read` / `-search` / `-summarize` / `-transform` / `-review` /
> `-gen` when the task matches one. This skill is the fallback.

## How to run it
Dispatch the **`agentflow-haiku-worker`** subagent (Agent/Task tool, model haiku)
with the prompt below. Fill in `{prompt}` and optional `{system}` (defaults to a
concise coding-assistant persona). Return the worker's answer verbatim.

```
{system_or_default}

{prompt}
```

Default `{system}` when none is given:
`You are a helpful coding assistant. Be concise and precise.`

## Other runtimes (Codex, and tools without Claude subagents)

The worker above is a Claude Code agent definition; elsewhere only the dispatch
changes — the methodology prompt is identical:

- **Codex CLI:** `spawn_agent` with the filled prompt (requires
  `multi_agent = true` in `~/.codex/config.toml`), `wait_agent` for the result,
  then `close_agent`.
- **Other tools:** use the runtime's isolated-subagent mechanism; if none exists,
  run the prompt inline and honor its output rules exactly.

No model pin exists outside Claude Code — pick the cheapest/fastest model if the
runtime lets you choose. Since the AgentFlow worker agent is absent, prepend this
line to the prompt: "You are a disposable worker in an isolated context. Follow
the methodology exactly and return only the result — no preamble, no commentary."
