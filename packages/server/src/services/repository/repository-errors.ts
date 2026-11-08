import { Formatter, Schema } from "effect";

export class BackendError extends Schema.TaggedError<BackendError>()(
	"BackendError",
	{ cause: Schema.Defect() },
) {
	override readonly message = `Persistence backend failed: ${Formatter.format(this.cause)}`;
}

export class KeyTaken extends Schema.TaggedError<KeyTaken>()("KeyTaken", {}) {
	override readonly message = "The generated key is already in use";
}
