import fs from "node:fs";
import path from "node:path";

const packageJson = JSON.parse(
	fs.readFileSync(path.resolve(__dirname, "../package.json"), "utf-8"),
);

packageJson.name = "@nodecg-release-test/types";
packageJson.bin = undefined;

const newExports: Record<string, unknown> = {};

for (const exportsKey of Object.keys(packageJson.exports).filter((key) =>
	key.startsWith("./types"),
)) {
	newExports[exportsKey.replace(/^\.\/types/, ".")] =
		packageJson.exports[exportsKey];
}

packageJson.exports = newExports;

fs.writeFileSync(
	path.resolve(__dirname, "../package.json"),
	JSON.stringify(packageJson, null, 2),
);
