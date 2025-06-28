import fs from "node:fs";

import { Either } from "effect";

export const readFileSync = (path: string) =>
	Either.try({
		try: () => fs.readFileSync(path, "utf-8"),
		catch: (error) => {
			if (error instanceof Error) {
				return error;
			}
			return new Error(`Failed to read file at ${path}: ${String(error)}`);
		},
	});
