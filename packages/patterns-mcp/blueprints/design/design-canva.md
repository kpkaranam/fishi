---
id: design-canva
name: Canva
category: design
frameworks: ["Canva","Canva Connect API"]
dependencies: ["Canva","Canva Connect API"]
description: "Visual design platform with template marketplace and brand kit"
---

# Canva

**Category:** Design
**Tools:** Canva, Canva Connect API

### Setup
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
- Rate limits apply — implement retry logic with exponential backoff
