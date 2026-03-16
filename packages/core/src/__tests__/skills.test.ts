import { describe, it, expect } from 'vitest';
import {
  getBrainstormingSkill,
  getBrownfieldAnalysisSkill,
  getTaskboardOpsSkill,
  getCodeGenSkill,
  getDebuggingSkill,
  getApiDesignSkill,
  getTestingSkill,
  getDeploymentSkill,
  getPrdSkill,
  getBrownfieldDiscoverySkill,
  getAdaptiveTaskGraphSkill,
  getDocumentationSkill,
} from '../index';

describe('Skill Templates', () => {
  const skills: [string, () => string][] = [
    ['brainstorming', getBrainstormingSkill],
    ['brownfield-analysis', getBrownfieldAnalysisSkill],
    ['taskboard-ops', getTaskboardOpsSkill],
    ['code-gen', getCodeGenSkill],
    ['debugging', getDebuggingSkill],
    ['api-design', getApiDesignSkill],
    ['testing', getTestingSkill],
    ['deployment', getDeploymentSkill],
    ['prd', getPrdSkill],
    ['brownfield-discovery', getBrownfieldDiscoverySkill],
    ['adaptive-taskgraph', getAdaptiveTaskGraphSkill],
    ['documentation', getDocumentationSkill],
  ];

  it('all 12 skills are accounted for', () => {
    expect(skills).toHaveLength(12);
  });

  it.each(skills)('%s returns a non-empty string', (_name, skillFn) => {
    const content = skillFn();
    expect(content).toBeTruthy();
    expect(typeof content).toBe('string');
    expect(content.length).toBeGreaterThan(50);
  });

  it.each(skills)('%s contains a heading or YAML frontmatter', (_name, skillFn) => {
    const content = skillFn();
    // Skills either start with `---` (YAML frontmatter) or `# Title`
    const hasFrontmatter = content.trimStart().startsWith('---');
    const hasHeading = content.includes('# ');
    expect(hasFrontmatter || hasHeading).toBe(true);
  });

  it.each(skills)('%s contains skill-related content', (_name, skillFn) => {
    const content = skillFn();
    // Every skill should have some kind of purpose/description section
    const hasStructure =
      content.includes('##') ||
      content.includes('description:') ||
      content.includes('Purpose') ||
      content.includes('Process');
    expect(hasStructure).toBe(true);
  });

  describe('Skills with YAML frontmatter', () => {
    const frontmatterSkills: [string, () => string][] = [
      ['prd', getPrdSkill],
      ['documentation', getDocumentationSkill],
    ];

    it.each(frontmatterSkills)('%s has name: and description: in frontmatter', (_name, skillFn) => {
      const content = skillFn();
      expect(content.trimStart()).toMatch(/^---/);
      expect(content).toContain('name:');
      expect(content).toContain('description:');
    });
  });

  describe('Skills without YAML frontmatter', () => {
    const headingSkills: [string, () => string][] = [
      ['brainstorming', getBrainstormingSkill],
      ['brownfield-analysis', getBrownfieldAnalysisSkill],
      ['taskboard-ops', getTaskboardOpsSkill],
      ['code-gen', getCodeGenSkill],
      ['debugging', getDebuggingSkill],
      ['api-design', getApiDesignSkill],
      ['testing', getTestingSkill],
      ['deployment', getDeploymentSkill],
      ['brownfield-discovery', getBrownfieldDiscoverySkill],
      ['adaptive-taskgraph', getAdaptiveTaskGraphSkill],
    ];

    it.each(headingSkills)('%s starts with a markdown heading', (_name, skillFn) => {
      const content = skillFn();
      expect(content.trimStart()).toMatch(/^#\s/);
    });
  });
});
