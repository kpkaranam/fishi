export function getDeploymentSkill(): string {
  return `# Deployment Skill

## Purpose
Set up and manage deployment pipelines, containerization, and production infrastructure.

## Environment Configuration

### Environment Strategy
- **Development**: local machine, hot reload, debug logging
- **Staging**: mirrors production, used for final testing
- **Production**: optimized builds, minimal logging, high availability

### Configuration Management
- Use environment variables for all environment-specific values
- Never commit secrets to version control
- Use \`.env.example\` as a template (no real values)
- Validate all required environment variables at startup
- Group variables by concern: database, auth, external services, feature flags

## Docker / Containerization

### Dockerfile Best Practices
- Use multi-stage builds to minimize image size
- Pin base image versions (not \`latest\`)
- Order layers from least to most frequently changed
- Use \`.dockerignore\` to exclude unnecessary files
- Run as non-root user
- Include health check instruction

### Docker Compose
- Define services for local development (app, database, cache, etc.)
- Use named volumes for data persistence
- Set resource limits
- Use profiles for optional services

### Example Dockerfile Structure
\`\`\`dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app
RUN addgroup -g 1001 appgroup && adduser -u 1001 -G appgroup -D appuser
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm ci --production
USER appuser
HEALTHCHECK CMD wget -q --spider http://localhost:3000/health || exit 1
EXPOSE 3000
CMD ["node", "dist/index.js"]
\`\`\`

## CI/CD Pipeline Setup

### Pipeline Stages
1. **Install**: install dependencies
2. **Lint**: run linters and formatters
3. **Test**: run unit and integration tests
4. **Build**: compile/bundle the application
5. **Security**: run dependency audit and SAST
6. **Deploy to Staging**: deploy and run E2E tests
7. **Deploy to Production**: deploy with rollback capability

### Pipeline Rules
- All checks must pass before merge
- Use branch protection on main/production branches
- Automate version bumping with conventional commits
- Tag releases with semantic versions
- Keep build times under 10 minutes

## Health Checks and Monitoring

### Health Check Endpoints
- \`GET /health\` — basic liveness check (returns 200 if app is running)
- \`GET /health/ready\` — readiness check (returns 200 if all dependencies are connected)
- Include dependency status in readiness response:
  \`\`\`json
  {
    "status": "healthy",
    "dependencies": {
      "database": "connected",
      "cache": "connected",
      "externalApi": "connected"
    },
    "version": "1.2.3",
    "uptime": 86400
  }
  \`\`\`

### Monitoring Essentials
- Application logs: structured JSON format, shipped to log aggregator
- Metrics: request rate, error rate, latency (RED method)
- Alerts: set up for error rate spikes, latency degradation, resource exhaustion
- Dashboards: key metrics visible at a glance

### Rollback Strategy
- Keep previous deployment artifacts available
- Database migrations must be backward-compatible
- Use feature flags for risky changes
- Document rollback procedures for each service

## Checklist
- [ ] Environment variables documented in \`.env.example\`
- [ ] Dockerfile with multi-stage build
- [ ] Docker Compose for local development
- [ ] CI/CD pipeline configured
- [ ] Health check endpoints implemented
- [ ] Structured logging configured
- [ ] Rollback procedure documented
- [ ] Secrets managed securely (not in git)
`;
}
