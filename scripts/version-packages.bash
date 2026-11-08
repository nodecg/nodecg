set -euo pipefail

pnpm run build

version="$(jq -r .version packages/internal/package.json)"
published="$(npm view "@nodecg/internal@$version" dist.shasum 2>/dev/null || true)"

pack_dir="$(mktemp -d)"
pnpm --filter @nodecg/internal pack --pack-destination "$pack_dir" >/dev/null

local_shasum="$(sha1sum "$pack_dir"/*.tgz | cut -d' ' -f1)"

if [ "$local_shasum" != "$published" ]; then
	printf -- '---\n"@nodecg/internal": patch\n---\n\nInternal updates\n' > .changeset/internal-auto.md
fi

pnpm exec changeset version

# Keep prerelease changesets out of the hand-written 3.0.0 changelog
rm -rf .changeset/pre
