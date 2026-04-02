---
id: realtime-supabase-realtime
name: Supabase Realtime
category: realtime
frameworks: ["Supabase Realtime","@supabase/supabase-js"]
dependencies: ["Supabase Realtime","@supabase/supabase-js"]
description: "PostgreSQL change data capture with WebSocket delivery"
---

# Supabase Realtime

**Category:** Realtime
**Tools:** Supabase Realtime, @supabase/supabase-js

### Setup
- Install: `pnpm add @supabase/supabase-js` (realtime is built into the client)
- Enable realtime on tables in Supabase Dashboard > Database > Replication
- Env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY

### Architecture
- Postgres Changes: Subscribe to INSERT, UPDATE, DELETE events on tables
- Broadcast: Send arbitrary messages to channels (not tied to database)
- Presence: Track online users and shared state across clients
- Channel: `supabase.channel('room').on('postgres_changes', { event, schema, table }, callback)`

### Key Patterns
- Filter subscriptions: `.on('postgres_changes', { filter: 'user_id=eq.123' })`
- Combine Broadcast + Presence for collaborative features (cursors, typing)
- Use RLS with realtime — users only receive changes they're authorized to see
- Unsubscribe on cleanup: `supabase.removeChannel(channel)`

### Pitfalls
- Realtime must be explicitly enabled per-table in Dashboard
- RLS applies to realtime — test policies to ensure correct data delivery
- High-frequency updates may cause performance issues — debounce where possible
