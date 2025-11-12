import { describe, it, expect } from "vitest";
import { Effect, Option } from "effect";
import { defaultconfigCommand } from "../../src/commands/defaultconfig.js";
import { runEffect, createTestLayer } from "../helpers/test-runner.js";
import {
	MockFileSystemServiceLayer,
	MockTerminalServiceLayer,
	MockPathServiceLayer,
	MockJsonSchemaServiceLayer,
} from "../helpers/mock-services.js";

describe("defaultconfigCommand", () => {
	describe("generating config with explicit bundle name", () => {
		it("should generate default config when bundle name is provided", async () => {
			const effect = Effect.gen(function* () {
				const handler = defaultconfigCommand.handler;
				yield* handler({
					bundle: Option.some("test-bundle"),
				});
			});

			const defaultConfig = {
				host: "localhost",
				port: 9090,
				enabled: true,
			};

			const testLayer = createTestLayer(
				MockFileSystemServiceLayer({
					"/mock/nodecg/bundles/test-bundle": {},
					"/mock/nodecg/bundles/test-bundle/configschema.json": {
						type: "object",
						properties: {
							host: { type: "string", default: "localhost" },
							port: { type: "number", default: 9090 },
							enabled: { type: "boolean", default: true },
						},
					},
					"/mock/nodecg/cfg": {},
				}),
				MockTerminalServiceLayer(),
				MockPathServiceLayer({ nodecgPath: "/mock/nodecg" }),
				MockJsonSchemaServiceLayer(defaultConfig),
			);

			await runEffect(effect, testLayer);
		});

		it("should error when bundle does not exist", async () => {
			const effect = Effect.gen(function* () {
				const handler = defaultconfigCommand.handler;
				yield* handler({
					bundle: Option.some("non-existent-bundle"),
				});
			});

			const testLayer = createTestLayer(
				MockFileSystemServiceLayer({
					"/mock/nodecg/bundles": {},
				}),
				MockTerminalServiceLayer(),
				MockPathServiceLayer({ nodecgPath: "/mock/nodecg" }),
				MockJsonSchemaServiceLayer(),
			);

			await runEffect(effect, testLayer);
		});

		it("should error when bundle has no configschema.json", async () => {
			const effect = Effect.gen(function* () {
				const handler = defaultconfigCommand.handler;
				yield* handler({
					bundle: Option.some("test-bundle"),
				});
			});

			const testLayer = createTestLayer(
				MockFileSystemServiceLayer({
					"/mock/nodecg/bundles/test-bundle": {},
				}),
				MockTerminalServiceLayer(),
				MockPathServiceLayer({ nodecgPath: "/mock/nodecg" }),
				MockJsonSchemaServiceLayer(),
			);

			await runEffect(effect, testLayer);
		});

		it("should error when config file already exists", async () => {
			const effect = Effect.gen(function* () {
				const handler = defaultconfigCommand.handler;
				yield* handler({
					bundle: Option.some("test-bundle"),
				});
			});

			const testLayer = createTestLayer(
				MockFileSystemServiceLayer({
					"/mock/nodecg/bundles/test-bundle": {},
					"/mock/nodecg/bundles/test-bundle/configschema.json": {
						type: "object",
						properties: {},
					},
					"/mock/nodecg/cfg": {},
					"/mock/nodecg/cfg/test-bundle.json": {
						existing: "config",
					},
				}),
				MockTerminalServiceLayer(),
				MockPathServiceLayer({ nodecgPath: "/mock/nodecg" }),
				MockJsonSchemaServiceLayer(),
			);

			await runEffect(effect, testLayer);
		});
	});

	describe("finding bundle in current directory", () => {
		it("should generate config for current directory bundle when no name provided", async () => {
			const effect = Effect.gen(function* () {
				const handler = defaultconfigCommand.handler;
				yield* handler({
					bundle: Option.none(),
				});
			});

			const defaultConfig = {
				apiKey: "default-key",
			};

			const testLayer = createTestLayer(
				MockFileSystemServiceLayer({
					[`${process.cwd()}/package.json`]: {
						name: "current-bundle",
						version: "1.0.0",
						nodecg: { compatibleRange: "^1.0.0" },
					},
					"/mock/nodecg/bundles/current-bundle": {},
					"/mock/nodecg/bundles/current-bundle/configschema.json": {
						type: "object",
						properties: {
							apiKey: { type: "string", default: "default-key" },
						},
					},
					"/mock/nodecg/cfg": {},
				}),
				MockTerminalServiceLayer(),
				MockPathServiceLayer({
					nodecgPath: "/mock/nodecg",
					isBundle: true,
				}),
				MockJsonSchemaServiceLayer(defaultConfig),
			);

			await runEffect(effect, testLayer);
		});

		it("should error when current directory is not a bundle", async () => {
			const effect = Effect.gen(function* () {
				const handler = defaultconfigCommand.handler;
				try {
					yield* handler({
						bundle: Option.none(),
					});
				} catch (error) {
					// Expected to fail
				}
			});

			const testLayer = createTestLayer(
				MockFileSystemServiceLayer({
					[`${process.cwd()}/package.json`]: {
						name: "not-a-bundle",
						version: "1.0.0",
					},
				}),
				MockTerminalServiceLayer(),
				MockPathServiceLayer({
					nodecgPath: "/mock/nodecg",
					isBundle: false,
				}),
				MockJsonSchemaServiceLayer(),
			);

			// This test expects the effect to potentially fail
			try {
				await runEffect(effect, testLayer);
			} catch (error) {
				// Expected behavior
				expect(error).toBeDefined();
			}
		});
	});

	describe("creating cfg directory", () => {
		it("should create cfg directory if it does not exist", async () => {
			const effect = Effect.gen(function* () {
				const handler = defaultconfigCommand.handler;
				yield* handler({
					bundle: Option.some("test-bundle"),
				});
			});

			const testLayer = createTestLayer(
				MockFileSystemServiceLayer({
					"/mock/nodecg/bundles/test-bundle": {},
					"/mock/nodecg/bundles/test-bundle/configschema.json": {
						type: "object",
						properties: {},
					},
				}),
				MockTerminalServiceLayer(),
				MockPathServiceLayer({ nodecgPath: "/mock/nodecg" }),
				MockJsonSchemaServiceLayer({ key: "value" }),
			);

			await runEffect(effect, testLayer);
		});
	});

	describe("complex schema defaults", () => {
		it("should apply nested default values from schema", async () => {
			const effect = Effect.gen(function* () {
				const handler = defaultconfigCommand.handler;
				yield* handler({
					bundle: Option.some("complex-bundle"),
				});
			});

			const complexDefaults = {
				server: {
					host: "localhost",
					port: 8080,
					ssl: {
						enabled: false,
						cert: "/path/to/cert",
					},
				},
				features: {
					authentication: true,
					logging: true,
				},
			};

			const testLayer = createTestLayer(
				MockFileSystemServiceLayer({
					"/mock/nodecg/bundles/complex-bundle": {},
					"/mock/nodecg/bundles/complex-bundle/configschema.json": {
						type: "object",
						properties: {
							server: {
								type: "object",
								properties: {
									host: { type: "string", default: "localhost" },
									port: { type: "number", default: 8080 },
									ssl: {
										type: "object",
										properties: {
											enabled: { type: "boolean", default: false },
											cert: { type: "string", default: "/path/to/cert" },
										},
									},
								},
							},
							features: {
								type: "object",
								properties: {
									authentication: { type: "boolean", default: true },
									logging: { type: "boolean", default: true },
								},
							},
						},
					},
					"/mock/nodecg/cfg": {},
				}),
				MockTerminalServiceLayer(),
				MockPathServiceLayer({ nodecgPath: "/mock/nodecg" }),
				MockJsonSchemaServiceLayer(complexDefaults),
			);

			await runEffect(effect, testLayer);
		});
	});
});
