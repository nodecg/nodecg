import { describe, it, expect } from "vitest";
import { Effect, Ref, Layer } from "effect";
import { TerminalService } from "../../src/services/terminal.js";
import { runEffect } from "../helpers/test-runner.js";
import { MockTerminalServiceLayer } from "../helpers/mock-services.js";

describe("TerminalService", () => {
	describe("write methods", () => {
		it("should write plain message", async () => {
			const effect = Effect.gen(function* () {
				const terminal = yield* TerminalService;
				yield* terminal.write("Hello");
			});

			const testLayer = MockTerminalServiceLayer();
			await runEffect(effect, testLayer);
		});

		it("should write line with newline", async () => {
			const effect = Effect.gen(function* () {
				const terminal = yield* TerminalService;
				yield* terminal.writeLine("Hello");
			});

			const testLayer = MockTerminalServiceLayer();
			await runEffect(effect, testLayer);
		});

		it("should write success message", async () => {
			const effect = Effect.gen(function* () {
				const terminal = yield* TerminalService;
				yield* terminal.writeSuccess("Operation completed");
			});

			const testLayer = MockTerminalServiceLayer();
			await runEffect(effect, testLayer);
		});

		it("should write error message", async () => {
			const effect = Effect.gen(function* () {
				const terminal = yield* TerminalService;
				yield* terminal.writeError("Something went wrong");
			});

			const testLayer = MockTerminalServiceLayer();
			await runEffect(effect, testLayer);
		});

		it("should write info message", async () => {
			const effect = Effect.gen(function* () {
				const terminal = yield* TerminalService;
				yield* terminal.writeInfo("Information");
			});

			const testLayer = MockTerminalServiceLayer();
			await runEffect(effect, testLayer);
		});
	});

	describe("colored output", () => {
		it("should write colored message with green", async () => {
			const effect = Effect.gen(function* () {
				const terminal = yield* TerminalService;
				yield* terminal.writeColored("Success", "green");
			});

			const testLayer = MockTerminalServiceLayer();
			await runEffect(effect, testLayer);
		});

		it("should write colored message with red", async () => {
			const effect = Effect.gen(function* () {
				const terminal = yield* TerminalService;
				yield* terminal.writeColored("Error", "red");
			});

			const testLayer = MockTerminalServiceLayer();
			await runEffect(effect, testLayer);
		});

		it("should write colored message with cyan", async () => {
			const effect = Effect.gen(function* () {
				const terminal = yield* TerminalService;
				yield* terminal.writeColored("Info", "cyan");
			});

			const testLayer = MockTerminalServiceLayer();
			await runEffect(effect, testLayer);
		});

		it("should write colored message with magenta", async () => {
			const effect = Effect.gen(function* () {
				const terminal = yield* TerminalService;
				yield* terminal.writeColored("Warning", "magenta");
			});

			const testLayer = MockTerminalServiceLayer();
			await runEffect(effect, testLayer);
		});
	});

	describe("confirm", () => {
		it("should return true for confirmation", async () => {
			const effect = Effect.gen(function* () {
				const terminal = yield* TerminalService;
				const result = yield* terminal.confirm("Are you sure?");
				return result;
			});

			const testLayer = MockTerminalServiceLayer();
			const result = await runEffect(effect, testLayer);
			expect(result).toBe(true);
		});

		it("should return false when user declines", async () => {
			// Create a custom mock layer that returns false for confirm
			const testLayer = Layer.effect(
				TerminalService,
				Effect.gen(function* () {
					const output = yield* Ref.make<string[]>([]);

					return TerminalService.make({
						write: Effect.fn("write")(function* (message: string) {
							yield* Ref.update(output, (lines) => [...lines, message]);
						}),

						writeLine: Effect.fn("writeLine")(function* (message: string) {
							yield* Ref.update(output, (lines) => [...lines, message + "\n"]);
						}),

						writeSuccess: Effect.fn("writeSuccess")(function* (message: string) {
							yield* Ref.update(output, (lines) => [...lines, `[SUCCESS] ${message}`]);
						}),

						writeError: Effect.fn("writeError")(function* (message: string) {
							yield* Ref.update(output, (lines) => [...lines, `[ERROR] ${message}`]);
						}),

						writeInfo: Effect.fn("writeInfo")(function* (message: string) {
							yield* Ref.update(output, (lines) => [...lines, `[INFO] ${message}`]);
						}),

						writeColored: Effect.fn("writeColored")(function* (message: string, _color: string) {
							yield* Ref.update(output, (lines) => [...lines, message]);
						}),

						confirm: Effect.fn("confirm")(function* (_message: string) {
							return false;
						}),

						readLine: Effect.fn("readLine")(function* () {
							return "test input";
						}),
					});
				}),
			);

			const effect = Effect.gen(function* () {
				const terminal = yield* TerminalService;
				const result = yield* terminal.confirm("Are you sure?");
				return result;
			});

			const result = await runEffect(effect, testLayer);
			expect(result).toBe(false);
		});
	});

	describe("readLine", () => {
		it("should read input line", async () => {
			const effect = Effect.gen(function* () {
				const terminal = yield* TerminalService;
				const result = yield* terminal.readLine();
				return result;
			});

			const testLayer = MockTerminalServiceLayer();
			const result = await runEffect(effect, testLayer);
			expect(result).toBe("test input");
		});
	});

	describe("Effect.fn usage", () => {
		it("should allow calling methods multiple times", async () => {
			const effect = Effect.gen(function* () {
				const terminal = yield* TerminalService;
				// Call write methods multiple times
				yield* terminal.write("Message 1");
				yield* terminal.write("Message 2");
				yield* terminal.writeLine("Line 1");
				yield* terminal.writeLine("Line 2");
				yield* terminal.writeSuccess("Success 1");
				yield* terminal.writeError("Error 1");
				yield* terminal.writeInfo("Info 1");
				yield* terminal.writeColored("Color 1", "green");
				yield* terminal.writeColored("Color 2", "red");
				// Call readLine multiple times
				const input1 = yield* terminal.readLine();
				const input2 = yield* terminal.readLine();
				return { input1, input2 };
			});

			const testLayer = MockTerminalServiceLayer();
			const { input1, input2 } = await runEffect(effect, testLayer);
			expect(input1).toBe("test input");
			expect(input2).toBe("test input");
		});
	});
});
