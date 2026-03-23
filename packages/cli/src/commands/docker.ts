import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { detectDocker } from '@qlucent/fishi-core';

export async function dockerCommand(
  action: string,
  options: { dockerfile?: string }
): Promise<void> {
  const targetDir = process.cwd();

  if (!fs.existsSync(path.join(targetDir, '.fishi'))) {
    console.log(chalk.yellow('  No FISHI project found. Run `fishi init` first.'));
    return;
  }

  if (!detectDocker()) {
    console.log(chalk.red('  Docker is not installed or not running.'));
    console.log(chalk.gray('  Install Docker: https://docs.docker.com/get-docker/'));
    return;
  }

  const dockerfilePath = options.dockerfile || path.join(targetDir, '.fishi', 'docker', 'Dockerfile');

  if (action === 'build') {
    console.log('');
    console.log(chalk.cyan.bold('  FISHI Docker Build'));
    console.log('');

    // Build the Docker image
    if (!fs.existsSync(dockerfilePath)) {
      console.log(chalk.yellow('  No Dockerfile found. Creating default...'));
      const { getDockerfileTemplate } = await import('@qlucent/fishi-core');
      const dir = path.dirname(dockerfilePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(dockerfilePath, getDockerfileTemplate(), 'utf-8');
    }

    console.log(chalk.gray('  Building fishi-sandbox image...'));
    try {
      execSync(`docker build -t fishi-sandbox -f "${dockerfilePath}" .`, {
        cwd: targetDir,
        stdio: 'inherit',
        timeout: 300000,
      });
      console.log('');
      console.log(chalk.green('  Docker image built: fishi-sandbox'));
    } catch {
      console.log(chalk.red('  Docker build failed.'));
      process.exit(1);
    }

  } else if (action === 'test') {
    console.log('');
    console.log(chalk.cyan.bold('  FISHI Docker Test'));
    console.log(chalk.gray('  Running tests inside Docker container...'));
    console.log('');

    // Detect test command from package.json
    let testCmd = 'npm test';
    const pkgPath = path.join(targetDir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        if (pkg.scripts?.test) testCmd = 'npm test';
        else if (pkg.scripts?.['test:unit']) testCmd = 'npm run test:unit';
      } catch {}
    }

    try {
      execSync(`docker run --rm -v "${targetDir}:/workspace" -w /workspace fishi-sandbox ${testCmd}`, {
        cwd: targetDir,
        stdio: 'inherit',
        timeout: 600000,
      });
      console.log('');
      console.log(chalk.green('  Tests passed inside Docker.'));
    } catch (e: any) {
      console.log('');
      console.log(chalk.red(`  Tests failed (exit ${e.status || 'unknown'}).`));
      process.exit(1);
    }

  } else if (action === 'run') {
    console.log('');
    console.log(chalk.cyan.bold('  FISHI Docker Run'));
    console.log('');

    // Run a command inside Docker
    const cmd = process.argv.slice(4).join(' ') || 'node --version';
    console.log(chalk.gray(`  Running: ${cmd}`));
    try {
      execSync(`docker run --rm -v "${targetDir}:/workspace" -w /workspace fishi-sandbox ${cmd}`, {
        cwd: targetDir,
        stdio: 'inherit',
        timeout: 600000,
      });
    } catch (e: any) {
      process.exit(e.status || 1);
    }

  } else if (action === 'status') {
    console.log('');
    console.log(chalk.cyan.bold('  FISHI Docker Status'));
    console.log('');

    const dockerInstalled = detectDocker();
    console.log(chalk.white('  Docker:      ') + (dockerInstalled ? chalk.green('running') : chalk.red('not running')));

    // Check if fishi-sandbox image exists
    try {
      const images = execSync('docker images fishi-sandbox --format "{{.Repository}}:{{.Tag}} ({{.Size}})"', {
        encoding: 'utf-8',
        timeout: 5000,
      }).trim();
      if (images) {
        console.log(chalk.white('  Image:       ') + chalk.green(images));
      } else {
        console.log(chalk.white('  Image:       ') + chalk.yellow('not built (run: fishi docker build)'));
      }
    } catch {
      console.log(chalk.white('  Image:       ') + chalk.yellow('not built'));
    }

    console.log(chalk.white('  Dockerfile:  ') + (fs.existsSync(dockerfilePath) ? chalk.green(path.relative(targetDir, dockerfilePath)) : chalk.yellow('not found')));
    console.log('');

  } else {
    console.log(chalk.yellow(`  Unknown action: ${action}. Use: build, test, run, status`));
  }
}
