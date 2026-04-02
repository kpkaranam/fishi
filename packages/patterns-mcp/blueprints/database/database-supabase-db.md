---
id: database-supabase-db
name: Supabase Database
category: database
frameworks: ["Supabase","@supabase/supabase-js","PostgreSQL"]
dependencies: ["Supabase","@supabase/supabase-js","PostgreSQL"]
description: "Managed PostgreSQL with auto-generated REST and realtime APIs"
---

# Supabase Database

**Category:** Database
**Tools:** Supabase, @supabase/supabase-js, PostgreSQL

### Setup
- Install: `pnpm add @supabase/supabase-js`
- Env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

### Architecture
- Auto-generated REST API: `supabase.from('users').select('*')` — no ORM needed
- Realtime: Subscribe to database changes with `supabase.channel().on('postgres_changes', ...)`
- RLS: Row Level Security policies control data access per-user
- Edge Functions: Server-side logic in Deno, deployed on Supabase infrastructure

### Key Patterns
- Use RLS policies on every table — anon key is public, RLS is your access control
- Service role key bypasses RLS — only use server-side, never expose to client
- Use database functions for complex queries and business logic
- Supabase CLI for local development: `supabase start`

### Pitfalls
- Anon key without RLS = public database — always enable RLS
- Supabase client caches auth state — create separate clients for different auth contexts
- Free tier: 500MB database, 2 projects — plan for paid tier in production
