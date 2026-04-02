---
id: communication-slack
name: Slack
category: communication
frameworks: ["Slack","@slack/web-api","@slack/bolt"]
dependencies: ["Slack","@slack/web-api","@slack/bolt"]
description: "Team messaging with bots, webhooks, and workflow integrations"
---

# Slack

**Category:** Communication
**Tools:** Slack, @slack/web-api, @slack/bolt

### Setup
- Install: `pnpm add @slack/bolt` (framework) or `@slack/web-api` (API client only)
- Create Slack App in api.slack.com/apps — configure bot scopes and event subscriptions
- Env vars: SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET, SLACK_APP_TOKEN (for Socket Mode)

### Architecture
- Bolt framework: `app.message('pattern', handler)`, `app.command('/cmd', handler)`
- Incoming webhooks: Simple POST to send messages to a channel (no bot needed)
- Events API: Receive events (message, reaction, member joined) via HTTP or Socket Mode
- Block Kit: Rich message layouts with interactive components

### Key Patterns
- Use Socket Mode for development — no public URL needed
- Block Kit Builder (app.slack.com/block-kit-builder) to design rich messages
- Slash commands for user-initiated actions: `/deploy`, `/status`
- Schedule messages: `chat.scheduleMessage` for delayed notifications

### Pitfalls
- Bot tokens are channel-specific — bot must be invited to channels to post
- Event subscriptions require URL verification (challenge response)
- Rate limits: 1 message per second per channel — queue messages for bulk sending
