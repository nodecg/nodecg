import { Schema } from "effect";

import { ServiceAccount } from "./service-account.ts";
import { User } from "./user.ts";

export const AnonymousIdentitySchema = Schema.TaggedStruct("anonymous", {});

export const ServerIdentity = Schema.TaggedStruct("server", {});
export type ServerIdentity = typeof ServerIdentity.Type;

export const Identity = Schema.Union([
	AnonymousIdentitySchema,
	User,
	ServiceAccount,
	ServerIdentity,
]);
export type Identity = typeof Identity.Type;
