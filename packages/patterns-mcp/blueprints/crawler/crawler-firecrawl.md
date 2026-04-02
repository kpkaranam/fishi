---
id: crawler-firecrawl
name: Firecrawl
category: crawler
frameworks: ["Firecrawl","@mendable/firecrawl-js"]
dependencies: ["Firecrawl","@mendable/firecrawl-js"]
description: "AI-powered web crawler that extracts clean markdown from any URL"
---

# Firecrawl

**Category:** Crawler
**Tools:** Firecrawl, @mendable/firecrawl-js

### Setup
- Install: `pnpm add @mendable/firecrawl-js`
- Env vars: FIRECRAWL_API_KEY

### Architecture
- Scrape: Single URL → clean markdown/HTML extraction with metadata
- Crawl: Start from URL, follow links, extract content from entire site
- Map: Get all URLs from a website without extracting content
- Async crawl: Submit job, poll for completion, get results

### Key Patterns
- Use scrape for single-page extraction: `app.scrapeUrl(url, { formats: ['markdown'] })`
- Crawl for site-wide content: `app.crawlUrl(url, { limit: 100 })`
- Use `includePaths` and `excludePaths` to filter crawled URLs
- Extract structured data with LLM extraction mode (schema-based)

### Pitfalls
- Crawl jobs can be slow for large sites — use async mode with webhooks
- Respect robots.txt — Firecrawl follows it by default
- API rate limits depend on plan — implement retry logic for 429 responses
