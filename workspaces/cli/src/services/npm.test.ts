import { it } from "@effect/vitest";
import { Effect } from "effect";
import { describe, expect } from "vitest";

import { MockNpmServiceLayer } from "../helpers/mock-services.js";
import { NpmService } from "./npm.js";

describe("NpmService", () => {
	describe("listVersions", () => {
		it.effect("should return list of versions for a package", () =>
			Effect.gen(function* () {
				const npm = yield* NpmService;
				const versions = yield* npm.listVersions("test-package");
				expect(versions).toEqual(["1.0.0", "1.1.0", "2.0.0", "2.1.0"]);
			}).pipe(
				Effect.provide(
					MockNpmServiceLayer({
						"test-package": ["1.0.0", "1.1.0", "2.0.0", "2.1.0"],
					}),
				),
			),
		);

		it.effect("should return default versions when package not in mock", () =>
			Effect.gen(function* () {
				const npm = yield* NpmService;
				const versions = yield* npm.listVersions("unknown-package");
				expect(versions).toEqual(["1.0.0", "2.0.0"]);
			}).pipe(Effect.provide(MockNpmServiceLayer())),
		);

		it.effect("should handle multiple packages", () =>
			Effect.gen(function* () {
				const npm = yield* NpmService;
				const versions1 = yield* npm.listVersions("package-a");
				const versions2 = yield* npm.listVersions("package-b");
				expect(versions1).toEqual(["1.0.0", "2.0.0", "3.0.0"]);
				expect(versions2).toEqual(["0.1.0", "0.2.0"]);
			}).pipe(
				Effect.provide(
					MockNpmServiceLayer({
						"package-a": ["1.0.0", "2.0.0", "3.0.0"],
						"package-b": ["0.1.0", "0.2.0"],
					}),
				),
			),
		);
	});

	describe("getRelease", () => {
		it.effect("should return package release information", () =>
			Effect.gen(function* () {
				const npm = yield* NpmService;
				const release = yield* npm.getRelease("test-package", "1.0.0");
				expect(release.dist.tarball).toBe(
					"https://registry.npmjs.org/pkg/-/pkg-1.0.0.tgz",
				);
			}).pipe(Effect.provide(MockNpmServiceLayer())),
		);

		it.effect("should return release for different versions", () =>
			Effect.gen(function* () {
				const npm = yield* NpmService;
				const release1 = yield* npm.getRelease("test-package", "1.0.0");
				const release2 = yield* npm.getRelease("test-package", "2.0.0");
				expect(release1.dist.tarball).toContain("1.0.0");
				expect(release2.dist.tarball).toContain("2.0.0");
			}).pipe(Effect.provide(MockNpmServiceLayer())),
		);

		it.effect("should handle different package names", () =>
			Effect.gen(function* () {
				const npm = yield* NpmService;
				const release1 = yield* npm.getRelease("package-a", "1.0.0");
				const release2 = yield* npm.getRelease("package-b", "2.0.0");
				expect(release1.dist.tarball).toContain("pkg-1.0.0.tgz");
				expect(release2.dist.tarball).toContain("pkg-2.0.0.tgz");
			}).pipe(Effect.provide(MockNpmServiceLayer())),
		);
	});

	describe("install", () => {
		it.effect("should install npm dependencies", () =>
			Effect.gen(function* () {
				const npm = yield* NpmService;
				yield* npm.install("/test/project", false);
			}).pipe(Effect.provide(MockNpmServiceLayer())),
		);

		it.effect("should install production dependencies only", () =>
			Effect.gen(function* () {
				const npm = yield* NpmService;
				yield* npm.install("/test/project", true);
			}).pipe(Effect.provide(MockNpmServiceLayer())),
		);

		it.effect("should handle multiple install calls", () =>
			Effect.gen(function* () {
				const npm = yield* NpmService;
				yield* npm.install("/test/project1", false);
				yield* npm.install("/test/project2", true);
			}).pipe(Effect.provide(MockNpmServiceLayer())),
		);
	});

	describe("yarnInstall", () => {
		it.effect("should install yarn dependencies", () =>
			Effect.gen(function* () {
				const npm = yield* NpmService;
				yield* npm.yarnInstall("/test/project", false);
			}).pipe(Effect.provide(MockNpmServiceLayer())),
		);

		it.effect("should install production dependencies only", () =>
			Effect.gen(function* () {
				const npm = yield* NpmService;
				yield* npm.yarnInstall("/test/project", true);
			}).pipe(Effect.provide(MockNpmServiceLayer())),
		);

		it.effect("should handle multiple yarn install calls", () =>
			Effect.gen(function* () {
				const npm = yield* NpmService;
				yield* npm.yarnInstall("/test/project1", false);
				yield* npm.yarnInstall("/test/project2", true);
			}).pipe(Effect.provide(MockNpmServiceLayer())),
		);
	});

	describe("Effect.fn usage", () => {
		it.effect("should allow calling methods multiple times", () =>
			Effect.gen(function* () {
				const npm = yield* NpmService;

				const versions1 = yield* npm.listVersions("package-a");
				const versions2 = yield* npm.listVersions("package-b");
				const versions3 = yield* npm.listVersions("package-c");

				const release1 = yield* npm.getRelease("test-package", "1.0.0");
				const release2 = yield* npm.getRelease("test-package", "2.0.0");

				yield* npm.install("/test/project1", false);
				yield* npm.install("/test/project2", true);
				yield* npm.yarnInstall("/test/project3", false);

				expect(versions1).toEqual(["1.0.0", "2.0.0"]);
				expect(versions2).toEqual(["3.0.0", "4.0.0"]);
				expect(versions3).toEqual(["5.0.0", "6.0.0"]);
				expect(release1.dist.tarball).toContain("1.0.0");
				expect(release2.dist.tarball).toContain("2.0.0");
			}).pipe(
				Effect.provide(
					MockNpmServiceLayer({
						"package-a": ["1.0.0", "2.0.0"],
						"package-b": ["3.0.0", "4.0.0"],
						"package-c": ["5.0.0", "6.0.0"],
					}),
				),
			),
		);
	});
});
