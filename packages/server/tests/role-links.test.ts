import { testLayer } from "@nodecg-private/test-utils";
import { defineNamespace } from "@nodecg/core";
import {
	Authentication,
	manifestRolesKey,
	Role,
	RoleName,
} from "@nodecg/internal";
import { Effect, HashSet, Layer } from "effect";
import { describe, expect } from "vitest";

import { normalizeRoleLinks, RoleLinks } from "../src/auth/role-links.ts";
import { NamespaceRegistryService } from "../src/namespace-registry.ts";
import { UserRepositoryService } from "../src/services/repository/user/user-repository.ts";
import { buildClient, findUser, login, services } from "./setup.ts";

const assets = defineNamespace("show-assets", {
	roles: { uploader: { permission: [] } },
});
const show = defineNamespace("show", {
	roles: {
		operator: { permission: [], linkedRoles: [assets.roles.uploader] },
	},
	children: { assets },
});

const operator = Role.make({
	namespace: show.roles.operator.namespace,
	name: RoleName.make(show.roles.operator.name),
});

const namespaces = NamespaceRegistryService.layer(
	[show, assets].map((manifest) => ({
		namespace: manifest.namespace,
		declaredRoles: new Set(manifest[manifestRolesKey].roles.keys()),
		fields: { replicant: {}, computed: {}, topic: {}, rpc: {} },
	})),
);

const links = Layer.succeed(RoleLinks, normalizeRoleLinks([show, assets]));

const test = testLayer(Layer.mergeAll(services, namespaces, links));

const meUrl = "http://x/api/internal/me";

const alice = Authentication.make({ issuer: "dev", subject: "alice" });

describe("role links", () => {
	test(
		"report a linked role under its own namespace",
		Effect.gen(function* () {
			const client = yield* buildClient;
			const users = yield* UserRepositoryService;
			const asAlice = yield* login(client, alice);
			const { id } = yield* findUser(alice);
			yield* users.grantRoles(id, HashSet.make(operator));

			const res = yield* asAlice.get(meUrl);
			expect(res.status).toBe(200);
			expect(yield* res.json).toMatchObject({
				namespaces: {
					show: { roles: ["operator"] },
					"show-assets": { roles: ["uploader"] },
				},
			});
		}),
	);

	test(
		"drop the linked role with its source",
		Effect.gen(function* () {
			const client = yield* buildClient;
			const users = yield* UserRepositoryService;
			const asAlice = yield* login(client, alice);
			const { id } = yield* findUser(alice);
			yield* users.grantRoles(id, HashSet.make(operator));

			yield* users.revokeRoles(id, HashSet.make(operator));

			const res = yield* asAlice.get(meUrl);
			expect(res.status).toBe(200);
			expect(yield* res.json).toMatchObject({
				namespaces: { show: { roles: [] }, "show-assets": { roles: [] } },
			});
		}),
	);
});
