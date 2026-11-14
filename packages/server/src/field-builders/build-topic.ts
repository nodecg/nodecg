import {
	canAccess,
	resolveTopicAccess,
	type TopicFieldManifest,
	type RoleRegistry,
} from "@nodecg/core";
import {
	CurrentIdentity,
	type Identity,
	type NamespacePath,
} from "@nodecg/internal";
import { Effect, Equal, type Schema, Stream } from "effect";

import { TopicBrokerService } from "../services/topic-broker/topic-broker.ts";
import { fieldInternal } from "./field-internal-key.ts";
import { FieldPermissionDenied } from "./permission.ts";

export const buildTopic = Effect.fn("buildTopic")(
	<Decoded>(
		namespace: NamespacePath,
		name: string,
		manifest: TopicFieldManifest<Decoded>,
		registry: RoleRegistry,
		roleNamespace: string,
	) =>
		Effect.sync(() => {
			const access = resolveTopicAccess(registry, manifest.permission);
			const canRead = (identity: Identity) =>
				canAccess(access.read, identity, roleNamespace, registry);
			const canWrite = (identity: Identity) =>
				canAccess(access.write, identity, roleNamespace, registry);
			const publish = Effect.fn("publish")(function* (value: Decoded) {
				const broker = yield* TopicBrokerService;
				const identity = yield* CurrentIdentity;
				if (!canWrite(identity)) {
					return yield* FieldPermissionDenied.make({
						namespace,
						name,
						operation: "write",
					});
				}
				const encoded = yield* Effect.fromResult(manifest.encode(value));
				yield* broker.publish(namespace, name, encoded);
			});

			const subscribeEncoded = Effect.fn("subscribeEncoded")(function* () {
				const broker = yield* TopicBrokerService;
				const stream = yield* broker.subscribe();
				return stream.pipe(
					Stream.filter(
						(message) =>
							Equal.equals(message.namespace, namespace) &&
							message.name === name,
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
				const identity = yield* CurrentIdentity;
				if (!canWrite(identity)) {
					return yield* FieldPermissionDenied.make({
						namespace,
						name,
						operation: "write",
					});
				}
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
					canRead,
				},
			};
		}),
);

export type TopicFieldEffect<Decoded> = Effect.Success<
	ReturnType<typeof buildTopic<Decoded>>
>;
