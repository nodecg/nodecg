import { defineNamespace } from "@nodecg-next/core";
import {
	AnonymousIdentitySchema,
	CurrentIdentity,
	Role,
	RoleName,
	ServerIdentity,
	ServiceAccount,
	ServiceAccountId,
} from "@nodecg-next/internal";
import { testLayer } from "@nodecg-next/test-utils";
import { Effect, Layer } from "effect";
import { HttpServerRequest } from "effect/http";
import { assert, describe, expect, vi } from "vitest";

import {
	buildCustomRoutes,
	MissingCustomRouteHandler,
} from "./build-custom-routes.ts";
import { buildNamespace } from "./build-namespace.ts";
import { implementNamespace } from "./implement-namespace.ts";
import { ReplicantStoreService } from "./replicant-store.ts";
import { InMemoryReplicantRepository } from "./services/repository/replicant/in-memory-replicant-repository.ts";
import { InMemoryTopicBroker } from "./services/topic-broker/in-memory-topic-broker.ts";

const test = testLayer(
	Layer.mergeAll(
		Layer.succeed(
			HttpServerRequest.HttpServerRequest,
			HttpServerRequest.fromWeb(new Request("http://x/a?b=1")),
		),
		Layer.succeed(CurrentIdentity, ServerIdentity.make({})),
		InMemoryTopicBroker,
		ReplicantStoreService.layer.pipe(
			Layer.provide(InMemoryReplicantRepository),
		),
	),
);

const manifest = defineNamespace("ns", {
	roles: {
		operator: { permission: ["custom-route-request"] },
		viewer: { permission: ["custom-route-request"] },
	},
	customRoute: {
		asset: {
			get: { permission: { write: { everyone: "allow" } } },
			post: { permission: { write: { deny: ["viewer"] } } },
		},
		webhook: { "*": {} },
	},
});

const anonymous = AnonymousIdentitySchema.make({});
const viewer = ServiceAccount.make({
	id: ServiceAccountId.make("00000000-0000-4000-8000-000000000001"),
	displayName: "viewer",
	roles: [Role.make({ namespace: "ns", name: RoleName.make("viewer") })],
	globalRoles: [],
});

const stubHandler = () => new Response();

const buildRoutes = Effect.fn(function* (
	get: () => Response,
	post: () => Response,
) {
	const implemented = implementNamespace(manifest, {
		implementCustomRoute: {
			asset: { get, post },
			webhook: { "*": stubHandler },
		},
	});
	const { handles } = yield* buildNamespace(implemented, {});
	return Array.from(yield* buildCustomRoutes(implemented, handles.loaded));
});

describe("buildCustomRoutes", () => {
	test(
		"builds one route per method",
		Effect.gen(function* () {
			const routes = yield* buildRoutes(stubHandler, stubHandler);

			expect(
				routes.map(({ name, method }) => ({ name, method })),
			).to.have.deep.members([
				{ name: "asset", method: "GET" },
				{ name: "asset", method: "POST" },
				{ name: "webhook", method: "*" },
			]);
		}),
	);

	test(
		"fails when a declared method has no handler",
		Effect.gen(function* () {
			const implemented = implementNamespace(manifest, {
				implementCustomRoute: {
					// @ts-expect-error post is missing
					asset: { get: stubHandler },
					webhook: { "*": stubHandler },
				},
			});
			const { handles } = yield* buildNamespace(implemented, {});

			const error = yield* buildCustomRoutes(implemented, handles.loaded).pipe(
				Effect.flip,
			);

			expect(error).toStrictEqual(
				MissingCustomRouteHandler.make({
					namespace: "ns",
					name: "asset",
					method: "POST",
				}),
			);
			expect(error.message).toBe(
				'Missing handler for custom route "asset" POST in "ns"',
			);
		}),
	);
});

describe("handle", () => {
	test(
		"calls the handler with the request, field accessors and caller",
		Effect.gen(function* () {
			const get = vi.fn(() => new Response("ok", { status: 201 }));
			const routes = yield* buildRoutes(get, stubHandler);
			const route = routes.find(({ method }) => method === "GET");
			assert(typeof route !== "undefined");

			const response = yield* route.handle(anonymous);

			expect(response.status).toBe(201);
			expect(get).toHaveBeenCalledExactlyOnceWith(
				expect.any(Request),
				expect.objectContaining({
					replicant: {},
					caller: anonymous,
				}),
			);
		}),
	);

	test(
		"refuses a denied caller before the handler runs",
		Effect.gen(function* () {
			const post = vi.fn(() => new Response("ok"));
			const routes = yield* buildRoutes(stubHandler, post);
			const route = routes.find(({ method }) => method === "POST");
			assert(typeof route !== "undefined");

			const error = yield* route.handle(viewer).pipe(Effect.flip);

			expect(error._tag).toBe("FieldPermissionDenied");
			expect(post).not.toHaveBeenCalled();
		}),
	);

	test(
		"fails when the handler throws",
		Effect.gen(function* () {
			const routes = yield* buildRoutes(() => {
				throw new Error("boom");
			}, stubHandler);
			const route = routes.find(({ method }) => method === "GET");
			assert(typeof route !== "undefined");

			const error = yield* route.handle(anonymous).pipe(Effect.flip);

			expect(error._tag).toBe("HttpServerError");
		}),
	);
});
