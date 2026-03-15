import type { InitOptions, ProjectType, ScaffoldResult, BrownfieldAnalysisData } from '@fishi/core';
import { generateScaffold } from '@fishi/core';

interface ScaffoldOptions extends InitOptions {
  projectName: string;
  projectType: ProjectType;
  brownfieldAnalysis?: BrownfieldAnalysisData;
}

export async function scaffold(
  targetDir: string,
  options: ScaffoldOptions
): Promise<ScaffoldResult> {
  return generateScaffold(targetDir, options);
}
