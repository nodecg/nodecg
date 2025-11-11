import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";

const {
	values: { version },
} = parseArgs({
	options: {
		version: { type: "string" },
	},
});

if (!version) {
	throw new Error("Missing required argument: --version");
}

const rootPackageJsonPath = join(import.meta.dirname, "../package.json");
const rootPackageJson = JSON.parse(
	readFileSync(rootPackageJsonPath, "utf-8"),
) as {
	version: string;
	dependencies?: Record<string, string>;
	workspaces: string[];
};

rootPackageJson.version = version;

for (const workspace of rootPackageJson.workspaces) {
	const { name } = JSON.parse(
		readFileSync(
			join(import.meta.dirname, "..", workspace, "package.json"),
			"utf-8",
		),
	) as { name: string };
	if (rootPackageJson.dependencies?.[name]) {
		rootPackageJson.dependencies[name] = version;
	}
}

writeFileSync(
	rootPackageJsonPath,
	JSON.stringify(rootPackageJson, null, 2) + "\n",
);

for (const workspace of rootPackageJson.workspaces) {
	const packageJsonPath = join(
		import.meta.dirname,
		"..",
		workspace,
		"package.json",
	);
	const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8")) as {
		version: string;
		dependencies?: Record<string, string>;
	};

	packageJson.version = version;

	if (packageJson.dependencies) {
		for (const dependencyWorkspace of rootPackageJson.workspaces) {
			const { name } = JSON.parse(
				readFileSync(
					join(import.meta.dirname, "..", dependencyWorkspace, "package.json"),
					"utf-8",
				),
			) as {
				name: string;
			};
			if (packageJson.dependencies[name]) {
				packageJson.dependencies[name] = version;
			}
		}
	}

	writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n");
}
