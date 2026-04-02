---
id: realtime-pusher
name: Pusher
category: realtime
frameworks: ["Pusher","pusher","pusher-js"]
dependencies: ["Pusher","pusher","pusher-js"]
description: "Hosted real-time messaging with channels and presence"
---

# Pusher

**Category:** Realtime
**Tools:** Pusher, pusher, pusher-js

### Setup
- Install: `pnpm add pusher` (server) + `pnpm add pusher-js` (client)
- Env vars: PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER, NEXT_PUBLIC_PUSHER_KEY

### Architecture
- Server: Trigger events on channels — `pusher.trigger('channel', 'event', data)`
- Client: Subscribe to channels — `pusher.subscribe('channel').bind('event', callback)`
- Channel types: Public, private (auth required), presence (who's online)
- Auth endpoint: POST /api/pusher/auth — verify user can access private/presence channels

### Key Patterns
- Use private channels for user-specific events: `private-user-{userId}`
- Presence channels for collaborative features: show online users, typing indicators
- Client events: Direct client-to-client messaging on private channels
- Batch trigger: Send to multiple channels in one API call

### Pitfalls
- Free tier: 200K messages/day, 100 concurrent connections — limited for production
- Message size limit: 10KB — compress large payloads or use S3 for file transfers
- Pusher doesn't persist messages — implement your own history/replay
