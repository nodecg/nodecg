import { defineNamespace } from "@nodecg-next/core";
import { testLayer } from "@nodecg-next/test-utils";
import { ConfigProvider, Effect, Layer, Option, Schema, Tracer } from "effect";
import { expect } from "vitest";

import { implementNamespace } from "../src/implement-namespace.ts";
import { loadNamespaceEffect } from "../src/load-namespace.ts";
import { AuthenticationRepositoryService } from "../src/services/repository/authentication/authentication-repository.ts";
import { LoginAttemptRepositoryService } from "../src/services/repository/login-attempt/login-attempt-repository.ts";
import { InMemoryReplicantRepository } from "../src/services/repository/replicant/in-memory-replicant-repository.ts";
import { RoleRepositoryService } from "../src/services/repository/role/role-repository.ts";
import { ServiceAccountRepositoryService } from "../src/services/repository/service-account/service-account-repository.ts";
import { SessionRepositoryService } from "../src/services/repository/session/session-repository.ts";
import { UserRepositoryService } from "../src/services/repository/user/user-repository.ts";
import { InMemoryTopicBroker } from "../src/services/topic-broker/in-memory-topic-broker.ts";
import { TransactionService } from "../src/services/transaction/transaction.ts";

const test = testLayer(
	Layer.mergeAll(
		InMemoryReplicantRepository,
		InMemoryTopicBroker,
		Layer.mock(AuthenticationRepositoryService)({}),
		Layer.mock(LoginAttemptRepositoryService)({}),
		Layer.mock(RoleRepositoryService)({}),
		Layer.mock(ServiceAccountRepositoryService)({}),
		Layer.mock(SessionRepositoryService)({}),
		Layer.mock(UserRepositoryService)({}),
		Layer.mock(TransactionService)({}),
		ConfigProvider.layer(ConfigProvider.fromEnvRecord({})),
	),
);

const counter = implementNamespace(
	defineNamespace("counter", {
		replicant: { count: { schema: Schema.FiniteFromString } },
		rpc: {
			bump: {
				schema: { request: Schema.Finite, response: Schema.Finite },
				permission: { write: { everyone: "allow" } },
			},
		},
	}),
	{
		seedReplicant: { count: () => 1 },
		implementRpc: {
			bump: async (by, ctx) => {
				await ctx.replicant.count.update((count) => count + by);
				return ctx.replicant.count.get();
			},
		},
		onLoad: () => {},
	},
);

test(
	"nests load steps and keeps every later operation in its own trace",
	Effect.gen(function* () {
		const spans: Array<Tracer.NativeSpan> = [];
		const tracer = Tracer.make({
			span: (options) => {
				const span = new Tracer.NativeSpan(options);
				spans.push(span);
				return span;
			},
		});

		const handle = yield* loadNamespaceEffect(counter).pipe(
			Effect.provideService(Tracer.Tracer, tracer),
		);
		yield* Effect.promise(() => handle.replicant.count.set(5));
		yield* Effect.promise(() => handle.rpc.bump(2));

		const names = new Map(spans.map(({ spanId, name }) => [spanId, name]));
		const parents = Object.fromEntries(
			spans.map(({ name, parent }) => [
				name,
				parent.pipe(
					Option.map(({ spanId }) => names.get(spanId)),
					Option.getOrUndefined,
				),
			]),
		);
		expect(parents).toMatchObject({
			prepareNamespace: undefined,
			buildNamespace: "prepareNamespace",
			buildFields: "buildNamespace",
			buildReplicant: "buildFields",
			onLoad: undefined,
			set: undefined,
			call: undefined,
			update: undefined,
		});
	}),
);
