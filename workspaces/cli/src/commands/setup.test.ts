import { it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { describe } from "vitest";

import {
	MockFileSystemServiceLayer,
	MockHttpServiceLayer,
	MockNpmServiceLayer,
	MockPathServiceLayer,
	MockTerminalServiceLayer,
} from "../helpers/mock-services.js";
import { createTestLayer } from "../helpers/test-runner.js";
import { setupCommand } from "./setup.js";

describe("setupCommand", () => {
	describe("fresh installation", () => {
		it.effect("should install NodeCG when not already present", () =>
			Effect.gen(function* () {
				const handler = setupCommand.handler;
				yield* handler({
					version: Option.none(),
					update: Option.none(),
					skipDependencies: Option.none(),
				});
			}).pipe(
				Effect.provide(
					createTestLayer(
						MockNpmServiceLayer({
							nodecg: ["1.0.0", "1.5.0", "2.0.0"],
						}),
						MockHttpServiceLayer(),
						MockFileSystemServiceLayer(),
						MockTerminalServiceLayer(),
						MockPathServiceLayer({ containsNodeCG: false }),
					),
				),
			),
		);

		it.effect("should install specific version when version is provided", () =>
			Effect.gen(function* () {
				const handler = setupCommand.handler;
				yield* handler({
					version: Option.some("^1.0.0"),
					update: Option.none(),
					skipDependencies: Option.none(),
				});
			}).pipe(
				Effect.provide(
					createTestLayer(
						MockNpmServiceLayer({
							nodecg: ["1.0.0", "1.5.0", "1.9.9", "2.0.0"],
						}),
						MockHttpServiceLayer(),
						MockFileSystemServiceLayer(),
						MockTerminalServiceLayer(),
						MockPathServiceLayer({ containsNodeCG: false }),
					),
				),
			),
		);

		it.effect("should install latest version when no version specified", () =>
			Effect.gen(function* () {
				const handler = setupCommand.handler;
				yield* handler({
					version: Option.none(),
					update: Option.none(),
					skipDependencies: Option.none(),
				});
			}).pipe(
				Effect.provide(
					createTestLayer(
						MockNpmServiceLayer({
							nodecg: ["1.0.0", "2.0.0", "3.0.0"],
						}),
						MockHttpServiceLayer(),
						MockFileSystemServiceLayer(),
						MockTerminalServiceLayer(),
						MockPathServiceLayer({ containsNodeCG: false }),
					),
				),
			),
		);
	});

	describe("updating existing installation", () => {
		it.effect("should update NodeCG when -u flag is set", () =>
			Effect.gen(function* () {
				const handler = setupCommand.handler;
				yield* handler({
					version: Option.some("2.0.0"),
					update: Option.some(true),
					skipDependencies: Option.none(),
				});
			}).pipe(
				Effect.provide(
					createTestLayer(
						MockNpmServiceLayer({
							nodecg: ["1.0.0", "1.5.0", "2.0.0"],
						}),
						MockHttpServiceLayer(),
						MockFileSystemServiceLayer({
							[`${process.cwd()}/package.json`]: {
								name: "nodecg",
								version: "1.5.0",
							},
						}),
						MockTerminalServiceLayer(),
						MockPathServiceLayer({
							containsNodeCG: true,
							currentVersion: "1.5.0",
						}),
					),
				),
			),
		);

		it.effect("should refuse to overwrite without -u flag", () =>
			Effect.gen(function* () {
				const handler = setupCommand.handler;
				yield* handler({
					version: Option.none(),
					update: Option.none(),
					skipDependencies: Option.none(),
				});
			}).pipe(
				Effect.provide(
					createTestLayer(
						MockNpmServiceLayer({
							nodecg: ["1.0.0", "2.0.0"],
						}),
						MockHttpServiceLayer(),
						MockFileSystemServiceLayer({
							[`${process.cwd()}/package.json`]: {
								name: "nodecg",
								version: "1.0.0",
							},
						}),
						MockTerminalServiceLayer(),
						MockPathServiceLayer({ containsNodeCG: true }),
					),
				),
			),
		);

		it.effect(
			"should not update when target version equals current version",
			() =>
				Effect.gen(function* () {
					const handler = setupCommand.handler;
					yield* handler({
						version: Option.some("1.5.0"),
						update: Option.some(true),
						skipDependencies: Option.none(),
					});
				}).pipe(
					Effect.provide(
						createTestLayer(
							MockNpmServiceLayer({
								nodecg: ["1.0.0", "1.5.0", "2.0.0"],
							}),
							MockHttpServiceLayer(),
							MockFileSystemServiceLayer({
								[`${process.cwd()}/package.json`]: {
									name: "nodecg",
									version: "1.5.0",
								},
							}),
							MockTerminalServiceLayer(),
							MockPathServiceLayer({
								containsNodeCG: true,
								currentVersion: "1.5.0",
							}),
						),
					),
				),
		);
	});

	describe("downgrading", () => {
		it.effect("should prompt for confirmation when downgrading", () =>
			Effect.gen(function* () {
				const handler = setupCommand.handler;
				yield* handler({
					version: Option.some("1.0.0"),
					update: Option.some(true),
					skipDependencies: Option.none(),
				});
			}).pipe(
				Effect.provide(
					createTestLayer(
						MockNpmServiceLayer({
							nodecg: ["1.0.0", "2.0.0"],
						}),
						MockHttpServiceLayer(),
						MockFileSystemServiceLayer({
							[`${process.cwd()}/package.json`]: {
								name: "nodecg",
								version: "2.0.0",
							},
						}),
						MockTerminalServiceLayer(),
						MockPathServiceLayer({
							containsNodeCG: true,
							currentVersion: "2.0.0",
						}),
					),
				),
			),
		);
	});

	describe("semver range matching", () => {
		it.effect("should match ^1.0.0 to highest 1.x version", () =>
			Effect.gen(function* () {
				const handler = setupCommand.handler;
				yield* handler({
					version: Option.some("^1.0.0"),
					update: Option.none(),
					skipDependencies: Option.none(),
				});
			}).pipe(
				Effect.provide(
					createTestLayer(
						MockNpmServiceLayer({
							nodecg: ["1.0.0", "1.5.0", "1.9.9", "2.0.0"],
						}),
						MockHttpServiceLayer(),
						MockFileSystemServiceLayer(),
						MockTerminalServiceLayer(),
						MockPathServiceLayer({ containsNodeCG: false }),
					),
				),
			),
		);

		it.effect("should match ~1.5.0 to highest 1.5.x version", () =>
			Effect.gen(function* () {
				const handler = setupCommand.handler;
				yield* handler({
					version: Option.some("~1.5.0"),
					update: Option.none(),
					skipDependencies: Option.none(),
				});
			}).pipe(
				Effect.provide(
					createTestLayer(
						MockNpmServiceLayer({
							nodecg: ["1.5.0", "1.5.1", "1.5.9", "1.6.0"],
						}),
						MockHttpServiceLayer(),
						MockFileSystemServiceLayer(),
						MockTerminalServiceLayer(),
						MockPathServiceLayer({ containsNodeCG: false }),
					),
				),
			),
		);

		it.effect("should fail when no version matches semver range", () =>
			Effect.gen(function* () {
				const handler = setupCommand.handler;
				yield* handler({
					version: Option.some("^5.0.0"),
					update: Option.none(),
					skipDependencies: Option.none(),
				});
			}).pipe(
				Effect.provide(
					createTestLayer(
						MockNpmServiceLayer({
							nodecg: ["1.0.0", "2.0.0", "3.0.0"],
						}),
						MockHttpServiceLayer(),
						MockFileSystemServiceLayer(),
						MockTerminalServiceLayer(),
						MockPathServiceLayer({ containsNodeCG: false }),
					),
				),
			),
		);
	});

	describe("skip dependencies flag", () => {
		it.effect("should skip npm install when --skip-dependencies is set", () =>
			Effect.gen(function* () {
				const handler = setupCommand.handler;
				yield* handler({
					version: Option.none(),
					update: Option.none(),
					skipDependencies: Option.some(true),
				});
			}).pipe(
				Effect.provide(
					createTestLayer(
						MockNpmServiceLayer({
							nodecg: ["1.0.0", "2.0.0"],
						}),
						MockHttpServiceLayer(),
						MockFileSystemServiceLayer(),
						MockTerminalServiceLayer(),
						MockPathServiceLayer({ containsNodeCG: false }),
					),
				),
			),
		);

		it.effect("should install dependencies by default", () =>
			Effect.gen(function* () {
				const handler = setupCommand.handler;
				yield* handler({
					version: Option.none(),
					update: Option.none(),
					skipDependencies: Option.none(),
				});
			}).pipe(
				Effect.provide(
					createTestLayer(
						MockNpmServiceLayer({
							nodecg: ["1.0.0", "2.0.0"],
						}),
						MockHttpServiceLayer(),
						MockFileSystemServiceLayer(),
						MockTerminalServiceLayer(),
						MockPathServiceLayer({ containsNodeCG: false }),
					),
				),
			),
		);
	});
});
