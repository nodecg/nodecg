set -euo pipefail

version="$(jq -r 'first(.publishedPackages[] | select(.name != "@nodecg-next/internal") | .version) // empty' pnpm-publish-summary.json)"

[ -n "$version" ] || exit 0

tag="v$version"
anchor="${version//./}" # 0.1.2 -> 012
notes="$RUNNER_TEMP/notes.md"
root="$(git rev-parse --show-toplevel)"

pnpm -r ls --json --depth -1 > "$RUNNER_TEMP/workspace.json"

: > "$notes"
for name in $(jq -r '.publishedPackages[] | select(.name != "@nodecg-next/internal") | .name' pnpm-publish-summary.json); do
	path="$(jq -r --arg name "$name" 'first(.[] | select(.name == $name)).path' "$RUNNER_TEMP/workspace.json")"
	dir="${path#"$root"/}"
	echo "- [$name@$version]($GITHUB_SERVER_URL/$GITHUB_REPOSITORY/blob/$tag/$dir/CHANGELOG.md#$anchor)" >> "$notes"
done

gh release view "$tag" >/dev/null 2>&1 && exit 0

prerelease=""
if [[ "$tag" == *-* ]]; then
	prerelease="--prerelease"
fi

gh release create "$tag" --draft --target "$GITHUB_SHA" --title "$tag" --notes-file "$notes" $prerelease
