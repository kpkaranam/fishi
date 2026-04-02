---
id: cicd-github-actions
name: GitHub Actions
category: cicd
frameworks: ["GitHub Actions","GitHub"]
dependencies: ["GitHub Actions","GitHub"]
description: "Native CI/CD for GitHub repositories with reusable workflows"
---

# GitHub Actions

**Category:** CI/CD
**Tools:** GitHub Actions, GitHub

### Setup
- Create .github/workflows/ci.yml for CI pipeline
- No installation needed — runs on GitHub-hosted runners
- Env vars: Set secrets in GitHub repo Settings > Secrets and Variables

### Architecture
- Workflow triggers: push, pull_request, schedule, workflow_dispatch
- Jobs: Lint → Test → Build → Deploy (with dependency chain)
- Caching: actions/cache for node_modules, pnpm store, build artifacts
- Matrix strategy: Test across Node versions and OS

### Key Patterns
- Use pnpm with `pnpm/action-setup` for fast installs
- Reusable workflows: `.github/workflows/reusable-*.yml` for shared logic
- Branch protection: Require CI pass before merge
- Use `concurrency` to cancel in-progress runs on new pushes

### Pitfalls
- Free tier: 2,000 minutes/month for private repos — cache aggressively
- Secrets are not available in PRs from forks — design workflows accordingly
- Always pin action versions with SHA, not just tags (supply chain security)
