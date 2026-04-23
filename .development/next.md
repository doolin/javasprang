<!-- markdownlint-disable MD013 MD036 -->
# What I Must Not Forget

_I write this because I will not remember. The man who reads
this tomorrow will be me, but he will not know what I know
now. These are the things I learned today that he will need._

_Paused: 2026-04-22_

## The pipeline speaks, but does it say enough?

We built a compliance pipeline that emits OSCAL documents,
SBOMs, scan results, audit events, attestations. All seven
evidence gaps identified in the oscal repo's artifact mapping
are now closed — on both the GitHub and GitLab pipelines.
Retention metadata tags every manifest entry. The evidence
bundle is real and verifiable.

But the OMB memos deserve closer reading. M-26-05 rescinded
M-22-18 and M-23-16. The old regime required attestation;
the new one asks for risk-based assurance. We built the
artifacts for the old world and labeled them for the new one.
Whether this pipeline is ahead of the requirement or just
differently shaped compliance theater depends on understanding
what "risk-based software assurance" actually demands. The
memos are downloaded in `../oscal/data/omb/`. Read them
with adversarial eyes.

## OSCAL is deeper than what we emit

We generate three documents: assessment-results,
component-definition, ssp-fragment. The OSCAL spec supports
assessment plans, POA&Ms, continuous monitoring records,
catalog and profile layers. What we emit is the minimum
viable evidence set. If this is meant to be a reference
implementation — and the skill in dave-skills suggests it
is — then the gap between what we generate and what OSCAL
can express is worth understanding. The spec is at
pages.nist.gov/OSCAL/reference/.

## The branch coverage ceiling is real

We reached 88.3% branch coverage (53/60). The remaining 7
branches are `Objects.equals` internal short-circuits and a
`validateToken` `&&` that throws before reaching its second
operand. JaCoCo counts bytecode branches, not source
branches. Understanding `javap -c` output on the entity
classes would clarify whether 88% is genuinely 100% or
whether the equals methods should be restructured.
The answer matters for the AGENTS.md policy.

## Solana is still on devnet

There is a memory note about switching to mainnet. Before
doing that: key management (who holds the keypair, how is it
rotated), transaction costs (memo program is cheap but not
free), availability (what happens to the pipeline if Solana
RPC is down — the attestation step is fault-tolerant but
the evidence record will have a gap). Check Binance for
mainnet SOL pricing and plan the operational model before
flipping the network variable.

## Spring Boot 2.7 is end-of-life

The pom.xml has comments documenting CVE overrides for
transitive dependencies pinned by the Spring Boot 2.7 BOM.
This is a ticking clock. The migration to Spring Boot 3.x
requires javax-to-jakarta namespace changes across every
entity, controller, DTO, and validation annotation. Every
`javax.persistence` becomes `jakarta.persistence`. Every
`javax.validation` becomes `jakarta.validation`. It touches
nearly every Java file in the project. Plan it before it
becomes urgent.

## Lombok is gone

We removed it. The entities and DTOs have explicit getters,
setters, equals, hashCode, toString. The phantom 242 JaCoCo
branches collapsed to 60 real ones. Do not re-add it. The
commit message on that PR explains why.

## Linting is in place but relaxed

Checkstyle runs on Java with a Google-style base, heavily
relaxed to pass the current codebase. ESLint + Prettier run
on the Angular frontend. Both are in the golden pipeline.
The next step is tightening rules incrementally — each
tightening is a PR that also fixes the violations it
catches.

## The test infrastructure works

128 tests. 99.3% line coverage. All `@DataJpaTest` classes
use `@ActiveProfiles("test")` and
`@Import(TestJpaConfig.class)` so JPA auditing works in the
H2 test context. DDL mode is `create` not `create-drop` to
avoid spurious warnings. Not-found cases return 404 via
`ResourceNotFoundException` with `@ResponseStatus`. The
full-stack e2e runs in Docker Compose: Postgres, Spring Boot
JAR, Playwright, seed data, no mocks.

## What was done 2026-04-22

- Closed all 7 evidence gaps (PRs #8-12) on GitHub pipeline
- Mirrored all gap closures to GitLab CI (MR !3)
- Added artifact-class and retention-class to manifest (MR !4)
- Added full-stack e2e tests in Docker Compose (PR #14)
- Removed Lombok from all 7 classes (PR #15)
- Wrote 128 tests across 4 incremental PRs (#16-20)
- Fixed not-found to return 404, moved @EnableJpaAuditing
  to JpaConfig, eliminated DDL warnings (PR #21)
- Added Checkstyle for Java (PR #22)
- Added ESLint + Prettier for Angular (PR #23)
- Wired gitleaks findings into OSCAL as SI-3 observations
- Added compliance assessment docs and control mapping table
  to README with 800-53, SSDF, STIG, and OMB columns
- Updated AGENTS.md with 100% coverage policy
- Updated dave-skills golden pipeline skill to require
  gitleaks as OSCAL input

## What was done 2026-04-20

- Deleted stale `solana-attestation` branches
- Added RFC 3161 timestamping via Sigstore TSA
- Updated both CI platforms for TSR + cert chain
- Upgraded Node 20 -> 22 LTS (22.22.2)

## Current state

- **Branch:** `master`
- **Open PRs:** #23 (ESLint + Prettier, CI running)
- **Tests:** 128 passing, 99.3% lines, 88.3% branches
- **Linting:** Checkstyle (Java), ESLint + Prettier (Angular)
- **Both pipelines:** GitHub Actions and GitLab CI at parity

## What the man who wakes up should do next

Pick one:

- **Tighten linting** — enable one Checkstyle or ESLint
  rule, fix the violations, PR. Repeat.
- **Frontend branch coverage** — currently 55.6%. Same
  incremental approach that worked for Java.
- **Spring Boot 3 migration** — the largest single piece
  of technical debt. Start with a spike branch.
- **Read the OMB memos** — understand the policy context
  before building more compliance machinery.
- **OSCAL enrichment** — assessment plans, POA&Ms, deeper
  control mappings.

Or build features. The Kanban board works. The auth works.
The pipeline proves it. Maybe it is time to build something
that matters to a user who is not an auditor.

## Starter prompt

> Working on javasprang, a Spring Boot + Angular todo app
> with CI on GitHub Actions and GitLab. All 7 evidence gaps
> closed, 128 tests at 99% lines / 88% branches, Checkstyle
> and ESLint in the pipeline. Read .development/next.md for
> full context. It was written for you, by you.
