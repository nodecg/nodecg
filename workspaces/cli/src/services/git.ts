import { Effect, Data } from "effect";
import { CommandService } from "./command.js";

export class GitError extends Data.TaggedError("GitError")<{
	readonly message: string;
	readonly operation: string;
}> {}

export class GitService extends Effect.Service<GitService>()("GitService", {
	effect: Effect.gen(function* () {
		const cmd = yield* CommandService;

		return {
			checkAvailable: Effect.fn("checkAvailable")(function* () {
				yield* cmd.exec("git", ["--version"]).pipe(
					Effect.mapError(
						() =>
							new GitError({
								message: "git is not available in PATH",
								operation: "check",
							}),
					),
				);
			}),

			clone: Effect.fn("clone")(function* (url: string, destination: string) {
				yield* cmd.exec("git", ["clone", url, destination]).pipe(
					Effect.mapError(
						() =>
							new GitError({
								message: `Failed to clone ${url}`,
								operation: "clone",
							}),
					),
				);
			}),

			checkout: Effect.fn("checkout")(function* (version: string, cwd: string) {
				yield* cmd.exec("git", ["checkout", version], { cwd }).pipe(
					Effect.mapError(
						() =>
							new GitError({
								message: `Failed to checkout ${version}`,
								operation: "checkout",
							}),
					),
				);
			}),

			listRemoteTags: Effect.fn("listRemoteTags")(function* (repoUrl: string) {
				const stdout = yield* cmd
					.string("git", ["ls-remote", "--refs", "--tags", repoUrl])
					.pipe(
						Effect.mapError(
							() =>
								new GitError({
									message: `Failed to list tags for ${repoUrl}`,
									operation: "ls-remote",
								}),
						),
					);

				return stdout
					.trim()
					.split("\n")
					.map((line) => line.split("refs/tags/").at(-1))
					.filter((tag): tag is string => typeof tag === "string");
			}),
		};
	}),
	dependencies: [CommandService.Default],
}) {}
