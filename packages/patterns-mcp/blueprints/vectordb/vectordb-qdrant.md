---
id: vectordb-qdrant
name: Qdrant
category: vectordb
frameworks: ["Qdrant","@qdrant/js-client-rest"]
dependencies: ["Qdrant","@qdrant/js-client-rest"]
description: "High-performance vector database with filtering and payload storage"
---

# Qdrant

**Category:** Vector Database
**Tools:** Qdrant, @qdrant/js-client-rest

### Setup
- Install: `pnpm add @qdrant/js-client-rest`
- Run: `docker run -p 6333:6333 qdrant/qdrant` or use Qdrant Cloud
- Env vars: QDRANT_URL, QDRANT_API_KEY

### Architecture
- Collections: Create with vector size and distance metric (cosine, dot, euclidean)
- Upsert points with vectors + payload metadata
- Search: `client.search(collection, { vector, filter, limit })`
- Filtering: Payload-based filters during vector search (no post-filtering)

### Key Patterns
- Use payload indexes for frequent filter fields (category, userId, timestamp)
- Batch upsert for bulk ingestion: `client.upsert(collection, { points: [...] })`
- Use named vectors for multi-model embeddings in same collection
- Snapshots for backup and migration between environments

### Pitfalls
- Collection must be created before upserting — handle initialization in startup
- Vector dimension is immutable after collection creation
- Self-hosted requires persistent storage volume — don't use ephemeral containers
