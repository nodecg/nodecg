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
	bigint,
	pgTable,
	primaryKey,
	text,
	unique,
	uuid,
} from "drizzle-orm/pg-core";
import { Schema } from "effect";

export const AccountId = Schema.String.pipe(Schema.brand("AccountId"));
export type AccountId = typeof AccountId.Type;

export const loginAttempts = pgTable("login_attempts", {
	key: text("key").primaryKey(),
	provider: text("provider").notNull(),
	state: text("state").notNull(),
	codeVerifier: text("code_verifier"),
	nonce: text("nonce"),
	returnTo: text("return_to"),
	expiresAt: bigint("expires_at", { mode: "number" }).notNull(),
});

export const accounts = pgTable("accounts", {
	id: uuid("id").$type<AccountId>().primaryKey().defaultRandom(),
	displayName: text("display_name").notNull(),
	createdAt: bigint("created_at", { mode: "number" }).notNull(),
});

export const users = pgTable("users", {
	id: uuid("id").$type<UserId>().primaryKey().defaultRandom(),
	accountId: uuid("account_id")
		.$type<AccountId>()
		.notNull()
		.unique()
		.references(() => accounts.id, { onDelete: "cascade" }),
});

export const authentications = pgTable(
	"authentications",
	{
		id: uuid("id").$type<AuthenticationId>().primaryKey().defaultRandom(),
		userId: uuid("user_id")
			.$type<UserId>()
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		issuer: text("issuer").notNull(),
		subject: text("subject").notNull(),
	},
	(table) => [unique().on(table.issuer, table.subject)],
);

export const sessions = pgTable("sessions", {
	id: text("id").$type<UserSessionId>().primaryKey(),
	authenticationId: uuid("authentication_id")
		.$type<AuthenticationId>()
		.notNull()
		.references(() => authentications.id, { onDelete: "cascade" }),
	expiresAt: bigint("expires_at", { mode: "number" }).notNull(),
});

export const serviceAccounts = pgTable("service_accounts", {
	id: uuid("id").$type<ServiceAccountId>().primaryKey(),
	accountId: uuid("account_id")
		.$type<AccountId>()
		.notNull()
		.unique()
		.references(() => accounts.id, { onDelete: "cascade" }),
	createdBy: uuid("created_by")
		.$type<UserId>()
		.references(() => users.id, { onDelete: "set null" }),
});

export const apiKeys = pgTable("api_keys", {
	id: uuid("id").$type<ApiKeyId>().primaryKey(),
	serviceAccountId: uuid("service_account_id")
		.$type<ServiceAccountId>()
		.notNull()
		.references(() => serviceAccounts.id, { onDelete: "cascade" }),
	keyHash: text("key_hash").notNull().unique(),
	label: text("label").notNull(),
	createdAt: bigint("created_at", { mode: "number" }).notNull(),
	expiresAt: bigint("expires_at", { mode: "number" }),
});

export const roleGrants = pgTable(
	"role_grants",
	{
		accountId: uuid("account_id")
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

export const globalRoleGrants = pgTable(
	"global_role_grants",
	{
		accountId: uuid("account_id")
			.$type<AccountId>()
			.notNull()
			.references(() => accounts.id, { onDelete: "cascade" }),
		roleName: text("role_name").$type<GlobalRoleName>().notNull(),
	},
	(table) => [primaryKey({ columns: [table.accountId, table.roleName] })],
);
