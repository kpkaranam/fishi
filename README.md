<p align="center">
  <h1 align="center">FISHI</h1>
  <p align="center">
    <strong>The framework that makes AI agents build production-grade software — not demos.</strong>
  </p>
  <p align="center">
    Governance, safety, and integration patterns for Claude Code. Works with any framework — or on its own.
  </p>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@qlucent/fishi"><img src="https://img.shields.io/npm/v/@qlucent/fishi?style=flat-square&color=0066cc&label=npm" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/@qlucent/fishi"><img src="https://img.shields.io/npm/dm/@qlucent/fishi?style=flat-square&color=green" alt="npm downloads"></a>
  <a href="https://github.com/kpkaranam/fishi/actions"><img src="https://img.shields.io/github/actions/workflow/status/kpkaranam/fishi/ci.yml?style=flat-square&label=CI" alt="CI"></a>
  <a href="https://github.com/kpkaranam/fishi"><img src="https://img.shields.io/github/stars/kpkaranam/fishi?style=flat-square&color=yellow" alt="stars"></a>
  <a href="https://github.com/kpkaranam/fishi/blob/master/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="license"></a>
  <img src="https://img.shields.io/badge/agents-22+-purple?style=flat-square" alt="22+ agents">
  <img src="https://img.shields.io/badge/tests-629-brightgreen?style=flat-square" alt="629 tests">
  <img src="https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square" alt="Node.js 18+">
</p>

<p align="center">
  <a href="#the-problem">The Problem</a> &bull;
  <a href="#quick-start">Quick Start</a> &bull;
  <a href="#works-with">Works With</a> &bull;
  <a href="#what-you-get">What You Get</a> &bull;
  <a href="#architecture">Architecture</a> &bull;
  <a href="#fishi-vs-going-bare">FISHI vs Going Bare</a> &bull;
  <a href="#available-patterns-55">Patterns</a> &bull;
  <a href="#the-full-framework">Full Framework</a> &bull;
  <a href="#contributing">Contributing</a>
</p>

---

## The Problem

AI agents delete production files, force-push to main, and generate apps that demo well but break under real-world conditions. Nobody governs them. While everyone races to ship faster, we say: **ship RIGHT.**

FISHI fixes that — as a lightweight safety layer you bolt onto whatever you already use, or as a full governed pipeline if you want the whole thing.

---

## Quick Start

### Path A: Just want safety?

Two steps. Two minutes. Zero config.

```bash
# 1. Install the governance plugin
claude install fishi-governance

# 2. Done. Destructive operations are now blocked. Audit trail is logging.
```

Your agent tries `rm -rf migrations/` — blocked. Tries `git push --force origin main` — blocked. Every action logged to `.fishi/audit-log.jsonl`. You keep whatever framework you already use.

### Path B: Want the full pipeline?

22+ AI agents, 9 phases, 7 approval gates, brownfield-safe.

```bash
npx @qlucent/fishi init "Build me a SaaS invoicing platform with Stripe"
```

A master strategist, 4 team leads, and 13+ specialists plan, research, code, test, and deploy — you approve at gates.

---

## Works With

FISHI components are **additive, not competing**. They layer on top of whatever you already use.

| Framework | How FISHI works alongside it |
|-----------|------------------------------|
| **Ruflo** | Governance hooks layer on top of swarm orchestration. Blocks destructive ops Ruflo doesn't catch. Pattern blueprints feed into Ruflo agents. |
| **BMAD Method** | BMAD designs the process, FISHI enforces it at runtime. Governance gates + audit trail complement BMAD's methodology. |
| **Oh-My-ClaudeCode** | Additive hooks, independent operation. Governance + patterns complement Oh-My-CC's agent skills. |
| **Raw Claude Code** | Standalone protection. No framework required — just safety and patterns on top of vanilla Claude Code. |

---

## What You Get

<table>
<tr>
<td width="33%" valign="top">

### Governance Plugin

**Blocks destructive ops. Logs everything.**

- Intercepts `rm -rf`, `git push --force`, `DROP TABLE`, and 30+ destructive patterns
- Append-only audit trail (`.fishi/audit-log.jsonl`)
- Zero config, zero network calls, zero telemetry
- Override with explicit `--force` (logged)

```bash
claude install fishi-governance
```

</td>
<td width="33%" valign="top">

### Pattern Marketplace

**55 blueprints via MCP. Grab-and-go integrations.**

- Stripe, Auth0, SendGrid, Prisma, PostHog, and 50 more
- Agent pulls the blueprint, implements correctly in minutes
- No more hallucinated API calls or outdated patterns
- Searchable by keyword or category

```bash
npm install -g @qlucent/fishi-patterns
```

</td>
<td width="34%" valign="top">

### Full Framework

**9-phase pipeline. 22+ agents. Gate approvals.**

- Master orchestrator + 4 coordinators + 13+ specialists
- 7 human approval gates across the SDLC
- Brownfield-safe: auto-detects stack, never overwrites
- Built-in security scanner (SAST + OWASP)

```bash
npx @qlucent/fishi init
```

</td>
</tr>
</table>

---

## Architecture

Each component works independently. Use one, two, or all three.

```
┌─────────────────────────────────────────────────────────────────┐
│                        YOUR PROJECT                             │
│                                                                 │
│   ┌─────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│   │   Governance     │  │  Pattern MCP     │  │ Full FISHI   │  │
│   │   Plugin         │  │  Server          │  │ Framework    │  │
│   │                  │  │                  │  │              │  │
│   │  • Safety hooks  │  │  • 55 blueprints │  │  • 9 phases  │  │
│   │  • Audit trail   │  │  • Search/select │  │  • 22+ agents│  │
│   │  • Block/allow   │  │  • MCP protocol  │  │  • 7 gates   │  │
│   │                  │  │                  │  │  • TaskBoard  │  │
│   │  STANDALONE      │  │  STANDALONE      │  │  FULL BUNDLE │  │
│   └─────────────────┘  └──────────────────┘  └──────────────┘  │
│          ↑                      ↑                    ↑          │
│     Works alone            Works alone          Includes both   │
│     Works with any         Works with any       governance +    │
│     framework              framework            patterns        │
└─────────────────────────────────────────────────────────────────┘
```

---

## FISHI vs Going Bare

What happens when AI agents operate without governance?

| Scenario | Without FISHI | With FISHI |
|----------|---------------|------------|
| Agent deletes production files | You discover it later. Maybe git reflog saves you. Maybe not. | **Blocked before execution.** Clear message explains why. |
| Agent force-pushes to main | Your team's work is overwritten. Hours of recovery. | **Blocked.** Logged to audit trail. |
| Agent overwrites `.env` with placeholders | Credentials gone. Services break. Panic. | **Blocked.** Environment files are protected. |
| Agent improvises a Stripe integration | Hallucinated API calls. Outdated patterns. 30 minutes wasted. | **Blueprint pulled.** Correct implementation in 3 minutes. |
| Agent modifies Docker Compose in production | Containers crash. Deployment breaks. | **Blocked.** Production configs are protected. |
| Security audit asks "what did your AI do?" | Shrug. No records. | **Full audit trail.** Every action timestamped and logged. |
| Agent scaffolds over your existing project | Existing configs overwritten. Framework conflicts. | **Brownfield-safe.** Stack detected, conflicts flagged, permission asked. |

---

## Available Patterns (55)

| Category | Patterns |
|----------|---------|
| **Authentication** | Auth0, Clerk, NextAuth.js, Supabase Auth, Custom JWT |
| **Payments** | Stripe, PayPal, LemonSqueezy |
| **Email** | SendGrid, Resend, AWS SES, Mailgun |
| **Analytics** | PostHog, Plausible, Mixpanel, Google Analytics |
| **Database** | Prisma+PostgreSQL, Drizzle, Supabase, MongoDB |
| **Storage** | AWS S3, Cloudinary, Supabase Storage, Cloudflare R2 |
| **Search** | Algolia, Meilisearch, Typesense, pgvector, Elasticsearch |
| **Vector Database** | Qdrant, Milvus, Pinecone, Chroma |
| **Monitoring** | Sentry, LogRocket, Datadog |
| **CI/CD** | GitHub Actions, Vercel, Docker, Railway |
| **Realtime** | WebSocket, Pusher, Ably, Supabase Realtime |
| **Project Management** | Linear, Jira, Shortcut |
| **Communication** | Slack, Discord, Twilio |
| **E-commerce** | Shopify, Medusa |
| **Design** | Figma API, Storybook |
| **Support** | Intercom, Zendesk |
| **Crawlers** | Firecrawl, Puppeteer |
| **Hosting** | Vercel, Netlify, Railway, Fly.io |
| **Domains** | Cloudflare DNS |
| **Cloud** | AWS SDK, GCP, Azure |
| **CMS** | Contentful, Sanity, Strapi |

Every blueprint includes: correct packages, architecture patterns, implementation steps, environment variables, error handling, and common pitfalls to avoid.

**Add to your project:**

```bash
# Install the MCP server
npm install -g @qlucent/fishi-patterns

# Add to Claude Code config (~/.claude/settings.json)
{
  "mcpServers": {
    "fishi-patterns": {
      "command": "fishi-patterns",
      "args": []
    }
  }
}

# Then in Claude Code:
# "Search for a Stripe payment blueprint"
# "Find an auth integration for Next.js"
```

---

## The Full Framework

For teams and projects that want the complete governed pipeline — not just safety, but the entire SDLC.

### How It Works

```
Master Agent (Opus)
Strategy & Phase Gates Only
         |
    _____|_____________________
   |          |         |      |
Planning   Dev Lead  Quality  Ops Lead
  Lead                Lead
   |          |         |      |
research   backend   testing  devops
planning   frontend  security docs
architect  fullstack          writing
deep-research  uiux
```

**Master** makes strategic decisions and manages phase gates — never writes code.
**Coordinators** break objectives into tasks, assign workers, review output.
**Workers** execute in isolated sandboxed git worktrees, submit PRs back.

### 9-Phase Pipeline

| Phase | What Happens | Gate |
|-------|-------------|------|
| 1. Discovery | Domain analysis, user research, competitive intel | -- |
| 2. PRD | Product requirements with acceptance criteria | Approval |
| 3. Architecture | System design, tech stack, data models | Approval |
| 4. Sprint Planning | Epics, stories, task breakdown | Approval |
| 5. Development | Agents code in isolated worktrees, submit PRs | Per-sprint |
| 6. QA & Security | Testing, SAST scanning, OWASP audit | Approval |
| 7. Deployment | CI/CD setup, infrastructure, launch prep | Approval |
| 8. Documentation | API docs, architecture guides, user docs | -- |
| 9. Launch | Go-live, monitoring, post-launch review | Final |

### Key Capabilities

- **22+ specialized agents** across 3 layers (Master, Coordinators, Workers)
- **Brownfield intelligence** — auto-detects language, framework, ORM, tests, patterns, tech debt
- **Domain specialists** — SaaS, Marketplace, Mobile/PWA, AI/ML architectures
- **Deep research agent** — competitive analysis, tech evaluation, best practices
- **Built-in TaskBoard** — track progress across sprints without leaving Claude Code
- **Checkpoint/rollback** — snapshot and restore at any point
- **Security scanning** — native SAST + OWASP checks, no external tools
- **Vibe mode** — skip gates, auto-approve, ship fast when you want to

### Built with FISHI

**[Meld](https://project-qkhag.vercel.app/)** — A full-stack todo + note app built entirely by FISHI's agents. React 18, Vite, Supabase, TanStack Query, Zustand, TipTap, Tailwind CSS. Discovery through 5 sprints to production. ([Source](https://github.com/kpkaranam/meld))

### Installation

```bash
# Interactive wizard
npx @qlucent/fishi init

# One-liner with description
npx @qlucent/fishi init "Build a real-time chat app with WebSocket"

# Existing project (brownfield-safe)
cd my-existing-project
npx @qlucent/fishi init
# Auto-detects stack, merges configs safely, never overwrites without permission
```

---

## Contributing

We welcome contributions — especially new integration patterns.

- **Add a pattern:** Single markdown file. See [CONTRIBUTING.md](CONTRIBUTING.md) for the template and workflow.
- **Report issues:** [GitHub Issues](https://github.com/kpkaranam/fishi/issues)
- **Discuss:** [GitHub Discussions](https://github.com/kpkaranam/fishi/discussions)

---

## License

[MIT](LICENSE) — free forever, no commercial intent.
