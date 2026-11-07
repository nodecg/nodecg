import * as NodeCrypto from "@effect/platform-node/NodeCrypto";
import * as NodeFileSystem from "@effect/platform-node/NodeFileSystem";
import * as NodePath from "@effect/platform-node/NodePath";
import { it } from "@effect/vitest";
import { type ResolvedPermission, FieldDecodeError } from "@nodecg-next/core";
import { RoleName } from "@nodecg-next/internal";
import { ConfigProvider, Effect, HashMap, Layer, Stream } from "effect";
import {
	FetchHttpClient,
	HttpEffect,
	HttpRouter,
	HttpServer,
} from "effect/http";
import { Reactivity } from "effect/reactivity";
import { describe, expect, vi } from "vitest";

import {
	type AuthProvider,
	AuthProviderRegistry,
} from "../auth/auth-provider.ts";
import {
	AdminTierMiddlewareLive,
	UserAuthenticationMiddlewareLive,
	ServiceAccountAuthenticationMiddlewareLive,
	SuperadminMiddlewareLive,
} from "../auth/middleware.ts";
import { RoleLinks } from "../auth/role-links.ts";
import { type BuiltNamespace } from "../build-fields.ts";
import { ConfiguredSuperadmins } from "../configured-superadmins.ts";
import { RpcHandlerError } from "../field-builders/build-rpc.ts";
import { fieldInternal } from "../field-builders/field-internal-key.ts";
import {
	NamespaceRegistryService,
	type RegisteredNamespace,
} from "../namespace-registry.ts";
import { ReplicantStoreService } from "../replicant-store.ts";
import { DrizzleSqliteDatabaseService } from "../services/database/drizzle-sqlite/drizzle-sqlite-database.ts";
import { AuthenticationRepositoryService } from "../services/repository/authentication/authentication-repository.ts";
import { DrizzleSqliteAuthenticationRepository } from "../services/repository/authentication/drizzle-sqlite-authentication-repository.ts";
import { DrizzleSqliteLoginAttemptRepository } from "../services/repository/login-attempt/drizzle-sqlite-login-attempt-repository.ts";
import { InMemoryReplicantRepository } from "../services/repository/replicant/in-memory-replicant-repository.ts";
import { DrizzleSqliteRoleRepository } from "../services/repository/role/drizzle-sqlite-role-repository.ts";
import { DrizzleSqliteServiceAccountRepository } from "../services/repository/service-account/drizzle-sqlite-service-account-repository.ts";
import { DrizzleSqliteSessionRepository } from "../services/repository/session/drizzle-sqlite-session-repository.ts";
import { DrizzleSqliteUserRepository } from "../services/repository/user/drizzle-sqlite-user-repository.ts";
import { InMemoryTopicBroker } from "../services/topic-broker/in-memory-topic-broker.ts";
import { DrizzleSqliteTransaction } from "../services/transaction/drizzle-sqlite-transaction.ts";
import { RootApiLive } from "./http-api/build-root-api.ts";
import { UrlPath } from "./url-path.ts";

type ReplicantStub = BuiltNamespace["replicant"][string];

const openPermission: ResolvedPermission = {
	read: { roles: new Set(), rolesDenied: new Set() },
	write: { roles: new Set(), rolesDenied: new Set() },
	canRead: () => true,
	canWrite: () => true,
};

type TopicInternal = BuiltNamespace["topic"][string][typeof fieldInternal];
type RpcInternal = BuiltNamespace["rpc"][string][typeof fieldInternal];

function stubTopic(
	publishEncoded: TopicInternal["publishEncoded"],
): BuiltNamespace["topic"][string] {
	const unused = vi.fn();
	return {
		publish: unused,
		subscribe: unused,
		[fieldInternal]: {
			publish: unused,
			subscribe: () => Effect.succeed(Stream.empty),
			subscribeEncoded: () => Effect.succeed(Stream.empty),
			publishEncoded,
			permission: openPermission,
		},
	};
}

function stubRpc(
	callEncoded: RpcInternal["callEncoded"],
): BuiltNamespace["rpc"][string] {
	return {
		call: vi.fn(),
		[fieldInternal]: {
			callEncoded,
			permission: openPermission,
		},
	};
}

function registeredNamespace(
	namespace: string,
	replicant: Record<string, ReplicantStub>,
	computed: BuiltNamespace["computed"] = {},
	topic: BuiltNamespace["topic"] = {},
	rpc: BuiltNamespace["rpc"] = {},
	declaredRoles: ReadonlySet<RoleName> = new Set(),
): RegisteredNamespace {
	return {
		namespace,
		declaredRoles,
		fields: { replicant, computed, topic, rpc },
	};
}

const webHandler = Effect.fn(function* (
	namespaces: ReadonlyArray<RegisteredNamespace>,
	middleware: typeof UserAuthenticationMiddlewareLive = UserAuthenticationMiddlewareLive,
	environment: Layer.Layer<never> = ConfigProvider.layer(
		ConfigProvider.fromEnvRecord({}),
	),
	options?: {
		providers?: HashMap.HashMap<string, AuthProvider>;
		loggedIn?: ReadonlyArray<string>;
	},
) {
	const noRoleLinks = Layer.succeed(RoleLinks, HashMap.empty());
	const repositories = Layer.mergeAll(
		DrizzleSqliteLoginAttemptRepository,
		DrizzleSqliteAuthenticationRepository,
		DrizzleSqliteSessionRepository,
		DrizzleSqliteRoleRepository,
		DrizzleSqliteServiceAccountRepository,
		DrizzleSqliteUserRepository,
		DrizzleSqliteTransaction,
	);
	const loggedIn = Layer.effectDiscard(
		Effect.gen(function* () {
			const authentications = yield* AuthenticationRepositoryService;
			yield* Effect.forEach(options?.loggedIn ?? [], (subject) =>
				authentications.findOrCreateAuthentication(
					{ issuer: "dev", subject },
					subject,
				),
			);
		}),
	);
	const handler = yield* HttpRouter.toHttpEffect(
		RootApiLive.pipe(
			HttpRouter.provideRequest(
				Layer.mergeAll(
					NamespaceRegistryService.layer(namespaces),
					InMemoryTopicBroker,
					UrlPath.layer,
					FetchHttpClient.layer,
					repositories,
					ConfiguredSuperadmins.layer,
					noRoleLinks,
				).pipe(Layer.provideMerge(NodeCrypto.layer)),
			),
			Layer.provide(middleware),
			Layer.provide(ServiceAccountAuthenticationMiddlewareLive),
			Layer.provide(AdminTierMiddlewareLive),
			Layer.provide(SuperadminMiddlewareLive),
			Layer.provide(loggedIn),
			Layer.provide(repositories),
			Layer.provide(ConfiguredSuperadmins.layer),
			Layer.provide(noRoleLinks),
			Layer.provide(InMemoryReplicantRepository),
			Layer.provide(
				ReplicantStoreService.layer.pipe(
					Layer.provide(InMemoryReplicantRepository),
				),
			),
			Layer.provide(
				Layer.succeed(
					AuthProviderRegistry,
					options?.providers ?? HashMap.empty<string, AuthProvider>(),
				),
			),
			Layer.provide(
				Layer.effect(
					DrizzleSqliteDatabaseService,
					DrizzleSqliteDatabaseService.make(":memory:"),
				),
			),
			Layer.provide(
				Layer.mergeAll(
					NodeFileSystem.layer,
					NodePath.layer,
					NodeCrypto.layer,
					Reactivity.layer,
				),
			),
			Layer.provide(environment),
			Layer.provide(HttpServer.layerServices),
		),
	);
	const web = HttpEffect.toWebHandler(handler);
	return (request: Request) => Effect.promise(() => web(request));
});

const json = (res: Response) => Effect.promise(() => res.json());

const topicUrl = "http://x/api/internal/namespaces/root/topic/chat";
const rpcUrl = "http://x/api/internal/namespaces/root/rpc/echo";

const postRequest = (url: string, value: unknown) =>
	new Request(url, {
		method: "POST",
		body: JSON.stringify(value),
		headers: { "content-type": "application/json" },
	});

describe("topic publish", () => {
	it.effect("forwards an allowed value and returns 204", () =>
		Effect.gen(function* () {
			const publishEncoded = vi.fn((_value: unknown) => Effect.void);
			const handler = yield* webHandler([
				registeredNamespace(
					"root",
					{},
					{},
					{ chat: stubTopic(publishEncoded) },
				),
			]);
			const res = yield* handler(postRequest(topicUrl, 5));
			expect(res.status).toBe(204);
			expect(publishEncoded).toHaveBeenCalledWith(5);
		}),
	);

	it.effect("400 when publishEncoded reports FieldDecodeError", () =>
		Effect.gen(function* () {
			const handler = yield* webHandler([
				registeredNamespace(
					"root",
					{},
					{},
					{
						chat: stubTopic(() =>
							Effect.fail(
								new FieldDecodeError({
									fieldName: "chat",
									value: 5,
									cause: new Error("boom"),
								}),
							),
						),
					},
				),
			]);
			expect((yield* handler(postRequest(topicUrl, 5))).status).toBe(400);
		}),
	);
});

describe("rpc call", () => {
	it.effect("returns the encoded handler response", () =>
		Effect.gen(function* () {
			const handler = yield* webHandler([
				registeredNamespace(
					"root",
					{},
					{},
					{},
					{ echo: stubRpc(() => Effect.succeed(84)) },
				),
			]);
			const res = yield* handler(postRequest(rpcUrl, 42));
			expect(res.status).toBe(200);
			expect(yield* json(res)).toBe(84);
		}),
	);

	it.effect("400 when callEncoded reports FieldDecodeError", () =>
		Effect.gen(function* () {
			const handler = yield* webHandler([
				registeredNamespace(
					"root",
					{},
					{},
					{},
					{
						echo: stubRpc(() =>
							Effect.fail(
								new FieldDecodeError({
									fieldName: "echo",
									value: 42,
									cause: new Error("boom"),
								}),
							),
						),
					},
				),
			]);
			expect((yield* handler(postRequest(rpcUrl, 42))).status).toBe(400);
		}),
	);

	it.effect("500 when the handler fails", () =>
		Effect.gen(function* () {
			const handler = yield* webHandler([
				registeredNamespace(
					"root",
					{},
					{},
					{},
					{
						echo: stubRpc(() =>
							Effect.fail(
								new RpcHandlerError({
									namespace: "root",
									name: "echo",
									cause: new Error("boom"),
								}),
							),
						),
					},
				),
			]);
			expect((yield* handler(postRequest(rpcUrl, 42))).status).toBe(500);
		}),
	);
});
