# Compliance Evidence Assessment

This directory contains OSCAL JSON schemas and a snapshot of CI/CD
evidence artifacts used to assess the javasprang golden pipeline
against NIST SP 800-53 Rev. 5, NIST SP 800-218 (SSDF), and DISA
ASD STIG controls.

## How we assess

The CI/CD golden pipeline (`.github/workflows/golden-pipeline.yml`)
runs on every push and produces a structured evidence bundle. The
normative reference for what the pipeline should emit is the
`cicd-golden-pipeline` skill in `doolin/dave-skills`.

Each CI run generates:

1. **Security scan evidence** -- gitleaks (secrets), npm audit
   (dependency vulnerabilities), Trivy (filesystem vulnerabilities)
2. **Test evidence** -- JUnit/Surefire XML reports, JaCoCo coverage
   (XML, CSV, HTML), Karma frontend coverage
3. **Supply chain inventory** -- CycloneDX SBOM via Syft
4. **OSCAL compliance documents** -- assessment-results.json,
   component-definition.json, ssp-fragment.json (all OSCAL v1.1.2)
5. **Evidence manifest** -- SHA-256 checksums for every artifact,
   commit, run ID, and drift detection for expected artifacts
6. **Structured audit events** -- one JSON event per pipeline stage
   with event type, status, timestamp, commit, and run ID
7. **Attestation** -- PDF with provenance summary, Solana blockchain
   anchor, RFC 3161 trusted timestamp, and a machine-readable
   attestation.json companion
8. **Archival** -- all artifacts uploaded to S3 with date/commit
   prefix; s3-receipt.json records the upload

## Assessment checklist

After downloading a fresh artifact bundle from S3, work through
each section in order. A failing check means the pipeline has
regressed and needs investigation before the bundle can be
treated as valid compliance evidence.

### Bundle integrity

- [ ] `evidence-manifest.json` has `missing: []` (no expected
      files absent)
- [ ] `evidence-manifest.json` has `missingDirs: []` (no expected
      directories absent)
- [ ] Manifest commit SHA matches the S3 prefix commit
- [ ] Recompute SHA-256 of `ci-artifacts.zip` and compare against
      the checksum in `attestation.pdf`

### OSCAL document validation

- [ ] `assessment-results.json` validates against
      `oscal_assessment-results_schema.json`
- [ ] `component-definition.json` validates against
      `oscal_component_schema.json`
- [ ] `ssp-fragment.json` validates against
      `oscal_ssp_schema.json`
- [ ] All three documents report `oscal-version: 1.1.2`
- [ ] `assessment-results.json` reviewed-controls includes
      `sa-11`, `sa-15`, `si-2`, `si-3`, `ra-5`

### Scanner coverage in OSCAL

- [ ] npm audit findings (if any) appear as RA-5 observations
      in `assessment-results.json`
- [ ] Trivy findings (if any) appear as RA-5 observations
- [ ] Gitleaks findings (if any) appear as SI-3 observations
- [ ] When all scanners are clean, a single "No findings"
      finding with `state: satisfied` is present

### Security scan evidence

- [ ] `gitleaks-report.json` has metadata envelope (generator,
      version, timestamp, commit, ref, scan_scope, status)
- [ ] `npm-audit.json` is present and well-formed
- [ ] `trivy-results.json` is present with scan targets listed

### Test evidence

- [ ] Surefire XML reports present (one per test class)
- [ ] Surefire text summaries present
- [ ] JaCoCo coverage present (`jacoco.xml`, `jacoco.csv`)
- [ ] Frontend coverage present (`index.html` from Karma/Istanbul)

### Supply chain

- [ ] `sbom.cyclonedx.json` is CycloneDX format with components
      and dependency links
- [ ] SBOM `specVersion` is 1.5 or later
- [ ] SBOM lists generating tool (Syft) and timestamp

### Audit trail

- [ ] One `audit-event-*.json` file per pipeline stage:
      secrets-scan, test, e2e, vulnerability-scan, sbom, oscal,
      verify-evidence
- [ ] Each event has `event`, `status`, `run_id`, `commit`,
      `timestamp`
- [ ] All events share the same `run_id` and `commit`

### Attestation and provenance

- [ ] `attestation.pdf` present with commit, branch, CI run URL
- [ ] Solana transaction signature present (devnet or mainnet)
- [ ] RFC 3161 timestamp: `timestamp.tsr` and `tsa-certchain.pem`
      present
- [ ] `attestation.json` present (machine-readable companion)

### Archival

- [ ] Artifacts reachable at the expected S3 prefix
- [ ] S3 prefix follows `<root>/<YYYY/MM/DD>/<HHMMSS>-<commit>`
      convention

### Pipeline definition

- [ ] `golden-pipeline.yml` and `ci-cd.yml` are archived in the
      evidence directory (visible in manifest as
      `pipeline-definition/` entries)

## Schemas

The OSCAL JSON schemas in this directory are used for local
validation of the three OSCAL documents:

- `oscal_assessment-results_schema.json` -- validates assessment-results.json
- `oscal_component_schema.json` -- validates component-definition.json
- `oscal_ssp_schema.json` -- validates ssp-fragment.json

These are downloaded from the NIST OSCAL v1.1.2 release and are
not project source. They can be refreshed from:
https://github.com/usnistgov/OSCAL/releases/tag/v1.1.2

## Artifacts

The `artifacts/` subdirectory contains a snapshot of evidence from
CI run 24726733757 (commit ee4757c, 2026-04-21), downloaded from
S3 at `s3://inventium-artifacts/javasprang/ci/2026/04/21/140449-ee4757c/`.

This snapshot is used for offline review and gap analysis against
the golden pipeline skill.
