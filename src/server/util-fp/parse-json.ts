import * as E from "fp-ts/Either";

export const parseJson = E.tryCatchK(
	(json: string) => JSON.parse(json) as unknown,
	E.toError,
);
