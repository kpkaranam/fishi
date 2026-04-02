---
id: storage-supabase-storage
name: Supabase Storage
category: storage
frameworks: ["Supabase Storage","@supabase/supabase-js"]
dependencies: ["Supabase Storage","@supabase/supabase-js"]
description: "S3-compatible storage with RLS policies and CDN"
---

# Supabase Storage

**Category:** Storage
**Tools:** Supabase Storage, @supabase/supabase-js

### Setup
- Install: `pnpm add @supabase/supabase-js` (storage is built into the client)
- Env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY

### Architecture
- Buckets: Create via Dashboard or API — public (CDN) or private (signed URLs)
- Upload: `supabase.storage.from('bucket').upload(path, file)`
- Download: `supabase.storage.from('bucket').getPublicUrl(path)` or `createSignedUrl()`
- RLS: Storage policies use auth.uid() — same as database RLS

### Key Patterns
- Use public buckets for avatars/media, private buckets for documents
- Organize files: `{userId}/{category}/{filename}`
- Image transformations: `getPublicUrl(path, { transform: { width: 200 } })`
- Use `upsert: true` option to replace existing files without errors

### Pitfalls
- File size limit: 50MB default — increase via Dashboard for larger files
- Public bucket URLs are predictable — don't store sensitive files in public buckets
- RLS policies are separate from database policies — configure both
