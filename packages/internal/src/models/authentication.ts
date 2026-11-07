import { Schema } from "effect";

export const AuthenticationId = Schema.String.pipe(
	Schema.brand("AuthenticationId"),
);
export type AuthenticationId = typeof AuthenticationId.Type;

export const Authentication = Schema.Struct({
	issuer: Schema.String,
	subject: Schema.String,
});
export type Authentication = typeof Authentication.Type;
