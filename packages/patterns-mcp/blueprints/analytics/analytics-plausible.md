---
id: analytics-plausible
name: Plausible
category: analytics
frameworks: ["Plausible","next-plausible","plausible-tracker"]
dependencies: ["Plausible","next-plausible","plausible-tracker"]
description: "Privacy-friendly, lightweight analytics — no cookies, GDPR compliant"
---

# Plausible

**Category:** Analytics
**Tools:** Plausible, next-plausible, plausible-tracker

### Setup
- Install: `pnpm add next-plausible` (Next.js) or add script tag manually
- Env vars: NEXT_PUBLIC_PLAUSIBLE_DOMAIN

### Architecture
- Script-based: Add Plausible script to document head — auto-tracks pageviews
- Next.js: `<PlausibleProvider domain="...">` in layout
- Custom events: `plausible('Signup', { props: { plan: 'pro' } })`
- API: Query stats programmatically via Plausible Stats API

### Key Patterns
- Goal conversions: Define in Plausible Dashboard, track with custom events
- Custom properties: Add metadata to events for segmentation
- Self-hosting: Plausible Community Edition on your own server for full control
- Use 404 tracking with custom events for broken link detection

### Pitfalls
- No session recording or heatmaps — Plausible is pageview/event analytics only
- Custom properties limited to string values
- Self-hosted requires ClickHouse — resource-intensive for small teams
