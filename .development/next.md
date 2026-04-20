<!-- markdownlint-disable MD013 MD036 -->
# Next

_Paused: 2026-04-19 20:30_

## What was done this session

- Made GitLab CI golden pipeline functional (entrypoint
  overrides, Chrome install, workflow:rules, audit events,
  image pinning)
- Added Solana attestation job to GitHub Actions with
  configurable provenance
- Added Solana attestation job to GitLab CI (merged via MR)
- Created OIDC IAM roles for both GitHub and GitLab in
  form-terra
- Set all secrets/variables on both GitHub and GitLab
- Fed GitLab CI lessons back into the golden pipeline skill
  (PR merged)
- Scaffolded .development project management
- Populated backlog with 13 items
- Created pause-session skill in dave-skills
- Set deploy-on-demand and CI speed as top priorities

## Current state

- **Branch:** `master` (1 commit ahead of origin — backlog
  and planning updates)
- **Uncommitted changes:** none
- **Stale branch:** `solana-attestation` can be deleted
  (MR merged)
- **Open PRs/MRs:** none
- **Waiting on:** GitHub Actions pipeline to run attest job
  on master (the `refs/heads/main` -> `master` fix is
  committed but needs to be pushed)
- **dave-skills:** pause-session skill committed to master,
  not yet pushed

## What's next

Push master to both origin (GitHub) and gitlab remotes, then
verify the attest job runs on the next master push to GitHub.
Delete the stale `solana-attestation` branch. Then start on
the custom Docker CI image to get pipeline time under 5
minutes.

## Blockers

None.

## Starter prompt

> Working on javasprang at /Users/daviddoolin/src/javasprang,
> a Spring Boot + Angular todo app with CI on both GitHub
> Actions and GitLab. Last session added Solana attestation
> to both pipelines and set deploy-on-demand as top priority.
> Master has unpushed commits — push to origin and gitlab
> first. Verify the GitHub attest job runs on master (was
> skipped due to main/master ref mismatch, now fixed). Then
> start on the custom Docker CI image to cut pipeline time
> under 5 minutes. See .development/backlog.md and
> .development/planning.md for context.
