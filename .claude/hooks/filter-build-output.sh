#!/bin/bash
# PreToolUse(Bash): keep dotnet build output out of the context window.
#
# Whatever a build prints stays in context for the rest of the session and is re-read on
# every later turn. This repo has no test suite, so the build log is the only signal — and
# the parts that carry it are the errors and warnings, not the restore chatter.
#
# Passes through untouched when the caller already shaped the output (pipe, redirect,
# explicit --verbosity), so "show me everything" still works.
set -euo pipefail

input=$(cat)
cmd=$(printf '%s' "$input" | jq -r '.tool_input.command // empty')

passthrough() { echo '{}'; exit 0; }

[ -n "$cmd" ] || passthrough
case "$cmd" in
  dotnet\ build*|dotnet\ publish*|dotnet\ test*) ;;
  *) passthrough ;;
esac
case "$cmd" in
  *\|*|*'>'*|*--verbosity*|*\ -v\ *|*--logger*) passthrough ;;
esac

keep='error|warning|[Ff]ailed|FAILED|Assert|Expected:|Actual:|^\s+at .*\.cs:line|Build succeeded|Build FAILED|[0-9]+ Warning|[0-9]+ Error'

wrapped="_o=\$(mktemp); $cmd > \"\$_o\" 2>&1; _rc=\$?; grep -aE '$keep' \"\$_o\" | head -120; \
echo \"--- filtered by .claude/hooks/filter-build-output.sh · \$(wc -l < \"\$_o\") lines total · exit \$_rc ---\"; \
rm -f \"\$_o\"; exit \$_rc"

jq -n --arg c "$wrapped" '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "allow",
    updatedInput: { command: $c }
  }
}'
