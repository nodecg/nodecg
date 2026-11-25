import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

import { Schema } from "effect";

const ignored = ["internal"];
const independent = ["react"];

const PublishSummary = Schema.Struct({
	publishedPackages: Schema.Array(
		Schema.Struct({ name: Schema.String, version: Schema.String }),
	),
});
const decodePublishSummary = Schema.decodeSync(
	Schema.fromJsonString(PublishSummary),
);

const packages = decodePublishSummary(
	readFileSync("pnpm-publish-summary.json", "utf8"),
)
	.publishedPackages.map(({ name, version }) => ({
		name: name.replace(/^@nodecg\//, ""),
		version,
	}))
	.filter(({ name }) => !ignored.includes(name));

const shared = packages.find(({ name }) => !independent.includes(name));
const tags = packages
	.filter(({ name }) => independent.includes(name))
	.map(({ name, version }) => `${name}@${version}`);
if (typeof shared !== "undefined") {
	tags.unshift(`v${shared.version}`);
}

for (const tag of tags) {
	execFileSync(
		"gh",
		[
			"api",
			`repos/${process.env.GITHUB_REPOSITORY}/git/refs`,
			"-f",
			`ref=refs/tags/${tag}`,
			"-f",
			`sha=${process.env.GITHUB_SHA}`,
		],
		{ stdio: "inherit" },
	);
}
