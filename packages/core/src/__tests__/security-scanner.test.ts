import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { runSecurityScan, generateSecurityReport, getScanRules } from '../generators/security-scanner';

describe('Security Scanner', () => {
  let tempDir: string;

  function createTempDir(): string {
    tempDir = mkdtempSync(join(tmpdir(), 'fishi-security-'));
    mkdirSync(join(tempDir, 'src'), { recursive: true });
    return tempDir;
  }

  afterEach(() => {
    if (tempDir) rmSync(tempDir, { recursive: true, force: true });
  });

  describe('getScanRules', () => {
    it('returns all scan rules', () => {
      const rules = getScanRules();
      expect(rules.length).toBeGreaterThanOrEqual(20);
    });

    it('each rule has id, category, severity, message', () => {
      for (const rule of getScanRules()) {
        expect(rule.id).toBeTruthy();
        expect(rule.category).toBeTruthy();
        expect(rule.severity).toBeTruthy();
        expect(rule.message).toBeTruthy();
      }
    });

    it('covers all OWASP top 10 categories', () => {
      const rules = getScanRules();
      const categories = new Set(rules.map(r => r.category));
      expect([...categories].some(c => c.includes('A01'))).toBe(true);
      expect([...categories].some(c => c.includes('A02'))).toBe(true);
      expect([...categories].some(c => c.includes('A03'))).toBe(true);
      expect([...categories].some(c => c.includes('A07'))).toBe(true);
      expect([...categories].some(c => c.includes('A10'))).toBe(true);
    });
  });

  describe('runSecurityScan', () => {
    it('passes for clean project', () => {
      const dir = createTempDir();
      writeFileSync(join(dir, 'src', 'app.ts'), 'export function hello() { return "hi"; }\n');
      const report = runSecurityScan(dir);
      expect(report.summary.passed).toBe(true);
      expect(report.summary.total).toBe(0);
    });

    it('detects hardcoded secrets', () => {
      const dir = createTempDir();
      writeFileSync(join(dir, 'src', 'config.ts'), 'const apiKey = "sk_live_abc123def456ghi789";\n');
      const report = runSecurityScan(dir);
      const finding = report.findings.find(f => f.rule === 'no-hardcoded-secret');
      expect(finding).toBeDefined();
      expect(finding!.severity).toBe('critical');
      expect(finding!.cwe).toBe('CWE-798');
    });

    it('detects SQL injection', () => {
      const dir = createTempDir();
      writeFileSync(join(dir, 'src', 'db.ts'), 'db.query(`SELECT * FROM users WHERE id = ${userId}`);\n');
      const report = runSecurityScan(dir);
      const finding = report.findings.find(f => f.rule === 'no-sql-injection');
      expect(finding).toBeDefined();
      expect(finding!.severity).toBe('critical');
    });

    it('detects command injection', () => {
      const dir = createTempDir();
      writeFileSync(join(dir, 'src', 'run.ts'), 'execSync(`ls ${userInput}`);\n');
      const report = runSecurityScan(dir);
      const finding = report.findings.find(f => f.rule === 'no-command-injection');
      expect(finding).toBeDefined();
      expect(finding!.severity).toBe('critical');
    });

    it('detects eval usage', () => {
      const dir = createTempDir();
      writeFileSync(join(dir, 'src', 'bad.ts'), 'const result = eval(userCode);\n');
      const report = runSecurityScan(dir);
      const finding = report.findings.find(f => f.rule === 'no-eval');
      expect(finding).toBeDefined();
      expect(finding!.severity).toBe('high');
    });

    it('detects XSS via dangerouslySetInnerHTML', () => {
      const dir = createTempDir();
      writeFileSync(join(dir, 'src', 'comp.tsx'), '<div dangerouslySetInnerHTML={{ __html: content }} />\n');
      const report = runSecurityScan(dir);
      const finding = report.findings.find(f => f.rule === 'no-dangerouslySetInnerHTML');
      expect(finding).toBeDefined();
    });

    it('detects XSS via innerHTML', () => {
      const dir = createTempDir();
      writeFileSync(join(dir, 'src', 'dom.js'), 'element.innerHTML = userInput;\n');
      const report = runSecurityScan(dir);
      const finding = report.findings.find(f => f.rule === 'no-innerhtml');
      expect(finding).toBeDefined();
    });

    it('detects CORS wildcard', () => {
      const dir = createTempDir();
      writeFileSync(join(dir, 'src', 'server.ts'), 'res.setHeader("Access-Control-Allow-Origin", "*");\n');
      const report = runSecurityScan(dir);
      const finding = report.findings.find(f => f.rule === 'no-cors-wildcard');
      expect(finding).toBeDefined();
    });

    it('detects JWT none algorithm', () => {
      const dir = createTempDir();
      writeFileSync(join(dir, 'src', 'auth.ts'), 'jwt.sign(payload, secret, { algorithm: "none" });\n');
      const report = runSecurityScan(dir);
      const finding = report.findings.find(f => f.rule === 'no-jwt-none-alg');
      expect(finding).toBeDefined();
      expect(finding!.severity).toBe('critical');
    });

    it('detects path traversal', () => {
      const dir = createTempDir();
      writeFileSync(join(dir, 'src', 'files.ts'), 'const data = readFileSync(req.query.path);\n');
      const report = runSecurityScan(dir);
      const finding = report.findings.find(f => f.rule === 'no-unvalidated-file-path');
      expect(finding).toBeDefined();
    });

    it('detects SSRF', () => {
      const dir = createTempDir();
      writeFileSync(join(dir, 'src', 'proxy.ts'), 'const res = await fetch(req.query.url);\n');
      const report = runSecurityScan(dir);
      const finding = report.findings.find(f => f.rule === 'no-ssrf');
      expect(finding).toBeDefined();
    });

    it('detects insecure cookies', () => {
      const dir = createTempDir();
      writeFileSync(join(dir, 'src', 'session.ts'), 'res.cookie("session", token, { httpOnly: false, secure: false });\n');
      const report = runSecurityScan(dir);
      expect(report.findings.some(f => f.rule === 'no-http-only-false')).toBe(true);
    });

    it('detects empty catch blocks', () => {
      const dir = createTempDir();
      writeFileSync(join(dir, 'src', 'handler.ts'), 'try { doStuff(); } catch (e) {}\n');
      const report = runSecurityScan(dir);
      expect(report.findings.some(f => f.rule === 'no-empty-catch')).toBe(true);
    });

    it('skips comments', () => {
      const dir = createTempDir();
      writeFileSync(join(dir, 'src', 'safe.ts'), '// const apiKey = "sk_live_abc123def456ghi789";\n');
      const report = runSecurityScan(dir);
      expect(report.findings.find(f => f.rule === 'no-hardcoded-secret')).toBeUndefined();
    });

    it('skips test/example patterns for secrets', () => {
      const dir = createTempDir();
      writeFileSync(join(dir, 'src', 'example.ts'), 'const apiKey = "your_example_key_here_placeholder";\n');
      const report = runSecurityScan(dir);
      expect(report.findings.find(f => f.rule === 'no-hardcoded-secret')).toBeUndefined();
    });

    it('skips node_modules', () => {
      const dir = createTempDir();
      mkdirSync(join(dir, 'node_modules', 'bad-pkg'), { recursive: true });
      writeFileSync(join(dir, 'node_modules', 'bad-pkg', 'index.js'), 'eval(code);\n');
      const report = runSecurityScan(dir);
      expect(report.findings).toHaveLength(0);
    });

    it('reports correct file and line numbers', () => {
      const dir = createTempDir();
      writeFileSync(join(dir, 'src', 'app.ts'), 'const a = 1;\nconst b = 2;\nconst result = eval(userCode);\nconst c = 3;\n');
      const report = runSecurityScan(dir);
      const finding = report.findings.find(f => f.rule === 'no-eval');
      expect(finding!.line).toBe(3);
      expect(finding!.file).toContain('src/app.ts');
    });

    it('summary counts are correct', () => {
      const dir = createTempDir();
      writeFileSync(join(dir, 'src', 'bad.ts'), 'const secret = "sk_live_realkey12345678";\neval(code);\ntry {} catch(e) {}\n');
      const report = runSecurityScan(dir);
      expect(report.summary.total).toBe(report.findings.length);
      expect(report.summary.critical + report.summary.high + report.summary.medium + report.summary.low + report.summary.info).toBe(report.summary.total);
    });
  });

  describe('generateSecurityReport', () => {
    it('generates markdown with summary table', () => {
      const dir = createTempDir();
      writeFileSync(join(dir, 'src', 'app.ts'), 'eval(code);\n');
      const report = runSecurityScan(dir);
      const md = generateSecurityReport(report);
      expect(md).toContain('# Security Scan Report');
      expect(md).toContain('| Severity | Count |');
      expect(md).toContain('FAILED');
    });

    it('generates PASSED report for clean project', () => {
      const dir = createTempDir();
      writeFileSync(join(dir, 'src', 'app.ts'), 'export const x = 1;\n');
      const report = runSecurityScan(dir);
      const md = generateSecurityReport(report);
      expect(md).toContain('PASSED');
      expect(md).toContain('No security issues found');
    });

    it('groups findings by category', () => {
      const dir = createTempDir();
      writeFileSync(join(dir, 'src', 'bad.ts'), 'eval(code);\nelement.innerHTML = x;\n');
      const report = runSecurityScan(dir);
      const md = generateSecurityReport(report);
      expect(md).toContain('## OWASP-A03: Injection');
      expect(md).toContain('## SAST: XSS');
    });

    it('includes CWE references', () => {
      const dir = createTempDir();
      writeFileSync(join(dir, 'src', 'bad.ts'), 'eval(code);\n');
      const report = runSecurityScan(dir);
      const md = generateSecurityReport(report);
      expect(md).toContain('CWE-95');
    });

    it('includes fix recommendations', () => {
      const dir = createTempDir();
      writeFileSync(join(dir, 'src', 'bad.ts'), 'eval(code);\n');
      const report = runSecurityScan(dir);
      const md = generateSecurityReport(report);
      expect(md).toContain('**Fix:**');
      expect(md).toContain('JSON.parse');
    });
  });
});
