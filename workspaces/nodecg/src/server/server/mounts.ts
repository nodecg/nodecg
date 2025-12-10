import path from "node:path";

import { Effect } from "effect";
import express from "express";

import type { NodeCG } from "../../types/nodecg.js";
import { authCheck } from "../util/authcheck.js";
import { sendFile } from "../util/send-file/index.js";

export const mountsRouter = Effect.fn("mountsRouter")(function* (
	bundles: NodeCG.Bundle[],
) {
	const app = express();
	bundles.forEach((bundle) => {
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
