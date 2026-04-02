---
id: cicd-docker
name: Docker
category: cicd
frameworks: ["Docker","docker-compose"]
dependencies: ["Docker","docker-compose"]
description: "Containerization for consistent builds and deployments"
---

# Docker

**Category:** CI/CD
**Tools:** Docker, docker-compose

### Setup
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
- Health checks: `HEALTHCHECK CMD curl -f http://localhost:3000/health`
- Use build args for environment-specific configuration

### Pitfalls
- Don't run as root in containers — add `USER node` after install
- Node.js alpine images are smaller but may lack native deps — test thoroughly
- Docker Desktop licensing: Free for personal/small business, paid for enterprise
