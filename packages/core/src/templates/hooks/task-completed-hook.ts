export function getTaskCompletedHook(): string {
  return `#!/usr/bin/env node
// task-completed-hook.mjs — FISHI Task Completion Gate
// Fires on TaskCompleted event.
// Blocks task completion if tests haven't passed.

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const ROOT = process.env.FISHI_PROJECT_ROOT || process.cwd();

// Check if package.json has a test script
const pkgPath = join(ROOT, 'package.json');
if (!existsSync(pkgPath)) {
  process.exit(0); // No package.json — allow completion
}

let hasTestScript = false;
try {
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  hasTestScript = !!(pkg.scripts?.test || pkg.scripts?.['test:unit']);
} catch {
  process.exit(0);
}

if (!hasTestScript) {
  process.exit(0); // No test script — allow completion
}

// Run tests
try {
  execSync('npm test', { cwd: ROOT, stdio: 'pipe', timeout: 120000 });
  process.exit(0); // Tests passed — allow completion
} catch (e) {
  console.error('[FISHI] Tests must pass before completing task');
  console.error('Run: npm test');
  process.exit(2); // Exit code 2 = block completion
}
`;
}
