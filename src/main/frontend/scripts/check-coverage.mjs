// Post-test coverage-threshold gate.
//
// karma-coverage's `check.global` block (in karma.conf.js) logs threshold
// violations at ERROR level, but the Angular CLI's karma builder does not
// propagate that as a non-zero exit code. This script reads the
// coverage-summary.json produced by karma-coverage and exits non-zero if
// any metric falls below the configured floor.
//
// Thresholds are duplicated here and in karma.conf.js intentionally
// (small surface area, drift caught at review). Keep both in sync.
// AGENTS.md "Coverage policy" is the authoritative source.

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SUMMARY = resolve(__dirname, '..', 'coverage', 'todo-app-frontend', 'coverage-summary.json');

const THRESHOLDS = {
  statements: 98,
  branches: 55,
  functions: 100,
  lines: 98,
};

const summary = JSON.parse(readFileSync(SUMMARY, 'utf8'));
const total = summary.total;

const misses = [];
for (const metric of Object.keys(THRESHOLDS)) {
  const actual = total[metric].pct;
  const floor = THRESHOLDS[metric];
  if (actual < floor) {
    misses.push({ metric, actual, floor });
  }
}

if (misses.length === 0) {
  console.log('Coverage thresholds met:');
  for (const metric of Object.keys(THRESHOLDS)) {
    console.log(`  ${metric}: ${total[metric].pct}% (floor ${THRESHOLDS[metric]}%)`);
  }
  process.exit(0);
}

console.error('Coverage thresholds NOT met:');
for (const { metric, actual, floor } of misses) {
  console.error(`  ${metric}: ${actual}% (floor ${floor}%)`);
}
process.exit(1);
