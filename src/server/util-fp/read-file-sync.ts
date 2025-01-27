import fs from "node:fs";

import IOE from "fp-ts/IOEither";

export class NotExistError extends Error {
	public readonly path: string;
	constructor(path: string) {
		super(`File or directory does not exist: ${path}`);
		this.name = "NotExistsError";
		this.path = path;
	}
}

export const readFileSync = (path: string) =>
	IOE.tryCatch(
		() => fs.readFileSync(path, "utf-8"),
		(error) => {
			if (!(error instanceof Error)) {
				return new Error(String(error));
			}
			if ("code" in error && error.code === "ENOENT") {
				return new NotExistError(path);
			}
			return error;
		},
	);
