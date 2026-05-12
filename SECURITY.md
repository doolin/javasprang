# Security policy

## Reporting a vulnerability

**Do not open a public issue for a security finding.**

Use [GitHub Security Advisories — "Report a vulnerability"][gha] to
disclose privately. The maintainer is notified by email and the
advisory stays private until coordinated disclosure.

[gha]: https://github.com/doolin/springboard/security/advisories/new

If GitHub Security Advisories isn't usable for you, open a *blank* PR
in your own fork (no description, no patch) and link to it from a
generic communication channel — we'll coordinate offline from there.

## Scope

In scope:

- The Java / Spring Boot backend (`src/main/java/`)
- The Angular frontend (`src/main/frontend/`)
- The CI/CD pipeline (`.github/workflows/`, `.gitlab/`, `scripts/`)
- Compliance evidence outputs (SBOM, OSCAL, attestation)
- Dependency-tree CVEs not already documented in `.trivyignore`

Out of scope:

- Third-party hosted services (GitHub, GitLab, runners)
- Findings already documented in `.trivyignore` with a published
  removal condition
- Demo / synthetic data populated by `scripts/provision_synthetic_data.sh`

## Tailored controls and compensating measures

Springboard is a development-phase proof-of-concept for federal
deployment under the [NIST Risk Management Framework][rmf]
([SP 800-37 Rev. 2][rmf]). The eventual operational baseline is
[FIPS 199][fips199] Moderate per [SP 800-53B][sp53b]. This section
documents control tailoring decisions made for the development-phase
repository per [SP 800-53 Rev. 5 §3.2][sp53] (Control Tailoring),
with explicit handoff conditions for the Authorize step (RMF Step 5).

**Authorization context.** The repository is currently under interim
self-authorization by the single maintainer acting as *interim*
Authorizing Official (AO). The interim AO is **not** the
production-system AO; transition to a designated AO at the Authorize
step is a precondition for any operational deployment of an artifact
built from this codebase. The artifacts produced under interim
self-authorization are *evidence of readiness*, not authorization
records.

### AC-5 — Separation of duties

**Control objective.** Prevent an individual from possessing
sufficient privilege to act unilaterally on the system without
independent check ([SP 800-53 Rev. 5][sp53], AC-5).

**Baseline applicability.** Required at FIPS 199 Low, Moderate, and
High per [SP 800-53B][sp53b].

**Implementation status.** *Alternative Implementation (compensating
control).* The authorization boundary of the development repository
contains a single maintainer; the authoring identity and the
approving identity are the same. `.github/CODEOWNERS` is `* @doolin`
with no second-party review gate. AC-5 as written cannot be
implemented in this development phase.

**Compensating measures in place.**

1. *Cryptographically anchored pipeline evidence.* (Mapped to SI-7,
   SC-12; [SSDF PS.2.1][ssdf].) Every commit on `master` produces a
   full evidence bundle — OSCAL assessment results, CycloneDX SBOM,
   scan results, audit events — anchored via [RFC 3161][rfc3161]
   (Sigstore TSA) and Solana memo (devnet; see [SB-GL-6][sb-gl-6]).
   The anchor provides non-repudiable evidence that a specific commit
   passed all automated gates at a specific time. It does **not**
   provide duty separation; it provides post-hoc attributability of
   the unilateral merge.

2. *Convention-enforced out-of-band review for security-relevant
   changes.* Work items carrying `area/security` or `kind/compliance`
   labels are reviewed against external references (relevant NIST
   SPs, applicable CVE feeds, the SLSA spec) prior to merge. Review
   notes are captured in the work item discussion thread. Enforcement
   is by maintainer discipline; no pipeline gate currently enforces
   it.

**Compensating measures planned (tracked, not yet in place).**

3. *Agentic pre-merge review with archived decision artifact.* A
   per-MR review record archived in `ci-artifacts.zip` alongside the
   existing evidence set, with a corresponding entry in
   `evidence-manifest.json`. Tracked at [SB-GL-21][sb-gl-21].
   **Not currently claimed as in place.**

**Residual risk.** A maintainer acting unilaterally and in bad faith
could merge a change that passes all automated gates but would fail
a human dual-control review. The cryptographic anchor makes the
action attributable post hoc; it does not prevent it. The
development-phase posture accepts this residual risk under interim
self-authorization, on the explicit understanding that it SHALL be
re-evaluated under a designated AO before any operational deployment.

**Re-evaluation.** This tailoring SHALL be revisited when any of the
following occurs:

- A second maintainer with merge privileges joins the development
  project.
- [SB-GL-21][sb-gl-21] lands and the agentic-review output is wired
  into the evidence bundle (the planned measure moves to *in place*).
- The system transitions to the Authorize step under a designated AO.
- A consuming party requires AC-5 implementation that the in-place
  compensating measures do not satisfy.

### SLSA source-review

**Source requirement.** Under [SLSA v0.1 / v0.2][slsa01], two-person
source review was a Build Level 3 requirement. Under
[SLSA v1.0][slsa10] the framework split into Build and Source
tracks; the Source track's review requirements are not yet finalized.
Under either framing, two-person source review is unattainable while
the development authorization boundary contains a single maintainer.

**Implementation status.** *Not claimable.* The project's practical
SLSA ceiling is **Build Level 2** under the current development-phase
authorization boundary.

**Compensating measures.** The AC-5 compensating measures above apply
with equal weight to the source-review concern. Note specifically:
an agentic reviewer is *not* a "trusted person" within the SLSA
threat model and the project does not claim otherwise. The
cryptographic anchor attests to pipeline execution and artifact
provenance — concerns orthogonal to source review and not a
substitute for it.

**Residual risk and re-evaluation.** Consumers requiring SLSA Source
Track L3 SHOULD NOT consume artifacts produced under this
development-phase posture. Re-evaluation conditions are identical to
AC-5 above.

### OSCAL representation

These tailoring decisions are represented in the project's OSCAL
output (`ssp-fragment.json`) as `implemented-requirement` entries
with `implementation-status.state` set to `alternative`, in
conformance with [SSDF PS.3.1][ssdf] and OMB M-24-15
(machine-readable authorization artifacts).

[rmf]: https://csrc.nist.gov/pubs/sp/800/37/r2/final
[sp53]: https://doi.org/10.6028/NIST.SP.800-53r5
[sp53b]: https://csrc.nist.gov/pubs/sp/800/53/b/upd1/final
[ssdf]: https://csrc.nist.gov/pubs/sp/800/218/final
[fips199]: https://csrc.nist.gov/pubs/fips/199/final
[rfc3161]: https://datatracker.ietf.org/doc/html/rfc3161
[slsa01]: https://slsa.dev/spec/v0.1/levels
[slsa10]: https://slsa.dev/spec/v1.0/
[sb-gl-6]: https://gitlab.com/doolin/springboard/-/work_items/6
[sb-gl-21]: https://gitlab.com/doolin/springboard/-/work_items/21

## What to expect

- Acknowledgement of receipt within ~2 business days (best-effort;
  this is a single-maintainer OSS project)
- Coordinated disclosure timeline negotiated based on severity and
  fix complexity
- Credit in release notes if you'd like

## How findings are tracked

Confirmed findings are tracked through the project's normal compliance
workflow (see [`docs/ticket-conventions.md`](./docs/ticket-conventions.md)).
Each finding gets a ticket with:

- Source (`trivy`, `npm-audit`, `gitleaks`, `external-audit`, etc.)
- Severity, CVE/control ID, decision, justification, removal condition
- Mapping to the relevant SSDF / OMB control via `compliance/*` labels

Suppressed CVEs are documented inline in `.trivyignore` with their own
justification and removal condition.

## Security pipeline

The CI/CD pipeline runs on every PR and emits machine-readable
evidence:

- **gitleaks** — secrets scan over full git history (PW.6)
- **npm audit** — production-tree advisories (PW.7)
- **Trivy** — filesystem scan (PW.7 / PW.8)
- **anchore syft** — CycloneDX SBOM (PW.4)
- **OSCAL artifacts** — assessment results, component definition,
  SSP fragment (M-24-15)
- **SLSA build provenance + RFC 3161 timestamp** — main-branch only

Evidence is retained 90 days as artifacts and indefinitely on the
project's S3 compliance bucket once the deploy gate is wired.
