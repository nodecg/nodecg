import type { ClientMessage, ServerMessage } from "@nodecg-next/internal";
import { Context, type Effect, Schema, type Scope, type Stream } from "effect";

export class MessageEncodeError extends Schema.TaggedError<MessageEncodeError>()(
	"MessageEncodeError",
	{ cause: Schema.instanceOf(Schema.SchemaError) },
) {
	override readonly message = `Could not encode message: ${this.cause.message}`;
}

export const ConnectionStatus = Schema.Literals(["connected", "disconnected"]);
export type ConnectionStatus = typeof ConnectionStatus.Type;

export interface MessageChannel {
	send: (message: ClientMessage) => Effect.Effect<void, MessageEncodeError>;
	receive: () => Effect.Effect<
		Stream.Stream<ServerMessage>,
		never,
		Scope.Scope
	>;
	status: Stream.Stream<ConnectionStatus>;
}

export class MessageChannelService extends Context.Service<
	MessageChannelService,
	MessageChannel
>()("MessageChannel") {}
