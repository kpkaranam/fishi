---
id: hosting-netlify
name: Netlify
category: hosting
frameworks: ["Netlify","netlify-cli","@netlify/functions"]
dependencies: ["Netlify","netlify-cli","@netlify/functions"]
description: "Web hosting with serverless functions, forms, and edge handlers"
---

# Netlify

**Category:** Hosting
**Tools:** Netlify, netlify-cli, @netlify/functions

### Setup
- Install: `pnpm add -g netlify-cli` + `pnpm add @netlify/functions`
- Link: `netlify link` or connect GitHub repo in Netlify Dashboard
- Env vars: Set in Netlify Dashboard > Site > Environment variables

### Architecture
- Static hosting: Deploy built assets to Netlify CDN (automatic from Git)
- Serverless functions: `netlify/functions/` directory — auto-deployed as AWS Lambda
- Edge functions: `netlify/edge-functions/` — run at CDN edge with Deno runtime
- Forms: HTML forms with `data-netlify="true"` — submissions stored/forwarded automatically

### Key Patterns
- Use `netlify.toml` for build config, redirects, and headers
- Branch deploys: Every branch gets a deploy URL for testing
- Deploy previews: PRs get preview URLs with Netlify comment on GitHub
- Use Netlify Identity for quick auth or Netlify Graph for API integrations

### Pitfalls
- Serverless function timeout: 10s (free), 26s (paid) — not for long-running tasks
- Build minutes: 300/month on free tier — optimize build times
- Netlify Functions use AWS Lambda — cold starts may impact latency
