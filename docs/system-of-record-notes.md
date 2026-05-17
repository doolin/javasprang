# Pipeline Artifact System of Record — Notes on Compliant Retention

These notes characterize a compliant system of record (SoR) for
pipeline-emitted artifacts, describe three structural patterns such a system
can take, and map each artifact currently emitted by the CI/CD pipeline to the
controls and disposition authorities that apply.

The reference baseline is FIPS 199 Moderate (SP 800-53B), the SP 800-218 SSDF
practices appropriate to the development lifecycle of a federal application,
and NARA General Records Schedules 3.1 (General Technology Management Records)
and 3.2 (Information Systems Security Records) where they apply.

The artifact inventory in §3 is what the pipeline emits today: the union of
files uploaded to S3 by `scripts/attest.mjs`, the OSCAL artifacts of
organizational interest, and a small number of artifacts that are produced but
not currently retained in any agency-controlled location.

## 1. Characterization — properties of a compliant SoR

A compliant system of record for pipeline-emitted evidence must hold the
properties below at the level required by FIPS 199 Moderate. Each property is
satisfied by a *combination* of storage substrate, pipeline emission
discipline, and operational process. The structural patterns described in §2
satisfy these properties to differing extents; each pattern satisfies some
properties natively and defers others to compensating process or to an
adjacent system.

### 1.1 Integrity

The SoR must demonstrate that each retained artifact is bit-identical to what
the pipeline produced. Demonstration is satisfied by a chain of cryptographic
checksums anchored to a tamper-evident reference: an RFC 3161 trusted timestamp
over the artifact's SHA-256, an immutable external anchor (e.g., the on-chain
memo emitted by `scripts/attest.mjs`), or a write-once-read-many storage mode
that prevents post-write mutation. SP 800-53 SI-7(1) and AU-9(2) speak to this
property; SSDF PS.3.1 makes integrity verification a per-release obligation.

### 1.2 Provenance and chain of custody

The SoR must record, for each retained artifact, which pipeline run produced
it, against which commit, by which job, at what time, and (where applicable)
how it transited from emission point to retention point. SLSA build provenance,
the `evidence-manifest.json` file → SHA-256 → producing-job mapping, and the
S3 upload receipt are the primary provenance instruments today. SSDF PW.9.1
(documented build environment) and SP 800-53 SR-4 (provenance) are the
governing references.

### 1.3 Non-repudiation

The SoR must prevent the producer of an artifact from later denying production.
A digital signature, an RFC 3161 timestamp from a trusted TSA, and an on-chain
anchor are the three non-repudiation mechanisms currently in the pipeline's
output stream. SP 800-53 AU-10 and AU-10(1) frame the requirement; the
operational pattern is the combination of TSA timestamp plus blockchain memo
emitted at attest time.

### 1.4 Confidentiality

The SoR must protect artifacts whose disclosure would assist an attacker.
`gitleaks-report.json` (which may quote the leaked credential), `npm-audit.json`
and `trivy-results.json` (which enumerate exploitable conditions in the
delivered binary), and any artifact that names an exploit path are all
sensitivity-bearing. Encryption at rest, KMS-managed keys, and access control
aligned to the record's sensitivity tier satisfy SP 800-53 SC-28 and AC-3.

### 1.5 Availability and backup

The SoR must retain artifacts for the assigned disposition period without loss.
A single-substrate storage solution does not satisfy SP 800-53 AU-9(2) (backup
of audit information on a physically separate system); a backup or
cross-region-replicated copy is required. Retention periods range from
"destroy when no longer needed" (some GRS 3.2 sub-items) to six years after
authorization superseded (SSP and assessment-result records).

### 1.6 Retention and disposition

The SoR must apply a defined retention period to every retained record and
must be capable of executing the disposition obligation when the period
expires. The disposition authority is per-record-type, not per-bucket: a SBOM
under GRS 3.1/020 has different retention than an SSP under GRS 3.2/010, and
both differ from a fleet of incident-handling records under GRS 3.2/020.
SP 800-53 AU-11 (audit record retention) is the control reference; GRS 3.1
and 3.2 are the disposition authorities.

### 1.7 Custody (agency vs. third-party)

The SoR must identify, for each retained artifact, whether custody is held by
the agency or by a third party. Third-party custody (GitHub's attestations
registry, GitLab job artifacts, the Solana ledger on mainnet) does not
automatically satisfy federal-records custody requirements. Records-officer
determinations are required where custody is ambiguous; see §3 notes.

### 1.8 Discoverability and search

The SoR must allow an auditor to locate evidence by query terms an auditor
would naturally use: commit SHA, pipeline run ID, finding identifier (CVE,
secret-pattern hit), or date range. A pure object store satisfies content
addressability but not query-by-content; a parallel index (CloudTrail +
Athena, OpenSearch, a metadata table) is required to satisfy auditor
expectations within reasonable response time.

### 1.9 Auditability of access and operations

The SoR must record who accessed what, when, and from where. This is distinct
from the pipeline's audit log of artifact *production*; it is the SoR's audit
log of artifact *access and retrieval*. SP 800-53 AU-12 (audit record
generation) and AU-2 (event logging) apply.

### 1.10 Disposition enforceability

The SoR must be operationally capable of executing the "destroy" obligation
when a retention period expires. This property is the one that most
distinguishes substrates: S3 with Object Lock can satisfy it (Object Lock
retention runs out, then the object becomes deletable); a public blockchain
ledger on mainnet cannot — there is no operational mechanism to destroy a
confirmed on-chain memo. GRS Temporary dispositions are not satisfiable
against immutable third-party state.

## 2. Three structural patterns

A pipeline-artifact SoR can be structured in any of the three patterns below.
Each is described in terms of its mechanism, the §1 properties it satisfies
natively, and the §1 properties that require compensating process.

**Cadence constraint.** The viability of each pattern depends on the release
cadence the SoR is required to support. Patterns that presuppose synchronous
review at release time — artifact collection and inspection completed before
the release proceeds — are viable only under release cadences slow enough to
accommodate that review. Patterns that accommodate asynchronous review — the
artifact-generation system is approved up front and its outputs are audited
on whatever schedule the reviewer chooses — are viable under any cadence,
including deployment on demand. §2.2a presupposes synchronous review and is
therefore not viable under continuous CD. §2.1, §2.2b, and §2.3 each
accommodate asynchronous review and are viable under any cadence.

### 2.1 Pattern 1 — GitLab as system of record

**Mechanism.** Pipeline-emitted artifacts are retained in GitLab's native
substrates: job artifacts (`artifacts:paths:` with `expire_in`), the Package
Registry, the Container Registry, and Releases.

**Properties satisfied natively.** Provenance is satisfied within the GitLab
project (pipeline → job → artifact path is one click). Integrity is satisfied
at the platform-vendor level (GitLab is responsible). Auditability of access
is available through GitLab's audit events (Premium tier and above).

**Properties requiring compensating process.** Retention (1.6) is bounded by
GitLab's `expire_in` semantics and tier-dependent storage limits; achieving
GRS-driven retention of 5–6 years for SSPs, assessment results, and
authorization records exceeds reasonable defaults. Backup (1.5) is not
addressed unless artifacts are mirrored to a second substrate. Disposition
enforceability (1.10) is partial — `expire_in` enforces a single deletion
date, not per-record-type retention. Custody (1.7) sits with GitLab.com (or
the self-hosted instance operator); the federal-records implications need
records-officer treatment.

**Operational characteristics.** Cross-forge mirroring (the springboard
project's current GitHub-mirror posture) doubles the custody question:
which substrate is authoritative? GitLab's pipeline-artifact retention
also competes for the same minute/storage budget as the pipeline itself,
which is currently under freeze (see `project_pipeline_gate_freeze.md`).

### 2.2 Pattern 2 — Distributed delivery to consumers

This pattern has two sub-variants, described separately because their
compliance characteristics differ.

#### 2.2a Sub-variant a: ad-hoc, big-bang

**Mechanism.** Artifacts are emitted by the pipeline but not centrally
retained. Consumers (security team, compliance assessor, release engineer)
capture what they need at release time. Capture is typically manual: PDF
exports, screenshots, ad-hoc bundles assembled around a release event.
Continuous-emission artifacts are mostly ignored between releases.

**Properties satisfied natively.** None, with respect to the §1
characterization. The pattern describes the absence of a centralized SoR
rather than a realization of one.

**Properties requiring compensating process.** All of them. Retention (1.6)
is incidental to whatever each consumer captured. Backup (1.5) is absent.
Discoverability (1.8) is non-existent across consumer boundaries.
Disposition enforceability (1.10) cannot be asserted because the set of
extant copies is not known.

**Operational characteristics.** This is the pattern most familiar to teams
operating under big-bang release cadence; it is described here for
completeness.

#### 2.2b Sub-variant b: consumer-push with late binding

**Mechanism.** The pipeline pushes each emitted artifact to one or more
registered consumers at emission time. Consumers subscribe to artifact
types or to pipeline events. The consumer for a given artifact may not be
known at pipeline-design time; a subscription layer mediates between
emission and delivery. Examples of consumers: a security team's
ticket-management system receives `gitleaks-report.json` and
`trivy-results.json`; a compliance index receives the OSCAL bundle; a
release-management tool receives the JAR + SLSA provenance.

**Properties satisfied natively.** Provenance (1.2) is satisfied at
emission time. Continuous emission (rather than big-bang) is the principal
operational property gained over §2.2a.

**Properties requiring compensating process.** Retention obligation (1.6)
transfers to each consumer. The SoR becomes federated: there is no single
location that holds the full set of retained evidence, and demonstrating
completeness to an auditor requires querying every consumer. Disposition
enforceability (1.10) is distributed across N consumers, each of which must
honor the per-record-type retention period independently. Custody (1.7)
becomes a per-consumer determination.

**Failure modes specific to this variant.**

- *Unregistered consumer at emission time.* If no consumer is subscribed to
  an artifact type when the pipeline emits, the artifact has no destination.
  Push-and-forget yields silent evidence loss; push-and-cache (pipeline
  retains for a buffer window pending subscription) defers but does not
  eliminate the problem.
- *Subscription drift.* A consumer that unsubscribes mid-retention-period
  leaves the agency without that copy of the record, with no notification.
- *Audit-completeness query.* Demonstrating to an auditor that *every*
  emitted artifact reached a retained location requires either a central
  delivery log (which is itself a partial SoR) or per-consumer attestation.
- *Per-record-type disposition.* GRS retention varies by item; a consumer
  receiving a heterogeneous stream must apply disposition per-artifact, not
  per-consumer. This is operationally non-trivial.

**Operational characteristics.** The two sub-variants of §2.2 have different
compliance profiles and are described separately for that reason.

### 2.3 Pattern 3 — Centralized S3 with appropriate configuration

**Mechanism.** Pipeline-emitted artifacts are uploaded to a small set of
S3 buckets configured for compliance use: Object Lock in compliance mode
(per-object WORM retention), versioning, MFA-delete, KMS-managed
server-side encryption (SSE-KMS) with customer-managed keys, block-public-
access at bucket and account level, and lifecycle policies aligned per
prefix to the GRS disposition authority for the records under that prefix.
Multi-region replication satisfies the backup-on-separate-system
requirement of AU-9(2). CloudTrail data events on the bucket plus Athena
queries satisfy access auditability (1.9) and discoverability (1.8).
`scripts/attest.mjs` already implements this upload path; the configuration
discipline around the destination buckets is what this pattern names.

**Properties satisfied natively.** Integrity (1.1) via SHA-256 +
RFC 3161 + Solana anchor + S3 ETag and Object Lock. Confidentiality (1.4)
via SSE-KMS + IAM. Availability (1.5) via cross-region replication.
Disposition enforceability (1.10) via Object Lock retention runout. Custody
(1.7) is single-custodian (the agency AWS account).

**Properties requiring compensating process.** Retention (1.6) requires
per-record-type lifecycle and Object Lock retention configuration; a single
uniform retention across the bucket would over- or under-retain various
record types. Discoverability (1.8) is content-addressable by S3 key by
default; satisfying auditor query patterns (by CVE ID, by commit, by
finding type) requires an index layer (a metadata table, Athena over
inventory, or OpenSearch). Disposition enforceability is one-way under
Object Lock compliance mode: a retention period set too long cannot be
shortened, and an object placed under retention cannot be deleted by any
principal, including the AWS root account, until the period expires.

**Operational characteristics.** The Solana memo path (mainnet-bound)
remains a records-officer determination irrespective of S3 configuration.
Centralizing on S3 does not resolve the disposition-enforceability question
for blockchain anchors; it removes the question from the S3 layer only.
Vendor coupling is to AWS.

### 2.4 Properties matrix across patterns

The matrix below summarizes which §1 properties each pattern satisfies
natively (●), satisfies via compensating process (○), or does not satisfy (—).

| §1 property | 2.1 GitLab | 2.2a Ad-hoc | 2.2b Push (late-bind) | 2.3 Centralized S3 |
|---|---|---|---|---|
| 1.1 Integrity | ● | — | ○ | ● |
| 1.2 Provenance | ● | — | ● | ● |
| 1.3 Non-repudiation | ○ | — | ○ | ● |
| 1.4 Confidentiality | ● | — | ○ | ● |
| 1.5 Availability + backup | ○ | — | ○ | ● |
| 1.6 Retention | ○ | — | ○ (per-consumer) | ● (per-prefix) |
| 1.7 Custody | ○ (3rd-party) | — | ○ (federated) | ● (agency) |
| 1.8 Discoverability | ○ | — | ○ | ○ (index layer) |
| 1.9 Access auditability | ● | — | ○ (per-consumer) | ● (CloudTrail) |
| 1.10 Disposition enforceability | ○ | — | ○ | ● (Object Lock) |

## 3. Per-artifact mapping

Each artifact emitted by the current pipeline is mapped below to the primary
NIST SP 800-53 Rev 5 controls it instantiates or provides evidence for, the
SP 800-218 SSDF practice(s) it satisfies, the applicable NARA GRS schedule
and disposition authority item, and the retention period assigned by that
item. The table is informational; citing a control here does not assert that
the control is *currently enforced* in the pipeline, only that the artifact
is the evidence the control would be assessed against, or is itself an
instantiation of the control.

| # | Artifact | SP 800-53 Rev 5 controls | SP 800-218 SSDF practice(s) | GRS schedule + item | Retention period |
|---|---|---|---|---|---|
| 1 | `gitleaks-report.json` | **IA-5(7)** (no embedded credentials); SA-11(1), SI-3, CM-3(2) | **PW.5.1** (scan for secrets/sensitive data before release); PO.3.2, RV.1.1 | **Primary:** GRS 3.2/010 (security testing sub-item). **Alt:** GRS 3.2/020 if findings open an incident. | Temporary. Destroy 3 yr after final action (security ops sub-item of 3.2/010); extend to incident-record retention if applicable. |
| 2 | `trivy-results.json` | **SI-2(2)** (automated flaw remediation); RA-5(2), SA-11(1), SI-2 | **RV.1.1** (vulnerability identification + suppression rationale); RV.1.2, PW.4.1 | **Primary:** GRS 3.2/010 (vulnerability management sub-item). **Alt:** GRS 3.1/060 (IT oversight) for the suppression-rationale aspect. | Temporary. Destroy 6 yr after superseded (authorization-support sub-item); suppression rationale may extend to authorization lifecycle. |
| 3 | `npm-audit.json` | **RA-5** (vulnerability scanning); SI-2, SA-11(1), SI-2(2) | **RV.1.1** (frontend dependency vulnerability identification); RV.1.2, PW.4.1 | **Primary:** GRS 3.2/010 (security assessment sub-item). **Alt:** GRS 3.1/040 (IT operations and maintenance). | Temporary. Destroy 3 yr after final action under 3.2/010 security-ops sub-item, or 3 yr after final action under 3.1/040. |
| 4 | `sbom.cyclonedx.json` | **CM-8(6)** (component inventory — software); SA-12, CM-8, SR-3 | **PW.4.1** (identify and document software components); RV.1.1, PS.3.1 | **Primary:** GRS 3.1/020 (IT system development records — component inventory). **Alt:** GRS 3.2/010 (security baseline supporting authorization). | Temporary. Destroy 5 yr after system decommissioned/replaced under 3.1/020; or 6 yr after authorization superseded under 3.2/010. |
| 5 | OSCAL component-definition | **SA-4(2)** (design/implementation info); PL-2, SA-3, CA-2 | **PO.3.2** (implement security requirements); PO.1.2, PS.1.1 | **Primary:** GRS 3.2/010 (control implementation, authorization-package sub-item). **Alt:** GRS 3.1/020. | Temporary. Destroy 6 yr after superseded under 3.2/010 authorization-records sub-item. |
| 6 | OSCAL SSP | **PL-2** (system security plan); CA-7, SA-4, PL-8 | **PO.3.1** (define + document security requirements); PO.3.2, PO.1.1 | **Primary:** GRS 3.2/010 (system security plan — core authorization-package record). | Temporary. Destroy 6 yr after system decommissioned or authorization superseded (per NIST SP 800-18 lifecycle). |
| 7 | OSCAL assessment-results | **CA-2(2)** (specialized assessment — automated); CA-7, CA-2, AU-6 | **RV.1.1** (automated control assessment findings); PO.3.2, RV.1.3 | **Primary:** GRS 3.2/010 (security assessment and authorization records). **Alt:** GRS 3.1/060. | Temporary. Destroy 6 yr after superseded under 3.2/010; or 5 yr after final action under 3.1/060. |
| 8 | `evidence-manifest.json` | **AU-10** (non-repudiation — file-to-job chain); SI-7(1), CM-3, AU-12 | **PS.3.1** (verify integrity via checksums); PS.2.1, PO.3.2 | **Primary:** GRS 3.1/040 (IT ops + maintenance — build/deployment audit trail). **Alt:** GRS 3.2/010 (integrity verification supporting authorization). | Temporary. Destroy 3 yr after final action under 3.1/040. |
| 9 | `target/*.jar` + `.sha256` | **SI-7(1)** (software integrity checks); CM-3(1), SA-12, CM-8 | **PS.2.1** (release integrity; checksum enables tamper detection); PS.3.1, PW.9.2 | **Primary:** GRS 3.1/020 (IT system development records — deliverable artifact). **Alt:** GRS 3.1/040 (ops baseline image). | Temporary. Destroy 5 yr after system replaced/decommissioned under 3.1/020. Record-officer determination if binary is baseline for a permanent system. |
| 10 | `version.json` | **CM-3(1)** (automated change document); SI-7, AU-12, CM-6 | **PS.3.1** (bind commit + run ID + timestamp to artifact); PW.9.1, PS.2.1 | **Primary:** GRS 3.1/040 (IT operations and maintenance). **Alt:** GRS 3.1/030 (configuration and change management). | Temporary. Destroy 3 yr after final action under 3.1/040; or 5 yr after final action under 3.1/030. |
| 11 | SLSA build provenance | **SA-12(4)** (provenance — supply chain); SR-4, SI-7(6), CM-3 | **PW.9.1** (document and record build environment); PS.3.1, PS.2.1 | **Primary:** GRS 3.2/010 (supply-chain integrity / authorization-support). **Alt:** GRS 3.1/020. **Note:** custody is GitHub's attestation registry, not agency S3 — record-officer determination needed. | Temporary. Destroy 6 yr after authorization superseded under 3.2/010, contingent on resolved custody. |
| 12 | `ci-artifacts.zip` | **AU-9(2)** (backup of audit records); SI-7(1), AU-11, AU-9 | **PS.2.1** (sealed bundle, integrity across handoff); PS.3.1, PO.3.2 | **Primary:** GRS 3.2/010 (authorization-package bundle). **Alt:** GRS 3.1/040. | Temporary. Destroy 6 yr after authorization superseded (longest-lived constituent drives the bundle). |
| 13 | `attestation.pdf` | **AU-10** (non-repudiation — human-readable); AU-12, AU-9, CA-2 | **PS.2.1** (human-readable release integrity statement); PS.3.1, PO.3.2 | **Primary:** GRS 3.2/010 (authorization-package documentation). **Alt:** GRS 3.1/060. | Temporary. Destroy 6 yr after authorization superseded under 3.2/010. |
| 14 | `attestation.json` (NOT in S3 today) | **AU-10** (non-repudiation — machine-readable); AU-12, SI-7, CA-7 | **PS.2.1** (machine-readable release integrity record); PS.3.1, PO.3.2 | **Primary:** GRS 3.2/010 (same as #13). **Note:** not yet in agency custody — until ingested it is not a federal record. | Once in agency custody: 6 yr after authorization superseded. Record-officer determination needed on the current custody gap. |
| 15 | `timestamp.tsr` + `tsa-certchain.pem` | **AU-10(1)** (association of identity — RFC 3161 binding); AU-9, AU-11, SI-7(1) | **PS.2.1** (trusted timestamp proves pre-release existence); PS.3.1, PO.3.2 | **Primary:** GRS 3.2/010 (integrity / non-repudiation supporting authorization). **Alt:** GRS 3.2/060–062 (PKI-adjacent transaction). | Temporary. Tie to the bundle anchored — destroy with bundle (6 yr after authorization superseded). |
| 16 | `s3-receipt.json` (NOT in S3 today) | **AU-12(1)** (system-wide / time-correlated trail); AU-9, AU-10, AU-11 | **PS.2.1** (artifact reached authorized distribution); PS.3.1, PO.3.2 | **Primary:** GRS 3.1/040 (IT ops + maintenance — upload/transfer audit log). **Note:** currently local-only; same custody gap as #14. | Temporary. Destroy 3 yr after final action under 3.1/040 once in agency custody. Record-officer determination needed while local-only. |
| 17 | Solana memo transaction | **AU-9(3)** (cryptographic protection of audit info — external anchor); AU-10, AU-11, SC-28 | **PS.2.1** (immutable external anchor for non-repudiation); PS.3.1, PO.3.2 | **Record-officer determination required.** No GRS 3.x item contemplates immutable distributed-ledger storage. Closest analog: GRS 3.2/010 integrity-anchor or GRS 3.1/040. | No GRS item cleanly applies. Mainnet promotion is operationally incompatible with Temporary "destroy" dispositions (see §1.10). |

### 3.1 Table notes

**Records-officer determinations flagged.**

- **Row 11 (SLSA provenance)** — Custody is GitHub's attestations registry,
  not agency-controlled storage. Whether this constitutes a federal record in
  third-party custody (and whether transfer to agency-controlled storage is
  required) needs records-officer treatment.
- **Rows 14 and 16 (`attestation.json`, `s3-receipt.json`)** — Produced by
  the pipeline but not currently ingested into any agency-controlled
  location. Federal-records status is ambiguous until an ingest path is
  defined. Both items are S3-addressable for cost, simply not yet wired in.
- **Row 9 (JAR binary)** — If the deployed system is the production
  baseline for a record series classified as permanent under another GRS
  item, related technical documentation may be permanent under GRS 3.1/050.
  The binary itself is normally temporary; records-officer confirmation is
  the resolution path.
- **Row 17 (Solana memo)** — No GRS 3.x item contemplates immutable
  distributed-ledger storage. The "destroy" obligation in a Temporary
  disposition cannot be executed against confirmed mainnet state. Resolution
  requires records-officer and legal-counsel determination before mainnet
  promotion. The devnet posture defers but does not resolve the question.

**GRS interpretation flags.**

- **GRS 3.2/010** is currently marked in the NARA machine-implementable CSV
  (Transmittal 36, August 2024) as "not machine-implementable and will be
  revised." This is the umbrella item covering SSPs, authorization records,
  risk assessments, security operations, and contingency plans. The retention
  values cited above (typically 6 years after superseded for authorization /
  SSP sub-items; 3 years after final action for security-ops sub-items)
  reflect the pre-revision schedule. A revised 3.2/010 may disaggregate
  these into separately schedulable items, which would refine several rows.
- **GRS 3.2/035–036** (cybersecurity logging) were revised by Transmittal 33
  (January 2023) to align with OMB M-21-31. None of the artifacts in §3 map
  to these items today, but the SoR's own access logs (§1.9) will.

**Transmittal verification.** GRS 3.1 — Transmittal 30 (December 2019, last
revision). GRS 3.2 — Transmittal 33 (January 2023, last revision).
Machine-implementable CSV — Transmittal 36 (August 2024). Sources:
https://www.archives.gov/records-mgmt/grs.html;
https://www.archives.gov/files/records-mgmt/grs/grs-csv-transmittal36.csv.

## 4. Items not addressed by characterization

The §1 characterization and §3 mapping identify the properties a compliant SoR
must hold and the disposition authorities that apply to each artifact. They do
not specify implementation details. The items below are identified by the
characterization as requiring further definition outside the scope of these
notes.

1. **Custody mechanism for third-party-resident artifacts.** SLSA provenance
   (GitHub attestations registry) and the Solana memo (devnet/mainnet) sit
   outside agency-controlled storage today. The mechanism by which agency
   custody is established (mirror, ingest, escrow) requires records-officer
   determination.
2. **Mainnet posture for the Solana anchor.** Promotion of the Solana memo
   from devnet to mainnet converts the disposition-enforceability problem
   (§1.10, row 17) from theoretical to operational. The records-status of
   on-chain anchors requires records-officer and legal-counsel determination.
3. **Ingest path for `attestation.json` and `s3-receipt.json`.** Both are
   produced today but not retained. Records-status follows from whether they
   are ingested into agency-controlled storage.
4. **Disposition granularity under §2.3.** Per-record-type retention via
   prefix lifecycle policies is required to align Object Lock retention
   periods with the GRS disposition authority for each artifact type. A
   uniform bucket-wide retention over- or under-retains across record types.
5. **Index layer for discoverability (§1.8).** Each of §2.1, §2.2b, and §2.3
   requires an index to satisfy auditor query patterns. The index choice and
   the freshness mechanism are out of scope here.
6. **Backup substrate for AU-9(2).** A single-substrate design does not
   satisfy AU-9(2). The secondary substrate (cross-region S3 replication,
   cross-cloud mirror, offline cold storage) and the verification cadence
   are out of scope here.
