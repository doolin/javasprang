---
marp: true
theme: default
title: CI/CD Golden Pipeline Walkthrough
paginate: true
---
# CI/CD Golden Pipeline Walkthrough


This walkthrough explains the CI/CD golden pipeline for javasprang, a Spring Boot + Angular todo application. The pipeline implements NIST SSDF, EO 14028, and OMB M-24-15 compliance across both GitHub Actions and GitLab CI. We'll trace the flow from a push event through compliance checks, artifact packaging, and Solana on-chain attestation.

---

## Pipeline Architecture

The pipeline has three phases: **check** (every push/PR), **package** (main only), and **attest** (main only). The GitHub Actions version uses a reusable workflow; the GitLab version uses `include: local:`. Both share the same compliance scripts.

---

## 1. The Caller Workflow (GitHub Actions)

The per-repo `ci-cd.yml` calls the reusable golden pipeline and adds repo-specific jobs:

```bash
sed -n '1,38p' .github/workflows/ci-cd.yml
```

```output
name: CI/CD

# Per-repo caller for the reusable Golden Pipeline.
# Package + SLSA provenance on main push; Solana attestation + S3
# evidence archival on main push.

env:
  FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true

on:
  push:
  pull_request:
    branches: [main]

permissions:
  contents: read
  id-token: write
  attestations: write
  security-events: write

jobs:
  compliance:
    name: Golden Pipeline
    uses: ./.github/workflows/golden-pipeline.yml
    with:
      java-version: "17"
      node-version: "20.11.1"
      # Initial baseline: gate the build on CRITICAL only. HIGH findings are
      # still captured as evidence (Trivy JSON step) but not failing yet —
      # remediation tracked separately. Raise back to "CRITICAL,HIGH" once
      # the baseline is clean.
      trivy-severity: "CRITICAL"
    permissions:
      contents: read
      id-token: write
      attestations: write
      security-events: write
    secrets: inherit
```

The caller passes repo-specific inputs (Java 17, Node 20, CRITICAL-only Trivy gate) and inherits secrets. The `compliance` job is the gate — nothing downstream runs if it fails.

---

## 2. The Golden Pipeline (Reusable Workflow)

Six jobs run inside the golden pipeline. The first three run in parallel:

```bash
grep -n 'name:' .github/workflows/golden-pipeline.yml | head -20
```

```output
1:name: Golden Pipeline
44:    name: Secrets Scan (PW.6)
47:      - name: Checkout (full history)
52:      - name: Run gitleaks
57:      - name: Emit audit event
63:    name: Test (backend + frontend)
78:      - name: Set up Java ${{ inputs.java-version }}
85:      - name: Set up Node ${{ inputs.node-version }}
92:      - name: Maven verify (backend tests + frontend build + JaCoCo)
95:      - name: Install frontend deps
99:      - name: Frontend unit tests
103:      - name: Surefire failure summary
123:      - name: Upload surefire reports
127:          name: surefire-reports
132:      - name: Upload JaCoCo report
136:          name: jacoco-report
141:      - name: Upload frontend coverage
145:          name: frontend-coverage
150:      - name: Emit audit event
156:    name: E2E (desktop + mobile viewports)
```

### 2a. Secrets Scan (PW.6)

Runs gitleaks with full history (`fetch-depth: 0`) to catch secrets committed and later removed. Maps to NIST SSDF practice PW.6.

```bash
sed -n '43,61p' .github/workflows/golden-pipeline.yml
```

```output
  secrets-scan:
    name: Secrets Scan (PW.6)
    runs-on: ubuntu-latest
    steps:
      - name: Checkout (full history)
        uses: actions/checkout@08c6903cd8c0fde910a37f88322edcfb5dd907a8 # v5.0.0
        with:
          fetch-depth: 0

      - name: Run gitleaks
        uses: gitleaks/gitleaks-action@ff98106e4c7b2bc287b24eaf42907196329070c7 # v2.3.9
        env:
          GITHUB_TOKEN: ${{ github.token }}

      - name: Emit audit event
        if: always()
        run: |
          echo '{"event":"secrets_scan","severity":"info","stage":"PW.6","status":"'"${{ job.status }}"'","run_id":"'"${{ github.run_id }}"'","commit":"'"${{ github.sha }}"'","timestamp":"'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'"}'

```

Note: all actions are pinned to full 40-character SHAs, not tags. Tags can be force-pushed; SHAs cannot. Every job emits a structured JSON audit event (M-21-31 logging requirement).

### 2b. Test (backend + frontend)

Runs Maven verify (Spring Boot tests + JaCoCo coverage + Angular production build via frontend-maven-plugin) then Angular unit tests with Karma/ChromeHeadless. Uses the `test` Spring profile for hermetic H2 tests — no database container needed.

```bash
sed -n '63,101p' .github/workflows/golden-pipeline.yml
```

```output
    name: Test (backend + frontend)
    runs-on: ubuntu-latest

    env:
      # Hermetic tests via the project's existing `test` profile —
      # application-test.properties configures in-memory H2. Env vars must
      # NOT set SPRING_DATASOURCE_* here: those have higher property
      # precedence than profile-loaded files and would override H2 back to
      # Postgres. Postgres service container was removed for the same
      # reason — it's not needed when tests run against H2.
      SPRING_PROFILES_ACTIVE: test

    steps:
      - uses: actions/checkout@08c6903cd8c0fde910a37f88322edcfb5dd907a8 # v5.0.0

      - name: Set up Java ${{ inputs.java-version }}
        uses: actions/setup-java@be666c2fcd27ec809703dec50e508c2fdc7f6654 # v5.2.0
        with:
          java-version: ${{ inputs.java-version }}
          distribution: ${{ inputs.java-distribution }}
          cache: maven

      - name: Set up Node ${{ inputs.node-version }}
        uses: actions/setup-node@53b83947a5a98c8d113130e565377fae1a50d02f # v6.3.0
        with:
          node-version: ${{ inputs.node-version }}
          cache: npm
          cache-dependency-path: ${{ inputs.frontend-dir }}/package-lock.json

      - name: Maven verify (backend tests + frontend build + JaCoCo)
        run: ${{ inputs.maven-test-command }}

      - name: Install frontend deps
        working-directory: ${{ inputs.frontend-dir }}
        run: npm ci

      - name: Frontend unit tests
        working-directory: ${{ inputs.frontend-dir }}
        run: ${{ inputs.frontend-test-command }}
```

Key pitfall documented in the skill: env vars override Spring profile-loaded properties. Setting `SPRING_DATASOURCE_URL` alongside `SPRING_PROFILES_ACTIVE=test` would silently override the H2 datasource back to Postgres.

### 2c. Vulnerability Scan (PW.7 / PW.8)

Two scanners, both must pass: **npm audit** for frontend production deps, and **Trivy** filesystem scan for known CVEs across the whole tree. The Trivy scan runs twice — once for JSON evidence (non-gating), once for the human-readable table (gating). A PR summary step surfaces findings in the checks UI so mobile reviewers see actionable details, not just a red X.

```bash
grep -n 'Trivy\|npm audit\|trivy-severity\|exit-code\|trivyignore' .github/workflows/golden-pipeline.yml
```

```output
31:      trivy-severity:
242:      - name: npm audit (production deps, frontend)
246:          npm audit --audit-level=${{ inputs.npm-audit-level }} --omit=dev --json > npm-audit.json
247:          npm audit --audit-level=${{ inputs.npm-audit-level }} --omit=dev
249:      - name: Upload npm audit evidence
261:      - name: Trivy filesystem scan (JSON evidence)
268:          severity: ${{ inputs.trivy-severity }}
269:          exit-code: "0"
271:          trivyignores: .trivyignore
273:      - name: Summarize Trivy findings in PR
277:            echo "## Trivy findings (severity: ${{ inputs.trivy-severity }}, fixed-only)"
289:      - name: Trivy filesystem scan (human-readable gate)
295:          severity: ${{ inputs.trivy-severity }}
296:          exit-code: "1"
298:          trivyignores: .trivyignore
300:      - name: Upload Trivy evidence
```

The JSON evidence scan uses `exit-code: 0` (always succeeds, captures evidence). The table scan uses `exit-code: 1` (fails the job if findings exist). Both use the same `.trivyignore` file — inconsistent ignore lists would cause the two scans to disagree.

### 2d. SBOM Generation (PW.4)

Generates a CycloneDX SBOM after test passes. Resolves Maven runtime dependencies and frontend production deps before running syft so the SBOM reflects what's deployed, not what's used for development.

```bash
sed -n '313,357p' .github/workflows/golden-pipeline.yml
```

```output

  sbom:
    name: SBOM (PW.4)
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@08c6903cd8c0fde910a37f88322edcfb5dd907a8 # v5.0.0

      - name: Set up Java ${{ inputs.java-version }}
        uses: actions/setup-java@be666c2fcd27ec809703dec50e508c2fdc7f6654 # v5.2.0
        with:
          java-version: ${{ inputs.java-version }}
          distribution: ${{ inputs.java-distribution }}
          cache: maven

      - name: Resolve Maven production dependencies
        run: ./mvnw -B -ntp dependency:resolve -DincludeScope=runtime

      - name: Set up Node (production-only install for frontend SBOM)
        uses: actions/setup-node@53b83947a5a98c8d113130e565377fae1a50d02f # v6.3.0
        with:
          node-version: ${{ inputs.node-version }}

      - name: Install frontend production deps only
        working-directory: ${{ inputs.frontend-dir }}
        run: npm ci --omit=dev

      - name: Generate CycloneDX SBOM (syft, repo root)
        uses: anchore/sbom-action@e22c389904149dbc22b58101806040fa8d37a610 # v0.24.0
        with:
          path: .
          format: cyclonedx-json
          output-file: sbom.cyclonedx.json
          upload-artifact: false

      - name: Upload SBOM evidence
        uses: actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a # v7.0.1
        with:
          name: sbom
          path: sbom.cyclonedx.json
          retention-days: ${{ inputs.evidence-retention-days }}
          if-no-files-found: error

      - name: Emit audit event
        if: always()
```

### 2e. OSCAL Generation (M-24-15)

Consumes vulnerability scan results and generates three OSCAL documents: assessment results, component definition, and SSP fragment. These are the machine-readable compliance artifacts that OMB M-24-15 specifically requires.

```bash
sed -n '362,396p' .github/workflows/golden-pipeline.yml
```

```output
    name: OSCAL (M-24-15)
    runs-on: ubuntu-latest
    needs: vulnerability-scan
    steps:
      - uses: actions/checkout@08c6903cd8c0fde910a37f88322edcfb5dd907a8 # v5.0.0

      - name: Set up Node
        uses: actions/setup-node@53b83947a5a98c8d113130e565377fae1a50d02f # v6.3.0
        with:
          node-version: ${{ inputs.node-version }}

      - name: Download vulnerability scan evidence
        uses: actions/download-artifact@3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c # v8.0.1
        with:
          pattern: "{npm-audit,trivy-results}"
          merge-multiple: true
          path: evidence/

      - name: Generate OSCAL artifacts
        env:
          COMMIT_SHA: ${{ github.sha }}
          RUN_ID: ${{ github.run_id }}
          REPO: ${{ github.repository }}
        run: node scripts/generate-oscal.js evidence/ oscal/

      - name: Upload OSCAL evidence
        uses: actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a # v7.0.1
        with:
          name: oscal
          path: oscal/
          retention-days: ${{ inputs.evidence-retention-days }}
          if-no-files-found: error

      - name: Emit audit event
        if: always()
```

### 2f. Evidence Verification

The final compliance job downloads all artifacts (SBOM, scan results, OSCAL) and verifies completeness. Generates an evidence manifest with SHA-256 checksums. This is the drift detection step — if an upstream job silently stopped producing an artifact, this catches it.

```bash
grep -A2 'needs:' .github/workflows/golden-pipeline.yml | grep -B1 'vulnerability-scan\|sbom\|oscal' | head -10
```

```output
--
    needs: vulnerability-scan
--
--
    needs: [vulnerability-scan, sbom, oscal]
```

---

## 3. Package + SLSA Provenance (main only)

After all compliance jobs pass, the package job builds the jar, generates a SHA-256 checksum, and creates SLSA build provenance via `actions/attest-build-provenance`. Only runs on pushes to master.

```bash
sed -n '40,94p' .github/workflows/ci-cd.yml
```

```output
  package:
    name: Package + Provenance (main only)
    runs-on: ubuntu-latest
    needs: compliance
    if: github.ref == 'refs/heads/master' && github.event_name == 'push'
    permissions:
      contents: read
      id-token: write
      attestations: write
    steps:
      - uses: actions/checkout@08c6903cd8c0fde910a37f88322edcfb5dd907a8 # v5.0.0

      - name: Set up Java 17
        uses: actions/setup-java@be666c2fcd27ec809703dec50e508c2fdc7f6654 # v5.2.0
        with:
          java-version: "17"
          distribution: temurin
          cache: maven

      - name: Write version.json with commit SHA
        run: |
          mkdir -p src/main/resources/static
          printf '{"commit":"%s","run_id":"%s","built_at":"%s"}\n' \
            "${{ github.sha }}" "${{ github.run_id }}" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
            > src/main/resources/static/version.json

      - name: Maven package (skip tests — already ran in compliance)
        run: ./mvnw -B -ntp -DskipTests package

      - name: Identify built jar
        id: jar
        run: |
          jar_path=$(ls target/*.jar | grep -v '\-plain\.jar$' | head -n1)
          echo "path=$jar_path" >> "$GITHUB_OUTPUT"
          sha256sum "$jar_path" | tee "$jar_path.sha256"

      - name: Generate SLSA build provenance
        uses: actions/attest-build-provenance@a2bbfa25375fe432b6a289bc6b6cd05ecd0c4c32 # v4.1.0
        with:
          subject-path: ${{ steps.jar.outputs.path }}

      - name: Upload jar + checksum
        uses: actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a # v7.0.1
        with:
          name: app-jar
          path: |
            target/*.jar
            target/*.sha256
          retention-days: 90
          if-no-files-found: error

      - name: Emit deploy audit event
        if: always()
        run: |
          echo '{"event":"package","severity":"info","status":"'"${{ job.status }}"'","run_id":"'"${{ github.run_id }}"'","commit":"'"${{ github.sha }}"'","timestamp":"'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'"}'
```

---

## 4. Solana Attestation (main only)

The attest job downloads all CI artifacts, zips them, computes a SHA-256 hash, posts the hash as a JSON memo on Solana, generates a PDF attestation report, and uploads everything to S3. The memo payload includes a `provenance` field set to `github` or `gitlab` depending on which pipeline ran.

```bash
sed -n '96,167p' .github/workflows/ci-cd.yml
```

```output
  attest:
    name: Attest CI Artifacts
    runs-on: ubuntu-latest
    needs: [compliance]
    if: github.ref == 'refs/heads/master' && github.event_name == 'push'
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: actions/checkout@08c6903cd8c0fde910a37f88322edcfb5dd907a8 # v5.0.0

      - name: Set up Node 20
        uses: actions/setup-node@53b83947a5a98c8d113130e565377fae1a50d02f # v6.3.0
        with:
          node-version: "20"

      - name: Install attest script dependencies
        working-directory: scripts
        run: npm ci

      - name: Download all CI artifacts
        uses: actions/download-artifact@3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c # v8.0.1
        with:
          path: ci-artifacts
          merge-multiple: true

      - name: Write Solana keypair to temp file
        env:
          SOLANA_KEYPAIR: ${{ secrets.SOLANA_KEYPAIR }}
        run: |
          if [ -n "$SOLANA_KEYPAIR" ]; then
            KEYPAIR_FILE=$(mktemp)
            printf '%s' "$SOLANA_KEYPAIR" > "$KEYPAIR_FILE"
            chmod 600 "$KEYPAIR_FILE"
            echo "SOLANA_KEYPAIR_PATH=$KEYPAIR_FILE" >> "$GITHUB_ENV"
          fi

      - name: Configure AWS credentials (OIDC)
        if: vars.S3_COMPLIANCE_BUCKET != ''
        uses: aws-actions/configure-aws-credentials@ec61189d14ec14c8efccab744f656cffd0e33f37 # v6.1.0
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ vars.AWS_REGION || 'us-east-1' }}

      - name: Attest CI artifacts on Solana
        env:
          ARTIFACT_DIR: ci-artifacts
          OUTPUT_DIR: ci-output
          EVIDENCE_BUNDLE: ${{ vars.EVIDENCE_BUNDLE }}
          S3_COMPLIANCE_BUCKET: ${{ vars.S3_COMPLIANCE_BUCKET }}
          SOLANA_NETWORK: ${{ vars.SOLANA_NETWORK || 'devnet' }}
          AWS_REGION: ${{ vars.AWS_REGION || 'us-east-1' }}
        run: node scripts/attest.mjs

      - name: Upload attestation artifacts
        if: always()
        uses: actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a # v7.0.1
        with:
          name: attestation
          path: |
            ci-output/ci-artifacts.zip
            ci-output/attestation.pdf
          retention-days: 90

      - name: Cleanup keypair
        if: always()
        run: rm -f "$SOLANA_KEYPAIR_PATH"

      - name: Emit audit event
        if: always()
        run: |
          echo '{"event":"attest","severity":"info","status":"'"${{ job.status }}"'","run_id":"'"${{ github.run_id }}"'","commit":"'"${{ github.sha }}"'","timestamp":"'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'"}'
```

Key details: the keypair is written with `printf` (not `echo`) to avoid a trailing newline that corrupts the JSON array. The cleanup step runs under `if: always()` so the keypair is removed even on failure. AWS credentials use OIDC — no static access keys.

---

## 5. The Memo Payload

The Solana memo is a JSON object anchoring the CI run to the blockchain:

```bash
grep -A7 'submitSolanaMemo' scripts/attest.mjs | grep -A6 '{'
```

```output
async function submitSolanaMemo(payload, keypairPath, network) {
  const keypair = loadKeypair(keypairPath);
  const connection = new Connection(clusterApiUrl(network), "confirmed");
  const memoData = Buffer.from(JSON.stringify(payload), "utf-8");

  const instruction = new TransactionInstruction({
    programId: MEMO_PROGRAM_ID,
    keys: [{ pubkey: keypair.publicKey, isSigner: true, isWritable: true }],
--
      const sig = await submitSolanaMemo(
        {
          s3_key: s3Key,
          artifact_checksum: `sha256:${checksum}`,
          commit: commitSha,
          provenance,
          timestamp: evidence.completedAt,
        },
```

The memo is self-contained: anyone with S3 access can retrieve the exact artifact bundle from the on-chain record alone using the `s3_key`. The `provenance` field distinguishes GitHub from GitLab attestations. Uses Memo v2 (`MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr`) — Memo v1 no longer exists on devnet.

---

## 6. GitLab CI Mirror

The same pipeline runs on GitLab via `.gitlab-ci.yml` + `.gitlab/ci/golden-pipeline.yml`. Key adaptations documented in the golden pipeline skill:

```bash
head -21 .gitlab-ci.yml
```

```output
# GitLab CI — per-repo caller for the reusable Golden Pipeline.
# Mirrors .github/workflows/ci-cd.yml.
#
# Required GitLab setup:
#   - A GitLab project at gitlab.<your-host>/<group>/javasprang
#   - Shared runners enabled (gitlab.com) OR a self-hosted runner
#     with the `docker` executor
#   - (For SLSA provenance) Sigstore OIDC trust + $COSIGN_ENABLED=true
#     in the project's CI/CD variables
#   - (For evidence archival) $EVIDENCE_BUCKET + S3 credentials as
#     masked/protected CI variables
#
# Compared to the GitHub version, deploy / attest stages are NOT in
# here yet — same scope as the GitHub ci-cd.yml.

workflow:
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
    - if: '$CI_COMMIT_BRANCH && $CI_PIPELINE_SOURCE == "push"'

stages:
```

```bash
grep -n 'entrypoint\|CHROME_BIN\|after_script\|CI_PROVENANCE' .gitlab/ci/golden-pipeline.yml .gitlab-ci.yml 2>/dev/null
```

```output
.gitlab/ci/golden-pipeline.yml:29:    entrypoint: [""]
.gitlab/ci/golden-pipeline.yml:36:  after_script:
.gitlab/ci/golden-pipeline.yml:56:    CHROME_BIN: /usr/bin/google-chrome-stable
.gitlab/ci/golden-pipeline.yml:77:  after_script:
.gitlab/ci/golden-pipeline.yml:115:  after_script:
.gitlab/ci/golden-pipeline.yml:132:    entrypoint: [""]
.gitlab/ci/golden-pipeline.yml:156:  after_script:
.gitlab/ci/golden-pipeline.yml:190:  after_script:
.gitlab/ci/golden-pipeline.yml:221:  after_script:
.gitlab/ci/golden-pipeline.yml:256:  after_script:
.gitlab-ci.yml:93:  after_script:
.gitlab-ci.yml:125:    CI_PROVENANCE: gitlab
.gitlab-ci.yml:127:    # Fixed path so it persists across before_script/script/after_script.
.gitlab-ci.yml:149:  after_script:
```

Adaptations visible here:
- **`entrypoint: [""]`** on gitleaks and trivy images (their binary entrypoint conflicts with GitLab's shell execution)
- **`CHROME_BIN`** as a job variable (env vars don't persist across script steps in GitLab)
- **`after_script`** for all audit events (`$CI_JOB_STATUS` is only meaningful there)
- **`CI_PROVENANCE: gitlab`** on the attest job so the Solana memo distinguishes the source

---

## 7. Compliance Evidence Trail

Every pipeline run produces these artifacts with 90-day retention:

| Artifact | Stage | Format |
| --- | --- | --- |
| gitleaks-report.json | Secrets Scan | JSON |
| surefire-reports/ | Test | XML (JUnit) |
| jacoco/ | Test | HTML + XML |
| npm-audit.json | Vulnerability Scan | JSON |
| trivy-results.json | Vulnerability Scan | JSON |
| sbom.cyclonedx.json | SBOM | CycloneDX JSON |
| oscal/ | OSCAL | NIST OSCAL JSON |
| evidence-manifest.json | Verify Evidence | SHA-256 manifest |
| app-jar + .sha256 | Package | JAR + checksum |
| ci-artifacts.zip | Attest | ZIP bundle |
| attestation.pdf | Attest | PDF report |

On main pushes, the attest job archives the full bundle to S3 and anchors the hash on Solana. The combination satisfies EO 14028 supply chain transparency, NIST SSDF practices PW.4/PW.6/PW.7/PW.8, OMB M-22-18 self-attestation evidence, and M-24-15 machine-readable OSCAL requirements.
