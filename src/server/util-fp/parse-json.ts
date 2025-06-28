import { Either } from "effect";

export const parseJson = (json: string) =>
	Either.try({
		try: () => JSON.parse(json) as unknown,
		catch: (error) => {
			if (error instanceof Error) {
				return error;
			}
			return new Error(`Failed to parse JSON: ${String(error)}`);
		},
	});
