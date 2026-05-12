# Compliance Backlog — 2026-05-11

Source: gap assessment dated 2026-05-11, conducted by Ron (security and
compliance) during the javasprang → springboard rename. All findings
surfaced from one local pipeline run: `./mvnw -B -ntp verify`,
`npm run test:coverage`, `npm run test:e2e`, `gitleaks`, `trivy fs`,
`npm audit`, `syft`, `scripts/generate-oscal.js`, `scripts/attest.mjs`,
`scripts/verify-evidence.js`. Tier corresponds to compliance impact.

Each entry conforms to the field structure of
`.github/ISSUE_TEMPLATE/compliance-finding.yml`. Apply listed labels on
issue creation; `status/needs-triage` and `kind/compliance` are already
on the template defaults.

## Filed as GitHub issues (Springboard project #7)

| Internal # | GitHub | Title (short)                                          |
|------------|--------|--------------------------------------------------------|
| 1          | #35    | Coverage policy unenforced                             |
| 2          | #36    | 8 HIGH Trivy CVEs                                      |
| 3          | #37    | In-repo OSCAL still says javasprang                    |
| 4          | #38    | PR-event jobs never fire (`branches:[main]`)           |
| 5          | #39    | Single-maintainer CODEOWNERS (AC-5)                    |
| 6          | #40    | PS.3 evidence archive not wired                        |
| 7          | #41    | Solana memo on devnet                                  |
| 8          | #42    | OSCAL not schema-validated                             |
| 9          | #43    | No SAST                                                |
| 10         | #44    | No change-authorization traceability (CM-3)            |
| —          | #45    | Chore: rename javasprang → springboard (this branch)  |

---

## 1. Coverage policy unenforced — JaCoCo gate at 5% line / 0% branch, Karma ungated

**Source:** manual-review
**External ID:** n/a (internal policy violation)
**Severity:** high
**Decision:** remediate
**Control mapping:** ssdf-pw.8 (vuln scan, executable)
**Labels:** kind/compliance, area/backend, area/frontend, area/ci,
compliance/ssdf-pw.8, priority/p1, effort/m

### Description

`AGENTS.md` declares: *"All new and modified code must have 100% line
and branch coverage, both backend (JaCoCo) and frontend
(Karma/Istanbul). No exceptions."* The enforcement does not match the
policy.

Backend (`pom.xml:138-182`):
- JaCoCo `check` rule is configured at `LINE COVEREDRATIO ≥ 0.05` and
  `BRANCH COVEREDRATIO ≥ 0.00`.
- An in-file `<!-- FIXME -->` comment (pom.xml:170-176) confirms the
  bar was knowingly lowered: *"branch threshold was 0.01 but the
  current test suite measures 0.00"*.
- Result: the "JaCoCo gate met" line that appears in every commit
  message is technically true but conveys no assurance.

Frontend (`src/main/frontend/karma.conf.js:21+`):
- `coverageReporter` is configured for HTML / lcovonly / json-summary
  output, but no `thresholds` / `check` block is present.
- Current measured: 98% lines, 100% functions, **55.55% branches**
  (5 of 9). No gate fails the build on this.

### Justification

n/a — decision is remediate.

### Removal / re-evaluation condition

n/a — decision is remediate.

### Acceptance criteria

- [ ] Set JaCoCo `<minimum>` to project-realistic targets, replacing
      the 0.05 / 0.00 placeholders. Either:
      (a) ratchet to the actual measured coverage (line / branch),
          documented in pom.xml as the floor; or
      (b) restate the AGENTS.md policy if 100% is not achievable for
          DTOs / entities / generated code.
- [ ] Remove the `<!-- FIXME -->` comment when the new threshold is
      backed by reality.
- [ ] Configure Karma `coverageReporter.check` (per-file or global)
      so `npm run test:coverage` exits non-zero below the threshold.
- [ ] AGENTS.md updated to reflect whichever stance wins — either the
      threshold lands at 100% (and we close coverage gaps), or the
      "no exceptions" line is amended to match the new floor.

---

## 2. 8 HIGH Trivy CVEs unaddressed, gate set to CRITICAL-only

**Source:** trivy
**External ID:** CVE-2024-38816, CVE-2024-38819, CVE-2025-22228,
CVE-2025-22235, CVE-2025-41249, CVE-2025-52999, CVE-2026-0603,
CVE-2026-40973, CVE-2026-42198 (8 HIGH, 10 MEDIUM observed)
**Severity:** high
**Decision:** remediate
**Control mapping:** ssdf-pw.7 (vuln scan, source)
**Labels:** kind/compliance, area/backend, area/deps,
compliance/ssdf-pw.7, compliance/ssdf-pw.8, priority/p0, effort/l

### Description

Trivy currently reports 0 CRITICAL, 8 HIGH, 10 MEDIUM CVEs against the
production dependency tree (19 findings, observed 2026-05-11). The
gating workflow `.github/workflows/ci-cd.yml:33` sets
`trivy-severity: "CRITICAL"`, with the comment:

> *Initial baseline: gate the build on CRITICAL only. HIGH findings
> are still captured as evidence but not failing yet — remediation
> tracked separately. Raise back to "CRITICAL,HIGH" once the baseline
> is clean.*

That "separate tracking" never materialized — none of the 8 HIGH
findings appear in `.trivyignore`, none have a compliance-finding
ticket. The findings are real and exploitable in principle:

| CVE              | Package                              | Title                                    |
|------------------|--------------------------------------|------------------------------------------|
| CVE-2024-38816   | spring-webmvc                        | Path traversal                           |
| CVE-2024-38819   | spring-webmvc                        | Path traversal                           |
| CVE-2025-22228   | spring-security-crypto               | BCryptPasswordEncoder issue              |
| CVE-2025-22235   | spring-boot                          | Endpoint info disclosure                 |
| CVE-2025-41249   | spring-core                          | Annotation issue                         |
| CVE-2025-52999   | jackson-core                         | Parser issue                             |
| CVE-2026-0603    | hibernate-core                       | Information disclosure                   |
| CVE-2026-40973   | spring-boot                          | Arbitrary code execution                 |
| CVE-2026-42198   | postgresql (JDBC)                    | Client-side denial of service            |

All 8 HIGH originate from the Spring Boot 2.7.x pin. Trivy already
has 2 CVEs in `.trivyignore` (CVE-2026-22732, CVE-2016-1000027) both
of which point to the Spring Boot 3 migration as removal condition —
suggesting the same migration likely closes most of this list too.

### Justification

n/a — decision is remediate.

### Removal / re-evaluation condition

n/a — decision is remediate (this ticket is the tracking artifact).

### Acceptance criteria

- [ ] One sub-ticket per CVE (or per group sharing remediation), each
      with explicit decision: `remediate` (bump), `suppress` (add to
      `.trivyignore` with justification + removal condition), or
      `defer` (link to Spring Boot 3 migration epic).
- [ ] After triage, `.github/workflows/ci-cd.yml:33` raised from
      `"CRITICAL"` to `"CRITICAL,HIGH"` and the comment above the
      input updated / removed.
- [ ] Comment in workflow file removed once baseline is clean.

---

## 3. In-repo OSCAL / attestation evidence still names system "javasprang"

**Source:** manual-review
**External ID:** n/a
**Severity:** medium
**Decision:** defer
**Control mapping:** m-24-15 (OSCAL)
**Labels:** kind/compliance, area/compliance, compliance/m-24-15,
priority/p2, effort/xs

### Description

Repository was renamed javasprang → springboard. Source-tree
references were updated in that rename PR (Tier-1 scope), but the
checked-in compliance evidence at `docs/compliance/artifacts/` was
intentionally left frozen under Option 1 of the rename. Affected
files still encode `javasprang` as the system identifier:

- `ssp-fragment.json` — 6 occurrences (title, name, short-name, id)
- `assessment-results.json` — 5 occurrences
- `component-definition.json` — 4 occurrences
- `attestation.pdf` — generated by `attest.mjs` from a prior CI run
- Surefire test XMLs — embed runner paths like
  `/home/runner/work/javasprang/javasprang/...`

Until CI regenerates the snapshot, a fresh clone presents an SSP whose
`system-name` does not match the repository. This is the simplest
sanity check an auditor would run.

### Justification

Compliance evidence is historical; rewriting frozen artifacts retro-
actively to match a renamed system would itself be an audit-integrity
concern. Better to let the next CI run regenerate naturally and
replace the frozen snapshot atomically.

### Removal / re-evaluation condition

Close when the next merge to master regenerates
`docs/compliance/artifacts/` with `springboard` as system name and
the regenerated set is committed. Verification:
`grep -c javasprang docs/compliance/artifacts/*` returns 0 for all
files except surefire XMLs (which embed paths from the new runner).

### Acceptance criteria

- [ ] Next master-push CI run regenerates evidence under the new name.
- [ ] Regenerated `docs/compliance/artifacts/` committed in a single
      "Refresh compliance evidence snapshot post-rename" commit.
- [ ] `grep -c javasprang docs/compliance/artifacts/` confirms 0.

---

## 4. PR-event jobs never fire — `branches: [main]` filter on master-default repo

**Source:** manual-review
**External ID:** n/a
**Severity:** medium
**Decision:** remediate
**Control mapping:** ssdf-pw.7 (vuln scan, source) — PR-event evidence
is part of code review attestation
**Labels:** kind/bug, area/ci, priority/p1, effort/xs

### Description

`.github/workflows/ci-cd.yml:13` declares:

```yaml
on:
  push:
  pull_request:
    branches: [main]
```

The repository's default branch is `master`, not `main`. As a result,
`pull_request` events filed against the default branch do not fire
the workflow, which means PR-event jobs (`pr-summary` and
`publish-pr-reports`, both gated `if: github.event_name ==
'pull_request'`) **never run on real PRs**.

The recent commit e2bfae0 ("Fix workflow startup failure: caller
permissions for nested jobs") plumbed permissions for these jobs but
did not fix the trigger filter — both jobs are still effectively
dead code from a PR-event standpoint.

Operationally this means: the per-PR sticky-comment summary and the
per-PR GitHub Pages reports advertised in the roadmap and in recent
commits are not running. Push-event runs still fire (they're not
filtered), so per-commit compliance jobs are unaffected.

### Justification

n/a — decision is remediate.

### Removal / re-evaluation condition

n/a.

### Acceptance criteria

- [ ] Either change `branches: [main]` to `branches: [master]`, or
      remove the filter entirely (every PR-event run should fire).
- [ ] Verify on a test PR that `pr-summary` runs and posts a sticky
      comment, and that `publish-pr-reports` updates the `gh-pages`
      branch under `pr/<N>/`.
- [ ] Cross-check `.gitlab-ci.yml` for the symmetric defect (none
      observed but worth scanning).

---

## 5. Separation of duties — single-maintainer CODEOWNERS (`* @doolin`)

**Source:** manual-review
**External ID:** NIST SP 800-53 AC-5
**Severity:** medium
**Decision:** accept-risk
**Control mapping:** ssdf-pw.7 (vuln scan, source) — peer review
practice; also AC-5 separation of duties
**Labels:** kind/compliance, area/security, compliance/ssdf-pw.7,
priority/p2, effort/s

### Description

`.github/CODEOWNERS:8` is `* @doolin` — a single human reviewer. This
is acknowledged in the file as a "single-maintainer placeholder." The
compliance consequences:

- **SP 800-53 AC-5 (separation of duties)**: cannot be attested. Same
  identity authors and approves every change.
- **SSDF PW.7 (review and analyze human-readable code)**: review trail
  consists of self-approval.
- **SLSA L3 (two-party-reviewed source)**: not claimable.

This is structural to the project (single maintainer, OSS), not a
defect, but it is a real compliance gap that should be documented
rather than hidden.

### Justification

Single-maintainer OSS project. Adding a second reviewer is a people
problem, not a workflow problem. The project's compliance posture
should explicitly acknowledge the AC-5 / SLSA L3 ceiling rather than
implying capability it does not have.

### Removal / re-evaluation condition

Close when (a) a second human maintainer with merge rights joins, OR
(b) the project explicitly accepts a compensating control (e.g.
agentic automated review with a recorded decision trail per PR, and a
documented out-of-band review process for security-relevant changes).

### Acceptance criteria

- [ ] Add a "Known compliance ceilings" section to `SECURITY.md`
      explicitly listing AC-5 / SLSA L3 limitations under the current
      maintainer set.
- [ ] Document the compensating control (if any) — e.g. mandatory
      `ultrareview` run on every PR, recorded as evidence.
- [ ] Cross-reference this ticket from `docs/ticket-conventions.md`
      under the compliance-axis discussion.

---

## 6. PS.3 / SR-12 evidence archive not wired — 90-day retention only

**Source:** manual-review
**External ID:** NIST SP 800-218 PS.3, NIST SP 800-53 SR-12
**Severity:** medium
**Decision:** defer
**Control mapping:** ssdf-ps.2 (verification)
**Labels:** kind/compliance, area/ci, area/compliance,
compliance/ssdf-ps.2, priority/p2, effort/m

### Description

`SECURITY.md` states:

> *Evidence is retained 90 days as artifacts and indefinitely on the
> project's S3 compliance bucket once the deploy gate is wired.*

The S3 archive step is not wired. `scripts/attest.mjs` has an S3
upload block (`S3_COMPLIANCE_BUCKET`, `AWS_REGION`) that is conditional
on `$S3_COMPLIANCE_BUCKET` being set — and it is not set anywhere in
the workflows. Effective retention for ALL evidence today is **90
days**, including artifacts that `scripts/verify-evidence.js:38-50`
classifies as `retention-class: permanent`:

- OSCAL SSP / SAR / component-definition (permanent)
- SBOM (permanent)
- attestation.pdf + ci-artifacts.zip (permanent)
- Trivy / npm-audit / gitleaks reports (long-term, ≥3 yr)

This is a PS.3 (archive and protect each software release) /
SR-12 (component disposal) gap. The retention classification in
`verify-evidence.js` is aspirational rather than enforced.

### Justification

Wiring the S3 archive needs bucket provisioning, IAM role for OIDC,
KMS key for at-rest encryption, and lifecycle policy. This is real
infra work, not a one-line change, and the project does not yet have
an AWS account dedicated to compliance evidence.

### Removal / re-evaluation condition

Close when:
1. S3 bucket exists with versioning + object lock (compliance mode)
   + KMS encryption + lifecycle policy matching the
   `retention-class` taxonomy.
2. Workflow has the necessary OIDC trust to assume an upload role.
3. `attest.mjs` invocation in CI sets `$S3_COMPLIANCE_BUCKET` and a
   recent run shows successful S3 upload in the attestation timeline.

### Acceptance criteria

- [ ] Either implement (S3 archive wired end-to-end) or amend
      `SECURITY.md` to reflect current reality (90-day retention is
      the actual posture).
- [ ] `verify-evidence.js` retention-class taxonomy either reflected
      in real lifecycle policy, or annotated as aspirational with
      explicit reference to this ticket.

---

## 7. Solana memo anchor is devnet — non-authoritative chain-of-custody

**Source:** manual-review
**External ID:** n/a
**Severity:** low
**Decision:** accept-risk
**Control mapping:** ssdf-ps.1 (provenance)
**Labels:** kind/compliance, area/compliance, domain/attestation,
compliance/ssdf-ps.1, priority/p3, effort/s

### Description

`scripts/attest.mjs` defaults `SOLANA_NETWORK` to `devnet` when not
set. Solana devnet has no settlement guarantees: it is a development
ledger that can be wiped or reset by the cluster operator. Memo
transactions land on a ledger that is not durable in the legal /
audit sense.

For the project's stated purpose (demo of an evidence pipeline
including on-chain anchoring), devnet is appropriate. As a non-
repudiable chain-of-custody anchor for *real* compliance evidence,
devnet is demonstration, not assurance.

### Justification

This is a single-maintainer OSS project, not a regulated production
system. Mainnet anchoring would require a real SOL-funded keypair
and a non-trivial operational commitment. Devnet is the correct
choice for current scope.

### Removal / re-evaluation condition

Re-evaluate if (a) the project is used to attest evidence consumed by
an actual auditor or regulator, OR (b) the public-facing pitch
implies "blockchain-anchored compliance" without the "(devnet)"
qualifier.

### Acceptance criteria

- [ ] Add a one-line caveat to the attestation PDF template clarifying
      "Solana (devnet) — demonstration anchor, not audit-grade
      ledger" (currently the PDF just says "Network: Solana
      (devnet)" which is technically correct but easy to miss).
- [ ] `SECURITY.md` "Security pipeline" section explicitly notes that
      the Solana anchor is devnet by default and what changing it
      requires.

---

## 8. OSCAL artifacts generated but never validated against NIST schema in CI

**Source:** manual-review
**External ID:** NIST SP 800-53 SA-15
**Severity:** low
**Decision:** remediate
**Control mapping:** m-24-15 (OSCAL)
**Labels:** kind/compliance, area/ci, compliance/m-24-15,
priority/p3, effort/xs

### Description

`README.md:201-228` documents using `oscal-cli` (NIST's reference
validator) to confirm that generated OSCAL artifacts conform to the
schema for assessment-results / component-definition / SSP. The
pipeline does not invoke `oscal-cli` — generation runs
(`scripts/generate-oscal.js`) and the artifacts are uploaded as
evidence without schema-conformance verification.

The risk: `generate-oscal.js` could emit a malformed OSCAL document
(missing required field, wrong UUID format, wrong schema version)
and the pipeline would happily attest to it. An auditor running
`oscal-cli` against the artifacts as their first step would catch it;
the pipeline currently would not.

### Justification

n/a — decision is remediate.

### Removal / re-evaluation condition

n/a.

### Acceptance criteria

- [ ] Add an `oscal-validate` step to the OSCAL job in
      `.github/workflows/golden-pipeline.yml`. Either install
      `oscal-cli` per the README snippet or use a pre-built action
      image. Validate all three artifacts:
      `oscal-cli ar validate assessment-results.json`,
      `oscal-cli component-definition validate
       component-definition.json`,
      `oscal-cli ssp validate ssp-fragment.json`.
- [ ] Step has `exit-code: 1` semantics — validation failure fails
      the job.
- [ ] `audit-event-oscal.json` extended to include a
      `schema-validation: passed` field.

---

## 9. No SAST — PW.5 / PW.7 evidence is weak for application code

**Source:** manual-review
**External ID:** NIST SP 800-218 PW.5
**Severity:** low
**Decision:** defer
**Control mapping:** ssdf-pw.7 (vuln scan, source)
**Labels:** kind/compliance, area/security, compliance/ssdf-pw.7,
priority/p3, effort/m

### Description

Current pipeline security scans:

- `gitleaks` — secrets (PW.6) ✓
- `trivy fs` — dependency CVEs (PW.7 / PW.8) ✓
- `npm audit` — frontend dep CVEs (PW.7) ✓
- `syft` — SBOM (PW.4) ✓

Notably absent: any static analysis over the application source code
itself. The `kind/security` and `area/security` labels carry weight,
but **PW.5 (create source code by adhering to secure coding
practices)** and the source-analysis portion of **PW.7** are
evidenced only by Checkstyle (style, not security) and ESLint
(general lint, not security).

A SAST integration (CodeQL, Semgrep, SonarQube, etc.) would close
this — flagging things like insecure deserialization patterns,
crypto primitive misuse, SQL string concatenation, untrusted-input
to-reflection, etc. that dependency scanners cannot see.

### Justification

This is real work (tool selection, ruleset tuning, false-positive
triage) and the current threat model is bounded by the small surface
area (single backend service, no multi-tenancy, no PII in the demo
domain). Deferring is rational; documenting the gap is mandatory.

### Removal / re-evaluation condition

Re-evaluate if the project scope expands (multi-tenancy, real PII,
external auditor), OR when a low-noise SAST default ruleset becomes
available for the Java + Angular stack (CodeQL "security-extended"
suite is a reasonable starting point).

### Acceptance criteria

- [ ] SAST tool selected (decision documented in this ticket).
- [ ] Pipeline step added with explicit severity gate (probably
      "error" only for the initial baseline).
- [ ] `SECURITY.md` "Security pipeline" section updated to list the
      new scanner.
- [ ] Compliance-finding-template `source` dropdown extended to
      include the new tool.

---

## 10. No change-authorization traceability — commits lack ticket references (CM-3)

**Source:** manual-review
**External ID:** NIST SP 800-53 CM-3 (configuration change control)
**Severity:** high
**Decision:** remediate
**Control mapping:** ssdf-pw.7 (vuln scan, source) — closest fit;
substantively this is a CM-3 / CM-5 trace concern
**Labels:** kind/compliance, area/ci, area/security,
compliance/ssdf-pw.7, priority/p1, effort/s

### Description

Reviewed the previous 12 commits on master (`e2bfae0` through
`1265dd7`). **None reference a ticket, issue, or change-authorization
record.** No `Closes #N`, `Refs #N`, `Implements #N` footer; no
ticket-ID header; no CR-/CM-/COMP- identifier anywhere in subject or
body.

Bodies describe rationale and roadmap context — e.g. *"Roadmap item
#5 from docs/phone-testing-roadmap.md"* (dce5fde), *"PR 2 of the
ticket-structure proposal"* (06f1112) — but no commit links to a
specific tracked ticket. The `https://claude.ai/code/session_…`
trailer identifies the **agent session** that wrote the commit, not
the **authorized change** the commit implements. They are different
artifacts and only one of them is what an auditor asks for.

The repo has the full ticket infrastructure (issue templates,
46-label taxonomy, the compliance-finding workflow this very
backlog uses) — the missing piece is the **convention** that connects
each commit to its authorizing ticket, and the **enforcement** of
that convention.

Compliance impact:
- **SP 800-53 CM-3 (configuration change control)**: changes must
  be authorized prior to implementation; without a ticket reference,
  there is no trace from authorization record to implementing commit.
- **SP 800-53 CM-5 (access restrictions for change)**: cannot attest
  that only authorized changes landed in the codebase.
- **SP 800-218 PO.1 (security requirements)**: requirements
  traceability is broken at the commit boundary.
- **M-22-18 / M-24-15 self-attestation**: cannot produce the
  requirement → design → implementation → test → release chain at
  audit time. The pipeline emits beautiful evidence on the
  implementation → test → release segment but cannot answer "which
  authorized change does this commit implement?"

This is the *foundational* compliance trace gap — every other ticket
in this backlog will, when closed, produce commits that themselves
need this fix to be auditable.

### Justification

n/a — decision is remediate.

### Removal / re-evaluation condition

n/a.

### Acceptance criteria

- [ ] Convention chosen and documented in `docs/ticket-conventions.md`:
      every commit on master MUST include a footer of the form
      `Refs: #N` or `Closes: #N` referencing an open or closed issue
      that is the authorizing record. Multiple refs allowed
      (`Refs: #12, #34`). Compliance-finding tickets are the
      canonical authorization for security/compliance work; feature
      / chore / refactor / docs work uses the corresponding issue
      template.
- [ ] Commit-msg git hook (under `.githooks/`, with `core.hooksPath`
      pointer in CONTRIBUTING.md) enforces the footer locally. Hook
      MUST be the project's hook, not a personal one — checked-in,
      versioned.
- [ ] CI workflow adds a `verify-commit-trace` step on PRs and on
      master pushes that runs the same regex over the commit range
      and fails the build if any commit lacks a ticket reference.
- [ ] Evidence artifact: `traceability-report.json` emitted per CI
      run mapping each commit SHA in the push range to its
      referenced ticket IDs and ticket states. Added to the
      verify-evidence.js expected-file list with retention-class
      `long-term`.
- [ ] `SECURITY.md` "How findings are tracked" section extended:
      every commit that touches a finding must reference that
      finding's ticket in its `Refs:` footer; the
      traceability-report is the post-hoc verifier.
- [ ] Cutover commit: this ticket's closing commit IS the first one
      that includes a `Refs: #N` (where N is this ticket itself).
      Prior history is not rewritten — historical commits remain as
      they are; the policy applies from the cutover forward and is
      documented as such in `docs/ticket-conventions.md`.

### Note on this backlog itself

The 9 tickets that precede this one in this file were written before
the convention was instituted. If this ticket is filed and the
convention adopted, the commit that creates these issues should
itself carry a `Refs: #<this-ticket>` footer — and every subsequent
remediation commit for tickets #1–#9 should carry both a `Refs:` to
the remediation ticket AND, until #10 closes, an explicit reminder
of the broader trace policy.

---

# Summary

| # | Title (short)                                              | Priority | Effort | Decision        |
|---|------------------------------------------------------------|----------|--------|-----------------|
| 1 | Coverage policy unenforced — JaCoCo 5%/0%, Karma ungated  | p1       | m      | remediate       |
| 2 | 8 HIGH Trivy CVEs unaddressed, gate at CRITICAL-only      | p0       | l      | remediate       |
| 3 | In-repo OSCAL still says "javasprang"                     | p2       | xs     | defer           |
| 4 | PR-event jobs never fire — `branches:[main]` on master   | p1       | xs     | remediate       |
| 5 | Single-maintainer CODEOWNERS — AC-5 / SLSA L3 ceiling    | p2       | s      | accept-risk     |
| 6 | PS.3 / SR-12 evidence archive not wired                   | p2       | m      | defer           |
| 7 | Solana memo anchor is devnet                              | p3       | s      | accept-risk     |
| 8 | OSCAL artifacts not schema-validated in CI                | p3       | xs     | remediate       |
| 9 | No SAST — PW.5 / source-PW.7 weakly evidenced            | p3       | m      | defer           |
| 10 | No change-authorization traceability — CM-3 (commit→ticket) | p1     | s      | remediate       |

Ten findings: five remediate (#1, #2, #4, #8, #10), three defer
(#3, #6, #9), two accept-risk (#5, #7). #10 is foundational: it is
the trace gap that makes all the other tickets' eventual closure
*auditable*. Closing it first (cheap, well-bounded) maximizes the
value of every subsequent remediation commit.
