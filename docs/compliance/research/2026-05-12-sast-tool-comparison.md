# SB-GL-8: SAST Tool Comparison

**Date:** 2026-05-12
**Prepared by:** Ron (security/compliance persona, Straylight family)
**Status:** FULL REPORT — per-tool detail + comparison table + recommendation

---

## Context and Gap

The golden pipeline currently runs gitleaks (secrets, PW.6), npm audit (JS deps), Trivy fs
(multi-source vuln scan, PW.7/PW.8), and Syft (SBOM, PW.4). No job performs application-source
static analysis. SP 800-218 PW.5 ("test executable code") and PW.7 source-review obligations are
evidenced only at the dependency level; an assessor can reasonably flag the absence of
source-level CWE findings for Java 17/Spring and Angular/TypeScript surfaces.

---

## GitLab Built-in SAST

**License:** GitLab Ultimate for the managed SAST UI; the underlying analyzers
(semgrep-sast, spotbugs) are Apache-2.0 / LGPL-3. On GitLab.com Free and Self-Managed CE/EE
you can invoke the same analyzer images directly in a custom job without the Ultimate gate.
Effective cost: zero for OSS analyzer images invoked via a custom CI job.

**GitLab CI integration:** `include: template: Security/SAST.gitlab-ci.yml` on Ultimate, or a
manual job using `registry.gitlab.com/security-products/semgrep:latest` and
`registry.gitlab.com/security-products/spotbugs:latest` images. The template produces
`gl-sast-report.json` (GitLab SAST schema). Custom-job approach requires writing ~20 lines of
YAML; no server, no persistent state, no extra infra.

**Stack coverage (Java 17 + Spring + Angular/TypeScript):**

- A01 Broken Access Control — Semgrep catches missing auth annotations in Spring; SpotBugs/FSB
  catches path-traversal patterns. Partial coverage.
- A02 Cryptographic Failures — SpotBugs/FindSecBugs has explicit CWE-327/CWE-326 checks for weak
  cipher usage in Java. Semgrep TS rules flag hard-coded keys. Good coverage.
- A03 Injection — SpotBugs/FSB covers SQL injection (CWE-89), LDAP injection, command injection
  for Java. Semgrep covers template injection and prototype pollution for TypeScript. Good.
- A05 Security Misconfiguration — Semgrep has Spring-specific rules (CSRF disabled, permissive
  CORS). Partial.
- A07 Identification/Authentication Failures — FSB detects predictable random seeds (CWE-330) and
  insecure session handling. Semgrep covers JWT misuse patterns in TS. Partial.
- A09 Logging Failures — FSB has log-injection (CWE-117) checks. Partial.

**Runtime cost:** Semgrep image ~2-4 min on this codebase; SpotBugs image ~3-6 min with Maven
compilation. Total SAST stage: 6-10 min in parallel with existing compliance-check jobs.

**Output format:** `gl-sast-report.json` — structured JSON with `vulnerabilities[].cwe`,
`.severity`, `.location.file/line`, `.identifiers[].type==cwe`. Directly parseable by
`generate-oscal.js` with a new observation-type handler. No SARIF conversion needed.

**Federal-compliance fit:** Covers PW.5.1 (use automated tools to find security issues in code)
and PW.7.1 (check for vulnerabilities using automated analysis) with per-finding CWE identifiers.
Dual-analyzer approach (Semgrep for TS, SpotBugs/FSB for Java) provides language-surface
completeness an assessor can verify by inspection of the CI YAML. Strongest fit for this stack.

---

## Semgrep OSS

**License:** LGPL-2.1 for the engine; community rules under CC-BY-4.0; Pro rules commercial.
The `semgrep --config=auto` community ruleset is sufficient for FIPS 199 Moderate baseline.

**GitLab CI integration:** `semgrep/semgrep:latest` Docker image; custom job, ~10 lines of YAML.
Outputs SARIF or JSON. No server, no egress (community config fetched at job start from
semgrep.dev, or supply a local `--config=path/to/rules` to eliminate egress entirely).

**Stack coverage:**

- Strong TypeScript/Angular coverage: injection patterns, prototype pollution, insecure eval,
  Angular-specific template injection. A03, A06, A07 partial.
- Java coverage is shallower than SpotBugs/FSB: rules-based, not bytecode; misses runtime-type
  constructs. A02 (crypto) and SQL injection covered; Spring-specific patterns require custom
  rules or Pro ruleset.
- Combined with SpotBugs (GitLab built-in config), the gap closes. Standalone Semgrep OSS
  is Java-light.

**Runtime cost:** 1-3 min for TypeScript surface; 2-5 min for Java. Lower CPU profile than
SpotBugs because no compilation step.

**Output format:** SARIF 2.1 natively; `--json` for GitLab-schema-adjacent output. SARIF is
not directly consumed by the existing OSCAL pipeline — requires a SARIF-to-observation shim.

**Federal-compliance fit:** PW.5.1 / PW.7.1 satisfied for TypeScript surface; Java coverage
gap is a risk if an assessor requests evidence of injection-class findings against Spring
controllers. Must be paired with SpotBugs for full-surface coverage.

---

## SpotBugs + FindSecBugs

**License:** LGPL-3.0 (SpotBugs); LGPL-3.0 (FindSecBugs plugin). Fully OSS, no commercial tier.

**GitLab CI integration:** Maven plugin (`com.github.spotbugs:spotbugs-maven-plugin`) added to
`pom.xml`, invoked as `./mvnw spotbugs:check` in the CI job. Alternatively, use the
`registry.gitlab.com/security-products/spotbugs` image (the same analyzer GitLab SAST uses).
No server dependency. Requires compiled bytecode — runs after `mvn compile` or as part of
`verify`. Produces XML report; FindSecBugs adds JSON-ish extensions.

**Stack coverage (Java only — no TypeScript):**

- A02 Crypto: CWE-327, CWE-326, CWE-330 — excellent, signature-based against JCA/JCE.
- A03 Injection: SQL (CWE-89), LDAP, OS command — yes via FSB command injection detector.
- A04 Insecure Design: Spring-specific misconfig (FSB spring rules) — partial.
- A07 Auth: CWE-798 hard-coded credentials, CWE-330 predictable random — yes.
- No Angular/TypeScript coverage — separate tool required for frontend surface.

**Runtime cost:** 3-7 min; requires compilation. Memory profile: moderate (JVM, 512 MB-1 GB).

**Output format:** XML SpotBugs report; `spotbugs-maven-plugin` can produce XML/HTML/SARIF.
SARIF output requires additional configuration. OSCAL integration needs a SARIF or XML parser
added to `generate-oscal.js`.

**Federal-compliance fit:** Mature, deterministic, CWE-mapped — assessor credibility for
Java is high. The TS gap requires a second tool. Paired with Semgrep (as in the GitLab SAST
template), the combination is the strongest Java + TS package for this stack.

---

## CodeQL

**License:** Free for public/open-source repositories under the GitHub CodeQL License; use in
private repositories in non-GitHub CI requires license verification. The CodeQL engine binary
is proprietary; query packs are MIT. **Verify license compliance before adopting for this
private federal POC.**

**GitLab CI integration:** Standalone CLI (`codeql database create` + `codeql database analyze`)
in a custom job. Requires downloading the CodeQL bundle (~500 MB) per run unless cached.
No server, but higher setup burden than a pre-built analyzer image.

**Stack coverage:**

- Java: deep dataflow and taint tracking — best-in-class for CWE-89 (SQL injection through
  Spring JPA), CWE-79 (XSS), CWE-611 (XXE). A01, A02, A03, A10 — yes.
- TypeScript: strong; covers prototype pollution, injection, DOM XSS, path traversal.
- Spring-specific dataflow sources/sinks are modeled in the standard query pack.

**Runtime cost:** Significant. Database creation (compilation + extraction): 8-15 min for
this stack. Analysis: 5-10 min additional. Total: 15-25 min. High CPU and memory (2-4 GB).
Not suitable for the fast-feedback compliance-check stage; better in a nightly/scheduled job.

**Output format:** SARIF 2.1. Excellent tooling for consuming SARIF; requires SARIF shim for
OSCAL evidence pipeline.

**Federal-compliance fit:** PW.5.1 / PW.7.1 — yes, with dataflow depth that exceeds
pattern-based tools. License and runtime cost are the practical barriers. Escalation path
if a future assessment demands taint-tracking evidence.

---

## SonarQube Community Edition

**License:** LGPL-3.0 (CE). Free to run; Java + TypeScript supported.

**GitLab CI integration:** Requires a running SonarQube server. The `sonar-scanner` CLI
reports to the server; results are viewed in the server UI, not as CI artifacts. In a
server-less CI posture this is a blocking constraint. Hosting a SonarQube CE instance
(Docker, k8s, or VM) adds infra management burden disproportionate to the project scope.
SonarCloud (SaaS) is the server-free variant but entails source egress to Sonar's cloud.

**Stack coverage:** Strong for Java (A01-A07); TypeScript coverage is good but behind Semgrep
community for Angular-specific patterns.

**Runtime cost:** Scanner itself is fast (~3-5 min); the server is the cost center.

**Output format:** Results live in the server database; CI integration returns a Quality Gate
pass/fail. No artifact suitable for OSCAL observation ingest without custom API calls.

**Federal-compliance fit:** Server dependency and source egress (SonarCloud) are disqualifying
for a federal POC posture. CE self-hosted avoids egress but adds infra. Disqualified on
infrastructure grounds at current project scope.

---

## Snyk Code

**License:** Commercial; free tier covers open-source projects (public repos) with limited
scan volume. Private repos require a paid plan. Source is transmitted to Snyk's cloud
infrastructure for analysis.

**GitLab CI integration:** `snyk/snyk:latest` image; `snyk code test`. Clean integration;
results in SARIF or JSON.

**Stack coverage:** Good Java and TypeScript coverage; Snyk's security intelligence is
strong on dependency CVEs (already covered by npm audit + Trivy). Code analysis adds
taint-tracking for injection classes.

**Runtime cost:** 3-6 min; cloud-backed analysis.

**Federal-compliance fit:** Source egress to commercial SaaS is incompatible with federal
POC posture without explicit authorization. Disqualified.

---

## Comparison Table

| Criterion | GitLab SAST (Semgrep+SpotBugs) | Semgrep OSS (standalone) | SpotBugs+FSB (standalone) | CodeQL | SonarQube CE | Snyk Code |
|---|---|---|---|---|---|---|
| License | OSS (Apache-2/LGPL) | LGPL-2.1 / CC-BY | LGPL-3.0 | Proprietary engine / OSS queries | LGPL-3.0 | Commercial |
| Zero infra | Yes | Yes | Yes | Yes (CLI) | No (server) | No (SaaS) |
| Java 17 coverage | Yes (SpotBugs+FSB) | Partial | Yes | Yes (deep) | Yes | Yes |
| TypeScript coverage | Yes (Semgrep) | Yes | No | Yes | Partial | Yes |
| Source egress | No | Optional | No | No | SonarCloud only | Yes |
| Output format | gl-sast-report.json | SARIF / JSON | XML / SARIF | SARIF | Server API | SARIF / JSON |
| OSCAL integration effort | Low (JSON shim) | Medium (SARIF shim) | Medium (XML/SARIF shim) | Medium (SARIF shim) | High (API + server) | Medium |
| SP 800-218 PW.5/PW.7 fit | Strong | TS only | Java only | Very strong | Strong | Strong |
| Runtime (approx.) | 6-10 min | 3-8 min | 3-7 min | 15-25 min | 3-5 min + server | 3-6 min |
| Federal POC posture | Acceptable | Acceptable | Acceptable | Verify license | Infra burden | Disqualified |

---

## Recommendation

### Primary — GitLab Built-in SAST Template (Semgrep + SpotBugs/FindSecBugs)

Invoke `registry.gitlab.com/security-products/semgrep` and
`registry.gitlab.com/security-products/spotbugs` as a new `sast` stage job in
`golden-pipeline.yml`, parallel to the existing `compliance-check` jobs. Single CI YAML
addition, zero new infrastructure, no source egress, dual-language surface coverage.

The `gl-sast-report.json` output carries per-finding CWE identifiers that map directly to
OSCAL observation entries. A new handler in `generate-oscal.js` consuming this artifact
closes the PW.5.1 ("use automated tools to find security issues in the code") and PW.7.1
("check for vulnerabilities using automated analysis tools") evidence gaps. An
Authorize-step assessor can trace each OSCAL observation back to a specific CWE, file, and
line number — the minimum credible posture for FIPS 199 Moderate.

### Alternate — CodeQL (Escalation Path)

If a future assessment requires dataflow/taint-tracking-level evidence rather than
pattern-level evidence — for example, an assessor requesting proof that all Spring
controller inputs are validated before reaching JPA queries — CodeQL is the right tool.
The license situation for private repos must be resolved before adoption. Recommend running
CodeQL in a nightly scheduled pipeline job rather than the fast-feedback merge-request
pipeline due to runtime cost.

### Disqualified

- **SonarQube CE** — server dependency; infrastructure burden exceeds current project scope.
  SonarCloud variant introduces source egress.
- **Snyk Code** — source transmitted to commercial SaaS; incompatible with federal POC
  posture without explicit authorization.

---

*This recommendation is advisory. Final tool selection is the user's decision.*
*Report generated by Ron (Sonnet 4.6 research pass), 2026-05-12.*
