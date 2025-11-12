import { describe, it, expect } from "vitest";
import { Effect, Option } from "effect";
import { installCommand } from "../../src/commands/install.js";
import { runEffect, createTestLayer } from "../helpers/test-runner.js";
import {
	MockGitServiceLayer,
	MockFileSystemServiceLayer,
	MockTerminalServiceLayer,
	MockPathServiceLayer,
	MockPackageResolverServiceLayer,
	MockNpmServiceLayer,
} from "../helpers/mock-services.js";

describe("installCommand", () => {
	describe("installing from GitHub repo", () => {
		it("should install a bundle from a GitHub repository", async () => {
			const effect = Effect.gen(function* () {
				const handler = installCommand.handler;
				yield* handler({
					repo: Option.some("test-org/test-bundle"),
					dev: Option.none(),
				});
			});

			const testLayer = createTestLayer(
				MockGitServiceLayer({ tags: ["v1.0.0", "v2.0.0", "v3.0.0"] }),
				MockFileSystemServiceLayer({
					"/mock/nodecg/bundles": {},
					"/mock/nodecg/bundles/test-bundle/package.json": {
						name: "test-bundle",
						version: "1.0.0",
						nodecg: { compatibleRange: "^1.0.0" },
					},
				}),
				MockTerminalServiceLayer(),
				MockPathServiceLayer({ nodecgPath: "/mock/nodecg", isBundle: true }),
				MockPackageResolverServiceLayer(),
				MockNpmServiceLayer(),
			);

			await runEffect(effect, testLayer);
		});

		it("should install a bundle with specific version range", async () => {
			const effect = Effect.gen(function* () {
				const handler = installCommand.handler;
				yield* handler({
					repo: Option.some("test-org/test-bundle#^2.0.0"),
					dev: Option.none(),
				});
			});

			const testLayer = createTestLayer(
				MockGitServiceLayer({ tags: ["v1.0.0", "v2.0.0", "v2.5.0", "v3.0.0"] }),
				MockFileSystemServiceLayer({
					"/mock/nodecg/bundles": {},
					"/mock/nodecg/bundles/test-bundle/package.json": {
						name: "test-bundle",
						version: "2.5.0",
						nodecg: { compatibleRange: "^1.0.0" },
					},
				}),
				MockTerminalServiceLayer(),
				MockPathServiceLayer({ nodecgPath: "/mock/nodecg", isBundle: true }),
				MockPackageResolverServiceLayer(),
				MockNpmServiceLayer(),
			);

			await runEffect(effect, testLayer);
		});

		it("should create bundles directory if it does not exist", async () => {
			const effect = Effect.gen(function* () {
				const handler = installCommand.handler;
				yield* handler({
					repo: Option.some("test-org/test-bundle"),
					dev: Option.none(),
				});
			});

			const testLayer = createTestLayer(
				MockGitServiceLayer({ tags: ["v1.0.0"] }),
				MockFileSystemServiceLayer({
					"/mock/nodecg/bundles/test-bundle/package.json": {
						name: "test-bundle",
						version: "1.0.0",
						nodecg: { compatibleRange: "^1.0.0" },
					},
				}),
				MockTerminalServiceLayer(),
				MockPathServiceLayer({ nodecgPath: "/mock/nodecg", isBundle: true }),
				MockPackageResolverServiceLayer(),
				MockNpmServiceLayer(),
			);

			await runEffect(effect, testLayer);
		});
	});

	describe("installing with --dev flag", () => {
		it("should install bundle with dev dependencies when --dev flag is set", async () => {
			const effect = Effect.gen(function* () {
				const handler = installCommand.handler;
				yield* handler({
					repo: Option.some("test-org/test-bundle"),
					dev: Option.some(true),
				});
			});

			const testLayer = createTestLayer(
				MockGitServiceLayer({ tags: ["v1.0.0"] }),
				MockFileSystemServiceLayer({
					"/mock/nodecg/bundles": {},
					"/mock/nodecg/bundles/test-bundle/package.json": {
						name: "test-bundle",
						version: "1.0.0",
						nodecg: { compatibleRange: "^1.0.0" },
					},
				}),
				MockTerminalServiceLayer(),
				MockPathServiceLayer({ nodecgPath: "/mock/nodecg", isBundle: true }),
				MockPackageResolverServiceLayer(),
				MockNpmServiceLayer(),
			);

			await runEffect(effect, testLayer);
		});

		it("should install bundle without dev dependencies by default", async () => {
			const effect = Effect.gen(function* () {
				const handler = installCommand.handler;
				yield* handler({
					repo: Option.some("test-org/test-bundle"),
					dev: Option.none(),
				});
			});

			const testLayer = createTestLayer(
				MockGitServiceLayer({ tags: ["v1.0.0"] }),
				MockFileSystemServiceLayer({
					"/mock/nodecg/bundles": {},
					"/mock/nodecg/bundles/test-bundle/package.json": {
						name: "test-bundle",
						version: "1.0.0",
						nodecg: { compatibleRange: "^1.0.0" },
					},
				}),
				MockTerminalServiceLayer(),
				MockPathServiceLayer({ nodecgPath: "/mock/nodecg", isBundle: true }),
				MockPackageResolverServiceLayer(),
				MockNpmServiceLayer(),
			);

			await runEffect(effect, testLayer);
		});
	});

	describe("installing bundle dependencies without repo", () => {
		it("should install dependencies for current bundle when no repo is specified", async () => {
			const effect = Effect.gen(function* () {
				const handler = installCommand.handler;
				yield* handler({
					repo: Option.none(),
					dev: Option.none(),
				});
			});

			const testLayer = createTestLayer(
				MockGitServiceLayer(),
				MockFileSystemServiceLayer({
					[`${process.cwd()}/package.json`]: {
						name: "current-bundle",
						version: "1.0.0",
						nodecg: { compatibleRange: "^1.0.0" },
					},
				}),
				MockTerminalServiceLayer(),
				MockPathServiceLayer({ nodecgPath: "/mock/nodecg", isBundle: true }),
				MockPackageResolverServiceLayer(),
				MockNpmServiceLayer(),
			);

			await runEffect(effect, testLayer);
		});

		it("should install dev dependencies when --dev is specified with no repo", async () => {
			const effect = Effect.gen(function* () {
				const handler = installCommand.handler;
				yield* handler({
					repo: Option.none(),
					dev: Option.some(true),
				});
			});

			const testLayer = createTestLayer(
				MockGitServiceLayer(),
				MockFileSystemServiceLayer({
					[`${process.cwd()}/package.json`]: {
						name: "current-bundle",
						version: "1.0.0",
						nodecg: { compatibleRange: "^1.0.0" },
					},
				}),
				MockTerminalServiceLayer(),
				MockPathServiceLayer({ nodecgPath: "/mock/nodecg", isBundle: true }),
				MockPackageResolverServiceLayer(),
				MockNpmServiceLayer(),
			);

			await runEffect(effect, testLayer);
		});
	});

	describe("version selection", () => {
		it("should select the highest version matching the semver range", async () => {
			const effect = Effect.gen(function* () {
				const handler = installCommand.handler;
				yield* handler({
					repo: Option.some("test-org/test-bundle#^1.0.0"),
					dev: Option.none(),
				});
			});

			const testLayer = createTestLayer(
				MockGitServiceLayer({ tags: ["v1.0.0", "v1.5.0", "v1.9.9", "v2.0.0"] }),
				MockFileSystemServiceLayer({
					"/mock/nodecg/bundles": {},
					"/mock/nodecg/bundles/test-bundle/package.json": {
						name: "test-bundle",
						version: "1.9.9",
						nodecg: { compatibleRange: "^1.0.0" },
					},
				}),
				MockTerminalServiceLayer(),
				MockPathServiceLayer({ nodecgPath: "/mock/nodecg", isBundle: true }),
				MockPackageResolverServiceLayer(),
				MockNpmServiceLayer(),
			);

			await runEffect(effect, testLayer);
		});

		it("should handle tags without 'v' prefix", async () => {
			const effect = Effect.gen(function* () {
				const handler = installCommand.handler;
				yield* handler({
					repo: Option.some("test-org/test-bundle"),
					dev: Option.none(),
				});
			});

			const testLayer = createTestLayer(
				MockGitServiceLayer({ tags: ["1.0.0", "2.0.0"] }),
				MockFileSystemServiceLayer({
					"/mock/nodecg/bundles": {},
					"/mock/nodecg/bundles/test-bundle/package.json": {
						name: "test-bundle",
						version: "2.0.0",
						nodecg: { compatibleRange: "^1.0.0" },
					},
				}),
				MockTerminalServiceLayer(),
				MockPathServiceLayer({ nodecgPath: "/mock/nodecg", isBundle: true }),
				MockPackageResolverServiceLayer(),
				MockNpmServiceLayer(),
			);

			await runEffect(effect, testLayer);
		});
	});
});
