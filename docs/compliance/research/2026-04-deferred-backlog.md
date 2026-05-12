# Deferred backlog — 2026-04

Originally `.development/backlog.md`. Preserved here as historical artifact; consolidated 2026-05-12 per [SB-GL-42](https://gitlab.com/doolin/springboard/-/work_items/42).

Done items have been pruned; deferred items retained with notes on whether they have since been ticketed.

## Already completed (pruned from active list, listed here for audit trail)

- ~~**Upgrade Node 20 to 22**~~ — completed 2026-04-20; CI pipelines, frontend-maven-plugin, and `package.json` engine all on Node 22 LTS.
- ~~**RFC 3161 timestamping for CI evidence**~~ — completed 2026-04-20; Sigstore TSA wired into both GitHub Actions and GitLab CI alongside the Solana attestation. Dual-chain approach landed: Solana for decentralized tamper evidence + RFC 3161 for legal admissibility (EO 14028, M-22-18, M-24-15).
- ~~**Solana attestation from GitHub and GitLab**~~ — completed; running on devnet. Mainnet migration tracked at [SB-GL-6](https://gitlab.com/doolin/springboard/-/work_items/6) with operational-readiness assessment at `2026-05-12-solana-mainnet-readiness.md`.

## Deferred — planned and ticketed

- **Spring Boot 3 migration** — Migrate from EOL Spring Boot 2.7.18 to Spring Boot 3.x (Jakarta namespace). Currently held together with BOM property overrides for CVE remediation. Planned as SB-GL-39 in the post-INC-2026-05-12-001 repurposing campaign. Authoritative remediation for the BOM-locked HIGH CVE cluster ([SB-GL-3](https://gitlab.com/doolin/springboard/-/work_items/3)).
- **Full line and branch test coverage** — Raise JaCoCo line and branch coverage thresholds to meaningful levels. Currently tracked at [SB-GL-2](https://gitlab.com/doolin/springboard/-/work_items/2) (coverage policy unenforced).

## Deferred — not yet ticketed

These items are preserved here for later ticketing. Each can be filed via `scripts/gitlab-issue-create.sh` when active.

- **CI speed: custom Docker image** — Build a project-specific CI image with Java 17, Node 22, Chrome pre-installed, and a pre-warmed Maven cache. Eliminates minutes of setup per job. Push to GitLab Container Registry or GHCR. Status: not ticketed; engineering / CI improvement.
- **Drag-and-drop on Kanban board** — Replace dropdown-based card movement with drag-and-drop between columns. Angular CDK DragDrop is already available. Status: not ticketed; feature work.
- **Externalize JWT secret** — Replace the hardcoded dev JWT signing key with environment variable or secrets manager config for production. Status: not ticketed; security-hardening work (relates to SP 800-53 SC-12).
- **Missing frontend test specs** — Add specs for the Kanban board (`home.component`) and todo service. Both are currently untested. Status: not ticketed; rolls into coverage work at [SB-GL-2](https://gitlab.com/doolin/springboard/-/work_items/2).
- **Fix auth test endpoint mismatch** — Frontend auth specs use `/api/auth/` but `AuthService` calls `/api/v1/auth/`. Causes request matcher failures. Status: per the 2026-04-22 session-pause notes, this MAY have already been addressed; verify against current code before filing.
- **Deployment plan** — Design and document the deployment strategy (target platform, infra provisioning, CI/CD deploy stage). Decide between Lambda, ECS, k8s, or traditional VM. Status: not ticketed; architectural decision.
- **Shamrock link** — Add Shamrock site link to the application. Status: not ticketed; feature work. (See `add-shamrock-link` skill.)
- **Deploy commit SHA in HTML head** — Embed the deployed git commit SHA into an HTML `<meta>` tag in the `<head>` element. Status: not ticketed; small infrastructure improvement. (See `add-build-sha` skill.)
