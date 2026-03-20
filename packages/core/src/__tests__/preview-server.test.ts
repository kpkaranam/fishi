import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { detectDevServer, getVibeModeConfig } from '../generators/preview-server';

describe('Preview Server', () => {
  let tempDir: string;

  function createTempDir(): string {
    tempDir = mkdtempSync(join(tmpdir(), 'fishi-preview-'));
    return tempDir;
  }

  afterEach(() => {
    if (tempDir) rmSync(tempDir, { recursive: true, force: true });
  });

  describe('detectDevServer', () => {
    it('returns custom command when provided', () => {
      const dir = createTempDir();
      const config = detectDevServer(dir, 'npx vite --port 8080');
      expect(config.command).toBe('npx');
      expect(config.args).toEqual(['vite', '--port', '8080']);
      expect(config.framework).toBe('custom');
      expect(config.detected).toBe(true);
    });

    it('detects npm run dev from package.json', () => {
      const dir = createTempDir();
      writeFileSync(join(dir, 'package.json'), JSON.stringify({
        scripts: { dev: 'next dev' },
        dependencies: { next: '^14.0.0' },
      }));
      const config = detectDevServer(dir);
      expect(config.command).toBe('npm');
      expect(config.args).toEqual(['run', 'dev']);
      expect(config.framework).toBe('nextjs');
      expect(config.detected).toBe(true);
    });

    it('falls back to start script', () => {
      const dir = createTempDir();
      writeFileSync(join(dir, 'package.json'), JSON.stringify({
        scripts: { start: 'node server.js' },
      }));
      const config = detectDevServer(dir);
      expect(config.command).toBe('npm');
      expect(config.args).toEqual(['run', 'start']);
      expect(config.detected).toBe(true);
    });

    it('detects Next.js from dependencies', () => {
      const dir = createTempDir();
      writeFileSync(join(dir, 'package.json'), JSON.stringify({
        dependencies: { next: '^14.0.0' },
      }));
      const config = detectDevServer(dir);
      expect(config.framework).toBe('nextjs');
      expect(config.port).toBe(3000);
      expect(config.detected).toBe(true);
    });

    it('detects Vite from dependencies', () => {
      const dir = createTempDir();
      writeFileSync(join(dir, 'package.json'), JSON.stringify({
        devDependencies: { vite: '^5.0.0' },
      }));
      const config = detectDevServer(dir);
      expect(config.framework).toBe('vite');
      expect(config.port).toBe(5173);
    });

    it('detects Astro from dependencies', () => {
      const dir = createTempDir();
      writeFileSync(join(dir, 'package.json'), JSON.stringify({
        dependencies: { astro: '^4.0.0' },
      }));
      const config = detectDevServer(dir);
      expect(config.framework).toBe('astro');
      expect(config.port).toBe(4321);
    });

    it('detects Django from manage.py', () => {
      const dir = createTempDir();
      writeFileSync(join(dir, 'manage.py'), '#!/usr/bin/env python');
      const config = detectDevServer(dir);
      expect(config.framework).toBe('django');
      expect(config.port).toBe(8000);
    });

    it('detects Flask from requirements.txt', () => {
      const dir = createTempDir();
      writeFileSync(join(dir, 'requirements.txt'), 'flask==3.0.0\n');
      const config = detectDevServer(dir);
      expect(config.framework).toBe('flask');
      expect(config.port).toBe(5000);
    });

    it('returns detected=false when no framework found', () => {
      const dir = createTempDir();
      const config = detectDevServer(dir);
      expect(config.detected).toBe(false);
      expect(config.framework).toBe('unknown');
    });

    it('extracts port from dev command', () => {
      const dir = createTempDir();
      writeFileSync(join(dir, 'package.json'), JSON.stringify({
        scripts: { dev: 'vite --port 8080' },
      }));
      const config = detectDevServer(dir);
      expect(config.port).toBe(8080);
    });
  });

  describe('getVibeModeConfig', () => {
    it('returns enabled config', () => {
      const config = getVibeModeConfig(true);
      expect(config).toContain('enabled: true');
      expect(config).toContain('auto_approve_gates: true');
      expect(config).toContain('dev_server_autostart: true');
    });

    it('returns disabled config', () => {
      const config = getVibeModeConfig(false);
      expect(config).toContain('enabled: false');
    });
  });
});
