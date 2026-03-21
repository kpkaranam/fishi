/**
 * Gate Manager Script
 *
 * CLI utility for managing approval gates. Agents and coordinators invoke this
 * to create, check, and update gate status.
 *
 * Zero dependencies — uses only Node.js built-ins.
 */

export function getGateManagerScript(): string {
  return `#!/usr/bin/env node
// gate-manager.mjs — FISHI approval gate management
// Usage:
//   node .fishi/scripts/gate-manager.mjs create --phase "prd" --description "Approve PRD"
//   node .fishi/scripts/gate-manager.mjs status
//   node .fishi/scripts/gate-manager.mjs approve --phase "prd"
//   node .fishi/scripts/gate-manager.mjs reject --phase "prd" --reason "Need more detail on auth"
//   node .fishi/scripts/gate-manager.mjs skip --phase "prd"

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';

const GATES_FILE = '.fishi/state/gates.yaml';

// ── Minimal YAML helpers (no deps) ────────────────────────────────────

function parseSimpleYaml(text) {
  const result = {};
  let currentKey = null;
  let currentList = null;

  for (const line of text.split('\\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Top-level key
    const keyMatch = trimmed.match(/^(\\w+):\\s*(.*)$/);
    if (keyMatch && !line.startsWith(' ') && !line.startsWith('\\t')) {
      currentKey = keyMatch[1];
      const value = keyMatch[2].trim();
      if (value) {
        result[currentKey] = value.replace(/^["']|["']$/g, '');
      } else {
        result[currentKey] = {};
      }
      currentList = null;
      continue;
    }

    // List item
    if (trimmed.startsWith('- ') && currentKey) {
      if (!Array.isArray(result[currentKey])) {
        result[currentKey] = [];
      }
      result[currentKey].push(trimmed.slice(2));
      continue;
    }

    // Nested key-value
    if (currentKey && typeof result[currentKey] === 'object' && !Array.isArray(result[currentKey])) {
      const nestedMatch = trimmed.match(/^(\\w+):\\s*(.+)$/);
      if (nestedMatch) {
        result[currentKey][nestedMatch[1]] = nestedMatch[2].replace(/^["']|["']$/g, '');
      }
    }
  }

  return result;
}

// ── Gate data operations ──────────────────────────────────────────────

function loadGates() {
  if (!existsSync(GATES_FILE)) {
    return { gates: [] };
  }
  try {
    const content = readFileSync(GATES_FILE, 'utf-8');
    // Parse gate entries manually
    const gates = [];
    let currentGate = null;

    for (const line of content.split('\\n')) {
      if (line.trim().startsWith('- phase:')) {
        if (currentGate) gates.push(currentGate);
        currentGate = { phase: line.trim().replace('- phase:', '').trim().replace(/["']/g, '') };
      } else if (currentGate && line.trim().startsWith('status:')) {
        currentGate.status = line.trim().replace('status:', '').trim().replace(/["']/g, '');
      } else if (currentGate && line.trim().startsWith('description:')) {
        currentGate.description = line.trim().replace('description:', '').trim().replace(/["']/g, '');
      } else if (currentGate && line.trim().startsWith('timestamp:')) {
        currentGate.timestamp = line.trim().replace('timestamp:', '').trim().replace(/["']/g, '');
      } else if (currentGate && line.trim().startsWith('reason:')) {
        currentGate.reason = line.trim().replace('reason:', '').trim().replace(/["']/g, '');
      } else if (currentGate && line.trim().startsWith('docs_checked:')) {
        currentGate.docs_checked = line.trim().replace('docs_checked:', '').trim() === 'true';
      }
    }
    if (currentGate) gates.push(currentGate);

    return { gates };
  } catch {
    return { gates: [] };
  }
}

function saveGates(data) {
  const dir = dirname(GATES_FILE);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  let yaml = 'gates:\\n';
  for (const gate of data.gates) {
    yaml += '  - phase: "' + gate.phase + '"\\n';
    yaml += '    description: "' + (gate.description || '') + '"\\n';
    yaml += '    status: "' + gate.status + '"\\n';
    yaml += '    timestamp: "' + gate.timestamp + '"\\n';
    if (gate.reason) {
      yaml += '    reason: "' + gate.reason + '"\\n';
    }
    if (gate.docs_checked !== undefined) {
      yaml += '    docs_checked: ' + gate.docs_checked + '\\n';
    }
  }

  writeFileSync(GATES_FILE, yaml, 'utf-8');
}

// ── Commands ──────────────────────────────────────────────────────────

function createGate(phase, description) {
  const data = loadGates();

  // Check if gate already exists
  const existing = data.gates.find(g => g.phase === phase);
  if (existing) {
    console.log(JSON.stringify({ error: 'Gate already exists', phase, status: existing.status }));
    process.exit(1);
  }

  data.gates.push({
    phase,
    description: description || phase + ' approval gate',
    status: 'pending',
    timestamp: new Date().toISOString(),
  });

  saveGates(data);

  // Emit monitoring event
  try { import(new URL('./monitor-emitter.mjs', import.meta.url).href).then(m => m.emitMonitorEvent(process.cwd(), { type: 'gate.created', agent: 'master-orchestrator', data: { phase } })).catch(() => {}); } catch {}

  console.log(JSON.stringify({ phase, status: 'pending', action: 'created' }));
}

function checkDocsForPhase(phase) {
  // Run doc-checker inline for the given phase
  // We replicate a lightweight check here to avoid spawning a subprocess
  const phaseCheckers = {
    discovery() {
      const dir = '.fishi/plans/discovery';
      if (!existsSync(dir)) return false;
      try { return readdirSync(dir).filter(f => f.endsWith('.md')).length > 0; } catch { return false; }
    },
    prd() {
      const dir = '.fishi/plans/prd';
      if (!existsSync(dir)) return false;
      try { return readdirSync(dir).filter(f => f.endsWith('.md')).length > 0; } catch { return false; }
    },
    architecture() {
      const dir = '.fishi/plans/architecture';
      if (!existsSync(dir)) return false;
      try { return readdirSync(dir).filter(f => f.endsWith('.md')).length > 0; } catch { return false; }
    },
    sprint_planning() {
      const boardPath = '.fishi/taskboard/board.md';
      if (!existsSync(boardPath)) return false;
      const content = readFileSync(boardPath, 'utf-8');
      return (content.match(/###\\s+TASK-/g) || []).length >= 1;
    },
    development() {
      const decisionsPath = '.fishi/memory/decisions.md';
      if (!existsSync(decisionsPath)) return false;
      const content = readFileSync(decisionsPath, 'utf-8');
      return content.includes('## ') && !content.includes('No decisions recorded yet');
    },
    deployment() {
      if (!existsSync('docs')) return false;
      try {
        const files = readdirSync('docs').filter(f => f.endsWith('.md'));
        return files.some(f => f.toLowerCase().includes('readme') || f.toLowerCase().includes('deploy'));
      } catch { return false; }
    },
  };

  const checker = phaseCheckers[phase];
  if (!checker) return null; // unknown phase, skip check
  try {
    return checker();
  } catch {
    return false;
  }
}

function approveGate(phase) {
  const data = loadGates();
  const gate = data.gates.find(g => g.phase === phase);

  if (!gate) {
    console.log(JSON.stringify({ error: 'Gate not found', phase }));
    process.exit(1);
  }

  // Documentation check (soft — warns but does not block)
  const docsPresent = checkDocsForPhase(phase);
  if (docsPresent === false) {
    console.error('[FISHI] WARNING: Documentation checks did not pass for phase "' + phase + '". Approval will proceed but docs are incomplete.');
  } else if (docsPresent === true) {
    console.error('[FISHI] Documentation checks passed for phase "' + phase + '".');
  }

  gate.status = 'approved';
  gate.timestamp = new Date().toISOString();
  gate.docs_checked = docsPresent === true;
  saveGates(data);

  // Update project.yaml phase
  updateProjectPhase(phase, 'approved');

  // Emit monitoring event
  try { import(new URL('./monitor-emitter.mjs', import.meta.url).href).then(m => m.emitMonitorEvent(process.cwd(), { type: 'gate.approved', agent: 'master-orchestrator', data: { phase } })).catch(() => {}); } catch {}

  console.log(JSON.stringify({ phase, status: 'approved', action: 'approved', docs_checked: gate.docs_checked }));
}

function rejectGate(phase, reason) {
  const data = loadGates();
  const gate = data.gates.find(g => g.phase === phase);

  if (!gate) {
    console.log(JSON.stringify({ error: 'Gate not found', phase }));
    process.exit(1);
  }

  gate.status = 'rejected';
  gate.reason = reason || 'No reason provided';
  gate.timestamp = new Date().toISOString();
  saveGates(data);

  // Emit monitoring event
  try { import(new URL('./monitor-emitter.mjs', import.meta.url).href).then(m => m.emitMonitorEvent(process.cwd(), { type: 'gate.rejected', agent: 'master-orchestrator', data: { phase, reason: gate.reason } })).catch(() => {}); } catch {}

  console.log(JSON.stringify({ phase, status: 'rejected', reason: gate.reason, action: 'rejected' }));
}

function skipGate(phase) {
  const data = loadGates();
  const gate = data.gates.find(g => g.phase === phase);

  if (!gate) {
    console.log(JSON.stringify({ error: 'Gate not found', phase }));
    process.exit(1);
  }

  gate.status = 'skipped';
  gate.timestamp = new Date().toISOString();
  saveGates(data);

  updateProjectPhase(phase, 'skipped');

  // Emit monitoring event
  try { import(new URL('./monitor-emitter.mjs', import.meta.url).href).then(m => m.emitMonitorEvent(process.cwd(), { type: 'gate.skipped', agent: 'master-orchestrator', data: { phase } })).catch(() => {}); } catch {}

  console.log(JSON.stringify({ phase, status: 'skipped', action: 'skipped' }));
}

function showStatus() {
  const data = loadGates();
  console.log(JSON.stringify(data.gates, null, 2));
}

function updateProjectPhase(gateName, gateStatus) {
  const projectFile = '.fishi/state/project.yaml';
  if (!existsSync(projectFile)) return;

  try {
    let content = readFileSync(projectFile, 'utf-8');

    // Map gate names to next phase
    const phaseMap = {
      discovery: 'prd',
      prd: 'architecture',
      architecture: 'sprint_planning',
      sprint_planning: 'development',
      sprint_review: 'development',
      deployment: 'deployed',
    };

    const nextPhase = phaseMap[gateName];
    if (nextPhase && (gateStatus === 'approved' || gateStatus === 'skipped')) {
      // Try both formats — project.yaml may use either 'phase:' or 'current_phase:'
      if (content.includes('current_phase:')) {
        content = content.replace(/current_phase:\\s*.*/, 'current_phase: ' + nextPhase);
      } else {
        content = content.replace(/phase:\\s*.*/, 'phase: ' + nextPhase);
      }
      writeFileSync(projectFile, content, 'utf-8');
    }
  } catch {
    // Non-critical, don't fail
  }
}

// ── CLI argument parsing ──────────────────────────────────────────────

const args = process.argv.slice(2);
const command = args[0];

function getArg(name) {
  const idx = args.indexOf('--' + name);
  if (idx === -1 || idx + 1 >= args.length) return null;
  return args[idx + 1];
}

try {
  switch (command) {
    case 'create':
      createGate(getArg('phase'), getArg('description'));
      break;
    case 'approve':
      approveGate(getArg('phase'));
      break;
    case 'reject':
      rejectGate(getArg('phase'), getArg('reason'));
      break;
    case 'skip':
      skipGate(getArg('phase'));
      break;
    case 'status':
      showStatus();
      break;
    default:
      console.error('Usage: gate-manager.mjs <create|approve|reject|skip|status> [--phase <name>] [--reason <text>]');
      process.exit(1);
  }
} catch (err) {
  console.error('[FISHI] Gate manager error:', err.message);
  process.exit(1);
}
`;
}
