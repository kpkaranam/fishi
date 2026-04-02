---
id: monitoring-datadog
name: Datadog
category: monitoring
frameworks: ["Datadog","dd-trace","@datadog/browser-rum"]
dependencies: ["Datadog","dd-trace","@datadog/browser-rum"]
description: "Full-stack observability platform with APM, logs, and infrastructure monitoring"
---

# Datadog

**Category:** Monitoring
**Tools:** Datadog, dd-trace, @datadog/browser-rum

### Setup
- Install: `pnpm add dd-trace` (APM) + `pnpm add @datadog/browser-rum` (browser)
- APM: `require('dd-trace').init()` — must be first line in app entry
- Env vars: DD_API_KEY, DD_APP_KEY, DD_SITE, DD_SERVICE, DD_ENV

### Architecture
- APM: Automatic tracing of HTTP, database, and cache operations
- RUM: Real User Monitoring — performance, errors, and user journeys in browser
- Logs: Correlate logs with traces using dd-trace log injection
- Custom metrics: `tracer.dogstatsd.increment('api.requests', 1, { endpoint: '/users' })`

### Key Patterns
- Use unified service tagging: DD_SERVICE, DD_ENV, DD_VERSION on all telemetry
- Trace ID correlation: Connect frontend RUM sessions to backend APM traces
- Custom spans: `tracer.trace('operation', () => { ... })` for business logic
- Dashboards: Build custom dashboards for SLIs/SLOs

### Pitfalls
- dd-trace must be initialized before any other imports — use --require flag
- Datadog pricing is per-host and per-ingested-data — costs can escalate quickly
- RUM sampling: Default 100% — reduce for high-traffic sites to control costs
