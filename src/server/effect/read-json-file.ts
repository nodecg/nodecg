import { FileSystem } from "@effect/platform";
import { Effect, Schema } from "effect";

const parseJsonSchema = Schema.parseJson();
const decodeJson = Schema.decode(parseJsonSchema);

export const readJsonFileSync = (path: string) =>
	Effect.gen(function* () {
		const fs = yield* FileSystem.FileSystem;
		const content = yield* fs.readFileString(path);
		return yield* decodeJson(content);
	});
