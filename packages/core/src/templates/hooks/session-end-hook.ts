export function getSessionEndHook(): string {
  return `#!/usr/bin/env node
// session-end-hook.mjs — FISHI Session End Hook
// Fires on SessionEnd event.
// Creates final checkpoint and cleans up.

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const ROOT = process.env.FISHI_PROJECT_ROOT || process.cwd();

// Run auto-checkpoint one final time
try {
  const { execSync } = await import('child_process');
  execSync('node .fishi/scripts/auto-checkpoint.mjs', {
    cwd: ROOT,
    stdio: 'pipe',
    timeout: 10000,
  });
} catch {}

// Update project context memory with final state
try {
  const projectYaml = join(ROOT, '.fishi', 'state', 'project.yaml');
  if (existsSync(projectYaml)) {
    const content = readFileSync(projectYaml, 'utf-8');
    const phaseMatch = content.match(/^phase:\\s*(.+)$/m);
    const sprintMatch = content.match(/^sprint:\\s*(.+)$/m);

    const contextPath = join(ROOT, '.fishi', 'memory', 'project-context.md');
    if (existsSync(contextPath)) {
      let ctx = readFileSync(contextPath, 'utf-8');
      // Update phase and sprint in context
      ctx = ctx.replace(/Phase:.*/, \`Phase: \${phaseMatch?.[1]?.trim() || 'unknown'}\`);
      ctx = ctx.replace(/Sprint:.*/, \`Sprint: \${sprintMatch?.[1]?.trim() || '0'}\`);
      writeFileSync(contextPath, ctx, 'utf-8');
    }
  }
} catch {}

console.log('[FISHI] Session ended — context updated');
process.exit(0);
`;
}
