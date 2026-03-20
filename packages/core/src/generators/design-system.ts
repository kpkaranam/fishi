import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';

export interface DesignTokens {
  colors: Record<string, string>;
  typography: {
    fontFamilies: string[];
    scale: Record<string, string>;
  };
  spacing: Record<string, string>;
  borderRadius: Record<string, string>;
  shadows: Record<string, string>;
  darkMode: boolean;
}

export interface ComponentEntry {
  name: string;
  path: string;
  type: 'ui' | 'layout' | 'form' | 'data' | 'navigation' | 'other';
}

export interface ComponentRegistry {
  components: ComponentEntry[];
  library: string | null; // shadcn, radix, mui, antd, etc.
  framework: string | null;
}

export interface BrandGuardianIssue {
  file: string;
  line: number;
  severity: 'error' | 'warning' | 'info';
  rule: string;
  message: string;
  fix?: string;
}

export interface BrandGuardianReport {
  issues: BrandGuardianIssue[];
  passed: boolean;
  stats: {
    errors: number;
    warnings: number;
    infos: number;
    filesScanned: number;
  };
}

/**
 * Detect design tokens from a project's config files.
 * Checks: tailwind.config, CSS custom properties, theme files.
 */
export function detectDesignTokens(projectDir: string): DesignTokens {
  const tokens: DesignTokens = {
    colors: {},
    typography: { fontFamilies: [], scale: {} },
    spacing: {},
    borderRadius: {},
    shadows: {},
    darkMode: false,
  };

  // Check tailwind.config.js/ts/mjs
  const tailwindFiles = ['tailwind.config.js', 'tailwind.config.ts', 'tailwind.config.mjs', 'tailwind.config.cjs'];
  for (const file of tailwindFiles) {
    const p = join(projectDir, file);
    if (existsSync(p)) {
      const content = readFileSync(p, 'utf-8');
      // Extract colors
      const colorMatches = content.matchAll(/['"]?([\w-]+)['"]?\s*:\s*['"]?(#[0-9a-fA-F]{3,8})['"]?/g);
      for (const m of colorMatches) {
        tokens.colors[m[1]] = m[2];
      }
      // Check dark mode
      if (content.includes('darkMode')) tokens.darkMode = true;
      break;
    }
  }

  // Check CSS files for custom properties
  const cssFiles = findFiles(projectDir, ['src', 'styles', 'app'], ['.css']);
  for (const file of cssFiles.slice(0, 10)) {
    try {
      const content = readFileSync(file, 'utf-8');
      const varMatches = content.matchAll(/--(\w[\w-]*)\s*:\s*([^;]+)/g);
      for (const m of varMatches) {
        const name = m[1];
        const value = m[2].trim();
        if (name.includes('color') || name.includes('bg') || value.startsWith('#') || value.startsWith('rgb') || value.startsWith('hsl')) {
          tokens.colors[name] = value;
        } else if (name.includes('font')) {
          if (name.includes('size')) tokens.typography.scale[name] = value;
          else if (name.includes('family')) tokens.typography.fontFamilies.push(value);
        } else if (name.includes('spacing') || name.includes('gap') || name.includes('padding') || name.includes('margin')) {
          tokens.spacing[name] = value;
        } else if (name.includes('radius')) {
          tokens.borderRadius[name] = value;
        } else if (name.includes('shadow')) {
          tokens.shadows[name] = value;
        }
      }
      // Check for dark mode
      if (content.includes('prefers-color-scheme: dark') || content.includes('.dark')) {
        tokens.darkMode = true;
      }
    } catch {}
  }

  // Check for theme file
  const themeFiles = ['theme.ts', 'theme.js', 'theme.json', 'src/theme.ts', 'src/theme.js', 'src/styles/theme.ts'];
  for (const file of themeFiles) {
    if (existsSync(join(projectDir, file))) {
      try {
        const content = readFileSync(join(projectDir, file), 'utf-8');
        const colorMatches = content.matchAll(/['"]?([\w-]+)['"]?\s*:\s*['"]?(#[0-9a-fA-F]{3,8})['"]?/g);
        for (const m of colorMatches) {
          tokens.colors[m[1]] = m[2];
        }
      } catch {}
      break;
    }
  }

  return tokens;
}

/**
 * Generate default design tokens for a new project.
 */
export function generateDefaultTokens(): DesignTokens {
  return {
    colors: {
      'brand-50': '#f0f7ff',
      'brand-100': '#e0efff',
      'brand-200': '#b8d9ff',
      'brand-500': '#0066cc',
      'brand-600': '#0052a3',
      'brand-700': '#003d7a',
      'brand-900': '#001f3f',
      'gray-50': '#f9fafb',
      'gray-100': '#f3f4f6',
      'gray-200': '#e5e7eb',
      'gray-500': '#6b7280',
      'gray-700': '#374151',
      'gray-900': '#111827',
      'success': '#22c55e',
      'warning': '#f59e0b',
      'error': '#ef4444',
    },
    typography: {
      fontFamilies: ['-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'],
      scale: {
        'xs': '0.75rem',
        'sm': '0.875rem',
        'base': '1rem',
        'lg': '1.125rem',
        'xl': '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
      },
    },
    spacing: {
      'xs': '0.25rem',
      'sm': '0.5rem',
      'md': '1rem',
      'lg': '1.5rem',
      'xl': '2rem',
      '2xl': '3rem',
      '3xl': '4rem',
    },
    borderRadius: {
      'sm': '0.25rem',
      'md': '0.375rem',
      'lg': '0.5rem',
      'xl': '0.75rem',
      'full': '9999px',
    },
    shadows: {
      'sm': '0 1px 2px rgba(0,0,0,0.05)',
      'md': '0 4px 6px rgba(0,0,0,0.1)',
      'lg': '0 10px 15px rgba(0,0,0,0.1)',
    },
    darkMode: true,
  };
}

/**
 * Detect component library and registry from a project.
 */
export function detectComponentRegistry(projectDir: string): ComponentRegistry {
  const registry: ComponentRegistry = {
    components: [],
    library: null,
    framework: null,
  };

  // Detect component library from package.json
  const pkgPath = join(projectDir, 'package.json');
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    if (deps['@shadcn/ui'] || existsSync(join(projectDir, 'components.json'))) registry.library = 'shadcn';
    else if (deps['@radix-ui/react-dialog'] || deps['@radix-ui/themes']) registry.library = 'radix';
    else if (deps['@mui/material']) registry.library = 'mui';
    else if (deps['antd']) registry.library = 'antd';
    else if (deps['@chakra-ui/react']) registry.library = 'chakra';
    else if (deps['@headlessui/react']) registry.library = 'headlessui';

    if (deps['react'] || deps['react-dom']) registry.framework = 'react';
    else if (deps['vue']) registry.framework = 'vue';
    else if (deps['svelte']) registry.framework = 'svelte';
    else if (deps['@angular/core']) registry.framework = 'angular';
  }

  // Scan for components
  const componentDirs = ['src/components', 'components', 'src/ui', 'app/components', 'src/components/ui'];
  for (const dir of componentDirs) {
    const fullDir = join(projectDir, dir);
    if (existsSync(fullDir)) {
      try {
        scanComponents(fullDir, dir, registry.components);
      } catch {}
    }
  }

  return registry;
}

function scanComponents(dir: string, relBase: string, components: ComponentEntry[]): void {
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        scanComponents(join(dir, entry.name), `${relBase}/${entry.name}`, components);
      } else if (entry.name.match(/\.(tsx|jsx|vue|svelte)$/)) {
        const name = entry.name.replace(/\.(tsx|jsx|vue|svelte)$/, '');
        if (name === 'index') continue; // Skip barrel files
        const type = classifyComponent(name);
        components.push({ name, path: `${relBase}/${entry.name}`, type });
      }
    }
  } catch {}
}

function classifyComponent(name: string): ComponentEntry['type'] {
  const lower = name.toLowerCase();
  if (/button|badge|avatar|icon|tag|chip|tooltip/i.test(lower)) return 'ui';
  if (/layout|header|footer|sidebar|menu/i.test(lower)) return 'layout';
  if (/input|form|select|checkbox|radio|textarea|switch|slider/i.test(lower)) return 'form';
  if (/table|list|card|grid|chart|graph|stat/i.test(lower)) return 'data';
  if (/link|breadcrumb|tab|pagination|stepper|nav|navbar/i.test(lower)) return 'navigation';
  return 'other';
}

/**
 * Run Brand Guardian validation on project files.
 * Checks for hardcoded colors, inconsistent spacing, missing a11y, etc.
 */
export function runBrandGuardian(projectDir: string, tokens: DesignTokens): BrandGuardianReport {
  const issues: BrandGuardianIssue[] = [];
  let filesScanned = 0;

  // Scan frontend files
  const files = findFiles(projectDir, ['src', 'app', 'pages', 'components'], ['.tsx', '.jsx', '.vue', '.svelte', '.css']);

  for (const file of files.slice(0, 100)) { // Cap at 100 files
    try {
      const content = readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      const relPath = file.replace(projectDir, '').replace(/\\/g, '/').replace(/^\//, '');
      filesScanned++;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNum = i + 1;

        // Rule: Hardcoded hex colors (not in comments or strings defining tokens)
        if (file.match(/\.(tsx|jsx|vue|svelte)$/)) {
          const hexMatches = line.matchAll(/#[0-9a-fA-F]{3,8}\b/g);
          for (const m of hexMatches) {
            // Skip if in a comment
            if (line.trimStart().startsWith('//') || line.trimStart().startsWith('*')) continue;
            // Skip if in CSS variable definition
            if (line.includes('--')) continue;
            issues.push({
              file: relPath,
              line: lineNum,
              severity: 'warning',
              rule: 'no-hardcoded-colors',
              message: `Hardcoded color ${m[0]} — use design tokens instead`,
              fix: 'Replace with a CSS variable or Tailwind class from your design system',
            });
          }
        }

        // Rule: Inline styles with px values (not responsive)
        if (line.includes('style=') && line.match(/\d+px/)) {
          issues.push({
            file: relPath,
            line: lineNum,
            severity: 'warning',
            rule: 'no-inline-px',
            message: 'Inline px values — use spacing tokens or Tailwind classes',
            fix: 'Replace px values with spacing scale (xs, sm, md, lg, xl)',
          });
        }

        // Rule: Images without alt text
        if (line.match(/<img\b/) && !line.includes('alt=') && !line.includes('alt =')) {
          issues.push({
            file: relPath,
            line: lineNum,
            severity: 'error',
            rule: 'img-alt-text',
            message: 'Image missing alt attribute — accessibility violation',
            fix: 'Add alt="descriptive text" or alt="" for decorative images',
          });
        }

        // Rule: Click handler without keyboard support
        if (line.includes('onClick') && !line.includes('onKeyDown') && !line.includes('onKeyUp') && !line.includes('onKeyPress')) {
          if (line.includes('<div') || line.includes('<span')) {
            issues.push({
              file: relPath,
              line: lineNum,
              severity: 'warning',
              rule: 'keyboard-accessible',
              message: 'Click handler on non-interactive element without keyboard support',
              fix: 'Add onKeyDown handler and role="button" tabIndex={0}, or use <button>',
            });
          }
        }

        // Rule: Hardcoded font-size
        if (line.match(/font-size:\s*\d+px/) && !line.includes('--')) {
          issues.push({
            file: relPath,
            line: lineNum,
            severity: 'info',
            rule: 'use-typography-scale',
            message: 'Hardcoded font-size — use typography scale tokens',
            fix: 'Replace with typography scale class (text-xs, text-sm, text-base, etc.)',
          });
        }

        // Rule: Missing lang attribute on html
        if (line.match(/<html\b/) && !line.includes('lang=')) {
          issues.push({
            file: relPath,
            line: lineNum,
            severity: 'error',
            rule: 'html-lang',
            message: 'HTML element missing lang attribute — accessibility violation',
            fix: 'Add lang="en" (or appropriate language code) to <html>',
          });
        }
      }
    } catch {}
  }

  const errors = issues.filter(i => i.severity === 'error').length;
  const warnings = issues.filter(i => i.severity === 'warning').length;
  const infos = issues.filter(i => i.severity === 'info').length;

  return {
    issues,
    passed: errors === 0,
    stats: { errors, warnings, infos, filesScanned },
  };
}

/**
 * Generate a design system config file for the project.
 */
export function generateDesignSystemConfig(tokens: DesignTokens, registry: ComponentRegistry): string {
  return JSON.stringify({
    version: '1.0',
    tokens,
    components: {
      library: registry.library,
      framework: registry.framework,
      count: registry.components.length,
      entries: registry.components,
    },
  }, null, 2) + '\n';
}

// Helper: Find files in directories with specific extensions
function findFiles(base: string, dirs: string[], extensions: string[]): string[] {
  const files: string[] = [];
  for (const dir of dirs) {
    const fullDir = join(base, dir);
    if (existsSync(fullDir)) {
      walkDir(fullDir, extensions, files);
    }
  }
  return files;
}

function walkDir(dir: string, extensions: string[], result: string[]): void {
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === 'dist' || entry.name === '.git') continue;
        walkDir(full, extensions, result);
      } else if (extensions.some(ext => entry.name.endsWith(ext))) {
        result.push(full);
      }
    }
  } catch {}
}
