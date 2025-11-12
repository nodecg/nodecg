import { describe, it, expect } from "vitest";
import { Effect, Option } from "effect";
import { setupCommand } from "../../src/commands/setup.js";
import { runEffect, createTestLayer } from "../helpers/test-runner.js";
import {
	MockNpmServiceLayer,
	MockHttpServiceLayer,
	MockFileSystemServiceLayer,
	MockTerminalServiceLayer,
	MockPathServiceLayer,
} from "../helpers/mock-services.js";

describe("setupCommand", () => {
	describe("fresh installation", () => {
		it("should install NodeCG when not already present", async () => {
			const effect = Effect.gen(function* () {
				const handler = setupCommand.handler;
				yield* handler({
					version: Option.none(),
					update: Option.none(),
					skipDependencies: Option.none(),
				});
			});

			const testLayer = createTestLayer(
				MockNpmServiceLayer({
					nodecg: ["1.0.0", "1.5.0", "2.0.0"],
				}),
				MockHttpServiceLayer(),
				MockFileSystemServiceLayer(),
				MockTerminalServiceLayer(),
				MockPathServiceLayer({ containsNodeCG: false }),
			);

			await runEffect(effect, testLayer);
		});

		it("should install specific version when version is provided", async () => {
			const effect = Effect.gen(function* () {
				const handler = setupCommand.handler;
				yield* handler({
					version: Option.some("^1.0.0"),
					update: Option.none(),
					skipDependencies: Option.none(),
				});
			});

			const testLayer = createTestLayer(
				MockNpmServiceLayer({
					nodecg: ["1.0.0", "1.5.0", "1.9.9", "2.0.0"],
				}),
				MockHttpServiceLayer(),
				MockFileSystemServiceLayer(),
				MockTerminalServiceLayer(),
				MockPathServiceLayer({ containsNodeCG: false }),
			);

			await runEffect(effect, testLayer);
		});

		it("should install latest version when no version specified", async () => {
			const effect = Effect.gen(function* () {
				const handler = setupCommand.handler;
				yield* handler({
					version: Option.none(),
					update: Option.none(),
					skipDependencies: Option.none(),
				});
			});

			const testLayer = createTestLayer(
				MockNpmServiceLayer({
					nodecg: ["1.0.0", "2.0.0", "3.0.0"],
				}),
				MockHttpServiceLayer(),
				MockFileSystemServiceLayer(),
				MockTerminalServiceLayer(),
				MockPathServiceLayer({ containsNodeCG: false }),
			);

			await runEffect(effect, testLayer);
		});
	});

	describe("updating existing installation", () => {
		it("should update NodeCG when -u flag is set", async () => {
			const effect = Effect.gen(function* () {
				const handler = setupCommand.handler;
				yield* handler({
					version: Option.some("2.0.0"),
					update: Option.some(true),
					skipDependencies: Option.none(),
				});
			});

			const testLayer = createTestLayer(
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
			);

			await runEffect(effect, testLayer);
		});

		it("should refuse to overwrite without -u flag", async () => {
			const effect = Effect.gen(function* () {
				const handler = setupCommand.handler;
				yield* handler({
					version: Option.none(),
					update: Option.none(),
					skipDependencies: Option.none(),
				});
			});

			const testLayer = createTestLayer(
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
			);

			await runEffect(effect, testLayer);
		});

		it("should not update when target version equals current version", async () => {
			const effect = Effect.gen(function* () {
				const handler = setupCommand.handler;
				yield* handler({
					version: Option.some("1.5.0"),
					update: Option.some(true),
					skipDependencies: Option.none(),
				});
			});

			const testLayer = createTestLayer(
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
			);

			await runEffect(effect, testLayer);
		});
	});

	describe("downgrading", () => {
		it("should prompt for confirmation when downgrading", async () => {
			const effect = Effect.gen(function* () {
				const handler = setupCommand.handler;
				yield* handler({
					version: Option.some("1.0.0"),
					update: Option.some(true),
					skipDependencies: Option.none(),
				});
			});

			const testLayer = createTestLayer(
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
			);

			await runEffect(effect, testLayer);
		});
	});

	describe("semver range matching", () => {
		it("should match ^1.0.0 to highest 1.x version", async () => {
			const effect = Effect.gen(function* () {
				const handler = setupCommand.handler;
				yield* handler({
					version: Option.some("^1.0.0"),
					update: Option.none(),
					skipDependencies: Option.none(),
				});
			});

			const testLayer = createTestLayer(
				MockNpmServiceLayer({
					nodecg: ["1.0.0", "1.5.0", "1.9.9", "2.0.0"],
				}),
				MockHttpServiceLayer(),
				MockFileSystemServiceLayer(),
				MockTerminalServiceLayer(),
				MockPathServiceLayer({ containsNodeCG: false }),
			);

			await runEffect(effect, testLayer);
		});

		it("should match ~1.5.0 to highest 1.5.x version", async () => {
			const effect = Effect.gen(function* () {
				const handler = setupCommand.handler;
				yield* handler({
					version: Option.some("~1.5.0"),
					update: Option.none(),
					skipDependencies: Option.none(),
				});
			});

			const testLayer = createTestLayer(
				MockNpmServiceLayer({
					nodecg: ["1.5.0", "1.5.1", "1.5.9", "1.6.0"],
				}),
				MockHttpServiceLayer(),
				MockFileSystemServiceLayer(),
				MockTerminalServiceLayer(),
				MockPathServiceLayer({ containsNodeCG: false }),
			);

			await runEffect(effect, testLayer);
		});

		it("should fail when no version matches semver range", async () => {
			const effect = Effect.gen(function* () {
				const handler = setupCommand.handler;
				yield* handler({
					version: Option.some("^5.0.0"),
					update: Option.none(),
					skipDependencies: Option.none(),
				});
			});

			const testLayer = createTestLayer(
				MockNpmServiceLayer({
					nodecg: ["1.0.0", "2.0.0", "3.0.0"],
				}),
				MockHttpServiceLayer(),
				MockFileSystemServiceLayer(),
				MockTerminalServiceLayer(),
				MockPathServiceLayer({ containsNodeCG: false }),
			);

			await runEffect(effect, testLayer);
		});
	});

	describe("skip dependencies flag", () => {
		it("should skip npm install when --skip-dependencies is set", async () => {
			const effect = Effect.gen(function* () {
				const handler = setupCommand.handler;
				yield* handler({
					version: Option.none(),
					update: Option.none(),
					skipDependencies: Option.some(true),
				});
			});

			const testLayer = createTestLayer(
				MockNpmServiceLayer({
					nodecg: ["1.0.0", "2.0.0"],
				}),
				MockHttpServiceLayer(),
				MockFileSystemServiceLayer(),
				MockTerminalServiceLayer(),
				MockPathServiceLayer({ containsNodeCG: false }),
			);

			await runEffect(effect, testLayer);
		});

		it("should install dependencies by default", async () => {
			const effect = Effect.gen(function* () {
				const handler = setupCommand.handler;
				yield* handler({
					version: Option.none(),
					update: Option.none(),
					skipDependencies: Option.none(),
				});
			});

			const testLayer = createTestLayer(
				MockNpmServiceLayer({
					nodecg: ["1.0.0", "2.0.0"],
				}),
				MockHttpServiceLayer(),
				MockFileSystemServiceLayer(),
				MockTerminalServiceLayer(),
				MockPathServiceLayer({ containsNodeCG: false }),
			);

			await runEffect(effect, testLayer);
		});
	});
});
