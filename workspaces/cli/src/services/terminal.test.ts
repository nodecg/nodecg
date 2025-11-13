import { it } from "@effect/vitest";
import { Effect, Layer, Ref } from "effect";
import { describe, expect } from "vitest";

import { MockTerminalServiceLayer } from "../helpers/mock-services.js";
import { TerminalService } from "./terminal.js";

describe("TerminalService", () => {
	describe("write methods", () => {
		it.effect("should write plain message", () =>
			Effect.gen(function* () {
				const terminal = yield* TerminalService;
				yield* terminal.write("Hello");
			}).pipe(Effect.provide(MockTerminalServiceLayer())),
		);

		it.effect("should write line with newline", () =>
			Effect.gen(function* () {
				const terminal = yield* TerminalService;
				yield* terminal.writeLine("Hello");
			}).pipe(Effect.provide(MockTerminalServiceLayer())),
		);

		it.effect("should write success message", () =>
			Effect.gen(function* () {
				const terminal = yield* TerminalService;
				yield* terminal.writeSuccess("Operation completed");
			}).pipe(Effect.provide(MockTerminalServiceLayer())),
		);

		it.effect("should write error message", () =>
			Effect.gen(function* () {
				const terminal = yield* TerminalService;
				yield* terminal.writeError("Something went wrong");
			}).pipe(Effect.provide(MockTerminalServiceLayer())),
		);

		it.effect("should write info message", () =>
			Effect.gen(function* () {
				const terminal = yield* TerminalService;
				yield* terminal.writeInfo("Information");
			}).pipe(Effect.provide(MockTerminalServiceLayer())),
		);
	});

	describe("colored output", () => {
		it.effect("should write colored message with green", () =>
			Effect.gen(function* () {
				const terminal = yield* TerminalService;
				yield* terminal.writeColored("Success", "green");
			}).pipe(Effect.provide(MockTerminalServiceLayer())),
		);

		it.effect("should write colored message with red", () =>
			Effect.gen(function* () {
				const terminal = yield* TerminalService;
				yield* terminal.writeColored("Error", "red");
			}).pipe(Effect.provide(MockTerminalServiceLayer())),
		);

		it.effect("should write colored message with cyan", () =>
			Effect.gen(function* () {
				const terminal = yield* TerminalService;
				yield* terminal.writeColored("Info", "cyan");
			}).pipe(Effect.provide(MockTerminalServiceLayer())),
		);

		it.effect("should write colored message with magenta", () =>
			Effect.gen(function* () {
				const terminal = yield* TerminalService;
				yield* terminal.writeColored("Warning", "magenta");
			}).pipe(Effect.provide(MockTerminalServiceLayer())),
		);
	});

	describe("confirm", () => {
		it.effect("should return true for confirmation", () =>
			Effect.gen(function* () {
				const terminal = yield* TerminalService;
				const result = yield* terminal.confirm("Are you sure?");
				expect(result).toBe(true);
			}).pipe(Effect.provide(MockTerminalServiceLayer())),
		);

		it.effect("should return false when user declines", () =>
			Effect.gen(function* () {
				const terminal = yield* TerminalService;
				const result = yield* terminal.confirm("Are you sure?");
				expect(result).toBe(false);
			}).pipe(
				Effect.provide(
					Layer.effect(
						TerminalService,
						Effect.gen(function* () {
							const output = yield* Ref.make<string[]>([]);

							return TerminalService.make({
								write: Effect.fn("write")(function* (message: string) {
									yield* Ref.update(output, (lines) => [...lines, message]);
								}),

								writeLine: Effect.fn("writeLine")(function* (message: string) {
									yield* Ref.update(output, (lines) => [
										...lines,
										message + "\n",
									]);
								}),

								writeSuccess: Effect.fn("writeSuccess")(function* (
									message: string,
								) {
									yield* Ref.update(output, (lines) => [
										...lines,
										`[SUCCESS] ${message}`,
									]);
								}),

								writeError: Effect.fn("writeError")(function* (
									message: string,
								) {
									yield* Ref.update(output, (lines) => [
										...lines,
										`[ERROR] ${message}`,
									]);
								}),

								writeInfo: Effect.fn("writeInfo")(function* (message: string) {
									yield* Ref.update(output, (lines) => [
										...lines,
										`[INFO] ${message}`,
									]);
								}),

								writeColored: Effect.fn("writeColored")(function* (
									message: string,
									_color: string,
								) {
									yield* Ref.update(output, (lines) => [...lines, message]);
								}),

								confirm: Effect.fn("confirm")((_message: string) =>
									Effect.succeed(false),
								),

								readLine: Effect.fn("readLine")(() =>
									Effect.succeed("test input"),
								),
							});
						}),
					),
				),
			),
		);
	});

	describe("readLine", () => {
		it.effect("should read input line", () =>
			Effect.gen(function* () {
				const terminal = yield* TerminalService;
				const result = yield* terminal.readLine();
				expect(result).toBe("test input");
			}).pipe(Effect.provide(MockTerminalServiceLayer())),
		);
	});

	describe("Effect.fn usage", () => {
		it.effect("should allow calling methods multiple times", () =>
			Effect.gen(function* () {
				const terminal = yield* TerminalService;
				yield* terminal.write("Message 1");
				yield* terminal.write("Message 2");
				yield* terminal.writeLine("Line 1");
				yield* terminal.writeLine("Line 2");
				yield* terminal.writeSuccess("Success 1");
				yield* terminal.writeError("Error 1");
				yield* terminal.writeInfo("Info 1");
				yield* terminal.writeColored("Color 1", "green");
				yield* terminal.writeColored("Color 2", "red");
				const input1 = yield* terminal.readLine();
				const input2 = yield* terminal.readLine();
				expect(input1).toBe("test input");
				expect(input2).toBe("test input");
			}).pipe(Effect.provide(MockTerminalServiceLayer())),
		);
	});
});
