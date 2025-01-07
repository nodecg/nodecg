import fs from "node:fs";
import path from "node:path";

import type express from "express";

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

function recursivelyFindFileInNodeModules(
	currentPath: string,
	rootNodeModulesPath: string,
	filePath: string,
) {
	const nodeModulesPath = path.join(currentPath, "node_modules");
	const fileFullPath = path.join(nodeModulesPath, filePath);
	if (fs.existsSync(fileFullPath)) {
		return fileFullPath;
	}
	if (nodeModulesPath === rootNodeModulesPath) {
		return undefined;
	}
	return recursivelyFindFileInNodeModules(
		path.join(currentPath, ".."),
		rootNodeModulesPath,
		filePath,
	);
}

export function sendNodeModulesFile(
	rootNodeModulesPath: string,
	basePath: string,
	filePath: string,
	res: express.Response,
	next: express.NextFunction,
) {
	const fileFullPath = recursivelyFindFileInNodeModules(
		basePath,
		rootNodeModulesPath,
		filePath,
	);
	if (!fileFullPath) {
		res.sendStatus(404);
		return;
	}
	if (!isChildOf(rootNodeModulesPath, fileFullPath)) {
		res.sendStatus(404);
		return;
	}
	res.sendFile(fileFullPath, (err: NodeJS.ErrnoException) => {
		if (!err) {
			return undefined;
		}
		if (err.code === "ENOENT") {
			return res.type(path.extname(fileFullPath)).sendStatus(404);
		}
		if (!res.headersSent) {
			return next(err);
		}
	});
}
