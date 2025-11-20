import { ConfigProvider, Effect, Layer, Logger, LogLevel } from "effect";
import { describe, expect, it } from "vitest";

import { withSpanProcessorLive } from "./span-logger.js";

describe("withSpanProcessorLive", () => {
	const configLayerDisabled = Layer.setConfigProvider(
		ConfigProvider.fromMap(new Map([["LOG_SPAN", "false"]])),
	);

	const configLayerEnabled = Layer.setConfigProvider(
		ConfigProvider.fromMap(new Map([["LOG_SPAN", "true"]])),
	);

	describe("when disabled", () => {
		it("runs effect unchanged", async () => {
			const program = Effect.gen(function* () {
				const result = yield* withSpanProcessorLive(Effect.succeed(42));
				return result;
			}).pipe(Effect.provide(configLayerDisabled));

			const result = await Effect.runPromise(program);
			expect(result).toBe(42);
		});
	});

	describe("when enabled", () => {
		it("logs span start and successful completion", async () => {
			const logs: string[] = [];
			const testLogger = Logger.make(({ message }) => {
				logs.push(String(message));
			});

			const innerSpan = Effect.fn("innerSpan")(function* () {
				yield* Effect.succeed(42);
			});

			const program = withSpanProcessorLive(innerSpan()).pipe(
				Logger.withMinimumLogLevel(LogLevel.Trace),
				Effect.provide(Layer.merge(configLayerEnabled, Logger.add(testLogger))),
			);

			await Effect.runPromise(program);

			expect(
				logs.some((log) => log.includes("▶️") && log.includes("innerSpan")),
			).toBe(true);
			expect(
				logs.some((log) => log.includes("✅") && log.includes("innerSpan")),
			).toBe(true);
		});

		it("logs span start and error completion when span fails", async () => {
			const logs: string[] = [];
			const testLogger = Logger.make(({ message }) => {
				logs.push(String(message));
			});

			const failingSpan = Effect.fn("failingSpan")(function* () {
				return yield* Effect.fail(new Error("test error"));
			});

			const program = withSpanProcessorLive(failingSpan()).pipe(
				Logger.withMinimumLogLevel(LogLevel.Trace),
				Effect.provide(Layer.merge(configLayerEnabled, Logger.add(testLogger))),
				Effect.catchAllCause(() => Effect.void),
			);

			await Effect.runPromise(program);

			expect(
				logs.some((log) => log.includes("▶️") && log.includes("failingSpan")),
			).toBe(true);
			expect(
				logs.some(
					(log) =>
						log.includes("❌") &&
						log.includes("failingSpan") &&
						log.includes("test error"),
				),
			).toBe(true);
		});
	});
});
