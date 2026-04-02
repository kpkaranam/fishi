---
id: database-prisma-postgresql
name: Prisma + PostgreSQL
category: database
frameworks: ["Prisma","PostgreSQL","@prisma/client"]
dependencies: ["Prisma","PostgreSQL","@prisma/client"]
description: "Type-safe ORM with auto-generated client and migrations"
---

# Prisma + PostgreSQL

**Category:** Database
**Tools:** Prisma, PostgreSQL, @prisma/client

### Setup
- Install: `pnpm add prisma -D && pnpm add @prisma/client`
- Init: `npx prisma init` — creates prisma/schema.prisma
- Env vars: DATABASE_URL (postgresql://user:pass@host:5432/db)

### Architecture
- Schema-first: Define models in schema.prisma, generate client with `npx prisma generate`
- Migrations: `npx prisma migrate dev` for development, `migrate deploy` for production
- Client: Singleton pattern — create one PrismaClient instance, reuse across requests
- Relations: Use Prisma's relation fields for type-safe joins and nested queries

### Key Patterns
- Use `prisma.$transaction()` for multi-step operations
- Soft deletes: Add deletedAt field, use middleware to filter automatically
- Use `prisma db seed` for development/test data
- Index frequently queried fields with `@@index` in schema

### Pitfalls
- PrismaClient in serverless: Use connection pooling (PgBouncer or Prisma Accelerate)
- Hot reload creates multiple clients — use global singleton pattern in dev
- N+1 queries: Use `include` or `select` to eager-load relations
