import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
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

// Read workspaces by scanning the workspaces directory
// This works with the 'workspaces/*' glob pattern in pnpm-workspace.yaml
const workspacesDir = join(__dirname, "..", "workspaces");
const workspaces = readdirSync(workspacesDir)
	.filter((name) => {
		const path = join(workspacesDir, name);
		return statSync(path).isDirectory();
	})
	.map((name) => `workspaces/${name}`);

const rootPackageJsonPath = join(__dirname, "../package.json");
const rootPackageJson = JSON.parse(
	readFileSync(rootPackageJsonPath, "utf-8"),
) as {
	version: string;
	dependencies: Record<string, string>;
};

rootPackageJson.version = version;

for (const workspace of workspaces) {
	const { name } = JSON.parse(
		readFileSync(join(__dirname, "..", workspace, "package.json"), "utf-8"),
	) as { name: string };
	if (rootPackageJson.dependencies[name]) {
		rootPackageJson.dependencies[name] = version;
	}
}

writeFileSync(
	rootPackageJsonPath,
	JSON.stringify(rootPackageJson, null, 2) + "\n",
);

for (const workspace of workspaces) {
	const packageJsonPath = join(__dirname, "..", workspace, "package.json");
	const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8")) as {
		version: string;
		dependencies?: Record<string, string>;
	};

	packageJson.version = version;

	if (packageJson.dependencies) {
		for (const dependencyWorkspace of workspaces) {
			const { name } = JSON.parse(
				readFileSync(
					join(__dirname, "..", dependencyWorkspace, "package.json"),
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
