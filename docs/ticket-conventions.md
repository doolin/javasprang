# Ticket conventions

Single-source-of-truth for how issues and PRs are labeled and tracked
in this repo. Optimized for solo + mobile workflow with compliance
traceability.

## Label catalog

Labels live in [`docs/labels.yml`](./labels.yml). Apply changes with
[`scripts/bootstrap-labels.sh`](../scripts/bootstrap-labels.sh) — it's
idempotent and reads the YAML as the canonical source.

Six axes; pick one value from each axis where applicable.

| Axis | Purpose | Example values |
| --- | --- | --- |
| `kind/` | What type of work | `bug`, `feature`, `chore`, `refactor`, `security`, `docs`, `test`, `perf`, `compliance` |
| `area/` | Which code/system area | `backend`, `frontend`, `ci`, `compliance`, `security`, `deps`, `docs`, `infra` |
| `domain/` | Functional / business surface | `auth`, `todo`, `kanban`, `evidence`, `attestation` |
| `priority/` | Triage tier | `p0`, `p1`, `p2`, `p3` |
| `effort/` | Quick-glance sizing | `xs` (<1h), `s` (<1d), `m` (1–3d), `l` (1w+), `xl` (sprint+) |
| `status/` | Lifecycle state | `needs-triage`, `blocked`, `blocked-external`, `in-progress`, `needs-review` |

Plus a **chart-of-accounts axis for compliance work** — these map 1:1
to the audit-event stages already emitted by the Golden Pipeline:

| Label | Maps to |
| --- | --- |
| `compliance/ssdf-pw.4` | SBOM (CycloneDX) |
| `compliance/ssdf-pw.6` | Secrets scan (gitleaks) |
| `compliance/ssdf-pw.7` | Vuln scan, source (npm audit / Trivy) |
| `compliance/ssdf-pw.8` | Vuln scan, executable |
| `compliance/ssdf-ps.1` | Provenance generation |
| `compliance/ssdf-ps.2` | Provenance verification |
| `compliance/m-21-31` | Audit logging |
| `compliance/m-22-18` | Self-attestation |
| `compliance/m-24-15` | OSCAL machine-readable artifacts |
| `compliance/eo-14028` | EO 14028 supply-chain transparency |

## Rules of thumb

1. **Every issue gets exactly one `kind/`, one `area/`, one
   `priority/`, one `effort/`.** Add `domain/` and `compliance/` when
   they apply. Add `status/*` only when the Project field can't carry
   the signal (e.g., when filtering off-board).
2. **Project field is canonical for status / priority / effort.**
   Labels of the same axis exist for repo-level search and external
   tools — they should match the Project field for the same issue.
3. **`compliance/*` labels mark the ticket that closes the work**, not
   every CVE that surfaces. A CVE we accept and document goes in
   `.trivyignore` with its own justification + removal condition;
   labels gate work, the ignore file gates the build.
4. **`priority/p0` is rare.** Reserve for security incidents, broken
   builds, or compliance gaps that block all other work. Anything else
   that "feels urgent" is `p1`.

## Adding a label

1. Open `docs/labels.yml`, add the entry (alphabetize within its axis
   group; pick a color from the existing palette unless there's a
   strong reason).
2. Open a PR with the YAML change.
3. After merge, run `scripts/bootstrap-labels.sh`. The script upserts
   only what changed.

To rename: change the `name` in the YAML and add the old label to a
follow-up `--prune` run. (The script's `--prune` mode is opt-in to
avoid accidental mass-deletions.)

## Project board (Projects v2)

A separate PR sets up the project board. The board has these custom
fields:

- **Status** — Backlog, Triage, In Progress, In Review, Blocked, Done
- **Priority** — P0–P3
- **Effort** — XS–XL
- **Iteration** — weekly cadence
- **Compliance** — single-select listing the `compliance/*` axis
  values, faster to filter than label search

Saved views:

| View | Layout | Filter |
| --- | --- | --- |
| Active | Board | Status ≠ Done |
| Backlog | Table | Status = Backlog/Triage; sorted by Priority desc, Effort asc |
| Compliance | Table | Has any `compliance/*` label |
| By area | Table | Grouped by `area/*` |
| This iteration | Board | Iteration = current |

## Keeping this doc honest

This file is a living doc. When the taxonomy evolves, update both
`docs/labels.yml` and this file in the same PR.

## Commit-to-ticket traceability

Every non-merge commit on `master` carries a subject-line prefix of
the form `SB-GL-` followed by the GitLab work-item IID, a space, and
the rest of the subject. For example:

```
SB-GL-22 Fix validate-commit no-range fallback walking full history
```

The prefix is enforced server-side by the `validate-commit-prefix` CI
gate (defined in
[`.gitlab/ci/golden-pipeline.yml`](../.gitlab/ci/golden-pipeline.yml))
as the first, fast-fail stage of the pipeline: a non-conforming
commit blocks every downstream job.

**What the prefix establishes** ([NIST SP 800-53
CM-3](https://doi.org/10.6028/NIST.SP.800-53r5), configuration change
control). The implementing commit's authorizing record is
machine-discoverable from the commit subject alone. The referenced
work item carries the substantive authorization: source, severity,
decision, justification, acceptance criteria, removal/re-evaluation
condition.

**Evidence artifact.** Each pipeline run emits
`traceability-report.json` listing every commit in the push or MR
range with its referenced ticket IID, ticket URL, and subject. The
artifact is archived alongside the rest of the evidence bundle
(`artifact-class: change-authorization-trace`, `retention-class:
long-term`).

**Multiple-ticket commits.** A commit may reference additional
tickets in the *body* via `Refs:` URL lines, but the subject prefix
references exactly one ticket — the one authorizing the change.

**Convention divergence note.**
[SB-GL-9](https://gitlab.com/doolin/springboard/-/work_items/9)
originally proposed a `Refs:` / `Closes:` footer convention; the
project adopted the prefix form via
[SB-GL-20](https://gitlab.com/doolin/springboard/-/work_items/20).
Both serve the same control objective; the prefix is preferred for
one-line discoverability in `git log --oneline` and for fast-fail
regex enforcement in CI without parsing commit bodies.

**Local enforcement (deliberately omitted).** No client-side
`commit-msg` git hook is shipped. The server-side gate is the
binding control; a client hook would be a developer-experience
nicety with no incremental compliance value.

## Tailored controls and compensating measures

The development-phase repository operates under interim
self-authorization, with explicit tailoring of certain SP 800-53
controls per [SP 800-53 Rev. 5 §3.2](https://doi.org/10.6028/NIST.SP.800-53r5).
The tailoring decisions are documented in
[`SECURITY.md`](../SECURITY.md#tailored-controls-and-compensating-measures):

- **AC-5 (separation of duties)** — *Alternative Implementation*
  under the single-maintainer authorization boundary. Tickets in
  `area/security` or `kind/compliance` should note whether the
  convention-enforced out-of-band review was performed and link the
  review notes from the work item discussion thread.
- **SLSA source-review** — *Not claimable*. Build Level 2 is the
  practical ceiling pending (a) addition of a second maintainer with
  merge privileges, or (b) transition to the Authorize step under a
  designated AO.

When a ticket exposes or extends the tailoring envelope —
particularly `compliance/*`-labeled work — include a note in the
ticket body identifying which tailoring it touches and whether the
residual-risk profile under interim self-authorization remains
unchanged.
