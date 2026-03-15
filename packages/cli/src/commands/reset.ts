import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { parse as parseYaml } from 'yaml';

export async function resetCommand(checkpoint?: string): Promise<void> {
  const targetDir = process.cwd();
  const checkpointDir = path.join(targetDir, '.fishi', 'state', 'checkpoints');

  if (!fs.existsSync(checkpointDir)) {
    console.log(chalk.yellow('\n  No checkpoints found. Is FISHI initialized?\n'));
    return;
  }

  const checkpoints = fs
    .readdirSync(checkpointDir)
    .filter((f: string) => f.endsWith('.yaml'))
    .sort();

  if (checkpoints.length === 0) {
    console.log(chalk.yellow('\n  No checkpoints available.\n'));
    return;
  }

  // Find target checkpoint
  let targetFile: string;
  if (checkpoint) {
    const match = checkpoints.find(
      (f) => f.includes(checkpoint) || f === `${checkpoint}.yaml`
    );
    if (!match) {
      console.log(chalk.red(`\n  Checkpoint "${checkpoint}" not found.`));
      console.log(chalk.gray('  Available:'));
      for (const cp of checkpoints) {
        console.log(chalk.gray(`    ${cp}`));
      }
      console.log('');
      return;
    }
    targetFile = match;
  } else {
    targetFile = checkpoints[checkpoints.length - 1];
  }

  const targetPath = path.join(checkpointDir, targetFile);
  const checkpointData = parseYaml(fs.readFileSync(targetPath, 'utf-8'));

  console.log(chalk.bold('\n  Resetting to checkpoint:'));
  console.log(chalk.gray(`  File: ${targetFile}`));
  console.log(chalk.gray(`  Phase: ${checkpointData.phase || 'unknown'}`));
  console.log(chalk.gray(`  Sprint: ${checkpointData.sprint || 0}`));
  console.log(chalk.gray(`  Timestamp: ${checkpointData.timestamp || 'unknown'}`));
  console.log('');

  // Copy checkpoint to project.yaml
  const projectPath = path.join(targetDir, '.fishi', 'state', 'project.yaml');
  fs.copyFileSync(targetPath, projectPath);

  console.log(chalk.green('  ✓ State restored from checkpoint.'));
  console.log(chalk.gray('  Run `claude` and the session will resume from this point.\n'));
}
