import * as os from "node:os";
import * as path from "node:path";

import { rootPaths } from "@nodecg/internal-util";
import * as Sentry from "@sentry/node";
import { Effect, Stream } from "effect";
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
	const bundleMetadata: {
		name: string;
		git: NodeCG.Bundle.GitData;
		version: string;
	}[] = [];
	const app = express();

	Sentry.configureScope((scope) => {
		bundleManager.all().forEach((bundle) => {
			bundleMetadata.push({
				name: bundle.name,
				git: bundle.git,
				version: bundle.version,
			});
		});
		scope.setExtra("bundles", bundleMetadata);
	});

	const gitChangedStream = yield* bundleManager
		.subscribe()
		.pipe(Effect.map(Stream.filter((event) => event._tag === "gitChanged")));
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
