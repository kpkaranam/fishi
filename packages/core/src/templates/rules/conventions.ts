export function getConventionsRules(projectType: string, analysis?: any): string {
  // This reuses the existing buildConventionsBlock logic
  // but as a standalone rule file
  let rules = '# Code Conventions\n\n';

  if (projectType === 'brownfield' && analysis) {
    if (analysis.packageManager) rules += `- Package manager: ${analysis.packageManager}\n`;
    if (analysis.linter) rules += `- Linter: ${analysis.linter}\n`;
    if (analysis.formatter) rules += `- Formatter: ${analysis.formatter}\n`;
    if (analysis.testFramework) rules += `- Test framework: ${analysis.testFramework}\n`;
    if (analysis.framework) rules += `- Framework: ${analysis.framework}\n`;
    if (analysis.orm) rules += `- ORM: ${analysis.orm}\n`;
    if (analysis.cssFramework) rules += `- CSS: ${analysis.cssFramework}\n`;
    rules += '\n';
  }

  rules += `General rules:
- TDD: write the test first, then the implementation
- Conventional commits: feat(scope): description, fix(scope): description
- Run the full test suite before marking any task complete
- Security: validate all user input, never hardcode secrets
`;

  return rules;
}
