import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { parse as parseYaml } from 'yaml';

export async function statusCommand(): Promise<void> {
  const targetDir = process.cwd();
  const fishiDir = path.join(targetDir, '.fishi');

  if (!fs.existsSync(fishiDir)) {
    console.log(chalk.yellow('\n  FISHI is not initialized in this directory.'));
    console.log(chalk.gray('  Run `fishi init` to get started.\n'));
    return;
  }

  console.log('');
  console.log(chalk.cyan.bold('  🐟 FISHI Status'));
  console.log('');

  // Read project state
  const projectPath = path.join(fishiDir, 'state', 'project.yaml');
  if (fs.existsSync(projectPath)) {
    const projectState = parseYaml(fs.readFileSync(projectPath, 'utf-8'));
    console.log(chalk.bold('  Project:'));
    console.log(chalk.gray(`  Name: ${projectState.project_name || 'unnamed'}`));
    console.log(chalk.gray(`  Type: ${projectState.project_type || 'unknown'}`));
    console.log(chalk.gray(`  Phase: ${projectState.current_phase || 'init'}`));
    console.log(chalk.gray(`  Sprint: ${projectState.current_sprint || 0}`));
    console.log('');
  }

  // Read TaskBoard summary
  const boardPath = path.join(fishiDir, 'taskboard', 'board.md');
  if (fs.existsSync(boardPath)) {
    const boardContent = fs.readFileSync(boardPath, 'utf-8');
    const counts = {
      backlog: (boardContent.match(/## 📋 Backlog[\s\S]*?(?=## |$)/)?.[0]?.match(/### TASK-/g) || []).length,
      ready: (boardContent.match(/## 🟡 Ready[\s\S]*?(?=## |$)/)?.[0]?.match(/### TASK-/g) || []).length,
      inProgress: (boardContent.match(/## 🔵 In Progress[\s\S]*?(?=## |$)/)?.[0]?.match(/### TASK-/g) || []).length,
      review: (boardContent.match(/## 🟠 Review[\s\S]*?(?=## |$)/)?.[0]?.match(/### TASK-/g) || []).length,
      done: (boardContent.match(/## ✅ Done[\s\S]*?(?=## |$)/)?.[0]?.match(/### TASK-/g) || []).length,
    };

    console.log(chalk.bold('  TaskBoard:'));
    console.log(chalk.gray(`  📋 Backlog: ${counts.backlog}`));
    console.log(chalk.yellow(`  🟡 Ready: ${counts.ready}`));
    console.log(chalk.blue(`  🔵 In Progress: ${counts.inProgress}`));
    console.log(chalk.hex('#FFA500')(`  🟠 Review: ${counts.review}`));
    console.log(chalk.green(`  ✅ Done: ${counts.done}`));
    console.log('');
  }

  // Read agent registry
  const registryPath = path.join(fishiDir, 'state', 'agent-registry.yaml');
  if (fs.existsSync(registryPath)) {
    const registry = parseYaml(fs.readFileSync(registryPath, 'utf-8'));
    const agents = registry?.agents || [];
    const active = agents.filter((a: { status: string }) => a.status === 'active' || a.status === 'working');
    const dynamic = agents.filter((a: { dynamic: boolean }) => a.dynamic === true);

    console.log(chalk.bold('  Agents:'));
    console.log(chalk.gray(`  Total: ${agents.length} (${dynamic.length} dynamic)`));
    console.log(chalk.gray(`  Active: ${active.length}`));

    for (const agent of active) {
      console.log(chalk.cyan(`    → ${agent.name}: ${agent.task || 'idle'}`));
    }
    console.log('');
  }

  // Read latest checkpoint
  const checkpointDir = path.join(fishiDir, 'state', 'checkpoints');
  if (fs.existsSync(checkpointDir)) {
    const checkpoints = fs
      .readdirSync(checkpointDir)
      .filter((f: string) => f.endsWith('.yaml'))
      .sort();
    if (checkpoints.length > 0) {
      const latest = checkpoints[checkpoints.length - 1];
      console.log(chalk.bold('  Checkpoints:'));
      console.log(chalk.gray(`  Latest: ${latest}`));
      console.log(chalk.gray(`  Total: ${checkpoints.length}`));
      console.log('');
    }
  }

  // Active worktrees
  const treesDir = path.join(targetDir, '.trees');
  if (fs.existsSync(treesDir)) {
    const trees = fs.readdirSync(treesDir).filter((f: string) => {
      return fs.statSync(path.join(treesDir, f)).isDirectory();
    });
    if (trees.length > 0) {
      console.log(chalk.bold('  Active Worktrees:'));
      for (const tree of trees) {
        console.log(chalk.gray(`    📂 .trees/${tree}/`));
      }
      console.log('');
    }
  }
}
