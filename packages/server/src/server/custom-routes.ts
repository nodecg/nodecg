import { customRoutePath } from "@nodecg-next/internal";
import { Effect, Match } from "effect";
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
		yield* router.addAll(
			Array.from(registry.customRoute).flatMap(([namespace, routes]) =>
				Array.from(routes, (route) =>
					HttpRouter.prefixRoute(
						HttpRouter.route(route.method, "/*", handleRequest(route)),
						customRoutePath(namespace, route.name),
					),
				),
			),
		);
	}),
);
