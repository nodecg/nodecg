import * as NodeCrypto from "@effect/platform-node/NodeCrypto";
import { Effect, Layer, ManagedRuntime } from "effect";
import { FetchHttpClient } from "effect/http";
import { type MutableToken, OAuth2Server } from "oauth2-mock-server";
import { afterEach, expect, test } from "vitest";

import { makeOidcProvider } from "./oidc-provider.ts";

const runtime = ManagedRuntime.make(
	Layer.merge(FetchHttpClient.layer, NodeCrypto.layer),
);

const redirectUri =
	"http://localhost:3000/api/internal/authentication/callback/local";

let server: OAuth2Server | undefined;

afterEach(async () => {
	if (typeof server !== "undefined") {
		await server.stop();
		server = undefined;
	}
});

const startIdp = async (extraClaims?: Record<string, unknown>) => {
	const oauth = new OAuth2Server();
	await oauth.issuer.keys.generate("RS256");
	if (typeof extraClaims !== "undefined") {
		oauth.service.on("beforeTokenSigning", (token: MutableToken) => {
			Object.assign(token.payload, extraClaims);
		});
	}
	await oauth.start(0, "localhost");
	server = oauth;
	const issuer = oauth.issuer.url;
	if (typeof issuer === "undefined") {
		throw new Error("OIDC server did not report an issuer");
	}
	return issuer;
};

const makeLocalProvider = (issuer: string) =>
	makeOidcProvider({
		name: "local",
		issuer,
		clientId: "example-client",
		clientSecret: "example-secret",
		allowInsecure: true,
	});

const authorizeCode = async (authorizeUrl: string) => {
	const redirect = await fetch(authorizeUrl, { redirect: "manual" });
	const location = redirect.headers.get("location");
	if (location === null) {
		throw new Error("authorize endpoint did not redirect with a code");
	}
	return new URL(location).searchParams;
};

test("resolves a user identity end-to-end against a real local OIDC server", async () => {
	const issuer = await startIdp();
	const provider = await makeLocalProvider(issuer);

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
		authentication: { issuer, subject: "johndoe" },
		displayName: "johndoe",
	});
});

test("derives the display name from the name claim", async () => {
	const issuer = await startIdp({ name: "Ada Lovelace" });
	const provider = await makeLocalProvider(issuer);

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
		authentication: { issuer, subject: "johndoe" },
		displayName: "Ada Lovelace",
	});
});

test("falls back to preferred_username when the name claim is absent", async () => {
	const issuer = await startIdp({ preferred_username: "handle" });
	const provider = await makeLocalProvider(issuer);

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
		authentication: { issuer, subject: "johndoe" },
		displayName: "handle",
	});
});

test("rejects a state mismatch with ProviderStateMismatch", async () => {
	const issuer = await startIdp();
	const provider = await makeLocalProvider(issuer);

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
	const issuer = await startIdp();
	const provider = await makeLocalProvider(issuer);

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

test("rejects construction when discovery fails", async () => {
	await expect(
		makeOidcProvider({
			name: "local",
			issuer: "http://localhost:1",
			clientId: "example-client",
			clientSecret: "example-secret",
			allowInsecure: true,
		}),
	).rejects.toThrow();
});
