import { Config, Effect, Logger, LogLevel } from "effect";

export const withLogLevelConfig = Effect.fn(function* <A, E, R>(
	effect: Effect.Effect<A, E, R>,
) {
	const logLevel = yield* Config.logLevel("LOG_LEVEL").pipe(
		Config.withDefault(LogLevel.Info),
	);
	return yield* Logger.withMinimumLogLevel(effect, logLevel);
});
