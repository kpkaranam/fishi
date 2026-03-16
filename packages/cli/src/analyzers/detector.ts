import fs from 'fs';
import path from 'path';
import type { DetectionResult, DetectionCheck, ProjectType } from '@qlucent/fishi-core';

export async function detectProjectType(targetDir: string): Promise<DetectionResult> {
  const checks: DetectionCheck[] = [];

  // Check 1: Source code files
  const srcDirs = ['src', 'app', 'lib', 'packages'];
  const hasSourceCode = srcDirs.some((dir) => {
    const dirPath = path.join(targetDir, dir);
    if (!fs.existsSync(dirPath)) return false;
    return hasCodeFiles(dirPath);
  });
  checks.push({
    check: 'Contains source code (src/, app/, lib/)',
    passed: hasSourceCode,
    evidence: hasSourceCode ? `Found code in ${srcDirs.filter((d) => fs.existsSync(path.join(targetDir, d))).join(', ')}` : undefined,
  });

  // Check 2: Package/dependency files
  const depFiles = [
    'package.json',
    'requirements.txt',
    'Pipfile',
    'go.mod',
    'Cargo.toml',
    'pom.xml',
    'build.gradle',
    'Gemfile',
    'composer.json',
  ];
  const foundDeps = depFiles.filter((f) => fs.existsSync(path.join(targetDir, f)));
  checks.push({
    check: 'Has dependency/package files',
    passed: foundDeps.length > 0,
    evidence: foundDeps.length > 0 ? foundDeps.join(', ') : undefined,
  });

  // Check 3: Git history
  const hasGitHistory = await checkGitHistory(targetDir);
  checks.push({
    check: 'Has git history with >5 commits',
    passed: hasGitHistory,
  });

  // Check 4: Tests
  const testDirs = ['tests', 'test', '__tests__', 'spec', 'e2e'];
  const hasTests = testDirs.some((dir) => {
    const dirPath = path.join(targetDir, dir);
    return fs.existsSync(dirPath) && hasCodeFiles(dirPath);
  });
  // Also check for test files in src
  const hasTestFiles = hasSourceCode && checkForTestFiles(targetDir);
  checks.push({
    check: 'Has test files',
    passed: hasTests || hasTestFiles,
    evidence: hasTests ? `Found test directory: ${testDirs.filter((d) => fs.existsSync(path.join(targetDir, d))).join(', ')}` : undefined,
  });

  // Check 5: Documentation
  const docIndicators = ['docs', 'documentation', 'README.md', 'CONTRIBUTING.md'];
  const hasDocs = docIndicators.some((f) => fs.existsSync(path.join(targetDir, f)));
  checks.push({
    check: 'Has documentation',
    passed: hasDocs,
    evidence: hasDocs ? docIndicators.filter((f) => fs.existsSync(path.join(targetDir, f))).join(', ') : undefined,
  });

  // Check 6: CI/CD
  const ciIndicators = [
    '.github/workflows',
    '.gitlab-ci.yml',
    'Jenkinsfile',
    '.circleci',
    'Dockerfile',
    'docker-compose.yml',
    '.travis.yml',
  ];
  const hasCiCd = ciIndicators.some((f) => fs.existsSync(path.join(targetDir, f)));
  checks.push({
    check: 'Has CI/CD configuration',
    passed: hasCiCd,
    evidence: hasCiCd ? ciIndicators.filter((f) => fs.existsSync(path.join(targetDir, f))).join(', ') : undefined,
  });

  // Classification
  const passedCount = checks.filter((c) => c.passed).length;
  let type: ProjectType;
  let confidence: number;

  if (passedCount <= 1) {
    type = 'greenfield';
    confidence = Math.round(((6 - passedCount) / 6) * 100);
  } else if (passedCount >= 4) {
    type = 'brownfield';
    confidence = Math.round((passedCount / 6) * 100);
  } else {
    // 2-3 checks: could be hybrid or early brownfield
    type = passedCount >= 3 ? 'brownfield' : 'hybrid';
    confidence = Math.round(((passedCount + 1) / 6) * 100);
  }

  return { type, checks, confidence };
}

function hasCodeFiles(dirPath: string): boolean {
  const codeExtensions = [
    '.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.java',
    '.rb', '.php', '.cs', '.cpp', '.c', '.swift', '.kt',
  ];

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (codeExtensions.includes(ext)) return true;
      }
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        if (hasCodeFiles(path.join(dirPath, entry.name))) return true;
      }
    }
  } catch {
    // Permission error or similar
  }
  return false;
}

function checkForTestFiles(targetDir: string): boolean {
  const testPatterns = ['.test.', '.spec.', '_test.', '_spec.'];
  try {
    const walkDir = (dir: string, depth: number): boolean => {
      if (depth > 3) return false;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile() && testPatterns.some((p) => entry.name.includes(p))) {
          return true;
        }
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          if (walkDir(path.join(dir, entry.name), depth + 1)) return true;
        }
      }
      return false;
    };
    return walkDir(targetDir, 0);
  } catch {
    return false;
  }
}

async function checkGitHistory(targetDir: string): Promise<boolean> {
  const { execSync } = await import('child_process');
  try {
    const result = execSync('git rev-list --count HEAD', {
      cwd: targetDir,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return parseInt(result.trim(), 10) > 5;
  } catch {
    return false;
  }
}
