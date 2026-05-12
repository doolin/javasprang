# INC-2026-05-12-001 — Agent retry-on-500 created 19 duplicate work items

**Status:** Open — remediation in progress
**Detected:** 2026-05-12 (~17:35 UTC) by maintainer review of the GitLab work-item tracker
**Severity:** Medium — control-artifact integrity; no security-boundary impact
**Authoring agent:** Ron (security and compliance persona, Straylight family) running on Claude Opus 4.7 (Claude Code)
**Authorizing Official (interim):** maintainer (`doolin`)
**Incident ticket:** [SB-GL-25](https://gitlab.com/doolin/springboard/-/work_items/25) (repurposed from the first duplicate of SB-GL-24)

---

## Summary

Between 17:14 UTC and 17:30 UTC on 2026-05-12, the Ron compliance agent retried `POST /projects/doolin%2Fspringboard/issues` calls against the GitLab.com issue-creation endpoint during a transient `500 Internal Server Error` storm. Each retry, despite the 500 response, succeeded server-side and created a new issue. The agent did not perform a search-before-create or verify-after-error check. The cumulative effect was **19 duplicate work items** at IIDs SB-GL-25 through SB-GL-43, all carrying the same title and description as the originally-intended SB-GL-24 (`Widen .gitignore so shared .claude/ agent config can be tracked`).

The duplicates were detected and surfaced by the maintainer (Authorizing Official, interim) within ~5 minutes of the final create.

## Impact

- **Control-artifact integrity (SI-7, CM-3).** The GitLab work-item tracker is the system of record for change authorization on this project. It now contains 19 spurious entries. An assessor reading the tracker without context would observe 20 identical "widen .gitignore" tickets created within a 16-minute window.
- **Audit-trail noise (AU-12).** Structured audit records (issue-creation events) were generated for each duplicate. The records are individually accurate but reduce the signal-to-noise ratio of the issue-tracker audit stream.
- **No security-boundary impact.** No code change. No access control bypass. No data exfiltration. No effect on the production runtime, the OSCAL evidence pipeline, or any control gate. The incident is bounded to the work-item-tracker artifact.

## Timeline

| Time (UTC) | Event |
|---|---|
| ~17:09 | GitLab.com runner pool saturation begins; CI pipelines stall at `created` |
| ~17:14 | Agent (Ron via Opus 4.7) begins filing SB-GL-24 — the `.gitignore` widening ticket |
| 17:14–17:30 | GitLab issue-creation endpoint returns 500 to the `glab` client on each call; the agent retries each 500; each retry creates a new issue server-side; IIDs 24–42 are consumed silently |
| ~17:30 | Endpoint recovers; the agent receives a 200 response carrying the URL for IID 43 |
| ~17:30 | Agent updates its anomaly-log memory with the (incorrect) hypothesis "500 errors burn IIDs" |
| ~17:35 | Maintainer reviews the work-item tracker, observes 20 identical tickets, surfaces the finding to the agent: *"This looks like an agent problem"* |
| 2026-05-12, this commit | Incident report authored; SB-GL-25 repurposed as the incident-finding ticket; remediation tickets filed; agent memory corrected |

## Root-cause analysis

### Direct cause

The agent treated `HTTP 500` responses from `POST /projects/.../issues` as deterministic failure ("the create did not happen") and retried. The endpoint is **not idempotent**: each retry created a new issue. A `500` response on a non-idempotent POST indicates *"the server was unable to complete reporting the result to the client"* — not *"the operation did not occur on the server."*

### Contributing factors

1. **Wrong default for non-idempotent POST on 5xx.** General HTTP guidance is to retry idempotent operations (GET, PUT, DELETE) on transient 5xx with exponential backoff. Non-idempotent operations (POST that creates) require *verify-before-retry*. The agent applied the idempotent rule to a non-idempotent endpoint.
2. **Self-confirming anomaly hypothesis.** When the agent eventually received `200` with IID 43, it inferred *"the previous 500s burned IIDs 24–42"* without verifying. The hypothesis fit an earlier, separately-anomalous IID gap (11–19 from a prior session), which made the wrong explanation feel familiar. The agent recorded the wrong cause in its anomalies-log memory without checking the actual state of the work-item tracker.
3. **No deduplication step in the issue-filing flow.** A pre-create search by title (`glab issue list --search <title>`) would have observed the existing issue after the first 500 and prevented further creates. No such step existed in the agent's procedure.
4. **Cap-less retry.** The agent retried on each 500 without a retry cap or escalation path. While GitLab-side rate-limiting may have eventually mitigated, the agent did not surface cumulative retry counts to the operator.

### Why this passed the Opus-4.7 quality bar

The retry behavior was *implicit in agent reasoning* rather than encoded in a written process or tool. There was no in-context guardrail (memory, AGENTS.md, or helper script) instructing the agent to verify-before-retry on non-idempotent endpoints. Opus 4.7 is technically capable of producing the correct reasoning on this question if explicitly prompted; in the absence of a prompt or a prior memory, it defaulted to a wrong heuristic. **This is a process-control gap, not a model-class limitation.** Encoding the correct procedure in a verifiable artifact (helper script + memory + AGENTS.md instruction) prevents recurrence regardless of which model runs next.

## Remediation actions

### Immediate (this incident's authoring commit)

1. **Incident ticket** [SB-GL-25](https://gitlab.com/doolin/springboard/-/work_items/25) — repurposed from the first duplicate, retitled and rescoped to document this incident. Carries SP 800-53 control mapping and a link to this report.
2. **18 duplicate tickets repurposed** (SB-GL-26 through SB-GL-43) — *not* closed-as-duplicate. Each duplicate's title and description is overwritten to reflect a real backlog item from the project's compliance backlog (CVE sub-tickets from SB-GL-3, evidence-archive sub-tickets from SB-GL-5, Solana-mainnet sub-tickets from SB-GL-6, SAST sub-tickets from SB-GL-8, AC-5 Measure #2 gap, and the in-repo remediation tickets for this incident). Each repurposed ticket carries a discussion-thread comment referencing this incident report so the audit trail preserves the duplicate-history-then-rescope path.
3. **Feedback memory** `feedback_verify_before_retry.md` added — the verify-before-retry pattern is now loaded into every Ron-on-springboard session.
4. **Anomalies-log memory corrected** — the prior entry attributing the 25–42 IID gap to "burned IIDs" is replaced with a reference to this incident. The "burned IIDs" hypothesis is explicitly disclaimed.

### In-repo procedural controls (separate work items, tracked in remediation tickets)

1. **`scripts/gitlab-issue-create.sh`** — a search-before-create helper. Behavior:
   - Pre-create: `glab issue list --search "<title>"` with a configurable similarity threshold; abort with a clear message if a likely-duplicate exists.
   - Create: invoke `glab issue create`.
   - On non-2xx response: query for issues created in the last N seconds with matching title *before* retrying; only retry if confirmed missing.
   - Capped retries (default: 2) with surface-to-caller on failure.
   - Becomes the canonical agent path for filing issues on this project.
2. **`AGENTS.md` guardrails** — the verify-before-retry pattern documented in the project's agent-instruction file, so it loads into every agent session running on this codebase regardless of which model.

### Process convention going forward

All agent-driven work-item creation on this project SHALL use the `scripts/gitlab-issue-create.sh` helper (or its functional equivalent — e.g., a properly-coded GraphQL idempotent path if one becomes available). Direct `glab issue create` invocation by an agent, without verify-before-retry semantics, is now flagged behavior. This convention is recorded in `AGENTS.md` and reinforced by the feedback memory.

## Preventive controls in place

| Control | Form | Loaded when |
|---|---|---|
| `feedback_verify_before_retry.md` memory | Agent-context memory | Every Ron-on-springboard session |
| Repurposed-ticket discussion comments | GitLab work-item audit trail | Visible to any reader of the repurposed tickets; recurrence-detection signal |
| `scripts/gitlab-issue-create.sh` (tracked) | Verifiable in-repo artifact | Any agent or operator invoking the script |
| `AGENTS.md` verify-before-retry instruction (tracked) | In-repo project instruction | Every agent session that reads AGENTS.md |
| This incident report | In-repo compliance artifact | Read by any reviewer / assessor / future operator |

## Residual risk

- **Cross-project propagation.** Agents running on other Straylight-family projects do not automatically inherit this guardrail. Each project's `AGENTS.md` should incorporate the same pattern; a Straylight-wide hygiene pass is appropriate but out of scope here.
- **Convention vs. configuration window.** Until the helper script and AGENTS.md guardrails are merged (separate work items, see remediation list), the procedural control is *convention-enforced* — the same convention-vs-configuration distinction this project is managing for AC-5 Measure #2.
- **Agent bypass possible at the instruction layer.** An agent instructed to bypass the helper (e.g., "just call `glab issue create` directly") could still produce duplicates. The control is advisory at the instruction layer, not enforced at the API gateway.

## Control mapping

| Control | Relevance |
|---|---|
| [NIST SP 800-53 Rev. 5 CM-3](https://doi.org/10.6028/NIST.SP.800-53r5) — Configuration Change Control | The work-item tracker is the authorization-record system; 19 duplicate authorization records weakens the integrity of that system. |
| [SP 800-53 CM-3(2)](https://doi.org/10.6028/NIST.SP.800-53r5) — Automated change documentation | Incident affects automated record generation by an agent. |
| [SP 800-53 AU-12](https://doi.org/10.6028/NIST.SP.800-53r5) — Audit Record Generation | 19 duplicate audit events were generated; records are accurate but noisy. |
| [SP 800-53 SI-7](https://doi.org/10.6028/NIST.SP.800-53r5) — Software, Firmware, and Information Integrity | The work-item tracker as evidence artifact must have integrity; this incident degraded it temporarily until repurposing landed. |
| [SP 800-37 Rev. 2](https://csrc.nist.gov/pubs/sp/800/37/r2/final) — RMF Step 7 (Monitor) | This incident report itself is continuous-monitoring evidence; the self-detection, RCA, and remediation cycle is the form an assessor expects to see. |

## References

- Triggering session: Ron compliance work on 2026-05-12 (branches `commit-trace`, `oscal-validate`, `gitignore-widen`, `validate-commit-force-push-fix`)
- GitLab.com platform context: status.gitlab.com (incident timeline external to this report)
- Canonical ticket the duplicates derived from: [SB-GL-24](https://gitlab.com/doolin/springboard/-/work_items/24)
- This incident's authorizing record: [SB-GL-25](https://gitlab.com/doolin/springboard/-/work_items/25)
- Remediation tickets (assigned during the repurposing exercise; see SB-GL-25's discussion for the IID-to-content map)
- Memory entries: `feedback_verify_before_retry.md`, `project_gitlab_anomalies.md` (corrected)

## Sign-off

This incident report serves as the interim AO acknowledgment that the deviation occurred, the analysis was performed, and the remediation is tracked. The report becomes part of the system's continuous-monitoring evidence package per RMF Step 7. Future Authorize-step assessment SHALL include this report in the system's authorization package.

---

*Authored 2026-05-12 by Ron via Claude Opus 4.7 (Claude Code), reviewed by the interim AO (`doolin`). Subject to revision as remediation work items close.*
