---
id: storage-s3
name: AWS S3
category: storage
frameworks: ["AWS S3","@aws-sdk/client-s3","@aws-sdk/s3-request-presigner"]
dependencies: ["AWS S3","@aws-sdk/client-s3","@aws-sdk/s3-request-presigner"]
description: "Object storage with CDN integration and fine-grained access control"
---

# AWS S3

**Category:** Storage
**Tools:** AWS S3, @aws-sdk/client-s3, @aws-sdk/s3-request-presigner

### Setup
- Install: `pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`
- Env vars: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, S3_BUCKET_NAME

### Architecture
- Upload flow: Client requests presigned URL → uploads directly to S3 → webhook/callback
- Server-side: Generate presigned URLs with expiration for secure uploads/downloads
- CDN: CloudFront distribution in front of S3 for global performance
- Lifecycle rules: Auto-archive to Glacier, auto-delete temporary files

### Key Patterns
- Use presigned URLs for direct client upload — avoids routing files through your server
- Organize keys with prefixes: `users/{userId}/avatars/{filename}`
- Use S3 event notifications (SNS/SQS/Lambda) for post-upload processing
- Enable versioning for critical files, lifecycle rules for cost management

### Pitfalls
- S3 bucket names are globally unique — use a naming convention
- Public buckets are a security risk — use presigned URLs or CloudFront OAC
- Large file uploads: Use multipart upload for files > 100MB
