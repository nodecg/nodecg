import { playwright } from "@vitest/browser-playwright";
import getPort from "get-port";
import { defineProject } from "vitest/config";

import { navigate, restartServer } from "./src/server/browser-commands.ts";
import type { Backend } from "./src/server/global-setup.ts";
import { scanSuites } from "./tests/suites.ts";

const BROWSERS = ["chromium", "firefox", "webkit"] as const;

const suites = await scanSuites();

export const projects = await Promise.all(
	BROWSERS.map(async (browser, index) => {
		const vitePort = await getPort();
		const backends: Backend[] = await Promise.all(
			suites.map(async (suite) => ({
				name: suite.name,
				serverEntry: suite.serverEntry,
				port: await getPort(),
				superadmins: suite.config.superadmins.join(","),
				baseUrl: `http://localhost:${vitePort}/s/${suite.name}`,
				otlpEndpoint: suite.config.collector
					? `http://localhost:${await getPort()}`
					: "",
			})),
		);
		const proxy = Object.fromEntries(
			backends.map((backend) => [
				`/s/${backend.name}`,
				{ target: `http://localhost:${backend.port}`, ws: true },
			]),
		);
		return defineProject({
			root: import.meta.dirname,
			server: { port: vitePort, strictPort: true, proxy },
			test: {
				name: `e2e-${browser}`,
				sequence: { groupOrder: index + 2 }, // 0 and 1 are unit tests
				include: ["tests/**/*.test.ts"],
				env: { E2E_BACKENDS: JSON.stringify(backends) },
				api: { port: vitePort, strictPort: true },
				browser: {
					enabled: true,
					provider: playwright(),
					headless: true,
					instances: [{ browser, globalSetup: "./src/server/global-setup.ts" }],
					screenshotFailures: false,
					commands: { navigate, restartServer },
				},
			},
		});
	}),
);
