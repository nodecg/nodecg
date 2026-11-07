import { baseUrlCookieName } from "@nodecg-next/internal";
import { Effect, Layer } from "effect";
import {
	Cookies,
	FetchHttpClient,
	HttpEffect,
	HttpMiddleware,
	HttpRouter,
	HttpServerResponse,
} from "effect/http";

import {
	AdminTierMiddlewareLive,
	ServiceAccountAuthenticationMiddlewareLive,
	SuperadminMiddlewareLive,
	UserAuthenticationMiddlewareLive,
} from "../auth/middleware.ts";
import { ConfiguredSuperadmins } from "../configured-superadmins.ts";
import { config } from "../server-config.ts";
import { basePathRouter } from "./base-path.ts";
import { otlpProxyRoute } from "./browser-telemetry.ts";
import { customRoutes } from "./custom-routes.ts";
import { frontendRoutes } from "./frontend-serving.ts";
import { RootApiLive } from "./http-api/build-root-api.ts";
import { UrlPath } from "./url-path.ts";
import { websocketRoute } from "./websocket.ts";

const services = Layer.mergeAll(
	UserAuthenticationMiddlewareLive,
	ServiceAccountAuthenticationMiddlewareLive,
	AdminTierMiddlewareLive,
	SuperadminMiddlewareLive,
).pipe(
	Layer.provideMerge(ConfiguredSuperadmins.layer),
	Layer.provideMerge(UrlPath.layer),
	Layer.provideMerge(FetchHttpClient.layer),
);

const baseUrlCookie = HttpRouter.middleware(
	Effect.gen(function* () {
		const { pathname: basePath } = yield* config.baseUrl;
		const cookie = yield* Effect.fromResult(
			Cookies.makeCookie(baseUrlCookieName, basePath, { path: basePath }),
		);
		const cookies = Cookies.fromIterable([cookie]);
		// Set the cookie on 404 and defect responses too
		return HttpEffect.withPreResponseHandler((_, response) =>
			Effect.succeed(HttpServerResponse.mergeCookies(response, cookies)),
		);
	}),
	{ global: true },
);

export const routes = Layer.mergeAll(
	RootApiLive,
	otlpProxyRoute,
	websocketRoute,
	frontendRoutes,
	customRoutes,
	HttpRouter.middleware(HttpMiddleware.compression(), { global: true }),
	baseUrlCookie,
).pipe(
	Layer.provide(basePathRouter),
	HttpRouter.provideRequest(services),
	Layer.provide(services),
);
