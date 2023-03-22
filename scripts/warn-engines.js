const semver = require('semver');

if (!semver.satisfies(process.versions.node, '^16 || ^18')) {
	console.warn(
		`WARNING: Unsupported Node.js version v${process.versions.node}. NodeCG may not function as expected!`,
	);
}
