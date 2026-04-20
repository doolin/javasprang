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