---
id: authentication-custom-jwt
name: Custom JWT
category: authentication
frameworks: ["jsonwebtoken","jose","bcrypt"]
dependencies: ["jsonwebtoken","jose","bcrypt"]
description: "Roll your own JWT-based auth for full control"
---

# Custom JWT

**Category:** Authentication
**Tools:** jsonwebtoken, jose, bcrypt

### Setup
- Install: `pnpm add jose bcryptjs` (jose for Edge-compatible JWT)
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
- jose library works in Edge runtimes; jsonwebtoken does not
