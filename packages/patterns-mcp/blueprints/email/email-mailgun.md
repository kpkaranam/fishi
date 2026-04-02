---
id: email-mailgun
name: Mailgun
category: email
frameworks: ["Mailgun","mailgun.js","form-data"]
dependencies: ["Mailgun","mailgun.js","form-data"]
description: "Email API with powerful routing, validation, and analytics"
---

# Mailgun

**Category:** Email
**Tools:** Mailgun, mailgun.js, form-data

### Setup
- Install: `pnpm add mailgun.js form-data`
- Env vars: MAILGUN_API_KEY, MAILGUN_DOMAIN, MAILGUN_FROM_EMAIL

### Architecture
- Initialize: `new Mailgun(formData).client({ username: 'api', key })`
- Send: `mg.messages.create(domain, { from, to, subject, html })`
- Routes: Define inbound email routing rules (forward, store, webhook)
- Templates: Manage via API or Mailgun Dashboard with Handlebars

### Key Patterns
- Use Mailgun's email validation API to verify addresses before sending
- Mailing lists for group communications and marketing
- Tags for categorizing and tracking email campaigns
- Webhooks for delivery events: delivered, opened, clicked, bounced

### Pitfalls
- API key has two types: primary (full access) and sending (limited) — use sending key in app
- Free tier: 100 emails/day for first 3 months — plan accordingly
- EU region requires different API endpoint (api.eu.mailgun.net)
