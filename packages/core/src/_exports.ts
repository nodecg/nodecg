export {
	defineNamespace,
	extendNamespace,
	type CustomRouteMethod,
	type CustomRouteManifest,
	type WidestCustomRoutes,
	type FieldManifest,
	type ReplicantFieldManifest,
	type WidestChildManifests,
	type RpcFieldManifest,
	type NamespaceManifest,
	type EmptyNamespaceFields,
	type WidestNamespaceFields,
	type WidestRpcField,
	type WidestRpcFields,
} from "./define-namespace.ts";
export {
	FieldDecodeError,
	FieldEncodeError,
	type FieldCodec,
} from "./field-codec.ts";
export { jsonSchema } from "./json-schema.ts";
export {
	getRolesForNamespace,
	isAdminTier,
	isSuperadmin,
	type Access,
	type Grant,
	type NamespaceRole,
	type RoleArg,
	type RoleCapability,
	type ResolvedPermission,
} from "./role.ts";
