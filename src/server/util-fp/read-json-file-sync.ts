import { flow } from "fp-ts/function";
import * as IOE from "fp-ts/IOEither";

import { readFileSync } from "./fs/read-file-sync";
import { parseJson } from "./parse-json";

export const readJsonFileSync = flow(
	readFileSync,
	IOE.flatMap(IOE.fromEitherK(parseJson)),
);
