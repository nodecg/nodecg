import { cp, readFile } from "node:fs/promises";
import { join } from "node:path";

import spawn from "nano-spawn";
import { expect, inject, test } from "vitest";

import { createTmpDir } from "../helpers/tmp-dir";

for (const packageManager of ["npm", "pnpm"] as const) {
	test(
		`${packageManager}: install and start`,
		{ timeout: 120_000 },
		async () => {
			const dir = await createTmpDir();

			await cp(join(__dirname, "fixture"), dir, { recursive: true });

			const packagePath = inject("packagePath");

			switch (packageManager) {
				case "npm":
					await spawn("npm", ["install", packagePath], { cwd: dir });
					break;
				case "pnpm":
					await spawn("pnpm", ["add", packagePath], { cwd: dir });
					break;
			}
			const packageJson = JSON.parse(
				await readFile(join(dir, "package.json"), "utf-8"),
			);
			expect(packageJson.dependencies).toHaveProperty("nodecg");

			await spawn("npx", ["nodecg", "start"], { cwd: dir, stdio: "inherit" });
		},
	);
}
