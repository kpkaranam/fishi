import { describe, it, expect } from 'vitest';
import {
  getInitCommand,
  getStatusCommand,
  getResumeCommand,
  getGateCommand,
  getBoardCommand,
  getSprintCommand,
  getResetCommand,
  getPrdCommand,
} from '../index';

describe('Command Templates', () => {
  const commands: [string, () => string][] = [
    ['fishi-init', getInitCommand],
    ['fishi-status', getStatusCommand],
    ['fishi-resume', getResumeCommand],
    ['fishi-gate', getGateCommand],
    ['fishi-board', getBoardCommand],
    ['fishi-sprint', getSprintCommand],
    ['fishi-reset', getResetCommand],
    ['fishi-prd', getPrdCommand],
  ];

  it('all 8 commands are accounted for', () => {
    expect(commands).toHaveLength(8);
  });

  it.each(commands)('%s returns a non-empty string', (_name, commandFn) => {
    const content = commandFn();
    expect(content).toBeTruthy();
    expect(typeof content).toBe('string');
    expect(content.length).toBeGreaterThan(50);
  });

  it.each(commands)('%s contains the /fishi- command heading', (name, commandFn) => {
    const content = commandFn();
    expect(content).toContain(`# /${name}`);
  });

  it.each(commands)('%s contains a description or usage section', (_name, commandFn) => {
    const content = commandFn();
    const hasDescription = content.includes('Description') || content.includes('## ');
    expect(hasDescription).toBe(true);
  });

  it.each(commands)('%s takes no arguments (static template)', (_name, commandFn) => {
    expect(commandFn.length).toBe(0);
  });
});
