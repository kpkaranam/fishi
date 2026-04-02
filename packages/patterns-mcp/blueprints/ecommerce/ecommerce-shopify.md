---
id: ecommerce-shopify
name: Shopify
category: ecommerce
frameworks: ["Shopify","@shopify/shopify-api","@shopify/hydrogen"]
dependencies: ["Shopify","@shopify/shopify-api","@shopify/hydrogen"]
description: "Full-featured e-commerce platform with Storefront and Admin APIs"
---

# Shopify

**Category:** E-commerce
**Tools:** Shopify, @shopify/shopify-api, @shopify/hydrogen

### Setup
- Install: `pnpm add @shopify/shopify-api` (custom app) or `npx create-hydrogen-app` (Hydrogen)
- Create app in Shopify Partners Dashboard — get API credentials
- Env vars: SHOPIFY_API_KEY, SHOPIFY_API_SECRET, SHOPIFY_STORE_DOMAIN, SHOPIFY_ACCESS_TOKEN

### Architecture
- Storefront API: Public, client-safe — product listings, cart, checkout (GraphQL)
- Admin API: Server-side only — orders, inventory, customers, fulfillment (REST/GraphQL)
- Hydrogen: Shopify's React framework for custom storefronts (built on Remix)
- Webhooks: Order created, product updated, checkout completed — mandatory for data sync

### Key Patterns
- Use Storefront API for headless commerce — cart and checkout without Shopify theme
- GraphQL for Storefront API, REST or GraphQL for Admin API
- Implement webhook HMAC verification for all incoming webhooks
- Use metafields for custom product/order data that doesn't fit standard schema

### Pitfalls
- Storefront API requires storefront access token (different from admin token)
- Checkout is Shopify-hosted unless you're on Shopify Plus (checkout extensibility)
- API versioning: Shopify deprecates API versions quarterly — pin and upgrade regularly
