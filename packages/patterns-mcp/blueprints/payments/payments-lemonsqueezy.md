---
id: payments-lemonsqueezy
name: LemonSqueezy
category: payments
frameworks: ["LemonSqueezy","@lemonsqueezy/lemonsqueezy.js"]
dependencies: ["LemonSqueezy","@lemonsqueezy/lemonsqueezy.js"]
description: "Merchant of record — handles tax, billing, and compliance for digital products"
---

# LemonSqueezy

**Category:** Payments
**Tools:** LemonSqueezy, @lemonsqueezy/lemonsqueezy.js

### Setup
- Install: `pnpm add @lemonsqueezy/lemonsqueezy.js`
- Env vars: LEMONSQUEEZY_API_KEY, LEMONSQUEEZY_STORE_ID, LEMONSQUEEZY_WEBHOOK_SECRET

### Architecture
- LemonSqueezy is the merchant of record — they handle tax, VAT, and compliance
- Create products/variants in LemonSqueezy Dashboard, reference by ID in your app
- Checkout: Generate checkout URLs via API, redirect users to LemonSqueezy-hosted page
- Webhooks: order_created, subscription_created, subscription_updated, license_key_created

### Key Patterns
- Use checkout overlays for in-app purchase experience (no redirect)
- Map LemonSqueezy customer_id to your user_id via webhook on first purchase
- License keys for desktop/CLI apps — validate via API
- Use test mode for development (separate test API key)

### Pitfalls
- As merchant of record, LemonSqueezy receives funds first, then pays you — expect delay
- Webhook payload structure differs from Stripe — use their SDK for type safety
- No direct card element integration — checkout is always LemonSqueezy-hosted or overlay
