/**
 * This file is used to automatically bootstrap a NodeCG Server instance.
 * It exports nothing and offers no controls.
 *
 * At this time, other means of starting NodeCG are not officially supported,
 * but they are used internally by our tests.
 *
 * Tests directly instantiate the NodeCGServer class, so that they may have full control
 * over its lifecycle and when the process exits.
 */

import { rootPath } from "@nodecg/internal-util";

import { isLegacyProject } from "./util/project-type";

if (isLegacyProject) {
	const cwd = process.cwd();
	if (cwd !== rootPath) {
		console.warn(`[nodecg] process.cwd is ${cwd}, expected ${rootPath}`);
		process.chdir(rootPath);
		console.info(`[nodecg] Changed process.cwd to ${rootPath}`);
	}
}

import { exitOnUncaught, sentryEnabled } from "./config";
import { NodeCGServer } from "./server";
import { asyncExitHook } from "./util/exit-hook";
import { gracefulExit } from "./util/exit-hook";
import { nodecgPackageJson } from "./util/nodecg-package-json";

process.title = `NodeCG - ${nodecgPackageJson.version}`;

process.on("uncaughtException", (err) => {
	if (!sentryEnabled) {
		if (exitOnUncaught) {
			console.error("UNCAUGHT EXCEPTION! NodeCG will now exit.");
		} else {
			console.error("UNCAUGHT EXCEPTION!");
		}

		console.error(err);
		if (exitOnUncaught) {
			gracefulExit(1);
		}
	}
});

process.on("unhandledRejection", (err) => {
	if (!sentryEnabled) {
		console.error("UNHANDLED PROMISE REJECTION!");
		console.error(err);
	}
});

const server = new NodeCGServer();
server.on("error", () => {
	gracefulExit(1);
});
server.on("stopped", () => {
	if (!process.exitCode) {
		gracefulExit(0);
	}
});
server.start().catch((error) => {
	console.error(error);
	process.nextTick(() => {
		gracefulExit(1);
	});
});

asyncExitHook(
	async () => {
		await server.stop();
	},
	{
		minimumWait: 100,
	},
);
