import * as NodeCrypto from "@effect/platform-node/NodeCrypto";
import * as NodeServices from "@effect/platform-node/NodeServices";
import {
	type Authentication,
	CreateApiKeyResultSchema,
	sessionCookieName,
} from "@nodecg-next/internal";
import { Array, ConfigProvider, Effect, HashMap, Layer, Option } from "effect";
import {
	Etag,
	FetchHttpClient,
	HttpBody,
	HttpClient,
	HttpClientRequest,
	HttpClientResponse,
	HttpEffect,
	HttpPlatform,
	HttpRouter,
} from "effect/http";
import { Reactivity } from "effect/reactivity";
import { assert } from "vitest";

import {
	type AuthProvider,
	AuthProviderRegistry,
} from "../src/auth/auth-provider.ts";
import { RoleLinks } from "../src/auth/role-links.ts";
import { createSession } from "../src/auth/session.ts";
import { NamespaceRegistryService } from "../src/namespace-registry.ts";
import { ReplicantStoreService } from "../src/replicant-store.ts";
import { routes } from "../src/server/routes.ts";
import { DrizzleSqliteDatabaseService } from "../src/services/database/drizzle-sqlite/drizzle-sqlite-database.ts";
import { OperatingSystemService } from "../src/services/operating-system/operating-system.ts";
import { DrizzleSqliteAuthenticationRepository } from "../src/services/repository/authentication/drizzle-sqlite-authentication-repository.ts";
import { DrizzleSqliteLoginAttemptRepository } from "../src/services/repository/login-attempt/drizzle-sqlite-login-attempt-repository.ts";
import { InMemoryReplicantRepository } from "../src/services/repository/replicant/in-memory-replicant-repository.ts";
import { DrizzleSqliteRoleRepository } from "../src/services/repository/role/drizzle-sqlite-role-repository.ts";
import { DrizzleSqliteServiceAccountRepository } from "../src/services/repository/service-account/drizzle-sqlite-service-account-repository.ts";
import { DrizzleSqliteSessionRepository } from "../src/services/repository/session/drizzle-sqlite-session-repository.ts";
import { DrizzleSqliteUserRepository } from "../src/services/repository/user/drizzle-sqlite-user-repository.ts";
import { UserRepositoryService } from "../src/services/repository/user/user-repository.ts";
import { InMemoryTopicBroker } from "../src/services/topic-broker/in-memory-topic-broker.ts";
import { DrizzleSqliteTransaction } from "../src/services/transaction/drizzle-sqlite-transaction.ts";

export const services = Layer.mergeAll(
	ReplicantStoreService.layer.pipe(Layer.provide(InMemoryReplicantRepository)),
	InMemoryTopicBroker,
	// TODO: re-use the production layer bundle by separating DatabaseService
	Layer.mergeAll(
		DrizzleSqliteLoginAttemptRepository,
		DrizzleSqliteAuthenticationRepository,
		DrizzleSqliteSessionRepository,
		DrizzleSqliteRoleRepository,
		DrizzleSqliteServiceAccountRepository,
		DrizzleSqliteUserRepository,
		DrizzleSqliteTransaction,
	).pipe(
		Layer.provide(
			Layer.effect(
				DrizzleSqliteDatabaseService,
				DrizzleSqliteDatabaseService.make(":memory:"),
			),
		),
	),
	HttpPlatform.layer.pipe(Layer.provideMerge(Etag.layerWeak)),
	NamespaceRegistryService.layer([]),
	Layer.succeed(AuthProviderRegistry, HashMap.empty<string, AuthProvider>()),
	Layer.succeed(RoleLinks, HashMap.empty()),
	FetchHttpClient.layer,
).pipe(
	Layer.provideMerge(ConfigProvider.layer(ConfigProvider.fromEnvRecord({}))),
	Layer.provideMerge(
		Layer.mergeAll(
			NodeServices.layer,
			NodeCrypto.layerDigest,
			NodeCrypto.layerSecureRandom,
			OperatingSystemService.layer,
			Reactivity.layer,
		),
	),
);

export const buildClient = Effect.gen(function* () {
	const handler = yield* HttpRouter.toHttpEffect(routes);
	const context = yield* Effect.context<Layer.Success<typeof services>>();
	const web = HttpEffect.toWebHandler(Effect.provide(handler, context));
	const client = yield* HttpClient.HttpClient;
	return client.pipe(
		HttpClient.transformResponse(
			Effect.provideService(FetchHttpClient.Fetch, (input, init) =>
				web(new Request(input, init)),
			),
		),
	);
});

export const login = Effect.fn(function* (
	client: HttpClient.HttpClient,
	authentication: Authentication,
) {
	const token = yield* createSession(authentication, authentication.subject);
	return client.pipe(
		HttpClient.mapRequest(
			HttpClientRequest.setHeader("cookie", `${sessionCookieName}=${token}`),
		),
	);
});

export const findUser = Effect.fn(function* (authentication: Authentication) {
	const users = yield* UserRepositoryService;
	const user = Array.findFirst(yield* users.listAll(), ({ authentications }) =>
		Array.contains(authentications, authentication),
	);
	assert(Option.isSome(user));
	return user.value;
});

export const loginAdmin = Effect.fn(function* (
	client: HttpClient.HttpClient,
	authentication: Authentication,
) {
	const users = yield* UserRepositoryService;
	const asAdmin = yield* login(client, authentication);
	const { id } = yield* findUser(authentication);
	yield* users.grantGlobalRole(id, "admin");
	return asAdmin;
});

export const createServiceAccount = Effect.fn(function* (
	client: HttpClient.HttpClient,
	displayName: string,
) {
	return yield* client
		.post("http://x/api/internal/service-accounts", {
			body: yield* HttpBody.json({ displayName }),
		})
		.pipe(
			Effect.flatMap(
				HttpClientResponse.schemaBodyJson(CreateApiKeyResultSchema),
			),
		);
});
