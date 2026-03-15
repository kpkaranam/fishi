/**
 * Memory Manager Script
 *
 * CLI utility for managing persistent agent memory across sessions.
 * Each agent gets a personal memory file at `.fishi/memory/agents/{agent-name}.md`
 * with key-value entries stored as markdown H2 sections.
 *
 * Zero dependencies — uses only Node.js built-ins.
 */

export function getMemoryManagerScript(): string {
  return `#!/usr/bin/env node
// memory-manager.mjs — FISHI agent memory management
// Usage:
//   node .fishi/scripts/memory-manager.mjs write --agent backend-agent --key "auth-pattern" --value "Using JWT with refresh tokens"
//   node .fishi/scripts/memory-manager.mjs read --agent backend-agent
//   node .fishi/scripts/memory-manager.mjs get --agent backend-agent --key "auth-pattern"
//   node .fishi/scripts/memory-manager.mjs delete --agent backend-agent --key "auth-pattern"
//   node .fishi/scripts/memory-manager.mjs list-agents
//   node .fishi/scripts/memory-manager.mjs search --query "database"

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join, basename } from 'path';

const MEMORY_DIR = '.fishi/memory/agents';

// ── Argument parsing ─────────────────────────────────────────────────

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    } else if (!args._command) {
      args._command = argv[i];
    }
  }
  return args;
}

// ── Memory file parsing ──────────────────────────────────────────────

function getAgentFilePath(agentName) {
  return join(MEMORY_DIR, agentName + '.md');
}

function parseMemoryFile(content) {
  const entries = [];
  const lines = content.split('\\n');
  let currentEntry = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Match H2 heading = key
    const h2Match = line.match(/^## (.+)$/);
    if (h2Match) {
      if (currentEntry) {
        currentEntry.value = currentEntry.value.trim();
        entries.push(currentEntry);
      }
      currentEntry = {
        key: h2Match[1].trim(),
        written: null,
        updated: null,
        value: '',
      };
      continue;
    }

    if (!currentEntry) continue;

    // Match metadata line
    const metaMatch = line.match(/^> Written:\\s*(.+?)(?:\\s*\\|\\s*Updated:\\s*(.+))?$/);
    if (metaMatch) {
      currentEntry.written = metaMatch[1].trim();
      if (metaMatch[2]) {
        currentEntry.updated = metaMatch[2].trim();
      }
      continue;
    }

    // Accumulate value lines
    currentEntry.value += line + '\\n';
  }

  if (currentEntry) {
    currentEntry.value = currentEntry.value.trim();
    entries.push(currentEntry);
  }

  return entries;
}

function serializeMemoryFile(agentName, entries) {
  let content = '# Memory — ' + agentName + '\\n';

  for (const entry of entries) {
    content += '\\n## ' + entry.key + '\\n';
    let meta = '> Written: ' + entry.written;
    if (entry.updated) {
      meta += ' | Updated: ' + entry.updated;
    }
    content += meta + '\\n\\n';
    content += entry.value + '\\n';
  }

  return content;
}

function ensureDir(dirPath) {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

function readMemoryFile(agentName) {
  const filePath = getAgentFilePath(agentName);
  if (!existsSync(filePath)) {
    return [];
  }
  const content = readFileSync(filePath, 'utf-8');
  return parseMemoryFile(content);
}

function writeMemoryFile(agentName, entries) {
  ensureDir(MEMORY_DIR);
  const filePath = getAgentFilePath(agentName);
  const content = serializeMemoryFile(agentName, entries);
  writeFileSync(filePath, content, 'utf-8');
}

// ── Commands ─────────────────────────────────────────────────────────

function cmdWrite(args) {
  const { agent, key, value } = args;
  if (!agent || !key || !value) {
    return { success: false, error: 'write requires --agent, --key, and --value' };
  }

  const entries = readMemoryFile(agent);
  const now = new Date().toISOString();
  const existing = entries.find(e => e.key === key);

  if (existing) {
    existing.value = value;
    existing.updated = now;
  } else {
    entries.push({ key, written: now, updated: null, value });
  }

  writeMemoryFile(agent, entries);

  return {
    success: true,
    action: existing ? 'updated' : 'created',
    agent,
    key,
  };
}

function cmdRead(args) {
  const { agent } = args;
  if (!agent) {
    return { success: false, error: 'read requires --agent' };
  }

  const entries = readMemoryFile(agent);
  return {
    success: true,
    agent,
    entryCount: entries.length,
    entries: entries.map(e => ({
      key: e.key,
      written: e.written,
      updated: e.updated,
      value: e.value,
    })),
  };
}

function cmdGet(args) {
  const { agent, key } = args;
  if (!agent || !key) {
    return { success: false, error: 'get requires --agent and --key' };
  }

  const entries = readMemoryFile(agent);
  const entry = entries.find(e => e.key === key);

  if (!entry) {
    return { success: false, error: 'Key "' + key + '" not found for agent "' + agent + '"' };
  }

  return {
    success: true,
    agent,
    key: entry.key,
    written: entry.written,
    updated: entry.updated,
    value: entry.value,
  };
}

function cmdDelete(args) {
  const { agent, key } = args;
  if (!agent || !key) {
    return { success: false, error: 'delete requires --agent and --key' };
  }

  const entries = readMemoryFile(agent);
  const idx = entries.findIndex(e => e.key === key);

  if (idx === -1) {
    return { success: false, error: 'Key "' + key + '" not found for agent "' + agent + '"' };
  }

  entries.splice(idx, 1);
  writeMemoryFile(agent, entries);

  return { success: true, action: 'deleted', agent, key };
}

function cmdListAgents() {
  if (!existsSync(MEMORY_DIR)) {
    return { success: true, agents: [] };
  }

  const files = readdirSync(MEMORY_DIR).filter(f => f.endsWith('.md'));
  const agents = files.map(f => {
    const agentName = f.replace(/\\.md$/, '');
    const entries = readMemoryFile(agentName);
    return {
      name: agentName,
      entryCount: entries.length,
      keys: entries.map(e => e.key),
    };
  });

  return { success: true, agents };
}

function cmdSearch(args) {
  const { query } = args;
  if (!query) {
    return { success: false, error: 'search requires --query' };
  }

  if (!existsSync(MEMORY_DIR)) {
    return { success: true, query, results: [] };
  }

  const files = readdirSync(MEMORY_DIR).filter(f => f.endsWith('.md'));
  const queryLower = query.toLowerCase();
  const results = [];

  for (const file of files) {
    const agentName = file.replace(/\\.md$/, '');
    const entries = readMemoryFile(agentName);

    for (const entry of entries) {
      const keyMatch = entry.key.toLowerCase().includes(queryLower);
      const valueMatch = entry.value.toLowerCase().includes(queryLower);

      if (keyMatch || valueMatch) {
        results.push({
          agent: agentName,
          key: entry.key,
          written: entry.written,
          updated: entry.updated,
          value: entry.value,
          matchIn: keyMatch && valueMatch ? 'key+value' : keyMatch ? 'key' : 'value',
        });
      }
    }
  }

  return { success: true, query, resultCount: results.length, results };
}

// ── Main ─────────────────────────────────────────────────────────────

const args = parseArgs(process.argv);
const command = args._command;

let result;

switch (command) {
  case 'write':
    result = cmdWrite(args);
    break;
  case 'read':
    result = cmdRead(args);
    break;
  case 'get':
    result = cmdGet(args);
    break;
  case 'delete':
    result = cmdDelete(args);
    break;
  case 'list-agents':
    result = cmdListAgents();
    break;
  case 'search':
    result = cmdSearch(args);
    break;
  default:
    result = {
      success: false,
      error: 'Unknown command: ' + (command || '(none)'),
      usage: [
        'write   --agent <name> --key <key> --value <value>',
        'read    --agent <name>',
        'get     --agent <name> --key <key>',
        'delete  --agent <name> --key <key>',
        'list-agents',
        'search  --query <text>',
      ],
    };
}

process.stdout.write(JSON.stringify(result, null, 2) + '\\n');
process.exit(result.success ? 0 : 1);
`;
}
