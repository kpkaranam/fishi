/**
 * Worktree Manager Script Template
 *
 * Generates an .mjs CLI utility that manages git worktree lifecycle for
 * agent tasks. Zero dependencies — Node.js built-ins only.
 *
 * Commands: create, status, review, merge, cleanup
 */
export function getWorktreeManagerScript(): string {
  return `#!/usr/bin/env node
// worktree-manager.mjs — FISHI worktree lifecycle manager
// Uses Node.js built-ins only (fs, path, child_process)
import { existsSync, copyFileSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';
import { execSync } from 'child_process';

// ── Helpers ──────────────────────────────────────────────────────────

const ROOT = process.env.FISHI_PROJECT_ROOT || process.cwd();

function run(cmd, opts = {}) {
  return execSync(cmd, { cwd: ROOT, encoding: 'utf-8', ...opts }).trim();
}

function out(obj) {
  process.stdout.write(JSON.stringify(obj, null, 2) + '\\n');
}

function fail(msg) {
  out({ error: msg });
  process.exit(1);
}

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ── Arg parsing ──────────────────────────────────────────────────────

const args = process.argv.slice(2);
const command = args[0];

function flag(name) {
  const idx = args.indexOf('--' + name);
  if (idx === -1 || idx + 1 >= args.length) return undefined;
  return args[idx + 1];
}

// ── YAML helpers (minimal, no deps) ──────────────────────────────────

const REGISTRY_PATH = join(ROOT, '.fishi', 'state', 'agent-registry.yaml');

function readRegistry() {
  if (!existsSync(REGISTRY_PATH)) return '';
  return readFileSync(REGISTRY_PATH, 'utf-8');
}

function writeRegistry(content) {
  const dir = join(ROOT, '.fishi', 'state');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(REGISTRY_PATH, content, 'utf-8');
}

function appendWorktreeEntry(agent, task, coordinator, branch, worktreePath) {
  let content = readRegistry();

  // Ensure worktrees section exists
  if (!content.includes('worktrees:')) {
    content += '\\nworktrees:\\n';
  }

  const entry = [
    \`  - agent: \${agent}\`,
    \`    task: \${task}\`,
    \`    coordinator: \${coordinator}\`,
    \`    branch: \${branch}\`,
    \`    worktree: \${worktreePath}\`,
    \`    status: active\`,
    \`    created: \${new Date().toISOString()}\`,
  ].join('\\n');

  content += entry + '\\n';
  writeRegistry(content);
}

function removeWorktreeEntry(worktreeName) {
  let content = readRegistry();
  // Remove the block that contains the matching worktree line
  // Split into lines, find the entry block, remove it
  const lines = content.split('\\n');
  const result = [];
  let skip = false;
  let skipIndent = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Detect start of a worktree entry (line starting with "  - agent:")
    if (line.match(/^\\s+-\\s+agent:/)) {
      // Look ahead to see if this block contains our worktree
      let blockEnd = i + 1;
      let blockLines = [line];
      while (blockEnd < lines.length && lines[blockEnd].match(/^\\s+\\w/) && !lines[blockEnd].match(/^\\s+-\\s+agent:/)) {
        blockLines.push(lines[blockEnd]);
        blockEnd++;
      }
      const blockText = blockLines.join('\\n');
      if (blockText.includes(worktreeName)) {
        // Skip this block
        i = blockEnd - 1;
        continue;
      }
    }
    result.push(line);
  }

  writeRegistry(result.join('\\n'));
}

// ── Commands ─────────────────────────────────────────────────────────

function cmdCreate() {
  const agent = flag('agent');
  const task = flag('task');
  const coordinator = flag('coordinator') || 'dev-lead';

  if (!agent || !task) {
    fail('Usage: worktree-manager.mjs create --agent <name> --task <slug> [--coordinator <name>]');
  }

  const agentSlug = slugify(agent);
  const taskSlug = slugify(task);
  const coordinatorSlug = slugify(coordinator);
  const branch = \`agent/\${coordinatorSlug}/\${agentSlug}/\${taskSlug}\`;
  const treeName = \`agent-\${agentSlug}-\${taskSlug}\`;
  const treePath = join('.trees', treeName);
  const absTreePath = join(ROOT, treePath);

  if (existsSync(absTreePath)) {
    fail(\`Worktree already exists: \${treePath}\`);
  }

  // Ensure .trees directory exists
  const treesDir = join(ROOT, '.trees');
  if (!existsSync(treesDir)) {
    mkdirSync(treesDir, { recursive: true });
  }

  // Determine base branch — prefer dev, fall back to main/master
  let baseBranch = 'dev';
  try {
    run('git rev-parse --verify dev');
  } catch {
    try {
      run('git rev-parse --verify main');
      baseBranch = 'main';
    } catch {
      baseBranch = 'master';
    }
  }

  // Create the worktree with a new branch
  try {
    run(\`git worktree add -b \${branch} \${treePath} \${baseBranch}\`);
  } catch (err) {
    fail(\`Failed to create worktree: \${err.message}\`);
  }

  // Copy .env files
  for (const envFile of ['.env', '.env.local']) {
    const src = join(ROOT, envFile);
    const dest = join(absTreePath, envFile);
    if (existsSync(src)) {
      try {
        copyFileSync(src, dest);
      } catch {
        // Non-fatal
      }
    }
  }

  // Update agent registry
  appendWorktreeEntry(agentSlug, taskSlug, coordinatorSlug, branch, treePath);

  out({
    worktree: treePath,
    branch,
    agent: agentSlug,
    task: taskSlug,
    coordinator: coordinatorSlug,
    status: 'created',
  });
}

function cmdStatus() {
  let rawList;
  try {
    rawList = run('git worktree list --porcelain');
  } catch {
    rawList = run('git worktree list');
  }

  const registryContent = readRegistry();
  const worktrees = [];

  // Parse porcelain output
  const blocks = rawList.split('\\n\\n').filter(Boolean);
  for (const block of blocks) {
    const lines = block.split('\\n');
    const entry = {};
    for (const line of lines) {
      if (line.startsWith('worktree ')) entry.path = line.slice(9);
      if (line.startsWith('branch ')) entry.branch = line.slice(7).replace('refs/heads/', '');
      if (line === 'bare') entry.bare = true;
      if (line.startsWith('HEAD ')) entry.head = line.slice(5);
    }

    if (entry.bare) continue;

    // Match with registry for agent/task info
    const branchParts = (entry.branch || '').split('/');
    if (branchParts[0] === 'agent' && branchParts.length >= 4) {
      entry.coordinator = branchParts[1];
      entry.agent = branchParts[2];
      entry.task = branchParts.slice(3).join('/');
      entry.status = 'active';
    }

    worktrees.push(entry);
  }

  out(worktrees);
}

function cmdReview() {
  const worktreeName = flag('worktree');
  if (!worktreeName) {
    fail('Usage: worktree-manager.mjs review --worktree <name>');
  }

  // Find the branch for this worktree
  const treePath = join('.trees', worktreeName);
  let branch;
  try {
    branch = run(\`git -C \${treePath} rev-parse --abbrev-ref HEAD\`);
  } catch {
    fail(\`Could not determine branch for worktree: \${treePath}\`);
  }

  // Determine base branch
  let baseBranch = 'dev';
  try {
    run('git rev-parse --verify dev');
  } catch {
    try {
      run('git rev-parse --verify main');
      baseBranch = 'main';
    } catch {
      baseBranch = 'master';
    }
  }

  // Get diff stats
  let diffStat;
  try {
    diffStat = run(\`git diff --stat \${baseBranch}...\${branch}\`);
  } catch {
    diffStat = '';
  }

  // Get full diff for analysis
  let fullDiff;
  try {
    fullDiff = run(\`git diff \${baseBranch}...\${branch}\`);
  } catch {
    fullDiff = '';
  }

  // Count files changed
  let filesChanged = 0;
  let linesAdded = 0;
  let linesRemoved = 0;

  try {
    const numstat = run(\`git diff --numstat \${baseBranch}...\${branch}\`);
    for (const line of numstat.split('\\n').filter(Boolean)) {
      const [added, removed] = line.split('\\t');
      filesChanged++;
      if (added !== '-') linesAdded += parseInt(added, 10) || 0;
      if (removed !== '-') linesRemoved += parseInt(removed, 10) || 0;
    }
  } catch {
    // Ignore
  }

  // Check for test files in diff
  const hasTests = /\\.(test|spec)\\.(ts|js|tsx|jsx|mjs)|__tests__|\\/test\\//.test(fullDiff);

  // Build summary from stat output
  const diffSummary = diffStat
    .split('\\n')
    .slice(-1)[0] || \`\${filesChanged} files changed\`;

  out({
    branch,
    base: baseBranch,
    files_changed: filesChanged,
    lines_added: linesAdded,
    lines_removed: linesRemoved,
    has_tests: hasTests,
    diff_summary: diffSummary.trim(),
  });
}

function cmdMerge() {
  const worktreeName = flag('worktree');
  if (!worktreeName) {
    fail('Usage: worktree-manager.mjs merge --worktree <name>');
  }

  const treePath = join('.trees', worktreeName);
  let branch;
  try {
    branch = run(\`git -C \${treePath} rev-parse --abbrev-ref HEAD\`);
  } catch {
    fail(\`Could not determine branch for worktree: \${treePath}\`);
  }

  // Determine target branch
  let targetBranch = 'dev';
  try {
    run('git rev-parse --verify dev');
  } catch {
    try {
      run('git rev-parse --verify main');
      targetBranch = 'main';
    } catch {
      targetBranch = 'master';
    }
  }

  // Checkout target branch in main repo and merge
  try {
    run(\`git checkout \${targetBranch}\`);
    run(\`git merge --no-ff \${branch} -m "Merge \${branch} into \${targetBranch}"\`);
  } catch (err) {
    fail(\`Merge failed: \${err.message}\`);
  }

  out({
    merged: branch,
    into: targetBranch,
    status: 'success',
  });
}

function cmdCleanup() {
  const worktreeName = flag('worktree');
  if (!worktreeName) {
    fail('Usage: worktree-manager.mjs cleanup --worktree <name>');
  }

  const treePath = join('.trees', worktreeName);
  const absTreePath = join(ROOT, treePath);

  // Get the branch name before removing
  let branch;
  try {
    branch = run(\`git -C \${treePath} rev-parse --abbrev-ref HEAD\`);
  } catch {
    // Worktree may already be partially removed
    branch = null;
  }

  // Remove worktree
  try {
    run(\`git worktree remove \${treePath} --force\`);
  } catch (err) {
    // Try manual cleanup if git worktree remove fails
    try {
      run(\`git worktree prune\`);
    } catch {
      // Ignore
    }
  }

  // Delete the branch
  if (branch && branch !== 'HEAD') {
    try {
      run(\`git branch -d \${branch}\`);
    } catch {
      // Branch may have unmerged changes — try force delete
      try {
        run(\`git branch -D \${branch}\`);
      } catch {
        // Ignore — branch may already be gone
      }
    }
  }

  // Update registry
  removeWorktreeEntry(worktreeName);

  out({
    removed: treePath,
    branch: branch || 'unknown',
    status: 'cleaned',
  });
}

// ── Dispatch ─────────────────────────────────────────────────────────

switch (command) {
  case 'create':
    cmdCreate();
    break;
  case 'status':
    cmdStatus();
    break;
  case 'review':
    cmdReview();
    break;
  case 'merge':
    cmdMerge();
    break;
  case 'cleanup':
    cmdCleanup();
    break;
  default:
    out({
      error: \`Unknown command: \${command || '(none)'}\`,
      usage: 'worktree-manager.mjs <create|status|review|merge|cleanup> [options]',
      commands: {
        create: '--agent <name> --task <slug> [--coordinator <name>]',
        status: '(no args)',
        review: '--worktree <name>',
        merge: '--worktree <name>',
        cleanup: '--worktree <name>',
      },
    });
    process.exit(1);
}
`;
}
