import { testLayer } from "@nodecg-next/test-utils";
import { Effect, Layer } from "effect";
import { FetchHttpClient } from "effect/http";
import { afterEach, assert, describe, expect, vi } from "vitest";

import { FieldTransportService } from "../field-transport/field-transport.ts";
import { httpFieldTransport } from "../field-transport/http-field-transport.ts";

const fetch = vi.fn<typeof globalThis.fetch>();
afterEach(() => {
	fetch.mockReset();
});

const test = testLayer(
	Layer.merge(
		httpFieldTransport(),
		Layer.succeed(FetchHttpClient.Fetch, fetch),
	),
);

const errorResponse = (tag: string, status: number) =>
	new Response(JSON.stringify({ _tag: tag }), {
		status,
		headers: { "content-type": "application/json" },
	});

const getLastRequest = () => {
	const call = fetch.mock.lastCall;
	if (typeof call === "undefined") {
		throw new Error("fetch was not called");
	}
	return new Request(...call);
};

describe("get", () => {
	test(
		"issues a GET to the replicant URL and returns the decoded body",
		Effect.gen(function* () {
			const transport = yield* FieldTransportService;
			fetch.mockResolvedValue(new Response(JSON.stringify(42)));

			const value = yield* transport.getReplicant("root", "count");

			expect(value).toBe(42);
			const request = getLastRequest();
			expect(request.method).toBe("GET");
			expect(request.url).toContain(
				"/api/internal/namespaces/root/replicant/count",
			);
		}),
	);

	test(
		"fails with FieldNotFound when the server responds 404",
		Effect.gen(function* () {
			const transport = yield* FieldTransportService;
			fetch.mockResolvedValue(errorResponse("NotFound", 404));

			const error = yield* transport
				.getReplicant("root", "count")
				.pipe(Effect.flip);

			expect(error._tag).toBe("FieldNotFound");
		}),
	);

	test(
		"fails with FieldPermissionDenied when the server responds 403",
		Effect.gen(function* () {
			const transport = yield* FieldTransportService;
			fetch.mockResolvedValue(errorResponse("Forbidden", 403));

			const error = yield* transport
				.getReplicant("root", "count")
				.pipe(Effect.flip);

			expect(error._tag).toBe("FieldPermissionDenied");
		}),
	);
});

describe("update", () => {
	test(
		"issues a PUT with the JSON-encoded patch body",
		Effect.gen(function* () {
			const transport = yield* FieldTransportService;
			fetch.mockResolvedValue(new Response(null, { status: 204 }));

			yield* transport.updateReplicant("root", "count", [
				{ op: "replace", path: "", value: 7 },
			]);

			const request = getLastRequest();
			expect(request.method).toBe("PUT");
			expect(request.url).toContain(
				"/api/internal/namespaces/root/replicant/count",
			);
			const body = yield* Effect.promise(() => request.text());
			expect(JSON.parse(body)).toEqual([{ op: "replace", path: "", value: 7 }]);
		}),
	);

	test(
		"fails with FieldPermissionDenied when the server responds 403",
		Effect.gen(function* () {
			const transport = yield* FieldTransportService;
			fetch.mockResolvedValue(errorResponse("Forbidden", 403));

			const error = yield* transport
				.updateReplicant("root", "count", [
					{ op: "replace", path: "", value: 7 },
				])
				.pipe(Effect.flip);

			expect(error._tag).toBe("FieldPermissionDenied");
		}),
	);

	test(
		"surfaces a 409 as the RevisionConflict the server sent",
		Effect.gen(function* () {
			const transport = yield* FieldTransportService;
			const conflict = {
				_tag: "RevisionConflict",
				value: { a: 9 },
				revision: 4,
				reason: "HashMismatch",
			};
			fetch.mockResolvedValue(
				new Response(JSON.stringify(conflict), {
					status: 409,
					headers: { "content-type": "application/json" },
				}),
			);

			const error = yield* transport
				.updateReplicant("root", "count", [
					{ op: "replace", path: "/a", value: 7 },
				])
				.pipe(Effect.flip);

			assert(error._tag === "RevisionConflict");
			expect(error.value).toEqual({ a: 9 });
			expect(error.revision).toBe(4);
			expect(error.reason).toBe("HashMismatch");
		}),
	);
});

describe("publishTopic", () => {
	test(
		"issues a POST to the topic URL with the JSON-encoded body",
		Effect.gen(function* () {
			const transport = yield* FieldTransportService;
			fetch.mockResolvedValue(new Response(null, { status: 204 }));

			yield* transport.publishTopic("root", "chat", 7);

			const request = getLastRequest();
			expect(request.method).toBe("POST");
			expect(request.url).toContain("/api/internal/namespaces/root/topic/chat");
			const body = yield* Effect.promise(() => request.text());
			expect(JSON.parse(body)).toBe(7);
		}),
	);

	test(
		"fails with FieldPermissionDenied when the server responds 403",
		Effect.gen(function* () {
			const transport = yield* FieldTransportService;
			fetch.mockResolvedValue(errorResponse("Forbidden", 403));

			const error = yield* transport
				.publishTopic("root", "chat", 7)
				.pipe(Effect.flip);

			expect(error._tag).toBe("FieldPermissionDenied");
		}),
	);
});

describe("callRpc", () => {
	test(
		"issues a POST to the rpc URL and returns the decoded response",
		Effect.gen(function* () {
			const transport = yield* FieldTransportService;
			fetch.mockResolvedValue(new Response(JSON.stringify(84)));

			const response = yield* transport.callRpc("root", "echo", 42);

			expect(response).toBe(84);
			const request = getLastRequest();
			expect(request.method).toBe("POST");
			expect(request.url).toContain("/api/internal/namespaces/root/rpc/echo");
			const body = yield* Effect.promise(() => request.text());
			expect(JSON.parse(body)).toBe(42);
		}),
	);

	test(
		"fails with RpcCallError when the handler errors (500)",
		Effect.gen(function* () {
			const transport = yield* FieldTransportService;
			fetch.mockResolvedValue(
				new Response(
					JSON.stringify({ _tag: "RpcCallError", message: "boom" }),
					{
						status: 500,
						headers: { "content-type": "application/json" },
					},
				),
			);

			const error = yield* transport
				.callRpc("root", "echo", 42)
				.pipe(Effect.flip);

			expect(error._tag).toBe("RpcCallError");
		}),
	);
});

describe("base URL", () => {
	const requestUrl = (baseUrl?: string) =>
		Effect.gen(function* () {
			const transport = yield* FieldTransportService;
			fetch.mockImplementation(async () => new Response(JSON.stringify(42)));
			yield* transport.getReplicant("root", "count");
			return getLastRequest().url;
		}).pipe(Effect.provide(httpFieldTransport(baseUrl)));

	test(
		"builds request URL correctly for various base URLs",
		Effect.gen(function* () {
			expect(yield* requestUrl()).toBe(
				`${new URL(import.meta.url).origin}/api/internal/namespaces/root/replicant/count`,
			);
			expect(yield* requestUrl("https://host")).toBe(
				"https://host/api/internal/namespaces/root/replicant/count",
			);
			expect(yield* requestUrl("https://host/")).toBe(
				"https://host/api/internal/namespaces/root/replicant/count",
			);
			expect(yield* requestUrl("https://host/prefix/")).toBe(
				"https://host/prefix/api/internal/namespaces/root/replicant/count",
			);
			expect(yield* requestUrl("https://host/prefix")).toBe(
				"https://host/prefix/api/internal/namespaces/root/replicant/count",
			);
		}),
	);
});
