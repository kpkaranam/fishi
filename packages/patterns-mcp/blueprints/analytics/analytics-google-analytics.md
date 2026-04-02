---
id: analytics-google-analytics
name: Google Analytics
category: analytics
frameworks: ["Google Analytics","@next/third-parties","gtag.js"]
dependencies: ["Google Analytics","@next/third-parties","gtag.js"]
description: "Industry-standard web analytics with GA4 event-based model"
---

# Google Analytics

**Category:** Analytics
**Tools:** Google Analytics, @next/third-parties, gtag.js

### Setup
- Install: `pnpm add @next/third-parties` (Next.js) or add gtag.js script
- Env vars: NEXT_PUBLIC_GA_MEASUREMENT_ID (G-XXXXXXXXXX)

### Architecture
- Next.js: `<GoogleAnalytics gaId="G-..." />` in layout — auto-tracks pageviews
- Custom events: `gtag('event', 'purchase', { value: 29.99, currency: 'USD' })`
- Ecommerce: Enhanced ecommerce events (view_item, add_to_cart, purchase)
- Server-side: Measurement Protocol for backend event tracking

### Key Patterns
- Use GA4 recommended events for automatic reporting (sign_up, login, purchase)
- Configure conversions in GA4 Dashboard for key business events
- Use UTM parameters for campaign attribution tracking
- BigQuery export for raw event data analysis

### Pitfalls
- GA4 is event-based (not session-based like UA) — different mental model
- Data processing delay: up to 24-48 hours for some reports
- Cookie consent required in EU — implement consent mode for GDPR compliance
