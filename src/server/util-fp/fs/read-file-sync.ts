import fs from "node:fs";

import * as E from "fp-ts/Either";
import * as IOE from "fp-ts/IOEither";

export const readFileSync = IOE.tryCatchK(
	(path: string) => fs.readFileSync(path, "utf-8"),
	E.toError,
);
