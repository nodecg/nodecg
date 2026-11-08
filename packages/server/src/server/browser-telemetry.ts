import { InternalApi, TelemetrySignal } from "@nodecg/internal";
import {
	Config,
	ConfigProvider,
	Context,
	Duration,
	Effect,
	Layer,
	Option,
	Schema,
	SchemaTransformation,
} from "effect";
import type { Digest } from "effect/crypto";
import {
	HttpMiddleware,
	HttpRouter,
	HttpServerRequest,
	HttpServerResponse,
} from "effect/http";
import { OtlpProxy, OtlpResource } from "effect/observability";

import { readSessionToken, resolveSessionCaller } from "../auth/identity.ts";
import type { RoleLinks } from "../auth/role-links.ts";
import type { ConfiguredSuperadmins } from "../configured-superadmins.ts";
import { config } from "../server-config.ts";
import type { SessionRepositoryService } from "../services/repository/session/session-repository.ts";
import { OtlpDefaults } from "../telemetry.ts";

export const OtlpEnvironment = Context.Reference<ConfigProvider.ConfigProvider>(
	"OtlpEnvironment",
	{ defaultValue: () => ConfigProvider.fromEnvRecord({}) },
);

const otlpEnvironmentLayer = ConfigProvider.layer(
	Effect.service(OtlpEnvironment),
);

const otelFallbackEndpoint = Config.NonEmptyString(
	"OTEL_EXPORTER_OTLP_ENDPOINT",
);

const otelFallbackCompression = Config.Literals(
	["gzip", "none"],
	"OTEL_EXPORTER_OTLP_COMPRESSION",
);

const ExporterName = Schema.Trim.pipe(
	Schema.decodeTo(Schema.String, SchemaTransformation.toLowerCase()),
);

// https://opentelemetry.io/docs/specs/otel/configuration/sdk-environment-variables/
// https://opentelemetry.io/docs/specs/otel/protocol/exporter/
const otlpConfig = Config.all({
	endpoints: Config.all({
		traces: Config.NonEmptyString("OTEL_EXPORTER_OTLP_TRACES_ENDPOINT").pipe(
			Config.orElse(() => otelFallbackEndpoint),
			Config.option,
		),
		logs: Config.NonEmptyString("OTEL_EXPORTER_OTLP_LOGS_ENDPOINT").pipe(
			Config.orElse(() => otelFallbackEndpoint),
			Config.option,
		),
		metrics: Config.NonEmptyString("OTEL_EXPORTER_OTLP_METRICS_ENDPOINT").pipe(
			Config.orElse(() => otelFallbackEndpoint),
			Config.option,
		),
	}),
	exporters: Config.all({
		traces: Config.Array(ExporterName, "OTEL_TRACES_EXPORTER"),
		logs: Config.Array(ExporterName, "OTEL_LOGS_EXPORTER"),
		metrics: Config.Array(ExporterName, "OTEL_METRICS_EXPORTER"),
	}),
	compression: Config.all({
		traces: Config.Literals(
			["gzip", "none"],
			"OTEL_EXPORTER_OTLP_TRACES_COMPRESSION",
		).pipe(
			Config.orElse(() => otelFallbackCompression),
			Config.withDefault("none"),
		),
		logs: Config.Literals(
			["gzip", "none"],
			"OTEL_EXPORTER_OTLP_LOGS_COMPRESSION",
		).pipe(
			Config.orElse(() => otelFallbackCompression),
			Config.withDefault("none"),
		),
		metrics: Config.Literals(
			["gzip", "none"],
			"OTEL_EXPORTER_OTLP_METRICS_COMPRESSION",
		).pipe(
			Config.orElse(() => otelFallbackCompression),
			Config.withDefault("none"),
		),
	}),
	exportIntervals: Config.all({
		traces: Config.Int("OTEL_BSP_SCHEDULE_DELAY").pipe(
			Config.map(Duration.millis),
			Config.option,
		),
		logs: Config.Int("OTEL_BLRP_SCHEDULE_DELAY").pipe(
			Config.map(Duration.millis),
			Config.option,
		),
		metrics: Config.Int("OTEL_METRIC_EXPORT_INTERVAL").pipe(
			Config.map(Duration.millis),
			Config.option,
		),
	}),
	maxBatchSizes: Config.all({
		traces: Config.option(Config.Int("OTEL_BSP_MAX_EXPORT_BATCH_SIZE")),
		logs: Config.option(Config.Int("OTEL_BLRP_MAX_EXPORT_BATCH_SIZE")),
	}),
	metricsTemporality: Config.Literals(
		["delta", "cumulative"],
		"OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE",
	).pipe(Config.withDefault("cumulative")),
	resourceAttributes: Config.Record(
		Schema.StringFromUriComponent,
		Schema.StringFromUriComponent,
		"OTEL_RESOURCE_ATTRIBUTES",
		{ trim: true, keepEmptyValues: true },
	).pipe(Config.withDefault({})),
	sdkDisabled: Config.Boolean("OTEL_SDK_DISABLED").pipe(
		Config.withDefault(false),
	),
});

export class BrowserTelemetry extends Context.Service<BrowserTelemetry>()(
	"BrowserTelemetry",
	{
		make: Effect.gen(function* () {
			const {
				sdkDisabled,
				endpoints,
				exporters,
				compression,
				exportIntervals,
				maxBatchSizes,
				metricsTemporality,
				resourceAttributes,
			} = yield* otlpConfig;
			if (sdkDisabled) {
				return Option.none();
			}
			const signals = TelemetrySignal.literals.filter(
				(signal) =>
					Option.isSome(endpoints[signal]) &&
					exporters[signal].includes("otlp"),
			);
			const resource = yield* OtlpResource.fromConfig();
			return Option.some({
				serviceName: `${OtlpResource.serviceNameUnsafe(resource)}-browser`,
				signals,
				compression,
				exportIntervals,
				maxBatchSizes,
				metricsTemporality,
				resourceAttributes,
			});
		}),
	},
) {
	static layer = Layer.effect(this, this.make).pipe(
		Layer.provide(OtlpDefaults.pipe(Layer.provide(otlpEnvironmentLayer))),
	);
}

const requireExportedSignal = HttpRouter.middleware(
	Effect.gen(function* () {
		const telemetry = yield* BrowserTelemetry;
		const signals = telemetry.pipe(
			Option.map(({ signals }) => signals),
			Option.getOrElse(() => []),
		);
		return (httpEffect) =>
			Effect.gen(function* () {
				const { route } = yield* HttpRouter.RouteContext;
				if (!signals.some((signal) => route.path.endsWith(`/v1/${signal}`))) {
					return HttpServerResponse.empty({ status: 404 });
				}
				return yield* httpEffect;
			});
	}),
);

const requireSession = HttpRouter.middleware(
	Effect.gen(function* () {
		const requireAuth = yield* config.requireAuth;
		const context = yield* Effect.context<
			| SessionRepositoryService
			| ConfiguredSuperadmins
			| RoleLinks
			| Digest.Digest
		>();
		return (httpEffect) =>
			Effect.gen(function* () {
				if (!requireAuth) {
					return yield* httpEffect;
				}
				const caller = yield* resolveSessionCaller(
					yield* readSessionToken,
				).pipe(Effect.provide(context));
				if (Option.isNone(caller)) {
					return HttpServerResponse.empty({ status: 401 });
				}
				return yield* httpEffect;
			}).pipe(
				Effect.catchTag("BackendError", (error) =>
					Effect.logError("Session lookup failed", error).pipe(
						Effect.as(HttpServerResponse.empty({ status: 500 })),
					),
				),
			);
	}),
);

export const disableTelemetryRouteTracing = Layer.succeed(
	HttpMiddleware.TracerDisabledWhen,
	(request) =>
		HttpServerRequest.toURL(request).pipe(
			Option.exists(({ pathname }) =>
				pathname.includes(InternalApi.groups.Telemetry.endpoints.status.path),
			),
		),
);

export const otlpProxyRoute = OtlpProxy.layerFromConfig({
	prefix: InternalApi.groups.Telemetry.endpoints.status.path,
}).pipe(
	Layer.provide(otlpEnvironmentLayer),
	Layer.provide(requireSession.layer),
	Layer.provide(requireExportedSignal.layer),
	Layer.provide(BrowserTelemetry.layer),
);
