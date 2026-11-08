import { testLayer } from "@nodecg-private/test-utils";
import { baseUrlCookieName, sessionCookieName } from "@nodecg/internal";
import { ConfigProvider, Effect, Layer, Option } from "effect";
import { Cookies } from "effect/http";
import { describe, expect } from "vitest";

import { buildClient, services } from "./setup.ts";

const test = testLayer(
	Layer.merge(
		services,
		ConfigProvider.layer(
			ConfigProvider.fromEnvRecord({ BASE_URL: "http://x/s/nodecg" }),
		),
	),
);

describe("base url cookie", () => {
	test(
		"is set beside a cookie the response sets itself",
		Effect.gen(function* () {
			const client = yield* buildClient;

			const res = yield* client.post(
				"http://x/s/nodecg/api/internal/authentication/logout",
			);
			expect(res.status).toBe(204);
			expect(
				res.cookies.pipe(
					Cookies.get(baseUrlCookieName),
					Option.map(Cookies.serializeCookie),
				),
			).toEqual(Option.some("nodecg.base-url=%2Fs%2Fnodecg; Path=/s/nodecg"));
			expect(res.cookies.pipe(Cookies.getValue(sessionCookieName))).toEqual(
				Option.some(""),
			);
		}),
	);

	test(
		"is set on a not found response",
		Effect.gen(function* () {
			const client = yield* buildClient;

			const res = yield* client.get("http://x/s/nodecg/api/internal/missing");
			expect(res.status).toBe(404);
			expect(
				res.cookies.pipe(
					Cookies.get(baseUrlCookieName),
					Option.map(Cookies.serializeCookie),
				),
			).toEqual(Option.some("nodecg.base-url=%2Fs%2Fnodecg; Path=/s/nodecg"));
		}),
	);
});
