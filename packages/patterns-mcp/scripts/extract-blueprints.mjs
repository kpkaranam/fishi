#!/usr/bin/env node
// extract-blueprints.mjs — Extracts patterns from @qlucent/fishi-core into markdown blueprints
// Run: node scripts/extract-blueprints.mjs
import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const blueprintsDir = join(__dirname, '..', 'blueprints');

// Import patterns from core
const core = await import('@qlucent/fishi-core');
const categories = core.getPatternCategories();

let totalPatterns = 0;

for (const category of categories) {
  const categoryDir = join(blueprintsDir, category.id);
  if (!existsSync(categoryDir)) {
    mkdirSync(categoryDir, { recursive: true });
  }

  for (const pattern of category.patterns) {
    const id = `${category.id}-${pattern.id}`;
    const filename = `${id}.md`;
    const filepath = join(categoryDir, filename);

    const content = `---
id: ${id}
name: ${pattern.name}
category: ${category.id}
frameworks: ${JSON.stringify(pattern.tools || [])}
dependencies: ${JSON.stringify(pattern.tools || [])}
description: "${pattern.description}"
---

# ${pattern.name}

**Category:** ${category.name}
**Tools:** ${(pattern.tools || []).join(', ')}

${pattern.guide || ''}
`;

    writeFileSync(filepath, content);
    totalPatterns++;
  }
}

console.log(`Extracted ${totalPatterns} blueprints into ${blueprintsDir}`);
