---
id: realtime-ably
name: Ably
category: realtime
frameworks: ["Ably","ably"]
dependencies: ["Ably","ably"]
description: "Enterprise real-time messaging with guaranteed delivery and history"
---

# Ably

**Category:** Realtime
**Tools:** Ably, ably

### Setup
- Install: `pnpm add ably`
- Env vars: ABLY_API_KEY, NEXT_PUBLIC_ABLY_API_KEY (publishable)

### Architecture
- Publish/subscribe: `channel.publish('event', data)` and `channel.subscribe(callback)`
- Presence: Track who's connected to a channel with automatic enter/leave
- History: Retrieve past messages from channels (configurable retention)
- Token auth: Generate short-lived tokens server-side for client authentication

### Key Patterns
- Use token authentication for client-side — never expose full API key
- Channel namespaces: `chat:room-123`, `notifications:user-456`
- Message ordering and exactly-once delivery guarantees
- Use Ably Reactor for server-side event processing (webhooks, queues, functions)

### Pitfalls
- Free tier: 6M messages/month, 200 peak connections — generous for development
- Full API key has publish+subscribe+admin — always use token auth for clients
- Message size limit: 64KB — use for signaling, not file transfer
