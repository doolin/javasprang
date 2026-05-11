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
