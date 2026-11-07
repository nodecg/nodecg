import {
	ConfigProvider,
	Effect,
	FileSystem,
	Layer,
	Option,
	Path,
	Schema,
} from "effect";
import { FetchHttpClient } from "effect/http";
import { Otlp, OtlpSerialization } from "effect/observability";

import { findPackageRoot } from "./package-root.ts";

const decodePackageJson = Schema.decodeEffect(
	Schema.fromJsonString(
		Schema.Struct({
			name: Schema.OptionFromOptionalNullOr(Schema.NonEmptyString),
		}),
	),
);

const readProject = Effect.fn(
	function* () {
		const fs = yield* FileSystem.FileSystem;
		const path = yield* Path.Path;
		const root = yield* findPackageRoot(path.resolve()).pipe(
			Effect.flatMap(Effect.fromOption),
		);
		const text = yield* fs.readFileString(path.join(root, "package.json"));
		return yield* decodePackageJson(text);
	},
	Effect.catchTag(["NoSuchElementError", "PlatformError", "SchemaError"], () =>
		Effect.succeed({ name: Option.none() }),
	),
);

export const OtlpDefaults = ConfigProvider.layerAdd(
	readProject().pipe(
		Effect.map(({ name }) =>
			ConfigProvider.fromEnvRecord({
				OTEL_SERVICE_NAME: name.pipe(Option.getOrElse(() => "nodecg")),
				OTEL_TRACES_EXPORTER: "otlp",
				OTEL_LOGS_EXPORTER: "otlp",
				OTEL_METRICS_EXPORTER: "otlp",
			}),
		),
	),
);

export const OtlpTelemetry = Otlp.layerFromConfig().pipe(
	Layer.provide(OtlpSerialization.layerProtobuf),
	Layer.provide(FetchHttpClient.layer),
	Layer.provide(OtlpDefaults),
);
