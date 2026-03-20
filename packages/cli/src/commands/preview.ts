import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { detectDevServer, startDevServer } from '@qlucent/fishi-core';

export async function previewCommand(options: { devCmd?: string; port?: string }): Promise<void> {
  const targetDir = process.cwd();

  if (!fs.existsSync(path.join(targetDir, '.fishi'))) {
    console.log(chalk.yellow('  No FISHI project found. Run `fishi init` or `fishi quickstart` first.'));
    return;
  }

  const serverConfig = detectDevServer(targetDir, options.devCmd);

  if (!serverConfig.detected) {
    console.log(chalk.yellow('  Could not detect dev server.'));
    console.log(chalk.gray('  Use --dev-cmd to specify: fishi preview --dev-cmd "npm run dev"'));
    return;
  }

  const port = options.port ? parseInt(options.port, 10) : serverConfig.port;

  console.log('');
  console.log(chalk.cyan.bold('  FISHI Live Preview'));
  console.log(chalk.gray(`  Framework: ${serverConfig.framework}`));
  console.log(chalk.green.bold(`  URL: http://localhost:${port}`));
  console.log(chalk.gray('  Press Ctrl+C to stop'));
  console.log('');

  const child = startDevServer(targetDir, { ...serverConfig, port });
  child.stdout?.on('data', (d) => process.stdout.write(d));
  child.stderr?.on('data', (d) => process.stderr.write(d));
  child.on('close', (code) => {
    console.log(chalk.gray(`\n  Dev server stopped (exit ${code})`));
  });

  process.on('SIGINT', () => {
    child.kill();
    console.log(chalk.gray('\n  Dev server stopped.'));
    process.exit(0);
  });
}
