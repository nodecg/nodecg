import {
	type AdminRoleName,
	Authentication,
	User,
	ServiceAccount,
	AnonymousIdentitySchema,
	type Identity,
	manifestRolesKey,
	type NamespacePath,
	RoleName,
	ServerIdentity,
	ServiceAccountId,
	UserId,
} from "@nodecg/internal";
import { Schema } from "effect";
import { describe, expect, test } from "vitest";

import { defineNamespace } from "./define-namespace.ts";
import {
	canAccess,
	getRolesForNamespace,
	isAdminTier,
	type PermissionArg,
	type ReadOnlyPermissionArg,
	resolveComputedAccess,
	resolveCustomRouteAccess,
	resolveReplicantAccess,
	resolveRpcAccess,
	resolveTopicAccess,
	type RoleRegistry,
} from "./role.ts";

const path: NamespacePath = ["root", "match"];

const authentication = Authentication.make({
	issuer: "test",
	subject: "subject",
});
const user = (...names: RoleName[]) =>
	User.make({
		id: UserId.make("1"),
		authentication,
		displayName: "user",
		roles: names.map((name) => ({ namespace: path, name })),
		globalRoles: [],
	});
const adminTier = (...globalRoles: AdminRoleName[]) =>
	User.make({
		id: UserId.make("2"),
		authentication,
		displayName: "admin",
		roles: [],
		globalRoles,
	});
const serviceAccount = (...names: RoleName[]) =>
	ServiceAccount.make({
		id: ServiceAccountId.make("00000000-0000-4000-8000-000000000001"),
		displayName: "Bot",
		roles: names.map((name) => ({ namespace: path, name })),
		globalRoles: [],
	});
const anonymous = AnonymousIdentitySchema.make({});
const server = ServerIdentity.make({});

const canRead = (
	registry: RoleRegistry,
	permission: PermissionArg<string> | undefined,
	caller: Identity,
) =>
	canAccess(
		resolveReplicantAccess(registry, permission).read,
		caller,
		path,
		registry,
	);
const canWrite = (
	registry: RoleRegistry,
	permission: PermissionArg<string> | undefined,
	caller: Identity,
) =>
	canAccess(
		resolveReplicantAccess(registry, permission).write,
		caller,
		path,
		registry,
	);
const canReadComputed = (
	registry: RoleRegistry,
	permission: ReadOnlyPermissionArg<string> | undefined,
	caller: Identity,
) =>
	canAccess(
		resolveComputedAccess(registry, permission).read,
		caller,
		path,
		registry,
	);

const manifest = defineNamespace("match", {
	roles: {
		judge: {
			permission: ["replicant-read", "replicant-write", "computed-read"],
		},
		viewer: { permission: ["replicant-read", "computed-read"] },
	},
	replicant: {
		score: {
			schema: Schema.Finite,
			permission: { write: { allow: ["judge"] } },
		},
		open: {
			schema: Schema.Finite,
			permission: { read: { everyone: "allow" } },
		},
		config: {
			schema: Schema.String,
			permission: { write: { allow: [] } },
		},
	},
	computed: { total: { schema: Schema.Finite } },
});
const registry = manifest[manifestRolesKey];
const score = manifest.replicant.score.permission;
const open = manifest.replicant.open.permission;
const config = manifest.replicant.config.permission;

describe("canAccess", () => {
	test("check the caller's roles against the field's read/write set", () => {
		expect(canRead(registry, score, user(RoleName.make("viewer")))).toBe(true);
		expect(canWrite(registry, score, user(RoleName.make("viewer")))).toBe(
			false,
		);
		expect(canWrite(registry, score, user(RoleName.make("judge")))).toBe(true);
	});

	test("admin and superadmin pass every field set by default", () => {
		expect(canWrite(registry, score, adminTier("superadmin"))).toBe(true);
		expect(canWrite(registry, score, adminTier("admin"))).toBe(true);
	});

	test("a role counts only in the namespace it is held in", () => {
		const holder = (namespace: NamespacePath) =>
			User.make({
				id: UserId.make("3"),
				authentication,
				displayName: "judge",
				roles: [{ namespace, name: RoleName.make("judge") }],
				globalRoles: [],
			});
		expect(canWrite(registry, score, holder(path))).toBe(true);
		expect(canWrite(registry, score, holder(["root", "other"]))).toBe(false);
		expect(canWrite(registry, score, holder(["match"]))).toBe(false);
	});

	test("an anonymous caller passes only where anonymous is allowed", () => {
		expect(canRead(registry, score, anonymous)).toBe(false);
		expect(canRead(registry, open, anonymous)).toBe(true);
	});

	test("a service account with no roles matches nothing", () => {
		expect(canRead(registry, score, serviceAccount())).toBe(false);
	});

	test("a service account's assigned roles are enforced like a user's", () => {
		expect(
			canRead(registry, score, serviceAccount(RoleName.make("viewer"))),
		).toBe(true);
		expect(
			canWrite(registry, score, serviceAccount(RoleName.make("viewer"))),
		).toBe(false);
		expect(
			canWrite(registry, score, serviceAccount(RoleName.make("judge"))),
		).toBe(true);
	});

	test("a server identity holds every capability by default", () => {
		expect(canWrite(registry, score, server)).toBe(true);
		expect(
			canReadComputed(registry, manifest.computed.total.permission, server),
		).toBe(true);
	});

	test("an allow narrows the named roles without revoking the server or the admin", () => {
		expect(canWrite(registry, score, server)).toBe(true);
		expect(canWrite(registry, config, server)).toBe(true);
		expect(canWrite(registry, config, adminTier("admin"))).toBe(true);
		expect(canWrite(registry, config, user(RoleName.make("judge")))).toBe(
			false,
		);
	});

	test("a member grant admits any declared role", () => {
		const members = defineNamespace("match", {
			roles: { judge: { permission: [] } },
			replicant: {
				lounge: {
					schema: Schema.Finite,
					permission: { read: { member: "allow" } },
				},
			},
		});
		const registry = members[manifestRolesKey];
		const lounge = members.replicant.lounge.permission;

		expect(canRead(registry, lounge, user(RoleName.make("judge")))).toBe(true);
		expect(canRead(registry, lounge, anonymous)).toBe(false);
	});

	describe("principals as capability bases", () => {
		const based = defineNamespace("match", {
			principals: { everyone: { permission: ["computed-read"] } },
			roles: { judge: { permission: ["replicant-read"] } },
			replicant: { score: { schema: Schema.Finite } },
			computed: { total: { schema: Schema.Finite } },
		});
		const registry = based[manifestRolesKey];

		test("an everyone base admits every caller without a field rule", () => {
			const total = based.computed.total.permission;
			expect(canReadComputed(registry, total, anonymous)).toBe(true);
			expect(
				canReadComputed(registry, total, user(RoleName.make("judge"))),
			).toBe(true);
		});

		test("an everyone base on one capability does not leak into another", () => {
			expect(
				canRead(registry, based.replicant.score.permission, anonymous),
			).toBe(false);
		});
	});

	describe("deny beats a wildcard grant", () => {
		const wildcard = defineNamespace("match", {
			roles: { viewer: { permission: [] } },
			replicant: {
				open: {
					schema: Schema.Finite,
					permission: { read: { everyone: "allow" } },
				},
				hidden: {
					schema: Schema.Finite,
					permission: { read: { everyone: "allow", deny: ["viewer"] } },
				},
			},
		});
		const registry = wildcard[manifestRolesKey];

		test("an explicit deny excludes a caller the wildcard would have admitted", () => {
			const open = wildcard.replicant.open.permission;
			const hidden = wildcard.replicant.hidden.permission;
			expect(canRead(registry, open, user(RoleName.make("viewer")))).toBe(true);
			expect(canRead(registry, hidden, user(RoleName.make("viewer")))).toBe(
				false,
			);
			expect(canRead(registry, hidden, anonymous)).toBe(true);
		});

		test("denying everyone seals the field against every wire caller except the admin", () => {
			const sealed = defineNamespace("match", {
				roles: { viewer: { permission: ["replicant-read"] } },
				replicant: {
					audit: {
						schema: Schema.Finite,
						permission: { read: { everyone: "deny" } },
					},
				},
			});
			const registry = sealed[manifestRolesKey];
			const audit = sealed.replicant.audit.permission;

			expect(canRead(registry, audit, anonymous)).toBe(false);
			expect(canRead(registry, audit, user(RoleName.make("viewer")))).toBe(
				false,
			);
			expect(canRead(registry, audit, adminTier("admin"))).toBe(true);
			expect(canRead(registry, audit, server)).toBe(true);
		});
	});
});

describe("resolveReplicantAccess", () => {
	const manifest = defineNamespace("match", {
		roles: {
			judge: {
				permission: ["replicant-read", "replicant-write", "computed-read"],
			},
			monitor: { permission: ["computed-read"] },
			viewer: { permission: ["replicant-read", "computed-read"] },
		},
		replicant: {
			score: {
				schema: Schema.Finite,
				permission: {
					read: { deny: ["viewer"] },
					write: { allow: ["judge", "monitor"] },
				},
			},
			label: { schema: Schema.String },
			banner: {
				schema: Schema.String,
				permission: {
					read: { member: "allow" },
					write: { allow: [] },
				},
			},
		},
	});
	const registry = manifest[manifestRolesKey];

	test("no rule inherits the role-level base", () => {
		expect(
			resolveReplicantAccess(registry, manifest.replicant.label.permission),
		).toEqual({
			read: { roles: new Set(["judge", "viewer"]), rolesDenied: new Set() },
			write: { roles: new Set(["judge"]), rolesDenied: new Set() },
		});
	});

	test("deny excludes from the base", () => {
		expect(
			resolveReplicantAccess(registry, manifest.replicant.score.permission)
				.read,
		).toEqual({
			roles: new Set(["judge", "monitor"]),
			rolesDenied: new Set(["viewer"]),
		});
	});

	test("allow replaces the role base", () => {
		expect(
			resolveReplicantAccess(registry, manifest.replicant.score.permission)
				.write,
		).toEqual({
			roles: new Set(["judge", "monitor"]),
			rolesDenied: new Set(["viewer"]),
		});
	});

	test("a member grant stays a slot", () => {
		expect(
			resolveReplicantAccess(registry, manifest.replicant.banner.permission)
				.read,
		).toEqual({
			roles: new Set(["judge", "viewer"]),
			rolesDenied: new Set(),
			member: "allow",
		});
	});

	test("server-owned write", () => {
		expect(
			resolveReplicantAccess(registry, manifest.replicant.banner.permission)
				.write,
		).toEqual({
			roles: new Set(),
			rolesDenied: new Set(),
		});
	});

	describe("member and everyone bases", () => {
		test("a member grant does not drop a namespace-wide everyone base", () => {
			const based = defineNamespace("match", {
				principals: { everyone: { permission: ["replicant-read"] } },
				roles: {
					judge: { permission: ["replicant-read"] },
					viewer: { permission: [] },
				},
				replicant: {
					internal: {
						schema: Schema.Finite,
						permission: { read: { member: "allow" } },
					},
				},
			});

			expect(
				resolveReplicantAccess(
					based[manifestRolesKey],
					based.replicant.internal.permission,
				).read,
			).toEqual({
				roles: new Set(["judge"]),
				rolesDenied: new Set(),
				everyone: "allow",
				member: "allow",
			});
		});

		test("member is a blanket base every named role holds", () => {
			const based = defineNamespace("match", {
				principals: { member: { permission: ["replicant-read"] } },
				roles: {
					judge: { permission: ["replicant-write"] },
					viewer: { permission: [] },
				},
				replicant: { score: { schema: Schema.Finite } },
			});

			expect(
				resolveReplicantAccess(
					based[manifestRolesKey],
					based.replicant.score.permission,
				),
			).toEqual({
				read: {
					roles: new Set(["judge"]),
					rolesDenied: new Set(),
					member: "allow",
				},
				write: { roles: new Set(["judge"]), rolesDenied: new Set() },
			});
		});
	});

	describe("a replicant writer is a reader", () => {
		test("a write capability carries read", () => {
			const manifest = defineNamespace("match", {
				roles: { producer: { permission: ["replicant-write"] } },
				replicant: { score: { schema: Schema.Finite } },
			});

			expect(
				resolveReplicantAccess(
					manifest[manifestRolesKey],
					manifest.replicant.score.permission,
				),
			).toEqual({
				read: { roles: new Set(["producer"]), rolesDenied: new Set() },
				write: { roles: new Set(["producer"]), rolesDenied: new Set() },
			});
		});

		test("denying read denies write with it", () => {
			const manifest = defineNamespace("match", {
				roles: { producer: { permission: ["replicant-write"] } },
				replicant: {
					secret: {
						schema: Schema.String,
						permission: { read: { deny: ["producer"] } },
					},
				},
			});

			expect(
				resolveReplicantAccess(
					manifest[manifestRolesKey],
					manifest.replicant.secret.permission,
				),
			).toEqual({
				read: { roles: new Set(), rolesDenied: new Set(["producer"]) },
				write: { roles: new Set(), rolesDenied: new Set(["producer"]) },
			});
		});

		test("denying write leaves read intact", () => {
			const manifest = defineNamespace("match", {
				roles: {
					viewer: { permission: ["replicant-read", "replicant-write"] },
				},
				replicant: {
					board: {
						schema: Schema.String,
						permission: { write: { deny: ["viewer"] } },
					},
				},
			});

			expect(
				resolveReplicantAccess(
					manifest[manifestRolesKey],
					manifest.replicant.board.permission,
				),
			).toEqual({
				read: { roles: new Set(["viewer"]), rolesDenied: new Set() },
				write: { roles: new Set(), rolesDenied: new Set(["viewer"]) },
			});
		});
	});
});

describe("resolveComputedAccess", () => {
	test("computed resolves its read base", () => {
		const manifest = defineNamespace("match", {
			roles: {
				judge: {
					permission: ["replicant-read", "replicant-write", "computed-read"],
				},
				monitor: { permission: ["computed-read"] },
				viewer: { permission: ["replicant-read", "computed-read"] },
			},
			computed: {
				winning: { schema: Schema.NullOr(Schema.Literals(["l", "r"])) },
			},
		});

		expect(
			resolveComputedAccess(
				manifest[manifestRolesKey],
				manifest.computed.winning.permission,
			),
		).toEqual({
			read: {
				roles: new Set(["judge", "monitor", "viewer"]),
				rolesDenied: new Set(),
			},
		});
	});

	test("everyone opens every field of the capability", () => {
		const based = defineNamespace("match", {
			principals: { everyone: { permission: ["computed-read"] } },
			roles: { judge: { permission: ["replicant-read"] } },
			replicant: { score: { schema: Schema.Finite } },
			computed: { winning: { schema: Schema.Boolean } },
		});
		const registry = based[manifestRolesKey];

		expect(
			resolveComputedAccess(registry, based.computed.winning.permission),
		).toEqual({
			read: { roles: new Set(), rolesDenied: new Set(), everyone: "allow" },
		});
		expect(
			resolveReplicantAccess(registry, based.replicant.score.permission).read,
		).toEqual({
			roles: new Set(["judge"]),
			rolesDenied: new Set(),
		});
	});
});

describe("resolveTopicAccess", () => {
	test("a topic publisher is not a subscriber", () => {
		const topic = defineNamespace("match", {
			roles: { announcer: { permission: ["topic-publish"] } },
			topic: { bell: { schema: Schema.String } },
		});

		expect(
			resolveTopicAccess(topic[manifestRolesKey], topic.topic.bell.permission),
		).toEqual({
			read: { roles: new Set(), rolesDenied: new Set() },
			write: { roles: new Set(["announcer"]), rolesDenied: new Set() },
		});
	});

	test("server-only publish leaves write to the server", () => {
		const topic = defineNamespace("match", {
			roles: { viewer: { permission: ["topic-subscribe"] } },
			topic: {
				start: {
					schema: Schema.Boolean,
					permission: { write: { allow: [] } },
				},
			},
		});

		expect(
			resolveTopicAccess(topic[manifestRolesKey], topic.topic.start.permission),
		).toEqual({
			read: { roles: new Set(["viewer"]), rolesDenied: new Set() },
			write: { roles: new Set(), rolesDenied: new Set() },
		});
	});
});

describe("resolveRpcAccess", () => {
	test("rpc-call sets the call base", () => {
		const rpc = defineNamespace("match", {
			roles: {
				operator: { permission: ["rpc-call"] },
				viewer: { permission: ["replicant-read"] },
			},
			rpc: {
				restart: {
					schema: { request: Schema.Finite, response: Schema.Finite },
				},
			},
		});

		expect(
			resolveRpcAccess(rpc[manifestRolesKey], rpc.rpc.restart.permission),
		).toEqual({
			write: { roles: new Set(["operator"]), rolesDenied: new Set() },
		});
	});

	test("field deny subtracts from the rpc-call base", () => {
		const rpc = defineNamespace("match", {
			roles: {
				operator: { permission: ["rpc-call"] },
				producer: { permission: ["rpc-call"] },
			},
			rpc: {
				restart: {
					schema: { request: Schema.Finite, response: Schema.Finite },
					permission: { write: { deny: ["operator"] } },
				},
			},
		});

		expect(
			resolveRpcAccess(rpc[manifestRolesKey], rpc.rpc.restart.permission),
		).toEqual({
			write: {
				roles: new Set(["producer"]),
				rolesDenied: new Set(["operator"]),
			},
		});
	});
});

describe("resolveCustomRouteAccess", () => {
	test("custom-route-request sets the request base", () => {
		const routes = defineNamespace("match", {
			roles: {
				operator: { permission: ["custom-route-request"] },
				viewer: { permission: ["rpc-call"] },
			},
			customRoute: { backup: { get: {} } },
		});

		expect(
			resolveCustomRouteAccess(
				routes[manifestRolesKey],
				routes.customRoute.backup.get.permission,
			),
		).toEqual({
			write: { roles: new Set(["operator"]), rolesDenied: new Set() },
		});
	});

	test("each method keeps its own permission", () => {
		const routes = defineNamespace("match", {
			roles: {
				operator: { permission: ["custom-route-request"] },
				producer: { permission: ["custom-route-request"] },
			},
			customRoute: {
				asset: {
					get: { permission: { write: { deny: ["operator"] } } },
					post: {},
				},
				webhook: {
					"*": { permission: { write: { everyone: "allow" } } },
				},
			},
		});
		const registry = routes[manifestRolesKey];

		expect(
			resolveCustomRouteAccess(
				registry,
				routes.customRoute.asset.get.permission,
			),
		).toEqual({
			write: {
				roles: new Set(["producer"]),
				rolesDenied: new Set(["operator"]),
			},
		});
		expect(
			resolveCustomRouteAccess(
				registry,
				routes.customRoute.asset.post.permission,
			),
		).toEqual({
			write: {
				roles: new Set(["operator", "producer"]),
				rolesDenied: new Set(),
			},
		});
		expect(
			resolveCustomRouteAccess(
				registry,
				routes.customRoute.webhook["*"].permission,
			),
		).toEqual({
			write: {
				roles: new Set(["operator", "producer"]),
				rolesDenied: new Set(),
				everyone: "allow",
			},
		});
	});

	test("a method set to undefined resolves like an empty one", () => {
		const routes = defineNamespace("match", {
			roles: { operator: { permission: ["custom-route-request"] } },
			customRoute: { backup: { get: undefined } },
		});

		expect(
			resolveCustomRouteAccess(
				routes[manifestRolesKey],
				routes.customRoute.backup.get.permission,
			),
		).toEqual({
			write: { roles: new Set(["operator"]), rolesDenied: new Set() },
		});
	});
});

describe("admin and server are undeniable", () => {
	test("a permission rule cannot target them", () => {
		for (const principal of ["admin", "server"]) {
			const permission = { write: { [principal]: "deny" } };
			expect(() =>
				defineNamespace("match", {
					replicant: { audit: { schema: Schema.Finite, permission } },
				}),
			).toThrow(
				new RegExp(`Undeniable principal "${principal}" in replicant "audit"`),
			);
		}
	});

	test("their capability bases cannot be overridden", () => {
		for (const principal of ["admin", "server"]) {
			const principals = { [principal]: { permission: [] } };
			expect(() =>
				defineNamespace("match", {
					principals,
					replicant: { score: { schema: Schema.Finite } },
				}),
			).toThrow(new RegExp(`Principal "${principal}" is undeniable`));
		}
	});
});

describe("isAdminTier", () => {
	test("holds for superadmin and admin", () => {
		expect(isAdminTier(adminTier("superadmin"))).toBe(true);
		expect(isAdminTier(adminTier("admin"))).toBe(true);
	});

	test("fails for a named role, anonymous, and server", () => {
		expect(isAdminTier(user(RoleName.make("judge")))).toBe(false);
		expect(isAdminTier(anonymous)).toBe(false);
		expect(isAdminTier(server)).toBe(false);
	});
});

describe("getRolesForNamespace", () => {
	test("projects the roles a user and a service account hold in the namespace", () => {
		expect(getRolesForNamespace(user(RoleName.make("judge")), path)).toEqual([
			RoleName.make("judge"),
		]);
		expect(
			getRolesForNamespace(serviceAccount(RoleName.make("viewer")), path),
		).toEqual([RoleName.make("viewer")]);
	});

	test("is empty for a namespace the holder has no role in", () => {
		expect(
			getRolesForNamespace(user(RoleName.make("judge")), ["root", "other"]),
		).toEqual([]);
	});

	test("is empty for anonymous and server", () => {
		expect(getRolesForNamespace(anonymous, path)).toEqual([]);
		expect(getRolesForNamespace(server, path)).toEqual([]);
	});
});
