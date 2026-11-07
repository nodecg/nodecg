import { Authentication, sessionCookieName } from "@nodecg-next/internal";
import { testLayer } from "@nodecg-next/test-utils";
import { ConfigProvider, Effect, Layer } from "effect";
import { SecureRandom } from "effect/crypto";
import { TestClock } from "effect/testing";
import { describe, expect } from "vitest";

import { buildClient, login, services } from "./setup.ts";

const test = testLayer(
	Layer.merge(
		services,
		ConfigProvider.layer(
			ConfigProvider.fromEnvRecord({ SESSION_RENEW_INTERVAL: "1 hour" }),
		),
	),
);

const meUrl = "http://x/api/internal/me";
const logoutUrl = "http://x/api/internal/authentication/logout";

const operator = Authentication.make({ issuer: "dev", subject: "operator" });

describe("renewal", () => {
	test(
		"no cookie within the renew interval",
		Effect.gen(function* () {
			const client = yield* buildClient;

			const asOperator = yield* login(client, operator);
			yield* TestClock.adjust("30 minutes");

			const res = yield* asOperator.get(meUrl);
			expect(res.status).toBe(200);
			expect(res.headers["set-cookie"]).toBeUndefined();
		}),
	);

	test(
		"renews the cookie past the renew interval",
		Effect.gen(function* () {
			const client = yield* buildClient;

			const asOperator = yield* login(client, operator);
			yield* TestClock.adjust("2 hours");

			const res = yield* asOperator.get(meUrl);
			expect(res.status).toBe(200);
			expect(res.headers["set-cookie"]).toMatch(
				/^nodecg\.sid=[^;]+; Max-Age=604800; Path=\/; HttpOnly; SameSite=Lax$/,
			);
		}),
	);

	test(
		"no cookie for an unknown session",
		Effect.gen(function* () {
			const client = yield* buildClient;
			const random = yield* SecureRandom.SecureRandom;
			const token = yield* random.uuidV7();

			const res = yield* client.get(meUrl, {
				headers: { cookie: `${sessionCookieName}=${token}` },
			});
			expect(res.status).toBe(200);
			expect(res.headers["set-cookie"]).toBeUndefined();
		}),
	);
});

describe("logout", () => {
	test(
		"ends the session and clears its cookie",
		Effect.gen(function* () {
			const client = yield* buildClient;

			const asOperator = yield* login(client, operator);

			const logoutRes = yield* asOperator.post(logoutUrl);
			expect(logoutRes.status).toBe(204);
			expect(logoutRes.headers["set-cookie"]).toBe(
				"nodecg.sid=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax",
			);

			const meRes = yield* asOperator.get(meUrl);
			expect(yield* meRes.json).toMatchObject({
				identity: { _tag: "anonymous" },
			});
		}),
	);
});
