#!/usr/bin/env bash
#
# Idempotent label bootstrap for the javasprang repo.
#
# Reads docs/labels.yml (canonical source) and creates / updates labels
# in the GitHub repo via the gh CLI. Safe to re-run; existing labels
# get their description and color synced to the YAML.
#
# Usage:
#   scripts/bootstrap-labels.sh                # apply to current repo
#   scripts/bootstrap-labels.sh --dry-run      # show what would change
#   scripts/bootstrap-labels.sh --prune        # also delete labels NOT
#                                              # in the YAML (use with care)
#
# Prerequisites:
#   - gh CLI authenticated (`gh auth status`)
#   - python3 (for YAML parsing)
#   - jq

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LABELS_FILE="$REPO_ROOT/docs/labels.yml"

DRY_RUN=0
PRUNE=0
for arg in "$@"; do
    case "$arg" in
        --dry-run) DRY_RUN=1 ;;
        --prune)   PRUNE=1 ;;
        -h|--help)
            sed -n '3,18p' "$0" | sed 's|^# \{0,1\}||'
            exit 0
            ;;
        *)
            echo "unknown arg: $arg" >&2
            exit 2
            ;;
    esac
done

for tool in gh python3 jq; do
    if ! command -v "$tool" >/dev/null 2>&1; then
        echo "missing required tool: $tool" >&2
        exit 1
    fi
done

if [ ! -f "$LABELS_FILE" ]; then
    echo "labels file not found: $LABELS_FILE" >&2
    exit 1
fi

# Parse YAML -> JSON Lines so the bash loop can read one label at a time.
labels_json="$(python3 - "$LABELS_FILE" <<'PY'
import json, sys, yaml
data = yaml.safe_load(open(sys.argv[1]))
for label in data.get("labels", []):
    print(json.dumps(label))
PY
)"

run() {
    if [ "$DRY_RUN" -eq 1 ]; then
        printf '[dry-run] %s\n' "$*"
    else
        "$@"
    fi
}

# Fetch existing labels once for diffing.
existing_json="$(gh label list --json name,description,color --limit 200)"

declare -A wanted
created=0
updated=0
unchanged=0

while IFS= read -r line; do
    [ -z "$line" ] && continue
    name=$(echo "$line"        | jq -r .name)
    description=$(echo "$line" | jq -r .description)
    color=$(echo "$line"       | jq -r .color)
    wanted["$name"]=1

    current=$(echo "$existing_json" | jq -c --arg n "$name" '.[] | select(.name==$n)')
    if [ -z "$current" ]; then
        echo "+ create: $name"
        run gh label create "$name" --description "$description" --color "$color"
        created=$((created + 1))
    else
        cur_desc=$(echo "$current" | jq -r .description)
        cur_color=$(echo "$current" | jq -r .color)
        if [ "$cur_desc" = "$description" ] && [ "$cur_color" = "$color" ]; then
            unchanged=$((unchanged + 1))
        else
            echo "~ update: $name (desc=\"$cur_desc\"->\"$description\" color=$cur_color->$color)"
            run gh label edit "$name" --description "$description" --color "$color"
            updated=$((updated + 1))
        fi
    fi
done <<<"$labels_json"

pruned=0
if [ "$PRUNE" -eq 1 ]; then
    while IFS= read -r existing_name; do
        [ -z "$existing_name" ] && continue
        if [ -z "${wanted[$existing_name]:-}" ]; then
            echo "- delete: $existing_name"
            run gh label delete "$existing_name" --yes
            pruned=$((pruned + 1))
        fi
    done < <(echo "$existing_json" | jq -r '.[].name')
fi

echo
echo "Summary: $created created, $updated updated, $unchanged unchanged, $pruned pruned"
[ "$DRY_RUN" -eq 1 ] && echo "(dry-run — no changes were made)"
