#!/usr/bin/env bash
# Search-before-create wrapper for `glab issue create`.
#
# Prevents the duplicate-creation pattern documented in
# docs/compliance/incidents/2026-05-12-001-duplicate-work-items.md.
#
# Usage:
#   scripts/gitlab-issue-create.sh \
#     --title "Short title" \
#     --description-file path/to/body.md \
#     [--label "a,b,c"] \
#     [--assignee USER] \
#     [--repo OWNER/REPO]   # default: doolin/springboard
#
# Behavior:
#   1. Pre-create: search for an existing issue with exactly this title.
#      If found, print its URL and exit 0 (idempotent no-op).
#   2. Create via `glab issue create`.
#   3. On non-zero exit from glab: verify whether the issue was created
#      server-side anyway (the failure mode that caused INC-2026-05-12-001).
#      If found, print its URL and exit 0.
#   4. Retry up to MAX_RETRIES (default 2) with exponential backoff,
#      verifying after each attempt. Never retries blindly.
#   5. On exhaustion, exits non-zero with a clear message.
#
# Exit codes:
#   0  — success (created or already exists)
#   1  — failed after retries
#   2  — usage error
#
# Reference: project_gitlab_anomalies.md (memory) and the incident report.

set -euo pipefail

REPO="${REPO:-doolin/springboard}"
MAX_RETRIES="${MAX_RETRIES:-2}"
TITLE=""
DESCRIPTION_FILE=""
LABELS=""
ASSIGNEE=""

usage() {
  cat <<EOF >&2
Usage: $0 --title "..." --description-file FILE [--label "a,b"] [--assignee USER] [--repo OWNER/REPO]

  --title FIELD            Required. Exact title to use; also the dedupe key.
  --description-file FILE  Required. Path to markdown body.
  --label LIST             Optional. Comma-separated label names.
  --assignee USER          Optional. Username to assign.
  --repo OWNER/REPO        Optional. Default: doolin/springboard.

Env overrides:
  REPO         Same as --repo.
  MAX_RETRIES  Default 2. Capped at 5.
EOF
  exit 2
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --title)            TITLE="$2"; shift 2 ;;
    --description-file) DESCRIPTION_FILE="$2"; shift 2 ;;
    --label)            LABELS="$2"; shift 2 ;;
    --assignee)         ASSIGNEE="$2"; shift 2 ;;
    --repo)             REPO="$2"; shift 2 ;;
    -h|--help)          usage ;;
    *) printf 'unknown flag: %s\n' "$1" >&2; usage ;;
  esac
done

[[ -z "$TITLE" ]]            && { echo "error: --title required" >&2; usage; }
[[ -z "$DESCRIPTION_FILE" ]] && { echo "error: --description-file required" >&2; usage; }
[[ -f "$DESCRIPTION_FILE" ]] || { echo "error: description file not found: $DESCRIPTION_FILE" >&2; exit 2; }

# Cap MAX_RETRIES.
if [[ "$MAX_RETRIES" -gt 5 ]]; then
  echo "warn: MAX_RETRIES capped at 5 (was $MAX_RETRIES)" >&2
  MAX_RETRIES=5
fi

# search_by_title: emit the .web_url of an exact-title match (or empty).
# Uses --search (substring/fuzzy) then filters to exact title match via jq.
search_by_title() {
  local title="$1"
  glab issue list \
    --repo "$REPO" \
    --search "$title" \
    --state all \
    --output json 2>/dev/null \
    | jq -r --arg t "$title" '
        if type == "array" then
          [.[] | select(.title == $t)] | sort_by(.iid) | .[0].web_url // empty
        else empty end
      '
}

# Step 1: Pre-create search.
echo "Searching for existing issue with title: $TITLE" >&2
existing=$(search_by_title "$TITLE")
if [[ -n "$existing" ]]; then
  echo "Existing issue found; not creating a duplicate." >&2
  echo "$existing"
  exit 0
fi

# Step 2-4: Create with verify-on-error retry loop.
description=$(cat "$DESCRIPTION_FILE")
label_args=()
[[ -n "$LABELS" ]]   && label_args+=( --label "$LABELS" )
assignee_args=()
[[ -n "$ASSIGNEE" ]] && assignee_args+=( --assignee "$ASSIGNEE" )

attempt=0
while [[ $attempt -le $MAX_RETRIES ]]; do
  printf 'Create attempt %d of %d ...\n' "$((attempt + 1))" "$((MAX_RETRIES + 1))" >&2

  if output=$(
    glab issue create \
      --repo "$REPO" \
      --title "$TITLE" \
      --description "$description" \
      "${label_args[@]}" \
      "${assignee_args[@]}" \
      --yes 2>&1
  ); then
    # Success path: glab prints the URL on the last line.
    url=$(printf '%s\n' "$output" | grep -oE 'https://gitlab\.com/[^[:space:]]+/-/(work_items|issues)/[0-9]+' | tail -1)
    if [[ -n "$url" ]]; then
      echo "$url"
      exit 0
    fi
    # Fall through to verify if we can't parse a URL but glab returned 0.
  fi

  # Non-success from glab. Sleep, then verify server-side state.
  echo "warn: glab create returned non-success — checking whether the issue was created anyway" >&2
  printf '%s\n' "$output" >&2
  sleep 2

  recent=$(search_by_title "$TITLE")
  if [[ -n "$recent" ]]; then
    echo "Issue was created despite the error response — using existing IID." >&2
    echo "$recent"
    exit 0
  fi

  attempt=$((attempt + 1))
  if [[ $attempt -le $MAX_RETRIES ]]; then
    backoff=$(( 2 ** attempt ))
    printf 'Retrying after %ds (verify-before-retry confirmed no server-side creation).\n' "$backoff" >&2
    sleep "$backoff"
  fi
done

echo "error: issue create failed after $((MAX_RETRIES + 1)) attempts; nothing created server-side." >&2
exit 1
