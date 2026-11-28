set -euo pipefail

pnpm run build

version="$(jq -r .version packages/internal/package.json)"

published_dir="$(mktemp -d)"
npm pack "@nodecg/internal@$version" --pack-destination "$published_dir" >/dev/null

pack_dir="$(mktemp -d)"
pnpm --filter @nodecg/internal pack --pack-destination "$pack_dir" >/dev/null

if ! zcmp -s "$published_dir"/*.tgz "$pack_dir"/*.tgz; then
	printf -- '---\n"@nodecg/internal": patch\n---\n\nInternal updates\n' > .changeset/internal-auto.md
fi

pnpm exec changeset version

# Keep prerelease changesets out of the hand-written 3.0.0 changelog
rm -rf .changeset/pre
