# @qlucent/fishi-patterns

**Integration pattern marketplace for Claude Code** — 55 battle-tested blueprints via MCP server.

Stripe, Auth0, SendGrid, PostHog, Prisma, and 50 more. Search, select, and inject into your agent's context.

## Why?

Every time you ask an AI agent to "add Stripe payments," it improvises from training data. Sometimes it works. Often it doesn't. **FISHI Patterns gives agents battle-tested blueprints** — the right packages, the right architecture, the right patterns, the right pitfalls to avoid.

**Before:**
```
You: "Add Stripe payments to my Next.js app"
Agent: *spends 30 minutes hallucinating outdated API calls*
```

**After:**
```
You: "Add Stripe payments to my Next.js app"
Agent: *pulls fishi-patterns blueprint, implements correctly in 3 minutes*
```

## Quick Start (2 minutes)

```bash
# 1. Install globally
npm install -g @qlucent/fishi-patterns

# 2. Add to Claude Code MCP config (~/.claude/settings.json)
```

Add this to your Claude Code settings under `mcpServers`:

```json
{
  "mcpServers": {
    "fishi-patterns": {
      "command": "fishi-patterns",
      "args": []
    }
  }
}
```

```bash
# 3. Use in Claude Code
# The agent can now search and use patterns:
# "Search for a Stripe payment blueprint"
# "Find an auth integration for Next.js"
```

## Available Patterns (55)

| Category | Patterns |
|----------|---------|
| Authentication | Auth0, Clerk, NextAuth.js, Supabase Auth, Custom JWT |
| Payments | Stripe, PayPal, LemonSqueezy |
| Email | SendGrid, Resend, AWS SES, Mailgun |
| Analytics | PostHog, Plausible, Mixpanel, Google Analytics |
| Database | Prisma+PostgreSQL, Drizzle, Supabase, MongoDB |
| Storage | AWS S3, Cloudinary, Supabase Storage, Cloudflare R2 |
| Search | Algolia, Meilisearch, Typesense, pgvector, Elasticsearch |
| Vector Database | Qdrant, Milvus, Pinecone, Chroma |
| Monitoring | Sentry, LogRocket, Datadog |
| CI/CD | GitHub Actions, Vercel, Docker, Railway |
| Realtime | WebSocket, Pusher, Ably, Supabase Realtime |
| And more... | Project Management, Communication, E-commerce, Design, Support, Crawlers, Hosting, Domains, Cloud |

## MCP Tools

| Tool | Description |
|------|------------|
| `search(query, category?)` | Search blueprints by keyword with optional category filter |
| `info(pattern_id)` | Get full blueprint details |
| `select(pattern_id)` | Get blueprint content ready for agent injection |
| `list_categories()` | List all categories with pattern counts |
| `contribute_template()` | Get the template for contributing new patterns |

## Contributing Patterns

See [CONTRIBUTING.md](CONTRIBUTING.md) — add your own integration blueprints!

## Works With

- **Any Claude Code project** — standalone MCP server
- **Ruflo, BMAD, Oh-My-ClaudeCode** — no conflicts
- **Full FISHI framework** — complementary, not required
- **Automated pipelines** — programmatic MCP access, no human interaction needed

## License

MIT
