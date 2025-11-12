import { describe, it, expect } from "vitest";
import { Effect } from "effect";
import { NpmService, NpmError } from "../../src/services/npm.js";
import { runEffect } from "../helpers/test-runner.js";
import { MockNpmServiceLayer } from "../helpers/mock-services.js";

describe("NpmService", () => {
	describe("listVersions", () => {
		it("should return list of versions for a package", async () => {
			const effect = Effect.gen(function* () {
				const npm = yield* NpmService;
				const versions = yield* npm.listVersions("test-package");
				return versions;
			});

			const testLayer = MockNpmServiceLayer({
				"test-package": ["1.0.0", "1.1.0", "2.0.0", "2.1.0"],
			});

			const versions = await runEffect(effect, testLayer);
			expect(versions).toEqual(["1.0.0", "1.1.0", "2.0.0", "2.1.0"]);
		});

		it("should return default versions when package not in mock", async () => {
			const effect = Effect.gen(function* () {
				const npm = yield* NpmService;
				const versions = yield* npm.listVersions("unknown-package");
				return versions;
			});

			const testLayer = MockNpmServiceLayer();

			const versions = await runEffect(effect, testLayer);
			expect(versions).toEqual(["1.0.0", "2.0.0"]);
		});

		it("should handle multiple packages", async () => {
			const effect = Effect.gen(function* () {
				const npm = yield* NpmService;
				const versions1 = yield* npm.listVersions("package-a");
				const versions2 = yield* npm.listVersions("package-b");
				return { versions1, versions2 };
			});

			const testLayer = MockNpmServiceLayer({
				"package-a": ["1.0.0", "2.0.0", "3.0.0"],
				"package-b": ["0.1.0", "0.2.0"],
			});

			const { versions1, versions2 } = await runEffect(effect, testLayer);
			expect(versions1).toEqual(["1.0.0", "2.0.0", "3.0.0"]);
			expect(versions2).toEqual(["0.1.0", "0.2.0"]);
		});
	});

	describe("getRelease", () => {
		it("should return package release information", async () => {
			const effect = Effect.gen(function* () {
				const npm = yield* NpmService;
				const release = yield* npm.getRelease("test-package", "1.0.0");
				return release;
			});

			const testLayer = MockNpmServiceLayer();

			const release = await runEffect(effect, testLayer);
			expect(release.version).toBe("1.0.0");
			expect(release.dist.tarball).toBe("https://registry.npmjs.org/pkg/-/pkg-1.0.0.tgz");
		});

		it("should return release for different versions", async () => {
			const effect = Effect.gen(function* () {
				const npm = yield* NpmService;
				const release1 = yield* npm.getRelease("test-package", "1.0.0");
				const release2 = yield* npm.getRelease("test-package", "2.0.0");
				return { release1, release2 };
			});

			const testLayer = MockNpmServiceLayer();

			const { release1, release2 } = await runEffect(effect, testLayer);
			expect(release1.version).toBe("1.0.0");
			expect(release2.version).toBe("2.0.0");
			expect(release1.dist.tarball).toContain("1.0.0");
			expect(release2.dist.tarball).toContain("2.0.0");
		});

		it("should handle different package names", async () => {
			const effect = Effect.gen(function* () {
				const npm = yield* NpmService;
				const release1 = yield* npm.getRelease("package-a", "1.0.0");
				const release2 = yield* npm.getRelease("package-b", "2.0.0");
				return { release1, release2 };
			});

			const testLayer = MockNpmServiceLayer();

			const { release1, release2 } = await runEffect(effect, testLayer);
			expect(release1.version).toBe("1.0.0");
			expect(release2.version).toBe("2.0.0");
		});
	});

	describe("install", () => {
		it("should install npm dependencies", async () => {
			const effect = Effect.gen(function* () {
				const npm = yield* NpmService;
				yield* npm.install("/test/project", false);
			});

			const testLayer = MockNpmServiceLayer();
			await runEffect(effect, testLayer);
		});

		it("should install production dependencies only", async () => {
			const effect = Effect.gen(function* () {
				const npm = yield* NpmService;
				yield* npm.install("/test/project", true);
			});

			const testLayer = MockNpmServiceLayer();
			await runEffect(effect, testLayer);
		});

		it("should handle multiple install calls", async () => {
			const effect = Effect.gen(function* () {
				const npm = yield* NpmService;
				yield* npm.install("/test/project1", false);
				yield* npm.install("/test/project2", true);
			});

			const testLayer = MockNpmServiceLayer();
			await runEffect(effect, testLayer);
		});
	});

	describe("yarnInstall", () => {
		it("should install yarn dependencies", async () => {
			const effect = Effect.gen(function* () {
				const npm = yield* NpmService;
				yield* npm.yarnInstall("/test/project", false);
			});

			const testLayer = MockNpmServiceLayer();
			await runEffect(effect, testLayer);
		});

		it("should install production dependencies only", async () => {
			const effect = Effect.gen(function* () {
				const npm = yield* NpmService;
				yield* npm.yarnInstall("/test/project", true);
			});

			const testLayer = MockNpmServiceLayer();
			await runEffect(effect, testLayer);
		});

		it("should handle multiple yarn install calls", async () => {
			const effect = Effect.gen(function* () {
				const npm = yield* NpmService;
				yield* npm.yarnInstall("/test/project1", false);
				yield* npm.yarnInstall("/test/project2", true);
			});

			const testLayer = MockNpmServiceLayer();
			await runEffect(effect, testLayer);
		});
	});

	describe("Effect.fn usage", () => {
		it("should allow calling methods multiple times", async () => {
			const effect = Effect.gen(function* () {
				const npm = yield* NpmService;

				// Call listVersions multiple times
				const versions1 = yield* npm.listVersions("package-a");
				const versions2 = yield* npm.listVersions("package-b");
				const versions3 = yield* npm.listVersions("package-c");

				// Call getRelease multiple times
				const release1 = yield* npm.getRelease("test-package", "1.0.0");
				const release2 = yield* npm.getRelease("test-package", "2.0.0");

				// Call install methods multiple times
				yield* npm.install("/test/project1", false);
				yield* npm.install("/test/project2", true);
				yield* npm.yarnInstall("/test/project3", false);

				return {
					versions1,
					versions2,
					versions3,
					release1,
					release2,
				};
			});

			const testLayer = MockNpmServiceLayer({
				"package-a": ["1.0.0", "2.0.0"],
				"package-b": ["3.0.0", "4.0.0"],
				"package-c": ["5.0.0", "6.0.0"],
			});

			const result = await runEffect(effect, testLayer);
			expect(result.versions1).toEqual(["1.0.0", "2.0.0"]);
			expect(result.versions2).toEqual(["3.0.0", "4.0.0"]);
			expect(result.versions3).toEqual(["5.0.0", "6.0.0"]);
			expect(result.release1.version).toBe("1.0.0");
			expect(result.release2.version).toBe("2.0.0");
		});
	});
});
