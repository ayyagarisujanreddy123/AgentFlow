#!/usr/bin/env node
// agentflow — installer for the AgentFlow Claude Code Skills.
// Copies the bundled skills/ and agents/ into ~/.claude/ (or ./.claude with
// --project). Zero dependencies, plain Node ESM.

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = path.resolve(__dirname, "..");
const SRC = { skills: path.join(PKG_ROOT, "skills"), agents: path.join(PKG_ROOT, "agents") };

const args = process.argv.slice(2);
const destIdx = args.indexOf("--dest");
const destArg = destIdx >= 0 ? args[destIdx + 1] : null;
const positional = args.filter((a, i) => !a.startsWith("-") && (destIdx < 0 || i !== destIdx + 1));
const cmd = positional[0] ?? "help";
const has = (f) => args.includes(f);
const dryRun = has("--dry-run");
const project = has("--project");
const force = has("--force");
const codex = has("--codex");

if (codex && destArg) {
  console.error("Use either --codex or --dest <path>, not both.");
  process.exit(1);
}
if (destIdx >= 0 && !destArg) {
  console.error("--dest requires a path.");
  process.exit(1);
}

// Claude Code gets skills + worker agents. Other runtimes (--codex, --dest) get
// skills only — agents/*.md are Claude agent definitions with no equivalent there.
const claudeTarget = !codex && !destArg;

function skillsDest() {
  if (destArg) return path.resolve(process.cwd(), destArg);
  const dir = codex ? ".codex" : ".claude";
  const base = project ? path.join(process.cwd(), dir) : path.join(os.homedir(), dir);
  return path.join(base, "skills");
}
function agentsDest() {
  const base = project ? path.join(process.cwd(), ".claude") : path.join(os.homedir(), ".claude");
  return path.join(base, "agents");
}

// Bundled skill dirs (skills/<name>/) and agent files (agents/<name>.md).
function bundledSkills() {
  if (!fs.existsSync(SRC.skills)) return [];
  return fs.readdirSync(SRC.skills).filter((d) => fs.statSync(path.join(SRC.skills, d)).isDirectory());
}
function bundledAgents() {
  if (!fs.existsSync(SRC.agents)) return [];
  return fs.readdirSync(SRC.agents).filter((f) => f.endsWith(".md"));
}

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from)) {
    const s = path.join(from, entry);
    const d = path.join(to, entry);
    if (fs.statSync(s).isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function install() {
  const skillsDst = skillsDest();
  const agentsDst = agentsDest();
  const skills = bundledSkills();
  const agents = claudeTarget ? bundledAgents() : [];

  const label = destArg ? skillsDst : `${project ? "project" : "user"} install at ${path.dirname(skillsDst)}`;
  console.log(`AgentFlow → ${codex ? "Codex " : ""}${label}`);
  if (!claudeTarget) console.log("(skills only — worker agents are Claude Code definitions and are skipped)");
  if (dryRun) console.log("(dry run — nothing written)\n");

  for (const s of skills) {
    const to = path.join(skillsDst, s);
    const exists = fs.existsSync(to);
    if (exists && !force && !dryRun) { console.log(`  skip  skills/${s} (exists — use --force)`); continue; }
    console.log(`  ${dryRun ? "would copy" : exists ? "overwrite" : "copy "}  skills/${s}`);
    if (!dryRun) copyDir(path.join(SRC.skills, s), to);
  }
  for (const a of agents) {
    const to = path.join(agentsDst, a);
    const exists = fs.existsSync(to);
    if (exists && !force && !dryRun) { console.log(`  skip  agents/${a} (exists — use --force)`); continue; }
    console.log(`  ${dryRun ? "would copy" : exists ? "overwrite" : "copy "}  agents/${a}`);
    if (!dryRun) { fs.mkdirSync(agentsDst, { recursive: true }); fs.copyFileSync(path.join(SRC.agents, a), to); }
  }

  console.log(`\n${dryRun ? "Would install" : "Installed"} ${skills.length} skills${claudeTarget ? ` + ${agents.length} worker agents` : ""}.`);
  if (!dryRun && claudeTarget) console.log("Open (or restart) Claude Code — the skills are now discoverable.");
  if (!dryRun && codex) console.log('Enable subagents in ~/.codex/config.toml:\n  [features]\n  multi_agent = true');
}

function uninstall() {
  const skillsDst = skillsDest();
  console.log(`AgentFlow uninstall from ${destArg ? skillsDst : path.dirname(skillsDst)}`);
  let removed = 0;
  for (const s of bundledSkills()) {
    const p = path.join(skillsDst, s);
    if (fs.existsSync(p)) { console.log(`  ${dryRun ? "would remove" : "remove"}  skills/${s}`); if (!dryRun) fs.rmSync(p, { recursive: true, force: true }); removed++; }
  }
  for (const a of claudeTarget ? bundledAgents() : []) {
    const p = path.join(agentsDest(), a);
    if (fs.existsSync(p)) { console.log(`  ${dryRun ? "would remove" : "remove"}  agents/${a}`); if (!dryRun) fs.rmSync(p, { force: true }); removed++; }
  }
  console.log(`\n${dryRun ? "Would remove" : "Removed"} ${removed} AgentFlow items. Your other skills/agents are untouched.`);
}

function list() {
  console.log("Bundled AgentFlow skills:");
  for (const s of bundledSkills()) console.log(`  - ${s}`);
  console.log("\nWorker agents:");
  for (const a of bundledAgents()) console.log(`  - ${a.replace(/\.md$/, "")}`);
}

function help() {
  console.log(`agentflow — install AgentFlow Skills into Claude Code

Usage:
  npx agentflow-skills install [--project] [--codex | --dest <path>] [--dry-run] [--force]
  npx agentflow-skills uninstall [--project] [--codex | --dest <path>] [--dry-run]
  npx agentflow-skills list

Targets:
  (default)    ~/.claude/          Claude Code, every project (skills + worker agents)
  --project    ./.claude/          Claude Code, only the current repo
  --codex      ~/.codex/skills/    Codex CLI (skills only; needs multi_agent = true)
  --dest <p>   <p>/                any other runtime's skills dir, e.g. ~/.agents/skills
                                   (skills only — worker agents are Claude-specific)

Flags:
  --dry-run    show what would change, write nothing
  --force      overwrite skills/agents that already exist

Skills run inside your existing session — no API key, no billing.
Repo: https://github.com/ayyagarisujanreddy123/agentflow-skills`);
}

switch (cmd) {
  case "install": install(); break;
  case "uninstall": uninstall(); break;
  case "list": list(); break;
  default: help(); break;
}
