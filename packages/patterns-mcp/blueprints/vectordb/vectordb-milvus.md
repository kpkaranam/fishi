---
id: vectordb-milvus
name: Milvus
category: vectordb
frameworks: ["Milvus","@zilliz/milvus2-sdk-node"]
dependencies: ["Milvus","@zilliz/milvus2-sdk-node"]
description: "Cloud-native vector database designed for billion-scale similarity search"
---

# Milvus

**Category:** Vector Database
**Tools:** Milvus, @zilliz/milvus2-sdk-node

### Setup
- Install: `pnpm add @zilliz/milvus2-sdk-node`
- Run: Zilliz Cloud (managed) or Docker: `docker compose up milvus-standalone`
- Env vars: MILVUS_ADDRESS, MILVUS_TOKEN

### Architecture
- Collections with schema: Define fields (vector, scalar) and index types
- Insert: Batch insert vectors with metadata fields
- Search: `client.search({ collection_name, vector, limit, filter })`
- Index types: IVF_FLAT, HNSW, ANNOY — choose based on dataset size and speed needs

### Key Patterns
- Use HNSW index for datasets under 10M vectors, IVF for larger
- Partition by a high-cardinality field (tenant_id) for multi-tenant isolation
- Use hybrid search: combine vector similarity with scalar filtering
- Flush after batch inserts to make data searchable

### Pitfalls
- Milvus requires etcd and MinIO for standalone — complex Docker setup
- Schema changes require dropping and recreating collection
- Zilliz Cloud simplifies operations significantly — recommended for production
