#!/usr/bin/env node
// Generate minimal OSCAL artifacts from vulnerability scan evidence.
// Inputs: an evidence directory containing npm-audit.json and trivy-results.json.
// Outputs: assessment-results.json, component-definition.json, ssp-fragment.json.
//
// Scope: shallow but schema-valid enough to prove the pipeline is producing
// M-24-15 machine-readable artifacts. Extend later as controls are claimed.

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const [, , evidenceDirArg, outDirArg] = process.argv;
if (!evidenceDirArg || !outDirArg) {
  console.error("usage: generate-oscal.js <evidence-dir> <out-dir>");
  process.exit(2);
}

const evidenceDir = path.resolve(evidenceDirArg);
const outDir = path.resolve(outDirArg);
fs.mkdirSync(outDir, { recursive: true });

const repo = process.env.REPO || "unknown/unknown";
const commit = process.env.COMMIT_SHA || "unknown";
const runId = process.env.RUN_ID || "unknown";
const now = new Date().toISOString();
const uuid = () => crypto.randomUUID();

function readJsonIfExists(p) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

const npmAudit = readJsonIfExists(path.join(evidenceDir, "npm-audit.json"));
const trivy = readJsonIfExists(path.join(evidenceDir, "trivy-results.json"));

const findings = [];

if (npmAudit && npmAudit.vulnerabilities) {
  for (const [name, v] of Object.entries(npmAudit.vulnerabilities)) {
    findings.push({
      source: "npm-audit",
      id: `npm:${name}`,
      severity: v.severity || "unknown",
      title: `npm advisory: ${name}`,
      description: (v.via || [])
        .map((x) => (typeof x === "string" ? x : x.title || x.name || ""))
        .filter(Boolean)
        .join("; ") || name,
    });
  }
}

if (trivy && Array.isArray(trivy.Results)) {
  for (const r of trivy.Results) {
    for (const vuln of r.Vulnerabilities || []) {
      findings.push({
        source: "trivy",
        id: vuln.VulnerabilityID,
        severity: (vuln.Severity || "unknown").toLowerCase(),
        title: vuln.Title || vuln.VulnerabilityID,
        description: vuln.Description || "",
        pkg: vuln.PkgName,
        version: vuln.InstalledVersion,
        fixed: vuln.FixedVersion || null,
      });
    }
  }
}

const assessmentResults = {
  "assessment-results": {
    uuid: uuid(),
    metadata: {
      title: `Assessment Results for ${repo}@${commit}`,
      "last-modified": now,
      version: "0.1.0",
      "oscal-version": "1.1.2",
    },
    "import-ap": { href: `#system-security-plan-${commit}` },
    results: [
      {
        uuid: uuid(),
        title: `CI run ${runId}`,
        description: "Automated CI/CD compliance pipeline results.",
        start: now,
        "reviewed-controls": {
          "control-selections": [
            {
              "include-controls": [
                { "control-id": "sa-11" },
                { "control-id": "sa-15" },
                { "control-id": "si-2" },
                { "control-id": "si-3" },
                { "control-id": "ra-5" },
              ],
            },
          ],
        },
        findings: findings.map((f) => ({
          uuid: uuid(),
          title: f.title,
          description: f.description,
          props: [
            { name: "source", value: f.source },
            { name: "external-id", value: f.id },
            { name: "severity", value: f.severity },
            ...(f.pkg ? [{ name: "package", value: f.pkg }] : []),
            ...(f.version ? [{ name: "installed-version", value: f.version }] : []),
            ...(f.fixed ? [{ name: "fixed-version", value: f.fixed }] : []),
          ],
        })),
      },
    ],
  },
};

const componentDefinition = {
  "component-definition": {
    uuid: uuid(),
    metadata: {
      title: `Component Definition for ${repo}`,
      "last-modified": now,
      version: "0.1.0",
      "oscal-version": "1.1.2",
    },
    components: [
      {
        uuid: uuid(),
        type: "software",
        title: repo,
        description: "Spring Boot + Angular todo application.",
        props: [
          { name: "commit", value: commit },
          { name: "run-id", value: runId },
        ],
      },
    ],
  },
};

const sspFragment = {
  "system-security-plan": {
    uuid: `system-security-plan-${commit}`,
    metadata: {
      title: `SSP fragment for ${repo}@${commit}`,
      "last-modified": now,
      version: "0.1.0",
      "oscal-version": "1.1.2",
    },
    "import-profile": {
      href: "https://raw.githubusercontent.com/usnistgov/oscal-content/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_MODERATE-baseline_profile.json",
    },
    "system-characteristics": {
      "system-ids": [{ id: repo, "identifier-type": "https://ietf.org/rfc/rfc4122" }],
      "system-name": repo,
      description:
        "Todo application. CI/CD compliance pipeline emits OSCAL evidence each run.",
      "security-sensitivity-level": "moderate",
      "system-information": {
        "information-types": [
          { uuid: uuid(), title: "General application data", description: "Synthetic todo data." },
        ],
      },
      "security-impact-level": {
        "security-objective-confidentiality": "moderate",
        "security-objective-integrity": "moderate",
        "security-objective-availability": "low",
      },
      status: { state: "under-development" },
    },
  },
};

function write(name, data) {
  const p = path.join(outDir, name);
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + "\n");
  return p;
}

write("assessment-results.json", assessmentResults);
write("component-definition.json", componentDefinition);
write("ssp-fragment.json", sspFragment);

console.log(
  JSON.stringify({
    event: "oscal_generated",
    severity: "info",
    stage: "M-24-15",
    findings: findings.length,
    commit,
    run_id: runId,
    timestamp: now,
  }),
);
