#!/usr/bin/env node
// Generates a PR-summary markdown comment from the pipeline's evidence
// artifacts. Reads from a directory tree like:
//
//   evidence/
//     surefire-reports/TEST-*.xml + *.txt
//     jacoco-report/jacoco.xml
//     frontend-coverage/coverage-summary.json
//     npm-audit/npm-audit.json   (or flat)
//     trivy-results/trivy-results.json
//     gitleaks-report/gitleaks-report.json
//     sbom/sbom.cyclonedx.json
//     oscal/{assessment-results,component-definition,ssp-fragment}.json
//     evidence-manifest/evidence-manifest.json
//     playwright-test-results/   (subdirs per failed test)
//
// Emits the comment body to stdout. Each section is best-effort —
// missing artifacts are reported as "—" rather than aborting.

import fs from "node:fs";
import path from "node:path";

const [, , evidenceDirArg] = process.argv;
const evidenceDir = path.resolve(evidenceDirArg || "evidence");
const runUrl = process.env.RUN_URL || "";
const headSha = process.env.HEAD_SHA || "";

function findFile(name) {
  const candidates = [
    path.join(evidenceDir, name),
    ...fs.existsSync(evidenceDir)
      ? fs
          .readdirSync(evidenceDir, { withFileTypes: true })
          .filter((e) => e.isDirectory())
          .map((d) => path.join(evidenceDir, d.name, name))
      : [],
  ];
  return candidates.find((p) => fs.existsSync(p));
}

function findDir(name) {
  const candidates = [
    path.join(evidenceDir, name),
    ...fs.existsSync(evidenceDir)
      ? fs
          .readdirSync(evidenceDir, { withFileTypes: true })
          .filter((e) => e.isDirectory() && e.name === name)
          .map((d) => path.join(evidenceDir, d.name))
      : [],
  ];
  return candidates.find((p) => fs.existsSync(p));
}

function readJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function readText(p) {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return null;
  }
}

// --- Surefire (backend tests) -------------------------------------------------

function summarizeSurefire() {
  const dir = findDir("surefire-reports");
  if (!dir) return null;
  let total = 0;
  let failures = 0;
  let errors = 0;
  let skipped = 0;
  for (const entry of fs.readdirSync(dir)) {
    if (!entry.endsWith(".txt")) continue;
    const txt = readText(path.join(dir, entry));
    if (!txt) continue;
    const m = txt.match(
      /Tests run:\s*(\d+),\s*Failures:\s*(\d+),\s*Errors:\s*(\d+),\s*Skipped:\s*(\d+)/,
    );
    if (m) {
      total += +m[1];
      failures += +m[2];
      errors += +m[3];
      skipped += +m[4];
    }
  }
  return { total, failures, errors, skipped };
}

// --- JaCoCo (backend coverage) ------------------------------------------------

function summarizeJacoco() {
  const xmlPath = findFile("jacoco.xml") ||
    (() => {
      const dir = findDir("jacoco-report");
      return dir ? path.join(dir, "jacoco.xml") : null;
    })();
  if (!xmlPath || !fs.existsSync(xmlPath)) return null;
  const xml = readText(xmlPath);
  if (!xml) return null;
  // Bundle-level counters appear last in the JaCoCo XML report; the final
  // <counter type="LINE" .../> and <counter type="BRANCH" .../> in the doc
  // are the bundle totals.
  const counters = {};
  for (const m of xml.matchAll(
    /<counter\s+type="(\w+)"\s+missed="(\d+)"\s+covered="(\d+)"/g,
  )) {
    counters[m[1]] = { missed: +m[2], covered: +m[3] };
  }
  function pct(c) {
    if (!c) return null;
    const total = c.missed + c.covered;
    return total === 0 ? null : (c.covered / total) * 100;
  }
  return {
    line: pct(counters.LINE),
    branch: pct(counters.BRANCH),
  };
}

// --- Frontend coverage --------------------------------------------------------

function summarizeFrontendCoverage() {
  const candidates = [
    "frontend-coverage/coverage-summary.json",
    "frontend-coverage/coverage-final.json",
  ];
  for (const c of candidates) {
    const p = path.join(evidenceDir, c);
    if (fs.existsSync(p)) {
      const data = readJson(p);
      if (data && data.total) {
        return {
          line: data.total.lines && data.total.lines.pct,
          branch: data.total.branches && data.total.branches.pct,
        };
      }
    }
  }
  return null;
}

// --- Trivy --------------------------------------------------------------------

function summarizeTrivy() {
  const p = findFile("trivy-results.json");
  if (!p) return null;
  const data = readJson(p);
  if (!data) return null;
  const findings = (data.Results || []).flatMap(
    (r) => r.Vulnerabilities || [],
  );
  const bySev = {};
  for (const v of findings) {
    const s = (v.Severity || "UNKNOWN").toUpperCase();
    bySev[s] = (bySev[s] || 0) + 1;
  }
  return { total: findings.length, bySev };
}

// --- npm audit ----------------------------------------------------------------

function summarizeNpmAudit() {
  const p = findFile("npm-audit.json");
  if (!p) return null;
  const data = readJson(p);
  if (!data) return null;
  const vulns = data.vulnerabilities || {};
  const counts = data.metadata && data.metadata.vulnerabilities;
  if (counts) return counts;
  // Fallback: count direct entries
  const bySev = {};
  for (const v of Object.values(vulns)) {
    const s = (v.severity || "info").toLowerCase();
    bySev[s] = (bySev[s] || 0) + 1;
  }
  return bySev;
}

// --- Gitleaks -----------------------------------------------------------------

function summarizeGitleaks() {
  const p = findFile("gitleaks-report.json");
  if (!p) return null;
  const data = readJson(p);
  if (!data) return null;
  const findings = data.findings || (Array.isArray(data) ? data : []);
  return { total: Array.isArray(findings) ? findings.length : 0 };
}

// --- Evidence manifest --------------------------------------------------------

function summarizeManifest() {
  const p = findFile("evidence-manifest.json");
  if (!p) return null;
  const data = readJson(p);
  if (!data) return null;
  return {
    artifacts: (data.artifacts || []).length,
    missing: (data.missing || []).length + (data.missingDirs || []).length,
  };
}

// --- Playwright ---------------------------------------------------------------

function summarizePlaywright() {
  const dir = findDir("playwright-test-results");
  if (!dir) return null;
  const entries = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory());
  return { failedSpecs: entries.length };
}

// --- Compose markdown ---------------------------------------------------------

const surefire = summarizeSurefire();
const jacoco = summarizeJacoco();
const feCov = summarizeFrontendCoverage();
const trivy = summarizeTrivy();
const npmAudit = summarizeNpmAudit();
const gitleaks = summarizeGitleaks();
const manifest = summarizeManifest();
const playwright = summarizePlaywright();

const sections = [];

const greenCheck = "✅";
const redX = "❌";
const dash = "—";

function pct(v) {
  return v == null ? dash : `${v.toFixed(1)}%`;
}

function trivyOk(t) {
  return t == null || t.total === 0;
}
function npmOk(a) {
  if (!a) return true;
  return (a.high || 0) + (a.critical || 0) === 0;
}
function gitleaksOk(g) {
  return !g || g.total === 0;
}
function manifestOk(m) {
  return !m || m.missing === 0;
}
function testsOk(s) {
  return !s || (s.failures === 0 && s.errors === 0);
}
function playwrightOk(p) {
  return !p || p.failedSpecs === 0;
}

const allOk =
  testsOk(surefire) &&
  trivyOk(trivy) &&
  npmOk(npmAudit) &&
  gitleaksOk(gitleaks) &&
  manifestOk(manifest) &&
  playwrightOk(playwright);

sections.push("<!-- claude-pr-summary -->");
sections.push("## Pipeline summary");
sections.push("");
sections.push(
  `**Status:** ${allOk ? greenCheck + " all signals green" : redX + " attention needed"}` +
    (headSha ? ` · \`${headSha.slice(0, 7)}\`` : ""),
);
sections.push("");

const rows = [];
if (surefire) {
  const ok = testsOk(surefire);
  rows.push([
    "Backend tests (Surefire)",
    `${ok ? greenCheck : redX} ${surefire.total} run, ${surefire.failures} failed, ${surefire.errors} errored, ${surefire.skipped} skipped`,
  ]);
}
if (jacoco) {
  rows.push(["JaCoCo line coverage", pct(jacoco.line)]);
  rows.push(["JaCoCo branch coverage", pct(jacoco.branch)]);
}
if (feCov) {
  rows.push(["Frontend line coverage", pct(feCov.line)]);
  rows.push(["Frontend branch coverage", pct(feCov.branch)]);
}
if (playwright) {
  const ok = playwrightOk(playwright);
  rows.push([
    "E2E (Playwright, desktop + mobile)",
    `${ok ? greenCheck : redX} ${playwright.failedSpecs} failed spec(s)`,
  ]);
}
if (trivy) {
  const ok = trivyOk(trivy);
  const bySev = Object.entries(trivy.bySev || {})
    .map(([s, n]) => `${s}: ${n}`)
    .join(", ") || "none";
  rows.push([
    "Trivy findings (gated severity)",
    `${ok ? greenCheck : redX} ${trivy.total} (${bySev})`,
  ]);
}
if (npmAudit) {
  const total =
    (npmAudit.high || 0) +
    (npmAudit.critical || 0) +
    (npmAudit.moderate || 0) +
    (npmAudit.low || 0);
  const ok = npmOk(npmAudit);
  rows.push([
    "npm audit (production)",
    `${ok ? greenCheck : redX} ${total} (critical: ${npmAudit.critical || 0}, high: ${npmAudit.high || 0}, moderate: ${npmAudit.moderate || 0})`,
  ]);
}
if (gitleaks) {
  const ok = gitleaksOk(gitleaks);
  rows.push([
    "Gitleaks (secrets)",
    `${ok ? greenCheck : redX} ${gitleaks.total} finding(s)`,
  ]);
}
if (manifest) {
  const ok = manifestOk(manifest);
  rows.push([
    "Evidence manifest",
    `${ok ? greenCheck : redX} ${manifest.artifacts} artifact(s); ${manifest.missing} missing`,
  ]);
}

if (rows.length > 0) {
  sections.push("| Signal | Value |");
  sections.push("| --- | --- |");
  for (const [k, v] of rows) {
    sections.push(`| ${k} | ${v} |`);
  }
  sections.push("");
}

if (runUrl) {
  sections.push(`[Workflow run details](${runUrl}) — sign in to view logs and download artifacts.`);
  sections.push("");
}

// --- Per-PR Pages report links ----------------------------------------------

const prNumber = process.env.PR_NUMBER;
const pagesBase = (process.env.PAGES_BASE_URL || "").replace(/\/+$/, "");
const publishResult = process.env.PUBLISH_PR_REPORTS_RESULT || "";

if (prNumber && pagesBase && publishResult === "success") {
  const root = `${pagesBase}/pr/${prNumber}`;
  sections.push(
    `**Reports:** [JaCoCo](${root}/jacoco/) · [Frontend coverage](${root}/frontend-coverage/) · [Playwright](${root}/playwright/) · [index](${root}/)`,
  );
  sections.push("");
} else if (prNumber && pagesBase && publishResult && publishResult !== "skipped") {
  sections.push(
    `_Per-PR HTML reports unavailable (publish-pr-reports: \`${publishResult}\`). One-time setup: enable Pages on the \`gh-pages\` branch in repo settings._`,
  );
  sections.push("");
}

sections.push("_Updated automatically by the `pr-summary` job._");

process.stdout.write(sections.join("\n") + "\n");
