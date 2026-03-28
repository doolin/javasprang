import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const angularLcovPath = path.join(root, 'coverage', 'todo-app-frontend', 'lcov.info');
const playwrightReportPath = path.join(root, 'coverage', 'playwright', 'results.json');
const outputDir = path.join(root, 'coverage', 'combined');

const lcov = fs.readFileSync(angularLcovPath, 'utf8');
const playwrightReport = JSON.parse(fs.readFileSync(playwrightReportPath, 'utf8'));

function sumMetric(lines, foundPrefix, hitPrefix) {
  let found = 0;
  let hit = 0;
  for (const line of lines) {
    if (line.startsWith(foundPrefix)) {
      found += Number(line.slice(foundPrefix.length));
    } else if (line.startsWith(hitPrefix)) {
      hit += Number(line.slice(hitPrefix.length));
    }
  }
  const pct = found === 0 ? 0 : Number(((hit / found) * 100).toFixed(2));
  return { total: found, covered: hit, pct };
}

const lcovLines = lcov.split(/\r?\n/);
const statements = sumMetric(lcovLines, 'LF:', 'LH:');
const functions = sumMetric(lcovLines, 'FNF:', 'FNH:');
const branches = sumMetric(lcovLines, 'BRF:', 'BRH:');
const angularSummary = {
  lines: statements,
  statements,
  functions,
  branches
};

const stats = playwrightReport.stats || {};
const expected = Number(stats.expected || 0);
const unexpected = Number(stats.unexpected || 0);
const flaky = Number(stats.flaky || 0);
const skipped = Number(stats.skipped || 0);
const totalPlaywright = expected + unexpected + flaky + skipped;
const passRate = totalPlaywright === 0 ? 0 : Number(((expected / totalPlaywright) * 100).toFixed(2));

const combined = {
  generatedAt: new Date().toISOString(),
  angular: angularSummary,
  playwright: {
    total: totalPlaywright,
    passed: expected,
    failed: unexpected,
    flaky,
    skipped,
    passRate
  }
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, 'summary.json'), JSON.stringify(combined, null, 2));

const markdown = [
  '# Combined Coverage Summary',
  '',
  '## Angular (Karma/Istanbul)',
  `- Statements: ${combined.angular.statements.pct}%`,
  `- Branches: ${combined.angular.branches.pct}%`,
  `- Functions: ${combined.angular.functions.pct}%`,
  `- Lines: ${combined.angular.lines.pct}%`,
  '',
  '## Playwright (E2E Execution)',
  `- Total scenarios: ${combined.playwright.total}`,
  `- Passed: ${combined.playwright.passed}`,
  `- Failed: ${combined.playwright.failed}`,
  `- Flaky: ${combined.playwright.flaky}`,
  `- Skipped: ${combined.playwright.skipped}`,
  `- Pass rate: ${combined.playwright.passRate}%`,
  ''
].join('\n');

fs.writeFileSync(path.join(outputDir, 'summary.md'), markdown);

console.log('Wrote combined coverage summary to coverage/combined/summary.json and coverage/combined/summary.md');
