import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface SecurityFinding {
  rule: string;
  category: string;         // OWASP category or SAST category
  severity: Severity;
  file: string;
  line: number;
  code: string;             // the offending line (trimmed)
  message: string;
  fix: string;
  cwe?: string;             // CWE ID if applicable
}

export interface SecurityReport {
  findings: SecurityFinding[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
    total: number;
    filesScanned: number;
    passed: boolean;         // true if no critical or high
  };
  scanDate: string;
  projectDir: string;
}

interface ScanRule {
  id: string;
  category: string;
  severity: Severity;
  pattern: RegExp;
  message: string;
  fix: string;
  cwe?: string;
  fileTypes?: string[];     // only scan these extensions, empty = all
  exclude?: RegExp;         // skip if line matches this (to reduce false positives)
}

const SCAN_RULES: ScanRule[] = [
  // -- OWASP A01: Broken Access Control --
  {
    id: 'no-cors-wildcard',
    category: 'OWASP-A01: Broken Access Control',
    severity: 'high',
    pattern: /['"]Access-Control-Allow-Origin['"]\s*[,:]\s*['"]\*['"]/,
    message: 'CORS wildcard (*) allows any origin — restrict to specific domains',
    fix: 'Set Access-Control-Allow-Origin to specific trusted domains',
    cwe: 'CWE-942',
    fileTypes: ['.ts', '.js', '.mjs', '.tsx', '.jsx'],
  },
  {
    id: 'no-open-redirect',
    category: 'OWASP-A01: Broken Access Control',
    severity: 'medium',
    pattern: /redirect\s*\(\s*req\.(query|params|body)\./,
    message: 'Open redirect — user-controlled redirect target',
    fix: 'Validate redirect URLs against an allowlist of trusted domains',
    cwe: 'CWE-601',
    fileTypes: ['.ts', '.js', '.mjs', '.tsx', '.jsx'],
  },

  // -- OWASP A02: Cryptographic Failures --
  {
    id: 'no-hardcoded-secret',
    category: 'OWASP-A02: Cryptographic Failures',
    severity: 'critical',
    pattern: /(?:password|secret|api_?key|token|auth|private_?key)\s*[:=]\s*['"][^'"]{8,}['"]/i,
    message: 'Possible hardcoded secret or credential',
    fix: 'Move secrets to environment variables (.env) and never commit them',
    cwe: 'CWE-798',
    fileTypes: ['.ts', '.js', '.mjs', '.tsx', '.jsx', '.py', '.java', '.go', '.rb'],
    exclude: /example|placeholder|test|mock|fake|dummy|sample|TODO|FIXME|xxx|your[_-]?/i,
  },
  {
    id: 'no-md5',
    category: 'OWASP-A02: Cryptographic Failures',
    severity: 'high',
    pattern: /(?:createHash|hashlib\.md5|MD5|md5)\s*\(\s*['"]?md5['"]?\s*\)/,
    message: 'MD5 is cryptographically broken — use SHA-256 or bcrypt',
    fix: 'Replace MD5 with SHA-256 for hashing or bcrypt/argon2 for passwords',
    cwe: 'CWE-328',
  },
  {
    id: 'no-weak-crypto',
    category: 'OWASP-A02: Cryptographic Failures',
    severity: 'medium',
    pattern: /createHash\s*\(\s*['"]sha1['"]\s*\)/,
    message: 'SHA-1 is deprecated — use SHA-256 or stronger',
    fix: 'Replace SHA-1 with SHA-256: createHash("sha256")',
    cwe: 'CWE-328',
    fileTypes: ['.ts', '.js', '.mjs'],
  },

  // -- OWASP A03: Injection --
  {
    id: 'no-sql-injection',
    category: 'OWASP-A03: Injection',
    severity: 'critical',
    pattern: /(?:query|execute|raw)\s*\(\s*[`'"].*\$\{.*\}.*[`'"]/,
    message: 'Possible SQL injection — string interpolation in query',
    fix: 'Use parameterized queries: db.query("SELECT * FROM users WHERE id = $1", [userId])',
    cwe: 'CWE-89',
    fileTypes: ['.ts', '.js', '.mjs', '.tsx', '.jsx'],
  },
  {
    id: 'no-command-injection',
    category: 'OWASP-A03: Injection',
    severity: 'critical',
    pattern: /(?:exec|execSync|spawn|spawnSync)\s*\(\s*[`'"].*\$\{.*\}.*[`'"]/,
    message: 'Possible command injection — user input in shell command',
    fix: 'Use execFile() with argument array instead of string interpolation in exec()',
    cwe: 'CWE-78',
    fileTypes: ['.ts', '.js', '.mjs'],
    exclude: /fishi|scripts|hooks/i,
  },
  {
    id: 'no-eval',
    category: 'OWASP-A03: Injection',
    severity: 'high',
    pattern: /\beval\s*\(/,
    message: 'eval() executes arbitrary code — never use with user input',
    fix: 'Replace eval() with JSON.parse() for data or a safe parser for expressions',
    cwe: 'CWE-95',
    fileTypes: ['.ts', '.js', '.mjs', '.tsx', '.jsx'],
    exclude: /['"]use strict['"]/,
  },
  {
    id: 'no-dangerouslySetInnerHTML',
    category: 'OWASP-A03: Injection',
    severity: 'high',
    pattern: /dangerouslySetInnerHTML/,
    message: 'dangerouslySetInnerHTML can lead to XSS if content is not sanitized',
    fix: 'Sanitize HTML with DOMPurify before using dangerouslySetInnerHTML, or use React components instead',
    cwe: 'CWE-79',
    fileTypes: ['.tsx', '.jsx'],
  },

  // -- OWASP A04: Insecure Design --
  {
    id: 'no-console-log-sensitive',
    category: 'OWASP-A04: Insecure Design',
    severity: 'medium',
    pattern: /console\.(log|info|debug)\s*\(.*(?:password|secret|token|key|credential|auth)/i,
    message: 'Logging sensitive data (password, secret, token)',
    fix: 'Remove sensitive data from log statements or use structured logging with redaction',
    cwe: 'CWE-532',
    fileTypes: ['.ts', '.js', '.mjs', '.tsx', '.jsx'],
    exclude: /\/\/|test|spec|mock/i,
  },

  // -- OWASP A05: Security Misconfiguration --
  {
    id: 'no-debug-mode',
    category: 'OWASP-A05: Security Misconfiguration',
    severity: 'medium',
    pattern: /(?:DEBUG|debug)\s*[:=]\s*(?:true|1|['"]true['"])/,
    message: 'Debug mode enabled — disable in production',
    fix: 'Use environment-based config: DEBUG = process.env.NODE_ENV !== "production"',
    cwe: 'CWE-489',
    exclude: /test|spec|\.env\.example|\.env\.local/i,
  },
  {
    id: 'no-http-only-false',
    category: 'OWASP-A05: Security Misconfiguration',
    severity: 'high',
    pattern: /httpOnly\s*:\s*false/,
    message: 'Cookie httpOnly set to false — vulnerable to XSS cookie theft',
    fix: 'Set httpOnly: true for authentication cookies',
    cwe: 'CWE-1004',
    fileTypes: ['.ts', '.js', '.mjs'],
  },
  {
    id: 'no-secure-false',
    category: 'OWASP-A05: Security Misconfiguration',
    severity: 'medium',
    pattern: /secure\s*:\s*false/,
    message: 'Cookie secure flag set to false — cookie sent over HTTP',
    fix: 'Set secure: true for cookies in production (HTTPS only)',
    cwe: 'CWE-614',
    fileTypes: ['.ts', '.js', '.mjs'],
    exclude: /development|localhost|test/i,
  },

  // -- OWASP A07: Identification and Authentication Failures --
  {
    id: 'no-jwt-none-alg',
    category: 'OWASP-A07: Auth Failures',
    severity: 'critical',
    pattern: /algorithm\s*[:=]\s*['"]none['"]/i,
    message: 'JWT "none" algorithm — allows token forgery',
    fix: 'Always specify a strong algorithm: { algorithm: "HS256" } or RS256',
    cwe: 'CWE-327',
    fileTypes: ['.ts', '.js', '.mjs'],
  },
  {
    id: 'no-weak-password-regex',
    category: 'OWASP-A07: Auth Failures',
    severity: 'low',
    pattern: /password.*\.length\s*[<>=]+\s*[1-5]\b/,
    message: 'Weak password policy — minimum length too short',
    fix: 'Require minimum 8 characters with complexity requirements',
    cwe: 'CWE-521',
    fileTypes: ['.ts', '.js', '.mjs', '.tsx', '.jsx'],
  },

  // -- OWASP A08: Software and Data Integrity --
  {
    id: 'no-unsafe-deserialization',
    category: 'OWASP-A08: Data Integrity',
    severity: 'high',
    pattern: /JSON\.parse\s*\(\s*req\.(body|query|params)/,
    message: 'Parsing untrusted input without validation',
    fix: 'Validate and sanitize input with zod, joi, or yup before parsing',
    cwe: 'CWE-502',
    fileTypes: ['.ts', '.js', '.mjs'],
  },

  // -- OWASP A09: Security Logging and Monitoring Failures --
  {
    id: 'no-empty-catch',
    category: 'OWASP-A09: Logging Failures',
    severity: 'low',
    pattern: /catch\s*\([^)]*\)\s*\{\s*\}/,
    message: 'Empty catch block — errors silently swallowed',
    fix: 'Log the error: catch(e) { console.error("Context:", e); }',
    cwe: 'CWE-390',
    fileTypes: ['.ts', '.js', '.mjs', '.tsx', '.jsx'],
  },

  // -- OWASP A10: Server-Side Request Forgery (SSRF) --
  {
    id: 'no-ssrf',
    category: 'OWASP-A10: SSRF',
    severity: 'high',
    pattern: /(?:fetch|axios|got|request|http\.get)\s*\(\s*(?:req\.|params\.|query\.|body\.)/,
    message: 'Possible SSRF — user-controlled URL in server-side request',
    fix: 'Validate URLs against an allowlist; block internal IPs (127.0.0.1, 10.x, 192.168.x)',
    cwe: 'CWE-918',
    fileTypes: ['.ts', '.js', '.mjs'],
  },

  // -- Additional SAST Rules --
  {
    id: 'no-innerhtml',
    category: 'SAST: XSS',
    severity: 'high',
    pattern: /\.innerHTML\s*=/,
    message: 'Direct innerHTML assignment — XSS vulnerability',
    fix: 'Use textContent for text, or sanitize with DOMPurify before innerHTML',
    cwe: 'CWE-79',
    fileTypes: ['.ts', '.js', '.mjs', '.tsx', '.jsx'],
  },
  {
    id: 'no-document-write',
    category: 'SAST: XSS',
    severity: 'high',
    pattern: /document\.write\s*\(/,
    message: 'document.write() can inject malicious content',
    fix: 'Use DOM manipulation methods (createElement, appendChild) instead',
    cwe: 'CWE-79',
    fileTypes: ['.ts', '.js', '.mjs', '.tsx', '.jsx'],
  },
  {
    id: 'no-prototype-pollution',
    category: 'SAST: Prototype Pollution',
    severity: 'medium',
    pattern: /\[['"]__proto__['"]\]|\[['"]constructor['"]\]\s*\[['"]prototype['"]\]/,
    message: 'Potential prototype pollution via __proto__ or constructor.prototype',
    fix: 'Use Object.create(null) for dictionaries, validate keys against blocklist',
    cwe: 'CWE-1321',
    fileTypes: ['.ts', '.js', '.mjs'],
  },
  {
    id: 'no-unvalidated-file-path',
    category: 'SAST: Path Traversal',
    severity: 'high',
    pattern: /(?:readFile|writeFile|readFileSync|writeFileSync|createReadStream)\s*\(\s*(?:req\.|params\.|query\.|body\.|`.*\$\{)/,
    message: 'User input in file path — possible path traversal (../../etc/passwd)',
    fix: 'Sanitize paths: use path.resolve() + verify within allowed directory',
    cwe: 'CWE-22',
    fileTypes: ['.ts', '.js', '.mjs'],
  },
  {
    id: 'no-env-in-client',
    category: 'SAST: Secret Exposure',
    severity: 'high',
    pattern: /process\.env\.(?!NEXT_PUBLIC_|VITE_|NUXT_PUBLIC_)[\w]+/,
    message: 'Server-side env var accessed — ensure this is not in client-side code',
    fix: 'Use framework-specific public prefixes (NEXT_PUBLIC_, VITE_) for client-side env vars',
    cwe: 'CWE-200',
    fileTypes: ['.tsx', '.jsx'],
    exclude: /server|api|middleware|getServerSideProps|getStaticProps|loader|action/i,
  },
  {
    id: 'no-crypto-random',
    category: 'SAST: Weak Randomness',
    severity: 'medium',
    pattern: /Math\.random\s*\(\)/,
    message: 'Math.random() is not cryptographically secure',
    fix: 'Use crypto.randomUUID() or crypto.getRandomValues() for security-sensitive operations',
    cwe: 'CWE-330',
    fileTypes: ['.ts', '.js', '.mjs'],
    exclude: /test|spec|mock|animation|color|delay|jitter/i,
  },
];

/**
 * Scan a project for security vulnerabilities.
 */
export function runSecurityScan(projectDir: string): SecurityReport {
  const findings: SecurityFinding[] = [];
  let filesScanned = 0;

  const files = findScanFiles(projectDir);

  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      const relPath = file.replace(projectDir, '').replace(/\\/g, '/').replace(/^\//, '');
      const ext = extname(file);
      filesScanned++;

      for (const rule of SCAN_RULES) {
        // Check file type filter
        if (rule.fileTypes && rule.fileTypes.length > 0 && !rule.fileTypes.includes(ext)) continue;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];

          // Skip comments
          if (line.trimStart().startsWith('//') || line.trimStart().startsWith('*') || line.trimStart().startsWith('#')) continue;

          // Check exclude pattern
          if (rule.exclude && rule.exclude.test(line)) continue;

          if (rule.pattern.test(line)) {
            findings.push({
              rule: rule.id,
              category: rule.category,
              severity: rule.severity,
              file: relPath,
              line: i + 1,
              code: line.trim().slice(0, 120),
              message: rule.message,
              fix: rule.fix,
              cwe: rule.cwe,
            });
          }
        }
      }
    } catch {
      // Skip files that can't be read
    }
  }

  const critical = findings.filter(f => f.severity === 'critical').length;
  const high = findings.filter(f => f.severity === 'high').length;
  const medium = findings.filter(f => f.severity === 'medium').length;
  const low = findings.filter(f => f.severity === 'low').length;
  const info = findings.filter(f => f.severity === 'info').length;

  return {
    findings,
    summary: {
      critical,
      high,
      medium,
      low,
      info,
      total: findings.length,
      filesScanned,
      passed: critical === 0 && high === 0,
    },
    scanDate: new Date().toISOString(),
    projectDir,
  };
}

/**
 * Generate a markdown security report.
 */
export function generateSecurityReport(report: SecurityReport): string {
  const { findings, summary } = report;

  let md = `# Security Scan Report\n\n`;
  md += `**Date:** ${report.scanDate}\n`;
  md += `**Files Scanned:** ${summary.filesScanned}\n`;
  md += `**Status:** ${summary.passed ? 'PASSED' : 'FAILED'}\n\n`;

  md += `## Summary\n\n`;
  md += `| Severity | Count |\n|----------|-------|\n`;
  md += `| Critical | ${summary.critical} |\n`;
  md += `| High | ${summary.high} |\n`;
  md += `| Medium | ${summary.medium} |\n`;
  md += `| Low | ${summary.low} |\n`;
  md += `| Info | ${summary.info} |\n`;
  md += `| **Total** | **${summary.total}** |\n\n`;

  if (findings.length === 0) {
    md += `No security issues found.\n`;
    return md;
  }

  // Group by category
  const byCategory: Record<string, SecurityFinding[]> = {};
  for (const f of findings) {
    if (!byCategory[f.category]) byCategory[f.category] = [];
    byCategory[f.category].push(f);
  }

  for (const [category, catFindings] of Object.entries(byCategory)) {
    md += `## ${category}\n\n`;
    for (const f of catFindings) {
      const icon = f.severity === 'critical' ? '🔴' : f.severity === 'high' ? '🟠' : f.severity === 'medium' ? '🟡' : '🔵';
      md += `### ${icon} ${f.rule} (${f.severity.toUpperCase()})\n`;
      md += `**File:** \`${f.file}:${f.line}\`\n`;
      if (f.cwe) md += `**CWE:** ${f.cwe}\n`;
      md += `**Issue:** ${f.message}\n`;
      md += `**Code:** \`${f.code}\`\n`;
      md += `**Fix:** ${f.fix}\n\n`;
    }
  }

  return md;
}

/**
 * Get the list of scan rules for display.
 */
export function getScanRules(): { id: string; category: string; severity: Severity; message: string; cwe?: string }[] {
  return SCAN_RULES.map(r => ({
    id: r.id,
    category: r.category,
    severity: r.severity,
    message: r.message,
    cwe: r.cwe,
  }));
}

// Helper: find files to scan
function findScanFiles(projectDir: string): string[] {
  const scanExts = ['.ts', '.js', '.mjs', '.tsx', '.jsx', '.py', '.java', '.go', '.rb'];
  const skipDirs = ['node_modules', '.next', 'dist', '.git', '.fishi', '.trees', 'coverage', '__pycache__', '.venv'];
  const files: string[] = [];

  function walk(dir: string): void {
    try {
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          if (skipDirs.includes(entry.name)) continue;
          walk(join(dir, entry.name));
        } else if (scanExts.some(ext => entry.name.endsWith(ext))) {
          files.push(join(dir, entry.name));
        }
      }
    } catch {
      // Skip directories that can't be read
    }
  }

  walk(projectDir);
  return files.slice(0, 500); // Cap at 500 files
}
