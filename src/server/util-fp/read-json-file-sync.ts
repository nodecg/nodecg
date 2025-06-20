import { Effect, pipe } from "effect";

import { readFileSync } from "./fs/read-file-sync";
import { parseJson } from "./parse-json";

export const readJsonFileSync = (path: string): Effect.Effect<unknown, Error> =>
	pipe(readFileSync(path), Effect.flatMap(parseJson));
