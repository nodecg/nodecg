import { defineNamespace } from "@nodecg-next/core";
import {
	AnonymousIdentitySchema,
	CurrentIdentity,
	ServerIdentity,
} from "@nodecg-next/internal";
import { testLayer } from "@nodecg-next/test-utils";
import { Effect, Layer, Schema } from "effect";
import { describe, expect, vi } from "vitest";

import { buildRpc } from "./build-rpc.ts";
import { fieldInternal } from "./field-internal-key.ts";

const serverIdentity = Layer.succeed(CurrentIdentity, ServerIdentity.make({}));

const test = testLayer(serverIdentity);

const anonymousIdentity = Layer.succeed(
	CurrentIdentity,
	AnonymousIdentitySchema.make({}),
);

const manifest = defineNamespace("ns", {
	rpc: {
		echo: {
			schema: {
				request: Schema.FiniteFromString,
				response: Schema.FiniteFromString,
			},
			permission: { write: { everyone: "allow" } },
		},
		locked: {
			schema: { request: Schema.String, response: Schema.String },
		},
	},
});

const context = { marker: "ctx" };

describe("callEncoded", () => {
	test(
		"decodes the request, runs the handler with the build-time ctx, and encodes the response",
		Effect.gen(function* () {
			const handler = vi.fn(
				(request: number, _ctx: typeof context) => request * 2,
			);
			const field = yield* buildRpc(
				"ns",
				"echo",
				manifest.rpc.echo,
				handler,
				context,
			);

			const result = yield* field[fieldInternal]
				.callEncoded("21")
				.pipe(Effect.provide(anonymousIdentity));

			expect(result).toBe("42");
			expect(handler).toHaveBeenCalledWith(21, context);
		}),
	);

	test(
		"awaits an async handler",
		Effect.gen(function* () {
			const field = yield* buildRpc(
				"ns",
				"echo",
				manifest.rpc.echo,
				async (request: number) => {
					await Promise.resolve();
					return request + 1;
				},
				context,
			);

			const result = yield* field[fieldInternal]
				.callEncoded("4")
				.pipe(Effect.provide(anonymousIdentity));

			expect(result).toBe("5");
		}),
	);

	test(
		"fails FieldDecodeError when the request payload is invalid",
		Effect.gen(function* () {
			const handler = vi.fn((request: number) => request);
			const field = yield* buildRpc(
				"ns",
				"echo",
				manifest.rpc.echo,
				handler,
				context,
			);

			const error = yield* field[fieldInternal]
				.callEncoded("not a number")
				.pipe(Effect.provide(anonymousIdentity), Effect.flip);

			expect(error._tag).toBe("FieldDecodeError");
			expect(handler).not.toHaveBeenCalled();
		}),
	);

	test(
		"surfaces a throwing handler as RpcHandlerError",
		Effect.gen(function* () {
			const field = yield* buildRpc(
				"ns",
				"echo",
				manifest.rpc.echo,
				() => {
					throw new Error("boom");
				},
				context,
			);

			const error = yield* field[fieldInternal]
				.callEncoded("1")
				.pipe(Effect.provide(anonymousIdentity), Effect.flip);

			expect(error._tag).toBe("RpcHandlerError");
			expect(error.message).toContain("boom");
		}),
	);

	test(
		"fails FieldEncodeError when the response fails its schema",
		Effect.gen(function* () {
			const field = yield* buildRpc(
				"ns",
				"echo",
				manifest.rpc.echo,
				() => "nope" as unknown as number,
				context,
			);

			const error = yield* field[fieldInternal]
				.callEncoded("1")
				.pipe(Effect.provide(anonymousIdentity), Effect.flip);

			expect(error._tag).toBe("FieldEncodeError");
		}),
	);
});

describe("call", () => {
	test(
		"runs the handler with the decoded request and returns the response",
		Effect.gen(function* () {
			const handler = vi.fn(
				(request: number, _ctx: typeof context) => request * 2,
			);
			const field = yield* buildRpc(
				"ns",
				"echo",
				manifest.rpc.echo,
				handler,
				context,
			);

			expect(
				yield* field.call(21).pipe(Effect.provide(anonymousIdentity)),
			).toBe(42);
			expect(handler).toHaveBeenCalledWith(21, context);
		}),
	);

	test(
		"surfaces a throwing handler as RpcHandlerError",
		Effect.gen(function* () {
			const field = yield* buildRpc(
				"ns",
				"echo",
				manifest.rpc.echo,
				() => {
					throw new Error("boom");
				},
				context,
			);

			const error = yield* field.call(1).pipe(Effect.flip);

			expect(error._tag).toBe("RpcHandlerError");
		}),
	);
});

test(
	"call and callEncoded both fail FieldPermissionDenied for a denied caller",
	Effect.gen(function* () {
		const handler = vi.fn((request: string) => request);
		const field = yield* buildRpc(
			"ns",
			"locked",
			manifest.rpc.locked,
			handler,
			context,
		);

		const callError = yield* field
			.call("x")
			.pipe(Effect.provide(anonymousIdentity), Effect.flip);
		expect(callError._tag).toBe("FieldPermissionDenied");

		const callEncodedError = yield* field[fieldInternal]
			.callEncoded("x")
			.pipe(Effect.provide(anonymousIdentity), Effect.flip);
		expect(callEncodedError._tag).toBe("FieldPermissionDenied");

		expect(handler).not.toHaveBeenCalled();
	}),
);
