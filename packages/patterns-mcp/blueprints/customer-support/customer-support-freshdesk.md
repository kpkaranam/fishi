---
id: customer-support-freshdesk
name: Freshdesk
category: customer-support
frameworks: ["Freshdesk","Freshdesk API"]
dependencies: ["Freshdesk","Freshdesk API"]
description: "Customer support platform with ticketing, knowledge base, and automation"
---

# Freshdesk

**Category:** Customer Support
**Tools:** Freshdesk, Freshdesk API

### Setup
- Use Freshdesk REST API v2 — no official Node.js SDK (use fetch or axios)
- Auth: API key as username with `X` as password (Basic Auth)
- Env vars: FRESHDESK_DOMAIN, FRESHDESK_API_KEY

### Architecture
- Tickets: Create, update, list, filter via REST API
- Contacts: Manage customer profiles linked to tickets
- Knowledge base: Articles and categories for self-service support
- Webhooks: Ticket created, updated, resolved — trigger custom workflows

### Key Patterns
- Create tickets from your app: POST /api/v2/tickets with requester info
- Use custom fields for app-specific metadata on tickets
- Automation rules in Freshdesk for routing, SLA, and escalation
- Embed Freshdesk widget in your app for in-app support

### Pitfalls
- API rate limit: varies by plan (free: 50/min, paid: higher) — implement throttling
- Pagination: Use `page` and `per_page` params — default 30 items
- Webhook payloads are not signed — verify source IP or implement shared secret
