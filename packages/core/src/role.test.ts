import {
	type AdminRoleName,
	Authentication,
	User,
	ServiceAccount,
	AnonymousIdentitySchema,
	RoleName,
	ServerIdentity,
	ServiceAccountId,
	UserId,
} from "@nodecg/internal";
import { Schema } from "effect";
import { describe, expect, test } from "vitest";

import { defineNamespace } from "./define-namespace.ts";
import { getRolesForNamespace, isAdminTier } from "./role.ts";

const authentication = Authentication.make({
	issuer: "test",
	subject: "subject",
});
const user = (...names: RoleName[]) =>
	User.make({
		id: UserId.make("1"),
		authentication,
		displayName: "user",
		roles: names.map((name) => ({ namespace: "match", name })),
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
		roles: names.map((name) => ({ namespace: "match", name })),
		globalRoles: [],
	});
const anonymous = AnonymousIdentitySchema.make({});
const server = ServerIdentity.make({});

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

describe("canRead / canWrite", () => {
	test("check the caller's roles against the field's read/write set", () => {
		expect(
			manifest.replicant.score.permission.canRead(
				user(RoleName.make("viewer")),
			),
		).toBe(true);
		expect(
			manifest.replicant.score.permission.canWrite(
				user(RoleName.make("viewer")),
			),
		).toBe(false);
		expect(
			manifest.replicant.score.permission.canWrite(
				user(RoleName.make("judge")),
			),
		).toBe(true);
	});

	test("admin and superadmin pass every field set by default", () => {
		expect(
			manifest.replicant.score.permission.canWrite(adminTier("superadmin")),
		).toBe(true);
		expect(
			manifest.replicant.score.permission.canWrite(adminTier("admin")),
		).toBe(true);
	});

	test("a role counts only in the namespace it is held in", () => {
		const foreign = User.make({
			id: UserId.make("3"),
			authentication,
			displayName: "judge",
			roles: [{ namespace: "other", name: RoleName.make("judge") }],
			globalRoles: [],
		});
		expect(manifest.replicant.score.permission.canRead(foreign)).toBe(false);
		expect(manifest.replicant.score.permission.canWrite(foreign)).toBe(false);
		expect(
			manifest.replicant.score.permission.canRead(user(RoleName.make("judge"))),
		).toBe(true);
		expect(
			manifest.replicant.score.permission.canWrite(
				user(RoleName.make("judge")),
			),
		).toBe(true);
	});

	test("an anonymous caller passes only where anonymous is allowed", () => {
		expect(manifest.replicant.score.permission.canRead(anonymous)).toBe(false);
		expect(manifest.replicant.open.permission.canRead(anonymous)).toBe(true);
	});

	test("a service account with no roles matches nothing", () => {
		expect(manifest.replicant.score.permission.canRead(serviceAccount())).toBe(
			false,
		);
	});

	test("a service account's assigned roles are enforced like a user's", () => {
		expect(
			manifest.replicant.score.permission.canRead(
				serviceAccount(RoleName.make("viewer")),
			),
		).toBe(true);
		expect(
			manifest.replicant.score.permission.canWrite(
				serviceAccount(RoleName.make("viewer")),
			),
		).toBe(false);
		expect(
			manifest.replicant.score.permission.canWrite(
				serviceAccount(RoleName.make("judge")),
			),
		).toBe(true);
	});

	test("computed fields are never writable, not even for an admin", () => {
		expect(
			manifest.computed.total.permission.canRead(user(RoleName.make("viewer"))),
		).toBe(true);
		expect(
			manifest.computed.total.permission.canWrite(adminTier("superadmin")),
		).toBe(false);
	});

	test("a server identity holds every capability by default", () => {
		expect(manifest.replicant.score.permission.canWrite(server)).toBe(true);
		expect(manifest.computed.total.permission.canRead(server)).toBe(true);
	});

	test("an allow narrows the named roles without revoking the server or the admin", () => {
		expect(manifest.replicant.score.permission.canWrite(server)).toBe(true);
		expect(manifest.replicant.config.permission.canWrite(server)).toBe(true);
		expect(
			manifest.replicant.config.permission.canWrite(adminTier("admin")),
		).toBe(true);
		expect(
			manifest.replicant.config.permission.canWrite(
				user(RoleName.make("judge")),
			),
		).toBe(false);
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

		expect(
			members.replicant.lounge.permission.canRead(user(RoleName.make("judge"))),
		).toBe(true);
		expect(members.replicant.lounge.permission.canRead(anonymous)).toBe(false);
	});
});

describe("principals as capability bases", () => {
	const based = defineNamespace("match", {
		principals: { everyone: { permission: ["computed-read"] } },
		roles: { judge: { permission: ["replicant-read"] } },
		replicant: { score: { schema: Schema.Finite } },
		computed: { total: { schema: Schema.Finite } },
	});

	test("an everyone base admits every caller without a field rule", () => {
		expect(based.computed.total.permission.canRead(anonymous)).toBe(true);
		expect(
			based.computed.total.permission.canRead(user(RoleName.make("judge"))),
		).toBe(true);
	});

	test("an everyone base on one capability does not leak into another", () => {
		expect(based.replicant.score.permission.canRead(anonymous)).toBe(false);
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

	test("an explicit deny excludes a caller the wildcard would have admitted", () => {
		expect(
			wildcard.replicant.open.permission.canRead(user(RoleName.make("viewer"))),
		).toBe(true);
		expect(
			wildcard.replicant.hidden.permission.canRead(
				user(RoleName.make("viewer")),
			),
		).toBe(false);
		expect(wildcard.replicant.hidden.permission.canRead(anonymous)).toBe(true);
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

		expect(sealed.replicant.audit.permission.canRead(anonymous)).toBe(false);
		expect(
			sealed.replicant.audit.permission.canRead(user(RoleName.make("viewer"))),
		).toBe(false);
		expect(sealed.replicant.audit.permission.canRead(adminTier("admin"))).toBe(
			true,
		);
		expect(sealed.replicant.audit.permission.canRead(server)).toBe(true);
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
		expect(getRolesForNamespace(user(RoleName.make("judge")), "match")).toEqual(
			[RoleName.make("judge")],
		);
		expect(
			getRolesForNamespace(serviceAccount(RoleName.make("viewer")), "match"),
		).toEqual([RoleName.make("viewer")]);
	});

	test("is empty for a namespace the holder has no role in", () => {
		expect(getRolesForNamespace(user(RoleName.make("judge")), "other")).toEqual(
			[],
		);
	});

	test("is empty for anonymous and server", () => {
		expect(getRolesForNamespace(anonymous, "match")).toEqual([]);
		expect(getRolesForNamespace(server, "match")).toEqual([]);
	});
});
