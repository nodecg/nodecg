// @effect-diagnostics-next-line nodeBuiltinImport:off
import { createServer } from "node:http";

import * as NodeHttpServer from "@effect/platform-node/NodeHttpServer";
import type * as NodeHttpServerRequest from "@effect/platform-node/NodeHttpServerRequest";
import { baseUrlCookieName } from "@nodecg-next/internal";
import { Effect } from "effect";
import { Cookies } from "effect/http";

import { config } from "../server-config.ts";

const baseUrlCookieListener = Effect.gen(function* () {
	const { pathname: basePath } = yield* config.baseUrl;
	const cookie = yield* Effect.fromResult(
		Cookies.makeCookie(baseUrlCookieName, basePath, { path: basePath }),
	);
	const setCookieHeader = Cookies.serializeCookie(cookie);
	return (
		_: ReturnType<typeof NodeHttpServerRequest.toIncomingMessage>,
		response: ReturnType<typeof NodeHttpServerRequest.toServerResponse>,
	) => {
		response.setHeader("set-cookie", setCookieHeader);
	};
});

export const makeNodeHttpServer = Effect.fn("makeNodeHttpServer")(function* ({
	onReady,
}: {
	onReady?: (address?: string) => void;
}) {
	// TODO: check if we still need to createServer() manually on v4
	const server = createServer();
	server.addListener("request", yield* baseUrlCookieListener);
	if (onReady) {
		const handleListening = () => {
			const address = server.address();
			onReady(typeof address === "string" ? address : address?.address);
		};
		server.addListener("listening", handleListening);
		yield* Effect.addFinalizer(() =>
			Effect.sync(() => {
				server.removeListener("listening", handleListening);
			}),
		);
	}

	const port = yield* config.port;
	return NodeHttpServer.layer(() => server, {
		port,
		gracefulShutdownTimeout: "3 seconds",
	});
});
