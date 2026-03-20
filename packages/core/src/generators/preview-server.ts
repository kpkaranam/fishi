import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { spawn, type ChildProcess } from 'child_process';

export interface DevServerConfig {
  command: string;
  args: string[];
  port: number;
  framework: string;
  detected: boolean;
}

/**
 * Detect the dev server command from package.json scripts or framework detection.
 */
export function detectDevServer(projectDir: string, customCmd?: string): DevServerConfig {
  // Custom command override
  if (customCmd) {
    const parts = customCmd.split(/\s+/);
    return {
      command: parts[0],
      args: parts.slice(1),
      port: 3000,
      framework: 'custom',
      detected: true,
    };
  }

  const pkgPath = join(projectDir, 'package.json');
  if (!existsSync(pkgPath)) {
    // Python detection (no package.json)
    if (existsSync(join(projectDir, 'manage.py'))) {
      return { command: 'python', args: ['manage.py', 'runserver'], port: 8000, framework: 'django', detected: true };
    }
    if (existsSync(join(projectDir, 'requirements.txt'))) {
      const reqs = readFileSync(join(projectDir, 'requirements.txt'), 'utf-8');
      if (reqs.includes('flask')) return { command: 'python', args: ['-m', 'flask', 'run'], port: 5000, framework: 'flask', detected: true };
      if (reqs.includes('fastapi')) return { command: 'uvicorn', args: ['main:app', '--reload'], port: 8000, framework: 'fastapi', detected: true };
    }

    return { command: '', args: [], port: 3000, framework: 'unknown', detected: false };
  }

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  const scripts = pkg.scripts || {};

  // Check for dev script
  if (scripts.dev) {
    const devCmd = scripts.dev;
    const port = extractPort(devCmd) || 3000;
    const framework = detectFrameworkFromCmd(devCmd, pkg);
    // Use npm/npx to run the dev script
    return { command: 'npm', args: ['run', 'dev'], port, framework, detected: true };
  }

  // Check for start script
  if (scripts.start) {
    const port = extractPort(scripts.start) || 3000;
    const framework = detectFrameworkFromCmd(scripts.start, pkg);
    return { command: 'npm', args: ['run', 'start'], port, framework, detected: true };
  }

  // Framework detection from dependencies
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };

  if (deps['next']) return { command: 'npx', args: ['next', 'dev'], port: 3000, framework: 'nextjs', detected: true };
  if (deps['vite']) return { command: 'npx', args: ['vite'], port: 5173, framework: 'vite', detected: true };
  if (deps['astro']) return { command: 'npx', args: ['astro', 'dev'], port: 4321, framework: 'astro', detected: true };
  if (deps['nuxt']) return { command: 'npx', args: ['nuxt', 'dev'], port: 3000, framework: 'nuxt', detected: true };
  if (deps['svelte-kit'] || deps['@sveltejs/kit']) return { command: 'npx', args: ['vite', 'dev'], port: 5173, framework: 'sveltekit', detected: true };
  if (deps['gatsby']) return { command: 'npx', args: ['gatsby', 'develop'], port: 8000, framework: 'gatsby', detected: true };
  if (deps['remix'] || deps['@remix-run/dev']) return { command: 'npx', args: ['remix', 'vite:dev'], port: 5173, framework: 'remix', detected: true };
  if (deps['express']) return { command: 'node', args: ['index.js'], port: 3000, framework: 'express', detected: true };

  // Python detection (with package.json present too)
  if (existsSync(join(projectDir, 'manage.py'))) {
    return { command: 'python', args: ['manage.py', 'runserver'], port: 8000, framework: 'django', detected: true };
  }
  if (existsSync(join(projectDir, 'requirements.txt'))) {
    const reqs = readFileSync(join(projectDir, 'requirements.txt'), 'utf-8');
    if (reqs.includes('flask')) return { command: 'python', args: ['-m', 'flask', 'run'], port: 5000, framework: 'flask', detected: true };
    if (reqs.includes('fastapi')) return { command: 'uvicorn', args: ['main:app', '--reload'], port: 8000, framework: 'fastapi', detected: true };
  }

  return { command: '', args: [], port: 3000, framework: 'unknown', detected: false };
}

function extractPort(cmd: string): number | null {
  // Match --port 3000, -p 3000, PORT=3000, :3000
  const portMatch = cmd.match(/(?:--port|-p)\s+(\d+)/) || cmd.match(/PORT=(\d+)/) || cmd.match(/:(\d{4,5})/);
  return portMatch ? parseInt(portMatch[1], 10) : null;
}

function detectFrameworkFromCmd(cmd: string, _pkg: any): string {
  if (cmd.includes('next')) return 'nextjs';
  if (cmd.includes('vite')) return 'vite';
  if (cmd.includes('astro')) return 'astro';
  if (cmd.includes('nuxt')) return 'nuxt';
  if (cmd.includes('gatsby')) return 'gatsby';
  if (cmd.includes('remix')) return 'remix';
  if (cmd.includes('svelte')) return 'sveltekit';
  if (cmd.includes('express') || cmd.includes('node server')) return 'express';
  if (cmd.includes('flask')) return 'flask';
  if (cmd.includes('django') || cmd.includes('manage.py')) return 'django';
  if (cmd.includes('uvicorn') || cmd.includes('fastapi')) return 'fastapi';
  return 'unknown';
}

/**
 * Start the dev server as a background process.
 * Returns the child process handle.
 */
export function startDevServer(
  projectDir: string,
  config: DevServerConfig
): ChildProcess {
  const child = spawn(config.command, config.args, {
    cwd: projectDir,
    stdio: 'pipe',
    detached: false,
    env: { ...process.env, PORT: String(config.port) },
    shell: true,
  });
  return child;
}

/**
 * Get the vibe mode config for fishi.yaml.
 */
export function getVibeModeConfig(enabled: boolean): string {
  return `
vibe_mode:
  enabled: ${enabled}
  auto_approve_gates: ${enabled}
  auto_generate_prd: ${enabled}
  background_testing: ${enabled}
  dev_server_autostart: ${enabled}
`;
}
