import { Authentication, Role, RoleName } from "@nodecg-next/internal";
import { testLayer } from "@nodecg-next/test-utils";
import { Effect, HashSet, Layer } from "effect";
import { describe, expect } from "vitest";

import { NamespaceRegistryService } from "../src/namespace-registry.ts";
import { UserRepositoryService } from "../src/services/repository/user/user-repository.ts";
import { buildClient, findUser, login, loginAdmin, services } from "./setup.ts";

const producer = Role.make({
	namespace: "show",
	name: RoleName.make("producer"),
});

const namespaces = NamespaceRegistryService.layer([
	{
		namespace: "show",
		declaredRoles: new Set([producer.name, RoleName.make("viewer")]),
		fields: { replicant: {}, computed: {}, topic: {}, rpc: {} },
	},
	{
		namespace: "other",
		declaredRoles: new Set([producer.name]),
		fields: { replicant: {}, computed: {}, topic: {}, rpc: {} },
	},
]);

const test = testLayer(Layer.merge(services, namespaces));

const meUrl = "http://x/api/internal/me";

const operator = Authentication.make({ issuer: "dev", subject: "operator" });

describe("me", () => {
	test(
		"reports an anonymous caller as anonymous",
		Effect.gen(function* () {
			const client = yield* buildClient;

			const res = yield* client.get(meUrl);
			expect(res.status).toBe(200);
			expect(yield* res.json).toStrictEqual({
				identity: { _tag: "anonymous" },
				namespaces: { show: { roles: [] }, other: { roles: [] } },
			});
		}),
	);

	test(
		"reports a user with the declared roles they hold",
		Effect.gen(function* () {
			const client = yield* buildClient;
			const users = yield* UserRepositoryService;
			const asOperator = yield* login(client, operator);
			const { id: operatorId } = yield* findUser(operator);
			yield* users.grantRoles(operatorId, HashSet.make(producer));

			const res = yield* asOperator.get(meUrl);
			expect(res.status).toBe(200);
			expect(yield* res.json).toStrictEqual({
				identity: {
					_tag: "user",
					id: expect.any(String),
					authentication: { issuer: "dev", subject: "operator" },
					displayName: "operator",
					roles: [{ namespace: "show", name: "producer" }],
					globalRoles: [],
				},
				namespaces: { show: { roles: ["producer"] }, other: { roles: [] } },
			});
		}),
	);

	test(
		"does not report a held role its namespace does not declare",
		Effect.gen(function* () {
			const client = yield* buildClient;
			const users = yield* UserRepositoryService;
			const asOperator = yield* login(client, operator);
			const { id: operatorId } = yield* findUser(operator);
			yield* users.grantRoles(
				operatorId,
				HashSet.make(
					Role.make({
						namespace: "show",
						name: RoleName.make("unrelated"),
					}),
				),
			);

			const res = yield* asOperator.get(meUrl);
			expect(res.status).toBe(200);
			expect(yield* res.json).toStrictEqual({
				identity: expect.anything(),
				namespaces: { show: { roles: [] }, other: { roles: [] } },
			});
		}),
	);

	test(
		"reports no declared role for an admin",
		Effect.gen(function* () {
			const client = yield* buildClient;
			const asAdmin = yield* loginAdmin(client, operator);

			const res = yield* asAdmin.get(meUrl);
			expect(res.status).toBe(200);
			expect(yield* res.json).toStrictEqual({
				identity: expect.anything(),
				namespaces: { show: { roles: [] }, other: { roles: [] } },
			});
		}),
	);
});
