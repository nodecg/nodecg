import { ConfigProvider, Effect, Layer, Logger, LogLevel } from "effect";
import { describe, expect, it } from "vitest";

import { withSpanProcessorLive } from "./span-logger.js";
import { testEffect } from "./test-effect.js";

describe("withSpanProcessorLive", () => {
	const configLayerDisabled = Layer.setConfigProvider(
		ConfigProvider.fromMap(new Map([["LOG_SPAN", "false"]])),
	);

	const configLayerEnabled = Layer.setConfigProvider(
		ConfigProvider.fromMap(new Map([["LOG_SPAN", "true"]])),
	);

	describe("when disabled", () => {
		it(
			"runs effect unchanged",
			testEffect(
				Effect.gen(function* () {
					const result = yield* withSpanProcessorLive(Effect.succeed(42));
					expect(result).toBe(42);
				}).pipe(Effect.provide(configLayerDisabled)),
			),
		);
	});

	describe("when enabled", () => {
		it(
			"logs span start and successful completion",
			testEffect(
				Effect.gen(function* () {
					const logs: string[] = [];
					const testLogger = Logger.make(({ message }) => {
						logs.push(String(message));
					});

					const innerSpan = Effect.fn("innerSpan")(function* () {
						yield* Effect.succeed(42);
					});

					yield* withSpanProcessorLive(innerSpan()).pipe(
						Logger.withMinimumLogLevel(LogLevel.Trace),
						Effect.provide(Logger.add(testLogger)),
					);

					expect(
						logs.some((log) => log.includes("▶️") && log.includes("innerSpan")),
					).toBe(true);
					expect(
						logs.some((log) => log.includes("✅") && log.includes("innerSpan")),
					).toBe(true);
				}).pipe(Effect.provide(configLayerEnabled)),
			),
		);

		it(
			"logs span start and error completion when span fails",
			testEffect(
				Effect.gen(function* () {
					const logs: string[] = [];
					const testLogger = Logger.make(({ message }) => {
						logs.push(String(message));
					});

					const failingSpan = Effect.fn("failingSpan")(function* () {
						return yield* Effect.fail(new Error("test error"));
					});

					yield* withSpanProcessorLive(failingSpan()).pipe(
						Logger.withMinimumLogLevel(LogLevel.Trace),
						Effect.provide(Logger.add(testLogger)),
						Effect.catchAllCause(() => Effect.void),
					);

					expect(
						logs.some(
							(log) => log.includes("▶️") && log.includes("failingSpan"),
						),
					).toBe(true);
					expect(
						logs.some(
							(log) =>
								log.includes("❌") &&
								log.includes("failingSpan") &&
								log.includes("test error"),
						),
					).toBe(true);
				}).pipe(Effect.provide(configLayerEnabled)),
			),
		);
	});
});
