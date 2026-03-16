import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('command exports', () => {
  it('statusCommand is exported as a function', async () => {
    const { statusCommand } = await import('../commands/status.js');
    expect(typeof statusCommand).toBe('function');
  });

  it('mcpCommand is exported as a function', async () => {
    const { mcpCommand } = await import('../commands/mcp.js');
    expect(typeof mcpCommand).toBe('function');
  });
});

describe('statusCommand', () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'fishi-test-'));
    originalCwd = process.cwd();
    process.chdir(testDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(testDir, { recursive: true, force: true });
  });

  it('handles missing .fishi directory gracefully', async () => {
    const { statusCommand } = await import('../commands/status.js');
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    // Should not throw
    await statusCommand();
    expect(consoleSpy).toHaveBeenCalled();
    // Should mention that FISHI is not initialized
    const allOutput = consoleSpy.mock.calls.map((c) => String(c[0])).join(' ');
    expect(allOutput).toMatch(/not initialized/i);
    consoleSpy.mockRestore();
  });
});

describe('mcpCommand', () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'fishi-test-'));
    originalCwd = process.cwd();
    process.chdir(testDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(testDir, { recursive: true, force: true });
  });

  it('handles list action on non-existent project gracefully', async () => {
    const { mcpCommand } = await import('../commands/mcp.js');
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    // Should not throw when no .mcp.json exists
    await mcpCommand('list');
    expect(consoleSpy).toHaveBeenCalled();
    const allOutput = consoleSpy.mock.calls.map((c) => String(c[0])).join(' ');
    expect(allOutput).toMatch(/no .mcp.json/i);
    consoleSpy.mockRestore();
  });

  it('handles unknown action gracefully', async () => {
    const { mcpCommand } = await import('../commands/mcp.js');
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await mcpCommand('nonexistent');
    expect(consoleSpy).toHaveBeenCalled();
    const allOutput = consoleSpy.mock.calls.map((c) => String(c[0])).join(' ');
    expect(allOutput).toMatch(/unknown action/i);
    consoleSpy.mockRestore();
  });

  it('add without name shows available MCPs', async () => {
    const { mcpCommand } = await import('../commands/mcp.js');
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await mcpCommand('add');
    expect(consoleSpy).toHaveBeenCalled();
    const allOutput = consoleSpy.mock.calls.map((c) => String(c[0])).join(' ');
    expect(allOutput).toMatch(/usage/i);
    consoleSpy.mockRestore();
  });

  it('lists configured MCPs when .mcp.json exists', async () => {
    writeFileSync(
      join(testDir, '.mcp.json'),
      JSON.stringify({ github: { type: 'http', url: 'https://example.com' } })
    );
    const { mcpCommand } = await import('../commands/mcp.js');
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await mcpCommand('list');
    expect(consoleSpy).toHaveBeenCalled();
    const allOutput = consoleSpy.mock.calls.map((c) => String(c[0])).join(' ');
    expect(allOutput).toMatch(/github/i);
    consoleSpy.mockRestore();
  });
});
