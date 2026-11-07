import { Authentication } from "@nodecg-next/internal";
import { Effect } from "effect";
import { Digest } from "effect/crypto";
import { Base64Url } from "effect/encoding";
import {
	allowInsecureRequests,
	authorizationCodeGrant,
	buildAuthorizationUrl,
	Configuration,
	customFetch,
	discovery,
	randomNonce,
	randomPKCECodeVerifier,
	randomState,
} from "openid-client";

import {
	type AuthProvider,
	NoIdentity,
	ProviderStateMismatch,
	CredentialExchangeError,
} from "./auth-provider.ts";
import {
	makeTokenResponseFetch,
	type UnknownRecord,
} from "./token-response.ts";

export interface OidcProviderConfig {
	readonly name: string;
	readonly issuer: string;
	readonly clientId: string;
	readonly clientSecret: string;
	readonly scopes?: ReadonlyArray<string>;
	/** Permit plain-http issuer/endpoints — for local development only. */
	readonly allowInsecure?: boolean;
	/**
	 * an escape hatch for non-conformant providers
	 */
	readonly transformTokenResponse?: (body: UnknownRecord) => UnknownRecord;
}

const pickString = (value: unknown): string | undefined =>
	typeof value === "string" && value.length > 0 ? value : undefined;

const identityFromClaims = (claims: Record<string, unknown>) => {
	const issuer = pickString(claims["iss"]);
	const subject = pickString(claims["sub"]);
	if (typeof issuer === "undefined" || typeof subject === "undefined") {
		return undefined;
	}
	const displayName =
		pickString(claims["name"]) ??
		pickString(claims["preferred_username"]) ??
		subject;
	return {
		authentication: Authentication.make({ issuer, subject }),
		displayName,
	};
};

const callbackUrl = (redirectUri: string, searchParams: URLSearchParams) => {
	const url = new URL(redirectUri);
	for (const [key, value] of searchParams) {
		url.searchParams.set(key, value);
	}
	return url;
};

export const makeOidcProvider = async (
	config: OidcProviderConfig,
): Promise<AuthProvider> => {
	const scope = (config.scopes ?? ["openid", "profile", "email"]).join(" ");
	const configuration = await discovery(
		new URL(config.issuer),
		config.clientId,
		config.clientSecret,
		undefined,
		{
			execute: config.allowInsecure ? [allowInsecureRequests] : undefined,
		},
	);
	return {
		name: config.name,
		issuer: configuration.serverMetadata().issuer,
		authorize: Effect.fn("OidcProvider.authorize")(function* (input) {
			const digest = yield* Digest.Digest;
			const codeVerifier = randomPKCECodeVerifier();
			const state = randomState();
			const nonce = randomNonce();
			const codeChallenge = yield* digest.digest(
				Digest.sha256,
				new TextEncoder().encode(codeVerifier),
			);
			const url = buildAuthorizationUrl(configuration, {
				redirect_uri: input.redirectUri,
				scope,
				state,
				nonce,
				code_challenge: Base64Url.encode(codeChallenge),
				code_challenge_method: "S256",
			});
			return {
				url: url.toString(),
				loginAttempt: {
					provider: config.name,
					state,
					codeVerifier,
					nonce,
				},
			};
		}),
		callback: Effect.fn("OidcProvider.callback")(function* (input) {
			if (input.searchParams.get("state") !== input.loginAttempt.state) {
				return yield* new ProviderStateMismatch();
			}
			const tokenConfiguration = new Configuration(
				configuration.serverMetadata(),
				config.clientId,
				configuration.clientMetadata(),
			);
			if (config.allowInsecure) {
				allowInsecureRequests(tokenConfiguration);
			}
			if (typeof config.transformTokenResponse !== "undefined") {
				tokenConfiguration[customFetch] = yield* makeTokenResponseFetch(
					config.transformTokenResponse,
				);
			}
			const tokens = yield* Effect.tryPromise({
				try: () =>
					authorizationCodeGrant(
						tokenConfiguration,
						callbackUrl(input.redirectUri, input.searchParams),
						{
							expectedState: input.loginAttempt.state,
							expectedNonce: input.loginAttempt.nonce,
							pkceCodeVerifier: input.loginAttempt.codeVerifier,
						},
					),
				catch: (cause) =>
					new CredentialExchangeError({ provider: config.name, cause }),
			});
			const claims = tokens.claims();
			const identity =
				typeof claims === "undefined" ? undefined : identityFromClaims(claims);
			if (typeof identity === "undefined") {
				return yield* new NoIdentity({ provider: config.name });
			}
			return identity;
		}),
	};
};
