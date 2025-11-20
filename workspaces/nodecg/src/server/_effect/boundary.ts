import { Data } from "effect";

export class UnknownError extends Data.TaggedError("UnknownError") {
	constructor(cause: unknown) {
		super();
		this.cause = cause;
		this.message =
			this.cause instanceof Error
				? this.cause.message
				: "An unknown error occurred";
	}
}
