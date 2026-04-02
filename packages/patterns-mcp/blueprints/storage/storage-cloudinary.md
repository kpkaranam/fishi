---
id: storage-cloudinary
name: Cloudinary
category: storage
frameworks: ["Cloudinary","cloudinary","next-cloudinary"]
dependencies: ["Cloudinary","cloudinary","next-cloudinary"]
description: "Image and video management with on-the-fly transformations"
---

# Cloudinary

**Category:** Storage
**Tools:** Cloudinary, cloudinary, next-cloudinary

### Setup
- Install: `pnpm add cloudinary next-cloudinary`
- Env vars: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET

### Architecture
- Upload: Direct from client using unsigned upload presets, or server-side via SDK
- Transformations: URL-based — resize, crop, format conversion, effects on-the-fly
- Delivery: Cloudinary CDN with automatic format (WebP/AVIF) and quality optimization
- `<CldImage>` component: Next.js Image with Cloudinary transformations built-in

### Key Patterns
- Use upload presets for client-side uploads (unsigned for public, signed for private)
- URL transformations: `/image/upload/w_400,h_300,c_fill/v1234/photo.jpg`
- Use eager transformations for critical sizes (thumbnails) on upload
- Tag assets for organization and bulk operations

### Pitfalls
- Free tier: 25 credits/month — transformations consume credits quickly
- Unsigned uploads allow anyone with your cloud name to upload — set size/type limits
- Original files are stored forever unless explicitly deleted — monitor storage usage
