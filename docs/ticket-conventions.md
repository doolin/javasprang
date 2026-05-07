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
