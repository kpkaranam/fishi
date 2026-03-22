import http from 'http';
import fs from 'fs';
import path from 'path';
import { parse as parseYaml } from 'yaml';
import chalk from 'chalk';
import { readMonitorState, getAgentSummary, getDashboardHtml } from '@qlucent/fishi-core';

const DEFAULT_PORT = 4269;

export async function dashboardCommand(options: { port?: string }): Promise<void> {
  const projectDir = process.cwd();
  const fishiDir = path.join(projectDir, '.fishi');

  if (!fs.existsSync(fishiDir)) {
    console.log(chalk.yellow('\n  FISHI is not initialized in this directory.'));
    console.log(chalk.gray('  Run `fishi init` to get started.\n'));
    return;
  }

  const port = Number(options.port || DEFAULT_PORT);
  if (isNaN(port) || port < 1 || port > 65535) {
    console.error(chalk.red(`  Invalid port: ${options.port}`));
    process.exit(1);
  }

  const html = getDashboardHtml();

  const server = http.createServer((req, res) => {
    const url = req.url?.split('?')[0] ?? '/';

    if (url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
      return;
    }

    if (url === '/api/state') {
      try {
        const monitorState = readMonitorState(projectDir);
        const agentSummary = getAgentSummary(projectDir);

        // Phase from project.yaml
        let phase = 'init';
        const projectYamlPath = path.join(fishiDir, 'state', 'project.yaml');
        if (fs.existsSync(projectYamlPath)) {
          try {
            const projectState = parseYaml(fs.readFileSync(projectYamlPath, 'utf-8'));
            phase = projectState?.phase || projectState?.current_phase || 'init';
          } catch {
            // ignore
          }
        }

        // Gates from gates.yaml
        let gates: Array<{ name: string; status: string }> = [];
        const gatesYamlPath = path.join(fishiDir, 'state', 'gates.yaml');
        if (fs.existsSync(gatesYamlPath)) {
          try {
            const gatesData = parseYaml(fs.readFileSync(gatesYamlPath, 'utf-8'));
            gates = gatesData?.gates || [];
          } catch {
            // ignore
          }
        }

        const payload = {
          summary: monitorState.summary,
          events: monitorState.events,
          dynamicAgents: monitorState.dynamicAgents,
          lastUpdated: monitorState.lastUpdated,
          agentSummary,
          phase,
          gates,
        };

        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        });
        res.end(JSON.stringify(payload));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: String(err) }));
      }
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.log('');
      console.log(chalk.cyan.bold('  FISHI Agent Dashboard'));
      console.log('');
      console.log(chalk.green(`  Dashboard is already running on port ${port}`));
      console.log(`  ${chalk.bold('URL:')}  ${chalk.cyan(`http://localhost:${port}`)}`);
      console.log('');
      process.exit(0);
    }
    throw err;
  });

  server.listen(port, () => {
    console.log('');
    console.log(chalk.cyan.bold('  FISHI Agent Dashboard'));
    console.log('');
    console.log(`  ${chalk.bold('URL:')}  ${chalk.cyan(`http://localhost:${port}`)}`);
    console.log(`  ${chalk.bold('API:')}  ${chalk.gray(`http://localhost:${port}/api/state`)}`);
    console.log('');
    console.log(chalk.gray('  Press Ctrl+C to stop.\n'));
  });

  process.on('SIGINT', () => {
    server.close(() => {
      console.log(chalk.gray('\n  Dashboard stopped.\n'));
      process.exit(0);
    });
  });

  // Keep process alive
  await new Promise<void>((resolve) => {
    server.on('close', resolve);
  });
}
