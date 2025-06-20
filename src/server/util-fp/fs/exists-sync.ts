import fs from "node:fs";

import { Effect } from "effect";

export const existsSync = (path: string): Effect.Effect<boolean> =>
	Effect.sync(() => fs.existsSync(path));
