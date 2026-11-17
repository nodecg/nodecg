import {
	type CaseClashingKeys,
	DeclarablePrincipalNameSchema,
	type FileSafeName,
	findCaseClash,
	formatNamespacePath,
	isFileSafeName,
	isUndeclarableRole,
	manifestRolesKey,
	PRINCIPAL,
	RoleName,
	UndeniablePrincipalNameSchema,
	type Principal,
	type UndeclarableRoleName,
	type UnsafeNameKeys,
	type ValidateFileSafeName,
} from "@nodecg/internal";
import {
	mapNestedValues,
	mapValues,
	type NestedValues,
} from "@nodecg/internal/utils";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import { Array, type HKT, Option, pipe, Record, Schema, String } from "effect";
import { HttpMethod } from "effect/http";

import { makeCodec, type FieldCodec } from "./field-codec.ts";
import {
	RoleReference,
	type PermissionArg,
	type PrincipalManifest,
	type PrincipalsArg,
	type PermissionRuleArg,
	type ReadOnlyPermissionArg,
	type RoleCapability,
	type RoleManifest,
	type RoleRegistry,
	type WriteOnlyPermissionArg,
} from "./role.ts";

export interface ReplicantFieldManifest<D> extends FieldCodec<D> {
	readonly permission?: PermissionArg<string>;
	readonly persistent: boolean;
}

export interface ComputedFieldManifest<D> extends FieldCodec<D> {
	readonly permission?: ReadOnlyPermissionArg<string>;
}

export interface TopicFieldManifest<D> extends FieldCodec<D> {
	readonly permission?: PermissionArg<string>;
}

export interface RpcFieldManifest<Request, Response> {
	readonly request: FieldCodec<Request>;
	readonly response: FieldCodec<Response>;
	readonly permission?: WriteOnlyPermissionArg<string>;
}

type HttpMethodKey = Lowercase<Exclude<HttpMethod.HttpMethod, "TRACE">>;

export type CustomRouteMethod = HttpMethodKey | "*";

export interface CustomRouteManifest {
	readonly name: string;
	readonly permission?: WriteOnlyPermissionArg<string>;
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
	readonly roles: ReadonlySet<RoleNames>;

	readonly replicant: {
		[K in keyof S["replicant"] & string]: ReplicantFieldManifest<
			S["replicant"][K]
		>;
	};
	readonly computed: {
		[K in keyof S["computed"] & string]: ComputedFieldManifest<
			S["computed"][K]
		>;
	};
	readonly topic: {
		[K in keyof S["topic"] & string]: TopicFieldManifest<S["topic"][K]>;
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

type ChildRoleTree<Children extends WidestNamespaceManifests> = {
	readonly [K in keyof Children]: {
		readonly roles: {
			readonly [Name in Children[K]["roles"] extends ReadonlySet<
				infer RoleNames extends string
			>
				? RoleNames
				: never]: RoleReference;
		};
		readonly children: ChildRoleTree<Children[K]["children"]>;
	};
};

export interface RoleArg<Children extends WidestNamespaceManifests> {
	readonly description?: string;
	readonly permission: ReadonlyArray<RoleCapability>;
	linkRoles?(children: ChildRoleTree<Children>): ReadonlyArray<RoleReference>;
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

type WidestFieldSchema =
	| Schema.Codec<any, any>
	| StandardSchemaV1<unknown, unknown>;

type RpcSchemaPair = {
	readonly request: WidestFieldSchema;
	readonly response: WidestFieldSchema;
};

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

type FieldOptionSchema<FieldArg> =
	FieldArg extends FieldOption<
		infer S extends WidestFieldSchema,
		PermissionArg<string> | ReadOnlyPermissionArg<string>
	>
		? S
		: never;

// Target the field option, not its schema, since the mapValues calls below fail to type-check with a schema target.
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
interface FieldOptionLambda<
	P extends PermissionArg<string> | ReadOnlyPermissionArg<string>,
>
	extends HKT.TypeLambda {
	readonly Target: FieldOption<WidestFieldSchema, P>;
	readonly type: this["Target"];
}
interface ComputedFieldManifestFromOptionLambda extends HKT.TypeLambda {
	readonly type: ComputedFieldManifest<
		FieldDecoded<FieldOptionSchema<this["Target"]>>
	>;
}
interface TopicFieldManifestFromOptionLambda extends HKT.TypeLambda {
	readonly type: TopicFieldManifest<
		FieldDecoded<FieldOptionSchema<this["Target"]>>
	>;
}

interface RpcFieldOption<P extends WriteOnlyPermissionArg<string>> {
	readonly schema: RpcSchemaPair;
	readonly permission?: P;
}

type JsonEncodableRpc<
	Rpc extends Record<string, { readonly schema: RpcSchemaPair }>,
> = {
	readonly [K in keyof Rpc]: {
		readonly schema: {
			readonly request: JsonEncodable<Rpc[K]["schema"]["request"]>;
			readonly response: JsonEncodable<Rpc[K]["schema"]["response"]>;
		};
	};
};

type RpcOptionSchema<RpcArg> = RpcArg extends {
	readonly schema: infer S extends RpcSchemaPair;
}
	? S
	: never;

interface RpcFieldOptionLambda<P extends WriteOnlyPermissionArg<string>>
	extends HKT.TypeLambda {
	readonly Target: RpcFieldOption<P>;
	readonly type: this["Target"];
}
interface RpcFieldManifestFromOptionLambda extends HKT.TypeLambda {
	readonly type: RpcFieldManifest<
		FieldDecoded<RpcOptionSchema<this["Target"]>["request"]>,
		FieldDecoded<RpcOptionSchema<this["Target"]>["response"]>
	>;
}

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

class UnsafeName extends Schema.TaggedError<UnsafeName>()("UnsafeName", {
	namespace: Schema.String,
	key: Schema.String,
}) {
	override readonly message = `"${this.key}" in "${this.namespace}" must use only A-Z, a-z, 0-9, "_" and "-", and not be a Windows device name`;
}

class NameCaseClash extends Schema.TaggedError<NameCaseClash>()(
	"NameCaseClash",
	{ namespace: Schema.String, key: Schema.String, clash: Schema.String },
) {
	override readonly message = `"${this.key}" in "${this.namespace}" differs from "${this.clash}" only in case`;
}

const findInvalidName = (
	namespace: string,
	record: Readonly<Record<string, unknown>> | undefined,
) => {
	const keys = Object.keys(record ?? {});
	return Option.fromNullishOr(keys.find((key) => !isFileSafeName(key))).pipe(
		Option.map((key) => UnsafeName.make({ namespace, key })),
		Option.orElse(() =>
			findCaseClash(keys).pipe(
				Option.map(({ name, clash }) =>
					NameCaseClash.make({ namespace, key: name, clash }),
				),
			),
		),
	);
};

const isCustomRouteMethod = Schema.is(
	Schema.Literals([
		"*",
		...pipe(
			Array.fromIterable(HttpMethod.all),
			Array.filter((method) => method !== "TRACE"),
			Array.map((method) => String.toLowerCase(method)),
		),
	]),
);

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

const buildRoleTree = (
	children: WidestNamespaceManifests,
	path: FileSafeName[],
): ChildRoleTree<WidestNamespaceManifests> =>
	Record.map(children, (child, key) => {
		const childPath = Array.append(path, key);
		return {
			roles: Record.fromIterableWith(child.roles, (name) => [
				name,
				RoleReference.make({ children: childPath, name }),
			]),
			children: buildRoleTree(child.children, childPath),
		};
	});

const findDescendant = (
	children: WidestNamespaceManifests,
	path: Array.NonEmptyReadonlyArray<FileSafeName>,
) => {
	const [head, ...rest] = path;
	let target = Record.get(children, head);
	for (const key of rest) {
		if (Option.isNone(target)) {
			return target;
		}
		const nextLevel: WidestNamespaceManifests = target.value.children;
		target = Record.get(nextLevel, key);
	}
	return target;
};

const declareRoles = (
	named:
		| Readonly<Record<string, RoleArg<WidestNamespaceManifests> | undefined>>
		| undefined,
	overrides: PrincipalsArg | undefined,
	children: WidestNamespaceManifests,
): RoleRegistry => {
	const roles = new Map<RoleName, RoleManifest>();
	const principals = new Map<Principal, PrincipalManifest>();

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
	}

	// Resolve roles
	const roleTree = buildRoleTree(children, []);
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
		const linkedRoles = arg.linkRoles?.(roleTree).map((role) => {
			if (
				!Option.exists(findDescendant(children, role.children), (child) =>
					child.roles.has(role.name),
				)
			) {
				throw new Error(
					`Role "${key}" links to unknown role "${role.name}" of child "${formatNamespacePath(role.children)}"`,
				);
			}
			return role;
		});
		roles.set(roleName, {
			name: roleName,
			description: arg.description,
			capabilities: new Set(arg.permission),
			linkedRoles: linkedRoles ?? [],
		});
	}

	return { roles, principals };
};

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
	namespace: ValidateFileSafeName<Namespace>,
	defineOption: {
		roles?: Record<DeclaredRoleName, RoleArg<NoInfer<Children>>> & {
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
		rpc?: Rpc & JsonEncodableRpc<Rpc>;
		customRoute?: CustomRoute &
			UnsafeNameKeys<CustomRoute> &
			CaseClashingKeys<CustomRoute>;
		children?: Children & UnsafeNameKeys<Children> & CaseClashingKeys<Children>;
	},
): NamespaceManifest<
	ValidateFileSafeName<Namespace>,
	{
		replicant: { [K in keyof Replicant]: FieldDecoded<Replicant[K]> };
		computed: { [K in keyof Computed]: FieldDecoded<Computed[K]> };
		topic: { [K in keyof Topic]: FieldDecoded<Topic[K]> };
		rpc: {
			[K in keyof Rpc]: {
				readonly request: FieldDecoded<Rpc[K]["schema"]["request"]>;
				readonly response: FieldDecoded<Rpc[K]["schema"]["response"]>;
			};
		};
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

	const invalidReplicant = findInvalidName(namespace, defineOption.replicant);
	if (Option.isSome(invalidReplicant)) {
		throw invalidReplicant.value;
	}
	const invalidCustomRoute = findInvalidName(
		namespace,
		defineOption.customRoute,
	);
	if (Option.isSome(invalidCustomRoute)) {
		throw invalidCustomRoute.value;
	}
	const invalidChild = findInvalidName(namespace, defineOption.children);
	if (Option.isSome(invalidChild)) {
		throw invalidChild.value;
	}

	const children = defineOption.children ?? ({} as Children);

	const registry = declareRoles(
		defineOption.roles,
		defineOption.principals,
		children,
	);

	validatePermissionTokens("replicant", defineOption.replicant, registry.roles);
	validatePermissionTokens("computed", defineOption.computed, registry.roles);
	validatePermissionTokens("topic", defineOption.topic, registry.roles);
	validatePermissionTokens("rpc", defineOption.rpc, registry.roles);
	validateCustomRouteMethods(
		namespace,
		defineOption.customRoute,
		registry.roles,
	);

	const replicant = mapValues<
		ReplicantFieldOptionLambda<PermissionArg<DeclaredRoleName>>,
		ReplicantFieldManifestFromOptionLambda
	>((option, name) => ({
		...makeCodec(name, option.schema),
		permission: option.permission,
		persistent: option.persistent ?? true,
	}))<ReplicantFieldOptions<Replicant, PermissionArg<DeclaredRoleName>>>(
		defineOption.replicant,
	);

	const computed = mapValues<
		FieldOptionLambda<ReadOnlyPermissionArg<DeclaredRoleName>>,
		ComputedFieldManifestFromOptionLambda
	>((option, name) => ({
		...makeCodec(name, option.schema),
		permission: option.permission,
	}))<FieldOptions<Computed, ReadOnlyPermissionArg<DeclaredRoleName>>>(
		defineOption.computed,
	);

	const topic = mapValues<
		FieldOptionLambda<PermissionArg<DeclaredRoleName>>,
		TopicFieldManifestFromOptionLambda
	>((option, name) => ({
		...makeCodec(name, option.schema),
		permission: option.permission,
	}))<FieldOptions<Topic, PermissionArg<DeclaredRoleName>>>(defineOption.topic);

	const rpc = mapValues<
		RpcFieldOptionLambda<WriteOnlyPermissionArg<DeclaredRoleName>>,
		RpcFieldManifestFromOptionLambda
	>((option, name) => ({
		request: makeCodec(name, option.schema.request),
		response: makeCodec(name, option.schema.response),
		permission: option.permission,
	}))<Rpc>(defineOption.rpc);

	const declaredRoutes: CustomRoute | undefined = defineOption.customRoute;
	const customRoute = mapNestedValues<
		CustomRouteMethodOption<WriteOnlyPermissionArg<DeclaredRoleName>>
	>()(declaredRoutes, (option, name) => ({
		name,
		permission: option?.permission,
	}));

	return {
		namespace,
		roles: new Set(
			Record.keys(
				// roles is undefined only when DeclaredRoleName is never
				defineOption.roles ?? ({} as Record<DeclaredRoleName, unknown>),
			),
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
