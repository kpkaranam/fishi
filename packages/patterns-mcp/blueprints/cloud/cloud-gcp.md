---
id: cloud-gcp
name: Google Cloud Platform
category: cloud
frameworks: ["GCP","@google-cloud/storage","@google-cloud/firestore","gcloud"]
dependencies: ["GCP","@google-cloud/storage","@google-cloud/firestore","gcloud"]
description: "Full cloud platform with compute, storage, AI/ML, and managed services"
---

# Google Cloud Platform

**Category:** Cloud
**Tools:** GCP, @google-cloud/storage, @google-cloud/firestore, gcloud

### Setup
- Install: `pnpm add @google-cloud/storage @google-cloud/firestore` (per service)
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
- Region selection matters for latency and compliance — choose closest to users
