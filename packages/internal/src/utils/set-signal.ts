import type { Signal } from "@preact/signals-core";
import { Result, Schema } from "effect";

import { toError } from "./to-error.ts";

// Thrown out of a signal write by a watcher or computed downstream of it, after the value landed
export class SetSignalError extends Schema.TaggedError<SetSignalError>()(
	"SetSignalError",
	{ cause: Schema.Defect() },
) {
	override readonly message = `Setting a signal value failed: ${toError(this.cause).message}`;
}

export const setSignal = <T>(signal: Signal<T>, value: T) =>
	Result.try({
		try: () => {
			signal.value = value;
		},
		catch: (cause) => SetSignalError.make({ cause }),
	});
