export function getGitignoreAdditions(): string {
  return `
# FISHI framework
.trees/
.fishi/logs/
.env
.env.local
`;
}
