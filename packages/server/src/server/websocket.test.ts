import * as NodeCrypto from "@effect/platform-node/NodeCrypto";
import * as NodeFileSystem from "@effect/platform-node/NodeFileSystem";
import * as NodePath from "@effect/platform-node/NodePath";
import { ConfigProvider, HashMap, Layer } from "effect";
import { FetchHttpClient, HttpRouter, HttpServer } from "effect/http";
import { Reactivity } from "effect/reactivity";
import { describe, expect, test } from "vitest";

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
import { ConfiguredSuperadmins } from "../configured-superadmins.ts";
import { NamespaceRegistryService } from "../namespace-registry.ts";
import { ReplicantStoreService } from "../replicant-store.ts";
import { DrizzleSqliteDatabaseService } from "../services/database/drizzle-sqlite/drizzle-sqlite-database.ts";
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
import { websocketRoute } from "./websocket.ts";

const handler = () => {
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
	const { handler } = HttpRouter.toWebHandler(
		Layer.mergeAll(RootApiLive, websocketRoute).pipe(
			HttpRouter.provideRequest(
				Layer.mergeAll(
					NamespaceRegistryService.layer([]),
					InMemoryTopicBroker,
					UrlPath.layer,
					FetchHttpClient.layer,
					repositories,
					ConfiguredSuperadmins.layer,
					noRoleLinks,
				).pipe(Layer.provideMerge(NodeCrypto.layer)),
			),
			Layer.provide(UserAuthenticationMiddlewareLive),
			Layer.provide(ServiceAccountAuthenticationMiddlewareLive),
			Layer.provide(AdminTierMiddlewareLive),
			Layer.provide(SuperadminMiddlewareLive),
			Layer.provide(repositories),
			Layer.provide(NamespaceRegistryService.layer([])),
			Layer.provide(InMemoryReplicantRepository),
			Layer.provide(InMemoryTopicBroker),
			Layer.provide(
				ReplicantStoreService.layer.pipe(
					Layer.provide(InMemoryReplicantRepository),
				),
			),
			Layer.provide(ConfiguredSuperadmins.layer),
			Layer.provide(noRoleLinks),
			Layer.provide(
				Layer.succeed(
					AuthProviderRegistry,
					HashMap.empty<string, AuthProvider>(),
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
			Layer.provide(ConfigProvider.layer(ConfigProvider.fromEnvRecord({}))),
			Layer.provide(HttpServer.layerServices),
		),
	);
	return handler;
};

describe("public streaming surface (/ws/v0)", () => {
	test("401 without a bearer", async () => {
		const res = await handler()(new Request("http://x/ws/v0"));
		expect(res.status).toBe(401);
	});

	test("401 with an unknown bearer", async () => {
		const res = await handler()(
			new Request("http://x/ws/v0", {
				headers: { authorization: "Bearer nope" },
			}),
		);
		expect(res.status).toBe(401);
	});
});

describe("first-party streaming surface (/ws/internal)", () => {
	test("does not 401 an anonymous request when auth is not required", async () => {
		const res = await handler()(new Request("http://x/ws/internal"));
		expect(res.status).not.toBe(401);
	});
});
