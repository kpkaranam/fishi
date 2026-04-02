---
id: search-typesense
name: Typesense
category: search
frameworks: ["Typesense","typesense"]
dependencies: ["Typesense","typesense"]
description: "Open-source, typo-tolerant search with automatic schema detection"
---

# Typesense

**Category:** Search
**Tools:** Typesense, typesense

### Setup
- Install: `pnpm add typesense`
- Run: `docker run -p 8108:8108 typesense/typesense:latest --api-key=xyz`
- Env vars: TYPESENSE_HOST, TYPESENSE_API_KEY, TYPESENSE_PORT

### Architecture
- Define collection schema with field types and faceting configuration
- Index: `client.collections('products').documents().create(document)`
- Search: `client.collections('products').documents().search(searchParameters)`
- Curation: Pin/hide specific results for marketing queries

### Key Patterns
- Use `query_by` to specify which fields to search across
- Faceting: `facet_by: 'category,brand'` for filter panels
- Geo search: Add `geopoint` fields for location-based search
- Use scoped API keys for client-side search (restrict to specific collections)

### Pitfalls
- Collection schema must be defined upfront — auto-schema detection is limited
- All data must fit in RAM — not suitable for very large datasets without clustering
- Self-hosted HA requires Typesense Cloud or manual clustering setup
