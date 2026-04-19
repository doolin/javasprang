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
  { artifact: "npm-audit", file: "npm-audit.json" },
  { artifact: "trivy-results", file: "trivy-results.json" },
  { artifact: "sbom", file: "sbom.cyclonedx.json" },
  { artifact: "oscal", file: "assessment-results.json" },
  { artifact: "oscal", file: "component-definition.json" },
  { artifact: "oscal", file: "ssp-fragment.json" },
];

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
const entries = files.map((f) => ({
  path: path.relative(evidenceDir, f),
  size: fs.statSync(f).size,
  sha256: sha256(f),
}));

const byName = new Set(entries.map((e) => path.basename(e.path)));
const missing = expected.filter((x) => !byName.has(x.file));

const manifest = {
  generated_at: new Date().toISOString(),
  commit: process.env.COMMIT_SHA || process.env.GITHUB_SHA || "unknown",
  run_id: process.env.RUN_ID || process.env.GITHUB_RUN_ID || "unknown",
  repo: process.env.REPO || process.env.GITHUB_REPOSITORY || "unknown/unknown",
  artifacts: entries,
  expected,
  missing,
};

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

console.log(
  JSON.stringify({
    event: "verify_evidence",
    severity: missing.length ? "high" : "info",
    artifacts_found: entries.length,
    missing_count: missing.length,
    missing_files: missing.map((m) => m.file),
    timestamp: manifest.generated_at,
  }),
);

if (missing.length > 0) {
  console.error(
    `evidence manifest incomplete — missing ${missing.length} expected artifact(s): ` +
      missing.map((m) => m.file).join(", "),
  );
  process.exit(1);
}
