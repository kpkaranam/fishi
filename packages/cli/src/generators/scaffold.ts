import type { InitOptions, ProjectType, ScaffoldResult, BrownfieldAnalysisData, FileResolutionMap } from '@qlucent/fishi-core';
import { generateScaffold } from '@qlucent/fishi-core';

interface ScaffoldOptions extends InitOptions {
  projectName: string;
  projectType: ProjectType;
  brownfieldAnalysis?: BrownfieldAnalysisData;
  resolutions?: FileResolutionMap;
  docsReadmeExists?: boolean;
  rootClaudeMdExists?: boolean;
}

export async function scaffold(
  targetDir: string,
  options: ScaffoldOptions
): Promise<ScaffoldResult> {
  return generateScaffold(targetDir, options);
}
