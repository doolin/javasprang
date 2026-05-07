# dave-skills patches (transport branch)

Mailbox for patches generated in Claude Code sandboxes that target
the `doolin/dave-skills` repo. The sandbox could push to javasprang
but not to dave-skills, so patches land here for manual transfer.

## Apply

For each patch you want to land:

```bash
cd /path/to/dave-skills
git checkout master && git pull
git checkout -b claude/<topic>
curl -O https://raw.githubusercontent.com/doolin/javasprang/claude/dave-skills-patches/dave-skills-patches/<filename>
git am <filename>
git push -u origin claude/<topic>
# then open PR on github.com/doolin/dave-skills with the title/body below
```

Commits in the patches are unsigned (sandbox code-signing helper is
javasprang-scoped only). Re-sign on your end if dave-skills requires
it: `git commit --amend -S --no-edit`.

Branch is transport-only — never merge to master. Delete after
patches are upstream.

## Patch index

### 0001 — already in dave-skills master

Java/Maven adaptation, multi-language projects, legacy/EOL framework
remediation (BOM property overrides + scoped `.trivyignore`),
`$GITHUB_STEP_SUMMARY` for mobile reviewers, `actions/setup-java`
SHA pin. **Don't re-apply.** File kept here as a record of what was
in the first transfer.

### 0002 — Pitfalls: parse-time caller permissions + branches: filter trap

**Proposed PR title:** `cicd-golden-pipeline: two new Pitfalls (parse-time permissions, branches filter trap)`

**Proposed PR body:**

> Two related Pitfalls additions, both surfaced while wiring the
> javasprang Golden Pipeline:
>
> 1. **Caller permissions are validated at parse time** — when a
>    reusable workflow's nested job declares permissions exceeding
>    the caller's bounds, the entire run aborts at startup, even
>    when the demanding job is `if:`-skipped on this run. GitHub
>    validates at parse time, not runtime. Common trip wire when
>    adding `pr-summary` / `publish-pages` / attestation jobs to
>    a reusable workflow.
>
> 2. **`branches:` filter and the default-branch name** — a
>    `pull_request: branches: [main]` filter on a repo whose default
>    is `master` (or anything else) makes the `pull_request` event
>    never fire. PR runs still happen via the `push` event for the
>    head branch, but `github.event.pull_request.*` is empty and any
>    `if: github.event_name == 'pull_request'` gate skips silently.
>
> Both anecdotes from the same project; either trips up first-time
> wiring of newer compliance jobs.

**Files touched:** `skills/cicd-golden-pipeline/SKILL.md` (+53 lines, new Pitfalls subsections).

### 0003 — Phone-friendly diagnostics (sticky comment + per-PR Pages + mobile e2e)

**Proposed PR title:** `cicd-golden-pipeline: add "Phone-friendly diagnostics" section`

**Proposed PR body:**

> Three composable patterns that close the "everything's behind a
> desktop log drill-down" gap for reviewers working from a phone.
> Each is independently adoptable; together they make the pipeline's
> output scannable from a mobile GitHub session.
>
> 1. **Sticky PR-summary comment** — `pr-summary` job runs after every
>    other compliance job (`if: always()`), downloads all artifacts,
>    parses them into one phone-readable markdown table, and upserts
>    a sticky comment via `marocchino/sticky-pull-request-comment`
>    with `header: pr-summary`. Single comment per PR, edited in place.
>
> 2. **Per-PR HTML reports on GitHub Pages** — `publish-pr-reports`
>    job runs after `test` + `e2e` on PRs only, stages JaCoCo +
>    frontend-coverage + Playwright HTML under `pr/<N>/` on a
>    `gh-pages` branch via `peaceiris/actions-gh-pages` with
>    `keep_files: true` so parallel PRs coexist. One-time Pages-
>    source toggle required.
>
> 3. **Mobile-viewport e2e** — pair `Desktop Chrome` with
>    `iPhone 14 Pro` (WebKit) projects in `playwright.config`;
>    install both `chromium` and `webkit` browsers. Failure
>    screenshots / video / trace become artifacts and are surfaced
>    via the Pages publish in pattern (2).
>
> The three compose: `pr-summary`'s "Reports:" line links into the
> `gh-pages` site, and the `gh-pages` site renders the mobile e2e
> screenshots — so a red ✗ on a phone-only reviewer's PR becomes one
> tap to a screenshot of the failing iPhone 14 Pro spec.

**Files touched:** `skills/cicd-golden-pipeline/SKILL.md` (+166 lines, new top-level section between Pitfalls and "Adapting for non-Node.js projects").
