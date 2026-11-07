import {
	DeclarablePrincipalNameSchema,
	isUndeclarableRole,
	manifestRolesKey,
	PRINCIPAL,
	Role,
	RoleName,
	UndeniablePrincipalNameSchema,
	type DeclarablePrincipalName,
	type Principal,
	type UndeclarableRoleName,
} from "@nodecg-next/internal";
import {
	type AddedRpcSchemas,
	type AddedSchemas,
	type CaseClashingKeys,
	type WidestFieldSchema,
	type FileSafeName,
	findCaseClash,
	isFileSafeName,
	mapNestedValues,
	mapRpcValues,
	mapSchemaValues,
	mapValues,
	type MergedNestedKeys,
	mergeNestedValues,
	mergeRecords,
	type NestedValues,
	type UnsafeNameKeys,
} from "@nodecg-next/internal/utils";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import { type HKT, Option, Record, Schema, String } from "effect";
import { HttpMethod } from "effect/http";

import { makeCodec, type FieldCodec } from "./field-codec.ts";
import {
	computedPermission,
	customRoutePermission,
	replicantPermission,
	rpcPermission,
	topicPermission,
	type Access,
	type Grant,
	type NamespaceRole,
	type PermissionArg,
	type PrincipalManifest,
	type PrincipalsArg,
	type PermissionRuleArg,
	type ReadOnlyPermissionArg,
	type ResolvedPermission,
	type RoleArg,
	type RoleCapability,
	type RoleManifest,
	type WriteOnlyPermissionArg,
} from "./role.ts";

export interface FieldManifest<D> extends FieldCodec<D> {
	readonly name: string;
	readonly permission: ResolvedPermission;
}

export interface ReplicantFieldManifest<D> extends FieldManifest<D> {
	readonly persistent: boolean;
}

export interface RpcFieldManifest<Request, Response> {
	readonly name: string;
	readonly request: FieldCodec<Request>;
	readonly response: FieldCodec<Response>;
	readonly permission: ResolvedPermission;
}

type HttpMethodKey = Lowercase<Exclude<HttpMethod.HttpMethod, "TRACE">>;

export type CustomRouteMethod = HttpMethodKey | "*";

export interface CustomRouteManifest {
	readonly name: string;
	readonly permission: ResolvedPermission;
}

type CustomRouteMethodOption<P extends WriteOnlyPermissionArg<string>> = {
	readonly permission?: P;
};

type CustomRouteOption<P extends WriteOnlyPermissionArg<string>> =
	| ({ readonly [M in HttpMethodKey]?: CustomRouteMethodOption<P> } & {
			readonly "*"?: never;
	  })
	| ({ readonly [M in HttpMethodKey]?: never } & {
			readonly "*": CustomRouteMethodOption<P>;
	  });

export type WidestCustomRoutes = Readonly<
	Record<string, CustomRouteOption<WriteOnlyPermissionArg<string>>>
>;

export type WidestRpcField = {
	readonly request: unknown;
	readonly response: unknown;
};

export type WidestRpcFields = Record<string, WidestRpcField>;

export type WidestNamespaceFields = {
	readonly replicant: Record<string, unknown>;
	readonly computed: Record<string, unknown>;
	readonly topic: Record<string, unknown>;
	readonly rpc: WidestRpcFields;
	readonly children: WidestNamespaceManifests;
};

export type EmptyNamespaceFields = {
	readonly replicant: {};
	readonly computed: {};
	readonly topic: {};
	readonly rpc: {};
	readonly children: {};
};

export type WidestNamespaceManifests = Record<
	string,
	NamespaceManifest<string, EmptyNamespaceFields, string>
>;

export interface NamespaceManifest<
	Namespace extends string,
	S extends WidestNamespaceFields,
	RoleNames extends string,
	CustomRoutes extends WidestCustomRoutes = WidestCustomRoutes,
> {
	readonly namespace: Namespace;
	readonly roles: Readonly<
		Record<RoleNames, NamespaceRole<Namespace, RoleNames>>
	>;

	readonly replicant: {
		[K in keyof S["replicant"] & string]: ReplicantFieldManifest<
			S["replicant"][K]
		>;
	};
	readonly computed: {
		[K in keyof S["computed"] & string]: FieldManifest<S["computed"][K]>;
	};
	readonly topic: {
		[K in keyof S["topic"] & string]: FieldManifest<S["topic"][K]>;
	};
	readonly rpc: {
		[K in keyof S["rpc"] & string]: RpcFieldManifest<
			S["rpc"][K]["request"],
			S["rpc"][K]["response"]
		>;
	};
	readonly customRoute: NestedValues<CustomRoutes, CustomRouteManifest>;
	readonly children: S["children"];

	readonly [manifestRolesKey]: RoleRegistry;
}

export type InferNamespace<Manifest> =
	Manifest extends NamespaceManifest<
		string,
		infer Fields,
		string,
		infer CustomRoutes
	>
		? { readonly fields: Fields; readonly customRoutes: CustomRoutes }
		: never;

type FieldDecoded<S> = S extends Schema.Top
	? S["Type"]
	: S extends StandardSchemaV1<unknown, infer Output>
		? Output
		: never;

type IsAnyOrUnknown<D> = unknown extends D ? true : false;

// Coerce unknown types to JSON
type UnknownAsJson<D> =
	IsAnyOrUnknown<D> extends true
		? Schema.Json
		: D extends string | number | boolean | null | undefined
			? D
			: D extends (...args: any[]) => any
				? D
				: D extends ReadonlyArray<unknown> | object
					? { [K in keyof D]: UnknownAsJson<D[K]> }
					: D;

/**
 * Returns S when JSON compatible, otherwise error string
 */
type JsonEncodable<S> =
	S extends Schema.Codec<unknown, infer Encoded>
		? [Encoded] extends [Schema.Json]
			? S
			: "The schema must encode to JSON"
		: S extends StandardSchemaV1<unknown, infer Output>
			? [UnknownAsJson<Output>] extends [Schema.Json]
				? S
				: "Every part of the schema's value must be JSON"
			: never;

interface FieldOption<
	S extends WidestFieldSchema,
	P extends PermissionArg<string> | ReadOnlyPermissionArg<string>,
> {
	readonly schema: JsonEncodable<S>;
	readonly permission?: P;
}

type FieldOptions<
	Schemas extends Record<string, WidestFieldSchema>,
	P extends PermissionArg<string> | ReadOnlyPermissionArg<string>,
> = {
	[K in keyof Schemas & string]: FieldOption<Schemas[K], P>;
};

interface ReplicantFieldOption<
	S extends WidestFieldSchema,
	P extends PermissionArg<string>,
> extends FieldOption<S, P> {
	readonly persistent?: boolean;
}

type ReplicantFieldOptions<
	Schemas extends Record<string, WidestFieldSchema>,
	P extends PermissionArg<string>,
> = {
	[K in keyof Schemas & string]: ReplicantFieldOption<Schemas[K], P>;
};

type FieldOptionSchema<Option> =
	Option extends FieldOption<
		infer S extends WidestFieldSchema,
		PermissionArg<string> | ReadOnlyPermissionArg<string>
	>
		? S
		: never;

// Target FieldOption since the mapValues calls below fail to type-check with a schema target.
interface FieldOptionLambda<
	P extends PermissionArg<string> | ReadOnlyPermissionArg<string>,
>
	extends HKT.TypeLambda {
	readonly Target: FieldOption<WidestFieldSchema, P>;
	readonly type: this["Target"];
}
interface FieldManifestFromOptionLambda extends HKT.TypeLambda {
	readonly type: FieldManifest<FieldDecoded<FieldOptionSchema<this["Target"]>>>;
}
interface FieldManifestLambda extends HKT.TypeLambda {
	readonly type: FieldManifest<this["Target"]>;
}
interface ReplicantFieldOptionLambda<P extends PermissionArg<string>>
	extends HKT.TypeLambda {
	readonly Target: ReplicantFieldOption<WidestFieldSchema, P>;
	readonly type: this["Target"];
}
interface ReplicantFieldManifestFromOptionLambda extends HKT.TypeLambda {
	readonly type: ReplicantFieldManifest<
		FieldDecoded<FieldOptionSchema<this["Target"]>>
	>;
}
interface ReplicantFieldManifestLambda extends HKT.TypeLambda {
	readonly type: ReplicantFieldManifest<this["Target"]>;
}

type RpcSchemaPair = {
	readonly request: WidestFieldSchema;
	readonly response: WidestFieldSchema;
};

interface RpcFieldOption<P extends WriteOnlyPermissionArg<string>> {
	readonly schema: RpcSchemaPair;
	readonly permission?: P;
}

interface RpcFieldManifestFromSchemaLambda extends HKT.TypeLambda {
	readonly Target: RpcSchemaPair;
	readonly type: RpcFieldManifest<
		FieldDecoded<this["Target"]["request"]>,
		FieldDecoded<this["Target"]["response"]>
	>;
}
interface RpcFieldManifestLambda extends HKT.TypeLambda {
	readonly Target: WidestRpcField;
	readonly type: RpcFieldManifest<
		this["Target"]["request"],
		this["Target"]["response"]
	>;
}

function implementCodec(name: string, schema: WidestFieldSchema) {
	return { name, ...makeCodec(name, schema) };
}

interface RoleRegistry {
	readonly roles: Map<RoleName, RoleManifest>;
	readonly principals: Map<Principal, PrincipalManifest>;
}

interface DeclaredTokens {
	readonly roles: ReadonlySet<RoleName>;
	readonly principals: ReadonlySet<DeclarablePrincipalName>;
}

type AccessBuilder = {
	[K in DeclarablePrincipalName]?: Grant;
} & {
	roles: Set<RoleName>;
	rolesDenied: Set<RoleName>;
};

const initializeAccess = (): AccessBuilder => ({
	roles: new Set(),
	rolesDenied: new Set(),
});

const updateAccess = (access: Access): AccessBuilder => ({
	...access,
	roles: new Set(access.roles),
	rolesDenied: new Set(access.rolesDenied),
});

const writeRule = (
	access: AccessBuilder,
	rule: PermissionRuleArg<string> | undefined,
): void => {
	if (typeof rule === "undefined") {
		return;
	}
	if (rule.allow) {
		access.roles = new Set(rule.allow.map((name) => RoleName.make(name)));
		// an allow lifts a denial it names
		access.rolesDenied = access.rolesDenied.difference(access.roles);
	}
	if (rule.deny) {
		const denied = new Set(rule.deny.map((name) => RoleName.make(name)));
		access.roles = access.roles.difference(denied);
		access.rolesDenied = access.rolesDenied.union(denied);
	}
	for (const principal of DeclarablePrincipalNameSchema.literals) {
		const grant = rule[principal];
		if (typeof grant !== "undefined") {
			access[principal] = grant;
		}
	}
};

/**
 * A fresh field (no precedent) replays every registry row onto a seed;
 * an inherited field replays only the tokens this layer re-declared.
 */
const resolveAccess = (
	registry: RoleRegistry,
	declared: DeclaredTokens,
	capability: RoleCapability,
	precedent: Access | undefined,
	rule: PermissionRuleArg<string> | undefined,
): Access => {
	const access = precedent ? updateAccess(precedent) : initializeAccess();
	const roles = precedent ? declared.roles : registry.roles.keys();
	for (const role of roles) {
		if (access.rolesDenied.has(role)) {
			// a field-level deny stands
			continue;
		}
		if (registry.roles.get(role)?.capabilities.has(capability)) {
			access.roles.add(role);
		} else {
			access.roles.delete(role);
		}
	}
	const principals = precedent
		? declared.principals
		: DeclarablePrincipalNameSchema.literals;
	for (const name of principals) {
		if (access[name] === "deny") {
			continue;
		}
		if (
			registry.principals.get(PRINCIPAL[name])?.capabilities.has(capability)
		) {
			access[name] = "allow";
		} else {
			access[name] = undefined;
		}
	}
	writeRule(access, rule);
	return access;
};

type FieldPermissionOptions = {
	readonly permission?: {
		readonly read?: PermissionRuleArg<string>;
		readonly write?: PermissionRuleArg<string>;
	};
};

const validatePermission = (
	label: string,
	permission: FieldPermissionOptions["permission"],
	roles: ReadonlyMap<RoleName, RoleManifest>,
): void => {
	for (const operation of ["read", "write"] as const) {
		const rule = permission?.[operation];
		if (typeof rule === "undefined") {
			continue;
		}
		for (const principal of UndeniablePrincipalNameSchema.literals) {
			if (principal in rule) {
				throw new Error(
					`Undeniable principal "${principal}" in ${label} ${operation}`,
				);
			}
		}
		for (const kind of ["allow", "deny"] as const) {
			for (const token of rule[kind] ?? []) {
				if (!roles.has(RoleName.make(token))) {
					throw new Error(
						`Unknown role "${token}" in ${label} ${operation}.${kind}`,
					);
				}
			}
		}
	}
};

const validatePermissionTokens = (
	group: "replicant" | "computed" | "topic" | "rpc",
	fields: Readonly<Record<string, FieldPermissionOptions>> | undefined,
	roles: ReadonlyMap<RoleName, RoleManifest>,
): void => {
	for (const [name, field] of Object.entries(fields ?? {})) {
		validatePermission(`${group} "${name}"`, field.permission, roles);
	}
};

const validateReplicantNames = (
	namespace: string,
	replicant: Readonly<Record<string, unknown>> | undefined,
	existing: ReadonlyArray<string>,
): void => {
	const names = Object.keys(replicant ?? {});
	for (const name of names) {
		if (!isFileSafeName(name)) {
			throw new Error(
				`Replicant "${name}" in "${namespace}" must use only A-Z, a-z, 0-9, "_" and "-", and not be a Windows device name`,
			);
		}
	}
	const clash = findCaseClash(names, existing);
	if (Option.isSome(clash)) {
		throw new Error(
			`Replicant "${clash.value.name}" in "${namespace}" differs from "${clash.value.clash}" only in case`,
		);
	}
};

const isCustomRouteMethod = Schema.is(
	Schema.Literals([
		"*",
		...Array.from(HttpMethod.all)
			.filter((method) => method !== "TRACE")
			.map((method) => String.toLowerCase(method)),
	]),
);

const validateCustomRouteNames = (
	namespace: string,
	customRoute: Readonly<Record<string, unknown>> | undefined,
	existing: ReadonlyArray<string>,
): void => {
	const names = Object.keys(customRoute ?? {});
	for (const name of names) {
		if (!isFileSafeName(name)) {
			throw new Error(
				`Custom route "${name}" in "${namespace}" must use only A-Z, a-z, 0-9, "_" and "-", and not be a Windows device name`,
			);
		}
	}
	const clash = findCaseClash(names, existing);
	if (Option.isSome(clash)) {
		throw new Error(
			`Custom route "${clash.value.name}" in "${namespace}" differs from "${clash.value.clash}" only in case`,
		);
	}
};

const validateCustomRouteMethods = (
	namespace: string,
	customRoute: WidestCustomRoutes | undefined,
	roles: ReadonlyMap<RoleName, RoleManifest>,
): void => {
	for (const [name, methods] of Object.entries(customRoute ?? {})) {
		for (const [key, option] of Object.entries(methods)) {
			if (!isCustomRouteMethod(key)) {
				throw new Error(
					`Custom route "${name}" in "${namespace}" has unknown method "${key}"`,
				);
			}
			validatePermission(
				`customRoute "${name}" ${key}`,
				option?.permission,
				roles,
			);
		}
	}
};

const isDeclarablePrincipalName = Schema.is(DeclarablePrincipalNameSchema);
const isUndeniablePrincipalName = Schema.is(UndeniablePrincipalNameSchema);

const declareRoles = (
	precedent: RoleRegistry,
	named:
		| Readonly<
				Record<string, RoleArg<NamespaceRole<string, string>> | undefined>
		  >
		| undefined,
	overrides: PrincipalsArg | undefined,
	children: WidestNamespaceManifests,
): {
	registry: RoleRegistry;
	declared: DeclaredTokens;
} => {
	const roles = new Map(precedent.roles);
	const principals = new Map(precedent.principals);
	const declaredRoles = new Set<RoleName>();
	const declaredPrincipals = new Set<DeclarablePrincipalName>();

	// Resolve principals
	for (const [key, arg] of Object.entries(overrides ?? {})) {
		if (typeof arg === "undefined") {
			continue;
		}
		if (isUndeniablePrincipalName(key)) {
			throw new Error(`Principal "${key}" is undeniable`);
		}
		if (!isDeclarablePrincipalName(key)) {
			continue;
		}
		principals.set(PRINCIPAL[key], {
			name: PRINCIPAL[key],
			capabilities: new Set(arg.permission),
		});
		declaredPrincipals.add(key);
	}

	// Resolve roles
	for (const [key, arg] of Object.entries(named ?? {})) {
		if (typeof arg === "undefined") {
			continue;
		}
		if (isDeclarablePrincipalName(key)) {
			throw new Error(
				`Role "${key}" is a principal — declare it under "principals"`,
			);
		}
		if (isUndeclarableRole(key)) {
			throw new Error(
				`Role "${key}" cannot be declared: it is granted to a user, never declared by a namespace`,
			);
		}
		const roleName = RoleName.make(key);
		const existing = roles.get(roleName);
		const linkedRoles = arg.linkedRoles?.map(({ namespace, name }) => {
			if (
				!Object.values(children).some(
					(child) =>
						child.namespace === namespace &&
						child[manifestRolesKey].roles.has(RoleName.make(name)),
				)
			) {
				throw new Error(
					`Role "${key}" cannot link to "${name}" of "${namespace}": no child declares it`,
				);
			}
			return Role.make({ namespace, name: RoleName.make(name) });
		});
		roles.set(roleName, {
			name: roleName,
			description: arg.description ?? existing?.description,
			capabilities: new Set(arg.permission),
			linkedRoles: linkedRoles ?? existing?.linkedRoles ?? [],
		});
		declaredRoles.add(roleName);
	}

	return {
		registry: { roles, principals },
		declared: { roles: declaredRoles, principals: declaredPrincipals },
	};
};

// Infer roles of child manifest type
type ChildRole<Children extends WidestNamespaceManifests> = {
	[K in keyof Children]: Children[K]["roles"][keyof Children[K]["roles"]];
}[keyof Children];

export function defineNamespace<
	const Namespace extends string,
	Replicant extends Record<string, WidestFieldSchema> = {},
	Computed extends Record<string, WidestFieldSchema> = {},
	Topic extends Record<string, WidestFieldSchema> = {},
	Rpc extends Record<
		string,
		RpcFieldOption<WriteOnlyPermissionArg<DeclaredRoleName>>
	> = {},
	const CustomRoute extends Record<
		string,
		CustomRouteOption<WriteOnlyPermissionArg<DeclaredRoleName>>
	> = {},
	const DeclaredRoleName extends string = never,
	Children extends WidestNamespaceManifests = {},
>(
	namespace: FileSafeName<Namespace>,
	defineOption: {
		roles?: Record<DeclaredRoleName, RoleArg<ChildRole<NoInfer<Children>>>> & {
			[K in UndeclarableRoleName]?: never;
		};
		principals?: PrincipalsArg;
		replicant?: ReplicantFieldOptions<
			Replicant,
			PermissionArg<DeclaredRoleName>
		> &
			UnsafeNameKeys<Replicant> &
			CaseClashingKeys<Replicant>;
		computed?: FieldOptions<Computed, ReadOnlyPermissionArg<DeclaredRoleName>>;
		topic?: FieldOptions<Topic, PermissionArg<DeclaredRoleName>>;
		rpc?: Rpc;
		customRoute?: CustomRoute &
			UnsafeNameKeys<CustomRoute> &
			CaseClashingKeys<CustomRoute>;
		children?: Children;
	},
): NamespaceManifest<
	FileSafeName<Namespace>,
	{
		replicant: { [K in keyof Replicant]: FieldDecoded<Replicant[K]> };
		computed: { [K in keyof Computed]: FieldDecoded<Computed[K]> };
		topic: { [K in keyof Topic]: FieldDecoded<Topic[K]> };
		rpc: AddedRpcDecoded<Rpc>;
		children: Children;
	},
	DeclaredRoleName,
	CustomRoute
> {
	if (!isFileSafeName(namespace)) {
		throw new Error(
			`Namespace "${namespace}" must use only A-Z, a-z, 0-9, "_" and "-", and not be a Windows device name`,
		);
	}

	// Check names are file path and URL safe
	validateReplicantNames(namespace, defineOption.replicant, []);
	validateCustomRouteNames(namespace, defineOption.customRoute, []);

	const children = defineOption.children ?? ({} as Children);

	const { registry, declared } = declareRoles(
		{ roles: new Map(), principals: new Map() },
		defineOption.roles,
		defineOption.principals,
		children,
	);

	const namedRoles = new Set(registry.roles.keys());

	validatePermissionTokens("replicant", defineOption.replicant, registry.roles);
	validatePermissionTokens("computed", defineOption.computed, registry.roles);
	validatePermissionTokens("topic", defineOption.topic, registry.roles);
	validatePermissionTokens("rpc", defineOption.rpc, registry.roles);
	validateCustomRouteMethods(
		namespace,
		defineOption.customRoute,
		registry.roles,
	);

	const resolve = (
		capability: RoleCapability,
		rule: PermissionRuleArg<DeclaredRoleName> | undefined,
	) => resolveAccess(registry, declared, capability, undefined, rule);

	const replicant = mapValues<
		ReplicantFieldOptionLambda<PermissionArg<DeclaredRoleName>>,
		ReplicantFieldManifestFromOptionLambda
	>((option, name) => ({
		...implementCodec(name, option.schema),
		permission: replicantPermission(
			resolve("replicant-read", option.permission?.read),
			resolve("replicant-write", option.permission?.write),
			namespace,
			namedRoles,
		),
		persistent: option.persistent ?? true,
	}))<ReplicantFieldOptions<Replicant, PermissionArg<DeclaredRoleName>>>(
		defineOption.replicant,
	);

	const computed = mapValues<
		FieldOptionLambda<ReadOnlyPermissionArg<DeclaredRoleName>>,
		FieldManifestFromOptionLambda
	>((option, name) => ({
		...implementCodec(name, option.schema),
		permission: computedPermission(
			resolve("computed-read", option.permission?.read),
			namespace,
			namedRoles,
		),
	}))<FieldOptions<Computed, ReadOnlyPermissionArg<DeclaredRoleName>>>(
		defineOption.computed,
	);

	const topic = mapValues<
		FieldOptionLambda<PermissionArg<DeclaredRoleName>>,
		FieldManifestFromOptionLambda
	>((option, name) => ({
		...implementCodec(name, option.schema),
		permission: topicPermission(
			resolve("topic-subscribe", option.permission?.read),
			resolve("topic-publish", option.permission?.write),
			namespace,
			namedRoles,
		),
	}))<FieldOptions<Topic, PermissionArg<DeclaredRoleName>>>(defineOption.topic);

	const rpc = mapRpcValues<
		RpcFieldOption<WriteOnlyPermissionArg<DeclaredRoleName>>,
		RpcFieldManifestFromSchemaLambda
	>()(defineOption.rpc, (option, name) => ({
		name,
		request: makeCodec(name, option.schema.request),
		response: makeCodec(name, option.schema.response),
		permission: rpcPermission(
			resolve("rpc-call", option.permission?.write),
			namespace,
			namedRoles,
		),
	}));

	const declaredRoutes: CustomRoute | undefined = defineOption.customRoute;
	const customRoute = mapNestedValues<
		CustomRouteMethodOption<WriteOnlyPermissionArg<DeclaredRoleName>>
	>()(declaredRoutes, (option, name) => ({
		name,
		permission: customRoutePermission(
			resolve("custom-route-request", option?.permission?.write),
			namespace,
			namedRoles,
		),
	}));

	return {
		namespace,
		roles: Record.map(
			// roles is undefined only when DeclaredRoleName is never
			defineOption.roles ?? ({} as Record<DeclaredRoleName, unknown>),
			(_, name) => ({ namespace, name }),
		),
		replicant,
		computed,
		topic,
		rpc,
		customRoute,
		children,
		[manifestRolesKey]: registry,
	};
}

/** extend **/

interface ExtendFieldOption<
	P extends PermissionArg<string> | ReadOnlyPermissionArg<string>,
> {
	readonly schema?: WidestFieldSchema;
	readonly permission?: P;
}

interface ExtendReplicantFieldOption<
	P extends PermissionArg<string>,
> extends ExtendFieldOption<P> {
	readonly persistent?: boolean;
}

interface ExtendRpcFieldOption<P extends WriteOnlyPermissionArg<string>> {
	readonly schema?: RpcSchemaPair;
	readonly permission?: P;
}

type Override<Precedent, Added> = Omit<Precedent, keyof Added> & Added;

type RedeclaredKeys<T, Existing> = {
	[K in keyof T as K extends Existing
		? K
		: never]: "Already declared by the precedent";
};

type AddedDecoded<In> = {
	readonly [K in keyof AddedSchemas<In>]: FieldDecoded<AddedSchemas<In>[K]>;
};

type AddedRpcDecoded<In> = {
	readonly [K in keyof AddedRpcSchemas<In>]: {
		readonly request: FieldDecoded<AddedRpcSchemas<In>[K]["request"]>;
		readonly response: FieldDecoded<AddedRpcSchemas<In>[K]["response"]>;
	};
};

export function extendNamespace<
	const PNamespace extends string,
	PReplicant extends Record<string, unknown>,
	PComputed extends Record<string, unknown>,
	PTopic extends Record<string, unknown>,
	PRpc extends WidestRpcFields,
	PRoleNames extends string,
	PCustomRoutes extends WidestCustomRoutes,
	PChildren extends WidestNamespaceManifests,
	const EReplicant extends Record<
		string,
		ExtendReplicantFieldOption<PermissionArg<string>>
	> = {},
	const EComputed extends Record<
		string,
		ExtendFieldOption<ReadOnlyPermissionArg<string>>
	> = {},
	const ETopic extends Record<
		string,
		ExtendFieldOption<PermissionArg<string>>
	> = {},
	const ERpc extends Record<
		string,
		ExtendRpcFieldOption<WriteOnlyPermissionArg<string>>
	> = {},
	const ERoleName extends string = never,
	const ECustomRoute extends WidestCustomRoutes = {},
	EChildren extends WidestNamespaceManifests = {},
>(
	manifest: NamespaceManifest<
		PNamespace,
		{
			replicant: PReplicant;
			computed: PComputed;
			topic: PTopic;
			rpc: PRpc;
			children: PChildren;
		},
		PRoleNames,
		PCustomRoutes
	>,
	extendOptionOrFn:
		| {
				readonly roles?: Record<
					ERoleName,
					RoleArg<ChildRole<NoInfer<PChildren & EChildren>>>
				>;
				readonly principals?: PrincipalsArg;
				readonly replicant?: EReplicant &
					UnsafeNameKeys<EReplicant> &
					CaseClashingKeys<EReplicant, keyof PReplicant & string>;
				readonly computed?: EComputed;
				readonly topic?: ETopic;
				readonly rpc?: ERpc;
				readonly customRoute?: ECustomRoute &
					UnsafeNameKeys<ECustomRoute> &
					CaseClashingKeys<ECustomRoute, keyof PCustomRoutes & string>;
				readonly children?: EChildren &
					RedeclaredKeys<EChildren, keyof PChildren>;
		  }
		| ((
				precedent: NamespaceManifest<
					PNamespace,
					{
						replicant: PReplicant;
						computed: PComputed;
						topic: PTopic;
						rpc: PRpc;
						children: PChildren;
					},
					PRoleNames,
					PCustomRoutes
				>,
		  ) => {
				readonly roles?: Record<
					ERoleName,
					RoleArg<ChildRole<NoInfer<PChildren & EChildren>>>
				>;
				readonly principals?: PrincipalsArg;
				readonly replicant?: EReplicant &
					UnsafeNameKeys<EReplicant> &
					CaseClashingKeys<EReplicant, keyof PReplicant & string>;
				readonly computed?: EComputed;
				readonly topic?: ETopic;
				readonly rpc?: ERpc;
				readonly customRoute?: ECustomRoute &
					UnsafeNameKeys<ECustomRoute> &
					CaseClashingKeys<ECustomRoute, keyof PCustomRoutes & string>;
				readonly children?: EChildren &
					RedeclaredKeys<EChildren, keyof PChildren>;
		  }),
): NamespaceManifest<
	PNamespace,
	{
		replicant: Override<PReplicant, AddedDecoded<EReplicant>>;
		computed: Override<PComputed, AddedDecoded<EComputed>>;
		topic: Override<PTopic, AddedDecoded<ETopic>>;
		rpc: Override<PRpc, AddedRpcDecoded<ERpc>>;
		children: Override<PChildren, EChildren>;
	},
	PRoleNames | ERoleName,
	MergedNestedKeys<PCustomRoutes, ECustomRoute>
> {
	type Extended = {
		replicant: Override<PReplicant, AddedDecoded<EReplicant>>;
		computed: Override<PComputed, AddedDecoded<EComputed>>;
		topic: Override<PTopic, AddedDecoded<ETopic>>;
		rpc: Override<PRpc, AddedRpcDecoded<ERpc>>;
		children: Override<PChildren, EChildren>;
	};
	type ExtendedManifest = NamespaceManifest<
		PNamespace,
		Extended,
		PRoleNames | ERoleName,
		MergedNestedKeys<PCustomRoutes, ECustomRoute>
	>;

	const extendOption =
		typeof extendOptionOrFn === "function"
			? extendOptionOrFn(manifest)
			: extendOptionOrFn;

	validateReplicantNames(
		manifest.namespace,
		extendOption.replicant,
		Object.keys(manifest.replicant),
	);
	validateCustomRouteNames(
		manifest.namespace,
		extendOption.customRoute,
		Object.keys(manifest.customRoute),
	);

	const children = mergeRecords<Override<PChildren, EChildren>>(
		manifest.children,
		extendOption.children,
	);

	const { registry, declared } = declareRoles(
		manifest[manifestRolesKey],
		extendOption.roles,
		extendOption.principals,
		children,
	);

	const namedRoles = new Set(registry.roles.keys());

	validatePermissionTokens("replicant", extendOption.replicant, registry.roles);
	validatePermissionTokens("computed", extendOption.computed, registry.roles);
	validatePermissionTokens("topic", extendOption.topic, registry.roles);
	validatePermissionTokens("rpc", extendOption.rpc, registry.roles);
	validateCustomRouteMethods(
		manifest.namespace,
		extendOption.customRoute,
		registry.roles,
	);

	const resolve = (
		capability: RoleCapability,
		rule: PermissionRuleArg<string> | undefined,
	) => resolveAccess(registry, declared, capability, undefined, rule);

	const remap = (
		capability: RoleCapability,
		precedent: Access,
		rule: PermissionRuleArg<string> | undefined,
	) => resolveAccess(registry, declared, capability, precedent, rule);

	const replicantRemap = mapValues<
		ReplicantFieldManifestLambda,
		ReplicantFieldManifestLambda
	>((field, name) => {
		const override = extendOption.replicant?.[name];
		return {
			name: field.name,
			decode: field.decode,
			encode: field.encode,
			mutableDecode: field.mutableDecode,
			permission: replicantPermission(
				remap(
					"replicant-read",
					field.permission.read,
					override?.permission?.read,
				),
				remap(
					"replicant-write",
					field.permission.write,
					override?.permission?.write,
				),
				manifest.namespace,
				namedRoles,
			),
			persistent: override?.persistent ?? field.persistent,
		};
	})(manifest.replicant);

	const replicantAdded = mapSchemaValues<
		ExtendReplicantFieldOption<PermissionArg<string>>,
		ReplicantFieldManifestLambda
	>()(extendOption.replicant, (option, name) => ({
		...implementCodec(name, option.schema),
		permission: replicantPermission(
			resolve("replicant-read", option.permission?.read),
			resolve("replicant-write", option.permission?.write),
			manifest.namespace,
			namedRoles,
		),
		persistent: option.persistent ?? true,
	}));
	const replicant = mergeRecords<ExtendedManifest["replicant"]>(
		replicantRemap,
		replicantAdded,
	);

	const computedRemap = mapValues<FieldManifestLambda, FieldManifestLambda>(
		(field, name) => {
			const override = extendOption.computed?.[name];
			return {
				name: field.name,
				decode: field.decode,
				encode: field.encode,
				mutableDecode: field.mutableDecode,
				permission: computedPermission(
					remap(
						"computed-read",
						field.permission.read,
						override?.permission?.read,
					),
					manifest.namespace,
					namedRoles,
				),
			};
		},
	)(manifest.computed);
	const computedAdded = mapSchemaValues<
		ExtendFieldOption<ReadOnlyPermissionArg<string>>,
		FieldManifestLambda
	>()(extendOption.computed, (option, name) => ({
		...implementCodec(name, option.schema),
		permission: computedPermission(
			resolve("computed-read", option.permission?.read),
			manifest.namespace,
			namedRoles,
		),
	}));
	const computed = mergeRecords<ExtendedManifest["computed"]>(
		computedRemap,
		computedAdded,
	);

	const topicRemap = mapValues<FieldManifestLambda, FieldManifestLambda>(
		(field, name) => {
			const override = extendOption.topic?.[name];
			return {
				name: field.name,
				encode: field.encode,
				decode: field.decode,
				mutableDecode: field.mutableDecode,
				permission: topicPermission(
					remap(
						"topic-subscribe",
						field.permission.read,
						override?.permission?.read,
					),
					remap(
						"topic-publish",
						field.permission.write,
						override?.permission?.write,
					),
					manifest.namespace,
					namedRoles,
				),
			};
		},
	)(manifest.topic);
	const topicAdded = mapSchemaValues<
		ExtendFieldOption<PermissionArg<string>>,
		FieldManifestLambda
	>()(extendOption.topic, (option, name) => ({
		...implementCodec(name, option.schema),
		permission: topicPermission(
			resolve("topic-subscribe", option.permission?.read),
			resolve("topic-publish", option.permission?.write),
			manifest.namespace,
			namedRoles,
		),
	}));
	const topic = mergeRecords<ExtendedManifest["topic"]>(topicRemap, topicAdded);

	const rpcRemap = mapValues<RpcFieldManifestLambda, RpcFieldManifestLambda>(
		(field, name) => {
			const override = extendOption.rpc?.[name];
			return {
				name: field.name,
				request: field.request,
				response: field.response,
				permission: rpcPermission(
					remap(
						"rpc-call",
						field.permission.write,
						override?.permission?.write,
					),
					manifest.namespace,
					namedRoles,
				),
			};
		},
	)(manifest.rpc);
	const rpcAdded = mapRpcValues<
		ExtendRpcFieldOption<WriteOnlyPermissionArg<string>>,
		RpcFieldManifestFromSchemaLambda
	>()(extendOption.rpc, (option, name) => ({
		name,
		request: makeCodec(name, option.schema.request),
		response: makeCodec(name, option.schema.response),
		permission: rpcPermission(
			resolve("rpc-call", option.permission?.write),
			manifest.namespace,
			namedRoles,
		),
	}));
	const rpc = mergeRecords<ExtendedManifest["rpc"]>(rpcRemap, rpcAdded);

	const addedRoutes: ECustomRoute | undefined = extendOption.customRoute;
	const customRoute = mergeNestedValues<
		CustomRouteMethodOption<WriteOnlyPermissionArg<string>>
	>()(manifest.customRoute, addedRoutes, (route, option, name) => ({
		name,
		permission: customRoutePermission(
			typeof route === "undefined"
				? resolve("custom-route-request", option?.permission?.write)
				: remap(
						"custom-route-request",
						route.permission.write,
						option?.permission?.write,
					),
			manifest.namespace,
			namedRoles,
		),
	}));

	return {
		namespace: manifest.namespace,
		roles: {
			...manifest.roles,
			...Record.map(
				// roles is undefined only when ERoleName is never
				extendOption.roles ?? ({} as Record<ERoleName, unknown>),
				(_, name) => ({ namespace: manifest.namespace, name }),
			),
		},
		replicant,
		computed,
		topic,
		rpc,
		customRoute,
		children,
		[manifestRolesKey]: registry,
	};
}
