# dave-skills patches (transport branch)

This directory is a temporary mailbox for patches generated in Claude
Code sandboxes that target the `doolin/dave-skills` repo. The sandbox
could push to `javasprang` but not to `dave-skills`, so patches land
here for manual transfer.

To apply a patch on your own machine:

```bash
cd /path/to/dave-skills
git checkout -b claude/<topic>
curl -O https://raw.githubusercontent.com/doolin/javasprang/claude/dave-skills-patches/dave-skills-patches/<patch-filename>
git am <patch-filename>
git push -u origin claude/<topic>
```

Commits in this branch are unsigned — the sandbox's code-signing
helper is scoped to javasprang only. Re-sign on your end if the
target repo requires it.

Delete this branch once the patches have been ported upstream.

## Current patches

- **0001-cicd-golden-pipeline-add-Java-Maven-legacy-EOL-remed.patch**
  Adds Java/Maven adaptation patterns + legacy/EOL framework
  remediation patterns + step-summary surfacing pattern + setup-java
  SHA pin. (Generated mid-session — covers the dep-refresh and
  multi-language learnings.)

## Pending — newer learnings to roll into a follow-up patch

These came up later in the same session and aren't in patch #0001
yet. If you want them folded in, ask Claude to generate a #0002:

- **Caller-permission parse-time rule** (today's bug): nested-job
  permissions in a reusable workflow must fit within the caller's
  allowed set. GitHub validates at workflow PARSE time, not runtime
  — even `if:`-skipped jobs can break startup.
- **`branches:[main]` vs default-branch trap**: when the repo's
  default is `master`, a `pull_request: branches: [main]` filter
  silently makes the PR event never fire; PR runs come from the
  push event with degraded context vars.
- **Sticky PR-summary comment pattern** — collapses Surefire +
  JaCoCo + Trivy + npm-audit + gitleaks + manifest into one
  phone-tappable comment via marocchino/sticky-pull-request-comment.
- **Per-PR GitHub Pages publishing** — peaceiris/actions-gh-pages
  with `pr/<N>/` subtree and `keep_files: true` for parallel-PR-
  safe HTML report hosting.
- **Mobile-viewport e2e** — pair `chromium` desktop project with
  `iPhone 14 Pro` WebKit project in playwright.config; install
  `--with-deps chromium webkit`. Catches mobile regressions in CI.
