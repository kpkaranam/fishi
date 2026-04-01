/**
 * Worktree Manager Script Template
 *
 * Manages git worktree lifecycle for agent tasks.
 * Worktrees stay alive until sprint-cleanup — merge does NOT remove them.
 *
 * Commands: create, status, review, merge, merge-ready, quick-check, cleanup, sprint-cleanup, verify
 */
export function getWorktreeManagerScript(): string {
  return `#!/usr/bin/env node
// worktree-manager.mjs — FISHI worktree lifecycle manager
// Worktrees persist until sprint-cleanup. Merge keeps worktrees alive.
import { existsSync, copyFileSync, readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync } from 'fs';
import { join, resolve } from 'path';
import { execSync } from 'child_process';

// ── Helpers ──────────────────────────────────────────────────────────

const ROOT = process.env.FISHI_PROJECT_ROOT || process.cwd();

function run(cmd, opts = {}) {
  return execSync(cmd, { cwd: ROOT, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'], ...opts }).trim();
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

function getBaseBranch() {
  try { run('git rev-parse --verify dev'); return 'dev'; } catch {}
  try { run('git rev-parse --verify main'); return 'main'; } catch {}
  return 'master';
}

function ensureOnBaseBranch() {
  const baseBranch = getBaseBranch();
  const current = run('git rev-parse --abbrev-ref HEAD');
  if (current.startsWith('agent/')) {
    try {
      run(\`git checkout \${baseBranch}\`);
      process.stderr.write(\`[FISHI] Main repo was on agent branch \${current} — switched to \${baseBranch}\\n\`);
    } catch {
      fail(\`Main repo is on agent branch \${current} and cannot switch to \${baseBranch}. Fix manually: git checkout \${baseBranch}\`);
    }
  }
  return baseBranch;
}

function isBranchMerged(branch) {
  try {
    const baseBranch = getBaseBranch();
    const merged = execSync(\`git branch --merged \${baseBranch}\`, { cwd: ROOT, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    // git branch output uses prefixes: * = current, + = worktree checkout — strip them
    return merged.split('\\n').map(b => b.replace(/^[*+]\\s*/, '').trim()).includes(branch);
  } catch {
    // git branch --merged can fail on repos with minimal history — treat as merged to avoid blocking cleanup
    return true;
  }
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
const SPRINT_META_PATH = join(ROOT, '.fishi', 'taskboard', 'sprint-meta.yaml');

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
  const lines = content.split('\\n');
  const result = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.match(/^\\s+-\\s+agent:/)) {
      let blockEnd = i + 1;
      let blockLines = [line];
      while (blockEnd < lines.length && lines[blockEnd].match(/^\\s+\\w/) && !lines[blockEnd].match(/^\\s+-\\s+agent:/)) {
        blockLines.push(lines[blockEnd]);
        blockEnd++;
      }
      if (blockLines.join('\\n').includes(worktreeName)) {
        i = blockEnd - 1;
        continue;
      }
    }
    result.push(line);
  }
  writeRegistry(result.join('\\n'));
}

// ── Sprint-meta helpers (minimal YAML for tasks array) ──────────────

function readSprintMeta() {
  if (!existsSync(SPRINT_META_PATH)) return { sprint: 1, qa_full_retries: 0, tasks: [] };
  const raw = readFileSync(SPRINT_META_PATH, 'utf-8');
  const sprintMatch = raw.match(/^sprint:\\s*(\\d+)/m);
  const qaMatch = raw.match(/^qa_full_retries:\\s*(\\d+)/m);
  const sprint = sprintMatch ? parseInt(sprintMatch[1], 10) : 1;
  const qaRetries = qaMatch ? parseInt(qaMatch[1], 10) : 0;

  const tasks = [];
  // Split into task blocks: each starts with "  - id:"
  const taskBlocks = raw.split(/^\\s+-\\s+id:\\s*/m).slice(1);
  for (const block of taskBlocks) {
    const lines = block.split('\\n');
    const id = lines[0].trim();
    const get = (key) => {
      const line = lines.find(l => l.match(new RegExp('^\\\\s+' + key + ':\\\\s')));
      if (!line) return null;
      return line.split(':').slice(1).join(':').trim();
    };
    const depsLine = lines.find(l => l.match(/^\\s+depends_on:/));
    let depends_on = [];
    if (depsLine) {
      const bracketMatch = depsLine.match(/\\[([^\\]]*)\\]/);
      if (bracketMatch && bracketMatch[1].trim()) {
        depends_on = bracketMatch[1].split(',').map(d => d.trim());
      }
    }
    tasks.push({
      id,
      agent: get('agent') || '',
      worktree: get('worktree') || '',
      scope: get('scope') ? get('scope').replace(/^"|"$/g, '') : '',
      depends_on,
      merge_status: get('merge_status') || 'pending',
      qa_quick: get('qa_quick') === 'null' ? null : get('qa_quick'),
      qa_retries: parseInt(get('qa_retries') || '0', 10),
    });
  }
  return { sprint, qa_full_retries: qaRetries, tasks };
}

function writeSprintMeta(meta) {
  const dir = join(ROOT, '.fishi', 'taskboard');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  let yaml = \`sprint: \${meta.sprint}\\nqa_full_retries: \${meta.qa_full_retries}\\ntasks:\\n\`;
  for (const t of meta.tasks) {
    const deps = t.depends_on && t.depends_on.length > 0 ? \`[\${t.depends_on.join(', ')}]\` : '[]';
    yaml += \`  - id: \${t.id}\\n\`;
    yaml += \`    agent: \${t.agent}\\n\`;
    yaml += \`    worktree: \${t.worktree}\\n\`;
    yaml += \`    scope: "\${t.scope || ''}"\\n\`;
    yaml += \`    depends_on: \${deps}\\n\`;
    yaml += \`    merge_status: \${t.merge_status || 'pending'}\\n\`;
    yaml += \`    qa_quick: \${t.qa_quick === null ? 'null' : t.qa_quick}\\n\`;
    yaml += \`    qa_retries: \${t.qa_retries || 0}\\n\`;
  }
  writeFileSync(SPRINT_META_PATH, yaml, 'utf-8');
}

function syncBoardTask(taskId, targetColumn) {
  const boardPath = join(ROOT, '.fishi', 'taskboard', 'board.md');
  if (!existsSync(boardPath)) return;

  let board = readFileSync(boardPath, 'utf-8');

  // Find the task line (matches patterns like "- [ ] TASK-001: ..." or "- [x] auth-api ...")
  // Task IDs are slugified (a-z0-9-), safe to use directly in regex
  const pattern = new RegExp('^(\\\\s*-\\\\s*\\\\[[ x]\\\\]\\\\s*.*' + taskId + '.*)', 'gm');

  const match = board.match(pattern);
  if (!match) return; // Task not found in board

  const taskLine = match[0];

  // Remove the task from its current location
  board = board.replace(taskLine, '');

  // Mark as checked
  const checkedLine = taskLine.replace(/\\[ \\]/, '[x]');

  // Find the target column and append the task
  const columnRegex = new RegExp('^## ' + targetColumn, 'm');
  const columnMatch = board.match(columnRegex);
  if (columnMatch) {
    const insertPos = board.indexOf(columnMatch[0]) + columnMatch[0].length;
    const rest = board.slice(insertPos);
    const nextHeading = rest.match(/^## /m);
    const insertAt = nextHeading ? insertPos + nextHeading.index : board.length;
    board = board.slice(0, insertAt).trimEnd() + '\\n' + checkedLine.trim() + '\\n\\n' + board.slice(insertAt);
  }

  // Clean up extra blank lines
  board = board.replace(/\\n{3,}/g, '\\n\\n');

  writeFileSync(boardPath, board, 'utf-8');
}

function detectCycle(tasks, newId, newDeps) {
  // Build adjacency: task -> depends_on
  const graph = {};
  for (const t of tasks) {
    graph[t.id] = t.depends_on || [];
  }
  graph[newId] = newDeps;

  // DFS cycle detection
  const visited = new Set();
  const inStack = new Set();

  function dfs(node, path) {
    if (inStack.has(node)) {
      const cycleStart = path.indexOf(node);
      return [...path.slice(cycleStart), node];
    }
    if (visited.has(node)) return null;
    visited.add(node);
    inStack.add(node);
    path.push(node);
    for (const dep of (graph[node] || [])) {
      const cycle = dfs(dep, path);
      if (cycle) return cycle;
    }
    path.pop();
    inStack.delete(node);
    return null;
  }

  // Check starting from the new task
  const cycle = dfs(newId, []);
  if (cycle) return cycle.join(' \\u2192 ');
  return null;
}

// ── Commands ─────────────────────────────────────────────────────────

function cmdCreate() {
  const agent = flag('agent');
  const task = flag('task');
  const coordinator = flag('coordinator') || 'dev-lead';
  const scope = flag('scope');
  const dependsOn = flag('depends-on');

  if (!agent || !task) {
    fail('Usage: worktree-manager.mjs create --agent <name> --task <slug> [--coordinator <name>] [--scope <paths>] [--depends-on <task-ids>]');
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

  const treesDir = join(ROOT, '.trees');
  if (!existsSync(treesDir)) mkdirSync(treesDir, { recursive: true });

  const baseBranch = ensureOnBaseBranch();

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
      try { copyFileSync(src, dest); } catch {}
    }
  }

  // Write agent identity for file-lock enforcement
  const agentEnvPath = join(absTreePath, '.env.fishi');
  writeFileSync(agentEnvPath, 'FISHI_CURRENT_AGENT=' + agentSlug + '\\nFISHI_CURRENT_TASK=' + taskSlug + '\\n');

  appendWorktreeEntry(agentSlug, taskSlug, coordinatorSlug, branch, treePath);

  // ── Scope: acquire file locks via file-lock-hook ──
  if (scope) {
    try {
      const lockScript = join(ROOT, '.fishi', 'scripts', 'file-lock-hook.mjs');
      const lockResult = run(\`node \${lockScript} lock-scope --agent \${agentSlug} --task \${taskSlug} --scope "\${scope}"\`);
      let lockJson;
      try { lockJson = JSON.parse(lockResult); } catch { lockJson = {}; }
      if (lockJson.status === 'conflict') {
        // Rollback: remove worktree since scope conflict
        try { run(\`git worktree remove \${treePath} --force\`); } catch {}
        try { run(\`git branch -d \${branch}\`); } catch {}
        removeWorktreeEntry(treeName);
        fail(\`Scope conflict: \${lockJson.message || lockJson.conflicts ? JSON.stringify(lockJson.conflicts) : 'file lock conflict detected'}\`);
      }
    } catch (err) {
      // Rollback worktree on lock failure
      try { run(\`git worktree remove \${treePath} --force\`); } catch {}
      try { run(\`git branch -d \${branch}\`); } catch {}
      removeWorktreeEntry(treeName);
      // Check if the error output contains conflict JSON
      const errOut = err.stdout || err.message || '';
      let errJson;
      try { errJson = JSON.parse(errOut.slice(errOut.indexOf('{'))); } catch {}
      if (errJson && errJson.status === 'conflict') {
        fail(\`Scope conflict: \${errJson.message || JSON.stringify(errJson.conflicts || errJson)}\`);
      }
      fail(\`Failed to acquire scope lock: \${errOut}\`);
    }
  }

  // ── Depends-on: validate and store dependencies ──
  if (dependsOn) {
    const depList = dependsOn.split(',').map(d => d.trim()).filter(Boolean);
    const meta = readSprintMeta();

    // Check for circular dependencies
    const cycle = detectCycle(meta.tasks, taskSlug, depList);
    if (cycle) {
      // Rollback worktree
      try { run(\`git worktree remove \${treePath} --force\`); } catch {}
      try { run(\`git branch -d \${branch}\`); } catch {}
      removeWorktreeEntry(treeName);
      fail(\`Circular dependency detected: \${cycle}\`);
    }

    // Add task to sprint-meta
    meta.tasks.push({
      id: taskSlug,
      agent: agentSlug,
      worktree: treeName,
      scope: scope || '',
      depends_on: depList,
      merge_status: 'pending',
      qa_quick: null,
      qa_retries: 0,
    });
    writeSprintMeta(meta);
  } else if (scope) {
    // Even without depends-on, record the task in sprint-meta if scope was provided
    const meta = readSprintMeta();
    if (!meta.tasks.find(t => t.id === taskSlug)) {
      meta.tasks.push({
        id: taskSlug,
        agent: agentSlug,
        worktree: treeName,
        scope: scope || '',
        depends_on: [],
        merge_status: 'pending',
        qa_quick: null,
        qa_retries: 0,
      });
      writeSprintMeta(meta);
    }
  }

  try { import(new URL('./monitor-emitter.mjs', import.meta.url).href).then(m => m.emitMonitorEvent(ROOT, { type: 'worktree.created', agent: agentSlug, data: { task: taskSlug, coordinator: coordinatorSlug, branch } })).catch(() => {}); } catch {}

  const result = {
    worktree: treePath,
    branch,
    agent: agentSlug,
    task: taskSlug,
    coordinator: coordinatorSlug,
    status: 'created',
  };
  if (scope) result.scope = scope;
  if (dependsOn) result.depends_on = dependsOn.split(',').map(d => d.trim()).filter(Boolean);
  out(result);
}

function cmdStatus() {
  let rawList;
  try {
    rawList = run('git worktree list --porcelain');
  } catch {
    rawList = run('git worktree list');
  }

  const worktrees = [];
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

    const branchParts = (entry.branch || '').split('/');
    if (branchParts[0] === 'agent' && branchParts.length >= 4) {
      entry.coordinator = branchParts[1];
      entry.agent = branchParts[2];
      entry.task = branchParts.slice(3).join('/');
      entry.merged = isBranchMerged(entry.branch);
      entry.status = entry.merged ? 'merged' : 'active';
    }

    worktrees.push(entry);
  }

  out(worktrees);
}

function cmdReview() {
  const worktreeName = flag('worktree');
  if (!worktreeName) fail('Usage: worktree-manager.mjs review --worktree <name>');

  const treePath = join('.trees', worktreeName);
  let branch;
  try { branch = run(\`git -C \${treePath} rev-parse --abbrev-ref HEAD\`); }
  catch { fail(\`Could not determine branch for worktree: \${treePath}\`); }

  const baseBranch = getBaseBranch();
  let filesChanged = 0, linesAdded = 0, linesRemoved = 0;

  try {
    const numstat = run(\`git diff --numstat \${baseBranch}...\${branch}\`);
    for (const line of numstat.split('\\n').filter(Boolean)) {
      const [added, removed] = line.split('\\t');
      filesChanged++;
      if (added !== '-') linesAdded += parseInt(added, 10) || 0;
      if (removed !== '-') linesRemoved += parseInt(removed, 10) || 0;
    }
  } catch {}

  let fullDiff = '';
  try { fullDiff = run(\`git diff \${baseBranch}...\${branch}\`); } catch {}
  const hasTests = /\\.(test|spec)\\.(ts|js|tsx|jsx|mjs|go)|_test\\.go|__tests__|\\/test\\//.test(fullDiff);

  out({
    branch,
    base: baseBranch,
    merged: isBranchMerged(branch),
    files_changed: filesChanged,
    lines_added: linesAdded,
    lines_removed: linesRemoved,
    has_tests: hasTests,
  });
}

function cmdRebase() {
  const worktreeName = flag('worktree');
  if (!worktreeName) fail('Usage: worktree-manager.mjs rebase --worktree <name>');

  const treePath = join('.trees', worktreeName);
  let branch;
  try { branch = run(\`git -C \${treePath} rev-parse --abbrev-ref HEAD\`); }
  catch { fail(\`Could not determine branch for worktree: \${treePath}\`); }

  const baseBranch = getBaseBranch();

  // Fetch latest from origin (timeout: 10s, non-fatal)
  try { run('git remote get-url origin'); run('git fetch origin'); } catch {}

  // Rebase worktree branch onto latest base branch
  try {
    run(\`git -C \${treePath} rebase \${baseBranch}\`);
  } catch (err) {
    // Rebase conflict — abort and report
    try { run(\`git -C \${treePath} rebase --abort\`); } catch {}
    fail(\`Rebase of \${branch} onto \${baseBranch} failed (conflicts). Resolve manually in \${treePath} or merge instead.\`);
  }

  out({
    branch,
    rebased_onto: baseBranch,
    worktree: treePath,
    status: 'success',
    note: 'Branch is now up-to-date with base. Use merge when ready.',
  });
}

function runQuickCheckInline(taskId) {
  const checks = {};

  // ── 1. Test runner detection (first match wins) ──
  try {
    let testCmd = null;
    if (existsSync(join(ROOT, 'package.json'))) {
      try {
        const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));
        if (pkg.scripts && pkg.scripts.test) testCmd = 'npm test';
      } catch {}
    }
    if (!testCmd) {
      const vitestGlobs = ['vitest.config.ts', 'vitest.config.js', 'vitest.config.mts', 'vitest.config.mjs'];
      if (vitestGlobs.some(f => existsSync(join(ROOT, f)))) testCmd = 'npx vitest run';
    }
    if (!testCmd) {
      const jestGlobs = ['jest.config.ts', 'jest.config.js', 'jest.config.mjs', 'jest.config.cjs', 'jest.config.json'];
      if (jestGlobs.some(f => existsSync(join(ROOT, f)))) testCmd = 'npx jest';
    }
    if (!testCmd) {
      if (existsSync(join(ROOT, 'pytest.ini'))) {
        testCmd = 'pytest';
      } else if (existsSync(join(ROOT, 'pyproject.toml'))) {
        try {
          const pyproject = readFileSync(join(ROOT, 'pyproject.toml'), 'utf-8');
          if (pyproject.includes('[tool.pytest]')) testCmd = 'pytest';
        } catch {}
      }
    }

    if (!testCmd) {
      checks.tests = { status: 'skipped', output: 'No test runner detected' };
    } else {
      try {
        const output = run(testCmd);
        checks.tests = { status: 'passed', output: output.slice(0, 500) };
      } catch (err) {
        checks.tests = { status: 'failed', output: (err.stdout || err.stderr || err.message || '').slice(0, 500) };
      }
    }
  } catch {
    checks.tests = { status: 'skipped', output: 'Error during test detection' };
  }

  // ── 2. Linter detection ──
  try {
    let lintCmd = null;
    const eslintConfigs = ['.eslintrc', '.eslintrc.js', '.eslintrc.cjs', '.eslintrc.json', '.eslintrc.yml', '.eslintrc.yaml',
      'eslint.config.js', 'eslint.config.mjs', 'eslint.config.cjs', 'eslint.config.ts'];
    if (eslintConfigs.some(f => existsSync(join(ROOT, f)))) lintCmd = 'npx eslint .';
    if (!lintCmd && existsSync(join(ROOT, 'ruff.toml'))) lintCmd = 'ruff check .';

    if (!lintCmd) {
      checks.lint = { status: 'skipped', output: 'No linter detected' };
    } else {
      try {
        const output = run(lintCmd);
        checks.lint = { status: 'passed', output: output.slice(0, 500) };
      } catch (err) {
        checks.lint = { status: 'failed', output: (err.stdout || err.stderr || err.message || '').slice(0, 500) };
      }
    }
  } catch {
    checks.lint = { status: 'skipped', output: 'Error during linter detection' };
  }

  // ── 3. Type checker ──
  try {
    if (existsSync(join(ROOT, 'tsconfig.json'))) {
      try {
        const output = run('npx tsc --noEmit');
        checks.typecheck = { status: 'passed', output: output.slice(0, 500) };
      } catch (err) {
        checks.typecheck = { status: 'failed', output: (err.stdout || err.stderr || err.message || '').slice(0, 500) };
      }
    } else {
      checks.typecheck = { status: 'skipped', output: 'No tsconfig.json found' };
    }
  } catch {
    checks.typecheck = { status: 'skipped', output: 'Error during typecheck detection' };
  }

  // ── 4. Secret scan on diff ──
  try {
    let diff = '';
    try { diff = run('git diff HEAD~1'); } catch { diff = ''; }

    const secretPatterns = [
      /(?:api[_-]?key|secret|token|password|credential)\\s*[:=]\\s*['"][A-Za-z0-9+\\/=]{16,}['"]/i,
      /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/,
      /(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,}/,
      /(?:sk-|pk_live_|sk_live_)[A-Za-z0-9]{20,}/,
    ];

    const matches = [];
    for (const pattern of secretPatterns) {
      const m = diff.match(pattern);
      if (m) matches.push(m[0].slice(0, 100));
    }

    checks.secrets = matches.length > 0
      ? { status: 'failed', matches }
      : { status: 'passed', matches: [] };
  } catch {
    checks.secrets = { status: 'passed', matches: [] };
  }

  const overallResult = Object.values(checks).some(c => c.status === 'failed') ? 'failed' : 'passed';

  const resultObj = {
    task_id: taskId,
    timestamp: new Date().toISOString(),
    result: overallResult,
    checks,
  };

  const qaDir = join(ROOT, '.fishi', 'state', 'qa-results');
  if (!existsSync(qaDir)) mkdirSync(qaDir, { recursive: true });
  writeFileSync(join(qaDir, \`\${taskId}-quick.json\`), JSON.stringify(resultObj, null, 2), 'utf-8');

  return resultObj;
}

function cmdMerge() {
  const worktreeName = flag('worktree');
  if (!worktreeName) fail('Usage: worktree-manager.mjs merge --worktree <name>');

  const treePath = join('.trees', worktreeName);
  let branch;
  try { branch = run(\`git -C \${treePath} rev-parse --abbrev-ref HEAD\`); }
  catch { fail(\`Could not determine branch for worktree: \${treePath}\`); }

  // ── Sprint-meta pre-checks (idempotency + merge-ready) ──
  let meta = null;
  let task = null;
  let hasSprintMeta = existsSync(SPRINT_META_PATH);

  if (hasSprintMeta) {
    meta = readSprintMeta();
    task = meta.tasks.find(t => t.worktree === worktreeName || t.id === worktreeName);
  }

  // Idempotency: if already marked merged in sprint-meta, return immediately
  if (task && task.merge_status === 'merged') {
    out({ merged: branch, into: getBaseBranch(), status: 'already-merged' });
    return;
  }

  // Merge-ready: check all depends_on have merge_status: merged
  if (task && task.depends_on && task.depends_on.length > 0) {
    const blockedBy = [];
    for (const depId of task.depends_on) {
      const dep = meta.tasks.find(t => t.id === depId);
      if (!dep || dep.merge_status !== 'merged') {
        blockedBy.push(depId);
      }
    }
    if (blockedBy.length > 0) {
      fail(\`Cannot merge: dependencies not yet merged. blocked_by: [\${blockedBy.join(', ')}]\`);
    }
  }

  if (isBranchMerged(branch)) {
    // Git says already merged — update sprint-meta if present
    if (task && meta) {
      task.merge_status = 'merged';
      writeSprintMeta(meta);
      // Sync board.md — move task to Done column
      syncBoardTask(task.id, 'Done');
    } else {
      // No sprint-meta task — infer task ID from branch for board sync
      const branchParts = branch.split('/');
      if (branchParts.length >= 4) {
        syncBoardTask(branchParts.slice(3).join('/'), 'Done');
      }
    }
    out({ merged: branch, into: getBaseBranch(), status: 'already-merged' });
    return;
  }

  const targetBranch = getBaseBranch();

  // Rebase before merge to keep history clean and catch conflicts early
  try {
    try { run('git remote get-url origin'); run('git fetch origin'); } catch {}
    run(\`git -C \${treePath} rebase \${targetBranch}\`);
  } catch {
    // Rebase failed — abort and try direct merge instead
    try { run(\`git -C \${treePath} rebase --abort\`); } catch {}
    process.stderr.write(\`[FISHI] Rebase failed — falling back to merge commit\\n\`);
  }

  const currentBranch = run('git rev-parse --abbrev-ref HEAD');

  try {
    if (currentBranch !== targetBranch) run(\`git checkout \${targetBranch}\`);
    run(\`git merge --no-ff \${branch} -m "Merge \${branch} into \${targetBranch}"\`);
  } catch (err) {
    try { run(\`git merge --abort\`); } catch {}
    try { run(\`git checkout \${targetBranch}\`); } catch {}
    fail(\`Merge failed: \${err.message}. Main repo restored to \${targetBranch}.\`);
  }

  // ── Post-merge: quick-check + sprint-meta update ──
  let qaQuick = null;
  if (task && meta) {
    // Extract task ID from the worktree name or task record
    const taskId = task.id;
    const qcResult = runQuickCheckInline(taskId);
    qaQuick = qcResult.result;

    if (qaQuick === 'passed') {
      task.merge_status = 'merged';
      task.qa_quick = 'passed';
      writeSprintMeta(meta);
      // Sync board.md — move task to Done column
      syncBoardTask(taskId, 'Done');
      try { import(new URL('./monitor-emitter.mjs', import.meta.url).href).then(m => m.emitMonitorEvent(ROOT, { type: 'qa.quick_passed', agent: 'system', data: { task_id: taskId } })).catch(() => {}); } catch {}
      // Release file locks
      try {
        const lockScript = join(ROOT, '.fishi', 'scripts', 'file-lock-hook.mjs');
        if (existsSync(lockScript)) {
          run(\`node \${lockScript} release --task \${taskId}\`);
        }
      } catch {}
    } else {
      task.qa_quick = 'failed';
      task.qa_retries = (task.qa_retries || 0) + 1;
      writeSprintMeta(meta);
      try { import(new URL('./monitor-emitter.mjs', import.meta.url).href).then(m => m.emitMonitorEvent(ROOT, { type: 'qa.quick_failed', agent: 'system', data: { task_id: taskId, retries: task.qa_retries } })).catch(() => {}); } catch {}
      // Escalation if retries >= 3
      if (task.qa_retries >= 3) {
        const escDir = join(ROOT, '.fishi', 'state', 'escalations');
        if (!existsSync(escDir)) mkdirSync(escDir, { recursive: true });
        writeFileSync(join(escDir, \`\${taskId}-qa-escalation.json\`), JSON.stringify({
          task_id: taskId,
          reason: 'qa_quick failed 3+ times',
          retries: task.qa_retries,
          timestamp: new Date().toISOString(),
        }, null, 2), 'utf-8');
      }
    }
  } else if (hasSprintMeta && meta && !task) {
    // Task not tracked in sprint-meta — still sync board.md if possible
    const branchParts = branch.split('/');
    if (branchParts.length >= 4) {
      const inferredTaskId = branchParts.slice(3).join('/');
      syncBoardTask(inferredTaskId, 'Done');
    }
  } else {
    // No sprint-meta at all — still sync board.md if possible
    const branchParts = branch.split('/');
    if (branchParts.length >= 4) {
      const inferredTaskId = branchParts.slice(3).join('/');
      syncBoardTask(inferredTaskId, 'Done');
    }
  }

  // NOTE: Worktree is NOT removed after merge. It stays alive until sprint-cleanup.
  try { import(new URL('./monitor-emitter.mjs', import.meta.url).href).then(m => m.emitMonitorEvent(ROOT, { type: 'worktree.merged', agent: 'system', data: { branch } })).catch(() => {}); } catch {}

  const result = {
    merged: branch,
    into: targetBranch,
    status: 'success',
    worktree_preserved: true,
    note: 'Worktree kept alive — use sprint-cleanup after sprint completes',
  };
  if (qaQuick !== null) result.qa_quick = qaQuick;
  out(result);
}

function cmdCleanup() {
  // Worktrees persist until sprint-cleanup. Require --force for emergency cleanup.
  if (!process.argv.includes('--force')) {
    fail('Worktrees persist until sprint-cleanup. Use --force for emergency cleanup.');
  }

  const worktreeName = flag('worktree');
  if (!worktreeName) fail('Usage: worktree-manager.mjs cleanup --worktree <name> --force');

  const treePath = join('.trees', worktreeName);
  const absTreePath = join(ROOT, treePath);

  let branch;
  try { branch = run(\`git -C \${treePath} rev-parse --abbrev-ref HEAD\`); }
  catch { branch = null; }

  if (branch && branch !== 'HEAD' && !isBranchMerged(branch)) {
    process.stderr.write(\`WARNING: Force-deleting unmerged branch \${branch}\\n\`);
  }

  // Remove worktree
  try { run(\`git worktree remove \${treePath} --force\`); }
  catch {
    try {
      if (existsSync(absTreePath)) rmSync(absTreePath, { recursive: true, force: true });
      run(\`git worktree prune\`);
    } catch {
      try { run(\`git worktree prune\`); } catch {}
    }
  }

  // Delete branch (safe delete — only works if merged, or force)
  if (branch && branch !== 'HEAD') {
    try { run(\`git branch -d \${branch}\`); }
    catch {
      if (process.argv.includes('--force')) {
        try { run(\`git branch -D \${branch}\`); } catch {}
      }
      // If not --force and branch -d fails, branch is preserved
    }
  }

  removeWorktreeEntry(worktreeName);

  try { import(new URL('./monitor-emitter.mjs', import.meta.url).href).then(m => m.emitMonitorEvent(ROOT, { type: 'worktree.cleaned', agent: 'system', data: { worktree: worktreeName } })).catch(() => {}); } catch {}

  out({ removed: treePath, branch: branch || 'unknown', status: 'cleaned' });
}

function cmdSprintCleanup() {
  const sprintNum = flag('sprint');
  if (!sprintNum) fail('Usage: worktree-manager.mjs sprint-cleanup --sprint <N>');

  // Check sprint completion
  const sprintsDir = join(ROOT, '.fishi', 'taskboard', 'sprints');
  const sprintFiles = existsSync(sprintsDir) ? readdirSync(sprintsDir).filter(f => f.includes(\`sprint-\${sprintNum}\`) || f.includes(\`sprint-0\${sprintNum}\`)) : [];

  if (sprintFiles.length === 0) {
    fail(\`Sprint \${sprintNum} file not found. Cannot cleanup without sprint tracking.\`);
  }

  const sprintContent = readFileSync(join(sprintsDir, sprintFiles[0]), 'utf-8').toLowerCase();
  if (!sprintContent.includes('completed') && !sprintContent.includes('done') && !sprintContent.includes('closed')) {
    fail(\`Sprint \${sprintNum} not marked as COMPLETED. Mark it done before cleanup.\`);
  }

  const unchecked = (sprintContent.match(/^\\s*-\\s*\\[\\s*\\]/gm) || []).length;
  if (unchecked > 0) {
    fail(\`Sprint \${sprintNum} has \${unchecked} unchecked tasks. Complete all tasks before cleanup.\`);
  }

  // Get all worktrees
  let rawList;
  try { rawList = run('git worktree list --porcelain'); } catch { rawList = ''; }

  const cleaned = [];
  const preserved = [];
  const blocks = rawList.split('\\n\\n').filter(Boolean);

  for (const block of blocks) {
    const lines = block.split('\\n');
    let path = '', branch = '';
    for (const line of lines) {
      if (line.startsWith('worktree ')) path = line.slice(9);
      if (line.startsWith('branch ')) branch = line.slice(7).replace('refs/heads/', '');
    }

    if (!branch.startsWith('agent/')) continue;

    const treeName = path.split('/').pop() || path.split('\\\\').pop() || '';
    if (!treeName) continue;

    if (isBranchMerged(branch)) {
      // Safe to remove — work is merged
      const treePath = join('.trees', treeName);
      const absPath = join(ROOT, treePath);
      try { run(\`git worktree remove \${treePath} --force\`); }
      catch {
        try { if (existsSync(absPath)) rmSync(absPath, { recursive: true, force: true }); run('git worktree prune'); } catch {}
      }
      try { run(\`git branch -d \${branch}\`); } catch {}
      removeWorktreeEntry(treeName);
      cleaned.push({ worktree: treeName, branch, status: 'cleaned' });
    } else {
      preserved.push({ worktree: treeName, branch, status: 'PRESERVED — unmerged work' });
    }
  }

  try { import(new URL('./monitor-emitter.mjs', import.meta.url).href).then(m => m.emitMonitorEvent(ROOT, { type: 'sprint.cleaned', agent: 'system', data: { sprint: parseInt(sprintNum, 10), cleaned: cleaned.length, preserved: preserved.length } })).catch(() => {}); } catch {}

  out({
    sprint: parseInt(sprintNum, 10),
    cleaned: cleaned.length,
    preserved: preserved.length,
    details: [...cleaned, ...preserved],
    status: preserved.length > 0 ? 'partial — unmerged worktrees preserved' : 'complete',
  });
}

function cmdVerify() {
  let rawList;
  try { rawList = run('git worktree list --porcelain'); } catch { rawList = ''; }

  const activeWorktrees = [];
  const staleBranches = [];
  const blocks = rawList.split('\\n\\n').filter(Boolean);

  for (const block of blocks) {
    const lines = block.split('\\n');
    let path = '', branch = '';
    for (const line of lines) {
      if (line.startsWith('worktree ')) path = line.slice(9);
      if (line.startsWith('branch ')) branch = line.slice(7).replace('refs/heads/', '');
    }
    if (branch.startsWith('agent/')) {
      activeWorktrees.push({ path, branch, merged: isBranchMerged(branch) });
    }
  }

  // Check for stale agent branches without worktrees
  try {
    const allBranches = run('git branch').split('\\n').map(b => b.trim().replace(/^\\* /, ''));
    for (const b of allBranches) {
      if (b.startsWith('agent/')) {
        const hasWorktree = activeWorktrees.some(w => w.branch === b);
        if (!hasWorktree) staleBranches.push({ branch: b, merged: isBranchMerged(b) });
      }
    }
  } catch {}

  const clean = activeWorktrees.length === 0 && staleBranches.length === 0;

  out({
    clean,
    active_worktrees: activeWorktrees.length,
    stale_branches: staleBranches.length,
    worktrees: activeWorktrees,
    stale: staleBranches,
    status: clean ? 'verified — ready for next sprint' : 'issues found',
  });
}

function cmdQuickCheck() {
  const taskId = flag('task');
  if (!taskId) fail('Usage: worktree-manager.mjs quick-check --task <task-id> [--diff-content <text>]');

  const diffContent = flag('diff-content');
  const checks = {};

  // ── 1. Test runner detection (first match wins) ──
  try {
    let testCmd = null;
    if (existsSync(join(ROOT, 'package.json'))) {
      try {
        const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));
        if (pkg.scripts && pkg.scripts.test) testCmd = 'npm test';
      } catch {}
    }
    if (!testCmd) {
      const vitestGlobs = ['vitest.config.ts', 'vitest.config.js', 'vitest.config.mts', 'vitest.config.mjs'];
      if (vitestGlobs.some(f => existsSync(join(ROOT, f)))) testCmd = 'npx vitest run';
    }
    if (!testCmd) {
      const jestGlobs = ['jest.config.ts', 'jest.config.js', 'jest.config.mjs', 'jest.config.cjs', 'jest.config.json'];
      if (jestGlobs.some(f => existsSync(join(ROOT, f)))) testCmd = 'npx jest';
    }
    if (!testCmd) {
      if (existsSync(join(ROOT, 'pytest.ini'))) {
        testCmd = 'pytest';
      } else if (existsSync(join(ROOT, 'pyproject.toml'))) {
        try {
          const pyproject = readFileSync(join(ROOT, 'pyproject.toml'), 'utf-8');
          if (pyproject.includes('[tool.pytest]')) testCmd = 'pytest';
        } catch {}
      }
    }

    if (!testCmd) {
      checks.tests = { status: 'skipped', output: 'No test runner detected' };
    } else {
      try {
        const output = run(testCmd);
        checks.tests = { status: 'passed', output: output.slice(0, 500) };
      } catch (err) {
        checks.tests = { status: 'failed', output: (err.stdout || err.stderr || err.message || '').slice(0, 500) };
      }
    }
  } catch {
    checks.tests = { status: 'skipped', output: 'Error during test detection' };
  }

  // ── 2. Linter detection ──
  try {
    let lintCmd = null;
    const eslintConfigs = ['.eslintrc', '.eslintrc.js', '.eslintrc.cjs', '.eslintrc.json', '.eslintrc.yml', '.eslintrc.yaml',
      'eslint.config.js', 'eslint.config.mjs', 'eslint.config.cjs', 'eslint.config.ts'];
    if (eslintConfigs.some(f => existsSync(join(ROOT, f)))) lintCmd = 'npx eslint .';
    if (!lintCmd && existsSync(join(ROOT, 'ruff.toml'))) lintCmd = 'ruff check .';

    if (!lintCmd) {
      checks.lint = { status: 'skipped', output: 'No linter detected' };
    } else {
      try {
        const output = run(lintCmd);
        checks.lint = { status: 'passed', output: output.slice(0, 500) };
      } catch (err) {
        checks.lint = { status: 'failed', output: (err.stdout || err.stderr || err.message || '').slice(0, 500) };
      }
    }
  } catch {
    checks.lint = { status: 'skipped', output: 'Error during linter detection' };
  }

  // ── 3. Type checker ──
  try {
    if (existsSync(join(ROOT, 'tsconfig.json'))) {
      try {
        const output = run('npx tsc --noEmit');
        checks.typecheck = { status: 'passed', output: output.slice(0, 500) };
      } catch (err) {
        checks.typecheck = { status: 'failed', output: (err.stdout || err.stderr || err.message || '').slice(0, 500) };
      }
    } else {
      checks.typecheck = { status: 'skipped', output: 'No tsconfig.json found' };
    }
  } catch {
    checks.typecheck = { status: 'skipped', output: 'Error during typecheck detection' };
  }

  // ── 4. Secret scan on diff ──
  try {
    let diff = '';
    if (diffContent !== undefined) {
      diff = diffContent;
    } else {
      try { diff = run('git diff HEAD~1'); } catch { diff = ''; }
    }

    const secretPatterns = [
      /(?:api[_-]?key|secret|token|password|credential)\\s*[:=]\\s*['"][A-Za-z0-9+\\/=]{16,}['"]/i,
      /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/,
      /(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,}/,
      /(?:sk-|pk_live_|sk_live_)[A-Za-z0-9]{20,}/,
    ];

    const matches = [];
    for (const pattern of secretPatterns) {
      const m = diff.match(pattern);
      if (m) matches.push(m[0].slice(0, 100));
    }

    checks.secrets = matches.length > 0
      ? { status: 'failed', matches }
      : { status: 'passed', matches: [] };
  } catch {
    checks.secrets = { status: 'passed', matches: [] };
  }

  // ── 5. Compute overall result and write ──
  const overallResult = Object.values(checks).some(c => c.status === 'failed') ? 'failed' : 'passed';

  const resultObj = {
    task_id: taskId,
    timestamp: new Date().toISOString(),
    result: overallResult,
    checks,
  };

  const qaDir = join(ROOT, '.fishi', 'state', 'qa-results');
  if (!existsSync(qaDir)) mkdirSync(qaDir, { recursive: true });
  writeFileSync(join(qaDir, \`\${taskId}-quick.json\`), JSON.stringify(resultObj, null, 2), 'utf-8');

  out(resultObj);
}

function cmdMergeReady() {
  const worktreeName = flag('worktree');
  if (!worktreeName) fail('Usage: worktree-manager.mjs merge-ready --worktree <name>');

  const meta = readSprintMeta();
  const task = meta.tasks.find(t => t.worktree === worktreeName || t.id === worktreeName);

  // If no sprint-meta or task not found → backward compat: always ready
  if (!task) {
    out({ ready: true });
    return;
  }

  // If no dependencies → ready
  if (!task.depends_on || task.depends_on.length === 0) {
    out({ ready: true });
    return;
  }

  // Check each dependency's merge_status
  const blockedBy = [];
  for (const depId of task.depends_on) {
    const dep = meta.tasks.find(t => t.id === depId);
    if (!dep || dep.merge_status !== 'merged') {
      blockedBy.push(depId);
    }
  }

  if (blockedBy.length === 0) {
    out({ ready: true });
  } else {
    try { import(new URL('./monitor-emitter.mjs', import.meta.url).href).then(m => m.emitMonitorEvent(ROOT, { type: 'merge.blocked', agent: 'system', data: { worktree: worktreeName, blocked_by: blockedBy } })).catch(() => {}); } catch {}
    out({ ready: false, blocked_by: blockedBy });
  }
}

// ── auto-register: register task in sprint-meta WITHOUT creating git worktree ──
// Used by worktree-guard.mjs and worktree-hooks.mjs when Claude Code's Agent
// tool creates worktrees natively, bypassing worktree-manager.mjs create.

function cmdAutoRegister() {
  const agent = flag('agent');
  const task = flag('task');
  const coordinator = flag('coordinator') || 'dev-lead';
  const scope = flag('scope');
  const dependsOn = flag('depends-on');

  if (!agent || !task) {
    fail('Usage: worktree-manager.mjs auto-register --agent <name> --task <slug> [--coordinator <name>] [--scope <paths>] [--depends-on <task-ids>]');
  }

  const agentSlug = slugify(agent);
  const taskSlug = slugify(task);
  const coordinatorSlug = slugify(coordinator);
  const treeName = \`auto-\${agentSlug}-\${taskSlug}\`;

  // Check if already registered
  const meta = readSprintMeta();
  if (meta.tasks.find(t => t.id === taskSlug)) {
    out({ status: 'already-registered', task: taskSlug, agent: agentSlug });
    return;
  }

  // Parse dependencies
  const depList = dependsOn ? dependsOn.split(',').map(d => d.trim()).filter(Boolean) : [];

  // Check for circular dependencies if deps provided
  if (depList.length > 0) {
    const cycle = detectCycle(meta.tasks, taskSlug, depList);
    if (cycle) {
      fail(\`Circular dependency detected: \${cycle}\`);
    }
  }

  // Register task in sprint-meta
  meta.tasks.push({
    id: taskSlug,
    agent: agentSlug,
    worktree: treeName,
    scope: scope || '',
    depends_on: depList,
    merge_status: 'pending',
    qa_quick: null,
    qa_retries: 0,
  });
  writeSprintMeta(meta);

  // Register in agent registry
  const branch = \`agent/\${coordinatorSlug}/\${agentSlug}/\${taskSlug}\`;
  appendWorktreeEntry(agentSlug, taskSlug, coordinatorSlug, branch, treeName);

  // Acquire file locks if scope provided
  if (scope) {
    try {
      const lockScript = join(ROOT, '.fishi', 'scripts', 'file-lock-hook.mjs');
      if (existsSync(lockScript)) {
        run(\`node \${lockScript} lock-scope --agent \${agentSlug} --task \${taskSlug} --scope "\${scope}"\`);
      }
    } catch {}
  }

  // Emit monitor event
  try { import(new URL('./monitor-emitter.mjs', import.meta.url).href).then(m => m.emitMonitorEvent(ROOT, { type: 'worktree.auto_registered', agent: agentSlug, data: { task: taskSlug, coordinator: coordinatorSlug } })).catch(() => {}); } catch {}

  out({
    status: 'auto-registered',
    task: taskSlug,
    agent: agentSlug,
    coordinator: coordinatorSlug,
    worktree: treeName,
  });
}

// ── Dispatch ─────────────────────────────────────────────────────────

switch (command) {
  case 'create': cmdCreate(); break;
  case 'auto-register': cmdAutoRegister(); break;
  case 'status': cmdStatus(); break;
  case 'review': cmdReview(); break;
  case 'rebase': cmdRebase(); break;
  case 'merge': cmdMerge(); break;
  case 'cleanup': cmdCleanup(); break;
  case 'sprint-cleanup': cmdSprintCleanup(); break;
  case 'merge-ready': cmdMergeReady(); break;
  case 'quick-check': cmdQuickCheck(); break;
  case 'verify': cmdVerify(); break;
  default:
    out({
      error: \`Unknown command: \${command || '(none)'}\`,
      usage: 'worktree-manager.mjs <command> [options]',
      commands: {
        create: '--agent <name> --task <slug> [--coordinator <name>] [--scope <paths>] [--depends-on <task-ids>]',
        'auto-register': '--agent <name> --task <slug> [--coordinator <name>] [--scope <paths>] [--depends-on <task-ids>] — register without creating git worktree',
        status: '(no args) — list all worktrees with merge status',
        review: '--worktree <name> — diff stats for a worktree',
        rebase: '--worktree <name> — rebase worktree branch onto latest base branch',
        merge: '--worktree <name> — rebase + merge to base branch (keeps worktree alive)',
        cleanup: '--worktree <name> --force — remove worktree (always requires --force)',
        'sprint-cleanup': '--sprint <N> — batch cleanup all merged worktrees after sprint completion',
        'merge-ready': '--worktree <name> — check if all dependency tasks are merged before allowing merge',
        'quick-check': '--task <task-id> [--diff-content <text>] — run automated post-merge validation (tests, lint, typecheck, secret scan)',
        verify: '(no args) — confirm zero active worktrees and stale branches',
      },
    });
    process.exit(1);
}
`;
}
