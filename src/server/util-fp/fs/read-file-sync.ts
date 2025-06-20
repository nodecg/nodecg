import fs from "node:fs";

import { Effect } from "effect";

export const readFileSync = (path: string): Effect.Effect<string, Error> =>
	Effect.try({
		try: () => fs.readFileSync(path, "utf-8"),
		catch: (error) =>
			error instanceof Error ? error : new Error(String(error)),
	});
