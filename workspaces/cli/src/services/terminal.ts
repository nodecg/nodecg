import { Terminal } from "@effect/platform";
import { Data, Effect } from "effect";

export class TerminalError extends Data.TaggedError("TerminalError")<{
	readonly message: string;
}> {}

export class TerminalService extends Effect.Service<TerminalService>()(
	"TerminalService",
	{
		effect: Effect.gen(function* () {
			const terminal = yield* Terminal.Terminal;

			// ANSI color codes
			const colors = {
				green: (s: string) => `\x1b[32m${s}\x1b[0m`,
				red: (s: string) => `\x1b[31m${s}\x1b[0m`,
				cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
				magenta: (s: string) => `\x1b[35m${s}\x1b[0m`,
				bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
			};

			return {
				write: Effect.fn("write")(function* (message: string) {
					yield* terminal.display(message);
				}),

				writeLine: Effect.fn("writeLine")(function* (message: string) {
					yield* terminal.display(message + "\n");
				}),

				writeSuccess: Effect.fn("writeSuccess")(function* (message: string) {
					yield* terminal.display(colors.green(message) + "\n");
				}),

				writeError: Effect.fn("writeError")(function* (message: string) {
					yield* terminal.display(colors.red(message) + "\n");
				}),

				writeInfo: Effect.fn("writeInfo")(function* (message: string) {
					yield* terminal.display(colors.cyan(message) + "\n");
				}),

				writeColored: Effect.fn("writeColored")(function* (
					message: string,
					color: "green" | "red" | "cyan" | "magenta",
				) {
					yield* terminal.display(colors[color](message));
				}),

				confirm: Effect.fn("confirm")(function* (message: string) {
					yield* terminal.display(`${message} (y/n): `);
					const input = yield* terminal.readLine.pipe(
						Effect.mapError(
							() => new TerminalError({ message: "Failed to read input" }),
						),
					);
					return input.toLowerCase() === "y" || input.toLowerCase() === "yes";
				}),

				readLine: Effect.fn("readLine")(function* () {
					return yield* terminal.readLine.pipe(
						Effect.mapError(
							() => new TerminalError({ message: "Failed to read input" }),
						),
					);
				}),
			};
		}),
	},
) {}
