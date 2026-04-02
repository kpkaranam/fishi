---
id: cloud-aws
name: Amazon Web Services
category: cloud
frameworks: ["AWS","@aws-sdk/client-s3","@aws-sdk/client-lambda","aws-cdk"]
dependencies: ["AWS","@aws-sdk/client-s3","@aws-sdk/client-lambda","aws-cdk"]
description: "Comprehensive cloud platform with 200+ services"
---

# Amazon Web Services

**Category:** Cloud
**Tools:** AWS, @aws-sdk/client-s3, @aws-sdk/client-lambda, aws-cdk

### Setup
- Install: `pnpm add @aws-sdk/client-s3` (per service) or AWS CDK for infrastructure
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
- Region lock-in: Some services are regional — design for multi-region if needed
