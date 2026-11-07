import * as NodeHttpServer from "@effect/platform-node/NodeHttpServer";
import { testLayer } from "@nodecg-next/test-utils";
import { Effect, FileSystem, Layer, Path } from "effect";
import {
	FetchHttpClient,
	HttpClient,
	HttpEffect,
	HttpRouter,
} from "effect/http";
import { describe, expect } from "vitest";

import type { FrontendConfig } from "../implement-namespace.ts";
import { NamespaceRegistryService } from "../namespace-registry.ts";
import { frontendRoutes } from "./frontend-serving.ts";
import { UrlPath } from "./url-path.ts";

const test = testLayer(
	Layer.merge(NodeHttpServer.layerHttpServices, UrlPath.layer),
);

const fixtures = Effect.gen(function* () {
	const fs = yield* FileSystem.FileSystem;
	const path = yield* Path.Path;
	const root = yield* fs.makeTempDirectoryScoped();
	const first = path.join(root, "first");
	const second = path.join(root, "second");
	yield* fs.makeDirectory(first);
	yield* fs.makeDirectory(second);
	yield* fs.writeFileString(path.join(first, "index.html"), "first index");
	yield* fs.writeFileString(path.join(first, "about.html"), "about page");
	yield* fs.writeFileString(path.join(first, "app.js"), "app module");
	yield* fs.writeFileString(path.join(first, "shared.txt"), "from first");
	yield* fs.writeFileString(path.join(second, "widget.js"), "widget module");
	yield* fs.makeDirectory(path.join(second, "docs"));
	yield* fs.writeFileString(
		path.join(second, "docs", "index.html"),
		"docs index",
	);
	yield* fs.writeFileString(path.join(second, "shared.txt"), "from second");
	yield* fs.writeFileString(path.join(root, "secret.txt"), "secret");
	return { root, first, second };
});

const serve = Effect.fn(function* (frontend: FrontendConfig) {
	const handler = yield* HttpRouter.toHttpEffect(frontendRoutes).pipe(
		Effect.provide(
			NamespaceRegistryService.layer([
				{
					namespace: "ns",
					declaredRoles: new Set(),
					frontend,
					fields: { replicant: {}, computed: {}, topic: {}, rpc: {} },
				},
			]),
		),
	);
	const web = HttpEffect.toWebHandler(handler);
	const fetch: typeof globalThis.fetch = (input, init) =>
		web(new Request(input, init));
	const client = yield* HttpClient.HttpClient.pipe(
		Effect.map(HttpClient.followRedirects()),
		Effect.provide(FetchHttpClient.layer),
		Effect.provideService(FetchHttpClient.Fetch, fetch),
	);
	return (pathname: string, headers?: Record<string, string>) =>
		client.get(`http://x/frontend/namespaces/ns${pathname}`, { headers });
});

const html = { accept: "text/html" };

describe("frontendRoutes", () => {
	test(
		"serves the first dir's index at the mount root",
		Effect.gen(function* () {
			const { first, second } = yield* fixtures;
			const get = yield* serve({ dir: [first, second] });
			const response = yield* get("/");
			expect(response.status).toBe(200);
			expect(response.headers["content-type"]).toBe("text/html; charset=utf-8");
			expect(yield* response.text).toBe("first index");
		}),
	);

	test(
		"serves an asset with its content type",
		Effect.gen(function* () {
			const { first } = yield* fixtures;
			const get = yield* serve({ dir: [first] });
			const response = yield* get("/app.js");
			expect(response.status).toBe(200);
			expect(response.headers["content-type"]).toBe(
				"text/javascript; charset=utf-8",
			);
			expect(yield* response.text).toBe("app module");
		}),
	);

	test(
		"falls through to a later dir for a file the first lacks",
		Effect.gen(function* () {
			const { first, second } = yield* fixtures;
			const get = yield* serve({ dir: [first, second] });
			const response = yield* get("/widget.js");
			expect(response.status).toBe(200);
			expect(yield* response.text).toBe("widget module");
		}),
	);

	test(
		"the first dir wins for a file present in both",
		Effect.gen(function* () {
			const { first, second } = yield* fixtures;
			const get = yield* serve({ dir: [first, second] });
			expect(yield* (yield* get("/shared.txt")).text).toBe("from first");
		}),
	);

	test(
		"404s a missing file",
		Effect.gen(function* () {
			const { first, second } = yield* fixtures;
			const get = yield* serve({ dir: [first, second] });
			expect((yield* get("/missing.js")).status).toBe(404);
		}),
	);

	test(
		"does not resolve an extensionless path to its .html file",
		Effect.gen(function* () {
			const { first } = yield* fixtures;
			const get = yield* serve({ dir: [first] });
			const response = yield* get("/about.html");
			expect(yield* response.text).toBe("about page");
			const response2 = yield* get("/about", html);
			expect(response2.status).toBe(404);
		}),
	);

	test(
		"404s a traversal out of the dir",
		Effect.gen(function* () {
			const { first } = yield* fixtures;
			const get = yield* serve({ dir: [first] });
			expect((yield* get("/%2e%2e/secret.txt")).status).toBe(404);
		}),
	);

	test(
		"answers a matching If-None-Match with 304",
		Effect.gen(function* () {
			const { first } = yield* fixtures;
			const get = yield* serve({ dir: [first] });
			const etag = (yield* get("/app.js")).headers["etag"];
			expect(etag).toBeDefined();
			const response = yield* get("/app.js", { "if-none-match": etag ?? "" });
			expect(response.status).toBe(304);
			expect(yield* response.text).toBe("");
		}),
	);

	describe("spa", () => {
		test(
			"falls back to the first dir with an index for a client-side route",
			Effect.gen(function* () {
				const { first, second } = yield* fixtures;
				const get = yield* serve({ dir: [second, first], spa: true });
				const response = yield* get("/some/route", html);
				expect(response.status).toBe(200);
				expect(yield* response.text).toBe("first index");
			}),
		);

		test(
			"an extensionless match in a later dir wins over the first dir's fallback",
			Effect.gen(function* () {
				const { first, second } = yield* fixtures;
				const get = yield* serve({ dir: [first, second], spa: true });
				const response = yield* get("/docs", html);
				expect(yield* response.text).toBe("docs index");
			}),
		);

		test(
			"does not fall back for a missing path that has an extension",
			Effect.gen(function* () {
				const { first } = yield* fixtures;
				const get = yield* serve({ dir: [first], spa: true });
				expect((yield* get("/missing.js")).status).toBe(404);
			}),
		);

		test(
			"404s a client-side route that does not accept html",
			Effect.gen(function* () {
				const { first } = yield* fixtures;
				const get = yield* serve({ dir: [first], spa: true });
				expect((yield* get("/some/route")).status).toBe(404);
			}),
		);
	});
});
