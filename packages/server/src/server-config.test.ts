import { it } from "@effect/vitest";
import { Config, ConfigProvider, Effect } from "effect";
import { describe, expect } from "vitest";

import { config } from "./server-config.ts";

const readBaseUrl = (env: Record<string, string>) =>
	config.baseUrl.pipe(
		Effect.provide(ConfigProvider.layer(ConfigProvider.fromEnvRecord(env))),
	);

describe("baseUrl", () => {
	it.effect("defaults to localhost on the configured port at root", () =>
		Effect.gen(function* () {
			expect(yield* readBaseUrl({})).toEqual({
				href: "http://localhost:3000",
				pathname: "/",
			});
			expect(yield* readBaseUrl({ PORT: "8080" })).toEqual({
				href: "http://localhost:8080",
				pathname: "/",
			});
		}),
	);

	it.effect("a bare origin resolves to root", () =>
		Effect.gen(function* () {
			expect(yield* readBaseUrl({ BASE_URL: "http://host" })).toEqual({
				href: "http://host/",
				pathname: "/",
			});
		}),
	);

	it.effect("exposes the configured sub-path", () =>
		Effect.gen(function* () {
			expect(yield* readBaseUrl({ BASE_URL: "http://host/foo" })).toEqual({
				href: "http://host/foo",
				pathname: "/foo",
			});
		}),
	);

	it.effect("strips a trailing slash from the pathname", () =>
		Effect.gen(function* () {
			expect(yield* readBaseUrl({ BASE_URL: "http://host/foo/" })).toEqual({
				href: "http://host/foo/",
				pathname: "/foo",
			});
			expect(yield* readBaseUrl({ BASE_URL: "http://host/a/b/" })).toEqual({
				href: "http://host/a/b/",
				pathname: "/a/b",
			});
		}),
	);

	it.effect(
		"rejects a malformed url instead of falling back to the default",
		() =>
			Effect.gen(function* () {
				const error = yield* readBaseUrl({
					BASE_URL: "not a url",
				}).pipe(Effect.flip);
				expect(error).toBeInstanceOf(Config.ConfigError);
			}),
	);
});
