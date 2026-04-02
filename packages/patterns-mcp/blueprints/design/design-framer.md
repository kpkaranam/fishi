---
id: design-framer
name: Framer
category: design
frameworks: ["Framer","framer-motion"]
dependencies: ["Framer","framer-motion"]
description: "Design-to-production website builder with React component support"
---

# Framer

**Category:** Design
**Tools:** Framer, framer-motion

### Setup
- Install: `pnpm add framer-motion` for animation library in your React app
- Framer Sites: Design and publish directly from Framer — no code export needed
- For custom components in Framer: Use Framer's component API

### Architecture
- Framer Motion: Animation library — `<motion.div animate={{ opacity: 1 }}>`
- Framer Sites: Visual editor that publishes to production (hosting included)
- Code components: Write React components that work inside Framer editor
- CMS: Built-in CMS for dynamic content in Framer Sites

### Key Patterns
- Use `AnimatePresence` for exit animations (page transitions, modals)
- Layout animations: `layout` prop for automatic smooth transitions on DOM changes
- Scroll-linked animations: `useScroll()` hook for parallax and progress indicators
- Variants: Define animation states and orchestrate child animations

### Pitfalls
- framer-motion bundle size is significant — use lazy loading or `m` component for tree-shaking
- Framer Sites are separate from your codebase — not suitable for app UIs
- Code components in Framer have limitations — no hooks from external state libraries
