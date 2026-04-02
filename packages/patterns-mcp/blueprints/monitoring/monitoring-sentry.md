---
id: monitoring-sentry
name: Sentry
category: monitoring
frameworks: ["Sentry","@sentry/nextjs","@sentry/node"]
dependencies: ["Sentry","@sentry/nextjs","@sentry/node"]
description: "Error tracking and performance monitoring with source maps"
---

# Sentry

**Category:** Monitoring
**Tools:** Sentry, @sentry/nextjs, @sentry/node

### Setup
- Install: `npx @sentry/wizard@latest -i nextjs` (auto-configures Next.js)
- Manual: `pnpm add @sentry/nextjs` and configure sentry.client.config.ts + sentry.server.config.ts
- Env vars: SENTRY_DSN, SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT

### Architecture
- Client: Auto-captures unhandled errors, performance transactions, web vitals
- Server: Captures API route errors, SSR errors, and server-side exceptions
- Source maps: Upload during build with Sentry webpack plugin for readable stack traces
- Releases: Tag deployments for error regression tracking

### Key Patterns
- Use `Sentry.captureException(error)` for manually caught errors
- Add context: `Sentry.setUser({ id, email })`, `Sentry.setTag('feature', 'checkout')`
- Performance: Custom transactions with `Sentry.startTransaction()`
- Use Sentry's Issues page to triage, assign, and resolve errors

### Pitfalls
- Source map upload requires SENTRY_AUTH_TOKEN — set in CI environment
- Free tier: 5,000 errors/month — noisy errors can exhaust quota quickly
- Don't capture sensitive data — configure beforeSend to scrub PII
