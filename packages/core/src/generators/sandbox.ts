import { execSync, execFileSync, spawn, type ChildProcess } from 'child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

export type SandboxMode = 'docker' | 'process';

export interface SandboxConfig {
  mode: SandboxMode;
  dockerAvailable: boolean;
}

export interface SandboxPolicy {
  networkAllow: string[];     // allowed domains/IPs
  envPassthrough: string[];   // env vars to pass into sandbox
  timeout: number;            // max seconds per command
  memory: string;             // Docker memory limit e.g. '2g'
  cpus: number;               // Docker CPU limit
}

export interface SandboxRunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  timedOut: boolean;
}

const DEFAULT_POLICY: SandboxPolicy = {
  networkAllow: ['registry.npmjs.org', 'localhost', '127.0.0.1'],
  envPassthrough: [],
  timeout: 600, // 10 minutes
  memory: '2g',
  cpus: 2,
};

/**
 * Detect if Docker is installed and running.
 */
export function detectDocker(): boolean {
  try {
    execSync('docker info', { stdio: 'pipe', timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Read sandbox config from .fishi/fishi.yaml
 */
export function readSandboxConfig(projectDir: string): SandboxConfig {
  const yamlPath = join(projectDir, '.fishi', 'fishi.yaml');
  if (!existsSync(yamlPath)) {
    return { mode: 'process', dockerAvailable: false };
  }
  const content = readFileSync(yamlPath, 'utf-8');
  const modeMatch = content.match(/^\s*mode:\s*(docker|process)/m);
  const dockerMatch = content.match(/^\s*docker_available:\s*(true|false)/m);
  return {
    mode: (modeMatch?.[1] as SandboxMode) || 'process',
    dockerAvailable: dockerMatch?.[1] === 'true',
  };
}

/**
 * Read sandbox policy from .fishi/sandbox-policy.yaml, or return defaults.
 */
export function readSandboxPolicy(projectDir: string): SandboxPolicy {
  const policyPath = join(projectDir, '.fishi', 'sandbox-policy.yaml');
  if (!existsSync(policyPath)) return { ...DEFAULT_POLICY };

  const content = readFileSync(policyPath, 'utf-8');

  // Simple YAML parsing for our known fields
  const networkAllow = extractYamlList(content, 'network_allow') || DEFAULT_POLICY.networkAllow;
  const envPassthrough = extractYamlList(content, 'env_passthrough') || DEFAULT_POLICY.envPassthrough;

  const timeoutMatch = content.match(/^\s*timeout:\s*(\d+)/m);
  const memoryMatch = content.match(/^\s*memory:\s*["']?(\S+?)["']?\s*$/m);
  const cpusMatch = content.match(/^\s*cpus:\s*(\d+)/m);

  return {
    networkAllow,
    envPassthrough,
    timeout: timeoutMatch ? parseInt(timeoutMatch[1], 10) : DEFAULT_POLICY.timeout,
    memory: memoryMatch?.[1] || DEFAULT_POLICY.memory,
    cpus: cpusMatch ? parseInt(cpusMatch[1], 10) : DEFAULT_POLICY.cpus,
  };
}

function extractYamlList(content: string, key: string): string[] | null {
  const regex = new RegExp(`^\\s*${key}:\\s*\\n((?:\\s+-\\s*.+\\n?)*)`, 'm');
  const match = content.match(regex);
  if (!match) return null;
  return match[1].split('\n').map(line => {
    const m = line.match(/^\s*-\s*["']?(.+?)["']?\s*$/);
    return m ? m[1] : '';
  }).filter(Boolean);
}

/**
 * Build a restricted env object for process mode.
 * Strips all env vars except explicitly allowed ones + essentials.
 */
export function buildSandboxEnv(policy: SandboxPolicy): Record<string, string> {
  const env: Record<string, string> = {
    PATH: process.env.PATH || '',
    HOME: process.env.HOME || process.env.USERPROFILE || '',
    NODE_ENV: 'development',
    FISHI_SANDBOX: 'true',
  };

  for (const key of policy.envPassthrough) {
    if (process.env[key]) {
      env[key] = process.env[key]!;
    }
  }

  return env;
}

/**
 * Run a command in process-mode sandbox.
 */
export function runInProcessSandbox(
  command: string,
  args: string[],
  worktreePath: string,
  policy: SandboxPolicy
): SandboxRunResult {
  const env = buildSandboxEnv(policy);
  try {
    const stdout = execFileSync(command, args, {
      cwd: worktreePath,
      encoding: 'utf-8',
      timeout: policy.timeout * 1000,
      env,
      stdio: 'pipe',
      maxBuffer: 10 * 1024 * 1024, // 10MB
    });
    return { stdout, stderr: '', exitCode: 0, timedOut: false };
  } catch (e: any) {
    if (e.killed || e.signal === 'SIGTERM') {
      return { stdout: e.stdout || '', stderr: e.stderr || '', exitCode: 1, timedOut: true };
    }
    return {
      stdout: e.stdout || '',
      stderr: e.stderr || '',
      exitCode: e.status ?? 1,
      timedOut: false,
    };
  }
}

/**
 * Run a command in Docker sandbox.
 */
export function runInDockerSandbox(
  command: string,
  args: string[],
  worktreePath: string,
  policy: SandboxPolicy,
  options: { nodeModulesPath?: string } = {}
): SandboxRunResult {
  const dockerArgs = [
    'run', '--rm',
    '--workdir', '/workspace',
    '-v', `${worktreePath}:/workspace`,
  ];

  // Mount node_modules read-only if provided (brownfield)
  if (options.nodeModulesPath && existsSync(options.nodeModulesPath)) {
    dockerArgs.push('-v', `${options.nodeModulesPath}:/workspace/node_modules:ro`);
  }

  // Memory and CPU limits
  dockerArgs.push('--memory', policy.memory);
  dockerArgs.push('--cpus', String(policy.cpus));

  // Environment
  dockerArgs.push('-e', 'FISHI_SANDBOX=true');
  dockerArgs.push('-e', 'NODE_ENV=development');
  for (const key of policy.envPassthrough) {
    if (process.env[key]) {
      dockerArgs.push('-e', `${key}=${process.env[key]}`);
    }
  }

  // Network restriction (use host network for localhost access, or custom network)
  dockerArgs.push('--network', 'host');

  // Image + command
  dockerArgs.push('fishi-sandbox:latest', command, ...args);

  try {
    const stdout = execFileSync('docker', dockerArgs, {
      encoding: 'utf-8',
      timeout: policy.timeout * 1000,
      stdio: 'pipe',
      maxBuffer: 10 * 1024 * 1024,
    });
    return { stdout, stderr: '', exitCode: 0, timedOut: false };
  } catch (e: any) {
    if (e.killed || e.signal === 'SIGTERM') {
      return { stdout: e.stdout || '', stderr: e.stderr || '', exitCode: 1, timedOut: true };
    }
    return {
      stdout: e.stdout || '',
      stderr: e.stderr || '',
      exitCode: e.status ?? 1,
      timedOut: false,
    };
  }
}

/**
 * Run a command in the configured sandbox mode.
 */
export function runInSandbox(
  command: string,
  args: string[],
  worktreePath: string,
  projectDir: string,
  options: { nodeModulesPath?: string } = {}
): SandboxRunResult {
  const config = readSandboxConfig(projectDir);
  const policy = readSandboxPolicy(projectDir);

  if (config.mode === 'docker' && config.dockerAvailable) {
    return runInDockerSandbox(command, args, worktreePath, policy, options);
  }
  return runInProcessSandbox(command, args, worktreePath, policy);
}
