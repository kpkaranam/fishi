---
id: authentication-nextauth
name: NextAuth.js
category: authentication
frameworks: ["NextAuth.js","next-auth","Auth.js"]
dependencies: ["NextAuth.js","next-auth","Auth.js"]
description: "Open-source authentication for Next.js with 50+ providers"
---

# NextAuth.js

**Category:** Authentication
**Tools:** NextAuth.js, next-auth, Auth.js

### Setup
- Install: `pnpm add next-auth` (v4) or `pnpm add next-auth@beta` (v5/Auth.js)
- Env vars: NEXTAUTH_SECRET, NEXTAUTH_URL, provider-specific client IDs/secrets

### Architecture
- API Route: /api/auth/[...nextauth] — handles all auth flows
- Configure providers in auth config: Google, GitHub, Credentials, Email, etc.
- Database adapter: Prisma, Drizzle, or Supabase for session/user persistence
- Client: `useSession()` hook, `<SessionProvider>` wrapper
- Server: `getServerSession()` in API routes, `auth()` in v5

### Key Patterns
- Use JWT strategy for serverless, database strategy for traditional servers
- Extend session with custom fields via callbacks.session and callbacks.jwt
- Use middleware matcher for route protection (v5)

### Pitfalls
- NEXTAUTH_SECRET must be set in production — generate with `openssl rand -base64 32`
- Credentials provider doesn't support session persistence without a database adapter
- v4 to v5 migration: significant API changes — check migration guide
