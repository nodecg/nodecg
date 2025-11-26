import path from "node:path";

import { Effect } from "effect";
import express from "express";

import { authCheck } from "../util/authcheck";
import { sendFile } from "../util/send-file";
import type { BundleManager } from "./bundle-manager";

export const mountsRouter = Effect.fn("mountsRouter")(function* (
	bundleManager: BundleManager,
) {
	const app = express();

	bundleManager.all().forEach((bundle) => {
		bundle.mount.forEach((mount) => {
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
		});
	});

	return app;
});
