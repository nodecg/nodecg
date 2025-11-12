import { describe, it, expect } from "vitest";
import { Effect, Layer } from "effect";
import { GitService, GitError } from "../../src/services/git.js";
import { runEffect, runEffectExpectError } from "../helpers/test-runner.js";
import { MockCommandServiceLayer, MockGitServiceLayer } from "../helpers/mock-services.js";

describe("GitService", () => {
	describe("checkAvailable", () => {
		it("should succeed when git is available", async () => {
			const effect = Effect.gen(function* () {
				const git = yield* GitService;
				yield* git.checkAvailable();
			});

			const testLayer = MockGitServiceLayer();
			await runEffect(effect, testLayer);
		});
	});

	describe("clone", () => {
		it("should execute git clone command", async () => {
			const effect = Effect.gen(function* () {
				const git = yield* GitService;
				yield* git.clone("https://github.com/test/repo.git", "/tmp/test-repo");
			});

			const testLayer = MockGitServiceLayer();

			await runEffect(effect, testLayer);
		});
	});

	describe("checkout", () => {
		it("should execute git checkout command", async () => {
			const effect = Effect.gen(function* () {
				const git = yield* GitService;
				yield* git.checkout("v1.0.0", "/tmp/test-repo");
			});

			const testLayer = MockGitServiceLayer();

			await runEffect(effect, testLayer);
		});
	});

	describe("listRemoteTags", () => {
		it("should return list of tags", async () => {
			const effect = Effect.gen(function* () {
				const git = yield* GitService;
				const tags = yield* git.listRemoteTags("https://github.com/test/repo.git");
				return tags;
			});

			const testLayer = MockGitServiceLayer({
				tags: ["v1.0.0", "v1.1.0", "v2.0.0"],
			});

			const tags = await runEffect(effect, testLayer);
			expect(tags).toEqual(["v1.0.0", "v1.1.0", "v2.0.0"]);
		});

		it("should return default tags when not specified", async () => {
			const effect = Effect.gen(function* () {
				const git = yield* GitService;
				const tags = yield* git.listRemoteTags("https://github.com/test/repo.git");
				return tags;
			});

			const testLayer = MockGitServiceLayer();

			const tags = await runEffect(effect, testLayer);
			expect(tags).toEqual(["v1.0.0", "v2.0.0"]);
		});
	});

	describe("Effect.fn usage", () => {
		it("should allow calling methods multiple times", async () => {
			const effect = Effect.gen(function* () {
				const git = yield* GitService;
				// Call checkAvailable multiple times
				yield* git.checkAvailable();
				yield* git.checkAvailable();
				// Call clone and checkout multiple times
				yield* git.clone("https://github.com/test/repo1.git", "/tmp/repo1");
				yield* git.clone("https://github.com/test/repo2.git", "/tmp/repo2");
				yield* git.checkout("v1.0.0", "/tmp/repo1");
				yield* git.checkout("v2.0.0", "/tmp/repo2");
				// Call listRemoteTags multiple times
				const tags1 = yield* git.listRemoteTags("https://github.com/test/repo1.git");
				const tags2 = yield* git.listRemoteTags("https://github.com/test/repo2.git");
				return { tags1, tags2 };
			});

			const testLayer = MockGitServiceLayer({
				tags: ["v1.0.0", "v2.0.0"],
			});

			const { tags1, tags2 } = await runEffect(effect, testLayer);
			expect(tags1).toEqual(["v1.0.0", "v2.0.0"]);
			expect(tags2).toEqual(["v1.0.0", "v2.0.0"]);
		});
	});
});
