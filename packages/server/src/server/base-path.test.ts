import { it } from "@effect/vitest";
import { ConfigProvider, Effect, Layer } from "effect";
import {
	HttpEffect,
	HttpRouter,
	HttpServerRequest,
	HttpServerResponse,
} from "effect/http";
import { describe, expect } from "vitest";

import { basePathRouter } from "./base-path.ts";

const echo = Effect.map(HttpServerRequest.HttpServerRequest, (request) =>
	HttpServerResponse.text(request.url),
);

const echoRoutes = HttpRouter.use((router) =>
	Effect.gen(function* () {
		yield* router.add("GET", "/ping", echo);
		yield* router.prefixed("/inner").add("GET", "/ping", echo);
	}),
);

const respond = (baseUrl: string, path: string) =>
	Effect.gen(function* () {
		const handler = HttpEffect.toWebHandler(
			yield* HttpRouter.toHttpEffect(Layer.provide(echoRoutes, basePathRouter)),
		);
		const response = yield* Effect.promise(() =>
			handler(new Request(`http://server${path}`)),
		);
		return {
			status: response.status,
			body: yield* Effect.promise(() => response.text()),
		};
	}).pipe(
		Effect.provide(
			ConfigProvider.layer(ConfigProvider.fromEnvRecord({ BASE_URL: baseUrl })),
		),
	);

describe("basePathRouter", () => {
	it.effect("serves under the sub-path with the prefix stripped", () =>
		Effect.gen(function* () {
			expect(yield* respond("http://host/foo", "/foo/ping")).toEqual({
				status: 200,
				body: "/ping",
			});
		}),
	);

	it.effect("serves a prefixed route under the sub-path", () =>
		Effect.gen(function* () {
			expect(yield* respond("http://host/foo", "/foo/inner/ping")).toEqual({
				status: 200,
				body: "/ping",
			});
		}),
	);

	it.effect("404s a request outside the sub-path", () =>
		Effect.gen(function* () {
			expect(yield* respond("http://host/foo", "/ping")).toEqual({
				status: 404,
				body: "",
			});
		}),
	);

	it.effect("serves at the origin unchanged", () =>
		Effect.gen(function* () {
			expect(yield* respond("http://host", "/ping")).toEqual({
				status: 200,
				body: "/ping",
			});
		}),
	);
});
