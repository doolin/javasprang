# Phone-based testing roadmap

Context: much of this repo's review and iteration happens from an
iPhone client. Standard desktop-assumed flows (log drill-downs,
artifact downloads, clicking through a running app) don't translate
well to mobile. This doc tracks patterns that close that gap, in
rough order of planned adoption.

## 1. Mobile-viewport Playwright in CI (in progress)

Run the existing Playwright e2e suite against iPhone device
emulation (`devices['iPhone 14 Pro']` etc.) on every PR. Upload
screenshots, videos, and the HTML report as artifacts. Catches
mobile-layout regressions you'd never notice on desktop. Artifacts
are directly viewable via the GitHub mobile app — tap the run,
tap the artifact, tap `download`.

## 2. Per-PR preview deploys

Build the Spring Boot jar in CI, push to a free PaaS (Fly.io /
Render / Railway), give each PR a stable preview URL (e.g.
`pr-2.javasprang.fly.dev`). Click-through testing from mobile
Safari. Teardown on PR close.

Biggest lift of the patterns here but the biggest win — restores
the "eyeballs" capability fully from a phone.

## 3. PR summary comment bot

Single CI step that posts (or updates in place) one comment on
each PR with:

- Test counts (backend + frontend unit + e2e)
- Coverage delta vs. master (JaCoCo line / branch; ng coverage)
- CVE baseline delta (new Trivy findings at gated severity)
- Bundle-size diff (frontend prod build)
- Preview URL (once #2 lands)
- Links to the most useful artifacts (HTML report, surefire, SBOM)

Mobile-friendly: everything on one tappable screen. Lower lift
than #2, high signal-to-noise.

## 4. On-demand checks via this chat

No infra change — just ask Claude in-session to run a specific
check (`./mvnw verify`, `npm audit`, `git log`, `gh pr view`, etc.)
and report back. Already how this session has been working. Fine
for one-off checks; not a substitute for automated coverage.

Limitation: sandbox has no headless Chrome, so Karma / Playwright
aren't reproducible here — desktop-only fallback until sandbox
tooling changes.

## 5. HTML reports as per-PR GitHub Pages

Publish JaCoCo `target/site/jacoco/` and Playwright's
`coverage/playwright/html-report/` to
`https://doolin.github.io/javasprang/pr/<N>/...` via the
`actions/upload-pages-artifact` + `actions/deploy-pages` flow.
Phone-browsable rich reports without the artifact-download step.

---

## Deferred / considered-and-rejected

- **Codespaces for in-browser dev:** works on phone but the touch
  UX for VS Code is poor. Not worth wiring up as a habit.
- **Artifact download links posted to PR comments:** artifacts
  require GitHub login, and the mobile app already deep-links to
  them — the comment bot (#3) is enough.
- **Visual regression SaaS (Percy / Chromatic):** nice-to-have;
  adds external service dependency and cost. Revisit after #1 if
  we want baseline comparison without maintaining image fixtures
  in-repo.
