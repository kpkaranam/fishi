---
id: payments-paypal
name: PayPal
category: payments
frameworks: ["PayPal","@paypal/react-paypal-js","paypal-rest-sdk"]
dependencies: ["PayPal","@paypal/react-paypal-js","paypal-rest-sdk"]
description: "Global payment platform with buyer protection and Express Checkout"
---

# PayPal

**Category:** Payments
**Tools:** PayPal, @paypal/react-paypal-js, paypal-rest-sdk

### Setup
- Install: `pnpm add @paypal/react-paypal-js @paypal/paypal-js`
- Env vars: PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_WEBHOOK_ID

### Architecture
- Client-side: `<PayPalScriptProvider>` + `<PayPalButtons>` for checkout UI
- Server-side: Create orders via PayPal REST API, capture payments on approval
- Flow: createOrder → buyer approves → onApprove → captureOrder on server
- Webhooks: PAYMENT.CAPTURE.COMPLETED, BILLING.SUBSCRIPTION.ACTIVATED

### Key Patterns
- Use PayPal Smart Buttons — auto-detect buyer's preferred payment method
- Implement both one-time payments and subscriptions (PayPal Billing Plans)
- Store PayPal order_id and subscription_id in your database
- Use sandbox environment for development (separate sandbox credentials)

### Pitfalls
- PayPal SDK is loaded externally — handle script loading states
- Always capture payments server-side, never trust client-side confirmation alone
- Webhook verification requires PayPal's certificate chain validation
