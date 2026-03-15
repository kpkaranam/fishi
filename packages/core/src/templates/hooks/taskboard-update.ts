/**
 * Taskboard Update Hook Template
 *
 * Generates an .mjs hook that fires after task state changes. It reads the
 * taskboard, counts tasks per column, finds the current sprint file, and
 * updates the sprint burndown with new counts.
 */
export function getTaskboardUpdateHook(): string {
  return `#!/usr/bin/env node
// taskboard-update.mjs — FISHI taskboard update hook
// Zero dependencies: uses only Node.js built-ins
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

const projectRoot = process.env.FISHI_PROJECT_ROOT || process.cwd();
const boardPath = join(projectRoot, '.fishi', 'taskboard', 'board.md');
const sprintsDir = join(projectRoot, '.fishi', 'taskboard', 'sprints');

/**
 * Count tasks per column in a markdown taskboard.
 * Columns are ## headings, tasks are lines starting with "- ".
 * Also extracts points if present (e.g., "(3pts)" or "[2]").
 */
function countTasksByColumn(content) {
  const counts = { backlog: 0, ready: 0, inProgress: 0, review: 0, done: 0 };
  const points = { backlog: 0, ready: 0, inProgress: 0, review: 0, done: 0 };
  const columnMap = {
    'backlog': 'backlog',
    'ready': 'ready',
    'to do': 'ready',
    'in progress': 'inProgress',
    'in-progress': 'inProgress',
    'review': 'review',
    'in review': 'review',
    'done': 'done',
    'complete': 'done',
    'completed': 'done',
  };

  let currentColumn = null;
  for (const line of content.split('\\n')) {
    const heading = line.match(/^##\\s+(.+)/);
    if (heading) {
      currentColumn = columnMap[heading[1].trim().toLowerCase()] || null;
      continue;
    }
    if (currentColumn && /^\\s*-\\s+/.test(line)) {
      counts[currentColumn]++;
      // Extract points if present
      const ptsMatch = line.match(/\\((\\d+)\\s*pts?\\)/i) || line.match(/\\[(\\d+)\\]\\s*$/);
      if (ptsMatch) {
        points[currentColumn] += parseInt(ptsMatch[1], 10);
      }
    }
  }
  return { counts, points };
}

/**
 * Find the current (most recent) sprint file in the sprints directory.
 */
function findCurrentSprintFile(dir) {
  if (!existsSync(dir)) return null;
  try {
    const files = readdirSync(dir)
      .filter(f => f.endsWith('.md') || f.endsWith('.yaml'))
      .sort()
      .reverse();
    return files.length > 0 ? join(dir, files[0]) : null;
  } catch {
    return null;
  }
}

try {
  if (!existsSync(boardPath)) {
    console.log('[FISHI] No taskboard found. Skipping update.');
    process.exit(0);
  }

  const boardContent = readFileSync(boardPath, 'utf-8');
  const { counts, points } = countTasksByColumn(boardContent);

  const totalTasks = Object.values(counts).reduce((a, b) => a + b, 0);
  const totalPoints = Object.values(points).reduce((a, b) => a + b, 0);
  const completedPoints = points.done;
  const remainingPoints = totalPoints - completedPoints;

  // ── Find and update current sprint file ────────────────────────────
  const sprintFile = findCurrentSprintFile(sprintsDir);
  if (!sprintFile) {
    console.log('[FISHI] No sprint file found. Skipping burndown update.');
    console.log(\`[FISHI] TaskBoard: \${counts.backlog} backlog, \${counts.ready} ready, \${counts.inProgress} in progress, \${counts.review} in review, \${counts.done} done (total: \${totalTasks})\`);
    if (totalPoints > 0) {
      console.log(\`[FISHI] Points: \${totalPoints} total, \${completedPoints} done, \${remainingPoints} remaining\`);
    }
    process.exit(0);
  }

  let sprintContent = readFileSync(sprintFile, 'utf-8');
  const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // Build burndown entry row
  const burndownEntry = \`| \${now} | \${counts.backlog} | \${counts.ready} | \${counts.inProgress} | \${counts.review} | \${counts.done} | \${remainingPoints} | \${completedPoints} |\`;

  if (sprintContent.includes('## Burndown')) {
    // Find the last table row and append after it
    const lines = sprintContent.split('\\n');
    let insertIdx = -1;
    let inBurndown = false;

    for (let i = 0; i < lines.length; i++) {
      if (/^##\\s+Burndown/i.test(lines[i])) {
        inBurndown = true;
        continue;
      }
      if (inBurndown && /^##\\s+/.test(lines[i])) {
        // Hit next section — insert before it
        if (insertIdx === -1) insertIdx = i;
        break;
      }
      if (inBurndown && lines[i].startsWith('|')) {
        insertIdx = i + 1;
      }
    }

    if (insertIdx > 0) {
      // Check if today's entry already exists, replace it
      if (insertIdx > 0 && lines[insertIdx - 1].includes(\`| \${now} |\`)) {
        lines[insertIdx - 1] = burndownEntry;
      } else {
        lines.splice(insertIdx, 0, burndownEntry);
      }
      sprintContent = lines.join('\\n');
    }
  } else {
    // Create burndown section
    sprintContent += \`
## Burndown

| Date | Backlog | Ready | In Progress | Review | Done | Remaining Pts | Completed Pts |
|------|---------|-------|-------------|--------|------|---------------|---------------|
\${burndownEntry}
\`;
  }

  // Update summary fields if they exist in the sprint file
  const fieldUpdates = [
    ['total-tasks:', \`total-tasks: \${totalTasks}\`],
    ['total-points:', \`total-points: \${totalPoints}\`],
    ['completed-points:', \`completed-points: \${completedPoints}\`],
    ['remaining-points:', \`remaining-points: \${remainingPoints}\`],
    ['completed-tasks:', \`completed-tasks: \${counts.done}\`],
    ['in-progress-tasks:', \`in-progress-tasks: \${counts.inProgress}\`],
  ];

  for (const [field, replacement] of fieldUpdates) {
    if (sprintContent.includes(field)) {
      // Field names only contain [a-z-:] so no regex escaping needed
      sprintContent = sprintContent.replace(
        new RegExp(field + '.*$', 'm'),
        replacement
      );
    }
  }

  writeFileSync(sprintFile, sprintContent, 'utf-8');

  // ── Output updated counts ──────────────────────────────────────────
  console.log(\`[FISHI] TaskBoard: \${counts.backlog} backlog, \${counts.ready} ready, \${counts.inProgress} in progress, \${counts.review} in review, \${counts.done} done (total: \${totalTasks})\`);
  if (totalPoints > 0) {
    console.log(\`[FISHI] Sprint burndown updated — \${remainingPoints} pts remaining, \${completedPoints} pts done\`);
  } else {
    console.log('[FISHI] Sprint burndown updated.');
  }
} catch (err) {
  console.error(\`[FISHI] Taskboard update hook error: \${err.message}\`);
  process.exit(0); // Non-fatal
}
`;
}
