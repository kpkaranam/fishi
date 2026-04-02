---
id: design-figma
name: Figma
category: design
frameworks: ["Figma","Figma API","figma-js"]
dependencies: ["Figma","Figma API","figma-js"]
description: "Collaborative design platform with developer handoff and plugins"
---

# Figma

**Category:** Design
**Tools:** Figma, Figma API, figma-js

### Setup
- Install: `pnpm add figma-js` or use Figma REST API directly
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
- Personal access tokens expire — use OAuth for production integrations
