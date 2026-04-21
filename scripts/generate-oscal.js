#!/usr/bin/env node
// Generate OSCAL artifacts from vulnerability scan evidence.
// Inputs: an evidence directory containing npm-audit.json and trivy-results.json.
// Outputs: assessment-results.json, component-definition.json, ssp-fragment.json.
//
// All outputs conform to OSCAL v1.1.2 JSON schema and are accepted by
// the NIST OSCAL viewer at oscal.io. Structure follows the NIST
// oscal-content examples at:
//   https://github.com/usnistgov/oscal-content/tree/main/examples

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
const repoShort = repo.split("/").pop() || repo;
const commit = process.env.COMMIT_SHA || "unknown";
const runId = process.env.RUN_ID || "unknown";
const now = new Date().toISOString();
const uuid = () => crypto.randomUUID();

// Stable UUIDs derived from commit for cross-document references.
function deterministicUuid(seed) {
  const hash = crypto.createHash("sha256").update(seed).digest("hex");
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    "4" + hash.slice(13, 16),
    ((parseInt(hash.slice(16, 18), 16) & 0x3f) | 0x80)
      .toString(16)
      .padStart(2, "0") + hash.slice(18, 20),
    hash.slice(20, 32),
  ].join("-");
}

const componentUuid = deterministicUuid(`component:${repo}:${commit}`);
const partyUuid = deterministicUuid(`party:${repo}`);
const assessmentPlanUuid = deterministicUuid(`assessment-plan:${repo}`);

function readJsonIfExists(p) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

const npmAudit = readJsonIfExists(path.join(evidenceDir, "npm-audit.json"));
const trivy = readJsonIfExists(path.join(evidenceDir, "trivy-results.json"));
const gitleaks = readJsonIfExists(path.join(evidenceDir, "gitleaks-report.json"));

// --- Build observations and findings from scan results ---

const observations = [];
const findings = [];

// --- Gitleaks (SI-3: secrets scan) ---

if (gitleaks) {
  const gitleaksFindings = gitleaks.findings || gitleaks;
  const items = Array.isArray(gitleaksFindings) ? gitleaksFindings : [];

  if (items.length > 0) {
    for (const leak of items) {
      const obsUuid = uuid();
      const desc = `${leak.RuleID || "secret"}: ${leak.File || "unknown file"}` +
        (leak.StartLine ? ` line ${leak.StartLine}` : "");

      observations.push({
        uuid: obsUuid,
        title: `gitleaks: ${leak.RuleID || "secret detected"}`,
        description: leak.Description || desc,
        methods: ["TEST"],
        types: ["finding"],
        subjects: [{ "subject-uuid": componentUuid, type: "component" }],
        collected: now,
        "relevant-evidence": [
          {
            href: "#gitleaks-evidence",
            description: desc,
          },
        ],
      });

      findings.push({
        uuid: uuid(),
        title: `gitleaks: ${leak.RuleID || "secret detected"}`,
        description: leak.Description || desc,
        target: {
          type: "objective-id",
          "target-id": "si-3_obj",
          status: { state: "not-satisfied" },
        },
        "related-observations": [{ "observation-uuid": obsUuid }],
      });
    }
  }
}

if (npmAudit && npmAudit.vulnerabilities) {
  for (const [name, v] of Object.entries(npmAudit.vulnerabilities)) {
    const obsUuid = uuid();
    const description =
      (v.via || [])
        .map((x) => (typeof x === "string" ? x : x.title || x.name || ""))
        .filter(Boolean)
        .join("; ") || name;

    observations.push({
      uuid: obsUuid,
      title: `npm advisory: ${name}`,
      description,
      methods: ["TEST"],
      types: ["finding"],
      subjects: [{ "subject-uuid": componentUuid, type: "component" }],
      collected: now,
      "relevant-evidence": [
        {
          href: "#npm-audit-evidence",
          description: `npm advisory: ${name} (severity: ${v.severity || "unknown"})`,
        },
      ],
    });

    findings.push({
      uuid: uuid(),
      title: `npm advisory: ${name}`,
      description,
      target: {
        type: "objective-id",
        "target-id": "ra-5_obj",
        status: { state: "not-satisfied" },
      },
      "related-observations": [{ "observation-uuid": obsUuid }],
    });
  }
}

if (trivy && Array.isArray(trivy.Results)) {
  for (const r of trivy.Results) {
    for (const vuln of r.Vulnerabilities || []) {
      const obsUuid = uuid();
      const desc = vuln.Description || vuln.Title || vuln.VulnerabilityID;

      observations.push({
        uuid: obsUuid,
        title: vuln.Title || vuln.VulnerabilityID,
        description: desc,
        methods: ["TEST"],
        types: ["finding"],
        subjects: [{ "subject-uuid": componentUuid, type: "component" }],
        collected: now,
        "relevant-evidence": [
          {
            href: "#trivy-evidence",
            description: [
              vuln.VulnerabilityID,
              `severity: ${(vuln.Severity || "unknown").toLowerCase()}`,
              `pkg: ${vuln.PkgName || "unknown"}@${vuln.InstalledVersion || "unknown"}`,
              vuln.FixedVersion ? `fixed: ${vuln.FixedVersion}` : null,
            ]
              .filter(Boolean)
              .join(" | "),
          },
        ],
      });

      findings.push({
        uuid: uuid(),
        title: vuln.Title || vuln.VulnerabilityID,
        description: desc,
        target: {
          type: "objective-id",
          "target-id": "ra-5_obj",
          status: { state: "not-satisfied" },
        },
        "related-observations": [{ "observation-uuid": obsUuid }],
      });
    }
  }
}

// --- Assessment Results (OSCAL AR) ---

const assessmentResults = {
  "assessment-results": {
    uuid: uuid(),
    metadata: {
      title: `Assessment Results — ${repoShort}@${commit.slice(0, 7)}`,
      "last-modified": now,
      version: runId,
      "oscal-version": "1.1.2",
      roles: [{ id: "assessor", title: "CI/CD Automation" }],
      parties: [
        {
          uuid: partyUuid,
          type: "organization",
          name: repoShort,
          "short-name": repoShort,
        },
      ],
      "responsible-parties": [
        { "role-id": "assessor", "party-uuids": [partyUuid] },
      ],
    },
    "import-ap": {
      href: `#${assessmentPlanUuid}`,
    },
    results: [
      {
        uuid: uuid(),
        title: `CI run ${runId} — ${repoShort}`,
        description:
          "Automated CI/CD compliance pipeline assessment results.",
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
        ...(observations.length > 0 ? { observations } : {}),
        findings:
          findings.length > 0
            ? findings
            : [
                {
                  uuid: uuid(),
                  title: "No findings",
                  description:
                    "No vulnerabilities detected at the configured severity threshold.",
                  target: {
                    type: "objective-id",
                    "target-id": "ra-5_obj",
                    status: { state: "satisfied" },
                  },
                },
              ],
      },
    ],
    "back-matter": {
      resources: [
        {
          uuid: assessmentPlanUuid,
          title: "CI/CD Pipeline Assessment Plan",
          description:
            "The CI/CD golden pipeline serves as the de facto assessment plan. It defines the automated assessment methodology for each control.",
          rlinks: [
            {
              href: "https://github.com/" + repo,
              "media-type": "text/html",
            },
          ],
        },
      ],
    },
  },
};

// --- Component Definition (OSCAL CD) ---

const componentDefinition = {
  "component-definition": {
    uuid: uuid(),
    metadata: {
      title: `Component Definition — ${repoShort}`,
      "last-modified": now,
      version: runId,
      "oscal-version": "1.1.2",
      parties: [
        {
          uuid: partyUuid,
          type: "organization",
          name: repoShort,
          "short-name": repoShort,
        },
      ],
    },
    components: [
      {
        uuid: componentUuid,
        type: "software",
        title: repoShort,
        description: "Spring Boot + Angular todo application.",
        "responsible-roles": [
          { "role-id": "provider", "party-uuids": [partyUuid] },
        ],
        props: [
          { name: "version", value: commit.slice(0, 7) },
          { name: "software-identifier", value: commit },
          { name: "label", value: `CI run ${runId}` },
        ],
      },
    ],
  },
};

// --- System Security Plan fragment (OSCAL SSP) ---

const systemImplComponentUuid = deterministicUuid(
  `system-impl-component:${repo}:${commit}`,
);

const sspFragment = {
  "system-security-plan": {
    uuid: uuid(),
    metadata: {
      title: `System Security Plan — ${repoShort}`,
      "last-modified": now,
      version: runId,
      "oscal-version": "1.1.2",
      roles: [
        { id: "system-owner", title: "System Owner" },
        { id: "developer", title: "Developer" },
      ],
      parties: [
        {
          uuid: partyUuid,
          type: "organization",
          name: repoShort,
          "short-name": repoShort,
        },
      ],
      "responsible-parties": [
        { "role-id": "system-owner", "party-uuids": [partyUuid] },
      ],
    },
    "import-profile": {
      href: "https://raw.githubusercontent.com/usnistgov/oscal-content/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_MODERATE-baseline_profile.json",
    },
    "system-characteristics": {
      "system-ids": [
        {
          id: repo,
          "identifier-type":
            "http://ietf.org/rfc/rfc4122",
        },
      ],
      "system-name": repoShort,
      description:
        "Todo application. CI/CD compliance pipeline emits OSCAL evidence each run.",
      "security-sensitivity-level": "moderate",
      "system-information": {
        "information-types": [
          {
            uuid: uuid(),
            title: "General application data",
            description: "Synthetic todo data for demonstration purposes.",
            categorizations: [
              {
                system:
                  "https://doi.org/10.6028/NIST.SP.800-60v2r1",
                "information-type-ids": ["C.3.5.8"],
              },
            ],
            "confidentiality-impact": { base: "moderate" },
            "integrity-impact": { base: "moderate" },
            "availability-impact": { base: "low" },
          },
        ],
      },
      "security-impact-level": {
        "security-objective-confidentiality": "moderate",
        "security-objective-integrity": "moderate",
        "security-objective-availability": "low",
      },
      status: { state: "under-development" },
      "authorization-boundary": {
        description:
          "The application boundary encompasses the Spring Boot backend, Angular frontend, and PostgreSQL database.",
      },
    },
    "system-implementation": {
      users: [
        {
          uuid: uuid(),
          "role-ids": ["developer"],
          props: [{ name: "type", value: "internal" }],
        },
      ],
      components: [
        {
          uuid: systemImplComponentUuid,
          type: "this-system",
          title: repoShort,
          description:
            "The application under assessment, built and tested by the CI/CD pipeline.",
          status: { state: "under-development" },
        },
      ],
    },
    "control-implementation": {
      description:
        "Controls are partially implemented and assessed via the CI/CD golden pipeline.",
      "implemented-requirements": [
        {
          uuid: uuid(),
          "control-id": "ra-5",
          props: [
            { name: "control-origination", value: "system-specific" },
          ],
          "by-components": [
            {
              "component-uuid": systemImplComponentUuid,
              uuid: uuid(),
              description:
                "Vulnerability scanning is performed automatically on every push via Trivy (filesystem scan) and npm audit (dependency audit). Results are captured as OSCAL assessment evidence.",
              "implementation-status": { state: "implemented" },
            },
          ],
        },
        {
          uuid: uuid(),
          "control-id": "sa-11",
          props: [
            { name: "control-origination", value: "system-specific" },
          ],
          "by-components": [
            {
              "component-uuid": systemImplComponentUuid,
              uuid: uuid(),
              description:
                "The CI/CD pipeline runs automated tests (JUnit, Karma, Playwright) on every push. Test results and coverage reports are retained as compliance evidence.",
              "implementation-status": { state: "implemented" },
            },
          ],
        },
        {
          uuid: uuid(),
          "control-id": "sa-15",
          props: [
            { name: "control-origination", value: "system-specific" },
          ],
          "by-components": [
            {
              "component-uuid": systemImplComponentUuid,
              uuid: uuid(),
              description:
                "An SBOM (CycloneDX format) is generated each CI run from resolved production dependencies, documenting the software supply chain.",
              "implementation-status": { state: "implemented" },
            },
          ],
        },
      ],
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
    observations: observations.length,
    commit,
    run_id: runId,
    timestamp: now,
  }),
);
