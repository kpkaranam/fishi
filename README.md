<p align="center">
  <h1 align="center">FISHI</h1>
  <p align="center">
    <strong>Your AI Dev Team That Actually Ships</strong>
  </p>
  <p align="center">
    An autonomous multi-agent framework for Claude Code that takes projects from <b>idea to deployment</b>.
  </p>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@qlucent/fishi"><img src="https://img.shields.io/npm/v/@qlucent/fishi?style=flat-square&color=0066cc&label=npm" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/@qlucent/fishi"><img src="https://img.shields.io/npm/dm/@qlucent/fishi?style=flat-square&color=green" alt="npm downloads"></a>
  <a href="https://github.com/kpkaranam/fishi/actions"><img src="https://img.shields.io/github/actions/workflow/status/kpkaranam/fishi/ci.yml?style=flat-square&label=CI" alt="CI"></a>
  <a href="https://github.com/kpkaranam/fishi"><img src="https://img.shields.io/github/stars/kpkaranam/fishi?style=flat-square&color=yellow" alt="stars"></a>
  <a href="https://github.com/kpkaranam/fishi/blob/master/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="license"></a>
  <img src="https://img.shields.io/badge/agents-18-purple?style=flat-square" alt="18 agents">
  <img src="https://img.shields.io/badge/tests-456-brightgreen?style=flat-square" alt="456 tests">
  <img src="https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square" alt="Node.js 18+">
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> &bull;
  <a href="#-features">Features</a> &bull;
  <a href="#-how-it-works">How It Works</a> &bull;
  <a href="#-commands">Commands</a> &bull;
  <a href="#-roadmap">Roadmap</a>
</p>

---

```bash
npx @qlucent/fishi init "Build me a SaaS invoicing platform with Stripe"
```

> Run `claude` and watch **18 AI agents** plan, code, test, and deploy your project.

---

## What is FISHI?

Most AI coding tools give you **one assistant**. FISHI gives you an **entire development team** — a master strategist, 4 team leads, and 13 specialist developers — all working in isolated git branches, submitting PRs, and tracking progress on a built-in project board.

```
                         Master Agent (Opus)
                     Strategy & Phase Gates Only
                               |
          _____________________|_____________________
         |            |             |                |
   Planning Lead   Dev Lead    Quality Lead      Ops Lead
         |            |             |                |
   research      backend       testing          devops
   planning      frontend      security         docs
   architect     fullstack                      writing
                 uiux                           marketing
```

> **Master** makes strategic decisions, manages phase gates, never writes code.
> **Coordinators** break objectives into tasks, assign workers, review output.
> **Workers** execute in isolated git worktrees, submit PRs back.

### The Pipeline

Every project follows a mandatory gated flow:

```
User Request --> Discovery --> PRD --> Architecture --> Sprint Plan --> Development --> Deployment
                  GATE        GATE      GATE            GATE                           GATE
```

You approve at each gate. Between gates, agents work **autonomously**.

---

## Quick Start

<table>
<tr>
<td width="50%">

### CLI (Recommended)

```bash
mkdir my-app && cd my-app
npx @qlucent/fishi init "Build a chat app"
claude
> /fishi-init
```

</td>
<td width="50%">

### Claude Code Plugin

```bash
# Inside Claude Code:
/plugin marketplace add kpkaranam/fishi
/plugin install fishi@qlucent-fishi
```

</td>
</tr>
</table>

<details>
<summary><b>More installation options</b></summary>

### Interactive Wizard

```bash
npx @qlucent/fishi init
# Prompts: What are you building? Cost mode? Language? Framework?
```

### Existing Project (Brownfield)

```bash
cd my-existing-project
npx @qlucent/fishi init
# Auto-detects: language, framework, ORM, tests, patterns, tech debt
# Safely merges with your existing CLAUDE.md, settings.json, .mcp.json
# Never overwrites — asks permission for every conflict
```

### Non-Interactive (CI/Automation)

```bash
npx @qlucent/fishi init "My project" --merge-all    # Merge all conflicts
npx @qlucent/fishi init "My project" --replace-all  # Replace all (backup saved)
```

</details>

---

## Features

### Multi-Agent Development

| What | Count | Details |
|------|-------|---------|
| Agents | 18 | 1 master + 4 coordinators + 13 specialists |
| Skills | 12 | brainstorming, code-gen, debugging, testing, deployment, PRD... |
| Commands | 8 | `/fishi-init`, `/fishi-gate`, `/fishi-board`, `/fishi-sprint`... |
| Hook Scripts | 15 | session-start, auto-checkpoint, safety-check, phase-runner... |
| Permission Rules | 80 | 56 allow + 24 deny |
| Pipeline Phases | 8 | 5 with approval gates |

<details>
<summary><b>See all 18 agents</b></summary>

| Layer | Agent | Role |
|-------|-------|------|
| L0 | Master Orchestrator | Strategy, delegation, gate management |
| L1 | Planning Lead | Coordinates research, planning, architecture |
| L1 | Dev Lead | Coordinates backend, frontend, fullstack work |
| L1 | Quality Lead | Coordinates testing, security audits |
| L1 | Ops Lead | Coordinates devops, docs, marketing |
| L2 | Research Agent | Market research, competitive analysis |
| L2 | Planning Agent | Sprint planning, task breakdown |
| L2 | Architect Agent | System design, tech stack decisions |
| L2 | Backend Agent | APIs, services, database logic |
| L2 | Frontend Agent | UI components, state management |
| L2 | Fullstack Agent | End-to-end feature implementation |
| L2 | UI/UX Agent | Design systems, accessibility, responsive layouts |
| L2 | DevOps Agent | CI/CD, Docker, infrastructure |
| L2 | Testing Agent | Unit, integration, E2E tests (TDD) |
| L2 | Security Agent | OWASP audits, vulnerability scanning |
| L2 | Docs Agent | API docs, architecture guides |
| L2 | Writing Agent | User-facing copy, README, changelogs |
| L2 | Marketing Agent | Landing pages, launch materials |

</details>

### Agent Intelligence

- **Memory** — agents remember patterns, decisions, and preferences across sessions
- **Learnings** — mistakes and best practices persist across projects (`~/.fishi/learnings/`)
- **TODO Lists** — coordinators assign prioritized tasks to workers
- **Documentation** — mandatory at every phase, checked before gate approval

### Safe Brownfield Support

> FISHI never overwrites your existing files without asking.

- **Conflict detection** across 7 categories (CLAUDE.md, settings.json, agents, skills, commands, .mcp.json, .gitignore)
- **Always backs up** — timestamped snapshots before any modification
- **Interactive resolution** — per-category `Skip` / `Merge` / `Replace`
- **Smart merging** — union merge for hooks & permissions, additive for MCP servers, FISHI section prepended to root CLAUDE.md
- Deep codebase analysis: ORM, auth, CSS, API style, code patterns, tech debt
- CLAUDE.md auto-populated from discovered conventions

### Built-in Project Management

- Markdown Kanban board — no Jira, Asana, or paid tools needed
- Epics, stories, tasks, sprints — all git-tracked
- Checkpoints & session resume — pick up where you left off

### Safety & Permissions

```
56 allow rules + 24 deny rules

Blocks: rm -rf /, sudo, git push --force origin main, drop database,
        shutdown, mkfs, nmap, fork bombs...

Enforces: pnpm only (npm/yarn blocked)
```

---

## How It Works

<table>
<tr><td>

**Step 1** — You describe what to build

```
/fishi-init Build a SaaS invoicing platform with Stripe
```

</td></tr>
<tr><td>

**Step 2** — FISHI plans it

Discovery (brainstorming) --> PRD (14 sections) --> Architecture (tech stack, APIs) --> Sprint Planning (epics, stories, tasks)

</td></tr>
<tr><td>

**Step 3** — Agents build it

Dev Lead assigns tasks. Each agent works in an **isolated git worktree**. Quality Lead runs tests in parallel. Work is submitted as PRs.

</td></tr>
<tr><td>

**Step 4** — You approve at gates

```
PR: agent/dev-lead/backend-agent/auth-endpoints --> dev
Files: 3 added, 1 modified | Tests: 12 passing | Coverage: 94%

/fishi-gate approve
```

</td></tr>
<tr><td>

**Step 5** — Agents learn and improve

Mistakes recorded. Best practices shared. Memory persists across sessions. Learnings persist across projects.

</td></tr>
</table>

---

## Commands

<details open>
<summary><b>CLI Commands</b></summary>

| Command | Description |
|---------|-------------|
| `fishi init [description]` | Initialize FISHI (wizard or zero-config) |
| `fishi init --merge-all` | Brownfield — merge all conflicts automatically |
| `fishi init --replace-all` | Brownfield — replace all (backup saved) |
| `fishi status` | Project state, TaskBoard, active agents |
| `fishi validate` | Validate scaffold integrity |
| `fishi mcp add <name>` | Add MCP server |
| `fishi reset [checkpoint]` | Rollback to a checkpoint |

</details>

<details open>
<summary><b>Slash Commands (inside Claude Code)</b></summary>

| Command | Description |
|---------|-------------|
| `/fishi-init` | Start the development pipeline |
| `/fishi-status` | Show project progress |
| `/fishi-board` | Display Kanban board |
| `/fishi-sprint` | Sprint overview and planning |
| `/fishi-gate approve` | Approve current phase gate |
| `/fishi-prd` | Create or manage PRDs |
| `/fishi-resume` | Resume from last checkpoint |
| `/fishi-reset` | Rollback to checkpoint |

</details>

---

## Project Structure

<details>
<summary><b>What <code>fishi init</code> creates</b></summary>

```
.claude/
  CLAUDE.md                    # Orchestration brain (pipeline enforcement)
  settings.json                # Hooks (5) + Permissions (80 rules)
  agents/                      # 18 agent definitions
    master-orchestrator.md
    coordinators/              # planning-lead, dev-lead, quality-lead, ops-lead
    (13 worker agents)
  skills/                      # 12 skills
  commands/                    # 8 slash commands

.fishi/
  fishi.yaml                   # Project configuration
  state/                       # Phase state, agent registry, gates, checkpoints
  taskboard/                   # Kanban board, backlog, sprints, epics
  scripts/                     # 15 hook/utility scripts (.mjs, zero deps)
  plans/                       # PRDs, architecture docs, ADRs
  memory/                      # Project context + per-agent memory
  learnings/                   # Mistakes + best practices (local + global)
  todos/                       # Per-agent TODO lists
  backup/                      # Timestamped backups of pre-FISHI files
  agent-factory/               # Templates for dynamic agent creation
  model-routing.md             # When to use Opus vs Sonnet vs Haiku
```

</details>

---

## Configuration

### Cost Modes

| Mode | Opus Usage | Best For |
|------|-----------|---------|
| `performance` | All coordinators + architect | Speed, complex projects |
| `balanced` | Code review, architecture, security | Most projects (default) |
| `economy` | Only security + architecture | Budget-conscious |

### MCP Integrations

```bash
fishi mcp add perplexity    # Web search for research
fishi mcp add supabase      # Database access
fishi mcp add playwright    # Browser testing
```

---

## Test Coverage

<table>
<tr>
<td align="center"><b>456</b><br>Total Tests</td>
<td align="center"><b>16</b><br>Test Files</td>
<td align="center"><b>51</b><br>E2E Tests</td>
<td align="center"><b>3</b><br>Node Versions</td>
</tr>
</table>

| Category | Tests | Coverage |
|----------|-------|---------|
| Core templates | 302 | All agents, skills, commands, hooks, configs |
| CLI | 60 | Brownfield analysis, conflict detection, project detection |
| Brownfield safety | 36 | Conflict detection, backup, merge strategies |
| E2E pipeline | 51 | Every generated script: phase-runner, gate-manager, worktree-manager, todo-manager, memory-manager, learnings-manager, doc-checker, session-start, auto-checkpoint |

---

## Roadmap

### Coming Soon

<table>
<tr>
<td width="50%">

#### Sandbox Integration
Run agents in **isolated containers** instead of locally. Integration with [NVIDIA OpenShell](https://github.com/NVIDIA/OpenShell) and [E2B](https://e2b.dev) — each agent gets its own sandboxed environment with YAML-defined security policies.

</td>
<td width="50%">

#### Vibe Mode
Match the speed of Lovable and Bolt.new — auto-approve gates, dev agents start immediately, **live preview on `:3000` in 2-3 minutes**. Ship fast now, add tests and gates later.

</td>
</tr>
<tr>
<td width="50%">

#### Frontend Quality Engine
Auto-detect or create **design token systems**, maintain a component registry (shadcn/ui, Radix), and use a multi-agent design workflow — UI/UX Agent designs, Frontend Agent codes, Brand Guardian validates.

</td>
<td width="50%">

#### Agent Observability
Real-time dashboard showing what 18 agents are doing — phase progress, worktree activity, test results. Single browser tab to monitor your AI dev team.

</td>
</tr>
<tr>
<td width="50%">

#### Domain-Specific Agents
Pre-loaded knowledge: **SaaS** (Stripe, multi-tenancy), **Marketplace** (escrow, disputes), **Mobile** (PWA, offline), **AI/ML** (RAG, embeddings).

</td>
<td width="50%">

#### Security Scanning Gate
Automated **OWASP/CWE checks** before deployment. Unlike vibe tools where 10% of apps ship with vulnerabilities — FISHI catches them first.

</td>
</tr>
<tr>
<td colspan="2" align="center">

#### Pattern Marketplace
Pre-built architectural patterns: **Auth** (Auth0, Clerk, JWT) | **Payments** (Stripe, PayPal) | **Email** (SendGrid, Resend) | **Analytics** (PostHog, Plausible)

</td>
</tr>
</table>

---

## Packages

| Package | Version | Install |
|---------|---------|---------|
| [`@qlucent/fishi`](https://www.npmjs.com/package/@qlucent/fishi) | ![npm](https://img.shields.io/npm/v/@qlucent/fishi?style=flat-square&color=0066cc) | `npx @qlucent/fishi init` |
| [`@qlucent/fishi-core`](https://www.npmjs.com/package/@qlucent/fishi-core) | ![npm](https://img.shields.io/npm/v/@qlucent/fishi-core?style=flat-square&color=0066cc) | Shared templates & generators |
| `fishi` (plugin) | 0.5.0 | `/plugin install fishi@qlucent-fishi` |

---

## Requirements

- **Node.js** >= 18
- **Claude Code** CLI installed
- **Git**

## Contributing

Contributions welcome! Please open an issue first to discuss what you'd like to change.

## License

[MIT](LICENSE)

---

<p align="center">
  <b>Just FISHI.</b>
  <br>
  <sub>Built by <a href="https://github.com/kpkaranam">Qlucent</a></sub>
</p>
