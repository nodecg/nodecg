import { Either, pipe } from "effect";

import { readFileSync } from "./fs/read-file-sync";
import { parseJson } from "./parse-json";

export const readJsonFileSync = (path: string) =>
	pipe(readFileSync(path), Either.flatMap(parseJson));
