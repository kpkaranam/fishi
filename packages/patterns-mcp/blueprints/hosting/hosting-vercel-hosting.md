---
id: hosting-vercel-hosting
name: Vercel
category: hosting
frameworks: ["Vercel","vercel"]
dependencies: ["Vercel","vercel"]
description: "Edge-first hosting platform optimized for Next.js and React frameworks"
---

# Vercel

**Category:** Hosting
**Tools:** Vercel, vercel

### Setup
- Install: `pnpm add -g vercel`
- Deploy: `vercel` from project root — auto-detects framework
- Env vars: `vercel env add` or set in Dashboard > Project > Settings

### Architecture
- Framework detection: Auto-configures build for Next.js, Remix, Astro, etc.
- Edge Network: Static assets served from 100+ global locations
- Serverless functions: API routes auto-deploy, scale to zero when idle
- ISR: Incremental Static Regeneration for dynamic content with static performance

### Key Patterns
- Use preview deployments for every PR — share URLs with team for review
- Edge middleware: Run logic before request hits your app (auth, redirects, A/B tests)
- Cron jobs: Define in vercel.json for scheduled serverless function execution
- Speed Insights: Built-in web vitals monitoring

### Pitfalls
- Hobby plan: 100 deployments/day, 100GB bandwidth — sufficient for small projects
- Serverless function regions: Choose region close to your database for lowest latency
- No persistent file system — use external storage (S3, Supabase) for uploads
