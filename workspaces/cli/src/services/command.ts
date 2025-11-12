import { Effect, Data } from "effect";
import { Command as PlatformCommand } from "@effect/platform";

export class CommandError extends Data.TaggedError("CommandError")<{
	readonly message: string;
	readonly command: string;
	readonly exitCode?: number;
}> {}

export class CommandService extends Effect.Service<CommandService>()(
	"CommandService",
	{
		sync: () => ({
			exec: (
				cmd: string,
				args: ReadonlyArray<string>,
				options?: { cwd?: string },
			) =>
				Effect.gen(function* () {
					let command = PlatformCommand.make(cmd, ...args);
					if (options?.cwd) {
						command = PlatformCommand.workingDirectory(command, options.cwd);
					}

					const exitCode = yield* PlatformCommand.exitCode(command).pipe(
						Effect.mapError(
							() =>
								new CommandError({
									message: `Command execution failed`,
									command: `${cmd} ${args.join(" ")}`,
								}),
						),
					);

					if (exitCode !== 0) {
						return yield* Effect.fail(
							new CommandError({
								message: `Command failed with exit code ${exitCode}`,
								command: `${cmd} ${args.join(" ")}`,
								exitCode,
							}),
						);
					}
				}),

			string: (
				cmd: string,
				args: ReadonlyArray<string>,
				options?: { cwd?: string },
			) =>
				Effect.gen(function* () {
					let command = PlatformCommand.make(cmd, ...args);
					if (options?.cwd) {
						command = PlatformCommand.workingDirectory(command, options.cwd);
					}

					return yield* PlatformCommand.string(command).pipe(
						Effect.mapError(
							() =>
								new CommandError({
									message: `Command execution failed`,
									command: `${cmd} ${args.join(" ")}`,
								}),
						),
					);
				}),
		}),
	},
) {}
