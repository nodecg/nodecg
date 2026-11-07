import { testLayer } from "@nodecg-next/test-utils";
import { Effect, Layer } from "effect";
import { FetchHttpClient } from "effect/http";
import { afterEach, describe, expect, test, vi } from "vitest";

import { loginUrl, makeAuthClient } from "./auth-client.ts";

const fetch = vi.fn<typeof globalThis.fetch>();
afterEach(() => {
	fetch.mockReset();
});

const testFetch = testLayer(
	Layer.merge(
		FetchHttpClient.layer,
		Layer.succeed(FetchHttpClient.Fetch, fetch),
	),
);

const getLastRequest = () => {
	const call = fetch.mock.lastCall;
	if (typeof call === "undefined") {
		throw new Error("fetch was not called");
	}
	return new Request(...call);
};

const jsonResponse = (body: unknown) =>
	new Response(JSON.stringify(body), {
		headers: { "content-type": "application/json" },
	});

const mePayload = {
	identity: {
		_tag: "user",
		id: "1",
		authentication: { issuer: "dev", subject: "alice" },
		displayName: "Alice",
		roles: [],
		globalRoles: [],
	},
	namespaces: {
		fixture: { roles: ["producer"] },
	},
};

describe("loginUrl", () => {
	test("returns the provider URL, appending an encoded returnTo when given", () => {
		const dev = {
			name: "dev",
			url: new URL("https://host/api/internal/authentication/login/dev"),
		};
		expect(loginUrl(dev)).toBe(
			"https://host/api/internal/authentication/login/dev",
		);
		expect(loginUrl(dev, "/dash?tab=1")).toBe(
			"https://host/api/internal/authentication/login/dev?returnTo=%2Fdash%3Ftab%3D1",
		);
	});
});

describe("providers", () => {
	testFetch(
		"issues a GET to the provider list and returns the decoded entries",
		Effect.gen(function* () {
			fetch.mockResolvedValue(
				jsonResponse([
					{
						name: "dev",
						url: "https://host/api/internal/authentication/login/dev",
					},
				]),
			);
			const client = yield* makeAuthClient();

			const providers = yield* client.providers();

			expect(
				providers.map(({ name, url }) => ({ name, url: url.href })),
			).toEqual([
				{
					name: "dev",
					url: "https://host/api/internal/authentication/login/dev",
				},
			]);
			const request = getLastRequest();
			expect(request.method).toBe("GET");
			expect(request.url).toContain("/api/internal/authentication/providers");
		}),
	);

	testFetch(
		"fails with AuthRequestFailed when the server errors",
		Effect.gen(function* () {
			fetch.mockResolvedValue(new Response(null, { status: 500 }));
			const client = yield* makeAuthClient();

			const error = yield* client.providers().pipe(Effect.flip);

			expect(error._tag).toBe("AuthRequestFailed");
		}),
	);

	testFetch(
		"fails with AuthRequestFailed when a provider URL does not decode",
		Effect.gen(function* () {
			fetch.mockResolvedValue(
				jsonResponse([
					{ name: "dev", url: "/api/internal/authentication/login/dev" },
				]),
			);
			const client = yield* makeAuthClient();

			const error = yield* client.providers().pipe(Effect.flip);

			expect(error._tag).toBe("AuthRequestFailed");
		}),
	);
});

describe("me", () => {
	testFetch(
		"issues a GET to /me and returns the decoded payload",
		Effect.gen(function* () {
			fetch.mockResolvedValue(jsonResponse(mePayload));
			const client = yield* makeAuthClient();

			const payload = yield* client.me();

			expect(payload.identity._tag).toBe("user");
			expect(payload.namespaces["fixture"]?.roles).toEqual(["producer"]);
			const request = getLastRequest();
			expect(request.method).toBe("GET");
			expect(request.url).toContain("/api/internal/me");
		}),
	);
});

describe("logout", () => {
	testFetch(
		"issues a POST to the logout endpoint",
		Effect.gen(function* () {
			fetch.mockResolvedValue(new Response(null, { status: 204 }));
			const client = yield* makeAuthClient();

			yield* client.logout();

			const request = getLastRequest();
			expect(request.method).toBe("POST");
			expect(request.url).toContain("/api/internal/authentication/logout");
		}),
	);
});

describe("base URL", () => {
	const requestUrl = Effect.fn(function* (baseUrl?: string) {
		const client = yield* makeAuthClient(baseUrl);
		fetch.mockImplementation(async () => jsonResponse([]));
		yield* client.providers();
		return getLastRequest().url;
	});

	testFetch(
		"prefixes requests with the base URL, with or without a trailing slash",
		Effect.gen(function* () {
			expect(yield* requestUrl()).toBe(
				`${new URL(import.meta.url).origin}/api/internal/authentication/providers`,
			);
			expect(yield* requestUrl("https://host")).toBe(
				"https://host/api/internal/authentication/providers",
			);
			expect(yield* requestUrl("https://host/")).toBe(
				"https://host/api/internal/authentication/providers",
			);
			expect(yield* requestUrl("https://host/prefix/")).toBe(
				"https://host/prefix/api/internal/authentication/providers",
			);
			expect(yield* requestUrl("https://host/prefix")).toBe(
				"https://host/prefix/api/internal/authentication/providers",
			);
		}),
	);
});
