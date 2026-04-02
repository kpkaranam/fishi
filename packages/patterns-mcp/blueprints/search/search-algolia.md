---
id: search-algolia
name: Algolia
category: search
frameworks: ["Algolia","algoliasearch","react-instantsearch"]
dependencies: ["Algolia","algoliasearch","react-instantsearch"]
description: "Hosted search with typo tolerance, faceting, and instant results"
---

# Algolia

**Category:** Search
**Tools:** Algolia, algoliasearch, react-instantsearch

### Setup
- Install: `pnpm add algoliasearch react-instantsearch`
- Env vars: NEXT_PUBLIC_ALGOLIA_APP_ID, NEXT_PUBLIC_ALGOLIA_SEARCH_KEY, ALGOLIA_ADMIN_KEY

### Architecture
- Index data: Push records to Algolia using admin API (server-side only)
- Search: Client-side with react-instantsearch widgets or algoliasearch client
- Sync strategy: Webhook on data change → update Algolia index
- Widgets: `<InstantSearch>`, `<SearchBox>`, `<Hits>`, `<RefinementList>`

### Key Patterns
- Use searchable attributes ranking to prioritize title > description > content
- Configure facets for filtering (category, price range, tags)
- Use Algolia's query rules for merchandising and custom result boosting
- Implement "search as you type" with debounced queries

### Pitfalls
- Search-only API key is public — admin key must never be exposed to client
- Keep index in sync with database — stale data degrades search experience
- Free tier: 10,000 search requests/month — monitor usage closely
