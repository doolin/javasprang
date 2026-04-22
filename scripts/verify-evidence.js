#!/usr/bin/env node
// Walk an evidence directory, compute SHA-256 for every file, and emit a
// manifest. Fails the job if any expected artifact is missing — this is
// the drift-detection step that catches silent upstream breakage.

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const [, , evidenceDirArg, manifestPathArg] = process.argv;
if (!evidenceDirArg || !manifestPathArg) {
  console.error("usage: verify-evidence.js <evidence-dir> <manifest-path>");
  process.exit(2);
}

const evidenceDir = path.resolve(evidenceDirArg);
const manifestPath = path.resolve(manifestPathArg);

const expected = [
  { artifact: "gitleaks-report", file: "gitleaks-report.json" },
  { artifact: "npm-audit", file: "npm-audit.json" },
  { artifact: "trivy-results", file: "trivy-results.json" },
  { artifact: "sbom", file: "sbom.cyclonedx.json" },
  { artifact: "oscal", file: "assessment-results.json" },
  { artifact: "oscal", file: "component-definition.json" },
  { artifact: "oscal", file: "ssp-fragment.json" },
];

const expectedDirs = [
  { artifact: "surefire-reports", dir: "surefire-reports" },
  { artifact: "jacoco-report", dir: "jacoco-report" },
  { artifact: "frontend-coverage", dir: "frontend-coverage" },
];

// Artifact classification for manifest metadata.
// artifact-class: what kind of evidence this is.
// retention-class: GRS-aligned retention tier.
//   "permanent"   — OSCAL docs, SBOM, attestation (GRS 5.1, DAA-0567)
//   "long-term"   — scan results, manifest, provenance (3-7 yr, GRS 3.2)
//   "standard"    — test results, coverage, audit events (90 days, GRS 2.7)
//   "transient"   — pipeline definition snapshots, transport archives
const classificationRules = [
  { pattern: /^assessment-results\.json$/, artifactClass: "oscal-assessment", retentionClass: "permanent" },
  { pattern: /^component-definition\.json$/, artifactClass: "oscal-component", retentionClass: "permanent" },
  { pattern: /^ssp-fragment\.json$/, artifactClass: "oscal-ssp", retentionClass: "permanent" },
  { pattern: /^sbom\.cyclonedx\.json$/, artifactClass: "sbom", retentionClass: "permanent" },
  { pattern: /^gitleaks-report\.json$/, artifactClass: "secrets-scan", retentionClass: "long-term" },
  { pattern: /^npm-audit\.json$/, artifactClass: "vulnerability-scan", retentionClass: "long-term" },
  { pattern: /^trivy-results\.json$/, artifactClass: "vulnerability-scan", retentionClass: "long-term" },
  { pattern: /^evidence-manifest\.json$/, artifactClass: "manifest", retentionClass: "long-term" },
  { pattern: /^audit-event-.*\.json$/, artifactClass: "audit-event", retentionClass: "standard" },
  { pattern: /^surefire-reports\//, artifactClass: "test-results", retentionClass: "standard" },
  { pattern: /^jacoco-report\//, artifactClass: "coverage", retentionClass: "standard" },
  { pattern: /^frontend-coverage\//, artifactClass: "coverage", retentionClass: "standard" },
  { pattern: /^pipeline-definition\//, artifactClass: "pipeline-definition", retentionClass: "transient" },
];

function classify(relativePath) {
  const basename = path.basename(relativePath);
  for (const rule of classificationRules) {
    if (rule.pattern.test(relativePath) || rule.pattern.test(basename)) {
      return { "artifact-class": rule.artifactClass, "retention-class": rule.retentionClass };
    }
  }
  return { "artifact-class": "unclassified", "retention-class": "standard" };
}

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

function sha256(file) {
  const h = crypto.createHash("sha256");
  h.update(fs.readFileSync(file));
  return h.digest("hex");
}

if (!fs.existsSync(evidenceDir)) {
  console.error(`evidence directory missing: ${evidenceDir}`);
  process.exit(1);
}

const files = walk(evidenceDir);
const entries = files.map((f) => {
  const rel = path.relative(evidenceDir, f);
  return {
    path: rel,
    size: fs.statSync(f).size,
    sha256: sha256(f),
    ...classify(rel),
  };
});

const byName = new Set(entries.map((e) => path.basename(e.path)));
const missing = expected.filter((x) => !byName.has(x.file));

// Directory-based checks: each expectedDir must exist as a subdirectory
// under the evidence root and contain at least one file.
const missingDirs = expectedDirs.filter((x) => {
  const dirPath = path.join(evidenceDir, x.dir);
  if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
    return true;
  }
  // Must contain at least one file
  const dirFiles = walk(dirPath);
  return dirFiles.length === 0;
});

const totalMissing = missing.length + missingDirs.length;

const manifest = {
  generated_at: new Date().toISOString(),
  commit: process.env.COMMIT_SHA || process.env.GITHUB_SHA || "unknown",
  run_id: process.env.RUN_ID || process.env.GITHUB_RUN_ID || "unknown",
  repo: process.env.REPO || process.env.GITHUB_REPOSITORY || "unknown/unknown",
  artifacts: entries,
  expected,
  missing,
  expectedDirs,
  missingDirs,
};

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

console.log(
  JSON.stringify({
    event: "verify_evidence",
    severity: totalMissing ? "high" : "info",
    artifacts_found: entries.length,
    missing_count: missing.length,
    missing_files: missing.map((m) => m.file),
    missing_dir_count: missingDirs.length,
    missing_dirs: missingDirs.map((m) => m.dir),
    timestamp: manifest.generated_at,
  }),
);

if (totalMissing > 0) {
  const parts = [];
  if (missing.length > 0) {
    parts.push(
      `${missing.length} expected file(s): ${missing.map((m) => m.file).join(", ")}`,
    );
  }
  if (missingDirs.length > 0) {
    parts.push(
      `${missingDirs.length} expected dir(s): ${missingDirs.map((m) => m.dir).join(", ")}`,
    );
  }
  console.error(`evidence manifest incomplete — missing ${parts.join("; ")}`);
  process.exit(1);
}
