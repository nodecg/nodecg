import { Schema } from "effect";

import { GlobalRoleName, Role } from "./role.ts";

export const ServiceAccountId = Schema.String.check(Schema.isUUID()).pipe(
	Schema.brand("ServiceAccountId"),
);
export type ServiceAccountId = typeof ServiceAccountId.Type;

export const ServiceAccount = Schema.TaggedStruct("serviceAccount", {
	id: ServiceAccountId,
	displayName: Schema.String,
	roles: Schema.Array(Role),
	globalRoles: Schema.Array(GlobalRoleName),
});
export type ServiceAccount = typeof ServiceAccount.Type;
