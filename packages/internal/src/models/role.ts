import { Schema } from "effect";

import { PrincipalNameSchema } from "./principal.ts";

export const RoleName = Schema.String.pipe(Schema.brand("Role"));
export type RoleName = typeof RoleName.Type;

export const Role = Schema.Struct({
	namespace: Schema.String,
	name: RoleName,
});
export type Role = typeof Role.Type;

export const AdminRoleName = Schema.Literals(["admin", "superadmin"]);
export type AdminRoleName = typeof AdminRoleName.Type;

export const ADMIN_TIER: ReadonlySet<AdminRoleName> = new Set(
	AdminRoleName.literals,
);

export const GlobalRoleName = Schema.Union([AdminRoleName]);
export type GlobalRoleName = typeof GlobalRoleName.Type;

export const UndeclarableRoleName = Schema.Union([
	PrincipalNameSchema,
	AdminRoleName,
]);
export type UndeclarableRoleName = typeof UndeclarableRoleName.Type;

export const isUndeclarableRole = Schema.is(UndeclarableRoleName);
