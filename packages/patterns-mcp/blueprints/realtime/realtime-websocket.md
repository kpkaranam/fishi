---
id: realtime-websocket
name: WebSocket
category: realtime
frameworks: ["WebSocket","ws","socket.io"]
dependencies: ["WebSocket","ws","socket.io"]
description: "Native WebSocket implementation for custom real-time communication"
---

# WebSocket

**Category:** Realtime
**Tools:** WebSocket, ws, socket.io

### Setup
- Install: `pnpm add ws` (server) or `pnpm add socket.io socket.io-client` (full framework)
- Native WebSocket API available in browsers — no client package needed for basic use

### Architecture
- Server: Create WebSocket server alongside HTTP server on same port
- Rooms/channels: Implement pub/sub pattern for topic-based messaging
- Protocol: Define message types as JSON: `{ type: 'chat', payload: { ... } }`
- Scaling: Use Redis adapter (socket.io-redis) for multi-server deployments

### Key Patterns
- Heartbeat/ping-pong: Detect stale connections and auto-reconnect
- Authentication: Verify JWT on connection upgrade, attach user to socket
- Rate limiting: Implement per-connection message rate limits
- Binary data: Use ArrayBuffer for file transfer, JSON for structured messages

### Pitfalls
- Serverless platforms don't support persistent WebSocket connections — use Pusher/Ably
- Connection limits: Typical server handles ~10K concurrent connections
- Always handle reconnection logic on client — connections drop frequently on mobile
