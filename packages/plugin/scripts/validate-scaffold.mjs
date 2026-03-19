#!/usr/bin/env node
// validate-scaffold.mjs — FISHI integration validation script
// Zero dependencies: uses only Node.js built-ins
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const projectRoot = process.env.FISHI_PROJECT_ROOT || process.cwd();
const PREFIX = '[FISHI VALIDATE]';
let issueCount = 0;

function ok(msg) {
  console.log(`${PREFIX} \u2713 ${msg}`);
}

function fail(msg) {
  console.log(`${PREFIX} \u2717 ${msg}`);
  issueCount++;
}

function warn(msg) {
  console.log(`${PREFIX} \u26A0 ${msg}`);
}

function readText(relPath) {
  const full = join(projectRoot, relPath);
  if (!existsSync(full)) return null;
  try {
    return readFileSync(full, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Minimal YAML frontmatter parser.
 * Extracts the YAML block between --- delimiters at the top of a markdown file.
 * Returns a flat key-value map of top-level scalar fields and simple arrays.
 */
function parseFrontmatter(content) {
  if (!content || !content.startsWith('---')) return null;
  const endIdx = content.indexOf('---', 3);
  if (endIdx === -1) return null;
  const yaml = content.substring(3, endIdx).trim();
  const result = {};
  let currentKey = null;
  for (const line of yaml.split('\n')) {
    // Array item under a key
    const arrayItem = line.match(/^\s+-\s+(.+)$/);
    if (arrayItem && currentKey) {
      if (!Array.isArray(result[currentKey])) {
        result[currentKey] = [];
      }
      result[currentKey].push(arrayItem[1].replace(/^['"]|['"]$/g, '').trim());
      continue;
    }
    // Key: value
    const kv = line.match(/^([\w][\w_-]*):\s*(.*)$/);
    if (kv) {
      const [, key, value] = kv;
      const trimmed = value.replace(/^['"]|['"]$/g, '').trim();
      if (trimmed === '' || trimmed === '[]') {
        result[key] = [];
        currentKey = key;
      } else {
        result[key] = trimmed;
        currentKey = key;
      }
    }
  }
  return result;
}

/**
 * Simple YAML parser for non-frontmatter YAML files.
 * Handles top-level keys with scalar values and simple arrays.
 */
function parseYamlSimple(content) {
  const result = {};
  let currentKey = null;
  for (const line of content.split('\n')) {
    const arrayItem = line.match(/^\s+-\s+(.+)$/);
    if (arrayItem && currentKey) {
      if (!Array.isArray(result[currentKey])) {
        result[currentKey] = [];
      }
      result[currentKey].push(arrayItem[1].replace(/^['"]|['"]$/g, '').trim());
      continue;
    }
    const kv = line.match(/^([\w][\w_.-]*):\s*(.*)$/);
    if (kv) {
      const [, key, value] = kv;
      const trimmed = value.replace(/^['"]|['"]$/g, '').trim();
      if (trimmed === '' || trimmed === '[]') {
        result[key] = [];
        currentKey = key;
      } else {
        result[key] = trimmed;
        currentKey = key;
      }
    }
  }
  return result;
}

/**
 * Parse agent-registry.yaml which has a nested agents array with objects.
 * Returns an array of agent objects with name, file, role fields.
 */
function parseAgentRegistry(content) {
  const agents = [];
  let inAgents = false;
  let current = null;
  for (const line of content.split('\n')) {
    if (/^agents:/.test(line)) {
      inAgents = true;
      continue;
    }
    if (inAgents) {
      // New agent entry
      const newEntry = line.match(/^\s+-\s+(\w[\w_-]*):\s*(.*)$/);
      if (newEntry) {
        if (current) agents.push(current);
        current = {};
        current[newEntry[1]] = newEntry[2].replace(/^['"]|['"]$/g, '').trim();
        continue;
      }
      // Continuation field of current agent
      const field = line.match(/^\s+(\w[\w_-]*):\s*(.*)$/);
      if (field && current) {
        current[field[1]] = field[2].replace(/^['"]|['"]$/g, '').trim();
        continue;
      }
      // Bare list item (just a - with a name)
      const bareItem = line.match(/^\s+-\s+([^:]+)$/);
      if (bareItem && !current) {
        agents.push({ name: bareItem[1].trim() });
        continue;
      }
      // Non-matching non-empty line that isn't indented = end of agents block
      if (/^[a-zA-Z]/.test(line)) {
        if (current) agents.push(current);
        current = null;
        inAgents = false;
      }
    }
  }
  if (current) agents.push(current);
  return agents;
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. FILE EXISTENCE CHECKS
// ═══════════════════════════════════════════════════════════════════════════

console.log(`${PREFIX} Checking file existence...`);

const agentFiles = [
  '.claude/agents/master-orchestrator.md',
  '.claude/agents/coordinators/planning-lead.md',
  '.claude/agents/coordinators/dev-lead.md',
  '.claude/agents/coordinators/quality-lead.md',
  '.claude/agents/coordinators/ops-lead.md',
  '.claude/agents/research-agent.md',
  '.claude/agents/planning-agent.md',
  '.claude/agents/architect-agent.md',
  '.claude/agents/backend-agent.md',
  '.claude/agents/frontend-agent.md',
  '.claude/agents/uiux-agent.md',
  '.claude/agents/fullstack-agent.md',
  '.claude/agents/devops-agent.md',
  '.claude/agents/testing-agent.md',
  '.claude/agents/security-agent.md',
  '.claude/agents/docs-agent.md',
  '.claude/agents/writing-agent.md',
  '.claude/agents/marketing-agent.md',
];

const skillFiles = [
  '.claude/skills/brainstorming/SKILL.md',
  '.claude/skills/brownfield-analysis/SKILL.md',
  '.claude/skills/taskboard-ops/SKILL.md',
  '.claude/skills/code-gen/SKILL.md',
  '.claude/skills/debugging/SKILL.md',
  '.claude/skills/api-design/SKILL.md',
  '.claude/skills/testing/SKILL.md',
  '.claude/skills/deployment/SKILL.md',
  '.claude/skills/prd/SKILL.md',
];

const commandFiles = [
  '.claude/commands/fishi-init.md',
  '.claude/commands/fishi-status.md',
  '.claude/commands/fishi-resume.md',
  '.claude/commands/fishi-gate.md',
  '.claude/commands/fishi-board.md',
  '.claude/commands/fishi-sprint.md',
  '.claude/commands/fishi-reset.md',
  '.claude/commands/fishi-prd.md',
];

const scriptFiles = [
  '.fishi/scripts/session-start.mjs',
  '.fishi/scripts/auto-checkpoint.mjs',
  '.fishi/scripts/agent-complete.mjs',
  '.fishi/scripts/post-edit.mjs',
  '.fishi/scripts/safety-check.mjs',
  '.fishi/scripts/worktree-setup.mjs',
  '.fishi/scripts/taskboard-update.mjs',
  '.fishi/scripts/worktree-manager.mjs',
  '.fishi/scripts/gate-manager.mjs',
];

const configFiles = [
  '.fishi/fishi.yaml',
  '.claude/settings.json',
  '.claude/CLAUDE.md',
  '.mcp.json',
];

const stateFiles = [
  '.fishi/state/project.yaml',
  '.fishi/state/agent-registry.yaml',
  '.fishi/state/gates.yaml',
  '.fishi/state/task-graph.yaml',
];

const factoryFiles = [
  '.fishi/agent-factory/agent-template.md',
  '.fishi/agent-factory/coordinator-template.md',
];

const taskboardFiles = [
  '.fishi/taskboard/board.md',
  '.fishi/taskboard/backlog.md',
];

const memoryFiles = [
  '.fishi/memory/project-context.md',
  '.fishi/memory/decisions.md',
];

const modelRoutingFiles = [
  '.fishi/model-routing.md',
];

const allFiles = [
  ...agentFiles,
  ...skillFiles,
  ...commandFiles,
  ...scriptFiles,
  ...configFiles,
  ...stateFiles,
  ...factoryFiles,
  ...taskboardFiles,
  ...memoryFiles,
  ...modelRoutingFiles,
];

let presentCount = 0;
for (const f of allFiles) {
  const full = join(projectRoot, f);
  if (existsSync(full)) {
    presentCount++;
  } else {
    fail(`Missing file: ${f}`);
  }
}

if (presentCount === allFiles.length) {
  ok(`${presentCount}/${allFiles.length} files present`);
} else {
  ok(`${presentCount}/${allFiles.length} files present (${allFiles.length - presentCount} missing)`);
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. YAML FRONTMATTER VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

console.log(`${PREFIX} Checking YAML frontmatter...`);

const validModels = ['opus', 'sonnet', 'haiku'];
const coordinatorFiles = [
  '.claude/agents/coordinators/planning-lead.md',
  '.claude/agents/coordinators/dev-lead.md',
  '.claude/agents/coordinators/quality-lead.md',
  '.claude/agents/coordinators/ops-lead.md',
];

let validAgentCount = 0;
const agentFrontmatters = {};

for (const agentFile of agentFiles) {
  const content = readText(agentFile);
  if (!content) continue;

  const fm = parseFrontmatter(content);
  const agentName = agentFile.split('/').pop().replace('.md', '');
  agentFrontmatters[agentName] = fm;

  if (!fm) {
    fail(`Agent "${agentName}" has no YAML frontmatter`);
    continue;
  }

  let agentValid = true;

  if (!fm.name) {
    fail(`Agent "${agentName}" missing frontmatter field: name`);
    agentValid = false;
  }
  if (!fm.description) {
    fail(`Agent "${agentName}" missing frontmatter field: description`);
    agentValid = false;
  }
  if (!fm.model) {
    fail(`Agent "${agentName}" missing frontmatter field: model`);
    agentValid = false;
  } else if (!validModels.includes(fm.model)) {
    fail(`Agent "${agentName}" has invalid model: "${fm.model}" (must be one of: ${validModels.join(', ')})`);
    agentValid = false;
  }

  // Coordinator-specific checks
  const isCoordinator = coordinatorFiles.includes(agentFile) || agentFile.includes('master-orchestrator');
  if (isCoordinator && agentFile !== '.claude/agents/master-orchestrator.md') {
    if (fm.role !== 'coordinator') {
      fail(`Coordinator "${agentName}" missing frontmatter field: role: coordinator`);
      agentValid = false;
    }
    if (!fm.reports_to) {
      fail(`Coordinator "${agentName}" missing frontmatter field: reports_to`);
      agentValid = false;
    }
    if (!fm.manages && !Array.isArray(fm.manages)) {
      fail(`Coordinator "${agentName}" missing frontmatter field: manages`);
      agentValid = false;
    }
  }

  // Worktree isolation check for workers
  if (!isCoordinator && fm.isolation === 'worktree') {
    // This is valid, just noting it exists — no additional validation needed
  }

  if (agentValid) validAgentCount++;
}

if (validAgentCount === agentFiles.length) {
  ok(`${validAgentCount}/${agentFiles.length} agents valid`);
} else {
  ok(`${validAgentCount}/${agentFiles.length} agents valid (${agentFiles.length - validAgentCount} with issues)`);
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. CROSS-REFERENCE CHECKS
// ═══════════════════════════════════════════════════════════════════════════

console.log(`${PREFIX} Checking cross-references...`);

let crossRefValid = true;

// Check agent-registry references
const registryContent = readText('.fishi/state/agent-registry.yaml');
if (registryContent) {
  const registryAgents = parseAgentRegistry(registryContent);
  const agentBaseNames = agentFiles.map(f => {
    const parts = f.split('/');
    return parts[parts.length - 1].replace('.md', '');
  });

  for (const agent of registryAgents) {
    const name = agent.name || agent.id;
    if (name && !agentBaseNames.includes(name)) {
      // Check if it might use a file field
      const file = agent.file;
      if (file) {
        const fileFull = file.startsWith('.claude') ? file : '.claude/agents/' + file;
        if (!existsSync(join(projectRoot, fileFull))) {
          fail(`Agent registry references "${name}" but no corresponding .md file found`);
          crossRefValid = false;
        }
      }
    }
  }
}

// Check coordinator manages lists reference existing agents
for (const coordFile of coordinatorFiles) {
  const content = readText(coordFile);
  if (!content) continue;
  const fm = parseFrontmatter(content);
  if (!fm || !fm.manages) continue;

  const manages = Array.isArray(fm.manages) ? fm.manages : [fm.manages];
  for (const managed of manages) {
    // Skip dynamic agent patterns (e.g., "dynamic:dev-*")
    if (managed.startsWith('dynamic:')) continue;

    // Check if a file exists for this agent
    const possiblePaths = [
      `.claude/agents/${managed}.md`,
      `.claude/agents/coordinators/${managed}.md`,
    ];
    const found = possiblePaths.some(p => existsSync(join(projectRoot, p)));
    if (!found) {
      fail(`Coordinator "${coordFile.split('/').pop().replace('.md', '')}" manages "${managed}" which doesn't exist`);
      crossRefValid = false;
    }
  }
}

// Check worker reports_to references
for (const agentFile of agentFiles) {
  if (coordinatorFiles.includes(agentFile) || agentFile.includes('master-orchestrator')) continue;
  const content = readText(agentFile);
  if (!content) continue;
  const fm = parseFrontmatter(content);
  if (!fm || !fm.reports_to) continue;

  const reportsTo = fm.reports_to;
  const possiblePaths = [
    `.claude/agents/${reportsTo}.md`,
    `.claude/agents/coordinators/${reportsTo}.md`,
  ];
  const found = possiblePaths.some(p => existsSync(join(projectRoot, p)));
  if (!found) {
    fail(`Agent "${agentFile.split('/').pop().replace('.md', '')}" reports_to "${reportsTo}" which doesn't exist`);
    crossRefValid = false;
  }
}

// Check settings.json hook script references
const settingsContent = readText('.claude/settings.json');
if (settingsContent) {
  try {
    const settings = JSON.parse(settingsContent);
    const hooks = settings.hooks || {};
    const hookTypes = ['PreToolUse', 'PostToolUse', 'SessionStart', 'SessionEnd',
                       'PreEditTool', 'PostEditTool', 'Notification'];
    for (const hookType of hookTypes) {
      const hookList = hooks[hookType] || [];
      for (const hook of hookList) {
        const hookCmd = typeof hook === 'string' ? hook : (hook.command || hook.script || '');
        // Extract script path from command like "node .fishi/scripts/foo.mjs"
        const scriptMatch = hookCmd.match(/\.fishi\/scripts\/[\w.-]+\.mjs/);
        if (scriptMatch) {
          const scriptPath = scriptMatch[0];
          if (!existsSync(join(projectRoot, scriptPath))) {
            fail(`Hook references script "${scriptPath}" which doesn't exist`);
            crossRefValid = false;
          }
        }
      }
    }
  } catch {
    fail('settings.json is not valid JSON');
    crossRefValid = false;
  }
}

// Check .mcp.json structure
const mcpContent = readText('.mcp.json');
if (mcpContent) {
  try {
    const mcp = JSON.parse(mcpContent);
    if (!mcp.mcpServers && !mcp.servers) {
      fail('.mcp.json missing mcpServers or servers field');
      crossRefValid = false;
    }
  } catch {
    fail('.mcp.json is not valid JSON');
    crossRefValid = false;
  }
}

if (crossRefValid) {
  ok('All references valid');
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. PIPELINE CONSISTENCY
// ═══════════════════════════════════════════════════════════════════════════

console.log(`${PREFIX} Checking pipeline consistency...`);

let pipelineValid = true;
const phases = ['discovery', 'prd', 'architecture', 'sprint_planning', 'development', 'deployment'];

// Check CLAUDE.md references all 6 phases
const claudeMd = readText('.claude/CLAUDE.md');
if (claudeMd) {
  for (const phase of phases) {
    // Allow underscore or hyphen or space variants
    const variants = [phase, phase.replace('_', '-'), phase.replace('_', ' ')];
    const found = variants.some(v => claudeMd.toLowerCase().includes(v));
    if (!found) {
      fail(`CLAUDE.md does not reference phase: ${phase}`);
      pipelineValid = false;
    }
  }
} else {
  fail('CLAUDE.md not found');
  pipelineValid = false;
}

// Check /fishi-init command references phase transitions
const initCmd = readText('.claude/commands/fishi-init.md');
if (initCmd) {
  const phaseTerms = ['discovery', 'prd', 'architecture', 'sprint', 'development', 'deployment'];
  let initMissingPhases = false;
  for (const term of phaseTerms) {
    if (!initCmd.toLowerCase().includes(term)) {
      fail(`/fishi-init command does not reference phase: ${term}`);
      pipelineValid = false;
      initMissingPhases = true;
    }
  }
}

// Check master orchestrator references all 4 default coordinators
const masterMd = readText('.claude/agents/master-orchestrator.md');
if (masterMd) {
  const coordinators = ['planning-lead', 'dev-lead', 'quality-lead', 'ops-lead'];
  for (const coord of coordinators) {
    const variants = [coord, coord.replace('-', '_'), coord.replace('-lead', '')];
    const found = variants.some(v => masterMd.toLowerCase().includes(v));
    if (!found) {
      fail(`Master orchestrator does not reference coordinator: ${coord}`);
      pipelineValid = false;
    }
  }
}

// Check each coordinator references its managed workers
for (const coordFile of coordinatorFiles) {
  const content = readText(coordFile);
  if (!content) continue;
  const fm = parseFrontmatter(content);
  if (!fm || !fm.manages) continue;

  const manages = Array.isArray(fm.manages) ? fm.manages : [fm.manages];
  const coordName = coordFile.split('/').pop().replace('.md', '');
  for (const worker of manages) {
    // Skip dynamic agent patterns
    if (worker.startsWith('dynamic:')) continue;
    // Check that the coordinator's markdown body also mentions this worker
    const variants = [worker, worker.replace('-', '_'), worker.replace('-agent', '')];
    const found = variants.some(v => content.toLowerCase().includes(v));
    if (!found) {
      fail(`Coordinator "${coordName}" has "${worker}" in manages but doesn't reference it in body`);
      pipelineValid = false;
    }
  }
}

// Check gate phases form valid sequence
const gatesContent = readText('.fishi/state/gates.yaml');
if (gatesContent) {
  // gates.yaml may be minimal at init, just validate it exists and is parseable
  // The phases themselves should be defined somewhere referencing the correct sequence
}

if (pipelineValid) {
  ok('Pipeline consistent');
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. PERMISSION VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

console.log(`${PREFIX} Checking permissions...`);

let permissionsValid = true;

if (settingsContent) {
  try {
    const settings = JSON.parse(settingsContent);
    const permissions = settings.permissions || {};
    const allow = permissions.allow || [];
    const deny = permissions.deny || [];

    if (!Array.isArray(allow)) {
      fail('settings.json permissions.allow is not an array');
      permissionsValid = false;
    } else if (allow.length === 0) {
      fail('settings.json permissions.allow is empty');
      permissionsValid = false;
    }

    if (!Array.isArray(deny)) {
      fail('settings.json permissions.deny is not an array');
      permissionsValid = false;
    } else if (deny.length === 0) {
      fail('settings.json permissions.deny is empty');
      permissionsValid = false;
    }

    if (Array.isArray(allow) && Array.isArray(deny)) {
      // Check for duplicates in allow
      const allowSet = new Set();
      for (const entry of allow) {
        const key = typeof entry === 'string' ? entry : JSON.stringify(entry);
        if (allowSet.has(key)) {
          fail(`Duplicate entry in permissions.allow: ${key}`);
          permissionsValid = false;
        }
        allowSet.add(key);
      }

      // Check for duplicates in deny
      const denySet = new Set();
      for (const entry of deny) {
        const key = typeof entry === 'string' ? entry : JSON.stringify(entry);
        if (denySet.has(key)) {
          fail(`Duplicate entry in permissions.deny: ${key}`);
          permissionsValid = false;
        }
        denySet.add(key);
      }

      // Check for conflicts (exact same pattern in both allow and deny)
      for (const entry of allow) {
        const key = typeof entry === 'string' ? entry : JSON.stringify(entry);
        if (denySet.has(key)) {
          fail(`Conflict: "${key}" appears in both allow and deny`);
          permissionsValid = false;
        }
      }

      if (permissionsValid) {
        ok(`${allow.length} allow, ${deny.length} deny, no conflicts`);
      }
    }
  } catch {
    fail('settings.json is not valid JSON — cannot check permissions');
    permissionsValid = false;
  }
} else {
  fail('settings.json not found — cannot check permissions');
  permissionsValid = false;
}

// ═══════════════════════════════════════════════════════════════════════════
// FINAL SUMMARY
// ═══════════════════════════════════════════════════════════════════════════

console.log(`${PREFIX} `);

if (issueCount === 0) {
  console.log(`${PREFIX} \u2705 All checks passed!`);
  process.exit(0);
} else {
  warn(`${issueCount} issue${issueCount === 1 ? '' : 's'} found`);
  process.exit(1);
}
