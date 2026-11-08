import * as NodeHttpServerRequest from "@effect/platform-node/NodeHttpServerRequest";
import { Effect } from "effect";
import {
	HttpServerError,
	HttpServerRequest,
	HttpServerResponse,
} from "effect/http";

export type NodeMiddleware = (
	req: ReturnType<typeof NodeHttpServerRequest.toIncomingMessage>,
	res: ReturnType<typeof NodeHttpServerRequest.toServerResponse>,
	next: () => void | Promise<void>,
) => void;

export const nodeMiddlewareToHttpApp = (middleware: NodeMiddleware) =>
	Effect.gen(function* () {
		const request = yield* HttpServerRequest.HttpServerRequest;
		const req = NodeHttpServerRequest.toIncomingMessage(request);
		const res = NodeHttpServerRequest.toServerResponse(request);

		return yield* Effect.callback<
			HttpServerResponse.HttpServerResponse,
			HttpServerError.RouteNotFound
		>((resume) => {
			let settled = false;
			const finish = () => {
				if (!settled) {
					settled = true;
					resume(Effect.succeed(HttpServerResponse.empty()));
				}
			};
			res.once("finish", finish);
			res.once("close", finish);
			middleware(req, res, () => {
				if (!settled) {
					settled = true;
					resume(Effect.fail(new HttpServerError.RouteNotFound({ request })));
				}
			});
		});
	});
