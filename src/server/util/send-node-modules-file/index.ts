import fs from "node:fs";
import path from "node:path";

import type express from "express";

import { isChildPath } from "../is-child-path";
import { sendFile } from "../send-file";

export function recursivelyFindFileInNodeModules(
	currentPath: string,
	rootNodeModulesPath: string,
	filePath: string,
) {
	const nodeModulesPath = path.join(currentPath, "node_modules");
	const fileFullPath = path.join(nodeModulesPath, filePath);
	if (!isChildPath(rootNodeModulesPath, fileFullPath)) {
		return undefined;
	}
	if (fs.existsSync(fileFullPath)) {
		return fileFullPath;
	}
	return recursivelyFindFileInNodeModules(
		path.join(currentPath, "../.."),
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
	sendFile(rootNodeModulesPath, fileFullPath, res, next);
}
