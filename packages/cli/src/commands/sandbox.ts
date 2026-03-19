import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { detectDocker, readSandboxConfig, readSandboxPolicy } from '@qlucent/fishi-core';

export async function sandboxCommand(
  action: string
): Promise<void> {
  const targetDir = process.cwd();

  if (!fs.existsSync(path.join(targetDir, '.fishi'))) {
    console.log(chalk.yellow('  No FISHI project found. Run `fishi init` first.'));
    return;
  }

  if (action === 'status') {
    const config = readSandboxConfig(targetDir);
    const dockerNow = detectDocker();

    console.log('');
    console.log(chalk.cyan.bold('  FISHI Sandbox Status'));
    console.log('');
    console.log(chalk.white('  Mode:             ') + (config.mode === 'docker' ? chalk.green('Docker') : chalk.yellow('Process')));
    console.log(chalk.white('  Docker available:  ') + (dockerNow ? chalk.green('yes') : chalk.red('no')));
    if (config.mode === 'docker' && !dockerNow) {
      console.log(chalk.red('  Warning: Docker mode configured but Docker not available!'));
    }
    console.log('');

    const policy = readSandboxPolicy(targetDir);
    console.log(chalk.white.bold('  Policy'));
    console.log(chalk.gray(`    Timeout:         ${policy.timeout}s`));
    console.log(chalk.gray(`    Memory limit:    ${policy.memory}`));
    console.log(chalk.gray(`    CPU limit:       ${policy.cpus}`));
    console.log(chalk.gray(`    Network allow:   ${policy.networkAllow.join(', ')}`));
    console.log(chalk.gray(`    Env passthrough: ${policy.envPassthrough.length > 0 ? policy.envPassthrough.join(', ') : '(none)'}`));
    console.log('');
  } else if (action === 'policy') {
    const policy = readSandboxPolicy(targetDir);
    console.log(JSON.stringify(policy, null, 2));
  } else {
    console.log(chalk.yellow(`  Unknown action: ${action}. Use: status, policy`));
  }
}
