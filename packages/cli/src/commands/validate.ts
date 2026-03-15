import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

export async function validateCommand(): Promise<void> {
  const targetDir = process.cwd();
  const fishiDir = path.join(targetDir, '.fishi');

  if (!fs.existsSync(fishiDir)) {
    console.log(chalk.yellow('\n  FISHI is not initialized in this directory.'));
    console.log(chalk.gray('  Run `fishi init` to get started.\n'));
    process.exitCode = 1;
    return;
  }

  const scriptPath = path.join(fishiDir, 'scripts', 'validate-scaffold.mjs');

  if (!fs.existsSync(scriptPath)) {
    console.log(chalk.yellow('\n  Validation script not found.'));
    console.log(
      chalk.gray(
        '  Expected: .fishi/scripts/validate-scaffold.mjs\n' +
          '  Re-run `fishi init` to regenerate scaffold files.\n'
      )
    );
    process.exitCode = 1;
    return;
  }

  console.log('');
  console.log(chalk.cyan.bold('  FISHI Scaffold Validation'));
  console.log('');

  try {
    const result = execSync(`node "${scriptPath}"`, {
      cwd: targetDir,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, FISHI_PROJECT_ROOT: targetDir },
    });

    // Print output line by line with coloring
    for (const line of result.split('\n')) {
      if (!line.trim()) {
        console.log(line);
        continue;
      }
      if (line.includes('\u2713')) {
        console.log(chalk.green(line));
      } else if (line.includes('\u2717')) {
        console.log(chalk.red(line));
      } else if (line.includes('\u26A0')) {
        console.log(chalk.yellow(line));
      } else if (line.includes('\u2705')) {
        console.log(chalk.green.bold(line));
      } else {
        console.log(chalk.gray(line));
      }
    }

    console.log('');
  } catch (err: unknown) {
    const error = err as { stdout?: string; stderr?: string; status?: number };

    // Script exited with non-zero — print its output (issues found)
    if (error.stdout) {
      for (const line of error.stdout.split('\n')) {
        if (!line.trim()) {
          console.log(line);
          continue;
        }
        if (line.includes('\u2713')) {
          console.log(chalk.green(line));
        } else if (line.includes('\u2717')) {
          console.log(chalk.red(line));
        } else if (line.includes('\u26A0')) {
          console.log(chalk.yellow(line));
        } else {
          console.log(chalk.gray(line));
        }
      }
    }

    if (error.stderr) {
      console.error(chalk.red(error.stderr));
    }

    console.log('');
    process.exitCode = 1;
  }
}
