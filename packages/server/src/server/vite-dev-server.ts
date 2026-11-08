import { Effect } from "effect";

import { config } from "../server-config.ts";
import { UrlPath } from "./url-path.ts";

export const buildViteServer = (options: {
	readonly root: string;
	readonly prefix: string;
	readonly spa: boolean;
}) =>
	Effect.acquireRelease(
		Effect.gen(function* () {
			const { pathname: basePath } = yield* config.baseUrl;
			const urlPath = yield* UrlPath;
			const { createServer } = yield* Effect.promise(() => import("vite"));
			return yield* Effect.promise(() =>
				createServer({
					root: options.root,
					base: urlPath.join(basePath, options.prefix),
					appType: options.spa ? "spa" : "mpa",
					server: { middlewareMode: true },
				}),
			);
		}),
		(server) => Effect.promise(() => server.close()),
	);
