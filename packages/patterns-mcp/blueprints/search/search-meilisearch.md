---
id: search-meilisearch
name: Meilisearch
category: search
frameworks: ["Meilisearch","meilisearch"]
dependencies: ["Meilisearch","meilisearch"]
description: "Open-source, fast search engine with typo tolerance and easy setup"
---

# Meilisearch

**Category:** Search
**Tools:** Meilisearch, meilisearch

### Setup
- Install: `pnpm add meilisearch`
- Run: `docker run -p 7700:7700 getmeili/meilisearch` or use Meilisearch Cloud
- Env vars: MEILISEARCH_HOST, MEILISEARCH_API_KEY

### Architecture
- Self-hosted or Meilisearch Cloud — REST API with SDKs for all languages
- Index documents: `client.index('products').addDocuments(products)`
- Search: `client.index('products').search('query', { filter, sort, limit })`
- Filterable/sortable attributes must be configured before use

### Key Patterns
- Use `filterableAttributes` for faceted search (category, price, etc.)
- Typo tolerance and ranking rules are configured per-index
- Implement multi-index search for searching across different content types
- Use webhooks or CRON jobs to keep Meilisearch in sync with your database

### Pitfalls
- Meilisearch stores all data in memory — plan RAM based on dataset size
- No partial updates — re-index the full document on any change
- Self-hosted requires maintenance — use Meilisearch Cloud for production simplicity
