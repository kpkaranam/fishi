---
id: authentication-supabase-auth
name: Supabase Auth
category: authentication
frameworks: ["Supabase","@supabase/supabase-js","@supabase/auth-helpers-nextjs"]
dependencies: ["Supabase","@supabase/supabase-js","@supabase/auth-helpers-nextjs"]
description: "PostgreSQL-backed auth with Row Level Security integration"
---

# Supabase Auth

**Category:** Authentication
**Tools:** Supabase, @supabase/supabase-js, @supabase/auth-helpers-nextjs

### Setup
- Install: `pnpm add @supabase/supabase-js @supabase/ssr`
- Env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY

### Architecture
- Auth is built into Supabase — no separate service needed
- Client-side: `supabase.auth.signInWithOAuth()`, `signInWithPassword()`
- Server-side: Create server client with cookie-based sessions
- RLS: auth.uid() in PostgreSQL policies ties data access to authenticated user
- Middleware: Refresh sessions on every request with `updateSession()`

### Key Patterns
- Enable RLS on all tables — use `auth.uid() = user_id` policies
- Use Supabase Edge Functions for server-side auth logic
- Configure OAuth providers in Supabase Dashboard > Authentication > Providers
- Use auth.users table — don't create a separate users table for auth data

### Pitfalls
- Anon key is public but RLS must be enabled — without RLS, data is exposed
- Cookie-based auth requires middleware setup for server components
- Email confirmation enabled by default — disable in dev for faster iteration
