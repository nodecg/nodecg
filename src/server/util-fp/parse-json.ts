import { Effect } from "effect";

export const parseJson = (json: string): Effect.Effect<unknown, Error> =>
	Effect.try({
		try: () => JSON.parse(json) as unknown,
		catch: (error) =>
			error instanceof Error ? error : new Error(String(error)),
	});
