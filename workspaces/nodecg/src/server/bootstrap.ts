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

import { isLegacyProject, rootPaths } from "@nodecg/internal-util";

if (isLegacyProject) {
	const cwd = process.cwd();
	const runtimeRootPath = rootPaths.runtimeRootPath;
	if (cwd !== runtimeRootPath) {
		console.warn(`[nodecg] process.cwd is ${cwd}, expected ${runtimeRootPath}`);
		process.chdir(runtimeRootPath);
		console.info(`[nodecg] Changed process.cwd to ${runtimeRootPath}`);
	}
}

import { NodeRuntime } from "@effect/platform-node";
import { ConfigError, Effect, Fiber } from "effect";

import { UnknownError } from "./_effect/boundary";
import { expectError } from "./_effect/expect-error";
import { withLogLevelConfig } from "./_effect/log-level";
import { withSpanProcessorLive } from "./_effect/span-logger";
import { exitOnUncaught, sentryEnabled } from "./config";
import { createServer, FileWatcherReadyTimeoutError } from "./server";
import { nodecgPackageJson } from "./util/nodecg-package-json";

// TODO: Remove this in the next major release
const handleFloatingErrors = () =>
	Effect.async<never, UnknownError>((resume) => {
		const uncaughtExceptionHandler = (err: Error) => {
			if (!sentryEnabled) {
				if (exitOnUncaught) {
					cleanup();
					resume(Effect.fail(new UnknownError(err)));
				} else {
					console.error("UNCAUGHT EXCEPTION!");
					console.error(err);
				}
			}
		};
		const unhandledRejectionHandler = (err: unknown) => {
			if (!sentryEnabled) {
				console.error("UNHANDLED PROMISE REJECTION!");
				console.error(err);
			}
		};
		const cleanup = () => {
			process.removeListener("uncaughtException", uncaughtExceptionHandler);
			process.removeListener("unhandledRejection", unhandledRejectionHandler);
		};
		process.addListener("uncaughtException", uncaughtExceptionHandler);
		process.addListener("unhandledRejection", unhandledRejectionHandler);
		return Effect.sync(cleanup);
	});

const main = Effect.fn("main")(function* () {
	process.title = `NodeCG - ${nodecgPackageJson.version}`;

	const handleFloatingErrorsFiber = yield* Effect.fork(handleFloatingErrors());

	const server = yield* createServer();

	yield* Effect.raceFirst(server.run(), Fiber.join(handleFloatingErrorsFiber));
}, Effect.scoped);

NodeRuntime.runMain(
	main().pipe(
		withSpanProcessorLive,
		withLogLevelConfig,
		expectError<
			UnknownError | ConfigError.ConfigError | FileWatcherReadyTimeoutError
		>(),
	),
);
