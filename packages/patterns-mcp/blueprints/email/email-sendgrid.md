---
id: email-sendgrid
name: SendGrid
category: email
frameworks: ["SendGrid","@sendgrid/mail"]
dependencies: ["SendGrid","@sendgrid/mail"]
description: "Scalable email delivery with templates and analytics"
---

# SendGrid

**Category:** Email
**Tools:** SendGrid, @sendgrid/mail

### Setup
- Install: `pnpm add @sendgrid/mail`
- Env vars: SENDGRID_API_KEY, SENDGRID_FROM_EMAIL

### Architecture
- Use SendGrid Dynamic Templates for transactional emails (welcome, reset password, receipts)
- Create templates in SendGrid Dashboard with Handlebars variables
- API: `sgMail.send({ to, from, templateId, dynamicTemplateData })`
- Inbound Parse: Route incoming emails to your webhook for reply handling

### Key Patterns
- Use template IDs, not inline HTML — keeps email design out of code
- Batch sending: `sgMail.sendMultiple()` for bulk transactional emails
- Set up domain authentication (SPF, DKIM) for deliverability
- Use categories and custom_args for email analytics tracking

### Pitfalls
- Free tier: 100 emails/day — insufficient for production
- Always set reply-to address separately from the from address
- Implement exponential backoff for 429 rate limit responses
