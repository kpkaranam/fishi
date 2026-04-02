---
id: database-drizzle
name: Drizzle ORM
category: database
frameworks: ["Drizzle","drizzle-orm","drizzle-kit"]
dependencies: ["Drizzle","drizzle-orm","drizzle-kit"]
description: "Lightweight TypeScript ORM with SQL-like syntax and zero overhead"
---

# Drizzle ORM

**Category:** Database
**Tools:** Drizzle, drizzle-orm, drizzle-kit

### Setup
- Install: `pnpm add drizzle-orm postgres` + `pnpm add drizzle-kit -D`
- Create schema in src/db/schema.ts using Drizzle table builders
- Env vars: DATABASE_URL

### Architecture
- Schema-as-code: Define tables with `pgTable()`, columns as TypeScript
- Queries: SQL-like syntax — `db.select().from(users).where(eq(users.id, id))`
- Migrations: `npx drizzle-kit generate` then `npx drizzle-kit migrate`
- Relational queries: `db.query.users.findMany({ with: { posts: true } })`

### Key Patterns
- Use `drizzle-zod` to generate Zod schemas from Drizzle tables
- Prepared statements for performance: `db.select().from(users).prepare('getUsers')`
- Use `db.transaction(async (tx) => { ... })` for atomic operations
- Drizzle Studio: `npx drizzle-kit studio` for database browsing

### Pitfalls
- Drizzle is SQL-first — if you prefer object-oriented, use Prisma instead
- No auto-migration like Prisma — you must generate and review migration files
- Connection pooling still needed for serverless (use @neondatabase/serverless or pg-pool)
