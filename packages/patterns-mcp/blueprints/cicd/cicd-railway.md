---
id: cicd-railway
name: Railway
category: cicd
frameworks: ["Railway","railway"]
dependencies: ["Railway","railway"]
description: "Infrastructure platform with instant deploys and built-in databases"
---

# Railway

**Category:** CI/CD
**Tools:** Railway, railway

### Setup
- Install: `pnpm add -g @railway/cli`
- Link: `railway link` to connect to Railway project
- Env vars: Set in Railway Dashboard or `railway variables set KEY=value`

### Architecture
- Auto-detect: Railway detects framework and configures build/start commands
- Services: Deploy multiple services (API, worker, cron) in one project
- Databases: One-click PostgreSQL, MySQL, Redis, MongoDB provisioning
- Networking: Private networking between services, public domains for external access

### Key Patterns
- Use Railway templates for common stacks (Next.js + PostgreSQL, etc.)
- Reference variables across services: `${{Postgres.DATABASE_URL}}`
- Use `railway run` to execute commands with production env vars locally
- Deploy from GitHub: Auto-deploy on push, preview environments for PRs

### Pitfalls
- Free tier: $5/month credit, limited to 500 hours — not for always-on services
- Build logs: Check for memory issues — Railway has build-time memory limits
- Custom domains require paid plan — use .up.railway.app for development
