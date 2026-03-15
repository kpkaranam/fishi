/**
 * TODO Manager Script
 *
 * Returns a .mjs script (zero dependencies, Node.js built-ins only)
 * that manages agent-level TODO lists stored at `.fishi/todos/{agent-name}.md`.
 */
export function getTodoManagerScript(): string {
  return `#!/usr/bin/env node
/**
 * FISHI TODO Manager
 * Manages per-agent TODO lists stored as markdown files.
 *
 * Usage:
 *   node .fishi/scripts/todo-manager.mjs add --agent <name> --task "<desc>" --priority <level> [--from <coordinator>]
 *   node .fishi/scripts/todo-manager.mjs list --agent <name>
 *   node .fishi/scripts/todo-manager.mjs done --agent <name> --index <N>
 *   node .fishi/scripts/todo-manager.mjs clear-done --agent <name>
 *   node .fishi/scripts/todo-manager.mjs list-all
 */

import { readFile, writeFile, mkdir, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, basename } from 'node:path';

const TODOS_DIR = '.fishi/todos';
const PRIORITY_ORDER = ['critical', 'high', 'medium', 'low'];

// ── Helpers ─────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = {};
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    } else {
      positional.push(argv[i]);
    }
  }
  return { command: positional[0], ...args };
}

function todoFilePath(agentName) {
  // Determine subdirectory based on agent role naming conventions
  const coordinators = ['planning-lead', 'dev-lead', 'quality-lead', 'ops-lead'];
  if (agentName === 'master-orchestrator') {
    return join(TODOS_DIR, agentName + '.md');
  } else if (coordinators.includes(agentName) || agentName.endsWith('-lead')) {
    return join(TODOS_DIR, 'coordinators', agentName + '.md');
  } else {
    return join(TODOS_DIR, 'agents', agentName + '.md');
  }
}

function emptyTodoContent(agentName) {
  return \`# TODO — \${agentName}\\n\\n## Active\\n\\n## Completed\\n\`;
}

async function ensureTodoFile(agentName) {
  const fp = todoFilePath(agentName);
  const dir = fp.substring(0, fp.lastIndexOf('/') === -1 ? fp.lastIndexOf('\\\\') : fp.lastIndexOf('/'));
  await mkdir(dir, { recursive: true });
  if (!existsSync(fp)) {
    await writeFile(fp, emptyTodoContent(agentName), 'utf-8');
  }
  return fp;
}

function parseTodoFile(content) {
  const active = [];
  const completed = [];
  let section = null;

  for (const line of content.split('\\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('## Active')) { section = 'active'; continue; }
    if (trimmed.startsWith('## Completed')) { section = 'completed'; continue; }
    if (trimmed.startsWith('# TODO')) continue;
    if (!trimmed) continue;

    const checkMatch = trimmed.match(/^- \\[([ x])\\] \\[([A-Z]+)\\] (.+)$/);
    if (checkMatch) {
      const done = checkMatch[1] === 'x';
      const priority = checkMatch[2].toLowerCase();
      let text = checkMatch[3];

      // Extract metadata
      let assignedBy = null;
      let completedDate = null;
      const fromMatch = text.match(/\\(assigned by: ([^)]+)\\)/);
      if (fromMatch) {
        assignedBy = fromMatch[1];
        text = text.replace(fromMatch[0], '').trim();
      }
      const doneMatch = text.match(/\\(completed: ([^)]+)\\)/);
      if (doneMatch) {
        completedDate = doneMatch[1];
        text = text.replace(doneMatch[0], '').trim();
      }

      const entry = { text, priority, done, assignedBy, completedDate };
      if (section === 'completed' || done) {
        completed.push(entry);
      } else {
        active.push(entry);
      }
    }
  }

  return { active, completed };
}

function renderEntry(entry) {
  const check = entry.done ? 'x' : ' ';
  const prio = entry.priority.toUpperCase();
  let line = \`- [\${check}] [\${prio}] \${entry.text}\`;
  if (entry.assignedBy) line += \` (assigned by: \${entry.assignedBy})\`;
  if (entry.completedDate) line += \` (completed: \${entry.completedDate})\`;
  return line;
}

function renderTodoFile(agentName, data) {
  let out = \`# TODO — \${agentName}\\n\\n## Active\\n\`;
  for (const e of data.active) {
    out += renderEntry(e) + '\\n';
  }
  out += '\\n## Completed\\n';
  for (const e of data.completed) {
    out += renderEntry(e) + '\\n';
  }
  return out;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// ── Commands ────────────────────────────────────────────────────────

async function cmdAdd(args) {
  const { agent, task, priority = 'medium', from } = args;
  if (!agent || !task) {
    return { ok: false, error: 'Missing --agent or --task' };
  }
  if (!PRIORITY_ORDER.includes(priority)) {
    return { ok: false, error: \`Invalid priority: \${priority}. Use: \${PRIORITY_ORDER.join(', ')}\` };
  }

  const fp = await ensureTodoFile(agent);
  const content = await readFile(fp, 'utf-8');
  const data = parseTodoFile(content);

  const entry = { text: task, priority, done: false, assignedBy: from || null, completedDate: null };
  data.active.push(entry);

  // Sort active by priority
  data.active.sort((a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority));

  await writeFile(fp, renderTodoFile(agent, data), 'utf-8');
  return { ok: true, agent, added: task, priority, from: from || null, activeCount: data.active.length };
}

async function cmdList(args) {
  const { agent } = args;
  if (!agent) return { ok: false, error: 'Missing --agent' };

  const fp = await ensureTodoFile(agent);
  const content = await readFile(fp, 'utf-8');
  const data = parseTodoFile(content);

  return {
    ok: true,
    agent,
    active: data.active.map((e, i) => ({ index: i + 1, priority: e.priority, task: e.text, assignedBy: e.assignedBy })),
    completed: data.completed.map(e => ({ priority: e.priority, task: e.text, completedDate: e.completedDate })),
    activeCount: data.active.length,
    completedCount: data.completed.length,
  };
}

async function cmdDone(args) {
  const { agent, index } = args;
  if (!agent || !index) return { ok: false, error: 'Missing --agent or --index' };

  const idx = parseInt(index, 10);
  const fp = await ensureTodoFile(agent);
  const content = await readFile(fp, 'utf-8');
  const data = parseTodoFile(content);

  if (idx < 1 || idx > data.active.length) {
    return { ok: false, error: \`Index \${idx} out of range. Active items: \${data.active.length}\` };
  }

  const item = data.active.splice(idx - 1, 1)[0];
  item.done = true;
  item.completedDate = todayStr();
  data.completed.push(item);

  await writeFile(fp, renderTodoFile(agent, data), 'utf-8');
  return { ok: true, agent, completed: item.text, completedDate: item.completedDate, remainingActive: data.active.length };
}

async function cmdClearDone(args) {
  const { agent } = args;
  if (!agent) return { ok: false, error: 'Missing --agent' };

  const fp = await ensureTodoFile(agent);
  const content = await readFile(fp, 'utf-8');
  const data = parseTodoFile(content);
  const cleared = data.completed.length;
  data.completed = [];

  await writeFile(fp, renderTodoFile(agent, data), 'utf-8');
  return { ok: true, agent, clearedCount: cleared, remainingActive: data.active.length };
}

async function collectTodoFiles(dir) {
  const results = [];
  if (!existsSync(dir)) return results;
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...await collectTodoFiles(fullPath));
    } else if (entry.name.endsWith('.md')) {
      results.push(fullPath);
    }
  }
  return results;
}

async function cmdListAll() {
  const files = await collectTodoFiles(TODOS_DIR);
  const agents = [];

  for (const fp of files) {
    const name = basename(fp, '.md');
    const content = await readFile(fp, 'utf-8');
    const data = parseTodoFile(content);
    agents.push({
      agent: name,
      file: fp,
      activeCount: data.active.length,
      completedCount: data.completed.length,
    });
  }

  return { ok: true, agents, totalAgents: agents.length };
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv.slice(2));

  let result;
  switch (args.command) {
    case 'add':
      result = await cmdAdd(args);
      break;
    case 'list':
      result = await cmdList(args);
      break;
    case 'done':
      result = await cmdDone(args);
      break;
    case 'clear-done':
      result = await cmdClearDone(args);
      break;
    case 'list-all':
      result = await cmdListAll();
      break;
    default:
      result = { ok: false, error: \`Unknown command: \${args.command}. Use: add, list, done, clear-done, list-all\` };
  }

  process.stdout.write(JSON.stringify(result, null, 2) + '\\n');
  process.exit(result.ok ? 0 : 1);
}

main().catch(err => {
  process.stdout.write(JSON.stringify({ ok: false, error: err.message }) + '\\n');
  process.exit(1);
});
`;
}
