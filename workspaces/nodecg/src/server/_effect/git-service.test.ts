import * as path from "node:path";

import { Command, FileSystem } from "@effect/platform";
import { NodeContext, NodeFileSystem } from "@effect/platform-node";
import { Chunk, Data, Effect, Layer, Option, Stream } from "effect";
import { assert, describe, expect, test } from "vitest";

import { GitService } from "./git-service.js";
import { testEffect } from "./test-effect.js";

const GitServiceLive = GitService.Default;
const TestLayer = Layer.mergeAll(
	GitServiceLive,
	NodeFileSystem.layer,
	NodeContext.layer,
);

class GitCommandError extends Data.TaggedError("GitCommandError")<{
	args: string[];
	exitCode: number;
}> {}

// Helper to run git command and return trimmed stdout (fails on non-zero exit)
const git = (...args: string[]) =>
	Effect.fn("git")(function* (cwd: string) {
		const process = yield* Command.make("git", ...args).pipe(
			Command.workingDirectory(cwd),
			Command.start,
		);
		const [stdout, exitCode] = yield* Effect.all(
			[
				process.stdout.pipe(
					Stream.decodeText(),
					Stream.runCollect,
					Effect.map((chunks) => Chunk.join(chunks, "")),
				),
				process.exitCode,
			],
			{ concurrency: "unbounded" },
		);
		if (exitCode !== 0) {
			return yield* new GitCommandError({ args, exitCode });
		}
		return stdout.trim();
	});

describe("GitService", () => {
	test(
		"returns None when no .git directory exists",
		testEffect(
			Effect.gen(function* () {
				const fsService = yield* FileSystem.FileSystem;
				const tempDir = yield* fsService.makeTempDirectoryScoped();

				const gitService = yield* GitService;
				const result = yield* gitService.getGitHead(tempDir);

				expect(Option.isNone(result)).toBe(true);
			}).pipe(Effect.provide(TestLayer)),
		),
	);

	test(
		"returns HEAD data for a valid git repository",
		testEffect(
			Effect.gen(function* () {
				const fsService = yield* FileSystem.FileSystem;
				const tempDir = yield* fsService.makeTempDirectoryScoped();

				yield* git("init")(tempDir);
				yield* git("config", "user.name", "Test User")(tempDir);
				yield* git("config", "user.email", "test@example.com")(tempDir);

				yield* fsService.writeFileString(
					path.join(tempDir, "test.txt"),
					"hello",
				);
				yield* git("add", "test.txt")(tempDir);
				yield* git("commit", "-m", "Initial commit")(tempDir);

				const gitService = yield* GitService;
				const result = yield* gitService.getGitHead(tempDir);

				assert(Option.isSome(result));
				assert(Option.isSome(result.value.branch));
				expect(["master", "main"]).toContain(result.value.branch.value);
				expect(result.value.hash).toHaveLength(40);
				expect(result.value.shortHash).toHaveLength(7);
				expect(result.value.message).toBe("Initial commit\n");
				expect(result.value.date).toMatch(/^\d{4}-\d{2}-\d{2}T/);
			}).pipe(Effect.provide(TestLayer)),
		),
	);

	test(
		"returns None when .git exists but no commits",
		testEffect(
			Effect.gen(function* () {
				const fsService = yield* FileSystem.FileSystem;
				const tempDir = yield* fsService.makeTempDirectoryScoped();

				yield* git("init")(tempDir);

				const gitService = yield* GitService;
				const result = yield* gitService.getGitHead(tempDir);

				expect(Option.isNone(result)).toBe(true);
			}).pipe(Effect.provide(TestLayer)),
		),
	);

	test(
		"returns HEAD data without branch for detached HEAD",
		testEffect(
			Effect.gen(function* () {
				const fsService = yield* FileSystem.FileSystem;
				const tempDir = yield* fsService.makeTempDirectoryScoped();

				yield* git("init")(tempDir);
				yield* git("config", "user.name", "Test User")(tempDir);
				yield* git("config", "user.email", "test@example.com")(tempDir);

				yield* fsService.writeFileString(
					path.join(tempDir, "test.txt"),
					"hello",
				);
				yield* git("add", "test.txt")(tempDir);
				yield* git("commit", "-m", "Initial commit")(tempDir);

				const commitHash = yield* git("rev-parse", "HEAD")(tempDir);

				// Checkout the commit directly (detached HEAD)
				yield* git("checkout", commitHash)(tempDir);

				const gitService = yield* GitService;
				const result = yield* gitService.getGitHead(tempDir);

				assert(Option.isSome(result));
				expect(Option.isNone(result.value.branch)).toBe(true);
				expect(result.value.hash).toBe(commitHash);
				expect(result.value.shortHash).toHaveLength(7);
				expect(result.value.message).toBe("Initial commit\n");
			}).pipe(Effect.provide(TestLayer)),
		),
	);

	test(
		"fails with GitBranchReadError when .git/HEAD is corrupted",
		testEffect(
			Effect.gen(function* () {
				const fsService = yield* FileSystem.FileSystem;
				const tempDir = yield* fsService.makeTempDirectoryScoped();

				// Create .git directory with corrupted HEAD
				yield* git("init")(tempDir);
				yield* fsService.writeFileString(
					path.join(tempDir, ".git", "HEAD"),
					"invalid content",
				);

				const gitService = yield* GitService;
				const result = yield* gitService.getGitHead(tempDir).pipe(Effect.flip);

				assert(result._tag === "GitBranchReadError");
				expect(result.path).toBe(tempDir);
			}).pipe(Effect.provide(TestLayer)),
		),
	);

	test(
		"fails with GitHeadReadError when object data is corrupted",
		testEffect(
			Effect.gen(function* () {
				const fsService = yield* FileSystem.FileSystem;
				const tempDir = yield* fsService.makeTempDirectoryScoped();

				yield* git("init")(tempDir);
				yield* git("config", "user.name", "Test User")(tempDir);
				yield* git("config", "user.email", "test@example.com")(tempDir);

				yield* fsService.writeFileString(
					path.join(tempDir, "test.txt"),
					"hello",
				);
				yield* git("add", "test.txt")(tempDir);
				yield* git("commit", "-m", "Initial commit")(tempDir);

				const commitHash = yield* git("rev-parse", "HEAD")(tempDir);

				// Corrupt the commit object by overwriting it with invalid data
				// Real git creates objects as read-only, so we need to make it writable first
				const objectDir = path.join(
					tempDir,
					".git",
					"objects",
					commitHash.slice(0, 2),
				);
				const objectFile = path.join(objectDir, commitHash.slice(2));
				yield* fsService.chmod(objectFile, 0o644);
				yield* fsService.writeFileString(objectFile, "corrupted data");

				const gitService = yield* GitService;
				const result = yield* gitService.getGitHead(tempDir).pipe(Effect.flip);

				assert(result._tag === "GitHeadReadError");
				expect(result.path).toBe(tempDir);
			}).pipe(Effect.provide(TestLayer)),
		),
	);
});
