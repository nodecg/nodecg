import fs from "node:fs";
import path from "node:path";

import { vi } from "vitest";

vi.mock("nano-spawn", async (importOriginal) => {
	const { default: actualSpawn } =
		await importOriginal<typeof import("nano-spawn")>();
	return {
		default: async (cmd: string, args?: string[], options?: any) => {
			// Mock git commands
			if (cmd === "git") {
				if (args?.[0] === "ls-remote") {
					return {
						stdout: "ref123\trefs/tags/v2.0.0\nref456\trefs/tags/v1.1.1",
						exitCode: 0,
					};
				}
				if (args?.[0] === "clone") {
					const bundlePath = args[2]!;
					await fs.promises.mkdir(bundlePath, { recursive: true });
					await fs.promises.writeFile(
						path.join(bundlePath, "package.json"),
						JSON.stringify({
							name: path.basename(bundlePath),
							version: "1.1.1",
							nodecg: { compatibleRange: "^2.0.0" },
						}),
					);
				}
				return { exitCode: 0, stdout: "", stderr: "" };
			}

			// Mock npm install
			if (cmd === "npm" && args?.[0] === "install") {
				const cwd = options?.cwd ?? process.cwd();
				const nodeModulesPath = path.join(cwd, "node_modules");
				await fs.promises.mkdir(nodeModulesPath, { recursive: true });
				await fs.promises.mkdir(path.join(nodeModulesPath, "fake-package"), {
					recursive: true,
				});
				return { exitCode: 0, stdout: "", stderr: "" };
			}

			return actualSpawn(cmd, args, options);
		},
	};
});
