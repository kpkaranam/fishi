// packages/core/src/__tests__/backup-manager.test.ts
import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { createBackup, type BackupManifest } from '../generators/backup-manager';

describe('createBackup', () => {
  let tempDir: string;

  function createTempDir(): string {
    tempDir = mkdtempSync(join(tmpdir(), 'fishi-backup-'));
    return tempDir;
  }

  afterEach(() => {
    if (tempDir) rmSync(tempDir, { recursive: true, force: true });
  });

  it('creates backup directory with timestamp', async () => {
    const dir = createTempDir();
    mkdirSync(join(dir, '.claude'), { recursive: true });
    writeFileSync(join(dir, '.claude', 'CLAUDE.md'), '# existing');

    const backupPath = await createBackup(dir, ['.claude/CLAUDE.md']);
    expect(existsSync(backupPath)).toBe(true);
    const dirName = backupPath.split(/[/\\]/).pop()!;
    expect(dirName).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}$/);
  });

  it('copies files preserving directory structure', async () => {
    const dir = createTempDir();
    mkdirSync(join(dir, '.claude', 'agents'), { recursive: true });
    writeFileSync(join(dir, '.claude', 'CLAUDE.md'), '# project instructions');
    writeFileSync(join(dir, '.claude', 'agents', 'my-agent.md'), '# agent');

    const backupPath = await createBackup(dir, [
      '.claude/CLAUDE.md',
      '.claude/agents/my-agent.md',
    ]);

    expect(readFileSync(join(backupPath, '.claude', 'CLAUDE.md'), 'utf-8')).toBe('# project instructions');
    expect(readFileSync(join(backupPath, '.claude', 'agents', 'my-agent.md'), 'utf-8')).toBe('# agent');
  });

  it('writes manifest.json with file list', async () => {
    const dir = createTempDir();
    writeFileSync(join(dir, '.mcp.json'), '{"mcpServers":{}}');

    const backupPath = await createBackup(dir, ['.mcp.json']);
    const manifest: BackupManifest = JSON.parse(
      readFileSync(join(backupPath, 'manifest.json'), 'utf-8')
    );

    expect(manifest.timestamp).toBeDefined();
    expect(manifest.fishi_version).toBeDefined();
    expect(manifest.files).toHaveLength(1);
    expect(manifest.files[0].path).toBe('.mcp.json');
    expect(manifest.files[0].size).toBeGreaterThan(0);
  });

  it('backup restores original content byte-for-byte', async () => {
    const dir = createTempDir();
    const original = '{\n  "hooks": {},\n  "permissions": {}\n}';
    mkdirSync(join(dir, '.claude'), { recursive: true });
    writeFileSync(join(dir, '.claude', 'settings.json'), original);

    const backupPath = await createBackup(dir, ['.claude/settings.json']);
    const restored = readFileSync(join(backupPath, '.claude', 'settings.json'), 'utf-8');
    expect(restored).toBe(original);
  });

  it('handles empty file list gracefully', async () => {
    const dir = createTempDir();
    const backupPath = await createBackup(dir, []);
    const manifest: BackupManifest = JSON.parse(
      readFileSync(join(backupPath, 'manifest.json'), 'utf-8')
    );
    expect(manifest.files).toHaveLength(0);
  });

  it('creates backup inside .fishi/backup/', async () => {
    const dir = createTempDir();
    writeFileSync(join(dir, '.mcp.json'), '{}');
    const backupPath = await createBackup(dir, ['.mcp.json']);
    expect(backupPath.replace(/\\/g, '/')).toContain('.fishi/backup/');
  });
});
