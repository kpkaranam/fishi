---
id: vectordb-pinecone
name: Pinecone
category: vectordb
frameworks: ["Pinecone","@pinecone-database/pinecone"]
dependencies: ["Pinecone","@pinecone-database/pinecone"]
description: "Fully managed vector database with serverless and pod-based deployment"
---

# Pinecone

**Category:** Vector Database
**Tools:** Pinecone, @pinecone-database/pinecone

### Setup
- Install: `pnpm add @pinecone-database/pinecone`
- Env vars: PINECONE_API_KEY, PINECONE_INDEX_NAME

### Architecture
- Serverless indexes: Auto-scale, pay-per-query — recommended for most use cases
- Upsert: `index.upsert([{ id, values, metadata }])` — vectors with metadata
- Query: `index.query({ vector, topK, filter })`
- Namespaces: Logical partitions within an index for multi-tenancy

### Key Patterns
- Use namespaces to separate data by tenant/user/project
- Metadata filtering: `filter: { category: { $eq: 'tech' } }` during query
- Batch upsert in chunks of 100 for optimal performance
- Use sparse-dense vectors for hybrid search (keyword + semantic)

### Pitfalls
- Serverless has cold start latency — first query after idle may be slower
- Metadata values have size limits — don't store large text in metadata
- Index deletion is permanent — no undo, no snapshots on serverless
