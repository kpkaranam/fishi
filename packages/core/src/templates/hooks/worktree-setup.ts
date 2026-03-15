/**
 * Worktree Setup Hook Template
 *
 * Generates an .mjs hook that fires on worktree creation. It copies
 * environment files (.env, .env.local) to the new worktree, detects the
 * package manager from lock files, and runs dependency installation with
 * a 60-second timeout.
 */
export function getWorktreeSetupHook(): string {
  return `#!/usr/bin/env node
// worktree-setup.mjs — FISHI worktree setup hook
// Uses Node.js built-ins + child_process
import { existsSync, copyFileSync, readFileSync, statSync } from 'fs';
import { join, basename } from 'path';
import { execSync } from 'child_process';

const projectRoot = process.env.FISHI_PROJECT_ROOT || process.cwd();
const worktreePath = process.env.FISHI_WORKTREE_PATH || process.argv[2] || '';

if (!worktreePath) {
  console.error('[FISHI] No worktree path provided.');
  process.exit(0); // Non-fatal — don't crash
}

if (!existsSync(worktreePath)) {
  console.error(\`[FISHI] Worktree path does not exist: \${worktreePath}\`);
  process.exit(0); // Non-fatal — worktree may not be created yet
}

try {
  // ── Copy environment files ───────────────────────────────────────────
  const envFiles = ['.env', '.env.local', '.env.development', '.env.development.local'];
  let copiedCount = 0;
  for (const envFile of envFiles) {
    const src = join(projectRoot, envFile);
    const dest = join(worktreePath, envFile);
    if (existsSync(src) && !existsSync(dest)) {
      try {
        copyFileSync(src, dest);
        console.log(\`[FISHI] Copied \${envFile} to worktree.\`);
        copiedCount++;
      } catch (err) {
        console.warn(\`[FISHI] Failed to copy \${envFile}: \${err.message}\`);
      }
    }
  }
  if (copiedCount === 0) {
    console.log('[FISHI] No environment files to copy.');
  }

  // ── Detect package manager and install dependencies ──────────────────
  const pkgPath = join(worktreePath, 'package.json');
  if (!existsSync(pkgPath)) {
    console.log('[FISHI] No package.json found in worktree. Skipping install.');
    console.log(\`[FISHI] Worktree setup complete: \${worktreePath}\`);
    process.exit(0);
  }

  // Detect package manager from lock files (check worktree first, then root)
  const lockFileMap = [
    ['pnpm-lock.yaml', 'pnpm install --frozen-lockfile'],
    ['yarn.lock',      'yarn install --frozen-lockfile'],
    ['bun.lockb',      'bun install --frozen-lockfile'],
    ['package-lock.json', 'npm ci'],
  ];

  let installCmd = 'npm install'; // default fallback
  let detectedPm = 'npm';

  for (const [lockFile, cmd] of lockFileMap) {
    if (existsSync(join(worktreePath, lockFile)) || existsSync(join(projectRoot, lockFile))) {
      installCmd = cmd;
      detectedPm = lockFile.split(/[-.]/).shift();
      break;
    }
  }

  // Also check packageManager field in package.json
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    if (pkg.packageManager) {
      const pm = pkg.packageManager.split('@')[0];
      if (['pnpm', 'yarn', 'bun', 'npm'].includes(pm)) {
        detectedPm = pm;
        installCmd = \`\${pm} install\`;
      }
    }
  } catch { /* ignore parse errors */ }

  console.log(\`[FISHI] Detected package manager: \${detectedPm}\`);
  console.log(\`[FISHI] Running \${installCmd} in worktree...\`);

  try {
    execSync(installCmd, {
      cwd: worktreePath,
      stdio: 'inherit',
      timeout: 60000, // 60-second timeout per spec
    });
    console.log('[FISHI] Dependencies installed successfully.');
  } catch (installErr) {
    if (installErr.killed) {
      console.error('[FISHI] Dependency installation timed out (60s limit).');
    } else {
      console.error(\`[FISHI] Dependency installation failed: \${installErr.message}\`);
    }
    // Non-fatal — worktree is still usable without deps
  }

  console.log(\`[FISHI] Worktree setup complete: \${worktreePath}\`);
} catch (err) {
  console.error(\`[FISHI] Worktree setup error: \${err.message}\`);
  process.exit(0); // Non-fatal
}
`;
}
