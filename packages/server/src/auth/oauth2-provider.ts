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
	fetchProtectedResource,
	randomPKCECodeVerifier,
	randomState,
} from "openid-client";

import {
	type AuthProvider,
	NoIdentity,
	ProviderStateMismatch,
	CredentialExchangeError,
	ProviderResponseError,
} from "./auth-provider.ts";
import {
	makeTokenResponseFetch,
	type UnknownRecord,
} from "./token-response.ts";

export interface OAuth2ProviderConfig {
	readonly name: string;
	readonly issuer: string;
	readonly authorizationEndpoint: string;
	readonly tokenEndpoint: string;
	readonly userinfoEndpoint: string;
	readonly clientId: string;
	readonly clientSecret: string;
	readonly scopes: ReadonlyArray<string>;
	readonly identityFromUserinfo?: (
		userinfo: Record<string, unknown>,
	) => { readonly subject: string; readonly displayName?: string } | undefined;
	readonly allowInsecure?: boolean;
	/**
	 * an escape hatch for non-conformant providers
	 */
	readonly transformTokenResponse?: (body: UnknownRecord) => UnknownRecord;
}

const pickString = (value: unknown): string | undefined =>
	typeof value === "string" && value.length > 0 ? value : undefined;

const callbackUrl = (redirectUri: string, searchParams: URLSearchParams) => {
	const url = new URL(redirectUri);
	for (const [key, value] of searchParams) {
		url.searchParams.set(key, value);
	}
	return url;
};

const defaultIdentityFromUserinfo = (userinfo: Record<string, unknown>) => {
	const subject = pickString(userinfo["sub"]);
	if (typeof subject === "undefined") {
		return undefined;
	}
	return {
		subject,
		displayName:
			pickString(userinfo["name"]) ??
			pickString(userinfo["preferred_username"]),
	};
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

export const makeOAuth2Provider = (
	config: OAuth2ProviderConfig,
): AuthProvider => {
	const scope = config.scopes.join(" ");
	const identityFromUserinfo =
		config.identityFromUserinfo ?? defaultIdentityFromUserinfo;
	const configuration = new Configuration(
		{
			issuer: config.issuer,
			authorization_endpoint: config.authorizationEndpoint,
			token_endpoint: config.tokenEndpoint,
		},
		config.clientId,
		config.clientSecret,
	);
	if (config.allowInsecure) {
		allowInsecureRequests(configuration);
	}

	return {
		name: config.name,
		issuer: config.issuer,
		authorize: Effect.fn("OAuth2Provider.authorize")(function* (input) {
			const digest = yield* Digest.Digest;
			const codeVerifier = randomPKCECodeVerifier();
			const state = randomState();
			const codeChallenge = yield* digest.digest(
				Digest.sha256,
				new TextEncoder().encode(codeVerifier),
			);
			const parameters: Record<string, string> = {
				redirect_uri: input.redirectUri,
				state,
				code_challenge: Base64Url.encode(codeChallenge),
				code_challenge_method: "S256",
			};
			if (scope.length > 0) {
				parameters["scope"] = scope;
			}
			const url = buildAuthorizationUrl(configuration, parameters);
			return {
				url: url.toString(),
				loginAttempt: {
					provider: config.name,
					state,
					codeVerifier,
				},
			};
		}),
		callback: Effect.fn("OAuth2Provider.callback")(function* (input) {
			if (input.searchParams.get("state") !== input.loginAttempt.state) {
				return yield* new ProviderStateMismatch();
			}
			const tokenConfiguration = new Configuration(
				configuration.serverMetadata(),
				config.clientId,
				config.clientSecret,
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
							pkceCodeVerifier: input.loginAttempt.codeVerifier,
						},
					),
				catch: (cause) =>
					new CredentialExchangeError({ provider: config.name, cause }),
			});
			const response = yield* Effect.tryPromise({
				try: () =>
					fetchProtectedResource(
						configuration,
						tokens.access_token,
						new URL(config.userinfoEndpoint),
						"GET",
					),
				catch: (cause) =>
					new ProviderResponseError({ provider: config.name, cause }),
			});
			if (!response.ok) {
				return yield* new ProviderResponseError({
					provider: config.name,
					cause: { status: response.status },
				});
			}
			const body = yield* Effect.tryPromise({
				try: (): Promise<unknown> => response.json(),
				catch: (cause) =>
					new ProviderResponseError({ provider: config.name, cause }),
			});
			const identity = isRecord(body) ? identityFromUserinfo(body) : undefined;
			const subject = pickString(identity?.subject);
			if (typeof subject === "undefined") {
				return yield* new NoIdentity({ provider: config.name });
			}
			return {
				authentication: Authentication.make({ issuer: config.issuer, subject }),
				displayName: pickString(identity?.displayName) ?? subject,
			};
		}),
	};
};
