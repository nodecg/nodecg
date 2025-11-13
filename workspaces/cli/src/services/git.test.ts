import { it } from "@effect/vitest";
import { Effect } from "effect";
import { describe, expect } from "vitest";

import { MockGitServiceLayer } from "../helpers/mock-services.js";
import { GitService } from "./git.js";

describe("GitService", () => {
	describe("checkAvailable", () => {
		it.effect("should succeed when git is available", () =>
			Effect.gen(function* () {
				const git = yield* GitService;
				yield* git.checkAvailable();
			}).pipe(Effect.provide(MockGitServiceLayer())),
		);
	});

	describe("clone", () => {
		it.effect("should execute git clone command", () =>
			Effect.gen(function* () {
				const git = yield* GitService;
				yield* git.clone("https://github.com/test/repo.git", "/tmp/test-repo");
			}).pipe(Effect.provide(MockGitServiceLayer())),
		);
	});

	describe("checkout", () => {
		it.effect("should execute git checkout command", () =>
			Effect.gen(function* () {
				const git = yield* GitService;
				yield* git.checkout("v1.0.0", "/tmp/test-repo");
			}).pipe(Effect.provide(MockGitServiceLayer())),
		);
	});

	describe("listRemoteTags", () => {
		it.effect("should return list of tags", () =>
			Effect.gen(function* () {
				const git = yield* GitService;
				const tags = yield* git.listRemoteTags(
					"https://github.com/test/repo.git",
				);
				expect(tags).toEqual(["v1.0.0", "v1.1.0", "v2.0.0"]);
			}).pipe(
				Effect.provide(
					MockGitServiceLayer({
						tags: ["v1.0.0", "v1.1.0", "v2.0.0"],
					}),
				),
			),
		);

		it.effect("should return default tags when not specified", () =>
			Effect.gen(function* () {
				const git = yield* GitService;
				const tags = yield* git.listRemoteTags(
					"https://github.com/test/repo.git",
				);
				expect(tags).toEqual(["v1.0.0", "v2.0.0"]);
			}).pipe(Effect.provide(MockGitServiceLayer())),
		);
	});

	describe("Effect.fn usage", () => {
		it.effect("should allow calling methods multiple times", () =>
			Effect.gen(function* () {
				const git = yield* GitService;
				yield* git.checkAvailable();
				yield* git.checkAvailable();
				yield* git.clone("https://github.com/test/repo1.git", "/tmp/repo1");
				yield* git.clone("https://github.com/test/repo2.git", "/tmp/repo2");
				yield* git.checkout("v1.0.0", "/tmp/repo1");
				yield* git.checkout("v2.0.0", "/tmp/repo2");
				const tags1 = yield* git.listRemoteTags(
					"https://github.com/test/repo1.git",
				);
				const tags2 = yield* git.listRemoteTags(
					"https://github.com/test/repo2.git",
				);
				expect(tags1).toEqual(["v1.0.0", "v2.0.0"]);
				expect(tags2).toEqual(["v1.0.0", "v2.0.0"]);
			}).pipe(
				Effect.provide(
					MockGitServiceLayer({
						tags: ["v1.0.0", "v2.0.0"],
					}),
				),
			),
		);
	});
});
