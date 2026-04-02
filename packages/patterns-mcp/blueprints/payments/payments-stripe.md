---
id: payments-stripe
name: Stripe
category: payments
frameworks: ["Stripe","stripe","@stripe/stripe-js"]
dependencies: ["Stripe","stripe","@stripe/stripe-js"]
description: "Full-featured payment platform with subscriptions, invoicing, and Connect"
---

# Stripe

**Category:** Payments
**Tools:** Stripe, stripe, @stripe/stripe-js

### Setup
- Install: `pnpm add stripe @stripe/stripe-js`
- Env vars: STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET

### Architecture
- Server-side: Create checkout sessions, manage subscriptions via Stripe API
- Client-side: Use @stripe/stripe-js for Elements (card input, payment form)
- Webhooks: POST /api/webhooks/stripe — verify signature, handle checkout.session.completed, invoice.paid, customer.subscription.updated
- Store customer_id and subscription_id in your users table

### Key Patterns
- Always verify webhook signatures with stripe.webhooks.constructEvent()
- Use Stripe Customer Portal for self-service billing management
- Implement idempotency keys for payment operations
- Handle subscription states: active, past_due, canceled, trialing

### Pitfalls
- Never expose STRIPE_SECRET_KEY to client
- Always handle webhook retries (idempotent handlers)
- Test with Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
