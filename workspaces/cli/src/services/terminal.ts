import { Effect, Data } from "effect";
import { Terminal } from "@effect/platform";

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
				write: (message: string) =>
					Effect.gen(function* () {
						yield* terminal.display(message);
					}),

				writeLine: (message: string) =>
					Effect.gen(function* () {
						yield* terminal.display(message + "\n");
					}),

				writeSuccess: (message: string) =>
					Effect.gen(function* () {
						yield* terminal.display(colors.green(message) + "\n");
					}),

				writeError: (message: string) =>
					Effect.gen(function* () {
						yield* terminal.display(colors.red(message) + "\n");
					}),

				writeInfo: (message: string) =>
					Effect.gen(function* () {
						yield* terminal.display(colors.cyan(message) + "\n");
					}),

				writeColored: (
					message: string,
					color: "green" | "red" | "cyan" | "magenta",
				) =>
					Effect.gen(function* () {
						yield* terminal.display(colors[color](message));
					}),

				confirm: (message: string) =>
					Effect.gen(function* () {
						yield* terminal.display(`${message} (y/n): `);
						const input = yield* terminal.readLine.pipe(
							Effect.mapError(
								() => new TerminalError({ message: "Failed to read input" }),
							),
						);
						return (
							input.toLowerCase() === "y" || input.toLowerCase() === "yes"
						);
					}),

				readLine: () =>
					Effect.gen(function* () {
						return yield* terminal.readLine.pipe(
							Effect.mapError(
								() => new TerminalError({ message: "Failed to read input" }),
							),
						);
					}),
			};
		}),
		dependencies: [Terminal.Terminal.Default],
	},
) {}
