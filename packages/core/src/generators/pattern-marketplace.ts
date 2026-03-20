import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

export interface Pattern {
  id: string;
  name: string;
  category: string;
  description: string;
  tools: string[];
  guide: string;
}

export interface PatternCategory {
  id: string;
  name: string;
  description: string;
  patterns: Pattern[];
}

export interface SelectedPatterns {
  patterns: string[];
  savedAt: string;
}

const PATTERN_CATEGORIES: PatternCategory[] = [
  // 1. Authentication
  {
    id: 'authentication',
    name: 'Authentication',
    description: 'User authentication and identity management solutions',
    patterns: [
      {
        id: 'auth0',
        name: 'Auth0',
        category: 'authentication',
        description: 'Enterprise-grade identity platform with SSO, MFA, and social login',
        tools: ['Auth0', 'auth0-nextjs', 'auth0-spa-js'],
        guide: `### Setup
- Install: \`pnpm add @auth0/nextjs-auth0\` (Next.js) or \`@auth0/auth0-spa-js\` (SPA)
- Env vars: AUTH0_SECRET, AUTH0_BASE_URL, AUTH0_ISSUER_BASE_URL, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET

### Architecture
- Use Auth0 Universal Login for authentication flows — avoid custom login forms
- Server-side: \`handleAuth()\` creates /api/auth/* routes (login, logout, callback, me)
- Middleware: \`withMiddlewareAuthRequired\` to protect routes at the edge
- Client-side: \`useUser()\` hook for user state, \`withPageAuthRequired\` for page protection
- Store Auth0 user_id in your database users table for linking

### Key Patterns
- Use Auth0 Actions for post-login hooks (sync user to DB, add custom claims)
- Configure RBAC in Auth0 Dashboard — add roles/permissions as JWT claims
- Use refresh token rotation for long-lived sessions

### Pitfalls
- Never validate JWTs manually — use the SDK's built-in verification
- Set allowed callback URLs in Auth0 Dashboard for every environment
- Auth0 rate limits: 300 requests/min for Management API`,
      },
      {
        id: 'clerk',
        name: 'Clerk',
        category: 'authentication',
        description: 'Modern authentication with prebuilt UI components and user management',
        tools: ['Clerk', '@clerk/nextjs', '@clerk/clerk-react'],
        guide: `### Setup
- Install: \`pnpm add @clerk/nextjs\` (Next.js) or \`@clerk/clerk-react\` (React)
- Env vars: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY

### Architecture
- Wrap app with \`<ClerkProvider>\` — provides auth context to all components
- Use \`<SignIn />\`, \`<SignUp />\`, \`<UserButton />\` prebuilt components
- Middleware: \`clerkMiddleware()\` in middleware.ts protects routes automatically
- Server-side: \`auth()\` in Server Components, \`getAuth()\` in API routes
- Webhooks: POST /api/webhooks/clerk — handle user.created, user.updated events

### Key Patterns
- Use Clerk Organizations for multi-tenant apps
- Store Clerk user_id in your DB, sync via webhooks (not on every request)
- Use \`auth().protect()\` for role-based access in server code

### Pitfalls
- Always verify webhook signatures with svix
- Prebuilt components use Clerk's domain — configure for custom domains in production
- Free tier: 10,000 MAUs — plan for pricing at scale`,
      },
      {
        id: 'nextauth',
        name: 'NextAuth.js',
        category: 'authentication',
        description: 'Open-source authentication for Next.js with 50+ providers',
        tools: ['NextAuth.js', 'next-auth', 'Auth.js'],
        guide: `### Setup
- Install: \`pnpm add next-auth\` (v4) or \`pnpm add next-auth@beta\` (v5/Auth.js)
- Env vars: NEXTAUTH_SECRET, NEXTAUTH_URL, provider-specific client IDs/secrets

### Architecture
- API Route: /api/auth/[...nextauth] — handles all auth flows
- Configure providers in auth config: Google, GitHub, Credentials, Email, etc.
- Database adapter: Prisma, Drizzle, or Supabase for session/user persistence
- Client: \`useSession()\` hook, \`<SessionProvider>\` wrapper
- Server: \`getServerSession()\` in API routes, \`auth()\` in v5

### Key Patterns
- Use JWT strategy for serverless, database strategy for traditional servers
- Extend session with custom fields via callbacks.session and callbacks.jwt
- Use middleware matcher for route protection (v5)

### Pitfalls
- NEXTAUTH_SECRET must be set in production — generate with \`openssl rand -base64 32\`
- Credentials provider doesn't support session persistence without a database adapter
- v4 to v5 migration: significant API changes — check migration guide`,
      },
      {
        id: 'supabase-auth',
        name: 'Supabase Auth',
        category: 'authentication',
        description: 'PostgreSQL-backed auth with Row Level Security integration',
        tools: ['Supabase', '@supabase/supabase-js', '@supabase/auth-helpers-nextjs'],
        guide: `### Setup
- Install: \`pnpm add @supabase/supabase-js @supabase/ssr\`
- Env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY

### Architecture
- Auth is built into Supabase — no separate service needed
- Client-side: \`supabase.auth.signInWithOAuth()\`, \`signInWithPassword()\`
- Server-side: Create server client with cookie-based sessions
- RLS: auth.uid() in PostgreSQL policies ties data access to authenticated user
- Middleware: Refresh sessions on every request with \`updateSession()\`

### Key Patterns
- Enable RLS on all tables — use \`auth.uid() = user_id\` policies
- Use Supabase Edge Functions for server-side auth logic
- Configure OAuth providers in Supabase Dashboard > Authentication > Providers
- Use auth.users table — don't create a separate users table for auth data

### Pitfalls
- Anon key is public but RLS must be enabled — without RLS, data is exposed
- Cookie-based auth requires middleware setup for server components
- Email confirmation enabled by default — disable in dev for faster iteration`,
      },
      {
        id: 'custom-jwt',
        name: 'Custom JWT',
        category: 'authentication',
        description: 'Roll your own JWT-based auth for full control',
        tools: ['jsonwebtoken', 'jose', 'bcrypt'],
        guide: `### Setup
- Install: \`pnpm add jose bcryptjs\` (jose for Edge-compatible JWT)
- Env vars: JWT_SECRET (min 256-bit), JWT_EXPIRES_IN

### Architecture
- Auth endpoints: POST /api/auth/register, /api/auth/login, /api/auth/refresh
- Hash passwords with bcrypt (cost factor 12+), store in users table
- Issue short-lived access tokens (15min) + long-lived refresh tokens (7d)
- Store refresh tokens in httpOnly cookies, access tokens in memory (not localStorage)
- Middleware: Verify JWT on every protected request, extract user claims

### Key Patterns
- Use RS256 (asymmetric) for microservices, HS256 (symmetric) for monoliths
- Implement token rotation: new refresh token on each refresh, invalidate old one
- Add jti (JWT ID) claim for token revocation support
- Include minimal claims: sub, role, iat, exp — not sensitive data

### Pitfalls
- Never store JWTs in localStorage — XSS vulnerable. Use httpOnly cookies
- Implement refresh token reuse detection (if reused, revoke all family)
- jose library works in Edge runtimes; jsonwebtoken does not`,
      },
    ],
  },

  // 2. Payments
  {
    id: 'payments',
    name: 'Payments',
    description: 'Payment processing and subscription management',
    patterns: [
      {
        id: 'stripe',
        name: 'Stripe',
        category: 'payments',
        description: 'Full-featured payment platform with subscriptions, invoicing, and Connect',
        tools: ['Stripe', 'stripe', '@stripe/stripe-js'],
        guide: `### Setup
- Install: \`pnpm add stripe @stripe/stripe-js\`
- Env vars: STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET

### Architecture
- Server-side: Create checkout sessions, manage subscriptions via Stripe API
- Client-side: Use @stripe/stripe-js for Elements (card input, payment form)
- Webhooks: POST /api/webhooks/stripe — verify signature, handle checkout.session.completed, invoice.paid, customer.subscription.updated
- Store customer_id and subscription_id in your users table

### Key Patterns
- Always verify webhook signatures with stripe.webhooks.constructEvent()
- Use Stripe Customer Portal for self-service billing management
- Implement idempotency keys for payment operations
- Handle subscription states: active, past_due, canceled, trialing

### Pitfalls
- Never expose STRIPE_SECRET_KEY to client
- Always handle webhook retries (idempotent handlers)
- Test with Stripe CLI: \`stripe listen --forward-to localhost:3000/api/webhooks/stripe\``,
      },
      {
        id: 'paypal',
        name: 'PayPal',
        category: 'payments',
        description: 'Global payment platform with buyer protection and Express Checkout',
        tools: ['PayPal', '@paypal/react-paypal-js', 'paypal-rest-sdk'],
        guide: `### Setup
- Install: \`pnpm add @paypal/react-paypal-js @paypal/paypal-js\`
- Env vars: PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_WEBHOOK_ID

### Architecture
- Client-side: \`<PayPalScriptProvider>\` + \`<PayPalButtons>\` for checkout UI
- Server-side: Create orders via PayPal REST API, capture payments on approval
- Flow: createOrder → buyer approves → onApprove → captureOrder on server
- Webhooks: PAYMENT.CAPTURE.COMPLETED, BILLING.SUBSCRIPTION.ACTIVATED

### Key Patterns
- Use PayPal Smart Buttons — auto-detect buyer's preferred payment method
- Implement both one-time payments and subscriptions (PayPal Billing Plans)
- Store PayPal order_id and subscription_id in your database
- Use sandbox environment for development (separate sandbox credentials)

### Pitfalls
- PayPal SDK is loaded externally — handle script loading states
- Always capture payments server-side, never trust client-side confirmation alone
- Webhook verification requires PayPal's certificate chain validation`,
      },
      {
        id: 'lemonsqueezy',
        name: 'LemonSqueezy',
        category: 'payments',
        description: 'Merchant of record — handles tax, billing, and compliance for digital products',
        tools: ['LemonSqueezy', '@lemonsqueezy/lemonsqueezy.js'],
        guide: `### Setup
- Install: \`pnpm add @lemonsqueezy/lemonsqueezy.js\`
- Env vars: LEMONSQUEEZY_API_KEY, LEMONSQUEEZY_STORE_ID, LEMONSQUEEZY_WEBHOOK_SECRET

### Architecture
- LemonSqueezy is the merchant of record — they handle tax, VAT, and compliance
- Create products/variants in LemonSqueezy Dashboard, reference by ID in your app
- Checkout: Generate checkout URLs via API, redirect users to LemonSqueezy-hosted page
- Webhooks: order_created, subscription_created, subscription_updated, license_key_created

### Key Patterns
- Use checkout overlays for in-app purchase experience (no redirect)
- Map LemonSqueezy customer_id to your user_id via webhook on first purchase
- License keys for desktop/CLI apps — validate via API
- Use test mode for development (separate test API key)

### Pitfalls
- As merchant of record, LemonSqueezy receives funds first, then pays you — expect delay
- Webhook payload structure differs from Stripe — use their SDK for type safety
- No direct card element integration — checkout is always LemonSqueezy-hosted or overlay`,
      },
    ],
  },

  // 3. Email
  {
    id: 'email',
    name: 'Email',
    description: 'Transactional and marketing email delivery',
    patterns: [
      {
        id: 'sendgrid',
        name: 'SendGrid',
        category: 'email',
        description: 'Scalable email delivery with templates and analytics',
        tools: ['SendGrid', '@sendgrid/mail'],
        guide: `### Setup
- Install: \`pnpm add @sendgrid/mail\`
- Env vars: SENDGRID_API_KEY, SENDGRID_FROM_EMAIL

### Architecture
- Use SendGrid Dynamic Templates for transactional emails (welcome, reset password, receipts)
- Create templates in SendGrid Dashboard with Handlebars variables
- API: \`sgMail.send({ to, from, templateId, dynamicTemplateData })\`
- Inbound Parse: Route incoming emails to your webhook for reply handling

### Key Patterns
- Use template IDs, not inline HTML — keeps email design out of code
- Batch sending: \`sgMail.sendMultiple()\` for bulk transactional emails
- Set up domain authentication (SPF, DKIM) for deliverability
- Use categories and custom_args for email analytics tracking

### Pitfalls
- Free tier: 100 emails/day — insufficient for production
- Always set reply-to address separately from the from address
- Implement exponential backoff for 429 rate limit responses`,
      },
      {
        id: 'resend',
        name: 'Resend',
        category: 'email',
        description: 'Modern email API built for developers with React Email support',
        tools: ['Resend', 'resend', 'react-email'],
        guide: `### Setup
- Install: \`pnpm add resend\` + \`pnpm add react-email @react-email/components -D\`
- Env vars: RESEND_API_KEY, RESEND_FROM_EMAIL

### Architecture
- Write email templates as React components using @react-email/components
- Send: \`resend.emails.send({ from, to, subject, react: <WelcomeEmail /> })\`
- Preview templates: \`npx email dev\` — opens browser preview at localhost:3000
- Supports attachments, scheduling, and batch sending

### Key Patterns
- Build email templates in /emails directory as React components
- Use Resend's domain verification for custom from addresses
- Batch API for sending to multiple recipients efficiently
- Webhook events: email.sent, email.delivered, email.bounced, email.complained

### Pitfalls
- React Email renders to HTML server-side — don't use client-only hooks
- Free tier: 3,000 emails/month, 100/day — verify limits before launch
- Domain DNS setup required for custom from addresses (not just verified email)`,
      },
      {
        id: 'aws-ses',
        name: 'AWS SES',
        category: 'email',
        description: 'High-volume email service with excellent deliverability',
        tools: ['AWS SES', '@aws-sdk/client-ses'],
        guide: `### Setup
- Install: \`pnpm add @aws-sdk/client-ses\`
- Env vars: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, SES_FROM_EMAIL

### Architecture
- Use SES v2 API via @aws-sdk/client-sesv2 for modern interface
- Send raw emails for full control or templated emails for consistency
- Configuration sets: Group sending config (tracking, reputation, suppression)
- Receipt rules: Process incoming email (store in S3, trigger Lambda)

### Key Patterns
- Start in sandbox mode (verified recipients only), request production access early
- Use SES Templates for transactional emails — manage via API or CloudFormation
- Implement bounce/complaint handling via SNS notifications
- Use dedicated IPs for high-volume sending (reputation isolation)

### Pitfalls
- Sandbox mode is default — you can only send to verified addresses until approved
- SES charges per email ($0.10/1000) — monitor costs for high volume
- Set up DKIM, SPF, and DMARC before going to production`,
      },
      {
        id: 'mailgun',
        name: 'Mailgun',
        category: 'email',
        description: 'Email API with powerful routing, validation, and analytics',
        tools: ['Mailgun', 'mailgun.js', 'form-data'],
        guide: `### Setup
- Install: \`pnpm add mailgun.js form-data\`
- Env vars: MAILGUN_API_KEY, MAILGUN_DOMAIN, MAILGUN_FROM_EMAIL

### Architecture
- Initialize: \`new Mailgun(formData).client({ username: 'api', key })\`
- Send: \`mg.messages.create(domain, { from, to, subject, html })\`
- Routes: Define inbound email routing rules (forward, store, webhook)
- Templates: Manage via API or Mailgun Dashboard with Handlebars

### Key Patterns
- Use Mailgun's email validation API to verify addresses before sending
- Mailing lists for group communications and marketing
- Tags for categorizing and tracking email campaigns
- Webhooks for delivery events: delivered, opened, clicked, bounced

### Pitfalls
- API key has two types: primary (full access) and sending (limited) — use sending key in app
- Free tier: 100 emails/day for first 3 months — plan accordingly
- EU region requires different API endpoint (api.eu.mailgun.net)`,
      },
    ],
  },

  // 4. Analytics
  {
    id: 'analytics',
    name: 'Analytics',
    description: 'Product analytics, user behavior tracking, and insights',
    patterns: [
      {
        id: 'posthog',
        name: 'PostHog',
        category: 'analytics',
        description: 'Open-source product analytics with session recording and feature flags',
        tools: ['PostHog', 'posthog-js', 'posthog-node'],
        guide: `### Setup
- Install: \`pnpm add posthog-js\` (client) + \`pnpm add posthog-node\` (server)
- Env vars: NEXT_PUBLIC_POSTHOG_KEY, NEXT_PUBLIC_POSTHOG_HOST

### Architecture
- Client: Initialize PostHog in app layout, auto-captures pageviews and clicks
- Server: Use posthog-node for server-side event tracking and feature flags
- Feature flags: Evaluate server-side for SSR, client-side for interactive UI
- Session recording: Automatic with posthog-js, configure sampling rate

### Key Patterns
- Use \`posthog.capture('event_name', { properties })\` for custom events
- Feature flags: \`posthog.isFeatureEnabled('flag-name')\` with fallback values
- Group analytics: \`posthog.group('company', company_id)\` for B2B
- Use PostHog Toolbar for no-code event creation (click-to-track)

### Pitfalls
- Self-hosted PostHog requires significant infrastructure — start with Cloud
- Client-side capture sends data on page unload — some events may be lost
- Ad blockers block PostHog by default — consider reverse proxy setup`,
      },
      {
        id: 'plausible',
        name: 'Plausible',
        category: 'analytics',
        description: 'Privacy-friendly, lightweight analytics — no cookies, GDPR compliant',
        tools: ['Plausible', 'next-plausible', 'plausible-tracker'],
        guide: `### Setup
- Install: \`pnpm add next-plausible\` (Next.js) or add script tag manually
- Env vars: NEXT_PUBLIC_PLAUSIBLE_DOMAIN

### Architecture
- Script-based: Add Plausible script to document head — auto-tracks pageviews
- Next.js: \`<PlausibleProvider domain="...">\` in layout
- Custom events: \`plausible('Signup', { props: { plan: 'pro' } })\`
- API: Query stats programmatically via Plausible Stats API

### Key Patterns
- Goal conversions: Define in Plausible Dashboard, track with custom events
- Custom properties: Add metadata to events for segmentation
- Self-hosting: Plausible Community Edition on your own server for full control
- Use 404 tracking with custom events for broken link detection

### Pitfalls
- No session recording or heatmaps — Plausible is pageview/event analytics only
- Custom properties limited to string values
- Self-hosted requires ClickHouse — resource-intensive for small teams`,
      },
      {
        id: 'mixpanel',
        name: 'Mixpanel',
        category: 'analytics',
        description: 'Advanced product analytics with funnels, cohorts, and A/B testing',
        tools: ['Mixpanel', 'mixpanel-browser', 'mixpanel'],
        guide: `### Setup
- Install: \`pnpm add mixpanel-browser\` (client) + \`pnpm add mixpanel\` (server)
- Env vars: NEXT_PUBLIC_MIXPANEL_TOKEN

### Architecture
- Client: \`mixpanel.init(token)\` in app layout, track events with \`mixpanel.track()\`
- Server: Use mixpanel Node SDK for backend events (payments, signups)
- Identity: \`mixpanel.identify(user_id)\` after login, \`mixpanel.alias()\` on signup
- User profiles: \`mixpanel.people.set({ plan, company })\` for segmentation

### Key Patterns
- Define funnels in Mixpanel for conversion analysis (signup → activate → pay)
- Use super properties for persistent event metadata: \`mixpanel.register({ plan })\`
- Cohort analysis for retention tracking
- Use Mixpanel's Warehouse Connectors for raw data export

### Pitfalls
- Identity management is critical — incorrect alias/identify calls corrupt user data
- Free tier: 20M events/month — generous but watch for event volume
- Don't track PII in event properties — use user profiles instead`,
      },
      {
        id: 'google-analytics',
        name: 'Google Analytics',
        category: 'analytics',
        description: 'Industry-standard web analytics with GA4 event-based model',
        tools: ['Google Analytics', '@next/third-parties', 'gtag.js'],
        guide: `### Setup
- Install: \`pnpm add @next/third-parties\` (Next.js) or add gtag.js script
- Env vars: NEXT_PUBLIC_GA_MEASUREMENT_ID (G-XXXXXXXXXX)

### Architecture
- Next.js: \`<GoogleAnalytics gaId="G-..." />\` in layout — auto-tracks pageviews
- Custom events: \`gtag('event', 'purchase', { value: 29.99, currency: 'USD' })\`
- Ecommerce: Enhanced ecommerce events (view_item, add_to_cart, purchase)
- Server-side: Measurement Protocol for backend event tracking

### Key Patterns
- Use GA4 recommended events for automatic reporting (sign_up, login, purchase)
- Configure conversions in GA4 Dashboard for key business events
- Use UTM parameters for campaign attribution tracking
- BigQuery export for raw event data analysis

### Pitfalls
- GA4 is event-based (not session-based like UA) — different mental model
- Data processing delay: up to 24-48 hours for some reports
- Cookie consent required in EU — implement consent mode for GDPR compliance`,
      },
    ],
  },

  // 5. Database
  {
    id: 'database',
    name: 'Database',
    description: 'Database ORMs and managed database services',
    patterns: [
      {
        id: 'prisma-postgresql',
        name: 'Prisma + PostgreSQL',
        category: 'database',
        description: 'Type-safe ORM with auto-generated client and migrations',
        tools: ['Prisma', 'PostgreSQL', '@prisma/client'],
        guide: `### Setup
- Install: \`pnpm add prisma -D && pnpm add @prisma/client\`
- Init: \`npx prisma init\` — creates prisma/schema.prisma
- Env vars: DATABASE_URL (postgresql://user:pass@host:5432/db)

### Architecture
- Schema-first: Define models in schema.prisma, generate client with \`npx prisma generate\`
- Migrations: \`npx prisma migrate dev\` for development, \`migrate deploy\` for production
- Client: Singleton pattern — create one PrismaClient instance, reuse across requests
- Relations: Use Prisma's relation fields for type-safe joins and nested queries

### Key Patterns
- Use \`prisma.$transaction()\` for multi-step operations
- Soft deletes: Add deletedAt field, use middleware to filter automatically
- Use \`prisma db seed\` for development/test data
- Index frequently queried fields with \`@@index\` in schema

### Pitfalls
- PrismaClient in serverless: Use connection pooling (PgBouncer or Prisma Accelerate)
- Hot reload creates multiple clients — use global singleton pattern in dev
- N+1 queries: Use \`include\` or \`select\` to eager-load relations`,
      },
      {
        id: 'drizzle',
        name: 'Drizzle ORM',
        category: 'database',
        description: 'Lightweight TypeScript ORM with SQL-like syntax and zero overhead',
        tools: ['Drizzle', 'drizzle-orm', 'drizzle-kit'],
        guide: `### Setup
- Install: \`pnpm add drizzle-orm postgres\` + \`pnpm add drizzle-kit -D\`
- Create schema in src/db/schema.ts using Drizzle table builders
- Env vars: DATABASE_URL

### Architecture
- Schema-as-code: Define tables with \`pgTable()\`, columns as TypeScript
- Queries: SQL-like syntax — \`db.select().from(users).where(eq(users.id, id))\`
- Migrations: \`npx drizzle-kit generate\` then \`npx drizzle-kit migrate\`
- Relational queries: \`db.query.users.findMany({ with: { posts: true } })\`

### Key Patterns
- Use \`drizzle-zod\` to generate Zod schemas from Drizzle tables
- Prepared statements for performance: \`db.select().from(users).prepare('getUsers')\`
- Use \`db.transaction(async (tx) => { ... })\` for atomic operations
- Drizzle Studio: \`npx drizzle-kit studio\` for database browsing

### Pitfalls
- Drizzle is SQL-first — if you prefer object-oriented, use Prisma instead
- No auto-migration like Prisma — you must generate and review migration files
- Connection pooling still needed for serverless (use @neondatabase/serverless or pg-pool)`,
      },
      {
        id: 'supabase-db',
        name: 'Supabase Database',
        category: 'database',
        description: 'Managed PostgreSQL with auto-generated REST and realtime APIs',
        tools: ['Supabase', '@supabase/supabase-js', 'PostgreSQL'],
        guide: `### Setup
- Install: \`pnpm add @supabase/supabase-js\`
- Env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

### Architecture
- Auto-generated REST API: \`supabase.from('users').select('*')\` — no ORM needed
- Realtime: Subscribe to database changes with \`supabase.channel().on('postgres_changes', ...)\`
- RLS: Row Level Security policies control data access per-user
- Edge Functions: Server-side logic in Deno, deployed on Supabase infrastructure

### Key Patterns
- Use RLS policies on every table — anon key is public, RLS is your access control
- Service role key bypasses RLS — only use server-side, never expose to client
- Use database functions for complex queries and business logic
- Supabase CLI for local development: \`supabase start\`

### Pitfalls
- Anon key without RLS = public database — always enable RLS
- Supabase client caches auth state — create separate clients for different auth contexts
- Free tier: 500MB database, 2 projects — plan for paid tier in production`,
      },
      {
        id: 'mongodb',
        name: 'MongoDB',
        category: 'database',
        description: 'Document database with flexible schema and Atlas managed service',
        tools: ['MongoDB', 'mongoose', 'mongodb'],
        guide: `### Setup
- Install: \`pnpm add mongoose\` (ODM) or \`pnpm add mongodb\` (native driver)
- Env vars: MONGODB_URI (mongodb+srv://user:pass@cluster.mongodb.net/db)

### Architecture
- Mongoose: Define schemas with validation, middleware, virtuals, and methods
- Native driver: Direct MongoDB queries for maximum flexibility
- Atlas: Managed service with built-in search, serverless, and edge functions
- Aggregation pipeline for complex queries and data transformations

### Key Patterns
- Design schemas for your access patterns — denormalize for read performance
- Use Mongoose middleware (pre/post hooks) for validation and side effects
- Indexes: Create compound indexes for common query patterns
- Use MongoDB Atlas Search for full-text search capabilities

### Pitfalls
- No joins — use embedding or $lookup (expensive). Design for denormalized reads
- Mongoose models are cached — use \`mongoose.models.User || mongoose.model('User', schema)\`
- ObjectId comparison requires .toString() or .equals() — not ===`,
      },
    ],
  },

  // 6. Storage
  {
    id: 'storage',
    name: 'Storage',
    description: 'File and media storage solutions',
    patterns: [
      {
        id: 's3',
        name: 'AWS S3',
        category: 'storage',
        description: 'Object storage with CDN integration and fine-grained access control',
        tools: ['AWS S3', '@aws-sdk/client-s3', '@aws-sdk/s3-request-presigner'],
        guide: `### Setup
- Install: \`pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner\`
- Env vars: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, S3_BUCKET_NAME

### Architecture
- Upload flow: Client requests presigned URL → uploads directly to S3 → webhook/callback
- Server-side: Generate presigned URLs with expiration for secure uploads/downloads
- CDN: CloudFront distribution in front of S3 for global performance
- Lifecycle rules: Auto-archive to Glacier, auto-delete temporary files

### Key Patterns
- Use presigned URLs for direct client upload — avoids routing files through your server
- Organize keys with prefixes: \`users/{userId}/avatars/{filename}\`
- Use S3 event notifications (SNS/SQS/Lambda) for post-upload processing
- Enable versioning for critical files, lifecycle rules for cost management

### Pitfalls
- S3 bucket names are globally unique — use a naming convention
- Public buckets are a security risk — use presigned URLs or CloudFront OAC
- Large file uploads: Use multipart upload for files > 100MB`,
      },
      {
        id: 'cloudinary',
        name: 'Cloudinary',
        category: 'storage',
        description: 'Image and video management with on-the-fly transformations',
        tools: ['Cloudinary', 'cloudinary', 'next-cloudinary'],
        guide: `### Setup
- Install: \`pnpm add cloudinary next-cloudinary\`
- Env vars: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET

### Architecture
- Upload: Direct from client using unsigned upload presets, or server-side via SDK
- Transformations: URL-based — resize, crop, format conversion, effects on-the-fly
- Delivery: Cloudinary CDN with automatic format (WebP/AVIF) and quality optimization
- \`<CldImage>\` component: Next.js Image with Cloudinary transformations built-in

### Key Patterns
- Use upload presets for client-side uploads (unsigned for public, signed for private)
- URL transformations: \`/image/upload/w_400,h_300,c_fill/v1234/photo.jpg\`
- Use eager transformations for critical sizes (thumbnails) on upload
- Tag assets for organization and bulk operations

### Pitfalls
- Free tier: 25 credits/month — transformations consume credits quickly
- Unsigned uploads allow anyone with your cloud name to upload — set size/type limits
- Original files are stored forever unless explicitly deleted — monitor storage usage`,
      },
      {
        id: 'supabase-storage',
        name: 'Supabase Storage',
        category: 'storage',
        description: 'S3-compatible storage with RLS policies and CDN',
        tools: ['Supabase Storage', '@supabase/supabase-js'],
        guide: `### Setup
- Install: \`pnpm add @supabase/supabase-js\` (storage is built into the client)
- Env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY

### Architecture
- Buckets: Create via Dashboard or API — public (CDN) or private (signed URLs)
- Upload: \`supabase.storage.from('bucket').upload(path, file)\`
- Download: \`supabase.storage.from('bucket').getPublicUrl(path)\` or \`createSignedUrl()\`
- RLS: Storage policies use auth.uid() — same as database RLS

### Key Patterns
- Use public buckets for avatars/media, private buckets for documents
- Organize files: \`{userId}/{category}/{filename}\`
- Image transformations: \`getPublicUrl(path, { transform: { width: 200 } })\`
- Use \`upsert: true\` option to replace existing files without errors

### Pitfalls
- File size limit: 50MB default — increase via Dashboard for larger files
- Public bucket URLs are predictable — don't store sensitive files in public buckets
- RLS policies are separate from database policies — configure both`,
      },
      {
        id: 'r2',
        name: 'Cloudflare R2',
        category: 'storage',
        description: 'S3-compatible storage with zero egress fees',
        tools: ['Cloudflare R2', '@aws-sdk/client-s3', 'wrangler'],
        guide: `### Setup
- Install: \`pnpm add @aws-sdk/client-s3\` (R2 is S3-compatible)
- Env vars: R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT, R2_BUCKET_NAME

### Architecture
- S3-compatible API: Use AWS SDK with R2 endpoint
- Workers integration: Access R2 directly from Cloudflare Workers (no SDK needed)
- Custom domains: Serve files from your domain via R2 public buckets
- Zero egress: No bandwidth charges — ideal for media-heavy applications

### Key Patterns
- Use presigned URLs for direct client uploads (same as S3)
- Workers binding for server-side: \`env.MY_BUCKET.put(key, body)\`
- Enable public access per-bucket for CDN-served static assets
- Use R2 lifecycle rules for automatic object expiration

### Pitfalls
- R2 doesn't support all S3 features — check compatibility for advanced operations
- No built-in image transformations — use Cloudflare Images or Workers for processing
- Public bucket URLs use r2.dev domain — configure custom domain for production`,
      },
    ],
  },

  // 7. Search
  {
    id: 'search',
    name: 'Search',
    description: 'Full-text search and search-as-a-service solutions',
    patterns: [
      {
        id: 'algolia',
        name: 'Algolia',
        category: 'search',
        description: 'Hosted search with typo tolerance, faceting, and instant results',
        tools: ['Algolia', 'algoliasearch', 'react-instantsearch'],
        guide: `### Setup
- Install: \`pnpm add algoliasearch react-instantsearch\`
- Env vars: NEXT_PUBLIC_ALGOLIA_APP_ID, NEXT_PUBLIC_ALGOLIA_SEARCH_KEY, ALGOLIA_ADMIN_KEY

### Architecture
- Index data: Push records to Algolia using admin API (server-side only)
- Search: Client-side with react-instantsearch widgets or algoliasearch client
- Sync strategy: Webhook on data change → update Algolia index
- Widgets: \`<InstantSearch>\`, \`<SearchBox>\`, \`<Hits>\`, \`<RefinementList>\`

### Key Patterns
- Use searchable attributes ranking to prioritize title > description > content
- Configure facets for filtering (category, price range, tags)
- Use Algolia's query rules for merchandising and custom result boosting
- Implement "search as you type" with debounced queries

### Pitfalls
- Search-only API key is public — admin key must never be exposed to client
- Keep index in sync with database — stale data degrades search experience
- Free tier: 10,000 search requests/month — monitor usage closely`,
      },
      {
        id: 'meilisearch',
        name: 'Meilisearch',
        category: 'search',
        description: 'Open-source, fast search engine with typo tolerance and easy setup',
        tools: ['Meilisearch', 'meilisearch'],
        guide: `### Setup
- Install: \`pnpm add meilisearch\`
- Run: \`docker run -p 7700:7700 getmeili/meilisearch\` or use Meilisearch Cloud
- Env vars: MEILISEARCH_HOST, MEILISEARCH_API_KEY

### Architecture
- Self-hosted or Meilisearch Cloud — REST API with SDKs for all languages
- Index documents: \`client.index('products').addDocuments(products)\`
- Search: \`client.index('products').search('query', { filter, sort, limit })\`
- Filterable/sortable attributes must be configured before use

### Key Patterns
- Use \`filterableAttributes\` for faceted search (category, price, etc.)
- Typo tolerance and ranking rules are configured per-index
- Implement multi-index search for searching across different content types
- Use webhooks or CRON jobs to keep Meilisearch in sync with your database

### Pitfalls
- Meilisearch stores all data in memory — plan RAM based on dataset size
- No partial updates — re-index the full document on any change
- Self-hosted requires maintenance — use Meilisearch Cloud for production simplicity`,
      },
      {
        id: 'typesense',
        name: 'Typesense',
        category: 'search',
        description: 'Open-source, typo-tolerant search with automatic schema detection',
        tools: ['Typesense', 'typesense'],
        guide: `### Setup
- Install: \`pnpm add typesense\`
- Run: \`docker run -p 8108:8108 typesense/typesense:latest --api-key=xyz\`
- Env vars: TYPESENSE_HOST, TYPESENSE_API_KEY, TYPESENSE_PORT

### Architecture
- Define collection schema with field types and faceting configuration
- Index: \`client.collections('products').documents().create(document)\`
- Search: \`client.collections('products').documents().search(searchParameters)\`
- Curation: Pin/hide specific results for marketing queries

### Key Patterns
- Use \`query_by\` to specify which fields to search across
- Faceting: \`facet_by: 'category,brand'\` for filter panels
- Geo search: Add \`geopoint\` fields for location-based search
- Use scoped API keys for client-side search (restrict to specific collections)

### Pitfalls
- Collection schema must be defined upfront — auto-schema detection is limited
- All data must fit in RAM — not suitable for very large datasets without clustering
- Self-hosted HA requires Typesense Cloud or manual clustering setup`,
      },
      {
        id: 'pgvector',
        name: 'pgvector',
        category: 'search',
        description: 'Vector similarity search as a PostgreSQL extension',
        tools: ['pgvector', 'PostgreSQL', 'pgvector'],
        guide: `### Setup
- Install extension: \`CREATE EXTENSION vector;\` in PostgreSQL
- Install: \`pnpm add pgvector\` (Node.js client) or use Prisma/Drizzle with raw queries
- Requires PostgreSQL 11+ with pgvector extension installed

### Architecture
- Add vector column: \`ALTER TABLE items ADD COLUMN embedding vector(1536);\`
- Store embeddings from OpenAI, Cohere, or local models alongside your data
- Query: \`SELECT * FROM items ORDER BY embedding <=> '[...]' LIMIT 10;\`
- Index: Create IVFFlat or HNSW index for fast similarity search

### Key Patterns
- Use HNSW index for best recall/speed tradeoff: \`CREATE INDEX ON items USING hnsw (embedding vector_cosine_ops)\`
- Combine vector search with SQL filters: \`WHERE category = 'tech' ORDER BY embedding <=> $1\`
- Batch insert embeddings with COPY for large datasets
- Use inner product (\`<#>\`) for normalized vectors, cosine (\`<=>\`) for general use

### Pitfalls
- pgvector indexes require tuning — default parameters may give poor recall
- Embedding dimensions must match your model (OpenAI ada-002 = 1536, text-embedding-3-small = 1536)
- Large vector columns increase table size significantly — consider separate table`,
      },
      {
        id: 'elasticsearch',
        name: 'Elasticsearch',
        category: 'search',
        description: 'Distributed search and analytics engine for large-scale data',
        tools: ['Elasticsearch', '@elastic/elasticsearch'],
        guide: `### Setup
- Install: \`pnpm add @elastic/elasticsearch\`
- Run: Elastic Cloud (managed) or Docker: \`docker run -p 9200:9200 elasticsearch:8\`
- Env vars: ELASTICSEARCH_URL, ELASTICSEARCH_API_KEY

### Architecture
- Index documents with typed mappings — define analyzers for text fields
- Query DSL: \`client.search({ index, body: { query: { match: { title: 'search term' } } } })\`
- Aggregations: Facets, histograms, stats computed during search
- Ingest pipelines: Transform documents on indexing (extract, enrich, normalize)

### Key Patterns
- Use bulk API for indexing large datasets: \`client.bulk({ body: operations })\`
- Multi-match queries for searching across multiple fields
- Use index aliases for zero-downtime reindexing
- Implement search-as-you-type with completion suggesters

### Pitfalls
- Elasticsearch is resource-intensive — requires dedicated infrastructure
- Mapping changes require reindexing — plan schema carefully upfront
- JVM heap size must be configured properly — default is often too small`,
      },
    ],
  },

  // 8. Vector DB
  {
    id: 'vectordb',
    name: 'Vector Database',
    description: 'Purpose-built vector databases for AI/ML embeddings',
    patterns: [
      {
        id: 'qdrant',
        name: 'Qdrant',
        category: 'vectordb',
        description: 'High-performance vector database with filtering and payload storage',
        tools: ['Qdrant', '@qdrant/js-client-rest'],
        guide: `### Setup
- Install: \`pnpm add @qdrant/js-client-rest\`
- Run: \`docker run -p 6333:6333 qdrant/qdrant\` or use Qdrant Cloud
- Env vars: QDRANT_URL, QDRANT_API_KEY

### Architecture
- Collections: Create with vector size and distance metric (cosine, dot, euclidean)
- Upsert points with vectors + payload metadata
- Search: \`client.search(collection, { vector, filter, limit })\`
- Filtering: Payload-based filters during vector search (no post-filtering)

### Key Patterns
- Use payload indexes for frequent filter fields (category, userId, timestamp)
- Batch upsert for bulk ingestion: \`client.upsert(collection, { points: [...] })\`
- Use named vectors for multi-model embeddings in same collection
- Snapshots for backup and migration between environments

### Pitfalls
- Collection must be created before upserting — handle initialization in startup
- Vector dimension is immutable after collection creation
- Self-hosted requires persistent storage volume — don't use ephemeral containers`,
      },
      {
        id: 'milvus',
        name: 'Milvus',
        category: 'vectordb',
        description: 'Cloud-native vector database designed for billion-scale similarity search',
        tools: ['Milvus', '@zilliz/milvus2-sdk-node'],
        guide: `### Setup
- Install: \`pnpm add @zilliz/milvus2-sdk-node\`
- Run: Zilliz Cloud (managed) or Docker: \`docker compose up milvus-standalone\`
- Env vars: MILVUS_ADDRESS, MILVUS_TOKEN

### Architecture
- Collections with schema: Define fields (vector, scalar) and index types
- Insert: Batch insert vectors with metadata fields
- Search: \`client.search({ collection_name, vector, limit, filter })\`
- Index types: IVF_FLAT, HNSW, ANNOY — choose based on dataset size and speed needs

### Key Patterns
- Use HNSW index for datasets under 10M vectors, IVF for larger
- Partition by a high-cardinality field (tenant_id) for multi-tenant isolation
- Use hybrid search: combine vector similarity with scalar filtering
- Flush after batch inserts to make data searchable

### Pitfalls
- Milvus requires etcd and MinIO for standalone — complex Docker setup
- Schema changes require dropping and recreating collection
- Zilliz Cloud simplifies operations significantly — recommended for production`,
      },
      {
        id: 'pinecone',
        name: 'Pinecone',
        category: 'vectordb',
        description: 'Fully managed vector database with serverless and pod-based deployment',
        tools: ['Pinecone', '@pinecone-database/pinecone'],
        guide: `### Setup
- Install: \`pnpm add @pinecone-database/pinecone\`
- Env vars: PINECONE_API_KEY, PINECONE_INDEX_NAME

### Architecture
- Serverless indexes: Auto-scale, pay-per-query — recommended for most use cases
- Upsert: \`index.upsert([{ id, values, metadata }])\` — vectors with metadata
- Query: \`index.query({ vector, topK, filter })\`
- Namespaces: Logical partitions within an index for multi-tenancy

### Key Patterns
- Use namespaces to separate data by tenant/user/project
- Metadata filtering: \`filter: { category: { $eq: 'tech' } }\` during query
- Batch upsert in chunks of 100 for optimal performance
- Use sparse-dense vectors for hybrid search (keyword + semantic)

### Pitfalls
- Serverless has cold start latency — first query after idle may be slower
- Metadata values have size limits — don't store large text in metadata
- Index deletion is permanent — no undo, no snapshots on serverless`,
      },
      {
        id: 'chroma',
        name: 'Chroma',
        category: 'vectordb',
        description: 'Open-source embedding database, great for prototyping and local development',
        tools: ['Chroma', 'chromadb'],
        guide: `### Setup
- Install: \`pip install chromadb\` (Python) or use Chroma's REST API with fetch
- Run: \`chroma run --host 0.0.0.0 --port 8000\` or in-memory for dev
- Env vars: CHROMA_HOST, CHROMA_PORT

### Architecture
- Collections: Create with optional embedding function (auto-embed documents)
- Add: \`collection.add({ ids, documents, embeddings, metadatas })\`
- Query: \`collection.query({ queryTexts, nResults, where })\`
- Built-in embedding: Pass documents without embeddings — Chroma auto-embeds

### Key Patterns
- Use in-memory mode for prototyping, persistent mode for development
- Built-in embedding functions: sentence-transformers, OpenAI, Cohere
- Where filters on metadata during query for hybrid search
- Use \`collection.update()\` to modify existing documents without re-adding

### Pitfalls
- Chroma is best for prototyping — consider Qdrant/Pinecone for production scale
- Node.js client is community-maintained — Python SDK is primary
- In-memory collections are lost on restart — use persistent directory for dev`,
      },
    ],
  },

  // 9. Monitoring
  {
    id: 'monitoring',
    name: 'Monitoring',
    description: 'Error tracking, performance monitoring, and observability',
    patterns: [
      {
        id: 'sentry',
        name: 'Sentry',
        category: 'monitoring',
        description: 'Error tracking and performance monitoring with source maps',
        tools: ['Sentry', '@sentry/nextjs', '@sentry/node'],
        guide: `### Setup
- Install: \`npx @sentry/wizard@latest -i nextjs\` (auto-configures Next.js)
- Manual: \`pnpm add @sentry/nextjs\` and configure sentry.client.config.ts + sentry.server.config.ts
- Env vars: SENTRY_DSN, SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT

### Architecture
- Client: Auto-captures unhandled errors, performance transactions, web vitals
- Server: Captures API route errors, SSR errors, and server-side exceptions
- Source maps: Upload during build with Sentry webpack plugin for readable stack traces
- Releases: Tag deployments for error regression tracking

### Key Patterns
- Use \`Sentry.captureException(error)\` for manually caught errors
- Add context: \`Sentry.setUser({ id, email })\`, \`Sentry.setTag('feature', 'checkout')\`
- Performance: Custom transactions with \`Sentry.startTransaction()\`
- Use Sentry's Issues page to triage, assign, and resolve errors

### Pitfalls
- Source map upload requires SENTRY_AUTH_TOKEN — set in CI environment
- Free tier: 5,000 errors/month — noisy errors can exhaust quota quickly
- Don't capture sensitive data — configure beforeSend to scrub PII`,
      },
      {
        id: 'logrocket',
        name: 'LogRocket',
        category: 'monitoring',
        description: 'Session replay with error tracking and performance monitoring',
        tools: ['LogRocket', 'logrocket', 'logrocket-react'],
        guide: `### Setup
- Install: \`pnpm add logrocket logrocket-react\`
- Env vars: NEXT_PUBLIC_LOGROCKET_APP_ID

### Architecture
- Initialize: \`LogRocket.init('app-id')\` in app entry point
- Auto-captures: DOM changes, network requests, console logs, JS errors
- Session replay: Pixel-perfect video replay of user sessions
- Identify users: \`LogRocket.identify(userId, { name, email })\`

### Key Patterns
- Use \`LogRocket.track('event')\` for custom event tracking
- Filter sessions by error, URL, user, or custom event in dashboard
- Integrate with Sentry: Attach LogRocket session URL to Sentry errors
- Use Redux/Vuex middleware to capture state changes in session replay

### Pitfalls
- LogRocket records all DOM — sanitize sensitive fields with \`data-log-rocket-mask\`
- Recording increases page weight — configure sampling rate for high-traffic apps
- Free tier: 1,000 sessions/month — use sampling in production`,
      },
      {
        id: 'datadog',
        name: 'Datadog',
        category: 'monitoring',
        description: 'Full-stack observability platform with APM, logs, and infrastructure monitoring',
        tools: ['Datadog', 'dd-trace', '@datadog/browser-rum'],
        guide: `### Setup
- Install: \`pnpm add dd-trace\` (APM) + \`pnpm add @datadog/browser-rum\` (browser)
- APM: \`require('dd-trace').init()\` — must be first line in app entry
- Env vars: DD_API_KEY, DD_APP_KEY, DD_SITE, DD_SERVICE, DD_ENV

### Architecture
- APM: Automatic tracing of HTTP, database, and cache operations
- RUM: Real User Monitoring — performance, errors, and user journeys in browser
- Logs: Correlate logs with traces using dd-trace log injection
- Custom metrics: \`tracer.dogstatsd.increment('api.requests', 1, { endpoint: '/users' })\`

### Key Patterns
- Use unified service tagging: DD_SERVICE, DD_ENV, DD_VERSION on all telemetry
- Trace ID correlation: Connect frontend RUM sessions to backend APM traces
- Custom spans: \`tracer.trace('operation', () => { ... })\` for business logic
- Dashboards: Build custom dashboards for SLIs/SLOs

### Pitfalls
- dd-trace must be initialized before any other imports — use --require flag
- Datadog pricing is per-host and per-ingested-data — costs can escalate quickly
- RUM sampling: Default 100% — reduce for high-traffic sites to control costs`,
      },
    ],
  },

  // 10. CI/CD
  {
    id: 'cicd',
    name: 'CI/CD',
    description: 'Continuous integration and deployment pipelines',
    patterns: [
      {
        id: 'github-actions',
        name: 'GitHub Actions',
        category: 'cicd',
        description: 'Native CI/CD for GitHub repositories with reusable workflows',
        tools: ['GitHub Actions', 'GitHub'],
        guide: `### Setup
- Create .github/workflows/ci.yml for CI pipeline
- No installation needed — runs on GitHub-hosted runners
- Env vars: Set secrets in GitHub repo Settings > Secrets and Variables

### Architecture
- Workflow triggers: push, pull_request, schedule, workflow_dispatch
- Jobs: Lint → Test → Build → Deploy (with dependency chain)
- Caching: actions/cache for node_modules, pnpm store, build artifacts
- Matrix strategy: Test across Node versions and OS

### Key Patterns
- Use pnpm with \`pnpm/action-setup\` for fast installs
- Reusable workflows: \`.github/workflows/reusable-*.yml\` for shared logic
- Branch protection: Require CI pass before merge
- Use \`concurrency\` to cancel in-progress runs on new pushes

### Pitfalls
- Free tier: 2,000 minutes/month for private repos — cache aggressively
- Secrets are not available in PRs from forks — design workflows accordingly
- Always pin action versions with SHA, not just tags (supply chain security)`,
      },
      {
        id: 'vercel-cicd',
        name: 'Vercel',
        category: 'cicd',
        description: 'Zero-config deployment platform for frontend and full-stack apps',
        tools: ['Vercel', 'vercel'],
        guide: `### Setup
- Install: \`pnpm add -g vercel\` or connect GitHub repo in Vercel Dashboard
- Link: \`vercel link\` to connect local project to Vercel
- Env vars: Set in Vercel Dashboard > Project > Settings > Environment Variables

### Architecture
- Git integration: Auto-deploy on push to main (production) and PRs (preview)
- Preview deployments: Every PR gets a unique URL for testing
- Serverless functions: API routes auto-deploy as serverless functions
- Edge functions: Use edge runtime for low-latency middleware and routes

### Key Patterns
- Use vercel.json for custom build settings, redirects, and headers
- Environment variables: Separate production, preview, and development values
- Deploy hooks: Trigger deploys from external events (CMS publish, etc.)
- Monorepo: Configure root directory per project in Vercel Dashboard

### Pitfalls
- Serverless function timeout: 10s (Hobby), 60s (Pro) — optimize long-running tasks
- Free tier: 100 deployments/day — sufficient for most development
- Build cache is per-branch — first deploy on new branch is always full build`,
      },
      {
        id: 'docker',
        name: 'Docker',
        category: 'cicd',
        description: 'Containerization for consistent builds and deployments',
        tools: ['Docker', 'docker-compose'],
        guide: `### Setup
- Create Dockerfile in project root with multi-stage build
- Create docker-compose.yml for local development with services
- No npm packages needed — Docker CLI and Docker Desktop

### Architecture
- Multi-stage builds: Stage 1 (build), Stage 2 (production) — minimize image size
- Docker Compose: Define app + database + redis + other services
- Volume mounts: Persist data for databases, mount source for hot reload in dev
- Networks: Isolate services, name-based DNS resolution between containers

### Key Patterns
- Use .dockerignore to exclude node_modules, .env, .git
- Layer caching: Copy package.json first, install deps, then copy source
- Health checks: \`HEALTHCHECK CMD curl -f http://localhost:3000/health\`
- Use build args for environment-specific configuration

### Pitfalls
- Don't run as root in containers — add \`USER node\` after install
- Node.js alpine images are smaller but may lack native deps — test thoroughly
- Docker Desktop licensing: Free for personal/small business, paid for enterprise`,
      },
      {
        id: 'railway',
        name: 'Railway',
        category: 'cicd',
        description: 'Infrastructure platform with instant deploys and built-in databases',
        tools: ['Railway', 'railway'],
        guide: `### Setup
- Install: \`pnpm add -g @railway/cli\`
- Link: \`railway link\` to connect to Railway project
- Env vars: Set in Railway Dashboard or \`railway variables set KEY=value\`

### Architecture
- Auto-detect: Railway detects framework and configures build/start commands
- Services: Deploy multiple services (API, worker, cron) in one project
- Databases: One-click PostgreSQL, MySQL, Redis, MongoDB provisioning
- Networking: Private networking between services, public domains for external access

### Key Patterns
- Use Railway templates for common stacks (Next.js + PostgreSQL, etc.)
- Reference variables across services: \`\${{Postgres.DATABASE_URL}}\`
- Use \`railway run\` to execute commands with production env vars locally
- Deploy from GitHub: Auto-deploy on push, preview environments for PRs

### Pitfalls
- Free tier: $5/month credit, limited to 500 hours — not for always-on services
- Build logs: Check for memory issues — Railway has build-time memory limits
- Custom domains require paid plan — use .up.railway.app for development`,
      },
    ],
  },

  // 11. Realtime
  {
    id: 'realtime',
    name: 'Realtime',
    description: 'Real-time communication and live data synchronization',
    patterns: [
      {
        id: 'websocket',
        name: 'WebSocket',
        category: 'realtime',
        description: 'Native WebSocket implementation for custom real-time communication',
        tools: ['WebSocket', 'ws', 'socket.io'],
        guide: `### Setup
- Install: \`pnpm add ws\` (server) or \`pnpm add socket.io socket.io-client\` (full framework)
- Native WebSocket API available in browsers — no client package needed for basic use

### Architecture
- Server: Create WebSocket server alongside HTTP server on same port
- Rooms/channels: Implement pub/sub pattern for topic-based messaging
- Protocol: Define message types as JSON: \`{ type: 'chat', payload: { ... } }\`
- Scaling: Use Redis adapter (socket.io-redis) for multi-server deployments

### Key Patterns
- Heartbeat/ping-pong: Detect stale connections and auto-reconnect
- Authentication: Verify JWT on connection upgrade, attach user to socket
- Rate limiting: Implement per-connection message rate limits
- Binary data: Use ArrayBuffer for file transfer, JSON for structured messages

### Pitfalls
- Serverless platforms don't support persistent WebSocket connections — use Pusher/Ably
- Connection limits: Typical server handles ~10K concurrent connections
- Always handle reconnection logic on client — connections drop frequently on mobile`,
      },
      {
        id: 'pusher',
        name: 'Pusher',
        category: 'realtime',
        description: 'Hosted real-time messaging with channels and presence',
        tools: ['Pusher', 'pusher', 'pusher-js'],
        guide: `### Setup
- Install: \`pnpm add pusher\` (server) + \`pnpm add pusher-js\` (client)
- Env vars: PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER, NEXT_PUBLIC_PUSHER_KEY

### Architecture
- Server: Trigger events on channels — \`pusher.trigger('channel', 'event', data)\`
- Client: Subscribe to channels — \`pusher.subscribe('channel').bind('event', callback)\`
- Channel types: Public, private (auth required), presence (who's online)
- Auth endpoint: POST /api/pusher/auth — verify user can access private/presence channels

### Key Patterns
- Use private channels for user-specific events: \`private-user-{userId}\`
- Presence channels for collaborative features: show online users, typing indicators
- Client events: Direct client-to-client messaging on private channels
- Batch trigger: Send to multiple channels in one API call

### Pitfalls
- Free tier: 200K messages/day, 100 concurrent connections — limited for production
- Message size limit: 10KB — compress large payloads or use S3 for file transfers
- Pusher doesn't persist messages — implement your own history/replay`,
      },
      {
        id: 'ably',
        name: 'Ably',
        category: 'realtime',
        description: 'Enterprise real-time messaging with guaranteed delivery and history',
        tools: ['Ably', 'ably'],
        guide: `### Setup
- Install: \`pnpm add ably\`
- Env vars: ABLY_API_KEY, NEXT_PUBLIC_ABLY_API_KEY (publishable)

### Architecture
- Publish/subscribe: \`channel.publish('event', data)\` and \`channel.subscribe(callback)\`
- Presence: Track who's connected to a channel with automatic enter/leave
- History: Retrieve past messages from channels (configurable retention)
- Token auth: Generate short-lived tokens server-side for client authentication

### Key Patterns
- Use token authentication for client-side — never expose full API key
- Channel namespaces: \`chat:room-123\`, \`notifications:user-456\`
- Message ordering and exactly-once delivery guarantees
- Use Ably Reactor for server-side event processing (webhooks, queues, functions)

### Pitfalls
- Free tier: 6M messages/month, 200 peak connections — generous for development
- Full API key has publish+subscribe+admin — always use token auth for clients
- Message size limit: 64KB — use for signaling, not file transfer`,
      },
      {
        id: 'supabase-realtime',
        name: 'Supabase Realtime',
        category: 'realtime',
        description: 'PostgreSQL change data capture with WebSocket delivery',
        tools: ['Supabase Realtime', '@supabase/supabase-js'],
        guide: `### Setup
- Install: \`pnpm add @supabase/supabase-js\` (realtime is built into the client)
- Enable realtime on tables in Supabase Dashboard > Database > Replication
- Env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY

### Architecture
- Postgres Changes: Subscribe to INSERT, UPDATE, DELETE events on tables
- Broadcast: Send arbitrary messages to channels (not tied to database)
- Presence: Track online users and shared state across clients
- Channel: \`supabase.channel('room').on('postgres_changes', { event, schema, table }, callback)\`

### Key Patterns
- Filter subscriptions: \`.on('postgres_changes', { filter: 'user_id=eq.123' })\`
- Combine Broadcast + Presence for collaborative features (cursors, typing)
- Use RLS with realtime — users only receive changes they're authorized to see
- Unsubscribe on cleanup: \`supabase.removeChannel(channel)\`

### Pitfalls
- Realtime must be explicitly enabled per-table in Dashboard
- RLS applies to realtime — test policies to ensure correct data delivery
- High-frequency updates may cause performance issues — debounce where possible`,
      },
    ],
  },

  // 12. Project Management
  {
    id: 'project-management',
    name: 'Project Management',
    description: 'Project tracking and team collaboration tools',
    patterns: [
      {
        id: 'jira',
        name: 'Jira',
        category: 'project-management',
        description: 'Enterprise project management with Agile boards, sprints, and automation',
        tools: ['Jira', 'jira-client', 'Atlassian API'],
        guide: `### Setup
- Install: \`pnpm add jira-client\` or use Atlassian REST API directly
- Env vars: JIRA_HOST, JIRA_EMAIL, JIRA_API_TOKEN

### Architecture
- REST API: Create/update issues, manage sprints, query with JQL
- Webhooks: Issue created, updated, transitioned — POST to your endpoint
- Automation: Jira Automation rules for workflow triggers (on PR merge, auto-transition)
- Integration: Link commits/PRs to Jira issues via branch naming (PROJ-123)

### Key Patterns
- Smart commits: \`git commit -m "PROJ-123 fix login bug #done"\` auto-transitions issues
- Use JQL for complex queries: \`project = PROJ AND sprint in openSprints()\`
- Webhooks for syncing Jira state with your app (status dashboards, notifications)
- Custom fields for project-specific metadata

### Pitfalls
- API rate limits: 100 requests per 10 seconds per user — implement request queuing
- Jira Cloud API differs from Server/Data Center — verify endpoint compatibility
- API tokens are tied to user accounts — use service accounts for integrations`,
      },
    ],
  },

  // 13. Communication
  {
    id: 'communication',
    name: 'Communication',
    description: 'Team communication and notification integrations',
    patterns: [
      {
        id: 'slack',
        name: 'Slack',
        category: 'communication',
        description: 'Team messaging with bots, webhooks, and workflow integrations',
        tools: ['Slack', '@slack/web-api', '@slack/bolt'],
        guide: `### Setup
- Install: \`pnpm add @slack/bolt\` (framework) or \`@slack/web-api\` (API client only)
- Create Slack App in api.slack.com/apps — configure bot scopes and event subscriptions
- Env vars: SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET, SLACK_APP_TOKEN (for Socket Mode)

### Architecture
- Bolt framework: \`app.message('pattern', handler)\`, \`app.command('/cmd', handler)\`
- Incoming webhooks: Simple POST to send messages to a channel (no bot needed)
- Events API: Receive events (message, reaction, member joined) via HTTP or Socket Mode
- Block Kit: Rich message layouts with interactive components

### Key Patterns
- Use Socket Mode for development — no public URL needed
- Block Kit Builder (app.slack.com/block-kit-builder) to design rich messages
- Slash commands for user-initiated actions: \`/deploy\`, \`/status\`
- Schedule messages: \`chat.scheduleMessage\` for delayed notifications

### Pitfalls
- Bot tokens are channel-specific — bot must be invited to channels to post
- Event subscriptions require URL verification (challenge response)
- Rate limits: 1 message per second per channel — queue messages for bulk sending`,
      },
    ],
  },

  // 14. E-commerce
  {
    id: 'ecommerce',
    name: 'E-commerce',
    description: 'E-commerce platforms and storefront integrations',
    patterns: [
      {
        id: 'shopify',
        name: 'Shopify',
        category: 'ecommerce',
        description: 'Full-featured e-commerce platform with Storefront and Admin APIs',
        tools: ['Shopify', '@shopify/shopify-api', '@shopify/hydrogen'],
        guide: `### Setup
- Install: \`pnpm add @shopify/shopify-api\` (custom app) or \`npx create-hydrogen-app\` (Hydrogen)
- Create app in Shopify Partners Dashboard — get API credentials
- Env vars: SHOPIFY_API_KEY, SHOPIFY_API_SECRET, SHOPIFY_STORE_DOMAIN, SHOPIFY_ACCESS_TOKEN

### Architecture
- Storefront API: Public, client-safe — product listings, cart, checkout (GraphQL)
- Admin API: Server-side only — orders, inventory, customers, fulfillment (REST/GraphQL)
- Hydrogen: Shopify's React framework for custom storefronts (built on Remix)
- Webhooks: Order created, product updated, checkout completed — mandatory for data sync

### Key Patterns
- Use Storefront API for headless commerce — cart and checkout without Shopify theme
- GraphQL for Storefront API, REST or GraphQL for Admin API
- Implement webhook HMAC verification for all incoming webhooks
- Use metafields for custom product/order data that doesn't fit standard schema

### Pitfalls
- Storefront API requires storefront access token (different from admin token)
- Checkout is Shopify-hosted unless you're on Shopify Plus (checkout extensibility)
- API versioning: Shopify deprecates API versions quarterly — pin and upgrade regularly`,
      },
    ],
  },

  // 15. Design
  {
    id: 'design',
    name: 'Design',
    description: 'Design tools and creative platform integrations',
    patterns: [
      {
        id: 'framer',
        name: 'Framer',
        category: 'design',
        description: 'Design-to-production website builder with React component support',
        tools: ['Framer', 'framer-motion'],
        guide: `### Setup
- Install: \`pnpm add framer-motion\` for animation library in your React app
- Framer Sites: Design and publish directly from Framer — no code export needed
- For custom components in Framer: Use Framer's component API

### Architecture
- Framer Motion: Animation library — \`<motion.div animate={{ opacity: 1 }}>\`
- Framer Sites: Visual editor that publishes to production (hosting included)
- Code components: Write React components that work inside Framer editor
- CMS: Built-in CMS for dynamic content in Framer Sites

### Key Patterns
- Use \`AnimatePresence\` for exit animations (page transitions, modals)
- Layout animations: \`layout\` prop for automatic smooth transitions on DOM changes
- Scroll-linked animations: \`useScroll()\` hook for parallax and progress indicators
- Variants: Define animation states and orchestrate child animations

### Pitfalls
- framer-motion bundle size is significant — use lazy loading or \`m\` component for tree-shaking
- Framer Sites are separate from your codebase — not suitable for app UIs
- Code components in Framer have limitations — no hooks from external state libraries`,
      },
      {
        id: 'figma',
        name: 'Figma',
        category: 'design',
        description: 'Collaborative design platform with developer handoff and plugins',
        tools: ['Figma', 'Figma API', 'figma-js'],
        guide: `### Setup
- Install: \`pnpm add figma-js\` or use Figma REST API directly
- Generate Personal Access Token in Figma > Settings > Account
- Env vars: FIGMA_ACCESS_TOKEN

### Architecture
- REST API: Read files, components, styles, and images from Figma
- Webhooks: File updated, comment added — trigger design-to-code pipelines
- Plugins: Build custom Figma plugins for team-specific workflows
- Dev Mode: Developers inspect designs, copy CSS, and export assets directly

### Key Patterns
- Use Figma's component library as source of truth for design tokens
- Export design tokens via API → generate CSS variables / Tailwind config
- Automate asset export: Fetch SVGs/PNGs from Figma API in CI pipeline
- Use Figma Variants for component states (hover, active, disabled)

### Pitfalls
- Figma API rate limits: 30 requests/minute — cache responses aggressively
- File structure varies by team — normalize node traversal logic
- Personal access tokens expire — use OAuth for production integrations`,
      },
      {
        id: 'canva',
        name: 'Canva',
        category: 'design',
        description: 'Visual design platform with template marketplace and brand kit',
        tools: ['Canva', 'Canva Connect API'],
        guide: `### Setup
- Register app in Canva Developers portal (canva.com/developers)
- Use Canva Connect API for integration — REST-based
- Env vars: CANVA_CLIENT_ID, CANVA_CLIENT_SECRET

### Architecture
- Connect API: Create designs, manage brand assets, export designs programmatically
- OAuth 2.0: User authorization flow for accessing their Canva designs
- Design import/export: Create designs from templates, export as PNG/PDF
- Brand Kit API: Manage brand colors, fonts, logos, and templates

### Key Patterns
- Use Canva Connect to embed design creation in your app
- Template-based generation: Pre-configure templates, fill with dynamic data
- Asset management: Upload and organize brand assets via API
- Export designs in multiple formats for different channels (social, print, web)

### Pitfalls
- Canva API is relatively new — some features may have limited documentation
- OAuth flow requires redirect URI setup per environment
- Rate limits apply — implement retry logic with exponential backoff`,
      },
    ],
  },

  // 16. Customer Support
  {
    id: 'customer-support',
    name: 'Customer Support',
    description: 'Help desk and customer support platform integrations',
    patterns: [
      {
        id: 'freshdesk',
        name: 'Freshdesk',
        category: 'customer-support',
        description: 'Customer support platform with ticketing, knowledge base, and automation',
        tools: ['Freshdesk', 'Freshdesk API'],
        guide: `### Setup
- Use Freshdesk REST API v2 — no official Node.js SDK (use fetch or axios)
- Auth: API key as username with \`X\` as password (Basic Auth)
- Env vars: FRESHDESK_DOMAIN, FRESHDESK_API_KEY

### Architecture
- Tickets: Create, update, list, filter via REST API
- Contacts: Manage customer profiles linked to tickets
- Knowledge base: Articles and categories for self-service support
- Webhooks: Ticket created, updated, resolved — trigger custom workflows

### Key Patterns
- Create tickets from your app: POST /api/v2/tickets with requester info
- Use custom fields for app-specific metadata on tickets
- Automation rules in Freshdesk for routing, SLA, and escalation
- Embed Freshdesk widget in your app for in-app support

### Pitfalls
- API rate limit: varies by plan (free: 50/min, paid: higher) — implement throttling
- Pagination: Use \`page\` and \`per_page\` params — default 30 items
- Webhook payloads are not signed — verify source IP or implement shared secret`,
      },
      {
        id: 'zendesk',
        name: 'Zendesk',
        category: 'customer-support',
        description: 'Enterprise customer service platform with omnichannel support',
        tools: ['Zendesk', 'node-zendesk', 'Zendesk API'],
        guide: `### Setup
- Install: \`pnpm add node-zendesk\` or use Zendesk REST API with fetch
- Auth: API token (\`email/token:api_key\`) or OAuth
- Env vars: ZENDESK_SUBDOMAIN, ZENDESK_EMAIL, ZENDESK_API_TOKEN

### Architecture
- Tickets API: Create, update, search, and manage support tickets
- Users API: Manage end-users, agents, and organizations
- Help Center API: Articles, sections, categories for self-service
- Chat/Messaging: Real-time customer communication via Zendesk Widget

### Key Patterns
- Use ticket triggers for automated responses and routing
- Zendesk Widget: Embed support chat/help center in your app with one script tag
- Search API with Zendesk Query Language for complex ticket queries
- Webhooks + Zendesk Triggers for real-time ticket event processing

### Pitfalls
- API rate limit: 700 requests/minute (Enterprise) — lower on smaller plans
- Zendesk has multiple products (Support, Chat, Guide) — each has separate APIs
- Sandbox environment requires Enterprise plan — test carefully on trial accounts`,
      },
    ],
  },

  // 17. Crawler
  {
    id: 'crawler',
    name: 'Crawler',
    description: 'Web crawling and content extraction services',
    patterns: [
      {
        id: 'firecrawl',
        name: 'Firecrawl',
        category: 'crawler',
        description: 'AI-powered web crawler that extracts clean markdown from any URL',
        tools: ['Firecrawl', '@mendable/firecrawl-js'],
        guide: `### Setup
- Install: \`pnpm add @mendable/firecrawl-js\`
- Env vars: FIRECRAWL_API_KEY

### Architecture
- Scrape: Single URL → clean markdown/HTML extraction with metadata
- Crawl: Start from URL, follow links, extract content from entire site
- Map: Get all URLs from a website without extracting content
- Async crawl: Submit job, poll for completion, get results

### Key Patterns
- Use scrape for single-page extraction: \`app.scrapeUrl(url, { formats: ['markdown'] })\`
- Crawl for site-wide content: \`app.crawlUrl(url, { limit: 100 })\`
- Use \`includePaths\` and \`excludePaths\` to filter crawled URLs
- Extract structured data with LLM extraction mode (schema-based)

### Pitfalls
- Crawl jobs can be slow for large sites — use async mode with webhooks
- Respect robots.txt — Firecrawl follows it by default
- API rate limits depend on plan — implement retry logic for 429 responses`,
      },
    ],
  },

  // 18. Web Scraping
  {
    id: 'web-scraping',
    name: 'Web Scraping',
    description: 'Web scraping and browser automation tools',
    patterns: [
      {
        id: 'scrapling',
        name: 'Scrapling',
        category: 'web-scraping',
        description: 'Lightweight web scraping library with CSS selector-based extraction',
        tools: ['Scrapling', 'cheerio', 'puppeteer'],
        guide: `### Setup
- Install: \`pnpm add cheerio\` (HTML parsing) + \`pnpm add puppeteer\` (browser automation)
- For static pages: Use fetch + cheerio — fast and lightweight
- For JS-rendered pages: Use puppeteer for full browser rendering

### Architecture
- Static scraping: Fetch HTML → parse with cheerio → extract with CSS selectors
- Dynamic scraping: Launch puppeteer browser → navigate → wait for content → extract
- Pipeline: URL queue → fetch/render → parse → transform → store
- Scheduling: CRON jobs for periodic scraping (price monitoring, content aggregation)

### Key Patterns
- Use cheerio for static HTML: \`$(selector).text()\`, \`$(selector).attr('href')\`
- Puppeteer for SPAs: \`page.waitForSelector('.data')\` then \`page.evaluate()\`
- Implement request delays and rotation to avoid rate limits
- Cache responses to avoid re-scraping unchanged pages (ETags, Last-Modified)

### Pitfalls
- Respect robots.txt and terms of service — scraping may violate ToS
- Puppeteer requires Chromium — significant resource usage in production
- Anti-bot measures (Cloudflare, captchas) may block scrapers — consider using proxies`,
      },
    ],
  },

  // 19. Hosting
  {
    id: 'hosting',
    name: 'Hosting',
    description: 'Web hosting and deployment platforms',
    patterns: [
      {
        id: 'netlify',
        name: 'Netlify',
        category: 'hosting',
        description: 'Web hosting with serverless functions, forms, and edge handlers',
        tools: ['Netlify', 'netlify-cli', '@netlify/functions'],
        guide: `### Setup
- Install: \`pnpm add -g netlify-cli\` + \`pnpm add @netlify/functions\`
- Link: \`netlify link\` or connect GitHub repo in Netlify Dashboard
- Env vars: Set in Netlify Dashboard > Site > Environment variables

### Architecture
- Static hosting: Deploy built assets to Netlify CDN (automatic from Git)
- Serverless functions: \`netlify/functions/\` directory — auto-deployed as AWS Lambda
- Edge functions: \`netlify/edge-functions/\` — run at CDN edge with Deno runtime
- Forms: HTML forms with \`data-netlify="true"\` — submissions stored/forwarded automatically

### Key Patterns
- Use \`netlify.toml\` for build config, redirects, and headers
- Branch deploys: Every branch gets a deploy URL for testing
- Deploy previews: PRs get preview URLs with Netlify comment on GitHub
- Use Netlify Identity for quick auth or Netlify Graph for API integrations

### Pitfalls
- Serverless function timeout: 10s (free), 26s (paid) — not for long-running tasks
- Build minutes: 300/month on free tier — optimize build times
- Netlify Functions use AWS Lambda — cold starts may impact latency`,
      },
      {
        id: 'vercel-hosting',
        name: 'Vercel',
        category: 'hosting',
        description: 'Edge-first hosting platform optimized for Next.js and React frameworks',
        tools: ['Vercel', 'vercel'],
        guide: `### Setup
- Install: \`pnpm add -g vercel\`
- Deploy: \`vercel\` from project root — auto-detects framework
- Env vars: \`vercel env add\` or set in Dashboard > Project > Settings

### Architecture
- Framework detection: Auto-configures build for Next.js, Remix, Astro, etc.
- Edge Network: Static assets served from 100+ global locations
- Serverless functions: API routes auto-deploy, scale to zero when idle
- ISR: Incremental Static Regeneration for dynamic content with static performance

### Key Patterns
- Use preview deployments for every PR — share URLs with team for review
- Edge middleware: Run logic before request hits your app (auth, redirects, A/B tests)
- Cron jobs: Define in vercel.json for scheduled serverless function execution
- Speed Insights: Built-in web vitals monitoring

### Pitfalls
- Hobby plan: 100 deployments/day, 100GB bandwidth — sufficient for small projects
- Serverless function regions: Choose region close to your database for lowest latency
- No persistent file system — use external storage (S3, Supabase) for uploads`,
      },
    ],
  },

  // 20. Domain
  {
    id: 'domain',
    name: 'Domain',
    description: 'Domain registration and DNS management',
    patterns: [
      {
        id: 'godaddy',
        name: 'GoDaddy',
        category: 'domain',
        description: 'Domain registrar with DNS management and API access',
        tools: ['GoDaddy', 'GoDaddy API'],
        guide: `### Setup
- Get API credentials from developer.godaddy.com
- Use GoDaddy REST API — no official Node.js SDK (use fetch)
- Env vars: GODADDY_API_KEY, GODADDY_API_SECRET

### Architecture
- Domains API: Check availability, register, renew, transfer domains
- DNS API: Manage A, CNAME, MX, TXT records programmatically
- Certificates API: SSL certificate provisioning and management
- Auth: API key + secret in Authorization header

### Key Patterns
- DNS automation: Update records on deployment (point to new server IP)
- Domain availability check before registration: GET /v1/domains/available
- Bulk DNS updates: PATCH /v1/domains/{domain}/records for batch changes
- Use TXT records for domain verification (SSL, email, Stripe, etc.)

### Pitfalls
- API has separate OTE (test) and production environments — use OTE for development
- Rate limits: 60 requests/minute — implement throttling for batch operations
- DNS propagation: Changes take 15min to 48hrs — TTL affects propagation speed`,
      },
      {
        id: 'google-domains',
        name: 'Google Domains',
        category: 'domain',
        description: 'Domain registration with Google Cloud DNS integration (now Squarespace)',
        tools: ['Google Domains', 'Squarespace Domains', 'Cloud DNS'],
        guide: `### Setup
- Google Domains transferred to Squarespace Domains — manage at domains.squarespace.com
- For DNS management with Google Cloud: Use Cloud DNS API
- Env vars: GOOGLE_CLOUD_PROJECT, GOOGLE_APPLICATION_CREDENTIALS

### Architecture
- Squarespace Domains: Web-based management for registration and basic DNS
- Cloud DNS: Programmable DNS management via Google Cloud API
- Integration: Use Cloud DNS managed zones for high-availability DNS
- DNSSEC: Automatic DNSSEC signing with Cloud DNS

### Key Patterns
- Use Cloud DNS for programmable DNS management with IaC (Terraform, Pulumi)
- Managed zones for each domain with record sets for A, CNAME, MX, TXT
- Health checks: Route traffic based on backend health (with Cloud Load Balancing)
- DNS peering: Private DNS zones for internal service discovery

### Pitfalls
- Google Domains is now Squarespace — migration may affect API access
- Cloud DNS charges per managed zone ($0.20/month) and per million queries
- DNS changes via Cloud DNS API take effect immediately but propagation varies`,
      },
    ],
  },

  // 21. Cloud
  {
    id: 'cloud',
    name: 'Cloud',
    description: 'Cloud infrastructure platforms and services',
    patterns: [
      {
        id: 'gcp',
        name: 'Google Cloud Platform',
        category: 'cloud',
        description: 'Full cloud platform with compute, storage, AI/ML, and managed services',
        tools: ['GCP', '@google-cloud/storage', '@google-cloud/firestore', 'gcloud'],
        guide: `### Setup
- Install: \`pnpm add @google-cloud/storage @google-cloud/firestore\` (per service)
- Auth: Service account JSON key or Application Default Credentials
- Env vars: GOOGLE_CLOUD_PROJECT, GOOGLE_APPLICATION_CREDENTIALS

### Architecture
- Compute: Cloud Run (containers), Cloud Functions (serverless), GKE (Kubernetes)
- Storage: Cloud Storage (objects), Firestore (NoSQL), Cloud SQL (relational)
- AI/ML: Vertex AI, Gemini API, Cloud Vision, Natural Language
- Networking: Cloud Load Balancing, Cloud CDN, VPC

### Key Patterns
- Use Cloud Run for containerized apps — auto-scales, pay per request
- Application Default Credentials: Works locally with gcloud CLI, in production with service account
- IAM: Principle of least privilege — create service accounts per service
- Use Secret Manager for sensitive configuration (API keys, credentials)

### Pitfalls
- GCP billing can surprise — set budget alerts and quotas early
- Service account key files are security-sensitive — use Workload Identity where possible
- Region selection matters for latency and compliance — choose closest to users`,
      },
      {
        id: 'aws',
        name: 'Amazon Web Services',
        category: 'cloud',
        description: 'Comprehensive cloud platform with 200+ services',
        tools: ['AWS', '@aws-sdk/client-s3', '@aws-sdk/client-lambda', 'aws-cdk'],
        guide: `### Setup
- Install: \`pnpm add @aws-sdk/client-s3\` (per service) or AWS CDK for infrastructure
- Auth: IAM credentials, AWS SSO, or IAM roles (EC2/Lambda)
- Env vars: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION

### Architecture
- Compute: Lambda (serverless), ECS/Fargate (containers), EC2 (VMs)
- Storage: S3 (objects), DynamoDB (NoSQL), RDS (relational), ElastiCache (Redis)
- Networking: ALB, CloudFront (CDN), Route 53 (DNS), API Gateway
- IaC: AWS CDK (TypeScript), CloudFormation, or Terraform

### Key Patterns
- Use AWS CDK for infrastructure as TypeScript code — type-safe and composable
- Lambda + API Gateway for serverless APIs — auto-scale with zero management
- Use IAM roles (not access keys) for service-to-service communication
- S3 + CloudFront for static site hosting with global CDN

### Pitfalls
- AWS pricing is complex — use AWS Cost Explorer and set billing alerts
- IAM is powerful but complex — start with AWS managed policies, customize later
- Region lock-in: Some services are regional — design for multi-region if needed`,
      },
    ],
  },
];

/**
 * Get all available pattern categories.
 */
export function getPatternCategories(): PatternCategory[] {
  return PATTERN_CATEGORIES;
}

/**
 * Get patterns for a specific category.
 */
export function getPatternsByCategory(categoryId: string): Pattern[] {
  const cat = PATTERN_CATEGORIES.find(c => c.id === categoryId);
  return cat?.patterns || [];
}

/**
 * Get a specific pattern by ID.
 */
export function getPattern(patternId: string): Pattern | undefined {
  for (const cat of PATTERN_CATEGORIES) {
    const p = cat.patterns.find(p => p.id === patternId);
    if (p) return p;
  }
  return undefined;
}

/**
 * Search patterns by query string.
 */
export function searchPatterns(query: string): Pattern[] {
  const lower = query.toLowerCase();
  const results: Pattern[] = [];
  for (const cat of PATTERN_CATEGORIES) {
    for (const p of cat.patterns) {
      if (p.name.toLowerCase().includes(lower) ||
          p.description.toLowerCase().includes(lower) ||
          p.tools.some(t => t.toLowerCase().includes(lower)) ||
          p.category.toLowerCase().includes(lower)) {
        results.push(p);
      }
    }
  }
  return results;
}

/**
 * Save selected patterns to .fishi/patterns.json
 */
export function saveSelectedPatterns(projectDir: string, patternIds: string[]): void {
  const dir = join(projectDir, '.fishi');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const data: SelectedPatterns = { patterns: patternIds, savedAt: new Date().toISOString() };
  writeFileSync(join(dir, 'patterns.json'), JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

/**
 * Read selected patterns from .fishi/patterns.json
 */
export function readSelectedPatterns(projectDir: string): string[] {
  const p = join(projectDir, '.fishi', 'patterns.json');
  if (!existsSync(p)) return [];
  try {
    const data = JSON.parse(readFileSync(p, 'utf-8'));
    return data.patterns || [];
  } catch { return []; }
}

/**
 * Generate architecture guide for selected patterns.
 * This is what the architect agent reads.
 */
export function generatePatternGuide(patternIds: string[]): string {
  let guide = '# Integration Patterns — Architecture Guide\n\n';
  guide += '> Auto-generated by FISHI Pattern Marketplace.\n';
  guide += '> Use these patterns as architectural reference during the design phase.\n\n';

  for (const id of patternIds) {
    const pattern = getPattern(id);
    if (!pattern) continue;
    guide += `## ${pattern.name} (${pattern.category})\n\n`;
    guide += `**Tools:** ${pattern.tools.join(', ')}\n\n`;
    guide += pattern.guide + '\n\n---\n\n';
  }

  return guide;
}
