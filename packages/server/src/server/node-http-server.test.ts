import { it } from "@effect/vitest";
import { Effect, Layer } from "effect";
import { HttpRouter, HttpServer } from "effect/http";
import { NetAddress } from "effect/net";
import { describe, expect, vi } from "vitest";

import { reportReady } from "./node-http-server.ts";

describe("reportReady", () => {
	it.effect("reports the server address once the handler is attached", () =>
		Effect.gen(function* () {
			const serve = vi.fn<Parameters<typeof HttpServer.make>[0]["serve"]>(
				() => Effect.void,
			);
			const onReady = vi.fn<(address: string) => void>();
			const address = yield* Effect.fromResult(
				NetAddress.inetAddressFromIpString("127.0.0.1", 4567),
			);
			const server = HttpServer.make({ serve, address });

			yield* Layer.build(
				reportReady(HttpRouter.serve(Layer.empty), onReady).pipe(
					Layer.provide(Layer.succeed(HttpServer.HttpServer, server)),
				),
			).pipe(Effect.scoped);

			expect(onReady.mock.calls).toEqual([["http://127.0.0.1:4567"]]);
			expect(serve).toHaveBeenCalledBefore(onReady);
		}),
	);
});
