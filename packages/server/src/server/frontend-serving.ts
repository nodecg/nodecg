import { fileURLToPath } from "node:url";

import { formatNamespacePath, NamespacePathFromString } from "@nodecg/internal";
import { Effect, Schema } from "effect";
import { HttpRouter, HttpStaticServer } from "effect/http";

import { NamespaceRegistryService } from "../namespace-registry.ts";
import { config } from "../server-config.ts";
import {
	type NodeMiddleware,
	nodeMiddlewareToHttpApp,
} from "./node-connect-middleware.ts";
import { buildViteServer } from "./vite-dev-server.ts";

const encodeNamespacePath = Schema.encodeEffect(NamespacePathFromString);

const coerceToPath = (url: string | URL) => {
	if (url instanceof URL) {
		return fileURLToPath(url);
	}
	if (url.startsWith("file://")) {
		return fileURLToPath(url);
	}
	return url;
};

export const frontendRoutes = HttpRouter.use((router) =>
	Effect.gen(function* () {
		const registry = yield* NamespaceRegistryService;
		const dev = yield* config.dev;
		for (const [path, { frontend }] of registry) {
			if (typeof frontend === "undefined") {
				continue;
			}
			const segment = yield* encodeNamespacePath(path).pipe(
				Effect.catchTag("SchemaError", Effect.die),
			);
			const prefix = `/frontend/namespaces/${segment}`;
			const spa = frontend.spa ?? false;
			if (dev && typeof frontend.vite !== "undefined") {
				const devServer = yield* buildViteServer({
					root: coerceToPath(frontend.vite.root),
					prefix,
					spa,
				});
				// Vite runs these middlewares under HTTP/2 too, but types them for node:http only.
				const middlewares = devServer.middlewares as NodeMiddleware;
				yield* router
					.prefixed(prefix)
					.add("*", "/*", nodeMiddlewareToHttpApp(middlewares));
			} else {
				const roots = frontend.dir.map(coerceToPath);
				const apps = yield* Effect.forEach(roots, (root) =>
					HttpStaticServer.make({ root, spa: false }),
				);
				if (spa) {
					apps.push(
						...(yield* Effect.forEach(roots, (root) =>
							HttpStaticServer.make({ root, spa: true }),
						)),
					);
				}
				yield* router.prefixed(prefix).add(
					"GET",
					"/*",
					apps.reduce((acc, next) =>
						acc.pipe(
							Effect.catchIf(
								(error) => error.reason._tag === "RouteNotFound",
								() => next,
							),
						),
					),
				);
			}
			yield* Effect.logInfo(
				`Serving frontend for "${formatNamespacePath(path)}" at ${prefix}/`,
			);
		}
	}),
);
