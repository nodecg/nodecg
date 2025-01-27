import IOE from "fp-ts/IOEither";

export class ParseJsonError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ParseJsonError";
	}
}

export const parseJson = (json: string) =>
	IOE.tryCatch(
		() => JSON.parse(json) as unknown,
		(error) => {
			if (!(error instanceof Error)) {
				return new Error(String(error));
			}
			if (error instanceof SyntaxError) {
				return new ParseJsonError(error.message);
			}
			return error;
		},
	);
