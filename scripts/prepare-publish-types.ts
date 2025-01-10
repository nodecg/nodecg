import fs from "node:fs";
import path from "node:path";

const packageJson = JSON.parse(
	fs.readFileSync(path.resolve(__dirname, "../package.json"), "utf-8"),
);

packageJson.name = "@nodecg/types";
packageJson.bin = undefined;

const newExports: Record<string, unknown> = {};

for (const exportsKey in packageJson.exports) {
	newExports[exportsKey.replace(/^\.\/types/, ".")] =
		packageJson.exports[exportsKey];
}

packageJson.exports = newExports;

fs.writeFileSync(
	path.resolve(__dirname, "../package.json"),
	JSON.stringify(packageJson, null, 2),
);
