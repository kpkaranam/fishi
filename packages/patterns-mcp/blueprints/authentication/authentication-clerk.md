---
id: authentication-clerk
name: Clerk
category: authentication
frameworks: ["Clerk","@clerk/nextjs","@clerk/clerk-react"]
dependencies: ["Clerk","@clerk/nextjs","@clerk/clerk-react"]
description: "Modern authentication with prebuilt UI components and user management"
---

# Clerk

**Category:** Authentication
**Tools:** Clerk, @clerk/nextjs, @clerk/clerk-react

### Setup
- Install: `pnpm add @clerk/nextjs` (Next.js) or `@clerk/clerk-react` (React)
- Env vars: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY

### Architecture
- Wrap app with `<ClerkProvider>` — provides auth context to all components
- Use `<SignIn />`, `<SignUp />`, `<UserButton />` prebuilt components
- Middleware: `clerkMiddleware()` in middleware.ts protects routes automatically
- Server-side: `auth()` in Server Components, `getAuth()` in API routes
- Webhooks: POST /api/webhooks/clerk — handle user.created, user.updated events

### Key Patterns
- Use Clerk Organizations for multi-tenant apps
- Store Clerk user_id in your DB, sync via webhooks (not on every request)
- Use `auth().protect()` for role-based access in server code

### Pitfalls
- Always verify webhook signatures with svix
- Prebuilt components use Clerk's domain — configure for custom domains in production
- Free tier: 10,000 MAUs — plan for pricing at scale
