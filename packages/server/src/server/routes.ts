import { Layer } from "effect";
import { FetchHttpClient, HttpMiddleware, HttpRouter } from "effect/http";

import {
	AdminTierMiddlewareLive,
	ServiceAccountAuthenticationMiddlewareLive,
	SuperadminMiddlewareLive,
	UserAuthenticationMiddlewareLive,
} from "../auth/middleware.ts";
import { ConfiguredSuperadmins } from "../configured-superadmins.ts";
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

export const routes = Layer.mergeAll(
	RootApiLive,
	otlpProxyRoute,
	websocketRoute,
	frontendRoutes,
	customRoutes,
	HttpRouter.middleware(HttpMiddleware.compression(), { global: true }),
).pipe(
	Layer.provide(basePathRouter),
	HttpRouter.provideRequest(services),
	Layer.provide(services),
);
