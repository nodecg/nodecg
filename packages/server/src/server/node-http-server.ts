// @effect-diagnostics-next-line nodeBuiltinImport:off
import { createServer } from "node:http";

import * as NodeHttpServer from "@effect/platform-node/NodeHttpServer";
import { Effect, Layer } from "effect";
import { HttpServer } from "effect/http";

import { config } from "../server-config.ts";

export const makeNodeHttpServer = Effect.fn("makeNodeHttpServer")(function* () {
	const port = yield* config.port;
	return NodeHttpServer.layer(createServer, {
		port,
		gracefulShutdownTimeout: "3 seconds",
	});
});

export const reportReady = <A, E, R>(
	serve: Layer.Layer<A, E, R>,
	onReady: (address: string) => void,
) =>
	Layer.effectDiscard(
		HttpServer.addressFormattedWith((address) =>
			Effect.sync(() => onReady(address)),
		),
	).pipe(Layer.provideMerge(serve));
