# Todo Application

A Spring Boot application for managing todo items with user authentication.

## Project Structure

- `src/main/java/com/todoapp/` - Main application code
- `src/test/java/com/todoapp/` - Test code
- `src/main/resources/` - Application properties and resources

## Building and Running

```bash
# Build the application
./mvnw clean package

# Run the application
./mvnw spring-boot:run
```

After signing in, the root route (`/`) shows a Kanban board with three columns:

- `To Do`
- `In Progress`
- `Done`

Cards can be created, moved between columns, and deleted.

## Local Database (Docker, Port 55432)

The application datasource is configured for PostgreSQL on `localhost:55432`.

```bash
# Build and start the project Postgres container
docker compose -f docker/postgres/compose.yaml up -d --build

# Verify container status
docker compose -f docker/postgres/compose.yaml ps
```

To stop it:

```bash
docker compose -f docker/postgres/compose.yaml down
```

## Synthetic Seed Data

Use the provisioning script to insert synthetic users and todos:

```bash
./scripts/provision_synthetic_data.sh
```

Reset synthetic rows and re-seed:

```bash
./scripts/provision_synthetic_data.sh --reset
```

The provisioning now uses PostgreSQL `MERGE` statements for idempotent upserts
instead of insert-if-missing stopgaps.

Note: this is still an interim approach. A proper migration/seed strategy (for
example Flyway/Liquibase with versioned data fixtures) should replace this in a
future hardening pass.

Default seed users (password: `password123`):

- `synth_alice`
- `synth_bob`
- `synth_carol`

## Testing

```bash
# Run tests
./mvnw test
```

## Current Findings (March 2026)

Recent verification runs found two important test-suite issues:

1. Backend tests are not fully hermetic.
- Running `./mvnw test` currently fails in JPA tests when a local PostgreSQL database named `todoapp` is unavailable.
- Several tests expect H2 test behavior but are resolving to the PostgreSQL datasource at runtime.

2. Frontend auth service tests are out of sync with implementation.
- `AuthService` calls `/api/v1/auth/...` endpoints.
- `auth.service.spec.ts` expects `/api/auth/...`, causing request matcher failures and cascading async test errors.

These findings indicate that the repository builds, but does not currently provide reliable out-of-the-box green tests.

## Stabilization Plan

### Phase 1: Restore deterministic tests

Goal: Make `./mvnw test` and frontend unit tests pass on a clean machine without local PostgreSQL requirements.

1. Backend profile and datasource alignment.
- Ensure test execution always activates a test profile (`test`) or explicit datasource override.
- Confirm `@DataJpaTest` classes bind to H2/test configuration consistently.
- Remove or scope any properties that force external DB usage during tests.

2. Frontend auth test alignment.
- Update auth service test URL expectations to `/api/v1/auth/login` and `/api/v1/auth/register`.
- Adjust observable assertions to account for initial `BehaviorSubject` emission (`null`) before success emission.

Acceptance criteria:
- `./mvnw test` exits successfully.
- `npm test -- --watch=false --browsers=ChromeHeadless` exits successfully from `src/main/frontend`.

### Phase 2: Guardrails against regressions

Goal: Prevent endpoint and config drift from silently breaking CI.

1. Introduce shared constants for API base path in frontend service/tests.
2. Add a simple CI job that runs backend and frontend tests on every PR.
3. Keep generated artifacts and local outputs out of commits (already mostly addressed via `.gitignore`).

Acceptance criteria:
- PR checks fail fast on backend or frontend test regressions.
- Endpoint path changes require updates in one place.

### Phase 3: Security and configuration hardening

Goal: Improve production readiness after test stability is restored.

1. Replace development JWT secret defaults with environment-based configuration.
2. Review dual Spring Security filter chains and simplify matchers where possible.
3. Add/update docs for required runtime env vars and local setup.

Acceptance criteria:
- No hardcoded sensitive defaults in production configuration.
- Security rules are documented and easier to reason about.

## Suggested Local Verification Workflow

```bash
# backend
./mvnw test

# frontend
cd src/main/frontend
npm test -- --watch=false --browsers=ChromeHeadless

# frontend coverage
npm run test:coverage

# frontend e2e coverage + combined summary
npm run test:coverage:all
```

Combined coverage outputs are written to:

- `src/main/frontend/coverage/combined/summary.json`
- `src/main/frontend/coverage/combined/summary.md`

## Compliance Evidence and Control Mapping

The CI/CD golden pipeline produces a structured evidence bundle on
every push. Each artifact maps to one or more NIST SP 800-53 Rev. 5
controls and NIST SP 800-218 (SSDF) practices. The normative
reference is the `cicd-golden-pipeline` skill in `doolin/dave-skills`.

Detailed assessment methodology and a per-run checklist are in
[docs/compliance/README.md](docs/compliance/README.md).

### Artifact-to-control table

| Artifact | What it evidences | 800-53 | SSDF | ASD STIG | OMB |
| --- | --- | --- | --- | --- | --- |
| `assessment-results.json` | OSCAL assessment with findings from npm audit, Trivy, gitleaks | RA-5, SA-11, SA-15, SI-2, SI-3 | PO.4.1, PO.4.2, RV.1.2, RV.2.1 | V-222644, V-222646, V-222648, V-222650, V-222652, V-222614 | M-24-15 (OSCAL-based authorization artifacts) |
| `ssp-fragment.json` | How CI/CD implements selected controls | RA-5, SA-11, SA-15 | PO.3.3, PO.4.2, PW.8.1, RV.1.2, PS.3.1 | V-222632, V-222644, V-222646, V-222649, V-222645 | M-24-15 (machine-readable, interoperable formats) |
| `component-definition.json` | Software identity, version, commit binding | CM-8, SA-10, SR-4 | PS.1.1, PS.3.1 | V-222632, V-222645 | M-26-05 (complete inventory), M-24-15 |
| `gitleaks-report.json` | Secrets scan with metadata envelope | SI-3, SA-11 | PW.6, PW.7.2 | V-222648, V-222650 | M-26-05 (risk-based assurance) |
| `npm-audit.json` | Dependency vulnerability audit (npm) | RA-5, SI-2 | RV.1.1, RV.1.2, RV.2.1 | V-222614, V-222648, V-222650, V-222652 | M-21-31 (vuln scan logs even when clean), M-26-05 |
| `trivy-results.json` | Filesystem vulnerability scan (Trivy) | RA-5, SI-2 | RV.1.1, RV.1.2, RV.2.1 | V-222614, V-222648, V-222650, V-222652 | M-21-31 (vuln scan logs even when clean), M-26-05 |
| `sbom.cyclonedx.json` | CycloneDX SBOM (Syft) | SA-15, CM-8, SR-4 | PS.3.1, RV.1.1, PO.3.3 | V-222632, V-222645, V-222652 | M-26-05 (agencies may request current SBOM) |
| Surefire XML + JaCoCo | Backend test results and coverage | SA-11 | PW.8.1, PO.4.1, PO.4.2 | V-222644, V-222646, V-222649 | |
| Frontend coverage | Karma/Istanbul unit test coverage | SA-11 | PW.8.1, PO.4.1, PO.4.2 | V-222644, V-222646, V-222649 | |
| Playwright reports | E2E test results, traces, screenshots | SA-11 | PW.8.1 | V-222644, V-222646 | |
| `evidence-manifest.json` | SHA-256 checksums, drift detection | AU-12, CM-3, SI-7, SA-15 | PO.3.3, PO.4.2, PS.3.1 | V-222501, V-222507, V-222645 | M-21-31 (log integrity, validation) |
| `audit-event-*.json` | Structured per-stage audit trail | AU-2, AU-12 | PO.3.3, PO.5.1 | V-222480, V-222487, V-222501, V-222507 | M-21-31 (structured log format, retention, centralized access) |
| `attestation.pdf` | Provenance, Solana anchor, RFC 3161 timestamp | SI-7, IA-7, SR-4, SC-12 | PS.2.1, PS.3.1 | V-222513, V-222570, V-222571, V-222645 | M-26-05 (attestation form resources) |
| `attestation.json` | Machine-readable attestation companion | SI-7, SR-4 | PS.2.1, PS.3.1 | V-222507, V-222645 | M-24-15 (machine-readable, reusable artifacts) |
| `ci-artifacts.zip` | Packaged evidence bundle | SI-7, SR-4, AU-9 | PS.3.1, PO.3.3 | V-222507, V-222645 | |
| `timestamp.tsr` + `tsa-certchain.pem` | RFC 3161 trusted timestamp | SI-7, SC-12 | PS.2.1 | V-222513, V-222570 | |
| Pipeline definition archive | Workflow YAML preserved in manifest | CM-3, SA-15 | PO.3.3, PO.4.2 | V-222632, V-222633 | |
| S3 archival + `s3-receipt.json` | Durable evidence storage with receipt | AU-9, SI-7 | PS.3.1, PO.3.3 | V-222507, V-222645 | M-21-31 (log retention, preservation) |

**OMB memoranda context:** M-26-05 (Jan 2026) rescinded M-22-18 and
M-23-16, shifting to risk-based software assurance. Agencies may
still request SBOMs and use attestation resources developed under
M-22-18. M-24-15 (Jul 2024) requires OSCAL-based, machine-readable
authorization artifacts for FedRAMP. M-21-31 (Aug 2021) requires
structured logging, log retention, and vulnerability scan evidence
even when no findings are present.

## Validating OSCAL Artifacts

The CI pipeline generates three OSCAL documents per run. To validate
them locally against the NIST schema, install `oscal-cli`:

```bash
mkdir -p ~/opt/oscal-cli && cd ~/opt/oscal-cli
curl -sLO https://repo1.maven.org/maven2/gov/nist/secauto/oscal/tools/oscal-cli/cli-core/1.0.3/cli-core-1.0.3-oscal-cli.zip
unzip cli-core-1.0.3-oscal-cli.zip
export PATH=$PATH:~/opt/oscal-cli/bin
```

Generate test artifacts and validate:

```bash
mkdir -p /tmp/oscal-evidence /tmp/oscal-out
echo '{"Results":[]}' > /tmp/oscal-evidence/trivy-results.json
echo '{"vulnerabilities":{}}' > /tmp/oscal-evidence/npm-audit.json

REPO=doolin/javasprang COMMIT_SHA=$(git rev-parse HEAD) RUN_ID=local \
  node scripts/generate-oscal.js /tmp/oscal-evidence /tmp/oscal-out

oscal-cli ar validate /tmp/oscal-out/assessment-results.json
oscal-cli component-definition validate /tmp/oscal-out/component-definition.json
oscal-cli ssp validate /tmp/oscal-out/ssp-fragment.json
```

All three should report "is valid."

## RFC 3161 Trusted Timestamps (Sigstore TSA)

The CI attestation pipeline timestamps the SHA-256 hash of the
`ci-artifacts.zip` evidence bundle using [Sigstore's RFC 3161
Timestamp Authority](https://github.com/sigstore/timestamp-authority).
This runs automatically in both GitHub Actions and GitLab CI alongside
the Solana on-chain attestation.

Dual-chain approach:

- **Solana** — decentralized, tamper-evident anchor
- **RFC 3161 (Sigstore)** — legally admissible trusted timestamp
  (EO 14028, M-22-18, M-24-15)

Both attest the same `sha256:<hash>` of the CI evidence archive.

### Artifacts produced

Each attestation run outputs:

| File | Description |
|------|-------------|
| `timestamp.tsr` | DER-encoded RFC 3161 timestamp response |
| `tsa-certchain.pem` | Sigstore TSA certificate chain for verification |
| `attestation.pdf` | Report including TSA details and verification command |

### Verifying a timestamp locally

```bash
openssl ts -verify \
  -in ci-output/timestamp.tsr \
  -data ci-output/ci-artifacts.zip \
  -CAfile ci-output/tsa-certchain.pem
```

Should print `Verification: OK`.

### Inspecting the timestamp token

```bash
openssl ts -reply -in ci-output/timestamp.tsr -text
```

### Running attestation locally

```bash
cd scripts && npm ci && cd ..
mkdir -p /tmp/attest-test
echo "test" > /tmp/attest-test/dummy.txt

ARTIFACT_DIR=/tmp/attest-test OUTPUT_DIR=/tmp/attest-output \
  node scripts/attest.mjs
```

The TSA timestamp is requested automatically. To use an alternate
TSA server, set `TSA_URL`:

```bash
TSA_URL=https://freetsa.org/tsr \
  ARTIFACT_DIR=/tmp/attest-test OUTPUT_DIR=/tmp/attest-output \
  node scripts/attest.mjs
```

### CI configuration

No additional secrets or variables are required. The Sigstore TSA is
a free, unauthenticated public service. The `TSA_URL` environment
variable can be set in CI to override the default
(`https://timestamp.sigstore.dev/api/v1/timestamp`).

TSA failures are non-fatal: the pipeline completes and the PDF
report notes the failure reason.

## Handling Large Files

This repository is configured to prevent large files from being committed. The following files and directories are ignored:

- `target/` - Build output directory
- `*.exec` - JaCoCo execution data files
- `target/site/jacoco/` - JaCoCo reports
- `target/surefire-reports/` - Test reports

### If you need to add a large file

1. Add the file pattern to `.gitignore`
2. Remove the file from git tracking with `git rm --cached <file>`
3. Commit the changes

### Pre-commit Hook

A pre-commit hook is installed to prevent files larger than 1MB from being committed. If you need to commit a large file:

1. Temporarily disable the hook: `git commit --no-verify -m "Your message"`
2. Or modify the hook to allow your specific file

## License

This project is licensed under the MIT License - see the LICENSE file for details. 