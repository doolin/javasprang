# Control-to-Artifact Reverse Mapping

This document is the inverse of §3 of [`docs/system-of-record-notes.md`](../system-of-record-notes.md). The §3
table lists each pipeline-emitted artifact and the controls/practices/items it
evidences. This document inverts that direction: for each control identifier
cited in §3, it quotes the authoritative text and identifies the artifact(s)
that discharge the obligation, with an explicit rationale per artifact.

The shape an assessor walks is `control → evidence`. The §3 table's
per-artifact form documents the producer's view; this document documents the
assessor's view.

## Sources

- **NIST SP 800-53 Rev 5** controls — quoted text from the [official OSCAL
  catalog](https://github.com/usnistgov/oscal-content/tree/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_catalog.json)
  (machine-readable). Per-control links resolve directly to the [SP 800-53r5
  PDF](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r5.pdf)
  with a `#page=N` fragment landing on the page where the control statement
  appears.
- **NIST SP 800-218 v1.1** (SSDF) practices — quoted text from the [SP
  800-218 v1.1
  PDF](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-218.pdf)
  with per-page fragments where applicable.
- **NARA General Records Schedules 3.1 and 3.2** — quoted text from [GRS 3.1
  Transmittal 30](https://www.archives.gov/files/records-mgmt/grs/grs03-1.pdf)
  and [GRS 3.2 Transmittal
  33](https://www.archives.gov/files/records-mgmt/grs/grs03-2.pdf),
  cross-checked against the [machine-implementable CSV (Transmittal
  36)](https://www.archives.gov/files/records-mgmt/grs/grs-csv-transmittal36.csv).

ODP placeholders in NIST control text (e.g., `{{ insert: param, au-09_odp }}`)
are preserved verbatim as they appear in the OSCAL catalog. The document is
descriptive, not parameterized; the agency selects ODP values as part of its
control implementation.

## How to read each block

Each control, practice, or item carries:

- **Identifier and source publication.**
- **Direct link** to the authoritative text.
- **Quoted text** — verbatim from the source.
- **Artifacts from §3** — the rows in the §3 table that cite this control.
- **Rationale** — one to two sentences per artifact explaining how the
  artifact discharges the control text.

Artifacts referenced by row number are defined in [§3 of the SoR
notes](../system-of-record-notes.md#3-per-artifact-mapping).

## Findings surfaced during assembly

**Labeling error in §3 of the SoR notes — corrected in this same MR.** Rows
4, 9, and 11 of §3 of the SoR notes originally cited "GRS 3.1/020 (IT
system development records)." Item 3.1/020 is in fact *IT operations and
maintenance records* in both the PDF schedule (Transmittal 30) and the
machine-implementable CSV (Transmittal 36). The correct item for system
development records is **GRS 3.1/011** (DAA-GRS-2013-0005-0007). Both
documents — `docs/system-of-record-notes.md` §3 and the GRS section of this
document — now cite 3.1/011 for those three rows. The reconciliation
paragraph in §3.1 below preserves the historical record of the error.

**SA-12 and SA-12(4) withdrawn in Rev 5.** The §3 table cites SA-12 and
SA-12(4) directly. Both controls are withdrawn in Rev 5 and incorporated into
the SR family (SR-3, SR-4, SR-5; SR-3(1) for SA-12(4)). The NIST section
below preserves the withdrawn-control entries for citation traceability and
adds quoted text for the successor controls inline.

**GRS 3.2/010 pending revision.** The machine-implementable CSV (Transmittal
36) flags GRS 3.2/010 as "not machine-implementable and will be revised."
This is the umbrella item under which the largest number of §3 artifacts are
disposed. A future disaggregation may produce separately schedulable
sub-items for SSPs, assessment results, vulnerability scans, and
security-operations records. Retention values cited reflect the pre-revision
schedule.

---

## 1. NIST SP 800-53 Rev 5 — Controls

Controls appear in identifier order grouped by family: AC, AU, CA, CM, IA,
PL, RA, SA, SC, SI, SR. Withdrawn controls (SA-12, SA-12(4)) carry status
notes and point at successors.

### AC-3 — Access Enforcement

**Source:** NIST SP 800-53 Rev 5.
**Link:** [NIST SP 800-53r5 §AC-3 (p.50)](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r5.pdf#page=50)
**Quoted text:**
> Enforce approved authorizations for logical access to information and system resources in accordance with applicable access control policies.

**Artifacts from §3 that evidence this control:** Row 1 (`gitleaks-report.json`), Row 2 (`trivy-results.json`).
**Rationale (per artifact):**
- `gitleaks-report.json`: The report identifies credentials embedded in source or artifacts that, if present, would grant unauthorized logical access; its existence demonstrates that access-control posture was assessed for credential exposure before release.
- `trivy-results.json`: Trivy findings on the delivered binary enumerate vulnerabilities that could be exploited to bypass authorization enforcement; the scan record demonstrates the access-control surface was evaluated.

---

### AU-2 — Event Logging

**Source:** NIST SP 800-53 Rev 5.
**Link:** [NIST SP 800-53r5 §AU-2 (p.93)](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r5.pdf#page=93)
**Quoted text:**
> a. Identify the types of events that the system is capable of logging in support of the audit function: {{ insert: param, au-02_odp.01 }};
> b. Coordinate the event logging function with other organizational entities requiring audit-related information to guide and inform the selection criteria for events to be logged;
> c. Specify the following event types for logging within the system: {{ insert: param, au-2_prm_2 }};
> d. Provide a rationale for why the event types selected for logging are deemed to be adequate to support after-the-fact investigations of incidents; and
> e. Review and update the event types selected for logging {{ insert: param, au-02_odp.04 }}.

**Artifacts from §3 that evidence this control:** Row 16 (`s3-receipt.json`), Row 13 (`attestation.pdf`), Row 14 (`attestation.json`).
**Rationale (per artifact):**
- `s3-receipt.json`: The S3 upload receipt records the event of artifact transfer to the agency-controlled store, contributing to the access-and-operations event log required by AU-2c/AU-2d.
- `attestation.pdf` / `attestation.json`: The attestation records the pipeline-run event (artifact production) with sufficient fields (commit SHA, run ID, timestamp) to constitute a logged event for after-the-fact investigation.

---

### AU-6 — Audit Record Review, Analysis, and Reporting

**Source:** NIST SP 800-53 Rev 5.
**Link:** [NIST SP 800-53r5 §AU-6 (p.97)](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r5.pdf#page=97)
**Quoted text:**
> a. Review and analyze system audit records {{ insert: param, au-06_odp.01 }} for indications of {{ insert: param, au-06_odp.02 }} and the potential impact of the inappropriate or unusual activity;
> b. Report findings to {{ insert: param, au-06_odp.03 }}; and
> c. Adjust the level of audit record review, analysis, and reporting within the system when there is a change in risk based on law enforcement information, intelligence information, or other credible sources of information.

**Artifacts from §3 that evidence this control:** Row 7 (OSCAL assessment-results).
**Rationale (per artifact):**
- OSCAL assessment-results: The machine-readable assessment-results document provides the reviewed and analyzed control findings that AU-6b requires to be reported to designated personnel; automated generation supports the review-frequency obligation in AU-6a.

---

### AU-9 — Protection of Audit Information

**Source:** NIST SP 800-53 Rev 5.
**Link:** [NIST SP 800-53r5 §AU-9 (p.101)](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r5.pdf#page=101)
**Quoted text:**
> a. Protect audit information and audit logging tools from unauthorized access, modification, and deletion; and
> b. Alert {{ insert: param, au-09_odp }} upon detection of unauthorized access, modification, or deletion of audit information.

**Artifacts from §3 that evidence this control:** Row 12 (`ci-artifacts.zip`), Row 13 (`attestation.pdf`), Row 15 (`timestamp.tsr` + `tsa-certchain.pem`), Row 17 (Solana memo transaction).
**Rationale (per artifact):**
- `ci-artifacts.zip`: The sealed bundle aggregates audit artifacts; S3 Object Lock in compliance mode satisfies the "protect from unauthorized modification and deletion" obligation directly.
- `attestation.pdf`: The human-readable attestation record must itself be protected from post-production alteration; its SHA-256 checksum and RFC 3161 timestamp anchor provide the integrity seal AU-9a requires.
- `timestamp.tsr` + `tsa-certchain.pem`: The TSA timestamp chain is itself an audit-information artifact; storing it alongside the evidence bundle under Object Lock ensures it cannot be tampered with or deleted.
- Solana memo transaction: The on-chain anchor provides tamper-evident protection for the audit record hash, though its disposition-enforceability limitations (§1.10 of the SoR notes) must be resolved separately.

---

### AU-9(2) — Store on Separate Physical Systems or Components

**Source:** NIST SP 800-53 Rev 5.
**Link:** [NIST SP 800-53r5 §AU-9(2) (p.101)](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r5.pdf#page=101)
**Quoted text:**
> Store audit records {{ insert: param, au-09.02_odp }} in a repository that is part of a physically different system or system component than the system or component being audited.

**Artifacts from §3 that evidence this control:** Row 12 (`ci-artifacts.zip`).
**Rationale (per artifact):**
- `ci-artifacts.zip`: Cross-region S3 replication or a secondary cold-storage copy places the audit bundle on physically separate infrastructure from the GitLab runner or application host being audited, satisfying the separate-physical-system requirement.

---

### AU-9(3) — Cryptographic Protection

**Source:** NIST SP 800-53 Rev 5.
**Link:** [NIST SP 800-53r5 §AU-9(3) (p.101)](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r5.pdf#page=101)
**Quoted text:**
> Implement cryptographic mechanisms to protect the integrity of audit information and audit tools.

**Artifacts from §3 that evidence this control:** Row 17 (Solana memo transaction).
**Rationale (per artifact):**
- Solana memo transaction: The on-chain memo embeds a cryptographic hash of the evidence bundle committed to a public ledger, providing a cryptographic integrity mechanism for the audit record that is independent of the agency's own storage infrastructure.

---

### AU-10 — Non-repudiation

**Source:** NIST SP 800-53 Rev 5.
**Link:** [NIST SP 800-53r5 §AU-10 (p.103)](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r5.pdf#page=103)
**Quoted text:**
> Provide irrefutable evidence that an individual (or process acting on behalf of an individual) has performed {{ insert: param, au-10_odp }}.

**Artifacts from §3 that evidence this control:** Row 8 (`evidence-manifest.json`), Row 13 (`attestation.pdf`), Row 14 (`attestation.json`).
**Rationale (per artifact):**
- `evidence-manifest.json`: The manifest binds each artifact's SHA-256 to the specific pipeline job that produced it, providing irrefutable evidence that the named CI job performed the specified artifact-production actions.
- `attestation.pdf` / `attestation.json`: The RFC 3161 timestamp plus digital signature on the attestation document provides the irrefutable cryptographic linkage between the producing process and the artifact, satisfying the non-repudiation obligation.

---

### AU-10(1) — Association of Identities

**Source:** NIST SP 800-53 Rev 5.
**Link:** [NIST SP 800-53r5 §AU-10(1) (p.103)](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r5.pdf#page=103)
**Quoted text:**
> a. Bind the identity of the information producer with the information to {{ insert: param, au-10.01_odp }}; and
> b. Provide the means for authorized individuals to determine the identity of the producer of the information.

**Artifacts from §3 that evidence this control:** Row 15 (`timestamp.tsr` + `tsa-certchain.pem`).
**Rationale (per artifact):**
- `timestamp.tsr` + `tsa-certchain.pem`: The RFC 3161 timestamp token cryptographically binds the producing pipeline run's artifact hash to a trusted timestamp authority's identity at a specific moment; the certificate chain provides the means for authorized individuals to verify the producer's identity binding.

---

### AU-11 — Audit Record Retention

**Source:** NIST SP 800-53 Rev 5.
**Link:** [NIST SP 800-53r5 §AU-11 (p.104)](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r5.pdf#page=104)
**Quoted text:**
> Retain audit records for {{ insert: param, au-11_odp }} to provide support for after-the-fact investigations of incidents and to meet regulatory and organizational information retention requirements.

**Artifacts from §3 that evidence this control:** Row 12 (`ci-artifacts.zip`), Row 15 (`timestamp.tsr` + `tsa-certchain.pem`), Row 16 (`s3-receipt.json`), Row 17 (Solana memo transaction).
**Rationale (per artifact):**
- `ci-artifacts.zip`: The bundle's S3 Object Lock retention configuration enforces the GRS-driven retention period (longest-lived constituent), satisfying the retention-period obligation of AU-11.
- `timestamp.tsr` + `tsa-certchain.pem`: The TSA artifacts must be retained co-terminously with the evidence bundle they authenticate; their retention under the same Object Lock policy satisfies AU-11 for this record sub-type.
- `s3-receipt.json`: The upload receipt is the audit record of artifact transfer; its retention period under GRS 3.1/020 (3 years after final action) must be enforced by the SoR lifecycle policy.
- Solana memo transaction: The on-chain anchor's immutability satisfies retention in the durability dimension, but its inability to be destroyed creates a conflict with Temporary disposition obligations that must be resolved by records-officer determination.

---

### AU-12 — Audit Record Generation

**Source:** NIST SP 800-53 Rev 5.
**Link:** [NIST SP 800-53r5 §AU-12 (p.104)](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r5.pdf#page=104)
**Quoted text:**
> a. Provide audit record generation capability for the event types the system is capable of auditing as defined in [AU-2a] on {{ insert: param, au-12_odp.01 }};
> b. Allow {{ insert: param, au-12_odp.02 }} to select the event types that are to be logged by specific components of the system; and
> c. Generate audit records for the event types defined in [AU-2c] that include the audit record content defined in [AU-3].

**Artifacts from §3 that evidence this control:** Row 8 (`evidence-manifest.json`), Row 10 (`version.json`), Row 13 (`attestation.pdf`), Row 14 (`attestation.json`).
**Rationale (per artifact):**
- `evidence-manifest.json`: The manifest is the pipeline's primary audit-record generation output — it captures the event (artifact production), the component (CI job), and the content (SHA-256, run ID, timestamp) that AU-12c requires.
- `version.json`: Binding commit SHA, run ID, and timestamp to the deployed artifact generates the audit record fields (system component identity, event time) required by AU-12c / AU-3.

---

### AU-12(1) — System-wide and Time-correlated Audit Trail

**Source:** NIST SP 800-53 Rev 5.
**Link:** [NIST SP 800-53r5 §AU-12(1) (p.104)](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r5.pdf#page=104)
**Quoted text:**
> Compile audit records from {{ insert: param, au-12.01_odp.01 }} into a system-wide (logical or physical) audit trail that is time-correlated to within {{ insert: param, au-12.01_odp.02 }}.

**Artifacts from §3 that evidence this control:** Row 16 (`s3-receipt.json`).
**Rationale (per artifact):**
- `s3-receipt.json`: The S3 upload receipt, when combined with CloudTrail data events on the destination bucket, constitutes the cross-component time-correlated record of artifact movement that AU-12(1) requires; the receipt carries the timestamp field that anchors the correlation window.

---

### CA-2 — Control Assessments

**Source:** NIST SP 800-53 Rev 5.
**Link:** [NIST SP 800-53r5 §CA-2 (p.111)](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r5.pdf#page=111)
**Quoted text:**
> a. Select the appropriate assessor or assessment team for the type of assessment to be conducted;
> b. Develop a control assessment plan that describes the scope of the assessment including:
>    1. Controls and control enhancements under assessment;
>    2. Assessment procedures to be used to determine control effectiveness; and
>    3. Assessment environment, assessment team, and assessment roles and responsibilities;
> c. Ensure the control assessment plan is reviewed and approved by the authorizing official or designated representative prior to conducting the assessment;
> d. Assess the controls in the system and its environment of operation {{ insert: param, ca-02_odp.01 }} to determine the extent to which the controls are implemented correctly, operating as intended, and producing the desired outcome with respect to meeting established security and privacy requirements;
> e. Produce a control assessment report that document the results of the assessment; and
> f. Provide the results of the control assessment to {{ insert: param, ca-02_odp.02 }}.

**Artifacts from §3 that evidence this control:** Row 5 (OSCAL component-definition), Row 7 (OSCAL assessment-results), Row 13 (`attestation.pdf`).
**Rationale (per artifact):**
- OSCAL component-definition: Defines the controls implemented per component, providing the scope baseline (CA-2b item 1) against which the assessment plan is constructed.
- OSCAL assessment-results: Directly instantiates CA-2e — the machine-readable assessment report documenting results for each assessed control.
- `attestation.pdf`: The pipeline-emitted attestation is a human-readable summary of automated assessment outcomes; CA-2f requires the results to be provided to designated recipients, which the PDF format facilitates.

---

### CA-2(2) — Specialized Assessments

**Source:** NIST SP 800-53 Rev 5.
**Link:** [NIST SP 800-53r5 §CA-2(2) (p.111)](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r5.pdf#page=111)
**Quoted text:**
> Include as part of control assessments, {{ insert: param, ca-02.02_odp.01 }}, {{ insert: param, ca-02.02_odp.02 }}, {{ insert: param, ca-02.02_odp.03 }}.

**Artifacts from §3 that evidence this control:** Row 7 (OSCAL assessment-results).
**Rationale (per artifact):**
- OSCAL assessment-results: When the automated pipeline assessments (Trivy, npm audit, gitleaks, static analysis) are represented as assessment findings within the OSCAL document, they constitute the specialized-assessment inclusions (automated scanning, penetration testing sub-types) that CA-2(2) ODPs will specify.

---

### CA-7 — Continuous Monitoring

**Source:** NIST SP 800-53 Rev 5.
**Link:** [NIST SP 800-53r5 §CA-7 (p.117)](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r5.pdf#page=117)
**Quoted text:**
> Develop a system-level continuous monitoring strategy and implement continuous monitoring in accordance with the organization-level continuous monitoring strategy that includes:
> a. Establishing the following system-level metrics to be monitored: {{ insert: param, ca-07_odp.01 }};
> b. Establishing {{ insert: param, ca-07_odp.02 }} for monitoring and {{ insert: param, ca-07_odp.03 }} for assessment of control effectiveness;
> c. Ongoing control assessments in accordance with the continuous monitoring strategy;
> d. Ongoing monitoring of system and organization-defined metrics in accordance with the continuous monitoring strategy;
> e. Correlation and analysis of information generated by control assessments and monitoring;
> f. Response actions to address results of the analysis of control assessment and monitoring information; and
> g. Reporting the security and privacy status of the system to {{ insert: param, ca-7_prm_4 }} {{ insert: param, ca-7_prm_5 }}.

**Artifacts from §3 that evidence this control:** Row 6 (OSCAL SSP), Row 7 (OSCAL assessment-results), Row 14 (`attestation.json`).
**Rationale (per artifact):**
- OSCAL SSP: Embodies the continuous monitoring strategy in machine-readable form (CA-7 preamble), providing the control baseline against which ongoing assessment results are correlated.
- OSCAL assessment-results: Each pipeline-triggered assessment run produces a new assessment-results document, constituting the "ongoing control assessments" (CA-7c) that the continuous monitoring strategy requires.
- `attestation.json`: The machine-readable attestation per pipeline run is the recurring CA-7d monitoring artifact tied to the deployed artifact.

---

### CM-3 — Configuration Change Control

**Source:** NIST SP 800-53 Rev 5.
**Link:** [NIST SP 800-53r5 §CM-3 (p.125)](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r5.pdf#page=125)
**Quoted text:**
> a. Determine and document the types of changes to the system that are configuration-controlled;
> b. Review proposed configuration-controlled changes to the system and approve or disapprove such changes with explicit consideration for security and privacy impact analyses;
> c. Document configuration change decisions associated with the system;
> d. Implement approved configuration-controlled changes to the system;
> e. Retain records of configuration-controlled changes to the system for {{ insert: param, cm-03_odp.01 }};
> f. Monitor and review activities associated with configuration-controlled changes to the system; and
> g. Coordinate and provide oversight for configuration change control activities through {{ insert: param, cm-03_odp.02 }} that convenes {{ insert: param, cm-03_odp.03 }}.

**Artifacts from §3 that evidence this control:** Row 8 (`evidence-manifest.json`), Row 9 (`target/*.jar` + `.sha256`), Row 11 (SLSA build provenance).
**Rationale (per artifact):**
- `evidence-manifest.json`: The manifest records each artifact produced by a specific commit and pipeline run, constituting the "records of configuration-controlled changes" (CM-3e) that must be retained.
- `target/*.jar` + `.sha256`: The deliverable and its checksum bind the implemented change (CM-3d) to a verifiable artifact.
- SLSA build provenance: The provenance attestation documents the approved build environment and change inputs that produced the artifact, satisfying CM-3c and CM-3d for supply-chain-relevant changes.

---

### CM-3(1) — Automated Documentation, Notification, and Prohibition of Changes

**Source:** NIST SP 800-53 Rev 5.
**Link:** [NIST SP 800-53r5 §CM-3(1) (p.125)](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r5.pdf#page=125)
**Quoted text:**
> Use {{ insert: param, cm-03.01_odp.01 }} to:
> a. Document proposed changes to the system;
> b. Notify {{ insert: param, cm-03.01_odp.02 }} of proposed changes to the system and request change approval;
> c. Highlight proposed changes to the system that have not been approved or disapproved within {{ insert: param, cm-03.01_odp.03 }};
> d. Prohibit changes to the system until designated approvals are received;
> e. Document all changes to the system; and
> f. Notify {{ insert: param, cm-03.01_odp.04 }} when approved changes to the system are completed.

**Artifacts from §3 that evidence this control:** Row 9 (`target/*.jar` + `.sha256`), Row 10 (`version.json`).
**Rationale (per artifact):**
- `version.json`: The version metadata (commit SHA, run ID, timestamp) is the automated documentation output (CM-3(1)e) — it records that the CI system completed and documented the change without human intervention.
- `target/*.jar` + `.sha256`: The checksum file is the automated documentation artifact that the CI tool generates to record the output of each approved change implementation.

---

### CM-3(2) — Testing, Validation, and Documentation of Changes

**Source:** NIST SP 800-53 Rev 5.
**Link:** [NIST SP 800-53r5 §CM-3(2) (p.125)](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r5.pdf#page=125)
**Quoted text:**
> Test, validate, and document changes to the system before finalizing the implementation of the changes.

**Artifacts from §3 that evidence this control:** Row 1 (`gitleaks-report.json`).
**Rationale (per artifact):**
- `gitleaks-report.json`: The secret-scanning report is the documentation artifact proving that the pre-release validation step (test that no credentials are embedded) was executed before the change was finalized and the artifact promoted.

---

### CM-6 — Configuration Settings

**Source:** NIST SP 800-53 Rev 5.
**Link:** [NIST SP 800-53r5 §CM-6 (p.130)](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r5.pdf#page=130)
**Quoted text:**
> a. Establish and document configuration settings for components employed within the system that reflect the most restrictive mode consistent with operational requirements using {{ insert: param, cm-06_odp.01 }};
> b. Implement the configuration settings;
> c. Identify, document, and approve any deviations from established configuration settings for {{ insert: param, cm-06_odp.02 }} based on {{ insert: param, cm-06_odp.03 }}; and
> d. Monitor and control changes to the configuration settings in accordance with organizational policies and procedures.

**Artifacts from §3 that evidence this control:** Row 10 (`version.json`).
**Rationale (per artifact):**
- `version.json`: Binding the deployed artifact to a specific commit SHA and run ID documents the configuration state that was implemented (CM-6b), enabling comparison to the approved baseline when monitoring for unauthorized deviations (CM-6d).

---

### CM-8 — System Component Inventory

**Source:** NIST SP 800-53 Rev 5.
**Link:** [NIST SP 800-53r5 §CM-8 (p.134)](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r5.pdf#page=134)
**Quoted text:**
> a. Develop and document an inventory of system components that:
>    1. Accurately reflects the system;
>    2. Includes all components within the system;
>    3. Does not include duplicate accounting of components or components assigned to any other system;
>    4. Is at the level of granularity deemed necessary for tracking and reporting; and
>    5. Includes the following information to achieve system component accountability: {{ insert: param, cm-08_odp.01 }}; and
> b. Review and update the system component inventory {{ insert: param, cm-08_odp.02 }}.

**Artifacts from §3 that evidence this control:** Row 4 (`sbom.cyclonedx.json`), Row 9 (`target/*.jar` + `.sha256`).
**Rationale (per artifact):**
- `sbom.cyclonedx.json`: The CycloneDX SBOM is the machine-readable component inventory (CM-8a) — it enumerates every software component at the required granularity, including version and origin, enabling automated review and update per CM-8b.
- `target/*.jar` + `.sha256`: The deliverable artifact and its checksum record the deployed component's identity, constituting the "system component" entry (CM-8a.1–2) for the application binary in the inventory.

---

### CM-8(6) — Assessed Configurations and Approved Deviations

**Source:** NIST SP 800-53 Rev 5.
**Link:** [NIST SP 800-53r5 §CM-8(6) (p.134)](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r5.pdf#page=134)
**Quoted text:**
> Include assessed component configurations and any approved deviations to current deployed configurations in the system component inventory.

**Artifacts from §3 that evidence this control:** Row 4 (`sbom.cyclonedx.json`).
**Rationale (per artifact):**
- `sbom.cyclonedx.json`: When suppression rationale entries (e.g., Trivy CVE suppressions) are cross-referenced against the SBOM's component versions, the combination constitutes the "assessed configurations and approved deviations" record that CM-8(6) requires to be included in the inventory.

---

### IA-5(7) — No Embedded Unencrypted Static Authenticators

**Source:** NIST SP 800-53 Rev 5.
**Link:** [NIST SP 800-53r5 §IA-5(7) (p.165)](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r5.pdf#page=165)
**Quoted text:**
> Ensure that unencrypted static authenticators are not embedded in applications or other forms of static storage.

**Artifacts from §3 that evidence this control:** Row 1 (`gitleaks-report.json`).
**Rationale (per artifact):**
- `gitleaks-report.json`: The gitleaks scan output is the evidence artifact that demonstrates the IA-5(7) obligation was assessed pre-release; a clean (zero-finding) report constitutes positive evidence that no unencrypted static authenticators were detected in the codebase or build artifacts.

---

### PL-2 — System Security and Privacy Plans

**Source:** NIST SP 800-53 Rev 5.
**Link:** [NIST SP 800-53r5 §PL-2 (p.222)](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r5.pdf#page=222)
**Quoted text:**
> a. Develop security and privacy plans for the system that:
>    1. Are consistent with the organization's enterprise architecture;
>    2. Explicitly define the constituent system components;
>    3. Describe the operational context of the system in terms of mission and business processes;
>    4. Identify the individuals that fulfill system roles and responsibilities;
>    5. Identify the information types processed, stored, and transmitted by the system;
>    6. Provide the security categorization of the system, including supporting rationale;
>    7. Describe any specific threats to the system that are of concern to the organization;
>    8. Provide the results of a privacy risk assessment for systems processing personally identifiable information;
>    9. Describe the operational environment for the system and any dependencies on or connections to other systems or system components;
>    10. Provide an overview of the security and privacy requirements for the system;
>    11. Identify any relevant control baselines or overlays, if applicable;
>    12. Describe the controls in place or planned for meeting the security and privacy requirements, including a rationale for any tailoring decisions;
>    13. Include risk determinations for security and privacy architecture and design decisions;
>    14. Include security- and privacy-related activities affecting the system that require planning and coordination with {{ insert: param, pl-02_odp.01 }}; and
>    15. Are reviewed and approved by the authorizing official or designated representative prior to plan implementation.
> b. Distribute copies of the plans and communicate subsequent changes to the plans to {{ insert: param, pl-02_odp.02 }};
> c. Review the plans {{ insert: param, pl-02_odp.03 }};
> d. Update the plans to address changes to the system and environment of operation or problems identified during plan implementation or control assessments; and
> e. Protect the plans from unauthorized disclosure and modification.

**Artifacts from §3 that evidence this control:** Row 5 (OSCAL component-definition), Row 6 (OSCAL SSP).
**Rationale (per artifact):**
- OSCAL SSP: The SSP directly instantiates PL-2a — it is the required security and privacy plan artifact; its pipeline-automated generation and S3 retention under Object Lock satisfies PL-2e (protection from modification).
- OSCAL component-definition: Feeds the "explicitly define constituent system components" (PL-2a.2) and "controls in place" (PL-2a.12) sections of the SSP, providing the component-level evidence base.

---

### PL-8 — Security and Privacy Architectures

**Source:** NIST SP 800-53 Rev 5.
**Link:** [NIST SP 800-53r5 §PL-8 (p.225)](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r5.pdf#page=225)
**Quoted text:**
> a. Develop security and privacy architectures for the system that:
>    1. Describe the requirements and approach to be taken for protecting the confidentiality, integrity, and availability of organizational information;
>    2. Describe the requirements and approach to be taken for processing personally identifiable information to minimize privacy risk to individuals;
>    3. Describe how the architectures are integrated into and support the enterprise architecture; and
>    4. Describe any assumptions about, and dependencies on, external systems and services;
> b. Review and update the architectures {{ insert: param, pl-08_odp }} to reflect changes in the enterprise architecture; and
> c. Reflect planned architecture changes in security and privacy plans, Concept of Operations (CONOPS), criticality analysis, organizational procedures, and procurements and acquisitions.

**Artifacts from §3 that evidence this control:** Row 6 (OSCAL SSP).
**Rationale (per artifact):**
- OSCAL SSP: The SSP's system-description and control-implementation sections constitute the security architecture documentation (PL-8a); pipeline-automated SSP regeneration on each commit satisfies the "review and update" cadence obligation (PL-8b).

---

### RA-5 — Vulnerability Monitoring and Scanning

**Source:** NIST SP 800-53 Rev 5.
**Link:** [NIST SP 800-53r5 §RA-5 (p.269)](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r5.pdf#page=269)
**Quoted text:**
> a. Monitor and scan for vulnerabilities in the system and hosted applications {{ insert: param, ra-5_prm_1 }} and when new vulnerabilities potentially affecting the system are identified and reported;
> b. Employ vulnerability monitoring tools and techniques that facilitate interoperability among tools and automate parts of the vulnerability management process by using standards for:
>    1. Enumerating platforms, software flaws, and improper configurations;
>    2. Formatting checklists and test procedures; and
>    3. Measuring vulnerability impact;
> c. Analyze vulnerability scan reports and results from vulnerability monitoring;
> d. Remediate legitimate vulnerabilities {{ insert: param, ra-05_odp.03 }} in accordance with an organizational assessment of risk;
> e. Share information obtained from the vulnerability monitoring process and control assessments with {{ insert: param, ra-05_odp.04 }} to help eliminate similar vulnerabilities in other systems; and
> f. Employ vulnerability monitoring tools that include the capability to readily update the vulnerabilities to be scanned.

**Artifacts from §3 that evidence this control:** Row 3 (`npm-audit.json`).
**Rationale (per artifact):**
- `npm-audit.json`: The npm audit report is the RA-5a/RA-5c output artifact for the frontend dependency layer — it enumerates CVEs using npm's standard vulnerability-enumeration format (RA-5b.1) and constitutes the analyzed scan report required by RA-5c.

---

### RA-5(2) — Update Vulnerabilities to Be Scanned

**Source:** NIST SP 800-53 Rev 5.
**Link:** [NIST SP 800-53r5 §RA-5(2) (p.269)](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r5.pdf#page=269)
**Quoted text:**
> Update the system vulnerabilities to be scanned {{ insert: param, ra-05.02_odp.01 }}.

**Artifacts from §3 that evidence this control:** Row 2 (`trivy-results.json`).
**Rationale (per artifact):**
- `trivy-results.json`: Each pipeline-triggered Trivy scan runs against an updated vulnerability database; the scan report's timestamp and database-version metadata constitute evidence that the vulnerability scan definition was updated per the RA-5(2) ODP cadence.

---

### SA-3 — System Development Life Cycle

**Source:** NIST SP 800-53 Rev 5.
**Link:** [NIST SP 800-53r5 §SA-3 (p.277)](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r5.pdf#page=277)
**Quoted text:**
> a. Acquire, develop, and manage the system using {{ insert: param, sa-03_odp }} that incorporates information security and privacy considerations;
> b. Define and document information security and privacy roles and responsibilities throughout the system development life cycle;
> c. Identify individuals having information security and privacy roles and responsibilities; and
> d. Integrate the organizational information security and privacy risk management process into system development life cycle activities.

**Artifacts from §3 that evidence this control:** Row 5 (OSCAL component-definition).
**Rationale (per artifact):**
- OSCAL component-definition: The component-definition document captures which security controls are implemented at which lifecycle phase, demonstrating that security considerations are integrated into the SDLC (SA-3a, SA-3d) and not appended post-development.

---

### SA-4 — Acquisition Process

**Source:** NIST SP 800-53 Rev 5.
**Link:** [NIST SP 800-53r5 §SA-4 (p.279)](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r5.pdf#page=279)
**Quoted text:**
> Include the following requirements, descriptions, and criteria, explicitly or by reference, using {{ insert: param, sa-04_odp.01 }} in the acquisition contract for the system, system component, or system service:
> a. Security and privacy functional requirements;
> b. Strength of mechanism requirements;
> c. Security and privacy assurance requirements;
> d. Controls needed to satisfy the security and privacy requirements;
> e. Security and privacy documentation requirements;
> f. Requirements for protecting security and privacy documentation;
> g. Description of the system development environment and environment in which the system is intended to operate;
> h. Allocation of responsibility or identification of parties responsible for information security, privacy, and supply chain risk management; and
> i. Acceptance criteria.

**Artifacts from §3 that evidence this control:** Row 6 (OSCAL SSP).
**Rationale (per artifact):**
- OSCAL SSP: The SSP documents the security functional requirements (SA-4a), control implementations (SA-4d), and system environment description (SA-4g) that must flow from acquisition contracts into the delivered system; the pipeline-generated SSP demonstrates these requirements were operationalized.

---

### SA-4(2) — Design and Implementation Information for Controls

**Source:** NIST SP 800-53 Rev 5.
**Link:** [NIST SP 800-53r5 §SA-4(2) (p.279)](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r5.pdf#page=279)
**Quoted text:**
> Require the developer of the system, system component, or system service to provide design and implementation information for the controls that includes: {{ insert: param, sa-04.02_odp.01 }} at {{ insert: param, sa-04.02_odp.03 }}.

**Artifacts from §3 that evidence this control:** Row 5 (OSCAL component-definition).
**Rationale (per artifact):**
- OSCAL component-definition: The component-definition document is precisely the "design and implementation information for controls" that SA-4(2) requires developers to provide — it maps each control to the component-level mechanism that implements it, at the level of detail the ODP specifies.

---

### SA-11(1) — Static Code Analysis

**Source:** NIST SP 800-53 Rev 5.
**Link:** [NIST SP 800-53r5 §SA-11(1) (p.303)](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r5.pdf#page=303)
**Quoted text:**
> Require the developer of the system, system component, or system service to employ static code analysis tools to identify common flaws and document the results of the analysis.

**Artifacts from §3 that evidence this control:** Row 1 (`gitleaks-report.json`), Row 2 (`trivy-results.json`), Row 3 (`npm-audit.json`).
**Rationale (per artifact):**
- `gitleaks-report.json`: The gitleaks report is the documented results of a static analysis tool (pattern-matching over source and history) required by SA-11(1); its presence proves the developer employed the tool and retained the output.
- `trivy-results.json`: Trivy operates as a static analysis scanner against the built artifact and dependency manifest; its output is the "documented results of the analysis" that SA-11(1) requires.
- `npm-audit.json`: npm audit performs static analysis of the dependency graph against advisory databases; its report is the required documentation of static analysis results for the frontend dependency layer.

---

### SA-12 — Supply Chain Protection (WITHDRAWN in Rev 5)

**Source:** NIST SP 800-53 Rev 5.
**Link:** [NIST SP 800-53r5 §SA-12 (p.307)](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r5.pdf#page=307)
**Status:** Withdrawn in Rev 5; functionality incorporated into the SR (Supply Chain Risk Management) family. The OSCAL catalog `links` for `sa-12` carries `rel: incorporated-into`, `href: #sr`.
**Successor controls:** SR-3, SR-4, SR-5. See the SR-family blocks below for quoted text and per-artifact rationale; SA-12 is preserved here for citation traceability against §3 of the SoR notes.

---

### SA-12(4) — Diversity of Suppliers (WITHDRAWN in Rev 5)

**Source:** NIST SP 800-53 Rev 5.
**Link:** [NIST SP 800-53r5 §SA-12(4) (p.307)](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r5.pdf#page=307)
**Status:** Withdrawn in Rev 5; moved to SR-3(1) (Diverse Supply Base). The OSCAL catalog `links` for `sa-12.4` carries `rel: moved-to`, `href: #sr-3.1`.

**Quoted text of successor (from OSCAL):**
> **SR-3(1) — Diverse Supply Base:**
> Employ a diverse set of sources for the following system components and services: {{ insert: param, sr-3.1_prm_1 }}.

**Artifacts from §3 that evidence the successor:** Row 11 (SLSA build provenance).
**Rationale (per artifact):**
- SLSA build provenance: The provenance attestation documents the build toolchain and source origins, enabling auditors to verify that components were drawn from diverse, approved sources rather than a single potentially compromised supply point.

---

### SC-28 — Protection of Information at Rest

**Source:** NIST SP 800-53 Rev 5.
**Link:** [NIST SP 800-53r5 §SC-28 (p.343)](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r5.pdf#page=343)
**Quoted text:**
> Protect the {{ insert: param, sc-28_odp.01 }} of the following information at rest: {{ insert: param, sc-28_odp.02 }}.

**Artifacts from §3 that evidence this control:** Row 17 (Solana memo transaction).
**Rationale (per artifact):**
- Solana memo transaction: The on-chain anchor itself is the external integrity anchor; the sensitivity-bearing artifacts it references (`gitleaks-report.json`, `trivy-results.json`) must be protected at rest via SSE-KMS in S3, and the SC-28 requirement applies to those artifacts for which the ODP selects confidentiality protection.

---

### SI-2 — Flaw Remediation

**Source:** NIST SP 800-53 Rev 5.
**Link:** [NIST SP 800-53r5 §SI-2 (p.360)](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r5.pdf#page=360)
**Quoted text:**
> a. Identify, report, and correct system flaws;
> b. Test software and firmware updates related to flaw remediation for effectiveness and potential side effects before installation;
> c. Install security-relevant software and firmware updates within {{ insert: param, si-02_odp }} of the release of the updates; and
> d. Incorporate flaw remediation into the organizational configuration management process.

**Artifacts from §3 that evidence this control:** Row 2 (`trivy-results.json`), Row 3 (`npm-audit.json`).
**Rationale (per artifact):**
- `trivy-results.json`: The Trivy scan report is the SI-2a "identify and report" output; suppression entries with rationale constitute the "correct or accept-risk" record for identified flaws.
- `npm-audit.json`: The npm audit report performs the same SI-2a function for the frontend dependency layer, providing the flaw-identification record that must be retained to demonstrate SI-2d integration into configuration management.

---

### SI-2(2) — Automated Flaw Remediation Status

**Source:** NIST SP 800-53 Rev 5.
**Link:** [NIST SP 800-53r5 §SI-2(2) (p.360)](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r5.pdf#page=360)
**Quoted text:**
> Determine if system components have applicable security-relevant software and firmware updates installed using {{ insert: param, si-02.02_odp.01 }} {{ insert: param, si-02.02_odp.02 }}.

**Artifacts from §3 that evidence this control:** Row 2 (`trivy-results.json`).
**Rationale (per artifact):**
- `trivy-results.json`: Trivy's automated scan of the delivered JAR and its dependency set is the SI-2(2) automated tool output that determines whether applicable updates are installed; the report's per-CVE fixed-version field provides the remediation-status determination.

---

### SI-3 — Malicious Code Protection

**Source:** NIST SP 800-53 Rev 5.
**Link:** [NIST SP 800-53r5 §SI-3 (p.361)](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r5.pdf#page=361)
**Quoted text:**
> a. Implement {{ insert: param, si-03_odp.01 }} malicious code protection mechanisms at system entry and exit points to detect and eradicate malicious code;
> b. Automatically update malicious code protection mechanisms as new releases are available in accordance with organizational configuration management policy and procedures;
> c. Configure malicious code protection mechanisms to:
>    1. Perform periodic scans of the system {{ insert: param, si-03_odp.02 }} and real-time scans of files from external sources at {{ insert: param, si-03_odp.03 }} as the files are downloaded, opened, or executed in accordance with organizational policy; and
>    2. {{ insert: param, si-03_odp.04 }}; and send alert to {{ insert: param, si-03_odp.06 }} in response to malicious code detection; and
> d. Address the receipt of false positives during malicious code detection and eradication and the resulting potential impact on the availability of the system.

**Artifacts from §3 that evidence this control:** Row 1 (`gitleaks-report.json`).
**Rationale (per artifact):**
- `gitleaks-report.json`: The pipeline-integrated gitleaks scan functions as a malicious-code detection mechanism at the system exit point (artifact promotion gate); its output report constitutes the SI-3c.1 scan record demonstrating the mechanism was executed and configured per policy.

---

### SI-7 — Software, Firmware, and Information Integrity

**Source:** NIST SP 800-53 Rev 5.
**Link:** [NIST SP 800-53r5 §SI-7 (p.372)](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r5.pdf#page=372)
**Quoted text:**
> a. Employ integrity verification tools to detect unauthorized changes to the following software, firmware, and information: {{ insert: param, si-7_prm_1 }}; and
> b. Take the following actions when unauthorized changes to the software, firmware, and information are detected: {{ insert: param, si-7_prm_2 }}.

**Artifacts from §3 that evidence this control:** Row 10 (`version.json`), Row 14 (`attestation.json`).
**Rationale (per artifact):**
- `version.json`: The commit SHA and artifact identity fields in `version.json` constitute the reference values that an integrity verification tool uses to detect unauthorized post-build changes to the deployed binary (SI-7a).
- `attestation.json`: The machine-readable attestation provides the signed integrity reference for the full artifact set, enabling the SI-7a verification check to be automated rather than manual.

---

### SI-7(1) — Integrity Checks

**Source:** NIST SP 800-53 Rev 5.
**Link:** [NIST SP 800-53r5 §SI-7(1) (p.372)](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r5.pdf#page=372)
**Quoted text:**
> Perform an integrity check of {{ insert: param, si-7.1_prm_1 }} {{ insert: param, si-7.1_prm_2 }}.

**Artifacts from §3 that evidence this control:** Row 8 (`evidence-manifest.json`), Row 9 (`target/*.jar` + `.sha256`), Row 12 (`ci-artifacts.zip`).
**Rationale (per artifact):**
- `evidence-manifest.json`: The manifest's SHA-256 entries for each artifact in the bundle are the integrity-check reference values; their computation at build time and re-verification at ingest time constitute the SI-7(1) integrity-check cadence.
- `target/*.jar` + `.sha256`: The `.sha256` sidecar file is the explicit integrity-check artifact — it holds the cryptographic reference value against which the deployed JAR is verified, satisfying SI-7(1) for the deliverable binary.
- `ci-artifacts.zip`: The sealed bundle's checksum (computed by `scripts/attest.mjs` and signed via RFC 3161) enables integrity checks of the complete evidence package at any point in its retention lifecycle.

---

### SI-7(6) — Cryptographic Protection

**Source:** NIST SP 800-53 Rev 5.
**Link:** [NIST SP 800-53r5 §SI-7(6) (p.372)](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r5.pdf#page=372)
**Quoted text:**
> Implement cryptographic mechanisms to detect unauthorized changes to software, firmware, and information.

**Artifacts from §3 that evidence this control:** Row 11 (SLSA build provenance).
**Rationale (per artifact):**
- SLSA build provenance: The SLSA provenance attestation uses cryptographic signing (Sigstore/Cosign) to bind the build inputs and outputs; verification of the provenance signature detects unauthorized changes to the artifact or its claimed build provenance, satisfying SI-7(6).

---

### SR-3 — Supply Chain Controls and Processes

**Source:** NIST SP 800-53 Rev 5.
**Link:** [NIST SP 800-53r5 §SR-3 (p.392)](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r5.pdf#page=392)
**Quoted text:**
> a. Establish a process or processes to identify and address weaknesses or deficiencies in the supply chain elements and processes of {{ insert: param, sr-03_odp.01 }} in coordination with {{ insert: param, sr-03_odp.02 }};
> b. Employ the following controls to protect against supply chain risks to the system, system component, or system service and to limit the harm or consequences from supply chain-related events: {{ insert: param, sr-03_odp.03 }}; and
> c. Document the selected and implemented supply chain processes and controls in {{ insert: param, sr-03_odp.04 }}.

**Artifacts from §3 that evidence this control:** Row 4 (`sbom.cyclonedx.json`).
**Rationale (per artifact):**
- `sbom.cyclonedx.json`: The SBOM is the primary documentation artifact for SR-3c — it records the full set of software components (supply chain elements) and their origins, constituting the documented inventory of implemented supply chain controls for the software layer.

---

### SR-4 — Provenance

**Source:** NIST SP 800-53 Rev 5.
**Link:** [NIST SP 800-53r5 §SR-4 (p.393)](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r5.pdf#page=393)
**Quoted text:**
> Document, monitor, and maintain valid provenance of the following systems, system components, and associated data: {{ insert: param, sr-04_odp }}.

**Artifacts from §3 that evidence this control:** Row 11 (SLSA build provenance).
**Rationale (per artifact):**
- SLSA build provenance: The SLSA attestation is the provenance record required by SR-4 — it documents the build environment, source commit, and toolchain that produced each artifact, and its cryptographic signature enables continuous monitoring and maintenance of provenance validity.

---

## 2. NIST SP 800-218 v1.1 — SSDF Practices

Practices appear in identifier order grouped by family: PO (Prepare the
Organization), PS (Protect the Software), PW (Produce Well-Secured Software),
RV (Respond to Vulnerabilities). Each block carries the parent practice
statement and the specific task statement that is cited in §3.

### PO.1.1 — Identify and document all security requirements for the organization's software development infrastructures and processes

**Source:** NIST SP 800-218 v1.1.
**Link:** [NIST SP 800-218 v1.1 §PO.1.1 (p.14)](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-218.pdf#page=14)
**Practice (parent) text:**
> PO.1 Define Security Requirements for Software Development: Ensure that security requirements for software development are known at all times so that they can be taken into account throughout the SDLC and duplication of effort can be minimized because the requirements information can be collected once and shared. This includes requirements from internal sources (e.g., the organization's policies, business objectives, and risk management strategy) and external sources (e.g., applicable laws and regulations).

**Task text:**
> PO.1.1: Identify and document all security requirements for the organization's software development infrastructures and processes, and maintain the requirements over time.

**Notional implementation examples (excerpted):**
> Example 1: Define policies for securing software development infrastructures and their components, including development endpoints, throughout the SDLC and maintaining that security.
> Example 2: Define policies for securing software development processes throughout the SDLC and maintaining that security, including for open-source and other third-party software components utilized by software being developed.

**Artifacts from §3 that evidence this practice:** #6 OSCAL SSP

**Rationale (per artifact):**
- OSCAL SSP: The SSP records the organization's security policies and requirements for the development environment in machine-readable form, providing the persistent documentation of infrastructure and process security requirements that PO.1.1 demands.

---

### PO.1.2 — Identify and document all security requirements for organization-developed software

**Source:** NIST SP 800-218 v1.1.
**Link:** [NIST SP 800-218 v1.1 §PO.1.2 (p.14)](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-218.pdf#page=14)
**Practice (parent) text:**
> PO.1 Define Security Requirements for Software Development: Ensure that security requirements for software development are known at all times so that they can be taken into account throughout the SDLC and duplication of effort can be minimized because the requirements information can be collected once and shared. This includes requirements from internal sources (e.g., the organization's policies, business objectives, and risk management strategy) and external sources (e.g., applicable laws and regulations).

**Task text:**
> PO.1.2: Identify and document all security requirements for organization-developed software to meet, and maintain the requirements over time.

**Notional implementation examples (excerpted):**
> Example 4: Define policies that specify what needs to be archived for each software release (e.g., code, package files, third-party libraries, documentation, data inventory) and how long it needs to be retained based on the SDLC model, software end-of-life, and other factors.

**Artifacts from §3 that evidence this practice:** #5 OSCAL component-definition

**Rationale (per artifact):**
- OSCAL component-definition: The component-definition documents the security requirements allocated to each software component (SA-4(2)), providing the per-component implementation statement that PO.1.2 requires organizations to maintain for their developed software.

---

### PO.3.1 — Specify which tools or tool types must or should be included in each toolchain

**Source:** NIST SP 800-218 v1.1.
**Link:** [NIST SP 800-218 v1.1 §PO.3.1 (p.16)](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-218.pdf#page=16)
**Practice (parent) text:**
> PO.3 Implement Supporting Toolchains: Use automation to reduce human effort and improve the accuracy, reproducibility, usability, and comprehensiveness of security practices throughout the SDLC, as well as provide a way to document and demonstrate the use of these practices. Toolchains and tools may be used at different levels of the organization, such as organization-wide or project-specific, and may address a particular part of the SDLC, like a build pipeline.

**Task text:**
> PO.3.1: Specify which tools or tool types must or should be included in each toolchain to mitigate identified risks, as well as how the toolchain components are to be integrated with each other.

**Notional implementation examples (excerpted):**
> Example 1: Define categories of toolchains, and specify the mandatory tools or tool types to be used for each category.
> Example 2: Identify security tools to integrate into the developer toolchain.
> Example 4: Evaluate tools' signing capabilities to create immutable records/logs for auditability within the toolchain.

**Artifacts from §3 that evidence this practice:** #6 OSCAL SSP

**Rationale (per artifact):**
- OSCAL SSP: The SSP's PL-2 control implementation statements enumerate the security tools mandated in the build pipeline (Trivy, Gitleaks, npm audit, Cosign, TSA) and how they integrate, directly evidencing the toolchain specification PO.3.1 requires.

---

### PO.3.2 — Follow recommended security practices to deploy, operate, and maintain tools and toolchains

**Source:** NIST SP 800-218 v1.1.
**Link:** [NIST SP 800-218 v1.1 §PO.3.2 (p.16)](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-218.pdf#page=16)
**Practice (parent) text:**
> PO.3 Implement Supporting Toolchains: Use automation to reduce human effort and improve the accuracy, reproducibility, usability, and comprehensiveness of security practices throughout the SDLC, as well as provide a way to document and demonstrate the use of these practices. Toolchains and tools may be used at different levels of the organization, such as organization-wide or project-specific, and may address a particular part of the SDLC, like a build pipeline.

**Task text:**
> PO.3.2: Follow recommended security practices to deploy, operate, and maintain tools and toolchains.

**Notional implementation examples (excerpted):**
> Example 3: Use code-based configuration for toolchains (e.g., pipelines-as-code, toolchains-as-code).
> Example 7: Regularly verify the integrity and check the provenance of each tool to identify potential problems.

**Artifacts from §3 that evidence this practice:** #5 OSCAL component-definition, #7 OSCAL assessment-results, #8 `evidence-manifest.json`, #12 `ci-artifacts.zip`, #13 `attestation.pdf`, #14 `attestation.json`, #15 `timestamp.tsr` + `tsa-certchain.pem`, #16 `s3-receipt.json`, #17 Solana memo transaction

**Rationale (per artifact):**
- OSCAL component-definition: Records the security practices governing each pipeline tool as a component implementation statement, satisfying the "document secure operating practices" dimension of PO.3.2.
- OSCAL assessment-results: Captures the automated assessment of whether toolchain security practices are being followed, providing the periodic verification evidence PO.3.2 calls for.
- `evidence-manifest.json`: The SHA-256 manifest of all pipeline artifacts constitutes machine-readable evidence that toolchain outputs are being tracked and integrity-checked on every run, directly evidencing the integrity-verification practice in PO.3.2 Example 7.
- `ci-artifacts.zip`: The sealed bundle collects all toolchain-generated security artifacts per run, demonstrating that the pipeline is operated consistently and that its outputs are preserved for auditing per PO.3.2's documentation requirement.
- `attestation.pdf` / `attestation.json`: Human- and machine-readable attestation records that the toolchain ran, with what inputs and outputs, constitute the run-time documentation that PO.3.2 requires for operating the toolchain securely.
- `timestamp.tsr` + `tsa-certchain.pem`: RFC 3161 trusted timestamps on toolchain outputs provide cryptographic proof that tool outputs were produced at a specific time, supporting the integrity and provenance verification required by PO.3.2.
- `s3-receipt.json`: Documents that pipeline artifacts were delivered to the authorized S3 destination, evidencing the controlled-delivery dimension of secure toolchain operation.
- Solana memo transaction: Provides an immutable external anchor confirming toolchain run output hashes, extending integrity verification beyond the pipeline's own trust boundary as PO.3.2 Example 7 recommends.

---

### PS.1.1 — Store all forms of code based on least privilege so that only authorized personnel, tools, services, etc. have access

**Source:** NIST SP 800-218 v1.1.
**Link:** [NIST SP 800-218 v1.1 §PS.1.1 (p.18)](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-218.pdf#page=18)
**Practice (parent) text:**
> PS.1 Protect All Forms of Code from Unauthorized Access and Tampering: Help prevent unauthorized changes to code, both inadvertent and intentional, which could circumvent or negate the intended security characteristics of the software. For code that is not intended to be publicly accessible, this helps prevent theft of the software and may make it more difficult or time-consuming for attackers to find vulnerabilities in the software.

**Task text:**
> PS.1.1: Store all forms of code – including source code, executable code, and configuration-as-code – based on the principle of least privilege so that only authorized personnel, tools, services, etc. have access.

**Notional implementation examples (excerpted):**
> Example 1: Store all source code and configuration-as-code in a code repository, and restrict access to it based on the nature of the code. For example, open-source code intended for public access may need its integrity and availability protected; other code may also need its confidentiality protected.
> Example 3: Use commit signing for code repositories.
> Example 5: Use code signing to help protect the integrity of executables.

**Artifacts from §3 that evidence this practice:** #5 OSCAL component-definition

**Rationale (per artifact):**
- OSCAL component-definition: The component-definition's SA-4(2) implementation statement documents the access controls applied to the source repository and build outputs, evidencing the least-privilege code storage posture PS.1.1 requires.

---

### PS.2.1 — Make software integrity verification information available to software acquirers

**Source:** NIST SP 800-218 v1.1.
**Link:** [NIST SP 800-218 v1.1 §PS.2.1 (p.19)](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-218.pdf#page=19)
**Practice (parent) text:**
> PS.2 Provide a Mechanism for Verifying Software Release Integrity: Help software acquirers ensure that the software they acquire is legitimate and has not been tampered with.

**Task text:**
> PS.2.1: Make software integrity verification information available to software acquirers.

**Notional implementation examples (excerpted):**
> Example 1: Post cryptographic hashes for release files on a well-secured website.
> Example 2: Use an established certificate authority for code signing so that consumers' operating systems or other tools and services can confirm the validity of signatures before use.

**Artifacts from §3 that evidence this practice:** #9 `target/*.jar` + `.sha256`, #10 `version.json`, #11 SLSA build provenance, #12 `ci-artifacts.zip`, #13 `attestation.pdf`, #14 `attestation.json`, #15 `timestamp.tsr` + `tsa-certchain.pem`, #16 `s3-receipt.json`, #17 Solana memo transaction

**Rationale (per artifact):**
- `target/*.jar` + `.sha256`: The SHA-256 checksum file shipped alongside the JAR is the most direct realization of PS.2.1 — it is the integrity verification artifact that an acquirer uses to confirm the binary has not been tampered with.
- `version.json`: Binds the commit SHA, pipeline run ID, and timestamp to the release artifact, giving acquirers the version-identity information needed to validate they have the correct release.
- SLSA build provenance: Provides a signed, machine-verifiable provenance attestation that records the build inputs and environment, allowing acquirers to confirm the JAR was produced from the declared source by the declared pipeline.
- `ci-artifacts.zip`: The sealed bundle contains the checksum manifest and all integrity evidence, providing acquirers a single artifact set with which to verify the entire release's integrity chain.
- `attestation.pdf` / `attestation.json`: Human- and machine-readable release integrity statements that an acquirer can inspect to understand what the pipeline attested about the release, satisfying the "make integrity information available" obligation of PS.2.1.
- `timestamp.tsr` + `tsa-certchain.pem`: The RFC 3161 timestamp proves that the artifact existed in a specific state before a given time, providing acquirers cryptographically verifiable proof of pre-release existence.
- `s3-receipt.json`: Documents the upload transaction to the authorized distribution endpoint, giving acquirers a chain-of-custody record from pipeline emission to distribution point.
- Solana memo transaction: Provides an immutable third-party ledger entry anchoring the artifact's hash at release time, offering acquirers a trust anchor outside the pipeline's own trust boundary.

---

### PS.3.1 — Securely archive the necessary files and supporting data to be retained for each software release

**Source:** NIST SP 800-218 v1.1.
**Link:** [NIST SP 800-218 v1.1 §PS.3.1 (p.19)](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-218.pdf#page=19)
**Practice (parent) text:**
> PS.3 Archive and Protect Each Software Release: Preserve software releases in order to help identify, analyze, and eliminate vulnerabilities discovered in the software after release.

**Task text:**
> PS.3.1: Securely archive the necessary files and supporting data (e.g., integrity verification information, provenance data) to be retained for each software release.

**Notional implementation examples (excerpted):**
> Example 1: Store the release files, associated images, etc. in repositories following the organization's established policy. Allow read-only access to them by necessary personnel and no access by anyone else.
> Example 2: Store and protect release integrity verification information and provenance data, such as by keeping it in a separate location from the release files or by signing the data.

**Artifacts from §3 that evidence this practice:** #4 `sbom.cyclonedx.json`, #8 `evidence-manifest.json`, #9 `target/*.jar` + `.sha256`, #10 `version.json`, #11 SLSA build provenance, #12 `ci-artifacts.zip`, #13 `attestation.pdf`, #14 `attestation.json`, #15 `timestamp.tsr` + `tsa-certchain.pem`, #16 `s3-receipt.json`, #17 Solana memo transaction

**Rationale (per artifact):**
- `sbom.cyclonedx.json`: The SBOM is the component-inventory supporting data PS.3.1 explicitly calls out; archiving it alongside the release enables post-release vulnerability identification against the exact component set shipped.
- `evidence-manifest.json`: The SHA-256 manifest of all pipeline artifacts is the integrity verification information PS.3.1 requires to be retained with the release; it ties every evidence file to the producing job.
- `target/*.jar` + `.sha256`: The JAR and its checksum are the release files PS.3.1 requires to be securely archived; retaining them in S3 with Object Lock satisfies the read-only, tamper-evident storage requirement.
- `version.json`: Binds the release artifact to its source commit and pipeline run, providing the identity record that makes the archive traceable to a specific pipeline execution.
- SLSA build provenance: The signed provenance record is the "provenance data" PS.3.1 Example 2 specifically calls out for retention alongside (but separately from) the release files.
- `ci-artifacts.zip`: The sealed bundle implements the PS.3.1 archival requirement holistically — it retains the release artifact, integrity verification information, and provenance data together in a single protected object.
- `attestation.pdf` / `attestation.json`: These attest the pipeline's findings at release time; retaining them satisfies the "supporting data" requirement and enables post-release review of what was known at the time of release.
- `timestamp.tsr` + `tsa-certchain.pem`: Retaining the TSA timestamp with the release archive provides the binding between the archived artifact and the trusted time-of-creation proof required by PS.3.1's integrity verification data retention.
- `s3-receipt.json`: Records the upload transaction to the retention substrate; once in agency custody it is the chain-of-custody document for the archived artifact.
- Solana memo transaction: Serves as an externally anchored integrity reference for the archived release; the on-chain hash provides a tamper-evident corroboration of the S3-resident archive.

---

### PW.4.1 — Acquire and maintain well-secured software components from commercial, open-source, and other third-party developers

**Source:** NIST SP 800-218 v1.1.
**Link:** [NIST SP 800-218 v1.1 §PW.4.1 (p.21)](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-218.pdf#page=21)
**Practice (parent) text:**
> PW.4 Reuse Existing, Well-Secured Software When Feasible Instead of Duplicating Functionality: Lower the costs of software development, expedite software development, and decrease the likelihood of introducing additional security vulnerabilities into the software by reusing software modules and services that have already had their security posture checked. This is particularly important for software that implements security functionality, such as cryptographic modules and protocols.

**Task text:**
> PW.4.1: Acquire and maintain well-secured software components (e.g., software libraries, modules, middleware, frameworks) from commercial, open-source, and other third-party developers for use by the organization's software.

**Notional implementation examples (excerpted):**
> Example 3: Obtain provenance information (e.g., SBOM, source composition analysis, binary software composition analysis) for each software component, and analyze that information to better assess the risk that the component may introduce.
> Example 7: Implement processes to update deployed software components to newer versions, and retain older versions of software components until all transitions from those versions have been completed successfully.

**Artifacts from §3 that evidence this practice:** #2 `trivy-results.json`, #3 `npm-audit.json`, #4 `sbom.cyclonedx.json`

**Rationale (per artifact):**
- `trivy-results.json`: The Trivy scan report enumerates known vulnerabilities in acquired container and library components, providing the evidence that each acquired component was evaluated against current vulnerability intelligence as PW.4.1 requires.
- `npm-audit.json`: The npm audit report performs the same function for the frontend dependency tree, documenting the security posture of acquired open-source npm components at the point of acquisition and at each build.
- `sbom.cyclonedx.json`: The SBOM is the provenance inventory PS.3.1/PW.4.1 Example 3 explicitly identifies; it lists every acquired component with version and supplier, enabling ongoing tracking of component security posture over the software lifecycle.

---

### PW.5.1 — Follow all secure coding practices that are appropriate to the development languages and environment

**Source:** NIST SP 800-218 v1.1.
**Link:** [NIST SP 800-218 v1.1 §PW.5.1 (p.22)](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-218.pdf#page=22)
**Practice (parent) text:**
> PW.5 Create Source Code by Adhering to Secure Coding Practices: Decrease the number of security vulnerabilities in the software, and reduce costs by minimizing vulnerabilities introduced during source code creation that meet or exceed organization-defined vulnerability severity criteria.

**Task text:**
> PW.5.1: Follow all secure coding practices that are appropriate to the development languages and environment to meet the organization's requirements.

**Notional implementation examples (excerpted):**
> Example 5: Use development environments with automated features that encourage or require the use of secure coding practices with just-in-time training-in-place.
> Example 8: Check for other vulnerabilities that are common to the development languages and environment.

**Artifacts from §3 that evidence this practice:** #1 `gitleaks-report.json`

**Rationale (per artifact):**
- `gitleaks-report.json`: The Gitleaks secret-scan report is direct evidence of adherence to the secure coding practice of not embedding credentials in source code (IA-5(7)); a clean report or a documented-and-remediated report demonstrates that PW.5.1's prohibition on unsafe coding patterns is actively enforced in the pipeline.

---

### PW.9.1 — Define a secure baseline by determining how to configure each security-affecting setting

**Source:** NIST SP 800-218 v1.1.
**Link:** [NIST SP 800-218 v1.1 §PW.9.1 (p.25)](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-218.pdf#page=25)
**Practice (parent) text:**
> PW.9 Configure Software to Have Secure Settings by Default: Help improve the security of the software at the time of installation to reduce the likelihood of the software being deployed with weak security settings, putting it at greater risk of compromise.

**Task text:**
> PW.9.1: Define a secure baseline by determining how to configure each setting that has an effect on security or a security-related setting so that the default settings are secure and do not weaken the security functions provided by the platform, network infrastructure, or services.

**Notional implementation examples (excerpted):**
> Example 1: Conduct testing to ensure that the settings, including the default settings, are working as expected and are not inadvertently causing any security weaknesses, operational issues, or other problems.

**Artifacts from §3 that evidence this practice:** #10 `version.json`, #11 SLSA build provenance

**Rationale (per artifact):**
- `version.json`: Records the exact commit, build configuration, and environment identifiers that produced the release, providing the documented-baseline record PW.9.1 requires to demonstrate that a defined, reproducible security configuration was applied at build time.
- SLSA build provenance: The signed provenance attestation captures the build environment inputs and configuration in a verifiable form, giving assessors the evidence that the secure build baseline was consistently applied for this release.

---

### PW.9.2 — Implement the default settings and document each setting for software administrators

**Source:** NIST SP 800-218 v1.1.
**Link:** [NIST SP 800-218 v1.1 §PW.9.2 (p.25)](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-218.pdf#page=25)
**Practice (parent) text:**
> PW.9 Configure Software to Have Secure Settings by Default: Help improve the security of the software at the time of installation to reduce the likelihood of the software being deployed with weak security settings, putting it at greater risk of compromise.

**Task text:**
> PW.9.2: Implement the default settings (or groups of default settings, if applicable), and document each setting for software administrators.

**Notional implementation examples (excerpted):**
> Example 1: Verify that the approved configuration is in place for the software.
> Example 4: Store the default configuration in a usable format and follow change control practices for modifying it (e.g., configuration-as-code).

**Artifacts from §3 that evidence this practice:** #9 `target/*.jar` + `.sha256`

**Rationale (per artifact):**
- `target/*.jar` + `.sha256`: The released JAR artifact is the implementation of the configured and hardened software; the checksum enables administrators to verify that the binary they are deploying matches the baseline the pipeline produced, directly satisfying PW.9.2's requirement to verify the approved configuration is in place.

---

### RV.1.1 — Gather information from software acquirers, users, and public sources on potential vulnerabilities

**Source:** NIST SP 800-218 v1.1.
**Link:** [NIST SP 800-218 v1.1 §RV.1.1 (p.25)](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-218.pdf#page=25)
**Practice (parent) text:**
> RV.1 Identify and Confirm Vulnerabilities on an Ongoing Basis: Help ensure that vulnerabilities are identified more quickly so that they can be remediated more quickly in accordance with risk, reducing the window of opportunity for attackers.

**Task text:**
> RV.1.1: Gather information from software acquirers, users, and public sources on potential vulnerabilities in the software and third-party components that the software uses, and investigate all credible reports.

**Notional implementation examples (excerpted):**
> Example 1: Monitor vulnerability databases, security mailing lists, and other sources of vulnerability reports through manual or automated means.
> Example 3: Automatically review provenance and software composition data for all software components to identify any new vulnerabilities they have.

**Artifacts from §3 that evidence this practice:** #1 `gitleaks-report.json`, #2 `trivy-results.json`, #3 `npm-audit.json`, #7 OSCAL assessment-results

**Rationale (per artifact):**
- `gitleaks-report.json`: Evidence that the pipeline continuously scans source artifacts for credential exposures, instantiating the "gather information on potential vulnerabilities" obligation for the secret-exposure vulnerability class.
- `trivy-results.json`: The Trivy CVE scan is a direct automated implementation of RV.1.1 Example 1 and Example 3 — it queries the NVD and vendor advisories for each container and library component and records findings per run, producing the ongoing vulnerability identification evidence the task requires.
- `npm-audit.json`: Performs the RV.1.1 vulnerability intelligence gathering function for the npm frontend dependency tree, querying the npm advisory database continuously on each pipeline run.
- OSCAL assessment-results: Aggregates automated control assessment findings (including vulnerability scan outcomes) into a structured, machine-readable record that an assessor can use to verify that ongoing vulnerability identification is occurring per RV.1.1's requirement.

---

### RV.1.2 — Review, analyze, and/or test the software's code to identify or confirm the presence of previously undetected vulnerabilities

**Source:** NIST SP 800-218 v1.1.
**Link:** [NIST SP 800-218 v1.1 §RV.1.2 (p.25)](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-218.pdf#page=25)
**Practice (parent) text:**
> RV.1 Identify and Confirm Vulnerabilities on an Ongoing Basis: Help ensure that vulnerabilities are identified more quickly so that they can be remediated more quickly in accordance with risk, reducing the window of opportunity for attackers.

**Task text:**
> RV.1.2: Review, analyze, and/or test the software's code to identify or confirm the presence of previously undetected vulnerabilities.

**Notional implementation examples (excerpted):**
> Example 1: Configure the toolchain to perform automated code analysis and testing on a regular or continuous basis for all supported releases.

**Artifacts from §3 that evidence this practice:** #2 `trivy-results.json`, #3 `npm-audit.json`

**Rationale (per artifact):**
- `trivy-results.json`: The Trivy report is the output of automated vulnerability analysis run continuously on all supported releases; it confirms or refutes the presence of known CVEs in the delivered binary and its dependencies, directly satisfying RV.1.2 Example 1.
- `npm-audit.json`: Provides the equivalent continuous automated analysis for the npm dependency graph, identifying previously undetected vulnerabilities in frontend components on every pipeline run.

---

### RV.1.3 — Have a policy that addresses vulnerability disclosure and remediation

**Source:** NIST SP 800-218 v1.1.
**Link:** [NIST SP 800-218 v1.1 §RV.1.3 (p.26)](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-218.pdf#page=26)
**Practice (parent) text:**
> RV.1 Identify and Confirm Vulnerabilities on an Ongoing Basis: Help ensure that vulnerabilities are identified more quickly so that they can be remediated more quickly in accordance with risk, reducing the window of opportunity for attackers.

**Task text:**
> RV.1.3: Have a policy that addresses vulnerability disclosure and remediation, and implement the roles, responsibilities, and processes needed to support that policy.

**Notional implementation examples (excerpted):**
> Example 1: Establish a vulnerability disclosure program, and make it easy for security researchers to learn about your program and report possible vulnerabilities.
> Example 3: Have a security response playbook to handle a generic reported vulnerability, a report of zero-days, a vulnerability being exploited in the wild, and a major ongoing incident involving multiple parties and open-source software components.

**Artifacts from §3 that evidence this practice:** #7 OSCAL assessment-results

**Rationale (per artifact):**
- OSCAL assessment-results: The assessment-results document captures the outcomes of automated control assessments including CA-2, which encompasses the organization's vulnerability response policy; structured findings in OSCAL format provide assessors with the machine-readable evidence that a disclosure and remediation policy is implemented and operating, satisfying RV.1.3's documentation requirement.

---

## 3. NARA General Records Schedules — Disposition Authorities

GRS items appear in numeric order: GRS 3.1 (General Technology Management
Records) followed by GRS 3.2 (Information Systems Security Records). Each
block reconciles the PDF text against the CSV row and flags any status
discrepancies.

### 3.1 Numbering reconciliation

The GRS 3.1 PDF (Transmittal 30, November 2019) and the machine-implementable CSV (Transmittal 36, August 2024) use **the same item numbers**. The DAA numbers are identical across both sources, confirming alignment. There is no renumbering between Transmittal 30 and Transmittal 36 for GRS 3.1.

**Historical labeling error in §3 of `docs/system-of-record-notes.md` (corrected in the same MR that introduced this document).** Before correction, rows 4, 9, and 11 of §3 cited "GRS 3.1/020 (IT system development records)." Item 3.1/020 is in fact *IT operations and maintenance records* in both Transmittal 30 (PDF) and Transmittal 36 (CSV); system development records are item **3.1/011** (DAA-GRS-2013-0005-0007). The post-correction state cites 3.1/011 for those three rows. The table below records what the citation was, what it is now, and why:

| §3 row | Before | After | Reason |
|---|---|---|---|
| 4 (`sbom.cyclonedx.json`) | GRS 3.1/020 (IT system development records — component inventory) | GRS 3.1/011 (IT development project records — system development records — component inventory) | "IT system development records" is item 011, not 020. |
| 9 (`target/*.jar` + `.sha256`) | GRS 3.1/020 (IT system development records — deliverable artifact) | GRS 3.1/011 (IT development project records — system development records — deliverable artifact) | Same. Retention period reference updated to 3.1/011. |
| 11 (SLSA build provenance) | Alt: GRS 3.1/020 | Alt: GRS 3.1/011 (system development records) | Alt was the same labeling error in compact form. |

No numbering mismatch exists between PDF T30 and CSV T36 for GRS 3.2.

---

### GRS 3.1/011 — IT development project records: system development records

**Source (PDF):** NARA GRS 3.1, Transmittal 30 (November 2019).
**Source (CSV):** Transmittal 36 (August 2024), row GRS 3.1.011.
**Link:** [NARA GRS 3.1/011 PDF (p.2) — DAA-GRS-2013-0005-0007](https://www.archives.gov/files/records-mgmt/grs/grs03-1.pdf#page=2).

**PDF item text:**
> System development records.
> These records relate to the development of information technology (IT) systems and software applications through their initial stages up until hand-off to production which includes planning, requirements analysis, design, verification and testing, procurement, and installation. Records include case files containing documentation of planning, decision making, designing, programming, testing, evaluation, and problem solving. Includes records such as:
> - project plans
> - feasibility studies
> - cost analyses
> - requirements documents
> - compliance documents including: Privacy Threshold Analyses (PTAs); Privacy Impact Assessments (PIAs); Security Plan; Information Protection Plan
> - change control records
> - Project Schedule
> - Plan of Action and Milestones (POA&M)
> - Configuration Management Plan
> - Resource Management Plan
> - Risk Assessment/Mitigation Plan
> - Security Plan
> - Disaster Recovery Plan
> - Test/Acceptance Plan
> - Quality Control Plan
> - Deployment Guide
> - User Guide
> - Training Guide
>
> Exclusion: This item does not apply to system data or content.

**Disposition authority (DAA number):** DAA-GRS-2013-0005-0007

**Disposition instruction (PDF):**
> Temporary. Destroy 5 years after system is superseded by a new iteration, or is terminated, defunded, or no longer needed for agency/IT administrative purposes, but longer retention is authorized if required for business use.

**CSV reconciliation:**
- CSV title: Information technology development project records - System development records
- CSV disposition: Temporary
- CSV retention years: 5
- No discrepancy. DAA matches; retention and event type (Final action) are consistent with the PDF text.

**Artifacts from §3 that this item disposes:** Row 4 (`sbom.cyclonedx.json`), Row 9 (`target/*.jar` + `.sha256`), Row 11 (SLSA build provenance) — all cited in the SoR notes as "GRS 3.1/020 (IT system development records)," which is a labeling error; the correct item is 011.

**Rationale (per artifact):**
- `sbom.cyclonedx.json`: A software bill of materials is component inventory generated during development and is directly analogous to the "requirements documents" and compliance documents enumerated under item 011; it describes what was built and what components were selected.
- `target/*.jar` + `.sha256`: The compiled deliverable artifact is the output of the development phase and constitutes the "as-built" record of what was deployed; it falls within the scope of development-phase documentation retained under item 011 until five years after the system is superseded.
- SLSA build provenance: Build provenance documents the build environment and supply-chain integrity of the development artifact; it is the "test/acceptance" and "deployment guide" analog in provenance form and belongs to the development case file covered by item 011.

---

### GRS 3.1/020 — Information technology operations and maintenance records

**Source (PDF):** NARA GRS 3.1, Transmittal 30 (November 2019).
**Source (CSV):** Transmittal 36 (August 2024), row GRS 3.1.020.
**Link:** [NARA GRS 3.1/020 PDF (p.4) — DAA-GRS-2013-0005-0004](https://www.archives.gov/files/records-mgmt/grs/grs03-1.pdf#page=4).

**PDF item text:**
> Information technology operations and maintenance records.
> Information Technology Operations and Maintenance records relate to the activities associated with the operations and maintenance of the basic systems and services used to supply the agency and its staff with access to computers and data telecommunications. Includes the activities associated with IT equipment, IT systems, and storage media, IT system performance testing, asset and configuration management, change management, and maintenance on network infrastructure.
>
> Includes records such as: files identifying IT facilities and sites; files concerning implementation of IT facility and site management; equipment support services provided to specific sites (reviews, site visit reports, trouble reports, equipment service histories, reports of follow-up actions, related correspondence); inventories of IT assets, network circuits, and building or circuitry diagrams; equipment control systems such as databases of barcodes affixed to IT physical assets, and tracking of [approved] personally-owned devices; requests for service; work orders; service histories; workload schedules; run reports; schedules of maintenance and support activities; problem reports and related decision documents relating to the software infrastructure of the network or system; reports on operations (measures of benchmarks, performance indicators, critical success factors, error and exception reporting, self-assessments, performance monitoring, management reports); website administration (frames, templates, style sheets, site maps, codes that determine site architecture, change requests, site posting logs, clearance records, requests for correction of incorrect links or content posted, requests for removal of duplicate information, user logs, search engine logs, audit logs); records to allocate charges and track payment for software and services.

**Disposition authority (DAA number):** DAA-GRS-2013-0005-0004

**Disposition instruction (PDF):**
> Temporary. Destroy 3 years after agreement, control measures, procedures, project, activity, or transaction is obsolete, completed, terminated or superseded, but longer retention is authorized if required for business use.

**CSV reconciliation:**
- CSV title: Information technology operations and maintenance records
- CSV disposition: Temporary
- CSV retention years: 3
- No discrepancy. DAA matches.

**Artifacts from §3 that this item disposes:** Row 3 (`npm-audit.json`, alt), Row 8 (`evidence-manifest.json`, primary), Row 10 (`version.json`, primary), Row 16 (`s3-receipt.json`, primary), Row 12 (`ci-artifacts.zip`, alt).

**Rationale (per artifact):**
- `npm-audit.json`: Dependency vulnerability scan output is a routine operations-phase diagnostic analogous to "problem reports and related decision documents relating to the software infrastructure"; its 3-year operational retention matches the frequency of dependency churn.
- `evidence-manifest.json`: The manifest records the build-to-artifact chain for a specific pipeline run, functioning as an "audit log" and "run report" in the operations enumeration; the 3-year post-final-action period covers the operational window during which a dispute about a specific run is plausible.
- `version.json`: A per-run version binding record (commit + run ID + timestamp) is an operational audit artifact analogous to the "workload schedules" and "run reports" listed under item 020.
- `s3-receipt.json`: An S3 upload receipt is an operational transfer log, directly analogous to the "audit logs" under website/system administration in item 020.
- `ci-artifacts.zip`: As an alternate disposition authority, item 020's 3-year window covers the operational portion of the bundle's lifecycle before the longer authorization-package retention under GRS 3.2/010 governs.

---

### GRS 3.1/030 — Configuration and change management records

**Source (PDF):** NARA GRS 3.1, Transmittal 30 (November 2019).
**Source (CSV):** Transmittal 36 (August 2024), row GRS 3.1.030.
**Link:** [NARA GRS 3.1/030 PDF (p.5) — DAA-GRS-2013-0005-0005](https://www.archives.gov/files/records-mgmt/grs/grs03-1.pdf#page=5).

**PDF item text:**
> Configuration and change management records.
> Records created and retained for asset management, performance and capacity management, system management, configuration and change management, and planning, follow-up, and impact assessment of operational networks and systems. Includes records such as: data and detailed reports on implementation of systems, applications and modifications; application sizing, resource and demand management records; documents identifying, requesting, and analyzing possible changes, authorizing changes, and documenting implementation of changes; documentation of software distribution (including COTS software license management files) and release or version management.

**Disposition authority (DAA number):** DAA-GRS-2013-0005-0005

**Disposition instruction (PDF):**
> Temporary. Destroy 5 years after system is superseded by a new iteration, or is terminated, defunded, or no longer needed for agency/IT administrative purposes, but longer retention is authorized if required for business use.

**CSV reconciliation:**
- CSV title: Configuration and Change Management Records
- CSV disposition: Temporary
- CSV retention years: 5
- No discrepancy. DAA matches.

**Artifacts from §3 that this item disposes:** Row 10 (`version.json`, alt).

**Rationale (per artifact):**
- `version.json`: A version binding record (commit SHA + pipeline run ID + build timestamp) is a "release or version management" document explicitly enumerated under item 030; its 5-year post-system-supersession retention is longer than the 3-year ops retention under 3.1/020 and applies when the record must follow the system lifecycle rather than the operational transaction lifecycle.

---

### GRS 3.1/040 — Information technology oversight and compliance records

**Source (PDF):** NARA GRS 3.1, Transmittal 30 (November 2019).
**Source (CSV):** Transmittal 36 (August 2024), row GRS 3.1.040.
**Link:** [NARA GRS 3.1/040 PDF (p.6) — DAA-GRS-2013-0005-0010](https://www.archives.gov/files/records-mgmt/grs/grs03-1.pdf#page=6).

**PDF item text:**
> Information technology oversight and compliance records.
> Information Technology (IT) Oversight and Compliance records relate to compliance with IT policies, directives, and plans. Records are typically found in offices with agency-wide or bureau-wide responsibility for managing IT operations. Includes records such as: recurring and special reports; responses to findings and recommendations; reports of follow-up activities; statistical performance data; metrics; inventory of web activity; web use statistics; comments/feedback from web site or application users; internal and external reporting for compliance requirements relating to the Privacy Act, and electronic and information technology accessibility under Section 508 of the Rehabilitation Act; system availability reports; target IT architecture reports; systems development lifecycle handbooks; computer network assessments and follow-up documentation; vulnerability assessment reports; assessment and authorization of equipment; Independent Verification and Validation (IV&V) reports; contractor evaluation reports; quality assurance reviews and reports; market analyses and performance surveys; benefit-cost analyses; make vs. buy analysis; reports on implementation of plans; compliance reviews; data measuring or estimating impact and compliance.

**Disposition authority (DAA number):** DAA-GRS-2013-0005-0010

**Disposition instruction (PDF):**
> Temporary. Destroy 5 years after the project/activity/transaction is completed or superseded, but longer retention is authorized if required for business use.

**CSV reconciliation:**
- CSV title: Information technology oversight and compliance records
- CSV disposition: Temporary
- CSV retention years: 5
- No discrepancy. DAA matches.

**Artifacts from §3 that this item disposes:** Row 2 (`trivy-results.json`, alt — suppression-rationale aspect), Row 7 (OSCAL assessment-results, alt), Row 13 (`attestation.pdf`, alt).

**Rationale (per artifact):**
- `trivy-results.json` (suppression rationale): When a Trivy finding is suppressed with documented rationale, that rationale constitutes a "response to findings and recommendations" and a "vulnerability assessment report" — oversight records of a compliance decision rather than a raw security-operations record, shifting the applicable item from 3.2/010 to 3.1/040.
- OSCAL assessment-results: Automated control-assessment results are "quality assurance reviews" and "compliance reviews" produced by the pipeline's IV&V-equivalent function; the 5-year post-supersession period under item 040 provides an alternative framing when the assessment is classified as an oversight artifact rather than a security-authorization record.
- `attestation.pdf`: A human-readable pipeline attestation is a "report on implementation of plans" and "compliance review" document; item 040 applies as an alternative when the document is treated as an IT oversight artifact rather than an authorization-package record.

---

### GRS 3.1/050 — Data administration records: documentation necessary for preservation of permanent electronic records

**Source (PDF):** NARA GRS 3.1, Transmittal 30 (November 2019).
**Source (CSV):** Transmittal 36 (August 2024), row GRS 3.1.050.
**Link:** [NARA GRS 3.1/050 PDF (p.7) — DAA-GRS-2013-0005-0002](https://www.archives.gov/files/records-mgmt/grs/grs03-1.pdf#page=7).

**PDF item text:**
> Data administration records — Documentation necessary for preservation of permanent electronic records.
> Data administration records and documentation relating to electronic records scheduled as permanent in the GRS or in a NARA-approved agency schedule must be transferred to the National Archives to allow for continued access to the records, including: data/database dictionary records; data systems specifications; file specifications; code books; record layouts; metadata; user guides; output specifications.

**Disposition authority (DAA number):** DAA-GRS-2013-0005-0002

**Disposition instruction (PDF):**
> Permanent. Transfer to the National Archives with the permanent electronic records to which the documentation relates.

**CSV reconciliation:**
- CSV title: Data administration records - Documentation necessary for preservation of permanent electronic records
- CSV disposition: Permanent
- CSV retention years: N/A
- No discrepancy. The CSV marks this as Permanent with N/A retention years.

**Artifacts from §3 that this item disposes:** Row 9 (`target/*.jar` + `.sha256`) — only if the deployed system is the production baseline for a record series classified as permanent under another GRS item; records-officer confirmation required.

**Rationale (per artifact):**
- `target/*.jar` + `.sha256`: If the deployed binary is the executable form of a system whose records are scheduled as permanent, the binary and its checksum constitute technical documentation necessary for accessing those permanent records and must transfer to NARA with them; records-officer determination resolves whether this condition is met for the springboard system.

---

### GRS 3.2/010 — Systems and data security records

**Source (PDF):** NARA GRS 3.2, Transmittal 33 (January 2023).
**Source (CSV):** Transmittal 36 (August 2024), row GRS 3.2.010.
**Link:** [NARA GRS 3.2/010 PDF (p.1) — DAA-GRS-2013-0006-0001](https://www.archives.gov/files/records-mgmt/grs/grs03-2.pdf#page=1).

**PDF item text:**
> Systems and data security records.
> These are records related to maintaining the security of information technology (IT) systems and data. Records outline official procedures for securing and maintaining IT infrastructure and relate to the specific systems for which they were written. This series also includes analysis of security policies, processes, and guidelines, as well as system risk management and vulnerability analyses. Includes records such as: System Security Plans; Disaster Recovery Plans; Continuity of Operations Plans; published computer technical manuals and guides; examples and references used to produce guidelines covering security issues related to specific systems and equipment; records on disaster exercises and resulting evaluations; network vulnerability assessments; risk surveys; service test plans; test files and data.

**Disposition authority (DAA number):** DAA-GRS-2013-0006-0001

**Disposition instruction (PDF):**
> Temporary. Destroy 1 year(s) after system is superseded by a new iteration or when no longer needed for agency/IT administrative purposes to ensure a continuity of security controls throughout the life of the system.

**CSV reconciliation:**
- CSV title: Systems and data security records
- CSV disposition: Temporary
- CSV retention years: N/A
- **Discrepancy / flag:** The CSV marks this item as "not machine-implementable and will be revised." Retention years is listed as N/A rather than the PDF's 1-year-after-superseded instruction. The SoR notes correctly flag this and rely on the PDF's pre-revision text. The CSV revision will likely disaggregate this umbrella item into separately schedulable sub-items.

**Status flag:** CSV marks this item as "not machine-implementable and will be revised." The retention values cited in the SoR notes (6 years for authorization records, 3 years for security-ops sub-items) reflect the pre-revision schedule's internal sub-item structure. A revised 3.2/010 may disaggregate into separately schedulable items.

**Artifacts from §3 that this item disposes:** Row 1 (`gitleaks-report.json`, primary — security testing sub-item), Row 2 (`trivy-results.json`, primary — vulnerability management sub-item), Row 3 (`npm-audit.json`, primary — security assessment sub-item), Row 4 (`sbom.cyclonedx.json`, alt — security baseline supporting authorization), Row 5 (OSCAL component-definition, primary — control implementation, authorization-package sub-item), Row 6 (OSCAL SSP, primary), Row 7 (OSCAL assessment-results, primary), Row 11 (SLSA build provenance, primary — supply-chain integrity), Row 12 (`ci-artifacts.zip`, primary), Row 13 (`attestation.pdf`, primary), Row 14 (`attestation.json`, primary), Row 15 (`timestamp.tsr` + `tsa-certchain.pem`, primary).

**Rationale (per artifact):**
- `gitleaks-report.json`: A secrets-scan report is a security testing record ("service test plans," "test files and data") that documents whether embedded credentials exist in the codebase; the 3-year security-ops sub-item retention applies when no incident is opened, extending to incident-record retention if findings trigger GRS 3.2/020.
- `trivy-results.json`: A container/dependency vulnerability scan report is a "network vulnerability assessment" and "risk survey" record; the authorization-support sub-item retention (6 years after authorization superseded) applies when the scan is part of an ATO evidence package.
- `npm-audit.json`: A frontend dependency audit is a "risk survey" and security assessment record under the security-assessment sub-item; 3-year post-final-action retention applies for routine scans not tied to an open authorization package.
- `sbom.cyclonedx.json`: As an alt citation, a SBOM serves as the component inventory underlying a security baseline ("analysis of security policies, processes, and guidelines") and supports the authorization package; 6-year retention after authorization superseded applies.
- OSCAL component-definition: A machine-readable control implementation statement is a core authorization-package record describing how security controls are implemented; 6 years after authorization superseded aligns with the SSP lifecycle.
- OSCAL SSP: A system security plan is explicitly enumerated ("System Security Plans") as a record covered by this item; 6 years after system decommissioned or authorization superseded reflects standard ATO lifecycle practice.
- OSCAL assessment-results: Automated assessment findings document the state of control implementation at assessment time; as an authorization-package record they carry the 6-year post-supersession retention.
- SLSA build provenance: Build provenance attests to supply-chain integrity and constitutes authorization-supporting documentation for the deployed artifact; 6-year post-authorization-superseded retention applies when the provenance is part of the ATO evidence package.
- `ci-artifacts.zip`: An authorization-package bundle inherits the retention of its longest-lived constituent record (the SSP or authorization decision); 6-year post-authorization-superseded retention governs.
- `attestation.pdf` / `attestation.json`: A human/machine-readable pipeline attestation is authorization-package documentation; both records carry the 6-year post-supersession retention as non-repudiation evidence for the authorization.
- `timestamp.tsr` + `tsa-certchain.pem`: An RFC 3161 timestamp record tied to a pipeline artifact is integrity and non-repudiation evidence supporting the authorization package; retention is tied to the bundle it anchors (6 years after authorization superseded).

---

### GRS 3.2/020 — Computer security incident handling, reporting and follow-up records

**Source (PDF):** NARA GRS 3.2, Transmittal 33 (January 2023).
**Source (CSV):** Transmittal 36 (August 2024), row GRS 3.2.020.
**Link:** [NARA GRS 3.2/020 PDF (p.1) — DAA-GRS-2013-0006-0002](https://www.archives.gov/files/records-mgmt/grs/grs03-2.pdf#page=1).

**PDF item text:**
> Computer security incident handling, reporting and follow-up records.
> A computer incident within the Federal Government as defined by NIST Special Publication 800-61, Computer Security Incident Handling Guide, Revision 2, (August 2012) is a violation or imminent threat of violation of computer security policies, acceptable use policies, or standard computer security practices. This item covers records relating to attempted or actual system security breaches, including break-ins ("hacks," including virus attacks), improper staff usage, failure of security provisions or procedures, and potentially compromised information assets. It also includes agency reporting of such incidents both internally and externally. Includes records such as: reporting forms; reporting tools; narrative reports; background documentation.

**Disposition authority (DAA number):** DAA-GRS-2013-0006-0002

**Disposition instruction (PDF):**
> Temporary. Destroy 3 year(s) after all necessary follow-up actions have been completed, but longer retention is authorized if required for business use.

**CSV reconciliation:**
- CSV title: Computer security incident handling, reporting and follow-up records
- CSV disposition: Temporary
- CSV retention years: 3
- No discrepancy. DAA matches; event type is Final action; 3-year retention is consistent.

**Artifacts from §3 that this item disposes:** Row 1 (`gitleaks-report.json`, alt — if findings open an incident).

**Rationale (per artifact):**
- `gitleaks-report.json`: When a secrets-scan finding triggers an incident response (e.g., a confirmed leaked credential requiring rotation and reporting), the report becomes "background documentation" for the incident record under GRS 3.2/020; the 3-year post-follow-up retention then governs rather than the routine security-testing retention.

---

### GRS 3.2/035 — Cybersecurity logging records: full packet capture data

**Source (PDF):** NARA GRS 3.2, Transmittal 33 (January 2023).
**Source (CSV):** Transmittal 36 (August 2024), row GRS 3.2.035.
**Link:** [NARA GRS 3.2/035 PDF (p.2) — DAA-GRS-2022-0005-0001](https://www.archives.gov/files/records-mgmt/grs/grs03-2.pdf#page=2).

**PDF item text:**
> Cybersecurity logging records — Full packet capture data.
> Packet capture (PCAP) results from the interception and copying of a data packet that is crossing or moving over a specific computer network.
> Legal citation: OMB Memo M-21-31.
> Note: The requirements in OMB Memo M-21-31 do not apply to national security systems. Agencies may use this GRS for national security systems or submit an agency-specific schedule.

**Disposition authority (DAA number):** DAA-GRS-2022-0005-0001

**Disposition instruction (PDF):**
> Temporary. Destroy when 72 hours old. Longer retention is authorized for business use.

**CSV reconciliation:**
- CSV title: Cybersecurity logging records - Full packet capture data
- CSV disposition: Temporary
- CSV retention years: 72h
- No discrepancy.

**Artifacts from §3 that this item disposes:** None directly — the SoR notes flag this as applicable to the SoR infrastructure's access logs (§1.9), not to pipeline-emitted artifacts in the current inventory.

**Rationale:** Included for completeness as cited in §3.1 table notes. Item applies to the SoR's own infrastructure logs (§1.9), not to the pipeline output artifacts in the §3 inventory.

---

### GRS 3.2/036 — Cybersecurity logging records: cybersecurity event logs

**Source (PDF):** NARA GRS 3.2, Transmittal 33 (January 2023).
**Source (CSV):** Transmittal 36 (August 2024), row GRS 3.2.036.
**Link:** [NARA GRS 3.2/036 PDF (p.3) — DAA-GRS-2022-0005-0002](https://www.archives.gov/files/records-mgmt/grs/grs03-2.pdf#page=3).

**PDF item text:**
> Cybersecurity event logs.
> Logs required by OMB Memo M-21-31 to capture data used in the detection, investigation, and remediation of cyber threats.
> Legal citation: OMB Memo M-21-31.

**Disposition authority (DAA number):** DAA-GRS-2022-0005-0002

**Disposition instruction (PDF):**
> Temporary. Destroy when 30 months old. Longer retention is authorized for business use.

**CSV reconciliation:**
- CSV title: Cybersecurity logging records - Cybersecurity event logs
- CSV disposition: Temporary
- CSV retention years: 30m
- No discrepancy.

**Artifacts from §3 that this item disposes:** None directly — applicable to the SoR's own audit/access logs under §1.9.

**Rationale:** Same applicability note as 3.2/035 — included for completeness as cited in §3.1 table notes.

---

### GRS 3.2/060 — PKI administrative records (FBCA CAs)

**Source (PDF):** NARA GRS 3.2, Transmittal 33 (January 2023).
**Source (CSV):** Transmittal 36 (August 2024), row GRS 3.2.060.
**Link:** [NARA GRS 3.2/060 PDF (p.4) — N1-GRS-07-003, item 13a1](https://www.archives.gov/files/records-mgmt/grs/grs03-2.pdf#page=4).

**PDF item text:**
> PKI administrative records — FBCA CAs.
> Records are PKI-unique administrative records that establish or support authentication by tying the user to a valid electronic credential and other administrative non-PKI records that are retained to attest to the reliability of the PKI transaction process. Included are policies and procedures planning records; stand-up configuration and validation records; operation records; audit and monitor records; and termination, consolidation, or reorganizing records.

**Disposition authority (DAA number):** N1-GRS-07-3, item 13a1

**Disposition instruction (PDF):**
> Temporary. Destroy/delete when 7 years 6 months, 10 years 6 months, or 20 years 6 months old, based on the maximum level of operation of the CA, or when no longer needed for business, whichever is later.

**CSV reconciliation:**
- CSV title: PKI administrative records - FBCA CAs
- CSV disposition: Temporary
- CSV retention years: N/A
- **Status flag:** CSV marks this item as "not machine-implementable and will be revised." The tiered retention (7.5/10.5/20.5 years) cannot be expressed as a simple integer in the current CSV schema.

**Artifacts from §3 that this item disposes:** Row 15 (`timestamp.tsr` + `tsa-certchain.pem`, alt — PKI-adjacent transaction).

**Rationale (per artifact):**
- `timestamp.tsr` + `tsa-certchain.pem`: The TSA certificate chain (`tsa-certchain.pem`) is a PKI administrative record establishing the trust anchor for the RFC 3161 timestamp; if the TSA operates as an FBCA CA, item 060 governs the certificate chain's retention rather than the transactional 3.2/062 item.

---

### GRS 3.2/061 — PKI administrative records (Other non-FBCA CAs)

**Source (PDF):** NARA GRS 3.2, Transmittal 33 (January 2023).
**Source (CSV):** Transmittal 36 (August 2024), row GRS 3.2.061.
**Link:** [NARA GRS 3.2/061 PDF (p.4) — N1-GRS-07-003, item 13a2](https://www.archives.gov/files/records-mgmt/grs/grs03-2.pdf#page=4).

**PDF item text:**
> PKI administrative records — Other (non-FBCA et al.) CAs.
> [Description block is shared with item 060; sub-item distinction is the CA type, not the record description.]

**Disposition authority (DAA number):** N1-GRS-07-3, item 13a2

**Disposition instruction (PDF):**
> Temporary. Destroy/delete when 7 years 6 months to 20 years 6 months old, based on the maximum level of operation of the CA, or when no longer needed for business, whichever is later.

**CSV reconciliation:**
- CSV title: PKI administrative records - Other (non-FBCA et al) CAs
- CSV disposition: Temporary
- CSV retention years: N/A
- **Status flag:** CSV marks this item as "not machine-implementable and will be revised."

**Artifacts from §3 that this item disposes:** Row 15 (`timestamp.tsr` + `tsa-certchain.pem`, alt — PKI-adjacent transaction, non-FBCA TSA variant).

**Rationale (per artifact):**
- `tsa-certchain.pem`: If the RFC 3161 TSA operates under a non-FBCA CA (e.g., a commercial TSA certificate chain), item 061 governs the certificate chain's PKI administrative records rather than item 060; the retention range is the same.

---

### GRS 3.2/062 — PKI transaction-specific records

**Source (PDF):** NARA GRS 3.2, Transmittal 33 (January 2023).
**Source (CSV):** Transmittal 36 (August 2024), row GRS 3.2.062.
**Link:** [NARA GRS 3.2/062 PDF (p.5) — N1-GRS-07-003, item 13b](https://www.archives.gov/files/records-mgmt/grs/grs03-2.pdf#page=5).

**PDF item text:**
> PKI transaction-specific records.
> Records relate to transaction-specific records that are generated for each transaction using PKI digital signature technology. Records are embedded or referenced within the transaction stream and may be appended to the transaction content or information record. Along with PKI administrative and other administrative records, transaction-specific records are part of the PKI trust documentation set that establish or support the trustworthiness of a transaction.

**Disposition authority (DAA number):** N1-GRS-07-3, item 13b

**Disposition instruction (PDF):**
> Temporary. Destroy/delete when 7 years 6 months to 20 years 6 months old, based on the maximum level of operation of the appropriate CA and after the information record the PKI is designed to protect and/or access is destroyed according to an authorized schedule, or in the case of permanent records, when the record is transferred to NARA legal custody. Longer retention is authorized if the agency determines that transaction-specific PKI records are needed for a longer period.

**CSV reconciliation:**
- CSV title: PKI transaction-specific records
- CSV disposition: Temporary
- CSV retention years: N/A
- **Status flag:** CSV marks this item as "not machine-implementable and will be revised."

**Artifacts from §3 that this item disposes:** Row 15 (`timestamp.tsr` + `tsa-certchain.pem`, alt — the `.tsr` file is a transaction-specific record).

**Rationale (per artifact):**
- `timestamp.tsr`: An RFC 3161 timestamp response is a PKI transaction-specific record generated per artifact signing event; it is embedded in the trust documentation set for the signed artifact and must be retained at minimum as long as the information record it protects, making the authorization-lifecycle retention the controlling period in practice.
