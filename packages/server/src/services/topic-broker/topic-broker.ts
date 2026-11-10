import type { NamespacePath } from "@nodecg/internal";
import {
	Context,
	type Effect,
	type Schema,
	type Scope,
	type Stream,
} from "effect";

export interface TopicMessage {
	readonly namespace: NamespacePath;
	readonly name: string;
	readonly value: Schema.Json;
}

export interface TopicBroker {
	publish: (
		namespace: NamespacePath,
		name: string,
		value: Schema.Json,
	) => Effect.Effect<void>;

	subscribe: () => Effect.Effect<
		Stream.Stream<TopicMessage>,
		never,
		Scope.Scope
	>;
}

export class TopicBrokerService extends Context.Service<
	TopicBrokerService,
	TopicBroker
>()("TopicBroker") {}
