<!-- markdownlint-disable MD013 MD036 -->
# Next

_Paused: 2026-04-20_

## What was done this session

- Deleted stale `solana-attestation` branches (local + both remotes)
- Added RFC 3161 timestamping via Sigstore TSA to `attest.mjs`
  (dual-chain: Solana + RFC 3161, same SHA-256 hash, fail-soft)
- Updated both GitHub Actions and GitLab CI artifact paths for
  TSR + cert chain
- Added TSA documentation to README
- Upgraded Node 20 -> 22 (22.22.2 LTS) across all 8 locations:
  CI workflows, GitLab pipeline, pom.xml, container images

## Current state

- **Branch:** `master`
- **Uncommitted changes:** Node 22 upgrade (ready to commit)
- **Open PRs/MRs:** none

## What's next

**Spring Boot 3 migration** — Migrate from EOL Spring Boot 2.7.18
to Spring Boot 3.x (Jakarta namespace). Currently held together
with BOM property overrides for CVE remediation.

## Blockers

None.

## Starter prompt

> Working on javasprang at /Users/daviddoolin/src/javasprang,
> a Spring Boot + Angular todo app with CI on both GitHub Actions
> and GitLab. Last session added Sigstore TSA timestamping and
> upgraded Node to 22. Next priority is Spring Boot 3 migration
> (2.7.18 -> 3.x, Jakarta namespace). See .development/backlog.md
> for full backlog.
