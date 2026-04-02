---
id: email-aws-ses
name: AWS SES
category: email
frameworks: ["AWS SES","@aws-sdk/client-ses"]
dependencies: ["AWS SES","@aws-sdk/client-ses"]
description: "High-volume email service with excellent deliverability"
---

# AWS SES

**Category:** Email
**Tools:** AWS SES, @aws-sdk/client-ses

### Setup
- Install: `pnpm add @aws-sdk/client-ses`
- Env vars: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, SES_FROM_EMAIL

### Architecture
- Use SES v2 API via @aws-sdk/client-sesv2 for modern interface
- Send raw emails for full control or templated emails for consistency
- Configuration sets: Group sending config (tracking, reputation, suppression)
- Receipt rules: Process incoming email (store in S3, trigger Lambda)

### Key Patterns
- Start in sandbox mode (verified recipients only), request production access early
- Use SES Templates for transactional emails — manage via API or CloudFormation
- Implement bounce/complaint handling via SNS notifications
- Use dedicated IPs for high-volume sending (reputation isolation)

### Pitfalls
- Sandbox mode is default — you can only send to verified addresses until approved
- SES charges per email ($0.10/1000) — monitor costs for high volume
- Set up DKIM, SPF, and DMARC before going to production
