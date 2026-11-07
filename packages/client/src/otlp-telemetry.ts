import { InternalApi, type TelemetrySignal } from "@nodecg-next/internal";
import { Effect, Layer, Option, Path, Record } from "effect";
import { SecureRandom } from "effect/crypto";
import { FetchHttpClient, HttpClient, Url } from "effect/http";
import { HttpApiClient } from "effect/http-api";
import {
	OtlpLogger,
	OtlpMetrics,
	OtlpSerialization,
	OtlpTracer,
} from "effect/observability";

const signalUrl = Effect.fn(function* (
	baseUrl: string | undefined,
	signal: typeof TelemetrySignal.Type,
) {
	const path = yield* Path.Path;
	const signalPath = path.join(
		InternalApi.groups.Telemetry.endpoints.status.path,
		"v1",
		signal,
	);
	if (!baseUrl) {
		return signalPath;
	}
	const url = yield* Effect.fromResult(Url.fromString(baseUrl));
	return Url.setPathname(url, path.join(url.pathname, signalPath)).href;
});

const makeOtlpLayer = Effect.fn(
	function* (baseUrl: string | undefined) {
		const random = yield* SecureRandom.SecureRandom;
		const api = yield* HttpApiClient.make(InternalApi, { baseUrl });
		const status = yield* api.Telemetry.status();
		if (Option.isNone(status)) {
			return Layer.empty;
		}
		const {
			serviceName,
			signals,
			compression,
			exportIntervals,
			maxBatchSizes,
			metricsTemporality,
			resourceAttributes,
		} = status.value;
		// Keep each page's metric series apart, because every page shares the service name
		const resource = {
			serviceName,
			attributes: Record.set(
				resourceAttributes,
				"service.instance.id",
				yield* random.uuidV4(),
			),
		};
		const tracer = signals.includes("traces")
			? OtlpTracer.layer({
					url: yield* signalUrl(baseUrl, "traces"),
					resource,
					compression: compression.traces,
					exportInterval: Option.getOrUndefined(exportIntervals.traces),
					maxBatchSize: Option.getOrUndefined(maxBatchSizes.traces),
				})
			: Layer.empty;
		const logger = signals.includes("logs")
			? OtlpLogger.layer({
					url: yield* signalUrl(baseUrl, "logs"),
					resource,
					compression: compression.logs,
					exportInterval: Option.getOrUndefined(exportIntervals.logs),
					maxBatchSize: Option.getOrUndefined(maxBatchSizes.logs),
				})
			: Layer.empty;
		const metrics = signals.includes("metrics")
			? OtlpMetrics.layer({
					url: yield* signalUrl(baseUrl, "metrics"),
					resource,
					compression: compression.metrics,
					exportInterval: Option.getOrUndefined(exportIntervals.metrics),
					temporality: metricsTemporality,
				})
			: Layer.empty;
		return Layer.mergeAll(tracer, logger, metrics).pipe(
			Layer.provide(OtlpSerialization.layerProtobuf),
			Layer.provide(FetchHttpClient.layer),
		);
	},
	Effect.catchTag(
		[
			"HttpClientError",
			"SchemaError",
			"Unauthorized",
			"InternalServerError",
			"IllegalArgumentError",
		],
		() => Effect.succeed(Layer.empty),
	),
	Effect.satisfiesErrorType<never>(),
	Effect.provideService(HttpClient.TracerDisabledWhen, () => true),
);

export const otlpTelemetry = (baseUrl?: string) =>
	Layer.effectContext(
		makeOtlpLayer(baseUrl).pipe(Effect.flatMap(Layer.build)),
	).pipe(
		Layer.provide(
			Layer.mergeAll(
				Path.layer,
				FetchHttpClient.layer,
				SecureRandom.layerWebCrypto,
			),
		),
	);
