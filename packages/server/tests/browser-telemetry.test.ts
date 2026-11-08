import { testLayer } from "@nodecg-private/test-utils";
import { Authentication } from "@nodecg/internal";
import { ConfigProvider, Effect, Layer } from "effect";
import { FetchHttpClient, HttpBody } from "effect/http";
import { assert, describe, expect, vi } from "vitest";

import { OtlpEnvironment } from "../src/server/browser-telemetry.ts";
import { buildClient, login, services } from "./setup.ts";

const collector = vi.fn<typeof globalThis.fetch>(
	async () => new Response(null),
);

const otlpEnvironment = Layer.succeed(
	OtlpEnvironment,
	ConfigProvider.fromEnvRecord({
		OTEL_EXPORTER_OTLP_ENDPOINT: "http://collector.test",
		OTEL_EXPORTER_OTLP_HEADERS: "authorization=Bearer secret",
		OTEL_EXPORTER_OTLP_COMPRESSION: "gzip",
		OTEL_EXPORTER_OTLP_METRICS_COMPRESSION: "none",
		OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE: "delta",
		OTEL_RESOURCE_ATTRIBUTES:
			"deployment.environment.name=staging,team=live%20ops",
		OTEL_SERVICE_NAME: "show",
		OTEL_BSP_SCHEDULE_DELAY: "30000",
		OTEL_BLRP_SCHEDULE_DELAY: "20000",
		OTEL_METRIC_EXPORT_INTERVAL: "10000",
		OTEL_BSP_MAX_EXPORT_BATCH_SIZE: "50",
		OTEL_BLRP_MAX_EXPORT_BATCH_SIZE: "40",
	}),
);

const layerWith = (environment: Record<string, string>) =>
	Layer.mergeAll(
		services,
		otlpEnvironment,
		Layer.succeed(FetchHttpClient.Fetch, collector),
		ConfigProvider.layer(ConfigProvider.fromEnvRecord(environment)),
	);

const test = testLayer(layerWith({}));
const testSessionRequired = testLayer(layerWith({ REQUIRE_AUTH: "true" }));
const testBasePath = testLayer(layerWith({ BASE_URL: "http://x/show/" }));
const testNoEndpoint = testLayer(services);

const testEnvironment = (environment: Record<string, string>) =>
	testLayer(
		Layer.mergeAll(
			services,
			Layer.succeed(FetchHttpClient.Fetch, collector),
			Layer.succeed(OtlpEnvironment, ConfigProvider.fromEnvRecord(environment)),
		),
	);

const testSdkDisabled = testEnvironment({
	OTEL_EXPORTER_OTLP_ENDPOINT: "http://collector.test",
	OTEL_SDK_DISABLED: "true",
	OTEL_SERVICE_NAME: "show",
});
const testExporters = testEnvironment({
	OTEL_EXPORTER_OTLP_ENDPOINT: "http://collector.test",
	OTEL_LOGS_EXPORTER: "none",
	OTEL_METRICS_EXPORTER: "none",
	OTEL_SERVICE_NAME: "show",
	OTEL_TRACES_EXPORTER: "OTLP",
});
const testTracesEndpointOnly = testEnvironment({
	OTEL_EXPORTER_OTLP_TRACES_ENDPOINT: "http://collector.test/v1/traces",
	OTEL_SERVICE_NAME: "show",
});

const statusUrl = "http://x/api/internal/telemetry";
const tracesUrl = "http://x/api/internal/telemetry/v1/traces";
const logsUrl = "http://x/api/internal/telemetry/v1/logs";

const body = HttpBody.uint8Array(
	new Uint8Array([1, 2, 3]),
	"application/x-protobuf",
);

const operator = Authentication.make({ issuer: "dev", subject: "operator" });

describe("status", () => {
	test(
		"reports the browser telemetry settings",
		Effect.gen(function* () {
			const client = yield* buildClient;

			const res = yield* client.get(statusUrl);
			expect(res.status).toBe(200);
			expect(yield* res.json).toStrictEqual({
				_tag: "Some",
				value: {
					serviceName: "show-browser",
					signals: ["traces", "logs", "metrics"],
					compression: { traces: "gzip", logs: "gzip", metrics: "none" },
					exportIntervals: {
						traces: { _tag: "Some", value: 30000 },
						logs: { _tag: "Some", value: 20000 },
						metrics: { _tag: "Some", value: 10000 },
					},
					maxBatchSizes: {
						traces: { _tag: "Some", value: 50 },
						logs: { _tag: "Some", value: 40 },
					},
					metricsTemporality: "delta",
					resourceAttributes: {
						"deployment.environment.name": "staging",
						team: "live ops",
					},
				},
			});
		}),
	);

	testNoEndpoint(
		"reports no signals without an endpoint",
		Effect.gen(function* () {
			const client = yield* buildClient;

			const res = yield* client.get(statusUrl);
			expect(res.status).toBe(200);
			expect(yield* res.json).toMatchObject({
				value: { signals: [], metricsTemporality: "cumulative" },
			});
		}),
	);

	testSdkDisabled(
		"reports telemetry off when the SDK is disabled",
		Effect.gen(function* () {
			const client = yield* buildClient;

			const res = yield* client.get(statusUrl);
			expect(res.status).toBe(200);
			expect(yield* res.json).toStrictEqual({ _tag: "None" });
		}),
	);

	testExporters(
		"lists only otlp exporters",
		Effect.gen(function* () {
			const client = yield* buildClient;

			const res = yield* client.get(statusUrl);
			expect(res.status).toBe(200);
			expect(yield* res.json).toMatchObject({ value: { signals: ["traces"] } });
		}),
	);

	testTracesEndpointOnly(
		"reports only the signal with an endpoint",
		Effect.gen(function* () {
			const client = yield* buildClient;

			const res = yield* client.get(statusUrl);
			expect(res.status).toBe(200);
			expect(yield* res.json).toMatchObject({ value: { signals: ["traces"] } });
		}),
	);
});

describe("proxy", () => {
	test(
		"forwards a post with the server's credentials",
		Effect.gen(function* () {
			const client = yield* buildClient;
			collector.mockClear();

			const res = yield* client.post(tracesUrl, { body });
			expect(res.status).toBe(200);

			expect(collector).toHaveBeenCalledOnce();
			const request = collector.mock.calls[0];
			assert(typeof request !== "undefined");
			const [input, init] = request;
			expect(new Request(input).url).toBe("http://collector.test/v1/traces");
			expect(new Headers(init?.headers).get("authorization")).toBe(
				"Bearer secret",
			);
		}),
	);

	testExporters(
		"refuses a signal whose exporter is none",
		Effect.gen(function* () {
			const client = yield* buildClient;
			collector.mockClear();

			const res = yield* client.post(logsUrl, { body });
			expect(res.status).toBe(404);
			expect(collector).not.toHaveBeenCalled();
		}),
	);

	testSdkDisabled(
		"refuses every signal when the SDK is disabled",
		Effect.gen(function* () {
			const client = yield* buildClient;
			collector.mockClear();

			const res = yield* client.post(tracesUrl, { body });
			expect(res.status).toBe(404);
			expect(collector).not.toHaveBeenCalled();
		}),
	);

	testBasePath(
		"serves under the base path",
		Effect.gen(function* () {
			const client = yield* buildClient;

			const res = yield* client.post(
				"http://x/show/api/internal/telemetry/v1/traces",
				{ body },
			);
			expect(res.status).toBe(200);
		}),
	);

	testSessionRequired(
		"refuses a post without a session when auth is required",
		Effect.gen(function* () {
			const client = yield* buildClient;
			collector.mockClear();

			const res = yield* client.post(tracesUrl, { body });
			expect(res.status).toBe(401);
			expect(collector).not.toHaveBeenCalled();
		}),
	);

	testSessionRequired(
		"accepts a post with a session when auth is required",
		Effect.gen(function* () {
			const client = yield* buildClient;

			const asOperator = yield* login(client, operator);

			const res = yield* asOperator.post(tracesUrl, { body });
			expect(res.status).toBe(200);
		}),
	);
});
