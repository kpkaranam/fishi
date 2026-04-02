---
id: storage-r2
name: Cloudflare R2
category: storage
frameworks: ["Cloudflare R2","@aws-sdk/client-s3","wrangler"]
dependencies: ["Cloudflare R2","@aws-sdk/client-s3","wrangler"]
description: "S3-compatible storage with zero egress fees"
---

# Cloudflare R2

**Category:** Storage
**Tools:** Cloudflare R2, @aws-sdk/client-s3, wrangler

### Setup
- Install: `pnpm add @aws-sdk/client-s3` (R2 is S3-compatible)
- Env vars: R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT, R2_BUCKET_NAME

### Architecture
- S3-compatible API: Use AWS SDK with R2 endpoint
- Workers integration: Access R2 directly from Cloudflare Workers (no SDK needed)
- Custom domains: Serve files from your domain via R2 public buckets
- Zero egress: No bandwidth charges — ideal for media-heavy applications

### Key Patterns
- Use presigned URLs for direct client uploads (same as S3)
- Workers binding for server-side: `env.MY_BUCKET.put(key, body)`
- Enable public access per-bucket for CDN-served static assets
- Use R2 lifecycle rules for automatic object expiration

### Pitfalls
- R2 doesn't support all S3 features — check compatibility for advanced operations
- No built-in image transformations — use Cloudflare Images or Workers for processing
- Public bucket URLs use r2.dev domain — configure custom domain for production
