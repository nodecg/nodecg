import path from "node:path";

import type express from "express";

import { isChildPath } from "../is-child-path";

export function sendFile(
	directoryToPreventTraversalOutOf: string,
	fileLocation: string,
	res: express.Response,
	next: express.NextFunction,
): void {
	if (isChildPath(directoryToPreventTraversalOutOf, fileLocation)) {
		res.sendFile(fileLocation, (error?: NodeJS.ErrnoException) => {
			console.log(error);
			if (!error) {
				return;
			}

			if (error.code === "ENOENT") {
				return res.type(path.extname(fileLocation)).sendStatus(404);
			}

			if (!res.headersSent) {
				return next(error);
			}
		});
	} else {
		res.sendStatus(404);
	}
}
