import { realpathSync } from "node:fs";
import { createServer, type Server } from "node:http";

import * as NodeFileSystem from "@effect/platform-node/NodeFileSystem";
import { testLayer } from "@nodecg-next/test-utils";
import { ConfigProvider, Effect, FileSystem, Layer } from "effect";
import { FetchHttpClient, HttpClient } from "effect/http";
import { describe, expect } from "vitest";

import { UrlPath } from "./url-path.ts";
import { buildViteServer } from "./vite-dev-server.ts";

const test = testLayer(
	Layer.mergeAll(
		NodeFileSystem.layer,
		UrlPath.layer,
		FetchHttpClient.layer,
		ConfigProvider.layer(
			ConfigProvider.fromEnvRecord({ BASE_URL: "http://localhost:3000/sub" }),
		),
	),
);

const startDevServer = Effect.gen(function* () {
	const fs = yield* FileSystem.FileSystem;
	// Vite rejects "~"" short name paths on Windows
	const root = realpathSync.native(yield* fs.makeTempDirectoryScoped());
	yield* fs.writeFileString(
		`${root}/index.html`,
		"<html><head><title>t</title></head><body>dev</body></html>",
	);
	yield* fs.writeFileString(`${root}/app.js`, "console.log(1);");
	const devServer = yield* buildViteServer({
		root,
		prefix: "/frontend/namespaces/ns",
		spa: false,
	});
	const server = yield* Effect.acquireRelease(
		Effect.callback<Server>((resume) => {
			const server = createServer((req, res) => {
				devServer.middlewares(req, res, () => {
					res.statusCode = 404;
					res.end();
				});
			});
			server.listen(0, () => {
				resume(Effect.succeed(server));
			});
		}),
		(server) =>
			Effect.callback<void>((resume) => {
				server.close(() => {
					resume(Effect.void);
				});
			}),
	);
	const address = server.address();
	if (address === null || typeof address === "string") {
		return yield* Effect.die("expected address object");
	}
	return `http://localhost:${address.port}`;
});

const request = (origin: string, path: string) =>
	Effect.gen(function* () {
		const client = yield* HttpClient.HttpClient;
		const response = yield* client.get(`${origin}${path}`);
		return { status: response.status, body: yield* response.text };
	});

describe("buildViteServer", () => {
	test(
		"serves the index under the configured base",
		Effect.gen(function* () {
			const origin = yield* startDevServer;
			const response = yield* request(origin, "/sub/frontend/namespaces/ns/");
			expect(response.status).toBe(200);
			expect(response.body).toContain("dev");
		}),
	);

	test(
		"serves an asset under the configured base",
		Effect.gen(function* () {
			const origin = yield* startDevServer;
			const response = yield* request(
				origin,
				"/sub/frontend/namespaces/ns/app.js",
			);
			expect(response.status).toBe(200);
		}),
	);
});
