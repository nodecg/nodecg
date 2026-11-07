export const toError = (error: unknown): Error =>
	error instanceof Error ? error : new Error("Unknown error", { cause: error });
