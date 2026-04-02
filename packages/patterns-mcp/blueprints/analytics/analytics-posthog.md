---
id: analytics-posthog
name: PostHog
category: analytics
frameworks: ["PostHog","posthog-js","posthog-node"]
dependencies: ["PostHog","posthog-js","posthog-node"]
description: "Open-source product analytics with session recording and feature flags"
---

# PostHog

**Category:** Analytics
**Tools:** PostHog, posthog-js, posthog-node

### Setup
- Install: `pnpm add posthog-js` (client) + `pnpm add posthog-node` (server)
- Env vars: NEXT_PUBLIC_POSTHOG_KEY, NEXT_PUBLIC_POSTHOG_HOST

### Architecture
- Client: Initialize PostHog in app layout, auto-captures pageviews and clicks
- Server: Use posthog-node for server-side event tracking and feature flags
- Feature flags: Evaluate server-side for SSR, client-side for interactive UI
- Session recording: Automatic with posthog-js, configure sampling rate

### Key Patterns
- Use `posthog.capture('event_name', { properties })` for custom events
- Feature flags: `posthog.isFeatureEnabled('flag-name')` with fallback values
- Group analytics: `posthog.group('company', company_id)` for B2B
- Use PostHog Toolbar for no-code event creation (click-to-track)

### Pitfalls
- Self-hosted PostHog requires significant infrastructure — start with Cloud
- Client-side capture sends data on page unload — some events may be lost
- Ad blockers block PostHog by default — consider reverse proxy setup
