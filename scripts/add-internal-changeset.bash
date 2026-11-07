set -euo pipefail

version="$(jq -r .version packages/internal/package.json)"
published="$(npm view "@nodecg-next/internal@$version" dist.shasum 2>/dev/null || true)"

pnpm --filter @nodecg-next/internal pack --pack-destination "$RUNNER_TEMP/internal" >/dev/null

local_shasum="$(sha1sum "$RUNNER_TEMP"/internal/*.tgz | cut -d' ' -f1)"

if [ "$local_shasum" != "$published" ]; then
	printf -- '---\n"@nodecg-next/internal": patch\n---\n\nInternal updates\n' > .changeset/internal-auto.md
fi
