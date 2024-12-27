import * as os from "node:os";
import * as path from "node:path";

import * as Sentry from "@sentry/node";
import express from "express";

import type { NodeCG } from "../../types/nodecg";
import type { BundleManager } from "../bundle-manager";
import { config } from "../config";
import { authCheck } from "../util/authcheck";
import { pjson } from "./pjson";

const baseSentryConfig = {
	dsn: config.sentry.enabled ? config.sentry.dsn : "",
	serverName: os.hostname(),
	release: pjson.version,
};

export class SentryConfig {
	readonly bundleMetadata: {
		name: string;
		git: NodeCG.Bundle.GitData;
		version: string;
	}[] = [];
	readonly app = express();

	constructor(bundleManager: BundleManager) {
		const { app, bundleMetadata } = this;

		bundleManager.on("ready", () => {
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
		});

		bundleManager.on("gitChanged", (bundle) => {
			const metadataToUpdate = bundleMetadata.find(
				(data) => data.name === bundle.name,
			);
			if (!metadataToUpdate) {
				return;
			}

			metadataToUpdate.git = bundle.git;
			metadataToUpdate.version = bundle.version;
		});

		// Render a pre-configured Sentry instance for client pages that request it.
		app.get("/sentry.js", authCheck, (_req, res) => {
			res.type(".js");
			res.render(path.join(__dirname, "sentry.js.tmpl"), {
				baseSentryConfig,
				bundleMetadata,
			});
		});
	}
}
