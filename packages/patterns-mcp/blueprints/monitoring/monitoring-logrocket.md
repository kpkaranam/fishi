---
id: monitoring-logrocket
name: LogRocket
category: monitoring
frameworks: ["LogRocket","logrocket","logrocket-react"]
dependencies: ["LogRocket","logrocket","logrocket-react"]
description: "Session replay with error tracking and performance monitoring"
---

# LogRocket

**Category:** Monitoring
**Tools:** LogRocket, logrocket, logrocket-react

### Setup
- Install: `pnpm add logrocket logrocket-react`
- Env vars: NEXT_PUBLIC_LOGROCKET_APP_ID

### Architecture
- Initialize: `LogRocket.init('app-id')` in app entry point
- Auto-captures: DOM changes, network requests, console logs, JS errors
- Session replay: Pixel-perfect video replay of user sessions
- Identify users: `LogRocket.identify(userId, { name, email })`

### Key Patterns
- Use `LogRocket.track('event')` for custom event tracking
- Filter sessions by error, URL, user, or custom event in dashboard
- Integrate with Sentry: Attach LogRocket session URL to Sentry errors
- Use Redux/Vuex middleware to capture state changes in session replay

### Pitfalls
- LogRocket records all DOM — sanitize sensitive fields with `data-log-rocket-mask`
- Recording increases page weight — configure sampling rate for high-traffic apps
- Free tier: 1,000 sessions/month — use sampling in production
