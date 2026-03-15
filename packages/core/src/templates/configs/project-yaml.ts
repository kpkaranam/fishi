import type { ProjectType } from '../../types';

export interface ProjectYamlOptions {
  projectName: string;
  projectDescription: string;
  projectType: ProjectType;
}

export function getProjectYamlTemplate(options: ProjectYamlOptions): string {
  const now = new Date().toISOString();

  return `# FISHI Project State
# Auto-managed by FISHI hooks and agents — edit with care
project: "${options.projectName}"
description: "${options.projectDescription}"
type: ${options.projectType}

phase: init
sprint: 0
iteration: 0

created: "${now}"
updated: "${now}"

latest-checkpoint: ""

active-tasks: none
blocked-tasks: none

agents-active: 0
agents-total: 17
`;
}
