import * as NodeCrypto from "@effect/platform-node/NodeCrypto";
import { Effect, Layer, ManagedRuntime } from "effect";
import { FetchHttpClient } from "effect/http";
import { type MutableResponse, OAuth2Server } from "oauth2-mock-server";
import { afterEach, expect, test } from "vitest";

import {
	makeOAuth2Provider,
	type OAuth2ProviderConfig,
} from "./oauth2-provider.ts";

const runtime = ManagedRuntime.make(
	Layer.merge(FetchHttpClient.layer, NodeCrypto.layer),
);

const redirectUri =
	"http://localhost:3000/api/internal/authentication/callback/local";
const pinnedIssuer = "https://oauth2.example";

let server: OAuth2Server | undefined;

afterEach(async () => {
	if (typeof server !== "undefined") {
		await server.stop();
		server = undefined;
	}
});

const startIdp = async (
	mutateUserinfo?: (response: MutableResponse) => void,
	mutateTokenResponse?: (response: MutableResponse) => void,
) => {
	const oauth = new OAuth2Server();
	await oauth.issuer.keys.generate("RS256");
	oauth.service.on("beforeResponse", (response: MutableResponse) => {
		if (typeof response.body !== "string") {
			delete response.body["id_token"];
		}
	});
	if (typeof mutateTokenResponse !== "undefined") {
		oauth.service.on("beforeResponse", mutateTokenResponse);
	}
	if (typeof mutateUserinfo !== "undefined") {
		oauth.service.on("beforeUserinfo", mutateUserinfo);
	}
	await oauth.start(0, "localhost");
	server = oauth;
	const url = oauth.issuer.url;
	if (typeof url === "undefined") {
		throw new Error("OAuth2 server did not report a URL");
	}
	return url;
};

const makeLocalProvider = (
	serverUrl: string,
	overrides?: Partial<OAuth2ProviderConfig>,
) =>
	makeOAuth2Provider({
		name: "local",
		issuer: pinnedIssuer,
		authorizationEndpoint: `${serverUrl}/authorize`,
		tokenEndpoint: `${serverUrl}/token`,
		userinfoEndpoint: `${serverUrl}/userinfo`,
		clientId: "example-client",
		clientSecret: "example-secret",
		scopes: ["identify"],
		allowInsecure: true,
		...overrides,
	});

const authorizeCode = async (authorizeUrl: string) => {
	const redirect = await fetch(authorizeUrl, { redirect: "manual" });
	const location = redirect.headers.get("location");
	if (location === null) {
		throw new Error("authorize endpoint did not redirect with a code");
	}
	return new URL(location).searchParams;
};

test("resolves a user identity from userinfo with the config-pinned issuer", async () => {
	const serverUrl = await startIdp();
	const provider = makeLocalProvider(serverUrl);

	const authorized = await runtime.runPromise(
		provider.authorize({ redirectUri, searchParams: new URLSearchParams() }),
	);
	const searchParams = await authorizeCode(authorized.url);
	const identity = await runtime.runPromise(
		provider.callback({
			redirectUri,
			searchParams,
			loginAttempt: authorized.loginAttempt,
		}),
	);

	expect(identity).toEqual({
		authentication: { issuer: pinnedIssuer, subject: "johndoe" },
		displayName: "johndoe",
	});
});

test("derives the display name from the name claim", async () => {
	const serverUrl = await startIdp((response) => {
		response.body = { sub: "johndoe", name: "Ada Lovelace" };
	});
	const provider = makeLocalProvider(serverUrl);

	const authorized = await runtime.runPromise(
		provider.authorize({ redirectUri, searchParams: new URLSearchParams() }),
	);
	const searchParams = await authorizeCode(authorized.url);
	const identity = await runtime.runPromise(
		provider.callback({
			redirectUri,
			searchParams,
			loginAttempt: authorized.loginAttempt,
		}),
	);

	expect(identity).toEqual({
		authentication: { issuer: pinnedIssuer, subject: "johndoe" },
		displayName: "Ada Lovelace",
	});
});

test("falls back to preferred_username when the name claim is absent", async () => {
	const serverUrl = await startIdp((response) => {
		response.body = { sub: "johndoe", preferred_username: "handle" };
	});
	const provider = makeLocalProvider(serverUrl);

	const authorized = await runtime.runPromise(
		provider.authorize({ redirectUri, searchParams: new URLSearchParams() }),
	);
	const searchParams = await authorizeCode(authorized.url);
	const identity = await runtime.runPromise(
		provider.callback({
			redirectUri,
			searchParams,
			loginAttempt: authorized.loginAttempt,
		}),
	);

	expect(identity).toEqual({
		authentication: { issuer: pinnedIssuer, subject: "johndoe" },
		displayName: "handle",
	});
});

test("rejects a state mismatch with ProviderStateMismatch", async () => {
	const serverUrl = await startIdp();
	const provider = makeLocalProvider(serverUrl);

	const authorized = await runtime.runPromise(
		provider.authorize({ redirectUri, searchParams: new URLSearchParams() }),
	);
	const error = await runtime.runPromise(
		provider
			.callback({
				redirectUri,
				searchParams: new URLSearchParams({ code: "code", state: "tampered" }),
				loginAttempt: authorized.loginAttempt,
			})
			.pipe(Effect.flip),
	);

	expect(error._tag).toBe("ProviderStateMismatch");
});

test("rejects a failed token exchange with CredentialExchangeError", async () => {
	const serverUrl = await startIdp();
	const provider = makeLocalProvider(serverUrl);

	const authorized = await runtime.runPromise(
		provider.authorize({ redirectUri, searchParams: new URLSearchParams() }),
	);
	const error = await runtime.runPromise(
		provider
			.callback({
				redirectUri,
				searchParams: new URLSearchParams({
					code: "never-issued",
					state: authorized.loginAttempt.state,
				}),
				loginAttempt: authorized.loginAttempt,
			})
			.pipe(Effect.flip),
	);

	expect(error._tag).toBe("CredentialExchangeError");
});

test("rejects a failed userinfo request with ProviderResponseError", async () => {
	const serverUrl = await startIdp((response) => {
		response.statusCode = 500;
	});
	const provider = makeLocalProvider(serverUrl);

	const authorized = await runtime.runPromise(
		provider.authorize({ redirectUri, searchParams: new URLSearchParams() }),
	);
	const searchParams = await authorizeCode(authorized.url);
	const error = await runtime.runPromise(
		provider
			.callback({
				redirectUri,
				searchParams,
				loginAttempt: authorized.loginAttempt,
			})
			.pipe(Effect.flip),
	);

	expect(error._tag).toBe("ProviderResponseError");
});

test("rejects a userinfo response without a subject with NoIdentity", async () => {
	const serverUrl = await startIdp((response) => {
		response.body = { name: "No Subject" };
	});
	const provider = makeLocalProvider(serverUrl);

	const authorized = await runtime.runPromise(
		provider.authorize({ redirectUri, searchParams: new URLSearchParams() }),
	);
	const searchParams = await authorizeCode(authorized.url);
	const error = await runtime.runPromise(
		provider
			.callback({
				redirectUri,
				searchParams,
				loginAttempt: authorized.loginAttempt,
			})
			.pipe(Effect.flip),
	);

	expect(error._tag).toBe("NoIdentity");
});

test("rejects a non-object userinfo response with NoIdentity", async () => {
	const serverUrl = await startIdp((response) => {
		response.body = "";
	});
	const provider = makeLocalProvider(serverUrl);

	const authorized = await runtime.runPromise(
		provider.authorize({ redirectUri, searchParams: new URLSearchParams() }),
	);
	const searchParams = await authorizeCode(authorized.url);
	const error = await runtime.runPromise(
		provider
			.callback({
				redirectUri,
				searchParams,
				loginAttempt: authorized.loginAttempt,
			})
			.pipe(Effect.flip),
	);

	expect(error._tag).toBe("NoIdentity");
});

test("maps a provider-specific userinfo shape through identityFromUserinfo", async () => {
	const serverUrl = await startIdp((response) => {
		response.body = { id: 583231, login: "octocat" };
	});
	const provider = makeLocalProvider(serverUrl, {
		identityFromUserinfo: (userinfo) =>
			typeof userinfo["id"] === "number"
				? {
						subject: String(userinfo["id"]),
						displayName:
							typeof userinfo["login"] === "string"
								? userinfo["login"]
								: undefined,
					}
				: undefined,
	});

	const authorized = await runtime.runPromise(
		provider.authorize({ redirectUri, searchParams: new URLSearchParams() }),
	);
	const searchParams = await authorizeCode(authorized.url);
	const identity = await runtime.runPromise(
		provider.callback({
			redirectUri,
			searchParams,
			loginAttempt: authorized.loginAttempt,
		}),
	);

	expect(identity).toEqual({
		authentication: { issuer: pinnedIssuer, subject: "583231" },
		displayName: "octocat",
	});
});

test("rewrites a non-conformant token response through transformTokenResponse", async () => {
	const serverUrl = await startIdp(undefined, (response) => {
		if (typeof response.body !== "string") {
			response.body["scope"] = ["identify"];
		}
	});
	const provider = makeLocalProvider(serverUrl, {
		transformTokenResponse: (body) => {
			const scope = body["scope"];
			if (Array.isArray(scope)) {
				return { ...body, scope: scope.join(" ") };
			}
			return body;
		},
	});

	const authorized = await runtime.runPromise(
		provider.authorize({ redirectUri, searchParams: new URLSearchParams() }),
	);
	const searchParams = await authorizeCode(authorized.url);
	const identity = await runtime.runPromise(
		provider.callback({
			redirectUri,
			searchParams,
			loginAttempt: authorized.loginAttempt,
		}),
	);

	expect(identity).toEqual({
		authentication: { issuer: pinnedIssuer, subject: "johndoe" },
		displayName: "johndoe",
	});
});
