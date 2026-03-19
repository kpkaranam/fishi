#!/usr/bin/env node
// post-edit.mjs — FISHI post-edit hook
// Uses Node.js built-ins + child_process.execSync
import { existsSync, readFileSync } from 'fs';
import { join, extname, resolve } from 'path';
import { execSync } from 'child_process';

const projectRoot = process.env.FISHI_PROJECT_ROOT || process.cwd();

/**
 * Read all of stdin synchronously (Claude Code pipes tool result JSON here).
 */
function readStdin() {
  try {
    return readFileSync('/dev/stdin', 'utf-8');
  } catch {
    try {
      return readFileSync(0, 'utf-8');
    } catch {
      return '';
    }
  }
}

// ── Determine the edited file path ─────────────────────────────────
let editedFile = '';

// Primary: read from stdin (Claude Code pipes tool result as JSON)
const stdinData = readStdin();
if (stdinData) {
  try {
    const toolResult = JSON.parse(stdinData);
    editedFile = toolResult.file_path || toolResult.filePath || toolResult.path || '';
  } catch {
    // stdin wasn't valid JSON — try other sources
  }
}

// Fallback: environment variable or CLI argument
if (!editedFile) {
  editedFile = process.env.FISHI_EDITED_FILE || process.argv[2] || '';
}

if (!editedFile) {
  process.exit(0); // No file specified, nothing to do
}

// Resolve to absolute path
editedFile = resolve(projectRoot, editedFile);

// ── Only lint code files ─────────────────────────────────────────────
const CODE_EXTENSIONS = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.mts', '.cts',
  '.py', '.go', '.rs', '.rb', '.java', '.kt', '.swift', '.vue', '.svelte',
]);
const ext = extname(editedFile).toLowerCase();
if (!CODE_EXTENSIONS.has(ext)) {
  process.exit(0);
}

// ── Skip excluded directories ────────────────────────────────────────
const EXCLUDED_DIRS = ['node_modules', 'dist', 'build', '.fishi', '.claude', '.git', '.next', '__pycache__', '.turbo', 'coverage'];
const normalizedPath = editedFile.replace(/\\/g, '/');
for (const dir of EXCLUDED_DIRS) {
  if (normalizedPath.includes(`/${dir}/`) || normalizedPath.includes(`\\${dir}\\`)) {
    process.exit(0);
  }
}

// ── Only run eslint on JS/TS files ───────────────────────────────────
const LINTABLE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.mts', '.cts', '.vue', '.svelte']);
if (!LINTABLE_EXTENSIONS.has(ext)) {
  // Log non-lintable code edit and exit
  console.log(`[FISHI] Edited: ${editedFile}`);
  process.exit(0);
}

try {
  const pkgPath = join(projectRoot, 'package.json');
  if (!existsSync(pkgPath)) {
    console.log(`[FISHI] Edited: ${editedFile} (no package.json, skipping lint)`);
    process.exit(0);
  }

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  const allDeps = {
    ...(pkg.dependencies || {}),
    ...(pkg.devDependencies || {}),
  };

  if (!('eslint' in allDeps)) {
    console.log(`[FISHI] Edited: ${editedFile} (no eslint configured)`);
    process.exit(0);
  }

  // Prefer local binary, fall back to npx
  const eslintBin = join(projectRoot, 'node_modules', '.bin', 'eslint');
  const eslintCmd = existsSync(eslintBin) ? eslintBin : 'npx eslint';

  console.log(`[FISHI] Linting ${editedFile}...`);
  execSync(`${eslintCmd} --fix "${editedFile}"`, {
    cwd: projectRoot,
    stdio: 'pipe',
    timeout: 15000, // 15s max
  });
  console.log(`[FISHI] Lint passed: ${editedFile}`);
} catch (err) {
  // Log lint output but never block
  if (err.stdout) {
    const stdout = err.stdout.toString().trim();
    if (stdout) console.log(stdout);
  }
  if (err.stderr) {
    const stderr = err.stderr.toString().trim();
    if (stderr) console.error(stderr);
  }
  // Timeout or lint errors — report but don't fail
  if (err.killed) {
    console.warn(`[FISHI] Lint timed out for ${editedFile}`);
  } else {
    console.warn(`[FISHI] Lint issues found in ${editedFile}`);
  }
  process.exit(0);
}
