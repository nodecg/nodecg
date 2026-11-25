set -euo pipefail

name="${1:?}"
dir="$(mktemp -d)"
trap 'rm -rf "$dir"' EXIT

cat > "$dir/package.json" <<EOF
{ "name": "@nodecg/$name", "version": "0.0.0-empty", "publishConfig": { "access": "public" } }
EOF
(cd "$dir" && npm publish --tag latest)

until npm view "@nodecg/$name" version > /dev/null 2>&1; do
	echo "waiting for @nodecg/$name to appear on the registry"
	sleep 10
done

npm trust github "@nodecg/$name" --repo nodecg/nodecg --file publish.yaml --allow-publish
