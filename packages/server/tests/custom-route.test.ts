import { testLayer } from "@nodecg-private/test-utils";
import { defineNamespace } from "@nodecg/core";
import { Authentication, Role, RoleName } from "@nodecg/internal";
import { Effect, HashSet, Layer, Logger, Redacted, Schema } from "effect";
import { HttpBody } from "effect/http";
import { describe, expect } from "vitest";

import { buildCustomRoutes } from "../src/build-custom-routes.ts";
import { buildNamespace } from "../src/build-namespace.ts";
import { implementNamespace } from "../src/implement-namespace.ts";
import { NamespaceRegistryService } from "../src/namespace-registry.ts";
import { BackendError } from "../src/services/repository/repository-errors.ts";
import { SessionRepositoryService } from "../src/services/repository/session/session-repository.ts";
import { UserRepositoryService } from "../src/services/repository/user/user-repository.ts";
import {
	buildClient,
	createServiceAccount,
	findUser,
	login,
	loginAdmin,
	services,
} from "./setup.ts";

const manifest = defineNamespace("show", {
	roles: {
		operator: { permission: ["custom-route-request"] },
		viewer: { permission: ["replicant-read"] },
	},
	replicant: {
		count: {
			schema: Schema.Finite,
			permission: { read: { everyone: "allow" } },
		},
	},
	customRoute: {
		caller: { "*": { permission: { write: { everyone: "allow" } } } },
		echo: { "*": { permission: { write: { everyone: "allow" } } } },
		bump: { post: { permission: { write: { everyone: "allow" } } } },
		broken: { get: { permission: { write: { everyone: "allow" } } } },
		backup: { get: {} },
		asset: {
			get: { permission: { write: { everyone: "allow" } } },
			post: {},
		},
	},
});

const namespace = implementNamespace(manifest, {
	seedReplicant: { count: () => 42 },
	implementCustomRoute: {
		caller: { "*": (_, { caller }) => new Response(caller._tag) },
		echo: {
			"*": async (request) =>
				new Response(`${request.method} ${await request.text()}`),
		},
		bump: {
			post: async (_, { replicant }) => {
				await replicant.count.set(replicant.count.get() + 1);
				return new Response(null, { status: 204 });
			},
		},
		broken: {
			get: () => {
				throw new Error("boom");
			},
		},
		backup: {
			get: (_, { replicant }) => new Response(`${replicant.count.get()}`),
		},
		asset: {
			get: () => new Response("file"),
			post: () => new Response("stored"),
		},
	},
});

const namespaces = Layer.effect(
	NamespaceRegistryService,
	Effect.gen(function* () {
		const { fields, handles } = yield* buildNamespace(["show"], namespace, {});
		return yield* NamespaceRegistryService.make([
			{
				namespace: fields.namespace,
				declaredRoles: new Set(),
				customRoute: yield* buildCustomRoutes(namespace, {
					...handles.loaded,
					dataDir: "data",
					namespacePath: ["show"],
				}),
				fields,
			},
		]);
	}),
).pipe(Layer.provide(services));

const test = testLayer(Layer.merge(services, namespaces));

const routeUrl = (name: string) => `http://x/namespaces/show/custom/${name}`;

const operatorRole = Role.make({
	namespace: "show",
	name: RoleName.make("operator"),
});
const viewerRole = Role.make({
	namespace: "show",
	name: RoleName.make("viewer"),
});

const admin = Authentication.make({ issuer: "dev", subject: "admin" });
const operator = Authentication.make({ issuer: "dev", subject: "operator" });
const viewer = Authentication.make({ issuer: "dev", subject: "viewer" });

describe("custom routes", () => {
	test(
		"answers an open route with no credential",
		Effect.gen(function* () {
			const client = yield* buildClient;

			const res = yield* client.get(routeUrl("caller"));
			expect(res.status).toBe(200);
			expect(yield* res.text).toBe("anonymous");
		}),
	);

	test(
		"passes the method and body to the handler",
		Effect.gen(function* () {
			const client = yield* buildClient;

			const res = yield* client.post(routeUrl("echo"), {
				body: HttpBody.text("hello"),
			});
			expect(res.status).toBe(200);
			expect(yield* res.text).toBe("POST hello");
		}),
	);

	test(
		"serves a path below the route",
		Effect.gen(function* () {
			const client = yield* buildClient;

			const res = yield* client.get(`${routeUrl("caller")}/logos/a.png`);
			expect(res.status).toBe(200);
		}),
	);

	test(
		"answers 404 for a route the namespace does not declare",
		Effect.gen(function* () {
			const client = yield* buildClient;

			const res = yield* client.get(routeUrl("missing"));
			expect(res.status).toBe(404);
		}),
	);

	test(
		"answers 404 for a method the route does not declare",
		Effect.gen(function* () {
			const client = yield* buildClient;

			const res = yield* client.post(routeUrl("broken"));
			expect(res.status).toBe(404);
		}),
	);

	test(
		"answers HEAD from a get route",
		Effect.gen(function* () {
			const client = yield* buildClient;

			const res = yield* client.head(routeUrl("asset"));
			expect(res.status).toBe(200);
		}),
	);

	test(
		"applies each method's own permission",
		Effect.gen(function* () {
			const client = yield* buildClient;
			const users = yield* UserRepositoryService;

			const asOperator = yield* login(client, operator);
			const { id } = yield* findUser(operator);
			yield* users.grantRoles(id, HashSet.make(operatorRole));

			const getRes = yield* client.get(routeUrl("asset"));
			expect(yield* getRes.text).toBe("file");

			const anonymousRes = yield* client.post(routeUrl("asset"));
			expect(anonymousRes.status).toBe(404);

			const operatorRes = yield* asOperator.post(routeUrl("asset"));
			expect(yield* operatorRes.text).toBe("stored");
		}),
	);

	test(
		"refuses a user whose role lacks the capability",
		Effect.gen(function* () {
			const client = yield* buildClient;
			const users = yield* UserRepositoryService;

			const asViewer = yield* login(client, viewer);
			const { id } = yield* findUser(viewer);
			yield* users.grantRoles(id, HashSet.make(viewerRole));

			const res = yield* asViewer.get(routeUrl("backup"));
			expect(res.status).toBe(403);
		}),
	);

	test(
		"answers 404 to an anonymous caller without permission",
		Effect.gen(function* () {
			const client = yield* buildClient;

			const res = yield* client.get(routeUrl("backup"));
			expect(res.status).toBe(404);
		}),
	);

	test(
		"lets a user with the role reach the fields",
		Effect.gen(function* () {
			const client = yield* buildClient;
			const users = yield* UserRepositoryService;

			const asOperator = yield* login(client, operator);
			const { id } = yield* findUser(operator);
			yield* users.grantRoles(id, HashSet.make(operatorRole));

			const res = yield* asOperator.get(routeUrl("backup"));
			expect(res.status).toBe(200);
			expect(yield* res.text).toBe("42");
		}),
	);

	test(
		"writes a field the caller could not write",
		Effect.gen(function* () {
			const client = yield* buildClient;

			const bumpRes = yield* client.post(routeUrl("bump"));
			expect(bumpRes.status).toBe(204);

			const readRes = yield* client.get(
				"http://x/api/internal/namespaces/show/replicant/count",
			);
			expect(yield* readRes.json).toBe(43);
		}),
	);

	test(
		"prefers a bearer token over the session cookie",
		Effect.gen(function* () {
			const client = yield* buildClient;

			const asAdmin = yield* loginAdmin(client, admin);
			const { token } = yield* createServiceAccount(asAdmin, "scoreboard");

			const res = yield* asAdmin.get(routeUrl("caller"), {
				headers: { authorization: `Bearer ${Redacted.value(token)}` },
			});
			expect(yield* res.text).toBe("serviceAccount");
		}),
	);

	test(
		"treats an unknown bearer token as anonymous",
		Effect.gen(function* () {
			const client = yield* buildClient;

			const asAdmin = yield* loginAdmin(client, admin);

			const res = yield* asAdmin.get(routeUrl("caller"), {
				headers: { authorization: "Bearer unknown" },
			});
			expect(res.status).toBe(200);
			expect(yield* res.text).toBe("anonymous");
		}),
	);

	test(
		"reads the caller from the session cookie",
		Effect.gen(function* () {
			const client = yield* buildClient;

			const asOperator = yield* login(client, operator);

			const res = yield* asOperator.get(routeUrl("caller"));
			expect(yield* res.text).toBe("user");
		}),
	);

	test(
		"answers 500 when the handler throws",
		Effect.gen(function* () {
			const client = yield* buildClient;

			const res = yield* client.get(routeUrl("broken"));
			expect(res.status).toBe(500);
		}),
	);

	test(
		"logs an error and answers 500 when the caller lookup fails",
		Effect.gen(function* () {
			const sessions = yield* SessionRepositoryService;
			const logs: Array<unknown> = [];
			const logger = Logger.make(({ logLevel, message }) => {
				logs.push({ logLevel, message });
			});
			const client = yield* buildClient.pipe(
				Effect.provideService(SessionRepositoryService, {
					create: sessions.create,
					refreshTTL: sessions.refreshTTL,
					revoke: sessions.revoke,
					resolve: () => BackendError.make({ cause: "down" }),
				}),
				Effect.provide(Logger.layer([logger])),
			);

			const asOperator = yield* login(client, operator);

			const res = yield* asOperator.get(routeUrl("caller"));
			expect(res.status).toBe(500);
			expect(logs).toContainEqual({
				logLevel: "Error",
				message: expect.arrayContaining(["Caller lookup failed"]),
			});
		}),
	);
});
