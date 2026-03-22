<p align="center">
  <h1 align="center">FISHI</h1>
  <p align="center">
    <strong>AI-Powered Software Delivery Pipeline with Governance</strong>
  </p>
  <p align="center">
    Structured multi-agent development pipelines for Claude Code with gate-based human oversight.
  </p>
  <p align="center">
    <code>22+ Agents</code> &bull; <code>Dynamic Agent Creation</code> &bull; <code>8-Phase SDLC Pipeline</code> &bull; <code>Built-in Security Scanner</code> &bull; <code>Brownfield Safe</code> &bull; <code>Phase-Enforced Pipeline</code> &bull; <code>55 Integration Patterns</code>
  </p>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@qlucent/fishi"><img src="https://img.shields.io/npm/v/@qlucent/fishi?style=flat-square&color=0066cc&label=npm" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/@qlucent/fishi"><img src="https://img.shields.io/npm/dm/@qlucent/fishi?style=flat-square&color=green" alt="npm downloads"></a>
  <a href="https://github.com/kpkaranam/fishi/actions"><img src="https://img.shields.io/github/actions/workflow/status/kpkaranam/fishi/ci.yml?style=flat-square&label=CI" alt="CI"></a>
  <a href="https://github.com/kpkaranam/fishi"><img src="https://img.shields.io/github/stars/kpkaranam/fishi?style=flat-square&color=yellow" alt="stars"></a>
  <a href="https://github.com/kpkaranam/fishi/blob/master/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="license"></a>
  <img src="https://img.shields.io/badge/agents-22+-purple?style=flat-square" alt="22+ agents">
  <img src="https://img.shields.io/badge/tests-613-brightgreen?style=flat-square" alt="613 tests">
  <img src="https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square" alt="Node.js 18+">
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> &bull;
  <a href="#why-fishi">Why FISHI?</a> &bull;
  <a href="#features">Features</a> &bull;
  <a href="#integrations">Integrations</a> &bull;
  <a href="#how-it-works">How It Works</a> &bull;
  <a href="#comparison">Comparison</a> &bull;
  <a href="#safety">Safety</a> &bull;
  <a href="#commands">Commands</a> &bull;
  <a href="#changelog">Changelog</a>
</p>

---

```bash
npx @qlucent/fishi init "Build me a SaaS invoicing platform with Stripe"
```

> 22+ AI agents plan, research, code, test, and deploy — you approve at gates.

---

## Why FISHI?

<table>
<tr>
<td width="33%">

### Structured Pipelines
Every project follows an 8-phase SDLC pipeline with 5 approval gates. No cowboy coding — discovery, PRD, architecture, sprint planning, then development.

</td>
<td width="33%">

### Human Governance
You approve at every gate. Agents work autonomously between gates. Three-layer safety: SOUL.md boundaries, AGENTS.md role gates, per-agent tool permissions.

</td>
<td width="34%">

### Brownfield Intelligence
The only framework that safely integrates with existing projects. Auto-detects your stack, merges configs, never overwrites without permission.

</td>
</tr>
</table>

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
| Hook Scripts | 17 | session-start, auto-checkpoint, safety-check, monitor-emitter, file-lock... |
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

### Sandbox (Process-Level Isolation)

Agents run with restricted permissions via process-level isolation:

- **Stripped environment** — only essential + explicitly allowed env vars passed to agents
- **Command filtering** — dangerous commands blocked by safety-check + phase-guard hooks
- **Timeouts** — long-running agent commands auto-terminated
- **Phase enforcement** — code writes blocked during planning phases

Configurable via `.fishi/sandbox-policy.yaml`:
```yaml
network_allow: [registry.npmjs.org, localhost]
env_passthrough: [DATABASE_URL]
timeout: 600
```

> **Coming soon:** Docker-based full isolation — each agent worktree runs in a container with resource limits and network restrictions. Infrastructure is built (detection, auto-install, policy, Dockerfile), runtime integration with worktree lifecycle is in progress.

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

### Native Security Scanner

Built-in SAST + OWASP vulnerability detection — no external tools:

```bash
fishi security scan           # Scan project, colored severity output
fishi security scan --json    # Machine-readable JSON
fishi security rules          # List all 25+ active rules
```

Covers OWASP A01-A10: SQL injection, XSS, command injection, SSRF, hardcoded secrets, weak crypto, insecure cookies, path traversal, prototype pollution. Every finding includes CWE reference and fix recommendation.

### Worktree Conflict Prevention

Proactive conflict prevention when multiple agents work in parallel:

- **File lock registry** — coordinators lock files before assigning tasks
- **Overlap detection** — prevents two agents from touching the same file
- **Lock lifecycle** — acquire, check, release per agent/task
- **Escalation** — conflicts detected before work starts, not at merge time

---

## Integrations

### Pattern Marketplace — 55 Blueprints, 21 Categories

Pre-built architectural blueprints with Setup, Architecture, Key Patterns, and Pitfalls guidance:

```bash
fishi patterns list                           # Browse all categories
fishi patterns search --query "stripe"        # Search by name/tool
fishi patterns info --query "stripe"          # Full architectural guide
fishi patterns select --query "stripe,auth0"  # Select for your project
```

<table>
<tr>
<td width="50%">

| Category | Tools |
|----------|-------|
| **Authentication** | Auth0, Clerk, NextAuth, Supabase Auth, JWT |
| **Payments** | Stripe, PayPal, LemonSqueezy |
| **Email** | SendGrid, Resend, AWS SES, Mailgun |
| **Analytics** | PostHog, Plausible, Mixpanel, GA |
| **Database** | Prisma+PG, Drizzle, Supabase, MongoDB |
| **Storage** | S3, Cloudinary, Supabase Storage, R2 |
| **Search** | Algolia, Meilisearch, Typesense, Elasticsearch |
| **Vector DB** | Qdrant, Milvus, Pinecone, Chroma |
| **Monitoring** | Sentry, LogRocket, Datadog |
| **CI/CD** | GitHub Actions, Vercel, Docker, Railway |
| **Real-time** | WebSocket, Pusher, Ably, Supabase Realtime |

</td>
<td width="50%">

| Category | Tools |
|----------|-------|
| **Project Management** | Jira |
| **Communication** | Slack |
| **E-commerce** | Shopify |
| **Design** | Framer, Figma, Canva |
| **Customer Support** | Freshdesk, Zendesk |
| **Crawler** | Firecrawl |
| **Web Scraping** | Scrapling |
| **Hosting** | Netlify, Vercel |
| **Domain** | GoDaddy, Google Domains |
| **Cloud** | GCP, AWS |

</td>
</tr>
</table>

Selected patterns generate an architecture guide at `.fishi/patterns-guide.md` that agents reference during design.

---

## Comparison

How FISHI compares to other approaches:

| Capability | Raw Claude Code | Lovable / Bolt | FISHI |
|-----------|----------------|---------------|-------|
| **Agents** | 1 (you) | 1 AI | 22+ specialized agents |
| **Pipeline** | None | None | 8-phase SDLC with 5 gates |
| **Human oversight** | Manual | None | Gate-based approval |
| **Brownfield support** | Manual | No (greenfield only) | Auto-detect + safe merge |
| **Testing** | Optional | None | TDD enforced by Quality Lead |
| **Security scanning** | None | None | 25+ SAST/OWASP rules built-in |
| **Code review** | Manual | None | Coordinator review + safety layers |
| **Project management** | External tools | None | Built-in Kanban, sprints, epics |
| **Agent isolation** | Shared context | N/A | Git worktrees + process sandbox (Docker coming soon) |
| **Conflict prevention** | N/A | N/A | File locking + overlap detection |
| **Domain knowledge** | Generic | Generic | SaaS, Marketplace, Mobile, AI/ML specialists |
| **Research** | Manual | None | Autonomous deep research agent |
| **Design system** | None | Built-in | Auto-detect tokens + Brand Guardian |
| **Observability** | None | None | TUI + web dashboard |
| **Cost control** | None | Subscription | Per-agent model routing (Opus/Sonnet/Haiku) |
| **Audit trail** | Git history | None | SOUL.md + AGENTS.md + gate logs + checkpoints |

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
| `fishi security <scan\|rules>` | Native SAST + OWASP vulnerability scanning |
| `fishi patterns <list\|search\|select>` | Browse and select integration blueprints |
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
  scripts/                       # 17 hook/utility scripts (.mjs, zero deps)
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
<td align="center"><b>609</b><br>Total Tests</td>
<td align="center"><b>28</b><br>Test Files</td>
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
<summary><b>v0.16.0</b> — Orchestration Engine (Major Fix)</summary>

**The Big Fix** — making every FISHI feature actually work. ([#23](https://github.com/kpkaranam/fishi/issues/23))

Previously, FISHI's pipeline features existed as templates and scripts but nothing enforced them at runtime. Claude Code read the CLAUDE.md as suggestions and coded everything directly on master, ignoring agents, worktrees, gates, and the entire pipeline.

**What we learned from working plugins (superpowers, feature-dev):**
- `<EXTREMELY-IMPORTANT>` blocks make instructions sticky
- `<HARD-GATE>` markers force Claude to STOP and wait for user approval
- Anti-rationalization tables block every shortcut excuse
- Explicit Agent tool dispatch examples (not "you should delegate" but exact copy-paste prompts)
- `allowed-tools` restrictions per phase prevent wrong actions
- TodoWrite checklists make skipping steps visible

**What changed:**
- **CLAUDE.md rewrite** — from descriptive to imperative. 7 critical rules at top, anti-rationalization table, exact Agent dispatch patterns, HARD-GATEs at every phase transition
- **`/fishi-init` rewrite** — 8-step orchestration skill. Each phase has: checklist, subagent dispatch, state updates, HARD-GATE blocking
- **Phase Guard Hook** — new PreToolUse hook blocks code writes during planning phases, warns about writes outside worktrees during development
- **Slash commands updated** — `/fishi-status`, `/fishi-gate`, `/fishi-board` now read actual state files and run scripts

**Features now connected to pipeline:**

| Feature | Before (broken) | After (working) |
|---------|----------------|-----------------|
| Agent dispatch | "You should delegate" (ignored) | Exact Agent tool examples in skill |
| Worktrees | "Workers should use worktrees" | Phase guard blocks writes outside worktrees |
| Gates | Scripts existed, never called | HARD-GATE at every phase + explicit gate commands |
| TaskBoard | File existed, never updated | TodoWrite + board updates in every step |
| Research | Agent file existed, never dispatched | Discovery phase dispatches deep-research-agent |
| Memory/Learnings | Scripts existed, never called | Development phase includes memory/learnings commands |
| MCP | "auto-discover" note | Architecture phase includes MCP detection |
| Checkpoints | Hook existed but path broken | Fixed import paths + session-start reads checkpoints |
| Monitor | Events never recorded | Fixed import paths + all hooks emit events |

- 613 tests

</details>

<details>
<summary><b>v0.15.0</b> — Monitoring Events + Docker Auto-Install + Upgrade</summary>

- **All hooks emit monitoring events** — session.started, agent.completed, checkpoint.created, gate.*, worktree.* now written to monitor.json ([#19](https://github.com/kpkaranam/fishi/issues/19))
- **`fishi upgrade` command** — patches existing projects: fixes hooks format, regenerates scripts, creates missing files
- **Docker auto-install** — detects OS, installs via winget/brew/apt/dnf/yum, waits for Docker to start ([#18](https://github.com/kpkaranam/fishi/issues/18))
- **settings.json hooks format fixed** — nested `{ matcher, hooks: [{ type, command }] }` schema ([#16](https://github.com/kpkaranam/fishi/issues/16))
- **npm/yarn allowed** — removed overly broad deny rules that blocked legitimate commands ([#17](https://github.com/kpkaranam/fishi/issues/17))
- **New tagline** — "AI-Powered Software Delivery Pipeline with Governance" ([#20](https://github.com/kpkaranam/fishi/issues/20))
- **Strategic polish** — comparison table, CONTRIBUTING.md, CODE_OF_CONDUCT.md, issue templates
- 609 tests

</details>

<details>
<summary><b>v0.14.0</b> — Worktree Conflict Prevention</summary>

- **File lock registry** — coordinators lock files before assigning tasks
- **Overlap detection** — prevents two agents from touching the same file
- **Lock lifecycle** — acquire, check, release per agent/task
- **file-lock-hook.mjs** — generated CLI for pipeline integration
- 609 tests

</details>

<details>
<summary><b>v0.13.0</b> — Pattern Marketplace</summary>

- **55 integration blueprints** across 21 categories
- Categories: Auth, Payments, Email, Analytics, Database, Storage, Search, Vector DB, Monitoring, CI/CD, Real-time, PM, Communication, E-commerce, Design, Support, Crawler, Scraping, Hosting, Domain, Cloud
- `fishi patterns list|search|info|select|selected` commands
- Architecture guides with Setup, Patterns, Pitfalls per integration
- 594 tests

</details>

<details>
<summary><b>v0.12.0</b> — Native Security Scanner</summary>

- **25+ SAST/OWASP rules** — SQL injection, XSS, command injection, SSRF, path traversal, hardcoded secrets, weak crypto, insecure cookies
- **CWE references** for every finding
- **Detailed reports** — grouped by category, severity icons, fix recommendations
- `fishi security scan|rules` commands with JSON and markdown output
- Smart false positive reduction (skips comments, tests, node_modules)
- 577 tests

</details>

<details>
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
<summary><b>v0.7.0</b> — Sandbox Infrastructure</summary>

- Process-level isolation: env stripping, command filtering, timeouts
- Docker detection + auto-install via OS package manager
- Sandbox policy config (network allowlist, env passthrough, resource limits)
- Docker runtime integration with worktrees: in progress
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

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for setup guide and guidelines. Please read our [Code of Conduct](CODE_OF_CONDUCT.md).

## License

[MIT](LICENSE)

---

<p align="center">
  <b>Just FISHI.</b>
  <br>
  <sub>Built by <a href="https://github.com/kpkaranam">Qlucent</a></sub>
</p>
