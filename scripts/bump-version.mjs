#!/usr/bin/env node

/**
 * Bump version across all FISHI packages in sync.
 *
 * Usage:
 *   node scripts/bump-version.mjs 0.20.0
 *   node scripts/bump-version.mjs patch    # 0.19.5 → 0.19.6
 *   node scripts/bump-version.mjs minor    # 0.19.5 → 0.20.0
 *   node scripts/bump-version.mjs major    # 0.19.5 → 1.0.0
 *
 * Updates: packages/core/package.json, packages/cli/package.json
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const packages = [
  join(root, 'packages/core/package.json'),
  join(root, 'packages/cli/package.json'),
];

// Read current version from core (source of truth)
const corePkg = JSON.parse(readFileSync(packages[0], 'utf-8'));
const current = corePkg.version;

const arg = process.argv[2];
if (!arg) {
  console.error(`Current version: ${current}`);
  console.error('Usage: node scripts/bump-version.mjs <version|patch|minor|major>');
  process.exit(1);
}

function bumpVersion(version, type) {
  const [major, minor, patch] = version.split('.').map(Number);
  switch (type) {
    case 'patch': return `${major}.${minor}.${patch + 1}`;
    case 'minor': return `${major}.${minor + 1}.0`;
    case 'major': return `${major + 1}.0.0`;
    default: return type; // exact version string
  }
}

const newVersion = bumpVersion(current, arg);

// Validate version format
if (!/^\d+\.\d+\.\d+$/.test(newVersion)) {
  console.error(`Invalid version: ${newVersion}`);
  process.exit(1);
}

if (newVersion === current) {
  console.error(`Version is already ${current}`);
  process.exit(1);
}

// Update all package.json files
for (const pkgPath of packages) {
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  pkg.version = newVersion;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
}

console.log(`Bumped: ${current} → ${newVersion}`);
console.log(`Updated: ${packages.map(p => p.replace(root + '/', '')).join(', ')}`);
