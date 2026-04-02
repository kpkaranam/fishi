---
id: search-elasticsearch
name: Elasticsearch
category: search
frameworks: ["Elasticsearch","@elastic/elasticsearch"]
dependencies: ["Elasticsearch","@elastic/elasticsearch"]
description: "Distributed search and analytics engine for large-scale data"
---

# Elasticsearch

**Category:** Search
**Tools:** Elasticsearch, @elastic/elasticsearch

### Setup
- Install: `pnpm add @elastic/elasticsearch`
- Run: Elastic Cloud (managed) or Docker: `docker run -p 9200:9200 elasticsearch:8`
- Env vars: ELASTICSEARCH_URL, ELASTICSEARCH_API_KEY

### Architecture
- Index documents with typed mappings — define analyzers for text fields
- Query DSL: `client.search({ index, body: { query: { match: { title: 'search term' } } } })`
- Aggregations: Facets, histograms, stats computed during search
- Ingest pipelines: Transform documents on indexing (extract, enrich, normalize)

### Key Patterns
- Use bulk API for indexing large datasets: `client.bulk({ body: operations })`
- Multi-match queries for searching across multiple fields
- Use index aliases for zero-downtime reindexing
- Implement search-as-you-type with completion suggesters

### Pitfalls
- Elasticsearch is resource-intensive — requires dedicated infrastructure
- Mapping changes require reindexing — plan schema carefully upfront
- JVM heap size must be configured properly — default is often too small
