import { describe, it, expect } from 'vitest';
import {
  getPermissionsForRole,
  getAllPermissionSummary,
  generatePermissionBlock,
} from '../generators/agent-permissions';

describe('Agent Permissions', () => {
  describe('getPermissionsForRole', () => {
    it('master has read-only + delegation, no write/edit/bash', () => {
      const perms = getPermissionsForRole('master');
      expect(perms.role).toBe('master');
      expect(perms.allow).toContain('Read');
      expect(perms.allow).toContain('Agent');
      expect(perms.allow).not.toContain('Write');
      expect(perms.allow).not.toContain('Edit');
      expect(perms.deny).toContain('Write');
      expect(perms.deny).toContain('Edit');
      expect(perms.deny).toContain('Bash(*)');
    });

    it('coordinator has read/write but no force push or merge to main', () => {
      const perms = getPermissionsForRole('coordinator');
      expect(perms.allow).toContain('Read');
      expect(perms.allow).toContain('Write');
      expect(perms.allow).toContain('Edit');
      expect(perms.deny).toContain('Bash(git push --force *)');
      expect(perms.deny).toContain('Bash(git push * main)');
    });

    it('worker has full dev but no merge, no push to main, no destructive commands', () => {
      const perms = getPermissionsForRole('worker');
      expect(perms.allow).toContain('Write');
      expect(perms.allow).toContain('Edit');
      expect(perms.allow).toContain('Bash(node *)');
      expect(perms.allow).toContain('Bash(npx *)');
      expect(perms.deny).toContain('Bash(git merge *)');
      expect(perms.deny).toContain('Bash(rm -rf *)');
      expect(perms.deny).toContain('Bash(sudo *)');
    });

    it('all roles deny npm (enforce pnpm)', () => {
      for (const role of ['master', 'coordinator', 'worker'] as const) {
        const perms = getPermissionsForRole(role);
        expect(perms.deny).toContain('Bash(npm *)');
      }
    });

    it('all roles deny sudo and shutdown', () => {
      for (const role of ['coordinator', 'worker'] as const) {
        const perms = getPermissionsForRole(role);
        expect(perms.deny).toContain('Bash(sudo *)');
        expect(perms.deny).toContain('Bash(shutdown *)');
      }
    });
  });

  describe('getAllPermissionSummary', () => {
    it('returns counts for all three roles', () => {
      const summary = getAllPermissionSummary();
      expect(summary.master.allowCount).toBeGreaterThan(0);
      expect(summary.master.denyCount).toBeGreaterThan(0);
      expect(summary.coordinator.allowCount).toBeGreaterThan(summary.master.allowCount);
      expect(summary.worker.allowCount).toBeGreaterThan(summary.coordinator.allowCount);
    });

    it('master has fewest permissions', () => {
      const summary = getAllPermissionSummary();
      expect(summary.master.allowCount).toBeLessThan(summary.coordinator.allowCount);
      expect(summary.master.allowCount).toBeLessThan(summary.worker.allowCount);
    });
  });

  describe('generatePermissionBlock', () => {
    it('generates valid YAML-like permission block', () => {
      const block = generatePermissionBlock('worker');
      expect(block).toContain('role: worker');
      expect(block).toContain('allow:');
      expect(block).toContain('deny:');
      expect(block).toContain('"Read"');
    });
  });
});
