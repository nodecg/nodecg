import type { LoginAttempt, Authentication } from "@nodecg-next/internal";
import {
	Context,
	type Effect,
	HashMap,
	type PlatformError,
	Schema,
} from "effect";
import type { Digest } from "effect/crypto";
import type { HttpClient } from "effect/http";

export class ProviderStateMismatch extends Schema.TaggedError<ProviderStateMismatch>()(
	"ProviderStateMismatch",
	{},
) {
	override readonly message = `OAuth state mismatch`;
}

export class ProviderUnavailableError extends Schema.TaggedError<ProviderUnavailableError>()(
	"ProviderUnavailableError",
	{ provider: Schema.String, cause: Schema.Unknown },
) {
	override readonly message = `Discovery failed for authentication provider "${this.provider}"`;
}

export class CredentialExchangeError extends Schema.TaggedError<CredentialExchangeError>()(
	"CredentialExchangeError",
	{ provider: Schema.String, cause: Schema.Unknown },
) {
	override readonly message = `Token exchange failed for authentication provider "${this.provider}"`;
}

export class NoIdentity extends Schema.TaggedError<NoIdentity>()("NoIdentity", {
	provider: Schema.String,
}) {
	override readonly message = `Authentication provider "${this.provider}" returned no usable identity claims`;
}

export class ProviderResponseError extends Schema.TaggedError<ProviderResponseError>()(
	"ProviderResponseError",
	{ provider: Schema.String, cause: Schema.Unknown },
) {
	override readonly message = `Userinfo request failed for authentication provider "${this.provider}"`;
}

export type AuthorizeError =
	| ProviderUnavailableError
	| PlatformError.PlatformError;
export type CallbackError =
	| ProviderStateMismatch
	| ProviderUnavailableError
	| CredentialExchangeError
	| ProviderResponseError
	| NoIdentity;

export interface AuthProvider {
	readonly name: string;
	readonly issuer: string;
	readonly authorize: (input: {
		readonly redirectUri: string;
		readonly searchParams: URLSearchParams;
	}) => Effect.Effect<
		{
			readonly url: string;
			readonly loginAttempt: Omit<LoginAttempt, "returnTo">;
		},
		AuthorizeError,
		Digest.Digest
	>;
	readonly callback: (input: {
		readonly redirectUri: string;
		readonly searchParams: URLSearchParams;
		readonly loginAttempt: Omit<LoginAttempt, "returnTo">;
	}) => Effect.Effect<
		{ readonly authentication: Authentication; readonly displayName: string },
		CallbackError,
		HttpClient.HttpClient
	>;
}

export class AuthProviderRegistry extends Context.Service<
	AuthProviderRegistry,
	HashMap.HashMap<string, AuthProvider>
>()("AuthProviderRegistry") {}
