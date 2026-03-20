import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

export type AgentRole = 'master' | 'coordinator' | 'worker';

export interface AgentPermissionSet {
  role: AgentRole;
  allow: string[];
  deny: string[];
}

/**
 * Get tool permissions for a specific agent role.
 * Master: read-only + delegation. Coordinators: read/write + git. Workers: full dev in sandbox.
 */
export function getPermissionsForRole(role: AgentRole): AgentPermissionSet {
  switch (role) {
    case 'master':
      return {
        role: 'master',
        allow: [
          'Read',
          'Glob',
          'Grep',
          'Agent',
          'TodoRead',
          'TodoWrite',
          'WebFetch',
          'WebSearch',
        ],
        deny: [
          'Write',
          'Edit',
          'Bash(*)',
          'NotebookEdit',
          'Bash(rm *)',
          'Bash(git push *)',
          'Bash(git merge *)',
          'Bash(npm *)',
          'Bash(pnpm *)',
        ],
      };

    case 'coordinator':
      return {
        role: 'coordinator',
        allow: [
          'Read',
          'Write',
          'Edit',
          'Glob',
          'Grep',
          'Agent',
          'TodoRead',
          'TodoWrite',
          'WebFetch',
          'WebSearch',
          'Bash(git status *)',
          'Bash(git log *)',
          'Bash(git diff *)',
          'Bash(git branch *)',
          'Bash(git checkout *)',
          'Bash(git worktree *)',
          'Bash(node *)',
          'Bash(npx vitest *)',
          'Bash(npx tsc *)',
          'Bash(pnpm install *)',
          'Bash(pnpm add *)',
          'Bash(cat *)',
          'Bash(ls *)',
          'Bash(find *)',
        ],
        deny: [
          'Bash(rm -rf *)',
          'Bash(git push --force *)',
          'Bash(git push * main)',
          'Bash(git push * master)',
          'Bash(git push * production)',
          'Bash(git merge * main)',
          'Bash(git merge * master)',
          'Bash(sudo *)',
          'Bash(chmod *)',
          'Bash(shutdown *)',
          'Bash(mkfs *)',
          'Bash(dd *)',
          'Bash(npm *)',
        ],
      };

    case 'worker':
      return {
        role: 'worker',
        allow: [
          'Read',
          'Write',
          'Edit',
          'Glob',
          'Grep',
          'Agent',
          'TodoRead',
          'TodoWrite',
          'WebFetch',
          'WebSearch',
          'Bash(node *)',
          'Bash(npx *)',
          'Bash(pnpm *)',
          'Bash(git add *)',
          'Bash(git commit *)',
          'Bash(git status *)',
          'Bash(git log *)',
          'Bash(git diff *)',
          'Bash(tsc *)',
          'Bash(eslint *)',
          'Bash(prettier *)',
          'Bash(cat *)',
          'Bash(ls *)',
          'Bash(find *)',
          'Bash(grep *)',
          'Bash(wc *)',
          'Bash(head *)',
          'Bash(tail *)',
          'Bash(sort *)',
          'Bash(mkdir *)',
          'Bash(cp *)',
          'Bash(mv *)',
        ],
        deny: [
          'Bash(rm -rf *)',
          'Bash(rm -r /)',
          'Bash(git push --force *)',
          'Bash(git push * main)',
          'Bash(git push * master)',
          'Bash(git push * production)',
          'Bash(git merge *)',
          'Bash(git branch -D *)',
          'Bash(sudo *)',
          'Bash(chmod 777 *)',
          'Bash(shutdown *)',
          'Bash(reboot *)',
          'Bash(mkfs *)',
          'Bash(dd *)',
          'Bash(kill -9 *)',
          'Bash(pkill *)',
          'Bash(npm *)',
          'Bash(curl * | sh)',
          'Bash(wget * | sh)',
        ],
      };
  }
}

/**
 * Get all permission sets as a summary for display.
 */
export function getAllPermissionSummary(): Record<AgentRole, { allowCount: number; denyCount: number }> {
  const roles: AgentRole[] = ['master', 'coordinator', 'worker'];
  const result: Record<string, { allowCount: number; denyCount: number }> = {};
  for (const role of roles) {
    const perms = getPermissionsForRole(role);
    result[role] = { allowCount: perms.allow.length, denyCount: perms.deny.length };
  }
  return result as Record<AgentRole, { allowCount: number; denyCount: number }>;
}

/**
 * Generate per-agent permission YAML block for settings.json or agent definition.
 */
export function generatePermissionBlock(role: AgentRole): string {
  const perms = getPermissionsForRole(role);
  const allowLines = perms.allow.map(r => `    - "${r}"`).join('\n');
  const denyLines = perms.deny.map(r => `    - "${r}"`).join('\n');
  return `permissions:
  role: ${role}
  allow:\n${allowLines}
  deny:\n${denyLines}`;
}
