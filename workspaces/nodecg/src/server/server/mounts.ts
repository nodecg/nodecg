import path from "node:path";

import { Effect } from "effect";
import express from "express";

import { authCheck } from "../util/authcheck";
import { sendFile } from "../util/send-file";
import { BundleManager } from "./bundle-manager.js";

export const mountsRouter = Effect.fn("mountsRouter")(function* () {
	const bundleManager = yield* BundleManager;
	const app = express();

	const bundles = yield* bundleManager.all();
	for (const bundle of bundles) {
		for (const mount of bundle.mount) {
			app.get(
				`/bundles/${bundle.name}/${mount.endpoint}/*`,
				authCheck,
				(req, res, next) => {
					const resName = req.params[0]!;
					const parentDir = path.join(bundle.dir, mount.directory);
					const fileLocation = path.join(parentDir, resName);
					sendFile(parentDir, fileLocation, res, next);
				},
			);
		}
	}

	return app;
});
