import { ClientMessage, ServerMessage } from "@nodecg/internal";
import {
	Duration,
	Effect,
	Fiber,
	Layer,
	Match,
	Predicate,
	PubSub,
	Schedule,
	Schema,
	Stream,
	SubscriptionRef,
} from "effect";
import { Socket } from "effect/socket";

import { SilenceDetectorService } from "../silence-detector/silence-detector.ts";
import {
	type ConnectionStatus,
	MessageChannelService,
	MessageEncodeError,
} from "./message-channel.ts";

const encodeClientMessage = Schema.encodeEffect(
	Schema.fromJsonString(ClientMessage),
);
const decodeServerMessage = Schema.decodeEffect(
	Schema.fromJsonString(ServerMessage),
);
const isSocketOpenError = Schema.is(Socket.SocketOpenError);

export const SocketMessageChannel = Layer.effect(
	MessageChannelService,
	Effect.gen(function* () {
		const socket = yield* Socket.Socket;
		const silenceDetector = yield* SilenceDetectorService;
		const { write } = yield* socket.writer;
		const pubsub = yield* Effect.acquireRelease(
			PubSub.unbounded<ServerMessage>(),
			PubSub.shutdown,
		);
		const status =
			yield* SubscriptionRef.make<ConnectionStatus>("disconnected");

		const handleData = Effect.fn(
			function* (data: string | Uint8Array) {
				if (Predicate.isUint8Array(data)) {
					yield* Effect.logWarning("Received a message in Uint8Array");
					return;
				}
				const message = yield* decodeServerMessage(data);
				yield* silenceDetector.onMessage(message);
				yield* PubSub.publish(pubsub, message);
			},
			Effect.catchTag("SchemaError", (error) =>
				Effect.logError("Failed to decode incoming message:", error),
			),
		);

		const startConnection = Effect.gen(function* () {
			const { pull } = yield* socket.reader.pipe(
				Effect.tapError((error) =>
					Effect.logWarning("Message channel could not connect:", error),
				),
			);
			yield* SubscriptionRef.set(status, "connected");
			yield* Effect.addFinalizer(() =>
				SubscriptionRef.set(status, "disconnected"),
			);
			return yield* pull.pipe(
				Effect.flatMap(
					Effect.forEach((data) => handleData(data), { discard: true }),
				),
				Effect.forever,
				Effect.raceFirst(silenceDetector.silence),
			);
		});

		const reconnectLoop = yield* Effect.forkScoped(
			startConnection.pipe(
				Effect.scoped,
				Effect.retry({
					schedule: Schedule.min([
						Schedule.exponential(Duration.millis(100)),
						Schedule.spaced(Duration.seconds(10)),
					]).pipe(Schedule.jittered),
					while: (error) =>
						Match.value(error).pipe(
							Match.tag("SocketError", ({ reason }) =>
								isSocketOpenError(reason),
							),
							Match.tag("ConnectionIdle", () => false),
							Match.exhaustive,
						),
				}),
				Effect.catchTags({
					SocketError: (error) =>
						Effect.logWarning("Message channel closed, reconnecting:", error),
					ConnectionIdle: (error) =>
						Effect.logWarning(
							"Message channel went silent, reconnecting:",
							error,
						),
				}),
				Effect.repeat(
					Schedule.spaced(Duration.seconds(1)).pipe(Schedule.jittered),
				),
				Effect.satisfiesErrorType<never>(),
			),
		);

		return {
			send: Effect.fn("WebsocketMessageChannel.send")(function* (
				message: ClientMessage,
			) {
				const data = yield* encodeClientMessage(message).pipe(
					Effect.mapError((error) =>
						Match.value(error).pipe(
							Match.tag("SchemaError", (error) =>
								MessageEncodeError.make({ cause: error }),
							),
							Match.exhaustive,
						),
					),
				);

				yield* write(data).pipe(
					Effect.catchTag("SocketError", (error) =>
						Effect.logWarning(
							"Message channel could not send a message:",
							error,
						),
					),
					Effect.satisfiesErrorType<never>(),
				);
			}),
			receive: Effect.fn("WebsocketMessageChannel.receive")(function* () {
				const subscription = yield* PubSub.subscribe(pubsub);
				return Stream.fromSubscription(subscription).pipe(
					Stream.interruptWhen(Fiber.await(reconnectLoop)),
				);
			}),
			status: SubscriptionRef.changes(status).pipe(
				Stream.interruptWhen(Fiber.await(reconnectLoop)),
			),
		};
	}),
);
