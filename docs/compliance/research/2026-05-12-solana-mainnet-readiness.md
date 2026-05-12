# SB-GL-6: Solana Mainnet Migration — Operational Readiness Assessment

**Date:** 2026-05-12
**Scope:** Migrating `attest.mjs` from Solana devnet to mainnet-beta
**Status:** Options analysis — no migration decision made
**Prepared by:** Ron (security/compliance persona, Straylight family) — Sonnet 4.6 research pass
**SOL price note:** Live price fetch was unavailable in this session. Calculations use $165 USD/SOL, consistent with mid-2025 market data. Verify against CoinGecko or Binance before briefing stakeholders.

---

## 1. Key Management

The `attest` job in `.gitlab-ci.yml` reads `$SOLANA_KEYPAIR` (a masked CI/CD variable) and writes it to `/tmp/solana-keypair.json` via `printf` at job start, cleaning it in `after_script`. The keypair is a 64-byte JSON array consumed by `loadKeypair()` in `attest.mjs`. Four options:

### (a) File Keypair — GitLab CI/CD Masked+Protected Variable

**Current posture.** Already implemented for devnet. Transition is a single variable value swap.

**Pros.** Zero infrastructure additions; GitLab masks the value in logs; protected-variable scope limits exposure to protected branches.

**Cons.** Private key material lives in GitLab's variable store in plaintext (encrypted at rest by GitLab's own key, not independently audited by the project). A GitLab account compromise or project-owner insider recovers the key. No hardware boundary.

**Rotation.** Generate replacement keypair offline, fund it, update the CI variable atomically, drain remaining SOL from the old key, archive the old public key with rotation timestamp.

**Compromise.** Remove the variable immediately. Old transactions on-chain are permanent and cannot be forged retroactively. Post-incident: audit all transactions from the compromised pubkey against the pipeline log.

**SC-12 alignment.** Partial. Key custodianship is GitLab's infrastructure. Suitable for Moderate only if GitLab's SOC 2 posture is accepted as inherited assurance.

### (b) Cloud KMS (AWS KMS or GCP Cloud KMS) — Sign-Only

**Pros.** Private key material never leaves the HSM boundary. IAM enforces sign-only privilege. CloudTrail/Cloud Audit Logs provide SC-12-compliant key-use logging. The `attest` job already provisions `AWS_WEB_IDENTITY_TOKEN_FILE` and `GITLAB_OIDC_TOKEN`, making AWS KMS + `AssumeRoleWithWebIdentity` the lowest-friction HSM path.

**Cons.** `attest.mjs` uses `Keypair.fromSecretKey()` — it needs raw key material in memory. KMS exposes a `sign()` primitive, not key export. Wiring KMS requires replacing the `sendAndConfirmTransaction` signing path with a pluggable signer (~30–50 lines; well-precedented in the `@solana/web3.js` v2 ecosystem).

**Rotation.** Asymmetric Ed25519 KMS keys require manual version creation (not auto-rotated). New pubkey must be funded; CI configuration updated to reference the new key version.

**Compromise.** Disable the KMS key immediately via console/API; no key material was ever exportable. Investigate via CloudTrail.

**SC-12 alignment.** Strong. Most credible option for an Authorize-step assessor.

### (c) Hardware Wallet — Ceremonial Signing

Incompatible with unattended CI. Operationally prohibitive at 30–200 commits/month. Relevant only if the project adopts a release-train model with periodic human-signed aggregate attestations. Ruled out for per-commit CI.

### (d) Custodial Provider (Fireblocks, etc.)

Enterprise-grade MPC custody with SOC 2 Type II. Premature for current development phase; cost overhead is not justified. Same custom signer code change as KMS. Appropriate if/when the project transitions to a production authorization boundary.

---

## 2. Transaction Cost

**Mechanism.** `attest.mjs` constructs a `TransactionInstruction` targeting Memo v2 (`MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr`) and calls `sendAndConfirmTransaction`. The memo payload is a JSON object containing `s3_key`, `artifact_checksum`, `commit`, `provenance`, and `timestamp` — approximately 200–250 bytes.

**Per-transaction cost.** Solana memo transactions cost approximately 5,000 lamports (0.000005 SOL) on mainnet. No compute-unit premium beyond the default 200,000 CU allocation.

**SOL price assumption:** $165 USD/SOL (verify before use).

| Scenario | Txns/month | SOL/month | USD/month | USD/year |
|---|---|---|---|---|
| 30 master commits | 30 | 0.00015 | $0.025 | $0.30 |
| 200 master commits | 200 | 0.001 | $0.165 | $1.98 |

**Finding.** Transaction cost is not a material budget consideration at either velocity. The dominant costs are funded account maintenance (minimum rent-exempt balance ~0.001 SOL ≈ $0.17) and key management infrastructure. Annual cost at 200 commits/month is under $2 USD. Even at 10× SOL price appreciation, annual cost stays under $20. Fund the mainnet signing account with 0.01 SOL (~$1.65) to cover several years with headroom.

---

## 3. Availability

**Current fault-tolerance behavior.** The Solana step in `attest.mjs` is wrapped in a try/catch (lines 379–400). On any RPC error, `evidence.solanaError` is set, a `console.warn` is emitted, and execution continues. The pipeline exits 0 regardless. The attestation PDF records "No blockchain anchor recorded."

**Gap.** Commits attested during a Solana RPC outage carry a complete RFC 3161 timestamp (Sigstore TSA) but no on-chain anchor. For an assessor relying on the Solana memo as the non-repudiation anchor cited in `SECURITY.md` AC-5 compensating measure #1, those commits carry reduced assurance. The gap is invisible in the pipeline success status.

**RFC 3161 fallback.** Sigstore TSA is already wired and runs unconditionally in its own try/catch. Both services would need to fail simultaneously for total anchor loss — low-probability but non-zero and undisclosed to the pipeline observer.

**Retry strategy options.**

1. **In-script retry-with-backoff.** Up to 3 retries (2s, 8s, 30s) before declaring Solana unavailable. Addresses transient RPC hiccups without pipeline timeout risk.
2. **GitLab `retry: 1` directive.** Full job retry recovers node-level failures. S3 upload duplication is harmless; Solana memo is idempotent (different txn ID, no harm).
3. **Structured gap flagging.** When `evidence.solanaError` is set, exit with code 2 and emit `attestation-gap.json`. Use `allow_failure: exit_codes: [2]` to mark the job as "warning" rather than "success." This makes anchor gaps observable without blocking the merge — directly addressing the assurance-vs-compliance gap in the project memory.

Option 3 is the most direct fix for the stated assurance gap: silent non-fatal failures are the mechanism by which demonstration-grade controls masquerade as enforcement-grade ones.

---

## 4. Migration Plan

**Environment variables.** In `.gitlab-ci.yml`, the `attest` job sets `SOLANA_NETWORK: ${SOLANA_NETWORK:-devnet}`. In `attest.mjs`, `const network = process.env.SOLANA_NETWORK || "devnet"` is passed to `clusterApiUrl(network)`. Changing `SOLANA_NETWORK` to `mainnet-beta` is the only script-level change required. No `SOLANA_RPC_URL` variable currently exists — the script uses `clusterApiUrl()` selecting the Solana Labs public endpoint. Adding a private RPC provider requires a one-line code change in `submitSolanaMemo`.

**Ordered steps.**

1. **Generate mainnet keypair.** Offline, on a machine isolated from CI: `solana-keygen new --outfile mainnet-attest.json`. Record the public key. This file is never committed to the repository.
2. **Fund the account.** Transfer 0.01 SOL to the new public key on mainnet-beta. Retain the funding transaction signature as an operational record.
3. **Stage the CI variable.** In GitLab project settings, create `SOLANA_KEYPAIR_MAINNET` (masked, protected) with the keypair contents. Do not delete the devnet variable yet.
4. **Staging run.** On a feature branch, change the `SOLANA_KEYPAIR` reference to `SOLANA_KEYPAIR_MAINNET` and `SOLANA_NETWORK` to `mainnet-beta`. Push and verify the pipeline produces `attestation.json` with `solanaNetwork: "mainnet-beta"` and a valid `solanaTxSignature`. Confirm via `https://explorer.solana.com/tx/<sig>` (no `?cluster=` suffix for mainnet — already handled correctly in `generatePdf()` at lines 263–266).
5. **Cut over.** Merge to master. Update the project-level `SOLANA_NETWORK` CI variable to `mainnet-beta`; replace `SOLANA_KEYPAIR` with the mainnet value.
6. **Update SECURITY.md.** Remove the `(devnet; see SB-GL-6)` qualifier from the AC-5 compensating measure description.
7. **Rollback.** Revert `SOLANA_NETWORK` to `devnet` in GitLab CI settings. No code deployment required. Document rollback in the SB-GL-6 work item discussion.

---

## 5. Compliance Lens

**SP 800-53 SI-7 — Software, Firmware, and Information Integrity.** The Solana memo satisfies SI-7 by providing an externally verifiable, append-only record that a specific artifact checksum existed at a specific time. Devnet satisfies the cryptographic mechanism but not the durability requirement: Solana devnet undergoes periodic resets, destroying all historical transaction records. Any commit attested before a reset loses its provable chain of custody. Mainnet has no reset mechanism; records are permanent.

**SP 800-53 SC-12 — Cryptographic Key Establishment and Management.** A production signing keypair requires a documented key management plan covering generation, storage, rotation schedule, and compromise procedures. Option (b) (Cloud KMS) most directly satisfies SC-12 for a Moderate baseline. Option (a) (GitLab variable) is defensible if GitLab's key-at-rest controls are treated as inherited assurance, with explicit documentation of that inheritance in the SSP.

**SP 800-218 (SSDF) PS.2.1 — Release Integrity.** The Solana memo contributes to PS.2.1 by providing an immutable external record binding the artifact checksum to the CI pipeline run. Devnet anchors are not suitable PS.2.1 evidence in an Authorize-step package because the chain of custody can be retroactively voided by a devnet reset. Mainnet anchors are permanent and independently verifiable by any third party with the transaction signature.

**Assessor-grade equivalence.** Devnet and mainnet use identical cryptographic mechanisms. The difference is governance and durability. Devnet is operated by Solana Labs for developer testing, resets periodically, and carries no SLA. Mainnet is an economically-secured ledger with no reset mechanism. The "demonstration vs. evidence" framing in the project memory maps directly to this: for a FIPS 199 Moderate authorization package, the Solana anchor must be mainnet to be cited as operational compensating-control evidence rather than proof-of-concept capability.

---

## Decision Items for the User

1. **Key management tier.** GitLab masked variable (current model, lowest friction) or AWS KMS via the existing OIDC token path (SC-12-stronger, requires `attest.mjs` signer refactor)? This decision gates the SC-12 posture in the SSP.

2. **RPC provider.** Default Solana Labs public endpoint (no SLA, free) or a dedicated provider (Helius/QuickNode/Triton, ~$10–50/month, reduces availability-driven anchor gaps)?

3. **Gap visibility.** Should Solana anchor failures produce a visible pipeline warning (exit code 2 + `allow_failure`) or remain silently non-fatal as today? This directly affects whether the compensating measure claim is demonstration-grade or enforcement-grade.

4. **Devnet retention.** After mainnet cutover, how long will the devnet signing account be kept funded? Devnet history is not preserved across resets, so this is operational hygiene, not record preservation.

5. **SSP update scope.** Does mainnet cutover trigger a formal SSP update cycle, or is a work-item discussion record sufficient under the current interim self-authorization posture?
