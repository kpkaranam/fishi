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
  <img src="https://img.shields.io/badge/agents-22+-purple?style=flat-square" alt="22+ agents">
  <img src="https://img.shields.io/badge/tests-551-brightgreen?style=flat-square" alt="551 tests">
  <img src="https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square" alt="Node.js 18+">
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> &bull;
  <a href="#-features">Features</a> &bull;
  <a href="#-how-it-works">How It Works</a> &bull;
  <a href="#-commands">Commands</a> &bull;
  <a href="#-safety">Safety</a> &bull;
  <a href="#-changelog">Changelog</a>
</p>

---

```bash
npx @qlucent/fishi init "Build me a SaaS invoicing platform with Stripe"
```

> Run `claude` and watch **22+ AI agents** plan, research, code, test, and deploy your project.

---

## What is FISHI?

Most AI coding tools give you **one assistant**. FISHI gives you an **entire development team** — a master strategist, 4 team leads, 13+ specialist developers, a deep research agent, and domain-specific architects — all working in isolated sandboxed environments, submitting PRs, and tracking progress on a built-in project board.

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
   deep-research uiux                           marketing
                 [domain specialist]
```

> **Master** makes strategic decisions, manages phase gates, **never writes code**.
> **Coordinators** break objectives into tasks, assign workers, review output.
> **Workers** execute in isolated sandboxed git worktrees, submit PRs back.
> **Deep Research** gathers domain intel, competitive analysis, tech evaluations.
> **Domain Specialists** bring pre-loaded knowledge for SaaS, Marketplace, Mobile, or AI/ML.

---

## Quick Start

<table>
<tr>
<td width="33%">

### CLI

```bash
mkdir my-app && cd my-app
npx @qlucent/fishi init
claude
> /fishi-init
```

</td>
<td width="33%">

### Vibe Mode

```bash
npx @qlucent/fishi quickstart \
  "Build a SaaS app"
# Skips gates, starts dev
# server immediately
```

</td>
<td width="34%">

### Plugin

```bash
# Inside Claude Code:
/plugin marketplace add \
  kpkaranam/fishi
/plugin install \
  fishi@qlucent-fishi
```

</td>
</tr>
</table>

<details>
<summary><b>More installation options</b></summary>

### Interactive Wizard

```bash
npx @qlucent/fishi init
# Prompts: What are you building? Domain? Cost mode? Language? Framework?
```

### Existing Project (Brownfield)

```bash
cd my-existing-project
npx @qlucent/fishi init
# Auto-detects language, framework, ORM, tests, patterns, tech debt
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
| Base Agents | 19 | 1 master + 4 coordinators + 13 specialists + deep research |
| Domain Agents | 4 | SaaS, Marketplace, Mobile/PWA, AI/ML architects |
| Skills | 13 | brainstorming, code-gen, debugging, testing, deep-research, PRD... |
| Commands | 8 | `/fishi-init`, `/fishi-gate`, `/fishi-board`, `/fishi-sprint`... |
| Hook Scripts | 16 | session-start, auto-checkpoint, safety-check, monitor-emitter... |
| Pipeline Phases | 8 | 5 with approval gates |

<details>
<summary><b>See all agents</b></summary>

| Layer | Agent | Role |
|-------|-------|------|
| **L0** | Master Orchestrator | Strategy, delegation, gate management |
| **L1** | Planning Lead | Coordinates research, planning, architecture |
| **L1** | Dev Lead | Coordinates backend, frontend, fullstack work |
| **L1** | Quality Lead | Coordinates testing, security audits |
| **L1** | Ops Lead | Coordinates devops, docs, marketing |
| **L2** | Deep Research Agent | Domain intel, competitive analysis, tech evaluation |
| **L2** | Research Agent | Market research, user research |
| **L2** | Planning Agent | Sprint planning, task breakdown |
| **L2** | Architect Agent | System design, tech stack decisions |
| **L2** | Backend Agent | APIs, services, database logic |
| **L2** | Frontend Agent | UI components, state management |
| **L2** | Fullstack Agent | End-to-end feature implementation |
| **L2** | UI/UX Agent | Design systems, accessibility, responsive layouts |
| **L2** | DevOps Agent | CI/CD, Docker, infrastructure |
| **L2** | Testing Agent | Unit, integration, E2E tests (TDD) |
| **L2** | Security Agent | OWASP audits, vulnerability scanning |
| **L2** | Docs Agent | API docs, architecture guides |
| **L2** | Writing Agent | User-facing copy, README, changelogs |
| **L2** | Marketing Agent | Landing pages, launch materials |
| **Domain** | SaaS Architect | Stripe, multi-tenancy, RBAC, subscriptions |
| **Domain** | Marketplace Architect | Escrow, disputes, vendors, Stripe Connect |
| **Domain** | Mobile Architect | PWA, offline sync, push notifications |
| **Domain** | AI/ML Architect | RAG, embeddings, LLM integration, fine-tuning |

</details>

### Domain-Specific Intelligence

Select your domain at init — agents get pre-loaded knowledge:

| Domain | What the specialist knows |
|--------|--------------------------|
| **SaaS** | Stripe billing, subscription lifecycle, multi-tenancy (RLS), RBAC, feature flags, onboarding flows |
| **Marketplace** | Stripe Connect, escrow, dispute resolution, vendor management, trust scores, KYC |
| **Mobile / PWA** | Service workers, offline-first with IndexedDB, push notifications, Core Web Vitals, responsive touch UX |
| **AI / ML** | RAG pipelines, vector DBs (Pinecone, pgvector), embeddings, prompt engineering, fine-tuning, model serving |

### Deep Research Agent

Autonomous research agent that gathers intel before your team writes code:

| Research Type | When | What it produces |
|--------------|------|-----------------|
| Domain Analysis | Discovery | Industry overview, regulations, user expectations |
| Competitive Analysis | PRD | Top competitors, feature gaps, UX patterns to adopt |
| Tech Stack Evaluation | Architecture | Framework comparison, hosting costs, proven patterns |
| Best Practices | Development | Latest patterns, anti-patterns, optimization techniques |
| Security Assessment | Deployment | Known vulnerabilities, OWASP guidelines, compliance |

Reports saved to `.fishi/research/` and fed to other agents as context.

### Vibe Mode

Skip the ceremony, ship fast:

```bash
fishi quickstart "Build a real-time chat app"
```

| Step | Normal Mode | Vibe Mode |
|------|-------------|-----------|
| Discovery | Interactive | Auto-skip |
| PRD | 14-section wizard | Auto from prompt |
| Architecture gate | Human approval | Auto-approve |
| Dev server | Manual | Auto-start on detected port |
| Testing | TDD enforced | Background (non-blocking) |

Auto-detects 12+ frameworks: Next.js, Vite, Astro, Nuxt, SvelteKit, Gatsby, Remix, Express, Django, Flask, FastAPI, and more.

### Agent Observability

<table>
<tr>
<td width="50%">

#### Terminal Dashboard
```bash
fishi monitor         # One-time view
fishi monitor --watch # Live refresh
```
Phase progress, agent activity, token usage, tools used, gates, events.

</td>
<td width="50%">

#### Web Dashboard
```bash
fishi dashboard       # http://localhost:4269
```
Dark theme UI with real-time updates. Agent cards, token breakdown by model, tools usage, gate status.

</td>
</tr>
</table>

### Hybrid Sandbox

Agents run in isolated environments — not on your local machine:

| Mode | Isolation | When |
|------|-----------|------|
| **Docker** (recommended) | Full — containerized with resource limits, stripped env, restricted network | Docker detected at init |
| **Process** (fallback) | Best-effort — restricted child_process, env stripping, timeouts | No Docker available |

Configurable via `.fishi/sandbox-policy.yaml`:
```yaml
network_allow: [registry.npmjs.org, localhost]
env_passthrough: [DATABASE_URL]
timeout: 600
memory: "2g"
cpus: 2
```

### Frontend Quality Engine

Fix ugly AI-generated UIs with design system enforcement:

```bash
fishi design detect    # Scan for design tokens + components
fishi design init      # Create/detect design system config
fishi design validate  # Run Brand Guardian validation
```

| Brand Guardian Rule | Severity | What it catches |
|--------------------|----------|----------------|
| `no-hardcoded-colors` | warning | `#ff0000` in JSX — use tokens |
| `no-inline-px` | warning | `style={{ padding: "16px" }}` |
| `img-alt-text` | error | `<img>` without `alt` |
| `keyboard-accessible` | warning | `onClick` on `<div>` without keyboard handler |
| `use-typography-scale` | info | Hardcoded `font-size` |
| `html-lang` | error | `<html>` without `lang` |

Auto-detects: Tailwind config, CSS custom properties, component libraries (shadcn, Radix, MUI, Chakra).

### Safe Brownfield Support

> FISHI never overwrites your existing files without asking.

- **Conflict detection** across 7 categories
- **Always backs up** — timestamped snapshots before any modification
- **Interactive resolution** — per-category `Skip` / `Merge` / `Replace`
- **Smart merging** — union merge for hooks & permissions, additive for MCP servers
- **Root CLAUDE.md priority** — FISHI section prepended at top for highest priority
- Deep codebase analysis: ORM, auth, CSS, API style, code patterns, tech debt

---

## Safety

### Three-Layer Agent Safety Model

Inspired by the [OpenClaw incident prevention framework](https://openagents.mom) — ensuring no agent takes irreversible actions autonomously.

<table>
<tr>
<td width="33%">

#### Layer 1: SOUL.md
**Absolute boundaries** — what agents must NEVER do:
- No data deletion without human approval
- No production pushes without gate
- No credential access outside policy
- No disabling safety hooks

</td>
<td width="33%">

#### Layer 2: AGENTS.md
**Per-role action gates:**
- Master: read-only, delegates everything
- Coordinators: limited write, no merge to main
- Workers: full dev in sandbox, no merge, no deploy
- Delete → Archive protocol

</td>
<td width="34%">

#### Layer 3: Tool Permissions
**Graduated access by role:**
- Master: 8 allow / 9 deny
- Coordinator: 24 allow / 13 deny
- Worker: 32 allow / 19 deny
- All deny: npm, sudo, force push

</td>
</tr>
</table>

**Escalation Path:** Worker → Coordinator → Master → Human confirmation via gate

---

## Commands

<details open>
<summary><b>CLI Commands</b></summary>

| Command | Description |
|---------|-------------|
| `fishi init [description]` | Initialize FISHI (wizard or zero-config) |
| `fishi quickstart [description]` | Vibe mode — skip gates, start dev server |
| `fishi status` | Project state, TaskBoard, active agents |
| `fishi validate` | Validate scaffold integrity |
| `fishi monitor [--watch]` | TUI agent observability dashboard |
| `fishi dashboard [--port]` | Web dashboard at `:4269` |
| `fishi preview [--dev-cmd]` | Start dev server with auto-detection |
| `fishi design <detect\|init\|validate>` | Design system + Brand Guardian |
| `fishi sandbox <status\|policy>` | Sandbox mode and policy info |
| `fishi mcp add <name>` | Add MCP server |
| `fishi reset [checkpoint]` | Rollback to a checkpoint |

</details>

<details>
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

## How It Works

<table>
<tr><td>

**Step 1** — You describe what to build

```
/fishi-init Build a SaaS invoicing platform with Stripe
```

</td></tr>
<tr><td>

**Step 2** — Deep Research Agent gathers intel

Domain analysis, competitive landscape, tech stack evaluation — reports fed to architects.

</td></tr>
<tr><td>

**Step 3** — FISHI plans it

Discovery (brainstorming) --> PRD (14 sections) --> Architecture (tech stack, APIs) --> Sprint Planning (epics, stories, tasks)

</td></tr>
<tr><td>

**Step 4** — Agents build it in sandboxed worktrees

Dev Lead assigns tasks. Each agent works in an **isolated sandbox**. Quality Lead runs tests in parallel. Work is submitted as PRs.

</td></tr>
<tr><td>

**Step 5** — You approve at gates

```
PR: agent/dev-lead/backend-agent/auth-endpoints --> dev
Files: 3 added, 1 modified | Tests: 12 passing | Coverage: 94%

/fishi-gate approve
```

</td></tr>
<tr><td>

**Step 6** — Agents learn and improve

Mistakes recorded. Best practices shared. Memory persists across sessions. Learnings persist across projects.

</td></tr>
</table>

---

## Project Structure

<details>
<summary><b>What <code>fishi init</code> creates</b></summary>

```
SOUL.md                          # Agent boundaries — what agents must NEVER do
AGENTS.md                        # Per-role action gates and escalation paths

.claude/
  CLAUDE.md                      # Orchestration brain (pipeline enforcement)
  settings.json                  # Hooks + permissions (per-role graduated access)
  agents/                        # 19+ agent definitions
    master-orchestrator.md
    deep-research-agent.md
    coordinators/                # planning-lead, dev-lead, quality-lead, ops-lead
    domains/                     # saas-architect, marketplace-architect, etc.
    (13 worker agents)
  skills/                        # 13 skills (including deep-research)
  commands/                      # 8 slash commands

.fishi/
  fishi.yaml                     # Project config (domain, sandbox, vibe mode)
  sandbox-policy.yaml            # Sandbox access rules
  design-system.json             # Design tokens + component registry
  state/                         # Phase state, agent registry, gates, checkpoints, monitor
  taskboard/                     # Kanban board, backlog, sprints, epics
  scripts/                       # 16 hook/utility scripts (.mjs, zero deps)
  research/                      # Deep research reports
  plans/                         # PRDs, architecture docs, ADRs
  memory/                        # Project context + per-agent memory
  learnings/                     # Mistakes + best practices (local + global)
  todos/                         # Per-agent TODO lists
  backup/                        # Timestamped backups of pre-FISHI files
  archive/                       # Archived files (delete → archive protocol)
  agent-factory/                 # Templates for dynamic agent creation
```

</details>

---

## Test Coverage

<table>
<tr>
<td align="center"><b>551</b><br>Total Tests</td>
<td align="center"><b>25</b><br>Test Files</td>
<td align="center"><b>51</b><br>E2E Tests</td>
<td align="center"><b>3</b><br>Node Versions</td>
</tr>
</table>

| Category | Tests | Coverage |
|----------|-------|---------|
| Core templates | 340+ | All agents, skills, commands, hooks, configs, domain agents |
| CLI | 60+ | Brownfield analysis, conflict detection, project detection |
| Brownfield safety | 36 | Conflict detection, backup, merge strategies |
| E2E pipeline | 51 | Every script: phase-runner, gate-manager, worktree-manager, etc. |
| Monitor + Dashboard | 14 | Event emission, state reading, HTML validation |
| Sandbox | 14 | Docker detection, policy parsing, env stripping, process isolation |
| Design system | 18 | Token detection, component registry, Brand Guardian |
| Domain agents | 16 | Domain templates, manager, deep research |
| Safety layers | 17 | SOUL.md, AGENTS.md, per-role permissions |

---

## Changelog

<details open>
<summary><b>v0.11.0</b> — Three-Layer Agent Safety</summary>

- **SOUL.md** — absolute boundaries file generated at project root
- **AGENTS.md** — per-role action gates (master read-only, workers sandbox-only)
- **Per-agent permissions** — master (8/9), coordinator (24/13), worker (32/19) allow/deny rules
- Destructive Action Protocol: delete → archive, escalation path, emergency stop
- 551 tests

</details>

<details>
<summary><b>v0.10.0</b> — Domain Agents + Deep Research</summary>

- 4 domain specialist agents: SaaS, Marketplace, Mobile/PWA, AI/ML
- Deep Research Agent with 5 research types + structured reports
- Deep Research Skill with 5-step workflow
- Domain selection during `fishi init`
- 534 tests

</details>

<details>
<summary><b>v0.9.0</b> — Frontend Quality Engine</summary>

- Design token detection (Tailwind, CSS vars, theme files)
- Component registry (auto-scan, classify, detect library)
- Brand Guardian validation (6 rules: hardcoded colors, a11y, inline px)
- `fishi design detect|init|validate` commands
- 518 tests

</details>

<details>
<summary><b>v0.8.0</b> — Vibe Mode + Live Preview</summary>

- `fishi quickstart` — skip gates, scaffold + start dev server immediately
- `fishi preview` — detect framework, start dev server
- 12+ frameworks auto-detected (Next.js, Vite, Astro, Django, Flask, etc.)
- 500 tests

</details>

<details>
<summary><b>v0.7.0</b> — Hybrid Sandbox</summary>

- Docker mode (full isolation) + process mode (fallback)
- Auto-detect Docker at init, prompt user for preference
- Sandbox policy (network, env, timeout, resources)
- Brownfield: sandbox worktrees only, main project untouched
- 488 tests

</details>

<details>
<summary><b>v0.6.0</b> — Agent Observability</summary>

- `fishi monitor` — TUI dashboard with `--watch` live refresh
- `fishi dashboard` — web UI at `:4269` with dark theme
- Monitor data layer: events, tokens by model, tools used, dynamic agents
- 474 tests

</details>

<details>
<summary><b>v0.5.0</b> — Plugin Distribution</summary>

- Claude Code plugin: 18 agents, 12 skills, 8 commands, hooks
- GitHub marketplace: `/plugin marketplace add kpkaranam/fishi`
- Plugin validates and loads successfully
- 456 tests

</details>

<details>
<summary><b>v0.4.0</b> — E2E Pipeline Tests</summary>

- 51 E2E tests covering all 15 generated scripts
- Full pipeline lifecycle: init → phase → gate → worktree → checkpoint
- 456 tests

</details>

<details>
<summary><b>v0.3.0</b> — Root CLAUDE.md Priority</summary>

- FISHI section prepended at TOP of root CLAUDE.md (highest priority)
- `.claude/CLAUDE.md` skipped when root exists
- 405 tests

</details>

<details>
<summary><b>v0.2.0</b> — Safe Brownfield Init</summary>

- Conflict detection (7 categories), backup manager, merge strategies
- Interactive skip/merge/replace per category
- `--merge-all` / `--replace-all` flags for CI
- Tested on real brownfield project
- 396 tests

</details>

<details>
<summary><b>v0.1.0</b> — Initial Release</summary>

- 3-layer agent hierarchy (Master → Coordinators → Workers)
- 82-file scaffold, 18 agents, 12 skills, 8 commands, 15 hooks
- Phase pipeline with 5 approval gates
- Brownfield analyzer, worktree manager, gate manager
- Agent intelligence: todos, memory, learnings, doc-checker
- 360 tests

</details>

---

## Packages

| Package | Version | Install |
|---------|---------|---------|
| [`@qlucent/fishi`](https://www.npmjs.com/package/@qlucent/fishi) | ![npm](https://img.shields.io/npm/v/@qlucent/fishi?style=flat-square&color=0066cc) | `npx @qlucent/fishi init` |
| [`@qlucent/fishi-core`](https://www.npmjs.com/package/@qlucent/fishi-core) | ![npm](https://img.shields.io/npm/v/@qlucent/fishi-core?style=flat-square&color=0066cc) | Shared templates & generators |
| `fishi` (plugin) | latest | `/plugin install fishi@qlucent-fishi` |

---

## Requirements

- **Node.js** >= 18
- **Claude Code** CLI installed
- **Git**
- **Docker** (optional, recommended for sandbox isolation)

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
