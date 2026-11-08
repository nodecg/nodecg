import { Schema } from "effect";

import { AuthenticationId } from "./authentication.ts";

export const UserSessionId = Schema.String.pipe(Schema.brand("UserSessionId"));
export type UserSessionId = typeof UserSessionId.Type;

export const UserSession = Schema.Struct({
	id: UserSessionId,
	authenticationId: AuthenticationId,
	expiresAt: Schema.DateTimeUtcFromString,
});
export type UserSession = typeof UserSession.Type;
