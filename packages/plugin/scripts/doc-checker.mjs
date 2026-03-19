#!/usr/bin/env node
// doc-checker.mjs — FISHI documentation enforcement
// Usage:
//   node .fishi/scripts/doc-checker.mjs check --phase discovery
//   node .fishi/scripts/doc-checker.mjs check --phase prd
//   node .fishi/scripts/doc-checker.mjs check --phase architecture
//   node .fishi/scripts/doc-checker.mjs check --phase sprint_planning
//   node .fishi/scripts/doc-checker.mjs check --phase development
//   node .fishi/scripts/doc-checker.mjs check --phase deployment
//   node .fishi/scripts/doc-checker.mjs check-all
//   node .fishi/scripts/doc-checker.mjs report

import { readFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join } from 'path';

// ── Helpers ─────────────────────────────────────────────────────────

function findMdFiles(dir) {
  if (!existsSync(dir)) return [];
  try {
    return readdirSync(dir).filter(f => f.endsWith('.md'));
  } catch {
    return [];
  }
}

function readFileSafe(filePath) {
  try {
    return readFileSync(filePath, 'utf-8');
  } catch {
    return '';
  }
}

function hasSection(content, ...sectionNames) {
  const lower = content.toLowerCase();
  return sectionNames.some(name => {
    const pattern = new RegExp('^#{1,3}\\s+.*' + name.toLowerCase().replace(/\s+/g, '\\s+'), 'm');
    return pattern.test(lower);
  });
}

// ── Phase Checkers ──────────────────────────────────────────────────

function checkDiscovery() {
  const checks = [];
  const dir = '.fishi/plans/discovery';
  const mdFiles = findMdFiles(dir);

  checks.push({
    check: 'Discovery directory has at least one .md file',
    passed: mdFiles.length > 0,
    ...(mdFiles.length > 0 ? { path: join(dir, mdFiles[0]) } : {}),
  });

  return { phase: 'discovery', checks };
}

function checkPrd() {
  const checks = [];
  const dir = '.fishi/plans/prd';
  const mdFiles = findMdFiles(dir);

  checks.push({
    check: 'PRD file exists',
    passed: mdFiles.length > 0,
    ...(mdFiles.length > 0 ? { path: join(dir, mdFiles[0]) } : {}),
  });

  if (mdFiles.length > 0) {
    const content = readFileSafe(join(dir, mdFiles[0]));

    checks.push({
      check: 'Has Overview section',
      passed: hasSection(content, 'Overview'),
    });

    checks.push({
      check: 'Has User Stories or Requirements section',
      passed: hasSection(content, 'User Stories', 'Requirements'),
    });

    checks.push({
      check: 'Has Success Metrics or Goals section',
      passed: hasSection(content, 'Success Metrics', 'Goals'),
    });
  } else {
    checks.push({ check: 'Has Overview section', passed: false });
    checks.push({ check: 'Has User Stories or Requirements section', passed: false });
    checks.push({ check: 'Has Success Metrics or Goals section', passed: false });
  }

  return { phase: 'prd', checks };
}

function checkArchitecture() {
  const checks = [];
  const dir = '.fishi/plans/architecture';
  const mdFiles = findMdFiles(dir);

  checks.push({
    check: 'Architecture doc exists',
    passed: mdFiles.length > 0,
    ...(mdFiles.length > 0 ? { path: join(dir, mdFiles[0]) } : {}),
  });

  if (mdFiles.length > 0) {
    const allContent = mdFiles.map(f => readFileSafe(join(dir, f))).join('\n');

    checks.push({
      check: 'Contains system design',
      passed: hasSection(allContent, 'System Design', 'System Architecture', 'Architecture'),
    });

    checks.push({
      check: 'Contains data model or API contracts',
      passed: hasSection(allContent, 'Data Model', 'Data Schema', 'API Contracts', 'API Design', 'API Endpoints'),
    });
  } else {
    checks.push({ check: 'Contains system design', passed: false });
    checks.push({ check: 'Contains data model or API contracts', passed: false });
  }

  return { phase: 'architecture', checks };
}

function checkSprintPlanning() {
  const checks = [];

  // board.md must have at least 1 task entry
  const boardPath = '.fishi/taskboard/board.md';
  const boardContent = readFileSafe(boardPath);
  const taskEntries = (boardContent.match(/###\s+TASK-/g) || []).length;

  checks.push({
    check: 'TaskBoard has at least 1 task entry (### TASK-)',
    passed: taskEntries >= 1,
    ...(taskEntries >= 1 ? { path: boardPath } : {}),
  });

  // sprints directory must have at least 1 sprint file
  const sprintDir = '.fishi/taskboard/sprints';
  const sprintFiles = findMdFiles(sprintDir);
  checks.push({
    check: 'At least 1 sprint file in sprints/',
    passed: sprintFiles.length > 0,
    ...(sprintFiles.length > 0 ? { path: join(sprintDir, sprintFiles[0]) } : {}),
  });

  // epics directory must have at least 1 epic file
  const epicDir = '.fishi/taskboard/epics';
  const epicFiles = findMdFiles(epicDir);
  checks.push({
    check: 'At least 1 epic file in epics/',
    passed: epicFiles.length > 0,
    ...(epicFiles.length > 0 ? { path: join(epicDir, epicFiles[0]) } : {}),
  });

  return { phase: 'sprint_planning', checks };
}

function checkDevelopment() {
  const checks = [];

  // Check decisions.md has at least 1 entry
  const decisionsPath = '.fishi/memory/decisions.md';
  const decisionsContent = readFileSafe(decisionsPath);
  const hasEntries = decisionsContent.includes('## ') &&
    !decisionsContent.includes('No decisions recorded yet');

  checks.push({
    check: 'decisions.md has at least 1 entry',
    passed: hasEntries,
    ...(hasEntries ? { path: decisionsPath } : {}),
  });

  // Check changelog exists
  const changelogPaths = ['CHANGELOG.md', 'changelog.md', 'Changelog.md'];
  const changelogExists = changelogPaths.some(p => existsSync(p));

  checks.push({
    check: 'Changelog file exists',
    passed: changelogExists,
    ...(changelogExists ? { path: changelogPaths.find(p => existsSync(p)) } : {}),
  });

  return { phase: 'development', checks };
}

function checkDeployment() {
  const checks = [];

  // docs/ directory must exist with README.md or deployment doc
  const docsDir = 'docs';
  const docsExist = existsSync(docsDir);
  let hasReadmeOrDeployDoc = false;
  let docPath = '';

  if (docsExist) {
    const docsFiles = findMdFiles(docsDir);
    const match = docsFiles.find(f =>
      f.toLowerCase().includes('readme') || f.toLowerCase().includes('deploy')
    );
    if (match) {
      hasReadmeOrDeployDoc = true;
      docPath = join(docsDir, match);
    }
  }

  checks.push({
    check: 'docs/ directory has README.md or deployment doc',
    passed: hasReadmeOrDeployDoc,
    ...(hasReadmeOrDeployDoc ? { path: docPath } : {}),
  });

  // .fishi/plans/ must have a deployment checklist
  const plansDir = '.fishi/plans';
  let hasDeployChecklist = false;
  let deployPath = '';

  if (existsSync(plansDir)) {
    // Check recursively in plans for deployment-related files
    const checkDir = (dir) => {
      if (!existsSync(dir)) return;
      try {
        const entries = readdirSync(dir);
        for (const entry of entries) {
          const full = join(dir, entry);
          try {
            const stat = statSync(full);
            if (stat.isDirectory()) {
              checkDir(full);
            } else if (entry.endsWith('.md') && entry.toLowerCase().includes('deploy')) {
              hasDeployChecklist = true;
              deployPath = full;
            }
          } catch {}
        }
      } catch {}
    };
    checkDir(plansDir);

    // Also check top-level plans files
    if (!hasDeployChecklist) {
      const planFiles = findMdFiles(plansDir);
      const match = planFiles.find(f => f.toLowerCase().includes('deploy'));
      if (match) {
        hasDeployChecklist = true;
        deployPath = join(plansDir, match);
      }
    }
  }

  checks.push({
    check: 'Deployment checklist exists in .fishi/plans/',
    passed: hasDeployChecklist,
    ...(hasDeployChecklist ? { path: deployPath } : {}),
  });

  return { phase: 'deployment', checks };
}

// ── Phase dispatcher ────────────────────────────────────────────────

const phaseCheckers = {
  discovery: checkDiscovery,
  prd: checkPrd,
  architecture: checkArchitecture,
  sprint_planning: checkSprintPlanning,
  development: checkDevelopment,
  deployment: checkDeployment,
};

const PHASES = Object.keys(phaseCheckers);

function runCheck(phase) {
  const checker = phaseCheckers[phase];
  if (!checker) {
    console.error('[FISHI] Unknown phase: ' + phase);
    console.error('Valid phases: ' + PHASES.join(', '));
    process.exit(1);
  }

  const result = checker();
  const allPassed = result.checks.every(c => c.passed);
  result.status = allPassed ? 'pass' : 'fail';

  return result;
}

// ── Commands ────────────────────────────────────────────────────────

function cmdCheck(phase) {
  const result = runCheck(phase);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.status === 'pass' ? 0 : 1);
}

function cmdCheckAll() {
  const results = [];
  let allPass = true;

  for (const phase of PHASES) {
    const result = runCheck(phase);
    results.push(result);
    if (result.status !== 'pass') allPass = false;
  }

  console.log(JSON.stringify(results, null, 2));
  process.exit(allPass ? 0 : 1);
}

function cmdReport() {
  const lines = [];
  lines.push('# Documentation Status Report');
  lines.push('');
  lines.push('| Phase | Status | Checks Passed | Details |');
  lines.push('|-------|--------|--------------|---------|');

  for (const phase of PHASES) {
    const result = runCheck(phase);
    const passed = result.checks.filter(c => c.passed).length;
    const total = result.checks.length;
    const icon = result.status === 'pass' ? 'PASS' : 'FAIL';
    const failedChecks = result.checks
      .filter(c => !c.passed)
      .map(c => c.check)
      .join('; ');
    const details = result.status === 'pass' ? 'All checks passed' : failedChecks;

    lines.push('| ' + phase + ' | ' + icon + ' | ' + passed + '/' + total + ' | ' + details + ' |');
  }

  lines.push('');
  lines.push('Generated: ' + new Date().toISOString());

  console.log(lines.join('\n'));
}

// ── CLI argument parsing ────────────────────────────────────────────

const args = process.argv.slice(2);
const command = args[0];

function getArg(name) {
  const idx = args.indexOf('--' + name);
  if (idx === -1 || idx + 1 >= args.length) return null;
  return args[idx + 1];
}

try {
  switch (command) {
    case 'check':
      cmdCheck(getArg('phase'));
      break;
    case 'check-all':
      cmdCheckAll();
      break;
    case 'report':
      cmdReport();
      break;
    default:
      console.error('Usage: doc-checker.mjs <check|check-all|report> [--phase <name>]');
      console.error('Phases: ' + PHASES.join(', '));
      process.exit(1);
  }
} catch (err) {
  console.error('[FISHI] Doc checker error:', err.message);
  process.exit(1);
}
