---
id: customer-support-zendesk
name: Zendesk
category: customer-support
frameworks: ["Zendesk","node-zendesk","Zendesk API"]
dependencies: ["Zendesk","node-zendesk","Zendesk API"]
description: "Enterprise customer service platform with omnichannel support"
---

# Zendesk

**Category:** Customer Support
**Tools:** Zendesk, node-zendesk, Zendesk API

### Setup
- Install: `pnpm add node-zendesk` or use Zendesk REST API with fetch
- Auth: API token (`email/token:api_key`) or OAuth
- Env vars: ZENDESK_SUBDOMAIN, ZENDESK_EMAIL, ZENDESK_API_TOKEN

### Architecture
- Tickets API: Create, update, search, and manage support tickets
- Users API: Manage end-users, agents, and organizations
- Help Center API: Articles, sections, categories for self-service
- Chat/Messaging: Real-time customer communication via Zendesk Widget

### Key Patterns
- Use ticket triggers for automated responses and routing
- Zendesk Widget: Embed support chat/help center in your app with one script tag
- Search API with Zendesk Query Language for complex ticket queries
- Webhooks + Zendesk Triggers for real-time ticket event processing

### Pitfalls
- API rate limit: 700 requests/minute (Enterprise) — lower on smaller plans
- Zendesk has multiple products (Support, Chat, Guide) — each has separate APIs
- Sandbox environment requires Enterprise plan — test carefully on trial accounts
