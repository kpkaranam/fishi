# FISHI — Your AI Dev Team That Actually Ships

> **F**uck **I**t, **SH**ip **I**t — An autonomous agent framework for Claude Code that takes projects from **idea to deployment** with minimal human intervention.

```bash
npx fishi init "Build me a SaaS invoicing platform with Stripe"
```

Then run `claude` and watch 18 AI agents plan, code, test, and deploy your project.

---

## What is FISHI?

FISHI is a framework that turns Claude Code into a full development team. Instead of one AI assistant, you get a coordinated team of specialized agents — a master strategist, team leads, and specialist developers — all working in isolated git branches, submitting PRs, and tracking progress on a built-in project board.

### The 3-Layer Agent Hierarchy

```
Master Agent (Opus) — Strategy & Gates
  |
  ├── Planning Lead ── research, planning, architect agents
  ├── Dev Lead ─────── backend, frontend, fullstack agents
  ├── Quality Lead ──── testing, security agents
  └── Ops Lead ──────── devops, docs, writing agents
```

- **Master** makes strategic decisions, manages phase gates, never writes code
- **Coordinators** break objectives into tasks, assign workers, review output
- **Workers** execute in isolated git worktrees, submit PRs back

### The Pipeline

Every project follows a structured flow. No skipping phases.

```
User Request → Discovery → PRD → Architecture → Sprint Plan → Development → Deployment
                GATE        GATE    GATE          GATE                        GATE
```

You approve at each gate. Between gates, agents work autonomously.

---

## Quick Start

### Option 1: CLI (Recommended)

```bash
# New project
mkdir my-app && cd my-app
npx fishi init "Build a real-time chat app with WebSocket"

# Start Claude Code
claude

# Begin the pipeline
> /fishi-init
```

### Option 2: Interactive Wizard

```bash
npx fishi init
# Prompts: What are you building? Cost mode? Language? Framework?
```

### Option 3: Existing Project (Brownfield)

```bash
cd my-existing-project
npx fishi init
# Auto-detects: language, framework, ORM, tests, patterns, tech debt
# Generates CLAUDE.md from your codebase conventions
```

---

## Features

### Autonomous Development
- 18 specialized agents (master + 4 coordinators + 13 workers)
- Dynamic agent creation — need a Solidity specialist? FISHI creates one
- Git worktree isolation — each agent works on its own branch
- PR-based integration — agents submit PRs, you approve merges

### Mandatory Planning
- Brainstorming before any code (Socratic questioning, 2-3 approaches)
- PRD creation with 14 sections (user stories, acceptance criteria, non-functional requirements)
- Architecture design before sprint planning
- Sprint-based development with TaskBoard tracking

### Agent Intelligence
- **TODO Lists** — every agent has a personal checklist, coordinators assign with priority
- **Memory** — agents remember patterns, decisions, and preferences across sessions
- **Learnings** — mistakes and best practices persist across projects (`~/.fishi/learnings/`)
- **Documentation** — mandatory at every phase, checked before gate approval

### Built-in Project Management
- Markdown-native Kanban board (`.fishi/taskboard/board.md`)
- Epics, stories, tasks, sprints — all git-tracked
- No Jira, Asana, or paid tools needed

### Safety
- 56 allow rules + 24 deny rules for Claude Code permissions
- Runtime safety hook blocks: `rm -rf /`, `sudo`, `git push --force origin main`, `drop database`, etc.
- pnpm enforced (npm/yarn blocked)

### Brownfield-Ready
- Deep codebase analysis: ORM, auth, CSS framework, API style, code patterns, file stats, tech debt
- CLAUDE.md auto-populated from discovered conventions
- Brownfield-specific PRD sections for existing system analysis
- Adaptive task graphs that work WITH existing code

---

## Commands

### CLI Commands

| Command | Description |
|---|---|
| `fishi init [description]` | Initialize FISHI (wizard or zero-config) |
| `fishi status` | Show project state, TaskBoard, active agents |
| `fishi validate` | Validate scaffold integrity (82 checks) |
| `fishi mcp add <name>` | Add MCP server (github, perplexity, context7, etc.) |
| `fishi reset [checkpoint]` | Rollback to a checkpoint |

### Slash Commands (inside Claude)

| Command | Description |
|---|---|
| `/fishi-init` | Start the full development pipeline |
| `/fishi-status` | Show project progress |
| `/fishi-board` | Display Kanban board |
| `/fishi-sprint` | Sprint overview and planning |
| `/fishi-gate approve` | Approve current phase gate |
| `/fishi-prd` | Create or manage PRDs |
| `/fishi-resume` | Resume from last checkpoint |
| `/fishi-reset` | Rollback to checkpoint |

---

## Project Structure

After `fishi init`, your project contains:

```
.claude/
├── CLAUDE.md                    # Orchestration brain (pipeline enforcement)
├── settings.json                # Hooks (5) + Permissions (56 allow, 24 deny)
├── agents/                      # 18 agent definitions
│   ├── master-orchestrator.md
│   ├── coordinators/            # planning-lead, dev-lead, quality-lead, ops-lead
│   └── (13 worker agents)
├── skills/                      # 12 skills
└── commands/                    # 8 slash commands

.fishi/
├── fishi.yaml                   # Project configuration
├── state/                       # Project state, agent registry, gates, checkpoints
├── taskboard/                   # Kanban board, backlog, sprints, epics
├── scripts/                     # 15 hook/utility scripts (.mjs, zero-dependency)
├── plans/                       # PRDs, architecture docs, ADRs
├── memory/                      # Project context + per-agent memory
├── learnings/                   # Mistakes + best practices (local + global)
├── todos/                       # Per-agent TODO lists
├── agent-factory/               # Templates for dynamic agent creation
└── model-routing.md             # When to use Opus vs Sonnet vs Haiku
```

---

## How It Works

### 1. You describe what to build
```
> /fishi-init Build a SaaS invoicing platform with Stripe integration
```

### 2. FISHI plans it
- **Discovery**: Brainstorms with you, explores approaches
- **PRD**: Creates detailed requirements with acceptance criteria
- **Architecture**: Designs the system, picks tech stack, defines APIs
- **Sprint Planning**: Breaks into epics, stories, tasks

### 3. Agents build it
- Dev Lead assigns tasks to backend/frontend/fullstack agents
- Each agent works in an isolated git worktree
- Quality Lead runs testing and security agents in parallel
- Completed work is reviewed and submitted as PRs

### 4. You approve at gates
```
PR: agent/dev-lead/backend-agent/auth-endpoints → dev
Files: 3 added, 1 modified | Tests: 12 passing | Coverage: 94%

/fishi-gate approve
```

### 5. Agents learn and improve
- Mistakes are recorded and avoided next time
- Best practices are shared across agents
- Memory persists across sessions
- Learnings persist across projects

---

## Configuration

### Cost Modes

| Mode | Opus Usage | Best For |
|---|---|---|
| `performance` | All coordinators + architect | Speed, complex projects |
| `balanced` (default) | Code review, architecture, security | Most projects |
| `economy` | Only security + architecture | Budget-conscious, simple projects |

### MCP Integrations

FISHI auto-configures core MCPs and suggests project-specific ones:

```bash
fishi mcp add perplexity    # Web search for research
fishi mcp add supabase      # Database access
fishi mcp add playwright    # Browser testing
```

---

## Requirements

- Node.js >= 18
- Claude Code CLI installed
- Git

## License

MIT

---

**Just FISHI.**
