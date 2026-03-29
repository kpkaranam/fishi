export function getTaskCompletedHook(): string {
  return `#!/usr/bin/env node
// task-completed-hook.mjs — FISHI Task Completion Gate
// Fires on TaskCompleted event.
// Blocks task completion if tests haven't passed.
// Supports: Node.js, Go, Rust, Python projects.

import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const ROOT = process.env.FISHI_PROJECT_ROOT || process.cwd();

// Detect project type and test command
function detectTestCommand() {
  // Node.js — package.json with test script
  const pkgPath = join(ROOT, 'package.json');
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      if (pkg.scripts?.test || pkg.scripts?.['test:unit']) {
        return { type: 'node', cmd: 'npm test' };
      }
    } catch {}
  }

  // Go — go.mod present
  if (existsSync(join(ROOT, 'go.mod'))) {
    // Find Go binary (may not be in PATH in hook context)
    const goPaths = [
      process.env.GOROOT && join(process.env.GOROOT, 'bin', 'go'),
      process.env.GOPATH && join(process.env.GOPATH, 'bin', 'go'),
      '/usr/local/go/bin/go',
      'C:/Program Files/Go/bin/go.exe',
      'C:/Go/bin/go.exe',
    ].filter(Boolean);

    let goCmd = 'go';
    for (const p of goPaths) {
      if (existsSync(p)) { goCmd = p; break; }
    }

    // Check if there are test files
    try {
      const output = execSync(\`\${goCmd} list ./...\`, { cwd: ROOT, encoding: 'utf-8', stdio: 'pipe', timeout: 10000 });
      if (output.trim()) return { type: 'go', cmd: \`\${goCmd} test ./...\` };
    } catch {}
    return { type: 'go', cmd: \`\${goCmd} test ./...\` };
  }

  // Rust — Cargo.toml present
  if (existsSync(join(ROOT, 'Cargo.toml'))) {
    return { type: 'rust', cmd: 'cargo test' };
  }

  // Python — pyproject.toml or setup.py or pytest.ini
  if (existsSync(join(ROOT, 'pyproject.toml')) || existsSync(join(ROOT, 'setup.py'))) {
    if (existsSync(join(ROOT, 'pytest.ini')) || existsSync(join(ROOT, 'pyproject.toml'))) {
      return { type: 'python', cmd: 'python -m pytest' };
    }
    return { type: 'python', cmd: 'python -m unittest discover' };
  }

  // Makefile with test target
  if (existsSync(join(ROOT, 'Makefile'))) {
    try {
      const makefile = readFileSync(join(ROOT, 'Makefile'), 'utf-8');
      if (makefile.includes('test:')) {
        return { type: 'make', cmd: 'make test' };
      }
    } catch {}
  }

  return null; // No test framework detected
}

const detected = detectTestCommand();

if (!detected) {
  console.log('[FISHI] Task completed (no test framework detected)');
  process.exit(0);
}

// Run tests
try {
  // Set PATH to include common tool locations
  const extraPaths = ['/usr/local/go/bin', 'C:/Program Files/Go/bin', join(ROOT, 'node_modules/.bin')];
  const env = { ...process.env, PATH: extraPaths.join(process.platform === 'win32' ? ';' : ':') + (process.platform === 'win32' ? ';' : ':') + (process.env.PATH || '') };

  execSync(detected.cmd, { cwd: ROOT, stdio: 'pipe', timeout: 180000, env });
  console.log(\`[FISHI] Task completed — \${detected.type} tests passed\`);
  process.exit(0);
} catch (e) {
  console.error(\`[FISHI] Tests must pass before completing task (\${detected.type})\`);
  console.error(\`Run: \${detected.cmd}\`);
  process.exit(2);
}
`;
}
