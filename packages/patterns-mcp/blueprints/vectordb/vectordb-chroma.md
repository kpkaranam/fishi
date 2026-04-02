---
id: vectordb-chroma
name: Chroma
category: vectordb
frameworks: ["Chroma","chromadb"]
dependencies: ["Chroma","chromadb"]
description: "Open-source embedding database, great for prototyping and local development"
---

# Chroma

**Category:** Vector Database
**Tools:** Chroma, chromadb

### Setup
- Install: `pip install chromadb` (Python) or use Chroma's REST API with fetch
- Run: `chroma run --host 0.0.0.0 --port 8000` or in-memory for dev
- Env vars: CHROMA_HOST, CHROMA_PORT

### Architecture
- Collections: Create with optional embedding function (auto-embed documents)
- Add: `collection.add({ ids, documents, embeddings, metadatas })`
- Query: `collection.query({ queryTexts, nResults, where })`
- Built-in embedding: Pass documents without embeddings — Chroma auto-embeds

### Key Patterns
- Use in-memory mode for prototyping, persistent mode for development
- Built-in embedding functions: sentence-transformers, OpenAI, Cohere
- Where filters on metadata during query for hybrid search
- Use `collection.update()` to modify existing documents without re-adding

### Pitfalls
- Chroma is best for prototyping — consider Qdrant/Pinecone for production scale
- Node.js client is community-maintained — Python SDK is primary
- In-memory collections are lost on restart — use persistent directory for dev
