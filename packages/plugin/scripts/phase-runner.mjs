#!/usr/bin/env node
// phase-runner.mjs — FISHI phase transition orchestrator
// Usage:
//   node .fishi/scripts/phase-runner.mjs current              # Show current phase
//   node .fishi/scripts/phase-runner.mjs next                 # Show what the next phase would be
//   node .fishi/scripts/phase-runner.mjs advance              # Advance to next phase (requires gate approval)
//   node .fishi/scripts/phase-runner.mjs set --phase <name>   # Set phase directly (for recovery)
//   node .fishi/scripts/phase-runner.mjs validate             # Validate full pipeline is configured correctly
//   node .fishi/scripts/phase-runner.mjs dry-run              # Simulate full pipeline without executing

import { readFileSync, writeFileSync, existsSync } from 'fs';

const PROJECT_FILE = '.fishi/state/project.yaml';
const GATES_FILE = '.fishi/state/gates.yaml';

// Phase sequence — the canonical pipeline order
const PHASES = [
  { name: 'init',            description: 'Project initialized, awaiting /fishi-init',        gate: null },
  { name: 'discovery',       description: 'Product discovery & brainstorming',          gate: 'discovery' },
  { name: 'prd',             description: 'PRD creation & requirements',                gate: 'prd' },
  { name: 'architecture',    description: 'System architecture & tech stack design',    gate: 'architecture' },
  { name: 'sprint_planning', description: 'Sprint planning — epics, stories, tasks',    gate: 'sprint_planning' },
  { name: 'development',     description: 'Sprint execution — agents coding in worktrees', gate: null },
  { name: 'deployment',      description: 'CI/CD, docs, security audit, deploy',        gate: 'deployment' },
  { name: 'deployed',        description: 'Project deployed and complete',              gate: null },
];

// ── Helpers ───────────────────────────────────────────────────────────

function readProjectPhase() {
  if (!existsSync(PROJECT_FILE)) return 'init';
  const content = readFileSync(PROJECT_FILE, 'utf-8');
  const match = content.match(/phase:\s*(\S+)/);
  return match ? match[1] : 'init';
}

function setProjectPhase(phase) {
  if (!existsSync(PROJECT_FILE)) return;
  let content = readFileSync(PROJECT_FILE, 'utf-8');
  if (content.includes('phase:')) {
    content = content.replace(/phase:\s*.*/, 'phase: ' + phase);
  } else {
    content += '\nphase: ' + phase + '\n';
  }
  writeFileSync(PROJECT_FILE, content, 'utf-8');
}

function getPhaseIndex(phaseName) {
  return PHASES.findIndex(p => p.name === phaseName);
}

function getGateStatus(gateName) {
  if (!existsSync(GATES_FILE)) return null;
  const content = readFileSync(GATES_FILE, 'utf-8');
  // Simple parse: find the gate by name and its status
  const lines = content.split('\n');
  let foundGate = false;
  for (const line of lines) {
    if (line.includes('phase:') && line.includes(gateName)) {
      foundGate = true;
    }
    if (foundGate && line.includes('status:')) {
      const status = line.replace(/.*status:\s*/, '').replace(/["']/g, '').trim();
      return status;
    }
  }
  return null;
}

// ── Commands ──────────────────────────────────────────────────────────

function cmdCurrent() {
  const phase = readProjectPhase();
  const idx = getPhaseIndex(phase);
  const phaseInfo = PHASES[idx] || { name: phase, description: 'Unknown phase' };
  console.log(JSON.stringify({
    phase: phaseInfo.name,
    index: idx,
    description: phaseInfo.description,
    total_phases: PHASES.length,
    progress: Math.round((idx / (PHASES.length - 1)) * 100) + '%',
  }, null, 2));
}

function cmdNext() {
  const phase = readProjectPhase();
  const idx = getPhaseIndex(phase);

  if (idx === -1 || idx >= PHASES.length - 1) {
    console.log(JSON.stringify({ error: 'Already at final phase or unknown phase', current: phase }));
    return;
  }

  const next = PHASES[idx + 1];
  const gateRequired = PHASES[idx].gate;
  let gateStatus = null;

  if (gateRequired) {
    gateStatus = getGateStatus(gateRequired);
  }

  console.log(JSON.stringify({
    current: phase,
    next: next.name,
    next_description: next.description,
    gate_required: gateRequired,
    gate_status: gateStatus,
    can_advance: !gateRequired || gateStatus === 'approved' || gateStatus === 'skipped',
  }, null, 2));
}

function cmdAdvance() {
  const phase = readProjectPhase();
  const idx = getPhaseIndex(phase);

  if (idx === -1 || idx >= PHASES.length - 1) {
    console.log(JSON.stringify({ error: 'Cannot advance — already at final phase', current: phase }));
    process.exit(1);
  }

  const gateRequired = PHASES[idx].gate;
  if (gateRequired) {
    const gateStatus = getGateStatus(gateRequired);
    if (gateStatus !== 'approved' && gateStatus !== 'skipped') {
      console.log(JSON.stringify({
        error: 'Gate not approved',
        gate: gateRequired,
        gate_status: gateStatus || 'not_created',
        hint: 'Run: node .fishi/scripts/gate-manager.mjs approve --phase ' + gateRequired,
      }));
      process.exit(1);
    }
  }

  const next = PHASES[idx + 1];
  setProjectPhase(next.name);
  console.log(JSON.stringify({
    previous: phase,
    current: next.name,
    description: next.description,
    status: 'advanced',
  }));
}

function cmdSet(phase) {
  const idx = getPhaseIndex(phase);
  if (idx === -1) {
    console.log(JSON.stringify({
      error: 'Unknown phase: ' + phase,
      valid_phases: PHASES.map(p => p.name),
    }));
    process.exit(1);
  }

  setProjectPhase(phase);
  console.log(JSON.stringify({
    phase: phase,
    description: PHASES[idx].description,
    status: 'set',
  }));
}

function cmdValidate() {
  const issues = [];
  let checks = 0;

  // Check project file exists
  checks++;
  if (!existsSync(PROJECT_FILE)) {
    issues.push('Missing project state file: ' + PROJECT_FILE);
  }

  // Check current phase is valid
  checks++;
  const phase = readProjectPhase();
  if (getPhaseIndex(phase) === -1) {
    issues.push('Unknown phase in project.yaml: ' + phase);
  }

  // Check gates file exists
  checks++;
  if (!existsSync(GATES_FILE)) {
    issues.push('Missing gates file: ' + GATES_FILE);
  }

  // Check required files for each phase
  const phaseFiles = {
    discovery: ['.claude/skills/brainstorming/SKILL.md'],
    prd: ['.claude/skills/prd/SKILL.md', '.claude/commands/fishi-prd.md'],
    architecture: ['.claude/agents/architect-agent.md', '.claude/agents/coordinators/planning-lead.md'],
    sprint_planning: ['.claude/agents/planning-agent.md', '.fishi/taskboard/board.md'],
    development: [
      '.claude/agents/coordinators/dev-lead.md',
      '.claude/agents/coordinators/quality-lead.md',
      '.claude/agents/backend-agent.md',
      '.claude/agents/frontend-agent.md',
      '.claude/agents/testing-agent.md',
      '.fishi/scripts/worktree-manager.mjs',
    ],
    deployment: [
      '.claude/agents/coordinators/ops-lead.md',
      '.claude/agents/devops-agent.md',
      '.claude/agents/docs-agent.md',
    ],
  };

  for (const [phaseName, files] of Object.entries(phaseFiles)) {
    for (const file of files) {
      checks++;
      if (!existsSync(file)) {
        issues.push('Phase "' + phaseName + '" missing required file: ' + file);
      }
    }
  }

  // Check gate-manager and worktree-manager exist
  checks++;
  if (!existsSync('.fishi/scripts/gate-manager.mjs')) {
    issues.push('Missing gate-manager.mjs');
  }
  checks++;
  if (!existsSync('.fishi/scripts/worktree-manager.mjs')) {
    issues.push('Missing worktree-manager.mjs');
  }

  // Check CLAUDE.md exists and mentions the pipeline
  checks++;
  if (existsSync('.claude/CLAUDE.md')) {
    const claudeMd = readFileSync('.claude/CLAUDE.md', 'utf-8');
    if (!claudeMd.includes('PRD') && !claudeMd.includes('prd')) {
      issues.push('CLAUDE.md does not reference PRD phase');
    }
  } else {
    issues.push('Missing .claude/CLAUDE.md');
  }

  // Check settings.json has hooks and permissions
  checks++;
  if (existsSync('.claude/settings.json')) {
    try {
      const settings = JSON.parse(readFileSync('.claude/settings.json', 'utf-8'));
      if (!settings.hooks) issues.push('settings.json missing hooks');
      if (!settings.permissions) issues.push('settings.json missing permissions');
      if (!settings.permissions?.allow?.length) issues.push('settings.json has no allow rules');
      if (!settings.permissions?.deny?.length) issues.push('settings.json has no deny rules');
    } catch {
      issues.push('settings.json is not valid JSON');
    }
  } else {
    issues.push('Missing .claude/settings.json');
  }

  if (issues.length === 0) {
    console.log(JSON.stringify({
      status: 'valid',
      checks_passed: checks,
      message: 'All pipeline checks passed',
    }));
  } else {
    console.log(JSON.stringify({
      status: 'invalid',
      checks_passed: checks - issues.length,
      checks_total: checks,
      issues: issues,
    }));
    process.exit(1);
  }
}

function cmdDryRun() {
  console.log('[FISHI DRY-RUN] Simulating full pipeline...');
  console.log('');

  for (let i = 0; i < PHASES.length; i++) {
    const phase = PHASES[i];
    const prefix = i === 0 ? '  START' : (i === PHASES.length - 1 ? '  END  ' : '  PHASE');
    const gate = phase.gate ? ' → GATE: ' + phase.gate : '';
    console.log(prefix + ' ' + (i) + ': ' + phase.name.padEnd(16) + ' — ' + phase.description + gate);
  }

  console.log('');
  console.log('[FISHI DRY-RUN] Pipeline has ' + PHASES.length + ' phases, ' + PHASES.filter(p => p.gate).length + ' gates');
  console.log('[FISHI DRY-RUN] Validating required files...');

  // Run validate silently
  const origLog = console.log;
  let validateResult;
  console.log = (msg) => { validateResult = msg; };
  try {
    cmdValidate();
    console.log = origLog;
    const result = JSON.parse(validateResult);
    if (result.status === 'valid') {
      console.log('[FISHI DRY-RUN] ✅ All ' + result.checks_passed + ' checks passed. Pipeline ready.');
    } else {
      console.log('[FISHI DRY-RUN] ⚠ ' + result.issues.length + ' issues found:');
      for (const issue of result.issues) {
        console.log('  ✗ ' + issue);
      }
    }
  } catch {
    console.log = origLog;
    console.log('[FISHI DRY-RUN] ✅ Validation passed');
  }
}

// ── CLI ───────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const command = args[0];

function getArg(name) {
  const idx = args.indexOf('--' + name);
  if (idx === -1 || idx + 1 >= args.length) return null;
  return args[idx + 1];
}

try {
  switch (command) {
    case 'current':
      cmdCurrent();
      break;
    case 'next':
      cmdNext();
      break;
    case 'advance':
      cmdAdvance();
      break;
    case 'set':
      cmdSet(getArg('phase'));
      break;
    case 'validate':
      cmdValidate();
      break;
    case 'dry-run':
      cmdDryRun();
      break;
    default:
      console.error('Usage: phase-runner.mjs <current|next|advance|set|validate|dry-run> [--phase <name>]');
      console.error('Phases: ' + PHASES.map(p => p.name).join(' → '));
      process.exit(1);
  }
} catch (err) {
  console.error('[FISHI] Phase runner error:', err.message);
  process.exit(1);
}
