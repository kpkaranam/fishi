---
id: analytics-mixpanel
name: Mixpanel
category: analytics
frameworks: ["Mixpanel","mixpanel-browser","mixpanel"]
dependencies: ["Mixpanel","mixpanel-browser","mixpanel"]
description: "Advanced product analytics with funnels, cohorts, and A/B testing"
---

# Mixpanel

**Category:** Analytics
**Tools:** Mixpanel, mixpanel-browser, mixpanel

### Setup
- Install: `pnpm add mixpanel-browser` (client) + `pnpm add mixpanel` (server)
- Env vars: NEXT_PUBLIC_MIXPANEL_TOKEN

### Architecture
- Client: `mixpanel.init(token)` in app layout, track events with `mixpanel.track()`
- Server: Use mixpanel Node SDK for backend events (payments, signups)
- Identity: `mixpanel.identify(user_id)` after login, `mixpanel.alias()` on signup
- User profiles: `mixpanel.people.set({ plan, company })` for segmentation

### Key Patterns
- Define funnels in Mixpanel for conversion analysis (signup → activate → pay)
- Use super properties for persistent event metadata: `mixpanel.register({ plan })`
- Cohort analysis for retention tracking
- Use Mixpanel's Warehouse Connectors for raw data export

### Pitfalls
- Identity management is critical — incorrect alias/identify calls corrupt user data
- Free tier: 20M events/month — generous but watch for event volume
- Don't track PII in event properties — use user profiles instead
