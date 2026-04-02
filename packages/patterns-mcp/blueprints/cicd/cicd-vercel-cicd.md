---
id: cicd-vercel-cicd
name: Vercel
category: cicd
frameworks: ["Vercel","vercel"]
dependencies: ["Vercel","vercel"]
description: "Zero-config deployment platform for frontend and full-stack apps"
---

# Vercel

**Category:** CI/CD
**Tools:** Vercel, vercel

### Setup
- Install: `pnpm add -g vercel` or connect GitHub repo in Vercel Dashboard
- Link: `vercel link` to connect local project to Vercel
- Env vars: Set in Vercel Dashboard > Project > Settings > Environment Variables

### Architecture
- Git integration: Auto-deploy on push to main (production) and PRs (preview)
- Preview deployments: Every PR gets a unique URL for testing
- Serverless functions: API routes auto-deploy as serverless functions
- Edge functions: Use edge runtime for low-latency middleware and routes

### Key Patterns
- Use vercel.json for custom build settings, redirects, and headers
- Environment variables: Separate production, preview, and development values
- Deploy hooks: Trigger deploys from external events (CMS publish, etc.)
- Monorepo: Configure root directory per project in Vercel Dashboard

### Pitfalls
- Serverless function timeout: 10s (Hobby), 60s (Pro) — optimize long-running tasks
- Free tier: 100 deployments/day — sufficient for most development
- Build cache is per-branch — first deploy on new branch is always full build
