import {
	Array,
	Config,
	Duration,
	Effect,
	Number,
	pipe,
	Runtime,
	String,
} from "effect";

export const withSpanProcessorLive = Effect.fn(function* <A, E, R>(
	effect: Effect.Effect<A, E, R>,
) {
	const enabled = yield* Config.boolean("LOG_SPAN").pipe(
		Config.withDefault(false),
	);
	if (!enabled) {
		return yield* effect;
	}

	const { NodeSdk } = yield* Effect.promise(
		() => import("@effect/opentelemetry"),
	);
	const { SpanStatusCode } = yield* Effect.promise(
		() => import("@opentelemetry/api"),
	);

	const runtime = yield* Effect.runtime<never>();

	const layer = NodeSdk.layer(() => ({
		resource: { serviceName: "nodecg" },
		spanProcessor: {
			forceFlush: () => Promise.resolve(),
			onStart: (span) => {
				Runtime.runSync(runtime, Effect.logTrace(`▶️  ${span.name}`));
			},
			onEnd: (span) => {
				const formattedDuration = pipe(
					span.duration,
					Duration.toMillis,
					Number.round(0),
					Duration.millis,
					Duration.format,
					String.split(" "),
					Array.take(2),
					Array.join(" "),
				);
				const status = span.status.code === SpanStatusCode.ERROR ? "❌" : "✅";
				let log = `${status} ${span.name} (${formattedDuration})`;
				if (span.status.code === SpanStatusCode.ERROR) {
					log += ` ${span.status.message}`;
				}
				Runtime.runSync(runtime, Effect.logTrace(log));
			},
			shutdown: () => Promise.resolve(),
		},
	}));

	return yield* Effect.provide(effect, layer);
});
