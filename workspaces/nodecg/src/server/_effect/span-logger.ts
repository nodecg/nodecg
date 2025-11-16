import { NodeSdk } from "@effect/opentelemetry";
import { type Context, SpanStatusCode } from "@opentelemetry/api";
import type {
	ReadableSpan,
	Span,
	SpanProcessor,
} from "@opentelemetry/sdk-trace-base";
import { BigInt, Duration, Effect, Number, Option, Runtime } from "effect";

export class SimpleSpanProcessor implements SpanProcessor {
	readonly #runtime: Runtime.Runtime<never>;

	constructor(runtime: Runtime.Runtime<never>) {
		this.#runtime = runtime;
	}

	onStart(span: Span, _parentContext: Context): void {
		Runtime.runSync(this.#runtime, Effect.logTrace(`▶️  ${span.name}`));
	}

	onEnd(span: ReadableSpan): void {
		const [seconds, nanoseconds] = span.duration;
		const nanosBigInt = BigInt.fromNumber(nanoseconds).pipe(Option.getOrThrow);
		const duration = Duration.seconds(seconds).pipe(
			Duration.sum(Duration.nanos(nanosBigInt)),
		);
		const roundedDuration = duration.pipe(
			Duration.lessThan(Duration.seconds(10)),
		)
			? duration.pipe(Duration.toMillis, Number.round(0), Duration.millis)
			: duration.pipe(Duration.toSeconds, Number.round(0), Duration.seconds);
		const formattedDuration = Duration.format(roundedDuration);
		const status = span.status.code === SpanStatusCode.ERROR ? "❌" : "✅";
		const error =
			span.status.code === SpanStatusCode.ERROR
				? ` ${span.status.message}`
				: "";
		Runtime.runSync(
			this.#runtime,
			Effect.logTrace(`${status} ${span.name} (${formattedDuration})${error}`),
		);
	}

	shutdown() {
		return Promise.resolve();
	}

	forceFlush() {
		return Promise.resolve();
	}
}

export const withSpanProcessorLive = Effect.fn(function* <A, E, R>(
	effect: Effect.Effect<A, E, R>,
) {
	const runtime = yield* Effect.runtime<never>();
	const layer = NodeSdk.layer(() => ({
		resource: { serviceName: "nodecg" },
		spanProcessor: new SimpleSpanProcessor(runtime),
	}));
	return yield* Effect.provide(effect, layer);
});
