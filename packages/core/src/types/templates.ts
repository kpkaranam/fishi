export interface TemplateContext {
  projectName: string;
  projectDescription: string;
  projectType: string;
  language?: string;
  framework?: string;
  costMode: string;
  timestamp: string;
}

export interface AgentTemplate {
  filename: string;
  content: string;
  directory: 'agents' | 'agents/coordinators';
}

export interface SkillTemplate {
  directory: string;
  files: Record<string, string>;
}

export interface HookTemplate {
  filename: string;
  content: string;
}

export interface CommandTemplate {
  filename: string;
  content: string;
}
