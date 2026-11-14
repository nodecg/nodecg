import {
	ADMIN_TIER,
	DeclarablePrincipalNameSchema,
	type DeclarablePrincipalName,
	type Identity,
	PRINCIPAL,
	type Principal,
	type Role,
	RoleName,
} from "@nodecg/internal";
import { Match, Schema } from "effect";
import type { Writable } from "type-fest";

export const ROLE_CAPABILITY = [
	"replicant-read",
	"replicant-write",
	"computed-read",
	"topic-subscribe",
	"topic-publish",
	"rpc-call",
	"custom-route-request",
] as const;

export type RoleCapability = (typeof ROLE_CAPABILITY)[number];

export type Grant = "allow" | "deny";

export interface PrincipalArg {
	readonly permission: ReadonlyArray<RoleCapability>;
}

export const RoleReference = Schema.Struct({
	namespace: Schema.String,
	name: Schema.String,
}).pipe(Schema.brand("RoleReference"));
export type RoleReference = typeof RoleReference.Type;

export type PrincipalsArg = {
	readonly [K in DeclarablePrincipalName]?: PrincipalArg;
};

export type PrincipalGrants = {
	readonly [K in DeclarablePrincipalName]?: Grant;
};

export type PermissionRuleArg<InputRole extends string> = PrincipalGrants & {
	readonly allow?: readonly InputRole[];
	readonly deny?: readonly InputRole[];
};
export interface PermissionArg<InputRole extends string> {
	readonly read?: PermissionRuleArg<InputRole>;
	readonly write?: PermissionRuleArg<InputRole>;
}
export interface ReadOnlyPermissionArg<InputRole extends string> {
	readonly read?: PermissionRuleArg<InputRole>;
}
export interface WriteOnlyPermissionArg<InputRole extends string> {
	readonly write?: PermissionRuleArg<InputRole>;
}

export interface RoleManifest {
	readonly name: RoleName;
	readonly description?: string;
	readonly capabilities: ReadonlySet<RoleCapability>;
	readonly linkedRoles: ReadonlyArray<Role>;
}

export interface PrincipalManifest {
	readonly name: Principal;
	readonly capabilities: ReadonlySet<RoleCapability>;
}

export interface RoleRegistry {
	readonly roles: Map<RoleName, RoleManifest>;
	readonly principals: Map<Principal, PrincipalManifest>;
}

export type Access = PrincipalGrants & {
	readonly roles: ReadonlySet<RoleName>;
	readonly rolesDenied: ReadonlySet<RoleName>;
};

export const getRolesForNamespace = (
	caller: Identity,
	namespace: string,
): ReadonlyArray<RoleName> =>
	Match.value(caller).pipe(
		Match.withReturnType<ReadonlyArray<RoleName>>(),
		Match.tag("user", "serviceAccount", (holder) =>
			holder.roles
				.filter((role) => role.namespace === namespace)
				.map((role) => role.name),
		),
		Match.tag("anonymous", () => []),
		Match.tag("server", () => []),
		Match.exhaustive,
	);

export const isAdminTier = (caller: Identity): boolean =>
	Match.value(caller).pipe(
		Match.tag("user", "serviceAccount", (holder) =>
			holder.globalRoles.some((role) => ADMIN_TIER.has(role)),
		),
		Match.tag("anonymous", () => false),
		Match.tag("server", () => false),
		Match.exhaustive,
	);

export const isSuperadmin = (caller: Identity): boolean =>
	Match.value(caller).pipe(
		Match.tag("user", "serviceAccount", (holder) =>
			holder.globalRoles.includes("superadmin"),
		),
		Match.tag("anonymous", () => false),
		Match.tag("server", () => false),
		Match.exhaustive,
	);

export const canAccess = (
	access: Access,
	caller: Identity,
	namespace: string,
	registry: RoleRegistry,
): boolean => {
	if (caller._tag === "server") {
		return true;
	}
	if (isAdminTier(caller)) {
		return true;
	}
	const roles = getRolesForNamespace(caller, namespace);

	const isMember = roles.some((role) => registry.roles.has(role));
	if (isMember && access.member === "deny") {
		return false;
	}

	if (access.everyone === "deny") {
		return false;
	}
	if (roles.some((role) => access.rolesDenied.has(role))) {
		return false;
	}

	return (
		(isMember && access.member === "allow") ||
		access.everyone === "allow" ||
		roles.some((role) => access.roles.has(role))
	);
};

const resolveAccess = (
	registry: RoleRegistry,
	capability: RoleCapability,
	rule: PermissionRuleArg<string> | undefined,
): Access => {
	const rolesDenied = new Set(
		(rule?.deny ?? []).map((name) => RoleName.make(name)),
	);
	const roles = rule?.allow
		? new Set(rule.allow.map((name) => RoleName.make(name)))
		: new Set(
				Array.from(registry.roles.values())
					.filter((role) => role.capabilities.has(capability))
					.map((role) => role.name),
			);
	const access: Writable<Access> = {
		roles: roles.difference(rolesDenied),
		rolesDenied,
	};
	for (const name of DeclarablePrincipalNameSchema.literals) {
		const grant = rule?.[name];
		if (typeof grant !== "undefined") {
			access[name] = grant;
		} else if (
			registry.principals.get(PRINCIPAL[name])?.capabilities.has(capability)
		) {
			access[name] = "allow";
		}
	}
	return access;
};

const canReadWhenCanWrite = (
	read: Grant | undefined,
	write: Grant | undefined,
): Grant | undefined =>
	read === "deny" ? "deny" : write === "allow" ? "allow" : read;

const cantWriteWhenCantRead = (
	read: Grant | undefined,
	write: Grant | undefined,
): Grant | undefined => (read === "deny" ? "deny" : write);

const foldSlots = (
	fold: (
		read: Grant | undefined,
		write: Grant | undefined,
	) => Grant | undefined,
	read: Access,
	write: Access,
): PrincipalGrants => {
	const slots: { [K in DeclarablePrincipalName]?: Grant } = {};
	for (const name of DeclarablePrincipalNameSchema.literals) {
		slots[name] = fold(read[name], write[name]);
	}
	return slots;
};

export const resolveReplicantAccess = (
	registry: RoleRegistry,
	permission: PermissionArg<string> | undefined,
) => {
	const read = resolveAccess(registry, "replicant-read", permission?.read);
	const write = resolveAccess(registry, "replicant-write", permission?.write);
	const writeDenied = write.rolesDenied.union(read.rolesDenied);
	return {
		read: {
			roles: read.roles.union(write.roles).difference(read.rolesDenied),
			rolesDenied: read.rolesDenied,
			...foldSlots(canReadWhenCanWrite, read, write),
		},
		write: {
			roles: write.roles.difference(writeDenied),
			rolesDenied: writeDenied,
			...foldSlots(cantWriteWhenCantRead, read, write),
		},
	};
};

export const resolveComputedAccess = (
	registry: RoleRegistry,
	permission: ReadOnlyPermissionArg<string> | undefined,
) => ({
	read: resolveAccess(registry, "computed-read", permission?.read),
});

export const resolveTopicAccess = (
	registry: RoleRegistry,
	permission: PermissionArg<string> | undefined,
) => ({
	read: resolveAccess(registry, "topic-subscribe", permission?.read),
	write: resolveAccess(registry, "topic-publish", permission?.write),
});

export const resolveRpcAccess = (
	registry: RoleRegistry,
	permission: WriteOnlyPermissionArg<string> | undefined,
) => ({
	write: resolveAccess(registry, "rpc-call", permission?.write),
});

export const resolveCustomRouteAccess = (
	registry: RoleRegistry,
	permission: WriteOnlyPermissionArg<string> | undefined,
) => ({
	write: resolveAccess(registry, "custom-route-request", permission?.write),
});
