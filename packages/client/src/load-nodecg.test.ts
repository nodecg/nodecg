import { defineNamespace } from "@nodecg-next/core";
import { testLayer } from "@nodecg-next/test-utils";
import { Effect, Layer, Schema } from "effect";
import { FetchHttpClient } from "effect/http";
import { afterEach, describe, expect, vi } from "vitest";

import { loadNodeCGEffect } from "./load-nodecg.ts";
import { createTransportStub } from "./services/field-transport/field-transport.stub.ts";
import { FieldTransportService } from "./services/field-transport/field-transport.ts";
import { createMessageChannelStub } from "./services/message-channel/message-channel.stub.ts";
import { MessageChannelService } from "./services/message-channel/message-channel.ts";

const { stub: transport, reset: resetTransport } = createTransportStub();
const { stub: channel, reset: resetChannel } = createMessageChannelStub();
afterEach(() => {
	resetTransport();
	resetChannel();
});

const test = testLayer(
	Layer.mergeAll(
		Layer.succeed(FieldTransportService, transport),
		Layer.succeed(MessageChannelService, channel),
		FetchHttpClient.layer,
	),
);

const show = defineNamespace("show", {
	replicant: { count: { schema: Schema.FiniteFromString } },
});
const stage = defineNamespace("stage", {
	replicant: { count: { schema: Schema.FiniteFromString } },
});

describe("loadNodeCGEffect", () => {
	test(
		"loads each namespace under its key",
		Effect.gen(function* () {
			transport.getReplicant.mockImplementation((namespace) =>
				Effect.succeed(namespace === "show" ? "4" : "9"),
			);

			const { namespaces } = yield* loadNodeCGEffect({
				namespaces: { main: show, side: stage },
			});

			expect(yield* namespaces.main.replicant.count.get()).toBe(4);
			expect(yield* namespaces.side.replicant.count.get()).toBe(9);
		}),
	);

	test(
		"subscribes every namespace through the same channel",
		Effect.gen(function* () {
			const { namespaces } = yield* loadNodeCGEffect({
				namespaces: { main: show, side: stage },
			});

			yield* namespaces.main.replicant.count.subscribe().pipe(Effect.forkChild);
			yield* namespaces.side.replicant.count.subscribe().pipe(Effect.forkChild);
			yield* Effect.promise(() =>
				vi.waitFor(() => {
					expect(channel.send).toHaveBeenCalledWith({
						_tag: "subscribe",
						field: { type: "replicant", namespace: "show", name: "count" },
					});
					expect(channel.send).toHaveBeenCalledWith({
						_tag: "subscribe",
						field: { type: "replicant", namespace: "stage", name: "count" },
					});
				}),
			);
		}),
	);

	test(
		"gives each namespace its own custom routes",
		Effect.gen(function* () {
			const routeManifest = defineNamespace("routes", {
				replicant: { count: { schema: Schema.FiniteFromString } },
				customRoute: { upload: { post: {} } },
			});
			transport.getReplicant.mockReturnValue(Effect.succeed("7"));
			const { namespaces } = yield* loadNodeCGEffect({
				namespaces: { main: show, routes: routeManifest },
			});

			expect(namespaces.routes.customRoute.upload.url).toBe(
				"/namespaces/routes/custom/upload",
			);
			expect(yield* namespaces.routes.replicant.count.get()).toBe(7);
			// @ts-expect-error show declares no routes
			expect(namespaces.main.customRoute.upload).toBeUndefined();
		}),
	);

	test(
		"fails when two keys name the same namespace",
		Effect.gen(function* () {
			const error = yield* loadNodeCGEffect({
				namespaces: { main: show, again: show },
			}).pipe(Effect.flip);

			expect(error.message).toBe('Namespace "show" was loaded twice');
			expect(channel.receive).not.toHaveBeenCalled();
		}),
	);

	test(
		"fails when two namespace names differ only in case",
		Effect.gen(function* () {
			const shout = defineNamespace("Show", {});

			const error = yield* loadNodeCGEffect({
				namespaces: { main: show, loud: shout },
			}).pipe(Effect.flip);

			expect(error.message).toBe(
				'Namespace "Show" differs from "show" only in case',
			);
		}),
	);
});
