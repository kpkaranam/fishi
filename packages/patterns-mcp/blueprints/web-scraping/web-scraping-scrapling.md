---
id: web-scraping-scrapling
name: Scrapling
category: web-scraping
frameworks: ["Scrapling","cheerio","puppeteer"]
dependencies: ["Scrapling","cheerio","puppeteer"]
description: "Lightweight web scraping library with CSS selector-based extraction"
---

# Scrapling

**Category:** Web Scraping
**Tools:** Scrapling, cheerio, puppeteer

### Setup
- Install: `pnpm add cheerio` (HTML parsing) + `pnpm add puppeteer` (browser automation)
- For static pages: Use fetch + cheerio — fast and lightweight
- For JS-rendered pages: Use puppeteer for full browser rendering

### Architecture
- Static scraping: Fetch HTML → parse with cheerio → extract with CSS selectors
- Dynamic scraping: Launch puppeteer browser → navigate → wait for content → extract
- Pipeline: URL queue → fetch/render → parse → transform → store
- Scheduling: CRON jobs for periodic scraping (price monitoring, content aggregation)

### Key Patterns
- Use cheerio for static HTML: `$(selector).text()`, `$(selector).attr('href')`
- Puppeteer for SPAs: `page.waitForSelector('.data')` then `page.evaluate()`
- Implement request delays and rotation to avoid rate limits
- Cache responses to avoid re-scraping unchanged pages (ETags, Last-Modified)

### Pitfalls
- Respect robots.txt and terms of service — scraping may violate ToS
- Puppeteer requires Chromium — significant resource usage in production
- Anti-bot measures (Cloudflare, captchas) may block scrapers — consider using proxies
