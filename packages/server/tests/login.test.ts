import { Authentication, sessionCookieName } from "@nodecg-next/internal";
import { testLayer } from "@nodecg-next/test-utils";
import { Config, ConfigProvider, Effect, HashMap, Layer, Option } from "effect";
import { SecureRandom } from "effect/crypto";
import { Cookies } from "effect/http";
import { assert, describe, expect } from "vitest";

import {
	type AuthProvider,
	AuthProviderRegistry,
} from "../src/auth/auth-provider.ts";
import { buildClient, services } from "./setup.ts";

const alice = Authentication.make({ issuer: "dev", subject: "alice" });

const devProvider: AuthProvider = {
	name: "dev",
	issuer: "dev",
	authorize: ({ redirectUri }) =>
		Effect.succeed({
			url: redirectUri,
			loginAttempt: { provider: "dev", state: "s" },
		}),
	callback: () =>
		Effect.succeed({ authentication: alice, displayName: "Alice" }),
};

const test = testLayer(
	Layer.merge(
		services,
		Layer.succeed(
			AuthProviderRegistry,
			HashMap.make(["dev", devProvider] as const),
		),
	),
);

const providersUrl = "http://x/api/internal/authentication/providers";
const loginUrl = "http://x/api/internal/authentication/login/dev";
const callbackUrl = "http://x/api/internal/authentication/callback/dev?state=s";
const meUrl = "http://x/api/internal/me";

const subPath = ConfigProvider.layer(
	ConfigProvider.fromEnvRecord({ BASE_URL: "http://x/s/nodecg" }),
);

describe("providers", () => {
	test(
		"lists each registered provider with its login URL",
		Effect.gen(function* () {
			const client = yield* buildClient;

			const res = yield* client.get(providersUrl);
			expect(res.status).toBe(200);
			expect(yield* res.json).toEqual([
				{
					name: "dev",
					url: "http://localhost:3000/api/internal/authentication/login/dev",
				},
			]);
		}),
	);

	test(
		"builds each login URL under the base URL",
		Effect.gen(function* () {
			const client = yield* buildClient;

			const res = yield* client.get(
				"http://x/s/nodecg/api/internal/authentication/providers",
			);
			expect(res.status).toBe(200);
			expect(yield* res.json).toEqual([
				{
					name: "dev",
					url: "http://x/s/nodecg/api/internal/authentication/login/dev",
				},
			]);
		}).pipe(Effect.provide(subPath)),
	);
});

describe("login", () => {
	test(
		"keeps the login attempt cookie for the configured TTL",
		Effect.gen(function* () {
			const client = yield* buildClient;

			const res = yield* client.get(loginUrl);
			expect(res.status).toBe(302);
			expect(res.headers["set-cookie"]).toMatch(
				/^nodecg\.login_attempt=[^;]+; Max-Age=300; Path=\/; HttpOnly; SameSite=Lax$/,
			);
		}).pipe(
			Effect.provide(
				ConfigProvider.layer(
					ConfigProvider.fromEnvRecord({ LOGIN_ATTEMPT_TTL: "5 minutes" }),
				),
			),
		),
	);

	test(
		"builds the callback URL under the base path",
		Effect.gen(function* () {
			const client = yield* buildClient;

			const res = yield* client.get(
				"http://x/s/nodecg/api/internal/authentication/login/dev",
			);
			expect(res.status).toBe(302);
			expect(res.headers["location"]).toBe(
				"http://x/s/nodecg/api/internal/authentication/callback/dev",
			);
		}).pipe(Effect.provide(subPath)),
	);

	test(
		"refuses a returnTo that is not a relative path",
		Effect.gen(function* () {
			const client = yield* buildClient;

			const absoluteRes = yield* client.get(loginUrl, {
				urlParams: { returnTo: "https://evil.example" },
			});
			expect(absoluteRes.status).toBe(400);

			const protocolRelativeRes = yield* client.get(loginUrl, {
				urlParams: { returnTo: "//evil.example" },
			});
			expect(protocolRelativeRes.status).toBe(400);

			const backslashRes = yield* client.get(loginUrl, {
				urlParams: { returnTo: "/\\evil.example" },
			});
			expect(backslashRes.status).toBe(400);
		}),
	);
});

describe("callback", () => {
	test(
		"redirects to a stored returnTo",
		Effect.gen(function* () {
			const client = yield* buildClient;

			const loginRes = yield* client.get(loginUrl, {
				urlParams: { returnTo: "/dashboard" },
			});
			const attempt = loginRes.cookies.pipe(
				Cookies.getValue("nodecg.login_attempt"),
			);
			assert(Option.isSome(attempt));

			const callbackRes = yield* client.get(callbackUrl, {
				headers: { cookie: `nodecg.login_attempt=${attempt.value}` },
			});
			expect(callbackRes.status).toBe(302);
			expect(callbackRes.headers["location"]).toBe("/dashboard");
		}),
	);

	test(
		"redirects to the base path without a returnTo",
		Effect.gen(function* () {
			const client = yield* buildClient;

			const loginRes = yield* client.get(
				"http://x/s/nodecg/api/internal/authentication/login/dev",
			);
			const attempt = loginRes.cookies.pipe(
				Cookies.getValue("nodecg.login_attempt"),
			);
			assert(Option.isSome(attempt));

			const callbackRes = yield* client.get(
				"http://x/s/nodecg/api/internal/authentication/callback/dev?state=s",
				{ headers: { cookie: `nodecg.login_attempt=${attempt.value}` } },
			);
			expect(callbackRes.status).toBe(302);
			expect(callbackRes.headers["location"]).toBe("/s/nodecg");
		}).pipe(Effect.provide(subPath)),
	);

	test(
		"creates a session for the logged-in user",
		Effect.gen(function* () {
			const client = yield* buildClient;

			const loginRes = yield* client.get(loginUrl);
			const attempt = loginRes.cookies.pipe(
				Cookies.getValue("nodecg.login_attempt"),
			);
			assert(Option.isSome(attempt));

			const callbackRes = yield* client.get(callbackUrl, {
				headers: { cookie: `nodecg.login_attempt=${attempt.value}` },
			});
			expect(callbackRes.status).toBe(302);
			const session = callbackRes.cookies.pipe(
				Cookies.getValue(sessionCookieName),
			);
			assert(Option.isSome(session));

			const meRes = yield* client.get(meUrl, {
				headers: { cookie: `${sessionCookieName}=${session.value}` },
			});
			expect(yield* meRes.json).toMatchObject({
				identity: { _tag: "user", authentication: alice, displayName: "Alice" },
			});
		}),
	);

	test(
		"clears the cookie of an unknown login attempt",
		Effect.gen(function* () {
			const client = yield* buildClient;
			const random = yield* SecureRandom.SecureRandom;
			const attempt = yield* random.uuidV7();

			const res = yield* client.get(callbackUrl, {
				headers: { cookie: `nodecg.login_attempt=${attempt}` },
			});
			expect(res.status).toBe(400);
			expect(res.headers["set-cookie"]).toBe(
				"nodecg.login_attempt=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax",
			);
		}),
	);
});

describe("startup", () => {
	test(
		"fails when the login attempt TTL does not decode",
		Effect.gen(function* () {
			const error = yield* buildClient.pipe(Effect.flip);
			expect(error).toBeInstanceOf(Config.ConfigError);
		}).pipe(
			Effect.provide(
				ConfigProvider.layer(
					ConfigProvider.fromEnvRecord({ LOGIN_ATTEMPT_TTL: "soon" }),
				),
			),
		),
	);

	test(
		"fails when the session TTL does not decode",
		Effect.gen(function* () {
			const error = yield* buildClient.pipe(Effect.flip);
			expect(error).toBeInstanceOf(Config.ConfigError);
		}).pipe(
			Effect.provide(
				ConfigProvider.layer(
					ConfigProvider.fromEnvRecord({ SESSION_TTL: "soon" }),
				),
			),
		),
	);
});
