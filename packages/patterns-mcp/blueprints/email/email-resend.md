---
id: email-resend
name: Resend
category: email
frameworks: ["Resend","resend","react-email"]
dependencies: ["Resend","resend","react-email"]
description: "Modern email API built for developers with React Email support"
---

# Resend

**Category:** Email
**Tools:** Resend, resend, react-email

### Setup
- Install: `pnpm add resend` + `pnpm add react-email @react-email/components -D`
- Env vars: RESEND_API_KEY, RESEND_FROM_EMAIL

### Architecture
- Write email templates as React components using @react-email/components
- Send: `resend.emails.send({ from, to, subject, react: <WelcomeEmail /> })`
- Preview templates: `npx email dev` — opens browser preview at localhost:3000
- Supports attachments, scheduling, and batch sending

### Key Patterns
- Build email templates in /emails directory as React components
- Use Resend's domain verification for custom from addresses
- Batch API for sending to multiple recipients efficiently
- Webhook events: email.sent, email.delivered, email.bounced, email.complained

### Pitfalls
- React Email renders to HTML server-side — don't use client-only hooks
- Free tier: 3,000 emails/month, 100/day — verify limits before launch
- Domain DNS setup required for custom from addresses (not just verified email)
