# Contributing Patterns to FISHI

Thanks for contributing an integration blueprint! Each pattern you add helps every Claude Code developer integrate faster.

## How Patterns Work

Each pattern is a single markdown file with YAML frontmatter. When a developer searches for "stripe" or "auth", the FISHI pattern MCP server returns your blueprint — and the AI agent uses it to implement the integration correctly on the first try.

## Quick Start

1. Copy `PATTERN-TEMPLATE.md` to `blueprints/{category}/{category}-{name}.md`
2. Fill in the frontmatter and content sections
3. Submit a PR

## Frontmatter (Required)

```yaml
---
id: payments-stripe          # {category}-{name}, kebab-case
name: Stripe Payments        # Human-readable name
category: payments           # Must match parent directory name
frameworks: [next, express]  # Frameworks this works with
dependencies: [stripe]       # npm packages required
description: "Battle-tested Stripe payment integration"
---
```

**All fields are required.** The `id` must follow `{category}-{name}` kebab-case format.

## Content Sections (Required)

Every pattern must include these sections:

1. **Setup** — Installation commands and environment variables
2. **Architecture** — How the integration fits into a project
3. **Key Patterns** — The 3-5 most important implementation patterns
4. **Pitfalls** — Common mistakes and what to avoid

## Rules

- No real API keys, secrets, or credentials — use environment variable placeholders
- Use `{ENV_VAR_NAME}` format for all secrets
- Keep blueprints under 200 lines — concise and actionable
- Test your pattern: can an AI agent implement it correctly from just this blueprint?

## Categories

Place your blueprint in the matching category directory:

| Category | Examples |
|----------|---------|
| `authentication` | Auth0, Clerk, JWT |
| `payments` | Stripe, PayPal |
| `email` | SendGrid, Resend |
| `analytics` | PostHog, Plausible |
| `database` | Prisma, Drizzle |
| `storage` | S3, Cloudinary |
| `search` | Algolia, Meilisearch |
| `vector-database` | Qdrant, Pinecone |
| `monitoring` | Sentry, Datadog |
| `ci-cd` | GitHub Actions, Docker |
| `realtime` | WebSocket, Pusher |
| `hosting` | Netlify, Vercel |

Need a new category? Create the directory and mention it in your PR.

## Validation

CI will automatically check your PR for:
- Valid YAML frontmatter with all required fields
- `id` follows `{category}-{name}` format
- No credentials or API keys in content
- All required content sections present

## Questions?

Open an issue on [GitHub](https://github.com/kpkaranam/fishi/issues).
