import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

import { projects as e2eProjects } from "./packages/e2e/vitest-projects.ts";

const NODE_TESTS = ["packages/internal", "packages/core", "packages/server"];
const BROWSER_TESTS = [
	"packages/internal",
	"packages/core",
	"packages/client",
	"packages/browser",
];

export default defineConfig({
	test: {
		projects: [
			{
				test: {
					name: "node-unit",
					env: { OTEL_EXPORTER_OTLP_ENDPOINT: "" },
					sequence: {
						groupOrder: 0,
					},
					include: NODE_TESTS.map(
						(projectPath) => `${projectPath}/**/*.test.ts`,
					),
				},
			},
			{
				test: {
					name: "browser-unit",
					sequence: {
						groupOrder: 1,
					},
					include: BROWSER_TESTS.map(
						(projectPath) => `${projectPath}/**/*.test.ts`,
					),
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [
							{ browser: "firefox" },
							{ browser: "webkit" },
							{ browser: "chromium" },
						],
						headless: true,
						screenshotFailures: false,
					},
				},
			},
			...e2eProjects,
		],
	},
});
