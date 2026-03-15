import chalk from 'chalk';

export const log = {
  info: (msg: string) => console.log(chalk.cyan(`  ℹ ${msg}`)),
  success: (msg: string) => console.log(chalk.green(`  ✓ ${msg}`)),
  warn: (msg: string) => console.log(chalk.yellow(`  ⚠ ${msg}`)),
  error: (msg: string) => console.error(chalk.red(`  ✗ ${msg}`)),
  debug: (msg: string) => {
    if (process.env.FISHI_DEBUG) {
      console.log(chalk.gray(`  [debug] ${msg}`));
    }
  },
};
