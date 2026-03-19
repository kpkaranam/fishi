import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  detectDocker,
  readSandboxConfig,
  readSandboxPolicy,
  buildSandboxEnv,
  runInProcessSandbox,
} from '../generators/sandbox';

describe('Sandbox', () => {
  let tempDir: string;

  function createTempDir(): string {
    tempDir = mkdtempSync(join(tmpdir(), 'fishi-sandbox-'));
    mkdirSync(join(tempDir, '.fishi'), { recursive: true });
    return tempDir;
  }

  afterEach(() => {
    if (tempDir) rmSync(tempDir, { recursive: true, force: true });
  });

  describe('detectDocker', () => {
    it('returns a boolean', () => {
      const result = detectDocker();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('readSandboxConfig', () => {
    it('returns process mode when no fishi.yaml exists', () => {
      const dir = createTempDir();
      const config = readSandboxConfig(dir);
      expect(config.mode).toBe('process');
      expect(config.dockerAvailable).toBe(false);
    });

    it('reads mode from fishi.yaml', () => {
      const dir = createTempDir();
      writeFileSync(join(dir, '.fishi', 'fishi.yaml'), 'sandbox:\n  mode: docker\n  docker_available: true\n');
      const config = readSandboxConfig(dir);
      expect(config.mode).toBe('docker');
      expect(config.dockerAvailable).toBe(true);
    });

    it('reads process mode from fishi.yaml', () => {
      const dir = createTempDir();
      writeFileSync(join(dir, '.fishi', 'fishi.yaml'), 'sandbox:\n  mode: process\n  docker_available: false\n');
      const config = readSandboxConfig(dir);
      expect(config.mode).toBe('process');
    });
  });

  describe('readSandboxPolicy', () => {
    it('returns defaults when no policy file exists', () => {
      const dir = createTempDir();
      const policy = readSandboxPolicy(dir);
      expect(policy.timeout).toBe(600);
      expect(policy.memory).toBe('2g');
      expect(policy.cpus).toBe(2);
      expect(policy.networkAllow).toContain('registry.npmjs.org');
      expect(policy.networkAllow).toContain('localhost');
    });

    it('reads custom policy from file', () => {
      const dir = createTempDir();
      writeFileSync(join(dir, '.fishi', 'sandbox-policy.yaml'),
        'network_allow:\n  - api.example.com\n  - localhost\ntimeout: 300\nmemory: "4g"\ncpus: 4\nenv_passthrough:\n  - DATABASE_URL\n  - API_KEY\n');
      const policy = readSandboxPolicy(dir);
      expect(policy.networkAllow).toContain('api.example.com');
      expect(policy.timeout).toBe(300);
      expect(policy.memory).toBe('4g');
      expect(policy.cpus).toBe(4);
      expect(policy.envPassthrough).toContain('DATABASE_URL');
    });
  });

  describe('buildSandboxEnv', () => {
    it('strips all env vars except essentials', () => {
      const policy = { networkAllow: [], envPassthrough: [], timeout: 60, memory: '1g', cpus: 1 };
      const env = buildSandboxEnv(policy);
      expect(env.FISHI_SANDBOX).toBe('true');
      expect(env.NODE_ENV).toBe('development');
      expect(env.PATH).toBeDefined();
      // Should NOT have random env vars
      expect(env.RANDOM_SECRET).toBeUndefined();
    });

    it('passes through allowed env vars', () => {
      process.env.TEST_SANDBOX_VAR = 'test-value';
      const policy = { networkAllow: [], envPassthrough: ['TEST_SANDBOX_VAR'], timeout: 60, memory: '1g', cpus: 1 };
      const env = buildSandboxEnv(policy);
      expect(env.TEST_SANDBOX_VAR).toBe('test-value');
      delete process.env.TEST_SANDBOX_VAR;
    });
  });

  describe('runInProcessSandbox', () => {
    it('runs a command and returns stdout', () => {
      const dir = createTempDir();
      const result = runInProcessSandbox('node', ['-e', 'console.log("hello sandbox")'], dir, {
        networkAllow: [], envPassthrough: [], timeout: 10, memory: '1g', cpus: 1,
      });
      expect(result.stdout.trim()).toBe('hello sandbox');
      expect(result.exitCode).toBe(0);
      expect(result.timedOut).toBe(false);
    });

    it('returns exit code on failure', () => {
      const dir = createTempDir();
      const result = runInProcessSandbox('node', ['-e', 'process.exit(42)'], dir, {
        networkAllow: [], envPassthrough: [], timeout: 10, memory: '1g', cpus: 1,
      });
      expect(result.exitCode).toBe(42);
    });

    it('strips environment variables', () => {
      const dir = createTempDir();
      process.env.SUPER_SECRET = 'should-not-leak';
      const result = runInProcessSandbox('node', ['-e', 'console.log(process.env.SUPER_SECRET || "not-found")'], dir, {
        networkAllow: [], envPassthrough: [], timeout: 10, memory: '1g', cpus: 1,
      });
      expect(result.stdout.trim()).toBe('not-found');
      delete process.env.SUPER_SECRET;
    });

    it('passes through allowed env vars', () => {
      const dir = createTempDir();
      process.env.ALLOWED_VAR = 'allowed-value';
      const result = runInProcessSandbox('node', ['-e', 'console.log(process.env.ALLOWED_VAR)'], dir, {
        networkAllow: [], envPassthrough: ['ALLOWED_VAR'], timeout: 10, memory: '1g', cpus: 1,
      });
      expect(result.stdout.trim()).toBe('allowed-value');
      delete process.env.ALLOWED_VAR;
    });

    it('detects FISHI_SANDBOX env inside sandbox', () => {
      const dir = createTempDir();
      const result = runInProcessSandbox('node', ['-e', 'console.log(process.env.FISHI_SANDBOX)'], dir, {
        networkAllow: [], envPassthrough: [], timeout: 10, memory: '1g', cpus: 1,
      });
      expect(result.stdout.trim()).toBe('true');
    });

    it('times out long-running commands', () => {
      const dir = createTempDir();
      const result = runInProcessSandbox('node', ['-e', 'setTimeout(() => {}, 60000)'], dir, {
        networkAllow: [], envPassthrough: [], timeout: 1, memory: '1g', cpus: 1,
      });
      expect(result.timedOut).toBe(true);
    });
  });
});
