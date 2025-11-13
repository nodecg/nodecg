import fs from "node:fs";
import path from "node:path";

import type express from "express";

import { isChildPath } from "../is-child-path";
import { sendFile } from "../send-file";

export function recursivelyFindFileInNodeModules(
	startDir: string,
	limitDir: string,
	targetFilePath: string,
) {
	const fileFullPath = path.join(startDir, "node_modules", targetFilePath);
	if (isChildPath(limitDir, fileFullPath) && fs.existsSync(fileFullPath)) {
		return fileFullPath;
	}
	const parentDir = path.dirname(startDir);
	if (
		parentDir === startDir ||
		(limitDir !== parentDir && !isChildPath(limitDir, parentDir))
	) {
		return undefined;
	}
	return recursivelyFindFileInNodeModules(parentDir, limitDir, targetFilePath);
}

export function sendNodeModulesFile(
	startDir: string,
	limitDir: string,
	filePath: string,
	res: express.Response,
	next: express.NextFunction,
) {
	const foundPath = recursivelyFindFileInNodeModules(
		startDir,
		limitDir,
		filePath,
	);
	if (!foundPath) {
		res.sendStatus(404);
		return;
	}
	sendFile(limitDir, foundPath, res, next);
}
