# Backlog

Items not yet scheduled. Add new work here. Move to `todo.md`
when it becomes active.

<!-- Newest items at the top. -->

- **CI speed: custom Docker image** — Build a project-specific
  CI image with Java 17, Node 22, Chrome pre-installed, and a
  pre-warmed Maven cache. Eliminates minutes of setup per job.
  Push to GitLab Container Registry or GHCR.

- **Upgrade Node 20 to 22** — Node 20 is EOL. Update CI
  pipelines, frontend-maven-plugin config, and package.json
  engine requirements to Node 22 LTS.

- **RFC 3161 timestamping for CI evidence** — Add TSA
  (Time Stamping Authority) timestamping of CI artifact
  hashes alongside the existing Solana attestation. RFC 3161
  is the federally recognized standard for trusted timestamps.
  Dual-chain approach: Solana for decentralized tamper evidence,
  RFC 3161 for legal admissibility and federal compliance
  (EO 14028, M-22-18, M-24-15 machine-readable evidence
  requirements). Both timestamp the same SHA-256 artifact hash.

- **Spring Boot 3 migration** — Migrate from EOL Spring Boot
  2.7.18 to Spring Boot 3.x (Jakarta namespace). Currently
  held together with BOM property overrides for CVE remediation.

- **Drag-and-drop on Kanban board** — Replace dropdown-based
  card movement with drag-and-drop between columns. Angular
  CDK DragDrop is already available.

- **Externalize JWT secret** — Replace the hardcoded dev JWT
  signing key with environment variable or secrets manager
  config for production.

- **Missing frontend test specs** — Add specs for the Kanban
  board (home.component) and todo service. Both are currently
  untested.

- **Fix auth test endpoint mismatch** — Frontend auth specs
  use `/api/auth/` but AuthService calls `/api/v1/auth/`.
  Causes request matcher failures in tests.

- **Deployment plan** — Design and document the deployment
  strategy (target platform, infra provisioning, CI/CD deploy
  stage). Decide between Lambda, ECS, k8s, or traditional VM.

- **Shamrock link** — Add Shamrock site link to the application.

- **Deploy commit SHA in HTML head** — Embed the deployed git
  commit SHA into an HTML `<meta>` tag in the `<head>` element.
  See `deploy-commit-sha` skill for the pattern.

- **Solana attestation from GitHub and GitLab** — Wire up the
  Solana on-chain attestation job in both CI pipelines. See
  `solana-cicd-hash` skill for the drop-in job template.

- **Full line and branch test coverage** — Raise JaCoCo line
  and branch coverage thresholds to meaningful levels. Identify
  untested code paths and add tests to close gaps.
