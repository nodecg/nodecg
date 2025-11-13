import { it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { describe } from "vitest";

import {
	MockFileSystemServiceLayer,
	MockGitServiceLayer,
	MockNpmServiceLayer,
	MockPackageResolverServiceLayer,
	MockPathServiceLayer,
	MockTerminalServiceLayer,
} from "../helpers/mock-services.js";
import { createTestLayer } from "../helpers/test-runner.js";
import { installCommand } from "./install.js";

describe("installCommand", () => {
	describe("installing from GitHub repo", () => {
		it.effect("should install a bundle from a GitHub repository", () =>
			Effect.gen(function* () {
				const handler = installCommand.handler;
				yield* handler({
					repo: Option.some("test-org/test-bundle"),
					dev: Option.none(),
				});
			}).pipe(
				Effect.provide(
					createTestLayer(
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
						MockPathServiceLayer({
							nodecgPath: "/mock/nodecg",
							isBundle: true,
						}),
						MockPackageResolverServiceLayer(),
						MockNpmServiceLayer(),
					),
				),
			),
		);

		it.effect("should install a bundle with specific version range", () =>
			Effect.gen(function* () {
				const handler = installCommand.handler;
				yield* handler({
					repo: Option.some("test-org/test-bundle#^2.0.0"),
					dev: Option.none(),
				});
			}).pipe(
				Effect.provide(
					createTestLayer(
						MockGitServiceLayer({
							tags: ["v1.0.0", "v2.0.0", "v2.5.0", "v3.0.0"],
						}),
						MockFileSystemServiceLayer({
							"/mock/nodecg/bundles": {},
							"/mock/nodecg/bundles/test-bundle/package.json": {
								name: "test-bundle",
								version: "2.5.0",
								nodecg: { compatibleRange: "^1.0.0" },
							},
						}),
						MockTerminalServiceLayer(),
						MockPathServiceLayer({
							nodecgPath: "/mock/nodecg",
							isBundle: true,
						}),
						MockPackageResolverServiceLayer(),
						MockNpmServiceLayer(),
					),
				),
			),
		);

		it.effect("should create bundles directory if it does not exist", () =>
			Effect.gen(function* () {
				const handler = installCommand.handler;
				yield* handler({
					repo: Option.some("test-org/test-bundle"),
					dev: Option.none(),
				});
			}).pipe(
				Effect.provide(
					createTestLayer(
						MockGitServiceLayer({ tags: ["v1.0.0"] }),
						MockFileSystemServiceLayer({
							"/mock/nodecg/bundles/test-bundle/package.json": {
								name: "test-bundle",
								version: "1.0.0",
								nodecg: { compatibleRange: "^1.0.0" },
							},
						}),
						MockTerminalServiceLayer(),
						MockPathServiceLayer({
							nodecgPath: "/mock/nodecg",
							isBundle: true,
						}),
						MockPackageResolverServiceLayer(),
						MockNpmServiceLayer(),
					),
				),
			),
		);
	});

	describe("installing with --dev flag", () => {
		it.effect(
			"should install bundle with dev dependencies when --dev flag is set",
			() =>
				Effect.gen(function* () {
					const handler = installCommand.handler;
					yield* handler({
						repo: Option.some("test-org/test-bundle"),
						dev: Option.some(true),
					});
				}).pipe(
					Effect.provide(
						createTestLayer(
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
							MockPathServiceLayer({
								nodecgPath: "/mock/nodecg",
								isBundle: true,
							}),
							MockPackageResolverServiceLayer(),
							MockNpmServiceLayer(),
						),
					),
				),
		);

		it.effect("should install bundle without dev dependencies by default", () =>
			Effect.gen(function* () {
				const handler = installCommand.handler;
				yield* handler({
					repo: Option.some("test-org/test-bundle"),
					dev: Option.none(),
				});
			}).pipe(
				Effect.provide(
					createTestLayer(
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
						MockPathServiceLayer({
							nodecgPath: "/mock/nodecg",
							isBundle: true,
						}),
						MockPackageResolverServiceLayer(),
						MockNpmServiceLayer(),
					),
				),
			),
		);
	});

	describe("installing bundle dependencies without repo", () => {
		it.effect(
			"should install dependencies for current bundle when no repo is specified",
			() =>
				Effect.gen(function* () {
					const handler = installCommand.handler;
					yield* handler({
						repo: Option.none(),
						dev: Option.none(),
					});
				}).pipe(
					Effect.provide(
						createTestLayer(
							MockGitServiceLayer(),
							MockFileSystemServiceLayer({
								[`${process.cwd()}/package.json`]: {
									name: "current-bundle",
									version: "1.0.0",
									nodecg: { compatibleRange: "^1.0.0" },
								},
							}),
							MockTerminalServiceLayer(),
							MockPathServiceLayer({
								nodecgPath: "/mock/nodecg",
								isBundle: true,
							}),
							MockPackageResolverServiceLayer(),
							MockNpmServiceLayer(),
						),
					),
				),
		);

		it.effect(
			"should install dev dependencies when --dev is specified with no repo",
			() =>
				Effect.gen(function* () {
					const handler = installCommand.handler;
					yield* handler({
						repo: Option.none(),
						dev: Option.some(true),
					});
				}).pipe(
					Effect.provide(
						createTestLayer(
							MockGitServiceLayer(),
							MockFileSystemServiceLayer({
								[`${process.cwd()}/package.json`]: {
									name: "current-bundle",
									version: "1.0.0",
									nodecg: { compatibleRange: "^1.0.0" },
								},
							}),
							MockTerminalServiceLayer(),
							MockPathServiceLayer({
								nodecgPath: "/mock/nodecg",
								isBundle: true,
							}),
							MockPackageResolverServiceLayer(),
							MockNpmServiceLayer(),
						),
					),
				),
		);
	});

	describe("version selection", () => {
		it.effect(
			"should select the highest version matching the semver range",
			() =>
				Effect.gen(function* () {
					const handler = installCommand.handler;
					yield* handler({
						repo: Option.some("test-org/test-bundle#^1.0.0"),
						dev: Option.none(),
					});
				}).pipe(
					Effect.provide(
						createTestLayer(
							MockGitServiceLayer({
								tags: ["v1.0.0", "v1.5.0", "v1.9.9", "v2.0.0"],
							}),
							MockFileSystemServiceLayer({
								"/mock/nodecg/bundles": {},
								"/mock/nodecg/bundles/test-bundle/package.json": {
									name: "test-bundle",
									version: "1.9.9",
									nodecg: { compatibleRange: "^1.0.0" },
								},
							}),
							MockTerminalServiceLayer(),
							MockPathServiceLayer({
								nodecgPath: "/mock/nodecg",
								isBundle: true,
							}),
							MockPackageResolverServiceLayer(),
							MockNpmServiceLayer(),
						),
					),
				),
		);

		it.effect("should handle tags without 'v' prefix", () =>
			Effect.gen(function* () {
				const handler = installCommand.handler;
				yield* handler({
					repo: Option.some("test-org/test-bundle"),
					dev: Option.none(),
				});
			}).pipe(
				Effect.provide(
					createTestLayer(
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
						MockPathServiceLayer({
							nodecgPath: "/mock/nodecg",
							isBundle: true,
						}),
						MockPackageResolverServiceLayer(),
						MockNpmServiceLayer(),
					),
				),
			),
		);
	});
});
