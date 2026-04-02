---
id: search-pgvector
name: pgvector
category: search
frameworks: ["pgvector","PostgreSQL","pgvector"]
dependencies: ["pgvector","PostgreSQL","pgvector"]
description: "Vector similarity search as a PostgreSQL extension"
---

# pgvector

**Category:** Search
**Tools:** pgvector, PostgreSQL, pgvector

### Setup
- Install extension: `CREATE EXTENSION vector;` in PostgreSQL
- Install: `pnpm add pgvector` (Node.js client) or use Prisma/Drizzle with raw queries
- Requires PostgreSQL 11+ with pgvector extension installed

### Architecture
- Add vector column: `ALTER TABLE items ADD COLUMN embedding vector(1536);`
- Store embeddings from OpenAI, Cohere, or local models alongside your data
- Query: `SELECT * FROM items ORDER BY embedding <=> '[...]' LIMIT 10;`
- Index: Create IVFFlat or HNSW index for fast similarity search

### Key Patterns
- Use HNSW index for best recall/speed tradeoff: `CREATE INDEX ON items USING hnsw (embedding vector_cosine_ops)`
- Combine vector search with SQL filters: `WHERE category = 'tech' ORDER BY embedding <=> $1`
- Batch insert embeddings with COPY for large datasets
- Use inner product (`<#>`) for normalized vectors, cosine (`<=>`) for general use

### Pitfalls
- pgvector indexes require tuning — default parameters may give poor recall
- Embedding dimensions must match your model (OpenAI ada-002 = 1536, text-embedding-3-small = 1536)
- Large vector columns increase table size significantly — consider separate table
