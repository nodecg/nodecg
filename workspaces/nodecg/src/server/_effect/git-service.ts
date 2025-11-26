import nodeFs from "node:fs";

import { FileSystem, Path } from "@effect/platform";
import { NodeFileSystem, NodePath } from "@effect/platform-node";
import { Array, Data, DateTime, Effect, Match, Option } from "effect";
import git from "isomorphic-git";

export class GitBranchReadError extends Data.TaggedError("GitBranchReadError")<{
	path: string;
	cause: unknown;
}> {
	override readonly message = `Failed to read git branch for repository at ${this.path}`;
}

export class GitHeadReadError extends Data.TaggedError("GitHeadReadError")<{
	path: string;
	cause: unknown;
}> {
	override readonly message = `Failed to read git HEAD for repository at ${this.path}`;
}

export class GitDateParseError extends Data.TaggedError("GitDateParseError")<{
	path: string;
	timestamp: number;
}> {
	override readonly message = `Failed to parse git commit date (timestamp: ${this.timestamp}) for repository at ${this.path}`;
}

export class GitService extends Effect.Service<GitService>()("GitService", {
	effect: Effect.gen(function* () {
		const fs = yield* FileSystem.FileSystem;
		const path = yield* Path.Path;

		const getGitHead = Effect.fn("GitService.getGitHead")(function* (
			bundlePath: string,
		) {
			const gitDir = path.join(bundlePath, ".git");

			const hasGitDir = yield* fs.exists(gitDir);
			if (!hasGitDir) {
				return Option.none();
			}

			// currentBranch returns undefined for detached HEAD, null for errors
			const branch = yield* Effect.tryPromise({
				try: () => git.currentBranch({ fs: nodeFs, dir: bundlePath }),
				catch: (cause) => new GitBranchReadError({ path: bundlePath, cause }),
			}).pipe(
				Effect.map((branch) =>
					Match.value(branch).pipe(
						Match.when(Match.string, (branch) => Option.some(branch)),
						Match.orElse(() => Option.none()),
					),
				),
			);

			// Get HEAD commit
			// git.log throws NotFoundError when there are no commits
			const headCommit = yield* Effect.tryPromise({
				try: async () =>
					Array.head(await git.log({ fs: nodeFs, dir: bundlePath, depth: 1 })),
				catch: (cause) => ({ cause }),
			}).pipe(
				Effect.catchIf(
					({ cause }) => cause instanceof git.Errors.NotFoundError,
					() => Effect.succeed(Option.none()),
				),
				Effect.mapError(
					({ cause }) => new GitHeadReadError({ path: bundlePath, cause }),
				),
			);

			if (Option.isNone(headCommit)) {
				return Option.none();
			}

			const commit = headCommit.value;
			const hash = commit.oid;
			const shortHash = hash.slice(0, 7);
			const timestamp = commit.commit.committer.timestamp;
			const date = yield* DateTime.make(timestamp * 1000).pipe(
				Option.match({
					onSome: (dt) => Effect.succeed(DateTime.formatIso(dt)),
					onNone: () => new GitDateParseError({ path: bundlePath, timestamp }),
				}),
			);
			const message = commit.commit.message;

			return Option.some({
				hash,
				shortHash,
				date,
				message,
				branch,
			});
		});

		return { getGitHead };
	}),
	dependencies: [NodeFileSystem.layer, NodePath.layer],
}) {}
