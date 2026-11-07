import { Schema } from "effect";

import { Authentication } from "./authentication.ts";
import { GlobalRoleName, Role } from "./role.ts";

export const UserId = Schema.String.pipe(Schema.brand("UserId"));
export type UserId = typeof UserId.Type;

export const User = Schema.TaggedStruct("user", {
	id: UserId,
	authentication: Authentication,
	displayName: Schema.String,
	roles: Schema.Array(Role),
	globalRoles: Schema.Array(GlobalRoleName),
});
export type User = typeof User.Type;
