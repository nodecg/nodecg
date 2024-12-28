import type express from "express";
import * as path from "path";

import { isChildOf } from "./isChildOf";

export function sendFile(
	directoryToPreventTraversalOutOf: string,
	fileLocation: string,
	res: express.Response,
	next: express.NextFunction,
): void {
	if (isChildOf(directoryToPreventTraversalOutOf, fileLocation)) {
		res.sendFile(fileLocation, (err: NodeJS.ErrnoException) => {
			if (err) {
				if (err.code === "ENOENT") {
					return res.type(path.extname(fileLocation)).sendStatus(404);
				}

				/* istanbul ignore next */
				if (!res.headersSent) {
					next(err);
				}
			}

			return undefined;
		});
	} else {
		res.sendStatus(404);
	}
}
