import { PingMessage } from "@nodecg-next/internal";
import {
	Duration,
	Effect,
	Layer,
	Match,
	Queue,
	Schedule,
	Schema,
} from "effect";
import { Socket } from "effect/socket";

import { ConnectionIdle, SilenceDetectorService } from "./silence-detector.ts";

const encodePingMessage = Schema.encodeEffect(
	Schema.fromJsonString(PingMessage),
);

export const pingSilenceDetector = ({
	interval,
	pongTimeout,
}: {
	readonly interval: Duration.Duration;
	readonly pongTimeout: Duration.Duration;
}) =>
	Layer.effect(
		SilenceDetectorService,
		Effect.gen(function* () {
			const socket = yield* Socket.Socket;
			const pongs = yield* Queue.sliding<void>(1);
			const timeout = Duration.sum(interval, pongTimeout);

			yield* Effect.forkScoped(
				Effect.gen(function* () {
					const ping = yield* encodePingMessage(PingMessage.make({}));
					const { write } = yield* socket.writer;

					return yield* Effect.suspend(() => write(ping)).pipe(
						Effect.catchTag("SocketError", () => Effect.void),
						Effect.schedule(Schedule.spaced(interval)),
					);
				}).pipe(
					// Impossible
					Effect.catchTag("SchemaError", (error) =>
						Effect.logError("Failed to encode the ping message:", error),
					),
				),
			);

			return {
				onMessage: (message) =>
					Match.value(message).pipe(
						Match.tag("pong", () =>
							Queue.offer(pongs, undefined).pipe(Effect.asVoid),
						),
						Match.orElse(() => Effect.void),
					),
				silence: Queue.take(pongs).pipe(
					Effect.timeoutOrElse({
						duration: timeout,
						orElse: () => Effect.fail(ConnectionIdle.make({ timeout })),
					}),
					Effect.forever,
				),
			};
		}),
	);
