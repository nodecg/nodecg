import {
	ADMIN_TIER,
	DeclarablePrincipalNameSchema,
	type DeclarablePrincipalName,
	type Identity,
	type Principal,
	type Role,
	type RoleName,
} from "@nodecg/internal";
import { Match } from "effect";

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

export interface NamespaceRole<Namespace extends string, Name extends string> {
	readonly namespace: Namespace;
	readonly name: Name;
}

export interface RoleArg<Child extends NamespaceRole<string, string>> {
	readonly description?: string;
	readonly permission: ReadonlyArray<RoleCapability>;
	readonly linkedRoles?: ReadonlyArray<Child>;
}

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

export type Access = PrincipalGrants & {
	readonly roles: ReadonlySet<RoleName>;
	readonly rolesDenied: ReadonlySet<RoleName>;
};

export interface ResolvedPermission {
	readonly read: Access;
	readonly write: Access;
	readonly canRead: (caller: Identity) => boolean;
	readonly canWrite: (caller: Identity) => boolean;
}

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

const can = (
	access: Access,
	caller: Identity,
	namespace: string,
	namedRoles: ReadonlySet<RoleName>,
): boolean => {
	if (caller._tag === "server") {
		return true;
	}
	if (isAdminTier(caller)) {
		return true;
	}
	const roles = getRolesForNamespace(caller, namespace);

	const isMember = roles.some((role) => namedRoles.has(role));
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

const EMPTY_ACCESS: Access = {
	roles: new Set(),
	rolesDenied: new Set(),
};

const buildPermission = (
	read: Access,
	write: Access,
	namespace: string,
	namedRoles: ReadonlySet<RoleName>,
): ResolvedPermission => ({
	read,
	write,
	canRead: (caller: Identity): boolean =>
		can(read, caller, namespace, namedRoles),
	canWrite: (caller: Identity): boolean =>
		can(write, caller, namespace, namedRoles),
});

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

export const replicantPermission = (
	read: Access,
	write: Access,
	namespace: string,
	namedRoles: ReadonlySet<RoleName>,
): ResolvedPermission => {
	const writeDenied = write.rolesDenied.union(read.rolesDenied);
	return buildPermission(
		{
			roles: read.roles.union(write.roles).difference(read.rolesDenied),
			rolesDenied: read.rolesDenied,
			...foldSlots(canReadWhenCanWrite, read, write),
		},
		{
			roles: write.roles.difference(writeDenied),
			rolesDenied: writeDenied,
			...foldSlots(cantWriteWhenCantRead, read, write),
		},
		namespace,
		namedRoles,
	);
};

const absentOperation = () => false;

export const computedPermission = (
	read: Access,
	namespace: string,
	namedRoles: ReadonlySet<RoleName>,
): ResolvedPermission => ({
	read,
	write: EMPTY_ACCESS,
	canRead: (caller: Identity): boolean =>
		can(read, caller, namespace, namedRoles),
	canWrite: absentOperation,
});

export const rpcPermission = (
	call: Access,
	namespace: string,
	namedRoles: ReadonlySet<RoleName>,
): ResolvedPermission => ({
	read: EMPTY_ACCESS,
	write: call,
	canRead: absentOperation,
	canWrite: (caller: Identity): boolean =>
		can(call, caller, namespace, namedRoles),
});

export const customRoutePermission = (
	request: Access,
	namespace: string,
	namedRoles: ReadonlySet<RoleName>,
): ResolvedPermission => ({
	read: EMPTY_ACCESS,
	write: request,
	canRead: absentOperation,
	canWrite: (caller: Identity): boolean =>
		can(request, caller, namespace, namedRoles),
});

export const topicPermission = (
	subscribe: Access,
	publish: Access,
	namespace: string,
	namedRoles: ReadonlySet<RoleName>,
): ResolvedPermission =>
	buildPermission(subscribe, publish, namespace, namedRoles);
