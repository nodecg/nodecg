import * as NodeFileSystem from "@effect/platform-node/NodeFileSystem";
import * as NodePath from "@effect/platform-node/NodePath";
import { testLayer } from "@nodecg-next/test-utils";
import { ConfigProvider, Effect, FileSystem, Layer, Path } from "effect";
import { FetchHttpClient } from "effect/http";
import { assert, describe, expect, vi } from "vitest";

import { OtlpTelemetry } from "./telemetry.ts";

const test = testLayer(Layer.merge(NodeFileSystem.layer, NodePath.layer));

const endpoint = "http://collector:4318";

const makeFetch = () =>
	vi.fn<typeof globalThis.fetch>(async () => new Response(null));

const telemetry = (
	fetch: typeof globalThis.fetch,
	env: Record<string, string>,
) =>
	OtlpTelemetry.pipe(
		Layer.provide(ConfigProvider.layer(ConfigProvider.fromEnvRecord(env))),
		Layer.provide(Layer.succeed(FetchHttpClient.Fetch, fetch)),
	);

const inProject = Effect.fn(function* (packageJson: string) {
	const fs = yield* FileSystem.FileSystem;
	const path = yield* Path.Path;
	const folder = yield* fs.makeTempDirectoryScoped();
	yield* fs.writeFileString(path.join(folder, "package.json"), packageJson);
	return Layer.succeed(Path.Path, { ...path, resolve: () => folder });
});

const run = <R>(layer: Layer.Layer<never, never, R>) =>
	Effect.logError("log line").pipe(
		Effect.withSpan("span name"),
		Effect.provide(layer),
	);

const firstBody = (fetch: ReturnType<typeof makeFetch>) => {
	const request = fetch.mock.calls[0];
	assert(typeof request !== "undefined");
	const [, init] = request;
	assert(init?.body instanceof Uint8Array);
	return Buffer.from(init.body);
};

describe("OtlpTelemetry", () => {
	test(
		"exports every signal once an endpoint is set",
		Effect.gen(function* () {
			const fetch = makeFetch();

			yield* run(telemetry(fetch, { OTEL_EXPORTER_OTLP_ENDPOINT: endpoint }));

			const urls = fetch.mock.calls.map(([input]) => new Request(input).url);
			expect(urls.sort()).toEqual([
				`${endpoint}/v1/logs`,
				`${endpoint}/v1/metrics`,
				`${endpoint}/v1/traces`,
			]);
		}),
	);

	test(
		"names the service after the project's package.json",
		Effect.gen(function* () {
			const fetch = makeFetch();
			const project = yield* inProject('{ "name": "@test-scope/package" }');

			yield* run(
				telemetry(fetch, { OTEL_EXPORTER_OTLP_ENDPOINT: endpoint }).pipe(
					Layer.provide(project),
				),
			);

			expect(firstBody(fetch).includes("@test-scope/package")).toBe(true);
		}),
	);

	test(
		"falls back to nodecg when package.json has no name",
		Effect.gen(function* () {
			const fetch = makeFetch();
			const project = yield* inProject("{}");

			yield* run(
				telemetry(fetch, { OTEL_EXPORTER_OTLP_ENDPOINT: endpoint }).pipe(
					Layer.provide(project),
				),
			);

			expect(firstBody(fetch).includes("nodecg")).toBe(true);
		}),
	);

	test(
		"falls back to nodecg when package.json does not decode",
		Effect.gen(function* () {
			const fetch = makeFetch();
			const project = yield* inProject("not json");

			yield* run(
				telemetry(fetch, { OTEL_EXPORTER_OTLP_ENDPOINT: endpoint }).pipe(
					Layer.provide(project),
				),
			);

			expect(firstBody(fetch).includes("nodecg")).toBe(true);
		}),
	);

	test(
		"prefers the operator's service name",
		Effect.gen(function* () {
			const fetch = makeFetch();
			const project = yield* inProject('{ "name": "@test-scope/package" }');

			yield* run(
				telemetry(fetch, {
					OTEL_EXPORTER_OTLP_ENDPOINT: endpoint,
					OTEL_SERVICE_NAME: "operator-name",
				}).pipe(Layer.provide(project)),
			);

			const body = firstBody(fetch);
			expect(body.includes("operator-name")).toBe(true);
			expect(body.includes("@test-scope/package")).toBe(false);
		}),
	);

	test(
		"reads the version from the resource attributes",
		Effect.gen(function* () {
			const fetch = makeFetch();
			const project = yield* inProject(
				'{ "name": "@test-scope/package", "version": "1.2.3" }',
			);

			yield* run(
				telemetry(fetch, {
					OTEL_EXPORTER_OTLP_ENDPOINT: endpoint,
					OTEL_RESOURCE_ATTRIBUTES: "service.version=9.9.9",
				}).pipe(Layer.provide(project)),
			);

			const body = firstBody(fetch);
			expect(body.includes("9.9.9")).toBe(true);
			expect(body.includes("1.2.3")).toBe(false);
		}),
	);
});
