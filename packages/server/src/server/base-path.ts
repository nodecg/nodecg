import { Effect, Layer } from "effect";
import { HttpRouter } from "effect/http";

import { config } from "../server-config.ts";

export const basePathRouter = Layer.effect(
	HttpRouter.HttpRouter,
	Effect.gen(function* () {
		const router = yield* HttpRouter.HttpRouter;
		const { pathname } = yield* config.baseUrl;
		if (pathname === "/") {
			return router;
		}
		return router.prefixed(pathname);
	}),
);
