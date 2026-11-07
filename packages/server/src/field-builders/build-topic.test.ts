import { defineNamespace } from "@nodecg-next/core";
import {
	AnonymousIdentitySchema,
	CurrentIdentity,
	ServerIdentity,
} from "@nodecg-next/internal";
import { testLayer } from "@nodecg-next/test-utils";
import { Effect, Layer, Schema, Stream } from "effect";
import { afterEach, describe, expect } from "vitest";

import { createBrokerStub } from "../services/topic-broker/topic-broker.stub.ts";
import {
	type TopicMessage,
	TopicBrokerService,
} from "../services/topic-broker/topic-broker.ts";
import { buildTopic } from "./build-topic.ts";
import { fieldInternal } from "./field-internal-key.ts";

const server = ServerIdentity.make({});
const anonymous = Layer.succeed(
	CurrentIdentity,
	AnonymousIdentitySchema.make({}),
);
const identity = Layer.succeed(CurrentIdentity, server);

const { stub: broker, reset } = createBrokerStub();
afterEach(reset);

const test = testLayer(
	Layer.merge(Layer.succeed(TopicBrokerService, broker), identity),
);

const manifest = defineNamespace("ns", {
	topic: {
		open: {
			schema: Schema.FiniteFromString,
			permission: {
				read: { everyone: "allow" },
				write: { everyone: "allow" },
			},
		},
		locked: { schema: Schema.FiniteFromString },
	},
});

describe("publish", () => {
	test(
		"encodes the value and forwards it to the broker",
		Effect.gen(function* () {
			const field = yield* buildTopic("ns", "open", manifest.topic.open);
			yield* field.publish(42);
			expect(broker.publish).toHaveBeenCalledWith("ns", "open", "42");
		}),
	);

	test(
		"fails FieldPermissionDenied for a denied caller without publishing",
		Effect.gen(function* () {
			const field = yield* buildTopic("ns", "locked", manifest.topic.locked);
			const error = yield* field
				.publish(1)
				.pipe(Effect.provide(anonymous), Effect.flip);
			expect(error._tag).toBe("FieldPermissionDenied");
			expect(broker.publish).not.toHaveBeenCalled();
		}),
	);
});

describe("subscribe", () => {
	test(
		"decodes the matching messages",
		Effect.gen(function* () {
			broker.subscribe.mockReturnValue(
				Effect.succeed(
					Stream.fromIterable<TopicMessage>([
						{ namespace: "ns", name: "open", value: "7" },
					]),
				),
			);
			const field = yield* buildTopic("ns", "open", manifest.topic.open);
			const stream = yield* field.subscribe();
			const events = yield* stream.pipe(Stream.runCollect);
			expect(events).toEqual([7]);
		}),
	);

	test(
		"[fieldInternal].subscribeEncoded streams only the matching field's messages",
		Effect.gen(function* () {
			broker.subscribe.mockReturnValue(
				Effect.succeed(
					Stream.fromIterable<TopicMessage>([
						{ namespace: "ns", name: "locked", value: "1" },
						{ namespace: "ns", name: "open", value: "2" },
						{ namespace: "other", name: "open", value: "3" },
					]),
				),
			);
			const field = yield* buildTopic("ns", "open", manifest.topic.open);
			const stream = yield* field[fieldInternal].subscribeEncoded();
			const events = yield* stream.pipe(Stream.runCollect);
			expect(events).toEqual(["2"]);
		}),
	);
});

describe("publishEncoded", () => {
	test(
		"forwards the value for an allowed caller",
		Effect.gen(function* () {
			const field = yield* buildTopic("ns", "open", manifest.topic.open);
			yield* field[fieldInternal]
				.publishEncoded("5")
				.pipe(Effect.provide(anonymous));
			expect(broker.publish).toHaveBeenCalledWith("ns", "open", "5");
		}),
	);

	test(
		"fails FieldPermissionDenied and does not publish for a denied caller",
		Effect.gen(function* () {
			const field = yield* buildTopic("ns", "locked", manifest.topic.locked);
			const error = yield* field[fieldInternal]
				.publishEncoded("5")
				.pipe(Effect.provide(anonymous), Effect.flip);
			expect(error._tag).toBe("FieldPermissionDenied");
			expect(broker.publish).not.toHaveBeenCalled();
		}),
	);

	test(
		"fails when the value fails schema validation",
		Effect.gen(function* () {
			const field = yield* buildTopic("ns", "open", manifest.topic.open);
			const error = yield* field[fieldInternal]
				.publishEncoded(42)
				.pipe(Effect.provide(anonymous), Effect.flip);
			expect(error._tag).toBe("FieldDecodeError");
			expect(broker.publish).not.toHaveBeenCalled();
		}),
	);
});
