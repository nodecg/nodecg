import type { ServerMessage } from "@nodecg-next/internal";
import { Context, Duration, Effect, Schema } from "effect";

export class ConnectionIdle extends Schema.TaggedError<ConnectionIdle>()(
	"ConnectionIdle",
	{ timeout: Schema.Duration },
) {
	override readonly message = `The connection did not respond for ${Duration.format(this.timeout)}`;
}

export interface SilenceDetector {
	onMessage: (message: ServerMessage) => Effect.Effect<void>;
	silence: Effect.Effect<never, ConnectionIdle>;
}

export const SilenceDetectorService = Context.Reference<SilenceDetector>(
	"SilenceDetector",
	{
		defaultValue: () => ({
			onMessage: () => Effect.void,
			silence: Effect.never,
		}),
	},
);
