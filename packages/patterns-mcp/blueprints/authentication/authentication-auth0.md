---
id: authentication-auth0
name: Auth0
category: authentication
frameworks: ["Auth0","auth0-nextjs","auth0-spa-js"]
dependencies: ["Auth0","auth0-nextjs","auth0-spa-js"]
description: "Enterprise-grade identity platform with SSO, MFA, and social login"
---

# Auth0

**Category:** Authentication
**Tools:** Auth0, auth0-nextjs, auth0-spa-js

### Setup
- Install: `pnpm add @auth0/nextjs-auth0` (Next.js) or `@auth0/auth0-spa-js` (SPA)
- Env vars: AUTH0_SECRET, AUTH0_BASE_URL, AUTH0_ISSUER_BASE_URL, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET

### Architecture
- Use Auth0 Universal Login for authentication flows — avoid custom login forms
- Server-side: `handleAuth()` creates /api/auth/* routes (login, logout, callback, me)
- Middleware: `withMiddlewareAuthRequired` to protect routes at the edge
- Client-side: `useUser()` hook for user state, `withPageAuthRequired` for page protection
- Store Auth0 user_id in your database users table for linking

### Key Patterns
- Use Auth0 Actions for post-login hooks (sync user to DB, add custom claims)
- Configure RBAC in Auth0 Dashboard — add roles/permissions as JWT claims
- Use refresh token rotation for long-lived sessions

### Pitfalls
- Never validate JWTs manually — use the SDK's built-in verification
- Set allowed callback URLs in Auth0 Dashboard for every environment
- Auth0 rate limits: 300 requests/min for Management API
