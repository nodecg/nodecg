import { Schema } from "effect";
import {
	HttpApi,
	HttpApiEndpoint,
	HttpApiError,
	HttpApiGroup,
	HttpApiSchema,
} from "effect/http-api";

import {
	AdminTierMiddleware,
	UserAuthenticationMiddleware,
	SuperadminMiddleware,
} from "../auth.ts";
import { Authentication } from "../models/authentication.ts";
import { Identity } from "../models/identity.ts";
import {
	AdminRoleName,
	GlobalRoleName,
	isUndeclarableRole,
	Role,
	RoleNameSchema,
} from "../models/role.ts";
import { ServiceAccountId } from "../models/service-account.ts";
import { UserId } from "../models/user.ts";
import { MalformedUrl } from "../utils/relative-url.ts";
import { fieldGroup } from "./shared.ts";

export class TooManyRequests extends Schema.TaggedError<TooManyRequests>()(
	"TooManyRequests",
	{ message: Schema.String },
) {}

export class SuperadminRevokeRefused extends Schema.TaggedError<SuperadminRevokeRefused>()(
	"SuperadminRevokeRefused",
	{
		userId: UserId,
		authentication: Authentication,
		message: Schema.String,
	},
) {}

const NamespacePermissionsSchema = Schema.Struct({
	roles: Schema.Array(RoleNameSchema),
});
export const MePayload = Schema.Struct({
	identity: Identity,
	namespaces: Schema.Record(Schema.String, NamespacePermissionsSchema),
});
export type MePayload = typeof MePayload.Type;

export const LoginProvider = Schema.Struct({
	name: Schema.String,
	url: Schema.URLFromString,
});
export type LoginProvider = typeof LoginProvider.Type;

const ClaimSuperadminRequestSchema = Schema.Struct({
	token: Schema.Redacted(Schema.String),
});

const ReturnToSchema = Schema.String.check(
	Schema.isPattern(/^\/(?![/\\])/, {
		description: "a same-origin relative path",
	}),
);

const AuthenticationGroup = HttpApiGroup.make("Authentication")
	.add(HttpApiEndpoint.get("me", "/me", { success: MePayload }))
	.add(
		HttpApiEndpoint.get("providers", "/authentication/providers", {
			success: Schema.Array(LoginProvider),
			error: MalformedUrl.pipe(HttpApiSchema.status(400)),
		}),
	)
	.add(
		HttpApiEndpoint.get("login", "/authentication/login/:provider", {
			params: { provider: Schema.String },
			query: { returnTo: Schema.optional(ReturnToSchema) },
			success: HttpApiSchema.Empty(302),
			error: [
				HttpApiError.InternalServerError,
				MalformedUrl.pipe(HttpApiSchema.status(400)),
			],
		}),
	)
	.add(
		HttpApiEndpoint.get("callback", "/authentication/callback/:provider", {
			params: { provider: Schema.String },
			success: HttpApiSchema.Empty(302),
			error: [
				HttpApiError.InternalServerError,
				MalformedUrl.pipe(HttpApiSchema.status(400)),
			],
		}),
	)
	.add(
		HttpApiEndpoint.post("logout", "/authentication/logout", {
			success: HttpApiSchema.Empty(204),
			error: HttpApiError.InternalServerError,
		}),
	)
	.add(
		HttpApiEndpoint.post(
			"claimSuperadmin",
			"/authentication/claim-superadmin",
			{
				payload: ClaimSuperadminRequestSchema,
				success: HttpApiSchema.Empty(204),
				error: [
					HttpApiError.Unauthorized,
					HttpApiError.Forbidden,
					TooManyRequests.pipe(HttpApiSchema.status(429)),
				],
			},
		),
	);

const DeclarableRoleName = RoleNameSchema.check(
	Schema.makeFilter((name) =>
		isUndeclarableRole(name) ? `role "${name}" cannot be assigned` : undefined,
	),
);

const DeclarableRole = Schema.Struct({
	namespace: Schema.String,
	name: DeclarableRoleName,
});

export const UserDocumentEntry = Schema.TaggedStruct("user", {
	authentication: Authentication,
	displayName: Schema.String,
	roles: Schema.Array(DeclarableRole),
	globalRoles: Schema.Tuple([]),
});
export type UserDocumentEntry = typeof UserDocumentEntry.Type;

export const ServiceAccountDocumentEntry = Schema.TaggedStruct(
	"serviceAccount",
	{
		id: ServiceAccountId,
		displayName: Schema.String,
		roles: Schema.Array(DeclarableRole),
		globalRoles: Schema.Tuple([]),
	},
);
export type ServiceAccountDocumentEntry =
	typeof ServiceAccountDocumentEntry.Type;

export const RoleAssignmentsDocument = Schema.Struct({
	version: Schema.Literal(0),
	assignments: Schema.Array(
		Schema.Union([UserDocumentEntry, ServiceAccountDocumentEntry]),
	),
});
export type RoleAssignmentsDocument = typeof RoleAssignmentsDocument.Type;

const ImportAssignmentsRequestSchema = Schema.Struct({
	mode: Schema.Literals(["replace", "merge"]),
	document: RoleAssignmentsDocument,
});

const CreateApiKeyRequestSchema = Schema.Struct({
	displayName: Schema.String,
});

export const CreateApiKeyResultSchema = Schema.Struct({
	serviceAccountId: ServiceAccountId,
	displayName: Schema.String,
	token: Schema.Redacted(Schema.String),
});

const ServiceAccountSchema = Schema.Struct({
	id: Schema.String,
	displayName: Schema.String,
	roles: Schema.Array(Role),
	globalRoles: Schema.Array(GlobalRoleName),
});

const ListServiceAccountsResultSchema = Schema.Struct({
	serviceAccounts: Schema.Array(ServiceAccountSchema),
});

const ServiceAccountsGroup = HttpApiGroup.make("ServiceAccounts")
	.add(
		HttpApiEndpoint.post("createApiKey", "/service-accounts", {
			payload: CreateApiKeyRequestSchema,
			success: CreateApiKeyResultSchema,
		}),
	)
	.add(
		HttpApiEndpoint.get("list", "/service-accounts", {
			success: ListServiceAccountsResultSchema,
		}),
	)
	.add(
		HttpApiEndpoint.delete("delete", "/service-accounts/:id", {
			params: { id: ServiceAccountId },
			success: HttpApiSchema.Empty(204),
			error: HttpApiError.NotFound,
		}),
	)
	.add(
		HttpApiEndpoint.post("refresh", "/service-accounts/:id/refresh", {
			params: { id: ServiceAccountId },
			success: CreateApiKeyResultSchema,
			error: HttpApiError.NotFound,
		}),
	)
	.add(
		HttpApiEndpoint.post("grantRole", "/service-accounts/:id/roles/grant", {
			params: { id: ServiceAccountId },
			payload: DeclarableRole,
			success: HttpApiSchema.Empty(204),
			error: [HttpApiError.NotFound, HttpApiError.UnprocessableEntity],
		}),
	)
	.add(
		HttpApiEndpoint.post("revokeRole", "/service-accounts/:id/roles/revoke", {
			params: { id: ServiceAccountId },
			payload: DeclarableRole,
			success: HttpApiSchema.Empty(204),
			error: HttpApiError.NotFound,
		}),
	)
	.middleware(AdminTierMiddleware);

const UserSchema = Schema.Struct({
	id: UserId,
	displayName: Schema.String,
	authentications: Schema.Array(Authentication),
	roles: Schema.Array(Role),
	globalRoles: Schema.Array(GlobalRoleName),
});

const AdminRole = Schema.Struct({ name: AdminRoleName });

const ListUsersResult = Schema.Struct({
	users: Schema.Array(UserSchema),
});
type ListUsersResult = typeof ListUsersResult.Type;

const UsersGroup = HttpApiGroup.make("Users")
	.add(
		HttpApiEndpoint.get("list", "/users", {
			success: ListUsersResult,
		}),
	)
	.add(
		HttpApiEndpoint.post("grantRole", "/users/:id/roles/grant", {
			params: { id: UserId },
			payload: DeclarableRole,
			success: HttpApiSchema.Empty(204),
			error: [HttpApiError.NotFound, HttpApiError.UnprocessableEntity],
		}),
	)
	.add(
		HttpApiEndpoint.post("revokeRole", "/users/:id/roles/revoke", {
			params: { id: UserId },
			payload: DeclarableRole,
			success: HttpApiSchema.Empty(204),
			error: HttpApiError.NotFound,
		}),
	)
	.middleware(AdminTierMiddleware)
	.add(
		HttpApiEndpoint.post("grantAdminRole", "/users/:id/admin-roles/grant", {
			params: { id: UserId },
			payload: AdminRole,
			success: HttpApiSchema.Empty(204),
			error: HttpApiError.NotFound,
		}).middleware(SuperadminMiddleware),
	)
	.add(
		HttpApiEndpoint.post("revokeAdminRole", "/users/:id/admin-roles/revoke", {
			params: { id: UserId },
			payload: AdminRole,
			success: HttpApiSchema.Empty(204),
			error: [
				HttpApiError.NotFound,
				SuperadminRevokeRefused.pipe(HttpApiSchema.status(422)),
			],
		}).middleware(SuperadminMiddleware),
	);

const RolesGroup = HttpApiGroup.make("Roles")
	.add(
		HttpApiEndpoint.get("export", "/roles/export", {
			success: RoleAssignmentsDocument,
		}),
	)
	.add(
		HttpApiEndpoint.post("import", "/roles/import", {
			payload: ImportAssignmentsRequestSchema,
			success: HttpApiSchema.Empty(204),
		}),
	)
	.middleware(AdminTierMiddleware);

export const TelemetrySignal = Schema.Literals(["traces", "logs", "metrics"]);

const TelemetryStatus = Schema.Option(
	Schema.Struct({
		serviceName: Schema.String,
		signals: Schema.Array(TelemetrySignal),
		compression: Schema.Record(
			TelemetrySignal,
			Schema.Literals(["gzip", "none"]),
		),
		exportIntervals: Schema.Record(
			TelemetrySignal,
			Schema.Option(Schema.DurationFromMillis),
		),
		maxBatchSizes: Schema.Struct({
			traces: Schema.Option(Schema.Int),
			logs: Schema.Option(Schema.Int),
		}),
		metricsTemporality: Schema.Literals(["cumulative", "delta"]),
		resourceAttributes: Schema.Record(Schema.String, Schema.String),
	}),
);

const TelemetryGroup = HttpApiGroup.make("Telemetry").add(
	HttpApiEndpoint.get("status", "/telemetry", { success: TelemetryStatus }),
);

export const InternalApi = HttpApi.make("InternalApi")
	.add(fieldGroup("Field"))
	.add(AuthenticationGroup)
	.add(ServiceAccountsGroup)
	.add(UsersGroup)
	.add(RolesGroup)
	.add(TelemetryGroup)
	.middleware(UserAuthenticationMiddleware)
	.prefix("/api/internal");
