/**
 * Learnings Manager Script
 *
 * CLI utility for capturing mistakes, fixes, and best practices.
 * Stores learnings locally (per-project) and globally (cross-project).
 *
 * Zero dependencies — uses only Node.js built-ins.
 */

export function getLearningsManagerScript(): string {
  return `#!/usr/bin/env node
// learnings-manager.mjs — FISHI learning from mistakes system
// Usage:
//   node .fishi/scripts/learnings-manager.mjs add-mistake --agent backend-agent --domain backend \\
//     --mistake "Used raw SQL" --fix "Switched to parameterized queries" --lesson "Always parameterize"
//   node .fishi/scripts/learnings-manager.mjs add-practice --agent backend-agent --domain backend \\
//     --practice "Used Zod schemas" --why "Catches bad requests" --apply "Every endpoint should validate"
//   node .fishi/scripts/learnings-manager.mjs read --agent backend-agent --domain backend
//   node .fishi/scripts/learnings-manager.mjs read-all
//   node .fishi/scripts/learnings-manager.mjs search --query "authentication"

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';

// ── Paths ───────────────────────────────────────────────────────────────

const HOME = process.env.HOME || process.env.USERPROFILE || homedir();
const LOCAL_BASE = '.fishi/learnings';
const GLOBAL_BASE = join(HOME, '.fishi', 'learnings');

function localShared() { return join(LOCAL_BASE, 'shared.md'); }
function localDomain(d) { return join(LOCAL_BASE, 'by-domain', d + '.md'); }
function localAgent(a) { return join(LOCAL_BASE, 'by-agent', a + '.md'); }
function globalShared() { return join(GLOBAL_BASE, 'shared.md'); }
function globalDomain(d) { return join(GLOBAL_BASE, 'by-domain', d + '.md'); }

// ── Helpers ─────────────────────────────────────────────────────────────

function ensureFile(filePath, header) {
  const dir = dirname(filePath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  if (!existsSync(filePath)) writeFileSync(filePath, header + '\\n', 'utf-8');
}

function readSafe(filePath) {
  if (!existsSync(filePath)) return '';
  return readFileSync(filePath, 'utf-8');
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      if (i + 1 < argv.length && !argv[i + 1].startsWith('--')) {
        args[key] = argv[++i];
      } else {
        args[key] = true;
      }
    }
  }
  return args;
}

function makeHeader(title) {
  return '# Learnings \\u2014 ' + title;
}

function findSection(content, sectionTitle) {
  const marker = '## ' + sectionTitle;
  const idx = content.indexOf(marker);
  return idx;
}

function ensureSections(content, header) {
  let out = content;
  if (!out.trim()) out = header + '\\n';
  if (out.indexOf('## Mistakes & Fixes') === -1) {
    out += '\\n## Mistakes & Fixes\\n';
  }
  if (out.indexOf('## Best Practices') === -1) {
    out += '\\n## Best Practices\\n';
  }
  return out;
}

function appendToSection(filePath, header, sectionTitle, entry) {
  ensureFile(filePath, header);
  let content = readFileSync(filePath, 'utf-8');
  content = ensureSections(content, header);
  const marker = '## ' + sectionTitle;
  const idx = content.indexOf(marker);
  if (idx === -1) {
    content += '\\n' + marker + '\\n\\n' + entry + '\\n';
  } else {
    const insertPos = idx + marker.length;
    const before = content.slice(0, insertPos);
    const after = content.slice(insertPos);
    content = before + '\\n\\n' + entry + after;
  }
  writeFileSync(filePath, content, 'utf-8');
}

function guessSeverity(mistake) {
  const lower = (mistake || '').toLowerCase();
  if (lower.includes('security') || lower.includes('injection') || lower.includes('auth') ||
      lower.includes('credential') || lower.includes('password') || lower.includes('secret') ||
      lower.includes('data loss') || lower.includes('crash')) return 'high';
  if (lower.includes('performance') || lower.includes('error') || lower.includes('missing') ||
      lower.includes('broken') || lower.includes('fail')) return 'medium';
  return 'low';
}

function titleFromText(text) {
  const words = (text || 'Untitled').split(/\\s+/).slice(0, 5).join(' ');
  return words.length > 50 ? words.slice(0, 50) + '...' : words;
}

// ── Commands ────────────────────────────────────────────────────────────

function addMistake(args) {
  const { agent, domain, mistake, fix, lesson } = args;
  if (!agent || !domain || !mistake || !fix || !lesson) {
    console.error('ERROR: add-mistake requires --agent, --domain, --mistake, --fix, --lesson');
    process.exit(1);
  }

  const severity = args.severity || guessSeverity(mistake);
  const title = titleFromText(mistake);
  const entry = [
    '### [' + today() + '] ' + title,
    '- **MISTAKE**: ' + mistake,
    '- **FIX**: ' + fix,
    '- **LESSON**: ' + lesson,
    '- **Agent**: ' + agent,
    '- **Severity**: ' + severity,
  ].join('\\n');

  // 1. Local agent file
  const agentHeader = makeHeader(agent);
  appendToSection(localAgent(agent), agentHeader, 'Mistakes & Fixes', entry);

  // 2. Local domain file
  const domainHeader = makeHeader(domain);
  appendToSection(localDomain(domain), domainHeader, 'Mistakes & Fixes', entry);

  // 3. Global domain file
  appendToSection(globalDomain(domain), domainHeader, 'Mistakes & Fixes', entry);

  // 4. If --global, also write to global shared
  if (args.global) {
    const sharedHeader = makeHeader('shared');
    appendToSection(globalShared(), sharedHeader, 'Mistakes & Fixes', entry);
  }

  console.log('OK: Recorded mistake in agent(' + agent + '), domain(' + domain + ') [local+global]' +
    (args.global ? ', global-shared' : ''));
}

function addPractice(args) {
  const { agent, domain, practice } = args;
  const why = args.why || '';
  const apply = args.apply || '';
  if (!agent || !domain || !practice) {
    console.error('ERROR: add-practice requires --agent, --domain, --practice');
    process.exit(1);
  }

  const title = titleFromText(practice);
  const entry = [
    '### [' + today() + '] ' + title,
    '- **PRACTICE**: ' + practice,
    '- **WHY**: ' + why,
    '- **APPLY**: ' + apply,
    '- **Agent**: ' + agent,
  ].join('\\n');

  // 1. Local agent file
  const agentHeader = makeHeader(agent);
  appendToSection(localAgent(agent), agentHeader, 'Best Practices', entry);

  // 2. Local domain file
  const domainHeader = makeHeader(domain);
  appendToSection(localDomain(domain), domainHeader, 'Best Practices', entry);

  // 3. Global domain file
  appendToSection(globalDomain(domain), domainHeader, 'Best Practices', entry);

  // 4. If --global, also write to global shared
  if (args.global) {
    const sharedHeader = makeHeader('shared');
    appendToSection(globalShared(), sharedHeader, 'Best Practices', entry);
  }

  console.log('OK: Recorded practice in agent(' + agent + '), domain(' + domain + ') [local+global]' +
    (args.global ? ', global-shared' : ''));
}

function readLearnings(args) {
  const { agent, domain } = args;
  if (!agent || !domain) {
    console.error('ERROR: read requires --agent and --domain');
    process.exit(1);
  }

  const sections = [];

  // Local shared
  const ls = readSafe(localShared());
  if (ls.trim()) sections.push('=== LOCAL SHARED ===\\n' + ls);

  // Local domain
  const ld = readSafe(localDomain(domain));
  if (ld.trim()) sections.push('=== LOCAL DOMAIN (' + domain + ') ===\\n' + ld);

  // Local agent
  const la = readSafe(localAgent(agent));
  if (la.trim()) sections.push('=== LOCAL AGENT (' + agent + ') ===\\n' + la);

  // Global shared
  const gs = readSafe(globalShared());
  if (gs.trim()) sections.push('=== GLOBAL SHARED ===\\n' + gs);

  // Global domain
  const gd = readSafe(globalDomain(domain));
  if (gd.trim()) sections.push('=== GLOBAL DOMAIN (' + domain + ') ===\\n' + gd);

  if (sections.length === 0) {
    console.log('No learnings found for agent=' + agent + ', domain=' + domain);
  } else {
    console.log(sections.join('\\n\\n---\\n\\n'));
  }
}

function readAll() {
  const sections = [];

  function collectDir(base, label) {
    if (!existsSync(base)) return;

    // shared.md
    const sharedPath = join(base, 'shared.md');
    if (existsSync(sharedPath)) {
      sections.push('=== ' + label + ' SHARED ===\\n' + readFileSync(sharedPath, 'utf-8'));
    }

    // by-domain
    const domainDir = join(base, 'by-domain');
    if (existsSync(domainDir)) {
      for (const f of readdirSync(domainDir)) {
        if (f.endsWith('.md')) {
          sections.push('=== ' + label + ' DOMAIN (' + f.replace('.md','') + ') ===\\n' +
            readFileSync(join(domainDir, f), 'utf-8'));
        }
      }
    }

    // by-agent
    const agentDir = join(base, 'by-agent');
    if (existsSync(agentDir)) {
      for (const f of readdirSync(agentDir)) {
        if (f.endsWith('.md')) {
          sections.push('=== ' + label + ' AGENT (' + f.replace('.md','') + ') ===\\n' +
            readFileSync(join(agentDir, f), 'utf-8'));
        }
      }
    }
  }

  collectDir(LOCAL_BASE, 'LOCAL');
  collectDir(GLOBAL_BASE, 'GLOBAL');

  if (sections.length === 0) {
    console.log('No learnings found.');
  } else {
    console.log(sections.join('\\n\\n---\\n\\n'));
  }
}

function searchLearnings(args) {
  const query = (args.query || '').toLowerCase();
  if (!query) {
    console.error('ERROR: search requires --query');
    process.exit(1);
  }

  const results = [];

  function searchDir(base, label) {
    if (!existsSync(base)) return;

    function searchFile(filePath, fileLabel) {
      if (!existsSync(filePath)) return;
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes(query)) {
          // Find the section header (### [...] Title)
          let header = '';
          for (let j = i; j >= 0; j--) {
            if (lines[j].startsWith('### ')) { header = lines[j]; break; }
          }
          // Collect full entry from the header
          if (header) {
            const hIdx = lines.indexOf(header);
            let end = hIdx + 1;
            while (end < lines.length && !lines[end].startsWith('### ') && !lines[end].startsWith('## ')) {
              end++;
            }
            const block = lines.slice(hIdx, end).join('\\n').trim();
            const key = fileLabel + ':' + header;
            if (!results.find(r => r.key === key)) {
              results.push({ key, label: fileLabel, block });
            }
          }
        }
      }
    }

    const sharedPath = join(base, 'shared.md');
    searchFile(sharedPath, label + '/shared');

    const domainDir = join(base, 'by-domain');
    if (existsSync(domainDir)) {
      for (const f of readdirSync(domainDir)) {
        if (f.endsWith('.md')) searchFile(join(domainDir, f), label + '/domain/' + f.replace('.md',''));
      }
    }

    const agentDir = join(base, 'by-agent');
    if (existsSync(agentDir)) {
      for (const f of readdirSync(agentDir)) {
        if (f.endsWith('.md')) searchFile(join(agentDir, f), label + '/agent/' + f.replace('.md',''));
      }
    }
  }

  searchDir(LOCAL_BASE, 'local');
  searchDir(GLOBAL_BASE, 'global');

  if (results.length === 0) {
    console.log('No learnings matching "' + query + '"');
  } else {
    console.log('Found ' + results.length + ' result(s) for "' + query + '":\\n');
    for (const r of results) {
      console.log('[' + r.label + ']');
      console.log(r.block);
      console.log('');
    }
  }
}

// ── Main ────────────────────────────────────────────────────────────────

const [command, ...rest] = process.argv.slice(2);
const args = parseArgs(rest);

switch (command) {
  case 'add-mistake':  addMistake(args); break;
  case 'add-practice': addPractice(args); break;
  case 'read':         readLearnings(args); break;
  case 'read-all':     readAll(); break;
  case 'search':       searchLearnings(args); break;
  default:
    console.error('Usage: learnings-manager.mjs <add-mistake|add-practice|read|read-all|search> [options]');
    console.error('');
    console.error('Commands:');
    console.error('  add-mistake   --agent NAME --domain DOMAIN --mistake "..." --fix "..." --lesson "..." [--severity high|medium|low] [--global]');
    console.error('  add-practice  --agent NAME --domain DOMAIN --practice "..." --why "..." --apply "..." [--global]');
    console.error('  read          --agent NAME --domain DOMAIN');
    console.error('  read-all');
    console.error('  search        --query "search terms"');
    process.exit(1);
}
`;
}
