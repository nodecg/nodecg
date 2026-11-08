import { Duration, Effect, Layer, Path } from "effect";
import { Socket } from "effect/socket";

import { pingSilenceDetector } from "../silence-detector/ping-silence-detector.ts";
import { SocketMessageChannel } from "./socket-message-channel.ts";

// TODO: infer this from HttpApi from internal or have internal const
const wsPath = "ws/internal";

const wsUrl = Effect.fn("wsUrl")(function* (baseUrl?: string) {
	if (!baseUrl) {
		return `/${wsPath}`;
	}
	const path = yield* Path.Path;
	const url = new URL(baseUrl);
	url.pathname = path.join(url.pathname, wsPath);
	url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
	return url.href;
});

export const webSocketMessageChannel = (baseUrl?: string) =>
	SocketMessageChannel.pipe(
		Layer.provide(
			pingSilenceDetector({
				interval: Duration.seconds(30),
				pongTimeout: Duration.seconds(15),
			}),
		),
		Layer.provide(
			Layer.effect(
				Socket.Socket,
				Effect.gen(function* () {
					const websocketUrl = yield* wsUrl(baseUrl);
					return yield* Socket.makeWebSocket(websocketUrl);
				}),
			),
		),
		Layer.provide(Socket.layerWebSocketConstructorGlobal),
	);
