set -euo pipefail

version="$(jq -r 'first(.publishedPackages[] | select(.name != "@nodecg/internal") | .version) // empty' pnpm-publish-summary.json)"

[ -n "$version" ] || exit 0

gh api "repos/$GITHUB_REPOSITORY/git/refs" -f ref="refs/tags/v$version" -f sha="$GITHUB_SHA"
