import type {
	ApiKeyId,
	AuthenticationId,
	GlobalRoleName,
	RoleName,
	ServiceAccountId,
	UserId,
	UserSessionId,
} from "@nodecg-next/internal";
import {
	integer,
	primaryKey,
	sqliteTable,
	text,
	unique,
} from "drizzle-orm/sqlite-core";
import { Schema } from "effect";

export const AccountId = Schema.String.pipe(Schema.brand("AccountId"));
export type AccountId = typeof AccountId.Type;

export const loginAttempts = sqliteTable("login_attempts", {
	key: text("key").primaryKey(),
	provider: text("provider").notNull(),
	state: text("state").notNull(),
	codeVerifier: text("code_verifier"),
	nonce: text("nonce"),
	returnTo: text("return_to"),
	expiresAt: integer("expires_at").notNull(),
});

export const accounts = sqliteTable("accounts", {
	id: text("id").$type<AccountId>().primaryKey(),
	displayName: text("display_name").notNull(),
	createdAt: integer("created_at").notNull(),
});

export const users = sqliteTable("users", {
	id: text("id").$type<UserId>().primaryKey(),
	accountId: text("account_id")
		.$type<AccountId>()
		.notNull()
		.unique()
		.references(() => accounts.id, { onDelete: "cascade" }),
});

export const authentications = sqliteTable(
	"authentications",
	{
		id: text("id").$type<AuthenticationId>().primaryKey(),
		userId: text("user_id")
			.$type<UserId>()
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		issuer: text("issuer").notNull(),
		subject: text("subject").notNull(),
	},
	(table) => [unique().on(table.issuer, table.subject)],
);

export const sessions = sqliteTable("sessions", {
	id: text("id").$type<UserSessionId>().primaryKey(),
	authenticationId: text("authentication_id")
		.$type<AuthenticationId>()
		.notNull()
		.references(() => authentications.id, { onDelete: "cascade" }),
	expiresAt: integer("expires_at").notNull(),
});

export const serviceAccounts = sqliteTable("service_accounts", {
	id: text("id").$type<ServiceAccountId>().primaryKey(),
	accountId: text("account_id")
		.$type<AccountId>()
		.notNull()
		.unique()
		.references(() => accounts.id, { onDelete: "cascade" }),
	createdBy: text("created_by")
		.$type<UserId>()
		.references(() => users.id, { onDelete: "set null" }),
});

export const apiKeys = sqliteTable("api_keys", {
	id: text("id").$type<ApiKeyId>().primaryKey(),
	serviceAccountId: text("service_account_id")
		.$type<ServiceAccountId>()
		.notNull()
		.references(() => serviceAccounts.id, { onDelete: "cascade" }),
	keyHash: text("key_hash").notNull().unique(),
	label: text("label").notNull(),
	createdAt: integer("created_at").notNull(),
	expiresAt: integer("expires_at"),
});

export const roleGrants = sqliteTable(
	"role_grants",
	{
		accountId: text("account_id")
			.$type<AccountId>()
			.notNull()
			.references(() => accounts.id, { onDelete: "cascade" }),
		namespace: text("namespace").notNull(),
		roleName: text("role_name").$type<RoleName>().notNull(),
	},
	(table) => [
		primaryKey({
			columns: [table.accountId, table.namespace, table.roleName],
		}),
	],
);

export const globalRoleGrants = sqliteTable(
	"global_role_grants",
	{
		accountId: text("account_id")
			.$type<AccountId>()
			.notNull()
			.references(() => accounts.id, { onDelete: "cascade" }),
		roleName: text("role_name").$type<GlobalRoleName>().notNull(),
	},
	(table) => [primaryKey({ columns: [table.accountId, table.roleName] })],
);
