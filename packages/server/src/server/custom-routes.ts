import { customRoutePath } from "@nodecg/internal";
import { Array, Effect, Match } from "effect";
import { HttpRouter, HttpServerResponse } from "effect/http";

import { resolveRequestIdentity } from "../auth/identity.ts";
import type { CustomRoute } from "../build-custom-routes.ts";
import { NamespaceRegistryService } from "../namespace-registry.ts";

const handleRequest = Effect.fn(function* (route: CustomRoute) {
	const caller = yield* resolveRequestIdentity;
	return yield* route.handle(caller).pipe(
		Effect.catchTag("FieldPermissionDenied", () =>
			Effect.succeed(
				HttpServerResponse.empty({
					status: Match.value(caller).pipe(
						Match.tag("anonymous", () => 404),
						Match.tag("user", "serviceAccount", () => 403),
						Match.exhaustive,
					),
				}),
			),
		),
	);
});

export const customRoutes = HttpRouter.use((router) =>
	Effect.gen(function* () {
		const registry = yield* NamespaceRegistryService;
		const namespaceRoutes = registry.pipe(
			Array.fromIterable,
			Array.flatMap(
				([path, { customRoute }]) =>
					customRoute?.pipe(
						Array.fromIterable,
						Array.map((route) => ({ path, route })),
					) ?? [],
			),
		);
		const routes = yield* Effect.forEach(namespaceRoutes, ({ path, route }) =>
			Effect.gen(function* () {
				const prefix = yield* customRoutePath(path, route.name);
				return HttpRouter.prefixRoute(
					HttpRouter.route(route.method, "/*", handleRequest(route)),
					prefix,
				);
			}),
		);
		yield* router.addAll(routes);
	}),
);
