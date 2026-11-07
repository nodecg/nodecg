import type { FieldManifest } from "@nodecg-next/core";
import { Effect, type Schema, Stream } from "effect";

import { TopicBrokerService } from "../services/topic-broker/topic-broker.ts";
import { fieldInternal } from "./field-internal-key.ts";
import { requirePermission } from "./permission.ts";

export const buildTopic = Effect.fn("buildTopic")(
	<Decoded>(
		namespace: string,
		name: string,
		manifest: FieldManifest<Decoded>,
	) =>
		Effect.sync(() => {
			const publish = Effect.fn("publish")(function* (value: Decoded) {
				const broker = yield* TopicBrokerService;
				// TODO: topic is only published from server. It doesn't make sense we have publish side permission config
				yield* requirePermission(manifest.permission, namespace, name, "write");
				const encoded = yield* Effect.fromResult(manifest.encode(value));
				yield* broker.publish(namespace, name, encoded);
			});

			const subscribeEncoded = Effect.fn("subscribeEncoded")(function* () {
				const broker = yield* TopicBrokerService;
				const stream = yield* broker.subscribe();
				return stream.pipe(
					Stream.filter(
						(message) =>
							message.namespace === namespace && message.name === name,
					),
					Stream.map((message) => message.value),
				);
			});

			const subscribe = Effect.fn("subscribe")(function* () {
				const stream = yield* subscribeEncoded();
				return stream.pipe(
					Stream.mapEffect((value) =>
						Effect.fromResult(manifest.decode(value)).pipe(Effect.orDie),
					),
				);
			});

			const publishEncoded = Effect.fn("publishEncoded")(function* (
				value: Schema.Json,
			) {
				const broker = yield* TopicBrokerService;
				yield* requirePermission(manifest.permission, namespace, name, "write");
				yield* Effect.fromResult(manifest.decode(value)); // Only for validation
				return yield* broker.publish(namespace, name, value);
			});

			return {
				publish,
				subscribe,
				[fieldInternal]: {
					publish,
					subscribe,
					subscribeEncoded,
					publishEncoded,
					permission: manifest.permission,
				},
			};
		}),
);

export type TopicFieldEffect<Decoded> = Effect.Success<
	ReturnType<typeof buildTopic<Decoded>>
>;
