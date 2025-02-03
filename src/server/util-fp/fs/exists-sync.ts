import fs from "node:fs";

import * as IO from "fp-ts/IO";

export const existsSync =
	(path: string): IO.IO<boolean> =>
	() =>
		fs.existsSync(path);
