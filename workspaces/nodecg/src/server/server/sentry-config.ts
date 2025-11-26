import * as os from "node:os";
import * as path from "node:path";

import { rootPaths } from "@nodecg/internal-util";
import * as Sentry from "@sentry/node";
import { Effect, Runtime, Stream } from "effect";
import express from "express";

import type { NodeCG } from "../../types/nodecg.js";
import { config } from "../config/index.js";
import { authCheck } from "../util/authcheck.js";
import { nodecgPackageJson } from "../util/nodecg-package-json.js";
import { BundleManager } from "./bundle-manager.js";

const baseSentryConfig = {
	dsn: config.sentry.enabled ? config.sentry.dsn : "",
	serverName: os.hostname(),
	version: nodecgPackageJson.version,
};

export const sentryConfigRouter = Effect.fn("sentryConfigRouter")(function* () {
	const bundleManager = yield* BundleManager;
	const runtime = yield* Effect.runtime();
	const bundleMetadata: {
		name: string;
		git: NodeCG.Bundle.GitData;
		version: string;
	}[] = [];
	const app = express();

	// Wait for "ready" event - populate bundleMetadata when bundles are ready
	yield* Effect.forkScoped(
		bundleManager.waitForReady().pipe(
			Effect.andThen(() =>
				Effect.sync(() => {
					Sentry.configureScope((scope) => {
						const bundles = Runtime.runSync(runtime, bundleManager.all());
						for (const bundle of bundles) {
							bundleMetadata.push({
								name: bundle.name,
								git: bundle.git,
								version: bundle.version,
							});
						}
						scope.setExtra("bundles", bundleMetadata);
					});
				}),
			),
		),
	);

	// Listen to "gitChanged" event - update metadata when git info changes
	const gitChangedStream = yield* bundleManager.listenTo("gitChanged");
	yield* Effect.forkScoped(
		gitChangedStream.pipe(
			Stream.runForEach(({ bundle }) =>
				Effect.sync(() => {
					const metadataToUpdate = bundleMetadata.find(
						(data) => data.name === bundle.name,
					);
					if (!metadataToUpdate) {
						return;
					}

					metadataToUpdate.git = bundle.git;
					metadataToUpdate.version = bundle.version;
				}),
			),
		),
	);

	// Render a pre-configured Sentry instance for client pages that request it.
	app.get("/sentry.js", authCheck, (_req, res) => {
		res.type(".js");
		res.render(
			path.join(
				rootPaths.nodecgInstalledPath,
				"dist/server/templates/sentry.js.tmpl",
			),
			{
				baseSentryConfig,
				bundleMetadata,
			},
		);
	});

	return app;
});
