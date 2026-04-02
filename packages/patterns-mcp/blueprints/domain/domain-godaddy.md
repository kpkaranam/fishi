---
id: domain-godaddy
name: GoDaddy
category: domain
frameworks: ["GoDaddy","GoDaddy API"]
dependencies: ["GoDaddy","GoDaddy API"]
description: "Domain registrar with DNS management and API access"
---

# GoDaddy

**Category:** Domain
**Tools:** GoDaddy, GoDaddy API

### Setup
- Get API credentials from developer.godaddy.com
- Use GoDaddy REST API — no official Node.js SDK (use fetch)
- Env vars: GODADDY_API_KEY, GODADDY_API_SECRET

### Architecture
- Domains API: Check availability, register, renew, transfer domains
- DNS API: Manage A, CNAME, MX, TXT records programmatically
- Certificates API: SSL certificate provisioning and management
- Auth: API key + secret in Authorization header

### Key Patterns
- DNS automation: Update records on deployment (point to new server IP)
- Domain availability check before registration: GET /v1/domains/available
- Bulk DNS updates: PATCH /v1/domains/{domain}/records for batch changes
- Use TXT records for domain verification (SSL, email, Stripe, etc.)

### Pitfalls
- API has separate OTE (test) and production environments — use OTE for development
- Rate limits: 60 requests/minute — implement throttling for batch operations
- DNS propagation: Changes take 15min to 48hrs — TTL affects propagation speed
