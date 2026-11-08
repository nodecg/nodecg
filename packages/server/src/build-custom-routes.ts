import type {
	CustomRouteManifest,
	CustomRouteMethod,
	WidestCustomRoutes,
	WidestNamespaceFields,
} from "@nodecg/core";
import type { Identity } from "@nodecg/internal";
import { Effect, HashSet, Schema, String } from "effect";
import { HttpEffect, HttpMethod } from "effect/http";

import { checkPermission } from "./field-builders/permission.ts";
import type {
	CustomRouteHandler,
	ImplementedNamespace,
	OnLoadContext,
} from "./implement-namespace.ts";

const makeCustomRoute = <S extends WidestNamespaceFields>(
	namespace: string,
	route: CustomRouteManifest,
	method: HttpMethod.HttpMethod | "*",
	handler: CustomRouteHandler<S>,
	ctx: OnLoadContext<S>,
) => ({
	name: route.name,
	method,
	handle: Effect.fn("CustomRoute.handle")(function* (caller: Identity) {
		yield* Effect.fromResult(
			checkPermission(route.permission, namespace, route.name, "write", caller),
		);
		return yield* HttpEffect.fromWebHandler(async (request) =>
			handler(request, { ...ctx, caller }),
		).pipe(
			Effect.tapError((error) =>
				Effect.logError(
					`Custom route "${namespace}/${route.name}" failed`,
					error,
				),
			),
		);
	}),
});

export type CustomRoute = ReturnType<
	typeof makeCustomRoute<WidestNamespaceFields>
>;

export class MissingCustomRouteHandler extends Schema.TaggedError<MissingCustomRouteHandler>()(
	"MissingCustomRouteHandler",
	{ namespace: Schema.String, name: Schema.String, method: Schema.String },
) {
	override readonly message = `Missing handler for custom route "${this.name}" ${this.method} in "${this.namespace}"`;
}

export const buildCustomRoutes = Effect.fn("buildCustomRoutes")(function* <
	S extends WidestNamespaceFields,
	CustomRoutes extends WidestCustomRoutes,
>(
	{ manifest, impl }: ImplementedNamespace<S, CustomRoutes>,
	ctx: OnLoadContext<S>,
) {
	const routerMethods = new Map<CustomRouteMethod, HttpMethod.HttpMethod | "*">(
		[
			["*", "*"],
			...Array.from(HttpMethod.all)
				.filter((method) => method !== "TRACE")
				.map((method) => [String.toLowerCase(method), method] as const),
		],
	);
	const routes: Array<CustomRoute> = [];
	for (const [name, methods] of Object.entries(manifest.customRoute)) {
		for (const [key, method] of routerMethods) {
			const route = methods[key];
			if (typeof route === "undefined") {
				continue;
			}
			const handler = impl?.implementCustomRoute?.[name]?.[key];
			if (typeof handler === "undefined") {
				return yield* MissingCustomRouteHandler.make({
					namespace: manifest.namespace,
					name,
					method,
				});
			}
			routes.push(
				makeCustomRoute(manifest.namespace, route, method, handler, ctx),
			);
		}
	}
	return HashSet.fromIterable(routes);
});
