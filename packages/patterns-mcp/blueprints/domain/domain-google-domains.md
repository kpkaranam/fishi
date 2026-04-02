---
id: domain-google-domains
name: Google Domains
category: domain
frameworks: ["Google Domains","Squarespace Domains","Cloud DNS"]
dependencies: ["Google Domains","Squarespace Domains","Cloud DNS"]
description: "Domain registration with Google Cloud DNS integration (now Squarespace)"
---

# Google Domains

**Category:** Domain
**Tools:** Google Domains, Squarespace Domains, Cloud DNS

### Setup
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
- DNS changes via Cloud DNS API take effect immediately but propagation varies
